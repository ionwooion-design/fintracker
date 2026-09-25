import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { ThemeSync } from "@/components/theme-sync";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useFinance, useFinanceMutations } from "@/lib/finance/use-finance";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/settings")({ component: Page });

function Page() {
 return (
 <AuthGuard>
 <Inner />
 </AuthGuard>
 );
}

function Inner() {
 const user = useCurrentUser();
 const { snapshot, isPending } = useFinance();
 const mut = useFinanceMutations();
 const [userName, setUserName] = useState("");
 const [startDate, setStartDate] = useState("");
 const [endDate, setEndDate] = useState("");
 const [initial, setInitial] = useState("");
 const [target, setTarget] = useState("");
 const [dark, setDark] = useState(false);
 const [eventDesc, setEventDesc] = useState("");
 const [eventAmt, setEventAmt] = useState("");
 const [eventDate, setEventDate] = useState("");
 const [filter, setFilter] = useState<"all" | "in" | "out">("all");

 useEffect(() => {
 if (!snapshot) return;
 setUserName(snapshot.settings.userName || user?.displayName || "");
 setStartDate(snapshot.settings.startDate);
 setEndDate(snapshot.settings.endDate);
 setInitial(String(snapshot.settings.initialBalance));
 setTarget(String(snapshot.settings.finalTarget));
 setDark(snapshot.settings.darkTheme);
 }, [snapshot, user?.displayName]);

 if (isPending || !snapshot) {
 return (
 <AppShell title="Настройки">
 <div className="h-40 animate-pulse bg-surface" />
 </AppShell>
 );
 }

 const events = snapshot.fixedEvents.filter((e) => {
 if (filter === "in") return e.amount > 0;
 if (filter === "out") return e.amount < 0;
 return true;
 });

 return (
 <AppShell title="Настройки">
 <ThemeSync snapshot={snapshot} />
 <div className="space-y-4">
 <Card>
 <h2 className="font-display text-lg">Профиль</h2>
 <p className="text-xs text-muted">{user?.primaryEmail}</p>
 <div className="mt-3">
 <Label>Имя</Label>
 <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
 </div>
 </Card>

 <Card>
 <h2 className="font-display text-lg">Бюджетный период</h2>
 <div className="mt-3 grid grid-cols-2 gap-2">
 <div>
 <Label>Начало</Label>
 <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
 </div>
 <div>
 <Label>Конец</Label>
 <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
 </div>
 <div>
 <Label>Стартовый баланс</Label>
 <Input inputMode="decimal" value={initial} onChange={(e) => setInitial(e.target.value)} />
 </div>
 <div>
 <Label>Целевой баланс</Label>
 <Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
 </div>
 </div>
 <label className="mt-4 flex min-h-11 items-center justify-between gap-3 cursor-pointer">
            <span className="text-sm">Тёмная тема</span>
            <button
              type="button"
              role="switch"
              aria-checked={dark}
              onClick={() => setDark(!dark)}
              className={`relative h-7 w-12 border border-border transition-colors ${dark ? "bg-accent" : "bg-elevated"}`}
            >
              <span
                className={`absolute top-0.5 size-6 bg-accent-fg transition-transform ${dark ? "left-5" : "left-0.5"}`}
                style={{ background: dark ? "var(--color-accent-fg)" : "var(--color-fg)" }}
              />
            </button>
          </label>
 <Button
 className="mt-4 w-full"
 disabled={mut.saveSettings.isPending}
 onClick={() =>
 mut.saveSettings.mutate({
 userName,
 startDate,
 endDate,
 initialBalance: Number(initial.replace(",", ".")),
 finalTarget: Number(target.replace(",", ".")),
 darkTheme: dark,
 privacyAccepted: true,
 })
 }
 >
 Сохранить все настройки
 </Button>
 </Card>

 <Card>
 <h2 className="font-display text-lg">Фиксированные события</h2>
 <div className="mt-2 flex gap-1">
 {(["all", "in", "out"] as const).map((f) => (
 <button
 key={f}
 type="button"
 onClick={() => setFilter(f)}
 className={`h-9 px-3 text-xs ${filter === f ? "bg-accent text-accent-fg" : "bg-elevated text-muted"}`}
 >
 {f === "all" ? "Все" : f === "in" ? "Доходы" : "Расходы"}
 </button>
 ))}
 </div>
 <ul className="mt-3 space-y-2">
 {events.map((ev) => (
 <li key={ev.id} className="flex items-center justify-between text-sm">
 <span>
 {ev.eventDate} · {ev.description}
 </span>
 <span className="flex items-center gap-2 font-mono tabular-nums">
 {ev.amount} ₽
 <button type="button" className="text-danger" onClick={() => mut.deleteEvent.mutate({ id: ev.id })}>
 Удалить
 </button>
 </span>
 </li>
 ))}
 </ul>
 <form
 className="mt-3 space-y-2"
 onSubmit={(e) => {
 e.preventDefault();
 const n = Number(eventAmt.replace(",", "."));
 if (!Number.isFinite(n) || n === 0 || !eventDesc.trim() || !eventDate) return;
 mut.saveEvent.mutate(
 { amount: n, description: eventDesc.trim(), eventDate },
 {
 onSuccess: () => {
 setEventAmt("");
 setEventDesc("");
 setEventDate("");
 },
 },
 );
 }}
 >
 <Label>Новое событие (минус = расход)</Label>
 <Input value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="Зарплата / аренда" />
 <div className="grid grid-cols-2 gap-2">
 <Input inputMode="decimal" value={eventAmt} onChange={(e) => setEventAmt(e.target.value)} placeholder="Сумма" />
 <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
 </div>
 <Button type="submit" variant="secondary" className="w-full" disabled={mut.saveEvent.isPending}>
 {mut.saveEvent.isPending ? "Добавляю…" : "Добавить событие"}
 </Button>
 {mut.saveEvent.isError && (
 <p className="text-sm text-danger">Не удалось добавить событие. Попробуйте ещё раз.</p>
 )}
 </form>
 </Card>

 <Card>
 <h2 className="font-display text-lg">Опасная зона</h2>
 <p className="mt-1 text-sm text-muted">
 Сбросит операции, конверты, события и достижения. Профиль входа сохранится.
 </p>
 <Button
 variant="danger"
 className="mt-3 w-full"
 onClick={() => {
 if (confirm("Точно сбросить все финансовые данные?")) mut.reset.mutate(undefined as never);
 }}
 >
 Сбросить данные
 </Button>
 </Card>
 </div>
 </AppShell>
 );
}
