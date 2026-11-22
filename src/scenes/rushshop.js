import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillCircle, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp, TAU } from '../engine/math.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { setActiveSkin } from '../engine/skin.js';
import {
  loadRushShop,
  rushShopLadder,
  bankRushDistance,
  equippedFormSkins,
  equipFormSkin,
} from '../engine/rushshop.js';
import { drawStingrayBody } from '../entities/stingray.js';
import { drawDolphinBody } from '../entities/dolphin.js';
import { drawZipEelHead } from '../entities/zipeel.js';
import { drawNautilusBody } from '../entities/nautilus.js';
import { drawAmmonite } from '../entities/ammonite.js';
import { drawPufferBody } from '../entities/pufferfish.js';
import { drawLoosejaw } from '../entities/deepfish.js';
import {
  COLORS,
  SHOP_KEY,
  RUSH_FORMS,
  RUSH_FORM_SKINS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  WATER_PALETTE,
} from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const COLS = 3;
const CARD_W = 180;
const CARD_H = 120;
const CARD_GAP = 16;
const GRID_LEFT = 290;
const GRID_TOP = 124;
const TAB_X = 36;
const TAB_Y = 104;
const TAB_W = 210;
const TAB_H = 372;
const TAB_ROW = 36;
const TAB_START = 134;

export class RushShopScene extends Scene {
  enter() {
    this.time = 0;
    bankRushDistance(loadRushShop().best);
    this.state = loadRushShop();
    this.ladder = rushShopLadder();
    this.shop = loadJSON(SHOP_KEY, {});
    this.shop.owned = Array.isArray(this.shop.owned) ? this.shop.owned : ['natural'];
    this.formSkins = equippedFormSkins();
    this.tabIndex = 0;
    this.skinIndex = 0;
    this.status = null;
    this.statusTimer = 0;
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
  }

  currentForm() {
    return RUSH_FORMS[this.tabIndex];
  }

  currentSkins() {
    const form = this.currentForm().key;
    if (form === 'fish') return this.ladder;
    const list = RUSH_FORM_SKINS[form];
    if (list) return list;
    return [{ key: 'default', label: this.currentForm().label }];
  }

  owned(key) {
    return this.shop.owned.includes(key);
  }

  equippedFor(form, key) {
    if (form === 'fish') return this.shop.skin === key;
    const active = this.formSkins[form] ?? 'default';
    return active === key;
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2.6;
  }

  setTab(index) {
    this.tabIndex = clamp(index, 0, RUSH_FORMS.length - 1);
    this.skinIndex = 0;
    this.game.audio.tone({ freq: 420 + this.tabIndex * 30, duration: 0.06, volume: 0.12 });
  }

  moveTab(step) {
    this.setTab(this.tabIndex + step);
  }

  moveSkin(step) {
    const count = this.currentSkins().length;
    this.skinIndex = clamp(this.skinIndex + step, 0, count - 1);
    this.game.audio.tone({ freq: 520 + this.skinIndex * 40, duration: 0.06, volume: 0.12 });
  }

  equip() {
    const form = this.currentForm().key;
    const skins = this.currentSkins();
    const skin = skins[this.skinIndex];
    if (!skin) return;
    if (form === 'fish') {
      if (!this.owned(skin.key)) {
        this.setStatus(`REACH ${skin.rushAt}M IN REEF RUSH — ENDLESS`);
        this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.2 });
        return;
      }
      this.shop.skin = skin.key;
      saveJSON(SHOP_KEY, this.shop);
      setActiveSkin(skin);
      this.setStatus(`${skin.label} EQUIPPED`);
      this.game.audio.tone({ freq: 620, endFreq: 940, duration: 0.14, volume: 0.2 });
      return;
    }
    equipFormSkin(form, skin.key);
    this.formSkins = equippedFormSkins();
    this.setStatus(skin.key === 'default' ? `${skin.label} RESTORED` : `${skin.label} EQUIPPED`);
    this.game.audio.tone({ freq: 620, endFreq: 940, duration: 0.14, volume: 0.2 });
  }

  tabRect(index) {
    return { x: TAB_X + 8, y: TAB_START + index * TAB_ROW - 15, w: TAB_W - 16, h: TAB_ROW - 6 };
  }

  cardRect(index) {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    return {
      x: GRID_LEFT + col * (CARD_W + CARD_GAP),
      y: GRID_TOP + row * (CARD_H + CARD_GAP),
      w: CARD_W,
      h: CARD_H,
    };
  }

  tabAt(x, y) {
    for (let i = 0; i < RUSH_FORMS.length; i += 1) {
      const b = this.tabRect(i);
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return i;
    }
    return -1;
  }

  cardAt(x, y) {
    const count = this.currentSkins().length;
    for (let i = 0; i < count; i += 1) {
      const b = this.cardRect(i);
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return i;
    }
    return -1;
  }

  update(dt) {
    this.time += dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('rushlevels');
      return;
    }
    if (input.wasPressed('up')) this.moveTab(-1);
    if (input.wasPressed('down')) this.moveTab(1);
    if (input.wasPressed('left')) this.moveSkin(-1);
    if (input.wasPressed('right')) this.moveSkin(1);
    if (input.wasPressed('confirm')) {
      if (input.pointer.down) {
        const tab = this.tabAt(input.pointer.x, input.pointer.y);
        if (tab !== -1 && tab !== this.tabIndex) {
          this.setTab(tab);
          return;
        }
        const hit = this.cardAt(input.pointer.x, input.pointer.y);
        if (hit !== -1) {
          if (hit === this.skinIndex) this.equip();
          else this.skinIndex = hit;
        }
        return;
      }
      this.equip();
    }
  }

  renderSwatch(ctx, skin, x, y, w, h, active) {
    fillRoundRect(ctx, x, y, w, h, 10, skin.body ?? '#4e535b');
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h * 0.34);
    ctx.clip();
    fillRoundRect(ctx, x, y, w, h, 10, skin.accent ?? '#8b929c');
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y + h * 0.66, w, h * 0.34);
    ctx.clip();
    fillRoundRect(ctx, x, y, w, h, 10, skin.belly ?? '#c3c9d2');
    ctx.restore();
    strokeRoundRect(ctx, x, y, w, h, 10, active ? COLORS.accent : 'rgba(10, 20, 30, 0.5)', active ? 3 : 2);
  }

  drawFormPreview(ctx, form, key, cx, cy, size, time) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.5, 0, TAU);
    const bg = ctx.createRadialGradient(cx, cy - size * 0.1, size * 0.08, cx, cy, size * 0.5);
    bg.addColorStop(0, 'rgba(20, 52, 78, 0.95)');
    bg.addColorStop(1, 'rgba(6, 22, 36, 0.95)');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.clip();
    ctx.translate(cx, cy);
    const r = size * 0.3;
    if (form === 'stingray') {
      if (key === 'dolphin') drawDolphinBody(ctx, r, { age: time });
      else drawStingrayBody(ctx, r * 1.05, { raw: true, tailPhase: time * 6 });
    } else if (form === 'eel') {
      if (key === 'loosejaw') drawLoosejaw(ctx, r * 0.62, { age: time });
      else drawZipEelHead(ctx, r * 0.9, 1);
    } else if (form === 'nautilus') {
      if (key === 'ammonite') drawAmmonite(ctx, r, { age: time });
      else drawNautilusBody(ctx, r, { age: time, natural: true });
    } else if (form === 'urchin') {
      if (key === 'puffer') {
        drawPufferBody(ctx, r * 0.95, { age: time });
      } else {
        ctx.strokeStyle = '#3a2b46';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i += 1) {
          const a = (i / 12) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
          ctx.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3);
          ctx.stroke();
        }
        fillCircle(ctx, 0, 0, r * 0.95, '#7a5b96');
      }
    } else {
      fillCircle(ctx, 0, 0, r, '#63e6ff');
    }
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.5, 0, TAU);
    ctx.strokeStyle = 'rgba(207, 239, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  renderTab(ctx, index) {
    const form = RUSH_FORMS[index];
    const b = this.tabRect(index);
    const active = index === this.tabIndex;
    if (active) fillRoundRect(ctx, b.x, b.y, b.w, b.h, 9, 'rgba(255, 209, 102, 0.16)');
    drawText(ctx, form.label, b.x + 12, b.y + b.h / 2 + 4, {
      size: 14,
      color: active ? COLORS.accent : COLORS.text,
      align: 'left',
      alpha: active ? 1 : 0.78,
    });
  }

  renderFishCard(ctx, index) {
    const skin = this.ladder[index];
    const b = this.cardRect(index);
    const active = index === this.skinIndex;
    const isOwned = this.owned(skin.key);
    const isEquipped = this.equippedFor('fish', skin.key);
    fillRoundRect(ctx, b.x, b.y, b.w, b.h, 14, active ? 'rgba(18, 60, 82, 0.96)' : 'rgba(10, 34, 50, 0.9)');
    strokeRoundRect(ctx, b.x, b.y, b.w, b.h, 14, active ? COLORS.accent : 'rgba(207, 239, 255, 0.22)', active ? 3 : 1.5);
    this.renderSwatch(ctx, skin, b.x + 16, b.y + 14, 48, 36, active);
    drawText(ctx, skin.label, b.x + 76, b.y + 26, {
      size: skin.label.length > 10 ? 12 : 14,
      color: active ? COLORS.accent : COLORS.text,
      align: 'left',
    });
    let statusText = `REACH ${skin.rushAt}M`;
    let statusColor = COLORS.textDim;
    if (isEquipped) {
      statusText = 'EQUIPPED';
      statusColor = COLORS.accent;
    } else if (isOwned) {
      statusText = 'ENTER TO WEAR';
      statusColor = '#8fd0ef';
    } else if (this.state.best >= skin.rushAt) {
      statusText = 'UNLOCKED';
      statusColor = COLORS.accent;
    }
    drawText(ctx, statusText, b.x + 16, b.y + 70, { size: 11, color: statusColor, align: 'left' });
    const barW = CARD_W - 32;
    const frac = clamp(this.state.best / skin.rushAt, 0, 1);
    fillRoundRect(ctx, b.x + 16, b.y + CARD_H - 22, barW, 8, 4, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, b.x + 16, b.y + CARD_H - 22, barW * frac, 8, 4, isOwned ? COLORS.accent : '#8fd0ef');
    if (isEquipped) {
      ctx.fillStyle = COLORS.accent;
      ctx.beginPath();
      ctx.arc(b.x + CARD_W - 16, b.y + 16, 8, 0, TAU);
      ctx.fill();
    }
  }

  renderFormCard(ctx, form, skin, index) {
    const b = this.cardRect(index);
    const active = index === this.skinIndex;
    const isEquipped = this.equippedFor(form, skin.key);
    fillRoundRect(ctx, b.x, b.y, b.w, b.h, 14, active ? 'rgba(18, 60, 82, 0.96)' : 'rgba(10, 34, 50, 0.9)');
    strokeRoundRect(ctx, b.x, b.y, b.w, b.h, 14, active ? COLORS.accent : 'rgba(207, 239, 255, 0.22)', active ? 3 : 1.5);
    this.drawFormPreview(ctx, form, skin.key, b.x + b.w / 2, b.y + 46, 76, this.time);
    drawText(ctx, skin.label, b.x + b.w / 2, b.y + 92, {
      size: skin.label.length > 12 ? 11 : 13,
      color: active ? COLORS.accent : COLORS.text,
    });
    drawText(ctx, isEquipped ? 'EQUIPPED' : 'ENTER TO WEAR', b.x + b.w / 2, b.y + CARD_H - 12, {
      size: 11,
      color: isEquipped ? COLORS.accent : '#8fd0ef',
      alpha: isEquipped ? 1 : 0.85,
    });
    if (isEquipped) {
      ctx.fillStyle = COLORS.accent;
      ctx.beginPath();
      ctx.arc(b.x + CARD_W - 16, b.y + 16, 8, 0, TAU);
      ctx.fill();
    }
  }

  render(ctx) {
    drawWater(ctx, W, H, this.time, WATER_PALETTE);
    drawText(ctx, 'REEF RUSH SHOP', W / 2, 46, {
      size: 30,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 20,
    });
    drawText(ctx, `SKINS FOR EVERY REEF RUSH FORM \u00B7 RUSH COLORS NEED BEST \u00B7 BEST ${this.state.best}M`, W / 2, 76, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.88,
    });

    fillRoundRect(ctx, TAB_X, TAB_Y, TAB_W, TAB_H, 16, 'rgba(10, 39, 64, 0.82)');
    strokeRoundRect(ctx, TAB_X, TAB_Y, TAB_W, TAB_H, 16, 'rgba(207, 239, 255, 0.22)', 2);
    for (let i = 0; i < RUSH_FORMS.length; i += 1) this.renderTab(ctx, i);

    const form = this.currentForm().key;
    const skins = this.currentSkins();
    for (let i = 0; i < skins.length; i += 1) {
      if (form === 'fish') this.renderFishCard(ctx, i);
      else this.renderFormCard(ctx, form, skins[i], i);
    }

    if (form === 'fish') {
      const nextLocked = this.ladder.find((skin) => !this.owned(skin.key));
      if (nextLocked) {
        drawText(ctx, `NEXT COLOR AT ${nextLocked.rushAt}M \u2014 ${Math.max(0, nextLocked.rushAt - this.state.best)}M TO GO`, W / 2, H - 74, {
          size: 13,
          color: COLORS.accent,
          alpha: 0.9,
        });
      }
    }

    drawText(ctx, 'UP / DOWN \u2014 FORM      LEFT / RIGHT \u2014 SKIN      ENTER / CLICK \u2014 WEAR      ESC \u2014 BACK', W / 2, H - 18, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.75,
    });
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, W / 2, H - 46, {
        size: 13,
        color: COLORS.bubble,
        alpha: Math.min(1, this.statusTimer),
      });
    }
  }
}
