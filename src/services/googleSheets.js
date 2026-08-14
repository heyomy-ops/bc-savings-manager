// API service layer for BC Savings Group Manager
// Stores data in Google Sheets via Apps Script Web App when configured,
// or falls back to localStorage mock DB for Demo Mode.

const DELAY = 300; // ms mock latency

const INITIAL_MEMBERS = [
  { id: "m1", name: "Aarav Sharma", phone: "+91 98765 43210", monthly_commitment: 2000, total_paid_to_date: 4000 },
  { id: "m2", name: "Priya Patel", phone: "+91 87654 32109", monthly_commitment: 4000, total_paid_to_date: 8000 },
  { id: "m3", name: "Vikram Singh", phone: "+91 76543 21098", monthly_commitment: 3000, total_paid_to_date: 6000 },
  { id: "m4", name: "Ananya Rao", phone: "+91 65432 10987", monthly_commitment: 5000, total_paid_to_date: 10000 }
];

const INITIAL_TRANSACTIONS = [
  // Month 1 Deposits (July 2026)
  { id: "t1", date: "2026-07-10T10:00:00.000Z", member_id: "m1", type: "deposit", amount: 2000 },
  { id: "t2", date: "2026-07-11T11:00:00.000Z", member_id: "m2", type: "deposit", amount: 4000 },
  { id: "t3", date: "2026-07-12T09:30:00.000Z", member_id: "m3", type: "deposit", amount: 3000 },
  { id: "t4", date: "2026-07-14T14:00:00.000Z", member_id: "m4", type: "deposit", amount: 5000 },
  
  // Late fee transaction in July
  { id: "t5", date: "2026-07-16T17:00:00.000Z", member_id: "m3", type: "penalty", amount: 500 },

  // Month 2 Deposits (August 2026)
  { id: "t6", date: "2026-08-10T10:00:00.000Z", member_id: "m1", type: "deposit", amount: 2000 },
  { id: "t7", date: "2026-08-11T12:00:00.000Z", member_id: "m2", type: "deposit", amount: 4000 },
  { id: "t8", date: "2026-08-13T10:30:00.000Z", member_id: "m3", type: "deposit", amount: 3000 },
  { id: "t9", date: "2026-08-14T15:00:00.000Z", member_id: "m4", type: "deposit", amount: 5000 },

  // A Loan in August
  { id: "t10", date: "2026-08-15T11:00:00.000Z", member_id: "m1", type: "loan_disbursement", amount: 5000 },
  { id: "t11", date: "2026-08-15T11:05:00.000Z", member_id: "m1", type: "interest_payment", amount: 100 }
];

const INITIAL_SETTINGS = {
  interest_rate_percent: 2,
  default_late_fee: 500
};

// Get current Google Script URL from localStorage
const getScriptUrl = () => {
  return localStorage.getItem("bc_google_script_url");
};

// Helper functions for localStorage fallback (Demo Mode)
const getStored = (key, fallback) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  return JSON.parse(data);
};

const setStored = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Delay wrapper for mock network experience
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Post JSON data to Google Apps Script Web App securely without triggering CORS preflight
const postToScript = async (url, action, data) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8" // Prevents CORS preflight OPTIONS request
      },
      body: JSON.stringify({ action, data })
    });
    
    const resData = await response.json();
    if (!resData.success) {
      throw new Error(resData.error || "Spreadsheet write error");
    }
    return resData.data;
  } catch (err) {
    console.error(`Post error for action ${action}`, err);
    throw new Error(`Failed to write data to Google Sheet: ${err.message}`);
  }
};

export const googleSheetsService = {
  // --- Connection Verification ---
  async testConnection(url) {
    if (!url) throw new Error("Spreadsheet Script URL is required");
    try {
      const response = await fetch(url);
      const json = await response.json();
      if (!json.success) throw new Error(json.error || "Invalid response from spreadsheet script");
      return true;
    } catch (err) {
      console.error("Test connection error", err);
      throw new Error("Unable to connect. Please verify the URL is correct and deployed with 'Anyone' access.");
    }
  },

  // --- Bulk Fetch ---
  async getAllData() {
    const url = getScriptUrl();
    if (url && url !== "demo") {
      try {
        const response = await fetch(url);
        const json = await response.json();
        if (!json.success) throw new Error(json.error || "Failed to load data");
        return {
          members: json.members || [],
          transactions: json.transactions || [],
          settings: json.settings || INITIAL_SETTINGS
        };
      } catch (err) {
        console.error("Fetch data error", err);
        throw new Error("Failed to fetch data from Google Sheet. Check connection.");
      }
    }
    
    // Demo Mode Fallback
    await delay(DELAY);
    return {
      members: getStored("bc_members", INITIAL_MEMBERS),
      transactions: getStored("bc_transactions", INITIAL_TRANSACTIONS),
      settings: getStored("bc_settings", INITIAL_SETTINGS)
    };
  },

  // --- Members ---
  async getMembers() {
    const url = getScriptUrl();
    if (url && url !== "demo") {
      try {
        const response = await fetch(url);
        const json = await response.json();
        if (!json.success) throw new Error(json.error || "Failed to load members");
        return json.members;
      } catch (err) {
        console.error("Fetch members error", err);
        throw new Error("Failed to fetch members from Google Sheet. Check connection.");
      }
    }
    
    // Demo Mode Fallback
    await delay(DELAY);
    return getStored("bc_members", INITIAL_MEMBERS);
  },

  async addMember(member) {
    const url = getScriptUrl();
    if (url && url !== "demo") {
      return await postToScript(url, "add_member", member);
    }
    
    // Demo Mode Fallback
    await delay(DELAY);
    const members = getStored("bc_members", INITIAL_MEMBERS);
    const newMember = { ...member, id: crypto.randomUUID(), total_paid_to_date: 0 };
    members.push(newMember);
    setStored("bc_members", members);
    return newMember;
  },

  async updateMember(id, updatedFields) {
    // Note: For now, Apps Script backend doesn't need custom update_member API, 
    // but in case it is called locally:
    const url = getScriptUrl();
    if (url && url !== "demo") {
      // Direct update is not fully mapped in Google Sheet for member profiles yet, 
      // but we fallback or write when needed.
      console.warn("Direct updateMember not standard in Sheet API. Running locally.");
    }
    
    await delay(DELAY);
    const members = getStored("bc_members", INITIAL_MEMBERS);
    const updatedMembers = members.map(m => m.id === id ? { ...m, ...updatedFields } : m);
    setStored("bc_members", updatedMembers);
    return updatedMembers.find(m => m.id === id);
  },

  // --- Transactions ---
  async getTransactions() {
    const url = getScriptUrl();
    if (url && url !== "demo") {
      try {
        const response = await fetch(url);
        const json = await response.json();
        if (!json.success) throw new Error(json.error || "Failed to load transactions");
        return json.transactions;
      } catch (err) {
        console.error("Fetch transactions error", err);
        throw new Error("Failed to fetch transactions from Google Sheet.");
      }
    }
    
    // Demo Mode Fallback
    await delay(DELAY);
    return getStored("bc_transactions", INITIAL_TRANSACTIONS);
  },

  async addTransaction(transaction) {
    const url = getScriptUrl();
    if (url && url !== "demo") {
      return await postToScript(url, "add_transaction", transaction);
    }
    
    // Demo Mode Fallback
    await delay(DELAY);
    const transactions = getStored("bc_transactions", INITIAL_TRANSACTIONS);
    const newTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    };
    transactions.push(newTransaction);
    setStored("bc_transactions", transactions);

    // Side effect: Update member paid balance locally
    if (transaction.type === "deposit" || transaction.type === "principal_repayment") {
      const members = getStored("bc_members", INITIAL_MEMBERS);
      const updatedMembers = members.map(m => {
        if (m.id === transaction.member_id) {
          return {
            ...m,
            total_paid_to_date: m.total_paid_to_date + transaction.amount
          };
        }
        return m;
      });
      setStored("bc_members", updatedMembers);
    }

    return newTransaction;
  },

  // --- Settings ---
  async getSettings() {
    const url = getScriptUrl();
    if (url && url !== "demo") {
      try {
        const response = await fetch(url);
        const json = await response.json();
        if (!json.success) throw new Error(json.error || "Failed to load settings");
        return json.settings;
      } catch (err) {
        console.error("Fetch settings error", err);
        throw new Error("Failed to fetch settings from Google Sheet.");
      }
    }
    
    // Demo Mode Fallback
    await delay(DELAY);
    return getStored("bc_settings", INITIAL_SETTINGS);
  },

  async updateSettings(settings) {
    const url = getScriptUrl();
    if (url && url !== "demo") {
      return await postToScript(url, "update_settings", settings);
    }
    
    // Demo Mode Fallback
    await delay(DELAY);
    setStored("bc_settings", settings);
    return settings;
  },

  // --- Group Initialization ---
  async initializeGroup(data) {
    const url = getScriptUrl();
    if (url && url !== "demo") {
      return await postToScript(url, "initialize_group", data);
    }
    
    // Demo Mode Fallback
    await delay(DELAY);
    setStored("bc_settings", data.settings);
    
    // Create members with IDs and initial balances
    const newMembers = data.members.map(m => ({
      ...m,
      id: crypto.randomUUID(),
      monthly_commitment: Number(m.monthly_commitment) || 0,
      total_paid_to_date: 0
    }));
    setStored("bc_members", newMembers);
    
    // Empty transactions
    setStored("bc_transactions", []);
    
    return { success: true, members: newMembers };
  }
};
