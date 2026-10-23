import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { COLORSCHOOL, COLORSCHOOL_PALETTE, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class ColorSchool extends Entity {
  constructor() {
    const fromLeft = Math.random() < 0.5;
    super({
      x: fromLeft ? -COLORSCHOOL.cullMargin : LOGICAL_WIDTH + COLORSCHOOL.cullMargin,
      y: rand(120, LOGICAL_HEIGHT - 170),
      radius: COLORSCHOOL.radius,
    });
    this.direction = fromLeft ? 1 : -1;
    this.speed = rand(COLORSCHOOL.speedMin, COLORSCHOOL.speedMax);
    this.baseY = this.y;
    this.bobPhase = rand(0, TAU);
    this.bobSpeed = rand(COLORSCHOOL.bobSpeedMin, COLORSCHOOL.bobSpeedMax);
    const count = Math.floor(rand(COLORSCHOOL.fishCountMin, COLORSCHOOL.fishCountMax + 1));
    const colorOffset = Math.floor(rand(0, COLORSCHOOL_PALETTE.length));
    this.fish = Array.from({ length: count }, (_, index) => ({
      color: COLORSCHOOL_PALETTE[(index + colorOffset) % COLORSCHOOL_PALETTE.length],
      offsetX: rand(-COLORSCHOOL.spreadX, COLORSCHOOL.spreadX),
      offsetY: rand(-COLORSCHOOL.spreadY, COLORSCHOOL.spreadY),
      phase: rand(0, TAU),
      flutter: rand(3, 5),
      size: rand(5.5, 8),
    }));
  }

  update(dt) {
    super.update(dt);
    this.x += this.direction * this.speed * dt;
    this.y = this.baseY + Math.sin(this.age * this.bobSpeed + this.bobPhase) * COLORSCHOOL.bobAmp;
    if (this.x < -COLORSCHOOL.cullMargin || this.x > LOGICAL_WIDTH + COLORSCHOOL.cullMargin) {
      this.alive = false;
    }
  }

  render(ctx) {
    for (const fish of this.fish) {
      const x = this.x + fish.offsetX + Math.sin(this.age * fish.flutter + fish.phase) * 3;
      const y = this.y + fish.offsetY + Math.cos(this.age * fish.flutter * 0.7 + fish.phase) * 2.5;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(this.direction, 1);
      ctx.fillStyle = fish.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, fish.size, fish.size * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-fish.size * 0.75, -fish.size * 0.35);
      ctx.lineTo(-fish.size * 1.7, 0);
      ctx.lineTo(-fish.size * 0.75, fish.size * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-fish.size * 0.1, -fish.size * 0.4);
      ctx.lineTo(-fish.size * 0.45, -fish.size * 0.95);
      ctx.lineTo(-fish.size * 0.75, -fish.size * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(6, 18, 30, 0.8)';
      ctx.beginPath();
      ctx.arc(fish.size * 0.45, -fish.size * 0.1, 1.4, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}
