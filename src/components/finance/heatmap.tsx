import { useMemo, useState } from "react";
import type { CurrencyCode, HeatmapDay } from "@/lib/finance/types";
import { formatMoney } from "@/lib/utils";

export function ExpenseHeatmap({
  days,
  currency = "RUB",
}: {
  days: HeatmapDay[];
  currency?: CurrencyCode;
}) {
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState<HeatmapDay | null>(null);
  const max = useMemo(() => Math.max(1, ...days.map((d) => d.amount)), [days]);

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        Тепловая карта (90 дней)
        <span className="text-muted">{open ? "Скрыть" : "Показать"}</span>
      </button>
      {open && (
        <div className="mt-3">
          <div className="grid grid-cols-10 gap-1">
            {days.map((d) => {
              const t = d.amount / max;
              const opacity = d.amount === 0 ? 0.08 : 0.2 + t * 0.8;
              return (
                <button
                  key={d.date}
                  type="button"
                  title={`${d.date}: ${formatMoney(d.amount, currency)}`}
                  onClick={() => setTip(d)}
                  className="aspect-square bg-accent"
                  style={{ opacity }}
                />
              );
            })}
          </div>
          {tip && (
            <p className="mt-2 text-xs text-muted">
              {tip.date}: {formatMoney(tip.amount, currency)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
