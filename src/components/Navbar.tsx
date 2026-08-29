import React from 'react';
import { PlusCircle, LayoutDashboard, Settings, Wallet, Sparkles, RefreshCw } from 'lucide-react';
import { BudgetCycle } from '../types';

interface NavbarProps {
  activeTab: 'input' | 'dashboard' | 'settings';
  setActiveTab: (tab: 'input' | 'dashboard' | 'settings') => void;
  currentCycle: BudgetCycle;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentCycle,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <>
      {/* Top Header */}
      <header id="app-header" className="sticky top-0 z-40 bg-[#161920]/95 backdrop-blur-md border-b border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            id="brand-logo-button"
            onClick={() => setActiveTab('input')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-emerald-500 tracking-tight">
                  FAMILIA<span className="text-slate-200">FINANCE</span>
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#0F1115] p-1 rounded-xl border border-slate-800">
            <button
              id="nav-tab-input-desktop"
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'input'
                  ? 'bg-[#1C1F26] text-emerald-400 border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1F26]/50'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Input</span>
            </button>

            <button
              id="nav-tab-dashboard-desktop"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#1C1F26] text-emerald-400 border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1F26]/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-tab-settings-desktop"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#1C1F26] text-emerald-400 border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1F26]/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Setting</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              id="header-refresh-btn"
              onClick={onRefresh}
              title="Refresh Data"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1C1F26] border border-transparent hover:border-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Quick Cycle Badge */}
            <div
              id="header-cycle-indicator"
              onClick={() => setActiveTab('settings')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1C1F26] border border-slate-800 text-xs text-slate-300 font-medium cursor-pointer hover:border-slate-700 transition-colors"
              title="Klik untuk ubah setting siklus"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Siklus: <strong className="text-emerald-400">Tgl {currentCycle.startDate.split('-')[2]}</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div id="mobile-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#161920]/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 shadow-xl">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          <button
            id="mobile-nav-input"
            onClick={() => setActiveTab('input')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'input'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'input' ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Input</span>
          </button>

          <button
            id="mobile-nav-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Dashboard</span>
          </button>

          <button
            id="mobile-nav-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'settings' ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Setting</span>
          </button>
        </div>
      </div>
    </>
  );
};
