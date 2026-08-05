import { describe, it, expect } from 'vitest';
import { sound } from './sound';

describe('Sound Engine Unit Tests', () => {
  it('should get and set volume within 0.0 to 1.0 bounds', () => {
    sound.setVolume(0.8);
    expect(sound.getVolume()).toBe(0.8);

    sound.setVolume(1.5); // should clamp to 1.0
    expect(sound.getVolume()).toBe(1.0);

    sound.setVolume(-0.5); // should clamp to 0.0
    expect(sound.getVolume()).toBe(0.0);
  });

  it('should toggle mute state cleanly', () => {
    sound.setEnabled(true);
    expect(sound.isEnabled()).toBe(true);

    const isMuted = sound.toggleMute();
    expect(isMuted).toBe(true);
    expect(sound.isEnabled()).toBe(false);

    const isMutedAfterSecondToggle = sound.toggleMute();
    expect(isMutedAfterSecondToggle).toBe(false);
    expect(sound.isEnabled()).toBe(true);
  });
});
