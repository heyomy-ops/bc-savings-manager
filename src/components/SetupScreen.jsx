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
 * BC Savings Group Manager - Auto-Updating Loader
 * 
 * Instructions:
 * 1. Paste this script into your Google Apps Script editor.
 * 2. Click Save (floppy disk).
 * 3. Click Deploy -> New Deployment (Type: Web App).
 * 4. Execute as: "Me", Access: "Anyone".
 * 5. Copy the Web App URL and paste it in the dashboard!
 */

function getLibrary() {
  const url = 'https://raw.githubusercontent.com/heyomy-ops/bc-savings-manager/main/google_apps_script.js?v=' + Date.now();
  return UrlFetchApp.fetch(url).getContentText();
}

function doGet(e) {
  eval(getLibrary());
  return handleDoGet(e);
}

function doPost(e) {
  eval(getLibrary());
  return handleDoPost(e);
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
        <div className="flex-1 min-w-0 p-6 md:p-8 border-b md:border-b-0 md:border-r border-neutral-200/40 dark:border-neutral-800/40">
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
                <pre className="p-3 bg-neutral-900 text-neutral-200 rounded-xl max-h-36 overflow-x-auto overflow-y-auto text-[10px] font-mono select-all">
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
        <div className="flex-1 min-w-0 p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col justify-between">
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
