import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { LORE, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

const VISIBLE = 9;
const LINE_WIDTH = 44;

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

export class LoreScene extends Scene {
  enter() {
    this.time = 0;
    this.sectionIndex = 0;
    this.entryIndex = 0;
  }

  get section() {
    return LORE[this.sectionIndex];
  }

  get entry() {
    return this.section.entries[this.entryIndex];
  }

  moveSection(step) {
    const count = LORE.length;
    this.sectionIndex = (this.sectionIndex + step + count) % count;
    this.entryIndex = 0;
    this.game.audio.tone({ freq: 480 + this.sectionIndex * 60, duration: 0.06, volume: 0.14 });
  }

  moveEntry(step) {
    const count = this.section.entries.length;
    this.entryIndex = (this.entryIndex + step + count) % count;
    this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.1 });
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('menu');
      return;
    }
    if (input.wasPressed('left')) this.moveSection(-1);
    if (input.wasPressed('right')) this.moveSection(1);
    if (input.wasPressed('up')) this.moveEntry(-1);
    if (input.wasPressed('down')) this.moveEntry(1);
  }

  renderTabs(ctx) {
    const spacing = 176;
    const startX = LOGICAL_WIDTH / 2 - ((LORE.length - 1) * spacing) / 2;
    LORE.forEach((section, index) => {
      const x = startX + index * spacing;
      const active = index === this.sectionIndex;
      drawText(ctx, section.title, x, 118, {
        size: active ? 16 : 13,
        color: active ? COLORS.accent : COLORS.textDim,
        glow: active ? 'rgba(255, 209, 102, 0.45)' : null,
        glowBlur: 12,
        alpha: active ? 1 : 0.7,
      });
      if (active) {
        ctx.fillStyle = COLORS.accent;
        ctx.fillRect(x - 52, 130, 104, 2.5);
      }
    });
  }

  renderList(ctx) {
    fillRoundRect(ctx, 96, 158, 320, 316, 18, 'rgba(10, 39, 64, 0.8)');
    strokeRoundRect(ctx, 96, 158, 320, 316, 18, 'rgba(207, 239, 255, 0.22)', 2);
    const entries = this.section.entries;
    const offset = clamp(this.entryIndex - Math.floor(VISIBLE / 2), 0, Math.max(0, entries.length - VISIBLE));
    for (let row = 0; row < Math.min(VISIBLE, entries.length); row += 1) {
      const index = offset + row;
      const entry = entries[index];
      const y = 186 + row * 32;
      const active = index === this.entryIndex;
      if (active) {
        fillRoundRect(ctx, 110, y - 14, 292, 28, 9, 'rgba(255, 209, 102, 0.14)');
      }
      drawText(ctx, entry.name, 126, y, {
        size: 14,
        color: active ? COLORS.accent : COLORS.text,
        align: 'left',
        alpha: active ? 1 : 0.78,
      });
      drawText(ctx, `${index + 1}/${entries.length}`, 388, y, {
        size: 10,
        color: COLORS.textDim,
        align: 'right',
        alpha: active ? 0.9 : 0.5,
      });
    }
  }

  renderPanel(ctx) {
    fillRoundRect(ctx, 448, 158, 416, 316, 18, 'rgba(10, 39, 64, 0.8)');
    strokeRoundRect(ctx, 448, 158, 416, 316, 18, 'rgba(207, 239, 255, 0.22)', 2);
    drawText(ctx, this.entry.name, 480, 196, {
      size: 20,
      color: COLORS.accent,
      align: 'left',
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 12,
    });
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(480, 216);
    ctx.lineTo(832, 216);
    ctx.stroke();
    const lines = wrap(this.entry.text);
    lines.forEach((line, index) => {
      drawText(ctx, line, 480, 244 + index * 22, {
        size: 13,
        color: COLORS.text,
        align: 'left',
        alpha: 0.92,
      });
    });
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'LORE', LOGICAL_WIDTH / 2, 52, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 20,
    });
    drawText(ctx, 'THE STORY OF THE SHARKQUARIUM — NAMES, TANKS, DIVERS, AND HAZARDS', LOGICAL_WIDTH / 2, 88, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.8,
    });
    this.renderTabs(ctx);
    this.renderList(ctx);
    this.renderPanel(ctx);
    drawText(
      ctx,
      'LEFT/RIGHT — SECTION      UP/DOWN — ENTRY      ESC — BACK',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 12, color: COLORS.textDim, alpha: 0.75 },
    );
  }
}
