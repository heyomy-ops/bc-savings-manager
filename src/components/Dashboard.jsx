import React from "react";
import { useGroup } from "../context/GroupContext";
import { DollarSign, Percent, TrendingUp, ShieldAlert } from "lucide-react";

export default function Dashboard() {
  const { transactions } = useGroup();

  // Get current month format (YYYY-MM)
  const getCurrentMonthStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const currentMonthStr = getCurrentMonthStr();

  // Metric 1: Total Pool This Month (Sum of deposits in current month)
  const totalPoolThisMonth = transactions
    .filter(t => t.type === "deposit" && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  // Metric 2: Total Active Loans (Sum of disbursements minus principal repayments)
  const totalDisbursements = transactions
    .filter(t => t.type === "loan_disbursement")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalRepayments = transactions
    .filter(t => t.type === "principal_repayment")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalActiveLoans = Math.max(0, totalDisbursements - totalRepayments);

  // Metric 3: Interest & Penalty Fund (Sum of interest + penalty transactions)
  const totalProfitPool = transactions
    .filter(t => t.type === "interest_payment" || t.type === "penalty")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Metric Card 1: Monthly Pool */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl backdrop-blur-md hover:scale-[1.02] transition-transform duration-300">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Pool This Month ({new Date().toLocaleString('default', { month: 'long' })})
          </span>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            ₹{totalPoolThisMonth.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="text-xs text-neutral-400 mt-2">Sum of collected commitments</p>
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
