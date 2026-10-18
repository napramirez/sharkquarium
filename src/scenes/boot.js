import { Scene } from '../engine/scene.js';
import { loadImages } from '../engine/assets.js';
import { clear, drawText } from '../engine/render.js';
import { IMAGE_MANIFEST } from '../assets/manifest.js';
import { GAME_TITLE, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class BootScene extends Scene {
  enter() {
    this.ready = false;
    this.error = null;
    loadImages(IMAGE_MANIFEST)
      .then((images) => {
        this.game.images = images;
        this.ready = true;
      })
      .catch((error) => {
        this.error = error.message;
        this.ready = true;
      });
  }

  update() {
    if (this.ready) this.game.changeScene('menu');
  }

  render(ctx) {
    clear(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS.abyss);
    drawText(ctx, GAME_TITLE, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 24, {
      size: 52,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 24,
    });
    drawText(
      ctx,
      this.error ? `ASSET ERROR: ${this.error}` : 'FILLING THE TANK...',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT / 2 + 40,
      {
        size: 17,
        color: this.error ? COLORS.danger : COLORS.foam,
        alpha: 0.9,
      },
    );
  }
}
