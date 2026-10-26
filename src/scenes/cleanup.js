import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillRoundRect } from '../engine/render.js';
import { drawMorayHead, paintMorayTrail } from '../entities/eel.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { CLEANUP, EEL_VARIANTS, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class CleanupScene extends MinigameScene {
  makeDebris(seedX) {
    return {
      x: seedX,
      y: rand(110, LOGICAL_HEIGHT - 170),
      vx: rand(-16, 16),
      vy: rand(-10, 10),
      kind: Math.random() < 0.5 ? 'crate' : 'barrel',
      size: rand(15, 21),
      rotation: rand(0, Math.PI),
      spin: rand(-0.6, 0.6),
      flash: 0,
    };
  }

  buildRound() {
    this.spawnSharks([
      { x: LOGICAL_WIDTH * 0.36, y: LOGICAL_HEIGHT * 0.4 },
      { x: LOGICAL_WIDTH * 0.36, y: LOGICAL_HEIGHT * 0.66 },
    ]);
    this.debris = Array.from({ length: CLEANUP.debris }, (_, index) =>
      this.makeDebris(420 + index * 90),
    );
    this.holes = Array.from({ length: CLEANUP.morays }, (_, index) => ({
      x: 360 + index * 210,
      state: 'idle',
      timer: rand(1.2, CLEANUP.lungeEvery),
      rise: 0,
      jaw: 0,
      phase: rand(0, TAU),
      palette: EEL_VARIANTS[index % EEL_VARIANTS.length],
    }));
    this.recycled = 0;
    this.stun = this.players.map(() => 0);
  }

  hitPlayer(index, hole) {
    const player = this.players[index];
    this.stun[index] = CLEANUP.stun;
    player.vx = rand(-1, 1) * 260;
    player.vy = 240;
    player.invulnerable = CLEANUP.stun;
    this.flash = Math.max(this.flash, 0.45);
    this.shake = Math.max(this.shake, 0.4);
    this.particles.burst(player.x, player.y, {
      count: 14,
      speed: 220,
      life: 0.6,
      colors: [COLORS.eel, COLORS.eelDark, '#ffffff'],
      buoyancy: 10,
    });
    this.game.audio.tone({ freq: 130, endFreq: 60, type: 'square', duration: 0.3, volume: 0.28 });
    hole.state = 'retreat';
    hole.timer = CLEANUP.retreatTime;
  }

  updateRound(dt, input) {
    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      if (this.stun[index] > 0) {
        this.stun[index] = Math.max(0, this.stun[index] - dt);
        player.vx *= 1 - 4 * dt;
        player.vy *= 1 - 4 * dt;
        player.x = clamp(player.x + player.vx * dt, player.radius, LOGICAL_WIDTH - player.radius);
        player.y = clamp(player.y + player.vy * dt, player.radius, LOGICAL_HEIGHT - player.radius);
      } else {
        player.update(dt, input);
      }
      for (const piece of this.debris) {
        const dx = piece.x - player.x;
        const dy = piece.y - player.y;
        const distance = Math.hypot(dx, dy) || 1;
        const reach = player.radius + piece.size + 6;
        if (distance > reach) continue;
        const speed = Math.hypot(player.vx, player.vy);
        const impulse = CLEANUP.push * (0.5 + Math.min(1, speed / 300) * 0.8);
        piece.vx = (dx / distance) * impulse;
        piece.vy = (dy / distance) * impulse;
        piece.spin = (Math.random() < 0.5 ? -1 : 1) * rand(1, 2.4);
        piece.flash = 0.2;
        this.particles.burst(piece.x, piece.y, {
          count: 4,
          speed: 120,
          life: 0.35,
          colors: [COLORS.wreckWood, COLORS.sandDark],
          buoyancy: -20,
        });
      }
    }
    for (const piece of this.debris) {
      piece.flash = Math.max(0, piece.flash - dt * 3);
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.rotation += piece.spin * dt;
      piece.vx *= 1 - 1.6 * dt;
      piece.vy *= 1 - 1.6 * dt;
      piece.x = clamp(piece.x, 60, LOGICAL_WIDTH - 60);
      piece.y = clamp(piece.y, 80, LOGICAL_HEIGHT - 100);
      if (piece.x < CLEANUP.chuteX && Math.abs(piece.y - LOGICAL_HEIGHT / 2) < CLEANUP.chuteHalf) {
        this.recycled += 1;
        this.particles.burst(piece.x, piece.y, {
          count: 12,
          speed: 180,
          life: 0.55,
          colors: [COLORS.accent, COLORS.bubble, '#ffffff'],
          buoyancy: -40,
        });
        this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.12, volume: 0.2 });
        this.game.audio.tone({ freq: 784, type: 'triangle', duration: 0.16, volume: 0.18, delay: 0.1 });
        Object.assign(piece, this.makeDebris(rand(620, 900)));
        if (this.recycled >= CLEANUP.target) {
          this.finish(true);
          return;
        }
      }
    }
    for (let holeIndex = 0; holeIndex < this.holes.length; holeIndex += 1) {
      const hole = this.holes[holeIndex];
      hole.timer -= dt;
      const targetRise =
        hole.state === 'peek'
          ? CLEANUP.peekHeight
          : hole.state === 'bite'
            ? CLEANUP.peekHeight + CLEANUP.biteHeight
            : 0;
      const targetJaw = hole.state === 'peek' ? 0.25 : hole.state === 'bite' ? 0.75 : 0;
      const easeSpeed =
        hole.state === 'bite'
          ? CLEANUP.biteEase
          : hole.state === 'retreat'
            ? CLEANUP.retreatEase
            : CLEANUP.riseEase;
      const ease = 1 - Math.exp(-easeSpeed * dt);
      hole.rise += (targetRise - hole.rise) * ease;
      hole.jaw += (targetJaw - hole.jaw) * ease;
      if (hole.state === 'bite') {
        for (let index = 0; index < this.players.length; index += 1) {
          if (this.stun[index] > 0) continue;
          const player = this.players[index];
          const dx = player.x - hole.x;
          const dy = player.y - (LOGICAL_HEIGHT - 70);
          if (Math.abs(dx) < 56 && Math.abs(dy) < CLEANUP.lungeReach - 20) {
            this.hitPlayer(index, hole);
          }
        }
      }
      if (hole.timer <= 0) {
        if (hole.state === 'idle') {
          hole.state = 'peek';
          hole.timer = CLEANUP.peekTime;
          this.game.audio.tone({ freq: 90, endFreq: 55, type: 'sawtooth', duration: 0.25, volume: 0.2 });
        } else if (hole.state === 'peek') {
          hole.state = 'bite';
          hole.timer = CLEANUP.biteTime;
          this.game.audio.tone({ freq: 150, endFreq: 70, type: 'square', duration: 0.14, volume: 0.24 });
        } else if (hole.state === 'bite') {
          hole.state = 'retreat';
          hole.timer = CLEANUP.retreatTime;
        } else {
          hole.state = 'idle';
          hole.timer = CLEANUP.lungeEvery;
          hole.rise = 0;
          hole.jaw = 0;
        }
      }
    }
  }

  renderDebris(ctx, piece) {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);
    if (piece.kind === 'crate') {
      ctx.fillStyle = COLORS.wreckWood;
      fillRoundRect(ctx, -piece.size, -piece.size * 0.8, piece.size * 2, piece.size * 1.6, 4, COLORS.wreckWood);
      ctx.strokeStyle = COLORS.wreckWoodDark;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-piece.size, -piece.size * 0.8, piece.size * 2, piece.size * 1.6);
      ctx.beginPath();
      ctx.moveTo(-piece.size, -piece.size * 0.8);
      ctx.lineTo(piece.size, piece.size * 0.8);
      ctx.moveTo(piece.size, -piece.size * 0.8);
      ctx.lineTo(-piece.size, piece.size * 0.8);
      ctx.stroke();
    } else {
      fillRoundRect(
        ctx,
        -piece.size * 0.8,
        -piece.size,
        piece.size * 1.6,
        piece.size * 2,
        piece.size * 0.4,
        COLORS.wreckWoodDark,
      );
      ctx.strokeStyle = COLORS.wreckRope;
      ctx.lineWidth = 2;
      ctx.strokeRect(-piece.size * 0.8, -piece.size * 0.4, piece.size * 1.6, 3);
      ctx.strokeRect(-piece.size * 0.8, piece.size * 0.3, piece.size * 1.6, 3);
    }
    ctx.restore();
  }

  renderRound(ctx) {
    const floorY = LOGICAL_HEIGHT - 72;
    fillRoundRect(ctx, 0, floorY, LOGICAL_WIDTH, 90, 12, 'rgba(90, 70, 51, 0.75)');
    ctx.fillStyle = 'rgba(92, 122, 74, 0.4)';
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.ellipse(60 + i * 120, floorY + 10, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(207, 239, 255, 0.07)';
    ctx.fillRect(0, LOGICAL_HEIGHT / 2 - CLEANUP.chuteHalf, CLEANUP.chuteX, CLEANUP.chuteHalf * 2);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(CLEANUP.chuteX, LOGICAL_HEIGHT / 2 - CLEANUP.chuteHalf);
    ctx.lineTo(CLEANUP.chuteX, LOGICAL_HEIGHT / 2 - 30);
    ctx.moveTo(CLEANUP.chuteX, LOGICAL_HEIGHT / 2 + 30);
    ctx.lineTo(CLEANUP.chuteX, LOGICAL_HEIGHT / 2 + CLEANUP.chuteHalf);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(207, 239, 255, 0.2)';
    ctx.lineWidth = 1.5;
    for (let y = LOGICAL_HEIGHT / 2 - CLEANUP.chuteHalf; y <= LOGICAL_HEIGHT / 2 + CLEANUP.chuteHalf; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CLEANUP.chuteX, y);
      ctx.stroke();
    }
    drawText(ctx, 'RECYCLE', CLEANUP.chuteX / 2, LOGICAL_HEIGHT / 2 - CLEANUP.chuteHalf - 18, {
      size: 12,
      color: COLORS.accent,
      alpha: 0.85,
    });
    for (const hole of this.holes) {
      ctx.fillStyle = 'rgba(10, 7, 6, 0.9)';
      ctx.beginPath();
      ctx.ellipse(hole.x, floorY + 8, 34, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      if (hole.rise > 0.5) {
        const radius = 16;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, LOGICAL_WIDTH, floorY + 4);
        ctx.clip();
        ctx.translate(hole.x, floorY - 4 - hole.rise);
        ctx.rotate(-Math.PI / 2);
        const span = radius * 2 + hole.rise * 1.6;
        const count = 12;
        const trail = [];
        for (let i = 0; i < count; i += 1) {
          const t = i / (count - 1);
          trail.push({
            x: radius * 1.2 - t * span,
            y:
              Math.sin(this.elapsed * 6 + hole.phase - i * 0.55) *
              radius *
              (0.12 + t * 0.5),
          });
        }
        paintMorayTrail(ctx, radius, trail, hole.palette);
        drawMorayHead(ctx, 0, 0, 0, radius, hole.palette, hole.jaw);
        ctx.restore();
      }
    }
    for (const piece of this.debris) this.renderDebris(ctx, piece);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    drawText(ctx, `RECYCLED ${this.recycled}/${CLEANUP.target}`, LOGICAL_WIDTH / 2, 46, {
      size: 20,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.45)',
      glowBlur: 12,
    });
    this.players.forEach((player, index) => {
      const x = index === 0 ? 24 : LOGICAL_WIDTH - 24;
      drawText(ctx, `P${index + 1}`, x, 62, {
        size: 13,
        color: index === 0 ? COLORS.accent : COLORS.foam,
        align: index === 0 ? 'left' : 'right',
      });
      if (this.stun[index] > 0) {
        drawText(ctx, 'BITTEN!', player.x, player.y - 44, {
          size: 14,
          color: COLORS.danger,
          alpha: 0.9,
        });
      }
    });
    drawText(
      ctx,
      this.solo
        ? 'WASD — SWIM      NUDGE THE WRECKAGE INTO THE RECYCLE NET — AVOID THE MORAYS'
        : 'P1 — WASD      P2 — ARROWS      BOTH DIVERS NUDGE WRECKAGE INTO THE RECYCLE NET',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 12, color: COLORS.textDim, alpha: 0.75 },
    );
  }

  resultsTitle() {
    return 'REEF CLEANUP';
  }

  resultsHeadline() {
    return 'REEF SPOTLESS!';
  }

  resultsDetail() {
    return `RECYCLED ${this.recycled} — TARGET ${CLEANUP.target}`;
  }
}
