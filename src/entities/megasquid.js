import { COLORS } from '../config.js';
import { TAU } from '../engine/math.js';

export function drawMegasquid(ctx, px, py, scale, time, flail = 1, alpha = 1) {
  const s = scale;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = COLORS.tentacleDark;
  for (let i = 0; i < 8; i += 1) {
    const side = i - 3.5;
    const startX = px + side * 24 * s;
    const startY = py + 96 * s;
    ctx.lineWidth = (24 - Math.abs(side) * 3.5) * s;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    for (let k = 1; k <= 7; k += 1) {
      const t = k / 7;
      ctx.lineTo(
        startX +
          side * t * 130 * s +
          Math.sin(time * 0.55 * flail + i * 1.3 + t * 3.6) * (12 + t * 34) * s,
        startY + t * (220 + Math.abs(side) * 26) * s,
      );
    }
    ctx.stroke();
  }
  for (const side of [-1.4, 1.4]) {
    const startX = px + side * 24 * s;
    const startY = py + 96 * s;
    ctx.lineWidth = 15 * s;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    for (let k = 1; k <= 8; k += 1) {
      const t = k / 8;
      ctx.lineTo(
        startX +
          side * t * 190 * s +
          Math.sin(time * 0.4 * flail + side * 1.1 + t * 3.2) * (16 + t * 54) * s,
        startY + t * 480 * s,
      );
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(
      startX + side * 190 * s + Math.sin(time * 0.4 * flail + side * 1.1 + 3.2) * 70 * s,
      startY + 480 * s,
      15 * s,
      34 * s,
      side * 0.3,
      0,
      TAU,
    );
    ctx.fillStyle = COLORS.tentacleDark;
    ctx.fill();
  }

  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS.tentacleDark;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(px + side * 18 * s, py - 130 * s);
    ctx.quadraticCurveTo(px + side * 156 * s, py - 248 * s, px + side * 176 * s, py - 158 * s);
    ctx.quadraticCurveTo(px + side * 96 * s, py - 116 * s, px + side * 18 * s, py - 130 * s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(px, py - 258 * s);
  ctx.quadraticCurveTo(px + 110 * s, py - 130 * s, px + 98 * s, py + 28 * s);
  ctx.quadraticCurveTo(px + 62 * s, py + 66 * s, px, py + 70 * s);
  ctx.quadraticCurveTo(px - 62 * s, py + 66 * s, px - 98 * s, py + 28 * s);
  ctx.quadraticCurveTo(px - 110 * s, py - 130 * s, px, py - 258 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(px, py + 64 * s, 80 * s, 54 * s, 0, 0, TAU);
  ctx.fill();

  ctx.globalAlpha = 0.28 * alpha;
  ctx.strokeStyle = COLORS.tentacle;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(px, py - 258 * s);
  ctx.quadraticCurveTo(px + 110 * s, py - 130 * s, px + 98 * s, py + 28 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px, py - 258 * s);
  ctx.quadraticCurveTo(px - 110 * s, py - 130 * s, px - 98 * s, py + 28 * s);
  ctx.stroke();
  ctx.restore();
}

export function drawMegasquidEye(ctx, eyeX, eyeY, blink, dirX, dirY, alpha = 1) {
  ctx.save();
  const halo = ctx.createRadialGradient(eyeX, eyeY, 4, eyeX, eyeY, 150);
  halo.addColorStop(0, `rgba(255, 214, 102, ${0.5 * (1 - blink * 0.85) * alpha})`);
  halo.addColorStop(1, 'rgba(255, 214, 102, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(eyeX - 150, eyeY - 150, 300, 300);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(255, 226, 150, 0.92)';
  ctx.beginPath();
  ctx.ellipse(eyeX, eyeY, 38, 34 * (1 - blink), 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1b1204';
  ctx.beginPath();
  ctx.ellipse(eyeX + dirX * 13, eyeY + dirY * 11, 16, 15 * (1 - blink), 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(eyeX + dirX * 13 - 6, eyeY + dirY * 11 - 6, 4, 4 * (1 - blink), 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(190, 130, 20, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(eyeX, eyeY, 26, 23 * (1 - blink), 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
