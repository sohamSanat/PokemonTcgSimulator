import { weightedPick, loadJapaneseMetadata, getJapaneseCardRealPrice } from './scrydex';

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
  isVendorCatalog?: boolean;
  vendorName?: string;
  vendorBooth?: string;
  vendorRating?: string;
  isSlabbed?: boolean;
  slabGrade?: string;
}

export const getCardImageUrl = (baseUrl?: string, quality: 'low' | 'high' = 'high'): string => {
  if (!baseUrl) return '';
  if (baseUrl.includes('/packArts/')) return baseUrl;
  
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
      })
      .reverse();
  }
  seriesCache.set(cacheKey, data);
  return data;
}

export function normalizeSetId(setId: string): string {
  if (!setId) return setId;
  const sLow = setId.trim().toLowerCase();
  if (sLow.startsWith('sv')) {
    if (sLow === 'sv1') return 'sv01';
    if (sLow === 'sv2') return 'sv02';
    if (sLow === 'sv3') return 'sv03';
    if (sLow === 'sv3pt5' || sLow === 'sv3.5' || sLow === 'sv3pt5en') return 'sv03.5';
    if (sLow === 'sv4') return 'sv04';
    if (sLow === 'sv4pt5' || sLow === 'sv4.5') return 'sv04.5';
    if (sLow === 'sv5') return 'sv05';
    if (sLow === 'sv6') return 'sv06';
    if (sLow === 'sv6pt5' || sLow === 'sv6.5') return 'sv06.5';
    if (sLow === 'sv7') return 'sv07';
    if (sLow === 'sv8') return 'sv08';
    if (sLow === 'sv8pt5' || sLow === 'sv8.5') return 'sv08.5';
  }
  if (sLow.startsWith('swsh')) {
    if (sLow === 'swsh4pt5') return 'swsh4.5';
    if (sLow === 'swsh12pt5') return 'swsh12.5';
  }
  if (sLow.startsWith('sm')) {
    if (sLow === 'sm115' || sLow === 'sm11pt5') return 'sm11.5';
  }
  if (sLow === 'me02pt5') return 'me02.5';
  return setId;
}

export async function fetchSetDetails(setId: string): Promise<TCGDexSet> {
  const normalizedId = normalizeSetId(setId);
  const cacheKey = normalizedId.toLowerCase();
  if (setDetailsCache.has(cacheKey)) {
    return setDetailsCache.get(cacheKey)!;
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/sets/${normalizedId}`, 3500);
    if (!res.ok) throw new Error(`Failed to fetch set details for ${normalizedId}`);
    const data: TCGDexSet = await res.json();
    if (!data.cards || data.cards.length < 20) throw new Error(`Incomplete set cards for ${normalizedId}`);
    // Map over cards and assign fallback image url if not provided in sets response
    data.cards = data.cards.map(c => {
      if (!c.image) {
        c.image = getTCGDexValidAssetPath(normalizedId, c.localId);
      }
      return c;
    });
    const enriched = enrichSetSummary(data);
    setDetailsCache.set(cacheKey, enriched);
    return enriched;
  } catch (err) {
    console.warn(`Timeout/error fetching set details for ${setId} (${normalizedId}), using local fallback:`, err);
    // Bulletproof fallback so pack opening never gets stuck on "Drawing Live Cards..."
    const fallbackSet: TCGDexSet = {
      id: normalizedId,
      name: normalizedId === 'swsh3' ? 'Darkness Ablaze' : normalizedId === 'me02.5' ? 'Ascended Heroes' : normalizedId.toUpperCase(),
      logo: `https://assets.tcgdex.net/en/${normalizedId.toLowerCase().startsWith('me') ? 'me' : normalizedId.toLowerCase().startsWith('sv') ? 'sv' : normalizedId.toLowerCase().startsWith('sm') ? 'sm' : normalizedId.toLowerCase().startsWith('xy') ? 'xy' : normalizedId.toLowerCase().startsWith('base') ? 'base' : 'swsh'}/${normalizedId}/logo`,
      cardCount: { total: 189, official: 189 },
      cards: Array.from({ length: 189 }, (_, i) => {
        const rawNum = `${i + 1}`;
        const localNum = (normalizedId.toLowerCase().startsWith('me') || normalizedId.toLowerCase().startsWith('sv')) ? rawNum.padStart(3, '0') : rawNum;
        let defaultRarity = 'Common';
        if (i >= 180) defaultRarity = 'Secret Rare';
        else if (i >= 170) defaultRarity = 'Ultra Rare';
        else if (i >= 150) defaultRarity = 'Double Rare';
        else if (i >= 120) defaultRarity = 'Rare Holo';
        else if (i >= 70) defaultRarity = 'Uncommon';
        return {
          id: `${normalizedId}-${localNum}`,
          localId: localNum,
          name: i === 135 ? 'Charizard VMAX' : i === 19 ? 'Butterfree V' : `Pokémon Card ${i + 1}`,
          rarity: defaultRarity,
          image: getTCGDexValidAssetPath(normalizedId, localNum)
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
    const isSwshCleanId = cleanSetId.startsWith('s') && !cleanSetId.startsWith('sv') && !cleanSetId.startsWith('sm') && !cleanSetId.startsWith('sn');
    const scrydexId = isSwshCleanId ? `swsh${cleanSetId.slice(1)}` : cleanSetId;
    const cleanNum = numStr.replace(/^0+([1-9])/, '$1');
    return `https://images.scrydex.com/pokemon/${scrydexId}_ja-${cleanNum}/large`;
  }

  let seriesPrefix = 'swsh';
  let targetSetId = cleanSetId;

  if (cleanSetId.startsWith('me')) seriesPrefix = 'me';
  else if (cleanSetId.startsWith('sv')) {
    seriesPrefix = 'sv';
    const svLow = cleanSetId.toLowerCase();
    if (svLow === 'sv1') targetSetId = 'sv01';
    else if (svLow === 'sv2') targetSetId = 'sv02';
    else if (svLow === 'sv3') targetSetId = 'sv03';
    else if (svLow === 'sv3pt5' || svLow === 'sv3.5' || svLow === 'sv3pt5en') targetSetId = 'sv03.5';
    else if (svLow === 'sv4') targetSetId = 'sv04';
    else if (svLow === 'sv4pt5' || svLow === 'sv4.5') targetSetId = 'sv04.5';
    else if (svLow === 'sv5') targetSetId = 'sv05';
    else if (svLow === 'sv6') targetSetId = 'sv06';
    else if (svLow === 'sv6pt5' || svLow === 'sv6.5') targetSetId = 'sv06.5';
    else if (svLow === 'sv7') targetSetId = 'sv07';
    else if (svLow === 'sv8') targetSetId = 'sv08';
    else if (svLow === 'sv8pt5' || svLow === 'sv8.5') targetSetId = 'sv08.5';
  }
  else if (cleanSetId.startsWith('sm')) seriesPrefix = 'sm';
  else if (cleanSetId.startsWith('xy')) seriesPrefix = 'xy';
  else if (cleanSetId.startsWith('base')) seriesPrefix = 'base';
  else if (cleanSetId.startsWith('bw') || cleanSetId.startsWith('dv')) seriesPrefix = 'bw';
  else if (cleanSetId.startsWith('dp')) seriesPrefix = 'dp';
  else if (cleanSetId.startsWith('pl')) seriesPrefix = 'pl';
  else if (cleanSetId.startsWith('hgss')) seriesPrefix = 'hgss';
  else if (cleanSetId.startsWith('col')) seriesPrefix = 'col';
  else if (cleanSetId.startsWith('ex')) seriesPrefix = 'ex';

  if (targetSetId.startsWith('me') || targetSetId.startsWith('sv')) {
    numStr = numStr.padStart(3, '0');
  }
  return `https://assets.tcgdex.net/${langPrefix}/${seriesPrefix}/${targetSetId}/${numStr}`;
}

export function handleCardImageError(img: HTMLImageElement, setId = 'swsh3', rawNum: string | number = '1', onFailed?: () => void) {
  if (!img) return;
  const num = `${rawNum}`.trim();
  const sLow = setId.toLowerCase();

  // If energy card image failed or is missing, supply local era energy card image!
  if (img.src.includes('energy') || img.src.includes('Energy') || sLow.includes('eng') || num.includes('eng') || num.startsWith('E')) {
    img.src = '/packArts/ScarletAndViolet-Generation/SV-EnergyCards/1.webp';
    return;
  }
  const validAsset = getTCGDexValidAssetPath(setId, num);
  
  const isJapaneseSet = sLow.includes('_ja') || img.src.includes('_ja') || img.src.includes('/ja/');
  const cleanId = sLow.replace(/_ja$/i, '').replace(/_ja_ja$/i, '');
  const cleanAsset = getTCGDexValidAssetPath(cleanId, num);

  let paddedNum = num;
  if (cleanId.startsWith('me') || cleanId.startsWith('sv') || cleanId.startsWith('sm') || cleanId.startsWith('xy') || cleanId.startsWith('swsh') || cleanId.startsWith('s')) {
    paddedNum = num.padStart(3, '0');
  }

  const pokeIoSet = cleanId.replace(/^sv0?/, 'sv');

  // For SWSH sets: TCGDex uses s1w, s12a etc but Scrydex uses swsh1w, swsh12a etc
  const isSwshCleanId = cleanId.startsWith('s') && !cleanId.startsWith('sv') && !cleanId.startsWith('sm') && !cleanId.startsWith('sn');
  const swshScrydexId = isSwshCleanId ? `swsh${cleanId.slice(1)}` : cleanId;

  // Define comprehensive fallback chain of specific card scans for both modern and vintage sets
  // For Japanese sets we append the English-set equivalent (same localId) at the end: the
  // "_ja" scans generated for SWSH/SV/SM ids (e.g. swsh7_ja-215) do not exist on
  // Scrydex and return a placeholder card-back, so we must fall back to the real EN card.
  const specificFallbacks = (isJapaneseSet ? [
    `https://images.scrydex.com/pokemon/${swshScrydexId}_ja-${num}/large`,
    `https://images.scrydex.com/pokemon/${cleanId}_ja-${num}/large`,
    `https://images.pokemontcg.io/${cleanId === 'sv3pt5' || cleanId === 'sv2a' ? 'sv3pt5' : cleanId}/${num}_hires.png`,
    `https://images.pokemontcg.io/${cleanId === 'sv3pt5' || cleanId === 'sv2a' ? 'sv3pt5' : cleanId}/${num}.png`,
    `https://images.pokemontcg.io/${cleanId}/${num}_hires.png`,
    `https://images.pokemontcg.io/${cleanId}/${num}.png`
  ] : [
    `${validAsset}/high.webp`,
    `${validAsset}/high.png`,
    `${validAsset}/low.webp`,
    `${validAsset}/low.png`,
    `https://images.pokemontcg.io/${cleanId}/${num}_hires.png`,
    `https://images.pokemontcg.io/${cleanId}/${num}.png`,
    `https://images.pokemontcg.io/${pokeIoSet}/${num}_hires.png`,
    `https://images.pokemontcg.io/${pokeIoSet}/${num}.png`,
    `https://images.scrydex.com/pokemon/${setId}-${paddedNum}/large`,
    `https://images.scrydex.com/pokemon/${setId}-${num}/large`,
    `https://images.scrydex.com/pokemon/${cleanId}-${num}/large`,
    `https://images.scrydex.com/pokemon/${setId}-${paddedNum}/high.png`
  ]).concat(isJapaneseSet ? [
    // Graceful degradation: if every Japanese scan is missing, show the real
    // English-set card (same localId) rather than a placeholder card-back.
    `https://images.scrydex.com/pokemon/${cleanId}-${num}/large`,
    `https://images.pokemontcg.io/${cleanId}/${num}_hires.png`,
    `https://images.pokemontcg.io/${cleanId}/${num}.png`
  ] : []);

  // Generic fallback cards for Pack Opening view to avoid blank frames
  const genericBackups = isJapaneseSet ? [
    `https://images.scrydex.com/pokemon/swsh12a_ja-205/large`,
    `https://assets.tcgdex.net/ja/S/S12a/205/high.webp`,
    `https://images.scrydex.com/pokemon/sv2a_ja-201/large`,
    // np/47_hires.png returns HTTP 404 — use a guaranteed-valid card as last resort
    'https://images.pokemontcg.io/swsh3/19_hires.png'
  ] : [
    'https://images.pokemontcg.io/swsh3/19_hires.png'
  ];

  const fallbacks = onFailed ? specificFallbacks : [...specificFallbacks, ...genericBackups];

  const currentIndex = fallbacks.findIndex(url => img.src === url || img.src.includes(url));
  let nextAttempt = currentIndex === -1 ? 0 : currentIndex + 1;
  
  while (nextAttempt < fallbacks.length && (img.src === fallbacks[nextAttempt] || img.src.includes(fallbacks[nextAttempt]))) {
      nextAttempt++;
  }

  if (nextAttempt < fallbacks.length) {
     img.dataset.errorAttempt = nextAttempt.toString();
     const targetUrl = fallbacks[nextAttempt];
     img.src = targetUrl;
       if (targetUrl.includes('scrydex.com')) {
         fetch(targetUrl, { signal: AbortSignal.timeout(5000) })
           .then(r => r.ok ? r.arrayBuffer() : Promise.reject('not_ok'))
           .then(buf => {
             // scrydex serves HTTP 200 card-back placeholders at fixed byte sizes:
             // 186316 (English back) and 350441 (Japanese back).
             if (buf.byteLength === 186316 || buf.byteLength === 350441) {
               handleCardImageError(img, setId, rawNum, onFailed);
             }
           })
           .catch(() => {
             // If fetch fails or times out, assume placeholder/broken to prevent stalling
             handleCardImageError(img, setId, rawNum, onFailed);
           });
       }
  } else {
     if (onFailed) onFailed();
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

const OVERRIDE_CARD_PRICES: Record<string, number> = {
  "me4-1": 0.05,
  "me4-2": 0.08,
  "me4-3": 6.50,
  "me4-4": 0.10,
  "me4-5": 0.05,
  "me4-6": 0.08,
  "me4-7": 0.85,
  "me4-8": 0.06,
  "me4-9": 0.40,
  "me4-10": 2.50
};

const NAME_OVERRIDE_PRICES: Record<string, number> = {
  "Beedrill ex": 6.50,
  "Mega Pyroar ex": 1.25,
  "Mega Greninja ex": 1.75,
  "Mega Floette ex": 0.57,
  "Ho-Oh": 2.50,
  "Keldeo": 1.10,
  "Chesnaught": 0.85
};

export const getRealCardPrice = (poke: PokemonCard): number => {
  if (!poke) return 0.10;
  const isEnergy = (poke.name || '').toLowerCase().includes('energy') || (poke.id || '').toLowerCase().includes('energy');
  if (isEnergy) return 0.03;

  const isJapaneseCard = poke.id?.includes('_ja');

  if (poke.id && isJapaneseCard) {
    const rawSet = poke.id.split('-')[0] || '';
    const localNum = poke.localId || poke.id.split('-')[1] || '';
    const jaRealPrice = getJapaneseCardRealPrice(rawSet, localNum) ?? getJapaneseCardRealPrice(poke.id);
    if (jaRealPrice !== undefined && typeof jaRealPrice === 'number' && !isNaN(jaRealPrice) && jaRealPrice > 0) {
      return Number(jaRealPrice.toFixed(2));
    }
  }

  if (!isJapaneseCard && !cardFullCache.has(poke.id) && !poke.pricing && !poke.prices && !poke.tcgplayer?.prices && poke.id) {
    fetchCardFull(poke.id).catch(() => { });
  }
  const cached = cardFullCache.get(poke.id);
  const activePricing = cached?.pricing || (cached?.tcgplayer || cached?.cardmarket ? { tcgplayer: cached.tcgplayer, cardmarket: cached.cardmarket } : poke.pricing);

  const rawTcg = activePricing?.tcgplayer || cached?.tcgplayer || poke.tcgplayer;
  const tcg = rawTcg?.prices || (rawTcg && typeof rawTcg === 'object' && !rawTcg.url ? rawTcg : undefined);

  const rawCm = activePricing?.cardmarket || cached?.cardmarket || poke.cardmarket;
  const cm = rawCm?.prices || rawCm;

  if (tcg || cm) {
    let foundPrice = 0;

    let cmUsd = 0;
    if (cm) {
      const cmVal = cm.trendPrice ?? cm.averageSellPrice ?? cm.trend ?? cm.avg ?? cm['trend-holo'] ?? cm['avg-holo'] ?? cm.avg30 ?? cm.lowPrice ?? cm.low;
      if (typeof cmVal === 'number' && !isNaN(cmVal) && cmVal > 0) {
        cmUsd = cmVal * (cm.unit === 'EUR' || !cm.unit ? 1.08 : 1);
      }
    }

    if (tcg && typeof tcg === 'object') {
      const candidates: number[] = [];
      for (const key of Object.keys(tcg)) {
        if (typeof tcg[key] === 'object' && tcg[key] !== null) {
          const sub = tcg[key];
          const val = sub.marketPrice ?? sub.market ?? sub.midPrice ?? sub.mid ?? sub.lowPrice ?? sub.low ?? sub.highPrice ?? sub.high;
          if (typeof val === 'number' && !isNaN(val) && val > 0) {
            candidates.push(val);
          }
        }
      }

      if (candidates.length > 0) {
        if (poke.isReverseHolo && (tcg.reverseHolofoil || tcg.reverse)) {
          const rev = tcg.reverseHolofoil ?? tcg.reverse;
          const rVal = rev.marketPrice ?? rev.market ?? rev.midPrice ?? rev.lowPrice;
          foundPrice = (typeof rVal === 'number' && !isNaN(rVal) && rVal > 0) ? rVal : candidates[0];
        } else if (tcg.holofoil && typeof tcg.holofoil === 'object') {
          const hVal = tcg.holofoil.marketPrice ?? tcg.holofoil.market ?? tcg.holofoil.midPrice ?? tcg.holofoil.lowPrice;
          foundPrice = (typeof hVal === 'number' && !isNaN(hVal) && hVal > 0) ? hVal : candidates[0];
        } else if (tcg.normal && typeof tcg.normal === 'object') {
          const nVal = tcg.normal.marketPrice ?? tcg.normal.market ?? tcg.normal.midPrice ?? tcg.normal.lowPrice;
          foundPrice = (typeof nVal === 'number' && !isNaN(nVal) && nVal > 0) ? nVal : candidates[0];
        } else if (cmUsd > 0 && candidates.length > 1) {
          let minDelta = Infinity;
          for (const cand of candidates) {
            const delta = Math.abs(cand - cmUsd);
            if (delta < minDelta) {
              minDelta = delta;
              foundPrice = cand;
            }
          }
        } else {
          foundPrice = candidates[0];
        }
      }
    }

    if (foundPrice === 0 && cmUsd > 0) {
      foundPrice = cmUsd;
    }

    if (foundPrice > 0) return Number(foundPrice.toFixed(2));
  }

  if (Array.isArray(poke.prices) && poke.prices.length > 0) {
    let maxPrice = 0;
    for (const item of poke.prices) {
      if (item && typeof item === 'object') {
        const val = item.market ?? item.marketPrice ?? item.price ?? item.value ?? item.amount ?? item.mid ?? item.low;
        if (typeof val === 'number' && !isNaN(val) && val > maxPrice) {
          maxPrice = val;
        }
      } else if (typeof item === 'number' && !isNaN(item) && item > maxPrice) {
        maxPrice = item;
      }
    }
    if (maxPrice > 0) return Number(maxPrice.toFixed(2));
  }

  if (poke.tcgplayer?.prices) {
    const p = poke.tcgplayer.prices as Record<string, any>;
    let maxPrice = 0;
    for (const key of Object.keys(p)) {
      const sub = p[key];
      if (sub && typeof sub === 'object') {
        const val = sub.market ?? sub.mid ?? sub.low;
        if (typeof val === 'number' && !isNaN(val) && val > maxPrice) {
          maxPrice = val;
        }
      }
    }
    if (maxPrice > 0) return Number(maxPrice.toFixed(2));
  }

  if (OVERRIDE_CARD_PRICES[poke.id]) return OVERRIDE_CARD_PRICES[poke.id];
  if (NAME_OVERRIDE_PRICES[poke.name]) return NAME_OVERRIDE_PRICES[poke.name];

  let hash = 0;
  const str = poke.id || poke.name || 'card';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const normalizedHash = Math.abs(hash) % 100 / 100;

  const isExOrMega = poke.name?.includes('ex') || poke.name?.includes('MEGA') || poke.name?.includes('VMAX') || poke.name?.includes('VSTAR');
  const rarity = poke.rarity || '';

  if (isEnergy || rarity.includes('Common') || rarity.includes('Uncommon') || !rarity) {
    return Number((0.01 + Math.random() * 0.09).toFixed(2));
  }

  const isHolyGrailName = /Charizard|Pikachu|Umbreon|Rayquaza|Giratina|Mewtwo|Lugia|Gengar|Blastoise|Venusaur|Mew/i.test(poke.name || '');
  const isSecretOrAlt = rarity.includes('Secret') || rarity.includes('Special Illustration') || rarity.includes('Hyper') || rarity.includes('Rainbow') || rarity.includes('Gold');
  const isUltraOrEx = isExOrMega || rarity.includes('ex') || rarity.includes('VMAX') || rarity.includes('VSTAR') || rarity.includes('Ultra');

  if (isHolyGrailName && (isSecretOrAlt || isUltraOrEx)) {
    return Number((30.00 + normalizedHash * 60.00).toFixed(2));
  } else if (isSecretOrAlt) {
    return Number((15.00 + normalizedHash * 30.00).toFixed(2));
  } else if (isHolyGrailName || isUltraOrEx || rarity.includes('Double Rare')) {
    return Number((2.00 + normalizedHash * 8.00).toFixed(2));
  } else if (rarity.includes('Rare') || rarity.includes('Illustration') || rarity.includes('Holo')) {
    return Number((0.50 + normalizedHash * 2.50).toFixed(2));
  } else {
    return Number((0.01 + Math.random() * 0.09).toFixed(2));
  }
};

export function formatAndSortPackCards(newCards: PokemonCard[]) {
  const formatted = newCards.map((poke, idx) => ({
    id: `${poke.id || 'card'}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
    originalIndex: idx,
    value: getRealCardPrice(poke),
    pokemon: poke
  }));
  const energyIdx = formatted.findIndex(c => c.pokemon.name?.toLowerCase().includes('energy') || c.pokemon.id?.toLowerCase().includes('energy'));
  if (energyIdx > 0) {
    const [energyCard] = formatted.splice(energyIdx, 1);
    formatted.unshift(energyCard);
  }
  let maxIdx = 0;
  let maxVal = formatted[0]?.value || 0;
  for (let i = 1; i < formatted.length; i++) {
    if (formatted[i].value >= maxVal) {
      maxVal = formatted[i].value;
      maxIdx = i;
    }
  }
  if (maxIdx !== formatted.length - 1 && formatted.length > 1) {
    const [mostExpensive] = formatted.splice(maxIdx, 1);
    formatted.push(mostExpensive);
  }
  formatted.reverse();
  return formatted.map((c, idx) => ({ ...c, originalIndex: idx }));
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
    { id: "base-eng-1", localId: "E01", name: "Basic Grass Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/1.webp" },
    { id: "base-eng-2", localId: "E02", name: "Basic Fire Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/2.webp" },
    { id: "base-eng-3", localId: "E03", name: "Basic Water Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/3.webp" },
    { id: "base-eng-4", localId: "E04", name: "Basic Lightning Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/4.webp" },
    { id: "base-eng-5", localId: "E05", name: "Basic Psychic Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/5.webp" },
    { id: "base-eng-6", localId: "E06", name: "Basic Fighting Energy", image: "/packArts/SwordAndShield-Generation/SS-EnergyCards/6.webp" }
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

// ===================== English Booster Box =====================
// Real booster boxes ship with a guaranteed hit distribution across the whole
// box. We seed an entire box once per set, then consume one pack per open so
// the user experiences authentic box-level variance (instead of an independent
// re-roll every pack that can produce impossible streaks).
export interface EnglishBoxSlotData {
  summary: TCGDexCardSummary;
  isReverseHolo?: boolean;
  defaultRarity: string;
}
export interface EnglishBoxPackData {
  slots: EnglishBoxSlotData[];
}
interface EnglishBoxCacheEntry {
  index: number;
  packs: EnglishBoxPackData[];
}

const englishBoxCache = new Map<string, EnglishBoxCacheEntry>();

export function resetEnglishBox(setId: string): void {
  englishBoxCache.delete(setId);
}
export function getEnglishBoxStatus(setId: string): { totalPacks: number; openedPacks: number; remainingPacks: number; era: string } | null {
  const b = englishBoxCache.get(setId);
  if (!b) return null;
  return { totalPacks: b.packs.length, openedPacks: b.index, remainingPacks: b.packs.length - b.index, era: '' };
}

interface EnglishBoxParams {
  set: TCGDexSet;
  pool: TCGDexCardSummary[];
  currentEra: EnergyEra;
  boxEra: 'sv' | 'me' | 'swsh' | 'sm' | 'xy' | 'base';
  commonPool: TCGDexCardSummary[];
  uncommonPool: TCGDexCardSummary[];
  nonHoloRarePool: TCGDexCardSummary[];
  holoRarePool: TCGDexCardSummary[];
  vPool: TCGDexCardSummary[];
  fullArtPool: TCGDexCardSummary[];
  vmaxPool: TCGDexCardSummary[];
  rainbowSecretPool: TCGDexCardSummary[];
  goldSecretPool: TCGDexCardSummary[];
  irPool: TCGDexCardSummary[];
  sirPool: TCGDexCardSummary[];
  prismStarPool: TCGDexCardSummary[];
  characterRarePool: TCGDexCardSummary[];
  galleryPool: TCGDexCardSummary[];
  reverseHoloPool: TCGDexCardSummary[];
  breakPool: TCGDexCardSummary[];
  isCosmicEclipse: boolean;
  isShinyVaultSet: boolean;
  isTrainerGallerySet: boolean;
  isCrownZenith: boolean;
}

const pickUniform = <T,>(arr?: T[] | null): T | null =>
  arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

function seedPick(pool: TCGDexCardSummary[], fallbacks: TCGDexCardSummary[][] = []): TCGDexCardSummary | null {
  let c = pickUniform(pool);
  if (c) return c;
  for (const fb of fallbacks) {
    c = pickUniform(fb);
    if (c) return c;
  }
  return pickUniform(pool.length ? pool : fallbacks.flat());
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Builds a full booster box: seeds the hit/special slots with guaranteed
// per-box counts, then assembles each pack with fixed structure.
export async function buildEnglishPacks(p: EnglishBoxParams): Promise<EnglishBoxPackData[]> {
  const packsPerBox = 36;
  const { pool, currentEra, boxEra } = p;

  // ---- Per-pack pull-rate model (realistic odds) --------------------------
  // Previously the box was pre-seeded with a fixed count of guaranteed chase
  // cards (e.g. 1 gold + 1 SIR + 2 IR + 2 FA + 5 ex per 36 packs). Because a
  // user only opens a handful of packs, shuffle variance regularly front-loaded
  // several of those expensive guarantees into the first few packs — the "hits
  // after hits / hundreds of dollars" bug. Instead, each pack now rolls its hit
  // slot independently against realistic per-pack odds, so most packs top out at
  // a Holo Rare and true chase cards stay genuinely rare.
  interface HitTier { p: number; label: string; pool: TCGDexCardSummary[]; fb: TCGDexCardSummary[][]; }

  let hitTable: HitTier[];
  let defaultTier: { label: string; pool: TCGDexCardSummary[]; fb: TCGDexCardSummary[][] };

  if (boxEra === 'sv' || boxEra === 'me') {
    hitTable = [
      { p: 0.008, label: 'Hyper Rare (Gold)', pool: p.goldSecretPool, fb: [p.fullArtPool, p.vPool, p.holoRarePool] },
      { p: 0.03, label: 'Special Illustration Rare', pool: p.sirPool, fb: [p.irPool, p.fullArtPool, p.vPool, p.holoRarePool] },
      { p: 0.06, label: 'Ultra Rare (Full Art)', pool: p.fullArtPool, fb: [p.irPool, p.vPool, p.holoRarePool] },
      { p: 0.10, label: 'Illustration Rare', pool: p.irPool, fb: [p.fullArtPool, p.vPool, p.holoRarePool] },
      { p: 0.17, label: 'Double Rare (ex)', pool: p.vPool, fb: [p.fullArtPool, p.holoRarePool, p.nonHoloRarePool] },
    ];
    defaultTier = { label: 'Holo Rare', pool: p.holoRarePool, fb: [p.nonHoloRarePool, p.vPool, pool] };
  } else if (boxEra === 'swsh') {
    hitTable = [
      { p: 0.007, label: 'Gold Secret Rare', pool: p.goldSecretPool, fb: [p.rainbowSecretPool, p.fullArtPool, p.vmaxPool, p.vPool, p.holoRarePool] },
      { p: 0.015, label: 'Rainbow Rare', pool: p.rainbowSecretPool, fb: [p.goldSecretPool, p.fullArtPool, p.vmaxPool, p.vPool, p.holoRarePool] },
      { p: 0.05, label: 'Full Art', pool: p.fullArtPool, fb: [p.vmaxPool, p.vPool, p.holoRarePool, p.nonHoloRarePool] },
      { p: 0.08, label: 'Pokémon VMAX / VSTAR', pool: p.vmaxPool, fb: [p.vPool, p.fullArtPool, p.holoRarePool, p.nonHoloRarePool] },
      { p: 0.14, label: 'Pokémon V', pool: p.vPool, fb: [p.vmaxPool, p.fullArtPool, p.holoRarePool, p.nonHoloRarePool] },
    ];
    defaultTier = { label: 'Holo Rare', pool: p.holoRarePool, fb: [p.nonHoloRarePool, p.vPool, pool] };
  } else if (boxEra === 'sm') {
    hitTable = [
      { p: 0.008, label: 'Secret Rare', pool: p.goldSecretPool, fb: [p.rainbowSecretPool, p.fullArtPool, p.vPool, p.holoRarePool] },
      { p: 0.015, label: 'Rainbow Rare', pool: p.rainbowSecretPool, fb: [p.goldSecretPool, p.fullArtPool, p.vPool, p.holoRarePool] },
      { p: 0.06, label: 'Full Art', pool: p.fullArtPool, fb: [p.vPool, p.holoRarePool, p.nonHoloRarePool] },
      { p: 0.12, label: 'Pokémon-GX', pool: p.vPool, fb: [p.fullArtPool, p.holoRarePool, p.nonHoloRarePool] },
    ];
    defaultTier = { label: 'Holo Rare', pool: p.holoRarePool, fb: [p.nonHoloRarePool, p.vPool, pool] };
  } else if (boxEra === 'xy') {
    hitTable = [
      { p: 0.01, label: 'Secret Rare', pool: p.goldSecretPool, fb: [p.rainbowSecretPool, p.fullArtPool, p.vPool, p.holoRarePool] },
      { p: 0.05, label: 'Full Art EX', pool: p.fullArtPool, fb: [p.vPool, p.holoRarePool, p.nonHoloRarePool] },
      { p: 0.08, label: 'Pokémon EX', pool: p.vPool, fb: [p.fullArtPool, p.holoRarePool, p.nonHoloRarePool] },
      { p: 0.04, label: 'Pokémon BREAK', pool: p.breakPool, fb: [p.vPool, p.holoRarePool, p.nonHoloRarePool] },
    ];
    defaultTier = { label: 'Holo Rare', pool: p.holoRarePool, fb: [p.nonHoloRarePool, p.vPool, pool] };
  } else {
    // Base / vintage: ~1/200 secret, ~1/3 holo rare, otherwise non-holo rare
    hitTable = [
      { p: 0.005, label: 'Secret Rare', pool: p.goldSecretPool, fb: [p.holoRarePool, p.nonHoloRarePool, pool] },
      { p: 0.33, label: 'Holo Rare', pool: p.holoRarePool, fb: [p.nonHoloRarePool, pool] },
    ];
    defaultTier = { label: 'Non-Holo Rare', pool: p.nonHoloRarePool, fb: [p.holoRarePool, pool] };
  }

  type PoolPicker = (pl: TCGDexCardSummary[], fb?: TCGDexCardSummary[][]) => TCGDexCardSummary;

  const rollHit = (getFromPool: PoolPicker): EnglishBoxSlotData => {
    const roll = Math.random();
    let cum = 0;
    for (const t of hitTable) {
      cum += t.p;
      if (roll < cum) {
        if (t.pool.length === 0) break; // set has no cards of this tier → degrade to default
        return { summary: getFromPool(t.pool, t.fb), defaultRarity: t.label };
      }
    }
    return { summary: getFromPool(defaultTier.pool, defaultTier.fb), defaultRarity: defaultTier.label };
  };

  const rollSpecial = (getFromPool: PoolPicker): EnglishBoxSlotData => {
    if (boxEra === 'swsh') {
      if ((p.isTrainerGallerySet || p.isShinyVaultSet) && p.galleryPool.length > 0 && Math.random() < 0.12) {
        return { summary: getFromPool(p.galleryPool, [p.reverseHoloPool, pool]), defaultRarity: p.isShinyVaultSet ? 'Shiny Vault' : 'Trainer Gallery', isReverseHolo: true };
      }
    } else if (boxEra === 'sm') {
      if (p.isCosmicEclipse && p.characterRarePool.length > 0 && Math.random() < 0.08) {
        return { summary: getFromPool(p.characterRarePool, [p.reverseHoloPool, pool]), defaultRarity: 'Character Rare (CHR)', isReverseHolo: true };
      }
      if (p.prismStarPool.length > 0 && Math.random() < 0.08) {
        return { summary: getFromPool(p.prismStarPool, [p.reverseHoloPool, pool]), defaultRarity: 'Prism Star ♢', isReverseHolo: true };
      }
      if (p.galleryPool.length > 0 && Math.random() < 0.10) {
        return { summary: getFromPool(p.galleryPool, [p.reverseHoloPool, pool]), defaultRarity: 'Shiny Vault', isReverseHolo: true };
      }
    }
    return { summary: getFromPool(p.reverseHoloPool, [pool]), defaultRarity: 'Reverse Holo', isReverseHolo: true };
  };

  const packs: EnglishBoxPackData[] = [];
  const commonCount = boxEra === 'base' ? 5 : 4;
  const hasSpecialSlot = boxEra === 'sm' || boxEra === 'swsh';

  for (let idx = 0; idx < packsPerBox; idx++) {
    const pickedIds = new Set<string>();
    const pickedNames = new Set<string>();

    const getFromPool = (pl: TCGDexCardSummary[], fallbacks: TCGDexCardSummary[][] = []): TCGDexCardSummary => {
      const pickUnique = (cands: TCGDexCardSummary[]): TCGDexCardSummary | null => {
        if (!cands || cands.length === 0) return null;
        const unpicked = cands.filter(c => !pickedIds.has(c.id) && !pickedNames.has(c.name) && !c.name.includes('Energy'));
        if (unpicked.length > 0) return unpicked[Math.floor(Math.random() * unpicked.length)];
        return null;
      };
      const primary = pickUnique(pl);
      if (primary) { pickedIds.add(primary.id); pickedNames.add(primary.name); return primary; }
      for (const fb of fallbacks) {
        const f = pickUnique(fb);
        if (f) { pickedIds.add(f.id); pickedNames.add(f.name); return f; }
      }
      const remaining = pool.filter(c => !pickedIds.has(c.id) && !pickedNames.has(c.name));
      if (remaining.length > 0) {
        const c = remaining[Math.floor(Math.random() * remaining.length)];
        pickedIds.add(c.id); pickedNames.add(c.name); return c;
      }
      const base = pool[Math.floor(Math.random() * pool.length)] || { id: `${p.set.id}-fb`, localId: '1', name: 'Pokémon Card', image: `https://assets.tcgdex.net/en/${p.set.id}/1` };
      const uid = `${base.id}-alt-${pickedIds.size + 1}`;
      const un = `${base.name} (Alt #${pickedIds.size + 1})`;
      pickedIds.add(uid); pickedNames.add(un);
      return { ...base, id: uid, name: un } as TCGDexCardSummary;
    };

    const slots: EnglishBoxSlotData[] = [];

    // Slot 1: Basic Energy (with occasional reverse / textured foil)
    const energy = await fetchBasicEnergyCard(currentEra);
    if ((boxEra === 'sv' || boxEra === 'me') && Math.random() < 0.15) {
      slots.push({ summary: energy, isReverseHolo: true, defaultRarity: 'Reverse Holo Energy' });
    } else if (p.isCrownZenith && Math.random() < 0.20) {
      slots.push({ summary: energy, isReverseHolo: true, defaultRarity: 'Textured Foil Energy' });
    } else {
      slots.push({ summary: energy, defaultRarity: 'Basic Energy' });
    }
    pickedIds.add(energy.id); pickedNames.add(energy.name);

    // Commons
    for (let i = 0; i < commonCount; i++) {
      slots.push({ summary: getFromPool(p.commonPool, [[...p.uncommonPool, ...pool]]), defaultRarity: 'Common' });
    }
    // Uncommons
    for (let i = 0; i < 3; i++) {
      slots.push({ summary: getFromPool(p.uncommonPool, [p.commonPool, pool]), defaultRarity: 'Uncommon' });
    }

    if (boxEra === 'base') {
      const trainerPool = pool.filter(c => c.name.includes('Energy') || c.name.includes('Trainer') || c.name.includes('Professor') || c.name.includes('Bill') || c.name.includes('Potion'));
      if (Math.random() < 0.35 || trainerPool.length === 0) {
        const e2 = await fetchBasicEnergyCard('base');
        slots.push({ summary: e2, defaultRarity: 'Basic Energy' });
        pickedIds.add(e2.id);
      } else {
        const t = getFromPool(trainerPool, [p.uncommonPool, p.commonPool, pool]);
        slots.push({ summary: t, defaultRarity: 'Trainer / Energy' });
      }
    } else if (hasSpecialSlot) {
      const sp = rollSpecial(getFromPool);
      slots.push(sp);
      if (sp.summary) { pickedIds.add(sp.summary.id); pickedNames.add(sp.summary.name); }
    } else {
      const rh = getFromPool(p.reverseHoloPool, [pool]);
      slots.push({ summary: rh, isReverseHolo: true, defaultRarity: 'Reverse Holo' });
    }

    // Rare-or-better hit slot — tier rolled per pack against realistic odds
    const hit = rollHit(getFromPool);
    slots.push(hit);
    if (hit.summary) { pickedIds.add(hit.summary.id); pickedNames.add(hit.summary.name); }

    packs.push({ slots });
  }

  return packs;
}

export async function generatePackFromSet(set: TCGDexSet, _count = 11): Promise<PokemonCard[]> {
  const pool = (set.cards || []).filter(c => Boolean(c.image) && !c.name.includes('Energy'));
  if (pool.length === 0) {
    throw new Error('No cards with images found in this set');
  }

  // Ensure real market prices are loaded so chase cards can be weighted by value.
  await loadJapaneseMetadata();

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
  const isBaseEra = setIdLower.startsWith('base') || setIdLower.startsWith('hgss') || setIdLower.startsWith('dp') || setIdLower.startsWith('pl') || setIdLower.startsWith('bw') || setIdLower.startsWith('ex') || setIdLower.startsWith('neo') || setIdLower.startsWith('gym') || setIdLower.startsWith('ecard') || setIdLower === 'bs1' || setIdLower === 'bs2' || setIdLower === 'ju' || setIdLower === 'fo' || setIdLower === 'tr' || setIdLower === 'col' || setNameLower.includes('base set') || setNameLower.includes('jungle') || setNameLower.includes('fossil') || setNameLower.includes('team rocket') || setNameLower.includes('heartgold') || setNameLower.includes('soulsilver') || setNameLower.includes('diamond') || setNameLower.includes('pearl') || setNameLower.includes('platinum') || setNameLower.includes('black & white') || setNameLower.includes('black and white') || setNameLower.includes('call of legends');

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
    // Non-blocking background fetch to populate cache for future draws
    Promise.all([
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Common`, 1500).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Uncommon`, 1500).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Rare`, 1500).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Rare Holo`, 1500).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Ultra Rare`, 1500).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithTimeout(`${API_BASE}/cards?set.id=${baseIdForRarity}&rarity=Secret Rare`, 1500).then(r => r.ok ? r.json() : []).catch(() => []),
      gallerySetId ? fetchWithTimeout(`${API_BASE}/sets/${gallerySetId}`, 1500).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null)
    ]).then(data => {
      if ((data[0] && data[0].length > 0) || (data[1] && data[1].length > 0)) {
        rarityPoolCache.set(cacheKey, data);
      }
    }).catch(() => { });

    // Instantly categorize cards from `pool` (set.cards) for 0ms pack generation
    const cList: any[] = [];
    const uList: any[] = [];
    const rList: any[] = [];
    const hList: any[] = [];
    const urList: any[] = [];
    const srList: any[] = [];

    const totalPool = pool.length;
    pool.forEach((c, idx) => {
      const r = (c.rarity || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      if (r.includes('secret') || r.includes('illustration') || r.includes('hyper') || r.includes('gold') || r.includes('rainbow')) {
        srList.push(c);
      } else if (r.includes('ultra') || r.includes('ex') || n.includes('ex') || n.includes('vmax') || n.includes('vstar') || n.includes('mega')) {
        urList.push(c);
      } else if (r.includes('holo') || r.includes('rare')) {
        hList.push(c);
      } else if (r.includes('uncommon') || (idx > totalPool * 0.5 && idx <= totalPool * 0.8)) {
        uList.push(c);
      } else {
        cList.push(c);
      }
    });

    rarityData = [cList, uList, rList, hList, urList, srList, null];
    rarityPoolCache.set(cacheKey, rarityData);
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

      // Distinguish into the exact 7 tiers (prefer the TCGDex rarity field,
      // fall back to name heuristics so mislabeled cards still land correctly)
      const rarityField = (card.rarity || '').toLowerCase();
      if (secretRareIds.has(card.id) || isSecretNumber || rarityField.includes('secret') || rarityField.includes('gold') || rarityField.includes('hyper') || rarityField.includes('rainbow')) {
        if (card.name.includes('Gold') || card.name.includes('Energy') || card.name.includes('Patch') || card.name.includes('Parasol') || rarityField.includes('gold') || rarityField.includes('hyper') || num >= officialCount + 9) {
          goldSecretPool.push(card);
        } else {
          rainbowSecretPool.push(card);
        }
      } else if (card.name.includes('VMAX') || card.name.includes('VSTAR') || rarityField.includes('vmax') || rarityField.includes('vstar')) {
        vmaxPool.push(card);
      } else if (ultraRareIds.has(card.id) || rarityField.includes('ultra rare') || (num > officialCount - 15 && !card.name.includes(' V'))) {
        fullArtPool.push(card);
      } else if (card.name.includes(' V') || card.name.includes(' ex') || card.name.includes(' GX') || card.name.includes(' EX') || rarityField.includes('double rare')) {
        vPool.push(card);
      } else if (holoRareIds.has(card.id) || rarityField.includes('rare holo') || rarityField.includes('holo rare')) {
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

  // ---- Box-seeded booster box: build the whole box once per set, then
  //      consume one pack per open so the user experiences authentic
  //      box-level hit distribution & variance (no impossible streaks). ----
  const boxEra: 'sv' | 'me' | 'swsh' | 'sm' | 'xy' | 'base' =
    isMEEra ? 'me' : isSVEra ? 'sv' : isSMEra ? 'sm' : isXYEra ? 'xy' : isBaseEra ? 'base' : 'swsh';

  const boxKey = set.id;
  let boxEntry = englishBoxCache.get(boxKey);
  if (!boxEntry || boxEntry.index >= boxEntry.packs.length) {
    const packs = await buildEnglishPacks({
      set,
      pool,
      currentEra,
      boxEra,
      commonPool,
      uncommonPool,
      nonHoloRarePool,
      holoRarePool,
      vPool,
      fullArtPool,
      vmaxPool,
      rainbowSecretPool,
      goldSecretPool,
      irPool,
      sirPool,
      prismStarPool,
      characterRarePool,
      galleryPool,
      reverseHoloPool,
      breakPool,
      isCosmicEclipse,
      isShinyVaultSet,
      isTrainerGallerySet,
      isCrownZenith,
    });
    boxEntry = { index: 0, packs };
    englishBoxCache.set(boxKey, boxEntry);
  }

  const selectedSlots: EnglishBoxSlotData[] = boxEntry.packs[boxEntry.index++].slots;

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

    // Conservative PLACEHOLDER pricing shown only until real market data warms in
    // via fetchCardFull(). Kept modest & tier-consistent so it never inflates the
    // session total; real values override it (usually upward) once loaded.
    let marketPrice = 0.15;
    const r = (slot.defaultRarity || '').toLowerCase();
    if (r.includes('secret') || r.includes('rainbow') || r.includes('gold') || r.includes('hyper') || r.includes('special illustration')) marketPrice = 8 + Math.random() * 22;      // ~$8–30
    else if (r.includes('illustration')) marketPrice = 4 + Math.random() * 12;                                                                                                          // ~$4–16
    else if (r.includes('full art') || r.includes('ultra') || r.includes('vmax') || r.includes('vstar') || r.includes(' gx') || r.includes('character super')) marketPrice = 3 + Math.random() * 9; // ~$3–12
    else if (r.includes('double rare') || r.includes('(ex)') || r.includes(' ex') || r.includes(' v') || r.includes('prism') || r.includes('character')) marketPrice = 1.5 + Math.random() * 4.5;   // ~$1.5–6
    else if (r.includes('reverse')) marketPrice = 0.25 + Math.random() * 0.75;                                                                                                          // ~$0.25–1
    else if (r.includes('holo') || r.includes('gallery') || r.includes('shiny vault')) marketPrice = 0.5 + Math.random() * 2;                                                           // ~$0.5–2.5
    else if (r.includes('uncommon')) marketPrice = 0.1 + Math.random() * 0.2;                                                                                                           // ~$0.1–0.3
    else marketPrice = 0.03 + Math.random() * 0.09;                                                                                                                                     // ~$0.03–0.12
    marketPrice = Number(marketPrice.toFixed(2));

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
