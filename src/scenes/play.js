import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { Shark } from '../entities/shark.js';
import { Bubble } from '../entities/bubble.js';
import { Jellyfish } from '../entities/jellyfish.js';
import { Hud } from '../ui/hud.js';
import { ParticleSystem } from '../engine/particles.js';
import { circleOverlap } from '../engine/collision.js';
import { distance, rand } from '../engine/math.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import {
  COLORS,
  WATER_PALETTE,
  ROUND,
  STORAGE_KEY,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

export class PlayScene extends Scene {
  enter(params = {}) {
    this.params = params;
    this.empty = Boolean(params.empty);
    this.timeLimit = this.empty ? ROUND.emptyDuration : ROUND.duration;
    this.player = new Shark(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    this.bubbles = [];
    this.hazards = [];
    this.particles = new ParticleSystem();
    this.score = 0;
    this.best = loadJSON(STORAGE_KEY, 0);
    this.timeLeft = this.timeLimit;
    this.bubbleTimer = 0.4;
    this.hazardTimer = ROUND.hazardSpawnMin + 2;
    this.paused = false;
    this.flash = 0;
    this.shake = 0;
    this.time = 0;
    this.hud = new Hud();
    this.pauseMenu = new SelectList(
      [
        { label: 'RESUME', action: 'resume' },
        { label: 'RESTART', action: 'restart' },
        { label: 'QUIT TO MENU', action: 'menu' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.handlePauseAction(item.action),
      },
    );
    this.pauseMenu.reset();
  }

  hudState() {
    return {
      score: this.score,
      best: this.best,
      timeLeft: this.timeLeft,
      timeLimit: this.timeLimit,
      empty: this.empty,
    };
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('pause')) this.setPaused(!this.paused);
    if (this.paused) {
      this.pauseMenu.update(dt, input);
      return;
    }
    this.player.update(dt, input);
    this.hud.update(dt, this.hudState());
    this.updateSpawning(dt);
    this.updateEntities(dt);
    this.updateCollisions();
    this.updateTimer(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);
  }

  setPaused(paused) {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) this.pauseMenu.reset();
    this.game.audio.tone({ freq: paused ? 300 : 560, duration: 0.08, volume: 0.15 });
  }

  handlePauseAction(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.18 });
    if (action === 'resume') this.paused = false;
    else if (action === 'restart') this.game.changeScene('play', this.params);
    else if (action === 'menu') this.game.changeScene('menu');
  }

  updateSpawning(dt) {
    if (this.empty) return;
    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0 && this.bubbles.length < ROUND.maxBubbles) {
      this.bubbleTimer = rand(ROUND.bubbleSpawnMin, ROUND.bubbleSpawnMax);
      this.bubbles.push(new Bubble(rand(50, LOGICAL_WIDTH - 50), LOGICAL_HEIGHT + 26));
    }
    this.hazardTimer -= dt;
    if (this.hazardTimer <= 0 && this.hazards.length < ROUND.maxHazards) {
      this.hazardTimer = rand(ROUND.hazardSpawnMin, ROUND.hazardSpawnMax);
      let x = LOGICAL_WIDTH / 2;
      let y = LOGICAL_HEIGHT / 2;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        x = rand(80, LOGICAL_WIDTH - 80);
        y = rand(130, LOGICAL_HEIGHT - 130);
        if (distance(x, y, this.player.x, this.player.y) > ROUND.hazardSafeRadius) break;
      }
      this.hazards.push(new Jellyfish(x, y));
    }
  }

  updateEntities(dt) {
    this.bubbles = this.bubbles.filter((bubble) => {
      bubble.update(dt);
      return bubble.alive && bubble.y > -40;
    });
    this.hazards = this.hazards.filter((hazard) => {
      hazard.update(dt);
      return hazard.alive;
    });
    this.particles.update(dt);
  }

  updateCollisions() {
    for (const bubble of this.bubbles) {
      if (!bubble.alive) continue;
      if (circleOverlap(this.player, bubble)) {
        bubble.kill();
        this.score += ROUND.bubbleScore;
        this.timeLeft += ROUND.bubbleBonusTime;
        this.particles.burst(bubble.x, bubble.y, {
          count: 10,
          speed: 130,
          life: 0.55,
          colors: [COLORS.bubble, COLORS.foam, '#ffffff'],
          buoyancy: -40,
        });
        this.game.audio.tone({ freq: 480, endFreq: 900, type: 'triangle', duration: 0.11, volume: 0.25 });
      }
    }
    for (const hazard of this.hazards) {
      if (!hazard.alive) continue;
      if (this.player.invulnerable <= 0 && circleOverlap(this.player, hazard)) {
        const dx = this.player.x - hazard.x;
        const dy = this.player.y - hazard.y;
        const length = Math.hypot(dx, dy) || 1;
        this.player.vx += (dx / length) * ROUND.knockback;
        this.player.vy += (dy / length) * ROUND.knockback;
        this.player.invulnerable = ROUND.invulnerableTime;
        this.timeLeft -= ROUND.hazardPenaltyTime;
        this.flash = 0.6;
        this.shake = 0.5;
        this.particles.burst(this.player.x, this.player.y, {
          count: 16,
          speed: 220,
          life: 0.7,
          colors: [COLORS.danger, COLORS.jelly, '#ffd7dd'],
          buoyancy: -20,
        });
        this.game.audio.tone({ freq: 160, endFreq: 70, type: 'sawtooth', duration: 0.3, volume: 0.3 });
      }
    }
  }

  updateTimer(dt) {
    const before = Math.ceil(this.timeLeft);
    this.timeLeft -= dt;
    const after = Math.ceil(this.timeLeft);
    if (after !== before && after > 0 && after <= ROUND.lowTimeThreshold) {
      this.game.audio.tone({ freq: 720, type: 'square', duration: 0.06, volume: 0.1 });
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      const storedBest = loadJSON(STORAGE_KEY, 0);
      const isNewBest = this.score > storedBest;
      if (isNewBest) saveJSON(STORAGE_KEY, this.score);
      this.game.changeScene('gameover', {
        score: this.score,
        best: Math.max(storedBest, this.score),
        isNewBest,
        params: this.params,
      });
    }
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 7 * this.shake, rand(-1, 1) * 7 * this.shake);
    }
    for (const bubble of this.bubbles) bubble.render(ctx);
    for (const hazard of this.hazards) hazard.render(ctx);
    this.player.render(ctx);
    this.particles.render(ctx);
    ctx.restore();

    this.hud.render(ctx, this.hudState());

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.45})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.paused) this.renderPause(ctx);
  }

  renderPause(ctx) {
    ctx.fillStyle = 'rgba(4, 16, 29, 0.68)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const panelWidth = 420;
    const panelHeight = 330;
    const panelX = (LOGICAL_WIDTH - panelWidth) / 2;
    const panelY = (LOGICAL_HEIGHT - panelHeight) / 2;
    fillRoundRect(ctx, panelX, panelY, panelWidth, panelHeight, 24, 'rgba(10, 39, 64, 0.92)');
    strokeRoundRect(ctx, panelX, panelY, panelWidth, panelHeight, 24, 'rgba(207, 239, 255, 0.3)', 2);

    drawText(ctx, 'PAUSED', LOGICAL_WIDTH / 2, panelY + 70, {
      size: 44,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    this.pauseMenu.render(ctx, LOGICAL_WIDTH / 2, panelY + 210);
  }
}
