import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Sparkles, Scissors, Zap } from 'lucide-react';

export interface ProceduralBoosterBoxProps {
  type: 'half' | 'full' | 'pack';
  setName: string;
  setId: string;
  logoUrl?: string | null;
  packArtUrl?: string | null;
  packCount: number;
  language?: 'en' | 'ja';
  stage?: 'seal' | 'slicing' | 'opening' | 'ready';
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
  stage = 'seal',
  className = ''
}) => {
  const isJapanese = language === 'ja' || setId.endsWith('_ja');
  const isFullBox = type === 'full';
  const isOpen = stage === 'opening' || stage === 'ready';

  const fallbackArt = '/packArts/Japanese-XY/Wild-Blaze/Screenshot 2026-07-17 110058.png';
  const artSrc = packArtUrl || fallbackArt;
  const logoSrc = logoUrl || `/setLogos/${setId.replace(/_ja$/i, '')}_ja.png`;

  if (type === 'pack') {
    return (
      <div className={`relative flex flex-col items-center justify-center pt-2 sm:pt-4 ${className}`}>
        <div className="relative w-20 sm:w-28 h-28 sm:h-40 rounded-xl overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.7)] border border-amber-400/40 group hover:scale-105 transition-transform duration-300">
          <img src={artSrc} alt={setName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-white/20 pointer-events-none" />
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 border border-amber-400/40 text-[8px] sm:text-[9px] font-black text-amber-300">
            1 PACK
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center justify-center pt-8 sm:pt-12 ${className}`}>
      {/* 3D Perspective Container */}
      <div className="relative group cursor-pointer perspective-[1200px]">
        
        {/* Glowing Ambient Light Sphere */}
        <div className={`absolute -inset-4 sm:-inset-8 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-all duration-700 pointer-events-none ${
          isOpen
            ? 'bg-gradient-to-t from-amber-500/50 via-yellow-400/40 to-cyan-400/30 scale-125'
            : isFullBox
            ? 'bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-600/30'
            : 'bg-gradient-to-r from-purple-500/30 via-indigo-400/20 to-purple-600/30'
        }`} />

        {/* Outer 3D Booster Box Frame */}
        <motion.div
          animate={
            isOpen
              ? { rotateX: 12, rotateY: -6, y: -6 }
              : stage === 'slicing'
              ? { scale: [1, 1.03, 1], rotateZ: [-1, 1, 0] }
              : { rotateX: 6, rotateY: -8, y: [0, -6, 0] }
          }
          transition={
            isOpen
              ? { duration: 0.6 }
              : { y: { repeat: Infinity, duration: 4, ease: 'easeInOut' } }
          }
          className={`relative transform-style-3d transition-all duration-500 ${
            isFullBox ? 'w-36 sm:w-60 h-36 sm:h-52' : 'w-28 sm:w-44 h-36 sm:h-52'
          }`}
        >
          {/* Laser Cutter Spark Effects during Slicing */}
          {stage === 'slicing' && (
            <motion.div
              initial={{ left: '0%', opacity: 0 }}
              animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
              className="absolute -top-1 z-50 h-1.5 bg-gradient-to-r from-transparent via-cyan-300 to-amber-300 shadow-[0_0_20px_#00f0ff,0_0_35px_#f59e0b] rounded-full w-20 pointer-events-none"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[1px] shadow-[0_0_20px_#ffffff]" />
            </motion.div>
          )}

          {/* Shrinkwrap Foil Plastic Wrap Overlay (Tears Open when sliced) */}
          <AnimatePresence>
            {(stage === 'seal' || stage === 'slicing') && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.08 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 z-40 rounded-xl pointer-events-none overflow-hidden border border-white/30 bg-gradient-to-tr from-white/10 via-transparent to-white/20 backdrop-blur-[0.5px] shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]"
              >
                {/* Shiny Diagonal Plastic Sheen */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-pulse" />
                
                {/* Factory Sealed Ribbon Tape across box */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-amber-500/90 text-black font-black text-[7px] sm:text-[9px] uppercase tracking-widest py-0.5 border-y border-amber-300 flex items-center justify-center gap-1 shadow-md">
                  <ShieldCheck className="w-3 h-3 text-black fill-black" />
                  <span>FACTORY SEALED POKÉMON TCG</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D TOP LID PANEL (Folds Backwards on Open!) */}
          <motion.div
            animate={
              isOpen
                ? { rotateX: -130, y: -4 }
                : { rotateX: 0, y: 0 }
            }
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ transformOrigin: 'top center' }}
            className={`absolute -top-6 sm:-top-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center justify-center rounded-t-xl sm:rounded-t-2xl border-t border-x overflow-hidden shadow-2xl ${
              isFullBox
                ? 'w-[94%] h-9 sm:h-14 bg-gradient-to-b from-[#2a1b08] via-[#1a1205] to-[#0d0903] border-amber-400/80'
                : 'w-[92%] h-8 sm:h-12 bg-gradient-to-b from-[#1b1528] via-[#120d1c] to-[#0a0710] border-purple-400/80'
            }`}
          >
            {/* Lid Cover Artwork Shimmer */}
            <img src={artSrc} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 filter blur-[0.5px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            
            {/* Set Logo in Arch Header */}
            {logoSrc ? (
              <img src={logoSrc} alt={setName} className="relative z-10 max-h-5 sm:max-h-8 max-w-[88%] object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" />
            ) : (
              <span className="relative z-10 text-[8px] sm:text-[10px] font-black text-amber-300 tracking-wider uppercase truncate max-w-[90%]">
                {setName}
              </span>
            )}
          </motion.div>

          {/* INNER BOX CHAMBER (Holds Foil Packs & Erupts Light when Open) */}
          <div className="absolute top-0 bottom-0 left-0 right-0 z-10 flex justify-center gap-1.5 px-1.5 sm:px-3 pt-2 pb-12 sm:pb-16 overflow-hidden bg-[#06040a] rounded-t-xl border-t border-x border-amber-500/30">
            
            {/* Ray of Erupting Light when Opened */}
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0, 1, 0.6], scaleY: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-400/40 via-yellow-300/20 to-transparent blur-md pointer-events-none z-20"
              />
            )}

            {isFullBox ? (
              /* Two columns of booster packs */
              <>
                {/* Left Stack */}
                <div className="flex-1 h-full rounded-t-lg bg-[#0a0703] border-t border-x border-amber-400/40 relative shadow-inner overflow-hidden flex flex-col justify-end p-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <motion.div
                      key={`stack-left-${idx}`}
                      animate={
                        isOpen
                          ? { y: -20 - idx * 4, rotateZ: -2 }
                          : { y: 0, rotateZ: 0 }
                      }
                      transition={{ duration: 0.6, delay: idx * 0.05 }}
                      className="absolute inset-x-0 bottom-0 rounded-t-md overflow-hidden border-t border-white/50 shadow-lg"
                      style={{
                        height: `${88 - idx * 6}%`,
                        zIndex: idx + 1,
                        opacity: 0.95 + idx * 0.01
                      }}
                    >
                      {/* Metallic Foil Crimp Header */}
                      <div className="h-2.5 sm:h-3.5 bg-gradient-to-r from-slate-300 via-white to-slate-400 border-b border-amber-300/40 flex items-center justify-between px-1 shadow-sm">
                        <div className="w-full h-[1.5px] bg-slate-600/50" />
                      </div>
                      <img src={artSrc} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10" />
                    </motion.div>
                  ))}
                </div>

                {/* Right Stack */}
                <div className="flex-1 h-full rounded-t-lg bg-[#0a0703] border-t border-x border-amber-400/40 relative shadow-inner overflow-hidden flex flex-col justify-end p-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <motion.div
                      key={`stack-right-${idx}`}
                      animate={
                        isOpen
                          ? { y: -20 - idx * 4, rotateZ: 2 }
                          : { y: 0, rotateZ: 0 }
                      }
                      transition={{ duration: 0.6, delay: idx * 0.05 }}
                      className="absolute inset-x-0 bottom-0 rounded-t-md overflow-hidden border-t border-white/50 shadow-lg"
                      style={{
                        height: `${88 - idx * 6}%`,
                        zIndex: idx + 1,
                        opacity: 0.95 + idx * 0.01
                      }}
                    >
                      {/* Metallic Foil Crimp Header */}
                      <div className="h-2.5 sm:h-3.5 bg-gradient-to-r from-slate-300 via-white to-slate-400 border-b border-amber-300/40 flex items-center justify-between px-1 shadow-sm">
                        <div className="w-full h-[1.5px] bg-slate-600/50" />
                      </div>
                      <img src={artSrc} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10" />
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              /* Single column of booster packs */
              <div className="w-full h-full rounded-t-lg bg-[#07050d] border-t border-x border-purple-400/40 relative shadow-inner overflow-hidden flex flex-col justify-end p-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <motion.div
                    key={`stack-single-${idx}`}
                    animate={
                      isOpen
                        ? { y: -22 - idx * 4 }
                        : { y: 0 }
                    }
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                    className="absolute inset-x-0 bottom-0 rounded-t-md overflow-hidden border-t border-white/50 shadow-lg"
                    style={{
                      height: `${88 - idx * 6}%`,
                      zIndex: idx + 1,
                      opacity: 0.95 + idx * 0.01
                    }}
                  >
                    {/* Metallic Foil Crimp Header */}
                    <div className="h-2.5 sm:h-3.5 bg-gradient-to-r from-slate-300 via-white to-slate-400 border-b border-purple-300/40 flex items-center justify-between px-1 shadow-sm">
                      <div className="w-full h-[1.5px] bg-slate-600/50" />
                    </div>
                    <img src={artSrc} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* LOWER FRONT LIP BOX FACE (Covering bottom lip like real booster boxes) */}
          <div className={`absolute bottom-0 left-0 right-0 z-20 rounded-b-xl sm:rounded-b-2xl border-b border-x overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.9)] ${
            isFullBox
              ? 'h-16 sm:h-24 bg-gradient-to-b from-[#1a1307] via-[#120d04] to-[#080501] border-amber-400/70'
              : 'h-16 sm:h-24 bg-gradient-to-b from-[#160f24] via-[#0d0917] to-[#06040b] border-purple-400/70'
          }`}>
            <img src={artSrc} alt={setName} className="w-full h-full object-cover opacity-85" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

            {/* Lower Lip Graphics & Logo Badge */}
            <div className="absolute bottom-0 inset-x-0 p-1 sm:p-2 flex flex-col items-center text-center bg-black/85 backdrop-blur-md border-t border-white/15">
              {logoSrc && (
                <img src={logoSrc} alt="" className="h-4 sm:h-7 max-w-[92%] object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-0.5" />
              )}
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-black uppercase tracking-wider ${
                  isFullBox ? 'bg-amber-500 text-black shadow-md' : 'bg-purple-500 text-white shadow-md'
                }`}>
                  {isFullBox ? 'FULL BOX' : 'HALF BOX'}
                </span>
                <span className="text-[8px] sm:text-[10px] font-black text-amber-300 bg-black/80 px-1.5 py-0.5 rounded border border-amber-400/40">
                  {packCount} PACKS
                </span>
              </div>
            </div>

            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />
          </div>

          {/* 3D Side Depth Panel */}
          <div className={`absolute top-1 bottom-0 -right-3.5 sm:-right-5 w-3.5 sm:w-5 rounded-r-lg transform rotate-y-90 origin-left opacity-90 pointer-events-none ${
            isFullBox ? 'bg-amber-950 border-r border-amber-500/40' : 'bg-purple-950 border-r border-purple-500/40'
          }`} />
        </motion.div>
      </div>
    </div>
  );
};
