import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { EnvelopeCircle } from "@/components/finance/envelope-circle";
import { ThemeSync } from "@/components/theme-sync";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useFinance, useFinanceMutations } from "@/lib/finance/use-finance";
import { formatRub } from "@/lib/utils";
import type { Envelope } from "@/lib/finance/types";

export const Route = createFileRoute("/envelopes")({ component: Page });

function Page() {
 return (
 <AuthGuard>
 <Inner />
 </AuthGuard>
 );
}

function Inner() {
 const { snapshot, computed, isPending } = useFinance();
 const mut = useFinanceMutations();
 const [name, setName] = useState("");
 const [budget, setBudget] = useState("");
 const [editing, setEditing] = useState<Envelope | null>(null);

 if (isPending || !snapshot || !computed) {
 return (
 <AppShell title="Конверты">
 <div className="h-40 animate-pulse bg-surface" />
 </AppShell>
 );
 }

 return (
 <AppShell title="Конверты">
 <ThemeSync snapshot={snapshot} />
 <div className="space-y-4">
 <div className="flex flex-wrap gap-3">
 {computed.envelopes.map((e) => (
 <EnvelopeCircle key={e.id} item={e} onClick={() => setEditing(e)} />
 ))}
 </div>
 <ul className="space-y-2">
 {computed.envelopes.map((e) => (
 <li key={e.id} className="flex items-center justify-between bg-surface px-4 py-3">
 <div>
 <p className="text-sm font-medium">{e.name}</p>
 <p className="text-xs text-muted">
 {formatRub(e.spent)} / {formatRub(e.budget)}
 {e.isOverBudget ? " · перерасход" : ""}
 </p>
 </div>
 <div className="flex gap-2">
 <Button size="sm" variant="secondary" onClick={() => setEditing(e)}>
 Изменить
 </Button>
 <Button
 size="sm"
 variant="ghost"
 onClick={() => {
 if (confirm("Удалить конверт? Операции сохранятся.")) mut.deleteEnv.mutate({ id: e.id });
 }}
 >
 Удалить
 </Button>
 </div>
 </li>
 ))}
 </ul>

 <Card>
 <h2 className="font-display text-lg">{editing ? "Редактировать конверт" : "Новый конверт"}</h2>
 <form
 className="mt-3 space-y-2"
 onSubmit={(e) => {
 e.preventDefault();
 const b = Number((editing ? budget || String(editing.budget) : budget).replace(",", "."));
 if (!Number.isFinite(b) || b < 0) return;
 mut.saveEnv.mutate({
 id: editing?.id,
 name: (editing ? name || editing.name : name).trim(),
 budget: b,
 color: editing?.color ?? "#3F6B5C",
 icon: editing?.icon ?? "wallet",
 });
 setName("");
 setBudget("");
 setEditing(null);
 }}
 >
 <div>
 <Label>Название</Label>
 <Input
 value={editing ? name || editing.name : name}
 onChange={(e) => setName(e.target.value)}
 required={!editing}
 />
 </div>
 <div>
 <Label>Лимит</Label>
 <Input
 inputMode="decimal"
 value={editing ? budget || String(editing.budget) : budget}
 onChange={(e) => setBudget(e.target.value)}
 required={!editing}
 />
 </div>
 <div className="flex gap-2">
 {editing && (
 <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditing(null)}>
 Отмена
 </Button>
 )}
 <Button type="submit" className="flex-1">
 Сохранить
 </Button>
 </div>
 </form>
 </Card>
 </div>
 </AppShell>
 );
}
