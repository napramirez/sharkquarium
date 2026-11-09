import { EMOTES } from '../config.js';
import { drawRagdollRipcord } from './ripcord.js';
import { drawChainFin } from './chainfin.js';
import { TAU } from './math.js';

const catalog = new Map(EMOTES.map((emote) => [emote.key, emote]));

export const EMOTE_DURATION = 3;

let activeKey = 'none';

export function emoteCatalog() {
  return EMOTES;
}

export function emoteByKey(key) {
  return catalog.get(key) ?? catalog.get('none');
}

export function setActiveEmote(key) {
  activeKey = catalog.has(key) ? key : 'none';
}

export function currentEmoteKey() {
  return activeKey;
}

export function startEmote(entity, key = activeKey) {
  if (!entity || !key || key === 'none' || !catalog.has(key)) return false;
  entity._emote = { key, t: 0 };
  return true;
}

export function isEmoting(entity) {
  return Boolean(entity && entity._emote);
}

export function updateEmote(entity, dt) {
  if (!entity || !entity._emote) return;
  entity._emote.t += dt;
  if (entity._emote.t >= EMOTE_DURATION) entity._emote = null;
}

export function emoteProgress(entity) {
  if (!entity || !entity._emote) return 0;
  return Math.min(1, entity._emote.t / EMOTE_DURATION);
}

function envelope(progress) {
  return Math.max(0, Math.min(1, progress / 0.08, (1 - progress) / 0.08));
}

function pullAmount(progress) {
  const a = Math.max(0, 1 - Math.abs(progress - 0.07) / 0.11);
  const b = Math.max(0, 1 - Math.abs(progress - 0.9) / 0.11);
  return Math.min(1, a + b);
}

export function drawEmote(ctx, entity, radius, time) {
  const emote = entity && entity._emote;
  if (!emote) return;
  const progress = emoteProgress(entity);
  switch (emote.key) {
    case 'chainfin':
      drawChainFinEmote(ctx, entity, radius, time, progress);
      break;
    case 'spin':
      drawSpinEmote(ctx, entity, radius, progress);
      break;
    case 'boop':
      drawBoopEmote(ctx, entity, radius, progress);
      break;
    case 'tailwiggle':
      drawTailEmote(ctx, entity, radius, progress);
      break;
    case 'bubbleblow':
      drawBubbleEmote(ctx, entity, radius, progress);
      break;
    default:
      break;
  }
}

function drawChainFinEmote(ctx, entity, radius, time, progress) {
  const pull = pullAmount(progress);
  const slide =
    progress < 0.16 ? 1 : progress < 0.42 ? 1 - (progress - 0.16) / 0.26 : progress < 0.84 ? 0 : (progress - 0.84) / 0.16;
  const alpha =
    progress < 0.16 ? 0 : progress < 0.42 ? (progress - 0.16) / 0.26 : progress < 0.84 ? 1 : Math.max(0, 1 - (progress - 0.84) / 0.16);

  drawRagdollRipcord(ctx, entity, time, {
    anchorX: 0,
    anchorY: radius * (0.92 - pull * 0.55),
    length: radius * 1.3,
    segments: 6,
    cordColor: '#2a2f36',
    handleColor: '#c7ccd2',
    handleW: radius * 0.3,
    handleH: radius * 0.44,
  });

  const sliding = progress >= 0.14 && progress < 0.48;
  let armX;
  let armY;
  let reach;
  if (sliding) {
    armX = slide * radius * 4.5 - radius * 0.4;
    armY = 0;
    reach = 1;
  } else {
    armX = 0;
    armY = radius * (0.92 - pull * 0.55);
    reach = pull;
  }
  drawFinArm(ctx, entity.color ?? '#63e6ff', radius, armX, armY, reach);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(slide * radius * 4.5, 0);
  drawChainFin(ctx, radius, time, { ventColor: entity.color ?? '#6f7c86' });
  ctx.restore();

  if (pull > 0.02) {
    ctx.save();
    ctx.globalAlpha = 0.5 * pull;
    ctx.strokeStyle = 'rgba(255, 225, 120, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, radius * 0.92, radius * (0.9 - pull * 0.5), 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}

function drawFinArm(ctx, color, radius, targetX, targetY, reach) {
  if (reach <= 0.02) return;
  const baseX = radius * 0.1;
  const baseY = radius * 0.05;
  const midX = (baseX + targetX) / 2 + radius * 0.5 * (0.4 + reach * 0.6);
  const midY = (baseY + targetY) / 2;
  ctx.save();
  ctx.globalAlpha = Math.min(1, 0.35 + reach * 0.75);
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(midX, midY, targetX, targetY);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(targetX, targetY, radius * 0.2, radius * 0.11, 0.7, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 20, 30, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawSpinEmote(ctx, entity, radius, progress) {
  const env = envelope(progress);
  const spin = progress * Math.PI * 4;
  ctx.save();
  ctx.globalAlpha = env;
  ctx.strokeStyle = entity.color ?? '#63e6ff';
  ctx.lineWidth = radius * 0.16;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const a0 = spin + i * (TAU / 3);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.7, a0, a0 + 1.1);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let i = 0; i < 6; i += 1) {
    const a = spin * 1.4 + i * (TAU / 6);
    const r = radius * 1.95;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, radius * 0.09, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawBoopEmote(ctx, entity, radius, progress) {
  const env = envelope(progress);
  if (env <= 0) return;
  const t = Math.min(1, Math.max(0, (progress - 0.15) / 0.5));
  const ex = radius * (1.3 + t * 0.9);
  const ey = -radius * 0.15 - t * radius * 0.9;
  const pop = Math.sin(Math.min(1, t) * Math.PI);
  ctx.save();
  ctx.globalAlpha = env * (0.4 + pop * 0.6);
  drawHeart(ctx, ex, ey, radius * (0.35 + pop * 0.3), '#ff6b9d');
  ctx.strokeStyle = entity.color ?? '#63e6ff';
  ctx.lineWidth = radius * 0.1;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const sx = radius * (0.9 + i * 0.12);
    const sy = -radius * 0.35 + i * radius * 0.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + radius * (0.5 - i * 0.1), sy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTailEmote(ctx, entity, radius, progress) {
  const env = envelope(progress);
  if (env <= 0) return;
  ctx.save();
  ctx.globalAlpha = env;
  ctx.strokeStyle = entity.color ?? '#63e6ff';
  ctx.lineWidth = radius * 0.14;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const y = -radius * 0.6 + i * radius * 0.55;
    const wiggle = Math.sin(progress * Math.PI * 10 + i) * radius * 0.3;
    ctx.beginPath();
    ctx.moveTo(-radius * 1.1, y);
    ctx.quadraticCurveTo(-radius * 1.8, y + wiggle, -radius * 2.5, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < 3; i += 1) {
    const nx = -radius * (1.4 + i * 0.5);
    const ny = -radius * (0.9 + ((progress * 3 + i * 0.4) % 1) * 1.4);
    drawNote(ctx, nx, ny, radius * 0.28);
  }
  ctx.restore();
}

function drawBubbleEmote(ctx, entity, radius, progress) {
  const env = envelope(progress);
  if (env <= 0) return;
  ctx.save();
  ctx.globalAlpha = env;
  ctx.strokeStyle = 'rgba(207, 239, 255, 0.9)';
  ctx.fillStyle = 'rgba(143, 208, 239, 0.28)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i += 1) {
    const f = (progress * 1.8 + i / 7) % 1;
    const bx = radius * (0.9 + (i % 3) * 0.55) + Math.sin(f * TAU + i) * radius * 0.15;
    const by = radius * 0.1 - f * radius * 2.6;
    const r = radius * (0.16 + (i % 2) * 0.08);
    ctx.globalAlpha = env * (1 - f) * 0.9;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.6);
  ctx.bezierCurveTo(-size * 1.1, -size * 0.2, -size * 0.4, -size * 0.95, 0, -size * 0.25);
  ctx.bezierCurveTo(size * 0.4, -size * 0.95, size * 1.1, -size * 0.2, 0, size * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawNote(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.42, size * 0.3, -0.4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = size * 0.14;
  ctx.beginPath();
  ctx.moveTo(size * 0.32, -size * 0.1);
  ctx.lineTo(size * 0.32, -size);
  ctx.quadraticCurveTo(size * 0.7, -size * 0.7, size * 0.55, -size * 0.5);
  ctx.stroke();
  ctx.restore();
}
