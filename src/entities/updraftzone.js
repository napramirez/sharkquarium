import { Entity } from './entity.js';
import { rand } from '../engine/math.js';
import { ZONES, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class UpdraftZone extends Entity {
  constructor(x = null) {
    const margin = ZONES.updraftWidth / 2 + 30;
    super({ x: x ?? rand(margin, LOGICAL_WIDTH - margin), y: LOGICAL_HEIGHT / 2, radius: 0 });
    this.width = ZONES.updraftWidth;
    this.life = ZONES.duration;
  }

  contains(entity) {
    return Math.abs(entity.x - this.x) <= this.width / 2;
  }

  force(entity, dt) {
    entity.vy -= ZONES.updraftPush * dt;
  }

  render(ctx) {
    const fade = Math.min(1, (this.life - this.age) / ZONES.fade);
    if (fade <= 0) return;
    const left = this.x - this.width / 2;
    ctx.save();
    ctx.globalAlpha = 0.14 * fade;
    ctx.fillStyle = COLORS.bubble;
    ctx.fillRect(left, 0, this.width, LOGICAL_HEIGHT);
    ctx.globalAlpha = 0.45 * fade;
    ctx.strokeStyle = COLORS.bubble;
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      const baseY = LOGICAL_HEIGHT - ((this.age * 170 + i * 140) % (LOGICAL_HEIGHT + 60));
      const x = left + this.width * (0.2 + 0.15 * i);
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, baseY - 26);
      ctx.stroke();
    }
    ctx.restore();
  }
}
