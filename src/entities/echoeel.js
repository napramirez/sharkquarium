import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { QUIET, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Echoeel extends Entity {
  constructor() {
    super({ x: LOGICAL_WIDTH * 0.72, y: LOGICAL_HEIGHT * 0.4, radius: QUIET.radius });
    this.santa = true;
    this.state = 'drift';
    this.stateTimer = 0;
    this.targetX = this.x;
    this.targetY = this.y;
    this.wanderX = this.x;
    this.wanderY = this.y;
    this.facing = 1;
    this.mawPhase = rand(0, TAU);
    this.worldWidth = LOGICAL_WIDTH;
    this.chargeSpeed = QUIET.chargeSpeed;
    this.relentless = false;
  }

  get hunting() {
    return this.state === 'alert' || this.state === 'charge' || this.state === 'search';
  }

  alertTo(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.state = 'alert';
    this.stateTimer = QUIET.alertTime;
  }

  pickWander() {
    this.wanderX = rand(90, Math.max(120, this.worldWidth - 90));
    this.wanderY = rand(70, LOGICAL_HEIGHT - 70);
  }

  update(dt) {
    super.update(dt);
    if (this.state === 'alert') {
      this.stateTimer -= dt;
      const dx = this.targetX - this.x;
      if (Math.abs(dx) > 4) this.facing = dx > 0 ? 1 : -1;
      if (this.stateTimer <= 0) {
        this.state = 'charge';
        this.stateTimer = QUIET.chargeTime;
      }
      return;
    }
    if (this.state === 'charge') {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.hypot(dx, dy) || 1;
      const step = this.chargeSpeed * dt;
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
      if (Math.abs(dx) > 4) this.facing = dx > 0 ? 1 : -1;
      this.stateTimer -= dt;
      if (distance < 14 || this.stateTimer <= 0) {
        if (this.relentless) {
          this.stateTimer = 2;
        } else {
          this.state = 'search';
          this.stateTimer = QUIET.searchTime;
        }
      }
      return;
    }
    if (this.state === 'search') {
      this.stateTimer -= dt;
      const thrash = Math.sin(this.age * 6);
      this.x += thrash * 70 * dt;
      this.y += Math.cos(this.age * 5.1) * 70 * dt;
      if (Math.abs(thrash) > 0.25) this.facing = thrash > 0 ? 1 : -1;
      if (this.stateTimer <= 0) {
        this.state = 'drift';
        this.pickWander();
      }
    } else {
      const dx = this.wanderX - this.x;
      const dy = this.wanderY - this.y;
      const distance = Math.hypot(dx, dy) || 1;
      const step = QUIET.driftSpeed * dt;
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
      if (Math.abs(dx) > 4) this.facing = dx > 0 ? 1 : -1;
      if (distance < 26) this.pickWander();
    }
    this.x = Math.min(Math.max(this.x, this.radius), this.worldWidth - this.radius);
    this.y = Math.min(Math.max(this.y, this.radius), LOGICAL_HEIGHT - this.radius);
  }

  render(ctx) {
    const r = this.radius;
    const sway = Math.sin(this.age * 2.2) * r * 0.12;
    const open = this.state === 'charge' ? 0.85 : 0.24 + Math.sin(this.age * 1.5 + this.mawPhase) * 0.08;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);
    ctx.globalAlpha = this.state === 'charge' ? 1 : 0.95;

    this.renderTail(ctx, r, sway);

    const body = ctx.createLinearGradient(0, -r, 0, r);
    body.addColorStop(0, COLORS.alienFlesh);
    body.addColorStop(0.5, COLORS.alien);
    body.addColorStop(1, COLORS.alienDark);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(r * 1.5, sway);
    ctx.quadraticCurveTo(r * 0.9, -r * 0.85, -r * 0.6, -r * 0.6 + sway * 0.4);
    ctx.quadraticCurveTo(-r * 1.8, -r * 0.42, -r * 2.2, sway);
    ctx.quadraticCurveTo(-r * 1.8, r * 0.42, -r * 0.6, r * 0.6 + sway * 0.4);
    ctx.quadraticCurveTo(r * 0.9, r * 0.85, r * 1.5, sway);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.alienDark;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(r * 1.0, sway);
    this.renderHead(ctx, r * 0.82, open);
    ctx.restore();
    ctx.restore();
  }

  renderTail(ctx, r, sway) {
    const segments = 14;
    const length = r * 5.4;
    const points = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      points.push({
        x: -r * 1.0 - t * length,
        y: sway * (1 - t) + Math.sin(this.age * 3.4 - t * 3.2) * r * 0.6 * t,
        w: r * (0.36 - t * 0.32),
      });
    }
    const gradient = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.5);
    gradient.addColorStop(0, COLORS.alien);
    gradient.addColorStop(1, COLORS.alienDark);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y - points[0].w);
    for (const point of points) ctx.lineTo(point.x, point.y - point.w);
    for (let i = points.length - 1; i >= 0; i -= 1) {
      ctx.lineTo(points[i].x, points[i].y + points[i].w);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.alienDark;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#07080a';
    for (let i = 1; i < points.length - 1; i += 1) {
      const point = points[i];
      const s = r * 0.06;
      const h = r * 0.2;
      ctx.beginPath();
      ctx.moveTo(point.x - s, point.y - point.w);
      ctx.lineTo(point.x + s, point.y - point.w);
      ctx.lineTo(point.x, point.y - point.w - h);
      ctx.closePath();
      ctx.fill();
    }

    const tip = points[points.length - 1];
    const prev = points[points.length - 2];
    const angle = Math.atan2(tip.y - prev.y, tip.x - prev.x);
    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(angle);
    ctx.fillStyle = COLORS.alienDark;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.55, -r * 0.55, r * 1.15, -r * 1.2);
    ctx.quadraticCurveTo(r * 0.5, -r * 0.55, r * 0.42, 0);
    ctx.quadraticCurveTo(r * 0.5, r * 0.4, r * 0.95, r * 0.8);
    ctx.quadraticCurveTo(r * 0.4, r * 0.42, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#050608';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  renderHead(ctx, radius, open) {
    const r = radius;
    const gape = Math.max(0, open);
    const teeth = (pointUp) => {
      ctx.fillStyle = '#e8e3d6';
      const count = 13;
      for (let i = 0; i < count; i += 1) {
        const t = i / (count - 1);
        const x = r * (0.82 - t * 1.62);
        const len = r * (0.6 + Math.sin(i * 1.9) * 0.16) * (1 + gape * 0.5);
        const w = r * 0.05;
        const baseY = pointUp ? r * 0.12 : -r * 0.12;
        const tipY = pointUp ? baseY - len : baseY + len;
        const skew = Math.sin(i * 1.5) * r * 0.07;
        ctx.beginPath();
        ctx.moveTo(x - w, baseY);
        ctx.lineTo(x + w, baseY);
        ctx.lineTo(x + skew, tipY);
        ctx.closePath();
        ctx.fill();
      }
    };

    const stretch = 1 + gape * 0.55;
    ctx.save();
    ctx.translate(r * 0.12, 0);
    ctx.fillStyle = COLORS.alienMaw;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.74, r * 0.5 * stretch, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(-r * 0.7, 0);
    ctx.rotate(gape * 0.65);
    ctx.translate(r * 0.7, 0);
    const lower = ctx.createLinearGradient(0, 0, 0, r);
    lower.addColorStop(0, COLORS.alien);
    lower.addColorStop(1, COLORS.alienDark);
    ctx.fillStyle = lower;
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, 0);
    ctx.quadraticCurveTo(-r * 0.75, r * 1.0, r * 0.55, r * 0.82);
    ctx.quadraticCurveTo(r * 1.08, r * 0.32, r * 0.9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.alienDark;
    ctx.lineWidth = Math.max(2, r * 0.09);
    ctx.stroke();
    teeth(true);
    ctx.restore();

    ctx.save();
    ctx.translate(-r * 0.7, 0);
    ctx.rotate(-gape * 1.8);
    ctx.translate(r * 0.7, 0);
    const upper = ctx.createLinearGradient(0, -r, 0, 0);
    upper.addColorStop(0, COLORS.alienFlesh);
    upper.addColorStop(1, COLORS.alien);
    ctx.fillStyle = upper;
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, 0);
    ctx.quadraticCurveTo(-r * 0.75, -r * 1.0, r * 0.55, -r * 0.82);
    ctx.quadraticCurveTo(r * 1.08, -r * 0.32, r * 0.9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.alienDark;
    ctx.lineWidth = Math.max(2, r * 0.09);
    ctx.stroke();
    teeth(false);
    ctx.restore();
  }

  renderJumpscare(ctx, cx, cy, scale, open = 0.8, variant = 'snap') {
    ctx.save();
    ctx.translate(cx, cy);
    if (variant === 'breach') ctx.rotate(Math.sin(this.age * 26) * 0.06 + 0.12);
    else if (variant === 'lunge') ctx.rotate((this.facing < 0 ? 1 : -1) * 0.18);
    ctx.scale(scale, variant === 'breach' ? scale * 1.1 : scale);
    const r = this.radius;
    ctx.fillStyle = COLORS.alienDark;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.9, r * 1.5, 0, 0, TAU);
    ctx.fill();
    this.renderHead(ctx, r * 1.55, open);
    ctx.restore();
  }
}
