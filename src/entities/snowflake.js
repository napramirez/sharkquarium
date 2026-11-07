import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';

export class Snowflake extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: options.radius ?? rand(2.6, 5.4) });
    this.flat3D = true;
    this.kind = options.kind ?? 'snow';
    this.color = options.color ?? '#ffffff';
    this.fall = options.fall ?? rand(16, 40);
    this.drift = rand(-12, 12);
    this.spin = rand(-0.6, 0.6);
    this.phase = rand(0, TAU);
    this.alpha = rand(0.5, 0.95);
  }

  update(dt) {
    super.update(dt);
    this.y += this.fall * dt;
    this.x += (this.drift + Math.sin(this.age * 1.1 + this.phase) * 10) * dt;
  }

  render(ctx) {
    if (this.kind === 'leaf') {
      this.renderLeaf(ctx);
      return;
    }
    if (this.kind === 'confetti') {
      this.renderConfetti(ctx);
      return;
    }
    this.renderSnow(ctx);
  }

  renderSnow(ctx) {
    const r = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.age * this.spin + this.phase);
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * TAU;
      const ex = Math.cos(a) * r;
      const ey = Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex * 0.58, ey * 0.58);
      ctx.lineTo(ex * 0.58 + Math.cos(a + 0.7) * r * 0.34, ey * 0.58 + Math.sin(a + 0.7) * r * 0.34);
      ctx.moveTo(ex * 0.58, ey * 0.58);
      ctx.lineTo(ex * 0.58 + Math.cos(a - 0.7) * r * 0.34, ey * 0.58 + Math.sin(a - 0.7) * r * 0.34);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderLeaf(ctx) {
    const r = this.radius * 1.7;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.age * this.spin * 1.4 + this.phase);
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r, -r * 0.2, 0, r);
    ctx.quadraticCurveTo(-r, -r * 0.2, 0, -r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40, 20, 10, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.stroke();
    ctx.restore();
  }

  renderConfetti(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.age * this.spin * 3 + this.phase);
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.radius, -this.radius * 0.5, this.radius * 2, this.radius);
    ctx.restore();
  }
}