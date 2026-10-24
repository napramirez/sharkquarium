import { Entity } from './entity.js';
import { clamp, lerp, TAU } from '../engine/math.js';
import { CONTROLS, NAUTILUS, PLAYER, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor, shadowEyeColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';

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
    this.speed = 0;
    this.invulnerable = 0;
    this.tangleTimer = 0;
  }

  tangle(duration) {
    this.tangleTimer = Math.max(this.tangleTimer, duration);
  }

  update(dt, input) {
    super.update(dt);
    let horizontal = (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    let vertical = this.freeVertical
      ? (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0)
      : 0;
    if (this.pointerSteering && input.pointer.down) {
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
    if (this.speed > 24) this.facing = this.vx > 0 ? 1 : -1;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  render(ctx) {
    const radius = this.radius;
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(this.age * 3) * 1.5);
    ctx.scale(this.facing, 1);
    if (flash) ctx.globalAlpha = 0.4;

    ctx.strokeStyle = playerColor('belly', COLORS.nautilusSkin);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i += 1) {
      const baseX = -radius * 0.62 + i * radius * 0.3;
      const sway = Math.sin(this.age * 5 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(baseX, radius * 0.4);
      ctx.quadraticCurveTo(baseX + sway, radius * 1.05, baseX + sway * 1.7, radius * 1.55);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.1, 0, TAU);
    ctx.fillStyle = playerColor('body', COLORS.nautilusShell);
    ctx.fill();
    ctx.strokeStyle = playerColor('accent', COLORS.nautilusShellDark);
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    const spin = Math.sin(this.age * 1.6) * 0.3;
    for (let i = 0; i < 26; i += 1) {
      const t = i / 25;
      const angle = t * TAU * 2.2 + spin;
      const r = radius * 0.95 * (1 - t * 0.82);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r * 0.9;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = playerColor('accent', COLORS.nautilusShellDark);
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = playerColor('belly', COLORS.nautilusSkin);
    ctx.beginPath();
    ctx.ellipse(radius * 0.72, radius * 0.36, radius * 0.42, radius * 0.26, 0.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.82, radius * 0.32, radius * 0.13, 0, TAU);
    ctx.fillStyle = shadowEyeColor('#10233a');
    ctx.fill();
    drawAccessory(ctx, radius, this.age, { entity: this, flip: this.facing ?? 1 });
    ctx.restore();
  }
}
