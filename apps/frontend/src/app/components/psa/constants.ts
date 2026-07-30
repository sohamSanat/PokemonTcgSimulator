/**
 * @file constants.ts
 * @description Static dataset definitions for the PSA Grading Lab module.
 * Contains sample chase cards for demonstration and reference benchmark graded cards.
 */

import type { Card } from '../binder/types';

export const SAMPLE_CHASE_CARDS = [
  {
    name: 'Charizard ex — Demo Guaranteed PSA 10',
    setName: 'Obsidian Flames • Gem Mint 10 Test',
    setNumber: '223/197',
    rarity: 'Special Illustration Rare',
    type: 'Fire',
    value: 85.50,
    targetGrade: 10,
    badgeColor: 'from-amber-400 via-amber-300 to-amber-500 text-black border-white shadow-[0_0_12px_rgba(245,158,11,0.8)]',
    imageUrl: 'https://images.pokemontcg.io/sv3/223_hires.png'
  },
  {
    name: 'Umbreon VMAX — Demo Guaranteed PSA 9',
    setName: 'Evolving Skies • Mint 9 Test',
    setNumber: '215/203',
    rarity: 'Secret Rare',
    type: 'Darkness',
    value: 650.00,
    targetGrade: 9,
    badgeColor: 'from-sky-400 via-blue-500 to-indigo-600 text-white border-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.6)]',
    imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png'
  },
  {
    name: 'Pikachu ex — Demo Guaranteed PSA 8',
    setName: 'Surging Sparks • Near Mint-Mint 8 Test',
    setNumber: '238/191',
    rarity: 'Special Illustration Rare',
    type: 'Lightning',
    value: 180.00,
    targetGrade: 8,
    badgeColor: 'from-purple-500 via-purple-600 to-indigo-700 text-white border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.6)]',
    imageUrl: 'https://images.pokemontcg.io/sv8/238_hires.png'
  },
  {
    name: 'Giratina V — Demo Guaranteed PSA 7',
    setName: 'Lost Origin • Near Mint 7 Test',
    setNumber: '186/196',
    rarity: 'Special Illustration Rare',
    type: 'Dragon',
    value: 340.00,
    targetGrade: 7,
    badgeColor: 'from-rose-600 via-red-600 to-red-700 text-white border-red-300 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    imageUrl: 'https://images.pokemontcg.io/swsh11/186_hires.png'
  }
];

export const REFERENCE_VAULT_CARDS: Card[] = [
  {
    id: 'ref-psa-10',
    name: 'Charizard ex — Special Illustration Rare',
    setName: 'Obsidian Flames (Official PSA 10 Benchmark)',
    setNumber: '223/197',
    rarity: 'Special Illustration Rare',
    type: 'Fire',
    currentPrice: 273.60,
    priceChange: 12.4,
    priceHistory: [],
    holofoil: true,
    imageUrl: 'https://images.pokemontcg.io/sv3/223_hires.png',
    favorite: false,
    isSlabbed: true,
    slabGrade: 'PSA 10 Gem Mint',
    psaDetails: {
      gradeNum: 10,
      certNumber: '84920193',
      gradedDate: 'Official Benchmark',
      subgrades: { centering: 10, surface: 10, corners: 10, edges: 10 },
      originalValue: 85.50,
      multiplier: 3.2
    }
  },
  {
    id: 'ref-psa-9',
    name: 'Umbreon VMAX — Alternate Art Secret',
    setName: 'Evolving Skies (Official PSA 9 Benchmark)',
    setNumber: '215/203',
    rarity: 'Secret Rare',
    type: 'Darkness',
    currentPrice: 1170.00,
    priceChange: 5.8,
    priceHistory: [],
    holofoil: true,
    imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    favorite: false,
    isSlabbed: true,
    slabGrade: 'PSA 9 Mint',
    psaDetails: {
      gradeNum: 9,
      certNumber: '84920194',
      gradedDate: 'Official Benchmark',
      subgrades: { centering: 9.5, surface: 9.0, corners: 9.5, edges: 9.0 },
      originalValue: 650.00,
      multiplier: 1.8
    }
  },
  {
    id: 'ref-psa-8',
    name: 'Pikachu ex — Special Illustration Rare',
    setName: 'Surging Sparks (Official PSA 8 Benchmark)',
    setNumber: '238/191',
    rarity: 'Special Illustration Rare',
    type: 'Lightning',
    currentPrice: 225.00,
    priceChange: 1.2,
    priceHistory: [],
    holofoil: true,
    imageUrl: 'https://images.pokemontcg.io/sv8/238_hires.png',
    favorite: false,
    isSlabbed: true,
    slabGrade: 'PSA 8 Near Mint-Mint',
    psaDetails: {
      gradeNum: 8,
      certNumber: '84920195',
      gradedDate: 'Official Benchmark',
      subgrades: { centering: 8.5, surface: 8.0, corners: 8.5, edges: 8.5 },
      originalValue: 180.00,
      multiplier: 1.25
    }
  },
  {
    id: 'ref-psa-7',
    name: 'Giratina V — Alternate Full Art',
    setName: 'Lost Origin (Official PSA 7 Benchmark)',
    setNumber: '186/196',
    rarity: 'Special Illustration Rare',
    type: 'Dragon',
    currentPrice: 357.00,
    priceChange: 0.8,
    priceHistory: [],
    holofoil: true,
    imageUrl: 'https://images.pokemontcg.io/swsh11/186_hires.png',
    favorite: false,
    isSlabbed: true,
    slabGrade: 'PSA 7 Near Mint',
    psaDetails: {
      gradeNum: 7,
      certNumber: '84920196',
      gradedDate: 'Official Benchmark',
      subgrades: { centering: 7.5, surface: 7.0, corners: 7.5, edges: 7.5 },
      originalValue: 340.00,
      multiplier: 1.05
    }
  }
];
