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
const WALL = 60;

export class PressureScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'pressure';
  }

  buildRound() {
    this.phase = 'play';
    this.worldHeight = 3000;
    this.lives = LIVES;
    this.invuln = 0;
    this.pressure = 0;
    this.ventsUsed = 0;
    this.status = 'DESCEND — HOLD STILL IN THE VENTS TO SHED PRESSURE';
    this.statusTimer = 3.4;
    this.scareTimer = 0;
    this.scareReason = '';
    this.ventColumns = [];
    for (let i = 1; i <= 6; i += 1) {
      this.ventColumns.push({
        x: WALL + 60 + rand(0, LOGICAL_WIDTH - 2 * WALL - 120),
        y: (this.worldHeight / 7) * i + rand(-60, 60),
        radius: 70,
        phase: rand(0, TAU),
      });
    }
    this.fish = [];
    for (let i = 0; i < 14; i += 1) {
      this.fish.push({
        x: WALL + 40 + rand(0, LOGICAL_WIDTH - 2 * WALL - 80),
        y: rand(160, this.worldHeight - 120),
        radius: 22,
        dir: rand() < 0.5 ? -1 : 1,
        speed: rand(60, 120),
        phase: rand(0, TAU),
      });
    }
    const player = new Shark(LOGICAL_WIDTH / 2, 140, { controls: CONTROLS.solo, pointer: true, maxY: this.worldHeight });
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
    this.game.audio.tone({ freq: 100, endFreq: 40, type: 'square', duration: 0.4, volume: 0.26 });
    if (this.lives <= 0) {
      this.finish(false);
      return;
    }
    this.phase = 'scare';
    this.scareTimer = 1.4;
  }

  respawn() {
    const player = this.player;
    player.y = Math.max(140, player.y - 420);
    player.x = LOGICAL_WIDTH / 2;
    player.vx = 0;
    player.vy = 0;
    this.pressure = Math.max(0, this.pressure - 0.35);
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'SHAKE IT OFF — FIND A VENT';
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
    player.x = clamp(player.x, WALL + player.radius, LOGICAL_WIDTH - WALL - player.radius);
    player.y = clamp(player.y, 60, this.worldHeight - 60);
    this.camY = clamp(player.y - LOGICAL_HEIGHT * 0.45, 0, Math.max(0, this.worldHeight - LOGICAL_HEIGHT));

    const depth = clamp(player.y / this.worldHeight, 0, 1);
    let venting = false;
    for (const v of this.ventColumns) {
      v.phase += dt;
      if (circleOverlap(player, { x: v.x, y: v.y, radius: v.radius })) venting = true;
    }
    this.pressure = clamp(
      this.pressure + (venting ? -dt * 0.55 : dt * (0.08 + depth * 0.28)),
      0,
      1,
    );
    if (venting && Math.floor(this.time * 3) % 2 === 0) {
      const v = this.ventColumns[0];
      this.particles.burst(v.x + rand(-30, 30), v.y + rand(-30, 30), {
        count: 2, speed: 40, life: 0.6, colors: ['#bfe9ff', '#ffffff'], buoyancy: -80,
      });
    }
    if (this.pressure >= 1) this.catchPlayer('THE PRESSURE CRUSHED YOU');

    for (const f of this.fish) {
      f.phase += dt;
      f.x += f.dir * f.speed * dt;
      if (f.x < WALL + f.radius || f.x > LOGICAL_WIDTH - WALL - f.radius) f.dir *= -1;
      if (circleOverlap(player, f)) this.catchPlayer('A TRENCH FISH RAMMED YOU');
    }
    if (player.y >= this.worldHeight - 80) {
      this.ventsUsed = this.ventColumns.length;
      this.finish(true);
    }
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(0, -this.camY);
    const grad = ctx.createLinearGradient(0, this.camY, 0, this.camY + LOGICAL_HEIGHT);
    grad.addColorStop(0, '#07222e');
    grad.addColorStop(1, '#020810');
    ctx.fillStyle = grad;
    ctx.fillRect(0, this.camY, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.fillStyle = '#0e1b22';
    ctx.fillRect(0, 0, WALL, this.worldHeight);
    ctx.fillRect(LOGICAL_WIDTH - WALL, 0, WALL, this.worldHeight);
    this.renderBottom(ctx);
    for (const v of this.ventColumns) this.renderVent(ctx, v);
    for (const f of this.fish) this.renderFish(ctx, f);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
    ctx.restore();
    if (this.phase === 'scare') this.renderScare(ctx);
  }

  renderBottom(ctx) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
    ctx.fillRect(0, this.worldHeight - 50, LOGICAL_WIDTH, 50);
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, this.worldHeight - 50);
    ctx.lineTo(LOGICAL_WIDTH, this.worldHeight - 50);
    ctx.stroke();
    drawText(ctx, 'THE FLOOR', LOGICAL_WIDTH / 2, this.worldHeight - 24, { size: 16, color: COLORS.accent });
  }

  renderVent(ctx, v) {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.strokeStyle = 'rgba(191, 233, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, v.radius, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(191, 233, 255, 0.12)';
    ctx.fill();
    for (let i = 0; i < 5; i += 1) {
      const t = (this.time * 0.5 + i / 5 + v.phase) % 1;
      ctx.globalAlpha = 0.6 * (1 - t);
      ctx.beginPath();
      ctx.arc(Math.sin(t * 8 + i) * 16, -t * v.radius, 4, 0, TAU);
      ctx.fillStyle = '#bfe9ff';
      ctx.fill();
    }
    ctx.restore();
  }

  renderFish(ctx, f) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.dir, 1);
    ctx.fillStyle = '#2b4550';
    ctx.beginPath();
    ctx.ellipse(0, 0, f.radius, f.radius * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-f.radius, 0);
    ctx.lineTo(-f.radius * 1.6, -f.radius * 0.5);
    ctx.lineTo(-f.radius * 1.6, f.radius * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd966';
    ctx.beginPath();
    ctx.arc(f.radius * 0.5, -f.radius * 0.1, 3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.4, {
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        time: this.time,
        caption: 'SQUEEZED — FIND A VENT!',
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
    for (let i = 3; i >= 1; i -= 1) {
      ctx.strokeStyle = `rgba(255, 120, 120, ${0.3 * i})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 18 * i, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE PRESSURE', LOGICAL_WIDTH / 2, 34, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(120, 200, 230, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 30, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < LIVES; i += 1) {
      fillCircle(ctx, 42 + i * 22, 52, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    drawText(ctx, 'REACH THE FLOOR', LOGICAL_WIDTH - 24, 30, { size: 15, color: COLORS.accent, align: 'right' });
    const depth = 1 - clamp(this.player.y / this.worldHeight, 0, 1);
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 48, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 48, (240 * depth), 10, 5, COLORS.accent);
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, (240 * this.pressure), 10, 5, this.pressure > 0.7 ? COLORS.danger : '#78c8e6');
    drawText(ctx, `PRESSURE ${Math.round(this.pressure * 100)}%`, LOGICAL_WIDTH / 2, 70, { size: 11, color: COLORS.textDim });
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 92, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    drawText(ctx, 'WASD / DRAG — SWIM      REST IN THE VENTS      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
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
    return 'THE PRESSURE';
  }

  resultsHeadline() {
    return this.won ? 'YOU REACHED THE FLOOR' : 'THE DEPTH TOOK YOU';
  }

  resultsDetail() {
    return `${this.ventColumns.length} VENTS USED`;
  }
}
