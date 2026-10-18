export const GAME_TITLE = 'SHARKQUARIUM';
export const TAGLINE = 'A TINY TIME-ATTACK DIVE';

export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;

export const STORAGE_KEY = 'sharkquarium.best-score';
export const STATS_KEY = 'sharkquarium.stats';
export const SETTINGS_KEY = 'sharkquarium.settings';

export const AUDIO = {
  volume: 0.7,
};

export const DIFFICULTY = {
  easy: {
    label: 'EASY',
    enemySpeed: 0.5,
    spawnInterval: 2,
    penalty: 0.4,
    grace: 1.5,
    chargeScale: 1.5,
    timeScale: 1.5,
  },
  normal: {
    label: 'NORMAL',
    enemySpeed: 1,
    spawnInterval: 1,
    penalty: 1,
    grace: 1,
    chargeScale: 1,
    timeScale: 1,
  },
  hard: {
    label: 'HARD',
    enemySpeed: 1.6,
    spawnInterval: 0.5,
    penalty: 2,
    grace: 0.6,
    chargeScale: 0.6,
    timeScale: 0.75,
  },
};

export const DIFFICULTY_ORDER = ['easy', 'normal', 'hard'];

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
  sand: '#c4af87',
  sandDark: '#b09a72',
  rock: '#6d7178',
  rockDark: '#565a61',
  stingray: '#8b8272',
  eel: '#5d7a52',
  shrimp: '#e26052',
  squid: '#d29aa6',
  angler: '#454e5b',
  lure: '#baf7d8',
  crab: '#d96448',
  arcticshrimp: '#9aa0a6',
  seal: '#93a3b1',
  sardine: '#c9d8e2',
  ice: '#dcecf5',
  iceDark: '#b3d0e0',
  plankton: '#cdeec2',
  turtle: '#5d8f6a',
  turtleDark: '#3f6b4d',
  minnow: '#d6bd8a',
  rayFresh: '#6b4a34',
  raySpot: '#e8c95a',
  catfish: '#7a6a58',
  catfishDark: '#5f5244',
  log: '#7d5c3f',
  weed: '#4f7a3a',
  weedDark: '#3a5c2a',
  electric: '#8a9a4f',
};

export const WATER_PALETTE = {
  top: COLORS.deep,
  bottom: COLORS.abyss,
  ray: COLORS.ray,
};

export const DEEPSEA_PALETTE = {
  top: '#07202f',
  bottom: '#010406',
  ray: 'rgba(150, 220, 255, 0.04)',
};

export const ARCTIC_PALETTE = {
  top: '#10394f',
  bottom: '#061a26',
  ray: 'rgba(220, 245, 255, 0.05)',
};

export const JELLY_PALETTE = {
  top: '#1b2447',
  bottom: '#0a0d1f',
  ray: 'rgba(200, 180, 255, 0.05)',
};

export const FRESHWATER_PALETTE = {
  top: '#33513a',
  bottom: '#16251c',
  ray: 'rgba(210, 240, 200, 0.05)',
};

export const PLAYER = {
  radius: 26,
  maxSpeed: 430,
  response: 7,
  turnResponse: 12,
  pointerDeadzone: 16,
};

export const CONTROLS = {
  solo: { left: 'left', right: 'right', up: 'up', down: 'down' },
  p1: { left: 'left1', right: 'right1', up: 'up1', down: 'down1' },
  p2: { left: 'left2', right: 'right2', up: 'up2', down: 'down2' },
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

export const GOLDEN = {
  chance: 0.08,
  radius: 13,
  riseMin: 40,
  riseMax: 70,
  score: 5,
  bonusTime: 5,
};

export const ANGELFISH = {
  radius: 22,
  speed: 150,
  bob: 18,
  bobSpeed: 1.6,
  score: 10,
  spawnMin: 14,
  spawnMax: 22,
};

export const SHRIMP = {
  radius: 14,
  sinkMin: 55,
  sinkMax: 90,
  drift: 22,
  score: 10,
  spawnMin: 7,
  spawnMax: 12,
};

export const DEEPSEA = {
  teleportScore: 250,
  floorHeight: 56,
  anglerCount: 3,
};

export const SQUID = {
  radius: 22,
  maxSpeed: 420,
  response: 6,
  turnResponse: 10,
  hideSpeed: 7,
};

export const ANGLER = {
  radius: 22,
  roamSpeed: 55,
  chaseSpeed: 115,
  searchSpeed: 80,
  detectRadius: 320,
  searchDuration: 4,
  roamDuration: 7,
  penaltyScore: 20,
  knockback: 520,
  invulnerableTime: 1.5,
};

export const CRAB = {
  radius: 16,
  sinkMin: 50,
  sinkMax: 80,
  drift: 26,
  score: 15,
  spawnMin: 9,
  spawnMax: 14,
};

export const LEDGES = {
  width: 220,
  height: 56,
  holeWidth: 52,
  holeHeight: 46,
  hideRange: 52,
  spots: [
    { x: 240, y: 310 },
    { x: 720, y: 200 },
  ],
};

export const ARCTIC = {
  teleportBubbles: 40,
  schoolCount: 2,
};

export const ARCTIC_SHRIMP = {
  radius: 20,
  maxSpeed: 430,
  response: 6,
  turnResponse: 10,
  followEase: 8,
  exitCooldown: 1.2,
};

export const SEAL = {
  radius: 22,
  diveTime: 0.8,
  chaseDuration: 7,
  chaseSpeed: 130,
  returnSpeed: 160,
  searchSpeed: 90,
  searchRadius: 70,
  chargePlankton: 15,
  penaltyScore: 25,
  knockback: 540,
  invulnerableTime: 1.5,
};

export const PLANKTON = {
  radius: 8,
  driftMin: 60,
  driftMax: 100,
  bob: 14,
  score: 5,
  spawnMin: 1.2,
  spawnMax: 2.4,
  maxActive: 8,
};

export const SARDINE = {
  schoolRadius: 74,
  fishCount: 12,
  wanderX: 140,
  wanderY: 80,
};

export const JELLY = {
  teleportPlankton: 30,
  clearPoints: 10,
};

export const MOONJELLY = {
  radius: 22,
  maxSpeed: 350,
  response: 5,
  turnResponse: 8,
};

export const MINNOW = {
  radius: 12,
  speedMin: 60,
  speedMax: 110,
  spawnMin: 4,
  spawnMax: 7,
  maxActive: 2,
  tangleTime: 0.7,
  scoreValue: 5,
  pointValue: 1,
};

export const TURTLE = {
  radius: 30,
  headRadius: 18,
  headOffset: 40,
  patrolSpeed: 60,
  chargeSpeed: 170,
  chargeIntervalMin: 4,
  chargeIntervalMax: 6.5,
  chargeDuration: 1.6,
  recoverTime: 0.9,
  stunDuration: 4,
  penaltyScore: 10,
  knockback: 480,
  invulnerableTime: 1.2,
};

export const FRESHWATER = {
  scrollSpeed: 150,
  playerX: 280,
  goalBubbles: 150,
  eelStartProgress: 0.2,
  spawnRampFloor: 0.55,
  scrollRamp: 1.35,
  catfishRamp: 1.6,
  spawnEelMin: 6.5,
  spawnEelMax: 9.5,
  tangleDuration: 1,
  tangleScore: 5,
  tangleDrag: 70,
  logPenalty: 5,
  rockPenalty: 10,
  piranhaPenalty: 10,
  bubbleRowMin: 2.4,
  bubbleRowMax: 4,
  bubbleSpacing: 64,
  bubbleCountMin: 4,
  bubbleCountMax: 7,
  spawnLogMin: 2.8,
  spawnLogMax: 4.8,
  spawnRockMin: 4.5,
  spawnRockMax: 7.5,
  spawnPiranhaMin: 3.6,
  spawnPiranhaMax: 5.6,
  spawnWeedMin: 2.4,
  spawnWeedMax: 4,
};

export const ELECTRIC_EEL = {
  radius: 20,
  fieldRadius: 44,
  seekSpeed: 40,
  penaltyScore: 15,
  knockback: 340,
  invulnerableTime: 1.4,
  paralysis: 0.8,
};

export const CATFISH = {
  radius: 34,
  startX: -160,
  chaseSpeed: 45,
  returnSpeed: 90,
  stunDuration: 4.5,
  penaltyScore: 15,
  knockback: 300,
  invulnerableTime: 1.5,
};

export const ZONES = {
  spawnMin: 10,
  spawnMax: 16,
  duration: 8,
  fade: 0.7,
  currentHeight: 130,
  currentPush: 320,
  currentDrift: 22,
  updraftWidth: 140,
  updraftPush: 300,
};

export const STINGRAY = {
  teleportScore: 60,
  radius: 24,
  maxSpeed: 400,
  response: 5,
  turnResponse: 9,
  burrowDepth: 22,
  burrowSpeed: 6,
  burrowMoveSpeed: 130,
};

export const SAND = {
  height: 72,
  speckles: 90,
};

export const ARCHWAY = {
  beamTop: 96,
  beamHeight: 76,
  legWidth: 74,
  holeWidth: 52,
  holeCount: 5,
};

export const EEL = {
  radius: 16,
  bodyLength: 108,
  trailSpacing: 6,
  huntSpeed: 240,
  aggressiveMultiplier: 1.25,
  returnSpeed: 320,
  huntDuration: 6,
  peekDuration: 2.2,
  bubblesPerHunt: 10,
  penaltyScore: 15,
  knockback: 500,
  invulnerableTime: 1.5,
  searchRadius: 70,
  jawOpenRadius: 140,
};

export const ROUND = {
  duration: 30,
  emptyDuration: 10,
  rampDuration: 60,
  bubbleRateFloor: 0.55,
  hazardRateFloor: 0.5,
  hazardCapStep: 30,
  maxHazardsCeiling: 5,
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
