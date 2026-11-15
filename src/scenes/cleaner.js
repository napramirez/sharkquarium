import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { circleOverlap } from '../engine/collision.js';
import { Shark } from '../entities/shark.js';
import { drawArcticShrimpBody } from '../entities/arcticshrimp.js';
import { drawMorayBody } from '../entities/eel.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import {
  CONTROLS,
  COLORS,
  EEL_VARIANTS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const LIVES = 3;
const TOP = 60;
const BOTTOM = LOGICAL_HEIGHT - 50;
const CLEAN_TIME = 2.2;

export class CleanerScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'cleaner';
  }

  buildRound() {
    this.phase = 'play';
    this.worldLength = 3600;
    this.startX = 220;
    this.exitZone = { x: this.worldLength - 240 };
    this.lives = LIVES;
    this.invuln = 0;
    this.cleaned = 0;
    this.cleaning = 0;
    this.status = 'CLEAN THE SHRIMP-BUBBLE MORAYS — DODGE THE MOUTH-BUBBLE HUNGRY ONES';
    this.statusTimer = 3.4;
    this.scareTimer = 0;
    this.scareReason = '';
    this.clients = [];
    for (let i = 0; i < 7; i += 1) {
      this.clients.push({
        x: this.startX + 380 + i * 470 + rand(-40, 40),
        y: rand(TOP + 70, BOTTOM - 70),
        radius: 34,
        variant: i % EEL_VARIANTS.length,
        hungry: i % 3 === 2,
        progress: 0,
        cleaned: false,
        phase: rand(0, TAU),
      });
    }
    this.cleanableCount = this.clients.filter((c) => !c.hungry).length;
    this.parasites = [];
    for (let i = 0; i < 12; i += 1) {
      this.parasites.push({
        x: this.startX + 300 + i * 280 + rand(-60, 60),
        y: rand(TOP + 40, BOTTOM - 40),
        radius: 14,
        dir: rand() < 0.5 ? -1 : 1,
        speed: rand(50, 110),
        phase: rand(0, TAU),
      });
    }
    this.lurker = {
      x: this.startX + 1600,
      y: LOGICAL_HEIGHT / 2,
      radius: 30,
      dir: 1,
      phase: rand(0, TAU),
    };
    const player = new Shark(this.startX, LOGICAL_HEIGHT / 2, { controls: CONTROLS.solo, pointer: true });
    player.maxX = this.worldLength;
    player.noIdleFlip = true;
    this.players = [player];
    this.player = player;
  }

  firstPersonActor() {
    return this.players[0] ?? null;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 130, endFreq: 50, type: 'square', duration: 0.35, volume: 0.26 });
    if (this.lives <= 0) {
      this.finish(false);
      return;
    }
    this.phase = 'scare';
    this.scareTimer = 1.4;
  }

  respawn() {
    const player = this.player;
    player.x = Math.max(this.startX, player.x - 260);
    player.y = LOGICAL_HEIGHT / 2;
    player.vx = 0;
    player.vy = 0;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'BACK TO THE STATION — KEEP CLEANING';
    this.statusTimer = 2;
  }

  updateRound(dt, input) {
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }
    const player = this.player;
    player.update(dt, input);
    player.x = clamp(player.x, 40, this.worldLength - player.radius);
    player.y = clamp(player.y, TOP + player.radius, BOTTOM - player.radius);
    this.camX = clamp(player.x - LOGICAL_WIDTH * 0.4, 0, Math.max(0, this.worldLength - LOGICAL_WIDTH));

    const cleaningKey = input.isDown('confirm');
    this.cleaning = 0;
    for (const c of this.clients) {
      c.phase += dt;
      if (c.cleaned) continue;
      const face = { x: c.x, y: c.y, radius: c.radius * 0.95 };
      const onFace = circleOverlap(player, face);
      if (c.hungry) {
        if (onFace && this.catchPlayer('THE HUNGRY MORAY SNAPPED YOU UP')) return;
        continue;
      }
      if (onFace && cleaningKey) {
        c.progress += dt / CLEAN_TIME;
        this.cleaning = c.progress;
        if (Math.random() < dt * 8) {
          this.particles.burst(c.x + rand(-16, 16), c.y + rand(-16, 16), {
            count: 1, speed: 30, life: 0.4, colors: ['#ffd7e6', '#a6ffd0'],
          });
        }
        if (c.progress >= 1) {
          c.cleaned = true;
          this.cleaned += 1;
          this.game.audio.tone({ freq: 520, endFreq: 880, type: 'triangle', duration: 0.14, volume: 0.18 });
          this.particles.burst(c.x, c.y, { count: 16, speed: 160, life: 0.6, colors: ['#a6ffd0', '#ffffff'] });
          this.status = `MORAYS CLEANED ${this.cleaned}/${this.cleanableCount}`;
          this.statusTimer = 1.6;
        }
      }
    }
    for (const p of this.parasites) {
      p.phase += dt;
      p.x += p.dir * p.speed * dt;
      if (p.x < 20 || p.x > this.worldLength - 20) p.dir *= -1;
      if (circleOverlap(player, p)) this.catchPlayer('A PARASITE BURROWED IN');
    }
    const l = this.lurker;
    l.phase += dt;
    l.dir = Math.sign(l.x - player.x) || 1;
    if (player.x < l.x - 500 || player.x > l.x + 500) {
      l.x += (player.x - l.x) * 0.4 * dt;
    }
    l.y += Math.sin(l.phase * 0.8) * 40 * dt;
    if (circleOverlap(player, l)) this.catchPlayer('THE LURKER CAUGHT YOU CLEANING');

    if (this.cleaned >= this.cleanableCount) {
      this.finish(true);
    }
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(-this.camX, 0);
    ctx.fillStyle = 'rgba(8, 30, 34, 0.5)';
    ctx.fillRect(this.camX - 40, TOP, LOGICAL_WIDTH + 80, BOTTOM - TOP);
    ctx.strokeStyle = 'rgba(120, 200, 180, 0.14)';
    ctx.lineWidth = 2;
    for (let x = Math.floor(this.camX / 160) * 160; x < this.camX + LOGICAL_WIDTH + 160; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, LOGICAL_HEIGHT);
      ctx.stroke();
    }
    for (const c of this.clients) this.renderClient(ctx, c);
    for (const c of this.clients) this.renderBubble(ctx, c);
    for (const p of this.parasites) this.renderParasite(ctx, p);
    this.renderLurker(ctx);
    this.renderShrimp(ctx);
    this.particles.render(ctx);
    ctx.restore();
    if (this.phase === 'scare') this.renderScare(ctx);
    else if (this.cleaning > 0) this.renderCleaningBar(ctx);
  }

  renderShrimp(ctx) {
    const player = this.player;
    const r = player.radius;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(player.facing >= 0 ? 1 : -1, 1);
    ctx.rotate(clamp(player.vy / 1400, -0.35, 0.35));
    drawArcticShrimpBody(ctx, r * 0.85, {
      age: this.time,
      armPhase: this.time * 9,
      speed: 200,
      bodyColor: 'rgba(255, 150, 80, 0.72)',
      shellLine: 'rgba(200, 110, 50, 0.5)',
      segmentColor: 'rgba(190, 90, 40, 0.4)',
      finColor: 'rgba(255, 170, 100, 0.72)',
      tailColor: 'rgba(255, 150, 80, 0.7)',
      legColor: 'rgba(255, 255, 255, 0.92)',
      antennaColor: 'rgba(255, 255, 255, 0.95)',
      stripe: '#e23b3b',
      stripe2: 'rgba(255, 255, 255, 0.95)',
    });
    ctx.restore();
  }

  renderCleaningBar(ctx) {
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 90, LOGICAL_HEIGHT - 60, 180, 12, 6, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 90, LOGICAL_HEIGHT - 60, 180 * this.cleaning, 12, 6, '#a6ffd0');
    drawText(ctx, 'CLEANING', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 72, { size: 11, color: '#a6ffd0' });
  }

  renderClient(ctx, c) {
    const r = c.radius;
    const bob = Math.sin(c.phase * 2) * 3;
    const jawOpen = c.cleaned ? 0.1 : 1.2 + Math.sin(c.phase * 2.3) * 0.2;

    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.scale(-1, 1);
    ctx.translate(-r * 1.2, 0);
    drawMorayBody(ctx, r, { age: this.time, phase: c.phase, jawOpen }, EEL_VARIANTS[(c.variant ?? 0) % EEL_VARIANTS.length]);
    ctx.restore();

    ctx.save();
    ctx.translate(c.x, c.y + bob);
    if (!c.cleaned && !c.hungry) {
      ctx.strokeStyle = `rgba(166, 255, 208, ${0.35 + 0.25 * Math.sin(this.time * 5)})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.95, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (!c.cleaned && c.progress > 0) {
      ctx.strokeStyle = '#a6ffd0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.2, -Math.PI / 2, -Math.PI / 2 + TAU * c.progress);
      ctx.stroke();
    }
    if (c.cleaned) {
      ctx.fillStyle = 'rgba(166, 255, 208, 0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  renderBubble(ctx, c) {
    const r = c.radius;
    const bob = Math.sin(c.phase * 2) * 3;
    const w = r * 1.7;
    const h = r * 1.15;
    ctx.save();
    ctx.translate(c.x, c.y + bob - r * 2.25);
    ctx.fillStyle = 'rgba(240, 250, 255, 0.92)';
    fillRoundRect(ctx, -w / 2, -h / 2, w, h, h * 0.42, 'rgba(240, 250, 255, 0.92)');
    ctx.beginPath();
    ctx.moveTo(-7, h / 2 - 2);
    ctx.lineTo(7, h / 2 - 2);
    ctx.lineTo(0, h / 2 + 12);
    ctx.closePath();
    ctx.fill();
    if (c.cleaned) {
      drawText(ctx, 'OK', 0, 0, { size: r * 0.5, color: '#2f7d5a' });
    } else if (c.hungry) {
      this.drawMouthIcon(ctx, r);
    } else {
      this.drawShrimpIcon(ctx, r);
    }
    ctx.restore();
  }

  drawShrimpIcon(ctx, r) {
    const s = r * 0.42;
    ctx.save();
    ctx.fillStyle = '#ff9a52';
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#e23b3b';
    ctx.lineWidth = s * 0.28;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s * 0.9, -s * 0.3);
    ctx.lineTo(-s * 0.9, -s * 0.3);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = s * 0.12;
    ctx.beginPath();
    ctx.moveTo(s * 0.9, -s * 0.3);
    ctx.lineTo(-s * 0.9, -s * 0.3);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(s * 0.8, 0);
    ctx.lineTo(s * 1.5, -s * 0.4);
    ctx.moveTo(s * 0.8, 0);
    ctx.lineTo(s * 1.5, s * 0.2);
    ctx.stroke();
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(s * 0.5, -s * 0.12, s * 0.1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawMouthIcon(ctx, r) {
    const s = r * 0.44;
    ctx.save();
    ctx.fillStyle = '#7a2f44';
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.quadraticCurveTo(0, -s * 0.9, s, 0);
    ctx.quadraticCurveTo(0, s * 0.9, -s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.5, -s * 0.2);
      ctx.lineTo(i * s * 0.5 + s * 0.16, -s * 0.2);
      ctx.lineTo(i * s * 0.5 + s * 0.08, s * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(i * s * 0.5, s * 0.2);
      ctx.lineTo(i * s * 0.5 + s * 0.16, s * 0.2);
      ctx.lineTo(i * s * 0.5 + s * 0.08, -s * 0.05);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  renderParasite(ctx, p) {
    const wig = Math.sin(p.phase * 6) * 3;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#b45a7a';
    ctx.beginPath();
    ctx.ellipse(0, 0, p.radius, p.radius * 0.7, wig * 0.05, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#e08aac';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 6, p.radius * 0.5);
      ctx.lineTo(i * 6 + wig, p.radius * 1.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderLurker(ctx) {
    const l = this.lurker;
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.scale(l.dir, 1);
    ctx.fillStyle = '#24333a';
    ctx.beginPath();
    ctx.ellipse(0, 0, l.radius * 1.8, l.radius, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-l.radius * 1.7, 0);
    ctx.lineTo(-l.radius * 2.6, -l.radius * 0.8);
    ctx.lineTo(-l.radius * 2.6, l.radius * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 90, 90, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, l.radius * (2.1 + 0.15 * Math.sin(this.time * 8)), 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#ffd966';
    ctx.beginPath();
    ctx.arc(l.radius * 0.9, -l.radius * 0.3, 4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.4, {
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        time: this.time,
        caption: 'OOPS — BACK TO THE STATION!',
        radius: 66,
      });
      return;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    const s = 1.3 + (1 - this.scareTimer / 1.4) * 1.6;
    ctx.scale(s, s);
    ctx.fillStyle = '#b45a7a';
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 24, Math.sin(a) * 24, 10, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE CLEANER STATION', LOGICAL_WIDTH / 2, 34, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(166, 255, 208, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 30, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < LIVES; i += 1) {
      fillCircle(ctx, 42 + i * 22, 52, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    drawText(ctx, `CLEANED ${this.cleaned}/${this.cleanableCount}`, LOGICAL_WIDTH - 24, 30, { size: 15, color: '#a6ffd0', align: 'right' });
    drawText(ctx, 'SHRIMP = CLEAN IT  ·  MOUTH = AVOID', LOGICAL_WIDTH - 24, 52, { size: 11, color: COLORS.textDim, align: 'right' });
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 66, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    drawText(ctx, 'WASD / DRAG — SWIM      SPACE — CLEAN (HOLD)      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.72,
    });
  }

  backScene() {
    return 'tanks';
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('tanks');
  }

  resultsTitle() {
    return 'THE CLEANER STATION';
  }

  resultsHeadline() {
    return this.won ? 'EVERY MORAY SERVED' : 'THE STATION WENT DARK';
  }

  resultsDetail() {
    return `${this.cleaned}/${this.cleanableCount} MORAYS CLEANED`;
  }
}
