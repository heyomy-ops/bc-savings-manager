/**
 * BC Savings Group Manager - Google Apps Script Backend
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions -> Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Click the Save icon (floppy disk).
 * 5. Click "Deploy" (top right) -> "New Deployment".
 * 6. Under select type, click the Gear icon and choose "Web App".
 * 7. Set Description: "BC Manager API".
 * 8. Set Execute as: "Me (your email)".
 * 9. Set Who has access: "Anyone".
 * 10. Click Deploy, authorize any permissions requested, and copy the Web App URL!
 */

// Handles GET requests (reads all spreadsheet data)
function doGet(e) {
  try {
    initSheets(); // Ensure tabs and headers exist
    
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

// Handles POST requests (writes data)
function doPost(e) {
  try {
    initSheets();
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const data = payload.data;
    
    let result;
    if (action === "add_member") {
      result = addMember(data);
    } else if (action === "add_transaction") {
      result = addTransaction(data);
    } else if (action === "update_settings") {
      result = updateSettings(data);
    } else {
      throw new Error("Unknown action: " + action);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

// Helper: Auto-create tabs and headers if sheet is empty
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Members Sheet
  let membersSheet = ss.getSheetByName("Members");
  if (!membersSheet) {
    membersSheet = ss.insertSheet("Members");
    membersSheet.appendRow(["id", "name", "phone", "monthly_commitment", "total_paid_to_date"]);
    // Append some default dummy members to get started
    membersSheet.appendRow(["m1", "Aarav Sharma", "+91 98765 43210", 2000, 4000]);
    membersSheet.appendRow(["m2", "Priya Patel", "+91 87654 32109", 4000, 8000]);
    membersSheet.appendRow(["m3", "Vikram Singh", "+91 76543 21098", 3000, 6000]);
    membersSheet.appendRow(["m4", "Ananya Rao", "+91 65432 10987", 5000, 10000]);
  }
  
  // 2. Transactions Sheet
  let txSheet = ss.getSheetByName("Transactions");
  if (!txSheet) {
    txSheet = ss.insertSheet("Transactions");
    txSheet.appendRow(["id", "date", "member_id", "type", "amount"]);
    // Append some initial transactions to get started
    txSheet.appendRow(["t1", "2026-06-10T10:00:00.000Z", "m1", "deposit", 2000]);
    txSheet.appendRow(["t2", "2026-06-11T11:00:00.000Z", "m2", "deposit", 4000]);
    txSheet.appendRow(["t3", "2026-06-12T09:30:00.000Z", "m3", "deposit", 3000]);
    txSheet.appendRow(["t4", "2026-06-14T14:00:00.000Z", "m4", "deposit", 5000]);
    txSheet.appendRow(["t5", "2026-06-16T17:00:00.000Z", "m3", "penalty", 500]);
    txSheet.appendRow(["t6", "2026-07-10T10:00:00.000Z", "m1", "deposit", 2000]);
    txSheet.appendRow(["t7", "2026-07-11T12:00:00.000Z", "m2", "deposit", 4000]);
    txSheet.appendRow(["t8", "2026-07-13T10:30:00.000Z", "m3", "deposit", 3000]);
    txSheet.appendRow(["t9", "2026-07-14T15:00:00.000Z", "m4", "deposit", 5000]);
    txSheet.appendRow(["t10", "2026-07-15T11:00:00.000Z", "m1", "loan_disbursement", 5000]);
    txSheet.appendRow(["t11", "2026-07-15T11:05:00.000Z", "m1", "interest_payment", 100]);
  }
  
  // 3. Settings Sheet
  let settingsSheet = ss.getSheetByName("Settings");
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet("Settings");
    settingsSheet.appendRow(["key", "value"]);
    settingsSheet.appendRow(["interest_rate_percent", 2]);
    settingsSheet.appendRow(["default_late_fee", 500]);
  }
}

// Helper: Convert sheet rows into JSON object array
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

// Helper: Parse Settings rows as key-value pairs
function getSettingsData() {
  const rows = getSheetData("Settings");
  const settings = {};
  rows.forEach(function(row) {
    settings[row.key] = Number(row.value) || 0;
  });
  
  // Apply fallbacks if missing
  if (settings.interest_rate_percent === undefined) settings.interest_rate_percent = 2;
  if (settings.default_late_fee === undefined) settings.default_late_fee = 500;
  
  return settings;
}

// Writes: Add a Member
function addMember(member) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Members");
  
  const id = Utilities.getUuid();
  const newRow = [
    id,
    member.name || "",
    member.phone || "",
    Number(member.monthly_commitment) || 0,
    0 // total paid to date starts at 0
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

// Writes: Add a Transaction and apply balance side-effects
function addTransaction(tx) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transactions");
  
  const id = Utilities.getUuid();
  const dateStr = new Date().toISOString();
  const amount = Number(tx.amount) || 0;
  
  const newRow = [
    id,
    dateStr,
    tx.member_id || "",
    tx.type || "",
    amount
  ];
  
  sheet.appendRow(newRow);
  
  // Side effect: If transaction is a deposit or principal repayment, update total_paid_to_date
  if (tx.type === "deposit" || tx.type === "principal_repayment") {
    const membersSheet = ss.getSheetByName("Members");
    const mValues = membersSheet.getDataRange().getValues();
    
    for (let i = 1; i < mValues.length; i++) {
      if (mValues[i][0] === tx.member_id) {
        const currentPaid = Number(mValues[i][4]) || 0;
        const newPaid = currentPaid + amount;
        
        // Update column E (index 5)
        membersSheet.getRange(i + 1, 5).setValue(newPaid);
        break;
      }
    }
  }
  
  return {
    id: id,
    date: dateStr,
    member_id: tx.member_id,
    type: tx.type,
    amount: amount
  };
}

// Writes: Update Settings
function updateSettings(settingsObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Settings");
  const values = sheet.getDataRange().getValues();
  
  // Read existing keys to update, or append if missing
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
