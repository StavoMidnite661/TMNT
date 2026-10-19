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
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isMuted;
  }

  // ------------------------------------------------------------------
  // Procedural chiptune loop — a dark A-minor groove synthesized live.
  // No audio files, everything is oscillators + noise.
  // ------------------------------------------------------------------

  private static readonly MUSIC_BPM = 96;

  /** 4 bars x 16 sixteenth-steps. 0 = rest. */
  private static readonly BASS_LINE = [
    55, 55, 55, 55, 55, 55, 55, 55, 65.41, 65.41, 65.41, 65.41, 65.41, 65.41, 65.41, 65.41,
    49, 49, 49, 49, 49, 49, 49, 49, 58.27, 58.27, 58.27, 58.27, 58.27, 58.27, 58.27, 58.27,
    55, 55, 55, 55, 55, 55, 55, 55, 65.41, 65.41, 65.41, 65.41, 65.41, 65.41, 65.41, 65.41,
    73.42, 73.42, 73.42, 73.42, 73.42, 73.42, 73.42, 73.42, 82.41, 82.41, 82.41, 82.41, 98, 98, 82.41, 82.41,
  ];

  /** Sparse lead melody — mostly bar 4, very 16-bit. */
  private static readonly LEAD_LINE = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 220, 0, 0, 0, 0, 0, 261.63, 0, 0, 0, 0, 0, 0, 0,
    220, 0, 261.63, 0, 329.63, 0, 261.63, 0, 220, 0, 196, 0, 164.81, 0, 0, 0,
  ];

  private static musicGain: GainNode | null = null;
  private static musicTimer: ReturnType<typeof setInterval> | null = null;
  private static musicStep = 0;
  private static nextStepTime = 0;
  private static noiseBuffer: AudioBuffer | null = null;

  public static startMusic() {
    if (this.isMuted) return;
    const ctx = this.init();
    if (!ctx) return;
    if (this.musicTimer) return;

    if (!this.musicGain) {
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0.32;
      this.musicGain.connect(ctx.destination);
    }

    this.musicStep = 0;
    this.nextStepTime = ctx.currentTime + 0.08;
    this.musicTimer = setInterval(() => this.pumpMusic(ctx), 30);
  }

  public static stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private static pumpMusic(ctx: AudioContext) {
    if (this.isMuted) return;
    const stepDur = 60 / this.MUSIC_BPM / 4; // 16th notes
    // Lookahead scheduler: keep ~180ms of notes queued ahead of the clock
    while (this.nextStepTime < ctx.currentTime + 0.18) {
      this.scheduleStep(this.musicStep, this.nextStepTime, stepDur);
      this.nextStepTime += stepDur;
      this.musicStep = (this.musicStep + 1) % 64;
    }
  }

  private static scheduleStep(step: number, t: number, stepDur: number) {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;

    // Kick on every quarter note
    if (step % 4 === 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.15);
    }

    // Hat on the off-beats
    if (step % 4 === 2) {
      const src = ctx.createBufferSource();
      src.buffer = this.getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      src.start(t);
      src.stop(t + 0.05);
    }

    // Bass pulse
    const bassFreq = this.BASS_LINE[step];
    if (bassFreq > 0) {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassFreq, t);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + stepDur * 0.9);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + stepDur);
    }

    // Sparse lead
    const leadFreq = this.LEAD_LINE[step];
    if (leadFreq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(leadFreq, t);
      gain.gain.setValueAtTime(0.045, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.8);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + stepDur * 2);
    }
  }

  private static getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const len = Math.floor(ctx.sampleRate * 0.5);
      this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuffer;
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

  public static playPizza() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Double chomp: two quick descending blips
    [660, 990].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + i * 0.08 + 0.07);

      gain.gain.setValueAtTime(0.18, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.1);
    });
  }
}
