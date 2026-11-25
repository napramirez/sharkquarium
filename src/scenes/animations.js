import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';
import { ANIMATIONS } from '../engine/animations.js';

const VISIBLE = 10;

export class AnimationsScene extends Scene {
  enter() {
    this.time = 0;
    this.index = 0;
    this.anatomy = false;
    this.animators = ANIMATIONS.map((entry) => entry.make());
  }

  get entry() {
    return ANIMATIONS[this.index];
  }

  move(step) {
    const count = ANIMATIONS.length;
    this.index = (this.index + step + count) % count;
    this.game.audio.tone({ freq: 520 + this.index * 18, duration: 0.06, volume: 0.14 });
  }

  update(dt) {
    this.time += dt;
    this.animators[this.index].update(dt);
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('menu');
      return;
    }
    if (input.wasPressed('up')) this.move(-1);
    if (input.wasPressed('down')) this.move(1);
    if (input.wasPressed('left')) this.move(-1);
    if (input.wasPressed('right')) this.move(1);
    if (input.wasPressed('confirm')) {
      this.anatomy = !this.anatomy;
      this.game.audio.tone({ freq: this.anatomy ? 660 : 440, duration: 0.06, volume: 0.14 });
    }
    if (input.wheel) this.move(Math.sign(input.wheel) * Math.min(4, Math.abs(input.wheel)));
  }

  renderList(ctx) {
    fillRoundRect(ctx, 30, 138, 212, 336, 18, 'rgba(10, 39, 64, 0.82)');
    strokeRoundRect(ctx, 30, 138, 212, 336, 18, 'rgba(207, 239, 255, 0.22)', 2);
    const total = ANIMATIONS.length;
    const offset = clamp(this.index - Math.floor(VISIBLE / 2), 0, Math.max(0, total - VISIBLE));
    for (let row = 0; row < Math.min(VISIBLE, total); row += 1) {
      const index = offset + row;
      const entry = ANIMATIONS[index];
      const y = 170 + row * 30;
      const active = index === this.index;
      if (active) fillRoundRect(ctx, 40, y - 15, 192, 27, 8, 'rgba(255, 209, 102, 0.16)');
      drawText(ctx, entry.name, 54, y, {
        size: 12,
        color: active ? COLORS.accent : COLORS.text,
        align: 'left',
        alpha: active ? 1 : 0.8,
      });
    }
    if (total > VISIBLE) {
      const trackTop = 150;
      const trackH = 312;
      const barH = Math.max(24, trackH * (VISIBLE / total));
      const barY = trackTop + (trackH - barH) * (this.index / (total - 1));
      fillRoundRect(ctx, 232, barY, 4, barH, 2, 'rgba(207, 239, 255, 0.35)');
    }
  }

  renderPreview(ctx) {
    const entry = this.entry;
    const fit = entry.fit ?? 1;
    const center = entry.center ?? 0;
    const cx = 595;
    const cy = 300;
    const toScreen = (x, y) => ({
      x: cx + (x * entry.radius - center * entry.radius) * fit,
      y: cy + y * entry.radius * fit,
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(270, 150, 650, 312);
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.scale(fit, fit);
    ctx.translate(-center * entry.radius, 0);
    this.animators[this.index].draw(ctx, entry.radius);
    ctx.restore();

    if (this.anatomy && entry.anatomy) {
      for (const part of entry.anatomy) {
        const pt = toScreen(part.x, part.y);
        const above = part.y < 0;
        const ly = pt.y + (above ? -22 : 22);
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x, ly);
        ctx.stroke();
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        drawText(ctx, part.label, pt.x, ly + (above ? -8 : 8), {
          size: 10,
          color: COLORS.accent,
          glow: 'rgba(2, 10, 18, 0.9)',
          glowBlur: 5,
        });
      }
    }
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'ANIMATION CENTER', LOGICAL_WIDTH / 2, 64, {
      size: 34,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    drawText(
      ctx,
      'EVERY SEA CREATURE WITH ITS OWN ANIMATION \u2014 EMOTE-ONLY CREATURES ARE NOT LISTED',
      LOGICAL_WIDTH / 2,
      94,
      { size: 11, color: COLORS.foam, alpha: 0.85 },
    );

    this.renderList(ctx);

    fillRoundRect(ctx, 258, 138, 672, 336, 22, 'rgba(8, 32, 52, 0.9)');
    strokeRoundRect(ctx, 258, 138, 672, 336, 22, 'rgba(207, 239, 255, 0.28)', 2);

    this.renderPreview(ctx);

    const entry = this.entry;
    drawText(ctx, entry.name, 288, 174, {
      size: 24,
      color: COLORS.accent,
      align: 'left',
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 14,
    });
    drawText(ctx, `ACTION \u2014 ${entry.action}`, 288, 206, {
      size: 14,
      color: COLORS.bubble,
      align: 'left',
    });
    drawText(ctx, `TYPE \u2014 ${entry.kind}`, 910, 174, {
      size: 13,
      color: COLORS.textDim,
      align: 'right',
    });
    drawText(ctx, `${this.index + 1}/${ANIMATIONS.length}`, 910, 206, {
      size: 13,
      color: COLORS.bubble,
      align: 'right',
    });

    drawText(
      ctx,
      'UP / DOWN OR SCROLL WHEEL \u2014 CREATURE      ENTER \u2014 ANATOMY LABELS      ESC \u2014 BACK',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 26,
      { size: 12, color: COLORS.textDim },
    );
    if (this.anatomy) {
      drawText(ctx, 'ANATOMY', 910, 232, { size: 12, color: COLORS.accent, align: 'right' });
    }
  }
}
