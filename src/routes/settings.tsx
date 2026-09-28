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
import {
  CURRENCIES,
  type Category,
  type CategoryKind,
  type CurrencyCode,
  type RecurringTransaction,
} from "@/lib/finance/types";
import { formatMoney, cn } from "@/lib/utils";
import { RecurringForm, RecurringList } from "@/components/finance/recurring-form";
import { CategoryIcon } from "@/lib/finance/icons";
import { GoalsPanel } from "@/components/finance/goals-panel";

export const Route = createFileRoute("/settings")({ component: Page });

const CAT_COLORS = [
  "#5C6B5A",
  "#4A5C6A",
  "#5A5366",
  "#6A5E4A",
  "#4A6566",
  "#6A4A4A",
  "#5A4A5C",
  "#4A4F66",
  "#3F6B5C",
  "#5C5C58",
];

const CAT_ICONS = [
  "utensils",
  "bus",
  "gamepad-2",
  "house",
  "phone",
  "heart-pulse",
  "shirt",
  "gift",
  "wallet",
  "ellipsis",
  "award",
];

function Page() {
  return (
    <AuthGuard>
      <Inner />
    </AuthGuard>
  );
}

function CategoryManager({
  kind,
  title,
  categories,
  pending,
  onSave,
  onDelete,
}: {
  kind: CategoryKind;
  title: string;
  categories: Category[];
  pending: boolean;
  onSave: (d: { id?: number; name: string; color: string; icon: string; kind: CategoryKind }) => void;
  onDelete: (id: number) => void;
}) {
  const list = categories.filter((c) => (c.kind ?? "expense") === kind);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CAT_COLORS[0]);
  const [icon, setIcon] = useState(kind === "income" ? "wallet" : "ellipsis");
  const [editing, setEditing] = useState<Category | null>(null);

  const resetForm = () => {
    setName("");
    setColor(CAT_COLORS[0]);
    setIcon(kind === "income" ? "wallet" : "ellipsis");
    setEditing(null);
  };

  return (
    <Card>
      <h2 className="font-display text-lg">{title}</h2>
      <ul className="mt-3 space-y-2">
        {list.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: c.color + "33", color: c.color }}
              >
                <CategoryIcon name={c.icon} className="size-4" />
              </span>
              <span className="truncate">{c.name}</span>
            </span>
            <span className="flex shrink-0 gap-2">
              <button
                type="button"
                className="text-xs text-muted underline-offset-2 hover:underline"
                onClick={() => {
                  setEditing(c);
                  setName(c.name);
                  setColor(c.color);
                  setIcon(c.icon);
                }}
              >
                Изменить
              </button>
              <button
                type="button"
                className="text-xs text-danger"
                onClick={() => {
                  if (confirm(`Удалить категорию «${c.name}»? Операции сохранятся без категории.`)) {
                    onDelete(c.id);
                  }
                }}
              >
                Удалить
              </button>
            </span>
          </li>
        ))}
        {list.length === 0 && <li className="text-sm text-muted">Пока нет категорий</li>}
      </ul>

      <form
        className="mt-3 space-y-2 border-t border-border pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const n = (editing ? name || editing.name : name).trim();
          if (!n) return;
          onSave({
            id: editing?.id,
            name: n,
            color: editing && !name ? editing.color : color,
            icon: editing && !name ? editing.icon : icon,
            kind,
          });
          resetForm();
        }}
      >
        <Label>{editing ? "Редактировать категорию" : "Новая категория"}</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={kind === "income" ? "Зарплата" : "Еда"}
        />
        <div>
          <p className="mb-1 text-xs text-muted">Цвет</p>
          <div className="flex flex-wrap gap-1.5">
            {CAT_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setColor(col)}
                className={cn(
                  "size-7 rounded-full border-2",
                  color === col ? "border-fg" : "border-transparent",
                )}
                style={{ background: col }}
                aria-label={col}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted">Иконка</p>
          <div className="flex flex-wrap gap-1.5">
            {CAT_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border",
                  icon === ic ? "border-accent bg-accent text-accent-fg" : "border-border bg-elevated",
                )}
              >
                <CategoryIcon name={ic} className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary" className="flex-1" disabled={pending}>
            {editing ? "Сохранить" : "Добавить"}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Отмена
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function Inner() {
  const user = useCurrentUser();
  const { snapshot, computed, isPending } = useFinance();
  const mut = useFinanceMutations();
  const [userName, setUserName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [initial, setInitial] = useState("");
  const [target, setTarget] = useState("");
  const [dark, setDark] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("RUB");
  const [eventDesc, setEventDesc] = useState("");
  const [eventAmt, setEventAmt] = useState("");
  const [eventDate, setEventDate] = useState("");
  /** Type of new fixed event: expense → amount stored as negative */
  const [eventKind, setEventKind] = useState<"expense" | "income">("expense");
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);

  useEffect(() => {
    if (!snapshot) return;
    setUserName(snapshot.settings.userName || user?.displayName || "");
    setStartDate(snapshot.settings.startDate);
    setEndDate(snapshot.settings.endDate);
    setInitial(String(snapshot.settings.initialBalance));
    setTarget(String(snapshot.settings.finalTarget));
    setDark(snapshot.settings.darkTheme);
    setCurrency(snapshot.settings.currency ?? "RUB");
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

  const catPending = mut.saveCat.isPending || mut.deleteCat.isPending;

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
          <p className="mt-1 text-xs text-muted">
            За 3 дня до конца и в день окончания периода на главной появится
            баннер с предложением начать новый период.
          </p>
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
          <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-between gap-3">
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

          <div className="mt-4">
            <Label>Валюта</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className={`flex min-h-11 items-center gap-2 border px-3 py-2 text-left text-sm transition-colors ${
                    currency === c.code
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-elevated text-fg hover:border-border-strong"
                  }`}
                >
                  <span className="text-base font-semibold tabular-nums">{c.symbol}</span>
                  <span className="truncate text-xs opacity-90">{c.code}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Пример: {formatMoney(12345.67, currency)}</p>
          </div>

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
                currency,
              })
            }
          >
            Сохранить все настройки
          </Button>
        </Card>

        {snapshot && computed && (
          <GoalsPanel snapshot={snapshot} computed={computed} mode="full" />
        )}

        {/* 2. Фиксированные события — сразу после бюджетного периода */}
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
                  <span className="ml-1 text-xs text-muted">
                    {ev.amount < 0 ? "(расход)" : "(доход)"}
                  </span>
                </span>
                <span className="flex items-center gap-2 font-mono tabular-nums">
                  {formatMoney(ev.amount, currency)}
                  <button
                    type="button"
                    className="text-danger"
                    onClick={() => mut.deleteEvent.mutate({ id: ev.id })}
                  >
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
              const raw = Math.abs(Number(eventAmt.replace(",", ".").replace(/^\+/, "")));
              if (!Number.isFinite(raw) || raw === 0 || !eventDesc.trim() || !eventDate) return;
              // Expense → negative amount; income → positive. User never needs to type «−».
              const amount = eventKind === "expense" ? -raw : raw;
              mut.saveEvent.mutate(
                { amount, description: eventDesc.trim(), eventDate },
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
            <Label>Новое событие</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEventKind("expense")}
                className={cn(
                  "h-9 flex-1 rounded-[10px] text-sm font-medium",
                  eventKind === "expense" ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
                )}
              >
                Расход
              </button>
              <button
                type="button"
                onClick={() => setEventKind("income")}
                className={cn(
                  "h-9 flex-1 rounded-[10px] text-sm font-medium",
                  eventKind === "income" ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
                )}
              >
                Доход
              </button>
            </div>
            <Input
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              placeholder={eventKind === "expense" ? "Аренда / коммуналка" : "Зарплата / бонус"}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                inputMode="decimal"
                value={eventAmt}
                onChange={(e) => setEventAmt(e.target.value)}
                placeholder="Сумма (без знака)"
              />
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <p className="text-xs text-muted">
              {eventKind === "expense"
                ? "Сумма будет сохранена как расход (отрицательная)."
                : "Сумма будет сохранена как доход (положительная)."}
            </p>
            <Button type="submit" variant="secondary" className="w-full" disabled={mut.saveEvent.isPending}>
              {mut.saveEvent.isPending ? "Добавляю…" : "Добавить событие"}
            </Button>
            {mut.saveEvent.isError && (
              <p className="text-sm text-danger">Не удалось добавить событие. Попробуйте ещё раз.</p>
            )}
          </form>
        </Card>

        {/* 3. Повторяющиеся */}
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg">Повторяющиеся</h2>
            {!showRecurringForm && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingRecurring(null);
                  setShowRecurringForm(true);
                }}
              >
                Добавить
              </Button>
            )}
          </div>

          {(showRecurringForm || editingRecurring) && (
            <div className="mb-4 rounded-[12px] border border-border bg-surface p-3">
              <RecurringForm
                categories={snapshot.categories}
                envelopes={snapshot.envelopes}
                currency={currency}
                pending={mut.saveRecurring.isPending}
                initial={editingRecurring}
                onCancel={() => {
                  setShowRecurringForm(false);
                  setEditingRecurring(null);
                }}
                onSubmit={(data) => {
                  mut.saveRecurring.mutate(data, {
                    onSuccess: () => {
                      setShowRecurringForm(false);
                      setEditingRecurring(null);
                    },
                  });
                }}
              />
              {mut.saveRecurring.isError && (
                <p className="mt-2 text-sm text-danger">Не удалось сохранить. Попробуйте ещё раз.</p>
              )}
            </div>
          )}

          <RecurringList
            items={snapshot.recurring ?? []}
            currency={currency}
            pendingId={
              mut.pauseRecurring.isPending || mut.deleteRecurring.isPending
                ? ((mut.pauseRecurring.variables as { id?: number } | undefined)?.id ??
                  (mut.deleteRecurring.variables as { id?: number } | undefined)?.id ??
                  null)
                : null
            }
            onEdit={(item) => {
              setEditingRecurring(item);
              setShowRecurringForm(true);
            }}
            onPause={(id, isActive) => mut.pauseRecurring.mutate({ id, isActive })}
            onDelete={(id) => mut.deleteRecurring.mutate({ id })}
          />
        </Card>

        {/* 4–5. Категории */}
        <CategoryManager
          kind="expense"
          title="Категории расходов"
          categories={snapshot.categories}
          pending={catPending}
          onSave={(d) => mut.saveCat.mutate(d)}
          onDelete={(id) => mut.deleteCat.mutate({ id })}
        />

        <CategoryManager
          kind="income"
          title="Категории доходов"
          categories={snapshot.categories}
          pending={catPending}
          onSave={(d) => mut.saveCat.mutate(d)}
          onDelete={(id) => mut.deleteCat.mutate({ id })}
        />

        {/* 6. Уведомления */}
        <Card>
          <h2 className="font-display text-lg">Уведомления о лимите</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            <li>· При достижении 80% дневного лимита — предупреждение</li>
            <li>· При превышении дневного лимита — уведомление об ошибке</li>
            <li>· При перерасходе конверта — отдельное уведомление</li>
            <li>
              · За 3 дня до конца периода и после его окончания — баннер с
              предложением начать новый период
            </li>
          </ul>
          <p className="mt-2 text-xs text-subtle">
            Уведомления показываются в приложении (toast). Повторы в рамках
            одной сессии не дублируются.
          </p>
        </Card>

        {/* 7. Опасная зона — свёрнута по умолчанию, в самом низу */}
        <Card className="border-border/60">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-left"
            onClick={() => setDangerOpen((v) => !v)}
            aria-expanded={dangerOpen}
          >
            <span className="text-sm font-medium text-muted">Опасная зона</span>
            <span className="text-xs text-subtle">{dangerOpen ? "Скрыть" : "Показать"}</span>
          </button>
          {dangerOpen && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-sm text-muted">
                Сбросит операции, конверты, события и достижения. Профиль входа
                сохранится.
              </p>
              <Button
                variant="danger"
                className="mt-3 w-full"
                onClick={() => {
                  if (confirm("Точно сбросить все финансовые данные?")) {
                    mut.reset.mutate(undefined as never);
                  }
                }}
              >
                Сбросить данные
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
