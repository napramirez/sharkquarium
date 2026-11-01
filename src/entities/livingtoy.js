import { Entity } from './entity.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { PLAYTOY_TOYS } from '../config.js';

export class LivingToy extends Entity {
  constructor(x, y, kindIndex = 0, options = {}) {
    super({ x, y, radius: options.radius ?? 22 });
    this.kind = PLAYTOY_TOYS[kindIndex % PLAYTOY_TOYS.length];
    this.homeX = x;
    this.homeY = y;
    this.heading = rand(0, TAU);
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.state = 'idle';
    this.stunTimer = 0;
    this.phase = rand(0, TAU);
    this.knockTimer = 0;
    this.giggle = rand(0.4, 1.4);
    this.detectRange = options.detectRange ?? 300;
    this.idleSpeed = options.idleSpeed ?? 118;
    this.chaseSpeed = options.chaseSpeed ?? 196;
    this.worldLength = options.worldLength ?? Infinity;
  }

  stun(time) {
    this.state = 'stun';
    this.stunTimer = time;
  }

  knock(dx, dy, force) {
    const d = Math.hypot(dx, dy) || 1;
    this.vx = (dx / d) * force;
    this.vy = (dy / d) * force;
    this.knockTimer = Math.max(this.knockTimer, 0.5);
    if (this.state !== 'stun') this.state = 'knock';
  }

  update(dt, player) {
    super.update(dt);
    this.phase += dt;
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.vx *= 1 - Math.min(1, 6 * dt);
      this.vy *= 1 - Math.min(1, 6 * dt);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.stunTimer <= 0) this.state = 'idle';
      return;
    }
    if (this.knockTimer > 0) {
      this.knockTimer -= dt;
      if (Math.abs(this.vx) > 6) this.facing = this.vx > 0 ? 1 : -1;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 1 - Math.min(1, 2.6 * dt);
      this.vy *= 1 - Math.min(1, 2.6 * dt);
      if (this.knockTimer <= 0) this.state = 'idle';
      this.constrain();
      return;
    }
    const dx = player ? player.x - this.x : 0;
    const dy = player ? player.y - this.y : 0;
    const dist = Math.hypot(dx, dy);
    if (player && dist < this.detectRange) {
      this.state = 'chase';
      const d = dist || 1;
      this.vx = (dx / d) * this.chaseSpeed;
      this.vy = (dy / d) * this.chaseSpeed;
    } else {
      this.state = 'idle';
      const drift = Math.sin(this.phase * 0.8) * 0.6;
      this.vx = Math.cos(this.heading + drift) * this.idleSpeed;
      this.vy = Math.sin(this.heading + drift) * this.idleSpeed * 0.5;
      if (Math.hypot(this.x - this.homeX, this.y - this.homeY) > 150) {
        this.heading = Math.atan2(this.homeY - this.y, this.homeX - this.x);
      }
      if (Math.random() < 0.006) this.heading = rand(0, TAU);
    }
    if (Math.abs(this.vx) > 8) this.facing = this.vx > 0 ? 1 : -1;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.constrain();
  }

  constrain() {
    this.x = clamp(this.x, 30, Math.min(this.worldLength, 1e9));
    this.y = clamp(this.y, 40, 500);
  }

  render(ctx) {
    const s = this.radius / 22;
    const bob = Math.sin(this.phase * 2.2) * 2;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    ctx.scale(this.facing * s, s);
    ctx.rotate(Math.sin(this.phase * 1.4) * 0.05);
    const stunned = this.stunTimer > 0;
    if (stunned) ctx.globalAlpha = 0.85;
    switch (this.kind.key) {
      case 'wibble':
        this.drawOcto(ctx, stunned);
        break;
      case 'crankfin':
        this.drawWindup(ctx, stunned);
        break;
      case 'glooplo':
        this.drawBlob(ctx, stunned);
        break;
      default:
        this.drawPlushfish(ctx, stunned);
        break;
    }
    ctx.restore();
  }

  drawEyes(ctx, stunned) {
    const eye = this.kind.eye;
    if (stunned) {
      ctx.strokeStyle = '#20242c';
      ctx.lineWidth = 2;
      for (const ex of [-7, 7]) {
        ctx.beginPath();
        ctx.moveTo(ex - 4, -6);
        ctx.lineTo(ex + 4, -2);
        ctx.moveTo(ex + 4, -6);
        ctx.lineTo(ex - 4, -2);
        ctx.stroke();
      }
      return;
    }
    for (const ex of [-7, 7]) {
      ctx.fillStyle = '#f7fbff';
      ctx.beginPath();
      ctx.arc(ex, -4, 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = eye;
      ctx.beginPath();
      ctx.arc(ex + 1, -4, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#141821';
      ctx.beginPath();
      ctx.arc(ex + 1, -4, 1.4, 0, TAU);
      ctx.fill();
    }
  }

  drawStitchSmile(ctx, y = 5) {
    ctx.strokeStyle = 'rgba(30, 34, 44, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-8, y);
    ctx.quadraticCurveTo(0, y + 6, 8, y);
    ctx.stroke();
    for (let i = -6; i <= 6; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, y + 1);
      ctx.lineTo(i + 2, y + 4);
      ctx.stroke();
    }
  }

  drawPlushfish(ctx, stunned) {
    const b = this.kind.body;
    const f = this.kind.fin;
    ctx.fillStyle = f;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-26, -10);
    ctx.lineTo(-26, 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2, -14);
    ctx.quadraticCurveTo(6, -26, 10, -12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = b;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 15, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-4, -5, 10, 6, -0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fdfdfd';
    for (const tx of [-2, 4]) {
      ctx.beginPath();
      ctx.moveTo(tx, 6);
      ctx.lineTo(tx + 3, 13);
      ctx.lineTo(tx + 6, 6);
      ctx.closePath();
      ctx.fill();
    }
    this.drawEyes(ctx, stunned);
    this.drawStitchSmile(ctx, 2);
    ctx.strokeStyle = 'rgba(20, 24, 32, 0.5)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.quadraticCurveTo(14, 0, 2, 10);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawOcto(ctx, stunned) {
    const b = this.kind.body;
    const f = this.kind.fin;
    ctx.fillStyle = f;
    for (let i = 0; i < 5; i += 1) {
      const tx = -12 + i * 6;
      ctx.beginPath();
      ctx.moveTo(tx, 8);
      ctx.quadraticCurveTo(tx - 2, 24, tx + 4, 30);
      ctx.quadraticCurveTo(tx + 5, 22, tx + 5, 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = b;
    ctx.beginPath();
    ctx.arc(0, -2, 18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.arc(-6, -8, 6, 0, TAU);
    ctx.fill();
    this.drawEyes(ctx, stunned);
    this.drawStitchSmile(ctx, 2);
  }

  drawWindup(ctx, stunned) {
    const b = this.kind.body;
    const f = this.kind.fin;
    ctx.fillStyle = f;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-27, -11);
    ctx.lineTo(-27, 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = b;
    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 14, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0.6, 2.4);
    ctx.stroke();
    ctx.save();
    ctx.translate(-2, -13);
    ctx.rotate(this.phase * (stunned ? 0.2 : 2.4));
    ctx.strokeStyle = '#b9c4cc';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.strokeStyle = '#8f9aa2';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 3);
    ctx.stroke();
    ctx.restore();
    this.drawEyes(ctx, stunned);
    this.drawStitchSmile(ctx, 4);
  }

  drawBlob(ctx, stunned) {
    const b = this.kind.body;
    ctx.fillStyle = b;
    ctx.beginPath();
    ctx.moveTo(-20, 8);
    ctx.quadraticCurveTo(-22, -18, 0, -20);
    ctx.quadraticCurveTo(22, -18, 20, 8);
    ctx.quadraticCurveTo(10, 20, 0, 16);
    ctx.quadraticCurveTo(-10, 20, -20, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fdfdfd';
    ctx.beginPath();
    ctx.arc(4, -4, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = stunned ? '#20242c' : this.kind.eye;
    ctx.beginPath();
    ctx.arc(6, -4, 4.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#141821';
    ctx.beginPath();
    ctx.arc(6, -4, 2, 0, TAU);
    ctx.fill();
    if (stunned) {
      ctx.strokeStyle = '#20242c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(10, -1);
      ctx.moveTo(10, -9);
      ctx.lineTo(0, -1);
      ctx.stroke();
    }
    this.drawStitchSmile(ctx, 8);
  }
}
