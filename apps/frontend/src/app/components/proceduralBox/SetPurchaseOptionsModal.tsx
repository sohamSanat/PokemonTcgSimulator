import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap, Box, ShieldCheck, CheckCircle2, TrendingDown, ArrowRight } from 'lucide-react';
import { ProceduralBoosterBox } from './ProceduralBoosterBox';

export interface SetPurchaseOptionsModalProps {
 isOpen: boolean;
 onClose: () => void;
 set: {
 id: string;
 name: string;
 logo?: string | null;
 symbol?: string | null;
 cardCount?: { total: number; official: number };
 } | null;
 packArtUrl?: string | null;
 logoUrl?: string | null;
 language?: 'en' | 'ja';
 basePackPrice: number;
 onSelectOption: (option: 'single' | 'halfBox' | 'fullBox', action: 'rip' | 'vault') => void;
}

export const SetPurchaseOptionsModal: React.FC<SetPurchaseOptionsModalProps> = ({
 isOpen,
 onClose,
 set,
 packArtUrl,
 logoUrl,
 language = 'en',
 basePackPrice,
 onSelectOption
}) => {
 const [selectedOption, setSelectedOption] = useState<'single' | 'halfBox' | 'fullBox'>('fullBox');

 if (!isOpen || !set) return null;

 const isJapanese = language === 'ja' || set.id.endsWith('_ja');

 // Pack counts:
 // English: Single = 1, Half Box = 18, Full Box = 36
 // Japanese: Single = 1, Half Box = 15, Full Box = 30
 const halfBoxPackCount = isJapanese ? 15 : 18;
 const fullBoxPackCount = isJapanese ? 30 : 36;

 // Prices with bundle discounts:
 const singlePrice = Number(basePackPrice.toFixed(2));
 const halfBoxPrice = Number((basePackPrice * halfBoxPackCount * 0.90).toFixed(2)); // 10% discount
 const fullBoxPrice = Number((basePackPrice * fullBoxPackCount * 0.80).toFixed(2)); // 20% discount

 const halfBoxSavings = Number((basePackPrice * halfBoxPackCount * 0.10).toFixed(2));
 const fullBoxSavings = Number((basePackPrice * fullBoxPackCount * 0.20).toFixed(2));

 return (
 <AnimatePresence>
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
 <motion.div
 initial={{ opacity: 0, scale: 0.92, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.92, y: 20 }}
 transition={{ duration: 0.25, ease: 'easeOut' }}
 className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl bg-gradient-to-b from-[#1c1c28] via-[#141420] to-[#0d0d16] border border-amber-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col my-auto"
 >
 {/* Top Header Bar */}
 <div className="relative px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
 <div className="flex items-center gap-3">
 {logoUrl ? (
 <img src={logoUrl} alt={set.name} className="h-8 sm:h-11 max-w-[180px] object-contain filter drop-shadow-md" />
 ) : (
 <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
 <Box className="w-6 h-6 text-amber-300" />
 </div>
 )}
 <div>
 <h3 className="text-base sm:text-xl font-black text-white tracking-wide truncate max-w-xs sm:max-w-md">
 {set.name}
 </h3>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
 {isJapanese ? 'JAPANESE IMPORT' : 'ENGLISH EDITION'}
 </span>
 <span className="text-[10px] text-gray-400 font-semibold">
 {set.cardCount?.official || set.cardCount?.total || 100} Total Cards
 </span>
 </div>
 </div>
 </div>

 <button
 onClick={onClose}
 className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Main Scrollable Content Area */}
 <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-3 sm:gap-4 min-h-0">
 <div className="text-center">
 <h2 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
 Choose How You Want to Rip
 </h2>
 <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
 Select a single booster pack or save up to 20% with factory-sealed Booster Boxes!
 </p>
 </div>

 {/* 3 Purchase Option Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
 {/* Option 1: A Pack */}
 <div
 onClick={() => setSelectedOption('single')}
 className={`relative p-3 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-between text-center group active:scale-[0.98] ${
 selectedOption === 'single'
 ? 'bg-gradient-to-b from-amber-500/20 via-orange-500/10 to-transparent border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] scale-[1.01] sm:scale-[1.02]'
 : 'bg-[#12121c] border-white/10 hover:border-white/30 hover:bg-[#181826]'
 }`}
 >
 <div className="w-full flex justify-between items-center mb-1">
 <span className="text-xs font-black text-amber-300 uppercase tracking-wider">Single Pack</span>
 {selectedOption === 'single' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
 </div>

 <div className="my-2 py-1">
 <ProceduralBoosterBox
 type="pack"
 setName={set.name}
 setId={set.id}
 logoUrl={logoUrl}
 packArtUrl={packArtUrl}
 packCount={1}
 language={language}
 />
 </div>

 <div className="w-full mt-1 pt-2 sm:pt-3 border-t border-white/10">
 <div className="text-xl sm:text-2xl font-black text-white">${singlePrice.toFixed(2)}</div>
 <div className="text-[10px] sm:text-[11px] text-gray-400 font-semibold mt-0.5">1 Foil Booster Pack</div>
 </div>
 </div>

 {/* Option 2: Half Booster Box */}
 <div
 onClick={() => setSelectedOption('halfBox')}
 className={`relative p-3 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-between text-center group active:scale-[0.98] ${
 selectedOption === 'halfBox'
 ? 'bg-gradient-to-b from-purple-500/20 via-indigo-500/10 to-transparent border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.35)] scale-[1.01] sm:scale-[1.02]'
 : 'bg-[#12121c] border-white/10 hover:border-white/30 hover:bg-[#181826]'
 }`}
 >
 {/* Savings Badge */}
 <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-[9px] sm:text-[10px] font-black text-white shadow-md flex items-center gap-1 border border-purple-300/40 whitespace-nowrap">
 <TrendingDown className="w-3 h-3 text-purple-200" />
 <span>SAVE 10% (${halfBoxSavings.toFixed(2)})</span>
 </div>

 <div className="w-full flex justify-between items-center mb-1 mt-1">
 <span className="text-xs font-black text-purple-300 uppercase tracking-wider">Half Booster Box</span>
 {selectedOption === 'halfBox' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
 </div>

 <div className="my-1">
 <ProceduralBoosterBox
 type="half"
 setName={set.name}
 setId={set.id}
 logoUrl={logoUrl}
 packArtUrl={packArtUrl}
 packCount={halfBoxPackCount}
 language={language}
 />
 </div>

 <div className="w-full mt-1 pt-2 sm:pt-3 border-t border-white/10">
 <div className="text-xl sm:text-2xl font-black text-purple-300">${halfBoxPrice.toFixed(2)}</div>
 <div className="text-[10px] sm:text-[11px] text-gray-300 font-extrabold mt-0.5">
 {halfBoxPackCount} Packs (${(halfBoxPrice / halfBoxPackCount).toFixed(2)}/pack)
 </div>
 </div>
 </div>

 {/* Option 3: Full Booster Box */}
 <div
 onClick={() => setSelectedOption('fullBox')}
 className={`relative p-3 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-between text-center group active:scale-[0.98] ${
 selectedOption === 'fullBox'
 ? 'bg-gradient-to-b from-amber-500/25 via-yellow-500/15 to-transparent border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.45)] scale-[1.01] sm:scale-[1.02]'
 : 'bg-[#12121c] border-white/10 hover:border-white/30 hover:bg-[#181826]'
 }`}
 >
 {/* Best Value Badge */}
 <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-[9px] sm:text-[10px] font-black text-black shadow-lg flex items-center gap-1 border border-yellow-100 whitespace-nowrap">
 <Sparkles className="w-3 h-3 text-black" />
 <span>BEST VALUE — SAVE 20% (${fullBoxSavings.toFixed(2)})</span>
 </div>

 <div className="w-full flex justify-between items-center mb-1 mt-1">
 <span className="text-xs font-black text-amber-300 uppercase tracking-wider">Full Booster Box</span>
 {selectedOption === 'fullBox' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
 </div>

 <div className="my-1">
 <ProceduralBoosterBox
 type="full"
 setName={set.name}
 setId={set.id}
 logoUrl={logoUrl}
 packArtUrl={packArtUrl}
 packCount={fullBoxPackCount}
 language={language}
 />
 </div>

 <div className="w-full mt-1 pt-2 sm:pt-3 border-t border-white/10">
 <div className="text-xl sm:text-2xl font-black text-amber-300">${fullBoxPrice.toFixed(2)}</div>
 <div className="text-[10px] sm:text-[11px] text-amber-200 font-extrabold mt-0.5">
 {fullBoxPackCount} Packs (${(fullBoxPrice / fullBoxPackCount).toFixed(2)}/pack)
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Fixed Footer Action Buttons */}
 <div className="p-3 sm:p-5 border-t border-white/10 bg-[#0d0d16]/95 backdrop-blur-md flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 shrink-0">
 <button
 onClick={() => {
 onSelectOption(selectedOption, 'rip');
 }}
 className="w-full sm:flex-1 py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
 >
 <Zap className="w-4 h-4 text-black fill-black" />
 <span>Unbox & Rip Live </span>
 <ArrowRight className="w-4 h-4 text-black" />
 </button>

 <button
 onClick={() => {
 onSelectOption(selectedOption, 'vault');
 }}
 className="w-full sm:w-auto py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-gray-200 hover:text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
 >
 <Box className="w-4 h-4 text-purple-300" />
 <span>Save Box to Vault </span>
 </button>
 </div>
 </motion.div>
 </div>
 </AnimatePresence>
 );
};
