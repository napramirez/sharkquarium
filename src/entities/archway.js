import { Entity } from './entity.js';
import { ARCHWAY, SAND, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Archway extends Entity {
  constructor() {
    super({ x: LOGICAL_WIDTH / 2, y: ARCHWAY.beamTop + ARCHWAY.beamHeight / 2, radius: 0 });
    this.holes = Array.from({ length: ARCHWAY.holeCount }, (_, index) => ({
      x: (LOGICAL_WIDTH * (index + 1)) / (ARCHWAY.holeCount + 1),
      y: ARCHWAY.beamTop + ARCHWAY.beamHeight / 2,
    }));
    this.blobs = Array.from({ length: 16 }, (_, index) => ({
      x: (index * 149) % (LOGICAL_WIDTH - 40) + 20,
      y: ARCHWAY.beamTop + 10 + ((index * 53) % (ARCHWAY.beamHeight - 24)),
      rx: 12 + (index % 3) * 7,
      ry: 6 + (index % 2) * 5,
    }));
  }

  render(ctx) {
    const beamTop = ARCHWAY.beamTop;
    const beamBottom = beamTop + ARCHWAY.beamHeight;
    const sandTop = LOGICAL_HEIGHT - SAND.height;

    ctx.save();
    ctx.fillStyle = COLORS.rock;
    ctx.beginPath();
    ctx.moveTo(0, beamTop + 20);
    ctx.quadraticCurveTo(LOGICAL_WIDTH * 0.5, beamTop - 30, LOGICAL_WIDTH, beamTop + 20);
    ctx.lineTo(LOGICAL_WIDTH, beamBottom);
    ctx.quadraticCurveTo(LOGICAL_WIDTH * 0.5, beamBottom + 42, 0, beamBottom);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(0, beamTop + 14, ARCHWAY.legWidth, sandTop - beamTop - 14);
    ctx.fillRect(
      LOGICAL_WIDTH - ARCHWAY.legWidth,
      beamTop + 14,
      ARCHWAY.legWidth,
      sandTop - beamTop - 14,
    );

    ctx.fillStyle = COLORS.rockDark;
    for (const blob of this.blobs) {
      ctx.beginPath();
      ctx.ellipse(blob.x, blob.y, blob.rx, blob.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const hole of this.holes) {
      ctx.beginPath();
      ctx.moveTo(hole.x - ARCHWAY.holeWidth / 2, beamBottom + 14);
      ctx.lineTo(hole.x - ARCHWAY.holeWidth / 2, hole.y);
      ctx.arc(hole.x, hole.y, ARCHWAY.holeWidth / 2, Math.PI, 0);
      ctx.lineTo(hole.x + ARCHWAY.holeWidth / 2, beamBottom + 14);
      ctx.closePath();
      ctx.fillStyle = 'rgba(4, 16, 29, 0.92)';
      ctx.fill();
    }
    ctx.restore();
  }
}
