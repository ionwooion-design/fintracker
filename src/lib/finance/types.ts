export type TxType = "income" | "expense";

export type CurrencyCode =
  | "RUB"
  | "USD"
  | "EUR"
  | "GBP"
  | "KZT"
  | "BYN"
  | "UAH"
  | "CNY";

export type UserSettings = {
  userId: string;
  userName: string;
  startDate: string;
  initialBalance: number;
  endDate: string;
  finalTarget: number;
  currentStreak: number;
  lastStreakDate: string | null;
  lastBudgetDay: string | null;
  privacyAccepted: boolean;
  darkTheme: boolean;
  currency: CurrencyCode;
  /** Gamification */
  level: number;
  totalXp: number;
  title: string;
  longestStreak: number;
  totalTransactions: number;
  daysLogged: number;
  lastLoginDate: string | null;
};

export const CURRENCIES: {
  code: CurrencyCode;
  symbol: string;
  name: string;
}[] = [
  { code: "RUB", symbol: "₽", name: "Российский рубль" },
  { code: "USD", symbol: "$", name: "Доллар США" },
  { code: "EUR", symbol: "€", name: "Евро" },
  { code: "GBP", symbol: "£", name: "Фунт стерлингов" },
  { code: "KZT", symbol: "₸", name: "Казахстанский тенге" },
  { code: "BYN", symbol: "Br", name: "Белорусский рубль" },
  { code: "UAH", symbol: "₴", name: "Украинская гривна" },
  { code: "CNY", symbol: "¥", name: "Китайский юань" },
];

export type CategoryKind = "expense" | "income";

export type Category = {
  id: number;
  name: string;
  color: string;
  icon: string;
  /** expense (default) or income */
  kind: CategoryKind;
};

export type Envelope = {
  id: number;
  name: string;
  budget: number;
  color: string;
  icon: string;
};

export type Transaction = {
  id: number;
  amount: number;
  type: TxType;
  description: string;
  transactionDate: string;
  categoryId: number | null;
  envelopeId: number | null;
  recurringId?: number | null;
};

export type FixedEvent = {
  id: number;
  amount: number;
  description: string;
  eventDate: string;
};

export type Achievement = {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity?: string;
  xpReward?: number;
};

export type RecurringFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export type RecurringTransaction = {
  id: number;
  amount: number;
  type: TxType;
  description: string;
  categoryId: number | null;
  envelopeId: number | null;
  frequency: RecurringFrequency;
  interval: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  monthOfYear: number | null;
  customRrule: string | null;
  startDate: string;
  endDate: string | null;
  nextOccurrence: string;
  lastGenerated: string | null;
  isActive: boolean;
  autoCreate: boolean;
};

export type EnvelopeWithSpent = Envelope & {
  spent: number;
  remaining: number;
  usagePercent: number;
  isOverBudget: boolean;
};

export type CategoryExpense = {
  category: Category;
  amount: number;
  percent: number;
};

export type ProjectionPoint = {
  date: string;
  projectedBalance: number;
};

export type HeatmapDay = {
  date: string;
  amount: number;
};

/** Personal savings goal (independent of budget-period finalTarget). */
export type SavingsGoal = {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  color: string;
  icon: string;
  isCompleted: boolean;
  completedAt: string | null;
  note: string;
  createdAt: string;
};

export type SavingsGoalWithProgress = SavingsGoal & {
  remaining: number;
  progressPercent: number;
};

export type FinanceSnapshot = {
  settings: UserSettings;
  categories: Category[];
  envelopes: Envelope[];
  transactions: Transaction[];
  fixedEvents: FixedEvent[];
  achievements: Achievement[];
  recurring: RecurringTransaction[];
  /** Savings goals — empty array if migration not applied yet */
  goals: SavingsGoal[];
};

export type DashboardComputed = {
  currentBalance: number;
  dailyLimit: number;
  spentToday: number;
  remainingToday: number;
  progressPercent: number;
  progressTone: "green" | "yellow" | "red";
  daysRemaining: number;
  currentStreak: number;
  envelopes: EnvelopeWithSpent[];
  freeMoney: number;
  /** Balance not allocated to active savings goals */
  freeAfterGoals: number;
  aiTip: string;
  transactionsByDay: { date: string; items: Transaction[] }[];
  heatmap: HeatmapDay[];
  categoryBreakdown: CategoryExpense[];
  projection: ProjectionPoint[];
  goals: SavingsGoalWithProgress[];
  goalsTotalSaved: number;
  goalsTotalTarget: number;
};
