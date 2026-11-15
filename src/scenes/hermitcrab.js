import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { circleOverlap } from '../engine/collision.js';
import { HermitCrab, drawHermitBody } from '../entities/hermitcrab.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import {
  CONTROLS,
  COLORS,
  HERMIT,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const LIVES = 3;
const FLOOR = LOGICAL_HEIGHT - 58;

export class HermitCrabScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'hermitcrab';
  }

  buildRound() {
    this.phase = 'play';
    this.worldLength = 4600;
    this.startX = 200;
    this.exitZone = { x: this.worldLength - 260 };
    this.lives = LIVES;
    this.invuln = 0;
    this.shells = 0;
    this.status = 'PRESS E TO SWAP SHELLS — BIGGER SHELLS CRACK PAST URCHINS';
    this.statusTimer = 3.4;
    this.scareTimer = 0;
    this.scareReason = '';
    this.urchins = [];
    let x = this.startX + 520;
    while (x < this.exitZone.x - 120) {
      const tier = rand() < 0.4 ? 2 : 1;
      this.urchins.push({ x, y: FLOOR - 14, radius: 16 + tier * 8, tier, phase: rand(0, TAU) });
      x += 300 + rand(0, 240);
    }
    this.pickups = [];
    for (let i = 0; i < 5; i += 1) {
      this.pickups.push({ x: this.startX + 700 + i * 620, y: FLOOR - 30, radius: 20, shellIndex: (i + 1) % HERMIT.shells.length, taken: false, phase: rand(0, TAU) });
    }
    const player = new HermitCrab(this.startX, FLOOR - 26, { controls: CONTROLS.solo, pointer: true, groundY: FLOOR });
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
    this.game.audio.tone({ freq: 140, endFreq: 60, type: 'square', duration: 0.3, volume: 0.24 });
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
    player.x = Math.max(this.startX, player.x - 240);
    player.y = FLOOR - 26;
    player.vx = 0;
    player.vy = 0;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'SHAKE IT OFF — KEEP MOVING';
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
    if (input.wasPressed('cycleAnchor')) {
      const shell = player.cycleShell();
      this.game.audio.tone({ freq: 420, endFreq: 700, type: 'triangle', duration: 0.12, volume: 0.16 });
      this.status = `SHELL: ${shell.label}`;
      this.statusTimer = 1.6;
    }
    player.update(dt, input);
    this.camX = clamp(player.x - LOGICAL_WIDTH * 0.4, 0, Math.max(0, this.worldLength - LOGICAL_WIDTH));
    for (const p of this.pickups) {
      p.phase += dt;
      if (!p.taken && circleOverlap(player, p)) {
        p.taken = true;
        player.shellIndex = p.shellIndex;
        this.shells += 1;
        this.game.audio.tone({ freq: 520, endFreq: 880, type: 'triangle', duration: 0.14, volume: 0.18 });
        this.particles.burst(p.x, p.y, { count: 12, speed: 150, life: 0.5, colors: ['#b98a5a', '#e8d3a8'] });
      }
    }
    for (const u of this.urchins) {
      u.phase += dt;
      if (circleOverlap(player, u)) {
        if (player.armor >= u.tier) {
          player.vx = -Math.sign(player.vx || 1) * 160;
        } else if (this.catchPlayer('AN URCHIN GOT THROUGH YOUR SHELL')) {
          return;
        }
      }
    }
    if (player.x >= this.exitZone.x) this.finish(true);
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(-this.camX, 0);
    ctx.fillStyle = '#123043';
    ctx.fillRect(this.camX - 40, FLOOR, LOGICAL_WIDTH + 80, LOGICAL_HEIGHT - FLOOR + 40);
    ctx.strokeStyle = 'rgba(182, 220, 236, 0.2)';
    ctx.lineWidth = 2;
    for (let x = Math.floor(this.camX / 120) * 120; x < this.camX + LOGICAL_WIDTH + 120; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR);
      ctx.lineTo(x + 40, LOGICAL_HEIGHT);
      ctx.stroke();
    }
    this.renderExit(ctx);
    ctx.fillStyle = '#8a6a44';
    for (const p of this.pickups) this.renderPickup(ctx, p);
    for (const u of this.urchins) this.renderUrchin(ctx, u);
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
    drawText(ctx, 'SAFE ROCK', this.exitZone.x, 40, { size: 16, color: COLORS.accent });
  }

  renderPickup(ctx, p) {
    if (p.taken) return;
    const bob = Math.sin(this.time * 2.4 + p.phase) * 3;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.rotate(Math.sin(p.phase) * 0.2);
    drawHermitBody(ctx, 16, { shell: HERMIT.shells[p.shellIndex], legPhase: p.phase * 2 });
    ctx.restore();
  }

  renderUrchin(ctx, u) {
    const pulse = 1 + Math.sin(u.phase * 2) * 0.05;
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = u.tier >= 2 ? '#c15cff' : '#ff8a5c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * u.radius * 0.6, Math.sin(a) * u.radius * 0.6);
      ctx.lineTo(Math.cos(a) * u.radius, Math.sin(a) * u.radius);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, u.radius * 0.62, 0, TAU);
    ctx.fillStyle = u.tier >= 2 ? '#4a1f5c' : '#5c2f1f';
    ctx.fill();
    ctx.restore();
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.4, {
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        time: this.time,
        caption: 'OUCH — TRY AGAIN!',
        radius: 66,
      });
      return;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    const s = 1.3 + (1 - this.scareTimer / 1.4) * 1.6;
    ctx.scale(s, s);
    drawHermitBody(ctx, 26, { shell: HERMIT.shells[0], legPhase: 0 });
    ctx.restore();
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'HERMIT CRAB HOLD', LOGICAL_WIDTH / 2, 34, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(230, 190, 120, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 30, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < LIVES; i += 1) {
      fillCircle(ctx, 42 + i * 22, 52, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    const shell = this.player ? this.player.shell : HERMIT.shells[0];
    drawText(ctx, `${shell.label}  ARMOR ${shell.armor}`, LOGICAL_WIDTH - 24, 30, { size: 15, color: '#e8c98a', align: 'right' });
    drawText(ctx, `SHELLS SWAPPED ${this.shells}`, LOGICAL_WIDTH - 24, 52, { size: 11, color: COLORS.textDim, align: 'right' });
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 74, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    drawText(ctx, 'A / D — CRAWL      SPACE — HOP      E — SWAP SHELL      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
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
    return 'HERMIT CRAB HOLD';
  }

  resultsHeadline() {
    return this.won ? 'YOU FOUND THE SAFE ROCK' : 'THE URCHINS WON';
  }

  resultsDetail() {
    return `${this.shells} SHELLS SWAPPED`;
  }
}
