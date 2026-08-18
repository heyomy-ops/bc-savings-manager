# Learnings & Crash Logs

This file is a running record of errors, crashes, and the solutions I've learned along the way.


## 1. `npm run dev` (Vite) Crashing on Restart

**The Problem:**
When restarting `npm run dev` multiple times, the dev server crashes, hangs, or behaves unpredictably.

**The Cause:**
I discovered that when you close or restart the terminal (or press `Ctrl+Z` instead of `Ctrl+C`), the previous Node/Vite processes don't always terminate. Over time, multiple "zombie" instances of Vite keep running in the background. 
This causes two main issues:
1. **Port Conflicts (`EADDRINUSE`)**: The old process is still holding onto port `5173`.
2. **Memory Exhaustion**: Having 5+ Vite development servers running simultaneously consumes a massive amount of system memory, causing the OS to kill the new processes or causing them to crash immediately.

**The Solution:**
Whenever `npm run dev` starts crashing mysteriously on restart, we need to clean up the orphaned processes. 
Run the following command to kill all dangling Vite processes:
```bash
pkill -f vite
```
After running this, starting `npm run dev` will work perfectly again. I have just run this command for you to clear out the 4-5 zombie Vite instances that were running!

---

## 2. Blank Screen on Web (Missing Native Bindings)

**The Problem:**
The `npm run dev` server runs perfectly in the terminal, but the browser just shows a blank white screen instead of the React application.

**The Cause:**
This happens when `node_modules` gets corrupted, specifically missing the "native bindings" (like `@esbuild/darwin-arm64` or `@oxlint/binding-darwin-arm64`). This can happen due to a known `npm` bug with optional dependencies, or if an `npm install` process was interrupted.
Because Vite relies heavily on `esbuild` to compile React code on-the-fly, a missing binding causes Vite to silently fail to serve the JavaScript chunks, resulting in the browser receiving corrupted or missing files, thus rendering a blank screen!

**The Solution:**
Whenever we see a mysterious blank screen while the Vite server is running fine, or if we see errors like `Cannot find native binding` when running tools like `oxlint`, we need to completely wipe and reinstall the dependencies:
```bash
rm -rf node_modules package-lock.json && npm install
```
This forces `npm` to cleanly re-download all required native binaries for your specific operating system and architecture.

---

## 3. Google Apps Script Permission Error (Missing Scope)

**The Problem:**
When connecting the Google Apps Script Web App URL to the frontend dashboard, the connection fails with the error: 
`Exception: Specified permissions are not sufficient to call SpreadsheetApp.getActiveSpreadsheet.`

**The Cause:**
The setup instructions had you paste a loader script that fetches code dynamically from GitHub and executes it. Because the code is executed dynamically using `UrlFetchApp` and `Function(...)`, Google Apps Script's static code analyzer cannot "see" that the script eventually needs access to `SpreadsheetApp`. 
As a result, when you first deployed the script, Google never prompted you to authorize access to your spreadsheets, leaving the Web App without the required permissions scopes (like `https://www.googleapis.com/auth/spreadsheets`).

**The Solution:**
We must "trick" Google's static analyzer into granting the required permissions. We do this by adding a dummy function that explicitly references the required service directly in the main file:
```javascript
function _forceScopes() {
  // This dummy function tricks Google into requesting permissions
  SpreadsheetApp.getActiveSpreadsheet();
}
```
Even if this function is never called, simply having it in the file forces Google Apps Script to request spreadsheet authorization when you hit "Deploy". 

---
*(I will continue to update this file with any new errors and solutions we encounter!)*
