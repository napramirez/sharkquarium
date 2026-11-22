import { Entity } from './entity.js';
import { clamp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, ARCTIC_SHRIMP, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor, eyeOpenFor, drawPupil } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';

export class ArcticShrimp extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: ARCTIC_SHRIMP.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.maxSpeed = ARCTIC_SHRIMP.maxSpeed;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.following = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.exitCooldown = 0;
    this.armPhase = 0;
    this.jacketFit = { x: 0, y: 0, rx: 0.42, ry: 0.32 };
  }

  get concealed() {
    return this.following !== null;
  }

  update(dt, input, school) {
    super.update(dt);
    if (input && typeof input.wasPressed === 'function' && input.wasPressed('KeyV')) startEmote(this);
    updateEmote(this, dt);
    let horizontal = (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    let vertical = (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0);
    if (this.pointerSteering && (input.pointer.down || input.pointer.look)) {
      const drag = Math.hypot(input.pointer.dragX, input.pointer.dragY);
      if (drag > 16) {
        horizontal = input.pointer.dragX / drag;
        vertical = input.pointer.dragY / drag;
      }
    }
    this.exitCooldown = Math.max(0, this.exitCooldown - dt);
    const wantsUp = vertical < -0.5;
    if (this.following !== null && wantsUp) {
      this.following = null;
      this.exitCooldown = ARCTIC_SHRIMP.exitCooldown;
      this.vx = 0;
      this.vy = 0;
    } else if (this.following === null && school && this.exitCooldown <= 0) {
      this.following = school;
      this.offsetX = clamp(this.x - school.x, -40, 40);
      this.offsetY = clamp(this.y - school.y, -34, 34);
    }
    if (this.following !== null) {
      const targetX = this.following.x + this.offsetX;
      const targetY = this.following.y + this.offsetY;
      const driftX = targetX - this.x;
      const driftY = targetY - this.y;
      const ease = 1 - Math.exp(-ARCTIC_SHRIMP.followEase * dt);
      this.x += driftX * ease;
      this.y += driftY * ease;
      this.vx = 0;
      this.vy = 0;
      this.speed = Math.hypot(driftX, driftY) * ARCTIC_SHRIMP.followEase;
      if (this.speed > 24) {
        this.heading = lerpAngle(this.heading, Math.atan2(driftY, driftX), 1 - Math.exp(-8 * dt));
      }
      if (driftX > 6) this.facing = 1;
      else if (driftX < -6) this.facing = -1;
    } else {
      const length = Math.hypot(horizontal, vertical);
      const dirX = length > 0 ? horizontal / length : 0;
      const dirY = length > 0 ? vertical / length : 0;
      const response = 1 - Math.exp(-ARCTIC_SHRIMP.response * dt);
      this.vx += (dirX * ARCTIC_SHRIMP.maxSpeed - this.vx) * response;
      this.vy += (dirY * ARCTIC_SHRIMP.maxSpeed - this.vy) * response;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.x = clamp(this.x, this.radius, this.maxX - this.radius);
      this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
      this.speed = Math.hypot(this.vx, this.vy);
      if (this.speed > 24) {
        this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), 1 - Math.exp(-ARCTIC_SHRIMP.turnResponse * dt));
      }
      this.updateFacing();
    }
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.armPhase += dt * (4 + this.speed * 0.02);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    const radius = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    ctx.scale(this.facing, 1);
    drawArcticShrimpBody(ctx, radius, this);
    drawAccessory(ctx, radius, this.age, { entity: this, heading: this.heading });
    drawEmote(ctx, this, radius, this.age);
    ctx.restore();
  }
}

export function drawArcticShrimpBody(ctx, radius, pose) {
  const r = radius;
  const armPhase = pose.armPhase ?? 0;
  const flick = Math.sin(armPhase * 1.5) * 0.3;
  const open = eyeOpenFor(pose);
  const body = pose.bodyColor ?? playerColor('body', COLORS.arcticshrimp);
  const accent = pose.accentColor ?? playerColor('accent', COLORS.arcticshrimp);
  const moving = (pose.speed ?? 0) > 24;
  const plate = pose.bodyColor ?? 'rgba(255, 111, 97, 0.6)';
  const shellLine = pose.shellLine ?? 'rgba(60, 68, 76, 0.4)';
  const segment = pose.segmentColor ?? 'rgba(120, 44, 34, 0.55)';
  const finColor = pose.finColor ?? 'rgba(255, 111, 97, 0.75)';
  const tailColor = pose.tailColor ?? '#ff6f61';
  const legColor = pose.legColor ?? 'rgba(255, 111, 97, 0.85)';
  const antennaColor = pose.antennaColor ?? 'rgba(210, 218, 224, 0.9)';

  ctx.lineCap = 'round';

  const topFront = r * 0.55;
  const topBack = -r * 1.35;
  const botFront = r * 0.35;
  const botBack = -r * 1.7;
  const bcx = (topFront + topBack + botFront + botBack) / 4;
  const bcy = (r * -0.2 + r * -0.2 + r * 0.4 + r * 0.4) / 4;
  ctx.save();
  ctx.translate(bcx, bcy);
  ctx.rotate(-Math.PI * (10 / 180));
  ctx.translate(-bcx, -bcy);
  ctx.beginPath();
  ctx.moveTo(topFront, -r * 0.2);
  ctx.lineTo(topBack, -r * 0.2);
  ctx.lineTo(botBack, r * 0.4);
  ctx.lineTo(botFront, r * 0.4);
  ctx.closePath();
  ctx.fillStyle = plate;
  ctx.fill();
  ctx.strokeStyle = shellLine;
  ctx.lineWidth = r * 0.035;
  ctx.stroke();

  ctx.strokeStyle = segment;
  ctx.lineWidth = r * 0.022;
  for (let i = 0; i < 4; i += 1) {
    const gx = r * 0.1 - i * r * 0.45;
    ctx.beginPath();
    ctx.moveTo(gx, -r * 0.18);
    ctx.lineTo(gx, r * 0.38);
    ctx.stroke();
  }

  if (pose.stripe) {
    ctx.strokeStyle = pose.stripe;
    ctx.lineCap = 'round';
    ctx.lineWidth = r * 0.2;
    ctx.beginPath();
    ctx.moveTo(r * 0.5, -r * 0.16);
    ctx.lineTo(-r * 1.3, -r * 0.16);
    ctx.stroke();
    if (pose.stripe2) {
      ctx.strokeStyle = pose.stripe2;
      ctx.lineWidth = r * 0.09;
      ctx.beginPath();
      ctx.moveTo(r * 0.5, -r * 0.16);
      ctx.lineTo(-r * 1.3, -r * 0.16);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 4; i += 1) {
    const sx = r * 0.05 - i * r * 0.45;
    const paddle = moving ? Math.sin(pose.age * 34 + i * 1.6) : 0;
    ctx.save();
    ctx.translate(sx, r * 0.4);
    ctx.rotate(paddle * 0.5);
    ctx.strokeStyle = finColor;
    ctx.lineWidth = r * 0.04;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, r * 0.24);
    ctx.stroke();
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.3, r * 0.06, r * 0.11, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  const tx = -r * 1.5;
  const ty = r * 0.1;
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(0.35);
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-r * 0.95, -r * 0.62);
  ctx.lineTo(-r * 0.5, 0);
  ctx.lineTo(-r * 0.95, r * 0.62);
  ctx.closePath();
  ctx.fillStyle = tailColor;
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = tailColor;
  ctx.lineWidth = r * 0.03;
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  for (let i = 0; i < 3; i += 1) {
    const lx = r * 0.85 - i * r * 0.42;
    const step = moving ? Math.sin(pose.age * 22 + i * 2.1) : 0;
    ctx.strokeStyle = legColor;
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.moveTo(lx, r * 0.4);
    ctx.quadraticCurveTo(lx + step * r * 0.12, r * 0.72, lx - r * 0.05 + step * r * 0.14, r * 0.98);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(r * 1.35, -r * 0.05);
  ctx.quadraticCurveTo(r * 0.9, -r * 0.6, r * 0.1, -r * 0.5);
  ctx.quadraticCurveTo(-r * 0.3, -r * 0.2, -r * 0.2, r * 0.4);
  ctx.quadraticCurveTo(r * 0.6, r * 0.6, r * 1.0, r * 0.3);
  ctx.closePath();
  ctx.fillStyle = plate;
  ctx.fill();
  ctx.strokeStyle = shellLine;
  ctx.lineWidth = r * 0.035;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(r * 1.32, -r * 0.08);
  ctx.lineTo(r * 1.72, -r * 0.32);
  ctx.lineTo(r * 1.14, r * 0.04);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.strokeStyle = antennaColor;
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.moveTo(r * 1.15, -r * 0.14);
  ctx.quadraticCurveTo(r * 1.9, -r * 0.6, r * 2.5, -r * 0.3);
  ctx.moveTo(r * 1.15, r * 0.06);
  ctx.quadraticCurveTo(r * 1.9, r * 0.5, r * 2.5, r * 0.2);
  ctx.stroke();

  drawPupil(ctx, r * 0.85, -r * 0.2, r * 0.13, { open, color: '#10233a' });

  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.28, r * 0.12, 0, TAU);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fill();
}
