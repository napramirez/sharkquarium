import { TAU } from './math.js';

export function drawSeasonRoom(ctx, time, season) {
  if (season === 'halloween') drawCrypt(ctx, time);
  else drawPartyDeck(ctx, time);
}

function drawCrypt(ctx, time) {
  const W = 960;
  const H = 540;
  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, '#150f22');
  wall.addColorStop(0.6, '#0d0a18');
  wall.addColorStop(1, '#070510');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const bw = 104;
      const bh = 92;
      const x = col * bw - (row % 2) * 52 - 20;
      const y = row * bh - 30;
      ctx.fillStyle = row % 2 === 0 ? 'rgba(48, 40, 66, 0.35)' : 'rgba(36, 30, 52, 0.35)';
      ctx.fillRect(x + 3, y + 3, bw - 6, bh - 6);
      ctx.strokeStyle = 'rgba(10, 7, 18, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, bw - 6, bh - 6);
    }
  }

  fillArch(ctx, 140, 330, 90, 200);
  fillArch(ctx, 820, 330, 90, 200);

  drawCandle(ctx, 90, 300, time, 0);
  drawCandle(ctx, 870, 320, time, 1);
  drawCandle(ctx, 480, 180, time, 2);

  ctx.fillStyle = '#0d0a14';
  ctx.fillRect(0, H * 0.82, W, H * 0.18);
  ctx.strokeStyle = 'rgba(70, 58, 92, 0.5)';
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, H * 0.82);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  drawCobweb(ctx, 0, 0, 1);
  drawCobweb(ctx, W, 0, -1);
  drawCoffin(ctx, 760, 500);
  drawCoffin(ctx, 200, 520);

  for (let i = 0; i < 3; i += 1) drawBat(ctx, (i * 300 + time * 40) % (W + 200) - 100, 90 + i * 40, time, i);
  drawFog(ctx, time);
}

function fillArch(ctx, x, baseY, w, h) {
  ctx.fillStyle = '#05040a';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, baseY);
  ctx.lineTo(x - w / 2, baseY - h + w / 2);
  ctx.arc(x, baseY - h + w / 2, w / 2, Math.PI, 0);
  ctx.lineTo(x + w / 2, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(70, 58, 92, 0.5)';
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawCandle(ctx, x, y, time, seed) {
  const flick = 0.6 + 0.4 * Math.sin(time * 9 + seed * 2.3);
  const glow = ctx.createRadialGradient(x, y - 12, 2, x, y - 12, 46);
  glow.addColorStop(0, `rgba(255, 190, 90, ${0.35 * flick})`);
  glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 12, 46, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d8d2c0';
  ctx.fillRect(x - 3, y - 10, 6, 18);
  ctx.fillStyle = `rgba(255, 200, 110, ${0.8 * flick})`;
  ctx.beginPath();
  ctx.ellipse(x, y - 14, 2.6, 6, 0, 0, TAU);
  ctx.fill();
}

function drawCobweb(ctx, x, y, dir) {
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dir * (70 + i * 24), y + 70 + i * 12);
    ctx.stroke();
  }
  for (let r = 20; r <= 90; r += 24) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI / 2);
    ctx.stroke();
  }
}

function drawCoffin(ctx, x, baseY) {
  ctx.fillStyle = '#231a12';
  ctx.beginPath();
  ctx.moveTo(x - 44, baseY - 26);
  ctx.lineTo(x + 44, baseY - 26);
  ctx.lineTo(x + 30, baseY + 18);
  ctx.lineTo(x - 30, baseY + 18);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(90, 70, 44, 0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, baseY - 22);
  ctx.lineTo(x, baseY + 14);
  ctx.moveTo(x - 26, baseY - 4);
  ctx.lineTo(x + 26, baseY - 4);
  ctx.stroke();
}

function drawBat(ctx, x, y, time, seed) {
  const flap = Math.sin(time * 12 + seed) * 10;
  ctx.fillStyle = 'rgba(20, 14, 30, 0.85)';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 16, y - 12 - flap, x + 30, y + 4);
  ctx.quadraticCurveTo(x + 16, y - 2, x, y + 6);
  ctx.quadraticCurveTo(x - 16, y - 2, x - 30, y + 4);
  ctx.quadraticCurveTo(x - 16, y - 12 - flap, x, y);
  ctx.fill();
}

function drawFog(ctx, time) {
  for (let i = 0; i < 5; i += 1) {
    const x = ((i * 240 + time * 18) % 1200) - 120;
    ctx.fillStyle = 'rgba(120, 130, 170, 0.05)';
    ctx.beginPath();
    ctx.ellipse(x, 500, 180, 40, 0, 0, TAU);
    ctx.fill();
  }
}

function drawPartyDeck(ctx, time) {
  const W = 960;
  const H = 540;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#081a33');
  sky.addColorStop(0.6, '#0a2440');
  sky.addColorStop(1, '#04101d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  drawFirework(ctx, 170, 150, time, 0);
  drawFirework(ctx, 760, 120, time, 0.4);
  drawFirework(ctx, 620, 220, time, 0.75);

  ctx.strokeStyle = 'rgba(255, 220, 150, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 110);
  ctx.quadraticCurveTo(W / 2, 190, W, 110);
  ctx.stroke();
  for (let i = 0; i < 18; i += 1) {
    const t = i / 17;
    const x = t * W;
    const y = 110 + Math.sin(t * Math.PI) * 80;
    ctx.fillStyle = i % 3 === 0 ? '#ffd166' : i % 3 === 1 ? '#ff6b9d' : '#63e6ff';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 14, y + 22);
    ctx.lineTo(x - 14, y + 22);
    ctx.closePath();
    ctx.fill();
  }

  for (let i = 0; i < 6; i += 1) {
    const x = 90 + i * 160;
    const y = 200 + Math.sin(time * 1.4 + i) * 10;
    drawBalloon(ctx, x, y, ['#ff6b9d', '#ffd166', '#9be564', '#63e6ff', '#c1a3ff', '#ff9a3c'][i]);
  }

  fillRoundRectLocal(ctx, 360, 60, 240, 60, 14, 'rgba(8, 26, 44, 0.85)');
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(360, 60, 240, 60);
  drawCentered(ctx, 'HAPPY NEW YEAR', 480, 90, 20, '#ffd166');

  drawClock(ctx, 480, 186, time);

  ctx.fillStyle = '#1a120c';
  ctx.fillRect(0, H * 0.84, W, H * 0.16);
  ctx.strokeStyle = 'rgba(120, 84, 54, 0.45)';
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, H * 0.84);
    ctx.lineTo(x - 24, H);
    ctx.stroke();
  }

  for (let i = 0; i < 40; i += 1) {
    const x = (i * 137 + time * (30 + (i % 5) * 10)) % W;
    const y = (i * 61 + time * (40 + (i % 7) * 6)) % H;
    ctx.fillStyle = i % 4 === 0 ? 'rgba(255, 209, 102, 0.6)' : i % 4 === 1 ? 'rgba(255, 107, 157, 0.55)' : i % 4 === 2 ? 'rgba(99, 230, 255, 0.55)' : 'rgba(155, 229, 100, 0.55)';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time + i);
    ctx.fillRect(-2, -1, 4, 2);
    ctx.restore();
  }
}

function drawFirework(ctx, x, y, time, phase) {
  const t = (time * 0.35 + phase) % 1;
  const radius = t * 90;
  const alpha = (1 - t) * 0.85;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = phase < 0.3 ? '#ffd166' : phase < 0.6 ? '#ff6b9d' : '#63e6ff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * radius * 0.35, y + Math.sin(a) * radius * 0.35);
    ctx.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBalloon(ctx, x, y, color) {
  ctx.strokeStyle = 'rgba(200, 220, 240, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + 16);
  ctx.quadraticCurveTo(x + 6, y + 40, x, y + 60);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 13, 16, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x - 4, y - 5, 3.5, 5, -0.4, 0, TAU);
  ctx.fill();
}

function drawClock(ctx, x, y, time) {
  ctx.fillStyle = 'rgba(8, 26, 44, 0.9)';
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.stroke();
  const sec = time % 60;
  const min = (time / 60) % 60;
  ctx.strokeStyle = '#eaf6ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  const minAng = (min / 60) * TAU - Math.PI / 2;
  ctx.lineTo(x + Math.cos(minAng) * 20, y + Math.sin(minAng) * 20);
  ctx.stroke();
  ctx.strokeStyle = '#ff6b9d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  const secAng = (sec / 60) * TAU - Math.PI / 2;
  ctx.lineTo(x + Math.cos(secAng) * 26, y + Math.sin(secAng) * 26);
  ctx.stroke();
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * TAU - Math.PI / 2;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 28, y + Math.sin(a) * 28, 1.6, 0, TAU);
    ctx.fill();
  }
}

function fillRoundRectLocal(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawCentered(ctx, text, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}
