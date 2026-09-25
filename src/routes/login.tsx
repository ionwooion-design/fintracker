import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) return <div className="min-h-dvh bg-bg" />;
  if (user) return <Navigate to="/" />;

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ email, password, name: name || email.split("@")[0] });
        if (res.error) throw new Error(res.error.message || "Ошибка регистрации");
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message || "Неверный логин или пароль");
      }
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">FinTracker PRO</p>
      <h1 className="mt-2 font-display text-3xl">Контроль расходов без шума</h1>
      <p className="mt-2 text-sm text-muted">Войдите, чтобы синхронизировать бюджет и конверты.</p>

      {authEnabled ? (
        <div className="mt-6 space-y-2">
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => signIn(p.providerId, { callbackURL: "/" })}
            >
              Продолжить с {p.label}
            </Button>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">Вход отключён.</p>
      )}

      <div className="my-6 flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-border" />
        или email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-3" onSubmit={onEmail}>
        {mode === "up" && (
          <div>
            <Label>Имя</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
        )}
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <Label>Пароль</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "up" ? "new-password" : "current-password"}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "up" ? "Зарегистрироваться" : "Войти"}
        </Button>
      </form>
      <button
        type="button"
        className="mt-4 text-sm text-muted"
        onClick={() => setMode((m) => (m === "in" ? "up" : "in"))}
      >
        {mode === "in" ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
      </button>
    </main>
  );
}
