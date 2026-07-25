import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Box, ShieldCheck, Zap, Layers } from 'lucide-react';

export interface ProceduralBoosterBoxProps {
  type: 'half' | 'full' | 'pack';
  setName: string;
  setId: string;
  logoUrl?: string | null;
  packArtUrl?: string | null;
  packCount: number;
  language?: 'en' | 'ja';
  className?: string;
}

export const ProceduralBoosterBox: React.FC<ProceduralBoosterBoxProps> = ({
  type,
  setName,
  setId,
  logoUrl,
  packArtUrl,
  packCount,
  language = 'en',
  className = ''
}) => {
  const isJapanese = language === 'ja' || setId.endsWith('_ja');
  const isFullBox = type === 'full';
  const isHalfBox = type === 'half';

  // Choose fallback pack art if none provided
  const fallbackArt = '/packArts/Japanese-XY/Wild-Blaze/Screenshot 2026-07-17 110058.png';
  const artSrc = packArtUrl || fallbackArt;
  const logoSrc = logoUrl || `/setLogos/${setId.replace(/_ja$/i, '')}_ja.png`;

  if (type === 'pack') {
    return (
      <div className={`relative flex flex-col items-center justify-center ${className}`}>
        {/* Single Booster Pack 3D Visual */}
        <div className="relative w-24 sm:w-28 h-36 sm:h-44 rounded-xl overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.7)] border border-amber-400/40 group hover:scale-105 transition-transform duration-300">
          <img src={artSrc} alt={setName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-white/20 pointer-events-none" />
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 border border-amber-400/40 text-[9px] font-black text-amber-300">
            1 PACK
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* 3D Perspective Box Container */}
      <div className="relative group cursor-pointer perspective-[1000px]">
        {/* Ambient Glow */}
        <div className={`absolute -inset-3 sm:-inset-4 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
          isFullBox
            ? 'bg-gradient-to-r from-amber-500/40 via-yellow-400/30 to-amber-600/40'
            : 'bg-gradient-to-r from-purple-500/40 via-indigo-400/30 to-purple-600/40'
        }`} />

        {/* 3D Booster Box Frame */}
        <div className={`relative transform-style-3d transition-transform duration-500 group-hover:rotate-y-[-6deg] group-hover:rotate-x-[4deg] group-hover:scale-[1.03] ${
          isFullBox ? 'w-44 sm:w-56 h-48 sm:h-56' : 'w-32 sm:w-40 h-48 sm:h-56'
        }`}>
          
          {/* Top Arch Pop-Up Header Display Panel (Like real TCG Boxes) */}
          <div className={`absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center justify-center rounded-t-2xl border-t border-x overflow-hidden shadow-lg ${
            isFullBox
              ? 'w-[92%] h-12 sm:h-14 bg-gradient-to-b from-[#2a1b08] via-[#1a1205] to-[#0d0903] border-amber-400/60'
              : 'w-[90%] h-10 sm:h-12 bg-gradient-to-b from-[#1b1528] via-[#120d1c] to-[#0a0710] border-purple-400/60'
          }`}>
            {/* Background artwork shimmer inside top arch */}
            <img src={artSrc} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            {/* Set Logo in Arch Header */}
            {logoSrc ? (
              <img src={logoSrc} alt={setName} className="relative z-10 max-h-6 sm:max-h-8 max-w-[85%] object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" />
            ) : (
              <span className="relative z-10 text-[9px] sm:text-[10px] font-black text-amber-300 tracking-wider uppercase truncate max-w-[90%]">
                {setName}
              </span>
            )}
            
            {/* Seal Ribbon Badge */}
            <div className="relative z-10 mt-0.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[7px] sm:text-[8px] font-extrabold text-amber-200">
              <ShieldCheck className="w-2.5 h-2.5 text-amber-300" />
              <span>FACTORY SEALED</span>
            </div>
          </div>

          {/* Open Top Display Box Face (Showing stacked booster pack crimped tops inside!) */}
          <div className="absolute top-2 left-0 right-0 z-10 flex justify-center gap-1 sm:gap-1.5 px-2">
            {isFullBox ? (
              /* Two columns of stacked booster packs */
              <>
                <div className="flex-1 h-14 sm:h-16 rounded-t-lg bg-black/90 border-t border-x border-amber-500/30 overflow-hidden relative shadow-inner">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={`stack-left-${idx}`}
                      className="absolute left-0 right-0 h-3 sm:h-3.5 border-b border-amber-400/20 bg-gradient-to-r from-amber-500/30 via-yellow-300/20 to-amber-600/30 shadow-sm"
                      style={{ top: `${idx * 6}px` }}
                    >
                      <div className="w-full h-[1px] bg-amber-300/40" />
                    </div>
                  ))}
                  <img src={artSrc} alt="" className="w-full h-full object-cover opacity-60" />
                </div>
                <div className="flex-1 h-14 sm:h-16 rounded-t-lg bg-black/90 border-t border-x border-amber-500/30 overflow-hidden relative shadow-inner">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={`stack-right-${idx}`}
                      className="absolute left-0 right-0 h-3 sm:h-3.5 border-b border-amber-400/20 bg-gradient-to-r from-amber-500/30 via-yellow-300/20 to-amber-600/30 shadow-sm"
                      style={{ top: `${idx * 6}px` }}
                    >
                      <div className="w-full h-[1px] bg-amber-300/40" />
                    </div>
                  ))}
                  <img src={artSrc} alt="" className="w-full h-full object-cover opacity-60" />
                </div>
              </>
            ) : (
              /* Single column of stacked booster packs */
              <div className="w-full h-14 sm:h-16 rounded-t-lg bg-black/90 border-t border-x border-purple-500/30 overflow-hidden relative shadow-inner">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`stack-single-${idx}`}
                    className="absolute left-0 right-0 h-3 sm:h-3.5 border-b border-purple-400/20 bg-gradient-to-r from-purple-500/30 via-indigo-300/20 to-purple-600/30 shadow-sm"
                    style={{ top: `${idx * 6}px` }}
                  >
                    <div className="w-full h-[1px] bg-purple-300/40" />
                  </div>
                ))}
                <img src={artSrc} alt="" className="w-full h-full object-cover opacity-60" />
              </div>
            )}
          </div>

          {/* Main Front Body Face of Booster Box */}
          <div className={`absolute bottom-0 left-0 right-0 z-20 rounded-b-2xl border-b border-x overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.8)] ${
            isFullBox
              ? 'h-44 sm:h-52 bg-gradient-to-b from-[#1a1307] via-[#120d04] to-[#080501] border-amber-400/50'
              : 'h-44 sm:h-52 bg-gradient-to-b from-[#160f24] via-[#0d0917] to-[#06040b] border-purple-400/50'
          }`}>
            {/* Box Front Artwork Wrap */}
            <img src={artSrc} alt={setName} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

            {/* Lower Lip Box Graphics & Logo */}
            <div className="absolute bottom-0 inset-x-0 p-2 sm:p-3 flex flex-col items-center text-center bg-black/80 backdrop-blur-md border-t border-white/10">
              {logoSrc && (
                <img src={logoSrc} alt="" className="h-6 sm:h-8 max-w-[90%] object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-1" />
              )}
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  isFullBox ? 'bg-amber-500 text-black shadow-md' : 'bg-purple-500 text-white shadow-md'
                }`}>
                  {isFullBox ? 'FULL BOOSTER BOX' : 'HALF BOOSTER BOX'}
                </span>
                <span className="text-[10px] font-extrabold text-amber-300 bg-black/60 px-1.5 py-0.5 rounded border border-amber-400/30">
                  {packCount} PACKS
                </span>
              </div>
            </div>

            {/* 3D Box Edge Highlights */}
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />
          </div>

          {/* Side 3D Depth Face (Perspective Box Thickness) */}
          <div className={`absolute top-2 bottom-0 -right-4 w-4 rounded-r-lg transform rotate-y-90 origin-left opacity-80 pointer-events-none ${
            isFullBox ? 'bg-amber-900/90 border-r border-amber-500/40' : 'bg-purple-900/90 border-r border-purple-500/40'
          }`} />
        </div>
      </div>
    </div>
  );
};
