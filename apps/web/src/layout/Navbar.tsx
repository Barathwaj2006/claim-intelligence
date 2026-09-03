import React, { useState } from 'react';
import { ShieldCheck, Bell, RotateCcw, Building2 } from 'lucide-react';
import { useClaims } from '../context/ClaimContext';
import { InfinityShieldLogo } from '../components/InfinityShieldLogo';

export const Navbar: React.FC = () => {
  const { claims, clearAllData } = useClaims();
  const highRiskCount = claims.filter((c) => c.riskLevel === 'HIGH').length;
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand Identity */}
      <div className="flex items-center gap-3.5">
        <InfinityShieldLogo size="sm" variant="badge" />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              ClaimIntel
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider font-mono">
              Enterprise RCM
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Pre-Submission Denial Prevention & Adjudication Platform
          </p>
        </div>
      </div>

      {/* Facility & Gateway Metadata */}
      <div className="flex items-center gap-4">
        {/* Healthcare Facility Badge */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Memorial Health System</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-500">NPI 1982736450</span>
        </div>

        {/* Clearinghouse Gateway Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>EDI 5010 Gateway Online</span>
        </div>

        {/* Data Reset Action */}
        {claims.length > 0 && (
          <div>
            {showConfirmReset ? (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-xs">
                <span className="text-rose-700 font-medium">Clear session data?</span>
                <button
                  onClick={() => {
                    clearAllData();
                    setShowConfirmReset(false);
                  }}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold transition-colors cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold transition-colors cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                title="Reset staging data to original state"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        )}

        {/* Alert Notifications */}
        <div className="relative">
          <button
            aria-label="Notifications"
            title={highRiskCount > 0 ? `${highRiskCount} high-risk claims requiring intervention` : 'No urgent alerts'}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {highRiskCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            RC
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="font-bold text-slate-800 leading-tight">RCM Lead Biller</div>
            <div className="text-slate-500 text-[11px]">Inpatient & Ambulatory</div>
          </div>
        </div>
      </div>
    </header>
  );
};
