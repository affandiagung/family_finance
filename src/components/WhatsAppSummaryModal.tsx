import React, { useState } from 'react';
import { Share2, Copy, Check, X, MessageSquare } from 'lucide-react';
import { Transaction, BudgetCycle, AppSettings } from '../types';
import { computeCycleSummary } from '../utils/dateCycle';
import { formatIDR, formatDateIndonesian } from '../utils/formatters';

interface WhatsAppSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  cycle: BudgetCycle;
  settings: AppSettings;
}

export const WhatsAppSummaryModal: React.FC<WhatsAppSummaryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  cycle,
  settings,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const summary = computeCycleSummary(transactions, cycle, settings.monthlyExpenseBudget);

  // Group top 3 expense categories
  const expenseTxs = transactions.filter(
    (t) => t.type === 'expense' && t.date >= cycle.startDate && t.date <= cycle.endDate
  );
  const catMap: Record<string, number> = {};
  expenseTxs.forEach((t) => {
    catMap[t.categoryName] = (catMap[t.categoryName] || 0) + t.amount;
  });
  const topCategories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const reportText = `📋 *LAPORAN KEUANGAN KELUARGA*
📅 *Periode:* ${formatDateIndonesian(cycle.startDate, 'short')} s/d ${formatDateIndonesian(cycle.endDate, 'short')}

🟢 *Total Pemasukan:* ${formatIDR(summary.totalIncome)}
🔴 *Total Pengeluaran:* ${formatIDR(summary.totalExpense)}
💰 *Sisa Saldo Kas:* ${formatIDR(summary.netSavings)}
🎯 *Target Budget:* ${formatIDR(settings.monthlyExpenseBudget)} (${summary.budgetUsagePercent.toFixed(1)}% terpakai)

🏷️ *Pos Pengeluaran Terbesar:*
${topCategories.length > 0 ? topCategories.map((c, i) => `${i + 1}. ${c[0]}: ${formatIDR(c[1])}`).join('\n') : '- Belum ada data pengeluaran'}

💡 *Sisa Jatah Harian:* ${formatIDR(summary.dailyBudgetRemaining)}/hari (${Math.max(0, cycle.daysTotal - cycle.dayCurrent)} hari tersisa).

_Dibuat otomatis via Catatan Keuangan Keluarga_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWA = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#161920] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Rangkuman WhatsApp Keluarga
              </h3>
              <p className="text-xs text-slate-400">
                Format pesan siap kirim untuk grup WhatsApp keluarga.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Preview Box */}
        <div className="bg-[#0F1115] rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed select-all">
          {reportText}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#1C1F26] hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Teks Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Teks Pesan</span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenWA}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40"
          >
            <Share2 className="w-4 h-4" />
            <span>Buka WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
