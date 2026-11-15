import { Entity } from './entity.js';
import { rand, clamp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, PLAYER, MOONJELLY, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';

export class MoonJelly extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: MOONJELLY.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.maxSpeed = MOONJELLY.maxSpeed;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.pulsePhase = rand(0, TAU);
    this.jacketFit = { x: 0, y: -0.32, rx: 0.72, ry: 0.58 };
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
    const response = 1 - Math.exp(-MOONJELLY.response * dt);
    this.vx += (dirX * MOONJELLY.maxSpeed - this.vx) * response;
    this.vy += (dirY * MOONJELLY.maxSpeed - this.vy) * response;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, this.radius, this.maxX - this.radius);
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
    drawMoonJellyBody(ctx, radius, this);
    drawAccessory(ctx, radius, this.age, { entity: this, heading: this.heading });
    drawEmote(ctx, this, radius, this.age);
    ctx.restore();
  }
}

export function drawMoonJellyBody(ctx, radius, pose) {
  const r = radius;
  const age = pose.age ?? 0;
  const pulse = 1 + Math.sin(pose.pulsePhase ?? 0) * 0.08;
  const bell = playerColor('body', 'rgba(255, 143, 163, 0.5)');
  const rim = playerColor('accent', COLORS.jelly);

  ctx.strokeStyle = 'rgba(255, 143, 163, 0.55)';
  ctx.lineWidth = r * 0.04;
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i += 1) {
    const offset = (i - 4) * r * 0.22;
    const wobble = Math.sin(age * 2.6 + i * 1.3) * r * 0.2;
    ctx.beginPath();
    ctx.moveTo(offset, r * 0.3);
    ctx.quadraticCurveTo(offset + wobble, r * 1.2, offset * 1.2 + wobble, r * 2.1);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 180, 200, 0.7)';
  ctx.lineWidth = r * 0.16;
  for (let i = 0; i < 4; i += 1) {
    const offset = (i - 1.5) * r * 0.3;
    const wobble = Math.sin(age * 3 + i) * r * 0.15;
    ctx.beginPath();
    ctx.moveTo(offset, r * 0.35);
    ctx.quadraticCurveTo(offset + wobble, r * 0.9, offset * 0.6 + wobble, r * 1.25);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-r * pulse, r * 0.2);
  ctx.quadraticCurveTo(-r * 1.2 * pulse, -r * pulse, 0, -r * 1.15 * pulse);
  ctx.quadraticCurveTo(r * 1.2 * pulse, -r * pulse, r * pulse, r * 0.2);
  ctx.quadraticCurveTo(r * 0.6 * pulse, r * 0.5, r * 0.3 * pulse, r * 0.24);
  ctx.quadraticCurveTo(0, r * 0.5, -r * 0.3 * pulse, r * 0.24);
  ctx.quadraticCurveTo(-r * 0.6 * pulse, r * 0.5, -r * pulse, r * 0.2);
  ctx.closePath();
  ctx.fillStyle = bell;
  ctx.fill();
  ctx.strokeStyle = rim;
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 120, 150, 0.45)';
  ctx.lineWidth = r * 0.05;
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.1);
    ctx.lineTo(Math.cos(a) * r * 0.72, -r * 0.2 + Math.sin(a) * r * 0.62);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 120, 150, 0.6)';
  ctx.lineWidth = r * 0.1;
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * TAU + Math.PI / 4;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.42, -r * 0.14 + Math.sin(a) * r * 0.34, r * 0.16, 0.4, Math.PI * 1.4);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.4, r * 0.24, -0.4, 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.globalAlpha = 1;
}


