import { useState, useEffect, useCallback } from 'react';
import {
  getDailyFreePacks,
  useDailyFreePack,
  getDailyCash,
  useDailyCash,
  getEarnedSetPacks,
  getOwnedMysteryPacks,
  type EarnedSetPack,
  type OwnedMysteryPack
} from '../services/missions';
import {
  getRemainingLuckyDropSeconds,
  claimLuckyDropReward,
  type LuckyDropReward
} from '../services/luckyDrop';

export interface DailyRewardsState {
  dailyFreePacks: { english: number; japanese: number };
  dailyCash: number;
  earnedSetPacks: EarnedSetPack[];
  ownedMysteryPacks: OwnedMysteryPack[];
  luckyDropSeconds: number;
  isLuckyDropModalOpen: boolean;
  claimedLuckyPack: LuckyDropReward | null;
  formatTimer: (totalSecs: number) => string;
  claimDailyFreePack: (language?: 'en' | 'ja') => boolean;
  claimDailyCash: (amount?: number, netReturn?: number) => [boolean, number];
  handleLuckyDropClick: () => void;
  handleLuckyDropOpenNow: () => { pack: LuckyDropReward | null; setPacks: EarnedSetPack[]; mysteryPacks: OwnedMysteryPack[] } | null;
  handleLuckyDropAddToInventory: () => { setPacks: EarnedSetPack[]; mysteryPacks: OwnedMysteryPack[] } | null;
  setIsLuckyDropModalOpen: (open: boolean) => void;
  refreshDailyState: () => void;
}

export function useDailyRewards(): DailyRewardsState {
  const [dailyFreePacks, setDailyFreePacks] = useState<{ english: number; japanese: number }>(() => getDailyFreePacks());
  const [dailyCash, setDailyCash] = useState<number>(() => getDailyCash());
  const [earnedSetPacks, setEarnedSetPacks] = useState<EarnedSetPack[]>(() => getEarnedSetPacks());
  const [ownedMysteryPacks, setOwnedMysteryPacks] = useState<OwnedMysteryPack[]>(() => getOwnedMysteryPacks());
  const [luckyDropSeconds, setLuckyDropSeconds] = useState<number>(() => getRemainingLuckyDropSeconds());
  const [isLuckyDropModalOpen, setIsLuckyDropModalOpen] = useState(false);
  const [claimedLuckyPack, setClaimedLuckyPack] = useState<LuckyDropReward | null>(null);

  const refreshDailyState = useCallback(() => {
    setDailyFreePacks(getDailyFreePacks());
    setDailyCash(getDailyCash());
    setEarnedSetPacks(getEarnedSetPacks());
    setOwnedMysteryPacks(getOwnedMysteryPacks());
    setLuckyDropSeconds(getRemainingLuckyDropSeconds());
  }, []);

  // Tick lucky drop timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setLuckyDropSeconds(getRemainingLuckyDropSeconds());
    }, 1000);

    const handleDailyCashUpdate = (e: CustomEvent<number>) => {
      if (typeof e.detail === 'number') {
        setDailyCash(e.detail);
      } else {
        setDailyCash(getDailyCash());
      }
    };

    window.addEventListener('daily_cash_updated', handleDailyCashUpdate as EventListener);
    window.addEventListener('storage', refreshDailyState);

    return () => {
      clearInterval(timer);
      window.removeEventListener('daily_cash_updated', handleDailyCashUpdate as EventListener);
      window.removeEventListener('storage', refreshDailyState);
    };
  }, [refreshDailyState]);

  const formatTimer = useCallback((totalSecs: number): string => {
    if (totalSecs <= 0) return '00:00:00';
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const claimDailyFreePack = useCallback((language: 'en' | 'ja' = 'en'): boolean => {
    const success = useDailyFreePack(language);
    if (success) {
      setDailyFreePacks(getDailyFreePacks());
    }
    return success;
  }, []);

  const claimDailyCash = useCallback((amount: number = 20, netReturn: number = 0): [boolean, number] => {
    const result = useDailyCash(amount, netReturn);
    setDailyCash(getDailyCash());
    return result;
  }, []);

  const handleLuckyDropClick = useCallback(() => {
    if (luckyDropSeconds > 0) return;
    const reward = claimLuckyDropReward();
    if (reward) {
      setClaimedLuckyPack(reward);
      setIsLuckyDropModalOpen(true);
      setLuckyDropSeconds(getRemainingLuckyDropSeconds());
    }
  }, [luckyDropSeconds]);

  const handleLuckyDropOpenNow = useCallback(() => {
    if (!claimedLuckyPack) return null;
    const packToOpen = claimedLuckyPack;
    setIsLuckyDropModalOpen(false);
    setClaimedLuckyPack(null);
    return {
      pack: packToOpen,
      setPacks: getEarnedSetPacks(),
      mysteryPacks: getOwnedMysteryPacks()
    };
  }, [claimedLuckyPack]);

  const handleLuckyDropAddToInventory = useCallback(() => {
    setIsLuckyDropModalOpen(false);
    setClaimedLuckyPack(null);
    const updatedSetPacks = getEarnedSetPacks();
    const updatedMysteryPacks = getOwnedMysteryPacks();
    setEarnedSetPacks(updatedSetPacks);
    setOwnedMysteryPacks(updatedMysteryPacks);
    return {
      setPacks: updatedSetPacks,
      mysteryPacks: updatedMysteryPacks
    };
  }, []);

  return {
    dailyFreePacks,
    dailyCash,
    earnedSetPacks,
    ownedMysteryPacks,
    luckyDropSeconds,
    isLuckyDropModalOpen,
    claimedLuckyPack,
    formatTimer,
    claimDailyFreePack,
    claimDailyCash,
    handleLuckyDropClick,
    handleLuckyDropOpenNow,
    handleLuckyDropAddToInventory,
    setIsLuckyDropModalOpen,
    refreshDailyState
  };
}
