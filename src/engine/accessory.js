import { ACCESSORIES } from '../config.js';
import { TAU } from './math.js';
import { drawPlushie } from './plushie.js';

const catalog = new Map(ACCESSORIES.map((accessory) => [accessory.key, accessory]));
const NONE = catalog.get('none');

let activeHead = NONE;
let activeBody = NONE;

export function accessoryByKey(key) {
  return catalog.get(key) ?? NONE;
}

export function accessoryCatalog() {
  return ACCESSORIES;
}

export function accessorySlotCatalog(slot) {
  return ACCESSORIES.filter((entry) => entry.key === 'none' || entry.slot === slot);
}

export function setActiveHeadAccessory(accessory) {
  activeHead = accessory && accessory.key !== 'none' ? accessory : NONE;
}

export function setActiveBodyAccessory(accessory) {
  activeBody = accessory && accessory.key !== 'none' ? accessory : NONE;
}

function drawNeonJacket(ctx, r, time) {
  const hue = (time * 130) % 360;
  const hue2 = (hue + 90) % 360;
  ctx.fillStyle = '#151a2b';
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.35);
  ctx.quadraticCurveTo(0, -r * 0.92, r * 0.9, -r * 0.35);
  ctx.quadraticCurveTo(r * 0.78, r * 0.95, 0, r * 1.08);
  ctx.quadraticCurveTo(-r * 0.78, r * 0.95, -r * 0.9, -r * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 12, 24, 0.75)';
  ctx.lineWidth = r * 0.1;
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = `hsla(${hue}, 100%, 62%, 0.35)`;
  ctx.lineWidth = r * 0.26;
  ctx.beginPath();
  ctx.moveTo(-r * 0.62, -r * 0.42);
  ctx.quadraticCurveTo(0, -r * 0.8, r * 0.62, -r * 0.42);
  ctx.stroke();
  ctx.strokeStyle = `hsl(${hue}, 100%, 66%)`;
  ctx.lineWidth = r * 0.13;
  ctx.stroke();
  ctx.strokeStyle = `hsl(${hue2}, 100%, 70%)`;
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.5);
  ctx.lineTo(0, r * 0.9);
  ctx.stroke();
  ctx.strokeStyle = `hsla(${hue2}, 100%, 60%, 0.35)`;
  ctx.lineWidth = r * 0.24;
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, r * 0.8);
  ctx.quadraticCurveTo(0, r * 1.06, r * 0.6, r * 0.8);
  ctx.stroke();
  ctx.strokeStyle = `hsl(${hue2}, 100%, 68%)`;
  ctx.lineWidth = r * 0.12;
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.strokeStyle = `hsl(${(hue + side * 55 + 360) % 360}, 100%, 72%)`;
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    ctx.moveTo(side * r * 0.5, -r * 0.1);
    ctx.lineTo(side * r * 0.72, r * 0.22);
    ctx.stroke();
  }
}

function renderAccessory(ctx, key, r, time, frame) {
  if (key === 'tophat') {
    ctx.fillStyle = '#1d1f2b';
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.05, r * 0.85, r * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(-r * 0.55, -r * 1.85, r * 1.1, r * 0.82);
    ctx.fillStyle = '#c23b4a';
    ctx.fillRect(-r * 0.55, -r * 1.25, r * 1.1, r * 0.22);
    return;
  }
  if (key === 'party') {
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
    return;
  }
  if (key === 'sunglasses') {
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
    return;
  }
  if (key === 'bowtie') {
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
    return;
  }
  if (key === 'armor') {
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
    return;
  }
  if (key === 'pirate') {
    ctx.fillStyle = '#1d2540';
    ctx.beginPath();
    ctx.moveTo(-r * 1.05, -r * 0.95);
    ctx.quadraticCurveTo(0, -r * 0.55, r * 1.05, -r * 0.95);
    ctx.quadraticCurveTo(r * 0.75, -r * 1.5, 0, -r * 1.6);
    ctx.quadraticCurveTo(-r * 0.75, -r * 1.5, -r * 1.05, -r * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = r * 0.08;
    ctx.stroke();
    ctx.fillStyle = '#f4fbff';
    ctx.beginPath();
    ctx.arc(0, -r * 1.12, r * 0.16, 0, TAU);
    ctx.fill();
    return;
  }
  if (key === 'propeller') {
    ctx.fillStyle = '#e26052';
    ctx.beginPath();
    ctx.arc(0, -r * 1.05, r * 0.72, Math.PI, TAU);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-r * 0.78, -r * 1.08, r * 1.56, r * 0.16);
    const spin = time * 9;
    ctx.fillStyle = '#7bdff2';
    for (let i = 0; i < 3; i += 1) {
      const angle = spin + (i * TAU) / 3;
      ctx.save();
      ctx.translate(0, -r * 1.18);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(r * 0.42, 0, r * 0.42, r * 0.12, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#cfefff';
    ctx.beginPath();
    ctx.arc(0, -r * 1.18, r * 0.12, 0, TAU);
    ctx.fill();
    return;
  }
  if (key === 'neonjacket') {
    ctx.save();
    ctx.translate(-r * 0.78, r * 0.08);
    drawNeonJacket(ctx, r, time);
    ctx.restore();
    return;
  }
  if (key === 'crown') {
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
    return;
  }
  if (key === 'eyepatch') {
    ctx.strokeStyle = '#1d1f2b';
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.moveTo(-r * 1.05, -r * 0.42);
    ctx.lineTo(r * 0.7, -r * 0.08);
    ctx.stroke();
    ctx.fillStyle = '#1d1f2b';
    ctx.beginPath();
    ctx.ellipse(r * 0.45, -r * 0.22, r * 0.34, r * 0.26, -0.15, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#3a3f52';
    ctx.lineWidth = r * 0.05;
    ctx.stroke();
    return;
  }
  if (key === 'snorkel') {
    ctx.strokeStyle = '#2a3242';
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(-r * 0.65, -r * 0.18);
    ctx.lineTo(r * 0.95, -r * 0.1);
    ctx.stroke();
    ctx.fillStyle = 'rgba(123, 223, 242, 0.45)';
    ctx.beginPath();
    ctx.ellipse(r * 0.7, -r * 0.16, r * 0.4, r * 0.3, -0.1, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#7bdff2';
    ctx.lineWidth = r * 0.08;
    ctx.stroke();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#e26052';
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.moveTo(r * 0.95, -r * 0.2);
    ctx.quadraticCurveTo(r * 1.25, -r * 0.8, r * 0.9, -r * 1.5);
    ctx.stroke();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(r * 0.95, -r * 0.2);
    ctx.quadraticCurveTo(r * 1.25, -r * 0.8, r * 0.9, -r * 1.5);
    ctx.stroke();
    return;
  }
  if (key === 'devilhorns') {
    ctx.fillStyle = '#b2353c';
    ctx.strokeStyle = '#7a1f26';
    ctx.lineWidth = r * 0.06;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.28, -r * 0.85);
      ctx.quadraticCurveTo(side * r * 0.75, -r * 1.3, side * r * 0.62, -r * 1.85);
      ctx.quadraticCurveTo(side * r * 0.35, -r * 1.35, side * r * 0.08, -r * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#e2626a';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * r * 0.3, -r * 0.95, r * 0.12, 0, TAU);
      ctx.fill();
    }
    return;
  }
  if (key === 'stingrayhat') {
    const sway = Math.sin(time * 2.8) * r * 0.1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(90, 58, 40, 0.7)';
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.95);
    ctx.quadraticCurveTo(-r * 1.35 + sway, -r * 1.5, -r * 1.05 + sway, -r * 2.1);
    ctx.stroke();
    ctx.strokeStyle = '#a5755c';
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.95);
    ctx.quadraticCurveTo(-r * 1.35 + sway, -r * 1.5, -r * 1.05 + sway, -r * 2.1);
    ctx.stroke();
    ctx.fillStyle = '#7a5238';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.95, r * 0.85, r * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#b98a6e';
    ctx.beginPath();
    ctx.moveTo(r * 1.15, -r * 1.15);
    ctx.quadraticCurveTo(r * 0.3, -r * 1.78, -r * 0.55, -r * 1.4);
    ctx.quadraticCurveTo(-r * 0.15, -r * 1.05, -r * 0.55, -r * 0.72);
    ctx.quadraticCurveTo(r * 0.3, -r * 0.58, r * 1.15, -r * 1.15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8f6248';
    ctx.lineWidth = r * 0.07;
    ctx.stroke();
    ctx.fillStyle = '#efdcc9';
    ctx.beginPath();
    ctx.ellipse(r * 0.15, -r * 1.05, r * 0.5, r * 0.22, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#8f6248';
    for (const [sx, sy] of [
      [0.5, -1.38],
      [0.78, -1.06],
      [0.05, -1.32],
    ]) {
      ctx.beginPath();
      ctx.arc(sx * r, sy * r, r * 0.07, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#f4fbff';
    ctx.beginPath();
    ctx.arc(r * 0.78, -r * 1.28, r * 0.11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(r * 0.8, -r * 1.28, r * 0.05, 0, TAU);
    ctx.fill();
    return;
  }
  if (key === 'eelscarf') {
    const sway = Math.sin(time * 2.6) * r * 0.06;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(40, 46, 24, 0.6)';
    ctx.lineWidth = r * 0.42;
    ctx.beginPath();
    ctx.moveTo(-r * 1.0, r * 0.28 + sway);
    ctx.quadraticCurveTo(0, r * 0.05 - sway, r * 0.95, r * 0.3 + sway);
    ctx.stroke();
    ctx.strokeStyle = '#8a9a5a';
    ctx.lineWidth = r * 0.3;
    ctx.beginPath();
    ctx.moveTo(-r * 1.0, r * 0.28 + sway);
    ctx.quadraticCurveTo(0, r * 0.05 - sway, r * 0.95, r * 0.3 + sway);
    ctx.stroke();
    ctx.strokeStyle = '#c9cf9a';
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, r * 0.2 + sway);
    ctx.quadraticCurveTo(0, -r * 0.02 - sway, r * 0.85, r * 0.22 + sway);
    ctx.stroke();
    ctx.strokeStyle = '#8a9a5a';
    ctx.lineWidth = r * 0.2;
    ctx.beginPath();
    ctx.moveTo(-r * 1.0, r * 0.28 + sway);
    ctx.quadraticCurveTo(-r * 1.5, r * 0.1, -r * 1.35, -r * 0.35);
    ctx.stroke();
    ctx.fillStyle = '#8a9a5a';
    ctx.beginPath();
    ctx.ellipse(r * 0.95, r * 0.22 + sway, r * 0.3, r * 0.22, 0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(r * 1.02, r * 0.18 + sway, r * 0.11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(r * 1.03, r * 0.18 + sway, r * 0.05, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f4fbff';
    for (let i = 0; i < 2; i += 1) {
      ctx.fillRect(r * (0.98 + i * 0.09), r * (0.32 + sway), r * 0.04, r * 0.07);
    }
    return;
  }
  if (key === 'angelwings') {
    const speed = Math.hypot(frame.entity?.vx ?? 0, frame.entity?.vy ?? 0);
    const flap =
      Math.sin(time * (2.6 + Math.min(speed, 320) / 90)) *
      (0.16 + Math.min(speed, 320) / 900);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * r * 0.45, -r * 0.15);
      ctx.rotate(side * (0.55 + flap));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(side * r * 1.1, -r * 0.9, side * r * 1.7, -r * 0.35);
      ctx.quadraticCurveTo(side * r * 1.25, -r * 0.05, side * r * 1.35, r * 0.55);
      ctx.quadraticCurveTo(side * r * 0.9, r * 0.2, 0, r * 0.35);
      ctx.closePath();
      ctx.fillStyle = 'rgba(244, 251, 255, 0.92)';
      ctx.fill();
      ctx.strokeStyle = '#cfefff';
      ctx.lineWidth = r * 0.08;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(159, 210, 235, 0.75)';
      ctx.lineWidth = r * 0.05;
      for (let i = 1; i <= 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(side * r * (0.3 + i * 0.32), -r * 0.4 + i * r * 0.1);
        ctx.quadraticCurveTo(
          side * r * (0.5 + i * 0.32),
          -r * 0.1 + i * r * 0.08,
          side * r * (0.55 + i * 0.3),
          r * 0.3,
        );
        ctx.stroke();
      }
      ctx.restore();
    }
    return;
  }
}

function renderSlot(ctx, radius, time, frame, slot) {
  const active = slot === 'head' ? activeHead : activeBody;
  if (!active || active.key === 'none') return;
  ctx.save();
  if (active.key.startsWith('plush')) {
    drawPlushie(ctx, active.key, radius, time, frame);
  } else {
    renderAccessory(ctx, active.key, radius, time, frame);
  }
  ctx.restore();
}

export function drawAccessory(ctx, radius, time, frame = {}) {
  renderSlot(ctx, radius, time, frame, 'body');
  renderSlot(ctx, radius, time, frame, 'head');
}
