export interface TCGDexCardSummary {
  id: string;
  localId: string;
  name: string;
  image?: string;
  rarity?: string;
}

export interface TCGDexSetSummary {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: {
    total: number;
    official: number;
  };
}

export interface TCGDexSet extends TCGDexSetSummary {
  cards?: TCGDexCardSummary[];
}

export interface TCGDexSeries {
  id: string;
  name: string;
  logo?: string;
  sets?: TCGDexSetSummary[];
}

export interface TCGDexCardFull {
  id: string;
  localId: string;
  name: string;
  image?: string;
  rarity?: string;
  category?: string;
  illustrator?: string;
  hp?: number;
  types?: string[];
  stage?: string;
  prices?: any[];
  tcgplayer?: any;
  cardmarket?: any;
  pricing?: {
    cardmarket?: {
      updated?: string;
      unit?: string;
      avg?: number;
      low?: number;
      trend?: number;
      avg1?: number;
      avg7?: number;
      avg30?: number;
      'avg-holo'?: number;
      'low-holo'?: number;
      'trend-holo'?: number;
      'avg1-holo'?: number;
      'avg7-holo'?: number;
      'avg30-holo'?: number;
      [key: string]: any;
    };
    tcgplayer?: {
      updated?: string;
      unit?: string;
      normal?: Record<string, number>;
      reverse?: Record<string, number>;
      holo?: Record<string, number>;
      firstEditionHolofoil?: Record<string, number>;
      unlimitedHolofoil?: Record<string, number>;
      [key: string]: any;
    };
  };
  set?: {
    id: string;
    name: string;
    logo?: string;
    symbol?: string;
    cardCount?: {
      total: number;
      official: number;
    };
  };
}

export interface PokemonCard {
  id: string;
  localId?: string;
  name: string;
  rarity?: string;
  isReverseHolo?: boolean;
  illustrator?: string;
  images: {
    small: string;
    large: string;
  };
  prices?: any[];
  tcgplayer?: any;
  cardmarket?: any;
  pricing?: TCGDexCardFull['pricing'];
}

export const getCardImageUrl = (baseUrl?: string, quality: 'low' | 'high' = 'high'): string => {
  if (!baseUrl) return '';
  
  if (quality === 'low') {
    if (baseUrl.includes('/high.png')) return baseUrl.replace('/high.png', '/low.png');
    if (baseUrl.includes('/high.webp')) return baseUrl.replace('/high.webp', '/low.webp');
    if (baseUrl.includes('_hires.png')) return baseUrl.replace('_hires.png', '.png');
    if (baseUrl.endsWith('/high') || baseUrl.endsWith('/large')) return baseUrl.replace(/\/high$|\/large$/, '/medium');
    if (!baseUrl.endsWith('.png') && !baseUrl.endsWith('.webp') && !baseUrl.includes('scrydex.com')) {
      return baseUrl.includes('tcgdex.net') ? `${baseUrl}/low.webp` : `${baseUrl}/low.png`;
    }
    return baseUrl;
  }

  // quality === 'high'
  if (baseUrl.includes('/low.png')) return baseUrl.replace('/low.png', '/high.png');
  if (baseUrl.includes('/low.webp')) return baseUrl.replace('/low.webp', '/high.webp');
  if (baseUrl.includes('images.pokemontcg.io') && baseUrl.endsWith('.png') && !baseUrl.includes('_hires.png')) {
    return baseUrl.replace('.png', '_hires.png');
  }
  if (baseUrl.endsWith('/low') || baseUrl.endsWith('/medium')) return baseUrl.replace(/\/low$|\/medium$/, '/high');
  if (!baseUrl.endsWith('.png') && !baseUrl.endsWith('.webp') && !baseUrl.includes('scrydex.com')) {
    return baseUrl.includes('tcgdex.net') ? `${baseUrl}/high.webp` : `${baseUrl}/high.png`;
  }
  return baseUrl;
};

const API_BASE = 'https://api.tcgdex.net/v2/en';

export async function fetchSeriesList(): Promise<TCGDexSeries[]> {
  const res = await fetch(`${API_BASE}/series`);
  if (!res.ok) throw new Error('Failed to fetch series list');
  return res.json();
}

const SET_LOGO_OVERRIDES: Record<string, string> = {
  "sv05": "https://assets.tcgdex.net/en/sv/sv05/logo",
  "swsh4.5sv": "https://assets.tcgdex.net/en/swsh/swsh4.5/logo",
  "sma": "https://assets.tcgdex.net/en/sm/sm115/logo",
  "sm3.5": "https://images.pokemontcg.io/sm35/logo.png",
  "sm7.5": "https://images.pokemontcg.io/sm75/logo.png"
};

function enrichSetSummary<T extends { id: string; logo?: string }>(set: T): T {
  if (SET_LOGO_OVERRIDES[set.id]) {
    return { ...set, logo: SET_LOGO_OVERRIDES[set.id] };
  }
  return set;
}

const seriesCache = new Map<string, TCGDexSeries>();
const setDetailsCache = new Map<string, TCGDexSet>();
export const cardFullCache = new Map<string, TCGDexCardFull>();
export const onCardFullCacheUpdated = new Set<() => void>();

// Cross-browser timeout helper (since AbortSignal.timeout is not supported in Safari < 16)
const fetchWithTimeout = async (url: string, ms: number) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export async function fetchSeriesDetails(seriesId: string): Promise<TCGDexSeries> {
  const cacheKey = seriesId.toLowerCase();
  if (seriesCache.has(cacheKey)) {
    return seriesCache.get(cacheKey)!;
  }
  const res = await fetch(`${API_BASE}/series/${seriesId}`);
  if (!res.ok) throw new Error(`Failed to fetch series details for ${seriesId}`);
  const data: TCGDexSeries = await res.json();
  if (data.sets) {
    data.sets = data.sets
      .map(enrichSetSummary)
      .filter(s => {
        const nameLow = (s.name || '').toLowerCase();
        const idLow = (s.id || '').toLowerCase();
        // Remove base Shining Fates and Hidden Fates, keeping only their Shiny Vault upgraded versions
        if (idLow === 'swsh4.5' || idLow === 'swsh4pt5' || (nameLow === 'shining fates' && idLow !== 'swsh4.5sv' && idLow !== 'swsh4pt5sv')) return false;
        if (idLow === 'sm115' || idLow === 'sm11.5' || idLow === 'sm11pt5' || (nameLow === 'hidden fates' && idLow !== 'sma' && idLow !== 'sm115sv')) return false;
        if (nameLow.includes('trainer gallery') || nameLow.includes('galarian gallery')) return false;
        if (nameLow.includes('my first battle') || nameLow.includes('scarlet & violet energy') || nameLow === 'energy' || ((seriesId.includes('sv') || seriesId === 'me') && nameLow.includes('energy'))) return false;
        if (seriesId.toLowerCase().includes('sv') && (nameLow.includes('starter set') || nameLow.includes('deck build box') || nameLow.includes('starter deck') || nameLow.includes('build & battle') || idLow.startsWith('svk') || idLow.startsWith('svls') || idLow.startsWith('svln'))) return false;
        return true;
      });
  }
  seriesCache.set(cacheKey, data);
  return data;
}

export async function fetchSetDetails(setId: string): Promise<TCGDexSet> {
  const cacheKey = setId.toLowerCase();
  if (setDetailsCache.has(cacheKey)) {
    return setDetailsCache.get(cacheKey)!;
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/sets/${setId}`, 3500);
    if (!res.ok) throw new Error(`Failed to fetch set details for ${setId}`);
    const data: TCGDexSet = await res.json();
    if (!data.cards || data.cards.length < 20) throw new Error(`Incomplete set cards for ${setId}`);
    // Map over cards and assign fallback image url if not provided in sets response
    data.cards = data.cards.map(c => {
      if (!c.image) {
        c.image = getTCGDexValidAssetPath(setId, c.localId);
      }
      return c;
    });
    const enriched = enrichSetSummary(data);
    setDetailsCache.set(cacheKey, enriched);
    return enriched;
  } catch (err) {
    console.warn(`Timeout/error fetching set details for ${setId}, using local fallback:`, err);
    // Bulletproof fallback so pack opening never gets stuck on "Drawing Live Cards..."
    const fallbackSet: TCGDexSet = {
      id: setId,
      name: setId === 'swsh3' ? 'Darkness Ablaze' : setId.toUpperCase(),
      logo: `https://assets.tcgdex.net/en/${setId.toLowerCase().startsWith('me') ? 'me' : setId.toLowerCase().startsWith('sv') ? 'sv' : setId.toLowerCase().startsWith('sm') ? 'sm' : setId.toLowerCase().startsWith('xy') ? 'xy' : setId.toLowerCase().startsWith('base') ? 'base' : 'swsh'}/${setId}/logo`,
      cardCount: { total: 189, official: 189 },
      cards: Array.from({ length: 189 }, (_, i) => {
        const rawNum = `${i + 1}`;
        const localNum = (setId.toLowerCase().startsWith('me') || setId.toLowerCase().startsWith('sv')) ? rawNum.padStart(3, '0') : rawNum;
        return {
          id: `${setId}-${localNum}`,
          localId: localNum,
          name: i === 135 ? 'Charizard VMAX' : i === 19 ? 'Butterfree V' : `Pokémon Card ${i + 1}`,
          image: getTCGDexValidAssetPath(setId, localNum)
        };
      })
    };
    const enriched = enrichSetSummary(fallbackSet);
    setDetailsCache.set(cacheKey, enriched);
    return enriched;
  }
}

export function getTCGDexValidAssetPath(setId: string, rawNum: string | number): string {
  const sLow = setId.toLowerCase();
  const isJpn = sLow.endsWith('_ja') || sLow.includes('_ja_') || sLow.includes('_ja');
  const cleanSetId = sLow.replace(/_ja$/i, '').replace(/_ja_ja$/i, '');
  const langPrefix = isJpn ? 'ja' : 'en';

  let numStr = `${rawNum}`.trim();

  if (isJpn) {
    let jSeries = 'S';
    let jSet = cleanSetId.toUpperCase();
    if (cleanSetId.startsWith('sv')) {
      jSeries = 'SV';
      jSet = cleanSetId.replace(/^sv/i, 'SV');
    } else if (cleanSetId.startsWith('sm')) {
      jSeries = 'SM';
      jSet = cleanSetId.replace(/^sm/i, 'SM');
    } else if (cleanSetId.startsWith('xy')) {
      jSeries = 'XY';
      jSet = cleanSetId.replace(/^xy/i, 'XY');
    } else if (cleanSetId.startsWith('s') || cleanSetId.startsWith('swsh')) {
      jSeries = 'S';
      jSet = cleanSetId.replace(/^swsh/i, 's').replace(/^s/i, 'S');
    } else if (cleanSetId.startsWith('base') || cleanSetId.startsWith('neo') || cleanSetId.startsWith('fo')) {
      return `https://images.pokemontcg.io/${cleanSetId}/${numStr}_hires.png`;
    }
    return `https://assets.tcgdex.net/ja/${jSeries}/${jSet}/${numStr}`;
  }

  let seriesPrefix = 'swsh';
  if (cleanSetId.startsWith('me')) seriesPrefix = 'me';
  else if (cleanSetId.startsWith('sv')) seriesPrefix = 'sv';
  else if (cleanSetId.startsWith('sm')) seriesPrefix = 'sm';
  else if (cleanSetId.startsWith('xy')) seriesPrefix = 'xy';
  else if (cleanSetId.startsWith('base')) seriesPrefix = 'base';
  else if (cleanSetId.startsWith('bw')) seriesPrefix = 'bw';
  else if (cleanSetId.startsWith('dp')) seriesPrefix = 'dp';
  else if (cleanSetId.startsWith('ex')) seriesPrefix = 'ex';

  if (cleanSetId.startsWith('me') || cleanSetId.startsWith('sv')) {
    numStr = numStr.padStart(3, '0');
  }
  return `https://assets.tcgdex.net/${langPrefix}/${seriesPrefix}/${cleanSetId}/${numStr}`;
}

export function handleCardImageError(img: HTMLImageElement, setId = 'swsh3', rawNum: string | number = '1') {
  if (!img) return;
  const num = `${rawNum}`.trim();
  const validAsset = getTCGDexValidAssetPath(setId, num);
  
  const sLow = setId.toLowerCase();
  const isJapaneseSet = sLow.includes('_ja') || img.src.includes('_ja') || img.src.includes('/ja/');
  const cleanId = sLow.replace(/_ja$/i, '').replace(/_ja_ja$/i, '');
  const cleanAsset = getTCGDexValidAssetPath(cleanId, num);

  let paddedNum = num;
  if (cleanId.startsWith('me') || cleanId.startsWith('sv') || cleanId.startsWith('sm') || cleanId.startsWith('xy') || cleanId.startsWith('swsh') || cleanId.startsWith('s')) {
    paddedNum = num.padStart(3, '0');
  }

  // Define reliable fallback chain
  const fallbacks = isJapaneseSet ? [
    `${validAsset}/high.webp`,
    `${validAsset}/high.png`,
    `${validAsset}.png`,
    `https://assets.tcgdex.net/ja/SV/SV2a/${num}/high.webp`,
    `https://assets.tcgdex.net/ja/SV/SV2a/${paddedNum}/high.webp`,
    `https://assets.tcgdex.net/ja/S/S12a/${num}/high.webp`,
    `https://assets.tcgdex.net/ja/S/S12a/${paddedNum}/high.webp`,
    `https://assets.tcgdex.net/ja/S/S8b/${num}/high.webp`,
    `https://assets.tcgdex.net/ja/S/S8b/${paddedNum}/high.webp`,
    `https://images.scrydex.com/pokemon/${sLow.endsWith('_ja') ? sLow : sLow + '_ja'}-${num}/large`,
    `https://images.scrydex.com/pokemon/${cleanId}_ja-${num}/large`,
    `https://images.scrydex.com/pokemon/${cleanId}_ja-${num}/high.png`,
    `https://images.scrydex.com/pokemon/${cleanId}-${paddedNum}/large`,
    `https://images.scrydex.com/pokemon/${cleanId}-${num}/large`,
    `${cleanAsset}/high.webp`,
    `${cleanAsset}/high.png`,
    // Direct pokemontcg.io high-res scans for corresponding card number and set
    `https://images.pokemontcg.io/${cleanId}/${num}_hires.png`,
    `https://images.pokemontcg.io/${cleanId}/${num}.png`,
    // Guaranteed Japanese high-res backup scans so card art never shows blank/black area
    `https://assets.tcgdex.net/ja/S/S12a/205/high.webp`,
    `https://assets.tcgdex.net/ja/SV/SV2a/133/high.webp`,
    `https://images.scrydex.com/pokemon/swsh12a_ja-205/large`,
    `https://images.pokemontcg.io/np/47_hires.png`,
    `https://images.pokemontcg.io/fo1/5_hires.png`
  ] : [
    `${validAsset}/high.webp`,
    `${validAsset}/high.png`,
    `${validAsset}/low.webp`,
    `${validAsset}/low.png`,
    `https://images.scrydex.com/pokemon/${setId}-${paddedNum}/high.png`,
    `https://images.scrydex.com/pokemon/${setId}-${paddedNum}/low.png`,
    `https://images.pokemontcg.io/${setId}/${num}_hires.png`,
    `https://images.pokemontcg.io/${setId}/${num}.png`,
    'https://images.pokemontcg.io/swsh3/19_hires.png'
  ];

  // Robustly determine the next fallback without relying on React-volatile dataset
  const currentIndex = fallbacks.findIndex(url => img.src === url || img.src.includes(url));
  let nextAttempt = currentIndex === -1 ? 0 : currentIndex + 1;
  
  // Skip over any fallback that is exactly what just failed
  while (nextAttempt < fallbacks.length && (img.src === fallbacks[nextAttempt] || img.src.includes(fallbacks[nextAttempt]))) {
      nextAttempt++;
  }

  if (nextAttempt < fallbacks.length) {
     img.dataset.errorAttempt = nextAttempt.toString();
     img.src = fallbacks[nextAttempt];
  }
}

export async function fetchCardFull(cardId: string, skipEvent: boolean = false): Promise<TCGDexCardFull> {
  if (cardFullCache.has(cardId)) {
    return cardFullCache.get(cardId)!;
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/cards/${cardId}`, 5000);
    if (!res.ok) throw new Error(`Failed to fetch card ${cardId}`);
    const data: TCGDexCardFull = await res.json();
    cardFullCache.set(cardId, data);
    if (!skipEvent) {
      onCardFullCacheUpdated.forEach(fn => fn());
    }
    return data;
  } catch {
    const setId = cardId.split('-')[0] || 'swsh3';
    const rawNum = cardId.split('-')[1] || '1';
    return {
      id: cardId,
      localId: rawNum,
      name: 'Card',
      image: getTCGDexValidAssetPath(setId, rawNum)
    };
  }
}

let activeWarmupSetId: string | null = null;

export async function orchestrateSetLoading(set: TCGDexSet | null, packCardIds: string[], onChaseCardsReady?: () => void) {
  if (!set || !set.cards || set.cards.length === 0) {
    if (onChaseCardsReady) onChaseCardsReady();
    return;
  }
  activeWarmupSetId = set.id;

  // Phase 1: Fetch pack cards first (Highest priority)
  if (packCardIds.length > 0) {
    const packCards = packCardIds.map(id => fetchCardFull(id, true));
    await Promise.allSettled(packCards);
    onCardFullCacheUpdated.forEach(fn => fn());
  }

  if (activeWarmupSetId !== set.id) return;

  // Phase 2: Identify top chase candidates
  const candidates = set.cards.filter(c =>
    !packCardIds.includes(c.id) &&
    !cardFullCache.has(c.id) &&
    !c.name.toLowerCase().includes('energy') &&
    !c.id.toLowerCase().includes('energy')
  );

  candidates.sort((a, b) => {
    const score = (card: TCGDexCardSummary) => {
      let s = 0;
      const n = card.name.toLowerCase();
      if (n.includes('charizard') || n.includes('pikachu') || n.includes('umbreon') || n.includes('rayquaza') || n.includes('mewtwo') || n.includes('lugia') || n.includes('gengar') || n.includes('giratina') || n.includes('arceus') || n.includes('mew')) s += 100;
      if (n.includes('secret') || n.includes('rainbow') || n.includes('gold') || n.includes('alt') || n.includes('illustration') || n.includes('sir') || n.includes('ir') || n.includes('gallery')) s += 50;
      if (n.includes('vmax') || n.includes('vstar') || n.includes('mega') || n.includes('ex') || n.includes(' gx') || n.includes('tag team')) s += 30;
      return s;
    };
    return score(b) - score(a);
  });

  // Extract top ~24 candidates for immediate fetching (Chase Cards Phase)
  const chaseCandidates = candidates.slice(0, 24);
  const backgroundCandidates = candidates.slice(24);

  // Fetch chase candidates
  const batchSize = 6;
  for (let i = 0; i < chaseCandidates.length; i += batchSize) {
    if (activeWarmupSetId !== set.id) return;
    const batch = chaseCandidates.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(c => fetchCardFull(c.id, true)));
    onCardFullCacheUpdated.forEach(fn => fn());
    await new Promise(r => setTimeout(r, 50));
  }

  if (activeWarmupSetId !== set.id) return;

  // Chase cards are now fully populated in cache. Tell UI it's safe to lift the curtain.
  if (onChaseCardsReady) onChaseCardsReady();

  // Phase 3: Background warmup for the rest of the set (Low priority)
  setTimeout(async () => {
    for (let i = 0; i < backgroundCandidates.length; i += batchSize) {
      if (activeWarmupSetId !== set.id) break;
      const batch = backgroundCandidates.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(c => fetchCardFull(c.id, true)));
      onCardFullCacheUpdated.forEach(fn => fn());
      // Give browser more breathing room for background tasks
      await new Promise(r => setTimeout(r, 150));
    }
  }, 500);
}

export type EnergyEra = 'base' | 'xy' | 'sm' | 'swsh' | 'sv' | 'me';

export const ENERGY_POOLS_BY_ERA: Record<EnergyEra, TCGDexCardSummary[]> = {
  base: [
    { id: "base-eng-1", localId: "E01", name: "Basic Grass Energy", image: "/packArts/Base-Generation/BASE-EnergyCards/1.webp" },
    { id: "base-eng-2", localId: "E02", name: "Basic Fire Energy", image: "/packArts/Base-Generation/BASE-EnergyCards/2.webp" },
    { id: "base-eng-3", localId: "E03", name: "Basic Water Energy", image: "/packArts/Base-Generation/BASE-EnergyCards/3.webp" },
    { id: "base-eng-4", localId: "E04", name: "Basic Lightning Energy", image: "/packArts/Base-Generation/BASE-EnergyCards/4.webp" },
    { id: "base-eng-5", localId: "E05", name: "Basic Psychic Energy", image: "/packArts/Base-Generation/BASE-EnergyCards/5.webp" },
    { id: "base-eng-6", localId: "E06", name: "Basic Fighting Energy", image: "/packArts/Base-Generation/BASE-EnergyCards/6.webp" }
  ],
  me: [
    { id: "me-eng-1", localId: "ME01", name: "Basic Grass Energy", image: "/packArts/MegaEvolution-Generation/ME-EnergyCards/1.webp" },
    { id: "me-eng-2", localId: "ME02", name: "Basic Fire Energy", image: "/packArts/MegaEvolution-Generation/ME-EnergyCards/2.webp" },
    { id: "me-eng-3", localId: "ME03", name: "Basic Water Energy", image: "/packArts/MegaEvolution-Generation/ME-EnergyCards/3.webp" },
    { id: "me-eng-4", localId: "ME04", name: "Basic Lightning Energy", image: "/packArts/MegaEvolution-Generation/ME-EnergyCards/4.webp" },
    { id: "me-eng-5", localId: "ME05", name: "Basic Psychic Energy", image: "/packArts/MegaEvolution-Generation/ME-EnergyCards/5.webp" },
    { id: "me-eng-6", localId: "ME06", name: "Basic Fighting Energy", image: "/packArts/MegaEvolution-Generation/ME-EnergyCards/6.webp" },
    { id: "me-eng-7", localId: "ME07", name: "Basic Darkness Energy", image: "/packArts/MegaEvolution-Generation/ME-EnergyCards/7.webp" },
    { id: "me-eng-8", localId: "ME08", name: "Basic Metal Energy", image: "/packArts/MegaEvolution-Generation/ME-EnergyCards/8.webp" }
  ],
  sv: [
    { id: "sv-eng-1", localId: "SV01", name: "Basic Grass Energy", image: "/packArts/ScarletAndViolet-Generation/SV-EnergyCards/1.webp" },
    { id: "sv-eng-2", localId: "SV02", name: "Basic Fire Energy", image: "/packArts/ScarletAndViolet-Generation/SV-EnergyCards/2.webp" },
    { id: "sv-eng-3", localId: "SV03", name: "Basic Water Energy", image: "/packArts/ScarletAndViolet-Generation/SV-EnergyCards/3.webp" },
    { id: "sv-eng-4", localId: "SV04", name: "Basic Lightning Energy", image: "/packArts/ScarletAndViolet-Generation/SV-EnergyCards/4.webp" },
    { id: "sv-eng-5", localId: "SV05", name: "Basic Psychic Energy", image: "/packArts/ScarletAndViolet-Generation/SV-EnergyCards/5.webp" },
    { id: "sv-eng-6", localId: "SV06", name: "Basic Fighting Energy", image: "/packArts/ScarletAndViolet-Generation/SV-EnergyCards/6.webp" },
    { id: "sv-eng-7", localId: "SV07", name: "Basic Darkness Energy", image: "/packArts/ScarletAndViolet-Generation/SV-EnergyCards/7.webp" }
  ],
  sm: [
    { id: "sm-eng-1", localId: "SM01", name: "Basic Grass Energy", image: "/packArts/SunAndMoon-Generation/SM-EnergyCards/1.webp" },
    { id: "sm-eng-2", localId: "SM02", name: "Basic Fire Energy", image: "/packArts/SunAndMoon-Generation/SM-EnergyCards/2.webp" },
    { id: "sm-eng-3", localId: "SM03", name: "Basic Water Energy", image: "/packArts/SunAndMoon-Generation/SM-EnergyCards/3.webp" },
    { id: "sm-eng-4", localId: "SM04", name: "Basic Lightning Energy", image: "/packArts/SunAndMoon-Generation/SM-EnergyCards/4.webp" },
    { id: "sm-eng-5", localId: "SM05", name: "Basic Psychic Energy", image: "/packArts/SunAndMoon-Generation/SM-EnergyCards/5.webp" },
    { id: "sm-eng-6", localId: "SM06", name: "Basic Fighting Energy", image: "/packArts/SunAndMoon-Generation/SM-EnergyCards/6.webp" },
    { id: "sm-eng-7", localId: "SM07", name: "Basic Darkness Energy", image: "/packArts/SunAndMoon-Generation/SM-EnergyCards/7.webp" },
    { id: "sm-eng-8", localId: "SM08", name: "Basic Metal Energy", image: "/packArts/SunAndMoon-Generation/SM-EnergyCards/8.webp" }
  ],
  swsh: [
    { id: "swsh-eng-1", localId: "SS01", name: "Basic Grass Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/1.webp" },
    { id: "swsh-eng-2", localId: "SS02", name: "Basic Fire Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/2.webp" },
    { id: "swsh-eng-3", localId: "SS03", name: "Basic Water Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/3.webp" },
    { id: "swsh-eng-4", localId: "SS04", name: "Basic Lightning Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/4.webp" },
    { id: "swsh-eng-5", localId: "SS05", name: "Basic Psychic Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/5.webp" },
    { id: "swsh-eng-6", localId: "SS06", name: "Basic Fighting Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/6.webp" },
    { id: "swsh-eng-7", localId: "SS07", name: "Basic Darkness Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/7.webp" },
    { id: "swsh-eng-8", localId: "SS08", name: "Basic Metal Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/8.webp" }
  ],
  xy: [
    { id: "xy-eng-1", localId: "XY01", name: "Basic Grass Energy", image: "/packArts/XY-Generation/XY-EnergyCards/1.webp" },
    { id: "xy-eng-2", localId: "XY02", name: "Basic Fire Energy", image: "/packArts/XY-Generation/XY-EnergyCards/2.webp" },
    { id: "xy-eng-3", localId: "XY03", name: "Basic Water Energy", image: "/packArts/XY-Generation/XY-EnergyCards/3.webp" },
    { id: "xy-eng-4", localId: "XY04", name: "Basic Lightning Energy", image: "/packArts/XY-Generation/XY-EnergyCards/4.webp" },
    { id: "xy-eng-5", localId: "XY05", name: "Basic Psychic Energy", image: "/packArts/XY-Generation/XY-EnergyCards/5.webp" },
    { id: "xy-eng-6", localId: "XY06", name: "Basic Fighting Energy", image: "/packArts/XY-Generation/XY-EnergyCards/6.webp" },
    { id: "xy-eng-7", localId: "XY07", name: "Basic Darkness Energy", image: "/packArts/XY-Generation/XY-EnergyCards/7.webp" }
  ]
};

export async function fetchBasicEnergyCard(era: EnergyEra = 'sv'): Promise<TCGDexCardSummary> {
  const pool = ENERGY_POOLS_BY_ERA[era] || ENERGY_POOLS_BY_ERA.sv;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

const rarityPoolCache = new Map<string, any[]>();

export async function generatePackFromSet(set: TCGDexSet, _count = 11): Promise<PokemonCard[]> {
  const pool = (set.cards || []).filter(c => Boolean(c.image) && !c.name.includes('Energy'));
  if (pool.length === 0) {
    throw new Error('No cards with images found in this set');
  }

  const officialCount = set.cardCount?.official || 189;
  const setIdLower = (set.id || '').toLowerCase();
  const setNameLower = (set.name || '').toLowerCase();

  const isMEEra = setIdLower.startsWith('me') || setNameLower.includes('mega evolution') || setNameLower.includes('phantasmal') || setNameLower.includes('ascended') || setNameLower.includes('perfect order') || setNameLower.includes('chaos rising');
  const isSVEra = !isMEEra && (setIdLower.startsWith('sv') || setNameLower.includes('scarlet') || setNameLower.includes('paldea') || setNameLower.includes('obsidian') || setNameLower.includes('paradox') || setNameLower.includes('temporal') || setNameLower.includes('twilight') || setNameLower.includes('stellar') || setNameLower.includes('surging') || setNameLower.includes('151') || setNameLower.includes('prismatic') || setNameLower.includes('shrouded') || setNameLower.includes('flare') || setNameLower.includes('bolt') || setNameLower.includes('fates') || setNameLower.includes('journey') || setNameLower.includes('rivals'));
  const isSV151 = setIdLower === 'sv3pt5' || setIdLower === 'meo' || setNameLower.includes('151');
  const isPrismatic = setIdLower === 'sv8pt5' || setIdLower === 'me02.5' || setNameLower.includes('prismatic') || setNameLower.includes('ascended');

  const isSMEra = setIdLower.startsWith('sm') || setIdLower === 'det1' || setNameLower.includes('sun & moon') || setNameLower.includes('guardians rising') || setNameLower.includes('burning shadows') || setNameLower.includes('shining legends') || setNameLower.includes('crimson invasion') || setNameLower.includes('ultra prism') || setNameLower.includes('forbidden light') || setNameLower.includes('celestial storm') || setNameLower.includes('dragon majesty') || setNameLower.includes('lost thunder') || setNameLower.includes('team up') || setNameLower.includes('detective pikachu') || setNameLower.includes('unbroken bonds') || setNameLower.includes('unified minds') || setNameLower.includes('hidden fates') || setNameLower.includes('cosmic eclipse');
  const isPrismStarSet = setIdLower === 'sm5' || setNameLower.includes('ultra prism') || setIdLower === 'sm6' || setNameLower.includes('forbidden light') || setIdLower === 'sm7' || setNameLower.includes('celestial storm') || setIdLower === 'sm8' || setNameLower.includes('lost thunder') || setIdLower === 'sm9' || setNameLower.includes('team up');
  const isCosmicEclipse = setIdLower === 'sm12' || setNameLower.includes('cosmic eclipse');

  const isXYEra = setIdLower.startsWith('xy') || setIdLower === 'g1' || setIdLower === 'dc1' || setNameLower.includes('flashfire') || setNameLower.includes('furious fists') || setNameLower.includes('phantom forces') || setNameLower.includes('primal clash') || setNameLower.includes('double crisis') || setNameLower.includes('roaring skies') || setNameLower.includes('ancient origins') || setNameLower.includes('breakthrough') || setNameLower.includes('breakpoint') || setNameLower.includes('generation') || setNameLower.includes('fates collide') || setNameLower.includes('steam siege') || setNameLower.includes('evolutions');
  const isBreakSet = setIdLower === 'xy8' || setNameLower.includes('breakthrough') || setIdLower === 'xy9' || setNameLower.includes('breakpoint') || setIdLower === 'xy10' || setNameLower.includes('fates collide') || setIdLower === 'xy11' || setNameLower.includes('steam siege');
  const isBaseEra = setIdLower.startsWith('base') || setIdLower === 'bs1' || setIdLower === 'bs2' || setIdLower === 'ju' || setIdLower === 'fo' || setIdLower === 'tr' || setNameLower.includes('base set') || setNameLower.includes('jungle') || setNameLower.includes('fossil') || setNameLower.includes('team rocket');

  const currentEra: EnergyEra = isMEEra ? 'me' : isSVEra ? 'sv' : isSMEra ? 'sm' : isXYEra ? 'xy' : isBaseEra ? 'base' : 'swsh';

  const isCrownZenith = setIdLower === 'swsh12pt5' || setNameLower.includes('crown zenith');
  const isTrainerGallerySet = 
    setIdLower === 'swsh4pt5' || setNameLower.includes('shining fates') ||
    setIdLower === 'swsh9' || setNameLower.includes('brilliant stars') ||
    setIdLower === 'swsh10' || setNameLower.includes('astral radiance') ||
    setIdLower === 'swsh11' || setNameLower.includes('lost origin') ||
    setIdLower === 'swsh12' || setNameLower.includes('silver tempest') ||
    setIdLower === 'sm115' || setIdLower === 'sm11pt5' || setNameLower.includes('hidden fates');

  let gallerySetId: string | null = null;
  if (isCrownZenith) gallerySetId = 'swsh12pt5gg';
  else if (setIdLower === 'swsh4pt5' || setIdLower === 'swsh4.5' || setNameLower.includes('shining fates')) gallerySetId = 'swsh4.5sv';
  else if (setIdLower === 'swsh9' || setNameLower.includes('brilliant stars')) gallerySetId = 'swsh9tg';
  else if (setIdLower === 'swsh10' || setNameLower.includes('astral radiance')) gallerySetId = 'swsh10tg';
  else if (setIdLower === 'swsh11' || setNameLower.includes('lost origin')) gallerySetId = 'swsh11tg';
  else if (setIdLower === 'swsh12' || setNameLower.includes('silver tempest')) gallerySetId = 'swsh12tg';
  else if (setIdLower === 'sm115' || setIdLower === 'sm11pt5' || setNameLower.includes('hidden fates')) gallerySetId = 'sm115sv';

  // If opening Shiny Vault directly (swsh4.5sv or sma), fetch base set for Commons/Uncommons so pack slots populate authentically
  const baseIdForRarity = (setIdLower === 'swsh4.5sv' || setIdLower === 'swsh4pt5sv' || setNameLower.includes('shining fates shiny vault')) ? 'swsh4.5' :
                          (setIdLower === 'sma' || setIdLower === 'sm115sv' || setNameLower.includes('hidden fates shiny vault')) ? 'sm115' : set.id;

  // Fetch rarity groupings & gallery sub-set from TCGdex API in parallel (or from cache)
  const cacheKey = `${baseIdForRarity}_${gallerySetId || 'none'}_${set.id}`;
  let rarityData = rarityPoolCache.get(cacheKey);
  if (!rarityData) {
    rarityData = await Promise.all([
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Common`, 2500).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Uncommon`, 2500).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Rare`, 2500).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Rare Holo`, 2500).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Ultra Rare`, 2500).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Secret Rare`, 2500).then(r => r.ok ? r.json() : []).catch(() => []),
      gallerySetId ? fetchWithTimeout(`${API_BASE}/sets/${gallerySetId}`, 2500).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null)
    ]);
    if ((rarityData[0] && rarityData[0].length > 0) || (rarityData[1] && rarityData[1].length > 0)) {
      rarityPoolCache.set(cacheKey, rarityData);
    }
  }

  const [
    commonsList,
    uncommonsList,
    _raresList,
    holoRaresList,
    ultraRaresList,
    secretRaresList,
    gallerySetData
  ] = rarityData;

  const commonIds = new Set(commonsList.map((c: any) => c.id));
  const uncommonIds = new Set(uncommonsList.map((c: any) => c.id));
  const holoRareIds = new Set(holoRaresList.map((c: any) => c.id));
  const ultraRareIds = new Set(ultraRaresList.map((c: any) => c.id));
  const secretRareIds = new Set(secretRaresList.map((c: any) => c.id));

  const commonPool: TCGDexCardSummary[] = [];
  const uncommonPool: TCGDexCardSummary[] = [];

  // 7 exact high-rarity banner pools for Slot 10
  const nonHoloRarePool: TCGDexCardSummary[] = [];
  const holoRarePool: TCGDexCardSummary[] = [];
  const vPool: TCGDexCardSummary[] = [];
  const fullArtPool: TCGDexCardSummary[] = [];
  const vmaxPool: TCGDexCardSummary[] = [];
  const rainbowSecretPool: TCGDexCardSummary[] = [];
  const goldSecretPool: TCGDexCardSummary[] = [];

  const irPool: TCGDexCardSummary[] = [];
  const sirPool: TCGDexCardSummary[] = [];
  const prismStarPool: TCGDexCardSummary[] = [];
  const characterRarePool: TCGDexCardSummary[] = [];
  const breakPool: TCGDexCardSummary[] = [];

  // Inspect every single card in the 200+ card set so nothing is left out
  for (const card of pool) {
    if (commonIds.has(card.id)) {
      commonPool.push(card);
    } else if (uncommonIds.has(card.id)) {
      uncommonPool.push(card);
    } else {
      const numParts = (card.localId || '0').match(/\d+/);
      const num = numParts ? parseInt(numParts[0], 10) : 0;
      const isSecretNumber = (num > officialCount && officialCount > 0);

      if (isSVEra && isSecretNumber) {
        if (num <= officialCount + 18) irPool.push(card);
        else sirPool.push(card);
      }

      if (isSMEra) {
        if (card.name.includes('♢') || card.name.includes('◇') || card.name.includes('Prism Star') || card.name.includes(' Prism') || card.id.includes('-prism') || (card.rarity || '').toLowerCase().includes('prism')) {
          prismStarPool.push(card);
        }
        if (isCosmicEclipse && isSecretNumber && num <= officialCount + 15) {
          characterRarePool.push(card);
        }
      }

      if (isXYEra) {
        if (card.name.includes(' BREAK') || card.name.endsWith('BREAK') || (card.rarity || '').toLowerCase().includes('break')) {
          breakPool.push(card);
        }
      }

      // Distinguish into the exact 7 tiers
      if (secretRareIds.has(card.id) || isSecretNumber) {
        if (card.name.includes('Gold') || card.name.includes('Energy') || card.name.includes('Patch') || card.name.includes('Parasol') || num >= officialCount + 9) {
          goldSecretPool.push(card);
        } else {
          rainbowSecretPool.push(card);
        }
      } else if (card.name.includes('VMAX') || card.name.includes('VSTAR')) {
        vmaxPool.push(card);
      } else if (ultraRareIds.has(card.id) || (num > officialCount - 15 && !card.name.includes(' V'))) {
        fullArtPool.push(card);
      } else if (card.name.includes(' V') || card.name.includes(' ex') || card.name.includes(' GX') || card.name.includes(' EX')) {
        vPool.push(card);
      } else if (holoRareIds.has(card.id)) {
        holoRarePool.push(card);
      } else {
        nonHoloRarePool.push(card);
      }
    }
  }

  // Ensure commonPool and uncommonPool have healthy pools even if TCGdex API rarity endpoint failed or returned partial data
  if (commonPool.length < 10 || uncommonPool.length < 10) {
    const regularCards = pool.filter(c => {
      const n = parseInt((c.localId || '0').match(/\d+/)?.[0] || '0', 10);
      const isSpecial = c.name.includes(' V') || c.name.includes(' ex') || c.name.includes(' GX') || c.name.includes(' EX') || c.name.includes('VMAX') || c.name.includes('VSTAR') || c.name.includes('Gold') || c.name.includes('Secret') || (officialCount > 0 && n > officialCount);
      return !isSpecial && !secretRareIds.has(c.id) && !ultraRareIds.has(c.id);
    });
    regularCards.sort((a, b) => {
      const nA = parseInt((a.localId || '0').match(/\d+/)?.[0] || '0', 10);
      const nB = parseInt((b.localId || '0').match(/\d+/)?.[0] || '0', 10);
      return nA - nB;
    });
    const split1 = Math.floor(regularCards.length * 0.5);
    const split2 = Math.floor(regularCards.length * 0.8);

    if (commonPool.length < 10) {
      commonPool.push(...regularCards.slice(0, split1).filter(c => !commonPool.some(existing => existing.id === c.id)));
    }
    if (uncommonPool.length < 10) {
      uncommonPool.push(...regularCards.slice(split1, split2).filter(c => !uncommonPool.some(existing => existing.id === c.id)));
    }
    if (nonHoloRarePool.length < 5) {
      nonHoloRarePool.push(...regularCards.slice(split2).filter(c => !nonHoloRarePool.some(existing => existing.id === c.id)));
    }
  }

  const pickedIds = new Set<string>();
  const pickedNames = new Set<string>();

  const getFromPool = (p: TCGDexCardSummary[], fallbacks: TCGDexCardSummary[][]): TCGDexCardSummary => {
    const pickUnique = (candidates: TCGDexCardSummary[]): TCGDexCardSummary | null => {
      if (!candidates || candidates.length === 0) return null;
      const unpicked = candidates.filter(c => !pickedIds.has(c.id) && !pickedNames.has(c.name) && !c.name.includes('Energy'));
      if (unpicked.length > 0) {
        const chosen = unpicked[Math.floor(Math.random() * unpicked.length)];
        if (chosen) {
          pickedIds.add(chosen.id);
          pickedNames.add(chosen.name);
          return chosen;
        }
      }
      return null;
    };

    const primaryPick = pickUnique(p);
    if (primaryPick) return primaryPick;

    for (const fb of fallbacks) {
      const fbPick = pickUnique(fb);
      if (fbPick) return fbPick;
    }

    const remainingInSet = pool.filter(c => !pickedIds.has(c.id) && !pickedNames.has(c.name));
    if (remainingInSet.length > 0) {
      const chosen = remainingInSet[Math.floor(Math.random() * remainingInSet.length)];
      if (chosen) {
        pickedIds.add(chosen.id);
        pickedNames.add(chosen.name);
        return chosen;
      }
    }

    // If every unique card in pool was somehow picked, create a unique virtual variant so no duplicate card or ID ever repeats
    const fallbackBase = pool[Math.floor(Math.random() * pool.length)] || { id: `${set.id}-fb`, localId: '1', name: 'Pokémon Card', image: `https://assets.tcgdex.net/en/sv/${set.id}/1` };
    const uniqueId = `${fallbackBase.id}-alt-${pickedIds.size + 1}`;
    const uniqueName = `${fallbackBase.name} (Alt #${pickedIds.size + 1})`;
    pickedIds.add(uniqueId);
    pickedNames.add(uniqueName);
    return {
      ...fallbackBase,
      id: uniqueId,
      name: uniqueName
    };
  };

  // Reverse Holo slot can draw any Common, Uncommon, Non-Holo Rare, or Holo Rare
  const reverseHoloPool = [...commonPool, ...uncommonPool, ...nonHoloRarePool, ...holoRarePool];

  // Combine fetched gallery sub-set with inline TG/GG cards
  const isShinyVaultSet = setIdLower === 'swsh4.5sv' || setIdLower === 'swsh4pt5sv' || setIdLower === 'sma' || setIdLower === 'sm115sv' || setNameLower.includes('shiny vault');
  const fetchedGallery = (gallerySetData?.cards || []).map((c: any) => {
    if (!c.image) {
      c.image = getTCGDexValidAssetPath(gallerySetId || '', c.localId);
    }
    return c;
  });
  const inlineGallery = pool.filter(c => (c.localId || '').startsWith('TG') || (c.localId || '').startsWith('GG') || (c.localId || '').startsWith('SV') || (c.id || '').includes('-tg') || (c.id || '').includes('-gg') || (c.id || '').includes('-sv') || (c.rarity || '').toLowerCase().includes('shiny') || (c.rarity || '').toLowerCase().includes('classic collection'));
  const galleryPool = isShinyVaultSet ? pool : [...fetchedGallery, ...inlineGallery];

  const selectedSlots: { summary: TCGDexCardSummary; isReverseHolo?: boolean; defaultRarity: string }[] = [];

  if (isSVEra || isMEEra) {
    // --- Scarlet & Violet or Mega Evolution Series ---
    // Total Cards per Pack: 11
    const isGodPack = isSV151 && Math.random() < 0.005;

    // Slot 1: Basic Energy (1 card)
    const basicEnergy = await fetchBasicEnergyCard(currentEra);
    if (Math.random() < 0.15) {
      selectedSlots.push({ summary: basicEnergy, isReverseHolo: true, defaultRarity: 'Reverse Holo Energy' });
    } else {
      selectedSlots.push({ summary: basicEnergy, defaultRarity: 'Basic Energy' });
    }

    // Slot 2-5: Common (4 cards)
    for (let i = 0; i < 4; i++) {
      selectedSlots.push({ summary: getFromPool(commonPool, [[...uncommonPool, ...pool]]), defaultRarity: 'Common' });
    }

    // Slot 5-7: Uncommon (3 cards)
    for (let i = 0; i < 3; i++) {
      selectedSlots.push({ summary: getFromPool(uncommonPool, [commonPool, pool]), defaultRarity: 'Uncommon' });
    }

    if (isGodPack) {
      // Demi-God Pack: Replace 1st Reverse Holo, 2nd Reverse Holo+, and Rare slot with 3-stage IR/SIR hit!
      selectedSlots.push({ summary: getFromPool(irPool, [fullArtPool, pool]), defaultRarity: 'Illustration Rare (Demi-God Stage 1)' });
      selectedSlots.push({ summary: getFromPool(irPool, [fullArtPool, pool]), defaultRarity: 'Illustration Rare (Demi-God Stage 2)' });
      selectedSlots.push({ summary: getFromPool(sirPool, [vPool, fullArtPool, pool]), defaultRarity: 'Special Illustration Rare (Demi-God Stage 3)' });
    } else {
      // Slot 8: Reverse Holo (1 card)
      selectedSlots.push({ summary: getFromPool([...commonPool, ...uncommonPool], [pool]), isReverseHolo: true, defaultRarity: 'Reverse Holo' });

      // Slot 9: Reverse Holo+ (Reverse Holo, Illustration Rare, Special Illustration Rare, or Hyper Rare) (1 card)
      const irHitChance = isPrismatic ? 0.45 : 0.22;
      if (Math.random() < irHitChance && (irPool.length > 0 || sirPool.length > 0 || goldSecretPool.length > 0 || fullArtPool.length > 0)) {
        const hit = getFromPool([...irPool, ...sirPool, ...goldSecretPool], [fullArtPool, rainbowSecretPool, pool]);
        let hitLabel = 'Illustration Rare';
        if (goldSecretPool.some(c => c.id === hit.id)) {
          hitLabel = 'Hyper Rare (Gold)';
        } else if (sirPool.some(c => c.id === hit.id)) {
          hitLabel = 'Special Illustration Rare';
        }
        selectedSlots.push({ summary: hit, defaultRarity: hitLabel });
      } else {
        selectedSlots.push({ summary: getFromPool([...commonPool, ...uncommonPool], [pool]), isReverseHolo: true, defaultRarity: 'Reverse Holo' });
      }

      // Slot 10: Rare or better (Holo Rare, Double Rare, Ultra Rare, etc.) (1 card)
      const svRoll = Math.random();
      let svHit: TCGDexCardSummary;
      let svLabel = 'Holo Rare';
      if (svRoll < 0.15) {
        svHit = getFromPool(fullArtPool, [sirPool, irPool, vPool, holoRarePool]);
        svLabel = 'Ultra Rare (Full Art)';
      } else if (svRoll < 0.40) {
        svHit = getFromPool(vPool, [fullArtPool, holoRarePool, pool]);
        svLabel = 'Double Rare (ex)';
      } else {
        svHit = getFromPool(holoRarePool, [vPool, pool]);
        svLabel = 'Holo Rare';
      }
      selectedSlots.push({ summary: svHit, defaultRarity: svLabel });
    }
  } else if (isSMEra) {
    // --- Sun & Moon Series ---
    // Total Cards per Pack: 11
    // Slot 1: Basic Energy (1 card)
    const basicEnergy = await fetchBasicEnergyCard('sm');
    selectedSlots.push({ summary: basicEnergy, defaultRarity: 'Basic Energy' });

    // Slot 2-6: Common (5 cards)
    for (let i = 0; i < 5; i++) {
      selectedSlots.push({ summary: getFromPool(commonPool, [[...uncommonPool, ...pool]]), defaultRarity: 'Common' });
    }

    // Slot 6-8: Uncommon (3 cards)
    for (let i = 0; i < 3; i++) {
      selectedSlots.push({ summary: getFromPool(uncommonPool, [commonPool, pool]), defaultRarity: 'Uncommon' });
    }

    // Slot 9: Reverse Holo (OR Prism Star / Character Rare / Shiny Vault) (1 card)
    if (isCosmicEclipse && characterRarePool.length > 0 && Math.random() < 0.30) {
      selectedSlots.push({ summary: getFromPool(characterRarePool, [reverseHoloPool, pool]), isReverseHolo: false, defaultRarity: 'Character Rare (CHR)' });
    } else if (isPrismStarSet && prismStarPool.length > 0 && Math.random() < 0.25) {
      selectedSlots.push({ summary: getFromPool(prismStarPool, [reverseHoloPool, pool]), isReverseHolo: false, defaultRarity: 'Prism Star ♢' });
    } else if (galleryPool.length > 0 && Math.random() < (isShinyVaultSet ? 0.45 : 0.30)) {
      selectedSlots.push({ summary: getFromPool(galleryPool, [reverseHoloPool, pool]), isReverseHolo: false, defaultRarity: 'Shiny Vault' });
    } else {
      selectedSlots.push({ summary: getFromPool(reverseHoloPool, [pool]), isReverseHolo: true, defaultRarity: 'Reverse Holo' });
    }

    // Slot 10: Rare or better (Regular Rare, Holo Rare, GX, Full Art, Secret Rare, etc.) (1 card)
    const smRoll = Math.random();
    let smHit: TCGDexCardSummary;
    let smLabel = 'Non-Holo Rare';

    if (smRoll < 0.01) {
      smHit = getFromPool(goldSecretPool, [rainbowSecretPool, fullArtPool, vPool, holoRarePool]);
      smLabel = 'Secret Rare';
    } else if (smRoll < 0.025) {
      smHit = getFromPool(rainbowSecretPool, [goldSecretPool, fullArtPool, vPool, holoRarePool]);
      smLabel = 'Rainbow Rare';
    } else if (smRoll < 0.08) {
      smHit = getFromPool(fullArtPool, [vPool, holoRarePool, nonHoloRarePool]);
      smLabel = 'Full Art';
    } else if (smRoll < 0.22) {
      smHit = getFromPool(vPool, [fullArtPool, holoRarePool, nonHoloRarePool]);
      smLabel = (smHit?.name || '').includes('TAG TEAM') ? 'TAG TEAM GX' : 'Pokémon-GX';
    } else if (smRoll < 0.35) {
      smHit = getFromPool(holoRarePool, [nonHoloRarePool, vPool, pool]);
      smLabel = 'Holo Rare';
    } else {
      smHit = getFromPool(nonHoloRarePool, [holoRarePool, pool]);
      smLabel = 'Non-Holo Rare';
    }
    selectedSlots.push({ summary: smHit, defaultRarity: smLabel });
  } else if (isXYEra) {
    // --- XY Series ---
    // Total Cards per Pack: 10
    // Slot 1: Basic Energy (XY Era) (1 card)
    const basicEnergy = await fetchBasicEnergyCard('xy');
    selectedSlots.push({ summary: basicEnergy, defaultRarity: 'Basic Energy' });

    // Slot 2-5: Common (4 cards)
    for (let i = 0; i < 4; i++) {
      selectedSlots.push({ summary: getFromPool(commonPool, [[...uncommonPool, ...pool]]), defaultRarity: 'Common' });
    }

    // Slot 6-8: Uncommon (3 cards)
    for (let i = 0; i < 3; i++) {
      selectedSlots.push({ summary: getFromPool(uncommonPool, [commonPool, pool]), defaultRarity: 'Uncommon' });
    }

    // Slot 9: Reverse Holo (1 card)
    selectedSlots.push({ summary: getFromPool(reverseHoloPool, [pool]), isReverseHolo: true, defaultRarity: 'Reverse Holo' });

    // Slot 10: Rare or better (Regular Rare, Holo Rare, EX, Mega EX, Full Art, Secret Rare, etc.) (1 card)
    const xyRoll = Math.random();
    let xyHit: TCGDexCardSummary;
    let xyLabel = 'Non-Holo Rare';

    if (xyRoll < 0.01) {
      xyHit = getFromPool(goldSecretPool, [rainbowSecretPool, fullArtPool, vPool, holoRarePool]);
      xyLabel = 'Secret Rare';
    } else if (xyRoll < 0.05 && isBreakSet && breakPool.length > 0) {
      xyHit = getFromPool(breakPool, [vPool, fullArtPool, holoRarePool]);
      xyLabel = 'Pokémon BREAK';
    } else if (xyRoll < 0.08) {
      xyHit = getFromPool(fullArtPool, [vPool, holoRarePool, nonHoloRarePool]);
      xyLabel = 'Full Art EX';
    } else if (xyRoll < 0.20) {
      xyHit = getFromPool(vPool, [fullArtPool, holoRarePool, nonHoloRarePool]);
      xyLabel = (xyHit?.name || '').startsWith('M ') || (xyHit?.name || '').includes('Mega') ? 'Mega Evolution EX' : 'Pokémon EX';
    } else if (xyRoll < 0.35) {
      xyHit = getFromPool(holoRarePool, [nonHoloRarePool, vPool, pool]);
      xyLabel = 'Holo Rare';
    } else {
      xyHit = getFromPool(nonHoloRarePool, [holoRarePool, pool]);
      xyLabel = 'Non-Holo Rare';
    }
    selectedSlots.push({ summary: xyHit, defaultRarity: xyLabel });
  } else if (isBaseEra) {
    // --- Original Base / Vintage WOTC Series ---
    // Total Cards per Pack: 11
    // Slot 1: Basic Energy (1 card)
    const baseEnergy = await fetchBasicEnergyCard('base');
    selectedSlots.push({ summary: baseEnergy, defaultRarity: 'Basic Energy' });

    // Slot 2-6: Common (5 cards)
    for (let i = 0; i < 5; i++) {
      selectedSlots.push({ summary: getFromPool(commonPool, [[...uncommonPool, ...pool]]), defaultRarity: 'Common' });
    }

    // Slot 7-9: Uncommon (3 cards)
    for (let i = 0; i < 3; i++) {
      selectedSlots.push({ summary: getFromPool(uncommonPool, [commonPool, pool]), defaultRarity: 'Uncommon' });
    }

    // Slot 10: Trainer / Energy (1 card)
    const trainerPool = pool.filter(c => c.name.includes('Energy') || c.name.includes('Trainer') || c.name.includes('Professor') || c.name.includes('Bill') || c.name.includes('Potion'));
    if (Math.random() < 0.35 || trainerPool.length === 0) {
      const extraEnergy = await fetchBasicEnergyCard('base');
      selectedSlots.push({ summary: extraEnergy, defaultRarity: 'Basic Energy' });
    } else {
      selectedSlots.push({ summary: getFromPool(trainerPool, [uncommonPool, commonPool, pool]), defaultRarity: 'Trainer / Energy' });
    }

    // Slot 11: Rare (Holo Rare ~33%, Non-Holo Rare ~66%, Secret Rare ~1%) (1 card)
    const baseRoll = Math.random();
    let baseHit: TCGDexCardSummary;
    let baseLabel = 'Non-Holo Rare';

    if (baseRoll < 0.015 && goldSecretPool.length > 0) {
      baseHit = getFromPool(goldSecretPool, [holoRarePool, nonHoloRarePool, pool]);
      baseLabel = 'Secret Rare';
    } else if (baseRoll < 0.34 && holoRarePool.length > 0) {
      baseHit = getFromPool(holoRarePool, [nonHoloRarePool, pool]);
      baseLabel = 'Holo Rare';
    } else {
      baseHit = getFromPool(nonHoloRarePool, [holoRarePool, pool]);
      baseLabel = 'Non-Holo Rare';
    }
    selectedSlots.push({ summary: baseHit, defaultRarity: baseLabel });
  } else {
    // --- Sword & Shield Series / Mainline Structure ---
    // Total Cards per Pack: 11
    // Slot 1: Basic Energy (1 card)
    const basicEnergy = await fetchBasicEnergyCard('swsh');
    if (isCrownZenith && Math.random() < 0.20) {
      selectedSlots.push({ summary: basicEnergy, isReverseHolo: true, defaultRarity: 'Textured Foil Energy' });
    } else {
      selectedSlots.push({ summary: basicEnergy, defaultRarity: 'Basic Energy' });
    }

    // Slot 2-6: Common (5 cards)
    for (let i = 0; i < 5; i++) {
      selectedSlots.push({ summary: getFromPool(commonPool, [[...uncommonPool, ...pool]]), defaultRarity: 'Common' });
    }

    // Slot 6-8: Uncommon (3 cards)
    for (let i = 0; i < 3; i++) {
      selectedSlots.push({ summary: getFromPool(uncommonPool, [commonPool, pool]), defaultRarity: 'Uncommon' });
    }

    // Slot 9: Reverse Holo (OR Subset card e.g., Trainer Gallery, Shiny Vault, Galarian Gallery) (1 card)
    if (isCrownZenith && galleryPool.length > 0 && Math.random() < 0.35) {
      selectedSlots.push({ summary: getFromPool(galleryPool, [reverseHoloPool, pool]), isReverseHolo: false, defaultRarity: 'Galarian Gallery' });
    } else if ((isTrainerGallerySet || isShinyVaultSet) && galleryPool.length > 0 && Math.random() < (isShinyVaultSet ? 0.45 : 0.30)) {
      const hit = getFromPool(galleryPool, [reverseHoloPool, pool]);
      const isShiny = isShinyVaultSet || (hit.localId || '').startsWith('SV') || (hit.id || '').includes('-sv') || (hit.rarity || '').toLowerCase().includes('shiny');
      selectedSlots.push({ summary: hit, isReverseHolo: false, defaultRarity: isShiny ? 'Shiny Vault' : 'Trainer Gallery' });
    } else {
      selectedSlots.push({ summary: getFromPool(reverseHoloPool, [pool]), isReverseHolo: true, defaultRarity: 'Reverse Holo' });
    }

    // Slot 10: Rare or better (Regular Rare, Holo Rare, V, VMAX, VSTAR, Full Art, Secret Rare, etc.) (1 card)
    const roll = Math.random();
    let rareHit: TCGDexCardSummary;
    let rareRarityLabel = 'Non-Holo Rare';

    if (roll < 0.008) {
      rareHit = getFromPool(goldSecretPool, [rainbowSecretPool, fullArtPool, vmaxPool, vPool, holoRarePool]);
      rareRarityLabel = 'Gold Secret Rare';
    } else if (roll < 0.021) {
      rareHit = getFromPool(rainbowSecretPool, [goldSecretPool, fullArtPool, vmaxPool, vPool, holoRarePool]);
      rareRarityLabel = 'Rainbow Rare';
    } else if (roll < 0.058) {
      rareHit = getFromPool(vmaxPool, [vPool, fullArtPool, holoRarePool, nonHoloRarePool]);
      rareRarityLabel = (rareHit?.name || '').includes('VSTAR') ? 'Pokémon VSTAR' : 'Pokémon VMAX';
    } else if (roll < 0.105) {
      rareHit = getFromPool(fullArtPool, [vPool, vmaxPool, holoRarePool, nonHoloRarePool]);
      rareRarityLabel = 'Full Art';
    } else if (roll < 0.223) {
      rareHit = getFromPool(vPool, [fullArtPool, vmaxPool, holoRarePool, nonHoloRarePool]);
      rareRarityLabel = 'Pokémon V';
    } else if (roll < 0.333) {
      rareHit = getFromPool(holoRarePool, [nonHoloRarePool, vPool, pool]);
      rareRarityLabel = 'Holo Rare';
    } else {
      rareHit = getFromPool(nonHoloRarePool, [holoRarePool, pool]);
      rareRarityLabel = 'Non-Holo Rare';
    }
    selectedSlots.push({ summary: rareHit, defaultRarity: rareRarityLabel });
  }

  // Synchronously format pack cards in 0ms so pack opening never blocks on network queries!
  const cards: PokemonCard[] = selectedSlots.map((slot, idx) => {
    // Check if full card details are already cached in memory
    const cached = cardFullCache.get(slot.summary.id);
    if (cached) {
      return {
        id: cached.id || slot.summary.id,
        name: cached.name,
        rarity: cached.rarity || slot.defaultRarity || 'Common',
        isReverseHolo: Boolean(slot.isReverseHolo),
        illustrator: cached.illustrator,
        images: {
          small: getCardImageUrl(cached.image || slot.summary.image, 'low'),
          large: getCardImageUrl(cached.image || slot.summary.image, 'high'),
        },
        pricing: cached.pricing,
        tcgplayer: cached.pricing?.tcgplayer ? { prices: cached.pricing.tcgplayer, unit: cached.pricing.tcgplayer.unit } : undefined,
        cardmarket: cached.pricing?.cardmarket,
      };
    }

    // Generate accurate realistic base pricing according to rarity tier immediately
    let marketPrice = 0.15;
    const r = (slot.defaultRarity || '').toLowerCase();
    if (r.includes('secret') || r.includes('rainbow') || r.includes('gold')) marketPrice = Number((25 + Math.random() * 85).toFixed(2));
    else if (r.includes('full art') || r.includes('vmax') || r.includes('vstar')) marketPrice = Number((8 + Math.random() * 32).toFixed(2));
    else if (r.includes(' v') || r.includes(' ex') || r.includes(' gx')) marketPrice = Number((2 + Math.random() * 12).toFixed(2));
    else if (r.includes('holo')) marketPrice = Number((0.5 + Math.random() * 2.5).toFixed(2));
    else if (r.includes('uncommon')) marketPrice = Number((0.15 + Math.random() * 0.35).toFixed(2));
    else marketPrice = Number((0.05 + Math.random() * 0.20).toFixed(2));

    // Warm up full card details asynchronously in the background without blocking the user!
    if (!slot.summary.id.startsWith('sve-') && !slot.summary.name.includes('Energy')) {
      fetchCardFull(slot.summary.id).catch(() => {});
    }

    const initialTcgplayer = {
      unit: 'USD',
      updated: new Date().toISOString(),
      [slot.isReverseHolo ? 'reverseHolofoil' : (r.includes('holo') || r.includes('secret') || r.includes('ultra') || r.includes(' v') || r.includes(' ex')) ? 'holofoil' : 'normal']: {
        marketPrice: marketPrice,
        midPrice: Number((marketPrice * 1.05).toFixed(2)),
        lowPrice: Number((marketPrice * 0.85).toFixed(2)),
        highPrice: Number((marketPrice * 1.4).toFixed(2)),
      }
    };

    return {
      id: slot.summary.id,
      name: slot.summary.name,
      rarity: slot.defaultRarity || 'Common',
      isReverseHolo: Boolean(slot.isReverseHolo),
      images: {
        small: getCardImageUrl(slot.summary.image, 'low'),
        large: getCardImageUrl(slot.summary.image, 'high'),
      },
      pricing: {
        tcgplayer: initialTcgplayer,
        cardmarket: {
          unit: 'EUR',
          updated: new Date().toISOString(),
          trend: Number((marketPrice * 0.95).toFixed(2)),
          avg: Number((marketPrice * 0.92).toFixed(2)),
          low: Number((marketPrice * 0.70).toFixed(2)),
        }
      },
      tcgplayer: {
        unit: 'USD',
        prices: initialTcgplayer
      }
    };
  });

  return cards;
}
