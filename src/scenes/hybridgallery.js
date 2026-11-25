import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { loadJSON } from '../engine/storage.js';
import { drawHybrid, hybridLabel } from '../engine/companion.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE, HATCHERY_KEY } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;

export class HybridGalleryScene extends Scene {
  enter() {
    this.time = 0;
    const saved = loadJSON(HATCHERY_KEY, null);
    this.history = saved && Array.isArray(saved.history) ? saved.history.slice() : [];
    if (this.history.length === 0 && saved && saved.a && saved.b) this.history = [{ a: saved.a, b: saved.b }];
    const items = this.history.map((combo) => ({
      label: hybridLabel(combo.a, combo.b),
      action: 'none',
      combo,
    }));
    if (!items.length) items.push({ label: 'NO HATCHLINGS YET', action: 'none', disabled: true });
    items.push({ label: 'BACK', action: 'back' });
    this.menu = new SelectList(items, {
      glowColor: COLORS.bubble,
      accentColor: COLORS.accent,
      color: COLORS.text,
      spacing: 32,
      fontSize: 16,
      visible: 9,
      wheel: true,
      onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
      onConfirm: (item) => {
        if (item.action === 'back') this.game.changeScene('hatchery');
      },
    });
    this.menu.reset();
  }

  get current() {
    const item = this.menu.items[this.menu.index];
    return item && item.combo ? item.combo : null;
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('hatchery');
      return;
    }
    this.menu.update(dt, input);
  }

  render(ctx) {
    drawWater(ctx, W, H, this.time, WATER_PALETTE);
    drawText(ctx, 'HYBRID GALLERY', W / 2, 64, { size: 34, color: COLORS.text, glow: COLORS.bubble, glowBlur: 22 });
    drawText(ctx, `${this.history.length} HATCHLING${this.history.length === 1 ? '' : 'S'} COLLECTED`, W / 2, 94, {
      size: 11,
      color: COLORS.foam,
      alpha: 0.85,
    });

    fillRoundRect(ctx, 30, 130, 300, 340, 18, 'rgba(10, 39, 64, 0.82)');
    strokeRoundRect(ctx, 30, 130, 300, 340, 18, 'rgba(207, 239, 255, 0.22)', 2);
    this.menu.render(ctx, 180, 320);

    fillRoundRect(ctx, 360, 130, 570, 340, 22, 'rgba(8, 32, 52, 0.9)');
    strokeRoundRect(ctx, 360, 130, 570, 340, 22, 'rgba(207, 239, 255, 0.28)', 2);

    const combo = this.current;
    if (combo) {
      ctx.save();
      ctx.translate(645, 296);
      drawHybrid(ctx, 54, this.time, 0.4, combo);
      ctx.restore();
      drawText(ctx, hybridLabel(combo.a, combo.b), 645, 402, {
        size: 20,
        color: COLORS.accent,
        glow: 'rgba(255, 209, 102, 0.4)',
        glowBlur: 12,
      });
      drawText(ctx, `${combo.a} + ${combo.b}`, 645, 428, { size: 12, color: COLORS.textDim });
    }

    drawText(ctx, 'UP / DOWN \u2014 BROWSE      ENTER \u2014 BACK TO THE HATCHERY      ESC \u2014 BACK', W / 2, H - 22, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.75,
    });
  }
}
