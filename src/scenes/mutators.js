import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { MUTATORS, mutatorByKey } from '../engine/mutators.js';
import { COLORS, SETTINGS_KEY, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

export class MutatorsScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.returnScene = params.from ?? 'tanks';
    this.settings = loadJSON(SETTINGS_KEY, {});
    this.current = mutatorByKey(this.settings.mutator);
    const items = MUTATORS.map((mutator) => ({
      label: mutator.key === 'none' ? 'MUTATOR: OFF' : mutator.label,
      action: 'pick',
      key: mutator.key,
      highlight: mutator.key === this.current.key,
    }));
    items.push({ label: 'BACK', action: 'back' });
    this.menu = new SelectList(items, {
      glowColor: COLORS.bubble,
      accentColor: COLORS.accent,
      color: COLORS.text,
      spacing: 40,
      fontSize: 20,
      width: 520,
      onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
      onConfirm: (item) => this.choose(item),
    });
    this.menu.reset();
  }

  choose(item) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (item.action === 'back') {
      this.game.changeScene(this.returnScene);
      return;
    }
    this.settings.mutator = item.key;
    saveJSON(SETTINGS_KEY, this.settings);
    this.current = mutatorByKey(item.key);
    this.game.changeScene(this.returnScene);
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene(this.returnScene);
      return;
    }
    this.menu.update(dt, input);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'MUTATORS', LOGICAL_WIDTH / 2, 60, {
      size: 38,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 20,
    });
    drawText(ctx, 'HARDER DIVES PAY MORE COINS AND SCORE', LOGICAL_WIDTH / 2, 94, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.82,
    });
    this.menu.render(ctx, LOGICAL_WIDTH / 2 - 130, LOGICAL_HEIGHT * 0.54);
    const selected = mutatorByKey(this.menu.selected.key);
    fillRoundRect(ctx, 600, 190, 300, 200, 16, 'rgba(10, 39, 64, 0.86)');
    strokeRoundRect(ctx, 600, 190, 300, 200, 16, 'rgba(207, 239, 255, 0.25)', 2);
    drawText(ctx, selected.label, 750, 236, {
      size: 22,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.45)',
      glowBlur: 14,
    });
    drawText(ctx, selected.desc, 750, 278, {
      size: 13,
      color: COLORS.text,
      alpha: 0.9,
    });
    drawText(ctx, `SCORE x${selected.scoreMult}   COINS x${selected.coinMult}`, 750, 316, {
      size: 13,
      color: COLORS.bubble,
      alpha: 0.9,
    });
    if (selected.key === 'none') {
      drawText(ctx, 'STOCK DIVE — NO BONUS', 750, 350, {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.8,
      });
    }
    drawText(ctx, 'ENTER — SET MUTATOR      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 18, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.75,
    });
  }
}
