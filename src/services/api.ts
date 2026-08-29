import { Transaction, AppSettings, Category } from '../types';

export const api = {
  // ===================================
  // CATEGORIES API
  // ===================================
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memuat kategori dari database');
    }
    return Array.isArray(json.data) ? json.data : [];
  },

  async addCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal menyimpan kategori ke database');
    }
    return json.data;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memperbarui kategori di database');
    }
    return json.data;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal menghapus kategori di database');
    }
    return true;
  },

  // ===================================
  // TRANSACTIONS API
  // ===================================
  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch('/api/transactions');
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal mengambil data transaksi dari database');
    }
    return Array.isArray(json.data) ? json.data : [];
  },

  async addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal menyimpan transaksi ke database');
    }
    return json.data;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal mengubah transaksi di database');
    }
    return json.data;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal menghapus transaksi dari database');
    }
    return true;
  },

  // ===================================
  // SETTINGS API
  // ===================================
  async getSettings(): Promise<AppSettings> {
    const res = await fetch('/api/settings');
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memuat pengaturan dari database');
    }
    return json.data || { budgetCycleStartDay: 25, monthlyExpenseBudget: 8500000, currency: 'IDR' };
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal menyimpan pengaturan ke database');
    }
    return json.data;
  },

  // ===================================
  // SUPABASE STATUS & SYNC
  // ===================================
  async getSupabaseStatus(): Promise<{
    connected: boolean;
    configured: boolean;
    url?: string | null;
    tableTransactions?: boolean;
    tableCategories?: boolean;
    tableSettings?: boolean;
    transactionCount?: number;
    message?: string;
    txError?: string | null;
    setError?: string | null;
    catError?: string | null;
  }> {
    try {
      const res = await fetch('/api/supabase/status');
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return {
        connected: false,
        configured: false,
        message: json.error || 'Terjadi kesalahan saat memeriksa database',
      };
    } catch (err: any) {
      return {
        connected: false,
        configured: false,
        message: `Tidak dapat menghubungi server: ${err.message || err}`,
      };
    }
  },

  async getSupabaseSchema(): Promise<string> {
    try {
      const res = await fetch('/api/supabase/schema');
      const json = await res.json();
      if (json.success && json.sql) return json.sql;
    } catch (err) {
      console.warn('Failed to fetch schema:', err);
    }
    return '';
  },

  async syncToSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/supabase/sync', { method: 'POST' });
      const json = await res.json();
      return {
        success: json.success,
        message: json.message || (json.success ? 'Berhasil disinkronkan' : 'Gagal sinkronisasi'),
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Koneksi gagal: ${err.message || err}`,
      };
    }
  },
};
