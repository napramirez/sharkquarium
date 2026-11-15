import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, PLAYER, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';
import { playerColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';

export class SeaTurtle extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: options.radius ?? 28 });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.maxY = options.maxY ?? LOGICAL_HEIGHT;
    this.maxSpeed = options.maxSpeed ?? 220;
    this.heading = 0;
    this.speed = 0;
    this.paddle = 0;
    this.invulnerable = 0;
    this.jacketFit = { x: 0, y: 0, rx: 1.0, ry: 0.95 };
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
    if (this.speed > 20) {
      this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), 1 - Math.exp(-PLAYER.turnResponse * dt));
    }
    if (Math.abs(this.vx) > 6) this.facing = this.vx > 0 ? 1 : -1;
    this.paddle += dt * (2.4 + this.speed * 0.015);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    ctx.scale(this.facing, 1);
    drawSeaTurtleBody(ctx, this.radius, {
      paddle: this.paddle,
      shell: playerColor('body', '#5d8f6a'),
      shellDark: playerColor('accent', '#3f6b4d'),
      skin: playerColor('belly', '#7fa88a'),
    });
    drawAccessory(ctx, this.radius, this.age, { entity: this, heading: this.heading });
    drawEmote(ctx, this, this.radius, this.age);
    ctx.restore();
  }
}

export function drawSeaTurtleBody(ctx, r, pose = {}) {
  const paddle = pose.paddle ?? 0;
  const shell = pose.shell ?? '#5d8f6a';
  const shellDark = pose.shellDark ?? '#3f6b4d';
  const skin = pose.skin ?? '#7fa88a';
  const flap = Math.sin(paddle * 2) * 0.5;

  ctx.fillStyle = skin;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(r * 0.35, side * r * 0.5);
    ctx.rotate(side * (0.5 + flap * 0.5));
    ctx.beginPath();
    ctx.ellipse(r * 0.7, 0, r * 0.72, r * 0.24, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(-r * 0.7, side * r * 0.5);
    ctx.rotate(side * (0.4 + flap * 0.4));
    ctx.beginPath();
    ctx.ellipse(-r * 0.5, 0, r * 0.5, r * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(r * 1.02, 0, r * 0.34, r * 0.26, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0c1b22';
  ctx.beginPath();
  ctx.arc(r * 1.16, -r * 0.08, r * 0.05, 0, TAU);
  ctx.fill();

  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.0, r * 0.85, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = shellDark;
  ctx.lineWidth = r * 0.08;
  ctx.stroke();

  ctx.strokeStyle = shellDark;
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.55, r * 0.46, 0, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * TAU + 0.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.46);
    ctx.lineTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.83);
    ctx.stroke();
  }
}
