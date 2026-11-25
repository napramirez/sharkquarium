import { TAU } from '../engine/math.js';

function grad(ctx, y0, y1, top, bottom) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}

function eyes(ctx, r, x, y, size, color = '#0c1014') {
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(x, y, size, 0, TAU);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + size * 0.15, y, size * 0.55, 0, TAU);
  ctx.fill();
}

export function drawVampireSquid(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  const cloak = 1 + Math.sin(age * 2) * 0.06;
  ctx.save();
  ctx.rotate(Math.sin(age * 1.6) * 0.04);
  ctx.fillStyle = 'rgba(120, 24, 40, 0.55)';
  ctx.beginPath();
  for (let i = -3; i <= 3; i += 1) {
    const a = (i / 3) * 0.9;
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-r * 1.4 * cloak, Math.sin(a) * r * 1.3, -r * 2.2 * cloak, Math.sin(a) * r * 1.5);
  }
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(r * 0.1, 0, r * 1.2, r * 1.0, 0, 0, TAU);
  ctx.fillStyle = grad(ctx, -r, r, '#7a1626', '#400a14');
  ctx.fill();
  ctx.strokeStyle = '#2a0710';
  ctx.lineWidth = r * 0.07;
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.fillStyle = 'rgba(220, 90, 110, 0.5)';
    ctx.beginPath();
    ctx.ellipse(r * 0.3, side * r * 0.7, r * 0.34, r * 0.2, side * 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd7de';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.85, side * r * 0.36, r * 0.26, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#160406';
    ctx.beginPath();
    ctx.arc(r * 0.9, side * r * 0.36, r * 0.13, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd7de';
  }
  ctx.strokeStyle = 'rgba(255, 200, 210, 0.35)';
  ctx.lineWidth = r * 0.06;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(r * 0.2, i * r * 0.2);
    ctx.quadraticCurveTo(-r * 1.0, i * r * 0.9, -r * 1.9, i * r * 1.2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawBarreleye(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 2) * 0.03);
  ctx.beginPath();
  ctx.moveTo(r * 1.0, 0);
  ctx.quadraticCurveTo(r * 0.2, -r * 0.8, -r * 0.9, -r * 0.4);
  ctx.quadraticCurveTo(-r * 1.3, 0, -r * 0.9, r * 0.4);
  ctx.quadraticCurveTo(r * 0.2, r * 0.8, r * 1.0, 0);
  ctx.closePath();
  ctx.fillStyle = grad(ctx, -r, r, '#3b4a55', '#18222a');
  ctx.fill();
  ctx.strokeStyle = '#0c1216';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.fillStyle = 'rgba(210, 235, 250, 0.22)';
  ctx.beginPath();
  ctx.ellipse(r * 0.25, -r * 0.1, r * 0.7, r * 0.55, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(210, 235, 250, 0.5)';
  ctx.lineWidth = r * 0.04;
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(r * 0.32, side * r * 0.18, r * 0.16, r * 0.24, 0, 0, TAU);
    ctx.fillStyle = '#4fd6a0';
    ctx.fill();
  }
  ctx.fillStyle = '#7ff0c0';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.32, side * r * 0.4, r * 0.1, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGulperEel(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 1.8) * 0.03);
  ctx.strokeStyle = '#12161c';
  ctx.lineWidth = r * 0.24;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, 0);
  ctx.quadraticCurveTo(-r * 2.2, Math.sin(age * 2) * r * 0.6, -r * 3.6, Math.sin(age * 2 + 1) * r * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 0.2, 0);
  ctx.lineTo(-r * 0.4, Math.sin(age * 2) * r * 0.2);
  ctx.stroke();
  ctx.fillStyle = grad(ctx, -r, r, '#1b2028', '#0a0d11');
  ctx.beginPath();
  ctx.ellipse(r * 0.7, 0, r * 1.1, r * 0.85, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#05070a';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(r * 1.4, 0);
  ctx.quadraticCurveTo(r * 2.2, -r * 0.5, r * 2.6, 0);
  ctx.quadraticCurveTo(r * 2.2, r * 0.5, r * 1.4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8eef2';
  for (let i = 0; i < 6; i += 1) {
    const tx = r * (1.5 + i * 0.18);
    ctx.beginPath();
    ctx.moveTo(tx, -r * 0.16);
    ctx.lineTo(tx + r * 0.05, -r * 0.16);
    ctx.lineTo(tx, r * 0.02);
    ctx.closePath();
    ctx.fill();
  }
  eyes(ctx, r, r * 0.6, -r * 0.4, r * 0.14);
  ctx.restore();
}

export function drawViperfish(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 2) * 0.04);
  ctx.beginPath();
  ctx.moveTo(-r * 2.4, 0);
  ctx.lineTo(-r * 1.5, -r * 0.3);
  ctx.lineTo(-r * 1.6, r * 0.3);
  ctx.closePath();
  ctx.fillStyle = '#10151b';
  ctx.fill();
  const grad2 = grad(ctx, -r * 0.6, r * 0.6, '#2b3a44', '#0c1014');
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.7, r * 0.5, 0, 0, TAU);
  ctx.fillStyle = grad2;
  ctx.fill();
  ctx.strokeStyle = '#05070a';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = 'rgba(150, 230, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(r * (0.9 - i * 0.5), r * 0.34, r * 0.05, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#dfe6ea';
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.moveTo(r * 1.4, 0.08 * r);
  ctx.lineTo(r * 1.1, r * 0.5);
  ctx.stroke();
  ctx.fillStyle = '#e8eef2';
  for (let i = 0; i < 5; i += 1) {
    const tx = r * (1.2 - i * 0.13);
    ctx.beginPath();
    ctx.moveTo(tx, r * 0.12);
    ctx.lineTo(tx + r * 0.04, r * 0.12);
    ctx.lineTo(tx, r * 0.34);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#0d1216';
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.moveTo(r * 1.3, -r * 0.2);
  ctx.quadraticCurveTo(r * 1.0, -r * 1.2, r * 0.5, -r * 1.6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(150, 235, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(r * 0.5, -r * 1.6, r * 0.14, 0, TAU);
  ctx.fill();
  eyes(ctx, r, r * 1.05, -r * 0.16, r * 0.13);
  ctx.restore();
}

export function drawDumboOctopus(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  const flap = Math.sin(age * 2.4) * 0.4;
  ctx.save();
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(-r * 0.3, side * r * 0.7);
    ctx.rotate(side * (0.5 + flap * 0.3));
    ctx.beginPath();
    ctx.ellipse(-r * 0.5, 0, r * 0.6, r * 0.3, 0, 0, TAU);
    ctx.fillStyle = '#c66a8a';
    ctx.fill();
    ctx.strokeStyle = '#7c3d58';
    ctx.lineWidth = r * 0.05;
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = grad(ctx, -r, r, '#d67a98', '#8a3d5e');
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.0, r * 0.95, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#5e2742';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.strokeStyle = '#b85a7c';
  ctx.lineWidth = r * 0.14;
  ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i += 1) {
    const sway = Math.sin(age * 3 + i) * r * 0.25;
    ctx.beginPath();
    ctx.moveTo(r * (0.1 + i * 0.16), r * 0.7);
    ctx.quadraticCurveTo(r * 0.1 + sway, r * 1.3, sway, r * 1.8);
    ctx.stroke();
  }
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.42, side * r * 0.2, r * 0.16, 0, TAU);
    ctx.fillStyle = '#f4fbff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.45, side * r * 0.2, r * 0.08, 0, TAU);
    ctx.fillStyle = '#141018';
    ctx.fill();
  }
  ctx.restore();
}

export function drawFangtooth(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 2.2) * 0.04);
  ctx.beginPath();
  ctx.moveTo(-r * 1.3, -r * 0.35);
  ctx.lineTo(-r * 1.7, 0);
  ctx.lineTo(-r * 1.3, r * 0.35);
  ctx.closePath();
  ctx.fillStyle = '#241616';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.2, r * 0.95, 0, 0, TAU);
  ctx.fillStyle = grad(ctx, -r, r, '#3a2626', '#160d0d');
  ctx.fill();
  ctx.strokeStyle = '#080404';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.fillStyle = 'rgba(60, 50, 40, 0.5)';
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.arc(Math.cos(i * 2.1) * r * 0.5, Math.sin(i * 2.1) * r * 0.4, r * 0.1, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#e8eef2';
  for (let i = 0; i < 5; i += 1) {
    const tx = r * (0.5 + i * 0.14);
    ctx.beginPath();
    ctx.moveTo(tx, r * 0.2);
    ctx.lineTo(tx + r * 0.05, r * 0.2);
    ctx.lineTo(tx, r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx, -r * 0.2);
    ctx.lineTo(tx + r * 0.05, -r * 0.2);
    ctx.lineTo(tx, -r * 0.46);
    ctx.closePath();
    ctx.fill();
  }
  eyes(ctx, r, r * 0.55, -r * 0.35, r * 0.16);
  ctx.restore();
}

export function drawTripodFish(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.strokeStyle = '#8a7a5c';
  ctx.lineWidth = r * 0.08;
  ctx.lineCap = 'round';
  for (const [ax, tx] of [[-r * 0.2, -r * 1.6], [r * 0.6, r * 0.4], [-r * 0.4, -r * 0.3]]) {
    ctx.beginPath();
    ctx.moveTo(ax, r * 0.5);
    ctx.lineTo(tx, r * 1.9);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-r * 1.6, 0);
  ctx.lineTo(-r * 1.0, -r * 0.24);
  ctx.lineTo(-r * 1.0, r * 0.24);
  ctx.closePath();
  ctx.fillStyle = '#5c5038';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.1, r * 1.5, r * 0.5, 0, 0, TAU);
  ctx.fillStyle = grad(ctx, -r * 0.6, r * 0.4, '#b0a074', '#6b5f42');
  ctx.fill();
  ctx.strokeStyle = '#3f3a28';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(20, 16, 10, 0.4)';
  ctx.lineWidth = r * 0.03;
  for (let i = 0; i < 5; i += 1) {
    const gx = r * (0.6 - i * 0.14);
    ctx.beginPath();
    ctx.moveTo(gx, -r * 0.5);
    ctx.lineTo(gx, r * 0.3);
    ctx.stroke();
  }
  eyes(ctx, r, r * 0.9, -r * 0.28, r * 0.13);
  ctx.restore();
}

export function drawSeaPig(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  const bob = Math.sin(age * 2.5) * r * 0.1;
  ctx.save();
  ctx.translate(0, bob);
  ctx.strokeStyle = '#c7b8d0';
  ctx.lineWidth = r * 0.09;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      const lx = -r * 0.3 + i * r * 0.5;
      ctx.beginPath();
      ctx.moveTo(lx, side * r * 0.5);
      ctx.lineTo(lx + Math.sin(age * 3 + i) * r * 0.2, side * r * 1.1);
      ctx.stroke();
    }
  }
  ctx.fillStyle = grad(ctx, -r, r, '#e8d8ee', '#b79dc4');
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.2, r * 0.85, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#8a6f9a';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * TAU;
    ctx.strokeStyle = '#9a7fb0';
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.4, -r * 0.4 + Math.sin(a) * r * 0.2);
    ctx.lineTo(Math.cos(a) * r * 0.5, -r * 0.95);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawYetiCrab(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.strokeStyle = '#e8e4dc';
  ctx.lineWidth = r * 0.16;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.7, side * r * 0.4);
    ctx.lineTo(r * 1.6, side * r * 0.9);
    ctx.stroke();
  }
  ctx.strokeStyle = '#bfb8ac';
  ctx.lineWidth = r * 0.06;
  for (let i = 0; i < 7; i += 1) {
    const sw = Math.sin(age * 4 + i) * r * 0.05;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(r * (1.0 + i * 0.09), side * (r * 0.5 + i * 0.06));
      ctx.lineTo(r * (1.5 + i * 0.04) + sw, side * (r * 0.85 + i * 0.03));
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#efe9df';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.0, r * 0.7, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#8a8478';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.4, side * r * 0.24, r * 0.1, 0, TAU);
    ctx.fillStyle = '#141414';
    ctx.fill();
    ctx.strokeStyle = '#efe9df';
    ctx.lineWidth = r * 0.07;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(r * 0.7, side * r * 0.5);
      ctx.lineTo(r * (1.1 + i * 0.1), side * (r * 0.7 + i * 0.2));
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawChimaera(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 1.4) * 0.03);
  ctx.strokeStyle = '#8b98a5';
  ctx.lineWidth = r * 0.1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 1.6, 0);
  ctx.quadraticCurveTo(-r * 3.0, Math.sin(age * 2) * r * 0.3, -r * 4.2, Math.sin(age * 2 + 1) * r * 0.4);
  ctx.stroke();
  ctx.fillStyle = grad(ctx, -r, r, '#b8c4cd', '#6f7d8a');
  ctx.beginPath();
  ctx.moveTo(r * 2.0, r * 0.02);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.8, -r * 0.8, -r * 0.5);
  ctx.quadraticCurveTo(-r * 1.7, -r * 0.2, -r * 1.6, 0);
  ctx.quadraticCurveTo(-r * 1.7, r * 0.2, -r * 0.8, r * 0.5);
  ctx.quadraticCurveTo(r * 0.6, r * 0.8, r * 2.0, r * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#414d58';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.fillStyle = grad(ctx, -r, r, '#cad4db', '#8b98a5');
  ctx.beginPath();
  ctx.moveTo(r * 0.5, -r * 0.55);
  ctx.lineTo(-r * 0.3, -r * 1.2);
  ctx.lineTo(r * 0.2, -r * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a6672';
  ctx.lineWidth = r * 0.04;
  for (let i = 0; i < 4; i += 1) {
    const gx = r * (0.3 - i * 0.13);
    ctx.beginPath();
    ctx.moveTo(gx, -r * 0.3);
    ctx.lineTo(gx - r * 0.06, r * 0.2);
    ctx.stroke();
  }
  eyes(ctx, r, r * 1.45, -r * 0.22, r * 0.16);
  ctx.restore();
}

export function drawCoelacanth(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 1.6) * 0.03);
  ctx.beginPath();
  ctx.moveTo(-r * 1.2, 0);
  ctx.lineTo(-r * 2.0, -r * 0.6);
  ctx.lineTo(-r * 1.7, 0);
  ctx.lineTo(-r * 2.0, r * 0.6);
  ctx.closePath();
  ctx.fillStyle = '#4a5a66';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.6, r * 0.78, 0, 0, TAU);
  ctx.fillStyle = grad(ctx, -r, r, '#8fa6b4', '#46606e');
  ctx.fill();
  ctx.strokeStyle = '#26333c';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.fillStyle = 'rgba(220, 232, 240, 0.8)';
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(Math.cos(i * 2.3) * r * 0.8, Math.sin(i * 1.7) * r * 0.4, r * 0.06, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#3a4a56';
  ctx.lineWidth = r * 0.14;
  ctx.lineCap = 'round';
  for (const [lx, ly] of [[-r * 0.4, r * 0.6], [r * 0.2, r * 0.6]]) {
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx - r * 0.2, ly + r * 0.6);
    ctx.stroke();
  }
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(r * 0.5, r * 0.5);
  ctx.lineTo(r * 0.4, r * 1.1);
  ctx.stroke();
  eyes(ctx, r, r * 1.1, -r * 0.24, r * 0.12);
  ctx.restore();
}

export function drawGiantGrouper(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 1.4) * 0.02);
  ctx.beginPath();
  ctx.moveTo(-r * 1.4, -r * 0.4);
  ctx.lineTo(-r * 2.2, -r * 0.9);
  ctx.lineTo(-r * 2.2, r * 0.9);
  ctx.lineTo(-r * 1.4, r * 0.4);
  ctx.closePath();
  ctx.fillStyle = '#5a6b4a';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 2.0, r * 1.05, 0, 0, TAU);
  ctx.fillStyle = grad(ctx, -r, r, '#87976a', '#5a6b4a');
  ctx.fill();
  ctx.strokeStyle = '#2f3826';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.fillStyle = 'rgba(50, 60, 40, 0.45)';
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.arc(Math.cos(i * 1.9) * r * 1.0, Math.sin(i * 1.4) * r * 0.5, r * 0.12, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#2f3826';
  ctx.beginPath();
  ctx.moveTo(r * 2.0, r * 0.1);
  ctx.quadraticCurveTo(r * 1.4, r * 0.7, r * 0.4, r * 0.6);
  ctx.quadraticCurveTo(r * 0.6, r * 0.2, r * 2.0, r * 0.1);
  ctx.closePath();
  ctx.fill();
  eyes(ctx, r, r * 1.6, -r * 0.3, r * 0.15);
  ctx.restore();
}

export function drawNapoleonWrasse(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 1.5) * 0.03);
  ctx.beginPath();
  ctx.moveTo(-r * 1.3, 0);
  ctx.lineTo(-r * 2.0, -r * 0.7);
  ctx.lineTo(-r * 2.0, r * 0.7);
  ctx.closePath();
  ctx.fillStyle = '#2f7d6a';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.9, r * 1.0, 0, 0, TAU);
  ctx.fillStyle = grad(ctx, -r, r, '#4fb397', '#2b6d5e');
  ctx.fill();
  ctx.strokeStyle = '#173c34';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.fillStyle = '#2f7d6a';
  ctx.beginPath();
  ctx.moveTo(r * 0.6, -r * 0.9);
  ctx.quadraticCurveTo(r * 0.9, -r * 1.7, r * 1.6, -r * 1.2);
  ctx.quadraticCurveTo(r * 1.2, -r * 0.75, r * 0.6, -r * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#173c34';
  ctx.stroke();
  ctx.strokeStyle = 'rgba(20, 40, 35, 0.5)';
  ctx.lineWidth = r * 0.04;
  for (let i = 0; i < 5; i += 1) {
    const gx = r * (0.8 - i * 0.16);
    ctx.beginPath();
    ctx.moveTo(gx, -r * 0.5);
    ctx.lineTo(gx, r * 0.6);
    ctx.stroke();
  }
  eyes(ctx, r, r * 1.5, -r * 0.28, r * 0.14);
  ctx.restore();
}

export function drawNudibranch(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  const sway = Math.sin(age * 3) * r * 0.1;
  ctx.fillStyle = '#ff8fb0';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.1, r * 1.3, r * 0.45, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c84a78';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = r * 0.1;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i += 1) {
    const rx = -r * 0.4 + i * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(rx, -r * 0.1);
    ctx.lineTo(rx + sway, -r * 0.9);
    ctx.stroke();
  }
  ctx.fillStyle = '#ff8fb0';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(-r * 0.4, side * r * 0.4, r * 0.4, r * 0.16, side * 0.6, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#c84a78';
  ctx.lineWidth = r * 0.05;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.9, 0);
    ctx.quadraticCurveTo(r * 1.3, side * r * 0.3, r * 1.5, side * r * 0.2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawBlueRingedOctopus(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.strokeStyle = '#d9a95f';
  ctx.lineWidth = r * 0.14;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * TAU + Math.sin(age * 3 + i) * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, Math.cos(a) * r * 1.7, Math.sin(a) * r * 1.7);
    ctx.stroke();
  }
  ctx.fillStyle = grad(ctx, -r, r, '#e7c078', '#b98a44');
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.8, r * 0.7, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#8a6428';
  ctx.lineWidth = r * 0.04;
  ctx.stroke();
  ctx.fillStyle = '#3a7bff';
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * TAU;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.38, r * 0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7fd0ff';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.38, r * 0.05, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a7bff';
  }
  ctx.restore();
}

export function drawEagleRay(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 1.6) * 0.03);
  ctx.strokeStyle = '#6f6a52';
  ctx.lineWidth = r * 0.08;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 1.4, 0);
  ctx.quadraticCurveTo(-r * 3.0, Math.sin(age * 2) * r * 0.4, -r * 4.4, Math.sin(age * 2 + 1) * r * 0.5);
  ctx.stroke();
  ctx.fillStyle = '#2a2016';
  ctx.beginPath();
  ctx.moveTo(-r * 2.2, 0);
  ctx.lineTo(-r * 2.7, -r * 0.2);
  ctx.lineTo(-r * 2.6, r * 0.2);
  ctx.closePath();
  ctx.fill();
  const d = r * 2.0;
  ctx.beginPath();
  ctx.moveTo(0, -d);
  ctx.quadraticCurveTo(r * 0.6, 0, 0, d);
  ctx.quadraticCurveTo(-r * 1.2, 0, 0, -d);
  ctx.closePath();
  ctx.fillStyle = grad(ctx, -d, d, '#8a8266', '#5c5540');
  ctx.fill();
  ctx.strokeStyle = '#332f22';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.fillStyle = 'rgba(240, 235, 220, 0.85)';
  for (let i = 0; i < 12; i += 1) {
    ctx.beginPath();
    ctx.arc(Math.cos(i * 2.1) * r * 1.1, Math.sin(i * 1.3) * r * 1.1, r * 0.08, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.1, r * 0.7, 0, 0, TAU);
  ctx.fillStyle = grad(ctx, -r, r, '#9a9274', '#6f6a52');
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.5, side * r * 0.28, r * 0.14, 0, TAU);
    ctx.fillStyle = '#141414';
    ctx.fill();
  }
  ctx.restore();
}

export function drawWhaleShark(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 1.2) * 0.02);
  ctx.beginPath();
  ctx.moveTo(-r * 2.0, 0);
  ctx.lineTo(-r * 3.2, -r * 1.1);
  ctx.lineTo(-r * 2.6, 0);
  ctx.lineTo(-r * 3.2, r * 1.1);
  ctx.closePath();
  ctx.fillStyle = '#43536a';
  ctx.fill();
  const grad3 = grad(ctx, -r * 1.2, r * 1.2, '#5f7d95', '#2f4052');
  ctx.beginPath();
  ctx.moveTo(r * 2.6, 0);
  ctx.quadraticCurveTo(r * 1.0, -r * 1.2, -r * 1.0, -r * 0.9);
  ctx.quadraticCurveTo(-r * 2.2, -r * 0.6, -r * 2.0, 0);
  ctx.quadraticCurveTo(-r * 2.2, r * 0.6, -r * 1.0, r * 0.9);
  ctx.quadraticCurveTo(r * 1.0, r * 1.2, r * 2.6, 0);
  ctx.closePath();
  ctx.fillStyle = grad3;
  ctx.fill();
  ctx.strokeStyle = '#16222e';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.fillStyle = 'rgba(240, 244, 248, 0.85)';
  for (let i = 0; i < 22; i += 1) {
    ctx.beginPath();
    ctx.arc(Math.cos(i * 2.3) * r * 1.6, Math.sin(i * 1.7) * r * 0.7, r * 0.07, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = grad3;
  ctx.beginPath();
  ctx.moveTo(r * 0.8, -r * 1.0);
  ctx.lineTo(-r * 0.2, -r * 1.9);
  ctx.lineTo(r * 0.4, -r * 1.0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#22303f';
  ctx.beginPath();
  ctx.moveTo(r * 2.6, r * 0.06);
  ctx.quadraticCurveTo(r * 1.8, r * 0.34, r * 1.4, r * 0.28);
  ctx.strokeStyle = '#16222e';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 2.05, -r * 0.24, r * 0.1, 0, TAU);
  ctx.fillStyle = '#0c1014';
  ctx.fill();
  ctx.restore();
}

export function drawBobbitWorm(ctx, r, pose = {}) {
  const age = pose.age = pose.age ?? 0;
  ctx.save();
  const wave = (t) => Math.sin(age * 3 + t * 4) * r * 0.5;
  ctx.strokeStyle = '#7a4a6a';
  ctx.lineWidth = r * 0.34;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8;
    const x = -r * 3.0 + t * r * 3.0;
    const y = wave(t) * (1 - t * 0.4);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = r * 0.05;
  for (let i = 1; i < 8; i += 1) {
    const t = i / 8;
    const x = -r * 3.0 + t * r * 3.0;
    const y = wave(t) * (1 - t * 0.4);
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.16);
    ctx.lineTo(x, y + r * 0.16);
    ctx.stroke();
  }
  ctx.strokeStyle = '#5a3350';
  ctx.lineWidth = r * 0.07;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, side * r * 0.16);
    ctx.quadraticCurveTo(r * 0.4, side * r * 0.7, r * 0.9, side * r * 0.5);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a2135';
  ctx.beginPath();
  ctx.ellipse(r * 0.1, 0, r * 0.4, r * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8eef2';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.3, side * r * 0.16);
    ctx.lineTo(r * 0.7, side * r * 0.34);
    ctx.lineTo(r * 0.36, side * r * 0.04);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#f6c85c';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.24, side * r * 0.22, r * 0.05, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawFrilledShark(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 1.4) * 0.03);
  ctx.strokeStyle = '#5a4a44';
  ctx.lineWidth = r * 0.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, 0);
  ctx.quadraticCurveTo(-r * 2.6, Math.sin(age * 1.8) * r * 0.7, -r * 4.0, Math.sin(age * 1.8 + 1) * r * 0.6);
  ctx.stroke();
  ctx.fillStyle = grad(ctx, -r, r, '#7a6258', '#4a3a34');
  ctx.beginPath();
  ctx.moveTo(r * 2.4, 0);
  ctx.quadraticCurveTo(r * 0.8, -r * 0.7, -r * 0.8, -r * 0.5);
  ctx.quadraticCurveTo(-r * 1.4, -r * 0.2, -r * 1.1, 0);
  ctx.quadraticCurveTo(-r * 1.4, r * 0.2, -r * 0.8, r * 0.5);
  ctx.quadraticCurveTo(r * 0.8, r * 0.7, r * 2.4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#241a16';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.fillStyle = '#3a2a24';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.7, side * r * 0.5);
    ctx.lineTo(-r * 0.2, side * r * 1.1);
    ctx.lineTo(r * 0.1, side * r * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(230, 220, 210, 0.6)';
  ctx.lineWidth = r * 0.04;
  for (let i = 0; i < 6; i += 1) {
    const gx = r * (1.3 - i * 0.12);
    ctx.beginPath();
    ctx.moveTo(gx, -r * 0.35);
    ctx.lineTo(gx, r * 0.34);
    ctx.stroke();
  }
  ctx.fillStyle = '#e8eef2';
  for (let i = 0; i < 8; i += 1) {
    const tx = r * (2.1 - i * 0.15);
    ctx.beginPath();
    ctx.moveTo(tx, r * 0.1);
    ctx.lineTo(tx + r * 0.05, r * 0.1);
    ctx.lineTo(tx, r * 0.3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#0c1014';
  ctx.beginPath();
  ctx.arc(r * 2.0, -r * 0.2, r * 0.12, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawSpermWhale(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  ctx.rotate(Math.sin(age * 0.9) * 0.02);
  ctx.beginPath();
  ctx.moveTo(-r * 2.0, 0);
  ctx.lineTo(-r * 3.4, -r * 1.1);
  ctx.lineTo(-r * 2.8, 0);
  ctx.lineTo(-r * 3.4, r * 1.1);
  ctx.closePath();
  ctx.fillStyle = '#3a3f47';
  ctx.fill();
  const grad4 = grad(ctx, -r * 1.2, r * 1.2, '#6a7078', '#343a42');
  ctx.beginPath();
  ctx.moveTo(r * 3.2, r * 0.1);
  ctx.quadraticCurveTo(r * 1.4, -r * 1.0, -r * 0.6, -r * 1.0);
  ctx.quadraticCurveTo(-r * 2.4, -r * 0.9, -r * 2.2, 0);
  ctx.quadraticCurveTo(-r * 2.4, r * 0.9, -r * 0.6, r * 1.0);
  ctx.quadraticCurveTo(r * 1.4, r * 1.0, r * 3.2, r * 0.1);
  ctx.closePath();
  ctx.fillStyle = grad4;
  ctx.fill();
  ctx.strokeStyle = '#1b1f24';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.fillStyle = '#2a2f36';
  ctx.beginPath();
  ctx.moveTo(r * 3.25, r * 0.14);
  ctx.quadraticCurveTo(r * 1.6, -r * 0.5, r * 0.6, -r * 0.35);
  ctx.quadraticCurveTo(r * 1.6, r * 0.1, r * 3.25, r * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 190, 200, 0.35)';
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.arc(-r * 1.4 + i * r * 0.5, r * 0.5, r * 0.07, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#0c1014';
  ctx.beginPath();
  ctx.arc(r * 2.4, -r * 0.05, r * 0.1, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawBobbitQueen(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.save();
  const wave = (t) => Math.sin(age * 2.4 + t * 3.4) * r * 0.7;
  ctx.strokeStyle = '#8a2f5a';
  ctx.lineWidth = r * 0.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 10; i += 1) {
    const t = i / 10;
    const x = -r * 3.4 + t * r * 3.4;
    const y = wave(t) * (1 - t * 0.35);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = r * 0.06;
  for (let i = 1; i < 10; i += 1) {
    const t = i / 10;
    const x = -r * 3.4 + t * r * 3.4;
    const y = wave(t) * (1 - t * 0.35);
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.2);
    ctx.lineTo(x, y + r * 0.2);
    ctx.stroke();
  }
  ctx.strokeStyle = '#5a1e3e';
  ctx.lineWidth = r * 0.08;
  for (let i = 0; i < 5; i += 1) {
    const t = i / 5;
    const x = -r * 2.6 + t * r * 2.6;
    const y = wave(t) * (1 - t * 0.35);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, y + side * r * 0.2);
      ctx.quadraticCurveTo(x - r * 0.3, y + side * r * 0.8, x + r * 0.2, y + side * r * 0.6);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#3a1530';
  ctx.beginPath();
  ctx.ellipse(r * 0.1, 0, r * 0.55, r * 0.4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8eef2';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.4, side * r * 0.2);
    ctx.lineTo(r * 1.0, side * r * 0.5);
    ctx.lineTo(r * 0.5, side * r * 0.04);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ff3b6b';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.28, side * r * 0.28, r * 0.08, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
