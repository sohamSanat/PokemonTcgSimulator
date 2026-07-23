import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Sparkles, X, Gift, Zap, Layers, Trophy, ArrowRight, 
  ShieldCheck, Flame, ShoppingBag, CheckCircle2, ChevronRight, RefreshCw, Box
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
  ENGLISH_MYSTERY_PACKS, 
  JAPANESE_MYSTERY_PACKS, 
  type MysteryPackConfig 
} from '../../data/mysteryPacks';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEarnedBoosterPack: (setId: string, language: 'en' | 'ja') => void;
  onOpenMysteryPack: (pack: MysteryPackConfig) => void;
  onNavigateToMissions: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  onOpenEarnedBoosterPack,
  onOpenMysteryPack,
  onNavigateToMissions
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'boosters' | 'mystery'>('all');
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

  const refreshInventory = () => {
    setEarnedPacks(getEarnedSetPacks());
    setOwnedMysteryPacks(getOwnedMysteryPacks());
  };

  useEffect(() => {
    if (isOpen) {
      refreshInventory();
    }
  }, [isOpen]);

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
  }, []);

  if (!isOpen) return null;

  const totalBoosterCount = earnedPacks.reduce((sum, p) => sum + p.count, 0);
  const totalMysteryCount = ownedMysteryPacks.reduce((sum, p) => sum + p.count, 0);
  const totalItemsCount = totalBoosterCount + totalMysteryCount;

  // Calculate estimated vault value
  const estimatedValue = 
    earnedPacks.reduce((acc, p) => acc + (p.count * 4.99), 0) +
    ownedMysteryPacks.reduce((acc, p) => {
      const cfg = getMysteryPackById(p.packId);
      return acc + (p.count * (cfg?.price || 19.99));
    }, 0);

  const getPackArtImage = (setId: string): string => {
    if (packArtsManifest[setId] && packArtsManifest[setId].length > 0) {
      return packArtsManifest[setId][0];
    }
    const norm = setId.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [k, v] of Object.entries(packArtsManifest)) {
      if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === norm && v.length > 0) {
        return v[0];
      }
    }
    return '/packArts/ScarletAndViolet-Generation/scarlet-and-violet/1.webp';
  };

  const handleRipBooster = (pack: EarnedSetPack) => {
    sound.playButtonClick();
    sound.playPackOpen();
    const success = useEarnedSetPack(pack.setId, pack.language);
    if (success) {
      onClose();
      onOpenEarnedBoosterPack(pack.setId, pack.language);
    }
  };

  const handleRipMystery = (owned: OwnedMysteryPack) => {
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
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl pointer-events-auto overflow-y-auto custom-scrollbar"
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          className="relative w-full max-w-4xl bg-gradient-to-b from-[#161226] via-[#100d1d] to-[#0a0815] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.3)] text-white overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Decorative Glow Header */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
          
          {/* Close Button */}
          <button
            onClick={() => { sound.playButtonClick(); onClose(); }}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer z-20 shadow-md active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pr-10">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.5)] shrink-0">
                <div className="w-full h-full rounded-2xl bg-[#0f0c1b] flex items-center justify-center text-amber-400">
                  <Package className="w-7 h-7 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Pack Vault <span className="text-amber-400 font-mono text-xl sm:text-2xl">({totalItemsCount})</span>
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                    INVENTORY
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-medium mt-0.5">
                  All your earned booster packs from missions & mystery boxes stored here ready to rip.
                </p>
              </div>
            </div>

            {/* Quick Stats Summary Pills */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
              <div className="px-3.5 py-2 rounded-2xl bg-black/60 border border-amber-500/30 flex flex-col items-center shadow-inner min-w-[100px]">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Vault Est. Value</span>
                <span className="text-sm font-mono font-black text-emerald-400">${estimatedValue.toFixed(2)}</span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-black/60 border border-cyan-500/30 flex flex-col items-center shadow-inner min-w-[90px]">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Packs Ready</span>
                <span className="text-sm font-mono font-black text-cyan-300">{totalItemsCount}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-5 shrink-0 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { sound.playTabSwitch(); setActiveTab('all'); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Packs ({totalItemsCount})</span>
              </button>

              <button
                onClick={() => { sound.playTabSwitch(); setActiveTab('boosters'); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'boosters'
                    ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Mission Boosters ({totalBoosterCount})</span>
              </button>

              <button
                onClick={() => { sound.playTabSwitch(); setActiveTab('mystery'); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'mystery'
                    ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Mystery Packs ({totalMysteryCount})</span>
              </button>
            </div>

            <button
              onClick={() => { sound.playButtonClick(); refreshInventory(); }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Refresh Vault"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Main Items Content Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[320px]">
            {totalItemsCount === 0 ? (
              <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-black/30 border border-dashed border-white/15 rounded-3xl p-6">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg">
                  <Box className="w-10 h-10 opacity-70" />
                </div>
                <h3 className="text-xl font-black text-white mb-1">Your Pack Vault is Empty</h3>
                <p className="text-xs text-gray-400 max-w-sm mb-6 font-medium">
                  You don't have any earned booster packs or mystery packs stored yet. Complete daily missions or grab a mystery pack to fill your vault!
                </p>
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => { sound.playButtonClick(); onClose(); onNavigateToMissions(); }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-yellow-200" />
                    <span>Go to Missions</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Earned Booster Packs */}
                {(activeTab === 'all' || activeTab === 'boosters') &&
                  earnedPacks.map((pack, idx) => {
                    const artImg = getPackArtImage(pack.setId);
                    return (
                      <motion.div
                        key={`booster-${pack.setId}-${pack.language}-${idx}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-gradient-to-b from-[#1d1933] to-[#120f24] border border-amber-500/30 hover:border-amber-400 transition-all flex flex-col justify-between shadow-lg relative group overflow-hidden"
                      >
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-80" />
                        
                        {/* Top Meta Info */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>MISSION REWARD</span>
                          </span>

                          <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-white font-mono font-black text-xs shadow">
                            x{pack.count}
                          </span>
                        </div>

                        {/* Pack Visual & Name */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-14 h-20 rounded-xl bg-black/60 border border-amber-400/40 overflow-hidden shrink-0 shadow-md relative group-hover:scale-105 transition-transform">
                            <img src={artImg} alt={pack.setName} className="w-full h-full object-cover" />
                            <div className="absolute top-1 right-1 px-1 rounded bg-black/80 text-[9px] font-black text-white">
                              {pack.language === 'ja' ? '🇯🇵' : '🇺🇸'}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-sm text-white line-clamp-2 leading-tight">
                              {pack.setName}
                            </h4>
                            <div className="text-[11px] text-gray-400 font-medium mt-1 flex items-center gap-1.5">
                              <span>Set ID: <strong className="text-amber-300 font-mono">{pack.setId}</strong></span>
                            </div>
                            <div className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5">
                              ~$4.99 / pack
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleRipBooster(pack)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Zap className="w-4 h-4 text-yellow-200 animate-pulse" />
                          <span>RIP PACK NOW ⚡</span>
                        </button>
                      </motion.div>
                    );
                  })}

                {/* 2. Owned Mystery Packs */}
                {(activeTab === 'all' || activeTab === 'mystery') &&
                  ownedMysteryPacks.map((owned, idx) => {
                    const cfg = getMysteryPackById(owned.packId);
                    if (!cfg) return null;
                    return (
                      <motion.div
                        key={`mystery-${owned.packId}-${idx}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-gradient-to-b from-[#241a3a] via-[#1a132c] to-[#110b21] border border-purple-500/40 hover:border-purple-300 transition-all flex flex-col justify-between shadow-lg relative group overflow-hidden"
                      >
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-500 opacity-80" />

                        {/* Top Meta Info */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <span>{cfg.icon || '🎲'}</span>
                            <span>{cfg.tier.toUpperCase()} MYSTERY</span>
                          </span>

                          <span className="px-2 py-0.5 rounded-full bg-black/60 border border-purple-400/40 text-purple-200 font-mono font-black text-xs shadow">
                            x{owned.count}
                          </span>
                        </div>

                        {/* Pack Visual & Info */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-14 h-20 rounded-xl bg-black/60 border border-purple-400/50 overflow-hidden shrink-0 shadow-md relative group-hover:scale-105 transition-transform flex items-center justify-center">
                            {cfg.packArt ? (
                              <img src={cfg.packArt} alt={cfg.name} className="w-full h-full object-cover" />
                            ) : (
                              <Gift className="w-8 h-8 text-purple-400 animate-bounce" />
                            )}
                            <div className="absolute top-1 right-1 px-1 rounded bg-black/80 text-[9px] font-black text-white">
                              {cfg.language === 'ja' ? '🇯🇵' : '🇺🇸'}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-sm text-white line-clamp-2 leading-tight">
                              {cfg.name}
                            </h4>
                            <p className="text-[10px] text-gray-300 line-clamp-2 mt-1 font-medium">
                              {cfg.description}
                            </p>
                            <div className="text-[10px] text-emerald-400 font-mono font-bold mt-1">
                              Valued at ${cfg.price.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleRipMystery(owned)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Gift className="w-4 h-4 text-purple-200 animate-pulse" />
                          <span>OPEN MYSTERY PACK 🎲</span>
                        </button>
                      </motion.div>
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
