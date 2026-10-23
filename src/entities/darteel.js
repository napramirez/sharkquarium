import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { NAUTILUS, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class DartEel extends Entity {
  constructor() {
    super({
      x: rand(90, LOGICAL_WIDTH - 90),
      y: LOGICAL_HEIGHT + 120,
      radius: NAUTILUS.eelRadius,
    });
    this.direction = Math.random() < 0.5 ? -1 : 1;
    this.speed = rand(NAUTILUS.eelSpeedMin, NAUTILUS.eelSpeedMax);
    this.wavePhase = rand(0, TAU);
  }

  update(dt, scrollSpeed) {
    super.update(dt);
    this.y -= scrollSpeed * dt;
    this.x += this.direction * this.speed * dt;
    if (this.x < this.radius) {
      this.x = this.radius;
      this.direction = 1;
    } else if (this.x > LOGICAL_WIDTH - this.radius) {
      this.x = LOGICAL_WIDTH - this.radius;
      this.direction = -1;
    }
  }

  render(ctx) {
    const segments = 9;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = COLORS.eel;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < segments; i += 1) {
      const px = -this.direction * i * 8;
      const py = Math.sin(this.age * 12 + this.wavePhase - i * 0.7) * 6;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, TAU);
    ctx.fillStyle = COLORS.eel;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.direction * 3.5, -2, 2, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
    ctx.restore();
  }
}
