import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCcw, Sparkles, Loader2 } from 'lucide-react';
import { sound } from '../../services/sound';
import { PokemonCard, TCGDexSetSummary, handleCardImageError } from '../../services/tcgdex';
import { imageFallbacks } from '../../utils/packUtils';

interface ChaseCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSet: TCGDexSetSummary | null;
  chaseCardsForActiveSet: Array<{ card: PokemonCard; value: number; setName?: string }>;
  isChaseCardsReady: boolean;
  onSelectChaseCard: (card: PokemonCard, value: number, index: number) => void;
}

/**
 * ChaseCardsModal Component
 * 
 * Displays top 12 chase cards and estimated real-market values for the currently selected set.
 */
export function ChaseCardsModal({
  isOpen,
  onClose,
  currentSet,
  chaseCardsForActiveSet,
  isChaseCardsReady,
  onSelectChaseCard,
}: ChaseCardsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/85"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="w-full max-w-4xl max-h-[88vh] rounded-3xl bg-gradient-to-b from-[#1c1c28] via-[#14141c] to-[#0d0d12] border border-amber-500/40 p-6 sm:p-8 shadow-[0_25px_90px_rgba(245,158,11,0.3)] flex flex-col relative overflow-hidden"
          >
            {/* Top ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-20 w-96 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-black text-2xl shadow-[0_4px_15px_rgba(245,158,11,0.5)]">
                  🔥
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Set Chase Cards & Holy Grails
                    </h3>
                    <span className="bg-amber-400/20 border border-amber-400/50 text-amber-300 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full">
                      TOP 12 HITS
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Most expensive and sought-after pulls in <span className="text-amber-300 font-bold">{currentSet?.name || 'Active Set'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chase Cards Grid */}
            <div className="overflow-y-auto pr-1 py-6 my-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 relative z-10 custom-scrollbar min-h-[300px]">
              {!isChaseCardsReady || !currentSet || chaseCardsForActiveSet.length === 0 ? (
                <>
                  {/* Animated Loading Header Banner */}
                  <div className="col-span-full py-5 px-4 flex flex-col items-center justify-center bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-400/35 rounded-2xl mb-3 shadow-[0_10px_30px_rgba(245,158,11,0.15)] relative overflow-hidden backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-pulse -translate-x-full" />
                    <div className="flex items-center gap-2.5 mb-1 z-10">
                      <RefreshCcw className="w-5 h-5 text-amber-400 animate-spin" />
                      <h3 className="text-sm sm:text-base font-black tracking-widest uppercase bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                        Loading Chase Cards...
                      </h3>
                      <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
                    </div>
                    <p className="text-[11px] text-gray-300 font-semibold tracking-wide z-10 text-center">
                      Warming up real market prices & high-resolution artwork for <span className="text-amber-300 font-bold">{currentSet?.name || 'Active Set'}</span>
                    </p>
                  </div>

                  {/* Shimmering Skeleton Curtain Cards */}
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={`curtain-modal-${idx}`}
                      className="relative rounded-2xl bg-[#181824]/80 border border-amber-500/20 p-3 flex flex-col items-center justify-between overflow-hidden shadow-lg"
                      style={{ minHeight: '235px' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-pulse -translate-x-full" />
                      <div className="w-full flex items-center justify-between mb-2 gap-1.5">
                        <div className="w-14 h-5 rounded-md bg-amber-400/20 animate-pulse" />
                        <div className="w-12 h-5 rounded-md bg-emerald-400/20 animate-pulse" />
                      </div>
                      <div className="w-24 h-36 rounded-lg bg-black/50 border border-white/10 my-1 animate-pulse" />
                      <div className="w-full flex flex-col items-center gap-1.5 mt-2">
                        <div className="w-20 h-3 rounded-full bg-white/15 animate-pulse" />
                        <div className="w-14 h-2.5 rounded-full bg-amber-400/10 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </>
              ) : chaseCardsForActiveSet.length > 0 ? (
                chaseCardsForActiveSet.map(({ card, value, setName }, idx) => (
                  <div
                    key={card.id || idx}
                    onClick={() => {
                      sound.playCardFlip();
                      onSelectChaseCard(card, value, idx);
                    }}
                    className="group relative rounded-2xl bg-gradient-to-b from-[#1c1e2d]/95 to-[#131520]/95 border border-white/10 hover:border-amber-400/70 p-3 flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(245,158,11,0.25)] cursor-pointer overflow-hidden"
                    style={{ minHeight: '235px' }}
                  >
                    {/* Rank badge and Price directly above card art */}
                    <div className="w-full flex items-center justify-between mb-2 gap-1.5">
                      <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-[10px] uppercase shadow-md flex items-center shrink-0">
                        <span>#{idx + 1} CHASE</span>
                      </div>
                      <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-black text-xs shadow-sm flex items-center gap-0.5 shrink-0">
                        <span>${value.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Miniature Card Artwork Container */}
                    <div
                      className="relative w-28 h-36 rounded-lg overflow-hidden my-1 shadow-md group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300 bg-black/50 border border-white/15 flex items-center justify-center shrink-0"
                      style={{ width: '100px', height: '140px' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#222230] to-[#12121a] flex flex-col items-center justify-center p-1 text-center border-2 border-[#333344] z-0">
                        <span className="text-gray-500/80 font-black tracking-tighter text-[10px] mb-1">{card.localId || card.id?.split('-').pop()}</span>
                        <span className="font-bold text-white text-[10px] leading-tight line-clamp-3 w-full px-1">{card.name}</span>
                      </div>
                      <img
                        src={imageFallbacks.get(card.id) || card.images?.small || card.images?.large || `https://assets.tcgdex.net/en/swsh/${card.set?.id || (card.id?.includes('-') ? card.id.split('-')[0] : null) || (currentSet?.id && !currentSet.id.includes('mystery') && !currentSet.id.includes('pack') ? currentSet.id : 'swsh3')}/${card.localId || card.id?.split('-').pop() || idx + 1}/low.webp`}
                        alt={card.name}
                        className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 block p-0.5 z-10"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          const num = card.localId || card.id?.split('-').pop() || `${idx + 1}`;
                          const cardSetId = card.set?.id || (card.id?.includes('-') ? card.id.split('-')[0] : null) || (currentSet?.id && !currentSet.id.includes('mystery') && !currentSet.id.includes('pack') ? currentSet.id : 'swsh3');
                          handleCardImageError(target, cardSetId, num);
                          imageFallbacks.set(card.id, target.src);
                        }}
                      />
                    </div>

                    {/* Card Name and Value Info */}
                    <div className="w-full text-center mt-2 pt-1.5 border-t border-white/10 flex flex-col justify-end">
                      <h4 className="text-xs font-black text-white truncate group-hover:text-amber-300 transition-colors">
                        {card.name}
                      </h4>
                      <div className="text-[9px] text-gray-400 truncate font-semibold mt-0.5">
                        {setName || card.rarity || 'Secret / Ultra Rare'}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between w-full bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Est. Value</span>
                        <span className="text-xs font-black text-emerald-400 tracking-tight shadow-sm">
                          ${value.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
                  <span className="text-sm font-bold">Analyzing set intelligence and market pricing...</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative z-10">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Click any chase card to inspect high-resolution holographic details & pricing.</span>
              </div>
              <button
                onClick={() => {
                  sound.playButtonClick();
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.5)] transition-all cursor-pointer hover:scale-105"
              >
                Close & Hunt This Set
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
