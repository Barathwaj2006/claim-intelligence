import React, { useState } from 'react';
import { Activity, Bell, RotateCcw, Sparkles } from 'lucide-react';
import { useClaims } from '../context/ClaimContext';
import { InfinityShieldLogo } from '../components/InfinityShieldLogo';

export const Navbar: React.FC = () => {
  const { claims, clearAllData } = useClaims();
  const highRiskCount = claims.filter((c) => c.riskLevel === 'HIGH').length;
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleTriggerSplash = () => {
    window.dispatchEvent(new CustomEvent('open-splash'));
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={handleTriggerSplash}
          title="Click to view logo generation splash screen"
          className="group focus:outline-none"
        >
          <InfinityShieldLogo size="sm" variant="badge" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight flex items-center gap-1.5">
            <span>ClaimIntel</span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/30 uppercase tracking-wider">
              AEGIS
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Pre-Submission Denial Prevention Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTriggerSplash}
          title="Open Aegis Brand Logo & Shield Showcase"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Brand Emblem</span>
        </button>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
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
