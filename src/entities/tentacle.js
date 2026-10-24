import { Entity } from './entity.js';
import { clamp, lerp, rand, TAU } from '../engine/math.js';
import { LABYRINTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Tentacle extends Entity {
  constructor(laneY, index, options = {}) {
    super({ x: 0, y: laneY, radius: LABYRINTH.grabRadius });
    this.laneY = laneY;
    this.index = index;
    this.phase = rand(0, TAU);
    this.aimY = laneY;
    this.reach = 0;
    this.cooldown = 0;
    this.pack = options.pack ?? false;
    this.burstMode = options.burst ?? false;
    this.angle = options.angle ?? 0;
    this.burstTimer = 0;
    this.lengthScale = options.lengthScale ?? 1;
    this.widthScale = options.widthScale ?? 1;
    this.anchorOffset = options.anchorOffset ?? 0;
    this.writhe = options.writhe ?? 0;
    this.writheSpeed = options.writheSpeed ?? 1;
  }

  burst() {
    if (this.burstTimer <= 0) this.burstTimer = LABYRINTH.burstDuration;
  }

  basePointAt(t) {
    let length =
      (LABYRINTH.grabberLength + this.reach * LABYRINTH.grabberReach) * this.lengthScale;
    if (this.burstMode) length *= Math.min(1, this.reach * 4);
    const localX = length * t;
    const localY =
      (this.aimY - this.y) * this.reach * t +
      Math.sin(this.age * 3 + this.phase + t * LABYRINTH.waveFreq) * LABYRINTH.waveAmp * t;
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
      (LABYRINTH.curlBase + this.reach * LABYRINTH.curlGrab) * progress * progress;
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
      if (this.burstTimer > 0) {
        this.burstTimer = Math.max(0, this.burstTimer - dt);
        const progress = 1 - this.burstTimer / LABYRINTH.burstDuration;
        if (progress < 0.18) this.reach = progress / 0.18;
        else if (progress > 0.72) this.reach = Math.max(0, (1 - progress) / 0.28);
        else this.reach = 1;
      } else {
        this.reach = Math.max(0, this.reach - dt * 2.4);
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
    for (let i = 1; i < count - 1; i += 1) {
      const side = normals[i].y >= 0 ? 1 : -1;
      const offset = side * 0.34 * widths[i];
      suckers.push({
        x: points[i].x + normals[i].x * offset,
        y: points[i].y + normals[i].y * offset,
        radius: Math.max(1.4, widths[i] * 0.2),
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
        const offset = side * 0.62 * width;
        suckers.push({
          x: (points[i].x + points[i + 1].x) * 0.5 + normalX * offset,
          y: (points[i].y + points[i + 1].y) * 0.5 + normalY * offset,
          radius: Math.max(1.2, width * 0.17),
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
    this.ribbon(ctx, frame, 3, COLORS.tentacleDark);
    this.ribbon(ctx, frame, 0, COLORS.tentacle);

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = COLORS.tentaclePale;
    ctx.lineWidth = Math.max(1.5, widths[0] * 0.32);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < count; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();

    this.renderSuction(ctx, frame);

    const tip = points[count - 1];
    const tipRadius = widths[count - 1] * 0.95;
    ctx.fillStyle = COLORS.tentacle;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, tipRadius, 0, TAU);
    ctx.fill();
    ctx.fillStyle = COLORS.tentaclePale;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, tipRadius * 0.36, 0, TAU);
    ctx.fill();
  }
}
