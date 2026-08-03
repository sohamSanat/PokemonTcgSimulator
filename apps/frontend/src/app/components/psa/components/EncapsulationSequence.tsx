import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCw, ChevronRight, Award } from 'lucide-react';
import { sound } from '../../../services/sound';
import type { Card } from '../../binder/types';
import type { LabelStyle } from '../types';

interface EncapsulationSequenceProps {
 activeCard: Card;
 certNumber: string;
 finalGrade: number | string;
 labelStyle: LabelStyle;
 setLabelStyle: (style: LabelStyle) => void;
 onSequenceComplete: () => void;
}

/**
 * Encapsulation Sequence
 * 
 * The final simulation stage of the PSA Grading Lab where the card is
 * permanently sealed inside a PSA grading slab using ultrasonic welding.
 */
export default function EncapsulationSequence({
 activeCard,
 certNumber,
 finalGrade,
 labelStyle,
 setLabelStyle,
 onSequenceComplete
}: EncapsulationSequenceProps) {
 const [sealingProgress, setSealingProgress] = useState(0);
 const [isSealingActive, setIsSealingActive] = useState(false);
 const [assemblyPhase, setAssemblyPhase] = useState<'place_card' | 'apply_label' | 'sonic_weld'>('place_card');
 const [weldSeams, setWeldSeams] = useState<boolean[]>([false, false, false, false]); // [Top, Right, Bottom, Left]

 useEffect(() => {
 setSealingProgress(0);
 setIsSealingActive(false);
 setAssemblyPhase('place_card');
 setWeldSeams([false, false, false, false]);
 }, [activeCard]);

 const handlePlaceCardInWell = () => {
 sound.playTabSwitch();
 setAssemblyPhase('apply_label');
 };

 const handleApplyCertLabel = () => {
 sound.playCardFlip();
 setAssemblyPhase('sonic_weld');
 };

 const handleWeldSeam = (idx: number) => {
 if (isSealingActive || weldSeams[idx]) return;
 sound.playUltrasonicWeldPulse();
 const nextSeams = [...weldSeams];
 nextSeams[idx] = true;
 setWeldSeams(nextSeams);
 const newProgress = nextSeams.filter(Boolean).length * 25;
 setSealingProgress(newProgress);

 if (newProgress >= 100) {
 triggerFinalUltrasonicSeal();
 }
 };

 const triggerFinalUltrasonicSeal = () => {
 setIsSealingActive(true);
 setSealingProgress(100);
 sound.playUltrasonicSeal();
 sound.haptic([50, 40, 90, 40, 150]);
 setTimeout(() => {
 setIsSealingActive(false);
 onSequenceComplete();
 }, 1800);
 };

 const handlePulseSealing = () => {
 if (isSealingActive || sealingProgress >= 100) return;
 sound.playUltrasonicWeldPulse();
 const unsealedIdx = weldSeams.findIndex(s => !s);
 if (unsealedIdx !== -1) {
 handleWeldSeam(unsealedIdx);
 } else {
 triggerFinalUltrasonicSeal();
 }
 };

 return (
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center py-6">
 {/* Interactive Assembly & Sealing Chamber Preview */}
 <div className={`relative w-72 sm:w-80 aspect-[60/98] rounded-[24px] p-3 transition-all duration-500 flex flex-col items-center justify-between overflow-hidden shrink-0 select-none ${
 assemblyPhase === 'sonic_weld'
 ? 'bg-gradient-to-b from-[#2a2d38] via-[#181a24] to-[#12131a] border-4 border-red-500 shadow-[0_0_65px_rgba(239,68,68,0.7)]'
 : 'bg-[#10131d]/90 border-2 border-dashed border-cyan-400/80 shadow-[0_0_40px_rgba(6,182,212,0.3)]'
 }`}>
 {/* PHASE 2 & 3: Certification Label Header */}
 {assemblyPhase !== 'place_card' ? (
 <motion.div 
 initial={{ y: -30, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 onClick={() => assemblyPhase === 'apply_label' && handleApplyCertLabel()}
 className={`w-full rounded-xl p-2.5 border shadow-md z-20 flex items-center justify-between gap-2 transition-transform cursor-pointer ${
 assemblyPhase === 'apply_label' ? 'animate-bounce border-2 border-amber-300 ring-4 ring-amber-400/40' : ''
 } ${
 labelStyle === 'gold_30th'
 ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-amber-300 text-black'
 : labelStyle === 'black_diamond'
 ? 'bg-gradient-to-r from-gray-900 via-black to-gray-900 border-cyan-400 text-white'
 : labelStyle === 'emerald_prism'
 ? 'bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-700 border-emerald-300 text-white'
 : 'bg-gradient-to-r from-red-700 via-red-600 to-red-700 border-white/40 text-white'
 }`}
 >
 <div className="flex flex-col min-w-0">
 <div className="flex items-center gap-1.5 font-black text-xs">
 <span>PSA</span>
 <span className="text-[9px] font-mono uppercase opacity-90">{labelStyle === 'gold_30th' ? ' 30TH ANNIV' : labelStyle === 'black_diamond' ? '◈ REGISTRY' : labelStyle === 'emerald_prism' ? ' PRISM' : 'CERTIFIED'}</span>
 </div>
 <div className="text-[10px] font-bold truncate">{activeCard.name.split('—')[0]}</div>
 <div className="text-[9px] font-mono opacity-80">CERT #{certNumber}</div>
 </div>
 <div className="w-11 h-11 rounded-lg bg-black/40 border border-white/20 flex flex-col items-center justify-center font-black">
 <span className="text-[8px] leading-none text-gray-300">GRADE</span>
 <span className="text-lg leading-none text-white">{finalGrade}</span>
 </div>
 </motion.div>
 ) : (
 <div 
 onClick={handlePlaceCardInWell}
 className="w-full h-16 rounded-xl border-2 border-dashed border-white/20 bg-black/40 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-400 transition-colors"
 >
 <span className="text-[10px] font-mono font-bold text-gray-400">[ ACRYLIC HEADER SLOT EMPTY ]</span>
 <span className="text-[9px] text-cyan-400">Drop Card below first!</span>
 </div>
 )}

 {/* Inner Cavity / Polycarbonate Well */}
 <div 
 onClick={() => assemblyPhase === 'place_card' && handlePlaceCardInWell()}
 className={`w-full flex-1 my-2 rounded-xl overflow-hidden border relative flex items-center justify-center transition-all ${
 assemblyPhase === 'place_card' 
 ? 'border-2 border-dashed border-emerald-400/80 bg-black/50 cursor-pointer hover:bg-black/80' 
 : 'border border-white/10 bg-black'
 }`}
 >
 {assemblyPhase === 'place_card' ? (
 <motion.div 
 animate={{ y: [-6, 6, -6], scale: [0.98, 1.02, 0.98] }}
 transition={{ repeat: Infinity, duration: 2 }}
 className="flex flex-col items-center justify-center p-4 text-center"
 >
 <img src={activeCard.imageUrl} alt={activeCard.name} className="w-36 h-48 object-cover rounded-lg shadow-2xl border border-white/30 mb-3 opacity-90" />
 <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-xs animate-pulse">
 Click or Drop Card into Well
 </span>
 </motion.div>
 ) : (
 <motion.img 
 initial={{ scale: 1.15, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 src={activeCard.imageUrl} 
 alt={activeCard.name} 
 className="w-full h-full object-contain" 
 />
 )}

 {/* PHASE 3: Ultrasonic Seam Welding Nodes & Sparks */}
 {assemblyPhase === 'sonic_weld' && (
 <>
 {/* Top Seam Node */}
 <button
 onClick={() => handleWeldSeam(0)}
 className={`absolute top-2 inset-x-12 h-8 rounded-full border-2 font-mono text-[10px] font-black transition-all flex items-center justify-center z-30 cursor-pointer ${
 weldSeams[0] ? 'bg-emerald-600/90 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-red-600/90 border-amber-300 text-amber-100 animate-pulse hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.9)]'
 }`}
 >
 {weldSeams[0] ? ' TOP SEAM WELDED' : ' CLICK TO LASER WELD TOP SEAM'}
 </button>

 {/* Bottom Seam Node */}
 <button
 onClick={() => handleWeldSeam(2)}
 className={`absolute bottom-2 inset-x-12 h-8 rounded-full border-2 font-mono text-[10px] font-black transition-all flex items-center justify-center z-30 cursor-pointer ${
 weldSeams[2] ? 'bg-emerald-600/90 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-red-600/90 border-amber-300 text-amber-100 animate-pulse hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.9)]'
 }`}
 >
 {weldSeams[2] ? ' BOTTOM SEAM WELDED' : ' CLICK TO LASER WELD BOTTOM'}
 </button>

 {/* Left Seam Node */}
 <button
 onClick={() => handleWeldSeam(3)}
 className={`absolute left-2 inset-y-16 w-8 rounded-full border-2 font-mono text-[9px] font-black transition-all flex items-center justify-center z-30 cursor-pointer ${
 weldSeams[3] ? 'bg-emerald-600/90 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-cyan-600/90 border-cyan-300 text-white animate-pulse hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.9)]'
 }`}
 >
 <span className="transform -rotate-90 whitespace-nowrap">{weldSeams[3] ? ' LEFT WELD' : ' LEFT SEAM'}</span>
 </button>

 {/* Right Seam Node */}
 <button
 onClick={() => handleWeldSeam(1)}
 className={`absolute right-2 inset-y-16 w-8 rounded-full border-2 font-mono text-[9px] font-black transition-all flex items-center justify-center z-30 cursor-pointer ${
 weldSeams[1] ? 'bg-emerald-600/90 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-cyan-600/90 border-cyan-300 text-white animate-pulse hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.9)]'
 }`}
 >
 <span className="transform rotate-90 whitespace-nowrap">{weldSeams[1] ? ' RIGHT WELD' : ' RIGHT SEAM'}</span>
 </button>
 </>
 )}

 {/* Sealing Active Wave Effect */}
 {isSealingActive && (
 <motion.div 
 animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.95, 0.5] }}
 transition={{ repeat: Infinity, duration: 0.5 }}
 className="absolute inset-0 border-4 border-cyan-400 bg-cyan-500/30 pointer-events-none rounded-xl z-40 flex items-center justify-center" 
 >
 <div className="px-4 py-2 rounded-2xl bg-black/90 border-2 border-cyan-300 text-cyan-300 font-mono font-black text-xs animate-bounce shadow-2xl">
 20,000 HZ ULTRASONIC FUSION IN PROGRESS...
 </div>
 </motion.div>
 )}
 </div>

 {/* Sealing Status Bar */}
 <div className="w-full bg-black/80 rounded-lg py-2 px-3 border border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-300">
 <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
 <RotateCw className={`w-3.5 h-3.5 ${isSealingActive ? 'animate-spin text-red-400' : ''}`} />
 {sealingProgress >= 100 ? 'SEAL COMPLETE!' : `${sealingProgress}% WELDED`}
 </span>
 <span>{assemblyPhase === 'place_card' ? 'PHASE 1: INSERT CARD' : assemblyPhase === 'apply_label' ? 'PHASE 2: APPLY LABEL' : 'PHASE 3: SONIC WELD'}</span>
 </div>
 </div>

 {/* Stage Controls */}
 <div className="max-w-md w-full bg-[#13141d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-400">
 <RotateCw className="w-4 h-4 animate-spin" /> Step 5 of 5: Assembly & Ultrasonic Sealing
 </div>
 <span className="px-2.5 py-1 rounded-full bg-red-500/20 border border-red-400 text-red-300 font-mono text-[10px] font-extrabold">
 {assemblyPhase === 'place_card' ? '1/3 WELL' : assemblyPhase === 'apply_label' ? '2/3 LABEL' : '3/3 WELD'}
 </span>
 </div>

 <h3 className="text-xl font-black text-white">{activeCard.name}</h3>
 
 {assemblyPhase === 'place_card' && (
 <div className="space-y-4">
 <p className="text-xs text-gray-300 leading-relaxed">
 First, place your graded card into the optical-grade polycarbonate acrylic well. The inner rails cushion the edges without applying pressure to the card foil.
 </p>
 <button
 onClick={handlePlaceCardInWell}
 className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
 >
 <span> Drop Card into Inner Slab Well</span>
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 )}

 {assemblyPhase === 'apply_label' && (
 <div className="space-y-4">
 <p className="text-xs text-gray-300 leading-relaxed">
 Choose your custom hologram registry label design below, then press it into the top cavity above the card!
 </p>
 {/* Label Style Selector */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-300">Select Slab Label Hologram Style:</label>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 <button
 onClick={() => { sound.playButtonClick(); setLabelStyle('standard_red'); }}
 className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
 labelStyle === 'standard_red'
 ? 'bg-red-600 border-white text-white font-black shadow-[0_0_12px_rgba(239,68,68,0.6)]'
 : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
 }`}
 >
 <div className="text-[10px]">Classic Red</div>
 </button>
 <button
 onClick={() => { sound.playButtonClick(); setLabelStyle('gold_30th'); }}
 className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
 labelStyle === 'gold_30th'
 ? 'bg-amber-500 border-white text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.6)]'
 : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
 }`}
 >
 <div className="text-[10px]">30th Gold</div>
 </button>
 <button
 onClick={() => { sound.playButtonClick(); setLabelStyle('black_diamond'); }}
 className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
 labelStyle === 'black_diamond'
 ? 'bg-gray-800 border-cyan-400 text-white font-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
 : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
 }`}
 >
 <div className="text-[10px]">Black Diamond</div>
 </button>
 <button
 onClick={() => { sound.playButtonClick(); setLabelStyle('emerald_prism'); }}
 className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
 labelStyle === 'emerald_prism'
 ? 'bg-emerald-600 border-white text-white font-black shadow-[0_0_12px_rgba(16,185,129,0.6)]'
 : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
 }`}
 >
 <div className="text-[10px]">Emerald Prism</div>
 </button>
 </div>
 </div>

 <button
 onClick={handleApplyCertLabel}
 className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
 >
 <span> Press Certification Hologram Label</span>
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 )}

 {assemblyPhase === 'sonic_weld' && (
 <div className="space-y-4">
 <p className="text-xs text-gray-300 leading-relaxed">
 Now the top lid is lowered. <span className="text-cyan-300 font-bold">Click the 4 perimeter laser seams on the slab preview</span> or use the sonic trigger below to permanently fuse the case!
 </p>

 {/* Seam Checklist */}
 <div className="grid grid-cols-2 gap-2">
 {['Top Edge Seam', 'Right Rail Seam', 'Bottom Seam', 'Left Rail Seam'].map((label, idx) => (
 <div 
 key={idx}
 onClick={() => handleWeldSeam(idx)}
 className={`p-2.5 rounded-xl border text-[11px] font-black cursor-pointer flex items-center justify-between transition-all ${
 weldSeams[idx]
 ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
 : 'bg-white/5 border-white/15 text-gray-300 hover:border-red-400'
 }`}
 >
 <span>{label}</span>
 <span>{weldSeams[idx] ? '' : ''}</span>
 </div>
 ))}
 </div>

 {/* Weld Progress Gauge */}
 <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
 <div className="flex items-center justify-between text-xs font-bold text-gray-300">
 <span>Tamper-Proof Sealing Progress:</span>
 <span className="text-red-400 font-mono font-black">{sealingProgress}% ({weldSeams.filter(Boolean).length}/4 SEAMS)</span>
 </div>
 <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
 <motion.div 
 animate={{ width: `${sealingProgress}%` }}
 className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full shadow-[0_0_12px_rgba(239,68,68,1)]"
 />
 </div>
 </div>

 {/* Interactive Tactile Seal Button */}
 <div className="flex items-center gap-3">
 {sealingProgress < 100 && (
 <button
 onClick={() => {
 sound.playUltrasonicWeldPulse();
 setWeldSeams([true, true, true, true]);
 triggerFinalUltrasonicSeal();
 }}
 className="px-4 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-gray-300 text-xs font-bold transition-all cursor-pointer shrink-0"
 >
 Auto-Weld All
 </button>
 )}
 <button
 onClick={handlePulseSealing}
 disabled={isSealingActive || sealingProgress >= 100}
 className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xl ${
 sealingProgress >= 100
 ? 'bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.8)]'
 : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-[0_0_35px_rgba(239,68,68,0.7)] active:scale-95'
 }`}
 >
 <Award className="w-5 h-5 text-amber-200" />
 <span>{sealingProgress >= 100 ? 'Sealed! Revealing Grade...' : `Sonic Weld Pulse (${sealingProgress}%)`}</span>
 </button>
 </div>
 </div>
 )}
 </div>
 </motion.div>
 );
}
