import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  FileCheck2,
} from 'lucide-react';
import { useClaims } from '../context/ClaimContext';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`
    }
  >
    <div className="flex items-center gap-3">
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </div>
    {badge ? (
      <span className="px-2 py-0.5 text-xs rounded-full font-bold bg-rose-100 text-rose-700">
        {badge}
      </span>
    ) : null}
  </NavLink>
);

export const Sidebar: React.FC = () => {
  const { claims, recoveryCases } = useClaims();

  const highRiskCount = claims.filter((c) => c.riskLevel === 'HIGH').length;
  const recoveryAtRisk = recoveryCases.reduce((sum, r) => sum + (r.revenueAtRisk || 0), 0);

  const claimsBadge = highRiskCount > 0 ? `${highRiskCount} High` : undefined;
  const recoveryBadge =
    recoveryAtRisk > 0
      ? `$${recoveryAtRisk >= 1000 ? Math.round(recoveryAtRisk / 1000) + 'k' : recoveryAtRisk}`
      : undefined;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Operations
          </div>
          <NavItem to="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
          <NavItem
            to="/claims"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            label="Claims Queue"
            badge={claimsBadge}
          />
          <NavItem
            to="/eligibility"
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Eligibility (270/271)"
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Revenue Recovery
          </div>
          <NavItem
            to="/recovery"
            icon={<TrendingUp className="w-4 h-4" />}
            label="Denials & Appeals"
            badge={recoveryBadge}
          />
          <NavItem
            to="/analytics"
            icon={<BarChart3 className="w-4 h-4" />}
            label="Payer Performance"
          />
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-2 rounded-xl">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-1">
          <FileCheck2 className="w-4 h-4 text-blue-600" />
          CMS-1500 & 837P Ready
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Standardized HIPAA EDI 5010 transactions with instant CARC crosswalking.
        </p>
      </div>
    </aside>
  );
};
