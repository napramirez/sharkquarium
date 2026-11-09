import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { topTaggers, bestRunners } from '../engine/tagboard.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

const VISIBLE = 8;

export class TagBoardScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.returnScene = params.from ?? 'minigames';
    this.taggers = topTaggers(VISIBLE);
    this.runners = bestRunners(VISIBLE);
  }

  update(dt) {
    this.time += dt;
    if (this.game.input.wasPressed('back') || this.game.input.wasPressed('confirm')) {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
      this.game.changeScene(this.returnScene);
    }
  }

  renderColumn(ctx, x, title, blurb, rows, color, format, empty) {
    const w = 380;
    fillRoundRect(ctx, x - w / 2, 150, w, 330, 22, 'rgba(10, 39, 64, 0.9)');
    strokeRoundRect(ctx, x - w / 2, 150, w, 330, 22, 'rgba(207, 239, 255, 0.28)', 2);
    drawText(ctx, title, x, 186, { size: 22, color, glow: `${color}88`, glowBlur: 16 });
    drawText(ctx, blurb, x, 214, { size: 11, color: COLORS.textDim, alpha: 0.85 });
    if (rows.length === 0) {
      drawText(ctx, empty, x, 300, { size: 14, color: COLORS.textDim, alpha: 0.7 });
      return;
    }
    rows.forEach((row, index) => {
      const y = 252 + index * 27;
      drawText(ctx, `${index + 1}`, x - w / 2 + 30, y, { size: 15, color: COLORS.textDim, align: 'left' });
      drawText(ctx, row.name, x - w / 2 + 60, y, { size: 17, color: COLORS.text, align: 'left' });
      drawText(ctx, format(row.score), x + w / 2 - 26, y, { size: 17, color, align: 'right' });
    });
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'TAG LEADERBOARD', LOGICAL_WIDTH / 2, 84, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    drawText(ctx, 'THE SHARPEST TAGGERS AND THE SLIPPERIEST RUNNERS', LOGICAL_WIDTH / 2, 120, {
      size: 13,
      color: COLORS.foam,
      alpha: 0.8,
    });

    this.renderColumn(
      ctx,
      LOGICAL_WIDTH * 0.29,
      'BEST TAGGERS',
      'MOST PLAYERS TAGGED IN A MATCH',
      this.taggers,
      COLORS.accent,
      (n) => `${n} ${n === 1 ? 'TAG' : 'TAGS'}`,
      'NO TAGS RECORDED YET',
    );
    this.renderColumn(
      ctx,
      LOGICAL_WIDTH * 0.71,
      'BEST RUNNERS',
      'FEWEST TIMES CAUGHT AS IT',
      this.runners,
      '#63e6ff',
      (n) => (n === 0 ? 'NEVER IT' : `IT x${n}`),
      'NO RUNS RECORDED YET',
    );

    drawText(ctx, 'ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 26, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.75,
    });
  }
}
