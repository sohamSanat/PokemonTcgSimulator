import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, TrendingUp } from 'lucide-react';
import type { Card } from '../../binder/types';
import type { LabelStyle } from '../types';

interface GradingResultCardProps {
  activeCard: Card;
  certNumber: string;
  finalGrade: number | string;
  subgrades: { centering: number; surface: number; corners: number; edges: number };
  valueMultiplier: number;
  labelStyle: LabelStyle;
  onViewVault: () => void;
  onGradeAnother: () => void;
}

/**
 * Grading Result Card
 * 
 * Displays the final PSA grade and subgrades to the user after the
 * encapsulation sequence is complete.
 */
export default function GradingResultCard({
  activeCard,
  certNumber,
  finalGrade,
  subgrades,
  valueMultiplier,
  labelStyle,
  onViewVault,
  onGradeAnother
}: GradingResultCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.85 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ type: 'spring', damping: 18 }}
      className="flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center py-6"
    >
      {/* The Official PSA Slab */}
      <div className="relative w-72 sm:w-80 aspect-[60/98] rounded-[24px] bg-gradient-to-b from-[#2a2d38]/90 via-[#181a24]/95 to-[#12131a] p-3 border-4 border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_50px_rgba(239,68,68,0.4)] flex flex-col items-center justify-between overflow-hidden shrink-0 group">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none z-20" />

        {/* Top Certification Header with Custom Label Style */}
        <div className={`w-full rounded-xl p-2.5 border shadow-md z-10 flex items-center justify-between gap-2 ${
          labelStyle === 'gold_30th'
            ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-amber-300 text-black'
            : labelStyle === 'black_diamond'
            ? 'bg-gradient-to-r from-gray-900 via-black to-gray-900 border-cyan-400 text-white'
            : labelStyle === 'emerald_prism'
            ? 'bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-700 border-emerald-300 text-white'
            : 'bg-gradient-to-r from-red-700 via-red-600 to-red-700 border-white/40 text-white'
        }`}>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 font-black text-xs">
              <span>PSA</span>
              <span className="text-[9px] font-mono uppercase opacity-90">{labelStyle === 'gold_30th' ? '★ 30TH ANNIV' : labelStyle === 'black_diamond' ? '◈ REGISTRY' : labelStyle === 'emerald_prism' ? '✦ PRISM' : 'CERTIFIED'}</span>
            </div>
            <div className="text-[10px] font-bold truncate">{activeCard.name.split('—')[0]}</div>
            <div className="text-[9px] font-mono opacity-80">CERT #{certNumber}</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-black/40 border border-white/20 flex flex-col items-center justify-center font-black">
            <span className="text-[8px] leading-none text-gray-300">GRADE</span>
            <span className="text-lg leading-none text-white">{finalGrade}</span>
          </div>
        </div>

        {/* Inner Card Well & Holographic Reflection */}
        <div className="w-full flex-1 my-2 rounded-xl overflow-hidden border border-white/10 bg-black relative flex items-center justify-center shadow-inner group-hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.1)] transition-all">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-10" />
          <img src={activeCard.imageUrl} alt={activeCard.name} className="w-full h-full object-contain" />
        </div>

        {/* Slab Footer Label */}
        <div className="w-full bg-black/60 rounded-lg py-1.5 px-2.5 border border-white/10 flex items-center justify-between text-[9px] font-mono text-gray-400 z-10">
          <span className="flex items-center gap-1 text-emerald-400 font-bold"><ShieldCheck className="w-3 h-3" /> VERIFIED</span>
          <span>SUBGRADES: {subgrades.centering}/{subgrades.surface}/{subgrades.corners}/{subgrades.edges}</span>
        </div>
      </div>

      {/* Grading Report & Portfolio Appreciation */}
      <div className="max-w-md w-full bg-[#13141d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Official PSA Grading Report
          </div>
          <span className="font-mono text-xs text-gray-400">#{certNumber}</span>
        </div>

        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-2.5">
            <span>PSA {finalGrade}</span>
            <span className={`text-base font-extrabold px-2.5 py-0.5 rounded-full ${
              finalGrade === 10 ? 'bg-amber-500 text-black' : 'bg-red-500/20 text-red-300 border border-red-500/40'
            }`}>
              {finalGrade === 10 ? 'GEM MINT 10' : finalGrade === 9 ? 'MINT 9' : 'NEAR MINT 8'}
            </span>
          </h3>
          <p className="text-xs text-gray-300 mt-1">
            Congratulations! This card has completed all 5 inspection stages and is permanently sealed in your authentic PSA registry slab.
          </p>
        </div>

        {/* Value Appreciation Breakdown */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-[#14181c] border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
            <span>Raw Ungraded Value:</span>
            <span className="font-mono">${(activeCard.psaDetails?.originalValue || activeCard.currentPrice / valueMultiplier).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-black text-emerald-300 pt-2 border-t border-emerald-500/30">
            <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-400" /> PSA {finalGrade} Market Value:</span>
            <span className="font-mono text-lg">${activeCard.currentPrice.toFixed(2)} ({valueMultiplier}x Multiplier)</span>
          </div>
        </div>

        {/* Subgrades Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
            <span className="text-gray-400">Centering:</span>
            <span className="font-mono font-bold text-white">{subgrades.centering.toFixed(1)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
            <span className="text-gray-400">Surface:</span>
            <span className="font-mono font-bold text-white">{subgrades.surface.toFixed(1)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
            <span className="text-gray-400">Corners:</span>
            <span className="font-mono font-bold text-white">{subgrades.corners.toFixed(1)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
            <span className="text-gray-400">Edges:</span>
            <span className="font-mono font-bold text-white">{subgrades.edges.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onViewVault}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>View in PSA Vault</span>
          </button>
          <button
            onClick={onGradeAnother}
            className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-xs transition-all cursor-pointer"
          >
            Grade Another
          </button>
        </div>
      </div>
    </motion.div>
  );
}
