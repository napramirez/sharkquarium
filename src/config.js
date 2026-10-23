export const GAME_TITLE = 'SHARKQUARIUM';
export const TAGLINE = 'A TINY TIME-ATTACK DIVE';

export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;

export const STORAGE_KEY = 'sharkquarium.best-score';
export const STATS_KEY = 'sharkquarium.stats';
export const SETTINGS_KEY = 'sharkquarium.settings';
export const SHOP_KEY = 'sharkquarium.shop';
export const COINS_KEY = 'sharkquarium.coins';

export const COINS = {
  starting: 500,
  bonus: 5,
  perScore: 2,
  perSecond: 1,
  skinBonusScale: 8000,
  minigamePlay: 30,
  minigameWin: 60,
  difficultyScale: {
    easy: 1,
    normal: 1.5,
    hard: 2.5,
    apocalyptic: 4,
  },
};

export const SKINS = [
  { key: 'natural', label: 'NATURAL', cost: 0 },
  {
    key: 'lagoon',
    label: 'LAGOON',
    cost: 200,
    body: '#3fa79b',
    accent: '#9fe8dd',
    belly: '#e4fff9',
  },
  {
    key: 'coral',
    label: 'CORAL',
    cost: 450,
    body: '#e2755f',
    accent: '#ffc9a8',
    belly: '#fff0e2',
  },
  {
    key: 'midnight',
    label: 'MIDNIGHT',
    cost: 900,
    body: '#3d4f96',
    accent: '#9fb2ff',
    belly: '#dce4ff',
  },
  {
    key: 'gold',
    label: 'GOLD',
    cost: 1400,
    body: '#d9a93c',
    accent: '#fff0b8',
    belly: '#fff7dd',
  },
  { key: 'shadow', label: 'SHADOW', cost: 2500, special: 'shadow' },
  { key: 'rainbow', label: 'RAINBOW', cost: 2500, special: 'rainbow' },
];

export const PASSES = [
  { key: 'competitions', label: 'COMPETITIONS', cost: 1200 },
];

export const ACCESSORIES = [
  { key: 'none', label: 'NONE', cost: 0 },
  { key: 'tophat', label: 'TOP HAT', cost: 80 },
  { key: 'party', label: 'PARTY CONE', cost: 60 },
  { key: 'sunglasses', label: 'SUNGLASSES', cost: 70 },
  { key: 'bowtie', label: 'BOW TIE', cost: 50 },
  { key: 'armor', label: 'SHELL ARMOR', cost: 120 },
  { key: 'crown', label: 'CROWN', cost: 150 },
];

export const TANK_INTROS = {
  reef: { label: 'REEF TANK', blurb: 'THE LAST LAP BEGINS' },
  stingray: { label: 'STINGRAY TANK', blurb: 'THE EELS ARE WATCHING' },
  deepsea: { label: 'DEEP SEA TANK', blurb: 'THE LURES ARE LIGHTS' },
  arctic: { label: 'ARCTIC TANK', blurb: 'THE SEALS ARE WATCHING' },
  kelp: { label: 'KELP FOREST TANK', blurb: 'THE OCTOPUS IS WATCHING' },
  jelly: { label: 'JELLY TANK', blurb: 'TANGLE THE MINNOWS — STUN THE TURTLE' },
  nautilus: { label: 'NAUTILUS TANK', blurb: 'DODGE THE BONES — FEED THE SHARK' },
  freshwater: { label: 'FRESHWATER TANK', blurb: 'OUTRUN THE CATFISH' },
};

export const RACE = {
  duration: 30,
};

export const PUFFER = {
  radius: 22,
  speedMin: 260,
  speedMax: 380,
  spawnMin: 1.4,
  spawnMax: 2.2,
  spawnFloor: 0.35,
  rampDuration: 60,
  endlessSpawn: 0.35,
  speedRamp: 1.5,
  speedCeiling: 2.2,
  speedOvertime: 0.2,
  chargeTime: 0.8,
  chargeRamp: 0.55,
  chargeFloor: 0.28,
  chargeOvertime: 0.05,
  doubleChance: 0.5,
  doubleCeiling: 0.65,
  doubleOvertime: 0.05,
  aimChance: 0.6,
  aimCeiling: 0.75,
  aimOvertime: 0.05,
  wobble: 30,
  lives: 3,
  invulnerableTime: 1.6,
  knockback: 380,
};

export const TAG = {
  duration: 60,
  flashTime: 1.6,
  tagCooldown: 1.4,
  tagPush: 320,
  tagGap: 26,
  worldWidth: 1760,
  worldHeight: 990,
  radius: 18,
  cpuCount: 5,
  playerSpeed: 300,
  cpuSpeed: 285,
  taggerBoost: 1.08,
  fleeDrop: 0.96,
  nameMaxLength: 8,
  p1Color: '#ffd166',
  p2Color: '#cfefff',
  cpuColors: [
    '#7bdff2',
    '#c1a3ff',
    '#9be564',
    '#ffb26b',
    '#f4e6c4',
    '#e2755f',
    '#3fa79b',
    '#a06fd0',
    '#d9a93c',
    '#8b98a5',
  ],
  cpuNames: [
    'NIBBLES',
    'SPLASH',
    'CORAL',
    'PEBBLE',
    'BUBBLES',
    'ZIPPY',
    'KELP',
    'GLIMMER',
    'SQUIRT',
    'ROCKY',
    'MURKY',
    'FINS',
    'PUDDLE',
    'SHELLY',
    'DRIFTY',
    'TIDAL',
    'WAVY',
    'BRINY',
    'SONAR',
    'FLIPPER',
  ],
};

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
    rampScale: 1,
    hazardBonus: 0,
  },
  normal: {
    label: 'NORMAL',
    enemySpeed: 1,
    spawnInterval: 1,
    penalty: 1,
    grace: 1,
    chargeScale: 1,
    timeScale: 1,
    rampScale: 1,
    hazardBonus: 0,
  },
  hard: {
    label: 'HARD',
    enemySpeed: 1.6,
    spawnInterval: 0.5,
    penalty: 2,
    grace: 0.6,
    chargeScale: 0.6,
    timeScale: 0.75,
    rampScale: 1,
    hazardBonus: 0,
  },
  apocalyptic: {
    label: 'APOCALYPTIC WIPEOUT',
    enemySpeed: 2.4,
    spawnInterval: 0.3,
    penalty: 3,
    grace: 0.35,
    chargeScale: 0.4,
    timeScale: 0.6,
    rampScale: 0.5,
    hazardBonus: 2,
  },
};

export const DIFFICULTY_ORDER = ['easy', 'normal', 'hard', 'apocalyptic'];

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
  bone: '#e8e2d0',
  boneDark: '#bdb49b',
  puffer: '#e0c56a',
  urchin: '#4b2e59',
  urchinSpike: '#6d4884',
  octopus: '#a8567a',
  octopusDark: '#7c3d58',
  octopusAlert: '#e2758f',
  kelpLeaf: '#3f7a4a',
  kelpLeafDark: '#2c5a37',
  kelpFloor: '#22382a',
  pufferSpike: '#9c8340',
  nautilusShell: '#d9b28c',
  nautilusShellDark: '#9c6b4d',
  nautilusSkin: '#c98d6b',
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

export const KELP_PALETTE = {
  top: '#1d4230',
  bottom: '#0a1d14',
  ray: 'rgba(190, 240, 190, 0.05)',
};

export const NAUTILUS_PALETTE = {
  top: '#123c4a',
  bottom: '#04181f',
  ray: 'rgba(140, 225, 225, 0.05)',
};

export const CORAL_PALETTE = ['#e8834f', '#d95f8a', '#a06fd0', '#4fb3a5', '#e8b04f'];

export const COLORSCHOOL_PALETTE = [
  '#ffd166',
  '#ff8fa3',
  '#7bdff2',
  '#c1a3ff',
  '#9be564',
  '#ffb26b',
  '#f4e6c4',
];

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
  separation: 76,
  zoneJitter: 40,
  spawnAttempts: 24,
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
  teleportPlankton: 30,
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

export const CORAL = {
  count: 6,
  margin: 90,
  heightMin: 48,
  heightMax: 96,
  jitter: 0.3,
  sway: 4,
  swaySpeed: 0.9,
};

export const REEF_ROCK = {
  inset: 62,
  radiusMin: 50,
  radiusMax: 64,
};

export const COLORSCHOOL = {
  radius: 46,
  fishCountMin: 5,
  fishCountMax: 7,
  speedMin: 65,
  speedMax: 95,
  spawnMin: 7,
  spawnMax: 12,
  maxActive: 1,
  bobAmp: 16,
  bobSpeedMin: 0.7,
  bobSpeedMax: 1.3,
  spreadX: 54,
  spreadY: 34,
  cullMargin: 140,
};

export const JELLY = {
  clearPoints: 10,
};

export const KELP = {
  teleportBubbles: 25,
  stalkCount: 5,
};

export const KELP_CRAB = {
  radius: 24,
  maxSpeed: 380,
  response: 6,
  turnResponse: 10,
};

export const OCTOPUS = {
  radius: 30,
  headRadius: 18,
  headOffset: 42,
  patrolSpeed: 55,
  lungeSpeed: 165,
  lungeIntervalMin: 4,
  lungeIntervalMax: 6.5,
  lungeDuration: 1.5,
  recoverTime: 0.9,
  stunDuration: 4,
  stunBubbles: 4,
  stunScore: 10,
  penaltyScore: 10,
  knockback: 480,
  invulnerableTime: 1.2,
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

export const NAUTILUS = {
  radius: 24,
  maxSpeed: 390,
  response: 6,
  playerY: 190,
  scrollSpeed: 140,
  goalBubbles: 120,
  spawnRampFloor: 0.55,
  scrollRamp: 1.35,
  sharkRamp: 1.6,
  sharkStartY: -170,
  sharkRadius: 38,
  sharkChaseSpeed: 46,
  sharkReturnSpeed: 90,
  sharkDistractTime: 4.5,
  sharkPenalty: 15,
  sharkKnockback: 300,
  sharkInvulnerableTime: 1.5,
  skeletonPenalty: 10,
  eelRadius: 16,
  eelSpeedMin: 360,
  eelSpeedMax: 460,
  eelPenalty: 15,
  squidRadius: 16,
  squidSeek: 90,
  squidRise: 60,
  squidPenalty: 10,
  squidParalysis: 0.8,
  bubbleSpacing: 64,
  bubbleCountMin: 4,
  bubbleCountMax: 7,
  bubbleRowMin: 2.4,
  bubbleRowMax: 4,
  spawnSkeletonMin: 4.2,
  spawnSkeletonMax: 6.8,
  spawnEelMin: 3.6,
  spawnEelMax: 6,
  spawnSquidMin: 4.5,
  spawnSquidMax: 7,
  maxSkeletons: 3,
  maxEels: 3,
  maxSquids: 3,
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
  jawOpenRadius: 140,
  roamSpeed: 80,
  roamMinDistance: 180,
  roamIntervalMin: 0.8,
  roamIntervalMax: 1.6,
};

export const EEL_VARIANTS = [
  { label: 'BROWN', body: '#7a5c3e', ridge: '#9d7f58', outline: 'rgba(48, 34, 22, 0.55)', eye: '#10233a', spots: false },
  { label: 'OLIVE', body: '#98854a', ridge: '#bba763', outline: 'rgba(58, 48, 26, 0.55)', eye: '#10233a', spots: false },
  { label: 'SPOTTED YELLOW', body: '#d9b93f', ridge: '#eed77a', outline: 'rgba(84, 70, 20, 0.6)', eye: '#1a1a1a', spots: true },
  { label: 'SAGE GRAY', body: '#9a9c86', ridge: '#bcc0ab', outline: 'rgba(52, 54, 46, 0.55)', eye: '#10233a', spots: false },
  { label: 'BLUE-EYED GRAY', body: '#8b98a5', ridge: '#b3c0cc', outline: 'rgba(44, 52, 60, 0.55)', eye: '#4fa8e0', spots: false },
];

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
