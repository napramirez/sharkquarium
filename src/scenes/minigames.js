import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText } from '../engine/render.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { formatRecord } from '../engine/records.js';
import { mutatorByKey } from '../engine/mutators.js';
import { loadComposer, composerHasNotes } from '../engine/composer.js';
import { loadRushCourse, rushCourseHasItems } from '../engine/rushcourse.js';
import { currentSeason } from '../engine/season.js';
import {
  COLORS,
  COINS,
  COINS_KEY,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  MINIGAME_FEES,
  SETTINGS_KEY,
  SHOP_KEY,
  WATER_PALETTE,
} from '../config.js';

export class MinigamesScene extends Scene {
  enter() {
    this.time = 0;
    this.coins = loadJSON(COINS_KEY, COINS.starting);
    this.status = null;
    this.statusTimer = 0;
    this.shop = { passes: [], ...loadJSON(SHOP_KEY, {}) };
    this.mutator = mutatorByKey(loadJSON(SETTINGS_KEY, {}).mutator);
    const items = [];
    if (this.shop.passes.includes('playpass1') || this.shop.passes.includes('competitions')) {
      items.push({ label: 'COMPETITIONS (2P RACE)', action: 'race' });
      items.push({ label: 'RACE (1P)', action: 'raceSolo' });
      items.push({ label: 'TAG (2P + 5 CPU)', action: 'tag' });
      items.push({ label: 'TAG SOLO (1P + 5 CPU)', action: 'tagSolo' });
      items.push({ label: 'PUFFERFISH DODGEBALL (2P)', action: 'dodgeball' });
      items.push({ label: 'DODGEBALL SOLO (1P)', action: 'dodgeballSolo' });
      items.push({ label: 'LABYRINTH (2P)', action: 'labyrinth' });
      items.push({ label: 'LABYRINTH SOLO (1P)', action: 'labyrinthSolo' });
      items.push({ label: 'PUFFER BALL (2P)', action: 'pufferball', feeKey: 'pufferball' });
      items.push({ label: 'PUFFER BALL VS CPU (1P)', action: 'pufferballSolo', feeKey: 'pufferball' });
      items.push({ label: 'SCHOOL ROUNDUP (1P)', action: 'roundup', feeKey: 'roundup' });
      items.push({ label: 'JELLY ASCENT (1P)', action: 'jelly', feeKey: 'jelly' });
      items.push({ label: 'STEALTH DIVE (2P)', action: 'stealth', feeKey: 'stealth' });
      items.push({ label: 'STEALTH DIVE SOLO (1P)', action: 'stealthSolo', feeKey: 'stealth' });
      items.push({ label: 'REEF CLEANUP (2P)', action: 'cleanup', feeKey: 'cleanup' });
      items.push({ label: 'REEF CLEANUP SOLO (1P)', action: 'cleanupSolo', feeKey: 'cleanup' });
      items.push({ label: 'TRENCH DIVE (1P)', action: 'trench', feeKey: 'trench' });
      items.push({ label: 'TRENCH EXPLORE (1P)', action: 'trenchexplore', feeKey: 'trenchexplore' });
      items.push({ label: 'REEF RUSH — LEVELS', action: 'rushlevels' });
      items.push({ label: 'REEF RUSH (1P)', action: 'reefrush', feeKey: 'reefrush' });
      items.push({ label: 'REEF RUSH — MY TRACK (1P)', action: 'reefrushcustom', feeKey: 'reefrush' });
      items.push({ label: 'REEF RUSH — MY COURSE (1P)', action: 'reefrushcourse', feeKey: 'reefrush' });
      items.push({ label: 'REEF RUSH — COURSE BUILDER', action: 'rushbuilder' });
      items.push({ label: 'BOSS RUSH (1P)', action: 'bossrush', feeKey: 'bossrush' });
    }
    if (currentSeason() === 'christmas') {
      items.push({ label: 'WRAP THE PRESENTS (1P)', action: 'presentwrap', highlight: true });
      items.push({ label: "SANTA'S NET (1P)", action: 'santapeek', highlight: true });
    }
    items.push({
      label: `MUTATOR: ${this.mutator.key === 'none' ? 'OFF' : this.mutator.label}`,
      action: 'mutators',
      highlight: this.mutator.key !== 'none',
    });
    items.push({ label: 'RECORDS', action: 'records' });
    items.push({ label: 'TAG LEADERBOARD', action: 'tagboard' });
    items.push({ label: 'BACK', action: 'back' });
    this.menu = new SelectList(items, {
      glowColor: COLORS.bubble,
      accentColor: COLORS.accent,
      color: COLORS.text,
      spacing: items.length > 20 ? 21 : 24,
      fontSize: 16,
      width: 520,
      onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
      onConfirm: (item) => this.choose(item),
    });
    this.menu.reset();
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2.4;
  }

  choose(item) {
    if (item.action === 'back') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
      this.game.changeScene('menu');
      return;
    }
    if (item.action === 'records') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
      this.game.changeScene('records');
      return;
    }
    if (item.action === 'tagboard') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
      this.game.changeScene('tagboard', { from: 'minigames' });
      return;
    }
    if (item.action === 'mutators') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
      this.game.changeScene('mutators', { from: 'minigames' });
      return;
    }
    if (item.action === 'reefrushcustom' && !composerHasNotes(loadComposer())) {
      this.setStatus('NO NOTES YET — OPEN THE TRACK BUILDER');
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.22 });
      return;
    }
    if (item.action === 'rushbuilder') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
      this.game.changeScene('rushbuilder');
      return;
    }
    if (item.action === 'rushlevels') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
      this.game.changeScene('rushlevels');
      return;
    }
    if (item.action === 'presentwrap' || item.action === 'santapeek') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
      this.game.changeScene(item.action);
      return;
    }
    if (item.action === 'reefrushcourse' && !rushCourseHasItems(loadRushCourse())) {
      this.setStatus('NO COURSE YET — OPEN THE COURSE BUILDER');
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.22 });
      return;
    }
    if (item.feeKey) {
      const fee = MINIGAME_FEES[item.feeKey];
      if (this.coins < fee) {
        this.setStatus(`NEED ${fee} SEA COINS TO ENTER`);
        this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.22 });
        return;
      }
      this.coins -= fee;
      saveJSON(COINS_KEY, this.coins);
      this.setStatus(`-${fee} SEA COINS — WIN IT BACK AND MORE`);
      this.game.audio.tone({ freq: 520, endFreq: 880, type: 'triangle', duration: 0.14, volume: 0.2 });
    } else {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    }
    const mutator = this.mutator.key === 'none' ? undefined : this.mutator.key;
    if (item.action === 'race') this.game.changeScene('play', { race: true, mutator });
    else if (item.action === 'raceSolo') this.game.changeScene('play', { race: true, solo: true, mutator });
    else if (item.action === 'tag') this.game.changeScene('tag', { mutator });
    else if (item.action === 'tagSolo') this.game.changeScene('tag', { solo: true, mutator });
    else if (item.action === 'dodgeball') this.game.changeScene('dodgeball', { mutator });
    else if (item.action === 'dodgeballSolo') this.game.changeScene('dodgeball', { solo: true, mutator });
    else if (item.action === 'labyrinth') this.game.changeScene('labyrinth', { mutator });
    else if (item.action === 'labyrinthSolo') this.game.changeScene('labyrinth', { solo: true, mutator });
    else if (item.action === 'pufferball') this.game.changeScene('pufferball', { mutator });
    else if (item.action === 'pufferballSolo') this.game.changeScene('pufferball', { solo: true, mutator });
    else if (item.action === 'roundup') this.game.changeScene('roundup', { mutator });
    else if (item.action === 'jelly') this.game.changeScene('jellyascent', { mutator });
    else if (item.action === 'stealth') this.game.changeScene('stealth', { mutator });
    else if (item.action === 'stealthSolo') this.game.changeScene('stealth', { solo: true, mutator });
    else if (item.action === 'cleanup') this.game.changeScene('cleanup', { mutator });
    else if (item.action === 'cleanupSolo') this.game.changeScene('cleanup', { solo: true, mutator });
    else if (item.action === 'trench') this.game.changeScene('trench', { mutator });
    else if (item.action === 'trenchexplore') this.game.changeScene('trenchexplore', { mutator });
    else if (item.action === 'reefrush') this.game.changeScene('reefrush', { mutator });
    else if (item.action === 'reefrushcustom') this.game.changeScene('reefrush', { custom: true, mutator });
    else if (item.action === 'reefrushcourse') this.game.changeScene('reefrush', { course: true, mutator });
    else if (item.action === 'bossrush') this.game.changeScene('bossrush', { mutator });
  }

  update(dt) {
    this.time += dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('menu');
      return;
    }
    this.menu.update(dt, input);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'MINIGAMES', LOGICAL_WIDTH / 2, 44, {
      size: 32,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 20,
    });
    drawText(ctx, `SEA COINS ${this.coins}`, LOGICAL_WIDTH / 2, 76, {
      size: 15,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 10,
    });
    this.menu.render(ctx, 400, 306);
    this.renderFees(ctx);
    this.renderRecords(ctx);
    if (this.status && this.statusTimer > 0) {
      drawText(ctx, this.status, LOGICAL_WIDTH - 90, 76, {
        size: 12,
        color: COLORS.accent,
        align: 'right',
        alpha: Math.min(1, this.statusTimer),
      });
    }
    drawText(
      ctx,
      'PAID GAMES CHARGE A TICKET AT THE DOOR — EVERY ENTRY — WIN BONUSES PAY IT BACK',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 26,
      { size: 12, color: COLORS.textDim, alpha: 0.8 },
    );
    drawText(
      ctx,
      'P1 — WASD   P2 — ARROWS   SOLO — WASD   DIFFICULTY SCALES EVERY GAME   ESC — BACK',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 10,
      { size: 11, color: COLORS.textDim, alpha: 0.7 },
    );
  }

  renderFees(ctx) {
    const rows = this.menu.items.length;
    const top = 306 - ((rows - 1) * this.menu.spacing) / 2;
    this.menu.items.forEach((item, index) => {
      if (!item.feeKey) return;
      const fee = MINIGAME_FEES[item.feeKey];
      drawText(ctx, `${fee} COINS`, 640, top + this.menu.spacing * index, {
        size: 12,
        color: this.coins >= fee ? COLORS.accent : COLORS.danger,
        align: 'left',
        alpha: 0.9,
      });
    });
  }

  renderRecords(ctx) {
    const rows = this.menu.items.length;
    const top = 306 - ((rows - 1) * this.menu.spacing) / 2;
    this.menu.items.forEach((item, index) => {
      const mode = item.action === 'jelly' ? 'jellyascent' : item.action;
      const rec = formatRecord(mode);
      if (rec === 'NO RECORD') return;
      drawText(ctx, rec, 136, top + this.menu.spacing * index, {
        size: 12,
        color: COLORS.bubble,
        align: 'right',
        alpha: 0.85,
      });
    });
  }
}
