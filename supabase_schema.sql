-- =========================================================
-- CATATAN KEUANGAN KELUARGA - SUPABASE DATABASE MIGRATION
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- =========================================================

-- 1. Table Transactions (Pemasukan & Pengeluaran)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  category_icon TEXT DEFAULT 'Receipt',
  category_color TEXT DEFAULT '#10B981',
  description TEXT,
  family_member_id TEXT DEFAULT 'family',
  family_member_name TEXT DEFAULT 'Keluarga',
  payment_method TEXT DEFAULT 'QRIS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query tanggal & tipe transaksi
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions (category_id);

-- 2. Table Categories (Manajemen Kategori CRUD)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL DEFAULT 'Receipt',
  color TEXT NOT NULL DEFAULT '#10B981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories (type);

-- 3. Table App Settings (Siklus Gajian & Target Budget Bulanan)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  budget_cycle_start_day INT NOT NULL DEFAULT 25,
  monthly_expense_budget NUMERIC NOT NULL DEFAULT 8500000,
  currency TEXT NOT NULL DEFAULT 'IDR',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Insert Default Categories jika belum ada
INSERT INTO public.categories (id, name, type, icon, color) VALUES
  ('exp_food', 'Makanan & Minuman', 'expense', 'Utensils', '#F97316'),
  ('exp_groceries', 'Belanja Dapur & Pokok', 'expense', 'ShoppingCart', '#10B981'),
  ('exp_bills', 'Listrik, Air & Wifi', 'expense', 'Zap', '#3B82F6'),
  ('exp_transport', 'Transport & Bensin', 'expense', 'Car', '#EAB308'),
  ('exp_health', 'Kesehatan & Obat', 'expense', 'HeartPulse', '#EC4899'),
  ('exp_installment', 'Cicilan & Tagihan', 'expense', 'CreditCard', '#EF4444'),
  ('exp_housing', 'Kebutuhan Rumah', 'expense', 'Home', '#06B6D4'),
  ('exp_personal', 'Keperluan Pribadi', 'expense', 'Smile', '#F43F5E'),
  ('exp_other', 'Pengeluaran Lainnya', 'expense', 'MoreHorizontal', '#64748B'),
  ('inc_salary', 'Gaji Bulanan', 'income', 'Briefcase', '#10B981'),
  ('inc_bonus', 'Bonus & THR', 'income', 'Award', '#059669'),
  ('inc_business', 'Usaha & Bisnis', 'income', 'Store', '#3B82F6'),
  ('inc_freelance', 'Freelance & Sampingan', 'income', 'Laptop', '#8B5CF6'),
  ('inc_investment', 'Investasi & Dividen', 'income', 'TrendingUp', '#F59E0B'),
  ('inc_other', 'Pemasukan Lainnya', 'income', 'PlusCircle', '#64748B')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Default Settings row jika belum ada
INSERT INTO public.settings (
  id,
  budget_cycle_start_day,
  monthly_expense_budget,
  currency
) VALUES (
  'app_settings',
  25,
  8500000,
  'IDR'
) ON CONFLICT (id) DO NOTHING;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 7. Kebijakan Keamanan (Policies) untuk Akses Anonim / Publik
CREATE POLICY "Allow public read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete transactions" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete categories" ON public.categories FOR DELETE USING (true);

CREATE POLICY "Allow public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert settings" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update settings" ON public.settings FOR UPDATE USING (true);
