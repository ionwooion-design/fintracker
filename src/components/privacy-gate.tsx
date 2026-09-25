import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const KEY = "ft-privacy-accepted";

export function PrivacyGate({ children }: { children: React.ReactNode }) {
  const [accepted, setAccepted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAccepted(localStorage.getItem(KEY) === "1");
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">FinTracker PRO</p>
        <h1 className="mt-2 font-display text-3xl">Политика конфиденциальности</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Данные хранятся в вашей учётной записи и используются только для учёта бюджета.
        </p>
      </main>
    );
  }

  if (!accepted) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">FinTracker PRO</p>
        <h1 className="mt-2 font-display text-3xl">Политика конфиденциальности</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Данные хранятся в вашей учётной записи и используются только для учёта бюджета.
          SMS обрабатываются только если вы сами вставляете текст. Сеть нужна для входа и
          советов AI-ассистента. Мы не читаем сообщения с устройства автоматически.
        </p>
        <Button
          className="mt-8 w-full"
          onClick={() => {
            localStorage.setItem(KEY, "1");
            setAccepted(true);
          }}
        >
          Принять и продолжить
        </Button>
      </main>
    );
  }
  return children;
}
