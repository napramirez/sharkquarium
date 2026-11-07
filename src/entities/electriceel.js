import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { ELECTRIC_EEL, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class ElectricEel extends Entity {
  constructor() {
    super({ x: LOGICAL_WIDTH + 90, y: rand(120, LOGICAL_HEIGHT - 140), radius: ELECTRIC_EEL.radius });
    this.santa = true;
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
    ctx.save();
    ctx.translate(this.x, this.y);
    drawElectricEel(ctx, this.radius, this);
    ctx.restore();
  }
}

export function drawElectricEel(ctx, radius, pose) {
  const age = pose.age ?? 0;
  const phase = pose.phase ?? 0;
  const direction = pose.direction ?? 1;
  const spark = Math.sin(age * 5 + phase);
  ctx.save();
  ctx.globalAlpha = 0.12 + 0.06 * (spark + 1);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.2, 0, TAU);
  ctx.fillStyle = COLORS.lure;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.2, 0, TAU);
  ctx.strokeStyle = 'rgba(186, 247, 216, 0.35)';
  ctx.lineWidth = radius * 0.075;
  ctx.stroke();
  ctx.restore();

  const count = 10;
  const spacing = radius * 0.75;
  const spine = [];
  for (let i = 0; i < count; i += 1) {
    spine.push({
      x: direction * i * spacing,
      y: Math.sin(age * 5 + i * 0.9 + phase) * radius * 0.25,
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
    const width = radius * (0.32 + 0.78 * Math.pow(t, 0.8));
    leftEdge.push({ x: point.x - tangentY * width, y: point.y + tangentX * width });
    rightEdge.push({ x: point.x + tangentY * width, y: point.y - tangentX * width });
  }

  ctx.beginPath();
  ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
  for (let i = 1; i < count; i += 1) {
    const wave = Math.sin(age * 5 + i * 1.1 + phase) * radius * 0.2;
    ctx.lineTo(leftEdge[i].x, leftEdge[i].y - radius * 0.65 - wave);
  }
  for (let i = count - 1; i >= 0; i -= 1) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(138, 154, 79, 0.5)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(rightEdge[0].x, rightEdge[0].y);
  for (let i = 1; i < count; i += 1) {
    const wave = Math.sin(age * 5 + i * 1.1 + phase) * radius * 0.2;
    ctx.lineTo(rightEdge[i].x, rightEdge[i].y + radius * 0.55 + wave);
  }
  for (let i = count - 1; i >= 0; i -= 1) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(138, 154, 79, 0.5)';
  ctx.fill();

  const tail = spine[count - 1];
  ctx.beginPath();
  ctx.moveTo(tail.x + radius * 0.4, tail.y);
  ctx.lineTo(tail.x - radius * 0.7, tail.y - radius * 0.65);
  ctx.lineTo(tail.x - radius * 0.2, tail.y);
  ctx.lineTo(tail.x - radius * 0.7, tail.y + radius * 0.65);
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
  ctx.lineWidth = radius * 0.075;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(spine[0].x, spine[0].y);
  for (let i = 1; i < count; i += 1) ctx.lineTo(spine[i].x, spine[i].y);
  ctx.strokeStyle = 'rgba(186, 224, 140, 0.45)';
  ctx.lineWidth = radius * 0.45;
  ctx.lineCap = 'round';
  ctx.stroke();

  const finX = rightEdge[1].x + radius * 0.2;
  const finY = rightEdge[1].y + radius * 0.2;
  const finWave = Math.sin(age * 6 + phase) * radius * 0.1;
  ctx.beginPath();
  ctx.moveTo(finX, finY);
  ctx.lineTo(finX + radius * 0.9, finY + radius * 0.75 + finWave);
  ctx.lineTo(finX + radius * 1.1, finY + radius * 0.1);
  ctx.closePath();
  ctx.fillStyle = 'rgba(138, 154, 79, 0.85)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(finX, finY - radius * 0.8);
  ctx.lineTo(finX + radius * 0.9, finY - radius * 1.3 - finWave);
  ctx.lineTo(finX + radius * 1.1, finY - radius * 0.4);
  ctx.closePath();
  ctx.fillStyle = 'rgba(138, 154, 79, 0.85)';
  ctx.fill();

  const head = spine[0];
  ctx.beginPath();
  ctx.ellipse(head.x + radius * 0.4, head.y, radius * 1.2, radius * 0.75, 0, 0, TAU);
  ctx.fillStyle = COLORS.electric;
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 86, 40, 0.65)';
  ctx.lineWidth = radius * 0.075;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(head.x + radius * 0.8, head.y - radius * 0.25, radius * 0.13, 0, TAU);
  ctx.fillStyle = '#10233a';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(head.x + radius * 0.8, head.y + radius * 0.25, radius * 0.13, 0, TAU);
  ctx.fillStyle = '#10233a';
  ctx.fill();

  if (spark > 0.2) {
    ctx.strokeStyle = 'rgba(186, 247, 216, 0.9)';
    ctx.lineWidth = radius * 0.1;
    for (let i = 0; i < 3; i += 1) {
      const angle = phase + i * 2.1 + age;
      const startX = head.x + Math.cos(angle) * radius * 0.6;
      const startY = head.y + Math.sin(angle) * radius * 0.6;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(
        startX + Math.cos(angle) * radius * 0.7 + Math.sin(age * 20 + i) * radius * 0.3,
        startY + Math.sin(angle) * radius * 0.7 + Math.cos(age * 20 + i) * radius * 0.3,
      );
      ctx.lineTo(startX + Math.cos(angle) * radius * 1.3, startY + Math.sin(angle) * radius * 1.3);
      ctx.stroke();
    }
  }
}
