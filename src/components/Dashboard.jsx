import React from "react";
import { useGroup } from "../context/GroupContext";
import { DollarSign, Percent, TrendingUp, ShieldAlert } from "lucide-react";

export default function Dashboard() {
  const { derivedMetrics } = useGroup();
  const { availableVaultBalance = 0, totalActiveLoans = 0, totalProfitPool = 0 } = derivedMetrics || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Metric Card 1: Available Vault Balance */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl backdrop-blur-md hover:scale-[1.02] transition-transform duration-300">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Available Vault Balance
          </span>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            ₹{availableVaultBalance.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="text-xs text-neutral-400 mt-2">Total liquid cash ready to lend</p>
      </div>

      {/* Metric Card 2: Active Loans */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl backdrop-blur-md hover:scale-[1.02] transition-transform duration-300">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl" />
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Total Active Loans
          </span>
          <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            ₹{totalActiveLoans.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="text-xs text-neutral-400 mt-2">Disbursed minus principal repaid</p>
      </div>

      {/* Metric Card 3: Interest & Penalty Fund */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl backdrop-blur-md hover:scale-[1.02] transition-transform duration-300">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl" />
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Profit Pool (Interest + Penalty)
          </span>
          <div className="p-3 bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
            <Percent className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ₹{totalProfitPool.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="text-xs text-neutral-400 mt-2">Shared back to members at cycle end</p>
      </div>
    </div>
  );
}
