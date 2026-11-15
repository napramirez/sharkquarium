import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { achievementCatalog, earnedAchievements } from '../engine/achievements.js';
import { COLORS, WATER_PALETTE, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class AchievementsScene extends Scene {
  enter() {
    this.time = 0;
    this.items = achievementCatalog();
    this.earned = earnedAchievements();
    this.total = this.items.length;
    this.perPage = 9;
    this.scroll = 0;
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('menu');
      return;
    }
    const max = Math.max(0, this.items.length - this.perPage);
    if (input.wasPressed('down')) this.scroll = Math.min(max, this.scroll + 1);
    if (input.wasPressed('up')) this.scroll = Math.max(0, this.scroll - 1);
    if (input.wheel) this.scroll = Math.min(max, Math.max(0, this.scroll + Math.sign(input.wheel)));
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'ACHIEVEMENTS', LOGICAL_WIDTH / 2, 72, {
      size: 38,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    drawText(ctx, `${this.earned.size} / ${this.total} EARNED`, LOGICAL_WIDTH / 2, 108, {
      size: 14,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 10,
    });

    const panelX = 90;
    const panelW = LOGICAL_WIDTH - 180;
    const rowH = 40;
    const top = 140;
    fillRoundRect(ctx, panelX, top - 14, panelW, this.perPage * rowH + 20, 18, 'rgba(10, 39, 64, 0.72)');
    strokeRoundRect(ctx, panelX, top - 14, panelW, this.perPage * rowH + 20, 18, 'rgba(207, 239, 255, 0.3)', 2);

    const slice = this.items.slice(this.scroll, this.scroll + this.perPage);
    slice.forEach((item, index) => {
      const y = top + index * rowH;
      const got = this.earned.has(item.key);
      drawText(ctx, got ? '[x]' : '[ ]', panelX + 26, y, {
        size: 16,
        weight: 700,
        color: got ? COLORS.accent : COLORS.textDim,
        align: 'left',
      });
      drawText(ctx, item.label, panelX + 70, y - 8, {
        size: 16,
        weight: 700,
        color: got ? COLORS.text : COLORS.textDim,
        align: 'left',
        alpha: got ? 1 : 0.7,
      });
      drawText(ctx, item.desc, panelX + 70, y + 12, {
        size: 12,
        color: COLORS.foam,
        align: 'left',
        alpha: got ? 0.9 : 0.55,
      });
    });

    if (this.items.length > this.perPage) {
      drawText(ctx, '^', LOGICAL_WIDTH / 2, top - 24, { size: 14, color: COLORS.textDim, alpha: this.scroll > 0 ? 0.9 : 0.25 });
      drawText(
        ctx,
        'v',
        LOGICAL_WIDTH / 2,
        top + this.perPage * rowH + 22,
        { size: 14, color: COLORS.textDim, alpha: this.scroll < this.items.length - this.perPage ? 0.9 : 0.25 },
      );
    }
    drawText(ctx, 'UP/DOWN OR WHEEL — SCROLL      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 26, {
      size: 12,
      color: COLORS.textDim,
    });
  }
}
