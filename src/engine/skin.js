import { SKINS } from '../config.js';
import { TAU } from './math.js';

const catalog = new Map(SKINS.map((skin) => [skin.key, skin]));
const NATURAL = catalog.get('natural');

let active = NATURAL;
let clock = 0;
let auraUpgrade = false;

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

export function setEelAura(on) {
  auraUpgrade = Boolean(on);
}

export function eelAuraEnabled() {
  return auraUpgrade;
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

export function shadowEyeColor(fallback) {
  return active.special === 'shadow' ? '#f4fbff' : fallback;
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
  }
  if (auraUpgrade && (active.special === 'shadow' || active.special === 'rainbow')) {
    drawEelRing(ctx, entity, active.special === 'rainbow');
  }
}

function drawEelRing(ctx, entity, rainbow) {
  const orbit = entity.radius * 1.95;
  const length = entity.radius * 1.2;
  for (let index = 0; index < 3; index += 1) {
    const angle = clock * 1.5 + (index * TAU) / 3;
    const hue = (clock * 140 + index * 120) % 360;
    const body = rainbow ? `hsl(${hue}, 85%, 58%)` : '#101018';
    const ridge = rainbow
      ? `hsl(${hue}, 90%, 74%)`
      : `rgba(255, 59, 74, ${(0.5 + 0.5 * Math.sin(clock * 6 + index * 2)).toFixed(3)})`;
    ctx.save();
    ctx.translate(
      entity.x + Math.cos(angle) * orbit,
      entity.y + Math.sin(angle) * orbit * 0.9,
    );
    ctx.rotate(angle + Math.PI / 2);
    ctx.lineCap = 'round';
    let x = 0;
    let y = 0;
    for (let i = 0; i < 4; i += 1) {
      const segment = Math.sin(clock * 6 + index * 2 + i) * 0.28;
      const nx = x + Math.cos(segment) * length * 0.3;
      const ny = y + Math.sin(segment) * length * 0.3;
      ctx.strokeStyle = 'rgba(6, 8, 16, 0.8)';
      ctx.lineWidth = entity.radius * (0.34 - i * 0.06);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.strokeStyle = body;
      ctx.lineWidth = entity.radius * (0.24 - i * 0.05);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.strokeStyle = ridge;
      ctx.lineWidth = entity.radius * 0.07;
      ctx.beginPath();
      ctx.moveTo(x, y - entity.radius * 0.09);
      ctx.lineTo(nx, ny - entity.radius * 0.09);
      ctx.stroke();
      x = nx;
      y = ny;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(clock * 6 + index * 2 + 3) * 0.28);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(entity.radius * 0.16, 0, entity.radius * 0.34, entity.radius * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rainbow ? 'rgba(255, 255, 255, 0.85)' : '#f4fbff';
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(
        entity.radius * 0.02 + i * entity.radius * 0.11,
        entity.radius * 0.06,
        entity.radius * 0.055,
        entity.radius * 0.06,
      );
    }
    ctx.fillStyle = rainbow ? '#ffffff' : '#ff3b4a';
    ctx.beginPath();
    ctx.arc(entity.radius * 0.28, -entity.radius * 0.08, entity.radius * 0.07, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}
