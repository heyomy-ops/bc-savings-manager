import React, { useState, useMemo, useCallback } from "react";
import { useGroup } from "../context/GroupContext";
import { Check, AlertCircle, Phone, CreditCard, Loader2 } from "lucide-react";
import { getCurrentMonthStr } from "../utils/helpers";

const MemberRow = React.memo(({ 
  member, 
  transactions, 
  settings, 
  currentMonthStr, 
  globalIsProcessing,
  isProcessing, 
  processingType,
  onMarkPaid, 
  onMarkLate, 
  onCollectInterest, 
  onRepayPrincipal 
}) => {
  const [emiFormOpen, setEmiFormOpen] = useState(false);
  const [principalAmt, setPrincipalAmt] = useState("");

  const hasPaid = transactions.some(
    (t) => t.member_id === member.id && t.type === "deposit" && t.date.startsWith(currentMonthStr)
  );
  const hasPenalty = transactions.some(
    (t) => t.member_id === member.id && t.type === "penalty" && t.date.startsWith(currentMonthStr)
  );
  
  // Loan Calculations
  const memberDisbursements = transactions
    .filter(t => t.member_id === member.id && t.type === "loan_disbursement")
    .reduce((sum, t) => sum + t.amount, 0);
  const memberRepayments = transactions
    .filter(t => t.member_id === member.id && t.type === "principal_repayment")
    .reduce((sum, t) => sum + t.amount, 0);
  const outstandingLoan = Math.max(0, memberDisbursements - memberRepayments);
  const hasActiveLoan = outstandingLoan > 0;
  const monthlyInterestDue = outstandingLoan * (settings.interest_rate_percent / 100);
  
  const hasPaidInterest = transactions.some(
    (t) => t.member_id === member.id && t.type === "interest_payment" && t.date.startsWith(currentMonthStr)
  );

  const handleRepay = (e) => {
    e.preventDefault();
    if (onRepayPrincipal) {
      onRepayPrincipal(member, Number(principalAmt));
      setPrincipalAmt("");
      setEmiFormOpen(false);
    }
  };

  return (
    <div className="bg-white dark:bg-transparent border md:border-0 border-neutral-200 dark:border-neutral-800 rounded-xl md:rounded-none overflow-hidden shadow-sm md:shadow-none hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors">
      
      {/* Main Row / Card Content */}
      <div className="p-4 md:p-0 md:px-4 md:py-4 flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center">
        
        {/* Mobile Header: Member + Status */}
        <div className="flex justify-between items-start md:contents">
          <div className="md:col-span-3 font-semibold text-neutral-800 dark:text-neutral-200 text-lg md:text-sm">
            {member.name}
          </div>
          <div className="md:col-span-2 md:order-4 flex flex-col items-end md:items-center gap-1 md:justify-center">
            {hasPaid ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full">
                <Check className="w-3 h-3" /> Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 rounded-full">
                Pending
              </span>
            )}
            {hasPenalty && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-full mt-1">
                <AlertCircle className="w-2.5 h-2.5" /> Late Fee Charged
              </span>
            )}
            {hasActiveLoan && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-full mt-1">
                Loan: ₹{outstandingLoan.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>

        {/* Mobile Details: Phone & Commitment */}
        <div className="flex justify-between items-center mt-2 md:mt-0 md:contents">
          <div className="md:col-span-3 md:order-2 text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-neutral-400" />
              {member.phone}
            </span>
          </div>
          <div className="md:col-span-2 md:order-3 text-right font-medium text-neutral-800 dark:text-neutral-200 mt-1 md:mt-0">
            <span className="md:hidden text-xs text-neutral-400 font-normal mr-2">Commitment:</span>
            ₹{member.monthly_commitment.toLocaleString("en-IN")}
          </div>
        </div>

        {/* Actions */}
        <div className="md:col-span-2 md:order-5 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
          <div className="flex md:justify-end gap-2 w-full">
            {!hasPaid && (
              <button
                onClick={() => onMarkPaid(member)}
                disabled={globalIsProcessing}
                className="flex-1 md:flex-none justify-center inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition"
              >
                {isProcessing && processingType === "paid" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Mark Paid
              </button>
            )}
            {!hasPaid && !hasPenalty && (
              <button
                onClick={() => onMarkLate(member)}
                disabled={globalIsProcessing}
                className="flex-1 md:flex-none justify-center inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 rounded-lg transition"
              >
                {isProcessing && processingType === "late" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                Mark Late
              </button>
            )}
            {hasPaid && (
              <div className="flex-1 md:flex-none flex justify-center md:justify-end w-full">
                <span className="text-xs text-neutral-400 font-medium italic">
                  Actions Locked
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loan Dues Form Row */}
      {hasActiveLoan && (
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-900/30 md:border-0 p-4 md:px-4 md:py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-3 border-l-2 border-indigo-400 dark:border-indigo-600">
            <div className="text-sm">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">Active Loan Dues</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Monthly Interest ({settings.interest_rate_percent}%): <strong className="text-indigo-600 dark:text-indigo-400">₹{monthlyInterestDue.toLocaleString("en-IN")}</strong>
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              {/* Interest Collection */}
              {!hasPaidInterest ? (
                <button
                  onClick={() => onCollectInterest(member, monthlyInterestDue)}
                  disabled={globalIsProcessing}
                  className="w-full md:w-auto justify-center inline-flex items-center px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-800/60 rounded-lg transition"
                >
                  {isProcessing && processingType === "interest" ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  Collect Interest
                </button>
              ) : (
                <span className="w-full md:w-auto justify-center inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg">
                  <Check className="w-3 h-3" /> Interest Collected
                </span>
              )}

              {/* Principal Repayment Toggle */}
              {!emiFormOpen ? (
                <button
                  onClick={() => setEmiFormOpen(true)}
                  className="w-full md:w-auto justify-center inline-flex items-center px-3 py-1.5 text-xs font-bold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 dark:text-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700 rounded-lg transition"
                >
                  Repay Principal...
                </button>
              ) : (
                <form onSubmit={handleRepay} className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <span className="absolute left-2 top-1.5 text-neutral-500 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={outstandingLoan}
                      placeholder="Amount"
                      value={principalAmt}
                      onChange={(e) => setPrincipalAmt(e.target.value)}
                      className="w-full md:w-24 pl-5 pr-2 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={globalIsProcessing}
                    className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
                  >
                    {isProcessing && processingType === "principal" ? "..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmiFormOpen(false);
                      setPrincipalAmt("");
                    }}
                    className="px-3 py-1 text-xs font-bold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default function MemberChecklist() {
  const { members, transactions, settings, executeTransaction } = useGroup();
  const [processingId, setProcessingId] = useState(null);

  const currentMonthStr = useMemo(() => getCurrentMonthStr(), []);
  const currentMonthName = useMemo(() => new Date().toLocaleString('default', { month: 'long' }), []);

  const handleMarkPaid = useCallback(async (member) => {
    setProcessingId({ id: member.id, type: "paid" });
    try {
      await executeTransaction({
        member_id: member.id,
        type: "deposit",
        amount: member.monthly_commitment
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }, [executeTransaction]);

  const handleMarkLate = useCallback(async (member) => {
    setProcessingId({ id: member.id, type: "late" });
    try {
      await executeTransaction({
        member_id: member.id,
        type: "penalty",
        amount: settings.default_late_fee
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }, [executeTransaction, settings.default_late_fee]);

  const handleCollectInterest = useCallback(async (member, amount) => {
    setProcessingId({ id: member.id, type: "interest" });
    try {
      await executeTransaction({
        member_id: member.id,
        type: "interest_payment",
        amount: amount
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }, [executeTransaction]);

  const handleRepayPrincipal = useCallback(async (member, amount) => {
    if (!amount || amount <= 0) return;
    
    setProcessingId({ id: member.id, type: "principal" });
    try {
      await executeTransaction({
        member_id: member.id,
        type: "principal_repayment",
        amount: amount
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  }, [executeTransaction]);

  // Compute stats for header
  const totalPaid = useMemo(() => 
    members.filter(m => transactions.some(t => t.member_id === m.id && t.type === "deposit" && t.date.startsWith(currentMonthStr))).length,
    [members, transactions, currentMonthStr]
  );
  
  const totalLate = useMemo(() => 
    members.filter(m => transactions.some(t => t.member_id === m.id && t.type === "penalty" && t.date.startsWith(currentMonthStr))).length,
    [members, transactions, currentMonthStr]
  );

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Manager Checklist — {currentMonthName}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Collect commitments and manage late penalties for the active cycle.
          </p>
        </div>
        <div className="flex gap-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Paid: {totalPaid}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Late Penalities: {totalLate}
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Desktop Header */}
        <div className="hidden md:grid md:grid-cols-12 md:gap-4 mb-2 pb-2 border-b border-neutral-100 dark:border-neutral-800 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-4">
          <div className="md:col-span-3">Member</div>
          <div className="md:col-span-3">Phone</div>
          <div className="md:col-span-2 text-right">Commitment</div>
          <div className="md:col-span-2 text-center">Status</div>
          <div className="md:col-span-2 text-right">Actions</div>
        </div>

        <div className="flex flex-col gap-4 md:gap-0 md:divide-y md:divide-neutral-100 dark:md:divide-neutral-800/50 text-sm">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              transactions={transactions}
              settings={settings}
              currentMonthStr={currentMonthStr}
              globalIsProcessing={!!processingId}
              isProcessing={processingId?.id === member.id}
              processingType={processingId?.type}
              onMarkPaid={handleMarkPaid}
              onMarkLate={handleMarkLate}
              onCollectInterest={handleCollectInterest}
              onRepayPrincipal={handleRepayPrincipal}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
