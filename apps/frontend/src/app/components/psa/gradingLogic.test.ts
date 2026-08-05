import { describe, it, expect } from 'vitest';
import { calculateGrades } from './gradingLogic';
import type { Card } from '../binder/types';

describe('PSA Grading Logic Unit Tests', () => {
  const sampleCard = {
    id: 'test-card-1',
    name: 'Charizard ex',
    rarity: 'Special Illustration Rare',
    imageUrl: 'https://example.com/card.png',
    setName: '151',
    currentPrice: 120.00
  } as unknown as Card;

  it('should return forced target grade when forcedTargetGrade is provided', () => {
    const res10 = calculateGrades(sampleCard, 10);
    expect(res10.gradeNum).toBe(10);
    expect(res10.multiplier).toBe(3.2);
    expect(res10.centeringScore).toBe(10);

    const res9 = calculateGrades(sampleCard, 9);
    expect(res9.gradeNum).toBe(9);
    expect(res9.multiplier).toBe(1.8);

    const res8 = calculateGrades(sampleCard, 8);
    expect(res8.gradeNum).toBe(8);
    expect(res8.multiplier).toBe(1.25);
  });

  it('should generate valid grade numbers between 5 and 10 for raw cards', () => {
    for (let i = 0; i < 50; i++) {
      const res = calculateGrades(sampleCard);
      expect(res.gradeNum).toBeGreaterThanOrEqual(5);
      expect(res.gradeNum).toBeLessThanOrEqual(10);
      expect(res.multiplier).toBeGreaterThan(0);
    }
  });

  it('should boost odds for restored cards', () => {
    const restoredCard = { ...sampleCard, isRestored: true } as unknown as Card;
    for (let i = 0; i < 50; i++) {
      const res = calculateGrades(restoredCard);
      expect(res.gradeNum).toBeGreaterThanOrEqual(7);
      expect(res.gradeNum).toBeLessThanOrEqual(10);
    }
  });
});
