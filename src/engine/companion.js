import { TAU } from './math.js';
import { COMPANIONS } from '../config.js';

const catalog = new Map(COMPANIONS.map((entry) => [entry.key, entry]));
const NONE = catalog.get('none');
const states = new WeakMap();

let active = NONE;

export function companionByKey(key) {
  return catalog.get(key) ?? NONE;
}

export function companionCatalog() {
  return COMPANIONS;
}

export function setActiveCompanion(companion) {
  active = companion && companion.key !== 'none' ? companion : NONE;
}

function drawBubblePal(ctx, r, age, phase) {
  const breathe = 1 + Math.sin(age * 2.6 + phase) * 0.07;
  ctx.beginPath();
  ctx.arc(0, 0, r * breathe, 0, TAU);
  ctx.fillStyle = 'rgba(207, 239, 255, 0.4)';
  ctx.fill();
  ctx.strokeStyle = '#cfefff';
  ctx.lineWidth = r * 0.14;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.34, r * 0.18, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(-r * 0.28, -r * 0.1, r * 0.1, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.28, -r * 0.1, r * 0.1, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#10233a';
  ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.arc(0, r * 0.18, r * 0.3, 0.25, Math.PI - 0.25);
  ctx.stroke();
}

function drawBabyMoray(ctx, r, age, phase) {
  ctx.lineCap = 'round';
  let x = -r * 0.9;
  let y = 0;
  for (let i = 0; i < 4; i += 1) {
    const angle = Math.sin(age * 6 + phase + i) * 0.45;
    const nx = x + Math.cos(angle) * r * 0.52;
    const ny = y + Math.sin(angle) * r * 0.52;
    ctx.strokeStyle = 'rgba(30, 34, 20, 0.75)';
    ctx.lineWidth = r * (0.66 - i * 0.13);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    ctx.strokeStyle = '#8a9a5a';
    ctx.lineWidth = r * (0.44 - i * 0.09);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    x = nx;
    y = ny;
  }
  ctx.fillStyle = '#8a9a5a';
  ctx.beginPath();
  ctx.ellipse(x + r * 0.1, y, r * 0.42, r * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8e3c2';
  ctx.fillRect(x - r * 0.02, y + r * 0.05, r * 0.42, r * 0.08);
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(x + r * 0.2, y - r * 0.1, r * 0.13, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff3b4a';
  ctx.beginPath();
  ctx.arc(x + r * 0.23, y - r * 0.1, r * 0.06, 0, TAU);
  ctx.fill();
}

function drawLanternFish(ctx, r, age, phase) {
  const wiggle = Math.sin(age * 7 + phase) * 0.3;
  ctx.save();
  ctx.translate(-r * 1.0, 0);
  ctx.rotate(wiggle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-r * 0.7, -r * 0.5);
  ctx.lineTo(-r * 0.7, r * 0.5);
  ctx.closePath();
  ctx.fillStyle = '#3d4f96';
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#3d4f96';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r * 0.55, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9fb2ff';
  ctx.beginPath();
  ctx.ellipse(r * 0.1, r * 0.16, r * 0.5, r * 0.26, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(r * 0.42, -r * 0.16, r * 0.14, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 0.45, -r * 0.16, r * 0.07, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#9fb2ff';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.moveTo(r * 0.6, -r * 0.4);
  ctx.quadraticCurveTo(r * 1.1, -r * 0.9, r * 0.9, -r * 1.35);
  ctx.stroke();
  const glow = 0.6 + 0.4 * Math.sin(age * 5 + phase);
  ctx.globalAlpha = 0.3 * glow;
  ctx.fillStyle = '#cfefff';
  ctx.beginPath();
  ctx.arc(r * 0.9, -r * 1.35, r * 0.5, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#eaffff';
  ctx.beginPath();
  ctx.arc(r * 0.9, -r * 1.35, r * 0.18, 0, TAU);
  ctx.fill();
}

function drawTinyJelly(ctx, r, age, phase) {
  const pulse = 1 + Math.sin(age * 3 + phase) * 0.1;
  ctx.strokeStyle = 'rgba(201, 163, 255, 0.85)';
  ctx.lineWidth = r * 0.14;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const sway = Math.sin(age * 4 + phase + i * 1.4) * r * 0.24;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5 + i * r * 0.5, r * 0.2);
    ctx.quadraticCurveTo(-r * 0.5 + i * r * 0.5 + sway, r * 0.8, -r * 0.5 + i * r * 0.5 + sway * 1.4, r * 1.25);
    ctx.stroke();
  }
  ctx.fillStyle = '#c9a3ff';
  ctx.beginPath();
  ctx.moveTo(-r * 0.85 * pulse, r * 0.25);
  ctx.quadraticCurveTo(-r * 0.75 * pulse, -r * 0.85, 0, -r * 0.85);
  ctx.quadraticCurveTo(r * 0.75 * pulse, -r * 0.85, r * 0.85 * pulse, r * 0.25);
  ctx.quadraticCurveTo(0, r * 0.5, -r * 0.85 * pulse, r * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.28, -r * 0.4, r * 0.24, r * 0.12, -0.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(-r * 0.26, -r * 0.08, r * 0.09, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.26, -r * 0.08, r * 0.09, 0, TAU);
  ctx.fill();
}

function drawMiniCrab(ctx, r, age, phase) {
  const clack = Math.abs(Math.sin(age * 8 + phase)) * 0.5;
  ctx.strokeStyle = '#b25348';
  ctx.lineWidth = r * 0.16;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * r * 0.75, r * 0.05);
    ctx.rotate(side * (0.5 + clack));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * r * 0.5, -r * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(side * r * 0.55, -r * 0.42, r * 0.2, 0, TAU);
    ctx.fillStyle = '#d96a5a';
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#d96a5a';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r * 0.62, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#a84b3e';
  ctx.lineWidth = r * 0.09;
  ctx.stroke();
  ctx.fillStyle = '#ffc9b8';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.14, r * 0.55, r * 0.3, 0, 0, TAU);
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.strokeStyle = '#a84b3e';
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(side * r * 0.28, -r * 0.45);
    ctx.lineTo(side * r * 0.36, -r * 0.78);
    ctx.stroke();
    ctx.fillStyle = '#f4fbff';
    ctx.beginPath();
    ctx.arc(side * r * 0.36, -r * 0.82, r * 0.13, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(side * r * 0.36, -r * 0.82, r * 0.06, 0, TAU);
    ctx.fill();
  }
}

function drawMiniShark(ctx, r, age, phase) {
  const wiggle = Math.sin(age * 6 + phase) * 0.28;
  ctx.lineCap = 'round';
  ctx.save();
  ctx.translate(-r * 0.95, 0);
  ctx.rotate(wiggle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-r * 0.6, -r * 0.45);
  ctx.lineTo(-r * 0.5, 0);
  ctx.lineTo(-r * 0.6, r * 0.45);
  ctx.closePath();
  ctx.fillStyle = '#5d87a8';
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#7fa8c9';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.05, r * 0.6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8f2fa';
  ctx.beginPath();
  ctx.ellipse(r * 0.12, r * 0.22, r * 0.68, r * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#5d87a8';
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.55);
  ctx.lineTo(r * 0.14, -r * 1.12);
  ctx.lineTo(r * 0.42, -r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(r * 0.7, -r * 0.18, r * 0.14, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 0.74, -r * 0.18, r * 0.07, 0, TAU);
  ctx.fill();
}

function drawMiniStingray(ctx, r, age, phase) {
  ctx.lineCap = 'round';
  let x = -r * 0.85;
  let y = 0;
  for (let i = 0; i < 3; i += 1) {
    const nx = x - r * 0.38;
    const ny = y + Math.sin(age * 5 + phase + i) * r * 0.32;
    ctx.strokeStyle = '#a5755c';
    ctx.lineWidth = r * (0.24 - i * 0.05);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    x = nx;
    y = ny;
  }
  ctx.fillStyle = '#b98a6e';
  ctx.beginPath();
  ctx.moveTo(r * 0.95, 0);
  ctx.quadraticCurveTo(r * 0.1, -r * 0.8, -r * 0.72, -r * 0.3);
  ctx.quadraticCurveTo(-r * 0.35, 0, -r * 0.72, r * 0.3);
  ctx.quadraticCurveTo(r * 0.1, r * 0.8, r * 0.95, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#efdcc9';
  ctx.beginPath();
  ctx.ellipse(r * 0.05, r * 0.1, r * 0.48, r * 0.22, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8f6248';
  ctx.beginPath();
  ctx.arc(r * 0.45, -r * 0.16, r * 0.08, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.18, r * 0.12, r * 0.07, 0, TAU);
  ctx.fill();
}

function drawMiniSquid(ctx, r, age, phase) {
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const sway = Math.sin(age * 5 + phase + i * 1.1) * r * 0.28;
    ctx.strokeStyle = '#c76e86';
    ctx.lineWidth = r * 0.13;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3 + i * r * 0.3, r * 0.35);
    ctx.quadraticCurveTo(
      -r * 0.38 + i * r * 0.33 + sway,
      r * 0.9,
      -r * 0.5 + i * r * 0.38 + sway * 1.4,
      r * 1.2,
    );
    ctx.stroke();
  }
  ctx.fillStyle = '#d98a9e';
  ctx.beginPath();
  ctx.moveTo(r * 0.85, -r * 0.08);
  ctx.quadraticCurveTo(0, -r * 0.95, -r * 0.7, -r * 0.22);
  ctx.quadraticCurveTo(-r * 0.35, r * 0.42, r * 0.85, -r * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c76e86';
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.15);
  ctx.lineTo(-r * 1.0, -r * 0.5);
  ctx.lineTo(-r * 0.85, -r * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, r * 0.1);
  ctx.lineTo(-r * 1.0, r * 0.45);
  ctx.lineTo(-r * 0.85, r * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(r * 0.42, -r * 0.18, r * 0.19, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 0.47, -r * 0.18, r * 0.09, 0, TAU);
  ctx.fill();
}

function drawMiniShrimp(ctx, r, age, phase) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#e89a72';
  ctx.lineWidth = r * 0.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.42);
  ctx.quadraticCurveTo(r * 0.1, r * 0.75, r * 0.58, r * 0.08);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(150, 80, 44, 0.4)';
  ctx.lineWidth = r * 0.07;
  for (let i = 0; i < 2; i += 1) {
    ctx.beginPath();
    ctx.arc(-r * 0.5 + i * r * 0.16, r * 0.42 - i * r * 0.05, r * 0.55, -0.4, 0.7);
    ctx.stroke();
  }
  const sway = Math.sin(age * 5 + phase) * r * 0.25;
  ctx.strokeStyle = '#d98a60';
  ctx.lineWidth = r * 0.1;
  for (let i = 0; i < 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(r * 0.5, -r * 0.22 + i * r * 0.14);
    ctx.quadraticCurveTo(
      r * 1.0 + sway,
      -r * 0.75 + i * r * 0.25,
      r * 1.35 + sway * 0.5,
      -r * 0.45 + i * r * 0.4,
    );
    ctx.stroke();
  }
  ctx.fillStyle = '#d9764a';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.42);
  ctx.lineTo(-r * 1.0, r * 0.08);
  ctx.lineTo(-r * 0.7, r * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 0.52, -r * 0.12, r * 0.08, 0, TAU);
  ctx.fill();
}

function drawMiniNautilus(ctx, r, age, phase) {
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const sway = Math.sin(age * 5 + phase + i * 1.2) * r * 0.2;
    ctx.strokeStyle = i % 2 === 0 ? '#c98f52' : '#d9a86e';
    ctx.lineWidth = r * 0.13;
    ctx.beginPath();
    ctx.moveTo(r * 0.35, r * 0.28);
    ctx.quadraticCurveTo(
      r * (0.8 + i * 0.14) + sway,
      r * 0.62,
      r * (0.88 + i * 0.18),
      r * (0.2 + i * 0.26),
    );
    ctx.stroke();
  }
  ctx.fillStyle = '#e8c98a';
  ctx.beginPath();
  ctx.arc(-r * 0.1, 0, r * 0.72, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#b98f4e';
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  for (let i = 0; i < 22; i += 1) {
    const angle = i * 0.45;
    const spiral = r * (0.1 + i * 0.026);
    const x = -r * 0.1 + Math.cos(angle) * spiral;
    const y = Math.sin(angle) * spiral;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#d9a86e';
  ctx.beginPath();
  ctx.ellipse(r * 0.45, r * 0.28, r * 0.3, r * 0.2, 0.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 0.5, r * 0.24, r * 0.07, 0, TAU);
  ctx.fill();
}

function drawMiniAngler(ctx, r, age, phase) {
  const bob = Math.sin(age * 3 + phase) * r * 0.25;
  ctx.lineCap = 'round';
  ctx.fillStyle = '#222b45';
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, 0);
  ctx.lineTo(-r * 1.15, -r * 0.42);
  ctx.lineTo(-r * 1.1, 0);
  ctx.lineTo(-r * 1.15, r * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b3454';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#4a567c';
  ctx.beginPath();
  ctx.ellipse(r * 0.1, r * 0.28, r * 0.6, r * 0.28, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#9fb2ff';
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  ctx.moveTo(r * 0.35, -r * 0.5);
  ctx.quadraticCurveTo(r * 0.75, -r * 1.0, r * 0.55, -r * 1.35 + bob);
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#cfefff';
  ctx.beginPath();
  ctx.arc(r * 0.55, -r * 1.35 + bob, r * 0.4, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#eaffff';
  ctx.beginPath();
  ctx.arc(r * 0.55, -r * 1.35 + bob, r * 0.16, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f4fbff';
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(r * (0.35 + i * 0.16), r * 0.18, r * 0.07, r * 0.12);
  }
  ctx.fillStyle = '#9fb2ff';
  ctx.beginPath();
  ctx.arc(r * 0.5, -r * 0.2, r * 0.08, 0, TAU);
  ctx.fill();
}

function drawMiniSeal(ctx, r, age, phase) {
  const sway = Math.sin(age * 3.4 + phase) * r * 0.06;
  ctx.fillStyle = '#8b98a5';
  ctx.beginPath();
  ctx.ellipse(-r * 0.15, sway, r * 0.9, r * 0.55, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c3c9d2';
  ctx.beginPath();
  ctx.ellipse(-r * 0.1, r * 0.18 + sway, r * 0.6, r * 0.28, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#74828f';
  ctx.beginPath();
  ctx.moveTo(-r * 0.95, sway);
  ctx.lineTo(-r * 1.35, -r * 0.3 + sway);
  ctx.lineTo(-r * 1.05, r * 0.22 + sway);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8b98a5';
  ctx.beginPath();
  ctx.arc(r * 0.62, -r * 0.18 + sway, r * 0.42, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c3c9d2';
  ctx.beginPath();
  ctx.ellipse(r * 0.95, -r * 0.02 + sway, r * 0.22, r * 0.16, 0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 0.85, -r * 0.12 + sway, r * 0.08, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.5, -r * 0.12 + sway, r * 0.07, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240, 248, 255, 0.8)';
  ctx.lineWidth = r * 0.05;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(r * 1.05, r * 0.02 + sway);
    ctx.lineTo(r * 1.35, -r * 0.08 + i * r * 0.1 + sway);
    ctx.stroke();
  }
}

function drawMiniOctopus(ctx, r, age, phase) {
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i += 1) {
    const sway = Math.sin(age * 4.5 + phase + i * 1.3) * r * 0.28;
    ctx.strokeStyle = '#a8434a';
    ctx.lineWidth = r * 0.15;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45 + i * r * 0.3, r * 0.22);
    ctx.quadraticCurveTo(
      -r * 0.52 + i * r * 0.32 + sway,
      r * 0.85,
      -r * 0.68 + i * r * 0.38 + sway * 1.3,
      r * 1.18,
    );
    ctx.stroke();
  }
  ctx.fillStyle = '#c14d55';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.78, r * 0.64, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e57a80';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.18, r * 0.5, r * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(r * 0.3, -r * 0.12, r * 0.15, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.12, r * 0.15, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 0.33, -r * 0.12, r * 0.07, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-r * 0.33, -r * 0.12, r * 0.07, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#7a2530';
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.moveTo(r * 0.12, -r * 0.34);
  ctx.lineTo(r * 0.42, -r * 0.22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, -r * 0.34);
  ctx.lineTo(-r * 0.42, -r * 0.22);
  ctx.stroke();
}

function drawMiniTurtle(ctx, r, age, phase) {
  const kick = Math.sin(age * 4 + phase) * 0.35;
  ctx.fillStyle = '#7ba36b';
  for (const [ax, ay, rot] of [
    [r * 0.55, -r * 0.4, -0.7],
    [r * 0.55, r * 0.4, 0.7],
    [-r * 0.6, -r * 0.42, -2.3],
    [-r * 0.6, r * 0.42, 2.3],
  ]) {
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(rot + kick);
    ctx.beginPath();
    ctx.ellipse(r * 0.3, 0, r * 0.32, r * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#7ba36b';
  ctx.beginPath();
  ctx.ellipse(r * 1.02, 0, r * 0.3, r * 0.24, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#5e8a52';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r * 0.66, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3f6236';
  ctx.lineWidth = r * 0.08;
  ctx.stroke();
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.32, -r * 0.5);
    ctx.lineTo(i * r * 0.32, r * 0.5);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, 0);
  ctx.lineTo(r * 0.75, 0);
  ctx.stroke();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 1.18, -r * 0.08, r * 0.06, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3f6236';
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.moveTo(r * 1.15, r * 0.1);
  ctx.lineTo(r * 1.32, r * 0.16);
  ctx.stroke();
}

function drawMiniChaser(ctx, r, age, phase) {
  const wiggle = Math.sin(age * 7 + phase) * 0.34;
  ctx.lineCap = 'round';
  ctx.save();
  ctx.translate(-r * 0.95, 0);
  ctx.rotate(wiggle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-r * 0.7, -r * 0.55);
  ctx.lineTo(-r * 0.55, 0);
  ctx.lineTo(-r * 0.7, r * 0.55);
  ctx.closePath();
  ctx.fillStyle = '#35516b';
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#4a6a86';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.1, r * 0.62, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#6f8faa';
  ctx.beginPath();
  ctx.ellipse(r * 0.1, r * 0.24, r * 0.7, r * 0.28, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#35516b';
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, -r * 0.56);
  ctx.lineTo(r * 0.1, -r * 1.2);
  ctx.lineTo(r * 0.42, -r * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#22384f';
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(r * 0.35, r * 0.08);
  ctx.lineTo(r * 0.95, r * 0.16);
  ctx.stroke();
  ctx.fillStyle = '#f4fbff';
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(r * (0.42 + i * 0.14), r * 0.06);
    ctx.lineTo(r * (0.48 + i * 0.14), r * 0.22);
    ctx.lineTo(r * (0.54 + i * 0.14), r * 0.06);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#ff3b4a';
  ctx.beginPath();
  ctx.arc(r * 0.72, -r * 0.2, r * 0.2, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff3b4a';
  ctx.beginPath();
  ctx.arc(r * 0.72, -r * 0.2, r * 0.09, 0, TAU);
  ctx.fill();
}

function drawMiniDartEel(ctx, r, age, phase) {
  ctx.lineCap = 'round';
  const points = [];
  for (let i = 0; i <= 5; i += 1) {
    const wave = Math.sin(age * 6 + phase + i * 1.1) * r * 0.28;
    points.push([-r * 1.5 + i * r * 0.5, wave]);
  }
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < points.length - 1; i += 1) {
      ctx.strokeStyle = pass === 0 ? 'rgba(30, 34, 20, 0.65)' : '#8a9a5a';
      ctx.lineWidth = (r * 0.3 - i * r * 0.035) * (pass === 0 ? 1.4 : 1);
      ctx.beginPath();
      ctx.moveTo(points[i][0], points[i][1]);
      ctx.lineTo(points[i + 1][0], points[i + 1][1]);
      ctx.stroke();
    }
  }
  const [hx, hy] = points[points.length - 1];
  ctx.fillStyle = '#8a9a5a';
  ctx.beginPath();
  ctx.ellipse(hx + r * 0.12, hy, r * 0.3, r * 0.16, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(hx + r * 0.2, hy - r * 0.05, r * 0.07, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(hx + r * 0.22, hy - r * 0.05, r * 0.035, 0, TAU);
  ctx.fill();
}

function drawMiniCatfish(ctx, r, age, phase) {
  const sway = Math.sin(age * 5 + phase) * r * 0.3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#6b5a45';
  ctx.lineWidth = r * 0.08;
  for (let i = 0; i < 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(r * 0.95, -r * 0.05 + i * r * 0.18);
    ctx.quadraticCurveTo(r * 1.3 + sway, -r * 0.3 + i * r * 0.35, r * 1.55 + sway * 0.6, -r * 0.15 + i * r * 0.5);
    ctx.stroke();
  }
  ctx.fillStyle = '#4d5a66';
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, 0);
  ctx.lineTo(-r * 1.2, -r * 0.42);
  ctx.lineTo(-r * 1.12, 0);
  ctx.lineTo(-r * 1.2, r * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5d6b78';
  ctx.beginPath();
  ctx.ellipse(-r * 0.05, 0, r * 0.9, r * 0.55, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8b9a9e';
  ctx.beginPath();
  ctx.ellipse(r * 0.02, r * 0.2, r * 0.62, r * 0.26, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#5d6b78';
  ctx.beginPath();
  ctx.ellipse(r * 0.72, -r * 0.08, r * 0.4, r * 0.42, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 0.6, -r * 0.2, r * 0.07, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.9, -r * 0.14, r * 0.06, 0, TAU);
  ctx.fill();
}

function drawMiniVolt(ctx, r, age, phase) {
  ctx.lineCap = 'round';
  const points = [];
  for (let i = 0; i <= 5; i += 1) {
    const wave = Math.sin(age * 5.5 + phase + i * 1.05) * r * 0.3;
    points.push([-r * 1.55 + i * r * 0.55, wave]);
  }
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < points.length - 1; i += 1) {
      ctx.strokeStyle = pass === 0 ? 'rgba(40, 50, 30, 0.6)' : '#7a9a4a';
      ctx.lineWidth = (r * 0.34 - i * r * 0.045) * (pass === 0 ? 1.35 : 1);
      ctx.beginPath();
      ctx.moveTo(points[i][0], points[i][1]);
      ctx.lineTo(points[i + 1][0], points[i + 1][1]);
      ctx.stroke();
    }
  }
  const flicker = 0.4 + 0.6 * Math.abs(Math.sin(age * 16 + phase));
  ctx.globalAlpha = flicker;
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = r * 0.06;
  for (let i = 1; i < points.length; i += 2) {
    const [px, py] = points[i];
    const jitter = Math.sin(age * 24 + i * 3.1) * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(px, py - r * 0.3);
    ctx.lineTo(px + jitter, py - r * 0.62);
    ctx.lineTo(px - jitter * 0.5, py - r * 0.85);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const [hx, hy] = points[points.length - 1];
  ctx.fillStyle = '#7a9a4a';
  ctx.beginPath();
  ctx.ellipse(hx + r * 0.1, hy, r * 0.28, r * 0.16, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(hx + r * 0.18, hy - r * 0.05, r * 0.05, 0, TAU);
  ctx.fill();
}

function drawMiniPiranha(ctx, r, age, phase) {
  const wiggle = Math.sin(age * 7 + phase) * 0.3;
  ctx.save();
  ctx.translate(-r * 0.85, 0);
  ctx.rotate(wiggle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-r * 0.55, -r * 0.4);
  ctx.lineTo(-r * 0.45, 0);
  ctx.lineTo(-r * 0.55, r * 0.4);
  ctx.closePath();
  ctx.fillStyle = '#5d7a82';
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#9fb2b8';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.72, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c9433b';
  ctx.beginPath();
  ctx.ellipse(r * 0.05, r * 0.3, r * 0.66, r * 0.34, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#5d7a82';
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.66);
  ctx.lineTo(r * 0.12, -r * 1.15);
  ctx.lineTo(r * 0.4, -r * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 0.55, -r * 0.22, r * 0.12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(r * 0.58, -r * 0.24, r * 0.05, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f4fbff';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(r * (0.45 + i * 0.16), r * 0.02);
    ctx.lineTo(r * (0.52 + i * 0.16), r * 0.2);
    ctx.lineTo(r * (0.58 + i * 0.16), r * 0.02);
    ctx.closePath();
    ctx.fill();
  }
}

function drawMiniPuffer(ctx, r, age, phase) {
  const puff = 1 + Math.sin(age * 2.6 + phase) * 0.12;
  ctx.strokeStyle = '#8a7350';
  ctx.lineWidth = r * 0.07;
  const spikes = 10;
  for (let i = 0; i < spikes; i += 1) {
    const angle = (i / spikes) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.72 * puff, Math.sin(angle) * r * 0.72 * puff);
    ctx.lineTo(Math.cos(angle) * r * 1.05 * puff, Math.sin(angle) * r * 1.05 * puff);
    ctx.stroke();
  }
  ctx.fillStyle = '#c9a86e';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.75 * puff, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#efdcc9';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.26, r * 0.5 * puff, r * 0.3 * puff, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8a7350';
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(
      Math.cos(i * 1.9 + 0.4) * r * 0.45,
      Math.sin(i * 1.9 + 0.4) * r * 0.45 - r * 0.1,
      r * 0.06,
      0,
      TAU,
    );
    ctx.fill();
  }
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(r * 0.32, -r * 0.18, r * 0.16, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 0.36, -r * 0.18, r * 0.08, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8a7350';
  ctx.beginPath();
  ctx.ellipse(-r * 0.55, r * 0.1, r * 0.22, r * 0.12, 0.5, 0, TAU);
  ctx.fill();
}

export function drawCompanion(ctx, entity) {
  if (!active || active.key === 'none') return;
  let state = states.get(entity);
  if (!state) {
    state = { x: entity.x, y: entity.y, phase: (entity.radius ?? 16) * 0.37, lastAge: entity.age };
    states.set(entity, state);
  }
  let dt = entity.age - state.lastAge;
  if (!(dt > 0.0001 && dt < 0.1)) dt = 1 / 60;
  state.lastAge = entity.age;
  const radius = entity.radius ?? 16;
  const speed = Math.hypot(entity.vx ?? 0, entity.vy ?? 0);
  const heading = entity.heading ?? 0;
  const dirX = speed > 20 ? entity.vx / speed : Math.cos(heading);
  const dirY = speed > 20 ? entity.vy / speed : Math.sin(heading);
  const behind = radius * 2.4 * (1 - Math.exp(-speed / 300));
  const bob = Math.sin(entity.age * 2.4 + state.phase) * radius * 0.45;
  const targetX = entity.x - dirX * (radius * 1.6 + behind);
  const targetY = entity.y - dirY * (radius * 1.1 + behind * 0.7) - radius * 0.9 + bob;
  const ease = 1 - Math.exp(-4 * dt);
  state.x += (targetX - state.x) * ease;
  state.y += (targetY - state.y) * ease;
  if (Math.abs(targetX - state.x) > 1) state.facing = targetX > state.x ? 1 : -1;
  const facing = state.facing ?? 1;
  const r = radius * 0.6;
  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.scale(facing, 1);
  ctx.globalAlpha = 0.95;
  if (active.key === 'bubblepal') drawBubblePal(ctx, r, entity.age, state.phase);
  else if (active.key === 'babymoray') drawBabyMoray(ctx, r, entity.age, state.phase);
  else if (active.key === 'lanternfish') drawLanternFish(ctx, r, entity.age, state.phase);
  else if (active.key === 'tinyjelly') drawTinyJelly(ctx, r, entity.age, state.phase);
  else if (active.key === 'minicrab') drawMiniCrab(ctx, r, entity.age, state.phase);
  else if (active.key === 'minishark') drawMiniShark(ctx, r, entity.age, state.phase);
  else if (active.key === 'ministingray') drawMiniStingray(ctx, r, entity.age, state.phase);
  else if (active.key === 'minisquid') drawMiniSquid(ctx, r, entity.age, state.phase);
  else if (active.key === 'minishrimp') drawMiniShrimp(ctx, r, entity.age, state.phase);
  else if (active.key === 'mininautilus') drawMiniNautilus(ctx, r, entity.age, state.phase);
  else if (active.key === 'miniangler') drawMiniAngler(ctx, r, entity.age, state.phase);
  else if (active.key === 'miniseal') drawMiniSeal(ctx, r, entity.age, state.phase);
  else if (active.key === 'minioctopus') drawMiniOctopus(ctx, r, entity.age, state.phase);
  else if (active.key === 'miniturtle') drawMiniTurtle(ctx, r, entity.age, state.phase);
  else if (active.key === 'minichaser') drawMiniChaser(ctx, r, entity.age, state.phase);
  else if (active.key === 'mindarteel') drawMiniDartEel(ctx, r, entity.age, state.phase);
  else if (active.key === 'minicatfish') drawMiniCatfish(ctx, r, entity.age, state.phase);
  else if (active.key === 'minivolt') drawMiniVolt(ctx, r, entity.age, state.phase);
  else if (active.key === 'minipiranha') drawMiniPiranha(ctx, r, entity.age, state.phase);
  else if (active.key === 'minipuffer') drawMiniPuffer(ctx, r, entity.age, state.phase);
  ctx.restore();
}
