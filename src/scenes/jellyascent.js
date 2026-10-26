import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { drawSkinAura } from '../engine/skin.js';
import { drawTrail } from '../engine/trail.js';
import { drawCompanion } from '../engine/companion.js';
import { applyWardrobe } from '../engine/wardrobe.js';
import { drawMoonJellyBody } from '../entities/moonjelly.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { JELLY_ASCENT, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const SHAFT_LEFT = 90;
const SHAFT_RIGHT = LOGICAL_WIDTH - 90;

export class JellyAscentScene extends MinigameScene {
  buildRound() {
    this.jelly = {
      x: LOGICAL_WIDTH / 2,
      y: LOGICAL_HEIGHT * 0.7,
      vx: 0,
      vy: 0,
      pulseTimer: 0,
      pulsePhase: 0,
      radius: 20,
    };
    this.rings = [];
    for (let i = 0; i < JELLY_ASCENT.rings; i += 1) {
      const gapX = rand(SHAFT_LEFT + 90, SHAFT_RIGHT - 90);
      this.rings.push({
        y: LOGICAL_HEIGHT - 120 - i * JELLY_ASCENT.ringSpacing,
        gapX,
        passed: false,
        updraft: i % 4 === 2,
        phase: rand(0, TAU),
      });
    }
    this.ringsPassed = 0;
    this.sinks = JELLY_ASCENT.sinks;
    this.cameraLift = 0;
    this.height = 0;
  }

  pulse() {
    const jelly = this.jelly;
    if (jelly.pulseTimer > 0) return;
    jelly.vy = -JELLY_ASCENT.pulse;
    jelly.pulseTimer = JELLY_ASCENT.cooldown;
    jelly.pulsePhase += 0.9;
    this.particles.burst(jelly.x, jelly.y + jelly.radius * 0.4, {
      count: 6,
      speed: 130,
      life: 0.4,
      colors: [COLORS.bubble, '#ffffff'],
      buoyancy: -90,
    });
    this.game.audio.tone({ freq: 260, endFreq: 420, type: 'triangle', duration: 0.12, volume: 0.16 });
  }

  sink() {
    this.sinks -= 1;
    this.flash = 0.6;
    this.shake = 0.5;
    this.particles.burst(this.jelly.x, this.jelly.y, {
      count: 14,
      speed: 200,
      life: 0.6,
      colors: [COLORS.jelly, '#ffffff'],
      buoyancy: 20,
    });
    this.game.audio.tone({ freq: 140, endFreq: 60, type: 'sawtooth', duration: 0.3, volume: 0.3 });
    if (this.sinks <= 0) {
      this.finish(false);
      return;
    }
    this.jelly.x = LOGICAL_WIDTH / 2;
    this.jelly.y = LOGICAL_HEIGHT * 0.8;
    this.jelly.vx = 0;
    this.jelly.vy = 0;
  }

  updateRound(dt, input) {
    const jelly = this.jelly;
    const horizontal =
      (input.isDown('right1') ? 1 : 0) - (input.isDown('left1') ? 1 : 0);
    let drift = horizontal;
    if (input.pointer.down && Math.abs(input.pointer.dragX) > 14) {
      drift = clamp(input.pointer.dragX / 60, -1, 1);
    }
    jelly.vx = drift * JELLY_ASCENT.drift;
    jelly.vy += JELLY_ASCENT.gravity * dt;
    jelly.pulseTimer = Math.max(0, jelly.pulseTimer - dt);
    jelly.pulsePhase += dt * 2.4;
    if (input.wasPressed('up1') || input.wasPressed('confirm')) this.pulse();
    if (input.isDown('up1') && jelly.pulseTimer <= 0) this.pulse();
    if (input.pointer.down) this.pulse();

    const scroll = JELLY_ASCENT.scrollSpeed * (0.8 + this.rules.enemySpeed * 0.2);
    for (const ring of this.rings) {
      ring.y += scroll * dt;
      const insideUpdraft =
        ring.updraft &&
        Math.abs(jelly.x - ring.gapX) < 60 &&
        ring.y > jelly.y - 260 &&
        ring.y < jelly.y + 40;
      if (insideUpdraft) jelly.vy -= JELLY_ASCENT.updraftPush * dt;
    }
    jelly.x = clamp(jelly.x + jelly.vx * dt, SHAFT_LEFT + jelly.radius, SHAFT_RIGHT - jelly.radius);
    jelly.y = clamp(jelly.y + jelly.vy * dt, -80, LOGICAL_HEIGHT + 100);
    this.height += Math.max(0, -jelly.vy) * dt * 0.1;

    for (const ring of this.rings) {
      if (ring.resolved) continue;
      if (ring.y < jelly.y - 6 || ring.y > jelly.y + jelly.radius * 1.4) continue;
      ring.resolved = true;
      if (Math.abs(jelly.x - ring.gapX) < 62) {
        ring.passed = true;
        this.ringsPassed += 1;
        this.particles.burst(jelly.x, ring.y, {
          count: 10,
          speed: 160,
          life: 0.5,
          colors: [COLORS.accent, '#ffffff'],
          buoyancy: -30,
        });
        this.game.audio.tone({ freq: 659, type: 'triangle', duration: 0.12, volume: 0.2 });
        if (this.ringsPassed >= JELLY_ASCENT.rings) {
          this.finish(true);
          return;
        }
      } else {
        jelly.vy = 160;
        this.flash = Math.max(this.flash, 0.35);
        this.game.audio.tone({ freq: 150, endFreq: 90, type: 'square', duration: 0.2, volume: 0.24 });
      }
    }
    if (jelly.y > LOGICAL_HEIGHT + 40) this.sink();
  }

  renderRing(ctx, ring) {
    const top = 34;
    const glow = ring.passed;
    ctx.fillStyle = glow ? 'rgba(255, 209, 102, 0.75)' : 'rgba(255, 143, 163, 0.8)';
    ctx.fillRect(SHAFT_LEFT, ring.y - top / 2, ring.gapX - 62 - SHAFT_LEFT, top);
    ctx.fillRect(ring.gapX + 62, ring.y - top / 2, SHAFT_RIGHT - (ring.gapX + 62), top);
    ctx.fillStyle = 'rgba(20, 26, 43, 0.5)';
    ctx.fillRect(SHAFT_LEFT, ring.y + top / 2 - 6, ring.gapX - 62 - SHAFT_LEFT, 6);
    ctx.fillRect(ring.gapX + 62, ring.y + top / 2 - 6, SHAFT_RIGHT - (ring.gapX + 62), 6);
    if (ring.updraft) {
      ctx.fillStyle = 'rgba(143, 208, 239, 0.12)';
      ctx.fillRect(ring.gapX - 40, ring.y - 220, 80, 240);
      ctx.strokeStyle = 'rgba(143, 208, 239, 0.3)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i += 1) {
        const y = ring.y - 190 + i * 70;
        ctx.beginPath();
        ctx.moveTo(ring.gapX - 18, y);
        ctx.lineTo(ring.gapX, y - 16);
        ctx.lineTo(ring.gapX + 18, y);
        ctx.stroke();
      }
    }
  }

  renderRound(ctx) {
    ctx.strokeStyle = 'rgba(207, 239, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(SHAFT_LEFT, 0);
    ctx.lineTo(SHAFT_LEFT, LOGICAL_HEIGHT);
    ctx.moveTo(SHAFT_RIGHT, 0);
    ctx.lineTo(SHAFT_RIGHT, LOGICAL_HEIGHT);
    ctx.stroke();
    for (const ring of this.rings) {
      if (ring.y > -140 && ring.y < LOGICAL_HEIGHT + 140) this.renderRing(ctx, ring);
    }
    const jelly = this.jelly;
    applyWardrobe(this.shop, 0);
    ctx.save();
    ctx.translate(jelly.x, jelly.y);
    ctx.rotate(clamp(jelly.vx / JELLY_ASCENT.drift, -1, 1) * 0.2);
    drawMoonJellyBody(ctx, jelly.radius, {
      age: this.time,
      pulsePhase: jelly.pulsePhase,
    });
    ctx.restore();
    drawSkinAura(ctx, jelly);
    drawTrail(ctx, jelly);
    drawCompanion(ctx, jelly);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    drawText(ctx, `RINGS ${this.ringsPassed}/${JELLY_ASCENT.rings}`, LOGICAL_WIDTH / 2, 44, {
      size: 18,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.45)',
      glowBlur: 12,
    });
    for (let i = 0; i < JELLY_ASCENT.sinks; i += 1) {
      fillCircle(ctx, LOGICAL_WIDTH / 2 - 30 + i * 30, 74, 8, i < this.sinks ? COLORS.jelly : 'rgba(207, 239, 255, 0.16)');
    }
    drawText(ctx, `${Math.floor(this.height)} m UP`, 46, 40, {
      size: 14,
      color: COLORS.textDim,
      align: 'left',
    });
    drawText(
      ctx,
      'WASD OR SPACE — PULSE      DRIFT THROUGH THE GAPS — RIDE THE UPDRAFTS',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 12, color: COLORS.textDim, alpha: 0.75 },
    );
  }

  resultsTitle() {
    return 'JELLY ASCENT';
  }

  resultsHeadline() {
    return this.won ? 'SURFACED!' : 'SANK BACK DOWN';
  }

  resultsDetail() {
    return `RINGS ${this.ringsPassed}/${JELLY_ASCENT.rings} — ${Math.floor(this.height)} m CLIMBED`;
  }
}
