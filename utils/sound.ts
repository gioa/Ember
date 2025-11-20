
export class SoundGenerator {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Defer initialization until user interaction
  }

  init() {
    if (this.isInitialized) return;
    
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0; // Start muted
    
    this.createFireSound();
    this.createWindSound();
    
    this.isInitialized = true;
  }

  private createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private createFireSound() {
    if (!this.ctx || !this.masterGain) return;

    // 1. Low Rumble (Brownian-ish noise via LowPass)
    const rumbleNoise = this.ctx.createBufferSource();
    rumbleNoise.buffer = this.createNoiseBuffer();
    rumbleNoise.loop = true;
    
    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 150; // Deep rumble
    
    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.value = 0.4;

    rumbleNoise.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);
    rumbleNoise.start();

    // 2. Crackle (Random pops)
    // Using a script processor or just modulated noise is complex, 
    // let's use high-passed noise with random gain modulation
    const crackleNoise = this.ctx.createBufferSource();
    crackleNoise.buffer = this.createNoiseBuffer();
    crackleNoise.loop = true;

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 1000;

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.value = 0.05; // Quiet

    // Modulate gain to create flickering sound
    // We simulate this by connecting an oscillator to the gain? 
    // No, standard WebAudio doesn't allow AudioNode -> Param nicely without more setup.
    // Simple approach: Just steady hiss for "burning" texture.
    
    crackleNoise.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.masterGain);
    crackleNoise.start();
  }

  private createWindSound() {
    if (!this.ctx || !this.masterGain) return;

    const windNoise = this.ctx.createBufferSource();
    windNoise.buffer = this.createNoiseBuffer();
    windNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400;
    
    // Modulate filter frequency for "howling" effect
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Slow wind swell
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200; // Modulate frequency by +/- 200Hz

    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    lfo.start();

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.15; // Subtle background

    windNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    windNoise.start();
  }

  toggle(shouldPlay: boolean) {
    if (!this.isInitialized) this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    if (shouldPlay) {
      // Fade in
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.5, now + 1.0);
      this.isPlaying = true;
    } else {
      // Fade out
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
      this.isPlaying = false;
    }
  }
}

export const soundManager = new SoundGenerator();
