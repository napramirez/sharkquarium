import { AURAS, COLORS } from '../config.js';
import { TAU } from './math.js';

const catalog = new Map(AURAS.map((entry) => [entry.key, entry]));
const NONE = catalog.get('none');

let active = NONE;

export function auraByKey(key) {
  return catalog.get(key) ?? NONE;
}

export function auraCatalog() {
  return AURAS;
}

export function auraForShop(shop) {
  const key =
    shop?.aura ?? ((shop?.passes ?? []).includes('playpass5') ? 'eelaura' : 'none');
  return auraByKey(key);
}

export function setActiveAura(next) {
  active = next ?? NONE;
}

export function drawAuraRing(ctx, entity, palette, time) {
  if (active.key === 'none') return;
  const rainbow = Boolean(palette?.rainbow);
  if (active.key === 'eelaura') drawEelRing(ctx, entity, rainbow, time);
  else if (active.key === 'bubbleaura') drawBubbleRing(ctx, entity, rainbow, time);
  else if (active.key === 'neonaura') drawNeonRing(ctx, entity, rainbow, time);
  else if (active.key === 'stingrayaura') drawStingrayRing(ctx, entity, rainbow, time);
  else if (active.key === 'tridentaura') drawTridentRing(ctx, entity, rainbow, time);
  else if (active.key === 'karambitaura') drawKarambitRing(ctx, entity, palette, time);
  else if (active.key === 'sharkaura') drawSharkRing(ctx, entity, rainbow, time);
  else if (active.key === 'swordaura') drawSwordRing(ctx, entity, rainbow, time);
  else if (active.key === 'octopusaura') drawOctopusRing(ctx, entity, rainbow, time);
}

function orbitPoint(entity, angle, orbit) {
  return {
    x: entity.x + Math.cos(angle) * orbit,
    y: entity.y + Math.sin(angle) * orbit * 0.9,
  };
}

function ringHue(time, index) {
  return (time * 140 + index * 120) % 360;
}

function drawEelRing(ctx, entity, rainbow, time) {
  const orbit = entity.radius * 1.95;
  const length = entity.radius * 1.2;
  for (let index = 0; index < 3; index += 1) {
    const angle = time * 1.5 + (index * TAU) / 3;
    const hue = ringHue(time, index);
    const body = rainbow ? `hsl(${hue}, 85%, 58%)` : '#101018';
    const ridge = rainbow
      ? `hsl(${hue}, 90%, 74%)`
      : `rgba(255, 59, 74, ${(0.5 + 0.5 * Math.sin(time * 6 + index * 2)).toFixed(3)})`;
    const point = orbitPoint(entity, angle, orbit);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.lineCap = 'round';
    let x = 0;
    let y = 0;
    for (let i = 0; i < 4; i += 1) {
      const segment = Math.sin(time * 6 + index * 2 + i) * 0.28;
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
    ctx.rotate(Math.sin(time * 6 + index * 2 + 3) * 0.28);
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

function drawNeonRing(ctx, entity, rainbow, time) {
  const orbit = entity.radius * 1.95;
  const length = entity.radius * 1.3;
  const width = entity.radius * 0.15;
  for (let index = 0; index < 3; index += 1) {
    const angle = time * 1.6 + (index * TAU) / 3;
    const hue = rainbow ? ringHue(time, index) : index % 2 === 0 ? 190 : 315;
    const glow = `hsl(${hue}, 100%, 60%)`;
    const core = `hsl(${hue}, 100%, ${rainbow ? 78 : 92}%)`;
    const spin = Math.sin(time * 5 + index) * 0.16;
    const point = orbitPoint(entity, angle, orbit);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle + Math.PI / 2 + spin);
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = glow;
    ctx.lineWidth = width * 2.8;
    ctx.beginPath();
    ctx.moveTo(-length * 0.5, 0);
    ctx.lineTo(length * 0.5, 0);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = width * 1.5;
    ctx.beginPath();
    ctx.moveTo(-length * 0.5, 0);
    ctx.lineTo(length * 0.5, 0);
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = core;
    ctx.lineWidth = width * 0.6;
    ctx.beginPath();
    ctx.moveTo(-length * 0.5, 0);
    ctx.lineTo(length * 0.5, 0);
    ctx.stroke();
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(length * 0.5, 0, width * 1.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = core;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(length * 0.5, 0, width * 0.7, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawKarambitRing(ctx, entity, palette, time) {
  const rainbow = Boolean(palette?.rainbow);
  const orbit = entity.radius * 1.9;
  const r = entity.radius * 0.52;
  for (let index = 0; index < 3; index += 1) {
    const angle = time * 1.4 + (index * TAU) / 3 - 0.24;
    const hue = ringHue(time, index);
    const pulse = 0.4 + 0.3 * Math.sin(time * 6 + index * 2);
    const glow = rainbow ? `hsl(${hue}, 90%, 60%)` : palette?.accent ?? '#ff3b4a';
    const blade = rainbow ? `hsl(${hue}, 80%, 52%)` : palette?.body ?? '#c23b4a';
    const edge = rainbow ? `hsl(${hue}, 90%, 76%)` : palette?.accent ?? '#ff5a66';
    const loop = rainbow ? `hsl(${hue}, 90%, 70%)` : palette?.accent ?? '#ff3b4a';
    const point = orbitPoint(entity, angle, orbit);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.lineCap = 'round';
    ctx.strokeStyle = glow;
    ctx.globalAlpha = pulse;
    ctx.lineWidth = entity.radius * 0.1;
    ctx.beginPath();
    ctx.moveTo(r * 1.15, 0);
    ctx.quadraticCurveTo(r * 0.1, -r * 1.05, -r * 0.75, -r * 0.15);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(r * 1.15, 0);
    ctx.quadraticCurveTo(r * 0.1, -r * 1.05, -r * 0.75, -r * 0.15);
    ctx.quadraticCurveTo(r * 0.15, -r * 0.5, r * 1.15, 0);
    ctx.closePath();
    ctx.fillStyle = blade;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = entity.radius * 0.05;
    ctx.stroke();
    ctx.strokeStyle = '#20242c';
    ctx.lineWidth = entity.radius * 0.14;
    ctx.beginPath();
    ctx.moveTo(-r * 0.75, -r * 0.15);
    ctx.lineTo(-r * 1.1, r * 0.35);
    ctx.stroke();
    ctx.strokeStyle = loop;
    ctx.lineWidth = entity.radius * 0.05;
    ctx.beginPath();
    ctx.arc(-r * 1.2, r * 0.48, entity.radius * 0.1, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

function drawStingrayRing(ctx, entity, rainbow, time) {
  const orbit = entity.radius * 1.95;
  const r = entity.radius * 0.5;
  for (let index = 0; index < 3; index += 1) {
    const angle = time * 1.5 + (index * TAU) / 3;
    const hue = ringHue(time, index);
    const body = rainbow ? `hsl(${hue}, 80%, 62%)` : COLORS.stingray;
    const accent = rainbow ? `hsl(${hue}, 85%, 78%)` : COLORS.sharkFin;
    const point = orbitPoint(entity, angle, orbit);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.lineCap = 'round';
    ctx.strokeStyle = accent;
    ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, 0);
    ctx.quadraticCurveTo(
      -r * 1.35,
      Math.sin(time * 3 + index) * r * 0.5,
      -r * 1.9,
      Math.sin(time * 3 + index + 1) * r * 0.35,
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.95, 0);
    ctx.quadraticCurveTo(r * 0.3, -r * 1.05, -r * 0.5, -r * 0.75);
    ctx.quadraticCurveTo(-r * 0.75, 0, -r * 0.5, r * 0.75);
    ctx.quadraticCurveTo(r * 0.3, r * 1.05, r * 0.95, 0);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = r * 0.1;
    ctx.stroke();
    ctx.fillStyle = rainbow ? '#f4fbff' : '#10233a';
    ctx.beginPath();
    ctx.arc(r * 0.5, -r * 0.24, r * 0.11, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.5, r * 0.24, r * 0.11, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawSwordRing(ctx, entity, rainbow, time) {
  const orbit = entity.radius * 1.9;
  const length = entity.radius * 1.1;
  const blade = entity.radius * 0.11;
  for (let index = 0; index < 3; index += 1) {
    const angle = time * 1.4 + (index * TAU) / 3 - 0.3;
    const hue = ringHue(time, index);
    const steel = rainbow ? `hsl(${hue}, 70%, 72%)` : '#c9d4e4';
    const edge = rainbow ? `hsl(${hue}, 90%, 82%)` : '#f4fbff';
    const point = orbitPoint(entity, angle, orbit);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(length, 0);
    ctx.lineTo(length * 0.25, -blade);
    ctx.lineTo(-length * 0.15, -blade * 0.8);
    ctx.lineTo(-length * 0.15, blade * 0.8);
    ctx.lineTo(length * 0.25, blade);
    ctx.closePath();
    ctx.fillStyle = steel;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = entity.radius * 0.045;
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-length * 0.22, -blade * 2, length * 0.08, blade * 4);
    ctx.fillStyle = '#31363f';
    ctx.fillRect(-length * 0.5, -blade * 0.6, length * 0.3, blade * 1.2);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(-length * 0.55, 0, entity.radius * 0.09, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawBubbleRing(ctx, entity, rainbow, time) {
  const orbit = entity.radius * 1.9;
  for (let index = 0; index < 12; index += 1) {
    const hue = ringHue(time, index);
    const angle = time * 0.9 + (index / 12) * TAU;
    const bob = Math.sin(time * 4 + index * 1.7) * entity.radius * 0.25;
    const size = entity.radius * (0.12 + 0.045 * ((index * 7) % 3));
    const x = entity.x + Math.cos(angle) * orbit;
    const y = entity.y + Math.sin(angle) * orbit * 0.9 - bob;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = rainbow ? `hsl(${hue}, 85%, 75%)` : COLORS.bubble;
    ctx.lineWidth = Math.max(1, entity.radius * 0.05);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = rainbow ? `hsl(${hue}, 90%, 85%)` : 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(
      x - size * 0.32,
      y - size * 0.36,
      Math.max(0.8, size * 0.22),
      0,
      TAU,
    );
    ctx.fill();
    ctx.restore();
  }
}

function drawTridentRing(ctx, entity, rainbow, time) {
  const orbit = entity.radius * 1.9;
  const length = entity.radius * 1.15;
  for (let index = 0; index < 3; index += 1) {
    const angle = time * 1.3 + (index * TAU) / 3 - 0.2;
    const hue = ringHue(time, index);
    const steel = rainbow ? `hsl(${hue}, 80%, 74%)` : '#c9d4e4';
    const edge = rainbow ? `hsl(${hue}, 90%, 84%)` : '#f4fbff';
    const point = orbitPoint(entity, angle, orbit);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.lineCap = 'round';
    ctx.strokeStyle = steel;
    ctx.lineWidth = entity.radius * 0.1;
    ctx.beginPath();
    ctx.moveTo(-length * 0.7, 0);
    ctx.lineTo(length * 0.5, 0);
    ctx.stroke();
    ctx.lineWidth = entity.radius * 0.07;
    ctx.beginPath();
    ctx.moveTo(length * 0.5, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(length * 0.42, side * entity.radius * 0.34);
      ctx.quadraticCurveTo(
        length * 0.82,
        side * entity.radius * 0.36,
        length * 0.92,
        side * entity.radius * 0.08,
      );
      ctx.stroke();
    }
    ctx.strokeStyle = edge;
    ctx.lineWidth = entity.radius * 0.04;
    ctx.beginPath();
    ctx.moveTo(-length * 0.7, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-length * 0.06, -entity.radius * 0.12, length * 0.14, entity.radius * 0.24);
    ctx.restore();
  }
}

function drawSharkRing(ctx, entity, rainbow, time) {
  const orbit = entity.radius * 1.95;
  const s = entity.radius * 0.5;
  for (let index = 0; index < 3; index += 1) {
    const angle = time * 1.5 + (index * TAU) / 3;
    const hue = ringHue(time, index);
    const body = rainbow ? `hsl(${hue}, 70%, 62%)` : COLORS.shark;
    const fin = rainbow ? `hsl(${hue}, 75%, 50%)` : COLORS.sharkFin;
    const point = orbitPoint(entity, angle, orbit);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.save();
    ctx.translate(-s * 0.95, 0);
    ctx.rotate(Math.sin(time * 6 + index) * 0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-s * 0.6, -s * 0.45);
    ctx.lineTo(-s * 0.5, 0);
    ctx.lineTo(-s * 0.6, s * 0.45);
    ctx.closePath();
    ctx.fillStyle = fin;
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.05, s * 0.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rainbow ? 'rgba(255, 255, 255, 0.75)' : COLORS.sharkBelly;
    ctx.beginPath();
    ctx.ellipse(s * 0.12, s * 0.22, s * 0.68, s * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = fin;
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.55);
    ctx.lineTo(s * 0.14, -s * 1.12);
    ctx.lineTo(s * 0.42, -s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4fbff';
    ctx.beginPath();
    ctx.arc(s * 0.7, -s * 0.18, s * 0.14, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(s * 0.74, -s * 0.18, s * 0.07, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawOctopusRing(ctx, entity, rainbow, time) {
  const orbit = entity.radius * 1.9;
  for (let index = 0; index < 3; index += 1) {
    const angle = time * 1.2 + (index * TAU) / 3;
    const hue = ringHue(time, index);
    const point = orbitPoint(entity, angle, orbit);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.lineCap = 'round';
    let x = 0;
    let y = 0;
    let curl = 0;
    for (let i = 1; i <= 5; i += 1) {
      curl += 0.5 + Math.sin(time * 5 + index * 2 + i * 1.3) * 0.35;
      const nx = x + Math.cos(curl) * entity.radius * 0.34;
      const ny = y + Math.sin(curl) * entity.radius * 0.34;
      ctx.strokeStyle = rainbow
        ? `hsl(${hue}, 80%, ${64 - i * 4}%)`
        : i < 4
          ? COLORS.octopus
          : COLORS.octopusAlert;
      ctx.lineWidth = entity.radius * (0.3 - i * 0.05);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.fillStyle = rainbow ? `hsl(${hue}, 90%, 84%)` : '#f2c1d2';
      ctx.beginPath();
      ctx.arc(
        nx + Math.cos(curl - Math.PI / 2) * entity.radius * 0.11,
        ny + Math.sin(curl - Math.PI / 2) * entity.radius * 0.11,
        Math.max(0.8, entity.radius * 0.05),
        0,
        TAU,
      );
      ctx.fill();
      x = nx;
      y = ny;
    }
    ctx.restore();
  }
}
