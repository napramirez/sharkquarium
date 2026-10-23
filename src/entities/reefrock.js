import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { COLORS, REEF_ROCK, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const SHAPE = [
  [-1, 0.05],
  [-0.86, -0.42],
  [-0.52, -0.78],
  [-0.12, -1],
  [0.3, -0.92],
  [0.68, -0.66],
  [0.92, -0.3],
  [1, 0.05],
];

export class ReefRock extends Entity {
  constructor(side) {
    super({
      x: side < 0 ? REEF_ROCK.inset : LOGICAL_WIDTH - REEF_ROCK.inset,
      y: LOGICAL_HEIGHT - 6,
      radius: REEF_ROCK.radiusMax,
    });
    this.side = side;
    this.size = rand(REEF_ROCK.radiusMin, REEF_ROCK.radiusMax);
    this.radius = this.size;
    this.humps = SHAPE.map(([x, y]) => [x * rand(0.9, 1.08), y * rand(0.88, 1.12)]);
  }

  render(ctx) {
    const rx = this.size;
    const ry = this.size * 0.82;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = COLORS.rockDark;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 1.06, 10, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    this.humps.forEach(([hx, hy], index) => {
      if (index === 0) ctx.moveTo(hx * rx, hy * ry);
      else ctx.lineTo(hx * rx, hy * ry);
    });
    ctx.closePath();
    ctx.fillStyle = COLORS.rock;
    ctx.fill();
    ctx.strokeStyle = COLORS.rockDark;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(52, 56, 61, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx * -0.45, ry * -0.35);
    ctx.lineTo(rx * -0.05, ry * -0.6);
    ctx.lineTo(rx * 0.3, ry * -0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx * 0.35, ry * -0.75);
    ctx.lineTo(rx * 0.55, ry * -0.5);
    ctx.stroke();
    ctx.restore();
  }
}
