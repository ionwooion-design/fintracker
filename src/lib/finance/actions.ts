import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { num, todayISO } from "@/lib/utils";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_ENVELOPES,
  DEFAULT_INCOME_CATEGORIES,
} from "./defaults";
import {
  ACHIEVEMENT_DEFS,
  XP_REWARDS,
  levelFromXp,
  titleForLevel,
  type AchievementDef,
} from "./gamification";
import { calcDailyLimit, calcCurrentBalance, nextStreak, computeNextOccurrence } from "./calc";
import { matchRule, parseSmsText } from "./sms";
import type {
  Achievement,
  Category,
  CategoryKind,
  CurrencyCode,
  Envelope,
  FinanceSnapshot,
  FixedEvent,
  RecurringFrequency,
  RecurringTransaction,
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
  const totalXp = num(row.total_xp as string | number) || 0;
  const level = num(row.level as string | number) || levelFromXp(totalXp);
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
    level,
    totalXp,
    title: String(row.title ?? titleForLevel(level)),
    longestStreak: num(row.longest_streak as string | number) || 0,
    totalTransactions: num(row.total_transactions as string | number) || 0,
    daysLogged: num(row.days_logged as string | number) || 0,
    lastLoginDate: row.last_login_date ? String(row.last_login_date) : null,
  };
}


function mapRecurring(row: Record<string, unknown>): RecurringTransaction {
  return {
    id: Number(row.id),
    amount: num(row.amount as string | number),
    type: row.type as "income" | "expense",
    description: String(row.description ?? ""),
    categoryId: row.category_id != null ? Number(row.category_id) : null,
    envelopeId: row.envelope_id != null ? Number(row.envelope_id) : null,
    frequency: row.frequency as RecurringFrequency,
    interval: num(row.interval as string | number) || 1,
    dayOfWeek: row.day_of_week != null ? Number(row.day_of_week) : null,
    dayOfMonth: row.day_of_month != null ? Number(row.day_of_month) : null,
    monthOfYear: row.month_of_year != null ? Number(row.month_of_year) : null,
    customRrule: row.custom_rrule ? String(row.custom_rrule) : null,
    startDate: String(row.start_date),
    endDate: row.end_date ? String(row.end_date) : null,
    nextOccurrence: String(row.next_occurrence),
    lastGenerated: row.last_generated ? String(row.last_generated) : null,
    isActive: Boolean(row.is_active),
    autoCreate: Boolean(row.auto_create),
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

  for (const c of [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]) {
    try {
      await sql`
        insert into categories (user_id, name, color, icon, kind)
        values (${userId}, ${c.name}, ${c.color}, ${c.icon}, ${c.kind})
        on conflict do nothing
      `;
    } catch {
      // fallback if kind column not yet migrated
      await sql`
        insert into categories (user_id, name, color, icon)
        values (${userId}, ${c.name}, ${c.color}, ${c.icon})
        on conflict do nothing
      `;
    }
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
  let categories: { id: number; name: string; color: string; icon: string; kind?: string }[] = [];
  try {
    categories = await sql<{ id: number; name: string; color: string; icon: string; kind: string }>`
      select id, name, color, icon, kind from categories where user_id = ${userId} order by kind, name
    `;
  } catch {
    categories = await sql<{ id: number; name: string; color: string; icon: string }>`
      select id, name, color, icon from categories where user_id = ${userId} order by name
    `;
  }
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
    recurring_id: number | null;
  }>`
    select id, amount, type, description, transaction_date, category_id, envelope_id,
           null::integer as recurring_id
    from transactions where user_id = ${userId}
    order by transaction_date desc, id desc
  `;
  // After migration 0004, replace null::integer with recurring_id column:
  // select id, amount, type, description, transaction_date, category_id, envelope_id, recurring_id

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
    rarity?: string;
    xp_reward?: number | string;
  }>`
    select id, code, name, description, icon, unlocked_at,
           coalesce(rarity, 'common') as rarity,
           coalesce(xp_reward, 0) as xp_reward
    from achievements
    where user_id = ${userId} order by unlocked_at desc
  `;

  let recurringRows: Record<string, unknown>[] = [];
  try {
    recurringRows = await sql<Record<string, unknown>>`
      select * from recurring_transactions
      where user_id = ${userId}
      order by next_occurrence, id
    `;
  } catch {
    // table may not exist until migration runs
    recurringRows = [];
  }

  // Prefer selecting recurring_id if column exists
  const txMapped = transactions.map((t) => ({
    id: t.id,
    amount: num(t.amount),
    type: t.type as Transaction["type"],
    description: t.description,
    transactionDate: String(t.transaction_date),
    categoryId: t.category_id,
    envelopeId: t.envelope_id,
    recurringId: (t as { recurring_id?: number | null }).recurring_id ?? null,
  }));

  return {
    settings: mapSettings(settingsRow, userId),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      kind: (c.kind === "income" ? "income" : "expense") as CategoryKind,
    })) as Category[],
    envelopes: envelopes.map((e) => ({
      id: e.id,
      name: e.name,
      budget: num(e.budget),
      color: e.color,
      icon: e.icon,
    })) as Envelope[],
    transactions: txMapped,
    fixedEvents: fixedEvents.map((e) => ({
      id: e.id,
      amount: num(e.amount),
      description: e.description,
      eventDate: String(e.event_date),
    })) as FixedEvent[],
    achievements: achievements.map((a) => ({
      id: Number(a.id),
      code: String(a.code),
      name: String(a.name),
      description: String(a.description),
      icon: String(a.icon),
      unlockedAt: String(a.unlocked_at),
      rarity: a.rarity != null ? String(a.rarity) : "common",
      xpReward: a.xp_reward != null ? num(a.xp_reward as string | number) : 0,
    })) as Achievement[],
    recurring: recurringRows.map(mapRecurring),
  };
}

type UnlockContext = {
  streak: number;
  longestStreak: number;
  txCount: number;
  expenseCount: number;
  incomeCount: number;
  daysLogged: number;
  envelopeCount: number;
  categoryCount: number;
  recurringCount: number;
  level: number;
  balance: number;
  finalTarget: number;
  initialBalance: number;
  distinctCategories: number;
  allEnvelopesUnder80: boolean;
  hasNoSpendDay: boolean;
  underBudgetToday: boolean;
  spentToday: number;
  dailyLimit: number;
  isNightHour: boolean;
  smsImported?: boolean;
};

function conditionMet(def: AchievementDef, ctx: UnlockContext): boolean {
  const c = def.condition;
  switch (c.type) {
    case "streak":
      return ctx.streak >= c.min;
    case "longest_streak":
      return ctx.longestStreak >= c.min;
    case "tx_count":
      return ctx.txCount >= c.min;
    case "tx_count_type":
      return c.txType === "expense" ? ctx.expenseCount >= c.min : ctx.incomeCount >= c.min;
    case "days_logged":
      return ctx.daysLogged >= c.min;
    case "envelopes_created":
      return ctx.envelopeCount >= c.min;
    case "categories_created":
      return ctx.categoryCount >= c.min;
    case "recurring_created":
      return ctx.recurringCount >= c.min;
    case "level":
      return ctx.level >= c.min;
    case "balance_above_target":
      return ctx.balance >= ctx.finalTarget && ctx.finalTarget > 0;
    case "saved_percent": {
      const span = ctx.initialBalance - ctx.finalTarget;
      if (span <= 0) return ctx.balance >= ctx.finalTarget;
      const progress = ((ctx.initialBalance - ctx.balance) / span) * 100;
      // if saving upward (target > initial)
      if (ctx.finalTarget > ctx.initialBalance) {
        const up = ((ctx.balance - ctx.initialBalance) / (ctx.finalTarget - ctx.initialBalance)) * 100;
        return up >= c.percent;
      }
      return progress >= c.percent;
    }
    case "first_income":
      return ctx.incomeCount >= 1;
    case "first_expense":
      return ctx.expenseCount >= 1;
    case "sms_import":
      return Boolean(ctx.smsImported);
    case "perfect_week":
      return ctx.streak >= 7;
    case "envelope_under":
      return ctx.allEnvelopesUnder80;
    case "diversity_categories":
      return ctx.distinctCategories >= c.min;
    case "no_spend_day":
      return ctx.hasNoSpendDay;
    case "custom":
      if (c.code === "night_owl") return ctx.isNightHour;
      if (c.code === "big_but_under")
        return ctx.underBudgetToday && ctx.spentToday > 0 && ctx.dailyLimit > 0 && ctx.spentToday >= ctx.dailyLimit * 0.7;
      return false;
    default:
      return false;
  }
}

async function awardXp(userId: string, amount: number) {
  if (amount <= 0) return;
  const sql = await getSql();
  const rows = await sql<{ total_xp: number | string; level: number | string }>`
    select coalesce(total_xp, 0) as total_xp, coalesce(level, 1) as level
    from user_settings where user_id = ${userId}
  `;
  if (!rows.length) return;
  const prevXp = num(rows[0].total_xp);
  const newXp = prevXp + amount;
  const newLevel = levelFromXp(newXp);
  const newTitle = titleForLevel(newLevel);
  await sql`
    update user_settings
    set total_xp = ${newXp},
        level = ${newLevel},
        title = ${newTitle},
        updated_at = now()
    where user_id = ${userId}
  `;
}

async function unlockAchievements(userId: string, ctx: UnlockContext) {
  const sql = await getSql();
  let totalXpGain = 0;
  for (const def of ACHIEVEMENT_DEFS) {
    if (!conditionMet(def, ctx)) continue;
    const inserted = await sql`
      insert into achievements (user_id, code, name, description, icon, rarity, xp_reward)
      values (
        ${userId}, ${def.code}, ${def.name}, ${def.description}, ${def.icon},
        ${def.rarity}, ${def.xpReward}
      )
      on conflict (user_id, code) do nothing
      returning id
    `;
    if (inserted.length > 0) {
      totalXpGain += def.xpReward;
    }
  }
  if (totalXpGain > 0) {
    await awardXp(userId, totalXpGain);
  }
}

async function buildUnlockContext(userId: string, snap: FinanceSnapshot, extra?: Partial<UnlockContext>): Promise<UnlockContext> {
  const today = todayISO();
  const expenseCount = snap.transactions.filter((t) => t.type === "expense").length;
  const incomeCount = snap.transactions.filter((t) => t.type === "income").length;
  const distinctCategories = new Set(
    snap.transactions.map((t) => t.categoryId).filter((id): id is number => id != null),
  ).size;
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
  const underBudgetToday = spentToday <= dailyLimit;
  // envelope usage
  const envelopeSpent = new Map<number, number>();
  for (const t of snap.transactions) {
    if (t.type === "expense" && t.envelopeId != null) {
      envelopeSpent.set(t.envelopeId, (envelopeSpent.get(t.envelopeId) ?? 0) + t.amount);
    }
  }
  let allEnvelopesUnder80 = snap.envelopes.length > 0;
  for (const e of snap.envelopes) {
    const spent = envelopeSpent.get(e.id) ?? 0;
    if (e.budget > 0 && spent / e.budget >= 0.8) {
      allEnvelopesUnder80 = false;
      break;
    }
  }
  // no-spend day: any past day with transactions logged but 0 expense
  const byDate = new Map<string, { expense: number; any: boolean }>();
  for (const t of snap.transactions) {
    const d = byDate.get(t.transactionDate) ?? { expense: 0, any: false };
    d.any = true;
    if (t.type === "expense") d.expense += t.amount;
    byDate.set(t.transactionDate, d);
  }
  const hasNoSpendDay = [...byDate.values()].some((d) => d.any && d.expense === 0);

  const hour = new Date().getHours();
  const isNightHour = hour >= 0 && hour < 5;

  return {
    streak: snap.settings.currentStreak,
    longestStreak: snap.settings.longestStreak,
    txCount: snap.transactions.length,
    expenseCount,
    incomeCount,
    daysLogged: snap.settings.daysLogged,
    envelopeCount: snap.envelopes.length,
    categoryCount: snap.categories.length,
    recurringCount: snap.recurring.filter((r) => r.isActive).length,
    level: snap.settings.level,
    balance,
    finalTarget: snap.settings.finalTarget,
    initialBalance: snap.settings.initialBalance,
    distinctCategories,
    allEnvelopesUnder80,
    hasNoSpendDay,
    underBudgetToday,
    spentToday,
    dailyLimit,
    isNightHour,
    ...extra,
  };
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
  const underBudget = spentToday <= dailyLimit;
  let xpGain = 0;
  if (underBudget && next.streak > 0 && next.lastBudgetDay === today) {
    if (snap.settings.lastBudgetDay !== today) {
      xpGain += XP_REWARDS.underBudgetDay;
      xpGain += Math.min(30, next.streak) * XP_REWARDS.streakBonusPerDay;
    }
  }
  const longest = Math.max(snap.settings.longestStreak, next.streak);
  const loggedDates = new Set(snap.transactions.map((t) => t.transactionDate));
  const daysLogged = loggedDates.size;
  const txCount = snap.transactions.length;

  const sql = await getSql();
  await sql`
    update user_settings
    set current_streak = ${next.streak},
        last_budget_day = ${next.lastBudgetDay},
        last_streak_date = ${today},
        longest_streak = ${longest},
        total_transactions = ${txCount},
        days_logged = ${daysLogged},
        last_login_date = ${today},
        updated_at = now()
    where user_id = ${userId}
  `;
  if (xpGain > 0) {
    await awardXp(userId, xpGain);
  }
  const fresh = await loadSnapshot(userId);
  const ctx = await buildUnlockContext(userId, {
    ...fresh,
    settings: {
      ...fresh.settings,
      currentStreak: next.streak,
      longestStreak: longest,
      daysLogged,
      totalTransactions: txCount,
    },
  });
  await unlockAchievements(userId, ctx);
}

async function generateDueRecurring(userId: string) {
  const sql = await getSql();
  const today = todayISO();
  let rows: Record<string, unknown>[] = [];
  try {
    rows = await sql<Record<string, unknown>>`
      select * from recurring_transactions
      where user_id = ${userId}
        and is_active = true
        and auto_create = true
        and next_occurrence <= ${today}
    `;
  } catch {
    return;
  }

  for (const row of rows) {
    const r = mapRecurring(row);
    let cursor = r.nextOccurrence;
    let lastGen = r.lastGenerated;
    let guard = 0;
    let deactivated = false;

    while (cursor <= today && guard++ < 366) {
      if (r.endDate && cursor > r.endDate) break;

      try {
        const existing = await sql`
          select id from transactions
          where user_id = ${userId}
            and recurring_id = ${r.id}
            and transaction_date = ${cursor}
          limit 1
        `;
        if (!existing.length) {
          await sql`
            insert into transactions (
              user_id, amount, type, description,
              transaction_date, category_id, envelope_id, recurring_id
            ) values (
              ${userId}, ${r.amount}, ${r.type},
              ${r.description || "Повторяющаяся операция"},
              ${cursor}, ${r.categoryId}, ${r.envelopeId}, ${r.id}
            )
          `;
        }
      } catch {
        // recurring_id column may not exist yet — insert without it
        await sql`
          insert into transactions (
            user_id, amount, type, description,
            transaction_date, category_id, envelope_id
          ) values (
            ${userId}, ${r.amount}, ${r.type},
            ${r.description || "Повторяющаяся операция"},
            ${cursor}, ${r.categoryId}, ${r.envelopeId}
          )
        `;
      }

      lastGen = cursor;
      const next = computeNextOccurrence(cursor, r.frequency, r.interval, {
        dayOfWeek: r.dayOfWeek,
        dayOfMonth: r.dayOfMonth,
        monthOfYear: r.monthOfYear,
        endDate: r.endDate,
      });
      if (!next) {
        await sql`
          update recurring_transactions
          set is_active = false,
              last_generated = ${lastGen},
              next_occurrence = ${cursor},
              updated_at = now()
          where id = ${r.id} and user_id = ${userId}
        `;
        deactivated = true;
        break;
      }
      cursor = next;
    }

    if (!deactivated && (lastGen !== r.lastGenerated || cursor !== r.nextOccurrence)) {
      await sql`
        update recurring_transactions
        set last_generated = ${lastGen},
            next_occurrence = ${cursor},
            updated_at = now()
        where id = ${r.id} and user_id = ${userId}
      `;
    }
  }
}

export const getFinanceData = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded(context.userId);
    await generateDueRecurring(context.userId);
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
    const txXp =
      data.type === "income" ? XP_REWARDS.addIncome : XP_REWARDS.addTransaction;
    await awardXp(context.userId, txXp);
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
      await awardXp(context.userId, XP_REWARDS.createEnvelope);
    }
    const snap = await loadSnapshot(context.userId);
    const ctx = await buildUnlockContext(context.userId, snap);
    await unlockAchievements(context.userId, ctx);
    return snap;
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
  .validator((d: { id?: number; name: string; color: string; icon: string; kind?: CategoryKind }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const kind: CategoryKind = data.kind === "income" ? "income" : "expense";
    if (data.id) {
      try {
        await sql`
          update categories
          set name = ${data.name.trim()}, color = ${data.color}, icon = ${data.icon}, kind = ${kind}
          where id = ${data.id} and user_id = ${context.userId}
        `;
      } catch {
        await sql`
          update categories
          set name = ${data.name.trim()}, color = ${data.color}, icon = ${data.icon}
          where id = ${data.id} and user_id = ${context.userId}
        `;
      }
    } else {
      try {
        await sql`
          insert into categories (user_id, name, color, icon, kind)
          values (${context.userId}, ${data.name.trim()}, ${data.color}, ${data.icon}, ${kind})
        `;
      } catch {
        await sql`
          insert into categories (user_id, name, color, icon)
          values (${context.userId}, ${data.name.trim()}, ${data.color}, ${data.icon})
        `;
      }
      await awardXp(context.userId, XP_REWARDS.createCategory);
    }
    const snap = await loadSnapshot(context.userId);
    const ctx = await buildUnlockContext(context.userId, snap);
    await unlockAchievements(context.userId, ctx);
    return snap;
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update transactions set category_id = null where category_id = ${data.id} and user_id = ${context.userId}`;
    try {
      await sql`update recurring_transactions set category_id = null where category_id = ${data.id} and user_id = ${context.userId}`;
    } catch {
      // table may not exist
    }
    await sql`update categorization_rules set category_id = null where category_id = ${data.id} and user_id = ${context.userId}`;
    await sql`delete from categories where id = ${data.id} and user_id = ${context.userId}`;
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
      const txType = p.type === "income" ? "income" : "expense";
      await sql`
        insert into transactions (user_id, amount, type, description, transaction_date, category_id, envelope_id)
        values (${context.userId}, ${p.amount}, ${txType}, ${p.description}, ${p.date}, ${match.categoryId}, ${match.envelopeId})
      `;
      success += 1;
    }
    if (success > 0) {
      await awardXp(context.userId, XP_REWARDS.smsImport + success * XP_REWARDS.addTransaction);
    }
    await refreshStreak(context.userId);
    const snap = await loadSnapshot(context.userId);
    const ctx = await buildUnlockContext(context.userId, snap, { smsImported: success > 0 });
    await unlockAchievements(context.userId, ctx);
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

export const saveRecurring = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      id?: number;
      amount: number;
      type: "income" | "expense";
      description: string;
      categoryId: number | null;
      envelopeId: number | null;
      frequency: RecurringFrequency;
      interval?: number;
      dayOfWeek?: number | null;
      dayOfMonth?: number | null;
      monthOfYear?: number | null;
      startDate: string;
      endDate?: string | null;
      autoCreate?: boolean;
      isActive?: boolean;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    if (data.amount <= 0) throw new Error("Сумма должна быть больше нуля");
    const interval = Math.max(1, data.interval ?? 1);
    const sql = await getSql();
    const today = todayISO();

    let next = data.startDate;
    if (next < today) {
      const n = computeNextOccurrence(data.startDate, data.frequency, interval, {
        dayOfWeek: data.dayOfWeek,
        dayOfMonth: data.dayOfMonth,
        monthOfYear: data.monthOfYear,
        endDate: data.endDate,
      });
      next = n ?? data.startDate;
    }

    if (data.id) {
      await sql`
        update recurring_transactions set
          amount = ${data.amount},
          type = ${data.type},
          description = ${data.description.trim()},
          category_id = ${data.categoryId},
          envelope_id = ${data.envelopeId},
          frequency = ${data.frequency},
          interval = ${interval},
          day_of_week = ${data.dayOfWeek ?? null},
          day_of_month = ${data.dayOfMonth ?? null},
          month_of_year = ${data.monthOfYear ?? null},
          start_date = ${data.startDate},
          end_date = ${data.endDate ?? null},
          next_occurrence = ${next},
          auto_create = ${data.autoCreate ?? true},
          is_active = ${data.isActive ?? true},
          updated_at = now()
        where id = ${data.id} and user_id = ${context.userId}
      `;
    } else {
      await sql`
        insert into recurring_transactions (
          user_id, amount, type, description,
          category_id, envelope_id,
          frequency, interval,
          day_of_week, day_of_month, month_of_year,
          start_date, end_date, next_occurrence,
          auto_create, is_active
        ) values (
          ${context.userId},
          ${data.amount},
          ${data.type},
          ${data.description.trim()},
          ${data.categoryId},
          ${data.envelopeId},
          ${data.frequency},
          ${interval},
          ${data.dayOfWeek ?? null},
          ${data.dayOfMonth ?? null},
          ${data.monthOfYear ?? null},
          ${data.startDate},
          ${data.endDate ?? null},
          ${next},
          ${data.autoCreate ?? true},
          ${data.isActive ?? true}
        )
      `;
    }

    if (!data.id) {
      await awardXp(context.userId, XP_REWARDS.createRecurring);
    }
    await generateDueRecurring(context.userId);
    await refreshStreak(context.userId);
    const snap = await loadSnapshot(context.userId);
    const ctx = await buildUnlockContext(context.userId, snap);
    await unlockAchievements(context.userId, ctx);
    return snap;
  });

export const pauseRecurring = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number; isActive: boolean }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update recurring_transactions
      set is_active = ${data.isActive}, updated_at = now()
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return loadSnapshot(context.userId);
  });

export const deleteRecurring = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number; deleteGenerated?: boolean }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.deleteGenerated) {
      try {
        await sql`
          delete from transactions
          where recurring_id = ${data.id} and user_id = ${context.userId}
        `;
      } catch {
        // column may not exist
      }
    } else {
      try {
        await sql`
          update transactions set recurring_id = null
          where recurring_id = ${data.id} and user_id = ${context.userId}
        `;
      } catch {
        // ignore
      }
    }
    await sql`
      delete from recurring_transactions
      where id = ${data.id} and user_id = ${context.userId}
    `;
    await refreshStreak(context.userId);
    return loadSnapshot(context.userId);
  });

