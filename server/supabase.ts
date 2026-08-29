import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';
  return { url: url.trim(), key: key.trim() };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseEnv();
  return Boolean(url && key && url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    const { url, key } = getSupabaseEnv();
    supabaseInstance = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseInstance;
}

// Convert camelCase App Transaction to Supabase Snake_case row
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

// Convert Supabase Snake_case row to camelCase App Transaction
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

// Category transforms
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
    color: row.color || '#10B981',
    createdAt: row.created_at,
  };
}

// Convert App Settings to Supabase row
export function toSupabaseSettingsRow(settings: any) {
  return {
    id: 'app_settings',
    budget_cycle_start_day: Number(settings.budgetCycleStartDay) || 25,
    monthly_expense_budget: Number(settings.monthlyExpenseBudget) || 8500000,
    currency: settings.currency || 'IDR',
    updated_at: new Date().toISOString(),
  };
}

// Convert Supabase row to App Settings
export function fromSupabaseSettingsRow(row: any) {
  return {
    budgetCycleStartDay: Number(row.budget_cycle_start_day) || 25,
    monthlyExpenseBudget: Number(row.monthly_expense_budget) || 8500000,
    currency: row.currency || 'IDR',
  };
}

export async function checkSupabaseStatus() {
  const configured = isSupabaseConfigured();
  const { url } = getSupabaseEnv();
  
  if (!configured) {
    return {
      connected: false,
      configured: false,
      message: 'Supabase URL & Key belum diatur di server (.env). Silakan atur SUPABASE_URL dan SUPABASE_KEY.',
      url: url ? url.substring(0, 15) + '...' : null,
      tableTransactions: false,
      tableCategories: false,
      tableSettings: false,
      transactionCount: 0,
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      configured: true,
      message: 'Gagal menginisialisasi koneksi Supabase client.',
    };
  }

  try {
    // Check tables with a 8-second timeout promise race
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Koneksi timeout ke server Supabase (8s). Periksa URL/Network.')), 8000)
    );

    const checkPromise = (async () => {
      const { data: txData, error: txErr, count: txCount } = await client
        .from('transactions')
        .select('id', { count: 'exact', head: false })
        .limit(1);

      const { error: catErr } = await client
        .from('categories')
        .select('id')
        .limit(1);

      const { data: setRow, error: setErr } = await client
        .from('settings')
        .select('*')
        .eq('id', 'app_settings')
        .maybeSingle();

      return { txData, txErr, txCount, catErr, setRow, setErr };
    })();

    const result: any = await Promise.race([checkPromise, timeoutPromise]);
    const { txData, txErr, txCount, catErr, setErr } = result;

    const isConnected = !txErr && !catErr && !setErr;
    return {
      connected: isConnected,
      configured: true,
      url: url.replace(/^https?:\/\//, '').split('.')[0] + '.supabase.co',
      tableTransactions: !txErr,
      tableCategories: !catErr,
      tableSettings: !setErr,
      transactionCount: txCount ?? (txData ? txData.length : 0),
      message: isConnected
        ? 'Berhasil! Terhubung secara langsung dan aktif ke Database Supabase PostgreSQL.'
        : `Database terdeteksi tetapi tabel belum siap: ${txErr?.message || catErr?.message || setErr?.message || 'Tabel belum ada'}. Silakan jalankan Skrip SQL Migration di Supabase SQL Editor.`,
      txError: txErr ? txErr.message : null,
      setError: setErr ? setErr.message : null,
      catError: catErr ? catErr.message : null,
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      message: `Gagal terkoneksi ke Supabase: ${err.message || err}`,
    };
  }
}
