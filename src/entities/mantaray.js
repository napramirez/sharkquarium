import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, MANTA, PLAYER, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';

export class MantaRay extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: options.radius ?? MANTA.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.maxSpeed = options.maxSpeed ?? MANTA.maxSpeed;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.flap = 0;
    this.jacketFit = { x: 0, y: 0, rx: 0.9, ry: 0.9 };
  }

  update(dt, input) {
    super.update(dt);
    if (input && typeof input.wasPressed === 'function' && input.wasPressed('KeyV')) startEmote(this);
    updateEmote(this, dt);
    let horizontal = (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    if (this.pointerSteering && (input.pointer.down || input.pointer.look)) {
      const drag = Math.hypot(input.pointer.dragX, input.pointer.dragY);
      if (drag > PLAYER.pointerDeadzone) horizontal = input.pointer.dragX / drag;
    }
    const flapHeld = input.isDown(this.controls.up) || input.isDown('confirm');
    const response = 1 - Math.exp(-MANTA.response * dt);
    this.vx = lerp(this.vx, clamp(horizontal, -1, 1) * this.maxSpeed, response);
    this.vy += MANTA.gravity * dt;
    if (flapHeld) this.vy -= MANTA.thrust * dt;
    this.vy = clamp(this.vy, -MANTA.maxRise, MANTA.maxSink);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, this.radius, this.maxX - this.radius);
    this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
    this.speed = Math.hypot(this.vx, this.vy);
    if (this.speed > 24) {
      this.heading = lerpAngle(this.heading, Math.atan2(this.vy * 0.5, this.vx || 0.001), 1 - Math.exp(-MANTA.turnResponse * dt));
    }
    if (Math.abs(this.vx) > 6) this.facing = this.vx > 0 ? 1 : -1;
    this.flap = clamp(this.flap + (flapHeld ? dt * 5 : -dt * 5), 0, 1);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    ctx.scale(this.facing, 1);
    drawMantaBody(ctx, this.radius, this);
    drawAccessory(ctx, this.radius, this.age, { entity: this, heading: this.heading });
    drawEmote(ctx, this, this.radius, this.age);
    ctx.restore();
  }
}

export function drawMantaBody(ctx, radius, pose) {
  const r = radius;
  const age = pose.age ?? 0;
  const flap = pose.flap ?? 0;
  const body = playerColor('body', '#39485c');
  const belly = playerColor('belly', '#c6d2e2');
  const accent = playerColor('accent', '#8fa6bd');
  const beat = Math.sin(age * 2.2) * 0.06 + flap * 0.16;
  const sweep = flap * r * 0.3;

  const frontX = r * 1.5;
  const backX = -r * 1.45;
  const wingX = -r * 0.1 - sweep;
  const wingY = r * (2.0 + beat * 1.4);

  ctx.lineCap = 'round';

  ctx.strokeStyle = accent;
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.moveTo(backX, 0);
  ctx.quadraticCurveTo(-r * 2.1, Math.sin(age * 2) * r * 0.3, -r * 2.4, Math.sin(age * 1.5 + 1) * r * 0.35);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(frontX, 0);
  ctx.lineTo(wingX, -wingY);
  ctx.lineTo(backX, 0);
  ctx.lineTo(wingX, wingY);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = r * 0.04;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(frontX * 0.82, 0);
  ctx.lineTo(wingX * 0.55, -wingY * 0.52);
  ctx.lineTo(backX * 0.8, 0);
  ctx.lineTo(wingX * 0.55, wingY * 0.52);
  ctx.closePath();
  ctx.fillStyle = belly;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = r * 0.03;
  for (let i = 0; i < 4; i += 1) {
    const gx = r * 0.75 - i * r * 0.2;
    ctx.beginPath();
    ctx.moveTo(gx, -r * 0.16);
    ctx.quadraticCurveTo(gx - r * 0.04, 0, gx, r * 0.14);
    ctx.stroke();
  }

  ctx.fillStyle = body;
  ctx.strokeStyle = accent;
  ctx.lineWidth = r * 0.035;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(r * 1.72, side * r * 0.3, r * 0.42, r * 0.15, side * 0.16, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = r * 0.045;
  ctx.beginPath();
  ctx.moveTo(r * 1.28, -r * 0.08);
  ctx.quadraticCurveTo(r * 1.22, 0, r * 1.28, r * 0.08);
  ctx.stroke();

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(r * 1.0, side * r * 0.42, r * 0.1, r * 0.085, 0, 0, TAU);
    ctx.fillStyle = '#f4fbff';
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = r * 0.025;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 1.02, side * r * 0.42, r * 0.04, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
  }
}
