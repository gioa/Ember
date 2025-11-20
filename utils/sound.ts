
export class SoundGenerator {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private fireGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Defer initialization until user interaction
  }

  init() {
    if (this.isInitialized) return;
    
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    this.ctx = new AudioContextClass();
    
    // Master Gain (Controlled by Mute Button)
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 1; // Default to 1, will be modulated by App.tsx mute state immediately
    
    // Fire Gain (Controlled by Burning State)
    this.fireGain = this.ctx.createGain();
    this.fireGain.connect(this.masterGain);
    this.fireGain.gain.value = 0; // Start silent

    this.createFireSound();
    
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
    if (!this.ctx || !this.fireGain) return;

    // 1. Low Rumble (Brownian-ish noise via LowPass)
    const rumbleNoise = this.ctx.createBufferSource();
    rumbleNoise.buffer = this.createNoiseBuffer();
    rumbleNoise.loop = true;
    
    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 150; // Deep rumble
    
    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.value = 0.6;

    rumbleNoise.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    // Connect to fireGain instead of master
    rumbleGain.connect(this.fireGain);
    rumbleNoise.start();

    // 2. Crackle (Highpass noise)
    const crackleNoise = this.ctx.createBufferSource();
    crackleNoise.buffer = this.createNoiseBuffer();
    crackleNoise.loop = true;

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 1000;

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.value = 0.08;

    crackleNoise.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    // Connect to fireGain instead of master
    crackleGain.connect(this.fireGain);
    crackleNoise.start();
  }

  // Removed Wind Sound to ensure "otherwise silence"

  setBurning(isBurning: boolean) {
    if (!this.isInitialized) this.init();
    if (!this.ctx || !this.fireGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    const now = this.ctx.currentTime;
    this.fireGain.gain.cancelScheduledValues(now);
    
    if (isBurning) {
        // Ramp up fire sound quickly
        this.fireGain.gain.setTargetAtTime(1, now, 0.1);
    } else {
        // Ramp down fire sound
        this.fireGain.gain.setTargetAtTime(0, now, 0.5);
    }
  }

  toggle(shouldPlay: boolean) {
    if (!this.isInitialized) this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    if (shouldPlay) {
      // Unmute Master
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(1, now, 0.2);
      this.isPlaying = true;
    } else {
      // Mute Master
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0, now, 0.2);
      this.isPlaying = false;
    }
  }
}

export const soundManager = new SoundGenerator();
