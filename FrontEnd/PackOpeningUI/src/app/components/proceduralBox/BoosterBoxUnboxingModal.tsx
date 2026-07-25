import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Box, ShieldCheck, CheckCircle2, ArrowRight, Scissors, Flame, PackageCheck, Layers, X } from 'lucide-react';
import { ProceduralBoosterBox } from './ProceduralBoosterBox';
import { sound } from '../../services/sound';

export interface BoosterBoxUnboxingModalProps {
  isOpen: boolean;
  onClose: () => void;
  set: {
    id: string;
    name: string;
  } | null;
  boxType: 'halfBox' | 'fullBox';
  packArtUrl?: string | null;
  logoUrl?: string | null;
  language?: 'en' | 'ja';
  onStartRipping: () => void;
  onSaveToVault: () => void;
}

export const BoosterBoxUnboxingModal: React.FC<BoosterBoxUnboxingModalProps> = ({
  isOpen,
  onClose,
  set,
  boxType,
  packArtUrl,
  logoUrl,
  language = 'en',
  onStartRipping,
  onSaveToVault
}) => {
  const [stage, setStage] = useState<'seal' | 'slicing' | 'opening' | 'ready'>('seal');
  const [unboxedCount, setUnboxedCount] = useState<number>(0);

  const isJapanese = language === 'ja' || (set?.id || '').endsWith('_ja');
  const isFullBox = boxType === 'fullBox';
  const totalPacks = isFullBox ? (isJapanese ? 30 : 36) : (isJapanese ? 15 : 18);

  useEffect(() => {
    if (isOpen) {
      setStage('seal');
      setUnboxedCount(0);
      sound.playModalOpen();
    }
  }, [isOpen]);

  if (!isOpen || !set) return null;

  const handleSliceSeal = () => {
    sound.playButtonClick();
    sound.playPackOpen();
    setStage('slicing');

    // After laser slice animation, open lid and stream packs
    setTimeout(() => {
      setStage('opening');
      sound.playPackComplete();

      // Count up unboxed packs
      let count = 0;
      const interval = setInterval(() => {
        count += Math.max(1, Math.floor(totalPacks / 8));
        if (count >= totalPacks) {
          count = totalPacks;
          clearInterval(interval);
          setUnboxedCount(totalPacks);
          setTimeout(() => {
            setStage('ready');
            sound.playGradeReveal(10);
          }, 400);
        } else {
          setUnboxedCount(count);
          sound.playPackOpen();
        }
      }, 180);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl overflow-hidden pointer-events-auto">
        {/* Background Ambient Glow Lights */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 30 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#1c162e] via-[#120e21] to-[#0a0714] border-2 border-amber-400/50 shadow-[0_30px_90px_rgba(245,158,11,0.35)] overflow-hidden flex flex-col items-center text-center p-5 sm:p-8"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Title Banner */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isFullBox ? 'FULL BOOSTER BOX UNBOXING' : 'HALF BOOSTER BOX UNBOXING'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {set.name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1">
              Factory Sealed Box containing <span className="text-amber-400 font-black font-mono">{totalPacks} Foil Packs</span>
            </p>
          </div>

          {/* 3D Booster Box Interactive Showcase Stage */}
          <div className="relative my-4 py-4 w-full flex justify-center items-center min-h-[220px] sm:min-h-[260px] perspective-[1200px]">
            {/* Holographic Laser Seal Cutter Animation */}
            {stage === 'slicing' && (
              <motion.div
                initial={{ left: '10%', opacity: 0 }}
                animate={{ left: '90%', opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
                className="absolute top-12 z-40 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-amber-300 shadow-[0_0_20px_#00f0ff,0_0_30px_#f59e0b] rounded-full w-24 -translate-x-1/2 pointer-events-none"
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[2px] shadow-[0_0_15px_#ffffff]" />
              </motion.div>
            )}

            {/* Glowing Eruption Rays when Unboxing Packs */}
            {(stage === 'opening' || stage === 'ready') && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.8, 0.4] }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-purple-500/20 to-transparent rounded-full blur-2xl pointer-events-none"
              />
            )}

            {/* Floating 3D Box Renderer */}
            <motion.div
              animate={
                stage === 'seal'
                  ? { y: [0, -8, 0], rotateY: [-5, 5, -5] }
                  : stage === 'slicing'
                  ? { scale: [1, 1.05, 1], rotateZ: [-2, 2, 0] }
                  : stage === 'opening'
                  ? { scale: [1, 1.1, 1.05], y: -10 }
                  : { y: 0, scale: 1.02 }
              }
              transition={{
                y: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                rotateY: { repeat: Infinity, duration: 6, ease: 'easeInOut' }
              }}
              className="relative z-20 transform-style-3d"
            >
              <ProceduralBoosterBox
                type={isFullBox ? 'full' : 'half'}
                setName={set.name}
                setId={set.id}
                logoUrl={logoUrl}
                packArtUrl={packArtUrl}
                packCount={totalPacks}
                language={language}
              />
            </motion.div>

            {/* Unboxing Pack Stream Counter Badge */}
            {(stage === 'opening' || stage === 'ready') && (
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="absolute -bottom-2 z-30 px-4 py-1.5 rounded-full bg-black/90 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)] text-amber-300 font-mono font-black text-xs sm:text-sm flex items-center gap-2"
              >
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                <span>{unboxedCount} / {totalPacks} PACKS UNBOXED</span>
              </motion.div>
            )}
          </div>

          {/* Dynamic Action Controls for Each Stage */}
          <div className="w-full mt-4 pt-4 border-t border-white/10 flex flex-col items-center">
            {stage === 'seal' && (
              <button
                onClick={handleSliceSeal}
                className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-black font-black text-sm shadow-[0_0_30px_rgba(245,158,11,0.7)] flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-95 group"
              >
                <Scissors className="w-5 h-5 text-black group-hover:rotate-45 transition-transform" />
                <span>Slice Factory Seal ✂️</span>
                <ArrowRight className="w-5 h-5 text-black" />
              </button>
            )}

            {stage === 'slicing' && (
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm animate-pulse py-2">
                <Scissors className="w-5 h-5 animate-spin" />
                <span>Slicing Holographic Factory Tape...</span>
              </div>
            )}

            {stage === 'opening' && (
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm animate-pulse py-2">
                <Flame className="w-5 h-5 text-orange-400 animate-bounce" />
                <span>Unboxing {totalPacks} Foil Booster Packs...</span>
              </div>
            )}

            {stage === 'ready' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                <button
                  onClick={() => {
                    sound.playButtonClick();
                    onStartRipping();
                  }}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-black font-black text-sm shadow-[0_0_30px_rgba(245,158,11,0.7)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Zap className="w-5 h-5 text-black fill-black" />
                  <span>Start Ripping Pack #1 Now ⚡</span>
                  <ArrowRight className="w-5 h-5 text-black" />
                </button>

                <button
                  onClick={() => {
                    sound.playButtonClick();
                    onSaveToVault();
                  }}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-gray-200 hover:text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Box className="w-5 h-5 text-purple-300" />
                  <span>Save All to Vault 🎒</span>
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
