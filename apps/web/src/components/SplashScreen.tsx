import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, X, Shield, ArrowRight, Check, SlidersHorizontal } from 'lucide-react';

interface SplashScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isOpen, onClose, onComplete }) => {
  const [animationKey, setAnimationKey] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [activeMode, setActiveMode] = useState<'harmonic' | 'integrated'>('harmonic');
  const [showAxes, setShowAxes] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsDone(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsDone(true);
      if (onComplete) onComplete();
    }, 2200);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, animationKey, activeMode, onClose, onComplete]);

  const handleReplay = () => {
    setIsDone(false);
    setAnimationKey((prev) => prev + 1);
  };

  if (!isOpen) return null;

  /*
   * =========================================================================
   * MATHEMATICAL ALIGNMENT (viewBox="0 0 520 300"):
   * - Center Crossover: (240, 150)
   * - Left Loop Center: (125, 150) -> R_outer: 66, R_inner: 52
   * - Right Shield & Right Loop Center: (355, 150)
   * - Symmetry: |240 - 125| = 115px === |355 - 240| = 115px (Exact Equidistance)
   * - Shield Peak Y=42 (108px above center), Shield Apex Y=258 (108px below center)
   * - Shield Left Flank X=269 (86px left), Right Flank X=441 (86px right)
   * =========================================================================
   */

  // 1. HARMONIC ALIGNMENT PATHS
  const harmonicShieldOuter = `
    M 355 42
    L 441 78
    L 441 150
    C 441 204, 408 244, 355 258
    C 302 244, 269 204, 269 150
    L 269 78
    Z
  `;

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

  return (
    <div
      id="splash-screen-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes drawOuterRibbon {
          0% {
            stroke-dashoffset: 1200;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          99% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            stroke-dasharray: none;
            opacity: 1;
          }
        }
        @keyframes drawInnerRibbon {
          0% {
            stroke-dashoffset: 1100;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          99% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            stroke-dasharray: none;
            opacity: 1;
          }
        }
        @keyframes drawShieldOuter {
          0% {
            stroke-dashoffset: 750;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          99% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            stroke-dasharray: none;
            opacity: 1;
          }
        }
        @keyframes drawShieldInner {
          0% {
            stroke-dashoffset: 650;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          99% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            stroke-dasharray: none;
            opacity: 1;
          }
        }
      `}</style>

      {/* Main Luxury Presentation Card */}
      <div
        id="splash-card-container"
        className="relative w-full max-w-2xl bg-[#141416] border border-amber-500/35 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black overflow-hidden flex flex-col items-center text-center"
      >
        {/* Subtle Background Mesh */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient Warm Golden Backlight */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Controls */}
        <div className="w-full flex items-center justify-between z-10 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>Aegis Brand System</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[11px] font-medium text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('harmonic');
                  handleReplay();
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeMode === 'harmonic'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'hover:text-slate-200'
                }`}
              >
                Harmonic Alignment
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('integrated');
                  handleReplay();
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeMode === 'integrated'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'hover:text-slate-200'
                }`}
              >
                Integrated Crest
              </button>
            </div>

            {/* Toggle Axes Button */}
            <button
              id="toggle-axes-btn"
              type="button"
              onClick={() => setShowAxes(!showAxes)}
              title="Toggle Symmetry & Alignment Guidelines"
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                showAxes
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            <button
              id="replay-generation-btn"
              type="button"
              onClick={handleReplay}
              title="Replay Vector Generation"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Replay</span>
            </button>

            <button
              id="close-splash-btn"
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Vector Canvas */}
        <div className="relative z-10 my-2 flex items-center justify-center">
          <svg
            key={animationKey}
            viewBox="0 0 520 300"
            className="w-80 h-48 sm:w-110 sm:h-64 drop-shadow-[0_10px_25px_rgba(212,175,55,0.25)] overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="splashGoldGrad" x1="60" y1="40" x2="460" y2="260" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#DFBA73" />
                <stop offset="25%" stopColor="#FFF2BF" />
                <stop offset="50%" stopColor="#C59E4E" />
                <stop offset="75%" stopColor="#E9CA87" />
                <stop offset="90%" stopColor="#A88132" />
                <stop offset="100%" stopColor="#D4AF37" />
              </linearGradient>

              <filter id="splashGoldGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Optional Alignment Guidelines */}
            {showAxes && (
              <g opacity="0.65">
                {/* Horizontal Baseline */}
                <line x1="20" y1="150" x2="500" y2="150" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                {/* Left Center X=125 */}
                <line x1="125" y1="40" x2="125" y2="260" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                {/* Crossover X=240 */}
                <line x1="240" y1="40" x2="240" y2="260" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" />
                {/* Shield & Right Loop Center X=355 */}
                <line x1="355" y1="20" x2="355" y2="280" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />

                {/* Synchronized Tip & Down-Curve Contact Point (355, 258) */}
                <circle cx="355" cy="258" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="355" cy="244" r="3" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                <line x1="355" y1="258" x2="390" y2="280" stroke="#10b981" strokeWidth="1" />
                <text x="395" y="284" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  Tip &amp; Down-Curve Sync (355, 258)
                </text>

                {/* Concentric alignment rings on right center */}
                <circle cx="355" cy="150" r="66" stroke="#10b981" strokeWidth="0.75" strokeDasharray="2 2" fill="none" />
                <circle cx="125" cy="150" r="66" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="2 2" fill="none" />
              </g>
            )}

            {activeMode === 'harmonic' ? (
              <>
                {/* Outer Shield Frame (Aligned with Right Loop Center X=355, Y=150) */}
                <path
                  d={harmonicShieldOuter}
                  stroke="url(#splashGoldGrad)"
                  strokeWidth="6"
                  strokeLinejoin="round"
                  filter="url(#splashGoldGlowFilter)"
                  style={{
                    strokeDasharray: 750,
                    animation: 'drawShieldOuter 2s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                  }}
                />

                {/* Inner Shield Frame */}
                <path
                  d={harmonicShieldInner}
                  stroke="url(#splashGoldGrad)"
                  strokeWidth="4.5"
                  strokeLinejoin="round"
                  filter="url(#splashGoldGlowFilter)"
                  style={{
                    strokeDasharray: 650,
                    animation: 'drawShieldInner 2s cubic-bezier(0.25, 1, 0.5, 1) 0.1s forwards',
                  }}
                />

                {/* Outer Infinity Loop (Horizontal level Y=150, Left Center 125, Right Center 355) */}
                <path
                  d={harmonicInfinityOuter}
                  stroke="url(#splashGoldGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#splashGoldGlowFilter)"
                  style={{
                    strokeDasharray: 1200,
                    animation: 'drawOuterRibbon 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                  }}
                />

                {/* Inner Infinity Loop */}
                <path
                  d={harmonicInfinityInner}
                  stroke="url(#splashGoldGrad)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#splashGoldGlowFilter)"
                  style={{
                    strokeDasharray: 1100,
                    animation: 'drawInnerRibbon 2.2s cubic-bezier(0.25, 1, 0.5, 1) 0.12s forwards',
                  }}
                />
              </>
            ) : (
              <>
                {/* Integrated Crown Outer */}
                <path
                  d={integratedCrownOuter}
                  stroke="url(#splashGoldGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#splashGoldGlowFilter)"
                  style={{
                    strokeDasharray: 450,
                    animation: 'drawShieldOuter 2s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                  }}
                />

                {/* Integrated Crown Inner */}
                <path
                  d={integratedCrownInner}
                  stroke="url(#splashGoldGrad)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#splashGoldGlowFilter)"
                  style={{
                    strokeDasharray: 400,
                    animation: 'drawShieldInner 2s cubic-bezier(0.25, 1, 0.5, 1) 0.1s forwards',
                  }}
                />

                {/* Integrated Loop Outer */}
                <path
                  d={integratedLoopOuter}
                  stroke="url(#splashGoldGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#splashGoldGlowFilter)"
                  style={{
                    strokeDasharray: 1200,
                    animation: 'drawOuterRibbon 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                  }}
                />

                {/* Integrated Loop Inner */}
                <path
                  d={integratedLoopInner}
                  stroke="url(#splashGoldGrad)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#splashGoldGlowFilter)"
                  style={{
                    strokeDasharray: 1100,
                    animation: 'drawInnerRibbon 2.2s cubic-bezier(0.25, 1, 0.5, 1) 0.12s forwards',
                  }}
                />
              </>
            )}
          </svg>
        </div>

        {/* Alignment Metrics Telemetry Card */}
        <div className="z-10 mt-3 p-2.5 rounded-xl bg-black/50 border border-amber-500/20 max-w-lg w-full flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-amber-400 font-bold">AXIS:</span>
            <span>X_left: 125</span>
            <span className="text-slate-600">|</span>
            <span>X_cross: 240</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">X_shield: 355</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-amber-400 font-bold">TIP SYNC:</span>
            <span className="text-emerald-400 font-bold">(355, 258) ✓ 100% FLUSH</span>
          </div>
        </div>

        {/* Brand Name & Subtitle */}
        <div className="z-10 mt-4 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl font-black tracking-widest text-slate-100 font-mono">
              AEGIS
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-widest font-mono">
              CLAIMINTEL
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-medium">
            Pre-Submission Denial Prevention & Revenue Cycle Intelligence Platform
          </p>
        </div>

        {/* Status Verification */}
        <div className="z-10 mt-4 flex items-center justify-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all duration-500 ${
              isDone
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            {isDone ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Infinity & Shield Topology 100% Aligned • Ready</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Calibrating Dual-Contour Harmonized Vectors...</span>
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="z-10 mt-5">
          <button
            id="splash-enter-btn"
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Enter Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
