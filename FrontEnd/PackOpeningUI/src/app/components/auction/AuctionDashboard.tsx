import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Clock, Trophy, Zap, Coins, ArrowLeft, Star, SlidersHorizontal, Activity, Sparkles, TrendingUp, TrendingDown, Award, CheckCircle2, HelpCircle, X, Eye, Users, Package } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getVendorAuctionPools, type AuctionPoolCard } from '../../services/auctionVendorPools';
import { saveCollectedCard, updateCardSlabStatus, getNetReturn, spendFromNetReturn } from '../binder/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Bid {
  id: number;
  user: string;
  amount: number;
  time: number;
}

type Temperature = 'cold' | 'warm' | 'hot';

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
  insufficientFunds: boolean;
  // Realistic auction-house fields
  reservePrice: number;
  reserveMet: boolean;
  passed: boolean;
  bidderCount: number;
  watchers: number;
  temperature: Temperature;
  goingStage: '' | 'once' | 'twice';
  extendedCount: number;
  heat: number;
  bidderMaxes: number[];
}

const MOCK_USERS = [
  "PokeFan99", "TCG_Master", "AshKetchum", "GaryOak", "MistyWater", 
  "BrockRock", "PikaPal", "CharizardLover", "SnorlaxSleeps", "GengarGhost", 
  "EeveeEvolution", "MewtwoStrikes", "RocketGrunt", "Red", "Blue"
];

const DUMMY_CARDS: Record<'expensive' | 'normal', AuctionPoolCard[]> = {
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

// ── Realistic auction-house engine ───────────────────────────────────────────
// Soft-close window: if a bid lands inside this window the auction is extended,
// exactly like anti-sniping rules at real houses (PWCC / Heritage / eBay).
const SOFT_CLOSE: Record<'expensive' | 'normal', number> = { expensive: 9000, normal: 5000 };
const EXTEND_BY: Record<'expensive' | 'normal', number> = { expensive: 8000, normal: 4000 };

// Tiered bid increments that scale with the current price (real auction style).
function auctionIncrement(amount: number): number {
  if (amount < 25) return 1;
  if (amount < 100) return 5;
  if (amount < 250) return 10;
  if (amount < 500) return 25;
  if (amount < 1000) return 50;
  if (amount < 2500) return 100;
  if (amount < 5000) return 250;
  return 500;
}

// Per-lot "market heat" drives how many bidders show up and how high they'll pay.
// Most lots finish near or below market; a rare few become hype frenzies.
function drawHeat(): number {
  const r = Math.random();
  if (r < 0.30) return 0.45 + Math.random() * 0.30; // COLD  – overlooked, settles well under market
  if (r < 0.75) return 0.80 + Math.random() * 0.35; // WARM  – fair, near-market finish
  if (r < 0.93) return 1.15 + Math.random() * 0.75; // HOT   – genuine bidding war, above market
  return 1.90 + Math.random() * 1.60;               // FRENZY – hype grail, can run 2x–3.5x market
}

// Decide whether an NPC bids this tick and at what price. An NPC bids exactly one
// increment above the current price (capped at its private max) so the price
// escalates realistically instead of teleporting to the ceiling.
function decideNpcBid(prev: AuctionLotState, type: 'expensive' | 'normal'): { amount: number; extended: boolean } | null {
  const inc = auctionIncrement(prev.currentBid);
  const candidates = prev.bidderMaxes.filter((m) => m >= prev.currentBid + inc);
  if (candidates.length === 0) return null;

  const chosenMax = Math.random() < 0.7
    ? Math.max(...candidates)
    : candidates[Math.floor(Math.random() * candidates.length)];

  let amount = prev.currentBid + inc;
  if (amount > chosenMax) amount = chosenMax;

  const remaining = prev.timeLeftMs - 1000;
  const extended = remaining > 0 && remaining <= SOFT_CLOSE[type];
  return { amount, extended };
}

// Build a fresh, fully randomized lot. The hidden reserve + each bidder's private
// max valuation are what make the final price realistic and varied, not scripted.
const setupLot = (card: AuctionPoolCard, type: 'expensive' | 'normal', idx = 0): AuctionLotState => {
  const mkt = card.price || 50;
  const heat = drawHeat();

  const startFrac = type === 'expensive' ? 0.30 + Math.random() * 0.25 : 0.20 + Math.random() * 0.30;
  const startPrice = Math.max(1, Math.floor(mkt * startFrac));

  const tierBoost = mkt > 1000 ? 4 : mkt > 200 ? 2 : 0;
  let bidderCount = Math.round(1 + heat * 3 + tierBoost + Math.random() * 3);
  bidderCount = Math.max(1, Math.min(16, bidderCount));

  // Hidden seller reserve — usually below market, occasionally an confident seller asks more.
  let reserveFrac = 0.40 + Math.random() * 0.40;
  if (heat > 1.5 && Math.random() < 0.3) reserveFrac = 0.85 + Math.random() * 0.25;
  const reservePrice = Math.max(startPrice + 1, Math.floor(mkt * reserveFrac));

  // Each competing bidder gets a private willingness-to-pay centered on market*heat.
  const bidderMaxes: number[] = [];
  for (let i = 0; i < bidderCount; i++) {
    const noise = (Math.random() - 0.4) * 0.5;
    bidderMaxes.push(Math.max(startPrice + 1, Math.floor(mkt * heat * (1 + noise))));
  }
  bidderMaxes.sort((a, b) => b - a);

  const watchers = bidderCount * (2 + Math.floor(Math.random() * 5)) + Math.floor(Math.random() * 20);
  const maxTimeMs = type === 'expensive' ? 120000 : 15000;
  const inc = auctionIncrement(startPrice);
  const seedCount = Math.min(3, bidderCount);
  const initBids: Bid[] = Array.from({ length: seedCount }).map((_, i) => ({
    id: Date.now() - (seedCount - i) * 1000,
    user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
    amount: Math.max(1, startPrice - (seedCount - 1 - i) * inc),
    time: Date.now() - (seedCount - i) * 1000,
  }));

  return {
    cardIndex: idx,
    currentBid: startPrice,
    timeLeftMs: maxTimeMs,
    maxTimeMs,
    bids: initBids,
    status: 'active',
    soldTimeLeftMs: type === 'expensive' ? 6000 : 5000,
    winner: '',
    finalPrice: 0,
    insufficientFunds: false,
    reservePrice,
    reserveMet: startPrice >= reservePrice,
    passed: false,
    bidderCount,
    watchers,
    temperature: 'warm',
    goingStage: '',
    extendedCount: 0,
    heat,
    bidderMaxes,
  };
};

interface TickResult {
  state: AuctionLotState;
  won?: { price: number; card: AuctionPoolCard; grade?: string };
}

// Advance one lot by a single second. Handles live bidding escalation and the
// final "hammer" when the clock hits zero. Does NOT roll to the next lot (the
// effect does that once the post-sale countdown elapses).
const runAuctionTick = (prev: AuctionLotState, type: 'expensive' | 'normal', pool: AuctionPoolCard[]): TickResult => {
  const card = pool[prev.cardIndex % pool.length] || DUMMY_CARDS[type][0];

  if (prev.timeLeftMs <= 1000) {
    const lastBid = prev.bids[prev.bids.length - 1];
    const winner = lastBid ? lastBid.user : '';
    const finalPrice = prev.currentBid;
    const passed = !lastBid || finalPrice < prev.reservePrice;
    return {
      state: {
        ...prev,
        timeLeftMs: 0,
        status: 'sold',
        soldTimeLeftMs: prev.soldTimeLeftMs,
        winner,
        finalPrice,
        insufficientFunds: false,
        passed,
        reserveMet: !passed,
        goingStage: '',
      },
      won: winner === 'YOU' && !passed ? { price: finalPrice, card, grade: card.grade } : undefined,
    };
  }

  const dec = prev.timeLeftMs - 1000;
  const inc = auctionIncrement(prev.currentBid);
  const playerIsTop = prev.bids.length > 0 && prev.bids[prev.bids.length - 1].user === 'YOU';
  const eligibleCount = prev.bidderMaxes.filter((m) => m >= prev.currentBid + inc).length;

  let bidChance = 0.18 + prev.heat * 0.22;
  if (dec < 15000) bidChance += 0.15;
  if (dec <= SOFT_CLOSE[type]) bidChance += 0.15;
  if (playerIsTop) bidChance *= 0.65;
  if (eligibleCount <= 1) bidChance *= 0.7;
  bidChance = Math.min(0.92, bidChance);

  const now = Date.now();
  const recent = prev.bids.filter((b) => now - b.time < 12000).length;
  const temperature: Temperature = recent >= 5 ? 'hot' : recent >= 2 ? 'warm' : 'cold';

  if (Math.random() < bidChance && eligibleCount > 0) {
    const npc = decideNpcBid(prev, type);
    if (npc) {
      const newBid: Bid = {
        id: now + Math.floor(Math.random() * 1000),
        user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
        amount: npc.amount,
        time: now,
      };
      let timeLeftMs = dec;
      let maxTimeMs = prev.maxTimeMs;
      let extendedCount = prev.extendedCount;
      if (npc.extended) {
        timeLeftMs = dec + EXTEND_BY[type];
        maxTimeMs = Math.max(maxTimeMs, timeLeftMs);
        extendedCount += 1;
      }
      return {
        state: {
          ...prev,
          currentBid: npc.amount,
          bids: [...prev.bids, newBid].slice(-40),
          timeLeftMs,
          maxTimeMs,
          extendedCount,
          reserveMet: npc.amount >= prev.reservePrice,
          temperature,
          goingStage: '',
        },
      };
    }
  }

  const frac = dec / prev.maxTimeMs;
  const goingStage: AuctionLotState['goingStage'] = frac <= 0.12 ? 'twice' : frac <= 0.25 ? 'once' : '';

  return {
    state: {
      ...prev,
      timeLeftMs: dec,
      temperature,
      goingStage,
      reserveMet: prev.currentBid >= prev.reservePrice,
    },
  };
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
  passed: boolean;
  insufficientFunds: boolean;
  reserveMet: boolean;
  bidderCount: number;
  watchers: number;
  temperature: Temperature;
  goingStage: '' | 'once' | 'twice';
  extendedCount: number;
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
  passed,
  insufficientFunds,
  reserveMet,
  bidderCount,
  watchers,
  temperature,
  goingStage,
  extendedCount,
  onPlaceBid,
  onNextLot,
  onImageError,
  bidIncrements,
  defaultBidIncrement,
  theme
}) => {
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [loadedImg, setLoadedImg] = useState<string>('');
  const isImageReady = Boolean(currentCard?.img && loadedImg === currentCard.img);

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

  // Flash a "time extended" banner whenever a late bid triggers anti-sniping.
  const extRef = useRef(extendedCount);
  const [extFlash, setExtFlash] = useState(false);
  useEffect(() => {
    if (extendedCount > extRef.current) {
      extRef.current = extendedCount;
      setExtFlash(true);
      const t = setTimeout(() => setExtFlash(false), 2600);
      return () => clearTimeout(t);
    }
  }, [extendedCount]);

  const tempLabel = temperature === 'hot' ? '🔥🔥 HOT' : temperature === 'warm' ? '🔥 WARM' : '❄️ COLD';
  const tempClass = temperature === 'hot' ? 'text-rose-400' : temperature === 'warm' ? 'text-amber-400' : 'text-sky-400';

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

      {/* GOING ONCE / GOING TWICE banner */}
      {goingStage && status === 'active' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-red-600/90 border border-red-300 text-white font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse">
          🔨 Going {goingStage.toUpperCase()}...
        </div>
      )}

      {/* Anti-snipe TIME EXTENDED flash */}
      <AnimatePresence>
        {extFlash && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-amber-500/90 border border-amber-200 text-slate-950 font-bold text-[10px] sm:text-xs tracking-wide shadow-lg whitespace-nowrap"
          >
            ⏱ TIME EXTENDED — BIDDING WAR!
          </motion.div>
        )}
      </AnimatePresence>

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
              passed
                ? "bg-slate-700/40 border-slate-500 text-slate-200"
                : winner === 'YOU' ? "bg-green-500/20 border-green-500 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "bg-slate-800 border-slate-600 text-slate-200"
            )}>
              {passed ? (
                <>
                  <X className="w-4 h-4 text-slate-300" />
                  <span>🔨 PASSED — RESERVE NOT MET</span>
                </>
              ) : winner === 'YOU' ? (
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

            {/* Insufficient funds notice (red) */}
            {insufficientFunds && (
              <div className="w-full max-w-md px-4 py-2.5 rounded-xl border-2 border-red-500/70 bg-red-950/60 text-red-300 font-bold text-sm sm:text-base text-center shadow-[0_0_25px_rgba(239,68,68,0.35)] mb-1">
                You dont have enough funds to buy this card , card going to 2nd highest bidder
              </div>
            )}

            {/* Card Title */}
            <h3 className="text-xl sm:text-2xl font-black text-white line-clamp-1">{currentCard.name}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5 mb-4 uppercase">{currentCard.title} • LOT #{lotNumber}</p>

            {/* Auction Final Sold Price Box */}
            <div className="w-full max-w-md bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 sm:p-5 mb-5 shadow-2xl flex flex-col items-center justify-center">
              <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">{passed ? "High Bid (Did Not Sell)" : "Auction Final Sold Price"}</span>
              <span className={cn("text-3xl sm:text-4xl font-black mt-1", passed ? "text-slate-300" : winner === 'YOU' ? "text-green-400" : theme.badgeText)}>
                ${finalPrice.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-mono mt-2.5 uppercase tracking-wide">
                {passed
                  ? "No sale — reserve not met"
                  : winner === 'YOU' ? "✨ Added to your personal collection ✨" : `Acquired by @${winner}`}
              </span>

              {/* Reveal Market Value & Bargain percentage post-auction */}
              <div className="w-full border-t border-slate-800/80 mt-4 pt-4 flex flex-col items-center gap-1.5">
                {passed ? (
                  <div className="text-xs font-mono px-3 py-1 rounded-full border bg-slate-800/50 border-slate-700/50 text-slate-300">
                    ⚠ Lot returned to consignor — hidden reserve unmet
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-400 font-medium">Card Market Value:</span>
                      <span className="text-slate-200 font-bold">${currentCard.price.toLocaleString()}</span>
                    </div>
                    {currentCard.price !== finalPrice ? (
                      <div className={cn(
                        "text-xs font-mono px-3 py-1 rounded-full border mt-1",
                        currentCard.price > finalPrice
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      )}>
                        {currentCard.price > finalPrice
                          ? `🎉 Bargain! Won at ${Math.round(((currentCard.price - finalPrice) / currentCard.price) * 100)}% below market`
                          : `Premium: Sold at ${Math.round(((finalPrice - currentCard.price) / currentCard.price) * 100)}% above market`}
                      </div>
                    ) : (
                      <div className="text-xs font-mono px-3 py-1 rounded-full border bg-slate-800/50 border-slate-700/50 text-slate-300 mt-1">
                        🤝 Sold exactly at market value
                      </div>
                    )}
                  </>
                )}
              </div>
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

        {/* Live meta row */}
        <div className="flex items-center justify-between gap-2 text-[9px] font-mono text-slate-400 shrink-0 -mt-1">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{watchers} watching</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{bidderCount} bidding</span>
          <span className={cn("flex items-center gap-0.5 font-bold uppercase", tempClass)}>{tempLabel}</span>
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
              className={cn("w-full h-full object-cover transition-opacity duration-300", isImageReady ? "opacity-100" : "opacity-0")} 
              crossOrigin="anonymous"
              onLoad={(e) => {
                const img = e.currentTarget;
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = 8;
                  canvas.height = 8;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, 8, 8);
                    const [r, g, b] = ctx.getImageData(1, 1, 1, 1).data;
                    const isCardBack = r < 50 && g < 75 && b > 90;
                    if (isCardBack) {
                      setLoadedImg('');
                      if (onImageError) onImageError();
                      else onNextLot();
                      return;
                    }
                  }
                } catch (err) {
                  // Fallback: ignore
                }
                setLoadedImg(currentCard.img);
              }}
              onError={() => {
                setLoadedImg('');
                if (onImageError) onImageError();
                else onNextLot();
              }}
            />
            {!isImageReady && (
              <div className="absolute inset-0 bg-[#0b0e14]/95 backdrop-blur-md rounded-lg z-30 flex flex-col items-center justify-center p-2 text-center border border-white/10 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center mb-1.5 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                  <Package className="w-3.5 h-3.5 text-[#38bdf8] animate-bounce" />
                </div>
                <span className="text-[9px] font-mono font-bold text-[#38bdf8] tracking-wider uppercase leading-tight">
                  Retrieving card
                </span>
                <span className="text-[8px] font-mono text-[#94a3b8] tracking-tight uppercase">
                  from binder...
                </span>
              </div>
            )}
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
              <div className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border self-start mt-1", reserveMet ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300")}>
                {reserveMet ? "✅ Reserve Met" : "⚠ Reserve Not Met"}
              </div>
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
          <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{watchers} watching</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{bidderCount} bidding</span>
            <span className={cn("flex items-center gap-0.5 font-bold uppercase", tempClass)}>{tempLabel}</span>
          </div>
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
              className={cn("w-full h-full object-cover transition-opacity duration-300", isImageReady ? "opacity-100" : "opacity-0")} 
              crossOrigin="anonymous"
              onLoad={(e) => {
                const img = e.currentTarget;
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = 8;
                  canvas.height = 8;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, 8, 8);
                    const [r, g, b] = ctx.getImageData(1, 1, 1, 1).data;
                    const isCardBack = r < 50 && g < 75 && b > 90;
                    if (isCardBack) {
                      setLoadedImg('');
                      if (onImageError) onImageError();
                      else onNextLot();
                      return;
                    }
                  }
                } catch (err) {
                  // Fallback: ignore
                }
                setLoadedImg(currentCard.img);
              }}
              onError={() => {
                setLoadedImg('');
                if (onImageError) onImageError();
                else onNextLot();
              }}
            />
            {!isImageReady && (
              <div className="absolute inset-0 bg-[#0b0e14]/95 backdrop-blur-md rounded-xl z-30 flex flex-col items-center justify-center p-2 text-center border border-white/10 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center mb-1.5 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                  <Package className="w-3.5 h-3.5 text-[#38bdf8] animate-bounce" />
                </div>
                <span className="text-[9px] font-mono font-bold text-[#38bdf8] tracking-wider uppercase leading-tight">
                  Retrieving card
                </span>
                <span className="text-[8px] font-mono text-[#94a3b8] tracking-tight uppercase">
                  from binder...
                </span>
              </div>
            )}
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

          {/* Reserve status pill */}
          <div className={cn("text-[10px] font-mono px-2.5 py-0.5 rounded-full border mt-1.5", reserveMet ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300")}>
            {reserveMet ? "✅ Reserve Met" : "⚠ Reserve Not Met"}
          </div>

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
export const AuctionDashboard: React.FC<{ onBack: () => void; onSpendNetReturn?: (amount: number) => void }> = ({ onBack, onSpendNetReturn }) => {
  const [viewMode, setViewMode] = useState<'both' | 'expensive_only' | 'normal_only'>('both');
  const [pools] = useState<{ expensive: AuctionPoolCard[]; normal: AuctionPoolCard[] }>(() => {
    const raw = getVendorAuctionPools();
    const shuffle = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    return {
      expensive: shuffle(raw.expensive),
      normal: shuffle(raw.normal)
    };
  });
  const [walletBalance, setWalletBalance] = useState<number>(() => getNetReturn());
  const walletRef = useRef(walletBalance);
  useEffect(() => { walletRef.current = walletBalance; }, [walletBalance]);
  const [fundsAlerts, setFundsAlerts] = useState<{ id: number; cardName: string; price: number }[]>([]);
  useEffect(() => {
    if (fundsAlerts.length === 0) return;
    const timers = fundsAlerts.map((a) =>
      setTimeout(() => setFundsAlerts((prev) => prev.filter((x) => x.id !== a.id)), 9000)
    );
    return () => timers.forEach(clearTimeout);
  }, [fundsAlerts]);
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

  const validateCardImage = async (imgUrl: string): Promise<boolean> => {
    if (!imgUrl) return false;
    if (imgUrl.includes('placeholder') || imgUrl === 'https://images.pokemontcg.io/swsh3/19_hires.png') return false;
    try {
      if (imgUrl.includes('scrydex.com')) {
        try {
          const res = await fetch(imgUrl, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const buf = await res.arrayBuffer();
            if (buf.byteLength === 186316 || buf.byteLength === 350441) {
              return false; // It's the placeholder cardback!
            }
          } else {
            return false; // Verified 404 or bad status
          }
        } catch (fetchErr) {
          // If fetch fails (CORS or network down), don't immediately reject it as it might load fine in img
          console.warn("Fetch failed for scrydex check, falling back to basic loader:", fetchErr);
        }
      }
      
      // Perform regular image loading test
      return await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.src = imgUrl;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  };

  const [expensiveLot, setExpensiveLot] = useState<AuctionLotState>(() =>
    setupLot(pools.expensive[0] || DUMMY_CARDS.expensive[0], 'expensive')
  );

  const [normalLot, setNormalLot] = useState<AuctionLotState>(() =>
    setupLot(pools.normal[0] || DUMMY_CARDS.normal[0], 'normal')
  );

  // Settle a finished lot where the player ('YOU') held the top bid at hammer.
  // If the player can actually afford the winning price we deduct it from their
  // net returns and award the card. Otherwise the card is passed to the 2nd
  // highest bidder and a red insufficient-funds popup is shown.
  const settleWin = (res: TickResult): AuctionLotState => {
    if (!res.won) return res.state;
    const price = res.won.price;
    if (walletRef.current >= price) {
      spendFromNetReturn(price);
      setWalletBalance((b) => Math.max(0, b - price));
      onSpendNetReturn?.(price);
      const c = res.won!.card;
      const realMarketPrice = (c as any).marketPrice || (c as any).card?.value || (c as any).card?.marketPrice || c.price;
      const saved = saveCollectedCard({
        marketPrice: realMarketPrice,
        value: realMarketPrice,
        acquiredPrice: c.price,
        originalValue: c.price,
        pokemon: {
          id: c.id,
          name: c.name,
          marketPrice: realMarketPrice,
          value: realMarketPrice,
          images: { large: c.img },
          rarity: c.title || 'Rare'
        }
      }, 'Auction Win');
      if (c.grade && saved) updateCardSlabStatus(saved.id, c.grade);
      return res.state;
    }
    // Not enough funds → card goes to the 2nd highest bidder.
    const second = [...res.state.bids].reverse().find((b) => b.user !== 'YOU');
    const nextWinner = second ? second.user : '';
    setFundsAlerts((prev) => [...prev, { id: Date.now() + Math.random(), cardName: res.won!.card.name, price }]);
    return {
      ...res.state,
      winner: nextWinner,
      finalPrice: second ? second.amount : res.state.finalPrice,
      passed: !second,
      insufficientFunds: true,
    };
  };

  // --- BACKGROUND ENGINE 1: GRAIL LOTS (Slabs >= $100, live reserve, 120s timer) ---
  useEffect(() => {
    const timer = setInterval(() => {
      setExpensiveLot((prev) => {
        if (prev.status === 'sold') {
          if (prev.soldTimeLeftMs > 1000) {
            return { ...prev, soldTimeLeftMs: prev.soldTimeLeftMs - 1000 };
          }
          const nextIdx = getNextValidCardIndex(pools.expensive, prev.cardIndex);
          const nextCard = pools.expensive[nextIdx % pools.expensive.length] || DUMMY_CARDS.expensive[0];
          return setupLot(nextCard, 'expensive', nextIdx);
        }

        const res = runAuctionTick(prev, 'expensive', pools.expensive);
        return settleWin(res);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pools.expensive]);

  // --- BACKGROUND ENGINE 2: STANDARD ARENA ($5 - $400 hits, live reserve, 15s timer) ---
  useEffect(() => {
    const timer = setInterval(() => {
      setNormalLot((prev) => {
        if (prev.status === 'sold') {
          if (prev.soldTimeLeftMs > 1000) {
            return { ...prev, soldTimeLeftMs: prev.soldTimeLeftMs - 1000 };
          }
          const nextIdx = getNextValidCardIndex(pools.normal, prev.cardIndex);
          const nextCard = pools.normal[nextIdx % pools.normal.length] || DUMMY_CARDS.normal[0];
          return setupLot(nextCard, 'normal', nextIdx);
        }

        const res = runAuctionTick(prev, 'normal', pools.normal);
        return settleWin(res);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pools.normal]);

  const handlePlayerBid = (type: 'expensive' | 'normal', increment: number) => {
    const apply = (prev: AuctionLotState): AuctionLotState => {
      if (prev.timeLeftMs <= 0 || prev.status === 'sold') return prev;
      const newBidAmount = prev.currentBid + increment;
      const newBid: Bid = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        user: 'YOU',
        amount: newBidAmount,
        time: Date.now(),
      };
      const remaining = prev.timeLeftMs - 1000;
      const extended = remaining > 0 && remaining <= SOFT_CLOSE[type];
      let timeLeftMs = prev.timeLeftMs;
      let maxTimeMs = prev.maxTimeMs;
      let extendedCount = prev.extendedCount;
      if (extended) {
        timeLeftMs = remaining + EXTEND_BY[type];
        maxTimeMs = Math.max(maxTimeMs, timeLeftMs);
        extendedCount += 1;
      }
      const now = Date.now();
      const recent = [...prev.bids, newBid].filter((b) => now - b.time < 12000).length;
      const temperature: Temperature = recent >= 5 ? 'hot' : recent >= 2 ? 'warm' : 'cold';
      return {
        ...prev,
        currentBid: newBidAmount,
        bids: [...prev.bids, newBid].slice(-40),
        timeLeftMs,
        maxTimeMs,
        extendedCount,
        reserveMet: newBidAmount >= prev.reservePrice,
        temperature,
        goingStage: '',
      };
    };
    if (type === 'expensive') setExpensiveLot(apply);
    else setNormalLot(apply);
  };

  const handleNextLot = (type: 'expensive' | 'normal') => {
    if (type === 'expensive') {
      setExpensiveLot((prev) => {
        const nextIdx = getNextValidCardIndex(pools.expensive, prev.cardIndex);
        const nextCard = pools.expensive[nextIdx % pools.expensive.length] || DUMMY_CARDS.expensive[0];
        return setupLot(nextCard, 'expensive', nextIdx);
      });
    } else {
      setNormalLot((prev) => {
        const nextIdx = getNextValidCardIndex(pools.normal, prev.cardIndex);
        const nextCard = pools.normal[nextIdx % pools.normal.length] || DUMMY_CARDS.normal[0];
        return setupLot(nextCard, 'normal', nextIdx);
      });
    }
  };

  const expensiveCard = pools.expensive[expensiveLot.cardIndex % pools.expensive.length] || DUMMY_CARDS.expensive[0];
  const normalCard = pools.normal[normalLot.cardIndex % pools.normal.length] || DUMMY_CARDS.normal[0];

  useEffect(() => {
    let active = true;
    const validate = async () => {
      if (expensiveCard && (brokenUrlsRef.current.has(expensiveCard.img) || !expensiveCard.img || expensiveCard.img.includes('placeholder') || expensiveCard.img === 'https://images.pokemontcg.io/swsh3/19_hires.png')) {
        if (active) handleImageError('expensive', expensiveCard.img);
        return;
      }
      if (expensiveCard?.img) {
        const isValid = await validateCardImage(expensiveCard.img);
        if (!isValid && active) {
          handleImageError('expensive', expensiveCard.img);
        }
      }
    };
    validate();
    return () => {
      active = false;
    };
  }, [expensiveLot.cardIndex, expensiveCard]);

  useEffect(() => {
    let active = true;
    const validate = async () => {
      if (normalCard && (brokenUrlsRef.current.has(normalCard.img) || !normalCard.img || normalCard.img.includes('placeholder') || normalCard.img === 'https://images.pokemontcg.io/swsh3/19_hires.png')) {
        if (active) handleImageError('normal', normalCard.img);
        return;
      }
      if (normalCard?.img) {
        const isValid = await validateCardImage(normalCard.img);
        if (!isValid && active) {
          handleImageError('normal', normalCard.img);
        }
      }
    };
    validate();
    return () => {
      active = false;
    };
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
                    <p className="text-xs text-slate-400 mt-0.5">High-end graded slabs open at 30–55% of market with a 2-minute timer. Every lot has a hidden seller <b>reserve</b> — if bidding doesn't reach it, the lot is <b>passed</b> (no sale).</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/30 flex gap-3 items-start">
                  <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-cyan-300">Standard &amp; Blitz Arena ($5 - $400 Cards)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Slabs &amp; raw binder hits open at 20–50% of market with a 15-second timer. Competition varies per lot — some finish as steals, some as bidding wars.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-500/30 flex gap-3 items-start">
                  <Coins className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-purple-300">Real Auction House Rules</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Each lot draws a random number of rival bidders, each with their own private max. Bids escalate one increment at a time. A late bid in the final seconds <b>extends the clock</b> (anti-sniping). Hold the top bid at "Going twice…" and it's yours — often for far less than market!</p>
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
              <span className="text-[9px] tracking-widest text-slate-400 font-mono uppercase">Your Net Returns</span>
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
                subtitle="Grail Lots (≥ $100) • Live Reserve"
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
                passed={expensiveLot.passed}
                insufficientFunds={expensiveLot.insufficientFunds}
                reserveMet={expensiveLot.reserveMet}
                bidderCount={expensiveLot.bidderCount}
                watchers={expensiveLot.watchers}
                temperature={expensiveLot.temperature}
                goingStage={expensiveLot.goingStage}
                extendedCount={expensiveLot.extendedCount}
                onPlaceBid={(increment) => handlePlayerBid('expensive', increment)}
                onNextLot={() => handleNextLot('expensive')}
                onImageError={() => handleImageError('expensive', expensiveCard?.img)}
                bidIncrements={(() => { const i = auctionIncrement(expensiveLot.currentBid); return [i, i * 2, i * 5]; })()}
                defaultBidIncrement={auctionIncrement(expensiveLot.currentBid)}
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
                subtitle="Slabs &amp; Binder Hits ($5 - $400) • Live Reserve"
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
                passed={normalLot.passed}
                insufficientFunds={normalLot.insufficientFunds}
                reserveMet={normalLot.reserveMet}
                bidderCount={normalLot.bidderCount}
                watchers={normalLot.watchers}
                temperature={normalLot.temperature}
                goingStage={normalLot.goingStage}
                extendedCount={normalLot.extendedCount}
                onPlaceBid={(increment) => handlePlayerBid('normal', increment)}
                onNextLot={() => handleNextLot('normal')}
                onImageError={() => handleImageError('normal', normalCard?.img)}
                bidIncrements={(() => { const i = auctionIncrement(normalLot.currentBid); return [i, i * 2, i * 5]; })()}
                defaultBidIncrement={auctionIncrement(normalLot.currentBid)}
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

      {/* INSUFFICIENT FUNDS POPUPS (red) — shown after an auction ends where the
          user won but couldn't cover the price. */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 w-full max-w-md px-3 pointer-events-none">
        <AnimatePresence>
          {fundsAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="pointer-events-auto w-full flex items-start gap-2 px-4 py-3 rounded-xl border-2 border-red-500/80 bg-red-950/90 backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.45)]"
            >
              <div className="flex-1">
                <p className="text-red-200 font-extrabold text-sm leading-snug">
                  You dont have enough funds to buy this card , card going to 2nd highest bidder
                </p>
                <p className="text-red-400/80 text-[11px] font-mono mt-1">
                  {alert.cardName} • Winning bid ${alert.price.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setFundsAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                className="text-red-300 hover:text-white transition-colors shrink-0 p-0.5"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

