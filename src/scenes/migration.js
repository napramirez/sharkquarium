import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { circleOverlap } from '../engine/collision.js';
import { Shark } from '../entities/shark.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import {
  CONTROLS,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const LIVES = 3;
const TOP = 40;
const BOTTOM = LOGICAL_HEIGHT - 40;

export class MigrationScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'migration';
  }

  bandCenterAt(x) {
    return LOGICAL_HEIGHT / 2 + Math.sin(x * 0.0011) * 170 + Math.sin(x * 0.0004) * 60;
  }

  buildRound() {
    this.phase = 'play';
    this.worldLength = 6200;
    this.startX = 200;
    this.exitZone = { x: this.worldLength - 260 };
    this.lives = LIVES;
    this.invuln = 0;
    this.cohesion = 1;
    this.band = { center: LOGICAL_HEIGHT / 2, half: 150 };
    this.status = 'STAY INSIDE THE SCHOOL — STRAY AND THE CURRENT TAKES YOU';
    this.statusTimer = 3.6;
    this.scareTimer = 0;
    this.scareReason = '';
    this.herd = [];
    for (let i = 0; i < 26; i += 1) {
      this.herd.push({ ox: rand(-260, 260), oy: rand(-90, 90), phase: rand(0, TAU), x: 0, y: 0 });
    }
    this.predators = [];
    for (let i = 0; i < 4; i += 1) {
      this.predators.push({
        x: this.startX + 900 + i * 1200 + rand(-200, 200),
        y: rand(TOP + 80, BOTTOM - 80),
        radius: 34,
        dir: -1,
        speed: rand(150, 210),
        phase: rand(0, TAU),
      });
    }
    const player = new Shark(this.startX, LOGICAL_HEIGHT / 2, { controls: CONTROLS.solo, pointer: true });
    player.maxX = this.worldLength;
    player.noIdleFlip = true;
    this.players = [player];
    this.player = player;
  }

  firstPersonActor() {
    return this.players[0] ?? null;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 140, endFreq: 55, type: 'sawtooth', duration: 0.35, volume: 0.26 });
    if (this.lives <= 0) {
      this.finish(false);
      return;
    }
    this.phase = 'scare';
    this.scareTimer = 1.4;
  }

  respawn() {
    const player = this.player;
    player.x = Math.max(this.startX, player.x - 320);
    player.y = this.bandCenterAt(player.x);
    player.vx = 0;
    player.vy = 0;
    this.cohesion = 0.6;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'BACK IN THE CURRENT — KEEP UP';
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
    player.x = clamp(player.x, 40, this.worldLength - player.radius);
    player.y = clamp(player.y, TOP + player.radius, BOTTOM - player.radius);
    this.camX = clamp(player.x - LOGICAL_WIDTH * 0.4, 0, Math.max(0, this.worldLength - LOGICAL_WIDTH));

    this.band.center = this.bandCenterAt(player.x);
    const inBand = Math.abs(player.y - this.band.center) <= this.band.half;
    this.cohesion = clamp(this.cohesion + (inBand ? dt * 0.3 : -dt * 0.5), 0, 1);
    if (this.cohesion <= 0) this.catchPlayer('YOU DRIFTED FROM THE SCHOOL');

    for (const f of this.herd) {
      f.phase += dt;
      f.x = player.x + f.ox + Math.sin(f.phase * 1.5) * 12;
      f.y = this.bandCenterAt(f.x) + f.oy + Math.cos(f.phase * 1.2) * 10;
    }
    for (const p of this.predators) {
      p.phase += dt;
      p.x += p.dir * p.speed * dt;
      p.y = clamp(p.y + Math.sin(p.phase) * 60 * dt, TOP + 80, BOTTOM - 80);
      if (circleOverlap(player, p)) this.catchPlayer('A HUNTER BROKE THE SCHOOL');
    }
    if (player.x >= this.exitZone.x) this.finish(true);
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(-this.camX, 0);
    for (let x = Math.floor(this.camX / 40) * 40; x < this.camX + LOGICAL_WIDTH + 60; x += 40) {
      const c = this.bandCenterAt(x);
      ctx.fillStyle = 'rgba(90, 190, 210, 0.06)';
      ctx.fillRect(x, c - this.band.half, 40, this.band.half * 2);
    }
    ctx.strokeStyle = 'rgba(143, 224, 239, 0.35)';
    ctx.lineWidth = 2;
    for (const edge of [-1, 1]) {
      ctx.beginPath();
      for (let x = Math.floor(this.camX / 20) * 20; x < this.camX + LOGICAL_WIDTH + 20; x += 20) {
        const y = this.bandCenterAt(x) + edge * this.band.half;
        if (x === Math.floor(this.camX / 20) * 20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    this.renderExit(ctx);
    for (const f of this.herd) this.renderHerdFish(ctx, f);
    for (const p of this.predators) this.renderPredator(ctx, p);
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
    drawText(ctx, 'SPAWNING GROUNDS', this.exitZone.x, 40, { size: 16, color: COLORS.accent });
  }

  renderHerdFish(ctx, f) {
    if (f.x < this.camX - 60 || f.x > this.camX + LOGICAL_WIDTH + 60) return;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.fillStyle = 'rgba(180, 220, 235, 0.75)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 7, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-22, -6);
    ctx.lineTo(-22, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  renderPredator(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.dir, 1);
    ctx.fillStyle = '#1a2a30';
    ctx.beginPath();
    ctx.ellipse(0, 0, p.radius * 1.8, p.radius, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-p.radius * 1.7, 0);
    ctx.lineTo(-p.radius * 2.7, -p.radius * 0.9);
    ctx.lineTo(-p.radius * 2.7, p.radius * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(0, p.radius * 0.4, p.radius * 1.4, p.radius * 0.4, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 90, 90, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * (2.1 + 0.12 * Math.sin(this.time * 7)), 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#ffd966';
    ctx.beginPath();
    ctx.arc(p.radius * 0.9, -p.radius * 0.3, 4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.4, {
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        time: this.time,
        caption: 'LOST THE SCHOOL — KEEP UP!',
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
    ctx.strokeStyle = 'rgba(143, 224, 239, 0.8)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, 20 + i * 18, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE MIGRATION', LOGICAL_WIDTH / 2, 34, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(143, 224, 239, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 30, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < LIVES; i += 1) {
      fillCircle(ctx, 42 + i * 22, 52, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    const progress = clamp(this.player.x / this.worldLength, 0, 1);
    drawText(ctx, 'REACH THE GROUNDS', LOGICAL_WIDTH - 24, 30, { size: 15, color: COLORS.accent, align: 'right' });
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 48, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 48, (240 * progress), 10, 5, COLORS.accent);
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, (240 * this.cohesion), 10, 5, this.cohesion < 0.35 ? COLORS.danger : '#8fe0ef');
    drawText(ctx, `SCHOOL ${Math.round(this.cohesion * 100)}%`, LOGICAL_WIDTH / 2, 70, { size: 11, color: COLORS.textDim });
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 92, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    drawText(ctx, 'WASD / DRAG — SWIM      STAY IN THE CURRENT      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
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
    return 'THE MIGRATION';
  }

  resultsHeadline() {
    return this.won ? 'YOU REACHED THE SPAWNING GROUNDS' : 'THE OCEAN SCATTERED YOU';
  }

  resultsDetail() {
    return 'THE SCHOOL ARRIVED';
  }
}
