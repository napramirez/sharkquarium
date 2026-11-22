import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { Shark } from '../entities/shark.js';
import { drawArcherfish, drawNeedlefish } from '../entities/realfish.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import { CONTROLS, COLORS, ARCHER, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const SURFACE = ARCHER.surfaceY;

export class ArcherScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'archer';
  }

  buildRound() {
    const C = ARCHER;
    this.phase = 'play';
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.eaten = 0;
    this.cool = 0;
    this.status = 'SHOOT THE INSECTS OFF THE BRANCHES \u2014 CLICK / SPACE TO SPIT';
    this.statusTimer = 4.4;
    this.jets = [];
    this.insects = [];
    this.spawnTimer = 1;
    for (let i = 0; i < C.insectCount; i += 1) this.spawnInsect();
    this.ripples = [];

    const player = new Shark(W * 0.5, SURFACE + 150, { controls: CONTROLS.solo, pointer: true, maxX: W });
    player.noIdleFlip = true;
    player.render = (ctx) => {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.facing, 1);
      drawArcherfish(ctx, player.radius * 1.15, { age: this.time });
      ctx.restore();
    };
    this.players = [player];
    this.player = player;

    this.needle = {
      x: W + 200,
      y: SURFACE + 40,
      vx: -C.needleSpeed,
      radius: C.needleRadius,
      radiusScale: 1,
    };
  }

  firstPersonActor() {
    return this.player;
  }

  spawnInsect() {
    const C = ARCHER;
    this.insects.push({
      x: rand(80, W - 80),
      y: rand(40, SURFACE - 60),
      state: 'perch',
      vx: 0,
      vy: 0,
      phase: rand(0, TAU),
      r: 9,
    });
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 140, endFreq: 50, type: 'sawtooth', duration: 0.4, volume: 0.3 });
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
    p.x = W * 0.5;
    p.y = SURFACE + 150;
    p.vx = 0;
    p.vy = 0;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.jets = [];
    const n = this.needle;
    n.x = W + 200;
    n.y = SURFACE + 40;
    n.vx = -ARCHER.needleSpeed;
    this.phase = 'play';
    this.status = 'THE NEEDLEFISH MOVED OFF \u2014 LINE UP YOUR SHOT';
    this.statusTimer = 2.4;
  }

  nearestInsect() {
    let best = null;
    let bestD = Infinity;
    for (const s of this.insects) {
      if (s.state !== 'perch') continue;
      const d = Math.hypot(s.x - this.player.x, s.y - this.player.y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  shoot() {
    const p = this.player;
    const input = this.game.input;
    let tx;
    let ty;
    if (input.pointer.moved || input.pointer.down) {
      tx = input.pointer.x;
      ty = input.pointer.y;
    } else {
      const target = this.nearestInsect();
      if (!target) return;
      tx = target.x;
      ty = target.y;
    }
    const dx = tx - p.x;
    const dy = ty - p.y;
    const d = Math.hypot(dx, dy) || 1;
    this.jets.push({ x: p.x, y: p.y, vx: (dx / d) * ARCHER.jetSpeed, vy: (dy / d) * ARCHER.jetSpeed, life: 0.7 });
    p.biteGlow = 0.2;
    this.cool = ARCHER.cooldown;
    this.game.audio.tone({ freq: 520, endFreq: 300, type: 'sine', duration: 0.12, volume: 0.16 });
  }

  updateRound(dt, input) {
    const C = ARCHER;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.cool = Math.max(0, this.cool - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }

    const p = this.player;
    p.update(dt, input);
    p.x = clamp(p.x, 30, W - 30);
    p.y = clamp(p.y, SURFACE + p.radius + 6, C.bottomBound);

    if ((input.wasPressed('confirm') || input.wasPressed('tool')) && this.cool <= 0) this.shoot();

    for (const j of this.jets) {
      j.life -= dt;
      j.x += j.vx * dt;
      j.y += j.vy * dt;
      for (const s of this.insects) {
        if (s.state !== 'perch') continue;
        if (Math.hypot(j.x - s.x, j.y - s.y) < s.r + 8) {
          s.state = 'fall';
          s.vy = 60;
          j.life = 0;
          this.ripples.push({ x: s.x, y: SURFACE, r: 6, life: 0.6 });
          this.game.audio.tone({ freq: 300, endFreq: 700, type: 'triangle', duration: 0.12, volume: 0.18 });
        }
      }
    }
    this.jets = this.jets.filter((j) => j.life > 0);

    for (const s of this.insects) {
      s.phase += dt;
      if (s.state === 'fall') {
        s.vy += 500 * dt;
        s.y += s.vy * dt;
        if (s.y >= SURFACE) {
          s.state = 'water';
          s.y = SURFACE + 6;
        }
      } else if (s.state === 'water') {
        s.y = SURFACE + 6 + Math.sin(s.phase * 3) * 3;
        if (circleOverlap(p, { x: s.x, y: s.y, radius: s.r })) {
          s.state = 'eaten';
          this.eaten += 1;
          this.particles.burst(s.x, s.y, { count: 10, speed: 120, life: 0.4, colors: ['#cbe6a0', '#8fbf5a'], buoyancy: -20 });
          this.game.audio.tone({ freq: 640, endFreq: 980, type: 'triangle', duration: 0.12, volume: 0.18 });
        }
      }
    }
    this.insects = this.insects.filter((s) => s.state !== 'eaten');

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.insects.filter((s) => s.state === 'perch').length < C.insectCount) {
      this.spawnTimer = C.spawnInterval;
      this.spawnInsect();
    }

    const n = this.needle;
    n.x += n.vx * dt;
    if (n.x < -220) {
      n.x = W + 220;
      n.y = SURFACE + rand(20, 70);
      n.vx = -C.needleSpeed;
    }
    if (this.invuln <= 0 && circleOverlap(p, { x: n.x, y: n.y, radius: n.radius })) {
      if (this.catchPlayer('THE NEEDLEFISH SKEWERED YOU')) return;
    }

    for (const rip of this.ripples) {
      rip.life -= dt;
      rip.r += 30 * dt;
    }
    this.ripples = this.ripples.filter((rip) => rip.life > 0);

    this.particles.update(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);

    if (this.eaten >= C.insectGoal) this.finish(true);
  }

  renderRound(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#8fbf8a');
    sky.addColorStop(0.4, '#5e8f7a');
    sky.addColorStop(0.62, '#3f7d86');
    sky.addColorStop(1, '#123a4a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(60, 90, 55, 0.7)';
    ctx.fillRect(0, 0, W, SURFACE - 60);
    ctx.strokeStyle = '#3a5a34';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i += 1) {
      const bx = 60 + i * 160;
      ctx.beginPath();
      ctx.moveTo(bx, -10);
      ctx.quadraticCurveTo(bx + 20, SURFACE - 90, bx + 60, SURFACE - 110);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(120, 150, 110, 0.5)';
    for (let i = 0; i < 10; i += 1) {
      const lx = (i * 137) % W;
      ctx.beginPath();
      ctx.ellipse(lx, SURFACE - 90, 26, 12, 0.4, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(190, 225, 240, 0.25)';
    ctx.fillRect(0, SURFACE - 6, W, 10);

    for (const rip of this.ripples) {
      ctx.strokeStyle = `rgba(220, 245, 255, ${rip.life})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.r, 0, TAU);
      ctx.stroke();
    }

    for (const s of this.insects) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.fillStyle = '#3a2f1c';
      ctx.beginPath();
      ctx.ellipse(0, 0, s.r, s.r * 0.6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(220, 230, 190, 0.6)';
      const sway = Math.sin(s.phase * 8) * 2;
      ctx.beginPath();
      ctx.ellipse(-s.r * 0.4, -s.r * 0.3, s.r * 0.7, s.r * 0.3, -0.4 + sway * 0.05, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(s.r * 0.4, -s.r * 0.3, s.r * 0.7, s.r * 0.3, 0.4 - sway * 0.05, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    for (const j of this.jets) {
      ctx.fillStyle = 'rgba(210, 240, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(j.x, j.y, 4, 0, TAU);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(this.needle.x, this.needle.y);
    ctx.scale(this.needle.vx >= 0 ? 1 : -1, 1);
    drawNeedlefish(ctx, this.needle.radius, { age: this.time });
    ctx.restore();

    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, "THE ARCHER'S MANGROVE", W / 2, 28, { size: 23, color: COLORS.text, glow: 'rgba(160, 220, 150, 0.5)', glowBlur: 16 });
    drawText(ctx, `LIVES ${this.lives}`, 24, 26, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < ARCHER.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 48, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }

    const prog = clamp(this.eaten / ARCHER.insectGoal, 0, 1);
    fillRoundRect(ctx, W - 264, 26, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 264, 26, 240 * prog, 10, 5, '#a8d86a');
    drawText(ctx, `INSECTS ${this.eaten}/${ARCHER.insectGoal}`, W - 264, 52, { size: 12, color: COLORS.textDim, align: 'left' });

    if (this.statusTimer > 0) {
      drawText(ctx, this.status, W / 2, 56, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    drawText(ctx, 'WASD / ARROWS \u2014 SWIM      CLICK / SPACE \u2014 SPIT A JET      ESC \u2014 BACK', W / 2, H - 14, {
      size: 10,
      color: COLORS.textDim,
      alpha: 0.72,
    });
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.3, { width: W, height: H, time: this.time, caption: 'CAUGHT \u2014 TRY AGAIN!', radius: 60 });
      return;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.93)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(1.6, 1.6);
    drawNeedlefish(ctx, 40, { age: this.time });
    ctx.restore();
    drawText(ctx, this.scareReason, W / 2, H - 60, { size: 16, color: COLORS.danger });
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
    return "THE ARCHER'S MANGROVE";
  }

  resultsHeadline() {
    return this.won ? 'A PERFECT SHOT, AGAIN AND AGAIN' : 'THE NEEDLEFISH GOT YOU';
  }

  resultsDetail() {
    return `${this.eaten} INSECTS \u00B7 ${this.lives} LIVES LEFT`;
  }
}
