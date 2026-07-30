/**
 * @file types.ts
 * @description Centralized TypeScript interface and type definitions for the Binder module.
 * Defines the core models for cards, binders, sets, user profiles, and price history data.
 */

/** Represents a card stored in a bulk set/catalogue */
export interface BulkCard {
  /** Unique card identification string */
  id: string;
  /** Name of the Pokémon card */
  name: string;
  /** Card rarity classification (e.g., Common, Rare, Secret Rare) */
  rarity: string;
  /** High-resolution image URL */
  imageUrl: string;
  /** Name of the set to which this card belongs */
  setName: string;
  /** Number of duplicate copies owned in bulk */
  count: number;
}

/** Dictionary mapping set names to card IDs and their bulk metadata */
export type CatalogueStore = Record<string, Record<string, BulkCard>>;

/** Represents a single data point in a card's 30-day price history chart */
export interface PricePoint {
  /** Day offset index (1 through 30) */
  day: number;
  /** Historical market price in USD on that day */
  price: number;
}

/** Represents a individual collected Pokémon card with metadata, condition, and market valuation */
export interface Card {
  /** Unique instance identifier for this specific collected card */
  id: string;
  /** Display name of the card */
  name: string;
  /** Expansion set name (e.g., "151", "Paldea Evolved") */
  setName: string;
  /** Set number code (e.g., "001/165") */
  setNumber: string;
  /** Card rarity grade string */
  rarity: string;
  /** Primary energy type or card classification (e.g., Fire, Water, Trainer) */
  type: string;
  /** Current estimated market price in USD */
  currentPrice: number;
  /** Original purchase value or initial estimated price */
  originalValue?: number;
  /** Exact price paid when card was acquired */
  acquiredPrice?: number;
  /** 24-hour percentage price change trend (-100 to +100%) */
  priceChange: number;
  /** Array of 30 historical daily price points for mini sparkline charting */
  priceHistory: PricePoint[];
  /** Whether this card has a holofoil/reverse-holo sheen finish */
  holofoil: boolean;
  /** Image URL for rendering card art */
  imageUrl: string;
  /** Whether the user has marked this card as a favorite */
  favorite: boolean;
  /** Identifier of the binder containing this card (defaults to 'my-collection') */
  binderId?: string;
  /** Whether this card has been slabbed and authenticated */
  isSlabbed?: boolean;
  /** Human-readable PSA grade label (e.g., "PSA 10 Gem Mint") */
  slabGrade?: string;
  /** Whether the card underwent surface restoration before grading */
  isRestored?: boolean;
  /** Calculated condition/preparation score before PSA grading */
  prepScore?: number;
  /** Detailed breakdown of PSA grading outcome and subgrades */
  psaDetails?: {
    gradeNum: number;
    certNumber: string;
    gradedDate: string;
    subgrades: {
      centering: number;
      surface: number;
      corners: number;
      edges: number;
    };
    originalValue: number;
    multiplier: number;
  };
}

/** Represents a user collection binder container */
export interface Binder {
  /** Unique binder identifier */
  id: string;
  /** Custom title/label of the binder */
  name: string;
  /** Total count of cards currently stored inside this binder */
  count: number;
  /** Total aggregated market value of all cards inside this binder */
  value: number;
  /** Whether this is a user-created custom binder */
  isCustom?: boolean;
  /** Whether this binder represents a complete set expansion master binder */
  isMasterSet?: boolean;
  /** Master set identifier code */
  masterSetId?: string;
  /** Master set title */
  masterSetName?: string;
  /** Total number of official cards required to complete this master set */
  totalCardsInSet?: number;
  /** Era/generation group (e.g., "Scarlet & Violet", "Sword & Shield") */
  generation?: string;
}

/** Represents a single set expansion option within a generation */
export interface SetOption {
  id: string;
  name: string;
  totalCards: number;
}

/** Represents a generation group containing multiple Pokémon card set expansions */
export interface GenerationOption {
  name: string;
  sets: SetOption[];
}

/** User profile metadata for portfolio showcase */
export interface UserProfile {
  displayName: string;
  bio: string;
  avatarUrl?: string;
  showcaseCardIds: string[];
  updatedAt?: string;
}

/* Re-exports for modular access & backwards compatibility across the app */
export * from './constants';
export * from './utils';
export * from './store';
