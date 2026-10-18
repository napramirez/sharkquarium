import { Entity } from './entity.js';
import { rand, clamp } from '../engine/math.js';
import { ZONES, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class CurrentZone extends Entity {
  constructor() {
    const margin = ZONES.currentHeight / 2;
    super({ x: LOGICAL_WIDTH / 2, y: rand(margin, LOGICAL_HEIGHT - margin), radius: 0 });
    this.height = ZONES.currentHeight;
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.drift = ZONES.currentDrift * (Math.random() < 0.5 ? 1 : -1);
    this.life = ZONES.duration;
  }

  contains(entity) {
    return Math.abs(entity.y - this.y) <= this.height / 2;
  }

  force(entity, dt) {
    entity.vx += this.direction * ZONES.currentPush * dt;
  }

  update(dt) {
    super.update(dt);
    const margin = this.height / 2;
    this.y = clamp(this.y + this.drift * dt, margin, LOGICAL_HEIGHT - margin);
  }

  render(ctx) {
    const fade = Math.min(1, (this.life - this.age) / ZONES.fade);
    if (fade <= 0) return;
    ctx.save();
    ctx.globalAlpha = 0.16 * fade;
    ctx.fillStyle = COLORS.foam;
    ctx.fillRect(0, this.y - this.height / 2, LOGICAL_WIDTH, this.height);
    ctx.globalAlpha = 0.5 * fade;
    ctx.strokeStyle = COLORS.foam;
    ctx.lineWidth = 1.5;
    const offset = (this.age * 90 * this.direction) % 60;
    for (let x = -60 + offset; x < LOGICAL_WIDTH + 60; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, this.y - 8);
      ctx.lineTo(x + 22, this.y - 8);
      ctx.moveTo(x + 30, this.y + 10);
      ctx.lineTo(x + 52, this.y + 10);
      ctx.stroke();
    }
    ctx.restore();
  }
}
