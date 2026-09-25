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
  Transaction,
} from "./types";

export function computeDashboard(
  snap: FinanceSnapshot,
  today = todayISO(),
): DashboardComputed {
  const { settings, transactions, fixedEvents, envelopes, categories } = snap;

  const currentBalance = calcCurrentBalance(settings.initialBalance, transactions, fixedEvents, today);
  const daysRemaining = Math.max(0, daysBetween(today, settings.endDate));
  const dailyLimit = calcDailyLimit(currentBalance, settings.finalTarget, fixedEvents, daysRemaining, today);
  const spentToday = transactions
    .filter((t) => t.transactionDate === today && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const remainingToday = dailyLimit - spentToday;
  const progressPercent =
    dailyLimit <= 0 ? (spentToday > 0 ? 100 : 0) : Math.min(200, (spentToday / dailyLimit) * 100);
  const progressTone =
    progressPercent < 50 ? "green" : progressPercent < 85 ? "yellow" : "red";

  const envelopeRows: EnvelopeWithSpent[] = envelopes.map((env) => {
    const spent = transactions
      .filter((t) => t.type === "expense" && t.envelopeId === env.id)
      .reduce((s, t) => s + t.amount, 0);
    const remaining = env.budget - spent;
    const usagePercent = env.budget <= 0 ? 0 : Math.min(200, (spent / env.budget) * 100);
    return { ...env, spent, remaining, usagePercent, isOverBudget: spent > env.budget };
  });

  const allocatedRemaining = envelopeRows.reduce(
    (s, e) => s + Math.max(0, e.remaining),
    0,
  );
  const freeMoney = currentBalance - allocatedRemaining;

  const byDayMap = new Map<string, Transaction[]>();
  for (const t of [...transactions].sort((a, b) =>
    a.transactionDate < b.transactionDate ? 1 : a.transactionDate > b.transactionDate ? -1 : b.id - a.id,
  )) {
    const list = byDayMap.get(t.transactionDate) ?? [];
    list.push(t);
    byDayMap.set(t.transactionDate, list);
  }
  const transactionsByDay = [...byDayMap.entries()].map(([date, items]) => ({ date, items }));

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
    aiTip: localTip(progressPercent, remainingToday),
    transactionsByDay,
    heatmap: buildHeatmap(transactions, today),
    categoryBreakdown: categoryBreakdown(transactions, categories, settings.startDate, today),
    projection: projectBalance(currentBalance, dailyLimit, settings.endDate, fixedEvents, today),
  };
}

export function calcCurrentBalance(
  initial: number,
  transactions: Transaction[],
  fixedEvents: FixedEvent[],
  today: string,
): number {
  const incomeTx = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenseTx = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const pastFixed = fixedEvents.filter((e) => e.eventDate <= today);
  const fixedIncome = pastFixed.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const fixedExpense = pastFixed.filter((e) => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
  return initial + incomeTx + fixedIncome - expenseTx - fixedExpense;
}

export function calcDailyLimit(
  currentBalance: number,
  target: number,
  fixedEvents: FixedEvent[],
  daysRemaining: number,
  today: string,
): number {
  if (daysRemaining <= 0) return 0;
  // amount > 0 = доход, amount < 0 = расход (как в UI)
  // Доступно на траты = текущий баланс + будущий net − целевой остаток
  const futureNet = fixedEvents
    .filter((e) => e.eventDate > today)
    .reduce((s, e) => s + e.amount, 0);
  return Math.max(0, (currentBalance + futureNet - target) / daysRemaining);
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
  if (lastBudgetDay === addDaysISO(today, -1)) return { streak: current + 1, lastBudgetDay: today };
  return { streak: 1, lastBudgetDay: today };
}

function localTip(progress: number, remaining: number): string {
  if (progress >= 100) return "Дневной лимит превышен. Завтра начните с более скромного плана.";
  if (progress >= 85) return `Вы близко к лимиту. Осталось ${Math.round(remaining)} ₽ — тратьте осознанно.`;
  if (progress >= 50) return `Хороший темп. На сегодня ещё ${Math.round(remaining)} ₽.`;
  if (progress > 0) return "Отличный контроль: потрачено меньше половины дневного лимита.";
  return "Новый день. Сначала решите, какие траты действительно нужны.";
}

function buildHeatmap(transactions: Transaction[], today: string): HeatmapDay[] {
  const start = addDaysISO(today, -89);
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (t.transactionDate < start || t.transactionDate > today) continue;
    map.set(t.transactionDate, (map.get(t.transactionDate) ?? 0) + t.amount);
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
    (t) => t.type === "expense" && t.transactionDate >= from && t.transactionDate <= to,
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

function projectBalance(
  currentBalance: number,
  dailyLimit: number,
  endDate: string,
  fixedEvents: FixedEvent[],
  today: string,
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  let balance = currentBalance;
  let date = today;
  while (date <= endDate) {
    const dayNet = fixedEvents.filter((e) => e.eventDate === date).reduce((s, e) => s + e.amount, 0);
    balance += dayNet;
    if (date > today) balance -= dailyLimit;
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
