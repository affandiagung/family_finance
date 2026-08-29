import { Category, AppSettings } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp_food', name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: '#F97316' },
  { id: 'exp_groceries', name: 'Belanja Dapur & Pokok', type: 'expense', icon: 'ShoppingCart', color: '#10B981' },
  { id: 'exp_bills', name: 'Listrik, Air & Wifi', type: 'expense', icon: 'Zap', color: '#3B82F6' },
  { id: 'exp_transport', name: 'Transport & Bensin', type: 'expense', icon: 'Car', color: '#EAB308' },
  { id: 'exp_health', name: 'Kesehatan & Obat', type: 'expense', icon: 'HeartPulse', color: '#EC4899' },
  { id: 'exp_installment', name: 'Cicilan & Tagihan', type: 'expense', icon: 'CreditCard', color: '#EF4444' },
  { id: 'exp_housing', name: 'Kebutuhan Rumah', type: 'expense', icon: 'Home', color: '#06B6D4' },
  { id: 'exp_personal', name: 'Keperluan Pribadi', type: 'expense', icon: 'Smile', color: '#F43F5E' },
  { id: 'exp_other', name: 'Pengeluaran Lainnya', type: 'expense', icon: 'MoreHorizontal', color: '#64748B' },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'inc_salary', name: 'Gaji Bulanan', type: 'income', icon: 'Briefcase', color: '#10B981' },
  { id: 'inc_bonus', name: 'Bonus & THR', type: 'income', icon: 'Award', color: '#059669' },
  { id: 'inc_business', name: 'Usaha & Bisnis', type: 'income', icon: 'Store', color: '#3B82F6' },
  { id: 'inc_freelance', name: 'Freelance & Sampingan', type: 'income', icon: 'Laptop', color: '#8B5CF6' },
  { id: 'inc_investment', name: 'Investasi & Dividen', type: 'income', icon: 'TrendingUp', color: '#F59E0B' },
  { id: 'inc_other', name: 'Pemasukan Lainnya', type: 'income', icon: 'PlusCircle', color: '#64748B' },
];

export const ALL_DEFAULT_CATEGORIES: Category[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

export const DEFAULT_SETTINGS: AppSettings = {
  budgetCycleStartDay: 25,
  monthlyExpenseBudget: 8500000,
  currency: 'IDR',
};
