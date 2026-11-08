import { clamp } from './math.js';
import { loadJSON, saveJSON } from './storage.js';
import { RUSH_BUILDER_KEY } from '../config.js';

export const RUSH_KINDS = ['shell', 'seaweed', 'rock', 'ceilrock', 'ceilshell', 'ceilweed', 'pearl', 'bubble', 'gravity', 'gravpad', 'ceilgravpad', 'pad', 'ceilpad', 'ledge', 'portal'];

export const RUSH_PORTAL_FORMS = ['fish', 'stingray', 'eel', 'crab', 'urchin', 'jelly'];

export const RUSH_KIND_LABELS = {
  shell: 'SHELL',
  seaweed: 'SEAWEED',
  rock: 'ROCK',
  ceilrock: 'CEILING ROCK',
  ceilshell: 'CEILING SHELL',
  ceilweed: 'CEILING WEED',
  pearl: 'PEARL',
  bubble: 'PRESSURE BUBBLE',
  gravity: 'GRAVITY BUBBLE',
  gravpad: 'GRAVITY BUBBLE PAD',
  ceilgravpad: 'CEILING GRAVITY BUBBLE PAD',
  pad: 'THRUST BUBBLE PAD',
  ceilpad: 'CEILING THRUST BUBBLE PAD',
  ledge: 'FLOATING LEDGE',
  portal: 'PORTAL',
  fish: 'FISH',
  stingray: 'STINGRAY',
  eel: 'DART EEL',
  crab: 'CRAB',
  urchin: 'URCHIN',
  jelly: 'JELLY',
};

export const RUSH_META = {
  shell: { w: 34, ground: true },
  seaweed: { w: 36, ground: true },
  rock: { size: 48, ground: true },
  ceilrock: { size: 48, ceiling: true },
  ceilshell: { w: 34, ceiling: true },
  ceilweed: { w: 36, ceiling: true },
  pearl: { r: 14, ground: false },
  bubble: { r: 20, ground: false },
  gravity: { r: 20, ground: false },
  gravpad: { w: 46, ground: true },
  ceilgravpad: { w: 46, ceiling: true },
  pad: { w: 46, ground: true },
  ceilpad: { w: 46, ceiling: true },
  ledge: { w: 96, t: 16, ground: false },
  portal: { w: 64, h: 96, ground: false },
};

export const RUSH_HEIGHTS = {
  shell: [34, 60, 90],
  seaweed: [20, 32, 46],
  rock: [40, 64, 88],
  ceilrock: [40, 64, 88],
  ceilshell: [34, 60, 90],
  ceilweed: [20, 32, 46],
  pearl: [60, 110, 150],
  bubble: [70, 120, 170],
  gravity: [70, 120, 170],
  gravpad: [14, 20, 28],
  ceilgravpad: [14, 20, 28],
  pad: [14, 20, 28],
  ceilpad: [14, 20, 28],
  ledge: [30, 70, 110, 150, 190, 230, 270, 310, 350, 390],
  portal: [90, 130, 170],
};

const REMOVED_KINDS = { stingray: 'stingray', jelly: 'jelly', eel: 'eel', urchin: 'urchin' };

export const RUSH_GRID = 20;
export const RUSH_MAX_X = 20000;

export function rushItemRect(item, groundY, ceilingY = 0) {
  const meta = RUSH_META[item.kind] ?? RUSH_META.shell;
  const h = item.h;
  if (item.kind === 'rock') {
    const size = h;
    const count = Math.max(1, item.count || 1);
    return { x: item.x - size / 2, y: groundY - count * size * 0.85, w: size, h: count * size * 0.85 };
  }
  if (item.kind === 'ceilrock') {
    const size = h;
    const count = Math.max(1, item.count || 1);
    return { x: item.x - size / 2, y: ceilingY, w: size, h: count * size * 0.85 };
  }
  if (item.kind === 'ledge') {
    const w = meta.w;
    return { x: item.x - w / 2, y: groundY - h, w, h: meta.t };
  }
  if (meta.ceiling) {
    const w = meta.w;
    return { x: item.x - w / 2, y: ceilingY + (item.base || 0), w, h };
  }
  if (meta.ground) {
    const w = meta.w;
    return { x: item.x - w / 2, y: groundY - (item.base || 0) - h, w, h };
  }
  if (item.kind === 'portal') {
    return { x: item.x - meta.w / 2, y: groundY - h - meta.h / 2, w: meta.w, h: meta.h };
  }
  const r = meta.r ?? 14;
  return { x: item.x - r, y: groundY - h - r, w: r * 2, h: r * 2 };
}

export function loadRushCourse() {
  const saved = loadJSON(RUSH_BUILDER_KEY, { goal: 4000, items: [] });
  const items = Array.isArray(saved.items)
    ? saved.items.map((item) => {
        const removed = REMOVED_KINDS[item.kind];
        const kind = item.kind === 'crater' ? 'gravpad' : RUSH_KINDS.includes(item.kind) ? item.kind : removed ? 'portal' : 'shell';
        const form = removed
          ? removed
          : RUSH_PORTAL_FORMS.includes(item.form)
            ? item.form
            : item.form === 'wave'
              ? 'eel'
              : 'stingray';
        return {
          kind,
          x: clamp(Number(item.x) || 0, 0, RUSH_MAX_X),
          h: Math.max(12, Number(item.h) || 30),
          count: Math.max(1, Math.round(Number(item.count) || 1)),
          base: Math.max(0, Number(item.base) || 0),
          form,
        };
      })
    : [];
  const goal = clamp(Math.round(Number(saved.goal) || 4000), 1200, RUSH_MAX_X);
  return { goal, items };
}

export function saveRushCourse(course) {
  saveJSON(RUSH_BUILDER_KEY, {
    goal: clamp(Math.round(course.goal) || 4000, 1200, RUSH_MAX_X),
    items: course.items.map((item) => ({
      kind: item.kind,
      x: item.x,
      h: item.h,
      count: item.count || 1,
      base: item.base || 0,
      form: item.form || 'stingray',
    })),
  });
}

export function rushCourseHasItems(course) {
  return course.items.length > 0;
}

export function rushCourseCount(course) {
  return course.items.length;
}