import { Entity } from './entity.js';
import { LEDGES, COLORS } from '../config.js';

export class Ledges extends Entity {
  constructor() {
    super({ x: 0, y: 0, radius: 0 });
    this.slabs = LEDGES.spots.map((spot) => ({ ...spot }));
    this.holes = [];
    for (const slab of this.slabs) {
      this.holes.push(
        { x: slab.x - LEDGES.width * 0.25, y: slab.y },
        { x: slab.x + LEDGES.width * 0.25, y: slab.y },
      );
    }
    this.blobs = Array.from({ length: 18 }, (_, index) => ({
      x: (index * 173) % (LEDGES.width - 30) + 15,
      y: ((index * 37) % (LEDGES.height - 18)) + 9,
      rx: 9 + (index % 3) * 5,
      ry: 5 + (index % 2) * 4,
      slab: index % 2,
    }));
  }

  findHoleNear(x, y) {
    let best = null;
    let bestDistance = LEDGES.hideRange;
    for (const hole of this.holes) {
      const distance = Math.hypot(hole.x - x, hole.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = hole;
      }
    }
    return best;
  }

  render(ctx) {
    for (let index = 0; index < this.slabs.length; index += 1) {
      const slab = this.slabs[index];
      const left = slab.x - LEDGES.width / 2;
      const top = slab.y - LEDGES.height / 2;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(left + 18, top);
      ctx.arcTo(left + LEDGES.width, top, left + LEDGES.width, top + LEDGES.height, 18);
      ctx.arcTo(left + LEDGES.width, top + LEDGES.height, left, top + LEDGES.height, 18);
      ctx.arcTo(left, top + LEDGES.height, left, top, 18);
      ctx.arcTo(left, top, left + LEDGES.width, top, 18);
      ctx.closePath();
      ctx.fillStyle = COLORS.rock;
      ctx.fill();
      ctx.strokeStyle = COLORS.rockDark;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.clip();
      ctx.fillStyle = COLORS.rockDark;
      for (const blob of this.blobs) {
        if (blob.slab !== index) continue;
        ctx.beginPath();
        ctx.ellipse(left + blob.x, top + blob.y, blob.rx, blob.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      for (const hole of this.holes) {
        if (Math.abs(hole.x - slab.x) > LEDGES.width / 2) continue;
        ctx.beginPath();
        ctx.ellipse(hole.x, hole.y, LEDGES.holeWidth / 2, LEDGES.holeHeight / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(2, 6, 10, 0.94)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(86, 90, 97, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
