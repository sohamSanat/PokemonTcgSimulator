import React from 'react';

export interface CodedSlabProps {
  /** Variant of the slab: 'front' (default), 'back' (for flipped card), or 'empty' (for slab preview/animation) */
  variant?: 'front' | 'back' | 'empty';
  /** Optional custom label element to render in the top certification well (y=16..72) */
  label?: React.ReactNode;
  /** If true and no label is passed, renders a default protective slab header in the top well */
  showDefaultLabel?: boolean;
  /** Optional grade text to show if showDefaultLabel is true (e.g. 'PSA GEM MT 10' or 'N/A') */
  gradeText?: string;
  /** Optional card title to show if showDefaultLabel is true */
  cardTitle?: string;
  /** Children to render inside the recessed card chamber or inside the slab container */
  children?: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/**
 * CodedSlab — High-definition, 100% pure vector/DOM coded protective acrylic slab case.
 * Replaces the rasterized/blurry external `/slab.svg` image with precise evenodd vector geometry
 * and crisp CSS/DOM styling so any card artwork underneath remains crystal clear at native GPU resolution.
 */
export const CodedSlab: React.FC<CodedSlabProps> = ({
  variant = 'front',
  label,
  showDefaultLabel = false,
  gradeText = 'N/A',
  cardTitle = 'UNGRADED AUTHENTIC',
  children,
  className = '',
  style,
}) => {
  return (
    <div
      className={`w-full h-full relative rounded-[10px] sm:rounded-[12px] overflow-hidden select-none ${className}`}
      style={{
        ...style,
      }}
    >
      {/* ── 1. Crystal Acrylic Outer Shell & Chamber Cutout (Pure Vector) ── */}
      <svg
        viewBox="0 0 400 560"
        className="absolute inset-0 w-full h-full block pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <defs>
          {/* Frosted Polycarbonate Shell Gradient */}
          <linearGradient id="codedSlabShell" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.96" />
            <stop offset="30%" stopColor="#0f172a" stopOpacity="0.96" />
            <stop offset="70%" stopColor="#0a0f1d" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#05070d" stopOpacity="0.98" />
          </linearGradient>

          {/* Outer Rim Frosted Glint */}
          <linearGradient id="codedSlabRimGlint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.48)" />
            <stop offset="25%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="75%" stopColor="rgba(0,0,0,0.45)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.32)" />
          </linearGradient>

          {/* Inner Recess Lip Dark Bevel */}
          <linearGradient id="codedSlabRecessBevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
          </linearGradient>

          {/* Top Label Chamber Foil Background */}
          <linearGradient id="codedSlabFoil" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#0f172a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.85" />
          </linearGradient>

          {/* Back Security Hologram Pattern */}
          <linearGradient id="codedSlabHolo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="30%" stopColor="#818cf8" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#c084fc" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Outer Acrylic Body with EXACT evenodd cutout of the label chamber (18, 16, 364, 56) and card chamber (18, 80, 364, 464).
            This ensures ZERO fill and ZERO opacity covering the card well! */}
        <path
          d="M 12 4 C 7.58 4 4 7.58 4 12 L 4 548 C 4 552.42 7.58 556 12 556 L 388 556 C 392.42 556 396 552.42 396 548 L 396 12 C 396 7.58 392.42 4 388 4 Z M 25 16 L 375 16 C 378.86 16 382 19.14 382 23 L 382 65 C 382 68.86 378.86 72 375 72 L 25 72 C 21.14 72 18 68.86 18 65 L 18 23 C 18 19.14 21.14 16 25 16 Z M 26 80 L 374 80 C 378.42 80 382 83.58 382 88 L 382 536 C 382 540.42 378.42 544 374 544 L 26 544 C 21.58 544 18 540.42 18 536 L 18 88 C 18 83.58 21.58 80 26 80 Z"
          fill="url(#codedSlabShell)"
          fillRule="evenodd"
          stroke="url(#codedSlabRimGlint)"
          strokeWidth="3"
        />

        {/* Top Certification Well Background (y=16..72) */}
        <rect
          x="18"
          y="16"
          width="364"
          height="56"
          rx="7"
          ry="7"
          fill={variant === 'back' ? 'url(#codedSlabHolo)' : 'url(#codedSlabFoil)'}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1.5"
        />

        {/* Card Chamber Inner Bevel Ring (y=80..544) — fill="none" so card is 100% visible and unblurred */}
        <rect
          x="18"
          y="80"
          width="364"
          height="464"
          rx="8"
          ry="8"
          fill="none"
          stroke="url(#codedSlabRecessBevel)"
          strokeWidth="3.5"
        />
        <rect
          x="19.5"
          y="81.5"
          width="361"
          height="461"
          rx="6.5"
          ry="6.5"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />

        {/* 4 Sonic-Welded Acrylic Corner Rivets */}
        <g stroke="rgba(255,255,255,0.45)" strokeWidth="1">
          {/* Top Left */}
          <circle cx="11" cy="11" r="3.5" fill="rgba(255,255,255,0.18)" />
          <circle cx="11" cy="11" r="1.2" fill="rgba(255,255,255,0.8)" />
          {/* Top Right */}
          <circle cx="389" cy="11" r="3.5" fill="rgba(255,255,255,0.18)" />
          <circle cx="389" cy="11" r="1.2" fill="rgba(255,255,255,0.8)" />
          {/* Bottom Left */}
          <circle cx="11" cy="549" r="3.5" fill="rgba(255,255,255,0.18)" />
          <circle cx="11" cy="549" r="1.2" fill="rgba(255,255,255,0.8)" />
          {/* Bottom Right */}
          <circle cx="389" cy="549" r="3.5" fill="rgba(255,255,255,0.18)" />
          <circle cx="389" cy="549" r="1.2" fill="rgba(255,255,255,0.8)" />
        </g>

        {/* Outer Frame Corner Reflections (Kept on outer shell only, never touching center card well) */}
        <path d="M 6 6 L 110 6 L 6 110 Z" fill="rgba(255,255,255,0.14)" pointerEvents="none" />
        <path d="M 394 6 L 394 110 L 290 6 Z" fill="rgba(255,255,255,0.08)" pointerEvents="none" />
      </svg>

      {/* ── 2. Top Certification Label Content Slot (y=16..72 => top: 2.86%, left: 4.5%, w: 91%, h: 10%) ── */}
      {label ? (
        <div
          style={{
            position: 'absolute',
            top: '2.86%',
            left: '4.5%',
            width: '91%',
            height: '10%',
            zIndex: 20,
          }}
          className="rounded-[7px] pointer-events-none flex items-center justify-between overflow-hidden"
        >
          {label}
        </div>
      ) : showDefaultLabel ? (
        <div
          style={{
            position: 'absolute',
            top: '2.86%',
            left: '4.5%',
            width: '91%',
            height: '10%',
            zIndex: 20,
          }}
          className="rounded-[7px] px-2.5 py-1 flex items-center justify-between overflow-hidden pointer-events-none select-none bg-[#0a0e18]/95 border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        >
          <div className="flex flex-col leading-tight min-w-0 pr-1">
            <span className="text-[6.5px] font-mono font-bold tracking-widest text-slate-300 uppercase truncate">
              ANTIGRAVITY ENCASEMENT CO.
            </span>
            <span className="text-[8.5px] font-black tracking-wide text-white uppercase truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {cardTitle}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-4 rounded-[2px] bg-slate-200/90 border border-slate-400 flex flex-col items-center justify-center leading-none">
              <span className="text-[4.5px] font-black text-slate-800 uppercase">Grade</span>
              <span className="text-[7.5px] font-black text-slate-900 uppercase truncate px-0.5">{gradeText}</span>
            </div>
          </div>
        </div>
      ) : variant === 'back' ? (
        <div
          style={{
            position: 'absolute',
            top: '2.86%',
            left: '4.5%',
            width: '91%',
            height: '10%',
            zIndex: 20,
          }}
          className="rounded-[7px] px-3 py-1 flex items-center justify-between overflow-hidden pointer-events-none select-none bg-slate-900/90 border border-white/20"
        >
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black tracking-widest text-sky-400 uppercase">
              🛡️ OFFICIAL REGISTRY SLAB
            </span>
          </div>
          <span className="text-[7px] font-mono font-bold text-slate-300 tracking-wider">
            SECURITY CERTIFIED
          </span>
        </div>
      ) : null}

      {/* ── 3. Recessed Card Chamber / Children Slot (y=80..544 => top: 14.3%, left: 4.5%, w: 91%, h: 82.8%) ── */}
      {children && (
        <div
          style={{
            position: 'absolute',
            top: '14.3%',
            left: '4.5%',
            width: '91%',
            height: '82.8%',
            zIndex: 5,
          }}
          className="rounded-[6px] overflow-hidden flex items-center justify-center"
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default React.memo(CodedSlab);
