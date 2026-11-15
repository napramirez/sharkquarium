import { TAU } from './math.js';
import { TRAILS } from '../config.js';

const catalog = new Map(TRAILS.map((entry) => [entry.key, entry]));
const NONE = catalog.get('none');
const states = new WeakMap();

let active = NONE;
let flareHandler = null;

export function setTrailFlareHandler(handler) {
  flareHandler = handler ?? null;
}

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

function pseudoRandom(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function chaosBolt(ctx, x, y, angle, length, jitter, seed, phase, width, alpha, boost = 0) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = -dy;
  const ny = dx;
  const segs = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= segs; i += 1) {
    const u = i / segs;
    const off = i === 0 || i === segs ? 0 : Math.sin(phase * 17 + seed + i * 2.7) * jitter;
    const px = x + dx * (u - 0.5) * length + nx * off;
    const py = y + dy * (u - 0.5) * length + ny * off;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  const w = width * (1 + boost * 0.8);
  const a = Math.min(1, alpha * (1 + boost * 1.5));
  ctx.globalAlpha = 0.32 * a;
  ctx.strokeStyle = '#ff4b4b';
  ctx.lineWidth = Math.max(1, w * 2.3);
  ctx.stroke();
  ctx.globalAlpha = a;
  ctx.strokeStyle = '#ff2b2b';
  ctx.lineWidth = Math.max(1, w);
  ctx.stroke();
  if (boost > 0.02) {
    ctx.globalAlpha = Math.min(1, a * 0.85 * boost);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.2, w * 0.55);
    ctx.stroke();
  }
}

function spawnChaosSpark(state, points, radius, age, options = {}) {
  const back = Math.floor(Math.random() * 3);
  const anchor = points[Math.max(0, points.length - 1 - back)];
  if (!anchor) return;
  const scale = options.scale ?? 1;
  const spread = options.spread ?? 0.9;
  state.sparks.push({
    x: anchor.x + (options.dx ?? 0) + (Math.random() - 0.5) * radius * spread,
    y: anchor.y + (options.dy ?? 0) + (Math.random() - 0.5) * radius * spread,
    born: age,
    life: 1.7,
    children: 2,
    seed: Math.random() * TAU,
    angle: options.angle ?? Math.random() * TAU,
    length: radius * (1.1 + Math.random() * 0.9) * scale,
    jitter: radius * (0.3 + Math.random() * 0.3) * scale,
    widthScale: scale,
  });
}

function makeChild(parent, age) {
  return {
    x: parent.x + (Math.random() - 0.5) * parent.length * 0.7,
    y: parent.y + (Math.random() - 0.5) * parent.length * 0.7,
    born: age,
    life: 0.42,
    children: 0,
    seed: Math.random() * TAU,
    angle: parent.angle + (Math.random() - 0.5) * 1.6,
    length: parent.length * (0.32 + Math.random() * 0.26),
    jitter: parent.jitter * 0.55,
    widthScale: (parent.widthScale ?? 1) * 0.45,
  };
}

function spawnChaosBurst(state, points, radius, age) {
  const last = points[points.length - 1];
  const prev = points[points.length - 2] ?? last;
  let dirX = 1;
  let dirY = 0;
  if (last && prev) {
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const length = Math.hypot(dx, dy) || 1;
    dirX = dx / length;
    dirY = dy / length;
  }
  const dir = Math.atan2(dirY, dirX);
  const perpX = -dirY;
  const perpY = dirX;
  const along = (Math.random() - 0.5) * radius * 0.6;
  spawnChaosSpark(state, points, radius, age, {
    scale: 1.15 + Math.random() * 0.45,
    angle: dir + (Math.random() - 0.5) * 0.5,
    dx: dirX * along,
    dy: dirY * along,
    spread: 0.5,
  });
  const sides = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < sides; i += 1) {
    const sign = Math.random() < 0.5 ? 1 : -1;
    const lateral = radius * (0.3 + Math.random() * 1.2);
    const alongOff = (Math.random() - 0.5) * radius * 1.2;
    spawnChaosSpark(state, points, radius, age, {
      scale: 0.32 + Math.random() * 0.42,
      angle: dir + (Math.random() - 0.5) * 1.3,
      dx: perpX * lateral * sign + dirX * alongOff,
      dy: perpY * lateral * sign + dirY * alongOff,
      spread: 0.5,
    });
  }
}

function drawChaosSparks(ctx, sparks, radius, age, flare = 0) {
  for (const spark of sparks) {
    const life = spark.life ?? 2;
    const t = (age - spark.born) / life;
    if (t < 0 || t >= 1) continue;
    const fade = t < 0.08 ? t / 0.08 : t > 0.6 ? (1 - t) / 0.4 : 1;
    const alpha = Math.max(0, Math.min(1, fade));
    const flicker = 0.72 + 0.28 * Math.sin(age * 40 + spark.seed * 11);
    const width = radius * 0.15 * (spark.widthScale ?? 1) * flicker;
    chaosBolt(ctx, spark.x, spark.y, spark.angle, spark.length, spark.jitter, spark.seed, age, width, alpha, flare);
  }
  ctx.globalAlpha = 1;
}

function drawPlayerCrackle(ctx, entity, radius, age, moving, flare = 0) {
  const bucket = Math.floor(age * 16);
  const count = moving ? 8 : 4;
  const boost = (moving ? 1.25 : 1) * (1 + flare * 0.6);
  for (let i = 0; i < count; i += 1) {
    const r1 = pseudoRandom(bucket * 3 + i * 7 + 1);
    const r2 = pseudoRandom(bucket * 5 + i * 13 + 2);
    const r3 = pseudoRandom(bucket * 7 + i * 11 + 3);
    const a = r1 * TAU;
    const px = entity.x + Math.cos(a) * radius * (0.6 + r2 * 0.35);
    const py = entity.y + Math.sin(a) * radius * (0.6 + r2 * 0.35);
    const tangent = a + Math.PI / 2 + (r3 - 0.5) * 1.2;
    const length = radius * (0.5 + r3 * 0.7) * boost;
    const alpha = (0.5 + 0.5 * r2) * boost;
    chaosBolt(ctx, px, py, tangent, length, radius * 0.22, r1 * TAU, age, radius * 0.13, Math.min(1, alpha), flare);
  }
  ctx.globalAlpha = 1;
}

function drawChaosVolt(ctx, points, radius, state, entity, dt) {
  if (!state.sparks) {
    state.sparks = [];
    state.sparkTimer = 0;
    state.lastInvuln = entity.invulnerable ?? 0;
    state.flare = 0;
  }
  const invuln = entity.invulnerable ?? 0;
  if (invuln > (state.lastInvuln ?? 0) + 0.01) {
    state.flare = 0.5;
    if (flareHandler) flareHandler();
  }
  state.lastInvuln = invuln;
  state.flare = Math.max(0, (state.flare ?? 0) - dt);
  const flare = state.flare / 0.5;
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const moving = last && prev ? Math.hypot(last.x - prev.x, last.y - prev.y) > 0.6 : false;
  if (moving) {
    state.sparkTimer -= dt;
    if (state.sparkTimer <= 0) {
      state.sparkTimer = 0.16 + Math.random() * 0.1;
      spawnChaosBurst(state, points, radius, entity.age);
    }
  }
  const age = entity.age;
  const sparks = state.sparks;
  const children = state.children ?? (state.children = []);
  children.length = 0;
  let write = 0;
  for (let i = 0; i < sparks.length; i += 1) {
    const spark = sparks[i];
    const life = spark.life ?? 2;
    const t = (age - spark.born) / life;
    if (t < 0) {
      sparks[write++] = spark;
      continue;
    }
    if (t >= 1) {
      const count = spark.children ?? 0;
      for (let c = 0; c < count; c += 1) children.push(makeChild(spark, age));
      continue;
    }
    sparks[write++] = spark;
  }
  sparks.length = write;
  for (let i = 0; i < children.length; i += 1) sparks.push(children[i]);
  if (sparks.length > 44) sparks.splice(0, sparks.length - 44);
  drawChaosSparks(ctx, sparks, radius, age, flare);
  drawPlayerCrackle(ctx, entity, radius, age, moving, flare);
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
  else if (active.key === 'chaosvolt') drawChaosVolt(ctx, points, radius, state, entity, dt);
  else if (active.key === 'ribbon') drawRibbon(ctx, points, radius);
  ctx.restore();
}
