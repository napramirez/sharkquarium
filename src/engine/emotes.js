import { EMOTES } from '../config.js';
import { drawRagdollRipcord } from './ripcord.js';
import { drawChainFin } from './chainfin.js';

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

export function drawEmote(ctx, entity, radius, time) {
  const emote = entity && entity._emote;
  if (!emote) return;
  const progress = Math.min(1, emote.t / EMOTE_DURATION);
  if (emote.key === 'chainfin') drawChainFinEmote(ctx, entity, radius, time, progress);
}

function drawChainFinEmote(ctx, entity, radius, time, progress) {
  const pulling = progress < 0.16 || progress > 0.84;
  const pull = progress < 0.16 ? progress / 0.16 : progress > 0.84 ? (1 - progress) / 0.16 : 0;

  drawRagdollRipcord(ctx, entity, time, {
    anchorX: 0,
    anchorY: radius * (0.9 - pull * 0.7),
    length: radius * 1.5,
    segments: 6,
    cordColor: '#2a2f36',
    handleColor: '#c7ccd2',
    handleW: radius * 0.3,
    handleH: radius * 0.44,
  });

  let slide;
  let alpha;
  if (progress < 0.16) {
    slide = 1;
    alpha = 0;
  } else if (progress < 0.42) {
    const k = (progress - 0.16) / 0.26;
    slide = 1 - k;
    alpha = k;
  } else if (progress < 0.78) {
    slide = 0;
    alpha = 1;
  } else {
    const k = (progress - 0.78) / 0.22;
    slide = k;
    alpha = 1 - k;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(slide * radius * 4.5, 0);
  drawChainFin(ctx, radius, time, { ventColor: entity.color ?? '#6f7c86' });
  ctx.restore();

  if (pulling) {
    ctx.save();
    ctx.globalAlpha = 0.55 * (0.4 + pull);
    ctx.strokeStyle = 'rgba(255, 225, 120, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, radius * 0.9, radius * (0.95 - pull * 0.5), 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}
