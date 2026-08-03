import React, { useState, useEffect } from 'react';
import { Shield, Layers, Zap, ShieldCheck } from 'lucide-react';
import type { Card } from '../../binder/types';
import { sound } from '../../../services/sound';

interface CardSaverStationProps {
 activeCard: Card;
 hasPennySleeve: boolean;
 onHasPennySleeveChange: (has: boolean) => void;
 hasCardSaver: boolean;
 onHasCardSaverChange: (has: boolean) => void;
}

/**
 * Card Saver Station
 * 
 * Station 4 in the Restoration Studio. Guides the user through placing the card
 * in a penny sleeve and ultrasonic laser sealing it in a Card Saver 1.
 */
export default function CardSaverStation({
 activeCard,
 hasPennySleeve,
 onHasPennySleeveChange,
 hasCardSaver,
 onHasCardSaverChange
}: CardSaverStationProps) {
 const [sleeveSlideProgress, setSleeveSlideProgress] = useState<number>(hasPennySleeve ? 100 : 0);
 const [saverSnapProgress, setSaverSnapProgress] = useState<number>(hasCardSaver ? 100 : 0);
 const [sleeveStyle, setSleeveStyle] = useState<'clear' | 'gold' | 'holo'>('clear');
 const [isLaserSealing, setIsLaserSealing] = useState<boolean>(false);
 const [laserScanPos, setLaserScanPos] = useState<number>(0);

 // Station 4: Laser sealing animation
 useEffect(() => {
 let interval: NodeJS.Timeout;
 if (isLaserSealing) {
 interval = setInterval(() => {
 setLaserScanPos(prev => {
 if (prev >= 100) {
 setIsLaserSealing(false);
 setSaverSnapProgress(100);
 onHasCardSaverChange(true);
 sound.playLaserScan();
 return 100;
 }
 sound.playUltrasonicWeldPulse();
 return prev + 20;
 });
 }, 150);
 }
 return () => clearInterval(interval);
 }, [isLaserSealing, onHasCardSaverChange]);

 const handleTriggerLaserSeal = () => {
 sound.playAirBlower();
 setSleeveSlideProgress(100);
 onHasPennySleeveChange(true);
 setIsLaserSealing(true);
 setLaserScanPos(0);
 };

 const handleEncapsulateBoth = () => {
 sound.playButtonClick();
 setSleeveSlideProgress(100);
 setSaverSnapProgress(100);
 onHasPennySleeveChange(true);
 onHasCardSaverChange(true);
 sound.playLaserScan();
 };

 return (
 <div className="relative flex flex-col items-center max-w-md w-full my-auto">
 {/* Card Display Canvas */}
 <div className="relative w-48 sm:w-60 md:w-72 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-2 border-white/20 select-none group transition-transform duration-300 shrink-0">
 <img
 src={activeCard.imageUrl}
 alt={activeCard.name}
 className="w-full h-full object-cover block pointer-events-none"
 draggable={false}
 />

 {/* Station 4: Customized Penny Sleeve & Ultrasonic Laser Sealing */}
 {sleeveSlideProgress > 0 && (
 <div
 className={`absolute inset-x-0 top-0 border-2 transition-all duration-300 pointer-events-none flex items-center justify-center shadow-lg ${
 sleeveStyle === 'gold' 
 ? 'border-amber-400 bg-amber-500/20' 
 : sleeveStyle === 'holo' 
 ? 'border-purple-400 bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-cyan-500/20' 
 : 'border-emerald-400/80 bg-emerald-400/20'
 }`}
 style={{ height: `${sleeveSlideProgress}%` }}
 >
 <span className="text-[9px] font-black text-emerald-200 bg-black/80 px-2 py-0.5 rounded border border-emerald-400/40 uppercase">
 {sleeveStyle} Sleeve ({sleeveSlideProgress}%)
 </span>
 </div>
 )}

 {/* Ultrasonic Laser Sealing Scanline Animation */}
 {isLaserSealing && (
 <div
 className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_15px_rgba(34,211,238,1)] z-30 pointer-events-none"
 style={{ top: `${laserScanPos}%` }}
 />
 )}

 {/* Card Saver 1 Encapsulation Case */}
 {saverSnapProgress > 0 && (
 <div
 className="absolute inset-0 border-4 border-amber-400 bg-amber-500/25 pointer-events-none flex flex-col items-center justify-between p-3 transition-all duration-300 shadow-[0_0_40px_rgba(245,158,11,0.6)] z-20"
 style={{ opacity: saverSnapProgress / 100 }}
 >
 {/* Top Holographic Tamper Seal Header */}
 <div className="w-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-black text-[9px] font-black uppercase text-center py-1 rounded shadow-md border border-white/50 tracking-wider">
 PSA PREP - CARD SAVER 1 SEALED 
 </div>

 <div className="px-3 py-1.5 rounded-xl bg-black/90 border border-amber-400/60 shadow-2xl flex flex-col items-center gap-1">
 <span className="text-[10px] font-black text-amber-300 flex items-center gap-1">
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
 CARD SAVER 1 ENCAPSULATED
 </span>
 <span className="text-[9px] text-gray-300 font-mono">
 PREDICTED SUB-GRADES: GEM MT 10
 </span>
 </div>

 {/* Bottom Security Barcode */}
 <div className="w-full bg-black/80 p-1 rounded border border-white/20 text-center font-mono text-[8px] text-amber-400 tracking-widest">
 |||||| |||| ||||||| #PSA-PREP-2026
 </div>
 </div>
 )}
 </div>

 {/* Station 4: Encapsulation Controls (Super High Tech overhaul) */}
 <div className="mt-3 md:mt-4 w-full">
 <div className="p-3 rounded-2xl bg-black/80 border border-emerald-500/30 space-y-2.5">
 <div className="flex items-center justify-between text-xs text-emerald-300 font-bold border-b border-white/10 pb-1.5">
 <span className="flex items-center gap-1">
 <Shield className="w-3.5 h-3.5 text-emerald-400" />
 <span>Ultrasonic Card Saver Encapsulation</span>
 </span>
 <span className="text-amber-300 font-mono text-[11px] font-bold">
 {saverSnapProgress === 100 ? ' GEM MT 10 PREDICTED' : 'Awaiting Seal'}
 </span>
 </div>

 {/* Interactive Sleeve Slider & Customization */}
 <div className="space-y-2">
 <div className="flex items-center justify-between text-[11px] text-gray-300">
 <span>Sleeve Style:</span>
 <div className="flex gap-1">
 {(['clear', 'gold', 'holo'] as const).map(style => (
 <button
 key={style}
 onClick={() => { setSleeveStyle(style); sound.playButtonClick(); }}
 className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border cursor-pointer ${
 sleeveStyle === style 
 ? 'border-amber-400 bg-amber-500/30 text-amber-300' 
 : 'border-white/10 bg-white/5 text-gray-400'
 }`}
 >
 {style}
 </button>
 ))}
 </div>
 </div>

 <div className="flex items-center gap-2">
 <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
 <input
 type="range"
 min="0"
 max="100"
 value={sleeveSlideProgress}
 onChange={e => {
 const val = Number(e.target.value);
 setSleeveSlideProgress(val);
 onHasPennySleeveChange(val > 50);
 if (val > 0) sound.playClothWipe();
 }}
 className="flex-1 accent-emerald-400 cursor-pointer"
 />
 <span className="text-xs font-mono text-emerald-300 w-10 text-right">{sleeveSlideProgress}%</span>
 </div>
 </div>

 {/* Laser Sealing & 1-Click Encapsulation Buttons */}
 <div className="flex gap-2">
 <button
 onClick={handleTriggerLaserSeal}
 disabled={isLaserSealing}
 className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-lg cursor-pointer hover:brightness-110 disabled:opacity-50"
 >
 <Zap className="w-3.5 h-3.5" />
 <span>{isLaserSealing ? 'Sealing...' : ' Ultrasonic Laser Seal'}</span>
 </button>

 <button
 onClick={handleEncapsulateBoth}
 className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-lg cursor-pointer hover:brightness-110"
 >
 <ShieldCheck className="w-3.5 h-3.5" />
 <span>1-Click Snap</span>
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
