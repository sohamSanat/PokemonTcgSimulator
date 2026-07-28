import { ENGLISH_MYSTERY_PACKS, JAPANESE_MYSTERY_PACKS, MysteryPackConfig } from '../data/mysteryPacks';

export const LUCKY_DROP_INTERVAL_SECONDS = 300; // 5 minutes

const LUCKY_DROP_STORAGE_KEY = 'tcg_lucky_drop_last_claim_ts';

function getStoragePrefix(): string {
  if (typeof window === 'undefined') return '';
  const currentGuestId = localStorage.getItem('tcg_current_guest_id') || 'default_guest';
  return `guest_${currentGuestId}_`;
}

function lsKey(key: string): string {
  return `${getStoragePrefix()}${key}`;
}

export function getLastLuckyDropClaimTime(): number {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(lsKey(LUCKY_DROP_STORAGE_KEY));
  if (!stored) return 0;
  const parsed = parseInt(stored, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function getRemainingLuckyDropSeconds(): number {
  const lastClaim = getLastLuckyDropClaimTime();
  if (!lastClaim) return 0; // Ready if never claimed
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - lastClaim) / 1000);
  const remaining = LUCKY_DROP_INTERVAL_SECONDS - elapsedSeconds;
  return Math.max(0, remaining);
}

export function isLuckyDropReady(): boolean {
  return getRemainingLuckyDropSeconds() === 0;
}

/**
 * Price-weighted random mystery pack roll for the 5-min Lucky Drop.
 * Lower price packs dropped more frequently, while expensive grails ($99-$499)
 * stay obtainable with exciting dopamine pull rates (~2% - 5%).
 */
export function rollLuckyDropPack(): MysteryPackConfig {
  const pool: MysteryPackConfig[] = [...ENGLISH_MYSTERY_PACKS, ...JAPANESE_MYSTERY_PACKS];
  
  // Weight function: soft inverse price curve so high-tier packs drop, but are reachable
  const weightedCandidates = pool.map(pack => {
    // 0.55 exponent keeps expensive packs rare but reachable (dopamine hit!)
    const weight = Math.max(0.05, 1 / Math.pow(pack.price || 10, 0.55));
    return { pack, weight };
  });

  const totalWeight = weightedCandidates.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of weightedCandidates) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.pack;
    }
  }

  return pool[0];
}

export function claimLuckyDropReward(): MysteryPackConfig {
  if (typeof window !== 'undefined') {
    localStorage.setItem(lsKey(LUCKY_DROP_STORAGE_KEY), String(Date.now()));
  }
  return rollLuckyDropPack();
}
