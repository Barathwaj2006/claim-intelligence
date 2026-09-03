import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Calculator,
  Receipt,
  Scale,
  Stethoscope,
  Building2,
} from 'lucide-react';
import { useClaims } from '../context/ClaimContext';
import { InfinityShieldLogo } from '../components/InfinityShieldLogo';

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
  const { claims, recoveryCases, priorAuths, underpayments } = useClaims();

  const highRiskCount = claims.filter((c) => c.riskLevel === 'HIGH').length;
  const recoveryAtRisk = recoveryCases.reduce((sum, r) => sum + (r.revenueAtRisk || 0), 0);
  const activeAuthCount = priorAuths.filter((p) => p.status === 'APPROVED' || p.status === 'IN_REVIEW').length;
  const underpaymentCount = underpayments.filter((u) => u.status === 'DETECTED' || u.recoveryStatus === 'IDENTIFIED').length;

  const claimsBadge = highRiskCount > 0 ? `${highRiskCount} High` : undefined;
  const recoveryBadge =
    recoveryAtRisk > 0
      ? `$${recoveryAtRisk >= 1000 ? Math.round(recoveryAtRisk / 1000) + 'k' : recoveryAtRisk}`
      : undefined;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-5 overflow-y-auto">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
            Core Operations
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
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center justify-between">
            <span>Hospital RCM</span>
            <Building2 className="w-3 h-3 text-slate-400" />
          </div>
          <NavItem
            to="/prior-auth"
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Prior Authorization"
            badge={activeAuthCount > 0 ? activeAuthCount : undefined}
          />
          <NavItem
            to="/drg-grouper"
            icon={<Calculator className="w-4 h-4" />}
            label="MS-DRG Grouper"
          />
          <NavItem
            to="/remittance"
            icon={<Receipt className="w-4 h-4" />}
            label="835 Remittance Recon"
          />
          <NavItem
            to="/contract-auditing"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            label="Contract Underpayment"
            badge={underpaymentCount > 0 ? underpaymentCount : undefined}
          />
          <NavItem
            to="/cdi-copilot"
            icon={<Stethoscope className="w-4 h-4" />}
            label="CDI Clinical Copilot"
          />
          <NavItem
            to="/good-faith-estimate"
            icon={<Scale className="w-4 h-4" />}
            label="Good Faith Estimates"
          />
        </div>

        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
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

      <div className="p-3 border border-slate-200/70 bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white m-2 rounded-xl shadow-xs">
        <div className="flex items-center gap-2.5 mb-1.5">
          <InfinityShieldLogo size="xs" />
          <span className="text-xs font-bold text-amber-300/90 tracking-wide">
            AEGIS RCM ENGINE
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
          UB-04 & CMS-1500 pre-submission zero-defect telemetry active.
        </p>
      </div>
    </aside>
  );
};
