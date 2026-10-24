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
    ctx.save();
    ctx.translate(this.x, this.y);
    const head = this.renderBody(ctx);
    this.renderHead(ctx, head);
    ctx.restore();
  }

  renderBody(ctx) {
    const radius = this.radius;
    const count = 16;
    const spine = [];
    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      spine.push({
        x: -this.direction * t * 9 * (count - 1),
        y: Math.sin(this.age * 11 + this.wavePhase - i * 0.5) * radius * (0.14 + t * 0.55),
        t,
      });
    }
    const left = [];
    const right = [];
    for (let i = 0; i < count; i += 1) {
      const point = spine[i];
      const before = spine[Math.max(0, i - 1)];
      const after = spine[Math.min(count - 1, i + 1)];
      let tangentX = before.x - after.x;
      let tangentY = before.y - after.y;
      const length = Math.hypot(tangentX, tangentY) || 1;
      tangentX /= length;
      tangentY /= length;
      const width = radius * (0.42 * (1 - point.t) + 0.08);
      left.push({ x: point.x - tangentY * width, y: point.y + tangentX * width });
      right.push({ x: point.x + tangentY * width, y: point.y - tangentX * width });
    }

    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < count; i += 1) ctx.lineTo(left[i].x, left[i].y);
    for (let i = count - 1; i >= 0; i -= 1) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();
    ctx.fillStyle = COLORS.eel;
    ctx.fill();
    ctx.strokeStyle = COLORS.eelDark;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = COLORS.eelBelly;
    ctx.lineCap = 'round';
    for (let i = 0; i < count - 1; i += 1) {
      const mid = (spine[i].t + spine[i + 1].t) * 0.5;
      ctx.lineWidth = Math.max(0.8, radius * (0.42 * (1 - mid) + 0.08) * 0.55);
      ctx.beginPath();
      ctx.moveTo(spine[i].x, spine[i].y);
      ctx.lineTo(spine[i + 1].x, spine[i + 1].y);
      ctx.stroke();
    }
    ctx.restore();
    return spine[0];
  }

  renderHead(ctx, head) {
    const radius = this.radius;
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.scale(this.direction, 1);

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = COLORS.eelDark;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.35, side * radius * 0.34);
      ctx.quadraticCurveTo(-radius * 0.35, side * radius * 0.82, -radius * 1.05, side * radius * 0.66);
      ctx.quadraticCurveTo(-radius * 0.85, side * radius * 0.4, -radius * 0.35, side * radius * 0.34);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(-radius * 0.6, 0);
    ctx.quadraticCurveTo(radius * 0.8, -radius * 0.46, radius * 1.45, -radius * 0.14);
    ctx.quadraticCurveTo(radius * 1.62, 0, radius * 1.45, radius * 0.14);
    ctx.quadraticCurveTo(radius * 0.8, radius * 0.46, -radius * 0.6, 0);
    ctx.closePath();
    ctx.fillStyle = COLORS.eel;
    ctx.fill();
    ctx.strokeStyle = COLORS.eelDark;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(radius * 1.42, 0);
    ctx.quadraticCurveTo(radius * 0.8, radius * 0.1, radius * 0.2, radius * 0.06);
    ctx.strokeStyle = COLORS.eelDark;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(radius * 0.55, -radius * 0.22, radius * 0.17, 0, TAU);
    ctx.fillStyle = '#f4fbff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.58, -radius * 0.22, radius * 0.1, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
    ctx.restore();
  }
}
