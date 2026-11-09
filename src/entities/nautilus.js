import { Entity } from './entity.js';
import { clamp, lerp, TAU } from '../engine/math.js';
import { CONTROLS, NAUTILUS, PLAYER, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';

export class Nautilus extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: NAUTILUS.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.maxSpeed = NAUTILUS.maxSpeed;
    this.freeVertical = options.vertical ?? false;
    this.autoScrollY = y;
    this.facing = 1;
    this.facingTarget = 1;
    this.speed = 0;
    this.invulnerable = 0;
    this.tangleTimer = 0;
    this.jacketFit = { x: -0.2, y: 0, rx: 0.85, ry: 0.8 };
  }

  tangle(duration) {
    this.tangleTimer = Math.max(this.tangleTimer, duration);
  }

  update(dt, input) {
    super.update(dt);
    if (input && typeof input.wasPressed === 'function' && input.wasPressed('KeyV')) startEmote(this);
    updateEmote(this, dt);
    let horizontal = (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    let vertical = this.freeVertical
      ? (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0)
      : 0;
    if (this.pointerSteering && (input.pointer.down || input.pointer.look)) {
      const drag = Math.hypot(input.pointer.dragX, input.pointer.dragY);
      if (drag > PLAYER.pointerDeadzone) {
        horizontal = input.pointer.dragX / drag;
        if (this.freeVertical) vertical = input.pointer.dragY / drag;
      }
    }
    if (this.tangleTimer > 0) {
      this.tangleTimer -= dt;
      horizontal *= 0.35;
    }
    const response = 1 - Math.exp(-NAUTILUS.response * dt);
    this.vx = lerp(this.vx, clamp(horizontal, -1, 1) * NAUTILUS.maxSpeed, response);
    this.vy = this.freeVertical
      ? lerp(this.vy, clamp(vertical, -1, 1) * NAUTILUS.maxSpeed, response)
      : 0;
    this.x += this.vx * dt;
    this.x = clamp(this.x, this.radius, this.maxX - this.radius);
    if (this.freeVertical) {
      this.y += this.vy * dt;
      this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
    } else {
      this.y += (this.autoScrollY - this.y) * (1 - Math.exp(-6 * dt));
    }
    this.speed = Math.hypot(this.vx, this.vy);
    if (this.speed > 24) this.facingTarget = this.vx > 0 ? -1 : 1;
    this.facing = lerp(this.facing, this.facingTarget, 1 - Math.exp(-10 * dt));
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  render(ctx) {
    const radius = this.radius;
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(this.age * 3) * 1.5);
    ctx.scale(this.facing, 1);
    if (flash) ctx.globalAlpha = 0.4;
    drawNautilusBody(ctx, radius, this);
    drawAccessory(ctx, radius, this.age, { entity: this, flip: this.facing ?? 1 });
    drawEmote(ctx, this, radius, this.age);
    ctx.restore();
  }
}

export function drawNautilusBody(ctx, radius, pose) {
  const age = pose.age ?? 0;
  const R = radius * 1.05;
  const gap = Math.PI / 4;
  const shellBody = pose.natural ? COLORS.nautilusShell : playerColor('body', COLORS.nautilusShell);
  const shellDark = pose.natural ? COLORS.nautilusShellDark : playerColor('accent', COLORS.nautilusShellDark);
  const hoodBrown = '#4a2f1c';
  const flesh = pose.natural ? COLORS.nautilusSkin : playerColor('belly', COLORS.nautilusSkin);

  ctx.save();
  ctx.scale(-1, 1);
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.ellipse(R * 0.06, 0, R * 0.46, R * 0.52, 0, 0, TAU);
  ctx.fillStyle = 'rgba(48, 33, 22, 0.6)';
  ctx.fill();

  const shellPath = () => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, gap, TAU - gap, false);
    ctx.closePath();
  };

  shellPath();
  ctx.fillStyle = shellBody;
  ctx.fill();

  ctx.save();
  shellPath();
  ctx.clip();
  for (let i = 0, a = gap + 0.22; a < TAU - gap - 0.12; i += 1, a += 0.33) {
    const w = 0.085;
    const twist = 0.3;
    const inner = R * 0.08;
    const outer = R * 1.1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - w) * inner, Math.sin(a - w) * inner);
    ctx.lineTo(Math.cos(a - w + twist) * outer, Math.sin(a - w + twist) * outer);
    ctx.lineTo(Math.cos(a + w + twist) * outer, Math.sin(a + w + twist) * outer);
    ctx.lineTo(Math.cos(a + w) * inner, Math.sin(a + w) * inner);
    ctx.closePath();
    ctx.globalAlpha = i % 2 === 0 ? 0.5 : 0.32;
    ctx.fillStyle = hoodBrown;
    ctx.fill();
  }
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = hoodBrown;
  for (let k = 1; k <= 3; k += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, R * (0.25 + k * 0.19), gap + 0.06, TAU - gap - 0.06, false);
    ctx.lineWidth = R * 0.018;
    ctx.stroke();
  }
  ctx.restore();

  shellPath();
  ctx.strokeStyle = shellDark;
  ctx.lineWidth = R * 0.07;
  ctx.stroke();

  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.9, gap + 0.05, TAU - gap - 0.05, false);
  ctx.lineWidth = R * 0.026;
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.moveTo(R * 0.04, -R * 0.04);
  ctx.quadraticCurveTo(R * 0.2, -R * 0.3, R * 0.46, -R * 0.16);
  ctx.quadraticCurveTo(R * 0.74, -R * 0.04, R * 0.72, R * 0.26);
  ctx.quadraticCurveTo(R * 0.66, R * 0.5, R * 0.4, R * 0.44);
  ctx.quadraticCurveTo(R * 0.2, R * 0.36, R * 0.04, R * 0.04);
  ctx.closePath();
  ctx.fillStyle = flesh;
  ctx.fill();

  for (let i = 0; i < 9; i += 1) {
    const t = i / 8;
    const spread = -0.5 + t * 1.7;
    const sway = Math.sin(age * 4 + i * 1.3) * 0.14;
    const len = R * (0.76 + 0.12 * Math.sin(i * 2.1));
    const bx = R * 0.34;
    const by = R * (0.04 + (t - 0.5) * 0.34);
    const angle = spread + sway;
    const ex = bx + Math.cos(angle) * len;
    const ey = by + Math.sin(angle) * len;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(
      bx + Math.cos(spread) * len * 0.6,
      by + Math.sin(spread) * len * 0.5 + R * 0.1,
      ex,
      ey,
    );
    ctx.strokeStyle = i % 3 === 0 ? shellDark : flesh;
    ctx.lineWidth = R * (0.076 - t * 0.019);
    ctx.stroke();
    for (let s = 1; s <= 3; s += 1) {
      const u = s / 4;
      const px = bx + (ex - bx) * u;
      const py = by + (ey - by) * u;
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = shellDark;
      ctx.beginPath();
      ctx.arc(px, py, radius * 0.024, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const eyes = [
    [0.36, 0.24],
    [0.64, 0.28],
  ];
  for (const [ex, ey] of eyes) {
    ctx.beginPath();
    ctx.ellipse(R * ex, R * ey, R * 0.108, R * 0.138, 0, 0, TAU);
    ctx.fillStyle = '#dcc79c';
    ctx.fill();
    ctx.strokeStyle = '#b39a6d';
    ctx.lineWidth = R * 0.012;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(R * ex, R * ey, R * 0.026, 0, TAU);
    ctx.fillStyle = '#120c08';
    ctx.fill();
  }

  ctx.save();
  ctx.translate(R * 0.22, R * 0.14);
  ctx.scale(1.25, 1.25);
  ctx.translate(-R * 0.22, -R * 0.14);

  ctx.beginPath();
  ctx.moveTo(R * 0.22, R * 0.14);
  ctx.lineTo(R * 0.58, -R * 0.52);
  ctx.lineTo(R * 1.0, R * 0.02);
  ctx.closePath();
  ctx.fillStyle = hoodBrown;
  ctx.fill();
  ctx.strokeStyle = '#2f1c0f';
  ctx.lineWidth = R * 0.028;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(R * 0.2, R * 0.16);
  ctx.quadraticCurveTo(R * 0.06, R * 0.14, R * -0.04, R * 0.0);
  ctx.quadraticCurveTo(R * 0.0, -R * 0.08, R * 0.12, -R * 0.02);
  ctx.quadraticCurveTo(R * 0.2, R * 0.04, R * 0.3, R * 0.1);
  ctx.closePath();
  ctx.fillStyle = hoodBrown;
  ctx.fill();

  const flecks = [
    [0.4, -0.12, 0.024],
    [0.48, -0.28, 0.02],
    [0.56, -0.36, 0.018],
    [0.6, -0.16, 0.026],
    [0.7, -0.06, 0.022],
    [0.78, -0.14, 0.018],
    [0.86, -0.02, 0.02],
    [0.52, 0.02, 0.02],
    [0.4, 0.06, 0.016],
    [0.66, 0.06, 0.024],
    [0.74, 0.0, 0.016],
    [0.9, 0.0, 0.014],
  ];
  ctx.fillStyle = '#f7f0dd';
  for (let i = 0; i < flecks.length; i += 1) {
    const [fx, fy, fr] = flecks[i];
    ctx.globalAlpha = 0.5 + 0.4 * ((i * 0.37) % 1);
    ctx.beginPath();
    ctx.arc(R * fx, R * fy, R * fr, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const jet = pose.jet;
  if (jet && jet.strength > 0.02) {
    const strength = clamp(jet.strength, 0, 1);
    const dir = jet.dir >= 0 ? 1 : -1;
    const vx = 0.55;
    const vy = dir;
    const vlen = Math.hypot(vx, vy);
    const ux = vx / vlen;
    const uy = vy / vlen;
    const fx = R * 0.66;
    const fy = R * 0.36;
    const len = R * (0.7 + strength * 0.9);
    const px = -uy;
    const py = ux;
    const wide = R * (0.1 + 0.2 * strength);
    ctx.save();
    ctx.globalAlpha = 0.2 + 0.3 * strength;
    const grad = ctx.createLinearGradient(fx, fy, fx + ux * len, fy + uy * len);
    grad.addColorStop(0, 'rgba(214, 242, 255, 0.9)');
    grad.addColorStop(1, 'rgba(150, 214, 238, 0.02)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + ux * len + px * wide, fy + uy * len + py * wide);
    ctx.lineTo(fx + ux * len - px * wide, fy + uy * len - py * wide);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 8; i += 1) {
      const seed = Math.sin(i * 12.9898) * 43758.5453;
      const r1 = seed - Math.floor(seed);
      const r2 = Math.abs(Math.sin((i + 3) * 78.233) * 12345.678) % 1;
      const t = (age * (1.3 + r1 * 0.9) + i * 0.173) % 1;
      const lateral = (r1 - 0.5) * 2 * wide * (0.4 + t * 0.9);
      const along = (r2 - 0.5) * len * 0.2;
      const bx = fx + ux * (len * t + along) + px * lateral;
      const by = fy + uy * (len * t + along) + py * lateral;
      const br = R * (0.02 + r2 * 0.03 + t * 0.06) * (0.6 + strength * 0.6);
      ctx.globalAlpha = (1 - t) * (0.3 + 0.5 * strength);
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, TAU);
      ctx.fillStyle = '#eaf9ff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  ctx.restore();
}
