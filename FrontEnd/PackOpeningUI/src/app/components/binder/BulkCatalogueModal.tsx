import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Layers, Package, Search, Inbox } from 'lucide-react';
import { getCatalogues, type BulkCard, type CatalogueStore } from './types';

interface BulkCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkCatalogueModal({ isOpen, onClose }: BulkCatalogueModalProps) {
  const [catalogues, setCatalogues] = useState<CatalogueStore>({});
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [previewCard, setPreviewCard] = useState<BulkCard | null>(null);

  useEffect(() => {
    const loadCatalogues = () => {
      const data = getCatalogues();
      setCatalogues(data);
      const sets = Object.keys(data).sort();
      if (!selectedSet || !sets.includes(selectedSet)) {
        setSelectedSet(sets.length > 0 ? sets[0] : null);
      }
    };

    if (isOpen) {
      loadCatalogues();
      window.addEventListener('storage', loadCatalogues);
    }
    return () => {
      window.removeEventListener('storage', loadCatalogues);
    };
  }, [isOpen, selectedSet]);

  const setNames = useMemo(() => Object.keys(catalogues).sort(), [catalogues]);

  const currentCards: BulkCard[] = useMemo(() => {
    if (!selectedSet || !catalogues[selectedSet]) return [];
    return Object.values(catalogues[selectedSet])
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.count - a.count);
  }, [catalogues, selectedSet, search]);

  const totalBulkCards = useMemo(() => {
    return Object.values(catalogues).reduce((total, setCards) => {
      return total + Object.values(setCards).reduce((s, c) => s + c.count, 0);
    }, 0);
  }, [catalogues]);

  const totalUniqueCards = useMemo(() => {
    return Object.values(catalogues).reduce((total, setCards) => total + Object.keys(setCards).length, 0);
  }, [catalogues]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.75)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-5xl h-[80vh] flex flex-col rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(15,25,30,0.97) 0%, rgba(10,20,28,0.99) 100%)',
              border: '1px solid rgba(45,212,191,0.2)',
              boxShadow: '0 0 60px rgba(45,212,191,0.08), 0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0"
              style={{ background: 'linear-gradient(90deg, rgba(45,212,191,0.06), transparent)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, rgba(45,212,191,0.2), rgba(20,184,166,0.1))', border: '1px solid rgba(45,212,191,0.3)' }}
                >
                  <Layers className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Bulk Vault</h2>
                  <p className="text-[11px] text-teal-400/70 font-semibold">
                    {totalBulkCards.toLocaleString()} total cards &middot; {totalUniqueCards} unique &middot; {setNames.length} sets
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 hover:bg-red-500/15 hover:border-red-400/30 text-gray-400 hover:text-red-300 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {setNames.length === 0 ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)' }}
                >
                  <Inbox className="w-9 h-9 text-teal-700" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">No Bulk Cards Yet</p>
                  <p className="text-gray-500 text-sm mt-1 max-w-xs">
                    Open some booster packs! Common and Uncommon cards worth under $1.00 will automatically land here, organized by set.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row flex-1 min-h-0">
                {/* Sidebar — Set List */}
                <div
                  className="w-full md:w-52 md:h-full shrink-0 border-b md:border-b-0 md:border-r border-white/8 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto custom-scrollbar"
                  style={{ background: 'rgba(10,18,22,0.6)' }}
                >
                  <p className="hidden md:block text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 pt-4 pb-2">Sets</p>
                  {setNames.map(setName => {
                    const cards = catalogues[setName] || {};
                    const total = Object.values(cards).reduce((s, c) => s + c.count, 0);
                    const isActive = selectedSet === setName;
                    return (
                      <button
                        key={setName}
                        onClick={() => { setSelectedSet(setName); setSearch(''); }}
                        className={`md:w-full shrink-0 text-left px-4 py-3 flex items-center justify-between gap-2 transition-all border-b-2 md:border-b-0 md:border-l-2 ${
                          isActive
                            ? 'border-teal-400 bg-teal-500/10 text-teal-300'
                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-teal-400' : 'text-gray-600'}`} />
                          <span className="text-[11px] font-bold truncate">{setName}</span>
                        </div>
                        <span
                          className={`text-[10px] font-black shrink-0 px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-teal-500/20 text-teal-300' : 'bg-white/8 text-gray-500'
                          }`}
                        >
                          {total}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Main Grid */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                  {/* Search Bar */}
                  <div className="px-5 py-3 border-b border-white/8 shrink-0 flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={`Search in ${selectedSet || ''}…`}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-teal-500/40 transition-all"
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 shrink-0">{currentCards.length} unique</span>
                  </div>

                  {/* Cards Grid */}
                  <div className="flex-1 overflow-y-auto p-5">
                    {currentCards.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
                        No cards match your search.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {currentCards.map(card => (
                          <motion.div
                            key={card.id}
                            layout
                            onClick={() => setPreviewCard(card)}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="relative group rounded-xl overflow-hidden cursor-pointer"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                            }}
                          >
                            {/* Card Image */}
                            <div className="aspect-[2.5/3.5] relative overflow-hidden">
                              {card.imageUrl ? (
                                <img
                                  src={card.imageUrl}
                                  alt={card.name}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800/60">
                                  <Package className="w-8 h-8 text-gray-600" />
                                </div>
                              )}
                              {/* Rarity badge */}
                              <div className="absolute top-1 left-1">
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-black/70 text-gray-400 uppercase tracking-wide">
                                  {card.rarity.slice(0, 3)}
                                </span>
                              </div>
                              {/* Count badge */}
                              {card.count > 1 && (
                                <div className="absolute top-1 right-1">
                                  <span
                                    className="text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg text-white"
                                    style={{ background: 'linear-gradient(135deg, rgba(45,212,191,0.9), rgba(20,184,166,0.9))' }}
                                  >
                                    ×{card.count}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Card Name */}
                            <div className="px-2 py-1.5">
                              <p className="text-[10px] font-bold text-gray-300 truncate leading-tight">{card.name}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Card Preview Modal */}
          <AnimatePresence>
            {previewCard && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-black/80 backdrop-blur-md rounded-3xl"
                onClick={() => setPreviewCard(null)}
              >
                <div className="absolute top-4 right-4 flex items-center justify-between w-full px-8 pointer-events-none">
                  <div />
                  <button
                    onClick={() => setPreviewCard(null)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors pointer-events-auto shadow-lg backdrop-blur-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', bounce: 0.4 }}
                  onClick={e => e.stopPropagation()}
                  className="flex flex-col items-center max-w-sm w-full"
                >
                  <div className="relative w-full aspect-[63/88] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/20">
                    <img 
                      src={previewCard.imageUrl.replace('/low.', '/high.')} 
                      alt={previewCard.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-6 text-center bg-[#111827]/90 px-8 py-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl w-full max-w-[90%]">
                    <h3 className="text-xl font-bold text-white mb-1">{previewCard.name}</h3>
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <span className="text-gray-400">{previewCard.setName}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span className="text-teal-400 font-semibold">{previewCard.rarity}</span>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-black">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{previewCard.count} Copies Owned</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
