import { loadJSON, saveJSON } from './storage.js';
import { RUSH_PROGRESS_KEY, SKINS, SHOP_KEY, REEF_RUSH, LOGICAL_HEIGHT } from '../config.js';

const GROUND = LOGICAL_HEIGHT * REEF_RUSH.groundY;
const ROCK = 48;
const STEP = ROCK * 0.85;

const L = (x, kind, h, count = 1) => ({ x, kind, h, count });
const portal = (x, form) => ({ x, kind: 'portal', h: 90, count: 1, form });
const pillar = (x, holeTop, holeBottom) => [
  { x, kind: 'ceilrock', h: ROCK, count: Math.max(1, Math.round(holeTop / STEP)) },
  { x, kind: 'rock', h: ROCK, count: Math.max(1, Math.round((GROUND - holeBottom) / STEP)) },
];
const eelGate = (x, gapTop, gapBottom) => [
  { x, kind: 'ceilweed', h: gapTop },
  { x, kind: 'rock', h: ROCK, count: Math.max(1, Math.round((GROUND - gapBottom) / STEP)) },
];

const COURSE_PAGE = {
  title: 'REEF RUSH — THE COURSE',
  lines: [
    'ONE CLICK / SPACE IS YOUR ONLY BUTTON — WHAT IT DOES DEPENDS ON YOUR MODE.',
    'REACH THE GOAL MARKER TO CLEAR THE LEVEL.',
    'SPIKES, WEEDS AND WALLS END THE RUN ON CONTACT; PEARLS ARE BONUS.',
  ],
};

const MODE_PAGES = {
  fish: [
    {
      title: 'FISH — THE BASICS',
      lines: [
        'CLICK OR SPACE TO JUMP.',
        'TIME YOUR JUMPS OVER SHELLS, SEAWEED AND LOW WALLS.',
        'THIS IS THE DEFAULT SWIMMER YOU START RUNS IN.',
      ],
    },
  ],
  stingray: [
    {
      title: 'STINGRAY — FLIGHT',
      lines: [
        'HOLD CLICK OR SPACE TO FLY UP.',
        'RELEASE TO SINK BACK DOWN UNDER GRAVITY.',
        'THREAD THE HOLES IN THE PILLARS AND TIME YOUR CLIMB.',
      ],
    },
  ],
  eel: [
    {
      title: 'DART EEL — CLIMB AND ZIG',
      lines: [
        'HOLD TO CLIMB ALONG THE DIAGONAL.',
        'A SHORT TAP MAKES A SMALL ZIG.',
        'WITH NO INPUT IT SINKS — KEEP CLICKING TO STAY HIGH.',
      ],
    },
  ],
  crab: [
    {
      title: 'CRAB — SURFACE HOP',
      lines: [
        'EACH CLICK FLIPS GRAVITY.',
        'THE CRAB SNAPS TO THE NEAREST LANDABLE SURFACE — FLOOR, CEILING, ROCK, OR LEDGE.',
        'CHAIN CLICKS TO HOP BETWEEN THEM.',
      ],
    },
  ],
  urchin: [
    {
      title: 'URCHIN — GENTLE DRIFT',
      lines: [
        'EACH CLICK FLIPS GRAVITY, LIKE THE CRAB.',
        'BUT THE URCHIN DRIFTS UP INSTEAD OF SNAPPING TO A SURFACE.',
        'TIME YOUR CLICKS TO FLOAT THROUGH THE GAPS.',
      ],
    },
  ],
  jelly: [
    {
      title: 'JELLY — PULSE HOP',
      lines: [
        'TAP TO PULSE UPWARD.',
        'HOLDING DOES NOTHING.',
        'IT SINKS BETWEEN PULSES, SO SPAM THE CLICK TO HOVER.',
      ],
    },
  ],
  nautilus: [
    {
      title: 'NAUTILUS — THE SWING',
      lines: [
        'EACH CLICK FLIPS GRAVITY IN MID-AIR.',
        'TOUCHING THE FLOOR, CEILING OR ANY OBSTACLE IS FATAL — KEEP SWINGING.',
        'WATCH THE JET: SLANTED UP MEANS A DROP, SLANTED DOWN MEANS A RISE.',
      ],
    },
  ],
  shrimp: [
    {
      title: 'MANTIS SHRIMP — CHARGE JUMP',
      lines: [
        'TAP FOR A SHORT HOP.',
        'PRESS AND HOLD TO CHARGE A SUPER-JUMP, THEN RELEASE.',
        'SAVE THE BIG JUMP FOR THE TALL WALLS.',
      ],
    },
  ],
};

export function rushLevelPages(level) {
  if (!level) return [];
  const pages = [COURSE_PAGE];
  const mode = MODE_PAGES[level.form];
  if (mode) pages.push(...mode);
  return pages;
}

export const RUSH_LEVELS = [
  {
    id: 'tut-fish',
    name: 'FISH BASICS',
    blurb: 'LEARN THE DEFAULT SWIMMER',
    skin: null,
    form: 'fish',
    tutorial: true,
    goal: 2600,
    items: [
      L(900, 'seaweed', 22),
      L(1300, 'shell', 40),
      L(1700, 'rock', 44),
      L(2200, 'shell', 44),
    ],
  },
  {
    id: 'tut-stingray',
    name: 'STINGRAY FLIGHT',
    blurb: 'HOLD TO FLY',
    skin: null,
    form: 'stingray',
    tutorial: true,
    goal: 3000,
    items: [
      ...pillar(1000, 180, 330),
      L(1500, 'bubble', 90),
      ...pillar(2000, 180, 330),
    ],
  },
  {
    id: 'tut-eel',
    name: 'DART EEL ZIG',
    blurb: 'CLIMB THE DIAGONAL',
    skin: null,
    form: 'eel',
    tutorial: true,
    goal: 3200,
    items: [
      ...eelGate(1000, 200, 350),
      ...eelGate(1700, 210, 350),
      ...eelGate(2400, 200, 345),
    ],
  },
  {
    id: 'tut-crab',
    name: 'CRAB HOP',
    blurb: 'FLIP BETWEEN SURFACES',
    skin: null,
    form: 'crab',
    tutorial: true,
    goal: 3000,
    items: [
      L(900, 'rock', 48, 2),
      L(1400, 'ceilrock', 48, 2),
      L(1900, 'rock', 48, 2),
      L(2400, 'ceilrock', 48, 2),
    ],
  },
  {
    id: 'tut-urchin',
    name: 'URCHIN DRIFT',
    blurb: 'FLIP AND FLOAT UP',
    skin: null,
    form: 'urchin',
    tutorial: true,
    goal: 3000,
    items: [
      L(900, 'rock', 48, 2),
      L(1400, 'ceilrock', 48, 2),
      L(2000, 'rock', 48, 2),
    ],
  },
  {
    id: 'tut-jelly',
    name: 'JELLY HOVER',
    blurb: 'TAP TO PULSE UP',
    skin: null,
    form: 'jelly',
    tutorial: true,
    goal: 2800,
    items: [
      L(900, 'shell', 40),
      L(1300, 'seaweed', 24),
      L(1800, 'shell', 44),
    ],
  },
  {
    id: 'tut-nautilus',
    name: 'NAUTILUS SWING',
    blurb: 'CLICK TO FLIP MID-AIR',
    skin: null,
    form: 'nautilus',
    tutorial: true,
    goal: 2600,
    items: [
      L(900, 'pearl', 80),
      L(1300, 'pearl', 210),
      L(1700, 'pearl', 330),
      L(2100, 'pearl', 140),
    ],
  },
  {
    id: 'tut-shrimp',
    name: 'SHRIMP SUPER-JUMP',
    blurb: 'CHARGE FOR BIG HOP',
    skin: null,
    form: 'shrimp',
    tutorial: true,
    goal: 3000,
    items: [
      L(900, 'rock', 48, 2),
      L(1500, 'rock', 48, 3),
      L(2100, 'rock', 48, 2),
    ],
  },
  {
    id: 'sunlit',
    name: 'SUNLIT REEF',
    blurb: 'A GENTLE FIRST DIVE',
    skin: 'spottedray',
    form: 'fish',
    goal: 4200,
    items: [
      L(950, 'seaweed', 22),
      L(1300, 'shell', 40),
      L(1650, 'shell', 44),
      L(2000, 'rock', 44),
      L(2350, 'seaweed', 26),
      L(2700, 'shell', 50),
      L(3050, 'pearl', 90),
      L(3400, 'shell', 54),
      L(3750, 'seaweed', 28),
      L(4100, 'shell', 58),
    ],
  },
  {
    id: 'kelp',
    name: 'KELP CROSSING',
    blurb: 'WEAVE THE FRONDS',
    skin: 'tigerray',
    form: 'eel',
    goal: 4600,
    items: [
      L(900, 'seaweed', 30),
      L(1200, 'ceilweed', 260),
      L(1500, 'rock', 48, 3),
      ...eelGate(1900, 200, 350),
      ...eelGate(2400, 240, 350),
      ...eelGate(2900, 180, 310),
      ...eelGate(3500, 220, 350),
      L(4000, 'seaweed', 34),
    ],
  },
  {
    id: 'stingray',
    name: 'STINGRAY ALLEY',
    blurb: 'THREAD THE PILLARS',
    skin: 'violetray',
    form: 'stingray',
    goal: 5000,
    items: [
      ...pillar(1100, 170, 300),
      L(1500, 'bubble', 90),
      ...pillar(1900, 170, 300),
      L(2300, 'gravity', 90),
      ...pillar(2700, 170, 300),
      ...pillar(3400, 170, 290),
      L(3800, 'pad', 20),
      ...pillar(4200, 170, 300),
    ],
  },
  {
    id: 'jelly',
    name: 'JELLY BLOOM',
    blurb: 'FLOAT THROUGH THE BLOOM',
    skin: 'mintray',
    form: 'jelly',
    goal: 5200,
    items: [
      L(800, 'bubble', 90),
      ...pillar(1300, 220, 390),
      L(1800, 'bubble', 110),
      ...pillar(2200, 220, 390),
      ...pillar(2900, 210, 385),
      L(3300, 'gravity', 90),
      ...pillar(3700, 220, 390),
      ...pillar(4400, 220, 390),
    ],
  },
  {
    id: 'current',
    name: 'DEEP CURRENT',
    blurb: 'EVERYTHING AT ONCE',
    skin: 'goldray',
    form: 'urchin',
    goal: 6200,
    items: [
      L(800, 'shell', 50),
      ...pillar(1400, 180, 340),
      L(1800, 'bubble', 90),
      ...pillar(2200, 180, 340),
      portal(2600, 'crab'),
      L(3000, 'shell', 50),
      L(3350, 'ceilshell', 44),
      L(3700, 'shell', 55),
      L(4050, 'ceilshell', 46),
      L(4400, 'shell', 58),
      portal(4700, 'urchin'),
      ...pillar(5100, 180, 340),
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