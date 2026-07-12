import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, RefreshCcw, Layers, CheckCircle2, Loader2, X, Calendar, Info, ZoomIn, ZoomOut, Eye, RotateCw, Palette, Volume2, VolumeX, BookOpen, Coins, Package, TrendingUp, TrendingDown, Award, ShieldCheck, Zap, ChevronLeft, ChevronRight, Music, Scissors, UserCircle, LogOut } from 'lucide-react';
import { fetchSetDetails, fetchSeriesDetails, fetchCardFull, startBackgroundWarmupForSet, handleCardImageError, cardFullCache, onCardFullCacheUpdated, generatePackFromSet, getCardImageUrl, getTCGDexValidAssetPath, TCGDexSet, TCGDexSetSummary, TCGDexSeries, TCGDexCardFull, PokemonCard, ENERGY_POOLS_BY_ERA, type EnergyEra } from './services/tcgdex';
import { auth, signOut } from './services/firebase';
import { useAuth } from './context/AuthContext';
import { LoginModal } from './components/auth/LoginModal';
import { sound } from './services/sound';
import setPackPricesData from './data/set_pack_prices.json';
import BinderView from './components/binder/BinderView';
import { saveCollectedCard, getBinders, saveBinders, updateCardSlabStatus, saveCardToCatalogue, getCatalogues, type CatalogueStore, type Binder, type Card } from './components/binder/types';
import SleeveAnimation from './components/binder/SleeveAnimation';
import SlabAnimation from './components/binder/SlabAnimation';
import InteractiveCard3D from './components/binder/InteractiveCard3D';
import BoosterPackTear from './components/BoosterPackTear';
import PSAGradingLab from './components/psa/PSAGradingLab';
import BulkCatalogueModal from './components/binder/BulkCatalogueModal';

const setPackPrices: Record<string, number> = setPackPricesData as Record<string, number>;

interface CardData {
  id: number;
  originalIndex: number;
  flipped: boolean;
  collected: boolean;
  value: number;
  pokemon: PokemonCard;
}

const DARKNESS_ABLAZE_PACK_ARTS = [
  '/packArts/Sword&Shield-Generation/DarknessAblaze/img1.webp',
  '/packArts/Sword&Shield-Generation/DarknessAblaze/img2.webp',
  '/packArts/Sword&Shield-Generation/DarknessAblaze/img3.webp',
  '/packArts/Sword&Shield-Generation/DarknessAblaze/img4.webp',
];

const getPackArtsForSet = (setId: string, setName?: string, manifest: Record<string, string[]> = {}): string[] => {
  if (!manifest || Object.keys(manifest).length === 0) return DARKNESS_ABLAZE_PACK_ARTS;

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

  return DARKNESS_ABLAZE_PACK_ARTS;
};

const getSetLogoUrl = (set: TCGDexSetSummary, manifest: Record<string, string> = {}): string | null => {
  if (!set || !set.id) return null;
  // 1. Check exact id or lowercase id in manifest
  if (manifest[set.id]) return manifest[set.id];
  if (manifest[set.id.toLowerCase()]) return manifest[set.id.toLowerCase()];

  // 2. Check safe id (. replaced with _)
  const safeId = set.id.replace(/[^a-z0-9.-]/gi, '_');
  if (manifest[safeId]) return manifest[safeId];
  if (manifest[safeId.toLowerCase()]) return manifest[safeId.toLowerCase()];

  // 3. Check normalized alphanumeric id
  const normId = set.id.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (manifest[normId]) return manifest[normId];

  if (set.id === 'sv05' || normId === 'sv05' || normId === 'sv5') {
    return '/setLogos/sv05.png';
  }

  // 4. Fallback to local predownloaded path or set.logo URL
  if (set.logo) {
    if (set.logo.endsWith('.png') || set.logo.endsWith('.webp') || set.logo.endsWith('.jpg')) {
      return set.logo;
    }
    return `${set.logo}.png`;
  }
  return `/setLogos/${safeId}.png`;
};

const getSetBoosterPrice = (set: TCGDexSet | TCGDexSetSummary | null | undefined): number => {
  if (!set) return 10.99;

  // 1. Check if set object or TCGdex has any custom pricing metadata attached
  if ((set as any).pricing?.tcgplayer?.boosterPrice) {
    return Number((set as any).pricing.tcgplayer.boosterPrice);
  }
  if ((set as any).boosterPrice) {
    return Number((set as any).boosterPrice);
  }

  // 2. Lookup table of realistic TCGplayer North America market prices for sealed booster packs (2026 live market data)
  const SET_BOOSTER_PRICES_USD: Record<string, number> = {
    // Mega Evolution Series (Live 2026 TCGplayer Market Data)
    'me01': 5.99, 'mega-evolution': 5.99, 'mega evolution': 5.99,
    'me02': 11.11, 'phantasmal-flames': 11.11, 'phantasmal flames': 11.11,
    'me02.5': 14.09, 'me02pt5': 14.09, 'ascended-heroes': 14.09, 'ascended heroes': 14.09,
    'me03': 5.92, 'perfect-order': 5.92, 'perfect order': 5.92,
    'me04': 6.39, 'chaos-rising': 6.39, 'chaos rising': 6.39,

    // Scarlet & Violet Series
    'sv01': 4.99, 'sv1': 4.99, 'scarlet&violet': 4.99, 'scarlet & violet': 4.99, 'scarlet & violet base': 4.99, 'scarlet & violet base set': 4.99,
    'sv02': 6.49, 'sv2': 6.49, 'paldea-evolved': 6.49, 'paldea evolved': 6.49,
    'sv03': 5.99, 'sv3': 5.99, 'obsidian-flames': 5.99, 'obsidian flames': 5.99,
    'sv03.5': 12.99, 'sv03pt5': 12.99, 'sv3pt5': 12.99, '151': 12.99, 'me4': 12.99, 'sve-151': 12.99,
    'sv04': 5.49, 'sv4': 5.49, 'paradox-rift': 5.49, 'paradox rift': 5.49,
    'sv05': 5.49, 'sv5': 5.49, 'temporal-forces': 5.49, 'temporal forces': 5.49,
    'sv06': 7.49, 'sv6': 7.49, 'twilight-masquared': 7.49, 'twilight masquerade': 7.49,
    'sv07': 5.99, 'sv7': 5.99, 'stellar-crown': 5.99, 'stellar crown': 5.99,
    'sv08': 8.49, 'sv8': 8.49, 'surging-sparks': 8.49, 'surging sparks': 8.49,
    'sv08.5': 15.99, 'sv08pt5': 15.99, 'sv8pt5': 15.99, 'prismatic-evolution': 15.99, 'prismatic evolutions': 15.99,
    'sv09': 6.99, 'sv9': 6.99, 'journey-togather': 6.99, 'journey together': 6.99,
    'sv10': 7.49, 'destined-rivals': 7.49, 'destined rivals': 7.49,

    // Sword & Shield Series
    'swsh01': 10.99, 'swsh1': 10.99, 'sword&shield': 10.99, 'sword & shield': 10.99, 'sword & shield base': 10.99, 'sword & shield base set': 10.99,
    'swsh02': 13.49, 'swsh2': 13.49, 'rebel-clash': 13.49, 'rebel clash': 13.49,
    'swsh03': 10.99, 'swsh3': 10.99, 'darknessablaze': 10.99, 'darkness-ablaze': 10.99, 'DarknessAblaze': 10.99, 'darkness ablaze': 10.99,
    'swsh04': 11.49, 'swsh4': 11.49, 'vivid-voltage': 11.49, 'vivd-voltage': 11.49, 'vivid voltage': 11.49,
    'swsh04.5': 7.99, 'swsh04pt5': 7.99, 'swsh4.5': 7.99, 'swsh4pt5': 7.99, 'shining-fates': 7.99, 'shiny-fates': 7.99, 'shining fates': 7.99,
    'swsh05': 8.49, 'swsh5': 8.49, 'battle-styles': 8.49, 'battle styles': 8.49,
    'swsh06': 10.49, 'swsh6': 10.49, 'chilling-reign': 10.49, 'chilling reign': 10.49,
    'swsh07': 21.99, 'swsh7': 21.99, 'evolving-skies': 21.99, 'evolving skies': 21.99,
    'swsh08': 13.99, 'swsh8': 13.99, 'fusion-strike': 13.99, 'fusion strike': 13.99,
    'swsh09': 11.99, 'swsh9': 11.99, 'brilliant-stars': 11.99, 'brillinant-stars': 11.99, 'brilliant stars': 11.99,
    'swsh10': 8.99, 'astral-radiance': 8.99, 'astral radiance': 8.99,
    'swsh11': 12.99, 'lost-origin': 12.99, 'lost origin': 12.99,
    'swsh12': 9.99, 'silver-tempest': 9.99, 'silver tempest': 9.99,
    'swsh12.5': 8.49, 'swsh12pt5': 8.49, 'crown-zenith': 8.49, 'crown zenith': 8.49,

    // Sun & Moon Series (Live 2026 Market Data)
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

    // XY Series (Live 2026 Market Data)
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

    // Base Generation (Original Wizards of the Coast Series)
    'base1': 449.99, 'base-set': 449.99, 'base set': 449.99, 'bs1': 449.99,
    'base2': 285.62, 'jungle': 285.62, 'ju': 285.62,
    'base3': 298.66, 'fossil': 298.66, 'fossill': 298.66, 'fo': 298.66,
    'base4': 373.22, 'base-set2': 373.22, 'base set 2': 373.22, 'bs2': 373.22,
    'base5': 399.99, 'team-rocket': 399.99, 'team rocket': 399.99, 'tr': 399.99
  };

  const id = set.id ? set.id.toLowerCase() : '';
  const name = set.name ? set.name.toLowerCase() : '';
  const normId = id.replace(/[^a-z0-9]/g, '');
  const normName = name.replace(/[^a-z0-9]/g, '');

  // Check live scraped prices from JSON file first
  if (setPackPrices[id] && typeof setPackPrices[id] === 'number') return setPackPrices[id];
  if (setPackPrices[normId] && typeof setPackPrices[normId] === 'number') return setPackPrices[normId];
  if (setPackPrices[name] && typeof setPackPrices[name] === 'number') return setPackPrices[name];
  if (setPackPrices[normName] && typeof setPackPrices[normName] === 'number') return setPackPrices[normName];

  for (const [key, price] of Object.entries(setPackPrices)) {
    if (typeof price === 'number' && (key.toLowerCase() === normId || key.toLowerCase() === normName || key.toLowerCase().replace(/[^a-z0-9]/g, '') === normName)) {
      return price;
    }
  }

  // Fallback to hardcoded market prices
  if (SET_BOOSTER_PRICES_USD[id]) return SET_BOOSTER_PRICES_USD[id];
  if (SET_BOOSTER_PRICES_USD[normId]) return SET_BOOSTER_PRICES_USD[normId];
  if (SET_BOOSTER_PRICES_USD[name]) return SET_BOOSTER_PRICES_USD[name];
  if (SET_BOOSTER_PRICES_USD[normName]) return SET_BOOSTER_PRICES_USD[normName];

  for (const [key, price] of Object.entries(SET_BOOSTER_PRICES_USD)) {
    if (key.toLowerCase() === normId || key.toLowerCase() === normName) {
      return price;
    }
  }

  // 3. Dynamic fallback estimation based on set age / series if unknown set
  if (id.startsWith('me')) return 5.99;
  if (id.startsWith('swsh')) return 10.99;
  if (id.startsWith('sv')) return 6.99;
  if (id.startsWith('sm') || id.startsWith('xy') || id.startsWith('bw')) return 18.00;
  if (id.startsWith('base') || id.startsWith('gym') || id.startsWith('neo')) return 350.00;

  return 10.99;
};

const FALLBACK_POKEMON_CARDS: PokemonCard[] = [
  {
    id: "me4-1",
    name: "Weedle",
    rarity: "Common",
    images: { small: "https://images.scrydex.com/pokemon/me4-1/small", large: "https://images.scrydex.com/pokemon/me4-1/large" },
    tcgplayer: { prices: { normal: { market: 0.45 } } }
  },
  {
    id: "me4-2",
    name: "Kakuna",
    rarity: "Common",
    images: { small: "https://images.scrydex.com/pokemon/me4-2/small", large: "https://images.scrydex.com/pokemon/me4-2/large" },
    tcgplayer: { prices: { normal: { market: 0.80 } } }
  },
  {
    id: "me4-3",
    name: "Beedrill ex",
    rarity: "Double Rare",
    images: { small: "https://images.scrydex.com/pokemon/me4-3/small", large: "https://images.scrydex.com/pokemon/me4-3/large" },
    tcgplayer: { prices: { holofoil: { market: 24.50 } } }
  },
  {
    id: "me4-4",
    name: "Carnivine",
    rarity: "Common",
    images: { small: "https://images.scrydex.com/pokemon/me4-4/small", large: "https://images.scrydex.com/pokemon/me4-4/large" },
    tcgplayer: { prices: { normal: { market: 1.10 } } }
  },
  {
    id: "me4-7",
    name: "Chesnaught",
    rarity: "Rare",
    images: { small: "https://images.scrydex.com/pokemon/me4-7/small", large: "https://images.scrydex.com/pokemon/me4-7/large" },
    tcgplayer: { prices: { holofoil: { market: 6.75 } } }
  },
  {
    id: "me4-10",
    name: "Ho-Oh",
    rarity: "Rare",
    images: { small: "https://images.scrydex.com/pokemon/me4-10/small", large: "https://images.scrydex.com/pokemon/me4-10/large" },
    tcgplayer: { prices: { holofoil: { market: 18.90 } } }
  },
  {
    id: "swsh3-154",
    name: "Rookidee",
    rarity: "Common",
    images: { small: "https://assets.tcgdex.net/en/swsh/swsh3/154/low.webp", large: "https://assets.tcgdex.net/en/swsh/swsh3/154/high.webp" },
    tcgplayer: { prices: { normal: { market: 0.04 } } }
  },
  {
    id: "swsh3-155",
    name: "Corvisquire",
    rarity: "Uncommon",
    images: { small: "https://assets.tcgdex.net/en/swsh/swsh3/155/low.webp", large: "https://assets.tcgdex.net/en/swsh/swsh3/155/high.webp" },
    tcgplayer: { prices: { normal: { market: 0.15 } } }
  },
  {
    id: "sve-10",
    name: "Basic Fire Energy",
    rarity: "Common",
    images: { small: "https://images.scrydex.com/pokemon/sve-10/medium", large: "https://images.scrydex.com/pokemon/sve-10/medium" },
    tcgplayer: { prices: { normal: { market: 0.03 } } }
  }
];

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

const getRealCardPrice = (poke: PokemonCard): number => {
  // 1. Check direct TCGdex live pricing object or memory cache with Cardmarket bedrock guard rail
  if (!cardFullCache.has(poke.id) && !poke.pricing && !poke.prices && !poke.tcgplayer?.prices && poke.id) {
    fetchCardFull(poke.id).catch(() => {});
  }
  const cached = cardFullCache.get(poke.id);
  const activePricing = cached?.pricing || (cached?.tcgplayer || cached?.cardmarket ? { tcgplayer: cached.tcgplayer, cardmarket: cached.cardmarket } : poke.pricing);
  if (activePricing || cached?.tcgplayer || cached?.cardmarket || poke.tcgplayer) {
    let foundPrice = 0;

    // First establish Cardmarket bedrock price (converted to USD) if listed
    let cmUsd = 0;
    const cmObj = activePricing?.cardmarket || cached?.cardmarket || poke.cardmarket;
    if (cmObj) {
      const cmVal = cmObj.trend ?? cmObj.avg ?? cmObj['trend-holo'] ?? cmObj['avg-holo'] ?? cmObj.avg30 ?? cmObj.low;
      if (typeof cmVal === 'number' && !isNaN(cmVal) && cmVal > 0) {
        cmUsd = cmVal * (cmObj.unit === 'EUR' ? 1.08 : 1);
      }
    }

    // Evaluate TCGplayer prices using the direct variant live price first
    const tcgObj = activePricing?.tcgplayer || cached?.tcgplayer || (poke.tcgplayer?.prices || poke.tcgplayer);
    if (tcgObj) {
      const tcg = tcgObj;
      const candidates: number[] = [];
      for (const key of Object.keys(tcg)) {
        if (typeof tcg[key] === 'object' && tcg[key] !== null) {
          const sub = tcg[key];
          const val = sub.marketPrice ?? sub.midPrice ?? sub.lowPrice ?? sub.highPrice ?? sub.market ?? sub.mid ?? sub.low;
          if (typeof val === 'number' && !isNaN(val) && val > 0) {
            candidates.push(val);
          }
        }
      }

      if (candidates.length > 0) {
        // If drawn in Slot 9 Reverse Holo slot, prefer reverseHolofoil price if present
        if (poke.isReverseHolo && (tcg.reverseHolofoil || tcg.reverse)) {
          const rev = tcg.reverseHolofoil ?? tcg.reverse;
          const rVal = rev.marketPrice ?? rev.midPrice ?? rev.lowPrice;
          foundPrice = (typeof rVal === 'number' && !isNaN(rVal) && rVal > 0) ? rVal : candidates[0];
        } else if (tcg.holofoil && typeof tcg.holofoil === 'object') {
          const hVal = tcg.holofoil.marketPrice ?? tcg.holofoil.midPrice ?? tcg.holofoil.lowPrice;
          foundPrice = (typeof hVal === 'number' && !isNaN(hVal) && hVal > 0) ? hVal : candidates[0];
        } else if (tcg.normal && typeof tcg.normal === 'object') {
          const nVal = tcg.normal.marketPrice ?? tcg.normal.midPrice ?? tcg.normal.lowPrice;
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

    // If no TCGplayer price was found, fallback directly to Cardmarket bedrock
    if (foundPrice === 0 && cmUsd > 0) {
      foundPrice = cmUsd;
    }

    if (foundPrice > 0) return Number(foundPrice.toFixed(2));
  }

  // 2. Check array prices
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

  // 3. Check legacy tcgplayer object
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

  const isEnergy = poke.name?.toLowerCase().includes('energy') || poke.id?.toLowerCase().includes('energy');
  const isExOrMega = poke.name?.includes('ex') || poke.name?.includes('MEGA') || poke.name?.includes('VMAX') || poke.name?.includes('VSTAR');
  const rarity = poke.rarity || '';

  // If it's an energy card or a common/uncommon card with no direct live market data, fix cost strictly between 1 to 10 cents ($0.01 - $0.10)
  if (isEnergy || rarity.includes('Common') || rarity.includes('Uncommon') || !rarity) {
    return Number((0.01 + Math.random() * 0.09).toFixed(2));
  }

  const isHolyGrailName = /Charizard|Pikachu|Umbreon|Rayquaza|Giratina|Mewtwo|Lugia|Gengar|Blastoise|Venusaur|Mew/i.test(poke.name || '');
  const isSecretOrAlt = rarity.includes('Secret') || rarity.includes('Special Illustration') || rarity.includes('Hyper') || rarity.includes('Rainbow') || rarity.includes('Gold');
  const isUltraOrEx = isExOrMega || rarity.includes('ex') || rarity.includes('VMAX') || rarity.includes('VSTAR') || rarity.includes('Ultra');

  if (isHolyGrailName && (isSecretOrAlt || isUltraOrEx)) {
    return Number((95.00 + normalizedHash * 160.00).toFixed(2));
  } else if (isSecretOrAlt) {
    return Number((32.00 + normalizedHash * 55.00).toFixed(2));
  } else if (isHolyGrailName || isUltraOrEx || rarity.includes('Double Rare')) {
    return Number((4.50 + normalizedHash * 14.00).toFixed(2));
  } else if (rarity.includes('Rare') || rarity.includes('Illustration') || rarity.includes('Holo')) {
    return Number((0.75 + normalizedHash * 3.50).toFixed(2));
  } else {
    return Number((0.01 + Math.random() * 0.09).toFixed(2));
  }
};

const generateFallbackPack = (pool: PokemonCard[], fallbackSet?: { id?: string; name?: string } | TCGDexSetSummary | TCGDexSet | null): CardData[] => {
  const sourcePool = pool.length > 0 ? pool : FALLBACK_POKEMON_CARDS;

  const commons = sourcePool.filter(c => c.rarity?.includes('Common') && !c.name.includes('Energy'));
  const uncommons = sourcePool.filter(c => c.rarity?.includes('Uncommon') && !c.name.includes('Energy'));
  const rares = sourcePool.filter(c => !c.rarity?.includes('Common') && !c.rarity?.includes('Uncommon') && !c.name.includes('Energy'));
  const energy = sourcePool.filter(c => c.name.includes('Energy'));

  const nonEnergySourcePool = sourcePool.filter(c => !c.name.includes('Energy'));
  const fallbackCardPool = nonEnergySourcePool.length > 0 ? nonEnergySourcePool : sourcePool;

  const pickedIds = new Set<string>();

  const pickUnique = (candidates: PokemonCard[]): PokemonCard => {
    const unpicked = candidates.filter(c => !pickedIds.has(c.id));
    if (unpicked.length > 0) {
      const chosen = unpicked[Math.floor(Math.random() * unpicked.length)];
      if (chosen) {
        pickedIds.add(chosen.id);
        return chosen;
      }
    }
    const rem = fallbackCardPool.filter(c => !pickedIds.has(c.id));
    if (rem.length > 0) {
      const chosen = rem[Math.floor(Math.random() * rem.length)];
      if (chosen) {
        pickedIds.add(chosen.id);
        return chosen;
      }
    }
    return fallbackCardPool[0] || sourcePool[0];
  };

  const getC = () => pickUnique(commons.length > 0 ? commons : fallbackCardPool);
  const getU = () => pickUnique(uncommons.length > 0 ? uncommons : fallbackCardPool);
  const getR = () => pickUnique(rares.length > 0 ? rares : fallbackCardPool);
  const getE = (): PokemonCard => {
    if (energy.length > 0) return energy[Math.floor(Math.random() * energy.length)];
    const id = (fallbackSet?.id || '').toLowerCase();
    const name = (fallbackSet?.name || '').toLowerCase();
    const era: EnergyEra = 
      id.startsWith('me') || name.includes('mega evolution') || name.includes('phantasmal') || name.includes('ascended') || name.includes('perfect order') || name.includes('chaos rising') ? 'me' :
      id.startsWith('sv') || name.includes('scarlet') || name.includes('paldea') || name.includes('obsidian') || name.includes('paradox') || name.includes('temporal') || name.includes('twilight') || name.includes('stellar') || name.includes('surging') || name.includes('151') || name.includes('prismatic') || name.includes('shrouded') ? 'sv' :
      id.startsWith('sm') || name.includes('sun & moon') || name.includes('guardians rising') || name.includes('burning shadows') || name.includes('cosmic eclipse') || name.includes('hidden fates') ? 'sm' :
      id.startsWith('xy') || name.includes('flashfire') || name.includes('furious fists') || name.includes('roaring skies') || name.includes('evolutions') || name.includes('phantom forces') ? 'xy' :
      id.startsWith('base') || id === 'bs1' || id === 'bs2' || id === 'ju' || id === 'fo' || id === 'tr' || name.includes('base set') || name.includes('jungle') || name.includes('fossil') || name.includes('team rocket') ? 'base' : 'swsh';
    const pool = ENERGY_POOLS_BY_ERA[era] || ENERGY_POOLS_BY_ERA.sv;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    return {
      ...chosen,
      images: {
        small: chosen.image,
        large: chosen.image
      },
      rarity: 'Basic Energy'
    };
  };

  const selected: PokemonCard[] = [];
  // Slot 1: 1 Basic Energy
  selected.push(getE());
  // Slots 2-6: 5 Commons
  for (let i = 0; i < 5; i++) selected.push(getC());
  // Slots 7-9: 3 Uncommons
  for (let i = 0; i < 3; i++) selected.push(getU());
  // Slot 10: 1 Reverse Holo
  const revCard = getC();
  selected.push({ ...revCard, isReverseHolo: true, rarity: 'Reverse Holo' });
  // Slot 11: 1 Rare or higher
  selected.push(getR());

  const formatted = selected.map((poke, idx) => {
    const val = getRealCardPrice(poke);
    return {
      id: Date.now() + idx + Math.floor(Math.random() * 1000),
      originalIndex: idx,
      flipped: false,
      collected: false,
      value: val,
      pokemon: poke
    };
  });
  const energyIdx = formatted.findIndex(c => c.pokemon.name?.toLowerCase().includes('energy') || c.pokemon.id?.toLowerCase().includes('energy'));
  if (energyIdx > 0) {
    const [energyCard] = formatted.splice(energyIdx, 1);
    formatted.unshift(energyCard);
  }
  ensureMostExpensiveLast(formatted);
  // Reverse array so Slot 1 (Basic Energy) is at index length-1 (top of DOM stack, revealed first) and Slot 11/10 (Rare hit) is at index 0 (bottom of stack, revealed last)
  formatted.reverse();
  return formatted.map((c, idx) => ({ ...c, originalIndex: idx }));
};

const ensureMostExpensiveLast = (cards: CardData[]): CardData[] => {
  if (cards.length <= 1) return cards;
  let maxIdx = 1;
  let maxVal = cards[1].value;
  for (let i = 2; i < cards.length; i++) {
    if (cards[i].value >= maxVal) {
      maxVal = cards[i].value;
      maxIdx = i;
    }
  }
  if (maxIdx !== cards.length - 1) {
    const [mostExpensive] = cards.splice(maxIdx, 1);
    cards.push(mostExpensive);
  }
  return cards;
};

const formatAndSortCards = (newCards: PokemonCard[]): CardData[] => {
  const formatted = newCards.map((poke, idx) => ({
    id: Date.now() + idx + Math.floor(Math.random() * 1000),
    originalIndex: idx,
    flipped: false,
    collected: false,
    value: getRealCardPrice(poke),
    pokemon: poke
  }));
  const energyIdx = formatted.findIndex(c => c.pokemon.name?.toLowerCase().includes('energy') || c.pokemon.id?.toLowerCase().includes('energy'));
  if (energyIdx > 0) {
    const [energyCard] = formatted.splice(energyIdx, 1);
    formatted.unshift(energyCard);
  }
  ensureMostExpensiveLast(formatted);
  // Reverse array so Slot 1 (Basic Energy) is revealed first and Slot 11/10 is revealed last
  formatted.reverse();
  return formatted.map((c, idx) => ({ ...c, originalIndex: idx }));
};

const StatsPill = React.memo(({ label, value, highlight = false, colorClass }: { label: string; value: string; highlight?: boolean; colorClass?: string }) => (
  <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border backdrop-blur-xl transition-all ${highlight
    ? 'bg-gradient-to-r from-[#1f1f2e] via-[#1a1a24] to-[#14141c] border-amber-500/50 shadow-[0_8px_20px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(245,158,11,0.25)]'
    : 'bg-[#14141c]/90 border-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]'
    }`}>
    <span className="text-gray-400 text-xs font-extrabold uppercase tracking-wider">{label}:</span>
    <span className={`text-sm font-black tracking-wide ${colorClass ? colorClass : (highlight ? 'text-amber-300' : 'text-white')}`}>{value}</span>
  </div>
));

const Card = React.memo(({
  card,
  rotation,
  offsetX,
  offsetY,
  isTopCard,
  isHovered,
  setName
}: {
  card: CardData;
  rotation: number;
  offsetX: number;
  offsetY: number;
  isTopCard: boolean;
  isHovered: boolean;
  setName?: string;
}) => {
  const cardLiveValue = getRealCardPrice(card.pokemon);
  return (
    <motion.div
      initial={{ y: 200, opacity: 0, scale: 0.8 }}
      animate={{
        y: card.flipped ? offsetY - 30 : offsetY,
        opacity: 1,
        scale: card.flipped ? 1.15 : 1,
        rotateZ: card.flipped ? 0 : rotation,
        x: card.flipped ? 0 : offsetX
      }}
      exit={{ x: 380, y: -160, opacity: 0, scale: 0.65, rotateZ: 25 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        zIndex: card.originalIndex,
        perspective: 1200,
        position: 'absolute',
      }}
      className={`w-60 sm:w-68 aspect-[0.718] cursor-pointer select-none group ${isTopCard ? 'hover:scale-[1.18]' : ''} transition-transform duration-300`}
    >
      <motion.div
        animate={{ rotateY: card.flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          position: 'relative'
        }}
      >
        {/* FACE DOWN SIDE (Pokemon Card Back) */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl pointer-events-none"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'radial-gradient(circle at center, #1c1c24 0%, #0d0d0f 100%)',
            border: '3px solid rgba(245,158,11,0.4)'
          }}
        >
          <div className="absolute inset-2 rounded-xl border-2 border-amber-500/30 flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent">
            <div className="w-20 h-20 rounded-full border-4 border-amber-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.4)] bg-[#14141c]/95">
              <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
            </div>
            <span className="mt-3 text-xs font-black tracking-wider text-amber-300 uppercase opacity-90 text-center px-2 line-clamp-2">
              {setName || "POKÉMON TCG"}
            </span>
          </div>

          <div
            className="absolute bottom-6 left-0 right-0 flex justify-center transition-all duration-300 pointer-events-none"
            style={{ opacity: (isTopCard && !card.flipped) ? 1 : 0 }}
          >
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.6)] border border-amber-300/50 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-200" />
              Click to Reveal
            </span>
          </div>
        </div>

        {/* Back side (Revealed Card Face) */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-black"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            border: '2px solid rgba(255, 255, 250, 0.4)'
          }}
        >
          <img
            src={card.pokemon.images.large || card.pokemon.images.small}
            alt={card.pokemon.name}
            className="w-full h-full object-cover block rounded-2xl"
            onError={(e) => {
              const num = card.pokemon.localId || card.pokemon.id?.split('-')[1] || '1';
              const setId = card.pokemon.id?.split('-')[0] || 'swsh3';
              handleCardImageError(e.target as HTMLImageElement, setId, num);
            }}
          />

          <div
            className="absolute bottom-6 left-0 right-0 flex justify-center transition-all duration-300 pointer-events-none"
            style={{ opacity: (isTopCard && card.flipped) ? 1 : 0 }}
          >
            <span className="px-3.5 py-1 rounded-full bg-green-600/95 text-white text-[11px] font-bold uppercase tracking-wider shadow-[0_4px_15px_rgba(22,163,74,0.6)] border border-green-300/50 flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-3 h-3 text-green-200" />
              Collect (${cardLiveValue.toFixed(2)})
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

const CardMarketModal = React.memo(({ card, onClose, onAddToBinder, isAddedToBinder, initialViewMode = 'market', onUpdatePrice }: { card: CardData; onClose: () => void; onAddToBinder?: (c: CardData) => void; isAddedToBinder?: boolean; initialViewMode?: 'market' | 'art'; onUpdatePrice?: (newPrice: number, newPoke: PokemonCard) => void }) => {
  const poke = card.pokemon;
  const [liveCardFull, setLiveCardFull] = useState<TCGDexCardFull | null>(() => cardFullCache.get(poke.id) || null);

  useEffect(() => {
    if (!liveCardFull && !poke.pricing?.cardmarket?.idProduct) {
      fetchCardFull(poke.id)
        .then(data => {
          if (data && (data.pricing || data.tcgplayer || data.cardmarket)) {
            setLiveCardFull(data);
          }
        })
        .catch(() => { });
    }
  }, [poke.id, liveCardFull, poke.pricing]);

  const pricing = liveCardFull?.pricing || poke.pricing;
  const tcg = pricing?.tcgplayer || liveCardFull?.tcgplayer || poke.tcgplayer?.prices || poke.tcgplayer;
  const cm = pricing?.cardmarket || liveCardFull?.cardmarket || poke.cardmarket;

  const tcgVariants = tcg ? Object.keys(tcg).filter(k => typeof tcg[k] === 'object' && tcg[k] !== null && k !== 'prices') : [];
  const activePoke: PokemonCard = liveCardFull ? {
    ...poke,
    pricing: liveCardFull.pricing || poke.pricing,
    tcgplayer: liveCardFull.tcgplayer || liveCardFull.pricing?.tcgplayer ? { prices: liveCardFull.tcgplayer || liveCardFull.pricing?.tcgplayer, unit: 'USD' } : poke.tcgplayer,
    cardmarket: liveCardFull.cardmarket || liveCardFull.pricing?.cardmarket || poke.cardmarket,
    illustrator: liveCardFull.illustrator || poke.illustrator
  } : poke;
  const liveCardPrice = getRealCardPrice(activePoke);

  useEffect(() => {
    if (liveCardPrice !== card.value && onUpdatePrice) {
      onUpdatePrice(liveCardPrice, activePoke);
    }
  }, [liveCardPrice, card.value, onUpdatePrice, activePoke]);

  const [viewMode, setViewMode] = useState<'market' | 'art'>(initialViewMode);
  const [zoom, setZoom] = useState<number>(0.9);
  const [isFlipped, setIsFlipped] = useState(false);

  const card3dRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (card3dRef.current) {
      card3dRef.current.style.transform = `scale(${zoom})`;
    }
  }, [zoom, isFlipped]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => { sound.playModalClose(); onClose(); }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-[3px] flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-gradient-to-b from-[#1c1c24] via-[#14141c] to-[#0d0d0f] border border-white/20 rounded-3xl w-full overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.15)] flex flex-col my-8 transition-all duration-300 ${viewMode === 'art' ? 'max-w-4xl max-h-[92vh]' : 'max-w-3xl md:flex-row max-h-[85vh]'
          }`}
      >
        {viewMode === 'art' ? (
          /* ========================================================
             ✨ INTERACTIVE 3D HOLOGRAPHIC ART ADMIRATION STUDIO ✨
             ======================================================== */
          <div className="flex flex-col h-full bg-gradient-to-b from-[#1c1c24] via-[#121218] to-[#0d0d0f] p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-400/30 text-amber-300">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    {poke.name}
                    <span className="text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">{poke.rarity || 'Common'}</span>
                  </h3>
                  <span className="text-xs text-gray-400">High Resolution Art Studio • Zoom & inspect card artwork</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { sound.playModalOpen(); setViewMode('market'); }}
                  className="px-4 py-2 rounded-xl bg-[#1f1f2e] hover:bg-[#28283c] border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Market Data
                </button>
                <button
                  onClick={() => { sound.playModalClose(); onClose(); }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Showcase Area */}
            <div
              className="flex-1 flex flex-col items-center justify-center py-6 overflow-hidden select-none"
            >
              <div
                ref={card3dRef}
                style={{
                  transform: `scale(${zoom})`,
                  transition: "transform 0.2s ease-out",
                  willChange: "transform",
                }}
                className="relative w-44 sm:w-52 md:w-60 aspect-[0.718] mx-auto my-auto"
              >
                <InteractiveCard3D
                  card={isFlipped ? { ...card, imageUrl: "https://images.pokemontcg.io/cardback.png", holofoil: false, rarity: "Common" } : card}
                  showcase={true}
                  disableTilt={false}
                  interactive={true}
                  className="w-full h-full shadow-[0_20px_60px_rgba(0,0,0,0.95)] rounded-2xl no-glow"
                />
              </div>
            </div>

            {/* Studio Controls Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-end gap-4 z-10 bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                  <button
                    onClick={() => { sound.playButtonClick(); setZoom(prev => Number(Math.max(0.4, prev - 0.2).toFixed(2))); }}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Zoom Out below 100%"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-mono font-bold text-amber-300">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => { sound.playButtonClick(); setZoom(prev => Number(Math.min(2.4, prev + 0.2).toFixed(2))); }}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => { sound.playCardFlip(); setIsFlipped(!isFlipped); }}
                  className="px-3 py-1.5 rounded-lg bg-[#1f1f2e] hover:bg-[#28283c] border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" /> {isFlipped ? "Show Artwork" : "Show Back"}
                </button>
              </div>
            </div>

            <div className="mt-3 text-center text-[11px] text-gray-500">
              Illustrated by <strong className="text-gray-300">{poke.illustrator || "Official Pokémon Artist"}</strong> • Card ID: <code className="text-amber-400">{poke.id}</code>
            </div>
          </div>
        ) : (
          /* ========================================================
             📊 STANDARD LIVE MARKET DATA INSPECTION VIEW 📊
             ======================================================== */
          <>
            <div className="md:w-5/12 bg-gradient-to-b from-gray-900 to-black p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 relative">
              <div className="absolute top-4 left-4">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Live Market Data
                </span>
              </div>
              <div
                onClick={() => { sound.playModalOpen(); setViewMode('art'); }}
                className="w-44 sm:w-52 aspect-[0.718] mt-6 md:mt-4 relative group cursor-pointer"
              >
                <InteractiveCard3D
                  card={card}
                  interactive={true}
                  showcase={true}
                  className="w-full h-full shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-white/20 rounded-2xl"
                >
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center backdrop-blur-[2px] z-20">
                    <Eye className="w-8 h-8 text-amber-400 mb-1.5 animate-bounce" />
                    <span className="text-xs font-extrabold text-white">✨ Admire Art Studio</span>
                    <span className="text-[10px] text-gray-300 mt-0.5">Click for High-Res Art Studio</span>
                  </div>
                </InteractiveCard3D>
              </div>
              <button
                onClick={() => { sound.playModalOpen(); setViewMode('art'); }}
                className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/40 hover:border-amber-400 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer hover:scale-105"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" /> Admire Card Art Studio
              </button>
              <div className="mt-4 text-center">
                <span className="text-2xl font-black text-emerald-400 tracking-tight block">${liveCardPrice.toFixed(2)}</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5 block">
                  {(tcgVariants.length === 0 && !cm) ? 'Fixed Valuation (No Live Data)' : 'Live Market Value'}
                </span>
              </div>
            </div>

            <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">{poke.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 uppercase font-semibold">ID: <code className="text-amber-300 font-mono">{poke.id}</code></span>
                      <span className="text-gray-600">•</span>
                      <span className="text-xs text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">{poke.rarity || 'Common'}</span>
                      {poke.isReverseHolo && (
                        <span className="text-xs text-amber-300 font-bold bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">✨ Reverse Holo Slot</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { sound.playModalClose(); onClose(); }}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">🏦</div>
                      <h3 className="font-bold text-sm text-gray-200">TCGplayer (North America)</h3>
                    </div>
                    {tcg?.updated && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(tcg.updated).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {tcgVariants.length > 0 ? (
                    <div className="space-y-2.5">
                      {tcgVariants.map(variant => {
                        const data = tcg[variant];
                        const market = data.marketPrice ?? data.market ?? data.midPrice ?? data.mid;
                        const low = data.lowPrice ?? data.low;
                        const high = data.highPrice ?? data.high;
                        const isSelectedVariant = (typeof market === 'number' ? Number(market.toFixed(2)) : (typeof low === 'number' ? Number(low.toFixed(2)) : -1)) === Number(liveCardPrice.toFixed(2));
                        return (
                          <div key={variant} className={`p-3 rounded-xl transition-all flex flex-col gap-1.5 ${isSelectedVariant
                            ? 'bg-amber-500/15 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                            : 'bg-white/5 border border-white/10'
                            }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-300 capitalize">{variant.replace(/([A-Z])/g, ' $1')}</span>
                                {isSelectedVariant && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[9px] font-bold text-amber-300 uppercase tracking-wider">
                                    Active Price
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-extrabold text-emerald-400">${typeof market === 'number' ? market.toFixed(2) : (typeof low === 'number' ? low.toFixed(2) : 'N/A')}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/5">
                              <span>Low: <strong className="text-gray-300">${typeof low === 'number' ? low.toFixed(2) : '-'}</strong></span>
                              <span>Mid: <strong className="text-gray-300">${typeof data.midPrice === 'number' ? data.midPrice.toFixed(2) : '-'}</strong></span>
                              <span>High: <strong className="text-gray-300">${typeof high === 'number' ? high.toFixed(2) : '-'}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-gray-400 italic flex flex-col items-center justify-center gap-1">
                      <span>No direct TCGplayer price listings available for this variant.</span>
                      <span className="text-[11px] text-amber-300 font-medium not-italic">Applied fixed range ($0.01 - $0.10) for unlisted/energy card.</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">🏩</div>
                      <h3 className="font-bold text-sm text-gray-200">Cardmarket (Europe)</h3>
                    </div>
                    {cm?.updated && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(cm.updated).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {cm ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                        <span className="text-[11px] text-gray-400">Trend Price</span>
                        <span className="text-sm font-bold text-white mt-0.5">{cm.trend ? `€${cm.trend.toFixed(2)}` : (cm.avg ? `€${cm.avg.toFixed(2)}` : 'N/A')}</span>
                        {cm.trend && <span className="text-[10px] text-emerald-400/80 mt-0.5">≈ ${(cm.trend * 1.08).toFixed(2)} USD</span>}
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                        <span className="text-[11px] text-gray-400">30-Day Average</span>
                        <span className="text-sm font-bold text-white mt-0.5">{cm.avg30 ? `€${cm.avg30.toFixed(2)}` : 'N/A'}</span>
                        {cm.avg30 && <span className="text-[10px] text-gray-400 mt-0.5">Stable Avg</span>}
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                        <span className="text-[11px] text-gray-400">Low Price</span>
                        <span className="text-sm font-bold text-white mt-0.5">{cm.low ? `€${cm.low.toFixed(2)}` : 'N/A'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                        <span className="text-[11px] text-gray-400">Holo Trend</span>
                        <span className="text-sm font-bold text-amber-300 mt-0.5">{cm['trend-holo'] ? `€${cm['trend-holo'].toFixed(2)}` : (cm['avg-holo'] ? `€${cm['avg-holo'].toFixed(2)}` : 'N/A')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-gray-400 italic flex flex-col items-center justify-center gap-1">
                      <span>No Cardmarket data listed for this card.</span>
                      <span className="text-[11px] text-amber-300 font-medium not-italic">Applied fixed range ($0.01 - $0.10) for unlisted/energy card.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Live card data</span>
                </div>
                <div className="flex items-center gap-3">
                  {onAddToBinder && (
                    <button
                      onClick={() => onAddToBinder(card)}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${isAddedToBinder
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95'
                        }`}
                    >
                      {isAddedToBinder ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>In Binder</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4 text-white" />
                          <span>+ Add to Binder</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => { sound.playModalClose(); onClose(); }}
                    className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
});

const SERIES_TABS = [
  { id: 'me', name: 'Mega Evolution' },
  { id: 'sv', name: 'Scarlet & Violet' },
  { id: 'swsh', name: 'Sword & Shield' },
  { id: 'sm', name: 'Sun & Moon' },
  { id: 'xy', name: 'XY Series' },
  { id: 'base', name: 'Original / Base' },
];

const RevealedCardItem = React.memo(({
  card,
  isAdded,
  onInspect,
  onAddToBinder
}: {
  card: CardData;
  isAdded: boolean;
  onInspect: (card: CardData) => void;
  onAddToBinder: (card: CardData) => void;
}) => {
  return (
    <motion.div
      onClick={() => onInspect(card)}
      initial={{ scale: 0.3, opacity: 0, rotateY: 180, y: -50 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0, y: 0 }}
      transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
      whileHover={{ scale: 1.05, y: -8 }}
      className="flex flex-col items-center group w-36 sm:w-44 cursor-pointer"
    >
      <div
        className="relative w-full aspect-[0.718] rounded-2xl overflow-visible transition-all duration-300 group-hover:scale-105 card-aspect-ratio"
        style={{ aspectRatio: '63 / 88', minHeight: '190px', width: '100%' }}
      >
        <InteractiveCard3D
          card={card}
          interactive={true}
          className="w-full h-full shadow-[0_10px_25px_rgba(0,0,0,0.8)] border border-white/20 rounded-2xl group-hover:border-amber-400/60 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]"
        >
          {/* Price badge right above/on top of card art */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-black text-xs shadow-lg z-20 flex items-center gap-0.5 backdrop-blur-sm">
            <span>${card.value ? card.value.toFixed(2) : (setPackPrices[card.pokemon?.id?.split('-')[0] || 'swsh3'] || 5.99).toFixed(2)}</span>
          </div>
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/90 border border-white/20 text-[9px] font-bold text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            📊 Market Data
          </div>
        </InteractiveCard3D>
      </div>

      <div className="mt-3 w-full px-2.5 py-2 rounded-xl bg-[#141620]/95 border border-white/10 flex flex-col items-center text-center transition-all group-hover:bg-[#1c1e2b]/95 group-hover:border-white/20 shadow-lg">
        <span className="font-bold text-white text-xs truncate w-full">{card.pokemon.name}</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-emerald-400 font-extrabold text-xs tracking-wide shadow-sm">${card.value.toFixed(2)}</span>
          <span className="text-gray-400 text-[10px] uppercase font-semibold truncate">• {card.pokemon.rarity || 'Common'}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToBinder(card);
          }}
          className={`mt-2.5 w-full py-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${isAdded
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95'
            }`}
        >
          {isAdded ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
              <span>In Binder</span>
            </>
          ) : (
            <>
              <BookOpen className="w-3.5 h-3.5 text-white inline" />
              <span>+ Add to Binder</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
});

export default function App() {
  const { currentUser } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isHoveringStack, setIsHoveringStack] = useState(false);

  const [currentSet, setCurrentSet] = useState<TCGDexSet | null>(null);
  const [isLoadingPack, setIsLoadingPack] = useState<boolean>(false);
  const isLoadingPackRef = useRef<boolean>(false);
  const [isSetSelectorOpen, setIsSetSelectorOpen] = useState<boolean>(false);
  const [showChaseModal, setShowChaseModal] = useState<boolean>(false);
  const [cacheTick, setCacheTick] = useState<number>(0);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('swsh');
  const [currentSeriesData, setCurrentSeriesData] = useState<TCGDexSeries | null>(null);
  const [isLoadingSeries, setIsLoadingSeries] = useState<boolean>(false);

  const [sessionTotal, setSessionTotal] = useState(() => {
    try {
      const saved = localStorage.getItem('tcg_session_total');
      return saved !== null ? Number(saved) : 0;
    } catch { return 0; }
  });
  const [packCount, setPackCount] = useState(() => {
    try {
      const saved = localStorage.getItem('tcg_session_pack_count');
      return saved !== null ? Number(saved) : 0;
    } catch { return 0; }
  });
  const [sessionSpent, setSessionSpent] = useState(() => {
    try {
      const saved = localStorage.getItem('tcg_session_spent');
      return saved !== null ? Number(saved) : 0;
    } catch { return 0; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tcg_session_total', sessionTotal.toString());
      localStorage.setItem('tcg_session_pack_count', packCount.toString());
      localStorage.setItem('tcg_session_spent', sessionSpent.toString());
    } catch {}
  }, [sessionTotal, packCount, sessionSpent]);
  const [isRevealingAll, setIsRevealingAll] = useState(false);
  const [cards, setCards] = useState<CardData[]>([]);
  const [inspectedCard, setInspectedCard] = useState<CardData | null>(null);
  const [inspectedViewMode, setInspectedViewMode] = useState<'market' | 'art'>('market');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.isEnabled());
  const [activeTab, setActiveTab] = useState<'pack' | 'binder' | 'psa'>('pack');
  const [binderAddedIds, setBinderAddedIds] = useState<Set<number>>(new Set());
  const [binderSelectModal, setBinderSelectModal] = useState<{ cards: CardData[]; setName: string } | null>(null);
  const [availableBinders, setAvailableBinders] = useState<Binder[]>([]);

  // Sleeve animation state – set when user picks a binder
  const [sleeveQueue, setSleeveQueue] = useState<{
    cards: CardData[];
    setName: string;
    binderId: string;
  } | null>(null);

  // Slab states for $5+ hits
  const [slabPromptQueue, setSlabPromptQueue] = useState<{
    savedCards: Card[];
  } | null>(null);
  const [slabQueue, setSlabQueue] = useState<{
    card: Card;
  } | null>(null);

  const [packStage, setPackStage] = useState<'unopened' | 'tearing' | 'opened'>('unopened');
  const packStageRef = useRef(packStage);
  useEffect(() => { packStageRef.current = packStage; }, [packStage]);
  const currentSetRef = useRef(currentSet);
  useEffect(() => { currentSetRef.current = currentSet; }, [currentSet]);
  const [currentPackArts, setCurrentPackArts] = useState<string[]>(DARKNESS_ABLAZE_PACK_ARTS);
  const [packArtsManifest, setPackArtsManifest] = useState<Record<string, string[]>>({});
  const [setLogosManifest, setSetLogosManifest] = useState<Record<string, string>>({});
  const [packArtIndex, setPackArtIndex] = useState<number>(0);
  const [tearProgress, setTearProgress] = useState<number>(0);

  useEffect(() => {
    // Instant asset preloading right on website load for zero-latency sleeving & slabbing
    const pSleeve = new Image(); pSleeve.src = '/sleeve.png';
    const pSlab = new Image(); pSlab.src = '/slab.svg?v=clean3';

    fetch('/packArts/manifest.json')
      .then(res => res.ok ? res.json() : {})
      .then(data => setPackArtsManifest(data))
      .catch(() => { });

    fetch('/setLogos/manifest.json')
      .then(res => res.ok ? res.json() : {})
      .then(data => setSetLogosManifest(data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    // Aggressively preload all pack arts for the current set to ensure instant render
    currentPackArts.forEach(src => {
      const img = new Image();
      img.fetchPriority = 'high';
      img.src = src;
      
      // Inject network-level preload links to bypass React rendering delays
      if (!document.querySelector(`link[href="${src}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        link.fetchPriority = 'high';
        document.head.appendChild(link);
      }
    });
  }, [currentPackArts]);

  useEffect(() => {
    // We only want to preload if we have the manifest
    if (Object.keys(setLogosManifest).length === 0) return;

    let isActive = true;

    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // continue even on error
        img.src = src;
      });
    };

    const preloadSeriesLogos = async (seriesId: string) => {
      if (!isActive) return;
      try {
        const seriesData = await fetchSeriesDetails(seriesId);
        if (!isActive || !seriesData || !seriesData.sets) return;
        
        const logos = seriesData.sets
          .map(set => getSetLogoUrl(set, setLogosManifest))
          .filter(Boolean) as string[];

        // Preload sequentially with tiny delays so we don't clog the browser's max connection limit
        for (const src of logos) {
          if (!isActive) break;
          await preloadImage(src);
          await new Promise(r => setTimeout(r, 20));
        }
      } catch (err) {
        // ignore fetch errors for preloading
      }
    };

    const runProgressivePreload = async () => {
      // 1. First, load the logos of sets of the generation the user has currently selected
      await preloadSeriesLogos(selectedSeriesId);

      // 2. Only when that loading is finished, start loading up other generation's sets' logos in the background
      const otherSeries = SERIES_TABS.map(t => t.id).filter(id => id !== selectedSeriesId);
      for (const seriesId of otherSeries) {
        if (!isActive) break;
        await preloadSeriesLogos(seriesId);
        // Small delay between series preloads to keep network free for user interactions
        await new Promise(r => setTimeout(r, 100));
      }
    };

    runProgressivePreload();

    return () => {
      isActive = false;
    };
  }, [setLogosManifest, selectedSeriesId]);

  useEffect(() => {
    // Aggressively preload all card images inside the freshly generated pack
    // while the pack is sitting on the table unopened, so they load instantly when revealed
    if (cards.length > 0 && packStage === 'unopened') {
      cards.forEach(card => {
        const imgUrl = card.pokemon.images?.large || card.pokemon.images?.small;
        if (imgUrl) {
          const img = new Image();
          // Use low priority so it doesn't block UI threads, since they have time before opening
          (img as any).fetchPriority = 'low';
          img.src = imgUrl;
        }
      });
    }
  }, [cards, packStage]);

  useEffect(() => {
    const handleCacheUpdate = () => {
      setCacheTick(prev => prev + 1);
      setCards(prevCards => {
        let changed = false;
        const updated = prevCards.map(c => {
          const cached = cardFullCache.get(c.pokemon.id);
          if (cached) {
            const updatedPoke: PokemonCard = {
              ...c.pokemon,
              images: cached.image ? {
                small: getCardImageUrl(cached.image, 'low'),
                large: getCardImageUrl(cached.image, 'high'),
              } : c.pokemon.images,
              pricing: cached.pricing || c.pokemon.pricing,
              tcgplayer: cached.tcgplayer || cached.pricing?.tcgplayer ? { prices: cached.tcgplayer || cached.pricing?.tcgplayer, unit: 'USD' } : c.pokemon.tcgplayer,
              cardmarket: cached.cardmarket || cached.pricing?.cardmarket || c.pokemon.cardmarket,
              illustrator: cached.illustrator || c.pokemon.illustrator,
            };
            const newVal = getRealCardPrice(updatedPoke);
            if (newVal !== c.value || !c.pokemon.pricing?.cardmarket?.idProduct || (cached.image && !c.pokemon.images?.large?.includes(cached.image))) {
              changed = true;
              return { ...c, value: newVal, pokemon: updatedPoke };
            }
          }
          return c;
        });
        return changed ? updated : prevCards;
      });
      setInspectedCard(prev => {
        if (!prev) return null;
        const cached = cardFullCache.get(prev.pokemon.id);
        if (cached) {
          const updatedPoke: PokemonCard = {
            ...prev.pokemon,
            images: cached.image ? {
              small: getCardImageUrl(cached.image, 'low'),
              large: getCardImageUrl(cached.image, 'high'),
            } : prev.pokemon.images,
            pricing: cached.pricing || prev.pokemon.pricing,
            tcgplayer: cached.tcgplayer || cached.pricing?.tcgplayer ? { prices: cached.tcgplayer || cached.pricing?.tcgplayer, unit: 'USD' } : prev.pokemon.tcgplayer,
            cardmarket: cached.cardmarket || cached.pricing?.cardmarket || prev.pokemon.cardmarket,
            illustrator: cached.illustrator || prev.pokemon.illustrator,
          };
          const newVal = getRealCardPrice(updatedPoke);
          if (newVal !== prev.value) {
            return { ...prev, value: newVal, pokemon: updatedPoke };
          }
        }
        return prev;
      });
      setCacheTick(t => (t + 1) % 1000000);
    };
    onCardFullCacheUpdated.add(handleCacheUpdate);
    return () => { 
      onCardFullCacheUpdated.delete(handleCacheUpdate); 
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
    if (next) sound.playButtonClick();
  };

  const handleTearPack = () => {
    if (packStage !== 'unopened') return;
    setTearProgress(100);
    sound.playFoilTear();
    setPackStage('tearing');
    setPackCount(p => p + 1);
    setSessionSpent(s => Number((s + getSetBoosterPrice(currentSet)).toFixed(2)));
    setTimeout(() => {
      sound.playCardSlide();
    }, 450);
    setTimeout(() => {
      setPackStage('opened');
      setTearProgress(0);
    }, 900);
  };

  const loadSetAndGeneratePack = useCallback(async (setId: string) => {
    if (isLoadingPackRef.current) return;
    isLoadingPackRef.current = true;
    sound.playPackOpen();
    setIsLoadingPack(true);
    setIsSetSelectorOpen(false);
    setPackStage('unopened');
    setTearProgress(0);
    setBinderAddedIds(new Set());

    // Pick pack arts for this set from manifest or default
    const setArts = getPackArtsForSet(setId, undefined, packArtsManifest);
    setCurrentPackArts(setArts);
    setPackArtIndex(Math.floor(Math.random() * setArts.length));

    try {
      const setDetails = await fetchSetDetails(setId);
      setCurrentSet(setDetails);
      const refinedArts = getPackArtsForSet(setDetails.id || setId, setDetails.name, packArtsManifest);
      if (refinedArts !== DARKNESS_ABLAZE_PACK_ARTS || setArts === DARKNESS_ABLAZE_PACK_ARTS) {
        setCurrentPackArts(refinedArts);
      }
      const newCards = await generatePackFromSet(setDetails);
      setCards(formatAndSortCards(newCards));
    } catch (error) {
      console.error('Failed to load set pack from TCGdex:', error);
      setCards(generateFallbackPack(FALLBACK_POKEMON_CARDS, { id: setId }));
    } finally {
      isLoadingPackRef.current = false;
      setIsLoadingPack(false);
    }
  }, [packArtsManifest]);

  // Load initial set on mount
  useEffect(() => {
    loadSetAndGeneratePack('swsh3');
  }, [loadSetAndGeneratePack]);

  // Allow keyboard Left/Right arrows or A/D to cycle through pack arts when unopened
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (packStage !== 'unopened' || currentPackArts.length <= 1) return;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setPackArtIndex(prev => (prev + 1) % currentPackArts.length);
        sound.playTabSwitch();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setPackArtIndex(prev => (prev - 1 + currentPackArts.length) % currentPackArts.length);
        sound.playTabSwitch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [packStage, currentPackArts.length]);

  // Fetch series sets with race condition protection when modal opens or tab changes
  useEffect(() => {
    if (!isSetSelectorOpen) return;
    let isCurrent = true;
    setIsLoadingSeries(true);
    fetchSeriesDetails(selectedSeriesId)
      .then(data => {
        if (isCurrent && data) {
          setCurrentSeriesData(data);
        }
      })
      .catch(err => console.error('Error fetching series details:', err))
      .finally(() => {
        if (isCurrent) {
          setIsLoadingSeries(false);
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [isSetSelectorOpen, selectedSeriesId]);

  const handleStackMouseLeave = useCallback(() => {
    setIsHoveringStack(false);
  }, []);

  const { remainingCards, revealedCards, topCardId } = React.useMemo(() => {
    const rem = cards.filter(c => !c.collected);
    const rev = cards.filter(c => c.collected);
    const topId = rem.length > 0 ? rem[rem.length - 1].id : null;
    return { remainingCards: rem, revealedCards: rev, topCardId: topId };
  }, [cards]);

  const chaseCardsForActiveSet = React.useMemo(() => {
    if (!currentSet || !currentSet.cards || currentSet.cards.length === 0) return [];
    const candidates = currentSet.cards.filter(c => !c.name.toLowerCase().includes('energy') && !c.id.toLowerCase().includes('energy'));
    const mapped = candidates.map((card, idx) => {
      const cached = cardFullCache.get(card.id);
      const isExOrRare = card.name.includes('Charizard') || card.name.includes('Pikachu') || card.name.includes('Umbreon') || card.name.includes('Rayquaza') || card.name.includes('ex') || card.name.includes('VMAX') || card.name.includes('VSTAR') || card.name.includes('MEGA') || card.name.includes('Secret') || card.name.includes('Gold') || card.name.includes('Alt');
      const baseUrl = cached?.image || card.image || `https://assets.tcgdex.net/en/swsh/${currentSet.id}/${card.localId || card.id?.split('-').pop() || idx + 1}`;
      const poke: PokemonCard = {
        ...card,
        id: cached?.id || card.id,
        name: cached?.name || card.name,
        images: {
          small: getCardImageUrl(baseUrl, 'low'),
          large: getCardImageUrl(baseUrl, 'high'),
        },
        rarity: isExOrRare ? 'Special Illustration Rare' : (cached?.rarity || card.rarity || 'Rare'),
        pricing: cached?.pricing || (card as any).pricing,
        tcgplayer: cached?.tcgplayer || cached?.pricing?.tcgplayer ? { prices: cached?.tcgplayer || cached?.pricing?.tcgplayer, unit: 'USD' } : (card as any).tcgplayer,
        cardmarket: cached?.cardmarket || cached?.pricing?.cardmarket || (card as any).cardmarket,
        illustrator: cached?.illustrator || (card as any).illustrator,
      };
      return {
        card: poke,
        value: getRealCardPrice(poke)
      };
    });
    mapped.sort((a, b) => b.value - a.value);
    return mapped.slice(0, 12);
  }, [currentSet, cacheTick]);

  useEffect(() => {
    if (currentSet) {
      startBackgroundWarmupForSet(currentSet);
    }
  }, [currentSet]);

  const flipTimesRef = useRef<Record<number, number>>({});

  const handleCardClick = useCallback((id: number) => {
    if (isRevealingAll) return;
    const now = Date.now();
    const lastFlip = flipTimesRef.current[id] || 0;

    // Fast-responsive check: allow instant interaction after brief 160ms debounce so user feels buttery smooth response
    if (now - lastFlip < 160) {
      return;
    }

    setCards(prev => prev.map(card => {
      if (card.id === id) {
        if (!card.flipped) {
          flipTimesRef.current[id] = now;
          sound.playCardFlip(card.pokemon.rarity);
          setSessionTotal(s => Number((s + card.value).toFixed(2)));
          return { ...card, flipped: true };
        } else if (!card.collected) {
          sound.playCardCollect(card.value);
          if ((card.value || 0) < 1.00) {
            saveCardToCatalogue(card, currentSet?.name || 'Unknown Set');
          }
          return { ...card, collected: true };
        }
      }
      return card;
    }));
  }, [isRevealingAll]);

  const handleInspectCard = useCallback((card: CardData) => {
    sound.playModalOpen();
    setInspectedViewMode('market');
    setInspectedCard(card);
  }, []);

  const handleAddToBinderSingle = useCallback((card: CardData) => {
    if (binderAddedIds.has(card.id)) return;
    setAvailableBinders(getBinders());
    setBinderSelectModal({ cards: [card], setName: currentSet?.name || 'Unknown Set' });
  }, [binderAddedIds, currentSet?.name]);

  const handleRevealAll = () => {
    if (isRevealingAll || remainingCards.length === 0) return;
    setIsRevealingAll(true);
    sound.playButtonClick();

    // Reverse so the top-of-stack card (last element) is revealed first,
    // matching the visual stacking order where the top card has the highest index.
    const orderedCards = [...remainingCards].reverse();

    orderedCards.forEach((card, idx) => {
      // Step 1: Flip each card sequentially every 480ms so the reveal animation gets its full spotlight
      setTimeout(() => {
        sound.playRevealStep(idx, card.pokemon.rarity);
        setCards(prev => prev.map(c => {
          if (c.id === card.id && !c.flipped) {
            setSessionTotal(s => Number((s + c.value).toFixed(2)));
            return { ...c, flipped: true };
          }
          return c;
        }));
      }, idx * 480);

      // Step 2: Let the card stay face up and visible for 620ms (so you can admire the artwork/rarity),
      // then trigger collection and exit animation just as the next card begins to flip!
      setTimeout(() => {
        sound.playCardCollect(card.value);
        if ((card.value || 0) < 1.00) {
          saveCardToCatalogue(card, currentSet?.name || 'Unknown Set');
        }
        setCards(prev => prev.map(c => {
          if (c.id === card.id) {
            return { ...c, collected: true };
          }
          return c;
        }));
        if (idx === orderedCards.length - 1) {
          setTimeout(() => {
            sound.playPackComplete();
            setIsRevealingAll(false);
          }, 450);
        }
      }, idx * 480 + 620);
    });
  };

  const handleResetPack = async () => {
    sound.playPackOpen();
    setIsRevealingAll(false);
    setPackStage('unopened');
    setTearProgress(0);
    setBinderAddedIds(new Set());
    setPackArtIndex(prev => (prev + 1) % currentPackArts.length);
    if (currentSet) {
      if (isLoadingPackRef.current) return;
      isLoadingPackRef.current = true;
      setIsLoadingPack(true);
      try {
        const newCards = await generatePackFromSet(currentSet);
        setCards(formatAndSortCards(newCards));
      } catch {
        setCards(generateFallbackPack(FALLBACK_POKEMON_CARDS, currentSet));
      } finally {
        isLoadingPackRef.current = false;
        setIsLoadingPack(false);
      }
    } else {
      setCards(generateFallbackPack(FALLBACK_POKEMON_CARDS, currentSet));
    }
  };

  const handleResetStats = () => {
    sound.playButtonClick();
    try {
      localStorage.removeItem('tcg_session_total');
      localStorage.removeItem('tcg_session_pack_count');
      localStorage.removeItem('tcg_session_spent');
    } catch {}
    setSessionTotal(0);
    setPackCount(0);
    setSessionSpent(0);
  };

  return (
    <div
      className="w-full h-screen max-h-screen bg-[#0d0d0f] text-[#f0f0f2] font-sans overflow-hidden relative flex flex-col selection:bg-amber-500/30"
      style={{
        background: "radial-gradient(circle at center, #1c1c24 0%, #0d0d0f 100%)"
      }}
    >
      {/* Premium Leather Grain Texture Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(#262630_1px,transparent_1px)] [background-size:12px_12px] opacity-25 pointer-events-none" />

      {/* Warm Ambient Gold / Obsidian Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)] pointer-events-none" />

      {/* Premium Leather-Bound Header */}
      <header className="w-full py-2.5 px-2.5 sm:py-4 sm:px-6 md:py-5 md:px-8 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 z-10 relative border-b border-white/10 bg-[#14141c]/95 backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.12)]">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3.5 w-full lg:w-auto justify-center lg:justify-start">
          <motion.button
            onClick={() => { sound.playModalOpen(); setIsSetSelectorOpen(true); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.65),inset_0_2px_4px_rgba(255,255,255,0.8)] border border-yellow-200 hover:border-white flex items-center gap-1.5 sm:gap-2.5 cursor-pointer transition-all duration-300 group shrink-0 transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black font-black group-hover:-translate-x-1 transition-transform shrink-0" />
            <span className="tracking-wide uppercase font-black">Choose Set</span>
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black animate-pulse shrink-0" />
          </motion.button>

          <button
            onClick={() => { sound.playButtonClick(); setActiveTab(t => t === 'pack' ? 'binder' : 'pack'); }}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 sm:gap-2.5 cursor-pointer shrink-0 ${activeTab === 'binder'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 border-amber-300 text-white shadow-[0_4px_20px_rgba(245,158,11,0.5),inset_0_1px_2px_rgba(255,255,255,0.3)]'
              : 'bg-[#181822]/90 border-white/15 text-gray-200 hover:bg-[#222230] hover:border-white/30 shadow-[0_4px_15px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]'
              }`}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
            <span className="tracking-wide">{activeTab === 'binder' ? 'Back to Packs' : 'My Binder'}</span>
          </button>

          <button
            onClick={() => { sound.playButtonClick(); setActiveTab(t => t === 'psa' ? 'pack' : 'psa'); }}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 sm:gap-2.5 cursor-pointer shrink-0 ${activeTab === 'psa'
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 border-red-400 text-white shadow-[0_4px_25px_rgba(239,68,68,0.6),inset_0_1px_2px_rgba(255,255,255,0.3)]'
              : 'bg-[#1f1620]/90 border-red-500/30 text-red-300 hover:bg-[#2c1f2e] hover:border-red-400/60 shadow-[0_4px_15px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]'
              }`}
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 animate-bounce shrink-0" />
            <span className="tracking-wide">{activeTab === 'psa' ? 'Back to Packs' : 'PSA Grading Lab'}</span>
          </button>

          <button
            onClick={() => { sound.playButtonClick(); setIsBulkModalOpen(true); }}
            className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 sm:gap-2.5 cursor-pointer shrink-0 bg-[#0f1a20]/90 border-teal-500/30 text-teal-300 hover:bg-[#132028] hover:border-teal-400/60 shadow-[0_4px_15px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]"
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" />
            <span className="tracking-wide">Bulk Vault</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end mt-1 lg:mt-0">
          <button
            onClick={toggleSound}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs font-extrabold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${soundEnabled
              ? 'bg-[#1f1f2e] border-amber-500/40 text-amber-300 hover:bg-[#28283c] shadow-[0_4px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(245,158,11,0.2)]'
              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            title={soundEnabled ? "Sound Effects ON" : "Sound Effects MUTED"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />}
            <span>{soundEnabled ? 'SFX On' : 'SFX Muted'}</span>
          </button>
          {currentUser ? (
            <button
              onClick={() => signOut(auth)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs font-extrabold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 bg-white/5 border-white/10 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 shadow-[0_4px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{currentUser.email?.split('@')[0] || 'User'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs font-extrabold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/50 shadow-[0_0_15px_rgba(147,51,234,0.4),inset_0_1px_2px_rgba(255,255,255,0.3)]"
            >
              <UserCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200 shrink-0" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content or Binder View */}
      {activeTab === 'binder' ? (
        <BinderView
          onSwitchToPacks={() => setActiveTab('pack')}
          onInspectCard={(binderCard) => {
            sound.playModalOpen();
            setInspectedViewMode('art');
            const cardData: any = {
              id: 0,
              originalIndex: 0,
              flipped: false,
              collected: true,
              value: binderCard.currentPrice || 0,
              isSlabbed: binderCard.isSlabbed || false,
              slabGrade: binderCard.slabGrade || 'N/A',
              psaDetails: binderCard.psaDetails,
              pokemon: {
                id: binderCard.id.split('-')[0] + '-' + binderCard.id.split('-')[1] || binderCard.id,
                name: binderCard.name || 'Pokemon Card',
                rarity: binderCard.rarity || 'Common',
                isReverseHolo: binderCard.holofoil || false,
                illustrator: 'Official Pokémon Artist',
                isSlabbed: binderCard.isSlabbed || false,
                slabGrade: binderCard.slabGrade || 'N/A',
                psaDetails: binderCard.psaDetails,
                images: {
                  small: binderCard.imageUrl || '',
                  large: binderCard.imageUrl || '',
                },
                pricing: {
                  tcgplayer: {},
                  cardmarket: {}
                }
              }
            };
            setInspectedCard(cardData);
          }}
        />
      ) : activeTab === 'psa' ? (
        <PSAGradingLab
          onBackToPacks={() => setActiveTab('pack')}
          onGradeComplete={() => {
            getBinders();
          }}
        />
      ) : (
        <main className="flex-1 flex flex-col items-center justify-start pt-2 z-10 relative px-4 pb-12 overflow-y-auto overflow-x-hidden w-full">

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 text-center shrink-0"
          >
            {currentSet?.name || 'Live Cards'}
          </motion.h1>

          {/* Unified Command & Stats Console HUD */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-4xl mx-auto mb-6 shrink-0 rounded-3xl bg-gradient-to-b from-[#161622]/90 via-[#101018]/90 to-[#0a0a10]/95 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.12)] backdrop-blur-2xl p-4 sm:p-5 relative overflow-hidden z-20"
          >
            {/* Subtle ambient glowing background glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Grid: Financial Performance Pods */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 relative z-10">
              {/* Pod 1: Pack Price */}
              <div className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between transition-all group">
                <div className="flex items-center justify-between text-gray-400 text-[11px] font-extrabold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" /> Pack Cost</span>
                </div>
                <div className="text-base sm:text-lg font-black font-mono tracking-tight text-white mt-1.5">
                  ${getSetBoosterPrice(currentSet).toFixed(2)}
                </div>
              </div>

              {/* Pod 2: Total Spent */}
              <div className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between transition-all group">
                <div className="flex items-center justify-between text-gray-400 text-[11px] font-extrabold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" /> Total Spent</span>
                </div>
                <div className="text-base sm:text-lg font-black font-mono tracking-tight text-gray-200 mt-1.5">
                  ${sessionSpent.toFixed(2)}
                </div>
              </div>

              {/* Pod 3: Total Value Opened */}
              <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/35 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between relative overflow-hidden shadow-[inset_0_1px_2px_rgba(245,158,11,0.2)] group">
                <div className="flex items-center justify-between text-amber-300/90 text-[11px] font-extrabold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Value Opened</span>
                </div>
                <div className="text-lg sm:text-xl font-black font-mono tracking-tight text-amber-300 mt-1.5 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                  ${sessionTotal.toFixed(2)}
                </div>
              </div>

              {/* Pod 4: Net Return */}
              <div className={`rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between transition-all relative overflow-hidden ${(sessionTotal - sessionSpent) >= 0
                ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/40 text-emerald-300 shadow-[inset_0_1px_2px_rgba(16,185,129,0.2)]'
                : 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent border border-rose-500/40 text-rose-300 shadow-[inset_0_1px_2px_rgba(244,63,94,0.2)]'
                }`}>
                <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider opacity-90">
                  <span className="flex items-center gap-1.5">
                    {(sessionTotal - sessionSpent) >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    Net Return
                  </span>
                </div>
                <div className={`text-lg sm:text-xl font-black font-mono tracking-tight mt-1.5 ${(sessionTotal - sessionSpent) >= 0
                  ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                  }`}>
                  {(sessionTotal - sessionSpent) >= 0 ? '+' : '-'}${Math.abs(sessionTotal - sessionSpent).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Bottom Bar: Pack Progress & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/10 relative z-10">
              {/* Live Progress Indicator */}
              <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-4 py-2 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>{packStage === 'unopened' ? 'Ready to Rip:' : 'Revealed:'}</span>
                  <span className="font-mono text-white text-sm">{packStage === 'unopened' ? 0 : (cards.length - remainingCards.length)}</span>
                  <span className="text-gray-500">/</span>
                  <span className="font-mono text-gray-400 text-sm">{cards.length || 11}</span>
                </div>
                <div className="w-20 sm:w-28 h-2 bg-white/10 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                    style={{ width: `${packStage === 'unopened' ? 0 : Math.round(((cards.length - remainingCards.length) / (cards.length || 11)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={handleResetStats}
                  disabled={isLoadingPack}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-40 shrink-0"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${isLoadingPack ? 'animate-spin' : ''}`} />
                  Reset Stats
                </button>
                <button
                  onClick={handleResetPack}
                  disabled={isLoadingPack}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_4px_20px_rgba(245,158,11,0.5),inset_0_1px_2px_rgba(255,255,255,0.3)] hover:shadow-[0_6px_30px_rgba(245,158,11,0.8)] hover:from-amber-400 hover:to-orange-400 transition-all border border-amber-300/50 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                >
                  {isLoadingPack && <Loader2 className="w-4 h-4 animate-spin" />}
                  Open Another Pack!
                </button>
              </div>
            </div>
          </motion.div>

          {/* 📱 Mobile-Only Set Intelligence & Top Chase Grails Bar (Hidden on Desktop >= lg) */}
          <div className="flex lg:hidden flex-col gap-2.5 w-full max-w-md mx-auto px-3 my-3 shrink-0">
            {/* Top Row: Active Set Info + View All Chase Modal Button */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#1a1a26]/95 via-[#181824]/95 to-[#14141c]/95 border border-amber-500/40 shadow-[0_6px_25px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow-sm">
                  🔥
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <span>Top Chase Grails</span>
                    <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded text-[9px] border border-amber-400/30">
                      {chaseCardsForActiveSet.length} Grails
                    </span>
                  </div>
                  <div className="text-xs font-black text-white truncate mt-0.5">
                    {currentSet?.name || 'Scarlet & Violet: Prismatic Evolutions'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { sound.playButtonClick(); setShowChaseModal(true); }}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs shadow-[0_4px_15px_rgba(245,158,11,0.5)] border border-amber-300/60 flex items-center gap-1 shrink-0 active:scale-95 transition-all cursor-pointer"
              >
                <span>View All 12</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bottom Row: Compact Top 3 Chase Cards Gallery for Mobile */}
            <div className="grid grid-cols-3 gap-2 w-full">
              {chaseCardsForActiveSet.slice(0, 3).map(({ card, value }, idx) => (
                <div
                  key={card.id || idx}
                  onClick={() => {
                    sound.playCardFlip();
                    setInspectedCard({
                      id: Date.now() + idx,
                      originalIndex: idx,
                      flipped: false,
                      collected: false,
                      value,
                      pokemon: card
                    });
                  }}
                  className="flex flex-col items-center p-2 rounded-xl bg-[#14141c]/90 border border-white/15 hover:border-amber-400/60 shadow-md active:scale-95 transition-all cursor-pointer relative group overflow-hidden"
                >
                  <div className="absolute top-1.5 left-1.5 z-10 text-[8px] font-black bg-black/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
                    #{idx + 1}
                  </div>
                  <div className="text-[10px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-0.2 rounded mb-1 shadow-sm leading-tight mt-0.5">
                    ${value.toFixed(0)}
                  </div>
                  <div
                    className="w-14 sm:w-16 h-20 sm:h-22 rounded-md overflow-hidden bg-black/60 shrink-0 border border-white/20 flex items-center justify-center my-1 relative"
                    style={{ aspectRatio: '63 / 88' }}
                  >
                    <img
                      src={card.images?.small || card.images?.large || `https://assets.tcgdex.net/en/swsh/${currentSet?.id || 'swsh3'}/${card.localId || card.id?.split('-').pop() || idx + 1}/low.png`}
                      alt={card.name}
                      className="w-full h-full object-cover block"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        const num = card.localId || card.id?.split('-').pop() || `${idx + 1}`;
                        const setId = currentSet?.id || card.id?.split('-')[0] || 'swsh3';
                        handleCardImageError(target, setId, num);
                      }}
                    />
                  </div>
                  <div className="text-[10px] font-bold text-white truncate w-full text-center mt-0.5">
                    {card.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Centerpiece: Card Stack */}
          <div className="w-full flex items-center justify-center shrink-0 min-h-[380px] my-2">
            {isLoadingPack ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl w-60 h-[21rem] text-center shrink-0"
              >
                <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
                <span className="font-bold text-base text-gray-200">Drawing Live Cards...</span>
                <span className="text-xs text-amber-300 font-semibold mt-1.5">{currentSet?.name || 'Loading Set'}</span>
              </motion.div>
            ) : packStage !== 'opened' ? (
              <div className="w-full flex items-center justify-center gap-4 lg:gap-8 xl:gap-14 px-2 sm:px-6 relative my-2">
                {/* ✨ Left Flank: Live Set Lore & God-Pack Intelligence Pill ✨ */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="hidden lg:flex flex-col w-60 xl:w-72 shrink-0 bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-3xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl relative overflow-hidden group select-none self-center"
                >
                  <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />

                  {/* Header Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Live Set Intelligence</h4>
                        <span className="text-[10px] text-amber-400/90 font-mono font-bold">{currentSet?.id?.toUpperCase() || 'SV-PME'} • AUTHENTIC FOIL</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Set Spotlight */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-3 mb-3.5 relative overflow-hidden">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Active Booster Set</div>
                    <div className="text-sm font-black text-amber-300 tracking-tight mt-0.5 leading-snug">
                      {currentSet?.name || 'Scarlet & Violet: Prismatic Evolutions'}
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[11px] text-gray-300 font-medium">
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>{currentSet?.cardCount?.total || 162} Total Set Cards</span>
                    </div>
                  </div>

                  {/* Set Chase Cards Main Page Spotlight & Mini List */}
                  <div className="bg-gradient-to-b from-[#181824]/90 to-[#11111a]/90 border border-amber-500/35 rounded-2xl p-3 mb-3.5 shadow-[0_4px_15px_rgba(245,158,11,0.15)]">
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🔥</span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">Top Chase Grails</span>
                      </div>
                      <button
                        onClick={() => { sound.playButtonClick(); setShowChaseModal(true); }}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/30 transition-all hover:scale-105"
                      >
                        <span>View All 12</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Mini List of Top 3 Chase Cards with Card Image Beside Price */}
                    <div className="space-y-2">
                      {chaseCardsForActiveSet.slice(0, 3).map(({ card, value }, idx) => (
                        <div
                          key={card.id || idx}
                          onClick={() => {
                            sound.playCardFlip();
                            setInspectedCard({
                              id: Date.now() + idx,
                              originalIndex: idx,
                              flipped: false,
                              collected: false,
                              value,
                              pokemon: card
                            });
                          }}
                          className="group flex items-center justify-between p-1.5 rounded-xl bg-black/50 hover:bg-black/80 border border-white/10 hover:border-amber-400/60 transition-all duration-200 cursor-pointer shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Card thumbnail with price directly above art */}
                            <div className="flex flex-col items-center shrink-0">
                              <div className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 px-1 py-0.2 rounded mb-0.5 shadow-sm leading-tight">
                                ${value.toFixed(0)}
                              </div>
                              <div
                                className="w-9 h-12 rounded-md overflow-hidden bg-black/60 shrink-0 border border-white/20 relative flex items-center justify-center card-aspect-ratio-sm"
                                style={{ minWidth: '36px', minHeight: '48px', aspectRatio: '63 / 88' }}
                              >
                              <img
                                src={card.images?.small || card.images?.large || `https://assets.tcgdex.net/en/swsh/${currentSet?.id || 'swsh3'}/${card.localId || card.id?.split('-').pop() || idx + 1}/low.png`}
                                alt={card.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 block"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  const num = card.localId || card.id?.split('-').pop() || `${idx + 1}`;
                                  const setId = currentSet?.id || card.id?.split('-')[0] || 'swsh3';
                                  handleCardImageError(target, setId, num);
                                }}
                              />
                            </div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                                {card.name}
                              </div>
                              <div className="text-[9px] text-gray-400 truncate font-medium">
                                #{idx + 1} Chase • {card.rarity || 'Secret Rare'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2">
                            <div className="text-xs font-black text-emerald-400 font-mono tracking-tight">
                              ${value.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {chaseCardsForActiveSet.length === 0 && (
                        <div className="py-3 text-center text-[10px] text-gray-400 italic">
                          Loading set pricing intelligence...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Authenticity Guarantee Footer */}
                  <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>100% Factory Sealed Foil Wrapper</span>
                  </div>
                </motion.div>

                {/* ✨ Center Column: The Interactive Booster Pack Arena with Ambient Stage Lighting ✨ */}
                <div className="relative flex items-center justify-center min-w-[280px] sm:min-w-[320px] z-10 py-2">
                  {/* Cosmic Studio Backlight Aura */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_300px_at_50%_50%,rgba(245,158,11,0.12)_0%,rgba(168,85,247,0.06)_50%,transparent_85%)] pointer-events-none -z-10" />
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none -z-10 opacity-60" />

                  {/* Floating Holographic Energy Jewels (Left & Right of Pack) */}
                  <motion.div
                    animate={{ y: [-8, 8, -8], rotate: [-6, 6, -6] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 sm:-left-4 top-1/4 w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400/20 to-yellow-600/10 border border-amber-400/30 backdrop-blur-md hidden sm:flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] pointer-events-none select-none z-0"
                  >
                    ⚡
                  </motion.div>
                  <motion.div
                    animate={{ y: [10, -10, 10], rotate: [8, -8, 8] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className="absolute right-0 sm:-right-4 top-1/3 w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-400/20 to-indigo-600/10 border border-purple-400/30 backdrop-blur-md hidden sm:flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] pointer-events-none select-none z-0"
                  >
                    💎
                  </motion.div>
                  <motion.div
                    animate={{ y: [-10, 10, -10], scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute left-2 sm:-left-2 bottom-1/4 w-8 h-8 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-600/10 border border-emerald-400/30 backdrop-blur-md hidden sm:flex items-center justify-center text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] pointer-events-none select-none z-0"
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    animate={{ y: [8, -8, 8], scale: [1.05, 0.95, 1.05] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                    className="absolute right-2 sm:-right-2 bottom-1/3 w-8 h-8 rounded-2xl bg-gradient-to-br from-rose-400/20 to-pink-600/10 border border-rose-400/30 backdrop-blur-md hidden sm:flex items-center justify-center text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)] pointer-events-none select-none z-0"
                  >
                    🔥
                  </motion.div>

                  <BoosterPackTear
                    packArts={currentPackArts}
                    packArtIndex={packArtIndex}
                    onPrevPackArt={() => {
                      sound.playTabSwitch();
                      setPackArtIndex(prev => (prev - 1 + currentPackArts.length) % currentPackArts.length);
                    }}
                    onNextPackArt={() => {
                      sound.playTabSwitch();
                      setPackArtIndex(prev => (prev + 1) % currentPackArts.length);
                    }}
                    onTearComplete={handleTearPack}
                    setName={currentSet?.name}
                    packStage={packStage}
                    remainingCardsCount={remainingCards.length}
                  />
                </div>

                {/* ✨ Right Flank: Pack Art Studio & Precision Haptic Control Panel ✨ */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="hidden lg:flex flex-col w-60 xl:w-72 shrink-0 bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-3xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl relative overflow-hidden group select-none self-center"
                >
                  <div className="absolute top-0 left-0 -ml-12 -mt-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />

                  {/* Header Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Pack Art Studio</h4>
                        <span className="text-[10px] text-indigo-300/90 font-mono font-bold">SELECT WRAPPER DESIGN</span>
                      </div>
                    </div>
                  </div>

                  {/* Pack Art Gallery Switcher */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-3 mb-3.5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                      <span>Wrapper Variation:</span>
                      <span className="font-mono text-indigo-400 font-black">#{packArtIndex + 1} of {currentPackArts.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playTabSwitch();
                          setPackArtIndex(prev => (prev - 1 + currentPackArts.length) % currentPackArts.length);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-gray-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-indigo-400" />
                        Prev Style
                      </button>
                      <button
                        onClick={() => {
                          sound.playTabSwitch();
                          setPackArtIndex(prev => (prev + 1) % currentPackArts.length);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-gray-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                      >
                        Next Style
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                    </div>
                  </div>

                  {/* Haptic Tearing Pro Tip */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Precision Haptic Tearing</span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                      Hold and glide your cursor horizontally across the top perforated crimp to slice through the foil seamlessly!
                    </p>
                  </div>

                  {/* Studio Audio Status */}
                  <div className="space-y-2 mt-3.5 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs font-medium text-gray-300">
                      <span className="flex items-center gap-2">
                        <Music className="w-3.5 h-3.5 text-indigo-400" />
                        Studio Sound Effects
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : remainingCards.length > 0 ? (
              <div className="relative w-60 sm:w-68 h-[21rem] sm:h-[23.5rem] shrink-0 mt-6 mb-20 sm:mb-24 flex items-center justify-center">
                <div
                  className="absolute -inset-8 z-[500] cursor-pointer rounded-3xl"
                  onClick={() => topCardId !== null && handleCardClick(topCardId)}
                  onMouseEnter={() => { setIsHoveringStack(true); sound.playCardSlide(true); }}
                  onMouseLeave={handleStackMouseLeave}
                />

                <AnimatePresence>
                  {cards.map((card) => {
                    if (card.collected) return null;

                    const midIdx = Math.floor(cards.length / 2);
                    const baseRotation = (card.originalIndex - midIdx) * 3.8;
                    const baseOffsetX = (card.originalIndex - midIdx) * 11;
                    const baseOffsetY = Math.abs(card.originalIndex - midIdx) * 4;

                    const rotation = isHoveringStack ? baseRotation * 1.5 : baseRotation;
                    const offsetX = isHoveringStack ? baseOffsetX * 1.5 : baseOffsetX;
                    const offsetY = baseOffsetY;

                    return (
                      <Card
                        key={card.id}
                        card={card}
                        rotation={rotation}
                        offsetX={offsetX}
                        offsetY={offsetY}
                        isTopCard={card.id === topCardId}
                        isHovered={isHoveringStack && card.id === topCardId}
                        setName={currentSet?.name}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl max-w-md text-center shrink-0"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">All Cards Revealed!</h3>
                <p className="text-gray-400 text-sm mb-6">
                  You opened {cards.length} cards valued at a total of <span className="text-green-400 font-bold">${cards.reduce((acc, c) => acc + c.value, 0).toFixed(2)}</span>.
                </p>
                <button
                  onClick={() => { sound.playPackOpen(); handleResetPack(); }}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 font-extrabold text-white shadow-[0_4px_20px_rgba(245,158,11,0.5)] hover:shadow-[0_6px_30px_rgba(245,158,11,0.8)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Open Next Pack
                </button>
              </motion.div>
            )}
          </div>

          {/* Bottom Action (Reveal All Cards) right below remaining cards */}
          {!isLoadingPack && packStage === 'opened' && remainingCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-2 pb-8 w-full flex justify-center min-h-[90px] relative z-[600] shrink-0"
            >
              <button
                onClick={handleRevealAll}
                disabled={isRevealingAll}
                className={`group relative px-10 py-4 rounded-2xl font-bold text-lg text-white shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all overflow-hidden ${isRevealingAll ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(245,158,11,0.8)] active:scale-[0.98] cursor-pointer'
                  }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 group-hover:from-amber-400 group-hover:to-orange-400 transition-all duration-300" />
                <span className="relative flex items-center justify-center gap-3 text-white font-black tracking-wide drop-shadow-md">
                  <Sparkles className={`w-6 h-6 text-yellow-300 transition-transform ${isRevealingAll ? 'animate-spin' : 'group-hover:rotate-12 group-hover:scale-110'}`} />
                  <span>
                    {isRevealingAll ? 'Revealing Cards...' : 'Reveal All Cards ✨'}
                  </span>
                </span>
              </button>
            </motion.div>
          )}

          {/* Revealed Cards Gallery */}
          {!isLoadingPack && packStage === 'opened' && revealedCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl mt-4 px-4 shrink-0"
            >
              <div className="flex flex-col items-center mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Revealed Pokemon Cards ({revealedCards.length} / {cards.length})
                </h3>
                <p className="text-[11px] text-amber-300/80 mt-1 font-medium">✨ Click any card to inspect full TCGplayer & Cardmarket live price breakdown or add to your binder</p>
                {revealedCards.filter(c => (c.value || 0) >= 1.00).length > 0 && (
                  <button
                    onClick={() => {
                      const unadded = revealedCards.filter(c => !binderAddedIds.has(c.id) && (c.value || 0) >= 1.00);
                      if (unadded.length === 0) return;
                      setAvailableBinders(getBinders());
                      setBinderSelectModal({ cards: unadded, setName: currentSet?.name || 'Unknown Set' });
                    }}
                    className="mt-3 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-amber-200" />
                    <span>+ Add {revealedCards.filter(c => (c.value || 0) >= 1.00).length} Hits to Binder</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-stretch justify-center gap-6 sm:gap-8">
                <AnimatePresence>
                  {revealedCards.map((card) => (
                    <RevealedCardItem
                      key={card.id}
                      card={card}
                      isAdded={binderAddedIds.has(card.id)}
                      onInspect={handleInspectCard}
                      onAddToBinder={handleAddToBinderSingle}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </main>
      )}

      {/* Set Selector Modal */}
      <AnimatePresence>
        {isSetSelectorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-gradient-to-b from-[#1c1c24] via-[#14141a] to-[#0d0d0f] border border-white/20 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.15)]"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    Select a Pokemon Set
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Choose a set to open packs from</p>
                </div>
                <button
                  onClick={() => { sound.playModalClose(); setIsSetSelectorOpen(false); }}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Series Tabs */}
              <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5 overflow-x-auto">
                {SERIES_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { sound.playTabSwitch(); setSelectedSeriesId(tab.id); }}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap cursor-pointer ${selectedSeriesId === tab.id
                      ? 'text-amber-300 border-amber-400 bg-gradient-to-r from-amber-500/20 to-orange-500/10 shadow-[0_-4px_15px_rgba(245,158,11,0.2)]'
                      : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Sets Grid */}
              <div className="p-6 overflow-y-auto flex-1">
                {isLoadingSeries ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
                    <span className="text-sm text-gray-400">Loading series sets...</span>
                  </div>
                ) : (() => {
                  const eligibleSets = currentSeriesData?.sets?.filter(s => {
                    const nameLow = (s.name || '').toLowerCase();
                    const idLow = (s.id || '').toLowerCase();
                    // Remove base Shining Fates and Hidden Fates, keeping only their Shiny Vault upgraded versions
                    if (idLow === 'swsh4.5' || idLow === 'swsh4pt5' || (nameLow === 'shining fates' && idLow !== 'swsh4.5sv' && idLow !== 'swsh4pt5sv')) return false;
                    if (idLow === 'sm115' || idLow === 'sm11.5' || idLow === 'sm11pt5' || (nameLow === 'hidden fates' && idLow !== 'sma' && idLow !== 'sm115sv')) return false;
                    if (nameLow.includes('promo')) return false;
                    if (nameLow.includes('trainer gallery') || nameLow.includes('galarian gallery')) return false;
                    if (nameLow.includes('my first battle') || nameLow.includes('scarlet & violet energy') || nameLow === 'energy' || ((selectedSeriesId.includes('sv') || selectedSeriesId === 'me') && nameLow.includes('energy'))) return false;
                    return (s.cardCount?.official || s.cardCount?.total || 0) >= 15;
                  }) || [];
                  return eligibleSets.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {eligibleSets.map(set => {
                        const logoSrc = getSetLogoUrl(set, setLogosManifest);
                        return (
                          <div
                            key={set.id}
                            onClick={() => loadSetAndGeneratePack(set.id)}
                            className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-between text-center group ${currentSet?.id === set.id
                              ? 'bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-600/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.02]'
                              : 'bg-[#181822]/90 border-white/15 hover:bg-[#222230] hover:border-white/30 hover:scale-[1.02] shadow-[0_4px_15px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]'
                              }`}
                          >
                            <div className="h-14 flex items-center justify-center mb-3 w-full px-2">
                              {logoSrc ? (
                                <img
                                  src={logoSrc}
                                  alt={set.name}
                                  loading="lazy"
                                  className="max-h-12 max-w-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    const fallback = `/setLogos/${set.id.replace(/[^a-z0-9.-]/gi, '_')}.png`;
                                    if (img.src !== window.location.origin + fallback && img.src !== fallback && !img.src.includes('pokemontcg.io')) {
                                      img.src = fallback;
                                    } else if (set.logo && !img.src.includes(set.logo)) {
                                      const logoUrl = set.logo.endsWith('.png') || set.logo.endsWith('.webp') || set.logo.endsWith('.jpg') ? set.logo : `${set.logo}.png`;
                                      if (img.src !== logoUrl) {
                                        img.src = logoUrl;
                                      } else {
                                        img.style.display = 'none';
                                      }
                                    } else {
                                      img.style.display = 'none';
                                    }
                                  }}
                                />
                              ) : (
                                <Layers className="w-8 h-8 text-gray-500 group-hover:text-amber-400 transition-colors" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-amber-300 transition-colors">{set.name}</h4>
                              <span className="text-[10px] text-gray-400 mt-1 block font-semibold">
                                {set.cardCount?.official || set.cardCount?.total || '???'} Cards
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      No eligible sets found for this series.
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Market Price Inspection Modal */}
      <AnimatePresence>
        {inspectedCard && (
          <CardMarketModal
            card={inspectedCard}
            onClose={() => setInspectedCard(null)}
            initialViewMode={inspectedViewMode}
            onUpdatePrice={(newPrice, newPoke) => {
              setInspectedCard(prev => prev ? { ...prev, value: newPrice, pokemon: newPoke } : null);
            }}
            onAddToBinder={(c) => {
              if (binderAddedIds.has(c.id)) return;
              setAvailableBinders(getBinders());
              setBinderSelectModal({ cards: [c], setName: currentSet?.name || 'Unknown Set' });
            }}
            isAddedToBinder={inspectedCard ? binderAddedIds.has(inspectedCard.id) : false}
          />
        )}
      </AnimatePresence>

      {/* Select Destination Binder Modal */}
      <AnimatePresence>
        {binderSelectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBinderSelectModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-gradient-to-b from-[#161922] to-[#0e1017] border border-white/15 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Select Destination Binder</h3>
                    <p className="text-xs text-gray-400">
                      Adding {binderSelectModal.cards.length} card{binderSelectModal.cards.length > 1 ? 's' : ''} to collection
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBinderSelectModal(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 space-y-2.5 max-h-[50vh] mb-4">
                {availableBinders.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      // Queue sleeve animation before saving
                      setSleeveQueue({
                        cards: binderSelectModal.cards,
                        setName: binderSelectModal.setName,
                        binderId: b.id,
                      });
                      setBinderSelectModal(null);
                    }}
                    className="w-full p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 flex items-center justify-between transition-all cursor-pointer group text-left shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold group-hover:scale-105 transition-transform flex-shrink-0">
                        📁
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                          {b.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {b.count || 0} cards · <span className="text-emerald-400 font-semibold">${(b.value || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Select →
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const name = window.prompt("Enter a name for your new binder:", "New Custom Binder");
                  if (!name || !name.trim()) return;
                  const newId = `binder-${Date.now()}`;
                  const newBinder: Binder = {
                    id: newId,
                    name: name.trim(),
                    count: 0,
                    value: 0,
                    isCustom: true,
                  };
                  const updated = [...availableBinders, newBinder];
                  saveBinders(updated);
                  // Queue sleeve animation for the new binder
                  setSleeveQueue({
                    cards: binderSelectModal.cards,
                    setName: binderSelectModal.setName,
                    binderId: newId,
                  });
                  setBinderSelectModal(null);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs tracking-wide uppercase shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>➕ Create New Binder & Add Here</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sleeve Animation Overlay ── */}
      <AnimatePresence>
        {sleeveQueue && (() => {
          // Use first card's image/name for the visual; all cards get sleeved
          const firstCard = sleeveQueue.cards[0];
          const imgUrl = firstCard?.pokemon?.images?.large || firstCard?.pokemon?.images?.small || '';
          const cardName = firstCard?.pokemon?.name || 'Card';
          return (
            <SleeveAnimation
              key="sleeve-anim"
              cardImageUrl={imgUrl}
              cardName={cardName}
              cardCount={sleeveQueue.cards.length}
              onComplete={() => {
                // Now actually persist the cards
                const { cards: qCards, setName: qSet, binderId } = sleeveQueue;
                sound.playCardCollect(qCards.reduce((sum, c) => sum + c.value, 0));
                const savedCards = qCards.map((c) => saveCollectedCard(c, qSet, binderId));
                setBinderAddedIds((prev) => {
                  const next = new Set(prev);
                  qCards.forEach((c) => next.add(c.id));
                  return next;
                });
                setSleeveQueue(null);

                // Check if any sleeved cards are worth more than 5 dollars (> 5) for slabbing prompt
                const valuableHits = savedCards.filter(c => c && (c.currentPrice || 0) > 5);
                if (valuableHits.length > 0) {
                  setTimeout(() => setSlabPromptQueue({ savedCards: valuableHits }), 150);
                }
              }}
              onCancel={() => setSleeveQueue(null)}
            />
          );
        })()}
      </AnimatePresence>

      {/* ── Valuable Card Slabbing Prompt ($5.00+) ── */}
      <AnimatePresence>
        {slabPromptQueue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[320] flex items-center justify-center p-4 bg-black/85"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1c1c28] via-[#14141c] to-[#0e0e14] border border-amber-400/40 p-6 shadow-[0_20px_80px_rgba(245,158,11,0.35)] flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-400/50 flex items-center justify-center text-2xl mb-4 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                💎
              </div>
              <h3 className="text-xl font-black text-amber-300 mb-1.5">
                High-Value Hit Sleeved!
              </h3>
              <p className="text-xs text-gray-300 mb-4 font-medium leading-relaxed">
                You just sleeved <span className="text-white font-bold">{slabPromptQueue.savedCards.map(c => c.name).join(', ')}</span> valued over <span className="text-emerald-400 font-bold">$5.00</span>! Would you like to permanently encase {slabPromptQueue.savedCards.length > 1 ? 'the first valuable hit' : 'it'} in a custom <span className="text-amber-300 font-bold">Protective Acrylic Slab (Grade: N/A)</span>?
              </p>

              <div className="flex flex-col gap-3 w-full mt-3">
                <button
                  onClick={() => {
                    const hit = slabPromptQueue.savedCards[0];
                    setSlabPromptQueue(null);
                    setSlabQueue({ card: hit });
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-amber-200 shadow-[0_6px_25px_rgba(245,158,11,0.6)] transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <span>🛡️</span> ENCASE IN ACRYLIC SLAB (GRADE: N/A)
                </button>
                <button
                  onClick={() => setSlabPromptQueue(null)}
                  className="w-full py-3.5 rounded-2xl bg-[#0a0a0f] hover:bg-[#14141c] border border-white/15 hover:border-white/30 text-gray-300 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                >
                  No Thanks, Keep in Sleeve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Slab Animation Overlay ── */}
      <AnimatePresence>
        {slabQueue && (
          <SlabAnimation
            key="slab-anim"
            cardImageUrl={slabQueue.card.imageUrl}
            cardName={slabQueue.card.name}
            cardValue={slabQueue.card.currentPrice}
            onComplete={() => {
              updateCardSlabStatus(slabQueue.card.id, 'N/A');
              sound.playCardCollect(slabQueue.card.currentPrice * 1.5);
              setSlabQueue(null);
            }}
            onCancel={() => setSlabQueue(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Set Chase Cards Modal ── */}
      <AnimatePresence>
        {showChaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              className="w-full max-w-4xl max-h-[88vh] rounded-3xl bg-gradient-to-b from-[#1c1c28] via-[#14141c] to-[#0d0d12] border border-amber-500/40 p-6 sm:p-8 shadow-[0_25px_90px_rgba(245,158,11,0.3)] flex flex-col relative overflow-hidden"
            >
              {/* Top ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-20 w-96 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-black text-2xl shadow-[0_4px_15px_rgba(245,158,11,0.5)]">
                    🔥
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Set Chase Cards & Holy Grails
                      </h3>
                      <span className="bg-amber-400/20 border border-amber-400/50 text-amber-300 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full">
                        TOP 12 HITS
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      Most expensive and sought-after pulls in <span className="text-amber-300 font-bold">{currentSet?.name || 'Active Set'}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChaseModal(false)}
                  className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chase Cards Grid */}
              <div className="overflow-y-auto pr-1 py-6 my-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 relative z-10 custom-scrollbar">
                {chaseCardsForActiveSet.length > 0 ? (
                  chaseCardsForActiveSet.map(({ card, value }, idx) => (
                    <div
                      key={card.id || idx}
                      onClick={() => {
                        sound.playCardFlip();
                        setShowChaseModal(false);
                        setInspectedCard({
                          id: Date.now() + idx,
                          originalIndex: idx,
                          flipped: false,
                          collected: false,
                          value,
                          pokemon: card
                        });
                      }}
                      className="group relative rounded-2xl bg-gradient-to-b from-[#1c1e2d]/95 to-[#131520]/95 border border-white/10 hover:border-amber-400/70 p-3 flex flex-col items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(245,158,11,0.25)] cursor-pointer overflow-hidden"
                      style={{ minHeight: '235px' }}
                    >
                      {/* Rank badge and Price directly above card art */}
                      <div className="w-full flex items-center justify-between mb-2 gap-1.5">
                        <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-[10px] uppercase shadow-md flex items-center shrink-0">
                          <span>#{idx + 1} CHASE</span>
                        </div>
                        <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-black text-xs shadow-sm flex items-center gap-0.5 shrink-0">
                          <span>${value.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Miniature Card Artwork Container */}
                      <div
                        className="relative w-28 h-36 rounded-lg overflow-hidden my-1 shadow-md group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300 bg-black/50 border border-white/15 flex items-center justify-center shrink-0"
                        style={{ width: '100px', height: '140px' }}
                      >
                        <img
                          src={card.images?.small || card.images?.large || `https://assets.tcgdex.net/en/swsh/${currentSet?.id}/${card.localId || card.id?.split('-').pop() || idx + 1}/low.png`}
                          alt={card.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 block p-0.5"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            const num = card.localId || card.id?.split('-').pop() || `${idx + 1}`;
                            const setId = currentSet?.id || card.id?.split('-')[0] || 'swsh3';
                            handleCardImageError(target, setId, num);
                          }}
                        />
                      </div>

                      {/* Card Name and Value Info */}
                      <div className="w-full text-center mt-2 pt-1.5 border-t border-white/10 flex flex-col justify-end">
                        <h4 className="text-xs font-black text-white truncate group-hover:text-amber-300 transition-colors">
                          {card.name}
                        </h4>
                        <div className="text-[9px] text-gray-400 truncate font-semibold mt-0.5">
                          {card.rarity || 'Secret / Ultra Rare'}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between w-full bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Est. Value</span>
                          <span className="text-xs font-black text-emerald-400 tracking-tight shadow-sm">
                            ${value.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
                    <span className="text-sm font-bold">Analyzing set intelligence and market pricing...</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative z-10">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Click any chase card to inspect high-resolution holographic details & pricing.</span>
                </div>
                <button
                  onClick={() => {
                    sound.playButtonClick();
                    setShowChaseModal(false);
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.5)] transition-all cursor-pointer hover:scale-105"
                >
                  Close & Hunt This Set
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <BulkCatalogueModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />
      
      {/* Aggressive hidden DOM preloader for pack arts to guarantee instant cache hits */}
      <div style={{ display: 'none' }} aria-hidden="true">
        {currentPackArts.map(src => (
          <img key={`preload-${src}`} src={src} fetchPriority="high" decoding="sync" />
        ))}
      </div>
    </div>
  );
}
