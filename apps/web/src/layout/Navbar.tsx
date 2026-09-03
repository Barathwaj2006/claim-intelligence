import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Bell, Menu, X, WifiOff } from 'lucide-react';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMobileMenuToggle,
  isMobileMenuOpen,
}) => {
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch('/health');
        if (res.ok) {
          if (isMounted) setApiConnected(true);
        } else {
          if (isMounted) setApiConnected(false);
        }
      } catch {
        if (isMounted) setApiConnected(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 text-white shadow-md">
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            aria-label="Toggle Navigation Menu"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight flex items-center gap-2">
              ClaimIntel
              <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded border border-blue-400/30">
                U.S. Healthcare Revenue Intelligence
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Pre-Submission Denial Prevention & Risk Telemetry Engine
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Status Indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            apiConnected === false
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {apiConnected === false ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Offline (Simulated Rules Engine)</span>
              <span className="md:hidden">Simulated</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span className="hidden md:inline">Rules Engine Active (FastAPI v1.0)</span>
              <span className="md:hidden">API Active</span>
            </>
          )}
        </div>

        {/* Environment Tag */}
        <span className="hidden lg:inline-block px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-mono font-medium">
          U.S. RCM Staging
        </span>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-700">
            RC
          </div>
          <div className="hidden sm:block text-left text-xs">
            <div className="font-semibold text-slate-200">RCM Lead Biller</div>
            <div className="text-slate-400 font-mono text-[11px]">NPI: 1982736450</div>
          </div>
        </div>
      </div>
    </header>
  );
};
