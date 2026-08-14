import React, { useState } from "react";
import { useGroup } from "../context/GroupContext";
import { googleSheetsService } from "../services/googleSheets";
import { Database, Copy, Check, Play, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function SetupScreen() {
  const { saveScriptUrl } = useGroup();
  const [inputUrl, setInputUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const scriptCode = `/**
 * BC Savings Group Manager - Google Apps Script Backend
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions -> Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Click the Save icon (floppy disk).
 * 5. Click "Deploy" -> "New Deployment".
 * 6. Under select type, click the Gear icon and choose "Web App".
 * 7. Set Description: "BC Manager API".
 * 8. Set Execute as: "Me (your email)".
 * 9. Set Who has access: "Anyone".
 * 10. Click Deploy, authorize any permissions requested, and copy the Web App URL!
 */

function doGet(e) {
  try {
    initSheets();
    const data = {
      members: getSheetData("Members"),
      transactions: getSheetData("Transactions"),
      settings: getSettingsData()
    };
    return ContentService.createTextOutput(JSON.stringify({ success: true, ...data }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

function doPost(e) {
  try {
    initSheets();
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const data = payload.data;
    let result;
    
    if (action === "add_member") result = addMember(data);
    else if (action === "add_transaction") result = addTransaction(data);
    else if (action === "update_settings") result = updateSettings(data);
    else if (action === "initialize_group") result = initializeGroup(data);
    else throw new Error("Unknown action: " + action);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

function checkHeaders(sheet, expectedHeaders) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
  } else {
    const currentHeader = sheet.getRange(1, 1).getValue();
    if (currentHeader !== expectedHeaders[0]) {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    }
  }
}

function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let membersSheet = ss.getSheetByName("Members");
  if (!membersSheet) membersSheet = ss.insertSheet("Members");
  checkHeaders(membersSheet, ["id", "name", "phone", "monthly_commitment", "total_paid_to_date"]);
  
  let txSheet = ss.getSheetByName("Transactions");
  if (!txSheet) txSheet = ss.insertSheet("Transactions");
  checkHeaders(txSheet, ["id", "date", "member_id", "type", "amount"]);
  
  let settingsSheet = ss.getSheetByName("Settings");
  if (!settingsSheet) settingsSheet = ss.insertSheet("Settings");
  checkHeaders(settingsSheet, ["key", "value"]);
}

function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  if (values.length <= 1) return [];
  
  const headers = values[0];
  const list = [];
  
  for (let i = 1; i < values.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      let val = values[i][j];
      
      // Parse numbers cleanly
      if (headers[j] === "monthly_commitment" || headers[j] === "total_paid_to_date" || headers[j] === "amount" || headers[j] === "value") {
        val = Number(val) || 0;
      }
      
      row[headers[j]] = val;
    }
    list.push(row);
  }
  return list;
}

function getSettingsData() {
  const rows = getSheetData("Settings");
  const settings = {};
  rows.forEach(function(row) {
    settings[row.key] = Number(row.value) || 0;
  });
  
  if (settings.interest_rate_percent === undefined) settings.interest_rate_percent = 2;
  if (settings.default_late_fee === undefined) settings.default_late_fee = 500;
  
  return settings;
}

function addMember(member) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Members");
  const id = Utilities.getUuid();
  const newRow = [
    id,
    member.name || "",
    member.phone || "",
    Number(member.monthly_commitment) || 0,
    0
  ];
  sheet.appendRow(newRow);
  return {
    id: id,
    name: member.name,
    phone: member.phone,
    monthly_commitment: member.monthly_commitment,
    total_paid_to_date: 0
  };
}

function addTransaction(tx) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainTxSheet = ss.getSheetByName("Transactions");
  const membersSheet = ss.getSheetByName("Members");
  
  const id = Utilities.getUuid();
  const dateStr = new Date().toISOString();
  const amount = Number(tx.amount) || 0;
  
  // 1. Save to the main log
  const newRow = [id, dateStr, tx.member_id || "", tx.type || "", amount];
  mainTxSheet.appendRow(newRow);
  
  // 2. Find the Member's Name and update their total paid
  let memberName = "Unknown Member";
  let totalSavings = 0;
  
  const mValues = membersSheet.getDataRange().getValues();
  for (let i = 1; i < mValues.length; i++) {
    if (mValues[i][0] === tx.member_id) {
      memberName = mValues[i][1];
      const currentPaid = Number(mValues[i][4]) || 0;
      
      if (tx.type === "deposit" || tx.type === "principal_repayment") {
        totalSavings = currentPaid + amount;
        membersSheet.getRange(i + 1, 5).setValue(totalSavings);
      } else {
        totalSavings = currentPaid;
      }
      break;
    }
  }
  
  // 3. Create or find the Member's specific Tab
  const memberSheetName = "History - " + memberName;
  let individualSheet = ss.getSheetByName(memberSheetName);
  
  if (!individualSheet) {
    individualSheet = ss.insertSheet(memberSheetName);
    individualSheet.appendRow(["Transaction ID", "Date", "Type", "Amount", "Total Savings Balance"]);
    individualSheet.getRange("A1:E1").setFontWeight("bold"); 
  }
  
  // 4. Add this transaction to their personal sheet
  individualSheet.appendRow([id, dateStr, tx.type || "", amount, totalSavings]);
  const newRowNum = individualSheet.getLastRow();
  
  // 5. Color coding based on transaction type
  let hexColor = "#ffffff";
  if (tx.type === "deposit" || tx.type === "principal_repayment") {
    hexColor = "#dcfce7"; // light green
  } else if (tx.type === "loan_disbursement") {
    hexColor = "#fee2e2"; // light red
  } else if (tx.type === "interest_payment" || tx.type === "penalty") {
    hexColor = "#fef9c3"; // light yellow
  }
  
  individualSheet.getRange(newRowNum, 1, 1, 5).setBackground(hexColor);
  
  return {
    id: id,
    date: dateStr,
    member_id: tx.member_id,
    type: tx.type,
    amount: amount
  };
}

function updateSettings(settingsObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Settings");
  const values = sheet.getDataRange().getValues();
  
  const keys = ["interest_rate_percent", "default_late_fee"];
  
  keys.forEach(function(key) {
    if (settingsObj[key] === undefined) return;
    
    let found = false;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(Number(settingsObj[key]));
        found = true;
        break;
      }
    }
    
    if (!found) {
      sheet.appendRow([key, Number(settingsObj[key])]);
    }
  });
  
  return settingsObj;
}

function initializeGroup(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const settingsSheet = ss.getSheetByName("Settings");
  settingsSheet.appendRow(["group_name", data.settings.group_name]);
  settingsSheet.appendRow(["duration_months", data.settings.duration_months]);
  settingsSheet.appendRow(["interest_rate_percent", data.settings.interest_rate_percent]);
  settingsSheet.appendRow(["default_late_fee", data.settings.default_late_fee]);
  
  const membersSheet = ss.getSheetByName("Members");
  const membersData = [];
  data.members.forEach(function(member) {
    const id = Utilities.getUuid();
    membersSheet.appendRow([id, member.name, member.phone, Number(member.monthly_commitment) || 0, 0]);
    membersData.push({ id: id, name: member.name, phone: member.phone, monthly_commitment: member.monthly_commitment, total_paid_to_date: 0 });
  });
  
  return { success: true, members: membersData };
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyConnection = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setTesting(true);
    setError("");
    try {
      // Validate that it is a Google Script Web App URL
      if (!inputUrl.includes("script.google.com/macros/s/")) {
        throw new Error("Invalid URL. It must be a Google Script Web App URL containing 'script.google.com/macros/s/'");
      }

      await googleSheetsService.testConnection(inputUrl.trim());
      saveScriptUrl(inputUrl.trim());
    } catch (err) {
      setError(err.message || "Failed to establish database connection.");
    } finally {
      setTesting(false);
    }
  };

  const handleTryDemo = () => {
    saveScriptUrl("demo");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 flex flex-col p-4 md:p-8 relative">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.04),transparent_50%)] pointer-events-none" />

      <div className="m-auto w-full max-w-4xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col md:flex-row relative z-10">
        
        {/* Step Guide Column (Left) */}
        <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-neutral-200/40 dark:border-neutral-800/40">
          <div className="flex items-center gap-2 mb-6">
            <span className="p-2 bg-emerald-600 rounded-xl text-white">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white leading-none">Database Setup</h2>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider mt-1">Google Sheets API Link</p>
            </div>
          </div>

          <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">1-Minute Integration Guide:</h3>
          
          <ol className="space-y-4 text-xs text-neutral-600 dark:text-neutral-400 font-medium list-decimal list-inside">
            <li>
              Create a new, empty <strong className="text-neutral-900 dark:text-white font-semibold">Google Sheet</strong>.
            </li>
            <li>
              Go to <strong className="text-neutral-900 dark:text-white font-semibold">Extensions ➜ Apps Script</strong> (at the top menu).
            </li>
            <li>
              Delete any template code and copy the script below:
              <div className="mt-2 relative">
                <button
                  onClick={handleCopyCode}
                  className="absolute right-2.5 top-2.5 p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Copy Code</span>
                    </>
                  )}
                </button>
                <pre className="p-3 bg-neutral-900 text-neutral-200 rounded-xl max-h-36 overflow-y-auto text-[10px] font-mono select-all">
                  {scriptCode}
                </pre>
              </div>
            </li>
            <li>
              Click <strong className="text-neutral-900 dark:text-white font-semibold">Save</strong>, then click <strong className="text-neutral-900 dark:text-white font-semibold">Deploy ➜ New Deployment</strong>.
            </li>
            <li>
              Click the gear icon, choose <strong className="text-neutral-900 dark:text-white font-semibold">Web App</strong>, and configure:
              <ul className="list-disc list-inside ml-4 mt-1 text-[11px] text-neutral-500 space-y-0.5">
                <li>Execute as: <span className="font-semibold text-neutral-700 dark:text-neutral-300">Me</span></li>
                <li>Who has access: <span className="font-semibold text-neutral-700 dark:text-neutral-300">Anyone</span></li>
              </ul>
            </li>
            <li>
              Deploy, authorize permissions, and <strong className="text-neutral-900 dark:text-white font-semibold">Copy the Web App URL</strong>!
            </li>
          </ol>
        </div>

        {/* Input & Action Column (Right) */}
        <div className="flex-1 p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
              BC Manager Dashboard
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
              Connect your Google Sheet ledger to sync group settings, loans, commitments, and calculate your profit pool securely.
            </p>

            <form onSubmit={handleVerifyConnection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                  Google Apps Script URL
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/..."
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setError("");
                  }}
                  required
                  disabled={testing}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 transition"
                />
              </div>

              {error && (
                <div className="flex gap-2 p-3.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-950/50 rounded-xl text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Connection Failed</p>
                    <p className="font-medium text-[11px] mt-0.5 opacity-90">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={testing || !inputUrl}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-emerald-600/10 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Connection...
                  </>
                ) : (
                  <>
                    Connect Spreadsheet <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-200/40 dark:border-neutral-800/40 space-y-4">
            <div className="text-center text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              Or Try it Out
            </div>
            
            <button
              onClick={handleTryDemo}
              className="w-full py-2.5 px-4 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Launch Demo Mode (Offline Mock Data)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
