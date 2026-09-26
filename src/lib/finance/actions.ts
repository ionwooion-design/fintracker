import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { num, todayISO } from "@/lib/utils";
import { ACHIEVEMENT_DEFS, DEFAULT_CATEGORIES, DEFAULT_ENVELOPES } from "./defaults";
import { calcDailyLimit, calcCurrentBalance, nextStreak } from "./calc";
import { matchRule, parseSmsText } from "./sms";
import type {
  Achievement,
  Category,
  CurrencyCode,
  Envelope,
  FinanceSnapshot,
  FixedEvent,
  Transaction,
  UserSettings,
} from "./types";

const VALID_CURRENCIES = new Set([
  "RUB",
  "USD",
  "EUR",
  "GBP",
  "KZT",
  "BYN",
  "UAH",
  "CNY",
]);

function mapCurrency(raw: unknown): CurrencyCode {
  const code = String(raw ?? "RUB").toUpperCase();
  return (VALID_CURRENCIES.has(code) ? code : "RUB") as CurrencyCode;
}

function mapSettings(row: Record<string, unknown>, userId: string): UserSettings {
  return {
    userId,
    userName: String(row.user_name ?? ""),
    startDate: String(row.start_date),
    initialBalance: num(row.initial_balance as string | number),
    endDate: String(row.end_date),
    finalTarget: num(row.final_target as string | number),
    currentStreak: num(row.current_streak as string | number),
    lastStreakDate: row.last_streak_date ? String(row.last_streak_date) : null,
    lastBudgetDay: row.last_budget_day ? String(row.last_budget_day) : null,
    privacyAccepted: Boolean(row.privacy_accepted),
    darkTheme: Boolean(row.dark_theme),
    currency: mapCurrency(row.currency),
  };
}

async function ensureSeeded(userId: string, displayName?: string | null) {
  const sql = await getSql();
  const existing = await sql`select user_id from user_settings where user_id = ${userId}`;
  if (existing.length) return;

  const today = todayISO();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  const endDate = todayISO(end);

  await sql`
    insert into user_settings (user_id, user_name, start_date, initial_balance, end_date, final_target)
    values (${userId}, ${displayName ?? ""}, ${today}, 50000, ${endDate}, 10000)
  `;

  for (const c of DEFAULT_CATEGORIES) {
    await sql`
      insert into categories (user_id, name, color, icon)
      values (${userId}, ${c.name}, ${c.color}, ${c.icon})
      on conflict (user_id, name) do nothing
    `;
  }
  for (const e of DEFAULT_ENVELOPES) {
    await sql`
      insert into envelopes (user_id, name, budget, color, icon)
      values (${userId}, ${e.name}, ${e.budget}, ${e.color}, ${e.icon})
      on conflict (user_id, name) do nothing
    `;
  }

  const cats = await sql<{ id: number; name: string }>`
    select id, name from categories where user_id = ${userId}
  `;
  const food = cats.find((c) => c.name === "Еда");
  const transport = cats.find((c) => c.name === "Транспорт");
  if (food) {
    await sql`insert into categorization_rules (user_id, pattern, category_id) values (${userId}, ${"пятерочк"}, ${food.id})`;
    await sql`insert into categorization_rules (user_id, pattern, category_id) values (${userId}, ${"магнит"}, ${food.id})`;
  }
  if (transport) {
    await sql`insert into categorization_rules (user_id, pattern, category_id) values (${userId}, ${"яндекс.такси"}, ${transport.id})`;
    await sql`insert into categorization_rules (user_id, pattern, category_id) values (${userId}, ${"метро"}, ${transport.id})`;
  }
}

async function loadSnapshot(userId: string): Promise<FinanceSnapshot> {
  const sql = await getSql();
  const [settingsRow] = await sql<Record<string, unknown>>`
    select * from user_settings where user_id = ${userId}
  `;
  const categories = await sql<{ id: number; name: string; color: string; icon: string }>`
    select id, name, color, icon from categories where user_id = ${userId} order by name
  `;
  const envelopes = await sql<{
    id: number;
    name: string;
    budget: string | number;
    color: string;
    icon: string;
  }>`
    select id, name, budget, color, icon from envelopes where user_id = ${userId} order by name
  `;
  const transactions = await sql<{
    id: number;
    amount: string | number;
    type: string;
    description: string;
    transaction_date: string;
    category_id: number | null;
    envelope_id: number | null;
  }>`
    select id, amount, type, description, transaction_date, category_id, envelope_id
    from transactions where user_id = ${userId}
    order by transaction_date desc, id desc
  `;
  const fixedEvents = await sql<{
    id: number;
    amount: string | number;
    description: string;
    event_date: string;
  }>`
    select id, amount, description, event_date from fixed_events
    where user_id = ${userId} order by event_date
  `;
  const achievements = await sql<{
    id: number;
    code: string;
    name: string;
    description: string;
    icon: string;
    unlocked_at: string;
  }>`
    select id, code, name, description, icon, unlocked_at from achievements
    where user_id = ${userId} order by unlocked_at desc
  `;

  return {
    settings: mapSettings(settingsRow, userId),
    categories: categories as Category[],
    envelopes: envelopes.map((e) => ({
      id: e.id,
      name: e.name,
      budget: num(e.budget),
      color: e.color,
      icon: e.icon,
    })) as Envelope[],
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: num(t.amount),
      type: t.type as Transaction["type"],
      description: t.description,
      transactionDate: String(t.transaction_date),
      categoryId: t.category_id,
      envelopeId: t.envelope_id,
    })),
    fixedEvents: fixedEvents.map((e) => ({
      id: e.id,
      amount: num(e.amount),
      description: e.description,
      eventDate: String(e.event_date),
    })) as FixedEvent[],
    achievements: achievements.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      description: a.description,
      icon: a.icon,
      unlockedAt: String(a.unlocked_at),
    })) as Achievement[],
  };
}

async function unlockAchievements(userId: string, streak: number, txCount: number) {
  const sql = await getSql();
  for (const def of ACHIEVEMENT_DEFS) {
    if (def.code === "first_step" && txCount < 1) continue;
    if (def.minStreak > 0 && streak < def.minStreak) continue;
    if (def.code === "first_step" && txCount < 1) continue;
    await sql`
      insert into achievements (user_id, code, name, description, icon)
      values (${userId}, ${def.code}, ${def.name}, ${def.description}, ${def.icon})
      on conflict (user_id, code) do nothing
    `;
  }
}

async function refreshStreak(userId: string) {
  const snap = await loadSnapshot(userId);
  const today = todayISO();
  const spentToday = snap.transactions
    .filter((t) => t.transactionDate === today && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = calcCurrentBalance(
    snap.settings.initialBalance,
    snap.transactions,
    snap.fixedEvents,
    today,
  );
  const daysRemaining = Math.max(
    0,
    Math.round(
      (new Date(`${snap.settings.endDate}T12:00:00`).getTime() -
        new Date(`${today}T12:00:00`).getTime()) /
        86400000,
    ),
  );
  const dailyLimit = calcDailyLimit(
    balance,
    snap.settings.finalTarget,
    snap.fixedEvents,
    daysRemaining,
    today,
  );
  const next = nextStreak(
    snap.settings.currentStreak,
    snap.settings.lastBudgetDay,
    spentToday,
    dailyLimit,
    today,
  );
  const sql = await getSql();
  await sql`
    update user_settings
    set current_streak = ${next.streak},
        last_budget_day = ${next.lastBudgetDay},
        last_streak_date = ${today},
        updated_at = now()
    where user_id = ${userId}
  `;
  await unlockAchievements(userId, next.streak, snap.transactions.length);
}

export const getFinanceData = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    return loadSnapshot(context.userId);
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      userName: string;
      startDate: string;
      initialBalance: number;
      endDate: string;
      finalTarget: number;
      darkTheme: boolean;
      privacyAccepted?: boolean;
      currency?: CurrencyCode;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const currency = mapCurrency(data.currency ?? "RUB");
    await sql`
      update user_settings
      set user_name = ${data.userName},
          start_date = ${data.startDate},
          initial_balance = ${data.initialBalance},
          end_date = ${data.endDate},
          final_target = ${data.finalTarget},
          dark_theme = ${data.darkTheme},
          privacy_accepted = coalesce(${data.privacyAccepted ?? null}, privacy_accepted),
          currency = ${currency},
          updated_at = now()
      where user_id = ${context.userId}
    `;
    await refreshStreak(context.userId);
    return loadSnapshot(context.userId);
  });

export const addTransaction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      amount: number;
      type: "income" | "expense";
      description: string;
      transactionDate: string;
      categoryId: number | null;
      envelopeId: number | null;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    if (data.amount <= 0) throw new Error("Сумма должна быть больше нуля");
    const sql = await getSql();
    await sql`
      insert into transactions (user_id, amount, type, description, transaction_date, category_id, envelope_id)
      values (
        ${context.userId},
        ${data.amount},
        ${data.type},
        ${data.description.trim() || "Без названия"},
        ${data.transactionDate},
        ${data.categoryId},
        ${data.envelopeId}
      )
    `;
    await refreshStreak(context.userId);
    return loadSnapshot(context.userId);
  });

export const updateTransaction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      id: number;
      amount: number;
      description: string;
      transactionDate: string;
      categoryId: number | null;
      envelopeId: number | null;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update transactions
      set amount = ${data.amount},
          description = ${data.description.trim() || "Без названия"},
          transaction_date = ${data.transactionDate},
          category_id = ${data.categoryId},
          envelope_id = ${data.envelopeId}
      where id = ${data.id} and user_id = ${context.userId}
    `;
    await refreshStreak(context.userId);
    return loadSnapshot(context.userId);
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from transactions where id = ${data.id} and user_id = ${context.userId}`;
    await refreshStreak(context.userId);
    return loadSnapshot(context.userId);
  });

export const bulkDeleteTransactions = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { day?: string; month?: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.day) {
      await sql`delete from transactions where user_id = ${context.userId} and transaction_date = ${data.day}`;
    } else if (data.month) {
      await sql`delete from transactions where user_id = ${context.userId} and to_char(transaction_date, 'YYYY-MM') = ${data.month}`;
    }
    await refreshStreak(context.userId);
    return loadSnapshot(context.userId);
  });

export const saveEnvelope = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id?: number; name: string; budget: number; color: string; icon: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.id) {
      await sql`
        update envelopes
        set name = ${data.name.trim()}, budget = ${data.budget}, color = ${data.color}, icon = ${data.icon}, updated_at = now()
        where id = ${data.id} and user_id = ${context.userId}
      `;
    } else {
      await sql`
        insert into envelopes (user_id, name, budget, color, icon)
        values (${context.userId}, ${data.name.trim()}, ${data.budget}, ${data.color}, ${data.icon})
      `;
    }
    return loadSnapshot(context.userId);
  });

export const deleteEnvelope = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update transactions set envelope_id = null where envelope_id = ${data.id} and user_id = ${context.userId}`;
    await sql`delete from envelopes where id = ${data.id} and user_id = ${context.userId}`;
    return loadSnapshot(context.userId);
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id?: number; name: string; color: string; icon: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.id) {
      await sql`
        update categories set name = ${data.name.trim()}, color = ${data.color}, icon = ${data.icon}
        where id = ${data.id} and user_id = ${context.userId}
      `;
    } else {
      await sql`
        insert into categories (user_id, name, color, icon)
        values (${context.userId}, ${data.name.trim()}, ${data.color}, ${data.icon})
      `;
    }
    return loadSnapshot(context.userId);
  });

export const saveFixedEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id?: number; amount: number; description: string; eventDate: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.id) {
      await sql`
        update fixed_events
        set amount = ${data.amount}, description = ${data.description.trim()}, event_date = ${data.eventDate}, updated_at = now()
        where id = ${data.id} and user_id = ${context.userId}
      `;
    } else {
      await sql`
        insert into fixed_events (user_id, amount, description, event_date)
        values (${context.userId}, ${data.amount}, ${data.description.trim()}, ${data.eventDate})
      `;
    }
    await refreshStreak(context.userId);
    return loadSnapshot(context.userId);
  });

export const deleteFixedEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from fixed_events where id = ${data.id} and user_id = ${context.userId}`;
    await refreshStreak(context.userId);
    return loadSnapshot(context.userId);
  });

export const importSms = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { text: string }) => d)
  .handler(async ({ context, data }) => {
    const parsed = parseSmsText(data.text, todayISO());
    const sql = await getSql();
    const rules = await sql<{
      pattern: string;
      category_id: number | null;
      envelope_id: number | null;
    }>`
      select pattern, category_id, envelope_id from categorization_rules where user_id = ${context.userId}
    `;
    let success = 0;
    for (const p of parsed) {
      const match = matchRule(
        p.description,
        rules.map((r) => ({
          pattern: r.pattern,
          categoryId: r.category_id,
          envelopeId: r.envelope_id,
        })),
      );
      await sql`
        insert into transactions (user_id, amount, type, description, transaction_date, category_id, envelope_id)
        values (${context.userId}, ${p.amount}, ${"expense"}, ${p.description}, ${p.date}, ${match.categoryId}, ${match.envelopeId})
      `;
      success += 1;
    }
    await refreshStreak(context.userId);
    const snap = await loadSnapshot(context.userId);
    return { successCount: success, failedCount: 0, snap };
  });

export const resetFinanceData = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`delete from transactions where user_id = ${context.userId}`;
    await sql`delete from fixed_events where user_id = ${context.userId}`;
    await sql`delete from achievements where user_id = ${context.userId}`;
    await sql`delete from envelopes where user_id = ${context.userId}`;
    await sql`delete from categories where user_id = ${context.userId}`;
    await sql`delete from categorization_rules where user_id = ${context.userId}`;
    await sql`delete from user_settings where user_id = ${context.userId}`;
    await ensureSeeded(context.userId);
    return loadSnapshot(context.userId);
  });

export const askAdvisor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI-советник сейчас недоступен." };
    }
    const snap = await loadSnapshot(context.userId);
    const today = todayISO();
    const monthAgo = (() => {
      const d = new Date(`${today}T12:00:00`);
      d.setDate(d.getDate() - 30);
      return todayISO(d);
    })();
    const recent = snap.transactions.filter(
      (t) => t.type === "expense" && t.transactionDate >= monthAgo,
    );
    const byCat = new Map<string, number>();
    for (const t of recent) {
      const name = snap.categories.find((c) => c.id === t.categoryId)?.name ?? "Без категории";
      byCat.set(name, (byCat.get(name) ?? 0) + t.amount);
    }
    const summary = [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([n, a]) => `${n}: ${Number(a).toFixed(2)}`)
      .join("; ");
    const total = recent.reduce((s, t) => s + t.amount, 0);

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 500,
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              "You are an experienced financial analyst. Reply in Russian. Give exactly 3 specific, actionable saving tips as a short markdown list. No preamble.",
          },
          {
            role: "user",
            content: `За 30 дней расходы ${Number(total).toFixed(2)} ${snap.settings.currency || "RUB"}. Разбивка: ${summary || "нет данных"}. Дневной лимит и конверты: ${snap.envelopes.map((e) => e.name + " " + e.budget).join(", ")}.`,
          },
        ],
      }),
    });
    if (!res.ok) {
      return { ok: false as const, error: `Не удалось получить совет (${res.status})` };
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    return { ok: true as const, text };
  });
