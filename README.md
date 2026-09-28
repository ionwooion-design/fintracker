# FinTracker — патч: повторяющиеся транзакции

## Файлы (пути относительно корня проекта)

| Путь | Изменение |
|------|-----------|
| `migrations/0004_recurring.sql` | Таблица + `transactions.recurring_id` |
| `src/lib/finance/types.ts` | `RecurringTransaction`, snapshot.recurring |
| `src/lib/finance/calc.ts` | `computeNextOccurrence`, лимит и прогноз |
| `src/lib/finance/actions.ts` | CRUD + `generateDueRecurring` |
| `src/lib/finance/use-finance.ts` | Мутации recurring |
| `src/components/finance/recurring-form.tsx` | Форма и список |
| `src/routes/settings.tsx` | UI-секция «Повторяющиеся» |

## Установка

1. Распаковать поверх корня проекта.
2. Выполнить миграции (`npm run db:migrate`).
3. (Опционально) В `actions.ts` заменить выборку транзакций на реальный столбец `recurring_id` вместо `null::integer as recurring_id`.

## Поведение

- При `getFinanceData` генерируются пропущенные операции (`auto_create`).
- Будущие recurring влияют на дневной лимит и projection.
- Управление: **Настройки → Повторяющиеся**.
