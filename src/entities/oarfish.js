import { TAU } from '../engine/math.js';

export function drawOarfishBody(ctx, radius, pose = {}) {
  const r = radius;
  const age = pose.age ?? 0;
  const phase = pose.phase ?? 0;
  const alert = pose.alert ?? 0;

  const segs = 24;
  const length = r * 15;
  const pts = [];
  for (let i = 0; i <= segs; i += 1) {
    const t = i / segs;
    pts.push({
      x: r * 3.5 - t * length,
      y: Math.sin(age * 1.8 + phase - t * 6.5) * r * 0.7 * (0.35 + t * 0.65),
      w: r * (0.54 - t * 0.47),
    });
  }

  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, '#eef6fa');
  grad.addColorStop(0.5, '#c4d6df');
  grad.addColorStop(1, '#8ea7b4');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y - pts[0].w);
  for (const p of pts) ctx.lineTo(p.x, p.y - p.w);
  for (let i = pts.length - 1; i >= 0; i -= 1) ctx.lineTo(pts[i].x, pts[i].y + pts[i].w);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(44, 64, 82, 0.5)';
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.stroke();

  ctx.fillStyle = 'rgba(44, 64, 82, 0.32)';
  for (let i = 2; i < pts.length - 1; i += 2) {
    const p = pts[i];
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r * 0.15, r * 0.05, 0, 0, TAU);
    ctx.fill();
  }

  ctx.strokeStyle = `rgba(${Math.round(196 + alert * 50)}, 44, 44, 0.9)`;
  ctx.lineWidth = r * 0.13;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p = pts[i];
    const h = r * (0.5 + 0.22 * Math.sin(i * 1.3 + age * 3));
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - p.w);
    ctx.lineTo(p.x - r * 0.22, p.y - p.w - h);
    ctx.lineTo(p.x - r * 0.44, p.y - p.w);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(pts[0].x, pts[0].y);
  ctx.beginPath();
  ctx.ellipse(r * 0.4, 0, r * 1.0, r * 0.62, 0, 0, TAU);
  ctx.fillStyle = '#dbe9ef';
  ctx.fill();
  ctx.strokeStyle = 'rgba(44, 64, 82, 0.5)';
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 1.25, r * 0.02);
  ctx.quadraticCurveTo(r * 0.7, r * 0.34, r * 0.15, r * 0.22);
  ctx.strokeStyle = 'rgba(28, 38, 48, 0.75)';
  ctx.lineWidth = r * 0.07;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 0.55, -r * 0.22, r * 0.25, 0, TAU);
  ctx.fillStyle = '#f2f9fc';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.6, -r * 0.22, r * 0.14, 0, TAU);
  ctx.fillStyle = alert > 0.4 ? '#c62828' : '#14233a';
  ctx.fill();

  for (const fin of [{ dx: r * 0.55, len: 2.2 }, { dx: r * 0.1, len: 1.7 }]) {
    ctx.beginPath();
    ctx.moveTo(fin.dx, r * 0.4);
    ctx.quadraticCurveTo(fin.dx - r * 0.35, r * fin.len * 0.6, fin.dx - r * 0.15, r * fin.len);
    ctx.strokeStyle = '#e2696a';
    ctx.lineWidth = r * 0.09;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(fin.dx - r * 0.15, r * fin.len + r * 0.12, r * 0.13, r * 0.22, 0, 0, TAU);
    ctx.fillStyle = '#e2696a';
    ctx.fill();
  }
  ctx.restore();
}
