import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { drawGiftShape } from '../engine/giftshapes.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const AREA = { x: 60, y: 120, w: 610, h: 340 };

export class PresentWrapScene extends MinigameScene {
  buildRound() {
    this.phase = 'play';
    this.player = { x: AREA.x + 100, y: AREA.y + AREA.h - 60, speed: 240 };
    const colors = ['#e2602e', '#3fa79b', '#c94b4b', '#a06fd0', '#d9a93c'];
    const shapes = ['square', 'circle', 'triangle', 'star', 'heart'];
    this.presents = shapes.map((shape, i) => ({
      x: AREA.x + 80 + i * 112,
      y: AREA.y + 80 + (i % 2) * 95,
      shape,
      color: colors[i],
      wrapped: false,
      held: false,
      wrap: 0,
    }));
    this.held = -1;
    this.timeLeft = 90;
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
    const p = this.player;
    const dx = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    const dy = (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1;
    p.x = clamp(p.x + (dx / len) * p.speed * dt, AREA.x + 20, AREA.x + AREA.w - 20);
    p.y = clamp(p.y + (dy / len) * p.speed * dt, AREA.y + 20, AREA.y + AREA.h - 20);
    if (input.wasPressed('KeyE') && this.held < 0) {
      let best = -1;
      let bestDist = 70;
      this.presents.forEach((gift, i) => {
        if (gift.wrapped || gift.held) return;
        const dist = Math.hypot(gift.x - p.x, gift.y - p.y);
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
        this.setStatus('MOVE CLOSER TO A PRESENT');
      }
    }
    if (this.held >= 0) {
      const gift = this.presents[this.held];
      if (input.pointer.down) {
        const mx = input.pointer.x - this.lastPX;
        const my = input.pointer.y - this.lastPY;
        const moved = Math.hypot(mx, my);
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
    fillRoundRect(ctx, AREA.x, AREA.y, AREA.w, AREA.h, 24, 'rgba(10, 32, 48, 0.55)');
    strokeRoundRect(ctx, AREA.x, AREA.y, AREA.w, AREA.h, 24, 'rgba(207, 239, 255, 0.22)', 2);
    fillRoundRect(ctx, AREA.x + 8, AREA.y + AREA.h - 46, AREA.w - 16, 38, 16, 'rgba(196, 175, 135, 0.4)');

    for (const gift of this.presents) {
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
        drawText(ctx, '✓', gift.x, gift.y - 30, { size: 18, color: COLORS.accent });
      } else if (!gift.held) {
        drawGiftShape(ctx, gift.x, gift.y, 20, gift.shape, gift.color);
        drawText(ctx, 'E', gift.x, gift.y + 34, { size: 12, color: COLORS.textDim, alpha: 0.7 });
      }
    }

    const p = this.player;
    fillCircle(ctx, p.x, p.y, 14, COLORS.accent);
    fillCircle(ctx, p.x - 5, p.y - 4, 3, '#10233a');
    fillCircle(ctx, p.x + 5, p.y - 4, 3, '#10233a');
    if (this.held >= 0) {
      const gift = this.presents[this.held];
      drawGiftShape(ctx, p.x, p.y - 42, 18, gift.shape, gift.color);
      fillRoundRect(ctx, p.x - 34, p.y - 74, 68, 8, 4, 'rgba(4, 16, 29, 0.6)');
      fillRoundRect(ctx, p.x - 34, p.y - 74, 68 * (gift.wrap / 100), 8, 4, COLORS.accent);
    }

    drawText(ctx, 'WRAP THE PRESENTS', LOGICAL_WIDTH / 2, 52, {
      size: 30,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 18,
    });
    drawText(ctx, 'WASD — MOVE      E — TAKE A PRESENT      HOLD LEFT-CLICK + MOVE — WRAP', LOGICAL_WIDTH / 2, 86, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.85,
    });

    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, AREA.y + AREA.h + 40, {
        size: 14,
        color: COLORS.accent,
        alpha: Math.min(1, this.statusTimer),
      });
    }

    const ratio = Math.max(0, this.timeLeft / 90);
    fillRoundRect(ctx, 60, LOGICAL_HEIGHT - 44, LOGICAL_WIDTH - 120, 10, 5, 'rgba(4, 16, 29, 0.6)');
    fillRoundRect(ctx, 60, LOGICAL_HEIGHT - 44, (LOGICAL_WIDTH - 120) * ratio, 10, 5, ratio < 0.2 ? COLORS.danger : COLORS.accent);
    drawText(ctx, `${Math.ceil(this.timeLeft)}s`, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 24, {
      size: 12,
      color: COLORS.textDim,
    });

    this.renderChecklist(ctx);
  }

  renderChecklist(ctx) {
    const x = 706;
    const y = 120;
    fillRoundRect(ctx, x, y, 232, 340, 18, 'rgba(10, 39, 64, 0.9)');
    strokeRoundRect(ctx, x, y, 232, 340, 18, 'rgba(207, 239, 255, 0.28)', 2);
    drawText(ctx, 'PRESENTS', x + 116, y + 24, { size: 16, color: COLORS.accent, glow: '#ffd16666', glowBlur: 10 });
    drawText(ctx, `${this.wrappedCount()} / ${this.presents.length} WRAPPED`, x + 116, y + 48, {
      size: 12,
      color: COLORS.textDim,
    });
    this.presents.forEach((gift, i) => {
      const rowY = y + 82 + i * 50;
      fillRoundRect(ctx, x + 16, rowY - 16, 22, 22, 5, gift.wrapped ? COLORS.accent : 'rgba(4, 16, 29, 0.6)');
      strokeRoundRect(ctx, x + 16, rowY - 16, 22, 22, 5, 'rgba(207, 239, 255, 0.5)', 1.5);
      if (gift.wrapped) {
        drawText(ctx, '✓', x + 27, rowY - 5, { size: 16, color: '#10233a' });
      }
      drawGiftShape(ctx, x + 78, rowY - 5, 15, gift.shape, gift.color);
      drawText(ctx, gift.wrapped ? 'WRAPPED' : gift.held ? 'WRAPPING' : 'TO WRAP', x + 118, rowY - 5, {
        size: 12,
        color: gift.wrapped ? COLORS.accent : COLORS.textDim,
        align: 'left',
        alpha: 0.9,
      });
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
