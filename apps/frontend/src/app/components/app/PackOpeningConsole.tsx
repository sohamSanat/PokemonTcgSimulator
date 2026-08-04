import React from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  Coins, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Gift, 
  ListChecks, 
  Layers, 
  RefreshCcw, 
  Loader2,
  Ticket,
  Wallet,
  Archive,
  ChevronRight,
  Zap
} from 'lucide-react';
import { getSetBoosterPrice } from '../../utils/packUtils';
import type { TCGDexSet } from '../../services/tcgdex';
import type { EarnedSetPack, OwnedMysteryPack } from '../../services/missions';

export interface PackOpeningConsoleProps {
  currentSet: TCGDexSet | null;
  sessionSpent: number;
  sessionTotal: number;
  luckyDropSeconds: number;
  formatTimer: (seconds: number) => string;
  handleLuckyDropClick: () => void;
  dailyFreePacks: { english: number; japanese: number };
  earnedSetPacks: EarnedSetPack[];
  ownedMysteryPacks: OwnedMysteryPack[];
  dailyCash: number;
  packStage: 'unopened' | 'tearing' | 'opened' | string;
  cards: any[];
  remainingCards: any[];
  handleResetStats: () => void;
  isLoadingPack: boolean;
  handleResetPack: () => Promise<void>;
  setActiveTab: (tab: any) => void;
  sound: { playTabSwitch: () => void };
}

export const PackOpeningConsole: React.FC<PackOpeningConsoleProps> = ({
  currentSet,
  sessionSpent,
  sessionTotal,
  luckyDropSeconds,
  formatTimer,
  handleLuckyDropClick,
  dailyFreePacks,
  earnedSetPacks,
  ownedMysteryPacks,
  dailyCash,
  packStage,
  cards,
  remainingCards,
  handleResetStats,
  isLoadingPack,
  handleResetPack,
  setActiveTab,
  sound,
}) => {
  const netReturn = sessionTotal - sessionSpent;
  const totalSavedPacks = 
    earnedSetPacks.reduce((sum, p) => sum + p.count, 0) + 
    ownedMysteryPacks.reduce((sum, p) => sum + p.count, 0);

  const revealedCount = packStage === 'unopened' ? 0 : (cards.length - remainingCards.length);
  const totalCardsCount = cards.length || 11;
  const progressPercent = packStage === 'unopened' ? 0 : Math.round((revealedCount / totalCardsCount) * 100);

  const boosterPrice = getSetBoosterPrice(currentSet);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto mb-6 shrink-0 rounded-2xl bg-[#0c0d12]/95 border border-amber-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_1px_rgba(255,255,255,0.2)] p-3.5 sm:p-4.5 relative overflow-hidden z-20 backdrop-blur-md"
    >
      {/* Decorative Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

      {/* Terminal Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08] text-[11px] font-medium tracking-wide text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span className="text-gray-300 font-semibold tracking-wider uppercase text-[10px]">Session Terminal</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500 text-[10px]">
          <span>TCG Engine v2.4</span>
        </div>
      </div>

      {/* Top 3 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {/* Card 1: Pack Cost & Session Cost */}
        <div className="bg-[#12141c]/80 hover:bg-[#151722] border border-white/[0.08] rounded-xl p-3 flex flex-col justify-between transition-all group">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Package className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-gray-300">Pack Cost</span>
            </div>
            <span className="text-xs sm:text-sm font-bold font-mono text-white">
              ${boosterPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-gray-400">Total Spent</span>
            </div>
            <span className="text-xs sm:text-sm font-bold font-mono text-gray-300">
              ${sessionSpent.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Card 2: Value Opened & Net Return */}
        <div className="bg-[#12141c]/80 hover:bg-[#151722] border border-white/[0.08] rounded-xl p-3 flex flex-col justify-between transition-all group">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-amber-200/90">Value Opened</span>
            </div>
            <span className="text-xs sm:text-sm font-bold font-mono text-amber-300">
              ${sessionTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                netReturn >= 0 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}>
                {netReturn >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[11px] font-semibold text-gray-300">Net Return</span>
            </div>
            <span className={`text-xs sm:text-sm font-bold font-mono ${
              netReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {netReturn >= 0 ? '+' : '-'}${Math.abs(netReturn).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Card 3: 5-Min Lucky Drop */}
        <div 
          onClick={handleLuckyDropClick}
          className={`rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer border relative overflow-hidden ${
            luckyDropSeconds === 0
              ? 'bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-transparent border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-400'
              : 'bg-[#12141c]/80 hover:bg-[#151722] border-white/[0.08]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                luckyDropSeconds === 0 ? 'bg-amber-400 text-black animate-bounce' : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
              }`}>
                <Gift className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-gray-200">5-Min Lucky Drop</span>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
              luckyDropSeconds === 0
                ? 'bg-amber-400 text-black border-amber-300 font-extrabold animate-pulse'
                : 'bg-white/5 text-purple-300 border-purple-500/30'
            }`}>
              {luckyDropSeconds === 0 ? 'READY!' : 'TIMER'}
            </span>
          </div>

          <div className="my-2">
            {luckyDropSeconds === 0 ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleLuckyDropClick(); }}
                className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>Claim Free Drop</span>
              </button>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">Next Reward:</span>
                <span className="font-mono font-bold text-purple-200">{formatTimer(luckyDropSeconds)}</span>
              </div>
            )}
          </div>

          {/* Clean Progress Gauge */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                luckyDropSeconds === 0
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                  : 'bg-purple-500'
              }`}
              style={{ width: `${Math.round(((300 - luckyDropSeconds) / 300) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Middle Row: Quests & Daily Allowances Panel */}
      <div 
        onClick={() => { sound.playTabSwitch(); setActiveTab('missions'); }}
        className="bg-[#12141c]/60 hover:bg-[#151824] border border-white/[0.08] hover:border-amber-500/30 rounded-xl p-3 sm:p-3.5 mb-3 cursor-pointer transition-all group flex flex-col gap-3"
      >
        {/* Top Sub-Row: Title & CTA Button */}
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <ListChecks className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-gray-200 tracking-wide group-hover:text-amber-300 transition-colors">
                  Tasks & Booster Passes
                </span>
                <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Daily Free Allowances
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-normal truncate mt-0.5">
                Complete quests, claim daily booster passes & bonus rewards
              </p>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); sound.playTabSwitch(); setActiveTab('missions'); }}
            className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-gray-200 text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 shrink-0 group-hover:border-amber-500/40"
          >
            <span>Open Tasks & Missions</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Bottom Sub-Row: 4 Spacious Allowance Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 w-full pt-2 border-t border-white/[0.06]">
          {/* Stat 1: EN Free Packs */}
          <div className="bg-black/40 hover:bg-black/60 border border-white/[0.06] rounded-lg p-2 sm:p-2.5 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Ticket className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-[11px] font-semibold text-gray-300 whitespace-nowrap">Free EN Packs</span>
            </div>
            <span className="text-xs sm:text-sm font-bold font-mono text-sky-400 pl-1">{dailyFreePacks.english}/5</span>
          </div>

          {/* Stat 2: JP Free Packs */}
          <div className="bg-black/40 hover:bg-black/60 border border-white/[0.06] rounded-lg p-2 sm:p-2.5 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Ticket className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-[11px] font-semibold text-gray-300 whitespace-nowrap">Free JP Packs</span>
            </div>
            <span className="text-xs sm:text-sm font-bold font-mono text-indigo-400 pl-1">{dailyFreePacks.japanese}/5</span>
          </div>

          {/* Stat 3: Saved Packs */}
          <div className="bg-black/40 hover:bg-black/60 border border-white/[0.06] rounded-lg p-2 sm:p-2.5 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Archive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-semibold text-gray-300 whitespace-nowrap">Saved Packs</span>
            </div>
            <span className="text-xs sm:text-sm font-bold font-mono text-amber-300 pl-1">{totalSavedPacks}</span>
          </div>

          {/* Stat 4: Daily Cash */}
          <div className="bg-black/40 hover:bg-black/60 border border-white/[0.06] rounded-lg p-2 sm:p-2.5 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-semibold text-gray-300 whitespace-nowrap">Opening Fund</span>
            </div>
            <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400 truncate pl-1">
              {dailyCash >= 99999999 ? '∞' : `$${dailyCash.toFixed(0)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Action Station & Pack Progress */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 border-t border-white/[0.08]">
        {/* Progress Gauge */}
        <div className="flex items-center gap-3 bg-black/40 border border-white/[0.06] rounded-xl px-3.5 py-2 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-gray-400">{packStage === 'unopened' ? 'Ready to Rip:' : 'Revealed:'}</span>
            <span className="font-mono text-white font-bold">{revealedCount}</span>
            <span className="text-gray-600">/</span>
            <span className="font-mono text-gray-400">{totalCardsCount}</span>
          </div>
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden shrink-0">
            <div 
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleResetStats}
            disabled={isLoadingPack}
            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="Reset session opening statistics"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isLoadingPack ? 'animate-spin' : ''}`} />
            <span>Reset</span>
          </button>

          <button
            onClick={() => { void handleResetPack(); }}
            disabled={isLoadingPack}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs sm:text-sm tracking-wide shadow-[0_4px_16px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.5)] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoadingPack && <Loader2 className="w-4 h-4 animate-spin" />}
            <Zap className="w-4 h-4 text-black fill-black" />
            <span>Open Another Pack</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PackOpeningConsole;
