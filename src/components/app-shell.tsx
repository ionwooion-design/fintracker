import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Home, Moon, Settings, Sun, Wallet } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useFinance, useFinanceMutations } from "@/lib/finance/use-finance";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Главная", icon: Home },
  { to: "/stats", label: "Статистика", icon: BarChart3 },
  { to: "/envelopes", label: "Конверты", icon: Wallet },
  { to: "/settings", label: "Настройки", icon: Settings },
] as const;

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPending } = useCurrentUserState();
  const { snapshot } = useFinance();
  const mut = useFinanceMutations();
  const isDark = snapshot?.settings.darkTheme ?? false;

  const toggleTheme = () => {
    if (!snapshot) return;
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    mut.saveSettings.mutate({
      userName: snapshot.settings.userName,
      startDate: snapshot.settings.startDate,
      endDate: snapshot.settings.endDate,
      initialBalance: snapshot.settings.initialBalance,
      finalTarget: snapshot.settings.finalTarget,
      darkTheme: next,
      currency: snapshot.settings.currency ?? "RUB",
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border glass px-4 py-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">FinTracker PRO</p>
          <h1 className="font-display text-xl text-fg">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
            title={isDark ? "Светлая тема" : "Тёмная тема"}
            className="grid size-9 place-items-center border border-border bg-elevated text-fg hover:bg-surface transition-opacity"
          >
            {isDark ? <Sun className="size-4" strokeWidth={1.8} /> : <Moon className="size-4" strokeWidth={1.8} />}
          </button>
          {isPending ? (
            <div className="size-9 animate-pulse bg-elevated" />
          ) : (
            <UserButton />
          )}
        </div>
      </header>
      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg border-t border-border glass-strong px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <ul className="grid grid-cols-4">
          {TABS.map((tab) => {
            const active = pathname === tab.to;
            const Icon = tab.icon;
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                    active ? "text-accent bg-elevated" : "text-muted hover:text-fg",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
