import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { rushLevelById, rushLevelPages } from '../engine/rushlevels.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const CARD_W = 620;
const CARD_H = 300;
const CARD_X = (W - CARD_W) / 2;
const CARD_Y = 150;

const FORM_COLORS = {
  fish: '#63e6ff',
  stingray: '#7f97a8',
  eel: '#5d7a52',
  crab: '#d96448',
  urchin: '#7a5b96',
  jelly: '#c9a6ff',
  nautilus: '#d9a93c',
  shrimp: '#8fe14a',
};

export class RushBriefScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.level = rushLevelById(params.level);
    this.pages = this.level ? rushLevelPages(this.level) : [];
    this.page = 0;
    this.color = FORM_COLORS[this.level?.form] ?? COLORS.accent;
    if (!this.level || this.pages.length === 0) {
      this.game.changeScene('rushlevels');
      return;
    }
    this.game.audio.tone({ freq: 420, endFreq: 620, duration: 0.14, volume: 0.16 });
  }

  advance() {
    if (this.page < this.pages.length - 1) {
      this.page += 1;
      this.game.audio.tone({ freq: 520 + this.page * 60, duration: 0.06, volume: 0.12 });
    } else {
      this.begin();
    }
  }

  retreat() {
    if (this.page > 0) {
      this.page -= 1;
      this.game.audio.tone({ freq: 420, duration: 0.06, volume: 0.12 });
    } else {
      this.game.changeScene('rushlevels');
    }
  }

  begin() {
    this.game.changeScene('reefrush', { level: this.level.id });
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('rushlevels');
      return;
    }
    if (input.wasPressed('left') || input.wasPressed('up')) {
      this.retreat();
      return;
    }
    if (input.wasPressed('right') || input.wasPressed('down') || input.wasPressed('confirm')) {
      this.advance();
    }
  }

  render(ctx) {
    drawWater(ctx, W, H, this.time, WATER_PALETTE);
    const page = this.pages[this.page];
    const last = this.page >= this.pages.length - 1;

    drawText(ctx, this.level.name, W / 2, 62, {
      size: 30,
      color: COLORS.text,
      glow: this.color,
      glowBlur: 18,
    });
    drawText(ctx, this.level.tutorial ? 'DEMONSTRATION — HOW TO PLAY' : 'BRIEFING', W / 2, 96, {
      size: 13,
      color: this.color,
      alpha: 0.9,
    });

    const pulse = 0.5 + 0.5 * Math.sin(this.time * 3);
    fillRoundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 22, 'rgba(6, 26, 40, 0.85)');
    strokeRoundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 22, this.color, 2.5);

    fillCircle(ctx, CARD_X + 70, CARD_Y + 62, 30 + pulse * 4, 'rgba(255, 255, 255, 0.08)');
    fillCircle(ctx, CARD_X + 70, CARD_Y + 62, 22, this.color);
    drawText(ctx, String(this.page + 1), CARD_X + 70, CARD_Y + 63, {
      size: 20,
      color: '#041018',
    });

    drawText(ctx, page.title, CARD_X + 120, CARD_Y + 56, {
      size: 22,
      color: COLORS.text,
      align: 'left',
    });

    page.lines.forEach((line, i) => {
      const y = CARD_Y + 122 + i * 44;
      fillCircle(ctx, CARD_X + 40, y, 4, this.color);
      drawText(ctx, line, CARD_X + 60, y, {
        size: 15,
        color: COLORS.foam,
        align: 'left',
      });
    });

    const dotsX = W / 2 - (this.pages.length - 1) * 12;
    for (let i = 0; i < this.pages.length; i += 1) {
      fillCircle(ctx, dotsX + i * 24, CARD_Y + CARD_H + 34, i === this.page ? 6 : 4, i === this.page ? this.color : 'rgba(207, 239, 255, 0.35)');
    }

    const label = last ? 'PLAY' : 'NEXT';
    const btnW = 220;
    const btnX = W / 2 - btnW / 2;
    const btnY = CARD_Y + CARD_H + 66;
    ctx.save();
    ctx.globalAlpha = 0.75 + 0.25 * pulse;
    fillRoundRect(ctx, btnX, btnY, btnW, 46, 12, this.color);
    ctx.restore();
    drawText(ctx, `${label}  (ENTER)`, W / 2, btnY + 24, { size: 17, color: '#041018' });
    drawText(ctx, this.level.blurb, W / 2, btnY + 78, {
      size: 13,
      color: COLORS.textDim,
      alpha: 0.85,
    });

    drawText(ctx, 'LEFT / RIGHT — TURN THE PAGE      ENTER / CLICK — NEXT & PLAY      ESC — BACK', W / 2, H - 20, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.8,
    });
  }
}
