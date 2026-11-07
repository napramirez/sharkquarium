import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { COLORS } from '../config.js';

export class Swarmling extends Entity {
  constructor(x, y) {
    super({ x, y, radius: 10 });
    this.santa = true;
    this.phase = rand(0, TAU);
    this.speed = 0;
    this.heading = rand(0, TAU);
  }

  update(dt, target) {
    super.update(dt);
    if (!target) return;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    this.x += (dx / distance) * this.speed * dt;
    this.y += (dy / distance) * this.speed * dt;
    this.heading = Math.atan2(dy, dx);
  }

  render(ctx) {
    const r = this.radius;
    const wag = Math.sin(this.age * 14 + this.phase) * 0.5;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.3, r * 0.7, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(-r * 1.1, 0);
    ctx.rotate(wag);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.9, -r * 0.7);
    ctx.lineTo(-r * 0.7, 0);
    ctx.lineTo(-r * 0.9, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.12, r * 0.16, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
