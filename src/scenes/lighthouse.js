import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect, strokeRoundRect } from '../engine/render.js';
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
const WALL = 70;
const LANTERN = { x: LOGICAL_WIDTH / 2, y: 0 };

export class LighthouseScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'lighthouse';
  }

  buildRound() {
    this.phase = 'play';
    this.worldHeight = 2600;
    this.lives = LIVES;
    this.invuln = 0;
    this.exposure = 0;
    this.floors = 0;
    this.status = 'CLIMB THE SHAFT — SLIP THROUGH THE SHADOWS WHEN THE BEAM SWEEPS';
    this.statusTimer = 3.4;
    this.scareTimer = 0;
    this.scareReason = '';
    this.beam = { angle: 0, dir: 1, width: 0.42, range: 2400, speed: rand(0.7, 1.1) };
    this.debris = [];
    for (let i = 0; i < 10; i += 1) {
      this.debris.push({
        x: rand(WALL + 40, LOGICAL_WIDTH - WALL - 40),
        y: rand(200, this.worldHeight - 200),
        radius: 20,
        phase: rand(0, TAU),
      });
    }
    const player = new Shark(LANTERN.x, this.worldHeight - 120, { controls: CONTROLS.solo, pointer: true, maxY: this.worldHeight });
    player.noIdleFlip = true;
    this.players = [player];
    this.player = player;
  }

  firstPersonActor() {
    return this.players[0] ?? null;
  }

  climbZone() {
    return this.worldHeight - 200;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 120, endFreq: 48, type: 'sawtooth', duration: 0.4, volume: 0.26 });
    if (this.lives <= 0) {
      this.finish(false);
      return;
    }
    this.phase = 'scare';
    this.scareTimer = 1.4;
  }

  respawn() {
    const player = this.player;
    const floorY = player.y - (player.y % 520) + 400;
    player.y = Math.min(this.worldHeight - 120, floorY);
    player.x = LANTERN.x;
    player.vx = 0;
    player.vy = 0;
    this.exposure = 0;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'THE KEEPER LOST YOU — CLIMB AGAIN';
    this.statusTimer = 2;
  }

  isLit(player) {
    const dx = player.x - LANTERN.x;
    const dy = player.y - LANTERN.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > this.beam.range) return false;
    const angle = Math.atan2(dx, Math.max(dy, 0.001));
    const rel = angle - this.beam.angle;
    return Math.abs(rel) <= this.beam.width * 0.5;
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
    player.y = clamp(player.y, 60, this.worldHeight - 80);

    const b = this.beam;
    b.angle += b.dir * b.speed * dt;
    if (Math.abs(b.angle) > 0.9) {
      b.angle = clamp(b.angle, -0.9, 0.9);
      b.dir *= -1;
    }
    this.camY = clamp(player.y - LOGICAL_HEIGHT * 0.55, 0, Math.max(0, this.worldHeight - LOGICAL_HEIGHT));

    for (const d of this.debris) {
      d.phase += dt;
      if (circleOverlap(player, d)) this.catchPlayer('FALLING DEBRIS');
    }
    const lit = this.isLit(player);
    this.exposure = clamp(this.exposure + (lit ? dt * 0.9 : -dt * 1.3), 0, 1);
    if (this.exposure >= 1) this.catchPlayer('THE KEEPER FOUND YOU IN THE BEAM');

    if (player.y <= 80) {
      this.floors = 3;
      this.finish(true);
    }
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(0, -this.camY);
    ctx.fillStyle = 'rgba(4, 10, 16, 0.72)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, this.worldHeight);
    ctx.fillStyle = '#1c2b36';
    ctx.fillRect(0, 0, WALL, this.worldHeight);
    ctx.fillRect(LOGICAL_WIDTH - WALL, 0, WALL, this.worldHeight);
    for (let y = 0; y < this.worldHeight; y += 120) {
      ctx.strokeStyle = 'rgba(120, 150, 165, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(WALL, y);
      ctx.lineTo(LOGICAL_WIDTH - WALL, y);
      ctx.stroke();
    }
    this.renderBeam(ctx);
    for (const d of this.debris) this.renderDebris(ctx, d);
    this.renderLantern(ctx);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
    ctx.restore();
    if (this.phase === 'scare') this.renderScare(ctx);
  }

  renderBeam(ctx) {
    const lit = this.beam.angle;
    ctx.save();
    ctx.translate(LANTERN.x, LANTERN.y);
    ctx.rotate(lit);
    const half = this.beam.width * 0.5;
    const grad = ctx.createLinearGradient(0, 0, 0, this.beam.range);
    grad.addColorStop(0, 'rgba(255, 240, 190, 0.5)');
    grad.addColorStop(1, 'rgba(255, 240, 190, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(-half) * this.beam.range, Math.cos(-half) * this.beam.range);
    ctx.lineTo(Math.sin(half) * this.beam.range, Math.cos(half) * this.beam.range);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  renderLantern(ctx) {
    ctx.save();
    ctx.translate(LANTERN.x, LANTERN.y);
    ctx.fillStyle = '#0b1a22';
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, TAU);
    ctx.fill();
    const glow = 0.6 + 0.4 * Math.sin(this.time * 6);
    ctx.fillStyle = `rgba(255, 238, 180, ${glow})`;
    ctx.beginPath();
    ctx.arc(0, 14, 22, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderDebris(ctx, d) {
    const bob = Math.sin(this.time * 2 + d.phase) * 4;
    ctx.save();
    ctx.translate(d.x, d.y + bob);
    ctx.rotate(d.phase);
    ctx.fillStyle = '#3a4a52';
    ctx.fillRect(-d.radius * 0.6, -d.radius * 0.6, d.radius * 1.2, d.radius * 1.2);
    ctx.strokeStyle = '#5a6b74';
    ctx.lineWidth = 2;
    ctx.strokeRect(-d.radius * 0.6, -d.radius * 0.6, d.radius * 1.2, d.radius * 1.2);
    ctx.restore();
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.4, {
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        time: this.time,
        caption: 'CAUGHT IN THE LIGHT!',
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
    ctx.fillStyle = '#ffd966';
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#12222c';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.fill();
    ctx.restore();
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE LIGHTHOUSE', LOGICAL_WIDTH / 2, 34, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(255, 216, 120, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 30, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < LIVES; i += 1) {
      fillCircle(ctx, 42 + i * 22, 52, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    drawText(ctx, 'CLIMB TO THE LANTERN', LOGICAL_WIDTH - 24, 30, { size: 15, color: COLORS.accent, align: 'right' });
    const climb = 1 - clamp(this.player.y / this.worldHeight, 0, 1);
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 48, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 48, (240 * climb), 10, 5, COLORS.accent);
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, (240 * this.exposure), 10, 5, '#ffd966');
    drawText(ctx, `EXPOSURE ${Math.round(this.exposure * 100)}%`, LOGICAL_WIDTH / 2, 70, { size: 11, color: COLORS.textDim });
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 92, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    drawText(ctx, 'WASD / DRAG — SWIM      STAY OUT OF THE BEAM      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
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
    return 'THE LIGHTHOUSE';
  }

  resultsHeadline() {
    return this.won ? 'YOU REACHED THE LANTERN' : 'THE BEAM CAUGHT YOU';
  }

  resultsDetail() {
    return 'THE SHAFT IS CLEARED';
  }
}
