import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, Users, Flame, DollarSign, Package, Send, 
  Sparkles, ArrowLeft, MessageSquare, ShoppingCart, Award, CheckCircle2,
  Heart, Zap, Gift, Eye, EyeOff, ChevronUp, ChevronDown, Layers, RotateCw, Loader2,
  X, Plus, FileText, Clock, Filter, CheckCircle, BookOpen, MessageSquareOff
} from 'lucide-react';
import { sound } from '../../services/sound';
import { addCash, getCollectedCards, saveCollectedCard, getStorageKey, syncToFirestore, type Card } from '../binder/types';
import { generateStreamViewerReply, getRandomStreamMessage, type StreamChatViewer } from '../../services/geminiStreamChat';


import { fetchSetDetails, generatePackFromSet, getCardImageUrl, handleCardImageError, type PokemonCard, cardFullCache, type TCGDexSetSummary, type TCGDexSet, type EnergyEra, ENERGY_POOLS_BY_ERA, fetchCardFull, orchestrateSetLoading, getRealCardPrice, onCardFullCacheUpdated } from '../../services/tcgdex';
import { CardMarketModal } from '../CardMarketModal';
import BoosterPackTear from '../BoosterPackTear';
import InteractiveCard3D from '../binder/InteractiveCard3D';
import setPackPricesData from '../../data/set_pack_prices.json';
import { getJapaneseCardRealPrice, fetchSingleJapaneseSet, generateJapanesePackFromSet } from '../../services/scrydex';
const setPackPrices: Record<string, number> = setPackPricesData as Record<string, number>;

interface CardData {
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
    images: { small: "/packArts/ScarletAndViolet-Generation/SV-EnergyCards/2.webp", large: "/packArts/ScarletAndViolet-Generation/SV-EnergyCards/2.webp" },
    tcgplayer: { prices: { normal: { market: 0.03 } } }
  }
];










const toTitleCase = (str: string) => str.replace(/\b\w+/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });


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
    id: `${poke.id || 'card'}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
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
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-[0_4px 15px_rgba(245,158,11,0.6)] border border-amber-300/50 flex items-center gap-1.5">
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
          {/* Fallback for cards without images */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#222230] to-[#12121a] flex flex-col items-center justify-center p-4 text-center border-[8px] border-[#333344] rounded-2xl z-0">
            <span className="text-gray-500/80 font-black tracking-widest text-xl mb-3">{card.pokemon.id}</span>
            <h3 className="font-bold text-white text-lg px-2 drop-shadow-md">{card.pokemon.name}</h3>
          </div>

          <img
            src={card.pokemon.images?.large || card.pokemon.images?.small || ((card.pokemon as any).image ? getCardImageUrl((card.pokemon as any).image, 'high') : `https://images.scrydex.com/pokemon/${(card.pokemon.id || 'swsh3-1').toLowerCase()}/large`)}
            alt={card.pokemon.name}
            className="absolute inset-0 w-full h-full object-cover block rounded-2xl z-10"
            onError={(e) => {
              const nameLower = (card.pokemon.name || '').toLowerCase();
              const idLower = (card.pokemon.id || '').toLowerCase();
              if (nameLower.includes('energy') || idLower.includes('energy')) {
                (e.target as HTMLImageElement).src = '/packArts/ScarletAndViolet-Generation/SV-EnergyCards/1.webp';
                return;
              }
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
  const displayPrice = getRealCardPrice(card.pokemon) || card.value || 0;
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
            <span>${displayPrice.toFixed(2)}</span>
          </div>
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/90 border border-white/20 text-[9px] font-bold text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            📊 Market Data
          </div>
        </InteractiveCard3D>
      </div>

      <div className="mt-3 w-full px-2.5 py-2 rounded-xl bg-[#141620]/95 border border-white/10 flex flex-col items-center text-center transition-all group-hover:bg-[#1c1e2b]/95 group-hover:border-white/20 shadow-lg">
        <span className="font-bold text-white text-xs truncate w-full">{card.pokemon.name}</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-emerald-400 font-extrabold text-xs tracking-wide shadow-sm">${displayPrice.toFixed(2)}</span>
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


interface RipNShipViewProps {
  onBackToPacks: () => void;
}

interface CustomerOrder {
  id: string;
  username: string;
  avatarColor: string;
  packName: string;
  setId: string; // The official TCGDex/Scrydex set ID
  packCount: number;
  totalPaid: number;
  status: 'pending' | 'ripping' | 'completed';
  pulledCards?: { name: string; value: number; image: string; rarity: string }[];
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  badge?: string;
  color?: string;
  avatarColor?: string;
  isOrderNotification?: boolean;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
}

const getPackArtsForSet = (setId: string, manifest: Record<string, string[]> = {}): string[] => {
  const DEFAULT = ['/packArts/MegaEvolution-Generation/Ascended-heroes/1.webp'];
  if (!manifest || Object.keys(manifest).length === 0) return DEFAULT;
  
  if (manifest[setId]) return manifest[setId];
  if (manifest[setId.toLowerCase()]) return manifest[setId.toLowerCase()];
  
  const normId = setId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (manifest[normId]) return manifest[normId];
  
  for (const [key, urls] of Object.entries(manifest)) {
    if (key.toLowerCase() === normId) return urls;
  }
  
  return DEFAULT;
};

export default function RipNShipView({ onBackToPacks }: RipNShipViewProps) {
  const [inspectedCard, setInspectedCard] = useState<CardData | null>(null);
  const [collectedCardIds, setCollectedCardIds] = useState<Set<string>>(() => {
    try {
      const cards = getCollectedCards();
      const ids = new Set<string>();
      cards.forEach(c => {
        ids.add(c.id);
        const parts = c.id.split('-');
        if (parts.length >= 2) {
          ids.add(`${parts[0]}-${parts[1]}`);
        }
      });
      return ids;
    } catch {
      return new Set();
    }
  });

  const handleAddToBinder = (cardData: CardData) => {
    sound.playCardCollect();
    const cardIdStr = String(cardData.pokemon.id || cardData.id);
    if (!collectedCardIds.has(cardIdStr)) {
      saveCollectedCard(cardData, 'Rip & Ship Pack');
      setCollectedCardIds(prev => new Set([...prev, cardIdStr]));
    }
  };

  useEffect(() => {
    const handleCacheUpdate = () => {
      setCards(prevCards => {
        let changed = false;
        const updated = prevCards.map(c => {
          const cached = cardFullCache.get(c.pokemon.id);
          if (cached) {
            const currentImageIsScrydex = c.pokemon.images?.large?.includes('scrydex.com') || c.pokemon.images?.small?.includes('scrydex.com');
            const cachedImageIsScrydex = cached.image?.includes('scrydex.com');
            const useImageFromCache = cached.image && (!currentImageIsScrydex || cachedImageIsScrydex);
            const updatedPoke = {
              ...c.pokemon,
              images: useImageFromCache && cached.image ? {
                small: getCardImageUrl(cached.image, 'low'),
                large: getCardImageUrl(cached.image, 'high'),
              } : c.pokemon.images,
              pricing: cached.pricing || c.pokemon.pricing,
              tcgplayer: cached.tcgplayer || c.pokemon.tcgplayer,
              cardmarket: cached.cardmarket || (cached.pricing as any)?.cardmarket || c.pokemon.cardmarket,
              illustrator: cached.illustrator || c.pokemon.illustrator,
            };
            const newVal = getRealCardPrice(updatedPoke);
            if (newVal !== c.value || !c.pokemon.pricing?.cardmarket || (useImageFromCache && cached.image && (!c.pokemon.images?.large || !c.pokemon.images.large.includes(cached.image)))) {
              changed = true;
              return { ...c, value: newVal, pokemon: updatedPoke };
            }
          }
          return c;
        });
        return changed ? updated : prevCards;
      });
    };
    onCardFullCacheUpdated.add(handleCacheUpdate);
    return () => {
      onCardFullCacheUpdated.delete(handleCacheUpdate);
    };
  }, []);

  // Stream Stats
  const [viewerCount, setViewerCount] = useState<number>(1420);
  const [totalRevenue, setTotalRevenue] = useState<number>(1280.00);
  const [hypeLevel, setHypeLevel] = useState<number>(4);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(true);

  // Manifests & Caches
  const [packArtsManifest, setPackArtsManifest] = useState<Record<string, string[]>>({});
  
  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';
    fetch(`${base}packArts/manifest.json?v=3`)
      .then(res => res.ok ? res.json() : {})
      .then(data => setPackArtsManifest(data))
      .catch(() => {});
  }, []);

  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  // Pack Opening State
  const [packStage, setPackStage] = useState<'unopened' | 'tearing' | 'opened'>('unopened');
  const [cards, setCards] = useState<CardData[]>([]);
  const [currentPackArts, setCurrentPackArts] = useState<string[]>([]);
  const [packArtIndex, setPackArtIndex] = useState(0);
  const [isLoadingPack, setIsLoadingPack] = useState(false);
  const [isRevealingAll, setIsRevealingAll] = useState(false);
  const [isHoveringStack, setIsHoveringStack] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);
  const flipTimesRef = useRef<Record<string | number, number>>({});

  const remainingCards = React.useMemo(() => cards.filter(c => !c.collected), [cards]);
  const revealedCards = React.useMemo(() => cards.filter(c => c.collected), [cards]);
  const topCardId = React.useMemo(() => remainingCards.length > 0 ? remainingCards[remainingCards.length - 1].id : null, [remainingCards]);

  const handleTearPack = React.useCallback(() => {
    sound.playPackOpen();
    setPackStage('opened');
  }, []);

  const handleCardClick = React.useCallback((id: string | number) => {
    if (isRevealingAll) return;
    const now = Date.now();
    const lastFlip = flipTimesRef.current[id] || 0;
    if (now - lastFlip < 160) return;

    setCards(prev => prev.map(card => {
      if (card.id === id) {
        if (!card.flipped) {
          flipTimesRef.current[id] = now;
          sound.playCardFlip(card.pokemon.rarity);
          setSessionTotal(s => Number((s + card.value).toFixed(2)));
          return { ...card, flipped: true };
        } else if (!card.collected) {
          sound.playCardCollect(card.value);
          return { ...card, collected: true };
        }
      }
      return card;
    }));
  }, [isRevealingAll]);

  const handleRevealAll = () => {
    if (isRevealingAll || remainingCards.length === 0) return;
    setIsRevealingAll(true);
    sound.playButtonClick();

    const orderedCards = [...remainingCards].reverse();

    orderedCards.forEach((card, idx) => {
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

      setTimeout(() => {
        sound.playCardCollect(card.value);
        setCards(prev => prev.map(c => {
          if (c.id === card.id) return { ...c, collected: true };
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

  const loadAndRipPack = async (order: CustomerOrder) => {
    sound.playButtonClick();
    setIsLoadingPack(true);
    setPackStage('unopened');
    setCards([]);

    try {
      const arts = getPackArtsForSet(order.setId, packArtsManifest);
      setCurrentPackArts(arts);
      setPackArtIndex(0);

      const isJa = order.setId.endsWith('_ja');
      let setDetails;
      
      let newCards: PokemonCard[] = [];
      try {
        if (isJa) {
          setDetails = await fetchSingleJapaneseSet(order.setId);
          newCards = await generateJapanesePackFromSet(setDetails);
        } else {
          setDetails = await fetchSetDetails(order.setId);
          newCards = await generatePackFromSet(setDetails);
        }
        setCards(formatAndSortCards(newCards));
        if (!isJa) {
          orchestrateSetLoading(setDetails, newCards.map(c => c.id));
        }
      } catch (e) {
        setCards(generateFallbackPack(FALLBACK_POKEMON_CARDS, setDetails || { id: order.setId }));
      }
    } catch (e) {
      setCards(generateFallbackPack(FALLBACK_POKEMON_CARDS, { id: order.setId }));
    } finally {
      setIsLoadingPack(false);
    }
  };

  
  // Real orders mapped to actual sets!
  const [orders, setOrders] = useState<CustomerOrder[]>([
    {
      id: 'ord-101',
      username: '@PokeKing99',
      avatarColor: 'from-amber-400 to-orange-500',
      packName: '151 Booster Pack',
      setId: 'sv3',
      packCount: 3,
      totalPaid: 86.73,
      status: 'pending'
    },
    {
      id: 'ord-102',
      username: '@SlabKing',
      avatarColor: 'from-purple-500 to-indigo-600',
      packName: 'Evolving Skies Pack',
      setId: 'swsh7',
      packCount: 2,
      totalPaid: 88.00,
      status: 'pending'
    },
    {
      id: 'ord-103',
      username: '@CharizardHunter',
      avatarColor: 'from-red-500 to-rose-700',
      packName: 'Base Set Vintage Pack',
      setId: 'base1',
      packCount: 1,
      totalPaid: 449.99,
      status: 'pending'
    },
    {
      id: 'ord-100',
      username: '@VmaxCollector',
      avatarColor: 'from-emerald-400 to-teal-600',
      packName: 'Crown Zenith Booster',
      setId: 'swsh12pt5',
      packCount: 5,
      totalPaid: 125.00,
      status: 'completed',
      pulledCards: [
        { name: 'Mewtwo VSTAR', value: 78.50, image: '', rarity: 'Secret Rare' },
        { name: 'Gengar TG', value: 12.00, image: '', rarity: 'Trainer Gallery' }
      ]
    }
  ]);

  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  // Add Order Form State
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPackName, setNewPackName] = useState('151 Booster Pack');
  const [newSetId, setNewSetId] = useState('sv3');
  const [newPackCount, setNewPackCount] = useState(1);
  const [newTotalPaid, setNewTotalPaid] = useState(29.99);

  const handleAddNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    sound.playButtonClick();
    const newOrd: CustomerOrder = {
      id: `ord-${Date.now()}`,
      username: newUsername.startsWith('@') ? newUsername.trim() : `@${newUsername.trim()}`,
      avatarColor: 'from-blue-500 to-cyan-600',
      packName: newPackName,
      setId: newSetId,
      packCount: Number(newPackCount),
      totalPaid: Number(newTotalPaid),
      status: 'pending'
    };
    setOrders(prev => [newOrd, ...prev]);
    setActiveOrder(newOrd);
    setNewUsername('');
    setIsAddFormOpen(false);
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', username: 'StreamBot', message: '🔴 RIP & SHIP LIVE! Pack ripping in progress! Type in chat to interact with the host!', badge: 'MOD', color: 'text-amber-400', avatarColor: 'from-yellow-400 to-amber-600' },
  ]);

  const [hostInput, setHostInput] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(orders[0] || null);

  const [isChatTyping, setIsChatTyping] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 7) - 3);
    }, 3000);

    const reactionInterval = setInterval(() => {
      const emojis = ['❤️', '🔥', '💎', '🚀', '⭐', '⚡', '🎉'];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      setReactions(prev => [
        ...prev.slice(-15),
        { id: Date.now() + Math.random(), emoji, x: Math.floor(Math.random() * 40) + 60 }
      ]);
    }, 1200);

    // Live background stream chatter generator
    const streamChatInterval = setInterval(() => {
      const { viewer, text } = getRandomStreamMessage();
      addChatMessage({
        id: Date.now().toString() + Math.random(),
        username: viewer.username,
        message: text,
        badge: viewer.badge,
        color: viewer.color,
        avatarColor: viewer.avatarColor
      });
    }, 4500);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(reactionInterval);
      clearInterval(streamChatInterval);
    };
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev.slice(-25), msg]);
  };

  const handleSpawnHeart = () => {
    sound.playButtonClick();
    setReactions(prev => [
      ...prev.slice(-15),
      { id: Date.now(), emoji: '❤️', x: Math.floor(Math.random() * 30) + 65 }
    ]);
  };

  const handleSendHostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostInput.trim() || isChatTyping) return;
    
    const userMsg = hostInput.trim();
    sound.playButtonClick();
    addChatMessage({
      id: Date.now().toString(),
      username: 'HOST 🔴',
      message: userMsg,
      badge: 'STREAMER',
      color: 'text-amber-300 font-bold',
      avatarColor: 'from-amber-400 via-yellow-500 to-amber-600'
    });
    setHostInput('');

    setIsChatTyping(true);
    
    try {
      const history = chatMessages.slice(-6).map(m => ({
        username: m.username,
        message: m.message
      }));
      
      const { viewer, text } = await generateStreamViewerReply({
        activePackName: activeOrder ? activeOrder.packName : "Pokemon Booster Pack",
        activeUsername: activeOrder ? activeOrder.username : undefined,
        userMessage: userMsg,
        chatHistory: history
      });

      addChatMessage({
        id: Date.now().toString() + "-ai",
        username: viewer.username,
        message: text,
        badge: viewer.badge || 'VIP',
        color: viewer.color || 'text-amber-400',
        avatarColor: viewer.avatarColor || 'from-amber-400 to-orange-500'
      });
    } catch (err) {
      console.error("Failed to generate gemini stream chat reply", err);
    } finally {
      setIsChatTyping(false);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#05040a] overflow-hidden text-white flex flex-col select-none">
      {/* ── 1. Top Spacious Stream Header HUD (Row 1) ── */}
      <div className="relative w-full z-40 px-2.5 sm:px-6 py-2 sm:py-3.5 bg-[#090712] border-b border-white/10 flex items-center justify-between gap-1.5 sm:gap-2.5 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full bg-red-600/25 border border-red-500/50 text-red-400 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
            <span>LIVE &middot; {viewerCount.toLocaleString()}</span>
          </div>

          <div className="bg-black/60 border border-amber-500/30 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-amber-300 flex items-center gap-1 shadow-md shrink-0">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono font-black">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            onClick={() => { sound.playButtonClick(); setIsChatVisible(prev => !prev); }}
            className={`p-1.5 sm:p-2 rounded-full border transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center ${
              isChatVisible
                ? 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/40 text-purple-300'
                : 'bg-gray-800/60 hover:bg-gray-700/60 border-gray-600/40 text-gray-400'
            }`}
            title={isChatVisible ? "Hide Live Chat" : "Show Live Chat"}
            aria-label={isChatVisible ? "Hide Live Chat" : "Show Live Chat"}
          >
            {isChatVisible ? <MessageSquare className="w-4 h-4 text-purple-400" /> : <MessageSquareOff className="w-4 h-4 text-gray-400" />}
          </button>

          <button
            onClick={() => { sound.playButtonClick(); setIsOrdersModalOpen(true); }}
            className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            title="Orders"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Orders</span>
            <span className="bg-amber-400 text-black px-1.5 py-0.2 rounded-full text-[9px] font-black leading-none">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => { sound.playButtonClick(); onBackToPacks(); }}
            className="p-1.5 sm:p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center shrink-0"
            title="Back to Packs"
            aria-label="Back to Packs"
          >
            <ArrowLeft className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* ── 2. Active Customer Order Banner (Row 2) ── */}
      {activeOrder && (
        <div className="relative w-full z-30 px-3 sm:px-6 py-2 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 border-b border-amber-500/30 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${activeOrder.avatarColor} flex items-center justify-center font-black text-[9px] text-white shrink-0 shadow-md`}>
              {activeOrder.username.substring(1, 3).toUpperCase()}
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[11px] font-black text-amber-300 truncate">{activeOrder.username}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">${activeOrder.totalPaid.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-gray-300 font-bold truncate">
                {activeOrder.packCount}x {activeOrder.packName}
              </div>
            </div>
          </div>

          <button
            onClick={() => activeOrder && loadAndRipPack(activeOrder)}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:brightness-110 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg border border-red-300 transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <Package className="w-3.5 h-3.5" />
            <span>📦 RIP LIVE ⚡</span>
          </button>
        </div>
      )}

      {/* ── 3. Overhead Camera & Playmat Arena ── */}
      <div className="relative flex-1 w-full bg-[#0c0915] flex flex-col items-center justify-start overflow-hidden min-h-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1733_0%,#07050d_100%)] flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto custom-scrollbar">
          <div className="w-full h-full min-h-[380px] border border-dashed border-purple-500/20 rounded-3xl flex flex-col items-center justify-start pt-2 sm:pt-4 pb-24 relative px-3 sm:px-4 overflow-visible">

            
            {/* Centerpiece: Card Stack or Tear Area */}
            <div className="w-full flex flex-col items-center justify-center shrink-0 min-h-[380px] my-2">
              {isLoadingPack ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl w-60 h-[21rem] text-center shrink-0"
                >
                  <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
                  <span className="font-bold text-base text-gray-200">Drawing Live Cards...</span>
                  <span className="text-xs text-amber-300 font-semibold mt-1.5">{activeOrder?.setId || 'Loading Set'}</span>
                </motion.div>
              ) : packStage !== 'opened' ? (
                cards.length > 0 ? (
                  <div className="relative flex items-center justify-center min-w-[280px] sm:min-w-[320px] z-10 py-2">
                    <BoosterPackTear
                      packArts={currentPackArts}
                      packArtIndex={packArtIndex}
                      onPrevPackArt={() => setPackArtIndex(prev => (prev - 1 + currentPackArts.length) % currentPackArts.length)}
                      onNextPackArt={() => setPackArtIndex(prev => (prev + 1) % currentPackArts.length)}
                      onTearComplete={handleTearPack}
                      setName={activeOrder?.packName}
                      packStage={packStage}
                      remainingCardsCount={remainingCards.length}
                      hideTearButton={true}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-500/50">
                    <Package className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-sm font-bold uppercase tracking-widest text-center">No Active Pack</p>
                    <p className="text-xs mt-2 max-w-xs text-center opacity-70">Click 'RIP LIVE' to begin.</p>
                  </div>
                )
              ) : remainingCards.length > 0 ? (
                <div className="relative w-60 sm:w-68 h-[21rem] sm:h-[23.5rem] shrink-0 mt-6 mb-20 sm:mb-24 flex items-center justify-center">
                  <div
                    className="absolute -inset-8 z-[500] cursor-pointer rounded-3xl"
                    onClick={() => topCardId !== null && handleCardClick(topCardId)}
                    onMouseEnter={() => { setIsHoveringStack(true); sound.playCardSlide(true); }}
                    onMouseLeave={() => setIsHoveringStack(false)}
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
                      return (
                        <Card
                          key={card.id}
                          card={card}
                          rotation={rotation}
                          offsetX={offsetX}
                          offsetY={baseOffsetY}
                          isTopCard={card.id === topCardId}
                          isHovered={isHoveringStack && card.id === topCardId}
                          setName={activeOrder?.packName}
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
                  <h3 className="text-2xl font-bold mb-2">Order Complete!</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Total Value: <span className="text-green-400 font-bold">${cards.reduce((acc, c) => acc + c.value, 0).toFixed(2)}</span>
                  </p>
                  <button
                    onClick={() => {
                      sound.playButtonClick();
                      setPackStage('unopened');
                      setCards([]);
                      if (activeOrder) {
                        const updated = { ...activeOrder, status: 'completed' as const };
                        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
                      }
                    }}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 font-extrabold text-white shadow-[0_4px_20px_rgba(245,158,11,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Finish Order
                  </button>
                </motion.div>
              )}



            {!isLoadingPack && packStage === 'opened' && revealedCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl mt-4 px-4 shrink-0"
              >
                <div className="flex flex-col items-center mb-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Revealed Cards ({revealedCards.length} / {cards.length})
                  </h3>
                </div>
                <div className="flex flex-wrap items-stretch justify-center gap-6 sm:gap-8">
                  <AnimatePresence>
                    {revealedCards.map((card) => (
                      <RevealedCardItem
                        key={card.id}
                        card={card}
                        isAdded={collectedCardIds.has(String(card.pokemon.id || card.id))}
                        onInspect={(c) => { sound.playModalOpen(); setInspectedCard(c); }}
                        onAddToBinder={(c) => handleAddToBinder(c)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
            </div>

          </div>
        </div>
      </div>

      {/* ── 4. Customer Order Queue Drawer ── */}
      <AnimatePresence>
        {isQueueOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 sm:top-20 inset-x-2 sm:inset-x-6 z-50 p-2.5 sm:p-3.5 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col gap-2 pointer-events-auto"
          >
            <div className="flex items-center justify-between text-[10px] font-extrabold text-amber-400 uppercase tracking-widest px-1">
              <span className="flex items-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Customer Queue ({orders.filter(o => o.status === 'pending').length} Pending)</span>
              </span>
              <button
                onClick={() => { sound.playButtonClick(); setIsOrdersModalOpen(true); setIsQueueOpen(false); }}
                className="text-[10px] text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View All Orders Ledger &rarr;</span>
              </button>
            </div>
            <div className="flex overflow-x-auto gap-2 custom-scrollbar pb-1">
              {orders.map(ord => (
                <button
                  key={ord.id}
                  onClick={() => { sound.playButtonClick(); setActiveOrder(ord); }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all shrink-0 cursor-pointer ${
                    activeOrder?.id === ord.id
                      ? 'border-amber-400 bg-amber-500/25 text-white shadow-lg ring-1 ring-amber-400/50'
                      : ord.status === 'completed'
                      ? 'border-white/5 bg-white/5 opacity-50'
                      : 'border-white/10 bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${ord.avatarColor} flex items-center justify-center font-black text-xs text-white shrink-0 shadow-md`}>
                    {ord.username.substring(1, 3).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black truncate max-w-[110px] text-white">{ord.username}</span>
                      <span className="text-[10px] font-mono font-black text-emerald-400">${ord.totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-gray-300 font-bold flex items-center gap-1 mt-0.5">
                      <span>{ord.packCount}x {ord.packName}</span>
                      {ord.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4B. Full Stream Orders Ledger Modal ── */}
      <AnimatePresence>
        {isOrdersModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl p-3 sm:p-6 flex items-center justify-center pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0915] border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 bg-[#130f24] border-b border-white/10 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-400" />
                    <span>Live Stream Orders Ledger</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Track customer purchases, total spent, pack counts, and active order status.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { sound.playButtonClick(); setIsAddFormOpen(!isAddFormOpen); }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Order</span>
                  </button>

                  <button
                    onClick={() => { sound.playButtonClick(); setIsOrdersModalOpen(false); }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Add Order Collapsible Form */}
              {isAddFormOpen && (
                <form onSubmit={handleAddNewOrder} className="p-4 bg-amber-500/10 border-b border-amber-500/30 flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">Customer Username</label>
                    <input
                      type="text"
                      placeholder="@Username"
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">Pack Name</label>
                    <input
                      type="text"
                      value={newPackName}
                      onChange={e => setNewPackName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">Set ID</label>
                    <input
                      type="text"
                      value={newSetId}
                      onChange={e => setNewSetId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="w-20">
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">Count</label>
                    <input
                      type="number"
                      min="1"
                      value={newPackCount}
                      onChange={e => setNewPackCount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">Total ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTotalPaid}
                      onChange={e => setNewTotalPaid(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase cursor-pointer"
                  >
                    Save Order
                  </button>
                </form>
              )}

              {/* Summary Stats Row & Filters */}
              <div className="px-4 sm:px-6 py-3 bg-black/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(['all', 'pending', 'completed'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => { sound.playButtonClick(); setOrdersFilter(tab); }}
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        ordersFilter === tab
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {tab} ({tab === 'all' ? orders.length : orders.filter(o => o.status === tab).length})
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-gray-400">
                    Total Revenue: <span className="font-black text-emerald-400">${orders.reduce((acc, o) => acc + o.totalPaid, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Orders Table List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-3">
                {orders
                  .filter(o => ordersFilter === 'all' || o.status === ordersFilter)
                  .map(ord => {
                    const isActive = activeOrder?.id === ord.id;
                    return (
                      <div
                        key={ord.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isActive
                            ? 'bg-amber-500/20 border-amber-400 shadow-xl ring-1 ring-amber-400/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${ord.avatarColor} flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md`}>
                            {ord.username.substring(1, 3).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white truncate">{ord.username}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                ord.status === 'completed'
                                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                                  : ord.status === 'ripping'
                                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400 animate-pulse'
                                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                              }`}>
                                {ord.status}
                              </span>
                            </div>

                            <div className="text-xs text-gray-300 font-medium mt-0.5 flex items-center gap-2">
                              <span>Purchased: <strong className="text-amber-300 font-bold">{ord.packCount}x {ord.packName}</strong></span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400 font-mono">Set: {ord.setId}</span>
                            </div>

                            {ord.pulledCards && ord.pulledCards.length > 0 && (
                              <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5 flex-wrap">
                                <Award className="w-3.5 h-3.5" />
                                <span>Pulled Hits:</span>
                                {ord.pulledCards.map((c, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold">
                                    {c.name} (${c.value.toFixed(2)})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                          <div className="text-right">
                            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Total Paid</div>
                            <div className="text-base font-mono font-black text-emerald-400">${ord.totalPaid.toFixed(2)}</div>
                          </div>

                          <button
                            onClick={() => {
                              sound.playButtonClick();
                              setActiveOrder(ord);
                              setIsOrdersModalOpen(false);
                            }}
                            disabled={isActive}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                              isActive
                                ? 'bg-amber-400 text-black opacity-80 cursor-default'
                                : 'bg-white/10 hover:bg-amber-400 hover:text-black text-white border border-white/20'
                            }`}
                          >
                            {isActive ? 'Active Order' : 'Set Active'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. Floating Reactions ── */}
      <div className="absolute inset-y-16 right-4 w-20 pointer-events-none z-30 overflow-hidden">
        {reactions.map(r => (
          <motion.div
            key={r.id}
            initial={{ opacity: 1, y: 300, scale: 0.6 }}
            animate={{ opacity: 0, y: -50, scale: 1.4 }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
            className="absolute text-2xl sm:text-3xl"
            style={{ left: `${r.x - 60}%` }}
          >
            {r.emoji}
          </motion.div>
        ))}
      </div>

      {/* ── 6. Chat ── */}
      <AnimatePresence>
        {isChatVisible ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-3 left-2 sm:left-4 right-2 sm:right-auto z-30 w-full sm:w-96 max-w-[calc(100vw-16px)] flex flex-col pointer-events-auto gap-2"
          >
            <div 
              className="max-h-48 sm:max-h-56 overflow-y-auto custom-scrollbar flex flex-col space-y-1.5 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)'
              }}
            >
              {chatMessages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -10, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  className={`p-2 rounded-xl border backdrop-blur-md text-xs transition-all flex items-start gap-2 ${
                    msg.isOrderNotification 
                      ? 'bg-amber-500/30 border-amber-400/60 text-white font-bold' 
                      : 'bg-black/60 border-white/10 text-gray-100'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${msg.avatarColor || 'from-purple-500 to-indigo-600'} flex items-center justify-center text-[9px] font-black shrink-0 text-white shadow-sm mt-0.5`}>
                    {msg.username.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {msg.badge && (
                        <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-black uppercase tracking-wider">
                          {msg.badge}
                        </span>
                      )}
                      <span className={`font-extrabold text-[11px] ${msg.color || 'text-amber-300'}`}>
                        {msg.username}
                      </span>
                    </div>
                    <div className="text-[11px] leading-tight text-gray-100 mt-0.5 break-words">
                      {msg.message}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <div className="flex items-center gap-1.5">
              <form onSubmit={handleSendHostMessage} className="flex-1 flex gap-1.5">
                <input
                  type="text"
                  value={hostInput}
                  onChange={e => setHostInput(e.target.value)}
                  placeholder="Chat as Host..."
                  className="flex-1 px-3.5 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white text-xs placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-all shadow-lg"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-xs flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer shadow-lg shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              <button
                onClick={handleSpawnHeart}
                className="w-9 h-9 rounded-full bg-red-600/30 border border-red-500/60 backdrop-blur-md text-red-400 flex items-center justify-center hover:scale-110 active:scale-90 transition-all cursor-pointer shrink-0 shadow-lg"
              >
                <Heart className="w-4 h-4 fill-red-500" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => { sound.playButtonClick(); setIsChatVisible(true); }}
            className="absolute bottom-4 left-3 z-30 px-3.5 py-2 rounded-full bg-black/80 backdrop-blur-md border border-purple-500/40 text-purple-300 text-xs font-black flex items-center gap-2 shadow-2xl hover:bg-purple-950/60 hover:border-purple-400 transition-all cursor-pointer pointer-events-auto"
          >
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Show Live Chat</span>
          </motion.button>
        )}
      </AnimatePresence>
    
      {inspectedCard && (
        <CardMarketModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
          onAddToBinder={(c) => handleAddToBinder(c)}
          isAddedToBinder={collectedCardIds.has(String(inspectedCard.pokemon.id || inspectedCard.id))}
        />
      )}

    </div>
  );
}
