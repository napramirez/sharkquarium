export const GAME_TITLE = 'SHARKQUARIUM';
export const TAGLINE = 'A TINY TIME-ATTACK DIVE';

export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;

export const STORAGE_KEY = 'sharkquarium.best-score';

export const COLORS = {
  abyss: '#04101d',
  deep: '#0a2740',
  mid: '#10456b',
  ray: 'rgba(191, 233, 255, 0.06)',
  foam: '#8fd0ef',
  bubble: '#cfefff',
  text: '#eaf6ff',
  textDim: 'rgba(234, 246, 255, 0.65)',
  accent: '#ffd166',
  danger: '#ff6b81',
  shark: '#6f8fa6',
  sharkFin: '#54748b',
  sharkBelly: '#d9e8f0',
  jelly: '#ff8fa3',
};

export const WATER_PALETTE = {
  top: COLORS.deep,
  bottom: COLORS.abyss,
  ray: COLORS.ray,
};

export const PLAYER = {
  radius: 26,
  maxSpeed: 430,
  response: 7,
  turnResponse: 12,
};

export const BUBBLE = {
  minRadius: 9,
  maxRadius: 14,
  minRise: 55,
  maxRise: 95,
  minWobble: 6,
  maxWobble: 18,
  minWobbleSpeed: 1.2,
  maxWobbleSpeed: 2.6,
};

export const HAZARD = {
  radius: 24,
  bobMin: 40,
  bobMax: 80,
  bobSpeedMin: 0.7,
  bobSpeedMax: 1.1,
  driftSpeed: 42,
};

export const ROUND = {
  duration: 30,
  emptyDuration: 10,
  bubbleScore: 1,
  bubbleBonusTime: 1.25,
  hazardPenaltyTime: 3,
  invulnerableTime: 1.2,
  bubbleSpawnMin: 0.45,
  bubbleSpawnMax: 0.95,
  maxBubbles: 14,
  hazardSpawnMin: 4.5,
  hazardSpawnMax: 7.5,
  maxHazards: 3,
  hazardSafeRadius: 240,
  lowTimeThreshold: 5,
  knockback: 520,
};
