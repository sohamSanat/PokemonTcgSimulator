import { TCGDexSet, TCGDexSetSummary, PokemonCard } from '../services/tcgdex';
import { MysteryPackConfig } from '../data/mysteryPacks';

export interface CardData {
  id: number | string;
  originalIndex: number;
  flipped: boolean;
  collected: boolean;
  value: number;
  pokemon: PokemonCard;
  isVendorCatalog?: boolean;
  vendorName?: string;
  vendorBooth?: string;
  vendorRating?: string;
}

export const imageFallbacks = new Map<string, string>();

export const DEFAULT_PACK_ARTS = [
  '/packArts/MegaEvolution-Generation/Ascended-heroes/1.webp',
];

export const getPackArtsForSet = (setId: string, setName?: string, manifest: Record<string, string[]> = {}): string[] => {
  if (!manifest || Object.keys(manifest).length === 0) return DEFAULT_PACK_ARTS;

  // 1. Check exact or lowercase setId
  if (manifest[setId]) return manifest[setId];
  if (manifest[setId.toLowerCase()]) return manifest[setId.toLowerCase()];

  // 2. Check normalized setId (alphanumeric only)
  const normId = setId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (manifest[normId]) return manifest[normId];

  // 3. Check setName if provided
  if (setName) {
    if (manifest[setName]) return manifest[setName];
    if (manifest[setName.toLowerCase()]) return manifest[setName.toLowerCase()];
    const normName = setName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (manifest[normName]) return manifest[normName];
  }

  // 4. Fallback search across keys
  for (const [key, urls] of Object.entries(manifest)) {
    if (key.toLowerCase() === normId || (setName && key.toLowerCase() === setName.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
      return urls;
    }
  }

  return DEFAULT_PACK_ARTS;
};

export const getSetLogoUrl = (set: TCGDexSetSummary, manifest: Record<string, string> = {}, lang: string = 'en'): string | null => {
  if (!set || !set.id) return null;

  const isJapanese = lang === 'ja' || set.id.endsWith('_ja');
  const cleanJaId = set.id.replace(/_ja$/i, '').toLowerCase();

  if (isJapanese) {
    const jaKey = `${cleanJaId}_ja`;
    const altPKey = cleanJaId.replace(/\+/g, 'p') + '_ja';
    const altPlusKey = cleanJaId.replace(/\+/g, 'plus') + '_ja';

    if (manifest[jaKey]) return manifest[jaKey];
    if (manifest[altPKey]) return manifest[altPKey];
    if (manifest[altPlusKey]) return manifest[altPlusKey];
    if (manifest[cleanJaId]) return manifest[cleanJaId];
    if (manifest[set.id]) return manifest[set.id];
    if (manifest[set.id.toLowerCase()]) return manifest[set.id.toLowerCase()];

    if (cleanJaId === 'sm10a' || cleanJaId === 'sn10a') return '/setLogos/sm10a_ja.png';
    if (cleanJaId === 'sm4+' || cleanJaId === 'sm4p' || cleanJaId === 'sm4plus') return '/setLogos/sm4+_ja.png';

    if (set.logo && !set.logo.includes('base1_ja-logo') && !set.logo.includes('/en/') && !set.logo.includes('images.scrydex.com')) {
      return set.logo.endsWith('.png') || set.logo.endsWith('.webp') || set.logo.endsWith('.jpg') ? set.logo : `${set.logo}.png`;
    }
    return `/setLogos/${cleanJaId}_ja.png`;
  }

  const rawId = set.id.replace(/_ja$/i, '');

  // 1. Check exact id or lowercase id in manifest
  if (manifest[set.id]) return manifest[set.id];
  if (manifest[set.id.toLowerCase()]) return manifest[set.id.toLowerCase()];
  if (manifest[rawId]) return manifest[rawId];
  if (manifest[rawId.toLowerCase()]) return manifest[rawId.toLowerCase()];

  // 2. Check safe id (. replaced with _)
  const safeId = set.id.replace(/[^a-z0-9.-]/gi, '_');
  if (manifest[safeId]) return manifest[safeId];
  if (manifest[safeId.toLowerCase()]) return manifest[safeId.toLowerCase()];

  const safeRawId = rawId.replace(/[^a-z0-9.-]/gi, '_');
  if (manifest[safeRawId]) return manifest[safeRawId];
  if (manifest[safeRawId.toLowerCase()]) return manifest[safeRawId.toLowerCase()];

  // 3. Check normalized alphanumeric id
  const normId = set.id.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (manifest[normId]) return manifest[normId];
  const normRawId = rawId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (manifest[normRawId]) return manifest[normRawId];

  if (set.id === 'sv05' || normId === 'sv05' || normId === 'sv5') {
    return '/setLogos/sv05.png';
  }

  // 4. Fallback to local predownloaded path or set.logo URL (ignore generic fallback logo)
  if (set.logo && !set.logo.includes('base1_ja-logo')) {
    if (set.logo.includes('images.scrydex.com') || set.logo.endsWith('/logo') || set.logo.endsWith('/symbol') || set.logo.endsWith('.png') || set.logo.endsWith('.webp') || set.logo.endsWith('.jpg')) {
      return set.logo;
    }
    return `${set.logo}.png`;
  }
  return `/setLogos/${safeRawId.toLowerCase()}.png`;
};

import setPackPricesData from '../data/set_pack_prices.json';

export const setPackPrices: Record<string, number> = setPackPricesData as Record<string, number>;

export const SET_BOOSTER_PRICES_USD: Record<string, number> = {
  // Mega Evolution Series (Live 2026 TCGplayer Market Data)
  'me01': 5.99, 'mega-evolution': 5.99, 'mega evolution': 5.99,
  'me02': 11.11, 'phantasmal-flames': 11.11, 'phantasmal flames': 11.11,
  'me02.5': 14.09, 'me02pt5': 14.09, 'ascended-heroes': 14.09, 'ascended heroes': 14.09,
  'me03': 5.92, 'perfect-order': 5.92, 'perfect order': 5.92,
  'me04': 6.39, 'chaos-rising': 6.39, 'chaos rising': 6.39,

  // Scarlet & Violet Series
  'sv01': 10.11, 'sv1': 10.11, 'scarlet&violet': 10.11, 'scarlet & violet': 10.11, 'scarlet & violet base': 10.11, 'scarlet & violet base set': 10.11,
  'sv02': 15.50, 'sv2': 15.50, 'paldea-evolved': 15.50, 'paldea evolved': 15.50,
  'sv03': 13.45, 'sv3': 13.45, 'obsidian-flames': 13.45, 'obsidian flames': 13.45,
  'sv03.5': 28.91, 'sv03pt5': 28.91, 'sv3pt5': 28.91, '151': 28.91, 'me4': 28.91, 'sve-151': 28.91,
  'sv04': 8.45, 'sv4': 8.45, 'paradox-rift': 8.45, 'paradox rift': 8.45,
  'sv05': 11.45, 'sv5': 11.45, 'temporal-forces': 11.45, 'temporal forces': 11.45,
  'sv06': 10.56, 'sv6': 10.56, 'twilight-masquared': 10.56, 'twilight masquerade': 10.56,
  'sv07': 10.22, 'sv7': 10.22, 'stellar-crown': 10.22, 'stellar crown': 10.22,
  'sv08': 8.49, 'sv8': 8.49, 'surging-sparks': 8.49, 'surging sparks': 8.49,
  'sv08.5': 15.99, 'sv08pt5': 15.99, 'sv8pt5': 15.99, 'prismatic-evolution': 15.99, 'prismatic evolutions': 15.99,
  'sv09': 6.45, 'sv9': 6.45, 'journey-togather': 6.45, 'journey together': 6.45,
  'sv10': 9.36, 'destined-rivals': 9.36, 'destined rivals': 9.36,
  'white-flare': 14, 'white flare': 14, 'whiteflare': 14,
  'black-bolt': 15.45, 'black bolt': 15.45, 'blackbolt': 15.45,
  'shrouded-fable': 14.38, 'shrouded fable': 14.38, 'shroudedfable': 14.38,
  'paldean-fates': 23.29, 'paldean fates': 23.29, 'paldeanfates': 23.29,

  // Sword & Shield Series
  'swsh01': 10.99, 'swsh1': 10.99, 'sword&shield': 10.99, 'sword & shield': 10.99, 'sword & shield base': 10.99, 'sword & shield base set': 10.99,
  'swsh02': 13.49, 'swsh2': 13.49, 'rebel-clash': 13.49, 'rebel clash': 13.49,
  'swsh03': 10.99, 'swsh3': 10.99, 'darknessablaze': 10.99, 'darkness-ablaze': 10.99, 'DarknessAblaze': 10.99, 'darkness ablaze': 10.99,
  'swsh04': 10, 'swsh4': 10, 'vivid-voltage': 10, 'vivd-voltage': 10, 'vivid voltage': 10,
  'swsh04.5': 7.99, 'swsh04pt5': 7.99, 'swsh4.5': 7.99, 'swsh4pt5': 7.99, 'shining-fates': 7.99, 'shiny-fates': 7.99, 'shining fates': 7.99,
  'swsh05': 8.49, 'swsh5': 8.49, 'battle-styles': 8.49, 'battle styles': 8.49,
  'swsh06': 11.78, 'swsh6': 11.78, 'chilling-reign': 11.78, 'chilling reign': 11.78,
  'swsh07': 44, 'swsh7': 44, 'evolving-skies': 44, 'evolving skies': 44,
  'swsh08': 19.39, 'swsh8': 19.39, 'fusion-strike': 19.39, 'fusion strike': 19.39,
  'swsh09': 17.60, 'swsh9': 17.60, 'brilliant-stars': 17.60, 'brillinant-stars': 17.60, 'brilliant stars': 17.60,
  'swsh10': 8.99, 'astral-radiance': 8.99, 'astral radiance': 8.99,
  'swsh11': 19.00, 'lost-origin': 19.00, 'lost origin': 19.00,
  'swsh12': 14.29, 'silver-tempest': 14.29, 'silver tempest': 14.29,
  'swsh12.5': 25.50, 'swsh12pt5': 25.50, 'crown-zenith': 25.50, 'crown zenith': 25.50,
  'pokemon-go': 8, 'pokemon go': 8, 'pokemongo': 8,
  'celebrations': 41, 'celebration': 41,
  "champion's-path": 18.50, "champion's path": 18.50, 'championspath': 18.50,
  'shining-fates-shiny-vault': 15.86, 'shining fates shiny vault': 15.86, 'shiningfatesshinyvault': 15.86,

  // Sun & Moon Series
  'sm1': 20.47, 'sm01': 20.47, 'sun & moon': 20.47, 'sun & moon base': 20.47, 'sun & moon base set': 20.47,
  'sm2': 20.21, 'sm02': 20.21, 'guardians-rising': 20.21, 'guardians rising': 20.21,
  'sm3': 31.99, 'sm03': 31.99, 'burning-shadows': 31.99, 'burning shadows': 31.99,
  'sm3.5': 106.00, 'sm03.5': 106.00, 'sm3pt5': 106.00, 'slg': 106.00, 'shining-legends': 106.00, 'shining legends': 106.00,
  'sm4': 15.77, 'sm04': 15.77, 'crimson-invasion': 15.77, 'crimson invasion': 15.77,
  'sm5': 43.40, 'sm05': 43.40, 'ultra-prism': 43.40, 'ultra prism': 43.40,
  'sm6': 52.50, 'sm06': 52.50, 'forbidden-light': 52.50, 'forbidden light': 52.50,
  'sm7': 57.84, 'sm07': 57.84, 'celestial-storm': 57.84, 'celestial storm': 57.84,
  'sm7.5': 87.07, 'sm07.5': 87.07, 'sm7pt5': 87.07, 'drm': 87.07, 'dragon-majesty': 87.07, 'dragon majesty': 87.07,
  'sm8': 55.00, 'sm08': 55.00, 'lost-thunder': 55.00, 'lost thunder': 55.00,
  'sm9': 260.57, 'sm09': 260.57, 'team-up': 260.57, 'team up': 260.57,
  'det1': 14.50, 'detective-pikachu': 14.50, 'detective pikachu': 14.50,
  'sm10': 65.14, 'unbroken-bonds': 65.14, 'unbroken bonds': 65.14,
  'sm11': 66.69, 'unified-minds': 66.69, 'unified minds': 66.69,
  'sm115': 48.50, 'sma': 48.50, 'hidden-fates': 48.50, 'hidden fates': 48.50,
  'sm12': 69.46, 'cosmic-eclipse': 69.46, 'cosmic eclipse': 69.46,

  // XY Series
  'xy1': 83.37, 'xy01': 83.37, 'xy base': 83.37, 'xy base set': 83.37,
  'xy2': 198.72, 'xy02': 198.72, 'flashfire': 198.72,
  'xy3': 68.61, 'xy03': 68.61, 'furious-fists': 68.61, 'furious fists': 68.61,
  'xy4': 182.76, 'xy04': 182.76, 'phantom-forces': 182.76, 'phantom forces': 182.76,
  'xy5': 56.87, 'xy05': 56.87, 'primal-clash': 56.87, 'primal clash': 56.87,
  'dc1': 400.00, 'double-crisis': 400.00, 'double crisis': 400.00,
  'xy6': 69.66, 'xy06': 69.66, 'roaring-skies': 69.66, 'roaring skies': 69.66,
  'xy7': 109.24, 'xy07': 109.24, 'ancient-origins': 109.24, 'ancient origins': 109.24,
  'xy8': 58.65, 'xy08': 58.65, 'breakthrough': 58.65,
  'xy9': 43.19, 'xy09': 43.19, 'breakpoint': 43.19,
  'g1': 246.47, 'generations': 246.47,
  'xy10': 55.14, 'fates-collide': 55.14, 'fates collide': 55.14,
  'xy11': 27.50, 'steam-siege': 27.50, 'steam siege': 27.50,
  'xy12': 66.50, 'evolutions': 66.50,

  // Base Generation
  'base1': 449.99, 'base-set': 449.99, 'base set': 449.99, 'bs1': 449.99,
  'base2': 285.62, 'jungle': 285.62, 'ju': 285.62,
  'base3': 298.66, 'fossil': 298.66, 'fossill': 298.66, 'fo': 298.66,
  'base4': 373.22, 'base-set2': 373.22, 'base set 2': 373.22, 'bs2': 373.22,
  'base5': 399.99, 'team-rocket': 399.99, 'team rocket': 399.99, 'tr': 399.99
};

export const getSetBoosterPrice = (set: TCGDexSet | TCGDexSetSummary | null | undefined, mysteryPackOverride?: MysteryPackConfig | null): number => {
  if (mysteryPackOverride) return mysteryPackOverride.price;
  if ((set as any)?.mysteryPackPrice) return Number((set as any).mysteryPackPrice);
  if (!set) return 10.99;

  // 1. Check if set object or TCGdex has any custom pricing metadata attached
  if ((set as any).pricing?.tcgplayer?.boosterPrice) {
    return Number((set as any).pricing.tcgplayer.boosterPrice);
  }
  if ((set as any).boosterPrice) {
    return Number((set as any).boosterPrice);
  }

  const id = set.id ? set.id.toLowerCase() : '';
  const name = set.name ? set.name.toLowerCase() : '';
  const normId = id.replace(/[^a-z0-9]/g, '');
  const normName = name.replace(/[^a-z0-9]/g, '');

  // Check hardcoded market prices first
  if (SET_BOOSTER_PRICES_USD[id]) return SET_BOOSTER_PRICES_USD[id];
  if (SET_BOOSTER_PRICES_USD[normId]) return SET_BOOSTER_PRICES_USD[normId];
  if (SET_BOOSTER_PRICES_USD[name]) return SET_BOOSTER_PRICES_USD[name];
  if (SET_BOOSTER_PRICES_USD[normName]) return SET_BOOSTER_PRICES_USD[normName];

  for (const [key, price] of Object.entries(SET_BOOSTER_PRICES_USD)) {
    if (key.toLowerCase() === normId || key.toLowerCase() === normName) {
      return price;
    }
  }

  // Fallback to scraped prices from JSON file
  if (setPackPrices[id] && typeof setPackPrices[id] === 'number') return setPackPrices[id];
  if (setPackPrices[normId] && typeof setPackPrices[normId] === 'number') return setPackPrices[normId];
  if (setPackPrices[name] && typeof setPackPrices[name] === 'number') return setPackPrices[name];
  if (setPackPrices[normName] && typeof setPackPrices[normName] === 'number') return setPackPrices[normName];

  for (const [key, price] of Object.entries(setPackPrices)) {
    if (typeof price === 'number') {
      const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (key.toLowerCase() === normId || key.toLowerCase() === normName || normKey === normName || normKey === normId) {
        return price;
      }
    }
  }

  // 3. Dynamic fallback estimation based on set age / series if unknown set
  if (id.includes('_ja') || id.includes('ja')) {
    if (id.startsWith('sv')) return 2.49;
    if (id.startsWith('s') || id.startsWith('swsh')) return 3.49;
    if (id.startsWith('sm')) return 5.99;
    if (id.startsWith('xy') || id.startsWith('bw')) return 9.99;
    return 4.99;
  }

  if (id.startsWith('me')) return 5.99;
  if (id.startsWith('swsh')) return 10.99;
  if (id.startsWith('sv')) return 6.99;
  if (id.startsWith('sm') || id.startsWith('xy') || id.startsWith('bw')) return 18.00;
  if (id.startsWith('base') || id.startsWith('gym') || id.startsWith('neo')) return 350.00;

  return 10.99;
};
