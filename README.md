# FinTracker — геймификация (уровни, XP, ачивки)

## Что добавлено

Сложная многоуровневая система прогрессии:

### Уровни и XP
- **Уровни 1–100** с кривой XP ≈ 80·n^1.45 + 25n на каждый следующий уровень
- Источники XP:
  - +5 за расход / +8 за доход
  - +15 за день в лимите + бонус за длину серии
  - +10 конверт, +5 категория, +20 recurring, +25 SMS-импорт
  - XP за открытие ачивок (от 15 до 1500)
- **Титулы** меняются с уровнем: Новичок → Ученик бюджета → … → Бессмертный

### Достижения (40+)
Категории: Серии · Операции · Конверты · Накопления · Постоянство · Функции · Цели · Особые

Редкости: ordinary / uncommon / rare / epic / legendary (с цветовой кодировкой)

Примеры:
| Код | Название | Условие | XP | Редкость |
|-----|----------|---------|-----|----------|
| streak_3 | Первые шаги | 3 дня в лимите | 30 | common |
| streak_100 | Сотня дней | 100 дней подряд | 1500 | legendary |
| goal_100 | Цель достигнута! | баланс ≥ цели | 500 | legendary |
| secret_night_owl | Ночная сова | операция 00–05 | 75 | rare (секрет) |
| level_50 | Полувековой | 50 уровень | 800 | legendary |

### UI
- **Статистика**: карточка уровня с прогресс-баром XP, счётчики, фильтр ачивок по категориям, rarity badges, секретные ачивки скрыты до открытия
- **Сегодня**: уровень и титул рядом с серией

## Файлы

| Путь | Изменение |
|------|-----------|
| `migrations/0006_gamification.sql` | level, total_xp, title, longest_streak, … + rarity/xp на achievements |
| `src/lib/finance/gamification.ts` | **ядро**: defs, XP curve, titles, compute stats |
| `src/lib/finance/defaults.ts` | re-export ACHIEVEMENT_DEFS |
| `src/lib/finance/types.ts` | UserSettings + Achievement расширены |
| `src/lib/finance/actions.ts` | awardXp, conditionMet, buildUnlockContext, refreshStreak |
| `src/lib/finance/icons.tsx` | новые иконки ачивок |
| `src/routes/stats.tsx` | UI уровня и галереи ачивок |
| `src/routes/index.tsx` | показ уровня на дашборде |

## Установка

1. Распаковать поверх корня проекта.
2. `npm run db:migrate` (или ваш migrate script) — применится `0006_gamification.sql`.
3. Перезапустить dev-сервер.

Старые ачивки (first_step, beginner_saver…) продолжают работать; новые открываются автоматически при следующих действиях / refreshStreak.
