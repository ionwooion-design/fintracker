import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/lib/finance/icons";
import { formatDayShort, formatMoney } from "@/lib/utils";
import type { Category, CurrencyCode, Envelope, Transaction } from "@/lib/finance/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TransactionList({
  groups,
  categories,
  envelopes,
  currency = "RUB",
  onEdit,
  onDelete,
  onBulkDay,
}: {
  groups: { date: string; items: Transaction[] }[];
  categories: Category[];
  envelopes: Envelope[];
  currency?: CurrencyCode;
  onEdit: (t: Transaction) => void;
  onDelete: (id: number) => void;
  onBulkDay: (day: string) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [limit, setLimit] = useState(3);

  const visible = groups.slice(0, limit);

  return (
    <div className="space-y-3">
      {visible.length === 0 && <p className="text-sm text-muted">Операций пока нет.</p>}
      {visible.map((g) => {
        const expanded = open[g.date] !== false;
        return (
          <div key={g.date}>
            <button
              type="button"
              className="flex w-full items-center justify-between py-1 text-left"
              onClick={() => setOpen((s) => ({ ...s, [g.date]: !expanded }))}
            >
              <span className="text-sm font-medium">{formatDayShort(g.date)}</span>
              <span className="text-xs text-muted">{g.items.length}</span>
            </button>
            {expanded && (
              <ul className="space-y-1">
                {g.items.map((t) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  const env = envelopes.find((e) => e.id === t.envelopeId);
                  const icon = env?.icon ?? cat?.icon ?? "ellipsis";
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-2 rounded-[16px] bg-elevated px-3 py-2"
                    >
                      <span className="grid size-9 place-items-center rounded-full bg-surface">
                        <CategoryIcon name={icon} className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.description}</p>
                        <p className="text-[11px] text-muted">{env?.name ?? cat?.name ?? "—"}</p>
                      </div>
                      <p
                        className={`font-mono text-sm tabular-nums ${t.type === "income" ? "text-ok" : "text-fg"}`}
                      >
                        {t.type === "income" ? "+" : "−"}
                        {formatMoney(t.amount, currency)}
                      </p>
                      <button type="button" className="p-1 text-muted" onClick={() => onEdit(t)} aria-label="Изменить">
                        <Pencil className="size-4" />
                      </button>
                      <button type="button" className="p-1 text-muted" onClick={() => onDelete(t.id)} aria-label="Удалить">
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  );
                })}
                <li>
                  <button
                    type="button"
                    className="text-xs text-danger"
                    onClick={() => {
                      if (confirm("Удалить все операции за этот день?")) onBulkDay(g.date);
                    }}
                  >
                    Удалить день
                  </button>
                </li>
              </ul>
            )}
          </div>
        );
      })}
      {groups.length > limit && (
        <Button variant="ghost" className="w-full" onClick={() => setLimit(groups.length)}>
          Показать все операции
        </Button>
      )}
    </div>
  );
}

export function EditTxDialog({
  tx,
  onClose,
  onSave,
}: {
  tx: Transaction | null;
  onClose: () => void;
  onSave: (t: Transaction) => void;
}) {
  const [amount, setAmount] = useState(tx ? String(tx.amount) : "");
  const [desc, setDesc] = useState(tx?.description ?? "");
  const [date, setDate] = useState(tx?.transactionDate ?? "");

  if (!tx) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-fg/40 p-4 sm:place-items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[28px] bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg">Редактировать</h3>
        <div className="mt-3 space-y-2">
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
          <Button
            className="flex-1"
            onClick={() =>
              onSave({
                ...tx,
                amount: Number(amount.replace(",", ".")),
                description: desc,
                transactionDate: date,
              })
            }
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}
