import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, MessageSquareText, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { AddExpenseForm } from "@/components/finance/add-expense";
import { EnvelopeCircle } from "@/components/finance/envelope-circle";
import { ExpenseHeatmap } from "@/components/finance/heatmap";
import { EditTxDialog, TransactionList } from "@/components/finance/tx-list";
import { ThemeSync } from "@/components/theme-sync";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useFinance, useFinanceMutations } from "@/lib/finance/use-finance";
import { formatMoney } from "@/lib/utils";
import type { Transaction } from "@/lib/finance/types";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
 return (
 <AuthGuard>
 <Dashboard />
 </AuthGuard>
 );
}

function Dashboard() {
 const { snapshot, computed, isPending, error } = useFinance();
 const mut = useFinanceMutations();
 const [edit, setEdit] = useState<Transaction | null>(null);
 const [smsOpen, setSmsOpen] = useState(false);
 const [aiOpen, setAiOpen] = useState(false);
 const [smsText, setSmsText] = useState("");
 const [smsReport, setSmsReport] = useState<string | null>(null);

 if (isPending || !snapshot || !computed) {
 return (
 <AppShell title="Сегодня">
 <div className="h-40 animate-pulse bg-surface" />
 </AppShell>
 );
 }
 if (error) {
 return (
 <AppShell title="Сегодня">
 <p className="text-sm text-danger">Не удалось загрузить данные.</p>
 </AppShell>
 );
 }

 const currency = snapshot.settings.currency ?? "RUB";
 const bar = Math.min(100, computed.progressPercent) / 100;
 const barColor =
 computed.progressTone === "green"
 ? "var(--color-ok)"
 : computed.progressTone === "yellow"
 ? "var(--color-warn)"
 : "var(--color-danger)";

 return (
 <AppShell title="Сегодня">
 <ThemeSync snapshot={snapshot} />
 <div className="space-y-4">
 <Card className="p-5 shadow-sm">
 <p className="text-xs font-medium uppercase tracking-wide text-muted">Осталось на сегодня</p>
 <p className="mt-1 font-display text-4xl tabular-nums tracking-tight text-fg">
 {formatMoney(computed.remainingToday, currency)}
 </p>
 <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-elevated">
 <div
 className="h-full rounded-full transition-[width] duration-300"
 style={{ width: `${bar * 100}%`, background: barColor }}
 />
 </div>
 <p className="mt-2 text-xs text-muted">
 Лимит {formatMoney(computed.dailyLimit, currency)} · потрачено {formatMoney(computed.spentToday, currency)}
 </p>
 </Card>

 <div className="grid grid-cols-2 gap-2">
 <Stat label="Дневной план" value={formatMoney(computed.dailyLimit, currency)} />
 <Stat label="Потрачено" value={formatMoney(computed.spentToday, currency)} />
 <Stat label="Баланс" value={formatMoney(computed.currentBalance, currency)} />
 <Stat label="Дней осталось" value={String(computed.daysRemaining)} />
 <Stat label="Цель" value={formatMoney(snapshot.settings.finalTarget, currency)} />
 <Stat label="Серия" value={`${computed.currentStreak} дн.`} />
 </div>

 <Card>
 <p className="text-sm font-medium">Совет</p>
 <p className="mt-1 text-sm text-muted">{computed.aiTip}</p>
 </Card>

 <Card>
 <div className="mb-3 flex items-center justify-between">
 <h2 className="font-display text-lg">Конверты</h2>
 <Link to="/envelopes" className="text-xs font-medium text-accent">
 Управление
 </Link>
 </div>
 <div className="flex gap-2 overflow-x-auto pb-1">
 {computed.envelopes.map((e) => (
 <EnvelopeCircle key={e.id} item={e} currency={currency} />
 ))}
 </div>
 <p className="mt-3 text-xs text-muted">Свободные: {formatMoney(computed.freeMoney, currency)}</p>
 </Card>

 <Card>
 <h2 className="mb-3 font-display text-lg">Быстрый расход</h2>
 <AddExpenseForm
 categories={snapshot.categories}
 envelopes={snapshot.envelopes}
 pending={mut.addTx.isPending}
 onAdd={(d) => mut.addTx.mutate(d)}
 />
 </Card>

 <div className="grid grid-cols-2 gap-2">
 <Button variant="secondary" onClick={() => setSmsOpen(true)}>
 <MessageSquareText className="size-4" /> SMS
 </Button>
 <Button variant="secondary" onClick={() => setAiOpen(true)}>
 <Bot className="size-4" /> AI-совет
 </Button>
 <Link to="/stats" className="col-span-1">
 <Button variant="secondary" className="w-full">
 <Sparkles className="size-4" /> Статистика
 </Button>
 </Link>
 <Link to="/settings">
 <Button variant="secondary" className="w-full">
 Настройки
 </Button>
 </Link>
 </div>

 <Card>
 <h2 className="mb-3 font-display text-lg">История</h2>
 <TransactionList
 groups={computed.transactionsByDay}
         currency={currency}
 categories={snapshot.categories}
 envelopes={snapshot.envelopes}
 onEdit={setEdit}
 onDelete={(id) => mut.deleteTx.mutate({ id })}
 onBulkDay={(day) => mut.bulkDelete.mutate({ day })}
 />
 </Card>

 <Card>
 <ExpenseHeatmap days={computed.heatmap} currency={currency} />
 </Card>
 </div>

 <EditTxDialog
 key={edit?.id ?? "none"}
 tx={edit}
 onClose={() => setEdit(null)}
 onSave={(t) => {
 mut.updateTx.mutate({
 id: t.id,
 amount: t.amount,
 description: t.description,
 transactionDate: t.transactionDate,
 categoryId: t.categoryId,
 envelopeId: t.envelopeId,
 });
 setEdit(null);
 }}
 />

 {smsOpen && (
 <Modal title="Импорт SMS" onClose={() => setSmsOpen(false)}>
 <p className="mb-2 text-sm text-muted">
 Вставьте текст сообщений банка. Сумма ищется по словам «оплата», «покупка», «списание».
 </p>
 <Textarea value={smsText} onChange={(e) => setSmsText(e.target.value)} placeholder="Покупка 1250.00 RUB Пятёрочка" />
 {smsReport && <p className="mt-2 text-sm">{smsReport}</p>}
 <Button
 className="mt-3 w-full"
 disabled={mut.importSms.isPending}
 onClick={async () => {
 const res = await mut.importSms.mutateAsync({ text: smsText });
 setSmsReport(`Успешно добавлено операций: ${res.successCount}`);
 setSmsText("");
 }}
 >
 Разобрать и добавить
 </Button>
 </Modal>
 )}

 {aiOpen && (
 <Modal title="Финансовый советник" onClose={() => setAiOpen(false)}>
 <p className="text-sm text-muted">Анализ расходов за 30 дней. Запрос выполняется только по кнопке.</p>
 <Button
 className="mt-3 w-full"
 disabled={mut.askAi.isPending}
 onClick={() => mut.askAi.mutate()}
 >
 Получить 3 совета
 </Button>
 {mut.askAi.data && (
 <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
 {mut.askAi.data.ok ? mut.askAi.data.text : mut.askAi.data.error}
 </div>
 )}
 </Modal>
 )}
 </AppShell>
 );
}

function Stat({ label, value }: { label: string; value: string }) {
 return (
 <Card className="p-3">
 <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
 <p className="mt-1 font-mono text-sm tabular-nums">{value}</p>
 </Card>
 );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end p-4 sm:place-items-center" style={{ background: "var(--color-overlay)" }} onClick={onClose}>
      <div className="glass-strong w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg">{title}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
