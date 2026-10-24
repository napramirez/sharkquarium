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
    if (this.shop.passes.includes('playpass1') || this.shop.passes.includes('competitions')) {
      items.push({ label: 'COMPETITIONS (2P RACE)', action: 'race' });
      items.push({ label: 'RACE (1P)', action: 'raceSolo' });
      items.push({ label: 'TAG (2P + 5 CPU)', action: 'tag' });
      items.push({ label: 'TAG SOLO (1P + 5 CPU)', action: 'tagSolo' });
      items.push({ label: 'PUFFERFISH DODGEBALL (2P)', action: 'dodgeball' });
      items.push({ label: 'DODGEBALL SOLO (1P)', action: 'dodgeballSolo' });
      items.push({ label: 'LABYRINTH (2P)', action: 'labyrinth' });
      items.push({ label: 'LABYRINTH SOLO (1P)', action: 'labyrinthSolo' });
    }
    items.push({ label: 'BACK', action: 'back' });
    this.menu = new SelectList(items, {
      glowColor: COLORS.bubble,
      accentColor: COLORS.accent,
      color: COLORS.text,
      spacing: 36,
      fontSize: 20,
      width: 520,
      onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
      onConfirm: (item) => this.choose(item),
    });
    this.menu.reset();
  }

  choose(item) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (item.action === 'race') this.game.changeScene('play', { race: true });
    else if (item.action === 'raceSolo') this.game.changeScene('play', { race: true, solo: true });
    else if (item.action === 'tag') this.game.changeScene('tag');
    else if (item.action === 'tagSolo') this.game.changeScene('tag', { solo: true });
    else if (item.action === 'dodgeball') this.game.changeScene('dodgeball');
    else if (item.action === 'dodgeballSolo') this.game.changeScene('dodgeball', { solo: true });
    else if (item.action === 'labyrinth') this.game.changeScene('labyrinth');
    else if (item.action === 'labyrinthSolo') this.game.changeScene('labyrinth', { solo: true });
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
    drawText(ctx, 'MINIGAMES', LOGICAL_WIDTH / 2, 64, {
      size: 38,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    drawText(ctx, 'LOCAL COMPETITIONS — GRAB A SECOND PLAYER', LOGICAL_WIDTH / 2, 102, {
      size: 13,
      color: COLORS.foam,
      alpha: 0.8,
    });
    this.menu.render(ctx, LOGICAL_WIDTH / 2, 300);
    drawText(
      ctx,
      'RACE — CATCH BUBBLES   TAG — PASS IT ON   DODGEBALL — SURVIVE',
      LOGICAL_WIDTH / 2,
      478,
      {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.8,
      },
    );
    drawText(
      ctx,
      'LABYRINTH — PICK YOUR DIVER AND OUTRUN THE TENTACLES THROUGH SEVEN PARTS',
      LOGICAL_WIDTH / 2,
      496,
      {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.8,
      },
    );
    drawText(
      ctx,
      'P1 — WASD   P2 — ARROWS   SOLO — WASD   DIFFICULTY SCALES EVERY GAME   ESC — BACK',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.7,
      },
    );
  }
}
