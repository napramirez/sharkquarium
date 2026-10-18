import { Entity } from './entity.js';
import { SAND, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { FRESHWATER } from '../config.js';
import { TAU } from '../engine/math.js';

const SHAPE = [0.92, 1.14, 0.86, 1.1, 0.95, 1.18, 0.82, 1.06];

export class Rock extends Entity {
  constructor() {
    super({ x: LOGICAL_WIDTH + 92, y: LOGICAL_HEIGHT - SAND.height + 8, radius: 32 });
  }

  update(dt, scrollSpeed = FRESHWATER.scrollSpeed) {
    super.update(dt);
    this.x -= scrollSpeed * dt;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.sin(this.age * 1.1) * 0.08);
    ctx.beginPath();
    for (let i = 0; i < SHAPE.length; i += 1) {
      const angle = (i / SHAPE.length) * TAU;
      const radius = this.radius * SHAPE[i];
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.85;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = COLORS.rock;
    ctx.fill();
    ctx.strokeStyle = COLORS.rockDark;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(52, 56, 61, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.5, -this.radius * 0.2);
    ctx.lineTo(-this.radius * 0.1, this.radius * 0.25);
    ctx.lineTo(this.radius * 0.35, this.radius * 0.05);
    ctx.stroke();
    ctx.restore();
  }
}
