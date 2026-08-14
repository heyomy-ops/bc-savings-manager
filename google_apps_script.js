/**
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
  
  if (tx.type === "deposit" || tx.type === "principal_repayment") {
    const membersSheet = ss.getSheetByName("Members");
    const mValues = membersSheet.getDataRange().getValues();
    
    for (let i = 1; i < mValues.length; i++) {
      if (mValues[i][0] === tx.member_id) {
        const currentPaid = Number(mValues[i][4]) || 0;
        membersSheet.getRange(i + 1, 5).setValue(currentPaid + amount);
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
}

