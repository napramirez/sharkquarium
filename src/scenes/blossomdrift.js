import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { CONTROLS, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const TARGET = 18;
const LIVES = 3;
const BASKET_Y = LOGICAL_HEIGHT - 46;

export class BlossomDriftScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'blossomdrift';
  }

  buildRound() {
    this.phase = 'play';
    this.lives = LIVES;
    this.caught = 0;
    this.basketX = LOGICAL_WIDTH / 2;
    this.falling = [];
    this.spawnTimer = 0.4;
    this.status = 'CATCH THE BLOSSOMS — DODGE THE BEES';
    this.statusTimer = 3;
    this.scareTimer = 0;
    this.scareReason = '';
    this.players = [];
    this.player = { x: this.basketX, y: BASKET_Y, radius: 26 };
  }

  firstPersonActor() {
    return null;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play') return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.6;
    this.game.audio.tone({ freq: 150, endFreq: 60, type: 'sawtooth', duration: 0.35, volume: 0.24 });
    if (this.lives <= 0) {
      this.finish(false);
      return true;
    }
    this.phase = 'scare';
    this.scareTimer = 1.1;
    return true;
  }

  respawn() {
    this.basketX = LOGICAL_WIDTH / 2;
    this.falling = [];
    this.phase = 'play';
    this.flash = 0;
    this.shake = 0;
    this.status = 'SHAKE IT OFF — KEEP CATCHING';
    this.statusTimer = 1.6;
  }

  updateRound(dt, input) {
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }
    const left = input.isDown(CONTROLS.solo.left) ? 1 : 0;
    const right = input.isDown(CONTROLS.solo.right) ? 1 : 0;
    let dir = right - left;
    if (input.pointer.down) {
      dir = clamp((input.pointer.x - this.basketX) / 60, -1, 1);
    }
    this.basketX = clamp(this.basketX + dir * 420 * dt, 60, LOGICAL_WIDTH - 60);
    this.player.x = this.basketX;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(0.28, 0.6);
      const bee = Math.random() < 0.32;
      this.falling.push({
        x: rand(70, LOGICAL_WIDTH - 70),
        y: -20,
        vy: bee ? rand(190, 250) : rand(120, 175),
        bee,
        phase: rand(0, TAU),
      });
    }
    for (const item of this.falling) {
      item.phase += dt;
      item.y += item.vy * dt;
      item.x += item.bee ? Math.sin(item.phase * 4) * 40 * dt : Math.sin(item.phase * 2) * 16 * dt;
      if (!item.dead && item.y > BASKET_Y - 26 && item.y < BASKET_Y + 26 && Math.abs(item.x - this.basketX) < 40) {
        item.dead = true;
        if (item.bee) {
          if (this.catchPlayer('A BEE GOT IN THE BASKET')) return;
        } else {
          this.caught += 1;
          this.game.audio.tone({ freq: 620, endFreq: 900, type: 'triangle', duration: 0.1, volume: 0.16 });
          this.particles.burst(item.x, item.y, { count: 8, speed: 120, life: 0.4, colors: ['#ffc2e0', '#ffffff'] });
        }
      }
      if (item.y > LOGICAL_HEIGHT + 30) item.dead = true;
    }
    this.falling = this.falling.filter((item) => !item.dead);
    if (this.caught >= TARGET) this.finish(true);
  }

  renderRound(ctx) {
    ctx.fillStyle = 'rgba(30, 60, 70, 0.3)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    for (const item of this.falling) {
      if (item.bee) {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 8, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#2a2010';
        ctx.lineWidth = 3;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * 5, -7);
          ctx.lineTo(i * 5, 7);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.ellipse(-5, -7, 6, 4, -0.4, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.phase);
        ctx.fillStyle = '#ff9ecb';
        for (let i = 0; i < 5; i += 1) {
          ctx.beginPath();
          ctx.ellipse(Math.cos((i / 5) * TAU) * 7, Math.sin((i / 5) * TAU) * 7, 6, 4, 0, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#ffe0f0';
        fillCircle(ctx, 0, 0, 4, '#ffe0f0');
        ctx.restore();
      }
    }
    this.particles.render(ctx);
    // basket
    ctx.save();
    ctx.translate(this.basketX, BASKET_Y);
    ctx.fillStyle = '#a5755c';
    ctx.beginPath();
    ctx.moveTo(-44, -18);
    ctx.lineTo(44, -18);
    ctx.lineTo(32, 22);
    ctx.lineTo(-32, 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a5238';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(122, 82, 56, 0.7)';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 18, -18);
      ctx.lineTo(i * 12, 22);
      ctx.stroke();
    }
    ctx.restore();
    if (this.phase === 'scare') this.renderScare(ctx);
  }

  renderScare(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, { size: 18, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'BLOSSOM DRIFT', LOGICAL_WIDTH / 2, 34, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(255, 158, 203, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 30, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < LIVES; i += 1) {
      fillCircle(ctx, 42 + i * 22, 52, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    drawText(ctx, `BLOSSOMS ${this.caught}/${TARGET}`, LOGICAL_WIDTH - 24, 30, { size: 15, color: '#ff9ecb', align: 'right' });
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, (240 * this.caught) / TARGET, 10, 5, '#ff9ecb');
    if (this.statusTimer > 0) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 74, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    drawText(ctx, 'A / D OR DRAG — MOVE THE BASKET      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.72,
    });
  }

  backScene() {
    return 'minigames';
  }

  resultsTitle() {
    return 'BLOSSOM DRIFT';
  }

  resultsHeadline() {
    return this.won ? 'BASKET FULL OF BLOSSOMS' : 'THE BEES WON';
  }

  resultsDetail() {
    return `${this.caught} BLOSSOMS CAUGHT`;
  }
}
