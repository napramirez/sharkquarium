import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { FRESHWATER, SAND, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class PiranhaSchool extends Entity {
  constructor() {
    super({
      x: LOGICAL_WIDTH + 80,
      y: rand(110, LOGICAL_HEIGHT - SAND.height - 80),
      radius: 28,
    });
    this.fish = Array.from({ length: 7 }, () => ({
      offsetX: rand(-24, 24),
      offsetY: rand(-18, 18),
      phase: rand(0, TAU),
      size: rand(4, 6),
    }));
  }

  update(dt, scrollSpeed = FRESHWATER.scrollSpeed) {
    super.update(dt);
    this.x -= scrollSpeed * dt;
  }

  render(ctx) {
    for (const fish of this.fish) {
      const x = this.x + fish.offsetX + Math.sin(this.age * 6 + fish.phase) * 3;
      const y = this.y + fish.offsetY;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.ellipse(0, 0, fish.size, fish.size * 0.5, 0, 0, TAU);
      ctx.fillStyle = '#4c4f56';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, fish.size * 0.22, fish.size * 0.5, fish.size * 0.22, 0, 0, TAU);
      ctx.fillStyle = '#c94b3a';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-fish.size * 0.9, 0);
      ctx.lineTo(-fish.size * 1.7, -fish.size * 0.5);
      ctx.lineTo(-fish.size * 1.7, fish.size * 0.5);
      ctx.closePath();
      ctx.fillStyle = '#4c4f56';
      ctx.fill();
      ctx.restore();
    }
  }
}
