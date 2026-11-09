import { ACCESSORIES } from '../config.js';
import { TAU } from './math.js';
import { drawPlushie } from './plushie.js';
import { drawRagdollRipcord } from './ripcord.js';
import { drawChainFin } from './chainfin.js';

const catalog = new Map(ACCESSORIES.map((accessory) => [accessory.key, accessory]));
const NONE = catalog.get('none');

let activeHead = NONE;
let activeBody = NONE;
let activeCostume = NONE;

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

export function setActiveCostume(accessory) {
  activeCostume = accessory && accessory.key !== 'none' ? accessory : NONE;
}

function drawNeonJacket(ctx, rx, ry, time) {
  const w = (rx + ry) / 2;
  const hue = (time * 130) % 360;
  const hue2 = (hue + 90) % 360;
  ctx.fillStyle = '#151a2b';
  ctx.beginPath();
  ctx.moveTo(-rx * 0.9, -ry * 0.35);
  ctx.quadraticCurveTo(0, -ry * 0.92, rx * 0.9, -ry * 0.35);
  ctx.quadraticCurveTo(rx * 0.78, ry * 0.95, 0, ry * 1.08);
  ctx.quadraticCurveTo(-rx * 0.78, ry * 0.95, -rx * 0.9, -ry * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 12, 24, 0.75)';
  ctx.lineWidth = w * 0.1;
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = `hsla(${hue}, 100%, 62%, 0.35)`;
  ctx.lineWidth = w * 0.26;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.62, -ry * 0.42);
  ctx.quadraticCurveTo(0, -ry * 0.8, rx * 0.62, -ry * 0.42);
  ctx.stroke();
  ctx.strokeStyle = `hsl(${hue}, 100%, 66%)`;
  ctx.lineWidth = w * 0.13;
  ctx.stroke();
  ctx.strokeStyle = `hsl(${hue2}, 100%, 70%)`;
  ctx.lineWidth = w * 0.1;
  ctx.beginPath();
  ctx.moveTo(0, -ry * 0.5);
  ctx.lineTo(0, ry * 0.9);
  ctx.stroke();
  ctx.strokeStyle = `hsla(${hue2}, 100%, 60%, 0.35)`;
  ctx.lineWidth = w * 0.24;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.6, ry * 0.8);
  ctx.quadraticCurveTo(0, ry * 1.06, rx * 0.6, ry * 0.8);
  ctx.stroke();
  ctx.strokeStyle = `hsl(${hue2}, 100%, 68%)`;
  ctx.lineWidth = w * 0.12;
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.strokeStyle = `hsl(${(hue + side * 55 + 360) % 360}, 100%, 72%)`;
    ctx.lineWidth = w * 0.07;
    ctx.beginPath();
    ctx.moveTo(side * rx * 0.5, -ry * 0.1);
    ctx.lineTo(side * rx * 0.72, ry * 0.22);
    ctx.stroke();
  }
}

function renderAccessory(ctx, key, r, time, frame) {
  if (key === 'ripcord') {
    drawRagdollRipcord(ctx, frame.entity ?? {}, time, {
      anchorX: -r * 0.15,
      anchorY: r * 0.1,
      length: r * 1.9,
      segments: 7,
      cordColor: '#2a2f36',
      handleColor: '#c7ccd2',
      handleW: r * 0.34,
      handleH: r * 0.5,
    });
    return;
  }
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
    const fit = frame.entity?.jacketFit ?? { x: -0.5, y: 0.02, rx: 1.1, ry: 0.78 };
    ctx.save();
    ctx.translate(r * fit.x, r * fit.y);
    drawNeonJacket(ctx, r * fit.rx, r * fit.ry, time);
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
  if (key === 'santahat') {
    const wobble = Math.sin(time * 2.6) * r * 0.08;
    ctx.fillStyle = '#d33a3a';
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, -r * 0.92);
    ctx.quadraticCurveTo(-r * 0.1, -r * 2.1, r * 0.55 + wobble, -r * 2.4);
    ctx.quadraticCurveTo(r * 0.5, -r * 1.3, r * 0.78, -r * 0.92);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a82a2a';
    ctx.lineWidth = r * 0.05;
    ctx.stroke();
    ctx.fillStyle = '#f7f7f7';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.92, r * 0.92, r * 0.26, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.55 + wobble, -r * 2.42, r * 0.3, 0, TAU);
    ctx.fill();
    return;
  }
  if (key === 'reindeer') {
    const sway = Math.sin(time * 3) * r * 0.06;
    ctx.strokeStyle = '#8a5a34';
    ctx.lineWidth = r * 0.14;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      const bx = side * r * 0.42;
      ctx.beginPath();
      ctx.moveTo(bx, -r * 0.85);
      ctx.quadraticCurveTo(bx + side * r * 0.5, -r * 1.5, bx + side * r * 0.25 + sway, -r * 2.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx + side * r * 0.22, -r * 1.5);
      ctx.lineTo(bx + side * r * 0.72, -r * 1.72);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx + side * r * 0.3, -r * 1.85);
      ctx.lineTo(bx + side * r * 0.78, -r * 2.0);
      ctx.stroke();
    }
    ctx.fillStyle = '#5f3d22';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * r * 0.42, -r * 0.88, r * 0.26, r * 0.14, 0, 0, TAU);
      ctx.fill();
    }
    return;
  }
  if (key === 'carrot') {
    const bob = Math.sin(time * 2.4) * r * 0.03;
    ctx.save();
    ctx.translate(r * 0.92, r * 0.12 + bob);
    ctx.rotate(0.12);
    ctx.fillStyle = '#ff8f3c';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.3);
    ctx.lineTo(0, r * 0.3);
    ctx.lineTo(r * 1.35, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d9661f';
    ctx.lineWidth = r * 0.05;
    ctx.stroke();
    ctx.strokeStyle = '#ffe0b8';
    ctx.lineWidth = r * 0.04;
    for (let i = 1; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(r * i * 0.32, -r * 0.22 + r * 0.06 * i);
      ctx.lineTo(r * i * 0.32, r * 0.22 - r * 0.06 * i);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  if (key === 'witchhat') {
    const sway = Math.sin(time * 2.2) * r * 0.05;
    ctx.fillStyle = '#211a2e';
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, -r * 0.92);
    ctx.quadraticCurveTo(-r * 0.05, -r * 2.05, r * 0.6 + sway, -r * 2.5);
    ctx.quadraticCurveTo(r * 0.4, -r * 1.3, r * 0.62, -r * 0.92);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7b3fa0';
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.0, r * 0.66, r * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = r * 0.07;
    ctx.strokeRect(-r * 0.14, -r * 1.16, r * 0.28, r * 0.26);
    ctx.fillStyle = '#2a2140';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.92, r * 0.98, r * 0.24, 0, 0, TAU);
    ctx.fill();
    return;
  }
  if (key === 'pumpkin') {
    const bob = Math.sin(time * 2) * r * 0.02;
    ctx.save();
    ctx.translate(0, -r * 0.7 + bob);
    ctx.fillStyle = '#e8822c';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.85, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 180, 80, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.45, -r * 0.15, r * 0.3, r * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#241608';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.5, -r * 0.12);
      ctx.lineTo(side * r * 0.28, -r * 0.42);
      ctx.lineTo(side * r * 0.2, -r * 0.08);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, r * 0.28);
    ctx.lineTo(-r * 0.2, r * 0.5);
    ctx.lineTo(0, r * 0.28);
    ctx.lineTo(r * 0.2, r * 0.5);
    ctx.lineTo(r * 0.45, r * 0.28);
    ctx.lineTo(r * 0.3, r * 0.62);
    ctx.lineTo(-r * 0.3, r * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4a6b2a';
    ctx.lineWidth = r * 0.14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.lineTo(r * 0.1, -r * 1.1);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (key === 'nyglasses') {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.arc(-r * 0.34, -r * 0.18, r * 0.28, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.34, -r * 0.18, r * 0.28, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.06, -r * 0.18);
    ctx.lineTo(r * 0.06, -r * 0.18);
    ctx.stroke();
    ctx.fillStyle = 'rgba(123, 223, 242, 0.4)';
    ctx.beginPath();
    ctx.arc(-r * 0.34, -r * 0.18, r * 0.22, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.34, -r * 0.18, r * 0.22, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (const [sx, sy] of [
      [-0.5, -0.4],
      [0.2, -0.5],
      [0.5, -0.05],
    ]) {
      ctx.beginPath();
      ctx.arc(sx * r, sy * r, r * 0.05, 0, TAU);
      ctx.fill();
    }
    return;
  }
}

function drawDish(ctx, r) {
  ctx.fillStyle = '#e9eff3';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.16, r * 1.5, r * 1.02, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 140, 155, 0.55)';
  ctx.lineWidth = r * 0.1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(184, 202, 214, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.16, r * 1.16, r * 0.74, 0, 0, TAU);
  ctx.fill();
}

function drawSharkFinDish(ctx, r, time) {
  drawDish(ctx, r);
  const bob = Math.sin(time * 2.2) * r * 0.03;
  ctx.save();
  ctx.translate(0, bob);
  ctx.fillStyle = '#5b6b78';
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, r * 0.55);
  ctx.quadraticCurveTo(-r * 0.05, -r * 1.15, r * 1.0, -r * 0.35);
  ctx.quadraticCurveTo(r * 0.25, r * 0.1, r * 0.55, r * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3f4c56';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.fillStyle = '#9fb0bb';
  ctx.beginPath();
  ctx.moveTo(r * 0.15, r * 0.45);
  ctx.quadraticCurveTo(r * 0.4, -r * 0.2, r * 0.86, -r * 0.28);
  ctx.quadraticCurveTo(r * 0.45, r * 0.16, r * 0.42, r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(200, 150, 90, 0.85)';
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, r * 0.5);
  ctx.quadraticCurveTo(-r * 0.2, r * 0.66, r * 0.7, r * 0.42);
  ctx.stroke();
  ctx.strokeStyle = '#7bbf5a';
  ctx.lineWidth = r * 0.06;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.35, r * 0.72);
    ctx.lineTo(i * r * 0.35 + r * 0.12, r * 0.42);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSambalStingray(ctx, r, time) {
  drawDish(ctx, r);
  ctx.fillStyle = '#3f7d43';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.2, r * 1.28, r * 0.86, 0.1, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30, 60, 30, 0.5)';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  const flick = Math.sin(time * 3) * r * 0.04;
  ctx.save();
  ctx.translate(0, flick);
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(-r * 1.05, r * 0.16);
  ctx.quadraticCurveTo(-r * 0.1, -r * 0.85, r * 0.95, r * 0.02);
  ctx.quadraticCurveTo(-r * 0.1, r * 0.95, -r * 1.05, r * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8e1f16';
  ctx.lineWidth = r * 0.07;
  ctx.stroke();
  ctx.strokeStyle = '#e2603f';
  ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, r * 0.08);
  ctx.quadraticCurveTo(-r * 0.05, -r * 0.5, r * 0.7, -r * 0.02);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.72, r * 0.28);
  ctx.quadraticCurveTo(-r * 0.05, r * 0.6, r * 0.66, r * 0.22);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40, 12, 8, 0.6)';
  ctx.lineWidth = r * 0.045;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.28, -r * 0.3);
    ctx.lineTo(i * r * 0.2, r * 0.4);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#cde975';
  ctx.beginPath();
  ctx.moveTo(r * 0.7, -r * 0.6);
  ctx.arc(r * 0.7, -r * 0.6, r * 0.34, -0.6, 1.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8fbf3a';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
}

function drawGrilledSquid(ctx, r, time) {
  ctx.save();
  ctx.rotate(-0.35);
  ctx.strokeStyle = '#c9a06a';
  ctx.lineWidth = r * 0.16;
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.55);
  ctx.lineTo(0, r * 1.5);
  ctx.stroke();
  ctx.fillStyle = '#d98a5a';
  ctx.beginPath();
  ctx.moveTo(-r * 0.62, -r * 1.1);
  ctx.lineTo(r * 0.62, -r * 1.1);
  ctx.lineTo(r * 0.5, r * 0.5);
  ctx.quadraticCurveTo(0, r * 0.72, -r * 0.5, r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a85f33';
  ctx.lineWidth = r * 0.07;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(70, 34, 14, 0.75)';
  ctx.lineWidth = r * 0.08;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, i * r * 0.5);
    ctx.lineTo(r * 0.5, i * r * 0.5 + r * 0.08);
    ctx.stroke();
  }
  const tentacle = Math.sin(time * 3.4) * r * 0.06;
  ctx.strokeStyle = '#d98a5a';
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i += 1) {
    const x = (i - 2) * r * 0.26;
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(x, r * 0.5);
    ctx.quadraticCurveTo(x + tentacle, r * 1.05, x - tentacle, r * 1.45);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPrawnCrackers(ctx, r, time) {
  ctx.fillStyle = 'rgba(244, 205, 214, 0.92)';
  ctx.beginPath();
  ctx.moveTo(-r * 1.1, r * 0.9);
  ctx.lineTo(-r * 0.85, -r * 0.4);
  ctx.lineTo(-r * 0.55, -r * 0.05);
  ctx.lineTo(-r * 0.25, -r * 0.45);
  ctx.lineTo(0.05 * r, -r * 0.1);
  ctx.lineTo(r * 0.4, -r * 0.5);
  ctx.lineTo(r * 0.7, -r * 0.05);
  ctx.lineTo(r * 1.05, -r * 0.45);
  ctx.lineTo(r * 1.15, r * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(200, 130, 150, 0.7)';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.fillStyle = '#e0738f';
  ctx.fillRect(-r * 0.95, -r * 0.15, r * 1.9, r * 0.5);
  ctx.fillStyle = '#fff3f6';
  ctx.font = `${Math.max(6, r * 0.34)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PRAWN', 0, r * 0.1);
  const puff = Math.sin(time * 2.6) * r * 0.05;
  const crackers = [
    [-r * 0.55, -r * 0.85, -0.5],
    [-r * 0.05, -r * 1.1, 0.1],
    [r * 0.5, -r * 0.9, 0.5],
  ];
  for (const [cx, cy, tilt] of crackers) {
    ctx.save();
    ctx.translate(cx, cy + puff);
    ctx.rotate(tilt);
    ctx.fillStyle = '#f6e6c4';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.42, r * 0.34, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#d9bd88';
    ctx.lineWidth = r * 0.05;
    ctx.stroke();
    ctx.fillStyle = 'rgba(226, 120, 140, 0.8)';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(
        Math.cos(i * 1.7) * r * 0.2,
        Math.sin(i * 1.7) * r * 0.16,
        r * 0.06,
        0,
        TAU,
      );
      ctx.fill();
    }
    ctx.restore();
  }
}

function renderCostume(ctx, key, r, time) {
  if (key === 'sharkfin') drawSharkFinDish(ctx, r, time);
  else if (key === 'sambalstingray') drawSambalStingray(ctx, r, time);
  else if (key === 'grilledsquid') drawGrilledSquid(ctx, r, time);
  else if (key === 'prawncrackers') drawPrawnCrackers(ctx, r, time);
  else if (key === 'chainfin') drawChainFin(ctx, r, time, { ventColor: '#6f7c86' });
}

function renderSlot(ctx, radius, time, frame, slot) {
  const active = slot === 'head' ? activeHead : slot === 'costume' ? activeCostume : activeBody;
  if (!active || active.key === 'none') return;
  ctx.save();
  if (active.key.startsWith('plush')) {
    drawPlushie(ctx, active.key, radius, time, frame);
  } else if (slot === 'costume') {
    renderCostume(ctx, active.key, radius, time);
  } else {
    renderAccessory(ctx, active.key, radius, time, frame);
  }
  ctx.restore();
}

export function drawAccessory(ctx, radius, time, frame = {}) {
  renderSlot(ctx, radius, time, frame, 'body');
  renderSlot(ctx, radius, time, frame, 'head');
  renderSlot(ctx, radius, time, frame, 'costume');
}
