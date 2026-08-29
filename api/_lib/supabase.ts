import type { SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SETTINGS = {
  budgetCycleStartDay: 25,
  monthlyExpenseBudget: 8500000,
  currency: 'IDR',
};

export function getSupabaseEnv() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const key = (
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  return { url, key };
}

export async function getSupabaseClient(): Promise<SupabaseClient> {
  const { url, key } = getSupabaseEnv();
  if (!url || !key || !url.startsWith('http')) {
    throw new Error('Supabase belum terkonfigurasi di Vercel Environment Variables.');
  }

  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key, { auth: { persistSession: false } });
}

export function json(res: any, status: number, body: any) {
  return res.status(status).json(body);
}

export function methodNotAllowed(res: any) {
  return json(res, 405, { success: false, error: 'Method not allowed' });
}

export function handleError(res: any, err: any, fallback: string) {
  return json(res, 500, { success: false, error: err?.message || fallback });
}

export function toSupabaseTransactionRow(tx: any) {
  return {
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount) || 0,
    date: tx.date,
    category_id: tx.categoryId,
    category_name: tx.categoryName,
    category_icon: tx.categoryIcon || 'Receipt',
    category_color: tx.categoryColor || '#10B981',
    description: tx.description || '',
    family_member_id: tx.familyMemberId || 'family',
    family_member_name: tx.familyMemberName || 'Keluarga',
    payment_method: tx.paymentMethod || (tx.type === 'expense' ? 'QRIS' : 'MANDIRI'),
    created_at: tx.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function fromSupabaseTransactionRow(row: any) {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount) || 0,
    date: row.date,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryIcon: row.category_icon || 'Receipt',
    categoryColor: row.category_color || '#10B981',
    description: row.description || '',
    familyMemberId: row.family_member_id || 'family',
    familyMemberName: row.family_member_name || 'Keluarga',
    paymentMethod: row.payment_method || (row.type === 'expense' ? 'QRIS' : 'MANDIRI'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSupabaseCategoryRow(cat: any) {
  return {
    id: cat.id,
    name: cat.name,
    type: cat.type,
    icon: cat.icon || 'Receipt',
    color: cat.color || '#10B981',
    created_at: cat.createdAt || new Date().toISOString(),
  };
}

export function fromSupabaseCategoryRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    icon: row.icon || 'Receipt',
    color: row.color,
    createdAt: row.created_at,
  };
}

export function toSupabaseSettingsRow(settings: any) {
  return {
    id: 'app_settings',
    budget_cycle_start_day: Number(settings.budgetCycleStartDay) || DEFAULT_SETTINGS.budgetCycleStartDay,
    monthly_expense_budget: Number(settings.monthlyExpenseBudget) || DEFAULT_SETTINGS.monthlyExpenseBudget,
    currency: settings.currency || DEFAULT_SETTINGS.currency,
    updated_at: new Date().toISOString(),
  };
}

export function fromSupabaseSettingsRow(row: any) {
  return {
    budgetCycleStartDay: Number(row.budget_cycle_start_day) || DEFAULT_SETTINGS.budgetCycleStartDay,
    monthlyExpenseBudget: Number(row.monthly_expense_budget) || DEFAULT_SETTINGS.monthlyExpenseBudget,
    currency: row.currency || DEFAULT_SETTINGS.currency,
  };
}
