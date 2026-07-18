import { TCGDexCardSummary, TCGDexSet, PokemonCard, TCGDexCardFull, TCGDexSeries, TCGDexSetSummary } from './tcgdex';

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
export let jaTopCardsCache: any[] | null = null;

export async function loadJapaneseMetadata() {
  if (!jaTopCardsCache) {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}ja-top-cards.json`);
      if (res.ok) {
        const rawCache = await res.json();
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
      }
    } catch (e) {
      console.error('Failed to load /ja-top-cards.json:', e);
    }
  }
  if (!jaSetsCache) {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}ja-sets.json`);
      if (res.ok) jaSetsCache = await res.json();
    } catch (e) {
      console.error('Failed to load /ja-sets.json:', e);
    }
  }
  if (!jaEnNamesCache) {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}ja-en-names.json`);
      if (res.ok) jaEnNamesCache = await res.json();
    } catch (e) {
      console.error('Failed to load /ja-en-names.json:', e);
    }
  }
  if (!jaCardNamesCache || Object.keys(jaCardNamesCache).length === 0) {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}ja-card-names.json`);
      if (res.ok) {
        const data = await res.json();
        if (Object.keys(data).length > 0) {
          jaCardNamesCache = data;
        }
      }
    } catch (e) {
      console.error('Failed to load /ja-card-names.json:', e);
    }
  }
  if (!pokeSpeciesDictCache || Object.keys(pokeSpeciesDictCache).length === 0) {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}pokemon-ja-en-dict.json`);
      if (res.ok) {
        const data = await res.json();
        if (Object.keys(data).length > 0) {
          pokeSpeciesDictCache = data;
        }
      }
    } catch (e) {
      console.error('Failed to load /pokemon-ja-en-dict.json:', e);
    }
  }
  if (!jaCardPricesCache || Object.keys(jaCardPricesCache).length === 0) {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}ja-card-prices.json`);
      if (res.ok) {
        const data = await res.json();
        if (Object.keys(data).length > 0) {
          jaCardPricesCache = data;
        }
      }
    } catch (e) {
      console.error('Failed to load /ja-card-prices.json:', e);
    }
  }
  if (!jaSetsCache) jaSetsCache = [];
  if (!jaEnNamesCache) jaEnNamesCache = {};
  if (!jaCardNamesCache) jaCardNamesCache = {};
  if (!pokeSpeciesDictCache) pokeSpeciesDictCache = {};
  if (!jaCardPricesCache) jaCardPricesCache = {};
  if (!jaTopCardsCache) jaTopCardsCache = [];
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

  return undefined;
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
  if (!jaCardPricesCache) return 0;
  const rawId = setId.replace(/_ja$/i, '').toLowerCase();
  
  const prefixes = new Set<string>([`${rawId}-`, `${rawId}_ja-`]);
  
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
  for (const key of Object.keys(jaCardPricesCache)) {
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
  const rawId = setId.replace(/_ja$/i, '').toUpperCase();
  const base = import.meta.env.BASE_URL || '/';
  if (rawId === 'SV2A') return `${base}setLogos/sv2a_ja.png`;
  if (rawId.startsWith('SV') || rawId.startsWith('SVK')) {
    return `https://images.scrydex.com/pokemon/${rawId.toLowerCase()}_ja-logo/logo`;
  }
  if (rawId === 'SMP2') return `${base}setLogos/det1.png`;
  if (rawId === 'SM1+') return `${base}setLogos/sm1.png`;
  if (rawId === 'SM2+') return `${base}setLogos/sm2.png`;
  if (rawId === 'SM3+') return `${base}setLogos/sm3.png`;
  if (rawId === 'SM4+') return `${base}setLogos/sm4.png`;
  if (rawId === 'SM5+') return `${base}setLogos/sm5.png`;
  if (rawId.startsWith('SM') || rawId.startsWith('SMP')) {
    return `https://images.scrydex.com/pokemon/${encodeURIComponent(rawId.toLowerCase())}_ja-logo/logo`;
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
  const base = import.meta.env.BASE_URL || '/';
  if (rawId === 'SV2A') return `${base}setLogos/sv2a_ja.png`;
  if (rawId.startsWith('SV') || rawId.startsWith('SVK')) {
    return `https://images.scrydex.com/pokemon/${rawId.toLowerCase()}_ja-symbol/symbol`;
  }
  if (rawId.startsWith('SM') || rawId.startsWith('SMP')) {
    return `https://images.scrydex.com/pokemon/${encodeURIComponent(rawId.toLowerCase())}_ja-symbol/symbol`;
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
      if (id.startsWith('SVK') || id.startsWith('SVLS') || id.startsWith('SVLN')) return false;
      const nameLow = (nameMap[id] || s.name || '').toLowerCase();
      if (nameLow.includes('starter set') || nameLow.includes('deck build box') || nameLow.includes('starter deck') || nameLow.includes('build & battle') || s.name.includes('スターターセット') || s.name.includes('デッキビルド')) return false;
      return id.startsWith('SV');
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

const JA_TO_EN_DICTIONARY: Record<string, string> = {
  // Gen 1 (151)
  'フシギダネ': 'Bulbasaur', 'フシギソウ': 'Ivysaur', 'フシギバナ': 'Venusaur',
  'ヒトカゲ': 'Charmander', 'リザード': 'Charmeleon', 'リザードン': 'Charizard',
  'ゼニガメ': 'Squirtle', 'カメール': 'Wartortle', 'カメックス': 'Blastoise',
  'キャタピー': 'Caterpie', 'トランセル': 'Metapod', 'バタフリー': 'Butterfree',
  'ビードル': 'Weedle', 'コクーン': 'Kakuna', 'スピアー': 'Beedrill',
  'ポッポ': 'Pidgey', 'ピジョン': 'Pidgeotto', 'ピジョット': 'Pidgeot',
  'コラッタ': 'Rattata', 'ラッタ': 'Raticate', 'オニスズメ': 'Spearow', 'オニドリル': 'Fearow',
  'アーボ': 'Ekans', 'アーボック': 'Arbok', 'ピカチュウ': 'Pikachu', 'ライチュウ': 'Raichu',
  'サンド': 'Sandshrew', 'サンドパン': 'Sandslash', 'ニドラン♀': 'Nidoran♀', 'ニドリーナ': 'Nidorina', 'ニドクイン': 'Nidoqueen',
  'ニドラン♂': 'Nidoran♂', 'ニドリーノ': 'Nidorino', 'ニドキング': 'Nidoking', 'ピッピ': 'Clefairy', 'ピクシー': 'Clefable',
  'ロコン': 'Vulpix', 'キュウコン': 'Ninetales', 'プリン': 'Jigglypuff', 'プクリン': 'Wigglytuff',
  'ズバット': 'Zubat', 'ゴルバット': 'Golbat', 'ナゾノクサ': 'Oddish', 'クサイハナ': 'Gloom', 'ラフレシア': 'Vileplume',
  'パラス': 'Paras', 'パラセクト': 'Parasect', 'コンパン': 'Venonat', 'モルフォン': 'Venomoth',
  'ディグダ': 'Diglett', 'ダグトリオ': 'Dugtrio', 'ニャース': 'Meowth', 'ペルシアン': 'Persian',
  'コダック': 'Psyduck', 'ゴルダック': 'Golduck', 'マンキー': 'Mankey', 'オコリザル': 'Primeape',
  'ガーディ': 'Growlithe', 'ウインディ': 'Arcanine', 'ニョロモ': 'Poliwag', 'ニョロゾ': 'Poliwhirl', 'ニョロボン': 'Poliwrath',
  'ケーシィ': 'Abra', 'ユンゲラー': 'Kadabra', 'フーディン': 'Alakazam', 'ワンリキー': 'Machop', 'ゴーリキー': 'Machoke', 'カイリキー': 'Machamp',
  'マダツボミ': 'Bellsprout', 'ウツドン': 'Weepinbell', 'ウツボット': 'Victreebel', 'メノクラゲ': 'Tentacool', 'ドククラゲ': 'Tentacruel',
  'イシツブテ': 'Geodude', 'ゴローン': 'Graveler', 'ゴローニャ': 'Golem', 'ポニータ': 'Ponyta', 'ギャロップ': 'Rapidash',
  'ヤドン': 'Slowpoke', 'ヤドラン': 'Slowbro', 'コイル': 'Magnemite', 'レアコイル': 'Magneton',
  'カモネギ': "Farfetch'd", 'ドードー': 'Doduo', 'ドードリオ': 'Dodrio', 'パウワウ': 'Seel', 'ジュゴン': 'Dewgong',
  'ベトベター': 'Grimer', 'ベトベトン': 'Muk', 'シェルダー': 'Shellder', 'パルシェン': 'Cloyster',
  'ゴース': 'Gastly', 'ゴースト': 'Haunter', 'ゲンガー': 'Gengar', 'イワーク': 'Onix',
  'スリープ': 'Drowzee', 'スリーパー': 'Hypno', 'クラブ': 'Krabby', 'キングラー': 'Kingler',
  'ビリリダマ': 'Voltorb', 'マルマイン': 'Electrode', 'タマタマ': 'Exeggcute', 'ナッシー': 'Exeggutor',
  'カラカラ': 'Cubone', 'ガラガラ': 'Marowak', 'サワムラー': 'Hitmonlee', 'エビワラー': 'Hitmonchan',
  'ベロリンガ': 'Lickitung', 'ドガース': 'Koffing', 'マタドガス': 'Weezing', 'サイホーン': 'Rhyhorn', 'サイドン': 'Rhydon',
  'ラッキー': 'Chansey', 'モンジャラ': 'Tangela', 'ガルーラ': 'Kangaskhan', 'タッツー': 'Horsea', 'シードラ': 'Seadra',
  'トサキント': 'Goldeen', 'アズマオウ': 'Seaking', 'ヒトデマン': 'Staryu', 'スターミー': 'Starmie',
  'バリヤード': 'Mr. Mime', 'ストライク': 'Scyther', 'ルージュラ': 'Jynx', 'エレブー': 'Electabuzz', 'ブーバー': 'Magmar',
  'カイロス': 'Pinsir', 'ケンタロス': 'Tauros', 'コイキング': 'Magikarp', 'ギャラドス': 'Gyarados',
  'ラプラス': 'Lapras', 'メタモン': 'Ditto', 'イーブイ': 'Eevee', 'シャワーズ': 'Vaporeon', 'サンダース': 'Jolteon', 'ブースター': 'Flareon',
  'ポリゴン': 'Porygon', 'オムナイト': 'Omanyte', 'オムスター': 'Omastar', 'カブト': 'Kabuto', 'カブトプス': 'Kabutops',
  'プテラ': 'Aerodactyl', 'カビゴン': 'Snorlax', 'フリーザー': 'Articuno', 'サンダー': 'Zapdos', 'ファイヤー': 'Moltres',
  'ミニリュウ': 'Dratini', 'ハクリュー': 'Dragonair', 'カイリュー': 'Dragonite', 'ミュウツー': 'Mewtwo', 'ミュウ': 'Mew',

  // Trainers / Items / Eeveelutions / Popular SV Gen 9
  'エリカの招待': "Erika's Invitation", 'サカキのカリスマ': "Giovanni's Charisma", 'ナナミの手助け': "Daisy's Help", 'マサキの転送': "Bill's Transfer", 'サイクリングロード': "Cycling Road", '安全ゴーグル': "Protective Goggles", '大きなふうせん': "Big Air Balloon", 'ガチガチバンド': "Rigid Band", 'たべのこし': "Leftovers", 'ポケモンいれかえ': "Switch", '基本超エネルギー': "Basic Psychic Energy",
  'ナンジャモ': "Iono", 'ミモザ': "Miriam", 'キハダ': "Dendra", 'チリ': "Rika", 'ポピー': "Poppy", 'オモダカ': "Geeta", 'ベル': "Bianca", 'ベルのまごころ': "Bianca's Devotion", 'ゼイユ': "Carmine", 'スグリ': "Kieran", 'タロ': "Lacey", 'カキツバタ': "Drayton", 'ブライア': "Briar", 'ボスの指令': "Boss's Orders", 'ネストボール': "Nest Ball", 'ハイパーボール': "Ultra Ball", 'ペパー': "Arven", 'ジャッジマン': "Judge", '博士の研究': "Professor's Research", 'すごいつりざお': "Super Rod", 'なかよしポフィン': "Buddy-Buddy Poffin", 'プライムキャッチャー': "Prime Catcher", 'マキシマムベルト': "Maximum Belt", 'ヒーローマント': "Hero's Cape",
  'ニャオハ': "Sprigatito", 'ニャローテ': "Floragato", 'マスカーニャ': "Meowscarada", 'ホゲータ': "Fuecoco", 'アチゲータ': "Crocalor", 'ラウドボーン': "Skeledirge", 'クワッス': "Quaxly", 'ウェルカモ': "Quaxwell", 'ウェーニバル': "Quaquaval", 'コライドン': "Koraidon", 'ミライドン': "Miraidon", 'テラパゴス': "Terapagos", 'オーガポン': "Ogerpon", 'ルカリオ': "Lucario", 'レックウザ': "Rayquaza", 'ブラッキー': "Umbreon", 'ニンフィア': "Sylveon", 'グレイシア': "Glaceon", 'リーフィア': "Leafeon", 'エーフィ': "Espeon"
};

export function translateJapaneseName(jaName: string): string {
  if (!jaName) return jaName;
  if (JA_TO_EN_DICTIONARY[jaName]) return JA_TO_EN_DICTIONARY[jaName];
  if (pokeSpeciesDictCache && pokeSpeciesDictCache[jaName]) return pokeSpeciesDictCache[jaName];

  const suffixMatch = jaName.match(/^(.*?)(ex|VMAX|VSTAR|V|GX|STAR|SAR|SR|UR|AR)$/i);
  if (suffixMatch) {
    const baseJa = suffixMatch[1].trim();
    const suffix = suffixMatch[2];
    const baseEn = JA_TO_EN_DICTIONARY[baseJa] || (pokeSpeciesDictCache && pokeSpeciesDictCache[baseJa]);
    if (baseEn) {
      return `${baseEn} ${suffix}`;
    }
  }

  for (const [jaKey, enVal] of Object.entries(JA_TO_EN_DICTIONARY)) {
    if (jaName.startsWith(jaKey)) {
      const rest = jaName.slice(jaKey.length).trim();
      return rest ? `${enVal} ${rest}` : enVal;
    }
  }
  if (pokeSpeciesDictCache) {
    for (const [jaKey, enVal] of Object.entries(pokeSpeciesDictCache)) {
      if (jaKey.length >= 2 && jaName.includes(jaKey)) {
        return jaName.split(jaKey).join(enVal);
      }
    }
  }
  return jaName;
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
        } else if (c.name && (c.name.includes('Card ') || c.name.includes('Card #') || jaRegex.test(c.name))) {
          c.name = translateJapaneseName(c.name);
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

  // Fetch live card titles from TCGDex Japanese & English endpoints where available
  const resolvedCardNamesMap = new Map<string, string>();
  let tcgdexJaId = prefixLow;
  if (tcgdexJaId.startsWith('swsh')) {
    tcgdexJaId = 's' + tcgdexJaId.slice(4);
  }
  try {
    const resJa = await fetch(`https://api.tcgdex.net/v2/ja/sets/${tcgdexJaId}`);
    if (resJa.ok) {
      const dataJa = await resJa.json();
      if (Array.isArray(dataJa?.cards)) {
        for (const c of dataJa.cards) {
          if (c.localId && c.name) {
            const numKey = parseInt(c.localId, 10).toString();
            resolvedCardNamesMap.set(numKey, translateJapaneseName(c.name));
          }
        }
      }
    }
  } catch {
    // ignore
  }

  const enSetAliasMap: Record<string, string> = {
    'sv2a': 'sv03.5', 'sv1s': 'sv01', 'sv1v': 'sv01', 'sv2d': 'sv02', 'sv2p': 'sv02',
    'sv3': 'sv03', 'sv4a': 'sv04.5', 'sv4k': 'sv04', 'sv4m': 'sv04', 'sv5a': 'sv05',
    'sv5k': 'sv05', 'sv5m': 'sv05', 'sv6': 'sv06', 'sv6a': 'sv06.5', 'sv7': 'sv07',
    'sv8': 'sv08', 'sv8a': 'sv08.5'
  };
  try {
    const enAlias = enSetAliasMap[prefixLow] || prefixLow;
    const resEn = await fetch(`https://api.tcgdex.net/v2/en/sets/${enAlias}`);
    if (resEn.ok) {
      const dataEn = await resEn.json();
      if (Array.isArray(dataEn?.cards)) {
        for (const c of dataEn.cards) {
          if (c.localId && c.name && !resolvedCardNamesMap.has(parseInt(c.localId, 10).toString())) {
            resolvedCardNamesMap.set(parseInt(c.localId, 10).toString(), c.name);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  const offlineNames = jaCardNamesCache || {};
  // Determine the correct Scrydex set ID prefix.
  // SM sets: use lowercase sm prefix, NO number padding (e.g. sm9_ja-55)
  // SWSH sets: TCGDex uses 'S1W','S12a' but Scrydex uses 'swsh1w','swsh12a' (full swsh prefix)
  // SV sets: use lowercase sv prefix, NO padding (e.g. sv2a_ja-1)
  const isSwshSet = prefixLow.startsWith('s') && !prefixLow.startsWith('sv') && !prefixLow.startsWith('sm') && !prefixLow.startsWith('sn');
  const scrydexSetPrefix = isSwshSet ? `swsh${prefixLow.slice(1)}` : prefixLow;

  for (let i = 1; i <= totalCards; i++) {
    const cardNum = i.toString();
    const lookupKey = `${prefixLow}_ja-${cardNum}`;
    const altKey = `${prefixLow}-${cardNum}`;
    // Also check swsh-prefixed key for SWSH sets
    const scrydexLookupKey = isSwshSet ? `${scrydexSetPrefix}_ja-${cardNum}` : lookupKey;

    let topCardName = '';
    if (jaTopCardsCache) {
      const topMatch = jaTopCardsCache.find(c =>
        c.id === lookupKey ||
        c.id === altKey ||
        c.id === scrydexLookupKey
      );
      if (topMatch && topMatch.name) {
        topCardName = topMatch.name.replace(/Japanese\s+/i, '').replace(/\s*\([^)]*\)$/, '').trim();
      }
    }

    let resolvedName = offlineNames[lookupKey] || offlineNames[altKey] || resolvedCardNamesMap.get(cardNum) || topCardName || `${setName} Card #${cardNum}`;
    if (jaRegex.test(resolvedName) || resolvedName.includes('Card #') || resolvedName.includes('Card ')) {
      resolvedName = translateJapaneseName(resolvedName);
    }
    const realPrice = getJapaneseCardRealPrice(prefixLow, cardNum) ?? getJapaneseCardRealPrice(`${prefixLow}_ja-${cardNum}`) ?? 0.15;
    const initialPricing = {
      unit: 'USD',
      updated: new Date().toISOString(),
      normal: { marketPrice: realPrice, midPrice: Number((realPrice * 1.05).toFixed(2)), lowPrice: Number((realPrice * 0.85).toFixed(2)), highPrice: Number((realPrice * 1.4).toFixed(2)) }
    };
    // Use the correct Scrydex prefix: swsh for SWSH sets, sm/sv as-is for others
    const scrydexImgUrl = `https://images.scrydex.com/pokemon/${scrydexSetPrefix}_ja-${cardNum}/large`;
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
  const realPrice = getJapaneseCardRealPrice(setId, localNum) ?? getJapaneseCardRealPrice(cardId) ?? 0.15;

  if (scrydexCardFullCache.has(cardId)) {
    const cached = scrydexCardFullCache.get(cardId)!;
    cached.prices = [{ market: realPrice }];
    cached.tcgplayer = { unit: 'USD', updated: new Date().toISOString(), normal: { marketPrice: realPrice, midPrice: realPrice, lowPrice: realPrice, highPrice: realPrice } };
    cached.pricing = { tcgplayer: cached.tcgplayer, cardmarket: { unit: 'EUR', updated: new Date().toISOString(), trend: realPrice, avg: realPrice, low: realPrice } };
    return cached;
  }
  
  const initialPricing = { unit: 'USD', updated: new Date().toISOString(), normal: { marketPrice: realPrice, midPrice: realPrice, lowPrice: realPrice, highPrice: realPrice } };
  const mappedCard: TCGDexCardFull = {
    id: cardId,
    localId: localNum,
    name: `Pokémon Card ${localNum}`,
    image: `https://images.scrydex.com/pokemon/${cardId}/large`,
    rarity: 'Common',
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
  // Seed the Hit Slot (Slot 5 in standard, or main hits in high class) across the Box
  // ----------------------------------------------------
  const slotPulls: Array<{ summary: TCGDexCardSummary; defaultRarity: string }> = [];

  if (!isHighClass) {
    // STANDARD 30-PACK BOOSTER BOX GUARANTEES BY ERA
    if (era === 'sv') {
      // 1) SR, SAR, or UR: 1 Guaranteed. ~20% chance the box has a second one.
      const svChasePool = [...specialArtRares, ...ultraRares, ...superRares];
      if (svChasePool.length > 0) {
        slotPulls.push({ summary: getFrom(svChasePool, pool, undefined, true), defaultRarity: 'Secret Hit (SR/SAR/UR)' });
        if (Math.random() < 0.20 && svChasePool.length > 1) {
          slotPulls.push({ summary: getFrom(svChasePool, pool, undefined, true), defaultRarity: 'Secret Hit (SR/SAR/UR)' });
        }
      }
      // 2) ACE SPEC: 1 Guaranteed (only in sets that feature them)
      if (aceSpecs.length > 0) {
        slotPulls.push({ summary: getFrom(aceSpecs, pool, undefined, true), defaultRarity: 'ACE SPEC' });
      }
      // 3) AR (Art Rare): 3 Guaranteed
      if (artRares.length > 0) {
        for (let i = 0; i < 3; i++) {
          slotPulls.push({ summary: getFrom(artRares, pool, undefined, true), defaultRarity: 'AR (Art Rare)' });
        }
      }
      // 4) RR (Double Rare): 4 Guaranteed
      if (doubleRares.length > 0) {
        for (let i = 0; i < 4; i++) {
          slotPulls.push({ summary: getFrom(doubleRares, pool, undefined, true), defaultRarity: 'RR (Double Rare)' });
        }
      }
      // 5) R (Holo Rare): ~12 Guaranteed
      let rCount = 12;
      while (rCount > 0 && slotPulls.length < packCountPerBox) {
        slotPulls.push({ summary: getFrom(rares), defaultRarity: 'R (Holo Rare)' });
        rCount--;
      }
      // 6) Uncommon: Fills remaining Slot 5s up to 30
      while (slotPulls.length < packCountPerBox) {
        slotPulls.push({ summary: getFrom(uncommons), defaultRarity: 'Uncommon' });
      }
    } else if (era === 'swsh') {
      // 1) SR, HR, or UR: 1 Guaranteed
      const swshSecretPool = [...ultraRares, ...hyperRares, ...superRares];
      if (swshSecretPool.length > 0) {
        slotPulls.push({ summary: getFrom(swshSecretPool, pool, undefined, true), defaultRarity: 'Secret Hit (SR/HR/UR)' });
      }
      // 2) RRR (Triple Rare): 2 Guaranteed
      if (tripleRares.length > 0) {
        for (let i = 0; i < 2; i++) {
          slotPulls.push({ summary: getFrom(tripleRares, pool, undefined, true), defaultRarity: 'RRR (Triple Rare)' });
        }
      }
      // 3) RR (Double Rare): 4 to 5 Guaranteed
      const rrCount = Math.random() < 0.5 ? 4 : 5;
      if (doubleRares.length > 0) {
        for (let i = 0; i < rrCount; i++) {
          slotPulls.push({ summary: getFrom(doubleRares, pool, undefined, true), defaultRarity: 'RR (Double Rare)' });
        }
      }
      // Note: Trainer Gallery Subsets (3 CHR + 1 CSR guaranteed)
      if (characterSuperRares.length > 0) {
        slotPulls.push({ summary: getFrom(characterSuperRares, pool, undefined, true), defaultRarity: 'CSR (Character Super Rare)' });
      }
      if (characterRares.length > 0) {
        for (let i = 0; i < 3; i++) {
          slotPulls.push({ summary: getFrom(characterRares, pool, undefined, true), defaultRarity: 'CHR (Character Rare)' });
        }
      }
      // 4) R (Holo Rare): ~8 Guaranteed
      let rCount = 8;
      while (rCount > 0 && slotPulls.length < packCountPerBox) {
        slotPulls.push({ summary: getFrom(rares), defaultRarity: 'R (Holo Rare)' });
        rCount--;
      }
      // 5) Uncommon: Fills remaining Slot 5s up to 30
      while (slotPulls.length < packCountPerBox) {
        slotPulls.push({ summary: getFrom(uncommons), defaultRarity: 'Uncommon' });
      }
    } else if (era === 'sm') {
      // 1) SR, HR, or UR: 1 Guaranteed
      const smSecretPool = [...ultraRares, ...hyperRares, ...superRares];
      if (smSecretPool.length > 0) {
        slotPulls.push({ summary: getFrom(smSecretPool, pool, undefined, true), defaultRarity: 'Secret Hit (SR/HR/UR)' });
      }
      // 2) RR (Double Rare): 3 to 4 Guaranteed
      const rrCount = Math.random() < 0.5 ? 3 : 4;
      if (doubleRares.length > 0) {
        for (let i = 0; i < rrCount; i++) {
          slotPulls.push({ summary: getFrom(doubleRares, pool, undefined, true), defaultRarity: 'RR (Double Rare)' });
        }
      }
      // 3) R (Holo Rare): ~11 Guaranteed
      let rCount = 11;
      while (rCount > 0 && slotPulls.length < packCountPerBox) {
        slotPulls.push({ summary: getFrom(rares), defaultRarity: 'R (Holo Rare)' });
        rCount--;
      }
      // 4) Uncommon: Fills remaining Slot 5s up to 30
      while (slotPulls.length < packCountPerBox) {
        slotPulls.push({ summary: getFrom(uncommons), defaultRarity: 'Uncommon' });
      }
    } else {
      // Classic / Older Eras
      const secretPool = [...ultraRares, ...superRares];
      if (secretPool.length > 0) slotPulls.push({ summary: getFrom(secretPool, pool, undefined, true), defaultRarity: 'Secret Hit (SR/UR)' });
      const exCount = Math.random() < 0.5 ? 3 : 4;
      if (doubleRares.length > 0) {
        for (let i = 0; i < exCount; i++) slotPulls.push({ summary: getFrom(doubleRares, pool, undefined, true), defaultRarity: 'Double Rare / EX' });
      }
      let rCount = packCountPerBox === 30 ? 11 : 6;
      while (rCount > 0 && slotPulls.length < packCountPerBox) {
        slotPulls.push({ summary: getFrom(rares), defaultRarity: 'R (Holo Rare)' });
        rCount--;
      }
      while (slotPulls.length < packCountPerBox) {
        slotPulls.push({ summary: getFrom(uncommons), defaultRarity: 'Uncommon' });
      }
    }
  } else {
    // HIGH CLASS / SPECIALTY BOOSTER BOX GUARANTEES
    if (config.rawId === 'sv2a') {
      // 151 Booster Box: 20 Packs
      // 1 SR/SAR/UR guaranteed (~20% chance for 2nd)
      const chase151 = [...specialArtRares, ...ultraRares, ...superRares];
      if (chase151.length > 0) {
        slotPulls.push({ summary: getFrom(chase151, pool, undefined, true), defaultRarity: 'Secret Hit (SR/SAR/UR)' });
        if (Math.random() < 0.20 && chase151.length > 1) {
          slotPulls.push({ summary: getFrom(chase151, pool, undefined, true), defaultRarity: 'Secret Hit (SR/SAR/UR)' });
        }
      }
      // 3 AR guaranteed
      if (artRares.length > 0) {
        for (let i = 0; i < 3; i++) slotPulls.push({ summary: getFrom(artRares, pool, undefined, true), defaultRarity: 'AR (Art Rare)' });
      }
      // 4 to 5 RR guaranteed
      const rrCount = Math.random() < 0.5 ? 4 : 5;
      if (doubleRares.length > 0) {
        for (let i = 0; i < rrCount; i++) slotPulls.push({ summary: getFrom(doubleRares, pool, undefined, true), defaultRarity: 'RR (Double Rare)' });
      }
      while (slotPulls.length < packCountPerBox) {
        slotPulls.push({ summary: getFrom(rares), defaultRarity: 'R (Holo Rare)' });
      }
    } else {
      // Other High Class 10-pack boxes (Shiny Treasure ex, VSTAR Universe, VMAX Climax, etc.)
      const highChase = [...specialArtRares, ...ultraRares, ...hyperRares, ...superRares, ...shinySuperRares];
      if (highChase.length > 0) {
        slotPulls.push({ summary: getFrom(highChase, pool, undefined, true), defaultRarity: 'Secret Hit (SAR/SSR/UR/SR)' });
      }
      const arPool = [...artRares, ...characterSuperRares, ...characterRares, ...shinyRares];
      const arCount = 1 + Math.floor(Math.random() * 3);
      if (arPool.length > 0) {
        for (let i = 0; i < arCount; i++) slotPulls.push({ summary: getFrom(arPool, pool, undefined, true), defaultRarity: 'Illustration Hit (AR/CHR/S)' });
      }
      while (slotPulls.length < packCountPerBox) {
        const hitPool = [...tripleRares, ...doubleRares, ...rares];
        slotPulls.push({ summary: getFrom(hitPool), defaultRarity: 'R / RR / RRR' });
      }
    }
  }

  // Truncate or pad just in case
  if (slotPulls.length > packCountPerBox) slotPulls.length = packCountPerBox;
  while (slotPulls.length < packCountPerBox) {
    slotPulls.push({ summary: getFrom(rares), defaultRarity: 'R (Holo Rare)' });
  }

  // Shuffle the seeded pulls across the packs in this box!
  for (let i = slotPulls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slotPulls[i], slotPulls[j]] = [slotPulls[j], slotPulls[i]];
  }

  // ----------------------------------------------------
  // Construct all packs in the Booster Box
  // ----------------------------------------------------
  const packs: JapaneseBoxPackData[] = [];
  let pullIndex = 0;

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

    // Add seeded hit to usedIds first
    const seededHit = slotPulls[pullIndex++] || { summary: getFrom(rares, pool, usedIds), defaultRarity: 'R (Holo Rare)' };
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
      
      slots.push({ summary: seededHit.summary, defaultRarity: seededHit.defaultRarity, isReverseHolo: seededHit.defaultRarity !== 'Uncommon' });
      
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
      
      const card5 = getFrom([...commons, ...uncommons], pool, usedIds);
      usedIds.add(card5.id);
      slots.push({ summary: card5, defaultRarity: isMasterBall ? 'Master Ball Reverse Holo' : 'Poké Ball Reverse Holo', isReverseHolo: true });
      
      slots.push({ summary: seededHit.summary, defaultRarity: seededHit.defaultRarity, isReverseHolo: true });
      
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
      slots.push({ summary: seededHit.summary, defaultRarity: seededHit.defaultRarity, isReverseHolo: true });
      // Slots 10+
      for (let s = 9; s < cardsPerPack; s++) {
        const card = getFrom([...rares, ...uncommons], pool, usedIds);
        usedIds.add(card.id);
        slots.push({ summary: card, defaultRarity: 'Reverse Holo / Energy', isReverseHolo: true });
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
        } else if (slot.summary.name && (slot.summary.name.includes('Card ') || slot.summary.name.includes('Card #') || /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/.test(slot.summary.name))) {
          slot.summary.name = translateJapaneseName(slot.summary.name);
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
  const packData = boxState.packs[boxState.currentIndex++];
  const rawSetId = set.id.replace(/_ja$/i, '').toLowerCase();
  
  return packData.slots.map((p, idx) => {
    const exactName = (jaCardNamesCache && (
      jaCardNamesCache[p.summary.id] ||
      jaCardNamesCache[`${rawSetId}_ja-${p.summary.localId}`] ||
      jaCardNamesCache[`${rawSetId}-${p.summary.localId}`]
    )) || translateJapaneseName(p.summary.name);

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
      if (low.startsWith('base') || low.startsWith('neo') || low.startsWith('fo') || low.startsWith('ju') || low.startsWith('gc') || low.startsWith('gh')) {
        return `https://images.pokemontcg.io/${low.replace(/1$|2$|3$|4$/, '')}/${num}_hires.png`;
      }
      return `https://images.scrydex.com/pokemon/${low}-${num}/large`;
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

    if (jaCardPricesCache && Object.keys(jaCardPricesCache).length > 0) {
      const keys = Object.keys(jaCardPricesCache);
      const validKeys = keys.filter(k => (k.includes('_ja-') || k.includes('_ja_ja-')) && jaCardPricesCache![k] > 10.0 && !k.includes('logo'));
      const step = Math.max(1, Math.floor(validKeys.length / Math.max(1, count - results.length)));
      
      for (let i = 0; i < validKeys.length && results.length < count; i += step) {
        const key = validKeys[i];
        const [prefix, numStr] = key.split('-');
        const cleanSet = prefix.replace(/_ja_ja$/i, '').replace(/_ja$/i, '').toLowerCase();
        const num = numStr || '1';
        const cardId = `${cleanSet}_ja-${num}`;
        
        if (!addedIds.has(cardId)) {
          addedIds.add(cardId);
          const price = jaCardPricesCache[key];
          const rawName = jaCardNamesCache?.[key] || jaCardNamesCache?.[key.replace(/_ja_ja-/i, '_ja-')] || `Japanese Card #${num}`;
          const translated = translateJapaneseName(rawName);
          const exactName = translated.toLowerCase().includes('japanese') ? translated : `Japanese ${translated} (${cleanSet.toUpperCase()})`;
          const rawPrice = Number(price.toFixed(2));
          const grade = rawPrice > 120 ? "PSA 10" : rawPrice > 40 ? "PSA 9" : "Raw NM";
          const displayPrice = grade === "PSA 10" ? Number((rawPrice * 2.5).toFixed(2)) : grade === "PSA 9" ? Number((rawPrice * 1.5).toFixed(2)) : rawPrice;

          results.push({
            id: cardId,
            setId: `${cleanSet}_ja`,
            num: num,
            name: exactName,
            rawPrice: rawPrice,
            grade: grade,
            price: displayPrice,
            change: `+${(Math.random() * 12 + 1.5).toFixed(1)}%`,
            img: getRegularSetImgUrl(cleanSet, num)
          });
        }
      }
    }
  }

  return results.slice(0, count);
}

