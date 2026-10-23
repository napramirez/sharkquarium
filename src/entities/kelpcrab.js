import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, KELP_CRAB, PLAYER, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';

export class KelpCrab extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: KELP_CRAB.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.legPhase = 0;
  }

  update(dt, input) {
    super.update(dt);
    let horizontal =
      (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    let vertical =
      (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0);
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
    const response = 1 - Math.exp(-KELP_CRAB.response * dt);
    this.vx = lerp(this.vx, dirX * KELP_CRAB.maxSpeed, response);
    this.vy = lerp(this.vy, dirY * KELP_CRAB.maxSpeed, response);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, this.radius, LOGICAL_WIDTH - this.radius);
    this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
    this.speed = Math.hypot(this.vx, this.vy);
    if (this.speed > 24) {
      const turn = 1 - Math.exp(-KELP_CRAB.turnResponse * dt);
      this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), turn);
    }
    this.legPhase += dt * (2 + this.speed * 0.012);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    const radius = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    ctx.rotate(this.heading);

    ctx.strokeStyle = playerColor('accent', COLORS.crab);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      for (const side of [-1, 1]) {
        const swing = Math.sin(this.legPhase + i * 1.1 + (side > 0 ? Math.PI : 0)) * 3;
        const baseX = -radius * 0.5 + i * radius * 0.45;
        ctx.beginPath();
        ctx.moveTo(baseX, side * radius * 0.45);
        ctx.lineTo(baseX + swing, side * radius * (0.95 + i * 0.05));
        ctx.stroke();
      }
    }

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(
        radius * 0.95,
        side * radius * 0.55,
        radius * 0.4,
        radius * 0.26,
        side * 0.5,
        0,
        TAU,
      );
      ctx.fillStyle = playerColor('accent', COLORS.crab);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.25, radius * 0.95, 0, 0, TAU);
    ctx.fillStyle = playerColor('body', COLORS.crab);
    ctx.fill();
    ctx.strokeStyle = playerColor('accent', COLORS.crab);
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(122, 52, 36, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -radius * 0.1, radius * 0.62, 0.3, Math.PI - 0.3);
    ctx.stroke();

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(radius * 0.6, side * radius * 0.32);
      ctx.lineTo(radius * 0.85, side * radius * 0.5);
      ctx.strokeStyle = playerColor('accent', COLORS.crab);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(radius * 0.88, side * radius * 0.54, radius * 0.14, 0, TAU);
      ctx.fillStyle = '#f4fbff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(radius * 0.92, side * radius * 0.54, radius * 0.07, 0, TAU);
      ctx.fillStyle = '#10233a';
      ctx.fill();
    }

    drawAccessory(ctx, radius, this.age);
    ctx.restore();
  }
}
