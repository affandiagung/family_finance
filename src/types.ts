export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  createdAt?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO format: YYYY-MM-DD
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  description: string;
  familyMemberId?: string;
  familyMemberName?: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface AppSettings {
  budgetCycleStartDay: number; // e.g. 25, 1, 28
  monthlyExpenseBudget: number; // target monthly expense budget in IDR
  currency: string;
  familyMembers?: FamilyMember[];
  customCategories?: Category[];
}

export interface BudgetCycle {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;     // e.g. "Periode 25 Jul - 24 Agu 2026"
  monthName: string; // e.g. "Agustus 2026"
  year: number;
  month: number;
  daysTotal: number;
  dayCurrent: number;
  isCurrentCycle: boolean;
}

export interface CycleSummary {
  cycle: BudgetCycle;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  budget: number;
  budgetRemaining: number;
  budgetUsagePercent: number;
  dailyAverageExpense: number;
  dailyBudgetRemaining: number;
  transactionCount: number;
}

export interface FilterOptions {
  type: 'all' | 'expense' | 'income';
  categoryId: string; // 'all' or category ID
  searchQuery: string;
  dateRangeMode: 'cycle' | 'this_month' | 'today' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  selectedCycleOffset?: number;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}
