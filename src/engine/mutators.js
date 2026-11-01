import { COLORS } from '../config.js';

export const MUTATORS = [
  {
    key: 'none',
    label: 'OFF',
    desc: 'STANDARD DIVE',
    scoreMult: 1,
    coinMult: 1,
    knobs: {},
  },
  {
    key: 'fast',
    label: 'FAST',
    desc: 'EVERYTHING MOVES 60% FASTER',
    scoreMult: 1.5,
    coinMult: 1.3,
    knobs: { playerSpeedScale: 1.6, enemySpeedScale: 1.6 },
  },
  {
    key: 'onehit',
    label: 'ONE HIT',
    desc: 'A SINGLE HIT ENDS THE RUN',
    scoreMult: 2.2,
    coinMult: 1.6,
    knobs: { oneHit: true },
  },
  {
    key: 'noair',
    label: 'NO AIR',
    desc: 'THE CLOCK RUNS TWICE AS FAST',
    scoreMult: 1.75,
    coinMult: 1.5,
    knobs: { timeScale: 0.5, drainScale: 1.6 },
  },
  {
    key: 'lightsout',
    label: 'LIGHTS OUT',
    desc: 'THE TANK GOES DARK',
    scoreMult: 1.6,
    coinMult: 1.4,
    knobs: { darkness: true, enemySpeedScale: 1.15 },
  },
  {
    key: 'goldrush',
    label: 'GOLD RUSH',
    desc: 'DOUBLE COINS — NO RECOVERY FRAMES',
    scoreMult: 1,
    coinMult: 2,
    knobs: { noGrace: true },
  },
  {
    key: 'glass',
    label: 'GLASS',
    desc: 'NO INVULNERABILITY WINDOW',
    scoreMult: 1.5,
    coinMult: 1.35,
    knobs: { noGrace: true, enemySpeedScale: 1.2 },
  },
  {
    key: 'pressure',
    label: 'TIME PRESSURE',
    desc: 'TIGHTER CLOCK — HEAVIER SPWNS',
    scoreMult: 1.6,
    coinMult: 1.4,
    knobs: { timeScale: 0.7, spawnScale: 0.6, enemySpeedScale: 1.2 },
  },
];

export const MUTATOR_OFF = MUTATORS[0];

export function mutatorByKey(key) {
  return MUTATORS.find((mutator) => mutator.key === key) ?? MUTATOR_OFF;
}

export function mutatorLabel(mutator) {
  return mutator && mutator.key !== 'none' ? mutator.label : '';
}

export function scaleRules(base, mutator) {
  const knobs = mutator && mutator.knobs;
  if (!knobs || mutator.key === 'none') return base;
  const out = { ...base };
  if (knobs.enemySpeedScale) out.enemySpeed = (base.enemySpeed ?? 1) * knobs.enemySpeedScale;
  if (knobs.timeScale) out.timeScale = (base.timeScale ?? 1) * knobs.timeScale;
  if (knobs.spawnScale) out.spawnInterval = (base.spawnInterval ?? 1) * knobs.spawnScale;
  if (knobs.graceScale != null) out.grace = (base.grace ?? 1) * knobs.graceScale;
  if (knobs.noGrace) out.grace = 0;
  return out;
}

export function mutatorScoreMult(mutator) {
  return (mutator && mutator.scoreMult) || 1;
}

export function mutatorCoinMult(mutator) {
  return (mutator && mutator.coinMult) || 1;
}

export function drawMutatorDarkness(ctx, width, height, x, y) {
  ctx.save();
  const gradient = ctx.createRadialGradient(x, y, 30, x, y, 260);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.34)');
  gradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.78)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.94)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
