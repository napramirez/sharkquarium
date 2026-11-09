import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { drawGiftShape } from '../engine/giftshapes.js';
import { drawWreckLounge } from '../engine/lounge.js';
import { applyWardrobe } from '../engine/wardrobe.js';
import { drawSkinAura } from '../engine/skin.js';
import { drawTrail } from '../engine/trail.js';
import { drawCompanion } from '../engine/companion.js';
import { Shark } from '../entities/shark.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const FIELD = { x: 70, y: 190, w: 590, h: 300 };

export class PresentWrapScene extends MinigameScene {
  buildRound() {
    this.phase = 'play';
    this.shark = new Shark(480, FIELD.y + 26, { pointer: false });
    applyWardrobe(this.shop, 0);
    const colors = ['#e2602e', '#3fa79b', '#c94b4b', '#a06fd0', '#d9a93c', '#5a8fd6'];
    const shapes = ['square', 'circle', 'triangle', 'star', 'heart', 'diamond'];
    const spots = [
      { x: 478, y: 300 },
      { x: 560, y: 470 },
      { x: 185, y: 432 },
      { x: 615, y: 430 },
      { x: 108, y: 232 },
      { x: 622, y: 232 },
      { x: 108, y: 458 },
      { x: 622, y: 458 },
      { x: 300, y: 244 },
      { x: 430, y: 470 },
    ];
    this.presents = spots.map((spot, index) => ({
      x: spot.x,
      y: spot.y,
      shape: shapes[index % shapes.length],
      color: colors[index % colors.length],
      wrapped: false,
      held: false,
      wrap: 0,
    }));
    this.held = -1;
    this.timeLeft = 120;
    this.status = '';
    this.statusTimer = 0;
    this.lastPX = this.game.input.pointer.x;
    this.lastPY = this.game.input.pointer.y;
  }

  wrappedCount() {
    return this.presents.filter((gift) => gift.wrapped).length;
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2;
  }

  updateRound(dt, input) {
    this.timeLeft -= dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    const shark = this.shark;
    const dx = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    const dy = (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1;
    const speed = 220;
    shark.x = clamp(shark.x + (dx / len) * speed * dt, FIELD.x + 26, FIELD.x + FIELD.w - 26);
    shark.y = clamp(shark.y + (dy / len) * speed * dt, FIELD.y + 26, FIELD.y + FIELD.h - 26);
    if (dx !== 0) shark.facing = dx > 0 ? 1 : -1;
    if (dx !== 0 || dy !== 0) shark.heading = Math.atan2(dy, dx);
    shark.age += dt;

    if (input.wasPressed('KeyE') && this.held < 0) {
      let best = -1;
      let bestDist = 62;
      this.presents.forEach((gift, i) => {
        if (gift.wrapped || gift.held) return;
        const dist = Math.hypot(gift.x - shark.x, gift.y - shark.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      if (best >= 0) {
        this.held = best;
        this.presents[best].held = true;
        this.setStatus('HOLD LEFT-CLICK AND MOVE TO WRAP');
      } else {
        this.setStatus('SWIM CLOSER TO A PRESENT');
      }
    }
    if (this.held >= 0) {
      const gift = this.presents[this.held];
      if (input.pointer.down) {
        const moved = Math.hypot(input.pointer.x - this.lastPX, input.pointer.y - this.lastPY);
        if (moved > 0) gift.wrap = Math.min(100, gift.wrap + moved * 0.5);
      }
      if (gift.wrap >= 100) {
        gift.wrapped = true;
        gift.held = false;
        this.held = -1;
        this.setStatus('WRAPPED!');
        this.game.audio.tone({ freq: 520, endFreq: 900, type: 'triangle', duration: 0.14, volume: 0.2 });
        if (this.wrappedCount() === this.presents.length) {
          this.finish(true);
          return;
        }
      }
    }
    this.lastPX = input.pointer.x;
    this.lastPY = input.pointer.y;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finish(false);
    }
  }

  renderRound(ctx) {
    drawWreckLounge(ctx, this.time);

    const shark = this.shark;
    for (const gift of this.presents) {
      if (gift.held) continue;
      if (gift.wrapped) {
        fillRoundRect(ctx, gift.x - 20, gift.y - 18, 40, 36, 8, gift.color);
        strokeRoundRect(ctx, gift.x - 20, gift.y - 18, 40, 36, 8, '#ffe089', 3);
        ctx.strokeStyle = '#ffe089';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(gift.x - 20, gift.y - 18);
        ctx.lineTo(gift.x + 20, gift.y + 18);
        ctx.moveTo(gift.x + 20, gift.y - 18);
        ctx.lineTo(gift.x - 20, gift.y + 18);
        ctx.stroke();
        drawText(ctx, '✓', gift.x, gift.y - 30, { size: 16, color: COLORS.accent });
      } else {
        const dist = Math.hypot(gift.x - shark.x, gift.y - shark.y);
        if (dist < 150) {
          const alpha = clamp(1 - (dist - 35) / 115, 0.1, 1);
          ctx.globalAlpha = alpha;
          drawGiftShape(ctx, gift.x, gift.y, 18, gift.shape, gift.color);
          if (dist < 60) drawText(ctx, 'E', gift.x, gift.y + 32, { size: 11, color: COLORS.textDim, alpha: 0.7 });
          ctx.globalAlpha = 1;
        } else {
          const pulse = 0.5 + 0.5 * Math.sin(this.time * 3 + gift.x);
          ctx.globalAlpha = 0.06 + 0.05 * pulse;
          fillCircle(ctx, gift.x, gift.y, 3, '#cfefff');
          ctx.globalAlpha = 1;
        }
      }
    }

    shark.render(ctx);
    drawSkinAura(ctx, shark);
    drawTrail(ctx, shark);
    drawCompanion(ctx, shark);

    if (this.held >= 0) {
      const gift = this.presents[this.held];
      drawGiftShape(ctx, shark.x, shark.y - 46, 18, gift.shape, gift.color);
      fillRoundRect(ctx, shark.x - 34, shark.y - 78, 68, 8, 4, 'rgba(4, 16, 29, 0.6)');
      fillRoundRect(ctx, shark.x - 34, shark.y - 78, 68 * (gift.wrap / 100), 8, 4, COLORS.accent);
    }

    drawText(ctx, 'WRAP THE PRESENTS', LOGICAL_WIDTH / 2, 40, {
      size: 28,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 18,
    });
    drawText(ctx, 'SWIM AROUND TO FIND THE HIDDEN PRESENTS — E TAKES ONE — HOLD LEFT-CLICK + MOVE TO WRAP', LOGICAL_WIDTH / 2, 72, {
      size: 11,
      color: COLORS.foam,
      alpha: 0.85,
    });

    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, 330, 176, { size: 13, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    const ratio = Math.max(0, this.timeLeft / 120);
    fillRoundRect(ctx, 70, LOGICAL_HEIGHT - 40, 540, 10, 5, 'rgba(4, 16, 29, 0.65)');
    fillRoundRect(ctx, 70, LOGICAL_HEIGHT - 40, 540 * ratio, 10, 5, ratio < 0.2 ? COLORS.danger : COLORS.accent);
    drawText(ctx, `${Math.ceil(this.timeLeft)}s`, 340, LOGICAL_HEIGHT - 22, { size: 11, color: COLORS.textDim });

    this.renderChecklist(ctx);
  }

  renderChecklist(ctx) {
    const x = 700;
    const y = 96;
    const w = 244;
    const h = 388;
    fillRoundRect(ctx, x, y, w, h, 16, 'rgba(8, 26, 34, 0.9)');
    strokeRoundRect(ctx, x, y, w, h, 16, 'rgba(207, 239, 255, 0.28)', 2);
    drawText(ctx, 'PRESENTS', x + w / 2, y + 24, { size: 16, color: COLORS.accent, glow: '#ffd16666', glowBlur: 10 });
    drawText(ctx, `${this.wrappedCount()} / ${this.presents.length} WRAPPED`, x + w / 2, y + 46, {
      size: 11,
      color: COLORS.textDim,
    });
    this.presents.forEach((gift, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = x + 22 + col * 112;
      const cy = y + 78 + row * 58;
      fillRoundRect(ctx, cx, cy, 20, 20, 5, gift.wrapped ? COLORS.accent : 'rgba(4, 16, 29, 0.6)');
      strokeRoundRect(ctx, cx, cy, 20, 20, 5, 'rgba(207, 239, 255, 0.5)', 1.5);
      if (gift.wrapped) drawText(ctx, '✓', cx + 10, cy + 10, { size: 14, color: '#10233a' });
      fillRoundRect(ctx, cx + 28, cy - 4, 40, 28, 6, 'rgba(4, 16, 29, 0.5)');
      drawGiftShape(ctx, cx + 48, cy + 10, 11, gift.shape, gift.color);
    });
  }

  resultsTitle() {
    return 'PRESENT WRAP';
  }

  resultsHeadline() {
    return this.won ? 'ALL WRAPPED!' : 'OUT OF TIME';
  }

  resultsDetail() {
    return `${this.wrappedCount()} / ${this.presents.length} PRESENTS WRAPPED`;
  }
}
