import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { Settings, Users, Percent, CreditCard, ChevronRight, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheets';

export default function OnboardingScreen({ onComplete }) {
  const { refreshData } = useGroup();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [groupName, setGroupName] = useState('');
  const [duration, setDuration] = useState(20);
  const [interestRate, setInterestRate] = useState(2);
  const [lateFee, setLateFee] = useState(500);
  
  const [members, setMembers] = useState([
    { id: 1, name: '', phone: '', monthly_commitment: '' },
    { id: 2, name: '', phone: '', monthly_commitment: '' },
    { id: 3, name: '', phone: '', monthly_commitment: '' },
  ]);

  const handleAddMember = () => {
    setMembers([...members, { id: Date.now(), name: '', phone: '', monthly_commitment: '' }]);
  };

  const handleRemoveMember = (idToRemove) => {
    if (members.length <= 1) return;
    setMembers(members.filter(m => m.id !== idToRemove));
  };

  const updateMember = (id, field, value) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!groupName.trim()) {
      setError("Please provide a Group Name.");
      return;
    }
    
    const validMembers = members.filter(m => m.name.trim() !== '');
    if (validMembers.length === 0) {
      setError("Please add at least one valid member.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        settings: {
          group_name: groupName,
          duration_months: Number(duration),
          interest_rate_percent: Number(interestRate),
          default_late_fee: Number(lateFee)
        },
        members: validMembers.map(m => ({
          name: m.name,
          phone: m.phone,
          monthly_commitment: Number(m.monthly_commitment)
        }))
      };

      await googleSheetsService.initializeGroup(payload);
      
      // Tell Context to reload data from the sheet
      await refreshData();
      
      if (onComplete) onComplete();
      
    } catch (err) {
      setError(err.message || "Failed to initialize group.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 p-4 md:p-8">
      {/* Glow Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-6 shadow-inner">
            <Settings className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Group Setup Wizard</h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">
            Configure your foundational rules and add your members to get started.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Group Info */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Settings className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">1. Group Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Street 30-Member Pool"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Duration (Months)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Rules */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                <Percent className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">2. Base Financial Rules</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Default Interest Rate (% per month)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="0"
                    value={interestRate}
                    onChange={e => setInterestRate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                  />
                  <span className="absolute right-4 top-3.5 text-neutral-400 font-bold">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Default Late Fee (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={lateFee}
                    onChange={e => setLateFee(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Roster */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">3. Member Roster</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <div className="col-span-5">Member Name</div>
                <div className="col-span-3">Phone Number</div>
                <div className="col-span-3">Monthly Amt (₹)</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {members.map((member, index) => (
                <div key={member.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
                  <div className="col-span-1 md:col-span-5">
                    <label className="block md:hidden text-xs font-bold text-neutral-500 mb-1">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={member.name}
                      onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <label className="block md:hidden text-xs font-bold text-neutral-500 mb-1">Phone</label>
                    <input
                      type="tel"
                      placeholder="+91..."
                      value={member.phone}
                      onChange={(e) => updateMember(member.id, 'phone', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <label className="block md:hidden text-xs font-bold text-neutral-500 mb-1">Monthly Amt (₹)</label>
                    <input
                      type="number"
                      placeholder="5000"
                      value={member.monthly_commitment}
                      onChange={(e) => updateMember(member.id, 'monthly_commitment', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={members.length <= 1}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddMember}
              className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Another Member
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 font-semibold border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Section 4: Final Action */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-xl hover:shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  Initialize Group
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
