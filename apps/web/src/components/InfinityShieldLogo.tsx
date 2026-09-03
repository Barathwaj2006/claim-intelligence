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
  mode = 'harmonic',
  animated = false,
}) => {
  const sizeMap = {
    xs: { width: 34, height: 20 },
    sm: { width: 48, height: 28 },
    md: { width: 68, height: 40 },
    lg: { width: 96, height: 56 },
    xl: { width: 160, height: 92 },
    splash: { width: 440, height: 254 },
  };

  const { width, height } = sizeMap[size];

  /*
   * =========================================================================
   * MATHEMATICAL ALIGNMENT CONSTANTS (viewBox="0 0 520 300"):
   * - Horizontal Baseline: Y = 150 (Shared by Left Loop, Crossover, Right Loop & Shield Waist)
   * - Center Crossover: (240, 150)
   * - Left Loop Center: (125, 150) -> Radius Outer: 66, Radius Inner: 52
   * - Right Shield & Right Loop Center: (355, 150)
   * - Symmetry Check: (240 - 125) = 115px === (355 - 240) = 115px (Exact Equidistance)
   * - Vertical Symmetry: Shield Peak Y=42 (108px above center), Shield Apex Y=258 (108px below center)
   * - Horizontal Symmetry: Left Flank X=269 (86px left of 355), Right Flank X=441 (86px right of 355)
   * =========================================================================
   */

  // 1. HARMONIC ALIGNMENT PATHS
  // Outer Shield: Symmetrical heater shield framing the right loop with 14px concentric nesting
  const harmonicShieldOuter = `
    M 355 42
    L 441 78
    L 441 150
    C 441 204, 408 244, 355 258
    C 302 244, 269 204, 269 150
    L 269 78
    Z
  `;

  // Inner Shield (14px concentric interior offset)
  const harmonicShieldInner = `
    M 355 56
    L 427 88
    L 427 150
    C 427 196, 398 232, 355 244
    C 312 232, 283 196, 283 150
    L 283 88
    Z
  `;

  // Outer Infinity Loop: Completely closed, continuous ribbon whose right downward curve aligns seamlessly with the shield tip at (355, 258)
  const harmonicInfinityOuter = `
    M 355 258
    C 302 244, 275 186, 240 150
    C 205 114, 170 84, 125 84
    C 88.55 84, 59 113.55, 59 150
    C 59 186.45, 88.55 216, 125 216
    C 170 216, 205 186, 240 150
    C 275 114, 310 84, 355 84
    C 400 84, 441 110, 441 150
    C 441 204, 408 244, 355 258
    Z
  `;

  // Inner Infinity Loop: Completely closed, continuous 14px concentric interior ribbon syncing at inner shield tip (355, 244)
  const harmonicInfinityInner = `
    M 355 244
    C 312 232, 275 180, 240 150
    C 205 120, 170 98, 125 98
    C 96.28 98, 73 121.28, 73 150
    C 73 178.72, 96.28 202, 125 202
    C 170 202, 205 180, 240 150
    C 275 120, 310 98, 355 98
    C 390 98, 427 118, 427 150
    C 427 196, 398 232, 355 244
    Z
  `;

  // 2. INTEGRATED CREST PATHS (Continuous ribbon syncing down curve directly with shield tip)
  const integratedCrownOuter = `
    M 269 150 L 269 78 L 355 42 L 441 78 L 441 150
  `;
  const integratedCrownInner = `
    M 283 150 L 283 88 L 355 56 L 427 88 L 427 150
  `;
  const integratedLoopOuter = `
    M 355 258
    C 302 244, 275 186, 240 150
    C 205 114, 170 84, 125 84
    C 88.55 84, 59 113.55, 59 150
    C 59 186.45, 88.55 216, 125 216
    C 170 216, 205 186, 240 150
    C 275 114, 310 84, 355 84
    C 400 84, 441 110, 441 150
    C 441 204, 408 244, 355 258
    Z
  `;
  const integratedLoopInner = `
    M 355 244
    C 312 232, 275 180, 240 150
    C 205 120, 170 98, 125 98
    C 96.28 98, 73 121.28, 73 150
    C 73 178.72, 96.28 202, 125 202
    C 170 202, 205 180, 240 150
    C 275 120, 310 98, 355 98
    C 390 98, 427 118, 427 150
    C 427 196, 398 232, 355 244
    Z
  `;

  const logoSvg = (
    <svg
      viewBox="0 0 520 300"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`overflow-visible transition-transform duration-300 ${className}`}
    >
      <defs>
        {/* Luxury Gold Metallic Gradient */}
        <linearGradient id="goldGradientBase" x1="60" y1="40" x2="460" y2="260" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DFBA73" />
          <stop offset="25%" stopColor="#FFF2BF" />
          <stop offset="50%" stopColor="#C59E4E" />
          <stop offset="75%" stopColor="#E9CA87" />
          <stop offset="90%" stopColor="#A88132" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>

        {/* Soft Golden Glow Filter */}
        <filter id="softGoldGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {mode === 'harmonic' ? (
        <>
          {/* Outer Shield Frame */}
          <path
            d={harmonicShieldOuter}
            stroke="url(#goldGradientBase)"
            strokeWidth="6"
            strokeLinejoin="round"
            filter="url(#softGoldGlow)"
            className={animated ? 'animate-logo-draw' : ''}
          />

          {/* Inner Shield Frame */}
          <path
            d={harmonicShieldInner}
            stroke="url(#goldGradientBase)"
            strokeWidth="4.5"
            strokeLinejoin="round"
            filter="url(#softGoldGlow)"
            className={animated ? 'animate-logo-draw' : ''}
          />

          {/* Outer Infinity Ribbon */}
          <path
            d={harmonicInfinityOuter}
            stroke="url(#goldGradientBase)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softGoldGlow)"
            className={animated ? 'animate-logo-draw' : ''}
          />

          {/* Inner Infinity Ribbon */}
          <path
            d={harmonicInfinityInner}
            stroke="url(#goldGradientBase)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softGoldGlow)"
            className={animated ? 'animate-logo-draw' : ''}
          />
        </>
      ) : (
        <>
          {/* Integrated Crown Outer */}
          <path
            d={integratedCrownOuter}
            stroke="url(#goldGradientBase)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softGoldGlow)"
            className={animated ? 'animate-logo-draw' : ''}
          />

          {/* Integrated Crown Inner */}
          <path
            d={integratedCrownInner}
            stroke="url(#goldGradientBase)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softGoldGlow)"
            className={animated ? 'animate-logo-draw' : ''}
          />

          {/* Integrated Loop Outer */}
          <path
            d={integratedLoopOuter}
            stroke="url(#goldGradientBase)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softGoldGlow)"
            className={animated ? 'animate-logo-draw' : ''}
          />

          {/* Integrated Loop Inner */}
          <path
            d={integratedLoopInner}
            stroke="url(#goldGradientBase)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softGoldGlow)"
            className={animated ? 'animate-logo-draw' : ''}
          />
        </>
      )}
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div className="inline-flex items-center justify-center px-2 py-1.5 rounded-xl bg-[#141416] border border-amber-500/30 shadow-md shadow-black/50 hover:border-amber-400/60 hover:shadow-amber-500/15 transition-all cursor-pointer">
        {logoSvg}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="flex items-center gap-3">
        <div className="px-2 py-1.5 rounded-xl bg-[#141416] border border-amber-500/35 shadow-md shadow-black/50 flex items-center justify-center">
          {logoSvg}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black tracking-wider text-slate-900">
              AEGIS
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-500/30 rounded uppercase tracking-wider font-mono">
              RCM PLATFORM
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            U.S. Healthcare Claim Intelligence
          </span>
        </div>
      </div>
    );
  }

  return logoSvg;
};
