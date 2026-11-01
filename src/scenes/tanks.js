import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText } from '../engine/render.js';
import { loadJSON } from '../engine/storage.js';
import { formatRecord } from '../engine/records.js';
import { mutatorByKey } from '../engine/mutators.js';
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
  { label: 'ABYSS TRENCH TANK', params: { scene: 'abyss' } },
  { label: 'REEF SWARM QUEEN', params: { scene: 'reefqueen' } },
  { label: 'RAYCAST TANK', params: { scene: 'raycast' } },
  { label: 'MYSTERIOUSLY QUIET TANK', params: { scene: 'quiet' } },
  { label: 'THE ESCAPE', params: { scene: 'flood' } },
  { label: 'THE WATCHER', params: { scene: 'watcher' } },
  { label: 'THE TRENCH MOUTH', params: { scene: 'mouth' } },
  { label: 'PREHISTORIC TANK', params: { scene: 'prehistoric' } },
  { label: 'PLAYTOY EXPLORATION', params: { scene: 'playtoy' } },
  { label: 'EMPTY TANK', params: { empty: true } },
];

export class TankSelectScene extends Scene {
  enter() {
    this.time = 0;
    const settings = loadJSON(SETTINGS_KEY, {});
    this.coop = Boolean(settings.coopTankSelect);
    this.mutator = mutatorByKey(settings.mutator);
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
        {
          label: `MUTATOR: ${this.mutator.key === 'none' ? 'OFF' : this.mutator.label}`,
          action: 'mutators',
          highlight: this.mutator.key !== 'none',
        },
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
    if (item.action === 'mutators') {
      this.game.changeScene('mutators', { from: 'tanks' });
      return;
    }
    if (item.action === 'back') {
      this.game.changeScene('menu');
      return;
    }
    const mutator = this.mutator.key === 'none' ? undefined : this.mutator.key;
    if (item.params && item.params.scene) {
      this.game.changeScene(item.params.scene, { coop: this.coop, mutator });
      return;
    }
    this.game.changeScene('play', { ...item.params, coop: this.coop, mutator });
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
    this.renderRecords(ctx);
    drawText(ctx, 'ENTER — DIVE      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 26, {
      size: 12,
      color: COLORS.textDim,
    });
  }

  modeForParams(params) {
    if (!params || params.empty) return null;
    if (params.scene) return params.scene;
    return params.tank ?? 'reef';
  }

  renderRecords(ctx) {
    const rows = this.menu.items.length;
    const top = LOGICAL_HEIGHT * 0.52 - ((rows - 1) * this.menu.spacing) / 2;
    this.menu.items.forEach((item, index) => {
      if (item.action !== 'tank') return;
      const mode = this.modeForParams(item.params);
      if (!mode) return;
      const rec = formatRecord(mode);
      if (rec === 'NO RECORD') return;
      drawText(ctx, rec, LOGICAL_WIDTH / 2 + 210, top + this.menu.spacing * index, {
        size: 12,
        color: COLORS.bubble,
        align: 'left',
        alpha: 0.85,
      });
    });
  }
}
