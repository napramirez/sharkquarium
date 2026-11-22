import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, CUTTLEFISH, PLAYER, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';
import { drawCuttlefishGlyph } from './cuttlefishshape.js';

export class Cuttlefish extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: options.radius ?? CUTTLEFISH.radius });
    this.controls = options.controls ?? CONTROLS.solo;
    this.pointerSteering = options.pointer ?? true;
    this.maxX = options.maxX ?? LOGICAL_WIDTH;
    this.maxSpeed = options.maxSpeed ?? CUTTLEFISH.maxSpeed;
    this.heading = 0;
    this.speed = 0;
    this.invulnerable = 0;
    this.camo = 0;
    this.strike = 0;
    this.strikeTimer = 0;
    this.strikeTime = 0.42;
    this.splay = 0;
    this.hypno = 0;
    this.jacketFit = { x: 0, y: 0, rx: 0.78, ry: 0.72 };
  }

  fireTentacles() {
    if (this.strikeTimer <= 0) this.strikeTimer = this.strikeTime;
  }

  update(dt, input) {
    super.update(dt);
    if (input && typeof input.wasPressed === 'function' && input.wasPressed('KeyV')) startEmote(this);
    updateEmote(this, dt);
    let horizontal = (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    let vertical = (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0);
    const hiding = input.isDown('PointerSecondary');
    if (this.pointerSteering && (input.pointer.down || input.pointer.look)) {
      const drag = Math.hypot(input.pointer.dragX, input.pointer.dragY);
      if (drag > PLAYER.pointerDeadzone) {
        horizontal = input.pointer.dragX / drag;
        vertical = input.pointer.dragY / drag;
      }
    }
    const speedScale = hiding ? 0.4 : 1;
    const response = 1 - Math.exp(-CUTTLEFISH.response * dt);
    this.vx = lerp(this.vx, clamp(horizontal, -1, 1) * this.maxSpeed * speedScale, response);
    this.vy = lerp(this.vy, clamp(vertical, -1, 1) * this.maxSpeed * speedScale, response);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, this.radius, this.maxX - this.radius);
    this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
    this.speed = Math.hypot(this.vx, this.vy);
    if (this.speed > 24) {
      this.heading = lerpAngle(this.heading, Math.atan2(this.vy, this.vx), 1 - Math.exp(-CUTTLEFISH.turnResponse * dt));
    }
    if (Math.abs(this.vx) > 6) this.facing = this.vx > 0 ? 1 : -1;
    this.camo = clamp(this.camo + (hiding ? dt * CUTTLEFISH.camoFade : -dt * CUTTLEFISH.camoFade * 1.5), 0, 1);
    this.strikeTimer = Math.max(0, this.strikeTimer - dt);
    this.strike = this.strikeTimer > 0 ? Math.sin(Math.PI * (1 - this.strikeTimer / this.strikeTime)) : 0;
    this.splay = this.camo;
    this.hypno = clamp(this.hypno + (input.isDown('cycleAnchor') ? dt * 5 : -dt * 4), 0, 1);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  render(ctx) {
    const flash = this.invulnerable > 0 && Math.sin(this.age * 42) > 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flash) ctx.globalAlpha = 0.4;
    ctx.scale(this.facing, 1);
    drawCuttlefishBody(ctx, this.radius, this);
    drawAccessory(ctx, this.radius, this.age, { entity: this, heading: this.heading });
    drawEmote(ctx, this, this.radius, this.age);
    ctx.restore();
  }
}

export function drawCuttlefishBody(ctx, radius, pose) {
  drawCuttlefishGlyph(ctx, radius, pose, playerColor('body', '#c0392b'));
}
