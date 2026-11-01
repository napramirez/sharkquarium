import { TAU } from './math.js';

export function renderDarkness(ctx, cx, cy, radius, options = {}) {
  const { width, height, ambientDark = 0.95, soft = 1.7 } = options;
  const inner = radius * 0.55;
  const outer = radius * soft;
  const gradient = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.7, `rgba(0, 0, 0, ${ambientDark * 0.6})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${ambientDark})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function renderConeLight(ctx, cx, cy, angle, half, range, options = {}) {
  const { width, height, clip = true } = options;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, range, angle - half, angle + half);
  ctx.closePath();
  if (clip) ctx.clip();
  const gradient = ctx.createRadialGradient(cx, cy, 8, cx, cy, range);
  gradient.addColorStop(0, 'rgba(210, 244, 255, 0.16)');
  gradient.addColorStop(0.6, 'rgba(150, 210, 230, 0.06)');
  gradient.addColorStop(1, 'rgba(120, 180, 210, 0.01)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(200, 240, 255, 0.14)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDelta(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}
