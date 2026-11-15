import { loadJSON, saveJSON } from './storage.js';
import { ACHIEVEMENTS, ACHIEVEMENTS_KEY } from '../config.js';

function earnedSet() {
  return new Set(loadJSON(ACHIEVEMENTS_KEY, { earned: [] }).earned ?? []);
}

export function earnedAchievements() {
  return earnedSet();
}

export function isEarned(key) {
  return earnedSet().has(key);
}

export function unlockAchievement(key) {
  if (!ACHIEVEMENTS.some((a) => a.key === key)) return false;
  const set = earnedSet();
  if (set.has(key)) return false;
  set.add(key);
  saveJSON(ACHIEVEMENTS_KEY, { earned: [...set].sort() });
  return true;
}

export function achievementCatalog() {
  return ACHIEVEMENTS;
}

export function achievementCount() {
  return earnedSet().size;
}

export function checkAchievements(context = {}) {
  const unlocked = [];
  const tryUnlock = (key, ok) => {
    if (ok && unlockAchievement(key)) unlocked.push(key);
  };
  if (context.wonMinigame) tryUnlock('first_win', true);
  if (context.clearedMode) {
    const mode = context.clearedMode;
    tryUnlock('clear_any', true);
    tryUnlock('reef_rush', /^reefrush/.test(mode));
    tryUnlock('boss_slayer', mode === 'bossrush');
    tryUnlock('horror_survivor', /^mutant_/.test(mode));
    tryUnlock('playtoy_surface', mode === 'playtoy');
    tryUnlock('daily_diver', mode === 'daily');
  }
  if (context.caughtRay) tryUnlock('ray_collector', true);
  if (context.openedFacts) tryUnlock('fact_finder', true);
  if (Number.isFinite(context.cuttlefishEats)) tryUnlock('ink_and_hide', context.cuttlefishEats >= 5);
  if (context.ownsCuttlefishSet) tryUnlock('cuttlefish_clad', true);
  if (Number.isFinite(context.cosmeticsOwned)) tryUnlock('fashionista', context.cosmeticsOwned >= 10);
  if (Number.isFinite(context.coins)) tryUnlock('deep_pockets', context.coins >= 5000);
  if (Number.isFinite(context.score)) tryUnlock('centurion', context.score >= 100);
  return unlocked;
}
