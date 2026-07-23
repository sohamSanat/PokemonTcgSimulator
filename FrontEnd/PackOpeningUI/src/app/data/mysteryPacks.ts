export interface MysteryPackConfig {
  id: string;
  name: string;
  price: number;
  description: string;
  language: 'en' | 'ja';
  badge: string;
  gradient: string;
  borderColor: string;
  glowColor: string;
  setIds: string[];
  highlightSets: string[];
  icon: string;
  packArt: string;
}

export const ENGLISH_MYSTERY_PACKS: MysteryPackConfig[] = [
  {
    id: 'en_mystery_bronze',
    name: 'Bronze Starter Mystery Pack',
    price: 8.99,
    description: 'High-value entry mystery pack featuring budget Scarlet & Violet, Mega Evolution, and Sword & Shield booster packs — with lucky hits into vintage grails!',
    language: 'en',
    badge: '🥉 BRONZE TIER',
    gradient: 'from-amber-900/40 via-stone-900/60 to-amber-950/80',
    borderColor: 'border-amber-600/50',
    glowColor: 'shadow-[0_0_25px_rgba(217,119,6,0.35)]',
    icon: '📦',
    packArt: '/packArts/MysteryPacks/EN-MysteryPacks/bronze.webp',
    setIds: ['me01', 'me03', 'me04', 'sv01', 'sv04', 'sv05', 'sv08', 'sv09', 'swsh04.5', 'swsh05', 'swsh10'],
    highlightSets: ['Mega Evolution', 'Chaos Rising', 'Scarlet & Violet Base', 'Paradox Rift', 'Surging Sparks', 'Astral Radiance']
  },
  {
    id: 'en_mystery_silver',
    name: 'Silver Modern Mystery Pack',
    price: 14.99,
    description: 'Feature-packed modern booster series including Paldea Evolved, Ascended Heroes, Obsidian Flames, and Twilight Masquerade — with lucky hit pulls into rare vintage!',
    language: 'en',
    badge: '🥈 SILVER TIER',
    gradient: 'from-slate-700/40 via-zinc-900/60 to-slate-900/80',
    borderColor: 'border-slate-300/50',
    glowColor: 'shadow-[0_0_25px_rgba(203,213,225,0.35)]',
    icon: '🥈',
    packArt: '/packArts/MysteryPacks/EN-MysteryPacks/silver.webp',
    setIds: ['me02.5', 'sv02', 'sv03', 'sv06', 'sv07', 'swsh01', 'swsh02', 'swsh03', 'swsh06', 'swsh12'],
    highlightSets: ['Ascended Heroes', 'Paldea Evolved', 'Obsidian Flames', 'Twilight Masquerade', 'Stellar Crown', 'Silver Tempest']
  },
  {
    id: 'en_mystery_gold',
    name: 'Gold Chase Mystery Pack',
    price: 24.99,
    description: 'Chance to hit fan-favorite heavyweights: Pokémon 151, Prismatic Evolutions, Crown Zenith, Lost Origin, and Fusion Strike plus lucky vintage grails!',
    language: 'en',
    badge: '🥇 GOLD TIER',
    gradient: 'from-amber-500/30 via-yellow-950/50 to-amber-900/80',
    borderColor: 'border-amber-400/70',
    glowColor: 'shadow-[0_0_30px_rgba(245,158,11,0.45)]',
    icon: '✨',
    packArt: '/packArts/MysteryPacks/EN-MysteryPacks/gold.webp',
    setIds: ['sv03.5', 'sv08.5', 'swsh12.5', 'swsh11', 'swsh08', 'swsh09', 'paldean-fates', 'shrouded-fable'],
    highlightSets: ['Pokémon 151', 'Prismatic Evolutions', 'Crown Zenith', 'Lost Origin', 'Fusion Strike', 'Brilliant Stars']
  },
  {
    id: 'en_mystery_diamond',
    name: 'Diamond High Roller Mystery Pack',
    price: 49.99,
    description: 'High-stakes mystery box containing legendary grails like Evolving Skies, Emerging Powers, Dragon Vault, Celebrations, Hidden Fates, and Ultra Prism!',
    language: 'en',
    badge: '💎 DIAMOND TIER',
    gradient: 'from-cyan-500/30 via-blue-950/50 to-sky-900/80',
    borderColor: 'border-cyan-300/70',
    glowColor: 'shadow-[0_0_35px_rgba(6,182,212,0.5)]',
    icon: '💎',
    packArt: '/packArts/MysteryPacks/EN-MysteryPacks/diamond.webp',
    setIds: ['swsh07', 'celebrations', 'sm115', 'sm5', 'sm1', 'sm2', 'sm4', 'shining-fates-shiny-vault', 'bw2', 'dv1'],
    highlightSets: ['Evolving Skies', 'Emerging Powers', 'Dragon Vault', 'Celebrations', 'Hidden Fates', 'Ultra Prism']
  },
  {
    id: 'en_mystery_vintage',
    name: 'Vintage Master Mystery Pack',
    price: 99.99,
    description: 'Rare vintage mystery packs across Black & White, HGSS, Sun & Moon, & XY eras including Next Destinies, Plasma Blast, Legendary Treasures, Unleashed, & Cosmic Eclipse!',
    language: 'en',
    badge: '👑 VINTAGE MASTER',
    gradient: 'from-purple-600/30 via-indigo-950/50 to-purple-900/80',
    borderColor: 'border-purple-400/70',
    glowColor: 'shadow-[0_0_35px_rgba(168,85,247,0.5)]',
    icon: '🔮',
    packArt: '/packArts/MysteryPacks/EN-MysteryPacks/vintage.webp',
    setIds: ['sm3.5', 'sm7.5', 'sm6', 'sm7', 'sm8', 'sm10', 'sm11', 'sm12', 'xy1', 'xy3', 'xy5', 'xy6', 'xy12', 'bw3', 'bw4', 'bw7', 'bw10', 'bw11', 'hgss2', 'hgss3'],
    highlightSets: ['Legendary Treasures', 'Next Destinies', 'Plasma Blast', 'Unleashed', 'Cosmic Eclipse', 'XY Evolutions']
  },
  {
    id: 'en_mystery_god',
    name: 'God Tier Grail Mystery Pack',
    price: 299.99,
    description: 'The ultimate grail mystery box! Draw from WOTC Base, EX Series, Diamond & Pearl, Platinum, HeartGold SoulSilver, Black & White Base, Team Up, or Flashfire!',
    language: 'en',
    badge: '⚡ GOD TIER GRAIL',
    gradient: 'from-rose-600/40 via-red-950/60 to-amber-950/90',
    borderColor: 'border-rose-400/80',
    glowColor: 'shadow-[0_0_40px_rgba(244,63,94,0.6)]',
    icon: '⚡',
    packArt: '/packArts/MysteryPacks/EN-MysteryPacks/god-tier.webp',
    setIds: [
      'base1', 'base2', 'base3', 'base4', 'base5', 'sm9', 'xy2', 'xy4', 'g1', 'dc1',
      'bw1', 'bw5', 'bw6', 'bw8', 'bw9',
      'dp1', 'dp2', 'dp3', 'dp4', 'dp5', 'dp6', 'dp7',
      'pl1', 'pl2', 'pl3', 'pl4',
      'hgss1', 'hgss4', 'col1',
      'ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6', 'ex7', 'ex8', 'ex9', 'ex10', 'ex11', 'ex12', 'ex13', 'ex14', 'ex15', 'ex16'
    ],
    highlightSets: ['WOTC Base Set', 'EX Deoxys', 'EX Team Rocket Returns', 'Diamond & Pearl', 'Platinum', 'HeartGold SoulSilver', 'Black & White Base', 'EX Dragon Frontiers']
  }
];

export const JAPANESE_MYSTERY_PACKS: MysteryPackConfig[] = [
  {
    id: 'ja_mystery_starter',
    name: 'Japanese Starter Mystery Pack',
    price: 3.99,
    description: 'Authentic Japanese Scarlet & Violet booster packs including Violet ex, Scarlet ex, Triplet Beat, Clay Burst, and Wild Force!',
    language: 'ja',
    badge: '🌸 JAPANESE STARTER',
    gradient: 'from-pink-600/30 via-rose-950/50 to-pink-900/80',
    borderColor: 'border-pink-400/60',
    glowColor: 'shadow-[0_0_25px_rgba(244,114,182,0.35)]',
    icon: '🌸',
    packArt: '/packArts/MysteryPacks/JP-MysteryPacks/starter.webp',
    setIds: ['SV1S_ja', 'SV1V_ja', 'SV1a_ja', 'SV2P_ja', 'SV2D_ja', 'SV3_ja', 'SV5K_ja', 'SV5M_ja'],
    highlightSets: ['Violet ex', 'Scarlet ex', 'Triplet Beat', 'Clay Burst', 'Snow Hazard', 'Ruler of the Black Flame']
  },
  {
    id: 'ja_mystery_highclass',
    name: 'Japanese High-Class Mystery Pack',
    price: 9.99,
    description: 'Premium Japanese High-Class sets featuring Pokémon Card 151, Shiny Treasure ex, Terastal Fest ex, VSTAR Universe, and Eevee Heroes!',
    language: 'ja',
    badge: '✨ HIGH-CLASS SPECIAL',
    gradient: 'from-emerald-500/30 via-teal-950/50 to-emerald-900/80',
    borderColor: 'border-emerald-400/70',
    glowColor: 'shadow-[0_0_30px_rgba(52,211,153,0.45)]',
    icon: '✨',
    packArt: '/packArts/MysteryPacks/JP-MysteryPacks/high-class.webp',
    setIds: ['SV2a_ja', 'SV4a_ja', 'SV8a_ja', 'S12a_ja', 'S8b_ja', 'S4a_ja', 'S6a_ja'],
    highlightSets: ['Pokémon Card 151', 'Shiny Treasure ex', 'Terastal Fest ex', 'VSTAR Universe', 'VMAX Climax', 'Eevee Heroes']
  },
  {
    id: 'ja_mystery_swsh',
    name: 'Japanese SwSh Collector Mystery Pack',
    price: 19.99,
    description: 'Coveted Japanese Sword & Shield expansions like Blue Sky Stream, Skyscraping Perfection, Lost Abyss, and Paradigm Trigger!',
    language: 'ja',
    badge: '⚔️ SWSH COLLECTOR',
    gradient: 'from-blue-600/30 via-indigo-950/50 to-sky-900/80',
    borderColor: 'border-blue-400/70',
    glowColor: 'shadow-[0_0_30px_rgba(96,165,250,0.45)]',
    icon: '⚔️',
    packArt: '/packArts/MysteryPacks/JP-MysteryPacks/collector.webp',
    setIds: ['S7R_ja', 'S7D_ja', 'S11_ja', 'S12_ja', 'S10P_ja', 'S10D_ja', 'S9_ja', 'S8a_ja'],
    highlightSets: ['Blue Sky Stream', 'Skyscraping Perfection', 'Lost Abyss', 'Paradigm Trigger', 'Space Juggler']
  },
  {
    id: 'ja_mystery_sm',
    name: 'Japanese Sun & Moon Vault Mystery Pack',
    price: 49.99,
    description: 'Grail Japanese Sun & Moon sets including Dream League, Tag Team All Stars, Ultra Shiny, Tag Bolt, and Alter Genesis!',
    language: 'ja',
    badge: '☀️ SUN & MOON VAULT',
    gradient: 'from-amber-500/30 via-orange-950/50 to-red-900/80',
    borderColor: 'border-orange-400/70',
    glowColor: 'shadow-[0_0_35px_rgba(251,146,60,0.5)]',
    icon: '☀️',
    packArt: '/packArts/MysteryPacks/JP-MysteryPacks/sun&moon.webp',
    setIds: ['SM12a_ja', 'SM11b_ja', 'SM8b_ja', 'SM9_ja', 'SM12_ja', 'SM10_ja', 'SM3+_ja'],
    highlightSets: ['Tag Team All Stars', 'Dream League', 'GX Ultra Shiny', 'Tag Bolt', 'Alter Genesis', 'Double Blaze']
  },
  {
    id: 'ja_mystery_vintage',
    name: 'Japanese Vintage Classic Mystery Pack',
    price: 149.99,
    description: 'Legendary vintage Japanese packs from the WOTC PMCG Expansion era, Neo Series, VS Series, and Web Series!',
    language: 'ja',
    badge: '⛩️ VINTAGE JAPANESE',
    gradient: 'from-fuchsia-600/30 via-purple-950/50 to-rose-900/80',
    borderColor: 'border-fuchsia-400/80',
    glowColor: 'shadow-[0_0_40px_rgba(232,121,249,0.6)]',
    icon: '⛩️',
    packArt: '/packArts/MysteryPacks/JP-MysteryPacks/Vintage.webp',
    setIds: ['PMCG1_ja', 'PMCG2_ja', 'PMCG3_ja', 'PMCG4_ja', 'PMCG5_ja', 'neo1_ja', 'neo2_ja', 'neo3_ja', 'neo4_ja', 'VS1_ja', 'web1_ja'],
    highlightSets: ['Expansion Pack (Base)', 'Jungle', 'Fossil', 'Team Rocket', 'Neo Series', 'Pokémon VS', 'Pokémon Web']
  }
];

export interface MysteryPackResult {
  setId: string;
  isHighTier: boolean;
  isLuckyHit?: boolean;
  bonusPacksCount: number;
  tierGap: number;
}

export function rollMysteryPackResult(pack: MysteryPackConfig): MysteryPackResult {
  const packList = pack.language === 'ja' ? JAPANESE_MYSTERY_PACKS : ENGLISH_MYSTERY_PACKS;
  const tierIndex = packList.findIndex(p => p.id === pack.id);

  // Lucky Hit rates for cheaper/lower mystery packs to hit higher vintage & grail tiers
  // Bronze (Index 0): 6% chance for Lucky Hit
  // Silver (Index 1): 9% chance for Lucky Hit
  // Gold (Index 2): 12% chance for Lucky Hit
  // Diamond (Index 3): 15% chance for Lucky Hit
  // Vintage (Index 4): 18% chance for Lucky Hit (to hit God Tier)
  const luckyHitChances = [0.06, 0.09, 0.12, 0.15, 0.18];
  const luckyHitChance = (tierIndex >= 0 && tierIndex < luckyHitChances.length) ? luckyHitChances[tierIndex] : 0;

  const roll = Math.random();

  // 1. Lucky Hit Jackpot check into higher tiers (e.g. hitting EX series, DP, HGSS, Vintage, God Tier!)
  if (luckyHitChance > 0 && roll < luckyHitChance) {
    const higherTiers = packList.slice(tierIndex + 1);
    if (higherTiers.length > 0) {
      // Pick a random higher tier (weighted towards top tiers for epic jackpot excitement)
      const targetHigherTier = higherTiers[Math.floor(Math.random() * higherTiers.length)];
      const targetSetIds = targetHigherTier.setIds;
      if (targetSetIds && targetSetIds.length > 0) {
        const luckySetId = targetSetIds[Math.floor(Math.random() * targetSetIds.length)];
        return {
          setId: luckySetId,
          isHighTier: true,
          isLuckyHit: true,
          bonusPacksCount: 0,
          tierGap: 0
        };
      }
    }
  }

  // 2. Standard 60/40 tier roll
  const standardRoll = Math.random();

  if (tierIndex <= 0 || standardRoll < 0.60) {
    const randomIndex = Math.floor(Math.random() * pack.setIds.length);
    return {
      setId: pack.setIds[randomIndex],
      isHighTier: true,
      bonusPacksCount: 0,
      tierGap: 0
    };
  } else {
    // 40% chance: User loses the standard roll and gets a lower tier set with pity bonus packs
    const targetLowerTierIndex = Math.floor(Math.random() * tierIndex);
    const targetLowerPack = packList[targetLowerTierIndex];
    const lowerSetIds = (targetLowerPack.setIds && targetLowerPack.setIds.length > 0)
      ? targetLowerPack.setIds
      : pack.setIds;

    const selectedSetId = lowerSetIds[Math.floor(Math.random() * lowerSetIds.length)];
    const tierGap = tierIndex - targetLowerTierIndex;

    // Calculate pity bonus packs based on tier gap to compensate for the lower-tier roll
    let bonusPacksCount = 2;
    if (tierGap >= 4) {
      bonusPacksCount = Math.floor(Math.random() * 2) + 5; // 5 to 6 bonus packs
    } else if (tierGap === 3) {
      bonusPacksCount = Math.floor(Math.random() * 2) + 4; // 4 to 5 bonus packs
    } else if (tierGap === 2) {
      bonusPacksCount = Math.floor(Math.random() * 2) + 3; // 3 to 4 bonus packs
    } else {
      bonusPacksCount = Math.floor(Math.random() * 2) + 2; // 2 to 3 bonus packs
    }

    return {
      setId: selectedSetId,
      isHighTier: false,
      bonusPacksCount,
      tierGap
    };
  }
}

export function getRandomSetFromMysteryPack(pack: MysteryPackConfig): string {
  return rollMysteryPackResult(pack).setId;
}

export function getMysteryPackById(id: string): MysteryPackConfig | undefined {
  return [...ENGLISH_MYSTERY_PACKS, ...JAPANESE_MYSTERY_PACKS].find(p => p.id === id);
}
