import { MinigameScene } from '../engine/minigame.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, drawMotes, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { SwarmQueen } from '../entities/swarmqueen.js';
import { Swarmling } from '../entities/swarmling.js';
import { SWARM_QUEEN, SWARM_PALETTE, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class ReefQueenScene extends MinigameScene {
  enter(params = {}) {
    super.enter({ ...params, solo: !params.coop });
    this.resultsMenu = new SelectList(
      [
        { label: 'PLAY AGAIN', action: 'again' },
        { label: 'TANKS', action: 'tanks' },
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
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('tanks');
  }

  backScene() {
    return 'tanks';
  }

  finish(won) {
    this.phase = 'results';
    this.won = won;
    this.reward = 0;
    this.resultsMenu.reset();
    this.game.audio.tone({ freq: 220, endFreq: 110, type: 'triangle', duration: 0.3, volume: 0.24 });
    this.game.audio.tone({ freq: 165, type: 'triangle', duration: 0.5, volume: 0.24, delay: 0.24 });
  }

  firstPersonPalette() {
    return { top: SWARM_PALETTE.top, bottom: SWARM_PALETTE.bottom, wall: '#3f7a4a' };
  }

  firstPersonSprites() {
    return [...(this.players ?? []), this.queen, ...(this.swarmlings ?? [])].filter(Boolean);
  }

  buildRound() {
    this.spawnSharks([
      { x: LOGICAL_WIDTH * 0.5, y: LOGICAL_HEIGHT * 0.72 },
      { x: LOGICAL_WIDTH * 0.5, y: LOGICAL_HEIGHT * 0.6 },
    ]);
    this.players.forEach((player, index) => {
      player.invulnerable = SWARM_QUEEN.invulnerable;
      if (this.players.length > 1) player.x += index === 0 ? -46 : 46;
    });
    this.queen = new SwarmQueen();
    this.swarmlings = [];
    this.lives = SWARM_QUEEN.lives;
    this.hits = 0;
    this.popped = 0;
    this.phase = 'play';
  }

  spawnSwarm() {
    const count = SWARM_QUEEN.swarmlings + (this.queen.phase - 1) * 2;
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      this.swarmlings.push(
        new Swarmling(this.queen.x + Math.cos(angle) * 70, this.queen.y + Math.sin(angle) * 70),
      );
    }
    this.game.audio.tone({ freq: 90, endFreq: 40, type: 'sawtooth', duration: 0.5, volume: 0.26 });
  }

  loseLife(index) {
    const player = this.players[index];
    if (player.invulnerable > 0) return;
    this.lives -= 1;
    player.invulnerable = SWARM_QUEEN.invulnerable;
    player.vx = rand(-1, 1) * 340;
    player.vy = rand(-1, 1) * 340;
    this.flash = Math.max(this.flash, 0.7);
    this.shake = Math.max(this.shake, 0.7);
    this.particles.burst(player.x, player.y, {
      count: 18,
      speed: 260,
      life: 0.7,
      colors: [COLORS.danger, '#ffffff'],
      buoyancy: -20,
    });
    this.game.audio.tone({ freq: 140, endFreq: 60, type: 'square', duration: 0.35, volume: 0.3 });
    if (this.lives <= 0) this.finish(false);
  }

  checkRam(player) {
    if (this.queen.dead || !this.queen.vulnerable) return;
    const core = this.queen.corePosition();
    if (Math.hypot(player.vx, player.vy) < SWARM_QUEEN.ramSpeed) return;
    if (Math.hypot(player.x - core.x, player.y - core.y) > player.radius + this.queen.radius * 0.5) {
      return;
    }
    if (!this.queen.damage(1)) return;
    this.hits += 1;
    player.vx = -player.vx * 0.4;
    player.vy = -player.vy * 0.4;
    player.invulnerable = 0.5;
    this.flash = Math.max(this.flash, 0.5);
    this.shake = Math.max(this.shake, 0.6);
    this.particles.burst(core.x, core.y, {
      count: 22,
      speed: 300,
      life: 0.8,
      colors: [COLORS.accent, COLORS.octopusAlert, '#ffffff'],
      buoyancy: -30,
    });
    this.game.audio.tone({ freq: 320, endFreq: 640, type: 'square', duration: 0.22, volume: 0.3 });
  }

  updateRound(dt, input) {
    this.updatePlayers(dt, input);
    this.players.forEach((player) => {
      player.invulnerable = Math.max(0, player.invulnerable - dt);
      this.checkRam(player);
    });

    const wasSummon = this.queen.state === 'summon';
    this.queen.update(dt, this.players);
    if (wasSummon && this.queen.state !== 'summon') this.spawnSwarm();

    if (this.queen.dead) {
      if (this.queen.stateTimer <= 0) {
        this.finish(true);
        return;
      }
    } else {
      const body = this.queen.radius * 0.7;
      if (this.queen.state === 'charge') {
        for (let index = 0; index < this.players.length; index += 1) {
          const player = this.players[index];
          if (Math.hypot(player.x - this.queen.x, player.y - this.queen.y) < body) {
            this.loseLife(index);
          }
        }
      }
      for (const slug of this.swarmlings) {
        let target = this.players[0];
        let best = Infinity;
        for (const player of this.players) {
          const distance = Math.hypot(player.x - slug.x, player.y - slug.y);
          if (distance < best) {
            best = distance;
            target = player;
          }
        }
        slug.speed = SWARM_QUEEN.swarmlingSpeed;
        slug.update(dt, target);
        for (let index = 0; index < this.players.length; index += 1) {
          const player = this.players[index];
          const distance = Math.hypot(player.x - slug.x, player.y - slug.y);
          if (distance < player.radius + slug.radius) {
            const speed = Math.hypot(player.vx, player.vy);
            if (speed > SWARM_QUEEN.ramSpeed) {
              slug.kill();
              this.popped += 1;
              this.particles.burst(slug.x, slug.y, {
                count: 8,
                speed: 200,
                life: 0.5,
                colors: [COLORS.accent, '#ffffff'],
              });
            } else if (player.invulnerable <= 0) {
              player.invulnerable = 0.8;
              player.vx = (player.x - slug.x) * 6;
              player.vy = (player.y - slug.y) * 6;
              this.particles.burst(slug.x, slug.y, {
                count: 8,
                speed: 180,
                life: 0.5,
                colors: [COLORS.octopusAlert, '#ffffff'],
              });
            }
          }
        }
      }
    }
    this.swarmlings = this.swarmlings.filter((slug) => slug.alive);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, SWARM_PALETTE);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 8 * this.shake, rand(-1, 1) * 8 * this.shake);
    }
    this.renderReefBackdrop(ctx);
    this.renderRound(ctx);
    ctx.restore();
    this.renderHud(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.phase === 'results') this.renderResults(ctx);
  }

  renderReefBackdrop(ctx) {
    const floorY = LOGICAL_HEIGHT * 0.84;
    ctx.save();
    ctx.fillStyle = 'rgba(6, 26, 20, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, LOGICAL_HEIGHT);
    ctx.lineTo(0, floorY);
    for (let x = 0; x <= LOGICAL_WIDTH; x += 40) {
      ctx.lineTo(x, floorY - 14 - Math.abs(Math.sin(x * 0.03)) * 22);
    }
    ctx.lineTo(LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 200, 160, 0.25)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i += 1) {
      const x = 50 + i * 130;
      const h = 40 + (i % 3) * 24;
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.quadraticCurveTo(x + 12, floorY - h * 0.6, x + 4, floorY - h);
      ctx.moveTo(x + 16, floorY);
      ctx.quadraticCurveTo(x + 4, floorY - h * 0.5, x + 20, floorY - h * 0.8);
      ctx.stroke();
    }
    ctx.restore();
    drawMotes(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, 18, SWARM_PALETTE, 'rgba(180, 230, 200, 0.4)');
  }

  renderRound(ctx) {
    for (const slug of this.swarmlings) slug.render(ctx);
    this.queen.render(ctx);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    drawText(ctx, 'THE SWARM QUEEN', LOGICAL_WIDTH / 2, 34, {
      size: 20,
      color: COLORS.text,
      glow: COLORS.urchin,
      glowBlur: 12,
    });
    const barX = 240;
    const barW = 480;
    fillRoundRect(ctx, barX, 52, barW, 14, 7, 'rgba(4, 16, 29, 0.7)');
    const ratio = clamp(this.queen.hp / this.queen.maxHp, 0, 1);
    fillRoundRect(ctx, barX, 52, barW * ratio, 14, 7, COLORS.octopusAlert);
    strokeRoundRect(ctx, barX, 52, barW, 14, 7, 'rgba(207, 239, 255, 0.35)', 2);
    for (let i = 1; i < 3; i += 1) {
      ctx.fillStyle = 'rgba(234, 246, 255, 0.5)';
      ctx.fillRect(barX + (barW * i) / 3 - 1, 50, 2, 18);
    }
    drawText(ctx, `PHASE ${this.queen.phase}/3`, barX + barW + 18, 52, {
      size: 13,
      color: COLORS.accent,
      align: 'left',
    });
    for (let i = 0; i < SWARM_QUEEN.lives; i += 1) {
      fillCircle(
        ctx,
        40 + i * 26,
        42,
        9,
        i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.16)',
      );
    }
    drawText(ctx, `SWARM ${this.swarmlings.length} — POPPED ${this.popped}`, LOGICAL_WIDTH - 40, 40, {
      size: 13,
      color: COLORS.foam,
      align: 'right',
      alpha: 0.85,
    });
    drawText(
      ctx,
      'RAM THE GLOWING CORE WHEN THE QUEEN OPENS — POP THE SWARM TO STAY CLEAR      ESC — TANKS',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 12, color: COLORS.textDim, alpha: 0.75 },
    );
  }

  resultsTitle() {
    return 'REEF SWARM QUEEN';
  }

  resultsHeadline() {
    return this.won ? 'THE SWARM SCATTERS!' : 'THE SWARM SWALLOWS YOU';
  }

  resultsDetail() {
    return `HITS ${this.hits} — SWARMLINGS POPPED ${this.popped} — PHASE ${this.queen.phase}/3`;
  }
}
