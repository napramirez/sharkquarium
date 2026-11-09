import { TAU } from './math.js';

export function drawWreckLounge(ctx, time) {
  const W = 960;
  const H = 540;

  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, '#0b2533');
  wall.addColorStop(0.7, '#081824');
  wall.addColorStop(1, '#04101a');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  for (let x = -20; x < W; x += 64) {
    ctx.fillStyle = x % 128 === 0 ? 'rgba(78, 50, 32, 0.22)' : 'rgba(52, 33, 22, 0.18)';
    ctx.fillRect(x, 36, 58, H - 150);
    ctx.fillStyle = 'rgba(10, 20, 28, 0.35)';
    ctx.fillRect(x + 58, 36, 6, H - 150);
  }

  drawPorthole(ctx, 138, 158, 46, time);
  drawPorthole(ctx, 822, 158, 46, time);

  ctx.fillStyle = '#241812';
  ctx.fillRect(0, H * 0.8, W, H * 0.2);
  ctx.strokeStyle = 'rgba(120, 84, 54, 0.4)';
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, H * 0.8);
    ctx.lineTo(x - 26, H);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, H * 0.8);
  ctx.lineTo(W, H * 0.8);
  ctx.stroke();

  drawChandelier(ctx, 480, 40, time);
  drawFireplace(ctx, 480, 320, time);
  drawRug(ctx, 480, 486);
  drawArmchair(ctx, 220, 410, -1);
  drawArmchair(ctx, 720, 410, 1);
  drawTable(ctx, 480, 430, time);
  drawVines(ctx, time);
}

function drawPorthole(ctx, x, y, r, time) {
  ctx.fillStyle = '#1d2c34';
  ctx.beginPath();
  ctx.arc(x, y, r + 8, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 200, 205, 0.45)';
  ctx.lineWidth = 6;
  ctx.stroke();
  const glass = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
  glass.addColorStop(0, '#2f8fa8');
  glass.addColorStop(1, '#0a3346');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 240, 255, 0.25)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i += 1) {
    const sway = Math.sin(time * 0.7 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5 + i * r * 0.4, y - r);
    ctx.lineTo(x - r * 0.2 + i * r * 0.4 + sway, y + r);
    ctx.stroke();
  }
}

function drawChandelier(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 0.5) * 0.05);
  ctx.strokeStyle = '#6b5a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(0, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 14, 54, 12, 0, 0, TAU);
  ctx.stroke();
  for (let i = -2; i <= 2; i += 1) {
    const cx = i * 24;
    const glow = 0.5 + 0.5 * Math.sin(time * 2 + i);
    ctx.fillStyle = `rgba(255, 220, 140, ${0.35 + 0.3 * glow})`;
    ctx.beginPath();
    ctx.arc(cx, 22, 4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(180, 240, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(cx, 30 + glow * 3, 2.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawFireplace(ctx, x, baseY, time) {
  const w = 260;
  const h = 150;
  const left = x - w / 2;
  const top = baseY - h;

  ctx.fillStyle = '#3a3f44';
  ctx.fillRect(left - 16, top - 22, w + 32, 22);
  ctx.fillStyle = '#2a2e33';
  ctx.fillRect(left, top, w, h);

  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const bx = left + 6 + col * ((w - 12) / 7) + (row % 2) * 12;
      ctx.fillStyle = row % 2 === 0 ? 'rgba(90, 96, 100, 0.35)' : 'rgba(66, 72, 76, 0.35)';
      ctx.fillRect(bx, top + 6 + row * ((h - 12) / 5), (w - 12) / 7 - 4, (h - 12) / 5 - 4);
    }
  }

  const innerW = w - 70;
  const innerH = h - 46;
  const ix = x - innerW / 2;
  const iy = baseY - innerH;
  ctx.fillStyle = '#06100f';
  ctx.beginPath();
  ctx.moveTo(ix, baseY);
  ctx.lineTo(ix, iy + 18);
  ctx.quadraticCurveTo(x, iy - 14, ix + innerW, iy + 18);
  ctx.lineTo(ix + innerW, baseY);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 4; i += 1) {
    drawSquid(ctx, ix + 26 + i * ((innerW - 52) / 3), baseY - 14, time, i);
  }

  ctx.fillStyle = '#4a3a2c';
  ctx.fillRect(left - 40, baseY, w + 80, 16);
  ctx.fillStyle = '#2b2119';
  ctx.fillRect(left - 40, baseY + 16, w + 80, 10);
}

function drawSquid(ctx, x, baseY, time, seed) {
  const bob = Math.sin(time * 1.6 + seed * 1.7) * 3;
  const hue = seed % 2 === 0 ? '120, 240, 255' : '200, 150, 255';
  const pulse = 0.6 + 0.4 * Math.sin(time * 2.4 + seed);
  const glow = ctx.createRadialGradient(x, baseY - 20 + bob, 2, x, baseY - 20 + bob, 34);
  glow.addColorStop(0, `rgba(${hue}, ${0.5 * pulse})`);
  glow.addColorStop(1, `rgba(${hue}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, baseY - 20 + bob, 34, 0, TAU);
  ctx.fill();

  ctx.fillStyle = `rgba(${hue}, 0.85)`;
  ctx.beginPath();
  ctx.ellipse(x, baseY - 30 + bob, 9, 11, 0, Math.PI, TAU);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${hue}, 0.75)`;
  ctx.lineWidth = 2;
  for (let t = 0; t < 4; t += 1) {
    const sway = Math.sin(time * 2 + seed + t) * 5;
    ctx.beginPath();
    ctx.moveTo(x - 6 + t * 4, baseY - 26 + bob);
    ctx.quadraticCurveTo(x - 8 + t * 4 + sway, baseY - 12, x - 4 + t * 4 + sway, baseY);
    ctx.stroke();
  }
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(x - 3, baseY - 32 + bob, 1.4, 0, TAU);
  ctx.arc(x + 3, baseY - 32 + bob, 1.4, 0, TAU);
  ctx.fill();
}

function drawRug(ctx, x, y) {
  ctx.fillStyle = 'rgba(86, 40, 48, 0.75)';
  ctx.beginPath();
  ctx.ellipse(x, y, 220, 44, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200, 150, 120, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, 190, 34, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, 150, 24, 0, 0, TAU);
  ctx.stroke();
}

function drawArmchair(ctx, x, y, facing) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.fillStyle = '#5a2b33';
  ctx.beginPath();
  ctx.moveTo(-44, 10);
  ctx.lineTo(-44, -34);
  ctx.quadraticCurveTo(0, -60, 44, -34);
  ctx.lineTo(44, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#713a43';
  ctx.beginPath();
  ctx.ellipse(0, 8, 40, 16, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#432028';
  ctx.fillRect(-48, -18, 12, 34);
  ctx.fillRect(36, -18, 12, 34);
  ctx.fillStyle = '#3a2018';
  ctx.fillRect(-40, 12, 10, 20);
  ctx.fillRect(30, 12, 10, 20);
  ctx.restore();
}

function drawTable(ctx, x, y, time) {
  ctx.fillStyle = '#2d2016';
  ctx.fillRect(x - 6, y + 6, 12, 44);
  ctx.fillStyle = '#4a3322';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 46, 14, 0, 0, TAU);
  ctx.fill();
  const glow = 0.5 + 0.5 * Math.sin(time * 1.8);
  ctx.fillStyle = `rgba(150, 240, 255, ${0.25 + 0.2 * glow})`;
  ctx.beginPath();
  ctx.arc(x, y - 12, 26, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0c2a33';
  ctx.beginPath();
  ctx.arc(x, y - 12, 16, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 240, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawVines(ctx, time) {
  ctx.strokeStyle = 'rgba(46, 110, 70, 0.6)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i += 1) {
    const x = 30 + i * 180;
    const sway = Math.sin(time * 0.9 + i) * 8;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + sway, 80, x + sway * 1.6, 170 + (i % 3) * 30);
    ctx.stroke();
  }
}
