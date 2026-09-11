// Pure Web Audio API Synthesizer for "The Most Useless Day"
// Generates dynamic, expressive real-time audio with zero external dependencies.

class AudioEngineClass {
  private ctx: AudioContext | null = null;
  public enabled = true;
  private mosquitoOsc: OscillatorNode | null = null;
  private mosquitoGain: GainNode | null = null;
  private mosquitoMod: OscillatorNode | null = null;
  private boilNoise: AudioBufferSourceNode | null = null;
  private boilGain: GainNode | null = null;
  private lastBrushTime = 0;
  private lastSqueakTime = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Toggle sound
  setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stopMosquitoBuzz();
      this.stopBoilSound();
    }
  }

  // 1. Toothbrush bristle friction scrub
  playBrushScrub(speed = 0.5) {
    if (!this.enabled) return;
    const now = performance.now();
    if (now - this.lastBrushTime < 60) return; // throttle
    this.lastBrushTime = now;

    try {
      const ctx = this.initCtx();
      const bufferSize = ctx.sampleRate * 0.05; // 50ms noise
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000 + speed * 1500, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      const gain = ctx.createGain();
      const vol = Math.min(0.25, Math.max(0.04, speed * 0.3));
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
    } catch {
      // AudioContext unavailable or autoplay blocked
    }
  }

  // 2. Water splash / pour
  playSplash(intensity = 1) {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      const dur = 0.25 * intensity;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + intensity * 600, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + dur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3 * intensity, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // ignore
    }
  }

  // 3. Faucet drip / running water pulse
  playWaterDrop() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const f = 600 + Math.random() * 400;
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f * 1.8, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // ignore
    }
  }

  // 4. Mosquito flying buzz
  startMosquitoBuzz(rate = 1) {
    if (!this.enabled) return;
    if (this.mosquitoOsc) return;

    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450 * rate, ctx.currentTime);

      // Vibrato modulation
      mod.type = 'sine';
      mod.frequency.setValueAtTime(15, ctx.currentTime);
      modGain.gain.setValueAtTime(25, ctx.currentTime);
      mod.connect(osc.frequency);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      mod.start();
      osc.start();

      this.mosquitoOsc = osc;
      this.mosquitoMod = mod;
      this.mosquitoGain = gain;
    } catch {
      // ignore
    }
  }

  updateMosquitoBuzz(proximity: number, speed: number) {
    if (!this.mosquitoOsc || !this.mosquitoGain || !this.ctx) return;
    const baseFreq = 400 + proximity * 300 + speed * 150;
    this.mosquitoOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    const vol = Math.min(0.08, 0.02 + proximity * 0.06);
    this.mosquitoGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
  }

  stopMosquitoBuzz() {
    if (this.mosquitoOsc) {
      try {
        this.mosquitoOsc.stop();
        this.mosquitoMod?.stop();
        this.mosquitoOsc.disconnect();
        this.mosquitoMod?.disconnect();
      } catch {
        // ignore
      }
      this.mosquitoOsc = null;
      this.mosquitoMod = null;
      this.mosquitoGain = null;
    }
  }

  // 5. Mosquito slap - SPLAT!
  playMosquitoSlap() {
    if (!this.enabled) return;
    try {
      this.stopMosquitoBuzz();
      const ctx = this.initCtx();

      // Sharp snap
      const snapBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      const data = snapBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
      }
      const snap = ctx.createBufferSource();
      snap.buffer = snapBuffer;

      // Low squish body
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);

      oscGain.gain.setValueAtTime(0.4, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.5, ctx.currentTime);
      snapGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      snap.connect(snapGain);
      snapGain.connect(ctx.destination);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      snap.start();
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // ignore
    }
  }

  // 6. Dish squeak
  playDishSqueak() {
    if (!this.enabled) return;
    const now = performance.now();
    if (now - this.lastSqueakTime < 120) return;
    this.lastSqueakTime = now;

    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const f = 1600 + Math.random() * 1200;
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f * 0.7, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // ignore
    }
  }

  // 7. Tea Boiling Hiss
  startBoilSound() {
    if (!this.enabled || this.boilNoise) return;
    try {
      const ctx = this.initCtx();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * white) / 1.02;
        last = data[i];
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      this.boilNoise = noise;
      this.boilGain = gain;
    } catch {
      // ignore
    }
  }

  stopBoilSound() {
    if (this.boilNoise) {
      try {
        this.boilNoise.stop();
        this.boilNoise.disconnect();
      } catch {
        // ignore
      }
      this.boilNoise = null;
      this.boilGain = null;
    }
  }

  // 8. Fabric rustle / broom sweep
  playSweepWhoosh(speed = 0.5) {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      const dur = 0.12;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / data.length) * Math.PI);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + speed * 800, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch {
      // ignore
    }
  }

  // 9. Pleasant Ding (Zone cleaned / step finished)
  playDing() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // ignore
    }
  }

  // 10. Major Triad Fanfare (Activity Completed)
  playAchievement() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        const startTime = ctx.currentTime + idx * 0.08;
        const endTime = startTime + 0.4;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch {
      // ignore
    }
  }
}

export const AudioEngine = new AudioEngineClass();
