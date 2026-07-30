/**
 * @file utils.ts
 * @description Helper utility functions for price history generation and rarity label formatting.
 */

import type { PricePoint } from "./types";

/**
 * Generates a synthetic 30-day price history trajectory given a base price and market trend factor.
 * 
 * @param base - The baseline dollar price of the card.
 * @param trend - A numeric trend factor (positive for upward trend, negative for downward trend).
 * @returns Array of 30 PricePoint objects representing daily price fluctuations.
 */
export function genPriceHistory(base: number, trend: number): PricePoint[] {
  const points: PricePoint[] = [];
  let price = base * (1 - trend * 0.3);
  for (let i = 0; i < 30; i++) {
    price += (Math.random() - 0.42) * base * 0.06 + trend * base * 0.01;
    points.push({ day: i + 1, price: Math.max(0.05, +price.toFixed(2)) });
  }
  return points;
}

/**
 * Normalizes and formats rarity string names into standard display abbreviations or clean labels.
 * 
 * @param rarity - The raw rarity string (e.g. "Special Illustration Rare", "Secret Rare").
 * @returns Formatted clean string (e.g., "SIR", "SR", "UR", "IR", "Rare").
 */
export function formatRarityTag(rarity: string): string {
  if (!rarity) return "Common";
  const r = rarity.toLowerCase();
  if (r.includes("special illustration") || r === "sir" || r === "sar") return "SIR";
  if (r.includes("secret rare") || r === "secret" || r === "sr") return "SR";
  if (r.includes("ultra rare") || r === "ultra" || r === "ur") return "UR";
  if (r.includes("illustration rare") || r === "ir" || r === "ar") return "IR";
  if (r.includes("double rare")) return "Double Rare";
  if (r.includes("hyper rare")) return "Hyper Rare";
  if (r.includes("promo")) return "Promo";
  if (r.includes("shiny vault")) return "Shiny Vault";
  if (r.includes("rare")) return "Rare";
  if (r.includes("uncommon")) return "Uncommon";
  if (r.includes("common")) return "Common";
  return rarity;
}
