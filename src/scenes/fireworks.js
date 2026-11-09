import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { drawSeasonRoom } from '../engine/seasonroom.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const LAUNCHER = { x: 480, y: 500 };
const BAND_H = 64;
const GOAL = 10;
const MISSES = 3;

export class FireworksScene extends MinigameScene {
  buildRound() {
    this.phase = 'play';
    this.rocket = null;
    this.combo = 0;
    this.successes = 0;
    this.misses = 0;
    this.score = 0;
    this.timeLeft = 80;
    this.status = 'CLICK TO LAUNCH — CLICK AGAIN IN THE GLOWING BAND';
    this.statusTimer = 3;
    this.newTarget();
  }

  newTarget() {
    this.targetY = 120 + Math.random() * 220;
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 1.6;
  }

  updateRound(dt, input) {
    this.timeLeft -= dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);

    if (this.rocket) {
      this.rocket.y += this.rocket.vy * dt;
      this.rocket.vy += 120 * dt;
      this.rocket.trail.push({ x: this.rocket.x, y: this.rocket.y });
      if (this.rocket.trail.length > 12) this.rocket.trail.shift();
      if (this.rocket.y < 20) this.burst();
    }

    if (input.pressed && input.pressed.has('PointerPrimary')) {
      if (this.rocket) this.burst();
      else {
        this.rocket = { x: LAUNCHER.x, y: LAUNCHER.y - 10, vy: -560, color: this.rocketColor(), trail: [] };
        this.game.audio.tone({ freq: 300, endFreq: 620, type: 'triangle', duration: 0.18, volume: 0.18 });
      }
    }

    if (this.successes >= GOAL) {
      this.finish(true);
      return;
    }
    if (this.misses >= MISSES) {
      this.finish(false);
      return;
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finish(false);
    }
  }

  rocketColor() {
    const palette = ['#ffd166', '#ff6b9d', '#63e6ff', '#9be564', '#c1a3ff'];
    return palette[this.successes % palette.length];
  }

  burst() {
    const rocket = this.rocket;
    if (!rocket) return;
    this.rocket = null;
    const dist = Math.abs(rocket.y - this.targetY);
    const color = rocket.color;
    if (dist <= BAND_H / 2) {
      this.successes += 1;
      this.combo += 1;
      this.score += 100 + this.combo * 25;
      this.setStatus(this.combo > 1 ? `PERFECT! COMBO x${this.combo}` : 'PERFECT BURST!');
      this.game.audio.tone({ freq: 640 + this.combo * 40, endFreq: 1100, type: 'triangle', duration: 0.2, volume: 0.22 });
      this.particles.burst(rocket.x, rocket.y, {
        count: 26 + this.combo * 4,
        speed: 260,
        life: 0.8,
        colors: [color, '#ffffff', '#ffd166'],
        buoyancy: 10,
      });
    } else {
      this.misses += 1;
      this.combo = 0;
      this.setStatus(dist < BAND_H ? 'CLOSE — BUT NOT IN THE BAND' : 'MISSED THE BAND');
      this.game.audio.tone({ freq: 220, endFreq: 100, type: 'sawtooth', duration: 0.2, volume: 0.2 });
      this.particles.burst(rocket.x, rocket.y, {
        count: 10,
        speed: 160,
        life: 0.5,
        colors: ['#8b98a5', '#ffffff'],
        buoyancy: 30,
      });
    }
    this.newTarget();
  }

  renderRound(ctx) {
    drawSeasonRoom(ctx, this.time, 'newyear');

    const bandColor = this.rocket ? 'rgba(255, 209, 102, 0.18)' : 'rgba(99, 230, 255, 0.14)';
    ctx.fillStyle = bandColor;
    ctx.fillRect(0, this.targetY - BAND_H / 2, LOGICAL_WIDTH, BAND_H);
    ctx.strokeStyle = this.rocket ? 'rgba(255, 209, 102, 0.7)' : 'rgba(99, 230, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(0, this.targetY - BAND_H / 2);
    ctx.lineTo(LOGICAL_WIDTH, this.targetY - BAND_H / 2);
    ctx.moveTo(0, this.targetY + BAND_H / 2);
    ctx.lineTo(LOGICAL_WIDTH, this.targetY + BAND_H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    drawText(ctx, 'BURST BAND', LOGICAL_WIDTH - 120, this.targetY - BAND_H / 2 - 14, {
      size: 11,
      color: COLORS.accent,
      align: 'right',
    });

    if (this.rocket) {
      for (let i = 0; i < this.rocket.trail.length; i += 1) {
        const p = this.rocket.trail[i];
        ctx.globalAlpha = (i / this.rocket.trail.length) * 0.6;
        ctx.fillStyle = this.rocket.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + i * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.rocket.x, this.rocket.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    this.particles.render(ctx);

    fillRoundRect(ctx, LAUNCHER.x - 26, LAUNCHER.y - 26, 52, 30, 8, '#39434c');
    fillRoundRect(ctx, LAUNCHER.x - 10, LAUNCHER.y - 40, 20, 16, 4, '#5a656e');
    strokeRoundRect(ctx, LAUNCHER.x - 26, LAUNCHER.y - 26, 52, 30, 8, '#ffd166', 2);

    drawText(ctx, 'MIDNIGHT FIREWORKS', LOGICAL_WIDTH / 2, 40, {
      size: 28,
      color: COLORS.text,
      glow: '#ffd166',
      glowBlur: 20,
    });
    drawText(ctx, 'CLICK TO LAUNCH — CLICK AGAIN INSIDE THE GLOWING BAND — THREE MISSES FIZZLE THE PARTY', LOGICAL_WIDTH / 2, 72, {
      size: 11,
      color: COLORS.foam,
      alpha: 0.85,
    });
    drawText(ctx, `BURSTS ${this.successes} / ${GOAL}`, 140, 110, { size: 14, color: COLORS.accent });
    drawText(ctx, `COMBO x${this.combo}`, 140, 132, { size: 11, color: this.combo > 1 ? '#ffd166' : COLORS.textDim });
    drawText(ctx, `MISSES ${this.misses} / ${MISSES}`, LOGICAL_WIDTH - 150, 110, {
      size: 14,
      color: this.misses >= 2 ? COLORS.danger : COLORS.textDim,
    });

    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 150, { size: 13, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    const ratio = Math.max(0, this.timeLeft / 80);
    fillRoundRect(ctx, 70, LOGICAL_HEIGHT - 34, LOGICAL_WIDTH - 140, 10, 5, 'rgba(4, 10, 20, 0.7)');
    fillRoundRect(ctx, 70, LOGICAL_HEIGHT - 34, (LOGICAL_WIDTH - 140) * ratio, 10, 5, ratio < 0.2 ? COLORS.danger : '#ffd166');
    drawText(ctx, `${Math.ceil(this.timeLeft)}s`, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 52, { size: 11, color: COLORS.textDim });
  }

  resultsTitle() {
    return 'MIDNIGHT FIREWORKS';
  }

  resultsHeadline() {
    return this.won ? 'HAPPY NEW YEAR!' : 'THE PARTY FIZZLED';
  }

  resultsDetail() {
    return `${this.successes} BURSTS · ${this.score} POINTS`;
  }
}
