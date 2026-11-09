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

function standAmount(progress) {
  if (progress < 0.14) return progress / 0.14;
  if (progress < 0.86) return 1;
  return Math.max(0, (1 - progress) / 0.14);
}

function pullAmount(progress) {
  const a = Math.max(0, 1 - Math.abs(progress - 0.07) / 0.11);
  const b = Math.max(0, 1 - Math.abs(progress - 0.9) / 0.11);
  return Math.min(1, a + b);
}

export function emoteStand(entity) {
  if (!entity || !entity._emote || entity._emote.key !== 'chainfin') return 0;
  return standAmount(emoteProgress(entity));
}

export function drawEmote(ctx, entity, radius, time) {
  const emote = entity && entity._emote;
  if (!emote) return;
  const progress = emoteProgress(entity);
  if (emote.key === 'chainfin') drawChainFinEmote(ctx, entity, radius, time, progress);
}

function drawChainFinEmote(ctx, entity, radius, time, progress) {
  const pull = pullAmount(progress);

  drawRagdollRipcord(ctx, entity, time, {
    anchorX: 0,
    anchorY: radius * (0.95 - pull * 0.5),
    length: radius * 1.4,
    segments: 6,
    cordColor: '#2a2f36',
    handleColor: '#c7ccd2',
    handleW: radius * 0.3,
    handleH: radius * 0.44,
  });

  drawFinArm(ctx, entity.color ?? '#63e6ff', radius, pull);

  let slide;
  let alpha;
  if (progress < 0.16) {
    slide = 1;
    alpha = 0;
  } else if (progress < 0.42) {
    const k = (progress - 0.16) / 0.26;
    slide = 1 - k;
    alpha = k;
  } else if (progress < 0.84) {
    slide = 0;
    alpha = 1;
  } else {
    const k = (progress - 0.84) / 0.16;
    slide = k;
    alpha = 1 - k;
  }

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
    ctx.arc(0, radius * 0.95, radius * (0.95 - pull * 0.5), 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}

function drawFinArm(ctx, color, radius, reach) {
  const extended = 0.25 + reach * 0.75;
  const tipX = radius * 0.05;
  const tipY = radius * (0.45 + extended * 0.65);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(radius * 0.15, radius * 0.02);
  ctx.quadraticCurveTo(radius * 0.7, radius * 0.45, tipX, tipY);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(tipX, tipY, radius * 0.2, radius * 0.11, 0.7, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 20, 30, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}
