import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class WhaleSkeleton extends Entity {
  constructor() {
    super({ x: rand(150, LOGICAL_WIDTH - 150), y: LOGICAL_HEIGHT + 150, radius: 46 });
    this.scale = rand(0.85, 1.15);
    this.lean = rand(-0.22, 0.22);
    this.ribCount = 5;
  }

  update(dt, scrollSpeed) {
    super.update(dt);
    this.y -= scrollSpeed * dt;
  }

  render(ctx) {
    const s = this.scale * 46;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.lean + Math.sin(this.age * 0.8) * 0.05);
    ctx.lineCap = 'round';

    ctx.strokeStyle = COLORS.bone;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, s * 1.3);
    ctx.lineTo(0, -s * 0.7);
    ctx.stroke();

    ctx.fillStyle = COLORS.bone;
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      ctx.arc(0, s * 1.2 - i * s * 0.32, 4.5, 0, TAU);
      ctx.fill();
    }

    ctx.lineWidth = 5;
    for (let i = 0; i < this.ribCount; i += 1) {
      const y = s * 0.9 - i * s * 0.42;
      const span = s * (0.95 - i * 0.09);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(span * 1.2, y - s * 0.35, span * 0.72, y - s * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(-span * 1.2, y - s * 0.35, -span * 0.72, y - s * 0.8);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(-s * 0.42, -s * 0.7);
    ctx.quadraticCurveTo(-s * 0.52, -s * 1.5, 0, -s * 1.75);
    ctx.quadraticCurveTo(s * 0.52, -s * 1.5, s * 0.42, -s * 0.7);
    ctx.closePath();
    ctx.fillStyle = COLORS.bone;
    ctx.fill();
    ctx.strokeStyle = COLORS.boneDark;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-s * 0.16, -s * 1.18, 5.5, 0, TAU);
    ctx.fillStyle = COLORS.abyss;
    ctx.fill();

    ctx.strokeStyle = COLORS.boneDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.78);
    ctx.lineTo(s * 0.34, -s * 0.78);
    ctx.stroke();

    ctx.restore();
  }
}
