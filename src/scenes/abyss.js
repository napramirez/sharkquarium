import { MinigameScene } from '../engine/minigame.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, drawMotes, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { Leviathan, drawLeviathanEye } from '../entities/leviathan.js';
import {
  ABYSS,
  ABYSS_PALETTE,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

export class AbyssScene extends MinigameScene {
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

  firstPersonSprites() {
    return [...(this.players ?? []), this.leviathan].filter(Boolean);
  }

  firstPersonPalette() {
    return { top: ABYSS_PALETTE.top, bottom: ABYSS_PALETTE.bottom, wall: '#521522' };
  }

  buildRound() {
    this.spawnSharks([
      { x: LOGICAL_WIDTH * 0.5, y: LOGICAL_HEIGHT * 0.72 },
      { x: LOGICAL_WIDTH * 0.5, y: LOGICAL_HEIGHT * 0.6 },
    ]);
    this.players.forEach((player, index) => {
      player.invulnerable = ABYSS.invulnerable;
      if (this.players.length > 1) player.x += index === 0 ? -46 : 46;
    });
    this.leviathan = new Leviathan();
    this.trenchlings = [];
    this.lives = ABYSS.lives;
    this.hits = 0;
    this.phase = 'play';
  }

  spawnTrenchlings() {
    for (let i = 0; i < ABYSS.trenchlings + (this.leviathan.phase - 1); i += 1) {
      const angle = rand(0, TAU);
      this.trenchlings.push({
        x: this.leviathan.x + Math.cos(angle) * 120,
        y: this.leviathan.y + Math.sin(angle) * 120,
        vx: 0,
        vy: 0,
        phase: rand(0, TAU),
        radius: ABYSS.trenchlingRadius,
      });
    }
    this.game.audio.tone({ freq: 90, endFreq: 40, type: 'sawtooth', duration: 0.5, volume: 0.26 });
  }

  loseLife(index) {
    const player = this.players[index];
    if (player.invulnerable > 0) return;
    this.lives -= 1;
    player.invulnerable = ABYSS.invulnerable;
    player.vx = rand(-1, 1) * 320;
    player.vy = rand(-1, 1) * 320;
    this.flash = Math.max(this.flash, 0.7);
    this.shake = Math.max(this.shake, 0.7);
    this.particles.burst(player.x, player.y, {
      count: 20,
      speed: 260,
      life: 0.7,
      colors: [COLORS.danger, COLORS.tentacleDark, '#ffffff'],
      buoyancy: -20,
    });
    this.game.audio.tone({ freq: 140, endFreq: 60, type: 'square', duration: 0.35, volume: 0.3 });
    if (this.lives <= 0) this.finish(false);
  }

  updateRound(dt, input) {
    this.updatePlayers(dt, input);
    this.players.forEach((player, index) => {
      player.invulnerable = Math.max(0, player.invulnerable - dt);
      this.checkRam(player);
    });
    const wasSummon = this.leviathan.state === 'summon';
    this.leviathan.update(dt, this.players);
    if (wasSummon && this.leviathan.state !== 'summon') this.spawnTrenchlings();

    if (this.leviathan.dead) {
      if (this.leviathan.stateTimer <= 0) {
        this.finish(true);
        return;
      }
    } else {
      const body = this.leviathan.radius * 0.7;
      if (this.leviathan.state === 'lunge') {
        for (let index = 0; index < this.players.length; index += 1) {
          const player = this.players[index];
          if (Math.hypot(player.x - this.leviathan.x, player.y - this.leviathan.y) < body) {
            this.loseLife(index);
          }
        }
      }
      for (const slug of this.trenchlings) {
        let target = this.players[0];
        let best = Infinity;
        for (const player of this.players) {
          const distance = Math.hypot(player.x - slug.x, player.y - slug.y);
          if (distance < best) {
            best = distance;
            target = player;
          }
        }
        const dx = target.x - slug.x;
        const dy = target.y - slug.y;
        const distance = Math.hypot(dx, dy) || 1;
        slug.vx += (dx / distance) * ABYSS.trenchlingSpeed * 1.4 * dt;
        slug.vy += (dy / distance) * ABYSS.trenchlingSpeed * 1.4 * dt;
        slug.vx = clamp(slug.vx, -ABYSS.trenchlingSpeed, ABYSS.trenchlingSpeed);
        slug.vy = clamp(slug.vy, -ABYSS.trenchlingSpeed, ABYSS.trenchlingSpeed);
        slug.x += slug.vx * dt;
        slug.y += slug.vy * dt;
        slug.phase += dt * 4;
        for (let index = 0; index < this.players.length; index += 1) {
          const player = this.players[index];
          if (
            player.invulnerable <= 0 &&
            Math.hypot(player.x - slug.x, player.y - slug.y) < player.radius + slug.radius
          ) {
            player.invulnerable = 0.8;
            player.vx = (player.x - slug.x) * 6;
            player.vy = (player.y - slug.y) * 6;
            this.particles.burst(slug.x, slug.y, {
              count: 8,
              speed: 180,
              life: 0.5,
              colors: [COLORS.tentacle, '#ffffff'],
            });
          }
        }
      }
    }
    this.trenchlings = this.trenchlings.filter(
      (slug) => Math.hypot(slug.x - this.leviathan.x, slug.y - this.leviathan.y) < 520,
    );
  }

  checkRam(player) {
    if (this.leviathan.dead || !this.leviathan.vulnerable) return;
    const eye = this.leviathan.eyePosition();
    const speed = Math.hypot(player.vx, player.vy);
    if (speed < ABYSS.ramSpeed) return;
    if (Math.hypot(player.x - eye.x, player.y - eye.y) > player.radius + this.leviathan.radius * 0.5) {
      return;
    }
    if (!this.leviathan.damage(1)) return;
    this.hits += 1;
    player.vx = -player.vx * 0.4;
    player.vy = -player.vy * 0.4;
    player.invulnerable = 0.5;
    this.flash = Math.max(this.flash, 0.5);
    this.shake = Math.max(this.shake, 0.6);
    this.particles.burst(eye.x, eye.y, {
      count: 22,
      speed: 300,
      life: 0.8,
      colors: [COLORS.accent, COLORS.tentacle, '#ffffff'],
      buoyancy: -30,
    });
    this.game.audio.tone({ freq: 320, endFreq: 640, type: 'square', duration: 0.22, volume: 0.3 });
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, ABYSS_PALETTE);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 8 * this.shake, rand(-1, 1) * 8 * this.shake);
    }
    this.renderAbyssBackdrop(ctx);
    this.renderRound(ctx);
    ctx.restore();
    this.renderHud(ctx);    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.phase === 'results') this.renderResults(ctx);
  }

  renderAbyssBackdrop(ctx) {
    const floorY = LOGICAL_HEIGHT * 0.82;
    const gradient = ctx.createLinearGradient(0, floorY - 60, 0, LOGICAL_HEIGHT);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(2, 0, 4, 0.62)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, floorY - 60, LOGICAL_WIDTH, LOGICAL_HEIGHT - floorY + 60);
    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 211 + this.time * 6) % (LOGICAL_WIDTH + 80)) - 40;
      const y = floorY + ((i * 37) % 30);
      const glow = ctx.createRadialGradient(x, y, 2, x, y, 60);
      glow.addColorStop(0, 'rgba(150, 40, 66, 0.32)');
      glow.addColorStop(1, 'rgba(150, 40, 66, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 60, 0, TAU);
      ctx.fill();
    }
    drawMotes(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, 20, ABYSS_PALETTE, 'rgba(150, 200, 230, 0.4)');
  }

  renderRound(ctx) {
    for (const slug of this.trenchlings) {
      ctx.save();
      ctx.translate(slug.x, slug.y);
      ctx.rotate(Math.atan2(slug.vy, slug.vx));
      const gradient = ctx.createRadialGradient(
        -slug.radius * 0.3,
        -slug.radius * 0.3,
        slug.radius * 0.2,
        0,
        0,
        slug.radius * 1.5,
      );
      gradient.addColorStop(0, COLORS.leviathan);
      gradient.addColorStop(1, COLORS.leviathanDark);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, slug.radius * 1.5, slug.radius, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = COLORS.leviathanDark;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = COLORS.leviathanGlow;
      for (let i = 0; i < 5; i += 1) {
        const angle = (i / 5) * TAU;
        ctx.beginPath();
        ctx.arc(
          Math.cos(angle) * slug.radius * 1.1,
          Math.sin(angle) * slug.radius * 0.68,
          1.8,
          0,
          TAU,
        );
        ctx.fill();
      }
      drawLeviathanEye(ctx, slug.radius * 0.65, 0, slug.radius * 0.55, 0.9, 0);
      ctx.restore();
    }
    this.leviathan.render(ctx);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    drawText(ctx, 'THE LEVIATHAN', LOGICAL_WIDTH / 2, 34, {
      size: 20,
      color: COLORS.text,
      glow: COLORS.tentacleDark,
      glowBlur: 12,
    });
    const barX = 240;
    const barW = 480;
    fillRoundRect(ctx, barX, 52, barW, 14, 7, 'rgba(4, 16, 29, 0.7)');
    const ratio = clamp(this.leviathan.hp / this.leviathan.maxHp, 0, 1);
    fillRoundRect(ctx, barX, 52, barW * ratio, 14, 7, COLORS.tentacle);
    strokeRoundRect(ctx, barX, 52, barW, 14, 7, 'rgba(207, 239, 255, 0.35)', 2);
    for (let i = 1; i < 3; i += 1) {
      ctx.fillStyle = 'rgba(234, 246, 255, 0.5)';
      ctx.fillRect(barX + (barW * i) / 3 - 1, 50, 2, 18);
    }
    drawText(ctx, `PHASE ${this.leviathan.phase}/3`, barX + barW + 18, 52, {
      size: 13,
      color: COLORS.accent,
      align: 'left',
    });
    for (let i = 0; i < ABYSS.lives; i += 1) {
      fillCircle(
        ctx,
        40 + i * 26,
        42,
        9,
        i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.16)',
      );
    }
    drawText(
      ctx,
      'WASD OR DRAG — RAM THE GLOWING EYE WHEN IT STAGGERS      ESC — TANKS',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 12, color: COLORS.textDim, alpha: 0.75 },
    );
  }

  resultsTitle() {
    return 'ABYSS TRENCH';
  }

  resultsHeadline() {
    return this.won ? 'THE LEVIATHAN FALLS!' : 'DRAGGED INTO THE DARK';
  }

  resultsDetail() {
    return `HITS ${this.hits} — PHASE ${this.leviathan.phase}/3`;
  }
}
