import React, { useState } from "react";
import { useGroup } from "../context/GroupContext";
import { Check, AlertCircle, Phone, CreditCard, Loader2 } from "lucide-react";

export default function MemberChecklist() {
  const { members, transactions, settings, executeTransaction } = useGroup();
  const [processingId, setProcessingId] = useState(null);

  const getCurrentMonthStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const currentMonthStr = getCurrentMonthStr();
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  const handleMarkPaid = async (member) => {
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
  };

  const handleMarkLate = async (member) => {
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
  };

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
            Paid: {members.filter(m => transactions.some(t => t.member_id === m.id && t.type === "deposit" && t.date.startsWith(currentMonthStr))).length}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Late Penalities: {members.filter(m => transactions.some(t => t.member_id === m.id && t.type === "penalty" && t.date.startsWith(currentMonthStr))).length}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              <th className="py-3 px-4">Member</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4 text-right">Commitment</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50 text-sm">
            {members.map((member) => {
              const hasPaid = transactions.some(
                (t) => t.member_id === member.id && t.type === "deposit" && t.date.startsWith(currentMonthStr)
              );
              const hasPenalty = transactions.some(
                (t) => t.member_id === member.id && t.type === "penalty" && t.date.startsWith(currentMonthStr)
              );
              const isProcessing = processingId?.id === member.id;

              return (
                <tr
                  key={member.id}
                  className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors"
                >
                  <td className="py-4 px-4 font-semibold text-neutral-800 dark:text-neutral-200">
                    {member.name}
                  </td>
                  <td className="py-4 px-4 text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      {member.phone}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
                    ₹{member.monthly_commitment.toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col items-center gap-1 justify-center">
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
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!hasPaid && (
                        <button
                          onClick={() => handleMarkPaid(member)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition"
                        >
                          {isProcessing && processingId?.type === "paid" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Mark Paid
                        </button>
                      )}
                      {!hasPaid && !hasPenalty && (
                        <button
                          onClick={() => handleMarkLate(member)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 rounded-lg transition"
                        >
                          {isProcessing && processingId?.type === "late" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          Mark Late
                        </button>
                      )}
                      {(hasPaid || hasPenalty) && (
                        <span className="text-xs text-neutral-400 font-medium italic">
                          Actions Locked
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
