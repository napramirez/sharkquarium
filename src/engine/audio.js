export class AudioBus {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = true;
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
    this.master.gain.value = 0.35;
    this.master.connect(this.context.destination);
    if (this.context.state === 'suspended') this.context.resume();
  }

  tone(options = {}) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context) return;
    const {
      freq = 440,
      endFreq = null,
      type = 'sine',
      duration = 0.15,
      volume = 0.5,
      delay = 0,
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
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(stop + 0.02);
  }
}
