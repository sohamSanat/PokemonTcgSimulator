import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Crosshair, Sparkles, Eye } from 'lucide-react';
import { sound } from '../../../services/sound';
import type { Card } from '../../binder/types';

interface CenteringMinigameProps {
 activeCard: Card;
 centeringScore: number;
 onNextStep: () => void;
}

/**
 * Centering Minigame
 * 
 * A grading stage where the user measures the left/right and top/bottom
 * centering of the card using digital calipers.
 */
export default function CenteringMinigame({ activeCard, centeringScore, onNextStep }: CenteringMinigameProps) {
 const [centeringGridActive, setCenteringGridActive] = useState(true);
 const [showIdealOverlay, setShowIdealOverlay] = useState(false);
 const [manualShiftX, setManualShiftX] = useState(centeringScore < 8.5 ? 12 : centeringScore < 9.8 ? 6 : 0);
 const [manualShiftY, setManualShiftY] = useState(0);

 // Reset shift if card changes (e.g., restarting minigame)
 useEffect(() => {
 setManualShiftX(centeringScore < 8.5 ? 12 : centeringScore < 9.8 ? 6 : 0);
 setManualShiftY(0);
 setCenteringGridActive(true);
 setShowIdealOverlay(false);
 }, [centeringScore, activeCard]);

 return (
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col lg:flex-row gap-6 items-center justify-center py-6">
 <div className="relative w-72 sm:w-80 aspect-[63/88] rounded-2xl bg-[#0e1018] border-2 border-cyan-400/60 shadow-[0_0_45px_rgba(6,182,212,0.25)] overflow-hidden shrink-0 flex items-center justify-center select-none">
 <img 
 src={activeCard.imageUrl} 
 alt={activeCard.name} 
 className="w-full h-full object-cover block"
 />

 {/* Digital Optical Calipers Overlay */}
 {centeringGridActive && (
 <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5">
 {/* Outer Margin Ratio Boundary Frame */}
 <div 
 style={{ 
 transform: `translate(${manualShiftX}px, ${manualShiftY}px)`,
 borderColor: showIdealOverlay ? 'rgba(52,211,153,0.9)' : 'rgba(6,182,212,0.8)' 
 }}
 className="absolute inset-3 border-2 border-dashed rounded-lg transition-transform duration-300 shadow-[inset_0_0_12px_rgba(6,182,212,0.2)]" 
 />

 {/* True Optical Center Crosshair */}
 <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-cyan-400/70 border-t border-dashed border-cyan-300" />
 <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-cyan-400/70 border-l border-dashed border-cyan-300" />
 
 {/* Visual Shift Line when Centering is Off */}
 {centeringScore < 9.8 && (
 <div 
 style={{ left: centeringScore < 8.5 ? '58%' : '54%' }}
 className="absolute inset-y-0 w-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] flex items-center justify-center animate-pulse"
 >
 <div className="bg-red-600 text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded-full absolute -top-1 whitespace-nowrap shadow-md">
 ARTWORK CENTER SHIFTED RIGHT
 </div>
 </div>
 )}

 {/* 50/50 Ideal Outline comparison overlay */}
 {showIdealOverlay && (
 <div className="absolute inset-3 border-2 border-emerald-400/90 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.6)] flex items-center justify-center">
 <div className="bg-emerald-950/95 text-emerald-300 border border-emerald-400 text-[8px] font-mono font-black px-2 py-0.5 rounded-full shadow">
 50/50 IDEAL BENCHMARK BOUNDARY
 </div>
 </div>
 )}

 {/* Left Border Bar */}
 <div className={`absolute top-1/2 -translate-y-1/2 left-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-black shadow-lg flex items-center gap-1 ${
 centeringScore === 10
 ? 'bg-emerald-950/90 border border-emerald-400 text-emerald-300'
 : centeringScore >= 8.5
 ? 'bg-amber-950/90 border border-amber-400 text-amber-300'
 : 'bg-red-950/90 border border-red-500 text-red-300 animate-pulse'
 }`}>
 <span>◀ Left: {centeringScore === 10 ? '2.5mm (50%)' : centeringScore >= 8.5 ? '2.8mm (55%)' : '3.4mm (60% THICK)'}</span>
 </div>

 {/* Right Border Bar */}
 <div className={`absolute top-1/2 -translate-y-1/2 right-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-black shadow-lg flex items-center gap-1 ${
 centeringScore === 10
 ? 'bg-emerald-950/90 border border-emerald-400 text-emerald-300'
 : centeringScore >= 8.5
 ? 'bg-amber-950/90 border border-amber-400 text-amber-300'
 : 'bg-red-950/90 border border-red-500 text-red-300 animate-pulse'
 }`}>
 <span>Right: {centeringScore === 10 ? '2.5mm (50%)' : centeringScore >= 8.5 ? '2.2mm (45%)' : '1.6mm (40% THIN) ▶'}</span>
 </div>

 {/* Top & Bottom Header Indicators */}
 <div className="absolute top-1.5 left-2 bg-[#0a0f1d]/90 border border-cyan-400/60 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-cyan-300 shadow-md">
 L/R Ratio: {centeringScore === 10 ? '50/50 Perfect' : centeringScore >= 8.5 ? '55/45 Off-Center' : '60/40 Lopsided!'}
 </div>
 <div className="absolute bottom-1.5 right-2 bg-[#0a0f1d]/90 border border-cyan-400/60 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-cyan-300 shadow-md">
 T/B Ratio: {centeringScore === 10 ? '50/50 Perfect' : '52/48 Near'}
 </div>

 {/* Scanning Laser Sweep Animation */}
 <motion.div 
 animate={{ y: ['0%', '800%', '0%'] }} 
 transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
 className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(6,182,212,1)] opacity-80"
 />
 </div>
 )}
 </div>

 {/* Stage Controls */}
 <div className="max-w-md w-full bg-[#13141d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
 <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
 <Crosshair className="w-4 h-4" /> Step 2 of 5: Optical Centering & Border Ratio
 </div>
 <h3 className="text-xl font-black text-white">{activeCard.name}</h3>

 {/* Interactive Caliper Alignment & Nudge controls */}
 <div className="p-3.5 rounded-2xl bg-black/40 border border-cyan-500/30 space-y-2">
 <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
 <span>Interactive Caliper Alignment:</span>
 <button
 onClick={() => { sound.playButtonClick(); setShowIdealOverlay(!showIdealOverlay); }}
 className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
 showIdealOverlay ? 'bg-emerald-500 text-black border-emerald-300' : 'bg-white/10 text-gray-300 border-white/20'
 }`}
 >
 {showIdealOverlay ? ' Ideal 50/50 ON' : 'Show Ideal 50/50'}
 </button>
 </div>
 <div className="flex items-center justify-between gap-2">
 <span className="text-[11px] text-gray-400 font-medium">Test border shift grid:</span>
 <div className="flex items-center gap-1.5">
 <button
 onClick={() => { sound.playButtonClick(); setManualShiftX(prev => prev - 2); }}
 className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
 >
 ◀ Nudge L
 </button>
 <button
 onClick={() => { sound.playButtonClick(); setManualShiftX(0); setManualShiftY(0); }}
 className="px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 cursor-pointer"
 >
 Auto-Center
 </button>
 <button
 onClick={() => { sound.playButtonClick(); setManualShiftX(prev => prev + 2); }}
 className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
 >
 Nudge R ▶
 </button>
 </div>
 </div>
 </div>
 
 {/* Layman Diagnosis Flaw Audit Box */}
 <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 shadow-inner transition-all ${
 centeringScore === 10
 ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-100'
 : centeringScore >= 8.5
 ? 'bg-amber-500/10 border-amber-400/40 text-amber-100'
 : 'bg-red-500/15 border-red-500/50 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
 }`}>
 <div className="font-extrabold flex items-center justify-between gap-2">
 <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
 <Sparkles className={`w-4 h-4 ${centeringScore === 10 ? 'text-emerald-400' : centeringScore >= 8.5 ? 'text-amber-400' : 'text-red-400'}`} />
 Layman Diagnosis: Why {centeringScore.toFixed(1)}/10?
 </span>
 <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase ${
 centeringScore === 10 ? 'bg-emerald-500/30 text-emerald-300' : centeringScore >= 8.5 ? 'bg-amber-500/30 text-amber-300' : 'bg-red-500/30 text-red-300 animate-pulse'
 }`}>
 {centeringScore === 10 ? 'PERFECT' : centeringScore >= 8.5 ? 'MINOR SHIFT' : 'FLAWED CENTERING'}
 </span>
 </div>

 <p className="text-gray-300 text-[11px] font-medium">
 {centeringScore === 10 ? (
 <>
 <strong className="text-emerald-300">Zero flaws detected!</strong> Notice how the border frame is exactly identical in thickness on the left (`2.5mm`) and right (`2.5mm`). Because the artwork sits dead-center, PSA awards a flawless <strong className="text-white">10/10</strong>.
 </>
 ) : centeringScore >= 8.5 ? (
 <>
 <strong className="text-amber-300">Noticeable minor shift:</strong> Look at the left vs. right border widths. The left border (`2.8mm`) is slightly thicker (`55%`) while the right border (`2.2mm`) is thinner (`45%`). PSA's laser calipers deduct <strong className="text-amber-300">{(10 - centeringScore).toFixed(1)} points</strong> for this border imbalance.
 </>
 ) : (
 <>
 <strong className="text-red-400">Severe Lopsided Borders!</strong> Even a layman can instantly spot what is wrong here: look at how wide and thick the Left border (`3.4mm — 60%`) is compared to the thin, squeezed Right border (`1.6mm — 40%`). Because the artwork is visibly shifted right off-center, PSA deducts <strong className="text-red-400">{(10 - centeringScore).toFixed(1)} full points</strong>!
 </>
 )}
 </p>
 </div>

 <div className="flex items-center gap-3 pt-2">
 <button
 onClick={() => { sound.playButtonClick(); setCenteringGridActive(!centeringGridActive); }}
 className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
 >
 <Eye className="w-4 h-4 text-cyan-400" /> {centeringGridActive ? 'Hide Calipers' : 'Show Calipers'}
 </button>
 <button
 onClick={() => { sound.playLaserScan(); onNextStep(); }}
 className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
 >
 <span>Lock Centering & Next Step</span>
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 </motion.div>
 );
}
