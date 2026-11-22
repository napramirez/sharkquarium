import { Entity, drawSeasonHat } from './entity.js';
import { currentSeason } from '../engine/season.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { EEL, EEL_VARIANTS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class Eel extends Entity {
  constructor(holeX, holeY, variant = 0) {
    super({ x: holeX, y: holeY, radius: EEL.radius });
    this.santa = true;
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
    paintMorayTrail(ctx, EEL.radius, trail, this);
  }

  renderHead(ctx, x, y, heading, jawOpen) {
    drawMorayHead(ctx, x, y, heading, EEL.radius, this, jawOpen);
  }

  santaHat(ctx) {
    if (this.state === 'hidden' || this.state === 'entering') return;
    if (this.state === 'peeking' && this.peekProgress <= 0) return;
    const radius = EEL.radius;
    let hx;
    let hy;
    if (this.state === 'peeking' || (this.state === 'retreating' && this.trail.length < 2)) {
      hx = this.x;
      hy = this.y;
    } else {
      const head = this.trail[0];
      if (!head) return;
      hx = head.x;
      hy = head.y;
    }
    const toHome = Math.hypot(hx - this.homeX, hy - this.homeY);
    const fade = clamp(toHome / (radius * 1.6), 0, 1);
    if (fade <= 0.02) return;
    ctx.save();
    ctx.globalAlpha *= fade;
    drawSeasonHat(ctx, hx, hy - radius * 0.72, radius * 0.55, currentSeason());
    ctx.restore();
  }
}

export function paintMorayTrail(ctx, radius, trail, palette) {
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
    const width = radius * (0.16 + 0.84 * Math.pow(t, 0.8));
    leftEdge.push({ x: point.x - tangentY * width, y: point.y + tangentX * width });
    rightEdge.push({ x: point.x + tangentY * width, y: point.y - tangentX * width });
  }
  ctx.beginPath();
  ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
  for (let i = 1; i < count; i += 1) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
  for (let i = count - 1; i >= 0; i -= 1) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
  ctx.closePath();
  ctx.fillStyle = palette.bodyColor;
  ctx.fill();
  ctx.strokeStyle = palette.outlineColor;
  ctx.lineWidth = radius * 0.094;
  ctx.stroke();

  if (palette.spots) {
    ctx.fillStyle = 'rgba(20, 18, 8, 0.85)';
    for (let i = 1; i < count - 1; i += 2) {
      const t = 1 - i / (count - 1);
      const width = radius * (0.16 + 0.84 * Math.pow(t, 0.8));
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
  ctx.strokeStyle = palette.ridgeColor;
  ctx.lineWidth = radius * 0.45;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  if (palette.grotesque) {
    ctx.save();
    for (let i = 1; i < count - 1; i += 1) {
      const point = trail[i];
      const before = trail[Math.max(0, i - 1)];
      const after = trail[Math.min(count - 1, i + 1)];
      let tangentX = before.x - after.x;
      let tangentY = before.y - after.y;
      const length = Math.hypot(tangentX, tangentY) || 1;
      tangentX /= length;
      tangentY /= length;
      const nx = -tangentY;
      const ny = tangentX;
      const side = i % 2 === 0 ? 1 : -1;
      const t = 1 - i / (count - 1);
      const width = radius * (0.16 + 0.84 * Math.pow(t, 0.8));
      const baseX = point.x + nx * side * width * 0.5;
      const baseY = point.y + ny * side * width * 0.5;
      const tip = radius * (0.34 + 0.42 * t) * (i % 4 === 0 ? 1 : 0.62);
      ctx.beginPath();
      ctx.moveTo(baseX - tangentX * width * 0.24, baseY - tangentY * width * 0.24);
      ctx.lineTo(baseX + nx * side * tip, baseY + ny * side * tip);
      ctx.lineTo(baseX + tangentX * width * 0.24, baseY + tangentY * width * 0.24);
      ctx.closePath();
      ctx.fillStyle = '#8a8f5a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(40, 46, 20, 0.7)';
      ctx.lineWidth = radius * 0.02;
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(28, 36, 20, 0.5)';
    for (let i = 2; i < count - 1; i += 2) {
      const point = trail[i];
      const before = trail[Math.max(0, i - 1)];
      const after = trail[Math.min(count - 1, i + 1)];
      let tangentX = before.x - after.x;
      let tangentY = before.y - after.y;
      const length = Math.hypot(tangentX, tangentY) || 1;
      tangentX /= length;
      tangentY /= length;
      const t = 1 - i / (count - 1);
      const width = radius * (0.16 + 0.84 * Math.pow(t, 0.8));
      const off = (i % 4 === 2 ? 1 : -1) * width * 0.4;
      ctx.beginPath();
      ctx.arc(point.x - tangentY * off, point.y + tangentX * off, Math.max(1.8, width * 0.3), 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#8f4150';
    for (let i = 3; i < count - 2; i += 4) {
      const point = trail[i];
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(1.6, radius * 0.16), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawMorayBody(ctx, radius, pose, palette = EEL_VARIANTS[0]) {
  const age = pose.age ?? 0;
  const phase = pose.phase ?? 0;
  const count = 12;
  const span = radius * 6.75;
  const trail = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    trail.push({
      x: radius * 1.2 - t * span,
      y: Math.sin(age * 6 + phase - i * 0.55) * radius * (0.12 + t * 0.5),
    });
  }
  paintMorayTrail(ctx, radius, trail, palette);
  const before = trail[0];
  const after = trail[1];
  const heading = Math.atan2(before.y - after.y, before.x - after.x);
  drawMorayHead(
    ctx,
    before.x,
    before.y,
    heading,
    radius,
    palette,
    pose.jawOpen ?? (0.12 + 0.1 * Math.sin(age * 3 + phase)),
    age,
  );
}

function drawMorayTooth(ctx, radius, x, y, direction, lengthMul = 1, halfWidthMul = 1) {
  const halfWidth = radius * 0.075 * halfWidthMul;
  const length = radius * 0.28 * lengthMul;
  ctx.beginPath();
  ctx.moveTo(x - halfWidth, y);
  ctx.lineTo(x + halfWidth, y);
  ctx.lineTo(x, y + direction * length);
  ctx.closePath();
  ctx.fill();
}

export function drawMorayHead(ctx, x, y, heading, radius, palette, jawOpen, age = 0) {
  const jawAngle = 0.06 + jawOpen * 0.38;
  const hingeY = radius * 0.06;
  const jawLength = radius * 2.15;
  const jawTipX = Math.cos(jawAngle) * jawLength;
  const jawTipY = hingeY + Math.sin(jawAngle) * jawLength;
  const gore = palette.grotesque === true;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  if (Math.cos(heading) < 0) ctx.scale(1, -1);

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = palette.ridgeColor;
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
  ctx.fillStyle = gore ? 'rgba(56, 12, 18, 0.92)' : 'rgba(18, 26, 15, 0.9)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-radius, -radius * 0.5);
  ctx.quadraticCurveTo(radius, -radius * 0.85, radius * 2.32, -radius * 0.22);
  ctx.quadraticCurveTo(radius * 2.6, 0, radius * 2.28, radius * 0.12);
  ctx.quadraticCurveTo(radius * 1.4, radius * 0.16, 0, hingeY);
  ctx.quadraticCurveTo(-radius * 0.7, radius * 0.2, -radius, -radius * 0.5);
  ctx.closePath();
  ctx.fillStyle = palette.bodyColor;
  ctx.fill();
  ctx.strokeStyle = palette.outlineColor;
  ctx.lineWidth = radius * 0.088;
  ctx.stroke();

  const upperJag = [1.55, 0.7, 0.35, 1.95, 1.1];
  ctx.fillStyle = gore ? '#d9d2a0' : '#f4fbff';
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    const jitter = gore ? (i % 2 === 0 ? 1 : -1) * radius * 0.045 : 0;
    drawMorayTooth(
      ctx,
      radius,
      radius * (2.08 - t * 1.75),
      radius * (0.1 + t * 0.01) + jitter,
      1,
      gore ? upperJag[i] : 1,
      gore && i % 2 === 1 ? 0.65 : 1,
    );
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
  ctx.fillStyle = palette.bodyColor;
  ctx.fill();
  ctx.strokeStyle = palette.outlineColor;
  ctx.lineWidth = radius * 0.075;
  ctx.stroke();
  const lowerJag = [1.1, 1.8, 0.5, 1.4, 0.8];
  ctx.fillStyle = gore ? '#d9d2a0' : '#f4fbff';
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    const jitter = gore ? (i % 2 === 0 ? -1 : 1) * radius * 0.04 : 0;
    drawMorayTooth(
      ctx,
      radius,
      radius * (1.96 - t * 1.7),
      radius * 0.03 + jitter,
      -1,
      gore ? lowerJag[i] : 1,
      gore && i % 2 === 0 ? 0.65 : 1,
    );
  }
  ctx.restore();

  if (gore) {
    ctx.save();
    ctx.fillStyle = '#8a8f5a';
    ctx.strokeStyle = 'rgba(40, 46, 20, 0.8)';
    ctx.lineWidth = radius * 0.028;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i += 1) {
        const bx = -radius * (0.15 + i * 0.45);
        const len = radius * (0.6 - i * 0.1);
        ctx.beginPath();
        ctx.moveTo(bx - radius * 0.09, side * radius * 0.4);
        ctx.lineTo(bx, side * (radius * 0.4 + len));
        ctx.lineTo(bx + radius * 0.09, side * radius * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#8f4150';
    ctx.lineWidth = radius * 0.06;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(radius * 0.12, radius * 0.09);
    ctx.quadraticCurveTo(radius * 1.25, radius * 0.1, radius * 2.12, radius * 0.1);
    ctx.stroke();
    ctx.strokeStyle = '#7a2f3a';
    ctx.beginPath();
    ctx.moveTo(radius * 0.12, radius * 0.2);
    ctx.quadraticCurveTo(radius * 1.2, radius * 0.24, radius * 2.0, radius * 0.24);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(22, 30, 16, 0.7)';
    ctx.lineWidth = radius * 0.03;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      const sx = radius * (1.15 + i * 0.42);
      ctx.beginPath();
      ctx.moveTo(sx, -radius * 0.62);
      ctx.lineTo(sx + radius * 0.13, -radius * 0.34);
      ctx.lineTo(sx - radius * 0.05, -radius * 0.12);
      ctx.stroke();
    }
    ctx.restore();

    if (jawOpen > 0.22) {
      ctx.save();
      ctx.strokeStyle = 'rgba(200, 220, 170, 0.5)';
      ctx.lineWidth = radius * 0.045;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        const dx = radius * (1.35 + i * 0.32);
        const sway = Math.sin(age * 5 + i * 1.7) * radius * 0.08;
        ctx.beginPath();
        ctx.moveTo(dx, -radius * 0.02);
        ctx.quadraticCurveTo(dx + sway, radius * 0.22, dx + sway * 0.5, radius * 0.52);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  if (palette.blind) {
    const ex = radius * 0.85;
    const ey = -radius * 0.32;
    const rx = radius * 0.27;
    const ry = radius * 0.18;
    ctx.beginPath();
    ctx.ellipse(ex, ey, rx * 1.16, ry * 1.3, 0, 0, TAU);
    ctx.fillStyle = '#8f4150';
    ctx.fill();
    const socket = ctx.createRadialGradient(ex + rx * 0.18, ey + ry * 0.3, 0, ex, ey, rx);
    socket.addColorStop(0, 'rgba(40, 10, 16, 0.96)');
    socket.addColorStop(0.7, 'rgba(104, 38, 50, 0.95)');
    socket.addColorStop(1, 'rgba(150, 70, 84, 0.95)');
    ctx.beginPath();
    ctx.ellipse(ex, ey, rx, ry, 0, 0, TAU);
    ctx.fillStyle = socket;
    ctx.fill();
    ctx.strokeStyle = 'rgba(70, 22, 32, 0.85)';
    ctx.lineWidth = radius * 0.05;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(radius * 0.85, -radius * 0.32, radius * 0.24, 0, TAU);
    ctx.fillStyle = '#f4fbff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.89, -radius * 0.32, radius * 0.14, 0, TAU);
    ctx.fillStyle = palette.eyeColor;
    ctx.fill();
  }
  ctx.restore();
}

function resampleTrail(trail, spacing, maxSegments) {
  const raw = [{ x: trail[0].x, y: trail[0].y }];
  let carry = 0;
  for (let i = 1; i < trail.length && raw.length < maxSegments; i += 1) {
    let ax = trail[i - 1].x;
    let ay = trail[i - 1].y;
    const bx = trail[i].x;
    const by = trail[i].y;
    let segLen = Math.hypot(bx - ax, by - ay);
    while (carry + segLen >= spacing && raw.length < maxSegments && segLen > 0.0001) {
      const f = (spacing - carry) / segLen;
      const nx = ax + (bx - ax) * f;
      const ny = ay + (by - ay) * f;
      raw.push({ x: nx, y: ny });
      ax = nx;
      ay = ny;
      segLen = Math.hypot(bx - ax, by - ay);
      carry = 0;
    }
    carry += segLen;
    if (segLen <= 0.0001) carry = 0;
  }
  const out = [];
  for (let i = 0; i < raw.length; i += 1) {
    const prev = raw[i - 1] ?? raw[i];
    const next = raw[i + 1] ?? raw[i];
    let tx = prev.x - next.x;
    let ty = prev.y - next.y;
    const length = Math.hypot(tx, ty) || 1;
    out.push({ x: raw[i].x, y: raw[i].y, tx: tx / length, ty: ty / length });
  }
  return out;
}

export function drawSerpentBody(ctx, radius, trail, palette, opts = {}) {
  if (!trail || trail.length < 2) return;
  const spacing = opts.spacing ?? radius * 0.55;
  const segments = opts.segments ?? 40;
  const pts = resampleTrail(trail, spacing, segments);
  const n = pts.length;
  if (n < 2) return;
  const line = radius * 0.1;
  const geo = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const rr = radius * (0.3 + 0.7 * Math.pow(1 - t, 0.7));
    geo.push({ p: pts[i], rr });
  }
  for (let i = n - 1; i >= 0; i -= 1) {
    const g = geo[i];
    ctx.save();
    ctx.translate(g.p.x, g.p.y);
    ctx.rotate(Math.atan2(g.p.ty, g.p.tx));
    ctx.beginPath();
    ctx.ellipse(0, 0, g.rr * 0.92 + line, g.rr + line, 0, 0, TAU);
    ctx.fillStyle = palette.outlineColor;
    ctx.fill();
    ctx.restore();
  }
  for (let i = n - 1; i >= 0; i -= 1) {
    const g = geo[i];
    ctx.save();
    ctx.translate(g.p.x, g.p.y);
    ctx.rotate(Math.atan2(g.p.ty, g.p.tx));
    ctx.beginPath();
    ctx.ellipse(0, 0, g.rr * 0.92, g.rr, 0, 0, TAU);
    ctx.fillStyle = palette.bodyColor;
    ctx.fill();
    ctx.restore();
  }
  for (let i = 1; i < n; i += 1) {
    const g = geo[i];
    ctx.save();
    ctx.translate(g.p.x, g.p.y);
    ctx.rotate(Math.atan2(g.p.ty, g.p.tx));
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = palette.ridgeColor;
    ctx.lineWidth = radius * 0.16;
    ctx.beginPath();
    ctx.moveTo(0, -g.rr * 0.95);
    ctx.quadraticCurveTo(g.rr * 0.45, 0, 0, g.rr * 0.95);
    ctx.stroke();
    ctx.restore();
  }
}

