import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, lerp, lerpAngle, rand, TAU } from '../engine/math.js';
import { PUFFERBALL, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';
import { Shark } from '../entities/shark.js';

const IDLE_INPUT = { isDown: () => false, pointer: { down: false, dragX: 0, dragY: 0 } };

export class PufferballScene extends MinigameScene {
  buildRound() {
    this.spawnSharks([
      { x: LOGICAL_WIDTH * 0.3, y: LOGICAL_HEIGHT / 2 },
      { x: LOGICAL_WIDTH * 0.7, y: LOGICAL_HEIGHT / 2 },
    ]);
    this.cpu = null;
    if (this.solo) {
      this.cpu = new Shark(LOGICAL_WIDTH * 0.7, LOGICAL_HEIGHT / 2);
    }
    this.scores = [0, 0];
    this.winner = -1;
    this.ball = { x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT / 2, vx: 0, vy: 0, spin: 0, flash: 0 };
    this.serveTimer = PUFFERBALL.serveDelay;
    this.kickCooldown = [0, 0, 0];
    this.cpuAngle = null;
    this.cpuRetreat = 0;
    this.pressTime = 0;
    this.goalFlash = [0, 0];
  }

  mouth() {
    return {
      top: LOGICAL_HEIGHT / 2 - PUFFERBALL.goalHalf,
      bottom: LOGICAL_HEIGHT / 2 + PUFFERBALL.goalHalf,
    };
  }

  goalBars(side) {
    const { top, bottom } = this.mouth();
    const thickness = PUFFERBALL.goalBar;
    const x =
      side === 0 ? PUFFERBALL.goalDepth - thickness : LOGICAL_WIDTH - PUFFERBALL.goalDepth;
    return [
      { x, y: -20, w: thickness, h: top + 20 },
      { x, y: bottom, w: thickness, h: LOGICAL_HEIGHT - bottom + 20 },
    ];
  }

  serve(direction) {
    this.ball.x = LOGICAL_WIDTH / 2;
    this.ball.y = LOGICAL_HEIGHT / 2;
    this.ball.vx = 210 * direction;
    this.ball.vy = rand(-70, 70);
    this.serveTimer = PUFFERBALL.serveDelay;
    this.cpuAngle = null;
    this.cpuRetreat = 0;
    this.pressTime = 0;
  }

  bounceRect(part, restitution = 1.7) {
    const ball = this.ball;
    const cx = clamp(ball.x, part.x, part.x + part.w);
    const cy = clamp(ball.y, part.y, part.y + part.h);
    let dx = ball.x - cx;
    let dy = ball.y - cy;
    let distance = Math.hypot(dx, dy);
    if (distance >= PUFFERBALL.ballRadius) return false;
    if (distance < 0.001) {
      const left = ball.x - part.x;
      const right = part.x + part.w - ball.x;
      const top = ball.y - part.y;
      const bottom = part.y + part.h - ball.y;
      const smallest = Math.min(left, right, top, bottom);
      if (smallest === left) {
        dx = -1;
        dy = 0;
      } else if (smallest === right) {
        dx = 1;
        dy = 0;
      } else if (smallest === top) {
        dx = 0;
        dy = -1;
      } else {
        dx = 0;
        dy = 1;
      }
      distance = 1;
    } else {
      dx /= distance;
      dy /= distance;
    }
    const push = PUFFERBALL.ballRadius - distance + 0.5;
    ball.x += dx * push;
    ball.y += dy * push;
    const dot = ball.vx * dx + ball.vy * dy;
    if (dot < 0) {
      ball.vx -= restitution * dot * dx;
      ball.vy -= restitution * dot * dy;
      ball.flash = Math.max(ball.flash, 0.14);
    }
    return true;
  }

  updateCpu(dt) {
    const cpu = this.cpu;
    const ball = this.ball;
    const goalX = -80;
    const goalY = LOGICAL_HEIGHT / 2;
    const baseAngle = Math.atan2(ball.y - goalY, ball.x - goalX);
    const standoff = (cpu.radius + PUFFERBALL.ballRadius) * 0.72;
    const player = this.players[0];
    const previous = this.cpuAngle ?? baseAngle;
    const offsets = [0, 0.55, -0.55, 1.15, -1.15, 1.8, -1.8, 2.5, -2.5];
    let bestAngle = null;
    let bestScore = -Infinity;
    for (const offset of offsets) {
      const angle = baseAngle + offset;
      const px = ball.x + Math.cos(angle) * standoff;
      const py = ball.y + Math.sin(angle) * standoff;
      if (px < 70 || px > LOGICAL_WIDTH - 70 || py < 60 || py > LOGICAL_HEIGHT - 60) continue;
      const blocked = this.goalBars(0).some(
        (bar) =>
          px > bar.x - 18 && px < bar.x + bar.w + 18 && py > bar.y - 18 && py < bar.y + bar.h + 18,
      );
      if (blocked) continue;
      let score = -Math.abs(offset) * 0.6;
      score -= Math.hypot(px - player.x, py - player.y) * 0.006;
      score -= Math.abs(angle - previous) * 0.4;
      if (score > bestScore) {
        bestScore = score;
        bestAngle = angle;
      }
    }
    const ballSpeed = Math.hypot(ball.vx, ball.vy);
    const contact =
      Math.hypot(ball.x - cpu.x, ball.y - cpu.y) <
      cpu.radius + PUFFERBALL.ballRadius + 4;
    this.pressTime = contact && ballSpeed < 60 ? this.pressTime + dt : 0;
    if (this.cpuRetreat > 0) {
      this.cpuRetreat = Math.max(0, this.cpuRetreat - dt);
    } else if (this.pressTime > 0.4) {
      this.cpuRetreat = 0.5;
      this.pressTime = 0;
      this.cpuAngle = null;
    }
    let targetX;
    let targetY;
    if (this.cpuRetreat > 0) {
      targetX = ball.x + Math.cos(baseAngle) * (standoff + 96);
      targetY = ball.y + Math.sin(baseAngle) * (standoff + 96);
    } else {
      const angle = bestAngle ?? baseAngle;
      this.cpuAngle = angle;
      targetX = ball.x + Math.cos(angle) * standoff;
      targetY = ball.y + Math.sin(angle) * standoff;
    }
    const beforeX = cpu.x;
    const beforeY = cpu.y;
    cpu.update(dt, IDLE_INPUT);
    cpu.x = beforeX;
    cpu.y = beforeY;
    const dx = targetX - cpu.x;
    const dy = targetY - cpu.y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed =
      cpu.maxSpeed * PUFFERBALL.cpuSpeed * this.rules.enemySpeed * clamp(distance / 26, 0.4, 1);
    const ease = 1 - Math.exp(-7 * dt);
    cpu.vx = lerp(cpu.vx, (dx / distance) * speed, ease);
    cpu.vy = lerp(cpu.vy, (dy / distance) * speed, ease);
    cpu.x = clamp(cpu.x + cpu.vx * dt, cpu.radius, LOGICAL_WIDTH - cpu.radius);
    cpu.y = clamp(cpu.y + cpu.vy * dt, cpu.radius, LOGICAL_HEIGHT - cpu.radius);
    if (Math.hypot(cpu.vx, cpu.vy) > 30) {
      cpu.heading = lerpAngle(
        cpu.heading,
        Math.atan2(cpu.vy, cpu.vx),
        1 - Math.exp(-9 * dt),
      );
    }
  }

  kick(entity, index) {
    const cooldown = index >= 0 ? this.kickCooldown[index] : this.kickCooldown[2];
    if (cooldown > 0) return;
    if (!circleOverlap(entity, { ...this.ball, radius: PUFFERBALL.ballRadius })) return;
    const dx = this.ball.x - entity.x;
    const dy = this.ball.y - entity.y;
    const length = Math.hypot(dx, dy) || 1;
    const approach = entity.vx * dx + entity.vy * dy;
    if (approach < -30) return;
    const speed = Math.max(
      PUFFERBALL.ballSpeed * (0.85 + this.rules.enemySpeed * 0.1),
      Math.hypot(entity.vx, entity.vy) * 1.3,
    );
    const push = entity.radius + PUFFERBALL.ballRadius + 2;
    this.ball.x = entity.x + (dx / length) * push;
    this.ball.y = entity.y + (dy / length) * push;
    this.ball.vx = (dx / length) * speed;
    this.ball.vy = (dy / length) * speed;
    this.ball.flash = 0.22;
    if (index >= 0) this.kickCooldown[index] = 0.16;
    else this.kickCooldown[2] = 0.16;
    this.particles.burst(this.ball.x, this.ball.y, {
      count: 8,
      speed: 180,
      life: 0.4,
      colors: [COLORS.puffer, COLORS.pufferSpike, '#ffffff'],
      buoyancy: -20,
    });
    this.game.audio.tone({ freq: 320 + rand(0, 120), duration: 0.06, volume: 0.16 });
  }

  goal(scorer) {
    this.scores[scorer] += 1;
    this.goalFlash[scorer] = 0.6;
    this.flash = 0.5;
    this.shake = 0.5;
    this.game.audio.tone({ freq: 392, type: 'triangle', duration: 0.2, volume: 0.24 });
    this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.24, volume: 0.24, delay: 0.16 });
    if (this.scores[scorer] >= PUFFERBALL.goals) {
      this.winner = scorer;
      this.finish(this.solo ? scorer === 0 : true);
      return;
    }
    this.serve(scorer === 0 ? -1 : 1);
  }

  updateRound(dt, input) {
    for (let index = 0; index < this.kickCooldown.length; index += 1) {
      this.kickCooldown[index] = Math.max(0, this.kickCooldown[index] - dt);
    }
    this.goalFlash = this.goalFlash.map((timer) => Math.max(0, timer - dt * 2));
    this.ball.flash = Math.max(0, this.ball.flash - dt * 3);
    if (this.serveTimer > 0) {
      this.serveTimer -= dt;
      this.updatePlayers(dt, input);
      if (this.cpu) this.updateCpu(dt);
      return;
    }
    this.updatePlayers(dt, input);
    if (this.cpu) this.updateCpu(dt);

    const ball = this.ball;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.spin += dt * 4;
    if (ball.y < PUFFERBALL.ballRadius) {
      ball.y = PUFFERBALL.ballRadius;
      ball.vy = Math.abs(ball.vy);
    } else if (ball.y > LOGICAL_HEIGHT - PUFFERBALL.ballRadius) {
      ball.y = LOGICAL_HEIGHT - PUFFERBALL.ballRadius;
      ball.vy = -Math.abs(ball.vy);
    }
    if (ball.x < PUFFERBALL.ballRadius) {
      ball.x = PUFFERBALL.ballRadius;
      ball.vx = Math.abs(ball.vx);
    } else if (ball.x > LOGICAL_WIDTH - PUFFERBALL.ballRadius) {
      ball.x = LOGICAL_WIDTH - PUFFERBALL.ballRadius;
      ball.vx = -Math.abs(ball.vx);
    }
    for (const side of [0, 1]) {
      for (const bar of this.goalBars(side)) this.bounceRect(bar);
    }
    if (ball.x < PUFFERBALL.goalDepth - 14) {
      this.goal(1);
      return;
    }
    if (ball.x > LOGICAL_WIDTH - PUFFERBALL.goalDepth + 14) {
      this.goal(0);
      return;
    }
    for (let index = 0; index < this.players.length; index += 1) {
      this.kick(this.players[index], index);
    }
    if (this.cpu && this.cpuRetreat <= 0) this.kick(this.cpu, -1);
  }

  drawBall(ctx) {
    const ball = this.ball;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.spin);
    const spikes = ball.flash > 0 ? 10 : 7;
    ctx.fillStyle = COLORS.puffer;
    ctx.beginPath();
    ctx.arc(0, 0, PUFFERBALL.ballRadius, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = COLORS.pufferSpike;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < spikes; i += 1) {
      const angle = (i / spikes) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * PUFFERBALL.ballRadius, Math.sin(angle) * PUFFERBALL.ballRadius);
      ctx.lineTo(
        Math.cos(angle) * (PUFFERBALL.ballRadius + 7),
        Math.sin(angle) * (PUFFERBALL.ballRadius + 7),
      );
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, PUFFERBALL.ballRadius, 0, TAU);
    ctx.stroke();
    ctx.restore();
    fillCircle(ctx, ball.x - 5, ball.y - 6, 3, '#10233a');
    fillCircle(ctx, ball.x + 5, ball.y - 6, 3, '#10233a');
  }

  renderGoal(ctx, side) {
    const { top, bottom } = this.mouth();
    const depth = PUFFERBALL.goalDepth;
    const left = side === 0;
    const pocketX = left ? 0 : LOGICAL_WIDTH - depth;
    const backX = left ? 0 : LOGICAL_WIDTH;
    ctx.fillStyle = 'rgba(8, 20, 30, 0.72)';
    ctx.fillRect(pocketX, top, depth, bottom - top);
    ctx.strokeStyle = 'rgba(207, 239, 255, 0.28)';
    ctx.lineWidth = 1.5;
    for (let x = pocketX + 12; x < pocketX + depth; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    for (let y = top; y <= bottom; y += 14) {
      ctx.beginPath();
      ctx.moveTo(pocketX, y);
      ctx.lineTo(pocketX + depth, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(207, 239, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(backX, top);
    ctx.lineTo(backX, bottom);
    ctx.stroke();
    const glow = 0.45 + 0.35 * Math.sin(this.time * 6) + this.goalFlash[side] * 2;
    const barX = left ? PUFFERBALL.goalDepth - PUFFERBALL.goalBar / 2 : LOGICAL_WIDTH - PUFFERBALL.goalDepth + PUFFERBALL.goalBar / 2;
    ctx.strokeStyle = left
      ? `rgba(255, 209, 102, ${clamp(glow, 0.2, 1)})`
      : `rgba(143, 208, 239, ${clamp(glow, 0.2, 1)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(barX, top - 8);
    ctx.lineTo(barX, bottom + 8);
    ctx.stroke();
    for (const bar of this.goalBars(side)) {
      ctx.fillStyle = 'rgba(38, 54, 70, 0.95)';
      ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
      ctx.strokeStyle = 'rgba(207, 239, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(bar.x, bar.y, bar.w, bar.h);
    }
  }

  renderRound(ctx) {
    ctx.strokeStyle = 'rgba(207, 239, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.moveTo(LOGICAL_WIDTH / 2, 0);
    ctx.lineTo(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    this.renderGoal(ctx, 0);
    this.renderGoal(ctx, 1);
    this.renderPlayers(ctx);
    if (this.cpu) {
      this.cpu.render(ctx);
      drawText(ctx, 'CPU', this.cpu.x, this.cpu.y - 40, {
        size: 12,
        color: COLORS.foam,
        alpha: 0.75,
      });
    }
    this.drawBall(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    drawText(ctx, `${this.scores[0]}`, 300, 56, {
      size: 34,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.5)',
      glowBlur: 14,
    });
    drawText(ctx, `${this.scores[1]}`, 660, 56, {
      size: 34,
      color: COLORS.foam,
      glow: 'rgba(143, 208, 239, 0.5)',
      glowBlur: 14,
    });
    drawText(ctx, 'P1', 300, 84, { size: 12, color: COLORS.textDim, align: 'center' });
    drawText(ctx, this.solo ? 'CPU' : 'P2', 660, 84, {
      size: 12,
      color: COLORS.textDim,
      align: 'center',
    });
    drawText(ctx, `FIRST TO ${PUFFERBALL.goals}`, LOGICAL_WIDTH / 2, 40, {
      size: 15,
      color: COLORS.text,
      alpha: 0.9,
    });
    if (this.serveTimer > 0) {
      drawText(ctx, 'SERVE!', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 60, {
        size: 26,
        color: COLORS.accent,
        glow: 'rgba(255, 209, 102, 0.5)',
        glowBlur: 16,
        alpha: 0.9,
      });
    }
    drawText(
      ctx,
      this.solo
        ? 'WASD — MOVE      THREAD THE TINY GOAL SLOT PAST THE CPU'
        : 'P1 — WASD      P2 — ARROWS      ONLY THE GOAL SLOT SCORES',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 12, color: COLORS.textDim, alpha: 0.75 },
    );
  }

  resultsTitle() {
    return 'PUFFER BALL';
  }

  resultsHeadline() {
    if (this.solo) return this.winner === 0 ? 'YOU WIN!' : 'CPU WINS';
    return `P${this.winner + 1} WINS`;
  }

  resultsDetail() {
    const right = this.solo ? 'CPU' : 'P2';
    return `P1 ${this.scores[0]} — ${this.scores[1]} ${right}`;
  }
}
