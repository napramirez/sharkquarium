import { Entity } from './entity.js';
import { clamp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, ARCTIC_SHRIMP, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';

export class ArcticShrimp extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: ARCTIC_SHRIMP.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.following = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.exitCooldown = 0;
    this.armPhase = 0;
  }

  get concealed() {
    return this.following !== null;
  }

  update(dt, input, school) {
    super.update(dt);
    let horizontal = (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    let vertical = (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0);
    if (this.pointerSteering && input.pointer.down) {
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
    } else {
      const length = Math.hypot(horizontal, vertical);
      const dirX = length > 0 ? horizontal / length : 0;
      const dirY = length > 0 ? vertical / length : 0;
      const response = 1 - Math.exp(-ARCTIC_SHRIMP.response * dt);
      this.vx += (dirX * ARCTIC_SHRIMP.maxSpeed - this.vx) * response;
      this.vy += (dirY * ARCTIC_SHRIMP.maxSpeed - this.vy) * response;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.x = clamp(this.x, this.radius, LOGICAL_WIDTH - this.radius);
      this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
      this.speed = Math.hypot(this.vx, this.vy);
      if (this.speed > 24) {
        this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), 1 - Math.exp(-ARCTIC_SHRIMP.turnResponse * dt));
      }
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
    ctx.rotate(this.heading);

    const flick = Math.sin(this.armPhase * 1.5) * 0.3;
    ctx.save();
    ctx.translate(-radius * 0.9, 0);
    ctx.rotate(flick);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-radius * 0.7, -radius * 0.5);
    ctx.lineTo(-radius * 0.9, 0);
    ctx.lineTo(-radius * 0.7, radius * 0.5);
    ctx.closePath();
    ctx.fillStyle = playerColor('accent', COLORS.arcticshrimp);
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(radius * 0.9, 0);
    ctx.quadraticCurveTo(radius * 0.2, -radius * 0.62, -radius * 0.5, -radius * 0.2);
    ctx.quadraticCurveTo(-radius * 0.8, 0, -radius * 0.5, radius * 0.2);
    ctx.quadraticCurveTo(radius * 0.2, radius * 0.62, radius * 0.9, 0);
    ctx.closePath();
    ctx.fillStyle = playerColor('body', COLORS.arcticshrimp);
    ctx.fill();

    ctx.strokeStyle = 'rgba(70, 78, 86, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i += 1) {
      const x = -radius * 0.2 + i * radius * 0.32;
      ctx.beginPath();
      ctx.moveTo(x, -radius * 0.42);
      ctx.quadraticCurveTo(x + radius * 0.1, 0, x, radius * 0.42);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(210, 218, 224, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(radius * 0.8, -radius * 0.15);
    ctx.quadraticCurveTo(radius * 1.5, -radius * 0.5, radius * 1.9, -radius * 0.25);
    ctx.moveTo(radius * 0.8, radius * 0.15);
    ctx.quadraticCurveTo(radius * 1.5, radius * 0.5, radius * 1.9, radius * 0.25);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(radius * 0.55, -radius * 0.2, radius * 0.13, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-radius * 0.1, -radius * 0.28, radius * 0.12, 0, TAU);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();

    drawAccessory(ctx, radius, this.age);
    ctx.restore();
  }
}
