import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Sparkles, Zap, Box, ShieldCheck, CheckCircle2, ArrowRight, Scissors, Flame, PackageCheck, Layers, X, Trophy, Star
} from 'lucide-react';
import { ProceduralBoosterBox } from './ProceduralBoosterBox';
import { sound } from '../../services/sound';
import { fetchSingleJapaneseSet, generateJapanesePackFromSet, resolveVendorCardRealPrice } from '../../services/scrydex';
import { generatePackFromSet, type PokemonCard } from '../../services/tcgdex';

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
  const [stage, setStage] = useState<'seal' | 'slicing' | 'opening' | 'ready' | 'mass_rip'>('seal');
  const [unboxedCount, setUnboxedCount] = useState<number>(0);
  const [isMassRipping, setIsMassRipping] = useState<boolean>(false);
  const [massRipHits, setMassRipHits] = useState<{ card: PokemonCard; price: number; grade: string }[]>([]);
  const [totalBoxValue, setTotalBoxValue] = useState<number>(0);

  const isJapanese = language === 'ja' || (set?.id || '').endsWith('_ja');
  const isFullBox = boxType === 'fullBox';
  const totalPacks = isFullBox ? (isJapanese ? 30 : 36) : (isJapanese ? 15 : 18);

  useEffect(() => {
    if (isOpen) {
      setStage('seal');
      setUnboxedCount(0);
      setMassRipHits([]);
      setTotalBoxValue(0);
      setIsMassRipping(false);
      sound.playModalOpen();
    }
  }, [isOpen]);

  if (!isOpen || !set) return null;

  const handleSliceSeal = () => {
    sound.playButtonClick();
    sound.playPackOpen();
    setStage('slicing');

    // Laser slice -> Lid pop & pack ejection
    setTimeout(() => {
      setStage('opening');
      sound.playPackComplete();

      // Confetti burst on lid opening!
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      // Count up unboxed packs
      let count = 0;
      const interval = setInterval(() => {
        count += Math.max(1, Math.floor(totalPacks / 6));
        if (count >= totalPacks) {
          count = totalPacks;
          clearInterval(interval);
          setUnboxedCount(totalPacks);
          setTimeout(() => {
            setStage('ready');
            sound.playGradeReveal(10);
            try {
              confetti({
                particleCount: 90,
                spread: 100,
                origin: { y: 0.5 }
              });
            } catch {}
          }, 300);
        } else {
          setUnboxedCount(count);
          sound.playPackOpen();
        }
      }, 150);
    }, 1100);
  };

  const handleMassRip = async () => {
    sound.playButtonClick();
    setIsMassRipping(true);
    sound.playPackOpen();

    try {
      let pulledCards: PokemonCard[] = [];

      if (isJapanese) {
        const fullSet = await fetchSingleJapaneseSet(set.id);
        for (let i = 0; i < totalPacks; i++) {
          const pack = await generateJapanesePackFromSet(fullSet);
          pulledCards.push(...pack);
        }
      } else {
        const fullSet = await fetchSingleJapaneseSet(set.id);
        for (let i = 0; i < totalPacks; i++) {
          const pack = await generatePackFromSet(fullSet);
          pulledCards.push(...pack);
        }
      }

      // Filter out high-tier hits (Secret Rare, SAR, SR, AR, UR, Holo, EX/V/VMAX/VSTAR)
      const hitsWithMetadata = pulledCards
        .map(c => {
          const p = resolveVendorCardRealPrice(c);
          const grade = p > 100 ? 'PSA 10' : p > 30 ? 'PSA 9' : 'Raw NM';
          return { card: c, price: p, grade };
        })
        .filter(h => {
          const r = (h.card.rarity || '').toUpperCase();
          const n = (h.card.name || '').toUpperCase();
          return (
            r.includes('SAR') || r.includes('SR') || r.includes('UR') || r.includes('AR') ||
            r.includes('HR') || r.includes('SSR') || r.includes('CHR') || r.includes('CSR') ||
            r.includes('RARE') || r.includes('EX') || r.includes('V') ||
            n.includes('EX') || n.includes('VMAX') || n.includes('VSTAR') || n.includes('SECRET') ||
            h.price >= 1.5
          );
        });

      // Sort hits descending by price
      hitsWithMetadata.sort((a, b) => b.price - a.price);
      const sumValue = pulledCards.reduce((acc, c) => acc + resolveVendorCardRealPrice(c), 0);

      setMassRipHits(hitsWithMetadata.slice(0, 20));
      setTotalBoxValue(Number(sumValue.toFixed(2)));
      setStage('mass_rip');
      sound.playGradeReveal(10);

      // Mega celebration confetti explosion!
      try {
        confetti({
          particleCount: 160,
          spread: 120,
          origin: { y: 0.4 }
        });
      } catch {}
    } catch (e) {
      console.error('Failed to mass rip box:', e);
    } finally {
      setIsMassRipping(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto pointer-events-auto">
        
        {/* Background Ambient Glow Lights */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/15 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 30 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl rounded-3xl bg-gradient-to-b from-[#1c152d] via-[#120d21] to-[#0a0714] border-2 border-amber-400/50 shadow-[0_30px_100px_rgba(245,158,11,0.4)] overflow-hidden flex flex-col items-center text-center p-5 sm:p-8 my-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {stage !== 'mass_rip' ? (
            <>
              {/* Header Title Banner */}
              <div className="mb-2">
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

              {/* 3D Animated Booster Box Display Area */}
              <div className="relative my-2 py-4 w-full flex justify-center items-center min-h-[240px] sm:min-h-[280px]">
                <ProceduralBoosterBox
                  type={isFullBox ? 'full' : 'half'}
                  setName={set.name}
                  setId={set.id}
                  logoUrl={logoUrl}
                  packArtUrl={packArtUrl}
                  packCount={totalPacks}
                  language={language}
                  stage={stage}
                />

                {/* Counter Badge during Unboxing */}
                {(stage === 'opening' || stage === 'ready') && (
                  <motion.div
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="absolute bottom-0 z-40 px-4 py-1.5 rounded-full bg-black/90 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)] text-amber-300 font-mono font-black text-xs sm:text-sm flex items-center gap-2"
                  >
                    <PackageCheck className="w-4.5 h-4.5 text-emerald-400" />
                    <span>{unboxedCount} / {totalPacks} PACKS UNBOXED</span>
                  </motion.div>
                )}
              </div>

              {/* Stage Controls */}
              <div className="w-full mt-4 pt-4 border-t border-white/10 flex flex-col items-center">
                {stage === 'seal' && (
                  <button
                    onClick={handleSliceSeal}
                    className="w-full sm:w-auto py-4 px-9 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-black font-black text-base shadow-[0_0_35px_rgba(245,158,11,0.7)] flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-95 group"
                  >
                    <Scissors className="w-5 h-5 text-black group-hover:rotate-45 transition-transform" />
                    <span>Slice Factory Seal ✂️</span>
                    <ArrowRight className="w-5 h-5 text-black" />
                  </button>
                )}

                {stage === 'slicing' && (
                  <div className="flex items-center gap-2.5 text-amber-300 font-black text-sm animate-pulse py-3">
                    <Scissors className="w-5 h-5 animate-spin" />
                    <span>Slicing Holographic Factory Seal...</span>
                  </div>
                )}

                {stage === 'opening' && (
                  <div className="flex items-center gap-2.5 text-amber-300 font-black text-sm animate-pulse py-3">
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
                    {/* Mass Rip All Packs */}
                    <button
                      onClick={handleMassRip}
                      disabled={isMassRipping}
                      className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-black font-black text-sm sm:text-base shadow-[0_0_35px_rgba(245,158,11,0.7)] flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Zap className="w-5 h-5 text-black fill-black" />
                      <span>{isMassRipping ? 'Mass Ripping Box...' : `Mass Rip All ${totalPacks} Packs ⚡`}</span>
                    </button>

                    {/* Rip Pack by Pack */}
                    <button
                      onClick={() => {
                        sound.playButtonClick();
                        onStartRipping();
                      }}
                      className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-gray-100 hover:text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Layers className="w-5 h-5 text-amber-300" />
                      <span>Rip Pack #1 🎴</span>
                    </button>

                    {/* Store Box to Vault */}
                    <button
                      onClick={() => {
                        sound.playButtonClick();
                        onSaveToVault();
                      }}
                      className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-gray-200 hover:text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Box className="w-5 h-5 text-purple-300" />
                      <span>Save to Vault 🎒</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            /* MASS RIP BOX SHOWCASE VIEW */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center"
            >
              {/* Header Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black uppercase tracking-widest mb-2 shadow-sm">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>BOOSTER BOX MASS RIP COMPLETE!</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                {set.name} Hits Showcase
              </h2>

              <p className="text-xs sm:text-sm text-gray-300 mb-4">
                Unboxed <span className="text-amber-300 font-bold">{totalPacks} Packs</span> • Pulled <span className="text-emerald-400 font-bold">{massRipHits.length} Top Hits</span>
              </p>

              {/* Total Box Hit Value Banner */}
              <div className="w-full mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/40 shadow-lg flex flex-row items-center justify-between px-6">
                <div className="text-left">
                  <div className="text-[11px] font-black text-amber-300 uppercase tracking-widest">Total Estimated Box Hits Value</div>
                  <div className="text-2xl sm:text-4xl font-black text-amber-400 tracking-tight font-mono">${totalBoxValue.toFixed(2)}</div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-black">
                  <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>ALL HITS ADDED TO VAULT</span>
                </div>
              </div>

              {/* Top Hits Cards Grid */}
              <div className="w-full max-h-[380px] overflow-y-auto p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {massRipHits.map((h, i) => (
                  <motion.div
                    key={`hit-${h.card.id}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative group rounded-xl bg-[#171126] border border-amber-400/30 p-2 flex flex-col items-center text-center shadow-md hover:border-amber-400 transition-colors"
                  >
                    <div className="relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden mb-2 bg-black/40">
                      <img
                        src={(h.card as any).image || h.card.images?.large || h.card.images?.small || ''}
                        alt={h.card.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-black text-amber-300 border border-amber-400/30">
                        ${h.price.toFixed(2)}
                      </div>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-purple-900/80 text-[8px] font-black text-purple-200 border border-purple-400/30">
                        {h.grade}
                      </div>
                    </div>

                    <div className="text-[11px] font-black text-white truncate w-full">{h.card.name}</div>
                    <div className="text-[9px] font-bold text-amber-300/80 uppercase">{h.card.rarity || 'Hit'}</div>
                  </motion.div>
                ))}
              </div>

              {/* Mass Rip Footer Control */}
              <div className="w-full mt-5 pt-4 border-t border-white/10 flex justify-center">
                <button
                  onClick={() => {
                    sound.playButtonClick();
                    onSaveToVault();
                  }}
                  className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Box className="w-5 h-5 text-black" />
                  <span>Go to Vault & Inventory 🎒</span>
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
