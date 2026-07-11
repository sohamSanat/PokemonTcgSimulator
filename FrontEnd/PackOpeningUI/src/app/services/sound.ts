// Web Audio API Sound Engine & Public Sound Manager for TCGdex Pack Opening Simulator
// Provides ultra-low latency, tactile procedural sound effects with realistic card mechanics.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 0.32;

  constructor() {
    // Restore settings from localStorage if available
    try {
      const savedEnabled = localStorage.getItem('tcg_sound_enabled');
      if (savedEnabled !== null) {
        this.enabled = savedEnabled === 'true';
      }
      const savedVolume = localStorage.getItem('tcg_sound_volume');
      if (savedVolume !== null) {
        const parsed = parseFloat(savedVolume);
        // Ensure volume isn't overly loud
        this.volume = Math.min(0.35, parsed);
      }
    } catch {
      // Ignore storage errors
    }
  }

  private keepAliveOsc: OscillatorNode | null = null;

  private startKeepAlive() {
    if (!this.ctx || this.keepAliveOsc) return;
    try {
      this.keepAliveOsc = this.ctx.createOscillator();
      const silentGain = this.ctx.createGain();
      silentGain.gain.value = 0; // Completely silent
      this.keepAliveOsc.connect(silentGain);
      silentGain.connect(this.ctx.destination);
      this.keepAliveOsc.start();
    } catch {}
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.startKeepAlive();
      }
    }
    if (this.ctx && (this.ctx.state === 'suspended' || this.ctx.state === 'closed')) {
      this.ctx.resume().catch(() => {});
      this.startKeepAlive();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try {
      localStorage.setItem('tcg_sound_enabled', String(enabled));
    } catch {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.02);
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('tcg_sound_volume', String(this.volume));
    } catch {}
    if (this.masterGain && this.ctx && this.enabled) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // Generate white noise buffer for realistic paper/foil rustling & sliding
  private createNoiseBuffer(duration: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Card Slide / Swish sound when moving stack, hovering, or drawing cards
   */
  public playCardSlide(isSubtle = false) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = isSubtle ? 0.08 : 0.14;
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Pitch variation for natural card handling feeling
    noise.playbackRate.value = 0.88 + Math.random() * 0.25;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isSubtle ? 800 : 600, now);
    filter.frequency.exponentialRampToValueAtTime(isSubtle ? 1600 : 2200, now + duration);
    filter.Q.value = 2.5;

    const gain = this.ctx.createGain();
    const peakGain = isSubtle ? 0.12 : 0.28;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + duration * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * Card Flip sound when flipping over face-down card
   */
  public playCardFlip(rarity?: string) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    
    // 1. Snappy paper flick (low-thud + swish)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);

    // 2. Air swish
    const duration = 0.16;
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.playbackRate.value = 0.95 + Math.random() * 0.15;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(2800, now + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(600, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + duration);
    }

    // 3. Check for rare / holographic celebration chime
    const isRare = rarity && (
      rarity.includes('Double Rare') || 
      rarity.includes('ex') || 
      rarity.includes('Secret') || 
      rarity.includes('Hyper') || 
      rarity.includes('Illustration') || 
      rarity.includes('Special') || 
      rarity.includes('Ultra')
    );

    if (isRare) {
      setTimeout(() => this.playRareFanfare(), 60);
    }
  }

  /**
   * Shimmering magical chime for Rare/Holo/EX card reveal
   */
  public playRareFanfare() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C major arpeggio
    notes.forEach((freq, index) => {
      if (!this.ctx || !this.masterGain) return;
      const startTime = now + index * 0.045;
      const osc = this.ctx.createOscillator();
      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.55);
    });

    // Shimmering high bell
    const bell = this.ctx.createOscillator();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(2793.83, now + 0.2); // F7
    const bellGain = this.ctx.createGain();
    bellGain.gain.setValueAtTime(0.01, now + 0.2);
    bellGain.gain.linearRampToValueAtTime(0.12, now + 0.25);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    bell.connect(bellGain);
    bellGain.connect(this.masterGain);
    bell.start(now + 0.2);
    bell.stop(now + 1.1);
  }

  /**
   * Card Collect sound (coin / gem chime)
   */
  public playCardCollect(value = 1) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    
    // Snappy physical click
    const clickOsc = this.ctx.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(800, now);
    clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.02);
    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.2, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.02);

    // Gem chime (higher pitch if valuable card!)
    const baseFreq = value >= 10 ? 1174.66 : (value >= 3 ? 987.77 : 880); // D6, B5, A5
    const secondFreq = value >= 10 ? 1567.98 : (value >= 3 ? 1318.51 : 1174.66); // G6, E6, D6

    [baseFreq, secondFreq].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const startTime = now + idx * 0.065;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(0.22, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  /**
   * Pack Opening / Foil Tear sound
   */
  public playPackOpen() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // 1. Deep satisfying thud
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(40, now + 0.35);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.35);

    // 2. Crisp foil tear rustle
    const duration = 0.28;
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(800, now + duration);
      filter.Q.value = 1.8;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + duration * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + duration);
    }
  }

  /**
   * Foil Wrapper Tearing sound (prolonged rip + pop + opening whoosh)
   */
  public playFoilTear() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // 1. Initial sharp foil snick / start of cut
    const snick = this.ctx.createOscillator();
    snick.type = 'sawtooth';
    snick.frequency.setValueAtTime(1200, now);
    snick.frequency.exponentialRampToValueAtTime(300, now + 0.05);
    const snickGain = this.ctx.createGain();
    snickGain.gain.setValueAtTime(0.25, now);
    snickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    snick.connect(snickGain);
    snickGain.connect(this.masterGain);
    snick.start(now);
    snick.stop(now + 0.05);

    // 2. Prolonged tearing rustle sweeping across
    const duration = 0.45;
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.playbackRate.value = 1.05;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.linearRampToValueAtTime(1500, now + duration * 0.5);
      filter.frequency.linearRampToValueAtTime(2600, now + duration * 0.8);
      filter.frequency.exponentialRampToValueAtTime(600, now + duration);
      filter.Q.value = 3.5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.42, now + 0.04);
      gain.gain.setValueAtTime(0.38, now + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + duration);
    }

    // 3. Low resonant whoosh as pack opens up
    const whoosh = this.ctx.createOscillator();
    whoosh.type = 'sine';
    whoosh.frequency.setValueAtTime(180, now + 0.1);
    whoosh.frequency.exponentialRampToValueAtTime(45, now + 0.5);
    const whooshGain = this.ctx.createGain();
    whooshGain.gain.setValueAtTime(0.01, now + 0.1);
    whooshGain.gain.linearRampToValueAtTime(0.35, now + 0.2);
    whoosh.connect(whooshGain);
    whooshGain.connect(this.masterGain);
    whoosh.start(now + 0.1);
    whoosh.stop(now + 0.5);
  }

  /**
   * Micro foil tearing / scratching sound during interactive hover tearing
   */
  public playFoilScratch(progress: number = 50) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const freq = 600 + (progress / 100) * 1400;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.04);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Modern UI button click
   */
  public playButtonClick() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.025);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.025);
  }

  /**
   * Series / Tab switch tick
   */
  public playTabSwitch() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.018);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.018);
  }

  /**
   * Modal Open swoosh
   */
  public playModalOpen() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = 0.18;
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * Modal Close swoosh
   */
  public playModalClose() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = 0.16;
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * Pitch-escalating reveal pop for "Reveal All Cards"
   */
  public playRevealStep(index: number, rarity?: string) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const baseFreq = 350 * Math.pow(1.08, index);
    
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq * 1.3, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);

    this.playCardSlide(true);

    const isRare = rarity && (
      rarity.includes('Double Rare') || 
      rarity.includes('ex') || 
      rarity.includes('Secret') || 
      rarity.includes('Hyper') || 
      rarity.includes('Illustration')
    );

    if (isRare) {
      setTimeout(() => this.playRareFanfare(), 40);
    }
  }

  /**
   * Celebratory fanfare when all cards in a pack are revealed!
   */
  public playPackComplete() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Triumphant chord
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now + idx * 0.03);
      gain.gain.linearRampToValueAtTime(0.16, now + idx * 0.03 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.03);
      osc.stop(now + 0.8);
    });
  }

  /**
   * Laser scan sound for PSA Centering & Surface analysis
   */
  public playLaserScan() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1600, now + 0.25);
    osc.frequency.linearRampToValueAtTime(600, now + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  /**
   * Ultrasonic encapsulation sound when slab is being sealed
   */
  public playUltrasonicSeal() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Grade reveal sound effect
   */
  public playGradeReveal(grade: number = 10) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    if (grade === 10) {
      // Gem Mint 10 Fanfare!
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.9);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.9);
      });
    } else {
      // Standard grade reveal
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(660, now + 0.2);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  }

  /**
   * Air blower puff sound when removing lint/dust during surface prep
   */
  public playAirBlower() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const duration = 0.18;
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(3600, now + duration * 0.3);
    filter.frequency.exponentialRampToValueAtTime(1000, now + duration);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + duration * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * Microfiber cloth wipe sound
   */
  public playClothWipe() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const duration = 0.15;
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(400, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * UV Blacklight scan beep
   */
  public playUVScan() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Microscope/Loupe zoom click
   */
  public playLoupeZoom() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Ultrasonic weld pulsing wave when holding down seal button
   */
  public playUltrasonicWeldPulse() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }
}

export const sound = new SoundEngine();
