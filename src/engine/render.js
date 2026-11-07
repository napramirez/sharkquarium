import { TAU } from './math.js';
import { mode3D } from './mode3d.js';
import { is8Bit } from './retro.js';

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
export const FONT_RETRO = '"Courier New", "Lucida Console", monospace';

const fontCache = new Map();
const gradientCache = new WeakMap();

function fontFor(weight, size) {
  const retro = is8Bit();
  const key = `${retro ? 1 : 0}|${weight}|${size}`;
  let font = fontCache.get(key);
  if (!font) {
    font = `${weight} ${size}px ${retro ? FONT_RETRO : FONT}`;
    fontCache.set(key, font);
  }
  return font;
}

function cachedGradient(ctx, key, factory) {
  let map = gradientCache.get(ctx);
  if (!map) {
    map = new Map();
    gradientCache.set(ctx, map);
  }
  let gradient = map.get(key);
  if (!gradient) {
    gradient = factory();
    map.set(key, gradient);
  }
  return gradient;
}

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

export function roundRectClip(ctx, x, y, width, height, radius) {
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.clip();
}

export function drawShadowedPlanks(ctx, x, y, width, height) {
  const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
  gradient.addColorStop(0, '#2a2017');
  gradient.addColorStop(0.5, '#423326');
  gradient.addColorStop(1, '#2a2017');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = 'rgba(20, 13, 8, 0.65)';
  ctx.lineWidth = 2;
  for (let line = y + 22; line < y + height - 6; line += 40) {
    ctx.beginPath();
    ctx.moveTo(x + 2, line);
    ctx.lineTo(x + width - 2, line);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(92, 122, 74, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + width * 0.4, y + 12, 18, 7, 0, 0, TAU);
  ctx.fill();
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
  ctx.font = fontFor(weight, size);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.globalAlpha = alpha;
  if (glow && !is8Bit()) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = glowBlur;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawWater(ctx, width, height, time, palette) {
  if (mode3D()) {
    drawWater3D(ctx, width, height, time, palette);
    return;
  }
  const sizeKey = `${width}x${height}|${ctx.canvas.width}x${ctx.canvas.height}`;
  const gradient = cachedGradient(ctx, `water|${sizeKey}|${palette.top}|${palette.bottom}`, () => {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, palette.top);
    g.addColorStop(0.42, palette.top);
    g.addColorStop(1, palette.bottom);
    return g;
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const light = cachedGradient(ctx, `light|${sizeKey}`, () => {
    const g = ctx.createRadialGradient(
      width * 0.5,
      -height * 0.35,
      height * 0.15,
      width * 0.5,
      height * 0.1,
      height * 1.15,
    );
    g.addColorStop(0, 'rgba(207, 239, 255, 0.16)');
    g.addColorStop(1, 'rgba(207, 239, 255, 0)');
    return g;
  });
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = palette.ray;
  ctx.lineWidth = 3;
  for (let k = 0; k < 2; k += 1) {
    const y0 = 16 + k * 11;
    ctx.beginPath();
    for (let x = -20; x <= width + 20; x += 40) {
      const y = y0 + Math.sin(x * 0.05 + time * (1.3 + k * 0.4)) * 5;
      if (x <= -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = palette.ray;
  for (let i = 0; i < 5; i += 1) {
    const sway = Math.sin(time * 0.22 + i * 1.9) * 90;
    const baseX = width * (0.1 + i * 0.2) + sway;
    const topW = 16 + (i % 2) * 10;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 0.5 + i * 1.3);
    ctx.beginPath();
    ctx.moveTo(baseX - topW, -12);
    ctx.lineTo(baseX + topW, -12);
    ctx.lineTo(baseX + topW + 110, height);
    ctx.lineTo(baseX - topW + 20, height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  drawCaustics(ctx, width, height, time, palette);
  drawMotes(ctx, width, height, time, 30, palette);

  const vignette = cachedGradient(ctx, `vignette|${sizeKey}`, () => {
    const g = ctx.createRadialGradient(
      width / 2,
      height * 0.45,
      height * 0.28,
      width / 2,
      height * 0.5,
      height * 1.05,
    );
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(2, 8, 14, 0.62)');
    return g;
  });
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

export function drawCaustics(ctx, width, height, time, palette) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = palette.ray;
  ctx.lineWidth = 2.5;
  const baseY = height * 0.6;
  for (let row = 0; row < 4; row += 1) {
    const y = baseY + row * (height * 0.1);
    ctx.beginPath();
    for (let x = -20; x <= width + 20; x += 24) {
      const yy =
        y + Math.sin(x * 0.03 + time * 1.6 + row) * 12 + Math.sin(x * 0.007 - time + row) * 20;
      if (x <= -20) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawMotes(ctx, width, height, time, count, palette, color = null) {
  ctx.save();
  ctx.fillStyle = color ?? palette.ray;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < count; i += 1) {
    const speed = 6 + (i % 5) * 4;
    const x = (((i * 137.5 + time * speed) % (width + 40)) + width + 40) % (width + 40) - 20;
    const y = (i * 89.3) % height + Math.sin(time * 0.6 + i) * 14;
    const r = 0.8 + ((i * 7) % 4) * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawDepthFish(ctx, width, height, time, count = 9, color = '#cfefff', alpha = 0.1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const speed = 22 + (i % 3) * 14;
    const x = (((i * 131 + time * speed) % (width + 160)) + width + 160) % (width + 160) - 80;
    const y = 40 + ((i * 61) % Math.max(1, Math.floor(height * 0.55)));
    const s = 9 + (i % 3) * 6;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(-s * 1.6, -s * 0.5);
    ctx.lineTo(-s * 1.6, s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawWater3D(ctx, width, height, time, palette) {
  const horizon = Math.round(height * 0.42);
  const vanishX = width / 2 + Math.sin(time * 0.18) * width * 0.08;
  const sizeKey = `${width}x${height}|${ctx.canvas.width}x${ctx.canvas.height}`;

  const floor = cachedGradient(ctx, `floor|${sizeKey}|${palette.bottom}`, () => {
    const g = ctx.createLinearGradient(0, horizon, 0, height);
    g.addColorStop(0, palette.bottom);
    g.addColorStop(1, '#010306');
    return g;
  });
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizon, width, height);

  const sky = cachedGradient(ctx, `sky|${sizeKey}|${palette.top}|${palette.bottom}`, () => {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, palette.top);
    g.addColorStop(1, palette.bottom);
    return g;
  });
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, horizon);

  const glow = ctx.createRadialGradient(vanishX, horizon, 4, vanishX, horizon, width * 0.5);
  glow.addColorStop(0, 'rgba(207, 239, 255, 0.18)');
  glow.addColorStop(1, 'rgba(207, 239, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, horizon - 120, width, 260);

  ctx.strokeStyle = 'rgba(207, 239, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(width, horizon);
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = 'rgba(143, 208, 239, 0.14)';
  ctx.lineWidth = 1.5;
  for (let i = -8; i <= 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(vanishX, horizon);
    ctx.lineTo(vanishX + i * width * 0.16, height);
    ctx.stroke();
  }
  for (let i = 1; i <= 7; i += 1) {
    const y = horizon + (height - horizon) * (i / 7) * (i / 7);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = palette.ray;
  for (let i = 0; i < 3; i += 1) {
    const sway = Math.sin(time * 0.25 + i * 2.1) * 70;
    const baseX = width * (0.2 + i * 0.3) + sway;
    ctx.beginPath();
    ctx.moveTo(baseX - 30, -12);
    ctx.lineTo(baseX + 30, -12);
    ctx.lineTo(baseX + 120, horizon);
    ctx.lineTo(baseX + 34, horizon);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const vignette = cachedGradient(ctx, `vignette3d|${sizeKey}`, () => {
    const g = ctx.createRadialGradient(
      width / 2,
      height * 0.5,
      height * 0.34,
      width / 2,
      height * 0.5,
      height * 1.05,
    );
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(1, 4, 9, 0.6)');
    return g;
  });
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}
