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
    this.master.connect(this.context.destination);
    if (this.context.state === 'suspended') this.context.resume();
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
    const start = this.context.currentTime + delay;
    const stop = start + duration;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, start);
    if (endFreq !== null) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), stop);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + duration * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, stop);
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
