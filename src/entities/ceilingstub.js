import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { LABYRINTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class CeilingStub extends Entity {
  constructor(x, y, options = {}) {
    const scale = options.scale ?? 1;
    const width = LABYRINTH.stubWidth * scale;
    const height = LABYRINTH.stubHeight * scale;
    super({ x, y, radius: Math.hypot(width, height) * 0.5 });
    this.width = width;
    this.height = height;
    this.vx = options.vx ?? rand(-30, 30);
    this.vy = options.vy ?? rand(0, 60);
    this.gravity = options.gravity ?? LABYRINTH.collapseStubGravity;
    this.spin = rand(-2.4, 2.4);
    this.rotation = rand(-0.25, 0.25);
    this.landY = options.landY ?? LOGICAL_HEIGHT * 0.5;
    this.landed = false;
    this.impacted = false;
    this.settle = 0;
    this.life = LABYRINTH.collapseStubLife;
    this.crossRows = 2 + Math.floor(scale * 2);
  }

  update(dt) {
    super.update(dt);
    if (this.landed) {
      this.settle += dt;
      this.rotation += this.spin * 0.2 * dt;
      if (this.settle >= this.life) this.kill();
      return;
    }
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.spin * dt;
    if (this.y >= this.landY) {
      this.y = this.landY;
      this.landed = true;
    }
  }

  render(ctx) {
    const fade = this.landed ? Math.max(0, 1 - this.settle / this.life) : 1;
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    const gradient = ctx.createLinearGradient(-halfW, 0, halfW, 0);
    gradient.addColorStop(0, COLORS.wreckWoodDark);
    gradient.addColorStop(0.5, COLORS.wreckWood);
    gradient.addColorStop(1, COLORS.wreckWoodDark);
    ctx.fillStyle = gradient;
    ctx.fillRect(-halfW, -halfH, this.width, this.height);
    ctx.strokeStyle = 'rgba(26, 18, 12, 0.6)';
    ctx.lineWidth = 2;
    for (let index = 1; index <= this.crossRows; index += 1) {
      const y = -halfH + (this.height * index) / (this.crossRows + 1);
      ctx.beginPath();
      ctx.moveTo(-halfW + 2, y);
      ctx.lineTo(halfW - 2, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(-halfW, -halfH, this.width, this.height);
    ctx.fillStyle = 'rgba(190, 180, 160, 0.4)';
    ctx.beginPath();
    ctx.arc(-halfW * 0.4, -halfH * 0.35, 2.2, 0, TAU);
    ctx.arc(halfW * 0.35, halfH * 0.3, 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
