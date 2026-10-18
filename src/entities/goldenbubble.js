import { Bubble } from './bubble.js';
import { rand, TAU } from '../engine/math.js';
import { COLORS, GOLDEN } from '../config.js';

export class GoldenBubble extends Bubble {
  constructor(x, y) {
    super(x, y, { radius: GOLDEN.radius, rise: rand(GOLDEN.riseMin, GOLDEN.riseMax) });
    this.golden = true;
  }

  render(ctx) {
    const radius = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.9, 0, TAU);
    ctx.fillStyle = COLORS.accent;
    ctx.fill();
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.fillStyle = COLORS.accent;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#fff3c4';
    ctx.stroke();
    ctx.rotate(this.age * 1.6);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.62);
    ctx.quadraticCurveTo(0, 0, radius * 0.62, 0);
    ctx.quadraticCurveTo(0, 0, 0, radius * 0.62);
    ctx.quadraticCurveTo(0, 0, -radius * 0.62, 0);
    ctx.quadraticCurveTo(0, 0, 0, -radius * 0.62);
    ctx.fill();
    ctx.restore();
  }
}
