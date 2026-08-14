import React, { useState } from "react";
import { useGroup } from "../context/GroupContext";
import { Calculator, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export default function LoanCalculator() {
  const { members, settings, executeTransaction, transactions } = useGroup();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [disbursing, setDisbursing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const amount = Number(loanAmount) || 0;
  const interestRate = settings?.interest_rate_percent || 2;
  const monthlyInterest = amount * (interestRate / 100);

  // Calculate available vault balance
  const totalInflows = transactions
    .filter(t => ["deposit", "principal_repayment", "interest_payment", "penalty"].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOutflows = transactions
    .filter(t => t.type === "loan_disbursement")
    .reduce((sum, t) => sum + t.amount, 0);
  const availableVaultBalance = Math.max(0, totalInflows - totalOutflows);

  // No fixed schedule needed for indefinite loans

  const handleDisburseLoan = async (e) => {
    e.preventDefault();
    if (!selectedMemberId || amount <= 0) return;
    if (amount > availableVaultBalance) {
      setErrorMsg("Insufficient vault balance to disburse this loan.");
      return;
    }

    setDisbursing(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      // 1. Post the loan disbursement transaction
      await executeTransaction({
        member_id: selectedMemberId,
        type: "loan_disbursement",
        amount: amount
      });

      // Note: Interest is now collected monthly on a cash-basis via the Checklist.

      setSuccessMsg(`Success! Disbursed ₹${amount.toLocaleString()} to ${selectedMember.name}.`);
      setLoanAmount("");
      setSelectedMemberId("");
      
      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setDisbursing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Loan & Bidding Calculator
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Calculate interest and automatically generate repayment schedules for borrowers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form Column */}
        <form onSubmit={handleDisburseLoan} className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Select Borrower
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose Member --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} (Commitment: ₹{m.monthly_commitment})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Loan Amount (Principal)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-neutral-500 dark:text-neutral-400 font-medium text-sm">₹</span>
              <input
                type="number"
                min="1"
                placeholder="Enter amount"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Metrics */}
          {amount > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-2">
              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Available Vault Balance:</span>
                <span className={`font-semibold ${amount > availableVaultBalance ? 'text-red-600 dark:text-red-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                  ₹{availableVaultBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Monthly Interest ({interestRate}%):</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{monthlyInterest.toLocaleString()}</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 hidden" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={disbursing || !selectedMemberId || amount <= 0 || amount > availableVaultBalance}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-600 text-white font-bold rounded-lg shadow-md transition flex items-center justify-center gap-2"
          >
            {disbursing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Disbursing...
              </>
            ) : (
              <>
                Disburse Loan <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Loan Terms Column */}
        <div className="lg:col-span-3 border-l border-neutral-100 dark:border-neutral-800 lg:pl-8 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Loan Terms & Details
            </h3>
            {amount > 0 ? (
              <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl space-y-4">
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  This loan has an <span className="font-bold text-emerald-600 dark:text-emerald-400">indefinite duration</span>. 
                  The member can hold the principal amount as long as they need.
                </p>
                <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-800">
                  <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">Required Monthly Payment (Interest)</h4>
                  <div className="text-2xl font-black text-neutral-900 dark:text-white">
                    ₹{monthlyInterest.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Due every month until the principal is repaid.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/30 dark:bg-neutral-900/10">
                <Calculator className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-[200px]">
                  Enter a loan amount to generate loan terms.
                </p>
              </div>
            )}
          </div>
          {amount > 0 && (
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-4 italic">
              * Note: The repayment interest rate of {interestRate}% is fixed as per settings. All interest and late penalty collections are funneled into the group's mutual Profit Pool.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
