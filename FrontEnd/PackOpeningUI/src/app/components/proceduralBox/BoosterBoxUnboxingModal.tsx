import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Sparkles, Zap, Box, ShieldCheck, CheckCircle2, ArrowRight, Scissors, Flame, PackageCheck, Layers, X, Trophy, Star, Filter, ArrowUpDown, Award, MessageSquare
} from 'lucide-react';
import { ProceduralBoosterBox } from './ProceduralBoosterBox';
import { sound } from '../../services/sound';
import { fetchSingleJapaneseSet, generateJapanesePackFromSet, resolveVendorCardRealPrice } from '../../services/scrydex';
import { fetchSetDetails, generatePackFromSet, getBulletproofCardImageUrl, type PokemonCard } from '../../services/tcgdex';
import { saveCollectedCard, saveCardToCatalogue } from '../binder/types';

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

const STREAMER_REACTIONS = [
  { user: '@PackRipper99', msg: 'HOLY SHIT $280+ BOX VALUE!! 🔥🔥🔥', color: 'text-amber-400' },
  { user: '@CardInvestor_X', msg: 'THAT CHASE PULL IS A GEM MINT PSA 10 FOR SURE!! 💎', color: 'text-purple-400' },
  { user: '@VmaxHunter', msg: 'UNBOXING CEREMONY WAS UNREAL LFG!! 🚀', color: 'text-emerald-400' },
  { user: '@VintageCollector', msg: 'All hits saved to vault, huge W! 🙌', color: 'text-cyan-400' }
];

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
  const [stage, setStage] = useState<'seal' | 'slicing' | 'opening' | 'ready' | 'ripping_progress' | 'god_pull_reveal' | 'showcase'>('seal');
  const [unboxedCount, setUnboxedCount] = useState<number>(0);
  const [isMassRipping, setIsMassRipping] = useState<boolean>(false);
  const [ripStep, setRipStep] = useState<number>(0);
  const [massRipHits, setMassRipHits] = useState<{ card: PokemonCard; price: number; grade: string }[]>([]);
  const [totalBoxValue, setTotalBoxValue] = useState<number>(0);
  const [totalCardsPulled, setTotalCardsPulled] = useState<number>(0);

  // God Pull Reveal State
  const [godHits, setGodHits] = useState<{ card: PokemonCard; price: number; grade: string }[]>([]);
  const [godIndex, setGodIndex] = useState<number>(0);

  // Showcase View Filters
  const [filterCategory, setFilterCategory] = useState<'all' | 'secret' | 'ultra' | 'holo'>('all');
  const [sortBy, setSortBy] = useState<'price_desc' | 'price_asc' | 'name'>('price_desc');

  const isJapanese = language === 'ja' || (set?.id || '').endsWith('_ja');
  const isFullBox = boxType === 'fullBox';
  const totalPacks = isFullBox ? (isJapanese ? 30 : 36) : (isJapanese ? 15 : 18);

  useEffect(() => {
    if (isOpen) {
      setStage('seal');
      setUnboxedCount(0);
      setMassRipHits([]);
      setGodHits([]);
      setGodIndex(0);
      setTotalBoxValue(0);
      setTotalCardsPulled(0);
      setIsMassRipping(false);
      setRipStep(0);
      setFilterCategory('all');
      setSortBy('price_desc');
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
    setStage('ripping_progress');
    setRipStep(0);
    sound.playPackOpen();

    try {
      let pulledCards: PokemonCard[] = [];

      // BULLETPROOF SET DETAILS FETCH: Japanese vs English sets
      let fullSet: any;
      if (isJapanese) {
        fullSet = await fetchSingleJapaneseSet(set.id);
      } else {
        fullSet = await fetchSetDetails(set.id);
      }

      // Generate all packs step-by-step with rapid visual feedback & pack tear audio
      for (let i = 0; i < totalPacks; i++) {
        let pack: PokemonCard[] = [];
        if (isJapanese) {
          pack = await generateJapanesePackFromSet(fullSet);
        } else {
          pack = await generatePackFromSet(fullSet);
        }
        pulledCards.push(...pack);
        setRipStep(i + 1);
        setTotalCardsPulled(pulledCards.length);

        if (i % 3 === 0) {
          sound.playPackOpen();
        }
        await new Promise(r => setTimeout(r, 45)); // Fast exciting ripping ticker delay
      }

      // Save pulled cards & catalogue items to inventory/vault automatically
      for (const card of pulledCards) {
        try {
          saveCollectedCard(card, set.name);
          saveCardToCatalogue({ pokemon: card }, set.name);
        } catch {}
      }

      // Metadata hit filter: Secret Rare, SAR, SR, AR, UR, Holo, EX/V/VMAX/VSTAR or $1.20+
      const hitsWithMetadata = pulledCards
        .map(c => {
          const p = resolveVendorCardRealPrice(c);
          const grade = p > 100 ? 'PSA 10 Gem Mint' : p > 40 ? 'PSA 9 Mint' : p > 15 ? 'PSA 8 NM-MT' : 'Raw NM';
          return { card: c, price: p, grade };
        })
        .filter(h => {
          const r = (h.card.rarity || '').toUpperCase();
          const n = (h.card.name || '').toUpperCase();
          return (
            r.includes('SAR') || r.includes('SR') || r.includes('UR') || r.includes('AR') ||
            r.includes('HR') || r.includes('SSR') || r.includes('CHR') || r.includes('CSR') ||
            r.includes('RARE') || r.includes('EX') || r.includes('V') || r.includes('SECRET') ||
            n.includes('EX') || n.includes('VMAX') || n.includes('VSTAR') || n.includes('SECRET') ||
            h.price >= 1.2
          );
        });

      // Sort hits descending by price
      hitsWithMetadata.sort((a, b) => b.price - a.price);
      const sumValue = pulledCards.reduce((acc, c) => acc + resolveVendorCardRealPrice(c), 0);

      setMassRipHits(hitsWithMetadata);
      setTotalBoxValue(Number(sumValue.toFixed(2)));

      // PHASE 2: God Pull Spotlight Reveal if there are massive chase hits ($15+ or Secret Rare/SAR)
      const topGodHits = hitsWithMetadata.filter(h => h.price >= 15 || h.card.rarity?.includes('Secret') || h.card.rarity?.includes('SAR') || h.card.rarity?.includes('UR'));
      
      if (topGodHits.length > 0) {
        setGodHits(topGodHits.slice(0, 3));
        setGodIndex(0);
        setStage('god_pull_reveal');
        sound.playLegendaryFanfare();
        try {
          confetti({
            particleCount: 160,
            spread: 110,
            origin: { y: 0.4 }
          });
        } catch {}
      } else {
        setStage('showcase');
        sound.playGradeReveal(10);
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.4 }
          });
        } catch {}
      }
    } catch (e) {
      console.error('Failed to mass rip box:', e);
      // Fallback transition so modal never hangs
      setStage('showcase');
    } finally {
      setIsMassRipping(false);
    }
  };

  // Filtered & Sorted Showcase Hits
  const getFilteredHits = () => {
    let filtered = [...massRipHits];
    if (filterCategory === 'secret') {
      filtered = filtered.filter(h => (h.card.rarity || '').toLowerCase().includes('secret') || (h.card.rarity || '').includes('SAR') || h.price >= 40);
    } else if (filterCategory === 'ultra') {
      filtered = filtered.filter(h => h.price >= 8 && h.price < 40);
    } else if (filterCategory === 'holo') {
      filtered = filtered.filter(h => h.price < 8);
    }

    if (sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.card.name.localeCompare(b.card.name));
    }
    return filtered;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto pointer-events-auto">
        
        {/* Ambient Background Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-amber-500/15 rounded-full blur-[160px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-500/15 rounded-full blur-[130px]" />
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

          {/* STAGE 1: BOX SEAL & UNBOXING CEREMONY */}
          {(stage === 'seal' || stage === 'slicing' || stage === 'opening' || stage === 'ready') && (
            <>
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

              {/* Controls */}
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
          )}

          {/* STAGE 2: RAPID MASS RIP PROGRESS TICKER ANIMATION */}
          {stage === 'ripping_progress' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full py-8 flex flex-col items-center justify-center"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.8)] animate-pulse">
                  <Zap className="w-12 h-12 text-black fill-black animate-bounce" />
                </div>
                <div className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-red-500 text-white font-black text-[10px] tracking-widest uppercase animate-ping">
                  LIVE RIP
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                MASS RIPPING {set.name}
              </h2>
              
              <div className="text-amber-400 font-mono font-black text-lg mb-4">
                PACK {ripStep} OF {totalPacks} RIPPED ⚡
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md bg-black/60 h-4 rounded-full border border-amber-400/30 overflow-hidden mb-4 p-0.5 shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full"
                  animate={{ width: `${(ripStep / totalPacks) * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              <div className="text-xs text-gray-300 font-semibold flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                <span>Pulled <span className="text-emerald-400 font-black font-mono">{totalCardsPulled} Cards</span> into collection!</span>
              </div>
            </motion.div>
          )}

          {/* STAGE 3: GOD PULL REVEAL SPOTLIGHT */}
          {stage === 'god_pull_reveal' && godHits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center text-center py-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-500/30 border border-amber-400 text-amber-300 text-xs font-black uppercase tracking-widest mb-3 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span>🌟 GOD PULL SPOTLIGHT ({godIndex + 1} / {godHits.length}) 🌟</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
                Massive Chase Hit Pulled!
              </h2>

              {/* Card Spotlight Frame */}
              <motion.div
                key={`god-${godHits[godIndex].card.id}`}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-52 sm:w-60 aspect-[2.5/3.5] rounded-2xl p-2.5 bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 shadow-[0_0_60px_rgba(245,158,11,0.8)] my-2 group"
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-black">
                  <img
                    src={getBulletproofCardImageUrl(godHits[godIndex].card, 'high')}
                    alt={godHits[godIndex].card.name}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.fallbackTried) {
                        target.dataset.fallbackTried = 'true';
                        target.src = `https://images.scrydex.com/pokemon/${godHits[godIndex].card.id}/large`;
                      } else {
                        target.src = 'https://assets.tcgdex.net/en/swsh/swsh3/154/high.webp';
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/90 text-amber-300 font-mono font-black text-xs border border-amber-400 shadow-md">
                    ${godHits[godIndex].price.toFixed(2)}
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-purple-950/90 text-purple-200 font-black text-[10px] border border-purple-400/50 shadow-md">
                    {godHits[godIndex].grade}
                  </div>
                </div>
              </motion.div>

              <div className="mt-3">
                <div className="text-lg font-black text-white">{godHits[godIndex].card.name}</div>
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">{godHits[godIndex].card.rarity || 'Ultra Rare Hit'}</div>
              </div>

              {/* Control Buttons */}
              <div className="w-full mt-6 flex justify-center gap-3">
                {godIndex < godHits.length - 1 ? (
                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      setGodIndex(prev => prev + 1);
                      sound.playGradeReveal(10);
                    }}
                    className="py-3 px-7 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Next Top Hit ➔</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      setStage('showcase');
                    }}
                    className="py-3 px-7 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.6)] flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>View All Ripped Hits Showcase 🏆</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* STAGE 4: INTERACTIVE MASS RIP SHOWCASE & HYPE STREAMER FEED */}
          {stage === 'showcase' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center"
            >
              {/* Header Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black uppercase tracking-widest mb-1.5 shadow-sm">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>BOOSTER BOX MASS RIP COMPLETE!</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                {set.name} Hits Showcase
              </h2>

              <p className="text-xs sm:text-sm text-gray-300 mb-3">
                Unboxed <span className="text-amber-300 font-bold">{totalPacks} Packs</span> • Pulled <span className="text-emerald-400 font-bold">{massRipHits.length} Top Hits</span> ({totalCardsPulled} total cards)
              </p>

              {/* Total Estimated Box Hit Value Banner */}
              <div className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/40 shadow-lg flex flex-row items-center justify-between px-6">
                <div className="text-left">
                  <div className="text-[10px] sm:text-[11px] font-black text-amber-300 uppercase tracking-widest">Total Estimated Box Hits Value</div>
                  <div className="text-2xl sm:text-4xl font-black text-amber-400 tracking-tight font-mono">${totalBoxValue.toFixed(2)}</div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-black">
                  <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>ALL HITS ADDED TO VAULT</span>
                </div>
              </div>

              {/* Filter Tabs & Sorting Toolbar */}
              <div className="w-full mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setFilterCategory('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-colors ${filterCategory === 'all' ? 'bg-amber-400 text-black' : 'bg-white/10 text-gray-300 hover:text-white'}`}
                  >
                    All ({massRipHits.length})
                  </button>
                  <button
                    onClick={() => setFilterCategory('secret')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-colors ${filterCategory === 'secret' ? 'bg-amber-400 text-black' : 'bg-white/10 text-gray-300 hover:text-white'}`}
                  >
                    Secret & SARs
                  </button>
                  <button
                    onClick={() => setFilterCategory('ultra')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-colors ${filterCategory === 'ultra' ? 'bg-amber-400 text-black' : 'bg-white/10 text-gray-300 hover:text-white'}`}
                  >
                    Ultra Rares ($10+)
                  </button>
                  <button
                    onClick={() => setFilterCategory('holo')}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-colors ${filterCategory === 'holo' ? 'bg-amber-400 text-black' : 'bg-white/10 text-gray-300 hover:text-white'}`}
                  >
                    Holos
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-300" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none"
                  >
                    <option value="price_desc">Price: High to Low</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="name">Card Name</option>
                  </select>
                </div>
              </div>

              {/* Cards Showcase Grid with Bulletproof Image Fallback */}
              <div className="w-full max-h-[340px] overflow-y-auto p-1.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {getFilteredHits().map((h, i) => (
                  <motion.div
                    key={`hit-${h.card.id}-${i}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="relative group rounded-xl bg-[#171126] border border-amber-400/30 p-2 flex flex-col items-center text-center shadow-md hover:border-amber-400 transition-colors"
                  >
                    <div className="relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden mb-2 bg-black/40">
                      <img
                        src={getBulletproofCardImageUrl(h.card, 'high')}
                        alt={h.card.name}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallbackTried) {
                            target.dataset.fallbackTried = 'true';
                            target.src = `https://images.scrydex.com/pokemon/${h.card.id}/large`;
                          } else {
                            target.src = 'https://assets.tcgdex.net/en/swsh/swsh3/154/high.webp';
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[9px] font-black text-amber-300 border border-amber-400/30 shadow">
                        ${h.price.toFixed(2)}
                      </div>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-purple-950/85 text-[8px] font-black text-purple-200 border border-purple-400/30 shadow">
                        {h.grade}
                      </div>
                    </div>

                    <div className="text-[11px] font-black text-white truncate w-full">{h.card.name}</div>
                    <div className="text-[9px] font-bold text-amber-300/80 uppercase">{h.card.rarity || 'Hit'}</div>
                  </motion.div>
                ))}
              </div>

              {/* Streamer Live Reactions Feed Banner */}
              <div className="w-full mt-3 p-2 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-left px-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400 animate-pulse" />
                  <div className="text-xs">
                    <span className={`font-black ${STREAMER_REACTIONS[Math.floor(Math.random() * STREAMER_REACTIONS.length)].color}`}>
                      {STREAMER_REACTIONS[Math.floor(Math.random() * STREAMER_REACTIONS.length)].user}:
                    </span>{' '}
                    <span className="text-gray-200 font-medium">
                      "{STREAMER_REACTIONS[Math.floor(Math.random() * STREAMER_REACTIONS.length)].msg}"
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest shrink-0">STREAM HYPE</span>
              </div>

              {/* Mass Rip Footer Control */}
              <div className="w-full mt-4 pt-3 border-t border-white/10 flex justify-center gap-3">
                <button
                  onClick={() => {
                    sound.playButtonClick();
                    onSaveToVault();
                  }}
                  className="w-full sm:w-auto py-3 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
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
