import { Entity } from './entity.js';
import { rand, TAU, clamp } from '../engine/math.js';
import { HAZARD, LOGICAL_WIDTH, COLORS } from '../config.js';

export class Jellyfish extends Entity {
  constructor(x, y) {
    super({ x, y, radius: HAZARD.radius });
    this.baseY = y;
    this.bob = rand(HAZARD.bobMin, HAZARD.bobMax);
    this.bobSpeed = rand(HAZARD.bobSpeedMin, HAZARD.bobSpeedMax);
    this.phase = rand(0, TAU);
    this.drift = rand(0.5, 1) * HAZARD.driftSpeed * (Math.random() < 0.5 ? -1 : 1);
  }

  update(dt) {
    super.update(dt);
    this.x += this.drift * dt;
    if (this.x < 70 || this.x > LOGICAL_WIDTH - 70) {
      this.drift *= -1;
      this.x = clamp(this.x, 70, LOGICAL_WIDTH - 70);
    }
    this.y = this.baseY + Math.sin(this.age * this.bobSpeed + this.phase) * this.bob;
  }

  render(ctx) {
    const pulse = 1 + Math.sin(this.age * 2.4 + this.phase) * 0.06;
    const bell = this.radius * 1.15 * pulse;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.moveTo(-bell, 0);
    ctx.arc(0, 0, bell, Math.PI, 0);
    ctx.quadraticCurveTo(bell * 0.5, bell * 0.42, 0, bell * 0.18);
    ctx.quadraticCurveTo(-bell * 0.5, bell * 0.42, -bell, 0);
    ctx.closePath();
    ctx.fillStyle = COLORS.jelly;
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = COLORS.jelly;
    for (let i = 0; i < 4; i += 1) {
      const offset = (i - 1.5) * bell * 0.4;
      const wave = Math.sin(this.age * 3 + i * 1.7) * bell * 0.16;
      ctx.beginPath();
      ctx.moveTo(offset, bell * 0.2);
      ctx.quadraticCurveTo(offset + wave, bell * 0.8, offset - wave, bell * 1.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(-bell * 0.35, -bell * 0.42, bell * 0.14, 0, TAU);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
    ctx.restore();
  }
}
