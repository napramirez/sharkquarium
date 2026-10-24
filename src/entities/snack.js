import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { PETS, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Snack extends Entity {
  constructor(x, y) {
    super({ x, y, radius: 13 });
    const index = Math.floor(rand(0, PETS.critters.length));
    this.kind = PETS.critters[index];
    this.snack = true;
    this.vx = rand(-26, 26);
    this.vy = rand(-8, 18);
    this.phase = rand(0, TAU);
    this.hover = rand(150, LOGICAL_HEIGHT - 90);
  }

  update(dt) {
    super.update(dt);
    this.x += this.vx * dt;
    const settled = this.hover + Math.sin(this.age * 2.2 + this.phase) * 6;
    if (this.y < this.hover) {
      this.y += 34 * dt;
    } else {
      this.y += (settled - this.y) * (1 - Math.exp(-2.4 * dt));
      this.x += Math.sin(this.age * 1.6 + this.phase) * 12 * dt;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.kind === 'PLANKTON') {
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, TAU);
      ctx.fillStyle = COLORS.plankton;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, TAU);
      ctx.fillStyle = COLORS.plankton;
      ctx.fill();
    } else if (this.kind === 'SHRIMP') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 5.5, 0.3, 0, TAU);
      ctx.fillStyle = COLORS.shrimp;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-9, 2);
      ctx.lineTo(-15, -3);
      ctx.lineTo(-14, 4);
      ctx.closePath();
      ctx.fill();
    } else if (this.kind === 'MINNOW') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 5, 0, 0, TAU);
      ctx.fillStyle = COLORS.minnow;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(-15, -4);
      ctx.lineTo(-15, 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, -1, 1.6, 0, TAU);
      ctx.fillStyle = '#10233a';
      ctx.fill();
    } else if (this.kind === 'CRAB') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 7, 0, 0, TAU);
      ctx.fillStyle = COLORS.crab;
      ctx.fill();
      ctx.strokeStyle = COLORS.crab;
      ctx.lineWidth = 2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 7, 3);
        ctx.lineTo(side * 12, 7);
        ctx.stroke();
      }
    } else if (this.kind === 'ANGELFISH') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 11, 0.2, 0, TAU);
      ctx.fillStyle = '#cfd8dc';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(-12, -6);
      ctx.lineTo(-12, 6);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 7, 0, 0, TAU);
      ctx.fillStyle = COLORS.kelpLeaf;
      ctx.fill();
      ctx.strokeStyle = COLORS.kelpLeafDark;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-4, -3);
      ctx.lineTo(4, 3);
      ctx.moveTo(-4, 3);
      ctx.lineTo(4, -3);
      ctx.stroke();
    }
    ctx.restore();
  }
}
