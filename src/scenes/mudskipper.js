import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { drawMudskipper } from '../entities/realfish.js';
import { drawKelpCrabBody } from '../entities/kelpcrab.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import { CONTROLS, COLORS, MUDSKIPPER, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const BANK_X = W * 0.5;
const SHELF_Y = 300;

export class MudskipperScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'mudskipper';
  }

  buildRound() {
    const C = MUDSKIPPER;
    this.phase = 'play';
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.eaten = 0;
    this.status = 'HOP ONTO THE MUD FOR FLIES \u2014 DIVE BACK IN TO SHAKE THE CRAB';
    this.statusTimer = 4.4;
    this.bugs = [];
    for (let i = 0; i < C.bugCount; i += 1) this.spawnBug();

    this.player = {
      x: W * 0.3,
      y: 380,
      vx: 0,
      vy: 0,
      radius: C.playerRadius,
      facing: 1,
      heading: 0,
      speed: 0,
      noIdleFlip: true,
      onGround: false,
      render: (ctx) => {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.scale(this.player.facing, 1);
        drawMudskipper(ctx, this.player.radius * 1.1, { age: this.time });
        ctx.restore();
      },
    };
    this.players = [this.player];

    this.crab = {
      x: W * 0.8,
      vx: -C.crabSpeed,
      radius: C.crabRadius,
      heading: Math.PI,
      phase: rand(0, TAU),
    };
  }

  firstPersonActor() {
    return this.player;
  }

  spawnBug() {
    this.bugs.push({
      x: rand(BANK_X + 60, W - 60),
      y: rand(SHELF_Y - 170, SHELF_Y - 50),
      vx: rand(-24, 24),
      vy: rand(-10, 10),
      phase: rand(0, TAU),
      r: 8,
    });
  }

  get onBank() {
    return this.player.x >= BANK_X;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 140, endFreq: 50, type: 'sawtooth', duration: 0.4, volume: 0.3 });
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
    p.x = W * 0.3;
    p.y = 380;
    p.vx = 0;
    p.vy = 0;
    const c = this.crab;
    c.x = W * 0.8;
    c.vx = -MUDSKIPPER.crabSpeed;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'BACK IN THE WATER \u2014 THE CRAB LOST YOU';
    this.statusTimer = 2.4;
  }

  updateRound(dt, input) {
    const C = MUDSKIPPER;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }

    const p = this.player;
    const left = input.isDown(CONTROLS.solo.left) ? 1 : 0;
    const right = input.isDown(CONTROLS.solo.right) ? 1 : 0;
    const up = input.isDown(CONTROLS.solo.up) ? 1 : 0;
    const down = input.isDown(CONTROLS.solo.down) ? 1 : 0;
    const dirX = right - left;
    const dirY = down - up;
    const jump = input.wasPressed('confirm') || input.wasPressed('tool');

    if (this.onBank) {
      p.vx += (dirX * C.walkSpeed - p.vx) * (1 - Math.exp(-8 * dt));
      p.vy += C.gravity * dt;
      if (jump && p.onGround) {
        p.vy = -C.jump;
        p.onGround = false;
        this.game.audio.tone({ freq: 300, endFreq: 520, type: 'triangle', duration: 0.1, volume: 0.14 });
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y >= SHELF_Y - p.radius) {
        p.y = SHELF_Y - p.radius;
        p.vy = 0;
        p.onGround = true;
      } else {
        p.onGround = false;
      }
    } else {
      p.vx += (dirX * C.swimSpeed - p.vx) * (1 - Math.exp(-8 * dt));
      p.vy += (dirY * C.swimSpeed - p.vy) * (1 - Math.exp(-8 * dt));
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.onGround = false;
    }
    p.x = clamp(p.x, 20, W - 20);
    p.y = clamp(p.y, C.topBound, C.bottomBound);
    if (dirX !== 0) p.facing = dirX > 0 ? 1 : -1;
    p.speed = Math.hypot(p.vx, p.vy);
    if (p.speed > 20) p.heading = Math.atan2(p.vy, p.vx);

    for (const b of this.bugs) {
      b.phase += dt;
      b.x += (b.vx + Math.sin(b.phase * 3) * 20) * dt;
      b.y += b.vy * dt;
      if (b.x < BANK_X + 30) b.vx = Math.abs(b.vx);
      if (b.x > W - 30) b.vx = -Math.abs(b.vx);
      if (b.y < SHELF_Y - 190) b.vy = Math.abs(b.vy);
      if (b.y > SHELF_Y - 40) b.vy = -Math.abs(b.vy);
      if (circleOverlap(p, { x: b.x, y: b.y, radius: b.r })) {
        b.dead = true;
        this.eaten += 1;
        this.particles.burst(b.x, b.y, { count: 8, speed: 110, life: 0.4, colors: ['#d0e08a', '#8fbf5a'], buoyancy: -20 });
        this.game.audio.tone({ freq: 640, endFreq: 980, type: 'triangle', duration: 0.1, volume: 0.16 });
      }
    }
    this.bugs = this.bugs.filter((b) => !b.dead);
    if (this.bugs.length < MUDSKIPPER.bugCount && Math.random() < dt * 0.6) this.spawnBug();

    const c = this.crab;
    c.phase += dt;
    if (this.onBank && p.x >= BANK_X) {
      const dir = Math.sign(p.x - c.x) || 1;
      c.vx += (dir * C.crabSpeed * 2.2 - c.vx) * (1 - Math.exp(-3 * dt));
    } else {
      if (c.x < BANK_X + 40) c.vx = Math.abs(c.vx);
      if (c.x > W - 40) c.vx = -Math.abs(c.vx);
      if (Math.abs(c.vx) < 10) c.vx = -C.crabSpeed;
    }
    c.x = clamp(c.x + c.vx * dt, BANK_X + 20, W - 20);
    c.heading = Math.atan2(0, c.vx);

    if (this.onBank && this.invuln <= 0 && circleOverlap(p, { x: c.x, y: SHELF_Y - c.radius, radius: c.radius })) {
      if (this.catchPlayer('THE CRAB PINCHED YOU ON THE MUD')) return;
    }

    this.particles.update(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);

    if (this.eaten >= C.bugGoal) this.finish(true);
  }

  renderRound(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#a9c98f');
    sky.addColorStop(0.5, '#6ba07a');
    sky.addColorStop(1, '#3a6a63');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(90, 150, 170, 0.75)';
    ctx.fillRect(0, SHELF_Y - 40, BANK_X, H);

    ctx.fillStyle = '#6b5a3a';
    ctx.beginPath();
    ctx.moveTo(BANK_X, SHELF_Y);
    ctx.lineTo(W, SHELF_Y);
    ctx.lineTo(W, H);
    ctx.lineTo(BANK_X - 30, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(50, 42, 28, 0.4)';
    for (let i = 0; i < 24; i += 1) {
      ctx.beginPath();
      ctx.arc(BANK_X + 20 + ((i * 71) % (W - BANK_X - 20)), SHELF_Y + 14 + (i % 5) * 22, 3, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(200, 230, 240, 0.4)';
    for (let i = 0; i < 8; i += 1) {
      const sx = 40 + i * 70;
      const sy = SHELF_Y - 40 + Math.sin(this.time * 1.5 + i) * 4;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 22, 5, 0, 0, TAU);
      ctx.fill();
    }

    for (const b of this.bugs) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = '#2f3a1c';
      ctx.beginPath();
      ctx.ellipse(0, 0, b.r, b.r * 0.6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(220, 235, 190, 0.7)';
      const sway = Math.sin(b.phase * 10) * 0.4;
      ctx.beginPath();
      ctx.ellipse(-b.r * 0.3, -b.r * 0.4, b.r * 0.7, b.r * 0.3, -0.5 + sway, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(b.r * 0.3, -b.r * 0.4, b.r * 0.7, b.r * 0.3, 0.5 - sway, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.crab.x, SHELF_Y - this.crab.radius);
    ctx.scale(this.crab.vx >= 0 ? 1 : -1, 1);
    drawKelpCrabBody(ctx, this.crab.radius * 0.95, { age: this.time + this.crab.phase, legPhase: this.time * 8 });
    ctx.restore();

    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE TIDE-POOL WALKER', W / 2, 28, { size: 23, color: COLORS.text, glow: 'rgba(180, 220, 160, 0.5)', glowBlur: 16 });
    drawText(ctx, `LIVES ${this.lives}`, 24, 26, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < MUDSKIPPER.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 48, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }

    const prog = clamp(this.eaten / MUDSKIPPER.bugGoal, 0, 1);
    fillRoundRect(ctx, W - 264, 26, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 264, 26, 240 * prog, 10, 5, '#a8d86a');
    drawText(ctx, `FLIES ${this.eaten}/${MUDSKIPPER.bugGoal}`, W - 264, 52, { size: 12, color: COLORS.textDim, align: 'left' });

    if (this.onBank) {
      drawText(ctx, 'ON THE MUD \u2014 THE CRAB IS COMING!', W / 2, 56, { size: 13, color: COLORS.danger, alpha: 0.85 });
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, W / 2, 56, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    drawText(ctx, 'WASD / ARROWS \u2014 MOVE      SPACE \u2014 HOP      ESC \u2014 BACK', W / 2, H - 14, {
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
    ctx.scale(1.8, 1.8);
    drawKelpCrabBody(ctx, 30, { age: this.time, legPhase: 0 });
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
    return 'THE TIDE-POOL WALKER';
  }

  resultsHeadline() {
    return this.won ? 'YOU RULED THE MUDFLATS' : 'THE CRAB GOT YOU';
  }

  resultsDetail() {
    return `${this.eaten} FLIES \u00B7 ${this.lives} LIVES LEFT`;
  }
}
