import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, Award, CheckCircle2, Gift, Sparkles, Clock, Package, Coins, 
  Trophy, ChevronRight, Zap, RefreshCw, Layers, Box, ArrowLeft, ShieldCheck, Star
} from 'lucide-react';
import { 
  getMissions, 
  getDailyFreePacks, 
  getEarnedSetPacks, 
  getDailyCash, 
  claimMissionReward, 
  type Mission, 
  type EarnedSetPack 
} from '../../services/missions';
import { sound } from '../../services/sound';
import InteractiveCard3D from '../binder/InteractiveCard3D';
import { PokemonCard } from '../../services/tcgdex';

interface MissionsViewProps {
  onBackToPacks?: () => void;
  onOpenCardCatalogue?: (card: PokemonCard) => void;
  onSelectEarnedPack?: (setId: string, language: 'en' | 'ja') => void;
  onOpenInventory?: () => void;
}

export const MissionsView: React.FC<MissionsViewProps> = ({ 
  onBackToPacks, 
  onOpenCardCatalogue, 
  onSelectEarnedPack, 
  onOpenInventory 
}) => {
  const [missions, setMissions] = useState<Mission[]>(() => getMissions());
  const [dailyFreePacks, setDailyFreePacks] = useState(() => getDailyFreePacks());
  const [earnedSetPacks, setEarnedSetPacks] = useState<EarnedSetPack[]>(() => getEarnedSetPacks());
  const [dailyCash, setDailyCash] = useState(() => getDailyCash());
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [claimedCardReward, setClaimedCardReward] = useState<any | null>(null);
  const [justClaimedId, setJustClaimedId] = useState<string | null>(null);

  useEffect(() => {
    const handleMissionsUpdate = (e: any) => {
      if (e.detail?.missions) {
        setMissions(e.detail.missions);
      } else {
        setMissions(getMissions());
      }
    };
    const handleDailyPacksUpdate = (e: any) => {
      setDailyFreePacks(e.detail);
    };
    const handleEarnedPacksUpdate = (e: any) => {
      setEarnedSetPacks(e.detail);
    };
    const handleDailyCashUpdate = (e: any) => {
      setDailyCash(e.detail);
    };

    window.addEventListener('missions_updated', handleMissionsUpdate);
    window.addEventListener('daily_packs_updated', handleDailyPacksUpdate);
    window.addEventListener('earned_packs_updated', handleEarnedPacksUpdate);
    window.addEventListener('daily_cash_updated', handleDailyCashUpdate);
    return () => {
      window.removeEventListener('missions_updated', handleMissionsUpdate);
      window.removeEventListener('daily_packs_updated', handleDailyPacksUpdate);
      window.removeEventListener('earned_packs_updated', handleEarnedPacksUpdate);
      window.removeEventListener('daily_cash_updated', handleDailyCashUpdate);
    };
  }, []);

  useEffect(() => {
    if (!justClaimedId) return;
    const timer = setTimeout(() => setJustClaimedId(null), 2500);
    return () => clearTimeout(timer);
  }, [justClaimedId]);

  const handleClaim = (mission: Mission) => {
    sound.playButtonClick();
    const result = claimMissionReward(mission.id);
    if (result.success) {
      sound.playLegendaryFanfare();
      setJustClaimedId(mission.id);
      setMissions(getMissions());
      setEarnedSetPacks(getEarnedSetPacks());
      if (result.rewardCard) {
        setClaimedCardReward(result.rewardCard);
      }
    }
  };

  const filteredMissions = missions.filter(m => m.type === activeTab);
  const completedCount = missions.filter(m => m.type === activeTab && (m.claimed || m.progress >= m.target)).length;
  const totalCount = filteredMissions.length;
  const totalVaultPacks = earnedSetPacks.reduce((sum, p) => sum + p.count, 0);

  const getTierBadge = (mission: Mission) => {
    if (mission.type === 'monthly' || mission.rewardCard) {
      return { label: 'GRAIL QUEST', bg: 'bg-purple-500/20 border-purple-400/50 text-purple-300' };
    }
    if (mission.type === 'weekly' || mission.target >= 10) {
      return { label: 'GOLD QUEST', bg: 'bg-amber-500/20 border-amber-400/50 text-amber-300' };
    }
    return { label: 'DAILY TASK', bg: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' };
  };

  return (
    <div className="min-h-screen bg-[#090614] text-white p-4 sm:p-6 lg:p-8 flex flex-col max-w-7xl mx-auto relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 right-1/4 h-64 bg-gradient-to-b from-cyan-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navigation & Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10 mb-6 relative z-10">
        <div className="flex items-center gap-4">
          {onBackToPacks && (
            <button
              onClick={() => { sound.playButtonClick(); onBackToPacks(); }}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer shrink-0 shadow-md active:scale-95"
              title="Back to Packs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-[0_0_25px_rgba(56,189,248,0.35)] shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#0b0819] flex items-center justify-center text-cyan-400">
                <Target className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Convention Quests & Allowance
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>FLOOR BOARD</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Complete daily, weekly, and monthly convention tasks to earn free booster passes, cash & exclusive promo cards.
              </p>
            </div>
          </div>
        </div>

        {/* Live Free Packs & Allowance Terminal Widget */}
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
          <div className="px-4 py-2.5 rounded-2xl bg-[#120d26]/90 border border-emerald-500/30 flex items-center gap-3 shadow-lg min-w-[150px] shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">English Packs</span>
              <span className="text-base font-mono font-black text-emerald-400">{dailyFreePacks.english}/5</span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-[#120d26]/90 border border-rose-500/30 flex items-center gap-3 shadow-lg min-w-[150px] shrink-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-400/40 flex items-center justify-center text-rose-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Japanese Packs</span>
              <span className="text-base font-mono font-black text-rose-400">{dailyFreePacks.japanese}/5</span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-[#120d26]/90 border border-amber-500/30 flex items-center gap-3 shadow-lg min-w-[140px] shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Daily Allowance</span>
              <span className="text-base font-mono font-black text-amber-400">${dailyCash}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pack Vault Inventory Access Banner */}
      <div className="mb-6 bg-gradient-to-r from-[#1c1533]/90 via-[#140e29]/90 to-[#0e091e]/95 p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-[0_4px_25px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md shrink-0">
            <Box className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white">
                Pack Vault Inventory
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-black">
                {totalVaultPacks} Packs Ready to Rip
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              All earned mission set boosters and mystery packs are stored securely in your vault.
            </p>
          </div>
        </div>

        {onOpenInventory && (
          <button
            onClick={() => { sound.playButtonClick(); onOpenInventory(); }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
          >
            <Box className="w-4 h-4 text-black" />
            <span>Open Pack Vault</span>
          </button>
        )}
      </div>

      {/* Category Tabs & Quest Completion Progress */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-[#110d24]/80 p-2 rounded-2xl border border-white/10 relative z-10 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {(['daily', 'weekly', 'monthly'] as const).map(tab => {
            const isSelected = activeTab === tab;
            const tabMissions = missions.filter(m => m.type === tab);
            const claimableCount = tabMissions.filter(m => !m.claimed && m.progress >= m.target).length;

            return (
              <button
                key={tab}
                onClick={() => { sound.playTabSwitch(); setActiveTab(tab); }}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 relative ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-cyan-300/40'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                }`}
              >
                {tab === 'daily' && <Clock className="w-3.5 h-3.5 text-emerald-400" />}
                {tab === 'weekly' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                {tab === 'monthly' && <Trophy className="w-3.5 h-3.5 text-purple-400" />}
                <span className="capitalize">{tab} Quests</span>
                {claimableCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black animate-pulse shadow-sm">
                    {claimableCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category Progress Bar */}
        <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3 shrink-0">
          <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Progress:</span>
          <span className="font-mono font-black text-xs text-white">{completedCount} / {totalCount}</span>
          <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quest Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 relative z-10">
        {filteredMissions.map((mission) => {
          const isReadyToClaim = !mission.claimed && mission.progress >= mission.target;
          const percentage = Math.min(100, Math.round((mission.progress / mission.target) * 100));
          const tier = getTierBadge(mission);

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                mission.claimed
                  ? 'bg-[#100d20]/60 border-white/5 opacity-75'
                  : isReadyToClaim
                  ? 'bg-gradient-to-b from-[#1c1433] via-[#140e29] to-[#0c0919] border-amber-400/70 shadow-[0_0_30px_rgba(245,158,11,0.25)] scale-[1.01]'
                  : 'bg-gradient-to-b from-[#140e28]/90 to-[#0b0817]/95 border-white/10 hover:border-cyan-400/40 hover:shadow-xl'
              }`}
            >
              {/* Top Status Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${tier.bg}`}>
                  {tier.label}
                </span>

                {mission.claimed ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase">
                    COMPLETED
                  </span>
                ) : isReadyToClaim ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider animate-pulse shadow-md">
                    READY TO CLAIM
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[9px] font-bold uppercase font-mono">
                    {percentage}%
                  </span>
                )}
              </div>

              {/* Quest Title & Description */}
              <div className="mb-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    mission.claimed
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : isReadyToClaim
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-400 animate-bounce'
                      : 'bg-cyan-500/15 text-cyan-400 border border-cyan-400/30'
                  }`}>
                    {mission.claimed ? <CheckCircle2 className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-white leading-tight">{mission.title}</h3>
                    <span className="text-[10px] font-medium text-gray-400 block mt-0.5">
                      Target: {mission.target} • {mission.type} floor task
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 font-medium leading-relaxed pl-12">
                  {mission.description}
                </p>
              </div>

              {/* Quest Reward Pills */}
              <div className="bg-black/50 p-3 rounded-xl border border-white/10 mb-4">
                <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Quest Rewards:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {mission.rewardSetPacks.map((pack, idx) => (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm ${
                        pack.language === 'en'
                          ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                          : 'bg-rose-500/15 border-rose-400/40 text-rose-300'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" /> +{pack.count} {pack.setName} ({pack.language.toUpperCase()})
                    </span>
                  ))}
                  {mission.rewardCard && (
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-400/40 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Promo Card
                    </span>
                  )}
                  {mission.rewardCash ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                      <Coins className="w-3.5 h-3.5 text-amber-400" /> +${mission.rewardCash} Cash
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Progress Bar & Actions */}
              <div>
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400 text-[10px] uppercase font-sans font-bold">Progress</span>
                    <span className="font-bold text-white">
                      {mission.progress} / {mission.target}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        mission.claimed
                          ? 'bg-gray-600'
                          : isReadyToClaim
                          ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                          : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {mission.claimed ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-500 font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Claimed
                  </button>
                ) : isReadyToClaim ? (
                  <button
                    onClick={() => handleClaim(mission)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 cursor-pointer animate-pulse active:scale-[0.98]"
                  >
                    <Gift className="w-4 h-4 text-black" />
                    <span>CLAIM REWARD</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <Clock className="w-3.5 h-3.5" /> In Progress ({mission.target - mission.progress} remaining)
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Exclusive Card Reward Milestone Modal */}
      <AnimatePresence>
        {claimedCardReward && (
          <div
            onClick={() => setClaimedCardReward(null)}
            className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#18122c] to-[#0d091a] border border-amber-400/70 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_80px_rgba(245,158,11,0.4)] text-center relative flex flex-col items-center overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>

              <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full mb-2">
                Quest Milestone Unlocked!
              </span>
              <h2 className="text-2xl font-black text-white mb-1">
                {claimedCardReward.promoTitle || 'Exclusive Promo Awarded'}
              </h2>
              <p className="text-xs text-gray-300 mb-6 font-medium leading-relaxed">
                You earned <span className="text-amber-400 font-bold">{claimedCardReward.name}</span>! It has been deposited into your binder.
              </p>

              <div className="w-48 h-64 sm:w-56 sm:h-76 mb-6">
                <InteractiveCard3D
                  card={{
                    id: claimedCardReward.id,
                    originalIndex: 0,
                    flipped: false,
                    collected: true,
                    value: claimedCardReward.value || 150,
                    pokemon: claimedCardReward
                  }}
                  interactive={true}
                  showcase={true}
                  className="w-full h-full rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.5)] border border-amber-400/60"
                />
              </div>

              <div className="flex items-center gap-3 w-full">
                {onOpenCardCatalogue && (
                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      const c = claimedCardReward;
                      setClaimedCardReward(null);
                      onOpenCardCatalogue(c);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs transition-all shadow-md border border-cyan-300/40 cursor-pointer"
                  >
                    Inspect Details
                  </button>
                )}
                <button
                  onClick={() => { sound.playModalClose(); setClaimedCardReward(null); }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black font-black text-xs transition-all shadow-[0_4px_20px_rgba(245,158,11,0.4)] cursor-pointer active:scale-95"
                >
                  Awesome, Close!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MissionsView;
