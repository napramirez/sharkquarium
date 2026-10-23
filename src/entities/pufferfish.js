import { Entity } from './entity.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { PUFFER, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Pufferfish extends Entity {
  constructor(options = {}) {
    super({ x: 0, y: 0, radius: PUFFER.radius });
    const target = options.target ?? null;
    let side;
    if (target) {
      if (Math.abs(target.x - LOGICAL_WIDTH / 2) > Math.abs(target.y - LOGICAL_HEIGHT / 2)) {
        side = target.x < LOGICAL_WIDTH / 2 ? 1 : 3;
      } else {
        side = target.y < LOGICAL_HEIGHT / 2 ? 2 : 0;
      }
    } else {
      side = Math.floor(rand(0, 4));
    }
    if (side === 0) {
      this.x = rand(70, LOGICAL_WIDTH - 70);
      this.y = 26;
    } else if (side === 1) {
      this.x = LOGICAL_WIDTH - 26;
      this.y = rand(70, LOGICAL_HEIGHT - 70);
    } else if (side === 2) {
      this.x = rand(70, LOGICAL_WIDTH - 70);
      this.y = LOGICAL_HEIGHT - 26;
    } else {
      this.x = 26;
      this.y = rand(70, LOGICAL_HEIGHT - 70);
    }
    this.state = 'charge';
    this.chargeDuration = PUFFER.chargeTime * (options.chargeScale ?? 1);
    this.stateTimer = this.chargeDuration;
    const targetX = target ? clamp(target.x, 80, LOGICAL_WIDTH - 80) : rand(120, LOGICAL_WIDTH - 120);
    const targetY = target ? clamp(target.y, 70, LOGICAL_HEIGHT - 70) : rand(90, LOGICAL_HEIGHT - 90);
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const speed = rand(PUFFER.speedMin, PUFFER.speedMax) * (options.speedScale ?? 1);
    this.vx = (dx / length) * speed;
    this.vy = (dy / length) * speed;
    this.wobblePhase = rand(0, TAU);
    this.spin = rand(0, TAU);
  }

  update(dt) {
    super.update(dt);
    if (this.state === 'charge') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this.state = 'fly';
      return;
    }
    const wobble = Math.sin(this.age * 6 + this.wobblePhase) * PUFFER.wobble;
    const length = Math.hypot(this.vx, this.vy) || 1;
    this.x += this.vx * dt + (-this.vy / length) * wobble * dt;
    this.y += this.vy * dt + (this.vx / length) * wobble * dt;
    this.spin += dt * 2.2;
  }

  get gone() {
    return (
      this.x < -90 ||
      this.x > LOGICAL_WIDTH + 90 ||
      this.y < -90 ||
      this.y > LOGICAL_HEIGHT + 90
    );
  }

  render(ctx) {
    const inflate =
      this.state === 'charge'
        ? 0.55 + 0.45 * (1 - this.stateTimer / this.chargeDuration)
        : 0.92 + Math.sin(this.age * 8) * 0.08;
    const radius = PUFFER.radius * inflate;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.state === 'charge') {
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(this.age * 12);
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.9, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.rotate(Math.sin(this.spin) * 0.25);
    ctx.fillStyle = COLORS.pufferSpike;
    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle - 0.16) * radius * 0.88, Math.sin(angle - 0.16) * radius * 0.88);
      ctx.lineTo(Math.cos(angle) * radius * 1.45, Math.sin(angle) * radius * 1.45);
      ctx.lineTo(Math.cos(angle + 0.16) * radius * 0.88, Math.sin(angle + 0.16) * radius * 0.88);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.fillStyle = COLORS.puffer;
    ctx.fill();
    ctx.strokeStyle = COLORS.pufferSpike;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, radius * 0.28, radius * 0.62, 0, TAU);
    ctx.fillStyle = 'rgba(255, 245, 214, 0.7)';
    ctx.fill();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * radius * 0.42, -radius * 0.35, radius * 0.2, 0, TAU);
      ctx.fillStyle = '#f4fbff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(side * radius * 0.46, -radius * 0.35, radius * 0.1, 0, TAU);
      ctx.fillStyle = '#10233a';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, radius * 0.42, radius * 0.22, 0.3, Math.PI - 0.3);
    ctx.strokeStyle = '#5c4a22';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
}
