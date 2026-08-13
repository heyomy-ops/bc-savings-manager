import React, { useState } from 'react';
import { GroupProvider, useGroup } from './context/GroupContext';
import Dashboard from './components/Dashboard';
import MemberChecklist from './components/MemberChecklist';
import LoanCalculator from './components/LoanCalculator';
import TransactionLedger from './components/TransactionLedger';
import SettingsModal from './components/SettingsModal';
import SetupScreen from './components/SetupScreen';
import OnboardingScreen from './components/OnboardingScreen';
import { Settings as SettingsIcon, LayoutDashboard, Calculator, History, AlertCircle } from 'lucide-react';

function DashboardContent() {
  const { scriptUrl, loading, error, settings, members } = useGroup();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, calculator, ledger

  if (!scriptUrl) {
    return <SetupScreen />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="mt-4 font-semibold text-sm">Syncing group records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-lg font-bold text-neutral-800 dark:text-neutral-200 text-center">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition cursor-pointer"
          >
            Retry Connection
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("bc_google_script_url");
              window.location.reload();
            }}
            className="px-6 py-2.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl font-bold transition cursor-pointer"
          >
            Disconnect & Setup Again
          </button>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return <OnboardingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-600 rounded-xl text-white font-extrabold text-sm tracking-wider">BC</span>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-neutral-900 dark:text-white leading-none">
                BC Manager Dashboard
              </h1>
              <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                Chit Fund Digital Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick settings status info */}
            <div className="hidden md:flex gap-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-800 pr-4">
              <span>Interest: {settings?.interest_rate_percent}%</span>
              <span>Late Fee: ₹{settings?.default_late_fee}</span>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs (Mobile-Friendly View Switcher) */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-8 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "calculator"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            <Calculator className="w-4 h-4" />
            Bidding & Loan Calculator
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "ledger"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            <History className="w-4 h-4" />
            Transaction Ledger
          </button>
        </div>

        {/* View render block */}
        <div className="space-y-6">
          {activeTab === "dashboard" && (
            <>
              {/* Metric widgets */}
              <Dashboard />
              {/* Member checklist */}
              <MemberChecklist />
            </>
          )}

          {activeTab === "calculator" && (
            <>
              {/* Loan interest and bidding schedule calculator */}
              <LoanCalculator />
            </>
          )}

          {activeTab === "ledger" && (
            <>
              {/* Transaction audit log */}
              <TransactionLedger />
            </>
          )}
        </div>
      </main>

      {/* Settings Dialog Overlay */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <GroupProvider>
      <DashboardContent />
    </GroupProvider>
  );
}

export default App;
