import { resolveSeasonTrack, isSeasonalTrack } from './season.js';
import { is8Bit } from './retro.js';

const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export class MusicPlayer {
  constructor(audio) {
    this.audio = audio;
    this.track = null;
    this.step = 0;
    this.timer = 0;
    this.hold = false;
    this.paused = false;
  }

  play(track) {
    this.paused = false;
    if (!isSeasonalTrack(track)) this.source = track;
    const resolved = resolveSeasonTrack(track);
    if (this.track === resolved) return;
    this.track = resolved;
    this.step = 0;
    this.timer = 0;
  }

  resumeSource() {
    if (!this.source) return;
    this.paused = false;
    this.track = resolveSeasonTrack(this.source);
    this.step = 0;
    this.timer = 0;
  }

  refresh() {
    if (!this.source || this.track == null) return;
    const resolved = resolveSeasonTrack(this.source);
    if (resolved === this.track) return;
    this.track = resolved;
    this.step = 0;
    this.timer = 0;
  }

  stop() {
    this.track = null;
    this.source = null;
    this.hold = false;
    this.paused = false;
  }

  update(dt) {
    if (!this.track || this.paused) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer += this.track.beat;
    if (this.timer <= 0) this.timer = this.track.beat;
    if (this.track.custom) {
      const index = this.step % (this.track.steps || 1);
      this.step += 1;
      for (const note of this.track.byStep[index] ?? []) {
        if (note.kind === 'noise') {
          this.audio.noise({
            duration: note.duration,
            volume: note.volume,
            type: note.type,
            filterFreq: note.filterFreq,
            q: note.q,
          });
        } else {
          this.audio.tone({
            freq: note.freq,
            endFreq: note.endFreq ?? null,
            type: note.type,
            duration: note.duration,
            volume: note.volume,
          });
        }
      }
      return;
    }
    const index = this.step % this.track.bass.length;
    this.step += 1;
    const { bass, lead } = this.track;
    const retro = is8Bit();
    if (bass[index] > 0) {
      this.audio.tone({
        freq: midiToFreq(bass[index]),
        type: 'triangle',
        duration: this.track.beat * (retro ? 0.92 : 0.85),
        volume: retro ? 0.085 : 0.1,
      });
    }
    if (lead[index] > 0) {
      this.audio.tone({
        freq: midiToFreq(lead[index]),
        type: 'square',
        duration: this.track.beat * (retro ? 0.72 : 0.6),
        volume: retro ? 0.04 : 0.05,
      });
    }
    if (this.track.hat && index % 2 === 0) {
      if (retro) {
        this.audio.noise({
          duration: 0.03,
          volume: 0.026,
          type: 'highpass',
          filterFreq: 4200,
        });
      } else {
        this.audio.tone({ freq: 6200, type: 'square', duration: 0.02, volume: 0.012 });
      }
    }
  }
}