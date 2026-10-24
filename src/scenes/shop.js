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
import { drawSkinAura, eelAuraEnabled, setActiveSkin, setEelAura, setSkinClock, skinCatalog } from '../engine/skin.js';
import {
  accessoryByKey,
  accessorySlotCatalog,
  setActiveBodyAccessory,
  setActiveHeadAccessory,
} from '../engine/accessory.js';
import { drawTrail, setActiveTrail, trailByKey, trailCatalog } from '../engine/trail.js';
import {
  companionByKey,
  companionCatalog,
  drawCompanion,
  setActiveCompanion,
} from '../engine/companion.js';
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

const SLOTS = {
  head: {
    field: 'head',
    index: 'headIndex',
    list: 'accessories',
    catalog: () => accessorySlotCatalog('head'),
    title: 'HEAD',
    noun: 'HEAD ITEM',
  },
  body: {
    field: 'back',
    index: 'backIndex',
    list: 'accessories',
    catalog: () => accessorySlotCatalog('body'),
    title: 'BODY',
    noun: 'BODY ITEM',
  },
  trail: {
    field: 'trail',
    index: 'trailIndex',
    list: 'trails',
    catalog: trailCatalog,
    title: 'TRAIL',
    noun: 'TRAIL',
  },
  companion: {
    field: 'companion',
    index: 'companionIndex',
    list: 'companions',
    catalog: companionCatalog,
    title: 'COMPANION',
    noun: 'COMPANION',
  },
};

export class ShopScene extends Scene {
  enter() {
    this.time = 0;
    this.coins = loadJSON(COINS_KEY, COINS.starting);
    const raw = loadJSON(SHOP_KEY, {});
    const legacy = accessoryByKey(raw.accessory ?? 'none');
    const head = raw.head ?? (legacy.slot === 'head' ? legacy.key : 'none');
    const back = raw.back ?? (legacy.slot === 'body' ? legacy.key : 'none');
    this.shop = {
      owned: ['natural'],
      skin: 'natural',
      passes: [],
      accessories: ['none'],
      trails: ['none'],
      companions: ['none'],
      ...raw,
      head,
      back,
      trail: raw.trail ?? 'none',
      companion: raw.companion ?? 'none',
    };
    delete this.shop.accessory;
    setEelAura(this.shop.passes.includes('playpass5'));
    this.auraUpgrade = eelAuraEnabled();
    this.skinIndex = this.indexFor(skinCatalog, this.shop.skin);
    this.passIndex = 0;
    this.headIndex = this.indexFor(SLOTS.head.catalog, this.shop.head);
    this.backIndex = this.indexFor(SLOTS.body.catalog, this.shop.back);
    this.trailIndex = this.indexFor(trailCatalog, this.shop.trail);
    this.companionIndex = this.indexFor(companionCatalog, this.shop.companion);
    this.creatureIndex = 0;
    this.previewCreatures = CREATURES.map((entry) => ({ ...entry, entity: entry.create() }));
    this.status = null;
    this.statusTimer = 0;
    this.menu = new SelectList(
      [
        { label: 'COLOR', action: 'skin' },
        { label: 'CREATURE', action: 'creature' },
        { label: 'HEAD', action: 'head' },
        { label: 'BODY', action: 'body' },
        { label: 'TRAIL', action: 'trail' },
        { label: 'COMPANION', action: 'companion' },
        { label: 'PLAYPASS', action: 'pass' },
        { label: 'BACK', action: 'back' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 40,
        fontSize: 20,
        width: 520,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.choose(item),
      },
    );
    this.menu.reset();
  }

  indexFor(catalog, key) {
    return Math.max(0, catalog().findIndex((entry) => entry.key === key));
  }

  get skin() {
    return skinCatalog()[this.skinIndex];
  }

  get creature() {
    return this.previewCreatures[this.creatureIndex];
  }

  get head() {
    return SLOTS.head.catalog()[this.headIndex];
  }

  get back() {
    return SLOTS.body.catalog()[this.backIndex];
  }

  get trail() {
    return trailCatalog()[this.trailIndex];
  }

  get companion() {
    return companionCatalog()[this.companionIndex];
  }

  get pass() {
    return PASSES[this.passIndex];
  }

  option(kind) {
    if (kind === 'head') return this.head;
    if (kind === 'body') return this.back;
    if (kind === 'trail') return this.trail;
    return this.companion;
  }

  ownsPass(key) {
    return (
      this.shop.passes.includes(key) ||
      (key === 'playpass1' && this.shop.passes.includes('competitions'))
    );
  }

  passGranted(field) {
    const granted = [];
    for (const pass of PASSES) {
      if (this.ownsPass(pass.key)) granted.push(...(pass[field] ?? []));
    }
    return granted;
  }

  grantingPass(field, key) {
    return PASSES.find((pass) => (pass[field] ?? []).includes(key)) ?? null;
  }

  ownsAccessory(key) {
    return this.shop.accessories.includes(key) || this.passGranted('accessories').includes(key);
  }

  ownsOption(kind, key) {
    const option = SLOTS[kind];
    if (kind === 'head' || kind === 'body') return this.ownsAccessory(key);
    return this.shop[option.list].includes(key) || this.passGranted(option.list).includes(key);
  }

  ownsTrail(key) {
    return this.ownsOption('trail', key);
  }

  ownsCompanion(key) {
    return this.ownsOption('companion', key);
  }

  owns(key) {
    return this.shop.owned.includes(key) || this.passGranted('skins').includes(key);
  }

  ownedPassLabels() {
    return PASSES.filter((pass) => this.ownsPass(pass.key))
      .map((pass) => pass.label.replace('PLAYPASS ', ''))
      .join(', ');
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

  cyclePass(step) {
    const count = PASSES.length;
    this.passIndex = (this.passIndex + step + count) % count;
    this.game.audio.tone({ freq: 480 + this.passIndex * 60, duration: 0.05, volume: 0.08 });
  }

  cycleOption(kind, step) {
    const option = SLOTS[kind];
    const catalog = option.catalog();
    this[option.index] = (this[option.index] + step + catalog.length) % catalog.length;
    this.game.audio.tone({ freq: 560 + this[option.index] * 30, duration: 0.05, volume: 0.08 });
  }

  applyEquipped() {
    setActiveHeadAccessory(accessoryByKey(this.shop.head));
    setActiveBodyAccessory(accessoryByKey(this.shop.back));
    setActiveTrail(trailByKey(this.shop.trail));
    setActiveCompanion(companionByKey(this.shop.companion));
  }

  buyOrEquipOption(kind) {
    const option = SLOTS[kind];
    const item = this.option(kind);
    const owns = this.ownsOption(kind, item.key);
    if (item.passOnly && !owns) {
      const pass = this.grantingPass(option.list, item.key);
      this.setStatus(`INCLUDED WITH ${pass ? pass.label : 'A PLAYPASS'} — BUY THE PASS`);
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.22 });
      return;
    }
    if (owns) {
      if (this.shop[option.field] === item.key) {
        this.setStatus(item.key === 'none' ? `${option.noun} ALREADY OFF` : 'ALREADY WORN');
        return;
      }
      this.shop[option.field] = item.key;
      this.save();
      this.setStatus(item.key === 'none' ? `${option.noun} REMOVED` : `${option.noun} WORN`);
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      return;
    }
    if (this.coins < item.cost) {
      this.setStatus('NOT ENOUGH SEA COINS');
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.22 });
      return;
    }
    this.coins -= item.cost;
    if (!this.shop[option.list].includes(item.key)) this.shop[option.list].push(item.key);
    this.shop[option.field] = item.key;
    this.save();
    this.setStatus(`${option.noun} UNLOCKED AND WORN`);
    this.game.audio.tone({ freq: 520, endFreq: 880, type: 'triangle', duration: 0.14, volume: 0.22 });
    this.game.audio.tone({ freq: 880, endFreq: 1320, type: 'triangle', duration: 0.2, volume: 0.18, delay: 0.12 });
  }

  buyOrEquipSkin() {
    const skin = this.skin;
    if (skin.passOnly && !this.owns(skin.key)) {
      const pass = this.grantingPass('skins', skin.key);
      this.setStatus(`INCLUDED WITH ${pass ? pass.label : 'A PLAYPASS'} — BUY THE PASS`);
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.22 });
      return;
    }
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
    const pass = this.pass;
    const unlocks = {
      playpass1: 'MINIGAMES UNLOCKED',
      playpass2: 'COSMETICS UNLOCKED',
      playpass3: 'PETS TANK UNLOCKED',
      playpass4: 'ENDLESS DIVE UNLOCKED',
      playpass5: 'PLUSHIE PACK UNLOCKED',
      playpass6: 'PET PLAY UNLOCKED',
      playpass7: 'TRAILS UNLOCKED',
      playpass8: 'COMPANIONS UNLOCKED',
      playpass9: 'AQUARIUM BUILDER UNLOCKED',
    };
    if (this.ownsPass(pass.key)) {
      this.setStatus(`${pass.label} OWNED — ${pass.grants}`);
      return;
    }
    if (this.coins < pass.cost) {
      this.setStatus('NOT ENOUGH SEA COINS');
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.22 });
      return;
    }
    this.coins -= pass.cost;
    this.shop.passes.push(pass.key);
    setEelAura(this.shop.passes.includes('playpass5'));
    this.auraUpgrade = eelAuraEnabled();
    this.save();
    this.setStatus(`${pass.label} BOUGHT — ${unlocks[pass.key] ?? 'UNLOCKED'}`);
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
    if (SLOTS[item.action]) {
      this.buyOrEquipOption(item.action);
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
    if (selected && SLOTS[selected.action]) {
      if (input.wasPressed('left')) this.cycleOption(selected.action, -1);
      if (input.wasPressed('right')) this.cycleOption(selected.action, 1);
    }
    if (selected && selected.action === 'skin') {
      if (input.wasPressed('left')) this.cycle(-1);
      if (input.wasPressed('right')) this.cycle(1);
    }
    if (selected && selected.action === 'creature') {
      if (input.wasPressed('left')) this.cycleCreature(-1);
      if (input.wasPressed('right')) this.cycleCreature(1);
    }
    if (selected && selected.action === 'pass') {
      if (input.wasPressed('left')) this.cyclePass(-1);
      if (input.wasPressed('right')) this.cyclePass(1);
    }
    this.menu.update(dt, input);
  }

  skinStatus(skin) {
    const pass = this.grantingPass('skins', skin.key);
    if (this.shop.skin === skin.key) return 'EQUIPPED';
    if (this.owns(skin.key)) {
      return pass ? `INCLUDED WITH ${pass.label} — ENTER TO EQUIP` : 'OWNED — ENTER TO EQUIP';
    }
    if (skin.passOnly) return `${pass ? pass.label : 'PLAYPASS'} EXCLUSIVE`;
    return `${skin.cost} SEA COINS — ENTER TO BUY`;
  }

  optionStatus(kind, item) {
    const option = SLOTS[kind];
    const pass = this.grantingPass(option.list, item.key);
    if (this.shop[option.field] === item.key) {
      return item.key === 'none' ? `NO ${option.noun} WORN` : 'WORN';
    }
    if (this.ownsOption(kind, item.key)) {
      return pass ? `INCLUDED WITH ${pass.label} — ENTER TO WEAR` : 'OWNED — ENTER TO WEAR';
    }
    if (item.passOnly) return `${pass ? pass.label : 'PLAYPASS'} EXCLUSIVE`;
    return `${item.cost} SEA COINS — ENTER TO BUY`;
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
    this.menu.render(ctx, 420, 306);
    this.renderRowValues(ctx);

    const selected = this.menu.selected;
    if (selected && selected.action === 'pass') {
      this.renderPassStatus(ctx);
    } else if (selected && SLOTS[selected.action]) {
      this.renderOptionStatus(ctx, selected.action);
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
    const top = 306 - ((rows - 1) * this.menu.spacing) / 2;
    const bonus = this.payoutBonus(this.skin);
    const pass = this.pass;
    const values = [
      bonus > 0 ? `${this.skin.label} +${bonus}%` : this.skin.label,
      this.creature.label,
      `HEAD: ${accessoryByKey(this.shop.head).label}`,
      `BODY: ${accessoryByKey(this.shop.back).label}`,
      `TRAIL: ${trailByKey(this.shop.trail).label}`,
      `COMPANION: ${companionByKey(this.shop.companion).label}`,
      this.ownsPass(pass.key) ? `${pass.label} — OWNED` : `${pass.label} — ${pass.cost}`,
    ];
    values.forEach((value, index) => {
      drawText(ctx, value, 620, top + this.menu.spacing * index, {
        size: 12,
        color: COLORS.textDim,
        align: 'left',
      });
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
    this.applyEquipped();
    this.creature.entity.render(ctx);
    drawSkinAura(ctx, this.creature.entity);
    drawTrail(ctx, this.creature.entity);
    drawCompanion(ctx, this.creature.entity);
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
    drawText(
      ctx,
      `HEAD ${accessoryByKey(this.shop.head).label} — BODY ${accessoryByKey(this.shop.back).label}`,
      790,
      408,
      {
        size: 11,
        color: this.shop.head === 'none' && this.shop.back === 'none' ? COLORS.textDim : COLORS.foam,
        alpha: 0.85,
      },
    );
    const ownedLabels = this.ownedPassLabels();
    drawText(
      ctx,
      ownedLabels ? `PLAYPASSES: ${ownedLabels}` : 'PLAYPASSES: NONE',
      790,
      428,
      {
        size: 12,
        color: ownedLabels ? COLORS.foam : COLORS.textDim,
        alpha: 0.8,
      },
    );
  }

  renderOptionStatus(ctx, kind) {
    const option = SLOTS[kind];
    const item = this.option(kind);
    fillRoundRect(ctx, 660, 180, 260, 280, 20, 'rgba(10, 39, 64, 0.85)');
    strokeRoundRect(ctx, 660, 180, 260, 280, 20, 'rgba(207, 239, 255, 0.3)', 2);
    drawText(ctx, option.title, 790, 208, {
      size: 19,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 12,
    });
    drawText(ctx, item.label, 790, 232, {
      size: 13,
      color: COLORS.accent,
      alpha: 0.9,
    });
    setActiveSkin(this.skin);
    setSkinClock(this.time);
    this.applyEquipped();
    if (kind === 'head') setActiveHeadAccessory(item);
    else if (kind === 'body') setActiveBodyAccessory(item);
    else if (kind === 'trail') setActiveTrail(item);
    else setActiveCompanion(item);
    this.creature.entity.render(ctx);
    drawSkinAura(ctx, this.creature.entity);
    drawTrail(ctx, this.creature.entity);
    drawCompanion(ctx, this.creature.entity);
    drawText(
      ctx,
      item.key === 'none' ? 'TAKE IT OFF AND SWIM CLEAN' : 'DRESS UP YOUR DIVE',
      790,
      372,
      {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.85,
      },
    );
    drawText(ctx, this.optionStatus(kind, item), 790, 396, {
      size: 12,
      color: this.ownsOption(kind, item.key) ? COLORS.foam : COLORS.accent,
      alpha: 0.9,
    });
    drawText(
      ctx,
      item.key === 'none'
        ? 'ENTER — TAKE OFF'
        : this.ownsOption(kind, item.key)
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
    const pass = this.pass;
    const owned = this.ownsPass(pass.key);
    drawText(ctx, 'PLAYPASS', 790, 210, {
      size: 20,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 12,
    });
    drawText(ctx, pass.label, 790, 248, {
      size: 16,
      color: COLORS.accent,
    });
    drawText(ctx, owned ? 'OWNED' : `${pass.cost} SEA COINS`, 790, 286, {
      size: 14,
      color: owned ? COLORS.foam : COLORS.text,
      alpha: 0.9,
    });
    drawText(ctx, pass.grants, 790, 330, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.9,
    });
    drawText(ctx, 'LEFT/RIGHT — BROWSE THE PASSES', 790, 366, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.75,
    });
    drawText(ctx, owned ? 'PRESS ENTER FOR INFO' : 'ENTER — BUY', 790, 414, {
      size: 12,
      color: COLORS.accent,
      alpha: 0.8,
    });
  }
}
