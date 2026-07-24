import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Package, X, Gift, ArrowRight } from 'lucide-react';
import { MysteryPackConfig } from '../data/mysteryPacks';

interface LuckyDropModalProps {
  isOpen: boolean;
  pack: MysteryPackConfig | null;
  onClose: () => void;
  onOpenNow: (pack: MysteryPackConfig) => void;
  onAddToInventory: (pack: MysteryPackConfig) => void;
}

export const LuckyDropModal: React.FC<LuckyDropModalProps> = ({
  isOpen,
  pack,
  onClose,
  onOpenNow,
  onAddToInventory
}) => {
  if (!isOpen || !pack) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#1c142d] via-[#120d20] to-[#0a0712] border-2 border-amber-400/70 shadow-[0_0_60px_rgba(245,158,11,0.5)] p-6 relative overflow-hidden text-white"
        >
          {/* Ambient particle glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-gradient-to-r from-amber-500/30 via-purple-600/30 to-pink-500/30 rounded-full blur-3xl pointer-events-none animate-pulse" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Banner */}
          <div className="flex flex-col items-center text-center mb-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-purple-600 p-0.5 shadow-[0_0_30px_rgba(245,158,11,0.6)] mb-3 animate-bounce">
              <div className="w-full h-full bg-[#120d20] rounded-[14px] flex items-center justify-center text-2xl">
                🎁
              </div>
            </div>
            <div className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/40 px-3 py-1 rounded-full shadow-sm mb-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>5-Min Lucky Drop Hit!</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-400 tracking-tight mt-1">
              {pack.name}
            </h2>
            <div className="text-xs text-gray-300 font-medium mt-1">
              Free 5-minute reward claimed successfully!
            </div>
          </div>

          {/* Pack Showcase Card */}
          <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-amber-400/40 rounded-2xl p-4 mb-6 relative z-10 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Pack Image */}
              <div className="w-32 h-44 rounded-xl overflow-hidden bg-black/60 border border-amber-300/40 shrink-0 relative shadow-[0_10px_25px_rgba(0,0,0,0.7)] group">
                <img
                  src={pack.packArt}
                  alt={pack.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://assets.tcgdex.net/en/sv/sv03.5/logo';
                  }}
                />
                <div className="absolute top-1.5 left-1.5 text-[10px] font-black bg-black/80 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/40">
                  ${pack.price.toFixed(2)}
                </div>
              </div>

              {/* Pack Info */}
              <div className="flex-1 flex flex-col justify-between text-center sm:text-left">
                <div>
                  <div className="inline-block text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-md border border-amber-400/30 mb-2">
                    {pack.badge}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium line-clamp-3">
                    {pack.description}
                  </p>
                </div>

                {pack.highlightSets && pack.highlightSets.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-white/10">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Featured Sets Inside:
                    </span>
                    <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                      {pack.highlightSets.slice(0, 3).map((set, idx) => (
                        <span key={idx} className="text-[9px] font-bold bg-white/10 text-gray-200 px-2 py-0.5 rounded-full border border-white/10">
                          {set}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
            <button
              onClick={() => onOpenNow(pack)}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(245,158,11,0.5)] border border-amber-300/60 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>OPEN NOW</span>
            </button>

            <button
              onClick={() => onAddToInventory(pack)}
              className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Package className="w-4 h-4 text-amber-300" />
              <span>SAVE TO INVENTORY</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
