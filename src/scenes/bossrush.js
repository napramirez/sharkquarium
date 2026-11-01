import { MinigameScene } from '../engine/minigame.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { recordWin, formatTime } from '../engine/records.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { QuietScene } from './quiet.js';
import { WatcherScene } from './watcher.js';
import { MouthScene } from './mouth.js';
import { TrenchExploreScene } from './trenchexplore.js';
import { PrehistoricScene } from './prehistoric.js';
import {
  BOSS_RUSH,
  COINS,
  COINS_KEY,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  WATER_PALETTE,
} from '../config.js';

const CHILD_SCENES = {
  quiet: QuietScene,
  watcher: WatcherScene,
  mouth: MouthScene,
  trenchexplore: TrenchExploreScene,
  prehistoric: PrehistoricScene,
};

export class BossRushScene extends MinigameScene {
  enter(params = {}) {
    super.enter({ ...params, solo: true });
    this.roster = BOSS_RUSH.roster;
    this.waveIndex = 0;
    this.cleared = [];
    this.rushTime = 0;
    this.current = null;
    this.phase = 'interlude';
    this.interludeTimer = BOSS_RUSH.interlude;
    this.won = false;
    this.reward = 0;
    this.waveBanner = 0;
  }

  childFor(entry) {
    const SceneClass = CHILD_SCENES[entry.scene];
    if (!SceneClass) return null;
    return new SceneClass();
  }

  beginWave() {
    const entry = this.roster[this.waveIndex];
    const child = this.childFor(entry);
    child.game = this.game;
    child.name = entry.scene;
    child.rushMode = true;
    if (child.setMutator) child.setMutator(this.mutator ? this.mutator.key : undefined);
    child.enter({ ...entry.params, solo: true });
    if (child.rushStart) child.rushStart();
    this.current = child;
    this.phase = 'play';
    this.waveBanner = 2.6;
  }

  finishWave(won) {
    const entry = this.roster[this.waveIndex];
    this.cleared.push({ label: entry.label, won });
    if (this.current && this.current.exit) this.current.exit();
    this.current = null;
    if (!won) {
      this.endRush(false);
      return;
    }
    if (this.waveIndex >= this.roster.length - 1) {
      this.endRush(true);
      return;
    }
    this.waveIndex += 1;
    this.phase = 'interlude';
    this.interludeTimer = BOSS_RUSH.interlude;
  }

  endRush(won) {
    this.won = won;
    this.phase = 'results';
    let coins = BOSS_RUSH.rewardPerClear * this.cleared.length;
    if (won) coins += BOSS_RUSH.rewardFull;
    coins = Math.round(coins * (this.mutator ? this.mutator.coinMult : 1));
    this.reward = coins;
    saveJSON(COINS_KEY, loadJSON(COINS_KEY, COINS.starting) + coins);
    this.newRecord = won ? recordWin('bossrush', { time: this.rushTime }) : null;
    this.resultsMenu.reset();
    this.game.audio.tone({
      freq: won ? 523 : 120,
      endFreq: won ? 784 : 60,
      type: 'triangle',
      duration: 0.4,
      volume: 0.24,
    });
  }

  abortRush() {
    if (this.current && this.current.exit) this.current.exit();
    this.current = null;
    this.game.changeScene('minigames');
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (this.phase === 'results') {
      this.resultsMenu.update(dt, input);
      return;
    }
    if (input.wasPressed('back')) {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
      this.abortRush();
      return;
    }
    this.waveBanner = Math.max(0, this.waveBanner - dt);
    if (this.phase === 'interlude') {
      this.interludeTimer -= dt;
      if (this.interludeTimer <= 0) this.beginWave();
      return;
    }
    if (!this.current) {
      this.beginWave();
      return;
    }
    this.rushTime += dt;
    this.current.update(dt);
    if (this.game.pending) {
      this.game.pending = null;
      this.abortRush();
      return;
    }
    if (this.current.phase === 'results') this.finishWave(Boolean(this.current.won));
  }

  renderInterlude(ctx) {
    ctx.fillStyle = 'rgba(4, 10, 18, 0.62)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    const next = this.roster[this.waveIndex];
    drawText(ctx, `WAVE ${this.waveIndex + 1} / ${this.roster.length}`, LOGICAL_WIDTH / 2, 190, {
      size: 20,
      color: COLORS.textDim,
    });
    drawText(ctx, next.label, LOGICAL_WIDTH / 2, 240, {
      size: 44,
      color: COLORS.danger,
      glow: 'rgba(255, 107, 129, 0.5)',
      glowBlur: 22,
    });
    drawText(ctx, next.blurb, LOGICAL_WIDTH / 2, 288, {
      size: 14,
      color: COLORS.text,
      alpha: 0.85,
    });
    drawText(ctx, `CLEARED ${this.cleared.length} · ${formatTime(this.rushTime)}`, LOGICAL_WIDTH / 2, 340, {
      size: 14,
      color: COLORS.accent,
      alpha: 0.9,
    });
    drawText(ctx, `GET READY...`, LOGICAL_WIDTH / 2, 392, {
      size: 14,
      color: COLORS.accent,
      alpha: 0.6 + 0.4 * Math.sin(this.time * 6),
    });
  }

  renderPlay(ctx) {
    if (this.current) this.current.render(ctx);
    fillRoundRect(ctx, 300, 12, 360, 26, 13, 'rgba(10, 39, 64, 0.7)');
    drawText(ctx, `BOSS RUSH ${this.waveIndex + 1}/${this.roster.length} — ${formatTime(this.rushTime)}`, LOGICAL_WIDTH / 2, 12, {
      size: 13,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.35)',
      glowBlur: 8,
    });
    if (this.waveBanner > 0) {
      drawText(ctx, this.roster[this.waveIndex].label, LOGICAL_WIDTH / 2, 96, {
        size: 30,
        color: COLORS.danger,
        glow: 'rgba(255, 107, 129, 0.5)',
        glowBlur: 18,
        alpha: Math.min(1, this.waveBanner),
      });
    }
  }

  resultsTitle() {
    return 'BOSS RUSH';
  }

  resultsHeadline() {
    return this.won ? 'GAUNTLET CLEARED' : 'THE RUSH ENDS';
  }

  resultsDetail() {
    const lines = this.cleared.map((entry) => `${entry.won ? '✓' : '✗'} ${entry.label}`).join('   ');
    return `${lines}   —   ${formatTime(this.rushTime)}`;
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    if (this.phase === 'results') {
      this.renderResults(ctx);
      return;
    }
    if (this.phase === 'interlude') {
      this.renderInterlude(ctx);
      return;
    }
    this.renderPlay(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') {
      this.enter({});
    } else {
      this.game.changeScene('minigames');
    }
  }

  backScene() {
    return 'minigames';
  }

  renderMutatorOverlay(ctx) {
    if (!this.mutator || this.mutator.key === 'none') return;
    drawText(ctx, `MUTATOR ${this.mutator.label} · x${this.mutator.scoreMult}`, 16, LOGICAL_HEIGHT - 14, {
      size: 12,
      color: COLORS.accent,
      align: 'left',
      alpha: 0.9,
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 8,
    });
  }
}
