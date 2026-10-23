import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { Shark } from '../entities/shark.js';
import { Stingray } from '../entities/stingray.js';
import { Squid } from '../entities/squid.js';
import { ArcticShrimp } from '../entities/arcticshrimp.js';
import { KelpCrab } from '../entities/kelpcrab.js';
import { MoonJelly } from '../entities/moonjelly.js';
import { Nautilus } from '../entities/nautilus.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { drawSkinAura, setActiveSkin, setSkinClock, skinCatalog } from '../engine/skin.js';
import { accessoryByKey, accessoryCatalog, setActiveAccessory } from '../engine/accessory.js';
import {
  COINS,
  COINS_KEY,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  PASSES,
  SHOP_KEY,
  WATER_PALETTE,
} from '../config.js';

const IDLE_INPUT = { isDown: () => false, pointer: { down: false, dragX: 0, dragY: 0 } };

const CREATURES = [
  { key: 'shark', label: 'SHARK', create: () => new Shark(790, 300) },
  { key: 'stingray', label: 'STINGRAY', create: () => new Stingray(790, 300) },
  { key: 'squid', label: 'SQUID', create: () => new Squid(790, 300) },
  { key: 'arcticshrimp', label: 'ARCTIC SHRIMP', create: () => new ArcticShrimp(790, 300) },
  { key: 'kelpcrab', label: 'KELP CRAB', create: () => new KelpCrab(790, 300) },
  { key: 'jellyfish', label: 'JELLYFISH', create: () => new MoonJelly(790, 300) },
  { key: 'nautilus', label: 'NAUTILUS', create: () => new Nautilus(790, 300) },
];

export class ShopScene extends Scene {
  enter() {
    this.time = 0;
    this.coins = loadJSON(COINS_KEY, COINS.starting);
    this.shop = {
      owned: ['natural'],
      skin: 'natural',
      passes: [],
      accessories: ['none'],
      accessory: 'none',
      ...loadJSON(SHOP_KEY, {}),
    };
    this.skinIndex = Math.max(
      0,
      skinCatalog().findIndex((skin) => skin.key === this.shop.skin),
    );
    this.accessoryIndex = Math.max(
      0,
      accessoryCatalog().findIndex((entry) => entry.key === this.shop.accessory),
    );
    this.creatureIndex = 0;
    this.previewCreatures = CREATURES.map((entry) => ({ ...entry, entity: entry.create() }));
    this.status = null;
    this.statusTimer = 0;
    this.menu = new SelectList(
      [
        { label: 'COLOR', action: 'skin' },
        { label: 'CREATURE', action: 'creature' },
        { label: 'ACCESSORY', action: 'accessory' },
        { label: 'PLAYPASS', action: 'pass' },
        { label: 'BACK', action: 'back' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 48,
        width: 520,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.choose(item),
      },
    );
    this.menu.reset();
  }

  get skin() {
    return skinCatalog()[this.skinIndex];
  }

  get creature() {
    return this.previewCreatures[this.creatureIndex];
  }

  get accessory() {
    return accessoryCatalog()[this.accessoryIndex];
  }

  ownsAccessory(key) {
    return this.shop.accessories.includes(key);
  }

  owns(key) {
    return this.shop.owned.includes(key);
  }

  passOwned() {
    return this.shop.passes.includes(PASSES[0].key);
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2.4;
  }

  save() {
    saveJSON(SHOP_KEY, this.shop);
    saveJSON(COINS_KEY, this.coins);
  }

  cycle(step) {
    const count = skinCatalog().length;
    this.skinIndex = (this.skinIndex + step + count) % count;
    this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 });
  }

  cycleCreature(step) {
    const count = this.previewCreatures.length;
    this.creatureIndex = (this.creatureIndex + step + count) % count;
    this.game.audio.tone({ freq: 520 + this.creatureIndex * 40, duration: 0.05, volume: 0.08 });
  }

  cycleAccessory(step) {
    const count = accessoryCatalog().length;
    this.accessoryIndex = (this.accessoryIndex + step + count) % count;
    this.game.audio.tone({ freq: 560 + this.accessoryIndex * 30, duration: 0.05, volume: 0.08 });
  }

  buyOrEquipAccessory() {
    const accessory = this.accessory;
    if (this.ownsAccessory(accessory.key)) {
      if (this.shop.accessory === accessory.key) {
        this.setStatus('ALREADY WORN');
        return;
      }
      this.shop.accessory = accessory.key;
      this.save();
      this.setStatus(accessory.key === 'none' ? 'ACCESSORIES REMOVED' : 'ACCESSORY WORN');
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      return;
    }
    if (this.coins < accessory.cost) {
      this.setStatus('NOT ENOUGH SEA COINS');
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.22 });
      return;
    }
    this.coins -= accessory.cost;
    this.shop.accessories.push(accessory.key);
    this.shop.accessory = accessory.key;
    this.save();
    this.setStatus('ACCESSORY UNLOCKED AND WORN');
    this.game.audio.tone({ freq: 520, endFreq: 880, type: 'triangle', duration: 0.14, volume: 0.22 });
    this.game.audio.tone({ freq: 880, endFreq: 1320, type: 'triangle', duration: 0.2, volume: 0.18, delay: 0.12 });
  }

  buyOrEquipSkin() {
    const skin = this.skin;
    if (this.owns(skin.key)) {
      if (this.shop.skin === skin.key) {
        this.setStatus('ALREADY EQUIPPED');
        return;
      }
      this.shop.skin = skin.key;
      this.save();
      this.setStatus('COLOR EQUIPPED');
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      return;
    }
    if (this.coins < skin.cost) {
      this.setStatus('NOT ENOUGH SEA COINS');
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.22 });
      return;
    }
    this.coins -= skin.cost;
    this.shop.owned.push(skin.key);
    this.shop.skin = skin.key;
    this.save();
    this.setStatus('COLOR UNLOCKED AND EQUIPPED');
    this.game.audio.tone({ freq: 520, endFreq: 880, type: 'triangle', duration: 0.14, volume: 0.22 });
    this.game.audio.tone({ freq: 880, endFreq: 1320, type: 'triangle', duration: 0.2, volume: 0.18, delay: 0.12 });
  }

  buyPass() {
    const pass = PASSES[0];
    if (this.passOwned()) {
      this.setStatus('PLAYPASS OWNED — MINIGAMES ON THE MENU');
      return;
    }
    if (this.coins < pass.cost) {
      this.setStatus('NOT ENOUGH SEA COINS');
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.22 });
      return;
    }
    this.coins -= pass.cost;
    this.shop.passes.push(pass.key);
    this.save();
    this.setStatus('PLAYPASS BOUGHT — MINIGAMES UNLOCKED');
    this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.18, volume: 0.22 });
    this.game.audio.tone({ freq: 659, type: 'triangle', duration: 0.18, volume: 0.22, delay: 0.12 });
    this.game.audio.tone({ freq: 784, type: 'triangle', duration: 0.24, volume: 0.22, delay: 0.24 });
  }

  choose(item) {
    if (item.action === 'back') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('menu');
      return;
    }
    if (item.action === 'skin') {
      this.buyOrEquipSkin();
      return;
    }
    if (item.action === 'creature') {
      this.setStatus('LEFT/RIGHT — BROWSE CREATURES');
      return;
    }
    if (item.action === 'accessory') {
      this.buyOrEquipAccessory();
      return;
    }
    if (item.action === 'pass') this.buyPass();
  }

  update(dt) {
    this.time += dt;
    this.creature.entity.update(dt, IDLE_INPUT, null);
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('menu');
      return;
    }
    const selected = this.menu.selected;
    if (selected && selected.action === 'skin') {
      if (input.wasPressed('left')) this.cycle(-1);
      if (input.wasPressed('right')) this.cycle(1);
    }
    if (selected && selected.action === 'creature') {
      if (input.wasPressed('left')) this.cycleCreature(-1);
      if (input.wasPressed('right')) this.cycleCreature(1);
    }
    if (selected && selected.action === 'accessory') {
      if (input.wasPressed('left')) this.cycleAccessory(-1);
      if (input.wasPressed('right')) this.cycleAccessory(1);
    }
    this.menu.update(dt, input);
  }

  skinStatus(skin) {
    if (this.shop.skin === skin.key) return 'EQUIPPED';
    if (this.owns(skin.key)) return 'OWNED — ENTER TO EQUIP';
    return `${skin.cost} SEA COINS — ENTER TO BUY`;
  }

  payoutBonus(skin) {
    return skin.cost ? Math.round((skin.cost / COINS.skinBonusScale) * 100) : 0;
  }

  payoutLabel(skin) {
    const bonus = this.payoutBonus(skin);
    return bonus > 0 ? `DIVE PAYOUT +${bonus}%` : 'STANDARD DIVE PAYOUT';
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'SHOP', 420, 84, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    drawText(ctx, `SEA COINS ${this.coins}`, 420, 126, {
      size: 18,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 12,
    });
    drawText(
      ctx,
      'EARN SEA COINS BY COMPLETING DIVES — HARDER DIFFICULTY PAYS MORE',
      480,
      156,
      {
        size: 12,
        color: COLORS.foam,
        alpha: 0.75,
      },
    );
    this.menu.render(ctx, 420, LOGICAL_HEIGHT * 0.56);
    this.renderRowValues(ctx);

    const selected = this.menu.selected;
    if (selected && selected.action === 'pass') {
      this.renderPassStatus(ctx);
    } else if (selected && selected.action === 'accessory') {
      this.renderAccessoryStatus(ctx);
    } else {
      this.renderSkinPanel(ctx);
    }

    if (this.status && this.statusTimer > 0) {
      drawText(ctx, this.status, 480, LOGICAL_HEIGHT - 64, {
        size: 14,
        color: COLORS.accent,
        alpha: Math.min(1, this.statusTimer),
      });
    }
    drawText(
      ctx,
      'LEFT/RIGHT — BROWSE      ENTER — BUY / EQUIP / SELECT      ESC — BACK',
      480,
      LOGICAL_HEIGHT - 26,
      {
        size: 12,
        color: COLORS.textDim,
      },
    );
  }

  renderRowValues(ctx) {
    const rows = this.menu.items.length;
    const top = LOGICAL_HEIGHT * 0.56 - ((rows - 1) * this.menu.spacing) / 2;
    const bonus = this.payoutBonus(this.skin);
    drawText(ctx, bonus > 0 ? `${this.skin.label} +${bonus}%` : this.skin.label, 620, top, {
      size: 14,
      color: COLORS.textDim,
      align: 'left',
    });    drawText(ctx, this.creature.label, 620, top + this.menu.spacing, {
      size: 14,
      color: COLORS.textDim,
      align: 'left',
    });
    const worn = accessoryByKey(this.shop.accessory);
    drawText(ctx, worn.key === 'none' ? 'NONE' : worn.label, 620, top + this.menu.spacing * 2, {
      size: 14,
      color: COLORS.textDim,
      align: 'left',
    });
    const pass = PASSES[0];
    drawText(ctx, this.passOwned() ? 'OWNED' : `${pass.cost} COINS`, 620, top + this.menu.spacing * 3, {
      size: 14,
      color: this.passOwned() ? COLORS.foam : COLORS.textDim,
      align: 'left',
    });
  }

  renderSkinPanel(ctx) {
    fillRoundRect(ctx, 660, 180, 260, 280, 20, 'rgba(10, 39, 64, 0.85)');
    strokeRoundRect(ctx, 660, 180, 260, 280, 20, 'rgba(207, 239, 255, 0.3)', 2);
    const skin = this.skin;
    drawText(ctx, this.creature.label, 790, 208, {
      size: 19,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 12,
    });
    drawText(ctx, skin.label, 790, 234, {
      size: 13,
      color: COLORS.accent,
      alpha: 0.9,
    });
    setActiveSkin(skin);
    setSkinClock(this.time);
    setActiveAccessory(accessoryByKey(this.shop.accessory));
    this.creature.entity.render(ctx);
    drawSkinAura(ctx, this.creature.entity);
    drawText(ctx, this.payoutLabel(skin), 790, 366, {
      size: 12,
      color: this.payoutBonus(skin) > 0 ? COLORS.accent : COLORS.textDim,
      alpha: 0.9,
    });
    const owned = this.owns(skin.key);
    drawText(ctx, this.skinStatus(skin), 790, 388, {
      size: 12,
      color: owned ? COLORS.foam : COLORS.accent,
      alpha: 0.9,
    });
    const worn = accessoryByKey(this.shop.accessory);
    drawText(ctx, `WORN: ${worn.label}`, 790, 408, {
      size: 12,
      color: worn.key === 'none' ? COLORS.textDim : COLORS.foam,
      alpha: 0.85,
    });
    const pass = PASSES[0];
    drawText(
      ctx,
      this.passOwned() ? 'PLAYPASS: OWNED' : `PLAYPASS: ${pass.cost} SEA COINS`,
      790,
      428,
      {
        size: 12,
        color: this.passOwned() ? COLORS.foam : COLORS.textDim,
        alpha: 0.8,
      },
    );
  }

  accessoryStatus(accessory) {
    if (this.shop.accessory === accessory.key) {
      return accessory.key === 'none' ? 'NO ACCESSORY WORN' : 'WORN';
    }
    if (this.ownsAccessory(accessory.key)) return 'OWNED — ENTER TO WEAR';
    return `${accessory.cost} SEA COINS — ENTER TO BUY`;
  }

  renderAccessoryStatus(ctx) {
    fillRoundRect(ctx, 660, 180, 260, 280, 20, 'rgba(10, 39, 64, 0.85)');
    strokeRoundRect(ctx, 660, 180, 260, 280, 20, 'rgba(207, 239, 255, 0.3)', 2);
    const accessory = this.accessory;
    drawText(ctx, 'ACCESSORY', 790, 208, {
      size: 19,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 12,
    });
    drawText(ctx, accessory.label, 790, 232, {
      size: 13,
      color: COLORS.accent,
      alpha: 0.9,
    });
    setActiveSkin(this.skin);
    setSkinClock(this.time);
    setActiveAccessory(accessory);
    this.creature.entity.render(ctx);
    drawSkinAura(ctx, this.creature.entity);
    drawText(
      ctx,
      accessory.cost > 0 ? 'CHEAP TRINKET — DRESS UP YOUR DIVE' : 'TAKE THE TRINKET OFF',
      790,
      372,
      {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.85,
      },
    );
    drawText(ctx, this.accessoryStatus(accessory), 790, 396, {
      size: 12,
      color: this.ownsAccessory(accessory.key) ? COLORS.foam : COLORS.accent,
      alpha: 0.9,
    });
    drawText(
      ctx,
      accessory.key === 'none'
        ? 'ENTER — TAKE OFF'
        : this.ownsAccessory(accessory.key)
          ? 'ENTER — WEAR'
          : 'ENTER — BUY',
      790,
      424,
      {
        size: 12,
        color: COLORS.accent,
        alpha: 0.8,
      },
    );
  }

  renderPassStatus(ctx) {
    fillRoundRect(ctx, 660, 180, 260, 280, 20, 'rgba(10, 39, 64, 0.85)');
    strokeRoundRect(ctx, 660, 180, 260, 280, 20, 'rgba(207, 239, 255, 0.3)', 2);
    const pass = PASSES[0];
    drawText(ctx, 'PLAYPASS', 790, 212, {
      size: 20,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 12,
    });
    drawText(ctx, pass.label, 790, 252, {
      size: 16,
      color: COLORS.accent,
    });
    drawText(ctx, this.passOwned() ? 'OWNED' : `${pass.cost} SEA COINS`, 790, 300, {
      size: 14,
      color: this.passOwned() ? COLORS.foam : COLORS.text,
      alpha: 0.9,
    });
    drawText(ctx, 'ADDS MINIGAMES TO THE MENU', 790, 346, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.85,
    });
    drawText(ctx, 'LOCAL 2P COMPETITIONS', 790, 368, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.85,
    });
    drawText(ctx, this.passOwned() ? 'PRESS ENTER FOR INFO' : 'ENTER — BUY', 790, 414, {
      size: 12,
      color: COLORS.accent,
      alpha: 0.8,
    });
  }
}
