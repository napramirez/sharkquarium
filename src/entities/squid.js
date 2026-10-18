import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, PLAYER, SQUID, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Squid extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: SQUID.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.hidden = false;
    this.hideProgress = 0;
    this.hideX = x;
    this.hideY = y;
    this.armPhase = 0;
  }

  get concealed() {
    return this.hidden;
  }

  update(dt, input, hideSpot) {
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
    const wantsDown = vertical > 0.5;
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
      this.x = clamp(this.x, this.radius, LOGICAL_WIDTH - this.radius);
      this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
      this.speed = Math.hypot(this.vx, this.vy);
      if (this.speed > 24) {
        const turn = 1 - Math.exp(-SQUID.turnResponse * dt);
        this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), turn);
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
    if (this.hideProgress > 0.02) {
      ctx.globalAlpha = 1 - this.hideProgress * 0.6;
      const scale = 1 - this.hideProgress * 0.2;
      ctx.scale(scale, scale);
    }
    ctx.rotate(this.heading);

    ctx.beginPath();
    ctx.moveTo(radius * 1.1, 0);
    ctx.quadraticCurveTo(radius * 0.8, -radius * 0.95, -radius * 0.6, -radius * 0.8);
    ctx.quadraticCurveTo(-radius * 1.9, -radius * 0.45, -radius * 2.1, 0);
    ctx.quadraticCurveTo(-radius * 1.9, radius * 0.45, -radius * 0.6, radius * 0.8);
    ctx.quadraticCurveTo(radius * 0.8, radius * 0.95, radius * 1.1, 0);
    ctx.closePath();
    ctx.fillStyle = COLORS.squid;
    ctx.fill();

    ctx.fillStyle = 'rgba(122, 62, 74, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-radius * 0.9, -radius * 0.5, radius * 0.5, radius * 0.22, -0.5, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-radius * 0.9, radius * 0.5, radius * 0.5, radius * 0.22, 0.5, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = COLORS.squid;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i += 1) {
      const spread = (i - 1.5) * 0.32;
      const wave = Math.sin(this.armPhase + i * 1.4) * radius * 0.28;
      ctx.beginPath();
      ctx.moveTo(radius * 0.85, spread * radius * 0.6);
      ctx.quadraticCurveTo(
        radius * 1.7,
        spread * radius + wave * 0.5,
        radius * 2.5,
        spread * radius * 1.4 + wave,
      );
      ctx.stroke();
    }

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(radius * 0.45, side * radius * 0.42, radius * 0.25, 0, TAU);
      ctx.fillStyle = '#f4fbff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(radius * 0.55, side * radius * 0.42, radius * 0.13, 0, TAU);
      ctx.fillStyle = '#10233a';
      ctx.fill();
    }

    ctx.restore();
  }
}
