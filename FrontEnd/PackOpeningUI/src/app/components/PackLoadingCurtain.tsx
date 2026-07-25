import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Sparkles, Box, ShieldCheck, Layers, Loader2 } from 'lucide-react';

interface PackLoadingCurtainProps {
  setName?: string;
  className?: string;
}

const DISTRACT_SUBMESSAGES = [
  "Opening factory-sealed booster box...",
  "Selecting pristine foil pack wrapper...",
  "Verifying tamper-proof hologram seal...",
  "Shuffling mint condition cards...",
  "Preparing booster pack for opening..."
];

export const PackLoadingCurtain: React.FC<PackLoadingCurtainProps> = ({
  setName,
  className = ''
}) => {
  const [subMessageIndex, setSubMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubMessageIndex(prev => (prev + 1) % DISTRACT_SUBMESSAGES.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-72 sm:w-80 h-[26rem] sm:h-[29rem] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-amber-500/30 flex flex-col items-center justify-between p-6 select-none shrink-0 ${className}`}
    >
      {/* Deep Theater Curtain Background with Shimmer Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/80 to-slate-950 z-0 pointer-events-none" />
      
      {/* Animated Left Curtain Panel */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-purple-950/90 border-r border-amber-500/30 shadow-[10px_0_30px_rgba(0,0,0,0.8)] z-10 flex items-center justify-end pr-1"
      >
        <div className="w-1 h-full bg-gradient-to-b from-transparent via-amber-400/40 to-transparent" />
      </motion.div>

      {/* Animated Right Curtain Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-amber-950/90 via-slate-900/95 to-purple-950/90 border-l border-amber-500/30 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] z-10 flex items-center justify-start pl-1"
      >
        <div className="w-1 h-full bg-gradient-to-b from-transparent via-amber-400/40 to-transparent" />
      </motion.div>

      {/* Ambient Pulsing Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl animate-pulse pointer-events-none z-20" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none z-20" />

      {/* Curtain Content Layer */}
      <div className="relative z-30 w-full h-full flex flex-col items-center justify-between py-4 text-center">
        
        {/* Top Header Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Booster Box Unboxing</span>
        </motion.div>

        {/* Central 3D Box & Pack Pull Visual */}
        <div className="relative flex flex-col items-center justify-center my-auto">
          {/* Outer Rotating Aura Ring */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
              className="absolute inset-2 rounded-full border border-dotted border-purple-400/40"
            />

            {/* Pulsing Floating Box Frame */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-600/30 via-purple-600/30 to-amber-400/30 border border-amber-300/40 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.35)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              <Package className="w-9 h-9 sm:w-11 sm:h-11 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
            </motion.div>

            {/* Corner Sparkle accents */}
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-300 animate-bounce" />
            <Layers className="absolute -bottom-1 -left-1 w-4 h-4 text-purple-300 animate-pulse" />
          </div>

          {/* Main Requested Headline */}
          <motion.h3
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-400 mt-5 leading-tight max-w-[240px] drop-shadow-md tracking-tight"
          >
            Pulling out fresh packs from the box
          </motion.h3>

          {/* Dynamic Distraction Sub-Message */}
          <div className="h-6 flex items-center justify-center mt-2 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={subMessageIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="text-xs font-semibold text-amber-200/90 flex items-center gap-1.5"
              >
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
                <span>{DISTRACT_SUBMESSAGES[subMessageIndex]}</span>
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Active Set Badge & Progress Bar */}
        <div className="w-full flex flex-col items-center gap-2 pt-2">
          {setName && (
            <span className="text-[11px] font-bold text-gray-300 bg-white/5 px-3 py-1 rounded-full border border-white/10 truncate max-w-[220px]">
              Set: <strong className="text-amber-300">{setName}</strong>
            </span>
          )}

          {/* Glowing Animated Progress Bar */}
          <div className="w-4/5 h-1.5 rounded-full bg-black/60 border border-white/10 overflow-hidden relative shadow-inner">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              className="h-full w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#fbbf24]"
            />
          </div>
        </div>

      </div>
    </motion.div>
  );
};
