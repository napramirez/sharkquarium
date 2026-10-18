import { TAU } from './math.js';

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

export function clear(ctx, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

export function fillCircle(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}

export function strokeCircle(ctx, x, y, radius, color, lineWidth = 2) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function fillRoundRect(ctx, x, y, width, height, radius, color) {
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

export function strokeRoundRect(ctx, x, y, width, height, radius, color, lineWidth = 2) {
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function drawText(ctx, text, x, y, options = {}) {
  const {
    size = 24,
    weight = 700,
    color = '#ffffff',
    align = 'center',
    baseline = 'middle',
    alpha = 1,
    glow = null,
    glowBlur = 18,
  } = options;
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.globalAlpha = alpha;
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = glowBlur;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawWater(ctx, width, height, time, palette) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, palette.top);
  gradient.addColorStop(1, palette.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.fillStyle = palette.ray;
  for (let i = 0; i < 3; i += 1) {
    const sway = Math.sin(time * 0.25 + i * 2.1) * 70;
    const baseX = width * (0.2 + i * 0.3) + sway;
    ctx.beginPath();
    ctx.moveTo(baseX - 36, -12);
    ctx.lineTo(baseX + 36, -12);
    ctx.lineTo(baseX + 150, height);
    ctx.lineTo(baseX + 40, height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(
    width / 2,
    height * 0.45,
    height * 0.3,
    width / 2,
    height * 0.5,
    height * 1.05,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(2, 8, 14, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}
