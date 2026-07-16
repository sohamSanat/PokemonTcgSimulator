import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Clock, Trophy, ChevronRight, Zap, Coins, Flame, ArrowLeft, Star } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Bid {
  id: number;
  user: string;
  amount: number;
  time: number;
}

const DUMMY_CARDS = {
  expensive: [
    { name: "Charizard V (Secret Art Promo)", price: 45000, color: "amber", title: "Prismatic Secret Rare • PSA 10 GEM MINT", img: "https://images.pokemontcg.io/swsh3/19_hires.png" },
    { name: "Pikachu Illustrator", price: 150000, color: "yellow", title: "Promo • BGS 9.5", img: "https://images.pokemontcg.io/swsh4/44_hires.png" },
    { name: "Lugia V (Alt Art)", price: 32000, color: "blue", title: "Special Art Rare • PSA 10", img: "https://images.pokemontcg.io/swsh12/186_hires.png" }
  ],
  normal: [
    { name: "Mewtwo VSTAR", price: 1, color: "purple", title: "Gold Secret Rare • NM", img: "https://images.pokemontcg.io/pgo/80_hires.png" },
    { name: "Rayquaza VMAX", price: 1, color: "emerald", title: "Trainer Gallery • NM", img: "https://images.pokemontcg.io/swsh7/218_hires.png" },
    { name: "Gengar VMAX", price: 1, color: "fuchsia", title: "Secret Rare • LP", img: "https://images.pokemontcg.io/swsh8/271_hires.png" },
    { name: "Umbreon V", price: 1, color: "indigo", title: "Alt Art • NM", img: "https://images.pokemontcg.io/swsh7/189_hires.png" },
    { name: "Sylveon VMAX", price: 1, color: "pink", title: "Alt Art • NM", img: "https://images.pokemontcg.io/swsh7/212_hires.png" }
  ]
};

export const AuctionDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [auctionMode, setAuctionMode] = useState<'expensive' | 'normal'>('expensive');
  const [bids, setBids] = useState<Bid[]>([]);
  const [currentBid, setCurrentBid] = useState(45000);
  const [timeLeft, setTimeLeft] = useState(120);
  const [maxTime, setMaxTime] = useState(120);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Load new card based on mode
  useEffect(() => {
    const isNormal = auctionMode === 'normal';
    const initialTime = isNormal ? 10 : 120;
    const cards = DUMMY_CARDS[auctionMode];
    const card = cards[currentCardIndex % cards.length];
    
    setTimeLeft(initialTime);
    setMaxTime(initialTime);
    setCurrentBid(card.price);
    
    // Generate initial bids only for expensive
    if (isNormal) {
      setBids([]);
    } else {
      setBids(
        Array.from({ length: 5 }).map((_, i) => ({
          id: Date.now() - (5 - i) * 1000,
          user: `Bidder_0x${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}`,
          amount: card.price - (5 - i) * 1000,
          time: Date.now() - (5 - i) * 1000,
        }))
      );
    }
  }, [auctionMode, currentCardIndex]);

  // Countdown timer & Card switch logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time is up, move to next card immediately
          setCurrentCardIndex(idx => idx + 1);
          return 0; // will be reset by the other useEffect
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [auctionMode]);

  // Simulate incoming bids
  useEffect(() => {
    const bidInterval = setInterval(() => {
      const isNormal = auctionMode === 'normal';
      // In normal mode, bids are small (+1 to +5). In expensive, (+100 to +600)
      const bidChance = isNormal ? 0.8 : 0.6; 
      
      if (Math.random() < bidChance && timeLeft > 0) {
        const increment = isNormal 
          ? Math.floor(Math.random() * 5 + 1)
          : Math.floor(Math.random() * 5 + 1) * 100;
          
        const newBidAmount = currentBid + increment;
        const newBid = {
          id: Date.now(),
          user: `Bidder_0x${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}`,
          amount: newBidAmount,
          time: Date.now(),
        };
        setBids((prev) => [...prev, newBid].slice(-30));
        setCurrentBid(newBidAmount);
      }
    }, auctionMode === 'normal' ? 800 : 2500);
    
    return () => clearInterval(bidInterval);
  }, [currentBid, auctionMode, timeLeft]);

  const handlePlayerBid = (increment: number) => {
    if (timeLeft <= 0) return;
    const newBidAmount = currentBid + increment;
    const newBid = {
      id: Date.now(),
      user: 'YOU',
      amount: newBidAmount,
      time: Date.now(),
    };
    setBids((prev) => [...prev, newBid].slice(-30));
    setCurrentBid(newBidAmount);
  };

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

  const circumference = 2 * Math.PI * 140; // r=140
  const strokeDashoffset = maxTime > 0 ? circumference - (timeLeft / maxTime) * circumference : 0;

  const currentCard = DUMMY_CARDS[auctionMode][currentCardIndex % DUMMY_CARDS[auctionMode].length];

  return (
    <div className="absolute inset-0 z-50 bg-[#050914] text-slate-200 font-sans overflow-hidden selection:bg-cyan-500/30 flex flex-col items-center justify-center">
      
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-[50%] translate-x-[-50%] w-[30vw] h-[30vw] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Grid Layout */}
      <div className="w-full max-w-[1920px] h-full max-h-screen p-6 flex flex-col gap-6 relative z-10">
        
        {/* HEADER */}
        <header className="flex-none flex items-center justify-between px-6 py-4 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-lg">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div className="w-10 h-10 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
                NEXUS AUCTION ARENA
              </h1>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                LIVE BIDDING NETWORK
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Mode Switcher */}
            <div className="flex bg-slate-900/80 rounded-lg p-1 border border-slate-700/50">
              <button 
                onClick={() => { setAuctionMode('expensive'); setCurrentCardIndex(0); }}
                className={cn(
                  "px-4 py-2 rounded-md text-xs font-bold tracking-wider uppercase transition-all",
                  auctionMode === 'expensive' ? "bg-amber-500/20 text-amber-400 border border-amber-500/50" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Grail Lots
              </button>
              <button 
                onClick={() => { setAuctionMode('normal'); setCurrentCardIndex(0); }}
                className={cn(
                  "px-4 py-2 rounded-md text-xs font-bold tracking-wider uppercase transition-all",
                  auctionMode === 'normal' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Blitz $1 Starts
              </button>
            </div>
            <div className="h-10 w-px bg-slate-700/50" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] tracking-[0.2em] text-slate-400 font-mono">WALLET BALANCE</span>
              <span className="text-base font-mono text-slate-200 font-bold">$128,450.00</span>
            </div>
          </div>
        </header>

        {/* CONTENT GRID */}
        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
          
          {/* CENTER PANEL: THE MAIN STAGE */}
          <div className="col-span-9 relative flex flex-col items-center justify-center bg-slate-900/30 backdrop-blur-xl border border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl">
            {/* Subtle grid pattern background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" style={{ maskImage: 'radial-gradient(circle at center, black 20%, transparent 80%)' }} />
            
            <div className="relative z-10 flex flex-col items-center flex-1 w-full justify-center">
              
              <div className="mb-6 flex flex-col items-center text-center max-w-md">
                <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-600 mb-4 inline-flex items-center gap-2">
                  <Star className={cn("w-4 h-4", auctionMode === 'expensive' ? "text-amber-400" : "text-cyan-400")} />
                  <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
                    LOT #{412 + currentCardIndex}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{currentCard.name}</h2>
                <p className="text-sm text-slate-400 font-mono uppercase">{currentCard.title}</p>
              </div>

              {/* The 3D Card Area */}
              <div className="relative flex items-center justify-center w-[400px] h-[400px] group perspective-[1000px]">
                
                {/* Radial Progress Ring */}
                <svg className="absolute w-[360px] h-[360px] -rotate-90 pointer-events-none" viewBox="0 0 320 320">
                  <circle cx="160" cy="160" r="140" fill="none" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="4" />
                  <circle 
                    cx="160" cy="160" r="140" 
                    fill="none" 
                    stroke={auctionMode === 'expensive' ? "url(#amber-glow)" : "url(#cyan-glow)"} 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                  />
                  <defs>
                    <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                    <linearGradient id="amber-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Time inside ring */}
                <div className="absolute top-4 w-full flex justify-center pointer-events-none z-20">
                  <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                    <Clock className={cn("w-4 h-4", auctionMode === 'expensive' ? "text-amber-400" : "text-cyan-400")} />
                    <span className="font-mono text-lg text-cyan-50 font-medium tracking-widest">{formatTime(timeLeft)}</span>
                  </div>
                </div>

                {/* Holographic Anime Card */}
                <motion.div 
                  className="relative w-[220px] h-[310px] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.3)] border border-slate-600/50 bg-slate-800 cursor-grab active:cursor-grabbing z-10"
                  style={{ rotateX: rotationX, rotateY: rotationY, transformStyle: "preserve-3d" }}
                  animate={{ rotateX: rotationX, rotateY: rotationY, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 z-20 pointer-events-none mix-blend-overlay" />
                  <img src={currentCard.img} alt={currentCard.name} className="w-full h-full object-cover" />
                </motion.div>
              </div>

              {/* Current Bid Display */}
              <div className="mt-8 flex flex-col items-center">
                <span className="text-xs font-mono tracking-[0.3em] text-slate-400 mb-2 uppercase">Current Bid</span>
                <motion.div 
                  key={currentBid}
                  initial={{ scale: 1.2, color: "#4ade80" }}
                  animate={{ scale: 1, color: auctionMode === 'expensive' ? "#fbbf24" : "#22d3ee" }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl font-bold tracking-tight"
                  style={{ textShadow: `0 0 40px ${auctionMode === 'expensive' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(34, 211, 238, 0.4)'}` }}
                >
                  ${currentBid.toLocaleString()}
                </motion.div>
              </div>

            </div>
          </div>

          {/* RIGHT PANEL: THE WAR ROOM */}
          <div className="col-span-3 flex flex-col bg-slate-900/30 backdrop-blur-xl border border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-slate-700/50 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h2 className="font-mono text-sm tracking-widest text-slate-200">LIVE FEED</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-400 uppercase">Receiving</span>
              </div>
            </div>

            {/* Bids List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col justify-end relative" style={{ scrollbarWidth: 'thin' }}>
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none z-10" />
              
              <AnimatePresence initial={false}>
                {bids.slice(-15).map((bid, i, arr) => {
                  const isLatest = i === arr.length - 1;
                  const isUser = bid.user === 'YOU';
                  return (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded border font-mono text-sm transition-colors",
                        isLatest 
                          ? isUser 
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                            : "bg-green-500/10 border-green-500/40 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]" 
                          : "bg-slate-800/40 border-slate-700/50 text-slate-300"
                      )}
                    >
                      <span className={cn("tracking-wider", isLatest && "font-bold", isUser && "text-cyan-300")}>{bid.user}</span>
                      <span className={cn(isLatest ? (isUser ? "text-cyan-200" : "text-green-300") : "text-amber-400/80")}>
                        ${bid.amount.toLocaleString()}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Action Area */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-700/50 backdrop-blur-md">
              <div className="flex gap-2 mb-3">
                {(auctionMode === 'expensive' ? [100, 500, 1000] : [1, 5, 10]).map((inc) => (
                  <button 
                    key={inc}
                    onClick={() => handlePlayerBid(inc)}
                    disabled={timeLeft <= 0}
                    className="flex-1 py-2 rounded bg-slate-800/80 border border-slate-600 hover:border-cyan-500/50 hover:bg-slate-700/80 text-xs font-mono text-slate-300 transition-all hover:shadow-[0_0_10px_rgba(34,211,238,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +${inc >= 1000 ? `${inc/1000}k` : inc}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => handlePlayerBid(auctionMode === 'expensive' ? 500 : 5)}
                disabled={timeLeft <= 0}
                className="w-full py-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Coins className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Place Bid
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
