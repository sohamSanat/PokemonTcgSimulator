/**
 * @file constants.ts
 * @description Static dataset definitions and default preset options for the Binder module.
 * Contains generation sets metadata, sample initial cards, and default user binders.
 */

import type { GenerationOption, Card, Binder } from "./types";

/**
 * List of Pokémon Trading Card Game generations and their expansion sets.
 * Used for filtering, set selection dropdowns, and master binder tracking.
 */
export const MASTER_SET_GENERATIONS: GenerationOption[] = [
  {
    name: "Scarlet & Violet Series",
    sets: [
      { id: "sv8", name: "Surging Sparks", totalCards: 191 },
      { id: "sv7", name: "Stellar Crown", totalCards: 142 },
      { id: "sv6.5", name: "Shrouded Fable", totalCards: 64 },
      { id: "sv6", name: "Twilight Masquerade", totalCards: 167 },
      { id: "sv5", name: "Temporal Forces", totalCards: 162 },
      { id: "sv4.5", name: "Paldean Fates", totalCards: 91 },
      { id: "sv4", name: "Paradox Rift", totalCards: 182 },
      { id: "sv3.5", name: "151", totalCards: 165 },
      { id: "sv3", name: "Obsidian Flames", totalCards: 197 },
      { id: "sv2", name: "Paldea Evolved", totalCards: 193 },
      { id: "sv1", name: "Scarlet & Violet Base", totalCards: 198 },
    ]
  },
  {
    name: "Sword & Shield Series",
    sets: [
      { id: "swsh12.5", name: "Crown Zenith", totalCards: 160 },
      { id: "swsh12", name: "Silver Tempest", totalCards: 195 },
      { id: "swsh11", name: "Lost Origin", totalCards: 196 },
      { id: "swsh10.5", name: "Pokémon GO", totalCards: 78 },
      { id: "swsh10", name: "Astral Radiance", totalCards: 189 },
      { id: "swsh9", name: "Brilliant Stars", totalCards: 172 },
      { id: "swsh8", name: "Fusion Strike", totalCards: 264 },
      { id: "swsh7.5", name: "Celebrations", totalCards: 25 },
      { id: "swsh7", name: "Evolving Skies", totalCards: 203 },
      { id: "swsh6", name: "Chilling Reign", totalCards: 198 },
      { id: "swsh5", name: "Battle Styles", totalCards: 163 },
      { id: "swsh4.5", name: "Shining Fates", totalCards: 72 },
      { id: "swsh4", name: "Vivid Voltage", totalCards: 185 },
      { id: "swsh3.5", name: "Champion's Path", totalCards: 73 },
      { id: "swsh3", name: "Darkness Ablaze", totalCards: 189 },
      { id: "swsh2", name: "Rebel Clash", totalCards: 192 },
      { id: "swsh1", name: "Sword & Shield Base", totalCards: 202 },
    ]
  },
  {
    name: "Sun & Moon Series",
    sets: [
      { id: "sm12", name: "Cosmic Eclipse", totalCards: 236 },
      { id: "sm115", name: "Hidden Fates", totalCards: 68 },
      { id: "sm11", name: "Unified Minds", totalCards: 236 },
      { id: "sm10", name: "Unbroken Bonds", totalCards: 214 },
      { id: "sm9", name: "Team Up", totalCards: 181 },
      { id: "sm8", name: "Lost Thunder", totalCards: 214 },
      { id: "sm7.5", name: "Dragon Majesty", totalCards: 70 },
      { id: "sm7", name: "Celestial Storm", totalCards: 168 },
      { id: "sm6", name: "Forbidden Light", totalCards: 131 },
      { id: "sm5", name: "Ultra Prism", totalCards: 156 },
      { id: "sm4", name: "Crimson Hallucinogen / Crimson Invasion", totalCards: 111 },
      { id: "sm3.5", name: "Shining Legends", totalCards: 73 },
      { id: "sm3", name: "Burning Shadows", totalCards: 147 },
      { id: "sm2", name: "Guardians Rising", totalCards: 145 },
      { id: "sm1", name: "Sun & Moon Base", totalCards: 149 },
    ]
  },
  {
    name: "XY Series",
    sets: [
      { id: "xy12", name: "Evolutions", totalCards: 108 },
      { id: "xy11", name: "Steam Siege", totalCards: 114 },
      { id: "xy10", name: "Fates Collide", totalCards: 124 },
      { id: "xy9", name: "BREAKpoint", totalCards: 122 },
      { id: "xy8", name: "BREAKthrough", totalCards: 162 },
      { id: "xy7", name: "Ancient Origins", totalCards: 98 },
      { id: "xy6", name: "Roaring Skies", totalCards: 108 },
      { id: "xy5", name: "Primal Clash", totalCards: 160 },
      { id: "xy4", name: "Phantom Forces", totalCards: 119 },
      { id: "xy3", name: "Furious Fists", totalCards: 111 },
      { id: "xy2", name: "Flashfire", totalCards: 106 },
      { id: "xy1", name: "XY Base", totalCards: 146 },
    ]
  },
  {
    name: "Black & White Series",
    sets: [
      { id: "bw11", name: "Legendary Treasures", totalCards: 138 },
      { id: "bw10", name: "Plasma Blast", totalCards: 101 },
      { id: "bw9", name: "Plasma Freeze", totalCards: 116 },
      { id: "bw8", name: "Plasma Storm", totalCards: 135 },
      { id: "bw7", name: "Boundaries Crossed", totalCards: 149 },
      { id: "bw6", name: "Dragons Exalted", totalCards: 124 },
      { id: "bw5", name: "Dark Explorers", totalCards: 108 },
      { id: "bw4", name: "Next Destinies", totalCards: 99 },
      { id: "bw3", name: "Noble Victories", totalCards: 101 },
      { id: "bw2", name: "Emerging Powers", totalCards: 98 },
      { id: "bw1", name: "Black & White Base", totalCards: 114 },
    ]
  },
  {
    name: "HeartGold & SoulSilver Series",
    sets: [
      { id: "hgss1", name: "HeartGold & SoulSilver Base", totalCards: 124 },
      { id: "hgss2", name: "Unleashed", totalCards: 96 },
      { id: "hgss3", name: "Undaunted", totalCards: 91 },
      { id: "hgss4", name: "Triumphant", totalCards: 103 },
    ]
  },
  {
    name: "Platinum Series",
    sets: [
      { id: "pl1", name: "Platinum Base", totalCards: 133 },
      { id: "pl2", name: "Rising Rivals", totalCards: 120 },
      { id: "pl3", name: "Supreme Victors", totalCards: 153 },
      { id: "pl4", name: "Arceus", totalCards: 111 },
    ]
  },
  {
    name: "Diamond & Pearl Series",
    sets: [
      { id: "dp1", name: "Diamond & Pearl Base", totalCards: 130 },
      { id: "dp2", name: "Mysterious Treasures", totalCards: 124 },
      { id: "dp3", name: "Secret Wonders", totalCards: 132 },
      { id: "dp4", name: "Great Encounters", totalCards: 106 },
      { id: "dp5", name: "Majestic Dawn", totalCards: 100 },
      { id: "dp6", name: "Legends Awakened", totalCards: 146 },
      { id: "dp7", name: "Stormfront", totalCards: 106 },
    ]
  },
  {
    name: "EX Series",
    sets: [
      { id: "ex1", name: "EX Ruby & Sapphire", totalCards: 109 },
      { id: "ex2", name: "EX Sandstorm", totalCards: 100 },
      { id: "ex3", name: "EX Dragon", totalCards: 100 },
      { id: "ex5", name: "EX Hidden Legends", totalCards: 102 },
      { id: "ex6", name: "EX FireRed & LeafGreen", totalCards: 116 },
      { id: "ex7", name: "EX Team Rocket Returns", totalCards: 111 },
      { id: "ex8", name: "EX Deoxys", totalCards: 108 },
      { id: "ex14", name: "EX Crystal Guardians", totalCards: 100 },
      { id: "ex15", name: "EX Dragon Frontiers", totalCards: 101 },
      { id: "ex16", name: "EX Power Keepers", totalCards: 108 },
    ]
  },
  {
    name: "Wizards of the Coast (Base Gen)",
    sets: [
      { id: "base1", name: "Base Set", totalCards: 102 },
      { id: "ju", name: "Jungle", totalCards: 64 },
      { id: "fo", name: "Fossil", totalCards: 62 },
      { id: "base4", name: "Base Set 2", totalCards: 130 },
      { id: "tr", name: "Team Rocket", totalCards: 83 },
    ]
  }
];

/** Default sample cards collection (empty array, populated dynamically via unboxing or sync) */
export const SAMPLE_CARDS: (Card | null)[] = [];

/** Default system binders initialized for new users */
export const SAMPLE_BINDERS: Binder[] = [
  { id: "my-collection", name: "My Collection (Opened)", count: 0, value: 0, isCustom: false },
];
