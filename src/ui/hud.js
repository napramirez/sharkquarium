import { COLORS, EEL, ROUND, SEAL, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';
import { clamp } from '../engine/math.js';
import { drawText, fillRoundRect, strokeRoundRect, fillCircle, strokeCircle } from '../engine/render.js';

export const PAUSE_BUTTON = {
  x: 26,
  y: LOGICAL_HEIGHT - 62,
  width: 36,
  height: 36,
};

export function hitPauseButton(x, y) {
  return (
    x >= PAUSE_BUTTON.x &&
    x <= PAUSE_BUTTON.x + PAUSE_BUTTON.width &&
    y >= PAUSE_BUTTON.y &&
    y <= PAUSE_BUTTON.y + PAUSE_BUTTON.height
  );
}

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
    if (state.coop) {
      drawText(ctx, 'P1 — WASD', 28, 64, {
        size: 12,
        align: 'left',
        color: COLORS.bubble,
        alpha: 0.8,
      });
      drawText(ctx, 'P2 — ARROWS', 28, 82, {
        size: 12,
        align: 'left',
        color: COLORS.accent,
        alpha: 0.8,
      });
    }

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
    if (state.eel) {
      const labels = {
        hidden: [
          `EELS — IN THEIR HOLES ${state.eelCharge ?? 0}/${state.eelNeed ?? EEL.bubblesPerHunt}`,
          COLORS.textDim,
          0.7,
        ],
        peek: ['EELS — PEEKING OUT', COLORS.danger, 0.85],
        hunt: ['EELS — HUNTING', COLORS.danger, 0.65 + 0.35 * Math.sin(this.time * 8)],
        retreat: ['EELS — RETREATING', COLORS.foam, 0.8],
      };
      const [label, color, alpha] = labels[state.eel] ?? labels.hidden;
      drawText(ctx, label, LOGICAL_WIDTH / 2, barY + barHeight + 42, {
        size: 12,
        color,
        alpha,
      });
    }
    if (state.angler) {
      const labels = {
        roam: ['ANGLERFISH — ROAMING', COLORS.textDim, 0.7],
        search: ['ANGLERFISH — SEARCHING', COLORS.accent, 0.85],
        chase: ['ANGLERFISH — HUNTING', COLORS.danger, 0.65 + 0.35 * Math.sin(this.time * 8)],
      };
      const [label, color, alpha] = labels[state.angler] ?? labels.roam;
      drawText(ctx, label, LOGICAL_WIDTH / 2, barY + barHeight + 42, {
        size: 12,
        color,
        alpha,
      });
    }
    if (state.seal) {
      const labels = {
        perched: [
          `SEALS — ON THE ICE ${state.sealCharge ?? 0}/${state.sealNeed ?? SEAL.chargePlankton}`,
          COLORS.textDim,
          0.7,
        ],
        dive: ['SEALS — DIVING', COLORS.danger, 0.9],
        chase: ['SEALS — HUNTING', COLORS.danger, 0.65 + 0.35 * Math.sin(this.time * 8)],
        return: ['SEALS — CLIMBING BACK', COLORS.foam, 0.8],
      };
      const [label, color, alpha] = labels[state.seal] ?? labels.perched;
      drawText(ctx, label, LOGICAL_WIDTH / 2, barY + barHeight + 42, {
        size: 12,
        color,
        alpha,
      });
    }
    if (state.turtle) {
      const points = state.minibossPoints ?? 0;
      const labels = {
        patrol: [`MINIBOSS ${points}/10 — TURTLE PATROLLING`, COLORS.textDim, 0.75],
        charging: [
          `MINIBOSS ${points}/10 — TURTLE CHARGING`,
          COLORS.danger,
          0.65 + 0.35 * Math.sin(this.time * 8),
        ],
        recover: [`MINIBOSS ${points}/10 — TURTLE RECOVERING`, COLORS.textDim, 0.75],
        stunned: [`MINIBOSS ${points}/10 — TURTLE STUNNED`, COLORS.foam, 0.9],
      };
      const [label, color, alpha] = labels[state.turtle] ?? labels.patrol;
      drawText(ctx, label, LOGICAL_WIDTH / 2, barY + barHeight + 42, {
        size: 12,
        color,
        alpha,
      });
    }
    if (state.catfish) {
      const progress = Math.round((state.sunrise ?? 0) * 100);
      const labels = {
        lurking: [`CATFISH — LURKING BEHIND — SUNRISE ${progress}%`, COLORS.textDim, 0.75],
        chase: [
          `CATFISH — CHASING — SUNRISE ${progress}%`,
          COLORS.danger,
          0.65 + 0.35 * Math.sin(this.time * 8),
        ],
        stunned: [`CATFISH — STUNNED — SUNRISE ${progress}%`, COLORS.foam, 0.9],
      };
      const [label, color, alpha] = labels[state.catfish] ?? labels.chase;
      drawText(ctx, label, LOGICAL_WIDTH / 2, barY + barHeight + 42, {
        size: 12,
        color,
        alpha,
      });
    }

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
    } else if (state.tank === 'stingray') {
      drawText(
        ctx,
        state.hidden
          ? 'LEFT / RIGHT TO CRAWL — UP TO SURFACE'
          : 'HOLD DOWN ON THE SAND TO HIDE FROM THE EELS',
        LOGICAL_WIDTH / 2,
        LOGICAL_HEIGHT - 18,
        {
          size: 12,
          color: COLORS.textDim,
          alpha: 0.65,
        },
      );
    } else if (state.tank === 'deepsea') {
      drawText(
        ctx,
        state.hidden
          ? 'HIDDEN IN THE LEDGE — RELEASE DOWN TO SWIM OUT'
          : 'HOLD DOWN NEAR A LEDGE HOLE TO HIDE FROM THE ANGLERFISH',
        LOGICAL_WIDTH / 2,
        LOGICAL_HEIGHT - 18,
        {
          size: 12,
          color: COLORS.textDim,
          alpha: 0.65,
        },
      );
    } else if (state.tank === 'arctic') {
      drawText(
        ctx,
        state.hidden
          ? 'IN THE SARDINE SCHOOL — PRESS UP TO BREAK AWAY'
          : 'SWIM INTO A SARDINE SCHOOL TO HIDE FROM THE SEALS',
        LOGICAL_WIDTH / 2,
        LOGICAL_HEIGHT - 18,
        {
          size: 12,
          color: COLORS.textDim,
          alpha: 0.65,
        },
      );
    } else if (state.tank === 'jelly') {
      drawText(
        ctx,
        "SWIM INTO MINNOWS TO TANGLE THEM — RAM THE TURTLE'S HEAD TO STUN IT",
        LOGICAL_WIDTH / 2,
        LOGICAL_HEIGHT - 18,
        {
          size: 12,
          color: COLORS.textDim,
          alpha: 0.65,
        },
      );
    } else if (state.tank === 'freshwater') {
      drawText(
        ctx,
        'DOWN OVER THE SAND DODGES ROCKS — LET PIRANHAS PAST TO STUN THE CATFISH',
        LOGICAL_WIDTH / 2,
        LOGICAL_HEIGHT - 18,
        {
          size: 12,
          color: COLORS.textDim,
          alpha: 0.65,
        },
      );
    }
    this.renderPauseButton(ctx);
  }

  renderPauseButton(ctx) {
    fillRoundRect(
      ctx,
      PAUSE_BUTTON.x,
      PAUSE_BUTTON.y,
      PAUSE_BUTTON.width,
      PAUSE_BUTTON.height,
      10,
      'rgba(10, 39, 64, 0.7)',
    );
    strokeRoundRect(
      ctx,
      PAUSE_BUTTON.x,
      PAUSE_BUTTON.y,
      PAUSE_BUTTON.width,
      PAUSE_BUTTON.height,
      10,
      'rgba(207, 239, 255, 0.35)',
      1.5,
    );
    fillRoundRect(ctx, PAUSE_BUTTON.x + 13, PAUSE_BUTTON.y + 11, 4, 14, 2, COLORS.text);
    fillRoundRect(ctx, PAUSE_BUTTON.x + 21, PAUSE_BUTTON.y + 11, 4, 14, 2, COLORS.text);
  }
}
