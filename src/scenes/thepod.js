import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { circleOverlap } from '../engine/collision.js';
import { Shark } from '../entities/shark.js';
import { drawDolphinBody } from '../entities/dolphin.js';
import { CONTROLS, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const LIVES = 3;
const SWEEPS = 6;
const CORAL_COLORS = ['#ff7f6b', '#ff9f43', '#e056a0', '#7bdff2', '#c1a3ff'];

export class ThePodScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'thepod';
  }

  buildRound() {
    this.phase = 'play';
    this.lives = LIVES;
    this.sweeps = 0;
    this.podActive = false;
    this.podTimer = 3;
    this.podDir = 1;
    this.warn = 0;
    this.dolphins = [];
    for (let i = 0; i < 5; i += 1) {
      this.dolphins.push({ x: 0, y: 0, size: rand(24, 34), active: false, phase: rand(0, TAU), vx: 0 });
    }
    this.corals = [];
    for (let i = 0; i < 5; i += 1) {
      this.corals.push({
        x: 140 + i * 170 + rand(-20, 20),
        y: LOGICAL_HEIGHT - 120 + rand(-20, 20),
        r: rand(66, 86),
        size: rand(30, 46),
        color: CORAL_COLORS[i % CORAL_COLORS.length],
        phase: rand(0, TAU),
      });
    }
    this.status = 'HIDE INSIDE THE CORAL WHEN THE POD SWEEPS';
    this.statusTimer = 3.4;
    this.scareTimer = 0;
    this.scareReason = '';
    const player = new Shark(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, { controls: CONTROLS.solo, pointer: true });
    player.noIdleFlip = true;
    this.players = [player];
    this.player = player;
  }

  firstPersonActor() {
    return this.player;
  }

  hidden() {
    for (const c of this.corals) {
      if (Math.hypot(this.player.x - c.x, this.player.y - c.y) < c.r * 0.85) return true;
    }
    return false;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 160, endFreq: 60, type: 'sawtooth', duration: 0.35, volume: 0.26 });
    if (this.lives <= 0) {
      this.finish(false);
      return true;
    }
    this.phase = 'scare';
    this.scareTimer = 1.2;
    return true;
  }

  respawn() {
    this.player.x = LOGICAL_WIDTH / 2;
    this.player.y = LOGICAL_HEIGHT / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.dolphins.forEach((d) => { d.active = false; });
    this.podActive = false;
    this.podTimer = 2.4;
    this.invuln = 1.6;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'THE POD LOST YOU — GET BACK TO COVER';
    this.statusTimer = 2;
  }

  updateRound(dt, input) {
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }
    this.player.update(dt, input);
    this.player.x = clamp(this.player.x, 30, LOGICAL_WIDTH - 30);
    this.player.y = clamp(this.player.y, 60, LOGICAL_HEIGHT - 40);
    for (const c of this.corals) c.phase += dt;
    this.warn = Math.max(0, this.warn - dt);

    if (!this.podActive) {
      this.podTimer -= dt;
      if (this.podTimer <= 0) {
        this.podActive = true;
        this.podDir = Math.random() < 0.5 ? -1 : 1;
        const startX = this.podDir > 0 ? -160 : LOGICAL_WIDTH + 160;
        const baseY = clamp(this.player.y, 120, LOGICAL_HEIGHT - 160);
        for (let i = 0; i < this.dolphins.length; i += 1) {
          const d = this.dolphins[i];
          d.active = true;
          d.x = startX - this.podDir * i * 80;
          d.y = clamp(baseY + (i - 2) * 58 + rand(-14, 14), 70, LOGICAL_HEIGHT - 60);
          d.vx = this.podDir * rand(280, 340);
          d.phase = rand(0, TAU);
        }
        this.warn = 1.6;
        this.game.audio.tone({ freq: 180, endFreq: 110, type: 'sine', duration: 0.5, volume: 0.2 });
      }
      return;
    }

    let anyOn = false;
    const cover = this.hidden();
    for (const d of this.dolphins) {
      if (!d.active) continue;
      d.x += d.vx * dt;
      d.phase += dt;
      if (!cover && this.invuln <= 0 && circleOverlap(this.player, { x: d.x, y: d.y, radius: d.size * 1.1 })) {
        if (this.catchPlayer('THE POD ATE YOU')) return;
      }
      const off = this.podDir > 0 ? d.x > LOGICAL_WIDTH + 200 : d.x < -200;
      if (off) d.active = false;
      else anyOn = true;
    }
    if (!anyOn) {
      this.podActive = false;
      this.podTimer = rand(2.2, 3.4);
      this.sweeps += 1;
      if (this.sweeps >= SWEEPS) {
        this.finish(true);
        return;
      }
      this.status = `SWEEPS SURVIVED ${this.sweeps}/${SWEEPS}`;
      this.statusTimer = 1.6;
    }
  }

  renderRound(ctx) {
    ctx.fillStyle = 'rgba(20, 70, 90, 0.35)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    for (const c of this.corals) this.renderCoral(ctx, c);
    for (const d of this.dolphins) {
      if (!d.active) continue;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.scale(d.vx >= 0 ? 1 : -1, 1);
      drawDolphinBody(ctx, d.size, { phase: d.phase });
      ctx.restore();
    }
    const cover = this.hidden();
    if (cover) {
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
    if (this.phase === 'scare') this.renderScare(ctx);
  }

  renderCoral(ctx, c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(Math.sin(this.time * 1.2 + c.phase) * 0.06);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = c.color;
    ctx.lineCap = 'round';
    ctx.fillStyle = `${c.color}55`;
    for (let i = -1; i <= 1; i += 1) {
      const s = c.size * (i === 0 ? 1 : 0.7);
      ctx.lineWidth = s * 0.16;
      ctx.beginPath();
      ctx.moveTo(i * c.size * 0.5, 0);
      ctx.lineTo(i * c.size * 0.5, -s);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, c.r * 0.7, c.r * 0.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderScare(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    ctx.scale(2.4, 2.4);
    drawDolphinBody(ctx, 30, { phase: this.time * 3 });
    ctx.restore();
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE POD', LOGICAL_WIDTH / 2, 34, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(143, 224, 239, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 30, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < LIVES; i += 1) {
      fillCircle(ctx, 42 + i * 22, 52, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    drawText(ctx, `SWEEPS ${this.sweeps}/${SWEEPS}`, LOGICAL_WIDTH - 24, 30, { size: 15, color: COLORS.accent, align: 'right' });
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, (240 * this.sweeps) / SWEEPS, 10, 5, COLORS.accent);
    if (this.podActive) {
      drawText(ctx, 'POD INCOMING — GET INSIDE THE CORAL!', LOGICAL_WIDTH / 2, 92, {
        size: 14,
        color: COLORS.danger,
        alpha: 0.55 + 0.45 * Math.sin(this.time * 12),
      });
    } else if (this.hidden()) {
      drawText(ctx, 'HIDDEN', LOGICAL_WIDTH / 2, 92, { size: 13, color: '#8fe0ef', alpha: 0.85 });
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 92, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    drawText(ctx, 'WASD / DRAG — SWIM      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.72,
    });
  }

  backScene() {
    return 'minigames';
  }

  resultsTitle() {
    return 'THE POD';
  }

  resultsHeadline() {
    return this.won ? 'YOU OUTLASTED THE POD' : 'THE POD FOUND YOU';
  }

  resultsDetail() {
    return `${this.sweeps}/${SWEEPS} SWEEPS SURVIVED`;
  }
}
