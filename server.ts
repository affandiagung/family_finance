import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  checkSupabaseStatus,
  toSupabaseTransactionRow,
  fromSupabaseTransactionRow,
  toSupabaseCategoryRow,
  fromSupabaseCategoryRow,
  toSupabaseSettingsRow,
  fromSupabaseSettingsRow,
} from './server/supabase';

const app = express();
const PORT = 3000;

app.use(express.json());

// Database storage directory & file. Vercel serverless functions can only
// write safely to /tmp, while local development keeps the data folder here.
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'family-finance') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'family_finance_db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface DBStructure {
  transactions: any[];
  categories: any[];
  settings: {
    budgetCycleStartDay: number;
    monthlyExpenseBudget: number;
    currency: string;
  };
}

const DEFAULT_SETTINGS = {
  budgetCycleStartDay: 25,
  monthlyExpenseBudget: 8500000,
  currency: 'IDR',
};

function loadDB(): DBStructure {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.transactions) && Array.isArray(data.categories)) {
        return {
          transactions: data.transactions,
          categories: data.categories,
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
        };
      }
    }
  } catch (err) {
    console.error('Error reading DB, resetting to empty:', err);
  }

  const initialData: DBStructure = {
    transactions: [],
    categories: [],
    settings: DEFAULT_SETTINGS,
  };
  saveDB(initialData);
  return initialData;
}

function saveDB(data: DBStructure) {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Supabase Status & Info
app.get('/api/supabase/status', async (req, res) => {
  try {
    const status = await checkSupabaseStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get SQL Migration file content
app.get('/api/supabase/schema', (req, res) => {
  try {
    const schemaPath = path.join(process.cwd(), 'supabase_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      res.json({ success: true, sql });
    } else {
      res.status(404).json({ success: false, message: 'Schema file not found' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sync local data to Supabase
app.post('/api/supabase/sync', async (req, res) => {
  const client = getSupabaseClient();
  if (!client) {
    return res.status(400).json({
      success: false,
      message: 'Supabase belum terkonfigurasi. Tambahkan SUPABASE_URL dan SUPABASE_KEY di .env terlebih dahulu.',
    });
  }

  const localDB = loadDB();
  try {
    // 1. Sync Settings
    const settingsRow = toSupabaseSettingsRow(localDB.settings);
    const { error: setErr } = await client.from('settings').upsert(settingsRow);
    if (setErr) throw setErr;

    // 2. Sync Categories
    if (localDB.categories.length > 0) {
      const catRows = localDB.categories.map(toSupabaseCategoryRow);
      const { error: catErr } = await client.from('categories').upsert(catRows);
      if (catErr) throw catErr;
    }

    // 3. Sync Transactions
    if (localDB.transactions.length > 0) {
      const rows = localDB.transactions.map(toSupabaseTransactionRow);
      const { error: txErr } = await client.from('transactions').upsert(rows);
      if (txErr) throw txErr;
    }

    res.json({
      success: true,
      message: `Berhasil menyinkronkan data (${localDB.categories.length} kategori, ${localDB.transactions.length} transaksi) ke Supabase!`,
    });
  } catch (err: any) {
    console.error('Error syncing to Supabase:', err);
    res.status(500).json({
      success: false,
      message: `Gagal migrasi data ke Supabase: ${err.message || err}. Pastikan Anda telah menjalankan supabase_schema.sql di Supabase SQL Editor.`,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    supabase: isSupabaseConfigured(),
    time: new Date().toISOString(),
  });
});

// ==========================================
// CATEGORIES CRUD ENDPOINTS
// ==========================================
app.get('/api/categories', async (req, res) => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        return res.status(500).json({ success: false, error: `Supabase Error: ${error.message}` });
      }

      const categories = Array.isArray(data) ? data.map(fromSupabaseCategoryRow) : [];
      return res.json({ success: true, source: 'supabase', data: categories });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Gagal mengambil kategori dari Supabase' });
    }
  }

  const db = loadDB();
  res.json({ success: true, source: 'local', data: db.categories || [] });
});

app.post('/api/categories', async (req, res) => {
  const newCat = {
    id: req.body.id || 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: req.body.name,
    type: req.body.type || 'expense',
    icon: req.body.icon || 'Receipt',
    color: req.body.color || (req.body.type === 'expense' ? '#F43F5E' : '#10B981'),
    createdAt: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const row = toSupabaseCategoryRow(newCat);
      const { error } = await client.from('categories').insert(row);
      if (error) {
        return res.status(500).json({ success: false, error: `Gagal simpan ke Supabase: ${error.message}` });
      }
      return res.status(201).json({ success: true, data: newCat });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Error saat insert kategori ke Supabase' });
    }
  }

  const db = loadDB();
  db.categories.push(newCat);
  saveDB(db);

  res.status(201).json({ success: true, data: newCat });
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const client = getSupabaseClient();

  if (client) {
    try {
      const row = toSupabaseCategoryRow({ id, ...req.body });
      const { error } = await client.from('categories').update(row).eq('id', id);
      if (error) {
        return res.status(500).json({ success: false, error: `Gagal update ke Supabase: ${error.message}` });
      }
      return res.json({ success: true, data: { id, ...req.body } });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Error saat update kategori ke Supabase' });
    }
  }

  const db = loadDB();
  const idx = db.categories.findIndex((c) => c.id === id);
  const updatedCat = {
    ...(idx !== -1 ? db.categories[idx] : {}),
    ...req.body,
    id,
  };
  if (idx !== -1) {
    db.categories[idx] = updatedCat;
  } else {
    db.categories.push(updatedCat);
  }
  saveDB(db);

  res.json({ success: true, data: updatedCat });
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const client = getSupabaseClient();

  if (client) {
    try {
      const { error } = await client.from('categories').delete().eq('id', id);
      if (error) {
        return res.status(500).json({ success: false, error: `Gagal hapus di Supabase: ${error.message}` });
      }
      return res.json({ success: true, message: 'Kategori berhasil dihapus' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Error saat hapus kategori di Supabase' });
    }
  }

  const db = loadDB();
  db.categories = db.categories.filter((c) => c.id !== id);
  saveDB(db);

  res.json({ success: true, message: 'Kategori berhasil dihapus' });
});

// ==========================================
// TRANSACTIONS CRUD ENDPOINTS
// ==========================================
app.get('/api/transactions', async (req, res) => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, error: `Supabase Error: ${error.message}` });
      }

      const transactions = Array.isArray(data) ? data.map(fromSupabaseTransactionRow) : [];
      return res.json({ success: true, source: 'supabase', data: transactions });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Gagal mengambil transaksi dari Supabase' });
    }
  }

  const db = loadDB();
  res.json({ success: true, source: 'local', data: db.transactions || [] });
});

app.post('/api/transactions', async (req, res) => {
  const newTx = {
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
    familyMemberId: 'family',
    familyMemberName: 'Keluarga',
    ...req.body,
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const row = toSupabaseTransactionRow(newTx);
      const { error } = await client.from('transactions').insert(row);
      if (error) {
        return res.status(500).json({ success: false, error: `Gagal simpan transaksi ke Supabase: ${error.message}` });
      }
      return res.status(201).json({ success: true, data: newTx });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Error saat insert transaksi ke Supabase' });
    }
  }

  const db = loadDB();
  db.transactions.unshift(newTx);
  saveDB(db);

  res.status(201).json({ success: true, data: newTx });
});

app.put('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const client = getSupabaseClient();

  if (client) {
    try {
      const row = toSupabaseTransactionRow({ id, ...req.body });
      const { error } = await client.from('transactions').update(row).eq('id', id);
      if (error) {
        return res.status(500).json({ success: false, error: `Gagal update transaksi di Supabase: ${error.message}` });
      }
      return res.json({ success: true, data: { id, ...req.body } });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Error saat update transaksi di Supabase' });
    }
  }

  const db = loadDB();
  const idx = db.transactions.findIndex((t) => t.id === id);
  const updatedTx = {
    ...(idx !== -1 ? db.transactions[idx] : {}),
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  if (idx !== -1) {
    db.transactions[idx] = updatedTx;
  } else {
    db.transactions.unshift(updatedTx);
  }
  saveDB(db);

  res.json({ success: true, data: updatedTx });
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const client = getSupabaseClient();

  if (client) {
    try {
      const { error } = await client.from('transactions').delete().eq('id', id);
      if (error) {
        return res.status(500).json({ success: false, error: `Gagal hapus transaksi di Supabase: ${error.message}` });
      }
      return res.json({ success: true, message: 'Transaksi berhasil dihapus' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Error saat hapus transaksi di Supabase' });
    }
  }

  const db = loadDB();
  db.transactions = db.transactions.filter((t) => t.id !== id);
  saveDB(db);

  res.json({ success: true, message: 'Transaksi berhasil dihapus' });
});

// ==========================================
// SETTINGS ENDPOINTS
// ==========================================
app.get('/api/settings', async (req, res) => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('settings')
        .select('*')
        .eq('id', 'app_settings')
        .maybeSingle();

      if (error) {
        return res.status(500).json({ success: false, error: `Supabase Error: ${error.message}` });
      }

      if (data) {
        const settings = fromSupabaseSettingsRow(data);
        return res.json({ success: true, source: 'supabase', data: settings });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Gagal mengambil settings dari Supabase' });
    }
  }

  const db = loadDB();
  res.json({ success: true, source: 'local', data: db.settings });
});

app.post('/api/settings', async (req, res) => {
  const client = getSupabaseClient();

  if (client) {
    try {
      const row = toSupabaseSettingsRow(req.body);
      const { error } = await client.from('settings').upsert(row);
      if (error) {
        return res.status(500).json({ success: false, error: `Gagal simpan settings ke Supabase: ${error.message}` });
      }
      return res.json({ success: true, data: req.body });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Error saat simpan settings ke Supabase' });
    }
  }

  const db = loadDB();
  db.settings = { ...db.settings, ...req.body };
  saveDB(db);
  res.json({ success: true, data: db.settings });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Catatan Keuangan Keluarga server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
