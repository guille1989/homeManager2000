export type Period = "week" | "month" | "year";
export type TransactionType = "income" | "expense";
export type SplitMode = "individual" | "shared";
export type Visibility = "private" | "shared";
export type SplitType = "equal" | "percentage" | "custom";

export type User = {
  id: string;
  name: string;
  email: string;
  householdId?: string;
};

export type Household = {
  _id: string;
  name: string;
  currency: string;
  partnerNames: string[];
};

export type Category = {
  _id: string;
  name: string;
  type: "income" | "expense" | "both";
  color: string;
  icon?: string;
  isDefault: boolean;
};

export type Transaction = {
  _id: string;
  type: TransactionType;
  amount: number;
  categoryId: string | Category;
  description: string;
  date: string;
  paidBy: string;
  splitMode: SplitMode;
  visibility: Visibility;
  ownerId?: string;
  splitType: SplitType;
  splitConfig?: { shares?: Record<string, number> };
  isRecurring: boolean;
};

export type TransactionListResponse = {
  items: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totals: {
    count: number;
    income: number;
    expense: number;
    balance: number;
  };
};

export type Budget = {
  _id: string;
  categoryId: Category;
  month: number;
  year: number;
  limit: number;
  visibility: Visibility;
  ownerId?: string;
  spent: number;
  percentage: number;
};

export type SavingsGoal = {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  color: string;
  visibility: Visibility;
  ownerId?: string;
  type: "personal" | "shared";
  percentage: number;
  remaining: number;
  monthlyRequired: number;
};

export type Summary = {
  income: number;
  expense: number;
  balance: number;
  estimatedSavings: number;
  goals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    percentage: number;
    color: string;
  }>;
};

export type CategoryBreakdown = {
  categoryId: string;
  name: string;
  color: string;
  total: number;
};

export type IncomeExpensePoint = {
  label: string;
  income: number;
  expense: number;
};

export type PartnerBalance = {
  partnerNames: string[];
  contributions: Record<string, number>;
  paidExpenses: Record<string, number>;
  contributionPercentages: Record<string, number>;
  contributionDifference: number;
  totalSharedExpenses: number;
  sharedExpenseNet: Record<string, number>;
  settlement: null | {
    from: string;
    to: string;
    amount: number;
  };
};
