import { Scene } from '../engine/scene.js';
import { fillCircle, drawText } from '../engine/render.js';
import { clamp, rand } from '../engine/math.js';
import { TANK_INTROS, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class TeleportScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.target = params.tank ?? 'reef';
    this.payload = params.payload ?? {};
    this.intro = TANK_INTROS[this.target] ?? { label: 'THE TANK', blurb: '' };
    this.bubbles = Array.from({ length: 26 }, () => ({
      x: rand(0, LOGICAL_WIDTH),
      y: rand(0, LOGICAL_HEIGHT),
      speed: rand(150, 380),
      radius: rand(1.6, 5),
    }));
    this.leaving = false;
    this.game.audio.tone({ freq: 200, endFreq: 1200, type: 'triangle', duration: 0.5, volume: 0.3 });
  }

  advance() {
    if (this.leaving) return;
    this.leaving = true;
    this.game.changeScene('play', { tank: this.target, ...this.payload });
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (this.time > 0.3 && (input.wasPressed('confirm') || input.pointer.down)) {
      this.advance();
      return;
    }
    if (this.time > 1.7) this.advance();
  }

  render(ctx) {
    ctx.fillStyle = COLORS.abyss;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    const span = LOGICAL_HEIGHT + 100;
    for (const bubble of this.bubbles) {
      const y = ((((bubble.y - this.time * bubble.speed) % span) + span) % span) - 50;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(bubble.x, y, bubble.radius, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.bubble;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const rise = clamp((this.time - 0.1) / 0.65, 0, 1);
    const eased = 1 - Math.pow(1 - rise, 3);
    const nameY = LOGICAL_HEIGHT * 0.66 - eased * LOGICAL_HEIGHT * 0.14;
    const alpha = clamp(rise * 1.5, 0, 1);
    drawText(ctx, this.intro.label, LOGICAL_WIDTH / 2, nameY, {
      size: 46,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 26,
      alpha,
    });
    drawText(ctx, this.intro.blurb, LOGICAL_WIDTH / 2, nameY + 46, {
      size: 15,
      color: COLORS.foam,
      alpha: alpha * 0.9,
    });
    const streak = clamp((this.time - 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = 0.5 * streak;
    ctx.fillStyle = COLORS.bubble;
    for (let i = 0; i < 7; i += 1) {
      const x = 120 + i * 120;
      const h = 90 + Math.sin(i * 2.1) * 50;
      const y = LOGICAL_HEIGHT - (((this.time * 900 + i * 260) % (LOGICAL_HEIGHT + 240)) - 120);
      fillCircle(ctx, x, y, 2, COLORS.bubble);
      ctx.fillRect(x - 1.5, y, 3, h);
    }
    ctx.globalAlpha = 1;

    if (this.time > 0.6) {
      drawText(ctx, 'ENTER — SKIP', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 28, {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.5 + 0.3 * Math.sin(this.time * 5),
      });
    }
  }
}
