import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import {
  drawWater,
  drawText,
  fillCircle,
  strokeCircle,
  fillRoundRect,
  strokeRoundRect,
} from '../engine/render.js';
import { clamp, lerp, rand } from '../engine/math.js';
import { Shark } from '../entities/shark.js';
import { Pufferfish } from '../entities/pufferfish.js';
import { setActiveSkin, setSkinClock, skinByKey, drawSkinAura } from '../engine/skin.js';
import { setActiveAccessory, accessoryByKey } from '../engine/accessory.js';
import { circleOverlap } from '../engine/collision.js';
import { ParticleSystem } from '../engine/particles.js';
import { loadJSON } from '../engine/storage.js';
import { recordMinigame } from '../engine/progress.js';
import {
  CONTROLS,
  PUFFER,
  SHOP_KEY,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  WATER_PALETTE,
} from '../config.js';

export class DodgeballScene extends Scene {
  enter() {
    this.time = 0;
    const shop = loadJSON(SHOP_KEY, {});
    this.skin = skinByKey(shop.skin);
    this.accessory = accessoryByKey(shop.accessory);
    this.resultsMenu = new SelectList(
      [
        { label: 'PLAY AGAIN', action: 'again' },
        { label: 'MINIGAMES', action: 'minigames' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 46,
        fontSize: 20,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.chooseResult(item.action),
      },
    );
    this.resetRound();
  }

  resetRound() {
    this.phase = 'play';
    this.elapsed = 0;
    this.lives = [PUFFER.lives, PUFFER.lives];
    this.invulnerable = [0, 0];
    this.puffers = [];
    this.spawnTimer = 1.2;
    this.winner = -1;
    this.reward = 0;
    this.flash = 0;
    this.shake = 0;
    this.particles = new ParticleSystem();
    this.players = [
      new Shark(LOGICAL_WIDTH * 0.35, LOGICAL_HEIGHT * 0.5, {
        controls: CONTROLS.p1,
        pointer: true,
      }),
      new Shark(LOGICAL_WIDTH * 0.65, LOGICAL_HEIGHT * 0.5, {
        controls: CONTROLS.p2,
        pointer: false,
      }),
    ];
    this.resultsMenu.reset();
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('minigames');
  }

  difficulty() {
    const ramp = clamp(this.elapsed / PUFFER.rampDuration, 0, 1);
    const endless = Math.max(0, this.elapsed - PUFFER.rampDuration) / PUFFER.rampDuration;
    const burst = Math.max(0, (ramp - 0.35) / 0.65);
    const aimed = Math.max(0, (ramp - 0.3) / 0.7);
    return {
      ramp,
      spawnScale: lerp(1, PUFFER.spawnFloor, ramp) / (1 + endless * PUFFER.endlessSpawn),
      speedScale: Math.min(
        PUFFER.speedCeiling,
        lerp(1, PUFFER.speedRamp, ramp) + endless * PUFFER.speedOvertime,
      ),
      chargeScale: Math.max(
        PUFFER.chargeFloor,
        lerp(1, PUFFER.chargeRamp, ramp) - endless * PUFFER.chargeOvertime,
      ),
      doubleChance: Math.min(
        PUFFER.doubleCeiling,
        lerp(0, PUFFER.doubleChance, burst) + endless * PUFFER.doubleOvertime,
      ),
      aimChance: Math.min(
        PUFFER.aimCeiling,
        lerp(0, PUFFER.aimChance, aimed) + endless * PUFFER.aimOvertime,
      ),
    };
  }

  spawnPuffer(diff = this.difficulty(), target = null) {
    this.puffers.push(
      new Pufferfish({
        speedScale: diff.speedScale,
        chargeScale: diff.chargeScale,
        target,
      }),
    );
  }

  hitPlayer(index, puffer) {
    const player = this.players[index];
    puffer.kill();
    this.lives[index] -= 1;
    this.invulnerable[index] = PUFFER.invulnerableTime;
    const dx = player.x - puffer.x;
    const dy = player.y - puffer.y;
    const length = Math.hypot(dx, dy) || 1;
    player.vx += (dx / length) * PUFFER.knockback;
    player.vy += (dy / length) * PUFFER.knockback;
    this.flash = 0.5;
    this.shake = 0.4;
    this.particles.burst(player.x, player.y, {
      count: 16,
      speed: 220,
      life: 0.6,
      colors: [COLORS.puffer, COLORS.pufferSpike, '#ffffff'],
      buoyancy: -20,
    });
    this.game.audio.tone({ freq: 140, endFreq: 60, type: 'sawtooth', duration: 0.3, volume: 0.3 });
    if (this.lives[index] <= 0) {
      this.phase = 'results';
      this.winner = this.lives[0] <= 0 && this.lives[1] <= 0 ? -1 : this.lives[0] <= 0 ? 1 : 0;
      this.reward = this.winner === -1 ? 0 : recordMinigame(true);
      this.resultsMenu.reset();
      this.game.audio.tone({ freq: 220, endFreq: 110, type: 'triangle', duration: 0.3, volume: 0.24 });
      this.game.audio.tone({ freq: 165, type: 'triangle', duration: 0.5, volume: 0.24, delay: 0.24 });
    }
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('minigames');
      return;
    }
    if (this.phase === 'results') {
      this.resultsMenu.update(dt, input);
      return;
    }
    this.elapsed += dt;
    const diff = this.difficulty();
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(PUFFER.spawnMin, PUFFER.spawnMax) * diff.spawnScale;
      if (Math.random() < diff.aimChance) {
        const mark = this.players[Math.floor(Math.random() * this.players.length)];
        this.spawnPuffer(diff, { x: mark.x + rand(-40, 40), y: mark.y + rand(-40, 40) });
      } else {
        this.spawnPuffer(diff);
      }
      if (Math.random() < diff.doubleChance) this.spawnPuffer(diff);
    }
    for (const player of this.players) player.update(dt, input);
    this.puffers = this.puffers.filter((puffer) => {
      puffer.update(dt);
      return puffer.alive && !puffer.gone;
    });
    for (let index = 0; index < this.players.length; index += 1) {
      this.invulnerable[index] = Math.max(0, this.invulnerable[index] - dt);
      this.players[index].invulnerable = this.invulnerable[index];
    }
    for (const puffer of this.puffers) {
      if (!puffer.alive || puffer.state !== 'fly') continue;
      for (let index = 0; index < this.players.length; index += 1) {
        if (this.invulnerable[index] > 0) continue;
        if (!circleOverlap(this.players[index], puffer)) continue;
        this.hitPlayer(index, puffer);
        break;
      }
    }
    this.particles.update(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);
  }

  render(ctx) {
    setActiveSkin(this.skin);
    setSkinClock(this.time);
    setActiveAccessory(this.accessory);
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 7 * this.shake, rand(-1, 1) * 7 * this.shake);
    }
    for (const puffer of this.puffers) puffer.render(ctx);
    for (const player of this.players) {
      player.render(ctx);
      drawSkinAura(ctx, player);
    }
    this.particles.render(ctx);
    ctx.restore();

    this.renderLives(ctx, 0, 34, 36);
    this.renderLives(ctx, 1, LOGICAL_WIDTH - 34, 36);
    drawText(ctx, 'P1', 34, 62, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.8,
    });
    drawText(ctx, 'P2', LOGICAL_WIDTH - 34, 62, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.8,
    });
    drawText(
      ctx,
      'P1 — WASD      P2 — ARROWS      DODGE THE PUFFERFISH — THREE HITS AND YOU ARE OUT',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 20,
      {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.75,
      },
    );

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.phase === 'results') this.renderResults(ctx);
  }

  renderLives(ctx, index, x, y) {
    for (let life = 0; life < PUFFER.lives; life += 1) {
      const iconX = x + (index === 0 ? life * 26 : -life * 26);
      const alive = this.lives[index] > life;
      fillCircle(
        ctx,
        iconX,
        y,
        9,
        alive ? COLORS.puffer : 'rgba(207, 239, 255, 0.14)',
      );
      strokeCircle(
        ctx,
        iconX,
        y,
        alive ? 12 : 9,
        alive ? COLORS.pufferSpike : 'rgba(207, 239, 255, 0.3)',
        alive ? 2 : 1.5,
      );
    }
  }

  renderResults(ctx) {
    fillRoundRect(ctx, 250, 80, 460, 340, 26, 'rgba(10, 39, 64, 0.94)');
    strokeRoundRect(ctx, 250, 80, 460, 340, 26, 'rgba(207, 239, 255, 0.3)', 2);
    drawText(ctx, 'KNOCKOUT!', LOGICAL_WIDTH / 2, 130, {
      size: 36,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.5)',
      glowBlur: 18,
    });
    const headline = this.winner === -1 ? 'DOUBLE KO' : `P${this.winner + 1} WINS`;
    drawText(ctx, headline, LOGICAL_WIDTH / 2, 178, {
      size: 22,
      color: COLORS.danger,
      alpha: 0.7 + 0.3 * Math.sin(this.time * 7),
    });
    drawText(
      ctx,
      `P1 ${this.lives[0]} ${this.lives[0] === 1 ? 'LIFE' : 'LIVES'} — P2 ${this.lives[1]} ${this.lives[1] === 1 ? 'LIFE' : 'LIVES'}`,
      LOGICAL_WIDTH / 2,
      220,
      {
        size: 14,
        color: COLORS.text,
        alpha: 0.85,
      },
    );
    drawText(
      ctx,
      this.reward > 0 ? `+${this.reward} SEA COINS` : 'DOUBLE KO — NO WIN BONUS',
      LOGICAL_WIDTH / 2,
      258,
      {
        size: 12,
        color: this.reward > 0 ? COLORS.accent : COLORS.textDim,
        alpha: 0.85,
      },
    );
    this.resultsMenu.render(ctx, LOGICAL_WIDTH / 2, 330);
  }
}
