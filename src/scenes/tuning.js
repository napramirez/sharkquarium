import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { clamp } from '../engine/math.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE, SETTINGS_KEY, DIFFICULTY } from '../config.js';
import { tuningActive } from '../engine/difficulty.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const TRACK_X = 300;
const TRACK_W = 340;
const LO = 0.5;
const HI = 3;
const KNOBS = [
  { key: 'enemySpeed', label: 'ENEMY SPEED' },
  { key: 'timeScale', label: 'CLOCK SPEED' },
  { key: 'penalty', label: 'PENALTIES' },
];

function fraction(v) {
  return clamp((v - LO) / (HI - LO), 0, 1);
}

export class TuningScene extends Scene {
  enter() {
    this.time = 0;
    this.index = 0;
    const saved = loadJSON(SETTINGS_KEY, {});
    this.base = saved.difficulty ?? 'normal';
    this.tuning = { enemySpeed: 1, timeScale: 1, penalty: 1, ...(saved.tuning ?? {}) };
  }

  save() {
    const saved = loadJSON(SETTINGS_KEY, {});
    saved.tuning = this.tuning;
    saveJSON(SETTINGS_KEY, saved);
  }

  adjust(step) {
    const key = KNOBS[this.index].key;
    const next = Math.round(clamp(this.tuning[key] + step, LO, HI) * 10) / 10;
    if (next === this.tuning[key]) return;
    this.tuning[key] = next;
    this.save();
    this.game.audio.tone({ freq: 480 + next * 120, duration: 0.05, volume: 0.14 });
  }

  reset() {
    this.tuning[KNOBS[this.index].key] = 1;
    this.save();
    this.game.audio.tone({ freq: 520, endFreq: 320, duration: 0.12, volume: 0.18 });
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('settings');
      return;
    }
    if (input.wasPressed('up')) this.index = (this.index + KNOBS.length - 1) % KNOBS.length;
    if (input.wasPressed('down')) this.index = (this.index + 1) % KNOBS.length;
    if (input.wasPressed('left')) this.adjust(-0.1);
    if (input.wasPressed('right')) this.adjust(0.1);
    if (input.wasPressed('confirm')) this.reset();
  }

  renderSlider(ctx, y, value, active) {
    fillRoundRect(ctx, TRACK_X, y - 5, TRACK_W, 10, 5, 'rgba(10, 39, 64, 0.9)');
    fillRoundRect(ctx, TRACK_X, y - 5, TRACK_W * fraction(value), 10, 5, 'rgba(255, 209, 102, 0.9)');
    strokeRoundRect(ctx, TRACK_X, y - 5, TRACK_W, 10, 5, 'rgba(207, 239, 255, 0.4)', 1.5);
    fillCircle(ctx, TRACK_X + TRACK_W * fraction(value), y, active ? 9 : 7, '#ffffff');
    drawText(ctx, `x${value.toFixed(1)}`, TRACK_X + TRACK_W + 30, y, {
      size: 14,
      color: active ? COLORS.accent : COLORS.text,
      align: 'left',
    });
  }

  render(ctx) {
    drawWater(ctx, W, H, this.time, WATER_PALETTE);
    drawText(ctx, 'CUSTOM DIFFICULTY', W / 2, 70, { size: 34, color: COLORS.text, glow: COLORS.bubble, glowBlur: 22 });
    drawText(
      ctx,
      `TUNED ON TOP OF YOUR ${(DIFFICULTY[this.base]?.label ?? 'NORMAL')} PRESET`,
      W / 2,
      100,
      { size: 12, color: COLORS.foam, alpha: 0.85 },
    );

    KNOBS.forEach((knob, i) => {
      const y = 220 + i * 70;
      const active = i === this.index;
      drawText(ctx, knob.label, 160, y, {
        size: 16,
        color: active ? COLORS.accent : COLORS.text,
        align: 'left',
      });
      this.renderSlider(ctx, y, this.tuning[knob.key], active);
    });

    drawText(
      ctx,
      tuningActive() ? 'CUSTOM TUNING ACTIVE IN EVERY DIVE' : 'DEFAULTS \u2014 MATCHES YOUR PRESET',
      W / 2,
      440,
      { size: 13, color: tuningActive() ? COLORS.accent : COLORS.textDim },
    );

    drawText(ctx, 'UP / DOWN \u2014 KNOB      LEFT / RIGHT \u2014 ADJUST      ENTER \u2014 RESET      ESC \u2014 BACK', W / 2, H - 24, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.78,
    });
  }
}
