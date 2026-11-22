import { SKINS } from '../config.js';
import { TAU } from './math.js';
import { drawAuraRing } from './aura.js';
import { isMeme } from './meme.js';

const catalog = new Map(SKINS.map((skin) => [skin.key, skin]));
const NATURAL = catalog.get('natural');

let active = NATURAL;
let clock = 0;

export function skinByKey(key, raw = false) {
  const skin = catalog.get(key) ?? NATURAL;
  if (skin.meme && !isMeme()) return NATURAL;
  if (skin.rushScope && !raw) return NATURAL;
  return skin;
}

export function skinCatalog() {
  return SKINS.filter((skin) => !skin.meme || isMeme());
}

export function activeSkin() {
  return active;
}

export function setActiveSkin(skin) {
  active = skin ?? NATURAL;
}

export function setSkinClock(time) {
  clock = time;
}

export function skinColor(skin, slot, time) {
  if (!skin || skin.key === 'natural') return null;
  if (skin.special === 'rainbow') {
    const offset = slot === 'accent' ? 140 : slot === 'belly' ? 70 : 0;
    const hue = (time * 120 + offset) % 360;
    const lightness = slot === 'belly' ? 78 : slot === 'accent' ? 68 : 58;
    return `hsl(${hue}, 85%, ${lightness}%)`;
  }
  if (skin.special === 'shadow') {
    if (slot === 'accent') {
      const pulse = 0.55 + 0.45 * Math.sin(time * 6);
      return `rgba(255, 59, 74, ${pulse.toFixed(3)})`;
    }
    return slot === 'belly' ? '#16161f' : '#0b0b11';
  }
  if (skin.special === 'chaos') {
    const pulse = 0.5 + 0.5 * Math.sin(time * 9);
    if (slot === 'tail') return `rgba(0, 0, 0, ${(0.55 + 0.45 * pulse).toFixed(3)})`;
    if (slot === 'tailOutline') return `rgba(255, 43, 43, ${(0.6 + 0.4 * pulse).toFixed(3)})`;
    const glow = Math.round(25 + 85 * pulse);
    return `rgb(255, ${glow}, ${glow})`;
  }
  return skin[slot] ?? null;
}

function chaosRandom(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function drawChaosCrackle(ctx, entity, time) {
  const seed = Math.floor(time * 20);
  const pulse = 0.5 + 0.5 * Math.sin(time * 9);
  const r = entity.radius;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 7; i += 1) {
    const r1 = chaosRandom(seed * 3 + i * 7 + 1);
    const r2 = chaosRandom(seed * 5 + i * 13 + 2);
    const r3 = chaosRandom(seed * 7 + i * 11 + 3);
    const a = r1 * TAU;
    const inner = r * (0.82 + r2 * 0.28);
    const outer = r * (1.3 + r3 * 0.55);
    const sx = entity.x + Math.cos(a) * inner;
    const sy = entity.y + Math.sin(a) * inner;
    const ex = entity.x + Math.cos(a) * outer;
    const ey = entity.y + Math.sin(a) * outer;
    const mx = (sx + ex) / 2 + (r2 - 0.5) * r * 0.5;
    const my = (sy + ey) / 2 + (r3 - 0.5) * r * 0.5;
    ctx.globalAlpha = 0.28 + pulse * 0.35;
    ctx.strokeStyle = '#ff4b4b';
    ctx.lineWidth = r * 0.17;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(mx, my);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.globalAlpha = 0.88;
    ctx.strokeStyle = '#ff2b2b';
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(mx, my);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

export function playerColor(slot, fallback) {
  return skinColor(active, slot, clock) ?? fallback;
}

export function shadowEyeColor(fallback) {
  if (active.special === 'shadow') return '#f4fbff';
  if (active.special === 'chaos') return '#f8fbff';
  return fallback;
}

export function eyeLight(fallback) {
  return active.special === 'chaos' ? '#0a0a0f' : fallback;
}

export function eyeOpen(seed = 0) {
  const period = 3.8 + ((seed * 1.7) % 1.6);
  const t = (((clock + seed * 3.1) % period) + period) % period;
  const blinkStart = period - 0.24;
  if (t <= blinkStart) return 1;
  const local = (t - blinkStart) / 0.24;
  return 0.1 + 0.9 * Math.abs(local - 0.5) * 2;
}

export function eyeOpenFor(source) {
  const open = eyeOpen(source?.blinkSeed ?? 0);
  const flinch = source?.eyeFlinch ?? 0;
  return Math.max(0.05, open * (1 - 0.92 * flinch));
}

export function drawEye(ctx, cx, cy, r, options = {}) {
  const open = options.open ?? eyeOpen(options.seed ?? 0);
  ctx.fillStyle = eyeLight(options.light ?? '#f4fbff');
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, Math.max(0.5, r * open), 0, 0, TAU);
  ctx.fill();
}

export function drawPupil(ctx, cx, cy, r, options = {}) {
  const open = options.open ?? eyeOpen(options.seed ?? 0);
  if (active.special === 'chaos') {
    ctx.fillStyle = '#0a0a0f';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, Math.max(0.5, r * open), 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff2020';
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(0.5, r * 0.42), Math.max(0.6, r * 1.7 * open), 0, 0, TAU);
    ctx.fill();
    return;
  }
  ctx.fillStyle = shadowEyeColor(options.color ?? '#10233a');
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, Math.max(0.5, r * open), 0, 0, TAU);
  ctx.fill();
}

export function drawEyePair(ctx, cx, cy, r, options = {}) {
  drawEye(ctx, cx, cy, r, options);
  drawPupil(ctx, cx + (options.pupilDx ?? 0), cy + (options.pupilDy ?? 0), options.pupilR ?? r * 0.5, options);
}

export function chaosActive() {
  return active.special === 'chaos';
}

export function drawSkinAura(ctx, entity) {
  if (active.special === 'shadow') {
    const pulse = 0.5 + 0.5 * Math.sin(clock * 6);
    ctx.save();
    ctx.globalAlpha = 0.22 + pulse * 0.38;
    ctx.strokeStyle = '#ff3b4a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.radius * (1.7 + pulse * 0.25), 0, TAU);
    ctx.stroke();
    ctx.restore();
  } else if (active.special === 'rainbow') {
    for (let i = 0; i < 3; i += 1) {
      const hue = (clock * 140 + i * 120) % 360;
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = `hsl(${hue}, 85%, 62%)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(entity.x, entity.y, entity.radius * (1.55 + i * 0.22), 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  } else if (active.special === 'chaos') {
    drawChaosCrackle(ctx, entity, clock);
  }
  drawAuraRing(
    ctx,
    entity,
    {
      key: active.key,
      rainbow: active.special === 'rainbow',
      body: skinColor(active, 'body', clock),
      accent: skinColor(active, 'accent', clock),
    },
    clock,
  );
}
