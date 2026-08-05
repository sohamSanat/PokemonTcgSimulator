import { describe, it, expect } from 'vitest';
import { evaluateVendorHaggle, calculateSpecialtyBonus } from './hagglingEngine';
import type { VendorDef } from './vendorData';
import type { Card } from '../binder/types';

describe('Vendor Haggling Engine Unit Tests', () => {
  const sampleVendor: VendorDef = {
    id: 'testvendor',
    name: 'VINTAGEVAULT TCG',
    booth: '5B',
    type: 'vendor',
    category: 'vintage',
    x: 0, y: 0, w: 0, h: 0,
    shape: 'arched',
    color: '#2dd4bf',
    rating: '4.8 / 5',
    activeListings: '3450',
    completedTrans: '12800',
    specialties: ['WOTC Japanese (Kanji)', 'Japanese', 'Neo Destiny'],
    discountScore: 75
  };

  const sampleCard = {
    id: 'c1',
    name: 'Japanese Lugia Holo',
    setName: 'Neo Genesis JA',
    rarity: 'Rare Holo',
    imageUrl: 'img.png',
    currentPrice: 100.00
  } as unknown as Card;

  it('should detect specialty bonus for matching trade-in cards', () => {
    const isSpecial = calculateSpecialtyBonus(sampleVendor, sampleCard);
    expect(isSpecial).toBe(true);
  });

  it('should accept fair offers near asking price', () => {
    const res = evaluateVendorHaggle(sampleVendor, 100, 95, []);
    expect(res.status).toBe('accepted');
    expect(res.patienceCost).toBe(0);
  });

  it('should counter reasonable discount offers', () => {
    const res = evaluateVendorHaggle(sampleVendor, 100, 80, []);
    expect(res.status).toBe('countered');
    expect(res.counterPrice).toBeGreaterThan(80);
    expect(res.counterPrice).toBeLessThan(100);
    expect(res.patienceCost).toBe(1);
  });

  it('should reject and insult extreme lowball offers', () => {
    const res = evaluateVendorHaggle(sampleVendor, 100, 40, []);
    expect(res.status).toBe('insulted');
    expect(res.patienceCost).toBe(1);
    expect(res.dialogue.length).toBeGreaterThan(0);
  });

  it('should apply +15% specialty trade bonus value', () => {
    const res = evaluateVendorHaggle(sampleVendor, 100, 0, [sampleCard]);
    expect(res.hasSpecialtyBonus).toBe(true);
    expect(res.effectiveOfferValue).toBe(115); // 100 * 1.15
  });
});
