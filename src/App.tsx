import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, AppSettings, Category } from './types';
import { DEFAULT_SETTINGS, ALL_DEFAULT_CATEGORIES } from './data/defaultCategories';
import { getBudgetCycle } from './utils/dateCycle';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { TransactionForm } from './components/TransactionForm';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { EditTransactionModal } from './components/EditTransactionModal';
import { WhatsAppSummaryModal } from './components/WhatsAppSummaryModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'input' | 'dashboard' | 'settings'>('input');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(ALL_DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);

  // Load initial data from database
  const loadData = useCallback(async () => {
    try {
      const [txs, cats, setts] = await Promise.all([
        api.getTransactions(),
        api.getCategories(),
        api.getSettings(),
      ]);
      setTransactions(txs);
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
      }
      setSettings(setts);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  // Add new transaction
  const handleSaveTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const created = await api.addTransaction(txData);
    setTransactions((prev) => [created, ...prev]);
  };

  // Update existing transaction
  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const updated = await api.updateTransaction(id, updates);
    if (updated) {
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Update settings
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    const saved = await api.saveSettings(newSettings);
    setSettings(saved);
  };

  // Category CRUD Handlers
  const handleAddCategory = async (catData: Omit<Category, 'id'>) => {
    const created = await api.addCategory(catData);
    setCategories((prev) => [...prev, created]);
  };

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    const updated = await api.updateCategory(id, updates);
    if (updated) {
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const currentCycle = getBudgetCycle(settings.budgetCycleStartDay || 25, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 animate-pulse flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/30">
          Rp
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-400">
          Memuat Catatan Keuangan...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-200 flex flex-col selection:bg-emerald-500 selection:text-white font-sans">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentCycle={currentCycle}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {activeTab === 'input' && (
          <TransactionForm
            onSave={handleSaveTransaction}
            categories={categories}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            settings={settings}
            categories={categories}
            onUpdateSettings={handleUpdateSettings}
            onEditTransaction={(tx) => setEditingTransaction(tx)}
            onDeleteTransaction={handleDeleteTransaction}
            onNavigateToInput={() => setActiveTab('input')}
            onOpenWhatsAppSummary={() => setIsWhatsAppModalOpen(true)}
            onRefreshData={handleRefresh}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            categories={categories}
            onSaveSettings={handleUpdateSettings}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}
      </main>

      {/* Edit Modal */}
      <EditTransactionModal
        isOpen={Boolean(editingTransaction)}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleUpdateTransaction}
        categories={categories}
      />

      {/* WhatsApp Summary Modal */}
      <WhatsAppSummaryModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        transactions={transactions}
        cycle={currentCycle}
        settings={settings}
      />
    </div>
  );
}
