import { Entity } from './entity.js';
import { TAU } from '../engine/math.js';
import { PETS, COLORS } from '../config.js';

export class Lure extends Entity {
  constructor(x, y) {
    super({ x, y, radius: 16 });
    this.life = PETS.lureLife;
  }

  update(dt) {
    super.update(dt);
    this.life -= dt;
    this.y += Math.sin(this.age * 2.5) * 10 * dt;
    if (this.life <= 0) this.alive = false;
  }

  render(ctx) {
    const pulse = 1 + Math.sin(this.age * 5) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = 0.28 + 0.2 * Math.sin(this.age * 6);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 2.4 * pulse, 0, TAU);
    ctx.fillStyle = COLORS.danger;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse, 0, TAU);
    ctx.fillStyle = 'rgba(255, 107, 129, 0.85)';
    ctx.fill();
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.45, -this.radius * 0.45);
    ctx.lineTo(this.radius * 0.45, this.radius * 0.45);
    ctx.moveTo(this.radius * 0.45, -this.radius * 0.45);
    ctx.lineTo(-this.radius * 0.45, this.radius * 0.45);
    ctx.stroke();
    ctx.restore();
  }
}
