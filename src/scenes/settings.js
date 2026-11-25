import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillCircle, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { clamp } from '../engine/math.js';
import { setCute } from '../engine/cute.js';
import { setShakeEnabled, setFlashEnabled, setReducedMotion } from '../engine/motion.js';
import { setColorblind } from '../engine/colorblind.js';
import { setSeason, SEASONS } from '../engine/season.js';
import { set8Bit } from '../engine/retro.js';
import { setMeme } from '../engine/meme.js';
import { setActiveSkin, skinByKey } from '../engine/skin.js';
import { setMobilite, setMobiliteScale, setMobiliteThumb } from '../engine/mobilite.js';
import {
  AUDIO,
  COLORS,
  DIFFICULTY,
  DIFFICULTY_ORDER,
  SETTINGS_KEY,
  SHOP_KEY,
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
      music: true,
      musicVolume: 1,
      threeD: false,
      firstPerson: false,
      cute: false,
      shake: true,
      flash: true,
      reduceMotion: false,
      season: 'none',
      spring: false,
      summer: false,
      christmas: false,
      halloween: false,
      newyear: false,
      eightBit: false,
      meme: false,
      mobilite: false,
      mobiliteThumb: false,
      mobiliteBig: false,
      colorblind: false,
      ...saved,
    };
    if (this.settings.cute === undefined) this.settings.cute = Boolean(saved.reduceMotion);
    this.settings.season = saved.season !== undefined
      ? SEASONS.includes(saved.season)
        ? saved.season
        : 'none'
      : savedSeason;
    this.settings.spring = this.settings.season === 'spring';
    this.settings.summer = this.settings.season === 'summer';
    this.settings.christmas = this.settings.season === 'christmas';
    this.settings.halloween = this.settings.season === 'halloween';
    this.settings.newyear = this.settings.season === 'newyear';
    this.game.set3D(this.settings.threeD);
    this.game.setFirstPerson(this.settings.firstPerson);
    if (this.game.audio) {
      this.game.audio.setMusicEnabled(this.settings.music);
      this.game.audio.setMusicVolume(this.settings.musicVolume);
    }
    setCute(this.settings.cute);
    setSeason(this.settings.season);
    set8Bit(this.settings.eightBit);
    setMeme(this.settings.meme);
    setColorblind(this.settings.colorblind);
    if (this.settings.mobilite) {
      this.settings.threeD = false;
      this.settings.firstPerson = false;
      this.settings.eightBit = false;
      this.game.set3D(false);
      this.game.setFirstPerson(false);
      set8Bit(false);
      if (this.game.audio) this.game.audio.applyRetro();
      saveJSON(SETTINGS_KEY, this.settings);
    }
    setMobilite(this.settings.mobilite);
    this.notice = null;
    this.noticeTimer = 0;
    this.menu = new SelectList(
      [
        { label: 'CO-OP TANK SELECT', action: 'coopTankSelect' },
        { label: 'DIFFICULTY', action: 'difficulty' },
        { label: 'VOLUME', action: 'volume' },
        { label: 'SFX', action: 'sfx' },
        { label: 'MUSIC', action: 'music' },
        { label: 'MUSIC VOLUME', action: 'musicVolume' },
        { label: '3D MODE', action: 'threeD' },
        { label: 'FIRST PERSON MODE', action: 'firstPerson' },
        { label: 'CUTE MODE', action: 'cute' },
        { label: 'SCREEN SHAKE', action: 'shake' },
        { label: 'SCREEN FLASH', action: 'flash' },
        { label: 'REDUCE MOTION', action: 'reduceMotion' },
        { label: 'CHRISTMAS MODE', action: 'christmas' },
        { label: 'HALLOWEEN MODE', action: 'halloween' },
        { label: 'NEW YEAR MODE', action: 'newyear' },
        { label: 'SPRING MODE', action: 'spring' },
        { label: 'SUMMER MODE', action: 'summer' },
        { label: '8-BIT MODE', action: 'eightBit' },
        { label: 'MEME MODE', action: 'meme' },
        { label: 'MOBILITE MODE', action: 'mobilite' },
        { label: 'MOBILITE RIGHT THUMB', action: 'mobiliteThumb' },
        { label: 'MOBILITE BIG BUTTONS', action: 'mobiliteBig' },
        { label: 'COLORBLIND HAZARDS', action: 'colorblind' },
        { label: 'TRACK PLAYER', action: 'tracks' },
        { label: 'CUTSCENE THEATRE', action: 'theatre' },
        { label: 'CUSTOM TUNING', action: 'tuning' },
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

  setMusicVolume(value) {
    const next = Math.round(clamp(value, 0, 1) * 10) / 10;
    if (next === this.settings.musicVolume) return;
    this.settings.musicVolume = next;
    if (this.game.audio) this.game.audio.setMusicVolume(next);
    this.game.audio.tone({ freq: 480 + next * 320, duration: 0.05, volume: 0.15 });
    saveJSON(SETTINGS_KEY, this.settings);
  }

  toggleSeason(key) {
    const next = this.settings.season === key ? 'none' : key;
    this.settings.season = next;
    this.settings.christmas = next === 'christmas';
    this.settings.halloween = next === 'halloween';
    this.settings.newyear = next === 'newyear';
    this.settings.spring = next === 'spring';
    this.settings.summer = next === 'summer';
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
    if (this.settings.mobilite && (item.action === 'threeD' || item.action === 'firstPerson' || item.action === 'eightBit')) {
      this.notice = 'MOBILITE MODE — THAT MODE NEEDS A KEYBOARD';
      this.noticeTimer = 2.6;
      this.game.audio.tone({ freq: 180, endFreq: 90, type: 'square', duration: 0.16, volume: 0.2 });
      return;
    }
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
    if (item.action === 'tuning') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('tuning');
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
    if (item.action === 'music') {
      const next = !this.settings.music;
      if (!next && this.game.audio) this.game.audio.tone({ freq: 520, endFreq: 300, duration: 0.1, volume: 0.18 });
      this.settings.music = next;
      if (this.game.audio) this.game.audio.setMusicEnabled(next);
      saveJSON(SETTINGS_KEY, this.settings);
      return;
    }
    if (item.action === 'musicVolume') {
      const pointer = this.game.input.pointer;
      if (pointer.down) {
        const target = clamp((pointer.x - (CONTROLS_X - TRACK_WIDTH / 2)) / TRACK_WIDTH, 0, 1);
        this.setMusicVolume(Math.round(target * 10) / 10);
      } else {
        this.setMusicVolume(this.settings.musicVolume >= 0.95 ? 0 : this.settings.musicVolume + 0.1);
      }
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
    if (item.action === 'cute') {
      this.settings.cute = !this.settings.cute;
    setCute(this.settings.cute);
    setShakeEnabled(this.settings.shake);
    setFlashEnabled(this.settings.flash);
    setReducedMotion(this.settings.reduceMotion);
      saveJSON(SETTINGS_KEY, this.settings);
      this.game.audio.tone({
        freq: this.settings.cute ? 880 : 300,
        endFreq: this.settings.cute ? 1240 : 180,
        type: 'triangle',
        duration: 0.14,
        volume: 0.2,
      });
      return;
    }
    if (item.action === 'shake' || item.action === 'flash' || item.action === 'reduceMotion') {
      this.settings[item.action] = !this.settings[item.action];
      setShakeEnabled(this.settings.shake);
      setFlashEnabled(this.settings.flash);
      setReducedMotion(this.settings.reduceMotion);
      saveJSON(SETTINGS_KEY, this.settings);
      this.game.audio.tone({
        freq: this.settings[item.action] ? 620 : 320,
        duration: 0.1,
        volume: 0.18,
      });
      return;
    }
    if (item.action === 'colorblind') {
      this.settings.colorblind = !this.settings.colorblind;
      setColorblind(this.settings.colorblind);
      saveJSON(SETTINGS_KEY, this.settings);
      this.game.audio.tone({
        freq: this.settings.colorblind ? 880 : 300,
        endFreq: this.settings.colorblind ? 1240 : 180,
        type: 'triangle',
        duration: 0.14,
        volume: 0.2,
      });
      return;
    }
    if (item.action === 'spring' || item.action === 'summer') {
      this.toggleSeason(item.action);
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
    if (item.action === 'mobilite') {
      this.settings.mobilite = !this.settings.mobilite;
    setMobilite(this.settings.mobilite);
    setMobiliteThumb(this.settings.mobiliteThumb ? 'right' : 'left');
    setMobiliteScale(this.settings.mobiliteBig ? 1.28 : 1);
      if (this.settings.mobilite) {
        this.settings.threeD = false;
        this.settings.firstPerson = false;
        this.settings.eightBit = false;
        this.game.set3D(false);
        this.game.setFirstPerson(false);
        set8Bit(false);
        if (this.game.audio) this.game.audio.applyRetro();
      }
      saveJSON(SETTINGS_KEY, this.settings);
      this.game.audio.tone({
        freq: this.settings.mobilite ? 700 : 300,
        endFreq: this.settings.mobilite ? 1100 : 180,
        type: 'triangle',
        duration: 0.14,
        volume: 0.2,
      });
      return;
    }
    if (item.action === 'mobiliteThumb' || item.action === 'mobiliteBig') {
      this.settings[item.action] = !this.settings[item.action];
      setMobiliteThumb(this.settings.mobiliteThumb ? 'right' : 'left');
      setMobiliteScale(this.settings.mobiliteBig ? 1.28 : 1);
      saveJSON(SETTINGS_KEY, this.settings);
      this.game.audio.tone({
        freq: this.settings[item.action] ? 700 : 320,
        duration: 0.1,
        volume: 0.18,
      });
      return;
    }
    if (item.action === 'meme') {
      this.settings.meme = !this.settings.meme;
      setMeme(this.settings.meme);
      setColorblind(this.settings.colorblind);
      saveJSON(SETTINGS_KEY, this.settings);
      setActiveSkin(skinByKey(loadJSON(SHOP_KEY, {}).skin));
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
    this.noticeTimer = Math.max(0, this.noticeTimer - dt);
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
    if (selected && selected.action === 'musicVolume') {
      if (input.wasPressed('left')) this.setMusicVolume(this.settings.musicVolume - 0.1);
      if (input.wasPressed('right')) this.setMusicVolume(this.settings.musicVolume + 0.1);
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
      music: 'MUSIC ON / OFF (INDEPENDENT OF SFX)',
      musicVolume: 'MUSIC VOLUME',
      threeD: 'TILT THE WHOLE TANK ONTO A PERSPECTIVE PLANE',
      firstPerson: 'THE MOUSE LOOKS AROUND A CLOSE-UP VIEW',
      cute: 'BIG EYES, BLUSH AND GENTLER SCARES \u2014 EVERYTHING GOES ADORABLE',
      shake: 'CAMERA SHAKE ON / OFF',
      flash: 'FULL-SCREEN FLASHES ON / OFF',
      reduceMotion: 'DAMP ZOOM AND SWEEPING MOTION',
      christmas: 'CAROL THEMES AND SLOW SINKING SNOWFLAKES',
      halloween: 'EERIE THEMES AND DRIFTING AUTUMN LEAVES',
      spring: 'BLOSSOM THEMES AND DRIFTING PETALS',
      summer: 'SUNSET THEMES AND RISING HEAT SHIMMER',
      newyear: 'PARTY THEMES AND FALLING CONFETTI',
      colorblind: 'SWAP RED/GREEN DANGER CUES FOR HIGH-CONTRAST MARKS',
      eightBit: 'PIXELATED 8-BIT LOOK AND CHIPTUNE SOUND',
      meme: 'SILLY COMIC POP-UPS AND CAPTIONS EVERYWHERE',
      mobilite: 'ON-SCREEN WASD, SPACE, E AND ESC BUTTONS; DISABLES 3D, FIRST PERSON, 8-BIT AND THE COURSE BUILDER',
      mobiliteThumb: 'PUT THE MOVEMENT PAD ON THE RIGHT SIDE FOR RIGHT-HANDED PLAY',
      mobiliteBig: 'MAKE THE ON-SCREEN BUTTONS LARGER',
      tracks: 'PLAY ANY LEVEL THEME',
      theatre: 'REPLAY ANY CUTSCENE',
      tuning: 'FINE-TUNE ENEMY SPEED, CLOCK AND PENALTIES ON TOP OF THE PRESET',
      back: 'RETURN TO THE MENU',
    };
    const selected = this.menu.selected;
    drawText(ctx, (selected && help[selected.action]) || '', LOGICAL_WIDTH / 2, 122, {
      size: 13,
      color: COLORS.foam,
      alpha: 0.85,
    });
    if (this.noticeTimer > 0 && this.notice) {
      drawText(ctx, this.notice, LOGICAL_WIDTH / 2, 146, {
        size: 13,
        color: COLORS.danger,
        alpha: Math.min(1, this.noticeTimer),
      });
    }

    const centerY = LOGICAL_HEIGHT * 0.58;
    this.menu.render(ctx, LOGICAL_WIDTH / 2, centerY);
    const top = centerY - ((this.menu.items.length - 1) * this.menu.spacing) / 2;
    this.menu.items.forEach((item, index) => {
      const y = top + index * this.menu.spacing;
      if (item.action === 'difficulty') {
        this.renderDifficulty(ctx, CONTROLS_X, y, this.settings.difficulty);
      } else if (item.action === 'volume') {
        this.renderSlider(ctx, CONTROLS_X, y, this.settings.volume);
      } else if (item.action === 'musicVolume') {
        this.renderSlider(ctx, CONTROLS_X, y, this.settings.musicVolume);
      } else if (item.action === 'tracks' || item.action === 'theatre' || item.action === 'tuning') {
        drawText(ctx, 'OPEN', CONTROLS_X, y, { size: 13, color: COLORS.textDim, alpha: 0.85 });
      } else if (typeof this.settings[item.action] === 'boolean') {
        this.renderSwitch(ctx, CONTROLS_X, y, this.settings[item.action]);
      }
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
