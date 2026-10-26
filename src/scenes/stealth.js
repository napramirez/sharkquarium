import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { resolveCircleRect } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { STEALTH, COLORS, CONTROLS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';
import { ArcticShrimp } from '../entities/arcticshrimp.js';
import { KelpCrab } from '../entities/kelpcrab.js';

const LANES = [120, 270, 420];
const GAP_HALF = 66;

export class StealthScene extends MinigameScene {
  buildRound() {
    this.covers = [];
    this.checkpoints = [760, 1520];
    let lane = 1;
    for (let x = 360; x < STEALTH.exitX - 200; x += 260) {
      this.covers.push({ x, w: STEALTH.coverWidth, gapY: LANES[lane % 3] });
      lane += 1;
    }
    this.seals = Array.from({ length: STEALTH.sealCount }, (_, index) => {
      const laneY = LANES[(index + 1) % 3];
      const min = 240 + index * 720;
      return {
        x: min + 160,
        y: laneY,
        min,
        max: min + 620,
        dir: 1,
        pause: rand(0, 1.2),
        phase: rand(0, TAU),
      };
    });
    this.players = [
      new ArcticShrimp(120, LOGICAL_HEIGHT / 2, {
        controls: CONTROLS.p1,
        pointer: true,
        maxX: STEALTH.width,
      }),
    ];
    if (!this.solo) {
      this.players.push(
        new KelpCrab(120, LOGICAL_HEIGHT * 0.62, {
          controls: CONTROLS.p2,
          pointer: false,
          maxX: STEALTH.width,
        }),
      );
    }
    this.lives = this.players.map(() => STEALTH.lives);
    this.spot = this.players.map(() => 0);
    this.checkpointIndex = this.players.map(() => 0);
    this.cameraX = 0;
  }

  losClear(ax, ay, bx, by) {
    for (const cover of this.covers) {
      const top = cover.gapY - GAP_HALF;
      const bottom = cover.gapY + GAP_HALF;
      const rects = [
        { x: cover.x, y: 0, w: cover.w, h: top },
        { x: cover.x, y: bottom, w: cover.w, h: LOGICAL_HEIGHT - bottom },
      ];
      for (const rect of rects) {
        for (let i = 1; i < 20; i += 1) {
          const t = i / 20;
          const px = ax + (bx - ax) * t;
          const py = ay + (by - ay) * t;
          if (
            px >= rect.x &&
            px <= rect.x + rect.w &&
            py >= rect.y &&
            py <= rect.y + rect.h
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  caught(index) {
    const player = this.players[index];
    this.lives[index] -= 1;
    this.spot[index] = 0;
    this.flash = Math.max(this.flash, 0.6);
    this.shake = Math.max(this.shake, 0.5);
    this.game.audio.tone({ freq: 160, endFreq: 70, type: 'square', duration: 0.35, volume: 0.3 });
    if (this.lives[index] <= 0) {
      this.finish(false);
      return;
    }
    const armed = this.checkpointIndex[index];
    const checkpointX = armed > 0 ? this.checkpoints[armed - 1] : 120;
    player.x = checkpointX;
    player.y = LOGICAL_HEIGHT / 2;
    player.vx = 0;
    player.vy = 0;
    player.invulnerable = 1.4;
    this.particles.burst(player.x, player.y, {
      count: 14,
      speed: 200,
      life: 0.6,
      colors: [COLORS.danger, '#ffffff'],
      buoyancy: -20,
    });
  }

  updateRound(dt, input) {
    const speed = this.rules.enemySpeed;
    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      player.update(dt, input);
      for (const cover of this.covers) {
        const top = cover.gapY - GAP_HALF;
        const bottom = cover.gapY + GAP_HALF;
        resolveCircleRect(player, { x: cover.x, y: 0, w: cover.w, h: top });
        resolveCircleRect(player, { x: cover.x, y: bottom, w: cover.w, h: LOGICAL_HEIGHT - bottom });
      }
      while (
        this.checkpointIndex[index] < this.checkpoints.length &&
        player.x >= this.checkpoints[this.checkpointIndex[index]]
      ) {
        this.checkpointIndex[index] += 1;
        this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.14, volume: 0.18 });
      }
    }
    for (const seal of this.seals) {
      if (seal.pause > 0) {
        seal.pause -= dt;
        if (seal.pause <= 0) seal.dir *= -1;
      } else {
        seal.x += seal.dir * STEALTH.sealSpeed * speed * dt;
        if (seal.x <= seal.min) {
          seal.x = seal.min;
          seal.pause = rand(0.7, 1.5);
        } else if (seal.x >= seal.max) {
          seal.x = seal.max;
          seal.pause = rand(0.7, 1.5);
        }
      }
    }
    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      if (player.x >= STEALTH.exitX) continue;
      let seen = false;
      for (const seal of this.seals) {
        const dx = player.x - seal.x;
        const dy = player.y - seal.y;
        const distance = Math.hypot(dx, dy);
        if (distance > STEALTH.visionRange) continue;
        if (Math.abs(seal.x - player.x) > STEALTH.visionRange) continue;
        const angle = Math.atan2(dy, dx);
        const facing = seal.dir > 0 ? 0 : Math.PI;
        let difference = Math.abs(angle - facing);
        difference = Math.min(difference, TAU - difference);
        if (difference > STEALTH.visionHalf) continue;
        if (!this.losClear(seal.x, seal.y, player.x, player.y)) continue;
        seen = true;
        break;
      }
      this.spot[index] = clamp(
        this.spot[index] + (seen ? STEALTH.detectRate * speed : -STEALTH.coolRate) * dt,
        0,
        1,
      );
      if (this.spot[index] >= 1) this.caught(index);
      if (this.phase !== 'play') return;
    }
    if (this.players.every((player) => player.x >= STEALTH.exitX)) {
      this.finish(true);
      return;
    }
    const focus =
      this.players.reduce((sum, player) => sum + player.x, 0) / Math.max(1, this.players.length);
    this.cameraX = clamp(focus - LOGICAL_WIDTH / 2, 0, STEALTH.width - LOGICAL_WIDTH);
  }

  renderSeal(ctx, seal) {
    const alert =
      this.players.some((player) => {
        const dx = player.x - seal.x;
        const dy = player.y - seal.y;
        return Math.hypot(dx, dy) < STEALTH.visionRange * 0.8;
      }) && seal.pause <= 0;
    ctx.save();
    ctx.translate(seal.x, seal.y);
    const facing = seal.dir >= 0 ? 1 : -1;
    ctx.save();
    ctx.scale(facing, 1);
    ctx.fillStyle = alert ? 'rgba(255, 107, 129, 0.16)' : 'rgba(207, 239, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.arc(0, 0, STEALTH.visionRange, -STEALTH.visionHalf, STEALTH.visionHalf);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.scale(facing, 1);
    ctx.fillStyle = '#93a3b1';
    ctx.beginPath();
    ctx.ellipse(-16, 0, 26, 15, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, -2, 13, 11, 0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#aebcc8';
    ctx.beginPath();
    ctx.moveTo(-30, -8);
    ctx.lineTo(-44, -16);
    ctx.lineTo(-38, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, 10);
    ctx.lineTo(6, 22);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(230, 240, 248, 0.8)';
    ctx.lineWidth = 1.2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(26, 2);
      ctx.lineTo(38, i * 5 + 4);
      ctx.stroke();
    }
    fillCircle(ctx, 20, -5, 3.4, '#f4fbff');
    fillCircle(ctx, 21, -5, 1.7, '#10233a');
    ctx.restore();
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    ctx.strokeStyle = 'rgba(207, 239, 255, 0.14)';
    ctx.lineWidth = 1.5;
    for (const lane of LANES) {
      ctx.beginPath();
      ctx.moveTo(0, lane);
      ctx.lineTo(STEALTH.width, lane);
      ctx.stroke();
    }
    for (const cover of this.covers) {
      const top = cover.gapY - GAP_HALF;
      const bottom = cover.gapY + GAP_HALF;
      ctx.fillStyle = 'rgba(90, 70, 51, 0.92)';
      ctx.fillRect(cover.x, 0, cover.w, top);
      ctx.fillRect(cover.x, bottom, cover.w, LOGICAL_HEIGHT - bottom);
      ctx.fillStyle = 'rgba(92, 122, 74, 0.35)';
      ctx.fillRect(cover.x, top - 14, cover.w, 14);
      ctx.fillRect(cover.x, bottom, cover.w, 14);
    }
    for (let index = 0; index < this.checkpoints.length; index += 1) {
      const x = this.checkpoints[index];
      const armed = Math.min(...this.checkpointIndex) > index;
      ctx.strokeStyle = armed ? COLORS.accent : 'rgba(207, 239, 255, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.lineTo(x, LOGICAL_HEIGHT - 60);
      ctx.stroke();
      fillCircle(ctx, x, 270, 8, armed ? COLORS.accent : 'rgba(207, 239, 255, 0.25)');
      drawText(ctx, `CP${index + 1}`, x, 44, {
        size: 11,
        color: armed ? COLORS.accent : COLORS.textDim,
      });
    }
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 5);
    ctx.strokeStyle = `rgba(163, 228, 138, ${0.5 + pulse * 0.4})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(STEALTH.exitX, 90);
    ctx.lineTo(STEALTH.exitX, LOGICAL_HEIGHT - 90);
    ctx.stroke();
    drawText(ctx, 'SURFACE', STEALTH.exitX, 64, {
      size: 13,
      color: '#a3e48a',
      glow: 'rgba(163, 228, 138, 0.5)',
      glowBlur: 12,
      alpha: 0.6 + pulse * 0.4,
    });
    for (const seal of this.seals) this.renderSeal(ctx, seal);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
    ctx.restore();
  }

  renderHud(ctx) {
    drawText(ctx, 'STEALTH DIVE', LOGICAL_WIDTH / 2, 34, {
      size: 18,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 12,
    });
    this.players.forEach((player, index) => {
      const x = index === 0 ? 24 : LOGICAL_WIDTH - 24;
      const align = index === 0 ? 'left' : 'right';
      drawText(ctx, `P${index + 1}`, x, 62, {
        size: 13,
        color: index === 0 ? COLORS.accent : COLORS.foam,
        align,
      });
      drawText(ctx, `${this.lives[index]} ${this.lives[index] === 1 ? 'CHANCE' : 'CHANCES'}`, x, 80, {
        size: 12,
        color: this.lives[index] > 0 ? COLORS.textDim : COLORS.danger,
        align,
      });
      const barWidth = 90;
      const barX = index === 0 ? x : x - barWidth;
      fillRoundRect(ctx, barX, 90, barWidth, 6, 3, 'rgba(4, 16, 29, 0.6)');
      fillRoundRect(
        ctx,
        barX,
        90,
        barWidth * clamp(this.spot[index], 0, 1),
        6,
        3,
        this.spot[index] > 0.6 ? COLORS.danger : COLORS.foam,
      );
    });
    drawText(ctx, 'SPOTTED', LOGICAL_WIDTH / 2, 96, { size: 10, color: COLORS.textDim, alpha: 0.7 });
    const progress = clamp(this.players[0].x / STEALTH.exitX, 0, 1);
    fillRoundRect(ctx, 220, 14, 520, 8, 4, 'rgba(4, 16, 29, 0.6)');
    fillRoundRect(ctx, 220, 14, 520 * progress, 8, 4, COLORS.accent);
    drawText(
      ctx,
      this.solo
        ? 'WASD — SWIM      STAY OUT OF THE SEAL CONES — REACH THE SURFACE LINE'
        : 'P1 — WASD      P2 — ARROWS      BOTH DIVERS MUST REACH THE SURFACE',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 12, color: COLORS.textDim, alpha: 0.75 },
    );
  }

  resultsTitle() {
    return 'STEALTH DIVE';
  }

  resultsHeadline() {
    return this.won ? 'SURFACED!' : 'CAUGHT IN THE OPEN';
  }

  resultsDetail() {
    return this.solo
      ? `CHANCES LEFT ${this.lives[0]}`
      : `P1 ${this.lives[0]} — P2 ${this.lives[1]} CHANCES`;
  }
}
