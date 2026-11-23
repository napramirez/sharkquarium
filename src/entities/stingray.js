import { Entity } from './entity.js';
import { clamp, lerp, lerpAngle, TAU } from '../engine/math.js';
import { CONTROLS, PLAYER, STINGRAY, SAND, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';
import { playerColor, eyeOpenFor, activeSkin } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';
import { drawEmote, startEmote, updateEmote } from '../engine/emotes.js';

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
    this.jacketFit = { x: -0.05, y: 0, rx: 0.72, ry: 0.72 };
  }

  get concealed() {
    return this.burrowed;
  }

  tangle(duration) {
    this.tangleTimer = Math.max(this.tangleTimer, duration);
  }

  update(dt, input) {
    super.update(dt);
    if (input && typeof input.wasPressed === 'function' && input.wasPressed('KeyV')) startEmote(this);
    updateEmote(this, dt);
    const sandTop = LOGICAL_HEIGHT - SAND.height;
    let horizontal = (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    let vertical = (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0);
    if (this.pointerSteering && (input.pointer.down || input.pointer.look)) {
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
    const wantsDown = vertical > 0.5 || input.isDown('hide');
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
        this.facing = horizontal > 0 ? 1 : -1;
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
      this.updateFacing();
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
      ctx.scale(this.facing, 1);
        drawStingrayBody(ctx, radius, this);
      drawAccessory(ctx, radius, this.age, { entity: this, heading: this.heading });
      drawEmote(ctx, this, radius, this.age);
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
    const period = 3.8 + ((this.blinkSeed * 1.7) % 1.6);
    const phase = (((this.age + this.blinkSeed * 3.1) % period) + period) % period;
    const blinkStart = period - 0.24;
    const open = phase > blinkStart
      ? Math.max(0.05, 0.1 + 0.9 * Math.abs((phase - blinkStart) / 0.24 - 0.5) * 2)
      : 1;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(this.x + side * radius * 0.32, this.y - radius * 0.62);
      ctx.rotate(side * 0.38);
      ctx.fillStyle = '#f0cf4e';
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.2, Math.max(0.5, radius * 0.12 * open), 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 96, 30, 0.7)';
      ctx.lineWidth = radius * 0.02;
      ctx.stroke();
      ctx.fillStyle = '#101010';
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.06, Math.max(0.4, radius * 0.06 * open), 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}

export function drawStingrayBody(ctx, radius, pose) {
  const r = radius;
  const bodyColor = pose.bodyColor ?? COLORS.stingray;
  const raw = Boolean(pose.raw);
  const color = (slot, fallback) => (raw ? fallback : playerColor(slot, fallback));
  const tailPhase = pose.tailPhase ?? 0;
  const tailColor = pose.tailColor ?? (raw ? bodyColor : playerColor('tail', bodyColor));
  const tailOutline = pose.tailOutline ?? (raw ? null : playerColor('tailOutline', null));
  const open = eyeOpenFor(pose);
  const noSpots = pose.noSpots ?? (!raw && activeSkin().raySpots === false);

  const tailMid = Math.sin(tailPhase) * r * 0.5;
  const tailTipY = Math.sin(tailPhase + 1.1) * r * 0.55;
  const tailPath = () => {
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.32);
    ctx.quadraticCurveTo(-r * 2.7, tailMid, -r * 4.7, tailTipY);
    ctx.quadraticCurveTo(-r * 2.3, tailMid, -r * 0.55, r * 0.32);
    ctx.closePath();
  };
  if (pose.tail !== false) {
    ctx.save();
    ctx.lineJoin = 'round';
    if (tailOutline) {
      ctx.save();
      ctx.translate(-r * 0.1, 0);
      ctx.scale(1.12, 1.12);
      ctx.fillStyle = tailOutline;
      tailPath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = tailColor;
    tailPath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    tailPath();
    ctx.fill();
    ctx.restore();
  }

  const d = r * 2.0;
  ctx.beginPath();
  ctx.moveTo(0, -d);
  ctx.lineTo(d, 0);
  ctx.lineTo(0, d);
  ctx.lineTo(-d, 0);
  ctx.closePath();
  ctx.fillStyle = color('body', bodyColor);
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -d);
  ctx.lineTo(d, 0);
  ctx.lineTo(0, d);
  ctx.lineTo(-d, 0);
  ctx.closePath();
  ctx.clip();
  const edgeGrad = ctx.createLinearGradient(-d, 0, 0, 0);
  edgeGrad.addColorStop(0, '#b8541d');
  edgeGrad.addColorStop(0.42, '#c9905e');
  edgeGrad.addColorStop(0.8, color('body', bodyColor));
  edgeGrad.addColorStop(1, color('body', bodyColor));
  ctx.strokeStyle = edgeGrad;
  ctx.lineWidth = r * 0.42;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -d);
  ctx.lineTo(-d, 0);
  ctx.lineTo(0, d);
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.5, r * 0.72, 0, 0, TAU);
  ctx.fillStyle = color('body', bodyColor);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  if (!pose.bigSpot && !noSpots) {
    ctx.fillStyle = color('accent', pose.spotColor ?? 'rgba(70, 62, 50, 0.3)');
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.arc(-r * 0.85 + (i % 3) * r * 0.85, -r * 0.22 + (i < 3 ? 0 : r * 0.44), r * 0.09, 0, TAU);
      ctx.fill();
    }
  } else if (pose.bigSpot) {
    ctx.fillStyle = color('accent', pose.bigSpot);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, TAU);
    ctx.fill();
  }

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(-r * 1.7, side * r * 0.3);
    ctx.rotate(-side * (Math.PI / 4));
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.52, r * 0.24, 0, 0, TAU);
    ctx.fillStyle = color('body', bodyColor);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = r * 0.03;
    ctx.stroke();
    ctx.restore();
  }

  if (!pose.noEyes) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(r * 1.05, side * r * 0.34);
      ctx.rotate(-side * 0.38);
      ctx.fillStyle = '#f0cf4e';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.2, Math.max(0.6, r * 0.115 * open), 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 96, 30, 0.7)';
      ctx.lineWidth = r * 0.02;
      ctx.stroke();
      ctx.fillStyle = '#101010';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.5, r * 0.06 * open), 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(r * 0.55, side * r * 0.42);
    ctx.rotate(side * 0.6);
    ctx.fillStyle = 'rgba(18, 22, 28, 0.62)';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.15);
    ctx.bezierCurveTo(r * 0.11, -r * 0.02, r * 0.1, r * 0.11, 0, r * 0.11);
    ctx.bezierCurveTo(-r * 0.1, r * 0.11, -r * 0.11, -r * 0.02, 0, -r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
