import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText } from '../engine/render.js';
import { loadJSON } from '../engine/storage.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, SHOP_KEY, WATER_PALETTE } from '../config.js';

export class MinigamesScene extends Scene {
  enter() {
    this.time = 0;
    this.shop = { passes: [], ...loadJSON(SHOP_KEY, {}) };
    const items = [];
    if (this.shop.passes.includes('competitions')) {
      items.push({ label: 'COMPETITIONS (2P RACE)', action: 'race' });
      items.push({ label: 'TAG (2P + 5 CPU)', action: 'tag' });
      items.push({ label: 'PUFFERFISH DODGEBALL (2P)', action: 'dodgeball' });
    }
    items.push({ label: 'BACK', action: 'back' });
    this.menu = new SelectList(items, {
      glowColor: COLORS.bubble,
      accentColor: COLORS.accent,
      color: COLORS.text,
      spacing: 46,
      width: 520,
      onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
      onConfirm: (item) => this.choose(item),
    });
    this.menu.reset();
  }

  choose(item) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (item.action === 'race') this.game.changeScene('play', { race: true });
    else if (item.action === 'tag') this.game.changeScene('tag');
    else if (item.action === 'dodgeball') this.game.changeScene('dodgeball');
    else this.game.changeScene('menu');
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
    drawText(ctx, 'MINIGAMES', LOGICAL_WIDTH / 2, 100, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    drawText(ctx, 'LOCAL COMPETITIONS — GRAB A SECOND PLAYER', LOGICAL_WIDTH / 2, 140, {
      size: 13,
      color: COLORS.foam,
      alpha: 0.8,
    });
    this.menu.render(ctx, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.47);
    drawText(
      ctx,
      'COMPETITIONS: BOTH PLAYERS COLLECT BUBBLES FOR 30 SECONDS — MOST WINS',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT * 0.68,
      {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.8,
      },
    );
    drawText(
      ctx,
      'TAG: 2 PLAYERS + 5 CPU SWIMMERS — DODGE WHOEVER IS IT',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT * 0.72,
      {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.8,
      },
    );
    drawText(
      ctx,
      'DODGEBALL: THREE LIVES EACH — NO TIMER — THE FIRST KNOCKOUT ENDS IT',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT * 0.76,
      {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.8,
      },
    );
    drawText(ctx, 'P1 — WASD      P2 — ARROWS', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.81, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.7,
    });
    drawText(ctx, 'ENTER — CONFIRM      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 26, {
      size: 12,
      color: COLORS.textDim,
    });
  }
}
