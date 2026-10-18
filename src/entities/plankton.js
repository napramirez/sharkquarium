import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { PLANKTON, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Plankton extends Entity {
  constructor() {
    super({ x: LOGICAL_WIDTH + 18, y: rand(70, LOGICAL_HEIGHT - 90), radius: PLANKTON.radius });
    this.score = PLANKTON.score;
    this.burst = [COLORS.plankton, '#eaf8e0', '#ffffff'];
    this.drift = rand(PLANKTON.driftMin, PLANKTON.driftMax);
    this.bob = rand(PLANKTON.bob * 0.5, PLANKTON.bob);
    this.phase = rand(0, TAU);
    this.baseY = this.y;
  }

  update(dt) {
    super.update(dt);
    this.x -= this.drift * dt;
    this.y = this.baseY + Math.sin(this.age * 2 + this.phase) * this.bob;
    if (this.x < -24) this.kill();
  }

  render(ctx) {
    const radius = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2, 0, TAU);
    ctx.fillStyle = COLORS.plankton;
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.fillStyle = COLORS.plankton;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(-radius * 0.2, -radius * 0.2, radius * 0.35, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(234, 248, 224, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.6, -radius * 0.4);
    ctx.lineTo(-radius * 1.6, -radius * 0.9);
    ctx.moveTo(-radius * 0.6, radius * 0.4);
    ctx.lineTo(-radius * 1.6, radius * 0.9);
    ctx.stroke();
    ctx.restore();
  }
}
