import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { FRESHWATER, SAND, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Log extends Entity {
  constructor() {
    const top = LOGICAL_HEIGHT - SAND.height;
    super({ x: LOGICAL_WIDTH + 100, y: rand(top - 150, top - 40), radius: 30 });
    this.length = rand(96, 136);
    this.phase = rand(0, TAU);
  }

  update(dt, scrollSpeed = FRESHWATER.scrollSpeed) {
    super.update(dt);
    this.x -= scrollSpeed * dt;
    this.y += Math.sin(this.age * 1.4 + this.phase) * 5 * dt;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.sin(this.age * 0.8) * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, 0, this.length / 2, this.radius * 0.62, 0, 0, TAU);
    ctx.fillStyle = COLORS.log;
    ctx.fill();
    ctx.strokeStyle = 'rgba(58, 42, 26, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(58, 42, 26, 0.5)';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * this.length * 0.4, 0, this.radius * 0.22, this.radius * 0.42, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-this.length * 0.28, -this.radius * 0.4);
    ctx.lineTo(this.length * 0.2, this.radius * 0.36);
    ctx.stroke();
    ctx.restore();
  }
}
