import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  FileCheck2,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    end={to === '/'}
    className={({ isActive }) =>
      `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all relative ${
        isActive
          ? 'bg-blue-600 text-white shadow-xs font-bold'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <div className="flex items-center gap-3">
          <span className={`w-4 h-4 flex items-center justify-center ${isActive ? 'text-white' : 'text-slate-400'}`}>
            {icon}
          </span>
          <span>{label}</span>
        </div>
        {badge && (
          <span
            className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
              isActive
                ? 'bg-white text-blue-700'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {badge}
          </span>
        )}
      </>
    )}
  </NavLink>
);

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Content View */}
      <aside
        className={`fixed lg:static top-16 left-0 bottom-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } min-h-[calc(100vh-4rem)]`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Operations
            </div>
            <NavItem
              to="/"
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="Dashboard"
              onClick={onClose}
            />
            <NavItem
              to="/claims"
              icon={<FileSpreadsheet className="w-4 h-4" />}
              label="Claims Queue"
              badge="16 High"
              onClick={onClose}
            />
            <NavItem
              to="/eligibility"
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Eligibility (270/271)"
              onClick={onClose}
            />
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Revenue Recovery
            </div>
            <NavItem
              to="/recovery"
              icon={<TrendingUp className="w-4 h-4" />}
              label="Denials & Appeals"
              badge="$58k"
              onClick={onClose}
            />
            <NavItem
              to="/analytics"
              icon={<BarChart3 className="w-4 h-4" />}
              label="Payer Performance"
              onClick={onClose}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 m-2 rounded-xl">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-xs mb-1">
            <FileCheck2 className="w-4 h-4 text-blue-400" />
            CMS-1500 & 837P Ready
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Standardized HIPAA EDI 5010 transactions with instant CARC crosswalking.
          </p>
        </div>
      </aside>
    </>
  );
};
