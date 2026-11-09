import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp, TAU } from '../engine/math.js';
import { drawSeasonRoom } from '../engine/seasonroom.js';
import { applyWardrobe } from '../engine/wardrobe.js';
import { drawSkinAura } from '../engine/skin.js';
import { drawTrail } from '../engine/trail.js';
import { drawCompanion } from '../engine/companion.js';
import { Shark } from '../entities/shark.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const FIELD = { x: 70, y: 170, w: 820, h: 310 };

export class JackHuntScene extends MinigameScene {
  buildRound() {
    this.phase = 'play';
    this.shark = new Shark(480, 440, { pointer: false });
    applyWardrobe(this.shop, 0);
    const spots = [
      [160, 260], [320, 220], [520, 250], [700, 230], [820, 320],
      [220, 400], [420, 360], [640, 410],
    ];
    this.lanterns = spots.map(([x, y], i) => ({ x, y, lit: false, seed: i }));
    this.ghosts = [];
    for (let i = 0; i < 4; i += 1) {
      this.ghosts.push({
        x: 120 + i * 220,
        y: 250 + (i % 2) * 120,
        vx: 0,
        vy: 0,
        phase: i * 1.7,
      });
    }
    this.timeLeft = 95;
    this.ghostCooldown = 0;
    this.flash = 0;
    this.status = 'LIGHT EVERY JACK-O\u2019-LANTERN';
    this.statusTimer = 3;
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2;
  }

  litCount() {
    return this.lanterns.filter((lantern) => lantern.lit).length;
  }

  updateRound(dt, input) {
    this.timeLeft -= dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.ghostCooldown = Math.max(0, this.ghostCooldown - dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shark.age += dt;

    const dx = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    const dy = (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1;
    const speed = 230;
    this.shark.x = clamp(this.shark.x + (dx / len) * speed * dt, FIELD.x + 26, FIELD.x + FIELD.w - 26);
    this.shark.y = clamp(this.shark.y + (dy / len) * speed * dt, FIELD.y + 26, FIELD.y + FIELD.h - 26);
    if (dx !== 0) this.shark.facing = dx > 0 ? 1 : -1;
    if (dx !== 0 || dy !== 0) this.shark.heading = Math.atan2(dy, dx);

    if (input.wasPressed('KeyE') || (input.pressed && input.pressed.has('PointerPrimary'))) {
      this.tryLight(input.pointer.x, input.pointer.y);
    }

    for (const ghost of this.ghosts) {
      const toX = this.shark.x - ghost.x;
      const toY = this.shark.y - ghost.y;
      const dist = Math.hypot(toX, toY) || 1;
      ghost.vx += (toX / dist) * 60 * dt;
      ghost.vy += (toY / dist) * 60 * dt;
      ghost.vx *= 1 - 1.2 * dt;
      ghost.vy *= 1 - 1.2 * dt;
      ghost.x += ghost.vx * dt;
      ghost.y += ghost.vy * dt;
      ghost.phase += dt * 3;
      if (this.ghostCooldown <= 0 && Math.hypot(ghost.x - this.shark.x, ghost.y - this.shark.y) < 30) {
        this.ghostCooldown = 1.6;
        this.flash = 0.7;
        const lit = this.lanterns.filter((lantern) => lantern.lit);
        if (lit.length > 0) {
          const snuffed = lit[Math.floor(Math.random() * lit.length)];
          snuffed.lit = false;
          this.setStatus('A GHOST SNUFFED A LANTERN!');
        }
        this.shark.x = clamp(this.shark.x + (this.shark.x - ghost.x) * 0.6, FIELD.x + 26, FIELD.x + FIELD.w - 26);
        this.shark.y = clamp(this.shark.y + (this.shark.y - ghost.y) * 0.6, FIELD.y + 26, FIELD.y + FIELD.h - 26);
        this.game.audio.tone({ freq: 200, endFreq: 90, type: 'sawtooth', duration: 0.2, volume: 0.2 });
      }
    }

    if (this.litCount() === this.lanterns.length) {
      this.finish(true);
      return;
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finish(false);
    }
  }

  tryLight(px, py) {
    let best = -1;
    let bestDist = 66;
    this.lanterns.forEach((lantern, i) => {
      if (lantern.lit) return;
      const dist = Math.hypot(lantern.x - this.shark.x, lantern.y - this.shark.y);
      const clickDist = Math.hypot(lantern.x - px, lantern.y - py);
      const use = Math.min(dist, clickDist);
      if (use < bestDist) {
        bestDist = use;
        best = i;
      }
    });
    if (best < 0) {
      this.setStatus('SWIM CLOSE TO A LANTERN AND PRESS E');
      return;
    }
    this.lanterns[best].lit = true;
    this.setStatus('LIT!');
    this.game.audio.tone({ freq: 520, endFreq: 780, type: 'triangle', duration: 0.14, volume: 0.2 });
    this.particles.burst(this.lanterns[best].x, this.lanterns[best].y, {
      count: 12,
      speed: 140,
      life: 0.5,
      colors: ['#ff9a3c', '#ffd166', '#ffffff'],
      buoyancy: -30,
    });
  }

  renderRound(ctx) {
    drawSeasonRoom(ctx, this.time, 'halloween');

    for (const lantern of this.lanterns) {
      const glow = lantern.lit ? 1 : 0.15;
      const r = 70;
      const grad = ctx.createRadialGradient(lantern.x, lantern.y, 4, lantern.x, lantern.y, r);
      grad.addColorStop(0, `rgba(255, 170, 60, ${0.35 * glow})`);
      grad.addColorStop(1, 'rgba(255, 170, 60, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lantern.x, lantern.y, r, 0, TAU);
      ctx.fill();
      drawPumpkin(ctx, lantern.x, lantern.y, lantern.lit, this.time, lantern.seed);
    }

    for (const ghost of this.ghosts) {
      drawGhostJelly(ctx, ghost, this.time);
    }

    this.shark.render(ctx);
    drawSkinAura(ctx, this.shark);
    drawTrail(ctx, this.shark);
    drawCompanion(ctx, this.shark);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(90, 40, 160, ${this.flash * 0.4})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }

    drawText(ctx, "JACK-O'-LANTERN HUNT", LOGICAL_WIDTH / 2, 40, {
      size: 28,
      color: COLORS.text,
      glow: '#ff9a3c',
      glowBlur: 20,
    });
    drawText(ctx, 'WASD — SWIM      E / CLICK — LIGHT A LANTERN (GET CLOSE)      AVOID THE GHOST JELLIES', LOGICAL_WIDTH / 2, 72, {
      size: 11,
      color: COLORS.foam,
      alpha: 0.85,
    });
    drawText(ctx, `${this.litCount()} / ${this.lanterns.length} LIT`, LOGICAL_WIDTH / 2, 96, {
      size: 13,
      color: COLORS.accent,
    });

    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 126, { size: 13, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    const ratio = Math.max(0, this.timeLeft / 95);
    fillRoundRect(ctx, 70, LOGICAL_HEIGHT - 34, LOGICAL_WIDTH - 140, 10, 5, 'rgba(4, 10, 20, 0.7)');
    fillRoundRect(ctx, 70, LOGICAL_HEIGHT - 34, (LOGICAL_WIDTH - 140) * ratio, 10, 5, ratio < 0.2 ? COLORS.danger : '#ff9a3c');
    drawText(ctx, `${Math.ceil(this.timeLeft)}s`, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 52, { size: 11, color: COLORS.textDim });
  }

  resultsTitle() {
    return "JACK-O'-LANTERN HUNT";
  }

  resultsHeadline() {
    return this.won ? 'EVERY LANTERN BURNS!' : 'THE DARK WINS';
  }

  resultsDetail() {
    return `${this.litCount()} / ${this.lanterns.length} LANTERNS LIT`;
  }
}

function drawPumpkin(ctx, x, y, lit, time, seed) {
  ctx.fillStyle = lit ? '#e8822c' : '#5a3a24';
  ctx.beginPath();
  ctx.ellipse(x, y, 26, 23, 0, 0, TAU);
  ctx.fill();
  if (lit) {
    ctx.fillStyle = 'rgba(255, 200, 90, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x - 11, y - 5, 8, 14, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = lit ? '#4a6b2a' : '#2e2016';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x + 3, y - 30);
  ctx.stroke();
  if (lit) {
    const flick = 0.75 + 0.25 * Math.sin(time * 9 + seed);
    ctx.fillStyle = `rgba(255, 214, 90, ${flick})`;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * 13, y - 6);
      ctx.lineTo(x + side * 7, y - 14);
      ctx.lineTo(x + side * 5, y - 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 7);
    ctx.lineTo(x - 4, y + 14);
    ctx.lineTo(x, y + 7);
    ctx.lineTo(x + 4, y + 14);
    ctx.lineTo(x + 12, y + 7);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#241608';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * 13, y - 6);
      ctx.lineTo(x + side * 7, y - 13);
      ctx.lineTo(x + side * 5, y - 4);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawGhostJelly(ctx, ghost, time) {
  const pulse = 1 + Math.sin(ghost.phase) * 0.08;
  const glow = ctx.createRadialGradient(ghost.x, ghost.y, 2, ghost.x, ghost.y, 34);
  glow.addColorStop(0, 'rgba(170, 140, 255, 0.32)');
  glow.addColorStop(1, 'rgba(170, 140, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(ghost.x, ghost.y, 34, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(210, 200, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(ghost.x, ghost.y - 4, 15 * pulse, Math.PI, TAU);
  ctx.lineTo(ghost.x + 15 * pulse, ghost.y + 14);
  for (let i = 0; i < 4; i += 1) {
    const wx = ghost.x + 15 * pulse - (i + 0.5) * 7.5 * pulse;
    ctx.lineTo(wx, ghost.y + (i % 2 === 0 ? 8 : 16));
  }
  ctx.lineTo(ghost.x - 15 * pulse, ghost.y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a1430';
  ctx.beginPath();
  ctx.arc(ghost.x - 5, ghost.y - 4, 2.2, 0, TAU);
  ctx.arc(ghost.x + 5, ghost.y - 4, 2.2, 0, TAU);
  ctx.fill();
}
