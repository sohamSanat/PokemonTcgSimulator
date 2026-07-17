import { PokemonCard } from './tcgdex';
import { saveCollectedCard } from '../components/binder/types';

// --- Types ---
export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number;
  progress: number;
  claimed: boolean;
  // Updated: reward is specific set packs
  rewardSetPacks: Array<{ setId: string; setName: string; count: number; language: 'en' | 'ja' }>;
  rewardCard?: any;
  actionType: 'open_pack' | 'vendor_chat' | 'inspect_card' | 'grade_psa' | 'grade_psa_10' | 'buy_vendor' | 'collect_card';
}

// --- Storage Keys ---
const DAILY_ENGLISH_FREE_KEY = 'tcg_daily_english_free';
const DAILY_JAPANESE_FREE_KEY = 'tcg_daily_japanese_free';
const DAILY_CASH_KEY = 'tcg_daily_cash';
const LAST_RESET_KEY = 'tcg_last_pass_reset';
const MISSIONS_STATE_KEY = 'tcg_user_missions';
const EARNED_SET_PACKS_KEY = 'tcg_earned_set_packs'; // Track earned packs from missions

// --- Promo Cards ---
const PROMO_CARDS: Record<string, any> = {
  charizard_v_special: {
    id: 'swsh3-19' as string,
    name: 'Charizard V (Secret Art Promo)',
    rarity: 'Secret Rare',
    illustrator: '5ban Graphics',
    hp: 220,
    types: ['Fire'],
    isVendorCatalog: false,
    value: 145.00,
    promoTitle: 'Weekly Champion Award'
  },
  pikachu_illustrator: {
    id: 'swsh4-44' as string,
    name: 'Pikachu VMAX (Rainbow Secret)',
    rarity: 'Rainbow Secret Rare',
    illustrator: 'PLANETA Mochizuki',
    hp: 310,
    types: ['Lightning'],
    isVendorCatalog: false,
    value: 210.00,
    promoTitle: 'Convention Master Award'
  },
  rayquaza_gold_star: {
    id: 'swsh7-218' as string,
    name: 'Rayquaza VMAX (Alternate Secret Art)',
    rarity: 'Special Art Rare',
    illustrator: 'Anesaki Dynamic',
    hp: 320,
    types: ['Dragon'],
    isVendorCatalog: false,
    value: 380.00,
    promoTitle: 'Monthly Dragon Lord Award'
  },
  lugia_v_special: {
    id: 'swsh12-186' as string,
    name: 'Lugia V (Silver Tempest Alt Art)',
    rarity: 'Special Art Rare',
    illustrator: 'kawayoo',
    hp: 220,
    types: ['Colorless'],
    isVendorCatalog: false,
    value: 295.00,
    promoTitle: 'Pristine Grader Award'
  },
  mewtwo_gold_secret: {
    id: 'pgo-80' as string,
    name: 'Mewtwo VSTAR (Gold Secret Rare)',
    rarity: 'Gold Secret Rare',
    illustrator: 'PLANETA Yamashita',
    hp: 280,
    types: ['Psychic'],
    isVendorCatalog: false,
    value: 185.00,
    promoTitle: 'Master Collector Trophy'
  }
};

// --- Initial Missions (Updated to give specific set packs) ---
const INITIAL_MISSIONS: Mission[] = [
  // --- DAILY MISSIONS ---
  {
    id: 'daily_open_packs',
    title: 'Daily Pack Ripper',
    description: 'Open 3 Booster Packs from any expansion set.',
    type: 'daily',
    target: 3,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'me02.5', setName: 'Ascended Heroes', count: 2, language: 'en' },
      { setId: 'sv01', setName: 'Scarlet & Violet Base', count: 1, language: 'en' }
    ],
    actionType: 'open_pack'
  },
  {
    id: 'daily_vendor_chat',
    title: 'Convention Floor Haggler',
    description: 'Chat or negotiate price with a convention booth vendor.',
    type: 'daily',
    target: 1,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv02', setName: 'Paldea Evolved', count: 1, language: 'en' },
      { setId: 'sv1v', setName: 'Violet ex', count: 1, language: 'ja' }
    ],
    actionType: 'vendor_chat'
  },
  {
    id: 'daily_inspect_card',
    title: 'Keen Eye Appraiser',
    description: 'Inspect 5 different cards using the 3D Market Inspector or Art Studio.',
    type: 'daily',
    target: 5,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'swsh12', setName: 'Silver Tempest', count: 2, language: 'en' }
    ],
    actionType: 'inspect_card'
  },
  {
    id: 'daily_collect_cards',
    title: 'Daily Binder Addition',
    description: 'Add 5 cards to your personal Binder collections.',
    type: 'daily',
    target: 5,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv03', setName: 'Obsidian Flames', count: 1, language: 'en' }
    ],
    actionType: 'collect_card'
  },

  // --- WEEKLY MISSIONS ---
  {
    id: 'weekly_open_packs',
    title: 'Booster Marathon',
    description: 'Open 15 Booster Packs across your convention journey.',
    type: 'weekly',
    target: 15,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv03', setName: 'Obsidian Flames', count: 5, language: 'en' },
      { setId: 'sv2d', setName: 'Clay Burst', count: 3, language: 'ja' },
      { setId: 'sv2p', setName: 'Snow Hazard', count: 2, language: 'ja' }
    ],
    rewardCard: PROMO_CARDS.charizard_v_special,
    actionType: 'open_pack'
  },
  {
    id: 'weekly_grade_psa',
    title: 'Grading Lab Specialist',
    description: 'Submit 3 cards to the PSA Grading Lab for ultrasonic assessment.',
    type: 'weekly',
    target: 3,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'swsh10', setName: 'Astral Radiance', count: 3, language: 'en' },
      { setId: 'sv3', setName: 'Ruler of the Black Flame', count: 2, language: 'ja' }
    ],
    rewardCard: PROMO_CARDS.pikachu_illustrator,
    actionType: 'grade_psa'
  },
  {
    id: 'weekly_buy_vendor',
    title: 'Convention Dealmaker',
    description: 'Directly buy 2 cards from convention floor vendors after negotiation.',
    type: 'weekly',
    target: 2,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv04', setName: 'Paradox Rift', count: 5, language: 'en' },
      { setId: 'sv4a', setName: 'Shiny Treasure ex', count: 3, language: 'ja' }
    ],
    actionType: 'buy_vendor'
  },
  {
    id: 'weekly_inspect_market',
    title: 'Market Analyst',
    description: 'Inspect 20 different cards using the 3D Market Inspector or Art Studio.',
    type: 'weekly',
    target: 20,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'swsh11', setName: 'Lost Origin', count: 3, language: 'en' }
    ],
    actionType: 'inspect_card'
  },

  // --- MONTHLY MISSIONS ---
  {
    id: 'monthly_open_packs',
    title: 'Legendary Pack Master',
    description: 'Open 50 Booster Packs to unlock the monthly dragon reward.',
    type: 'monthly',
    target: 50,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'swsh7', setName: 'Evolving Skies', count: 10, language: 'en' },
      { setId: 'sv8', setName: 'Super Electric Breaker', count: 10, language: 'ja' },
      { setId: 'sv08', setName: 'Surging Sparks', count: 10, language: 'en' }
    ],
    rewardCard: PROMO_CARDS.rayquaza_gold_star,
    actionType: 'open_pack'
  },
  {
    id: 'monthly_grade_psa_10',
    title: 'Pristine Perfectionist',
    description: 'Score 2 pristine PSA 10 / Gem Mint grades in the grading lab.',
    type: 'monthly',
    target: 2,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'swsh4', setName: 'Vivid Voltage', count: 10, language: 'en' },
      { setId: 'sv6', setName: 'Transformation Mask', count: 10, language: 'ja' }
    ],
    rewardCard: PROMO_CARDS.lugia_v_special,
    actionType: 'grade_psa_10'
  },
  {
    id: 'monthly_master_collector',
    title: 'Vault Curator Milestone',
    description: 'Add 30 cards to your personal Binder collections.',
    type: 'monthly',
    target: 30,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv05', setName: 'Temporal Forces', count: 15, language: 'en' },
      { setId: 'sv7', setName: 'Stellar Miracle', count: 15, language: 'ja' },
      { setId: 'sv09', setName: 'Journey Together', count: 10, language: 'en' }
    ],
    rewardCard: PROMO_CARDS.mewtwo_gold_secret,
    actionType: 'collect_card'
  },
  {
    id: 'monthly_vendor_chat',
    title: 'Master Negotiator',
    description: 'Chat or negotiate price with convention booth vendors 15 times.',
    type: 'monthly',
    target: 15,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'swsh12pt5', setName: 'Crown Zenith', count: 5, language: 'en' }
    ],
    actionType: 'vendor_chat'
  }
];

// --- Daily Reset Logic ---
function checkDailyReset() {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  const lastReset = localStorage.getItem(LAST_RESET_KEY);
  if (lastReset !== today) {
    localStorage.setItem(LAST_RESET_KEY, today);
    // Give 5 English and 5 Japanese free packs daily
    localStorage.setItem(DAILY_ENGLISH_FREE_KEY, '5');
    localStorage.setItem(DAILY_JAPANESE_FREE_KEY, '5');
    // Give $40 daily cash allowance
    localStorage.setItem(DAILY_CASH_KEY, '100');

    // Reset daily missions progress
    const missions = getMissions();
    const updated = missions.map(m => m.type === 'daily' ? { ...m, progress: 0, claimed: false } : m);
    localStorage.setItem(MISSIONS_STATE_KEY, JSON.stringify(updated));
  }
}

// --- Get Daily Free Packs ---
export function getDailyFreePacks(): { english: number; japanese: number } {
  if (typeof window === 'undefined') return { english: 5, japanese: 5 };
  checkDailyReset();
  const english = parseInt(localStorage.getItem(DAILY_ENGLISH_FREE_KEY) || '5', 10);
  const japanese = parseInt(localStorage.getItem(DAILY_JAPANESE_FREE_KEY) || '5', 10);
  return {
    english: isNaN(english) ? 5 : english,
    japanese: isNaN(japanese) ? 5 : japanese
  };
}

// --- Get Daily Cash ---
export function getDailyCash(): number {
  if (typeof window === 'undefined') return 40;
  checkDailyReset();
  const cash = parseFloat(localStorage.getItem(DAILY_CASH_KEY) || '40');
  return isNaN(cash) ? 40 : cash;
}

// --- Use Daily Cash (and optionally net return) ---
// Returns a tuple: [success, amountToDeductFromNetReturn]
// If using net return, amountToDeductFromNetReturn is the amount to add to sessionSpent to reduce net return
export function useDailyCash(amount: number, netReturn: number = 0): [boolean, number] {
  if (typeof window === 'undefined') return [true, 0];
  const currentDailyCash = getDailyCash();

  let remainingAmount = amount;
  let deductFromNetReturn = 0;

  // First use daily cash
  if (currentDailyCash > 0) {
    const fromDailyCash = Math.min(currentDailyCash, remainingAmount);
    remainingAmount -= fromDailyCash;
    if (fromDailyCash > 0) {
      const nextDailyCash = Math.max(0, Number((currentDailyCash - fromDailyCash).toFixed(2)));
      localStorage.setItem(DAILY_CASH_KEY, nextDailyCash.toString());
      window.dispatchEvent(new CustomEvent('daily_cash_updated', { detail: nextDailyCash }));
    }
  }

  // Then use net return if needed
  if (remainingAmount > 0 && netReturn >= remainingAmount) {
    deductFromNetReturn = remainingAmount;
    remainingAmount = 0;
  }

  if (remainingAmount > 0) {
    return [false, 0];
  }

  return [true, deductFromNetReturn];
}

// --- Use Daily Free Pack ---
export function useDailyFreePack(language: 'en' | 'ja'): boolean {
  if (typeof window === 'undefined') return true;
  const key = language === 'en' ? DAILY_ENGLISH_FREE_KEY : DAILY_JAPANESE_FREE_KEY;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  if (current <= 0) return false;
  const next = current - 1;
  localStorage.setItem(key, String(next));
  window.dispatchEvent(new CustomEvent('daily_packs_updated', {
    detail: getDailyFreePacks()
  }));
  return true;
}

// --- Earned Set Packs ---
export interface EarnedSetPack {
  setId: string;
  setName: string;
  language: 'en' | 'ja';
  count: number;
}

export function getEarnedSetPacks(): EarnedSetPack[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(EARNED_SET_PACKS_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved) as EarnedSetPack[];
  } catch {
    return [];
  }
}

export function addEarnedSetPacks(packs: EarnedSetPack[]) {
  if (typeof window === 'undefined') return;
  const current = getEarnedSetPacks();
  const updated = [...current];
  packs.forEach(newPack => {
    const existingIndex = updated.findIndex(p =>
      p.setId === newPack.setId && p.language === newPack.language
    );
    if (existingIndex !== -1) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        count: updated[existingIndex].count + newPack.count
      };
    } else {
      updated.push(newPack);
    }
  });
  localStorage.setItem(EARNED_SET_PACKS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('earned_packs_updated', { detail: updated }));
}

export function useEarnedSetPack(setId: string, language: 'en' | 'ja'): boolean {
  if (typeof window === 'undefined') return true;
  const current = getEarnedSetPacks();
  const packIndex = current.findIndex(p => p.setId === setId && p.language === language && p.count > 0);
  if (packIndex === -1) return false;
  current[packIndex].count -= 1;
  const updated = current.filter(p => p.count > 0);
  localStorage.setItem(EARNED_SET_PACKS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('earned_packs_updated', { detail: updated }));
  return true;
}

// --- Missions ---
export function getMissions(): Mission[] {
  if (typeof window === 'undefined') return INITIAL_MISSIONS;
  checkDailyReset();
  const saved = localStorage.getItem(MISSIONS_STATE_KEY);
  if (!saved) {
    localStorage.setItem(MISSIONS_STATE_KEY, JSON.stringify(INITIAL_MISSIONS));
    return INITIAL_MISSIONS;
  }
  try {
    const parsed = JSON.parse(saved) as Mission[];
    const parsedMap = new Map(parsed.map(m => [m.id, m]));
    return INITIAL_MISSIONS.map(init => {
      const existing = parsedMap.get(init.id);
      return existing ? { ...init, progress: existing.progress, claimed: existing.claimed } : init;
    });
  } catch {
    return INITIAL_MISSIONS;
  }
}

export function trackMissionProgress(
  action: 'open_pack' | 'vendor_chat' | 'inspect_card' | 'grade_psa' | 'grade_psa_10' | 'buy_vendor' | 'collect_card',
  count = 1
) {
  if (typeof window === 'undefined') return;
  const missions = getMissions();
  let changed = false;

  const updated = missions.map(m => {
    if (m.actionType === action && !m.claimed && m.progress < m.target) {
      changed = true;
      return { ...m, progress: Math.min(m.target, m.progress + count) };
    }
    return m;
  });

  if (changed) {
    localStorage.setItem(MISSIONS_STATE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('missions_updated', { detail: { missions: updated } }));
  }
}

export function claimMissionReward(missionId: string): {
  success: boolean;
  rewardSetPacks: EarnedSetPack[];
  rewardCard?: PokemonCard & { promoTitle?: string }
} {
  if (typeof window === 'undefined') return { success: false, rewardSetPacks: [] };
  const missions = getMissions();
  const targetIndex = missions.findIndex(m => m.id === missionId);
  if (targetIndex === -1) return { success: false, rewardSetPacks: [] };

  const mission = missions[targetIndex];
  if (mission.progress < mission.target || mission.claimed) {
    return { success: false, rewardSetPacks: [] };
  }

  // 1. Add earned set packs
  addEarnedSetPacks(mission.rewardSetPacks);

  // 2. Add promo reward card to binder if included
  if (mission.rewardCard) {
    saveCollectedCard({
      ...mission.rewardCard,
      value: mission.rewardCard.value || 150,
      currentPrice: mission.rewardCard.value || 150,
      isVendorCatalog: false
    }, 'Mission Rewards', 'my-collection');
    window.dispatchEvent(new Event('storage'));
  }

  // 3. Mark claimed
  missions[targetIndex].claimed = true;
  localStorage.setItem(MISSIONS_STATE_KEY, JSON.stringify(missions));
  window.dispatchEvent(new CustomEvent('missions_updated', { detail: { missions } }));

  return {
    success: true,
    rewardSetPacks: mission.rewardSetPacks,
    rewardCard: mission.rewardCard
  };
}

// --- Compatibility for old code (we'll remove these later) ---
export function getPackPasses(): number {
  return 0;
}
export function addPackPasses(): number {
  return 0;
}
export function usePackPass(): boolean {
  return false;
}
