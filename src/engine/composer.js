import { clamp } from './math.js';
import { loadJSON, saveJSON } from './storage.js';
import { TRACK_BUILDER_KEY } from '../config.js';

export const COMPOSER_STEPS = 32;
export const COMPOSER_MIN_STEPS = 8;
export const COMPOSER_MAX_STEPS = 128;

export const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export const INSTRUMENTS = [
  { key: 'DRUMS', sound: 'drum', lines: ['HAT', 'CLAP', 'SNARE', 'KICK'] },
  {
    key: 'BASS',
    sound: 'tone',
    wave: 'triangle',
    volume: 0.17,
    lines: ['C3', 'A2', 'G2', 'E2', 'D2', 'C2'],
    pitches: [48, 45, 43, 40, 38, 36],
  },
  {
    key: 'SYNTH',
    sound: 'tone',
    wave: 'square',
    volume: 0.12,
    lines: ['E5', 'C5', 'A4', 'G4', 'E4', 'D4', 'C4'],
    pitches: [76, 72, 69, 67, 64, 62, 60],
  },
  {
    key: 'PIANO',
    sound: 'tone',
    wave: 'triangle',
    volume: 0.14,
    lines: ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'],
    pitches: [72, 71, 69, 67, 65, 64, 62, 60],
  },
];

export const DRUM_SOUNDS = [
  { kind: 'noise', duration: 0.05, volume: 0.08, type: 'highpass', filterFreq: 6500 },
  { kind: 'noise', duration: 0.11, volume: 0.15, type: 'bandpass', filterFreq: 2100, q: 2 },
  { kind: 'noise', duration: 0.14, volume: 0.17, type: 'highpass', filterFreq: 1400 },
  { kind: 'tone', freq: 130, endFreq: 42, type: 'sine', duration: 0.2, volume: 0.24 },
];

export function loadComposer() {
  const saved = loadJSON(TRACK_BUILDER_KEY, { bpm: 120, steps: COMPOSER_STEPS, tracks: {} });
  const bpm = clamp(Number(saved.bpm) || 120, 60, 200);
  const steps = clamp(Math.round(Number(saved.steps) || COMPOSER_STEPS), COMPOSER_MIN_STEPS, COMPOSER_MAX_STEPS);
  const tracks = {};
  for (const inst of INSTRUMENTS) {
    const raw = saved.tracks && Array.isArray(saved.tracks[inst.key]) ? saved.tracks[inst.key] : [];
    tracks[inst.key] = raw
      .map((entry) =>
        typeof entry === 'number'
          ? { col: Math.floor(entry / inst.lines.length), line: entry % inst.lines.length, length: 1 }
          : { col: entry.c ?? 0, line: entry.l ?? 0, length: Math.max(1, entry.len || 1) },
      )
      .filter((note) => note.col >= 0 && note.col < steps);
  }
  return { bpm, steps, tracks };
}

export function saveComposer(bpm, steps, tracks) {
  const out = {};
  for (const inst of INSTRUMENTS) {
    out[inst.key] = (tracks[inst.key] ?? [])
      .filter((note) => note.col < steps)
      .map((note) => ({ c: note.col, l: note.line, len: note.length }));
  }
  saveJSON(TRACK_BUILDER_KEY, { bpm, steps, tracks: out });
}

export function composerHasNotes(data) {
  return INSTRUMENTS.some((inst) => (data.tracks[inst.key] ?? []).length > 0);
}

export function composerNoteCount(data) {
  return INSTRUMENTS.reduce((sum, inst) => sum + (data.tracks[inst.key] ?? []).length, 0);
}

export function buildCustomTrack(data) {
  const { bpm, steps, tracks } = data;
  const beats = Math.max(1, steps);
  const beat = 60 / bpm / 2;
  const byStep = Array.from({ length: beats }, () => []);
  for (const inst of INSTRUMENTS) {
    for (const note of tracks[inst.key] ?? []) {
      if (note.col < 0 || note.col >= beats) continue;
      if (inst.sound === 'drum') {
        const sound = DRUM_SOUNDS[note.line] ?? DRUM_SOUNDS[0];
        if (sound.kind === 'noise') {
          byStep[note.col].push({
            kind: 'noise',
            duration: sound.duration,
            volume: sound.volume,
            type: sound.type,
            filterFreq: sound.filterFreq,
            q: sound.q ?? 1,
          });
        } else {
          byStep[note.col].push({
            kind: 'tone',
            freq: sound.freq,
            endFreq: sound.endFreq ?? null,
            type: sound.type,
            duration: sound.duration,
            volume: sound.volume,
          });
        }
      } else {
        byStep[note.col].push({
          kind: 'tone',
          freq: midiToFreq(inst.pitches[note.line]),
          type: inst.wave,
          duration: beat * note.length * 0.95,
          volume: inst.volume,
        });
      }
    }
  }
  return { name: 'custom', title: 'MY TRACK', beat, steps: beats, custom: true, byStep };
}