import React, { useState } from 'react';
import { ShieldCheck, Activity, Bell, RotateCcw } from 'lucide-react';
import { useClaims } from '../context/ClaimContext';

export const Navbar: React.FC = () => {
  const { claims, clearAllData } = useClaims();
  const highRiskCount = claims.filter((c) => c.riskLevel === 'HIGH').length;
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
            ClaimIntel <span className="text-blue-600 text-sm font-semibold">U.S. RCM</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Pre-Submission Denial Prevention Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
          <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
          <span>Rules Engine Active</span>
        </div>

        {claims.length > 0 && (
          <div>
            {showConfirmReset ? (
              <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-xs">
                <span className="text-rose-700 font-medium">Clear all?</span>
                <button
                  onClick={() => {
                    clearAllData();
                    setShowConfirmReset(false);
                  }}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                title="Clear all user data"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data</span>
              </button>
            )}
          </div>
        )}

        <div className="relative">
          <button
            aria-label="Notifications"
            title={highRiskCount > 0 ? `${highRiskCount} high-risk claims requiring attention` : 'No urgent alerts'}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {highRiskCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
            RC
          </div>
          <div className="hidden sm:block text-left text-xs">
            <div className="font-semibold text-slate-800">RCM Lead Biller</div>
            <div className="text-slate-500">Memorial Health NPI: 1982736450</div>
          </div>
        </div>
      </div>
    </header>
  );
};
