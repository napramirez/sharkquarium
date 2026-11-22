import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { Shark } from '../entities/shark.js';
import { drawSawfish, drawBullShark } from '../entities/realfish.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import { CONTROLS, COLORS, SAWFISH, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const FLOOR = SAWFISH.floorY;

export class SawfishScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'sawfish';
  }

  buildRound() {
    const C = SAWFISH;
    this.phase = 'play';
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.eaten = 0;
    this.saw = 0;
    this.status = 'HOLD SPACE TO SWEEP THE SAND \u2014 SHALLOW BURIED PREY, THEN EAT IT';
    this.statusTimer = 4.4;
    this.prey = [];
    for (let i = 0; i < C.preyCount; i += 1) {
      this.prey.push({
        x: rand(120, W - 120),
        y: FLOOR - 6,
        state: 'buried',
        vx: 0,
        vy: 0,
        phase: rand(0, TAU),
        r: 10,
      });
    }

    const player = new Shark(W * 0.4, FLOOR - 60, { controls: CONTROLS.solo, pointer: true, maxX: W });
    player.noIdleFlip = true;
    player.render = (ctx) => {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.facing, 1);
      drawSawfish(ctx, player.radius * 0.9, { age: this.time, saw: this.saw });
      ctx.restore();
    };
    this.players = [player];
    this.player = player;

    this.bull = {
      x: 120,
      y: H * 0.35,
      vx: C.bullSpeed,
      vy: 0,
      radius: C.bullRadius,
      heading: 0,
      state: 'patrol',
      timer: 0,
      patrolY: H * 0.4,
    };
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
    p.y = FLOOR - 60;
    p.vx = 0;
    p.vy = 0;
    const b = this.bull;
    b.x = 120;
    b.y = H * 0.35;
    b.vx = SAWFISH.bullSpeed;
    b.vy = 0;
    b.state = 'patrol';
    b.timer = 0;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'THE BULL LOST THE TRAIL \u2014 SWEEP AGAIN';
    this.statusTimer = 2.4;
  }

  updateRound(dt, input) {
    const C = SAWFISH;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }

    const p = this.player;
    const sweeping = input.isDown('confirm') || input.isDown('tool');
    this.saw += ((sweeping ? 1 : 0) - this.saw) * (1 - Math.exp(-8 * dt));

    p.update(dt, input);
    if (this.saw > 0.5) {
      p.vx *= 0.4;
      p.vy *= 0.4;
    }
    p.x = clamp(p.x, 60, W - 40);
    p.y = clamp(p.y, C.topBound, C.bottomBound - 20);

    const sawX = p.x + p.facing * p.radius * 3.0;
    for (const s of this.prey) {
      s.phase += dt;
      if (s.state === 'buried') {
        if (this.saw > 0.6 && Math.abs(s.x - sawX) < p.radius * 1.2 && p.y > FLOOR - 90) {
          s.state = 'out';
          s.vy = -rand(60, 110);
          s.vx = rand(-30, 30);
          this.particles.burst(s.x, FLOOR - 4, { count: 12, speed: 130, life: 0.5, colors: ['#d8cba0', '#f0e6c4'], buoyancy: 20 });
          this.game.audio.tone({ freq: 220, endFreq: 420, type: 'triangle', duration: 0.14, volume: 0.16 });
        }
      } else if (s.state === 'out') {
        s.vy += 220 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.y > FLOOR - 20) {
          s.y = FLOOR - 20;
          s.vy *= -0.3;
        }
        if (circleOverlap(p, { x: s.x, y: s.y, radius: s.r })) {
          s.state = 'eaten';
          this.eaten += 1;
          this.particles.burst(s.x, s.y, { count: 10, speed: 130, life: 0.45, colors: ['#f0b7a0', '#ffd9c0'], buoyancy: -20 });
          this.game.audio.tone({ freq: 620, endFreq: 940, type: 'triangle', duration: 0.1, volume: 0.16 });
        }
      }
    }
    this.prey = this.prey.filter((s) => s.state !== 'eaten');

    const b = this.bull;
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    const seen = d < C.bullSight && (this.saw < 0.4 || d < C.bullSight * 0.6);
    if (b.state === 'patrol') {
      b.timer -= dt;
      if (b.timer <= 0) {
        b.timer = rand(1.8, 3.2);
        b.patrolY = rand(C.topBound + 30, C.bottomBound - 60);
      }
      b.vx += (Math.sign(b.vx || 1) * C.bullSpeed - b.vx) * (1 - Math.exp(-1.5 * dt));
      b.vy += ((b.patrolY - b.y) * 0.7 - b.vy) * (1 - Math.exp(-1.5 * dt));
      if (b.x < 80) b.vx = Math.abs(b.vx);
      else if (b.x > W - 80) b.vx = -Math.abs(b.vx);
      if (seen) {
        b.state = 'charge';
        b.timer = 2.4;
        this.game.audio.tone({ freq: 120, endFreq: 70, type: 'sawtooth', duration: 0.35, volume: 0.22 });
      }
    } else if (b.state === 'charge') {
      b.timer -= dt;
      const dx = p.x - b.x;
      const dy = p.y - b.y;
      const dd = Math.hypot(dx, dy) || 1;
      b.vx += ((dx / dd) * C.bullChargeSpeed - b.vx) * (1 - Math.exp(-3 * dt));
      b.vy += ((dy / dd) * C.bullChargeSpeed - b.vy) * (1 - Math.exp(-3 * dt));
      if (this.invuln <= 0 && circleOverlap(p, { x: b.x, y: b.y, radius: b.radius + 4 })) {
        if (this.catchPlayer('THE BULL SHARK RUSHED YOU IN THE OPEN')) return;
      }
      if (b.timer <= 0) {
        b.state = 'recover';
        b.timer = C.bullRecover;
      }
    } else {
      b.timer -= dt;
      b.vx *= Math.exp(-2.5 * dt);
      b.vy *= Math.exp(-2.5 * dt);
      if (b.timer <= 0) b.state = 'patrol';
    }
    b.x = clamp(b.x + b.vx * dt, 40, W - 40);
    b.y = clamp(b.y + b.vy * dt, C.topBound, C.bottomBound - 40);
    b.heading = Math.atan2(b.vy, b.vx);

    this.particles.update(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);

    if (this.eaten >= C.preyGoal) this.finish(true);
  }

  renderRound(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#3f93b0');
    sky.addColorStop(0.6, '#2b7188');
    sky.addColorStop(1, '#164a5c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#c9bd94';
    ctx.beginPath();
    ctx.moveTo(0, FLOOR);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, FLOOR + Math.sin(x * 0.02) * 6);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(120, 108, 74, 0.4)';
    for (let i = 0; i < 20; i += 1) {
      ctx.beginPath();
      ctx.arc((i * 173) % W, FLOOR + 20 + (i % 4) * 18, 3, 0, TAU);
      ctx.fill();
    }

    for (const s of this.prey) {
      if (s.state === 'buried') {
        ctx.strokeStyle = 'rgba(120, 108, 74, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, FLOOR, 10, Math.PI, TAU);
        ctx.stroke();
      } else {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.fillStyle = '#f0b7a0';
        ctx.beginPath();
        ctx.ellipse(0, 0, s.r, s.r * 0.7, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(80, 40, 34, 0.5)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }
    }

    const b = this.bull;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.heading);
    if (Math.cos(b.heading) < 0) ctx.scale(1, -1);
    drawBullShark(ctx, b.radius, { age: this.time });
    ctx.restore();

    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE SAWFISH FLATS', W / 2, 28, { size: 23, color: COLORS.text, glow: 'rgba(210, 200, 160, 0.5)', glowBlur: 16 });
    drawText(ctx, `LIVES ${this.lives}`, 24, 26, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < SAWFISH.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 48, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }

    const prog = clamp(this.eaten / SAWFISH.preyGoal, 0, 1);
    fillRoundRect(ctx, W - 264, 26, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 264, 26, 240 * prog, 10, 5, '#e8d5b5');
    drawText(ctx, `PREY ${this.eaten}/${SAWFISH.preyGoal}`, W - 264, 52, { size: 12, color: COLORS.textDim, align: 'left' });

    if (this.saw > 0.5) {
      drawText(ctx, 'SWEEPING THE SAND \u2014 EXPOSED!', W / 2, 56, { size: 13, color: COLORS.danger, alpha: 0.85 });
    } else if (this.bull.state === 'charge') {
      drawText(ctx, 'THE BULL SEES YOU', W / 2, 56, { size: 14, color: COLORS.danger, alpha: 0.6 + 0.4 * Math.sin(this.time * 14) });
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, W / 2, 56, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    drawText(ctx, 'WASD / ARROWS \u2014 SWIM      HOLD SPACE \u2014 SWEEP THE SAND      ESC \u2014 BACK', W / 2, H - 14, {
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
    ctx.scale(1.4, 1.4);
    drawBullShark(ctx, 46, { age: this.time });
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
    return 'THE SAWFISH FLATS';
  }

  resultsHeadline() {
    return this.won ? 'YOU PICKED THE FLATS CLEAN' : 'THE BULL SHARK GOT YOU';
  }

  resultsDetail() {
    return `${this.eaten} PREY \u00B7 ${this.lives} LIVES LEFT`;
  }
}
