import { PokemonCard } from './tcgdex';
import { saveCollectedCard, getStorageKey, syncToFirestore } from '../components/binder/types';
import promoCardsData from '../data/promo_cards.json';

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
  rewardCash?: number;
  actionType: 'open_pack' | 'vendor_chat' | 'inspect_card' | 'grade_psa' | 'grade_psa_10' | 'buy_vendor' | 'collect_card';
}

// --- Storage Keys ---
const DAILY_ENGLISH_FREE_KEY = 'tcg_daily_english_free';
const DAILY_JAPANESE_FREE_KEY = 'tcg_daily_japanese_free';
const DAILY_CASH_KEY = 'tcg_daily_cash';
const LAST_RESET_KEY = 'tcg_last_pass_reset';
const MISSIONS_STATE_KEY = 'tcg_user_missions';
const EARNED_SET_PACKS_KEY = 'tcg_earned_set_packs'; // Track earned packs from missions

// --- Per-account storage helpers ---
// All mission state is bound to the signed-in account. When a user is signed in
// the keys are namespaced by their uid and mirrored to Firestore (see binder/types.ts).
// When no user is signed in the data falls back to the un-namespaced local key
// (guest mode), which is migrated into the account on first sign-in.
function lsKey(base: string): string {
  return getStorageKey(base);
}

// Push the latest mission state to Firestore (no-op when not signed in).
function persistMissions() {
  syncToFirestore();
}

// --- Promo Cards ---
const PROMO_CARDS_POOL = promoCardsData as any[];

function getRandomRewardCard(promoTitle: string) {
  if (!PROMO_CARDS_POOL || PROMO_CARDS_POOL.length === 0) return undefined;
  const card = PROMO_CARDS_POOL[Math.floor(Math.random() * PROMO_CARDS_POOL.length)];
  return {
    ...card,
    isVendorCatalog: false,
    promoTitle
  };
}

// --- Initial Missions (Expanded & diversified across EN + JA sets) ---
const INITIAL_MISSIONS: Mission[] = [
  // --- DAILY MISSIONS (8) ---
  {
    id: 'daily_open_packs',
    title: 'Daily Pack Ripper',
    description: 'Open 3 Booster Packs from any expansion set.',
    type: 'daily',
    target: 3,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv01', setName: 'Scarlet & Violet', count: 2, language: 'en' },
      { setId: 'sv1a', setName: 'Triplet Beat', count: 1, language: 'ja' }
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
  {
    id: 'daily_grade_psa',
    title: 'Lab Intern',
    description: 'Submit 1 card to the PSA Grading Lab for assessment.',
    type: 'daily',
    target: 1,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'swsh10', setName: 'Astral Radiance', count: 1, language: 'en' },
      { setId: 'sv2d', setName: 'Clay Burst', count: 1, language: 'ja' }
    ],
    actionType: 'grade_psa'
  },
  {
    id: 'daily_buy_vendor',
    title: 'Floor Shopper',
    description: 'Buy 1 card directly from a convention floor vendor.',
    type: 'daily',
    target: 1,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv04', setName: 'Paradox Rift', count: 1, language: 'en' },
      { setId: 'sv2p', setName: 'Snow Hazard', count: 1, language: 'ja' }
    ],
    actionType: 'buy_vendor'
  },
  {
    id: 'daily_jp_collection',
    title: 'Eastern Binder',
    description: 'Add 3 cards to your personal Binder collections.',
    type: 'daily',
    target: 3,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv2a', setName: 'Pokémon Card 151', count: 2, language: 'ja' }
    ],
    actionType: 'collect_card'
  },
  {
    id: 'daily_cash_stash',
    title: 'Convention Stipend',
    description: 'Inspect 3 different cards to earn a daily cash stipend.',
    type: 'daily',
    target: 3,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv05', setName: 'Temporal Forces', count: 1, language: 'en' }
    ],
    rewardCash: 25,
    actionType: 'inspect_card'
  },

  // --- WEEKLY MISSIONS (8) ---
  {
    id: 'weekly_open_packs',
    title: 'Booster Marathon',
    description: 'Open 15 Booster Packs across your convention journey.',
    type: 'weekly',
    target: 15,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv03', setName: 'Obsidian Flames', count: 3, language: 'en' },
      { setId: 'sv2d', setName: 'Clay Burst', count: 2, language: 'ja' },
      { setId: 'sv2p', setName: 'Snow Hazard', count: 2, language: 'ja' }
    ],
    rewardCard: getRandomRewardCard('Weekly Champion Award'),
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
    rewardCard: getRandomRewardCard('Convention Master Award'),
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
      { setId: 'sv04', setName: 'Paradox Rift', count: 3, language: 'en' },
      { setId: 'sv4a', setName: 'Shiny Treasure ex', count: 2, language: 'ja' }
    ],
    rewardCard: getRandomRewardCard('Dealmaker Trophy'),
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
  {
    id: 'weekly_collector',
    title: 'Vault Builder',
    description: 'Add 15 cards to your personal Binder collections.',
    type: 'weekly',
    target: 15,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv06', setName: 'Twilight Masquerade', count: 3, language: 'en' },
      { setId: 'sv3a', setName: 'Raging Surf', count: 2, language: 'ja' }
    ],
    actionType: 'collect_card'
  },
  {
    id: 'weekly_negotiator',
    title: 'Smooth Talker',
    description: 'Chat or negotiate price with convention booth vendors 5 times.',
    type: 'weekly',
    target: 5,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv07', setName: 'Stellar Crown', count: 2, language: 'en' },
      { setId: 'sv5a', setName: 'Crimson Haze', count: 2, language: 'ja' }
    ],
    actionType: 'vendor_chat'
  },
  {
    id: 'weekly_pristine',
    title: 'Pristine Seeker',
    description: 'Score 1 pristine PSA 10 / Gem Mint grade in the grading lab.',
    type: 'weekly',
    target: 1,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'swsh8', setName: 'Fusion Strike', count: 2, language: 'en' },
      { setId: 'sv4k', setName: 'Wild Force', count: 1, language: 'ja' }
    ],
    rewardCard: getRandomRewardCard('Pristine Seeker Award'),
    actionType: 'grade_psa_10'
  },
  {
    id: 'weekly_jp_marathon',
    title: 'Eastern Marathon',
    description: 'Open 8 Japanese Booster Packs during your convention run.',
    type: 'weekly',
    target: 8,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sv4m', setName: 'Cyber Judge', count: 3, language: 'ja' },
      { setId: 'sv5k', setName: 'Raging Wave', count: 2, language: 'ja' }
    ],
    rewardCash: 40,
    actionType: 'open_pack'
  },

  // --- MONTHLY MISSIONS (8) ---
  {
    id: 'monthly_open_packs',
    title: 'Legendary Pack Master',
    description: 'Open 50 Booster Packs to unlock the monthly dragon reward.',
    type: 'monthly',
    target: 50,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'swsh7', setName: 'Evolving Skies', count: 5, language: 'en' },
      { setId: 'sv8', setName: 'Super Electric Breaker', count: 5, language: 'ja' },
      { setId: 'sv08', setName: 'Surging Sparks', count: 5, language: 'en' }
    ],
    rewardCard: getRandomRewardCard('Monthly Dragon Lord Award'),
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
      { setId: 'swsh4', setName: 'Vivid Voltage', count: 5, language: 'en' },
      { setId: 'sv6', setName: 'Transformation Mask', count: 5, language: 'ja' }
    ],
    rewardCard: getRandomRewardCard('Pristine Grader Award'),
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
      { setId: 'sv05', setName: 'Temporal Forces', count: 5, language: 'en' },
      { setId: 'sv7', setName: 'Stellar Miracle', count: 5, language: 'ja' },
      { setId: 'sv09', setName: 'Journey Together', count: 5, language: 'en' }
    ],
    rewardCard: getRandomRewardCard('Master Collector Trophy'),
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
      { setId: 'swsh12.5', setName: 'Crown Zenith', count: 3, language: 'en' }
    ],
    actionType: 'vendor_chat'
  },
  {
    id: 'monthly_swsh_connoisseur',
    title: 'Sword & Shield Connoisseur',
    description: 'Open 40 Booster Packs from the Sword & Shield era.',
    type: 'monthly',
    target: 40,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'swsh3', setName: 'Darkness Ablaze', count: 5, language: 'en' },
      { setId: 'sv6a', setName: 'Night Wanderer', count: 3, language: 'ja' },
      { setId: 'swsh9', setName: 'Brilliant Stars', count: 5, language: 'en' }
    ],
    actionType: 'open_pack'
  },
  {
    id: 'monthly_classic_digger',
    title: 'Classic Digger',
    description: 'Open 30 Booster Packs from older classic expansions.',
    type: 'monthly',
    target: 30,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'xy1', setName: 'XY', count: 3, language: 'en' },
      { setId: 'xy7', setName: 'Ancient Origins', count: 3, language: 'en' },
      { setId: 'sv5m', setName: 'Cyber Crisis', count: 2, language: 'ja' }
    ],
    actionType: 'open_pack'
  },
  {
    id: 'monthly_grading_grinder',
    title: 'Grading Grinder',
    description: 'Submit 10 cards to the PSA Grading Lab for assessment.',
    type: 'monthly',
    target: 10,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'sm1', setName: 'Sun & Moon', count: 4, language: 'en' },
      { setId: 'sv9', setName: 'Battle Partners', count: 4, language: 'ja' }
    ],
    rewardCard: getRandomRewardCard('Grinding Champion Award'),
    actionType: 'grade_psa'
  },
  {
    id: 'monthly_legend_inspector',
    title: 'Legendary Inspector',
    description: 'Inspect 50 different cards using the 3D Market Inspector or Art Studio.',
    type: 'monthly',
    target: 50,
    progress: 0,
    claimed: false,
    rewardSetPacks: [
      { setId: 'base1', setName: 'Base Set', count: 2, language: 'en' },
      { setId: 'sv10', setName: "Rocket's Glory", count: 2, language: 'ja' }
    ],
    rewardCash: 100,
    actionType: 'inspect_card'
  }
];

// --- Daily Reset Logic ---
function checkDailyReset() {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  const lastReset = localStorage.getItem(lsKey(LAST_RESET_KEY));
  if (lastReset !== today) {
    localStorage.setItem(lsKey(LAST_RESET_KEY), today);
    // Give 5 English and 5 Japanese free packs daily
    localStorage.setItem(lsKey(DAILY_ENGLISH_FREE_KEY), '5');
    localStorage.setItem(lsKey(DAILY_JAPANESE_FREE_KEY), '5');
    // Give $80 daily cash allowance
    localStorage.setItem(lsKey(DAILY_CASH_KEY), '80');

    // Reset daily missions progress
    const missions = getMissions();
    const updated = missions.map(m => m.type === 'daily' ? { ...m, progress: 0, claimed: false } : m);
    localStorage.setItem(lsKey(MISSIONS_STATE_KEY), JSON.stringify(updated));
    // Mirror the reset to the account's Firestore document.
    persistMissions();
  }
}

// --- Get Daily Free Packs ---
export function getDailyFreePacks(): { english: number; japanese: number } {
  if (typeof window === 'undefined') return { english: 5, japanese: 5 };
  checkDailyReset();
  const english = parseInt(localStorage.getItem(lsKey(DAILY_ENGLISH_FREE_KEY)) || '5', 10);
  const japanese = parseInt(localStorage.getItem(lsKey(DAILY_JAPANESE_FREE_KEY)) || '5', 10);
  return {
    english: isNaN(english) ? 5 : english,
    japanese: isNaN(japanese) ? 5 : japanese
  };
}

// --- Get Daily Cash ---
export function getDailyCash(): number {
  if (typeof window === 'undefined') return 80;
  checkDailyReset();
  const cash = parseFloat(localStorage.getItem(lsKey(DAILY_CASH_KEY)) || '80');
  return isNaN(cash) ? 80 : cash;
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
      localStorage.setItem(lsKey(DAILY_CASH_KEY), nextDailyCash.toString());
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

  persistMissions();
  return [true, deductFromNetReturn];
}

// --- Add Daily Cash (mission cash rewards) ---
export function addDailyCash(amount: number) {
  if (typeof window === 'undefined') return;
  const current = getDailyCash();
  const next = Number((current + amount).toFixed(2));
  localStorage.setItem(lsKey(DAILY_CASH_KEY), next.toString());
  persistMissions();
  window.dispatchEvent(new CustomEvent('daily_cash_updated', { detail: next }));
}

// --- Use Daily Free Pack ---
export function useDailyFreePack(language: 'en' | 'ja'): boolean {
  if (typeof window === 'undefined') return true;
  const key = language === 'en' ? DAILY_ENGLISH_FREE_KEY : DAILY_JAPANESE_FREE_KEY;
  const current = parseInt(localStorage.getItem(lsKey(key)) || '0', 10);
  if (current <= 0) return false;
  const next = current - 1;
  localStorage.setItem(lsKey(key), String(next));
  persistMissions();
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
  const saved = localStorage.getItem(lsKey(EARNED_SET_PACKS_KEY));
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
  localStorage.setItem(lsKey(EARNED_SET_PACKS_KEY), JSON.stringify(updated));
  persistMissions();
  window.dispatchEvent(new CustomEvent('earned_packs_updated', { detail: updated }));
}

export function useEarnedSetPack(setId: string, language: 'en' | 'ja'): boolean {
  if (typeof window === 'undefined') return true;
  const current = getEarnedSetPacks();
  const packIndex = current.findIndex(p => p.setId === setId && p.language === language && p.count > 0);
  if (packIndex === -1) return false;
  current[packIndex].count -= 1;
  const updated = current.filter(p => p.count > 0);
  localStorage.setItem(lsKey(EARNED_SET_PACKS_KEY), JSON.stringify(updated));
  persistMissions();
  window.dispatchEvent(new CustomEvent('earned_packs_updated', { detail: updated }));
  return true;
}

// --- Missions ---
export function getMissions(): Mission[] {
  if (typeof window === 'undefined') return INITIAL_MISSIONS;
  checkDailyReset();
  const saved = localStorage.getItem(lsKey(MISSIONS_STATE_KEY));
  if (!saved) {
    localStorage.setItem(lsKey(MISSIONS_STATE_KEY), JSON.stringify(INITIAL_MISSIONS));
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
    localStorage.setItem(lsKey(MISSIONS_STATE_KEY), JSON.stringify(updated));
    persistMissions();
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

  // 1b. Add cash reward if included
  if (mission.rewardCash) {
    addDailyCash(mission.rewardCash);
  }

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
  localStorage.setItem(lsKey(MISSIONS_STATE_KEY), JSON.stringify(missions));
  persistMissions();
  window.dispatchEvent(new CustomEvent('missions_updated', { detail: { missions } }));

  return {
    success: true,
    rewardSetPacks: mission.rewardSetPacks,
    rewardCard: mission.rewardCard
  };
}

// --- Firestore sync payload ---
// Returns the current mission state so it can be mirrored into the user's
// Firestore document (bound to their account).
export interface MissionsSyncPayload {
  lastPassReset?: string;
  dailyEnglishFree?: number;
  dailyJapaneseFree?: number;
  dailyCash?: number;
  state?: Mission[];
  earnedSetPacks?: EarnedSetPack[];
}

export function collectMissionsForSync(): MissionsSyncPayload {
  if (typeof window === 'undefined') return {};
  const lastPassReset = localStorage.getItem(lsKey(LAST_RESET_KEY));
  const dailyEnglishFree = localStorage.getItem(lsKey(DAILY_ENGLISH_FREE_KEY));
  const dailyJapaneseFree = localStorage.getItem(lsKey(DAILY_JAPANESE_FREE_KEY));
  const dailyCash = localStorage.getItem(lsKey(DAILY_CASH_KEY));
  const stateRaw = localStorage.getItem(lsKey(MISSIONS_STATE_KEY));
  const earnedRaw = localStorage.getItem(lsKey(EARNED_SET_PACKS_KEY));

  return {
    lastPassReset: lastPassReset ?? undefined,
    dailyEnglishFree: dailyEnglishFree !== null ? Number(dailyEnglishFree) : undefined,
    dailyJapaneseFree: dailyJapaneseFree !== null ? Number(dailyJapaneseFree) : undefined,
    dailyCash: dailyCash !== null ? Number(dailyCash) : undefined,
    state: stateRaw ? (JSON.parse(stateRaw) as Mission[]) : undefined,
    earnedSetPacks: earnedRaw ? (JSON.parse(earnedRaw) as EarnedSetPack[]) : undefined
  };
}

// Writes Firestore mission state back into the per-account local cache and
// notifies subscribers. Used by listenToFirestore on every snapshot. Only
// writes/dispatching when the remote value actually differs, so routine
// snapshots (e.g. from a binder save) don't trigger spurious re-renders.
export function restoreMissionsFromSync(data: MissionsSyncPayload | undefined): boolean {
  if (typeof window === 'undefined' || !data) return false;
  let changed = false;

  const writeIfDifferent = (key: string, value: string | null) => {
    const current = localStorage.getItem(lsKey(key));
    if (current !== value) {
      if (value === null) localStorage.removeItem(lsKey(key));
      else localStorage.setItem(lsKey(key), value);
      changed = true;
    }
  };

  writeIfDifferent(LAST_RESET_KEY, data.lastPassReset !== undefined ? data.lastPassReset : null);
  writeIfDifferent(DAILY_ENGLISH_FREE_KEY, data.dailyEnglishFree !== undefined ? String(data.dailyEnglishFree) : null);
  writeIfDifferent(DAILY_JAPANESE_FREE_KEY, data.dailyJapaneseFree !== undefined ? String(data.dailyJapaneseFree) : null);
  writeIfDifferent(DAILY_CASH_KEY, data.dailyCash !== undefined ? String(data.dailyCash) : null);
  writeIfDifferent(MISSIONS_STATE_KEY, data.state ? JSON.stringify(data.state) : null);
  writeIfDifferent(EARNED_SET_PACKS_KEY, data.earnedSetPacks ? JSON.stringify(data.earnedSetPacks) : null);

  if (changed) {
    window.dispatchEvent(new CustomEvent('missions_updated', { detail: {} }));
    window.dispatchEvent(new CustomEvent('daily_cash_updated', { detail: getDailyCash() }));
    window.dispatchEvent(new CustomEvent('daily_packs_updated', { detail: getDailyFreePacks() }));
    window.dispatchEvent(new CustomEvent('earned_packs_updated', { detail: getEarnedSetPacks() }));
  }
  return changed;
}

// Migrates guest (un-namespaced) mission data into the signed-in account and
// returns the payload to persist. Returns null when there is nothing to migrate.
export function buildMissionsPayloadFromGuest(): MissionsSyncPayload | null {
  if (typeof window === 'undefined') return null;
  const lastPassReset = localStorage.getItem(LAST_RESET_KEY);
  const dailyEnglishFree = localStorage.getItem(DAILY_ENGLISH_FREE_KEY);
  const dailyJapaneseFree = localStorage.getItem(DAILY_JAPANESE_FREE_KEY);
  const dailyCash = localStorage.getItem(DAILY_CASH_KEY);
  const stateRaw = localStorage.getItem(MISSIONS_STATE_KEY);
  const earnedRaw = localStorage.getItem(EARNED_SET_PACKS_KEY);

  if (!lastPassReset && !dailyEnglishFree && !dailyJapaneseFree && !dailyCash && !stateRaw && !earnedRaw) {
    return null;
  }

  const payload: MissionsSyncPayload = {};
  if (lastPassReset !== null) payload.lastPassReset = lastPassReset;
  if (dailyEnglishFree !== null) payload.dailyEnglishFree = Number(dailyEnglishFree);
  if (dailyJapaneseFree !== null) payload.dailyJapaneseFree = Number(dailyJapaneseFree);
  if (dailyCash !== null) payload.dailyCash = Number(dailyCash);
  if (stateRaw) payload.state = JSON.parse(stateRaw) as Mission[];
  if (earnedRaw) payload.earnedSetPacks = JSON.parse(earnedRaw) as EarnedSetPack[];

  // Consume the guest keys so they are never re-migrated into a different account.
  [LAST_RESET_KEY, DAILY_ENGLISH_FREE_KEY, DAILY_JAPANESE_FREE_KEY, DAILY_CASH_KEY, MISSIONS_STATE_KEY, EARNED_SET_PACKS_KEY]
    .forEach(k => localStorage.removeItem(k));

  return payload;
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
