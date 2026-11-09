import { rand, TAU } from '../engine/math.js';
import { TAG, COLORS } from '../config.js';

export class TagSwimmer {
  constructor({ name, color, cpu, controls = null, x = 0, y = 0, speedScale = 1, costume = 'none' }) {
    this.name = name;
    this.color = color;
    this.cpu = cpu;
    this.controls = controls;
    this.costume = costume;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = TAG.radius;
    this.speed = (cpu ? TAG.cpuSpeed : TAG.playerSpeed) * speedScale;
    this.tags = 0;
    this.makes = 0;
    this.isTagged = false;
    this.facing = 1;
    this.wanderPhase = rand(0, TAU);
    this.wanderSpeed = rand(0.9, 1.5);
    this.target = null;
  }

  pickRandomTarget(swimmers) {
    const others = swimmers.filter((swimmer) => swimmer !== this);
    this.target = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : null;
  }

  steer(targetX, targetY, dt, speed) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const response = 1 - Math.exp(-6 * dt);
    this.vx += ((dx / length) * speed - this.vx) * response;
    this.vy += ((dy / length) * speed - this.vy) * response;
  }

  updatePlayer(dt, input) {
    const horizontal =
      (input.isDown(this.controls.right) ? 1 : 0) - (input.isDown(this.controls.left) ? 1 : 0);
    const vertical =
      (input.isDown(this.controls.down) ? 1 : 0) - (input.isDown(this.controls.up) ? 1 : 0);
    const length = Math.hypot(horizontal, vertical);
    const dirX = length > 0 ? horizontal / length : 0;
    const dirY = length > 0 ? vertical / length : 0;
    this.steer(this.x + dirX * 100, this.y + dirY * 100, dt, length > 0 ? this.speed : 0);
    this.integrate(dt);
  }

  updateCpu(dt, swimmers, tagger) {
    this.wanderPhase += dt * this.wanderSpeed;
    let targetX;
    let targetY;
    let speed = this.speed * TAG.fleeDrop;
    if (this.isTagged) {
      if (!this.target || this.target.isTagged) this.pickRandomTarget(swimmers);
      if (this.target) {
        targetX = this.target.x;
        targetY = this.target.y;
        speed = this.speed * TAG.taggerSlow;
      } else {
        targetX = this.x;
        targetY = this.y;
      }
    } else {
      const dx = this.x - tagger.x;
      const dy = this.y - tagger.y;
      const length = Math.hypot(dx, dy) || 1;
      targetX = this.x + (dx / length) * 520 + Math.cos(this.wanderPhase) * 140;
      targetY = this.y + (dy / length) * 520 + Math.sin(this.wanderPhase * 1.3) * 140;
      if (this.x < 170) targetX += 420;
      if (this.x > TAG.worldWidth - 170) targetX -= 420;
      if (this.y < 130) targetY += 420;
      if (this.y > TAG.worldHeight - 130) targetY -= 420;
    }
    this.lastSpeed = speed;
    this.steer(targetX, targetY, dt, speed);
    this.integrate(dt);
  }

  integrate(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx);
    } else if (this.x > TAG.worldWidth - this.radius) {
      this.x = TAG.worldWidth - this.radius;
      this.vx = -Math.abs(this.vx);
    }
    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy);
    } else if (this.y > TAG.worldHeight - this.radius) {
      this.y = TAG.worldHeight - this.radius;
      this.vy = -Math.abs(this.vy);
    }
    if (Math.abs(this.vx) > 12) this.facing = this.vx > 0 ? 1 : -1;
  }

  render(ctx, time) {
    const radius = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.isTagged) {
      ctx.globalAlpha = 0.55 + 0.35 * Math.sin(time * 9);
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.75, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.scale(this.facing, 1);
    const chainsaw = this.costume === 'chainsaw';
    const flick = Math.sin(time * 9 + this.wanderPhase) * 0.3;
    if (!chainsaw) {
      ctx.save();
      ctx.translate(-radius * 1.45, 0);
      ctx.rotate(flick);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-radius * 0.85, -radius * 0.62);
      ctx.lineTo(-radius * 0.5, 0);
      ctx.lineTo(-radius * 0.85, radius * 0.62);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.5, radius * 0.78, 0, 0, TAU);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.2, -radius * 0.62);
    ctx.lineTo(radius * 0.15, -radius * 1.3);
    ctx.lineTo(radius * 0.5, -radius * 0.55);
    ctx.closePath();
    ctx.fillStyle = 'rgba(4, 16, 29, 0.35)';
    ctx.fill();
    if (!chainsaw) {
      ctx.beginPath();
      ctx.arc(radius * 0.85, -radius * 0.2, radius * 0.14, 0, TAU);
      ctx.fillStyle = '#f4fbff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(radius * 0.9, -radius * 0.2, radius * 0.07, 0, TAU);
      ctx.fillStyle = '#10233a';
      ctx.fill();
    }
    this.drawCostume(ctx, radius, time);
    ctx.restore();
  }

  drawCostume(ctx, radius, time) {
    if (this.costume === 'chainsaw') {
      const len = radius * 2.3;
      const bx = radius * 1.3;
      ctx.fillStyle = '#8f9aa3';
      ctx.beginPath();
      ctx.moveTo(bx, -radius * 0.25);
      ctx.lineTo(bx + len - radius * 0.32, -radius * 0.25);
      ctx.lineTo(bx + len, 0);
      ctx.lineTo(bx + len - radius * 0.32, radius * 0.25);
      ctx.lineTo(bx, radius * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c9d2da';
      for (let i = 0; i < 6; i += 1) {
        const x = bx + i * (len / 6);
        ctx.beginPath();
        ctx.moveTo(x, -radius * 0.26);
        ctx.lineTo(x + len / 12, -radius * 0.56);
        ctx.lineTo(x + len / 6, -radius * 0.26);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + len / 12, radius * 0.26);
        ctx.lineTo(x + len / 12 + len / 12, radius * 0.5);
        ctx.lineTo(x + len / 6, radius * 0.26);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = '#3a4148';
      ctx.lineWidth = radius * 0.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-radius * 0.1, -radius * 0.68);
      ctx.quadraticCurveTo(radius * 0.5, -radius * 1.4, radius * 1.2, -radius * 0.82);
      ctx.stroke();
      ctx.lineWidth = radius * 0.16;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.05, -radius * 0.66);
      ctx.lineTo(-radius * 0.05, -radius * 0.4);
      ctx.moveTo(radius * 1.14, -radius * 0.78);
      ctx.lineTo(radius * 1.16, -radius * 0.34);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-radius * 1.25, -radius * 0.5);
      ctx.lineTo(-radius * 2.0, -radius * 0.5);
      ctx.lineTo(-radius * 2.0, radius * 0.5);
      ctx.lineTo(-radius * 1.25, radius * 0.5);
      ctx.stroke();
      ctx.strokeStyle = '#12161a';
      ctx.lineWidth = radius * 0.14;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        const y = -radius * (0.34 - i * 0.24);
        ctx.beginPath();
        ctx.moveTo(radius * 1.15, y + radius * 0.22);
        ctx.lineTo(radius * 0.4, y - radius * 0.03);
        ctx.stroke();
      }
    } else if (this.costume === 'devil') {
      ctx.fillStyle = '#d2452f';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(radius * (0.2 + side * 0.18), -radius * 0.6);
        ctx.lineTo(radius * (0.42 + side * 0.24), -radius * 1.35);
        ctx.lineTo(radius * (0.62 + side * 0.18), -radius * 0.55);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = '#d2452f';
      ctx.lineWidth = radius * 0.16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-radius * 1.4, 0);
      ctx.lineTo(-radius * 2.0, -radius * 0.35);
      ctx.stroke();
    } else if (this.costume === 'fangs') {
      ctx.fillStyle = '#f4fbff';
      for (let i = 0; i < 4; i += 1) {
        const x = radius * (0.4 + i * 0.28);
        ctx.beginPath();
        ctx.moveTo(x, radius * 0.2);
        ctx.lineTo(x + radius * 0.1, radius * 0.46);
        ctx.lineTo(x + radius * 0.2, radius * 0.2);
        ctx.closePath();
        ctx.fill();
      }
    } else if (this.costume === 'visor') {
      ctx.fillStyle = 'rgba(99, 230, 255, 0.75)';
      fillBlade(ctx, radius * 0.6, -radius * 0.22, radius * 0.9, radius * 0.3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      fillBlade(ctx, radius * 0.7, -radius * 0.3, radius * 0.5, radius * 0.12);
    } else if (this.costume === 'halo') {
      ctx.strokeStyle = '#ffe089';
      ctx.lineWidth = radius * 0.14;
      ctx.beginPath();
      ctx.ellipse(0, -radius * 1.25, radius * 0.7, radius * 0.24, 0, 0, TAU);
      ctx.stroke();
    } else if (this.costume === 'lure') {
      ctx.strokeStyle = '#3f5a37';
      ctx.lineWidth = radius * 0.12;
      ctx.beginPath();
      ctx.moveTo(radius * 0.2, -radius * 0.6);
      ctx.quadraticCurveTo(radius * 0.9, -radius * 1.5, radius * 0.4, -radius * 1.8);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 236, 150, ${0.6 + 0.4 * Math.sin(time * 6)})`;
      ctx.beginPath();
      ctx.arc(radius * 0.4, -radius * 1.8, radius * 0.26, 0, TAU);
      ctx.fill();
    } else if (this.costume === 'ghost') {
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = '#e8f4ff';
      ctx.beginPath();
      ctx.ellipse(0, -radius * 0.1, radius * 1.5, radius * 1.0, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

function fillBlade(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.rect(x, y - h / 2, w, h);
  ctx.fill();
}
