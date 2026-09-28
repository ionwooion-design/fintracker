import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CategoryIcon } from "@/lib/finance/icons";
import { todayISO, formatMoney, cn } from "@/lib/utils";
import type {
  Category,
  CurrencyCode,
  Envelope,
  RecurringFrequency,
  RecurringTransaction,
} from "@/lib/finance/types";

const FREQ_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "daily", label: "Ежедневно" },
  { value: "weekly", label: "Еженедельно" },
  { value: "monthly", label: "Ежемесячно" },
  { value: "yearly", label: "Ежегодно" },
];

const DOW_OPTIONS = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
  { value: 0, label: "Вс" },
];

export type RecurringFormValues = {
  id?: number;
  amount: number;
  type: "income" | "expense";
  description: string;
  categoryId: number | null;
  envelopeId: number | null;
  frequency: RecurringFrequency;
  interval: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  monthOfYear: number | null;
  startDate: string;
  endDate: string | null;
  autoCreate: boolean;
  isActive: boolean;
};

const emptyForm = (): Omit<RecurringFormValues, "amount"> & { amount: string } => ({
  amount: "",
  type: "expense",
  description: "",
  categoryId: null,
  envelopeId: null,
  frequency: "monthly",
  interval: 1,
  dayOfWeek: null,
  dayOfMonth: new Date().getDate(),
  monthOfYear: new Date().getMonth() + 1,
  startDate: todayISO(),
  endDate: null,
  autoCreate: true,
  isActive: true,
});

export function RecurringForm({
  categories,
  envelopes,
  pending,
  initial,
  currency = "RUB",
  onSubmit,
  onCancel,
}: {
  categories: Category[];
  envelopes: Envelope[];
  pending?: boolean;
  initial?: RecurringTransaction | null;
  currency?: CurrencyCode;
  onSubmit: (data: RecurringFormValues) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!initial) {
      setForm(emptyForm());
      return;
    }
    setForm({
      id: initial.id,
      amount: String(initial.amount),
      type: initial.type,
      description: initial.description,
      categoryId: initial.categoryId,
      envelopeId: initial.envelopeId,
      frequency: initial.frequency,
      interval: initial.interval,
      dayOfWeek: initial.dayOfWeek,
      dayOfMonth: initial.dayOfMonth,
      monthOfYear: initial.monthOfYear,
      startDate: initial.startDate,
      endDate: initial.endDate,
      autoCreate: initial.autoCreate,
      isActive: initial.isActive,
    });
  }, [initial]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(String(form.amount).replace(",", "."));
        if (!Number.isFinite(n) || n <= 0) return;
        if (!form.description.trim()) return;
        onSubmit({
          id: form.id,
          amount: n,
          type: form.type,
          description: form.description.trim(),
          categoryId: form.categoryId,
          envelopeId: form.type === "expense" ? form.envelopeId : null,
          frequency: form.frequency,
          interval: Math.max(1, Number(form.interval) || 1),
          dayOfWeek: form.frequency === "weekly" ? form.dayOfWeek : null,
          dayOfMonth:
            form.frequency === "monthly" || form.frequency === "yearly"
              ? form.dayOfMonth
              : null,
          monthOfYear: form.frequency === "yearly" ? form.monthOfYear : null,
          startDate: form.startDate,
          endDate: form.endDate || null,
          autoCreate: form.autoCreate,
          isActive: form.isActive,
        });
      }}
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => set("type", "expense")}
          className={cn(
            "h-9 flex-1 rounded-[10px] text-sm font-medium",
            form.type === "expense" ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
          )}
        >
          Расход
        </button>
        <button
          type="button"
          onClick={() => set("type", "income")}
          className={cn(
            "h-9 flex-1 rounded-[10px] text-sm font-medium",
            form.type === "income" ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
          )}
        >
          Доход
        </button>
      </div>

      <div>
        <Label>Описание</Label>
        <Input
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Зарплата, аренда, Netflix…"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Сумма</Label>
          <Input
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <div>
          <Label>Начало</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label>Периодичность</Label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {FREQ_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => set("frequency", o.value)}
              className={cn(
                "h-10 rounded-[10px] text-sm font-medium",
                form.frequency === o.value
                  ? "bg-accent text-accent-fg"
                  : "bg-elevated text-muted",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Интервал (каждые N)</Label>
          <Input
            inputMode="numeric"
            value={String(form.interval)}
            onChange={(e) => set("interval", Math.max(1, Number(e.target.value) || 1))}
            min={1}
          />
        </div>
        <div>
          <Label>Конец (необяз.)</Label>
          <Input
            type="date"
            value={form.endDate ?? ""}
            onChange={(e) => set("endDate", e.target.value || null)}
          />
        </div>
      </div>

      {form.frequency === "weekly" && (
        <div>
          <Label>День недели</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {DOW_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => set("dayOfWeek", d.value)}
                className={cn(
                  "h-9 min-w-9 rounded-[10px] px-2 text-xs font-medium",
                  form.dayOfWeek === d.value
                    ? "bg-accent text-accent-fg"
                    : "bg-elevated text-muted",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(form.frequency === "monthly" || form.frequency === "yearly") && (
        <div>
          <Label>День месяца</Label>
          <Input
            inputMode="numeric"
            value={String(form.dayOfMonth ?? 1)}
            onChange={(e) => {
              const v = Math.min(31, Math.max(1, Number(e.target.value) || 1));
              set("dayOfMonth", v);
            }}
            min={1}
            max={31}
          />
        </div>
      )}

      {form.frequency === "yearly" && (
        <div>
          <Label>Месяц</Label>
          <Input
            inputMode="numeric"
            value={String(form.monthOfYear ?? 1)}
            onChange={(e) => {
              const v = Math.min(12, Math.max(1, Number(e.target.value) || 1));
              set("monthOfYear", v);
            }}
            min={1}
            max={12}
          />
        </div>
      )}

      {(form.type === "expense" || form.type === "income") && (
        <>
          <div>
            <Label>Категория</Label>
            <div className="-mx-1 mt-1 flex gap-2 overflow-x-auto pb-1">
              {categories
                .filter((c) => (c.kind ?? "expense") === form.type)
                .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set("categoryId", c.id)}
                  className={cn(
                    "flex shrink-0 flex-col items-center gap-1 rounded-[12px] border px-2 py-2 text-xs",
                    form.categoryId === c.id
                      ? "border-accent bg-accent/10"
                      : "border-border bg-elevated",
                  )}
                >
                  <CategoryIcon name={c.icon} className="size-4"  />
                  <span className="max-w-14 truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
          {form.type === "expense" && (
            <div>
              <Label>Конверт</Label>
              <div className="-mx-1 mt-1 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => set("envelopeId", null)}
                  className={cn(
                    "h-9 shrink-0 rounded-[10px] px-3 text-xs",
                    form.envelopeId == null ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
                  )}
                >
                  Нет
                </button>
                {envelopes.map((env) => (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => set("envelopeId", env.id)}
                    className={cn(
                      "h-9 shrink-0 rounded-[10px] px-3 text-xs",
                      form.envelopeId === env.id
                        ? "bg-accent text-accent-fg"
                        : "bg-elevated text-muted",
                    )}
                  >
                    {env.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
        <span className="text-sm">Автоматически создавать операции</span>
        <button
          type="button"
          role="switch"
          aria-checked={form.autoCreate}
          onClick={() => set("autoCreate", !form.autoCreate)}
          className={cn(
            "relative h-7 w-12 border border-border transition-colors",
            form.autoCreate ? "bg-accent" : "bg-elevated",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-6 transition-transform",
              form.autoCreate ? "left-5" : "left-0.5",
            )}
            style={{
              background: form.autoCreate
                ? "var(--color-accent-fg)"
                : "var(--color-fg)",
            }}
          />
        </button>
      </label>

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending
            ? "Сохраняю…"
            : form.id
              ? "Обновить"
              : "Добавить"}
        </Button>
      </div>
      {form.amount && Number(String(form.amount).replace(",", ".")) > 0 && (
        <p className="text-xs text-muted">
          Пример: {formatMoney(Number(String(form.amount).replace(",", ".")), currency)} ·{" "}
          {FREQ_OPTIONS.find((f) => f.value === form.frequency)?.label.toLowerCase()}
          {form.interval > 1 ? ` (каждые ${form.interval})` : ""}
        </p>
      )}
    </form>
  );
}

export function RecurringList({
  items,
  currency,
  pendingId,
  onEdit,
  onPause,
  onDelete,
}: {
  items: RecurringTransaction[];
  currency: CurrencyCode;
  pendingId?: number | null;
  onEdit: (item: RecurringTransaction) => void;
  onPause: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted">
        Пока нет повторяющихся операций. Добавьте зарплату, аренду или подписки.
      </p>
    );
  }

  const freqLabel = (f: RecurringFrequency, interval: number) => {
    const base =
      FREQ_OPTIONS.find((o) => o.value === f)?.label.toLowerCase() ?? f;
    return interval > 1 ? `каждые ${interval} · ${base}` : base;
  };

  return (
    <ul className="space-y-2">
      {items.map((r) => (
        <li
          key={r.id}
          className={cn(
            "flex flex-col gap-1 rounded-[12px] border border-border bg-elevated p-3",
            !r.isActive && "opacity-60",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{r.description || "Без названия"}</p>
              <p className="text-xs text-muted">
                {freqLabel(r.frequency, r.interval)} · след. {r.nextOccurrence}
                {!r.isActive && " · на паузе"}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 font-mono text-sm tabular-nums",
                r.type === "income" ? "text-ok" : "text-fg",
              )}
            >
              {r.type === "income" ? "+" : "−"}
              {formatMoney(r.amount, currency)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs font-medium text-accent"
              onClick={() => onEdit(r)}
            >
              Изменить
            </button>
            <button
              type="button"
              className="text-xs font-medium text-muted"
              disabled={pendingId === r.id}
              onClick={() => onPause(r.id, !r.isActive)}
            >
              {r.isActive ? "Пауза" : "Возобновить"}
            </button>
            <button
              type="button"
              className="text-xs font-medium text-danger"
              disabled={pendingId === r.id}
              onClick={() => {
                if (confirm("Удалить повторяющуюся операцию?")) onDelete(r.id);
              }}
            >
              Удалить
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
