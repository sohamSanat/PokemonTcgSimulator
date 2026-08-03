import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock } from 'lucide-react';

interface InsufficientCashModalProps {
 isOpen: boolean;
 onClose: () => void;
}

/**
 * InsufficientCashModal Component
 * 
 * Displays warning popup when the user doesn't have enough daily cash to buy a pack.
 */
export function InsufficientCashModal({ isOpen, onClose }: InsufficientCashModalProps) {
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
 className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1c1c2e] via-[#141422] to-[#0e0e18] border border-red-500/50 shadow-[0_0_50px_rgba(244,63,94,0.3)] p-6 text-center relative overflow-hidden"
 >
 <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

 <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-500 via-orange-500 to-red-600 border-2 border-white flex items-center justify-center text-white mx-auto mb-4 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse">
 <Lock className="w-8 h-8" />
 </div>

 <h2 className="text-2xl font-black text-white tracking-tight mb-2">
 Insufficient Cash Fund! 
 </h2>
 <p className="text-sm text-gray-300 font-medium mb-6 leading-relaxed">
 You don&apos;t have enough daily cash allowance to open this pack! Come back tomorrow for your $80 daily cash refresh!
 </p>

 <div className="flex flex-col sm:flex-row gap-3">
 <button
 onClick={onClose}
 className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs uppercase transition-all cursor-pointer"
 >
 Close
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 );
}
