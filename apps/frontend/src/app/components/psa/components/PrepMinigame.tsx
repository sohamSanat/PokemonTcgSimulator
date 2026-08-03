import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gauge, Wind, Sparkles, ChevronRight } from 'lucide-react';
import type { Card } from '../../binder/types';
import type { DustSpeck } from '../types';
import { sound } from '../../../services/sound';

interface PrepMinigameProps {
 activeCard: Card;
 onSequenceComplete: () => void;
}

/**
 * Prep Minigame
 * 
 * The first stage of the PSA Grading Lab. Users wipe dust off the card
 * and apply a microfiber cloth to clean the surface.
 */
export default function PrepMinigame({
 activeCard,
 onSequenceComplete
}: PrepMinigameProps) {
 const [dustSpecks, setDustSpecks] = useState<DustSpeck[]>([]);
 const [prepTool, setPrepTool] = useState<'blower' | 'cloth'>('blower');
 const [prepCleanedCount, setPrepCleanedCount] = useState(0);
 const [isDraggingPrep, setIsDraggingPrep] = useState(false);
 const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
 const [airPuffs, setAirPuffs] = useState<{ id: number; x: number; y: number }[]>([]);
 const [smudgeWarning, setSmudgeWarning] = useState<string | null>(null);

 React.useEffect(() => {
 const generatedSpecks: DustSpeck[] = [
 { id: 1, x: 16, y: 14, size: 'medium', type: 'dust', cleaned: false },
 { id: 2, x: 74, y: 18, size: 'large', type: 'smudge', cleaned: false },
 { id: 3, x: 32, y: 22, size: 'small', type: 'dust', cleaned: false },
 { id: 4, x: 86, y: 28, size: 'medium', type: 'lint', cleaned: false },
 { id: 5, x: 22, y: 34, size: 'large', type: 'fingerprint', cleaned: false },
 { id: 6, x: 62, y: 36, size: 'medium', type: 'dust', cleaned: false },
 { id: 7, x: 48, y: 15, size: 'small', type: 'dust', cleaned: false },
 { id: 8, x: 14, y: 46, size: 'large', type: 'lint', cleaned: false },
 { id: 9, x: 52, y: 48, size: 'medium', type: 'smudge', cleaned: false },
 { id: 10, x: 88, y: 52, size: 'small', type: 'dust', cleaned: false },
 { id: 11, x: 38, y: 58, size: 'medium', type: 'lint', cleaned: false },
 { id: 12, x: 76, y: 64, size: 'large', type: 'dust', cleaned: false },
 { id: 13, x: 20, y: 68, size: 'medium', type: 'dust', cleaned: false },
 { id: 14, x: 66, y: 74, size: 'large', type: 'fingerprint', cleaned: false },
 { id: 15, x: 36, y: 80, size: 'small', type: 'dust', cleaned: false },
 { id: 16, x: 84, y: 84, size: 'medium', type: 'lint', cleaned: false },
 { id: 17, x: 50, y: 86, size: 'large', type: 'smudge', cleaned: false },
 { id: 18, x: 18, y: 88, size: 'medium', type: 'dust', cleaned: false },
 { id: 19, x: 72, y: 42, size: 'small', type: 'dust', cleaned: false },
 { id: 20, x: 44, y: 38, size: 'large', type: 'fingerprint', cleaned: false },
 { id: 21, x: 58, y: 24, size: 'medium', type: 'lint', cleaned: false },
 { id: 22, x: 28, y: 52, size: 'small', type: 'dust', cleaned: false },
 { id: 23, x: 80, y: 12, size: 'medium', type: 'dust', cleaned: false },
 { id: 24, x: 42, y: 72, size: 'large', type: 'dust', cleaned: false }
 ];
 setDustSpecks(generatedSpecks);
 setPrepCleanedCount(0);
 setPrepTool('blower');
 setAirPuffs([]);
 setSmudgeWarning(null);
 }, [activeCard]);

 const triggerCleanAt = (x: number, y: number, forceId?: number) => {
 if (prepTool === 'blower') {
 sound.playAirBlower();
 setAirPuffs(prev => [...prev.slice(-6), { id: Date.now() + Math.random(), x, y }]);

 let hitSmudge = false;
 let cleanedThisRound = 0;

 setDustSpecks(prev => {
 return prev.map(d => {
 if (d.cleaned || d.blowingOff) return d;
 const isDirect = forceId !== undefined && d.id === forceId;
 const dist = Math.hypot(d.x - x, d.y - y);
 if (isDirect || dist < 26) {
 if (d.type === 'smudge' || d.type === 'fingerprint') {
 hitSmudge = true;
 return d;
 } else {
 cleanedThisRound++;
 const dirX = d.x > 50 ? 280 : -280;
 const dirY = -220 + Math.random() * 100;
 setTimeout(() => {
 setDustSpecks(curr => curr.map(item => item.id === d.id ? { ...item, cleaned: true, blowingOff: false } : item));
 setPrepCleanedCount(count => count + 1);
 }, 450);
 return { ...d, blowingOff: true, blowDirectionX: dirX, blowDirectionY: dirY };
 }
 }
 return d;
 });
 });

 if (hitSmudge && cleanedThisRound === 0) {
 setSmudgeWarning("WARNING: Blower cannot remove oils/smudges! Use Wipe.");
 setTimeout(() => setSmudgeWarning(null), 1800);
 }
 } else {
 sound.playClothWipe();
 setDustSpecks(prev => {
 return prev.map(d => {
 if (d.cleaned) return d;
 const isDirect = forceId !== undefined && d.id === forceId;
 const dist = Math.hypot(d.x - x, d.y - y);
 if (isDirect || dist < 22) {
 if (!d.cleaned) {
 setPrepCleanedCount(c => c + 1);
 }
 return { ...d, cleaned: true };
 }
 return d;
 });
 });
 }
 };

 const handleCleanSpeck = (id: number, e: React.MouseEvent) => {
 e.stopPropagation();
 const rect = e.currentTarget.parentElement?.getBoundingClientRect();
 if (rect) {
 const x = ((e.clientX - rect.left) / rect.width) * 100;
 const y = ((e.clientY - rect.top) / rect.height) * 100;
 triggerCleanAt(x, y, id);
 }
 };

 return (
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col lg:flex-row gap-6 items-center justify-center py-6">
 <div 
 onMouseDown={(e) => {
 setIsDraggingPrep(true);
 const rect = e.currentTarget.getBoundingClientRect();
 const x = ((e.clientX - rect.left) / rect.width) * 100;
 const y = ((e.clientY - rect.top) / rect.height) * 100;
 setMousePos({ x, y });
 triggerCleanAt(x, y);
 }}
 onMouseMove={(e) => {
 const rect = e.currentTarget.getBoundingClientRect();
 const x = ((e.clientX - rect.left) / rect.width) * 100;
 const y = ((e.clientY - rect.top) / rect.height) * 100;
 setMousePos({ x, y });
 if (isDraggingPrep) {
 triggerCleanAt(x, y);
 }
 }}
 onMouseUp={() => setIsDraggingPrep(false)}
 onMouseLeave={() => {
 setIsDraggingPrep(false);
 setMousePos(null);
 }}
 onTouchStart={(e) => {
 setIsDraggingPrep(true);
 const touch = e.touches[0] || e.changedTouches[0];
 if (touch) {
 const rect = e.currentTarget.getBoundingClientRect();
 const x = ((touch.clientX - rect.left) / rect.width) * 100;
 const y = ((touch.clientY - rect.top) / rect.height) * 100;
 setMousePos({ x, y });
 triggerCleanAt(x, y);
 }
 }}
 onTouchMove={(e) => {
 const touch = e.touches[0] || e.changedTouches[0];
 if (touch) {
 const rect = e.currentTarget.getBoundingClientRect();
 const x = ((touch.clientX - rect.left) / rect.width) * 100;
 const y = ((touch.clientY - rect.top) / rect.height) * 100;
 setMousePos({ x, y });
 if (isDraggingPrep) {
 triggerCleanAt(x, y);
 }
 }
 }}
 onTouchEnd={() => {
 setIsDraggingPrep(false);
 setMousePos(null);
 }}
 className="relative w-72 sm:w-80 aspect-[63/88] rounded-2xl bg-[#0e1018] border-2 border-emerald-400/60 shadow-[0_0_45px_rgba(16,185,129,0.25)] overflow-hidden shrink-0 flex items-center justify-center select-none cursor-crosshair touch-none"
 >
 <img 
 src={activeCard.imageUrl} 
 alt={activeCard.name} 
 className="w-full h-full object-cover block pointer-events-none"
 />

 {/* Interactive Air Puff Animations */}
 <AnimatePresence>
 {airPuffs.map(puff => (
 <motion.div
 key={puff.id}
 initial={{ scale: 0.2, opacity: 0.95 }}
 animate={{ scale: 3.2, opacity: 0 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.55, ease: 'easeOut' }}
 style={{ left: `${puff.x}%`, top: `${puff.y}%` }}
 className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
 >
 <div className="w-16 h-16 rounded-full border-2 border-cyan-300/80 bg-gradient-to-r from-cyan-400/30 to-white/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.8)]">
 <span className="text-xl animate-spin"></span>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>

 {/* Interactive Dust Specks & Smudge Overlays */}
 <div className="absolute inset-0 z-10">
 {dustSpecks.map((speck) => (
 <motion.div
 key={speck.id}
 initial={{ scale: 1, opacity: speck.cleaned ? 0 : 0.9 }}
 animate={
 speck.blowingOff
 ? {
 x: speck.blowDirectionX || 250,
 y: speck.blowDirectionY || -180,
 rotate: 360,
 scale: 0.3,
 opacity: 0
 }
 : speck.cleaned
 ? { scale: 0, opacity: 0 }
 : { scale: 1, opacity: 0.95, x: 0, y: 0, rotate: 0 }
 }
 transition={speck.blowingOff ? { duration: 0.45, ease: 'easeIn' } : { duration: 0.3 }}
 style={{ left: `${speck.x}%`, top: `${speck.y}%` }}
 onClick={(e) => handleCleanSpeck(speck.id, e as any)}
 className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer p-2 rounded-full transition-transform hover:scale-125 ${
 speck.cleaned || speck.blowingOff ? 'pointer-events-none' : 'pointer-events-auto'
 }`}
 >
 {speck.type === 'dust' ? (
 <div className={`${speck.size === 'small' ? 'w-6 h-6 text-xs' : speck.size === 'large' ? 'w-9 h-9 text-base' : 'w-7 h-7 text-sm'} bg-white/95 rounded-full shadow-[0_0_16px_rgba(255,255,255,1)] flex items-center justify-center border-2 border-cyan-300 animate-pulse`}>
 <span className="text-black font-black"></span>
 </div>
 ) : speck.type === 'lint' ? (
 <div className="px-3 py-1.5 rounded-full bg-amber-300/95 border-2 border-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.9)] flex items-center justify-center">
 <span className="text-xs font-black text-amber-950 transform rotate-45">〰 LINT</span>
 </div>
 ) : speck.type === 'fingerprint' ? (
 <div className="w-11 h-11 rounded-full bg-cyan-500/50 border-2 border-cyan-300/90 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.9)]">
 <span className="text-lg"></span>
 </div>
 ) : (
 <div className="w-14 h-10 rounded-full bg-gradient-to-br from-amber-500/80 to-purple-600/80 border-2 border-amber-300 flex items-center justify-center shadow-[0_0_22px_rgba(245,158,11,0.9)]">
 <span className="text-[10px] text-white font-mono font-black tracking-wider"> SMUDGE</span>
 </div>
 )}
 </motion.div>
 ))}
 </div>

 {/* Tool Sprites that follow Mouse Cursor on Card */}
 {mousePos && (
 <motion.div
 style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }}
 animate={
 prepTool === 'cloth' && isDraggingPrep
 ? { rotate: [-15, 20, -15, 20, 0], scale: [1.1, 0.9, 1.1, 0.9, 1] }
 : prepTool === 'blower' && isDraggingPrep
 ? { scale: [1, 0.8, 1.1, 1] }
 : { scale: 1 }
 }
 transition={{ duration: 0.2 }}
 className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
 >
 {prepTool === 'blower' ? (
 <div className="relative flex items-center">
 <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-full border-2 border-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.8)] flex items-center justify-center">
 <Wind className="w-5 h-5 text-white animate-pulse" />
 </div>
 <div className="w-4 h-2.5 bg-gray-300 rounded-r border border-gray-400 shadow-md" />
 {isDraggingPrep && <span className="text-sm absolute left-12 top-0 animate-ping"></span>}
 </div>
 ) : (
 <div className="relative group transform -rotate-12">
 <div className="absolute inset-0 bg-amber-400/40 rounded-xl blur-md" />
 <div className="relative w-12 h-10 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 rounded-lg border-2 border-amber-200 shadow-[0_4px_15px_rgba(245,158,11,0.7)] flex items-center justify-center">
 <div className="absolute inset-1 border border-dashed border-amber-600/40 rounded opacity-70" />
 <span className="text-base"></span>
 <span className="absolute -top-2 -right-2 text-xs animate-bounce"></span>
 </div>
 </div>
 )}
 </motion.div>
 )}

 {/* Warning Toast when blowing on smudge */}
 <AnimatePresence>
 {smudgeWarning && (
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="absolute top-4 inset-x-4 z-50 bg-red-950/95 border border-red-500/80 text-red-200 text-[10px] font-bold p-2.5 rounded-xl shadow-2xl flex items-center justify-center text-center"
 >
 {smudgeWarning}
 </motion.div>
 )}
 </AnimatePresence>

 {/* Tool instructions banner on preview */}
 <div className="absolute bottom-2 inset-x-2 bg-black/80 border border-emerald-500/40 py-1.5 px-3 rounded-xl flex items-center justify-between text-[10px] z-20 pointer-events-none">
 <span className="text-emerald-300 font-bold flex items-center gap-1.5">
 {prepTool === 'blower' ? <Wind className="w-3.5 h-3.5 text-cyan-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
 {prepTool === 'blower' ? 'Click or drag across card to blow air' : 'Wipe with microfiber cloth over smudges'}
 </span>
 <span className="font-mono font-black text-white">{prepCleanedCount}/{dustSpecks.length} CLEANED</span>
 </div>
 </div>

 {/* Stage Controls */}
 <div className="max-w-md w-full bg-[#13141d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
 <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
 <Gauge className="w-4 h-4" /> Step 1 of 5: Micro-Debris Dusting & Surface Prep
 </div>
 <h3 className="text-xl font-black text-white">{activeCard.name}</h3>
 <p className="text-xs text-gray-300 leading-relaxed">
 Before optical caliper scanning, professional graders remove microscopic dust particles and skin oil smudges. Any debris left behind will permanently ruin the surface subgrade inside the slab!
 </p>

 {/* Interactive Tool Selector */}
 <div className="grid grid-cols-2 gap-2.5">
 <button
 onClick={() => { sound.playAirBlower(); setPrepTool('blower'); }}
 className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
 prepTool === 'blower'
 ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
 : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
 }`}
 >
 <div className="flex items-center justify-between mb-1">
 <Wind className={`w-5 h-5 ${prepTool === 'blower' ? 'text-cyan-300' : 'text-gray-400'}`} />
 <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-black/40">Tool 1</span>
 </div>
 <div className="text-xs font-black">Micro-Air Puff Blower</div>
 <div className="text-[10px] text-gray-400">Puffs loose dust particles</div>
 </button>

 <button
 onClick={() => { sound.playClothWipe(); setPrepTool('cloth'); }}
 className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
 prepTool === 'cloth'
 ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
 : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
 }`}
 >
 <div className="flex items-center justify-between mb-1">
 <Sparkles className={`w-5 h-5 ${prepTool === 'cloth' ? 'text-amber-300' : 'text-gray-400'}`} />
 <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-black/40">Tool 2</span>
 </div>
 <div className="text-xs font-black">Anti-Static Wipe</div>
 <div className="text-[10px] text-gray-400">Wipes fingerprints & oil</div>
 </button>
 </div>

 {/* Cleanliness Progress Gauge */}
 <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
 <div className="flex items-center justify-between text-xs font-bold text-gray-300">
 <span>Surface Prep Cleanliness:</span>
 <span className={`${prepCleanedCount === dustSpecks.length ? 'text-emerald-400' : 'text-amber-300'} font-mono font-black`}>
 {Math.round((prepCleanedCount / Math.max(1, dustSpecks.length)) * 100)}% ({prepCleanedCount}/{dustSpecks.length})
 </span>
 </div>
 <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }} 
 animate={{ width: `${(prepCleanedCount / Math.max(1, dustSpecks.length)) * 100}%` }}
 className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"
 />
 </div>
 </div>

 <div className="flex items-center gap-3 pt-2">
 <button
 onClick={() => setDustSpecks(prev => prev.map(d => ({ ...d, cleaned: true })))}
 className="px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer shrink-0"
 >
 Skip Prep
 </button>
 <button
 onClick={() => { sound.playTabSwitch(); onSequenceComplete(); }}
 className={`flex-1 py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
 prepCleanedCount === dustSpecks.length
 ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-[1.02]'
 : 'bg-gradient-to-r from-gray-700 to-gray-600 border border-gray-500 hover:from-gray-600 hover:to-gray-500'
 }`}
 >
 <span>Proceed to Centering Scan</span>
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 </motion.div>
 );
}
