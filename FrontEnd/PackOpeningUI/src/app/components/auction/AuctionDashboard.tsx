import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Clock, Trophy, Zap, Coins, Flame, ArrowLeft, Star, SlidersHorizontal, Activity, Sparkles } from 'lucide-react';
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
  onPlaceBid: (increment: number) => void;
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
  onPlaceBid,
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

  const radius = 125;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = maxTimeSeconds > 0 ? circumference - (timeLeftSeconds / maxTimeSeconds) * circumference : 0;

  return (
    <div className={cn(
      "flex flex-col lg:flex-row h-full rounded-3xl overflow-hidden bg-slate-900/40 backdrop-blur-xl border transition-all duration-300 shadow-2xl relative",
      theme.cardBorder
    )}>
      {/* Subtle grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* LEFT PANEL: THE MAIN STAGE FOR THIS SECTION */}
      <div className="flex-1 min-w-[300px] flex flex-col items-center justify-between p-6 relative z-10">
        
        {/* Section Header Badge */}
        <div className="w-full flex flex-col items-center text-center mb-4">
          <div className={cn("px-3.5 py-1.5 rounded-full border mb-2.5 inline-flex items-center gap-2 shadow-sm", theme.badgeBg, theme.badgeBorder)}>
            {theme.icon}
            <span className={cn("text-xs font-extrabold tracking-widest uppercase", theme.badgeText)}>
              {title} • LOT #{lotNumber}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight line-clamp-1">{currentCard.name}</h3>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-0.5">{subtitle} • {currentCard.title}</p>
        </div>

        {/* 3D Holographic Card + Progress Ring */}
        <div className="relative flex items-center justify-center w-[300px] h-[300px] my-2 perspective-[1000px]">
          {/* Radial Progress Ring */}
          <svg className="absolute w-[290px] h-[290px] -rotate-90 pointer-events-none" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r={radius} fill="none" stroke="rgba(30, 41, 59, 0.6)" strokeWidth="4" />
            <circle 
              cx="140" cy="140" r={radius} 
              fill="none" 
              stroke={`url(#${theme.ringGradientId})`} 
              strokeWidth="7" 
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
          <div className="absolute top-2 w-full flex justify-center pointer-events-none z-20">
            <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60 shadow-lg">
              <Clock className={cn("w-3.5 h-3.5 animate-pulse", theme.badgeText)} />
              <span className="font-mono text-sm text-slate-100 font-semibold tracking-wider">{formatTime(timeLeftSeconds)}</span>
            </div>
          </div>

          {/* Card Image */}
          <motion.div 
            className="relative w-[165px] h-[230px] rounded-xl overflow-hidden shadow-2xl border border-slate-600/60 bg-slate-800 cursor-grab active:cursor-grabbing z-10 flex items-center justify-center"
            style={{ rotateX: rotationX, rotateY: rotationY, transformStyle: "preserve-3d" }}
            animate={{ rotateX: rotationX, rotateY: rotationY, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-60 z-20 pointer-events-none mix-blend-overlay" />
            <img src={currentCard.img} alt={currentCard.name} className="w-full h-full object-cover" />
          </motion.div>
        </div>

        {/* Current Bid Display */}
        <div className="mt-4 flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-[0.25em] text-slate-400 uppercase mb-1">Current Highest Bid</span>
          <motion.div 
            key={currentBid}
            initial={{ scale: 1.2, color: "#4ade80", y: -2 }}
            animate={{ scale: 1, color: theme.glowText, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="text-4xl font-extrabold tracking-tight"
            style={{ textShadow: `0 0 25px ${theme.cardGlow}` }}
          >
            ${currentBid.toLocaleString()}
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL: LIVE BIDS FEED & CONTROLS FOR THIS SECTION */}
      <div className="w-full lg:w-[290px] xl:w-[310px] flex flex-col bg-slate-950/50 border-t lg:border-t-0 lg:border-l border-slate-700/50 relative z-10">
        <div className="p-3.5 border-b border-slate-700/50 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className={cn("w-4 h-4", theme.badgeText)} />
            <h4 className="font-mono text-xs font-bold tracking-widest text-slate-200 uppercase">
              {type === 'expensive' ? 'Grail Live Feed' : 'Blitz Live Feed'}
            </h4>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 uppercase">Live</span>
          </div>
        </div>

        {/* Bids List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 flex flex-col justify-end min-h-[220px] max-h-[280px] lg:max-h-none relative" style={{ scrollbarWidth: 'thin' }}>
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-10" />
          
          <AnimatePresence initial={false}>
            {bids.slice(-12).map((bid, i, arr) => {
              const isLatest = i === arr.length - 1;
              const isUser = bid.user === 'YOU';
              return (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg border font-mono text-xs transition-colors",
                    isLatest 
                      ? isUser 
                        ? cn("bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-sm")
                        : cn(type === 'expensive' ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-cyan-500/15 border-cyan-500/40 text-cyan-300")
                      : "bg-slate-800/40 border-slate-700/50 text-slate-300"
                  )}
                >
                  <span className={cn("tracking-wider truncate max-w-[150px]", isLatest && "font-bold", isUser && "text-purple-300 font-extrabold")}>
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
        <div className="p-3.5 bg-slate-950/80 border-t border-slate-700/50 backdrop-blur-md">
          <div className="flex gap-1.5 mb-2.5">
            {bidIncrements.map((inc) => (
              <button 
                key={inc}
                onClick={() => onPlaceBid(inc)}
                disabled={timeLeftSeconds <= 0}
                className="flex-1 py-2 rounded-lg bg-slate-800/80 border border-slate-600/70 hover:border-slate-400 hover:bg-slate-700/80 text-xs font-mono font-bold text-slate-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +${inc}
              </button>
            ))}
          </div>
          <button 
            onClick={() => onPlaceBid(defaultBidIncrement)}
            disabled={timeLeftSeconds <= 0}
            className={cn(
              "w-full py-3 rounded-lg font-bold tracking-[0.15em] uppercase text-xs transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-md",
              theme.btnBg, theme.btnHover, theme.btnText
            )}
          >
            <Coins className="w-4 h-4 group-hover:scale-110 transition-transform" />
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

  const [expensiveLot, setExpensiveLot] = useState<AuctionLotState>(() => {
    const initCard = pools.expensive[0] || DUMMY_CARDS.expensive[0];
    const startPrice = Math.max(1, Math.floor(initCard.price * 0.5));
    return {
      cardIndex: 0,
      currentBid: startPrice,
      timeLeftMs: 120000,
      maxTimeMs: 120000,
      bids: Array.from({ length: 4 }).map((_, i) => ({
        id: Date.now() - (4 - i) * 1000,
        user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
        amount: startPrice - (4 - i) * 10,
        time: Date.now() - (4 - i) * 1000,
      }))
    };
  });

  const [normalLot, setNormalLot] = useState<AuctionLotState>(() => {
    const initCard = pools.normal[0] || DUMMY_CARDS.normal[0];
    return {
      cardIndex: 0,
      currentBid: 1,
      timeLeftMs: 15000,
      maxTimeMs: 15000,
      bids: Array.from({ length: 2 }).map((_, i) => ({
        id: Date.now() - (2 - i) * 500,
        user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
        amount: 1 + i * 2,
        time: Date.now() - (2 - i) * 500,
      }))
    };
  });

  // --- BACKGROUND ENGINE 1: GRAIL LOTS (Expensive >= $100, 50% start price, 120s timer) ---
  useEffect(() => {
    const timer = setInterval(() => {
      setExpensiveLot((prev) => {
        if (prev.timeLeftMs <= 1000) {
          const nextIdx = prev.cardIndex + 1;
          const nextCard = pools.expensive[nextIdx % pools.expensive.length] || DUMMY_CARDS.expensive[0];
          const startPrice = Math.max(1, Math.floor(nextCard.price * 0.5));
          const initBids = Array.from({ length: 4 }).map((_, i) => ({
            id: Date.now() - (4 - i) * 1000,
            user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
            amount: startPrice - (4 - i) * 10,
            time: Date.now() - (4 - i) * 1000,
          }));
          return {
            cardIndex: nextIdx,
            currentBid: startPrice,
            timeLeftMs: 120000,
            maxTimeMs: 120000,
            bids: initBids
          };
        }

        if (Math.random() < 0.35) {
          const increment = Math.floor(Math.random() * 4 + 1) * 10;
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

  // --- BACKGROUND ENGINE 2: BLITZ $1 STARTS (< $100 cards, $1 start, 15s duration, rapid bids) ---
  useEffect(() => {
    const timer = setInterval(() => {
      setNormalLot((prev) => {
        if (prev.timeLeftMs <= 250) {
          const nextIdx = prev.cardIndex + 1;
          return {
            cardIndex: nextIdx,
            currentBid: 1,
            timeLeftMs: 15000,
            maxTimeMs: 15000,
            bids: []
          };
        }

        if (Math.random() < 0.80) {
          const increment = Math.floor(Math.random() * 3 + 1);
          const newAmount = prev.currentBid + increment;
          const newBid = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
            amount: newAmount,
            time: Date.now(),
          };
          return {
            ...prev,
            timeLeftMs: prev.timeLeftMs - 250,
            currentBid: newAmount,
            bids: [...prev.bids, newBid].slice(-30)
          };
        }

        return {
          ...prev,
          timeLeftMs: prev.timeLeftMs - 250
        };
      });
    }, 250);
    return () => clearInterval(timer);
  }, [pools.normal]);

  const handlePlayerBid = (type: 'expensive' | 'normal', increment: number) => {
    const activeLot = type === 'expensive' ? expensiveLot : normalLot;
    if (activeLot.timeLeftMs <= 0) return;
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

  const expensiveCard = pools.expensive[expensiveLot.cardIndex % pools.expensive.length] || DUMMY_CARDS.expensive[0];
  const normalCard = pools.normal[normalLot.cardIndex % pools.normal.length] || DUMMY_CARDS.normal[0];

  return (
    <div className="absolute inset-0 z-50 bg-[#050914] text-slate-200 font-sans overflow-y-auto selection:bg-cyan-500/30 flex flex-col items-center justify-start">
      
      {/* Ambient background glow effects */}
      <div className="absolute top-[-15%] left-[-10%] w-[45vw] h-[45vw] bg-amber-900/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] bg-cyan-900/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] left-[50%] translate-x-[-50%] w-[35vw] h-[35vw] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[1920px] h-full min-h-[850px] p-6 flex flex-col gap-6 relative z-10">
        
        {/* HEADER */}
        <header className="flex-none flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors border border-slate-700 text-slate-300 hover:text-white shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-purple-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 uppercase">
                Nexus Dual Auction Arena
              </h1>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>2 SIMULTANEOUS SECTIONS LIVE • EXPENSIVE &amp; LESS EXPENSIVE CARDS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Switcher */}
            <div className="flex bg-slate-950/80 rounded-xl p-1 border border-slate-700/60 shadow-inner">
              <button 
                onClick={() => setViewMode('both')}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2",
                  viewMode === 'both' ? "bg-purple-500/25 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.25)]" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                <span>Dual View (Both Sections)</span>
              </button>
              <button 
                onClick={() => setViewMode('expensive_only')}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2",
                  viewMode === 'expensive_only' ? "bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Expensive Only</span>
              </button>
              <button 
                onClick={() => setViewMode('normal_only')}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2",
                  viewMode === 'normal_only' ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.25)]" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Less Expensive Only</span>
              </button>
            </div>

            <div className="h-10 w-px bg-slate-700/60 hidden sm:block" />

            <div className="flex flex-col items-end">
              <span className="text-[10px] tracking-[0.2em] text-slate-400 font-mono uppercase">Wallet Balance</span>
              <span className="text-base font-mono text-slate-100 font-bold">$128,450.00</span>
            </div>
          </div>
        </header>

        {/* CONTENT GRID: SHOWS BOTH SECTIONS OR SINGLE FOCUSED SECTION */}
        <div className={cn(
          "flex-1 grid gap-6 min-h-0",
          viewMode === 'both' ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
        )}>
          {/* SECTION 1: EXPENSIVE CARDS ARENA (Grail Lots >= $100) */}
          {(viewMode === 'both' || viewMode === 'expensive_only') && (
            <div className="h-full min-h-[550px]">
              <AuctionLotSection
                type="expensive"
                title="Expensive Cards Arena"
                subtitle="Grail Lots (≥ $100) • 50% Start"
                lotNumber={412 + expensiveLot.cardIndex}
                currentCard={expensiveCard}
                currentBid={expensiveLot.currentBid}
                timeLeftSeconds={Math.max(0, Math.ceil(expensiveLot.timeLeftMs / 1000))}
                maxTimeSeconds={Math.max(1, Math.ceil(expensiveLot.maxTimeMs / 1000))}
                bids={expensiveLot.bids}
                onPlaceBid={(increment) => handlePlayerBid('expensive', increment)}
                bidIncrements={[10, 25, 50]}
                defaultBidIncrement={50}
                theme={{
                  badgeBg: "bg-amber-500/20",
                  badgeText: "text-amber-400",
                  badgeBorder: "border-amber-500/50",
                  cardBorder: "border-amber-500/40 hover:border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.12)]",
                  cardGlow: "rgba(245, 158, 11, 0.4)",
                  btnBg: "bg-gradient-to-r from-amber-500 to-yellow-500",
                  btnHover: "hover:from-amber-400 hover:to-yellow-400",
                  btnText: "text-slate-950",
                  ringGradientId: "amber-section-glow",
                  ringColors: ["#fbbf24", "#f59e0b"],
                  icon: <Trophy className="w-4 h-4 text-amber-400" />,
                  glowText: "#fbbf24"
                }}
              />
            </div>
          )}

          {/* SECTION 2: LESS EXPENSIVE CARDS ARENA (Blitz $1 Starts < $100) */}
          {(viewMode === 'both' || viewMode === 'normal_only') && (
            <div className="h-full min-h-[550px]">
              <AuctionLotSection
                type="normal"
                title="Less Expensive Cards Arena"
                subtitle="Blitz Starts (< $100) • $1 Start"
                lotNumber={824 + normalLot.cardIndex}
                currentCard={normalCard}
                currentBid={normalLot.currentBid}
                timeLeftSeconds={Math.max(0, Math.ceil(normalLot.timeLeftMs / 1000))}
                maxTimeSeconds={Math.max(1, Math.ceil(normalLot.maxTimeMs / 1000))}
                bids={normalLot.bids}
                onPlaceBid={(increment) => handlePlayerBid('normal', increment)}
                bidIncrements={[1, 5, 10]}
                defaultBidIncrement={5}
                theme={{
                  badgeBg: "bg-cyan-500/20",
                  badgeText: "text-cyan-400",
                  badgeBorder: "border-cyan-500/50",
                  cardBorder: "border-cyan-500/40 hover:border-cyan-500/60 shadow-[0_0_35px_rgba(34,211,238,0.12)]",
                  cardGlow: "rgba(34, 211, 238, 0.4)",
                  btnBg: "bg-gradient-to-r from-cyan-500 to-blue-500",
                  btnHover: "hover:from-cyan-400 hover:to-blue-400",
                  btnText: "text-slate-950",
                  ringGradientId: "cyan-section-glow",
                  ringColors: ["#22d3ee", "#3b82f6"],
                  icon: <Zap className="w-4 h-4 text-cyan-400" />,
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
