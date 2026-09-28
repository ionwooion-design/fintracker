# Патч: уведомления о лимите и окончании бюджетного периода

## Установка
Распаковать поверх корня проекта (merge с существующими файлами).

```bash
unzip -o fintracker-limit-alerts-patch.zip
# sonner уже в package.json; если нет node_modules/sonner:
npm install sonner@2.0.7
```

## Файлы
| Путь | Действие |
|------|----------|
| `src/components/finance/budget-alerts.tsx` | **новый** |
| `src/routes/__root.tsx` | Toaster (sonner) |
| `src/routes/index.tsx` | BudgetAlerts + notify после расхода |
| `src/routes/settings.tsx` | описание уведомлений |

## Поведение
- Toast при 80%% / 100%% дневного лимита и перерасходе конверта
- Баннер за 3 дня до конца периода и после окончания + форма «Начать новый период»
- Дедуп уведомлений в рамках сессии (sessionStorage)
