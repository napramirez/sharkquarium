import { DIFFICULTY, SETTINGS_KEY } from '../config.js';
import { loadJSON } from './storage.js';

export function tuning() {
  const saved = loadJSON(SETTINGS_KEY, {}).tuning ?? {};
  return {
    enemySpeed: Number.isFinite(saved.enemySpeed) ? saved.enemySpeed : 1,
    timeScale: Number.isFinite(saved.timeScale) ? saved.timeScale : 1,
    penalty: Number.isFinite(saved.penalty) ? saved.penalty : 1,
  };
}

export function tuningActive() {
  const t = tuning();
  return t.enemySpeed !== 1 || t.timeScale !== 1 || t.penalty !== 1;
}

export function rulesFor(key) {
  const base = DIFFICULTY[key] ?? DIFFICULTY.normal;
  const t = tuning();
  return {
    ...base,
    enemySpeed: base.enemySpeed * t.enemySpeed,
    spawnInterval: base.spawnInterval / t.timeScale,
    timeScale: base.timeScale * t.timeScale,
    penalty: base.penalty * t.penalty,
  };
}
