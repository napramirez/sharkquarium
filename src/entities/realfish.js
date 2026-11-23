import { TAU } from '../engine/math.js';
import { drawStingrayBody } from './stingray.js';
import { drawSharkTail } from './shark.js';

export function drawArcherfish(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const r = radius;
  const back = '#7d8f52';
  const body = '#cdd6d8';
  const belly = '#f2f5f5';
  const line = '#3a4448';

  ctx.save();
  ctx.rotate(Math.sin(age * 3) * 0.04);

  ctx.beginPath();
  ctx.moveTo(-r * 0.9, 0);
  ctx.lineTo(-r * 1.7, -r * 0.7);
  ctx.lineTo(-r * 1.4, 0);
  ctx.lineTo(-r * 1.7, r * 0.7);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, back);
  grad.addColorStop(0.5, body);
  grad.addColorStop(1, belly);
  ctx.beginPath();
  ctx.moveTo(r * 1.35, -r * 0.2);
  ctx.quadraticCurveTo(r * 0.4, -r * 1.15, -r * 0.5, -r * 0.6);
  ctx.quadraticCurveTo(-r * 1.1, -r * 0.2, -r * 1.05, 0);
  ctx.quadraticCurveTo(-r * 1.1, r * 0.35, -r * 0.4, r * 0.6);
  ctx.quadraticCurveTo(r * 0.5, r * 0.9, r * 1.35, -r * 0.2);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.06;
  ctx.stroke();

  ctx.fillStyle = 'rgba(40, 50, 40, 0.5)';
  for (const spot of [[-0.2, -0.2, 0.16], [0.3, -0.35, 0.12], [0.15, 0.25, 0.14], [-0.5, 0.05, 0.1]]) {
    ctx.beginPath();
    ctx.arc(r * spot[0], r * spot[1], r * spot[2], 0, TAU);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(r * 0.9, -r * 0.55);
  ctx.quadraticCurveTo(r * 0.2, -r * 1.15, -r * 0.3, -r * 0.6);
  ctx.closePath();
  ctx.fillStyle = back;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(r * 1.35, -r * 0.15);
  ctx.quadraticCurveTo(r * 1.75, -r * 0.05, r * 1.55, r * 0.18);
  ctx.quadraticCurveTo(r * 1.3, r * 0.1, r * 1.35, -r * 0.15);
  ctx.closePath();
  ctx.fillStyle = back;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.04;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(r * 0.85, -r * 0.28, r * 0.16, 0, TAU);
  ctx.fillStyle = '#f7f1d8';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.87, -r * 0.28, r * 0.09, 0, TAU);
  ctx.fillStyle = '#141414';
  ctx.fill();

  ctx.restore();
}

export function drawNeedlefish(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const r = radius;
  const body = '#7fae8b';
  const belly = '#e7f2ea';
  const line = '#2c4a3a';

  ctx.save();
  ctx.rotate(Math.sin(age * 2 + (pose.phase ?? 0)) * 0.05);

  ctx.beginPath();
  ctx.moveTo(-r * 2.4, 0);
  ctx.lineTo(-r * 3.0, -r * 0.4);
  ctx.lineTo(-r * 2.8, 0);
  ctx.lineTo(-r * 3.0, r * 0.4);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.04;
  ctx.stroke();

  const grad = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.3);
  grad.addColorStop(0, body);
  grad.addColorStop(1, belly);
  ctx.beginPath();
  ctx.moveTo(r * 1.0, -r * 0.02);
  ctx.quadraticCurveTo(r * 0.9, -r * 0.26, -r * 0.2, -r * 0.26);
  ctx.quadraticCurveTo(-r * 2.2, -r * 0.24, -r * 2.5, 0);
  ctx.quadraticCurveTo(-r * 2.2, r * 0.24, -r * 0.2, r * 0.26);
  ctx.quadraticCurveTo(r * 0.9, r * 0.2, r * 1.0, -r * 0.02);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(r * 1.0, -r * 0.02);
  ctx.lineTo(r * 2.6, -r * 0.02);
  ctx.strokeStyle = body;
  ctx.lineWidth = r * 0.12;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.04;
  ctx.stroke();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(r * 1.1, r * 0.1);
  ctx.lineTo(r * 1.5, r * 0.6);
  ctx.lineTo(r * 0.9, r * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(r * 0.55, -r * 0.08, r * 0.2, 0, TAU);
  ctx.fillStyle = '#f7f1d8';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.58, -r * 0.08, r * 0.1, 0, TAU);
  ctx.fillStyle = '#141414';
  ctx.fill();

  ctx.restore();
}

export function drawThresher(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const r = radius;
  const bodyFill = '#9aa6b0';
  const bellyFill = '#e2e8ec';
  const finFill = '#77828c';
  const outline = 'rgba(44, 52, 60, 0.6)';
  const tail = pose.tail ?? 0;
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(r * 2.1, 0);
    ctx.quadraticCurveTo(r * 0.4, -r * 0.7, -r * 1.2, -r * 0.42);
    ctx.quadraticCurveTo(-r * 1.9, -r * 0.2, -r * 2.2, 0);
    ctx.quadraticCurveTo(-r * 1.9, r * 0.2, -r * 1.2, r * 0.42);
    ctx.quadraticCurveTo(r * 0.4, r * 0.7, r * 2.1, 0);
    ctx.closePath();
  };

  ctx.save();
  ctx.rotate(Math.sin(age * 1.1) * 0.03);

  ctx.save();
  ctx.translate(-r * 2.2, 0);
  ctx.rotate(-0.15 - tail * 1.0);
  drawSharkTail(ctx, r, finFill, finFill, bodyFill, 1, {
    mid: '#6f7a84',
    dark: '#4b555e',
    deep: '#2f363c',
    triangle: true,
  });
  ctx.restore();

  bodyPath();
  ctx.fillStyle = bodyFill;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = bellyFill;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.42, r * 2.05, r * 0.6, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  bodyPath();
  ctx.strokeStyle = outline;
  ctx.lineWidth = r * 0.06;
  ctx.stroke();

  ctx.fillStyle = finFill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = r * 0.05;

  ctx.beginPath();
  ctx.moveTo(r * 0.55, -r * 0.6);
  ctx.lineTo(-r * 0.35, -r * 0.68);
  ctx.lineTo(r * 0.0, -r * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(r * 0.5, r * 0.55);
  ctx.lineTo(-r * 0.3, r * 0.62);
  ctx.lineTo(-r * 0.5, r * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.5);
  ctx.lineTo(-r * 1.0, r * 0.44);
  ctx.lineTo(-r * 1.2, r * 1.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r * 1.6, -r * 0.38);
  ctx.lineTo(-r * 2.0, -r * 1.1);
  ctx.lineTo(-r * 1.2, -r * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(60, 70, 80, 0.45)';
  ctx.lineWidth = r * 0.04;
  for (let i = 0; i < 6; i += 1) {
    const gx = r * (0.5 - i * 0.12);
    ctx.beginPath();
    ctx.moveTo(gx, -r * 0.28);
    ctx.lineTo(gx, r * 0.18);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(r * 1.4, -r * 0.18, r * 0.15, 0, TAU);
  ctx.fillStyle = '#0c0f12';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(r * 2.1, r * 0.04);
  ctx.quadraticCurveTo(r * 1.4, r * 0.4, r * 0.5, r * 0.24);
  ctx.strokeStyle = 'rgba(40, 48, 56, 0.85)';
  ctx.lineWidth = r * 0.08;
  ctx.stroke();
  ctx.fillStyle = '#e8e2d2';
  for (let i = 0; i < 5; i += 1) {
    const tx = r * (1.0 + i * 0.2);
    ctx.beginPath();
    ctx.moveTo(tx - r * 0.05, r * 0.06);
    ctx.lineTo(tx + r * 0.05, r * 0.06);
    ctx.lineTo(tx, r * 0.26);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawSardine(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const r = radius;
  const body = '#b9c6cf';

  ctx.save();
  ctx.rotate(Math.sin(age * 6) * 0.06);
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, 0);
  ctx.lineTo(-r * 1.5, -r * 0.5);
  ctx.lineTo(-r * 1.5, r * 0.5);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.05, r * 0.45, 0, 0, TAU);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = '#5a6b78';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(r * 0.5, -r * 0.1, r * 0.14, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(r * 0.53, -r * 0.1, r * 0.07, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(150, 235, 255, 0.7)';
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.arc(r * (0.4 - i * 0.3), r * 0.38, r * 0.08, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSawfish(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const r = radius;
  const body = '#b0a58f';
  const belly = '#efe9dc';
  const line = '#5c523c';
  const fin = '#8a7f68';

  ctx.save();
  ctx.rotate(Math.sin(age * 2) * 0.03);

  ctx.save();
  ctx.translate(-r * 1.9, 0);
  ctx.rotate(Math.sin(age * 2 + 0.6) * 0.06);
  drawSharkTail(ctx, r, fin, '#5c5240', body, 7);
  ctx.restore();

  const sawBase = r * 1.15;
  const sawLen = r * 3.1;
  ctx.save();
  ctx.translate(sawBase, 0);
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.16);
  ctx.lineTo(sawLen, -r * 0.06);
  ctx.lineTo(sawLen, r * 0.06);
  ctx.lineTo(0, r * 0.16);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.fillStyle = belly;
  for (let i = 0; i < 10; i += 1) {
    const tx = r * (0.35 + i * 0.22);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(tx - r * 0.045, side * r * 0.055);
      ctx.lineTo(tx + r * 0.045, side * r * 0.055);
      ctx.lineTo(tx, side * r * 0.2);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.save();
  ctx.scale(1, 0.55);
  drawStingrayBody(ctx, radius, {
    age,
    bodyColor: body,
    raw: true,
    tail: false,
    noEyes: true,
    spotColor: 'rgba(70, 62, 50, 0.28)',
  });
  ctx.restore();

  ctx.fillStyle = fin;
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.05;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, side * r * 0.6);
    ctx.lineTo(-r * 2.0, side * r * 0.02);
    ctx.lineTo(-r * 1.3, side * r * 1.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 1.15, side * r * 0.17, r * 0.08, 0, TAU);
    ctx.fillStyle = '#101010';
    ctx.fill();
  }

  ctx.restore();
}

export function drawBullShark(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const r = radius;
  const body = '#a9a49b';
  const belly = '#f0ece3';
  const fin = '#8a857c';
  const line = '#4a453d';

  ctx.save();
  ctx.rotate(Math.sin(age * 1.8) * 0.03);

  ctx.beginPath();
  ctx.moveTo(-r * 1.5, 0);
  ctx.lineTo(-r * 2.2, -r * 0.85);
  ctx.quadraticCurveTo(-r * 1.6, -r * 0.2, -r * 1.5, 0);
  ctx.lineTo(-r * 2.2, r * 0.8);
  ctx.quadraticCurveTo(-r * 1.6, r * 0.2, -r * 1.5, 0);
  ctx.closePath();
  ctx.fillStyle = fin;
  ctx.fill();

  const grad = ctx.createLinearGradient(0, -r * 0.7, 0, r * 0.7);
  grad.addColorStop(0, body);
  grad.addColorStop(1, belly);
  ctx.beginPath();
  ctx.moveTo(r * 2.0, 0);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.75, -r * 0.7, -r * 0.5);
  ctx.quadraticCurveTo(-r * 1.5, -r * 0.25, -r * 1.5, 0);
  ctx.quadraticCurveTo(-r * 1.5, r * 0.25, -r * 0.7, r * 0.5);
  ctx.quadraticCurveTo(r * 0.6, r * 0.8, r * 2.0, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.06;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(r * 1.85, 0);
  ctx.quadraticCurveTo(r * 0.4, r * 0.6, -r * 0.6, r * 0.45);
  ctx.quadraticCurveTo(-r * 1.2, r * 0.25, -r * 1.4, 0);
  ctx.closePath();
  ctx.fillStyle = belly;
  ctx.fill();

  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(r * 0.4, -r * 0.6);
  ctx.lineTo(-r * 0.5, -r * 1.05);
  ctx.lineTo(-r * 0.1, -r * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(r * 0.2, r * 0.42);
  ctx.lineTo(-r * 0.6, r * 1.4);
  ctx.lineTo(-r * 0.1, r * 0.85);
  ctx.closePath();
  ctx.fillStyle = fin;
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(50,46,40,0.4)';
  ctx.lineWidth = r * 0.035;
  for (let i = 0; i < 5; i += 1) {
    const gx = r * (0.7 - i * 0.13);
    ctx.beginPath();
    ctx.moveTo(gx, -r * 0.34);
    ctx.lineTo(gx, r * 0.24);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(r * 1.5, -r * 0.2, r * 0.1, 0, TAU);
  ctx.fillStyle = '#141414';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(r * 2.0, r * 0.04);
  ctx.quadraticCurveTo(r * 1.6, r * 0.34, r * 1.2, r * 0.3);
  ctx.strokeStyle = 'rgba(50,44,38,0.7)';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();

  ctx.restore();
}

export function drawMudskipper(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const r = radius;
  const body = '#9a7f5c';
  const belly = '#d8c39c';
  const line = '#4a3a22';

  ctx.save();

  ctx.strokeStyle = body;
  ctx.lineWidth = r * 0.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const t = (i - 1) * 0.4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, r * 0.4);
    ctx.lineTo(-r * 0.4 - r * 0.2, r * 0.9 + r * 0.1 * Math.sin(age * 6 + i));
    ctx.stroke();
  }

  const grad = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.6);
  grad.addColorStop(0, body);
  grad.addColorStop(1, belly);
  ctx.beginPath();
  ctx.moveTo(r * 0.6, -r * 0.25);
  ctx.quadraticCurveTo(r * 0.9, -r * 0.45, r * 1.1, -r * 0.2);
  ctx.quadraticCurveTo(r * 1.0, r * 0.35, r * 0.3, r * 0.5);
  ctx.quadraticCurveTo(-r * 0.6, r * 0.6, -r * 1.0, r * 0.2);
  ctx.quadraticCurveTo(-r * 1.2, -r * 0.1, -r * 0.6, -r * 0.4);
  ctx.quadraticCurveTo(r * 0.1, -r * 0.6, r * 0.6, -r * 0.25);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r * 0.9, 0);
  ctx.lineTo(-r * 1.5, -r * 0.4);
  ctx.lineTo(-r * 1.4, 0);
  ctx.lineTo(-r * 1.5, r * 0.4);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.stroke();

  ctx.fillStyle = body;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.5, side * r * 0.3);
    ctx.quadraticCurveTo(r * 1.2, side * r * 0.7, r * 1.0, r * 0.75);
    ctx.quadraticCurveTo(r * 0.6, side * r * 0.6, r * 0.4, side * r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.stroke();
  }

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.6, side * r * 0.28, r * 0.22, 0, TAU);
    ctx.fillStyle = '#f0e6cf';
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = r * 0.04;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.62, side * r * 0.28, r * 0.11, 0, TAU);
    ctx.fillStyle = '#141414';
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(50, 40, 24, 0.5)';
  for (const spot of [[-0.3, -0.1], [0, 0.05], [-0.5, 0.2]]) {
    ctx.beginPath();
    ctx.arc(r * spot[0], r * spot[1], r * 0.08, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

export function drawFrogfish(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const r = radius;
  const body = '#c67b52';
  const dark = '#8a4f30';
  const belly = '#e6c4a8';
  const line = '#5a3320';
  const lure = pose.lure ?? 0;

  ctx.save();

  ctx.beginPath();
  if (lure > 0.05) {
    ctx.moveTo(r * 0.5, -r * 0.5);
    ctx.quadraticCurveTo(r * 0.9, -r * (1.0 + lure * 0.6), r * 1.3, -r * (0.9 + lure * 0.7));
    ctx.strokeStyle = dark;
    ctx.lineWidth = r * 0.09;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 1.3, -r * (0.9 + lure * 0.7), r * 0.2, 0, TAU);
    ctx.fillStyle = '#f6e28a';
    ctx.fill();
  }

  const grad = ctx.createLinearGradient(0, -r * 0.7, 0, r * 0.7);
  grad.addColorStop(0, body);
  grad.addColorStop(1, belly);
  ctx.beginPath();
  ctx.moveTo(r * 1.1, -r * 0.1);
  ctx.quadraticCurveTo(r * 1.0, -r * 0.7, r * 0.1, -r * 0.75);
  ctx.quadraticCurveTo(-r * 0.9, -r * 0.7, -r * 1.15, 0);
  ctx.quadraticCurveTo(-r * 0.9, r * 0.7, r * 0.1, r * 0.72);
  ctx.quadraticCurveTo(r * 1.0, r * 0.7, r * 1.1, -r * 0.1);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  ctx.fillStyle = 'rgba(90, 50, 30, 0.5)';
  for (const spot of [[-0.4, -0.2, 0.18], [0, -0.35, 0.14], [0.4, 0.1, 0.16], [-0.5, 0.3, 0.12], [0.2, 0.4, 0.1]]) {
    ctx.beginPath();
    ctx.arc(r * spot[0], r * spot[1], r * spot[2], 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = dark;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, side * r * 0.4);
    ctx.quadraticCurveTo(-r * 1.3, side * r * 0.7, -r * 0.7, side * r * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(r * 1.05, r * 0.2);
  ctx.quadraticCurveTo(r * 1.35, r * 0.5, r * 0.95, r * 0.6);
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.08;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(r * 0.55, -r * 0.32, r * 0.14, 0, TAU);
  ctx.fillStyle = '#f0e6cf';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.58, -r * 0.32, r * 0.07, 0, TAU);
  ctx.fillStyle = '#141414';
  ctx.fill();

  ctx.restore();
}

export function drawOceanSunfish(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const r = radius;
  const body = '#8f9aa3';
  const belly = '#d7dde0';
  const fin = '#76828c';
  const line = '#39434a';

  ctx.save();
  ctx.rotate(Math.sin(age * 1.4) * 0.04);

  const grad = ctx.createLinearGradient(0, -r * 1.3, 0, r * 1.3);
  grad.addColorStop(0, body);
  grad.addColorStop(0.55, body);
  grad.addColorStop(1, belly);

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, 0);
    ctx.quadraticCurveTo(-r * 1.1, side * r * 1.9, -r * 1.9, side * r * 2.3);
    ctx.quadraticCurveTo(-r * 1.7, side * r * 1.0, -r * 0.9, 0);
    ctx.closePath();
    ctx.fillStyle = fin;
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = r * 0.06;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(r * 1.1, 0);
  ctx.bezierCurveTo(r * 1.2, -r * 1.2, r * 0.2, -r * 1.6, -r * 0.5, -r * 1.3);
  ctx.bezierCurveTo(-r * 1.1, -r * 1.0, -r * 1.1, r * 1.0, -r * 0.5, r * 1.3);
  ctx.bezierCurveTo(r * 0.2, r * 1.6, r * 1.2, r * 1.2, r * 1.1, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r * 0.85, -r * 1.0);
  ctx.quadraticCurveTo(-r * 1.35, 0, -r * 0.85, r * 1.0);
  ctx.quadraticCurveTo(-r * 1.15, 0, -r * 0.85, -r * 1.0);
  ctx.closePath();
  ctx.fillStyle = fin;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(r * 0.35, -r * 0.15, r * 0.3, r * 0.34, 0, 0, TAU);
  ctx.fillStyle = '#f0efe6';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.38, -r * 0.15, r * 0.14, 0, TAU);
  ctx.fillStyle = '#141414';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(r * 1.05, r * 0.28);
  ctx.quadraticCurveTo(r * 1.25, r * 0.34, r * 1.2, r * 0.42);
  ctx.quadraticCurveTo(r * 1.0, r * 0.4, r * 1.05, r * 0.28);
  ctx.closePath();
  ctx.fillStyle = belly;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.04;
  ctx.stroke();

  ctx.restore();
}

export function drawSeaLion(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const r = radius;
  const body = '#7a5f43';
  const belly = '#b39878';
  const line = '#3f3020';

  ctx.save();
  ctx.rotate(Math.sin(age * 2.2) * 0.03);

  ctx.beginPath();
  ctx.moveTo(-r * 1.4, 0);
  ctx.lineTo(-r * 2.1, -r * 0.6);
  ctx.lineTo(-r * 2.1, r * 0.6);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  const grad = ctx.createLinearGradient(0, -r * 0.8, 0, r * 0.8);
  grad.addColorStop(0, body);
  grad.addColorStop(1, belly);
  ctx.beginPath();
  ctx.moveTo(r * 1.8, -r * 0.1);
  ctx.quadraticCurveTo(r * 1.2, -r * 0.7, r * 0.3, -r * 0.7);
  ctx.quadraticCurveTo(-r * 0.8, -r * 0.7, -r * 1.5, -r * 0.15);
  ctx.quadraticCurveTo(-r * 1.6, 0, -r * 1.5, r * 0.2);
  ctx.quadraticCurveTo(-r * 0.7, r * 0.7, r * 0.3, r * 0.6);
  ctx.quadraticCurveTo(r * 1.2, r * 0.55, r * 1.8, -r * 0.1);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.06;
  ctx.stroke();

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(r * 0.1, side * r * 0.55, r * 0.5, r * 0.2, side * 0.5, 0, TAU);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = r * 0.04;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(r * 1.6, -r * 0.2, r * 0.1, 0, TAU);
  ctx.fillStyle = '#141414';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(r * 1.5, r * 0.15);
  ctx.lineTo(r * 2.0, r * 0.25);
  ctx.strokeStyle = '#2f2418';
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(r * 0.2, -r * 0.75);
  ctx.lineTo(-r * 0.2, -r * 1.05);
  ctx.lineTo(r * 0.4, -r * 0.7);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
