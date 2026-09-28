# Патч: рынок + уведомления + порядок настроек

## Установка
```bash
unzip -o fintracker-limit-alerts-patch.zip
npm install sonner@2.0.7
```

## Новый раздел «Рынок» (/markets)
- Валюты: open.er-api.com (бесплатно, без ключа), база = валюта из настроек
- Крипта: CoinGecko (BTC, ETH, TON, SOL, USDT) + изменение 24ч
- Кнопка обновления, кэш ~5 мин (react-query)
- Пункт в нижней навигации

## Настройки — порядок
1. Профиль → 2. Бюджетный период → 3. Фиксированные события
4. Повторяющиеся → 5. Категории расходов → 6. Категории доходов
7. Уведомления о лимите → 8. Опасная зона (свёрнута)

## Файлы
| Путь | Действие |
|------|----------|
| `src/lib/finance/markets.ts` | новый — API + hook |
| `src/routes/markets.tsx` | новый — страница |
| `src/routeTree.gen.ts` | маршрут /markets |
| `src/components/app-shell.tsx` | вкладка Рынок |
| `src/components/finance/budget-alerts.tsx` | уведомления |
| `src/routes/__root.tsx` | Toaster |
| `src/routes/index.tsx` | BudgetAlerts |
| `src/routes/settings.tsx` | порядок + опасная зона |
