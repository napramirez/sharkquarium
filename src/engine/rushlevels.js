import { loadJSON, saveJSON } from './storage.js';
import { RUSH_PROGRESS_KEY, SKINS, SHOP_KEY } from '../config.js';

const L = (x, kind, h, count = 1) => ({ x, kind, h, count });

export const RUSH_LEVELS = [
  {
    id: 'sunlit',
    name: 'SUNLIT REEF',
    blurb: 'A GENTLE FIRST DIVE',
    skin: 'spottedray',
    goal: 4200,
    items: [
      L(950, 'seaweed', 22),
      L(1250, 'shell', 40),
      L(1560, 'shell', 40),
      L(1870, 'rock', 48),
      L(2180, 'seaweed', 24),
      L(2490, 'shell', 56),
      L(2800, 'pearl', 90),
      L(3110, 'rock', 42, 2),
      L(3420, 'seaweed', 26),
      L(3730, 'shell', 64),
    ],
  },
  {
    id: 'kelp',
    name: 'KELP CROSSING',
    blurb: 'WEAVE THE FRONDS',
    skin: 'tigerray',
    goal: 4600,
    items: [
      L(950, 'seaweed', 24),
      L(1200, 'seaweed', 30),
      L(1500, 'rock', 48),
      L(1800, 'ceilshell', 40),
      L(2050, 'shell', 60),
      L(2350, 'rock', 44, 2),
      L(2650, 'seaweed', 34),
      L(2950, 'ceilshell', 46),
      L(3250, 'shell', 70),
      L(3550, 'rock', 46, 2),
      L(3850, 'seaweed', 30),
    ],
  },
  {
    id: 'stingray',
    name: 'STINGRAY ALLEY',
    blurb: 'DUCK THE GLIDERS',
    skin: 'violetray',
    goal: 5000,
    items: [
      L(1000, 'shell', 46),
      L(1300, 'ledge', 90),
      L(1600, 'seaweed', 26),
      L(1900, 'rock', 48, 2),
      L(2200, 'shell', 62),
      L(2500, 'ceilshell', 54),
      L(2800, 'bubble', 90),
      L(3100, 'rock', 46, 2),
      L(3400, 'seaweed', 30),
      L(3700, 'shell', 70),
      L(4000, 'ceilweed', 120),
    ],
  },
  {
    id: 'jelly',
    name: 'JELLY BLOOM',
    blurb: 'A MINE OF DRIFTERS',
    skin: 'mintray',
    goal: 5200,
    items: [
      L(1000, 'bubble', 90),
      L(1250, 'seaweed', 28),
      L(1550, 'gravity', 100),
      L(1850, 'shell', 58),
      L(2150, 'bubble', 110),
      L(2450, 'rock', 44, 2),
      L(2750, 'gravity', 100),
      L(3050, 'seaweed', 34),
      L(3350, 'pad', 20),
      L(3650, 'shell', 72),
      L(3950, 'bubble', 90),
    ],
  },
  {
    id: 'current',
    name: 'DEEP CURRENT',
    blurb: 'EVERYTHING AT ONCE',
    skin: 'goldray',
    goal: 6200,
    items: [
      L(1000, 'shell', 52),
      L(1300, 'slopedown', 100),
      L(1600, 'ceilshell', 44),
      L(1900, 'ceilrock', 48),
      L(2200, 'seaweed', 32),
      L(2500, 'gravity', 100),
      L(2800, 'rock', 48, 2),
      L(3100, 'slopeup', 130),
      L(3400, 'shell', 74),
      L(3700, 'ceilshell', 60),
      L(4000, 'ceilweed', 100),
      L(4300, 'seaweed', 36),
      L(4600, 'ledge', 90),
      L(4900, 'shell', 78),
      L(5200, 'bubble', 100),
    ],
  },
];

export function rushLevelById(id) {
  return RUSH_LEVELS.find((level) => level.id === id) ?? null;
}

export function getRushProgress() {
  const saved = loadJSON(RUSH_PROGRESS_KEY, { beaten: [] });
  return { beaten: Array.isArray(saved.beaten) ? saved.beaten : [] };
}

export function isLevelBeaten(id) {
  return getRushProgress().beaten.includes(id);
}

export function beatenCount() {
  return getRushProgress().beaten.length;
}

export function rushSkinLabel(key) {
  const skin = SKINS.find((entry) => entry.key === key);
  return skin ? skin.label : String(key).toUpperCase();
}

export function beatLevel(level) {
  const progress = getRushProgress();
  const first = !progress.beaten.includes(level.id);
  if (first) {
    progress.beaten.push(level.id);
    saveJSON(RUSH_PROGRESS_KEY, progress);
  }
  let unlocked = null;
  if (level.skin) {
    const shop = { owned: ['natural'], passes: [], ...loadJSON(SHOP_KEY, {}) };
    const owned = new Set(shop.owned ?? ['natural']);
    if (!owned.has(level.skin)) {
      owned.add(level.skin);
      shop.owned = [...owned];
      saveJSON(SHOP_KEY, shop);
      unlocked = level.skin;
    }
  }
  return { first, unlocked };
}