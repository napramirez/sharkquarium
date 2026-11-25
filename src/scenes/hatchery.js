import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { companionCatalog, companionByKey, setActiveCompanion, drawBuddyByKey, drawHybrid, hybridLabel } from '../engine/companion.js';
import {
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  WATER_PALETTE,
  HATCHERY,
  HATCHERY_KEY,
  COINS_KEY,
  COINS,
  SHOP_KEY,
} from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;

export class HatcheryScene extends Scene {
  enter() {
    this.time = 0;
    this.slot = 0;
    this.catalog = companionCatalog().filter((entry) => entry.key !== 'none');
    this.indexA = 0;
    this.indexB = this.catalog.length > 1 ? 1 : 0;
    this.coins = loadJSON(COINS_KEY, COINS.starting);
    this.status = 'PICK TWO DIVE BUDDIES, THEN HATCH A HYBRID';
    this.statusTimer = 4;
    const saved = loadJSON(HATCHERY_KEY, null);
    this.hatchling = saved && companionByKey('hybrid').key === 'hybrid' ? saved : null;
    this.hybridName = this.hatchling ? hybridLabel(this.hatchling.a, this.hatchling.b) : null;
  }

  moveSlot(step) {
    this.slot = (this.slot + step + 2) % 2;
    this.game.audio.tone({ freq: 560, duration: 0.05, volume: 0.1 });
  }

  moveIndex(step) {
    const n = this.catalog.length;
    if (this.slot === 0) this.indexA = (this.indexA + step + n) % n;
    else this.indexB = (this.indexB + step + n) % n;
    this.game.audio.tone({ freq: 500, duration: 0.05, volume: 0.1 });
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 3;
  }

  hatch() {
    const a = this.catalog[this.indexA].key;
    const b = this.catalog[this.indexB].key;
    if (this.coins < HATCHERY.cost) {
      this.setStatus('NOT ENOUGH SEA COINS TO HATCH');
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.2 });
      return;
    }
    this.coins -= HATCHERY.cost;
    saveJSON(COINS_KEY, this.coins);
    this.hatchling = { a, b };
    this.hybridName = hybridLabel(a, b);
    saveJSON(HATCHERY_KEY, this.hatchling);
    const shop = loadJSON(SHOP_KEY, {});
    shop.companion = 'hybrid';
    saveJSON(SHOP_KEY, shop);
    setActiveCompanion(companionByKey('hybrid'));
    this.setStatus('A HYBRID HATCHED \u2014 IT IS NOW YOUR DIVE BUDDY');
    this.game.audio.tone({ freq: 320, endFreq: 760, type: 'triangle', duration: 0.3, volume: 0.24 });
    this.game.audio.tone({ freq: 480, endFreq: 980, type: 'triangle', duration: 0.24, volume: 0.18, delay: 0.2 });
  }

  update(dt) {
    this.time += dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('menu');
      return;
    }
    if (input.wasPressed('up')) this.moveIndex(-1);
    if (input.wasPressed('down')) this.moveIndex(1);
    if (input.wasPressed('left')) this.moveSlot(-1);
    if (input.wasPressed('right')) this.moveSlot(1);
    if (input.wasPressed('confirm')) this.hatch();
  }

  renderParent(ctx, x, key, slotIndex, label) {
    const active = this.slot === slotIndex;
    fillRoundRect(ctx, x - 150, 176, 300, 168, 16, 'rgba(10, 39, 64, 0.82)');
    strokeRoundRect(ctx, x - 150, 176, 300, 168, 16, active ? COLORS.accent : 'rgba(207, 239, 255, 0.22)', active ? 2.5 : 1.5);
    drawText(ctx, label, x, 198, { size: 12, color: active ? COLORS.accent : COLORS.textDim });
    const entry = companionByKey(key);
    ctx.save();
    ctx.translate(x, 268);
    drawBuddyByKey(ctx, key, 30, this.time, slotIndex * 1.7);
    ctx.restore();
    drawText(ctx, entry.label, x, 322, { size: 15, color: COLORS.text });
  }

  render(ctx) {
    drawWater(ctx, W, H, this.time, WATER_PALETTE);
    drawText(ctx, 'HATCHERY', W / 2, 64, { size: 34, color: COLORS.text, glow: COLORS.bubble, glowBlur: 22 });
    drawText(ctx, 'COMBINE TWO DIVE BUDDIES INTO ONE HYBRID HATCHLING', W / 2, 94, {
      size: 11,
      color: COLORS.foam,
      alpha: 0.85,
    });

    const a = this.catalog[this.indexA].key;
    const b = this.catalog[this.indexB].key;
    this.renderParent(ctx, 250, a, 0, 'PARENT A');
    this.renderParent(ctx, 710, b, 1, 'PARENT B');

    drawText(ctx, '+', W / 2, 250, { size: 30, color: COLORS.textDim });
    ctx.save();
    ctx.translate(W / 2, 268);
    fillCircle(ctx, 0, 0, 40, 'rgba(8, 32, 52, 0.82)');
    if (this.hatchling) {
      drawHybrid(ctx, 26, this.time, 0.4, this.hatchling);
    } else {
      drawText(ctx, '?', 0, 0, { size: 30, color: COLORS.textDim });
    }
    ctx.restore();
    if (this.hatchling) {
      drawText(ctx, this.hybridName, W / 2, 316, {
        size: 13,
        color: COLORS.accent,
      });
    }

    fillRoundRect(ctx, W / 2 - 150, 372, 300, 40, 12, 'rgba(10, 39, 64, 0.82)');
    strokeRoundRect(ctx, W / 2 - 150, 372, 300, 40, 12, 'rgba(207, 239, 255, 0.3)', 1.5);
    drawText(ctx, `HATCH \u2014 ${HATCHERY.cost} COINS`, W / 2, 392, {
      size: 16,
      color: this.coins >= HATCHERY.cost ? COLORS.accent : COLORS.textDim,
    });
    drawText(ctx, `SEA COINS: ${this.coins}`, W - 24, 26, { size: 15, color: COLORS.text, align: 'right' });

    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, W / 2, 436, { size: 14, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    drawText(ctx, 'UP / DOWN \u2014 CHOOSE A BUDDY      LEFT / RIGHT \u2014 SWITCH SLOT      ENTER \u2014 HATCH      ESC \u2014 BACK', W / 2, H - 20, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.75,
    });
  }
}
