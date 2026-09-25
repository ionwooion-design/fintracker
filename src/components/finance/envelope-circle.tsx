import { CategoryIcon } from "@/lib/finance/icons";
import { formatRub } from "@/lib/utils";
import type { EnvelopeWithSpent } from "@/lib/finance/types";

export function EnvelopeCircle({
  item,
  onClick,
}: {
  item: EnvelopeWithSpent;
  onClick?: () => void;
}) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, item.usagePercent) / 100;
  const dash = c * (1 - pct);
  const tone = item.isOverBudget ? "var(--color-danger)" : "var(--color-ok)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[88px] shrink-0 flex-col items-center gap-1 text-center"
    >
      <span className="relative grid size-[72px] place-items-center">
        <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90">
          <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-border)" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth="4"
            strokeDasharray={`${c}`}
            strokeDashoffset={dash}
            strokeLinecap="round"
          />
        </svg>
        <CategoryIcon name={item.icon} className="size-5 text-fg" />
      </span>
      <span className="line-clamp-1 text-xs font-medium">{item.name}</span>
      <span className="font-mono text-[11px] tabular-nums text-muted">{formatRub(item.remaining)}</span>
    </button>
  );
}
