import { TAU } from '../engine/math.js';
import { mode3D, hiddenEntity } from '../engine/mode3d.js';

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

function drawEntitySphere(ctx, entity, radius, kind) {
  const golden = kind === 'golden';
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
