import { loadJSON, saveJSON } from './storage.js';
import { COINS, COINS_KEY, STATS_KEY } from '../config.js';

export function recordMinigame(won) {
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
  const reward = COINS.minigamePlay + (won ? COINS.minigameWin : 0);
  saveJSON(COINS_KEY, loadJSON(COINS_KEY, COINS.starting) + reward);
  return reward;
}
