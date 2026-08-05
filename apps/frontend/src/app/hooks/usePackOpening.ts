import { useState, useCallback } from 'react';
import {
  fetchSetDetails,
  generatePackFromSet,
  cardFullCache,
  getRealCardPrice,
  type TCGDexSet,
  type PokemonCard
} from '../services/tcgdex';
import {
  fetchSingleJapaneseSet,
  generateJapanesePackFromSet
} from '../services/scrydex';
import { sound } from '../services/sound';
import {
  type CardData
} from '../utils/packUtils';
import {
  FALLBACK_POKEMON_CARDS,
  generateFallbackPack
} from '../data/fallbackCards';

export const formatAndSortCards = (newCards: PokemonCard[]): CardData[] => {
  const enrichedCards: PokemonCard[] = newCards.map(c => {
    const cached = cardFullCache.get(c.id);
    if (cached) {
      return {
        ...c,
        pricing: cached.pricing || (c as any).pricing,
        tcgplayer: cached.tcgplayer || (c as any).tcgplayer,
        cardmarket: cached.cardmarket || (c as any).cardmarket,
        rarity: cached.rarity || c.rarity
      };
    }
    return c;
  });

  const formatted: CardData[] = enrichedCards.map((poke, idx) => ({
    id: `${poke.id || 'card'}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
    originalIndex: idx,
    flipped: false,
    collected: false,
    value: getRealCardPrice(poke),
    pokemon: poke
  }));

  // Sort cards ascending by market price value so lower value cards are drawn first
  formatted.sort((a, b) => a.value - b.value);

  // Extract Energy card if present
  const energyIdx = formatted.findIndex(c =>
    c.pokemon.name?.toLowerCase().includes('energy') ||
    c.pokemon.id?.toLowerCase().includes('energy')
  );

  let energyCard: CardData | null = null;
  if (energyIdx >= 0) {
    [energyCard] = formatted.splice(energyIdx, 1);
  }

  // Extract Most Expensive Hit Card (highest value, now at end of array)
  const mostExpensiveCard = formatted.pop();

  // Insert Most Expensive Hit Card at index 0 (bottom of visual stack, revealed LAST)
  if (mostExpensiveCard) {
    formatted.unshift(mostExpensiveCard);
  }

  // Place Energy card at index length-1 (top of visual stack, revealed FIRST)
  if (energyCard) {
    formatted.push(energyCard);
  }

  return formatted.map((c, idx) => ({ ...c, originalIndex: idx }));
};

export interface PackOpeningState {
  packStage: 'wrapper' | 'ripping' | 'opened';
  cards: CardData[];
  revealedCards: CardData[];
  isLoadingPack: boolean;
  isRevealingAll: boolean;
  selectedLanguage: 'en' | 'ja';
  selectedSeriesId: string;
  currentSet: TCGDexSet | null;
  packArtIndex: number;
  binderAddedIds: Set<number | string>;
  setPackStage: (stage: 'wrapper' | 'ripping' | 'opened') => void;
  setSelectedLanguage: (lang: 'en' | 'ja') => void;
  setSelectedSeriesId: (seriesId: string) => void;
  setPackArtIndex: React.Dispatch<React.SetStateAction<number>>;
  loadSetAndGeneratePack: (setId: string, lang?: 'en' | 'ja') => Promise<void>;
  handleCardClick: (cardId: string) => void;
  handleRevealAll: () => void;
  handleResetPack: () => void;
  markCardAddedToBinder: (cardId: number | string) => void;
}

export function usePackOpening(): PackOpeningState {
  const [packStage, setPackStage] = useState<'wrapper' | 'ripping' | 'opened'>('wrapper');
  const [cards, setCards] = useState<CardData[]>([]);
  const [revealedCards, setRevealedCards] = useState<CardData[]>([]);
  const [isLoadingPack, setIsLoadingPack] = useState(false);
  const [isRevealingAll, setIsRevealingAll] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ja'>('en');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('swsh');
  const [currentSet, setCurrentSet] = useState<TCGDexSet | null>(null);
  const [packArtIndex, setPackArtIndex] = useState(0);
  const [binderAddedIds, setBinderAddedIds] = useState<Set<number | string>>(new Set());

  const loadSetAndGeneratePack = useCallback(async (setId: string, lang: 'en' | 'ja' = selectedLanguage) => {
    setIsLoadingPack(true);
    setPackStage('wrapper');
    setRevealedCards([]);
    try {
      const isJa = lang === 'ja' || setId.endsWith('_ja');
      const setObj = isJa ? await fetchSingleJapaneseSet(setId) : await fetchSetDetails(setId);
      setCurrentSet(setObj as TCGDexSet);
      const newCards = isJa
        ? await generateJapanesePackFromSet(setObj as any)
        : await generatePackFromSet(setObj as TCGDexSet);
      const formatted = formatAndSortCards(newCards);
      setCards(formatted);
    } catch {
      const fallback = generateFallbackPack(FALLBACK_POKEMON_CARDS, { id: setId });
      setCards(fallback as any);
    } finally {
      setIsLoadingPack(false);
    }
  }, [selectedLanguage]);

  const handleCardClick = useCallback((cardId: string) => {
    setCards(prevCards => {
      const updated = prevCards.map(c => {
        if (c.id === cardId) {
          if (!c.flipped) sound.playCardFlip();
          return { ...c, flipped: true, collected: true };
        }
        return c;
      });
      const hit = updated.find(c => c.id === cardId);
      if (hit && !revealedCards.some(rc => rc.id === cardId)) {
        setRevealedCards(r => [...r, hit]);
      }
      return updated;
    });
  }, [revealedCards]);

  const handleRevealAll = useCallback(() => {
    setIsRevealingAll(true);
    sound.playCardFlip();
    setCards(prevCards => {
      const updated = prevCards.map(c => ({ ...c, flipped: true, collected: true }));
      setRevealedCards(updated);
      return updated;
    });
    setTimeout(() => setIsRevealingAll(false), 500);
  }, []);

  const handleResetPack = useCallback(() => {
    setPackStage('wrapper');
    setRevealedCards([]);
    setCards(prev => prev.map(c => ({ ...c, flipped: false, collected: false })));
  }, []);

  const markCardAddedToBinder = useCallback((cardId: number | string) => {
    setBinderAddedIds(prev => new Set(prev).add(cardId));
  }, []);

  return {
    packStage,
    cards,
    revealedCards,
    isLoadingPack,
    isRevealingAll,
    selectedLanguage,
    selectedSeriesId,
    currentSet,
    packArtIndex,
    binderAddedIds,
    setPackStage,
    setSelectedLanguage,
    setSelectedSeriesId,
    setPackArtIndex,
    loadSetAndGeneratePack,
    handleCardClick,
    handleRevealAll,
    handleResetPack,
    markCardAddedToBinder
  };
}
