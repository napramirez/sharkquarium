import { clamp } from './math.js';
import { loadJSON, saveJSON } from './storage.js';
import { RUSH_BUILDER_KEY, RUSH_COURSES_KEY } from '../config.js';

export const RUSH_KINDS = ['shell', 'seaweed', 'rock', 'ceilrock', 'fakerock', 'ceilfakerock', 'ceilshell', 'ceilweed', 'pearl', 'bubble', 'gravity', 'gravpad', 'ceilgravpad', 'pad', 'ceilpad', 'ledge', 'slopeup', 'slopedown', 'portal', 'gravup', 'gravdown'];

export const RUSH_PORTAL_FORMS = ['fish', 'stingray', 'eel', 'crab', 'urchin', 'jelly', 'nautilus', 'shrimp'];

export const RUSH_KIND_LABELS = {
  shell: 'SHELL',
  seaweed: 'SEAWEED',
  rock: 'ROCK',
  ceilrock: 'CEILING ROCK',
  fakerock: 'FAKE ROCK',
  ceilfakerock: 'CEILING FAKE ROCK',
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
  slopeup: 'SLOPE UP',
  slopedown: 'SLOPE DOWN',
  portal: 'PORTAL',
  gravup: 'GRAVITY PORTAL',
  gravdown: 'NORMAL GRAVITY PORTAL',
  fish: 'FISH',
  stingray: 'STINGRAY',
  eel: 'DART EEL',
  crab: 'CRAB',
  urchin: 'URCHIN',
  jelly: 'JELLY',
  nautilus: 'NAUTILUS',
  shrimp: 'SHRIMP',
};

export const RUSH_META = {
  shell: { w: 34, ground: true },
  seaweed: { w: 36, ground: true },
  rock: { size: 48, ground: true },
  ceilrock: { size: 48, ceiling: true },
  fakerock: { size: 48, ground: true },
  ceilfakerock: { size: 48, ceiling: true },
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
  slopeup: { w: 150, ground: true },
  slopedown: { w: 150, ground: true },
  portal: { w: 64, h: 96, ground: false },
  gravup: { w: 64, h: 96, ground: false },
  gravdown: { w: 64, h: 96, ground: false },
};

export const RUSH_HEIGHTS = {
  shell: [34, 60, 90],
  seaweed: [20, 32, 46],
  rock: [40, 64, 88],
  ceilrock: [40, 64, 88],
  fakerock: [40, 64, 88],
  ceilfakerock: [40, 64, 88],
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
  slopeup: [40, 70, 100, 130],
  slopedown: [40, 70, 100, 130],
  portal: [90, 130, 170],
  gravup: [90, 130, 170],
  gravdown: [90, 130, 170],
};

const REMOVED_KINDS = { stingray: 'stingray', jelly: 'jelly', eel: 'eel', urchin: 'urchin' };

const RUSH_DEFAULT_NAME = 'MY COURSE';
const RUSH_NAME_MAX = 20;

export const RUSH_GRID = 20;
export const RUSH_MAX_X = 20000;
export const RUSH_MAX_LIFT = 400;

export function rushItemRect(item, groundY, ceilingY = 0) {
  const meta = RUSH_META[item.kind] ?? RUSH_META.shell;
  const h = item.h;
  let rect;
  if (item.kind === 'fakerock' || item.kind === 'ceilfakerock') {
    const size = h;
    const count = Math.max(1, item.count || 1);
    const base = item.base || 0;
    rect = item.kind === 'ceilfakerock'
      ? { x: item.x - size / 2, y: ceilingY + base, w: size, h: count * size * 0.85 }
      : { x: item.x - size / 2, y: groundY - base - count * size * 0.85, w: size, h: count * size * 0.85 };
  } else if (item.kind === 'rock') {
    const size = h;
    const count = Math.max(1, item.count || 1);
    rect = { x: item.x - size / 2, y: groundY - (item.base || 0) - count * size * 0.85, w: size, h: count * size * 0.85 };
  } else if (item.kind === 'ceilrock') {
    const size = h;
    const count = Math.max(1, item.count || 1);
    rect = { x: item.x - size / 2, y: ceilingY + (item.base || 0), w: size, h: count * size * 0.85 };
  } else if (item.kind === 'ledge') {
    const w = meta.w;
    rect = { x: item.x - w / 2, y: groundY - h, w, h: meta.t };
  } else if (meta.ceiling) {
    const w = meta.w;
    rect = { x: item.x - w / 2, y: ceilingY + (item.base || 0), w, h };
  } else if (meta.ground) {
    const w = meta.w;
    rect = { x: item.x - w / 2, y: groundY - (item.base || 0) - h, w, h };
  } else if (item.kind === 'portal' || item.kind === 'gravup' || item.kind === 'gravdown') {
    rect = { x: item.x - meta.w / 2, y: groundY - h - meta.h / 2, w: meta.w, h: meta.h };
  } else {
    const r = meta.r ?? 14;
    rect = { x: item.x - r, y: groundY - h - r, w: r * 2, h: r * 2 };
  }
  rect.y -= Number(item.lift) || 0;
  return rect;
}

function normalizeItem(item) {
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
    lift: clamp(Number(item.lift) || 0, -RUSH_MAX_LIFT, RUSH_MAX_LIFT),
    form,
  };
}

function normalizeItems(items) {
  return Array.isArray(items) ? items.map(normalizeItem) : [];
}

function normalizeGoal(value) {
  return clamp(Math.round(Number(value) || 4000), 1200, RUSH_MAX_X);
}

function serializeItem(item) {
  return {
    kind: item.kind,
    x: item.x,
    h: item.h,
    count: item.count || 1,
    base: item.base || 0,
    lift: item.lift || 0,
    form: item.form || 'stingray',
  };
}

function serializeItems(items) {
  return items.map(serializeItem);
}

function makeCourse(id, name, goal, items) {
  const label = String(name ?? '').trim().slice(0, RUSH_NAME_MAX);
  return {
    id,
    name: label || RUSH_DEFAULT_NAME,
    goal: normalizeGoal(goal),
    items: normalizeItems(items),
  };
}

function nextCourseId(courses) {
  let max = 0;
  for (const course of courses) {
    const n = Number(String(course.id).replace(/^c/, ''));
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `c${max + 1}`;
}

export function loadRushCourses() {
  const saved = loadJSON(RUSH_COURSES_KEY, null);
  if (saved && Array.isArray(saved.courses) && saved.courses.length > 0) {
    const seen = new Set();
    const courses = saved.courses.map((raw, index) => {
      let id = typeof raw.id === 'string' && raw.id ? raw.id : `c${index + 1}`;
      while (seen.has(id)) id = `c${seen.size + 1}-${index}`;
      seen.add(id);
      return makeCourse(id, raw.name ?? `COURSE ${index + 1}`, raw.goal, raw.items);
    });
    const activeId = courses.some((course) => course.id === saved.activeId) ? saved.activeId : courses[0].id;
    return { activeId, courses };
  }
  const legacy = loadJSON(RUSH_BUILDER_KEY, { goal: 4000, items: [] });
  const migrated = makeCourse('c1', RUSH_DEFAULT_NAME, legacy.goal, legacy.items);
  return { activeId: migrated.id, courses: [migrated] };
}

export function saveRushCourses(state) {
  if (!state || !Array.isArray(state.courses) || state.courses.length === 0) return;
  const courses = state.courses.map((course) => ({
    id: course.id,
    name: String(course.name ?? RUSH_DEFAULT_NAME).trim().slice(0, RUSH_NAME_MAX) || RUSH_DEFAULT_NAME,
    goal: normalizeGoal(course.goal),
    items: serializeItems(course.items),
  }));
  const activeId = courses.some((course) => course.id === state.activeId) ? state.activeId : courses[0].id;
  saveJSON(RUSH_COURSES_KEY, { activeId, courses });
  const active = courses.find((course) => course.id === activeId) ?? courses[0];
  saveJSON(RUSH_BUILDER_KEY, { goal: active.goal, items: active.items });
}

export function activeRushCourse(state) {
  const list = state ?? loadRushCourses();
  return list.courses.find((course) => course.id === list.activeId) ?? list.courses[0];
}

export function loadRushCourse() {
  const course = activeRushCourse();
  return { goal: course.goal, items: course.items };
}

export function saveRushCourse(course) {
  const state = loadRushCourses();
  const active = activeRushCourse(state);
  if (!active) return;
  active.goal = normalizeGoal(course.goal);
  active.items = normalizeItems(course.items);
  saveRushCourses(state);
}

export function createRushCourse(name = '', options = {}) {
  const state = loadRushCourses();
  const id = nextCourseId(state.courses);
  const course = makeCourse(
    id,
    name || `COURSE ${state.courses.length + 1}`,
    options.goal ?? 4000,
    options.items ?? [],
  );
  state.courses.push(course);
  state.activeId = course.id;
  saveRushCourses(state);
  return course;
}

export function renameRushCourse(name) {
  const state = loadRushCourses();
  const active = activeRushCourse(state);
  if (!active) return null;
  const label = String(name ?? '').trim().slice(0, RUSH_NAME_MAX);
  if (!label) return active;
  active.name = label;
  saveRushCourses(state);
  return active;
}

export function setActiveRushCourse(id) {
  const state = loadRushCourses();
  const course = state.courses.find((entry) => entry.id === id);
  if (!course) return activeRushCourse(state);
  state.activeId = course.id;
  saveRushCourses(state);
  return course;
}

export function rushCourseHasItems(course) {
  return course.items.length > 0;
}

export function rushCourseCount(course) {
  return course.items.length;
}
