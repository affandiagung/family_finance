import React, { useState, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  Database,
  Copy,
  RefreshCw,
  CloudUpload,
  Layers,
  Tag,
  X,
} from 'lucide-react';
import { AppSettings, Category, TransactionType } from '../types';
import { formatIDR } from '../utils/formatters';
import { api } from '../services/api';
import { CategoryIcon } from './CategoryIcon';

interface SettingsViewProps {
  settings: AppSettings;
  categories: Category[];
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onAddCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  categories,
  onSaveSettings,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [cycleStartDay, setCycleStartDay] = useState<number>(settings.budgetCycleStartDay || 25);
  const [monthlyBudgetStr, setMonthlyBudgetStr] = useState<string>(
    (settings.monthlyExpenseBudget || 8500000).toString()
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Category Tab state
  const [catTab, setCatTab] = useState<TransactionType>('expense');
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatColor, setNewCatColor] = useState<string>('#F43F5E');
  const [newCatIcon, setNewCatIcon] = useState<string>('Receipt');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState<string>('');

  // Supabase state
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [sqlSchema, setSqlSchema] = useState<string>('');
  const [showSql, setShowSql] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Popup Modal feedback state
  const [feedbackPopup, setFeedbackPopup] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const budgetNumber = parseInt(monthlyBudgetStr.replace(/\D/g, '') || '0', 10);

  const loadSupabaseInfo = async (showPopup = false) => {
    setIsLoadingStatus(true);
    try {
      const status = await api.getSupabaseStatus();
      setSupabaseStatus(status);
      const schema = await api.getSupabaseSchema();
      setSqlSchema(schema);

      if (showPopup) {
        if (status.connected) {
          setFeedbackPopup({
            isOpen: true,
            type: 'success',
            title: 'Koneksi Database Berhasil!',
            message: `Aplikasi berhasil terhubung secara langsung ke Database Supabase PostgreSQL (${status.url || 'Supabase'}). Semua data transaksi & kategori langsung tersimpan di database.`,
          });
        } else if (status.configured) {
          setFeedbackPopup({
            isOpen: true,
            type: 'error',
            title: 'Tabel Belum Siap di Supabase',
            message: status.message || 'Database terdeteksi namun tabel transaksi/kategori belum dibuat. Silakan salin & jalankan SQL Migration.',
          });
        } else {
          setFeedbackPopup({
            isOpen: true,
            type: 'error',
            title: 'Koneksi Supabase Gagal / Belum Diatur',
            message: status.message || 'SUPABASE_URL dan SUPABASE_KEY belum terkonfigurasi di server.',
          });
        }
      }
    } catch (e: any) {
      console.warn(e);
      if (showPopup) {
        setFeedbackPopup({
          isOpen: true,
          type: 'error',
          title: 'Gagal Memeriksa Koneksi',
          message: e.message || 'Tidak dapat menghubungi server backend database.',
        });
      }
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadSupabaseInfo(false);
  }, []);

  const handleCopySql = () => {
    if (!sqlSchema) return;
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.syncToSupabase();
      setSyncMessage(res.message);
      await loadSupabaseInfo(false);
      setFeedbackPopup({
        isOpen: true,
        type: res.success ? 'success' : 'error',
        title: res.success ? 'Sinkronisasi Berhasil' : 'Sinkronisasi Gagal',
        message: res.message,
      });
    } catch (err: any) {
      setSyncMessage(`Gagal: ${err.message || err}`);
      setFeedbackPopup({
        isOpen: true,
        type: 'error',
        title: 'Gagal Sinkronisasi',
        message: `Terjadi kesalahan: ${err.message || err}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings({
        ...settings,
        budgetCycleStartDay: Math.max(1, Math.min(31, cycleStartDay)),
        monthlyExpenseBudget: budgetNumber,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      setFeedbackPopup({
        isOpen: true,
        type: 'success',
        title: 'Pengaturan Berhasil Disimpan',
        message: 'Perubahan tanggal siklus dan target anggaran telah berhasil disimpan ke database.',
      });
    } catch (err: any) {
      console.error(err);
      setFeedbackPopup({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menyimpan Pengaturan',
        message: err.message || 'Terjadi kesalahan saat menyimpan pengaturan ke database.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setFeedbackPopup({
        isOpen: true,
        type: 'error',
        title: 'Nama Kategori Kosong',
        message: 'Mohon masukkan nama kategori terlebih dahulu.',
      });
      return;
    }
    try {
      await onAddCategory({
        name: newCatName.trim(),
        type: catTab,
        icon: newCatIcon,
        color: newCatColor,
      });
      setNewCatName('');
      setFeedbackPopup({
        isOpen: true,
        type: 'success',
        title: 'Kategori Berhasil Ditambahkan',
        message: `Kategori "${newCatName.trim()}" telah berhasil disimpan ke database.`,
      });
    } catch (err: any) {
      setFeedbackPopup({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menambah Kategori',
        message: err.message || 'Database menolak penambahan kategori.',
      });
    }
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleSaveEditCategory = async (id: string) => {
    if (!editingCatName.trim()) return;
    try {
      await onUpdateCategory(id, { name: editingCatName.trim() });
      setEditingCatId(null);
      setFeedbackPopup({
        isOpen: true,
        type: 'success',
        title: 'Kategori Diperbarui',
        message: 'Nama kategori telah berhasil diperbarui di database.',
      });
    } catch (err: any) {
      setFeedbackPopup({
        isOpen: true,
        type: 'error',
        title: 'Gagal Mengubah Kategori',
        message: err.message || 'Database menolak pembaruan kategori.',
      });
    }
  };

  const currentCategoryList = categories.filter((c) => c.type === catTab);

  const availableColors = [
    '#F43F5E', '#FB7185', '#F97316', '#F59E0B', '#EAB308',
    '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B',
  ];

  const availableIcons = [
    'Receipt', 'Utensils', 'ShoppingCart', 'Zap', 'Car', 'HeartPulse',
    'CreditCard', 'Home', 'Smile', 'Briefcase', 'Award', 'Store',
    'Laptop', 'TrendingUp', 'PlusCircle', 'Tag',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12 space-y-5">
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2 text-sm font-bold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Pengaturan berhasil disimpan!</span>
        </div>
      )}

      {/* 1. Koneksi DB */}
      <div className="bg-[#161920] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Koneksi DB (Supabase PostgreSQL)</span>
              {supabaseStatus?.connected ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  🟢 Terhubung
                </span>
              ) : supabaseStatus?.configured ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  🟡 Perlu Migrasi
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  ⚙️ Mode Lokal
                </span>
              )}
            </h2>
          </div>

          <button
            id="btn-check-db-status"
            type="button"
            onClick={() => loadSupabaseInfo(true)}
            disabled={isLoadingStatus}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#1C1F26] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Check Status</span>
          </button>
        </div>

        {/* Status text */}
        <p className="text-xs text-slate-400">
          {supabaseStatus?.message || 'Memeriksa status koneksi database...'}
        </p>

        {syncMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            {syncMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowSql(!showSql)}
            className="px-3 py-1.5 rounded-xl bg-[#1C1F26] hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>{showSql ? 'Tutup Skrip SQL' : 'Skrip SQL Migration'}</span>
          </button>

          {supabaseStatus?.configured && (
            <button
              type="button"
              onClick={handleSyncToSupabase}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data ke DB'}</span>
            </button>
          )}
        </div>

        {showSql && (
          <div className="space-y-2 pt-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                SQL Schema untuk Supabase:
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-2 py-1 rounded bg-[#1C1F26] hover:bg-slate-800 text-xs text-slate-200 font-bold flex items-center gap-1 border border-slate-700"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Salin SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-[#0F1115] border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-56 leading-relaxed select-all">
              {sqlSchema || '-- Memuat skrip schema...'}
            </pre>
          </div>
        )}
      </div>

      {/* Feedback Popup Modal */}
      {feedbackPopup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161920] border border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  feedbackPopup.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {feedbackPopup.type === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white leading-tight">
                  {feedbackPopup.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">
                  {feedbackPopup.message}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setFeedbackPopup((prev) => ({ ...prev, isOpen: false }))}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all ${
                  feedbackPopup.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Manajemen Table Kategori */}
      <div className="bg-[#161920] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Tabel Kategori ({categories.length})
            </h2>
          </div>

          {/* Switcher: Pengeluaran / Pemasukan */}
          <div className="flex items-center gap-1 bg-[#0F1115] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setCatTab('expense');
                setNewCatColor('#F43F5E');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                catTab === 'expense'
                  ? 'bg-[#1C1F26] text-rose-400 border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => {
                setCatTab('income');
                setNewCatColor('#10B981');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                catTab === 'income'
                  ? 'bg-[#1C1F26] text-emerald-400 border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pemasukan
            </button>
          </div>
        </div>

        {/* List Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {currentCategoryList.map((cat) => (
            <div
              key={cat.id}
              className="p-2.5 rounded-xl bg-[#1C1F26] border border-slate-800 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-slate-700/60"
                  style={{ backgroundColor: `${cat.color || '#10B981'}20`, color: cat.color || '#10B981' }}
                >
                  <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                </div>

                {editingCatId === cat.id ? (
                  <input
                    type="text"
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                    className="flex-1 px-2 py-1 bg-[#0F1115] border border-emerald-500 rounded-lg text-xs font-bold text-white focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {cat.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {editingCatId === cat.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveEditCategory(cat.id)}
                      className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                      title="Simpan"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCatId(null)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-800"
                      title="Batal"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEditCategory(cat)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus kategori "${cat.name}"?`)) {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Form Tambah Kategori */}
        <form onSubmit={handleCreateCategory} className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder={`Tambah kategori ${catTab === 'expense' ? 'pengeluaran' : 'pemasukan'} baru...`}
            className="w-full sm:flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-[#1C1F26] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />

          {/* Color & Icon Picker */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <select
              value={newCatIcon}
              onChange={(e) => setNewCatIcon(e.target.value)}
              className="px-2 py-2 rounded-xl border border-slate-700 bg-[#1C1F26] text-xs text-white focus:outline-none"
            >
              {availableIcons.map((ic) => (
                <option key={ic} value={ic} className="bg-[#161920]">
                  {ic}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 overflow-x-auto max-w-[120px]">
              {availableColors.slice(0, 5).map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setNewCatColor(col)}
                  className={`w-5 h-5 rounded-full shrink-0 border transition-all ${
                    newCatColor === col ? 'scale-110 border-white ring-1 ring-white' : 'border-transparent opacity-70'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>

            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Siklus & Target Budget */}
      <form onSubmit={handleSaveGeneral} className="space-y-5">
        <div className="bg-[#161920] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Tanggal Awal Siklus Anggaran
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tanggal Mulai (1 - 31)
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={cycleStartDay}
                  onChange={(e) => setCycleStartDay(parseInt(e.target.value || '1', 10))}
                  className="w-20 px-3 py-2 rounded-xl border border-slate-700 bg-[#1C1F26] text-white text-base font-bold font-mono text-center focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-400">setiap bulan</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Preset
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  { label: 'Tgl 25', day: 25 },
                  { label: 'Tgl 1', day: 1 },
                  { label: 'Tgl 28', day: 28 },
                ].map((preset) => (
                  <button
                    key={preset.day}
                    type="button"
                    onClick={() => setCycleStartDay(preset.day)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      cycleStartDay === preset.day
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-[#1C1F26] hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Target Batas Anggaran */}
        <div className="bg-[#161920] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Target Batas Anggaran Bulanan
            </h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Nominal Budget (IDR)
            </label>
            <div className="relative max-w-sm">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-slate-500 text-xs">
                Rp
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={budgetNumber > 0 ? formatIDR(budgetNumber, false) : ''}
                onChange={(e) => setMonthlyBudgetStr(e.target.value.replace(/\D/g, ''))}
                placeholder="8.500.000"
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700 bg-[#1C1F26] font-bold font-mono text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div>
          <button
            id="btn-save-settings"
            type="submit"
            disabled={isSaving}
            className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
