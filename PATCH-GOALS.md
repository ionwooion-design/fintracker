# Патч FinTracker: Цели / сбережения + Перенос остатка

## Установка

```bash
# из корня проекта
unzip -o fintracker-goals-period.zip
npm run db:migrate   # применит migrations/0007_savings_goals.sql
# перезапустить dev-сервер
```

## Что добавлено

### 1. Цели / сбережения
- Таблица `savings_goals` + история взносов `savings_goal_contributions`
- CRUD: создать, изменить, удалить цель (название, целевая сумма, уже накоплено, дедлайн, цвет, иконка)
- **Внести** — увеличивает `current_amount` и по умолчанию создаёт расходную операцию (учитывается в дневном лимите)
- При достижении цели — `is_completed` + дата
- UI:
  - компактный блок на **Главной**
  - полный блок в **Настройках** (после «Бюджетный период»)

### 2. Перенос остатка (новый период)
- Server-fn `startNewPeriod` вместо простого `saveSettings`
- Опции:
  - **Перенести остаток** — `initialBalance = текущий баланс периода` (по умолчанию вкл.)
  - **Сохранить историю** — старые операции остаются (по умолчанию вкл.); если выкл. — удаляются операции и fixed events до даты начала нового периода
- **Баланс и расход по конвертам считаются в рамках периода** (`transactionDate >= startDate`), поэтому перенос остатка корректен без удаления истории
- Баннер на главной (конец периода) использует новую логику

## Файлы

| Путь | Действие |
|------|----------|
| `migrations/0007_savings_goals.sql` | **новый** |
| `src/lib/finance/types.ts` | SavingsGoal, goals в snapshot/computed |
| `src/lib/finance/calc.ts` | period-scoped balance & envelopes, goals |
| `src/lib/finance/actions.ts` | load goals, saveGoal, deleteGoal, contributeToGoal, startNewPeriod |
| `src/lib/finance/use-finance.ts` | мутации |
| `src/components/finance/goals-panel.tsx` | **новый** |
| `src/components/finance/budget-alerts.tsx` | startNewPeriod + чекбоксы |
| `src/routes/index.tsx` | GoalsPanel compact |
| `src/routes/settings.tsx` | GoalsPanel full |

## Примечания
- Если миграция ещё не применена, `goals` будет `[]` (graceful fallback).
- «Целевой баланс» периода (`finalTarget`) и **цели накоплений** — разные сущности.
