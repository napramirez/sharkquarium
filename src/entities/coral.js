import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { COLORS, CORAL, CORAL_PALETTE, LOGICAL_HEIGHT } from '../config.js';

function pointAt(p0, p1, p2, t) {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

export class Coral extends Entity {
  constructor(x, kind = 0) {
    super({ x, y: LOGICAL_HEIGHT - 6, radius: 24 });
    this.kind = kind;
    this.height = rand(CORAL.heightMin, CORAL.heightMax);
    this.color = CORAL_PALETTE[Math.floor(rand(0, CORAL_PALETTE.length))];
    this.phase = rand(0, TAU);
    this.branches = Array.from({ length: 5 }, (_, index) => ({
      offset: (index - 2) * rand(10, 14),
      height: this.height * rand(0.55, 1),
      lean: rand(-18, 18),
      twigs: [rand(0.35, 0.55), rand(0.6, 0.8)],
    }));
    this.ribs = Array.from({ length: 7 }, (_, index) => ({
      angle: (index / 6 - 0.5) * 2,
      length: this.height * rand(0.7, 1),
    }));
    this.tubes = Array.from({ length: 3 }, (_, index) => ({
      offset: (index - 1) * rand(16, 22),
      height: this.height * rand(0.55, 1),
      radius: rand(7, 10),
    }));
  }

  render(ctx) {
    const sway = Math.sin(this.age * CORAL.swaySpeed + this.phase) * CORAL.sway;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = COLORS.rockDark;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 9, 0, 0, TAU);
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.color;
    if (this.kind === 0) {
      for (let index = 0; index < this.branches.length; index += 1) {
        const branch = this.branches[index];
        const side = index % 2 === 0 ? 1 : -1;
        const topX = branch.offset + branch.lean + sway;
        const topY = -branch.height;
        const midX = branch.offset + branch.lean * 0.3;
        const midY = -branch.height * 0.6;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(branch.offset, 0);
        ctx.quadraticCurveTo(midX, midY, topX, topY);
        ctx.stroke();
        ctx.lineWidth = 3.5;
        for (const t of branch.twigs) {
          const bx = pointAt(branch.offset, midX, topX, t);
          const by = pointAt(0, midY, topY, t);
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx + side * 8, by - 8, bx + side * 13 + sway * 0.5, by - 20);
          ctx.stroke();
        }
      }
    } else if (this.kind === 1) {
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (const rib of this.ribs) {
        ctx.lineTo(
          Math.sin(rib.angle) * rib.length + sway * Math.cos(rib.angle),
          -Math.cos(rib.angle) * rib.length,
        );
      }
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 4;
      for (const rib of this.ribs) {
        const tipX = Math.sin(rib.angle) * rib.length + sway * Math.cos(rib.angle);
        const tipY = -Math.cos(rib.angle) * rib.length;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(tipX * 0.4, -rib.length * 0.6, tipX, tipY);
        ctx.stroke();
      }
    } else {
      for (const tube of this.tubes) {
        const topX = tube.offset + sway;
        const topY = -tube.height;
        ctx.lineWidth = tube.radius * 2;
        ctx.beginPath();
        ctx.moveTo(tube.offset, -2);
        ctx.lineTo(topX, topY);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(topX, topY, tube.radius, tube.radius * 0.5, 0, 0, TAU);
        ctx.fillStyle = COLORS.abyss;
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
