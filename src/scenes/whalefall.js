import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { Shark } from '../entities/shark.js';
import { drawJapaneseSpiderCrab } from '../entities/spidercrab.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import { CONTROLS, COLORS, WHALEFALL, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const FLOOR = WHALEFALL.bottomBound;

function wHash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function drawSixgill(ctx, r, pose = {}) {
  const jaw = pose.jaw ?? 0.2;
  const bodyFill = '#d8c9a0';
  const bellyFill = '#f4f0e4';
  const finFill = '#c2ac7c';
  const outline = 'rgba(80, 64, 38, 0.6)';
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

  ctx.beginPath();
  ctx.moveTo(-r * 1.7, -r * 0.26);
  ctx.lineTo(-r * 2.4, -r * 0.13);
  ctx.lineTo(-r * 2.4, r * 0.13);
  ctx.lineTo(-r * 1.7, r * 0.26);
  ctx.closePath();
  ctx.fillStyle = bodyFill;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r * 2.4, -r * 0.4);
  ctx.lineTo(-r * 3.5, -r * 1.1);
  ctx.lineTo(-r * 2.4, r * 0.4);
  ctx.closePath();
  ctx.fillStyle = finFill;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

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

  ctx.beginPath();
  ctx.moveTo(-r * 1.6, -r * 0.38);
  ctx.lineTo(-r * 2.0, -r * 1.1);
  ctx.lineTo(-r * 1.2, -r * 0.42);
  ctx.closePath();
  ctx.fillStyle = finFill;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(90, 74, 44, 0.45)';
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
  ctx.quadraticCurveTo(r * 1.4, r * 0.4 + jaw * r * 0.3, r * 0.5, r * 0.24);
  ctx.strokeStyle = 'rgba(60, 44, 24, 0.85)';
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

function drawHagfish(ctx, r, age) {
  const pink = '#e7c6cd';
  const pinkDark = '#c99aa4';
  const line = '#8a5f68';
  const len = r * 1.8;
  const wave = (t) => Math.sin(age * 3 + t * 3.6) * r * 0.26;
  const bodyStart = r * 0.8;
  const tX = -len;
  const bodyEnd = tX + r * 0.4;
  const body = (t) => ({ x: bodyStart + (bodyEnd - bodyStart) * t, y: wave(t) });

  ctx.save();

  const end = body(1);
  const prev = body(0.82);
  const heading = Math.atan2(end.y - prev.y, end.x - prev.x);
  ctx.save();
  ctx.translate(end.x, end.y);
  ctx.rotate(heading);
  const long = r * 0.7;
  const cross = r * 0.5;
  ctx.beginPath();
  ctx.moveTo(-long, 0);
  ctx.lineTo(0, -cross);
  ctx.lineTo(long, 0);
  ctx.lineTo(0, cross);
  ctx.closePath();
  ctx.fillStyle = pinkDark;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(bodyStart, 0);
  for (let i = 1; i <= 12; i += 1) {
    const point = body(i / 12);
    ctx.lineTo(point.x, point.y);
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = line;
  ctx.lineWidth = r * 0.52;
  ctx.stroke();
  ctx.strokeStyle = pink;
  ctx.lineWidth = r * 0.4;
  ctx.stroke();

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.72, side * r * 0.15, r * 0.09, 0, TAU);
    ctx.fillStyle = '#f3eef0';
    ctx.fill();
    ctx.strokeStyle = 'rgba(138, 95, 104, 0.6)';
    ctx.lineWidth = r * 0.03;
    ctx.stroke();
  }

  ctx.strokeStyle = pinkDark;
  ctx.lineWidth = r * 0.16;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.85, side * r * 0.16);
    ctx.lineTo(r * 1.18, side * r * 0.34);
    ctx.stroke();
  }
  ctx.restore();
}

export class WhaleFallScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'whalefall';
  }

  buildRound() {
    const C = WHALEFALL;
    this.phase = 'play';
    this.worldLength = C.worldLength;
    this.exitZone = { x: this.worldLength - C.exitPad };
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.status = 'CLIMB THE WHALE \u2014 TUCK IN A GASH, GRAB THE SCRAPS';
    this.statusTimer = 4;
    this.scraps = 0;
    this.snag = 0;
    this.camX = 0;
    this.time0 = 0;
    this.snow = [];
    for (let i = 0; i < 60; i += 1) {
      this.snow.push({ x: rand(0, this.worldLength), y: rand(C.topBound, C.bottomBound), r: rand(0.6, 1.8), sp: rand(4, 16) });
    }

    const player = new Shark(C.startX, FLOOR - 26, { controls: CONTROLS.solo, pointer: true, maxX: this.worldLength });
    player.noIdleFlip = true;
    player.render = (ctx) => {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.facing, 1);
      drawJapaneseSpiderCrab(ctx, player.radius * 1.15, { age: player.age, speed: player.speed });
      ctx.restore();
    };
    this.players = [player];
    this.player = player;

    const centerX = this.worldLength * 0.5;
    const halfW = this.worldLength * 0.5 - 400;
    this.whale = { cx: centerX, halfW, h: 200, x0: centerX - halfW, x1: centerX + halfW };
    this.whale.headX = this.whale.x0 + (this.whale.x1 - this.whale.x0) * 0.2;
    this.player.y = this.surfaceY(this.player.x) - this.player.radius;

    this.tears = [];
    const tearCount = 6;
    for (let i = 0; i < tearCount; i += 1) {
      const x = this.whale.x0 + ((i + 1) / (tearCount + 1)) * (this.whale.x1 - this.whale.x0);
      this.tears.push({ x, w: 80, ribs: i % 2 === 0, phase: rand(0, TAU) });
    }

    this.scrapItems = [];
    for (let i = 0; i < C.scrapCount; i += 1) {
      const inTear = i % 3 === 0;
      const tear = this.tears[i % this.tears.length];
      const x = inTear ? tear.x + rand(-30, 30) : rand(C.startX + 200, this.exitZone.x - 200);
      this.scrapItems.push({ x, y: this.surfaceY(x) - rand(12, 44), taken: false, phase: rand(0, TAU) });
    }

    this.hagfish = [];
    for (let i = 0; i < C.hagfishCount; i += 1) {
      const x = this.whale.x0 + ((i + 1.5) / (C.hagfishCount + 1)) * (this.whale.x1 - this.whale.x0);
      const surface = this.surfaceY(x);
      this.hagfish.push({
        x,
        surface,
        y: surface,
        r: 22,
        phase: rand(0, TAU),
        state: 'hidden',
        timer: rand(1.2, 3.2),
        out: 0,
        burstDone: false,
      });
    }

    this.sixgill = {
      angle: rand(0, TAU),
      cx: centerX,
      cy: H * 0.42,
      rx: 900,
      ry: 150,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      heading: 0,
      jaw: 0.2,
      radius: C.sixgillRadius,
      state: 'patrol',
      timer: 0,
    };
    this.sixgill.x = this.sixgill.cx + Math.cos(this.sixgill.angle) * this.sixgill.rx;
    this.sixgill.y = this.sixgill.cy + Math.sin(this.sixgill.angle) * this.sixgill.ry;
  }

  firstPersonActor() {
    return this.player;
  }

  surfaceY(x) {
    const w = this.whale;
    const t = (x - w.cx) / w.halfW;
    if (Math.abs(t) >= 1) return FLOOR;
    return FLOOR - w.h * Math.sqrt(1 - t * t);
  }

  concealed() {
    const p = this.player;
    for (const tear of this.tears) {
      if (Math.abs(p.x - tear.x) < tear.w * 0.9) return true;
    }
    return false;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 120, endFreq: 45, type: 'sawtooth', duration: 0.4, volume: 0.3 });
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
    p.x = clamp(p.x - 240, WHALEFALL.startX, this.worldLength - 40);
    p.y = this.surfaceY(p.x) - p.radius;
    p.vx = 0;
    p.vy = 0;
    const s = this.sixgill;
    s.state = 'patrol';
    s.angle = Math.atan2(p.y - s.cy, p.x - s.cx) + Math.PI;
    s.timer = 0;
    s.jaw = 0.2;
    this.snag = 0;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'THE SIXGILL LOST YOU \u2014 BACK TO THE BONES';
    this.statusTimer = 2.4;
  }

  updateRound(dt, input) {
    const C = WHALEFALL;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }

    const p = this.player;
    if (this.snag > 0) {
      this.snag -= dt;
      p.vx = 0;
      p.vy = 0;
      p.update(dt, input);
      p.vx = 0;
      p.vy = 0;
      p.y = this.surfaceY(p.x) - p.radius;
      if (this.snag <= 0) this.invuln = Math.max(this.invuln, 0.6);
    } else {
      p.update(dt, input);
      p.x = clamp(p.x, 20, this.worldLength - 20);
      p.y = this.surfaceY(p.x) - p.radius;
      p.vy = 0;
    }

    for (const scrap of this.scrapItems) {
      scrap.phase += dt;
      if (scrap.taken) continue;
      if (circleOverlap(p, { x: scrap.x, y: scrap.y, radius: 22 })) {
        scrap.taken = true;
        this.scraps += 1;
        this.game.audio.tone({ freq: 700, endFreq: 1040, type: 'triangle', duration: 0.1, volume: 0.16 });
        this.particles.burst(scrap.x, scrap.y, { count: 10, speed: 140, life: 0.5, colors: ['#e8d5b5', '#ffffff'], buoyancy: -30 });
        if (this.scraps === C.scrapGoal) this.status = 'THE BONES ARE PICKED CLEAN \u2014 REACH THE FAR LEDGE';
      }
    }

    for (const knot of this.hagfish) {
      knot.phase += dt;
      knot.timer -= dt;
      if (knot.state === 'hidden') {
        knot.out = Math.max(0, knot.out - dt * 4);
        const near = this.snag <= 0 && Math.abs(p.x - knot.x) < 150;
        if (knot.timer <= 0 || near) {
          knot.state = 'emerging';
          knot.timer = 0.32;
          knot.burstDone = false;
        }
      } else if (knot.state === 'emerging') {
        knot.out = clamp(knot.out + dt / 0.32, 0, 1);
        if (!knot.burstDone) {
          knot.burstDone = true;
          this.particles.burst(knot.x, knot.surface, { count: 16, speed: 160, life: 0.6, colors: ['#c96b74', '#3a2b30', '#eef0ee'], buoyancy: -20 });
          this.game.audio.tone({ freq: 150, endFreq: 60, type: 'sawtooth', duration: 0.24, volume: 0.2 });
        }
        if (knot.out >= 1) {
          knot.state = 'out';
          knot.timer = rand(2.5, 4.5);
        }
      } else if (knot.state === 'out') {
        knot.out = 1;
        if (knot.timer <= 0) {
          knot.state = 'retreating';
          knot.timer = 0.4;
        }
      } else {
        knot.out = clamp(knot.out - dt / 0.4, 0, 1);
        if (knot.out <= 0) {
          knot.state = 'hidden';
          knot.timer = rand(1.2, 3.5);
        }
      }
      knot.y = knot.surface - knot.out * 26;
      if (this.snag <= 0 && knot.out > 0.6 && circleOverlap(p, { x: knot.x, y: knot.y, radius: knot.r })) {
        this.snag = C.snagTime;
        this.status = 'A HAGFISH! MASH TO WRIGGLE FREE';
        this.statusTimer = 2;
        this.game.audio.tone({ freq: 180, endFreq: 90, type: 'square', duration: 0.3, volume: 0.24 });
        this.particles.burst(knot.x, knot.y, { count: 14, speed: 150, life: 0.6, colors: ['#c9d0d6', '#8f9aa0'], buoyancy: -20 });
        const s = this.sixgill;
        s.state = 'charge';
        s.timer = 1.6;
        s.jaw = 0.8;
      }
    }

    const s = this.sixgill;
    const hidden = this.concealed();
    const dist = Math.hypot(p.x - s.x, p.y - s.y);
    if (s.state === 'patrol') {
      s.angle += (C.sixgillSpeed / Math.max(s.rx, s.ry)) * dt;
      s.cx += 0;
      const tx = s.cx + Math.cos(s.angle) * s.rx;
      const ty = s.cy + Math.sin(s.angle) * s.ry;
      s.vx = (tx - s.x) / Math.max(dt, 0.001);
      s.vy = (ty - s.y) / Math.max(dt, 0.001);
      s.x = tx;
      s.y = ty;
      s.heading = Math.atan2(s.vy, s.vx);
      s.jaw = 0.2;
      if (!hidden && dist < C.sixgillSight) {
        s.state = 'charge';
        s.timer = 2.2;
        s.jaw = 0.8;
        this.game.audio.tone({ freq: 120, endFreq: 70, type: 'sawtooth', duration: 0.35, volume: 0.22 });
      }
    } else if (s.state === 'charge') {
      s.timer -= dt;
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      s.vx += ((dx / d) * C.sixgillChargeSpeed - s.vx) * (1 - Math.exp(-C.sixgillTurn * dt));
      s.vy += ((dy / d) * C.sixgillChargeSpeed - s.vy) * (1 - Math.exp(-C.sixgillTurn * dt));
      s.x = clamp(s.x + s.vx * dt, 40, this.worldLength - 40);
      s.y = clamp(s.y + s.vy * dt, C.topBound, C.bottomBound);
      s.heading = Math.atan2(s.vy, s.vx);
      if (!hidden && this.invuln <= 0 && circleOverlap(p, { x: s.x, y: s.y, radius: s.radius + 6 })) {
        if (this.catchPlayer('THE SIXGILL SHARK TOOK YOU IN THE OPEN')) return;
      }
      if (s.timer <= 0 || hidden) {
        s.state = 'recover';
        s.timer = C.sixgillRecover;
      }
    } else {
      s.timer -= dt;
      s.vx *= Math.exp(-3 * dt);
      s.vy *= Math.exp(-3 * dt);
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.jaw += (0.2 - s.jaw) * (1 - Math.exp(-6 * dt));
      if (s.timer <= 0) {
        s.state = 'patrol';
        s.angle = Math.atan2(s.y - s.cy, s.x - s.cx);
      }
    }

    for (const flake of this.snow) {
      flake.y += flake.sp * dt;
      if (flake.y > C.bottomBound) {
        flake.y = C.topBound;
        flake.x = rand(0, this.worldLength);
      }
    }

    this.particles.update(dt);
    this.camX = clamp(p.x - W * 0.35, 0, Math.max(0, this.worldLength - W));
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);

    if (p.x >= this.exitZone.x) {
      if (this.scraps >= C.scrapGoal) this.finish(true);
      else if (this.statusTimer <= 0) {
        this.status = `THE FAR LEDGE IS SEALED \u2014 FIND ${C.scrapGoal - this.scraps} MORE SCRAPS`;
        this.statusTimer = 2;
        p.x = this.exitZone.x - 30;
      }
    }
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(-this.camX, 0);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b2536');
    sky.addColorStop(1, '#03101a');
    ctx.fillStyle = sky;
    ctx.fillRect(this.camX - 20, 0, W + 40, H);

    ctx.fillStyle = 'rgba(210, 230, 245, 0.5)';
    for (const flake of this.snow) {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.r, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = '#0a1b26';
    ctx.fillRect(this.camX - 20, FLOOR, W + 40, H - FLOOR);

    this.renderWhale(ctx);
    this.renderExit(ctx);

    for (const scrap of this.scrapItems) {
      if (scrap.taken) continue;
      ctx.save();
      ctx.translate(scrap.x, scrap.y + Math.sin(scrap.phase * 2) * 3);
      ctx.fillStyle = '#e8d5b5';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 6, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 90, 60, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    for (const knot of this.hagfish) this.renderCarcassLump(ctx, knot);
    for (const knot of this.hagfish) {
      if (knot.out <= 0.02) continue;
      ctx.save();
      ctx.translate(knot.x, knot.y);
      ctx.scale(0.4 + 0.6 * knot.out, 0.4 + 0.6 * knot.out);
      drawHagfish(ctx, knot.r, this.time + knot.phase);
      ctx.restore();
    }

    const s = this.sixgill;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(Math.cos(s.heading) >= 0 ? 1 : -1, 1);
    drawSixgill(ctx, s.radius, { age: this.time, jaw: s.jaw });
    ctx.restore();

    if (this.concealed()) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.time * 6);
      ctx.strokeStyle = '#8fe0ef';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.radius * 2, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    this.renderPlayers(ctx);
    this.particles.render(ctx);
    ctx.restore();
  }

  renderWhale(ctx) {
    const w = this.whale;
    ctx.beginPath();
    ctx.moveTo(w.x0, FLOOR);
    for (let x = w.x0; x <= w.x1; x += 14) ctx.lineTo(x, this.surfaceY(x));
    ctx.lineTo(w.x1, FLOOR);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, FLOOR - w.h, 0, FLOOR);
    g.addColorStop(0, '#9b8588');
    g.addColorStop(0.45, '#7c666b');
    g.addColorStop(1, '#403438');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(28, 20, 24, 0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(255, 240, 240, 0.06)';
    for (let i = 0; i < 40; i += 1) {
      const bx = w.x0 + wHash(i * 3.3 + 1) * (w.x1 - w.x0);
      const by = FLOOR - w.h * 0.15 - wHash(i * 7.1 + 2) * w.h * 0.7;
      ctx.beginPath();
      ctx.ellipse(bx, by, 30 + wHash(i) * 60, 12 + wHash(i * 1.7) * 22, 0, 0, TAU);
      ctx.fill();
    }
    for (const tear of this.tears) this.renderTear(ctx, tear);
    this.renderWhaleFace(ctx);
    ctx.restore();
  }

  renderTear(ctx, tear) {
    const cy = (this.surfaceY(tear.x) + FLOOR) / 2 + Math.sin(this.time * 2 + tear.phase) * 2;
    ctx.save();
    ctx.translate(tear.x, cy);
    ctx.beginPath();
    ctx.moveTo(-tear.w * 0.8, 0);
    ctx.quadraticCurveTo(-tear.w * 0.3, -26, 0, -20);
    ctx.quadraticCurveTo(tear.w * 0.4, -30, tear.w * 0.85, -4);
    ctx.quadraticCurveTo(tear.w * 0.4, 26, 0, 22);
    ctx.quadraticCurveTo(-tear.w * 0.4, 30, -tear.w * 0.8, 0);
    ctx.closePath();
    ctx.fillStyle = '#c96b74';
    ctx.fill();
    ctx.strokeStyle = 'rgba(92, 40, 46, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (tear.ribs) {
      ctx.strokeStyle = '#eef0ee';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      for (let k = -1; k <= 1; k += 1) {
        ctx.beginPath();
        ctx.moveTo(k * tear.w * 0.36 - 6, -18);
        ctx.lineTo(k * tear.w * 0.36 + 6, 18);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  renderWhaleFace(ctx) {
    const hx = this.whale.headX;
    const eyeY = this.surfaceY(hx) + 48;
    ctx.save();
    ctx.strokeStyle = '#241c20';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (const dx of [-34, 34]) {
      ctx.beginPath();
      ctx.moveTo(hx + dx - 18, eyeY);
      ctx.quadraticCurveTo(hx + dx, eyeY + 13, hx + dx + 18, eyeY);
      ctx.stroke();
    }
    ctx.strokeStyle = '#3a2b30';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hx - 96, eyeY + 48);
    ctx.quadraticCurveTo(hx + 24, eyeY + 96, hx + 156, eyeY + 42);
    ctx.stroke();
    ctx.restore();
  }

  renderCarcassLump(ctx, knot) {
    const w = 30 + 4 * Math.sin(knot.phase * 2);
    const h = 13;
    ctx.save();
    ctx.translate(knot.x, knot.surface + 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = '#6b565b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 22, 24, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  renderExit(ctx) {
    const x = this.exitZone.x;
    const open = this.scraps >= WHALEFALL.scrapGoal;
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = open ? '#bff0d0' : '#8fa7b4';
    ctx.fillRect(x - 40, 0, 80, H);
    ctx.restore();
    ctx.strokeStyle = open ? 'rgba(191, 240, 208, 0.7)' : 'rgba(143, 167, 180, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 40, 0, 80, H);
    drawText(ctx, open ? 'THE FAR LEDGE' : 'SEALED', x, 40, { size: 15, color: open ? '#bfe9d0' : COLORS.textDim });
  }

  renderHud(ctx) {
    drawText(ctx, 'THE WHALE FALL', W / 2, 30, { size: 24, color: COLORS.text, glow: 'rgba(143, 224, 239, 0.5)', glowBlur: 16 });
    drawText(ctx, `LIVES ${this.lives}`, 24, 28, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < WHALEFALL.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 50, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    drawText(ctx, `SCRAPS ${this.scraps}/${WHALEFALL.scrapGoal}`, W - 24, 28, { size: 16, color: COLORS.accent, align: 'right' });

    const progress = clamp(this.player.x / this.exitZone.x, 0, 1);
    fillRoundRect(ctx, W / 2 - 120, 52, 240, 8, 4, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W / 2 - 120, 52, 240 * progress, 8, 4, '#ffd166');

    if (this.snag > 0) {
      drawText(ctx, 'A HAGFISH \u2014 MASH TO WRIGGLE FREE', W / 2, 92, { size: 14, color: '#c9d0d6' });
    } else if (this.sixgill.state === 'charge') {
      drawText(ctx, 'THE SIXGILL SEES YOU \u2014 GET TO THE BONES!', W / 2, 92, { size: 15, color: COLORS.danger, alpha: 0.6 + 0.4 * Math.sin(this.time * 14) });
    } else if (this.concealed()) {
      drawText(ctx, 'TUCKED IN A GASH', W / 2, 92, { size: 13, color: '#8fe0ef', alpha: 0.85 });
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, W / 2, 92, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    drawText(ctx, 'A / D OR ARROWS \u2014 CLIMB THE WHALE      HIDE IN A GASH      ESC \u2014 BACK', W / 2, H - 14, {
      size: 10,
      color: COLORS.textDim,
      alpha: 0.72,
    });
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.3, {
        width: W,
        height: H,
        time: this.time,
        caption: 'CAUGHT \u2014 TRY AGAIN!',
        radius: 58,
      });
      return;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.93)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(1.6, 1.6);
    drawSixgill(ctx, 46, { age: this.time, jaw: 1 });
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
    return 'THE WHALE FALL';
  }

  resultsHeadline() {
    return this.won ? 'YOU PICKED THE BONES CLEAN' : 'THE SIXGILL GOT YOU';
  }

  resultsDetail() {
    return `${this.scraps} SCRAPS \u00b7 ${this.lives} LIVES LEFT`;
  }
}
