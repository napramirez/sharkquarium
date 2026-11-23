import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { ANGLER, DEEPSEA, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export function drawAnglerBody(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const glow = pose.glow ?? 0.6;
  const r = radius;
  const LINE = '#3a2414';

  const finSpine = (bx, by, tx, ty) => {
    ctx.strokeStyle = '#7f858c';
    ctx.lineWidth = r * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    const tipGlow = ctx.createRadialGradient(tx, ty, 0, tx, ty, r * 0.34);
    tipGlow.addColorStop(0, 'rgba(150, 230, 255, 0.95)');
    tipGlow.addColorStop(1, 'rgba(60, 200, 255, 0)');
    ctx.fillStyle = tipGlow;
    ctx.beginPath();
    ctx.arc(tx, ty, r * 0.34, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tx, ty, r * 0.1, 0, TAU);
    ctx.fillStyle = '#d8f6ff';
    ctx.fill();
  };

  const tailTips = [[-0.62, 0.95], [-0.22, 1.28], [0.22, 0.86], [0.62, 1.36], [0.0, 1.08], [-0.44, 0.62], [-0.86, 0.72]];
  for (const [sym, lf] of tailTips) {
    finSpine(-r * 1.02, sym * r * 0.18, -r * (1.02 + 0.9 * lf), sym * r * 1.12);
  }

  const grad = ctx.createLinearGradient(0, -r * 1.1, 0, r * 1.25);
  grad.addColorStop(0, '#4e3521');
  grad.addColorStop(0.5, '#74512f');
  grad.addColorStop(1, '#ad8f66');
  ctx.beginPath();
  ctx.moveTo(r * 1.12, -r * 0.12);
  ctx.quadraticCurveTo(r * 1.02, -r * 0.78, r * 0.28, -r * 0.98);
  ctx.quadraticCurveTo(-r * 0.5, -r * 1.18, -r * 1.12, -r * 0.2);
  ctx.quadraticCurveTo(-r * 0.9, r * 0.5, -r * 0.28, r * 1.22);
  ctx.quadraticCurveTo(r * 0.46, r * 1.26, r * 1.12, -r * 0.12);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  for (let i = 0; i < 7; i += 1) {
    const t = i / 6;
    const bx = -r * 0.92 + t * r * 1.28;
    const by = -r * (0.88 + 0.14 * Math.sin(t * Math.PI));
    const len = r * (0.4 + 0.36 * Math.abs(Math.sin(i * 1.7 + 0.6)));
    finSpine(bx, by, bx - r * 0.26, by - len);
  }

  for (let i = 0; i < 6; i += 1) {
    const t = i / 5;
    const len = r * (0.7 + 0.45 * Math.abs(Math.sin(i * 2.1 + 1)));
    const by = r * 0.16 + r * 0.26 * t + r * 0.05 * Math.sin(i);
    finSpine(r * 0.26 - r * 0.12 * t, by, -r * (0.05 + 0.6 * t), by + len);
  }

  ctx.beginPath();
  ctx.moveTo(r * 1.15, -r * 0.08);
  ctx.quadraticCurveTo(r * 0.9, r * 0.62, r * 0.02, r * 0.82);
  ctx.quadraticCurveTo(r * 0.22, r * 0.3, r * 0.52, -r * 0.04);
  ctx.closePath();
  ctx.fillStyle = '#22140c';
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  ctx.fillStyle = '#efe6d4';
  for (let i = 0; i < 7; i += 1) {
    const t = i / 6;
    const tx = r * (1.05 - t * 0.82);
    const ty = -r * 0.02 + t * r * 0.52;
    const len = r * (0.17 + (1 - t) * 0.13);
    ctx.beginPath();
    ctx.moveTo(tx - r * 0.045, ty);
    ctx.lineTo(tx + r * 0.045, ty);
    ctx.lineTo(tx, ty + len);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 6; i += 1) {
    const t = i / 5;
    const tx = r * (0.95 - t * 0.68);
    const ty = r * 0.72 - t * r * 0.06;
    const len = r * (0.15 + (1 - t) * 0.11);
    ctx.beginPath();
    ctx.moveTo(tx - r * 0.045, ty);
    ctx.lineTo(tx + r * 0.045, ty);
    ctx.lineTo(tx, ty - len);
    ctx.closePath();
    ctx.fill();
  }

  const ex = r * 0.6;
  const ey = -r * 0.52;
  ctx.beginPath();
  ctx.arc(ex, ey, r * 0.22, 0, TAU);
  ctx.fillStyle = '#0a0a0c';
  ctx.fill();
  const pupilGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, r * 0.6);
  pupilGlow.addColorStop(0, 'rgba(130, 225, 255, 0.9)');
  pupilGlow.addColorStop(1, 'rgba(60, 208, 255, 0)');
  ctx.fillStyle = pupilGlow;
  ctx.beginPath();
  ctx.arc(ex, ey, r * 0.6, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex, ey, r * 0.11, 0, TAU);
  ctx.fillStyle = '#bfe9ff';
  ctx.fill();

  const pulse = 1 + Math.sin(age * 3) * 0.15;
  const lureX = r * 0.95;
  const lureY = -r * 1.95;
  ctx.strokeStyle = '#4a3a24';
  ctx.lineWidth = r * 0.08;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r * 0.3, -r * 0.92);
  ctx.quadraticCurveTo(r * 0.7, -r * 1.75, lureX, lureY);
  ctx.stroke();
  ctx.globalAlpha = 0.3 * glow * pulse;
  ctx.beginPath();
  ctx.arc(lureX, lureY, r * 0.62 * pulse, 0, TAU);
  ctx.fillStyle = COLORS.lure;
  ctx.fill();
  ctx.globalAlpha = 0.6 * glow;
  ctx.beginPath();
  ctx.arc(lureX, lureY, r * 0.3 * pulse, 0, TAU);
  ctx.fillStyle = COLORS.lure;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(lureX, lureY, r * 0.14 * pulse, 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

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
    this.santa = true;
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
    const glow = this.mode === 'chase' ? 1 : 0.6;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);
    drawAnglerBody(ctx, this.radius, { age: this.age, glow });
    ctx.restore();
  }
}
