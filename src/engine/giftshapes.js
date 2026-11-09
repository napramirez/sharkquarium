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
  } else if (shape === 'star' || shape === 'star_flaw') {
    for (let i = 0; i < 10; i += 1) {
      let r = i % 2 === 0 ? size : size * 0.45;
      if (shape === 'star_flaw' && i === 2) r = size * 0.55;
      const a = -Math.PI / 2 + (i / 10) * TAU;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'heart' || shape === 'heart_flaw') {
    if (shape === 'heart_flaw') {
      ctx.moveTo(0, size * 0.8);
      ctx.bezierCurveTo(-size * 1.4, -size * 0.2, -size * 0.5, -size * 1.1, 0, -size * 0.35);
      ctx.lineTo(size * 0.18, -size * 0.5);
      ctx.bezierCurveTo(size * 0.6, -size * 1.05, size * 1.4, -size * 0.2, 0, size * 0.8);
      ctx.closePath();
    } else {
      ctx.moveTo(0, size * 0.8);
      ctx.bezierCurveTo(-size * 1.4, -size * 0.2, -size * 0.5, -size * 1.1, 0, -size * 0.35);
      ctx.bezierCurveTo(size * 0.5, -size * 1.1, size * 1.4, -size * 0.2, 0, size * 0.8);
      ctx.closePath();
    }
  } else if (shape === 'triangle_flaw') {
    ctx.moveTo(size * 0.12, -size * 0.9);
    ctx.lineTo(size * 0.85, size * 0.72);
    ctx.quadraticCurveTo(size * 0.1, size * 0.95, -size * 0.9, size * 0.8);
    ctx.closePath();
  } else {
    ctx.rect(-size * 0.85, -size * 0.85, size * 1.7, size * 1.7);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
