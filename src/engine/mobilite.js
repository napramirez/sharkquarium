import { drawText, fillRoundRect, strokeRoundRect } from './render.js';
import { COLORS } from '../config.js';

let active = false;

export function setMobilite(on) {
  active = Boolean(on);
}

export function isMobilite() {
  return active;
}

const LAYOUT = {
  w: { code: 'KeyW', label: 'W', x: 62, y: 414, w: 46, h: 42 },
  a: { code: 'KeyA', label: 'A', x: 12, y: 466, w: 46, h: 42 },
  s: { code: 'KeyS', label: 'S', x: 62, y: 466, w: 46, h: 42 },
  d: { code: 'KeyD', label: 'D', x: 112, y: 466, w: 46, h: 42 },
  space: { code: 'Space', label: 'SPACE', x: 196, y: 500, w: 300, h: 30 },
  e: { code: 'KeyE', label: 'E', x: 470, y: 466, w: 46, h: 42 },
  esc: { code: 'Escape', label: 'ESC', x: 886, y: 500, w: 60, h: 30 },
};

const KEY_W = 36;
const KEY_H = 30;
const KEY_GAP = 5;
const ROW_W = 10 * KEY_W + 9 * KEY_GAP;
const ROW_X = (960 - ROW_W) / 2;

function key(code, label, x, y, w = KEY_W, h = KEY_H) {
  return { code, label, x, y, w, h };
}

function chatKeyboard() {
  const rows = [];
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  digits.forEach((d, i) => rows.push(key(`Digit${d}`, d, ROW_X + i * (KEY_W + KEY_GAP), 352)));
  'QWERTYUIOP'.split('').forEach((c, i) => rows.push(key(`Key${c}`, c, ROW_X + i * (KEY_W + KEY_GAP), 387)));
  const asdfX = ROW_X + (ROW_W - (9 * KEY_W + 8 * KEY_GAP)) / 2;
  'ASDFGHJKL'.split('').forEach((c, i) => rows.push(key(`Key${c}`, c, asdfX + i * (KEY_W + KEY_GAP), 422)));
  const zRowW = 7 * KEY_W + 6 * KEY_GAP + KEY_GAP + 70;
  const zX = ROW_X + (ROW_W - zRowW) / 2;
  'ZXCVBNM'.split('').forEach((c, i) => rows.push(key(`Key${c}`, c, zX + i * (KEY_W + KEY_GAP), 457)));
  rows.push(key('Backspace', 'DEL', zX + 7 * (KEY_W + KEY_GAP) - KEY_GAP, 457, 70));
  const bottomW = 180 + 90 + 60 + 2 * KEY_GAP;
  const bX = ROW_X + (ROW_W - bottomW) / 2;
  rows.push(key('Space', 'SPACE', bX, 492, 180));
  rows.push(key('Enter', 'ENTER', bX + 180 + KEY_GAP, 492, 90));
  rows.push(key('Escape', 'ESC', bX + 180 + KEY_GAP + 90 + KEY_GAP, 492, 60));
  return rows;
}

const CHAT_KEYS = chatKeyboard();

export function mobiliteButtonsFor(sceneName, scene) {
  if (!active) return [];
  if (sceneName === 'chat') return CHAT_KEYS;
  if (sceneName === 'tag') {
    if (scene && scene.phase === 'names') return CHAT_KEYS;
    return [LAYOUT.w, LAYOUT.a, LAYOUT.s, LAYOUT.d, LAYOUT.space, LAYOUT.esc];
  }
  if (sceneName === 'reefrush') return [LAYOUT.space, LAYOUT.esc];
  if (sceneName === 'presentwrap' || sceneName === 'santapeek' || sceneName === 'jackhunt') {
    return [LAYOUT.w, LAYOUT.a, LAYOUT.s, LAYOUT.d, LAYOUT.e, LAYOUT.esc];
  }
  return [LAYOUT.w, LAYOUT.a, LAYOUT.s, LAYOUT.d, LAYOUT.space, LAYOUT.esc];
}

export function mobiliteHit(x, y, sceneName, scene) {
  return mobiliteButtonsFor(sceneName, scene).some(
    (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
  );
}

export function updateMobilite(input, sceneName, scene, held, physical) {
  if (!input) return held;
  if (!active) {
    for (const code of held) {
      input.down.delete(code);
      input.released.add(code);
    }
    held.clear();
    return held;
  }
  const buttons = mobiliteButtonsFor(sceneName, scene);
  const px = input.pointer.x;
  const py = input.pointer.y;
  const next = new Set();
  let captured = false;
  if (physical) {
    for (const b of buttons) {
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        next.add(b.code);
        captured = true;
      }
    }
  }
  for (const code of next) {
    if (!held.has(code)) input.pressed.add(code);
    input.down.add(code);
  }
  for (const code of held) {
    if (!next.has(code)) {
      input.down.delete(code);
      input.released.add(code);
    }
  }
  held.clear();
  for (const code of next) held.add(code);
  if (captured) {
    input.pressed.delete('PointerPrimary');
    input.down.delete('PointerPrimary');
    input.pointer.down = false;
    input.pointer.dragX = 0;
    input.pointer.dragY = 0;
  }
  return held;
}

export function renderMobilite(ctx, input, sceneName, scene, physical) {
  if (!active) return;
  const buttons = mobiliteButtonsFor(sceneName, scene);
  if (buttons.length === 0) return;
  const down = Boolean(physical);
  const px = input ? input.pointer.x : -1;
  const py = input ? input.pointer.y : -1;
  for (const b of buttons) {
    const pressed = down && px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
    fillRoundRect(
      ctx,
      b.x,
      b.y,
      b.w,
      b.h,
      10,
      pressed ? 'rgba(255, 209, 102, 0.92)' : 'rgba(8, 28, 40, 0.72)',
    );
    strokeRoundRect(
      ctx,
      b.x,
      b.y,
      b.w,
      b.h,
      10,
      pressed ? 'rgba(255, 209, 102, 0.95)' : 'rgba(207, 239, 255, 0.5)',
      1.6,
    );
    drawText(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2, {
      size: b.label.length > 4 ? 8 : b.label.length > 2 ? 10 : 14,
      color: pressed ? '#10233a' : COLORS.text,
    });
  }
}
