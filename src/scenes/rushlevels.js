import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { RUSH_LEVELS, isLevelBeaten, beatenCount } from '../engine/rushlevels.js';
import { loadRushCourse, rushCourseHasItems } from '../engine/rushcourse.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const CARD_W = 340;
const CARD_GAP = 44;

export class RushLevelsScene extends Scene {
  enter() {
    this.time = 0;
    const course = loadRushCourse();
    this.cards = RUSH_LEVELS.map((level) => ({
      id: level.id,
      label: level.name,
      blurb: level.blurb,
      skin: level.skin,
      form: level.form,
      tutorial: Boolean(level.tutorial),
      kind: 'level',
      beaten: isLevelBeaten(level.id),
    }));
    this.cards.push({
      id: 'mycourse',
      label: 'MY COURSE',
      blurb: 'YOUR HAND-BUILT RUN',
      kind: 'course',
      beaten: false,
      has: rushCourseHasItems(course),
    });
    this.index = 0;
    this.scroll = 0;
    this.status = null;
    this.statusTimer = 0;
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
  }

  targetScroll() {
    return this.index * (CARD_W + CARD_GAP);
  }

  move(step) {
    this.index = clamp(this.index + step, 0, this.cards.length - 1);
    this.game.audio.tone({ freq: 520 + this.index * 40, duration: 0.06, volume: 0.12 });
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2.6;
  }

  choose(card) {
    if (!card) return;
    if (card.kind === 'course') {
      if (!card.has) {
        this.setStatus('NO COURSE YET — OPEN THE COURSE BUILDER');
        this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.2 });
        return;
      }
      this.game.changeScene('reefrush', { course: true });
      return;
    }
    this.game.changeScene('rushbrief', { level: card.id });
  }

  update(dt) {
    this.time += dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('minigames');
      return;
    }
    if (input.wasPressed('left') || input.wasPressed('up')) this.move(-1);
    if (input.wasPressed('right') || input.wasPressed('down')) this.move(1);
    if (input.wasPressed('confirm')) {
      if (input.pointer.down) {
        const card = this.cardAt(input.pointer.x, input.pointer.y);
        if (card) {
          const i = this.cards.indexOf(card);
          if (i === this.index) this.choose(card);
          else this.index = i;
        }
      } else {
        this.choose(this.cards[this.index]);
      }
    }
    this.scroll += (this.targetScroll() - this.scroll) * (1 - Math.exp(-10 * dt));
  }

  cardAt(x, y) {
    const offset = W / 2 - CARD_W / 2 - this.scroll;
    for (let i = 0; i < this.cards.length; i += 1) {
      const cx = offset + i * (CARD_W + CARD_GAP);
      const top = H * 0.32;
      if (x >= cx && x <= cx + CARD_W && y >= top && y <= top + 240) return this.cards[i];
    }
    return null;
  }

  renderCard(ctx, card, x, top, active) {
    const gradient = ctx.createLinearGradient(x, top, x, top + 240);
    gradient.addColorStop(0, active ? 'rgba(18, 60, 82, 0.96)' : 'rgba(10, 34, 50, 0.9)');
    gradient.addColorStop(1, active ? 'rgba(8, 34, 50, 0.96)' : 'rgba(6, 22, 34, 0.9)');
    fillRoundRect(ctx, x, top, CARD_W, 240, 20, gradient);
    strokeRoundRect(ctx, x, top, CARD_W, 240, 20, active ? COLORS.accent : 'rgba(207, 239, 255, 0.25)', active ? 3 : 1.5);
    if (card.kind === 'level') {
      drawText(ctx, card.tutorial ? 'TUTORIAL' : 'LEVEL', x + CARD_W / 2, top + 30, {
        size: 12,
        color: card.tutorial ? COLORS.accent : COLORS.textDim,
      });
    } else {
      drawText(ctx, `CUSTOM`, x + CARD_W / 2, top + 30, { size: 12, color: COLORS.textDim });
    }
    drawText(ctx, card.label, x + CARD_W / 2, top + 78, {
      size: card.label.length > 16 ? 22 : 26,
      color: active ? COLORS.accent : COLORS.text,
      glow: active ? 'rgba(255, 209, 102, 0.4)' : null,
      glowBlur: 14,
    });
    drawText(ctx, card.blurb, x + CARD_W / 2, top + 116, {
      size: 13,
      color: COLORS.foam,
      alpha: 0.85,
    });
    if (card.kind === 'level') {
      const statusText = card.beaten ? 'CLEARED' : 'NOT CLEARED';
      drawText(ctx, statusText, x + CARD_W / 2, top + 156, {
        size: 14,
        color: card.beaten ? COLORS.accent : COLORS.textDim,
      });
      fillRoundRect(ctx, x + CARD_W / 2 - 60, top + 178, 120, 34, 10, card.beaten ? 'rgba(255, 209, 102, 0.9)' : 'rgba(255, 209, 102, 0.5)');
      drawText(ctx, card.beaten ? 'REPLAY' : 'PLAY', x + CARD_W / 2, top + 195, {
        size: 15,
        color: '#10233a',
      });
      if (card.beaten) {
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.arc(x + CARD_W - 30, top + 30, 12, 0, Math.PI * 2);
        ctx.fill();
        drawText(ctx, '✓', x + CARD_W - 30, top + 31, { size: 14, color: '#10233a' });
      }
    } else {
      drawText(ctx, card.has ? 'READY TO RUN' : 'EMPTY — BUILD ONE', x + CARD_W / 2, top + 156, {
        size: 14,
        color: card.has ? COLORS.accent : COLORS.textDim,
      });
      drawText(ctx, 'OPEN THE COURSE BUILDER TO EDIT', x + CARD_W / 2, top + 188, {
        size: 11,
        color: COLORS.textDim,
      });
    }
  }

  render(ctx) {
    drawWater(ctx, W, H, this.time, WATER_PALETTE);
    drawText(ctx, 'REEF RUSH — LEVELS', W / 2, 52, {
      size: 34,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 20,
    });
    drawText(ctx, `SCROLL LEFT / RIGHT — ${beatenCount()}/${RUSH_LEVELS.length} LEVELS CLEARED — EACH CLEAR UNLOCKS A SKIN`, W / 2, 84, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.85,
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 108, W, 340);
    ctx.clip();
    const offset = W / 2 - CARD_W / 2 - this.scroll;
    const top = H * 0.32;
    for (let i = 0; i < this.cards.length; i += 1) {
      this.renderCard(ctx, this.cards[i], offset + i * (CARD_W + CARD_GAP), top, i === this.index);
    }
    ctx.restore();
    strokeRoundRect(ctx, 0, 108, W, 340, 0, 'rgba(207, 239, 255, 0.18)', 1.5);

    const dotsX = W / 2 - (this.cards.length - 1) * 9;
    for (let i = 0; i < this.cards.length; i += 1) {
      ctx.beginPath();
      ctx.arc(dotsX + i * 18, H - 60, i === this.index ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = i === this.index ? COLORS.accent : 'rgba(207, 239, 255, 0.35)';
      ctx.fill();
    }

    drawText(ctx, 'LEFT/RIGHT — SCROLL      ENTER / CLICK — PLAY      ESC — BACK', W / 2, H - 18, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.75,
    });
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, W / 2, H - 92, {
        size: 13,
        color: COLORS.danger,
        alpha: Math.min(1, this.statusTimer),
      });
    }
  }
}