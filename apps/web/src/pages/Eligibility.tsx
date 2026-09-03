import React, { useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';

export const Eligibility: React.FC = () => {
  const [memberId, setMemberId] = useState('BCBS-98231011');
  const [payer, setPayer] = useState('00123'); // BCBS
  const [verified, setVerified] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Real-Time Eligibility (EDI 270/271)</h2>
        <p className="text-sm text-slate-500 mt-1">
          Verify active insurance coverage, remaining deductibles, and specialist copays in sub-seconds.
        </p>
      </div>

      {/* Verification Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Payer
            </label>
            <select
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="00123">Blue Cross Blue Shield (00123)</option>
              <option value="00430">UnitedHealthcare (00430)</option>
              <option value="00020">Medicare Part B (00020)</option>
              <option value="60054">Aetna Health (60054)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Member / Subscriber ID
            </label>
            <input
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full text-xs font-mono font-semibold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
        <button
          onClick={() => setVerified(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs"
        >
          <Search className="w-4 h-4" /> Run 270 Real-Time Inquiry
        </button>
      </div>

      {/* 271 Response Card */}
      {verified && (
        <div className="bg-white rounded-xl border border-emerald-200 shadow-xs overflow-hidden max-w-2xl">
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Coverage Active (HIPAA 271 Response OK)</span>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
              TRN-2026-90812
            </span>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Subscriber Name</div>
              <div className="text-sm font-bold text-slate-800">Eleanor Vance</div>
              <div className="text-slate-500 mt-1">Plan: Silver Choice PPO Comprehensive</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Coverage Window</div>
              <div className="text-sm font-bold text-slate-800">2026-01-01 to Present</div>
              <div className="text-emerald-600 font-semibold mt-1">Currently Effective</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Annual Deductible</div>
              <div className="text-sm font-bold text-slate-800">$1,500.00 Total</div>
              <div className="text-slate-600 mt-1">$1,200.00 Met ($300.00 Remaining)</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Patient Cost-Share</div>
              <div className="text-sm font-bold text-slate-800">$35.00 Specialist Copay</div>
              <div className="text-slate-600 mt-1">20% In-Network Coinsurance</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
