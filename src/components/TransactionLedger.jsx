import React, { useState } from "react";
import { useGroup } from "../context/GroupContext";
import { Search, Filter, History, Calendar } from "lucide-react";

export default function TransactionLedger() {
  const { transactions, members } = useGroup();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("3_months"); // default to last 3 months as per PRD

  // Map member IDs to names for easy lookup
  const memberMap = React.useMemo(() => {
    const map = {};
    members.forEach(m => {
      map[m.id] = m.name;
    });
    return map;
  }, [members]);

  const getFilteredTransactions = () => {
    let list = [...transactions];

    // Filter by type
    if (typeFilter !== "all") {
      list = list.filter(t => t.type === typeFilter);
    }

    // Filter by search term (member name)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(t => {
        const memberName = memberMap[t.member_id]?.toLowerCase() || "";
        return memberName.includes(term);
      });
    }

    // Filter by date range
    const now = new Date();
    if (dateFilter === "30_days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      list = list.filter(t => new Date(t.date) >= thirtyDaysAgo);
    } else if (dateFilter === "3_months") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      list = list.filter(t => new Date(t.date) >= threeMonthsAgo);
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const filteredTransactions = getFilteredTransactions();

  const getTypeBadgeStyles = (type) => {
    switch (type) {
      case "deposit":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
      case "loan_disbursement":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400";
      case "interest_payment":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400";
      case "penalty":
        return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400";
      case "principal_repayment":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300";
    }
  };

  const formatTypeLabel = (type) => {
    return type
      .split("_")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Transaction Ledger
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Complete transaction records for auditing. Filterable and searchable.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search member..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-3" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="loan_disbursement">Disbursements</option>
            <option value="interest_payment">Interest Payments</option>
            <option value="penalty">Penalties</option>
            <option value="principal_repayment">Principal Repayments</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="relative">
          <Calendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-3" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            <option value="all">All Time</option>
            <option value="30_days">Last 30 Days</option>
            <option value="3_months">Last 3 Months</option>
          </select>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-end text-xs text-neutral-400 dark:text-neutral-500 font-semibold px-2">
          Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Member</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50 text-sm">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => {
                const isOutflow = tx.type === "loan_disbursement";

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                      {new Date(tx.date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-800 dark:text-neutral-200">
                      {memberMap[tx.member_id] || "Unknown Member"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getTypeBadgeStyles(tx.type)}`}>
                        {formatTypeLabel(tx.type)}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold text-base ${isOutflow ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {isOutflow ? "-" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="py-12 text-center text-neutral-400 dark:text-neutral-600 font-semibold">
                  No transactions match the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
