import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, Users, Flame, DollarSign, Package, Send, 
  Sparkles, ArrowLeft, MessageSquare, ShoppingCart, Award, CheckCircle2,
  Heart, Zap, Gift, Eye, EyeOff, ChevronUp, ChevronDown, Layers, RotateCw, Loader2,
  X, Plus, FileText, Clock, Filter, CheckCircle, BookOpen, MessageSquareOff,
  Truck, MapPin, ShieldCheck
} from 'lucide-react';
import { sound } from '../../services/sound';
import { addCash, getCollectedCards, saveCollectedCard, getStorageKey, syncToFirestore, type Card } from '../binder/types';
import { generateStreamViewerReply, getRandomStreamMessage, generateCardPullReaction, type StreamChatViewer } from '../../services/geminiStreamChat';


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
  isMostExpensive?: boolean;
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
    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      if (chosen) return chosen;
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

  const setId = (fallbackSet?.id || '').toLowerCase();
  const setName = (fallbackSet?.name || '').toLowerCase();

  const getC = () => pickUnique(commons.length > 0 ? commons : fallbackCardPool);
  const getU = () => pickUnique(uncommons.length > 0 ? uncommons : fallbackCardPool);
  const getR = () => pickUnique(rares.length > 0 ? rares : fallbackCardPool);
  const getE = (): PokemonCard => {
    if (energy.length > 0) return energy[Math.floor(Math.random() * energy.length)];
    const era: EnergyEra =
      setId.startsWith('me') || setName.includes('mega evolution') || setName.includes('phantasmal') || setName.includes('ascended') || setName.includes('perfect order') || setName.includes('chaos rising') ? 'me' :
        setId.startsWith('sv') || setName.includes('scarlet') || setName.includes('paldea') || setName.includes('obsidian') || setName.includes('paradox') || setName.includes('temporal') || setName.includes('twilight') || setName.includes('stellar') || setName.includes('surging') || setName.includes('151') || setName.includes('prismatic') || setName.includes('shrouded') ? 'sv' :
          setId.startsWith('sm') || setName.includes('sun & moon') || setName.includes('guardians rising') || setName.includes('burning shadows') || setName.includes('cosmic eclipse') || setName.includes('hidden fates') ? 'sm' :
            setId.startsWith('xy') || setName.includes('flashfire') || setName.includes('furious fists') || setName.includes('roaring skies') || setName.includes('evolutions') || setName.includes('phantom forces') ? 'xy' :
              setId.startsWith('base') || setId === 'bs1' || setId === 'bs2' || setId === 'ju' || setId === 'fo' || setId === 'tr' || setName.includes('base set') || setName.includes('jungle') || setName.includes('fossil') || setName.includes('team rocket') ? 'base' : 'swsh';
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

  const eraForSlots = setId.startsWith('me') || setName.includes('mega evolution') || setName.includes('phantasmal') || setName.includes('ascended') || setName.includes('perfect order') || setName.includes('chaos rising') ? 'me' :
        setId.startsWith('sv') || setName.includes('scarlet') || setName.includes('paldea') || setName.includes('obsidian') || setName.includes('paradox') || setName.includes('temporal') || setName.includes('twilight') || setName.includes('stellar') || setName.includes('surging') || setName.includes('151') || setName.includes('prismatic') || setName.includes('shrouded') ? 'sv' :
          setId.startsWith('sm') || setName.includes('sun & moon') || setName.includes('guardians rising') || setName.includes('burning shadows') || setName.includes('cosmic eclipse') || setName.includes('hidden fates') ? 'sm' :
            setId.startsWith('xy') || setName.includes('flashfire') || setName.includes('furious fists') || setName.includes('roaring skies') || setName.includes('evolutions') || setName.includes('phantom forces') ? 'xy' :
              setId.startsWith('base') || setId === 'bs1' || setId === 'bs2' || setId === 'ju' || setId === 'fo' || setId === 'tr' || setName.includes('base set') || setName.includes('jungle') || setName.includes('fossil') || setName.includes('team rocket') ? 'base' : 'swsh';

  const commonCount = (eraForSlots === 'sv' || eraForSlots === 'me' || eraForSlots === 'base') ? 5 : 4;
  const isSpecialEra = (eraForSlots === 'swsh' || eraForSlots === 'sm');

  const selected: PokemonCard[] = [];
  // Slot 1: 1 Basic Energy
  selected.push(getE());
  
  // Slots 2-6 (or 2-5): 4 or 5 Commons
  for (let i = 0; i < commonCount; i++) selected.push(getC());
  
  // Slots 7-9: 3 Uncommons
  for (let i = 0; i < 3; i++) selected.push(getU());
  
  // Special Slot / Reverse Holo (Slot 10)
  if (isSpecialEra && commonCount === 4) {
    // Fill the missing slot so the pack still has 11 cards
    const special = getC();
    selected.push({ ...special, isReverseHolo: true, rarity: 'Special' });
  }
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


const isActualHit = (card: CardData): boolean => {
  if (!card || !card.pokemon) return false;
  const val = card.value || 0;
  const nameLower = (card.pokemon.name || '').toLowerCase();
  const idLower = (card.pokemon.id || '').toLowerCase();
  if (nameLower.includes('energy') || idLower.includes('energy')) return false;

  const rarity = (card.pokemon.rarity || '').toLowerCase();
  const isHitCategory = 
    rarity.includes('special illustration') || 
    rarity.includes('illustration rare') || 
    rarity.includes('secret') || 
    rarity.includes('gold') || 
    rarity.includes('hyper') || 
    rarity.includes('rainbow') || 
    rarity.includes('full art') || 
    rarity.includes('double rare') || 
    rarity.includes('ultra rare') || 
    rarity.includes('ex') || 
    rarity.includes('vmax') || 
    rarity.includes('vstar') || 
    rarity.includes(' v') || 
    rarity.includes('gx') || 
    rarity.includes('shiny vault') || 
    rarity.includes('trainer gallery') ||
    rarity.includes('character rare');

  return isHitCategory || val >= 4.50;
};

const ensureMostExpensiveLast = (cards: CardData[]): CardData[] => {
  if (cards.length === 0) return cards;
  cards.forEach(c => { c.isMostExpensive = false; });
  let maxIdx = 0;
  let maxVal = getRealCardPrice(cards[0].pokemon) || cards[0].value || 0;
  for (let i = 1; i < cards.length; i++) {
    const val = getRealCardPrice(cards[i].pokemon) || cards[i].value || 0;
    if (val >= maxVal) {
      maxVal = val;
      maxIdx = i;
    }
  }
  if (maxIdx !== cards.length - 1) {
    const [mostExpensive] = cards.splice(maxIdx, 1);
    cards.push(mostExpensive);
  }
  
  // ONLY mark as Most Expensive Hit IF the top card is a genuine high-tier hit!
  if (isActualHit(cards[cards.length - 1])) {
    cards[cards.length - 1].isMostExpensive = true;
  }
  return cards;
};

const reorderCardsWithMostExpensiveLast = (cards: CardData[]): CardData[] => {
  if (cards.length === 0) return cards;
  if (cards.some(c => c.flipped || c.collected)) {
    cards.forEach(c => { c.isMostExpensive = false; });
    let maxIdx = 0;
    let maxVal = cards[0].value;
    for (let i = 1; i < cards.length; i++) {
      if (cards[i].value >= maxVal) {
        maxVal = cards[i].value;
        maxIdx = i;
      }
    }
    if (isActualHit(cards[maxIdx])) {
      cards[maxIdx].isMostExpensive = true;
    }
    return cards;
  }
  const unreversed = [...cards].reverse();
  ensureMostExpensiveLast(unreversed);
  const reReversed = unreversed.reverse();
  return reReversed.map((c, idx) => ({ ...c, originalIndex: idx }));
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
            border: card.isMostExpensive ? '3px solid rgba(6, 182, 212, 0.9)' : '2px solid rgba(255, 255, 250, 0.4)'
          }}
        >
          {/* Ultra-Clear Penny Sleeve Layer for Top Hit */}
          {card.isMostExpensive && (
            <div className="absolute inset-0 rounded-xl pointer-events-none z-30 overflow-hidden bg-gradient-to-tr from-cyan-500/15 via-transparent to-blue-400/25 border-2 border-cyan-300/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-white/90 via-cyan-200 to-white/90 border-b border-cyan-300/70 shadow-sm" />
              <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 text-white font-black text-[9px] uppercase tracking-wider shadow-lg border border-cyan-200/60 flex items-center gap-1 animate-pulse">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" />
                <span>Sleeved Hit (${cardLiveValue.toFixed(2)})</span>
              </div>
            </div>
          )}

          {/* Fallback for cards without images */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#222230] to-[#12121a] flex flex-col items-center justify-center p-4 text-center border-[8px] border-[#333344] rounded-2xl z-0">
            <span className="text-gray-500/80 font-black tracking-widest text-xl mb-3">{card.pokemon.id}</span>
            <h3 className="font-bold text-white text-lg px-2 drop-shadow-md">{card.pokemon.name}</h3>
          </div>

          <img
            src={card.pokemon.images?.large || card.pokemon.images?.small || ((card.pokemon as any).image ? getCardImageUrl((card.pokemon as any).image, 'high') : `https://images.scrydex.com/pokemon/${(card.pokemon.id || 'swsh3-1').toLowerCase()}/large`)}
            alt={card.pokemon.name}
            loading="eager"
            // @ts-ignore
            fetchpriority="high"
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
            className="absolute bottom-6 left-0 right-0 flex justify-center transition-all duration-300 pointer-events-none z-30"
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
          className={`w-full h-full shadow-[0_10px_25px_rgba(0,0,0,0.8)] border rounded-2xl group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] ${
            card.isMostExpensive ? 'border-cyan-400 ring-2 ring-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'border-white/20 group-hover:border-amber-400/60'
          }`}
        >
          {/* Price badge right above/on top of card art */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-black text-xs shadow-lg z-20 flex items-center gap-0.5 backdrop-blur-sm">
            <span>${displayPrice.toFixed(2)}</span>
          </div>

          {card.isMostExpensive ? (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-200/80 text-[9px] font-black text-white shadow-lg z-20 flex items-center gap-1 animate-pulse">
              <ShieldCheck className="w-3 h-3 text-cyan-200" />
              <span>Sleeved Hit</span>
            </div>
          ) : (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/90 border border-white/20 text-[9px] font-bold text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              📊 Market Data
            </div>
          )}
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
  location: string;
  address?: string;
  avatarColor: string;
  packName: string;
  setId: string; // The official TCGDex/Scrydex set ID
  packCount: number;
  openedPacks?: number;
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

const REALISTIC_CUSTOMER_ADDRESSES = [
  { address: '100 Universal City Plaza, Apt 402, Universal City, CA 91608, USA 🇺🇸', location: 'Los Angeles, California 🇺🇸' },
  { address: '350 5th Ave, Floor 32, New York, NY 10118, USA 🇺🇸', location: 'New York City, New York 🇺🇸' },
  { address: '221B Baker Street, Flat 3, Marylebone, London NW1 6XE, UK 🇬🇧', location: 'London, United Kingdom 🇬🇧' },
  { address: '88 Bay Street, Suite 1400, Toronto, ON M5J 2R8, Canada 🇨🇦', location: 'Toronto, Canada 🇨🇦' },
  { address: '456 Shibuya Crossing Ave, Apt 12B, Shibuya-ku, Tokyo 150-0042, Japan 🇯🇵', location: 'Tokyo, Japan 🇯🇵' },
  { address: '14 Opera House Blvd, Circular Quay, Sydney NSW 2000, Australia 🇦🇺', location: 'Sydney, Australia 🇦🇺' },
  { address: '1200 Congress Ave, Suite 800, Austin, TX 78701, USA 🇺🇸', location: 'Austin, Texas 🇺🇸' },
  { address: '405 Ocean Drive, Penthouse B, Miami Beach, FL 33139, USA 🇺🇸', location: 'Miami, Florida 🇺🇸' },
  { address: '233 S Wacker Dr, Unit 540, Chicago, IL 60606, USA 🇺🇸', location: 'Chicago, Illinois 🇺🇸' },
  { address: '1912 Pike Place, Apt 2A, Seattle, WA 98101, USA 🇺🇸', location: 'Seattle, Washington 🇺🇸' },
  { address: '75 Champs-Élysées, 4th Floor, 75008 Paris, France 🇫🇷', location: 'Paris, France 🇫🇷' },
  { address: 'Friedrichstraße 45, 10117 Berlin, Germany 🇩🇪', location: 'Berlin, Germany 🇩🇪' },
  { address: 'Gran Vía 28, 3rd West, 28013 Madrid, Spain 🇪🇸', location: 'Madrid, Spain 🇪🇸' },
  { address: 'Keizersgracht 482, 1017 EG Amsterdam, Netherlands 🇳🇱', location: 'Amsterdam, Netherlands 🇳🇱' },
  { address: 'Gangnam-daero 390, Suite 1102, Seoul 06232, South Korea 🇰🇷', location: 'Seoul, South Korea 🇰🇷' },
];

const SAMPLE_LOCATIONS = REALISTIC_CUSTOMER_ADDRESSES.map(a => a.location);

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

            const newName = (cached.name && !cached.name.startsWith('Pokémon Card') && cached.name !== 'Card') ? cached.name : c.pokemon.name;
            const newRarity = (cached.rarity && cached.rarity !== 'Common') ? cached.rarity : (c.pokemon.rarity || cached.rarity);

            const updatedPoke = {
              ...c.pokemon,
              name: newName,
              rarity: newRarity,
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
            if (
              newVal !== c.value ||
              updatedPoke.name !== c.pokemon.name ||
              updatedPoke.rarity !== c.pokemon.rarity ||
              !c.pokemon.pricing?.cardmarket ||
              (useImageFromCache && cached.image && (!c.pokemon.images?.large || !c.pokemon.images.large.includes(cached.image)))
            ) {
              changed = true;
              return { ...c, value: newVal, pokemon: updatedPoke };
            }
          }
          return c;
        });
        return changed ? reorderCardsWithMostExpensiveLast(updated) : prevCards;
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

  // Shipping & Completion Modal State
  const [completionModal, setCompletionModal] = useState<{
    order: CustomerOrder;
    hits: { name: string; value: number; image: string; rarity: string }[];
    totalValue: number;
  } | null>(null);

  const [shippingModal, setShippingModal] = useState<{
    id: string;
    customer: string;
    location: string;
    address: string;
    trackingCode: string;
    totalValue: number;
    sleevedHitName: string;
    sleevedHitValue: number;
  } | null>(null);

  const [shippingProgress, setShippingProgress] = useState(0);

  const handleStartShipping = () => {
    if (!activeOrder) return;
    sound.playPackComplete();
    const mostExp = cards.find(c => c.isMostExpensive) || cards[0];
    const trackingCode = `USPS #9400 1092 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    const matchedAddr = REALISTIC_CUSTOMER_ADDRESSES.find(a => a.location === activeOrder.location) || REALISTIC_CUSTOMER_ADDRESSES[0];
    const fullAddress = activeOrder.address || matchedAddr.address;

    setShippingProgress(15);
    setShippingModal({
      id: activeOrder.id,
      customer: activeOrder.username,
      location: activeOrder.location || matchedAddr.location,
      address: fullAddress,
      trackingCode,
      totalValue: cards.reduce((acc, c) => acc + c.value, 0),
      sleevedHitName: mostExp?.pokemon.name || 'Top Hit',
      sleevedHitValue: mostExp?.value || 0
    });

    let step = 15;
    const interval = setInterval(() => {
      step += 25;
      setShippingProgress(Math.min(step, 100));
      if (step >= 100) {
        clearInterval(interval);
      }
    }, 400);
  };

  const completeShipping = (modalData: typeof shippingModal) => {
    if (!modalData) return;
    sound.playButtonClick();
    sound.playCardCollect();

    addChatMessage({
      id: Date.now().toString() + "-shipped",
      username: "SYSTEM 📦",
      message: `🚚 PACKAGE DISPATCHED! Sleeved top hit (${modalData.sleevedHitName}) shipped to ${modalData.customer} in ${modalData.location}! Tracking: ${modalData.trackingCode}`,
      badge: "SHIPPED",
      color: "text-emerald-400 font-bold",
      avatarColor: "from-emerald-400 to-teal-600"
    });

    if (activeOrder) {
      const updated = { ...activeOrder, status: 'completed' as const };
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    }

    setShippingModal(null);
    setPackStage('unopened');
    setCards([]);
  };

  const remainingCards = React.useMemo(() => cards.filter(c => !c.collected), [cards]);
  const revealedCards = React.useMemo(() => cards.filter(c => c.collected), [cards]);
  const topCardId = React.useMemo(() => remainingCards.length > 0 ? remainingCards[remainingCards.length - 1].id : null, [remainingCards]);

  const lastProcessedPackRef = useRef<string | null>(null);

  useEffect(() => {
    if (packStage === 'opened' && cards.length > 0 && remainingCards.length === 0) {
      const packSignature = cards.map(c => c.id).join(',');
      if (lastProcessedPackRef.current === packSignature) return;
      lastProcessedPackRef.current = packSignature;

      handleFinishCurrentPack(cards);
    }
  }, [packStage, remainingCards.length, cards]);

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
          if (typeof triggerCardReaction === 'function') triggerCardReaction(card);
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
        if (typeof triggerCardReaction === 'function') triggerCardReaction(card);
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
            handleFinishCurrentPack(cards);
          }, 450);
        }
      }, idx * 480 + 620);
    });
  };

  const handleFinishCurrentPack = (currentCards: CardData[]) => {
    if (!activeOrder) return;
    
    // Extract ONLY genuine hits from current pack
    const packHits = currentCards
      .filter(c => isActualHit(c))
      .map(c => ({
        name: c.pokemon.name,
        value: c.value,
        image: c.pokemon.images?.large || c.pokemon.images?.small || ((c.pokemon as any).image ? getCardImageUrl((c.pokemon as any).image, 'high') : ''),
        rarity: c.pokemon.rarity || 'Hit'
      }));

    const currentOpened = activeOrder.openedPacks || 0;
    const newOpenedPacks = Math.min(currentOpened + 1, activeOrder.packCount);
    const existingPulled = activeOrder.pulledCards || [];
    
    const combinedPulled = [...existingPulled];
    packHits.forEach(h => {
      if (!combinedPulled.some(p => p.name === h.name && Math.abs(p.value - h.value) < 0.01)) {
        combinedPulled.push(h);
      }
    });

    const isAllComplete = newOpenedPacks >= activeOrder.packCount;
    const updatedOrder: CustomerOrder = {
      ...activeOrder,
      openedPacks: newOpenedPacks,
      pulledCards: combinedPulled,
      status: isAllComplete ? 'completed' : 'ripping'
    };

    setActiveOrder(updatedOrder);
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

    if (isAllComplete) {
      setTimeout(() => {
        sound.playPackComplete();
        setCompletionModal({
          order: updatedOrder,
          hits: combinedPulled,
          totalValue: combinedPulled.reduce((acc, card) => acc + card.value, 0)
        });
      }, 700);
    }
  };

  const preloadPackImages = (cards: PokemonCard[]): Promise<void> => {
    if (!cards || cards.length === 0) return Promise.resolve();
    const promises: Promise<void>[] = [];
    cards.forEach(card => {
      const urls: string[] = [];
      if (card.images?.large) urls.push(card.images.large);
      if (card.images?.small) urls.push(card.images.small);
      const cardAny = card as any;
      if (cardAny.image) {
        urls.push(getCardImageUrl(cardAny.image, 'high'));
        urls.push(getCardImageUrl(cardAny.image, 'low'));
      }
      const uniqueUrls = Array.from(new Set(urls));
      uniqueUrls.forEach(url => {
        promises.push(new Promise<void>(resolve => {
          const img = new Image();
          img.src = url;
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        }));
      });
    });

    const timeoutPromise = new Promise<void>(resolve => setTimeout(resolve, 2000));
    return Promise.race([
      Promise.allSettled(promises).then(() => {}),
      timeoutPromise
    ]);
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
        
        // PRIORITIZE NETWORK: Force browser to download & cache all card images for THIS pack FIRST
        await preloadPackImages(newCards);

        setCards(formatAndSortCards(newCards));

        // Delay background set warmup so it NEVER competes for network connections with the active pack
        if (!isJa) {
          setTimeout(() => {
            orchestrateSetLoading(setDetails, newCards.map(c => c.id));
          }, 400);
        }
      } catch (e) {
        const fbCards = generateFallbackPack(FALLBACK_POKEMON_CARDS, setDetails || { id: order.setId });
        await preloadPackImages(fbCards.map(c => c.pokemon));
        setCards(fbCards);
      }
    } catch (e) {
      const fbCards = generateFallbackPack(FALLBACK_POKEMON_CARDS, { id: order.setId });
      await preloadPackImages(fbCards.map(c => c.pokemon));
      setCards(fbCards);
    } finally {
      setIsLoadingPack(false);
    }
  };

  
  // Real orders mapped to actual sets & authentic full addresses!
  const [orders, setOrders] = useState<CustomerOrder[]>([
    {
      id: 'ord-101',
      username: '@PokeKing99',
      location: 'Los Angeles, California 🇺🇸',
      address: '100 Universal City Plaza, Apt 402, Universal City, CA 91608, USA 🇺🇸',
      avatarColor: 'from-amber-400 to-orange-500',
      packName: '151 Booster Pack',
      setId: 'sv3pt5',
      packCount: 3,
      totalPaid: 86.73,
      status: 'pending'
    },
    {
      id: 'ord-102',
      username: '@SlabKing',
      location: 'New York City, New York 🇺🇸',
      address: '350 5th Ave, Floor 32, New York, NY 10118, USA 🇺🇸',
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
      location: 'London, United Kingdom 🇬🇧',
      address: '221B Baker Street, Flat 3, Marylebone, London NW1 6XE, UK 🇬🇧',
      avatarColor: 'from-red-500 to-rose-700',
      packName: 'Base Set Vintage Pack',
      setId: 'base1',
      packCount: 1,
      totalPaid: 449.99,
      status: 'pending'
    },
    {
      id: 'ord-104',
      username: '@TokyoTrainer_JP',
      location: 'Tokyo, Japan 🇯🇵',
      address: '456 Shibuya Crossing Ave, Apt 12B, Shibuya-ku, Tokyo 150-0042, Japan 🇯🇵',
      avatarColor: 'from-pink-500 to-rose-500',
      packName: 'Shiny Treasure ex (JP)',
      setId: 'sv4a_ja',
      packCount: 4,
      totalPaid: 112.50,
      status: 'pending'
    },
    {
      id: 'ord-105',
      username: '@AussiePokeFan',
      location: 'Sydney, Australia 🇦🇺',
      address: '14 Opera House Blvd, Circular Quay, Sydney NSW 2000, Australia 🇦🇺',
      avatarColor: 'from-teal-400 to-cyan-600',
      packName: 'Paldea Evolved Booster',
      setId: 'sv2',
      packCount: 3,
      totalPaid: 31.47,
      status: 'pending'
    },
    {
      id: 'ord-106',
      username: '@MiamiCardVault',
      location: 'Miami, Florida 🇺🇸',
      address: '405 Ocean Drive, Penthouse B, Miami Beach, FL 33139, USA 🇺🇸',
      avatarColor: 'from-cyan-400 to-blue-600',
      packName: 'Prismatic Evolutions',
      setId: 'sv8pt5',
      packCount: 6,
      totalPaid: 179.94,
      status: 'pending'
    },
    {
      id: 'ord-107',
      username: '@BerlinPackCracker',
      location: 'Berlin, Germany 🇩🇪',
      address: 'Friedrichstraße 45, 10117 Berlin, Germany 🇩🇪',
      avatarColor: 'from-yellow-400 to-red-600',
      packName: 'Obsidian Flames Booster',
      setId: 'sv3',
      packCount: 3,
      totalPaid: 29.97,
      status: 'pending'
    },
    {
      id: 'ord-108',
      username: '@SeoulCardMaster',
      location: 'Seoul, South Korea 🇰🇷',
      address: 'Gangnam-daero 390, Suite 1102, Seoul 06232, South Korea 🇰🇷',
      avatarColor: 'from-purple-600 to-fuchsia-600',
      packName: '151 Japanese Box Pack',
      setId: 'sv2a_ja',
      packCount: 5,
      totalPaid: 145.00,
      status: 'pending'
    },
    {
      id: 'ord-100',
      username: '@VmaxCollector',
      location: 'Toronto, Canada 🇨🇦',
      address: '88 Bay Street, Suite 1400, Toronto, ON M5J 2R8, Canada 🇨🇦',
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
  const [newAddress, setNewAddress] = useState('');
  const [newLocation, setNewLocation] = useState('Austin, Texas 🇺🇸');
  const [newPackName, setNewPackName] = useState('151 Booster Pack');
  const [newSetId, setNewSetId] = useState('sv3');
  const [newPackCount, setNewPackCount] = useState(1);
  const [newTotalPaid, setNewTotalPaid] = useState(29.99);

  const handleAddNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    sound.playButtonClick();
    const randEntry = REALISTIC_CUSTOMER_ADDRESSES[Math.floor(Math.random() * REALISTIC_CUSTOMER_ADDRESSES.length)];
    const finalAddress = newAddress.trim() || randEntry.address;
    const finalLocation = newLocation.trim() || randEntry.location;
    const newOrd: CustomerOrder = {
      id: `ord-${Date.now()}`,
      username: newUsername.startsWith('@') ? newUsername.trim() : `@${newUsername.trim()}`,
      location: finalLocation,
      address: finalAddress,
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
    setNewAddress('');
    setIsAddFormOpen(false);
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', username: 'StreamBot', message: '🔴 RIP & SHIP LIVE! Pack ripping in progress! Type in chat to interact with the host!', badge: 'MOD', color: 'text-amber-400', avatarColor: 'from-yellow-400 to-amber-600' },
  ]);

  const [hostInput, setHostInput] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(orders[0] || null);

  const triggerCardReaction = React.useCallback(async (card: CardData) => {
    if (!card.isMostExpensive && card.value < 1.50 && !(card.pokemon.rarity || '').toLowerCase().includes('rare')) return;

    try {
      const { viewer, text } = await generateCardPullReaction({
        cardName: card.pokemon.name,
        cardValue: card.value,
        rarity: card.pokemon.rarity || 'Card',
        isMostExpensive: Boolean(card.isMostExpensive),
        buyerUsername: activeOrder?.username
      });

      addChatMessage({
        id: Date.now().toString() + Math.random(),
        username: viewer.username,
        message: text,
        badge: viewer.badge,
        color: viewer.color,
        avatarColor: viewer.avatarColor
      });
    } catch {
      // Silent catch
    }
  }, [activeOrder]);

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
        <div className="relative w-full z-30 px-3 sm:px-6 py-2.5 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 border-b border-amber-500/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${activeOrder.avatarColor} flex items-center justify-center font-black text-xs text-white shrink-0 shadow-md ring-2 ring-amber-400/50`}>
              {activeOrder.username.substring(1, 3).toUpperCase()}
            </div>
            <div className="min-w-0 text-left flex-1 max-w-md">
              <div className="flex items-center gap-2 truncate">
                <span className="text-xs font-black text-amber-300 truncate">{activeOrder.username}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">${activeOrder.totalPaid.toFixed(2)}</span>
                <span className="text-[9px] font-bold text-gray-400 truncate hidden sm:inline">• {activeOrder.location}</span>
              </div>

              {/* Customer Pack Progress Bar */}
              <div className="w-full flex items-center gap-2 mt-1">
                <div className="flex-1 bg-black/60 rounded-full h-2 border border-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(100, Math.round(((activeOrder.openedPacks || 0) / activeOrder.packCount) * 100))}%` }}
                    transition={{ duration: 0.4 }}
                    className="bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 h-full rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                  />
                </div>
                <span className="text-[10px] font-mono text-amber-300 font-bold shrink-0">
                  {activeOrder.openedPacks || 0} / {activeOrder.packCount} Packs
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (!activeOrder) return;
              if ((activeOrder.openedPacks || 0) >= activeOrder.packCount) {
                sound.playButtonClick();
                setCompletionModal({
                  order: activeOrder,
                  hits: activeOrder.pulledCards || [],
                  totalValue: (activeOrder.pulledCards || []).reduce((acc, c) => acc + c.value, 0)
                });
              } else {
                loadAndRipPack(activeOrder);
              }
            }}
            className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-wider shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 ${
              (activeOrder.openedPacks || 0) >= activeOrder.packCount
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-black border border-emerald-300 animate-pulse'
                : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white border border-red-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>
              {(activeOrder.openedPacks || 0) >= activeOrder.packCount
                ? `📦 ALL PACKS RIPPED - SHIP ORDER`
                : `📦 RIP PACK ${(activeOrder.openedPacks || 0) + 1}/${activeOrder.packCount} ⚡`}
            </span>
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
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    <Package className="w-8 h-8" />
                  </div>

                  <h3 className="text-xl font-extrabold mb-1">
                    Pack {activeOrder?.openedPacks || 1} of {activeOrder?.packCount} Completed!
                  </h3>

                  {cards.find(c => c.isMostExpensive) && (
                    <div className="text-xs text-cyan-300 font-extrabold bg-cyan-950/80 border border-cyan-400/50 px-3.5 py-1.5 rounded-full mb-3 shadow-lg flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                      <span>Pack Top Hit: {cards.find(c => c.isMostExpensive)?.pokemon.name} (${cards.find(c => c.isMostExpensive)?.value.toFixed(2)})</span>
                    </div>
                  )}

                  <p className="text-gray-400 text-xs mb-5">
                    Total Order Hits Value: <span className="text-emerald-400 font-bold">${((activeOrder?.pulledCards || []).reduce((acc, c) => acc + c.value, 0)).toFixed(2)}</span>
                  </p>

                  {(activeOrder?.openedPacks || 0) < (activeOrder?.packCount || 1) ? (
                    <button
                      onClick={() => activeOrder && loadAndRipPack(activeOrder)}
                      className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 font-black text-white text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(245,158,11,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Package className="w-5 h-5 text-white" />
                      <span>📦 RIP PACK {(activeOrder?.openedPacks || 0) + 1} OF {activeOrder?.packCount} FOR {activeOrder?.username} ⚡</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playButtonClick();
                        if (activeOrder) {
                          setCompletionModal({
                            order: activeOrder,
                            hits: activeOrder.pulledCards || [],
                            totalValue: (activeOrder.pulledCards || []).reduce((acc, c) => acc + c.value, 0)
                          });
                        }
                      }}
                      className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 font-black text-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                    >
                      <Truck className="w-5 h-5 text-black" />
                      <span>🎉 ALL PACKS OPENED - SHIP ORDER TO LOGISTICS 📦</span>
                    </button>
                  )}
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

                            {/* Pack Opening Progress Bar */}
                            <div className="mt-1.5 w-full max-w-sm">
                              <div className="flex items-center justify-between text-[10px] text-gray-300 font-extrabold mb-0.5">
                                <span>Pack Progress</span>
                                <span className="text-amber-300 font-mono">{ord.openedPacks || 0} / {ord.packCount} Packs ({Math.round(((ord.openedPacks || 0) / ord.packCount) * 100)}%)</span>
                              </div>
                              <div className="w-full bg-black/60 rounded-full h-1.5 border border-white/10 overflow-hidden">
                                <div
                                  style={{ width: `${Math.min(100, Math.round(((ord.openedPacks || 0) / ord.packCount) * 100))}%` }}
                                  className="bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 h-full rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                                />
                              </div>
                            </div>

                            {/* Full Customer Shipping Address */}
                            <div className="mt-1 text-[11px] text-gray-300 font-sans flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              <span className="truncate">{ord.address || ord.location}</span>
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

      {/* ── 7. Shipping Animation Modal ── */}
      <AnimatePresence>
        {shippingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl p-4 flex items-center justify-center pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="relative w-full max-w-lg bg-gradient-to-b from-[#131124] to-[#07050e] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.35)] text-center flex flex-col items-center overflow-hidden text-white"
            >
              {/* Delivery Van / Truck Animation */}
              <motion.div
                animate={{ x: [-15, 15, -15] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-[0_0_30px_rgba(245,158,11,0.6)] mb-4 flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full bg-[#0c0a18] flex items-center justify-center">
                  <Truck className="w-10 h-10 text-amber-400 animate-bounce" />
                </div>
              </motion.div>

              <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-widest mb-2.5 flex items-center gap-1.5 shadow-md">
                <Package className="w-4 h-4 text-amber-400" />
                <span>PACKAGING & SHIPPING LIVE</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
                Shipping to <span className="text-amber-300">{shippingModal.customer}</span>
              </h2>
              
              {/* Parcel Shipping Address Card */}
              <div className="w-full bg-[#171429] border border-white/15 rounded-2xl p-4 mb-6 flex flex-col items-center relative overflow-hidden shadow-inner">
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded border border-red-500/60 bg-red-950/90 text-red-400 text-[9px] font-black uppercase tracking-widest rotate-3 shadow">
                  FRAGILE &middot; SLEEVED HITS
                </div>

                <div className="text-xs text-amber-300 font-extrabold flex items-center gap-1.5 mb-1">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                  <span>SHIP TO ADDRESS</span>
                </div>
                <div className="text-xs font-bold text-gray-200 text-center max-w-sm mb-3 px-2">
                  {shippingModal.address}
                </div>

                <div className="text-xs text-cyan-300 font-bold flex items-center gap-1 mb-2 bg-cyan-950/80 border border-cyan-400/40 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Sleeved Hit: <strong>{shippingModal.sleevedHitName}</strong> (${shippingModal.sleevedHitValue.toFixed(2)})</span>
                </div>

                <div className="text-[11px] text-gray-400 font-mono">
                  Tracking Code: <span className="text-gray-200 font-bold">{shippingModal.trackingCode}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-black/60 rounded-full h-3 mt-4 overflow-hidden border border-white/10 p-0.5">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${shippingProgress}%` }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                  />
                </div>

                <span className="text-[10px] font-mono text-amber-300 font-bold mt-2">
                  {shippingProgress < 30 ? '🛡️ Sleeving Top Hits...' : shippingProgress < 70 ? '📦 Bubble Envelope Sealing...' : '🚚 Dispatched to Logistics Provider!'}
                </span>
              </div>

              <button
                onClick={() => completeShipping(shippingModal)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-black font-black text-sm uppercase tracking-wider shadow-[0_4px_25px_rgba(16,185,129,0.5)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-black" />
                <span>CONFIRM PACKAGE DISPATCH</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All Packs Opened & Box Packing Modal ── */}
      <AnimatePresence>
        {completionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              className="w-full max-w-lg bg-gradient-to-b from-[#1c1830] via-[#120f24] to-[#0a0817] border-2 border-amber-400/60 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center flex flex-col items-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              
              {/* Animated Parcel Box Header */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
              >
                <Package className="w-10 h-10 text-amber-400 animate-pulse" />
              </motion.div>

              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 shadow">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>ORDER COMPLETE ({completionModal.order.packCount}/{completionModal.order.packCount} PACKS RIPPED)</span>
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
                All Packs Opened for <span className="text-amber-300">{completionModal.order.username}</span>!
              </h2>
              <p className="text-xs text-gray-300 font-bold mb-4">
                Ship off their order! Packing all pulled hit cards into parcel box below 📦
              </p>

              {/* Packing Box Animation Container */}
              <div className="w-full bg-[#120f22] border border-amber-500/30 rounded-2xl p-4 mb-5 flex flex-col items-center shadow-inner relative overflow-hidden">
                <div className="text-xs font-black text-cyan-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>BOXING UP PULLED HITS ({completionModal.hits.length} CARDS)</span>
                </div>

                <div className="w-full max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {completionModal.hits.length > 0 ? (
                    completionModal.hits.map((hit, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -30, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ delay: idx * 0.15, duration: 0.3 }}
                        className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-12 rounded-lg bg-black border border-amber-400/40 overflow-hidden shrink-0 shadow">
                            {hit.image ? (
                              <img src={hit.image} alt={hit.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-amber-950/80">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                              </div>
                            )}
                          </div>
                          <div className="text-left min-w-0">
                            <div className="text-xs font-extrabold text-white truncate">{hit.name}</div>
                            <div className="text-[10px] text-amber-300 font-mono">{hit.rarity}</div>
                          </div>
                        </div>
                        <div className="text-xs font-mono font-black text-emerald-400 shrink-0">
                          ${hit.value.toFixed(2)}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 py-3 italic">Standard bulk cards packaged in penny sleeves</div>
                  )}
                </div>

                <div className="w-full mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400 font-bold">Total Pulled Value:</span>
                  <span className="text-emerald-400 font-black text-sm">${completionModal.totalValue.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Button: Ship Off Order */}
              <button
                onClick={() => {
                  sound.playButtonClick();
                  const orderToShip = completionModal.order;
                  setCompletionModal(null);
                  handleStartShipping();
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-[0_4px_25px_rgba(245,158,11,0.5)] transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Truck className="w-5 h-5 text-white animate-bounce" />
                <span>SHIP OFF ORDER FOR {completionModal.order.username} 🚚</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
