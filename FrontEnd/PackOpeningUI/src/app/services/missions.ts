import { PokemonCard } from './tcgdex';
import { saveCollectedCard } from '../components/binder/types';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number;
  progress: number;
  claimed: boolean;
  rewardPacks: number;
  rewardCard?: any;
  actionType: 'open_pack' | 'vendor_chat' | 'inspect_card' | 'grade_psa' | 'grade_psa_10' | 'buy_vendor' | 'collect_card';
}

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
    rewardPacks: 3,
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
    rewardPacks: 2,
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
    rewardPacks: 2,
    actionType: 'inspect_card'
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
    rewardPacks: 10,
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
    rewardPacks: 5,
    rewardCard: PROMO_CARDS.charizard_v_special,
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
    rewardPacks: 8,
    rewardCard: PROMO_CARDS.pikachu_illustrator,
    actionType: 'buy_vendor'
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
    rewardPacks: 30,
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
    rewardPacks: 20,
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
    rewardPacks: 40,
    rewardCard: PROMO_CARDS.mewtwo_gold_secret,
    actionType: 'collect_card'
  }
];

const PACK_PASSES_KEY = 'tcg_pack_passes';
const LAST_RESET_KEY = 'tcg_last_pass_reset';
const MISSIONS_STATE_KEY = 'tcg_user_missions';

/**
 * Checks and resets daily pack passes if it's a new calendar day
 */
function checkDailyReset() {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  const lastReset = localStorage.getItem(LAST_RESET_KEY);
  if (lastReset !== today) {
    localStorage.setItem(LAST_RESET_KEY, today);
    // Give 10 fresh daily passes at the start of a new day!
    const currentPasses = getPackPasses(true);
    localStorage.setItem(PACK_PASSES_KEY, String(Math.max(10, currentPasses + 5)));
    
    // Also reset daily missions progress
    const missions = getMissions();
    const updated = missions.map(m => m.type === 'daily' ? { ...m, progress: 0, claimed: false } : m);
    localStorage.setItem(MISSIONS_STATE_KEY, JSON.stringify(updated));
  }
}

/**
 * Get current pack passes available to open
 */
export function getPackPasses(skipResetCheck = false): number {
  if (typeof window === 'undefined') return 10;
  if (!skipResetCheck) {
    checkDailyReset();
  }
  const val = localStorage.getItem(PACK_PASSES_KEY);
  if (val === null) {
    localStorage.setItem(PACK_PASSES_KEY, '10');
    return 10;
  }
  const num = parseInt(val, 10);
  return isNaN(num) ? 10 : num;
}

/**
 * Add booster pack passes (e.g. from mission rewards)
 */
export function addPackPasses(count: number): number {
  if (typeof window === 'undefined') return 10;
  const current = getPackPasses();
  const next = Math.max(0, current + count);
  localStorage.setItem(PACK_PASSES_KEY, String(next));
  window.dispatchEvent(new CustomEvent('pack_passes_updated', { detail: { passes: next } }));
  return next;
}

/**
 * Consume 1 or more pack passes when opening booster packs.
 * Returns true if consumed, false if 0 remaining passes.
 */
export function usePackPass(count = 1): boolean {
  if (typeof window === 'undefined') return true;
  const current = getPackPasses();
  if (current < count) return false;
  const next = current - count;
  localStorage.setItem(PACK_PASSES_KEY, String(next));
  window.dispatchEvent(new CustomEvent('pack_passes_updated', { detail: { passes: next } }));
  return true;
}

/**
 * Get all current missions with saved progress
 */
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
    // Ensure any new missions in schema exist
    const parsedMap = new Map(parsed.map(m => [m.id, m]));
    return INITIAL_MISSIONS.map(init => {
      const existing = parsedMap.get(init.id);
      return existing ? { ...init, progress: existing.progress, claimed: existing.claimed } : init;
    });
  } catch {
    return INITIAL_MISSIONS;
  }
}

/**
 * Track user action across missions and increment progress
 */
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

/**
 * Claim reward for a completed mission
 */
export function claimMissionReward(missionId: string): { success: boolean; rewardPacks: number; rewardCard?: PokemonCard & { promoTitle?: string } } {
  if (typeof window === 'undefined') return { success: false, rewardPacks: 0 };
  const missions = getMissions();
  const targetIndex = missions.findIndex(m => m.id === missionId);
  if (targetIndex === -1) return { success: false, rewardPacks: 0 };

  const mission = missions[targetIndex];
  if (mission.progress < mission.target || mission.claimed) {
    return { success: false, rewardPacks: 0 };
  }

  // 1. Add reward packs
  addPackPasses(mission.rewardPacks);

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

  return { success: true, rewardPacks: mission.rewardPacks, rewardCard: mission.rewardCard };
}
