import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { NAUTILUS, LOGICAL_WIDTH, COLORS } from '../config.js';

export class ChaserShark extends Entity {
  constructor() {
    super({ x: LOGICAL_WIDTH / 2, y: NAUTILUS.sharkStartY, radius: NAUTILUS.sharkRadius });
    this.state = 'chase';
    this.stunTimer = 0;
    this.heading = Math.PI / 2;
    this.finPhase = rand(0, TAU);
  }

  stun() {
    this.state = 'distracted';
    this.stunTimer = NAUTILUS.sharkDistractTime;
  }

  pickTarget(players) {
    let target = null;
    let best = Infinity;
    for (const player of players) {
      if (player.concealed === true) continue;
      const distance = Math.hypot(player.x - this.x, player.y - this.y);
      if (distance < best) {
        best = distance;
        target = player;
      }
    }
    return target;
  }

  update(dt, players, difficulty = 0, speedScale = 1) {
    super.update(dt);
    if (this.state === 'distracted') {
      this.stunTimer -= dt;
      this.y = Math.max(NAUTILUS.sharkStartY, this.y - NAUTILUS.sharkReturnSpeed * speedScale * dt);
      this.x += Math.sin(this.age * 1.6) * 8 * dt;
      if (this.stunTimer <= 0) this.state = 'chase';
      return;
    }
    const target = this.pickTarget(players);
    if (target) {
      const chaseSpeed =
        NAUTILUS.sharkChaseSpeed * (1 + (NAUTILUS.sharkRamp - 1) * difficulty) * speedScale;
      this.y = Math.min(target.y, this.y + chaseSpeed * dt);
      this.x += (target.x - this.x) * (1 - Math.exp(-1.2 * dt));
      this.heading = Math.atan2(target.y - this.y, target.x - this.x);
    }
  }

  render(ctx) {
    const radius = this.radius;
    const finSwing = Math.sin(this.age * 3 + this.finPhase) * 0.18;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    ctx.save();
    ctx.translate(-radius * 1.7, 0);
    ctx.rotate(finSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-radius * 0.95, -radius * 0.7);
    ctx.lineTo(-radius * 0.5, 0);
    ctx.lineTo(-radius * 0.95, radius * 0.7);
    ctx.closePath();
    ctx.fillStyle = COLORS.sharkFin;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.8, radius * 0.9, 0, 0, TAU);
    ctx.fillStyle = COLORS.shark;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, radius * 0.26, radius * 1.35, radius * 0.42, 0, 0, TAU);
    ctx.fillStyle = COLORS.sharkBelly;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-radius * 0.1, -radius * 0.78);
    ctx.lineTo(radius * 0.3, -radius * 1.6);
    ctx.lineTo(radius * 0.66, -radius * 0.62);
    ctx.closePath();
    ctx.fillStyle = COLORS.sharkFin;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(radius * 0.1, radius * 0.5);
    ctx.lineTo(radius * 0.34, radius * 1.35);
    ctx.lineTo(radius * 0.88, radius * 0.56);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = COLORS.sharkFin;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(radius * 0.45 - i * radius * 0.24, -radius * 0.12, radius * 0.34, -0.9, 0.9);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(16, 35, 58, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(radius * 1.62, radius * 0.1);
    ctx.quadraticCurveTo(radius * 1.1, radius * 0.42, radius * 0.5, radius * 0.36);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(radius * 1.05, -radius * 0.26, radius * 0.17, 0, TAU);
    ctx.fillStyle = '#f4fbff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 1.11, -radius * 0.26, radius * 0.08, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();

    ctx.restore();

    if (this.state === 'distracted') {
      ctx.save();
      ctx.translate(this.x, this.y - radius * 1.5);
      ctx.fillStyle = COLORS.accent;
      for (let i = 0; i < 3; i += 1) {
        const angle = this.age * 2.6 + (i * TAU) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 30, Math.sin(angle) * 10, 4, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
