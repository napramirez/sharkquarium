import { TAU } from './math.js';
import { TRAILS } from '../config.js';

const catalog = new Map(TRAILS.map((entry) => [entry.key, entry]));
const NONE = catalog.get('none');
const states = new WeakMap();

let active = NONE;

export function trailByKey(key) {
  return catalog.get(key) ?? NONE;
}

export function trailCatalog() {
  return TRAILS;
}

export function setActiveTrail(trail) {
  active = trail && trail.key !== 'none' ? trail : NONE;
}

function drawBubbles(ctx, points, radius) {
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const t = i / Math.max(1, points.length - 1);
    const wobble = Math.sin(point.a * 3.4 + i * 1.7) * radius * 0.5;
    ctx.globalAlpha = 0.16 + t * 0.5;
    ctx.beginPath();
    ctx.arc(point.x + wobble, point.y, radius * (0.18 + t * 0.4), 0, TAU);
    ctx.fillStyle = 'rgba(207, 239, 255, 0.35)';
    ctx.fill();
    ctx.strokeStyle = '#cfefff';
    ctx.lineWidth = radius * 0.07;
    ctx.stroke();
  }
}

function drawStardust(ctx, points, radius) {
  for (let i = 0; i < points.length; i += 1) {
    if (i % 2 !== 0) continue;
    const point = points[i];
    const t = i / Math.max(1, points.length - 1);
    const twinkle = 0.45 + 0.55 * Math.sin(point.a * 7 + i * 2.1);
    const size = radius * (0.24 + t * 0.36) * twinkle;
    ctx.globalAlpha = 0.25 + t * 0.6;
    ctx.fillStyle = i % 4 === 0 ? '#fff7dd' : '#ffd166';
    ctx.beginPath();
    ctx.moveTo(point.x, point.y - size);
    ctx.quadraticCurveTo(point.x, point.y, point.x + size, point.y);
    ctx.quadraticCurveTo(point.x, point.y, point.x, point.y + size);
    ctx.quadraticCurveTo(point.x, point.y, point.x - size, point.y);
    ctx.quadraticCurveTo(point.x, point.y, point.x, point.y - size);
    ctx.fill();
  }
}

function drawInk(ctx, points, radius) {
  for (let i = 0; i < points.length; i += 2) {
    const point = points[i];
    const t = i / Math.max(1, points.length - 1);
    const puff = Math.sin(point.a * 2.1 + i) * radius * 0.22;
    ctx.globalAlpha = 0.1 + (1 - t) * 0.22;
    ctx.beginPath();
    ctx.arc(point.x, point.y + puff, radius * (0.7 + t * 0.7), 0, TAU);
    ctx.fillStyle = '#1b1430';
    ctx.fill();
  }
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < points.length; i += 3) {
    const point = points[i];
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 0.22, 0, TAU);
    ctx.fillStyle = '#473a6e';
    ctx.fill();
  }
}

function drawCrackle(ctx, points, radius) {
  ctx.lineCap = 'round';
  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1];
    const to = points[i];
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const nx = -(to.y - from.y);
    const ny = to.x - from.x;
    const length = Math.hypot(nx, ny) || 1;
    const jitter = Math.sin(from.a * 31 + i * 4.7) * radius * 0.55;
    const t = i / Math.max(1, points.length - 1);
    ctx.globalAlpha = 0.2 + t * 0.7;
    for (const [color, width, scale] of [
      ['rgba(255, 209, 102, 0.4)', radius * 0.42, 1.6],
      ['#ffd166', radius * 0.16, 1],
      ['#fff7dd', radius * 0.07, 0.6],
    ]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(
        midX + (nx / length) * jitter * scale,
        midY + (ny / length) * jitter * scale,
      );
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }
}

function drawRibbon(ctx, points, radius) {
  if (points.length < 2) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 1; i < points.length; i += 1) {
      const from = points[i - 1];
      const to = points[i];
      const t = i / (points.length - 1);
      const hue = (from.a * 150 + i * 24) % 360;
      ctx.globalAlpha = pass === 0 ? 0.28 + t * 0.3 : 0.5 + t * 0.5;
      ctx.strokeStyle = `hsl(${hue}, 90%, ${pass === 0 ? 62 : 74}%)`;
      ctx.lineWidth = radius * (pass === 0 ? 0.9 : 0.42) * (0.25 + t * 0.85);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }
}

export function drawTrail(ctx, entity) {
  if (!active || active.key === 'none') return;
  let state = states.get(entity);
  if (!state) {
    state = { points: [], lastAge: entity.age };
    states.set(entity, state);
  }
  let dt = entity.age - state.lastAge;
  if (!(dt > 0.0001 && dt < 0.1)) dt = 1 / 60;
  state.lastAge = entity.age;
  const points = state.points;
  const last = points[points.length - 1];
  if (!last || Math.hypot(entity.x - last.x, entity.y - last.y) > 90) points.length = 0;
  points.push({ x: entity.x, y: entity.y, a: entity.age });
  const cap = active.key === 'ribbon' ? 16 : 12;
  while (points.length > cap) points.shift();
  if (points.length < 2) return;
  const radius = entity.radius ?? 16;
  ctx.save();
  ctx.globalAlpha = 1;
  if (active.key === 'bubblestream') drawBubbles(ctx, points, radius);
  else if (active.key === 'stardust') drawStardust(ctx, points, radius);
  else if (active.key === 'inkpuff') drawInk(ctx, points, radius);
  else if (active.key === 'crackle') drawCrackle(ctx, points, radius);
  else if (active.key === 'ribbon') drawRibbon(ctx, points, radius);
  ctx.restore();
}
