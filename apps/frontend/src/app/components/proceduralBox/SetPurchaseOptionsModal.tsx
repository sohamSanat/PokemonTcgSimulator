import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap, Box, CheckCircle2, ArrowRight, TrendingDown, Layers } from 'lucide-react';
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

  const halfBoxUnit = (halfBoxPrice / halfBoxPackCount).toFixed(2);
  const fullBoxUnit = (fullBoxPrice / fullBoxPackCount).toFixed(2);

  const halfBoxSavings = Number((basePackPrice * halfBoxPackCount * 0.10).toFixed(2));
  const fullBoxSavings = Number((basePackPrice * fullBoxPackCount * 0.20).toFixed(2));

  // Info helpers for selected option summary
  const getSelectedInfo = () => {
    switch (selectedOption) {
      case 'single':
        return { title: 'Single Booster Pack', count: 1, price: singlePrice, savings: 0, perPack: singlePrice.toFixed(2) };
      case 'halfBox':
        return { title: 'Half Booster Box', count: halfBoxPackCount, price: halfBoxPrice, savings: halfBoxSavings, perPack: halfBoxUnit };
      case 'fullBox':
        return { title: 'Full Booster Box', count: fullBoxPackCount, price: fullBoxPrice, savings: fullBoxSavings, perPack: fullBoxUnit };
    }
  };

  const selectedInfo = getSelectedInfo();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl bg-zinc-950 border border-zinc-800/80 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-auto"
        >
          {/* Top Header Bar */}
          <div className="relative px-5 sm:px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-3.5">
              {logoUrl ? (
                <img src={logoUrl} alt={set.name} className="h-8 sm:h-10 max-w-[160px] object-contain filter drop-shadow" />
              ) : (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <Box className="w-5 h-5 text-amber-400" />
                </div>
              )}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight truncate max-w-xs sm:max-w-md">
                  {set.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {isJapanese ? 'JAPANESE IMPORT' : 'ENGLISH EDITION'}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {set.cardCount?.official || set.cardCount?.total || 100} Total Cards
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Scrollable Area */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-4 sm:gap-6 min-h-0">
            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
                Select Pack Bundle
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Select single booster packs or save up to 20% with factory-sealed Booster Boxes.
              </p>
            </div>

            {/* 3 Purchase Option Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* --- OPTION 1: SINGLE PACK --- */}
              <div
                onClick={() => setSelectedOption('single')}
                className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.99] ${
                  selectedOption === 'single'
                    ? 'bg-zinc-900/90 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/50'
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70'
                }`}
              >
                {/* Header info inside card */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Single Pack</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    selectedOption === 'single' ? 'bg-amber-400 border-amber-400 text-zinc-950' : 'border-zinc-700'
                  }`}>
                    {selectedOption === 'single' && <CheckCircle2 className="w-4 h-4 fill-zinc-950 text-amber-400" />}
                  </div>
                </div>

                {/* Product Artwork Preview */}
                <div className="my-2 py-1 flex items-center justify-center min-h-[140px]">
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

                {/* Price Section */}
                <div className="w-full mt-2 pt-3 border-t border-zinc-800/80 text-center">
                  <div className="text-2xl font-black text-zinc-100">${singlePrice.toFixed(2)}</div>
                  <div className="text-xs text-zinc-400 font-medium mt-0.5">1 Foil Booster Pack</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">${singlePrice.toFixed(2)} / pack</div>
                </div>
              </div>

              {/* --- OPTION 2: HALF BOOSTER BOX --- */}
              <div
                onClick={() => setSelectedOption('halfBox')}
                className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.99] ${
                  selectedOption === 'halfBox'
                    ? 'bg-zinc-900/90 border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.15)] ring-1 ring-purple-400/50'
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70'
                }`}
              >
                {/* Discount Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/50 text-[10px] font-bold text-purple-300 shadow-md flex items-center gap-1 whitespace-nowrap">
                  <TrendingDown className="w-3 h-3 text-purple-400" />
                  <span>SAVE 10% (${halfBoxSavings.toFixed(2)})</span>
                </div>

                <div className="flex justify-between items-center mb-2 mt-1">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Half Box</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    selectedOption === 'halfBox' ? 'bg-purple-400 border-purple-400 text-zinc-950' : 'border-zinc-700'
                  }`}>
                    {selectedOption === 'halfBox' && <CheckCircle2 className="w-4 h-4 fill-zinc-950 text-purple-400" />}
                  </div>
                </div>

                {/* Product Artwork Preview */}
                <div className="my-2 py-1 flex items-center justify-center min-h-[140px]">
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

                {/* Price Section */}
                <div className="w-full mt-2 pt-3 border-t border-zinc-800/80 text-center">
                  <div className="text-2xl font-black text-purple-300">${halfBoxPrice.toFixed(2)}</div>
                  <div className="text-xs text-purple-200 font-semibold mt-0.5">{halfBoxPackCount} Booster Packs</div>
                  <div className="text-[11px] text-purple-400 font-mono mt-0.5">${halfBoxUnit} / pack</div>
                </div>
              </div>

              {/* --- OPTION 3: FULL BOOSTER BOX --- */}
              <div
                onClick={() => setSelectedOption('fullBox')}
                className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.99] ${
                  selectedOption === 'fullBox'
                    ? 'bg-zinc-900/90 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/50'
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70'
                }`}
              >
                {/* Best Value Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[10px] font-black text-zinc-950 shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles className="w-3 h-3 fill-zinc-950 text-zinc-950" />
                  <span>BEST VALUE · SAVE 20%</span>
                </div>

                <div className="flex justify-between items-center mb-2 mt-1">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Full Box</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    selectedOption === 'fullBox' ? 'bg-amber-400 border-amber-400 text-zinc-950' : 'border-zinc-700'
                  }`}>
                    {selectedOption === 'fullBox' && <CheckCircle2 className="w-4 h-4 fill-zinc-950 text-amber-400" />}
                  </div>
                </div>

                {/* Product Artwork Preview */}
                <div className="my-2 py-1 flex items-center justify-center min-h-[140px]">
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

                {/* Price Section */}
                <div className="w-full mt-2 pt-3 border-t border-zinc-800/80 text-center">
                  <div className="text-2xl font-black text-amber-300">${fullBoxPrice.toFixed(2)}</div>
                  <div className="text-xs text-amber-200 font-semibold mt-0.5">{fullBoxPackCount} Booster Packs</div>
                  <div className="text-[11px] text-amber-400 font-mono mt-0.5">${fullBoxUnit} / pack</div>
                </div>
              </div>

            </div>
          </div>

          {/* Dynamic Footer Bar */}
          <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md flex flex-col gap-3 shrink-0">
            
            {/* Selection Summary Line */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-zinc-300 font-medium">Selected:</span>
                <span className="font-bold text-zinc-100">{selectedInfo.title}</span>
                <span className="text-zinc-400">({selectedInfo.count} packs)</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedInfo.savings > 0 && (
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Save ${selectedInfo.savings.toFixed(2)}
                  </span>
                )}
                <span className="font-black text-amber-400 font-mono text-sm sm:text-base">
                  ${selectedInfo.price.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => onSelectOption(selectedOption, 'rip')}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Zap className="w-4 h-4 fill-zinc-950 text-zinc-950" />
                <span>Unbox & Rip Live</span>
                <ArrowRight className="w-4 h-4 text-zinc-950" />
              </button>

              <button
                onClick={() => onSelectOption(selectedOption, 'vault')}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-zinc-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Box className="w-4 h-4 text-purple-400" />
                <span>Save Box to Vault</span>
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
