import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useFinanceMutations } from "@/lib/finance/use-finance";
import { formatMoney, todayISO } from "@/lib/utils";
import type { DashboardComputed, FinanceSnapshot } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "ft_alert_";

function alreadyShown(key: string, ttlHours = 12): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < ttlHours * 3600_000;
  } catch {
    return false;
  }
}

function markShown(key: string) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, String(Date.now()));
  } catch {
    /* ignore */
  }
}

type Props = {
  snapshot: FinanceSnapshot;
  computed: DashboardComputed;
};

/**
 * Client-side budget alerts:
 * - Toast when daily limit is approached (≥80%) or exceeded
 * - Toast when an envelope is over budget
 * - Banner when budget period is ending soon / has ended + CTA to start a new period
 */
export function BudgetAlerts({ snapshot, computed }: Props) {
  const currency = snapshot.settings.currency ?? "RUB";
  const today = todayISO();
  const daysLeft = computed.daysRemaining;
  // Period is over once endDate is strictly before today
  const periodEnded = snapshot.settings.endDate < today;
  // Last day or 1–3 days left
  const periodEndingSoon = !periodEnded && daysLeft <= 3;

  // --- Limit toasts (once per session per threshold) ---
  useEffect(() => {
    if (computed.dailyLimit <= 0) return;
    const pct = computed.progressPercent;
    const dayKey = today;

    if (pct >= 100 && !alreadyShown(`limit_over_${dayKey}`)) {
      markShown(`limit_over_${dayKey}`);
      toast.error("Дневной лимит превышен", {
        description: `Потрачено ${formatMoney(computed.spentToday, currency)} из ${formatMoney(computed.dailyLimit, currency)}. Остаток: ${formatMoney(computed.remainingToday, currency)}.`,
        duration: 7000,
      });
    } else if (pct >= 80 && pct < 100 && !alreadyShown(`limit_warn_${dayKey}`)) {
      markShown(`limit_warn_${dayKey}`);
      toast.warning("Почти у лимита", {
        description: `Использовано ${Math.round(pct)}% дневного лимита (${formatMoney(computed.spentToday, currency)} из ${formatMoney(computed.dailyLimit, currency)}).`,
        duration: 5500,
      });
    }
  }, [
    computed.dailyLimit,
    computed.progressPercent,
    computed.spentToday,
    computed.remainingToday,
    currency,
    today,
  ]);

  // Envelope over-budget toasts
  useEffect(() => {
    for (const env of computed.envelopes) {
      if (!env.isOverBudget || env.budget <= 0) continue;
      const key = `env_over_${env.id}_${today}`;
      if (alreadyShown(key, 24)) continue;
      markShown(key);
      toast.error(`Конверт «${env.name}» перерасходован`, {
        description: `Потрачено ${formatMoney(env.spent, currency)} при бюджете ${formatMoney(env.budget, currency)}.`,
        duration: 6000,
      });
    }
  }, [computed.envelopes, currency, today]);

  // Period ending soon toast (once)
  useEffect(() => {
    if (!periodEndingSoon || periodEnded) return;
    const key = `period_soon_${snapshot.settings.endDate}`;
    if (alreadyShown(key, 48)) return;
    markShown(key);
    toast.message("Бюджетный период заканчивается", {
      description:
        daysLeft === 0
          ? "Сегодня последний день периода. После полуночи можно начать новый."
          : `Осталось ${daysLeft} ${pluralDays(daysLeft)}. Подготовьте новый период в настройках.`,
      duration: 8000,
      icon: <CalendarClock className="size-4" />,
    });
  }, [periodEndingSoon, periodEnded, daysLeft, snapshot.settings.endDate]);

  if (!periodEnded && !periodEndingSoon) return null;

  return (
    <PeriodBanner
      snapshot={snapshot}
      computed={computed}
      periodEnded={periodEnded}
      daysLeft={daysLeft}
    />
  );
}

function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "дня";
  return "дней";
}

function PeriodBanner({
  snapshot,
  computed,
  periodEnded,
  daysLeft,
}: {
  snapshot: FinanceSnapshot;
  computed: DashboardComputed;
  periodEnded: boolean;
  daysLeft: number;
}) {
  const [open, setOpen] = useState(periodEnded);
  const mut = useFinanceMutations();
  const currency = snapshot.settings.currency ?? "RUB";
  const [newStart, setNewStart] = useState(todayISO());
  const [newEnd, setNewEnd] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return todayISO(d);
  });
  const [newInitial, setNewInitial] = useState(
    String(Math.round(computed.currentBalance)),
  );
  const [newTarget, setNewTarget] = useState(
    String(snapshot.settings.finalTarget),
  );
  const submitting = mut.saveSettings.isPending;

  const startNewPeriod = () => {
    const initial = Number(String(newInitial).replace(",", "."));
    const target = Number(String(newTarget).replace(",", "."));
    if (!Number.isFinite(initial) || !Number.isFinite(target)) return;
    if (newEnd < newStart) {
      toast.error("Дата окончания не может быть раньше начала");
      return;
    }
    mut.saveSettings.mutate(
      {
        userName: snapshot.settings.userName,
        startDate: newStart,
        endDate: newEnd,
        initialBalance: initial,
        finalTarget: target,
        darkTheme: snapshot.settings.darkTheme,
        privacyAccepted: true,
        currency: snapshot.settings.currency,
      },
      {
        onSuccess: () => {
          toast.success("Новый бюджетный период начат", {
            description: `С ${newStart} по ${newEnd}. Начальный баланс: ${formatMoney(initial, currency)}.`,
          });
          setOpen(false);
        },
        onError: () => {
          toast.error("Не удалось сохранить период");
        },
      },
    );
  };

  return (
    <Card
      className={cn(
        "overflow-hidden border p-4 shadow-sm",
        periodEnded
          ? "border-danger/40 bg-danger/5"
          : "border-warn/40 bg-warn/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
            periodEnded ? "bg-danger/15 text-danger" : "bg-warn/15 text-warn",
          )}
        >
          {periodEnded ? (
            <AlertTriangle className="size-4" />
          ) : (
            <CalendarClock className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-fg">
            {periodEnded
              ? "Бюджетный период завершён"
              : daysLeft === 0
                ? "Сегодня последний день периода"
                : `Период заканчивается через ${daysLeft} ${pluralDays(daysLeft)}`}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {periodEnded
              ? `Период ${snapshot.settings.startDate} — ${snapshot.settings.endDate} закончился. Баланс: ${formatMoney(computed.currentBalance, currency)}. Начните новый период, чтобы продолжить планирование.`
              : `Окончание: ${snapshot.settings.endDate}. После завершения дневной лимит перестанет обновляться корректно — задайте новые даты.`}
          </p>

          {!open ? (
            <Button
              size="sm"
              className="mt-3"
              variant={periodEnded ? "default" : "secondary"}
              onClick={() => setOpen(true)}
            >
              <Sparkles className="size-3.5" />
              Начать новый период
            </Button>
          ) : (
            <div className="mt-3 space-y-2 rounded-[12px] border border-border bg-elevated/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Новый период
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Начало</Label>
                  <Input
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Окончание</Label>
                  <Input
                    type="date"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Начальный баланс</Label>
                  <Input
                    inputMode="decimal"
                    value={newInitial}
                    onChange={(e) => setNewInitial(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Целевой остаток</Label>
                  <Input
                    inputMode="decimal"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted">
                По умолчанию баланс берётся из текущего ({formatMoney(computed.currentBalance, currency)}).
                Транзакции прошлого периода сохраняются.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={submitting}
                  onClick={startNewPeriod}
                >
                  <CheckCircle2 className="size-3.5" />
                  {submitting ? "Сохранение…" : "Начать период"}
                </Button>
                {!periodEnded && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                  >
                    Позже
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Fire a toast right after a successful expense add (immediate feedback). */
export function notifyAfterExpense(opts: {
  amount: number;
  remainingToday: number;
  dailyLimit: number;
  currency: string;
  envelopeName?: string | null;
  envelopeRemaining?: number | null;
}) {
  const { amount, remainingToday, dailyLimit, currency } = opts;
  if (dailyLimit > 0 && remainingToday < 0) {
    toast.error("Лимит на сегодня превышен", {
      description: `Расход ${formatMoney(amount, currency as any)}. Остаток: ${formatMoney(remainingToday, currency as any)}.`,
    });
  } else if (dailyLimit > 0 && remainingToday <= dailyLimit * 0.2) {
    toast.warning("Осталось мало от лимита", {
      description: `После расхода осталось ${formatMoney(remainingToday, currency as any)} на сегодня.`,
    });
  }

  if (
    opts.envelopeName &&
    opts.envelopeRemaining != null &&
    opts.envelopeRemaining < 0
  ) {
    toast.error(`Конверт «${opts.envelopeName}» превышен`, {
      description: `Остаток конверта: ${formatMoney(opts.envelopeRemaining, currency as any)}.`,
    });
  }
}
