import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { ROUNDUP, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';
import { Jellyfish } from '../entities/jellyfish.js';

const SCHOOL_COLORS = ['#ffd166', '#7bdff2', '#ff9aa8', '#a3e48a'];

export class RoundupScene extends MinigameScene {
  enter(params = {}) {
    super.enter({ ...params, solo: true });
  }

  makeSchool(seedX) {
    const hue = SCHOOL_COLORS[this.schoolId % SCHOOL_COLORS.length];
    this.schoolId += 1;
    return {
      x: seedX,
      y: rand(130, LOGICAL_HEIGHT - 130),
      vx: rand(-20, 20),
      vy: rand(-16, 16),
      netTimer: 0,
      respawn: 0,
      phase: rand(0, TAU),
      color: hue,
      members: Array.from({ length: ROUNDUP.members }, () => ({
        ox: rand(-46, 46),
        oy: rand(-34, 34),
        phase: rand(0, TAU),
      })),
    };
  }

  buildRound() {
    this.spawnSharks([{ x: LOGICAL_WIDTH * 0.4, y: LOGICAL_HEIGHT / 2 }]);
    this.schoolId = 0;
    this.schools = [];
    for (let i = 0; i < ROUNDUP.schools; i += 1) {
      this.schools.push(this.makeSchool(rand(470, 880)));
    }
    this.jellies = Array.from(
      { length: 3 },
      () => new Jellyfish(rand(240, 800), rand(110, LOGICAL_HEIGHT - 120)),
    );
    this.score = 0;
    this.stun = 0;
  }

  stunPlayer() {
    if (this.stun > 0) return;
    this.stun = ROUNDUP.stun;
    const player = this.players[0];
    player.vx = rand(-1, 1) * 260;
    player.vy = rand(0.2, 1) * 220;
    this.flash = Math.max(this.flash, 0.4);
    this.shake = Math.max(this.shake, 0.35);
    this.particles.burst(player.x, player.y, {
      count: 12,
      speed: 200,
      life: 0.5,
      colors: [COLORS.jelly, '#ffffff'],
      buoyancy: 0,
    });
    this.game.audio.tone({ freq: 150, endFreq: 70, type: 'square', duration: 0.25, volume: 0.25 });
  }

  updateRound(dt, input) {
    const player = this.players[0];
    if (this.stun > 0) {
      this.stun = Math.max(0, this.stun - dt);
      player.vx *= 1 - 4 * dt;
      player.vy *= 1 - 4 * dt;
      player.x = clamp(player.x + player.vx * dt, player.radius, LOGICAL_WIDTH - player.radius);
      player.y = clamp(player.y + player.vy * dt, player.radius, LOGICAL_HEIGHT - player.radius);
    } else {
      player.update(dt, input);
    }
    const fleeSpeed = ROUNDUP.fleeSpeed * this.rules.enemySpeed;
    for (const school of this.schools) {
      if (school.respawn > 0) {
        school.respawn -= dt;
        if (school.respawn <= 0) {
          school.x = rand(470, 880);
          school.y = rand(130, LOGICAL_HEIGHT - 130);
          school.vx = 0;
          school.vy = 0;
          school.netTimer = 0;
        }
        continue;
      }
      const dx = school.x - player.x;
      const dy = school.y - player.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < ROUNDUP.fleeRadius) {
        school.vx += (dx / distance) * fleeSpeed * 2.4 * dt;
        school.vy += (dy / distance) * fleeSpeed * 2.4 * dt;
      } else {
        school.vx += Math.cos(this.time * 0.6 + school.phase) * ROUNDUP.driftSpeed * dt;
        school.vy += Math.sin(this.time * 0.5 + school.phase) * ROUNDUP.driftSpeed * dt;
      }
      const speed = Math.hypot(school.vx, school.vy);
      if (speed > fleeSpeed) {
        school.vx = (school.vx / speed) * fleeSpeed;
        school.vy = (school.vy / speed) * fleeSpeed;
      }
      school.vx *= 1 - 0.8 * dt;
      school.vy *= 1 - 0.8 * dt;
      school.x = clamp(school.x + school.vx * dt, 70, LOGICAL_WIDTH - 90);
      school.y = clamp(school.y + school.vy * dt, 90, LOGICAL_HEIGHT - 90);
      const inNet =
        school.x < ROUNDUP.netX && Math.abs(school.y - LOGICAL_HEIGHT / 2) < ROUNDUP.netHalf;
      school.netTimer = inNet ? school.netTimer + dt : 0;
      if (inNet && school.netTimer > 0.55) {
        this.score += 1;
        school.respawn = 1.6;
        this.particles.burst(school.x, school.y, {
          count: 18,
          speed: 220,
          life: 0.6,
          colors: [school.color, COLORS.bubble, '#ffffff'],
          buoyancy: -30,
        });
        this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.14, volume: 0.2 });
        this.game.audio.tone({ freq: 659, type: 'triangle', duration: 0.18, volume: 0.2, delay: 0.1 });
        if (this.score >= ROUNDUP.target) {
          this.finish(true);
          return;
        }
      }
    }
    for (const jelly of this.jellies) {
      jelly.update(dt);
      if (circleOverlap(player, jelly)) this.stunPlayer();
    }
    if (this.elapsed >= ROUNDUP.duration) {
      this.finish(this.score >= ROUNDUP.target);
    }
  }

  drawSchool(ctx, school) {
    for (const member of school.members) {
      const wobble = Math.sin(this.time * 4 + member.phase) * 4;
      const x = school.x + member.ox + wobble;
      const y = school.y + member.oy + Math.cos(this.time * 3 + member.phase) * 3;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = school.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 3.6, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-11, -4);
      ctx.lineTo(-11, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#10233a';
      ctx.beginPath();
      ctx.arc(3, -0.8, 1.1, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    if (school.respawn > 0) return;
    const near =
      Math.hypot(school.x - this.players[0].x, school.y - this.players[0].y) < ROUNDUP.fleeRadius;
    if (near) {
      ctx.strokeStyle = `rgba(255, 209, 102, ${0.25 + 0.2 * Math.sin(this.time * 8)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(school.x, school.y, 46, 0, TAU);
      ctx.stroke();
    }
  }

  renderRound(ctx) {
    ctx.fillStyle = 'rgba(207, 239, 255, 0.06)';
    ctx.fillRect(0, LOGICAL_HEIGHT / 2 - ROUNDUP.netHalf, ROUNDUP.netX, ROUNDUP.netHalf * 2);
    ctx.strokeStyle = 'rgba(207, 239, 255, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ROUNDUP.netX, LOGICAL_HEIGHT / 2 - ROUNDUP.netHalf);
    ctx.lineTo(ROUNDUP.netX, LOGICAL_HEIGHT / 2 + ROUNDUP.netHalf);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(207, 239, 255, 0.2)';
    ctx.lineWidth = 1.5;
    for (let y = LOGICAL_HEIGHT / 2 - ROUNDUP.netHalf; y <= LOGICAL_HEIGHT / 2 + ROUNDUP.netHalf; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ROUNDUP.netX, y);
      ctx.stroke();
    }
    for (let x = 0; x < ROUNDUP.netX; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, LOGICAL_HEIGHT / 2 - ROUNDUP.netHalf);
      ctx.lineTo(x, LOGICAL_HEIGHT / 2 + ROUNDUP.netHalf);
      ctx.stroke();
    }
    for (const school of this.schools) this.drawSchool(ctx, school);
    for (const jelly of this.jellies) jelly.render(ctx);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    drawText(ctx, `NETTED ${this.score}/${ROUNDUP.target}`, LOGICAL_WIDTH / 2, 48, {
      size: 20,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.45)',
      glowBlur: 12,
    });
    const left = Math.max(0, ROUNDUP.duration - this.elapsed);
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 150, 70, 300, 8, 4, 'rgba(4, 16, 29, 0.6)');
    fillRoundRect(
      ctx,
      LOGICAL_WIDTH / 2 - 150,
      70,
      300 * clamp(left / ROUNDUP.duration, 0, 1),
      8,
      4,
      left < 10 ? COLORS.danger : COLORS.accent,
    );
    if (this.stun > 0) {
      drawText(ctx, 'STUNG!', this.players[0].x, this.players[0].y - 42, {
        size: 14,
        color: COLORS.danger,
        alpha: 0.9,
      });
    }
    drawText(
      ctx,
      'WASD — SWIM      HERD THE SCHOOLS INTO THE NET — DODGE THE JELLYFISH',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 12, color: COLORS.textDim, alpha: 0.75 },
    );
  }

  resultsTitle() {
    return 'SCHOOL ROUNDUP';
  }

  resultsHeadline() {
    return this.won ? 'EVERY SCHOOL NETTED!' : "THE SCHOOLS GOT AWAY";
  }

  resultsDetail() {
    return `NETTED ${this.score} — TARGET ${ROUNDUP.target}`;
  }
}
