import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Clock, Trophy, Zap, Coins, ArrowLeft, Star, SlidersHorizontal, Activity, Sparkles, TrendingUp, TrendingDown, Award, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getVendorAuctionPools, type AuctionPoolCard } from '../../services/auctionVendorPools';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Bid {
  id: number;
  user: string;
  amount: number;
  time: number;
}

interface AuctionLotState {
  cardIndex: number;
  currentBid: number;
  timeLeftMs: number;
  maxTimeMs: number;
  bids: Bid[];
  status: 'active' | 'sold';
  soldTimeLeftMs: number;
  winner: string;
  finalPrice: number;
  dealCeilingRatio?: number;
}

const MOCK_USERS = [
  "PokeFan99", "TCG_Master", "AshKetchum", "GaryOak", "MistyWater", 
  "BrockRock", "PikaPal", "CharizardLover", "SnorlaxSleeps", "GengarGhost", 
  "EeveeEvolution", "MewtwoStrikes", "RocketGrunt", "Red", "Blue"
];

const DUMMY_CARDS = {
  expensive: [
    { name: "Charizard V (Alt Art)", price: 220, color: "amber", title: "Special Art Rare • PSA 10 GEM MINT", img: "https://images.pokemontcg.io/swsh9/154_hires.png" },
    { name: "Giratina V (Alt Art)", price: 450, color: "yellow", title: "Special Art Rare • PSA 10", img: "https://images.pokemontcg.io/swsh11/186_hires.png" },
    { name: "Umbreon VMAX (Alt Art)", price: 1100, color: "blue", title: "Secret Rare • PSA 10", img: "https://images.pokemontcg.io/swsh7/215_hires.png" }
  ],
  normal: [
    { name: "Mewtwo VSTAR", price: 80, color: "purple", title: "Gold Secret Rare • NM", img: "https://images.pokemontcg.io/pgo/80_hires.png" },
    { name: "Rayquaza VMAX", price: 40, color: "emerald", title: "Trainer Gallery • NM", img: "https://images.pokemontcg.io/swsh7/218_hires.png" },
    { name: "Gengar VMAX", price: 90, color: "fuchsia", title: "Secret Rare • LP", img: "https://images.pokemontcg.io/swsh8/271_hires.png" },
    { name: "Umbreon V", price: 95, color: "indigo", title: "Alt Art • NM", img: "https://images.pokemontcg.io/swsh7/189_hires.png" },
    { name: "Sylveon VMAX", price: 75, color: "pink", title: "Alt Art • NM", img: "https://images.pokemontcg.io/swsh7/212_hires.png" }
  ]
};

interface AuctionLotSectionProps {
  type: 'expensive' | 'normal';
  title: string;
  subtitle: string;
  lotNumber: number;
  currentCard: AuctionPoolCard;
  currentBid: number;
  timeLeftSeconds: number;
  maxTimeSeconds: number;
  bids: Bid[];
  status: 'active' | 'sold';
  soldTimeLeftSeconds: number;
  winner: string;
  finalPrice: number;
  onPlaceBid: (increment: number) => void;
  onNextLot: () => void;
  onImageError?: () => void;
  bidIncrements: number[];
  defaultBidIncrement: number;
  theme: {
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    cardBorder: string;
    cardGlow: string;
    btnBg: string;
    btnHover: string;
    btnText: string;
    ringGradientId: string;
    ringColors: [string, string];
    icon: React.ReactNode;
    glowText: string;
  };
}

const AuctionLotSection: React.FC<AuctionLotSectionProps> = ({
  type,
  title,
  subtitle,
  lotNumber,
  currentCard,
  currentBid,
  timeLeftSeconds,
  maxTimeSeconds,
  bids,
  status,
  soldTimeLeftSeconds,
  winner,
  finalPrice,
  onPlaceBid,
  onNextLot,
  onImageError,
  bidIncrements,
  defaultBidIncrement,
  theme
}) => {
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotationX(-y / 10);
    setRotationY(x / 10);
  };

  const handleMouseLeave = () => {
    setRotationX(0);
    setRotationY(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = maxTimeSeconds > 0 ? circumference - (timeLeftSeconds / maxTimeSeconds) * circumference : 0;

  return (
    <div className={cn(
      "flex flex-col md:flex-row h-full rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-xl border transition-all duration-300 shadow-2xl relative min-h-0",
      theme.cardBorder
    )}>
      {/* Subtle grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      {/* OVERLAY: SOLD FINAL PRICE (Shown automatically when auction ends) */}
      <AnimatePresence>
        {status === 'sold' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center overflow-y-auto"
          >
            {/* Winner Stamp */}
            <div className={cn(
              "px-4 py-1.5 rounded-full border mb-3 font-extrabold text-xs sm:text-sm tracking-widest uppercase flex items-center gap-2 shadow-lg",
              winner === 'YOU' ? "bg-green-500/20 border-green-500 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "bg-slate-800 border-slate-600 text-slate-200"
            )}>
              {winner === 'YOU' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>🎉 YOU WON THIS AUCTION! 🎉</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>🔨 SOLD TO @{winner} 🔨</span>
                </>
              )}
            </div>

            {/* Card Title */}
            <h3 className="text-xl sm:text-2xl font-black text-white line-clamp-1">{currentCard.name}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5 mb-4 uppercase">{currentCard.title} • LOT #{lotNumber}</p>

            {/* Auction Final Sold Price Box */}
            <div className="w-full max-w-md bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 sm:p-5 mb-5 shadow-2xl flex flex-col items-center justify-center">
              <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">Auction Final Sold Price</span>
              <span className={cn("text-3xl sm:text-4xl font-black mt-1", winner === 'YOU' ? "text-green-400" : theme.badgeText)}>
                ${finalPrice.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-mono mt-2.5 uppercase tracking-wide">
                {winner === 'YOU' ? "✨ Added to your personal collection ✨" : `Acquired by @${winner}`}
              </span>
            </div>

            {/* Countdown bar to next card */}
            <div className="w-full max-w-md flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                <span>Starting next auction...</span>
                <span className="font-bold text-slate-200">{soldTimeLeftSeconds}s</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-200", theme.badgeBg)} 
                  style={{ width: `${Math.min(100, Math.max(0, (soldTimeLeftSeconds / (type === 'expensive' ? 6 : 5)) * 100))}%` }} 
                />
              </div>
              <button 
                onClick={onNextLot}
                className={cn(
                  "mt-2 w-full py-2.5 rounded-xl font-bold tracking-wider text-xs uppercase transition-all flex items-center justify-center gap-2 shadow-md active:scale-95",
                  theme.btnBg, theme.btnHover, theme.btnText
                )}
              >
                <span>Skip to Next Auction Now ➔</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 1. MOBILE-OPTIMIZED COMPACT STAGE (< md screens)                          */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col flex-1 min-h-0 p-3 z-10 gap-2.5 overflow-y-auto">
        
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2 shrink-0 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={cn("px-2.5 py-1 rounded-full border inline-flex items-center gap-1 text-[10px] shrink-0", theme.badgeBg, theme.badgeBorder)}>
              {theme.icon}
              <span className={cn("font-extrabold tracking-wider uppercase", theme.badgeText)}>
                LOT #{lotNumber}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate">{currentCard.name}</h3>
          </div>
          <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-700/60 shrink-0">
            <Clock className={cn("w-3 h-3 animate-pulse", theme.badgeText)} />
            <span className="font-mono text-xs font-bold text-slate-100">{formatTime(timeLeftSeconds)}</span>
          </div>
        </div>

        {/* Side-by-Side Card & Live Price Stage */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 shadow-lg shrink-0">
          
          {/* Card Image Thumbnail */}
          <motion.div 
            className="w-[110px] h-[154px] sm:w-[130px] sm:h-[182px] shrink-0 rounded-lg overflow-hidden shadow-2xl border border-slate-600/70 bg-slate-800 relative cursor-grab active:cursor-grabbing"
            style={{ rotateX: rotationX, rotateY: rotationY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-60 pointer-events-none mix-blend-overlay" />
            <img 
              src={currentCard.img} 
              alt={currentCard.name} 
              className="w-full h-full object-cover" 
              onError={() => {
                if (onImageError) onImageError();
                else onNextLot();
              }}
            />
          </motion.div>

          {/* Price & Market Value Breakdown */}
          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block">Current Highest Bid</span>
              <motion.div 
                key={currentBid}
                initial={{ scale: 1.12, color: "#4ade80" }}
                animate={{ scale: 1, color: theme.glowText }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mt-0.5"
                style={{ textShadow: `0 0 15px ${theme.cardGlow}` }}
              >
                ${currentBid.toLocaleString()}
              </motion.div>
            </div>

            {/* Live Lot Activity Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 my-1.5 flex items-center justify-between text-[10px] font-mono text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span>Active Lot #{lotNumber}</span>
              </span>
              <span className={cn("font-extrabold tracking-wider", theme.badgeText)}>{status.toUpperCase()}</span>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full space-y-1">
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-200", theme.badgeBg)} 
                  style={{ width: `${Math.min(100, Math.max(0, (timeLeftSeconds / maxTimeSeconds) * 100))}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Feed & Bid Action Ticker (Mobile) */}
        <div className="flex flex-col flex-1 min-h-[150px] bg-slate-950/70 rounded-xl border border-slate-800/90 overflow-hidden shrink-0">
          <div className="px-2.5 py-1.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <Terminal className={cn("w-3.5 h-3.5", theme.badgeText)} />
              <span className="font-mono text-[10px] font-bold tracking-widest text-slate-200 uppercase">
                {type === 'expensive' ? 'Grail Live Feed' : 'Blitz Live Feed'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-mono text-slate-400 uppercase">Live</span>
            </div>
          </div>

          {/* Compact Feed List (Last 4 Bids) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 flex flex-col justify-end min-h-[85px]" style={{ scrollbarWidth: 'thin' }}>
            <AnimatePresence initial={false}>
              {bids.slice(-4).map((bid, i, arr) => {
                const isLatest = i === arr.length - 1;
                const isUser = bid.user === 'YOU';
                return (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex items-center justify-between px-2 py-1 rounded border font-mono text-[11px] transition-colors shrink-0",
                      isLatest 
                        ? isUser 
                          ? cn("bg-purple-500/20 border-purple-500/50 text-purple-200")
                          : cn(type === 'expensive' ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-cyan-500/15 border-cyan-500/40 text-cyan-300")
                        : "bg-slate-800/40 border-slate-700/50 text-slate-300"
                    )}
                  >
                    <span className={cn("truncate max-w-[140px]", isLatest && "font-bold", isUser && "text-purple-300 font-extrabold")}>
                      {bid.user}
                    </span>
                    <span className={cn("font-bold", isLatest ? (isUser ? "text-purple-200" : theme.badgeText) : "text-slate-400")}>
                      ${bid.amount.toLocaleString()}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Bid Buttons Footer */}
          <div className="p-2 bg-slate-950 border-t border-slate-800 shrink-0">
            <div className="flex gap-1.5 mb-1.5">
              {bidIncrements.map((inc) => (
                <button 
                  key={inc}
                  onClick={() => onPlaceBid(inc)}
                  disabled={timeLeftSeconds <= 0 || status === 'sold'}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-400 text-[11px] font-mono font-bold text-slate-200 transition-all active:scale-95 disabled:opacity-40"
                >
                  +${inc}
                </button>
              ))}
            </div>
            <button 
              onClick={() => onPlaceBid(defaultBidIncrement)}
              disabled={timeLeftSeconds <= 0 || status === 'sold'}
              className={cn(
                "w-full py-2 rounded-lg font-bold tracking-wider uppercase text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-40",
                theme.btnBg, theme.btnHover, theme.btnText
              )}
            >
              <Coins className="w-3.5 h-3.5" />
              Place Bid (+${defaultBidIncrement})
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP/TABLET FULL HOLO STAGE (>= md screens)                         */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-1 min-w-0 flex-col items-center justify-between p-4 relative z-10 overflow-hidden min-h-0">
        
        {/* Section Header Badge */}
        <div className="w-full flex flex-col items-center text-center shrink-0">
          <div className={cn("px-3 py-1 rounded-full border mb-1.5 inline-flex items-center gap-1.5 shadow-sm text-xs", theme.badgeBg, theme.badgeBorder)}>
            {theme.icon}
            <span className={cn("font-extrabold tracking-widest uppercase", theme.badgeText)}>
              {title} • LOT #{lotNumber}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-1">{currentCard.name}</h3>
          <p className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-wider line-clamp-1 mt-0.5">{subtitle} • {currentCard.title}</p>
        </div>

        {/* 3D Holographic Card + Progress Ring */}
        <div className="relative flex items-center justify-center w-[200px] sm:w-[220px] h-[200px] sm:h-[220px] shrink-0 my-1 perspective-[1000px]">
          {/* Radial Progress Ring */}
          <svg className="absolute w-[190px] sm:w-[210px] h-[190px] sm:h-[210px] -rotate-90 pointer-events-none" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(30, 41, 59, 0.6)" strokeWidth="4" />
            <circle 
              cx="110" cy="110" r={radius} 
              fill="none" 
              stroke={`url(#${theme.ringGradientId})`} 
              strokeWidth="6" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300 ease-linear"
            />
            <defs>
              <linearGradient id={theme.ringGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={theme.ringColors[0]} />
                <stop offset="100%" stopColor={theme.ringColors[1]} />
              </linearGradient>
            </defs>
          </svg>

          {/* Time floating indicator inside circle */}
          <div className="absolute top-1 w-full flex justify-center pointer-events-none z-20">
            <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-700/60 shadow-lg">
              <Clock className={cn("w-3 h-3 animate-pulse", theme.badgeText)} />
              <span className="font-mono text-xs text-slate-100 font-semibold tracking-wider">{formatTime(timeLeftSeconds)}</span>
            </div>
          </div>

          {/* Card Image */}
          <motion.div 
            className="relative w-[120px] sm:w-[135px] h-[165px] sm:h-[188px] rounded-xl overflow-hidden shadow-2xl border border-slate-600/60 bg-slate-800 cursor-grab active:cursor-grabbing z-10 flex items-center justify-center"
            style={{ rotateX: rotationX, rotateY: rotationY, transformStyle: "preserve-3d" }}
            animate={{ rotateX: rotationX, rotateY: rotationY, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-60 z-20 pointer-events-none mix-blend-overlay" />
            <img 
              src={currentCard.img} 
              alt={currentCard.name} 
              className="w-full h-full object-cover" 
              onError={() => {
                if (onImageError) onImageError();
                else onNextLot();
              }}
            />
          </motion.div>
        </div>

        {/* Current Bid & Market Price Indicator */}
        <div className="flex flex-col items-center shrink-0 w-full">
          <span className="text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase">Current Highest Bid</span>
          <motion.div 
            key={currentBid}
            initial={{ scale: 1.15, color: "#4ade80", y: -1 }}
            animate={{ scale: 1, color: theme.glowText, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5"
            style={{ textShadow: `0 0 20px ${theme.cardGlow}` }}
          >
            ${currentBid.toLocaleString()}
          </motion.div>

          {/* Live Lot Activity Indicator */}
          <div className="flex items-center gap-2 mt-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>Competitive Live Bidding • Lot #{lotNumber}</span>
          </div>
        </div>
      </div>

      {/* Desktop Right Panel: Live Bids Feed & Controls */}
      <div className="hidden md:flex w-[250px] lg:w-[270px] xl:w-[280px] shrink-0 flex-col bg-slate-950/60 border-t md:border-t-0 md:border-l border-slate-700/50 relative z-10 min-h-0 overflow-hidden">
        <div className="p-2.5 border-b border-slate-700/50 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Terminal className={cn("w-3.5 h-3.5", theme.badgeText)} />
            <h4 className="font-mono text-[11px] font-bold tracking-widest text-slate-200 uppercase">
              {type === 'expensive' ? 'Grail Live Feed' : 'Blitz Live Feed'}
            </h4>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-mono text-slate-400 uppercase">Live</span>
          </div>
        </div>

        {/* Bids List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 flex flex-col justify-end min-h-0 relative" style={{ scrollbarWidth: 'thin' }}>
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-10" />
          
          <AnimatePresence initial={false}>
            {bids.slice(-10).map((bid, i, arr) => {
              const isLatest = i === arr.length - 1;
              const isUser = bid.user === 'YOU';
              return (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center justify-between p-1.5 rounded-lg border font-mono text-xs transition-colors shrink-0",
                    isLatest 
                      ? isUser 
                        ? cn("bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-sm")
                        : cn(type === 'expensive' ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-cyan-500/15 border-cyan-500/40 text-cyan-300")
                      : "bg-slate-800/40 border-slate-700/50 text-slate-300"
                  )}
                >
                  <span className={cn("tracking-wider truncate max-w-[130px]", isLatest && "font-bold", isUser && "text-purple-300 font-extrabold")}>
                    {bid.user}
                  </span>
                  <span className={cn("font-bold", isLatest ? (isUser ? "text-purple-200" : theme.badgeText) : "text-slate-400")}>
                    ${bid.amount.toLocaleString()}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bidding Action Area */}
        <div className="p-2.5 bg-slate-950/90 border-t border-slate-700/50 backdrop-blur-md shrink-0">
          <div className="flex gap-1.5 mb-2">
            {bidIncrements.map((inc) => (
              <button 
                key={inc}
                onClick={() => onPlaceBid(inc)}
                disabled={timeLeftSeconds <= 0 || status === 'sold'}
                className="flex-1 py-1.5 rounded-lg bg-slate-800/80 border border-slate-600/70 hover:border-slate-400 hover:bg-slate-700/80 text-xs font-mono font-bold text-slate-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +${inc}
              </button>
            ))}
          </div>
          <button 
            onClick={() => onPlaceBid(defaultBidIncrement)}
            disabled={timeLeftSeconds <= 0 || status === 'sold'}
            className={cn(
              "w-full py-2 rounded-lg font-bold tracking-[0.15em] uppercase text-xs transition-all flex items-center justify-center gap-1.5 group active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-md",
              theme.btnBg, theme.btnHover, theme.btnText
            )}
          >
            <Coins className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            Place Bid (+${defaultBidIncrement})
          </button>
        </div>
      </div>
    </div>
  );
};
export const AuctionDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [viewMode, setViewMode] = useState<'both' | 'expensive_only' | 'normal_only'>('both');
  const [pools] = useState<{ expensive: AuctionPoolCard[]; normal: AuctionPoolCard[] }>(() => getVendorAuctionPools());
  const [walletBalance, setWalletBalance] = useState<number>(128450.00);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  const brokenUrlsRef = useRef<Set<string>>(new Set());

  const getNextValidCardIndex = (pool: AuctionPoolCard[], startIdx: number): number => {
    if (!pool || pool.length === 0) return startIdx + 1;
    let idx = startIdx + 1;
    let attempts = 0;
    while (attempts < pool.length) {
      const card = pool[idx % pool.length];
      if (card && card.img && typeof card.img === 'string' && !brokenUrlsRef.current.has(card.img) && !card.img.includes('placeholder') && card.img !== 'https://images.pokemontcg.io/swsh3/19_hires.png') {
        return idx;
      }
      idx++;
      attempts++;
    }
    return startIdx + 1;
  };

  const handleImageError = (type: 'expensive' | 'normal', imgUrl?: string) => {
    if (imgUrl) {
      brokenUrlsRef.current.add(imgUrl);
    }
    handleNextLot(type);
  };

  const getExpensiveCeiling = () => {
    const roll = Math.random();
    if (roll < 0.50) return 0.55 + Math.random() * 0.25; // 55% to 80% (Underpriced steals 50% of the time!)
    if (roll < 0.80) return 0.81 + Math.random() * 0.13; // 81% to 94% (Fair deals)
    return 0.95 + Math.random() * 0.07; // 95% to 102% (Competitive bidding)
  };

  const getNormalCeiling = () => {
    const roll = Math.random();
    if (roll < 0.60) return 0.45 + Math.random() * 0.30; // 45% to 75% (HUGE UNDERPRICED STEALS 60% of the time!)
    if (roll < 0.85) return 0.76 + Math.random() * 0.16; // 76% to 92% (Fair deals)
    return 0.93 + Math.random() * 0.09; // 93% to 102% (Competitive bidding)
  };

  const [expensiveLot, setExpensiveLot] = useState<AuctionLotState>(() => {
    const initCard = pools.expensive[0] || DUMMY_CARDS.expensive[0];
    const startPrice = Math.max(1, Math.floor(initCard.price * 0.5));
    return {
      cardIndex: 0,
      currentBid: startPrice,
      timeLeftMs: 120000,
      maxTimeMs: 120000,
      bids: Array.from({ length: 3 }).map((_, i) => ({
        id: Date.now() - (3 - i) * 1000,
        user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
        amount: startPrice - (3 - i) * 10,
        time: Date.now() - (3 - i) * 1000,
      })),
      status: 'active',
      soldTimeLeftMs: 6000,
      winner: '',
      finalPrice: 0,
      dealCeilingRatio: getExpensiveCeiling()
    };
  });

  const [normalLot, setNormalLot] = useState<AuctionLotState>(() => {
    const initCard = pools.normal[0] || DUMMY_CARDS.normal[0];
    const startPrice = Math.max(1, Math.floor(initCard.price * 0.35));
    return {
      cardIndex: 0,
      currentBid: startPrice,
      timeLeftMs: 45000,
      maxTimeMs: 45000,
      bids: Array.from({ length: 2 }).map((_, i) => ({
        id: Date.now() - (2 - i) * 1000,
        user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
        amount: Math.max(1, startPrice - (2 - i) * 2),
        time: Date.now() - (2 - i) * 1000,
      })),
      status: 'active',
      soldTimeLeftMs: 5000,
      winner: '',
      finalPrice: 0,
      dealCeilingRatio: getNormalCeiling()
    };
  });

  // --- BACKGROUND ENGINE 1: GRAIL LOTS (Slabs >= $100, 50% start price, 120s timer, realistic pacing) ---
  useEffect(() => {
    const timer = setInterval(() => {
      setExpensiveLot((prev) => {
        if (prev.status === 'sold') {
          if (prev.soldTimeLeftMs <= 1000) {
            const nextIdx = getNextValidCardIndex(pools.expensive, prev.cardIndex);
            const nextCard = pools.expensive[nextIdx % pools.expensive.length] || DUMMY_CARDS.expensive[0];
            const startPrice = Math.max(1, Math.floor(nextCard.price * 0.5));
            const initBids = Array.from({ length: 3 }).map((_, i) => ({
              id: Date.now() - (3 - i) * 1000,
              user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
              amount: Math.max(1, startPrice - (3 - i) * 10),
              time: Date.now() - (3 - i) * 1000,
            }));
            return {
              cardIndex: nextIdx,
              currentBid: startPrice,
              timeLeftMs: 120000,
              maxTimeMs: 120000,
              bids: initBids,
              status: 'active',
              soldTimeLeftMs: 6000,
              winner: '',
              finalPrice: 0,
              dealCeilingRatio: getExpensiveCeiling()
            };
          }
          return {
            ...prev,
            soldTimeLeftMs: prev.soldTimeLeftMs - 1000
          };
        }

        // status === 'active'
        if (prev.timeLeftMs <= 1000) {
          const lastBid = prev.bids[prev.bids.length - 1];
          const winner = lastBid ? lastBid.user : (MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]);
          const finalPrice = prev.currentBid;
          if (winner === 'YOU') {
            setWalletBalance(b => Math.max(0, b - finalPrice));
          }
          return {
            ...prev,
            timeLeftMs: 0,
            status: 'sold',
            soldTimeLeftMs: 6000,
            winner,
            finalPrice
          };
        }

        const currentCard = pools.expensive[prev.cardIndex % pools.expensive.length] || DUMMY_CARDS.expensive[0];
        const marketPrice = currentCard.price;
        const targetCeiling = marketPrice * (prev.dealCeilingRatio ?? 0.75);

        // If the current bid reaches or exceeds the secret target ceiling for this lot, NPCs STOP bidding!
        if (prev.currentBid >= targetCeiling) {
          return {
            ...prev,
            timeLeftMs: prev.timeLeftMs - 1000
          };
        }

        const ratio = prev.currentBid / targetCeiling;
        let bidChance = 0.26;
        if (ratio >= 0.80) bidChance = 0.10;
        if (ratio >= 0.92) bidChance = 0.03;

        if (Math.random() < bidChance) {
          let increment = Math.floor(Math.random() * 3 + 1) * 10; // $10 to $30
          if (marketPrice > 1500) increment = Math.floor(Math.random() * 4 + 2) * 25; // $50 to $125
          if (prev.currentBid + increment > targetCeiling) {
            increment = Math.max(5, Math.floor(targetCeiling - prev.currentBid));
          }

          const newAmount = prev.currentBid + increment;
          const newBid = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
            amount: newAmount,
            time: Date.now(),
          };
          return {
            ...prev,
            timeLeftMs: prev.timeLeftMs - 1000,
            currentBid: newAmount,
            bids: [...prev.bids, newBid].slice(-30)
          };
        }

        return {
          ...prev,
          timeLeftMs: prev.timeLeftMs - 1000
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pools.expensive]);

  // --- BACKGROUND ENGINE 2: STANDARD ARENA ($5 - $400 hits, 35% start, 45s timer, 1s tick with ceiling) ---
  useEffect(() => {
    const timer = setInterval(() => {
      setNormalLot((prev) => {
        if (prev.status === 'sold') {
          if (prev.soldTimeLeftMs <= 1000) {
            const nextIdx = getNextValidCardIndex(pools.normal, prev.cardIndex);
            const nextCard = pools.normal[nextIdx % pools.normal.length] || DUMMY_CARDS.normal[0];
            const startPrice = Math.max(1, Math.floor(nextCard.price * 0.35));
            const initBids = Array.from({ length: 2 }).map((_, i) => ({
              id: Date.now() - (2 - i) * 1000,
              user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
              amount: Math.max(1, startPrice - (2 - i) * 2),
              time: Date.now() - (2 - i) * 1000,
            }));
            return {
              cardIndex: nextIdx,
              currentBid: startPrice,
              timeLeftMs: 45000,
              maxTimeMs: 45000,
              bids: initBids,
              status: 'active',
              soldTimeLeftMs: 5000,
              winner: '',
              finalPrice: 0,
              dealCeilingRatio: getNormalCeiling()
            };
          }
          return {
            ...prev,
            soldTimeLeftMs: prev.soldTimeLeftMs - 1000
          };
        }

        if (prev.timeLeftMs <= 1000) {
          const lastBid = prev.bids[prev.bids.length - 1];
          const winner = lastBid ? lastBid.user : (MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]);
          const finalPrice = prev.currentBid;
          if (winner === 'YOU') {
            setWalletBalance(b => Math.max(0, b - finalPrice));
          }
          return {
            ...prev,
            timeLeftMs: 0,
            status: 'sold',
            soldTimeLeftMs: 5000,
            winner,
            finalPrice
          };
        }

        const currentCard = pools.normal[prev.cardIndex % pools.normal.length] || DUMMY_CARDS.normal[0];
        const marketPrice = currentCard.price;
        const targetCeiling = marketPrice * (prev.dealCeilingRatio ?? 0.65);

        // If the current bid reaches or exceeds the secret target ceiling for this lot, NPCs STOP bidding!
        if (prev.currentBid >= targetCeiling) {
          return {
            ...prev,
            timeLeftMs: prev.timeLeftMs - 1000
          };
        }

        const ratio = prev.currentBid / targetCeiling;
        let bidChance = 0.22;
        if (ratio >= 0.80) bidChance = 0.08;
        if (ratio >= 0.92) bidChance = 0.02;

        if (Math.random() < bidChance) {
          let increment = 1;
          if (marketPrice > 150) increment = Math.floor(Math.random() * 2 + 1) * 5; // $5 to $10
          else if (marketPrice > 50) increment = Math.floor(Math.random() * 3 + 2); // $2 to $4
          else increment = Math.floor(Math.random() * 2 + 1); // $1 to $2

          if (prev.currentBid + increment > targetCeiling) {
            increment = Math.max(1, Math.floor(targetCeiling - prev.currentBid));
          }

          const newAmount = prev.currentBid + increment;
          const newBid = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
            amount: newAmount,
            time: Date.now(),
          };
          return {
            ...prev,
            timeLeftMs: prev.timeLeftMs - 1000,
            currentBid: newAmount,
            bids: [...prev.bids, newBid].slice(-30)
          };
        }

        return {
          ...prev,
          timeLeftMs: prev.timeLeftMs - 1000
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pools.normal]);

  const handlePlayerBid = (type: 'expensive' | 'normal', increment: number) => {
    const activeLot = type === 'expensive' ? expensiveLot : normalLot;
    if (activeLot.timeLeftMs <= 0 || activeLot.status === 'sold') return;
    const newBidAmount = activeLot.currentBid + increment;
    const newBid = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      user: 'YOU',
      amount: newBidAmount,
      time: Date.now(),
    };
    if (type === 'expensive') {
      setExpensiveLot((prev) => ({ ...prev, currentBid: newBidAmount, bids: [...prev.bids, newBid].slice(-30) }));
    } else {
      setNormalLot((prev) => ({ ...prev, currentBid: newBidAmount, bids: [...prev.bids, newBid].slice(-30) }));
    }
  };

  const handleNextLot = (type: 'expensive' | 'normal') => {
    if (type === 'expensive') {
      setExpensiveLot((prev) => {
        const nextIdx = getNextValidCardIndex(pools.expensive, prev.cardIndex);
        const nextCard = pools.expensive[nextIdx % pools.expensive.length] || DUMMY_CARDS.expensive[0];
        const startPrice = Math.max(1, Math.floor(nextCard.price * 0.5));
        const initBids = Array.from({ length: 3 }).map((_, i) => ({
          id: Date.now() - (3 - i) * 1000,
          user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
          amount: Math.max(1, startPrice - (3 - i) * 10),
          time: Date.now() - (3 - i) * 1000,
        }));
        return {
          ...prev,
          cardIndex: nextIdx,
          currentBid: startPrice,
          timeLeftMs: 120000,
          maxTimeMs: 120000,
          bids: initBids,
          status: 'active',
          soldTimeLeftMs: 6000,
          winner: '',
          finalPrice: 0,
          dealCeilingRatio: getExpensiveCeiling()
        };
      });
    } else {
      setNormalLot((prev) => {
        const nextIdx = getNextValidCardIndex(pools.normal, prev.cardIndex);
        const nextCard = pools.normal[nextIdx % pools.normal.length] || DUMMY_CARDS.normal[0];
        const startPrice = Math.max(1, Math.floor(nextCard.price * 0.35));
        const initBids = Array.from({ length: 2 }).map((_, i) => ({
          id: Date.now() - (2 - i) * 1000,
          user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
          amount: Math.max(1, startPrice - (2 - i) * 2),
          time: Date.now() - (2 - i) * 1000,
        }));
        return {
          ...prev,
          cardIndex: nextIdx,
          currentBid: startPrice,
          timeLeftMs: 45000,
          maxTimeMs: 45000,
          bids: initBids,
          status: 'active',
          soldTimeLeftMs: 5000,
          winner: '',
          finalPrice: 0,
          dealCeilingRatio: getNormalCeiling()
        };
      });
    }
  };

  const expensiveCard = pools.expensive[expensiveLot.cardIndex % pools.expensive.length] || DUMMY_CARDS.expensive[0];
  const normalCard = pools.normal[normalLot.cardIndex % pools.normal.length] || DUMMY_CARDS.normal[0];

  useEffect(() => {
    if (expensiveCard && (brokenUrlsRef.current.has(expensiveCard.img) || !expensiveCard.img || expensiveCard.img.includes('placeholder') || expensiveCard.img === 'https://images.pokemontcg.io/swsh3/19_hires.png')) {
      handleNextLot('expensive');
    }
  }, [expensiveLot.cardIndex, expensiveCard]);

  useEffect(() => {
    if (normalCard && (brokenUrlsRef.current.has(normalCard.img) || !normalCard.img || normalCard.img.includes('placeholder') || normalCard.img === 'https://images.pokemontcg.io/swsh3/19_hires.png')) {
      handleNextLot('normal');
    }
  }, [normalLot.cardIndex, normalCard]);

  return (
    <div className="absolute inset-0 z-50 bg-[#050914] text-slate-200 font-sans overflow-hidden flex flex-col items-center justify-start">
      
      {/* Ambient background glow effects */}
      <div className="absolute top-[-15%] left-[-10%] w-[45vw] h-[45vw] bg-amber-900/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] bg-cyan-900/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] left-[50%] translate-x-[-50%] w-[35vw] h-[35vw] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* HOW AUCTIONS WORK GUIDE MODAL */}
      <AnimatePresence>
        {showGuideModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative text-left my-auto"
            >
              <button
                onClick={() => setShowGuideModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">How Nexus Dual Auctions Work</h3>
                  <p className="text-xs text-slate-400 font-mono">Real-time competitive bidding handbook</p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/30 flex gap-3 items-start">
                  <Trophy className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-300">Grail Arena (≥ $100 Cards)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">High-end graded slabs starting at 50% of market value with a 2-minute countdown timer. Best spot for massive market steals!</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/30 flex gap-3 items-start">
                  <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-cyan-300">Standard &amp; Blitz Arena ($5 - $400 Cards)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Slabs &amp; raw binder hits starting at 35% of market value with a 45-second timer and realistic NPC pacing anchored to market price.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-500/30 flex gap-3 items-start">
                  <Coins className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-purple-300">Winning &amp; Market Value</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Click any bid button (`+$10`, `+$25`, etc.) to outbid NPC players. NPCs respect market price ceilings so items won't artificially shoot past value! If you hold the highest bid when the clock hits 0:00, you win!</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                Got It, Let's Bid! ➔
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container (Scrollable on mobile/tablet `< xl`, fixed on desktop `xl:`) */}
      <div className="w-full max-w-[1920px] h-full p-2 sm:p-4 flex flex-col gap-2.5 relative z-10 min-h-0 overflow-y-auto xl:overflow-hidden">
        
        {/* RESPONSIVE HEADER */}
        <header className="flex-none flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/70 rounded-xl shadow-lg shrink-0">
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 transition-colors border border-slate-700 text-slate-300 hover:text-white shadow-sm shrink-0"
              title="Return to Main Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-amber-400 via-purple-500 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 uppercase leading-tight truncate">
                Dual Auction Arena
              </h1>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono flex items-center gap-1 leading-none mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                <span className="truncate">LIVE BIDDING • REAL MARKET PRICES</span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-3 ml-auto">
            {/* Guide Info Button */}
            <button
              onClick={() => setShowGuideModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 flex items-center gap-1 text-[11px] font-bold transition-all shadow-sm shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            {/* View Mode Switcher (Always visible text on all screen sizes!) */}
            <div className="flex bg-slate-950/90 rounded-lg p-1 border border-slate-700/70 shadow-inner">
              <button 
                onClick={() => setViewMode('both')}
                className={cn(
                  "px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all flex items-center gap-1",
                  viewMode === 'both' ? "bg-purple-500/25 text-purple-200 border border-purple-500/50 shadow-sm" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <SlidersHorizontal className="w-3 h-3 text-purple-400 shrink-0" />
                <span>Dual</span>
              </button>
              <button 
                onClick={() => setViewMode('expensive_only')}
                className={cn(
                  "px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all flex items-center gap-1",
                  viewMode === 'expensive_only' ? "bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-sm" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Grail ($100+)</span>
              </button>
              <button 
                onClick={() => setViewMode('normal_only')}
                className={cn(
                  "px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all flex items-center gap-1",
                  viewMode === 'normal_only' ? "bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 shadow-sm" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Standard ($5-$400)</span>
              </button>
            </div>

            <div className="h-6 w-px bg-slate-700/60 hidden md:block" />

            <div className="flex flex-col items-end shrink-0 bg-slate-950/60 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-[9px] tracking-widest text-slate-400 font-mono uppercase">Wallet Balance</span>
              <span className="text-xs sm:text-sm font-mono text-slate-100 font-bold">${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </header>

        {/* CONTENT GRID: Auto-scrollable on mobile `< xl` so nothing ever cuts off, locked 100% height on desktop `xl:` */}
        <div className={cn(
          "flex-1 grid gap-3 min-h-0",
          viewMode === 'both' ? "grid-cols-1 xl:grid-cols-2 overflow-y-auto xl:overflow-hidden" : "grid-cols-1 overflow-hidden"
        )}>
          {/* SECTION 1: EXPENSIVE CARDS ARENA (Grail Lots >= $100) */}
          {(viewMode === 'both' || viewMode === 'expensive_only') && (
            <div className={cn(
              "min-h-0 overflow-hidden rounded-2xl",
              viewMode === 'both' ? "min-h-[460px] sm:min-h-[500px] xl:min-h-0 xl:h-full" : "h-full"
            )}>
              <AuctionLotSection
                type="expensive"
                title="Grail Cards Arena"
                subtitle="Grail Lots (≥ $100) • 50% Start"
                lotNumber={412 + expensiveLot.cardIndex}
                currentCard={expensiveCard}
                currentBid={expensiveLot.currentBid}
                timeLeftSeconds={Math.max(0, Math.ceil(expensiveLot.timeLeftMs / 1000))}
                maxTimeSeconds={Math.max(1, Math.ceil(expensiveLot.maxTimeMs / 1000))}
                bids={expensiveLot.bids}
                status={expensiveLot.status}
                soldTimeLeftSeconds={Math.max(0, Math.ceil(expensiveLot.soldTimeLeftMs / 1000))}
                winner={expensiveLot.winner}
                finalPrice={expensiveLot.finalPrice}
                onPlaceBid={(increment) => handlePlayerBid('expensive', increment)}
                onNextLot={() => handleNextLot('expensive')}
                onImageError={() => handleImageError('expensive', expensiveCard?.img)}
                bidIncrements={expensiveCard.price > 1500 ? [50, 100, 250] : [10, 25, 50]}
                defaultBidIncrement={expensiveCard.price > 1500 ? 100 : 50}
                theme={{
                  badgeBg: "bg-amber-500/20",
                  badgeText: "text-amber-400",
                  badgeBorder: "border-amber-500/50",
                  cardBorder: "border-amber-500/40 hover:border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.12)]",
                  cardGlow: "rgba(245, 158, 11, 0.4)",
                  btnBg: "bg-gradient-to-r from-amber-500 to-yellow-500",
                  btnHover: "hover:from-amber-400 hover:to-yellow-400",
                  btnText: "text-slate-950",
                  ringGradientId: "amber-section-glow",
                  ringColors: ["#fbbf24", "#f59e0b"],
                  icon: <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
                  glowText: "#fbbf24"
                }}
              />
            </div>
          )}

          {/* SECTION 2: STANDARD / BLITZ ARENA ($5 - $400 hits) */}
          {(viewMode === 'both' || viewMode === 'normal_only') && (
            <div className={cn(
              "min-h-0 overflow-hidden rounded-2xl",
              viewMode === 'both' ? "min-h-[460px] sm:min-h-[500px] xl:min-h-0 xl:h-full" : "h-full"
            )}>
              <AuctionLotSection
                type="normal"
                title="Standard &amp; Blitz Arena"
                subtitle="Slabs &amp; Binder Hits ($5 - $400) • 35% Start"
                lotNumber={824 + normalLot.cardIndex}
                currentCard={normalCard}
                currentBid={normalLot.currentBid}
                timeLeftSeconds={Math.max(0, Math.ceil(normalLot.timeLeftMs / 1000))}
                maxTimeSeconds={Math.max(1, Math.ceil(normalLot.maxTimeMs / 1000))}
                bids={normalLot.bids}
                status={normalLot.status}
                soldTimeLeftSeconds={Math.max(0, Math.ceil(normalLot.soldTimeLeftMs / 1000))}
                winner={normalLot.winner}
                finalPrice={normalLot.finalPrice}
                onPlaceBid={(increment) => handlePlayerBid('normal', increment)}
                onNextLot={() => handleNextLot('normal')}
                onImageError={() => handleImageError('normal', normalCard?.img)}
                bidIncrements={normalCard.price > 150 ? [10, 25, 50] : normalCard.price > 50 ? [5, 10, 25] : [1, 2, 5]}
                defaultBidIncrement={normalCard.price > 150 ? 25 : normalCard.price > 50 ? 10 : 2}
                theme={{
                  badgeBg: "bg-cyan-500/20",
                  badgeText: "text-cyan-400",
                  badgeBorder: "border-cyan-500/50",
                  cardBorder: "border-cyan-500/40 hover:border-cyan-500/60 shadow-[0_0_30px_rgba(34,211,238,0.12)]",
                  cardGlow: "rgba(34, 211, 238, 0.4)",
                  btnBg: "bg-gradient-to-r from-cyan-500 to-blue-500",
                  btnHover: "hover:from-cyan-400 hover:to-blue-400",
                  btnText: "text-slate-950",
                  ringGradientId: "cyan-section-glow",
                  ringColors: ["#22d3ee", "#3b82f6"],
                  icon: <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
                  glowText: "#22d3ee"
                }}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

