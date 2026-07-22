import { auth, db } from '../../services/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { trackMissionProgress, collectMissionsForSync, restoreMissionsFromSync, buildMissionsPayloadFromGuest } from '../../services/missions';
import promoCardsData from '../../data/promo_cards.json';

const PROMO_CARDS_POOL = promoCardsData as any[];

export interface BulkCard {
  id: string;
  name: string;
  rarity: string;
  imageUrl: string;
  setName: string;
  count: number;
}

// Catalogues: { [setName]: { [cardId]: BulkCard } }
export type CatalogueStore = Record<string, Record<string, BulkCard>>;

export function getStorageKey(base: string, forceUid?: string | null): string {
  const uid = forceUid || auth?.currentUser?.uid;
  if (uid) {
    return `${base}_${uid}`;
  }
  return base;
}

export function getCatalogues(): CatalogueStore {
  try {
    const data = localStorage.getItem(getStorageKey('tcg_catalogues'));
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveCardToCatalogue(cardData: any, setName: string): void {
  const catalogues = getCatalogues();
  const set = setName || 'Unknown Set';
  if (!catalogues[set]) catalogues[set] = {};

  const cardId = cardData.pokemon?.id || `bulk-${cardData.pokemon?.name}`;
  const existing = catalogues[set][cardId];

  catalogues[set][cardId] = {
    id: cardId,
    name: cardData.pokemon?.name || 'Pokemon Card',
    rarity: cardData.pokemon?.rarity || 'Common',
    imageUrl: cardData.pokemon?.images?.large || cardData.pokemon?.images?.small || '',
    setName: set,
    count: (existing?.count || 0) + 1,
  };

  try {
    localStorage.setItem(getStorageKey('tcg_catalogues'), JSON.stringify(catalogues));
    syncToFirestore();
  } catch (e) {
    console.error('Failed to save card to catalogue', e);
  }
}

export async function syncToFirestore() {
  if (!auth?.currentUser) return;
  try {
    const cards = getCollectedCards();
    const binders = getBinders();
    const catalogues = getCatalogues();
    const cash = getCash();
    const netTotal = parseFloat(localStorage.getItem(getStorageKey('tcg_session_total')) || '0') || 0;
    const netSpent = parseFloat(localStorage.getItem(getStorageKey('tcg_session_spent')) || '0') || 0;
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      cards,
      binders,
      catalogues,
      cash,
      netTotal,
      netSpent,
      missions: collectMissionsForSync(),
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.error('Sync to Firestore failed', e);
  }
}

export function clearCatalogues(): void {
  try {
    localStorage.removeItem(getStorageKey('tcg_catalogues'));
    syncToFirestore();
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to clear catalogues', e);
  }
}


let unsubscribeFirestore: (() => void) | null = null;

export function listenToFirestore(uid: string | null) {
  if (unsubscribeFirestore) {
    unsubscribeFirestore();
    unsubscribeFirestore = null;
  }

  if (!uid) return;

  try {
    unsubscribeFirestore = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let changed = false;
        let needsSync = false;

        const mergeGuestData = (baseKey: string, firebaseData: any) => {
          const guestDataStr = localStorage.getItem(baseKey);
          const uidKey = getStorageKey(baseKey, uid);
          const currentUidStr = localStorage.getItem(uidKey);

          // If Firebase has data, use it (per-account, isolated by uid)
          if (firebaseData) {
            const fbStr = JSON.stringify(firebaseData);
            if (currentUidStr !== fbStr) {
              localStorage.setItem(uidKey, fbStr);
              changed = true;
            }
          }
          // If Firebase is empty but guest/local cache has data, migrate it ONCE
          // into THIS account, then CONSUME the guest key so it is never
          // re-migrated into a *different* account later (blank-slate guarantee).
          else if (guestDataStr && guestDataStr !== '[]' && guestDataStr !== '{}') {
            localStorage.setItem(uidKey, guestDataStr);
            localStorage.removeItem(baseKey);
            changed = true;
            needsSync = true;
          }
        };

        mergeGuestData('tcg_my_collection', data?.cards);
        mergeGuestData('tcg_binders', data?.binders);
        mergeGuestData('tcg_catalogues', data?.catalogues);
        mergeGuestData('tcg_cash', data?.cash);
        mergeGuestData('tcg_session_total', data?.netTotal);
        mergeGuestData('tcg_session_spent', data?.netSpent);

        // Missions, tasks & rewards are bound to the account (mirrored in the
        // `missions` sub-object of the user document).
        if (data?.missions) {
          if (restoreMissionsFromSync(data.missions)) {
            changed = true;
          }
        } else {
          // Firestore empty but guest/local cache has mission data: migrate it
          // ONCE into THIS account, then re-sync so it is persisted per-account.
          const guestMissions = buildMissionsPayloadFromGuest();
          if (guestMissions) {
            restoreMissionsFromSync(guestMissions);
            changed = true;
            needsSync = true;
          }
        }

        if (changed) {
          window.dispatchEvent(new Event('storage'));
        }

        if (needsSync) {
          syncToFirestore();
        }
      }
    });
  } catch (e) {
    console.error('Listen to Firestore failed', e);
  }
}

export interface PricePoint {
  day: number;
  price: number;
}

export interface Card {
  id: string;
  name: string;
  setName: string;
  setNumber: string;
  rarity: string;
  type: string;
  currentPrice: number;
  originalValue?: number;
  acquiredPrice?: number;
  priceChange: number;
  priceHistory: PricePoint[];
  holofoil: boolean;
  imageUrl: string;
  favorite: boolean;
  binderId?: string;
  isSlabbed?: boolean;
  slabGrade?: string;
  isRestored?: boolean;
  prepScore?: number;
  psaDetails?: {
    gradeNum: number;
    certNumber: string;
    gradedDate: string;
    subgrades: {
      centering: number;
      surface: number;
      corners: number;
      edges: number;
    };
    originalValue: number;
    multiplier: number;
  };
}

export interface Binder {
  id: string;
  name: string;
  count: number;
  value: number;
  isCustom?: boolean;
  isMasterSet?: boolean;
  masterSetId?: string;
  masterSetName?: string;
  totalCardsInSet?: number;
  generation?: string;
}

export interface SetOption {
  id: string;
  name: string;
  totalCards: number;
}

export interface GenerationOption {
  name: string;
  sets: SetOption[];
}

export const MASTER_SET_GENERATIONS: GenerationOption[] = [
  {
    name: "Scarlet & Violet Series",
    sets: [
      { id: "sv3pt5", name: "151", totalCards: 207 },
      { id: "sv1", name: "Scarlet & Violet Base", totalCards: 258 },
      { id: "sv2", name: "Paldea Evolved", totalCards: 279 },
      { id: "sv3", name: "Obsidian Flames", totalCards: 230 },
      { id: "sv4", name: "Paradox Rift", totalCards: 266 },
      { id: "sv45", name: "Paldean Fates", totalCards: 245 },
      { id: "sv5", name: "Temporal Forces", totalCards: 218 },
      { id: "sv6", name: "Twilight Masquerade", totalCards: 226 },
      { id: "sv65", name: "Shrouded Fable", totalCards: 99 },
      { id: "sv7", name: "Stellar Crown", totalCards: 175 },
      { id: "sv8", name: "Surging Sparks", totalCards: 252 },
      { id: "sv85", name: "Prismatic Evolutions", totalCards: 175 },
    ]
  },
  {
    name: "Sword & Shield Series",
    sets: [
      { id: "swsh7", name: "Evolving Skies", totalCards: 237 },
      { id: "swsh1", name: "Sword & Shield Base", totalCards: 216 },
      { id: "swsh2", name: "Rebel Clash", totalCards: 209 },
      { id: "swsh3", name: "Darkness Ablaze", totalCards: 201 },
      { id: "swsh4", name: "Vivid Voltage", totalCards: 203 },
      { id: "swsh45", name: "Shining Fates", totalCards: 195 },
      { id: "swsh5", name: "Battle Styles", totalCards: 183 },
      { id: "swsh6", name: "Chilling Reign", totalCards: 233 },
      { id: "swsh8", name: "Fusion Strike", totalCards: 284 },
      { id: "swsh9", name: "Brilliant Stars", totalCards: 216 },
      { id: "swsh10", name: "Astral Radiance", totalCards: 246 },
      { id: "swsh11", name: "Lost Origin", totalCards: 247 },
      { id: "swsh12", name: "Silver Tempest", totalCards: 245 },
      { id: "swsh125", name: "Crown Zenith", totalCards: 230 },
    ]
  },
  {
    name: "Sun & Moon Series",
    sets: [
      { id: "sm1", name: "Sun & Moon Base", totalCards: 163 },
      { id: "sm2", name: "Guardians Rising", totalCards: 169 },
      { id: "sm3", name: "Burning Shadows", totalCards: 169 },
      { id: "sm4", name: "Crimson Invasion", totalCards: 124 },
      { id: "sm5", name: "Ultra Prism", totalCards: 178 },
      { id: "sm6", name: "Forbidden Light", totalCards: 146 },
      { id: "sm7", name: "Celestial Storm", totalCards: 183 },
      { id: "sm8", name: "Lost Thunder", totalCards: 236 },
      { id: "sm9", name: "Team Up", totalCards: 198 },
      { id: "sm10", name: "Unbroken Bonds", totalCards: 234 },
      { id: "sm11", name: "Unified Minds", totalCards: 258 },
      { id: "sm12", name: "Cosmic Eclipse", totalCards: 271 },
    ]
  },
  {
    name: "XY Series",
    sets: [
      { id: "xy11", name: "Evolutions", totalCards: 113 },
      { id: "xy1", name: "XY Base Set", totalCards: 146 },
      { id: "xy2", name: "Flashfire", totalCards: 109 },
      { id: "xy3", name: "Furious Fists", totalCards: 113 },
      { id: "xy4", name: "Phantom Forces", totalCards: 122 },
      { id: "xy5", name: "Roaring Skies", totalCards: 110 },
      { id: "xy6", name: "Ancient Origins", totalCards: 100 },
      { id: "xy7", name: "BREAKthrough", totalCards: 164 },
      { id: "xy8", name: "BREAKpoint", totalCards: 123 },
      { id: "xy9", name: "Fates Collide", totalCards: 125 },
      { id: "xy10", name: "Steam Siege", totalCards: 116 },
    ]
  },
  {
    name: "Black & White Series",
    sets: [
      { id: "bw1", name: "Black & White Base", totalCards: 115 },
      { id: "bw2", name: "Emerging Powers", totalCards: 98 },
      { id: "bw3", name: "Noble Victories", totalCards: 102 },
      { id: "bw4", name: "Next Destinies", totalCards: 103 },
      { id: "bw5", name: "Dark Explorers", totalCards: 111 },
      { id: "bw6", name: "Dragons Exalted", totalCards: 128 },
      { id: "bw7", name: "Boundaries Crossed", totalCards: 153 },
      { id: "bw8", name: "Plasma Storm", totalCards: 138 },
      { id: "bw9", name: "Plasma Freeze", totalCards: 122 },
      { id: "bw10", name: "Plasma Blast", totalCards: 105 },
      { id: "bw11", name: "Legendary Treasures", totalCards: 140 },
    ]
  },
  {
    name: "HeartGold & SoulSilver Series",
    sets: [
      { id: "hgss1", name: "HeartGold & SoulSilver Base", totalCards: 124 },
      { id: "hgss2", name: "Unleashed", totalCards: 96 },
      { id: "hgss3", name: "Undaunted", totalCards: 91 },
      { id: "hgss4", name: "Triumphant", totalCards: 103 },
    ]
  },
  {
    name: "Platinum Series",
    sets: [
      { id: "pl1", name: "Platinum Base", totalCards: 133 },
      { id: "pl2", name: "Rising Rivals", totalCards: 120 },
      { id: "pl3", name: "Supreme Victors", totalCards: 153 },
      { id: "pl4", name: "Arceus", totalCards: 111 },
    ]
  },
  {
    name: "Diamond & Pearl Series",
    sets: [
      { id: "dp1", name: "Diamond & Pearl Base", totalCards: 130 },
      { id: "dp2", name: "Mysterious Treasures", totalCards: 124 },
      { id: "dp3", name: "Secret Wonders", totalCards: 132 },
      { id: "dp4", name: "Great Encounters", totalCards: 106 },
      { id: "dp5", name: "Majestic Dawn", totalCards: 100 },
      { id: "dp6", name: "Legends Awakened", totalCards: 146 },
      { id: "dp7", name: "Stormfront", totalCards: 106 },
    ]
  },
  {
    name: "EX Series",
    sets: [
      { id: "ex1", name: "EX Ruby & Sapphire", totalCards: 109 },
      { id: "ex2", name: "EX Sandstorm", totalCards: 100 },
      { id: "ex3", name: "EX Dragon", totalCards: 100 },
      { id: "ex5", name: "EX Hidden Legends", totalCards: 102 },
      { id: "ex6", name: "EX FireRed & LeafGreen", totalCards: 116 },
      { id: "ex7", name: "EX Team Rocket Returns", totalCards: 111 },
      { id: "ex8", name: "EX Deoxys", totalCards: 108 },
      { id: "ex14", name: "EX Crystal Guardians", totalCards: 100 },
      { id: "ex15", name: "EX Dragon Frontiers", totalCards: 101 },
      { id: "ex16", name: "EX Power Keepers", totalCards: 108 },
    ]
  },
  {
    name: "Wizards of the Coast (Base Gen)",
    sets: [
      { id: "base1", name: "Base Set", totalCards: 102 },
      { id: "ju", name: "Jungle", totalCards: 64 },
      { id: "fo", name: "Fossil", totalCards: 62 },
      { id: "base4", name: "Base Set 2", totalCards: 130 },
      { id: "tr", name: "Team Rocket", totalCards: 83 },
    ]
  }
];


export function genPriceHistory(base: number, trend: number): PricePoint[] {
  const points: PricePoint[] = [];
  let price = base * (1 - trend * 0.3);
  for (let i = 0; i < 30; i++) {
    price += (Math.random() - 0.42) * base * 0.06 + trend * base * 0.01;
    points.push({ day: i + 1, price: Math.max(0.05, +price.toFixed(2)) });
  }
  return points;
}

export const SAMPLE_CARDS: (Card | null)[] = [];

export const SAMPLE_BINDERS: Binder[] = [
  { id: "my-collection", name: "My Collection (Opened)", count: 0, value: 0, isCustom: false },
];

export function getCollectedCards(): Card[] {
  try {
    const data = localStorage.getItem(getStorageKey('tcg_my_collection'));
    if (!data) return [];
    const parsed: Card[] = JSON.parse(data);
    const cleaned = parsed.filter(c =>
      !c.id.startsWith('sample-') &&
      !c.id.startsWith('ref-psa-') &&
      !c.name.includes('Demo Guaranteed') &&
      !c.setName.includes('Gem Mint 10 Test') &&
      !c.setName.includes('Mint 9 Test') &&
      !c.setName.includes('Near Mint-Mint 8 Test') &&
      !c.setName.includes('Near Mint 7 Test') &&
      !c.setName.includes('Official PSA') &&
      c.binderId !== 'psa-demo-vault'
    );

    let repaired = false;
    for (const c of cleaned) {
      if (!c.imageUrl || c.imageUrl.trim() === '') {
        const promo = PROMO_CARDS_POOL.find(p => p.id === c.setNumber || (c.id && c.id.includes(p.id)) || (p.name && c.name && p.name.toLowerCase() === c.name.toLowerCase()));
        if (promo?.images?.large || promo?.images?.small) {
          c.imageUrl = promo.images.large || promo.images.small;
          repaired = true;
        } else {
          const parts = c.id.split('-');
          if (parts.length >= 2) {
            const series = parts[0].replace(/[0-9]+$/, '');
            c.imageUrl = `https://assets.tcgdex.net/en/${series}/${parts[0]}/${parts[1]}/high.webp`;
            repaired = true;
          }
        }
      }
    }

    if (repaired || cleaned.length !== parsed.length) {
      localStorage.setItem(getStorageKey('tcg_my_collection'), JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function clearCollectedCards(): void {
  try {
    localStorage.removeItem(getStorageKey('tcg_my_collection'));
  } catch { }
}

export function removeCollectedCard(cardId: string): void {
  try {
    const cards = getCollectedCards();
    const updated = cards.filter(c => c.id !== cardId);
    localStorage.setItem(getStorageKey('tcg_my_collection'), JSON.stringify(updated));
    getBinders();
    syncToFirestore();
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to remove collected card', e);
  }
}

// ── Shared cash register (used by vendor marketplace + auctions) ──────────────
const DEFAULT_CASH = 128450;

export function getCash(): number {
  try {
    const data = localStorage.getItem(getStorageKey('tcg_cash'));
    if (data == null) {
      localStorage.setItem(getStorageKey('tcg_cash'), JSON.stringify(DEFAULT_CASH));
      return DEFAULT_CASH;
    }
    const n = Number(data);
    return isFinite(n) ? n : DEFAULT_CASH;
  } catch {
    return DEFAULT_CASH;
  }
}

export function spendCash(amount: number): number {
  const next = Math.max(0, getCash() - Math.max(0, amount));
  try {
    localStorage.setItem(getStorageKey('tcg_cash'), JSON.stringify(next));
  } catch { }
  return next;
}

export function addCash(amount: number): number {
  const next = getCash() + Math.max(0, amount);
  try {
    localStorage.setItem(getStorageKey('tcg_cash'), JSON.stringify(next));
  } catch { }
  return next;
}

// ── Player profile (showcase + bio, shared via link/text) ───────────────────
export interface UserProfile {
  displayName: string;
  bio: string;
  showcaseCardIds: string[];
  updatedAt?: string;
}

export function getProfile(forceUid?: string | null): UserProfile {
  const fallback: UserProfile = {
    displayName: auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || 'Trainer',
    bio: '',
    showcaseCardIds: [],
  };
  try {
    const data = localStorage.getItem(getStorageKey('tcg_profile'));
    if (!data) return fallback;
    const parsed = JSON.parse(data);
    return {
      displayName: parsed.displayName || fallback.displayName,
      bio: parsed.bio || '',
      showcaseCardIds: Array.isArray(parsed.showcaseCardIds) ? parsed.showcaseCardIds : [],
    };
  } catch {
    return fallback;
  }
}

export async function saveProfile(profile: UserProfile, forceUid?: string | null): Promise<void> {
  const uid = forceUid || auth?.currentUser?.uid;
  const payload = { ...profile, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(getStorageKey('tcg_profile'), JSON.stringify(payload));
  } catch { }
  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid), { profile: payload }, { merge: true });
    } catch (e) {
      console.error('Failed to save profile to Firestore', e);
    }
  }
  try {
    window.dispatchEvent(new Event('storage'));
  } catch { }
}

// ── Net returns (real earning power used by the auction wallet) ──────────────
// Net return = value of pulled cards minus money spent on packs. This is what
// the user has *actually* earned, so the auction uses it instead of an absurd
// default play-money balance. Floored at 0 (you can't bid on credit).
// These keys are namespaced per-account (see getStorageKey) so a user's
// earnings NEVER carry over to a different account.
export function getNetReturn(): number {
  try {
    const total = parseFloat(localStorage.getItem(getStorageKey('tcg_session_total')) || '0');
    const spent = parseFloat(localStorage.getItem(getStorageKey('tcg_session_spent')) || '0');
    const net = (isFinite(total) ? total : 0) - (isFinite(spent) ? spent : 0);
    return Math.max(0, +net.toFixed(2));
  } catch {
    return 0;
  }
}

// Pay for an auction win by reducing the user's net return (raise sessionSpent).
// Both keys are namespaced per-account so earnings never leak across accounts.
export function spendFromNetReturn(amount: number): void {
  try {
    const spent = parseFloat(localStorage.getItem(getStorageKey('tcg_session_spent')) || '0') || 0;
    const next = Math.max(0, spent + Math.max(0, amount));
    localStorage.setItem(getStorageKey('tcg_session_spent'), next.toString());
    syncToFirestore();
    window.dispatchEvent(new Event('storage'));
  } catch { }
}

export function saveCollectedCard(cardData: any, setName: string, binderId: string = 'my-collection'): Card {
  const cards = getCollectedCards();
  const poke = cardData.pokemon || cardData;
  const acquiredCost = cardData.acquiredPrice ?? cardData.buyPrice ?? cardData.purchasePrice ?? cardData.originalValue;

  // Prioritize real market price fields over purchase cost
  let realMarketPrice = 0;
  if (typeof cardData.marketPrice === 'number' && cardData.marketPrice > 0) {
    realMarketPrice = cardData.marketPrice;
  } else if (typeof poke.marketPrice === 'number' && poke.marketPrice > 0) {
    realMarketPrice = poke.marketPrice;
  } else if (typeof cardData.realMarketPrice === 'number' && cardData.realMarketPrice > 0) {
    realMarketPrice = cardData.realMarketPrice;
  } else if (typeof cardData.value === 'number' && cardData.value > 0 && cardData.value !== acquiredCost) {
    realMarketPrice = cardData.value;
  } else if (typeof poke.value === 'number' && poke.value > 0 && poke.value !== acquiredCost) {
    realMarketPrice = poke.value;
  } else if (typeof cardData.value === 'number' && cardData.value > 0) {
    realMarketPrice = cardData.value;
  } else if (typeof poke.value === 'number' && poke.value > 0) {
    realMarketPrice = poke.value;
  } else if (typeof cardData.currentPrice === 'number' && cardData.currentPrice > 0 && cardData.currentPrice !== acquiredCost) {
    realMarketPrice = cardData.currentPrice;
  } else if (typeof cardData.currentPrice === 'number' && cardData.currentPrice > 0) {
    realMarketPrice = cardData.currentPrice;
  } else {
    realMarketPrice = 0.50;
  }

  const basePrice = Number(realMarketPrice.toFixed(2));
  const trend = (Math.random() - 0.45) * 2;
  const points: PricePoint[] = [];
  let price = basePrice * (1 - trend * 0.3);
  for (let i = 0; i < 30; i++) {
    price += (Math.random() - 0.42) * basePrice * 0.06 + trend * basePrice * 0.01;
    points.push({ day: i + 1, price: Math.max(0.01, +price.toFixed(2)) });
  }

  const typesList = ['Fire', 'Water', 'Grass', 'Psychic', 'Lightning', 'Fighting', 'Dragon', 'Colorless'];
  let type = 'Colorless';
  if (poke.types && poke.types.length > 0) {
    type = poke.types[0];
  } else {
    for (const t of typesList) {
      if (poke.name && String(poke.name).includes(t)) type = t;
    }
  }

  const cardIdStr = String(poke.id || cardData.id || 'card');
  const setNumber = poke.localId || poke.setNumber || (cardIdStr.includes('-') ? cardIdStr.split('-')[1] : '001');
  const imageUrl = cardData.imageUrl || poke.imageUrl || poke.images?.large || poke.images?.small || cardData.img || '';

  const newCard: Card = {
    id: `${cardIdStr}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: poke.name || cardData.name || 'Pokemon Card',
    setName: setName || 'Unknown Set',
    setNumber: setNumber,
    rarity: poke.rarity || cardData.rarity || 'Common',
    type: type,
    currentPrice: basePrice,
    originalValue: acquiredCost !== undefined ? acquiredCost : basePrice,
    priceChange: Number((trend * 5 + (Math.random() * 4 - 2)).toFixed(1)),
    priceHistory: points,
    holofoil: poke.isReverseHolo || (poke.rarity && String(poke.rarity).toLowerCase().includes('rare')) || false,
    imageUrl: imageUrl,
    favorite: false,
    binderId: binderId || 'my-collection'
  };

  cards.unshift(newCard);
  try {
    localStorage.setItem(getStorageKey('tcg_my_collection'), JSON.stringify(cards));
    getBinders();
    syncToFirestore();
    trackMissionProgress('collect_card', 1);
  } catch (e) {
    console.error('Failed to save card to binder', e);
  }
  return newCard;
}

export function moveCardToBinder(cardId: string, newBinderId: string): void {
  const cards = getCollectedCards();
  let updated = false;
  for (const card of cards) {
    if (card.id === cardId) {
      card.binderId = newBinderId;
      updated = true;
      break;
    }
  }
  if (updated) {
    try {
      localStorage.setItem(getStorageKey('tcg_my_collection'), JSON.stringify(cards));
      getBinders(); // Recalculate binder counts
      syncToFirestore();
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to move card to binder', e);
    }
  }
}

export function getBinders(): Binder[] {
  try {
    const data = localStorage.getItem(getStorageKey('tcg_binders'));
    const collected = getCollectedCards();

    const calculateForBinder = (b: Binder): Binder => {
      const binderCards = collected.filter(c => {
        if (b.id === 'my-collection') {
          return !c.binderId || c.binderId === 'my-collection';
        }
        return c.binderId === b.id;
      });
      const count = binderCards.length;
      const value = Number(binderCards.reduce((sum, c) => sum + (c.currentPrice || 0), 0).toFixed(2));
      return { ...b, count, value };
    };

    if (!data) {
      const initial = SAMPLE_BINDERS.map(calculateForBinder);
      localStorage.setItem(getStorageKey('tcg_binders'), JSON.stringify(initial));
      return initial;
    }
    const binders: Binder[] = JSON.parse(data);
    if (!binders.some(b => b.id === 'my-collection')) {
      binders.unshift(SAMPLE_BINDERS[0]);
    }
    const allBinders = binders.map(calculateForBinder);
    localStorage.setItem(getStorageKey('tcg_binders'), JSON.stringify(allBinders));
    return allBinders;
  } catch {
    return SAMPLE_BINDERS;
  }
}

export function saveBinders(binders: Binder[]): void {
  try {
    localStorage.setItem(getStorageKey('tcg_binders'), JSON.stringify(binders));
    syncToFirestore();
  } catch (e) {
    console.error('Failed to save binders', e);
  }
}

export function updateCardSlabStatus(cardId: string, grade: string = 'N/A'): void {
  try {
    const cards = getCollectedCards();
    const updated = cards.map(c => {
      if (c.id === cardId) {
        return { ...c, isSlabbed: true, slabGrade: grade };
      }
      return c;
    });
    localStorage.setItem(getStorageKey('tcg_my_collection'), JSON.stringify(updated));
    getBinders();
    syncToFirestore();
  } catch (e) {
    console.error('Failed to update slab status', e);
  }
}

export function savePSAGradingResult(
  cardId: string,
  gradeNum: number,
  certNumber: string,
  subgrades: { centering: number; surface: number; corners: number; edges: number },
  multiplier: number
): Card | null {
  try {
    const gradeTitle = gradeNum === 10 ? 'PSA 10 Gem Mint' : gradeNum === 9 ? 'PSA 9 Mint' : gradeNum === 8 ? 'PSA 8 Near Mint-Mint' : `PSA ${gradeNum} Authentic`;
    if (cardId.startsWith('sample-') || cardId.startsWith('ref-psa-')) {
      return {
        id: cardId,
        name: 'Demo Card',
        setName: 'PSA Lab Test',
        setNumber: '001',
        rarity: 'Rare',
        type: 'Colorless',
        currentPrice: Number((100 * multiplier).toFixed(2)),
        priceChange: 0,
        priceHistory: [],
        holofoil: true,
        imageUrl: '',
        favorite: false,
        binderId: 'psa-demo-vault',
        isSlabbed: true,
        slabGrade: gradeTitle,
        psaDetails: {
          gradeNum,
          certNumber,
          gradedDate: new Date().toLocaleDateString(),
          subgrades,
          originalValue: 100,
          multiplier
        }
      };
    }

    const cards = getCollectedCards();
    let gradedCard: Card | null = null;
    const updated = cards.map(c => {
      if (c.id === cardId) {
        const originalVal = c.psaDetails?.originalValue || c.currentPrice;
        const newPrice = Number((originalVal * multiplier).toFixed(2));
        const updatedCard: Card = {
          ...c,
          isSlabbed: true,
          slabGrade: gradeTitle,
          currentPrice: newPrice,
          psaDetails: {
            gradeNum,
            certNumber,
            gradedDate: new Date().toLocaleDateString(),
            subgrades,
            originalValue: originalVal,
            multiplier
          }
        };
        gradedCard = updatedCard;
        return updatedCard;
      }
      return c;
    });
    localStorage.setItem(getStorageKey('tcg_my_collection'), JSON.stringify(updated));
    getBinders();
    syncToFirestore();
    return gradedCard;
  } catch (e) {
    console.error('Failed to save PSA grading result', e);
    return null;
  }
}


export function moveBulkCardToBinder(bulkCard: BulkCard, binderId: string): void {
  try {
    const catalogues = getCatalogues();
    if (!catalogues[bulkCard.setName] || !catalogues[bulkCard.setName][bulkCard.id]) return;
    
    // Decrement count
    catalogues[bulkCard.setName][bulkCard.id].count--;
    if (catalogues[bulkCard.setName][bulkCard.id].count <= 0) {
      delete catalogues[bulkCard.setName][bulkCard.id];
    }
    
    // Save updated catalogues
    localStorage.setItem(getStorageKey('tcg_catalogues'), JSON.stringify(catalogues));
    
    // Convert to Card and add to collection
    const newCardId = `vault-${bulkCard.id}-${Date.now()}`;
    const newCard: Card = {
      id: newCardId,
      name: bulkCard.name,
      setName: bulkCard.setName,
      setNumber: bulkCard.id, // approximate
      rarity: bulkCard.rarity,
      type: 'Unknown',
      currentPrice: 0.00,
      priceChange: 0,
      priceHistory: genPriceHistory(0.00, 0),
      holofoil: false,
      imageUrl: bulkCard.imageUrl,
      favorite: false,
      binderId: binderId
    };
    
    const cards = getCollectedCards();
    cards.push(newCard);
    localStorage.setItem(getStorageKey('tcg_my_collection'), JSON.stringify(cards));
    
    getBinders(); // refresh counts
    syncToFirestore();
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to move bulk card to binder', e);
  }
}
