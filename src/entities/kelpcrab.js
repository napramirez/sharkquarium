import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, KELP_CRAB, PLAYER, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor, eyeOpenFor, drawEye, drawPupil } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';

export class KelpCrab extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: KELP_CRAB.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.maxSpeed = KELP_CRAB.maxSpeed;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.legPhase = 0;
    this.jacketFit = { x: -0.05, y: 0, rx: 0.85, ry: 0.68 };
  }

  update(dt, input) {
    super.update(dt);
    if (input && typeof input.wasPressed === 'function' && input.wasPressed('KeyV')) startEmote(this);
    updateEmote(this, dt);
    let horizontal =
      (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    let vertical =
      (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0);
    if (this.pointerSteering && (input.pointer.down || input.pointer.look)) {
      const drag = Math.hypot(input.pointer.dragX, input.pointer.dragY);
      if (drag > PLAYER.pointerDeadzone) {
        horizontal = input.pointer.dragX / drag;
        vertical = input.pointer.dragY / drag;
      }
    }
    const length = Math.hypot(horizontal, vertical);
    const dirX = length > 0 ? horizontal / length : 0;
    const dirY = length > 0 ? vertical / length : 0;
    const response = 1 - Math.exp(-KELP_CRAB.response * dt);
    this.vx = lerp(this.vx, dirX * KELP_CRAB.maxSpeed, response);
    this.vy = lerp(this.vy, dirY * KELP_CRAB.maxSpeed, response);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, this.radius, this.maxX - this.radius);
    this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
    this.speed = Math.hypot(this.vx, this.vy);
    if (this.speed > 24) {
      const turn = 1 - Math.exp(-KELP_CRAB.turnResponse * dt);
      this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), turn);
    }
    this.updateFacing();
    this.legPhase += dt * (2 + this.speed * 0.012);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    const radius = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    ctx.scale(this.facing, 1);
    drawKelpCrabBody(ctx, radius, this);
    drawAccessory(ctx, radius, this.age, { entity: this, heading: this.heading });
    drawEmote(ctx, this, radius, this.age);
    ctx.restore();
  }
}

export function drawKelpCrabBody(ctx, radius, pose) {
  const r = radius;
  const legPhase = pose.legPhase ?? 0;
  const open = eyeOpenFor(pose);
  const body = playerColor('body', COLORS.crab);
  const accent = playerColor('accent', COLORS.crab);

  const leaf = (len, wid) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -wid, len, 0);
    ctx.quadraticCurveTo(len * 0.5, wid, 0, 0);
    ctx.closePath();
  };

  ctx.strokeStyle = accent;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      const by = -r * 0.25 + i * r * 0.34;
      const swing = Math.sin(legPhase + i * 1.2 + (side > 0 ? Math.PI : 0)) * r * 0.18;
      ctx.lineWidth = r * (0.11 - i * 0.012);
      ctx.beginPath();
      ctx.moveTo(side * r * 0.9, by);
      ctx.lineTo(side * r * 1.45 + swing, by - r * 0.18);
      ctx.lineTo(side * r * 1.9 + swing * 1.6, by - r * 0.32);
      ctx.stroke();
    }
  }

  for (const side of [-1, 1]) {
    const sway = Math.sin(legPhase * 1.5) * r * 0.12;
    const bx = side * r * 0.35;
    const tx = bx + side * r * 0.12;
    const ty = r * 1.35 + sway;
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.moveTo(bx, r * 0.65);
    ctx.quadraticCurveTo(bx - side * r * 0.25, r * 1.1, tx, ty);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(tx, ty, r * 0.16, r * 0.26, side * 0.35, 0, TAU);
    ctx.fillStyle = accent;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(-r * 1.1, -r * 0.5);
  ctx.lineTo(r * 1.1, -r * 0.5);
  ctx.lineTo(r * 0.75, r * 0.7);
  ctx.lineTo(-r * 0.75, r * 0.7);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = r * 0.09;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(122, 52, 36, 0.32)';
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.15);
  ctx.lineTo(0, r * 0.15);
  ctx.lineTo(r * 0.45, -r * 0.15);
  ctx.stroke();

  for (const side of [-1, 1]) {
    const ex = side * r * 0.22;
    ctx.strokeStyle = accent;
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(ex, -r * 0.5);
    ctx.lineTo(ex, -r * 0.9);
    ctx.stroke();
    drawEye(ctx, ex, -r * 0.98, r * 0.15, { open, light: '#f4fbff' });
    drawPupil(ctx, ex, -r * 0.98, r * 0.075, { open, color: '#10233a' });
  }

  for (const side of [-1, 1]) {
    const armSwing = Math.sin(legPhase + (side > 0 ? 0.6 : 0)) * r * 0.1;
    const cx = side * r * 0.95;
    const cy = -r * 0.9 + armSwing;
    ctx.strokeStyle = accent;
    ctx.lineWidth = r * 0.13;
    ctx.beginPath();
    ctx.moveTo(side * r * 0.7, -r * 0.5);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.fillStyle = body;
    ctx.strokeStyle = accent;
    ctx.lineWidth = r * 0.035;
    for (const spread of [-0.45, 0.45]) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-Math.PI / 2 + side * 0.35 + spread);
      leaf(r * 0.85, r * 0.26);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}
