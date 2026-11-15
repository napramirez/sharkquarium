import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, PLAYER, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';
import { playerColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';

export class Dolphin extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: options.radius ?? 30 });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.maxY = options.maxY ?? LOGICAL_HEIGHT;
    this.maxSpeed = options.maxSpeed ?? 260;
    this.heading = 0;
    this.speed = 0;
    this.flap = 0;
    this.invulnerable = 0;
    this.jacketFit = { x: 0, y: 0, rx: 1.3, ry: 0.6 };
  }

  update(dt, input) {
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
    const length = Math.hypot(horizontal, vertical);
    const dirX = length > 0 ? horizontal / length : 0;
    const dirY = length > 0 ? vertical / length : 0;
    const response = 1 - Math.exp(-PLAYER.response * dt);
    this.vx = lerp(this.vx, dirX * this.maxSpeed, response);
    this.vy = lerp(this.vy, dirY * this.maxSpeed, response);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, this.radius, this.maxX - this.radius);
    this.y = clamp(this.y, this.radius, this.maxY - this.radius);
    this.speed = Math.hypot(this.vx, this.vy);
    if (this.speed > 24) {
      this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), 1 - Math.exp(-PLAYER.turnResponse * dt));
    }
    if (Math.abs(this.vx) > 6) this.facing = this.vx > 0 ? 1 : -1;
    this.flap += dt * (2 + this.speed * 0.02);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    ctx.scale(this.facing, 1);
    drawDolphinBody(ctx, this.radius, {
      phase: this.flap,
      body: playerColor('body', '#5a7d97'),
      belly: playerColor('belly', '#cfe3ee'),
    });
    drawAccessory(ctx, this.radius, this.age, { entity: this, heading: this.heading });
    drawEmote(ctx, this, this.radius, this.age);
    ctx.restore();
  }
}

export function drawDolphinBody(ctx, s, pose = {}) {
  const phase = pose.phase ?? 0;
  const swim = Math.sin(phase * 4) * 0.18;
  const body = pose.body ?? '#5a7d97';
  const belly = pose.belly ?? '#cfe3ee';
  const dark = '#43607a';

  ctx.save();
  ctx.translate(-s * 1.6, swim * s * 0.4);
  ctx.rotate(swim);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-s * 1.05, -s * 0.66);
  ctx.lineTo(-s * 0.55, 0);
  ctx.lineTo(-s * 1.05, s * 0.66);
  ctx.closePath();
  ctx.fillStyle = dark;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, -s * 0.5);
  ctx.quadraticCurveTo(s * 0.05, -s * 1.4, s * 0.5, -s * 0.44);
  ctx.quadraticCurveTo(s * 0.1, -s * 0.5, -s * 0.2, -s * 0.5);
  ctx.closePath();
  ctx.fill();

  for (const sx of [s * 0.25, -s * 0.3]) {
    ctx.beginPath();
    ctx.moveTo(sx, s * 0.4);
    ctx.quadraticCurveTo(sx - s * 0.1, s * 1.05, sx - s * 0.6, s * 0.82);
    ctx.quadraticCurveTo(sx - s * 0.28, s * 0.48, sx, s * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(s * 1.55, 0, s * 0.78, s * 0.24, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 1.7, s * 0.62, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(s * 0.1, s * 0.24, s * 1.2, s * 0.24, 0.03, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#0c1b22';
  ctx.beginPath();
  ctx.arc(s * 1.0, -s * 0.16, s * 0.06, 0, TAU);
  ctx.fill();
}
