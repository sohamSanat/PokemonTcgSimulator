import { ENGLISH_MYSTERY_PACKS, JAPANESE_MYSTERY_PACKS, MysteryPackConfig } from '../data/mysteryPacks';
import setPackPricesData from '../data/set_pack_prices.json';

export const LUCKY_DROP_INTERVAL_SECONDS = 300; // 5 minutes

const LUCKY_DROP_STORAGE_KEY = 'tcg_lucky_drop_last_claim_ts';

export interface LuckyDropReward {
  type: 'mystery' | 'standard';
  id: string;
  name: string;
  price: number;
  description: string;
  language: 'en' | 'ja';
  badge: string;
  packArt: string;
  logoUrl?: string;
  mysteryPackConfig?: MysteryPackConfig;
  setId?: string;
  setName?: string;
  seriesName?: string;
}

function getStoragePrefix(): string {
  if (typeof window === 'undefined') return '';
  const currentGuestId = localStorage.getItem('tcg_current_guest_id') || 'default_guest';
  return `guest_${currentGuestId}_`;
}

function lsKey(key: string): string {
  return `${getStoragePrefix()}${key}`;
}

export function getLastLuckyDropClaimTime(): number {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(lsKey(LUCKY_DROP_STORAGE_KEY));
  if (!stored) return 0;
  const parsed = parseInt(stored, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function getRemainingLuckyDropSeconds(): number {
  const lastClaim = getLastLuckyDropClaimTime();
  if (!lastClaim) return 0; // Ready if never claimed
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - lastClaim) / 1000);
  const remaining = LUCKY_DROP_INTERVAL_SECONDS - elapsedSeconds;
  return Math.max(0, remaining);
}

export function isLuckyDropReady(): boolean {
  return getRemainingLuckyDropSeconds() === 0;
}

// Set prices map
const packPrices: Record<string, number> = setPackPricesData as Record<string, number>;

function getPriceForSet(setId: string, fallbackPrice: number): number {
  if (packPrices[setId] && typeof packPrices[setId] === 'number') {
    return packPrices[setId];
  }
  const normId = setId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (packPrices[normId] && typeof packPrices[normId] === 'number') {
    return packPrices[normId];
  }
  return fallbackPrice;
}

// Master list of Standard Booster Packs available in the 5-min Lucky Drop pool across all generations
const STANDARD_SET_POOL: Array<{
  setId: string;
  setName: string;
  language: 'en' | 'ja';
  seriesName: string;
  fallbackPrice: number;
  packArt: string;
}> = [
  // --- MEGA EVOLUTION SERIES ---
  { setId: 'me01', setName: 'Mega Evolution', language: 'en', seriesName: 'Mega Evolution', fallbackPrice: 5.99, packArt: '/packArts/MegaEvolution-Generation/Ascended-heroes/1.webp' },
  { setId: 'me02', setName: 'Phantasmal Flames', language: 'en', seriesName: 'Mega Evolution', fallbackPrice: 11.11, packArt: '/packArts/MegaEvolution-Generation/Ascended-heroes/2.webp' },
  { setId: 'me02.5', setName: 'Ascended Heroes', language: 'en', seriesName: 'Mega Evolution', fallbackPrice: 14.09, packArt: '/packArts/MegaEvolution-Generation/Ascended-heroes/3.webp' },
  { setId: 'me03', setName: 'Perfect Order', language: 'en', seriesName: 'Mega Evolution', fallbackPrice: 5.92, packArt: '/packArts/MegaEvolution-Generation/Ascended-heroes/4.webp' },
  { setId: 'me04', setName: 'Chaos Rising', language: 'en', seriesName: 'Mega Evolution', fallbackPrice: 6.39, packArt: '/packArts/MegaEvolution-Generation/Ascended-heroes/1.webp' },

  // --- SCARLET & VIOLET (ENGLISH) ---
  { setId: 'sv01', setName: 'Scarlet & Violet Base', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 10.11, packArt: 'https://images.scrydex.com/pokemon/sv01-pack/pack' },
  { setId: 'sv02', setName: 'Paldea Evolved', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 15.50, packArt: 'https://images.scrydex.com/pokemon/sv02-pack/pack' },
  { setId: 'sv03', setName: 'Obsidian Flames', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 13.45, packArt: 'https://images.scrydex.com/pokemon/sv03-pack/pack' },
  { setId: 'sv03.5', setName: 'Pokémon 151', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 28.91, packArt: 'https://images.scrydex.com/pokemon/sv03pt5-pack/pack' },
  { setId: 'sv04', setName: 'Paradox Rift', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 8.45, packArt: 'https://images.scrydex.com/pokemon/sv04-pack/pack' },
  { setId: 'sv05', setName: 'Temporal Forces', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 11.45, packArt: 'https://images.scrydex.com/pokemon/sv05-pack/pack' },
  { setId: 'sv06', setName: 'Twilight Masquerade', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 10.56, packArt: 'https://images.scrydex.com/pokemon/sv06-pack/pack' },
  { setId: 'sv07', setName: 'Stellar Crown', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 10.22, packArt: 'https://images.scrydex.com/pokemon/sv07-pack/pack' },
  { setId: 'sv08', setName: 'Surging Sparks', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 8.49, packArt: 'https://images.scrydex.com/pokemon/sv08-pack/pack' },
  { setId: 'sv08.5', setName: 'Prismatic Evolutions', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 15.99, packArt: 'https://images.scrydex.com/pokemon/sv08pt5-pack/pack' },
  { setId: 'sv09', setName: 'Journey Together', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 6.45, packArt: 'https://images.scrydex.com/pokemon/sv09-pack/pack' },
  { setId: 'destined-rivals', setName: 'Destined Rivals', language: 'en', seriesName: 'Scarlet & Violet', fallbackPrice: 9.36, packArt: 'https://images.scrydex.com/pokemon/sv10-pack/pack' },

  // --- SWORD & SHIELD (ENGLISH) ---
  { setId: 'swsh01', setName: 'Sword & Shield Base', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 10.99, packArt: 'https://images.scrydex.com/pokemon/swsh01-pack/pack' },
  { setId: 'swsh02', setName: 'Rebel Clash', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 13.49, packArt: 'https://images.scrydex.com/pokemon/swsh02-pack/pack' },
  { setId: 'swsh03', setName: 'Darkness Ablaze', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 10.99, packArt: 'https://images.scrydex.com/pokemon/swsh03-pack/pack' },
  { setId: 'swsh04', setName: 'Vivid Voltage', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 10.00, packArt: 'https://images.scrydex.com/pokemon/swsh04-pack/pack' },
  { setId: 'swsh04.5', setName: 'Shining Fates', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 12.50, packArt: 'https://images.scrydex.com/pokemon/swsh04pt5-pack/pack' },
  { setId: 'swsh05', setName: 'Battle Styles', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 9.50, packArt: 'https://images.scrydex.com/pokemon/swsh05-pack/pack' },
  { setId: 'swsh06', setName: 'Chilling Reign', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 11.99, packArt: 'https://images.scrydex.com/pokemon/swsh06-pack/pack' },
  { setId: 'swsh07', setName: 'Evolving Skies', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 45.00, packArt: 'https://images.scrydex.com/pokemon/swsh07-pack/pack' },
  { setId: 'swsh08', setName: 'Fusion Strike', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 12.99, packArt: 'https://images.scrydex.com/pokemon/swsh08-pack/pack' },
  { setId: 'swsh09', setName: 'Brilliant Stars', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 14.50, packArt: 'https://images.scrydex.com/pokemon/swsh09-pack/pack' },
  { setId: 'swsh10', setName: 'Astral Radiance', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 11.00, packArt: 'https://images.scrydex.com/pokemon/swsh10-pack/pack' },
  { setId: 'swsh11', setName: 'Lost Origin', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 13.99, packArt: 'https://images.scrydex.com/pokemon/swsh11-pack/pack' },
  { setId: 'swsh12', setName: 'Silver Tempest', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 12.49, packArt: 'https://images.scrydex.com/pokemon/swsh12-pack/pack' },
  { setId: 'swsh12.5', setName: 'Crown Zenith', language: 'en', seriesName: 'Sword & Shield', fallbackPrice: 16.99, packArt: 'https://images.scrydex.com/pokemon/swsh12pt5-pack/pack' },

  // --- SUN & MOON (ENGLISH) ---
  { setId: 'sm01', setName: 'Sun & Moon Base', language: 'en', seriesName: 'Sun & Moon', fallbackPrice: 14.99, packArt: 'https://images.scrydex.com/pokemon/sm01-pack/pack' },
  { setId: 'sm03', setName: 'Burning Shadows', language: 'en', seriesName: 'Sun & Moon', fallbackPrice: 24.99, packArt: 'https://images.scrydex.com/pokemon/sm03-pack/pack' },
  { setId: 'sm03.5', setName: 'Shining Legends', language: 'en', seriesName: 'Sun & Moon', fallbackPrice: 32.00, packArt: 'https://images.scrydex.com/pokemon/sm03pt5-pack/pack' },
  { setId: 'sm09', setName: 'Team Up', language: 'en', seriesName: 'Sun & Moon', fallbackPrice: 85.00, packArt: 'https://images.scrydex.com/pokemon/sm09-pack/pack' },
  { setId: 'sm10', setName: 'Unbroken Bonds', language: 'en', seriesName: 'Sun & Moon', fallbackPrice: 45.00, packArt: 'https://images.scrydex.com/pokemon/sm10-pack/pack' },
  { setId: 'sm11.5', setName: 'Hidden Fates', language: 'en', seriesName: 'Sun & Moon', fallbackPrice: 38.00, packArt: 'https://images.scrydex.com/pokemon/sm11pt5-pack/pack' },
  { setId: 'sm12', setName: 'Cosmic Eclipse', language: 'en', seriesName: 'Sun & Moon', fallbackPrice: 55.00, packArt: 'https://images.scrydex.com/pokemon/sm12-pack/pack' },

  // --- XY & BLACK/WHITE (ENGLISH) ---
  { setId: 'xy02', setName: 'Flashfire', language: 'en', seriesName: 'XY Series', fallbackPrice: 120.00, packArt: 'https://images.scrydex.com/pokemon/xy02-pack/pack' },
  { setId: 'xy06', setName: 'Roaring Skies', language: 'en', seriesName: 'XY Series', fallbackPrice: 28.00, packArt: 'https://images.scrydex.com/pokemon/xy06-pack/pack' },
  { setId: 'xy12', setName: 'Evolutions', language: 'en', seriesName: 'XY Series', fallbackPrice: 42.00, packArt: 'https://images.scrydex.com/pokemon/xy12-pack/pack' },
  { setId: 'bw11', setName: 'Legendary Treasures', language: 'en', seriesName: 'Black & White', fallbackPrice: 120.00, packArt: 'https://images.scrydex.com/pokemon/bw11-pack/pack' },

  // --- VINTAGE GRAILS (ENGLISH) ---
  { setId: 'base1', setName: 'Base Set (1999)', language: 'en', seriesName: 'Original Vintage', fallbackPrice: 450.00, packArt: 'https://images.scrydex.com/pokemon/base1-pack/pack' },
  { setId: 'team-rocket', setName: 'Team Rocket', language: 'en', seriesName: 'Original Vintage', fallbackPrice: 320.00, packArt: 'https://images.scrydex.com/pokemon/team-rocket-pack/pack' },
  { setId: 'neo-genesis', setName: 'Neo Genesis', language: 'en', seriesName: 'Neo Vintage', fallbackPrice: 480.00, packArt: 'https://images.scrydex.com/pokemon/neo-genesis-pack/pack' },

  // --- SCARLET & VIOLET (JAPANESE) ---
  { setId: 'sv8a_ja', setName: 'Terastal Fest ex (テラスタルフェス)', language: 'ja', seriesName: 'Scarlet & Violet', fallbackPrice: 8.50, packArt: 'https://images.scrydex.com/pokemon/sv8a_ja-pack/pack' },
  { setId: 'sv8_ja', setName: 'Supercharged Breaker (超電ブレイカー)', language: 'ja', seriesName: 'Scarlet & Violet', fallbackPrice: 4.20, packArt: 'https://images.scrydex.com/pokemon/sv8_ja-pack/pack' },
  { setId: 'sv7a_ja', setName: 'Paradise Dragona (楽園ドラゴーナ)', language: 'ja', seriesName: 'Scarlet & Violet', fallbackPrice: 4.50, packArt: 'https://images.scrydex.com/pokemon/sv7a_ja-pack/pack' },
  { setId: 'sv4a_ja', setName: 'Shiny Treasure ex (シャイニートレジャーex)', language: 'ja', seriesName: 'Scarlet & Violet', fallbackPrice: 7.50, packArt: 'https://images.scrydex.com/pokemon/sv4a_ja-pack/pack' },
  { setId: 'sv3_ja', setName: 'Ruler of the Black Flame (黒炎の支配者)', language: 'ja', seriesName: 'Scarlet & Violet', fallbackPrice: 5.20, packArt: 'https://images.scrydex.com/pokemon/sv3_ja-pack/pack' },
  { setId: 'sv2a_ja', setName: 'Pokémon Card 151 (ポケモンカード151)', language: 'ja', seriesName: 'Scarlet & Violet', fallbackPrice: 12.50, packArt: 'https://images.scrydex.com/pokemon/sv2a_ja-pack/pack' },
  { setId: 'sv2d_ja', setName: 'Clay Burst (クレイバースト)', language: 'ja', seriesName: 'Scarlet & Violet', fallbackPrice: 8.90, packArt: 'https://images.scrydex.com/pokemon/sv2d_ja-pack/pack' },

  // --- SWORD & SHIELD (JAPANESE) ---
  { setId: 's12a_ja', setName: 'VSTAR Universe (VSTARユニバース)', language: 'ja', seriesName: 'Sword & Shield', fallbackPrice: 12.00, packArt: 'https://images.scrydex.com/pokemon/s12a_ja-pack/pack' },
  { setId: 's11_ja', setName: 'Lost Abyss (ロストアビス)', language: 'ja', seriesName: 'Sword & Shield', fallbackPrice: 14.00, packArt: 'https://images.scrydex.com/pokemon/s11_ja-pack/pack' },
  { setId: 's8b_ja', setName: 'VMAX Climax (VMAXクライマックス)', language: 'ja', seriesName: 'Sword & Shield', fallbackPrice: 18.00, packArt: 'https://images.scrydex.com/pokemon/s8b_ja-pack/pack' },
  { setId: 's6a_ja', setName: 'Eevee Heroes (イーブイヒーローズ)', language: 'ja', seriesName: 'Sword & Shield', fallbackPrice: 35.00, packArt: 'https://images.scrydex.com/pokemon/s6a_ja-pack/pack' },

  // --- SUN & MOON & VINTAGE (JAPANESE) ---
  { setId: 'sm12a_ja', setName: 'Tag All Stars (ハイクラスパック タッグオールスターズ)', language: 'ja', seriesName: 'Sun & Moon', fallbackPrice: 65.00, packArt: 'https://images.scrydex.com/pokemon/sm12a_ja-pack/pack' },
  { setId: 'sm11b_ja', setName: 'Dream League (ドリームリーグ)', language: 'ja', seriesName: 'Sun & Moon', fallbackPrice: 40.00, packArt: 'https://images.scrydex.com/pokemon/sm11b_ja-pack/pack' },
  { setId: 'cp6_ja', setName: '20th Anniversary (20th Anniversary)', language: 'ja', seriesName: 'XY Series', fallbackPrice: 120.00, packArt: 'https://images.scrydex.com/pokemon/cp6_ja-pack/pack' },
  { setId: 'xy2_ja', setName: 'Wild Blaze (ワイルドブレイズ)', language: 'ja', seriesName: 'XY Series', fallbackPrice: 65.00, packArt: '/packArts/Japanese-XY/Wild-Blaze/Screenshot 2026-07-17 110058.png' },
  { setId: 'base1_ja', setName: 'Expansion Pack 1st Print (第1弾拡張パック)', language: 'ja', seriesName: 'Original Japanese Vintage', fallbackPrice: 380.00, packArt: 'https://images.scrydex.com/pokemon/base1_ja-pack/pack' }
];

/**
 * Builds the full unified candidate list (Mystery Packs + Standard Packs across all generations & languages).
 */
export function getAllLuckyDropCandidates(): LuckyDropReward[] {
  const rewards: LuckyDropReward[] = [];

  // 1. Add Mystery Packs
  const allMystery = [...ENGLISH_MYSTERY_PACKS, ...JAPANESE_MYSTERY_PACKS];
  for (const mystery of allMystery) {
    rewards.push({
      type: 'mystery',
      id: mystery.id,
      name: mystery.name,
      price: mystery.price,
      description: mystery.description,
      language: mystery.language,
      badge: mystery.badge || `${mystery.language === 'ja' ? 'JAPANESE' : 'ENGLISH'} MYSTERY`,
      packArt: mystery.packArt,
      logoUrl: undefined,
      mysteryPackConfig: mystery
    });
  }

  // 2. Add Standard Booster Packs across all generations
  for (const std of STANDARD_SET_POOL) {
    const marketPrice = getPriceForSet(std.setId, std.fallbackPrice);
    const langBadge = std.language === 'ja' ? 'JAPANESE IMPORT' : 'ENGLISH EDITION';
    rewards.push({
      type: 'standard',
      id: `std_${std.setId}`,
      name: `${std.setName} Booster Pack`,
      price: Number(marketPrice.toFixed(2)),
      description: `Factory sealed ${std.language === 'ja' ? 'Japanese' : 'English'} ${std.seriesName} booster pack! Open live or save to inventory.`,
      language: std.language,
      badge: `${langBadge} · ${std.seriesName.toUpperCase()}`,
      packArt: std.packArt,
      setId: std.setId,
      setName: std.setName,
      seriesName: std.seriesName
    });
  }

  return rewards;
}

/**
 * Probability Weighting Algorithm:
 * Inverse-price exponential weighting curve: weight = max(0.008, 1 / price^0.75)
 * Expensive packs drop with lower probability while remaining exciting jackpot hits!
 */
export function rollLuckyDropPack(): LuckyDropReward {
  const candidates = getAllLuckyDropCandidates();

  const weightedCandidates = candidates.map(reward => {
    // Inverse price weighting curve (exponent 0.75 gives smooth realistic curve)
    const weight = Math.max(0.008, 1 / Math.pow(Math.max(1, reward.price), 0.75));
    return { reward, weight };
  });

  const totalWeight = weightedCandidates.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of weightedCandidates) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.reward;
    }
  }

  return candidates[0];
}

export function claimLuckyDropReward(): LuckyDropReward {
  if (typeof window !== 'undefined') {
    localStorage.setItem(lsKey(LUCKY_DROP_STORAGE_KEY), String(Date.now()));
  }
  return rollLuckyDropPack();
}
