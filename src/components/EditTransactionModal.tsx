import React, { useState, useEffect } from 'react';
import { X, Save, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';
import { formatIDR } from '../utils/formatters';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Transaction>) => Promise<void>;
  categories?: Category[];
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onSave,
  categories = [],
}) => {
  if (!isOpen || !transaction) return null;

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amountStr, setAmountStr] = useState<string>(transaction.amount.toString());
  const [date, setDate] = useState<string>(transaction.date);
  const [categoryId, setCategoryId] = useState<string>(transaction.categoryId);
  const [description, setDescription] = useState<string>(transaction.description);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    transaction.paymentMethod || (transaction.type === 'expense' ? 'QRIS' : 'MANDIRI')
  );
  const [isSaving, setIsSaving] = useState(false);

  const availableCategories = categories.filter((c) => c.type === type);
  const currentCategory = availableCategories.find((c) => c.id === categoryId) || availableCategories[0];
  const rawAmountNumber = parseInt(amountStr.replace(/\D/g, '') || '0', 10);

  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.some((c) => c.id === categoryId)) {
      setCategoryId(availableCategories[0].id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawAmountNumber <= 0) {
      alert('Nominal harus lebih dari 0.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(transaction.id, {
        type,
        amount: rawAmountNumber,
        date,
        categoryId: currentCategory?.id || transaction.categoryId,
        categoryName: currentCategory?.name || transaction.categoryName,
        categoryIcon: currentCategory?.icon || transaction.categoryIcon,
        categoryColor: currentCategory?.color || transaction.categoryColor,
        description: description.trim(),
        paymentMethod,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal mengupdate transaksi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#161920] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-800 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm sm:text-base font-bold text-white">
            Edit Catatan Transaksi
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                  : 'bg-[#1C1F26] text-slate-300 border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                  : 'bg-[#1C1F26] text-slate-300 border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Pemasukan</span>
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Nominal (Rp)</label>
            <input
              type="text"
              inputMode="numeric"
              value={rawAmountNumber > 0 ? formatIDR(rawAmountNumber, false) : ''}
              onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ''))}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-700 bg-[#1C1F26] font-bold font-mono text-white text-base focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-700 bg-[#1C1F26] text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-700 bg-[#1C1F26] text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#161920] text-slate-200">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Deskripsi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan transaksi..."
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-700 bg-[#1C1F26] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Metode Pembayaran</label>
            {type === 'expense' ? (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'bg-rose-600/20 text-rose-300 border-rose-500'
                      : 'bg-[#1C1F26] text-slate-400 border-slate-700'
                  }`}
                >
                  📱 QRIS
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-rose-600/20 text-rose-300 border-rose-500'
                      : 'bg-[#1C1F26] text-slate-400 border-slate-700'
                  }`}
                >
                  💵 CASH
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 mt-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MANDIRI')}
                  className="py-2 px-3 rounded-xl text-xs font-bold border bg-emerald-600/20 text-emerald-300 border-emerald-500 text-center"
                >
                  🏦 MANDIRI
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
