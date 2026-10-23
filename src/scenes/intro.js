import { Scene } from '../engine/scene.js';
import { Bubble } from '../entities/bubble.js';
import { Shark } from '../entities/shark.js';
import { drawWater, drawText } from '../engine/render.js';
import { loadJSON } from '../engine/storage.js';
import { clamp, rand } from '../engine/math.js';
import { drawSkinAura, setActiveSkin, setSkinClock, skinByKey } from '../engine/skin.js';
import { accessoryByKey, setActiveAccessory } from '../engine/accessory.js';
import {
  GAME_TITLE,
  TAGLINE,
  SHOP_KEY,
  COLORS,
  WATER_PALETTE,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const IDLE_INPUT = { isDown: () => false, pointer: { down: false, dragX: 0, dragY: 0 } };

export class IntroScene extends Scene {
  enter() {
    this.time = 0;
    this.spawnTimer = 0.2;
    this.bubbles = [];
    this.leaving = false;
    const shop = loadJSON(SHOP_KEY, {});
    this.skin = skinByKey(shop.skin);
    this.accessory = accessoryByKey(shop.accessory);
    this.shark = new Shark(LOGICAL_WIDTH * 0.5, LOGICAL_HEIGHT * 0.7);
  }

  advance() {
    if (this.leaving) return;
    this.leaving = true;
    this.game.changeScene('menu');
  }

  update(dt) {
    this.time += dt;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(0.25, 0.6);
      this.bubbles.push(
        new Bubble(rand(40, LOGICAL_WIDTH - 40), LOGICAL_HEIGHT + 24, { rise: rand(26, 58) }),
      );
    }
    this.bubbles = this.bubbles.filter((bubble) => {
      bubble.update(dt);
      return bubble.y > -30;
    });
    const drift = this.time * 0.7;
    this.shark.update(dt, IDLE_INPUT);
    this.shark.x = LOGICAL_WIDTH * 0.5 + Math.sin(drift) * LOGICAL_WIDTH * 0.24;
    this.shark.y = LOGICAL_HEIGHT * 0.7 + Math.sin(drift * 2.3) * 24;
    this.shark.vx = Math.cos(drift) * 96;
    this.shark.vy = Math.sin(drift * 2.3) * 42;
    this.shark.heading = Math.atan2(this.shark.vy, this.shark.vx);

    const input = this.game.input;
    if (this.time > 0.8 && (input.wasPressed('confirm') || input.pointer.down)) {
      this.advance();
      return;
    }
    if (this.time > 8) this.advance();
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    for (const bubble of this.bubbles) bubble.render(ctx);
    setActiveSkin(this.skin);
    setSkinClock(this.time);
    setActiveAccessory(this.accessory);
    this.shark.render(ctx);
    drawSkinAura(ctx, this.shark);

    const dark = clamp(0.8 - this.time * 0.16, 0.16, 0.8);
    ctx.fillStyle = `rgba(4, 16, 29, ${dark.toFixed(3)})`;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const titleAlpha = clamp((this.time - 0.5) / 1.2, 0, 1);
    drawText(ctx, GAME_TITLE, LOGICAL_WIDTH / 2, 150, {
      size: 54,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 26,
      alpha: titleAlpha,
    });
    drawText(ctx, TAGLINE, LOGICAL_WIDTH / 2, 196, {
      size: 14,
      color: COLORS.foam,
      alpha: titleAlpha * 0.85,
    });
    const story = [
      'The aquarium has closed for the night and the halls have gone dark.',
      'You are the resident shark, sneaking one last lap before lights-out —',
      'and if you gather enough bubbles, the tanks will pull you somewhere stranger.',
    ];
    story.forEach((line, index) => {
      drawText(ctx, line, LOGICAL_WIDTH / 2, 258 + index * 22, {
        size: 13,
        weight: 400,
        color: COLORS.foam,
        alpha: clamp((this.time - 1.1 - index * 0.25) / 0.8, 0, 1) * 0.85,
      });
    });
    if (this.time > 2) {
      drawText(ctx, 'ENTER — BEGIN', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, {
        size: 14,
        color: COLORS.accent,
        alpha: 0.55 + 0.45 * Math.sin(this.time * 4),
      });
    }
  }
}
