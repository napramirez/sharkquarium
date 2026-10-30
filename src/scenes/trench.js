import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand } from '../engine/math.js';
import { TRENCH, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class TrenchScene extends MinigameScene {
  enter(params = {}) {
    super.enter({ ...params, solo: true });
  }

  buildRound() {
    this.spawnSharks([{ x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT * 0.34 }]);
    this.depth = 0;
    this.pearls = 0;
    this.hits = 0;
    this.stun = 0;
    this.barriers = [];
    this.collectibles = [];
    this.currents = [];
    this.spawnTimer = 0.9;
    this.driftX = 0;
    this.lastGapX = LOGICAL_WIDTH / 2;
  }

  spawnBarrier() {
    const gapWidth = TRENCH.gapWidth;
    let gapX = rand(150, LOGICAL_WIDTH - 150);
    gapX = clamp(gapX, this.lastGapX - TRENCH.maxGapShift, this.lastGapX + TRENCH.maxGapShift);
    gapX = clamp(gapX, 150, LOGICAL_WIDTH - 150);
    this.lastGapX = gapX;
    const left = gapX - gapWidth / 2;
    const right = gapX + gapWidth / 2;
    const parts = [];
    if (left > 0) parts.push({ x: 0, y: -90, w: left, h: 48 });
    if (right < LOGICAL_WIDTH) parts.push({ x: right, y: -90, w: LOGICAL_WIDTH - right, h: 48 });
    const barrier = { parts, y: -90, hit: false, gapX };
    this.barriers.push(barrier);
    if (Math.random() < TRENCH.pearlChance) {
      this.collectibles.push({ x: gapX, y: -60, taken: false, phase: rand(0, 6) });
    }
    if (Math.random() < 0.35) {
      this.currents.push({ x: rand(80, LOGICAL_WIDTH - 270), y: -220, w: 190, h: 240, dir: Math.random() < 0.5 ? -1 : 1 });
    }
  }

  hitBarrier(barrier) {
    barrier.hit = true;
    this.hits += 1;
    this.stun = TRENCH.hitStun;
    this.flash = 0.6;
    this.shake = 0.6;
    const player = this.players[0];
    player.vy = -140;
    this.particles.burst(player.x, player.y, {
      count: 18,
      speed: 260,
      life: 0.7,
      colors: [COLORS.ice, COLORS.iceDark, '#ffffff'],
      buoyancy: -40,
    });
    this.game.audio.tone({ freq: 150, endFreq: 60, type: 'sawtooth', duration: 0.35, volume: 0.3 });
    if (this.hits >= TRENCH.hits) this.finish(false);
  }

  speed() {
    return TRENCH.scrollBase + (this.elapsed / TRENCH.duration) * TRENCH.scrollRamp;
  }

  updateRound(dt, input) {
    const player = this.players[0];
    const scroll = this.speed();
    this.depth += scroll * dt * 0.1;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(TRENCH.iceMin, TRENCH.iceMax);
      this.spawnBarrier();
    }
    if (this.stun > 0) {
      this.stun = Math.max(0, this.stun - dt);
      player.invulnerable = 0.4;
      player.vx *= 1 - 4 * dt;
      player.vy *= 1 - 4 * dt;
      player.x = clamp(player.x + player.vx * dt, player.radius, LOGICAL_WIDTH - player.radius);
      player.y = clamp(player.y + player.vy * dt, player.radius, LOGICAL_HEIGHT - player.radius);
    } else {
      player.invulnerable = 0;
      player.update(dt, input);
    }
    for (const current of this.currents) {
      current.y += scroll * dt;
      const inside =
        player.x + player.radius > current.x &&
        player.x - player.radius < current.x + current.w &&
        player.y + player.radius > current.y &&
        player.y - player.radius < current.y + current.h;
      if (inside) player.x += TRENCH.currentPush * current.dir * dt;
    }
    this.currents = this.currents.filter((current) => current.y < LOGICAL_HEIGHT + 260);
    for (const barrier of this.barriers) {
      barrier.y += scroll * dt;
      for (const part of barrier.parts) part.y += scroll * dt;
      if (barrier.hit || this.stun > 0) continue;
      for (const part of barrier.parts) {
        const cx = clamp(player.x, part.x, part.x + part.w);
        const cy = clamp(player.y, part.y, part.y + part.h);
        if (Math.hypot(player.x - cx, player.y - cy) < player.radius * 0.8) {
          this.hitBarrier(barrier);
          break;
        }
      }
      if (this.phase !== 'play') return;
    }
    this.barriers = this.barriers.filter((barrier) => barrier.y < LOGICAL_HEIGHT + 160);
    for (const pearl of this.collectibles) {
      pearl.y += scroll * dt;
      if (pearl.taken) continue;
      if (circleOverlap(player, { ...pearl, radius: 12 })) {
        pearl.taken = true;
        this.pearls += 1;
        this.particles.burst(pearl.x, pearl.y, {
          count: 10,
          speed: 160,
          life: 0.5,
          colors: [COLORS.accent, '#ffffff'],
          buoyancy: -30,
        });
        this.game.audio.tone({ freq: 880, endFreq: 1320, type: 'triangle', duration: 0.12, volume: 0.18 });
      }
    }
    this.collectibles = this.collectibles.filter(
      (pearl) => !pearl.taken && pearl.y < LOGICAL_HEIGHT + 60,
    );
    if (this.depth >= TRENCH.goalDepth) {
      this.finish(true);
      return;
    }
    if (this.elapsed >= TRENCH.duration) {
      this.finish(this.depth >= TRENCH.goalDepth);
    }
  }

  renderRound(ctx) {
    for (const current of this.currents) {
      ctx.fillStyle = 'rgba(143, 208, 239, 0.1)';
      ctx.fillRect(current.x, current.y, current.w, current.h);
      ctx.strokeStyle = 'rgba(143, 208, 239, 0.28)';
      ctx.lineWidth = 2;
      ctx.strokeRect(current.x, current.y, current.w, current.h);
      for (let i = 0; i < 4; i += 1) {
        const y = current.y + 30 + i * 52;
        const offset = i % 2 === 0 ? 14 : -14;
        ctx.beginPath();
        ctx.moveTo(current.x + 16 + (current.dir > 0 ? 0 : offset), y);
        ctx.lineTo(current.x + 74 + offset, y);
        ctx.stroke();
      }
    }
    for (const barrier of this.barriers) {
      if (barrier.hit) continue;
      for (const part of barrier.parts) {
        ctx.fillStyle = COLORS.iceDark;
        fillRoundRect(ctx, part.x, part.y, part.w, part.h, 10, COLORS.iceDark);
        fillRoundRect(ctx, part.x, part.y, part.w, part.h * 0.42, 10, COLORS.ice);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        strokeRoundRect(ctx, part.x, part.y, part.w, part.h, 10, 'rgba(255, 255, 255, 0.4)', 1.5);
      }
    }
    for (const pearl of this.collectibles) {
      if (pearl.taken) continue;
      const bob = Math.sin(this.time * 3 + pearl.phase) * 3;
      fillCircle(ctx, pearl.x, pearl.y + bob, 12, 'rgba(255, 209, 102, 0.25)');
      fillCircle(ctx, pearl.x, pearl.y + bob, 8, COLORS.accent);
      fillCircle(ctx, pearl.x - 3, pearl.y + bob - 3, 3, '#ffffff');
    }
    this.players[0].render(ctx);
    this.particles.render(ctx);
    const cycle = this.depth % 260;
    if (cycle < 92) {
      ctx.fillStyle = `rgba(2, 6, 12, ${0.62 * (1 - Math.abs(cycle - 46) / 46)})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
  }

  renderHud(ctx) {
    drawText(ctx, `DEPTH ${Math.floor(this.depth)} m`, 46, 40, {
      size: 20,
      color: COLORS.text,
      align: 'left',
      glow: COLORS.bubble,
      glowBlur: 10,
    });
    drawText(ctx, `GOAL ${TRENCH.goalDepth} m`, 46, 64, {
      size: 12,
      color: COLORS.textDim,
      align: 'left',
    });
    const progress = clamp(this.depth / TRENCH.goalDepth, 0, 1);
    fillRoundRect(ctx, 46, 78, 240, 8, 4, 'rgba(4, 16, 29, 0.6)');
    fillRoundRect(ctx, 46, 78, 240 * progress, 8, 4, COLORS.accent);
    drawText(ctx, `PEARLS ${this.pearls}`, LOGICAL_WIDTH - 46, 40, {
      size: 16,
      color: COLORS.accent,
      align: 'right',
    });
    for (let i = 0; i < TRENCH.hits; i += 1) {
      const alive = i >= this.hits;
      fillCircle(ctx, LOGICAL_WIDTH - 52 - i * 24, 66, 8, alive ? COLORS.ice : 'rgba(207, 239, 255, 0.16)');
    }
    const left = Math.max(0, TRENCH.duration - this.elapsed);
    drawText(ctx, `${Math.ceil(left)}s`, LOGICAL_WIDTH - 46, 92, {
      size: 14,
      color: left < 10 ? COLORS.danger : COLORS.textDim,
      align: 'right',
    });
    if (this.stun > 0) {
      drawText(ctx, 'CRUNCH!', this.players[0].x, this.players[0].y - 44, {
        size: 15,
        color: COLORS.danger,
        alpha: 0.9,
      });
    }
    drawText(
      ctx,
      'WASD — DIVE      THREAD THE ICE — GRAB THE GOLD PEARLS — MIND THE CURRENTS',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 12, color: COLORS.textDim, alpha: 0.75 },
    );
  }

  resultsTitle() {
    return 'TRENCH DIVE';
  }

  resultsHeadline() {
    return this.won ? 'BOTTOM REACHED!' : 'THE TRENCH KEPT YOU';
  }

  resultsDetail() {
    return `DEPTH ${Math.floor(this.depth)} m — ${this.pearls} PEARLS — ${this.hits} HITS`;
  }
}
