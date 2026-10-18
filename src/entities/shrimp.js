import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { SHRIMP, SAND, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Shrimp extends Entity {
  constructor() {
    super({ x: rand(40, LOGICAL_WIDTH - 40), y: -26, radius: SHRIMP.radius });
    this.score = SHRIMP.score;
    this.burst = [COLORS.shrimp, '#ffb3a7', '#ffffff'];
    this.sink = rand(SHRIMP.sinkMin, SHRIMP.sinkMax);
    this.drift = rand(-SHRIMP.drift, SHRIMP.drift);
    this.phase = rand(0, TAU);
  }

  update(dt) {
    super.update(dt);
    this.y += this.sink * dt;
    this.x += (this.drift + Math.sin(this.age * 2.6 + this.phase) * 26) * dt;
    this.x = clamp(this.x, 20, LOGICAL_WIDTH - 20);
    if (this.y > LOGICAL_HEIGHT - SAND.height + 8) this.kill();
  }

  render(ctx) {
    const radius = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 2 + Math.sin(this.age * 4 + this.phase) * 0.12);

    const flick = Math.sin(this.age * 6 + this.phase) * 0.35;
    ctx.save();
    ctx.translate(-radius * 0.9, 0);
    ctx.rotate(flick);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-radius * 0.7, -radius * 0.5);
    ctx.lineTo(-radius * 0.9, 0);
    ctx.lineTo(-radius * 0.7, radius * 0.5);
    ctx.closePath();
    ctx.fillStyle = COLORS.shrimp;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(radius * 0.9, 0);
    ctx.quadraticCurveTo(radius * 0.2, -radius * 0.62, -radius * 0.5, -radius * 0.2);
    ctx.quadraticCurveTo(-radius * 0.8, 0, -radius * 0.5, radius * 0.2);
    ctx.quadraticCurveTo(radius * 0.2, radius * 0.62, radius * 0.9, 0);
    ctx.closePath();
    ctx.fillStyle = COLORS.shrimp;
    ctx.fill();

    ctx.strokeStyle = 'rgba(120, 32, 28, 0.45)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i += 1) {
      const x = -radius * 0.2 + i * radius * 0.32;
      ctx.beginPath();
      ctx.moveTo(x, -radius * 0.42);
      ctx.quadraticCurveTo(x + radius * 0.1, 0, x, radius * 0.42);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 179, 167, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(radius * 0.8, -radius * 0.15);
    ctx.quadraticCurveTo(radius * 1.5, -radius * 0.5, radius * 1.9, -radius * 0.25);
    ctx.moveTo(radius * 0.8, radius * 0.15);
    ctx.quadraticCurveTo(radius * 1.5, radius * 0.5, radius * 1.9, radius * 0.25);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(radius * 0.55, -radius * 0.2, radius * 0.13, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-radius * 0.1, -radius * 0.28, radius * 0.12, 0, TAU);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();

    ctx.restore();
  }
}
