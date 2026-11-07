import { Entity } from './entity.js';
import { clamp, lerpAngle, rand, TAU } from '../engine/math.js';
import { ABYSS, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Leviathan extends Entity {
  constructor() {
    super({ x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT * 0.32, radius: ABYSS.radius });
    this.santa = true;
    this.maxHp = ABYSS.health;
    this.hp = ABYSS.health;
    this.phase = 1;
    this.state = 'hunt';
    this.stateTimer = ABYSS.huntTime;
    this.heading = Math.PI / 2;
    this.summonTimer = ABYSS.summonEvery;
    this.hitFlash = 0;
    this.stun = 0;
    this.dead = false;
    this.targetX = this.x;
    this.targetY = this.y + 200;
    this.blink = 0;
    this.blinkHold = 0;
    this.blinkTimer = rand(2.5, 5);
    this.gaze = null;
  }

  get hurtFraction() {
    return 1 - this.hp / this.maxHp;
  }

  get vulnerable() {
    return this.state === 'recover' || this.stun > 0;
  }

  phaseSpeed() {
    return 1 + (this.phase - 1) * 0.5;
  }

  eyePosition() {
    return {
      x: this.x + Math.cos(this.heading) * ABYSS.eyeOffset,
      y: this.y + Math.sin(this.heading) * ABYSS.eyeOffset,
    };
  }

  nearest(players) {
    let best = null;
    let bestDistance = Infinity;
    for (const player of players) {
      const distance = Math.hypot(player.x - this.x, player.y - this.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = player;
      }
    }
    return best;
  }

  damage(amount) {
    if (this.dead) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 1;
    this.stun = ABYSS.recoverTime * 0.7;
    this.state = 'recover';
    this.stateTimer = this.stun;
    const nextPhase = 1 + Math.floor(this.hurtFraction / (1 / 3) + 1e-6);
    if (nextPhase > this.phase) this.phase = Math.min(3, nextPhase);
    if (this.hp <= 0) {
      this.dead = true;
      this.state = 'dying';
      this.stateTimer = 1.6;
    }
    return true;
  }

  summon() {
    this.state = 'telegraph';
    this.stateTimer = ABYSS.telegraph / this.phaseSpeed();
  }

  update(dt, players) {
    super.update(dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.4);
    this.blinkTimer -= dt;
    if (this.blinkHold > 0) {
      this.blinkHold = Math.max(0, this.blinkHold - dt);
      this.blink = Math.sin(Math.PI * (1 - this.blinkHold / 0.16));
      if (this.blinkHold <= 0) this.blink = 0;
    } else if (this.blinkTimer <= 0) {
      this.blinkTimer = rand(2.5, 5);
      this.blinkHold = 0.16;
    }
    if (this.dead) {
      this.stateTimer -= dt;
      this.y += 40 * dt;
      this.rotation = (this.rotation ?? 0) + dt * 0.6;
      return;
    }
    const threat = this.nearest(players);
    if (threat) this.gaze = { x: threat.x, y: threat.y };
    if (this.stun > 0) {
      this.stun = Math.max(0, this.stun - dt);
      this.y += Math.sin(this.age * 8) * 40 * dt;
      return;
    }
    const speed = this.phaseSpeed();
    this.stateTimer -= dt;
    if (this.state === 'hunt') {
      const target = threat ?? { x: this.x, y: LOGICAL_HEIGHT * 0.5 };
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const distance = Math.hypot(dx, dy) || 1;
      const step = ABYSS.huntSpeed * speed * dt;
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
      this.heading = lerpAngle(this.heading, Math.atan2(dy, dx), 1 - Math.exp(-3 * dt));
      this.summonTimer -= dt;
      if (this.summonTimer <= 0) {
        this.summonTimer = ABYSS.summonEvery;
        this.state = 'summon';
        this.stateTimer = 0.4;
      } else if (this.stateTimer <= 0) {
        this.targetX = target.x;
        this.targetY = target.y;
        this.state = 'telegraph';
        this.stateTimer = ABYSS.telegraph / speed;
      }
    } else if (this.state === 'summon') {
      if (this.stateTimer <= 0) {
        this.state = 'telegraph';
        this.stateTimer = ABYSS.telegraph / speed;
      }
    } else if (this.state === 'telegraph') {
      if (threat && this.stateTimer > 0.25) {
        this.targetX = threat.x;
        this.targetY = threat.y;
      }
      if (this.stateTimer <= 0) {
        this.state = 'lunge';
        this.stateTimer = ABYSS.lungeTime;
      }
    } else if (this.state === 'lunge') {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.hypot(dx, dy) || 1;
      const step = ABYSS.lungeSpeed * speed * dt;
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
      this.heading = Math.atan2(dy, dx);
      if (this.stateTimer <= 0) {
        this.state = 'recover';
        this.stateTimer = ABYSS.recoverTime / speed;
      }
    } else if (this.state === 'recover') {
      this.y += Math.sin(this.age * 2) * 8 * dt;
      if (this.stateTimer <= 0) {
        this.state = 'hunt';
        this.stateTimer = ABYSS.huntTime / speed;
      }
    }
    this.x = clamp(this.x, this.radius, LOGICAL_WIDTH - this.radius);
    this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
  }

  render(ctx) {
    const r = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);
    ctx.globalAlpha = this.dead ? Math.max(0, this.stateTimer / 1.6) : 1;

    this.renderTail(ctx, r);

    ctx.strokeStyle = COLORS.leviathanDark;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i += 1) {
      const side = i - 2.5;
      const startX = -r * 0.4;
      const startY = side * r * 0.34;
      ctx.lineWidth = (16 - Math.abs(side) * 2.4) * (1 + this.phase * 0.12);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      const dots = [];
      for (let k = 1; k <= 6; k += 1) {
        const t = k / 6;
        const px = startX - t * r * 1.5;
        const py = startY + Math.sin(this.age * 3 + i + t * 3.5) * r * 0.28 * t;
        ctx.lineTo(px, py);
        dots.push({ x: px, y: py });
      }
      ctx.stroke();
      ctx.fillStyle = COLORS.leviathanGlow;
      for (const dot of dots) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2.6, 0, TAU);
        ctx.fill();
      }
    }

    const gradient = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.2, 0, 0, r * 1.1);
    gradient.addColorStop(0, this.hitFlash > 0.1 ? '#dbe7ff' : COLORS.leviathan);
    gradient.addColorStop(1, COLORS.leviathanDark);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * 0.9, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = COLORS.leviathanDark;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = COLORS.leviathanGlow;
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r * 0.9, Math.sin(angle) * r * 0.72, 2.2, 0, TAU);
      ctx.fill();
    }

    const bright = this.vulnerable ? 1 : 0.85;
    const gazeLocal = this.gaze
      ? Math.atan2(this.gaze.y - this.y, this.gaze.x - this.x) - this.heading
      : null;
    this.renderEye(ctx, r * 0.62, 0, r * 0.26, bright, gazeLocal);
    this.renderEye(ctx, r * 0.5, -r * 0.42, r * 0.12, bright * 0.6, gazeLocal);
    this.renderEye(ctx, r * 0.5, r * 0.42, r * 0.12, bright * 0.6, gazeLocal);
    ctx.restore();

    if (this.state === 'telegraph') {
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(this.age * 20);
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.targetX, this.targetY);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderEye(ctx, ex, ey, radius, brightness, gazeLocal) {
    drawLeviathanEye(ctx, ex, ey, radius, brightness, this.blink, gazeLocal);
  }

  renderTail(ctx, r) {
    const length = r * 3.4;
    const sway = Math.sin(this.age * 1.6) * r * 0.5;
    const baseX = -r * 0.8;
    const tipX = -length;
    const topP0 = { x: baseX, y: -r * 0.32 };
    const topP1 = { x: -r * 2.2, y: -r * 0.2 + sway };
    const topP2 = { x: tipX, y: sway * 1.4 };
    const botP0 = { x: baseX, y: r * 0.32 };
    const botP1 = { x: -r * 2.2, y: r * 0.2 + sway };
    const botP2 = { x: tipX, y: sway * 1.4 };
    const quad = (p0, p1, p2, t) => ({
      x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
      y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y,
    });
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(topP0.x, topP0.y);
    ctx.quadraticCurveTo(topP1.x, topP1.y, topP2.x, topP2.y);
    ctx.quadraticCurveTo(botP1.x, botP1.y, botP0.x, botP0.y);
    ctx.closePath();
    ctx.fillStyle = COLORS.leviathanDark;
    ctx.fill();
    ctx.strokeStyle = COLORS.leviathan;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = COLORS.leviathanGlow;
    for (let i = 1; i <= 7; i += 1) {
      const t = i / 8;
      const top = quad(topP0, topP1, topP2, t);
      const bottom = quad(botP0, botP1, botP2, t);
      ctx.beginPath();
      ctx.arc(top.x, top.y, 2.6, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bottom.x, bottom.y, 2.6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawLeviathanEye(ctx, ex, ey, radius, brightness = 1, blink = 0, gaze = null) {
  const open = Math.max(0.06, 1 - blink);
  const halo = ctx.createRadialGradient(ex, ey, 1, ex, ey, radius * 4.5);
  halo.addColorStop(0, `rgba(66, 232, 255, ${0.55 * brightness})`);
  halo.addColorStop(1, 'rgba(66, 232, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(ex, ey, radius * 4.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = COLORS.leviathanEye;
  ctx.beginPath();
  ctx.ellipse(ex, ey, radius, radius * 0.9 * open, 0, 0, TAU);
  ctx.fill();
  const dx = gaze == null ? 1 : Math.cos(gaze);
  const dy = gaze == null ? 0 : Math.sin(gaze);
  const shift = radius * 0.4;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(
    ex + dx * shift,
    ey + dy * shift,
    radius * 0.3,
    radius * 0.3 * open,
    0,
    0,
    TAU,
  );
  ctx.fill();
  ctx.strokeStyle = `rgba(150, 230, 255, ${0.8 * brightness})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(ex, ey, radius * 0.92, radius * 0.84 * open, 0, 0, TAU);
  ctx.stroke();
}
