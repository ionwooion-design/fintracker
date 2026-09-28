import { useState } from "react";
import { CheckCircle2, Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { CategoryIcon } from "@/lib/finance/icons";
import { useFinanceMutations } from "@/lib/finance/use-finance";
import type {
  CurrencyCode,
  DashboardComputed,
  FinanceSnapshot,
  SavingsGoalWithProgress,
} from "@/lib/finance/types";
import { cn, formatMoney } from "@/lib/utils";

const GOAL_COLORS = [
  "#3F6B5C",
  "#4A5C6A",
  "#5A5366",
  "#6A5E4A",
  "#6A4A4A",
  "#4A4F66",
  "#5C6B5A",
];

const GOAL_ICONS = [
  "target",
  "flag",
  "wallet",
  "sprout",
  "award",
  "gem",
  "milestone",
  "star",
];

type Props = {
  snapshot: FinanceSnapshot;
  computed: DashboardComputed;
  /** compact = dashboard cards only; full = management form */
  mode?: "compact" | "full";
};

export function GoalsPanel({ snapshot, computed, mode = "full" }: Props) {
  const currency = (snapshot.settings.currency ?? "RUB") as CurrencyCode;
  const mut = useFinanceMutations();
  const goals = computed.goals ?? [];
  const active = goals.filter((g) => !g.isCompleted);
  const done = goals.filter((g) => g.isCompleted);

  if (mode === "compact") {
    if (active.length === 0 && done.length === 0) {
      return (
        <Card className="border border-dashed border-border p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Target className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-fg">Цели накоплений</p>
              <p className="mt-0.5 text-sm text-muted">
                Создайте цель — отпуск, подушка, гаджет — и откладывайте часть
                свободных денег.
              </p>
              <p className="mt-2 text-xs text-muted">
                Управление целями — в разделе «Ещё» → Цели.
              </p>
            </div>
          </div>
        </Card>
      );
    }
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="font-display text-lg">Цели</h2>
          {active.length > 0 && (
            <p className="text-xs text-muted">
              {formatMoney(computed.goalsTotalSaved, currency)} /{" "}
              {formatMoney(computed.goalsTotalTarget, currency)}
            </p>
          )}
        </div>
        {active.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            currency={currency}
            compact
            onContribute={(amount) =>
              mut.contributeToGoal.mutate(
                { goalId: g.id, amount, createExpense: true },
                {
                  onSuccess: () =>
                    toast.success(`Внесено ${formatMoney(amount, currency)}`),
                  onError: () => toast.error("Не удалось внести"),
                },
              )
            }
            pending={mut.contributeToGoal.isPending}
          />
        ))}
        {done.slice(0, 2).map((g) => (
          <GoalCard key={g.id} goal={g} currency={currency} compact />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <h2 className="font-display text-lg">Цели / сбережения</h2>
      <p className="mt-1 text-xs text-muted">
        Отдельные цели накоплений (не путать с «целевым балансом» периода).
        Взнос создаёт расходную операцию, чтобы дневной лимит учитывал перевод.
      </p>

      <ul className="mt-3 space-y-2">
        {goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            currency={currency}
            onContribute={(amount) =>
              mut.contributeToGoal.mutate(
                { goalId: g.id, amount, createExpense: true },
                {
                  onSuccess: () =>
                    toast.success(`Внесено ${formatMoney(amount, currency)}`),
                  onError: () => toast.error("Не удалось внести"),
                },
              )
            }
            onDelete={() => {
              if (!confirm(`Удалить цель «${g.name}»?`)) return;
              mut.deleteGoal.mutate(
                { id: g.id },
                {
                  onSuccess: () => toast.success("Цель удалена"),
                  onError: () => toast.error("Не удалось удалить"),
                },
              );
            }}
            pending={
              mut.contributeToGoal.isPending || mut.deleteGoal.isPending
            }
          />
        ))}
        {goals.length === 0 && (
          <li className="text-sm text-muted">Пока нет целей</li>
        )}
      </ul>

      <GoalForm
        currency={currency}
        pending={mut.saveGoal.isPending}
        onSave={(data) =>
          mut.saveGoal.mutate(data, {
            onSuccess: () => toast.success("Цель сохранена"),
            onError: () => toast.error("Не удалось сохранить цель"),
          })
        }
      />
    </Card>
  );
}

function GoalCard({
  goal,
  currency,
  compact,
  onContribute,
  onDelete,
  pending,
}: {
  goal: SavingsGoalWithProgress;
  currency: CurrencyCode;
  compact?: boolean;
  onContribute?: (amount: number) => void;
  onDelete?: () => void;
  pending?: boolean;
}) {
  const [amount, setAmount] = useState("");
  const done = goal.isCompleted;

  return (
    <li
      className={cn(
        "list-none rounded-lg border border-border bg-elevated p-3",
        done && "opacity-80",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: goal.color }}
        >
          {done ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <CategoryIcon name={goal.icon} className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-fg">{goal.name}</p>
              <p className="text-xs text-muted">
                {formatMoney(goal.currentAmount, currency)} /{" "}
                {formatMoney(goal.targetAmount, currency)}
                {goal.deadline ? ` · до ${goal.deadline}` : ""}
                {done ? " · достигнута" : ""}
              </p>
            </div>
            {!compact && onDelete && (
              <button
                type="button"
                aria-label="Удалить"
                className="text-muted hover:text-danger"
                onClick={onDelete}
                disabled={pending}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, goal.progressPercent)}%`,
                background: done ? "#3F6B5C" : goal.color,
              }}
            />
          </div>
          {!done && onContribute && (
            <div className="mt-2 flex gap-2">
              <Input
                inputMode="decimal"
                placeholder="Сумма"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  const n = Number(String(amount).replace(",", "."));
                  if (!Number.isFinite(n) || n <= 0) {
                    toast.error("Введите сумму больше 0");
                    return;
                  }
                  onContribute(n);
                  setAmount("");
                }}
              >
                Внести
              </Button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function GoalForm({
  currency,
  pending,
  onSave,
}: {
  currency: CurrencyCode;
  pending?: boolean;
  onSave: (d: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    deadline?: string | null;
    color?: string;
    icon?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [icon, setIcon] = useState("target");

  return (
    <form
      className="mt-4 space-y-2 border-t border-border pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        const n = name.trim();
        const t = Number(String(target).replace(",", "."));
        const c = Number(String(current).replace(",", ".")) || 0;
        if (!n || !Number.isFinite(t) || t <= 0) {
          toast.error("Укажите название и целевую сумму");
          return;
        }
        onSave({
          name: n,
          targetAmount: t,
          currentAmount: c,
          deadline: deadline || null,
          color,
          icon,
        });
        setName("");
        setTarget("");
        setCurrent("0");
        setDeadline("");
      }}
    >
      <Label>Новая цель</Label>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Отпуск, подушка безопасности…"
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Цель ({currency})</Label>
          <Input
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="100000"
          />
        </div>
        <div>
          <Label>Уже накоплено</Label>
          <Input
            inputMode="decimal"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Дедлайн (необязательно)</Label>
        <Input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted">Цвет</p>
        <div className="flex flex-wrap gap-1.5">
          {GOAL_COLORS.map((col) => (
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
          {GOAL_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={cn(
                "flex size-8 items-center justify-center rounded-full border",
                icon === ic
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-border bg-elevated",
              )}
            >
              <CategoryIcon name={ic} className="size-3.5" />
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
        <Plus className="size-4" /> Создать цель
      </Button>
    </form>
  );
}
