import React, { createContext, useState, useEffect, useContext } from "react";
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
  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, [scriptUrl]);

  // Post transaction
  const executeTransaction = async (txData) => {
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
  };

  // Update Settings
  const saveSettings = async (newSettings) => {
    try {
      const saved = await googleSheetsService.updateSettings(newSettings);
      setSettings(saved);
      return saved;
    } catch (err) {
      console.error("Saving settings failed", err);
      throw new Error(err.message || "Failed to save settings. Please try again.");
    }
  };

  // Save / Update Google Apps Script URL
  const saveScriptUrl = (url) => {
    if (url) {
      localStorage.setItem("bc_google_script_url", url);
    } else {
      localStorage.removeItem("bc_google_script_url");
      // Clear data when disconnected
      setMembers([]);
      setTransactions([]);
    }
    setScriptUrl(url || "");
  };

  const value = {
    scriptUrl,
    saveScriptUrl,
    members,
    transactions,
    settings,
    loading,
    error,
    refreshData: fetchData,
    executeTransaction,
    saveSettings
  };

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
};
