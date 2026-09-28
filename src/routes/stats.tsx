import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { ExpenseHeatmap } from "@/components/finance/heatmap";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/lib/finance/icons";
import { useFinance } from "@/lib/finance/use-finance";
import { formatMoney, todayISO } from "@/lib/utils";
import { ThemeSync } from "@/components/theme-sync";
import {
  ACHIEVEMENT_DEFS,
  CATEGORY_LABELS,
  RARITY_COLORS,
  RARITY_LABELS,
  computeGamificationStats,
  type AchievementCategory,
  type AchievementRarity,
} from "@/lib/finance/gamification";
import type { Transaction } from "@/lib/finance/types";

export const Route = createFileRoute("/stats")({ component: StatsPage });

type Period = "7" | "30" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "7": "7 дней",
  "30": "30 дней",
  all: "Весь период",
};

function daysAgoISO(n: number, from = todayISO()): string {
  const d = new Date(`${from}T12:00:00`);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function filterByPeriod(txs: Transaction[], period: Period, startDate: string): Transaction[] {
  if (period === "all") {
    return txs.filter((t) => t.transactionDate >= startDate);
  }
  const from = daysAgoISO(Number(period) - 1);
  return txs.filter((t) => t.transactionDate >= from);
}

function StatsPage() {
  return (
    <AuthGuard>
      <StatsInner />
    </AuthGuard>
  );
}

function StatsInner() {
  const { snapshot, computed, isPending } = useFinance();
  const [catFilter, setCatFilter] = useState<"all" | AchievementCategory>("all");
  const [period, setPeriod] = useState<Period>("30");
  const [section, setSection] = useState<"overview" | "achievements">("overview");

  const periodTxs = useMemo(() => {
    if (!snapshot) return [];
    return filterByPeriod(snapshot.transactions, period, snapshot.settings.startDate);
  }, [snapshot, period]);

  if (isPending || !snapshot || !computed) {
    return (
      <AppShell title="Статистика">
        <div className="h-48 animate-pulse bg-surface" />
      </AppShell>
    );
  }

  const currency = snapshot.settings.currency ?? "RUB";
  const today = todayISO();

  const incomeTotal = periodTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenseTotal = periodTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = incomeTotal - expenseTotal;

  // Category breakdown for period
  const catMap = new Map<number, number>();
  for (const t of periodTxs) {
    if (t.type !== "expense" || t.categoryId == null) continue;
    catMap.set(t.categoryId, (catMap.get(t.categoryId) ?? 0) + t.amount);
  }
  const catList = [...catMap.entries()]
    .map(([id, amount]) => {
      const category = snapshot.categories.find((c) => c.id === id);
      if (!category) return null;
      return { category, amount, percent: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0 };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => b.amount - a.amount);

  const pie = catList.map((c) => ({
    name: c.category.name,
    value: c.amount,
    color: c.category.color,
  }));

  // Daily expense bars (last N days of period)
  const dayCount = period === "7" ? 7 : period === "30" ? 30 : Math.min(60, Math.max(7, periodTxs.length));
  const dailyBars: { date: string; label: string; expense: number; income: number }[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const date = daysAgoISO(i, today);
    const dayTxs = periodTxs.filter((t) => t.transactionDate === date);
    dailyBars.push({
      date,
      label: date.slice(5), // MM-DD
      expense: dayTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      income: dayTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    });
  }

  // Top expenses in period
  const topExpenses = periodTxs
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Avg daily spend
  const daysWithSpend = new Set(
    periodTxs.filter((t) => t.type === "expense").map((t) => t.transactionDate),
  ).size;
  const avgDaily = daysWithSpend > 0 ? expenseTotal / Math.max(1, dayCount) : 0;

  const unlockedCodes = new Set(snapshot.achievements.map((a) => a.code));
  const unlockedMap = new Map(snapshot.achievements.map((a) => [a.code, a]));
  const gami = computeGamificationStats(
    snapshot.settings.totalXp ?? 0,
    snapshot.settings.longestStreak ?? 0,
    snapshot.settings.totalTransactions ?? snapshot.transactions.length,
    snapshot.settings.daysLogged ?? 0,
    unlockedCodes,
  );
  const visibleDefs = ACHIEVEMENT_DEFS.filter(
    (d) => catFilter === "all" || d.category === catFilter,
  );

  return (
    <AppShell title="Статистика">
      <ThemeSync snapshot={snapshot} />
      <div className="space-y-4">
        {/* Section tabs */}
        <div className="flex gap-1 rounded-xl bg-elevated p-1">
          <button
            type="button"
            onClick={() => setSection("overview")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              section === "overview" ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
            }`}
          >
            Обзор
          </button>
          <button
            type="button"
            onClick={() => setSection("achievements")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              section === "achievements" ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
            }`}
          >
            Достижения ({gami.unlockedCount}/{gami.totalAchievements})
          </button>
        </div>

        {section === "overview" && (
          <>
            {/* Period filter */}
            <div className="flex gap-1.5">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    period === p ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-fg"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted">Доходы</p>
                <p className="mt-1 font-mono text-sm tabular-nums text-ok">
                  +{formatMoney(incomeTotal, currency)}
                </p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted">Расходы</p>
                <p className="mt-1 font-mono text-sm tabular-nums text-danger">
                  −{formatMoney(expenseTotal, currency)}
                </p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted">Итого</p>
                <p
                  className={`mt-1 font-mono text-sm tabular-nums ${
                    net >= 0 ? "text-ok" : "text-danger"
                  }`}
                >
                  {net >= 0 ? "+" : "−"}
                  {formatMoney(Math.abs(net), currency)}
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">Средний расход / день</p>
                <p className="mt-1 font-mono text-base tabular-nums">
                  {formatMoney(avgDaily, currency)}
                </p>
              </Card>
              <Card className="p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">Дневной лимит</p>
                <p className="mt-1 font-mono text-base tabular-nums">
                  {formatMoney(computed.dailyLimit, currency)}
                </p>
              </Card>
              <Card className="p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">Серия</p>
                <p className="mt-1 font-mono text-base tabular-nums">
                  {computed.currentStreak} дн.
                  <span className="ml-1 text-xs text-muted">
                    (рекорд {gami.longestStreak})
                  </span>
                </p>
              </Card>
              <Card className="p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">Баланс</p>
                <p className="mt-1 font-mono text-base tabular-nums">
                  {formatMoney(computed.currentBalance, currency)}
                </p>
              </Card>
            </div>

            {/* Daily chart */}
            <Card>
              <h2 className="font-display text-lg">Динамика расходов</h2>
              <p className="text-xs text-muted">По дням за выбранный период</p>
              {dailyBars.every((d) => d.expense === 0) ? (
                <p className="mt-4 text-sm text-muted">Нет расходов за период.</p>
              ) : (
                <div className="mt-2 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyBars} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: "var(--color-muted)" }}
                        interval="preserveStartEnd"
                        minTickGap={28}
                      />
                      <YAxis hide />
                      <Tooltip
                        formatter={(v) => formatMoney(Number(v), currency)}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.date ? String(payload[0].payload.date) : ""
                        }
                        contentStyle={{
                          background: "var(--color-elevated)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="expense" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Categories */}
            <Card>
              <h2 className="font-display text-lg">По категориям</h2>
              <p className="text-sm text-muted">Расходы · {formatMoney(expenseTotal, currency)}</p>
              {pie.length === 0 ? (
                <p className="mt-4 text-sm text-muted">Пока нет расходов за период.</p>
              ) : (
                <div className="mt-2 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={72}
                        stroke="none"
                      >
                        {pie.map((p) => (
                          <Cell key={p.name} fill={p.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => formatMoney(Number(v), currency)}
                        contentStyle={{
                          background: "var(--color-elevated)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <ul className="mt-1 space-y-2">
                {catList.map((c) => (
                  <li key={c.category.id} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-sm" style={{ background: c.category.color }} />
                    <CategoryIcon name={c.category.icon} className="size-4" />
                    <span className="flex-1 truncate">{c.category.name}</span>
                    <span className="font-mono tabular-nums">{formatMoney(c.amount, currency)}</span>
                    <span className="w-10 text-right text-xs text-muted">{c.percent.toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Envelopes usage */}
            {computed.envelopes.length > 0 && (
              <Card>
                <h2 className="font-display text-lg">Конверты</h2>
                <p className="text-xs text-muted">Использование лимитов (за всё время)</p>
                <ul className="mt-3 space-y-3">
                  {computed.envelopes.map((e) => {
                    const pct = Math.min(100, e.usagePercent);
                    const tone =
                      e.isOverBudget
                        ? "var(--color-danger)"
                        : pct >= 85
                          ? "var(--color-warn)"
                          : "var(--color-ok)";
                    return (
                      <li key={e.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5">
                            <CategoryIcon name={e.icon} className="size-3.5" />
                            {e.name}
                          </span>
                          <span className="font-mono text-xs tabular-nums text-muted">
                            {formatMoney(e.spent, currency)} / {formatMoney(e.budget, currency)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-elevated">
                          <div
                            className="h-full rounded-full transition-[width]"
                            style={{ width: `${pct}%`, background: tone }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {/* Top expenses */}
            {topExpenses.length > 0 && (
              <Card>
                <h2 className="font-display text-lg">Крупные расходы</h2>
                <p className="text-xs text-muted">Топ за выбранный период</p>
                <ul className="mt-3 space-y-2">
                  {topExpenses.map((t) => {
                    const cat = snapshot.categories.find((c) => c.id === t.categoryId);
                    return (
                      <li key={t.id} className="flex items-center gap-2 text-sm">
                        <span className="w-16 shrink-0 text-xs text-muted">{t.transactionDate.slice(5)}</span>
                        <span className="min-w-0 flex-1 truncate">
                          {t.description || cat?.name || "Без названия"}
                        </span>
                        <span className="font-mono tabular-nums text-danger">
                          −{formatMoney(t.amount, currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {/* Projection */}
            <Card>
              <h2 className="font-display text-lg">Прогноз баланса</h2>
              <p className="text-sm text-muted">
                До конца периода, с учётом лимита и фиксированных событий
              </p>
              <div className="mt-2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={computed.projection}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v) => formatMoney(Number(v), currency)}
                      contentStyle={{
                        background: "var(--color-elevated)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <ReferenceLine
                      y={snapshot.settings.finalTarget}
                      stroke="var(--color-muted)"
                      strokeDasharray="4 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="projectedBalance"
                      stroke="var(--color-accent)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Heatmap */}
            {computed.heatmap.length > 0 && (
              <Card>
                <ExpenseHeatmap days={computed.heatmap} currency={currency} />
              </Card>
            )}
          </>
        )}

        {section === "achievements" && (
          <>
            <Card className="overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Уровень</p>
                  <h2 className="font-display text-2xl tabular-nums">
                    {gami.level}{" "}
                    <span className="text-base font-normal text-muted">· {gami.title}</span>
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Всего XP</p>
                  <p className="font-mono text-lg tabular-nums">{gami.totalXp}</p>
                </div>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{ width: `${gami.xpPercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {gami.xpInLevel} / {gami.xpNeeded} XP до уровня {gami.level + 1}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-elevated px-2 py-2">
                  <p className="font-mono text-lg tabular-nums">{gami.longestStreak}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Рекорд серии</p>
                </div>
                <div className="rounded-lg bg-elevated px-2 py-2">
                  <p className="font-mono text-lg tabular-nums">{gami.totalTransactions}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Операций</p>
                </div>
                <div className="rounded-lg bg-elevated px-2 py-2">
                  <p className="font-mono text-lg tabular-nums">
                    {gami.unlockedCount}/{gami.totalAchievements}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Ачивки</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg">Достижения</h2>
                <div className="flex gap-1.5">
                  {(Object.keys(RARITY_LABELS) as AchievementRarity[]).map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px]"
                      style={{ background: `${RARITY_COLORS[r]}22`, color: RARITY_COLORS[r] }}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: RARITY_COLORS[r] }} />
                      {gami.byRarity[r]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCatFilter("all")}
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    catFilter === "all" ? "bg-accent text-accent-fg" : "bg-elevated text-muted"
                  }`}
                >
                  Все
                </button>
                {(Object.keys(CATEGORY_LABELS) as AchievementCategory[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCatFilter(c)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      catFilter === c ? "bg-accent text-accent-fg" : "bg-elevated text-muted"
                    }`}
                  >
                    {CATEGORY_LABELS[c]}{" "}
                    <span className="opacity-70">
                      {gami.byCategory[c].unlocked}/{gami.byCategory[c].total}
                    </span>
                  </button>
                ))}
              </div>

              <ul className="space-y-2">
                {visibleDefs.map((def) => {
                  const unlocked = unlockedMap.get(def.code);
                  const rarityColor = RARITY_COLORS[def.rarity];
                  const justUnlocked =
                    unlocked &&
                    Date.now() - new Date(unlocked.unlockedAt).getTime() < 90_000;
                  return (
                    <li
                      key={def.code}
                      className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-opacity ${
                        unlocked ? "bg-elevated" : "bg-elevated/50 opacity-60"
                      } ${justUnlocked ? "ach-just-unlocked" : ""}`}
                      style={
                        unlocked
                          ? {
                              boxShadow: `inset 3px 0 0 ${rarityColor}`,
                              ["--ach-flash" as string]: rarityColor,
                            }
                          : undefined
                      }
                    >
                      <div
                        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: unlocked ? `${rarityColor}22` : "var(--color-elevated)",
                          color: unlocked ? rarityColor : "var(--color-muted)",
                        }}
                      >
                        <CategoryIcon name={def.icon} className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">
                            {def.secret && !unlocked ? "???" : def.name}
                          </p>
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                            style={{ background: `${rarityColor}22`, color: rarityColor }}
                          >
                            {RARITY_LABELS[def.rarity]}
                          </span>
                          {unlocked && (
                            <span className="ml-auto text-[10px] text-muted">+{def.xpReward} XP</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {def.secret && !unlocked
                            ? "Секретное достижение — откройте сами"
                            : def.description}
                        </p>
                        {unlocked && (
                          <p className="mt-1 text-[10px] text-muted">
                            Открыто {new Date(unlocked.unlockedAt).toLocaleDateString("ru-RU")}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
