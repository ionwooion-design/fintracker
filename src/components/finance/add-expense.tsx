import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CategoryIcon } from "@/lib/finance/icons";
import { todayISO } from "@/lib/utils";
import type { Category, Envelope } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export function AddExpenseForm({
  categories,
  envelopes,
  pending,
  onAdd,
}: {
  categories: Category[];
  envelopes: Envelope[];
  pending?: boolean;
  onAdd: (d: {
    amount: number;
    type: "income" | "expense";
    description: string;
    transactionDate: string;
    categoryId: number | null;
    envelopeId: number | null;
  }) => void;
}) {
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState<number | null>(categories[0]?.id ?? null);
  const [envelopeId, setEnvelopeId] = useState<number | null>(null);
  const [kind, setKind] = useState<"expense" | "income">("expense");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(amount.replace(",", "."));
        if (!Number.isFinite(n) || n <= 0) return;
        onAdd({
          amount: n,
          type: kind,
          description: comment.trim() || "Без названия",
          transactionDate: date,
          categoryId: kind === "expense" ? categoryId : null,
          envelopeId: kind === "expense" ? envelopeId : null,
        });
        setAmount("");
        setComment("");
      }}
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setKind("expense")}
          className={cn(
            "h-9 flex-1 rounded-[10px] text-sm font-medium",
            kind === "expense" ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
          )}
        >
          Расход
        </button>
        <button
          type="button"
          onClick={() => setKind("income")}
          className={cn(
            "h-9 flex-1 rounded-[10px] text-sm font-medium",
            kind === "income" ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
          )}
        >
          Доход
        </button>
      </div>

      {kind === "expense" && (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategoryId(c.id);
                  setEnvelopeId(null);
                }}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium",
                  categoryId === c.id && envelopeId == null
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border bg-elevated text-fg",
                )}
              >
                <CategoryIcon name={c.icon} className="size-3.5" />
                {c.name}
              </button>
            ))}
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
            {envelopes.map((env) => (
              <button
                key={env.id}
                type="button"
                onClick={() => {
                  setEnvelopeId(env.id);
                  setCategoryId(null);
                }}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full border",
                  envelopeId === env.id ? "border-accent bg-accent text-accent-fg" : "border-border bg-elevated",
                )}
                title={env.name}
              >
                <CategoryIcon name={env.icon} className="size-4" />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="amt">Сумма</Label>
          <Input
            id="amt"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <div>
          <Label htmlFor="dt">Дата</Label>
          <Input id="dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="cm">Комментарий</Label>
        <Input id="cm" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Без названия" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {kind === "expense" ? "Добавить расход" : "Добавить доход"}
      </Button>
    </form>
  );
}
