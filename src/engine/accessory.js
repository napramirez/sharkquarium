import { ACCESSORIES } from '../config.js';
import { TAU } from './math.js';

const catalog = new Map(ACCESSORIES.map((accessory) => [accessory.key, accessory]));
const NONE = catalog.get('none');

let active = NONE;

export function accessoryByKey(key) {
  return catalog.get(key) ?? NONE;
}

export function accessoryCatalog() {
  return ACCESSORIES;
}

export function setActiveAccessory(accessory) {
  active = accessory && accessory.key !== 'none' ? accessory : NONE;
}

export function drawAccessory(ctx, radius, time) {
  if (!active || active.key === 'none') return;
  const r = radius;
  ctx.save();
  if (active.key === 'tophat') {
    ctx.fillStyle = '#1d1f2b';
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.05, r * 0.85, r * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(-r * 0.55, -r * 1.85, r * 1.1, r * 0.82);
    ctx.fillStyle = '#c23b4a';
    ctx.fillRect(-r * 0.55, -r * 1.25, r * 1.1, r * 0.22);
    ctx.restore();
    return;
  }
  if (active.key === 'party') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 1);
    ctx.lineTo(r * 0.45, -r * 1);
    ctx.lineTo(0, -r * 2.15);
    ctx.closePath();
    ctx.fillStyle = '#ff8fa3';
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = r * 0.12;
    for (let i = 0; i < 3; i += 1) {
      const t = 0.25 + i * 0.25;
      const half = r * 0.45 * (1 - t);
      const y = -r * 1 - r * 1.15 * t;
      ctx.beginPath();
      ctx.moveTo(-half, y);
      ctx.lineTo(half, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, -r * 2.2, r * 0.16, 0, TAU);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.restore();
    return;
  }
  if (active.key === 'sunglasses') {
    ctx.strokeStyle = '#f4fbff';
    ctx.lineWidth = r * 0.09;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.28);
    ctx.lineTo(r * 0.3, -r * 0.24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 1.05, -r * 0.26);
    ctx.lineTo(r * 1.5, -r * 0.12);
    ctx.stroke();
    ctx.fillStyle = '#10141c';
    ctx.beginPath();
    ctx.ellipse(r * 0.45, -r * 0.22, r * 0.26, r * 0.18, -0.15, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(r * 0.85, -r * 0.22, r * 0.26, r * 0.18, 0.15, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.36, -r * 0.28, r * 0.06, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.76, -r * 0.28, r * 0.06, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }
  if (active.key === 'bowtie') {
    const y = r * 0.62;
    ctx.fillStyle = '#c23b4a';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(-r * 0.55, y - r * 0.32);
    ctx.lineTo(-r * 0.55, y + r * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(r * 0.55, y - r * 0.32);
    ctx.lineTo(r * 0.55, y + r * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, y, r * 0.16, 0, TAU);
    ctx.fillStyle = '#7a2530';
    ctx.fill();
    ctx.restore();
    return;
  }
  if (active.key === 'armor') {
    const sway = Math.sin(time * 2.4) * r * 0.02;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.25 + sway);
    ctx.quadraticCurveTo(0, r * 1.35 + sway, r, r * 0.25 + sway);
    ctx.quadraticCurveTo(0, r * 0.7 + sway, -r, r * 0.25 + sway);
    ctx.closePath();
    ctx.fillStyle = '#d9b28c';
    ctx.fill();
    ctx.strokeStyle = '#9c6b4d';
    ctx.lineWidth = r * 0.08;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(156, 107, 77, 0.7)';
    ctx.lineWidth = r * 0.06;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.28, r * 0.42 + sway);
      ctx.quadraticCurveTo(i * r * 0.34, r * 0.88 + sway, i * r * 0.45, r * 0.55 + sway);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  if (active.key === 'crown') {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 1);
    ctx.lineTo(-r * 0.6, -r * 1.45);
    ctx.lineTo(-r * 0.3, -r * 1.15);
    ctx.lineTo(0, -r * 1.55);
    ctx.lineTo(r * 0.3, -r * 1.15);
    ctx.lineTo(r * 0.6, -r * 1.45);
    ctx.lineTo(r * 0.6, -r * 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c99a2e';
    ctx.lineWidth = r * 0.06;
    ctx.stroke();
    ctx.restore();
  }
}
