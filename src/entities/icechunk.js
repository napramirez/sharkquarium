import { Entity } from './entity.js';
import { LOGICAL_WIDTH, COLORS } from '../config.js';

export class IceChunk extends Entity {
  constructor() {
    super({ x: LOGICAL_WIDTH / 2, y: 100, radius: 0 });
    this.width = 250;
    this.height = 52;
    this.perches = [
      { x: this.x - 58, y: this.y - this.height / 2 },
      { x: this.x + 58, y: this.y - this.height / 2 },
    ];
    this.cracks = [
      [-90, 2, -34, -8],
      [-22, 8, 28, -4],
      [38, 0, 92, -10],
    ];
  }

  render(ctx) {
    const left = this.x - this.width / 2;
    const top = this.y - this.height / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left, top + 10);
    ctx.quadraticCurveTo(this.x, top - 14, left + this.width, top + 10);
    ctx.lineTo(left + this.width, top + this.height * 0.55);
    ctx.quadraticCurveTo(this.x, top + this.height + 26, left, top + this.height * 0.55);
    ctx.closePath();
    ctx.fillStyle = COLORS.ice;
    ctx.fill();
    ctx.strokeStyle = COLORS.iceDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(179, 208, 224, 0.5)';
    ctx.beginPath();
    ctx.ellipse(this.x, top + this.height * 0.75, this.width * 0.4, this.height * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(179, 208, 224, 0.8)';
    ctx.lineWidth = 1.5;
    for (const crack of this.cracks) {
      ctx.beginPath();
      ctx.moveTo(this.x + crack[0], this.y + crack[1]);
      ctx.lineTo(this.x + crack[2], this.y + crack[3]);
      ctx.stroke();
    }
    ctx.restore();
  }
}
