import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Clock, Trophy, ChevronRight, Zap, Coins, Flame } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dummy data for bidding feed
const generateBids = () => {
  return Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    user: `Bidder_0x${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}`,
    amount: 40000 + Math.floor(Math.random() * 6000),
    time: Date.now() - Math.floor(Math.random() * 10000),
  })).sort((a, b) => a.amount - b.amount);
};

export default function App() {
  const [bids, setBids] = useState(generateBids());
  const [currentBid, setCurrentBid] = useState(45000);
  const [timeLeft, setTimeLeft] = useState(120); // seconds
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate incoming bids
  useEffect(() => {
    const bidInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        const newBidAmount = currentBid + (Math.floor(Math.random() * 5 + 1) * 100);
        const newBid = {
          id: Date.now(),
          user: `Bidder_0x${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}`,
          amount: newBidAmount,
          time: Date.now(),
        };
        setBids((prev) => [...prev, newBid].slice(-30));
        setCurrentBid(newBidAmount);
      }
    }, 2500);
    return () => clearInterval(bidInterval);
  }, [currentBid]);

  // Card mouse movement for 3D effect
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
  const strokeDashoffset = circumference - (timeLeft / 120) * circumference;

  return (
    <div className="min-h-screen bg-[#050914] text-slate-200 font-sans overflow-hidden selection:bg-cyan-500/30 flex flex-col items-center justify-center relative">
      
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-[50%] translate-x-[-50%] w-[30vw] h-[30vw] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Grid Layout */}
      <div className="w-full max-w-[1920px] h-screen max-h-[1080px] p-6 grid grid-cols-12 grid-rows-12 gap-6 relative z-10">
        
        {/* HEADER */}
        <header className="col-span-12 row-span-1 flex items-center justify-between px-6 py-2 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
              NEXUS TCG AUCTION
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] tracking-[0.2em] text-cyan-400/80 font-mono">SYSTEM STATUS</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-sm font-mono text-slate-300">SECURE LINK</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-700/50" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] tracking-[0.2em] text-slate-400 font-mono">WALLET BALANCE</span>
              <span className="text-sm font-mono text-slate-200">128,450.00c</span>
            </div>
          </div>
        </header>

        {/* CENTER PANEL: THE MAIN STAGE */}
        <div className="col-span-9 row-span-8 relative flex flex-col items-center justify-center bg-slate-900/30 backdrop-blur-xl border border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mask-image-radial" />
          
          <div className="relative z-10 flex flex-col items-center flex-1 w-full justify-center mt-8">
            
            {/* The 3D Card Area */}
            <div className="relative flex items-center justify-center w-[400px] h-[400px] group perspective-[1000px]">
              
              {/* Radial Progress Ring */}
              <svg className="absolute w-[360px] h-[360px] -rotate-90 pointer-events-none" viewBox="0 0 320 320">
                <circle cx="160" cy="160" r="140" fill="none" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="4" />
                <circle 
                  cx="160" cy="160" r="140" 
                  fill="none" 
                  stroke="url(#cyan-glow)" 
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
                </defs>
              </svg>

              {/* Time inside ring */}
              <div className="absolute top-4 w-full flex justify-center pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-lg text-cyan-50 font-medium tracking-widest">{formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* Holographic Anime Card */}
              <motion.div 
                className="relative w-[220px] h-[310px] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.3)] border border-slate-600/50 bg-slate-800 cursor-grab active:cursor-grabbing transform-style-3d"
                style={{ rotateX: rotationX, rotateY: rotationY }}
                animate={{ rotateX: rotationX, rotateY: rotationY, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {/* Holographic sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 z-20 pointer-events-none mix-blend-overlay" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)] z-20 pointer-events-none" />
                
                {/* Card Art (Placeholder for Dragon) */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 to-slate-900 flex items-center justify-center p-2">
                  <div className="w-full h-full border-[3px] border-amber-500/30 rounded-xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/30 blur-2xl rounded-full mix-blend-screen" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-blue-500/40 blur-3xl rounded-full mix-blend-screen" />
                    <div className="flex-1 flex items-center justify-center relative">
                      <Flame className="w-24 h-24 text-amber-400 opacity-80" strokeWidth={1} />
                    </div>
                    <div className="h-1/4 bg-slate-900/80 backdrop-blur-sm p-3 border-t border-slate-700/50">
                      <h3 className="text-amber-400 font-bold text-sm">ASTRAL DRAGON</h3>
                      <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider leading-relaxed">Prismatic Secret Rare • PSA 10 GEM MINT</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Current Bid Display */}
            <div className="mt-8 flex flex-col items-center">
              <span className="text-xs font-mono tracking-[0.3em] text-slate-400 mb-2 uppercase">Current Bid</span>
              <motion.div 
                key={currentBid}
                initial={{ scale: 1.2, color: "#4ade80" }}
                animate={{ scale: 1, color: "#fbbf24" }}
                transition={{ duration: 0.5 }}
                className="text-6xl font-bold tracking-tight"
                style={{ textShadow: "0 0 40px rgba(251, 191, 36, 0.4)" }}
              >
                ${currentBid.toLocaleString()}c
              </motion.div>
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: THE WAR ROOM */}
        <div className="col-span-3 row-span-8 flex flex-col bg-slate-900/30 backdrop-blur-xl border border-slate-700/30 rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Header */}
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
          <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col justify-end custom-scrollbar relative">
            {/* Fade out top */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none z-10" />
            
            <AnimatePresence initial={false}>
              {bids.slice(-15).map((bid, i, arr) => {
                const isLatest = i === arr.length - 1;
                return (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded border font-mono text-sm transition-colors",
                      isLatest 
                        ? "bg-green-500/10 border-green-500/40 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]" 
                        : "bg-slate-800/40 border-slate-700/50 text-slate-300"
                    )}
                  >
                    <span className={cn("tracking-wider", isLatest && "font-bold")}>{bid.user}</span>
                    <span className={cn(isLatest ? "text-green-300" : "text-amber-400/80")}>
                      {bid.amount.toLocaleString()}c
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Action Area */}
          <div className="p-4 bg-slate-950/60 border-t border-slate-700/50 backdrop-blur-md">
            <div className="flex gap-2 mb-3">
              {[100, 500, 1000].map((inc) => (
                <button 
                  key={inc}
                  className="flex-1 py-2 rounded bg-slate-800/80 border border-slate-600 hover:border-cyan-500/50 hover:bg-slate-700/80 text-xs font-mono text-slate-300 transition-all hover:shadow-[0_0_10px_rgba(34,211,238,0.2)] active:scale-95"
                >
                  +{inc >= 1000 ? `${inc/1000}k` : inc}
                </button>
              ))}
            </div>
            <button className="w-full py-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] flex items-center justify-center gap-2 group active:scale-[0.98]">
              <Coins className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Place Bid
            </button>
          </div>
        </div>

        {/* BOTTOM PANEL: UPCOMING LOTS */}
        <div className="col-span-12 row-span-3 bg-slate-900/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          <div className="px-6 py-3 border-b border-slate-700/40 bg-slate-950/40 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="font-mono text-xs tracking-widest text-slate-300 uppercase">Upcoming Lots on the Block</h2>
          </div>
          
          <div className="flex-1 p-4 flex gap-4 overflow-x-auto custom-scrollbar items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-[240px] h-[120px] rounded-xl border border-slate-700/50 bg-slate-800/30 flex items-center p-3 gap-4 hover:border-slate-500/50 transition-colors group cursor-pointer hover:bg-slate-800/50"
              >
                {/* Silhouette */}
                <div className="w-[70px] h-[95px] rounded bg-slate-900 border border-slate-700 relative overflow-hidden flex items-center justify-center">
                  <div className={cn("absolute inset-0 opacity-40 blur-md", i % 2 === 0 ? "bg-fuchsia-500" : "bg-cyan-500")} />
                  <Trophy className="w-6 h-6 text-slate-500/50 relative z-10" />
                </div>
                
                {/* Info */}
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-slate-200 mb-1 group-hover:text-cyan-400 transition-colors truncate">LOT #{412 + i}</h4>
                  <div className="text-[10px] text-slate-400 font-mono mb-2">Starts: {i === 0 ? "Next" : `${Math.floor(i * 15 + Math.random() * 10)} min`}</div>
                  <div className="text-amber-400/90 font-mono text-sm tracking-wider">
                    {Math.floor(15000 + Math.random() * 20000).toLocaleString()}c
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex-shrink-0 w-12 h-[120px] flex items-center justify-center rounded-xl hover:bg-slate-800/40 cursor-pointer transition-colors border border-transparent hover:border-slate-700">
              <ChevronRight className="w-6 h-6 text-slate-500" />
            </div>
          </div>
        </div>

      </div>
      
      {/* Global CSS injected inline for utilities */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1);
        }
        .mask-image-radial {
          mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}
