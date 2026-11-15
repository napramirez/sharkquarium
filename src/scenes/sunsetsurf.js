import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { circleOverlap } from '../engine/collision.js';
import { CONTROLS, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const LIVES = 3;
const TARGET = 1400;
const WATER_Y = LOGICAL_HEIGHT - 120;

export class SunsetSurfScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'sunsetsurf';
  }

  buildRound() {
    this.phase = 'play';
    this.lives = LIVES;
    this.distance = 0;
    this.y = LOGICAL_HEIGHT / 2;
    this.vy = 0;
    this.rocks = [];
    this.status = 'HOLD SPACE TO RISE — RIDE THE WAVE TO THE SHORE';
    this.statusTimer = 3;
    this.scareTimer = 0;
    this.scareReason = '';
    this.spawnTimer = 0.6;
    this.players = [];
    this.player = { x: LOGICAL_WIDTH * 0.32, y: this.y, radius: 22 };
  }

  firstPersonActor() {
    return null;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play') return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 140, endFreq: 55, type: 'sawtooth', duration: 0.35, volume: 0.24 });
    if (this.lives <= 0) {
      this.finish(false);
      return true;
    }
    this.phase = 'scare';
    this.scareTimer = 1.1;
    return true;
  }

  respawn() {
    this.y = LOGICAL_HEIGHT / 2;
    this.vy = 0;
    this.rocks = [];
    this.phase = 'play';
    this.flash = 0;
    this.shake = 0;
    this.status = 'BACK ON THE BOARD — KEEP RIDING';
    this.statusTimer = 1.6;
  }

  updateRound(dt, input) {
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }
    this.distance += 320 * dt;
    const rise = input.isDown(CONTROLS.solo.up) || input.isDown('confirm');
    this.vy += (rise ? -760 : 620) * dt;
    this.vy = clamp(this.vy, -420, 420);
    this.y = clamp(this.y + this.vy * dt, 90, WATER_Y);
    this.player.y = this.y;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(0.5, 0.95);
      this.rocks.push({
        x: LOGICAL_WIDTH + 30,
        y: rand(110, WATER_Y - 10),
        radius: rand(20, 34),
        phase: rand(0, TAU),
      });
    }
    for (const rock of this.rocks) {
      rock.phase += dt;
      rock.x -= 320 * dt;
      if (circleOverlap(this.player, rock)) {
        if (this.catchPlayer('YOU SMASHED INTO A ROCK')) return;
      }
    }
    this.rocks = this.rocks.filter((rock) => rock.x > -40);
    if (this.distance >= TARGET) this.finish(true);
  }

  renderRound(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    sky.addColorStop(0, '#ff9e5e');
    sky.addColorStop(0.5, '#ffd07a');
    sky.addColorStop(1, '#2a7fb8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(LOGICAL_WIDTH * 0.72, LOGICAL_HEIGHT * 0.42, 52, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(20, 90, 140, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, WATER_Y);
    for (let x = 0; x <= LOGICAL_WIDTH; x += 40) {
      ctx.lineTo(x, WATER_Y + Math.sin((x + this.elapsed * 300) * 0.02) * 6);
    }
    ctx.lineTo(LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.lineTo(0, LOGICAL_HEIGHT);
    ctx.closePath();
    ctx.fill();
    for (const rock of this.rocks) {
      ctx.save();
      ctx.translate(rock.x, rock.y);
      ctx.fillStyle = '#4a4a52';
      ctx.beginPath();
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * TAU;
        ctx.lineTo(Math.cos(a) * rock.radius, Math.sin(a) * rock.radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2d2d33';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(this.player.x, this.y);
    ctx.rotate(clamp(this.vy / 900, -0.5, 0.5));
    ctx.fillStyle = '#5fc9ff';
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(-4, -18);
    ctx.lineTo(30, -6);
    ctx.lineTo(20, 0);
    ctx.lineTo(30, 8);
    ctx.lineTo(-4, 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cfefff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    this.particles.render(ctx);
    if (this.phase === 'scare') this.renderScare(ctx);
  }

  renderScare(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, { size: 18, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'SUNSET SURF', LOGICAL_WIDTH / 2, 34, {
      size: 24,
      color: '#0b2a3a',
      glow: 'rgba(255, 230, 160, 0.6)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 30, { size: 15, color: '#0b2a3a', align: 'left' });
    for (let i = 0; i < LIVES; i += 1) {
      fillCircle(ctx, 42 + i * 22, 52, 7, i < this.lives ? COLORS.danger : 'rgba(11, 42, 58, 0.25)');
    }
    drawText(ctx, `SHORE ${Math.min(TARGET, Math.round(this.distance))}/${TARGET}`, LOGICAL_WIDTH - 24, 30, { size: 15, color: '#0b2a3a', align: 'right' });
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, 240, 10, 5, 'rgba(11, 42, 58, 0.35)');
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, (240 * Math.min(1, this.distance / TARGET)), 10, 5, '#ffd166');
    if (this.statusTimer > 0) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 74, { size: 12, color: '#0b2a3a', alpha: Math.min(1, this.statusTimer) });
    }
    drawText(ctx, 'HOLD SPACE — RISE      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
      size: 11,
      color: 'rgba(11, 42, 58, 0.8)',
    });
  }

  backScene() {
    return 'minigames';
  }

  resultsTitle() {
    return 'SUNSET SURF';
  }

  resultsHeadline() {
    return this.won ? 'YOU REACHED THE SHORE' : 'WIPED OUT';
  }

  resultsDetail() {
    return `${Math.round(this.distance)} DISTANCE`;
  }
}
