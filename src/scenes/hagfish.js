import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { drawArcticShrimpBody } from '../entities/arcticshrimp.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import {
  CONTROLS,
  COLORS,
  HAGFISH,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

export class HagfishScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'hagfish';
  }

  buildRound() {
    const C = HAGFISH;
    this.phase = 'play';
    this.worldLength = C.worldLength;
    this.exitZone = { x: this.worldLength - C.exitPad };
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.status = 'SWIM GENTLY \u2014 FAST STROKES RELEASE SCENT';
    this.statusTimer = 4;
    this.chumCooldown = 0;
    this.scentTimer = 0;
    this.puffs = [];
    this.camX = 0;

    this.streaks = [];
    for (let i = 0; i < 60; i += 1) {
      this.streaks.push({
        x: rand(0, this.worldLength),
        y: rand(C.topBound, C.bottomBound),
        len: rand(10, 30),
        sp: rand(20, 60),
      });
    }

    this.cleans = [];
    const span = (this.worldLength - C.startX) / (C.cleanCount + 1);
    for (let i = 0; i < C.cleanCount; i += 1) {
      this.cleans.push({ x: C.startX + span * (i + 1), w: C.cleanWidth, phase: rand(0, TAU) });
    }

    this.player = {
      x: C.startX,
      y: LOGICAL_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: 20,
      facing: 1,
      scent: 0,
      armPhase: 0,
    };

    this.bloom = {
      x: C.startX - 420,
      y: LOGICAL_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: C.bloomRadius,
      heading: 0,
      state: 'patrol',
      timer: 0,
      maw: 0.2,
      phase: rand(0, TAU),
      patrolY: LOGICAL_HEIGHT / 2,
    };
  }

  firstPersonActor() {
    return this.player;
  }

  inClean(x) {
    for (const c of this.cleans) {
      if (Math.abs(x - c.x) < c.w / 2) return true;
    }
    return false;
  }

  addPuff(x, y, strength, chum = false) {
    this.puffs.push({
      x,
      y,
      vx: HAGFISH.currentSpeed * 0.7,
      vy: -HAGFISH.puffRise,
      life: HAGFISH.scentPuffLife,
      maxLife: HAGFISH.scentPuffLife,
      strength,
      chum,
      phase: rand(0, TAU),
    });
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 120, endFreq: 45, type: 'sawtooth', duration: 0.4, volume: 0.3 });
    if (this.lives <= 0) {
      this.finish(false);
      return true;
    }
    this.phase = 'scare';
    this.scareTimer = 1.3;
    return true;
  }

  respawn() {
    const p = this.player;
    const C = HAGFISH;
    p.x = clamp(p.x - 260, C.startX, this.worldLength - 40);
    p.y = LOGICAL_HEIGHT / 2;
    p.vx = 0;
    p.vy = 0;
    p.scent = 0;
    this.puffs = [];
    const b = this.bloom;
    b.x = clamp(p.x - 800, 40, this.worldLength - 40);
    b.y = LOGICAL_HEIGHT / 2;
    b.vx = 0;
    b.vy = 0;
    b.state = 'patrol';
    b.timer = 0;
    b.maw = 0.2;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'THE BLOOM LOST YOUR SCENT \u2014 SWIM GENTLY';
    this.statusTimer = 2;
  }

  bestScent() {
    let best = null;
    for (const d of this.puffs) {
      const strength = d.strength * (d.life / d.maxLife);
      if (!best || strength > best.strength) {
        best = { strength, x: d.x, y: d.y, kind: 'puff', ref: d };
      }
    }
    if (this.player.scent > 0.08) {
      const strength = this.player.scent;
      if (!best || strength > best.strength) {
        best = { strength, x: this.player.x, y: this.player.y, kind: 'player', ref: null };
      }
    }
    return best;
  }

  updateBloom(dt) {
    const b = this.bloom;
    const C = HAGFISH;
    b.phase += dt;

    if (b.state === 'recover') {
      b.timer -= dt;
      b.maw += (0.25 - b.maw) * (1 - Math.exp(-6 * dt));
      b.vx *= Math.exp(-3 * dt);
      b.vy *= Math.exp(-3 * dt);
      b.x = clamp(b.x + b.vx * dt, 40, this.worldLength - 40);
      b.y = clamp(b.y + b.vy * dt, C.topBound, C.bottomBound);
      if (b.timer <= 0) b.state = 'patrol';
      return;
    }

    const source = this.bestScent();
    if (source) {
      b.state = 'chase';
      b.maw += (0.75 - b.maw) * (1 - Math.exp(-8 * dt));
      const dx = source.x - b.x;
      const dy = source.y - b.y;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = C.bloomChaseSpeed * clamp(source.strength, 0.2, 1.5);
      b.vx += ((dx / dist) * speed - b.vx) * (1 - Math.exp(-4 * dt));
      b.vy += ((dy / dist) * speed - b.vy) * (1 - Math.exp(-4 * dt));
      b.x = clamp(b.x + b.vx * dt, 40, this.worldLength - 40);
      b.y = clamp(b.y + b.vy * dt, C.topBound, C.bottomBound);
      b.heading = Math.atan2(b.vy, b.vx);

      if (source.kind === 'player' && dist < b.radius + this.player.radius) {
        if (this.catchPlayer('THE HAGFISH BLOOM ENVELOPED YOU')) return;
      } else if (source.kind === 'puff' && dist < b.radius) {
        const puff = source.ref;
        this.puffs = this.puffs.filter((d) => d !== puff);
        b.state = 'recover';
        b.timer = 0.5;
        this.addPuff(puff.x, puff.y, 0.4);
        this.particles.burst(puff.x, puff.y, { count: 14, speed: 150, life: 0.5, colors: ['#c9d0d6', '#8f9aa0'], buoyancy: -30 });
        this.game.audio.tone({ freq: 300, endFreq: 90, type: 'sawtooth', duration: 0.18, volume: 0.16 });
      }
      return;
    }

    b.state = 'patrol';
    b.maw += (0.2 - b.maw) * (1 - Math.exp(-5 * dt));
    b.timer -= dt;
    if (b.timer <= 0) {
      b.timer = rand(2, 4);
      b.patrolY = rand(C.topBound + 30, C.bottomBound - 30);
    }
    b.vx += (C.bloomSpeed - b.vx) * (1 - Math.exp(-1.5 * dt));
    b.vy += ((b.patrolY - b.y) * 0.7 - b.vy) * (1 - Math.exp(-1.5 * dt));
    b.x = clamp(b.x + b.vx * dt, 40, this.worldLength - 40);
    b.y = clamp(b.y + b.vy * dt, C.topBound, C.bottomBound);
    b.heading = Math.atan2(b.vy * 0.4, b.vx);
  }

  updateRound(dt, input) {
    const C = HAGFISH;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.chumCooldown = Math.max(0, this.chumCooldown - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }

    const p = this.player;
    const left = input.isDown(CONTROLS.solo.left) ? 1 : 0;
    const right = input.isDown(CONTROLS.solo.right) ? 1 : 0;
    const up = input.isDown(CONTROLS.solo.up) ? 1 : 0;
    const down = input.isDown(CONTROLS.solo.down) ? 1 : 0;
    const dirX = right - left;
    const dirY = down - up;
    p.vx += (dirX * C.maxSpeed - p.vx) * (1 - Math.exp(-C.accel * dt));
    p.vy += (dirY * C.maxSpeed - p.vy) * (1 - Math.exp(-C.accel * dt));
    p.x = clamp(p.x + (p.vx + C.currentSpeed) * dt, 20, this.worldLength - 20);
    p.y = clamp(p.y + p.vy * dt, C.topBound, C.bottomBound);
    if (dirX !== 0) p.facing = dirX > 0 ? 1 : -1;
    p.armPhase += dt * (5 + Math.hypot(p.vx, p.vy) * 0.03);

    const speed = Math.hypot(p.vx, p.vy);
    const bloomDist = Math.hypot(p.x - this.bloom.x, p.y - this.bloom.y);
    const fear = bloomDist < C.scentFearRange
      ? C.scentFear * (1 - bloomDist / C.scentFearRange)
      : 0;
    p.scent = clamp(
      p.scent + (speed / C.maxSpeed * C.scentGrowth + fear - (this.inClean(p.x) ? C.scentWash : C.scentDecay)) * dt,
      0,
      1,
    );

    this.scentTimer += dt;
    if (p.scent > 0.15 && this.scentTimer >= C.scentInterval) {
      this.scentTimer = 0;
      this.addPuff(p.x, p.y, p.scent);
    }

    if ((input.wasPressed('confirm') || input.wasPressed('tool')) && this.chumCooldown <= 0) {
      this.chumCooldown = C.chumCooldown;
      this.addPuff(p.x, p.y - 8, C.chumStrength, true);
      this.game.audio.tone({ freq: 260, endFreq: 130, type: 'triangle', duration: 0.2, volume: 0.2 });
    }

    for (const d of this.puffs) {
      d.life -= dt;
      d.phase += dt * 3;
      d.x += (d.vx + Math.sin(d.phase) * 8) * dt;
      d.y += d.vy * dt;
    }
    this.puffs = this.puffs.filter((d) => d.life > 0);

    for (const s of this.streaks) {
      s.x += s.sp * dt;
      if (s.x > this.worldLength) s.x -= this.worldLength;
    }
    for (const c of this.cleans) c.phase += dt;

    this.updateBloom(dt);
    this.particles.update(dt);

    this.camX = clamp(p.x - LOGICAL_WIDTH * 0.35, 0, Math.max(0, this.worldLength - LOGICAL_WIDTH));
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);

    if (p.x >= this.exitZone.x) this.finish(true);
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(-this.camX, 0);

    const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    sky.addColorStop(0, '#2b3a2f');
    sky.addColorStop(0.55, '#1a2a24');
    sky.addColorStop(1, '#0b1614');
    ctx.fillStyle = sky;
    ctx.fillRect(this.camX - 20, 0, LOGICAL_WIDTH + 40, LOGICAL_HEIGHT);

    ctx.strokeStyle = 'rgba(200, 220, 210, 0.14)';
    ctx.lineWidth = 2;
    for (const s of this.streaks) {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len, s.y);
      ctx.stroke();
    }

    for (const c of this.cleans) this.renderClean(ctx, c);
    this.renderExit(ctx);
    for (const d of this.puffs) this.renderPuff(ctx, d);
    this.renderBloom(ctx);
    this.renderPlayer(ctx);
    this.particles.render(ctx);
    ctx.restore();
  }

  renderClean(ctx, c) {
    ctx.save();
    ctx.globalAlpha = 0.16 + 0.05 * Math.sin(c.phase * 2);
    const g = ctx.createLinearGradient(c.x - c.w / 2, 0, c.x + c.w / 2, 0);
    g.addColorStop(0, 'rgba(150, 230, 220, 0)');
    g.addColorStop(0.5, 'rgba(150, 230, 220, 0.8)');
    g.addColorStop(1, 'rgba(150, 230, 220, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(c.x - c.w / 2, 0, c.w, LOGICAL_HEIGHT);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(190, 240, 235, 0.5)';
    for (let i = 0; i < 7; i += 1) {
      const bx = c.x + Math.sin(c.phase + i * 1.7) * c.w * 0.3;
      const by = ((c.phase * 40 + i * 80) % (LOGICAL_HEIGHT + 40)) - 20;
      ctx.beginPath();
      ctx.arc(bx, by, 2.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    drawText(ctx, 'CLEAN', c.x, 40, { size: 11, color: 'rgba(190,240,235,0.7)' });
  }

  renderExit(ctx) {
    const x = this.exitZone.x;
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#bfe9d0';
    ctx.fillRect(x - 40, 0, 80, LOGICAL_HEIGHT);
    ctx.restore();
    ctx.strokeStyle = 'rgba(191, 233, 208, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 40, 0, 80, LOGICAL_HEIGHT);
    drawText(ctx, 'CLEAR WATER', x, 40, { size: 15, color: '#bfe9d0' });
  }

  renderPuff(ctx, d) {
    const t = d.life / d.maxLife;
    const rr = (d.chum ? 26 : 16) * (1.1 - t * 0.4);
    ctx.save();
    ctx.globalAlpha = t * (d.chum ? 0.8 : 0.5);
    const col = d.chum ? '255, 200, 90' : '150, 220, 150';
    const halo = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, rr);
    halo.addColorStop(0, `rgba(${col}, 0.9)`);
    halo.addColorStop(1, `rgba(${col}, 0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(d.x, d.y, rr, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderBloom(ctx) {
    const b = this.bloom;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.sin(b.phase * 2) * 0.08);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * TAU + Math.sin(b.phase * 1.5 + i) * 0.25;
      const len = b.radius * (1.5 + 0.35 * Math.sin(b.phase * 2 + i));
      let px = Math.cos(a) * b.radius * 0.3;
      let py = Math.sin(a) * b.radius * 0.3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(30, 34, 38, 0.5)';
      ctx.lineWidth = b.radius * 0.62;
      for (let pass = 0; pass < 2; pass += 1) {
        if (pass === 1) {
          ctx.strokeStyle = '#b9bfc6';
          ctx.lineWidth = b.radius * 0.44;
        }
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * b.radius * 0.3, Math.sin(a) * b.radius * 0.3);
        let cx = Math.cos(a) * b.radius * 0.3;
        let cy = Math.sin(a) * b.radius * 0.3;
        for (let s = 1; s <= 4; s += 1) {
          const t = s / 4;
          const nx = cx + Math.cos(a) * len * 0.25 + Math.sin(b.phase * 3 + i + t * 3) * b.radius * 0.18;
          const ny = cy + Math.sin(a) * len * 0.25 + Math.cos(b.phase * 3 + i + t * 3) * b.radius * 0.18;
          ctx.quadraticCurveTo(nx, ny, nx + Math.cos(a) * b.radius * 0.1, ny + Math.sin(a) * b.radius * 0.1);
          cx = nx + Math.cos(a) * b.radius * 0.1;
          cy = ny + Math.sin(a) * b.radius * 0.1;
        }
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, b.radius * 0.92, b.radius * 0.78, 0, 0, TAU);
    ctx.fillStyle = '#c6cbd1';
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 34, 38, 0.55)';
    ctx.lineWidth = b.radius * 0.09;
    ctx.stroke();

    for (let i = 0; i < 3; i += 1) {
      ctx.strokeStyle = 'rgba(60, 66, 72, 0.5)';
      ctx.lineWidth = b.radius * 0.05;
      ctx.beginPath();
      const sx = -b.radius * 0.5 + i * b.radius * 0.5;
      ctx.moveTo(sx, -b.radius * 0.2);
      ctx.lineTo(sx + b.radius * 0.12, b.radius * 0.05);
      ctx.stroke();
    }

    ctx.save();
    ctx.rotate(b.heading);
    const mx = b.radius * 0.72;
    ctx.fillStyle = '#2a1c1e';
    ctx.beginPath();
    ctx.ellipse(mx, 0, b.radius * 0.34, b.radius * (0.16 + b.maw * 0.42), 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#efe6d4';
    for (let i = -2; i <= 2; i += 1) {
      const ty = i * b.radius * 0.13;
      ctx.beginPath();
      ctx.moveTo(mx - b.radius * 0.24, ty - b.radius * 0.03);
      ctx.lineTo(mx - b.radius * 0.24, ty + b.radius * 0.03);
      ctx.lineTo(mx - b.radius * 0.4, ty);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  renderPlayer(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.facing, 1);
    drawArcticShrimpBody(ctx, p.radius * 1.05, {
      age: this.time,
      armPhase: p.armPhase,
      speed: Math.hypot(p.vx, p.vy),
      bodyColor: 'rgba(150, 156, 164, 0.92)',
      accentColor: 'rgba(150, 156, 164, 0.92)',
      shellLine: 'rgba(66, 72, 80, 0.6)',
      segmentColor: 'rgba(88, 94, 102, 0.5)',
      finColor: 'rgba(170, 176, 184, 0.8)',
      tailColor: '#9aa0a8',
      legColor: 'rgba(160, 166, 174, 0.9)',
      antennaColor: 'rgba(212, 218, 226, 0.9)',
    });
    ctx.restore();
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.3, {
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        time: this.time,
        caption: 'CAUGHT \u2014 TRY AGAIN!',
        radius: 60,
      });
      return;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.94)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    const s = 1.2 + (1 - this.scareTimer / 1.3) * 1.2;
    ctx.scale(s, s);
    const b = this.bloom;
    b.x = 0;
    b.y = 0;
    b.maw = 1;
    this.renderBloom(ctx);
    ctx.restore();
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE HAGFISH BLOOM', LOGICAL_WIDTH / 2, 30, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(150, 220, 150, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 28, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < HAGFISH.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 50, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }

    const progress = clamp(this.player.x / this.exitZone.x, 0, 1);
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 28, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 28, 240 * progress, 10, 5, '#ffd166');

    drawText(ctx, 'YOUR SCENT', LOGICAL_WIDTH - 264, 54, { size: 11, color: COLORS.textDim, align: 'left' });
    fillRoundRect(ctx, LOGICAL_WIDTH - 186, 46, 162, 10, 5, 'rgba(6, 20, 26, 0.8)');
    const scentColor = this.player.scent > 0.6 ? COLORS.danger : this.player.scent > 0.3 ? '#e0d07a' : '#96dc96';
    fillRoundRect(ctx, LOGICAL_WIDTH - 186, 46, 162 * clamp(this.player.scent, 0, 1), 10, 5, scentColor);

    const ready = this.chumCooldown <= 0;
    drawText(
      ctx,
      ready ? 'CHUM READY \u2014 SPACE' : `CHUM ${this.chumCooldown.toFixed(1)}s`,
      LOGICAL_WIDTH / 2,
      92,
      { size: 13, color: ready ? '#ffd08a' : COLORS.textDim, alpha: ready ? 0.95 : 0.7 },
    );

    if (this.inClean(this.player.x)) {
      drawText(ctx, 'CLEAN CURRENT \u2014 SCENT WASHING AWAY', LOGICAL_WIDTH / 2, 112, {
        size: 12,
        color: '#bfe9d0',
        alpha: 0.9,
      });
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 112, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    if (this.bloom.state === 'chase') {
      drawText(ctx, 'IT SMELLS YOU!', LOGICAL_WIDTH / 2, 60, {
        size: 16,
        color: COLORS.danger,
        alpha: 0.6 + 0.4 * Math.sin(this.time * 14),
      });
    }

    drawText(ctx, 'WASD / ARROWS \u2014 SWIM GENTLY      SPACE \u2014 DROP CHUM      ESC \u2014 BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 14, {
      size: 10,
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
    return 'THE HAGFISH BLOOM';
  }

  resultsHeadline() {
    return this.won ? 'YOU SLIPPED INTO CLEAR WATER' : 'THE BLOOM FOUND YOU';
  }

  resultsDetail() {
    return `${this.lives} LIVES LEFT`;
  }
}
