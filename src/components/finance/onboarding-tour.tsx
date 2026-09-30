import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  Home,
  Settings,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "fintracker_onboarding_done_v1";

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function resetOnboardingFlag(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

type Step = {
  id: string;
  title: string;
  body: string;
  icon: typeof Home;
  /** Optional path to highlight after step (navigated on «Далее» when set) */
  navigateTo?: string;
};

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Добро пожаловать в FinTracker PRO",
    body: "Короткий тур по основным экранам. Можно пропустить в любой момент — FAQ всегда доступен в разделе «Ещё».",
    icon: Sparkles,
  },
  {
    id: "home",
    title: "Главная — день и лимит",
    body: "Здесь видно, сколько осталось на сегодня, прогресс к цели, серию дней в лимите и уровень. Добавляйте расходы кнопкой «+» или через SMS-импорт.",
    icon: Home,
    navigateTo: "/",
  },
  {
    id: "envelopes",
    title: "Конверты — бюджет по категориям",
    body: "Создайте конверты (продукты, транспорт, развлечения) с лимитом на период. Расходы из конверта уменьшают его остаток; свободные деньги не привязаны к категориям.",
    icon: Wallet,
    navigateTo: "/envelopes",
  },
  {
    id: "stats",
    title: "Статистика и ачивки",
    body: "Графики, уровень, XP и галерея достижений. Держите дневной лимит — растёт серия и открываются награды.",
    icon: BarChart3,
    navigateTo: "/stats",
  },
  {
    id: "settings",
    title: "Настройки и FAQ",
    body: "Период, валюта, категории, регулярные платежи и ответы на частые вопросы. Отсюда же можно снова запустить этот тур.",
    icon: Settings,
    navigateTo: "/settings",
  },
  {
    id: "done",
    title: "Готово!",
    body: "Задайте период и цель в настройках, добавьте первый расход на главной. Удачи с бюджетом — и с серией дней в лимите.",
    icon: CheckCircle2,
    navigateTo: "/",
  },
];

type Props = {
  /** Force show even if already completed (e.g. from Settings) */
  force?: boolean;
  onClose?: () => void;
};

export function OnboardingTour({ force = false, onClose }: Props) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (force) {
      setVisible(true);
      setStep(0);
      return;
    }
    // Defer so first paint of dashboard isn't blocked
    const t = window.setTimeout(() => {
      if (!hasCompletedOnboarding()) setVisible(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, [force]);

  const finish = useCallback(() => {
    markOnboardingDone();
    setVisible(false);
    onClose?.();
  }, [onClose]);

  const goNext = useCallback(() => {
    const current = STEPS[step];
    const nextIdx = step + 1;
    if (nextIdx >= STEPS.length) {
      if (current?.navigateTo) void navigate({ to: current.navigateTo });
      finish();
      return;
    }
    const next = STEPS[nextIdx];
    if (next.navigateTo) void navigate({ to: next.navigateTo });
    setStep(nextIdx);
  }, [step, navigate, finish]);

  const goBack = useCallback(() => {
    if (step <= 0) return;
    const prev = STEPS[step - 1];
    if (prev.navigateTo) void navigate({ to: prev.navigateTo });
    setStep(step - 1);
  }, [step, navigate]);

  if (!visible) return null;

  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-fg/45 backdrop-blur-[2px]"
        aria-label="Закрыть тур"
        onClick={finish}
      />
      <div
        className={cn(
          "relative z-10 mx-3 mb-[max(1rem,env(safe-area-inset-bottom))] w-full max-w-md",
          "border border-border bg-elevated shadow-xl",
          "animate-in fade-in slide-in-from-bottom-4 duration-300",
        )}
      >
        <div className="h-1 bg-elevated">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start justify-between gap-2 px-4 pt-4">
          <div className="grid size-11 place-items-center border border-border bg-surface text-accent">
            <Icon className="size-5" strokeWidth={1.8} />
          </div>
          <button
            type="button"
            onClick={finish}
            className="grid size-9 place-items-center text-muted hover:text-fg"
            aria-label="Пропустить"
          >
            <X className="size-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="px-4 pb-2 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            Шаг {step + 1} из {STEPS.length}
          </p>
          <h2 id="onboarding-title" className="mt-1 font-display text-xl text-fg">
            {s.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
        </div>

        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          {step > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={goBack}>
              Назад
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={finish}>
              Пропустить
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" size="sm" onClick={goNext}>
            {isLast ? "Начать" : "Далее"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Lightweight trigger from Settings — restarts the tour */
export function RestartTourButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className={cn("w-full", className)}
        onClick={() => {
          resetOnboardingFlag();
          setOpen(true);
        }}
      >
        <Sparkles className="size-4" strokeWidth={1.8} />
        Пройти обучение заново
      </Button>
      {open && <OnboardingTour force onClose={() => setOpen(false)} />}
    </>
  );
}
