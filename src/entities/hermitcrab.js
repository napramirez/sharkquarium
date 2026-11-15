import { Entity } from './entity.js';
import { clamp, lerp, TAU } from '../engine/math.js';
import { CONTROLS, HERMIT, PLAYER, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';
import { playerColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';

export class HermitCrab extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: options.radius ?? HERMIT.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.groundY = options.groundY ?? LOGICAL_HEIGHT - 60;
    this.shellIndex = options.shellIndex ?? 0;
    this.onGround = false;
    this.legPhase = 0;
    this.invulnerable = 0;
    this.heading = 0;
    this.speed = 0;
    this.jacketFit = { x: 0, y: 0, rx: 0.8, ry: 0.7 };
  }

  get shell() {
    return HERMIT.shells[this.shellIndex % HERMIT.shells.length];
  }

  get armor() {
    return this.shell.armor;
  }

  cycleShell() {
    this.shellIndex = (this.shellIndex + 1) % HERMIT.shells.length;
    return this.shell;
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
    const target = clamp(horizontal, -1, 1) * HERMIT.maxSpeed * this.shell.speed;
    this.vx = lerp(this.vx, target, 1 - Math.exp(-HERMIT.response * dt));
    this.x += this.vx * dt;
    this.x = clamp(this.x, this.radius, this.maxX - this.radius);
    const jump = input.isDown('confirm') || input.isDown('up');
    if (this.onGround && jump) {
      this.vy = -380;
      this.onGround = false;
    }
    this.vy += 960 * dt;
    this.y += this.vy * dt;
    const floor = this.groundY - this.radius;
    if (this.y >= floor) {
      this.y = floor;
      this.vy = 0;
      this.onGround = true;
    }
    this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
    this.speed = Math.abs(this.vx);
    if (Math.abs(this.vx) > 6) this.facing = this.vx > 0 ? 1 : -1;
    this.legPhase += dt * (3 + this.speed * 0.04);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    ctx.scale(this.facing, 1);
    drawHermitBody(ctx, this.radius, this);
    drawAccessory(ctx, this.radius, this.age, { entity: this, heading: this.heading });
    drawEmote(ctx, this, this.radius, this.age);
    ctx.restore();
  }
}

export function drawHermitBody(ctx, radius, pose) {
  const r = radius;
  const shell = pose.shell ?? HERMIT.shells[0];
  const legPhase = pose.legPhase ?? 0;
  const body = playerColor('body', '#e0794a');
  const accent = playerColor('accent', '#c85c34');
  const shellColor = '#b98a5a';
  const shellSize = 0.85 + shell.armor * 0.22;

  ctx.strokeStyle = accent;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      const bx = -r * 0.2 + i * r * 0.4;
      const swing = Math.sin(legPhase + i * 1.2 + (side > 0 ? Math.PI : 0)) * r * 0.2;
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.moveTo(bx, side * r * 0.3);
      ctx.lineTo(bx + swing, side * r * 0.8);
      ctx.lineTo(bx + swing * 1.6, side * r * 1.05);
      ctx.stroke();
    }
  }

  ctx.beginPath();
  ctx.ellipse(r * 0.35, r * 0.1, r * 0.6, r * 0.5, 0, 0, TAU);
  ctx.fillStyle = body;
  ctx.fill();

  ctx.save();
  ctx.translate(-r * 0.2, -r * 0.2);
  ctx.fillStyle = shellColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * shellSize, r * shellSize * 0.95, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#7a5232';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90, 60, 34, 0.7)';
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  for (let i = 0; i < 22; i += 1) {
    const t = i / 21;
    const a = t * TAU * 1.9 - 0.6;
    const rr = r * shellSize * 0.92 * (1 - t * 0.9);
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  for (const side of [-1, 1]) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(r * 0.7, side * r * 0.25);
    ctx.lineTo(r * 0.95, side * r * 0.45);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.98, side * r * 0.46, r * 0.13, 0, TAU);
    ctx.fillStyle = '#f4fbff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 1.0, side * r * 0.46, r * 0.06, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
  }
}
