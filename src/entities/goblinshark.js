import { TAU } from '../engine/math.js';

export function drawGoblinShark(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const jaw = pose.jawOpen ?? 0.2;
  const extend = pose.jawExtend ?? 0;
  const r = radius;

  const BODY = '#ddc4ca';
  const BELLY = '#f8e8ec';
  const OUTLINE = '#907278';
  const FIN = '#d2b4bb';

  ctx.save();
  ctx.rotate(Math.sin(age * 1.4) * 0.03);

  const L = r * 1.9;
  const W = r * 0.82;

  const finTip = (bx, by, tx, ty) => {
    const g = ctx.createLinearGradient(bx, by, tx, ty);
    g.addColorStop(0, FIN);
    g.addColorStop(0.4, '#bb9aa1');
    g.addColorStop(1, '#82636b');
    return g;
  };

  ctx.save();
  ctx.translate(-L, 0);
  const tailGrad = ctx.createRadialGradient(r * 0.15, 0, r * 0.12, r * 0.15, 0, r * 1.4);
  tailGrad.addColorStop(0, FIN);
  tailGrad.addColorStop(0.45, '#bb9aa1');
  tailGrad.addColorStop(1, '#82636b');
  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  ctx.moveTo(r * 0.15, 0);
  ctx.quadraticCurveTo(-r * 0.4, -r * 0.55, -r * 0.98, -r * 0.98);
  ctx.quadraticCurveTo(-r * 0.4, -r * 0.18, -r * 0.28, 0);
  ctx.quadraticCurveTo(-r * 0.5, r * 0.22, -r * 0.72, r * 0.58);
  ctx.quadraticCurveTo(-r * 0.24, r * 0.22, r * 0.15, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = finTip(r * 0.5, W * 0.6, -r * 0.55, r * 1.6);
  ctx.beginPath();
  ctx.moveTo(r * 0.5, W * 0.6);
  ctx.lineTo(-r * 0.3, W * 0.65);
  ctx.lineTo(-r * 0.55, r * 1.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = finTip(r * 0.1, W * 0.625, -r * 1.05, r * 1.45);
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, W * 0.55);
  ctx.lineTo(-r * 1.0, W * 0.5);
  ctx.lineTo(-r * 1.05, r * 1.45);
  ctx.closePath();
  ctx.fill();

  const dorsalGrad = ctx.createLinearGradient(0, -W * 0.6, 0, -r * 1.7);
  dorsalGrad.addColorStop(0, FIN);
  dorsalGrad.addColorStop(0.45, '#bb9aa1');
  dorsalGrad.addColorStop(1, '#82636b');
  ctx.fillStyle = dorsalGrad;
  ctx.beginPath();
  ctx.moveTo(r * 0.55, -W * 0.6);
  ctx.lineTo(-r * 0.35, -W * 0.65);
  ctx.lineTo(r * 0.0, -r * 1.7);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(r * 3.2, -r * 0.02);
  ctx.quadraticCurveTo(r * 1.8, -r * 0.22, r * 0.7, -r * 0.18);
  ctx.quadraticCurveTo(r * 0.45, -r * 0.14, r * 0.45, 0);
  ctx.quadraticCurveTo(r * 0.45, r * 0.14, r * 0.7, r * 0.18);
  ctx.quadraticCurveTo(r * 1.8, r * 0.22, r * 3.2, r * 0.02);
  ctx.quadraticCurveTo(r * 3.4, 0, r * 3.2, -r * 0.02);
  ctx.closePath();
  ctx.fillStyle = BODY;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(L, 0);
  ctx.quadraticCurveTo(L * 0.5, -W, 0, -W);
  ctx.quadraticCurveTo(-L * 0.5, -W, -L, 0);
  ctx.quadraticCurveTo(-L * 0.5, W, 0, W);
  ctx.quadraticCurveTo(L * 0.5, W, L, 0);
  ctx.closePath();
  ctx.fillStyle = BODY;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(L * 0.9, 0);
  ctx.quadraticCurveTo(L * 0.45, W * 0.94, 0, W * 0.94);
  ctx.quadraticCurveTo(-L * 0.45, W * 0.94, -L * 0.9, 0);
  ctx.closePath();
  ctx.fillStyle = BELLY;
  ctx.fill();

  ctx.strokeStyle = 'rgba(20, 30, 40, 0.4)';
  ctx.lineWidth = r * 0.035;
  for (let i = 0; i < 5; i += 1) {
    const gx = r * 0.45 - i * r * 0.13;
    ctx.beginPath();
    ctx.moveTo(gx, -W * 0.45);
    ctx.quadraticCurveTo(gx - r * 0.05, 0, gx, W * 0.42);
    ctx.stroke();
  }

  const mouthY = r * 0.34;
  const gap = r * (0.06 + jaw * 0.3);
  const reach = extend * r * 0.5;
  const jawLen = r * 0.7 + reach;
  const jw = r * 0.09;

  if (extend > 0.02) {
    ctx.beginPath();
    ctx.moveTo(r * 0.9, mouthY - gap);
    ctx.lineTo(r * 0.9 + reach, mouthY - gap - r * 0.06);
    ctx.lineTo(r * 0.9 + reach, mouthY + gap + r * 0.06);
    ctx.lineTo(r * 0.9, mouthY + gap);
    ctx.closePath();
    ctx.fillStyle = '#4a3f47';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = r * 0.03;
    ctx.stroke();
  }

  for (const side of [-1, 1]) {
    const y = mouthY + side * gap;
    ctx.beginPath();
    ctx.moveTo(r * 0.85, y - jw);
    ctx.lineTo(r * 0.85 + jawLen, y - jw * 0.6);
    ctx.lineTo(r * 0.85 + jawLen, y + jw * 0.6);
    ctx.lineTo(r * 0.85, y + jw);
    ctx.closePath();
    ctx.fillStyle = '#cfc6bd';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = r * 0.03;
    ctx.stroke();
    ctx.fillStyle = '#f2ecdd';
    for (let i = 0; i < 7; i += 1) {
      const t = i / 6;
      const tx = r * 0.95 + t * (jawLen - r * 0.2);
      const len = r * (0.12 + (1 - t) * 0.12);
      ctx.beginPath();
      ctx.moveTo(tx - r * 0.035, y);
      ctx.lineTo(tx + r * 0.035, y);
      ctx.lineTo(tx, y - side * len);
      ctx.closePath();
      ctx.fill();
    }
  }

  for (const eye of [[1.0, -0.3], [1.35, -0.18]]) {
    ctx.beginPath();
    ctx.arc(r * eye[0], r * eye[1], r * 0.13, 0, TAU);
    ctx.fillStyle = '#0a0a0c';
    ctx.fill();
  }

  ctx.restore();
}
