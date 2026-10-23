import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { ANGLER, DEEPSEA, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Anglerfish extends Entity {
  constructor(zoneCenter = null) {
    super({
      x:
        zoneCenter === null
          ? rand(90, LOGICAL_WIDTH - 90)
          : zoneCenter + rand(-ANGLER.zoneJitter, ANGLER.zoneJitter),
      y: rand(80, LOGICAL_HEIGHT - DEEPSEA.floorHeight - 70),
      radius: ANGLER.radius,
    });
    this.mode = 'roam';
    this.heading = rand(0, TAU);
    this.targetX = this.x;
    this.targetY = this.y;
    this.waypointX = this.x;
    this.waypointY = this.y;
    this.roamTimer = 0;
    this.searchTimer = 0;
    this.pickWaypoint();
  }

  pickWaypoint() {
    this.waypointX = rand(70, LOGICAL_WIDTH - 70);
    this.waypointY = rand(70, LOGICAL_HEIGHT - DEEPSEA.floorHeight - 50);
    this.roamTimer = rand(ANGLER.roamDuration * 0.6, ANGLER.roamDuration * 1.4);
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
    const threat = this.pickThreat(players);
    const playerDistance = threat === null ? Infinity : Math.hypot(threat.x - this.x, threat.y - this.y);
    if (threat !== null && playerDistance < ANGLER.detectRadius) {
      this.mode = 'chase';
      this.targetX = threat.x;
      this.targetY = threat.y;
    } else if (this.mode === 'chase') {
      this.mode = 'search';
      this.searchTimer = ANGLER.searchDuration;
    }
    let targetX = this.waypointX;
    let targetY = this.waypointY;
    let speed = ANGLER.roamSpeed * speedScale;
    if (this.mode === 'chase') {
      targetX = this.targetX;
      targetY = this.targetY;
      speed = ANGLER.chaseSpeed * speedScale;
    } else if (this.mode === 'search') {
      targetX = this.targetX;
      targetY = this.targetY;
      const targetDistance = Math.hypot(targetX - this.x, targetY - this.y);
      speed = targetDistance < 20 ? 20 * speedScale : ANGLER.searchSpeed * speedScale;
      this.searchTimer -= dt;
      if (this.searchTimer <= 0) {
        this.mode = 'roam';
        this.pickWaypoint();
      }
    } else {
      this.roamTimer -= dt;
      if (this.roamTimer <= 0 || Math.hypot(targetX - this.x, targetY - this.y) < 30) {
        this.pickWaypoint();
      }
    }
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    this.x += (dx / distance) * speed * dt;
    this.y += (dy / distance) * speed * dt;
    this.heading = Math.atan2(dy, dx);
    this.x = clamp(this.x, ANGLER.radius, LOGICAL_WIDTH - ANGLER.radius);
    this.y = clamp(this.y, ANGLER.radius, LOGICAL_HEIGHT - ANGLER.radius);
  }

  render(ctx) {
    const radius = this.radius;
    const glow = this.mode === 'chase' ? 1 : 0.6;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    ctx.beginPath();
    ctx.moveTo(radius * 1.35, 0);
    ctx.quadraticCurveTo(radius * 1.2, -radius * 1.05, -radius * 0.4, -radius * 0.95);
    ctx.quadraticCurveTo(-radius * 1.6, -radius * 0.6, -radius * 1.5, 0);
    ctx.quadraticCurveTo(-radius * 1.6, radius * 0.6, -radius * 0.4, radius * 0.95);
    ctx.quadraticCurveTo(radius * 1.2, radius * 1.05, radius * 1.35, 0);
    ctx.closePath();
    ctx.fillStyle = COLORS.angler;
    ctx.fill();

    ctx.fillStyle = 'rgba(38, 44, 54, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-radius * 1.3, -radius * 0.6);
    ctx.lineTo(-radius * 2.1, -radius * 0.85);
    ctx.lineTo(-radius * 1.85, 0);
    ctx.lineTo(-radius * 2.1, radius * 0.85);
    ctx.lineTo(-radius * 1.3, radius * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(radius * 1.35, 0);
    ctx.lineTo(radius * 0.1, -radius * 0.62);
    ctx.lineTo(radius * 0.1, radius * 0.62);
    ctx.closePath();
    ctx.fillStyle = 'rgba(14, 17, 22, 0.92)';
    ctx.fill();

    ctx.fillStyle = '#f4fbff';
    for (let i = 0; i < 5; i += 1) {
      const t = i / 4;
      const toothX = radius * (1.25 - t * 1);
      const jawY = radius * (0.1 + t * 0.52);
      ctx.beginPath();
      ctx.moveTo(toothX - 1.1, -jawY);
      ctx.lineTo(toothX + 1.1, -jawY);
      ctx.lineTo(toothX, -jawY + radius * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(toothX - 1.1, jawY);
      ctx.lineTo(toothX + 1.1, jawY);
      ctx.lineTo(toothX, jawY - radius * 0.42);
      ctx.closePath();
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(radius * 0.45, -radius * 0.45, radius * 0.16, 0, TAU);
    ctx.fillStyle = '#f4fbff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.48, -radius * 0.45, radius * 0.08, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();

    const pulse = 1 + Math.sin(this.age * 3) * 0.15;
    const lureX = radius * 1.7;
    const lureY = -radius * 1.55;
    ctx.strokeStyle = COLORS.angler;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(radius * 0.5, -radius * 0.85);
    ctx.quadraticCurveTo(radius * 0.9, -radius * 1.7, lureX, lureY);
    ctx.stroke();
    ctx.globalAlpha = 0.25 * glow * pulse;
    ctx.beginPath();
    ctx.arc(lureX, lureY, radius * 0.62 * pulse, 0, TAU);
    ctx.fillStyle = COLORS.lure;
    ctx.fill();
    ctx.globalAlpha = 0.55 * glow;
    ctx.beginPath();
    ctx.arc(lureX, lureY, radius * 0.3 * pulse, 0, TAU);
    ctx.fillStyle = COLORS.lure;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(lureX, lureY, radius * 0.14 * pulse, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }
}
