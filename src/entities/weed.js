import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { FRESHWATER, SAND, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Weed extends Entity {
  constructor() {
    const base = LOGICAL_HEIGHT - SAND.height;
    const height = rand(84, 132);
    super({ x: LOGICAL_WIDTH + 70, y: base - height * 0.5, radius: 26 });
    this.height = height;
    this.strands = Array.from({ length: 5 }, (_, index) => ({
      offset: (index - 2) * 9 + rand(-3, 3),
      phase: rand(0, TAU),
      lean: rand(-18, 18),
    }));
  }

  update(dt, scrollSpeed = FRESHWATER.scrollSpeed) {
    super.update(dt);
    this.x -= scrollSpeed * dt;
  }

  render(ctx) {
    const baseY = LOGICAL_HEIGHT - SAND.height + 6;
    ctx.save();
    ctx.strokeStyle = COLORS.weed;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const strand of this.strands) {
      const topX =
        this.x + strand.offset + strand.lean + Math.sin(this.age * 1.6 + strand.phase) * 8;
      const topY = baseY - this.height - Math.sin(strand.phase) * 6;
      ctx.beginPath();
      ctx.moveTo(this.x + strand.offset, baseY);
      ctx.quadraticCurveTo(
        this.x + strand.offset + strand.lean * 0.5,
        baseY - this.height * 0.55,
        topX,
        topY,
      );
      ctx.stroke();
    }
    ctx.strokeStyle = COLORS.weedDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x - 12, baseY + 2);
    ctx.lineTo(this.x + 14, baseY - 4);
    ctx.stroke();
    ctx.restore();
  }
}
