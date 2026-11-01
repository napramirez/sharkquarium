import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { COLORS } from '../config.js';

const KINDS = ['crate', 'jar', 'lantern', 'chair'];

export class Clutter extends Entity {
  constructor(x, y, kind) {
    super({ x, y, radius: 15 });
    this.kind = kind ?? KINDS[Math.floor(rand(0, KINDS.length))];
    this.toppled = false;
    this.rotation = rand(-0.15, 0.15);
    this.spin = 0;
    this.fall = 0;
    this.tint = rand(0, 1);
  }

  knock() {
    if (this.toppled) return false;
    this.toppled = true;
    this.spin = rand(-7, 7);
    return true;
  }

  update(dt) {
    super.update(dt);
    if (!this.toppled) return;
    this.fall = Math.min(1, this.fall + dt * 3.2);
    this.rotation += this.spin * dt;
    this.spin *= Math.max(0, 1 - 3 * dt);
  }

  render(ctx) {
    const r = this.radius;
    const lean = this.toppled ? Math.sign(this.rotation || 1) * (Math.PI / 2) : 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * 0.3 + lean * this.fall);
    if (this.kind === 'crate') {
      ctx.fillStyle = COLORS.wreckWood;
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.strokeStyle = COLORS.wreckWoodDark;
      ctx.lineWidth = 3;
      ctx.strokeRect(-r, -r, r * 2, r * 2);
      ctx.beginPath();
      ctx.moveTo(-r, -r);
      ctx.lineTo(r, r);
      ctx.moveTo(r, -r);
      ctx.lineTo(-r, r);
      ctx.stroke();
    } else if (this.kind === 'jar') {
      ctx.fillStyle = `${COLORS.bubble}22`;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r);
      ctx.lineTo(r * 0.7, -r);
      ctx.quadraticCurveTo(r * 1.1, 0, r * 0.7, r);
      ctx.lineTo(-r * 0.7, r);
      ctx.quadraticCurveTo(-r * 1.1, 0, -r * 0.7, -r);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COLORS.bubble;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (this.kind === 'lantern') {
      ctx.strokeStyle = COLORS.rockDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r);
      ctx.quadraticCurveTo(0, -r * 1.6, r * 0.6, -r);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 209, 102, 0.15)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = this.tint > 0.5 ? COLORS.accent : COLORS.sand;
      ctx.fillRect(-r * 0.5, -r * 0.6, r, r * 1.2);
      ctx.strokeStyle = COLORS.sandDark;
      ctx.lineWidth = 2;
      ctx.strokeRect(-r * 0.5, -r * 0.6, r, r * 1.2);
    } else {
      ctx.fillStyle = COLORS.rock;
      ctx.fillRect(-r * 0.9, -r * 0.2, r * 1.8, r * 0.5);
      ctx.fillRect(-r * 0.9, -r * 1.1, r * 0.5, r * 1.2);
      ctx.strokeStyle = COLORS.rockDark;
      ctx.lineWidth = 2;
      ctx.strokeRect(-r * 0.9, -r * 0.2, r * 1.8, r * 0.5);
    }
    ctx.restore();
  }
}
