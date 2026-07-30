import { PokemonCard, TCGDexSetSummary, TCGDexSet, ENERGY_POOLS_BY_ERA, type EnergyEra, getRealCardPrice } from '../services/tcgdex';

export const FALLBACK_POKEMON_CARDS: PokemonCard[] = [
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

export const OVERRIDE_CARD_PRICES: Record<string, number> = {
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

export const NAME_OVERRIDE_PRICES: Record<string, number> = {
  "Beedrill ex": 6.50,
  "Mega Pyroar ex": 1.25,
  "Mega Greninja ex": 1.75,
  "Mega Floette ex": 0.57,
  "Ho-Oh": 2.50,
  "Keldeo": 1.10,
  "Chesnaught": 0.85
};

export const toTitleCase = (str: string) => str.replace(/\b\w+/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });

export interface FormattedPackCard {
  id: number;
  originalIndex: number;
  flipped: boolean;
  collected: boolean;
  value: number;
  pokemon: PokemonCard;
}

export const ensureMostExpensiveLast = <T extends { value: number }>(cards: T[]): T[] => {
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

export const generateFallbackPack = (pool: PokemonCard[], fallbackSet?: { id?: string; name?: string } | TCGDexSetSummary | TCGDexSet | null): FormattedPackCard[] => {
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
    const energyPool = ENERGY_POOLS_BY_ERA[era] || ENERGY_POOLS_BY_ERA.sv;
    const chosen = energyPool[Math.floor(Math.random() * energyPool.length)];
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
  selected.push(getE());
  for (let i = 0; i < 5; i++) selected.push(getC());
  for (let i = 0; i < 3; i++) selected.push(getU());
  const revCard = getC();
  selected.push({ ...revCard, isReverseHolo: true, rarity: 'Reverse Holo' });
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
  formatted.reverse();
  return formatted.map((c, idx) => ({ ...c, originalIndex: idx }));
};
