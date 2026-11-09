import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillRoundRect, fillCircle } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { drawSeasonRoom } from '../engine/seasonroom.js';
import { drawGiftShape } from '../engine/giftshapes.js';
import { applyWardrobe } from '../engine/wardrobe.js';
import { drawSkinAura } from '../engine/skin.js';
import { drawTrail } from '../engine/trail.js';
import { drawCompanion } from '../engine/companion.js';
import { Shark } from '../entities/shark.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const PLAYER_X = 220;
const GOAL = 25;
const HITS = 3;

export class ConfettiRushScene extends MinigameScene {
  buildRound() {
    this.phase = 'play';
    this.shark = new Shark(PLAYER_X, 400, { pointer: false });
    this.shark.facing = 1;
    applyWardrobe(this.shop, 0);
    this.items = [];
    this.spawnTimer = 0.4;
    this.collected = 0;
    this.hits = 0;
    this.score = 0;
    this.timeLeft = 75;
    this.scroll = 0;
    this.status = 'COLLECT THE STARS — DODGE THE POPPERS';
    this.statusTimer = 3;
    this.flash = 0;
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 1.4;
  }

  updateRound(dt, input) {
    this.timeLeft -= dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.scroll += 260 * dt;
    this.shark.age += dt;

    const vertical = (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0);
    this.shark.y = clamp(this.shark.y + vertical * 320 * dt, 140, 470);
    this.shark.y += Math.sin(this.time * 2) * 0.2;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(0.22, 0.5);
      const popper = Math.random() < 0.42;
      this.items.push({
        x: rand(200, LOGICAL_WIDTH - 60),
        y: -20,
        vy: rand(220, 340),
        popper,
        spin: rand(0, TAU),
      });
    }

    for (const item of this.items) {
      item.y += item.vy * dt;
      item.spin += dt * 3;
      if (Math.hypot(item.x - this.shark.x, item.y - this.shark.y) < 34) {
        if (item.popper) {
          item.dead = true;
          this.hits += 1;
          this.flash = 0.7;
          this.setStatus('POPPER! OW.');
          this.game.audio.tone({ freq: 180, endFreq: 80, type: 'sawtooth', duration: 0.2, volume: 0.22 });
          this.particles.burst(item.x, item.y, {
            count: 14,
            speed: 200,
            life: 0.5,
            colors: ['#ff6b81', '#ffd166', '#ffffff'],
            buoyancy: 20,
          });
        } else {
          item.dead = true;
          this.collected += 1;
          this.score += 50;
          this.setStatus('+1 STAR');
          this.game.audio.tone({ freq: 620, endFreq: 980, type: 'triangle', duration: 0.1, volume: 0.16 });
          this.particles.burst(item.x, item.y, {
            count: 8,
            speed: 140,
            life: 0.4,
            colors: ['#ffd166', '#ffffff'],
            buoyancy: -20,
          });
        }
      }
    }
    this.items = this.items.filter((item) => !item.dead && item.y < LOGICAL_HEIGHT + 40);

    if (this.hits >= HITS) {
      this.finish(false);
      return;
    }
    if (this.collected >= GOAL) {
      this.finish(true);
      return;
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finish(false);
    }
  }

  renderRound(ctx) {
    drawSeasonRoom(ctx, this.time, 'newyear');

    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 220 - this.scroll * 2) % (LOGICAL_WIDTH + 220) + LOGICAL_WIDTH + 220) % (LOGICAL_WIDTH + 220);
      ctx.strokeStyle = 'rgba(207, 239, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 120);
      ctx.lineTo(x - 60, LOGICAL_HEIGHT);
      ctx.stroke();
    }

    for (const item of this.items) {
      if (item.popper) {
        fillCircle(ctx, item.x, item.y, 12, '#c93b3b');
        fillCircle(ctx, item.x - 3, item.y - 3, 4, 'rgba(255, 255, 255, 0.4)');
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(item.x + 8, item.y - 10);
        ctx.lineTo(item.x + 14, item.y - 18);
        ctx.stroke();
        fillCircle(ctx, item.x + 14, item.y - 18, 2.5, '#ffe14d');
      } else {
        drawGiftShape(ctx, item.x, item.y, 11, 'star', '#ffd166');
      }
    }

    this.shark.render(ctx);
    drawSkinAura(ctx, this.shark);
    drawTrail(ctx, this.shark);
    drawCompanion(ctx, this.shark);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 80, 110, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }

    drawText(ctx, 'CONFETTI RUSH', LOGICAL_WIDTH / 2, 40, {
      size: 28,
      color: COLORS.text,
      glow: '#ff6b9d',
      glowBlur: 20,
    });
    drawText(ctx, 'AUTO-SWIM — UP / DOWN (W/S OR ARROWS) TO COLLECT STARS AND DODGE POPPERS', LOGICAL_WIDTH / 2, 72, {
      size: 11,
      color: COLORS.foam,
      alpha: 0.85,
    });
    drawText(ctx, `STARS ${this.collected} / ${GOAL}`, 150, 110, { size: 14, color: COLORS.accent });
    drawText(ctx, `HITS ${this.hits} / ${HITS}`, LOGICAL_WIDTH - 150, 110, {
      size: 14,
      color: this.hits >= 2 ? COLORS.danger : COLORS.textDim,
    });

    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 146, { size: 13, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    const ratio = Math.max(0, this.timeLeft / 75);
    fillRoundRect(ctx, 70, LOGICAL_HEIGHT - 34, LOGICAL_WIDTH - 140, 10, 5, 'rgba(4, 10, 20, 0.7)');
    fillRoundRect(ctx, 70, LOGICAL_HEIGHT - 34, (LOGICAL_WIDTH - 140) * ratio, 10, 5, ratio < 0.2 ? COLORS.danger : '#ff6b9d');
    drawText(ctx, `${Math.ceil(this.timeLeft)}s`, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 52, { size: 11, color: COLORS.textDim });
  }

  resultsTitle() {
    return 'CONFETTI RUSH';
  }

  resultsHeadline() {
    return this.won ? 'STAR OF THE PARTY!' : 'POPPED OUT';
  }

  resultsDetail() {
    return `${this.collected} STARS · ${this.score} POINTS`;
  }
}
