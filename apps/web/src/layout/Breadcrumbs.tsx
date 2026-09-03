import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  claims: 'Claims Queue',
  eligibility: 'Eligibility (270/271)',
  recovery: 'Revenue Recovery',
  analytics: 'Payer Performance',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 mb-6">
      <ol className="flex items-center space-x-2 flex-wrap">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-slate-900 font-medium transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Dashboard</span>
          </Link>
        </li>

        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayLabel =
            routeLabels[value.toLowerCase()] ||
            (value.startsWith('clm') || value.startsWith('CLM')
              ? `Claim ${value.toUpperCase()}`
              : value.charAt(0).toUpperCase() + value.slice(1));

          return (
            <li key={to} className="flex items-center space-x-2">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              {isLast ? (
                <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                  {displayLabel}
                </span>
              ) : (
                <Link
                  to={to}
                  className="hover:text-slate-900 font-medium transition-colors"
                >
                  {displayLabel}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
