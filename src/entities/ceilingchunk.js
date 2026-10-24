import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { LABYRINTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class CeilingChunk extends Entity {
  constructor(x, y, speedScale = 1, sizeScale = 1) {
    super({ x, y, radius: LABYRINTH.ceilingRadius * sizeScale });
    this.vy = LABYRINTH.ceilingFallSpeed * speedScale;
    this.gravity = LABYRINTH.ceilingGravity * speedScale;
    this.size = LABYRINTH.ceilingChunkSize * sizeScale;
    this.rotation = rand(0, TAU);
    this.spin = rand(-5, 5);
    this.edges = Array.from({ length: 7 }, (_, index) => {
      const angle = (index / 7) * TAU;
      const radius = this.size * rand(0.7, 1.25);
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
  }

  update(dt) {
    super.update(dt);
    this.vy += this.gravity * dt;
    this.y += this.vy * dt;
    this.rotation += this.spin * dt;
    if (this.y - this.radius > LOGICAL_HEIGHT) this.kill();
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.beginPath();
    ctx.moveTo(this.edges[0].x, this.edges[0].y);
    for (let index = 1; index < this.edges.length; index += 1) {
      ctx.lineTo(this.edges[index].x, this.edges[index].y);
    }
    ctx.closePath();
    ctx.fillStyle = COLORS.wreckWood;
    ctx.fill();
    ctx.strokeStyle = COLORS.wreckWoodDark;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(26, 18, 12, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.4, 0);
    ctx.lineTo(this.size * 0.3, this.size * 0.25);
    ctx.stroke();
    ctx.restore();
  }
}
