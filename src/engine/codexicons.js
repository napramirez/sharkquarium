import { TAU } from './math.js';
import { activeSkin, setActiveSkin } from './skin.js';
import { drawSharkBody } from '../entities/shark.js';
import { drawStingrayBody } from '../entities/stingray.js';
import { drawAnglerBody } from '../entities/anglerfish.js';
import { drawSquidBody } from '../entities/squid.js';
import { drawArcticShrimpBody } from '../entities/arcticshrimp.js';
import { drawKelpCrabBody } from '../entities/kelpcrab.js';
import { drawMoonJellyBody } from '../entities/moonjelly.js';
import { drawNautilusBody } from '../entities/nautilus.js';
import { drawMantaBody } from '../entities/mantaray.js';
import { drawHermitBody } from '../entities/hermitcrab.js';
import { drawDolphinBody } from '../entities/dolphin.js';
import { drawSeaTurtleBody } from '../entities/seaturtle.js';
import { drawMorayBody } from '../entities/eel.js';
import { drawOarfishBody } from '../entities/oarfish.js';
import { drawCuttlefishGlyph } from '../entities/cuttlefishshape.js';
import { drawHatchetFish, drawLoosejaw } from '../entities/deepfish.js';
import { drawGoblinShark } from '../entities/goblinshark.js';
import { drawIsopod } from '../entities/isopod.js';
import { drawBlackSwallower } from '../entities/blackswallower.js';
import {
  drawArcherfish,
  drawNeedlefish,
  drawSawfish,
  drawMudskipper,
  drawFrogfish,
  drawOceanSunfish,
  drawSeaLion,
} from '../entities/realfish.js';

function drawHagfishIcon(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#c9bfc6';
  ctx.lineWidth = r * 0.42;
  ctx.beginPath();
  ctx.moveTo(-r * 1.2, r * 0.25);
  ctx.bezierCurveTo(-r * 0.45, -r * 0.95, r * 0.45, r * 0.95, r * 1.25, -r * 0.25);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(150, 140, 148, 0.6)';
  ctx.lineWidth = r * 0.12;
  ctx.stroke();
  ctx.fillStyle = '#5a5259';
  ctx.beginPath();
  ctx.arc(r * 1.25, -r * 0.25, r * 0.16, 0, TAU);
  ctx.fill();
  ctx.fillStyle = `rgba(200, 190, 198, ${0.5 + 0.3 * Math.sin(age * 2)})`;
  ctx.beginPath();
  ctx.arc(-r * 1.2, r * 0.25, r * 0.14, 0, TAU);
  ctx.fill();
}

function drawLanternfishIcon(ctx, r, pose = {}) {
  const age = pose.age ?? 0;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.0, r * 0.5, 0, 0, TAU);
  ctx.fillStyle = '#c2dae9';
  ctx.fill();
  ctx.strokeStyle = '#4a6274';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, 0);
  ctx.lineTo(-r * 1.5, -r * 0.45);
  ctx.lineTo(-r * 1.35, 0);
  ctx.lineTo(-r * 1.5, r * 0.45);
  ctx.closePath();
  ctx.fillStyle = '#a9c2d4';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#12263a';
  ctx.beginPath();
  ctx.arc(r * 0.45, -r * 0.08, r * 0.14, 0, TAU);
  ctx.fill();
  ctx.fillStyle = `rgba(150, 235, 255, ${0.5 + 0.4 * Math.sin(age * 4)})`;
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    ctx.beginPath();
    ctx.arc(r * (0.4 - t * 1.1), r * 0.42, r * 0.09, 0, TAU);
    ctx.fill();
  }
}

function drawGenericFishIcon(ctx, r, pose = {}) {
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.0, r * 0.5, 0, 0, TAU);
  ctx.fillStyle = 'rgba(150, 200, 220, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(30, 60, 80, 0.6)';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, 0);
  ctx.lineTo(-r * 1.5, -r * 0.45);
  ctx.lineTo(-r * 1.5, r * 0.45);
  ctx.closePath();
  ctx.fillStyle = 'rgba(120, 170, 195, 0.85)';
  ctx.fill();
  ctx.fillStyle = '#12263a';
  ctx.beginPath();
  ctx.arc(r * 0.45, -r * 0.05, r * 0.12, 0, TAU);
  ctx.fill();
}

function drawCuttlefishIcon(ctx, r, pose) {
  drawCuttlefishGlyph(ctx, r, pose, '#c0392b');
}

const RULES = [
  [/LOOSEJAW/, drawLoosejaw, 16, 16],
  [/GOBLIN/, drawGoblinShark, 20, 0],
  [/ARCHERFISH/, drawArcherfish, 26, 0],
  [/NEEDLEFISH/, drawNeedlefish, 22, 0],
  [/SAWFISH/, drawSawfish, 24, 0],
  [/MUDSKIPPER/, drawMudskipper, 26, 0],
  [/FROGFISH/, drawFrogfish, 26, 0],
  [/SUNFISH/, drawOceanSunfish, 24, 0],
  [/SEA LION/, drawSeaLion, 26, 0],
  [/HATCHETFISH|TWILIGHT/, drawHatchetFish, 26, 0],
  [/OARFISH/, drawOarfishBody, 13, 0],
  [/MEGASQUID|SQUID/, drawSquidBody, 28, 0],
  [/HAGFISH/, drawHagfishIcon, 26, 0],
  [/ANGLERFISH|DEEP SEA/, drawAnglerBody, 24, 0],
  [/ISOPOD/, drawIsopod, 26, 0],
  [/SWALLOWER/, drawBlackSwallower, 22, 0],
  [/LANTERNFISH/, drawLanternfishIcon, 24, 0],
  [/MORAY|EEL/, drawMorayBody, 22, 0],
  [/STINGRAY/, drawStingrayBody, 32, 0],
  [/MANTA/, drawMantaBody, 34, 0],
  [/CUTTLEFISH|COASTAL/, drawCuttlefishIcon, 28, 0],
  [/NAUTILUS/, drawNautilusBody, 30, 0],
  [/HERMIT/, drawHermitBody, 26, 0],
  [/CRAB/, drawKelpCrabBody, 26, 0],
  [/SHRIMP|ARCTIC/, drawArcticShrimpBody, 24, 0],
  [/JELLY/, drawMoonJellyBody, 30, 0],
  [/DOLPHIN/, drawDolphinBody, 28, 0],
  [/TURTLE/, drawSeaTurtleBody, 32, 0],
  [/SHARK|REEF|WHALE/, drawSharkBody, 28, 0],
];

function ruleFor(name) {
  const key = String(name).toUpperCase();
  for (const rule of RULES) {
    if (rule[0].test(key)) return rule;
  }
  return null;
}

export function isCreatureName(name) {
  return ruleFor(name) !== null;
}

export function creatureDraw(name) {
  const rule = ruleFor(name);
  return {
    fn: rule ? rule[1] : drawGenericFishIcon,
    base: rule ? rule[2] : 26,
    offset: rule ? rule[3] : 0,
  };
}

export function drawCreatureMascot(ctx, name, radius, pose = {}) {
  const { fn } = creatureDraw(name);
  fn(ctx, radius, pose);
}

export function drawCreatureIcon(ctx, name, cx, cy, size, time = 0) {
  const rule = ruleFor(name);
  const fn = rule ? rule[1] : drawGenericFishIcon;
  const base = rule ? rule[2] : 26;
  const offset = rule ? rule[3] : 0;
  const scale = size / 150;
  const r = base * scale;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.5, 0, TAU);
  const bg = ctx.createRadialGradient(cx, cy - size * 0.12, size * 0.08, cx, cy, size * 0.5);
  bg.addColorStop(0, 'rgba(20, 52, 78, 0.95)');
  bg.addColorStop(1, 'rgba(6, 22, 36, 0.95)');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.clip();

  const prevSkin = activeSkin();
  setActiveSkin(null);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.translate(cx + offset * scale, cy);
  fn(ctx, r, {
    age: time,
    armPhase: time * 3,
    legPhase: time * 4,
    tailPhase: time * 2,
    pulsePhase: time * 3,
    speed: 0,
    flap: Math.sin(time * 2) * 0.6,
    natural: true,
    raw: true,
  });
  ctx.restore();
  setActiveSkin(prevSkin);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.5, 0, TAU);
  ctx.strokeStyle = 'rgba(207, 239, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
