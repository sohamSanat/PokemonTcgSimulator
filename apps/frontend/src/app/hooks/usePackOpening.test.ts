import { describe, it, expect } from 'vitest';
import { formatAndSortCards } from './usePackOpening';
import type { PokemonCard } from '../services/tcgdex';

describe('Pack Opening Card Sorting Unit Tests', () => {
  const sampleRawCards: PokemonCard[] = [
    { id: 'c1', localId: '1', name: 'Bulbasaur', rarity: 'Common', images: { small: 'b.png', large: 'b.png' }, pricing: { cardmarket: { trend: 0.15 } } },
    { id: 'c2', localId: '2', name: 'Charizard ex', rarity: 'Special Illustration Rare', images: { small: 'c.png', large: 'c.png' }, pricing: { cardmarket: { trend: 150.00 } } },
    { id: 'c3', localId: '3', name: 'Basic Fire Energy', rarity: 'Common', images: { small: 'e.png', large: 'e.png' }, pricing: { cardmarket: { trend: 0.05 } } },
    { id: 'c4', localId: '4', name: 'Pikachu', rarity: 'Uncommon', images: { small: 'p.png', large: 'p.png' }, pricing: { cardmarket: { trend: 2.50 } } },
  ];

  it('should format raw cards and assign unique IDs', () => {
    const formatted = formatAndSortCards(sampleRawCards);
    expect(formatted).toHaveLength(4);
    formatted.forEach(card => {
      expect(card.id).toBeDefined();
      expect(card.flipped).toBe(false);
      expect(card.collected).toBe(false);
    });
  });

  it('should place Energy card at top of stack (last index, revealed first)', () => {
    const formatted = formatAndSortCards(sampleRawCards);
    const topCard = formatted[formatted.length - 1];
    expect(topCard.pokemon.name).toContain('Energy');
  });

  it('should place Most Expensive Hit card at index 0 (revealed last)', () => {
    const formatted = formatAndSortCards(sampleRawCards);
    const hitCard = formatted[0];
    expect(hitCard.pokemon.name).toContain('Charizard ex');
    expect(hitCard.value).toBeGreaterThan(100);
  });
});
