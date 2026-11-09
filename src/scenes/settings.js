import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillCircle, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { clamp } from '../engine/math.js';
import { setReducedMotion } from '../engine/motion.js';
import { setSeason, SEASONS } from '../engine/season.js';
import { set8Bit } from '../engine/retro.js';
import { setMeme } from '../engine/meme.js';
import {
  AUDIO,
  COLORS,
  DIFFICULTY,
  DIFFICULTY_ORDER,
  SETTINGS_KEY,
  WATER_PALETTE,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const CONTROLS_X = LOGICAL_WIDTH / 2 + 160;
const TRACK_WIDTH = 120;
const PILL_MIN_WIDTH = 62;
const PILL_GAP = 4;
const PILL_HEIGHT = 30;

export class SettingsScene extends Scene {
  enter() {
    this.time = 0;
    const saved = loadJSON(SETTINGS_KEY, {});
    const savedSeason =
      saved.season ?? (saved.christmas ? 'christmas' : 'none');
    this.settings = {
      coopTankSelect: false,
      difficulty: 'normal',
      volume: AUDIO.volume,
      sfx: true,
      threeD: false,
      firstPerson: false,
      reduceMotion: false,
      season: 'none',
      christmas: false,
      halloween: false,
      newyear: false,
      eightBit: false,
      meme: false,
      ...saved,
    };
    this.settings.season = saved.season !== undefined
      ? SEASONS.includes(saved.season)
        ? saved.season
        : 'none'
      : savedSeason;
    this.settings.christmas = this.settings.season === 'christmas';
    this.settings.halloween = this.settings.season === 'halloween';
    this.settings.newyear = this.settings.season === 'newyear';
    this.game.set3D(this.settings.threeD);
    this.game.setFirstPerson(this.settings.firstPerson);
    setReducedMotion(this.settings.reduceMotion);
    setSeason(this.settings.season);
    set8Bit(this.settings.eightBit);
    setMeme(this.settings.meme);
    this.menu = new SelectList(
      [
        { label: 'CO-OP TANK SELECT', action: 'coopTankSelect' },
        { label: 'DIFFICULTY', action: 'difficulty' },
        { label: 'VOLUME', action: 'volume' },
        { label: 'SFX', action: 'sfx' },
        { label: '3D MODE', action: 'threeD' },
        { label: 'FIRST PERSON MODE', action: 'firstPerson' },
        { label: 'REDUCE MOTION', action: 'reduceMotion' },
        { label: 'CHRISTMAS MODE', action: 'christmas' },
        { label: 'HALLOWEEN MODE', action: 'halloween' },
        { label: 'NEW YEAR MODE', action: 'newyear' },
        { label: '8-BIT MODE', action: 'eightBit' },
        { label: 'MEME MODE', action: 'meme' },
        { label: 'TRACK PLAYER', action: 'tracks' },
        { label: 'CUTSCENE THEATRE', action: 'theatre' },
        { label: 'BACK', action: 'back' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 27,
        fontSize: 17,
        width: 480,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.choose(item),
      },
    );
    this.menu.reset();
  }

  setDifficulty(key) {
    if (!DIFFICULTY[key] || this.settings.difficulty === key) return;
    this.settings.difficulty = key;
    saveJSON(SETTINGS_KEY, this.settings);
    this.game.audio.tone({ freq: 420 + DIFFICULTY_ORDER.indexOf(key) * 140, duration: 0.08, volume: 0.18 });
  }

  cycleDifficulty(step) {
    const index = DIFFICULTY_ORDER.indexOf(this.settings.difficulty);
    const next = (index + step + DIFFICULTY_ORDER.length) % DIFFICULTY_ORDER.length;
    this.setDifficulty(DIFFICULTY_ORDER[next]);
  }

  difficultyPills() {
    let offset = 0;
    const pills = DIFFICULTY_ORDER.map((key) => {
      const label = DIFFICULTY[key].label;
      const width = Math.max(PILL_MIN_WIDTH, label.length * 7.2 + 16);
      const pill = { key, label, x: offset, width };
      offset += width + PILL_GAP;
      return pill;
    });
    const startX = LOGICAL_WIDTH - 48 - (offset - PILL_GAP);
    return pills.map((pill) => ({ ...pill, x: pill.x + startX }));
  }

  adjustVolume(delta) {
    const next = Math.round(clamp(this.settings.volume + delta, 0, 1) * 10) / 10;
    if (next === this.settings.volume) return;
    this.settings.volume = next;
    this.game.audio.setVolume(next);
    this.game.audio.tone({ freq: 480 + next * 320, duration: 0.05, volume: 0.15 });
    saveJSON(SETTINGS_KEY, this.settings);
  }

  toggleSeason(key) {
    const next = this.settings.season === key ? 'none' : key;
    this.settings.season = next;
    this.settings.christmas = next === 'christmas';
    this.settings.halloween = next === 'halloween';
    this.settings.newyear = next === 'newyear';
    setSeason(next);
    if (this.game.music) this.game.music.refresh();
    saveJSON(SETTINGS_KEY, this.settings);
    this.game.audio.tone({
      freq: next === 'none' ? 320 : 880,
      endFreq: next === 'none' ? 300 : 1180,
      type: 'triangle',
      duration: 0.18,
      volume: 0.2,
    });
  }

  choose(item) {
    if (item.action === 'back') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('menu');
      return;
    }
    if (item.action === 'tracks') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('tracks');
      return;
    }
    if (item.action === 'theatre') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('theatre');
      return;
    }
    if (item.action === 'coopTankSelect') {
      this.settings.coopTankSelect = !this.settings.coopTankSelect;
      saveJSON(SETTINGS_KEY, this.settings);
      this.game.audio.tone({
        freq: this.settings.coopTankSelect ? 620 : 320,
        duration: 0.08,
        volume: 0.18,
      });
      return;
    }
    if (item.action === 'sfx') {
      const next = !this.settings.sfx;
      if (!next) this.game.audio.tone({ freq: 520, endFreq: 300, duration: 0.1, volume: 0.18 });
      this.settings.sfx = next;
      this.game.audio.setSfxEnabled(next);
      if (next) this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      saveJSON(SETTINGS_KEY, this.settings);
      return;
    }
    if (item.action === 'threeD') {
      this.settings.threeD = !this.settings.threeD;
      this.game.set3D(this.settings.threeD);
      saveJSON(SETTINGS_KEY, this.settings);
      this.game.audio.tone({
        freq: this.settings.threeD ? 620 : 320,
        duration: 0.1,
        volume: 0.18,
      });
      return;
    }
    if (item.action === 'firstPerson') {
      this.settings.firstPerson = !this.settings.firstPerson;
      this.game.setFirstPerson(this.settings.firstPerson);
      saveJSON(SETTINGS_KEY, this.settings);
      this.game.audio.tone({
        freq: this.settings.firstPerson ? 620 : 320,
        duration: 0.1,
        volume: 0.18,
      });
      return;
    }
    if (item.action === 'reduceMotion') {
      this.settings.reduceMotion = !this.settings.reduceMotion;
      setReducedMotion(this.settings.reduceMotion);
      saveJSON(SETTINGS_KEY, this.settings);
      this.game.audio.tone({
        freq: this.settings.reduceMotion ? 320 : 620,
        duration: 0.1,
        volume: 0.18,
      });
      return;
    }
    if (item.action === 'christmas' || item.action === 'halloween' || item.action === 'newyear') {
      this.toggleSeason(item.action);
      return;
    }
    if (item.action === 'eightBit') {
      this.settings.eightBit = !this.settings.eightBit;
      set8Bit(this.settings.eightBit);
      if (this.game.audio) this.game.audio.applyRetro();
      saveJSON(SETTINGS_KEY, this.settings);
      this.game.audio.tone({
        freq: this.settings.eightBit ? 990 : 330,
        endFreq: this.settings.eightBit ? 1320 : 300,
        type: 'square',
        duration: 0.14,
        volume: 0.2,
      });
      return;
    }
    if (item.action === 'meme') {
      this.settings.meme = !this.settings.meme;
      setMeme(this.settings.meme);
      saveJSON(SETTINGS_KEY, this.settings);
      this.game.audio.tone({
        freq: this.settings.meme ? 880 : 300,
        endFreq: this.settings.meme ? 1320 : 180,
        type: 'square',
        duration: 0.12,
        volume: 0.2,
      });
      return;
    }
    if (item.action === 'difficulty') {
      const pointer = this.game.input.pointer;
      if (pointer.down) {
        const pill = this.difficultyPills().find(
          (entry) => pointer.x >= entry.x && pointer.x <= entry.x + entry.width,
        );
        if (pill) this.setDifficulty(pill.key);
      } else {
        this.cycleDifficulty(1);
      }
      return;
    }
    if (item.action === 'volume') {
      const pointer = this.game.input.pointer;
      if (pointer.down) {
        const target = clamp(
          (pointer.x - (CONTROLS_X - TRACK_WIDTH / 2)) / TRACK_WIDTH,
          0,
          1,
        );
        this.adjustVolume(Math.round(target * 10) / 10 - this.settings.volume);
      } else {
        this.adjustVolume(this.settings.volume >= 0.95 ? -1 : 0.1);
      }
    }
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('menu');
      return;
    }
    const selected = this.menu.selected;
    if (selected && selected.action === 'volume') {
      if (input.wasPressed('left')) this.adjustVolume(-0.1);
      if (input.wasPressed('right')) this.adjustVolume(0.1);
    }
    if (selected && selected.action === 'difficulty') {
      if (input.wasPressed('left')) this.cycleDifficulty(-1);
      if (input.wasPressed('right')) this.cycleDifficulty(1);
    }
    const pointer = input.pointer;
    if (pointer.down && input.wasPressed('confirm')) {
      const index = this.menu.items.findIndex((item) => item.action === 'difficulty');
      const bounds = this.menu.bounds[index];
      if (bounds && pointer.y >= bounds.y && pointer.y <= bounds.y + bounds.height) {
        const pill = this.difficultyPills().find(
          (entry) => pointer.x >= entry.x && pointer.x <= entry.x + entry.width,
        );
        if (pill) this.menu.setIndex(index, false);
      }
    }
    this.menu.update(dt, input);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'SETTINGS', LOGICAL_WIDTH / 2, 78, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    const help = {
      coopTankSelect: 'START TANK-SELECT DIVES WITH TWO PLAYERS',
      difficulty: 'SCALES ENEMY SPEED, SPAWNS, PENALTIES, AND THE CLOCK',
      volume: 'MASTER AUDIO VOLUME',
      sfx: 'SOUND EFFECTS ON / OFF',
      threeD: 'TILT THE WHOLE TANK ONTO A PERSPECTIVE PLANE',
      firstPerson: 'THE MOUSE LOOKS AROUND A CLOSE-UP VIEW',
      reduceMotion: 'DAMP THE HORROR TANKS\u2019 SHAKE, ZOOM, AND FLASH',
      christmas: 'CAROL THEMES AND SLOW SINKING SNOWFLAKES',
      halloween: 'EERIE THEMES AND DRIFTING AUTUMN LEAVES',
      newyear: 'PARTY THEMES AND FALLING CONFETTI',
      eightBit: 'PIXELATED 8-BIT LOOK AND CHIPTUNE SOUND',
      meme: 'SILLY COMIC POP-UPS AND CAPTIONS EVERYWHERE',
      tracks: 'PLAY ANY LEVEL THEME',
      theatre: 'REPLAY ANY CUTSCENE',
      back: 'RETURN TO THE MENU',
    };
    const selected = this.menu.selected;
    drawText(ctx, (selected && help[selected.action]) || '', LOGICAL_WIDTH / 2, 122, {
      size: 13,
      color: COLORS.foam,
      alpha: 0.85,
    });

    const centerY = LOGICAL_HEIGHT * 0.58;
    this.menu.render(ctx, LOGICAL_WIDTH / 2, centerY);
    const top = centerY - ((this.menu.items.length - 1) * this.menu.spacing) / 2;
    this.renderSwitch(ctx, CONTROLS_X, top, this.settings.coopTankSelect);
    this.renderDifficulty(ctx, CONTROLS_X, top + this.menu.spacing, this.settings.difficulty);
    this.renderSlider(ctx, CONTROLS_X, top + this.menu.spacing * 2, this.settings.volume);
    this.renderSwitch(ctx, CONTROLS_X, top + this.menu.spacing * 3, this.settings.sfx);
    this.renderSwitch(ctx, CONTROLS_X, top + this.menu.spacing * 4, this.settings.threeD);
    this.renderSwitch(ctx, CONTROLS_X, top + this.menu.spacing * 5, this.settings.firstPerson);
    this.renderSwitch(ctx, CONTROLS_X, top + this.menu.spacing * 6, this.settings.reduceMotion);
    this.renderSwitch(ctx, CONTROLS_X, top + this.menu.spacing * 7, this.settings.christmas);
    this.renderSwitch(ctx, CONTROLS_X, top + this.menu.spacing * 8, this.settings.halloween);
    this.renderSwitch(ctx, CONTROLS_X, top + this.menu.spacing * 9, this.settings.newyear);
    this.renderSwitch(ctx, CONTROLS_X, top + this.menu.spacing * 10, this.settings.eightBit);
    this.renderSwitch(ctx, CONTROLS_X, top + this.menu.spacing * 11, this.settings.meme);
    drawText(ctx, 'OPEN', CONTROLS_X, top + this.menu.spacing * 13, {
      size: 13,
      color: COLORS.textDim,
      alpha: 0.85,
    });
    drawText(ctx, 'OPEN', CONTROLS_X, top + this.menu.spacing * 12, {
      size: 13,
      color: COLORS.textDim,
      alpha: 0.85,
    });

    drawText(
      ctx,
      'ENTER — TOGGLE/CYCLE      LEFT/RIGHT — ADJUST      ESC — BACK',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 26,
      {
        size: 12,
        color: COLORS.textDim,
      },
    );
  }

  renderDifficulty(ctx, x, y, current) {
    for (const pill of this.difficultyPills()) {
      const active = pill.key === current;
      fillRoundRect(
        ctx,
        pill.x,
        y - PILL_HEIGHT / 2,
        pill.width,
        PILL_HEIGHT,
        PILL_HEIGHT / 2,
        active ? 'rgba(255, 209, 102, 0.9)' : 'rgba(10, 39, 64, 0.9)',
      );
      strokeRoundRect(
        ctx,
        pill.x,
        y - PILL_HEIGHT / 2,
        pill.width,
        PILL_HEIGHT,
        PILL_HEIGHT / 2,
        'rgba(207, 239, 255, 0.4)',
        1.5,
      );
      drawText(ctx, pill.label, pill.x + pill.width / 2, y, {
        size: 12,
        weight: 700,
        color: active ? '#10233a' : COLORS.textDim,
      });
    }
  }

  renderSwitch(ctx, x, y, on) {
    const width = 58;
    const height = 28;
    fillRoundRect(
      ctx,
      x - width / 2,
      y - height / 2,
      width,
      height,
      height / 2,
      on ? 'rgba(255, 209, 102, 0.9)' : 'rgba(10, 39, 64, 0.9)',
    );
    strokeRoundRect(
      ctx,
      x - width / 2,
      y - height / 2,
      width,
      height,
      height / 2,
      'rgba(207, 239, 255, 0.4)',
      1.5,
    );
    const knobX = on ? x + width / 2 - height / 2 : x - width / 2 + height / 2;
    fillCircle(ctx, knobX, y, height / 2 - 4, '#ffffff');
  }

  renderSlider(ctx, x, y, value) {
    const height = 10;
    const left = x - TRACK_WIDTH / 2;
    fillRoundRect(ctx, left, y - height / 2, TRACK_WIDTH, height, height / 2, 'rgba(10, 39, 64, 0.9)');
    if (value > 0.01) {
      fillRoundRect(
        ctx,
        left,
        y - height / 2,
        TRACK_WIDTH * value,
        height,
        height / 2,
        'rgba(255, 209, 102, 0.9)',
      );
    }
    strokeRoundRect(
      ctx,
      left,
      y - height / 2,
      TRACK_WIDTH,
      height,
      height / 2,
      'rgba(207, 239, 255, 0.4)',
      1.5,
    );
    fillCircle(ctx, left + TRACK_WIDTH * value, y, 9, '#ffffff');
    drawText(ctx, `${Math.round(value * 100)}%`, x, y + 20, {
      size: 12,
      color: COLORS.textDim,
    });
  }
}
