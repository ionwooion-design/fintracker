import { createFileRoute } from "@tanstack/react-router";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/lib/finance/icons";
import { useFinance } from "@/lib/finance/use-finance";
import { formatRub } from "@/lib/utils";
import { ThemeSync } from "@/components/theme-sync";

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
 if (isPending || !snapshot || !computed) {
 return (
 <AppShell title="Статистика">
 <div className="h-48 animate-pulse bg-surface" />
 </AppShell>
 );
 }
 const total = computed.categoryBreakdown.reduce((s, c) => s + c.amount, 0);
 const pie = computed.categoryBreakdown.map((c) => ({
 name: c.category.name,
 value: c.amount,
 color: c.category.color,
 }));

 return (
 <AppShell title="Статистика">
 <ThemeSync snapshot={snapshot} />
 <div className="space-y-4">
 <Card>
 <h2 className="font-display text-lg">По категориям</h2>
 <p className="text-sm text-muted">Всего {formatRub(total)}</p>
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
 <Tooltip formatter={(v) => formatRub(Number(v))} />
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
 <span className="font-mono tabular-nums">{formatRub(c.amount)}</span>
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
 <Tooltip formatter={(v) => formatRub(Number(v))} />
 <ReferenceLine y={snapshot.settings.finalTarget} stroke="var(--color-muted)" strokeDasharray="4 4" />
 <Line type="monotone" dataKey="projectedBalance" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </Card>

 <Card>
 <h2 className="font-display text-lg">Достижения</h2>
 {snapshot.achievements.length === 0 ? (
 <p className="mt-2 text-sm text-muted">Пока пусто — держите дневной лимит несколько дней подряд.</p>
 ) : (
 <ul className="mt-3 space-y-2">
 {snapshot.achievements.map((a) => (
 <li key={a.id} className="flex items-center gap-3 bg-elevated px-3 py-2">
 <CategoryIcon name={a.icon} className="size-5" />
 <div>
 <p className="text-sm font-medium">{a.name}</p>
 <p className="text-xs text-muted">{a.description}</p>
 </div>
 </li>
 ))}
 </ul>
 )}
 </Card>
 </div>
 </AppShell>
 );
}
