import { TAU } from './math.js';

export function drawChainFin(ctx, radius, time, options = {}) {
  const ventColor = options.ventColor ?? '#6f7c86';
  const len = radius * 2.3;
  const bx = radius * 1.3;

  const cap = radius * 0.25;
  const bodyEnd = bx + len - cap;
  ctx.fillStyle = '#8f9aa3';
  ctx.beginPath();
  ctx.moveTo(bx, -radius * 0.25);
  ctx.lineTo(bodyEnd, -radius * 0.25);
  ctx.arc(bodyEnd, 0, cap, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(bx, radius * 0.25);
  ctx.closePath();
  ctx.fill();

  const span = bodyEnd - bx;
  const tipLen = Math.PI * cap;
  const loopLen = span * 2 + tipLen;
  const spacing = len / 6;
  const toothH = radius * 0.34;
  const toothW = spacing * 0.62;
  const phase = ((time * 260) % spacing + spacing) % spacing;
  const sample = (s) => {
    if (s < span) {
      return { x: bx + s, y: -radius * 0.25, angle: -Math.PI / 2 };
    }
    if (s < span + tipLen) {
      const ang = -Math.PI / 2 + ((s - span) / tipLen) * Math.PI;
      return { x: bodyEnd + Math.cos(ang) * cap, y: Math.sin(ang) * cap, angle: ang };
    }
    const d = s - (span + tipLen);
    return { x: bodyEnd - d, y: radius * 0.25, angle: Math.PI / 2 };
  };

  ctx.fillStyle = '#c9d2da';
  for (let s = phase; s < loopLen; s += spacing) {
    const point = sample(s);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(point.angle);
    ctx.beginPath();
    ctx.moveTo(0, -toothW / 2);
    ctx.lineTo(toothH, 0);
    ctx.lineTo(0, toothW / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = '#3a4148';
  ctx.lineWidth = radius * 0.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-radius * 0.1, -radius * 0.68);
  ctx.quadraticCurveTo(radius * 0.5, -radius * 1.4, radius * 1.2, -radius * 0.82);
  ctx.stroke();
  ctx.lineWidth = radius * 0.16;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.05, -radius * 0.66);
  ctx.lineTo(-radius * 0.05, -radius * 0.4);
  ctx.moveTo(radius * 1.14, -radius * 0.78);
  ctx.lineTo(radius * 1.16, -radius * 0.34);
  ctx.stroke();
  ctx.lineWidth = radius * 0.18;
  ctx.beginPath();
  ctx.moveTo(-radius * 1.05, -radius * 0.5);
  ctx.lineTo(-radius * 2.0, -radius * 0.5);
  ctx.lineTo(-radius * 2.0, radius * 0.5);
  ctx.lineTo(-radius * 1.05, radius * 0.5);
  ctx.stroke();

  ctx.fillStyle = ventColor;
  ctx.beginPath();
  ctx.ellipse(radius * 0.82, -radius * 0.06, radius * 0.56, radius * 0.56, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = radius * 0.06;
  ctx.stroke();

  const slits = [];
  ctx.strokeStyle = '#040404';
  ctx.lineWidth = radius * 0.16;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const y = -radius * (0.34 - i * 0.24);
    const a = { x: radius * 1.15, y: y + radius * 0.22 };
    const b = { x: radius * 0.4, y: y - radius * 0.03 };
    slits.push([a, b]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.save();
  ctx.beginPath();
  for (const [a, b] of slits) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    const hw = radius * 0.08;
    ctx.moveTo(a.x + nx * hw, a.y + ny * hw);
    ctx.lineTo(b.x + nx * hw, b.y + ny * hw);
    ctx.lineTo(b.x - nx * hw, b.y - ny * hw);
    ctx.lineTo(a.x - nx * hw, a.y - ny * hw);
    ctx.closePath();
  }
  ctx.clip();
  const glow = 0.7 + 0.3 * Math.sin(time * 6);
  ctx.shadowColor = '#ffe14d';
  ctx.shadowBlur = radius * (0.6 + glow * 0.4);
  ctx.fillStyle = '#ffe14d';
  ctx.beginPath();
  ctx.arc(radius * 0.78, -radius * 0.02, radius * 0.3, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#f4fbff';
  for (let i = 0; i < 4; i += 1) {
    const x = radius * (0.4 + i * 0.28);
    ctx.beginPath();
    ctx.moveTo(x, radius * 0.2);
    ctx.lineTo(x + radius * 0.1, radius * 0.46);
    ctx.lineTo(x + radius * 0.2, radius * 0.2);
    ctx.closePath();
    ctx.fill();
  }
}
