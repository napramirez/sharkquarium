import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { SEA_FACTS, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE, SETTINGS_KEY } from '../config.js';
import { drawCreatureIcon } from '../engine/codexicons.js';
import { memeName } from '../engine/meme.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;

export class FavoriteScene extends Scene {
  enter() {
    this.time = 0;
    const settings = loadJSON(SETTINGS_KEY, {});
    this.favorite = typeof settings.favorite === 'string' ? settings.favorite : null;
    this.status = this.favorite ? `YOUR FAVOURITE IS ${this.favorite}` : 'PICK YOUR FAVOURITE CREATURE';
    this.statusTimer = 4;

    const items = SEA_FACTS.map((fact) => ({ label: memeName(fact.name), action: 'pick', name: fact.name }));
    items.push({ label: 'CLEAR FAVOURITE', action: 'clear' });
    items.push({ label: 'BACK', action: 'back' });
    this.menu = new SelectList(items, {
      glowColor: COLORS.bubble,
      accentColor: COLORS.accent,
      color: COLORS.text,
      spacing: 30,
      fontSize: 15,
      visible: 10,
      wheel: true,
      onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
      onConfirm: (item) => this.choose(item),
    });
    this.menu.reset();
    if (this.favorite) {
      const idx = items.findIndex((item) => item.name === this.favorite);
      if (idx >= 0) this.menu.setIndex(idx, false);
    }
  }

  get highlighted() {
    const item = this.menu.items[this.menu.index];
    return item && item.name ? item.name : this.favorite;
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 3;
  }

  choose(item) {
    if (item.action === 'back') {
      this.game.changeScene('menu');
      return;
    }
    const settings = loadJSON(SETTINGS_KEY, {});
    if (item.action === 'clear') {
      delete settings.favorite;
      this.favorite = null;
      saveJSON(SETTINGS_KEY, settings);
      this.setStatus('FAVOURITE CLEARED');
      this.game.audio.tone({ freq: 320, endFreq: 200, duration: 0.14, volume: 0.18 });
      return;
    }
    settings.favorite = item.name;
    this.favorite = item.name;
    saveJSON(SETTINGS_KEY, settings);
    this.setStatus(`FAVOURITE SET TO ${item.name}`);
    this.game.audio.tone({ freq: 520, endFreq: 880, type: 'triangle', duration: 0.22, volume: 0.22 });
  }

  update(dt) {
    this.time += dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('menu');
      return;
    }
    this.menu.update(dt, input);
  }

  render(ctx) {
    drawWater(ctx, W, H, this.time, WATER_PALETTE);
    drawText(ctx, 'FAVOURITE CREATURE', W / 2, 64, { size: 34, color: COLORS.text, glow: COLORS.bubble, glowBlur: 22 });
    drawText(ctx, 'PICK ANY CREATURE \u2014 PLAYABLE OR ENEMY \u2014 AS YOUR FAVOURITE', W / 2, 94, {
      size: 11,
      color: COLORS.foam,
      alpha: 0.85,
    });

    fillRoundRect(ctx, 30, 130, 260, 340, 18, 'rgba(10, 39, 64, 0.82)');
    strokeRoundRect(ctx, 30, 130, 260, 340, 18, 'rgba(207, 239, 255, 0.22)', 2);
    this.menu.render(ctx, 160, 320);

    fillRoundRect(ctx, 320, 130, 610, 340, 22, 'rgba(8, 32, 52, 0.9)');
    strokeRoundRect(ctx, 320, 130, 610, 340, 22, 'rgba(207, 239, 255, 0.28)', 2);

    const name = this.highlighted;
    if (name) {
      drawCreatureIcon(ctx, name, 445, 300, 150, this.time);
      drawText(ctx, memeName(name), 560, 190, { size: 24, color: COLORS.accent, align: 'left', glow: 'rgba(255, 209, 102, 0.4)', glowBlur: 14 });
    }

    if (this.favorite) {
      drawText(ctx, `CURRENT FAVOURITE: ${memeName(this.favorite)}`, W / 2, 438, {
        size: 14,
        color: COLORS.bubble,
      });
    }
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, W / 2, H - 44, { size: 14, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    drawText(ctx, 'UP / DOWN OR SCROLL WHEEL \u2014 BROWSE      ENTER \u2014 SET FAVOURITE      ESC \u2014 BACK', W / 2, H - 18, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.75,
    });
  }
}
