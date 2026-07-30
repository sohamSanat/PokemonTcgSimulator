import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListChecks } from 'lucide-react';
import { sound } from '../../services/sound';

interface OutofPassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToMissions: () => void;
}

/**
 * OutofPassesModal Component
 * 
 * Displays warning popup when the user runs out of booster pack passes.
 */
export function OutofPassesModal({ isOpen, onClose, onGoToMissions }: OutofPassesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1c1c2e] via-[#141422] to-[#0e0e18] border border-[#38bdf8]/50 shadow-[0_0_50px_rgba(56,189,248,0.3)] p-6 text-center relative overflow-hidden"
          >
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#38bdf8]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#38bdf8] via-[#0284c7] to-indigo-600 border-2 border-white flex items-center justify-center text-white mx-auto mb-4 shadow-[0_0_25px_rgba(56,189,248,0.6)] animate-bounce">
              <ListChecks className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              Out of Booster Pack Passes! 🛑
            </h2>
            <p className="text-sm text-gray-300 font-medium mb-6 leading-relaxed">
              You&apos;ve opened all your currently available packs! Complete <strong className="text-[#38bdf8]">Daily, Weekly & Monthly Missions</strong> to claim more Booster Pack Passes and exclusive Promo Cards right now!
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs uppercase transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  sound.playTabSwitch();
                  onGoToMissions();
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#38bdf8] via-[#0284c7] to-indigo-600 hover:from-[#38bdf8]/90 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ListChecks className="w-4 h-4" />
                Go To Missions List
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
