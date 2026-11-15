import { drawText } from './render.js';
import { TAU } from './math.js';

let cuteOn = false;

export function setCute(on) {
  cuteOn = Boolean(on);
}

export function cute() {
  return cuteOn;
}

export function moodScale() {
  return cuteOn ? 0 : 1;
}

export function drawCuteBlush(ctx, x, y, radius, alpha = 0.5) {
  if (!cuteOn) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ff9ec4';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + side * radius * 0.6, y + radius * 0.34, radius * 0.3, radius * 0.19, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCuteHeart(ctx, x, y, size, color = '#ff7fb2', rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.32);
  ctx.bezierCurveTo(size * 0.9, -size * 0.5, size * 0.4, -size * 1.2, 0, -size * 0.5);
  ctx.bezierCurveTo(-size * 0.4, -size * 1.2, -size * 0.9, -size * 0.5, 0, size * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawCuteSparkle(ctx, x, y, size, color = 'rgba(255, 255, 255, 0.9)') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * TAU;
    const long = size;
    const short = size * 0.24;
    ctx.lineTo(x + Math.cos(a) * long, y + Math.sin(a) * long);
    const b = a + TAU / 8;
    ctx.lineTo(x + Math.cos(b) * short, y + Math.sin(b) * short);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function cuteBlink(age) {
  const period = 3.4;
  const t = ((age % period) + period) % period;
  const start = period - 0.22;
  if (t <= start) return 0;
  const local = (t - start) / 0.22;
  return 1 - Math.abs(local - 0.5) * 2;
}

export function drawCuteFace(ctx, x, y, radius, options = {}) {
  const { blink = 0, blush = true } = options;
  const open = Math.max(0.18, 1 - blink);
  for (const side of [-1, 1]) {
    const ex = x + side * radius * 0.42;
    const ey = y - radius * 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, ey, radius * 0.3, radius * 0.34 * open, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2b4a';
    ctx.beginPath();
    ctx.arc(ex + side * radius * 0.04, ey + radius * 0.02, radius * 0.17 * open, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex - radius * 0.05, ey - radius * 0.1, radius * 0.07 * open, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#c2506f';
  ctx.lineWidth = Math.max(1.5, radius * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y + radius * 0.18, radius * 0.28, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();
  if (blush) drawCuteBlush(ctx, x, y + radius * 0.1, radius * 1.15, 0.6);
}

export function drawCuteHearts(ctx, time, width, height, count = 8) {
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const span = height + 120;
    const drift = Math.sin(time * 0.5 + i * 1.7) * 26;
    const x = (i / count) * width + width * 0.06 + drift;
    const y = height + 50 - ((time * (20 + (i % 4) * 7) + i * 137) % span);
    const size = 6 + (i % 3) * 3;
    ctx.globalAlpha = 0.32 + 0.22 * Math.sin(time * 1.3 + i);
    drawCuteHeart(ctx, x, y, size, '#ff8fc0', Math.sin(time * 0.8 + i) * 0.4);
  }
  ctx.restore();
}

export function renderCuteGrade(ctx, width, height, time) {
  if (!cuteOn) return;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 196, 224, 0.12)';
  ctx.fillRect(0, 0, width, height);
  drawCuteHearts(ctx, time, width, height);
  ctx.restore();
}

export function renderCuteScare(ctx, t, options = {}) {
  const { width, height, time = 0, draw = null, caption = 'CAUGHT — BUT EVERYTHING IS FINE!', radius = 72 } = options;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#ffd9ec');
  sky.addColorStop(1, '#ffeef8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2 - 40);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * TAU + time * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, height, a, a + 0.18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  const scale = 0.72 + t * 0.7;
  ctx.save();
  ctx.translate(width / 2, height / 2 - 40);
  ctx.scale(scale, scale);
  if (draw) draw(ctx);
  drawCuteFace(ctx, 0, 0, radius, { blush: !draw });
  ctx.restore();
  drawCuteHearts(ctx, time, width, height, 10);
  drawCuteSparkle(ctx, width / 2 - 120, height / 2 - 30, 12);
  drawCuteSparkle(ctx, width / 2 + 116, height / 2 + 20, 9);
  drawText(ctx, caption, width / 2, height / 2 + 116, {
    size: 18,
    weight: 700,
    color: '#c2506f',
    glow: 'rgba(255, 180, 210, 0.6)',
    glowBlur: 14,
  });
  drawText(ctx, 'TAKE A BREATH — YOU CAN TRY AGAIN', width / 2, height / 2 + 146, {
    size: 12,
    color: '#a86f88',
  });
}
