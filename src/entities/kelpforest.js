import { rand, TAU } from '../engine/math.js';
import { KELP, SAND, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

function pointAt(p0, p1, p2, t) {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

export class KelpForest {
  constructor() {
    this.age = 0;
    const span = (LOGICAL_WIDTH - 180) / Math.max(1, KELP.stalkCount - 1);
    this.stalks = Array.from({ length: KELP.stalkCount }, (_, index) => ({
      x: 90 + span * index + rand(-40, 40),
      height: rand(190, 330),
      lean: rand(-26, 26),
      phase: rand(0, TAU),
    }));
  }

  update(dt) {
    this.age += dt;
  }

  render(ctx) {
    const baseY = LOGICAL_HEIGHT - SAND.height + 12;
    for (const stalk of this.stalks) {
      const sway = Math.sin(this.age * 1.1 + stalk.phase) * 10;
      const midX = stalk.x + stalk.lean * 0.4;
      const midY = baseY - stalk.height * 0.55;
      const topX = stalk.x + stalk.lean + sway;
      const topY = baseY - stalk.height;

      ctx.strokeStyle = COLORS.kelpLeafDark;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(stalk.x, baseY);
      ctx.quadraticCurveTo(midX, midY, topX, topY);
      ctx.stroke();

      ctx.fillStyle = COLORS.kelpLeaf;
      for (let i = 1; i <= 5; i += 1) {
        const t = i / 6;
        const bladeX = pointAt(stalk.x, midX, topX, t);
        const bladeY = pointAt(baseY, midY, topY, t);
        const side = i % 2 === 0 ? 1 : -1;
        ctx.beginPath();
        ctx.ellipse(
          bladeX + side * 15,
          bladeY - 4,
          16,
          6,
          side * (0.45 + Math.sin(this.age * 1.4 + stalk.phase + i) * 0.1),
          0,
          TAU,
        );
        ctx.fill();
      }
    }
  }
}
