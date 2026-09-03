import React from 'react';

export interface InfinityShieldLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'splash';
  variant?: 'icon' | 'badge' | 'full';
  mode?: 'harmonic' | 'integrated';
  animated?: boolean;
}

export const InfinityShieldLogo: React.FC<InfinityShieldLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'icon',
}) => {
  const sizeMap = {
    xs: 20,
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
    splash: 96,
  };

  const dimension = sizeMap[size] || 36;

  const logoSvg = (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ClaimIntel Enterprise Healthcare Logo"
    >
      {/* Outer Clinical Shield Contour */}
      <path
        d="M24 4L40 10.5V23.5C40 33.2 33.2 41.2 24 44C14.8 41.2 8 33.2 8 23.5V10.5L24 4Z"
        className="fill-blue-600"
      />
      {/* Inner Inset Contrast Shield */}
      <path
        d="M24 7L37 12.3V23C37 31 31.5 37.8 24 40.2C16.5 37.8 11 31 11 23V12.3L24 7Z"
        className="fill-slate-900"
      />
      {/* Clinical Medical Cross Geometry */}
      <path
        d="M21 16H27V21H32V27H27V32H21V27H16V21H21V16Z"
        fill="white"
      />
      {/* Core Precision Accent Node */}
      <circle cx="24" cy="24" r="2.5" className="fill-blue-400" />
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-900 text-white shadow-xs border border-slate-800 transition-colors">
        {logoSvg}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-slate-900 text-white shadow-xs border border-slate-800 flex items-center justify-center">
          {logoSvg}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-slate-900">
              ClaimIntel
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded uppercase tracking-wider font-mono">
              RCM PLATFORM
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            U.S. Healthcare Claim Intelligence Platform
          </span>
        </div>
      </div>
    );
  }

  return logoSvg;
};
