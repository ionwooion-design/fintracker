import { addDaysISO, daysBetween, todayISO } from "@/lib/utils";
import type {
  Category,
  CategoryExpense,
  DashboardComputed,
  Envelope,
  EnvelopeWithSpent,
  FinanceSnapshot,
  FixedEvent,
  HeatmapDay,
  ProjectionPoint,
  RecurringFrequency,
  RecurringTransaction,
  SavingsGoalWithProgress,
  Transaction,
} from "./types";

export function computeDashboard(
  snap: FinanceSnapshot,
  today = todayISO(),
): DashboardComputed {
  const {
    settings,
    transactions,
    fixedEvents,
    envelopes,
    categories,
    recurring = [],
    goals = [],
  } = snap;

  const periodStart = settings.startDate;

  // Balance uses period-scoped txs so carrying balance into a new period
  // (initialBalance = old currentBalance) does not double-count history.
  const currentBalance = calcCurrentBalance(
    settings.initialBalance,
    transactions,
    fixedEvents,
    today,
    periodStart,
  );
  const spentToday = transactions
    .filter((t) => t.transactionDate === today && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const incomeToday = transactions
    .filter((t) => t.transactionDate === today && t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  // Calendar days from today to endDate (0 if same day). Displayed as «дней осталось».
  const daysRemaining = Math.max(0, daysBetween(today, settings.endDate));
  const dailyLimit = calcDailyLimit(
    currentBalance,
    settings.finalTarget,
    fixedEvents,
    daysRemaining,
    today,
    recurring,
    settings.endDate,
    spentToday,
    incomeToday,
  );
  const remainingToday = dailyLimit - spentToday;
  const progressPercent =
    dailyLimit <= 0
      ? spentToday > 0
        ? 100
        : 0
      : Math.min(200, (spentToday / dailyLimit) * 100);
  const progressTone =
    progressPercent < 50 ? "green" : progressPercent < 85 ? "yellow" : "red";

  // Envelope spent is scoped to the current budget period
  const envelopeRows: EnvelopeWithSpent[] = envelopes.map((env) => {
    const spent = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.envelopeId === env.id &&
          t.transactionDate >= periodStart,
      )
      .reduce((s, t) => s + t.amount, 0);
    const remaining = env.budget - spent;
    const usagePercent =
      env.budget <= 0 ? 0 : Math.min(200, (spent / env.budget) * 100);
    return {
      ...env,
      spent,
      remaining,
      usagePercent,
      isOverBudget: spent > env.budget,
    };
  });

  const allocatedRemaining = envelopeRows.reduce(
    (s, e) => s + Math.max(0, e.remaining),
    0,
  );
  const freeMoney = currentBalance - allocatedRemaining;

  const goalRows: SavingsGoalWithProgress[] = goals.map((g) => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    const progressPercent =
      g.targetAmount <= 0
        ? 0
        : Math.min(100, (g.currentAmount / g.targetAmount) * 100);
    return { ...g, remaining, progressPercent };
  });
  const activeGoals = goalRows.filter((g) => !g.isCompleted);
  const goalsTotalSaved = activeGoals.reduce((s, g) => s + g.currentAmount, 0);
  const goalsTotalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0);
  const freeAfterGoals = currentBalance - goalsTotalSaved;

  const byDayMap = new Map<string, Transaction[]>();
  for (const t of [...transactions].sort((a, b) =>
    a.transactionDate < b.transactionDate
      ? 1
      : a.transactionDate > b.transactionDate
        ? -1
        : b.id - a.id,
  )) {
    const list = byDayMap.get(t.transactionDate) ?? [];
    list.push(t);
    byDayMap.set(t.transactionDate, list);
  }
  const transactionsByDay = [...byDayMap.entries()].map(([date, items]) => ({
    date,
    items,
  }));

  return {
    currentBalance,
    dailyLimit,
    spentToday,
    remainingToday,
    progressPercent,
    progressTone,
    daysRemaining,
    currentStreak: settings.currentStreak,
    envelopes: envelopeRows,
    freeMoney,
    freeAfterGoals,
    aiTip: localTip(progressPercent, remainingToday, settings.currency),
    transactionsByDay,
    heatmap: buildHeatmap(transactions, today),
    categoryBreakdown: categoryBreakdown(
      transactions,
      categories,
      settings.startDate,
      today,
    ),
    projection: projectBalance(
      currentBalance,
      dailyLimit,
      settings.endDate,
      fixedEvents,
      today,
      recurring,
      spentToday,
    ),
    goals: goalRows,
    goalsTotalSaved,
    goalsTotalTarget,
  };
}

/**
 * Current balance for the budget period.
 * When `periodStart` is set, only transactions/fixed events on or after that
 * date are applied on top of `initial` (the balance at period start).
 * This makes «перенос остатка» safe without deleting history.
 */
export function calcCurrentBalance(
  initial: number,
  transactions: Transaction[],
  fixedEvents: FixedEvent[],
  today: string,
  periodStart?: string,
): number {
  const inPeriod = (date: string) =>
    !periodStart || date >= periodStart;

  const incomeTx = transactions
    .filter((t) => t.type === "income" && inPeriod(t.transactionDate))
    .reduce((s, t) => s + t.amount, 0);
  const expenseTx = transactions
    .filter((t) => t.type === "expense" && inPeriod(t.transactionDate))
    .reduce((s, t) => s + t.amount, 0);
  const pastFixed = fixedEvents.filter(
    (e) => e.eventDate <= today && inPeriod(e.eventDate),
  );
  const fixedIncome = pastFixed
    .filter((e) => e.amount > 0)
    .reduce((s, e) => s + e.amount, 0);
  const fixedExpense = pastFixed
    .filter((e) => e.amount < 0)
    .reduce((s, e) => s + Math.abs(e.amount), 0);
  return initial + incomeTx + fixedIncome - expenseTx - fixedExpense;
}

/**
 * Daily spending allowance so that by endDate the balance reaches `target`.
 *
 * @param daysToEnd - daysBetween(today, endDate); 0 means today is the last day
 * @param spentToday / incomeToday - used to recover start-of-day balance
 *   (currentBalance already nets today's txs — without this, remainingToday double-counts)
 *
 * Spending days are **inclusive**: today … endDate → daysToEnd + 1.
 */
export function calcDailyLimit(
  currentBalance: number,
  target: number,
  fixedEvents: FixedEvent[],
  daysToEnd: number,
  today: string,
  recurring: RecurringTransaction[] = [],
  endDate?: string,
  spentToday = 0,
  incomeToday = 0,
): number {
  // Period already over
  if (daysToEnd < 0) {
    return Math.max(0, currentBalance - target);
  }

  // Inclusive day count: today and every day through endDate
  const spendingDays = daysToEnd + 1;

  // Balance as of start of today (before today's income/expense transactions)
  const startOfDayBalance = currentBalance + spentToday - incomeToday;

  const futureFixedNet = fixedEvents
    .filter((e) => e.eventDate > today)
    .reduce((s, e) => s + e.amount, 0);

  const horizon = endDate ?? addDaysISO(today, daysToEnd);
  const futureRecurring = expandRecurringOccurrences(recurring, today, horizon);
  const futureRecurringNet = futureRecurring.reduce(
    (s, o) => s + (o.type === "income" ? o.amount : -o.amount),
    0,
  );

  const pool = startOfDayBalance + futureFixedNet + futureRecurringNet - target;
  return Math.max(0, pool / spendingDays);
}

export function nextStreak(
  current: number,
  lastBudgetDay: string | null,
  spentToday: number,
  dailyLimit: number,
  today: string,
): { streak: number; lastBudgetDay: string | null } {
  const ok = spentToday <= dailyLimit;
  if (!ok) return { streak: 0, lastBudgetDay };
  if (!lastBudgetDay) return { streak: 1, lastBudgetDay: today };
  if (lastBudgetDay === today) return { streak: current, lastBudgetDay };
  if (lastBudgetDay === addDaysISO(today, -1))
    return { streak: current + 1, lastBudgetDay: today };
  return { streak: 1, lastBudgetDay: today };
}

/** Next occurrence strictly after `from`. Returns null if past endDate. */
export function computeNextOccurrence(
  from: string,
  frequency: RecurringFrequency,
  interval: number,
  opts: {
    dayOfWeek?: number | null;
    dayOfMonth?: number | null;
    monthOfYear?: number | null;
    endDate?: string | null;
  } = {},
): string | null {
  const step = Math.max(1, interval | 0);
  let cursor = from;

  for (let i = 0; i < 400; i++) {
    cursor = addDaysISO(cursor, 1);
    if (opts.endDate && cursor > opts.endDate) return null;
    if (matchesRule(cursor, frequency, step, from, opts)) {
      return cursor;
    }
  }
  return null;
}

function matchesRule(
  date: string,
  frequency: RecurringFrequency,
  interval: number,
  startDate: string,
  opts: {
    dayOfWeek?: number | null;
    dayOfMonth?: number | null;
    monthOfYear?: number | null;
  },
): boolean {
  const d = new Date(`${date}T12:00:00`);
  const start = new Date(`${startDate}T12:00:00`);

  switch (frequency) {
    case "daily": {
      const diff = daysBetween(startDate, date);
      return diff >= 0 && diff % interval === 0;
    }
    case "weekly": {
      const dow = d.getDay();
      if (opts.dayOfWeek != null && dow !== opts.dayOfWeek) return false;
      const weeks = Math.floor(daysBetween(startDate, date) / 7);
      return weeks >= 0 && weeks % interval === 0;
    }
    case "monthly": {
      const dom = d.getDate();
      const targetDom = opts.dayOfMonth ?? start.getDate();
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const effectiveDom = Math.min(targetDom, lastDay);
      if (dom !== effectiveDom) return false;
      const months =
        (d.getFullYear() - start.getFullYear()) * 12 +
        (d.getMonth() - start.getMonth());
      return months >= 0 && months % interval === 0;
    }
    case "yearly": {
      const month = d.getMonth() + 1;
      const dom = d.getDate();
      const targetMonth = opts.monthOfYear ?? start.getMonth() + 1;
      const targetDom = opts.dayOfMonth ?? start.getDate();
      if (month !== targetMonth) return false;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      if (dom !== Math.min(targetDom, lastDay)) return false;
      const years = d.getFullYear() - start.getFullYear();
      return years >= 0 && years % interval === 0;
    }
    case "custom":
      return false;
    default:
      return false;
  }
}

/** Expand active recurring into concrete occurrences in (from, to]. */
export function expandRecurringOccurrences(
  items: RecurringTransaction[],
  from: string,
  to: string,
): {
  date: string;
  amount: number;
  type: "income" | "expense";
  description: string;
}[] {
  const out: {
    date: string;
    amount: number;
    type: "income" | "expense";
    description: string;
  }[] = [];

  for (const r of items) {
    if (!r.isActive) continue;
    let cursor = r.nextOccurrence;
    if (cursor <= from) {
      const next = computeNextOccurrence(cursor, r.frequency, r.interval, {
        dayOfWeek: r.dayOfWeek,
        dayOfMonth: r.dayOfMonth,
        monthOfYear: r.monthOfYear,
        endDate: r.endDate,
      });
      if (!next) continue;
      cursor = next;
    }

    let guard = 0;
    while (cursor <= to && guard++ < 500) {
      if (r.endDate && cursor > r.endDate) break;
      if (cursor > from) {
        out.push({
          date: cursor,
          amount: r.amount,
          type: r.type,
          description: r.description,
        });
      }
      const next = computeNextOccurrence(cursor, r.frequency, r.interval, {
        dayOfWeek: r.dayOfWeek,
        dayOfMonth: r.dayOfMonth,
        monthOfYear: r.monthOfYear,
        endDate: r.endDate,
      });
      if (!next) break;
      cursor = next;
    }
  }
  return out;
}

function localTip(
  progress: number,
  remaining: number,
  currency: string = "RUB",
): string {
  const formatted = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency || "RUB",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(remaining);
  if (progress >= 100)
    return "Дневной лимит превышен. Завтра начните с более скромного плана.";
  if (progress >= 85)
    return `Вы близко к лимиту. Осталось ${formatted} — тратьте осознанно.`;
  if (progress >= 50) return `Хороший темп. На сегодня ещё ${formatted}.`;
  if (progress > 0)
    return "Отличный контроль: потрачено меньше половины дневного лимита.";
  return "Новый день. Сначала решите, какие траты действительно нужны.";
}

function buildHeatmap(
  transactions: Transaction[],
  today: string,
): HeatmapDay[] {
  const start = addDaysISO(today, -89);
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (t.transactionDate < start || t.transactionDate > today) continue;
    map.set(
      t.transactionDate,
      (map.get(t.transactionDate) ?? 0) + t.amount,
    );
  }
  const days: HeatmapDay[] = [];
  let cursor = start;
  while (cursor <= today) {
    days.push({ date: cursor, amount: map.get(cursor) ?? 0 });
    cursor = addDaysISO(cursor, 1);
  }
  return days;
}

function categoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  from: string,
  to: string,
): CategoryExpense[] {
  const period = transactions.filter(
    (t) =>
      t.type === "expense" &&
      t.transactionDate >= from &&
      t.transactionDate <= to,
  );
  const total = period.reduce((s, t) => s + t.amount, 0);
  if (total <= 0) return [];
  const by = new Map<number, number>();
  for (const t of period) {
    if (t.categoryId == null) continue;
    by.set(t.categoryId, (by.get(t.categoryId) ?? 0) + t.amount);
  }
  return [...by.entries()]
    .map(([id, amount]) => {
      const category = categories.find((c) => c.id === id);
      if (!category) return null;
      return { category, amount, percent: (amount / total) * 100 };
    })
    .filter((x): x is CategoryExpense => x != null)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Project balance if the daily plan is followed through endDate.
 * currentBalance already includes today's transactions and fixed events with date <= today.
 * - Today: only the *remaining* allowance may still be spent (dailyLimit - spentToday)
 * - Future days: full dailyLimit is assumed spent; fixed/recurring for that day applied
 */
function projectBalance(
  currentBalance: number,
  dailyLimit: number,
  endDate: string,
  fixedEvents: FixedEvent[],
  today: string,
  recurring: RecurringTransaction[] = [],
  spentToday = 0,
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  let balance = currentBalance;
  let date = today;

  // Occurrences strictly after today (today's recurring already in transactions if auto-created)
  const recurringOcc = expandRecurringOccurrences(recurring, today, endDate);
  const recByDate = new Map<string, number>();
  for (const o of recurringOcc) {
    const signed = o.type === "income" ? o.amount : -o.amount;
    recByDate.set(o.date, (recByDate.get(o.date) ?? 0) + signed);
  }

  while (date <= endDate) {
    if (date === today) {
      // Fixed events for today already in currentBalance; do not re-add.
      // Assume user spends the rest of today's allowance.
      balance -= Math.max(0, dailyLimit - spentToday);
    } else {
      const dayFixed = fixedEvents
        .filter((e) => e.eventDate === date)
        .reduce((s, e) => s + e.amount, 0);
      const dayRec = recByDate.get(date) ?? 0;
      balance += dayFixed + dayRec;
      balance -= dailyLimit;
    }
    points.push({ date, projectedBalance: balance });
    date = addDaysISO(date, 1);
  }
  return points;
}

export function envelopeCircleStroke(percent: number): number {
  const p = Math.min(100, Math.max(0, percent)) / 100;
  const c = 2 * Math.PI * 18;
  return c * (1 - p);
}
