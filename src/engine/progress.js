import { loadJSON, saveJSON } from './storage.js';
import { COINS, COINS_KEY, STATS_KEY } from '../config.js';

let coinMultiplier = 1;

export function setCoinMultiplier(value) {
  coinMultiplier = Number.isFinite(value) && value > 0 ? value : 1;
}

export function getCoinMultiplier() {
  return coinMultiplier;
}

export function recordMinigame(won, multiplier = coinMultiplier) {
  const stats = {
    games: 0,
    bubbles: 0,
    longestRun: 0,
    minigames: 0,
    minigameWins: 0,
    ...loadJSON(STATS_KEY, {}),
  };
  stats.minigames += 1;
  if (won) stats.minigameWins += 1;
  saveJSON(STATS_KEY, stats);
  const reward = Math.round((COINS.minigamePlay + (won ? COINS.minigameWin : 0)) * multiplier);
  saveJSON(COINS_KEY, loadJSON(COINS_KEY, COINS.starting) + reward);
  return reward;
}
