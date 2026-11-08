import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { rushSkinLabel } from '../engine/rushlevels.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const DURATION = 7;

export class RushClearScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.name = params.name ?? 'REEF RUSH';
    this.pearls = params.pearls ?? 0;
    this.runTime = params.time ?? 0;
    this.unlocked = params.unlocked ?? null;
    this.first = Boolean(params.first);
    this.bubbles = Array.from({ length: 40 }, () => ({
      x: rand(0, W),
      y: rand(0, H),
      r: rand(2, 6),
      speed: rand(30, 90),
      phase: rand(0, TAU),
    }));
    this.confetti = Array.from({ length: 60 }, () => ({
      x: rand(0, W),
      y: rand(-H, 0),
      s: rand(3, 7),
      vy: rand(60, 140),
      vx: rand(-30, 30),
      phase: rand(0, TAU),
      color: ['#ffd166', '#63e6ff', '#ff6b9d', '#c6ff7a', '#ffffff'][Math.floor(rand(0, 5))],
    }));
    this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.3, volume: 0.24 });
    this.game.audio.tone({ freq: 784, type: 'triangle', duration: 0.4, volume: 0.22, delay: 0.18 });
    this.game.audio.tone({ freq: 1047, type: 'triangle', duration: 0.5, volume: 0.2, delay: 0.36 });
    if (this.unlocked) {
      this.game.audio.tone({ freq: 1320, type: 'square', duration: 0.2, volume: 0.14, delay: 0.8 });
      this.game.audio.tone({ freq: 1568, type: 'square', duration: 0.24, volume: 0.14, delay: 1.0 });
    }
  }

  advance() {
    this.game.changeScene('rushlevels');
  }

  update(dt) {
    this.time += dt;
    for (const bubble of this.bubbles) {
      bubble.y -= bubble.speed * dt;
      if (bubble.y < -10) {
        bubble.y = H + 10;
        bubble.x = rand(0, W);
      }
    }
    for (const c of this.confetti) {
      c.y += c.vy * dt;
      c.x += c.vx * dt;
      if (c.y > H + 10) {
        c.y = -10;
        c.x = rand(0, W);
      }
    }
    const input = this.game.input;
    if (this.time > 0.8 && (input.wasPressed('confirm') || input.wasPressed('back') || input.pointer.down)) {
      this.advance();
      return;
    }
    if (this.time >= DURATION) this.advance();
  }

  render(ctx) {
    drawWater(ctx, W, H, this.time, WATER_PALETTE);
    for (const bubble of this.bubbles) {
      ctx.strokeStyle = 'rgba(207, 239, 255, 0.25)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.r, 0, TAU);
      ctx.stroke();
    }
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(this.time * 4 + c.phase);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.s / 2, -c.s / 2, c.s, c.s * 1.6);
      ctx.restore();
    }

    const slam = clamp(this.time / 0.5, 0, 1);
    const scale = 1 + (1 - slam) * 0.6;
    drawText(ctx, 'LEVEL CLEAR!', W / 2, H * 0.3, {
      size: 52 * scale,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.6)',
      glowBlur: 26,
      alpha: slam,
    });
    drawText(ctx, this.name, W / 2, H * 0.42, {
      size: 26,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 16,
      alpha: clamp((this.time - 0.3) / 0.6, 0, 1),
    });

    const panelAlpha = clamp((this.time - 0.7) / 0.6, 0, 1);
    if (panelAlpha > 0) {
      fillRoundRect(ctx, W / 2 - 220, H * 0.52, 440, 120, 18, `rgba(10, 39, 64, ${0.9 * panelAlpha})`);
      strokeRoundRect(ctx, W / 2 - 220, H * 0.52, 440, 120, 18, `rgba(207, 239, 255, ${0.3 * panelAlpha})`, 2);
      drawText(ctx, `${Math.round(this.runTime)}s   ·   ${this.pearls} PEARLS`, W / 2, H * 0.52 + 38, {
        size: 18,
        color: COLORS.text,
        alpha: panelAlpha,
      });
      if (this.unlocked) {
        drawText(ctx, `SKIN UNLOCKED — ${rushSkinLabel(this.unlocked)}`, W / 2, H * 0.52 + 82, {
          size: 16,
          color: COLORS.accent,
          glow: 'rgba(255, 209, 102, 0.5)',
          glowBlur: 12,
          alpha: panelAlpha,
        });
      } else if (this.first) {
        drawText(ctx, 'CLEARED — NEW LEVEL LOGGED', W / 2, H * 0.52 + 82, {
          size: 15,
          color: COLORS.foam,
          alpha: panelAlpha,
        });
      } else {
        drawText(ctx, 'ALREADY CLEARED — GOOD RUN', W / 2, H * 0.52 + 82, {
          size: 15,
          color: COLORS.textDim,
          alpha: panelAlpha,
        });
      }
    }

    drawText(ctx, 'ENTER — CONTINUE', W / 2, H - 40, {
      size: 13,
      color: COLORS.accent,
      alpha: 0.55 + 0.45 * Math.sin(this.time * 5),
    });
  }
}