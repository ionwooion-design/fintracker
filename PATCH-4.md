# Патч FinTracker: рынок, новости, уведомления, настройки

## Установка
```bash
unzip -o fintracker-limit-alerts-patch.zip
npm install sonner@2.0.7
```

На Render.com задайте env (если ещё нет):
```
FINNHUB_API_KEY=ваш_ключ
```

## Рынок (/markets)
- Валюты: open.er-api.com
- Крипта: CoinGecko (BTC ETH TON SOL USDT)
- **Новости** (server-fn, без CORS):
  1. Finnhub general news — если есть `FINNHUB_API_KEY`
  2. RSS fallback: CoinDesk + BBC Russian
- Кнопка «Обновить» тянет котировки и новости

## Настройки
Порядок: Профиль → Бюджетный период → Фикс. события → Повторяющиеся →
Категории расходов → Категории доходов → Уведомления → Опасная зона (свёрнута)

## Файлы
| Путь | Действие |
|------|----------|
| `src/lib/finance/news.ts` | **новый** — Finnhub + RSS |
| `src/lib/finance/markets.ts` | FX + crypto |
| `src/routes/markets.tsx` | страница Рынок + блок новостей |
| `src/routeTree.gen.ts` | /markets |
| `src/components/app-shell.tsx` | вкладка Рынок |
| `src/components/finance/budget-alerts.tsx` | лимиты / период |
| `src/routes/__root.tsx` | Toaster |
| `src/routes/index.tsx` | BudgetAlerts |
| `src/routes/settings.tsx` | порядок разделов |
