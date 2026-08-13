import React, { useEffect, useRef, useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { X, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const { scriptUrl, saveScriptUrl, settings, saveSettings } = useGroup();
  const [interestRate, setInterestRate] = useState(settings?.interest_rate_percent || 2);
  const [lateFee, setLateFee] = useState(settings?.default_late_fee || 500);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync state with settings when loaded or changed
  useEffect(() => {
    if (settings) {
      setInterestRate(settings.interest_rate_percent);
      setLateFee(settings.default_late_fee);
    }
  }, [settings]);

  // Open / Close dialog using native APIs
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Add click listener fallback for backdrop light dismiss
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Listen for close/cancel events to sync with parent state
    const handleClose = () => {
      onClose();
    };
    dialog.addEventListener('close', handleClose);

    // Fallback for browsers without closedby support
    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );

      if (!isDialogContent) {
        dialog.close();
      }
    };

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        dialog.removeEventListener('click', handleBackdropClick);
      }
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await saveSettings({
        interest_rate_percent: Number(interestRate),
        default_late_fee: Number(lateFee)
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="settings-dialog-title"
      className="p-0 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm max-w-md w-[90%] md:w-full overflow-hidden transition-all duration-300"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 id="settings-dialog-title" className="text-xl font-bold text-neutral-900 dark:text-white">
              Group Settings
            </h2>
          </div>
          <button
            onClick={() => dialogRef.current?.close()}
            className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Connection Status Section */}
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Spreadsheet Connection</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                scriptUrl === "demo"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
              }`}>
                {scriptUrl === "demo" ? "Demo Mode (Offline)" : "Active Sync"}
              </span>
            </div>
            {scriptUrl && scriptUrl !== "demo" && (
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono break-all line-clamp-1 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded">
                {scriptUrl}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                saveScriptUrl(""); // Disconnect!
                dialogRef.current?.close();
              }}
              className="w-full text-center text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 py-1.5 rounded-lg border border-red-200/30 dark:border-red-950/30 transition cursor-pointer"
            >
              Disconnect Spreadsheet
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Interest Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-4 top-2 text-neutral-500 dark:text-neutral-400 font-medium text-xs">% / month</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Default Late Fee (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-neutral-500 dark:text-neutral-400 font-medium text-sm">₹</span>
              <input
                type="number"
                min="0"
                value={lateFee}
                onChange={(e) => setLateFee(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="flex-1 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg shadow-md transition"
            >
              {saving ? "Saving..." : success ? "Saved! ✓" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
