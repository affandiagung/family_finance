import React, { useState, useEffect } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Transaction, TransactionType, Category } from '../types';
import { formatIDR, getTodayString } from '../utils/formatters';

interface TransactionFormProps {
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  categories?: Category[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSave,
  categories = [],
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayString());
  const [paymentMethod, setPaymentMethod] = useState<string>('QRIS');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.type === type);

  // When type or categories change, ensure a valid category and payment method is selected
  useEffect(() => {
    if (availableCategories.length > 0) {
      if (!availableCategories.some((c) => c.id === selectedCategoryId)) {
        setSelectedCategoryId(availableCategories[0].id);
      }
    } else {
      setSelectedCategoryId('');
    }

    if (type === 'expense') {
      if (paymentMethod !== 'QRIS' && paymentMethod !== 'CASH') {
        setPaymentMethod('QRIS');
      }
    } else {
      setPaymentMethod('MANDIRI');
    }
  }, [type, categories]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'expense') {
      setPaymentMethod('QRIS');
    } else {
      setPaymentMethod('MANDIRI');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmountStr(raw);
  };

  const rawAmountNumber = parseInt(amountStr || '0', 10);
  const currentCategory = availableCategories.find((c) => c.id === selectedCategoryId) || availableCategories[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawAmountNumber <= 0) {
      setErrorMessage('Mohon masukkan nominal transaksi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSave({
        type,
        amount: rawAmountNumber,
        date,
        categoryId: currentCategory?.id || 'other',
        categoryName: currentCategory?.name || (type === 'expense' ? 'Pengeluaran' : 'Pemasukan'),
        categoryIcon: currentCategory?.icon || 'Receipt',
        categoryColor: currentCategory?.color || (type === 'expense' ? '#F43F5E' : '#10B981'),
        description: description.trim(),
        familyMemberId: 'family',
        familyMemberName: 'Keluarga',
        paymentMethod,
      });

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: type === 'income' ? ['#10B981', '#34D399'] : ['#F43F5E', '#FB7185'],
      });

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      setAmountStr('');
      setDescription('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal menyimpan transaksi ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 pb-24 md:pb-12">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2 text-sm font-semibold animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Transaksi berhasil disimpan ke database!</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between gap-2 text-xs font-semibold animate-in fade-in duration-200">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 font-bold px-1.5 py-0.5 hover:bg-rose-500/20 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-[#161920] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Switcher: Pengeluaran / Pemasukan */}
        <div className="p-2 bg-[#0F1115] border-b border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <button
              id="type-tab-expense"
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40 border border-rose-500'
                  : 'bg-[#161920] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Pengeluaran</span>
            </button>

            <button
              id="type-tab-income"
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500'
                  : 'bg-[#161920] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Pemasukan</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nominal (Rp) */}
          <div>
            <label htmlFor="tx-amount-input" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Nominal (Rp)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-mono font-bold text-base text-slate-500 select-none">
                Rp
              </span>
              <input
                id="tx-amount-input"
                type="text"
                inputMode="numeric"
                value={rawAmountNumber > 0 ? formatIDR(rawAmountNumber, false) : ''}
                onChange={handleAmountChange}
                placeholder="0"
                autoComplete="off"
                className={`w-full pl-12 pr-4 py-3 rounded-xl text-xl font-extrabold font-mono text-white bg-[#1C1F26] border placeholder-slate-600 focus:outline-none transition-all ${
                  type === 'expense'
                    ? 'border-slate-700 focus:border-rose-500'
                    : 'border-slate-700 focus:border-emerald-500'
                }`}
                autoFocus
              />
            </div>
          </div>

          {/* Tanggal (Default Hari ini) */}
          <div>
            <label htmlFor="tx-date-input" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Tanggal
            </label>
            <input
              id="tx-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border border-slate-700 bg-[#1C1F26] text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Kategori Dropdown */}
          <div>
            <label htmlFor="tx-category-select" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Kategori
            </label>
            <select
              id="tx-category-select"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border border-slate-700 bg-[#1C1F26] text-white focus:outline-none focus:border-emerald-500"
            >
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#161920] text-slate-200">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Deskripsi */}
          <div>
            <label htmlFor="tx-desc-input" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Deskripsi
            </label>
            <input
              id="tx-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan / keterangan..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-700 bg-[#1C1F26] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Metode Pembayaran: Pengeluaran (QRIS, CASH) / Pemasukan (MANDIRI) */}
          <div>
            <label htmlFor="tx-payment-select" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Metode Pembayaran
            </label>
            {type === 'expense' ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'bg-rose-600/20 text-rose-300 border-rose-500 shadow-xs'
                      : 'bg-[#1C1F26] hover:bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  📱 QRIS
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-rose-600/20 text-rose-300 border-rose-500 shadow-xs'
                      : 'bg-[#1C1F26] hover:bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  💵 CASH
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MANDIRI')}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold border bg-emerald-600/20 text-emerald-300 border-emerald-500 text-center"
                >
                  🏦 MANDIRI
                </button>
              </div>
            )}
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2">
            <button
              id="btn-submit-transaction"
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-5 rounded-xl font-bold text-base text-white shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${
                type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
              } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
