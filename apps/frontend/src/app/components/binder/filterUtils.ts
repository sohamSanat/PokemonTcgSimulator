/**
 * @file filterUtils.ts
 * @description Filtering and sorting algorithms for the Pokémon card vault.
 * Handles search queries, set filters, complex rarity categories (SIR, SR, UR, IR),
 * holofoil / favorite toggles, and multi-field sorting.
 */

import type { Card } from './types';

/** Filter state options passed from BinderView */
export interface CardFilters {
  /** Search text matching name, set, number, or rarity */
  searchQuery: string;
  /** Selected set filter ("All Sets" or specific expansion name) */
  activeSetFilter: string;
  /** Selected rarity filter ("All Rarities", "SIR", "SR", "UR", "IR", etc.) */
  activeRarityFilter: string;
  /** Selected energy/card type filter ("All Types", "Fire", "Water", etc.) */
  activeTypeFilter: string;
  /** Whether to filter strictly for holofoil cards */
  holofoilOnly: boolean;
  /** Whether to filter strictly for user favorited cards */
  favoritesOnly: boolean;
}

/** Supported sort criteria for cards list */
export type SortOption = "price-desc" | "price-asc" | "name" | "rarity" | "newest";

/**
 * Filters a raw list of cards based on active search text, set, rarity, type, holofoil, and favorite parameters.
 * 
 * @param rawCards - Unfiltered cards belonging to the active binder.
 * @param filters - Active filter settings.
 * @returns Filtered array of Cards.
 */
export function filterCards(rawCards: Card[], filters: CardFilters): Card[] {
  const { searchQuery, activeSetFilter, activeRarityFilter, activeTypeFilter, holofoilOnly, favoritesOnly } = filters;

  return rawCards.filter(card => {
    // 1. Text search query (matches card name, set name, card set number, or rarity)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = card.name.toLowerCase().includes(q);
      const matchesSet = card.setName?.toLowerCase().includes(q);
      const matchesNumber = card.setNumber?.toLowerCase().includes(q);
      const matchesRarity = card.rarity?.toLowerCase().includes(q);
      if (!matchesName && !matchesSet && !matchesNumber && !matchesRarity) return false;
    }

    // 2. Expansion Set filter
    if (activeSetFilter !== "All Sets" && card.setName !== activeSetFilter) return false;

    // 3. Card Type filter (e.g. Fire, Water, Trainer)
    if (activeTypeFilter !== "All Types" && card.type !== activeTypeFilter) return false;

    // 4. Rarity filter with category parsing
    if (activeRarityFilter !== "All Rarities") {
      const cRarity = (card.rarity || "").toLowerCase();
      const fRarity = activeRarityFilter.toLowerCase();

      if (fRarity === "sir" || fRarity.includes("special illustration") || fRarity.includes("sir")) {
        const isSir = cRarity.includes("special illustration") || cRarity === "sir" || cRarity === "sar" || cRarity.includes("special art");
        if (!isSir) return false;
      } else if (fRarity === "sr" || fRarity.includes("secret rare") || fRarity === "secret") {
        const isSr = (cRarity.includes("secret") || cRarity === "sr" || cRarity.includes("super rare")) && !cRarity.includes("special illustration");
        if (!isSr) return false;
      } else if (fRarity === "ur" || fRarity.includes("ultra rare")) {
        const isUr = cRarity.includes("ultra") || cRarity === "ur" || cRarity.includes("double rare") || cRarity.includes("hyper rare") || cRarity.includes("vmax") || cRarity.includes("vstar") || (cRarity.includes("ex") && !cRarity.includes("special illustration"));
        if (!isUr) return false;
      } else if (fRarity === "ir" || fRarity.includes("illustration rare")) {
        const isIr = (cRarity.includes("illustration") || cRarity === "ir" || cRarity.includes("art rare") || cRarity === "ar") && !cRarity.includes("special illustration");
        if (!isIr) return false;
      } else if (fRarity === "common") {
        if (!cRarity.includes("common")) return false;
      } else if (fRarity === "uncommon") {
        if (!cRarity.includes("uncommon")) return false;
      } else if (fRarity === "rare") {
        if (!cRarity.includes("rare") || cRarity.includes("ultra") || cRarity.includes("secret") || cRarity.includes("illustration") || cRarity.includes("special")) return false;
      } else if (fRarity.includes("promo")) {
        if (!cRarity.includes("promo") && !card.id.toLowerCase().includes("promo")) return false;
      } else if (fRarity.includes("shiny vault")) {
        if (!cRarity.includes("shiny vault") && !cRarity.includes("shiny")) return false;
      } else {
        // Exact or partial match for custom rarity strings
        if (card.rarity !== activeRarityFilter && !cRarity.includes(fRarity)) return false;
      }
    }

    // 5. Holofoil filter check
    if (holofoilOnly && !card.holofoil) return false;

    // 6. Favorites filter check
    if (favoritesOnly && !card.favorite) return false;

    return true;
  });
}

/**
 * Calculates a numerical rank score for a card's rarity grade.
 * Higher rank indicates higher rarity tier.
 */
export function rarityRank(r: string): number {
  const lr = (r || "").toLowerCase();
  if (lr.includes("secret") || lr.includes("hyper") || lr.includes("special illustration") || lr.includes("sir") || lr.includes("sar") || lr.includes("gold")) return 5;
  if (lr.includes("ultra") || lr.includes("illustration") || lr.includes("double") || lr.includes("ur") || lr.includes("ir") || lr.includes("vmax") || lr.includes("vstar") || lr.includes("ex")) return 4;
  if (lr.includes("rare") || lr.includes("holo")) return 3;
  if (lr.includes("uncommon")) return 2;
  return 1;
}

/**
 * Sorts an array of cards based on the selected sort criteria.
 * 
 * @param cards - Array of cards to sort.
 * @param sortBy - Selected sort option ("price-desc", "price-asc", "name", "rarity").
 * @returns New sorted array of Cards.
 */
export function sortCards(cards: Card[], sortBy: SortOption): Card[] {
  const list = [...cards];
  if (sortBy === "price-desc") {
    list.sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
  } else if (sortBy === "price-asc") {
    list.sort((a, b) => (a.currentPrice || 0) - (b.currentPrice || 0));
  } else if (sortBy === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "rarity") {
    list.sort((a, b) => {
      const diff = rarityRank(b.rarity) - rarityRank(a.rarity);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }
  return list;
}
