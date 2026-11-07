import { TAU } from './math.js';
import { COMPANIONS, EEL_VARIANTS } from '../config.js';
import { drawSharkBody } from '../entities/shark.js';
import { drawStingrayBody } from '../entities/stingray.js';
import { drawSquidBody } from '../entities/squid.js';
import { drawArcticShrimpBody } from '../entities/arcticshrimp.js';
import { drawKelpCrabBody } from '../entities/kelpcrab.js';
import { drawMoonJellyBody } from '../entities/moonjelly.js';
import { drawNautilusBody } from '../entities/nautilus.js';
import { drawMorayBody } from '../entities/eel.js';
import { drawDartEel } from '../entities/darteel.js';
import { drawElectricEel } from '../entities/electriceel.js';
import { drawMegasquid, drawMegasquidEye } from '../entities/megasquid.js';

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
  drawMorayBody(ctx, r * 0.36, buddyPose(age, phase), EEL_VARIANTS[1]);
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

function buddyPose(age, phase) {
  const dance = age * 5 + phase;
  return {
    age,
    speed: 0,
    tailPhase: dance,
    armPhase: dance,
    legPhase: dance,
    pulsePhase: age * 3 + phase,
  };
}

function drawTinyJelly(ctx, r, age, phase) {
  drawMoonJellyBody(ctx, r * 0.5, buddyPose(age, phase));
}

function drawMiniCrab(ctx, r, age, phase) {
  drawKelpCrabBody(ctx, r * 0.5, buddyPose(age, phase));
}

function drawMiniShark(ctx, r, age, phase) {
  drawSharkBody(ctx, r * 0.62, buddyPose(age, phase));
}

function drawMiniStingray(ctx, r, age, phase) {
  drawStingrayBody(ctx, r * 0.66, buddyPose(age, phase));
}

function drawMiniSquid(ctx, r, age, phase) {
  drawSquidBody(ctx, r * 0.6, buddyPose(age, phase));
}

function drawMiniShrimp(ctx, r, age, phase) {
  drawArcticShrimpBody(ctx, r * 0.55, buddyPose(age, phase));
}

function drawMiniNautilus(ctx, r, age, phase) {
  drawNautilusBody(ctx, r * 0.55, buddyPose(age, phase));
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
  drawDartEel(ctx, r * 0.34, { age, direction: 1, wavePhase: phase });
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
  drawElectricEel(ctx, r * 0.42, { age, phase, direction: -1 });
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

function drawMiniMegasquid(ctx, r, age, phase) {
  const scale = r / 220;
  const blinkCycle = (age * 0.6 + phase) % 4;
  const blink = blinkCycle < 0.16 ? Math.sin((Math.PI * blinkCycle) / 0.16) : 0;
  ctx.save();
  ctx.translate(0, -r * 0.55);
  drawMegasquid(ctx, 0, 0, scale, age, 0.7, 1);
  ctx.translate(42 * scale, 56 * scale);
  ctx.scale(scale * 1.15, scale * 1.15);
  drawMegasquidEye(ctx, 0, 0, blink, 1, 0.35, 1);
  ctx.restore();
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

function drawSnowfish(ctx, r, age, phase) {
  const wob = Math.sin(age * 3 + phase) * r * 0.06;
  ctx.fillStyle = '#dff2ff';
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, 0);
  ctx.lineTo(-r * 1.7, -r * 0.6 + wob);
  ctx.lineTo(-r * 1.7, r * 0.6 + wob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(150, 190, 220, 0.7)';
  ctx.lineWidth = r * 0.1;
  ctx.stroke();
  ctx.fillStyle = '#f4fbff';
  ctx.beginPath();
  ctx.arc(-r * 0.1, r * 0.1, r * 0.85, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.15, -r * 0.75, r * 0.62, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(150, 190, 220, 0.35)';
  ctx.beginPath();
  ctx.arc(-r * 0.42, r * 0.42, r * 0.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#10233a';
  ctx.beginPath();
  ctx.arc(0, -r * 0.85, r * 0.08, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.42, -r * 0.85, r * 0.08, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff8f3c';
  ctx.beginPath();
  ctx.moveTo(r * 0.2, -r * 0.7);
  ctx.lineTo(r * 0.78, -r * 0.62);
  ctx.lineTo(r * 0.2, -r * 0.54);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#d33a3a';
  ctx.lineWidth = r * 0.18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.32);
  ctx.lineTo(r * 0.5, -r * 0.32);
  ctx.stroke();
  ctx.fillStyle = '#1d1f2b';
  ctx.fillRect(-r * 0.4, -r * 1.75, r * 0.8, r * 0.5);
  ctx.fillRect(-r * 0.62, -r * 1.28, r * 1.24, r * 0.14);
  ctx.fillStyle = '#d33a3a';
  ctx.fillRect(-r * 0.4, -r * 1.5, r * 0.8, r * 0.14);
}

function drawGhostFish(ctx, r, age, phase) {
  const wob = Math.sin(age * 2.6 + phase) * r * 0.08;
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.22 * Math.sin(age * 3 + phase);
  ctx.fillStyle = 'rgba(220, 240, 255, 0.85)';
  ctx.beginPath();
  ctx.ellipse(0, wob, r * 1.05, r * 0.7, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, wob);
  ctx.quadraticCurveTo(-r * 1.6, wob - r * 0.7, -r * 2.05, wob + r * 0.3);
  ctx.quadraticCurveTo(-r * 1.5, wob + r * 0.6, -r * 0.9, wob);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0b1a2a';
  ctx.beginPath();
  ctx.arc(r * 0.45, wob - r * 0.12, r * 0.12, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 40, 60, 0.8)';
  ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.arc(r * 0.55, wob + r * 0.2, r * 0.18, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawFireworkFish(ctx, r, age, phase) {
  const colors = ['#ffd166', '#ff6b9d', '#63e6ff', '#c6ff7a'];
  ctx.save();
  for (let i = 0; i < 5; i += 1) {
    const t = i / 5;
    ctx.globalAlpha = 0.75 * (1 - t);
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(
      -r * (1.0 + t * 1.3),
      Math.sin(age * 4 + phase + i) * r * 0.42,
      Math.max(0.8, r * (0.15 - t * 0.02)),
      0,
      TAU,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#2b6cff';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.62, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, 0);
  ctx.lineTo(-r * 1.5, -r * 0.5);
  ctx.lineTo(-r * 1.5, r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(r * 0.4, -r * 0.15, r * 0.14, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0b1a2a';
  ctx.beginPath();
  ctx.arc(r * 0.43, -r * 0.15, r * 0.07, 0, TAU);
  ctx.fill();
  ctx.restore();
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
  else if (active.key === 'snowfish') drawSnowfish(ctx, r, entity.age, state.phase);
  else if (active.key === 'ghostfish') drawGhostFish(ctx, r, entity.age, state.phase);
  else if (active.key === 'fireworkfish') drawFireworkFish(ctx, r, entity.age, state.phase);
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
  else if (active.key === 'megasquid') drawMiniMegasquid(ctx, r, entity.age, state.phase);
  ctx.restore();
}
