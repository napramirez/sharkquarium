import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import {
  COMPOSER_MIN_STEPS,
  COMPOSER_MAX_STEPS,
  INSTRUMENTS,
  DRUM_SOUNDS,
  midiToFreq,
  loadComposer,
  saveComposer,
} from '../engine/composer.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

const VISIBLE = 14;

const AREA_X = 130;
const AREA_W = 700;
const AREA_Y = 172;
const AREA_H = 280;
const COL_W = AREA_W / VISIBLE;
const TAB_W = 130;
const TAB_GAP = 12;
const TAB_Y = 118;
const TABS_X = (LOGICAL_WIDTH - (INSTRUMENTS.length * TAB_W + (INSTRUMENTS.length - 1) * TAB_GAP)) / 2;

const BUTTONS = {
  play: { x: 190, y: 486, w: 104, h: 34 },
  clear: { x: 302, y: 486, w: 88, h: 34 },
  lenDown: { x: 408, y: 486, w: 46, h: 34 },
  lenUp: { x: 458, y: 486, w: 46, h: 34 },
  tempoDown: { x: 600, y: 486, w: 40, h: 34 },
  tempoUp: { x: 644, y: 486, w: 40, h: 34 },
};

export class TrackBuilderScene extends Scene {
  enter() {
    this.time = 0;
    const data = loadComposer();
    this.bpm = data.bpm;
    this.steps = data.steps;
    this.tracks = data.tracks;
    this.tab = 0;
    this.playing = false;
    this.step = 0;
    this.timer = 0;
    this.cursorCol = 0;
    this.cursorLine = INSTRUMENTS[0].lines.length - 1;
    this.scrollCol = 0;
    this.drag = null;
    this.status = 'CLICK A LINE TO PLACE A BLOCK — HOLD + DRAG RIGHT TO STRETCH IT';
    this.statusTimer = 3.6;
    if (this.game.music) {
      this.previousTrack = this.game.music.source ?? this.game.music.track;
      this.previousHold = this.game.music.hold;
      this.game.music.stop();
    }
  }

  exit() {
    if (!this.game.music || !this.previousTrack) return;
    this.game.music.play(this.previousTrack);
    this.game.music.hold = this.previousHold;
  }

  inst() {
    return INSTRUMENTS[this.tab];
  }

  notes() {
    return this.tracks[this.inst().key];
  }

  lineCount() {
    return this.inst().lines.length;
  }

  lineY(line) {
    const n = this.lineCount();
    if (n <= 1) return AREA_Y + AREA_H / 2;
    return AREA_Y + (line / (n - 1)) * AREA_H;
  }

  colX(col) {
    return AREA_X + (col - this.scrollCol + 0.5) * COL_W;
  }

  colAt(x) {
    return this.scrollCol + Math.floor((x - AREA_X) / COL_W);
  }

  maxScroll() {
    return Math.max(0, this.steps - VISIBLE);
  }

  beat() {
    return 60 / this.bpm / 2;
  }

  save() {
    saveComposer(this.bpm, this.steps, this.tracks);
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2.4;
  }

  clampScroll() {
    const focus = this.playing ? this.step : this.cursorCol;
    if (focus < this.scrollCol) this.scrollCol = focus;
    else if (focus > this.scrollCol + VISIBLE - 1) this.scrollCol = focus - VISIBLE + 1;
    this.scrollCol = clamp(this.scrollCol, 0, this.maxScroll());
  }

  findNote(col, line) {
    return this.notes().find((note) => note.line === line && col >= note.col && col < note.col + note.length);
  }

  selectTab(index) {
    this.tab = clamp(index, 0, INSTRUMENTS.length - 1);
    this.cursorLine = this.lineCount() - 1;
    this.drag = null;
    this.setStatus(`${this.inst().key} — CLICK A LINE TO PLACE BLOCKS`);
    this.game.audio.tone({ freq: 420 + this.tab * 90, duration: 0.07, volume: 0.12 });
  }

  setLength(value) {
    const next = clamp(Math.round(value), COMPOSER_MIN_STEPS, COMPOSER_MAX_STEPS);
    if (next === this.steps) return;
    this.steps = next;
    for (const inst of INSTRUMENTS) {
      this.tracks[inst.key] = this.tracks[inst.key].filter((note) => note.col < this.steps);
    }
    this.cursorCol = clamp(this.cursorCol, 0, this.steps - 1);
    this.step = this.step % this.steps;
    this.drag = null;
    this.clampScroll();
    this.save();
    this.setStatus(`SCRIPT LENGTH ${this.steps} STEPS`);
    this.game.audio.tone({ freq: 520 + (this.steps % 8) * 40, duration: 0.06, volume: 0.12 });
  }

  toggleCell(col, line) {
    if (col < 0 || col >= this.steps || line < 0 || line >= this.lineCount()) return;
    const existing = this.findNote(col, line);
    if (existing) {
      this.tracks[this.inst().key] = this.notes().filter((note) => note !== existing);
      this.game.audio.tone({ freq: 300, endFreq: 200, type: 'square', duration: 0.06, volume: 0.1 });
    } else {
      this.notes().push({ col, line, length: 1 });
      this.preview(line);
    }
    this.save();
  }

  preview(line) {
    const inst = this.inst();
    if (inst.sound === 'drum') {
      const sound = DRUM_SOUNDS[line];
      if (sound.kind === 'noise') this.game.audio.noise({ ...sound, delay: 0 });
      else this.game.audio.tone({ ...sound });
      return;
    }
    this.game.audio.tone({
      freq: midiToFreq(inst.pitches[line]),
      type: inst.wave,
      duration: 0.16,
      volume: inst.volume + 0.04,
    });
  }

  clear() {
    this.tracks[this.inst().key] = [];
    this.drag = null;
    this.save();
    this.setStatus(`${this.inst().key} CLEARED`);
    this.game.audio.tone({ freq: 220, endFreq: 120, type: 'square', duration: 0.2, volume: 0.16 });
  }

  setBpm(value) {
    this.bpm = clamp(Math.round(value / 5) * 5, 60, 200);
    this.save();
    this.setStatus(`TEMPO ${this.bpm} BPM`);
    this.game.audio.tone({ freq: 480 + (this.bpm - 60) * 2, duration: 0.05, volume: 0.12 });
  }

  togglePlay() {
    this.playing = !this.playing;
    if (this.playing) {
      this.step = 0;
      this.timer = 0;
      this.setStatus('PLAYING');
    } else {
      this.setStatus('STOPPED');
    }
    this.game.audio.tone({
      freq: this.playing ? 620 : 320,
      endFreq: this.playing ? 880 : 240,
      type: 'square',
      duration: 0.1,
      volume: 0.16,
    });
  }

  playStep(step) {
    for (const inst of INSTRUMENTS) {
      for (const note of this.tracks[inst.key]) {
        if (note.col !== step) continue;
        if (inst.sound === 'drum') {
          const sound = DRUM_SOUNDS[note.line];
          if (sound.kind === 'noise') this.game.audio.noise({ ...sound, delay: 0 });
          else this.game.audio.tone({ ...sound });
        } else {
          this.game.audio.tone({
            freq: midiToFreq(inst.pitches[note.line]),
            type: inst.wave,
            duration: this.beat() * note.length * 0.95,
            volume: inst.volume,
          });
        }
      }
    }
  }

  tabAt(x, y) {
    for (let i = 0; i < INSTRUMENTS.length; i += 1) {
      const tx = TABS_X + i * (TAB_W + TAB_GAP);
      if (x >= tx && x <= tx + TAB_W && y >= TAB_Y && y <= TAB_Y + 34) return i;
    }
    return -1;
  }

  pointerCell(x, y) {
    if (x < AREA_X || x > AREA_X + AREA_W || y < AREA_Y - 20 || y > AREA_Y + AREA_H + 20) return null;
    const n = this.lineCount();
    return {
      col: clamp(this.colAt(x), 0, this.steps - 1),
      line: clamp(Math.round((y - AREA_Y) / (n <= 1 ? 1 : AREA_H / (n - 1))), 0, n - 1),
    };
  }

  beginDrag(x, y) {
    const cell = this.pointerCell(x, y);
    if (!cell) return;
    this.cursorCol = cell.col;
    this.cursorLine = cell.line;
    const existing = this.findNote(cell.col, cell.line);
    if (existing) {
      this.drag = { note: existing, moved: false, created: false };
      this.setStatus('HOLD + DRAG RIGHT TO STRETCH — RELEASE TO KEEP, TAP TO REMOVE');
    } else {
      const note = { col: cell.col, line: cell.line, length: 1 };
      this.notes().push(note);
      this.drag = { note, moved: false, created: true };
      this.preview(cell.line);
    }
    this.clampScroll();
  }

  updateDrag() {
    if (!this.drag) return;
    const pointer = this.game.input.pointer;
    const col = clamp(this.colAt(pointer.x), this.drag.note.col, this.steps - 1);
    const length = col - this.drag.note.col + 1;
    if (length !== this.drag.note.length) {
      this.drag.note.length = length;
      if (length > 1) this.drag.moved = true;
    }
  }

  endDrag() {
    if (!this.drag) return;
    if (!this.drag.moved && !this.drag.created) {
      this.tracks[this.inst().key] = this.notes().filter((note) => note !== this.drag.note);
      this.game.audio.tone({ freq: 300, endFreq: 200, type: 'square', duration: 0.06, volume: 0.1 });
    }
    this.drag = null;
    this.save();
  }

  update(dt) {
    this.time += dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('tracks');
      return;
    }
    if (input.wasPressed('play')) this.togglePlay();
    if (input.wasPressed('clear')) this.clear();
    if (input.wasPressed('tempoDown')) this.setBpm(this.bpm - 5);
    if (input.wasPressed('tempoUp')) this.setBpm(this.bpm + 5);
    if (input.wasPressed('Minus')) this.setLength(this.steps - 4);
    if (input.wasPressed('Equal')) this.setLength(this.steps + 4);
    for (let i = 0; i < INSTRUMENTS.length; i += 1) {
      if (input.wasPressed(`Digit${i + 1}`)) this.selectTab(i);
    }
    if (input.wasPressed('left')) this.cursorCol = Math.max(0, this.cursorCol - 1);
    if (input.wasPressed('right')) this.cursorCol = Math.min(this.steps - 1, this.cursorCol + 1);
    if (input.wasPressed('up')) this.cursorLine = Math.max(0, this.cursorLine - 1);
    if (input.wasPressed('down')) this.cursorLine = Math.min(this.lineCount() - 1, this.cursorLine + 1);

    const pointerPressed = input.pressed && input.pressed.has('PointerPrimary');
    if (input.wasPressed('confirm') && pointerPressed) {
      const tabIndex = this.tabAt(input.pointer.x, input.pointer.y);
      if (tabIndex >= 0) {
        this.selectTab(tabIndex);
      } else {
        const button = Object.entries(BUTTONS).find(
          ([, rect]) =>
            input.pointer.x >= rect.x &&
            input.pointer.x <= rect.x + rect.w &&
            input.pointer.y >= rect.y &&
            input.pointer.y <= rect.y + rect.h,
        );
        if (button) {
          const name = button[0];
          if (name === 'play') this.togglePlay();
          else if (name === 'clear') this.clear();
          else if (name === 'lenDown') this.setLength(this.steps - 4);
          else if (name === 'lenUp') this.setLength(this.steps + 4);
          else if (name === 'tempoDown') this.setBpm(this.bpm - 5);
          else if (name === 'tempoUp') this.setBpm(this.bpm + 5);
        } else {
          this.beginDrag(input.pointer.x, input.pointer.y);
        }
      }
    } else if (input.wasPressed('confirm')) {
      this.toggleCell(this.cursorCol, this.cursorLine);
      this.clampScroll();
    }

    if (this.drag) {
      if (input.pointer.down) this.updateDrag();
      else this.endDrag();
    } else {
      this.clampScroll();
    }

    if (this.playing) {
      this.timer -= dt;
      let guard = 0;
      while (this.timer <= 0 && guard < 8) {
        this.playStep(this.step);
        this.step = (this.step + 1) % this.steps;
        this.timer += this.beat();
        guard += 1;
      }
      this.clampScroll();
    }
  }

  renderButton(ctx, rect, label, active) {
    fillRoundRect(
      ctx,
      rect.x,
      rect.y,
      rect.w,
      rect.h,
      10,
      active ? 'rgba(255, 209, 102, 0.9)' : 'rgba(10, 39, 64, 0.9)',
    );
    strokeRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, 'rgba(207, 239, 255, 0.4)', 1.5);
    drawText(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2, {
      size: 13,
      color: active ? '#10233a' : COLORS.text,
    });
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    drawText(ctx, 'TRACK BUILDER', LOGICAL_WIDTH / 2, 50, {
      size: 32,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 20,
    });
    drawText(ctx, 'CLICK A LINE TO PLACE A BLOCK — HOLD + DRAG RIGHT TO STRETCH — STRETCH THE SCRIPT LONGER WITH L+', LOGICAL_WIDTH / 2, 80, {
      size: 11,
      color: COLORS.foam,
      alpha: 0.85,
    });

    for (let i = 0; i < INSTRUMENTS.length; i += 1) {
      const inst = INSTRUMENTS[i];
      const x = TABS_X + i * (TAB_W + TAB_GAP);
      const active = i === this.tab;
      fillRoundRect(ctx, x, TAB_Y, TAB_W, 34, 9, active ? 'rgba(255, 209, 102, 0.9)' : 'rgba(10, 39, 64, 0.9)');
      strokeRoundRect(ctx, x, TAB_Y, TAB_W, 34, 9, 'rgba(207, 239, 255, 0.4)', 1.5);
      drawText(ctx, inst.key, x + TAB_W / 2, TAB_Y + 17, {
        size: 15,
        color: active ? '#10233a' : COLORS.text,
        glow: active ? 'rgba(255, 209, 102, 0.4)' : null,
        glowBlur: 8,
      });
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(AREA_X, AREA_Y - 24, AREA_W, AREA_H + 44);
    ctx.clip();

    const n = this.lineCount();
    for (let line = 0; line < n; line += 1) {
      const y = this.lineY(line);
      ctx.strokeStyle = 'rgba(207, 239, 255, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(AREA_X, y);
      ctx.lineTo(AREA_X + AREA_W, y);
      ctx.stroke();
      drawText(ctx, this.inst().lines[line], AREA_X - 14, y, {
        size: 11,
        color: COLORS.textDim,
        align: 'right',
        alpha: 0.85,
      });
    }

    for (let col = this.scrollCol; col < this.scrollCol + VISIBLE && col < this.steps; col += 1) {
      drawText(ctx, `${col + 1}`, this.colX(col), AREA_Y - 14, {
        size: 10,
        color: col === this.step && this.playing ? COLORS.accent : COLORS.textDim,
        alpha: 0.7,
      });
    }

    const playX = this.colX(this.step);
    if (this.playing) {
      fillRoundRect(ctx, playX - COL_W * 0.4, AREA_Y - 22, COL_W * 0.8, AREA_H + 40, 6, 'rgba(255, 209, 102, 0.12)');
      ctx.fillStyle = COLORS.accent;
      ctx.beginPath();
      ctx.moveTo(playX - 7, AREA_Y - 22);
      ctx.lineTo(playX + 7, AREA_Y - 22);
      ctx.lineTo(playX, AREA_Y - 12);
      ctx.closePath();
      ctx.fill();
    } else if (this.cursorCol >= this.scrollCol && this.cursorCol < this.scrollCol + VISIBLE) {
      fillRoundRect(ctx, this.colX(this.cursorCol) - COL_W * 0.4, AREA_Y - 22, COL_W * 0.8, AREA_H + 40, 6, 'rgba(99, 230, 255, 0.08)');
    }

    const hue = 170 + this.tab * 28;
    for (let t = 0; t < INSTRUMENTS.length; t += 1) {
      if (t === this.tab) continue;
      const other = INSTRUMENTS[t];
      const otherLines = other.lines.length;
      const otherHue = 170 + t * 28;
      for (const note of this.tracks[other.key]) {
        const frac = otherLines <= 1 ? 0.5 : note.line / (otherLines - 1);
        const line = Math.round(frac * (n - 1));
        const left = AREA_X + (note.col - this.scrollCol + 0.2) * COL_W;
        const right = AREA_X + (note.col + note.length - this.scrollCol - 0.2) * COL_W;
        if (right < AREA_X || left > AREA_X + AREA_W) continue;
        ctx.save();
        ctx.globalAlpha = 0.85;
        strokeRoundRect(
          ctx,
          left,
          this.lineY(line) - 9,
          Math.max(6, right - left),
          18,
          5,
          `hsl(${otherHue}, 80%, 66%)`,
          2,
        );
        ctx.restore();
      }
    }
    for (const note of this.notes()) {
      const left = AREA_X + (note.col - this.scrollCol + 0.2) * COL_W;
      const right = AREA_X + (note.col + note.length - this.scrollCol - 0.2) * COL_W;
      if (right < AREA_X || left > AREA_X + AREA_W) continue;
      const y = this.lineY(note.line);
      const dragging = this.drag && this.drag.note === note;
      fillRoundRect(
        ctx,
        left,
        y - 9,
        Math.max(6, right - left),
        18,
        5,
        `hsl(${hue + note.line * 6}, 75%, 60%)`,
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(left + 4, y - 6, Math.max(4, right - left - 8), 3);
      strokeRoundRect(
        ctx,
        left,
        y - 9,
        Math.max(6, right - left),
        18,
        5,
        dragging ? COLORS.accent : 'rgba(10, 30, 44, 0.5)',
        dragging ? 2.5 : 1,
      );
    }
    ctx.restore();

    strokeRoundRect(ctx, AREA_X, AREA_Y - 24, AREA_W, AREA_H + 44, 10, 'rgba(207, 239, 255, 0.22)', 1.5);

    this.renderButton(ctx, BUTTONS.play, this.playing ? 'STOP' : 'PLAY', this.playing);
    this.renderButton(ctx, BUTTONS.clear, 'CLEAR', false);
    this.renderButton(ctx, BUTTONS.lenDown, 'L-', false);
    this.renderButton(ctx, BUTTONS.lenUp, 'L+', false);
    this.renderButton(ctx, BUTTONS.tempoDown, '-', false);
    this.renderButton(ctx, BUTTONS.tempoUp, '+', false);
    drawText(ctx, `LEN ${this.steps}`, 540, 503, { size: 12, color: COLORS.bubble, align: 'center' });
    drawText(ctx, `${this.bpm} BPM`, 700, 503, { size: 13, color: COLORS.accent, align: 'left' });

    if (this.statusTimer > 0) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 466, {
        size: 12,
        color: COLORS.text,
        alpha: Math.min(1, this.statusTimer),
      });
    }
    drawText(
      ctx,
      'CLICK — PLACE/STRETCH      ARROWS — MOVE      L+ / L- — LONGER / SHORTER      P — PLAY      C — CLEAR      ESC — BACK',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 11, color: COLORS.textDim, alpha: 0.75 },
    );
  }
}
