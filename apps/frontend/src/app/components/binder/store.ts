/**
 * @file store.ts
 * @description Centralized data persistence layer for the Pokémon TCG Vault.
 * Manages LocalStorage caching, Firebase Firestore sync for authenticated users,
 * card collections, custom binder management, cash balance tracking, and bulk set catalogues.
 */

import { auth, db } from '../../services/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { trackMissionProgress, collectMissionsForSync, restoreMissionsFromSync, buildMissionsPayloadFromGuest } from '../../services/missions';
import { resolveVendorCardRealPrice } from '../../services/scrydex';
import promoCardsData from '../../data/promo_cards.json';
import type { BulkCard, CatalogueStore, Card, Binder, SetOption, GenerationOption, UserProfile, PricePoint } from './types';
import { MASTER_SET_GENERATIONS, SAMPLE_CARDS, SAMPLE_BINDERS } from './constants';
import { formatRarityTag, genPriceHistory } from './utils';

const PROMO_CARDS_POOL = promoCardsData as any[];

/**
 * Returns a namespaced LocalStorage key scoped to the logged-in user ID.
 * 
 * @param base - The base storage key (e.g. 'tcg_my_collection').
 * @param forceUid - Optional explicit user ID override.
 */
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
    const uid = auth.currentUser.uid;
    const sessionTotal = parseFloat(localStorage.getItem(getStorageKey('tcg_session_total', uid)) || '0') || 0;
    const packCount = parseInt(localStorage.getItem(getStorageKey('tcg_session_pack_count', uid)) || '0', 10) || 0;
    const sessionSpent = parseFloat(localStorage.getItem(getStorageKey('tcg_session_spent', uid)) || '0') || 0;

    await setDoc(doc(db, 'users', uid), {
      cards,
      binders,
      catalogues,
      cash,
      netTotal: sessionTotal,
      netSpent: sessionSpent,
      stats: {
        sessionTotal,
        packCount,
        sessionSpent,
        lastUpdated: new Date().toISOString()
      },
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

      // Repair generic hardcoded $0.50 price with real live market price!
      if (!c.currentPrice || c.currentPrice <= 0.50) {
        const resolved = resolveVendorCardRealPrice(c);
        if (resolved && resolved > 0.50) {
          c.currentPrice = Number(resolved.toFixed(2));
          repaired = true;
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
export const ADMIN_CASH_AMOUNT = 999999999;

export function isAdminUser(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem('is_admin_mode') === 'true') return true;
  const email = auth?.currentUser?.email?.toLowerCase();
  return email === 'admin@gmail.com';
}

export function getCash(): number {
  if (isAdminUser()) {
    return ADMIN_CASH_AMOUNT;
  }
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
  if (isAdminUser()) {
    return ADMIN_CASH_AMOUNT;
  }
  const next = Math.max(0, getCash() - Math.max(0, amount));
  try {
    localStorage.setItem(getStorageKey('tcg_cash'), JSON.stringify(next));
  } catch { }
  return next;
}

export function addCash(amount: number): number {
  if (isAdminUser()) {
    return ADMIN_CASH_AMOUNT;
  }
  const next = getCash() + Math.max(0, amount);
  try {
    localStorage.setItem(getStorageKey('tcg_cash'), JSON.stringify(next));
  } catch { }
  return next;
}

// ── Player profile (showcase + bio + avatar, shared via link/text) ───────────────────


export function getProfile(forceUid?: string | null): UserProfile {
  const fallback: UserProfile = {
    displayName: auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || 'Trainer',
    bio: '',
    avatarUrl: auth?.currentUser?.photoURL || '',
    showcaseCardIds: [],
  };
  try {
    const data = localStorage.getItem(getStorageKey('tcg_profile'));
    if (!data) return fallback;
    const parsed = JSON.parse(data);
    return {
      displayName: parsed.displayName || fallback.displayName,
      bio: parsed.bio || '',
      avatarUrl: parsed.avatarUrl || fallback.avatarUrl || auth?.currentUser?.photoURL || '',
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

export function getPackCount(forceUid?: string | null): number {
  try {
    const saved = localStorage.getItem(getStorageKey('tcg_session_pack_count', forceUid));
    return saved !== null ? parseInt(saved, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function getTrainerTitle(packsOpened: number): string {
  if (packsOpened >= 500) return "Legendary Collector";
  if (packsOpened >= 250) return "Vault Master";
  if (packsOpened >= 100) return "Master Collector";
  if (packsOpened >= 50) return "Elite Collector";
  if (packsOpened >= 20) return "Seasoned Collector";
  if (packsOpened >= 5) return "Pack Ripper";
  return "Rookie Trainer";
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
    realMarketPrice = resolveVendorCardRealPrice(poke || cardData);
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

export function saveCollectedCardsBatch(cardsData: any[], setName: string, binderId: string = 'my-collection'): Card[] {
  if (!cardsData || cardsData.length === 0) return [];
  const cards = getCollectedCards();
  const newCards: Card[] = [];

  const typesList = ['Fire', 'Water', 'Grass', 'Psychic', 'Lightning', 'Fighting', 'Dragon', 'Colorless'];

  for (const cardData of cardsData) {
    const poke = cardData.pokemon || cardData;
    const acquiredCost = cardData.acquiredPrice ?? cardData.buyPrice ?? cardData.purchasePrice ?? cardData.originalValue;

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

    newCards.unshift(newCard);
  }

  cards.unshift(...newCards);
  try {
    localStorage.setItem(getStorageKey('tcg_my_collection'), JSON.stringify(cards));
    getBinders();
    syncToFirestore();
    trackMissionProgress('collect_card', cardsData.length);
  } catch (e) {
    console.error('Failed to batch save cards to binder', e);
  }
  return newCards;
}

export function saveCardsToCatalogueBatch(cardsData: any[], setName: string): void {
  if (!cardsData || cardsData.length === 0) return;
  const catalogues = getCatalogues();
  const set = setName || 'Unknown Set';
  if (!catalogues[set]) catalogues[set] = {};

  for (const cardData of cardsData) {
    const poke = cardData.pokemon || cardData;
    const cardId = poke?.id || `bulk-${poke?.name}`;
    const existing = catalogues[set][cardId];

    catalogues[set][cardId] = {
      id: cardId,
      name: poke?.name || 'Pokemon Card',
      rarity: poke?.rarity || 'Common',
      imageUrl: poke?.images?.large || poke?.images?.small || cardData.imageUrl || '',
      setName: set,
      count: (existing?.count || 0) + 1,
    };
  }

  try {
    localStorage.setItem(getStorageKey('tcg_catalogues'), JSON.stringify(catalogues));
    syncToFirestore();
  } catch (e) {
    console.error('Failed to save cards batch to catalogue', e);
  }
}

