import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText } from '../engine/render.js';
import { COLORS, MUTANT_VARIANTS, WATER_PALETTE, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class MutantSelectScene extends Scene {
  enter() {
    this.time = 0;
    this.menu = new SelectList(
      [
        ...MUTANT_VARIANTS.map((v) => ({ label: v.label, action: 'pick', variant: v.key })),
        { label: 'BACK', action: 'back' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 30,
        fontSize: 18,
        width: 560,
        visible: 11,
        wheel: true,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.choose(item),
      },
    );
    this.menu.reset();
  }

  choose(item) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (item.action === 'back') {
      this.game.changeScene('tanks');
      return;
    }
    this.game.changeScene('mutant', { variant: item.variant });
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('tanks');
      return;
    }
    this.menu.update(dt, input);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'MUTANT HORRORS', LOGICAL_WIDTH / 2, 78, {
      size: 38,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    drawText(ctx, 'ORIGINAL FLESH-HORROR TANKS — PICK YOUR NIGHTMARE', LOGICAL_WIDTH / 2, 116, {
      size: 13,
      color: COLORS.foam,
      alpha: 0.85,
    });
    this.menu.render(ctx, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.58);
    const selected = this.menu.selected;
    if (selected && selected.variant) {
      const variant = MUTANT_VARIANTS.find((v) => v.key === selected.variant);
      if (variant) {
        drawText(ctx, variant.blurb, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 52, {
          size: 13,
          color: COLORS.accent,
          alpha: 0.9,
        });
      }
    }
    drawText(ctx, 'ENTER — DIVE      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 26, {
      size: 12,
      color: COLORS.textDim,
    });
  }
}
