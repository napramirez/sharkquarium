import { Entity } from './entity.js';
import { rand, clamp, TAU } from '../engine/math.js';
import { MINNOW, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Minnow extends Entity {
  constructor() {
    super({ x: rand(90, LOGICAL_WIDTH - 90), y: rand(90, LOGICAL_HEIGHT - 90), radius: MINNOW.radius });
    this.score = MINNOW.scoreValue;
    this.heading = rand(0, TAU);
    this.speed = rand(MINNOW.speedMin, MINNOW.speedMax);
    this.turnTimer = rand(0.6, 1.4);
    this.state = 'swimming';
    this.tangleTimer = 0;
    this.completed = false;
    this.tangledTo = null;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  beginTangle(player) {
    if (this.state !== 'swimming') return;
    this.state = 'tangled';
    this.tangleTimer = MINNOW.tangleTime;
    this.tangledTo = player;
    this.offsetX = rand(-14, 14);
    this.offsetY = 26 + rand(0, 14);
  }

  update(dt) {
    super.update(dt);
    if (this.state === 'tangled') {
      if (this.tangledTo) {
        const targetX = this.tangledTo.x + this.offsetX;
        const targetY = this.tangledTo.y + this.offsetY;
        const ease = 1 - Math.exp(-10 * dt);
        this.x += (targetX - this.x) * ease;
        this.y += (targetY - this.y) * ease;
      }
      this.tangleTimer -= dt;
      if (this.tangleTimer <= 0) this.completed = true;
      return;
    }
    this.turnTimer -= dt;
    if (this.turnTimer <= 0) {
      this.turnTimer = rand(0.6, 1.4);
      this.heading += rand(-1.4, 1.4);
    }
    this.x += Math.cos(this.heading) * this.speed * dt;
    this.y += Math.sin(this.heading) * this.speed * dt;
    if (this.x < 60) {
      this.x = 60;
      this.heading = Math.PI - this.heading;
    } else if (this.x > LOGICAL_WIDTH - 60) {
      this.x = LOGICAL_WIDTH - 60;
      this.heading = Math.PI - this.heading;
    }
    if (this.y < 60) {
      this.y = 60;
      this.heading = -this.heading;
    } else if (this.y > LOGICAL_HEIGHT - 60) {
      this.y = LOGICAL_HEIGHT - 60;
      this.heading = -this.heading;
    }
  }

  render(ctx) {
    const size = this.radius;
    const wiggle = this.state === 'tangled' ? Math.sin(this.age * 22) * 0.4 : Math.sin(this.age * 8) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);
    ctx.save();
    ctx.translate(-size * 0.8, 0);
    ctx.rotate(wiggle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size * 0.9, -size * 0.5);
    ctx.lineTo(-size * 0.9, size * 0.5);
    ctx.closePath();
    ctx.fillStyle = COLORS.minnow;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.48, 0, 0, TAU);
    ctx.fillStyle = COLORS.minnow;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.5, -size * 0.18, size * 0.14, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();
    ctx.restore();
  }
}
