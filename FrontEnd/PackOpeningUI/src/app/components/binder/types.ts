import { auth, db } from '../../services/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { trackMissionProgress } from '../../services/missions';

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
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      cards,
      binders,
      catalogues,
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

          // If Firebase has data, use it
          if (firebaseData) {
            const fbStr = JSON.stringify(firebaseData);
            if (currentUidStr !== fbStr) {
              localStorage.setItem(uidKey, fbStr);
              changed = true;
            }
          }
          // If Firebase is empty, but guest has data, migrate guest data!
          else if (guestDataStr && guestDataStr !== '[]' && guestDataStr !== '{}') {
            localStorage.setItem(uidKey, guestDataStr);
            changed = true;
            needsSync = true;
          }
        };

        mergeGuestData('tcg_my_collection', data?.cards);
        mergeGuestData('tcg_binders', data?.binders);
        mergeGuestData('tcg_catalogues', data?.catalogues);

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
  priceChange: number;
  priceHistory: PricePoint[];
  holofoil: boolean;
  imageUrl: string;
  favorite: boolean;
  binderId?: string;
  isSlabbed?: boolean;
  slabGrade?: string;
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
}

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
    if (cleaned.length !== parsed.length) {
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

export function saveCollectedCard(cardData: any, setName: string, binderId: string = 'my-collection'): Card {
  const cards = getCollectedCards();
  const basePrice = cardData.value || 0.50;
  const trend = (Math.random() - 0.45) * 2;
  const points: PricePoint[] = [];
  let price = basePrice * (1 - trend * 0.3);
  for (let i = 0; i < 30; i++) {
    price += (Math.random() - 0.42) * basePrice * 0.06 + trend * basePrice * 0.01;
    points.push({ day: i + 1, price: Math.max(0.01, +price.toFixed(2)) });
  }

  const typesList = ['Fire', 'Water', 'Grass', 'Psychic', 'Lightning', 'Fighting', 'Dragon', 'Colorless'];
  let type = 'Colorless';
  if (cardData.pokemon?.types && cardData.pokemon.types.length > 0) {
    type = cardData.pokemon.types[0];
  } else {
    for (const t of typesList) {
      if (cardData.pokemon?.name?.includes(t)) type = t;
    }
  }

  const setNumber = cardData.pokemon?.localId || cardData.pokemon?.id?.split('-')[1] || '001';

  const newCard: Card = {
    id: `${cardData.pokemon?.id || 'card'}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: cardData.pokemon?.name || 'Pokemon Card',
    setName: setName || 'Unknown Set',
    setNumber: setNumber,
    rarity: cardData.pokemon?.rarity || 'Common',
    type: type,
    currentPrice: basePrice,
    priceChange: Number((trend * 5 + (Math.random() * 4 - 2)).toFixed(1)),
    priceHistory: points,
    holofoil: cardData.pokemon?.isReverseHolo || (cardData.pokemon?.rarity && cardData.pokemon.rarity.toLowerCase().includes('rare')) || false,
    imageUrl: cardData.pokemon?.images?.large || cardData.pokemon?.images?.small || '',
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
