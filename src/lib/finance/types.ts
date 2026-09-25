export type TxType = "income" | "expense";

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
};

export type Category = {
  id: number;
  name: string;
  color: string;
  icon: string;
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

export type FinanceSnapshot = {
  settings: UserSettings;
  categories: Category[];
  envelopes: Envelope[];
  transactions: Transaction[];
  fixedEvents: FixedEvent[];
  achievements: Achievement[];
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
  aiTip: string;
  transactionsByDay: { date: string; items: Transaction[] }[];
  heatmap: HeatmapDay[];
  categoryBreakdown: CategoryExpense[];
  projection: ProjectionPoint[];
};
