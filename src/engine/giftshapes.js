import { TAU } from './math.js';

export const GIFT_SHAPES = ['square', 'circle', 'triangle', 'star', 'heart', 'diamond'];

export function drawGiftShape(ctx, x, y, size, shape, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(10, 20, 30, 0.55)';
  ctx.lineWidth = Math.max(1.5, size * 0.12);
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(0, 0, size, 0, TAU);
  } else if (shape === 'triangle') {
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.9, size * 0.8);
    ctx.lineTo(-size * 0.9, size * 0.8);
    ctx.closePath();
  } else if (shape === 'diamond') {
    ctx.moveTo(0, -size);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, 0);
    ctx.closePath();
  } else if (shape === 'star') {
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? size : size * 0.45;
      const a = -Math.PI / 2 + (i / 10) * TAU;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'heart') {
    ctx.moveTo(0, size * 0.8);
    ctx.bezierCurveTo(-size * 1.4, -size * 0.2, -size * 0.5, -size * 1.1, 0, -size * 0.35);
    ctx.bezierCurveTo(size * 0.5, -size * 1.1, size * 1.4, -size * 0.2, 0, size * 0.8);
    ctx.closePath();
  } else {
    ctx.rect(-size * 0.85, -size * 0.85, size * 1.7, size * 1.7);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
