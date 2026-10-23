import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, PLAYER, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';

export class Shark extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: PLAYER.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
  }

  update(dt, input) {
    super.update(dt);
    let horizontal = (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    let vertical = (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0);
    if (this.pointerSteering && input.pointer.down) {
      const drag = Math.hypot(input.pointer.dragX, input.pointer.dragY);
      if (drag > PLAYER.pointerDeadzone) {
        horizontal = input.pointer.dragX / drag;
        vertical = input.pointer.dragY / drag;
      }
    }
    const length = Math.hypot(horizontal, vertical);
    const dirX = length > 0 ? horizontal / length : 0;
    const dirY = length > 0 ? vertical / length : 0;
    const response = 1 - Math.exp(-PLAYER.response * dt);
    this.vx = lerp(this.vx, dirX * PLAYER.maxSpeed, response);
    this.vy = lerp(this.vy, dirY * PLAYER.maxSpeed, response);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, this.radius, LOGICAL_WIDTH - this.radius);
    this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
    this.speed = Math.hypot(this.vx, this.vy);
    if (this.speed > 24) {
      const turn = 1 - Math.exp(-PLAYER.turnResponse * dt);
      this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), turn);
    }
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    const radius = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    ctx.rotate(this.heading);

    const wiggle = Math.sin(this.age * (4 + this.speed * 0.02)) * 0.38;
    ctx.save();
    ctx.translate(-radius * 1.55, 0);
    ctx.rotate(wiggle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-radius * 0.9, -radius * 0.62);
    ctx.lineTo(-radius * 0.55, 0);
    ctx.lineTo(-radius * 0.9, radius * 0.62);
    ctx.closePath();
    ctx.fillStyle = playerColor('accent', COLORS.sharkFin);
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.7, radius * 0.85, 0, 0, TAU);
    ctx.fillStyle = playerColor('body', COLORS.shark);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, radius * 0.22, radius * 1.25, radius * 0.42, 0, 0, TAU);
    ctx.fillStyle = playerColor('belly', COLORS.sharkBelly);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-radius * 0.1, -radius * 0.72);
    ctx.lineTo(radius * 0.28, -radius * 1.5);
    ctx.lineTo(radius * 0.62, -radius * 0.58);
    ctx.closePath();
    ctx.fillStyle = COLORS.sharkFin;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(radius * 0.08, radius * 0.5);
    ctx.lineTo(radius * 0.3, radius * 1.3);
    ctx.lineTo(radius * 0.82, radius * 0.55);
    ctx.closePath();
    ctx.fillStyle = COLORS.sharkFin;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(radius * 0.98, -radius * 0.22, radius * 0.17, 0, TAU);
    ctx.fillStyle = '#f4fbff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 1.04, -radius * 0.22, radius * 0.08, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();

    drawAccessory(ctx, radius, this.age);
    ctx.restore();
  }
}
