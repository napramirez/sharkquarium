import { TAU } from '../engine/math.js';
import { mode3D, hiddenEntity } from '../engine/mode3d.js';
import { seasonOn, currentSeason } from '../engine/season.js';

export class Entity {
  constructor(options = {}) {
    const { x = 0, y = 0, radius = 16 } = options;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.age = 0;
    this.alive = true;
    this.facing = 1;
    const draw = this.render.bind(this);
    const entity = this;
    this._draw = draw;
    this.render = function renderEntity(ctx) {
      if (hiddenEntity() === entity) return;
      if (mode3D()) drawEntity3D(ctx, entity, draw);
      else draw(ctx);
      if (entity.santa && seasonOn()) {
        if (typeof entity.santaHat === 'function') entity.santaHat(ctx);
        else {
          const r = entity.radius ?? 12;
          drawSeasonHat(ctx, entity.x, entity.y - r * 0.92, r, currentSeason());
        }
      }
    };
  }

  update(dt) {
    this.age += dt;
  }

  updateFacing(threshold = 6) {
    if (this.vx > threshold) this.facing = 1;
    else if (this.vx < -threshold) this.facing = -1;
  }

  render(_ctx) {}

  kill() {
    this.alive = false;
  }
}

function drawEntity3D(ctx, entity, draw) {
  const radius = entity.radius ?? 12;
  const depth = Math.max(3, radius * 0.16);
  drawEntityShadow(ctx, entity, radius, depth);
  if (entity.sphere3D) {
    drawEntitySphere(ctx, entity, radius, entity.sphere3D);
    return;
  }
  if (entity.flat3D || radius > 64) {
    draw(ctx);
    return;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowOffsetX = depth * 0.55;
  ctx.shadowOffsetY = depth;
  ctx.shadowBlur = 0;
  draw(ctx);
  ctx.restore();
}

function drawEntityShadow(ctx, entity, radius, depth) {
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(
    entity.x - depth * 0.3,
    entity.y + radius * 0.9 + depth * 0.5,
    radius * 1.05,
    Math.max(2, radius * 0.32),
    0,
    0,
    TAU,
  );
  ctx.fill();
  ctx.restore();
}

function drawEntitySphere(ctx, entity, radius, kind) {  const golden = kind === 'golden';
  const gradient = ctx.createRadialGradient(
    entity.x - radius * 0.34,
    entity.y - radius * 0.38,
    radius * 0.12,
    entity.x,
    entity.y,
    radius * 1.06,
  );
  if (golden) {
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
    gradient.addColorStop(0.45, 'rgba(255, 214, 102, 0.7)');
    gradient.addColorStop(1, 'rgba(190, 130, 20, 0.45)');
  } else {
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    gradient.addColorStop(0.45, 'rgba(207, 239, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(96, 160, 200, 0.32)');
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(entity.x, entity.y, radius, 0, TAU);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = golden ? 'rgba(255, 226, 150, 0.85)' : 'rgba(207, 239, 255, 0.75)';
  ctx.lineWidth = Math.max(1, radius * 0.08);
  ctx.stroke();
  ctx.restore();
}

export function drawSeasonHat(ctx, x, y, r, season) {
  if (season === 'halloween') {
    drawWitchHat(ctx, x, y, r);
    return;
  }
  if (season === 'newyear') {
    drawPartyHat(ctx, x, y, r);
    return;
  }
  drawSantaHat(ctx, x, y, r);
}

function drawSantaHat(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = '#d33a3a';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.72, y);
  ctx.lineTo(x + r * 0.72, y);
  ctx.lineTo(x + r * 0.26, y - r * 1.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f7f7f7';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.84, r * 0.24, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.26, y - r * 1.45, r * 0.26, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawWitchHat(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = '#211a2e';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.62, y);
  ctx.quadraticCurveTo(x - r * 0.1, y - r * 1.2, x + r * 0.74, y - r * 1.85);
  ctx.quadraticCurveTo(x + r * 0.4, y - r * 0.9, x + r * 0.62, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7b3fa0';
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.15, r * 0.66, r * 0.18, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.strokeRect(x - r * 0.15, y - r * 0.29, r * 0.3, r * 0.28);
  ctx.fillStyle = '#2a2140';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.98, r * 0.26, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawPartyHat(ctx, x, y, r) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y);
  ctx.lineTo(x + r * 0.6, y);
  ctx.lineTo(x, y - r * 1.55);
  ctx.closePath();
  ctx.fillStyle = '#2b6cff';
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(1, r * 0.11);
  for (let i = 1; i <= 2; i += 1) {
    const t = i / 3;
    const half = r * 0.6 * (1 - t);
    ctx.beginPath();
    ctx.moveTo(x - half, y - r * 1.55 * t);
    ctx.lineTo(x + half, y - r * 1.55 * t);
    ctx.stroke();
  }
  ctx.fillStyle = '#ff5c8a';
  ctx.beginPath();
  ctx.arc(x, y - r * 1.62, r * 0.27, 0, TAU);
  ctx.fill();
  ctx.restore();
}
