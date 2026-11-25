import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { BLACK_SWALLOWER, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export function drawBlackSwallower(ctx, radius, pose = {}) {
  const r = radius;
  const age = pose.age ?? 0;
  const gulp = pose.gulp ?? 0;
  const BODY = '#0e0e12';
  const DARK = '#040406';
  const OUTLINE = '#000000';
  const CAVITY = '#000000';
  const TEETH = '#e8eef2';
  const L = r * 2.2;
  const H = r * 0.5;

  const leafTop = (x) => -H * Math.sqrt(Math.max(0, 1 - (x / L) ** 2));
  const finA = -r * 1.5;
  const finB = r * 0.85;
  const finHeight = (x) => {
    const u = (x - finA) / (finB - finA);
    const edge = Math.min(u, 1 - u);
    const t = Math.max(0, Math.min(1, edge / 0.18));
    return r * 0.34 * Math.sin(t * Math.PI * 0.5);
  };
  const topY = (x) => leafTop(x) - (x >= finA && x <= finB ? finHeight(x) : 0);
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(L, 0);
    ctx.quadraticCurveTo(0, H, -L, 0);
    for (let x = -L; x <= L; x += r * 0.08) ctx.lineTo(x, topY(x));
    ctx.closePath();
  };

  ctx.save();
  ctx.rotate(Math.sin(age * 3) * 0.05);

  ctx.beginPath();
  ctx.moveTo(-L + r * 0.05, 0);
  ctx.lineTo(-L - r * 0.9, -r * 0.62);
  ctx.lineTo(-L - r * 0.9, r * 0.62);
  ctx.closePath();
  ctx.fillStyle = DARK;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.2, r * 0.05);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, r * (0.62 + gulp * 0.18), r * (1.0 + gulp * 0.3), r * (0.7 + gulp * 0.4), 0, 0, TAU);
  ctx.fillStyle = DARK;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.2, r * 0.05);
  ctx.stroke();

  bodyPath();
  ctx.fillStyle = BODY;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(finA, leafTop(finA));
  for (let x = finA; x <= finB; x += r * 0.08) ctx.lineTo(x, leafTop(x));
  for (let x = finB; x >= finA; x -= r * 0.08) ctx.lineTo(x, leafTop(x) - finHeight(x));
  ctx.closePath();
  ctx.fillStyle = DARK;
  ctx.fill();
  bodyPath();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.4, r * 0.05);
  ctx.lineJoin = 'round';
  ctx.stroke();

  const bite = pose.swallow ?? gulp;
  const jawHingeX = r * 1.18;
  const jawHingeY = r * 0.32;
  const jawLen = Math.hypot(L - jawHingeX, -jawHingeY);
  const closedAng = Math.atan2(-jawHingeY, L - jawHingeX);
  const jawAng = closedAng + bite * 0.85;
  const jawTipX = jawHingeX + Math.cos(jawAng) * jawLen;
  const jawTipY = jawHingeY + Math.sin(jawAng) * jawLen;

  ctx.beginPath();
  ctx.moveTo(jawHingeX, jawHingeY);
  ctx.lineTo(L, 0);
  ctx.lineTo(jawTipX, jawTipY);
  ctx.closePath();
  ctx.fillStyle = CAVITY;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.stroke();

  ctx.strokeStyle = BODY;
  ctx.lineWidth = r * 0.12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(jawHingeX, jawHingeY);
  ctx.lineTo(jawTipX, jawTipY);
  ctx.stroke();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.2, r * 0.05);
  ctx.stroke();

  const tdx = jawTipX - jawHingeX;
  const tdy = jawTipY - jawHingeY;
  const tlen = Math.hypot(tdx, tdy) || 1;
  const tux = tdx / tlen;
  const tuy = tdy / tlen;
  const tnx = tuy;
  const tny = -tux;
  ctx.fillStyle = TEETH;
  for (let i = 0; i < 5; i += 1) {
    const t = 0.2 + (i / 4) * 0.66;
    const px = jawHingeX + tdx * t;
    const py = jawHingeY + tdy * t;
    const w = r * 0.05;
    ctx.beginPath();
    ctx.moveTo(px - tux * w, py - tuy * w);
    ctx.lineTo(px + tux * w, py + tuy * w);
    ctx.lineTo(px + tnx * r * 0.14, py + tny * r * 0.14);
    ctx.closePath();
    ctx.fill();
  }

  const udx = L - jawHingeX;
  const udy = -jawHingeY;
  const ulen = Math.hypot(udx, udy) || 1;
  const uux = udx / ulen;
  const uuy = udy / ulen;
  const unx = -uuy;
  const uny = uux;
  ctx.fillStyle = TEETH;
  for (let i = 0; i < 5; i += 1) {
    const t = 0.2 + (i / 4) * 0.66;
    const px = jawHingeX + udx * t;
    const py = jawHingeY + udy * t;
    const w = r * 0.05;
    ctx.beginPath();
    ctx.moveTo(px - uux * w, py - uuy * w);
    ctx.lineTo(px + uux * w, py + uuy * w);
    ctx.lineTo(px + unx * r * 0.13, py + uny * r * 0.13);
    ctx.closePath();
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(r * 2.04, -r * 0.1, r * 0.1, 0, TAU);
  ctx.fillStyle = '#f0e6cf';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 2.06, -r * 0.1, r * 0.05, 0, TAU);
  ctx.fillStyle = '#101010';
  ctx.fill();

  ctx.fillStyle = 'rgba(120, 200, 255, 0.6)';
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.arc(r * (0.5 - i * 0.4), r * 0.34, r * 0.045, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

export class BlackSwallower extends Entity {
  constructor() {
    super({
      x: rand(90, LOGICAL_WIDTH - 90),
      y: rand(70, LOGICAL_HEIGHT - 90),
      radius: BLACK_SWALLOWER.radius,
    });
    this.vx = rand(-40, 40) || 30;
    this.vy = rand(-20, 20);
    this.gulp = 0;
    this.swallow = 0;
    this.timer = rand(2, 4);
  }

  update(dt, players = [], speedScale = 1) {
    super.update(dt);
    this.gulp = Math.max(0, this.gulp - dt * 0.8);
    this.swallow += (this.gulp - this.swallow) * (1 - Math.exp(-6 * dt));
    this.timer -= dt;

    let target = null;
    let best = BLACK_SWALLOWER.detectRadius;
    for (const player of players) {
      if (player.concealed === true) continue;
      const distance = Math.hypot(player.x - this.x, player.y - this.y);
      if (distance < best) {
        best = distance;
        target = player;
      }
    }

    if (target) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const distance = Math.hypot(dx, dy) || 1;
      this.vx = (dx / distance) * BLACK_SWALLOWER.chaseSpeed * speedScale;
      this.vy = (dy / distance) * BLACK_SWALLOWER.chaseSpeed * speedScale;
    } else {
      if (this.timer <= 0) {
        this.vx = rand(-30, 30);
        this.vy = rand(-20, 20);
        this.timer = rand(2.5, 5);
      }
      const drag = 1 - Math.min(0.9, dt * 0.5);
      this.vx *= drag;
      this.vy *= drag;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, BLACK_SWALLOWER.radius, LOGICAL_WIDTH - BLACK_SWALLOWER.radius);
    this.y = clamp(this.y, BLACK_SWALLOWER.radius, LOGICAL_HEIGHT - BLACK_SWALLOWER.radius);
    this.facing = this.vx >= 0 ? 1 : -1;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);
    drawBlackSwallower(ctx, this.radius, { age: this.age, gulp: this.gulp, swallow: this.swallow });
    ctx.restore();
  }
}
