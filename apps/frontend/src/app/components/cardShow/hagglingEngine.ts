/**
 * hagglingEngine.ts
 * Pure function algorithms for vendor negotiation evaluation, vendor dialogue generation,
 * counter-offer calculations, and specialty trade-in bonuses.
 */

import type { VendorDef } from './vendorData';
import type { Card } from '../binder/types';

export interface HaggleResult {
  status: 'accepted' | 'countered' | 'insulted';
  counterPrice: number;
  dialogue: string;
  patienceCost: number;
  effectiveOfferValue: number;
  hasSpecialtyBonus: boolean;
}

export function calculateSpecialtyBonus(vendor: VendorDef, card: Card): boolean {
  if (!vendor.specialties || vendor.specialties.length === 0) return false;
  const cName = (card.name || '').toLowerCase();
  const cSet = (card.setName || '').toLowerCase();
  const cRarity = (card.rarity || '').toLowerCase();

  return vendor.specialties.some(spec => {
    const sLow = spec.toLowerCase();
    return cName.includes(sLow) || cSet.includes(sLow) || cRarity.includes(sLow) ||
      (sLow.includes('japanese') && (cName.includes('ja') || cSet.includes('ja'))) ||
      (sLow.includes('vintage') && (cSet.includes('base') || cSet.includes('neo') || cSet.includes('gym') || cSet.includes('jungle') || cSet.includes('fossil'))) ||
      (sLow.includes('modern') && (cName.includes('alt') || cName.includes('vmax') || cName.includes('ex') || cName.includes('sir') || cName.includes('sar')));
  });
}

export function evaluateVendorHaggle(
  vendor: VendorDef,
  askingPrice: number,
  offeredCash: number,
  offeredCards: Card[]
): HaggleResult {
  // 1. Calculate trade-in value with +15% specialty bonus
  let totalCardValue = 0;
  let hasSpecialtyBonus = false;

  offeredCards.forEach(c => {
    const baseVal = c.currentPrice || 0;
    const isSpecial = calculateSpecialtyBonus(vendor, c);
    if (isSpecial) {
      hasSpecialtyBonus = true;
      totalCardValue += baseVal * 1.15; // 15% bonus
    } else {
      totalCardValue += baseVal;
    }
  });

  const effectiveOfferValue = Math.round((offeredCash + totalCardValue) * 100) / 100;
  const discountRatio = askingPrice > 0 ? effectiveOfferValue / askingPrice : 1;

  // 2. Vendor threshold calculations based on vendor.discountScore (e.g. 68 to 95)
  // Higher discountScore means vendor accepts larger discounts.
  const score = vendor.discountScore || 75;
  const minAcceptRatio = Math.max(0.70, 1 - (score / 350)); // e.g. 75 -> 0.785, 95 -> 0.73
  const instantAcceptRatio = Math.max(0.90, 1 - (score / 750)); // e.g. 75 -> 0.90

  // 3. Evaluation logic
  if (discountRatio >= instantAcceptRatio) {
    const acceptQuotes = [
      `Deal! You've got yourself a legendary addition to your collection.`,
      `I can accept that offer. Enjoy the card!`,
      `Sounds fair to me! Let's shake on it.`
    ];
    return {
      status: 'accepted',
      counterPrice: askingPrice,
      dialogue: acceptQuotes[Math.floor(Math.random() * acceptQuotes.length)],
      patienceCost: 0,
      effectiveOfferValue,
      hasSpecialtyBonus
    };
  }

  if (discountRatio >= minAcceptRatio) {
    // Vendor makes a counter offer halfway between effective offer and asking price
    const counterPrice = Math.round((askingPrice * 0.6 + effectiveOfferValue * 0.4) * 100) / 100;
    const counterQuotes = [
      `That's a bit low, but I'll meet you at $${counterPrice}. What do you say?`,
      `I can't go quite that low. Best I can do is $${counterPrice}.`,
      `How about we split the difference at $${counterPrice}?`
    ];
    return {
      status: 'countered',
      counterPrice,
      dialogue: counterQuotes[Math.floor(Math.random() * counterQuotes.length)],
      patienceCost: 1,
      effectiveOfferValue,
      hasSpecialtyBonus
    };
  }

  // Lowball offer (under vendor's minimum acceptance ratio)
  const insultQuotes = [
    `That's insulting! This is a high-grade grail, not bulk trash.`,
    `No way. That offer is way too low for booth ${vendor.booth}.`,
    `I'd lose money at that price! Try offering something reasonable.`
  ];
  const insultCounter = Math.round((askingPrice * 0.92) * 100) / 100;

  return {
    status: 'insulted',
    counterPrice: insultCounter,
    dialogue: insultQuotes[Math.floor(Math.random() * insultQuotes.length)],
    patienceCost: 1,
    effectiveOfferValue,
    hasSpecialtyBonus
  };
}
