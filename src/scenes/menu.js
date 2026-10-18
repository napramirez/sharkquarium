import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { Bubble } from '../entities/bubble.js';
import { Shark } from '../entities/shark.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { loadJSON } from '../engine/storage.js';
import { rand } from '../engine/math.js';
import {
  GAME_TITLE,
  TAGLINE,
  STATS_KEY,
  STORAGE_KEY,
  COLORS,
  WATER_PALETTE,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const IDLE_INPUT = { isDown: () => false, pointer: { down: false, dragX: 0, dragY: 0 } };

export class MenuScene extends Scene {
  enter() {
    this.time = 0;
    this.showHelp = false;
    this.best = loadJSON(STORAGE_KEY, 0);
    this.stats = { games: 0, bubbles: 0, longestRun: 0, ...loadJSON(STATS_KEY, {}) };
    this.bubbles = [];
    this.spawnTimer = 0.3;
    this.shark = new Shark(LOGICAL_WIDTH * 0.5, LOGICAL_HEIGHT * 0.72);
    this.menu = new SelectList(
      [
        { label: 'START DIVE', action: 'play' },
        { label: 'CHOOSE TANK', action: 'tanks' },
        { label: 'CO-OP DIVE (2P)', action: 'coop' },
        { label: 'SETTINGS', action: 'settings' },
        { label: 'HOW TO PLAY', action: 'help' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 42,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.choose(item.action),
      },
    );
    this.menu.reset();
  }

  choose(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'play') this.game.changeScene('play');
    else if (action === 'tanks') this.game.changeScene('tanks');
    else if (action === 'coop') this.game.changeScene('play', { coop: true });
    else if (action === 'settings') this.game.changeScene('settings');
    else if (action === 'help') this.showHelp = true;
  }

  update(dt) {
    this.time += dt;
    this.updateAmbient(dt);
    const input = this.game.input;
    if (this.showHelp) {
      if (input.wasPressed('confirm') || input.wasPressed('back')) {
        this.game.audio.tone({ freq: 520, endFreq: 320, duration: 0.1, volume: 0.15 });
        this.showHelp = false;
      }
      return;
    }
    this.menu.update(dt, input);
  }

  updateAmbient(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(0.22, 0.6);
      this.bubbles.push(
        new Bubble(rand(40, LOGICAL_WIDTH - 40), LOGICAL_HEIGHT + 24, { rise: rand(28, 62) }),
      );
    }
    this.bubbles = this.bubbles.filter((bubble) => {
      bubble.update(dt);
      return bubble.y > -30;
    });
    const drift = this.time * 0.7;
    this.shark.update(dt, IDLE_INPUT);
    this.shark.x = LOGICAL_WIDTH * 0.5 + Math.sin(drift) * LOGICAL_WIDTH * 0.24;
    this.shark.y = LOGICAL_HEIGHT * 0.2 + Math.sin(drift * 2.3) * 26;
    this.shark.vx = Math.cos(drift) * 96;
    this.shark.vy = Math.sin(drift * 2.3) * 46;
    this.shark.heading = Math.atan2(this.shark.vy, this.shark.vx);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    for (const bubble of this.bubbles) bubble.render(ctx);
    ctx.save();
    ctx.globalAlpha = 0.4;
    this.shark.render(ctx);
    ctx.restore();

    const titleY = LOGICAL_HEIGHT * 0.2 + Math.sin(this.time * 1.6) * 4;
    drawText(ctx, GAME_TITLE, LOGICAL_WIDTH / 2, titleY, {
      size: 56,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 26,
    });
    drawText(ctx, TAGLINE, LOGICAL_WIDTH / 2, titleY + 40, {
      size: 14,
      color: COLORS.foam,
      alpha: 0.85,
    });

    const story = [
      'The aquarium has closed for the night and the halls have gone dark.',
      'You are the resident shark, sneaking one last lap before lights-out —',
      'and if you gather enough bubbles, the tanks will pull you somewhere stranger.',
    ];
    story.forEach((line, index) => {
      drawText(ctx, line, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.33 + index * 20, {
        size: 13,
        weight: 400,
        color: COLORS.foam,
        alpha: 0.8,
      });
    });

    this.menu.render(ctx, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.62);

    drawText(ctx, this.best > 0 ? `BEST ${this.best}` : 'NO SCORE YET', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.83, {
      size: 16,
      color: COLORS.accent,
      alpha: 0.85,
    });
    if (this.stats.games > 0) {
      drawText(
        ctx,
        `${this.stats.games} DIVES — ${this.stats.bubbles} BUBBLES — LONGEST ${Math.round(this.stats.longestRun)}s`,
        LOGICAL_WIDTH / 2,
        LOGICAL_HEIGHT * 0.87,
        {
          size: 13,
          color: COLORS.textDim,
        },
      );
    }
    drawText(
      ctx,
      'UP/DOWN — SELECT      ENTER — CONFIRM      MOVE — WASD / ARROWS      ESC — PAUSE',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 26,
      {
        size: 12,
        color: COLORS.textDim,
      },
    );

    if (this.showHelp) this.renderHelp(ctx);
  }

  renderHelp(ctx) {
    ctx.fillStyle = 'rgba(4, 16, 29, 0.68)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    const width = 560;
    const height = 340;
    const x = (LOGICAL_WIDTH - width) / 2;
    const y = (LOGICAL_HEIGHT - height) / 2;
    fillRoundRect(ctx, x, y, width, height, 24, 'rgba(10, 39, 64, 0.95)');
    strokeRoundRect(ctx, x, y, width, height, 24, 'rgba(207, 239, 255, 0.3)', 2);
    drawText(ctx, 'HOW TO PLAY', LOGICAL_WIDTH / 2, y + 52, {
      size: 30,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.45)',
    });
    const lines = [
      'MOVE — WASD / ARROWS (CO-OP: P1 AND P2 SHARE ONE CREATURE)',
      'COLLECT BUBBLES — +1 SCORE, +1.25 SECONDS',
      'AVOID JELLYFISH — -3 SECONDS',
      'PAUSE — ESC',
      'AT 60 POINTS — TELEPORT TO THE STINGRAY TANK',
    ];
    lines.forEach((line, index) => {
      drawText(ctx, line, LOGICAL_WIDTH / 2, y + 118 + index * 36, {
        size: 16,
        weight: 400,
        color: COLORS.text,
        alpha: 0.85,
      });
    });
    drawText(ctx, 'ENTER OR ESC — CLOSE', LOGICAL_WIDTH / 2, y + height - 38, {
      size: 14,
      color: COLORS.foam,
      alpha: 0.55 + 0.45 * Math.sin(this.time * 4),
    });
  }
}
