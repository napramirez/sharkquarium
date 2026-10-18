import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { TURTLE, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Turtle extends Entity {
  constructor() {
    super({ x: rand(180, LOGICAL_WIDTH - 180), y: rand(140, LOGICAL_HEIGHT - 140), radius: TURTLE.radius });
    this.state = 'patrol';
    this.stateTimer = 0;
    this.chargeTimer = rand(TURTLE.chargeIntervalMin, TURTLE.chargeIntervalMax);
    this.heading = rand(0, TAU);
    this.waypointX = this.x;
    this.waypointY = this.y;
    this.pickWaypoint();
  }

  pickWaypoint() {
    this.waypointX = rand(120, LOGICAL_WIDTH - 120);
    this.waypointY = rand(120, LOGICAL_HEIGHT - 120);
  }

  headPosition() {
    return {
      x: this.x + Math.cos(this.heading) * TURTLE.headOffset,
      y: this.y + Math.sin(this.heading) * TURTLE.headOffset,
    };
  }

  stun() {
    if (this.state === 'stunned') return;
    this.state = 'stunned';
    this.stateTimer = TURTLE.stunDuration;
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
    if (this.state === 'stunned') {
      this.stateTimer -= dt;
      this.y += Math.sin(this.age * 1.5) * 6 * dt;
      if (this.stateTimer <= 0) {
        this.state = 'patrol';
        this.chargeTimer = rand(TURTLE.chargeIntervalMin, TURTLE.chargeIntervalMax);
        this.pickWaypoint();
      }
      return;
    }
    const threat = this.pickThreat(players);
    let targetX = this.waypointX;
    let targetY = this.waypointY;
    let speed = TURTLE.patrolSpeed * speedScale;
    if (this.state === 'charging') {
      this.stateTimer -= dt;
      speed = TURTLE.chargeSpeed * speedScale;
      if (threat) {
        targetX = threat.x;
        targetY = threat.y;
      }
      if (this.stateTimer <= 0) {
        this.state = 'recover';
        this.stateTimer = TURTLE.recoverTime;
      }
    } else if (this.state === 'recover') {
      speed = 30 * speedScale;
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'patrol';
        this.chargeTimer = rand(TURTLE.chargeIntervalMin, TURTLE.chargeIntervalMax);
      }
    } else {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.state = 'charging';
        this.stateTimer = TURTLE.chargeDuration;
      }
      if (Math.hypot(targetX - this.x, targetY - this.y) < 40) this.pickWaypoint();
    }
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    this.x += (dx / distance) * speed * dt;
    this.y += (dy / distance) * speed * dt;
    this.heading = Math.atan2(dy, dx);
    this.x = clamp(this.x, TURTLE.radius, LOGICAL_WIDTH - TURTLE.radius);
    this.y = clamp(this.y, TURTLE.radius, LOGICAL_HEIGHT - TURTLE.radius);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    ctx.fillStyle = COLORS.turtleDark;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(TURTLE.radius * 0.45, side * TURTLE.radius * 0.7);
      ctx.rotate(side * 0.6 + Math.sin(this.age * 2 + side) * 0.12);
      ctx.beginPath();
      ctx.ellipse(0, 0, TURTLE.radius * 0.42, TURTLE.radius * 0.16, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(-TURTLE.radius * 0.55, side * TURTLE.radius * 0.62);
      ctx.rotate(side * -0.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, TURTLE.radius * 0.3, TURTLE.radius * 0.14, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(-TURTLE.radius * 0.9, 0);
    ctx.lineTo(-TURTLE.radius * 1.35, -TURTLE.radius * 0.2);
    ctx.lineTo(-TURTLE.radius * 1.35, TURTLE.radius * 0.2);
    ctx.closePath();
    ctx.fillStyle = COLORS.turtleDark;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, TURTLE.radius, TURTLE.radius * 0.86, 0, 0, TAU);
    ctx.fillStyle = COLORS.turtle;
    ctx.fill();
    ctx.strokeStyle = COLORS.turtleDark;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = 'rgba(63, 107, 77, 0.55)';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse((i - 1) * TURTLE.radius * 0.45, 0, TURTLE.radius * 0.22, TURTLE.radius * 0.35, 0, 0, TAU);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(TURTLE.headOffset, 0, 13, 0, TAU);
    ctx.fillStyle = COLORS.turtleDark;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(TURTLE.headOffset + 4, -4, 2.2, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(TURTLE.headOffset + 4, 4, 2.2, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();

    ctx.restore();

    if (this.state === 'stunned') {
      ctx.save();
      ctx.translate(this.x, this.y - TURTLE.radius * 1.4);
      ctx.fillStyle = COLORS.accent;
      for (let i = 0; i < 3; i += 1) {
        const angle = this.age * 2.6 + (i * TAU) / 3;
        const x = Math.cos(angle) * 22;
        const y = Math.sin(angle) * 8;
        ctx.beginPath();
        ctx.arc(x, y, 3.4, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
