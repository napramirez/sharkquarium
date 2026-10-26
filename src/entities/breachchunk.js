import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { LABYRINTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class BreachChunk extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: options.size ?? rand(4, 8) });
    const angle = options.angle ?? rand(0, TAU);
    const speed = options.speed ?? rand(150, 300);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed + (options.lift ?? 0);
    this.gravity = options.gravity ?? LABYRINTH.breachGravity;
    this.spin = rand(-8, 8);
    this.rotation = rand(0, TAU);
    this.life = rand(0.6, 1.1);
    this.edges = Array.from({ length: 5 }, (_, index) => {
      const edge = (index / 5) * TAU;
      const reach = this.radius * rand(0.6, 1.2);
      return { x: Math.cos(edge) * reach, y: Math.sin(edge) * reach };
    });
  }

  update(dt) {
    super.update(dt);
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.spin * dt;
    if (this.age >= this.life || this.y - this.radius > LOGICAL_HEIGHT) this.kill();
  }

  render(ctx) {
    const fade = 1 - this.age / this.life;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, fade * 2.2));
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
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}
