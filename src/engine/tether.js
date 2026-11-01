import { TAU } from './math.js';

export function drawTetherLine(ctx, from, to, color, glow, time) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const bow = Math.min(26, len * 0.08) * Math.sin(time * 6 + len * 0.05);
  const mx = (from.x + to.x) / 2 + nx * bow;
  const my = (from.y + to.y) / 2 + ny * bow;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = glow;
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(mx, my, to.x, to.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(mx, my, to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

export function drawClampHead(ctx, x, y, angle, color, glow, open = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  const spread = 0.32 + open * 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.quadraticCurveTo(12, dir * 8 * spread, 18, dir * 11 * spread - dir * 3);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawReticle(ctx, x, y, color, active) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.globalAlpha = active ? 1 : 0.6;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.lineTo(-8, 0);
  ctx.moveTo(8, 0);
  ctx.lineTo(20, 0);
  ctx.moveTo(0, -20);
  ctx.lineTo(0, -8);
  ctx.moveTo(0, 8);
  ctx.lineTo(0, 20);
  ctx.stroke();
  ctx.globalAlpha = active ? 0.9 : 0.4;
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, TAU);
  ctx.fill();
  ctx.restore();
}
