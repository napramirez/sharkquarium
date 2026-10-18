import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { BUBBLE } from '../config.js';

export class Bubble extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: options.radius ?? rand(BUBBLE.minRadius, BUBBLE.maxRadius) });
    this.golden = false;
    this.baseX = x;
    this.rise = options.rise ?? rand(BUBBLE.minRise, BUBBLE.maxRise);
    this.wobble = options.wobble ?? rand(BUBBLE.minWobble, BUBBLE.maxWobble);
    this.wobbleSpeed = rand(BUBBLE.minWobbleSpeed, BUBBLE.maxWobbleSpeed);
    this.phase = rand(0, TAU);
  }

  update(dt) {
    super.update(dt);
    this.y -= this.rise * dt;
    this.x = this.baseX + Math.sin(this.age * this.wobbleSpeed + this.phase) * this.wobble;
  }

  render(ctx) {
    const radius = this.radius;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, TAU);
    ctx.fillStyle = 'rgba(207, 239, 255, 0.16)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(207, 239, 255, 0.78)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x - radius * 0.32, this.y - radius * 0.32, radius * 0.2, 0, TAU);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();
    ctx.restore();
  }
}
