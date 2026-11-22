import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { Shark } from '../entities/shark.js';
import { drawFrogfish } from '../entities/realfish.js';
import { drawMorayBody } from '../entities/eel.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import { CONTROLS, COLORS, FROGFISH, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const MORAY_PALETTE = { bodyColor: '#4f7a52', outlineColor: '#294a2d', ridgeColor: '#9ccb84', spots: true };

export class FrogfishScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'frogfish';
  }

  buildRound() {
    const C = FROGFISH;
    this.phase = 'play';
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.eaten = 0;
    this.lure = 0;
    this.status = 'STAY STILL TO CAMOUFLAGE \u2014 HOLD SPACE TO WAVE THE LURE';
    this.statusTimer = 4.4;
    this.prey = [];
    for (let i = 0; i < C.preyCount; i += 1) this.spawnPrey();

    const player = new Shark(W * 0.35, H * 0.5, { controls: CONTROLS.solo, pointer: true, maxX: W });
    player.noIdleFlip = true;
    player.maxSpeed = C.maxSpeed;
    player.render = (ctx) => {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.facing, 1);
      const vis = clamp(0.42 + this.player.speed / 240, 0.42, 1);
      ctx.globalAlpha = vis;
      drawFrogfish(ctx, player.radius, { age: this.time, lure: this.lure });
      ctx.restore();
    };
    this.players = [player];
    this.player = player;

    this.moray = {
      x: W - 120,
      y: H * 0.35,
      vx: -C.moraySpeed,
      vy: 0,
      radius: C.morayRadius,
      heading: Math.PI,
      state: 'patrol',
      timer: 0,
      trail: [],
      phase: rand(0, TAU),
    };
  }

  firstPersonActor() {
    return this.player;
  }

  mouthX() {
    return this.player.x + this.player.facing * this.player.radius * 0.9;
  }

  spawnPrey() {
    this.prey.push({
      x: rand(60, W - 60),
      y: rand(FROGFISH.topBound + 20, FROGFISH.bottomBound - 20),
      vx: rand(-24, 24),
      vy: rand(-16, 16),
      phase: rand(0, TAU),
      r: 10,
    });
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
    p.x = W * 0.35;
    p.y = H * 0.5;
    p.vx = 0;
    p.vy = 0;
    const m = this.moray;
    m.x = W - 120;
    m.y = H * 0.35;
    m.vx = -FROGFISH.moraySpeed;
    m.vy = 0;
    m.state = 'patrol';
    m.timer = 0;
    m.trail = [];
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'THE MORAY LOST YOUR MOTION \u2014 FREEZE';
    this.statusTimer = 2.4;
  }

  updateRound(dt, input) {
    const C = FROGFISH;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }

    const p = this.player;
    const luring = input.isDown('confirm') || input.isDown('tool');
    this.lure += ((luring ? 1 : 0) - this.lure) * (1 - Math.exp(-8 * dt));

    p.update(dt, input);
    p.x = clamp(p.x, 30, W - 30);
    p.y = clamp(p.y, C.topBound, C.bottomBound);
    const moving = p.speed > 60;
    const mx = this.mouthX();

    for (const s of this.prey) {
      s.phase += dt;
      const dx = mx - s.x;
      const dy = p.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      let ax = 0;
      let ay = 0;
      if (this.lure > 0.4 && d < C.lureRange) {
        ax = (dx / d) * 90;
        ay = (dy / d) * 90;
      } else if (moving && d < 200) {
        ax = -(dx / d) * 140;
        ay = -(dy / d) * 140;
      } else {
        const a = Math.sin(s.phase * 1.6 + s.r) * 0.5;
        ax = Math.cos(a) * 20;
        ay = Math.sin(a) * 20;
      }
      s.vx += (ax - s.vx) * (1 - Math.exp(-3 * dt));
      s.vy += (ay - s.vy) * (1 - Math.exp(-3 * dt));
      s.x = clamp(s.x + s.vx * dt, 40, W - 40);
      s.y = clamp(s.y + s.vy * dt, C.topBound, C.bottomBound);
      if (circleOverlap(p, { x: s.x, y: s.y, radius: s.r })) {
        s.dead = true;
        this.eaten += 1;
        this.particles.burst(s.x, s.y, { count: 10, speed: 120, life: 0.45, colors: ['#ffd9c0', '#ff9a7a'], buoyancy: -20 });
        this.game.audio.tone({ freq: 640, endFreq: 980, type: 'triangle', duration: 0.1, volume: 0.16 });
      }
    }
    this.prey = this.prey.filter((s) => !s.dead);
    while (this.prey.length < C.preyCount) this.spawnPrey();

    const m = this.moray;
    m.phase += dt;
    const md = Math.hypot(p.x - m.x, p.y - m.y);
    if (m.state === 'patrol') {
      m.trail.unshift({ x: m.x, y: m.y });
      if (m.trail.length > 20) m.trail.length = 20;
      m.vx += (Math.sign(m.vx || -1) * C.moraySpeed - m.vx) * (1 - Math.exp(-1.5 * dt));
      m.vy += ((p.y - m.y) * 0.4 - m.vy) * (1 - Math.exp(-1.5 * dt));
      if (m.x < 90) m.vx = Math.abs(m.vx);
      else if (m.x > W - 90) m.vx = -Math.abs(m.vx);
      if (moving && md < C.moraySight) {
        m.state = 'charge';
        m.timer = 2.2;
        this.game.audio.tone({ freq: 120, endFreq: 70, type: 'sawtooth', duration: 0.35, volume: 0.22 });
      }
    } else if (m.state === 'charge') {
      m.timer -= dt;
      const dx = p.x - m.x;
      const dy = p.y - m.y;
      const d = Math.hypot(dx, dy) || 1;
      m.vx += ((dx / d) * C.morayCharge - m.vx) * (1 - Math.exp(-3 * dt));
      m.vy += ((dy / d) * C.morayCharge - m.vy) * (1 - Math.exp(-3 * dt));
      if (this.invuln <= 0 && circleOverlap(p, { x: m.x, y: m.y, radius: m.radius + 4 })) {
        if (this.catchPlayer('THE GREEN MORAY STRUCK THE STILL WATER')) return;
      }
      if (m.timer <= 0) {
        m.state = 'recover';
        m.timer = 1.4;
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

    if (this.eaten >= C.preyGoal) this.finish(true);
  }

  renderRound(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2f6f6a');
    sky.addColorStop(0.6, '#1d4f4c');
    sky.addColorStop(1, '#0c2c2b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(80, 130, 90, 0.25)';
    for (let i = 0; i < 30; i += 1) {
      ctx.beginPath();
      ctx.ellipse((i * 173) % W, (i * 97) % H, 40, 14, i, 0, TAU);
      ctx.fill();
    }

    const m = this.moray;
    if (m.trail.length >= 2) {
      ctx.save();
      for (let i = 1; i < m.trail.length - 1; i += 1) {
        const a = m.trail[i];
        ctx.fillStyle = i % 4 === 0 ? 'rgba(90, 140, 90, 0.5)' : 'rgba(70, 110, 74, 0.5)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, m.radius * (0.7 - (i / m.trail.length) * 0.5), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.heading);
    if (Math.cos(m.heading) < 0) ctx.scale(1, -1);
    drawMorayBody(ctx, m.radius * 0.8, { age: this.time + m.phase, jawOpen: m.state === 'charge' ? 0.8 : 0.2 }, MORAY_PALETTE);
    ctx.restore();

    for (const s of this.prey) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.fillStyle = '#c9d8b0';
      ctx.beginPath();
      ctx.ellipse(0, 0, s.r, s.r * 0.62, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#37451f';
      ctx.beginPath();
      ctx.arc(s.r * 0.4, -s.r * 0.1, s.r * 0.22, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    if (this.lure > 0.3) {
      ctx.strokeStyle = `rgba(246, 226, 138, ${0.4 * this.lure})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.mouthX(), this.player.y, FROGFISH.lureRange * this.lure, 0, TAU);
      ctx.stroke();
    }

    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE FROGFISH GARDEN', W / 2, 28, { size: 23, color: COLORS.text, glow: 'rgba(180, 200, 120, 0.5)', glowBlur: 16 });
    drawText(ctx, `LIVES ${this.lives}`, 24, 26, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < FROGFISH.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 48, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }

    const prog = clamp(this.eaten / FROGFISH.preyGoal, 0, 1);
    fillRoundRect(ctx, W - 264, 26, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 264, 26, 240 * prog, 10, 5, '#cfe08a');
    drawText(ctx, `MEALS ${this.eaten}/${FROGFISH.preyGoal}`, W - 264, 52, { size: 12, color: COLORS.textDim, align: 'left' });

    if (this.moray.state === 'charge') {
      drawText(ctx, 'THE MORAY FELT YOU MOVE!', W / 2, 56, { size: 14, color: COLORS.danger, alpha: 0.6 + 0.4 * Math.sin(this.time * 14) });
    } else if (this.player.speed < 60) {
      drawText(ctx, 'CAMOUFLAGED \u2014 PREY CANNOT SEE YOU', W / 2, 56, { size: 12, color: '#a8d88a', alpha: 0.85 });
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, W / 2, 56, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    drawText(ctx, 'WASD / ARROWS \u2014 CREEP      HOLD SPACE \u2014 WAVE THE LURE      ESC \u2014 BACK', W / 2, H - 14, {
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
    ctx.scale(1.6, 1.6);
    drawMorayBody(ctx, 30, { age: this.time, jawOpen: 1 }, MORAY_PALETTE);
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
    return 'THE FROGFISH GARDEN';
  }

  resultsHeadline() {
    return this.won ? 'PATIENT AS A STONE, DEADLY AS ONE TOO' : 'THE MORAY FOUND YOU';
  }

  resultsDetail() {
    return `${this.eaten} MEALS \u00B7 ${this.lives} LIVES LEFT`;
  }
}
