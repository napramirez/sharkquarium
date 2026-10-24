import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { PETS, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Pet extends Entity {
  constructor(kind, index, options = {}) {
    super({
      x: rand(120, LOGICAL_WIDTH - 120),
      y: rand(140, LOGICAL_HEIGHT - 140),
      radius: PETS.radius,
    });
    this.kind = kind;
    this.phase = rand(0, TAU);
    this.roamTimer = rand(0.5, 2.5) + index * 0.2;
    this.waypointX = this.x;
    this.waypointY = this.y;
    this.speed = rand(PETS.roamSpeedMin, PETS.roamSpeedMax);
    this.facing = 1;
    this.scared = 0;
    this.eating = 0;
    this.meal = null;
    this.vx = 0;
    this.vy = 0;
    this.hunger = 0;
    this.drainScale = options.drainScale ?? 1;
  }

  pickWaypoint() {
    this.waypointX = rand(90, LOGICAL_WIDTH - 90);
    this.waypointY = rand(110, LOGICAL_HEIGHT - 110);
    this.roamTimer = rand(2.2, 5);
  }

  update(dt, food, enemies, others = []) {
    super.update(dt);
    this.roamTimer -= dt;
    this.scared = Math.max(0, this.scared - dt);
    this.eating = Math.max(0, this.eating - dt);
    this.hunger = Math.min(1, this.hunger + PETS.hungerDrain * this.drainScale * dt);
    const hungry = this.hunger > PETS.hungryThreshold;

    let threat = null;
    let threatDistance = Infinity;
    for (const enemy of enemies) {
      const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (distance < PETS.fleeRadius && distance < threatDistance) {
        threat = enemy;
        threatDistance = distance;
      }
    }

    let targetX = this.waypointX;
    let targetY = this.waypointY;
    let speed = this.speed;

    if (threat !== null || this.scared > 0) {
      this.meal = null;
      if (threat) {
        this.scared = Math.max(this.scared, 0.5);
        const awayX = this.x - threat.x;
        const awayY = this.y - threat.y;
        const length = Math.hypot(awayX, awayY) || 1;
        targetX = this.x + (awayX / length) * 320;
        targetY = this.y + (awayY / length) * 320;
      } else {
        targetX = this.x + this.vx;
        targetY = this.y + this.vy;
      }
      speed = PETS.fleeSpeed;
    } else {
      if (!this.meal || !this.meal.alive) {
        this.meal = null;
        const seekRadius = hungry ? PETS.hungrySeekRadius : PETS.seekRadius;
        for (const item of food) {
          const distance = Math.hypot(item.x - this.x, item.y - this.y);
          if (distance < seekRadius) {
            this.meal = item;
            break;
          }
        }
      }
      if (this.meal) {
        targetX = this.meal.x;
        targetY = this.meal.y;
        speed = hungry ? PETS.hungrySpeed : PETS.seekSpeed;
      } else if (this.roamTimer <= 0 || Math.hypot(targetX - this.x, targetY - this.y) < 34) {
        this.pickWaypoint();
        targetX = this.waypointX;
        targetY = this.waypointY;
      }
    }

    let sepX = 0;
    let sepY = 0;
    for (const other of others) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0.5) {
        if (distance < PETS.separation) {
          const push = (PETS.separation - distance) / PETS.separation;
          sepX += (dx / distance) * push * 110;
          sepY += (dy / distance) * push * 110;
        }
      } else {
        sepX += Math.cos(this.phase) * 90;
        sepY += Math.sin(this.phase) * 90;
      }
    }
    targetX += sepX;
    targetY += sepY;
    if (targetX < PETS.wallMargin) targetX += PETS.wallPush;
    else if (targetX > LOGICAL_WIDTH - PETS.wallMargin) targetX -= PETS.wallPush;
    if (targetY < PETS.wallMargin) targetY += PETS.wallPush;
    else if (targetY > LOGICAL_HEIGHT - PETS.wallMargin) targetY -= PETS.wallPush;
    targetX = clamp(targetX, this.radius, LOGICAL_WIDTH - this.radius);
    targetY = clamp(targetY, this.radius, LOGICAL_HEIGHT - this.radius);

    const toX = targetX - this.x;
    const toY = targetY - this.y;
    const length = Math.hypot(toX, toY) || 1;
    const accel = 1 - Math.exp(-3 * dt);
    this.vx += ((toX / length) * speed - this.vx) * accel;
    this.vy += ((toY / length) * speed - this.vy) * accel;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, this.radius, LOGICAL_WIDTH - this.radius);
    this.y = clamp(this.y, this.radius, LOGICAL_HEIGHT - this.radius);
    if (Math.abs(this.vx) > 6) this.facing = this.vx > 0 ? 1 : -1;
  }

  render(ctx) {
    const radius = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(this.age * 2.6 + this.phase) * 2);
    if (this.hunger > PETS.hungryThreshold) {
      const pulse = 0.55 + 0.45 * Math.sin(this.age * 6);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = COLORS.accent;
      ctx.beginPath();
      ctx.arc(0, -radius * 2.4, radius * 0.72, 0, TAU);
      ctx.fill();
      ctx.fillStyle = COLORS.abyss;
      ctx.fillRect(-radius * 0.11, -radius * 2.72, radius * 0.22, radius * 0.46);
      ctx.beginPath();
      ctx.arc(0, -radius * 2.12, radius * 0.13, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.scale(this.facing, 1);
    if (this.scared > 0) ctx.globalAlpha = 0.85;
    if (this.kind === 'shark') this.renderShark(ctx, radius);
    else if (this.kind === 'stingray') this.renderStingray(ctx, radius);
    else if (this.kind === 'squid') this.renderSquid(ctx, radius);
    else if (this.kind === 'arcticshrimp') this.renderShrimp(ctx, radius);
    else if (this.kind === 'kelpcrab') this.renderCrab(ctx, radius);
    else if (this.kind === 'jellyfish') this.renderJelly(ctx, radius);
    else if (this.kind === 'goldfish') this.renderGoldfish(ctx, radius);
    else if (this.kind === 'babyshark') this.renderBabyShark(ctx, radius);
    else if (this.kind === 'ghostjelly') this.renderGhostJelly(ctx, radius);
    else if (this.kind === 'moray') this.renderMoray(ctx, radius);
    else this.renderNautilus(ctx, radius);
    ctx.globalAlpha = 1;
    if (this.eating > 0) {
      ctx.fillStyle = COLORS.danger;
      ctx.beginPath();
      ctx.arc(radius * 1.1, -radius * 1.1, radius * 0.24, 0, TAU);
      ctx.arc(radius * 1.7, -radius * 1.25, radius * 0.18, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  renderShark(ctx, r) {
    ctx.save();
    ctx.translate(-r * 1.3, 0);
    ctx.rotate(Math.sin(this.age * 7 + this.phase) * 0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.8, -r * 0.55);
    ctx.lineTo(-r * 0.45, 0);
    ctx.lineTo(-r * 0.8, r * 0.55);
    ctx.closePath();
    ctx.fillStyle = COLORS.sharkFin;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.35, r * 0.72, 0, 0, TAU);
    ctx.fillStyle = COLORS.shark;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.15, -r * 0.6);
    ctx.lineTo(r * 0.1, -r * 1.2);
    ctx.lineTo(r * 0.45, -r * 0.5);
    ctx.closePath();
    ctx.fillStyle = COLORS.sharkFin;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.8, -r * 0.2, r * 0.14, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
  }

  renderStingray(ctx, r) {
    ctx.strokeStyle = COLORS.stingray;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, 0);
    ctx.quadraticCurveTo(-r * 1.8, Math.sin(this.age * 4 + this.phase) * r * 0.4, -r * 2.2, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 1.1, 0);
    ctx.quadraticCurveTo(r * 0.3, -r * 1.2, -r * 0.7, -r * 0.9);
    ctx.quadraticCurveTo(-r * 0.9, 0, -r * 0.7, r * 0.9);
    ctx.quadraticCurveTo(r * 0.3, r * 1.2, r * 1.1, 0);
    ctx.closePath();
    ctx.fillStyle = COLORS.stingray;
    ctx.fill();
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(r * 0.6, -r * 0.25, r * 0.1, 0, TAU);
    ctx.arc(r * 0.6, r * 0.25, r * 0.1, 0, TAU);
    ctx.fill();
  }

  renderSquid(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(r * 0.9, 0);
    ctx.quadraticCurveTo(r * 0.6, -r * 0.8, -r * 0.7, -r * 0.62);
    ctx.quadraticCurveTo(-r * 1.5, 0, -r * 0.7, r * 0.62);
    ctx.quadraticCurveTo(r * 0.6, r * 0.8, r * 0.9, 0);
    ctx.closePath();
    ctx.fillStyle = COLORS.squid;
    ctx.fill();
    ctx.strokeStyle = COLORS.squid;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const spread = (i - 1.5) * 0.3;
      ctx.beginPath();
      ctx.moveTo(r * 0.7, spread * r * 0.7);
      ctx.quadraticCurveTo(r * 1.5, spread * r + Math.sin(this.age * 6 + i) * r * 0.2, r * 2, spread * r * 1.3);
      ctx.stroke();
    }
    ctx.fillStyle = '#f4fbff';
    ctx.beginPath();
    ctx.arc(r * 0.3, -r * 0.3, r * 0.2, 0, TAU);
    ctx.arc(r * 0.3, r * 0.3, r * 0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(r * 0.36, -r * 0.3, r * 0.1, 0, TAU);
    ctx.arc(r * 0.36, r * 0.3, r * 0.1, 0, TAU);
    ctx.fill();
  }

  renderShrimp(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(r * 0.85, 0);
    ctx.quadraticCurveTo(r * 0.2, -r * 0.6, -r * 0.6, -r * 0.2);
    ctx.quadraticCurveTo(-r * 1, 0, -r * 0.6, r * 0.2);
    ctx.quadraticCurveTo(r * 0.2, r * 0.6, r * 0.85, 0);
    ctx.closePath();
    ctx.fillStyle = COLORS.arcticshrimp;
    ctx.fill();
    ctx.save();
    ctx.translate(-r * 0.8, 0);
    ctx.rotate(Math.sin(this.age * 8 + this.phase) * 0.4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.6, -r * 0.45);
    ctx.lineTo(-r * 0.75, 0);
    ctx.lineTo(-r * 0.6, r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = COLORS.arcticshrimp;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(r * 0.8, -r * 0.1);
    ctx.lineTo(r * 1.4, -r * 0.5);
    ctx.moveTo(r * 0.8, r * 0.1);
    ctx.lineTo(r * 1.4, r * 0.5);
    ctx.stroke();
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(r * 0.6, -r * 0.15, r * 0.1, 0, TAU);
    ctx.fill();
  }

  renderCrab(ctx, r) {
    ctx.strokeStyle = COLORS.crab;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      for (const side of [-1, 1]) {
        const swing = Math.sin(this.age * 7 + i + (side > 0 ? Math.PI : 0)) * 2;
        const baseX = -r * 0.5 + i * r * 0.45;
        ctx.beginPath();
        ctx.moveTo(baseX, side * r * 0.4);
        ctx.lineTo(baseX + swing, side * r * 0.95);
        ctx.stroke();
      }
    }
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(r * 0.95, side * r * 0.5, r * 0.38, r * 0.24, side * 0.5, 0, TAU);
      ctx.fillStyle = COLORS.crab;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * 0.85, 0, 0, TAU);
    ctx.fillStyle = COLORS.crab;
    ctx.fill();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(r * 0.75, side * r * 0.5, r * 0.16, 0, TAU);
      ctx.fillStyle = '#f4fbff';
      ctx.fill();
      ctx.fillStyle = '#10233a';
      ctx.beginPath();
      ctx.arc(r * 0.8, side * r * 0.5, r * 0.08, 0, TAU);
      ctx.fill();
    }
  }

  renderJelly(ctx, r) {
    const pulse = 1 + Math.sin(this.age * 3 + this.phase) * 0.12;
    ctx.strokeStyle = COLORS.jelly;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.5, r * 0.3);
      ctx.quadraticCurveTo(i * r * 0.5 + Math.sin(this.age * 4 + i) * r * 0.3, r * 1.1, i * r * 0.4, r * 1.7);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-r * pulse, r * 0.2);
    ctx.quadraticCurveTo(-r * 1.2 * pulse, -r * pulse, 0, -r * 1.05 * pulse);
    ctx.quadraticCurveTo(r * 1.2 * pulse, -r * pulse, r * pulse, r * 0.2);
    ctx.quadraticCurveTo(0, r * 0.5, -r * pulse, r * 0.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 143, 163, 0.7)';
    ctx.fill();
  }

  renderGoldfish(ctx, r) {
    ctx.save();
    ctx.translate(-r * 1.25, 0);
    ctx.rotate(Math.sin(this.age * 8 + this.phase) * 0.35);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 1.1, -r * 0.8);
    ctx.lineTo(-r * 1.45, 0);
    ctx.lineTo(-r * 1.1, r * 0.8);
    ctx.closePath();
    ctx.fillStyle = COLORS.accent;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.3, r * 0.85, 0, 0, TAU);
    ctx.fillStyle = COLORS.accent;
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.2, r * 0.95, r * 0.45, 0, 0, TAU);
    ctx.fillStyle = '#fff3c4';
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(r * 0.72, -r * 0.22, r * 0.14, 0, TAU);
    ctx.fill();
  }

  renderBabyShark(ctx, r) {
    ctx.save();
    ctx.scale(0.72, 0.72);
    this.renderShark(ctx, r);
    ctx.restore();
  }

  renderGhostJelly(ctx, r) {
    const pulse = 1 + Math.sin(this.age * 3 + this.phase) * 0.12;
    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = COLORS.bubble;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.5, r * 0.3);
      ctx.quadraticCurveTo(i * r * 0.5 + Math.sin(this.age * 4 + i) * r * 0.3, r * 1.1, i * r * 0.4, r * 1.7);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-r * pulse, r * 0.2);
    ctx.quadraticCurveTo(-r * 1.2 * pulse, -r * pulse, 0, -r * 1.05 * pulse);
    ctx.quadraticCurveTo(r * 1.2 * pulse, -r * pulse, r * pulse, r * 0.2);
    ctx.quadraticCurveTo(0, r * 0.5, -r * pulse, r * 0.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(207, 239, 255, 0.45)';
    ctx.fill();
    ctx.restore();
  }

  renderMoray(ctx, r) {
    const count = 9;
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      points.push({
        x: -t * r * 3,
        y: Math.sin(this.age * 4.5 + this.phase - i * 0.5) * r * (0.1 + t * 0.45),
        t,
      });
    }
    const left = [];
    const right = [];
    for (let i = 0; i < count; i += 1) {
      const point = points[i];
      const before = points[Math.max(0, i - 1)];
      const after = points[Math.min(count - 1, i + 1)];
      let tangentX = before.x - after.x;
      let tangentY = before.y - after.y;
      const length = Math.hypot(tangentX, tangentY) || 1;
      tangentX /= length;
      tangentY /= length;
      const width = r * (0.5 * (1 - point.t) + 0.08);
      left.push({ x: point.x - tangentY * width, y: point.y + tangentX * width });
      right.push({ x: point.x + tangentY * width, y: point.y - tangentX * width });
    }
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < count; i += 1) ctx.lineTo(left[i].x, left[i].y);
    for (let i = count - 1; i >= 0; i -= 1) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();
    ctx.fillStyle = COLORS.eel;
    ctx.fill();
    ctx.strokeStyle = COLORS.eelDark;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = COLORS.eelBelly;
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < count; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, side * r * 0.3);
      ctx.quadraticCurveTo(-r * 0.2, side * r * 0.75, -r * 0.9, side * r * 0.6);
      ctx.quadraticCurveTo(-r * 0.7, side * r * 0.35, -r * 0.3, side * r * 0.3);
      ctx.closePath();
      ctx.fillStyle = COLORS.eelDark;
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, 0);
    ctx.quadraticCurveTo(r * 0.5, -r * 0.4, r * 1.05, -r * 0.12);
    ctx.quadraticCurveTo(r * 1.2, 0, r * 1.05, r * 0.1);
    ctx.quadraticCurveTo(r * 0.5, r * 0.42, -r * 0.5, 0);
    ctx.closePath();
    ctx.fillStyle = COLORS.eel;
    ctx.fill();
    ctx.strokeStyle = COLORS.eelDark;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 1.02, 0);
    ctx.quadraticCurveTo(r * 0.55, r * 0.09, r * 0.15, r * 0.05);
    ctx.strokeStyle = COLORS.eelDark;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f4fbff';
    for (let i = 0; i < 3; i += 1) {
      const toothX = r * (0.9 - i * 0.25);
      ctx.beginPath();
      ctx.moveTo(toothX - 1.2, r * 0.02);
      ctx.lineTo(toothX + 1.2, r * 0.02);
      ctx.lineTo(toothX, r * 0.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(r * 0.5, -r * 0.2, r * 0.17, 0, TAU);
    ctx.fillStyle = '#f4fbff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.53, -r * 0.2, r * 0.09, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
  }

  renderNautilus(ctx, r) {
    ctx.strokeStyle = COLORS.nautilusSkin;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i += 1) {
      const baseX = -r * 0.5 + i * r * 0.34;
      const sway = Math.sin(this.age * 5 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(baseX, r * 0.35);
      ctx.quadraticCurveTo(baseX + sway, r * 0.9, baseX + sway * 1.4, r * 1.3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.05, 0, TAU);
    ctx.fillStyle = COLORS.nautilusShell;
    ctx.fill();
    ctx.strokeStyle = COLORS.nautilusShellDark;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 18; i += 1) {
      const t = i / 17;
      const angle = t * TAU * 2.1;
      const spiral = r * 0.9 * (1 - t * 0.8);
      if (i === 0) ctx.moveTo(Math.cos(angle) * spiral, Math.sin(angle) * spiral);
      else ctx.lineTo(Math.cos(angle) * spiral, Math.sin(angle) * spiral);
    }
    ctx.stroke();
    ctx.fillStyle = COLORS.nautilusSkin;
    ctx.beginPath();
    ctx.ellipse(r * 0.7, r * 0.3, r * 0.36, r * 0.24, 0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(r * 0.8, r * 0.28, r * 0.11, 0, TAU);
    ctx.fill();
  }
}
