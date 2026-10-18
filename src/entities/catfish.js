import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { CATFISH, FRESHWATER, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Catfish extends Entity {
  constructor() {
    super({ x: CATFISH.startX, y: LOGICAL_HEIGHT * 0.55, radius: CATFISH.radius });
    this.state = 'chase';
    this.stunTimer = 0;
    this.heading = 0;
    this.finPhase = rand(0, TAU);
  }

  stun() {
    this.state = 'stunned';
    this.stunTimer = CATFISH.stunDuration;
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
    if (this.state === 'stunned') {
      this.stunTimer -= dt;
      this.x = Math.max(CATFISH.startX, this.x - CATFISH.returnSpeed * speedScale * dt);
      this.y += Math.sin(this.age * 1.6) * 8 * dt;
      if (this.stunTimer <= 0) this.state = 'chase';
      return;
    }
    const target = this.pickTarget(players);
    if (target) {
      const chaseSpeed =
        CATFISH.chaseSpeed * (1 + (FRESHWATER.catfishRamp - 1) * difficulty) * speedScale;
      this.x = Math.min(target.x, this.x + chaseSpeed * dt);
      this.y += (target.y - this.y) * (1 - Math.exp(-1.2 * dt));
      this.heading = Math.atan2(target.y - this.y, target.x - this.x);
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    const finSwing = Math.sin(this.age * 3 + this.finPhase) * 0.2;
    ctx.save();
    ctx.translate(-92, 0);
    ctx.rotate(finSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-26, -30);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-26, 30);
    ctx.closePath();
    ctx.fillStyle = COLORS.catfishDark;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(-26, 0, 68, 31, 0, 0, TAU);
    ctx.fillStyle = COLORS.catfish;
    ctx.fill();
    ctx.strokeStyle = COLORS.catfishDark;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = 'rgba(95, 82, 68, 0.5)';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-70 + i * 26, -8 + (i % 2) * 14, 11, 7, 0, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = COLORS.catfishDark;
    ctx.beginPath();
    ctx.ellipse(-24, -26, 20, 11, -0.3 + finSwing * 0.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-30, 26, 16, 9, 0.3 - finSwing * 0.4, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(34, 0, 36, 30, 0, 0, TAU);
    ctx.fillStyle = COLORS.catfish;
    ctx.fill();
    ctx.strokeStyle = COLORS.catfishDark;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(64, 10, 14, 9, 0.2, 0, TAU);
    ctx.fillStyle = 'rgba(30, 24, 18, 0.85)';
    ctx.fill();

    ctx.strokeStyle = COLORS.catfishDark;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(66, -4 + i * 8);
      ctx.quadraticCurveTo(96, -22 + i * 16, 122, -6 + i * 10);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(44, -12, 3.2, 0, TAU);
    ctx.fillStyle = '#10233a';
    ctx.fill();

    ctx.restore();

    if (this.state === 'stunned') {
      ctx.save();
      ctx.translate(this.x, this.y - CATFISH.radius * 1.6);
      ctx.fillStyle = COLORS.accent;
      for (let i = 0; i < 3; i += 1) {
        const angle = this.age * 2.6 + (i * TAU) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 26, Math.sin(angle) * 9, 3.6, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
