import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { SEAL, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Seal extends Entity {
  constructor(perchX, perchY) {
    super({ x: perchX, y: perchY, radius: SEAL.radius });
    this.perchX = perchX;
    this.perchY = perchY;
    this.state = 'perched';
    this.stateTimer = 0;
    this.heading = Math.PI / 2;
    this.trail = [];
    this.targetX = perchX;
    this.targetY = perchY;
    this.searchPhase = rand(0, TAU);
  }

  startDive() {
    this.state = 'diving';
    this.stateTimer = 0;
    this.trail.length = 0;
  }

  startChase(player) {
    this.state = 'chasing';
    this.stateTimer = 0;
    if (player) {
      this.targetX = player.x;
      this.targetY = player.y;
    }
    this.prefillTrail();
  }

  goPerch() {
    if (this.state !== 'perched') this.state = 'returning';
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

  prefillTrail() {
    let dirX = this.targetX - this.x;
    let dirY = this.targetY - this.y;
    const distance = Math.hypot(dirX, dirY);
    if (distance > 1) {
      dirX /= distance;
      dirY /= distance;
    } else {
      dirX = Math.cos(this.heading);
      dirY = Math.sin(this.heading);
    }
    this.trail.length = 0;
    const count = 19;
    for (let i = 0; i < count; i += 1) {
      this.trail.push({ x: this.x - dirX * 6 * i, y: this.y - dirY * 6 * i });
    }
  }

  update(dt, players, speedScale = 1) {
    super.update(dt);
    this.stateTimer += dt;
    const threat = this.pickThreat(players);
    if (this.state === 'perched') {
      this.x = this.perchX;
      this.y = this.perchY + Math.sin(this.age * 1.8) * 2;
      this.trail.length = 0;
      return;
    }
    if (this.state === 'diving') {
      const progress = clamp(this.stateTimer / SEAL.diveTime, 0, 1);
      this.x = this.perchX;
      this.y = this.perchY + progress * 85;
      this.heading = Math.PI / 2;
      return;
    }
    if (this.state === 'chasing' || this.state === 'searching') {
      if (threat !== null) {
        this.state = 'chasing';
        this.targetX = threat.x;
        this.targetY = threat.y;
      } else if (this.state === 'chasing') {
        this.state = 'searching';
      }
      let dx = this.targetX - this.x;
      let dy = this.targetY - this.y;
      let distance = Math.hypot(dx, dy) || 1;
      let speed = threat !== null ? SEAL.chaseSpeed * speedScale : SEAL.searchSpeed * speedScale;
      if (threat === null && distance < SEAL.searchRadius) {
        this.searchPhase += dt * 1.1;
        dx = this.targetX + Math.cos(this.searchPhase) * SEAL.searchRadius * 0.6 - this.x;
        dy = this.targetY + Math.sin(this.searchPhase * 1.3) * SEAL.searchRadius * 0.5 - this.y;
        distance = Math.hypot(dx, dy) || 1;
        speed = 50 * speedScale;
      }
      this.x += (dx / distance) * speed * dt;
      this.y += (dy / distance) * speed * dt;
      this.heading = Math.atan2(dy, dx);
    } else if (this.state === 'returning') {
      const dx = this.perchX - this.x;
      const dy = this.perchY - this.y;
      const distance = Math.hypot(dx, dy) || 1;
      this.x += (dx / distance) * SEAL.returnSpeed * speedScale * dt;
      this.y += (dy / distance) * SEAL.returnSpeed * speedScale * dt;
      this.heading = Math.atan2(dy, dx);
      if (distance < SEAL.radius) {
        this.state = 'perched';
        this.x = this.perchX;
        this.y = this.perchY;
        this.trail.length = 0;
        return;
      }
    }
    this.x = clamp(this.x, SEAL.radius, LOGICAL_WIDTH - SEAL.radius);
    this.y = clamp(this.y, SEAL.radius + 60, LOGICAL_HEIGHT - SEAL.radius);
    const head = this.trail[0];
    if (!head || Math.hypot(this.x - head.x, this.y - head.y) > 0.5) {
      this.trail.unshift({ x: this.x, y: this.y });
    }
    let trailLength = 0;
    for (let i = 1; i < this.trail.length; i += 1) {
      trailLength += Math.hypot(
        this.trail[i].x - this.trail[i - 1].x,
        this.trail[i].y - this.trail[i - 1].y,
      );
      if (trailLength >= 108) {
        this.trail.length = i + 1;
        break;
      }
    }
  }

  render(ctx) {
    if (this.state === 'perched') {
      this.renderPerched(ctx);
      return;
    }
    this.renderBody(ctx);
    if (this.trail.length > 0) {
      this.renderHead(ctx, this.trail[0].x, this.trail[0].y, this.heading);
    }
  }

  renderPerched(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y + 12);
    ctx.beginPath();
    ctx.moveTo(-16, 4);
    ctx.lineTo(-24, -30);
    ctx.lineTo(-8, -26);
    ctx.closePath();
    ctx.fillStyle = COLORS.seal;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -26, 19, 25, 0, 0, TAU);
    ctx.fillStyle = COLORS.seal;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-4, -22, 11, 17, 0, 0, TAU);
    ctx.fillStyle = 'rgba(220, 232, 240, 0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -6);
    ctx.lineTo(26, 6);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fillStyle = COLORS.seal;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(9, -50, 12, 0, TAU);
    ctx.fillStyle = COLORS.seal;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(18, -52, 2.4, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, -55, 2, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(220, 232, 240, 0.75)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(20, -50);
      ctx.lineTo(32, -54 + i * 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderBody(ctx) {
    const trail = this.trail;
    if (trail.length < 2) return;
    const count = trail.length;
    const leftEdge = [];
    const rightEdge = [];
    for (let i = 0; i < count; i += 1) {
      const point = trail[i];
      const before = trail[Math.max(0, i - 1)];
      const after = trail[Math.min(count - 1, i + 1)];
      let tangentX = before.x - after.x;
      let tangentY = before.y - after.y;
      const length = Math.hypot(tangentX, tangentY) || 1;
      tangentX /= length;
      tangentY /= length;
      const t = 1 - i / (count - 1);
      const width = SEAL.radius * (0.2 + 0.8 * Math.pow(t, 0.75));
      leftEdge.push({ x: point.x - tangentY * width, y: point.y + tangentX * width });
      rightEdge.push({ x: point.x + tangentY * width, y: point.y - tangentX * width });
    }
    ctx.beginPath();
    ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
    for (let i = 1; i < count; i += 1) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
    for (let i = count - 1; i >= 0; i -= 1) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
    ctx.closePath();
    ctx.fillStyle = COLORS.seal;
    ctx.fill();
    ctx.strokeStyle = 'rgba(58, 72, 84, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < count; i += 1) ctx.lineTo(trail[i].x, trail[i].y);
    ctx.strokeStyle = 'rgba(220, 232, 240, 0.4)';
    ctx.lineWidth = SEAL.radius * 0.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  renderHead(ctx, x, y, heading) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    ctx.beginPath();
    ctx.ellipse(0, 0, SEAL.radius * 0.75, SEAL.radius * 0.58, 0, 0, TAU);
    ctx.fillStyle = COLORS.seal;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(SEAL.radius * 0.62, 0, 2.6, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(SEAL.radius * 0.3, -SEAL.radius * 0.3, 2.2, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(220, 232, 240, 0.75)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(SEAL.radius * 0.68, 0);
      ctx.lineTo(SEAL.radius * 1.3, -6 + i * 6);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-SEAL.radius * 0.2, SEAL.radius * 0.45);
    ctx.lineTo(-SEAL.radius * 0.55, SEAL.radius * 0.85);
    ctx.lineTo(-SEAL.radius * 0.85, SEAL.radius * 0.5);
    ctx.closePath();
    ctx.fillStyle = COLORS.seal;
    ctx.fill();
    ctx.restore();
  }
}
