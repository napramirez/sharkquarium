import { Entity } from './entity.js';
import { rand, lerpAngle, TAU } from '../engine/math.js';
import { SWARM_QUEEN, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class SwarmQueen extends Entity {
  constructor() {
    super({ x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT * 0.3, radius: SWARM_QUEEN.radius });
    this.maxHp = SWARM_QUEEN.health;
    this.hp = SWARM_QUEEN.health;
    this.phase = 1;
    this.state = 'hover';
    this.stateTimer = SWARM_QUEEN.hoverTime;
    this.heading = Math.PI / 2;
    this.actions = 0;
    this.hitFlash = 0;
    this.stun = 0;
    this.dead = false;
    this.targetX = this.x;
    this.targetY = this.y + 200;
  }

  get hurtFraction() {
    return 1 - this.hp / this.maxHp;
  }

  get vulnerable() {
    return this.state === 'open' || this.stun > 0;
  }

  phaseSpeed() {
    return 1 + (this.phase - 1) * 0.5;
  }

  corePosition() {
    return { x: this.x, y: this.y };
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
    this.stun = SWARM_QUEEN.openTime * 0.7;
    this.state = 'open';
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

  update(dt, players) {
    super.update(dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.4);
    if (this.dead) {
      this.stateTimer -= dt;
      this.y += 36 * dt;
      this.rotation = (this.rotation ?? 0) + dt * 0.6;
      return;
    }
    const threat = this.nearest(players);
    if (this.stun > 0) {
      this.stun = Math.max(0, this.stun - dt);
      this.y += Math.sin(this.age * 8) * 40 * dt;
      return;
    }
    const speed = this.phaseSpeed();
    this.stateTimer -= dt;
    if (this.state === 'hover') {
      const target = threat ?? { x: this.x, y: LOGICAL_HEIGHT * 0.4 };
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const distance = Math.hypot(dx, dy) || 1;
      const step = SWARM_QUEEN.hoverSpeed * speed * dt;
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
      this.heading = lerpAngle(this.heading, Math.atan2(dy, dx), 1 - Math.exp(-3 * dt));
      if (this.stateTimer <= 0) {
        this.actions += 1;
        if (this.actions % 2 === 0 && threat) {
          this.targetX = threat.x;
          this.targetY = threat.y;
          this.state = 'telegraph';
          this.stateTimer = SWARM_QUEEN.telegraph / speed;
        } else {
          this.state = 'summon';
          this.stateTimer = SWARM_QUEEN.summonTime;
        }
      }
    } else if (this.state === 'summon') {
      if (this.stateTimer <= 0) {
        this.state = 'open';
        this.stateTimer = SWARM_QUEEN.openTime / speed;
      }
    } else if (this.state === 'open') {
      this.y += Math.sin(this.age * 2) * 8 * dt;
      if (this.stateTimer <= 0) {
        this.state = 'hover';
        this.stateTimer = SWARM_QUEEN.hoverTime / speed;
      }
    } else if (this.state === 'telegraph') {
      if (threat && this.stateTimer > 0.25) {
        this.targetX = threat.x;
        this.targetY = threat.y;
      }
      if (this.stateTimer <= 0) {
        this.state = 'charge';
        this.stateTimer = SWARM_QUEEN.chargeTime;
      }
    } else if (this.state === 'charge') {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.hypot(dx, dy) || 1;
      const step = SWARM_QUEEN.chargeSpeed * speed * dt;
      this.x += (dx / distance) * step;
      this.y += (dy / distance) * step;
      this.heading = Math.atan2(dy, dx);
      if (this.stateTimer <= 0) {
        this.state = 'open';
        this.stateTimer = SWARM_QUEEN.openTime / speed;
      }
    }
    this.x = Math.min(Math.max(this.x, this.radius), LOGICAL_WIDTH - this.radius);
    this.y = Math.min(Math.max(this.y, this.radius), LOGICAL_HEIGHT - this.radius);
  }

  render(ctx) {
    const r = this.radius;
    const open = this.state === 'open' || this.stun > 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);
    ctx.globalAlpha = this.dead ? Math.max(0, this.stateTimer / 1.6) : 1;
    ctx.strokeStyle = COLORS.urchinSpike;
    ctx.lineCap = 'round';
    for (let i = 0; i < 14; i += 1) {
      const angle = (i / 14) * TAU;
      const length = r * (1.15 + Math.sin(this.age * 3 + i) * 0.12) * (open ? 1.12 : 0.95);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r * 0.7, Math.sin(angle) * r * 0.7);
      ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      ctx.stroke();
    }
    const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
    gradient.addColorStop(0, this.hitFlash > 0.1 ? '#ffe3ee' : COLORS.octopusAlert);
    gradient.addColorStop(1, COLORS.urchin);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.86, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = COLORS.urchinSpike;
    ctx.lineWidth = 4;
    ctx.stroke();
    const coreGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.5);
    coreGlow.addColorStop(0, open ? '#ffffff' : '#c9a227');
    coreGlow.addColorStop(1, open ? 'rgba(255, 255, 255, 0)' : 'rgba(201, 162, 39, 0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = open ? '#ffffff' : '#ffd166';
    ctx.beginPath();
    ctx.arc(0, 0, r * (open ? 0.24 : 0.16), 0, TAU);
    ctx.fill();
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
}
