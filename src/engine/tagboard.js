import { loadJSON, saveJSON } from './storage.js';

const TAG_BOARD_KEY = 'sharkquarium.tagboard';

export function loadTagBoard() {
  const saved = loadJSON(TAG_BOARD_KEY, { taggers: {}, runners: {} });
  return {
    taggers: saved.taggers && typeof saved.taggers === 'object' ? saved.taggers : {},
    runners: saved.runners && typeof saved.runners === 'object' ? saved.runners : {},
  };
}

export function recordTagMatch(swimmers) {
  const board = loadTagBoard();
  for (const swimmer of swimmers) {
    const name = String(swimmer.name ?? '').trim();
    if (!name) continue;
    const makes = Math.max(0, Math.round(swimmer.makes || 0));
    const itCount = Math.max(0, Math.round(swimmer.tags || 0));
    if (board.taggers[name] === undefined || makes > board.taggers[name]) board.taggers[name] = makes;
    if (board.runners[name] === undefined || itCount < board.runners[name]) board.runners[name] = itCount;
  }
  saveJSON(TAG_BOARD_KEY, board);
  return board;
}

export function topTaggers(count = 8) {
  const board = loadTagBoard();
  return Object.entries(board.taggers)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, count);
}

export function bestRunners(count = 8) {
  const board = loadTagBoard();
  return Object.entries(board.runners)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .slice(0, count);
}
