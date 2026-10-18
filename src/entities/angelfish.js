import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { ANGELFISH, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Angelfish extends Entity {
  constructor() {
    const direction = Math.random() < 0.5 ? 1 : -1;
    const y = rand(90, LOGICAL_HEIGHT - 90);
    super({ x: direction > 0 ? -48 : LOGICAL_WIDTH + 48, y, radius: ANGELFISH.radius });
    this.direction = direction;
    this.baseY = y;
    this.bob = rand(ANGELFISH.bob * 0.6, ANGELFISH.bob);
    this.bobSpeed = rand(ANGELFISH.bobSpeed * 0.8, ANGELFISH.bobSpeed * 1.2);
    this.phase = rand(0, TAU);
    this.score = ANGELFISH.score;
    this.burst = [COLORS.accent, COLORS.text, '#ffffff'];
  }

  update(dt) {
    super.update(dt);
    this.x += this.direction * ANGELFISH.speed * dt;
    this.y = this.baseY + Math.sin(this.age * this.bobSpeed + this.phase) * this.bob;
    if (this.x < -70 || this.x > LOGICAL_WIDTH + 70) this.kill();
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.direction, 1);

    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-26, -12);
    ctx.lineTo(-26, 12);
    ctx.closePath();
    ctx.fillStyle = COLORS.accent;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-6, -20);
    ctx.quadraticCurveTo(2, -34, 10, -18);
    ctx.lineTo(2, -8);
    ctx.closePath();
    ctx.fillStyle = COLORS.accent;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 26, 0, 0, TAU);
    ctx.fillStyle = COLORS.text;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 26, 0, 0, TAU);
    ctx.clip();
    ctx.fillStyle = 'rgba(84, 116, 139, 0.55)';
    ctx.fillRect(-3, -26, 5, 52);
    ctx.fillRect(5, -26, 5, 52);
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 26, 0, 0, TAU);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(16, 35, 58, 0.6)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(6, -12, 2.6, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();

    ctx.restore();
  }
}
