import { TCGDexCardSummary, TCGDexSet, PokemonCard, TCGDexCardFull } from './tcgdex';

export const getScrydexApiBase = () => `https://api.scrydex.com/pokemon/v1/ja`;

// We'll cache the hardcoded sv2a set details
const scrydexSetCache = new Map<string, TCGDexSet>();
export const scrydexCardFullCache = new Map<string, TCGDexCardFull>();
export const onScrydexCardFullCacheUpdated = new Set<() => void>();

export async function fetchSingleJapaneseSet(): Promise<TCGDexSet> {
  const setId = 'sv2a_ja';
  
  if (scrydexSetCache.has(setId)) {
    return scrydexSetCache.get(setId)!;
  }

  // Hardcode sv2a_ja (Pokemon 151) since we do not have an API key for Scrydex.
  // The user instructed that we do not have the API key, and the API returns 401 Unauthorized.
  // We will build the 210 cards of sv2a manually to pull images from Scrydex CDN using the correct ID format.
  
  const totalCards = 210;
  const cards: TCGDexCardSummary[] = [];
  
  for (let i = 1; i <= totalCards; i++) {
    const cardNum = i.toString();
    cards.push({
      id: `sv2a_ja-${cardNum}`,
      localId: cardNum,
      name: `Pokémon 151 Card ${cardNum}`,
      image: `https://images.scrydex.com/pokemon/sv2a_ja-${cardNum}/large`,
      // Distribute some mock rarities so our pack generation logic functions properly
      rarity: i > 165 ? (i > 200 ? 'UR' : i > 195 ? 'SAR' : i > 185 ? 'SR' : 'AR') : (i % 5 === 0 ? 'RR' : i % 3 === 0 ? 'R' : i % 2 === 0 ? 'U' : 'C')
    });
  }

  const tcgDexSet: TCGDexSet = {
    id: setId,
    name: 'Pokémon Card 151 (Japanese)',
    logo: 'https://images.scrydex.com/pokemon/sv2a_ja-logo/logo',
    symbol: 'https://images.scrydex.com/pokemon/sv2a_ja-symbol/symbol',
    cardCount: {
      total: 210,
      official: 165,
    },
    cards
  };

  scrydexSetCache.set(setId, tcgDexSet);
  return tcgDexSet;
}

export async function fetchJapaneseCardFull(cardId: string, skipEvent: boolean = false): Promise<TCGDexCardFull> {
  if (scrydexCardFullCache.has(cardId)) {
    return scrydexCardFullCache.get(cardId)!;
  }
  
  const mappedCard: TCGDexCardFull = {
    id: cardId,
    localId: cardId.split('-')[1] || '1',
    name: `Pokémon 151 Card ${cardId.split('-')[1]}`,
    image: `https://images.scrydex.com/pokemon/${cardId}/large`,
    rarity: 'Common',
  };
  
  scrydexCardFullCache.set(cardId, mappedCard);
  
  if (!skipEvent) {
    onScrydexCardFullCacheUpdated.forEach(fn => fn());
  }
  
  return mappedCard;
}

// Generate an authentic-style Japanese pack (often 5 or 7 cards, we will do 5 for sv2a/151 for testing)
export async function generateJapanesePackFromSet(set: TCGDexSet): Promise<PokemonCard[]> {
  const pool = (set.cards || []).filter(c => Boolean(c.image));
  if (pool.length === 0) throw new Error('No cards in Japanese set');

  const commons: TCGDexCardSummary[] = [];
  const uncommons: TCGDexCardSummary[] = [];
  const rares: TCGDexCardSummary[] = [];
  const doubleRares: TCGDexCardSummary[] = []; // RR
  const artRares: TCGDexCardSummary[] = []; // AR
  const superRares: TCGDexCardSummary[] = []; // SR (Full Art)
  const specialArtRares: TCGDexCardSummary[] = []; // SAR (SIR)
  const ultraRares: TCGDexCardSummary[] = []; // UR (Gold)

  for (const card of pool) {
    const r = (card.rarity || '').toLowerCase();
    
    // Japanese sv2a uses specific rarities: C, U, R, RR, AR, SR, SAR, UR
    if (r === 'c' || r === 'common') commons.push(card);
    else if (r === 'u' || r === 'uncommon') uncommons.push(card);
    else if (r === 'r' || r === 'rare') rares.push(card);
    else if (r === 'rr' || r === 'double rare') doubleRares.push(card);
    else if (r === 'ar' || r === 'illustration rare') artRares.push(card);
    else if (r === 'sr' || r === 'ultra rare') superRares.push(card);
    else if (r === 'sar' || r === 'special illustration rare') specialArtRares.push(card);
    else if (r === 'ur' || r === 'hyper rare') ultraRares.push(card);
    else commons.push(card); // fallback
  }

  // Fallback pools just in case the API returned empty for a rarity
  if (commons.length === 0) commons.push(...pool);
  if (uncommons.length === 0) uncommons.push(...pool);
  if (rares.length === 0) rares.push(...pool);

  const getFrom = (p: TCGDexCardSummary[]) => p[Math.floor(Math.random() * p.length)] || pool[0];

  const pack: { summary: TCGDexCardSummary; isReverseHolo?: boolean; defaultRarity: string }[] = [];

  // Authentic Japanese SV packs usually have 5 cards.
  // Slot 1: Common
  // Slot 2: Common
  // Slot 3: Common or Uncommon
  // Slot 4: Uncommon
  // Slot 5: Rare or better (or Reverse Holo in standard Japanese sets, 151 has Pokeball/Masterball reverses)

  pack.push({ summary: getFrom(commons), defaultRarity: 'Common' });
  pack.push({ summary: getFrom(commons), defaultRarity: 'Common' });
  
  if (Math.random() < 0.5) {
    pack.push({ summary: getFrom(commons), defaultRarity: 'Common' });
  } else {
    pack.push({ summary: getFrom(uncommons), defaultRarity: 'Uncommon' });
  }
  
  pack.push({ summary: getFrom(uncommons), defaultRarity: 'Uncommon' });

  // Hit slot
  const hitRoll = Math.random();
  let hit: TCGDexCardSummary;
  let label = 'Rare';

  if (hitRoll < 0.01 && ultraRares.length > 0) {
    hit = getFrom(ultraRares);
    label = 'UR';
  } else if (hitRoll < 0.03 && specialArtRares.length > 0) {
    hit = getFrom(specialArtRares);
    label = 'SAR';
  } else if (hitRoll < 0.06 && superRares.length > 0) {
    hit = getFrom(superRares);
    label = 'SR';
  } else if (hitRoll < 0.15 && artRares.length > 0) {
    hit = getFrom(artRares);
    label = 'AR';
  } else if (hitRoll < 0.35 && doubleRares.length > 0) {
    hit = getFrom(doubleRares);
    label = 'RR';
  } else {
    // Standard R or Reverse Holo equivalent
    hit = getFrom(rares);
    label = 'R';
  }

  pack.push({ summary: hit, defaultRarity: label });

  return pack.map((p, idx) => ({
    id: p.summary.id + '-' + idx, // unique key for rendering
    localId: p.summary.localId,
    name: p.summary.name,
    rarity: p.defaultRarity,
    isReverseHolo: p.isReverseHolo,
    image: p.summary.image,
    images: {
      small: p.summary.image,
      large: p.summary.image
    }
  }));
}
