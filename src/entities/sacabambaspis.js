import { TAU } from '../engine/math.js';

export function drawSacabambaspis(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const body = pose.body ?? '#cbb98a';
  const accent = pose.accent ?? '#e8dcb0';
  const belly = pose.belly ?? '#f4eeda';
  const line = '#8a7a52';
  const r = radius;

  ctx.save();
  ctx.scale(1, 0.66);
  ctx.rotate(Math.sin(age * 3) * 0.05);

  ctx.beginPath();
  ctx.moveTo(-r * 1.25, 0);
  ctx.lineTo(-r * 2.25, -r * 0.55);
  ctx.lineTo(-r * 2.0, 0);
  ctx.lineTo(-r * 2.25, r * 0.55);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.06;
  ctx.stroke();

  const grad = ctx.createLinearGradient(0, -r * 0.85, 0, r * 0.85);
  grad.addColorStop(0, accent);
  grad.addColorStop(0.5, body);
  grad.addColorStop(1, belly);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.35, r * 0.85, 0, 0, TAU);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.08;
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.8);
  ctx.quadraticCurveTo(r * 0.1, -r * 1.08, r * 0.5, -r * 0.72);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  for (const cheek of [[0.2, 0.1], [1.0, 0.16]]) {
    ctx.beginPath();
    ctx.ellipse(r * cheek[0], r * cheek[1], r * 0.15, r * 0.09, 0, 0, TAU);
    ctx.fillStyle = 'rgba(255, 150, 160, 0.55)';
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(60, 50, 30, 0.7)';
  for (const gill of [[-0.05, 0.02], [-0.3, 0.05], [-0.55, 0.08], [-0.8, 0.11]]) {
    ctx.beginPath();
    ctx.ellipse(r * gill[0], r * gill[1], r * 0.05, r * 0.11, 0, 0, TAU);
    ctx.fill();
  }

  for (const eye of [[0.4, 0.08], [1.14, 0.08]]) {
    const ex = r * eye[0];
    const ey = r * eye[1];
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.12, 0, TAU);
    ctx.fillStyle = '#fffdf6';
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = r * 0.03;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.06, 0, TAU);
    ctx.fillStyle = '#1a140c';
    ctx.fill();
  }

  for (const nose of [[0.62, 0.08], [0.94, 0.08]]) {
    ctx.beginPath();
    ctx.arc(r * nose[0], r * nose[1], r * 0.035, 0, TAU);
    ctx.fillStyle = '#1a140c';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(r * 0.48, r * 0.3);
  ctx.lineTo(r * 1.0, r * 0.3);
  ctx.quadraticCurveTo(r * 0.82, r * 0.55, r * 0.74, r * 0.55);
  ctx.quadraticCurveTo(r * 0.66, r * 0.55, r * 0.48, r * 0.3);
  ctx.closePath();
  ctx.fillStyle = '#4a2b30';
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.035;
  ctx.stroke();

  ctx.restore();
}
