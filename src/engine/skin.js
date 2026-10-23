import { SKINS } from '../config.js';
import { TAU } from './math.js';

const catalog = new Map(SKINS.map((skin) => [skin.key, skin]));
const NATURAL = catalog.get('natural');

let active = NATURAL;
let clock = 0;

export function skinByKey(key) {
  return catalog.get(key) ?? NATURAL;
}

export function skinCatalog() {
  return SKINS;
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
  return skin[slot] ?? null;
}

export function playerColor(slot, fallback) {
  return skinColor(active, slot, clock) ?? fallback;
}

export function drawSkinAura(ctx, entity) {
  if (!active || active.key === 'natural') return;
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
    return;
  }
  if (active.special === 'rainbow') {
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
  }
}
