import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  List,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Transaction, AppSettings, Category } from '../types';
import { getBudgetCycle, computeCycleSummary } from '../utils/dateCycle';
import { formatIDR, formatCompactIDR, formatDateIndonesian } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface DashboardViewProps {
  transactions: Transaction[];
  settings: AppSettings;
  categories?: Category[];
  onUpdateSettings: (newSettings: AppSettings) => Promise<void>;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onNavigateToInput: () => void;
  onOpenWhatsAppSummary: () => void;
  onRefreshData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  settings,
  onUpdateSettings,
  onEditTransaction,
  onDeleteTransaction,
  onOpenWhatsAppSummary,
}) => {
  // Cycle Offset: 0 = current active cycle, -1 = last month's cycle, etc.
  const [cycleOffset, setCycleOffset] = useState<number>(0);
  const [dateMode, setDateMode] = useState<'cycle' | 'calendar_month' | 'all'>('cycle');

  // Filter States
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [activeChartView, setActiveChartView] = useState<'daily' | 'category'>('daily');

  // Compute active budget cycle
  const currentCycle = useMemo(() => {
    return getBudgetCycle(settings.budgetCycleStartDay || 25, cycleOffset);
  }, [settings.budgetCycleStartDay, cycleOffset]);

  // Compute summary metrics for this cycle
  const summary = useMemo(() => {
    return computeCycleSummary(transactions, currentCycle, settings.monthlyExpenseBudget);
  }, [transactions, currentCycle, settings.monthlyExpenseBudget]);

  // Filtered transactions for the view
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Date range filtering
        if (dateMode === 'cycle') {
          if (tx.date < currentCycle.startDate || tx.date > currentCycle.endDate) {
            return false;
          }
        } else if (dateMode === 'calendar_month') {
          const now = new Date();
          const targetMonth = new Date(now.getFullYear(), now.getMonth() + cycleOffset, 1);
          const y = targetMonth.getFullYear();
          const m = String(targetMonth.getMonth() + 1).padStart(2, '0');
          const prefix = `${y}-${m}`;
          if (!tx.date.startsWith(prefix)) return false;
        }

        // Type filter
        if (filterType !== 'all' && tx.type !== filterType) return false;

        // Category filter
        if (filterCategory !== 'all' && tx.categoryId !== filterCategory) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDesc = (tx.description || '').toLowerCase().includes(q);
          const matchCat = (tx.categoryName || '').toLowerCase().includes(q);
          const matchMethod = (tx.paymentMethod || '').toLowerCase().includes(q);
          if (!matchDesc && !matchCat && !matchMethod) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [
    transactions,
    dateMode,
    currentCycle,
    cycleOffset,
    filterType,
    filterCategory,
    searchQuery,
    sortBy,
  ]);

  // Daily Chart Data
  const dailyChartData = useMemo(() => {
    const start = new Date(currentCycle.startDate + 'T00:00:00');
    const end = new Date(currentCycle.endDate + 'T00:00:00');
    const daysMap: Record<string, { date: string; label: string; expense: number; income: number }> = {};

    const cur = new Date(start);
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${d}`;
      daysMap[iso] = {
        date: iso,
        label: `${cur.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][cur.getMonth()]}`,
        expense: 0,
        income: 0,
      };
      cur.setDate(cur.getDate() + 1);
    }

    for (const tx of transactions) {
      if (daysMap[tx.date]) {
        if (tx.type === 'expense') {
          daysMap[tx.date].expense += tx.amount;
        } else {
          daysMap[tx.date].income += tx.amount;
        }
      }
    }

    return Object.values(daysMap);
  }, [transactions, currentCycle]);

  // Category Chart Data
  const categoryChartData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string; count: number; icon: string }> = {};

    const cycleTxs = transactions.filter((t) => {
      if (dateMode === 'cycle') {
        return t.date >= currentCycle.startDate && t.date <= currentCycle.endDate;
      }
      return true;
    });

    const targetTxs = cycleTxs.filter((t) => (filterType === 'income' ? t.type === 'income' : t.type === 'expense'));

    for (const tx of targetTxs) {
      const key = tx.categoryId || 'other';
      if (!map[key]) {
        map[key] = {
          name: tx.categoryName,
          value: 0,
          color: tx.categoryColor || '#10B981',
          count: 0,
          icon: tx.categoryIcon || 'Receipt',
        };
      }
      map[key].value += tx.amount;
      map[key].count += 1;
    }

    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [transactions, currentCycle, dateMode, filterType]);

  // Unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    transactions.forEach((tx) => {
      if (!seen.has(tx.categoryId)) {
        seen.add(tx.categoryId);
        list.push({ id: tx.categoryId, name: tx.categoryName });
      }
    });
    return list;
  }, [transactions]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('Tidak ada transaksi yang sesuai untuk diexport.');
      return;
    }

    const headers = ['ID', 'Tanggal', 'Jenis', 'Nominal (Rp)', 'Kategori', 'Deskripsi', 'Metode'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.amount,
      `"${t.categoryName}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.paymentMethod || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_${currentCycle.startDate}_to_${currentCycle.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuickChangeCycleStartDay = async (newDay: number) => {
    await onUpdateSettings({
      ...settings,
      budgetCycleStartDay: newDay,
    });
  };

  const usagePercent = summary.budgetUsagePercent;
  const isOverBudget = usagePercent > 100;
  const isNearBudget = usagePercent >= 80 && !isOverBudget;

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-12 space-y-4 sm:space-y-5">
      {/* Top Bar: Action Buttons & Cycle Navigator */}
      <div className="bg-[#161920] rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
        {/* Row 1: Actions (Kirim WA, Export CSV) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Periode {currentCycle.monthName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenWhatsAppSummary}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-semibold text-xs flex items-center gap-1.5 transition-all"
              title="Salin Rangkuman untuk WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kirim WA</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-[#1C1F26] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-semibold text-xs flex items-center gap-1.5 transition-all"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Row 2: Responsive Date Navigator */}
        <div className="p-3 rounded-xl bg-[#0F1115] border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Cycle Navigation */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <button
              id="btn-prev-cycle"
              onClick={() => setCycleOffset((prev) => prev - 1)}
              className="p-2 rounded-lg bg-[#1C1F26] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="Siklus Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center px-2 flex-1 sm:flex-none">
              <p className="font-extrabold text-sm sm:text-base text-white">
                {currentCycle.monthName}
              </p>
              <p className="text-[11px] text-slate-400">
                {formatDateIndonesian(currentCycle.startDate, 'short')} - {formatDateIndonesian(currentCycle.endDate, 'short')}
              </p>
            </div>

            <button
              id="btn-next-cycle"
              onClick={() => setCycleOffset((prev) => prev + 1)}
              className="p-2 rounded-lg bg-[#1C1F26] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="Siklus Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {cycleOffset !== 0 && (
              <button
                onClick={() => setCycleOffset(0)}
                className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1.5 rounded-lg border border-emerald-500/20 whitespace-nowrap ml-1"
              >
                Siklus Kini
              </button>
            )}
          </div>

          {/* Awal Siklus Selector (Tgl 25, Tgl 1, Tgl 28) */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
            <span className="text-[11px] font-bold text-slate-500 mr-1">
              Awal Siklus:
            </span>
            {[
              { label: 'Tgl 25', day: 25 },
              { label: 'Tgl 1', day: 1 },
              { label: 'Tgl 28', day: 28 },
            ].map((opt) => {
              const isActive = (settings.budgetCycleStartDay || 25) === opt.day;
              return (
                <button
                  key={opt.day}
                  onClick={() => handleQuickChangeCycleStartDay(opt.day)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#1C1F26] text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/80'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Pemasukan */}
        <div className="bg-[#161920] rounded-2xl p-3.5 sm:p-4 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400">
              Pemasukan
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black font-mono text-white tracking-tight">
            {formatIDR(summary.totalIncome)}
          </p>
        </div>

        {/* Pengeluaran */}
        <div className="bg-[#161920] rounded-2xl p-3.5 sm:p-4 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-400">
              Pengeluaran
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black font-mono text-white tracking-tight">
            {formatIDR(summary.totalExpense)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Rata-rata {formatCompactIDR(summary.dailyAverageExpense)}/hari
          </p>
        </div>

        {/* Sisa Saldo Kas */}
        <div className="bg-[#161920] rounded-2xl p-3.5 sm:p-4 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-400">
              Sisa Saldo
            </span>
            <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p
            className={`text-base sm:text-xl font-black font-mono tracking-tight ${
              summary.netSavings >= 0 ? 'text-teal-400' : 'text-rose-400'
            }`}
          >
            {formatIDR(summary.netSavings)}
          </p>
        </div>

        {/* Batas Anggaran */}
        <div className="bg-[#161920] rounded-2xl p-3.5 sm:p-4 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-400">
              Sisa Budget
            </span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <p
            className={`text-base sm:text-xl font-black font-mono tracking-tight ${
              summary.budgetRemaining >= 0 ? 'text-indigo-300' : 'text-rose-400'
            }`}
          >
            {formatIDR(summary.budgetRemaining)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {usagePercent.toFixed(0)}% terpakai
          </p>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="bg-[#161920] rounded-2xl p-3.5 sm:p-4 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            {isOverBudget ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : isNearBudget ? (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className={isOverBudget ? 'text-rose-400' : isNearBudget ? 'text-amber-400' : 'text-emerald-400'}>
              {usagePercent.toFixed(1)}% Budget Terpakai
            </span>
          </div>

          <span className="font-mono text-slate-400 text-[11px]">
            {formatIDR(summary.totalExpense)} / {formatIDR(settings.monthlyExpenseBudget || 8500000)}
          </span>
        </div>

        <div className="w-full h-2.5 bg-[#0F1115] rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget
                ? 'bg-rose-500'
                : isNearBudget
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
            }`}
            style={{ width: `${Math.min(100, usagePercent)}%` }}
          />
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-[#161920] rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 truncate">
            <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Grafik Analisis ({currentCycle.monthName})</span>
          </h2>

          <div className="flex items-center gap-1 bg-[#0F1115] p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveChartView('daily')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeChartView === 'daily'
                  ? 'bg-[#1C1F26] text-emerald-400 border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tren Harian
            </button>
            <button
              onClick={() => setActiveChartView('category')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeChartView === 'category'
                  ? 'bg-[#1C1F26] text-emerald-400 border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kategori
            </button>
          </div>
        </div>

        {activeChartView === 'daily' ? (
          <div className="h-60 sm:h-68 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData} margin={{ top: 10, right: 5, left: -15, bottom: 5 }}>
                <XAxis
                  dataKey="label"
                  stroke="#64748B"
                  fontSize={9}
                  tickLine={false}
                  interval={Math.ceil(dailyChartData.length / 7)}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={9}
                  tickLine={false}
                  tickFormatter={(val) => formatCompactIDR(val)}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    formatIDR(Number(val)),
                    name === 'expense' ? 'Pengeluaran' : 'Pemasukan',
                  ]}
                  labelFormatter={(label) => `Tgl: ${label}`}
                  contentStyle={{
                    backgroundColor: '#161920',
                    borderRadius: '10px',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  formatter={(val) => (val === 'expense' ? 'Pengeluaran' : 'Pemasukan')}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                />
                <Bar dataKey="expense" fill="#F43F5E" radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Bar dataKey="income" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-56 w-full">
              {categoryChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Belum ada data pengeluaran pada siklus ini.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatIDR(Number(val)), 'Total']}
                      contentStyle={{
                        backgroundColor: '#161920',
                        borderRadius: '10px',
                        color: '#F8FAFC',
                        border: '1px solid #334155',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {categoryChartData.map((cat) => {
                const totalCatVal = categoryChartData.reduce((acc, c) => acc + c.value, 0);
                const percent = totalCatVal > 0 ? (cat.value / totalCatVal) * 100 : 0;
                return (
                  <div
                    key={cat.name}
                    className="p-2 rounded-xl bg-[#1C1F26] border border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-slate-700/50"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-200 truncate text-[11px]">{cat.name}</p>
                        <p className="text-[10px] text-slate-500">{cat.count} transaksi</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-extrabold font-mono text-slate-100 text-xs">{formatIDR(cat.value)}</p>
                      <p className="text-[10px] text-slate-400">{percent.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter & Transactions List */}
      <div className="bg-[#161920] rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
            <List className="w-4 h-4 text-emerald-400" />
            <span>Daftar Transaksi ({filteredTransactions.length})</span>
          </h2>

          <div className="flex items-center gap-1 bg-[#0F1115] p-1 rounded-xl text-xs font-semibold border border-slate-800">
            <button
              onClick={() => setDateMode('cycle')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                dateMode === 'cycle' ? 'bg-[#1C1F26] text-emerald-400 border border-slate-700 font-bold' : 'text-slate-400'
              }`}
            >
              Siklus
            </button>
            <button
              onClick={() => setDateMode('calendar_month')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                dateMode === 'calendar_month' ? 'bg-[#1C1F26] text-emerald-400 border border-slate-700 font-bold' : 'text-slate-400'
              }`}
            >
              Bulan
            </button>
            <button
              onClick={() => setDateMode('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                dateMode === 'all' ? 'bg-[#1C1F26] text-emerald-400 border border-slate-700 font-bold' : 'text-slate-400'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 text-xs font-medium focus:outline-none focus:border-emerald-500 bg-[#1C1F26] text-slate-100 placeholder-slate-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-[#1C1F26] text-slate-200"
            >
              <option value="all">⚡ Semua Jenis</option>
              <option value="expense">🔴 Pengeluaran</option>
              <option value="income">🟢 Pemasukan</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-[#1C1F26] text-slate-200"
            >
              <option value="all">🏷️ Semua Kategori</option>
              {uniqueCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort & Reset */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ArrowUpDown className="w-3 h-3" />
            <span>Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-bold text-emerald-400 underline focus:outline-none cursor-pointer text-xs"
            >
              <option value="date_desc" className="bg-[#161920] text-slate-200">Tanggal Terbaru</option>
              <option value="date_asc" className="bg-[#161920] text-slate-200">Tanggal Terlama</option>
              <option value="amount_desc" className="bg-[#161920] text-slate-200">Nominal Terbesar</option>
              <option value="amount_asc" className="bg-[#161920] text-slate-200">Nominal Terkecil</option>
            </select>
          </div>

          {(filterType !== 'all' || filterCategory !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setFilterType('all');
                setFilterCategory('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 underline"
            >
              Reset
            </button>
          )}
        </div>

        {/* Transactions List */}
        <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60 bg-[#161920]">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-1">
              <p className="text-xs font-semibold">Tidak ada transaksi yang cocok.</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}
                  >
                    <CategoryIcon name={tx.categoryIcon} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                      {tx.description || tx.categoryName}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                      <span className="font-mono text-slate-400">{formatDateIndonesian(tx.date, 'day-date')}</span>
                      <span>•</span>
                      <span className="text-slate-400">{tx.categoryName}</span>
                      {tx.paymentMethod && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500">{tx.paymentMethod}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-xs sm:text-sm font-extrabold font-mono ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {formatIDR(tx.amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      title="Edit"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus transaksi ini?`)) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      title="Hapus"
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
