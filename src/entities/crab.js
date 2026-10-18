import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { CRAB, DEEPSEA, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Crab extends Entity {
  constructor() {
    super({ x: rand(40, LOGICAL_WIDTH - 40), y: -26, radius: CRAB.radius });
    this.score = CRAB.score;
    this.burst = [COLORS.crab, '#f0a48d', '#ffffff'];
    this.sink = rand(CRAB.sinkMin, CRAB.sinkMax);
    this.drift = rand(-CRAB.drift, CRAB.drift);
    this.phase = rand(0, TAU);
  }

  update(dt) {
    super.update(dt);
    this.y += this.sink * dt;
    this.x += (this.drift + Math.sin(this.age * 2.2 + this.phase) * 24) * dt;
    this.x = clamp(this.x, 24, LOGICAL_WIDTH - 24);
    if (this.y > LOGICAL_HEIGHT - DEEPSEA.floorHeight + 10) this.kill();
  }

  render(ctx) {
    const radius = this.radius;
    const snap = Math.sin(this.age * 7 + this.phase);
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.strokeStyle = COLORS.crab;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i += 1) {
        const legX = (i - 1) * radius * 0.5;
        ctx.beginPath();
        ctx.moveTo(legX, side * radius * 0.35);
        ctx.quadraticCurveTo(legX + radius * 0.2, side * radius * 0.85, legX + radius * 0.45, side * radius * 1.15);
        ctx.stroke();
      }
    }

    ctx.fillStyle = COLORS.crab;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * radius * 0.95, -radius * 0.15);
      ctx.rotate(side * (0.5 + snap * 0.18));
      ctx.beginPath();
      ctx.ellipse(side * radius * 0.25, 0, radius * 0.42, radius * 0.22, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(side * radius * 0.05, -radius * 0.22);
      ctx.lineTo(side * radius * 0.5, -radius * 0.42);
      ctx.lineTo(side * radius * 0.48, -radius * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.72, 0, 0, TAU);
    ctx.fillStyle = COLORS.crab;
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 42, 28, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-radius * 0.22, -radius * 0.22, radius * 0.3, radius * 0.16, -0.4, 0, TAU);
    ctx.fill();

    for (const side of [-1, 1]) {
      ctx.strokeStyle = COLORS.crab;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(side * radius * 0.22, -radius * 0.6);
      ctx.lineTo(side * radius * 0.3, -radius * 0.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(side * radius * 0.32, -radius * 1.02, radius * 0.17, 0, TAU);
      ctx.fillStyle = '#f4fbff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(side * radius * 0.34, -radius * 1.02, radius * 0.09, 0, TAU);
      ctx.fillStyle = '#10233a';
      ctx.fill();
    }

    ctx.restore();
  }
}
