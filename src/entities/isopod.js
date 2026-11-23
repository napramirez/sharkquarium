import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { ISOPOD, DEEPSEA, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export function drawIsopod(ctx, radius, pose = {}) {
  const r = radius;
  const age = pose.age ?? 0;
  const legPhase = pose.legPhase ?? age * 6;
  const shell = '#8f8b74';
  const shellDark = '#6b6753';
  const belly = '#c9c3a6';
  const line = '#3f3a2b';

  ctx.save();

  ctx.strokeStyle = shellDark;
  ctx.lineWidth = r * 0.12;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i += 1) {
    const x = -r * 0.55 + i * (r * 1.1 / 6);
    for (const side of [-1, 1]) {
      const swing = Math.sin(legPhase + i * 0.7 + (side > 0 ? 0 : Math.PI)) * r * 0.16;
      ctx.beginPath();
      ctx.moveTo(x, side * r * 0.5);
      ctx.lineTo(x + swing, side * r * 0.98);
      ctx.stroke();
    }
  }

  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, 0);
  ctx.lineTo(-r * 1.5, -r * 0.5);
  ctx.lineTo(-r * 1.72, 0);
  ctx.lineTo(-r * 1.5, r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, belly);
  grad.addColorStop(0.5, shell);
  grad.addColorStop(1, shellDark);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.5, r * 0.85, 0, 0, TAU);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(60, 55, 40, 0.5)';
  ctx.lineWidth = r * 0.05;
  for (let i = 0; i < 6; i += 1) {
    const x = -r * 0.7 + i * r * 0.28;
    const half = Math.sqrt(Math.max(0, 1 - (x / (r * 1.5)) ** 2)) * r * 0.85;
    ctx.beginPath();
    ctx.moveTo(x, -half * 0.9);
    ctx.quadraticCurveTo(x + r * 0.08, 0, x, half * 0.9);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.ellipse(r * 1.12, 0, r * 0.52, r * 0.62, 0, 0, TAU);
  ctx.fillStyle = shellDark;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  ctx.strokeStyle = shellDark;
  ctx.lineWidth = r * 0.06;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 1.4, side * r * 0.25);
    ctx.quadraticCurveTo(r * 2.1, side * r * 0.52, r * 2.42, side * r * 0.2);
    ctx.stroke();
  }

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 1.22, side * r * 0.28, r * 0.12, 0, TAU);
    ctx.fillStyle = '#141414';
    ctx.fill();
  }

  ctx.restore();
}

export class Isopod extends Entity {
  constructor() {
    super({ x: rand(90, LOGICAL_WIDTH - 90), y: 0, radius: ISOPOD.radius });
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.timer = rand(1.5, 3.5);
    this.facing = this.dir;
  }

  update(dt) {
    super.update(dt);
    this.timer -= dt;
    if (this.timer <= 0) {
      if (Math.random() < 0.45) this.dir *= -1;
      this.timer = rand(1.5, 3.5);
    }
    this.x += this.dir * ISOPOD.speed * dt;
    const minX = ISOPOD.radius;
    const maxX = LOGICAL_WIDTH - ISOPOD.radius;
    if (this.x < minX) {
      this.x = minX;
      this.dir = 1;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.dir = -1;
    }
    this.facing = this.dir;
    this.y = LOGICAL_HEIGHT - DEEPSEA.floorHeight - 20 - Math.sin(this.age * 2) * 3;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);
    drawIsopod(ctx, this.radius, { age: this.age });
    ctx.restore();
  }
}
