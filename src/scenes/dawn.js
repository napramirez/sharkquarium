import { Scene } from '../engine/scene.js';
import { drawText, fillCircle, strokeRoundRect } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const WINDOW = { x: 170, y: 70, width: 620, height: 330 };
const STARS = Array.from({ length: 24 }, (_, index) => ({
  x: ((index * 137) % 580) + 20,
  y: ((index * 71) % 170) + 14,
}));

export class DawnScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.score = params.score ?? 0;
    this.goal = params.goal ?? 0;
    this.line = params.line ?? null;
    this.fromTheatre = params.from === 'theatre';
    const audio = this.game.audio;
    audio.tone({ freq: 392, type: 'triangle', duration: 0.3, volume: 0.2 });
    audio.tone({ freq: 523, type: 'triangle', duration: 0.3, volume: 0.2, delay: 0.25 });
    audio.tone({ freq: 659, type: 'triangle', duration: 0.4, volume: 0.2, delay: 0.5 });
    audio.tone({ freq: 784, type: 'triangle', duration: 0.6, volume: 0.2, delay: 0.75 });
  }

  update(dt) {
    this.time += dt;
    if (this.time > 1.5 && this.game.input.wasPressed('confirm')) {
      this.game.changeScene(this.fromTheatre ? 'theatre' : 'menu');
    }
  }

  render(ctx) {
    const rise = clamp(this.time / 7, 0, 1);
    ctx.fillStyle = COLORS.abyss;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const { x, y, width, height } = WINDOW;
    const horizon = y + height * 0.62;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + 18, y);
    ctx.arcTo(x + width, y, x + width, y + height, 18);
    ctx.arcTo(x + width, y + height, x, y + height, 18);
    ctx.arcTo(x, y + height, x, y, 18);
    ctx.arcTo(x, y, x + width, y, 18);
    ctx.closePath();
    ctx.clip();

    const sky = ctx.createLinearGradient(0, y, 0, horizon);
    sky.addColorStop(0, '#8fc3e0');
    sky.addColorStop(0.6, '#ffcf8a');
    sky.addColorStop(1, '#ff9a5e');
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, width, horizon - y);

    const sea = ctx.createLinearGradient(0, horizon, 0, y + height);
    sea.addColorStop(0, '#3f7ea6');
    sea.addColorStop(1, '#123c5c');
    ctx.fillStyle = sea;
    ctx.fillRect(x, horizon, width, y + height - horizon);

    const sunX = x + width * 0.62;
    const sunY = horizon + 80 - rise * 130;
    const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 150);
    glow.addColorStop(0, 'rgba(255, 227, 150, 0.9)');
    glow.addColorStop(1, 'rgba(255, 227, 150, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - 150, sunY - 150, 300, 300);
    fillCircle(ctx, sunX, sunY, 34, '#ffd166');
    fillCircle(ctx, sunX, sunY, 24, '#fff3c4');

    ctx.strokeStyle = 'rgba(255, 227, 150, 0.65)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      const gy = horizon + 14 + i * 16;
      const gw = 60 - i * 8 + Math.sin(this.time * 2 + i) * 6;
      ctx.beginPath();
      ctx.moveTo(sunX - gw / 2, gy);
      ctx.lineTo(sunX + gw / 2, gy);
      ctx.stroke();
    }

    ctx.globalAlpha = 1 - rise;
    const night = ctx.createLinearGradient(0, y, 0, y + height);
    night.addColorStop(0, '#050a1e');
    night.addColorStop(1, '#0a1430');
    ctx.fillStyle = night;
    ctx.fillRect(x, y, width, height);
    for (const star of STARS) {
      fillCircle(ctx, x + star.x, y + star.y, 1.6, '#cfe0ff');
    }
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.14 * rise;
    ctx.fillStyle = '#ffe3a0';
    for (let i = 0; i < 3; i += 1) {
      const baseX = x + width * (0.3 + i * 0.2);
      ctx.beginPath();
      ctx.moveTo(baseX - 30, y);
      ctx.lineTo(baseX + 30, y);
      ctx.lineTo(baseX + 150, y + height);
      ctx.lineTo(baseX + 40, y + height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    strokeRoundRect(ctx, x, y, width, height, 18, 'rgba(120, 150, 170, 0.9)', 8);
    ctx.strokeStyle = 'rgba(120, 150, 170, 0.75)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.moveTo(x, y + height / 2);
    ctx.lineTo(x + width, y + height / 2);
    ctx.stroke();

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 2; i += 1) {
      const rx = x + 80 + i * 300;
      ctx.beginPath();
      ctx.moveTo(rx, y + height);
      ctx.lineTo(rx + 90, y);
      ctx.lineTo(rx + 140, y);
      ctx.lineTo(rx + 50, y + height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(3, 8, 14, 0.92)';
    ctx.fillRect(0, LOGICAL_HEIGHT - 46, LOGICAL_WIDTH, 46);
    for (let i = 0; i < 9; i += 1) {
      const bx = 90 + i * 97;
      const by = LOGICAL_HEIGHT - 50 - ((this.time * 34 + i * 83) % (LOGICAL_HEIGHT - 90));
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.arc(bx, by, 5 + (i % 3), 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.bubble;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const textAlpha = clamp((this.time - 3) / 1.5, 0, 1);
    drawText(ctx, 'DAWN BREAKS', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.84, {
      size: 44,
      color: COLORS.text,
      glow: COLORS.accent,
      glowBlur: 26,
      alpha: textAlpha,
    });
    drawText(
      ctx,
      this.line ?? (this.fromTheatre
        ? 'A QUIET SUNRISE OVER THE EMPTY HALLS'
        : `YOU SURFACED ${this.goal} BUBBLES — SCORE ${this.score}`),
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT * 0.84 + 40,
      {
        size: 15,
        color: COLORS.foam,
        alpha: textAlpha * 0.9,
      },
    );
    if (this.time > 3) {
      drawText(
        ctx,
        this.fromTheatre ? 'ENTER — BACK TO THE THEATRE' : 'ENTER — BACK TO THE MENU',
        LOGICAL_WIDTH / 2,
        LOGICAL_HEIGHT - 20,
        {
          size: 13,
          color: COLORS.textDim,
          alpha: 0.55 + 0.45 * Math.sin(this.time * 4),
        },
      );
    }
  }
}
