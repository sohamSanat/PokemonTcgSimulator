import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Sparkles, X, Gift, Zap, Layers, Trophy, 
  RefreshCw, Box, Search, ArrowUpDown, Coins, Vault
} from 'lucide-react';
import { sound } from '../../services/sound';
import { 
  getEarnedSetPacks, 
  getOwnedMysteryPacks, 
  useEarnedSetPack, 
  useOwnedMysteryPack, 
  type EarnedSetPack, 
  type OwnedMysteryPack 
} from '../../services/missions';
import { 
  getMysteryPackById, 
  type MysteryPackConfig 
} from '../../data/mysteryPacks';
import setPackPricesData from '../../data/set_pack_prices.json';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEarnedBoosterPack: (setId: string, language: 'en' | 'ja') => void;
  onOpenMysteryPack: (pack: MysteryPackConfig) => void;
  onNavigateToMissions: () => void;
}

type SortOption = 'value-desc' | 'value-asc' | 'count-desc' | 'name';

const getBoosterPackMarketPrice = (setId: string, setName: string): number => {
  const prices = setPackPricesData as Record<string, number>;
  if (setId && prices[setId]) return prices[setId];
  const normId = (setId || '').toLowerCase().trim();
  if (normId && prices[normId]) return prices[normId];
  if (setName && prices[setName]) return prices[setName];
  if (setName) {
    const normName = setName.toLowerCase().trim();
    if (prices[normName]) return prices[normName];
  }
  if (normId.startsWith('xy') || normId.startsWith('bw') || normId.startsWith('sm')) return 24.99;
  if (normId.startsWith('swsh')) return 12.99;
  if (normId.startsWith('sv')) return 9.99;
  return 8.99;
};

// ---------------------------------------------------------------------------
// Memoized Item Card Subcomponents (prevents 150+ re-renders on state changes)
// ---------------------------------------------------------------------------

interface BoosterPackCardProps {
  pack: EarnedSetPack;
  artImg: string;
  unitPrice: number;
  onRip: (pack: EarnedSetPack) => void;
}

const BoosterPackCard: React.FC<BoosterPackCardProps> = React.memo(({
  pack,
  artImg,
  unitPrice,
  onRip
}) => {
  const totalPrice = unitPrice * pack.count;

  return (
    <div className="group relative rounded-2xl bg-gradient-to-b from-[#18132e]/90 via-[#120e24]/90 to-[#0b0817]/95 border border-white/10 hover:border-amber-400/50 transition-all duration-200 shadow-lg hover:shadow-[0_8px_25px_rgba(245,158,11,0.2)] p-4 flex flex-col justify-between overflow-hidden will-change-transform">
      {/* Hover Sheen Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Top Category Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
          <Trophy className="w-2.5 h-2.5 text-amber-400" />
          <span>MISSION REWARD</span>
        </span>

        <span className="px-2 py-0.5 rounded-full bg-black/70 border border-amber-400/40 text-amber-300 font-mono font-black text-xs shadow-md">
          x{pack.count}
        </span>
      </div>

      {/* Pack Visual Foil Card & Details */}
      <div className="flex items-center gap-3.5 mb-4">
        {/* Vertical Foil Art Frame */}
        <div className="w-20 sm:w-22 aspect-[3/4.2] rounded-xl bg-black/60 border border-white/15 overflow-hidden shrink-0 shadow-2xl relative group-hover:scale-[1.03] group-hover:border-amber-400/60 transition-transform duration-200">
          <img 
            src={artImg} 
            alt={pack.setName} 
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {/* Metallic Foil Sheen on Hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        {/* Pack Information */}
        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-white line-clamp-2 leading-tight group-hover:text-amber-200 transition-colors">
              {pack.setName}
            </h4>
            <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">
              {pack.setId} • {pack.language === 'ja' ? 'Japanese' : 'English'}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-gray-400 font-medium">Unit Price:</span>
              <span className="font-mono font-bold text-emerald-400">${unitPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-gray-400 font-medium">Stack Value:</span>
              <span className="font-mono font-black text-amber-300">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onRip(pack)}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
      >
        <Zap className="w-4 h-4 text-black animate-pulse" />
        <span>RIP PACK NOW</span>
      </button>
    </div>
  );
});

BoosterPackCard.displayName = 'BoosterPackCard';

interface MysteryPackCardProps {
  owned: OwnedMysteryPack;
  cfg: MysteryPackConfig;
  onRip: (owned: OwnedMysteryPack) => void;
}

const MysteryPackCard: React.FC<MysteryPackCardProps> = React.memo(({
  owned,
  cfg,
  onRip
}) => {
  const unitPrice = cfg.price || 19.99;
  const totalPrice = unitPrice * owned.count;

  return (
    <div className="group relative rounded-2xl bg-gradient-to-b from-[#25173c]/90 via-[#1a102e]/90 to-[#0f091c]/95 border border-purple-500/30 hover:border-purple-400/70 transition-all duration-200 shadow-lg hover:shadow-[0_8px_25px_rgba(168,85,247,0.25)] p-4 flex flex-col justify-between overflow-hidden will-change-transform">
      {/* Hover Sheen Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Top Category Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/40 text-purple-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
          <Gift className="w-2.5 h-2.5 text-purple-400" />
          <span>{(cfg.badge || 'MYSTERY BOX').toUpperCase()}</span>
        </span>

        <span className="px-2 py-0.5 rounded-full bg-black/70 border border-purple-400/50 text-purple-300 font-mono font-black text-xs shadow-md">
          x{owned.count}
        </span>
      </div>

      {/* Mystery Pack Visual Foil Card & Details */}
      <div className="flex items-center gap-3.5 mb-4">
        {/* Vertical Foil Box Art */}
        <div className="w-20 sm:w-22 aspect-[3/4.2] rounded-xl bg-black/60 border border-purple-400/40 overflow-hidden shrink-0 shadow-2xl relative group-hover:scale-[1.03] group-hover:border-purple-300 transition-transform duration-200 flex items-center justify-center">
          {cfg.packArt ? (
            <img 
              src={cfg.packArt} 
              alt={cfg.name} 
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <Gift className="w-8 h-8 text-purple-400 animate-bounce" />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        {/* Information Details */}
        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-white line-clamp-1 leading-tight group-hover:text-purple-200 transition-colors">
              {cfg.name}
            </h4>
            <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 font-medium leading-normal">
              {cfg.description}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-purple-500/10 flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-gray-400 font-medium">Est. Value:</span>
              <span className="font-mono font-bold text-emerald-400">${unitPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-gray-400 font-medium">Stack Value:</span>
              <span className="font-mono font-black text-purple-300">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onRip(owned)}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_4px_25px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
      >
        <Gift className="w-4 h-4 text-purple-200 animate-pulse" />
        <span>OPEN MYSTERY BOX</span>
      </button>
    </div>
  );
});

MysteryPackCard.displayName = 'MysteryPackCard';

// ---------------------------------------------------------------------------
// Main InventoryModal Component
// ---------------------------------------------------------------------------

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  onOpenEarnedBoosterPack,
  onOpenMysteryPack,
  onNavigateToMissions
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'boosters' | 'mystery'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('value-desc');
  const [earnedPacks, setEarnedPacks] = useState<EarnedSetPack[]>(() => getEarnedSetPacks());
  const [ownedMysteryPacks, setOwnedMysteryPacks] = useState<OwnedMysteryPack[]>(() => getOwnedMysteryPacks());
  const [packArtsManifest, setPackArtsManifest] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';
    fetch(`${base}packArts/manifest.json?v=3`)
      .then(res => res.ok ? res.json() : {})
      .then(data => setPackArtsManifest(data))
      .catch(() => {});
  }, []);

  const refreshInventory = useCallback(() => {
    setEarnedPacks(getEarnedSetPacks());
    setOwnedMysteryPacks(getOwnedMysteryPacks());
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshInventory();
    }
  }, [isOpen, refreshInventory]);

  useEffect(() => {
    const handleUpdate = () => {
      refreshInventory();
    };
    window.addEventListener('inventory_updated', handleUpdate);
    window.addEventListener('earned_packs_updated', handleUpdate);
    return () => {
      window.removeEventListener('inventory_updated', handleUpdate);
      window.removeEventListener('earned_packs_updated', handleUpdate);
    };
  }, [refreshInventory]);

  // Fast O(1) Pre-computed Pack Art Lookup Map
  const packArtMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const [k, v] of Object.entries(packArtsManifest)) {
      if (v && v.length > 0) {
        const firstArt = v[0];
        map.set(k, firstArt);
        map.set(k.toLowerCase(), firstArt);
        map.set(k.toLowerCase().replace(/[^a-z0-9]/g, ''), firstArt);
      }
    }
    return map;
  }, [packArtsManifest]);

  const getPackArtImage = useCallback((setId: string): string => {
    if (packArtMap.has(setId)) return packArtMap.get(setId)!;
    const norm = setId.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (packArtMap.has(norm)) return packArtMap.get(norm)!;
    return '/packArts/ScarletAndViolet-Generation/scarlet-and-violet/1.webp';
  }, [packArtMap]);

  // Fast Memoized Price Getter
  const getPackPrice = useCallback((setId: string, setName: string): number => {
    return getBoosterPackMarketPrice(setId, setName);
  }, []);

  // Total counts & Vault analytics
  const totalBoosterCount = useMemo(() => earnedPacks.reduce((sum, p) => sum + p.count, 0), [earnedPacks]);
  const totalMysteryCount = useMemo(() => ownedMysteryPacks.reduce((sum, p) => sum + p.count, 0), [ownedMysteryPacks]);
  const totalItemsCount = totalBoosterCount + totalMysteryCount;

  const estimatedValue = useMemo(() => {
    const boosterVal = earnedPacks.reduce((acc, p) => acc + (p.count * getPackPrice(p.setId, p.setName)), 0);
    const mysteryVal = ownedMysteryPacks.reduce((acc, p) => {
      const cfg = getMysteryPackById(p.packId);
      return acc + (p.count * (cfg?.price || 19.99));
    }, 0);
    return boosterVal + mysteryVal;
  }, [earnedPacks, ownedMysteryPacks, getPackPrice]);

  const handleRipBooster = useCallback((pack: EarnedSetPack) => {
    sound.playButtonClick();
    sound.playPackOpen();
    const success = useEarnedSetPack(pack.setId, pack.language);
    if (success) {
      onClose();
      onOpenEarnedBoosterPack(pack.setId, pack.language);
    }
  }, [onClose, onOpenEarnedBoosterPack]);

  const handleRipMystery = useCallback((owned: OwnedMysteryPack) => {
    sound.playButtonClick();
    sound.playPackOpen();
    const cfg = getMysteryPackById(owned.packId);
    if (cfg) {
      const success = useOwnedMysteryPack(owned.packId);
      if (success) {
        onClose();
        onOpenMysteryPack(cfg);
      }
    }
  }, [onClose, onOpenMysteryPack]);

  // Filtered & Sorted Lists
  const processedBoosters = useMemo(() => {
    let result = earnedPacks.filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.setName.toLowerCase().includes(q) || p.setId.toLowerCase().includes(q);
    });

    return result.sort((a, b) => {
      const priceA = getPackPrice(a.setId, a.setName);
      const priceB = getPackPrice(b.setId, b.setName);
      if (sortBy === 'value-desc') return priceB - priceA;
      if (sortBy === 'value-asc') return priceA - priceB;
      if (sortBy === 'count-desc') return b.count - a.count;
      if (sortBy === 'name') return a.setName.localeCompare(b.setName);
      return 0;
    });
  }, [earnedPacks, searchQuery, sortBy, getPackPrice]);

  const processedMystery = useMemo(() => {
    let result = ownedMysteryPacks.filter(p => {
      const cfg = getMysteryPackById(p.packId);
      if (!cfg) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return cfg.name.toLowerCase().includes(q) || cfg.description.toLowerCase().includes(q);
    });

    return result.sort((a, b) => {
      const cfgA = getMysteryPackById(a.packId);
      const cfgB = getMysteryPackById(b.packId);
      const priceA = cfgA?.price || 19.99;
      const priceB = cfgB?.price || 19.99;
      if (sortBy === 'value-desc') return priceB - priceA;
      if (sortBy === 'value-asc') return priceA - priceB;
      if (sortBy === 'count-desc') return b.count - a.count;
      if (sortBy === 'name') return (cfgA?.name || '').localeCompare(cfgB?.name || '');
      return 0;
    });
  }, [ownedMysteryPacks, searchQuery, sortBy]);

  const displayedItemCount = 
    (activeTab === 'all' ? processedBoosters.length + processedMystery.length : 
     activeTab === 'boosters' ? processedBoosters.length : processedMystery.length);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md pointer-events-auto overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-5xl bg-[#0c0919]/95 border border-white/15 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.85)] text-white overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto"
        >
          {/* Subtle glowing ambient header backdrop */}
          <div className="absolute top-0 left-1/4 right-1/4 h-32 bg-gradient-to-b from-amber-500/10 via-purple-500/5 to-transparent blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => { sound.playButtonClick(); onClose(); }}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer z-30 shadow-lg active:scale-95"
            title="Close Vault"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Bar */}
          <div className="p-5 sm:p-6 pb-4 border-b border-white/10 shrink-0 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-8">
              {/* Title & Vault Emblem */}
              <div className="flex items-center gap-3.5">
                <div className="relative group">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-[1px] shadow-[0_0_20px_rgba(245,158,11,0.35)] shrink-0">
                    <div className="w-full h-full rounded-2xl bg-[#0d091a] flex items-center justify-center text-amber-400">
                      <Vault className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] font-black shadow-md">
                    <Sparkles className="w-3 h-3" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
                      Pack Vault
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                      <Coins className="w-3 h-3 text-amber-400" />
                      <span>VAULT INVENTORY</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Your collection of earned booster packs & mystery boxes ready to rip.
                  </p>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end">
                <div className="px-4 py-2 rounded-2xl bg-black/50 border border-emerald-500/30 flex flex-col items-start min-w-[125px] shadow-inner">
                  <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Vault Est. Value</span>
                  <span className="text-base sm:text-lg font-mono font-black text-emerald-400">
                    ${estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-black/50 border border-cyan-500/30 flex flex-col items-start min-w-[95px] shadow-inner">
                  <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Total Packs</span>
                  <span className="text-base sm:text-lg font-mono font-black text-cyan-300">
                    {totalItemsCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter & Toolbar Controls */}
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
                <button
                  onClick={() => { sound.playTabSwitch(); setActiveTab('all'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    activeTab === 'all'
                      ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Packs ({totalItemsCount})</span>
                </button>

                <button
                  onClick={() => { sound.playTabSwitch(); setActiveTab('boosters'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    activeTab === 'boosters'
                      ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Booster Packs ({totalBoosterCount})</span>
                </button>

                <button
                  onClick={() => { sound.playTabSwitch(); setActiveTab('mystery'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    activeTab === 'mystery'
                      ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Mystery Boxes ({totalMysteryCount})</span>
                </button>
              </div>

              {/* Search & Sort Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search vault..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/60 focus:bg-black/40 transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Selector */}
                <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-300">
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-bold pr-1"
                  >
                    <option value="value-desc" className="bg-[#110d24] text-white">Highest Value</option>
                    <option value="value-asc" className="bg-[#110d24] text-white">Lowest Value</option>
                    <option value="count-desc" className="bg-[#110d24] text-white">Highest Quantity</option>
                    <option value="name" className="bg-[#110d24] text-white">Set Name (A-Z)</option>
                  </select>
                </div>

                {/* Refresh Vault Button */}
                <button
                  onClick={() => { sound.playButtonClick(); refreshInventory(); }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer shrink-0"
                  title="Refresh Vault"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Grid Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 min-h-0 relative z-10">
            {displayedItemCount === 0 ? (
              <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-black/40 border border-dashed border-white/10 rounded-3xl p-8">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
                  <Box className="w-10 h-10 opacity-80 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  {searchQuery ? 'No Vault Items Found' : 'Your Pack Vault is Empty'}
                </h3>
                <p className="text-xs text-gray-400 max-w-md mb-6 font-medium leading-relaxed">
                  {searchQuery 
                    ? `No booster packs or mystery boxes match "${searchQuery}". Try clearing your search.`
                    : "You haven't collected any booster packs or mystery boxes yet. Complete daily missions or visit the shop to earn packs!"}
                </p>
                
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={() => { sound.playButtonClick(); onClose(); onNavigateToMissions(); }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black font-black text-xs uppercase tracking-wider shadow-[0_4px_25px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-black" />
                    <span>Go to Daily Missions</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Earned Booster Packs */}
                {(activeTab === 'all' || activeTab === 'boosters') &&
                  processedBoosters.map((pack) => {
                    const artImg = getPackArtImage(pack.setId);
                    const unitPrice = getPackPrice(pack.setId, pack.setName);

                    return (
                      <BoosterPackCard
                        key={`booster-${pack.setId}-${pack.language}`}
                        pack={pack}
                        artImg={artImg}
                        unitPrice={unitPrice}
                        onRip={handleRipBooster}
                      />
                    );
                  })}

                {/* 2. Owned Mystery Packs */}
                {(activeTab === 'all' || activeTab === 'mystery') &&
                  processedMystery.map((owned) => {
                    const cfg = getMysteryPackById(owned.packId);
                    if (!cfg) return null;

                    return (
                      <MysteryPackCard
                        key={`mystery-${owned.packId}`}
                        owned={owned}
                        cfg={cfg}
                        onRip={handleRipMystery}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InventoryModal;
