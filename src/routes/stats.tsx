import { createFileRoute } from "@tanstack/react-router";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/lib/finance/icons";
import { useFinance } from "@/lib/finance/use-finance";
import { formatMoney } from "@/lib/utils";
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

export const Route = createFileRoute("/stats")({ component: StatsPage });

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
 if (isPending || !snapshot || !computed) {
 return (
 <AppShell title="Статистика">
 <div className="h-48 animate-pulse bg-surface" />
 </AppShell>
 );
 }
 const currency = snapshot.settings.currency ?? "RUB";
 const total = computed.categoryBreakdown.reduce((s, c) => s + c.amount, 0);
 const pie = computed.categoryBreakdown.map((c) => ({
 name: c.category.name,
 value: c.amount,
 color: c.category.color,
 }));
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
 <Card>
 <h2 className="font-display text-lg">По категориям</h2>
 <p className="text-sm text-muted">Всего {formatMoney(total, currency)}</p>
 {pie.length === 0 ? (
 <p className="mt-4 text-sm text-muted">Пока нет расходов за период.</p>
 ) : (
 <div className="mt-2 h-52">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie data={pie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} stroke="none">
 {pie.map((p) => (
 <Cell key={p.name} fill={p.color} />
 ))}
 </Pie>
 <Tooltip formatter={(v) => formatMoney(Number(v, currency))} />
 </PieChart>
 </ResponsiveContainer>
 </div>
 )}
 <ul className="space-y-2">
 {computed.categoryBreakdown.map((c) => (
 <li key={c.category.id} className="flex items-center gap-2 text-sm">
 <span className="size-2.5 " style={{ background: c.category.color }} />
 <CategoryIcon name={c.category.icon} className="size-4" />
 <span className="flex-1">{c.category.name}</span>
 <span className="font-mono tabular-nums">{formatMoney(c.amount, currency)}</span>
 <span className="w-10 text-right text-xs text-muted">{c.percent.toFixed(0)}%</span>
 </li>
 ))}
 </ul>
 </Card>

 <Card>
 <h2 className="font-display text-lg">Прогноз баланса</h2>
 <p className="text-sm text-muted">До конца периода, с учётом лимита и фиксированных событий</p>
 <div className="mt-2 h-48">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={computed.projection}>
 <XAxis dataKey="date" hide />
 <YAxis hide />
 <Tooltip formatter={(v) => formatMoney(Number(v, currency))} />
 <ReferenceLine y={snapshot.settings.finalTarget} stroke="var(--color-muted)" strokeDasharray="4 4" />
 <Line type="monotone" dataKey="projectedBalance" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </Card>

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

 {/* Category filters */}
 <div className="mb-3 flex flex-wrap gap-1.5">
 <button
 type="button"
 onClick={() => setCatFilter("all")}
 className={`rounded-full px-2.5 py-1 text-xs ${catFilter === "all" ? "bg-accent text-accent-fg" : "bg-elevated text-muted"}`}
 >
 Все
 </button>
 {(Object.keys(CATEGORY_LABELS) as AchievementCategory[]).map((c) => (
 <button
 key={c}
 type="button"
 onClick={() => setCatFilter(c)}
 className={`rounded-full px-2.5 py-1 text-xs ${catFilter === c ? "bg-accent text-accent-fg" : "bg-elevated text-muted"}`}
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
 <div className="flex items-center gap-2">
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
 </div>
 </AppShell>
 );
}
