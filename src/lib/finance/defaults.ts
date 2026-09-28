export const DEFAULT_CATEGORIES = [
  { name: "Еда", color: "#5C6B5A", icon: "utensils", kind: "expense" as const },
  { name: "Транспорт", color: "#4A5C6A", icon: "bus", kind: "expense" as const },
  { name: "Развлечения", color: "#5A5366", icon: "gamepad-2", kind: "expense" as const },
  { name: "Коммунальные", color: "#6A5E4A", icon: "house", kind: "expense" as const },
  { name: "Связь", color: "#4A6566", icon: "phone", kind: "expense" as const },
  { name: "Здоровье", color: "#6A4A4A", icon: "heart-pulse", kind: "expense" as const },
  { name: "Одежда", color: "#5A4A5C", icon: "shirt", kind: "expense" as const },
  { name: "Подарки", color: "#4A4F66", icon: "gift", kind: "expense" as const },
  { name: "Другое", color: "#5C5C58", icon: "ellipsis", kind: "expense" as const },
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Зарплата", color: "#3F6B5C", icon: "wallet", kind: "income" as const },
  { name: "Фриланс", color: "#4A5C6A", icon: "gift", kind: "income" as const },
  { name: "Инвестиции", color: "#5A5366", icon: "award", kind: "income" as const },
  { name: "Подарки", color: "#4A4F66", icon: "gift", kind: "income" as const },
  { name: "Другое", color: "#5C5C58", icon: "ellipsis", kind: "income" as const },
] as const;

export const DEFAULT_ENVELOPES = [
  { name: "Еда", budget: 15000, color: "#5C6B5A", icon: "utensils" },
  { name: "Транспорт", budget: 5000, color: "#4A5C6A", icon: "bus" },
  { name: "Развлечения", budget: 8000, color: "#5A5366", icon: "gamepad-2" },
  { name: "Свободные деньги", budget: 10000, color: "#3F6B5C", icon: "wallet" },
] as const;

/** Re-export from gamification for backward compatibility */
export { ACHIEVEMENT_DEFS } from "./gamification";
