import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { EEL, EEL_VARIANTS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class Eel extends Entity {
  constructor(holeX, holeY, variant = 0) {
    super({ x: holeX, y: holeY, radius: EEL.radius });
    const palette = EEL_VARIANTS[variant % EEL_VARIANTS.length];
    this.bodyColor = palette.body;
    this.ridgeColor = palette.ridge;
    this.outlineColor = palette.outline;
    this.eyeColor = palette.eye;
    this.spots = palette.spots;
    this.homeX = holeX;
    this.homeY = holeY;
    this.state = 'hidden';
    this.stateTimer = 0;
    this.peekDelay = 0;
    this.peekProgress = 0;
    this.heading = Math.PI / 2;
    this.trail = [];
    this.targetX = holeX;
    this.targetY = holeY;
    this.roamX = holeX;
    this.roamY = holeY;
    this.roamTimer = 0;
    this.jawOpen = 0;
    this.biteTimer = 0;
    this.entryDirX = 0;
    this.entryDirY = 1;
    this.enterDistance = 0;
  }

  bite() {
    this.biteTimer = EEL.biteDuration;
  }

  startPeek() {
    if (this.state !== 'hidden') return;
    this.state = 'peeking';
    this.stateTimer = 0;
    this.peekDelay = rand(0.15, EEL.peekDuration * 0.6);
  }

  startHunt(player) {
    this.state = 'hunting';
    this.stateTimer = 0;
    this.targetX = player ? player.x : this.targetX;
    this.targetY = player ? player.y : this.targetY;
    this.prefillTrail();
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
    const count = Math.ceil(EEL.bodyLength / EEL.trailSpacing) + 1;
    for (let i = 0; i < count; i += 1) {
      this.trail.push({
        x: this.x - dirX * EEL.trailSpacing * i,
        y: this.y - dirY * EEL.trailSpacing * i,
      });
    }
  }

  goHome() {
    if (this.state !== 'hidden') this.state = 'retreating';
  }

  pickRoamWaypoint() {
    this.roamX = rand(40, LOGICAL_WIDTH - 40);
    this.roamY = rand(40, LOGICAL_HEIGHT - 40);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const x = rand(40, LOGICAL_WIDTH - 40);
      const y = rand(40, LOGICAL_HEIGHT - 40);
      if (Math.hypot(x - this.targetX, y - this.targetY) >= EEL.roamMinDistance) {
        this.roamX = x;
        this.roamY = y;
        return;
      }
    }
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

  update(dt, players, speedScale = 1, nearby = players) {
    super.update(dt);
    const threat = this.pickThreat(players);
    const proximity = this.pickThreat(nearby);
    this.stateTimer += dt;
    let jawTarget =
      this.state === 'hunting' &&
      proximity !== null &&
      Math.hypot(proximity.x - this.x, proximity.y - this.y) < EEL.jawOpenRadius
        ? 1
        : 0;
    let jawResponse = 10;
    if (this.biteTimer > 0) {
      this.biteTimer = Math.max(0, this.biteTimer - dt);
      const biteProgress = 1 - this.biteTimer / EEL.biteDuration;
      jawTarget = biteProgress < 0.3 ? EEL.biteGape : EEL.biteSnap;
      jawResponse = 26;
    }
    this.jawOpen += (jawTarget - this.jawOpen) * (1 - Math.exp(-jawResponse * dt));
    if (this.state === 'hidden') {
      this.x = this.homeX;
      this.y = this.homeY;
      this.peekProgress = 0;
      this.trail.length = 0;
      return;
    }
    if (this.state === 'peeking') {
      this.x = this.homeX;
      if (this.stateTimer > this.peekDelay) {
        this.peekProgress = Math.min(1, (this.stateTimer - this.peekDelay) / 0.4);
      }
      this.y = this.homeY + this.peekProgress * EEL.radius * 1.8;
      return;
    }
    if (this.state === 'hunting') {
      if (threat !== null) {
        this.targetX = threat.x;
        this.targetY = threat.y;
      }
      if (threat === null) {
        this.roamTimer -= dt;
        const roamDistance = Math.hypot(this.roamX - this.x, this.roamY - this.y);
        if (this.roamTimer <= 0 || roamDistance < 30) {
          this.roamTimer = rand(EEL.roamIntervalMin, EEL.roamIntervalMax);
          this.pickRoamWaypoint();
        }
        const roamX = this.roamX - this.x;
        const roamY = this.roamY - this.y;
        const roamLength = Math.hypot(roamX, roamY) || 1;
        const roamSpeed = EEL.roamSpeed * speedScale;
        this.x += (roamX / roamLength) * roamSpeed * dt;
        this.y += (roamY / roamLength) * roamSpeed * dt;
        this.heading = Math.atan2(roamY, roamX);
      } else {
        const dx = threat.x - this.x;
        const dy = threat.y - this.y;
        const distance = Math.hypot(dx, dy) || 1;
        const speed = EEL.huntSpeed * EEL.aggressiveMultiplier * speedScale;
        this.x += (dx / distance) * speed * dt;
        this.y += (dy / distance) * speed * dt;
        this.heading = Math.atan2(dy, dx);
      }
    } else if (this.state === 'retreating') {
      const dx = this.homeX - this.x;
      const dy = this.homeY - this.y;
      const distance = Math.hypot(dx, dy) || 1;
      this.x += (dx / distance) * EEL.returnSpeed * speedScale * dt;
      this.y += (dy / distance) * EEL.returnSpeed * speedScale * dt;
      this.heading = Math.atan2(dy, dx);
      if (distance < EEL.radius) {
        if (this.trail.length >= 2) {
          const outX = this.x - this.homeX;
          const outY = this.y - this.homeY;
          const outLength = Math.hypot(outX, outY);
          if (outLength > 0.5) {
            this.entryDirX = outX / outLength;
            this.entryDirY = outY / outLength;
          } else {
            this.entryDirX = -Math.cos(this.heading);
            this.entryDirY = -Math.sin(this.heading);
          }
          this.enterDistance = 0;
          this.state = 'entering';
          this.stateTimer = 0;
        } else {
          this.state = 'hidden';
          this.peekProgress = 0;
          this.trail.length = 0;
        }
      }
    } else if (this.state === 'entering') {
      this.enterDistance += EEL.enterSpeed * speedScale * dt;
      this.x = this.homeX - this.entryDirX * this.enterDistance;
      this.y = this.homeY - this.entryDirY * this.enterDistance;
      this.heading = Math.atan2(-this.entryDirY, -this.entryDirX);
      if (this.enterDistance >= EEL.bodyLength + EEL.radius * 2) {
        this.state = 'hidden';
        this.peekProgress = 0;
        this.trail.length = 0;
      }
    }
    this.x = clamp(this.x, EEL.radius, LOGICAL_WIDTH - EEL.radius);
    this.y = clamp(this.y, EEL.radius, LOGICAL_HEIGHT - EEL.radius);
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
      if (trailLength >= EEL.bodyLength) {
        this.trail.length = i + 1;
        break;
      }
    }
  }

  outsideDistance(point) {
    return (point.x - this.homeX) * this.entryDirX + (point.y - this.homeY) * this.entryDirY;
  }

  render(ctx) {
    if (this.state === 'hidden') return;
    if (this.state === 'peeking' || (this.state === 'retreating' && this.trail.length < 2)) {
      if (this.state === 'peeking' && this.peekProgress <= 0) return;
      const radius = EEL.radius;
      ctx.save();
      ctx.strokeStyle = this.bodyColor;
      ctx.lineWidth = radius * 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.homeX, this.homeY - radius * 0.8);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      ctx.restore();
      this.renderHead(ctx, this.x, this.y, Math.PI / 2, 0);
      return;
    }
    this.renderBody(ctx);
    if (this.state !== 'entering' && this.trail.length > 0) {
      const head = this.trail[0];
      this.renderHead(ctx, head.x, head.y, this.heading, this.jawOpen);
    }
  }

  renderBody(ctx) {
    const trail =
      this.state === 'entering'
        ? this.trail.filter((point) => this.outsideDistance(point) > 3)
        : this.trail;
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
      const width = EEL.radius * (0.16 + 0.84 * Math.pow(t, 0.8));
      leftEdge.push({ x: point.x - tangentY * width, y: point.y + tangentX * width });
      rightEdge.push({ x: point.x + tangentY * width, y: point.y - tangentX * width });
    }
    ctx.beginPath();
    ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
    for (let i = 1; i < count; i += 1) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
    for (let i = count - 1; i >= 0; i -= 1) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
    ctx.closePath();
    ctx.fillStyle = this.bodyColor;
    ctx.fill();
    ctx.strokeStyle = this.outlineColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (this.spots) {
      ctx.fillStyle = 'rgba(20, 18, 8, 0.85)';
      for (let i = 1; i < count - 1; i += 2) {
        const t = 1 - i / (count - 1);
        const width = EEL.radius * (0.16 + 0.84 * Math.pow(t, 0.8));
        const point = trail[i];
        const before = trail[i - 1];
        const after = trail[i + 1];
        let tangentX = before.x - after.x;
        let tangentY = before.y - after.y;
        const length = Math.hypot(tangentX, tangentY) || 1;
        tangentX /= length;
        tangentY /= length;
        const offset = width * 0.45 * (i % 4 === 1 ? 1 : -1);
        ctx.beginPath();
        ctx.arc(point.x - tangentY * offset, point.y + tangentX * offset, Math.max(1.6, width * 0.24), 0, TAU);
        ctx.fill();
      }
    }

    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < count; i += 1) ctx.lineTo(trail[i].x, trail[i].y);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = this.ridgeColor;
    ctx.lineWidth = EEL.radius * 0.45;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  renderHead(ctx, x, y, heading, jawOpen) {
    const radius = EEL.radius;
    const jawAngle = 0.06 + jawOpen * 0.38;
    const hingeY = radius * 0.06;
    const jawLength = radius * 2.15;
    const jawTipX = Math.cos(jawAngle) * jawLength;
    const jawTipY = hingeY + Math.sin(jawAngle) * jawLength;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = this.ridgeColor;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.5, side * radius * 0.5);
      ctx.quadraticCurveTo(-radius * 0.5, side * radius * 1.25, -radius * 1.6, side * radius);
      ctx.quadraticCurveTo(-radius * 1.3, side * radius * 0.6, -radius * 0.5, side * radius * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(radius * 2.28, radius * 0.12);
    ctx.quadraticCurveTo(radius * 1.5, radius * 0.16, 0, hingeY);
    ctx.quadraticCurveTo(radius * 1.5, Math.max(radius * 0.16, jawTipY * 0.6), jawTipX, jawTipY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(18, 26, 15, 0.9)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-radius, -radius * 0.5);
    ctx.quadraticCurveTo(radius, -radius * 0.85, radius * 2.32, -radius * 0.22);
    ctx.quadraticCurveTo(radius * 2.6, 0, radius * 2.28, radius * 0.12);
    ctx.quadraticCurveTo(radius * 1.4, radius * 0.16, 0, hingeY);
    ctx.quadraticCurveTo(-radius * 0.7, radius * 0.2, -radius, -radius * 0.5);
    ctx.closePath();
    ctx.fillStyle = this.bodyColor;
    ctx.fill();
    ctx.strokeStyle = this.outlineColor;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = '#f4fbff';
    for (let i = 0; i < 5; i += 1) {
      const t = i / 4;
      this.renderTooth(ctx, radius * (2.08 - t * 1.75), radius * (0.1 + t * 0.01), 1);
    }

    ctx.save();
    ctx.translate(0, hingeY);
    ctx.rotate(jawAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(radius * 1.2, -radius * 0.02, radius * 2.15, radius * 0.02);
    ctx.quadraticCurveTo(radius * 1.7, radius * 0.3, radius * 0.9, radius * 0.34);
    ctx.quadraticCurveTo(radius * 0.35, radius * 0.36, 0, radius * 0.18);
    ctx.closePath();
    ctx.fillStyle = this.bodyColor;
    ctx.fill();
    ctx.strokeStyle = this.outlineColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#f4fbff';
    for (let i = 0; i < 5; i += 1) {
      const t = i / 4;
      this.renderTooth(ctx, radius * (1.96 - t * 1.7), radius * 0.03, -1);
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(radius * 0.85, -radius * 0.32, radius * 0.24, 0, TAU);
    ctx.fillStyle = '#f4fbff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.89, -radius * 0.32, radius * 0.14, 0, TAU);
    ctx.fillStyle = this.eyeColor;
    ctx.fill();
    ctx.restore();
  }

  renderTooth(ctx, x, y, direction) {
    const halfWidth = 1.2;
    const length = 4.5;
    ctx.beginPath();
    ctx.moveTo(x - halfWidth, y);
    ctx.lineTo(x + halfWidth, y);
    ctx.lineTo(x, y + direction * length);
    ctx.closePath();
    ctx.fill();
  }
}
