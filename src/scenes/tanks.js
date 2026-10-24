import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText } from '../engine/render.js';
import { loadJSON } from '../engine/storage.js';
import { COLORS, SETTINGS_KEY, SHOP_KEY, WATER_PALETTE, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const TANK_OPTIONS = [
  { label: 'REEF TANK', params: {} },
  { label: 'STINGRAY TANK', params: { tank: 'stingray' } },
  { label: 'DEEP SEA TANK', params: { tank: 'deepsea' } },
  { label: 'ARCTIC TANK', params: { tank: 'arctic' } },
  { label: 'KELP FOREST TANK', params: { tank: 'kelp' } },
  { label: 'JELLY TANK', params: { tank: 'jelly' } },
  { label: 'NAUTILUS TANK', params: { tank: 'nautilus' } },
  { label: 'FRESHWATER TANK', params: { tank: 'freshwater' } },
  { label: 'EMPTY TANK', params: { empty: true } },
];

export class TankSelectScene extends Scene {
  enter() {
    this.time = 0;
    this.coop = Boolean(loadJSON(SETTINGS_KEY, {}).coopTankSelect);
    this.menu = this.buildMenu();
  }

  tankOptions() {
    const shop = loadJSON(SHOP_KEY, {});
    const options = [...TANK_OPTIONS];
    if (shop.passes?.includes('playpass3')) {
      options.splice(options.length - 1, 0, { label: 'PETS TANK', params: { tank: 'pets' } });
    }
    return options;
  }

  buildMenu() {
    return new SelectList(
      [
        { label: `CO-OP: ${this.coop ? 'ON (2P)' : 'OFF'}`, action: 'coop', highlight: this.coop },
        ...this.tankOptions().map((tank) => ({ label: tank.label, action: 'tank', params: tank.params })),
        { label: 'BACK', action: 'back' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 36,
        fontSize: 20,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.choose(item),
      },
    );
  }

  choose(item) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (item.action === 'coop') {
      this.coop = !this.coop;
      this.menu = this.buildMenu();
      return;
    }
    if (item.action === 'back') {
      this.game.changeScene('menu');
      return;
    }
    this.game.changeScene('play', { ...item.params, coop: this.coop });
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('menu');
      return;
    }
    this.menu.update(dt, input);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'CHOOSE YOUR TANK', LOGICAL_WIDTH / 2, 76, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    this.menu.render(ctx, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.52);
    drawText(ctx, 'ENTER — DIVE      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 26, {
      size: 12,
      color: COLORS.textDim,
    });
  }
}
