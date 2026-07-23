import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Award, CheckCircle2, Gift, Sparkles, Clock, Package, Coins, Trophy, ChevronRight, Zap, RefreshCw, Layers, Box } from 'lucide-react';
import { getMissions, getDailyFreePacks, getEarnedSetPacks, getDailyCash, claimMissionReward, type Mission, type EarnedSetPack } from '../../services/missions';
import { sound } from '../../services/sound';
import InteractiveCard3D from '../binder/InteractiveCard3D';
import { PokemonCard } from '../../services/tcgdex';

interface MissionsViewProps {
  onBackToPacks?: () => void;
  onOpenCardCatalogue?: (card: PokemonCard) => void;
  onSelectEarnedPack?: (setId: string, language: 'en' | 'ja') => void;
  onOpenInventory?: () => void;
}

export const MissionsView: React.FC<MissionsViewProps> = ({ onBackToPacks, onOpenCardCatalogue, onSelectEarnedPack, onOpenInventory }) => {
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

  const handleClaim = (mission: Mission) => {
    sound.playButtonClick();
    const result = claimMissionReward(mission.id);
    if (result.success) {
      sound.playLegendaryFanfare();
      setJustClaimedId(mission.id);
      setTimeout(() => setJustClaimedId(null), 2500);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a] text-white p-4 sm:p-6 lg:p-8 flex flex-col max-w-7xl mx-auto">
      {/* Top Header & Allowance Dashboard */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#38bdf8] via-[#0284c7] to-indigo-600 flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.4)] border border-[#38bdf8]/50">
              <Target className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-white flex items-center gap-2">
                Convention Missions & Allowance
              </h1>
              <p className="text-xs sm:text-sm font-mono text-gray-400">
                Complete daily, weekly, and monthly floor tasks to earn free Booster Pack Passes & Exclusive Promo Cards.
              </p>
            </div>
          </div>
        </div>

        {/* Live Free Packs, Earned Packs & Cash Dashboard */}
        <div className="flex flex-col gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-4 bg-[#111827] px-5 py-3.5 rounded-2xl border border-[#38bdf8]/40 shadow-[0_0_25px_rgba(56,189,248,0.15)] shrink-0">
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">🇺🇸 English Free Packs</span>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    {dailyFreePacks.english}/5
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">🇯🇵 Japanese Free Packs</span>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-black text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                    {dailyFreePacks.japanese}/5
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111827] px-5 py-3.5 rounded-2xl border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)] shrink-0">
            <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
              {/* Inventory Button replacing Earned Set Packs */}
              {onOpenInventory && (
                <button
                  onClick={() => { sound.playButtonClick(); onOpenInventory(); }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-mono font-black text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-300/60 flex items-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95"
                >
                  <Box className="w-4 h-4 text-yellow-200 animate-pulse" />
                  <span>Inventory 🎒</span>
                </button>
              )}

              <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-amber-500/30">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Daily Cash</span>
                <span className="text-lg font-black text-amber-400 font-mono drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                  ${dailyCash.toFixed(2)}
                </span>
              </div>
            </div>

            {onBackToPacks && (
              <button
                onClick={() => { sound.playButtonClick(); onBackToPacks(); }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-mono font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-400/50 flex items-center gap-1.5 cursor-pointer transform hover:scale-105"
              >
                <Package className="w-3.5 h-3.5" /> Open Packs Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mission Category Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 bg-[#111827]/80 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['daily', 'weekly', 'monthly'] as const).map(tab => {
            const isSelected = activeTab === tab;
            const tabMissions = missions.filter(m => m.type === tab);
            const claimableCount = tabMissions.filter(m => !m.claimed && m.progress >= m.target).length;

            return (
              <button
                key={tab}
                onClick={() => { sound.playTabSwitch(); setActiveTab(tab); }}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-mono font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer relative ${isSelected
                    ? 'bg-gradient-to-r from-[#38bdf8] to-[#0284c7] text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-white/30 scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-transparent'
                  }`}
              >
                {tab === 'daily' && <Clock className="w-4 h-4 text-emerald-400" />}
                {tab === 'weekly' && <Zap className="w-4 h-4 text-amber-400" />}
                {tab === 'monthly' && <Trophy className="w-4 h-4 text-purple-400" />}
                <span className="capitalize">{tab} Missions</span>
                {claimableCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                    {claimableCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-xs font-mono text-gray-400 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
          <span>Category Progress:</span>
          <span className="font-bold text-white">{completedCount} / {totalCount}</span>
          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-[#38bdf8] transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Earned Set Packs Summary */}
      {earnedSetPacks.length > 0 && (
        <div className="mb-8 bg-[#111827]/90 p-4 rounded-2xl border border-amber-500/30 backdrop-blur-md">
          <h2 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" /> Earned Set Packs
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {earnedSetPacks.map((pack, idx) => (
              <div
                key={idx}
                onClick={() => {
                  sound.playButtonClick();
                  if (onSelectEarnedPack) {
                    onSelectEarnedPack(pack.setId, pack.language);
                  }
                }}
                className={`p-3 rounded-xl border text-center cursor-pointer hover:scale-105 transition-all shadow-md hover:shadow-lg ${pack.language === 'en'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50'
                  }`}
              >
                <div className="text-[10px] font-mono text-gray-400 uppercase">{pack.setName}</div>
                <div className="text-lg font-black font-mono mt-1">{pack.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        {filteredMissions.map((mission) => {
          const isReadyToClaim = !mission.claimed && mission.progress >= mission.target;
          const percentage = Math.min(100, Math.round((mission.progress / mission.target) * 100));

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${mission.claimed
                  ? 'bg-[#111827]/60 border-white/5 opacity-75'
                  : isReadyToClaim
                    ? 'bg-gradient-to-br from-[#111827] via-[#1a233a] to-[#111827] border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.25)] scale-[1.02]'
                    : 'bg-[#111827] border-white/10 hover:border-white/20 hover:shadow-xl'
                }`}
            >
              {isReadyToClaim && (
                <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-mono font-black uppercase px-3 py-1 rounded-bl-xl shadow-md animate-pulse">
                  Ready to Claim!
                </div>
              )}
              {mission.claimed && (
                <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-300 border-l border-b border-emerald-500/40 text-[9px] font-mono font-bold uppercase px-3 py-1 rounded-bl-xl">
                  Completed ✓
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mission.claimed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isReadyToClaim
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-400 animate-bounce'
                        : 'bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30'
                    }`}>
                    {mission.claimed ? <CheckCircle2 className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-mono font-bold text-white leading-tight">{mission.title}</h3>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mt-0.5">
                      {mission.type} Task • Target: {mission.target}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-mono text-gray-300 mb-5 leading-relaxed">
                  {mission.description}
                </p>

                {/* Reward Section */}
                <div className="bg-[#0b0f19] p-3 rounded-xl border border-white/10 mb-5 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Mission Rewards:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {mission.rewardSetPacks.map((pack, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm ${pack.language === 'en'
                            ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                            : 'bg-rose-500/15 border-rose-400/40 text-rose-300'
                          }`}
                      >
                        <Package className="w-3.5 h-3.5" /> +{pack.count} {pack.setName} ({pack.language.toUpperCase()})
                      </span>
                    ))}
                    {mission.rewardCard && (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-400/40 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Exclusive {mission.rewardCard.rarity || 'Promo'} Card
                      </span>
                    )}
                    {mission.rewardCash ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                        <Coins className="w-3.5 h-3.5 text-amber-400" /> +${mission.rewardCash} Convention Cash
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Task Progress</span>
                    <span className="font-bold text-white">
                      {mission.progress} / {mission.target} <span className="text-gray-500">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${mission.claimed
                          ? 'bg-gray-600'
                          : isReadyToClaim
                            ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                            : 'bg-gradient-to-r from-[#38bdf8] to-[#0284c7]'
                        }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {mission.claimed ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-500 font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Claimed & Saved to Binder
                  </button>
                ) : isReadyToClaim ? (
                  <button
                    onClick={() => handleClaim(mission)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 text-black font-mono font-black text-sm tracking-wide transition-all duration-300 shadow-[0_0_25px_rgba(245,158,11,0.6)] border-2 border-white transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Gift className="w-4 h-4" /> CLAIM REWARD ({mission.rewardSetPacks.reduce((acc, rp) => acc + rp.count, 0)} PACKS{mission.rewardCard ? ' + CARD' : ''}{mission.rewardCash ? ` + $${mission.rewardCash}` : ''})
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-[#1e293b]/60 border border-white/10 text-gray-400 font-mono font-semibold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <Clock className="w-3.5 h-3.5" /> In Progress ({mission.target - mission.progress} more left)
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Exclusive Card Reward Celebration Modal */}
      <AnimatePresence>
        {claimedCardReward && (
          <div
            onClick={() => setClaimedCardReward(null)}
            className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-lg flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: 30 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#111827] to-[#0f172a] border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_80px_rgba(245,158,11,0.4)] text-center relative flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>

              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full mb-2">
                🏆 Mission Milestone Unlocked!
              </span>
              <h2 className="text-2xl font-mono font-black text-white mb-1">
                {claimedCardReward.promoTitle || 'Exclusive Promo Awarded'}
              </h2>
              <p className="text-xs font-mono text-gray-300 mb-6">
                You have earned <span className="text-amber-400 font-bold">{claimedCardReward.name}</span>! It has been automatically deposited into your <strong className="text-emerald-400">Mission Rewards</strong> Binder.
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
                  className="w-full h-full rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.6)] border border-amber-400/60"
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
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0284c7] hover:from-[#7dd3fc] hover:to-[#0284c7] text-white font-mono font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-[#38bdf8]/50 cursor-pointer"
                  >
                    Inspect Card Details
                  </button>
                )}
                <button
                  onClick={() => { sound.playModalClose(); setClaimedCardReward(null); }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 text-black font-mono font-black text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer transform hover:scale-105"
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
