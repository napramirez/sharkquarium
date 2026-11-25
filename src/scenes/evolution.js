import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { Shark } from '../entities/shark.js';
import { drawSharkBody } from '../entities/shark.js';
import { drawStingrayBody } from '../entities/stingray.js';
import { drawArcticShrimpBody } from '../entities/arcticshrimp.js';
import { drawKelpCrabBody } from '../entities/kelpcrab.js';
import { drawMoonJellyBody } from '../entities/moonjelly.js';
import { drawLoosejawHead } from '../entities/deepfish.js';
import { drawOctopusBody } from '../entities/octopus.js';
import { drawSquidBody } from '../entities/squid.js';
import { drawCuttlefishGlyph } from '../entities/cuttlefishshape.js';
import { drawHatchetFish, drawLoosejaw } from '../entities/deepfish.js';
import { drawJapaneseSpiderCrab } from '../entities/spidercrab.js';
import { drawAnglerBody } from '../entities/anglerfish.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import { CONTROLS, COLORS, EVOLUTION, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;

function drawCookiecutter(ctx, r, age) {
  ctx.save();
  ctx.rotate(Math.sin(age * 2) * 0.05);
  ctx.beginPath();
  ctx.moveTo(-r * 1.4, 0);
  ctx.lineTo(-r * 2.1, -r * 0.6);
  ctx.lineTo(-r * 2.1, r * 0.6);
  ctx.closePath();
  ctx.fillStyle = '#5b5148';
  ctx.fill();
  const grad = ctx.createLinearGradient(0, -r * 0.6, 0, r * 0.6);
  grad.addColorStop(0, '#6b6157');
  grad.addColorStop(1, '#3a332c');
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.5, r * 0.62, 0, 0, TAU);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.fillStyle = 'rgba(150, 235, 255, 0.7)';
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(r * (0.6 - i * 0.5), r * 0.34, r * 0.1, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(r * 1.0, -r * 0.15, r * 0.12, 0, TAU);
  ctx.fillStyle = '#f4fbff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 1.03, -r * 0.15, r * 0.06, 0, TAU);
  ctx.fillStyle = '#10233a';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 1.5, r * 0.05, r * 0.28, 0, TAU);
  ctx.strokeStyle = '#c9b8a6';
  ctx.lineWidth = r * 0.1;
  ctx.stroke();
  ctx.restore();
}

function drawHammerhead(ctx, r, age) {
  ctx.save();
  ctx.rotate(Math.sin(age * 1.8) * 0.03);
  ctx.save();
  ctx.translate(-r * 1.6, 0);
  ctx.beginPath();
  ctx.moveTo(r * 0.3, 0);
  ctx.lineTo(-r * 0.9, -r * 0.9);
  ctx.lineTo(-r * 0.5, 0);
  ctx.lineTo(-r * 0.9, r * 0.9);
  ctx.closePath();
  ctx.fillStyle = '#7f8b93';
  ctx.fill();
  ctx.restore();
  const grad = ctx.createLinearGradient(0, -r * 0.6, 0, r * 0.6);
  grad.addColorStop(0, '#8f9ba3');
  grad.addColorStop(1, '#eef3f5');
  ctx.beginPath();
  ctx.moveTo(r * 1.3, -r * 0.1);
  ctx.quadraticCurveTo(r * 0.4, -r * 0.7, -r * 0.9, -r * 0.42);
  ctx.quadraticCurveTo(-r * 1.6, -r * 0.2, -r * 1.6, 0);
  ctx.quadraticCurveTo(-r * 1.6, r * 0.2, -r * 0.9, r * 0.42);
  ctx.quadraticCurveTo(r * 0.4, r * 0.7, r * 1.3, -r * 0.1);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,50,58,0.5)';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.fillStyle = '#7f8b93';
  ctx.beginPath();
  ctx.moveTo(r * 0.5, -r * 0.55);
  ctx.lineTo(-r * 0.2, -r * 0.95);
  ctx.lineTo(r * 0.1, -r * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.translate(r * 1.2, -r * 0.08);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.12, r * 0.55, 0, 0, TAU);
  ctx.fillStyle = '#7f8b93';
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(0, side * r * 0.5, r * 0.12, 0, TAU);
    ctx.fillStyle = '#141414';
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

function drawCopepod(ctx, r, age) {
  ctx.save();
  ctx.strokeStyle = '#8fb0c0';
  ctx.lineWidth = r * 0.12;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.6, side * r * 0.1);
    ctx.lineTo(r * 1.6, side * r * 0.5 + Math.sin(age * 6 + side) * r * 0.2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(r * 0.1, 0, r * 0.9, r * 0.55, -0.2, 0, TAU);
  ctx.fillStyle = 'rgba(180, 210, 220, 0.85)';
  ctx.fill();
  ctx.strokeStyle = '#5a7a8a';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 0.7, -r * 0.12, r * 0.16, 0, TAU);
  ctx.fillStyle = '#141414';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, 0);
  ctx.lineTo(-r * 1.3, -r * 0.4);
  ctx.lineTo(-r * 1.3, r * 0.4);
  ctx.closePath();
  ctx.fillStyle = 'rgba(180, 210, 220, 0.7)';
  ctx.fill();
  ctx.restore();
}

function drawKrill(ctx, r, age) {
  ctx.save();
  ctx.rotate(Math.sin(age * 5) * 0.1);
  for (let i = 0; i < 4; i += 1) {
    ctx.strokeStyle = 'rgba(170, 200, 210, 0.8)';
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(-r * 0.2 + i * r * 0.2, r * 0.3);
    ctx.lineTo(-r * 0.3 + i * r * 0.2, r * 0.8);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-r * 1.2, 0);
  ctx.quadraticCurveTo(0, -r * 0.7, r * 0.9, -r * 0.05);
  ctx.quadraticCurveTo(0, r * 0.6, -r * 1.2, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(220, 180, 190, 0.9)';
  ctx.fill();
  ctx.strokeStyle = '#7a5a62';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 0.6, -r * 0.05, r * 0.2, 0, TAU);
  ctx.fillStyle = '#141414';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.9, 0);
  ctx.lineTo(r * 1.6, -r * 0.5);
  ctx.moveTo(r * 0.9, 0);
  ctx.lineTo(r * 1.6, r * 0.5);
  ctx.strokeStyle = 'rgba(200, 220, 230, 0.8)';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.restore();
}

function drawLobster(ctx, r, age) {
  const body = '#b0432f';
  ctx.save();
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i += 1) {
      ctx.strokeStyle = body;
      ctx.lineWidth = r * 0.12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.2 + i * r * 0.3, side * r * 0.4);
      ctx.lineTo(-r * 0.4 + i * r * 0.3 + Math.sin(age * 8 + i) * r * 0.1, side * r * 1.0);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.1, r * 0.6, 0, 0, TAU);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = '#6a2418';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 1.0, 0);
  ctx.lineTo(-r * 1.9, -r * 0.7);
  ctx.lineTo(-r * 2.0, 0);
  ctx.lineTo(-r * 1.9, r * 0.7);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.9, side * r * 0.2);
    ctx.lineTo(r * 1.8, side * r * 0.5);
    ctx.lineTo(r * 2.1, side * r * 0.9);
    ctx.lineTo(r * 1.4, side * r * 0.7);
    ctx.lineTo(r * 1.5, side * r * 0.3);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(r * 1.1, -r * 0.1);
  ctx.lineTo(r * 1.5, -r * 0.5);
  ctx.lineTo(r * 1.1, -r * 0.2);
  ctx.moveTo(r * 1.1, r * 0.1);
  ctx.lineTo(r * 1.5, r * 0.5);
  ctx.lineTo(r * 1.1, r * 0.2);
  ctx.strokeStyle = '#6a2418';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.7, side * r * 0.2, r * 0.09, 0, TAU);
    ctx.fillStyle = '#141414';
    ctx.fill();
  }
  ctx.restore();
}

function drawGlowPlankton(ctx, r, age) {
  const pulse = 0.6 + 0.4 * Math.sin(age * 4);
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.4);
  halo.addColorStop(0, `rgba(140, 235, 255, ${0.7 * pulse})`);
  halo.addColorStop(1, 'rgba(140, 235, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d8f6ff';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.7, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150, 230, 255, 0.8)';
  ctx.lineWidth = r * 0.1;
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * TAU + age * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6);
    ctx.stroke();
  }
}

function drawDragonfish(ctx, r, age) {
  const DARK = '#160d08';
  const DARK2 = '#080402';
  const EDGE = '#3d241a';
  const FIN = 'rgba(122, 78, 38, 0.32)';
  ctx.save();

  const segs = 22;
  const len = r * 6.4;
  const pts = [];
  for (let i = 0; i <= segs; i += 1) {
    const t = i / segs;
    pts.push({ x: r * 0.2 - t * len, y: 0, w: r * (0.26 * (1 - t * 0.92)) + r * 0.03 });
  }

  const finA = 1;
  const finB = segs - 2;
  const finH = (i) => {
    const t = (i - finA) / (finB - finA);
    const edge = Math.min(t, 1 - t);
    const k = Math.max(0, Math.min(1, edge / 0.2));
    return r * 0.34 * Math.sin(k * Math.PI * 0.5);
  };
  ctx.fillStyle = FIN;
  ctx.beginPath();
  ctx.moveTo(pts[finA].x, pts[finA].y - pts[finA].w);
  for (let i = finA; i <= finB; i += 1) ctx.lineTo(pts[i].x, pts[i].y - pts[i].w);
  for (let i = finB; i >= finA; i -= 1) ctx.lineTo(pts[i].x, pts[i].y - pts[i].w - finH(i));
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(pts[finA].x, pts[finA].y + pts[finA].w);
  for (let i = finA; i <= finB; i += 1) ctx.lineTo(pts[i].x, pts[i].y + pts[i].w);
  for (let i = finB; i >= finA; i -= 1) ctx.lineTo(pts[i].x, pts[i].y + pts[i].w + finH(i));
  ctx.closePath();
  ctx.fill();

  const grad = ctx.createLinearGradient(0, -r * 0.4, 0, r * 0.4);
  grad.addColorStop(0, DARK);
  grad.addColorStop(1, DARK2);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y - pts[0].w);
  for (const p of pts) ctx.lineTo(p.x, p.y - p.w);
  for (let i = pts.length - 1; i >= 0; i -= 1) ctx.lineTo(pts[i].x, pts[i].y + pts[i].w);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = Math.max(1, r * 0.03);
  for (let i = 2; i < segs - 1; i += 2) {
    const p = pts[i];
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - p.w * 0.9);
    ctx.lineTo(p.x, p.y + p.w * 0.9);
    ctx.stroke();
  }

  const tail = pts[pts.length - 1];
  const tailPrev = pts[pts.length - 2];
  const ang = Math.atan2(tail.y - tailPrev.y, tail.x - tailPrev.x);
  ctx.save();
  ctx.translate(tail.x, tail.y);
  ctx.rotate(ang);
  ctx.fillStyle = DARK;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(r * 0.5, -r * 0.24);
  ctx.quadraticCurveTo(r * 0.62, 0, r * 0.5, r * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();
  ctx.restore();

  drawLoosejawHead(ctx, r, {
    age,
    headColor: DARK,
    outlineColor: EDGE,
    tilt: 0,
    swing: 0,
    noPhotophores: true,
    noJaw: true,
    noLigament: true,
  });

  ctx.strokeStyle = '#f2f0ea';
  ctx.lineWidth = Math.max(1.4, r * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r * 0.4, r * 0.24);
  ctx.quadraticCurveTo(r * 0.78, r * 0.05, r * 0.6, -r * 0.72);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(r * 0.6, -r * 0.78, r * 0.12, r * 0.18, 0, 0, TAU);
  ctx.fillStyle = '#f7f5ef';
  ctx.fill();
  ctx.strokeStyle = '#cfccc4';
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.stroke();

  ctx.restore();
}

function drawEvolveCreature(ctx, r, key, age) {
  switch (key) {
    case 'cookiecutter': drawCookiecutter(ctx, r, age); break;
    case 'stingray': drawStingrayBody(ctx, r, { raw: true, tailPhase: age * 6 }); break;
    case 'shark': drawSharkBody(ctx, r, { age }); break;
    case 'hammerhead': drawHammerhead(ctx, r, age); break;
    case 'copepod': drawCopepod(ctx, r, age); break;
    case 'krill': drawKrill(ctx, r, age); break;
    case 'shrimp': drawArcticShrimpBody(ctx, r, { armPhase: age * 6 }); break;
    case 'crab': drawKelpCrabBody(ctx, r, { legPhase: age * 6 }); break;
    case 'lobster': drawLobster(ctx, r, age); break;
    case 'jelly': drawMoonJellyBody(ctx, r, { age, pulsePhase: age * 3 }); break;
    case 'octopus': drawOctopusBody(ctx, r, { age }); break;
    case 'squid': drawSquidBody(ctx, r, { armPhase: age * 4 }); break;
    case 'cuttlefish': drawCuttlefishGlyph(ctx, r, { age }, 'rgba(140, 190, 150, 0.92)'); break;
    case 'hatchet': drawHatchetFish(ctx, r, { age, glow: 0.7 }); break;
    case 'loosejaw': drawLoosejaw(ctx, r * 0.9, { age }); break;
    case 'dragonfish': drawDragonfish(ctx, r, age); break;
    case 'spidercrab': drawJapaneseSpiderCrab(ctx, r, { age }); break;
    default: drawGlowPlankton(ctx, r, age);
  }
}

export class EvolutionScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'evolution';
  }

  buildRound() {
    const C = EVOLUTION;
    this.phase = 'setup';
    this.regionIndex = 0;
    this.categoryIndex = 0;
    this.row = 0;
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.status = '';
    this.statusTimer = 0;
    this.foods = [];
    this.growth = 0;
    this.stage = 0;
    this.players = [];
    this.player = null;
    this.predator = null;
  }

  category() {
    return EVOLUTION.categories[this.categoryIndex];
  }

  region() {
    return EVOLUTION.regions[this.regionIndex];
  }

  stageRadius(stage) {
    return 10 + stage * 6;
  }

  startPlay() {
    const C = EVOLUTION;
    this.phase = 'play';
    this.lives = C.lives;
    this.invuln = 0;
    this.growth = 0;
    this.stage = 0;
    this.status = 'EAT TO EVOLVE';
    this.statusTimer = 3;

    const player = new Shark(W * 0.4, H * 0.5, { controls: CONTROLS.solo, pointer: true, maxX: W });
    player.noIdleFlip = true;
    player.radius = this.stageRadius(0);
    player.render = (ctx) => {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.facing, 1);
      drawEvolveCreature(ctx, player.radius, this.category().draws[this.stage], this.time);
      ctx.restore();
    };
    this.players = [player];
    this.player = player;

    this.foods = [];
    for (let i = 0; i < C.foodCount; i += 1) this.spawnFood();

    this.predator = {
      x: W - 180,
      y: H * 0.4,
      vx: -130,
      vy: 0,
      radius: 44,
      heading: Math.PI,
      state: 'patrol',
      timer: 0,
      patrolY: H * 0.4,
    };
  }

  spawnFood() {
    this.foods.push({
      x: rand(60, W - 60),
      y: rand(EVOLUTION.topBound + 30, EVOLUTION.bottomBound - 20),
      vx: rand(-24, 24),
      vy: rand(-16, 16),
      phase: rand(0, TAU),
      r: 9,
    });
  }

  firstPersonActor() {
    return this.player;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 130, endFreq: 45, type: 'sawtooth', duration: 0.4, volume: 0.3 });
    if (this.lives <= 0) {
      this.finish(false);
      return true;
    }
    this.phase = 'scare';
    this.scareTimer = 1.3;
    return true;
  }

  respawn() {
    const p = this.player;
    p.x = W * 0.4;
    p.y = H * 0.5;
    p.vx = 0;
    p.vy = 0;
    this.stage = Math.max(0, this.stage - 1);
    p.radius = this.stageRadius(this.stage);
    this.growth = 0;
    const m = this.predator;
    m.x = W - 180;
    m.y = H * 0.4;
    m.vx = -130;
    m.vy = 0;
    m.state = 'patrol';
    m.timer = 0;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'YOU LOST A FORM \u2014 EAT AGAIN';
    this.statusTimer = 2.4;
  }

  updateSetup(input) {
    if (input.wasPressed('up')) {
      this.row = (this.row + 1) % 3;
      this.game.audio.tone({ freq: 500, duration: 0.05, volume: 0.1 });
    }
    if (input.wasPressed('down')) {
      this.row = (this.row + 2) % 3;
      this.game.audio.tone({ freq: 500, duration: 0.05, volume: 0.1 });
    }
    if (input.wasPressed('left') || input.wasPressed('right')) {
      const step = input.wasPressed('right') ? 1 : -1;
      if (this.row === 0) this.regionIndex = (this.regionIndex + step + EVOLUTION.regions.length) % EVOLUTION.regions.length;
      else if (this.row === 1) this.categoryIndex = (this.categoryIndex + step + EVOLUTION.categories.length) % EVOLUTION.categories.length;
      else this.lives = clamp(EVOLUTION.lives + step, 1, 5);
      this.game.audio.tone({ freq: 560, duration: 0.04, volume: 0.1 });
    }
    if (input.wasPressed('confirm')) this.startPlay();
  }

  updateRound(dt, input) {
    if (this.phase === 'setup') {
      this.updateSetup(input);
      return;
    }
    const C = EVOLUTION;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }

    const p = this.player;
    p.update(dt, input);
    p.x = clamp(p.x, 20, W - 20);
    p.y = clamp(p.y, C.topBound, C.bottomBound);

    while (this.foods.length < C.foodCount) this.spawnFood();
    for (const f of this.foods) {
      f.phase += dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.x < 40) f.vx = Math.abs(f.vx);
      if (f.x > W - 40) f.vx = -Math.abs(f.vx);
      if (f.y < C.topBound) f.vy = Math.abs(f.vy);
      if (f.y > C.bottomBound) f.vy = -Math.abs(f.vy);
      if (circleOverlap(p, { x: f.x, y: f.y, radius: f.r })) {
        f.dead = true;
        this.growth += 1;
        this.particles.burst(f.x, f.y, { count: 8, speed: 120, life: 0.4, colors: ['#bfe9ff', '#8fe0ef'], buoyancy: -20 });
        this.game.audio.tone({ freq: 560, endFreq: 880, type: 'triangle', duration: 0.09, volume: 0.14 });
      }
    }
    this.foods = this.foods.filter((f) => !f.dead);

    if (this.growth >= C.foodPerStage) {
      if (this.stage >= this.category().stages.length - 1) {
        this.finish(true);
        return;
      }
      this.stage += 1;
      this.growth = 0;
      p.radius = this.stageRadius(this.stage);
      this.status = `EVOLVED \u2014 ${this.category().stages[this.stage]}`;
      this.statusTimer = 3;
      this.particles.burst(p.x, p.y, { count: 26, speed: 200, life: 0.8, colors: ['#ffd166', '#fff6cf'], buoyancy: -40 });
      this.game.audio.tone({ freq: 420, endFreq: 900, type: 'triangle', duration: 0.3, volume: 0.24 });
    }

    const m = this.predator;
    const d = Math.hypot(p.x - m.x, p.y - m.y);
    const hides = this.stage >= 2;
    if (m.state === 'patrol') {
      m.timer -= dt;
      if (m.timer <= 0) {
        m.timer = rand(1.6, 3);
        m.patrolY = rand(C.topBound + 30, C.bottomBound - 60);
      }
      m.vx += (Math.sign(m.vx || 1) * 130 - m.vx) * (1 - Math.exp(-1.5 * dt));
      m.vy += ((m.patrolY - m.y) * 0.7 - m.vy) * (1 - Math.exp(-1.5 * dt));
      if (m.x < 80) m.vx = Math.abs(m.vx);
      else if (m.x > W - 80) m.vx = -Math.abs(m.vx);
      if (d < 340 && !hides) {
        m.state = 'charge';
        m.timer = 2;
        this.game.audio.tone({ freq: 120, endFreq: 70, type: 'sawtooth', duration: 0.35, volume: 0.22 });
      }
    } else if (m.state === 'charge') {
      m.timer -= dt;
      const dx = p.x - m.x;
      const dy = p.y - m.y;
      const dd = Math.hypot(dx, dy) || 1;
      m.vx += ((dx / dd) * 560 - m.vx) * (1 - Math.exp(-3 * dt));
      m.vy += ((dy / dd) * 560 - m.vy) * (1 - Math.exp(-3 * dt));
      if (this.invuln <= 0 && circleOverlap(p, { x: m.x, y: m.y, radius: m.radius + 4 })) {
        if (this.catchPlayer('THE PREDATOR SWALLOWED YOU')) return;
      }
      if (m.timer <= 0) {
        m.state = 'recover';
        m.timer = 1.2;
      }
    } else {
      m.timer -= dt;
      m.vx *= Math.exp(-2.5 * dt);
      m.vy *= Math.exp(-2.5 * dt);
      if (m.timer <= 0) m.state = 'patrol';
    }
    m.x = clamp(m.x + m.vx * dt, 50, W - 50);
    m.y = clamp(m.y + m.vy * dt, C.topBound, C.bottomBound);
    m.heading = Math.atan2(m.vy, m.vx);

    this.particles.update(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);
  }

  renderRound(ctx) {
    const C = EVOLUTION;
    if (this.phase === 'setup') {
      this.renderSetup(ctx);
      return;
    }
    const region = this.region();
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, region.top);
    sky.addColorStop(1, region.bottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(220, 240, 255, 0.12)';
    for (let i = 0; i < 24; i += 1) {
      ctx.beginPath();
      ctx.arc((i * 197 + this.time * 12 * (i % 2 ? 1 : -1) + W) % W, (i * 89) % H, 2 + (i % 3), 0, TAU);
      ctx.fill();
    }

    for (const f of this.foods) {
      ctx.save();
      ctx.translate(f.x, f.y);
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, f.r * 2);
      halo.addColorStop(0, 'rgba(190, 240, 255, 0.7)');
      halo.addColorStop(1, 'rgba(190, 240, 255, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, f.r * 2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#eaffff';
      ctx.beginPath();
      ctx.arc(0, 0, f.r * 0.7, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    const m = this.predator;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.heading);
    if (Math.cos(m.heading) < 0) ctx.scale(1, -1);
    if (region.hazard === 'angler') {
      drawAnglerBody(ctx, m.radius * 0.9, { age: this.time, glow: m.state === 'charge' ? 1 : 0.6 });
    } else {
      drawSharkBody(ctx, m.radius, { age: this.time });
    }
    ctx.restore();

    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderSetup(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#123a52');
    bg.addColorStop(1, '#03090f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawText(ctx, 'THE EVOLUTION TANK', W / 2, 70, {
      size: 32,
      color: COLORS.text,
      glow: 'rgba(150, 230, 180, 0.5)',
      glowBlur: 18,
    });
    drawText(ctx, 'CHOOSE YOUR DEPTH, YOUR LINEAGE, AND HOW MANY LIVES \u2014 THEN EAT TO EVOLVE', W / 2, 104, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.85,
    });

    const rows = [
      { label: 'REGION OF DEPTH', value: this.region().label },
      { label: 'CATEGORY', value: this.category().label },
      { label: 'LIVES', value: String(this.lives) },
    ];
    rows.forEach((row, i) => {
      const y = 190 + i * 70;
      const active = i === this.row;
      if (active) fillRoundRect(ctx, W / 2 - 320, y - 30, 640, 56, 14, 'rgba(255, 209, 102, 0.14)');
      drawText(ctx, row.label, W / 2 - 300, y - 4, { size: 15, color: active ? COLORS.accent : COLORS.textDim, align: 'left' });
      drawText(ctx, `\u25C0  ${row.value}  \u25B6`, W / 2 + 300, y - 4, {
        size: active ? 22 : 18,
        color: active ? COLORS.accent : COLORS.text,
        align: 'right',
        alpha: active ? 1 : 0.75,
      });
    });

    const cat = this.category();
    drawText(ctx, cat.stages.join('  \u2192  '), W / 2, 420, {
      size: 14,
      color: '#a8d8b0',
      alpha: 0.9,
    });
    drawText(ctx, 'UP / DOWN \u2014 ROW      LEFT / RIGHT \u2014 CHANGE      ENTER \u2014 BEGIN      ESC \u2014 BACK', W / 2, H - 30, {
      size: 12,
      color: COLORS.textDim,
    });
  }

  renderHud(ctx) {
    if (this.phase === 'setup' || this.phase === 'scare') return;
    drawText(ctx, 'THE EVOLUTION TANK', W / 2, 28, { size: 23, color: COLORS.text, glow: 'rgba(150, 230, 180, 0.5)', glowBlur: 16 });
    drawText(ctx, `LIVES ${this.lives}`, 24, 26, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < this.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 48, 7, COLORS.danger);
    }

    const cat = this.category();
    const stageCount = cat.stages.length;
    const prog = this.stage / (stageCount - 1);
    fillRoundRect(ctx, W - 300, 26, 276, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 300, 26, 276 * clamp(prog, 0, 1), 10, 5, '#a8d86a');
    drawText(ctx, cat.stages[this.stage], W - 300, 52, { size: 13, color: COLORS.accent, align: 'left' });
    const next = this.stage < stageCount - 1 ? cat.stages[this.stage + 1] : 'FINAL FORM';
    drawText(ctx, `${EVOLUTION.regions[this.regionIndex].label} \u00B7 NEXT: ${next}`, W - 300, 70, { size: 11, color: COLORS.textDim, align: 'left' });
    fillRoundRect(ctx, W - 300, 82, 276, 8, 4, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 300, 82, 276 * clamp(this.growth / EVOLUTION.foodPerStage, 0, 1), 8, 4, '#8fe0ef');

    if (this.statusTimer > 0) {
      drawText(ctx, this.status, W / 2, 92, { size: 14, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    if (this.predator && this.predator.state === 'charge') {
      drawText(ctx, 'A PREDATOR CHARGES!', W / 2, 60, { size: 14, color: COLORS.danger, alpha: 0.6 + 0.4 * Math.sin(this.time * 14) });
    }

    drawText(ctx, 'WASD / ARROWS \u2014 SWIM      EAT GLOWING FOOD TO EVOLVE      ESC \u2014 BACK', W / 2, H - 14, {
      size: 10,
      color: COLORS.textDim,
      alpha: 0.72,
    });
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.3, { width: W, height: H, time: this.time, caption: 'CAUGHT \u2014 TRY AGAIN!', radius: 60 });
      return;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.93)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(1.5, 1.5);
    if (this.region().hazard === 'angler') drawAnglerBody(ctx, 30, { age: this.time, glow: 1 });
    else drawSharkBody(ctx, 40, { age: this.time });
    ctx.restore();
    drawText(ctx, this.scareReason, W / 2, H - 60, { size: 16, color: COLORS.danger });
  }

  backScene() {
    return 'tanks';
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('tanks');
  }

  resultsTitle() {
    return 'THE EVOLUTION TANK';
  }

  resultsHeadline() {
    return this.won ? 'YOU REACHED THE FINAL FORM' : 'THE PREDATOR ENDED YOUR LINE';
  }

  resultsDetail() {
    return this.category() ? `${this.category().stages[this.stage]} \u00B7 ${this.lives} LIVES LEFT` : '';
  }
}
