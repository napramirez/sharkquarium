import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { ELECTRIC_EEL, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class ElectricEel extends Entity {
  constructor() {
    super({ x: LOGICAL_WIDTH + 90, y: rand(120, LOGICAL_HEIGHT - 140), radius: ELECTRIC_EEL.radius });
    this.heading = Math.PI;
    this.phase = rand(0, TAU);
  }

  update(dt, players, scrollSpeed, speedScale = 1) {
    super.update(dt);
    this.x -= (scrollSpeed + 20) * dt;
    let target = null;
    let best = Infinity;
    for (const player of players) {
      if (player.concealed === true) continue;
      const distance = Math.abs(player.y - this.y);
      if (distance < best) {
        best = distance;
        target = player;
      }
    }
    if (target) {
      this.y += clamp(target.y - this.y, -1, 1) * ELECTRIC_EEL.seekSpeed * speedScale * dt;
    }
    this.y = clamp(this.y, 80, LOGICAL_HEIGHT - 80);
  }

  render(ctx) {
    const spark = Math.sin(this.age * 5 + this.phase);
    ctx.save();
    ctx.globalAlpha = 0.12 + 0.06 * (spark + 1);
    ctx.beginPath();
    ctx.arc(this.x, this.y, ELECTRIC_EEL.fieldRadius, 0, TAU);
    ctx.fillStyle = COLORS.lure;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, ELECTRIC_EEL.fieldRadius, 0, TAU);
    ctx.strokeStyle = 'rgba(186, 247, 216, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    const count = 10;
    const spacing = 15;
    const spine = [];
    for (let i = 0; i < count; i += 1) {
      spine.push({
        x: this.x + i * spacing,
        y: this.y + Math.sin(this.age * 5 + i * 0.9 + this.phase) * 5,
      });
    }
    const leftEdge = [];
    const rightEdge = [];
    for (let i = 0; i < count; i += 1) {
      const point = spine[i];
      const before = spine[Math.max(0, i - 1)];
      const after = spine[Math.min(count - 1, i + 1)];
      let tangentX = before.x - after.x;
      let tangentY = before.y - after.y;
      const length = Math.hypot(tangentX, tangentY) || 1;
      tangentX /= length;
      tangentY /= length;
      const t = 1 - i / (count - 1);
      const width = ELECTRIC_EEL.radius * (0.32 + 0.78 * Math.pow(t, 0.8));
      leftEdge.push({ x: point.x - tangentY * width, y: point.y + tangentX * width });
      rightEdge.push({ x: point.x + tangentY * width, y: point.y - tangentX * width });
    }

    ctx.beginPath();
    ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
    for (let i = 1; i < count; i += 1) {
      const wave = Math.sin(this.age * 5 + i * 1.1 + this.phase) * 4;
      ctx.lineTo(leftEdge[i].x, leftEdge[i].y - 13 - wave);
    }
    for (let i = count - 1; i >= 0; i -= 1) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(138, 154, 79, 0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(rightEdge[0].x, rightEdge[0].y);
    for (let i = 1; i < count; i += 1) {
      const wave = Math.sin(this.age * 5 + i * 1.1 + this.phase) * 4;
      ctx.lineTo(rightEdge[i].x, rightEdge[i].y + 11 + wave);
    }
    for (let i = count - 1; i >= 0; i -= 1) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(138, 154, 79, 0.5)';
    ctx.fill();

    const tail = spine[count - 1];
    ctx.beginPath();
    ctx.moveTo(tail.x + 8, tail.y);
    ctx.lineTo(tail.x - 14, tail.y - 13);
    ctx.lineTo(tail.x - 4, tail.y);
    ctx.lineTo(tail.x - 14, tail.y + 13);
    ctx.closePath();
    ctx.fillStyle = 'rgba(138, 154, 79, 0.75)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
    for (let i = 1; i < count; i += 1) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
    for (let i = count - 1; i >= 0; i -= 1) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
    ctx.closePath();
    ctx.fillStyle = COLORS.electric;
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 86, 40, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(spine[0].x, spine[0].y);
    for (let i = 1; i < count; i += 1) ctx.lineTo(spine[i].x, spine[i].y);
    ctx.strokeStyle = 'rgba(186, 224, 140, 0.45)';
    ctx.lineWidth = ELECTRIC_EEL.radius * 0.45;
    ctx.lineCap = 'round';
    ctx.stroke();

    const finX = rightEdge[1].x + 4;
    const finY = rightEdge[1].y + 4;
    const finWave = Math.sin(this.age * 6 + this.phase) * 2;
    ctx.beginPath();
    ctx.moveTo(finX, finY);
    ctx.lineTo(finX + 18, finY + 15 + finWave);
    ctx.lineTo(finX + 22, finY + 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(138, 154, 79, 0.85)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(finX, finY - 16);
    ctx.lineTo(finX + 18, finY - 26 - finWave);
    ctx.lineTo(finX + 22, finY - 8);
    ctx.closePath();
    ctx.fillStyle = 'rgba(138, 154, 79, 0.85)';
    ctx.fill();

    const head = spine[0];
    ctx.beginPath();
    ctx.ellipse(head.x + 8, head.y, 24, 15, 0, 0, TAU);
    ctx.fillStyle = COLORS.electric;
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 86, 40, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(head.x + 16, head.y - 5, 2.6, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x + 16, head.y + 5, 2.6, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();

    if (spark > 0.2) {
      ctx.strokeStyle = 'rgba(186, 247, 216, 0.9)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        const angle = this.phase + i * 2.1 + this.age;
        const startX = head.x + Math.cos(angle) * 12;
        const startY = head.y + Math.sin(angle) * 12;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(
          startX + Math.cos(angle) * 14 + Math.sin(this.age * 20 + i) * 6,
          startY + Math.sin(angle) * 14 + Math.cos(this.age * 20 + i) * 6,
        );
        ctx.lineTo(startX + Math.cos(angle) * 26, startY + Math.sin(angle) * 26);
        ctx.stroke();
      }
    }
  }
}
