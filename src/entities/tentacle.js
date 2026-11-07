import { Entity } from './entity.js';
import { clamp, lerp, rand, TAU } from '../engine/math.js';
import { LABYRINTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Tentacle extends Entity {
  constructor(laneY, index, options = {}) {
    super({ x: 0, y: laneY, radius: LABYRINTH.grabRadius });
    this.santa = true;
    this.laneY = laneY;
    this.index = index;
    this.flat3D = true;
    this.phase = rand(0, TAU);
    this.aimY = laneY;
    this.reach = 0;
    this.cooldown = 0;
    this.pack = options.pack ?? false;
    this.burstMode = options.burst ?? false;
    this.angle = options.angle ?? 0;
    this.burstTimer = 0;
    this.burstDelay = 0;
    this.burstAge = 0;
    this.curlThreshold = 0;
    this.lengthScale = options.lengthScale ?? 1;
    this.widthScale = options.widthScale ?? 1;
    this.anchorOffset = options.anchorOffset ?? 0;
    this.writhe = options.writhe ?? 0;
    this.writheSpeed = options.writheSpeed ?? 1;
    this.curlGrow = 1;
    this.straight = 0;
    this.stretch = 0;
    this.retractAge = 0;
    this.club = options.club ?? false;
    this.rope = options.rope ?? false;
    this.lance = options.lance ?? LABYRINTH.burstLance;
  }

  burst(delay = 0, curlAt = 0) {
    if (this.burstTimer > 0 || this.burstDelay > 0) return;
    this.curlThreshold = curlAt;
    this.erupted = false;
    if (delay > 0) {
      this.burstDelay = delay;
      return;
    }
    this.burstTimer = LABYRINTH.burstDuration;
    this.burstAge = 0;
  }

  basePointAt(t) {
    let length =
      (LABYRINTH.grabberLength + this.reach * LABYRINTH.grabberReach) * this.lengthScale;
    if (this.stretch > 0) length = Math.min(length, this.stretch);
    if (this.burstMode) length *= Math.min(1, this.reach * 4);
    const localX = length * t;
    const localY =
      (this.aimY - this.y) * this.reach * t +
      Math.sin(this.age * 3 + this.phase + t * LABYRINTH.waveFreq) *
        LABYRINTH.waveAmp *
        t *
        (1 - this.straight);
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    return {
      x: this.x + localX * cos - localY * sin,
      y: this.y + localX * sin + localY * cos,
    };
  }

  pointAt(t) {
    const point = this.basePointAt(t);
    if (t <= LABYRINTH.curlStart) return point;
    const pivot = this.basePointAt(LABYRINTH.curlStart);
    const progress = (t - LABYRINTH.curlStart) / (1 - LABYRINTH.curlStart);
    const curl =
      (LABYRINTH.curlBase + this.reach * LABYRINTH.curlGrab) *
      progress *
      progress *
      this.curlGrow;
    const cos = Math.cos(curl);
    const sin = Math.sin(curl);
    const dx = point.x - pivot.x;
    const dy = point.y - pivot.y;
    return {
      x: pivot.x + dx * cos - dy * sin,
      y: pivot.y + dx * sin + dy * cos,
    };
  }

  widthAt(t) {
    if (this.rope) return Math.max(1.6, LABYRINTH.ropeWidth * this.widthScale * (1 - t * 0.3));
    return Math.max(2.4, LABYRINTH.tentacleWidth * this.widthScale * (1 - t * 0.8));
  }

  tip() {
    return this.pointAt(1);
  }

  update(dt, anchorX, target) {
    super.update(dt);
    this.y = this.laneY;
    if (this.burstMode) {
      this.x = anchorX + this.anchorOffset;
      if (this.burstDelay > 0) {
        this.burstDelay = Math.max(0, this.burstDelay - dt);
        if (this.burstDelay > 0) return;
        this.burstTimer = LABYRINTH.burstDuration;
        this.burstAge = 0;
      }
      if (this.burstTimer > 0) {
        this.burstAge += dt;
        const thrustTime = LABYRINTH.burstThrustTime;
        const curlAt = this.curlThreshold + this.lance;
        const retractAt = curlAt + LABYRINTH.burstHold;
        const endAt = retractAt + LABYRINTH.burstRetract;
        this.retractAge = retractAt;
        if (this.burstAge < thrustTime) {
          this.reach = this.burstAge / thrustTime;
          this.curlGrow = 0;
          this.straight = 1;
        } else if (this.burstAge < retractAt) {
          this.reach = 1;
          const curling = this.burstAge >= curlAt;
          this.curlGrow = curling
            ? Math.min(1, (this.burstAge - curlAt) / LABYRINTH.burstCurlTime)
            : 0;
          this.straight = curling ? Math.max(0, 1 - this.curlGrow * 3) : 1;
        } else {
          this.reach = Math.max(0, 1 - (this.burstAge - retractAt) / LABYRINTH.burstRetract);
          this.curlGrow = 1;
          this.straight = 0;
        }
        if (this.burstAge >= endAt || this.reach <= 0) {
          this.burstTimer = 0;
          this.reach = Math.max(0, this.reach);
        }
      } else {
        this.reach = Math.max(0, this.reach - dt * 2.4);
        this.curlGrow = 1;
        this.straight = 0;
      }
      return;
    }
    if (this.pack) {
      this.x = anchorX + this.anchorOffset;
      this.reach =
        this.writhe + Math.sin(this.age * this.writheSpeed + this.phase) * this.writhe * 0.5;
      return;
    }
    this.x = anchorX;
    this.cooldown = Math.max(0, this.cooldown - dt);
    const lunging = target !== null && this.cooldown <= 0;
    if (lunging) {
      this.aimY = lerp(
        this.aimY,
        clamp(target.y, 40, LOGICAL_HEIGHT - 40),
        1 - Math.exp(-6 * dt),
      );
      this.reach = Math.min(1, this.reach + LABYRINTH.lungeReach * dt);
    } else {
      this.aimY = lerp(this.aimY, this.laneY, 1 - Math.exp(-3 * dt));
      this.reach = Math.max(0, this.reach - LABYRINTH.retractReach * dt);
    }
  }

  frame(segments) {
    const points = [];
    const widths = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      points.push(this.pointAt(t));
      widths.push(this.widthAt(t));
    }
    const normals = [];
    for (let i = 0; i <= segments; i += 1) {
      const before = points[Math.max(0, i - 1)];
      const after = points[Math.min(segments, i + 1)];
      let tangentX = before.x - after.x;
      let tangentY = before.y - after.y;
      const length = Math.hypot(tangentX, tangentY) || 1;
      tangentX /= length;
      tangentY /= length;
      normals.push({ x: -tangentY, y: tangentX });
    }
    return { points, normals, widths };
  }

  ribbon(ctx, frame, grow, color) {
    const { points, normals, widths } = frame;
    const count = points.length;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(
      points[0].x - normals[0].x * (widths[0] + grow),
      points[0].y - normals[0].y * (widths[0] + grow),
    );
    for (let i = 1; i < count; i += 1) {
      ctx.lineTo(
        points[i].x - normals[i].x * (widths[i] + grow),
        points[i].y - normals[i].y * (widths[i] + grow),
      );
    }
    for (let i = count - 1; i >= 0; i -= 1) {
      ctx.lineTo(
        points[i].x + normals[i].x * (widths[i] + grow),
        points[i].y + normals[i].y * (widths[i] + grow),
      );
    }
    ctx.closePath();
    ctx.fill();
  }

  renderSuction(ctx, frame) {
    const { points, normals, widths } = frame;
    const count = points.length;
    const suckers = [];
    const rope = this.rope;
    for (let i = 1; i < count - 1; i += 1) {
      const side = normals[i].y >= 0 ? 1 : -1;
      const offset = side * (rope ? 0.44 : 0.34) * widths[i];
      suckers.push({
        x: points[i].x + normals[i].x * offset,
        y: points[i].y + normals[i].y * offset,
        radius: Math.max(rope ? 2.2 : 1.4, widths[i] * (rope ? 0.5 : 0.2)),
      });
    }
    if (!this.pack) {
      for (let i = 1; i < count - 2; i += 1) {
        const width = (widths[i] + widths[i + 1]) * 0.5;
        let normalX = normals[i].x + normals[i + 1].x;
        let normalY = normals[i].y + normals[i + 1].y;
        const length = Math.hypot(normalX, normalY) || 1;
        normalX /= length;
        normalY /= length;
        const side = normalY >= 0 ? 1 : -1;
        const offset = side * (rope ? 0.8 : 0.62) * width;
        suckers.push({
          x: (points[i].x + points[i + 1].x) * 0.5 + normalX * offset,
          y: (points[i].y + points[i + 1].y) * 0.5 + normalY * offset,
          radius: Math.max(rope ? 1.7 : 1.2, width * (rope ? 0.36 : 0.17)),
        });
      }
    }
    ctx.fillStyle = COLORS.tentaclePale;
    ctx.beginPath();
    for (const sucker of suckers) {
      ctx.moveTo(sucker.x + sucker.radius, sucker.y);
      ctx.arc(sucker.x, sucker.y, sucker.radius, 0, TAU);
    }
    ctx.fill();
    ctx.fillStyle = COLORS.tentacleDark;
    ctx.beginPath();
    for (const sucker of suckers) {
      const radius = sucker.radius * 0.42;
      ctx.moveTo(sucker.x + radius, sucker.y);
      ctx.arc(sucker.x, sucker.y, radius, 0, TAU);
    }
    ctx.fill();
  }

  render(ctx) {
    const frame = this.frame(this.pack ? 8 : 12);
    const { points, widths } = frame;
    const count = points.length;
    const body = this.club ? COLORS.tentacleDark : COLORS.tentacle;
    const rim = this.club ? COLORS.tentacleDeep : COLORS.tentacleDark;
    this.ribbon(ctx, frame, this.rope ? 1.5 : 3, rim);
    this.ribbon(ctx, frame, 0, body);

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = this.club ? COLORS.tentacle : COLORS.tentaclePale;
    ctx.lineWidth = Math.max(1.2, widths[0] * 0.32);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < count; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();

    this.renderSuction(ctx, frame);

    if (this.straight > 0.05) {
      ctx.save();
      ctx.globalAlpha = 0.4 * this.straight;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < count; i += 1) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
      ctx.restore();
    }

    const tip = points[count - 1];
    const tipRadius = widths[count - 1] * 0.95;
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, tipRadius, 0, TAU);
    ctx.fill();
    if (this.club) {
      this.renderClub(ctx, points[count - 2], tip, tipRadius);
      return;
    }
    ctx.fillStyle = COLORS.tentaclePale;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, tipRadius * 0.36, 0, TAU);
    ctx.fill();
  }

  renderClub(ctx, before, tip, tipRadius) {
    const angle = Math.atan2(tip.y - before.y, tip.x - before.x);
    const base = Math.max(16, tipRadius * 4);
    const half = base * 1.8;
    const halfWidth = base * 1.1;
    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(angle);
    ctx.translate(half * 0.5, 0);
    ctx.fillStyle = COLORS.tentacleDark;
    ctx.beginPath();
    ctx.moveTo(half + 5, 0);
    ctx.lineTo(0, halfWidth + 5);
    ctx.lineTo(-half - 5, 0);
    ctx.lineTo(0, -halfWidth - 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.tentacle;
    ctx.beginPath();
    ctx.moveTo(half, 0);
    ctx.lineTo(0, halfWidth);
    ctx.lineTo(-half, 0);
    ctx.lineTo(0, -halfWidth);
    ctx.closePath();
    ctx.fill();

    const suckers = [];
    const radius = Math.max(1.5, base * 0.14);
    const rows = 6;
    for (let row = 0; row < rows; row += 1) {
      const x = -half * 0.62 + (row / (rows - 1)) * half * 1.24;
      const room = (1 - Math.abs(x) / half) * halfWidth * 0.74;
      const count = Math.max(1, Math.floor(room / (radius * 2.2)));
      for (let i = 0; i < count; i += 1) {
        const y = count === 1 ? 0 : -room + (i / (count - 1)) * room * 2;
        suckers.push({ x, y });
      }
    }
    ctx.fillStyle = COLORS.tentaclePale;
    ctx.beginPath();
    for (const sucker of suckers) {
      ctx.moveTo(sucker.x + radius, sucker.y);
      ctx.arc(sucker.x, sucker.y, radius, 0, TAU);
    }
    ctx.fill();
    ctx.fillStyle = COLORS.tentacleDark;
    ctx.beginPath();
    for (const sucker of suckers) {
      const dot = radius * 0.42;
      ctx.moveTo(sucker.x + dot, sucker.y);
      ctx.arc(sucker.x, sucker.y, dot, 0, TAU);
    }
    ctx.fill();
    ctx.restore();
  }
}
