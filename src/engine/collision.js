import { clamp } from './math.js';

export function circleOverlap(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const reach = a.radius + b.radius;
  return dx * dx + dy * dy <= reach * reach;
}

export function resolveCircleRect(entity, rect) {
  const closestX = clamp(entity.x, rect.x, rect.x + rect.w);
  const closestY = clamp(entity.y, rect.y, rect.y + rect.h);
  const dx = entity.x - closestX;
  const dy = entity.y - closestY;
  const distanceSq = dx * dx + dy * dy;
  if (distanceSq >= entity.radius * entity.radius) return false;
  if (distanceSq > 0.0001) {
    const distance = Math.sqrt(distanceSq);
    const push = entity.radius - distance;
    entity.x += (dx / distance) * push;
    entity.y += (dy / distance) * push;
  } else {
    const left = entity.x - rect.x;
    const right = rect.x + rect.w - entity.x;
    const top = entity.y - rect.y;
    const bottom = rect.y + rect.h - entity.y;
    const smallest = Math.min(left, right, top, bottom);
    if (smallest === left) entity.x = rect.x - entity.radius;
    else if (smallest === right) entity.x = rect.x + rect.w + entity.radius;
    else if (smallest === top) entity.y = rect.y - entity.radius;
    else entity.y = rect.y + rect.h + entity.radius;
  }
  return true;
}
