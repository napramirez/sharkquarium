import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { Shark } from '../entities/shark.js';
import { drawOceanSunfish, drawSeaLion } from '../entities/realfish.js';
import { drawMoonJellyBody } from '../entities/moonjelly.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import { CONTROLS, COLORS, SUNFISH, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const SURFACE = SUNFISH.surfaceY;

export class SunfishScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'sunfish';
  }

  buildRound() {
    const C = SUNFISH;
    this.phase = 'play';
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.eaten = 0;
    this.oxygen = 1;
    this.status = 'GULP AIR AT THE SURFACE, THEN DIVE FOR JELLIES';
    this.statusTimer = 4.4;
    this.jellies = [];
    for (let i = 0; i < C.jellyCount; i += 1) this.spawnJelly();

    const player = new Shark(W * 0.5, H * 0.5, { controls: CONTROLS.solo, pointer: true, maxX: W });
    player.noIdleFlip = true;
    player.maxSpeed = C.maxSpeed;
    player.radius = C.playerRadius;
    player.render = (ctx) => {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.facing, 1);
      drawOceanSunfish(ctx, player.radius, { age: this.time });
      ctx.restore();
    };
    this.players = [player];
    this.player = player;

    this.lion = {
      x: 120,
      y: H * 0.3,
      vx: C.seLionSpeed,
      vy: 0,
      radius: C.seLionRadius,
      heading: 0,
      state: 'patrol',
      timer: 0,
      patrolY: H * 0.3,
    };
  }

  firstPersonActor() {
    return this.player;
  }

  spawnJelly() {
    this.jellies.push({
      x: rand(60, W - 60),
      y: rand(SUNFISH.topBound + 40, SUNFISH.bottomBound - 30),
      vx: rand(-18, 18),
      vy: rand(-12, 12),
      phase: rand(0, TAU),
      r: 18,
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
    p.x = W * 0.5;
    p.y = H * 0.35;
    p.vx = 0;
    p.vy = 0;
    this.oxygen = 1;
    const l = this.lion;
    l.x = 120;
    l.y = H * 0.3;
    l.vx = SUNFISH.seLionSpeed;
    l.vy = 0;
    l.state = 'patrol';
    l.timer = 0;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'YOU BREACHED \u2014 DIVE AGAIN';
    this.statusTimer = 2.4;
  }

  updateRound(dt, input) {
    const C = SUNFISH;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }

    const p = this.player;
    p.update(dt, input);
    p.x = clamp(p.x, 60, W - 60);
    p.y = clamp(p.y, C.topBound, C.bottomBound);
    p.y += C.sink * dt;
    p.y = clamp(p.y, C.topBound, C.bottomBound);

    const atSurface = p.y < SURFACE;
    this.oxygen = clamp(this.oxygen + (atSurface ? C.oxygenRefill : -C.oxygenDrain) * dt, 0, 1);
    if (this.oxygen <= 0 && this.invuln <= 0) {
      if (this.catchPlayer('YOU COULD NOT HOLD YOUR BREATH LONG ENOUGH')) return;
    }

    while (this.jellies.length < C.jellyCount) this.spawnJelly();
    for (const j of this.jellies) {
      j.phase += dt;
      j.x += j.vx * dt;
      j.y += (j.vy + Math.sin(j.phase * 1.5) * 8) * dt;
      if (j.x < 50) j.vx = Math.abs(j.vx);
      if (j.x > W - 50) j.vx = -Math.abs(j.vx);
      if (j.y < C.topBound + 30) j.vy = Math.abs(j.vy);
      if (j.y > C.bottomBound - 20) j.vy = -Math.abs(j.vy);
      if (circleOverlap(p, { x: j.x, y: j.y, radius: j.r })) {
        j.dead = true;
        this.eaten += 1;
        this.particles.burst(j.x, j.y, { count: 12, speed: 130, life: 0.5, colors: ['#ff9ab8', '#c9a6ff'], buoyancy: -10 });
        this.game.audio.tone({ freq: 620, endFreq: 940, type: 'triangle', duration: 0.1, volume: 0.16 });
      }
    }
    this.jellies = this.jellies.filter((j) => !j.dead);

    const l = this.lion;
    const d = Math.hypot(p.x - l.x, p.y - l.y);
    if (l.state === 'patrol') {
      l.timer -= dt;
      if (l.timer <= 0) {
        l.timer = rand(1.6, 3);
        l.patrolY = rand(C.topBound + 40, C.bottomBound - 60);
      }
      l.vx += (Math.sign(l.vx || 1) * C.seLionSpeed - l.vx) * (1 - Math.exp(-1.5 * dt));
      l.vy += ((l.patrolY - l.y) * 0.7 - l.vy) * (1 - Math.exp(-1.5 * dt));
      if (l.x < 80) l.vx = Math.abs(l.vx);
      else if (l.x > W - 80) l.vx = -Math.abs(l.vx);
      if (d < 340) {
        l.state = 'charge';
        l.timer = 1.8;
        this.game.audio.tone({ freq: 140, endFreq: 80, type: 'sawtooth', duration: 0.3, volume: 0.22 });
      }
    } else if (l.state === 'charge') {
      l.timer -= dt;
      const dx = p.x - l.x;
      const dy = p.y - l.y;
      const dd = Math.hypot(dx, dy) || 1;
      l.vx += ((dx / dd) * C.seLionBat - l.vx) * (1 - Math.exp(-3 * dt));
      l.vy += ((dy / dd) * C.seLionBat - l.vy) * (1 - Math.exp(-3 * dt));
      if (this.invuln <= 0 && circleOverlap(p, { x: l.x, y: l.y, radius: l.radius + 6 })) {
        if (this.catchPlayer('THE SEA LION BATTED YOU LIKE A TOY')) return;
      }
      if (l.timer <= 0) {
        l.state = 'recover';
        l.timer = 1.4;
      }
    } else {
      l.timer -= dt;
      l.vx *= Math.exp(-2.5 * dt);
      l.vy *= Math.exp(-2.5 * dt);
      if (l.timer <= 0) l.state = 'patrol';
    }
    l.x = clamp(l.x + l.vx * dt, 50, W - 50);
    l.y = clamp(l.y + l.vy * dt, C.topBound, C.bottomBound);
    l.heading = Math.atan2(l.vy, l.vx);

    this.particles.update(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);

    if (this.eaten >= C.jellyGoal) this.finish(true);
  }

  renderRound(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#a9d8ea');
    sky.addColorStop(0.22, '#3f95bd');
    sky.addColorStop(0.6, '#1f6488');
    sky.addColorStop(1, '#0a3250');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#eaffff';
    for (let i = 0; i < 5; i += 1) {
      const bx = (this.time * 10 + i * 240) % (W + 300) - 150;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 70, 0);
      ctx.lineTo(bx + 250, H);
      ctx.lineTo(bx + 150, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = `rgba(200, 240, 255, ${atSurfaceGlow(this.player.y)})`;
    ctx.fillRect(0, SURFACE - 10, W, 12);

    for (const j of this.jellies) {
      ctx.save();
      ctx.translate(j.x, j.y);
      drawMoonJellyBody(ctx, j.r, { age: this.time, pulsePhase: j.phase });
      ctx.restore();
    }

    const l = this.lion;
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.heading);
    if (Math.cos(l.heading) < 0) ctx.scale(1, -1);
    drawSeaLion(ctx, l.radius, { age: this.time });
    ctx.restore();

    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE SUNFISH DRIFT', W / 2, 28, { size: 23, color: COLORS.text, glow: 'rgba(150, 210, 240, 0.5)', glowBlur: 16 });
    drawText(ctx, `LIVES ${this.lives}`, 24, 26, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < SUNFISH.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 48, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }

    const prog = clamp(this.eaten / SUNFISH.jellyGoal, 0, 1);
    fillRoundRect(ctx, W - 264, 26, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 264, 26, 240 * prog, 10, 5, '#c9a6ff');
    drawText(ctx, `JELLIES ${this.eaten}/${SUNFISH.jellyGoal}`, W - 264, 52, { size: 12, color: COLORS.textDim, align: 'left' });

    drawText(ctx, 'AIR', W - 264, 76, { size: 11, color: COLORS.textDim, align: 'left' });
    fillRoundRect(ctx, W - 180, 68, 156, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 180, 68, 156 * this.oxygen, 10, 5, this.oxygen < 0.3 ? COLORS.danger : '#8fe0ef');

    if (this.player.y < SURFACE) {
      drawText(ctx, 'GULPING AIR AT THE SURFACE', W / 2, 56, { size: 13, color: '#bfe9ff', alpha: 0.85 });
    } else if (this.lion.state === 'charge') {
      drawText(ctx, 'THE SEA LION IS CHARGING!', W / 2, 56, { size: 14, color: COLORS.danger, alpha: 0.6 + 0.4 * Math.sin(this.time * 14) });
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, W / 2, 56, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    drawText(ctx, 'WASD / ARROWS \u2014 SWIM      RISE TO THE SURFACE FOR AIR      ESC \u2014 BACK', W / 2, H - 14, {
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
    drawSeaLion(ctx, 40, { age: this.time });
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
    return 'THE SUNFISH DRIFT';
  }

  resultsHeadline() {
    return this.won ? 'YOU DRIFTED THE WHOLE COLUMN' : 'THE DRIFT BEAT YOU';
  }

  resultsDetail() {
    return `${this.eaten} JELLIES \u00B7 ${this.lives} LIVES LEFT`;
  }
}

function atSurfaceGlow(y) {
  return y < SURFACE ? 0.18 : 0.06;
}
