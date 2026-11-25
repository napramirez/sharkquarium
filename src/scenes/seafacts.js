import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { SEA_FACTS, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE, SETTINGS_KEY } from '../config.js';
import { loadJSON } from '../engine/storage.js';
import { checkAchievements } from '../engine/achievements.js';
import { drawCreatureIcon } from '../engine/codexicons.js';
import { memeName } from '../engine/meme.js';

const LINE_WIDTH = 62;
const LINES_PER_PAGE = 10;
const VISIBLE = 10;

function wrap(text) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > LINE_WIDTH && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function paginate(text) {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const pages = [];
  let page = [];
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    const lines = wrap(sentence);
    if (page.length > 0 && page.length + lines.length > LINES_PER_PAGE) {
      pages.push(page);
      page = [];
    }
    if (lines.length > LINES_PER_PAGE) {
      for (const line of lines) {
        if (page.length >= LINES_PER_PAGE) {
          pages.push(page);
          page = [];
        }
        page.push(line);
      }
    } else {
      page.push(...lines);
    }
  }
  if (page.length) pages.push(page);
  return pages.length ? pages : [['']];
}

export class SeaFactsScene extends Scene {
  enter() {
    this.time = 0;
    this.index = 0;
    this.page = 0;
    const favorite = loadJSON(SETTINGS_KEY, {}).favorite;
    this.favorite = typeof favorite === 'string' ? favorite : null;
    if (this.favorite) {
      const idx = SEA_FACTS.findIndex((fact) => fact.name === this.favorite);
      if (idx >= 0) this.index = idx;
    }
    checkAchievements({ openedFacts: true });
  }

  get fact() {
    return SEA_FACTS[this.index];
  }

  displayName() {
    return memeName(this.fact.name);
  }

  pages() {
    return paginate(this.fact.text);
  }

  move(step) {
    const count = SEA_FACTS.length;
    this.index = (this.index + step + count) % count;
    this.page = 0;
    this.game.audio.tone({ freq: 520 + this.index * 20, duration: 0.06, volume: 0.14 });
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('menu');
      return;
    }
    if (input.wasPressed('up')) this.move(-1);
    if (input.wasPressed('down')) this.move(1);
    if (input.wasPressed('left')) this.move(-1);
    if (input.wasPressed('right')) this.move(1);
    if (input.wheel) this.move(Math.sign(input.wheel) * Math.min(4, Math.abs(input.wheel)));
    if (input.wasPressed('confirm')) {
      const count = this.pages().length;
      if (count > 1) {
        this.page = (this.page + 1) % count;
        this.game.audio.tone({ freq: 560, duration: 0.05, volume: 0.1 });
      }
    }
  }

  renderList(ctx) {
    fillRoundRect(ctx, 30, 138, 212, 336, 18, 'rgba(10, 39, 64, 0.82)');
    strokeRoundRect(ctx, 30, 138, 212, 336, 18, 'rgba(207, 239, 255, 0.22)', 2);
    const total = SEA_FACTS.length;
    const offset = clamp(this.index - Math.floor(VISIBLE / 2), 0, Math.max(0, total - VISIBLE));
    for (let row = 0; row < Math.min(VISIBLE, total); row += 1) {
      const index = offset + row;
      const fact = SEA_FACTS[index];
      const y = 170 + row * 30;
      const active = index === this.index;
      if (active) {
        fillRoundRect(ctx, 40, y - 15, 192, 27, 8, 'rgba(255, 209, 102, 0.16)');
      }
      const star = fact.name === this.favorite ? '\u2605 ' : '';
      drawText(ctx, `${star}${memeName(fact.name)}`, 54, y, {
        size: 13,
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

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'SEA FACTS', LOGICAL_WIDTH / 2, 64, {
      size: 34,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    this.renderList(ctx);

    fillRoundRect(ctx, 258, 138, 672, 336, 22, 'rgba(8, 32, 52, 0.9)');
    strokeRoundRect(ctx, 258, 138, 672, 336, 22, 'rgba(207, 239, 255, 0.28)', 2);

    drawCreatureIcon(ctx, this.fact.name, 368, 302, 150, this.time);

    drawText(ctx, this.displayName(), 470, 192, {
      size: 24,
      color: COLORS.accent,
      align: 'left',
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 14,
    });
    if (this.fact.name === this.favorite) {
      drawText(ctx, '\u2605 YOUR FAVOURITE', 910, 214, {
        size: 12,
        color: COLORS.accent,
        align: 'right',
      });
    }

    const pages = this.pages();
    const lines = pages[this.page] ?? [];
    lines.forEach((line, index) => {
      drawText(ctx, line, 470, 228 + index * 20, {
        size: 14,
        color: COLORS.text,
        align: 'left',
        alpha: 0.92,
      });
    });

    if (pages.length > 1) {
      drawText(ctx, `${this.page + 1}/${pages.length}`, 910, 192, {
        size: 13,
        color: COLORS.bubble,
        align: 'right',
      });
    }

    drawText(ctx, `${this.index + 1}/${SEA_FACTS.length}`, 910, 168, {
      size: 13,
      color: COLORS.bubble,
      align: 'right',
    });

    drawText(
      ctx,
      'UP / DOWN OR SCROLL WHEEL \u2014 CREATURE      ENTER \u2014 NEXT PAGE      ESC \u2014 BACK',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 26,
      { size: 12, color: COLORS.textDim },
    );
  }
}
