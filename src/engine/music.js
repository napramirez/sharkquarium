const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export class MusicPlayer {
  constructor(audio) {
    this.audio = audio;
    this.track = null;
    this.step = 0;
    this.timer = 0;
  }

  play(track) {
    if (this.track === track) return;
    this.track = track;
    this.step = 0;
    this.timer = 0;
  }

  stop() {
    this.track = null;
  }

  update(dt) {
    if (!this.track) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer += this.track.beat;
    if (this.timer <= 0) this.timer = this.track.beat;
    const index = this.step % this.track.bass.length;
    this.step += 1;
    const { bass, lead } = this.track;
    if (bass[index] > 0) {
      this.audio.tone({
        freq: midiToFreq(bass[index]),
        type: 'triangle',
        duration: this.track.beat * 0.85,
        volume: 0.1,
      });
    }
    if (lead[index] > 0) {
      this.audio.tone({
        freq: midiToFreq(lead[index]),
        type: 'square',
        duration: this.track.beat * 0.6,
        volume: 0.05,
      });
    }
    if (this.track.hat && index % 2 === 0) {
      this.audio.tone({ freq: 6200, type: 'square', duration: 0.02, volume: 0.012 });
    }
  }
}
