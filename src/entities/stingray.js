import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, PLAYER, STINGRAY, SAND, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor, shadowEyeColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';

export class Stingray extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: STINGRAY.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.maxSpeed = STINGRAY.maxSpeed;
    this.bodyColor = options.bodyColor ?? COLORS.stingray;
    this.spotColor = options.spotColor ?? 'rgba(70, 62, 50, 0.35)';
    this.eyeColor = options.eyeColor ?? '#10233a';
    this.autoScrollX = options.autoScrollX ?? null;
    this.burrowEnabled = options.burrow ?? true;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.burrowed = false;
    this.burrowProgress = 0;
    this.burrowY = 0;
    this.tailPhase = 0;
    this.tangleTimer = 0;
  }

  get concealed() {
    return this.burrowed;
  }

  tangle(duration) {
    this.tangleTimer = Math.max(this.tangleTimer, duration);
  }

  update(dt, input) {
    super.update(dt);
    const sandTop = LOGICAL_HEIGHT - SAND.height;
    let horizontal = (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    let vertical = (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0);
    if (this.pointerSteering && input.pointer.down) {
      const drag = Math.hypot(input.pointer.dragX, input.pointer.dragY);
      if (drag > PLAYER.pointerDeadzone) {
        horizontal = input.pointer.dragX / drag;
        vertical = input.pointer.dragY / drag;
      }
    }
    if (this.tangleTimer > 0) {
      this.tangleTimer -= dt;
      horizontal *= 0.35;
      vertical *= 0.35;
    }
    if (this.autoScrollX !== null) horizontal = 0;
    const wantsDown = vertical > 0.5;
    const wantsUp = vertical < -0.5;
    if (this.burrowEnabled && !this.burrowed && wantsDown && this.y > sandTop - 10) {
      this.burrowed = true;
      this.burrowY = Math.min(LOGICAL_HEIGHT - this.radius * 0.4, sandTop + STINGRAY.burrowDepth);
      this.vx = 0;
      this.vy = 0;
    } else if (this.burrowed && wantsUp) {
      this.burrowed = false;
    }
    const burrowTarget = this.burrowed ? 1 : 0;
    this.burrowProgress +=
      (burrowTarget - this.burrowProgress) * (1 - Math.exp(-STINGRAY.burrowSpeed * dt));
    if (this.burrowed) {
      this.x += horizontal * STINGRAY.burrowMoveSpeed * dt;
      this.x = clamp(this.x, this.radius, this.maxX - this.radius);
      this.y += (this.burrowY - this.y) * (1 - Math.exp(-STINGRAY.burrowSpeed * dt));
      this.speed = Math.abs(horizontal) * STINGRAY.burrowMoveSpeed;
      if (Math.abs(horizontal) > 0.1) {
        this.heading = lerpAngle(this.heading, horizontal > 0 ? 0 : Math.PI, 1 - Math.exp(-8 * dt));
      }
    } else {
      const length = Math.hypot(horizontal, vertical);
      const dirX = length > 0 ? horizontal / length : 0;
      const dirY = length > 0 ? vertical / length : 0;
      const response = 1 - Math.exp(-STINGRAY.response * dt);
      this.vx = lerp(this.vx, dirX * STINGRAY.maxSpeed, response);
      this.vy = lerp(this.vy, dirY * STINGRAY.maxSpeed, response);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.x = clamp(this.x, this.radius, this.maxX - this.radius);
      this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
      this.speed = Math.hypot(this.vx, this.vy);
      if (this.speed > 24) {
        const turn = 1 - Math.exp(-STINGRAY.turnResponse * dt);
        this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), turn);
      }
    }
    if (this.autoScrollX !== null) {
      this.x += (this.autoScrollX - this.x) * (1 - Math.exp(-6 * dt));
    }
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.tailPhase += dt * (3 + this.speed * 0.015);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    const radius = this.radius;
    if (this.burrowProgress > 0.02) {
      this.renderHidden(ctx);
    } else {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (flash) ctx.globalAlpha = 0.4;
      ctx.rotate(this.heading);

      ctx.strokeStyle = this.bodyColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-radius * 0.8, 0);
      ctx.quadraticCurveTo(
        -radius * 1.8,
        Math.sin(this.tailPhase) * radius * 0.5,
        -radius * 2.6,
        Math.sin(this.tailPhase + 1.1) * radius * 0.35,
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(radius * 1.3, 0);
      ctx.quadraticCurveTo(radius * 0.4, -radius * 1.5, -radius * 0.7, -radius * 1.1);
      ctx.quadraticCurveTo(-radius * 1.0, -radius * 0.3, -radius * 0.9, 0);
      ctx.quadraticCurveTo(-radius * 1.0, radius * 0.3, -radius * 0.7, radius * 1.1);
      ctx.quadraticCurveTo(radius * 0.4, radius * 1.5, radius * 1.3, 0);
      ctx.closePath();
      ctx.fillStyle = playerColor('body', this.bodyColor);
      ctx.fill();

      ctx.fillStyle = playerColor('accent', this.spotColor);
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(
          -radius * 0.5 + i * radius * 0.4,
          (i % 2 === 0 ? -1 : 1) * radius * 0.28,
          radius * 0.11,
          0,
          TAU,
        );
        ctx.fill();
      }

      ctx.fillStyle = shadowEyeColor(this.eyeColor);
      ctx.beginPath();
      ctx.arc(radius * 0.75, -radius * 0.3, radius * 0.09, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(radius * 0.75, radius * 0.3, radius * 0.09, 0, TAU);
      ctx.fill();

      drawAccessory(ctx, radius, this.age, { entity: this, heading: this.heading });
      ctx.restore();
    }
    if (this.tangleTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(79, 122, 58, 0.85)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x - 22, this.y + 26);
      ctx.quadraticCurveTo(this.x - 6, this.y, this.x - 16, this.y - 26);
      ctx.moveTo(this.x + 20, this.y + 28);
      ctx.quadraticCurveTo(this.x + 8, this.y + 2, this.x + 18, this.y - 24);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderHidden(ctx) {
    const radius = this.radius;
    const alpha = Math.min(1, this.burrowProgress * 1.4);
    ctx.save();
    ctx.globalAlpha = 0.55 * alpha;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + radius * 0.2, radius * 1.7, radius * 0.75, 0, 0, TAU);
    ctx.fillStyle = COLORS.sandDark;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = shadowEyeColor(this.eyeColor);
    ctx.beginPath();
    ctx.arc(this.x - radius * 0.3, this.y - radius * 0.62, radius * 0.1, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + radius * 0.3, this.y - radius * 0.62, radius * 0.1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
