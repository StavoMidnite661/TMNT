export default class SoundSynth {
  private static ctx: AudioContext | null = null;
  private static isMuted = false;

  private static init() {
    if (this.isMuted) return null;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public static toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public static playHit(isCritical = false) {
    const ctx = this.init();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (isCritical) {
      // Big impact crunch
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.Q.setValueAtTime(8, now);

      osc.connect(filter);
      filter.connect(gain);
      
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      
      // Layer a high slash sizzle
      this.playSlice();
    } else {
      // Clean fast punch
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      
      osc.connect(gain);
      gain.gain.setValueAtTime(0.40, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    }
    
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public static playSlice() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.15);

    const biquad = ctx.createBiquadFilter();
    biquad.type = 'highpass';
    biquad.frequency.setValueAtTime(1000, now);

    osc.connect(biquad);
    biquad.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public static playDodge() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public static playLaser() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.16);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public static playShuriken() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.linearRampToValueAtTime(2000, now + 0.06);
    osc.frequency.linearRampToValueAtTime(1300, now + 0.14);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  public static playSpecial() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub rumble + soaring frequency sweep
    const osc1 = ctx.createOscillator();
    const osc1Gain = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(70, now);
    osc1.frequency.linearRampToValueAtTime(550, now + 0.6);

    osc1Gain.gain.setValueAtTime(0.12, now);
    osc1Gain.gain.linearRampToValueAtTime(0.24, now + 0.45);
    osc1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc1.connect(osc1Gain);
    osc1Gain.connect(ctx.destination);

    // High energetic sparkle
    const osc2 = ctx.createOscillator();
    const osc2Gain = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3500, now);
    osc2.frequency.exponentialRampToValueAtTime(900, now + 0.45);

    osc2Gain.gain.setValueAtTime(0.14, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc2.connect(osc2Gain);
    osc2Gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.6);
    osc2.start(now);
    osc2.stop(now + 0.45);
  }

  public static playLevelUp() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Dynamic C5 -> E5 -> G5 -> C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.10);

      gain.gain.setValueAtTime(0.15, now + idx * 0.10);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.10 + 0.20);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.10);
      osc.stop(now + idx * 0.10 + 0.20);
    });
  }

  public static playPlayerHurt() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.24);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  public static playEnemyDeath() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.50);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(55, now + 0.50);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.50);

    osc.start(now);
    osc.stop(now + 0.50);
  }
}
