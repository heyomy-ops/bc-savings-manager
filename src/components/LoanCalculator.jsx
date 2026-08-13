import React, { useState } from "react";
import { useGroup } from "../context/GroupContext";
import { Calculator, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export default function LoanCalculator() {
  const { members, settings, executeTransaction } = useGroup();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [disbursing, setDisbursing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const amount = Number(loanAmount) || 0;
  const interestRate = settings?.interest_rate_percent || 2;
  const monthlyInterest = amount * (interestRate / 100);

  // Generate a standard 10-month repayment schedule
  const generateSchedule = () => {
    if (amount <= 0) return [];
    const schedule = [];
    const months = 10;
    const monthlyPrincipal = amount / months;

    for (let i = 1; i <= months; i++) {
      schedule.push({
        month: i,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        total: monthlyPrincipal + monthlyInterest
      });
    }
    return schedule;
  };

  const schedule = generateSchedule();

  const handleDisburseLoan = async (e) => {
    e.preventDefault();
    if (!selectedMemberId || amount <= 0) return;

    setDisbursing(true);
    setSuccessMsg("");
    try {
      // 1. Post the loan disbursement transaction
      await executeTransaction({
        member_id: selectedMemberId,
        type: "loan_disbursement",
        amount: amount
      });

      // 2. Also record the interest payment immediately as part of the bidding process (if flat interest is pre-deducted or committed)
      // Note: According to the PRD, we just push the loan_disbursement transaction. Let's log it.
      console.log(`Disbursed loan of ₹${amount} to ${selectedMember.name} at ${interestRate}% interest. Monthly interest is ₹${monthlyInterest}`);

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
                <span>Monthly Interest ({interestRate}%):</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{monthlyInterest.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Total Interest (10 months):</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{(monthlyInterest * 10).toLocaleString()}</span>
              </div>
              <div className="border-t border-emerald-100 dark:border-emerald-900/30 pt-2 flex justify-between text-sm font-bold text-emerald-800 dark:text-emerald-400">
                <span>Total Repayable:</span>
                <span>₹{(amount + (monthlyInterest * 10)).toLocaleString()}</span>
              </div>
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
            disabled={disbursing || !selectedMemberId || amount <= 0}
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

        {/* Repayment Schedule Column */}
        <div className="lg:col-span-3 border-l border-neutral-100 dark:border-neutral-800 lg:pl-8 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Repayment Schedule (10 Months)
            </h3>
            {amount > 0 ? (
              <div className="max-h-72 overflow-y-auto border border-neutral-100 dark:border-neutral-800/80 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800 text-neutral-500 font-bold">
                      <th className="py-2 px-3">Month</th>
                      <th className="py-2 px-3 text-right">Principal</th>
                      <th className="py-2 px-3 text-right">Interest (Flat)</th>
                      <th className="py-2 px-3 text-right">Total Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40 font-medium">
                    {schedule.map((row) => (
                      <tr key={row.month} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                        <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400">Month {row.month}</td>
                        <td className="py-2.5 px-3 text-right text-neutral-800 dark:text-neutral-200">₹{row.principal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">₹{row.interest.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-neutral-900 dark:text-white">₹{row.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/30 dark:bg-neutral-900/10">
                <Calculator className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-[200px]">
                  Enter a loan amount to generate the repayment schedule.
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
