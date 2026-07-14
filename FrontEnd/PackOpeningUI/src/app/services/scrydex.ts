import { TCGDexCardSummary, TCGDexSet, PokemonCard, TCGDexCardFull, TCGDexSeries, TCGDexSetSummary } from './tcgdex';

export const getScrydexApiBase = () => `https://api.scrydex.com/pokemon/v1/ja`;

const scrydexSetCache = new Map<string, TCGDexSet>();
export const scrydexCardFullCache = new Map<string, TCGDexCardFull>();
export const onScrydexCardFullCacheUpdated = new Set<() => void>();

const SCRYDEX_API_BASE = 'https://api.scrydex.com/pokemon/v1';

let jaSetsCache: Array<{ id: string; name: string; cardCount: { total: number; official: number } }> | null = null;
let jaEnNamesCache: Record<string, string> | null = null;

async function loadJapaneseMetadata() {
  if (!jaSetsCache) {
    try {
      const res = await fetch('/ja-sets.json');
      if (res.ok) jaSetsCache = await res.json();
    } catch (e) {
      console.error('Failed to load /ja-sets.json:', e);
    }
  }
  if (!jaEnNamesCache) {
    try {
      const res = await fetch('/ja-en-names.json');
      if (res.ok) jaEnNamesCache = await res.json();
    } catch (e) {
      console.error('Failed to load /ja-en-names.json:', e);
    }
  }
  if (!jaSetsCache) jaSetsCache = [];
  if (!jaEnNamesCache) jaEnNamesCache = {};
}

export function getJapaneseSetDefaultLogo(setId: string): string {
  const rawId = setId.replace(/_ja$/i, '').toUpperCase();
  if (rawId === 'SV2A') return '/setLogos/sv2a_ja.png';
  if (rawId.startsWith('SV') || rawId.startsWith('SVK')) {
    return `https://images.scrydex.com/pokemon/${rawId.toLowerCase()}_ja-logo/logo`;
  }
  if (rawId.startsWith('SM') || rawId.startsWith('SMP')) {
    return `https://images.scrydex.com/pokemon/${rawId.toLowerCase()}_ja-logo/logo`;
  }
  if ((rawId.startsWith('S') && !rawId.startsWith('SV') && !rawId.startsWith('SM') && !rawId.startsWith('SVK')) || rawId.startsWith('SN')) {
    if (rawId === 'S8B') return 'https://images.scrydex.com/pokemon/swsh8b_ja-logo/logo';
    if (rawId === 'S12A') return 'https://images.scrydex.com/pokemon/swsh12a_ja-logo/logo';
    const numMatch = rawId.match(/^S(?:N)?(\d+)/i);
    let num = numMatch ? parseInt(numMatch[1], 10) : 2;
    if (num === 1 || num === 5 || num === 6 || num === 7 || isNaN(num)) num = 2;
    if (num > 12) num = 12;
    return `https://images.scrydex.com/pokemon/swsh${num}_ja-logo/logo`;
  }
  if (rawId.startsWith('XY') || rawId.startsWith('CP') || rawId.startsWith('M')) {
    const numMatch = rawId.match(/^XY(\d+)/i);
    let num = numMatch ? parseInt(numMatch[1], 10) : 2;
    if (num === 1 || num === 5 || num === 12 || isNaN(num)) num = 2;
    if (num > 11) num = 11;
    return `https://images.scrydex.com/pokemon/xy${num}_ja-logo/logo`;
  }
  if (rawId.startsWith('BW') || rawId.startsWith('CS') || rawId.startsWith('CSA')) {
    const numMatch = rawId.match(/^BW(\d+)/i);
    let num = numMatch ? parseInt(numMatch[1], 10) : 1;
    if (num > 9 || isNaN(num)) num = 2;
    return `https://images.scrydex.com/pokemon/bw${num}_ja-logo/logo`;
  }
  return 'https://images.scrydex.com/pokemon/base1_ja-logo/logo';
}

export function getJapaneseSetDefaultSymbol(setId: string): string {
  const rawId = setId.replace(/_ja$/i, '').toUpperCase();
  if (rawId === 'SV2A') return '/setLogos/sv2a_ja.png';
  if (rawId.startsWith('SV') || rawId.startsWith('SVK')) {
    return `https://images.scrydex.com/pokemon/${rawId.toLowerCase()}_ja-symbol/symbol`;
  }
  if (rawId.startsWith('SM') || rawId.startsWith('SMP')) {
    return `https://images.scrydex.com/pokemon/${rawId.toLowerCase()}_ja-symbol/symbol`;
  }
  if ((rawId.startsWith('S') && !rawId.startsWith('SV') && !rawId.startsWith('SM') && !rawId.startsWith('SVK')) || rawId.startsWith('SN')) {
    if (rawId === 'S8B') return 'https://images.scrydex.com/pokemon/swsh8b_ja-symbol/symbol';
    if (rawId === 'S12A') return 'https://images.scrydex.com/pokemon/swsh12a_ja-symbol/symbol';
    const numMatch = rawId.match(/^S(?:N)?(\d+)/i);
    let num = numMatch ? parseInt(numMatch[1], 10) : 2;
    if (num === 1 || num === 5 || num === 6 || num === 7 || isNaN(num)) num = 2;
    if (num > 12) num = 12;
    return `https://images.scrydex.com/pokemon/swsh${num}_ja-symbol/symbol`;
  }
  if (rawId.startsWith('XY') || rawId.startsWith('CP') || rawId.startsWith('M')) {
    const numMatch = rawId.match(/^XY(\d+)/i);
    let num = numMatch ? parseInt(numMatch[1], 10) : 2;
    if (num === 1 || num === 5 || num === 12 || isNaN(num)) num = 2;
    if (num > 11) num = 11;
    return `https://images.scrydex.com/pokemon/xy${num}_ja-symbol/symbol`;
  }
  if (rawId.startsWith('BW') || rawId.startsWith('CS') || rawId.startsWith('CSA')) {
    const numMatch = rawId.match(/^BW(\d+)/i);
    let num = numMatch ? parseInt(numMatch[1], 10) : 1;
    if (num > 9 || isNaN(num)) num = 2;
    return `https://images.scrydex.com/pokemon/bw${num}_ja-symbol/symbol`;
  }
  return 'https://images.scrydex.com/pokemon/base1_ja-symbol/symbol';
}

export async function fetchJapaneseSeriesDetails(seriesId: string): Promise<TCGDexSeries> {
  await loadJapaneseMetadata();
  const allSets = jaSetsCache || [];
  const nameMap = jaEnNamesCache || {};

  const filteredSets = allSets.filter(s => {
    const id = s.id;
    if (seriesId === 'sv_ja') {
      return id.startsWith('SV') || id.startsWith('SVK') || id.startsWith('SVLS') || id.startsWith('SVLN');
    }
    if (seriesId === 'swsh_ja') {
      return (id.startsWith('S') && !id.startsWith('SV') && !id.startsWith('SM') && !id.startsWith('SVK')) || id.startsWith('sn');
    }
    if (seriesId === 'sm_ja') {
      return id.startsWith('SM') || id.startsWith('SMP');
    }
    if (seriesId === 'xy_ja') {
      return id.startsWith('XY') || id.startsWith('CP') || id.startsWith('M');
    }
    if (seriesId === 'bw_ja') {
      return id.startsWith('BW') || id.startsWith('CS') || id.startsWith('CSA');
    }
    if (seriesId === 'classic_ja') {
      return id.startsWith('PMCG') || id.startsWith('neo') || id.startsWith('VS') || id.startsWith('web') || id.startsWith('E') || id.startsWith('ADV') || id.startsWith('PCG') || id.startsWith('DP') || id.startsWith('L') || id.startsWith('LL');
    }
    return false;
  });

  const summaries: TCGDexSetSummary[] = filteredSets.map(s => {
    const englishSub = nameMap[s.id] || s.name;
    const defaultLogo = getJapaneseSetDefaultLogo(s.id);
    const defaultSymbol = getJapaneseSetDefaultSymbol(s.id);
    return {
      id: `${s.id}_ja`,
      name: `${s.name} (${englishSub})`,
      logo: defaultLogo,
      symbol: defaultSymbol,
      cardCount: s.cardCount || { total: 100, official: 100 }
    };
  });

  let seriesName = 'Japanese Series';
  if (seriesId === 'sv_ja') seriesName = 'Scarlet & Violet';
  else if (seriesId === 'swsh_ja') seriesName = 'Sword & Shield';
  else if (seriesId === 'sm_ja') seriesName = 'Sun & Moon';
  else if (seriesId === 'xy_ja') seriesName = 'XY Series';
  else if (seriesId === 'bw_ja') seriesName = 'Black & White';
  else if (seriesId === 'classic_ja') seriesName = 'Original / Base / Classic';

  return {
    id: seriesId,
    name: seriesName,
    sets: summaries
  };
}

export async function fetchSingleJapaneseSet(setId: string = 'sv2a_ja'): Promise<TCGDexSet> {
  await loadJapaneseMetadata();
  const rawId = setId.replace(/_ja$/i, '');
  const cacheKey = `${rawId}_ja`;
  
  if (scrydexSetCache.has(cacheKey)) {
    return scrydexSetCache.get(cacheKey)!;
  }

  const s = (jaSetsCache || []).find(item => item.id.toLowerCase() === rawId.toLowerCase());
  const nameMap = jaEnNamesCache || {};
  const englishSub = nameMap[rawId] || s?.name || rawId;
  const setName = s ? `${s.name} (${englishSub})` : (rawId.toLowerCase() === 'sv2a' ? 'Pokémon Card 151 (Japanese)' : `Japanese Set ${rawId}`);
  const totalCards = s?.cardCount?.total || s?.cardCount?.official || (rawId.toLowerCase() === 'sv2a' ? 210 : 80);

  let logoUrl = getJapaneseSetDefaultLogo(rawId);
  let symbolUrl = getJapaneseSetDefaultSymbol(rawId);

  try {
    const expansionRes = await fetch(`${SCRYDEX_API_BASE}/expansions/${rawId}_ja`);
    if (expansionRes.ok) {
      const expansionData = await expansionRes.json();
      if (expansionData?.logo) logoUrl = expansionData.logo;
      if (expansionData?.symbol) symbolUrl = expansionData.symbol;
    } else {
      const res2 = await fetch(`${SCRYDEX_API_BASE}/expansions/${rawId}`);
      if (res2.ok) {
        const d2 = await res2.json();
        if (d2?.logo) logoUrl = d2.logo;
        if (d2?.symbol) symbolUrl = d2.symbol;
      }
    }
  } catch {
    // Network error or CORS – keep fallback URLs
  }

  const cards: TCGDexCardSummary[] = [];
  const prefixLow = rawId.toLowerCase();
  
  for (let i = 1; i <= totalCards; i++) {
    const cardNum = i.toString();
    cards.push({
      id: `${prefixLow}_ja-${cardNum}`,
      localId: cardNum,
      name: `${setName} Card ${cardNum}`,
      image: `https://images.scrydex.com/pokemon/${prefixLow}_ja-${cardNum}/large`,
      rarity: i > totalCards * 0.85 ? (i > totalCards * 0.95 ? 'UR' : i > totalCards * 0.92 ? 'SAR' : 'SR') : (i % 5 === 0 ? 'RR' : i % 3 === 0 ? 'R' : i % 2 === 0 ? 'U' : 'C')
    });
  }

  const tcgDexSet: TCGDexSet = {
    id: cacheKey,
    name: setName,
    logo: logoUrl,
    symbol: symbolUrl,
    cardCount: s?.cardCount || {
      total: totalCards,
      official: Math.min(totalCards, 165),
    },
    cards
  };

  scrydexSetCache.set(cacheKey, tcgDexSet);
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
