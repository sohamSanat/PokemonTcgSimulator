import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Layers, Package, Search, Inbox, Filter, ArrowUpDown } from 'lucide-react';
import { getCatalogues, clearCatalogues, moveBulkCardToBinder, getBinders, type BulkCard, type CatalogueStore, type Binder } from './types';
import { rarityRank } from './filterUtils';

export type BulkSortOption = 'rarity' | 'rarity-asc' | 'count' | 'name';

interface BulkCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_RARITY_PRESETS = [
  'All Rarities',
  'Common',
  'Uncommon',
  'Rare',
  'Ultra / Secret Rare',
  'Illustration Rare'
];

export default function BulkCatalogueModal({ isOpen, onClose }: BulkCatalogueModalProps) {
  const [catalogues, setCatalogues] = useState<CatalogueStore>({});
  const [selectedSet, setSelectedSet] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<BulkSortOption>('rarity');
  const [activeRarityFilter, setActiveRarityFilter] = useState<string>('All Rarities');
  const [previewCard, setPreviewCard] = useState<BulkCard | null>(null);
  const [binders, setBinders] = useState<Binder[]>([]);

  useEffect(() => {
    setBinders(getBinders());
    const loadCatalogues = () => {
      const data = getCatalogues();
      setCatalogues(data);
    };

    if (isOpen) {
      loadCatalogues();
      window.addEventListener('storage', loadCatalogues);
    }
    return () => {
      window.removeEventListener('storage', loadCatalogues);
    };
  }, [isOpen]);

  const setNames = useMemo(() => Object.keys(catalogues).sort(), [catalogues]);

  const allCards: BulkCard[] = useMemo(() => {
    if (!selectedSet || selectedSet === 'ALL') {
      return Object.values(catalogues).flatMap(setMap => Object.values(setMap));
    }
    if (!catalogues[selectedSet]) return [];
    return Object.values(catalogues[selectedSet]);
  }, [catalogues, selectedSet]);

  const currentCards: BulkCard[] = useMemo(() => {
    let list = allCards.filter(c => {
      // 1. Text Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesRarity = (c.rarity || '').toLowerCase().includes(q);
        const matchesSet = (c.setName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesRarity && !matchesSet) return false;
      }
      // 2. Rarity Filter
      if (activeRarityFilter !== 'All Rarities') {
        const cRarity = (c.rarity || '').toLowerCase();
        const fRarity = activeRarityFilter.toLowerCase();
        if (fRarity === 'common' && !cRarity.includes('common')) return false;
        if (fRarity === 'uncommon' && !cRarity.includes('uncommon')) return false;
        if (fRarity === 'rare' && (!cRarity.includes('rare') || cRarity.includes('ultra') || cRarity.includes('secret') || cRarity.includes('illustration'))) return false;
        if (fRarity.includes('ultra') && (!cRarity.includes('ultra') && !cRarity.includes('secret') && !cRarity.includes('hyper') && !cRarity.includes('double') && !cRarity.includes('ex') && !cRarity.includes('vmax') && !cRarity.includes('vstar'))) return false;
        if (fRarity.includes('illustration') && (!cRarity.includes('illustration') && !cRarity.includes('art rare'))) return false;
      }
      return true;
    });

    // Sort list based on selected sort criteria
    if (sortBy === 'rarity') {
      list.sort((a, b) => {
        const rankDiff = rarityRank(b.rarity) - rarityRank(a.rarity);
        if (rankDiff !== 0) return rankDiff;
        const countDiff = b.count - a.count;
        if (countDiff !== 0) return countDiff;
        return a.name.localeCompare(b.name);
      });
    } else if (sortBy === 'rarity-asc') {
      list.sort((a, b) => {
        const rankDiff = rarityRank(a.rarity) - rarityRank(b.rarity);
        if (rankDiff !== 0) return rankDiff;
        const countDiff = b.count - a.count;
        if (countDiff !== 0) return countDiff;
        return a.name.localeCompare(b.name);
      });
    } else if (sortBy === 'count') {
      list.sort((a, b) => {
        const countDiff = b.count - a.count;
        if (countDiff !== 0) return countDiff;
        return rarityRank(b.rarity) - rarityRank(a.rarity);
      });
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [allCards, search, activeRarityFilter, sortBy]);

  const totalBulkCards = useMemo(() => {
    return Object.values(catalogues).reduce((total, setCards) => {
      return total + Object.values(setCards).reduce((s, c) => s + c.count, 0);
    }, 0);
  }, [catalogues]);

  const totalUniqueCards = useMemo(() => {
    return Object.values(catalogues).reduce((total, setCards) => total + Object.keys(setCards).length, 0);
  }, [catalogues]);

  const getRarityBadgeStyle = (rarity: string) => {
    const rank = rarityRank(rarity);
    if (rank >= 5) {
      return 'bg-amber-500/90 text-black font-extrabold border border-amber-300/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    }
    if (rank === 4) {
      return 'bg-purple-600/90 text-white font-bold border border-purple-400/60 shadow-[0_0_6px_rgba(168,85,247,0.4)]';
    }
    if (rank === 3) {
      return 'bg-blue-600/80 text-blue-100 font-bold border border-blue-400/50';
    }
    if (rank === 2) {
      return 'bg-emerald-600/80 text-emerald-100 font-semibold border border-emerald-400/40';
    }
    return 'bg-gray-800/80 text-gray-300 font-medium border border-gray-600/40';
  };

  const hasActiveFilters = search.trim() !== '' || activeRarityFilter !== 'All Rarities' || sortBy !== 'rarity';

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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset your Bulk Vault? This cannot be undone.')) {
                      clearCatalogues();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[11px] font-bold transition-all mr-2"
                >
                  Reset
                </button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 hover:bg-red-500/15 hover:border-red-400/30 text-gray-400 hover:text-red-300 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                  
                  {/* All Sets option */}
                  <button
                    onClick={() => { setSelectedSet('ALL'); setSearch(''); }}
                    className={`md:w-full shrink-0 text-left px-4 py-3 flex items-center justify-between gap-2 transition-all border-b-2 md:border-b-0 md:border-l-2 ${
                      selectedSet === 'ALL'
                        ? 'border-teal-400 bg-teal-500/10 text-teal-300 font-bold'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className={`w-3.5 h-3.5 shrink-0 ${selectedSet === 'ALL' ? 'text-teal-400' : 'text-gray-600'}`} />
                      <span className="text-[11px] font-bold truncate">All Sets</span>
                    </div>
                    <span className={`text-[10px] font-black shrink-0 px-1.5 py-0.5 rounded-full ${
                      selectedSet === 'ALL' ? 'bg-teal-500/20 text-teal-300' : 'bg-white/8 text-gray-500'
                    }`}>
                      {totalBulkCards}
                    </span>
                  </button>

                  {setNames.map(setName => {
                    const cards = catalogues[setName] || {};
                    const total = Object.values(cards).reduce((s, c) => s + c.count, 0);
                    const isActive = selectedSet === setName;
                    return (
                      <button
                        key={setName}
                        onClick={() => { setSelectedSet(setName); setSearch(''); }}
                        className={`md:w-full shrink-0 text-left px-4 py-3 flex items-center justify-between gap-2 transition-all border-b-2 md:border-b-0 md:border-l-2 ${isActive
                            ? 'border-teal-400 bg-teal-500/10 text-teal-300'
                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-teal-400' : 'text-gray-600'}`} />
                          <span className="text-[11px] font-bold truncate">{setName}</span>
                        </div>
                        <span
                          className={`text-[10px] font-black shrink-0 px-1.5 py-0.5 rounded-full ${isActive ? 'bg-teal-500/20 text-teal-300' : 'bg-white/8 text-gray-500'
                            }`}
                        >
                          {total}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                  {/* Controls Row: Search + Sort Dropdown + Rarity Filter Dropdown */}
                  <div className="px-5 py-3 border-b border-white/8 shrink-0 flex flex-wrap items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={`Search in ${selectedSet === 'ALL' ? 'All Sets' : selectedSet || ''}…`}
                        className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-teal-500/40 transition-all"
                      />
                    </div>

                    {/* Rarity Filter Dropdown */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Filter className="w-3.5 h-3.5 text-teal-400 hidden sm:inline" />
                      <select
                        value={activeRarityFilter}
                        onChange={e => setActiveRarityFilter(e.target.value)}
                        className="bg-black/60 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-teal-300 font-semibold focus:outline-none focus:border-teal-400/80 cursor-pointer"
                      >
                        {QUICK_RARITY_PRESETS.map(r => (
                          <option key={r} value={r} className="bg-slate-900 text-white">
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ArrowUpDown className="w-3.5 h-3.5 text-teal-400 hidden sm:inline" />
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as BulkSortOption)}
                        className="bg-black/60 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-teal-400/80 cursor-pointer"
                      >
                        <option value="rarity" className="bg-slate-900 text-white">Highest Rarity 💎</option>
                        <option value="rarity-asc" className="bg-slate-900 text-white">Lowest Rarity</option>
                        <option value="count" className="bg-slate-900 text-white">Most Copies (×)</option>
                        <option value="name" className="bg-slate-900 text-white">Card Name (A-Z)</option>
                      </select>
                    </div>

                    <span className="text-[11px] text-gray-500 shrink-0 font-medium">
                      {currentCards.length} unique
                    </span>
                  </div>

                  {/* Quick Rarity Chips Bar */}
                  <div className="px-5 py-2 border-b border-white/8 bg-black/20 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
                    <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                      <span>💎 RARITY FILTER:</span>
                    </span>
                    {QUICK_RARITY_PRESETS.map(rarity => {
                      const isActive = activeRarityFilter === rarity;
                      return (
                        <button
                          key={rarity}
                          onClick={() => setActiveRarityFilter(rarity)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1 ${
                            isActive
                              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-black border-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.4)] scale-105'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {rarity}
                        </button>
                      );
                    })}
                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          setActiveRarityFilter('All Rarities');
                          setSearch('');
                          setSortBy('rarity');
                        }}
                        className="ml-auto px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold transition-all border border-amber-500/30 shrink-0"
                      >
                        ↺ Reset
                      </button>
                    )}
                  </div>

                  {/* Cards Grid */}
                  <div className="flex-1 overflow-y-auto p-5">
                    {currentCards.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm gap-2">
                        <p>No bulk cards match your filters.</p>
                        {hasActiveFilters && (
                          <button
                            onClick={() => {
                              setActiveRarityFilter('All Rarities');
                              setSearch('');
                              setSortBy('rarity');
                            }}
                            className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold hover:bg-teal-500/30 transition-all border border-teal-500/30"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {currentCards.map(card => (
                          <motion.div
                            key={`${card.setName}-${card.id}`}
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
                              <div className="absolute top-1 left-1 max-w-[70%]">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wide truncate block ${getRarityBadgeStyle(card.rarity)}`}>
                                  {card.rarity}
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
                            {/* Card Details */}
                            <div className="px-2 py-1.5">
                              <p className="text-[10px] font-bold text-gray-300 truncate leading-tight">{card.name}</p>
                              {selectedSet === 'ALL' && (
                                <p className="text-[9px] font-medium text-teal-400/80 truncate mt-0.5">{card.setName}</p>
                              )}
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
                className="absolute inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-black/80 rounded-3xl"
                onClick={() => setPreviewCard(null)}
              >
                <div className="absolute top-4 right-4 flex items-center justify-between w-full px-8 pointer-events-none">
                  <div />
                  <button
                    onClick={() => setPreviewCard(null)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors pointer-events-auto shadow-lg"
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
                  <div className="mt-6 text-center bg-[#111827]/90 px-8 py-4 rounded-3xl border border-white/10 shadow-2xl w-full max-w-[90%]">
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
                    <div className="mt-4 flex flex-col gap-2 w-full pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-1">Add to Binder:</p>
                      <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {binders.map(b => (
                          <button
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBulkCardToBinder(previewCard, b.id);
                              setPreviewCard(null);
                            }}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-teal-500/20 hover:text-teal-300 text-gray-300 transition-colors border border-white/5 hover:border-teal-500/30"
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
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

