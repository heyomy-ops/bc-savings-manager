import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import { googleSheetsService } from "../services/googleSheets";

const GroupContext = createContext();

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  return context;
};

export const GroupProvider = ({ children }) => {
  const [scriptUrl, setScriptUrl] = useState(() => localStorage.getItem("bc_google_script_url") || "");
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({
    interest_rate_percent: 2,
    default_late_fee: 500
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    const currentUrl = localStorage.getItem("bc_google_script_url");
    if (!currentUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await googleSheetsService.getAllData();
      setMembers(data.members);
      setTransactions(data.transactions);
      setSettings(data.settings);
    } catch (err) {
      console.error("Failed to load group data", err);
      setError(err.message || "Failed to sync with database. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [scriptUrl, fetchData]);

  // Post transaction
  const executeTransaction = useCallback(async (txData) => {
    try {
      const newTx = await googleSheetsService.addTransaction(txData);
      
      // Update local state:
      // 1. Transactions state
      setTransactions(prev => [...prev, newTx]);
      
      // 2. Members state (total_paid_to_date side-effect)
      if (txData.type === "deposit" || txData.type === "principal_repayment") {
        setMembers(prev =>
          prev.map(m =>
            m.id === txData.member_id
              ? { ...m, total_paid_to_date: m.total_paid_to_date + txData.amount }
              : m
          )
        );
      }
      return newTx;
    } catch (err) {
      console.error("Transaction failed", err);
      throw new Error(err.message || "Failed to record transaction. Please try again.");
    }
  }, []);

  // Update Settings
  const saveSettings = useCallback(async (newSettings) => {
    try {
      const saved = await googleSheetsService.updateSettings(newSettings);
      setSettings(saved);
      return saved;
    } catch (err) {
      console.error("Saving settings failed", err);
      throw new Error(err.message || "Failed to save settings. Please try again.");
    }
  }, []);

  // Save / Update Google Apps Script URL
  const saveScriptUrl = useCallback((url) => {
    if (url) {
      localStorage.setItem("bc_google_script_url", url);
    } else {
      localStorage.removeItem("bc_google_script_url");
      // Clear data when disconnected
      setMembers([]);
      setTransactions([]);
    }
    setScriptUrl(url || "");
  }, []);

  // Calculate Derived Metrics Memoized
  const derivedMetrics = useMemo(() => {
    const inflows = transactions
      .filter(t => ["deposit", "principal_repayment", "interest_payment", "penalty"].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const outflows = transactions
      .filter(t => t.type === "loan_disbursement")
      .reduce((sum, t) => sum + t.amount, 0);

    const availableVaultBalance = Math.max(0, inflows - outflows);

    const totalDisbursements = transactions
      .filter(t => t.type === "loan_disbursement")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalRepayments = transactions
      .filter(t => t.type === "principal_repayment")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalActiveLoans = Math.max(0, totalDisbursements - totalRepayments);

    const totalProfitPool = transactions
      .filter(t => t.type === "interest_payment" || t.type === "penalty")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      availableVaultBalance,
      totalActiveLoans,
      totalProfitPool
    };
  }, [transactions]);

  const value = useMemo(() => ({
    scriptUrl,
    saveScriptUrl,
    members,
    transactions,
    settings,
    loading,
    error,
    refreshData: fetchData,
    executeTransaction,
    saveSettings,
    derivedMetrics
  }), [
    scriptUrl,
    saveScriptUrl,
    members,
    transactions,
    settings,
    loading,
    error,
    fetchData,
    executeTransaction,
    saveSettings,
    derivedMetrics
  ]);

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
};
