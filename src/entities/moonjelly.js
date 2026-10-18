import { Entity } from './entity.js';
import { rand, clamp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, PLAYER, MOONJELLY, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class MoonJelly extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: MOONJELLY.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.pulsePhase = rand(0, TAU);
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
    const response = 1 - Math.exp(-MOONJELLY.response * dt);
    this.vx += (dirX * MOONJELLY.maxSpeed - this.vx) * response;
    this.vy += (dirY * MOONJELLY.maxSpeed - this.vy) * response;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, this.radius, LOGICAL_WIDTH - this.radius);
    this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
    this.speed = Math.hypot(this.vx, this.vy);
    if (this.speed > 24) {
      const turn = 1 - Math.exp(-MOONJELLY.turnResponse * dt);
      this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), turn);
    }
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.pulsePhase += dt * 2.2;
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    const radius = this.radius;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.08;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    ctx.rotate(clamp(this.vx / MOONJELLY.maxSpeed, -1, 1) * 0.2);

    ctx.strokeStyle = 'rgba(255, 143, 163, 0.8)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i += 1) {
      const offset = (i - 2) * 8;
      const wobble = Math.sin(this.age * 3 + i * 1.3) * 5;
      ctx.beginPath();
      ctx.moveTo(offset * 0.5, radius * 0.35);
      ctx.quadraticCurveTo(offset + wobble, radius * 1.3, offset * 1.2 + wobble, radius * 2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(-radius * pulse, radius * 0.2);
    ctx.quadraticCurveTo(-radius * 1.2 * pulse, -radius * pulse, 0, -radius * 1.1 * pulse);
    ctx.quadraticCurveTo(radius * 1.2 * pulse, -radius * pulse, radius * pulse, radius * 0.2);
    ctx.quadraticCurveTo(radius * 0.5 * pulse, radius * 0.5, 0, radius * 0.2);
    ctx.quadraticCurveTo(-radius * 0.5 * pulse, radius * 0.5, -radius * pulse, radius * 0.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 143, 163, 0.55)';
    ctx.fill();
    ctx.strokeStyle = COLORS.jelly;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.ellipse(-radius * 0.3, -radius * 0.32, radius * 0.4, radius * 0.28, -0.4, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }
}
