import { COLORS, ROUND, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';
import { clamp } from '../engine/math.js';
import { drawText, fillRoundRect, fillCircle, strokeCircle } from '../engine/render.js';

export class Hud {
  constructor() {
    this.time = 0;
    this.lastScore = 0;
    this.scorePulse = 0;
    this.barRatio = 1;
  }

  update(dt, state) {
    this.time += dt;
    if (state.score > this.lastScore) this.scorePulse = 1;
    this.lastScore = state.score;
    this.scorePulse = Math.max(0, this.scorePulse - dt * 3);
    const target = clamp(state.timeLeft / state.timeLimit, 0, 1);
    this.barRatio += (target - this.barRatio) * (1 - Math.exp(-12 * dt));
  }

  render(ctx, state) {
    const low = state.timeLeft <= ROUND.lowTimeThreshold;
    const pulse = low ? 0.6 + 0.4 * Math.sin(this.time * 8) : 1;

    const bump = 1 + this.scorePulse * 0.22;
    fillCircle(
      ctx,
      34,
      36,
      10,
      this.scorePulse > 0 ? 'rgba(255, 209, 102, 0.35)' : 'rgba(207, 239, 255, 0.25)',
    );
    strokeCircle(ctx, 34, 36, 10, this.scorePulse > 0 ? COLORS.accent : COLORS.bubble, 1.5);
    drawText(ctx, `${state.score}`, 54, 38, {
      size: 30 * bump,
      align: 'left',
      color: COLORS.text,
      glow: this.scorePulse > 0 ? COLORS.accent : null,
      glowBlur: 14,
    });
    drawText(ctx, `BEST ${state.best}`, LOGICAL_WIDTH - 24, 36, {
      size: 14,
      align: 'right',
      color: COLORS.textDim,
    });

    const barWidth = 300;
    const barHeight = 14;
    const barX = (LOGICAL_WIDTH - barWidth) / 2;
    const barY = 26;
    fillRoundRect(ctx, barX, barY, barWidth, barHeight, barHeight / 2, 'rgba(4, 16, 29, 0.6)');
    if (this.barRatio > 0.01) {
      ctx.save();
      ctx.globalAlpha = pulse;
      fillRoundRect(
        ctx,
        barX,
        barY,
        Math.max(barHeight, barWidth * this.barRatio),
        barHeight,
        barHeight / 2,
        low ? COLORS.danger : COLORS.accent,
      );
      ctx.restore();
    }
    drawText(
      ctx,
      `TIME ${Math.max(0, Math.ceil(state.timeLeft))}`,
      LOGICAL_WIDTH / 2,
      barY + barHeight + 18,
      {
        size: 13,
        color: low ? COLORS.danger : COLORS.textDim,
      },
    );

    drawText(ctx, 'ESC — PAUSE', LOGICAL_WIDTH - 24, LOGICAL_HEIGHT - 18, {
      size: 12,
      align: 'right',
      color: COLORS.textDim,
      alpha: 0.55,
    });
    if (state.empty) {
      drawText(ctx, 'EMPTY TANK — UI TEST', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 18, {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.6,
      });
    }
  }
}
