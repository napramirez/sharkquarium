import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillCircle, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp, TAU } from '../engine/math.js';
import {
  RUSH_GRID,
  RUSH_MAX_X,
  RUSH_HEIGHTS,
  RUSH_KIND_LABELS,
  rushItemRect,
  loadRushCourse,
  saveRushCourse,
} from '../engine/rushcourse.js';
import { drawStingrayBody } from '../entities/stingray.js';
import { REEF_RUSH, COLORS, SKINS, LOGICAL_WIDTH, LOGICAL_HEIGHT, WATER_PALETTE } from '../config.js';

const H = LOGICAL_HEIGHT;
const GROUND_Y = H * REEF_RUSH.groundY;
const AREA_TOP = 100;
const AREA_BOTTOM = 470;

const PANEL_X = 716;
const PANEL_W = 228;
const PANEL_TOP = AREA_TOP;
const LIST_TOP = 106;
const ROW_H = 13;
const VISIBLE_ROWS = 26;
const PANEL_BOTTOM = LIST_TOP + VISIBLE_ROWS * ROW_H + 26;

const ITEM_LIST = [
  { label: 'SHELL', kind: 'shell', group: 'piece' },
  { label: 'SEAWEED', kind: 'seaweed', group: 'piece' },
  { label: 'CEILING SHELL', kind: 'ceilshell', group: 'piece' },
  { label: 'CEILING WEED', kind: 'ceilweed', group: 'piece' },
  { label: 'ROCK', kind: 'rock', group: 'piece' },
  { label: 'CEILING ROCK', kind: 'ceilrock', group: 'piece' },
  { label: 'PEARL', kind: 'pearl', group: 'piece' },
  { label: 'PRESSURE BUBBLE', kind: 'bubble', group: 'piece' },
  { label: 'GRAVITY BUBBLE', kind: 'gravity', group: 'piece' },
  { label: 'GRAVITY BUBBLE PAD', kind: 'gravpad', group: 'piece' },
  { label: 'CEILING GRAVITY BUBBLE PAD', kind: 'ceilgravpad', group: 'piece' },
  { label: 'THRUST BUBBLE PAD', kind: 'pad', group: 'piece' },
  { label: 'CEILING THRUST BUBBLE PAD', kind: 'ceilpad', group: 'piece' },
  { label: 'FLOATING LEDGE', kind: 'ledge', group: 'piece' },
  { label: 'SLOPE UP', kind: 'slopeup', group: 'piece' },
  { label: 'SLOPE DOWN', kind: 'slopedown', group: 'piece' },
  { label: 'STINGRAY', kind: 'portal', form: 'stingray', group: 'mode' },
  { label: 'DART EEL', kind: 'portal', form: 'eel', group: 'mode' },
  { label: 'CRAB', kind: 'portal', form: 'crab', group: 'mode' },
  { label: 'URCHIN', kind: 'portal', form: 'urchin', group: 'mode' },
  { label: 'JELLY', kind: 'portal', form: 'jelly', group: 'mode' },
  { label: 'FISH', kind: 'portal', form: 'fish', group: 'mode' },
  { label: 'GRAVITY PORTAL', kind: 'gravup', group: 'mode', color: '#b07bff' },
  { label: 'NORMAL GRAVITY PORTAL', kind: 'gravdown', group: 'mode', color: '#63e6ff' },
  { label: 'NAUTILUS', kind: 'portal', form: 'nautilus', group: 'mode', color: '#d9a93c' },
  { label: 'SHRIMP', kind: 'portal', form: 'shrimp', group: 'mode', color: '#ff8f7a' },
];

const PLAY_W = PANEL_X;
const SLIDER = { x: 24, y: 456, w: PANEL_X - 48, h: 10 };

const ACTIONS = {
  test: { x: 120, y: 496, w: 80, h: 30 },
  testHere: { x: 206, y: 496, w: 108, h: 30 },
  clear: { x: 320, y: 496, w: 80, h: 30 },
  goalDown: { x: 406, y: 496, w: 36, h: 30 },
  goalUp: { x: 446, y: 496, w: 36, h: 30 },
};

const PORTAL_COLORS = {
  stingray: '#7f97a8',
  eel: '#5d7a52',
  crab: '#d96448',
  urchin: '#7a5b96',
  jelly: '#c9a6ff',
  nautilus: '#d9a93c',
  shrimp: '#ff8f7a',
};

const SPOTTED_RAY = SKINS.find((skin) => skin.key === 'spottedray') ?? {};

function drawSpottedRay(ctx, radius, time) {
  drawStingrayBody(ctx, radius, {
    raw: true,
    bodyColor: SPOTTED_RAY.body ?? COLORS.stingray,
    spotColor: SPOTTED_RAY.accent ?? 'rgba(70, 62, 50, 0.35)',
    tailColor: SPOTTED_RAY.tail ?? COLORS.stingray,
    tailOutline: SPOTTED_RAY.tailOutline ?? null,
    eyeColor: '#10233a',
    tailPhase: time * 8,
  });
}

export class RushBuilderScene extends Scene {
  enter() {
    this.time = 0;
    const course = loadRushCourse();
    this.goal = course.goal;
    this.items = course.items;
    this.cursorX = 300;
    this.itemIndex = 0;
    this.itemScroll = 0;
    this.heightIndex = {};
    for (const entry of ITEM_LIST) this.heightIndex[entry.kind] = 1;
    this.drag = null;
    this.sliderDrag = false;
    this.status = 'PICK AN ITEM, MOVE WITH ARROWS, ENTER OR CLICK TO PLACE';
    this.statusTimer = 3.6;
  }

  exit() {
    this.save();
  }

  entry() {
    return ITEM_LIST[this.itemIndex];
  }

  kind() {
    return this.entry().kind;
  }

  form() {
    return this.entry().form ?? 'stingray';
  }

  height() {
    const list = RUSH_HEIGHTS[this.kind()];
    return list[clamp(this.heightIndex[this.kind()], 0, list.length - 1)];
  }

  heightRange(kind) {
    const list = RUSH_HEIGHTS[kind];
    return [list[0], list[list.length - 1]];
  }

  save() {
    saveRushCourse({ goal: this.goal, items: this.items });
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2.6;
  }

  cameraX() {
    return clamp(this.cursorX - PLAY_W * 0.4, 0, RUSH_MAX_X - PLAY_W);
  }

  snapped() {
    return Math.round(this.cursorX / RUSH_GRID) * RUSH_GRID;
  }

  clampList() {
    if (this.itemIndex < this.itemScroll) this.itemScroll = this.itemIndex;
    else if (this.itemIndex > this.itemScroll + VISIBLE_ROWS - 1) this.itemScroll = this.itemIndex - VISIBLE_ROWS + 1;
    this.itemScroll = clamp(this.itemScroll, 0, Math.max(0, ITEM_LIST.length - VISIBLE_ROWS));
  }

  selectItem(index) {
    this.itemIndex = clamp(index, 0, ITEM_LIST.length - 1);
    this.drag = null;
    this.clampList();
    this.game.audio.tone({ freq: 420 + this.itemIndex * 40, duration: 0.06, volume: 0.12 });
  }

  moveItem(step) {
    this.selectItem(this.itemIndex + step);
  }

  itemAt(x, y) {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const item = this.items[i];
      const rect = rushItemRect(item, GROUND_Y, AREA_TOP);
      if (x >= rect.x - 8 && x <= rect.x + rect.w + 8 && y >= rect.y - 8 && y <= rect.y + rect.h + 8) {
        return item;
      }
    }
    return null;
  }

  baseFor(kind, x) {
    const near = (k) => this.items.find((it) => it.kind === k && Math.abs(it.x - x) < RUSH_GRID * 0.6);
    if (kind === 'shell' || kind === 'seaweed' || kind === 'pad' || kind === 'gravpad') {
      const rock = near('rock');
      const ledge = near('ledge');
      const rockBase = rock ? (rock.count || 1) * rock.h * 0.85 : 0;
      const ledgeBase = ledge ? ledge.h : 0;
      return Math.max(rockBase, ledgeBase);
    }
    if (kind === 'ceilshell' || kind === 'ceilweed' || kind === 'ceilpad' || kind === 'ceilgravpad') {
      const rock = near('ceilrock');
      return rock ? (rock.count || 1) * rock.h * 0.85 : 0;
    }
    return 0;
  }

  place(x = this.snapped()) {
    const kind = this.kind();
    if (kind === 'rock' || kind === 'ceilrock') {
      const existing = this.items.find((it) => it.kind === kind && Math.abs(it.x - x) < RUSH_GRID * 0.6);
      if (existing && (existing.count || 1) < 8) {
        existing.count = (existing.count || 1) + 1;
        this.save();
        this.setStatus(`STACKED ${RUSH_KIND_LABELS[kind]} x${existing.count}`);
        this.game.audio.tone({ freq: 300 + existing.count * 40, duration: 0.06, volume: 0.14 });
        return existing;
      }
    }
    const item = { kind, x, h: this.height(), count: 1 };
    if (kind === 'portal') item.form = this.form();
    if (kind === 'bubble' || kind === 'gravity') item.h = Math.max(60, item.h);
    item.base = this.baseFor(kind, x);
    this.items.push(item);
    this.save();
    this.setStatus(`PLACED ${kind === 'portal' ? RUSH_KIND_LABELS[item.form] : RUSH_KIND_LABELS[kind]}`);
    const freq = kind === 'pearl' ? 900 : kind === 'bubble' || kind === 'gravity' ? 720 : 520;
    this.game.audio.tone({ freq, endFreq: freq + 200, type: 'triangle', duration: 0.08, volume: 0.14 });
    return item;
  }

  removeNear() {
    let best = -1;
    let bestDist = 34;
    for (let i = 0; i < this.items.length; i += 1) {
      const dist = Math.abs(this.items[i].x - this.cursorX);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    if (best < 0) {
      this.setStatus('NOTHING TO REMOVE HERE');
      return;
    }
    const item = this.items[best];
    if ((item.kind === 'rock' || item.kind === 'ceilrock') && (item.count || 1) > 1) {
      item.count -= 1;
      this.setStatus(`UNSTACKED ${RUSH_KIND_LABELS[item.kind]} x${item.count}`);
    } else {
      this.items.splice(best, 1);
      this.setStatus('REMOVED');
    }
    this.save();
    this.game.audio.tone({ freq: 300, endFreq: 200, type: 'square', duration: 0.06, volume: 0.12 });
  }

  clear() {
    this.items = [];
    this.save();
    this.setStatus('COURSE CLEARED');
    this.game.audio.tone({ freq: 220, endFreq: 120, type: 'square', duration: 0.2, volume: 0.16 });
  }

  setGoal(value) {
    this.goal = clamp(Math.round(value / 100) * 100, 1200, RUSH_MAX_X);
    this.save();
    this.game.audio.tone({ freq: 480, duration: 0.05, volume: 0.12 });
  }

  cycHeight(step) {
    const list = RUSH_HEIGHTS[this.kind()];
    this.heightIndex[this.kind()] = clamp(this.heightIndex[this.kind()] + step, 0, list.length - 1);
    this.game.audio.tone({ freq: 520 + this.heightIndex[this.kind()] * 120, duration: 0.05, volume: 0.12 });
  }

  listRowAt(x, y) {
    if (x < PANEL_X + 8 || x > PANEL_X + PANEL_W - 8 || y < LIST_TOP || y > LIST_TOP + VISIBLE_ROWS * ROW_H) {
      return -1;
    }
    return this.itemScroll + Math.floor((y - LIST_TOP) / ROW_H);
  }

  actionAt(x, y) {
    return Object.entries(ACTIONS).find(
      ([, r]) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h,
    );
  }

  testPlay(startX = 0) {
    if (this.items.length === 0) {
      this.setStatus('PLACE SOME OBSTACLES FIRST');
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.18, volume: 0.2 });
      return;
    }
    this.save();
    const start = clamp(Math.round(startX), 0, this.goal);
    if (start > 0) this.setStatus(`TESTING FROM ${start}...`);
    this.game.changeScene('reefrush', { course: true, fromBuilder: true, startX: start });
  }

  sliderMax() {
    return Math.max(this.goal, 2000);
  }

  sliderValue(px) {
    return clamp((px - SLIDER.x) / SLIDER.w, 0, 1) * this.sliderMax();
  }

  sliderX(value) {
    return SLIDER.x + clamp(value / this.sliderMax(), 0, 1) * SLIDER.w;
  }

  sliderHit(x, y) {
    return x >= SLIDER.x - 10 && x <= SLIDER.x + SLIDER.w + 10 && y >= SLIDER.y - 10 && y <= SLIDER.y + SLIDER.h + 10;
  }

  handlePointerDown(x, y) {
    if (this.sliderHit(x, y)) {
      this.sliderDrag = true;
      this.cursorX = this.sliderValue(x);
      return;
    }
    const row = this.listRowAt(x, y);
    if (row >= 0 && row < ITEM_LIST.length) {
      this.selectItem(row);
      return;
    }
    const action = this.actionAt(x, y);
    if (action) {
      const name = action[0];
      if (name === 'test') this.testPlay(0);
      else if (name === 'testHere') this.testPlay(this.snapped());
      else if (name === 'clear') this.clear();
      else if (name === 'goalDown') this.setGoal(this.goal - 200);
      else if (name === 'goalUp') this.setGoal(this.goal + 200);
      return;
    }
    if (x < PLAY_W && y > AREA_TOP - 10 && y < AREA_BOTTOM) {
      const existing = this.itemAt(this.cameraX() + x, y);
      if (existing) {
        this.cursorX = existing.x;
        this.drag = { item: existing, startY: y, startH: existing.h, moved: false, created: false };
        this.setStatus('HOLD + DRAG UP/DOWN TO RESIZE — TAP TO REMOVE');
        return;
      }
      const wx = clamp(this.cameraX() + x, RUSH_GRID, RUSH_MAX_X);
      this.cursorX = Math.round(wx / RUSH_GRID) * RUSH_GRID;
      const item = this.place(this.cursorX);
      this.drag = { item, startY: y, startH: item.h, moved: false, created: true };
    }
  }

  updateDrag(y) {
    if (!this.drag) return;
    const item = this.drag.item;
    const [minH, maxH] = this.heightRange(item.kind);
    const next = clamp(this.drag.startH + (this.drag.startY - y) * 1.2, minH, maxH);
    if (Math.abs(next - item.h) > 0.5) {
      item.h = next;
      if (Math.abs(next - this.drag.startH) > 2) this.drag.moved = true;
    }
  }

  endDrag() {
    if (!this.drag) return;
    if (!this.drag.moved && !this.drag.created) {
      const item = this.drag.item;
      if ((item.kind === 'rock' || item.kind === 'ceilrock') && (item.count || 1) > 1) item.count -= 1;
      else this.items = this.items.filter((it) => it !== item);
      this.game.audio.tone({ freq: 300, endFreq: 200, type: 'square', duration: 0.06, volume: 0.12 });
    }
    this.drag = null;
    this.save();
  }

  update(dt) {
    this.time += dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('minigames');
      return;
    }
    if (input.wasPressed('play')) this.testPlay(0);
    if (input.wasPressed('KeyT')) this.testPlay(this.snapped());
    if (input.wasPressed('clear')) this.clear();
    if (input.wasPressed('Minus')) this.setGoal(this.goal - 200);
    if (input.wasPressed('Equal')) this.setGoal(this.goal + 200);
    if (input.wasPressed('KeyQ')) this.moveItem(-1);
    if (input.wasPressed('KeyE')) this.moveItem(1);
    if (input.wheel) this.moveItem(Math.sign(input.wheel) * Math.min(4, Math.abs(input.wheel)));
    for (let i = 1; i <= 9; i += 1) {
      if (input.wasPressed(`Digit${i}`)) this.selectItem(i - 1);
    }
    if (input.wasPressed('Digit0')) this.selectItem(9);
    if (input.wasPressed('KeyX') || input.wasPressed('Backspace')) this.removeNear();
    const step = input.isDown('hide') ? RUSH_GRID * 5 : RUSH_GRID;
    if (input.wasPressed('left')) this.cursorX = Math.max(RUSH_GRID, this.cursorX - step);
    if (input.wasPressed('right')) this.cursorX = Math.min(RUSH_MAX_X, this.cursorX + step);
    if (input.wasPressed('up')) this.cycHeight(1);
    if (input.wasPressed('down')) this.cycHeight(-1);

    const pointerPressed = input.pressed && input.pressed.has('PointerPrimary');
    if (input.wasPressed('confirm') && pointerPressed) {
      this.handlePointerDown(input.pointer.x, input.pointer.y);
    } else if (input.wasPressed('confirm')) {
      const item = this.place(this.snapped());
      this.drag = { item, startY: GROUND_Y - 10, startH: item.h, moved: false, created: true };
    }

    if (this.sliderDrag) {
      if (input.pointer.down) this.cursorX = this.sliderValue(input.pointer.x);
      else this.sliderDrag = false;
    }

    if (this.drag) {
      if (input.pointer.down) this.updateDrag(input.pointer.y);
      else this.endDrag();
    }
  }

  drawItem(ctx, item, ghost = false) {
    const rect = rushItemRect(item, GROUND_Y, AREA_TOP);
    ctx.save();
    ctx.globalAlpha = ghost ? 0.5 : 1;
    if (item.kind === 'shell') {
      const tipX = rect.x + rect.w / 2;
      const grad = ctx.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
      grad.addColorStop(0, '#ffb27a');
      grad.addColorStop(0.5, '#ff8f5e');
      grad.addColorStop(1, '#d9663c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rect.x, rect.y + rect.h);
      ctx.quadraticCurveTo(tipX, rect.y + rect.h * 0.7, tipX, rect.y);
      ctx.quadraticCurveTo(tipX, rect.y + rect.h * 0.7, rect.x + rect.w, rect.y + rect.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 50, 20, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (item.kind === 'ceilshell') {
      const tipX = rect.x + rect.w / 2;
      const grad = ctx.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
      grad.addColorStop(0, '#ffb27a');
      grad.addColorStop(0.5, '#ff8f5e');
      grad.addColorStop(1, '#d9663c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rect.x, rect.y);
      ctx.quadraticCurveTo(tipX, rect.y + rect.h * 0.3, tipX, rect.y + rect.h);
      ctx.quadraticCurveTo(tipX, rect.y + rect.h * 0.3, rect.x + rect.w, rect.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 50, 20, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (item.kind === 'seaweed') {
      for (let i = 0; i < 4; i += 1) {
        const x = rect.x + (i + 0.5) * (rect.w / 4);
        const sway = Math.sin(this.time * 2 + i) * 4;
        ctx.strokeStyle = i % 2 === 0 ? '#2f7d4f' : '#3f9d63';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, rect.y + rect.h);
        ctx.quadraticCurveTo(x + sway, rect.y + rect.h * 0.4, x + sway * 1.5, rect.y);
        ctx.stroke();
      }
    } else if (item.kind === 'ceilweed') {
      for (let i = 0; i < 4; i += 1) {
        const x = rect.x + (i + 0.5) * (rect.w / 4);
        const sway = Math.sin(this.time * 2 + i) * 4;
        ctx.strokeStyle = i % 2 === 0 ? '#2f7d4f' : '#3f9d63';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, rect.y);
        ctx.quadraticCurveTo(x + sway, rect.y + rect.h * 0.6, x + sway * 1.5, rect.y + rect.h);
        ctx.stroke();
      }
    } else if (item.kind === 'rock') {
      const size = rect.w;
      const count = Math.max(1, item.count || 1);
      for (let i = 0; i < count; i += 1) {
        const y = GROUND_Y - (i + 1) * size * 0.85;
        fillRoundRect(ctx, rect.x, y, size, size * 0.85, 6, '#4a5b6b');
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(rect.x + 4, y + 4, size - 8, 4);
        ctx.strokeStyle = 'rgba(20, 30, 40, 0.8)';
        ctx.lineWidth = 2;
        strokeRoundRect(ctx, rect.x, y, size, size * 0.85, 6, 'rgba(20, 30, 40, 0.8)', 2);
      }
    } else if (item.kind === 'ceilrock') {
      const size = rect.w;
      const count = Math.max(1, item.count || 1);
      for (let i = 0; i < count; i += 1) {
        const y = rect.y + i * size * 0.85;
        fillRoundRect(ctx, rect.x, y, size, size * 0.85, 6, '#3f4f5e');
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(rect.x + 4, y + size * 0.85 - 8, size - 8, 4);
        ctx.strokeStyle = 'rgba(20, 30, 40, 0.8)';
        ctx.lineWidth = 2;
        strokeRoundRect(ctx, rect.x, y, size, size * 0.85, 6, 'rgba(20, 30, 40, 0.8)', 2);
      }
    } else if (item.kind === 'pearl') {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      fillCircle(ctx, cx, cy, rect.w / 2 + 3, 'rgba(255, 209, 102, 0.3)');
      fillCircle(ctx, cx, cy, rect.w / 2, COLORS.accent);
    } else if (item.kind === 'bubble') {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      const r = rect.w / 2;
      ctx.fillStyle = 'rgba(143, 208, 239, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#cfefff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.strokeStyle = '#eaf6ff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.35);
      ctx.lineTo(cx, cy - r * 0.35);
      ctx.moveTo(cx - r * 0.3, cy - r * 0.05);
      ctx.lineTo(cx, cy - r * 0.35);
      ctx.lineTo(cx + r * 0.3, cy - r * 0.05);
      ctx.stroke();
    } else if (item.kind === 'gravity') {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      const r = rect.w / 2;
      ctx.fillStyle = 'rgba(160, 120, 255, 0.28)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#c9a6ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.strokeStyle = '#eae0ff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.45);
      ctx.lineTo(cx, cy + r * 0.45);
      ctx.moveTo(cx - r * 0.28, cy - r * 0.18);
      ctx.lineTo(cx, cy - r * 0.45);
      ctx.lineTo(cx + r * 0.28, cy - r * 0.18);
      ctx.moveTo(cx - r * 0.28, cy + r * 0.18);
      ctx.lineTo(cx, cy + r * 0.45);
      ctx.lineTo(cx + r * 0.28, cy + r * 0.18);
      ctx.stroke();
    } else if (item.kind === 'pad' || item.kind === 'ceilpad' || item.kind === 'gravpad' || item.kind === 'ceilgravpad') {
      const gravityPad = item.kind === 'gravpad' || item.kind === 'ceilgravpad';
      const up = item.kind === 'pad' || item.kind === 'gravpad';
      const w = rect.w;
      const h = rect.h;
      const face = gravityPad ? (up ? '#7a4fd6' : '#5f3aa8') : up ? '#3f8fb5' : '#2f6f8f';
      fillRoundRect(ctx, rect.x, rect.y, w, h, Math.min(8, h / 2), face);
      strokeRoundRect(ctx, rect.x, rect.y, w, h, Math.min(8, h / 2), '#eaf6ff', 2);
      const cx = rect.x + w / 2;
      const dir = up ? -1 : 1;
      const baseY = up ? rect.y + h * 0.78 : rect.y + h * 0.22;
      ctx.strokeStyle = '#eaf6ff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.22, baseY);
      ctx.lineTo(cx, baseY + dir * h * 0.5);
      ctx.lineTo(cx + w * 0.22, baseY);
      ctx.stroke();
      if (gravityPad) {
        ctx.beginPath();
        ctx.moveTo(cx, rect.y + h * 0.5 - h * 0.22);
        ctx.lineTo(cx, rect.y + h * 0.5 + h * 0.22);
        ctx.stroke();
      }
    } else if (item.kind === 'ledge') {
      fillRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 5, '#5a6b7c');
      strokeRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 5, 'rgba(20, 30, 40, 0.85)', 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.fillRect(rect.x + 3, rect.y + 3, rect.w - 6, 3);
    } else if (item.kind === 'slopeup' || item.kind === 'slopedown') {
      const base = GROUND_Y;
      ctx.beginPath();
      if (item.kind === 'slopeup') {
        ctx.moveTo(rect.x, base);
        ctx.lineTo(rect.x + rect.w, rect.y);
        ctx.lineTo(rect.x + rect.w, base);
      } else {
        ctx.moveTo(rect.x, rect.y);
        ctx.lineTo(rect.x + rect.w, base);
        ctx.lineTo(rect.x, base);
      }
      ctx.closePath();
      ctx.fillStyle = '#55697a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(20, 30, 40, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (item.kind === 'gravup' || item.kind === 'gravdown') {
      const up = item.kind === 'gravup';
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      const rx = rect.w / 2;
      const ry = rect.h / 2;
      const color = up ? '#b07bff' : '#63e6ff';
      ctx.save();
      ctx.globalAlpha = (ghost ? 0.5 : 1) * (0.6 + 0.4 * Math.sin(this.time * 4));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#041018';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.72, ry * 0.8, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.72, ry * 0.8, 0, 0, TAU);
      ctx.stroke();
      const dir = up ? -1 : 1;
      ctx.strokeStyle = '#eae0ff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy - dir * ry * 0.35);
      ctx.lineTo(cx, cy + dir * ry * 0.35);
      ctx.moveTo(cx - rx * 0.22, cy + dir * ry * 0.12);
      ctx.lineTo(cx, cy + dir * ry * 0.35);
      ctx.lineTo(cx + rx * 0.22, cy + dir * ry * 0.12);
      ctx.stroke();
      ctx.restore();
    } else if (item.kind === 'portal') {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      const rx = rect.w / 2;
      const ry = rect.h / 2;
      const color = PORTAL_COLORS[item.form] ?? COLORS.bubble;
      ctx.globalAlpha = (ghost ? 0.5 : 1) * (0.6 + 0.4 * Math.sin(this.time * 4));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#041018';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.72, ry * 0.8, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.72, ry * 0.8, 0, 0, TAU);
      ctx.stroke();
      if (item.form === 'stingray') {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 0.7, ry * 0.78, 0, 0, TAU);
        ctx.clip();
        ctx.translate(cx, cy);
        drawSpottedRay(ctx, rect.w * 0.32, this.time);
        ctx.restore();
      } else {
        drawText(ctx, RUSH_KIND_LABELS[item.form] ?? '', cx, cy, { size: 11, color });
      }
    }
    ctx.restore();
    if (this.drag && this.drag.item === item) {
      strokeRoundRect(ctx, rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8, 8, COLORS.accent, 2);
    }
  }

  renderSlider(ctx) {
    const { x, y, w, h } = SLIDER;
    fillRoundRect(ctx, x, y, w, h, h / 2, 'rgba(4, 16, 29, 0.72)');
    strokeRoundRect(ctx, x, y, w, h, h / 2, 'rgba(207, 239, 255, 0.3)', 1.5);
    const cx = this.sliderX(this.cursorX);
    fillRoundRect(ctx, x, y, Math.max(0, cx - x), h, h / 2, 'rgba(99, 230, 255, 0.35)');
    const gx = this.sliderX(this.goal);
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(gx - 1, y - 4, 2, h + 8);
    fillRoundRect(ctx, cx - 7, y - 4, 14, h + 8, 7, COLORS.accent);
    drawText(ctx, 'DRAG TO SCRUB THE COURSE', x + w / 2, y - 9, {
      size: 9,
      color: COLORS.textDim,
      alpha: 0.7,
    });
  }

  renderButton(ctx, rect, label, active) {
    fillRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 9, active ? 'rgba(255, 209, 102, 0.9)' : 'rgba(10, 39, 64, 0.9)');
    strokeRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 9, 'rgba(207, 239, 255, 0.4)', 1.5);
    drawText(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2, {
      size: 12,
      color: active ? '#10233a' : COLORS.text,
    });
  }

  renderList(ctx) {
    fillRoundRect(ctx, PANEL_X, PANEL_TOP, PANEL_W, PANEL_BOTTOM - PANEL_TOP, 14, 'rgba(8, 28, 40, 0.92)');
    strokeRoundRect(ctx, PANEL_X, PANEL_TOP, PANEL_W, PANEL_BOTTOM - PANEL_TOP, 14, 'rgba(207, 239, 255, 0.25)', 2);
    drawText(ctx, 'ITEMS', PANEL_X + PANEL_W / 2, PANEL_TOP + 8, {
      size: 10,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 8,
    });
    for (let row = 0; row < VISIBLE_ROWS; row += 1) {
      const index = this.itemScroll + row;
      if (index >= ITEM_LIST.length) break;
      const item = ITEM_LIST[index];
      const y = LIST_TOP + row * ROW_H;
      const active = index === this.itemIndex;
      if (active) fillRoundRect(ctx, PANEL_X + 8, y + 2, PANEL_W - 16, ROW_H - 4, 6, 'rgba(255, 209, 102, 0.18)');
      drawText(ctx, item.label, PANEL_X + 16, y + ROW_H / 2, {
        size: 10,
        color: active ? COLORS.accent : item.group === 'mode' ? COLORS.foam : COLORS.text,
        align: 'left',
        alpha: active ? 1 : 0.85,
      });
      if (item.group === 'mode') {
        fillCircle(ctx, PANEL_X + PANEL_W - 16, y + ROW_H / 2, 3, item.color ?? PORTAL_COLORS[item.form] ?? COLORS.bubble);
      }
    }
    const cx = PANEL_X + PANEL_W / 2;
    if (ITEM_LIST.length > VISIBLE_ROWS) {
      const trackX = PANEL_X + PANEL_W - 7;
      const trackTop = LIST_TOP;
      const trackH = VISIBLE_ROWS * ROW_H;
      const maxScroll = ITEM_LIST.length - VISIBLE_ROWS;
      fillRoundRect(ctx, trackX - 2, trackTop, 4, trackH, 2, 'rgba(207, 239, 255, 0.15)');
      const thumbH = Math.max(20, trackH * (VISIBLE_ROWS / ITEM_LIST.length));
      const thumbY = trackTop + (trackH - thumbH) * (this.itemScroll / maxScroll);
      fillRoundRect(ctx, trackX - 3, thumbY, 6, thumbH, 3, 'rgba(207, 239, 255, 0.6)');
    }
    if (this.itemScroll > 0) {
      ctx.fillStyle = 'rgba(207, 239, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(cx - 6, PANEL_TOP + 28);
      ctx.lineTo(cx + 6, PANEL_TOP + 28);
      ctx.lineTo(cx, PANEL_TOP + 23);
      ctx.fill();
    }
    if (this.itemScroll + VISIBLE_ROWS < ITEM_LIST.length) {
      ctx.fillStyle = 'rgba(207, 239, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(cx - 6, PANEL_BOTTOM - 18);
      ctx.lineTo(cx + 6, PANEL_BOTTOM - 18);
      ctx.lineTo(cx, PANEL_BOTTOM - 13);
      ctx.fill();
    }
    drawText(ctx, 'Q / E OR WHEEL — SCROLL     1-0 — PICK', cx, PANEL_BOTTOM + 12, {
      size: 9,
      color: COLORS.textDim,
      alpha: 0.8,
    });
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, H, this.time, WATER_PALETTE);
    drawText(ctx, 'REEF RUSH — COURSE BUILDER', PLAY_W / 2, 48, {
      size: 28,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 20,
    });
    drawText(ctx, 'PIECES ARE HAZARDS/BLOCKS/PICKUPS — MODES ARE PORTALS THAT CHANGE YOUR SWIMMER', PLAY_W / 2, 78, {
      size: 10,
      color: COLORS.foam,
      alpha: 0.85,
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, AREA_TOP, PLAY_W, AREA_BOTTOM - AREA_TOP);
    ctx.clip();
    const cam = this.cameraX();
    ctx.translate(-cam, 0);
    ctx.fillStyle = 'rgba(6, 26, 38, 0.9)';
    ctx.fillRect(cam, GROUND_Y, PLAY_W, H - GROUND_Y);
    ctx.strokeStyle = 'rgba(120, 220, 230, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cam, GROUND_Y);
    ctx.lineTo(cam + PLAY_W, GROUND_Y);
    ctx.stroke();
    for (const item of this.items) this.drawItem(ctx, item);
    const ghost = { kind: this.kind(), x: this.cursorX, h: this.height(), count: 1, form: this.form(), base: this.baseFor(this.kind(), this.cursorX) };
    this.drawItem(ctx, ghost, true);
    ctx.strokeStyle = 'rgba(99, 230, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(this.cursorX, AREA_TOP);
    ctx.lineTo(this.cursorX, GROUND_Y + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    strokeRoundRect(ctx, 0, AREA_TOP, PLAY_W, AREA_BOTTOM - AREA_TOP, 0, 'rgba(207, 239, 255, 0.18)', 1.5);

    this.renderList(ctx);

    this.renderSlider(ctx);

    this.renderButton(ctx, ACTIONS.test, 'TEST', false);
    this.renderButton(ctx, ACTIONS.testHere, 'TEST HERE', false);
    this.renderButton(ctx, ACTIONS.clear, 'CLEAR', false);
    this.renderButton(ctx, ACTIONS.goalDown, 'G-', false);
    this.renderButton(ctx, ACTIONS.goalUp, 'G+', false);
    drawText(ctx, `GOAL ${this.goal}`, 492, 511, { size: 12, color: COLORS.accent, align: 'left' });
    drawText(ctx, `X ${Math.round(this.cursorX)}  ·  ${this.items.length} BLOCKS  ·  H ${Math.round(this.height())}`, PLAY_W / 2, 484, {
      size: 12,
      color: COLORS.textDim,
    });

    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, PLAY_W / 2, 118, {
        size: 12,
        color: COLORS.text,
        alpha: Math.min(1, this.statusTimer),
      });
    }
    drawText(
      ctx,
      'ARROWS — MOVE / SIZE      Q/E — SCROLL ITEMS      ENTER/CLICK — PLACE (CLICK ROCK AGAIN STACKS)      DRAG UP/DOWN — RESIZE      X — REMOVE      P — TEST      T — TEST HERE      C — CLEAR      ESC — SAVE',
      PLAY_W / 2,
      H - 10,
      { size: 9, color: COLORS.textDim, alpha: 0.75 },
    );
  }
}