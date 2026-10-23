import { Entity } from './entity.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { NAUTILUS, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class BaitSquid extends Entity {
  constructor() {
    super({
      x: rand(80, LOGICAL_WIDTH - 80),
      y: LOGICAL_HEIGHT + 120,
      radius: NAUTILUS.squidRadius,
    });
    this.phase = rand(0, TAU);
    this.drift = rand(-20, 20);
  }

  update(dt, players, scrollSpeed = NAUTILUS.scrollSpeed) {
    super.update(dt);
    this.y -= (scrollSpeed + NAUTILUS.squidRise) * dt;
    let target = null;
    let best = Infinity;
    for (const player of players) {
      const distance = Math.hypot(player.x - this.x, player.y - this.y);
      if (distance < best) {
        best = distance;
        target = player;
      }
    }
    if (target) {
      this.x += clamp(target.x - this.x, -NAUTILUS.squidSeek * dt, NAUTILUS.squidSeek * dt);
    } else {
      this.x += this.drift * dt;
    }
    this.x = clamp(this.x, this.radius, LOGICAL_WIDTH - this.radius);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(11, -6, 9, 6);
    ctx.quadraticCurveTo(0, 12, -9, 6);
    ctx.quadraticCurveTo(-11, -6, 0, -16);
    ctx.closePath();
    ctx.fillStyle = COLORS.squid;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-9, -12, 6, 4, -0.6, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(9, -12, 6, 4, 0.6, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = COLORS.squid;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i += 1) {
      const baseX = -6 + i * 4;
      const sway = Math.sin(this.age * 6 + this.phase + i) * 3;
      ctx.beginPath();
      ctx.moveTo(baseX, 8);
      ctx.quadraticCurveTo(baseX + sway, 16, baseX + sway * 1.5, 24);
      ctx.stroke();
    }

    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(-4, -6, 2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -6, 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
