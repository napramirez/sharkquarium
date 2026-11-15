import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, PLAYER, SQUID, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor, eyeOpenFor, drawEye, drawPupil } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';

export class Squid extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: SQUID.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.maxSpeed = SQUID.maxSpeed;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.hidden = false;
    this.hideProgress = 0;
    this.hideX = x;
    this.hideY = y;
    this.armPhase = 0;
    this.jacketFit = { x: -0.7, y: 0, rx: 0.9, ry: 0.72 };
  }

  get concealed() {
    return this.hidden;
  }

  update(dt, input, hideSpot) {
    super.update(dt);
    if (input && typeof input.wasPressed === 'function' && input.wasPressed('KeyV')) startEmote(this);
    updateEmote(this, dt);
    let horizontal = (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    let vertical = (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0);
    if (this.pointerSteering && (input.pointer.down || input.pointer.look)) {
      const drag = Math.hypot(input.pointer.dragX, input.pointer.dragY);
      if (drag > PLAYER.pointerDeadzone) {
        horizontal = input.pointer.dragX / drag;
        vertical = input.pointer.dragY / drag;
      }
    }
    const wantsDown = vertical > 0.5 || input.isDown('hide');
    if (!this.hidden && wantsDown && hideSpot) {
      this.hidden = true;
      this.hideX = hideSpot.x;
      this.hideY = hideSpot.y;
      this.vx = 0;
      this.vy = 0;
    } else if (this.hidden && !wantsDown) {
      this.hidden = false;
    }
    const hideTarget = this.hidden ? 1 : 0;
    this.hideProgress += (hideTarget - this.hideProgress) * (1 - Math.exp(-SQUID.hideSpeed * dt));
    if (this.hidden) {
      this.x += (this.hideX - this.x) * (1 - Math.exp(-SQUID.hideSpeed * dt));
      this.y += (this.hideY - this.y) * (1 - Math.exp(-SQUID.hideSpeed * dt));
      this.speed = 0;
    } else {
      const length = Math.hypot(horizontal, vertical);
      const dirX = length > 0 ? horizontal / length : 0;
      const dirY = length > 0 ? vertical / length : 0;
      const response = 1 - Math.exp(-SQUID.response * dt);
      this.vx = lerp(this.vx, dirX * SQUID.maxSpeed, response);
      this.vy = lerp(this.vy, dirY * SQUID.maxSpeed, response);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.x = clamp(this.x, this.radius, this.maxX - this.radius);
      this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
      this.speed = Math.hypot(this.vx, this.vy);
      if (this.speed > 24) {
        const turn = 1 - Math.exp(-SQUID.turnResponse * dt);
        this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), turn);
      }
    }
    this.updateFacing();
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.armPhase += dt * (4 + this.speed * 0.02);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    const radius = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    if (this.hideProgress > 0.02) {
      ctx.globalAlpha = 1 - this.hideProgress * 0.6;
      const scale = 1 - this.hideProgress * 0.2;
      ctx.scale(scale, scale);
    }
    ctx.scale(this.facing, 1);
    drawSquidBody(ctx, radius, this);
    drawAccessory(ctx, radius, this.age, { entity: this, heading: this.heading });
    drawEmote(ctx, this, radius, this.age);
    ctx.restore();
  }
}

export function drawSquidBody(ctx, radius, pose) {
  const r = radius;
  const armPhase = pose.armPhase ?? 0;
  const body = playerColor('body', COLORS.squid);
  const accent = playerColor('accent', COLORS.squid);

  ctx.lineCap = 'round';
  ctx.strokeStyle = accent;
  for (let i = 0; i < 5; i += 1) {
    const spread = (i - 2) * 0.3;
    const wave = Math.sin(armPhase + i * 1.3) * r * 0.3;
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.moveTo(r * 0.9, spread * r * 0.5);
    ctx.quadraticCurveTo(r * 1.7, spread * r + wave * 0.5, r * 2.6, spread * r * 1.5 + wave);
    ctx.stroke();
  }
  for (const side of [-1, 1]) {
    const wave = Math.sin(armPhase + side) * r * 0.4;
    const tipX = r * 3.1;
    const tipY = side * r * 0.2 + wave;
    ctx.lineWidth = r * 0.11;
    ctx.beginPath();
    ctx.moveTo(r * 0.95, side * r * 0.2);
    ctx.quadraticCurveTo(r * 2.0, side * r * 0.5 + wave, tipX, tipY);
    ctx.stroke();
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(side * 0.4);
    const s = r * 0.28;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.62);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s * 0.62);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.lineWidth = r * 0.02;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.26, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.moveTo(r * 1.1, 0);
  ctx.quadraticCurveTo(r * 0.7, -r * 0.85, -r * 0.6, -r * 0.7);
  ctx.quadraticCurveTo(-r * 2.0, -r * 0.42, -r * 2.42, 0);
  ctx.quadraticCurveTo(-r * 2.0, r * 0.42, -r * 0.6, r * 0.7);
  ctx.quadraticCurveTo(r * 0.7, r * 0.85, r * 1.1, 0);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();

  ctx.fillStyle = 'rgba(122, 62, 74, 0.5)';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-r * 1.35, side * r * 0.5);
    ctx.quadraticCurveTo(-r * 2.1, side * r * 1.0, -r * 2.46, side * r * 0.12);
    ctx.quadraticCurveTo(-r * 1.9, side * r * 0.4, -r * 1.35, side * r * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  for (let i = 0; i < 12; i += 1) {
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = i % 2 ? '#5a2c36' : '#e0a0b0';
    ctx.beginPath();
    ctx.ellipse(-r * 1.6 + (i % 4) * r * 0.5, ((i % 3) - 1) * r * 0.3, r * 0.1, r * 0.06, 0, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.ellipse(r * 0.82, 0, r * 0.52, r * 0.5, 0, 0, TAU);
  ctx.fillStyle = body;
  ctx.fill();

  const open = eyeOpenFor(pose);
  for (const side of [-1, 1]) {
    drawEye(ctx, r * 0.5, side * r * 0.44, r * 0.27, { open, light: '#f4fbff' });
    drawPupil(ctx, r * 0.58, side * r * 0.44, r * 0.14, { open, color: '#10233a' });
  }
}
