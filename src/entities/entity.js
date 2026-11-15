import { TAU } from '../engine/math.js';
import { mode3D, hiddenEntity } from '../engine/mode3d.js';
import { seasonOn, currentSeason } from '../engine/season.js';
import { cute, drawCuteBlush, drawCuteHeart, drawCuteFace, cuteBlink } from '../engine/cute.js';

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
    this.blinkSeed = Math.random() * 10;
    this.idleTime = 0;
    this.idleMode = 'rest';
    this.idleNext = 'flip';
    this.idleTimer = 0;
    this.idleRest = 2 + Math.random() * 4;
    this.flipAngle = 0;
    this.bubbleGrow = 0;
    this.bubblePop = 0;
    this.eyeFlinch = 0;
    const draw = this.render.bind(this);
    const entity = this;
    this._draw = draw;
    this.render = function renderEntity(ctx) {
      if (hiddenEntity() === entity) return;
      ctx.save();
      const flip = entity.flipAngle ?? 0;
      if (flip !== 0) {
        ctx.translate(entity.x, entity.y);
        ctx.rotate(flip);
        ctx.translate(-entity.x, -entity.y);
      }
      if (mode3D()) drawEntity3D(ctx, entity, draw);
      else draw(ctx);
      if (entity.idleMode === 'bubble') drawIdleBubble(ctx, entity);
      if (cute() && entity.radius >= 14 && !entity.noCute) {
        if (!entity.controls && entity.radius >= 16 && !entity.noCuteFace) {
          const faceRadius = Math.min(entity.radius, 56) * 0.9;
          drawCuteFace(ctx, entity.x, entity.y, faceRadius, { blink: cuteBlink(entity.age) });
        } else {
          drawCuteBlush(ctx, entity.x, entity.y, entity.radius, 0.45);
        }
        if (entity.radius >= 34) {
          const bob = Math.sin(entity.age * 2 + (entity.x % 6)) * 3;
          drawCuteHeart(ctx, entity.x + entity.radius * 0.9, entity.y - entity.radius * 1.2 + bob, entity.radius * 0.22, 'rgba(255, 143, 192, 0.75)', 0.2);
        }
      }
      if (entity.santa && seasonOn()) {
        if (typeof entity.santaHat === 'function') entity.santaHat(ctx);
        else {
          const r = entity.radius ?? 12;
          drawSeasonHat(ctx, entity.x, entity.y - r * 0.92, r, currentSeason());
        }
      }
      ctx.restore();
    };
  }

  update(dt) {
    this.age += dt;
    let idle = false;
    if (this.controls) {
      const speed = Math.hypot(this.vx ?? 0, this.vy ?? 0);
      if (speed < 10) this.idleTime += dt;
      else this.idleTime = 0;
      idle = !this.noIdleFlip && this.idleTime > 1.5;
    }
    this.updateIdle(dt, idle);
  }

  updateIdle(dt, idle) {
    this.eyeFlinch = Math.max(0, this.eyeFlinch - dt * 2.2);
    this.flipAngle = 0;
    if (!idle) {
      this.idleMode = 'rest';
      this.idleTimer = 0;
      this.bubbleGrow = 0;
      this.bubblePop = 0;
      return;
    }
    if (this.idleMode === 'rest') {
      this.idleTimer += dt;
      if (this.idleTimer >= this.idleRest) {
        this.idleTimer = 0;
        this.idleMode = this.idleNext;
        this.idleNext = this.idleMode === 'flip' ? 'bubble' : 'flip';
      }
    } else if (this.idleMode === 'flip') {
      this.idleTimer += dt;
      const u = Math.min(1, this.idleTimer / 3.7);
      const eased = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      this.flipAngle = -eased * TAU;
      if (u >= 1) {
        this.idleMode = 'rest';
        this.idleTimer = 0;
        this.idleRest = 2 + Math.random() * 4;
      }
    } else if (this.idleMode === 'bubble') {
      if (this.bubblePop > 0) {
        this.bubblePop = Math.min(1, this.bubblePop + dt / 0.45);
        if (this.bubblePop >= 1) {
          this.idleMode = 'rest';
          this.idleTimer = 0;
          this.bubbleGrow = 0;
          this.bubblePop = 0;
          this.idleRest = 2 + Math.random() * 4;
        }
      } else {
        this.bubbleGrow = Math.min(1, this.bubbleGrow + dt / 1.3);
        if (this.bubbleGrow >= 1) {
          this.bubblePop = 0.0001;
          this.eyeFlinch = 1;
        }
      }
    }
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

function drawIdleBubble(ctx, entity) {
  const r = entity.radius;
  const mouthX = entity.x + (entity.facing ?? 1) * r * 1.15;
  const mouthY = entity.y - r * 0.05;
  if (entity.bubblePop > 0) {
    const p = entity.bubblePop;
    const maxR = r * 2.2;
    ctx.save();
    ctx.globalAlpha = (1 - p) * 0.55;
    ctx.strokeStyle = 'rgba(220, 244, 255, 0.9)';
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.beginPath();
    ctx.arc(mouthX, mouthY, maxR * (0.85 + p * 0.55), 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * TAU;
      const d = maxR * p * 1.5;
      ctx.globalAlpha = (1 - p) * 0.85;
      ctx.fillStyle = i % 2 === 0 ? '#eaf9ff' : '#cfefff';
      ctx.beginPath();
      ctx.arc(mouthX + Math.cos(a) * d, mouthY + Math.sin(a) * d, Math.max(1, r * 0.14 * (1 - p)), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  const grow = entity.bubbleGrow;
  const br = r * (0.3 + grow * 2);
  ctx.save();
  ctx.globalAlpha = 0.26 + 0.22 * grow;
  ctx.fillStyle = 'rgba(207, 239, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(mouthX, mouthY, br, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = 'rgba(232, 249, 255, 0.9)';
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  ctx.beginPath();
  ctx.arc(mouthX, mouthY, br, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(mouthX - br * 0.34, mouthY - br * 0.34, Math.max(1, br * 0.15), 0, TAU);
  ctx.fill();
  ctx.restore();
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
