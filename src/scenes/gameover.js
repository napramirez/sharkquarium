import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { COLORS, WATER_PALETTE, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class GameOverScene extends Scene {
  enter(params = {}) {
    this.score = params.score ?? 0;
    this.best = params.best ?? this.score;
    this.isNewBest = Boolean(params.isNewBest);
    this.mode = params.params ?? {};
    this.time = 0;
    this.menu = new SelectList(
      [
        { label: 'PLAY AGAIN', action: 'again' },
        { label: 'MENU', action: 'menu' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 46,
        fontSize: 20,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.choose(item.action),
      },
    );
    this.menu.reset();

    const audio = this.game.audio;
    audio.tone({ freq: 392, type: 'triangle', duration: 0.22, volume: 0.2 });
    audio.tone({ freq: 523, type: 'triangle', duration: 0.22, volume: 0.2, delay: 0.16 });
    audio.tone({ freq: 659, type: 'triangle', duration: 0.32, volume: 0.2, delay: 0.32 });
  }

  choose(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.game.changeScene('play', this.mode);
    else this.game.changeScene('menu');
  }

  update(dt) {
    this.time += dt;
    if (this.time < 0.5) return;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.choose('menu');
      return;
    }
    this.menu.update(dt, input);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    ctx.fillStyle = 'rgba(4, 16, 29, 0.55)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const reveal = clamp(this.time / 0.35, 0, 1);
    const scale = 1 - Math.pow(1 - reveal, 3);
    const panelWidth = 460;
    const panelHeight = 360;
    const panelX = (LOGICAL_WIDTH - panelWidth) / 2;
    const panelY = (LOGICAL_HEIGHT - panelHeight) / 2;
    const centerX = LOGICAL_WIDTH / 2;
    const centerY = LOGICAL_HEIGHT / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    fillRoundRect(ctx, panelX, panelY, panelWidth, panelHeight, 26, 'rgba(10, 39, 64, 0.94)');
    strokeRoundRect(ctx, panelX, panelY, panelWidth, panelHeight, 26, 'rgba(207, 239, 255, 0.3)', 2);

    drawText(ctx, "TIME'S UP", centerX, panelY + 54, {
      size: 38,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.55)',
      glowBlur: 20,
    });
    drawText(ctx, 'BUBBLES COLLECTED', centerX, panelY + 108, {
      size: 13,
      color: COLORS.textDim,
    });
    drawText(ctx, `${this.score}`, centerX, panelY + 158, {
      size: 64,
      color: COLORS.text,
    });
    if (this.isNewBest) {
      drawText(ctx, 'NEW BEST!', centerX, panelY + 212, {
        size: 20,
        color: COLORS.accent,
        alpha: 0.65 + 0.35 * Math.sin(this.time * 6),
      });
    } else {
      drawText(ctx, `BEST ${this.best}`, centerX, panelY + 212, {
        size: 16,
        color: COLORS.foam,
        alpha: 0.8,
      });
    }

    const promptFade = clamp((this.time - 0.5) / 0.4, 0, 1);
    ctx.save();
    ctx.globalAlpha = promptFade;
    this.menu.render(ctx, centerX, panelY + 288);
    ctx.restore();

    ctx.restore();
  }
}
