import { loadJSON, saveJSON } from './storage.js';
import { RECORDS_KEY } from '../config.js';

function load() {
  return loadJSON(RECORDS_KEY, {});
}

export function getRecord(mode) {
  const all = load();
  return all[mode] ?? { time: null, score: null, cleared: false };
}

export function getAllRecords() {
  return load();
}

export function recordWin(mode, { time = null, score = null } = {}) {
  const all = load();
  const rec = all[mode] ?? { time: null, score: null, cleared: false };
  const result = { time: false, score: false };
  if (time != null && Number.isFinite(time) && (rec.time == null || time < rec.time)) {
    rec.time = time;
    result.time = true;
  }
  if (score != null && Number.isFinite(score) && (rec.score == null || score > rec.score)) {
    rec.score = score;
    result.score = true;
  }
  rec.cleared = true;
  all[mode] = rec;
  saveJSON(RECORDS_KEY, all);
  return result;
}

export function clearRecords(mode) {
  const all = load();
  if (mode == null) {
    saveJSON(RECORDS_KEY, {});
    return;
  }
  delete all[mode];
  saveJSON(RECORDS_KEY, all);
}

export function formatTime(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return '--:--';
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function formatRecord(mode) {
  const rec = getRecord(mode);
  if (rec.time == null && rec.score == null) return rec.cleared ? 'CLEARED' : 'NO RECORD';
  if (rec.time != null && rec.score != null) return `${formatTime(rec.time)} · ${rec.score}`;
  if (rec.time != null) return formatTime(rec.time);
  return `${rec.score}`;
}
