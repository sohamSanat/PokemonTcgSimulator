import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Sparkles, Box } from 'lucide-react';

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
  const isFullBox = type === 'full';
  const isOpen = stage === 'opening' || stage === 'ready';

  const fallbackArt = '/packArts/Japanese-XY/Wild-Blaze/Screenshot 2026-07-17 110058.png';
  const artSrc = packArtUrl || fallbackArt;
  const logoSrc = logoUrl || `/setLogos/${setId.replace(/_ja$/i, '')}_ja.png`;

  // --- SINGLE PACK VISUAL ---
  if (type === 'pack') {
    return (
      <div className={`relative flex items-center justify-center p-2 ${className}`}>
        <motion.div
          whileHover={{ scale: 1.05, y: -4 }}
          transition={{ duration: 0.2 }}
          className="relative w-24 sm:w-32 h-36 sm:h-48 rounded-xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.6)] border border-amber-400/30 bg-zinc-900 group"
        >
          {/* Metallic Top Foil Crimp */}
          <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-zinc-400 via-white to-zinc-400 z-20 border-b border-amber-300/40 flex items-center justify-center">
            <div className="w-full h-[1px] bg-zinc-700/50" />
          </div>

          {/* Pack Artwork Image */}
          <img src={artSrc} alt={setName} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />

          {/* Foil Specular Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-transparent to-white/20 pointer-events-none z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

          {/* Bottom Metallic Foil Crimp */}
          <div className="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-r from-zinc-400 via-white to-zinc-400 z-20 border-t border-amber-300/40" />

          {/* Pack Tag */}
          <div className="absolute top-4 right-2.5 z-20 px-1.5 py-0.5 rounded bg-zinc-950/80 backdrop-blur-md border border-amber-400/40 text-[9px] font-black text-amber-300 shadow-md">
            1 PACK
          </div>
        </motion.div>
      </div>
    );
  }

  // --- BOOSTER BOX VISUAL (HALF / FULL) ---
  return (
    <div className={`relative flex items-center justify-center p-2 ${className}`}>
      <div className="relative group cursor-pointer">
        {/* Glow backdrop */}
        <div className={`absolute -inset-3 sm:-inset-5 rounded-2xl blur-xl opacity-40 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none ${
          isFullBox
            ? 'bg-amber-500/30'
            : 'bg-purple-500/30'
        }`} />

        {/* Outer Booster Box Frame */}
        <motion.div
          animate={
            isOpen
              ? { rotateX: 10, y: -4 }
              : stage === 'slicing'
              ? { scale: [1, 1.02, 1] }
              : { y: [0, -4, 0] }
          }
          transition={
            isOpen
              ? { duration: 0.5 }
              : { y: { repeat: Infinity, duration: 4, ease: 'easeInOut' } }
          }
          className={`relative rounded-2xl border bg-zinc-950/90 overflow-hidden shadow-2xl flex flex-col justify-between ${
            isFullBox
              ? 'w-44 sm:w-60 h-40 sm:h-52 border-amber-500/40'
              : 'w-36 sm:w-48 h-40 sm:h-52 border-purple-500/40'
          }`}
        >
          {/* Laser Cut Effect */}
          {stage === 'slicing' && (
            <motion.div
              initial={{ left: '0%', opacity: 0 }}
              animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              className="absolute top-1/2 z-50 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-amber-300 shadow-[0_0_20px_#00f0ff] rounded-full w-24 pointer-events-none"
            />
          )}

          {/* Factory Seal Ribbon Overlay */}
          <AnimatePresence>
            {(stage === 'seal' || stage === 'slicing') && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-30 pointer-events-none border border-white/10 rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 via-transparent to-white/5"
              >
                {/* Thin Factory Seal Band */}
                <div className="absolute top-3 inset-x-0 py-0.5 bg-zinc-950/90 backdrop-blur-md border-y border-amber-400/40 text-amber-300 font-mono font-bold text-[8px] sm:text-[9px] tracking-widest flex items-center justify-center gap-1 shadow-md">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>FACTORY SEALED</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Artwork Banner & Set Logo */}
          <div className="relative h-16 sm:h-22 w-full overflow-hidden border-b border-white/10 bg-zinc-900 flex items-center justify-center p-2">
            <img src={artSrc} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45 filter blur-[0.5px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            
            {logoSrc ? (
              <img src={logoSrc} alt={setName} className="relative z-10 max-h-8 sm:max-h-12 max-w-[85%] object-contain filter drop-shadow-md" />
            ) : (
              <span className="relative z-10 text-xs font-black text-amber-300 tracking-wide uppercase truncate max-w-[90%]">
                {setName}
              </span>
            )}
          </div>

          {/* Pack Stacks Inside Chamber */}
          <div className="relative flex-1 p-1.5 sm:p-2 bg-zinc-950 flex gap-1.5 justify-center overflow-hidden">
            {isFullBox ? (
              <>
                {/* Left Stack */}
                <div className="flex-1 h-full rounded-lg bg-zinc-900 border border-zinc-800 relative overflow-hidden flex flex-col justify-end p-0.5">
                  <div className="h-2 bg-gradient-to-r from-zinc-300 via-white to-zinc-300 border-b border-amber-400/40" />
                  <img src={artSrc} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-white/10" />
                </div>
                {/* Right Stack */}
                <div className="flex-1 h-full rounded-lg bg-zinc-900 border border-zinc-800 relative overflow-hidden flex flex-col justify-end p-0.5">
                  <div className="h-2 bg-gradient-to-r from-zinc-300 via-white to-zinc-300 border-b border-amber-400/40" />
                  <img src={artSrc} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-white/10" />
                </div>
              </>
            ) : (
              /* Single Stack for Half Box */
              <div className="w-full h-full rounded-lg bg-zinc-900 border border-zinc-800 relative overflow-hidden flex flex-col justify-end p-0.5">
                <div className="h-2 bg-gradient-to-r from-zinc-300 via-white to-zinc-300 border-b border-purple-400/40" />
                <img src={artSrc} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-white/10" />
              </div>
            )}
          </div>

          {/* Bottom Card Footer Tag */}
          <div className="relative px-2 py-1.5 bg-zinc-900/90 border-t border-white/10 flex items-center justify-between">
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
              isFullBox ? 'bg-amber-400 text-zinc-950' : 'bg-purple-400 text-zinc-950'
            }`}>
              {isFullBox ? 'FULL BOX' : 'HALF BOX'}
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-300">
              {packCount} PACKS
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
