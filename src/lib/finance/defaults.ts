export const DEFAULT_CATEGORIES = [
  { name: "Еда", color: "#5C6B5A", icon: "utensils" },
  { name: "Транспорт", color: "#4A5C6A", icon: "bus" },
  { name: "Развлечения", color: "#5A5366", icon: "gamepad-2" },
  { name: "Коммунальные", color: "#6A5E4A", icon: "house" },
  { name: "Связь", color: "#4A6566", icon: "phone" },
  { name: "Здоровье", color: "#6A4A4A", icon: "heart-pulse" },
  { name: "Одежда", color: "#5A4A5C", icon: "shirt" },
  { name: "Подарки", color: "#4A4F66", icon: "gift" },
  { name: "Другое", color: "#5C5C58", icon: "ellipsis" },
] as const;

export const DEFAULT_ENVELOPES = [
  { name: "Еда", budget: 15000, color: "#5C6B5A", icon: "utensils" },
  { name: "Транспорт", budget: 5000, color: "#4A5C6A", icon: "bus" },
  { name: "Развлечения", budget: 8000, color: "#5A5366", icon: "gamepad-2" },
  { name: "Свободные деньги", budget: 10000, color: "#3F6B5C", icon: "wallet" },
] as const;

export const ACHIEVEMENT_DEFS = [
  {
    code: "first_step",
    name: "Первый шаг",
    description: "Добавлена первая операция",
    icon: "flag",
    minStreak: 0,
  },
  {
    code: "beginner_saver",
    name: "Начинающий эконом",
    description: "3 дня подряд в бюджете",
    icon: "sprout",
    minStreak: 3,
  },
  {
    code: "budget_master",
    name: "Мастер бюджета",
    description: "7 дней подряд в бюджете",
    icon: "award",
    minStreak: 7,
  },
  {
    code: "iron_will",
    name: "Железная воля",
    description: "14 дней подряд в бюджете",
    icon: "shield",
    minStreak: 14,
  },
  {
    code: "month_legend",
    name: "Легенда месяца",
    description: "30 дней подряд в бюджете",
    icon: "crown",
    minStreak: 30,
  },
] as const;
