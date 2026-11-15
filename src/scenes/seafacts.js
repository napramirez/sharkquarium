import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { SEA_FACTS, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';
import { checkAchievements } from '../engine/achievements.js';

const LINE_WIDTH = 46;
const LINES_PER_PAGE = 11;

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
    checkAchievements({ openedFacts: true });
  }

  get fact() {
    return SEA_FACTS[this.index];
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
    if (input.wasPressed('confirm')) {
      const count = this.pages().length;
      if (count > 1) {
        this.page = (this.page + 1) % count;
        this.game.audio.tone({ freq: 560, duration: 0.05, volume: 0.1 });
      }
    }
  }

  renderTabs(ctx) {
    const total = SEA_FACTS.length;
    const spacing = Math.min(96, (LOGICAL_WIDTH - 120) / total);
    const startX = LOGICAL_WIDTH / 2 - ((total - 1) * spacing) / 2;
    SEA_FACTS.forEach((fact, index) => {
      const active = index === this.index;
      drawText(ctx, fact.name.split(' ')[0], startX + index * spacing, 116, {
        size: active ? 12 : 10,
        color: active ? COLORS.accent : COLORS.textDim,
        alpha: active ? 1 : 0.6,
      });
    });
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'SEA FACTS', LOGICAL_WIDTH / 2, 70, {
      size: 36,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    this.renderTabs(ctx);

    fillRoundRect(ctx, 150, 140, LOGICAL_WIDTH - 300, 320, 22, 'rgba(8, 32, 52, 0.9)');
    strokeRoundRect(ctx, 150, 140, LOGICAL_WIDTH - 300, 320, 22, 'rgba(207, 239, 255, 0.28)', 2);

    drawText(ctx, this.fact.name, LOGICAL_WIDTH / 2, 178, {
      size: 26,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 14,
    });

    const pages = this.pages();
    const lines = pages[this.page] ?? [];
    lines.forEach((line, index) => {
      drawText(ctx, line, LOGICAL_WIDTH / 2, 220 + index * 20, {
        size: 14,
        color: COLORS.text,
        alpha: 0.92,
      });
    });

    if (pages.length > 1) {
      drawText(ctx, `${this.page + 1}/${pages.length}`, LOGICAL_WIDTH - 172, 178, {
        size: 13,
        color: COLORS.bubble,
        align: 'right',
      });
    }
    const count = `${this.index + 1}/${SEA_FACTS.length}`;
    drawText(ctx, count, 172, 178, { size: 13, color: COLORS.bubble, align: 'left' });

    drawText(ctx, 'UP / DOWN — NEXT CREATURE      ENTER — NEXT PAGE      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 26, {
      size: 12,
      color: COLORS.textDim,
    });
  }
}
