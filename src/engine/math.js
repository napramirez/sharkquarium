export const TAU = Math.PI * 2;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const lerp = (from, to, t) => from + (to - from) * t;

export function lerpAngle(from, to, t) {
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return from + delta * t;
}

export const rand = (min, max) => min + Math.random() * (max - min);

export const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
