/**
 * FinTracker Gamification System
 * ----------------------------
 * Multi-layer progression: XP → Levels → Titles + Achievements (with rarity & rewards)
 */

export type AchievementRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type AchievementCategory =
  | "streak"
  | "transactions"
  | "envelopes"
  | "savings"
  | "consistency"
  | "features"
  | "goals"
  | "special";

export type AchievementCondition =
  | { type: "streak"; min: number }
  | { type: "longest_streak"; min: number }
  | { type: "tx_count"; min: number }
  | { type: "tx_count_type"; txType: "income" | "expense"; min: number }
  | { type: "days_logged"; min: number }
  | { type: "envelopes_created"; min: number }
  | { type: "categories_created"; min: number }
  | { type: "recurring_created"; min: number }
  | { type: "under_budget_days"; min: number }
  | { type: "level"; min: number }
  | { type: "balance_above_target" }
  | { type: "saved_percent"; percent: number } // of initial→target path
  | { type: "first_income" }
  | { type: "first_expense" }
  | { type: "sms_import" }
  | { type: "perfect_week" } // 7 consecutive under-budget
  | { type: "envelope_under"; percent: number } // all envelopes under X%
  | { type: "diversity_categories"; min: number } // distinct categories used
  | { type: "no_spend_day" }
  | { type: "big_save_day"; minAmount: number } // remainingToday high relative
  | { type: "custom"; code: string };

export type AchievementDef = {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  /** Optional level requirement to even see / unlock */
  minLevel?: number;
  condition: AchievementCondition;
  /** Hidden until unlocked */
  secret?: boolean;
};

/** XP required to reach each level (cumulative). Level 1 starts at 0. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Soft quadratic: ~100 * n^1.6 + 40*n
  let total = 0;
  for (let n = 2; n <= level; n++) {
    total += Math.floor(80 * Math.pow(n, 1.45) + 25 * n);
  }
  return total;
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp && level < 100) {
    level++;
  }
  return level;
}

export function xpProgressInLevel(totalXp: number): {
  level: number;
  current: number;
  needed: number;
  percent: number;
} {
  const level = levelFromXp(totalXp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const current = totalXp - floor;
  const needed = Math.max(1, ceil - floor);
  return {
    level,
    current,
    needed,
    percent: Math.min(100, Math.round((current / needed) * 100)),
  };
}

/** Titles unlocked by level */
export const LEVEL_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 1, title: "Новичок" },
  { minLevel: 3, title: "Ученик бюджета" },
  { minLevel: 5, title: "Экономный" },
  { minLevel: 8, title: "Дисциплинированный" },
  { minLevel: 10, title: "Хранитель кошелька" },
  { minLevel: 12, title: "Мастер конвертов" },
  { minLevel: 15, title: "Стратег финансов" },
  { minLevel: 18, title: "Железная воля" },
  { minLevel: 20, title: "Легенда экономии" },
  { minLevel: 25, title: "Финансовый ниндзя" },
  { minLevel: 30, title: "Гуру бюджета" },
  { minLevel: 35, title: "Владыка лимитов" },
  { minLevel: 40, title: "Архитектор богатства" },
  { minLevel: 50, title: "Император финансов" },
  { minLevel: 75, title: "Мифический сберегатель" },
  { minLevel: 100, title: "Бессмертный" },
];

export function titleForLevel(level: number): string {
  let title = LEVEL_TITLES[0].title;
  for (const t of LEVEL_TITLES) {
    if (level >= t.minLevel) title = t.title;
  }
  return title;
}

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: "Обычное",
  uncommon: "Необычное",
  rare: "Редкое",
  epic: "Эпическое",
  legendary: "Легендарное",
};

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: "#9CA3AF",
  uncommon: "#34D399",
  rare: "#60A5FA",
  epic: "#A78BFA",
  legendary: "#FBBF24",
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  streak: "Серии",
  transactions: "Операции",
  envelopes: "Конверты",
  savings: "Накопления",
  consistency: "Постоянство",
  features: "Функции",
  goals: "Цели",
  special: "Особые",
};

/** Base XP awards for actions */
export const XP_REWARDS = {
  addTransaction: 5,
  addIncome: 8,
  underBudgetDay: 15,
  streakBonusPerDay: 3, // extra per current streak day
  unlockAchievement: 0, // already in def.xpReward
  createEnvelope: 10,
  createCategory: 5,
  createRecurring: 20,
  smsImport: 25,
  firstLoginDay: 10,
  perfectWeek: 50,
  levelUp: 0, // title change only
} as const;

export const ACHIEVEMENT_DEFS: readonly AchievementDef[] = [
  // ─── STREAK ───────────────────────────────────────────────
  {
    code: "streak_3",
    name: "Первые шаги",
    description: "3 дня подряд в рамках дневного лимита",
    icon: "sprout",
    category: "streak",
    rarity: "common",
    xpReward: 30,
    condition: { type: "streak", min: 3 },
  },
  {
    code: "streak_7",
    name: "Неделя силы",
    description: "7 дней подряд в бюджете",
    icon: "award",
    category: "streak",
    rarity: "uncommon",
    xpReward: 80,
    condition: { type: "streak", min: 7 },
  },
  {
    code: "streak_14",
    name: "Железная дисциплина",
    description: "14 дней подряд в бюджете",
    icon: "shield",
    category: "streak",
    rarity: "rare",
    xpReward: 180,
    condition: { type: "streak", min: 14 },
  },
  {
    code: "streak_30",
    name: "Месяц без срывов",
    description: "30 дней подряд в бюджете",
    icon: "crown",
    category: "streak",
    rarity: "epic",
    xpReward: 400,
    condition: { type: "streak", min: 30 },
  },
  {
    code: "streak_60",
    name: "Двухмесячный марафон",
    description: "60 дней подряд в бюджете",
    icon: "flame",
    category: "streak",
    rarity: "epic",
    xpReward: 700,
    condition: { type: "streak", min: 60 },
  },
  {
    code: "streak_100",
    name: "Сотня дней",
    description: "100 дней подряд в бюджете",
    icon: "trophy",
    category: "streak",
    rarity: "legendary",
    xpReward: 1500,
    condition: { type: "streak", min: 100 },
  },
  {
    code: "longest_streak_21",
    name: "Три недели воли",
    description: "Рекордная серия ≥ 21 день",
    icon: "trending-up",
    category: "streak",
    rarity: "rare",
    xpReward: 250,
    condition: { type: "longest_streak", min: 21 },
  },

  // ─── TRANSACTIONS ─────────────────────────────────────────
  {
    code: "first_expense",
    name: "Первый расход",
    description: "Добавлена первая расходная операция",
    icon: "flag",
    category: "transactions",
    rarity: "common",
    xpReward: 15,
    condition: { type: "first_expense" },
  },
  {
    code: "first_income",
    name: "Первый доход",
    description: "Добавлена первая доходная операция",
    icon: "wallet",
    category: "transactions",
    rarity: "common",
    xpReward: 20,
    condition: { type: "first_income" },
  },
  {
    code: "tx_10",
    name: "Десятка",
    description: "10 операций в истории",
    icon: "list",
    category: "transactions",
    rarity: "common",
    xpReward: 40,
    condition: { type: "tx_count", min: 10 },
  },
  {
    code: "tx_50",
    name: "Полтинник",
    description: "50 операций",
    icon: "list-checks",
    category: "transactions",
    rarity: "uncommon",
    xpReward: 100,
    condition: { type: "tx_count", min: 50 },
  },
  {
    code: "tx_100",
    name: "Сотня записей",
    description: "100 операций",
    icon: "layers",
    category: "transactions",
    rarity: "rare",
    xpReward: 200,
    condition: { type: "tx_count", min: 100 },
  },
  {
    code: "tx_500",
    name: "Архивариус",
    description: "500 операций",
    icon: "archive",
    category: "transactions",
    rarity: "epic",
    xpReward: 600,
    condition: { type: "tx_count", min: 500 },
  },
  {
    code: "expense_100",
    name: "Счётчик расходов",
    description: "100 расходных операций",
    icon: "receipt",
    category: "transactions",
    rarity: "rare",
    xpReward: 180,
    condition: { type: "tx_count_type", txType: "expense", min: 100 },
  },
  {
    code: "income_20",
    name: "Поток доходов",
    description: "20 доходных операций",
    icon: "trending-up",
    category: "transactions",
    rarity: "uncommon",
    xpReward: 90,
    condition: { type: "tx_count_type", txType: "income", min: 20 },
  },
  {
    code: "diversity_5",
    name: "Разнообразие",
    description: "Использовано ≥ 5 разных категорий",
    icon: "palette",
    category: "transactions",
    rarity: "uncommon",
    xpReward: 70,
    condition: { type: "diversity_categories", min: 5 },
  },
  {
    code: "diversity_10",
    name: "Полный спектр",
    description: "Использовано ≥ 10 категорий",
    icon: "rainbow",
    category: "transactions",
    rarity: "rare",
    xpReward: 150,
    condition: { type: "diversity_categories", min: 10 },
  },

  // ─── ENVELOPES ────────────────────────────────────────────
  {
    code: "envelope_1",
    name: "Первый конверт",
    description: "Создан первый конверт",
    icon: "mail",
    category: "envelopes",
    rarity: "common",
    xpReward: 25,
    condition: { type: "envelopes_created", min: 1 },
  },
  {
    code: "envelope_3",
    name: "Система конвертов",
    description: "3 конверта",
    icon: "folders",
    category: "envelopes",
    rarity: "uncommon",
    xpReward: 60,
    condition: { type: "envelopes_created", min: 3 },
  },
  {
    code: "envelope_5",
    name: "Мастер конвертов",
    description: "5 конвертов",
    icon: "layout-grid",
    category: "envelopes",
    rarity: "rare",
    xpReward: 120,
    condition: { type: "envelopes_created", min: 5 },
  },
  {
    code: "envelope_under_80",
    name: "Под контролем",
    description: "Все конверты заполнены менее чем на 80%",
    icon: "check-circle",
    category: "envelopes",
    rarity: "rare",
    xpReward: 100,
    condition: { type: "envelope_under", percent: 80 },
  },

  // ─── SAVINGS & GOALS ──────────────────────────────────────
  {
    code: "goal_25",
    name: "Четверть пути",
    description: "Пройдено 25% пути к финансовой цели",
    icon: "target",
    category: "goals",
    rarity: "uncommon",
    xpReward: 80,
    condition: { type: "saved_percent", percent: 25 },
  },
  {
    code: "goal_50",
    name: "Полпути",
    description: "Пройдено 50% пути к цели",
    icon: "milestone",
    category: "goals",
    rarity: "rare",
    xpReward: 150,
    condition: { type: "saved_percent", percent: 50 },
  },
  {
    code: "goal_75",
    name: "Почти у цели",
    description: "Пройдено 75% пути к цели",
    icon: "flag",
    category: "goals",
    rarity: "epic",
    xpReward: 250,
    condition: { type: "saved_percent", percent: 75 },
  },
  {
    code: "goal_100",
    name: "Цель достигнута!",
    description: "Баланс достиг или превысил целевой",
    icon: "trophy",
    category: "goals",
    rarity: "legendary",
    xpReward: 500,
    condition: { type: "balance_above_target" },
  },

  // ─── CONSISTENCY ──────────────────────────────────────────
  {
    code: "days_logged_7",
    name: "Еженедельник",
    description: "Записи в 7 разных дней",
    icon: "calendar",
    category: "consistency",
    rarity: "common",
    xpReward: 50,
    condition: { type: "days_logged", min: 7 },
  },
  {
    code: "days_logged_30",
    name: "Месяц учёта",
    description: "Записи в 30 разных дней",
    icon: "calendar-days",
    category: "consistency",
    rarity: "rare",
    xpReward: 200,
    condition: { type: "days_logged", min: 30 },
  },
  {
    code: "days_logged_90",
    name: "Квартал дисциплины",
    description: "Записи в 90 разных дней",
    icon: "calendar-range",
    category: "consistency",
    rarity: "epic",
    xpReward: 450,
    condition: { type: "days_logged", min: 90 },
  },
  {
    code: "no_spend_day",
    name: "День без трат",
    description: "Хотя бы один день с нулевыми расходами (при активном учёте)",
    icon: "moon",
    category: "consistency",
    rarity: "uncommon",
    xpReward: 40,
    condition: { type: "no_spend_day" },
  },
  {
    code: "perfect_week",
    name: "Идеальная неделя",
    description: "7 дней подряд строго в лимите",
    icon: "sparkles",
    category: "consistency",
    rarity: "rare",
    xpReward: 120,
    condition: { type: "perfect_week" },
  },

  // ─── FEATURES ─────────────────────────────────────────────
  {
    code: "category_created",
    name: "Свой стиль",
    description: "Создана собственная категория",
    icon: "tag",
    category: "features",
    rarity: "common",
    xpReward: 20,
    condition: { type: "categories_created", min: 1 },
  },
  {
    code: "recurring_1",
    name: "Автопилот",
    description: "Создана первая повторяющаяся операция",
    icon: "repeat",
    category: "features",
    rarity: "uncommon",
    xpReward: 50,
    condition: { type: "recurring_created", min: 1 },
  },
  {
    code: "recurring_3",
    name: "Конвейер",
    description: "3 активных повторяющихся операции",
    icon: "repeat-2",
    category: "features",
    rarity: "rare",
    xpReward: 100,
    condition: { type: "recurring_created", min: 3 },
  },
  {
    code: "sms_import",
    name: "SMS-мастер",
    description: "Импортирована операция из SMS",
    icon: "smartphone",
    category: "features",
    rarity: "uncommon",
    xpReward: 60,
    condition: { type: "sms_import" },
  },

  // ─── SPECIAL / LEVEL ──────────────────────────────────────
  {
    code: "level_5",
    name: "Пятый уровень",
    description: "Достигнут 5 уровень",
    icon: "star",
    category: "special",
    rarity: "uncommon",
    xpReward: 50,
    condition: { type: "level", min: 5 },
  },
  {
    code: "level_10",
    name: "Десятый уровень",
    description: "Достигнут 10 уровень",
    icon: "star",
    category: "special",
    rarity: "rare",
    xpReward: 100,
    condition: { type: "level", min: 10 },
  },
  {
    code: "level_20",
    name: "Двадцатый уровень",
    description: "Достигнут 20 уровень",
    icon: "gem",
    category: "special",
    rarity: "epic",
    xpReward: 250,
    condition: { type: "level", min: 20 },
  },
  {
    code: "level_50",
    name: "Полувековой",
    description: "Достигнут 50 уровень",
    icon: "gem",
    category: "special",
    rarity: "legendary",
    xpReward: 800,
    condition: { type: "level", min: 50 },
  },
  {
    code: "secret_night_owl",
    name: "Ночная сова",
    description: "Добавлена операция между 00:00 и 05:00",
    icon: "moon",
    category: "special",
    rarity: "rare",
    xpReward: 75,
    secret: true,
    condition: { type: "custom", code: "night_owl" },
  },
  {
    code: "secret_big_spender_day",
    name: "Контроль над хаосом",
    description: "День с большими тратами, но всё равно в лимите",
    icon: "zap",
    category: "special",
    rarity: "epic",
    xpReward: 150,
    secret: true,
    condition: { type: "custom", code: "big_but_under" },
  },
] as const;

export type GamificationStats = {
  level: number;
  totalXp: number;
  title: string;
  xpInLevel: number;
  xpNeeded: number;
  xpPercent: number;
  longestStreak: number;
  totalTransactions: number;
  daysLogged: number;
  unlockedCount: number;
  totalAchievements: number;
  byRarity: Record<AchievementRarity, number>;
  byCategory: Record<AchievementCategory, { unlocked: number; total: number }>;
};

export function computeGamificationStats(
  totalXp: number,
  longestStreak: number,
  totalTransactions: number,
  daysLogged: number,
  unlockedCodes: Set<string>,
): GamificationStats {
  const progress = xpProgressInLevel(totalXp);
  const byRarity: Record<AchievementRarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };
  const byCategory = {} as Record<
    AchievementCategory,
    { unlocked: number; total: number }
  >;
  for (const cat of Object.keys(CATEGORY_LABELS) as AchievementCategory[]) {
    byCategory[cat] = { unlocked: 0, total: 0 };
  }
  for (const def of ACHIEVEMENT_DEFS) {
    byCategory[def.category].total++;
    if (unlockedCodes.has(def.code)) {
      byRarity[def.rarity]++;
      byCategory[def.category].unlocked++;
    }
  }
  return {
    level: progress.level,
    totalXp,
    title: titleForLevel(progress.level),
    xpInLevel: progress.current,
    xpNeeded: progress.needed,
    xpPercent: progress.percent,
    longestStreak,
    totalTransactions,
    daysLogged,
    unlockedCount: unlockedCodes.size,
    totalAchievements: ACHIEVEMENT_DEFS.length,
    byRarity,
    byCategory,
  };
}
