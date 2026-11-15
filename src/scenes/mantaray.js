import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { circleOverlap } from '../engine/collision.js';
import { MantaRay, drawMantaBody } from '../entities/mantaray.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import {
  CONTROLS,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const ARENA = { top: 60, bottom: LOGICAL_HEIGHT - 50 };
const LIVES = 3;

export class MantaScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'manta';
  }

  buildRound() {
    this.phase = 'play';
    this.worldLength = 5200;
    this.startX = 260;
    this.exitZone = { x: this.worldLength - 260 };
    this.lives = LIVES;
    this.invuln = 0;
    this.rings = [];
    this.jellies = [];
    this.ringsPassed = 0;
    this.status = 'GLIDE THROUGH THE RINGS — HOLD UP/SPACE TO FLAP';
    this.statusTimer = 3;
    this.scareTimer = 0;
    this.scareReason = '';
    for (let i = 0; i < 16; i += 1) {
      this.rings.push({
        x: this.startX + 260 + i * 300 + rand(-40, 40),
        y: rand(ARENA.top + 60, ARENA.bottom - 60),
        radius: 62,
        passed: false,
        phase: rand(0, TAU),
      });
    }
    for (let i = 0; i < 22; i += 1) {
      this.jellies.push({
        x: this.startX + 200 + i * 220 + rand(-60, 60),
        y: rand(ARENA.top + 40, ARENA.bottom - 40),
        radius: 22,
        phase: rand(0, TAU),
        drift: rand(0.6, 1.4),
      });
    }
    const player = new MantaRay(this.startX, LOGICAL_HEIGHT / 2, { controls: CONTROLS.solo, pointer: true });
    player.maxX = this.worldLength;
    player.noIdleFlip = true;
    this.players = [player];
    this.player = player;
  }

  firstPersonActor() {
    return this.players[0] ?? null;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 130, endFreq: 50, type: 'sawtooth', duration: 0.4, volume: 0.28 });
    if (this.lives <= 0) {
      this.finish(false);
      return true;
    }
    this.phase = 'scare';
    this.scareTimer = 1.4;
    return true;
  }

  respawn() {
    const player = this.player;
    player.x = Math.max(this.startX, player.x - 220);
    player.y = LOGICAL_HEIGHT / 2;
    player.vx = 0;
    player.vy = 0;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'SHAKE IT OFF — KEEP GLIDING';
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
    const player = this.player;
    player.update(dt, input);
    this.camX = clamp(player.x - LOGICAL_WIDTH * 0.4, 0, Math.max(0, this.worldLength - LOGICAL_WIDTH));
    for (const ring of this.rings) {
      ring.phase += dt;
      if (!ring.passed && circleOverlap(player, { x: ring.x, y: ring.y, radius: ring.radius * 0.62 })) {
        ring.passed = true;
        this.ringsPassed += 1;
        this.flash = Math.max(this.flash, 0.25);
        this.game.audio.tone({ freq: 620, endFreq: 980, type: 'triangle', duration: 0.12, volume: 0.18 });
        this.particles.burst(ring.x, ring.y, { count: 12, speed: 180, life: 0.5, colors: ['#8fe0ef', '#ffffff'], buoyancy: -20 });
      }
    }
    for (const j of this.jellies) {
      j.phase += dt;
      j.y += Math.sin(j.phase) * j.drift * 12 * dt;
      if (circleOverlap(player, j) && this.catchPlayer('A STINGING JELLYFISH')) return;
    }
    for (const ring of this.rings) {
      if (player.x > ring.x + ring.radius + 20 && !ring.passed) {
        ring.passed = true;
      }
    }
    if (player.x >= this.exitZone.x) this.finish(true);
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(-this.camX, 0);
    ctx.fillStyle = 'rgba(6, 26, 34, 0.5)';
    ctx.fillRect(this.camX - 40, ARENA.top, LOGICAL_WIDTH + 80, ARENA.bottom - ARENA.top);
    this.renderExit(ctx);
    for (const ring of this.rings) this.renderRing(ctx, ring);
    for (const j of this.jellies) this.renderJelly(ctx, j);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
    ctx.restore();
    if (this.phase === 'scare') this.renderScare(ctx);
  }

  renderExit(ctx) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
    ctx.fillRect(this.exitZone.x - 50, 0, 100, LOGICAL_HEIGHT);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.exitZone.x - 50, 0, 100, LOGICAL_HEIGHT);
    drawText(ctx, 'OPEN WATER', this.exitZone.x, 40, { size: 16, color: COLORS.accent });
  }

  renderRing(ctx, ring) {
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 3 + ring.phase);
    ctx.save();
    ctx.globalAlpha = ring.passed ? 0.25 : 0.55 + pulse * 0.35;
    ctx.strokeStyle = ring.passed ? 'rgba(143, 224, 239, 0.4)' : '#8fe0ef';
    ctx.lineWidth = 6 + pulse * 3;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderJelly(ctx, j) {
    const r = j.radius;
    const pulse = 1 + Math.sin(j.phase * 3) * 0.12;
    ctx.save();
    ctx.translate(j.x, j.y);
    ctx.strokeStyle = 'rgba(255, 143, 163, 0.6)';
    ctx.lineWidth = r * 0.09;
    for (let i = 0; i < 5; i += 1) {
      const off = (i - 2) * r * 0.34;
      ctx.beginPath();
      ctx.moveTo(off, r * 0.3);
      ctx.quadraticCurveTo(off + Math.sin(j.phase * 3 + i) * r * 0.2, r * 1.1, off * 1.2, r * 1.7);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-r * pulse, r * 0.2);
    ctx.quadraticCurveTo(-r * 1.2 * pulse, -r * pulse, 0, -r * 1.1 * pulse);
    ctx.quadraticCurveTo(r * 1.2 * pulse, -r * pulse, r * pulse, r * 0.2);
    ctx.quadraticCurveTo(0, r * 0.5, -r * pulse, r * 0.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 143, 163, 0.5)';
    ctx.fill();
    ctx.strokeStyle = '#ff8fa3';
    ctx.lineWidth = r * 0.07;
    ctx.stroke();
    ctx.restore();
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.4, {
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        time: this.time,
        caption: 'OUCH — SHAKE IT OFF!',
        radius: 66,
      });
      return;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    const s = 1.3 + (1 - this.scareTimer / 1.4) * 1.4;
    ctx.scale(s, s);
    drawMantaBody(ctx, 30, { age: this.time, flap: 0 });
    ctx.restore();
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'MANTA RAY GLIDE', LOGICAL_WIDTH / 2, 34, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(120, 220, 230, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 30, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < LIVES; i += 1) {
      fillCircle(ctx, 42 + i * 22, 52, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    drawText(ctx, `RINGS ${this.ringsPassed}/${this.rings.length}`, LOGICAL_WIDTH - 24, 30, {
      size: 15,
      color: COLORS.accent,
      align: 'right',
    });
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 66, { size: 13, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    drawText(ctx, 'WASD / DRAG — GLIDE      UP / SPACE — FLAP      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.72,
    });
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
    return 'MANTA RAY GLIDE';
  }

  resultsHeadline() {
    return this.won ? 'YOU FOUND OPEN WATER' : 'TANGLED IN THE BLOOM';
  }

  resultsDetail() {
    return `${this.ringsPassed}/${this.rings.length} RINGS`;
  }
}
