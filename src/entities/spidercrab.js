import { TAU } from '../engine/math.js';

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function bodyPath(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.42);
  ctx.lineTo(r * 0.5, -r * 0.42);
  ctx.lineTo(r * 1.0, r * 0.5);
  ctx.lineTo(-r * 1.0, r * 0.5);
  ctx.closePath();
}

function flecks(ctx, r, seed, x0, y0, x1, y1, count) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let i = 0; i < count; i += 1) {
    const fx = x0 + hash(seed + i * 3.1) * (x1 - x0);
    const fy = y0 + hash(seed + i * 7.7) * (y1 - y0);
    ctx.beginPath();
    ctx.arc(fx, fy, r * (0.03 + hash(seed + i * 1.7) * 0.03), 0, TAU);
    ctx.fill();
  }
}

export function drawJapaneseSpiderCrab(ctx, radius, pose = {}) {
  const r = radius;
  const age = pose.age ?? 0;
  const speed = pose.speed ?? 0;
  const legPhase = pose.legPhase ?? age * (4 + Math.min(6, speed * 0.02));
  const leg = '#d9a24a';
  const legDark = '#a9772c';
  const red = '#c0392b';
  const cream = '#efd9b8';
  const outline = '#5f3218';

  ctx.save();
  ctx.rotate(Math.sin(age * 2) * 0.02);

  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i += 1) {
      const bx = -r * 0.7 + i * r * 0.4;
      const by = side * r * 0.34;
      const swing = Math.sin(legPhase + i * 1.1 + (side > 0 ? 0.6 : 0)) * r * 0.16;
      const kx = bx + r * 0.18 + r * 0.06 * i;
      const ky = by + side * r * (0.9 + 0.1 * i);
      const tx = kx - r * (0.7 + 0.15 * i) + swing;
      const ty = ky + side * r * (1.1 + 0.12 * i);
      ctx.lineCap = 'round';
      ctx.strokeStyle = outline;
      ctx.lineWidth = r * 0.11;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(kx, ky);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.strokeStyle = leg;
      ctx.lineWidth = r * 0.06;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(kx, ky);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
  }

  for (const side of [-1, 1]) {
    const bx = r * 0.5;
    const by = side * r * 0.24;
    const ex = r * 1.15;
    const ey = side * r * 0.8;
    const hx = r * 1.85;
    const hy = side * r * 0.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = outline;
    ctx.lineWidth = r * 0.17;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.strokeStyle = leg;
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.strokeStyle = legDark;
    ctx.lineWidth = r * 0.04;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(side * 0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.3, r * 0.22, 0, 0, TAU);
    ctx.fillStyle = red;
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = r * 0.05;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.2, -r * 0.05);
    ctx.quadraticCurveTo(r * 0.6, -r * 0.25, r * 0.72, -r * 0.02);
    ctx.quadraticCurveTo(r * 0.5, r * 0.08, r * 0.2, r * 0.06);
    ctx.closePath();
    ctx.fillStyle = red;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.2, r * 0.02);
    ctx.quadraticCurveTo(r * 0.55, r * 0.2, r * 0.66, r * 0.24);
    ctx.quadraticCurveTo(r * 0.44, r * 0.28, r * 0.2, r * 0.18);
    ctx.closePath();
    ctx.fillStyle = red;
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.3, r * 0.22, 0, 0, TAU);
    ctx.clip();
    flecks(ctx, r, side * 11 + 3, -r * 0.3, -r * 0.22, r * 0.3, r * 0.22, 6);
    ctx.restore();
    ctx.restore();
  }

  ctx.save();
  bodyPath(ctx, r);
  ctx.fillStyle = cream;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = red;
  ctx.fillRect(-r * 1.2, -r * 0.6, r * 2.4, r * 0.62);
  flecks(ctx, r, 1, -r * 1.05, -r * 0.55, r * 1.05, r * 0.02, 26);
  ctx.restore();
  ctx.strokeStyle = outline;
  ctx.lineWidth = r * 0.06;
  bodyPath(ctx, r);
  ctx.stroke();
  ctx.restore();

  for (const ex of [r * 0.22, r * 0.46]) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(ex, -r * 0.42);
    ctx.lineTo(ex, -r * 0.56);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, -r * 0.6, r * 0.09, 0, TAU);
    ctx.fillStyle = '#1c1712';
    ctx.fill();
  }

  ctx.restore();
}
