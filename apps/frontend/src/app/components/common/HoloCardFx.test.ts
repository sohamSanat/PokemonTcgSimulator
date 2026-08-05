import { describe, it, expect } from 'vitest';
import { HoloCardFx } from './HoloCardFx';

describe('HoloCardFx Component Unit Tests', () => {
  it('should export HoloCardFx React component', () => {
    expect(HoloCardFx).toBeDefined();
    expect(typeof HoloCardFx).toBe('function');
  });
});
