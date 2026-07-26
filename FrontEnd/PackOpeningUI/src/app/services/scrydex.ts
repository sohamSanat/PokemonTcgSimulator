import { TCGDexCardSummary, TCGDexSet, PokemonCard, TCGDexCardFull, TCGDexSeries, TCGDexSetSummary, getJapaneseVintageCardImageUrl } from './tcgdex';

export const getScrydexApiBase = () => `https://api.scrydex.com/pokemon/v1/ja`;

const scrydexSetCache = new Map<string, TCGDexSet>();
export const scrydexCardFullCache = new Map<string, TCGDexCardFull>();
export const onScrydexCardFullCacheUpdated = new Set<() => void>();

const SCRYDEX_API_BASE = 'https://api.scrydex.com/pokemon/v1';

let jaSetsCache: Array<{ id: string; name: string; cardCount: { total: number; official: number } }> | null = null;
let jaEnNamesCache: Record<string, string> | null = null;
export let jaCardNamesCache: Record<string, string> | null = null;
let pokeSpeciesDictCache: Record<string, string> | null = null;
export let jaCardPricesCache: Record<string, number> | null = null;
export let enCardPricesCache: Record<string, number> | null = null;
export let jaTopCardsCache: any[] | null = null;

let metadataLoadingPromise: Promise<void> | null = null;

export async function loadJapaneseMetadata(): Promise<void> {
  if (jaSetsCache && jaEnNamesCache && jaCardPricesCache && jaTopCardsCache) {
    return;
  }
  if (metadataLoadingPromise) {
    return metadataLoadingPromise;
  }

  metadataLoadingPromise = (async () => {
    const rawBase = import.meta.env.BASE_URL || '/';
    const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

    // Phase 1: High priority lightweight sets and name mappings (needed immediately for series selection)
    const setsPromise = jaSetsCache
      ? Promise.resolve()
      : fetch(`${base}ja-sets.json`)
          .then(res => res.ok ? res.json() : [])
          .then(data => { jaSetsCache = data; })
          .catch(e => console.error('Failed to load ja-sets.json:', e));

    const enNamesPromise = jaEnNamesCache
      ? Promise.resolve()
      : fetch(`${base}ja-en-names.json`)
          .then(res => res.ok ? res.json() : {})
          .then(data => { jaEnNamesCache = data; })
          .catch(e => console.error('Failed to load ja-en-names.json:', e));

    // Wait for critical sets/names to resolve first so UI doesn't stall
    await Promise.all([setsPromise, enNamesPromise]);

    // Phase 2: Parallel fetch of heavier card metadata
    const topCardsPromise = jaTopCardsCache
      ? Promise.resolve()
      : fetch(`${base}ja-top-cards.json`)
          .then(res => res.ok ? res.json() : [])
          .then(rawCache => {
            const seenJaIds = new Set<string>();
            const cleaned: any[] = [];
            if (Array.isArray(rawCache)) {
              for (const c of rawCache) {
                if (!c || !c.id) continue;
                const isScrydex = c.img && c.img.includes('scrydex.com');
                const hasJa = c.id.includes('_ja');
                const isVint = c.id.startsWith('base') || c.id.startsWith('neo') || c.id.startsWith('fo') || c.id.startsWith('ju');
                if (isScrydex && !hasJa && !isVint) {
                  const parts = c.id.split('-');
                  if (parts.length >= 2) {
                    const setCode = parts[0];
                    const numCode = parts.slice(1).join('-');
                    const jaId = `${setCode}_ja-${numCode}`;
                    if (seenJaIds.has(jaId)) continue;
                    seenJaIds.add(jaId);
                    cleaned.push({
                      ...c,
                      id: jaId,
                      setId: `${setCode}_ja`,
                      img: c.img.replace(`/pokemon/${setCode}-${numCode}`, `/pokemon/${setCode}_ja-${numCode}`)
                    });
                    continue;
                  }
                }
                if (!seenJaIds.has(c.id)) {
                  seenJaIds.add(c.id);
                  cleaned.push(c);
                }
              }
            }
            jaTopCardsCache = cleaned;
          })
          .catch(e => console.error('Failed to load ja-top-cards.json:', e));

    const cardNamesPromise = (jaCardNamesCache && Object.keys(jaCardNamesCache).length > 0)
      ? Promise.resolve()
      : fetch(`${base}ja-card-names.json`)
          .then(res => res.ok ? res.json() : {})
          .then(data => { if (Object.keys(data).length > 0) jaCardNamesCache = data; })
          .catch(e => console.error('Failed to load ja-card-names.json:', e));

    const jaPricesPromise = (jaCardPricesCache && Object.keys(jaCardPricesCache).length > 0)
      ? Promise.resolve()
      : fetch(`${base}ja-card-prices.json`)
          .then(res => res.ok ? res.json() : {})
          .then(data => { if (Object.keys(data).length > 0) jaCardPricesCache = data; })
          .catch(e => console.error('Failed to load ja-card-prices.json:', e));

    const enPricesPromise = (enCardPricesCache && Object.keys(enCardPricesCache).length > 0)
      ? Promise.resolve()
      : fetch(`${base}en-card-prices.json`)
          .then(res => res.ok ? res.json() : {})
          .then(data => { if (Object.keys(data).length > 0) enCardPricesCache = data; })
          .catch(e => console.error('Failed to load en-card-prices.json:', e));

    await Promise.all([topCardsPromise, cardNamesPromise, jaPricesPromise, enPricesPromise]);

    if (!jaSetsCache) jaSetsCache = [];
    if (!jaEnNamesCache) jaEnNamesCache = {};
    if (!jaCardNamesCache) jaCardNamesCache = {};
    if (!pokeSpeciesDictCache) pokeSpeciesDictCache = {};
    if (!jaCardPricesCache) jaCardPricesCache = {};
    if (!enCardPricesCache) enCardPricesCache = {};
    if (!jaTopCardsCache) jaTopCardsCache = [];
  })().finally(() => {
    metadataLoadingPromise = null;
  });

  return metadataLoadingPromise;
}

export function getJapaneseCardRealPrice(setIdOrKey: string, localIdOrNum?: string | number): number | undefined {
  if (!jaCardPricesCache) return undefined;
  if (!localIdOrNum) {
    if (jaCardPricesCache[setIdOrKey] !== undefined) return jaCardPricesCache[setIdOrKey];
    const raw = setIdOrKey.replace(/_ja$/i, '').toLowerCase();
    if (jaCardPricesCache[raw] !== undefined) return jaCardPricesCache[raw];
    
    // Attempt swsh vs s conversion for single keys if formatted like s8b-180
    const parts = raw.split('-');
    if (parts.length === 2) {
      const setPrefix = parts[0];
      const num = parts[1];
      if (setPrefix.startsWith('s') && !setPrefix.startsWith('sv') && !setPrefix.startsWith('sm') && !setPrefix.startsWith('sn')) {
        const swshPrefix = 'swsh' + setPrefix.slice(1);
        if (jaCardPricesCache[`${swshPrefix}-${num}`] !== undefined) return jaCardPricesCache[`${swshPrefix}-${num}`];
        if (jaCardPricesCache[`${swshPrefix}_ja-${num}`] !== undefined) return jaCardPricesCache[`${swshPrefix}_ja-${num}`];
      }
      if (setPrefix.startsWith('swsh')) {
        const sPrefix = 's' + setPrefix.slice(4);
        if (jaCardPricesCache[`${sPrefix}-${num}`] !== undefined) return jaCardPricesCache[`${sPrefix}-${num}`];
        if (jaCardPricesCache[`${sPrefix}_ja-${num}`] !== undefined) return jaCardPricesCache[`${sPrefix}_ja-${num}`];
      }
    }
    return undefined;
  }
  const num = localIdOrNum.toString().trim();
  const rawId = setIdOrKey.replace(/_ja$/i, '').toLowerCase();
  
  if (jaCardPricesCache[`${rawId}-${num}`] !== undefined) return jaCardPricesCache[`${rawId}-${num}`];
  if (jaCardPricesCache[`${rawId}_ja-${num}`] !== undefined) return jaCardPricesCache[`${rawId}_ja-${num}`];
  if (jaCardPricesCache[`${setIdOrKey.toLowerCase()}-${num}`] !== undefined) return jaCardPricesCache[`${setIdOrKey.toLowerCase()}-${num}`];
  
  // SWSH vs S prefix fallback
  if (rawId.startsWith('s') && !rawId.startsWith('sv') && !rawId.startsWith('sm') && !rawId.startsWith('sn')) {
    const swshPrefix = 'swsh' + rawId.slice(1);
    if (jaCardPricesCache[`${swshPrefix}-${num}`] !== undefined) return jaCardPricesCache[`${swshPrefix}-${num}`];
    if (jaCardPricesCache[`${swshPrefix}_ja-${num}`] !== undefined) return jaCardPricesCache[`${swshPrefix}_ja-${num}`];
  }
  if (rawId.startsWith('swsh')) {
    const sPrefix = 's' + rawId.slice(4);
    if (jaCardPricesCache[`${sPrefix}-${num}`] !== undefined) return jaCardPricesCache[`${sPrefix}-${num}`];
    if (jaCardPricesCache[`${sPrefix}_ja-${num}`] !== undefined) return jaCardPricesCache[`${sPrefix}_ja-${num}`];
  }

  // Set symbol / plus / p alias fallbacks (e.g., sm1+ vs sm1p vs sm1plus)
  const altP = rawId.replace('+', 'p');
  const altPlus = rawId.replace('+', 'plus');
  const altSym = rawId.replace('p', '+');
  for (const p of [altP, altPlus, altSym]) {
    if (p !== rawId) {
      if (jaCardPricesCache[`${p}-${num}`] !== undefined) return jaCardPricesCache[`${p}-${num}`];
      if (jaCardPricesCache[`${p}_ja-${num}`] !== undefined) return jaCardPricesCache[`${p}_ja-${num}`];
    }
  }

  // XY set ID alias fallbacks (e.g., xy8a vs xy8b, xy5b vs xy5t, xy11a vs xy11b)
  const xyAliases: Record<string, string[]> = {
    'xy8a': ['xy8b', 'xy8blue', 'blue shock'],
    'xy8blue': ['xy8a', 'xy8b', 'blue shock'],
    'xy8b': ['xy8r', 'xy8red', 'red flash', 'xy8a'],
    'xy8r': ['xy8b', 'xy8red', 'red flash'],
    'xy8red': ['xy8b', 'xy8r', 'red flash'],
    'xy5b': ['xy5t', 'tidal storm'],
    'xy5t': ['xy5b', 'tidal storm'],
    'xy11a': ['xy11b', 'explosive fighter', 'fever burst fighter'],
    'xy11b': ['xy11a', 'cruel traitor', 'ruthless rebel'],
    'xy9': ['outrageous anger', 'awakening super king'],
    'xy4': ['phantom gate'],
    'xy2': ['wild blaze'],
    'cp1': ['team magma vs team aqua', 'double crisis'],
    'cp2': ['legendary shine', 'legendary kira collection'],
    'cp3': ['pokekyun collection'],
    'cp4': ['premium champion pack ex', 'premium champion']
  };

  if (xyAliases[rawId]) {
    for (const alias of xyAliases[rawId]) {
      if (jaCardPricesCache[`${alias}-${num}`] !== undefined) return jaCardPricesCache[`${alias}-${num}`];
      if (jaCardPricesCache[`${alias}_ja-${num}`] !== undefined) return jaCardPricesCache[`${alias}_ja-${num}`];
    }
  }

  return undefined;
}

/**
 * Resolves the REAL market price for a vendor-catalogue card.
 *  - Japanese cards  -> the per-set price charts you provided (ja-card-prices.json,
 *                        aggregated from Japanese-PriceCharts/<Era>/<Set>/cards.json).
 *  - English cards   -> live TCGdex market data (en-card-prices.json, generated from
 *                        the same TCGdex API that draws the English cards).
 * Falls back to the card's existing price (or rawPrice) when no real value is found,
 * so a card is never left blank or collapsed to a single uniform value.
 */
const _englishPriceCache = new Map<string, number>();

export function getCachedEnglishPrice(cardId: string): number | undefined {
  return _englishPriceCache.get(cardId);
}

export function cacheEnglishPrice(cardId: string, price: number): void {
  _englishPriceCache.set(cardId, price);
}

export function resolveVendorCardRealPrice(card: any): number {
  if (!card) return 1;
  const id = card.originalId || card.id || '';
  const setId = card.setId ? String(card.setId) : '';
  const num = card.num != null ? String(card.num) : '';
  const name = card.name || '';
  const lowerName = name.toLowerCase();
  const img: string = card.img || card.images?.large || card.images?.small || '';

  const lowerId = id.toLowerCase();
  const lowerImg = img.toLowerCase();
  const isJp =
    setId.toLowerCase().includes('_ja') ||
    lowerId.includes('_ja') ||
    lowerImg.includes('_ja') ||
    lowerImg.includes('/ja/') ||
    lowerName.includes('japanese') ||
    lowerName.includes('(jpn)') ||
    lowerName.includes('kanji');

  if (isJp) {
    const jp = getJapaneseCardRealPrice(setId, num) ?? getJapaneseCardRealPrice(id);
    if (typeof jp === 'number' && jp > 0) return Number(jp.toFixed(2));
  }

  // Check runtime English price cache (populated by TCGdex API)
  const cached = _englishPriceCache.get(id) ?? _englishPriceCache.get(`${setId}-${num}`);
  if (cached != null && cached > 0) return cached;

  if (enCardPricesCache) {
    const e =
      enCardPricesCache[id] ??
      (setId && num ? enCardPricesCache[`${setId}-${num}`] : undefined) ??
      enCardPricesCache[card.id];
    if (typeof e === 'number' && e > 0) return Number(e.toFixed(2));
  }

  // Use existing price/rawPrice from card data
  if (typeof card.price === 'number' && card.price > 0) return card.price;
  if (typeof card.rawPrice === 'number' && card.rawPrice > 0) return card.rawPrice;

  // Estimate from name/grade if we have nothing else
  if (lowerName.includes('secret') || lowerName.includes('gold') || lowerName.includes('hyper') || lowerName.includes('rainbow')) return 15 + Math.random() * 20;
  if (lowerName.includes('illustration') || lowerName.includes('alt art') || lowerName.includes('sir') || lowerName.includes('sar')) return 5 + Math.random() * 15;
  if (lowerName.includes('full art') || lowerName.includes('ultra rare') || lowerName.includes('vmax') || lowerName.includes('vstar')) return 3 + Math.random() * 10;
  if (lowerName.includes('v ') || lowerName.includes('ex') || lowerName.includes('gx') || lowerName.includes('double rare')) return 1.5 + Math.random() * 5;
  if (lowerName.includes('holo') || lowerName.includes('reverse')) return 0.5 + Math.random() * 2;
  if (lowerName.includes('uncommon')) return 0.1 + Math.random() * 0.4;
  if (lowerName.includes('common')) return 0.03 + Math.random() * 0.12;

  // Absolute last resort — rare/vintage/unknown
  if ((card.grade || '').includes('PSA') || (card.grade || '').includes('CGC') || (card.grade || '').includes('BGS')) return 15 + Math.random() * 35;
  return 0.5 + Math.random() * 2.5;
}

// ---------------------------------------------------------------------------
// Market-value-driven chase rarity
// Expensive cards (chase cards) are drawn less often, mirroring real booster
// packs: the higher a card's market value, the rarer it should be to pull.
// A soft inverse-price curve plus a floor keeps even the priciest chase card
// attainable instead of impossible.
// ---------------------------------------------------------------------------
const CHASE_PRICE_ALPHA = 0.6;   // 0 = uniform, 1 = strict inverse price. 0.6 keeps chase cards rare but reachable.
const CHASE_PRICE_FLOOR = 0.03;  // minimum weight so the most expensive card is never impossible

const _chasePriceMemo = new Map<string, number>();

export function getCardMarketPrice(
  setId: string,
  setName: string,
  card: { id: string; localId?: string; name?: string } & any
): number {
  if (!card || (card.name || '').includes('Energy')) return 0.1;
  if (_chasePriceMemo.has(card.id)) return _chasePriceMemo.get(card.id)!;
  const num = card.localId ?? '';
  
  const tcgPrices = card.tcgplayer?.prices || card.tcgplayer || card.pricing?.tcgplayer;
  const englishPrice = tcgPrices?.holofoil?.market ?? tcgPrices?.normal?.market ?? tcgPrices?.reverseHolofoil?.market ?? tcgPrices?.holofoil?.marketPrice ?? tcgPrices?.normal?.marketPrice;

  const price =
    (typeof setId === 'string' ? getJapaneseCardRealPrice(setId, num) : undefined) ??
    (setName ? getJapaneseCardRealPrice(setName.toLowerCase(), num) : undefined) ??
    englishPrice ??
    0;
  _chasePriceMemo.set(card.id, price || 0);
  return price || 0;
}

export function priceRarityWeight(price: number): number {
  if (!price || price <= 0) return 1;
  return Math.max(1 / Math.pow(price, CHASE_PRICE_ALPHA), CHASE_PRICE_FLOOR);
}

export function weightedPick<T extends { id: string; localId?: string; name?: string }>(
  candidates: T[],
  setId: string,
  setName: string
): T {
  if (candidates.length <= 1) return candidates[0];
  const weights = candidates.map((c) => priceRarityWeight(getCardMarketPrice(setId, setName, c)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return candidates[Math.floor(Math.random() * candidates.length)];
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export function getMaxCardNumForJapaneseSet(setId: string): number {
  if (!jaCardPricesCache && !jaCardNamesCache) return 0;
  const rawId = setId.replace(/_ja$/i, '').toLowerCase();
  
  const prefixes = new Set<string>([`${rawId}-`, `${rawId}_ja-`]);
  
  const altP = rawId.replace('+', 'p');
  const altPlus = rawId.replace('+', 'plus');
  const altSym = rawId.replace('p', '+');
  for (const p of [altP, altPlus, altSym]) {
    prefixes.add(`${p}-`);
    prefixes.add(`${p}_ja-`);
  }

  const xyAliases: Record<string, string[]> = {
    'xy8a': ['xy8b', 'xy8blue', 'blue shock'],
    'xy8blue': ['xy8a', 'xy8b', 'blue shock'],
    'xy8b': ['xy8r', 'xy8red', 'red flash', 'xy8a'],
    'xy8r': ['xy8b', 'xy8red', 'red flash'],
    'xy8red': ['xy8b', 'xy8r', 'red flash'],
    'xy5b': ['xy5t', 'tidal storm'],
    'xy5t': ['xy5b', 'tidal storm'],
    'xy11a': ['xy11b', 'explosive fighter', 'fever burst fighter'],
    'xy11b': ['xy11a', 'cruel traitor', 'ruthless rebel'],
    'xy9': ['outrageous anger', 'awakening super king'],
    'xy4': ['phantom gate'],
    'xy2': ['wild blaze'],
    'cp1': ['team magma vs team aqua', 'double crisis'],
    'cp2': ['legendary shine', 'legendary kira collection'],
    'cp3': ['pokekyun collection'],
    'cp4': ['premium champion pack ex', 'premium champion']
  };

  if (xyAliases[rawId]) {
    for (const alias of xyAliases[rawId]) {
      prefixes.add(`${alias}-`);
      prefixes.add(`${alias}_ja-`);
    }
  }

  // Also check SWSH variants
  if (rawId.startsWith('s') && !rawId.startsWith('sv') && !rawId.startsWith('sm') && !rawId.startsWith('sn')) {
    const swshPrefix = 'swsh' + rawId.slice(1);
    prefixes.add(`${swshPrefix}-`);
    prefixes.add(`${swshPrefix}_ja-`);
  }
  if (rawId.startsWith('swsh')) {
    const sPrefix = 's' + rawId.slice(4);
    prefixes.add(`${sPrefix}-`);
    prefixes.add(`${sPrefix}_ja-`);
  }

  let maxNum = 0;
  const sourceCache = jaCardPricesCache || jaCardNamesCache || {};
  for (const key of Object.keys(sourceCache)) {
    for (const prefix of prefixes) {
      if (key.startsWith(prefix)) {
        const numPart = key.slice(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  
  if (jaTopCardsCache) {
    for (const card of jaTopCardsCache) {
      const cardRawId = card.setId?.replace(/_ja$/i, '').toLowerCase() || '';
      if (cardRawId === rawId || (rawId.startsWith('s') && cardRawId === 'swsh' + rawId.slice(1))) {
        const num = parseInt(card.num, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  
  return maxNum;
}

export function getJapaneseSetDefaultLogo(setId: string): string {
  const rawId = setId.replace(/_ja$/i, '').toLowerCase();
  const rawBase = import.meta.env.BASE_URL || '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  if (rawId === 'sv2a') return `${base}setLogos/sv2a_ja.png`;
  if (rawId === 'sm10a' || rawId === 'sn10a') return `${base}setLogos/sm10a_ja.png`;
  if (rawId === 'sm4+' || rawId === 'sm4p' || rawId === 'sm4plus') return `${base}setLogos/sm4+_ja.png`;

  if (rawId === 'xy8b' || rawId === 'xy8r' || rawId === 'xy8red' || rawId === 'red flash') return `${base}setLogos/xy8b_ja.png`;
  if (rawId === 'xy8a' || rawId === 'xy8blue' || rawId === 'blue shock') return `${base}setLogos/xy8a_ja.png`;
  if (rawId === 'xy5b' || rawId === 'xy5t' || rawId === 'tidal storm') return `${base}setLogos/xy5b_ja.png`;
  if (rawId === 'xy4' || rawId === 'phantom gate') return `${base}setLogos/xy4_ja.png`;
  if (rawId === 'xy2' || rawId === 'wild blaze') return `${base}setLogos/xy2_ja.png`;
  if (rawId === 'cp1' || rawId === 'double crisis') return `${base}setLogos/cp1_ja.png`;
  if (rawId === 'cp2' || rawId === 'legendary shine') return `${base}setLogos/cp2_ja.png`;

  return `/setLogos/${rawId}_ja.png`;
}

export function getJapaneseSetDefaultSymbol(setId: string): string {
  const rawId = setId.replace(/_ja$/i, '').toLowerCase();
  const rawBase = import.meta.env.BASE_URL || '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  if (rawId === 'sv2a') {
    return `${base}setLogos/sv2a_ja.png`;
  }
  return `https://images.scrydex.com/pokemon/${encodeURIComponent(rawId)}_ja-symbol/symbol`;
}

export async function fetchJapaneseSeriesDetails(seriesId: string): Promise<TCGDexSeries> {
  await loadJapaneseMetadata();
  const allSets = jaSetsCache || [];
  const nameMap = jaEnNamesCache || {};
  const sId = (seriesId || '').toLowerCase().replace(/_ja$/, '');

  const filteredSets = allSets.filter(s => {
    const id = s.id;
    const idLow = id.toLowerCase();
    if (sId === 'me') {
      return !!id.match(/^M\d/i);
    }
    if (sId === 'sv') {
      if (idLow.startsWith('svk') || idLow.startsWith('svls') || idLow.startsWith('svln')) return false;
      const nameLow = (nameMap[id] || s.name || '').toLowerCase();
      if (nameLow.includes('starter set') || nameLow.includes('deck build box') || nameLow.includes('starter deck') || nameLow.includes('build & battle') || s.name.includes('スターターセット') || s.name.includes('デッキビルド')) return false;
      return idLow.startsWith('sv');
    }
    if (sId === 'swsh') {
      return (idLow.startsWith('s') && !idLow.startsWith('sv') && !idLow.startsWith('sm') && !idLow.startsWith('svk') && !idLow.startsWith('sc')) || idLow.startsWith('sn');
    }
    if (sId === 'sm') {
      return idLow.startsWith('sm') || idLow.startsWith('smp');
    }
    if (sId === 'xy') {
      if (idLow === 'xy8r') return false; // Keep only 59-card Red Flash (xy8b / xy8red)
      return idLow.startsWith('xy') || idLow.startsWith('cp');
    }
    if (sId === 'bw') {
      return idLow.startsWith('bw') || idLow.startsWith('ebb') || idLow.startsWith('sc') || idLow.startsWith('bk');
    }
    if (sId === 'hgss') {
      return idLow.startsWith('l') || idLow.startsWith('ll');
    }
    if (sId === 'pl') {
      return idLow.startsWith('pt');
    }
    if (sId === 'dp') {
      return idLow.startsWith('dp');
    }
    if (sId === 'classic' || sId === 'base' || sId === 'ex') {
      return idLow.startsWith('pmcg') || idLow.startsWith('neo') || idLow.startsWith('vs') || idLow.startsWith('web') || idLow.startsWith('e') || idLow.startsWith('adv') || idLow.startsWith('pcg');
    }
    return false;
  });

  const summaries: TCGDexSetSummary[] = filteredSets.map(s => {
    const englishSub = nameMap[s.id] || s.name;
    const defaultLogo = getJapaneseSetDefaultLogo(s.id);
    const defaultSymbol = getJapaneseSetDefaultSymbol(s.id);
    return {
      id: `${s.id}_ja`,
      name: englishSub,
      logo: defaultLogo,
      symbol: defaultSymbol,
      cardCount: s.cardCount || { total: 100, official: 100 }
    };
  });

  summaries.sort((a, b) => {
    const numA = parseInt((a.id.match(/\d+/) || ['0'])[0], 10);
    const numB = parseInt((b.id.match(/\d+/) || ['0'])[0], 10);
    if (numA !== numB) return numB - numA;
    return b.id.localeCompare(a.id);
  });

  let seriesName = 'Japanese Series';
  if (sId === 'me') seriesName = 'Mega Evolution';
  else if (sId === 'sv') seriesName = 'Scarlet & Violet';
  else if (sId === 'swsh') seriesName = 'Sword & Shield';
  else if (sId === 'sm') seriesName = 'Sun & Moon';
  else if (sId === 'xy') seriesName = 'XY Series';
  else if (sId === 'bw') seriesName = 'Black & White';
  else if (sId === 'hgss') seriesName = 'Legend';
  else if (sId === 'pl') seriesName = 'Platinum';
  else if (sId === 'dp') seriesName = 'Diamond & Pearl';
  else if (sId === 'ex') seriesName = 'EX Series';
  else if (sId === 'classic' || sId === 'base') seriesName = 'Original / Base / Classic';

  return {
    id: seriesId,
    name: seriesName,
    sets: summaries
  };
}

export function getJapaneseCardRarity(localId: string, officialCount: number, totalCards: number, name: string = ''): string {
  const num = parseInt(localId, 10);
  if (isNaN(num)) return 'C';

  if (name.includes('ex') || name.includes('VMAX') || name.includes('VSTAR') || name.includes('MEGA') || name.includes('BREAK') || name.includes('GX')) {
    if (num <= officialCount) return 'RR';
  }

  if (num > officialCount) {
    const secretNum = num - officialCount;
    const secretTotal = Math.max(1, totalCards - officialCount);
    const ratio = secretNum / secretTotal;
    if (ratio <= 0.45) return 'AR';
    if (ratio <= 0.75) return 'SR';
    if (ratio <= 0.90) return 'SAR';
    return 'UR';
  }

  if (num > officialCount * 0.82 || num % 7 === 0) return 'R';
  if (num % 3 === 0 || num % 4 === 0 || num > officialCount * 0.52) return 'U';
  return 'C';
}

export async function fetchSingleJapaneseSet(setId: string = 'sv2a_ja'): Promise<TCGDexSet> {
  await loadJapaneseMetadata();
  const rawId = setId.replace(/_ja$/i, '');
  const cacheKey = `${rawId}_ja`;
  const jaRegex = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/;
  const s = (jaSetsCache || []).find(item => item.id.toLowerCase() === rawId.toLowerCase());
  const maxKnownNum = getMaxCardNumForJapaneseSet(rawId);
  const totalCards = Math.max(s?.cardCount?.total || 0, s?.cardCount?.official || 0, maxKnownNum || (rawId.toLowerCase() === 'sv2a' ? 210 : 103));
  const officialCount = s?.cardCount?.official || Math.floor(totalCards * 0.75);
  
  if (scrydexSetCache.has(cacheKey)) {
    const cached = scrydexSetCache.get(cacheKey)!;
    if (jaCardNamesCache && cached.cards) {
      for (const c of cached.cards) {
        const lookupKey1 = c.id;
        const lookupKey2 = `${rawId.toLowerCase()}_ja-${c.localId}`;
        const altKey = `${rawId.toLowerCase()}-${c.localId}`;
        const realName = jaCardNamesCache[lookupKey1] || jaCardNamesCache[lookupKey2] || jaCardNamesCache[altKey];
        if (realName) {
          c.name = realName;
        }
        if (c.localId && (parseInt(c.localId, 10) > officialCount || !c.rarity || c.rarity === 'C' || c.rarity === 'U')) {
          c.rarity = getJapaneseCardRarity(c.localId, officialCount, totalCards, c.name);
        }
        const realPrice = getJapaneseCardRealPrice(rawId, c.localId);
        if (realPrice !== undefined) {
          (c as any).pricing = {
            tcgplayer: { unit: 'USD', updated: new Date().toISOString(), normal: { marketPrice: realPrice, midPrice: realPrice, lowPrice: realPrice, highPrice: realPrice } },
            cardmarket: { unit: 'EUR', updated: new Date().toISOString(), trend: realPrice, avg: realPrice, low: realPrice }
          };
          (c as any).tcgplayer = { unit: 'USD', prices: (c as any).pricing.tcgplayer };
          (c as any).prices = [{ market: realPrice }];
        }
      }
    }
    return cached;
  }

  const nameMap = jaEnNamesCache || {};
  const englishSub = nameMap[rawId] || s?.name || rawId;
  const setName = s ? englishSub : (rawId.toLowerCase() === 'sv2a' ? 'Pokémon Card 151' : `Japanese Set ${rawId}`);

  const prefixLow = rawId.toLowerCase();

  // Determine the correct Scrydex set ID prefix.
  // SM sets: use lowercase sm prefix, NO number padding (e.g. sm9_ja-55)
  // SWSH sets: TCGDex uses 'S1W','S12a' but Scrydex uses 'swsh1w','swsh12a' (full swsh prefix)
  // SV sets: use lowercase sv prefix, NO padding (e.g. sv2a_ja-1)
  const isSwshSet = prefixLow.startsWith('s') && !prefixLow.startsWith('sv') && !prefixLow.startsWith('sm') && !prefixLow.startsWith('sn');
  const scrydexSetPrefix = (isSwshSet ? `swsh${prefixLow.slice(1)}` : prefixLow).replace(/\+/g, 'p');
  
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
  const offlineNames = jaCardNamesCache || {};

  for (let i = 1; i <= totalCards; i++) {
    const cardNum = i.toString();
    const lookupKey = `${prefixLow}_ja-${cardNum}`;
    const altKey = `${prefixLow}-${cardNum}`;
    // Also check swsh-prefixed key for SWSH sets
    const scrydexLookupKey = isSwshSet ? `${scrydexSetPrefix}_ja-${cardNum}` : lookupKey;

    const altP = prefixLow.replace('+', 'p');
    const altPlus = prefixLow.replace('+', 'plus');
    const altSym = prefixLow.replace('p', '+');

    let topCardName = '';
    if (jaTopCardsCache) {
      const topMatch = jaTopCardsCache.find(c =>
        c.id === lookupKey ||
        c.id === altKey ||
        c.id === scrydexLookupKey ||
        c.id === `${altP}_ja-${cardNum}` ||
        c.id === `${altP}-${cardNum}` ||
        c.id === `${altSym}_ja-${cardNum}` ||
        c.id === `${altSym}-${cardNum}`
      );
      if (topMatch && topMatch.name) {
        topCardName = topMatch.name.replace(/Japanese\s+/i, '').replace(/\s*\([^)]*\)$/, '').trim();
      }
    }

    let resolvedName = offlineNames[lookupKey] ||
      offlineNames[altKey] ||
      offlineNames[scrydexLookupKey] ||
      offlineNames[`${altP}_ja-${cardNum}`] ||
      offlineNames[`${altP}-${cardNum}`] ||
      offlineNames[`${altPlus}_ja-${cardNum}`] ||
      offlineNames[`${altSym}_ja-${cardNum}`] ||
      topCardName ||
      `${setName} Card #${cardNum}`;
    const realPrice = getJapaneseCardRealPrice(prefixLow, cardNum) ?? getJapaneseCardRealPrice(`${prefixLow}_ja-${cardNum}`) ?? 0.15;
    const initialPricing = {
      unit: 'USD',
      updated: new Date().toISOString(),
      normal: { marketPrice: realPrice, midPrice: Number((realPrice * 1.05).toFixed(2)), lowPrice: Number((realPrice * 0.85).toFixed(2)), highPrice: Number((realPrice * 1.4).toFixed(2)) }
    };
    // Use PokemonTCG.io for vintage Japanese sets where Scrydex lacks artwork, else Scrydex
    const vintageUrl = getJapaneseVintageCardImageUrl(prefixLow, cardNum);
    const scrydexImgUrl = vintageUrl || `https://images.scrydex.com/pokemon/${scrydexSetPrefix}_ja-${cardNum}/large`;
    cards.push({
      id: `${prefixLow}_ja-${cardNum}`,
      localId: cardNum,
      name: resolvedName,
      image: scrydexImgUrl,
      rarity: getJapaneseCardRarity(cardNum, officialCount, totalCards, resolvedName),
      pricing: {
        tcgplayer: initialPricing,
        cardmarket: { unit: 'EUR', updated: new Date().toISOString(), trend: realPrice, avg: realPrice, low: Number((realPrice * 0.85).toFixed(2)) }
      },
      tcgplayer: { unit: 'USD', prices: initialPricing },
      prices: [{ market: realPrice }]
    } as any);
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
  await loadJapaneseMetadata();
  const localNum = cardId.split('-')[1] || '1';
  const setId = cardId.split('-')[0] || '';
  const rawSetId = setId.replace(/_ja$/i, '').toLowerCase();
  const numStr = parseInt(localNum, 10).toString();
  const realPrice = getJapaneseCardRealPrice(setId, localNum) ?? getJapaneseCardRealPrice(cardId) ?? 0.15;

  const resolvedName = (jaCardNamesCache && (
    jaCardNamesCache[cardId] ||
    jaCardNamesCache[`${rawSetId}_ja-${localNum}`] ||
    jaCardNamesCache[`${rawSetId}-${localNum}`] ||
    jaCardNamesCache[`${rawSetId}_ja-${numStr}`] ||
    jaCardNamesCache[`${rawSetId}-${numStr}`]
  )) || `Card #${localNum}`;

  if (scrydexCardFullCache.has(cardId)) {
    const cached = scrydexCardFullCache.get(cardId)!;
    if (resolvedName && (cached.name.includes('Card #') || cached.name.includes('Pokémon Card'))) {
      cached.name = resolvedName;
    }
    cached.prices = [{ market: realPrice }];
    cached.tcgplayer = { unit: 'USD', updated: new Date().toISOString(), normal: { marketPrice: realPrice, midPrice: realPrice, lowPrice: realPrice, highPrice: realPrice } };
    cached.pricing = { tcgplayer: cached.tcgplayer, cardmarket: { unit: 'EUR', updated: new Date().toISOString(), trend: realPrice, avg: realPrice, low: realPrice } };
    return cached;
  }
  
  const initialPricing = { unit: 'USD', updated: new Date().toISOString(), normal: { marketPrice: realPrice, midPrice: realPrice, lowPrice: realPrice, highPrice: realPrice } };
  const mappedCard: TCGDexCardFull = {
    id: cardId,
    localId: localNum,
    name: resolvedName,
    image: `https://images.scrydex.com/pokemon/${cardId}/large`,
    rarity: getJapaneseCardRarity(localNum, 100, 150, resolvedName),
    prices: [{ market: realPrice }],
    tcgplayer: { unit: 'USD', prices: initialPricing },
    pricing: { tcgplayer: initialPricing, cardmarket: { unit: 'EUR', updated: new Date().toISOString(), trend: realPrice, avg: realPrice, low: realPrice } }
  };
  
  scrydexCardFullCache.set(cardId, mappedCard);
  
  if (!skipEvent) {
    onScrydexCardFullCacheUpdated.forEach(fn => fn());
  }
  
  return mappedCard;
}

// Japanese Booster Box state cache for box-seeded pull rates
export interface JapaneseBoxSlotData {
  summary: TCGDexCardSummary;
  defaultRarity: string;
  isReverseHolo?: boolean;
}

export interface JapaneseBoxPackData {
  slots: JapaneseBoxSlotData[];
  isGodPack?: boolean;
}

export interface JapaneseBoxState {
  setId: string;
  isHighClass: boolean;
  era: 'sv' | 'swsh' | 'sm' | 'classic';
  packs: JapaneseBoxPackData[];
  currentIndex: number;
}

const activeJapaneseBoxes = new Map<string, JapaneseBoxState>();

export function getJapaneseSetPackConfig(setId: string): {
  rawId: string;
  isHighClass: boolean;
  packCountPerBox: number;
  cardsPerPack: number;
  era: 'sv' | 'swsh' | 'sm' | 'classic';
} {
  const rawId = setId.replace(/_ja$/i, '').toLowerCase();
  
  let era: 'sv' | 'swsh' | 'sm' | 'classic' = 'classic';
  if (rawId.startsWith('sv') || rawId.startsWith('svk') || rawId.startsWith('svl')) era = 'sv';
  else if ((rawId.startsWith('s') && !rawId.startsWith('sm') && !rawId.startsWith('sv') && !rawId.startsWith('svk')) || rawId.startsWith('sn')) era = 'swsh';
  else if (rawId.startsWith('sm') || rawId.startsWith('smp')) era = 'sm';

  // Check High Class / specialty sets
  if (rawId === 'sv2a') {
    // Pokémon Card 151: 20 packs/box, 7 cards/pack
    return { rawId, isHighClass: true, packCountPerBox: 20, cardsPerPack: 7, era };
  }
  if (['sv4a', 'sv8a', 's12a', 's8b', 's4a', 'sm12a', 'sm8b'].includes(rawId)) {
    // High Class Sets: 10 packs/box, 10 or 11 cards/pack
    const cardsPerPack = ['s8b', 'sm12a'].includes(rawId) ? 11 : 10;
    return { rawId, isHighClass: true, packCountPerBox: 10, cardsPerPack, era };
  }
  if (rawId === 'cp6') {
    return { rawId, isHighClass: true, packCountPerBox: 15, cardsPerPack: 10, era };
  }

  // Standard Japanese Booster Boxes: 30 packs/box, 5 cards/pack
  return { rawId, isHighClass: false, packCountPerBox: 30, cardsPerPack: 5, era };
}

export function generateJapaneseBox(set: TCGDexSet): JapaneseBoxState {
  const pool = (set.cards || []).filter(c => Boolean(c.image));
  if (pool.length === 0) {
    throw new Error('No cards in Japanese set pool');
  }

  const config = getJapaneseSetPackConfig(set.id);
  const { isHighClass, packCountPerBox, cardsPerPack, era } = config;

  // Categorize cards by Japanese rarity slots
  const commons: TCGDexCardSummary[] = [];
  const uncommons: TCGDexCardSummary[] = [];
  const rares: TCGDexCardSummary[] = [];
  const doubleRares: TCGDexCardSummary[] = []; // RR
  const tripleRares: TCGDexCardSummary[] = []; // RRR (SWSH VMAX/VSTAR)
  const artRares: TCGDexCardSummary[] = []; // AR
  const superRares: TCGDexCardSummary[] = []; // SR
  const specialArtRares: TCGDexCardSummary[] = []; // SAR
  const hyperRares: TCGDexCardSummary[] = []; // HR (SWSH/SM Rainbow)
  const ultraRares: TCGDexCardSummary[] = []; // UR (Gold)
  const characterRares: TCGDexCardSummary[] = []; // CHR
  const characterSuperRares: TCGDexCardSummary[] = []; // CSR
  const aceSpecs: TCGDexCardSummary[] = []; // ACE SPEC
  const shinyRares: TCGDexCardSummary[] = []; // S (Baby shiny)
  const shinySuperRares: TCGDexCardSummary[] = []; // SSR

  for (const card of pool) {
    const r = (card.rarity || '').toLowerCase().trim();
    const nameLow = card.name.toLowerCase();

    if (r === 'c' || r === 'common') commons.push(card);
    else if (r === 'u' || r === 'uncommon') uncommons.push(card);
    else if (r === 'r' || r === 'rare' || r === 'holo rare') rares.push(card);
    else if (r === 'rr' || r === 'double rare') doubleRares.push(card);
    else if (r === 'rrr' || r === 'triple rare') tripleRares.push(card);
    else if (r === 'ar' || r === 'illustration rare') artRares.push(card);
    else if (r === 'sr' || r === 'ultra rare') superRares.push(card);
    else if (r === 'sar' || r === 'special illustration rare') specialArtRares.push(card);
    else if (r === 'hr' || r === 'hyper rare') hyperRares.push(card);
    else if (r === 'ur' || r === 'secret rare' || r.includes('gold')) ultraRares.push(card);
    else if (r === 'chr' || r === 'character rare') characterRares.push(card);
    else if (r === 'csr' || r === 'character super rare') characterSuperRares.push(card);
    else if (r.includes('ace spec') || nameLow.includes('ace spec')) aceSpecs.push(card);
    else if (r === 's' || r === 'shiny rare') shinyRares.push(card);
    else if (r === 'ssr' || r === 'shiny super rare') shinySuperRares.push(card);
    else {
      const rawSetId = config.rawId;
      const p = getJapaneseCardRealPrice(rawSetId, card.localId) ?? getJapaneseCardRealPrice(card.id) ?? (card as any)?.pricing?.tcgplayer?.normal?.marketPrice ?? 0.15;
      if (p > 12) superRares.push(card);
      else if (p > 6) artRares.push(card);
      else if (p > 2) doubleRares.push(card);
      else if (p > 0.5) uncommons.push(card);
      else commons.push(card);
    }
  }

  // Robust fallbacks if set metadata missed specific pools
  if (commons.length === 0) commons.push(...pool);
  if (uncommons.length === 0) uncommons.push(...pool);
  if (rares.length === 0) rares.push(...pool);

  const getFrom = (
    p: TCGDexCardSummary[], 
    fallback: TCGDexCardSummary[] = pool,
    usedIds?: Set<string>,
    weighted: boolean = false
  ): TCGDexCardSummary => {
    // Filter out already used cards if we have a usedIds set
    let candidates = usedIds ? p.filter(card => !usedIds.has(card.id)) : [...p];
    
    if (candidates.length === 0) {
      candidates = usedIds ? fallback.filter(card => !usedIds.has(card.id)) : [...fallback];
    }
    
    // If still no candidates, use any from pool (last resort)
    if (candidates.length === 0) {
      candidates = usedIds ? pool.filter(card => !usedIds.has(card.id)) : [...pool];
    }
    
    // If absolutely no unique candidates left, just pick any (super edge case)
    if (candidates.length === 0) {
      candidates = [...p];
    }
    
    return weighted ? weightedPick(candidates, set.id, set.name || '') : candidates[Math.floor(Math.random() * candidates.length)];
  };

  // Check for "God Pack Exception" (~0.5% to 1% chance in High Class/premium sets)
  let godPackIndex = -1;
  if (isHighClass && Math.random() < 0.0075) {
    godPackIndex = Math.floor(Math.random() * packCountPerBox);
  }

  // ----------------------------------------------------
  // Per-pack hit-slot pull-rate model (realistic odds)
  // ----------------------------------------------------
  // Previously each box was pre-seeded with a fixed count of guaranteed chase
  // cards (e.g. 1 SR/SAR/UR + 3 AR + 4 RR per 30 packs) then shuffled. Opening
  // only a few packs from that box regularly surfaced several expensive
  // guarantees at once — the "hits after hits / hundreds of dollars" bug. Now
  // every pack rolls its hit slot independently against realistic odds, so most
  // packs land on a plain Holo Rare (or Uncommon) and real chase cards are rare.
  interface JHitTier { p: number; label: string; pool: TCGDexCardSummary[]; }
  let jHitTable: JHitTier[];
  let jDefault: { label: string; pool: TCGDexCardSummary[] };

  if (!isHighClass) {
    if (era === 'sv') {
      jHitTable = [
        { p: 0.07, label: 'Secret Hit (SR/SAR/UR)', pool: [...specialArtRares, ...ultraRares, ...superRares] },
        ...(aceSpecs.length > 0 ? [{ p: 0.04, label: 'ACE SPEC', pool: aceSpecs }] : []),
        { p: 0.09, label: 'AR (Art Rare)', pool: artRares },
        { p: 0.14, label: 'RR (Double Rare)', pool: doubleRares },
      ];
      jDefault = { label: 'R (Holo Rare)', pool: rares };
    } else if (era === 'swsh') {
      jHitTable = [
        { p: 0.06, label: 'Secret Hit (SR/HR/UR)', pool: [...ultraRares, ...hyperRares, ...superRares] },
        { p: 0.05, label: 'RRR (Triple Rare)', pool: tripleRares },
        { p: 0.14, label: 'RR (Double Rare)', pool: doubleRares },
        { p: 0.02, label: 'CSR (Character Super Rare)', pool: characterSuperRares },
        { p: 0.06, label: 'CHR (Character Rare)', pool: characterRares },
      ];
      jDefault = { label: 'R (Holo Rare)', pool: rares };
    } else if (era === 'sm') {
      jHitTable = [
        { p: 0.05, label: 'Secret Hit (SR/HR/UR)', pool: [...ultraRares, ...hyperRares, ...superRares] },
        { p: 0.12, label: 'RR (Double Rare)', pool: doubleRares },
      ];
      jDefault = { label: 'R (Holo Rare)', pool: rares };
    } else {
      // Classic / older eras
      jHitTable = [
        { p: 0.04, label: 'Secret Hit (SR/UR)', pool: [...ultraRares, ...superRares] },
        { p: 0.12, label: 'Double Rare / EX', pool: doubleRares },
      ];
      jDefault = { label: 'R (Holo Rare)', pool: rares };
    }
  } else {
    // HIGH CLASS / SPECIALTY BOXES — chase-denser by real design, but still rolled per pack
    if (config.rawId === 'sv2a') {
      // Pokémon Card 151
      jHitTable = [
        { p: 0.05, label: 'Secret Hit (SR/SAR/UR)', pool: [...specialArtRares, ...ultraRares, ...superRares] },
        { p: 0.15, label: 'AR (Art Rare)', pool: artRares },
        { p: 0.22, label: 'RR (Double Rare)', pool: doubleRares },
      ];
      jDefault = { label: 'R (Holo Rare)', pool: rares };
    } else {
      // Shiny Treasure ex, VSTAR Universe, VMAX Climax, etc.
      jHitTable = [
        { p: 0.10, label: 'Secret Hit (SAR/SSR/UR/SR)', pool: [...specialArtRares, ...ultraRares, ...hyperRares, ...superRares, ...shinySuperRares] },
        { p: 0.22, label: 'Illustration Hit (AR/CHR/S)', pool: [...artRares, ...characterSuperRares, ...characterRares, ...shinyRares] },
      ];
      jDefault = { label: 'R / RR / RRR', pool: [...tripleRares, ...doubleRares, ...rares] };
    }
  }

  const rollJapaneseHit = (usedIds: Set<string>): { summary: TCGDexCardSummary; defaultRarity: string } => {
    const roll = Math.random();
    let cum = 0;
    for (const t of jHitTable) {
      cum += t.p;
      if (roll < cum) {
        if (!t.pool || t.pool.length === 0) break; // set lacks this tier → degrade to default
        return { summary: getFrom(t.pool, pool, usedIds, true), defaultRarity: t.label };
      }
    }
    const fallbackPool = (jDefault.pool && jDefault.pool.length > 0) ? jDefault.pool : rares;
    return { summary: getFrom(fallbackPool, pool, usedIds), defaultRarity: jDefault.label };
  };

  // ----------------------------------------------------
  // Construct all packs in the Booster Box
  // ----------------------------------------------------
  const packs: JapaneseBoxPackData[] = [];

  for (let idx = 0; idx < packCountPerBox; idx++) {
    const isThisGodPack = idx === godPackIndex;
    const usedIds = new Set<string>();

    if (isThisGodPack) {
      // GOD PACK: Every single card is upgraded to a high-tier rarity!
      const godPool = [
        ...specialArtRares,
        ...artRares,
        ...shinySuperRares,
        ...superRares,
        ...hyperRares,
        ...ultraRares,
        ...characterSuperRares,
        ...shinyRares,
        ...tripleRares
      ];
      const slots: JapaneseBoxSlotData[] = [];
      for (let s = 0; s < cardsPerPack; s++) {
        const c = getFrom(godPool, rares, usedIds, true);
        usedIds.add(c.id);
        slots.push({
          summary: c,
          defaultRarity: 'God Pack Hit (' + (c.rarity || 'SAR') + ')',
          isReverseHolo: true
        });
      }
      packs.push({ slots, isGodPack: true });
      continue;
    }

    // Roll this pack's hit slot independently against realistic per-pack odds
    const seededHit = rollJapaneseHit(usedIds);
    usedIds.add(seededHit.summary.id);

    if (cardsPerPack === 5) {
      // STANDARD JAPANESE 5-CARD PACK STRUCTURE
      // Slot 1: Common (C)
      // Slot 2: Common (C)
      // Slot 3: Common (C) or Uncommon (U)
      // Slot 4: Uncommon (U)
      // Slot 5 (Hit Slot): Rare (R) or higher (All holographic!)
      const slots: JapaneseBoxSlotData[] = [];
      const card1 = getFrom(commons, pool, usedIds);
      usedIds.add(card1.id);
      slots.push({ summary: card1, defaultRarity: 'Common' });
      
      const card2 = getFrom(commons, pool, usedIds);
      usedIds.add(card2.id);
      slots.push({ summary: card2, defaultRarity: 'Common' });
      
      const card3Pool = Math.random() < 0.5 ? commons : uncommons;
      const card3Rarity = Math.random() < 0.5 ? 'Common' : 'Uncommon';
      const card3 = getFrom(card3Pool, pool, usedIds);
      usedIds.add(card3.id);
      slots.push({ summary: card3, defaultRarity: card3Rarity });
      
      const card4 = getFrom(uncommons, pool, usedIds);
      usedIds.add(card4.id);
      slots.push({ summary: card4, defaultRarity: 'Uncommon' });
      
      slots.push({ summary: seededHit.summary, defaultRarity: seededHit.defaultRarity, isReverseHolo: false });
      
      packs.push({ slots, isGodPack: false });
    } else if (config.rawId === 'sv2a') {
      // POKÉMON 151 (7-card pack)
      // Slot 1-3: Commons
      // Slot 4: Uncommon
      // Slot 5: Master Ball (1 per box) or Poké Ball Reverse Holo
      // Slot 6: The seeded Box Hit (R, RR, AR, SR, SAR, UR)
      // Slot 7: Energy / Holo / Uncommon
      const isMasterBall = idx === Math.floor(packCountPerBox / 2); // Exactly 1 Masterball in box
      const slots: JapaneseBoxSlotData[] = [];
      
      for (let i = 0; i < 3; i++) {
        const card = getFrom(commons, pool, usedIds);
        usedIds.add(card.id);
        slots.push({ summary: card, defaultRarity: 'Common' });
      }
      
      const card4 = getFrom(uncommons, pool, usedIds);
      usedIds.add(card4.id);
      slots.push({ summary: card4, defaultRarity: 'Uncommon' });
      
      const card5 = getFrom(commons, pool, usedIds);
      usedIds.add(card5.id);
      slots.push({ summary: card5, defaultRarity: isMasterBall ? 'Master Ball Reverse Holo' : 'Poké Ball Reverse Holo', isReverseHolo: true });
      
      slots.push({ summary: seededHit.summary, defaultRarity: seededHit.defaultRarity, isReverseHolo: false });
      
      const card7 = getFrom([...rares, ...uncommons], pool, usedIds);
      usedIds.add(card7.id);
      slots.push({ summary: card7, defaultRarity: 'Uncommon / Energy' });
      
      packs.push({ slots, isGodPack: false });
    } else {
      // 10 or 11-CARD HIGH CLASS PACK STRUCTURE
      const slots: JapaneseBoxSlotData[] = [];
      // Slots 1-4: Commons
      for (let s = 0; s < 4; s++) {
        const card = getFrom(commons, pool, usedIds);
        usedIds.add(card.id);
        slots.push({ summary: card, defaultRarity: 'Common' });
      }
      // Slots 5-6: Uncommons
      for (let s = 0; s < 2; s++) {
        const card = getFrom(uncommons, pool, usedIds);
        usedIds.add(card.id);
        slots.push({ summary: card, defaultRarity: 'Uncommon' });
      }
      // Slot 7: Reverse Holo
      const card7 = getFrom([...commons, ...uncommons, ...rares], pool, usedIds);
      usedIds.add(card7.id);
      slots.push({ summary: card7, defaultRarity: 'Reverse Holo', isReverseHolo: true });
      // Slot 8: Guaranteed RR/RRR/ex/V per High Class pack
      const card8 = getFrom([...doubleRares, ...tripleRares, ...rares], pool, usedIds);
      usedIds.add(card8.id);
      slots.push({ summary: card8, defaultRarity: 'Double Rare / ex / V', isReverseHolo: true });
      // Slot 9: The Box Seeded Hit
      slots.push({ summary: seededHit.summary, defaultRarity: seededHit.defaultRarity, isReverseHolo: false });
      // Slots 10+
      for (let s = 9; s < cardsPerPack; s++) {
        const card = getFrom([...rares, ...uncommons], pool, usedIds);
        usedIds.add(card.id);
        slots.push({ summary: card, defaultRarity: 'Energy / Uncommon' });
      }
      packs.push({ slots, isGodPack: false });
    }
  }

  return {
    setId: set.id,
    isHighClass,
    era,
    packs,
    currentIndex: 0
  };
}

export function getOrGenerateJapaneseBox(set: TCGDexSet): JapaneseBoxState {
  const cacheKey = set.id;
  let boxState = activeJapaneseBoxes.get(cacheKey);
  if (!boxState || boxState.currentIndex >= boxState.packs.length) {
    boxState = generateJapaneseBox(set);
    activeJapaneseBoxes.set(cacheKey, boxState);
  } else if (jaCardNamesCache && Object.keys(jaCardNamesCache).length > 0) {
    const rawSetId = set.id.replace(/_ja$/i, '').toLowerCase();
    for (const p of boxState.packs) {
      for (const slot of p.slots) {
        const exact = jaCardNamesCache[slot.summary.id] ||
          jaCardNamesCache[`${rawSetId}_ja-${slot.summary.localId}`] ||
          jaCardNamesCache[`${rawSetId}-${slot.summary.localId}`];
        if (exact) {
          slot.summary.name = exact;
        }
      }
    }
  }
  return boxState;
}

export function resetJapaneseBox(setId: string): void {
  activeJapaneseBoxes.delete(setId);
}

export function getJapaneseBoxStatus(setId: string): {
  totalPacks: number;
  openedPacks: number;
  remainingPacks: number;
  isHighClass: boolean;
  era: string;
} | null {
  const boxState = activeJapaneseBoxes.get(setId);
  if (!boxState) return null;
  return {
    totalPacks: boxState.packs.length,
    openedPacks: boxState.currentIndex,
    remainingPacks: boxState.packs.length - boxState.currentIndex,
    isHighClass: boxState.isHighClass,
    era: boxState.era
  };
}

// Generate a box-seeded Japanese pack (with guaranteed hit distributions per box)
export async function generateJapanesePackFromSet(set: TCGDexSet): Promise<PokemonCard[]> {
  await loadJapaneseMetadata();
  const boxState = getOrGenerateJapaneseBox(set);
  if (!boxState.packs || boxState.packs.length === 0) {
    throw new Error(`Failed to generate Japanese box packs for ${set.id}`);
  }
  if (boxState.currentIndex >= boxState.packs.length) {
    boxState.currentIndex = 0;
  }
  const packData = boxState.packs[boxState.currentIndex++] || boxState.packs[0];
  const rawSetId = set.id.replace(/_ja$/i, '').toLowerCase();
  
  return packData.slots.map((p, idx) => {
    const exactName = (jaCardNamesCache && (
      jaCardNamesCache[p.summary.id] ||
      jaCardNamesCache[`${rawSetId}_ja-${p.summary.localId}`] ||
      jaCardNamesCache[`${rawSetId}-${p.summary.localId}`]
    )) || p.summary.name;

    const realPrice = getJapaneseCardRealPrice(rawSetId, p.summary.localId) ?? getJapaneseCardRealPrice(p.summary.id) ?? (p.summary as any)?.pricing?.tcgplayer?.normal?.marketPrice ?? 0.15;
    const initialPricing = {
      unit: 'USD',
      updated: new Date().toISOString(),
      normal: { marketPrice: realPrice, midPrice: Number((realPrice * 1.05).toFixed(2)), lowPrice: Number((realPrice * 0.85).toFixed(2)), highPrice: Number((realPrice * 1.4).toFixed(2)) }
    };

    return {
      id: `${p.summary.id}-${idx}-${Date.now()}`,
      localId: p.summary.localId,
      name: exactName,
      rarity: (() => {
        let finalRarity = (p.summary.rarity && p.summary.rarity !== 'C' && p.summary.rarity !== 'U' && p.summary.rarity !== 'Common' && p.summary.rarity !== 'Uncommon') ? p.summary.rarity : (p.defaultRarity || p.summary.rarity || 'Common');
        if (realPrice > 12 && (finalRarity.includes('Common') || finalRarity.includes('Uncommon') || finalRarity === 'C' || finalRarity === 'U')) {
          finalRarity = 'Special Art Rare';
        } else if (realPrice > 5 && (finalRarity.includes('Common') || finalRarity.includes('Uncommon'))) {
          finalRarity = 'Art Rare';
        }
        return finalRarity;
      })(),
      isReverseHolo: p.isReverseHolo,
      image: p.summary.image,
      images: {
        small: p.summary.image,
        large: p.summary.image
      },
      pricing: {
        tcgplayer: initialPricing,
        cardmarket: { unit: 'EUR', updated: new Date().toISOString(), trend: realPrice, avg: realPrice, low: Number((realPrice * 0.85).toFixed(2)) }
      },
      tcgplayer: { unit: 'USD', prices: initialPricing },
      prices: [{ market: realPrice }]
    };
  });
}

export function getCardShowDynamicJapaneseCards(count: number = 60): any[] {
  const results: any[] = [];
  const addedIds = new Set<string>();

  // 1. If jaTopCardsCache is loaded, use it as our primary database of top cards per set
  if (jaTopCardsCache && jaTopCardsCache.length > 0) {
    for (const card of jaTopCardsCache) {
      if (results.length >= count) break;
      let targetId = card.id;
      let targetSetId = card.setId;
      let targetImg = card.img;

      if (targetImg && targetImg.includes('scrydex.com') && !targetImg.includes('_ja') && !targetId.includes('_ja')) {
        const parts = targetId.split('-');
        if (parts.length >= 2 && !parts[0].startsWith('base') && !parts[0].startsWith('neo') && !parts[0].startsWith('fo') && !parts[0].startsWith('ju')) {
          const setCode = parts[0];
          const numCode = parts.slice(1).join('-');
          const jaId = `${setCode}_ja-${numCode}`;
          if (addedIds.has(jaId)) continue;
          targetId = jaId;
          targetSetId = `${setCode}_ja`;
          targetImg = targetImg.replace(`/pokemon/${setCode}-${numCode}`, `/pokemon/${setCode}_ja-${numCode}`);
        }
      }

      if (!addedIds.has(targetId)) {
        addedIds.add(targetId);
        const rawPrice = Number(card.rawPrice.toFixed(2));
        
        const grade = rawPrice > 500 ? "PSA 10" : rawPrice > 180 ? "PSA 9" : "Raw NM";
        const displayPrice = grade === "PSA 10" ? Number((rawPrice * 2.8).toFixed(2)) : grade === "PSA 9" ? Number((rawPrice * 1.6).toFixed(2)) : rawPrice;

        results.push({
          id: targetId,
          setId: targetSetId,
          num: card.num,
          name: card.name,
          rawPrice: rawPrice,
          grade: grade,
          price: displayPrice,
          change: `+${(Math.random() * 12 + 1.5).toFixed(1)}%`,
          img: targetImg
        });
      }
    }
  }

  // 2. Fallback to hardcoded list if cache not loaded yet or doesn't have enough cards
  if (results.length < count) {
    const masterRegularSetPool = [
      // Scarlet & Violet Regular Sets & 151
      { cleanSet: "sv3pt5", num: "205", name: "Japanese Mew ex SAR (151 JPN)", rawPrice: 185.0 },
      { cleanSet: "sv3pt5", num: "206", name: "Japanese Erika's Invitation SAR (151 JPN)", rawPrice: 210.0 },
      { cleanSet: "sv3pt5", num: "25", name: "Japanese Pikachu Master Ball Reverse Holo (151 JPN)", rawPrice: 380.0 },
      { cleanSet: "sv3pt5", num: "94", name: "Japanese Gengar Master Ball Reverse Holo (151 JPN)", rawPrice: 220.0 },
      { cleanSet: "sv3pt5", num: "133", name: "Japanese Eevee Master Ball Reverse Holo (151 JPN)", rawPrice: 110.0 },
      { cleanSet: "sv3pt5", num: "149", name: "Japanese Dragonite Master Ball Reverse Holo (151 JPN)", rawPrice: 125.0 },
      { cleanSet: "sv2d", num: "96", name: "Japanese Iono SAR (Clay Burst JPN)", rawPrice: 850.0 },
      { cleanSet: "sv1v", num: "105", name: "Japanese Miriam SAR (Violet ex JPN)", rawPrice: 340.0 },
      { cleanSet: "sv3", num: "223", name: "Japanese Charizard ex SAR (Ruler of the Black Flame JPN)", rawPrice: 240.0 },
      { cleanSet: "sv2", num: "203", name: "Japanese Magikarp IR (Triple Beat JPN)", rawPrice: 110.0 },
      { cleanSet: "sv4", num: "254", name: "Japanese Iron Valiant ex SAR (Ancient Roar JPN)", rawPrice: 135.0 },
      { cleanSet: "sv4", num: "248", name: "Japanese Roaring Moon ex SAR (Ancient Roar JPN)", rawPrice: 150.0 },
      { cleanSet: "sv6", num: "222", name: "Japanese Greninja ex SAR (Crimson Haze JPN)", rawPrice: 195.0 },
      { cleanSet: "sv6", num: "221", name: "Japanese Carmine SAR (Mask of Change JPN)", rawPrice: 160.0 },
      { cleanSet: "sv7", num: "170", name: "Japanese Terapagos ex SAR (Stellar Miracle JPN)", rawPrice: 145.0 },
      { cleanSet: "sv8", num: "241", name: "Japanese Pikachu ex SAR (Super Electric Breaker JPN)", rawPrice: 320.0 },
      { cleanSet: "sv8", num: "244", name: "Japanese Jasmine's Gaze SAR (Super Electric Breaker JPN)", rawPrice: 125.0 },

      // Sword & Shield Regular Sets & High Class
      { cleanSet: "swsh7", num: "215", name: "Japanese Umbreon VMAX HR SA Moonbreon (Eevee Heroes JPN)", rawPrice: 1850.0 },
      { cleanSet: "swsh7", num: "218", name: "Japanese Rayquaza VMAX HR SA (Blue Sky Stream JPN)", rawPrice: 720.0 },
      { cleanSet: "swsh7", num: "212", name: "Japanese Sylveon VMAX HR SA (Eevee Heroes JPN)", rawPrice: 420.0 },
      { cleanSet: "swsh7", num: "205", name: "Japanese Leafeon VMAX HR SA (Eevee Heroes JPN)", rawPrice: 340.0 },
      { cleanSet: "swsh7", num: "192", name: "Japanese Dragonite V SR SA (Blue Sky Stream JPN)", rawPrice: 210.0 },
      { cleanSet: "swsh11", num: "186", name: "Japanese Giratina V SR SA (Lost Abyss JPN)", rawPrice: 780.0 },
      { cleanSet: "swsh11", num: "180", name: "Japanese Aerodactyl V SR SA (Lost Abyss JPN)", rawPrice: 190.0 },
      { cleanSet: "swsh12", num: "186", name: "Japanese Lugia V SR SA (Paradigm Trigger JPN)", rawPrice: 390.0 },
      { cleanSet: "swsh8", num: "271", name: "Japanese Gengar VMAX HR SA (High Class Deck JPN)", rawPrice: 480.0 },
      { cleanSet: "swsh8", num: "270", name: "Japanese Espeon VMAX HR SA (Eevee Heroes JPN)", rawPrice: 360.0 },
      { cleanSet: "swsh9", num: "154", name: "Japanese Charizard V SR SA (Star Birth JPN)", rawPrice: 290.0 },
      { cleanSet: "swsh12a", num: "205", name: "Japanese Pikachu AR (VSTAR Universe JPN)", rawPrice: 65.0 },
      { cleanSet: "swsh8b", num: "260", name: "Japanese Charizard VMAX SSR (VMAX Climax JPN)", rawPrice: 210.0 },
      { cleanSet: "swsh4", num: "188", name: "Japanese Pikachu VMAX HR (Amazing Volt Tackle JPN)", rawPrice: 260.0 },
      { cleanSet: "swsh6", num: "201", name: "Japanese Blaziken VMAX HR SA (Peerless Fighters JPN)", rawPrice: 310.0 },
      { cleanSet: "swsh6", num: "198", name: "Japanese Galarian Moltres V SR SA (Peerless Fighters JPN)", rawPrice: 175.0 },
      { cleanSet: "swsh5", num: "155", name: "Japanese Tyranitar V SR SA (Single Strike Master JPN)", rawPrice: 140.0 },

      // Sun & Moon Regular Sets & Tag Teams
      { cleanSet: "sm9", num: "170", name: "Japanese Latios & Latias GX SR SA (Tag Bolt JPN)", rawPrice: 1120.0 },
      { cleanSet: "sm9", num: "165", name: "Japanese Gengar & Mimikyu GX SR SA (Tag Bolt JPN)", rawPrice: 520.0 },
      { cleanSet: "sm9", num: "161", name: "Japanese Magikarp & Wailord GX SR SA (Tag Bolt JPN)", rawPrice: 440.0 },
      { cleanSet: "sm10", num: "214", name: "Japanese Charizard & Reshiram GX SR SA (Double Blaze JPN)", rawPrice: 380.0 },
      { cleanSet: "sm11", num: "222", name: "Japanese Mewtwo & Mew GX SR SA (Miracle Twin JPN)", rawPrice: 340.0 },
      { cleanSet: "sm12", num: "221", name: "Japanese Arceus & Dialga & Palkia GX SR SA (Alter Genesis JPN)", rawPrice: 290.0 },
      { cleanSet: "sm12", num: "216", name: "Japanese Solgaleo & Lunala GX SR SA (Alter Genesis JPN)", rawPrice: 210.0 },
      { cleanSet: "sm12", num: "215", name: "Japanese Blastoise & Piplup GX SR SA (Alter Genesis JPN)", rawPrice: 230.0 },
      { cleanSet: "sm3", num: "150", name: "Japanese Charizard GX HR (Burning Shadows JPN)", rawPrice: 890.0 },
      { cleanSet: "sm115", num: "68", name: "Japanese Shiny Charizard GX SSR (Ultra Shiny GX JPN)", rawPrice: 640.0 },

      // Vintage & Classic Japanese
      { cleanSet: "base1", num: "4", name: "Japanese Base Charizard Holo (No Rarity / Standard JPN)", rawPrice: 1850.0 },
      { cleanSet: "neo2", num: "30", name: "Japanese Neo 2 Charizard Holo (JPN)", rawPrice: 620.0 },
      { cleanSet: "fo1", num: "5", name: "Japanese Web Series Gengar Holo (JPN)", rawPrice: 580.0 },
      { cleanSet: "neo1", num: "9", name: "Japanese Neo Genesis Lugia Holo (JPN)", rawPrice: 310.0 },
      { cleanSet: "gc1", num: "16", name: "Japanese Gym Leader Erika Holo (JPN)", rawPrice: 110.0 },
      { cleanSet: "base1", num: "10", name: "Japanese Vending Series Mewtwo (JPN)", rawPrice: 195.0 }
    ];

    const getRegularSetImgUrl = (cleanSet: string, num: string) => {
      const low = cleanSet.toLowerCase();
      const vintageUrl = getJapaneseVintageCardImageUrl(low, num);
      if (vintageUrl) return vintageUrl;
      return `https://images.scrydex.com/pokemon/${low}_ja-${num}/large`;
    };

    for (const item of masterRegularSetPool) {
      if (results.length >= count) break;
      const cardId = `${item.cleanSet}_ja-${item.num}`;
      if (!addedIds.has(cardId)) {
        addedIds.add(cardId);
        const cachedPrice = (jaCardPricesCache && (jaCardPricesCache[cardId] || jaCardPricesCache[`${item.cleanSet}-${item.num}`])) || item.rawPrice;
        const rawPrice = Number(cachedPrice.toFixed(2));
        const grade = rawPrice > 500 ? "PSA 10" : rawPrice > 180 ? "PSA 9" : "Raw NM";
        const displayPrice = grade === "PSA 10" ? Number((rawPrice * 2.8).toFixed(2)) : grade === "PSA 9" ? Number((rawPrice * 1.6).toFixed(2)) : rawPrice;

        results.push({
          id: cardId,
          setId: `${item.cleanSet}_ja`,
          num: item.num,
          name: item.name,
          rawPrice: rawPrice,
          grade: grade,
          price: displayPrice,
          change: `+${(Math.random() * 14 + 1.2).toFixed(1)}%`,
          img: getRegularSetImgUrl(item.cleanSet, item.num)
        });
      }
    }

    if (jaCardNamesCache && Object.keys(jaCardNamesCache).length > 0) {
      const keys = Object.keys(jaCardNamesCache);
      // Filter out vintage sets which typically lack Scrydex images, causing endless placeholder loops.
      // We limit to modern sets (starts with 's' for Sun/Moon and Sword/Shield, 'sv' for Scarlet/Violet).
      const validKeys = keys.filter(k => 
        (k.includes('_ja-') || k.includes('_ja_ja-')) && 
        !k.includes('logo') && 
        (k.startsWith('s') || k.startsWith('sv'))
      );
      
      const step = Math.max(1, Math.floor(validKeys.length / Math.max(1, count - results.length)));
      
      for (let i = 0; i < validKeys.length && results.length < count; i += step) {
        const key = validKeys[i];
        const [prefix, numStr] = key.split('-');
        const cleanSet = prefix.replace(/_ja_ja$/i, '').replace(/_ja$/i, '').toLowerCase();
        const num = numStr || '1';
        const cardId = key;
        
        if (!addedIds.has(cardId)) {
          addedIds.add(cardId);
          
          let rawPrice = 0.50;
          if (jaCardPricesCache && jaCardPricesCache[key]) {
            rawPrice = jaCardPricesCache[key];
          } else if (jaCardPricesCache && jaCardPricesCache[`${cleanSet}-${numStr}`]) {
            rawPrice = jaCardPricesCache[`${cleanSet}-${numStr}`];
          } else {
             rawPrice = Number((Math.random() * 25 + 0.5).toFixed(2));
          }
          
          const rawName = jaCardNamesCache[key];
          const exactName = rawName.toLowerCase().includes('japanese') ? rawName : `Japanese ${rawName} (${cleanSet.toUpperCase()})`;
          const grade = rawPrice > 120 ? "PSA 10" : rawPrice > 40 ? "PSA 9" : "Raw NM";
          const displayPrice = grade === "PSA 10" ? Number((rawPrice * 2.5).toFixed(2)) : grade === "PSA 9" ? Number((rawPrice * 1.5).toFixed(2)) : rawPrice;

          const cleanScrydexKey = key.replace(/_ja_ja/g, '_ja').replace(/-(?:0+)([0-9]+)$/, '-$1');

          results.push({
            id: cardId,
            setId: prefix,
            num: num,
            name: exactName,
            rawPrice: rawPrice,
            grade: grade,
            price: displayPrice,
            change: `+${(Math.random() * 12 + 1.5).toFixed(1)}%`,
            img: getJapaneseVintageCardImageUrl(cleanSet, numStr) || `https://images.scrydex.com/pokemon/${cleanScrydexKey}/large`
          });
        }
      }
    }
  }

  return results.slice(0, count);
}

