import { clamp } from './math.js';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

const FOV = Math.PI / 3;
const COLUMNS = 200;
const WALL_HEIGHT = 260;
const CAMERA_HEIGHT = 60;
const MAX_DISTANCE = 70;

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rayBox(ox, oz, dx, dz, box) {
  const invX = 1 / (dx || 1e-9);
  const invZ = 1 / (dz || 1e-9);
  const x1 = (box.x - ox) * invX;
  const x2 = (box.x + box.w - ox) * invX;
  const z1 = (box.y - oz) * invZ;
  const z2 = (box.y + box.h - oz) * invZ;
  const tmin = Math.max(Math.min(x1, x2), Math.min(z1, z2));
  const tmax = Math.min(Math.max(x1, x2), Math.max(z1, z2));
  if (tmax < Math.max(tmin, 0)) return Infinity;
  return tmin > 0 ? tmin : Infinity;
}

function raySegment(ox, oz, dx, dz, x1, z1, x2, z2) {
  const ex = x2 - x1;
  const ez = z2 - z1;
  const denom = dx * ez - dz * ex;
  if (Math.abs(denom) < 1e-9) return Infinity;
  const t = ((x1 - ox) * ez - (z1 - oz) * ex) / denom;
  const u = ((x1 - ox) * dz - (z1 - oz) * dx) / denom;
  if (t <= 0.0001 || u < 0 || u > 1) return Infinity;
  return t;
}

export function firstPersonCamera(scene) {
  const actor = scene.firstPersonActor ? scene.firstPersonActor() : null;
  const bounds =
    (scene.firstPersonBounds && scene.firstPersonBounds()) || {
      x: 0,
      y: 0,
      w: LOGICAL_WIDTH,
      h: LOGICAL_HEIGHT,
    };
  return {
    x: actor ? actor.x : bounds.x + bounds.w / 2,
    z: actor ? actor.y : bounds.y + bounds.h / 2,
    yaw: scene.firstPersonYaw ?? 0,
  };
}

export function collectWalls(scene) {
  const boxes = [];
  const add = (x, y, w, h) => {
    if (w > 0 && h > 0) boxes.push({ x, y, w, h });
  };
  if (Array.isArray(scene.walls)) for (const wall of scene.walls) add(wall.x, wall.y, wall.w, wall.h);
  if (scene.labyrinth && Array.isArray(scene.labyrinth.walls)) {
    for (const wall of scene.labyrinth.walls) add(wall.x, wall.y, wall.w, wall.h);
  }
  if (Array.isArray(scene.supports)) {
    for (const support of scene.supports) add(support.x - 27, 0, 54, LOGICAL_HEIGHT);
  }
  const bounds =
    (scene.firstPersonBounds && scene.firstPersonBounds()) || {
      x: 0,
      y: 0,
      w: LOGICAL_WIDTH,
      h: LOGICAL_HEIGHT,
    };
  const segments = [
    { x1: bounds.x, z1: bounds.y, x2: bounds.x + bounds.w, z2: bounds.y },
    { x1: bounds.x + bounds.w, z1: bounds.y, x2: bounds.x + bounds.w, z2: bounds.y + bounds.h },
    { x1: bounds.x + bounds.w, z1: bounds.y + bounds.h, x2: bounds.x, z2: bounds.y + bounds.h },
    { x1: bounds.x, z1: bounds.y + bounds.h, x2: bounds.x, z2: bounds.y },
  ];
  return { boxes, segments, bounds };
}

export function renderFirstPersonLevel(ctx, scene) {
  const camera = firstPersonCamera(scene);
  const { boxes, segments, bounds } = collectWalls(scene);
  const palette = (scene.firstPersonPalette && scene.firstPersonPalette()) || {
    top: '#04121c',
    bottom: '#01040a',
    wall: '#3a4a52',
  };
  const horizon = LOGICAL_HEIGHT * 0.5;
  const projection = LOGICAL_WIDTH / 2 / Math.tan(FOV / 2);
  const wallRgb = hexToRgb(palette.wall ?? '#3a4a52');

  const ceiling = ctx.createLinearGradient(0, 0, 0, horizon);
  ceiling.addColorStop(0, palette.top);
  ceiling.addColorStop(1, '#020a12');
  ctx.fillStyle = ceiling;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, horizon);
  const floor = ctx.createLinearGradient(0, horizon, 0, LOGICAL_HEIGHT);
  floor.addColorStop(0, '#031019');
  floor.addColorStop(1, palette.bottom);
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizon, LOGICAL_WIDTH, LOGICAL_HEIGHT - horizon);

  const colWidth = LOGICAL_WIDTH / COLUMNS;
  const depths = new Array(COLUMNS).fill(Infinity);
  const maxDistance = scene.firstPersonRange ?? MAX_DISTANCE;
  const fog = scene.firstPersonFog ?? 100;
  const shadeFloor = scene.firstPersonShadeFloor ?? 0.14;
  for (let index = 0; index < COLUMNS; index += 1) {
    const rayAngle = camera.yaw - FOV / 2 + (index / COLUMNS) * FOV;
    const dx = Math.cos(rayAngle);
    const dz = Math.sin(rayAngle);
    let distance = Infinity;
    for (const box of boxes) {
      const hit = rayBox(camera.x, camera.z, dx, dz, box);
      if (hit < distance) distance = hit;
    }
    for (const segment of segments) {
      const hit = raySegment(
        camera.x,
        camera.z,
        dx,
        dz,
        segment.x1,
        segment.z1,
        segment.x2,
        segment.z2,
      );
      if (hit < distance) distance = hit;
    }
    if (!Number.isFinite(distance)) distance = maxDistance;
    depths[index] = distance;
    const height = clamp((projection * WALL_HEIGHT) / distance, 0, LOGICAL_HEIGHT * 2.6);
    const top = horizon - height / 2;
    const shade = clamp(1 - distance / fog, shadeFloor, 1);
    const stripe = index % 10 < 5 ? 1 : 0.85;
    const r = Math.round(wallRgb.r * shade * stripe + 8);
    const g = Math.round(wallRgb.g * shade * stripe + 10);
    const b = Math.round(wallRgb.b * shade * stripe + 12);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(index * colWidth, top, colWidth + 1, height);
  }

  scene.firstPersonDepths = depths;
  scene.firstPersonCols = COLUMNS;
  const sprites = drawSprites(ctx, scene, camera, projection, horizon);
  if (scene.firstPersonMinimap !== false) drawMinimap(ctx, camera, boxes, bounds, sprites);
}

function drawMinimap(ctx, camera, boxes, bounds, sprites) {
  const maxWidth = 172;
  const maxHeight = 128;
  const spanX = Math.max(1, bounds.w);
  const spanZ = Math.max(1, bounds.h);
  const scale = Math.min(maxWidth / spanX, maxHeight / spanZ);
  const width = Math.max(24, spanX * scale);
  const height = Math.max(24, spanZ * scale);
  const originX = LOGICAL_WIDTH - width - 20;
  const originY = 20;

  ctx.save();
  ctx.fillStyle = 'rgba(3, 12, 20, 0.72)';
  ctx.fillRect(originX - 6, originY - 6, width + 12, height + 12);
  ctx.strokeStyle = 'rgba(207, 239, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(originX - 6, originY - 6, width + 12, height + 12);
  ctx.strokeStyle = 'rgba(207, 239, 255, 0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(originX, originY, width, height);

  ctx.fillStyle = 'rgba(150, 180, 200, 0.5)';
  for (const box of boxes) {
    ctx.fillRect(
      originX + (box.x - bounds.x) * scale,
      originY + (box.y - bounds.y) * scale,
      Math.max(1, box.w * scale),
      Math.max(1, box.h * scale),
    );
  }

  ctx.fillStyle = COLORS.accent;
  for (const sprite of sprites) {
    ctx.fillRect(
      originX + (sprite.entity.x - bounds.x) * scale - 1.5,
      originY + (sprite.entity.y - bounds.y) * scale - 1.5,
      3,
      3,
    );
  }

  const playerX = originX + (camera.x - bounds.x) * scale;
  const playerY = originY + (camera.z - bounds.y) * scale;
  ctx.strokeStyle = COLORS.danger;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playerX, playerY);
  ctx.lineTo(playerX + Math.cos(camera.yaw) * 9, playerY + Math.sin(camera.yaw) * 9);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSprites(ctx, scene, camera, projection, horizon) {
  const actor = scene.firstPersonActor ? scene.firstPersonActor() : null;
  const list = scene.firstPersonSprites ? scene.firstPersonSprites() : [];
  const sprites = [];
  for (const entity of list) {
    if (!entity || entity === actor || typeof entity._draw !== 'function') continue;
    if (entity.alive === false) continue;
    if (!Number.isFinite(entity.x) || !Number.isFinite(entity.y)) continue;
    const radius = entity.radius ?? 0;
    if (radius < 3) continue;
    const dx = entity.x - camera.x;
    const dz = entity.y - camera.z;
    const forward = dx * Math.cos(camera.yaw) + dz * Math.sin(camera.yaw);
    if (forward <= 12) continue;
    const lateral = -dx * Math.sin(camera.yaw) + dz * Math.cos(camera.yaw);
    const screenX = LOGICAL_WIDTH / 2 + (lateral / forward) * projection;
    if (screenX < -140 || screenX > LOGICAL_WIDTH + 140) continue;
    const size = clamp((radius * 2.6 * projection) / forward, 4, 720);
    const bottom = horizon + (CAMERA_HEIGHT * projection) / forward;
    sprites.push({ entity, forward, screenX, size, bottom });
  }
  sprites.sort((a, b) => b.forward - a.forward);
  const depths = scene.firstPersonDepths;
  for (const sprite of sprites) {
    const column = clamp(
      Math.round((sprite.screenX / LOGICAL_WIDTH) * scene.firstPersonCols),
      0,
      scene.firstPersonCols - 1,
    );
    const wallDepth = depths ? depths[column] : Infinity;
    if (sprite.forward > wallDepth + 6) continue;
    const scale = sprite.size / Math.max(1, (sprite.entity.radius ?? 14) * 2);
    ctx.save();
    ctx.translate(sprite.screenX, sprite.bottom - sprite.size / 2);
    ctx.scale(scale, scale);
    const ox = sprite.entity.x;
    const oy = sprite.entity.y;
    sprite.entity.x = 0;
    sprite.entity.y = 0;
    sprite.entity._draw(ctx);
    sprite.entity.x = ox;
    sprite.entity.y = oy;
    ctx.restore();
  }
  return sprites;
}
