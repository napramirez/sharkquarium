import { TAU } from '../engine/math.js';

const LIME = '#8fe14a';
const LIME_DARK = '#4f8f2a';
const LIME_LIGHT = '#c2f56a';
const CYAN = '#3fe0d0';
const CYAN_LIGHT = '#8ff4ea';
const EYE_PINK = '#ff8ac2';
const EYE_DARK = '#120a10';

export function drawMantisShrimpBody(ctx, radius, pose = {}) {
  const r = radius;
  const armPhase = pose.armPhase ?? 0;
  const swing = Math.sin(armPhase * 1.4) * 0.28;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.fillStyle = CYAN;
  for (let i = 0; i < 5; i += 1) {
    const a = -0.7 + i * 0.35;
    ctx.save();
    ctx.translate(-r * 1.42, 0);
    ctx.rotate(a + 0.15);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-r * 0.35, -r * 0.09, -r * 0.55, 0);
    ctx.quadraticCurveTo(-r * 0.35, r * 0.09, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  for (let i = 0; i < 6; i += 1) {
    const t = i / 5;
    const x = -r * (0.35 + t * 1.0);
    const h = r * (0.42 - t * 0.16);
    ctx.beginPath();
    ctx.ellipse(x, 0, r * 0.24, h, 0, 0, TAU);
    ctx.fillStyle = i % 2 === 0 ? LIME : LIME_DARK;
    ctx.fill();
    ctx.strokeStyle = LIME_DARK;
    ctx.lineWidth = r * 0.03;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(r * 0.55, 0);
  ctx.quadraticCurveTo(r * 0.3, -r * 0.6, -r * 0.45, -r * 0.42);
  ctx.quadraticCurveTo(-r * 0.75, 0, -r * 0.45, r * 0.42);
  ctx.quadraticCurveTo(r * 0.3, r * 0.6, r * 0.55, 0);
  ctx.closePath();
  ctx.fillStyle = LIME;
  ctx.fill();
  ctx.strokeStyle = LIME_DARK;
  ctx.lineWidth = r * 0.04;
  ctx.stroke();

  ctx.strokeStyle = CYAN;
  ctx.lineWidth = r * 0.06;
  for (let i = 0; i < 3; i += 1) {
    const x = -r * 0.2 + i * r * 0.26;
    ctx.beginPath();
    ctx.moveTo(x, -r * 0.44);
    ctx.quadraticCurveTo(x + r * 0.08, 0, x, r * 0.44);
    ctx.stroke();
  }

  ctx.strokeStyle = CYAN_LIGHT;
  ctx.lineWidth = r * 0.03;
  ctx.beginPath();
  ctx.moveTo(r * 0.55, -r * 0.05);
  ctx.quadraticCurveTo(r * 1.0, -r * 0.3, r * 1.3, -r * 0.18);
  ctx.moveTo(r * 0.55, r * 0.05);
  ctx.quadraticCurveTo(r * 1.0, r * 0.28, r * 1.3, r * 0.16);
  ctx.stroke();

  for (let i = 0; i < 2; i += 1) {
    const spread = i === 0 ? -1 : -0.5;
    const bx = r * 0.42;
    const by = -r * 0.18 - i * r * 0.06;
    const ex = bx + Math.cos(spread) * r * 0.5;
    const ey = by + Math.sin(spread) * r * 0.5;
    ctx.strokeStyle = LIME_LIGHT;
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + r * 0.12, ey, ex, ey);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.15, 0, TAU);
    ctx.fillStyle = EYE_PINK;
    ctx.fill();
    ctx.strokeStyle = LIME_DARK;
    ctx.lineWidth = r * 0.025;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex + r * 0.03, ey, r * 0.07, 0, TAU);
    ctx.fillStyle = EYE_DARK;
    ctx.fill();
  }

  for (let i = 0; i < 2; i += 1) {
    const dir = i === 0 ? -1 : 1;
    ctx.save();
    ctx.translate(r * 0.42, dir * r * 0.22);
    ctx.rotate(dir * swing);
    ctx.strokeStyle = LIME_DARK;
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.35, dir * r * 0.2, r * 0.7, dir * r * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(r * 0.82, dir * r * 0.08, r * 0.26, r * 0.17, dir * 0.4, 0, TAU);
    ctx.fillStyle = LIME;
    ctx.fill();
    ctx.strokeStyle = LIME_DARK;
    ctx.lineWidth = r * 0.035;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(r * 0.78, dir * r * 0.02, r * 0.12, r * 0.06, dir * 0.4, 0, TAU);
    ctx.fillStyle = CYAN;
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}
