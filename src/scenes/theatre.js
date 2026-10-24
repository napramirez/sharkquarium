import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText } from '../engine/render.js';
import { TANK_INTROS, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';
import { TANK_TRAILER_LIST, MINIGAME_TRAILER_LIST } from './trailer.js';

const CUTSCENES = [
  {
    label: 'GAME TRAILER',
    blurb: 'THE WHOLE AQUARIUM IN ONE MINUTE — DIVE, DRESS UP, ESCAPE',
    scene: 'trailer',
  },
  {
    label: 'INTRO SPLASH',
    blurb: 'THE STORY CARDS OVER THE AMBIENT SHARK',
    scene: 'intro',
    params: { from: 'theatre' },
  },
  ...Object.entries(TANK_INTROS).map(([tank, intro]) => ({
    label: `DESCENT: ${intro.label.replace(' TANK', '')}`,
    blurb: intro.blurb,
    scene: 'descent',
    params: { tank, from: 'theatre' },
  })),
  {
    label: 'DAWN BREAKS',
    blurb: 'THE FRESHWATER SUNRISE',
    scene: 'dawn',
    params: { from: 'theatre' },
  },
  {
    label: 'LABYRINTH TRAILER',
    blurb: 'THE FULL PITCH — TENTACLES, TUNNELS, AND THE MEGASQUID',
    scene: 'labyrinth',
    params: { trailer: true },
  },
  {
    label: 'MEGASQUID ENDING',
    blurb: 'THE LABYRINTH FINALE — ESCAPE ALL SEVEN PARTS',
    scene: 'labyrinth',
    params: { ending: true },
  },
];

const GAUNTLET_ROW = {
  label: 'ALL-TANK GAMEPLAY',
  blurb: 'NINE TANKS, ONE CONTINUOUS RUN — THE WHOLE GAUNTLET IN MOTION',
};

const TANKS_ROW = {
  label: 'TANK TRAILERS',
  blurb: 'ONE QUICK CUT PER TANK — PICK A TANK AND DIVE',
};

const MINIGAMES_ROW = {
  label: 'MINIGAME TRAILERS',
  blurb: 'RACE, TAG, DODGEBALL, AND LABYRINTH — PICK A GAME AND PLAY',
};

const MENU_OPTIONS = {
  glowColor: COLORS.bubble,
  accentColor: COLORS.accent,
  color: COLORS.text,
  height: 24,
  width: 520,
};

const MAIN_LAYOUT = { spacing: 21, fontSize: 14 };
const PAGE_LAYOUT = { spacing: 23, fontSize: 15 };

const PAGE_SUBTITLES = {
  main: 'REPLAY ANY MOMENT WITHOUT HAVING TO REACH IT',
  tanks: 'ONE QUICK CUT PER TANK — PICK A TANK TO PLAY',
  minigames: 'ONE QUICK CUT PER GAME — PICK A MINIGAME TO PLAY',
};

export class TheatreScene extends Scene {
  enter() {
    this.time = 0;
    this.createMenu('main');
  }

  itemsFor(page) {
    if (page === 'tanks') {
      return [
        ...TANK_TRAILER_LIST.map(({ tank, label, blurb }) => ({
          label,
          blurb,
          action: 'play',
          entry: { scene: 'trailer', params: { tank }, blurb },
        })),
        { label: 'BACK', blurb: 'BACK TO THE CUTSCENE LIST', action: 'back' },
      ];
    }
    if (page === 'minigames') {
      return [
        ...MINIGAME_TRAILER_LIST.map(({ minigame, label, blurb }) => ({
          label,
          blurb,
          action: 'play',
          entry: { scene: 'trailer', params: { minigame }, blurb },
        })),
        { label: 'BACK', blurb: 'BACK TO THE CUTSCENE LIST', action: 'back' },
      ];
    }
    return [
      ...CUTSCENES.slice(0, 1).map((entry) => ({
        label: entry.label,
        blurb: entry.blurb,
        action: 'play',
        entry,
      })),
      {
        label: GAUNTLET_ROW.label,
        blurb: GAUNTLET_ROW.blurb,
        action: 'play',
        entry: { scene: 'trailer', params: { gauntlet: true }, blurb: GAUNTLET_ROW.blurb },
      },
      { label: TANKS_ROW.label, blurb: TANKS_ROW.blurb, action: 'tanks' },
      { label: MINIGAMES_ROW.label, blurb: MINIGAMES_ROW.blurb, action: 'minigames' },
      ...CUTSCENES.slice(1).map((entry) => ({
        label: entry.label,
        blurb: entry.blurb,
        action: 'play',
        entry,
      })),
      { label: 'BACK', blurb: 'BACK TO SETTINGS', action: 'back' },
    ];
  }

  createMenu(page) {
    this.page = page;
    const layout = page === 'main' ? MAIN_LAYOUT : PAGE_LAYOUT;
    this.menu = new SelectList(this.itemsFor(page), {
      ...MENU_OPTIONS,
      ...layout,
      onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
      onConfirm: (item) => this.choose(item),
    });
    this.menu.reset();
  }

  choose(item) {
    if (item.action === 'tanks' || item.action === 'minigames') {
      this.game.audio.tone({ freq: 520, endFreq: 780, type: 'triangle', duration: 0.14, volume: 0.2 });
      this.createMenu(item.action);
      return;
    }
    if (item.action === 'back') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      if (this.page !== 'main') {
        this.createMenu('main');
        return;
      }
      this.game.changeScene('settings');
      return;
    }
    this.game.audio.tone({ freq: 400, endFreq: 760, type: 'triangle', duration: 0.16, volume: 0.2 });
    this.game.changeScene(item.entry.scene, item.entry.params);
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      if (this.page !== 'main') {
        this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
        this.createMenu('main');
        return;
      }
      this.game.changeScene('settings');
      return;
    }
    this.menu.update(dt, input);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'CUTSCENE THEATRE', LOGICAL_WIDTH / 2, 54, {
      size: 32,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    drawText(
      ctx,
      PAGE_SUBTITLES[this.page],
      LOGICAL_WIDTH / 2,
      84,
      {
        size: 12,
        color: COLORS.foam,
        alpha: 0.8,
      },
    );
    const selected = this.menu.selected;
    if (selected && selected.blurb) {
      drawText(ctx, selected.blurb, LOGICAL_WIDTH / 2, 106, {
        size: 12,
        color: COLORS.accent,
        alpha: 0.9,
      });
    }
    this.menu.render(ctx, LOGICAL_WIDTH / 2, 296);
    drawText(ctx, 'ENTER — PLAY      UP/DOWN OR LEFT/RIGHT — SELECT', LOGICAL_WIDTH / 2, 486, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.8,
    });
    drawText(
      ctx,
      this.page !== 'main' ? 'ESC — BACK TO THE CUTSCENES' : 'ESC — BACK TO SETTINGS',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 22,
      {
        size: 12,
        color: COLORS.textDim,
      },
    );
  }
}
