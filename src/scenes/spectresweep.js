import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillRoundRect, fillCircle } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { drawSeasonRoom } from '../engine/seasonroom.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const GRAVES = [130, 250, 370, 490, 610, 730, 850];
const APEX = 150;
const GOAL = 12;
const STRIKES = 3;

export class SpectreSweepScene extends MinigameScene {
  buildRound() {
    this.phase = 'play';
    this.spectres = [];
    this.spawnTimer = 0.5;
    this.banished = 0;
    this.strikes = 0;
    this.escaped = 0;
    this.timeLeft = 90;
    this.status = 'CLICK THE RISING SPECTRES — LEAVE THE FRIENDLY ONE ALONE';
    this.statusTimer = 3;
    this.flash = 0;
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 1.6;
  }

  updateRound(dt, input) {
    this.timeLeft -= dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(0.45, 0.85);
      const grave = GRAVES[Math.floor(Math.random() * GRAVES.length)];
      const friendly = Math.random() < 0.22;
      this.spectres.push({ x: grave, t: 0, life: rand(1.7, 2.4), friendly, gone: false });
    }

    for (const spectre of this.spectres) {
      spectre.t += dt / spectre.life;
      if (spectre.t >= 1) {
        if (!spectre.gone) {
          spectre.gone = true;
          if (!spectre.friendly) {
            this.escaped += 1;
            this.strikes += 1;
            this.flash = 0.6;
            this.setStatus('A SPECTRE ESCAPED!');
            this.game.audio.tone({ freq: 180, endFreq: 90, type: 'sawtooth', duration: 0.18, volume: 0.18 });
          }
        }
      }
    }
    this.spectres = this.spectres.filter((spectre) => !spectre.gone);

    if (input.pressed && input.pressed.has('PointerPrimary')) {
      this.handleClick(input.pointer.x, input.pointer.y);
    }

    if (this.strikes >= STRIKES) {
      this.finish(false);
      return;
    }
    if (this.banished >= GOAL) {
      this.finish(true);
      return;
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finish(false);
    }
  }

  spectreY(spectre) {
    const baseY = LOGICAL_HEIGHT - 70;
    const t = spectre.t;
    let f;
    if (t < 0.32) f = t / 0.32;
    else if (t < 0.6) f = 1;
    else f = Math.max(0, 1 - (t - 0.6) / 0.4);
    return baseY - APEX * f;
  }

  handleClick(x, y) {
    let hit = -1;
    let best = 40;
    this.spectres.forEach((spectre, index) => {
      const sy = this.spectreY(spectre);
      const dist = Math.hypot(spectre.x - x, sy - y);
      if (dist < best) {
        best = dist;
        hit = index;
      }
    });
    if (hit < 0) return;
    const spectre = this.spectres[hit];
    spectre.gone = true;
    if (spectre.friendly) {
      this.strikes += 1;
      this.flash = 0.7;
      this.setStatus('THAT ONE WAS FRIENDLY!');
      this.game.audio.tone({ freq: 200, endFreq: 100, type: 'triangle', duration: 0.2, volume: 0.2 });
      return;
    }
    this.banished += 1;
    this.setStatus('BANISHED!');
    this.game.audio.tone({ freq: 560, endFreq: 920, type: 'triangle', duration: 0.12, volume: 0.18 });
    this.particles.burst(spectre.x, this.spectreY(spectre), {
      count: 10,
      speed: 150,
      life: 0.45,
      colors: ['#d8d0ff', '#a88bff', '#ffffff'],
      buoyancy: -40,
    });
  }

  renderRound(ctx) {
    drawSeasonRoom(ctx, this.time, 'halloween');

    for (const x of GRAVES) drawGrave(ctx, x, LOGICAL_HEIGHT - 70);

    for (const spectre of this.spectres) {
      const y = this.spectreY(spectre);
      const alpha = clamp(0.3 + Math.min(spectre.t, 1 - spectre.t) * 2.4, 0.25, 0.95);
      drawSpectre(ctx, spectre.x, y, alpha, spectre.friendly, this.time);
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(120, 40, 160, ${this.flash * 0.4})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }

    drawText(ctx, 'SPECTRE SWEEP', LOGICAL_WIDTH / 2, 40, {
      size: 28,
      color: COLORS.text,
      glow: '#a88bff',
      glowBlur: 20,
    });
    drawText(ctx, 'LEFT-CLICK RISING SPECTRES — CLICKING THE FRIENDLY GHOSTFISH COSTS A STRIKE', LOGICAL_WIDTH / 2, 72, {
      size: 11,
      color: COLORS.foam,
      alpha: 0.85,
    });
    drawText(ctx, `BANISHED ${this.banished} / ${GOAL}`, 160, 110, { size: 14, color: COLORS.accent });
    drawText(ctx, `STRIKES ${this.strikes} / ${STRIKES}`, LOGICAL_WIDTH - 160, 110, {
      size: 14,
      color: this.strikes >= 2 ? COLORS.danger : COLORS.textDim,
    });
    drawText(ctx, 'FRIENDLY', 160, 132, { size: 10, color: '#9be564', alpha: 0.8 });

    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 150, { size: 13, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    const ratio = Math.max(0, this.timeLeft / 90);
    fillRoundRect(ctx, 70, LOGICAL_HEIGHT - 34, LOGICAL_WIDTH - 140, 10, 5, 'rgba(4, 10, 20, 0.7)');
    fillRoundRect(ctx, 70, LOGICAL_HEIGHT - 34, (LOGICAL_WIDTH - 140) * ratio, 10, 5, ratio < 0.2 ? COLORS.danger : '#a88bff');
    drawText(ctx, `${Math.ceil(this.timeLeft)}s`, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 52, { size: 11, color: COLORS.textDim });
  }

  resultsTitle() {
    return 'SPECTRE SWEEP';
  }

  resultsHeadline() {
    return this.won ? 'THE CRYPT IS CLEAR!' : 'OVERWHELMED';
  }

  resultsDetail() {
    return `${this.banished} BANISHED · ${this.strikes} STRIKES`;
  }
}

function drawGrave(ctx, x, baseY) {
  ctx.fillStyle = '#3a3448';
  ctx.beginPath();
  ctx.moveTo(x - 22, baseY);
  ctx.lineTo(x - 22, baseY - 40);
  ctx.arc(x, baseY - 40, 22, Math.PI, 0);
  ctx.lineTo(x + 22, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 16, 30, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(150, 140, 170, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, baseY - 52);
  ctx.lineTo(x, baseY - 30);
  ctx.moveTo(x - 8, baseY - 44);
  ctx.lineTo(x + 8, baseY - 44);
  ctx.stroke();
}

function drawSpectre(ctx, x, y, alpha, friendly, time) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const wob = Math.sin(time * 3 + x) * 4;
  if (friendly) {
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 40);
    glow.addColorStop(0, 'rgba(120, 240, 160, 0.4)');
    glow.addColorStop(1, 'rgba(120, 240, 160, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = friendly ? 'rgba(170, 255, 200, 0.85)' : 'rgba(220, 214, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(x + wob, y, 18, Math.PI, TAU);
  ctx.lineTo(x + 18 + wob, y + 20);
  for (let i = 0; i < 4; i += 1) {
    const wx = x + 18 + wob - (i + 0.5) * 9;
    ctx.lineTo(wx, y + (i % 2 === 0 ? 14 : 22));
  }
  ctx.lineTo(x - 18 + wob, y + 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a1430';
  ctx.beginPath();
  ctx.arc(x - 6 + wob, y - 2, 2.6, 0, TAU);
  ctx.arc(x + 6 + wob, y - 2, 2.6, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + wob, y + 8, 3.4, 0, TAU);
  ctx.fill();
  ctx.restore();
}
