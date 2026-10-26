import { Scene } from './scene.js';
import { SelectList } from './selectlist.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from './render.js';
import { rand } from './math.js';
import { ParticleSystem } from './particles.js';
import { loadJSON } from './storage.js';
import { recordMinigame } from './progress.js';
import { applyWardrobe } from './wardrobe.js';
import { drawSkinAura, setSkinClock } from './skin.js';
import { drawTrail } from './trail.js';
import { drawCompanion } from './companion.js';
import { Shark } from '../entities/shark.js';
import {
  CONTROLS,
  DIFFICULTY,
  SETTINGS_KEY,
  SHOP_KEY,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  WATER_PALETTE,
} from '../config.js';

export class MinigameScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.solo = Boolean(params.solo);
    this.difficultyKey = loadJSON(SETTINGS_KEY, {}).difficulty ?? 'normal';
    this.rules = DIFFICULTY[this.difficultyKey] ?? DIFFICULTY.normal;
    this.shop = loadJSON(SHOP_KEY, {});
    this.resultsMenu = new SelectList(
      [
        { label: 'PLAY AGAIN', action: 'again' },
        { label: 'MINIGAMES', action: 'minigames' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 46,
        fontSize: 20,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.chooseResult(item.action),
      },
    );
    this.resetRound();
  }

  resetRound() {
    this.beginRound();
    this.buildRound();
  }

  beginRound() {
    this.phase = 'play';
    this.elapsed = 0;
    this.won = false;
    this.reward = 0;
    this.flash = 0;
    this.shake = 0;
    this.particles = new ParticleSystem();
  }

  buildRound() {}

  updateRound(dt, input) {}

  renderRound(ctx) {}

  renderHud(ctx) {}

  resultsTitle() {
    return 'RESULTS';
  }

  resultsHeadline() {
    return this.won ? 'WIN!' : 'SO CLOSE';
  }

  resultsDetail() {
    return '';
  }

  spawnSharks(positions) {
    this.players = [
      new Shark(positions[0].x, positions[0].y, { controls: CONTROLS.p1, pointer: true }),
    ];
    if (!this.solo) {
      this.players.push(
        new Shark(positions[1].x, positions[1].y, { controls: CONTROLS.p2, pointer: false }),
      );
    }
  }

  updatePlayers(dt, input) {
    for (const player of this.players) player.update(dt, input);
  }

  finish(won) {
    this.phase = 'results';
    this.won = won;
    this.reward = recordMinigame(won);
    this.resultsMenu.reset();
    this.game.audio.tone({ freq: 220, endFreq: 110, type: 'triangle', duration: 0.3, volume: 0.24 });
    this.game.audio.tone({ freq: 165, type: 'triangle', duration: 0.5, volume: 0.24, delay: 0.24 });
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('minigames');
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('minigames');
      return;
    }
    if (this.phase === 'results') {
      this.resultsMenu.update(dt, input);
      return;
    }
    this.elapsed += dt;
    this.updateRound(dt, input);
    this.particles.update(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);
  }

  render(ctx) {
    setSkinClock(this.time);
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 7 * this.shake, rand(-1, 1) * 7 * this.shake);
    }
    this.renderRound(ctx);
    ctx.restore();
    this.renderHud(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.phase === 'results') this.renderResults(ctx);
  }

  renderPlayers(ctx) {
    for (let index = 0; index < this.players.length; index += 1) {
      applyWardrobe(this.shop, index);
      const player = this.players[index];
      player.render(ctx);
      drawSkinAura(ctx, player);
      drawTrail(ctx, player);
      drawCompanion(ctx, player);
    }
  }

  renderResults(ctx) {
    fillRoundRect(ctx, 250, 90, 460, 330, 26, 'rgba(10, 39, 64, 0.94)');
    strokeRoundRect(ctx, 250, 90, 460, 330, 26, 'rgba(207, 239, 255, 0.3)', 2);
    drawText(ctx, this.resultsTitle(), LOGICAL_WIDTH / 2, 140, {
      size: 32,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.5)',
      glowBlur: 18,
    });
    drawText(ctx, this.resultsHeadline(), LOGICAL_WIDTH / 2, 188, {
      size: 22,
      color: this.won ? COLORS.accent : COLORS.danger,
      alpha: 0.75 + 0.25 * Math.sin(this.time * 7),
    });
    const detail = this.resultsDetail();
    if (detail) {
      drawText(ctx, detail, LOGICAL_WIDTH / 2, 228, {
        size: 14,
        color: COLORS.text,
        alpha: 0.85,
      });
    }
    drawText(
      ctx,
      this.reward > 0 ? `+${this.reward} SEA COINS` : 'NO WIN BONUS — TRY AGAIN',
      LOGICAL_WIDTH / 2,
      264,
      { size: 12, color: this.reward > 0 ? COLORS.accent : COLORS.textDim, alpha: 0.85 },
    );
    this.resultsMenu.render(ctx, LOGICAL_WIDTH / 2, 340);
  }
}
