import { COLORS } from '../config.js';

const BASE_DANGER = COLORS.danger;
const BASE_JELLY = COLORS.jelly;

let enabled = false;

export function setColorblind(on) {
  enabled = Boolean(on);
  COLORS.danger = enabled ? '#ffe100' : BASE_DANGER;
  COLORS.jelly = enabled ? '#ff9f1a' : BASE_JELLY;
}

export function colorblind() {
  return enabled;
}

export function dangerColor() {
  return COLORS.danger;
}

export function hazardMark(ctx, radius) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineWidth = Math.max(1.5, radius * 0.16);
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i += 1) {
    const x = i * radius * 0.42;
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.18, radius * 0.16);
    ctx.lineTo(x, radius * 0.44);
    ctx.lineTo(x + radius * 0.18, radius * 0.16);
    ctx.stroke();
  }
  ctx.restore();
}
