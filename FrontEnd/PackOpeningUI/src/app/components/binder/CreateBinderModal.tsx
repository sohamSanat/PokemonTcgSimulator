import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, FolderPlus, Sparkles, ChevronRight, Layers, Check } from 'lucide-react';
import { MASTER_SET_GENERATIONS, type Binder } from './types';

interface CreateBinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBinder: (binderData: {
    name: string;
    isMasterSet?: boolean;
    masterSetId?: string;
    masterSetName?: string;
    totalCardsInSet?: number;
    generation?: string;
  }) => void;
}

export default function CreateBinderModal({ isOpen, onClose, onCreateBinder }: CreateBinderModalProps) {
  const [binderType, setBinderType] = useState<'normal' | 'masterSet'>('normal');
  const [customName, setCustomName] = useState('');
  const [selectedGenIndex, setSelectedGenIndex] = useState<number>(0);
  const [selectedSetId, setSelectedSetId] = useState<string>('');

  if (!isOpen) return null;

  const currentGen = MASTER_SET_GENERATIONS[selectedGenIndex];
  const selectedSet = currentGen?.sets.find(s => s.id === selectedSetId) || currentGen?.sets[0];

  const handleCreate = () => {
    if (binderType === 'normal') {
      const name = customName.trim() || 'New Custom Binder';
      onCreateBinder({ name, isMasterSet: false });
    } else {
      if (!selectedSet) return;
      const name = `👑 ${selectedSet.name} Master Set`;
      onCreateBinder({
        name,
        isMasterSet: true,
        masterSetId: selectedSet.id,
        masterSetName: selectedSet.name,
        totalCardsInSet: selectedSet.totalCards,
        generation: currentGen.name,
      });
    }
    onClose();
    // Reset defaults
    setCustomName('');
    setBinderType('normal');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9500] flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.8)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xl flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          style={{
            background: 'linear-gradient(145deg, #14141c 0%, #0d0d12 100%)',
            boxShadow: '0 30px 90px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <FolderPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Create New Binder</h2>
                <p className="text-xs text-gray-400">Organize your card collection or track a Master Set</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
            {/* Step 1: Type Selection */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">
                Select Binder Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Normal Binder Option */}
                <button
                  type="button"
                  onClick={() => setBinderType('normal')}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    binderType === 'normal'
                      ? 'border-emerald-500/80 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    {binderType === 'normal' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                        <Check className="w-4 h-4 font-black" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Custom Binder</h3>
                    <p className="text-[11px] text-gray-400 mt-1">Freeform collection binder for any custom cards</p>
                  </div>
                </button>

                {/* Master Set Binder Option */}
                <button
                  type="button"
                  onClick={() => {
                    setBinderType('masterSet');
                    if (!selectedSetId && currentGen?.sets[0]) {
                      setSelectedSetId(currentGen.sets[0].id);
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    binderType === 'masterSet'
                      ? 'border-amber-500/80 bg-gradient-to-br from-amber-500/20 to-purple-600/20 text-white shadow-lg shadow-amber-500/15'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                      <Crown className="w-5 h-5" />
                    </div>
                    {binderType === 'masterSet' && (
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center">
                        <Check className="w-4 h-4 font-black" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-white">Master Set Binder</h3>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Tracks completion progress for an official set</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Configuration */}
            {binderType === 'normal' ? (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Binder Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. Vintage Holos, Secret Rares, Charizards..."
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Generation Dropdown */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    1. Select Generation / Series
                  </label>
                  <select
                    value={selectedGenIndex}
                    onChange={e => {
                      const idx = Number(e.target.value);
                      setSelectedGenIndex(idx);
                      if (MASTER_SET_GENERATIONS[idx]?.sets[0]) {
                        setSelectedSetId(MASTER_SET_GENERATIONS[idx].sets[0].id);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-[#1a1a24] border border-amber-500/30 text-white text-sm focus:outline-none focus:border-amber-400 transition-all"
                  >
                    {MASTER_SET_GENERATIONS.map((gen, idx) => (
                      <option key={gen.name} value={idx}>
                        {gen.name} ({gen.sets.length} sets)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Set Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    2. Select Expansion Set
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto custom-scrollbar p-1">
                    {currentGen.sets.map(s => {
                      const isSelected = (selectedSetId || currentGen.sets[0].id) === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSetId(s.id)}
                          className={`px-3 py-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                              : 'border-white/5 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/15'
                          }`}
                        >
                          <span className="text-xs truncate mr-2">{s.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/40 text-gray-400 shrink-0">
                            {s.totalCards} cards
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Banner */}
                {selectedSet && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crown className="w-6 h-6 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-black text-amber-300">👑 {selectedSet.name} Master Set</div>
                        <div className="text-[11px] text-gray-400">{currentGen.name} &middot; {selectedSet.totalCards} Total Cards</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className={`px-6 py-2.5 rounded-xl text-xs font-black text-black flex items-center gap-2 shadow-lg transition-all ${
                binderType === 'masterSet'
                  ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:brightness-110 shadow-amber-500/25'
                  : 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/25'
              }`}
            >
              <span>Create Binder</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
