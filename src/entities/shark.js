import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, PLAYER, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor, chaosActive, eyeOpenFor, drawEye, drawPupil } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';

export class Shark extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: PLAYER.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.maxY = options.maxY ?? LOGICAL_HEIGHT;
    this.maxSpeed = PLAYER.maxSpeed;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.jacketFit = { x: -0.5, y: 0.02, rx: 1.1, ry: 0.78 };
  }

  update(dt, input) {
    super.update(dt);
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
      const turn = 1 - Math.exp(-PLAYER.turnResponse * dt);
      this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), turn);
    }
    this.updateFacing();
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    if (input && typeof input.wasPressed === 'function' && input.wasPressed('KeyV')) startEmote(this);
    updateEmote(this, dt);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    const radius = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    ctx.scale(this.facing, 1);
    drawSharkBody(ctx, radius, this);
    drawAccessory(ctx, radius, this.age, { entity: this, heading: this.heading });
    drawEmote(ctx, this, radius, this.age);
    ctx.restore();
  }
}

export function drawSharkBody(ctx, radius, pose) {
  const r = radius;
  const age = pose.age ?? 0;
  const speed = pose.speed ?? 0;
  const wiggle = Math.sin(age * (4 + speed * 0.02)) * 0.34;
  const body = playerColor('body', COLORS.shark);
  const belly = playerColor('belly', COLORS.sharkBelly);
  const fin = chaosActive() ? playerColor('accent', COLORS.sharkFin) : COLORS.sharkFin;
  const tailColor = playerColor('tail', fin);
  const L = r * 1.9;
  const W = r * 0.82;

  ctx.save();
  ctx.translate(-L, 0);
  ctx.rotate(wiggle);
  ctx.beginPath();
  ctx.moveTo(r * 0.95, -r * 0.24);
  ctx.lineTo(-r * 0.2, -r * 0.13);
  ctx.lineTo(-r * 0.2, r * 0.13);
  ctx.lineTo(r * 0.95, r * 0.24);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
  ctx.lineWidth = r * 0.03;
  ctx.stroke();
  const finTip = (bx, by, tx, ty, baseColor) => {
    const g = ctx.createLinearGradient(bx, by, tx, ty);
    g.addColorStop(0, baseColor);
    g.addColorStop(0.38, '#33506a');
    g.addColorStop(0.72, '#101820');
    g.addColorStop(1, '#000000');
    return g;
  };

  ctx.fillStyle = finTip(r * 0.25, -r * 0.18, r * 0.05, -r * 0.47, fin);
  ctx.beginPath();
  ctx.moveTo(r * 0.52, -r * 0.2);
  ctx.lineTo(r * 0.05, -r * 0.47);
  ctx.lineTo(-r * 0.02, -r * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = finTip(r * 0.41, r * 0.185, r * 0.28, r * 0.45, fin);
  ctx.beginPath();
  ctx.moveTo(r * 0.66, r * 0.2);
  ctx.lineTo(r * 0.28, r * 0.45);
  ctx.lineTo(r * 0.16, r * 0.17);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = finTip(r * 0.035, r * 0.16, -r * 0.06, r * 0.38, fin);
  ctx.beginPath();
  ctx.moveTo(r * 0.24, r * 0.17);
  ctx.lineTo(-r * 0.06, r * 0.38);
  ctx.lineTo(-r * 0.17, r * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.translate(-r * 0.2, 0);
  const tailGrad = ctx.createRadialGradient(r * 0.15, 0, r * 0.12, r * 0.15, 0, r * 1.4);
  tailGrad.addColorStop(0, tailColor);
  tailGrad.addColorStop(0.42, '#33506a');
  tailGrad.addColorStop(0.74, '#101820');
  tailGrad.addColorStop(1, '#000000');
  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  ctx.moveTo(r * 0.15, 0);
  ctx.quadraticCurveTo(-r * 0.4, -r * 0.55, -r * 0.98, -r * 0.98);
  ctx.quadraticCurveTo(-r * 0.4, -r * 0.18, -r * 0.28, 0);
  ctx.quadraticCurveTo(-r * 0.5, r * 0.22, -r * 0.72, r * 0.58);
  ctx.quadraticCurveTo(-r * 0.24, r * 0.22, r * 0.15, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const tri = (ax, ay, bx, by, cx, cy, b0x, b0y) => {
    ctx.fillStyle = finTip(b0x, b0y, cx, cy, fin);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
  };
  tri(r * 0.5, W * 0.6, -r * 0.3, W * 0.65, -r * 0.55, r * 1.6, r * 0.1, W * 0.625);
  tri(-r * 0.5, W * 0.55, -r * 1.0, W * 0.5, -r * 1.05, r * 1.45, -r * 0.75, W * 0.525);

  const dorsalGrad = ctx.createLinearGradient(0, -W * 0.6, 0, -r * 1.7);
  dorsalGrad.addColorStop(0, fin);
  dorsalGrad.addColorStop(0.4, '#2c4760');
  dorsalGrad.addColorStop(0.72, '#0d141b');
  dorsalGrad.addColorStop(1, '#000000');
  ctx.fillStyle = dorsalGrad;
  ctx.beginPath();
  ctx.moveTo(r * 0.55, -W * 0.6);
  ctx.lineTo(-r * 0.35, -W * 0.65);
  ctx.lineTo(r * 0.0, -r * 1.7);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(L, 0);
  ctx.quadraticCurveTo(L * 0.5, -W, 0, -W);
  ctx.quadraticCurveTo(-L * 0.5, -W, -L, 0);
  ctx.quadraticCurveTo(-L * 0.5, W, 0, W);
  ctx.quadraticCurveTo(L * 0.5, W, L, 0);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.lineWidth = r * 0.04;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(L * 0.96, 0);
  ctx.quadraticCurveTo(L * 0.5, W * 0.96, 0, W * 0.96);
  ctx.quadraticCurveTo(-L * 0.5, W * 0.96, -L * 0.96, 0);
  ctx.closePath();
  ctx.fillStyle = belly;
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.24)';
  ctx.lineWidth = r * 0.035;
  for (let i = 0; i < 5; i += 1) {
    const gx = r * 0.5 - i * r * 0.13;
    ctx.beginPath();
    ctx.moveTo(gx, -W * 0.45);
    ctx.quadraticCurveTo(gx - r * 0.05, 0, gx, W * 0.42);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = r * 0.03;
  ctx.beginPath();
  ctx.moveTo(L * 0.85, 0);
  ctx.quadraticCurveTo(0, W * 0.16, -L * 0.85, 0);
  ctx.stroke();

  const open = eyeOpenFor(pose);
  drawEye(ctx, r * 1.3, -r * 0.28, r * 0.15, { open, light: '#f6fbff' });
  drawPupil(ctx, r * 1.34, -r * 0.28, r * 0.075, { open, color: '#0e1c2c' });
  ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
  ctx.beginPath();
  ctx.arc(r * 1.62, r * 0.16, r * 0.04, 0, TAU);
  ctx.fill();
}
