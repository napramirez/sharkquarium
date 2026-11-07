import { is8Bit } from './retro.js';

export class AudioBus {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = true;
    this.sfxEnabled = true;
    this.volume = 1;
    this.baseGain = 0.9;
    this.convolver = null;
    this.reverbWet = null;
    this.filter = null;
    this.crusher = null;
    this.crushCurve = null;
    this.pulseCache = null;
  }

  pulseWave(duty = 0.5) {
    if (this.pulseCache) return this.pulseCache;
    if (!this.context || typeof this.context.createPeriodicWave !== 'function') return null;
    const harmonics = 24;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    for (let n = 1; n < harmonics; n += 1) {
      imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    }
    this.pulseCache = this.context.createPeriodicWave(real, imag, { disableNormalization: false });
    return this.pulseCache;
  }

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.master) this.master.gain.value = this.volume * this.baseGain;
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = Boolean(enabled);
  }

  unlock() {
    if (this.context || !this.enabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      this.enabled = false;
      return;
    }
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = this.volume * this.baseGain;
    this.filter = this.context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.Q.value = 0.6;
    this.crusher = this.context.createWaveShaper();
    this.master.connect(this.filter);
    this.filter.connect(this.crusher);
    this.crusher.connect(this.context.destination);
    this.applyRetro();
    if (this.context.state === 'suspended') this.context.resume();
  }

  bitcrushCurve() {
    if (this.crushCurve) return this.crushCurve;
    const size = 1024;
    const curve = new Float32Array(size);
    for (let i = 0; i < size; i += 1) {
      const x = (i / (size - 1)) * 2 - 1;
      curve[i] = Math.round(x * 24) / 24;
    }
    this.crushCurve = curve;
    return curve;
  }

  applyRetro() {
    const on = is8Bit();
    if (this.filter) this.filter.frequency.value = on ? 7000 : 22000;
    if (this.crusher) this.crusher.curve = on ? this.bitcrushCurve() : null;
  }

  panFor(worldX, centerX, width) {
    if (!width) return 0;
    return Math.max(-1, Math.min(1, ((worldX - centerX) / width) * 2));
  }

  ensureReverb() {
    if (this.convolver || !this.context) return;
    const context = this.context;
    this.convolver = context.createConvolver();
    this.convolver.buffer = this.impulseBuffer();
    this.reverbWet = context.createGain();
    this.reverbWet.gain.value = 0.6;
    this.convolver.connect(this.reverbWet);
    this.reverbWet.connect(this.master);
  }

  impulseBuffer() {
    if (this.impulseCache) return this.impulseCache;
    const context = this.context;
    const length = Math.max(1, Math.floor(context.sampleRate * 1.6));
    const buffer = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const t = i / length;
        data[i] = (Math.random() * 2 - 1) * (1 - t) ** 2.6;
      }
    }
    this.impulseCache = buffer;
    return buffer;
  }

  connectVoice(node, pan = 0, reverb = 0) {
    const context = this.context;
    let out = node;
    if (pan && typeof context.createStereoPanner === 'function') {
      const panner = context.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      node.connect(panner);
      out = panner;
    }
    out.connect(this.master);
    if (reverb > 0) {
      this.ensureReverb();
      const send = context.createGain();
      send.gain.value = Math.max(0, Math.min(1, reverb));
      out.connect(send);
      send.connect(this.convolver);
    }
  }

  tone(options = {}) {
    if (!this.enabled || !this.sfxEnabled) return;
    this.unlock();
    if (!this.context) return;
    const {
      freq = 440,
      endFreq = null,
      type = 'sine',
      duration = 0.15,
      volume = 0.5,
      delay = 0,
      pan = 0,
      reverb = 0,
    } = options;
    const waveType = is8Bit() ? 'square' : type;
    const start = this.context.currentTime + delay;
    const stop = start + duration;
    const retro = is8Bit();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const pulse = retro ? this.pulseWave(0.25) : null;
    if (pulse) oscillator.setPeriodicWave(pulse);
    else oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(freq, start);
    if (endFreq !== null) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), stop);
    }
    if (retro) {
      const level = volume * 0.85;
      const attack = Math.min(0.008, duration * 0.4);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(level, start + attack);
      gain.gain.linearRampToValueAtTime(level * 0.75, start + Math.min(duration * 0.7, attack + 0.08));
      gain.gain.linearRampToValueAtTime(0.0001, stop);
    } else {
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + duration * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, stop);
    }
    oscillator.connect(gain);
    this.connectVoice(gain, pan, reverb);
    oscillator.start(start);
    oscillator.stop(stop + 0.02);
  }

  noise(options = {}) {
    if (!this.enabled || !this.sfxEnabled) return;
    this.unlock();
    if (!this.context) return;
    const {
      duration = 0.4,
      volume = 0.25,
      type = 'lowpass',
      filterFreq = 900,
      filterEnd = null,
      q = 1,
      delay = 0,
      pan = 0,
      reverb = 0,
    } = options;
    const start = this.context.currentTime + delay;
    const stop = start + duration;
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer();
    source.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(Math.max(20, filterFreq), start);
    if (filterEnd !== null) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, filterEnd), stop);
    }
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + duration * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, stop);
    source.connect(filter);
    filter.connect(gain);
    this.connectVoice(gain, pan, reverb);
    source.start(start);
    source.stop(stop + 0.02);
  }

  noiseBuffer() {
    if (this.noiseCache) return this.noiseCache;
    const length = Math.max(1, Math.floor(this.context.sampleRate * 1.2));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noiseCache = buffer;
    return buffer;
  }
}
