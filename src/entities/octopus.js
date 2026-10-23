import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { OCTOPUS, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Octopus extends Entity {
  constructor() {
    super({
      x: rand(200, LOGICAL_WIDTH - 200),
      y: rand(140, LOGICAL_HEIGHT - 140),
      radius: OCTOPUS.radius,
    });
    this.state = 'patrol';
    this.stateTimer = 0;
    this.lungeTimer = rand(OCTOPUS.lungeIntervalMin, OCTOPUS.lungeIntervalMax);
    this.heading = rand(0, TAU);
    this.waypointX = this.x;
    this.waypointY = this.y;
    this.armPhase = rand(0, TAU);
    this.pickWaypoint();
  }

  pickWaypoint() {
    this.waypointX = rand(120, LOGICAL_WIDTH - 120);
    this.waypointY = rand(110, LOGICAL_HEIGHT - 110);
  }

  headPosition() {
    return {
      x: this.x + Math.cos(this.heading) * OCTOPUS.headOffset,
      y: this.y + Math.sin(this.heading) * OCTOPUS.headOffset,
    };
  }

  stun() {
    if (this.state === 'stunned') return;
    this.state = 'stunned';
    this.stateTimer = OCTOPUS.stunDuration;
  }

  pickThreat(players) {
    let threat = null;
    let best = Infinity;
    for (const player of players) {
      if (player.concealed === true) continue;
      const distance = Math.hypot(player.x - this.x, player.y - this.y);
      if (distance < best) {
        best = distance;
        threat = player;
      }
    }
    return threat;
  }

  update(dt, players, speedScale = 1) {
    super.update(dt);
    this.armPhase += dt * 3;
    if (this.state === 'stunned') {
      this.stateTimer -= dt;
      this.y += Math.sin(this.age * 1.5) * 6 * dt;
      if (this.stateTimer <= 0) {
        this.state = 'patrol';
        this.lungeTimer = rand(OCTOPUS.lungeIntervalMin, OCTOPUS.lungeIntervalMax);
        this.pickWaypoint();
      }
      return;
    }
    const threat = this.pickThreat(players);
    let targetX = this.waypointX;
    let targetY = this.waypointY;
    let speed = OCTOPUS.patrolSpeed * speedScale;
    if (this.state === 'lunge') {
      this.stateTimer -= dt;
      speed = OCTOPUS.lungeSpeed * speedScale;
      if (threat) {
        targetX = threat.x;
        targetY = threat.y;
      }
      if (this.stateTimer <= 0) {
        this.state = 'recover';
        this.stateTimer = OCTOPUS.recoverTime;
      }
    } else if (this.state === 'recover') {
      speed = 30 * speedScale;
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'patrol';
        this.lungeTimer = rand(OCTOPUS.lungeIntervalMin, OCTOPUS.lungeIntervalMax);
        this.pickWaypoint();
      }
    } else {
      this.lungeTimer -= dt;
      if (this.lungeTimer <= 0) {
        this.state = 'lunge';
        this.stateTimer = OCTOPUS.lungeDuration;
      } else if (Math.hypot(targetX - this.x, targetY - this.y) < 30) {
        this.pickWaypoint();
      }
    }
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    this.x += (dx / distance) * speed * dt;
    this.y += (dy / distance) * speed * dt;
    this.heading = Math.atan2(dy, dx);
    this.x = clamp(this.x, OCTOPUS.radius, LOGICAL_WIDTH - OCTOPUS.radius);
    this.y = clamp(this.y, OCTOPUS.radius, LOGICAL_HEIGHT - OCTOPUS.radius);
  }

  render(ctx) {
    const radius = this.radius;
    const alert = this.state === 'lunge';
    const body = alert ? COLORS.octopusAlert : COLORS.octopus;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    ctx.strokeStyle = body;
    ctx.lineCap = 'round';
    const reach = alert ? radius * 2.7 : radius * 2.2;
    for (let i = 0; i < 6; i += 1) {
      const spread = (i - 2.5) * 0.34;
      const wave = Math.sin(this.armPhase + i * 1.2) * radius * 0.4;
      ctx.globalAlpha = 0.92;
      ctx.lineWidth = radius * 0.3;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.5, spread * radius * 0.5);
      ctx.quadraticCurveTo(
        -radius * 1.4,
        spread * radius + wave * 0.5,
        -reach,
        spread * radius * 1.5 + wave,
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.ellipse(-radius * 0.15, 0, radius * 1.05, radius * 0.95, 0, 0, TAU);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = COLORS.octopusDark;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = 'rgba(124, 61, 88, 0.5)';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(
        -radius * 0.5 + i * radius * 0.32,
        -radius * 0.3 + (i % 2) * radius * 0.5,
        radius * 0.09,
        0,
        TAU,
      );
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(radius * 0.55, side * radius * 0.42, radius * 0.24, 0, TAU);
      ctx.fillStyle = '#f4fbff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(radius * 0.62, side * radius * 0.42, radius * 0.12, 0, TAU);
      ctx.fillStyle = '#10233a';
      ctx.fill();
    }
    ctx.restore();

    if (this.state === 'stunned') {
      ctx.save();
      ctx.translate(this.x, this.y - OCTOPUS.radius * 1.5);
      ctx.fillStyle = COLORS.accent;
      for (let i = 0; i < 3; i += 1) {
        const angle = this.age * 2.6 + (i * TAU) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 28, Math.sin(angle) * 9, 3.8, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
