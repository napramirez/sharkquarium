import { TAU } from '../engine/math.js';

export function drawCuttlefishMantleFin(ctx, radius, pose = {}) {
  const r = radius;
  const age = pose.age ?? 0;
  const finColor = pose.finColor ?? 'rgba(18, 48, 120, 0.7)';
  const edge = [];
  const quad = (ax, ay, cx, cy, bx, by, steps) => {
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const mt = 1 - t;
      edge.push([
        mt * mt * ax + 2 * mt * t * cx + t * t * bx,
        mt * mt * ay + 2 * mt * t * cy + t * t * by,
      ]);
    }
  };
  quad(r * 1.0, 0, r * 0.6, -r * 0.82, -r * 0.7, -r * 0.6, 9);
  quad(-r * 0.7, -r * 0.6, -r * 1.6, -r * 0.2, -r * 1.6, 0, 6);
  quad(-r * 1.6, 0, -r * 1.6, r * 0.2, -r * 0.7, r * 0.6, 6);
  quad(-r * 0.7, r * 0.6, r * 0.6, r * 0.82, r * 1.0, 0, 9);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = finColor;
  ctx.lineWidth = r * 0.3 + Math.sin(age * 5) * r * 0.04;
  ctx.beginPath();
  for (let i = 0; i < edge.length; i += 1) {
    const n = edge.length;
    const prev = edge[(i - 1 + n) % n];
    const next = edge[(i + 1) % n];
    const tx = next[0] - prev[0];
    const ty = next[1] - prev[1];
    const len = Math.hypot(tx, ty) || 1;
    const wave = Math.sin(i * 0.9 - age * 6) * r * 0.07;
    const px = edge[i][0] - (ty / len) * wave;
    const py = edge[i][1] + (tx / len) * wave;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawCuttlefishGlyph(ctx, radius, pose, bodyColor) {
  const r = radius;
  const age = pose.age ?? 0;
  const camo = pose.camo ?? 0;
  const strike = pose.strike ?? 0;
  const hypno = pose.hypno ?? 0;
  const body = bodyColor;
  const clip = 'rgba(0, 0, 0, 0.5)';
  const finColor = 'rgba(18, 48, 120, 0.7)';
  const ripple = Math.sin(age * 3) * r * 0.08;
  const alpha = 1 - camo * 0.55;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(r * 1.0, 0);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.82, -r * 0.7, -r * 0.6);
  ctx.quadraticCurveTo(-r * 1.6, -r * 0.2, -r * 1.6, 0);
  ctx.quadraticCurveTo(-r * 1.6, r * 0.2, -r * 0.7, r * 0.6);
  ctx.quadraticCurveTo(r * 0.6, r * 0.82, r * 1.0, 0);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();

  drawCuttlefishMantleFin(ctx, radius, { age, finColor });

  ctx.fillStyle = 'rgba(120, 24, 24, 0.35)';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.75, side * r * 0.42);
    ctx.quadraticCurveTo(-r * 1.5, side * (r * 0.72 + ripple), -r * 1.66, side * r * 0.05);
    ctx.quadraticCurveTo(-r * 1.25, side * r * 0.3, -r * 0.75, side * r * 0.42);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = clip;
  for (let i = 0; i < 12; i += 1) {
    ctx.globalAlpha = alpha * 0.22;
    ctx.beginPath();
    ctx.ellipse(-r * 1.25 + (i % 4) * r * 0.45, ((i % 3) - 1) * r * 0.26, r * 0.06, r * 0.05, 0, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = alpha;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(r * 1.0, 0);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.82, -r * 0.7, -r * 0.6);
  ctx.quadraticCurveTo(-r * 1.6, -r * 0.2, -r * 1.6, 0);
  ctx.quadraticCurveTo(-r * 1.6, r * 0.2, -r * 0.7, r * 0.6);
  ctx.quadraticCurveTo(r * 0.6, r * 0.82, r * 1.0, 0);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = r * 0.022;
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i += 1) {
    const x0 = -r * 1.5 + i * (r * 2.4 / 13);
    ctx.beginPath();
    for (let y = -r * 0.78; y <= r * 0.78; y += r * 0.08) {
      const x = x0
        + Math.sin((y / r) * 4 + i * 0.8) * r * 0.045
        + Math.sin((y / r) * 9 + i * 1.7) * r * 0.015;
      if (y <= -r * 0.78 + r * 0.001) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();

  const splay = pose.splay ?? 0;
  const baseX = r * 0.92;
  const apexX = r * 1.34;
  const baseHalf = r * 0.3;

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(r * 0.72, 0, r * 0.4, r * 0.4, 0, 0, TAU);
  ctx.fill();

  if (splay < 0.99) {
    ctx.globalAlpha = alpha * (1 - splay);
    ctx.beginPath();
    ctx.moveTo(baseX, -baseHalf);
    ctx.lineTo(apexX, 0);
    ctx.lineTo(baseX, baseHalf);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = r * 0.035;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = r * 0.028;
    for (let i = -2; i <= 2; i += 1) {
      const y0 = (i / 2) * baseHalf * 0.85;
      ctx.beginPath();
      ctx.moveTo(baseX + r * 0.05, y0);
      ctx.lineTo(apexX - r * 0.1, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
  }

  if (splay > 0.02) {
    const fanLen = r * (0.34 + splay * 0.34);
    const fanBase = baseX - r * 0.18;
    ctx.strokeStyle = body;
    ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i += 1) {
      const ang = (i / 2) * (0.12 + splay * 0.55);
      const tipX = fanBase + Math.cos(ang) * fanLen;
      const tipY = Math.sin(ang) * fanLen;
      ctx.globalAlpha = alpha * splay;
      ctx.lineWidth = r * 0.15;
      ctx.beginPath();
      ctx.moveTo(fanBase, i * r * 0.06);
      ctx.quadraticCurveTo(fanBase + fanLen * 0.6, (i * r * 0.06 + tipY) * 0.5, tipX, tipY);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
  }

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(r * 0.66, side * r * 0.32);
    ctx.rotate(-side * 0.7);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.25, r * 0.15, 0, 0, TAU);
    ctx.fillStyle = '#efe6d4';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.03, 0, r * 0.17, r * 0.045, 0, 0, TAU);
    ctx.fillStyle = '#141018';
    ctx.fill();
    ctx.restore();
  }

  if (strike > 0.01) {
    const feedLen = r * (0.9 + 2.8 * strike);
    const offset = r * 0.12;
    const x0 = apexX - r * 0.35;
    const x1 = x0 + feedLen;
    for (const side of [-1, 1]) {
      const ly = side * offset;
      const grad = ctx.createLinearGradient(x0, 0, x1, 0);
      grad.addColorStop(0, body);
      grad.addColorStop(0.5, '#c84cc8');
      grad.addColorStop(1, '#3b6bff');
      ctx.strokeStyle = grad;
      ctx.lineWidth = r * 0.15;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, ly);
      ctx.lineTo(x1, ly);
      ctx.stroke();
      ctx.save();
      ctx.translate(x1, ly);
      ctx.fillStyle = '#3b6bff';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 0.26, -r * 0.21, r * 0.54, 0);
      ctx.quadraticCurveTo(r * 0.26, r * 0.21, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = r * 0.025;
      ctx.stroke();
      ctx.restore();
    }
  }

  if (hypno > 0.08) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(r * 1.0, 0);
    ctx.quadraticCurveTo(r * 0.6, -r * 0.82, -r * 0.7, -r * 0.6);
    ctx.quadraticCurveTo(-r * 1.6, -r * 0.2, -r * 1.6, 0);
    ctx.quadraticCurveTo(-r * 1.6, r * 0.2, -r * 0.7, r * 0.6);
    ctx.quadraticCurveTo(r * 0.6, r * 0.82, r * 1.0, 0);
    ctx.closePath();
    ctx.ellipse(r * 0.72, 0, r * 0.4, r * 0.4, 0, 0, TAU);
    ctx.closePath();
    ctx.moveTo(baseX, -baseHalf);
    ctx.lineTo(apexX, 0);
    ctx.lineTo(baseX, baseHalf);
    ctx.closePath();
    ctx.clip();
    const phase = (age * 1.3) % 1;
    const bandX = -r * 1.8 + phase * (r * 3.6);
    const grad = ctx.createLinearGradient(bandX - r * 0.8, 0, bandX + r * 0.8, 0);
    grad.addColorStop(0, 'rgba(120, 220, 255, 0)');
    grad.addColorStop(0.5, 'rgba(150, 230, 255, 0.85)');
    grad.addColorStop(1, 'rgba(120, 220, 255, 0)');
    ctx.fillStyle = grad;
    ctx.globalAlpha = hypno * alpha;
    ctx.fillRect(-r * 2.0, -r * 1.4, r * 4.0, r * 2.8);
    ctx.restore();
  }
  ctx.restore();
}
