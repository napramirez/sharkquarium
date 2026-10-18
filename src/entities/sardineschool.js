import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { SARDINE, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class SardineSchool extends Entity {
  constructor() {
    super({
      x: rand(200, LOGICAL_WIDTH - 200),
      y: rand(180, LOGICAL_HEIGHT - 180),
      radius: SARDINE.schoolRadius,
    });
    this.baseX = this.x;
    this.baseY = this.y;
    this.wanderPhase = rand(0, TAU);
    this.wanderSpeed = rand(0.12, 0.2);
    this.facing = 1;
    this.fish = Array.from({ length: SARDINE.fishCount }, () => ({
      offsetX: rand(-SARDINE.schoolRadius * 0.7, SARDINE.schoolRadius * 0.7),
      offsetY: rand(-SARDINE.schoolRadius * 0.55, SARDINE.schoolRadius * 0.55),
      phase: rand(0, TAU),
      flutter: rand(2.5, 4),
      size: rand(3, 4.6),
    }));
  }

  update(dt) {
    super.update(dt);
    const beforeX = this.x;
    this.x = this.baseX + Math.sin(this.age * this.wanderSpeed + this.wanderPhase) * SARDINE.wanderX;
    this.y = this.baseY + Math.sin(this.age * this.wanderSpeed * 1.7 + this.wanderPhase) * SARDINE.wanderY;
    if (this.x !== beforeX) this.facing = this.x > beforeX ? 1 : -1;
  }

  contains(x, y) {
    return Math.hypot(x - this.x, y - this.y) < SARDINE.schoolRadius * 0.85;
  }

  render(ctx) {
    for (const fish of this.fish) {
      const x = this.x + fish.offsetX + Math.sin(this.age * fish.flutter + fish.phase) * 4;
      const y = this.y + fish.offsetY + Math.cos(this.age * fish.flutter * 0.8 + fish.phase) * 3;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(this.facing, 1);
      ctx.beginPath();
      ctx.ellipse(0, 0, fish.size, fish.size * 0.45, 0, 0, TAU);
      ctx.fillStyle = COLORS.sardine;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-fish.size * 0.8, 0);
      ctx.lineTo(-fish.size * 1.6, -fish.size * 0.5);
      ctx.lineTo(-fish.size * 1.6, fish.size * 0.5);
      ctx.closePath();
      ctx.fillStyle = COLORS.sardine;
      ctx.fill();
      ctx.restore();
    }
  }
}
