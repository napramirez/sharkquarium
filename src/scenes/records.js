import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { getRecord, formatTime } from '../engine/records.js';
import {
  MODE_LABELS,
  RECORD_GROUPS,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  WATER_PALETTE,
} from '../config.js';

const VISIBLE = 9;

export class RecordsScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.groupIndex = 0;
    this.rowIndex = 0;
    this.returnScene = params.from ?? 'minigames';
  }

  get group() {
    return RECORD_GROUPS[this.groupIndex];
  }

  moveGroup(step) {
    const count = RECORD_GROUPS.length;
    this.groupIndex = (this.groupIndex + step + count) % count;
    this.rowIndex = 0;
    this.game.audio.tone({ freq: 480 + this.groupIndex * 60, duration: 0.06, volume: 0.14 });
  }

  moveRow(step) {
    const count = this.group.modes.length;
    this.rowIndex = (this.rowIndex + step + count) % count;
    this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.1 });
  }

  totalCleared() {
    let cleared = 0;
    let total = 0;
    for (const group of RECORD_GROUPS) {
      for (const mode of group.modes) {
        total += 1;
        if (getRecord(mode).cleared) cleared += 1;
      }
    }
    return { cleared, total };
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
      this.game.changeScene(this.returnScene);
      return;
    }
    if (input.wasPressed('left')) this.moveGroup(-1);
    if (input.wasPressed('right')) this.moveGroup(1);
    if (input.wasPressed('up')) this.moveRow(-1);
    if (input.wasPressed('down')) this.moveRow(1);
  }

  renderTabs(ctx) {
    const spacing = 220;
    const startX = LOGICAL_WIDTH / 2 - ((RECORD_GROUPS.length - 1) * spacing) / 2;
    RECORD_GROUPS.forEach((group, index) => {
      const x = startX + index * spacing;
      const active = index === this.groupIndex;
      drawText(ctx, group.title, x, 122, {
        size: active ? 18 : 14,
        color: active ? COLORS.accent : COLORS.textDim,
        glow: active ? 'rgba(255, 209, 102, 0.45)' : null,
        glowBlur: 12,
        alpha: active ? 1 : 0.7,
      });
      if (active) {
        ctx.fillStyle = COLORS.accent;
        ctx.fillRect(x - 74, 138, 148, 2.5);
      }
    });
  }

  renderList(ctx) {
    fillRoundRect(ctx, 180, 168, 600, 320, 18, 'rgba(10, 39, 64, 0.82)');
    strokeRoundRect(ctx, 180, 168, 600, 320, 18, 'rgba(207, 239, 255, 0.22)', 2);
    const modes = this.group.modes;
    const offset = clamp(this.rowIndex - Math.floor(VISIBLE / 2), 0, Math.max(0, modes.length - VISIBLE));
    for (let row = 0; row < Math.min(VISIBLE, modes.length); row += 1) {
      const index = offset + row;
      const mode = modes[index];
      const record = getRecord(mode);
      const y = 200 + row * 32;
      const active = index === this.rowIndex;
      if (active) {
        fillRoundRect(ctx, 196, y - 14, 568, 28, 9, 'rgba(255, 209, 102, 0.14)');
      }
      drawText(ctx, MODE_LABELS[mode] ?? mode.toUpperCase(), 214, y, {
        size: 14,
        color: active ? COLORS.accent : COLORS.text,
        align: 'left',
        alpha: active ? 1 : 0.82,
      });
      drawText(ctx, formatTime(record.time), 640, y, {
        size: 14,
        color: COLORS.bubble,
        align: 'right',
        alpha: active ? 1 : 0.7,
      });
      drawText(ctx, record.score != null ? `${record.score}` : '—', 760, y, {
        size: 14,
        color: record.cleared ? COLORS.accent : COLORS.textDim,
        align: 'right',
        alpha: active ? 1 : 0.65,
      });
    }
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'RECORDS', LOGICAL_WIDTH / 2, 52, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 20,
    });
    const { cleared, total } = this.totalCleared();
    drawText(ctx, `BEST TIME PER MODE — ${cleared}/${total} CLEARED`, LOGICAL_WIDTH / 2, 88, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.82,
    });
    this.renderTabs(ctx);
    this.renderList(ctx);
    drawText(ctx, 'TIME', 640, 184, { size: 11, color: COLORS.textDim, align: 'right', alpha: 0.7 });
    drawText(ctx, 'SCORE', 760, 184, { size: 11, color: COLORS.textDim, align: 'right', alpha: 0.7 });
    drawText(
      ctx,
      'LEFT/RIGHT — GROUP      UP/DOWN — MODE      ESC — BACK',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 12, color: COLORS.textDim, alpha: 0.75 },
    );
  }
}
