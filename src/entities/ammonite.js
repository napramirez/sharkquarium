import { TAU } from '../engine/math.js';

export function drawAmmonite(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const r = radius;
  const shell = '#c9b07a';
  const shellDark = '#8f7748';
  const rib = '#a68c58';
  const flesh = '#dcc9a4';
  const line = '#5f4f30';

  ctx.save();
  ctx.rotate(Math.sin(age * 1.4) * 0.05);

  const cx = -r * 0.15;
  const cy = 0;

  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.02, 0, TAU);
  ctx.fillStyle = shell;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.08;
  ctx.stroke();

  ctx.strokeStyle = rib;
  ctx.lineWidth = r * 0.05;
  for (let k = 0; k < 14; k += 1) {
    const a = (k / 14) * TAU + age * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2);
    ctx.lineTo(cx + Math.cos(a) * r * 0.94, cy + Math.sin(a) * r * 0.94);
    ctx.stroke();
  }

  ctx.strokeStyle = shellDark;
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  for (let a = 0; a <= Math.PI * 3.4; a += 0.18) {
    const rad = r * (0.16 + (a / (Math.PI * 3.4)) * 0.78);
    const x = cx + Math.cos(a + Math.PI) * rad;
    const y = cy + Math.sin(a + Math.PI) * rad;
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(r * 0.92, r * 0.16, r * 0.42, r * 0.36, 0, 0, TAU);
  ctx.fillStyle = flesh;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.06;
  ctx.stroke();

  ctx.strokeStyle = flesh;
  ctx.lineWidth = r * 0.11;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i += 1) {
    const spread = (i - 2) * 0.22;
    const wob = Math.sin(age * 4 + i) * r * 0.08;
    ctx.beginPath();
    ctx.moveTo(r * 1.05, r * 0.16);
    ctx.quadraticCurveTo(r * 1.5, r * (0.16 + spread), r * 1.9, r * (0.16 + spread * 1.8) + wob);
    ctx.stroke();
  }

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.95, r * (0.16 + side * 0.14), r * 0.08, 0, TAU);
    ctx.fillStyle = '#1a140c';
    ctx.fill();
  }

  ctx.restore();
}
