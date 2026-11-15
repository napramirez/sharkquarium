import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { circleOverlap } from '../engine/collision.js';
import { Cuttlefish, drawCuttlefishBody } from '../entities/cuttlefish.js';
import { drawOctopusBody } from '../entities/octopus.js';
import { drawDolphinBody } from '../entities/dolphin.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import { checkAchievements } from '../engine/achievements.js';
import {
  CONTROLS,
  COLORS,
  COASTAL_PALETTE,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const ARENA = { top: 60, bottom: LOGICAL_HEIGHT - 50 };
const LIVES = 3;
const FEAR_RANGE = 104;
const PULSE_RANGE = 150;

export class CuttlefishScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'cuttlefish';
  }

  buildRound() {
    this.phase = 'play';
    this.worldLength = 4200;
    this.startX = 220;
    this.exitZone = { x: this.worldLength - 240 };
    this.lives = LIVES;
    this.invuln = 0;
    this.slugCount = 0;
    this.octoCount = 0;
    this.prey = [];
    this.pulses = [];
    this.pulseTimer = 0;
    this.status = 'HOLD RIGHT CLICK TO CAMOUFLAGE — SLUGS POISON IF THEY SEE YOU';
    this.statusTimer = 4;
    this.scareTimer = 0;
    this.scareReason = '';
    this.turtles = [];
    for (let i = 0; i < 8; i += 1) {
      this.prey.push(this.makeSlug(this.startX + 400 + i * 460 + rand(-60, 60), rand(ARENA.top + 60, ARENA.bottom - 60)));
    }
    for (let i = 0; i < 4; i += 1) {
      this.prey.push(this.makeOcto(this.startX + 700 + i * 900 + rand(-80, 80), rand(ARENA.top + 70, ARENA.bottom - 70)));
    }
    for (let i = 0; i < 5; i += 1) {
      this.turtles.push({
        x: rand(0, LOGICAL_WIDTH + this.worldLength * 0.4),
        y: rand(90, LOGICAL_HEIGHT - 90),
        size: rand(20, 34),
        dir: rand() < 0.5 ? -1 : 1,
        speed: rand(18, 42),
        phase: rand(0, TAU),
      });
    }
    this.corals = [];
    const coralColors = ['#ff7f6b', '#ff9f43', '#e056a0', '#7bdff2', '#c1a3ff'];
    let coralX = 90;
    while (coralX < this.worldLength - 90) {
      this.corals.push({
        x: coralX,
        y: LOGICAL_HEIGHT - 24 + rand(-3, 6),
        size: rand(14, 32),
        type: rand() < 0.5 ? 'branch' : 'fan',
        color: coralColors[Math.min(4, Math.floor(rand(0, 5)))],
        phase: rand(0, TAU),
      });
      coralX += rand(90, 190);
    }
    this.bgCorals = [];
    const bgColors = ['#ff8f6b', '#ffb04f', '#d96fb4', '#6fc8e8', '#a48fe0'];
    let bgX = 40;
    while (bgX < this.worldLength * 0.62 + LOGICAL_WIDTH) {
      this.bgCorals.push({
        x: bgX + rand(-24, 24),
        size: rand(26, 96),
        width: rand(0.5, 1.4),
        type: rand() < 0.55 ? 'branch' : 'fan',
        color: bgColors[Math.min(4, Math.floor(rand(0, 5)))],
        phase: rand(0, TAU),
      });
      bgX += rand(70, 150);
    }
    this.dolphins = [];
    for (let i = 0; i < 5; i += 1) {
      this.dolphins.push({ x: 0, y: 0, size: rand(26, 42), active: false, phase: rand(0, TAU), vx: 0 });
    }
    this.podActive = false;
    this.podTimer = rand(9, 14);
    this.podDir = 1;
    this.podWarn = 0;
    const player = new Cuttlefish(this.startX, LOGICAL_HEIGHT / 2, { controls: CONTROLS.solo, pointer: true });
    player.maxX = this.worldLength;
    player.noIdleFlip = true;
    this.players = [player];
    this.player = player;
  }

  makeSlug(x, y) {
    return { kind: 'slug', x, y, radius: 16, phase: rand(0, TAU), fear: 0, drag: 0, dragT: 0, eaten: false };
  }

  makeOcto(x, y) {
    return {
      kind: 'octo', x, y, radius: 10, phase: rand(0, TAU), stun: 0, jetTimer: rand(0, 1.5),
      vx: 0, vy: 0, heading: rand(-Math.PI, Math.PI), armPhase: rand(0, TAU), drag: 0, dragT: 0, eaten: false,
    };
  }

  firstPersonActor() {
    return this.players[0] ?? null;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 130, endFreq: 50, type: 'sawtooth', duration: 0.4, volume: 0.28 });
    if (this.lives <= 0) {
      this.finish(false);
      return true;
    }
    this.phase = 'scare';
    this.scareTimer = 1.4;
    return true;
  }

  respawn() {
    const player = this.player;
    player.x = Math.max(this.startX, player.x - 260);
    player.y = LOGICAL_HEIGHT / 2;
    player.vx = 0;
    player.vy = 0;
    for (const p of this.prey) {
      if (p.kind === 'slug') p.fear = 0;
    }
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'SHAKE IT OFF — CAMOUFLAGE BEFORE YOU APPROACH';
    this.statusTimer = 2;
  }

  updatePod(dt) {
    const player = this.player;
    if (!this.podActive) {
      this.podTimer -= dt;
      if (this.podTimer <= 0) {
        this.podActive = true;
        this.podDir = Math.random() < 0.5 ? -1 : 1;
        const startX = this.podDir > 0 ? this.camX - 160 : this.camX + LOGICAL_WIDTH + 160;
        const baseY = clamp(player.y, ARENA.top + 70, ARENA.bottom - 70);
        for (let i = 0; i < this.dolphins.length; i += 1) {
          const d = this.dolphins[i];
          d.active = true;
          d.x = startX - this.podDir * i * 74;
          d.y = clamp(baseY + (i - 2) * 48 + rand(-16, 16), ARENA.top + 30, ARENA.bottom - 20);
          d.vx = this.podDir * (300 + i * 12);
          d.phase = rand(0, TAU);
        }
        this.podWarn = 1.8;
        this.game.audio.tone({ freq: 170, endFreq: 110, type: 'sine', duration: 0.6, volume: 0.2 });
      }
      return false;
    }

    let anyOn = false;
    const visible = player.camo < 0.5;
    for (const d of this.dolphins) {
      if (!d.active) continue;
      d.x += d.vx * dt;
      d.phase += dt;
      if (visible && Math.hypot(d.x - player.x, d.y - player.y) < d.size * 1.9) {
        this.catchPlayer('THE DOLPHIN POD ATE YOU');
        return true;
      }
      const off = this.podDir > 0
        ? d.x > this.camX + LOGICAL_WIDTH + 200
        : d.x < this.camX - 200;
      if (off) d.active = false;
      else anyOn = true;
    }
    if (!anyOn) {
      this.podActive = false;
      this.podTimer = rand(7, 12);
    }
    return false;
  }

  renderPod(ctx) {
    for (const d of this.dolphins) {
      if (!d.active) continue;
      this.renderDolphin(ctx, d);
    }
  }

  renderDolphin(ctx, d) {
    const dir = d.vx >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(dir, 1);
    drawDolphinBody(ctx, d.size, { phase: d.phase });
    ctx.restore();
  }

  updatePrey(dt) {
    const player = this.player;
    for (const p of this.prey) {
      p.phase += dt;
      if (p.kind === 'octo') p.armPhase += dt * 3;
      if (p.eaten) continue;
      if (p.drag) {
        p.dragT += dt;
        p.x += (player.x - p.x) * Math.min(1, dt * 12);
        p.y += (player.y - p.y) * Math.min(1, dt * 12);
        if (p.dragT > 0.4) {
          p.eaten = true;
          if (p.kind === 'slug') this.slugCount += 1;
          else this.octoCount += 1;
          this.particles.burst(p.x, p.y, { count: 14, speed: 170, life: 0.5, colors: ['#ffb3d9', '#ffffff'], buoyancy: -20 });
          this.game.audio.tone({ freq: 560, endFreq: 920, type: 'triangle', duration: 0.12, volume: 0.16 });
          checkAchievements({ cuttlefishEats: this.slugCount + this.octoCount });
        }
        continue;
      }
      if (p.kind === 'slug') {
        p.x += Math.sin(p.phase * 1.3) * 6 * dt;
        const near = Math.hypot(p.x - player.x, p.y - player.y) < FEAR_RANGE;
        const seen = near && player.camo < 0.5;
        p.fear = clamp(p.fear + (seen ? dt * 0.9 : -dt * 0.8), 0, 1);
        if (p.fear >= 1) {
          this.particles.burst(p.x, p.y, { count: 16, speed: 120, life: 0.7, colors: ['#9be564', '#6fae3a'], buoyancy: 40 });
          if (this.catchPlayer('THE FRIGHTENED SLUG POISONED YOU')) return;
        }
      } else {
        p.stun = Math.max(0, p.stun - dt * 0.5);
        p.jetTimer -= dt;
        if (p.stun > 0) {
          p.vx *= Math.exp(-dt * 4);
          p.vy *= Math.exp(-dt * 4);
        } else {
          const d = Math.hypot(p.x - player.x, p.y - player.y) || 1;
          if (d < 220) {
            p.vx = ((p.x - player.x) / d) * 230;
            p.vy = ((p.y - player.y) / d) * 190;
          } else if (p.jetTimer <= 0 && Math.random() < dt * 0.8) {
            p.jetTimer = 1.4;
            p.vx = rand(-1, 1) * 190;
            p.vy = rand(-1, 1) * 150;
          } else {
            p.vx *= Math.exp(-dt * 2.5);
            p.vy *= Math.exp(-dt * 2.5);
          }
        }
        p.x = clamp(p.x + p.vx * dt, 40, this.worldLength - 40);
        p.y = clamp(p.y + p.vy * dt, ARENA.top + p.radius, ARENA.bottom - p.radius);
        if (Math.hypot(p.vx, p.vy) > 8) p.heading = Math.atan2(p.vy, p.vx);
      }
    }
  }

  updateRound(dt, input) {
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }
    const player = this.player;
    player.update(dt, input);
    this.camX = clamp(player.x - LOGICAL_WIDTH * 0.4, 0, Math.max(0, this.worldLength - LOGICAL_WIDTH));
    for (const turtle of this.turtles) {
      turtle.phase += dt;
      turtle.x += turtle.dir * turtle.speed * dt;
    }
    this.podWarn = Math.max(0, this.podWarn - dt);
    if (this.updatePod(dt)) return;

    for (const pulse of this.pulses) {
      pulse.life -= dt;
      pulse.r += (pulse.max - pulse.r) * Math.min(1, dt * 6);
    }
    this.pulses = this.pulses.filter((pulse) => pulse.life > 0);

    this.pulseTimer -= dt;
    if (input.isDown('cycleAnchor') && this.pulseTimer <= 0) {
      this.pulseTimer = 0.34;
      this.pulses.push({ x: player.x, y: player.y, r: player.radius * 0.7, max: PULSE_RANGE, life: 0.5, maxLife: 0.5 });
      this.game.audio.tone({ freq: 300, endFreq: 560, type: 'sine', duration: 0.18, volume: 0.12 });
      for (const p of this.prey) {
        if (p.kind !== 'octo' || p.eaten || p.drag) continue;
        if (Math.hypot(p.x - player.x, p.y - player.y) < PULSE_RANGE) p.stun = 1;
      }
    }

    if (input.wasPressed('confirm')) {
      player.fireTentacles();
      const grab = {
        x: player.x + player.facing * player.radius * 3.0,
        y: player.y,
        radius: player.radius * 1.9,
      };
      for (const p of this.prey) {
        if (p.eaten || p.drag || !circleOverlap(grab, p)) continue;
        if (p.kind === 'octo' && p.stun <= 0) continue;
        p.drag = 1;
        p.dragT = 0;
      }
    }

    this.updatePrey(dt);
    if (this.phase !== 'play') return;
    if (player.x >= this.exitZone.x) this.finish(true);
  }

  renderRound(ctx) {
    this.renderTurtles(ctx);
    this.renderBgCorals(ctx);
    ctx.save();
    ctx.translate(-this.camX, 0);
    this.renderSeabed(ctx);
    ctx.fillStyle = 'rgba(200, 240, 255, 0.08)';
    ctx.fillRect(this.camX - 40, ARENA.top, LOGICAL_WIDTH + 80, ARENA.bottom - ARENA.top);
    for (let x = Math.floor(this.camX / 160) * 160; x < this.camX + LOGICAL_WIDTH + 160; x += 160) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, LOGICAL_HEIGHT);
      ctx.stroke();
    }
    this.renderExit(ctx);
    for (const p of this.prey) {
      if (p.eaten) continue;
      if (p.kind === 'slug') this.renderSlug(ctx, p);
      else this.renderOcto(ctx, p);
    }
    this.renderPod(ctx);
    this.renderPulses(ctx);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
    ctx.restore();
    if (this.phase === 'scare') this.renderScare(ctx);
  }

  renderBgCorals(ctx) {
    ctx.save();
    ctx.translate(-this.camX * 0.55, 0);
    const left = this.camX * 0.55 - 140;
    const right = this.camX * 0.55 + LOGICAL_WIDTH + 140;
    for (const c of this.bgCorals) {
      if (c.x < left || c.x > right) continue;
      this.renderBgCoral(ctx, c);
    }
    ctx.restore();
  }

  renderBgCoral(ctx, c) {
    const s = c.size;
    ctx.save();
    ctx.translate(c.x, LOGICAL_HEIGHT + 6);
    ctx.rotate(Math.sin(this.time * 0.9 + c.phase) * 0.06);
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = c.color;
    ctx.lineCap = 'round';
    if (c.type === 'branch') {
      ctx.lineWidth = s * 0.16;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -s);
      ctx.stroke();
      ctx.lineWidth = s * 0.1;
      for (const [ax, ay] of [[-0.55, -0.55], [0.55, -0.55], [-0.3, -0.88], [0.3, -0.88], [-0.75, -0.72], [0.75, -0.72]]) {
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.45);
        ctx.lineTo(ax * s * c.width, ay * s);
        ctx.stroke();
      }
    } else {
      ctx.lineWidth = s * 0.06;
      for (let i = 0; i < 6; i += 1) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.26;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(Math.cos(a) * s * 0.5 * c.width, Math.sin(a) * s * 0.5, Math.cos(a) * s * c.width, Math.sin(a) * s);
        ctx.stroke();
      }
      ctx.lineWidth = s * 0.04;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderTurtles(ctx) {
    const span = LOGICAL_WIDTH + 200;
    ctx.save();
    ctx.translate(-this.camX * 0.4, 0);
    for (const turtle of this.turtles) {
      const sx = ((turtle.x % span) + span) % span - 100;
      this.renderTurtle(ctx, sx, turtle);
    }
    ctx.restore();
  }

  renderTurtle(ctx, x, turtle) {
    const s = turtle.size;
    ctx.save();
    ctx.translate(x, turtle.y);
    ctx.scale(turtle.dir, 1);
    const flap = Math.sin(turtle.phase * 1.6) * 0.5;
    ctx.fillStyle = 'rgba(90, 150, 170, 0.55)';
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(s * 0.4, side * s * 0.5);
      ctx.rotate(side * (0.6 + flap * 0.5));
      ctx.beginPath();
      ctx.ellipse(s * 0.7, 0, s * 0.7, s * 0.26, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(-s * 0.7, side * s * 0.5);
      ctx.rotate(side * (0.5 + flap * 0.4));
      ctx.beginPath();
      ctx.ellipse(-s * 0.5, 0, s * 0.5, s * 0.22, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(70, 120, 140, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.82, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40, 80, 95, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.55, s * 0.48, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(70, 120, 140, 0.8)';
    ctx.beginPath();
    ctx.ellipse(s * 1.05, 0, s * 0.26, s * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0c1b22';
    ctx.beginPath();
    ctx.arc(s * 1.18, -s * 0.06, 2.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderSeabed(ctx) {
    const left = this.camX - 80;
    const right = this.camX + LOGICAL_WIDTH + 80;
    ctx.fillStyle = '#1f6fa0';
    ctx.fillRect(left, LOGICAL_HEIGHT - 20, right - left, 34);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(left, LOGICAL_HEIGHT - 20, right - left, 4);
    for (const c of this.corals) {
      if (c.x < left || c.x > right) continue;
      this.renderCoral(ctx, c);
    }
  }

  renderCoral(ctx, c) {
    const s = c.size;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(Math.sin(this.time * 1.2 + c.phase) * 0.08);
    ctx.strokeStyle = c.color;
    ctx.lineCap = 'round';
    if (c.type === 'branch') {
      ctx.lineWidth = s * 0.18;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -s);
      ctx.stroke();
      ctx.lineWidth = s * 0.12;
      for (const [ax, ay] of [[-0.6, -0.55], [0.6, -0.55], [-0.34, -0.9], [0.34, -0.9]]) {
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.5);
        ctx.lineTo(ax * s, ay * s);
        ctx.stroke();
      }
    } else {
      ctx.lineWidth = s * 0.07;
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + (i - 2) * 0.28;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5, Math.cos(a) * s, Math.sin(a) * s);
        ctx.stroke();
      }
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.55, Math.PI, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderExit(ctx) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
    ctx.fillRect(this.exitZone.x - 50, 0, 100, LOGICAL_HEIGHT);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.exitZone.x - 50, 0, 100, LOGICAL_HEIGHT);
    drawText(ctx, 'WARMER WATERS', this.exitZone.x, 40, { size: 16, color: COLORS.accent });
  }

  renderPulses(ctx) {
    for (const pulse of this.pulses) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pulse.life / pulse.maxLife) * 0.6;
      ctx.strokeStyle = '#a0f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.r, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderSlug(ctx, slug) {
    const bob = Math.sin(this.time * 3 + slug.phase) * 3;
    ctx.save();
    ctx.translate(slug.x, slug.y + bob);
    if (slug.fear > 0.4) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.time * 20);
    }
    ctx.fillStyle = '#ff86c2';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd0ea';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(i * 7, -8, 3, 7, i * 0.22, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = '#ff86c2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, -3);
    ctx.lineTo(17, -8);
    ctx.moveTo(12, 1);
    ctx.lineTo(17, 4);
    ctx.stroke();
    ctx.restore();
  }

  renderOcto(ctx, octo) {
    const stunned = octo.stun > 0;
    ctx.save();
    ctx.translate(octo.x, octo.y);
    if (octo.drag) {
      const t = clamp(octo.dragT / 0.4, 0, 1);
      ctx.scale(1 - t * 0.6, 1 - t * 0.6);
    }
    const heading = stunned ? octo.heading + Math.sin(this.time * 3) * 0.3 : octo.heading;
    ctx.rotate(heading);
    drawOctopusBody(ctx, octo.radius, { alert: false, armPhase: octo.armPhase });
    if (stunned) {
      for (const side of [-1, 1]) {
        ctx.strokeStyle = '#4a3fb0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(octo.radius * 0.55, side * octo.radius * 0.42, octo.radius * 0.16, this.time * 4, this.time * 4 + Math.PI * 1.5);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.4, {
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        time: this.time,
        caption: 'POISONED — TRY AGAIN!',
        radius: 66,
      });
      return;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    const s = 1.3 + (1 - this.scareTimer / 1.4) * 1.6;
    ctx.scale(s, s);
    drawCuttlefishBody(ctx, 24, { age: this.time, camo: 0, splay: 1 });
    ctx.restore();
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'COASTAL TANK', LOGICAL_WIDTH / 2, 34, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(140, 220, 255, 0.55)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 30, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < LIVES; i += 1) {
      fillCircle(ctx, 42 + i * 22, 52, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    drawText(ctx, `SLUGS ${this.slugCount}  ·  OCTOPUSES ${this.octoCount}`, LOGICAL_WIDTH - 24, 30, {
      size: 15,
      color: '#ff9ed0',
      align: 'right',
    });
    const camo = this.player ? Math.round(this.player.camo * 100) : 0;
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 48, (240 * camo) / 100, 10, 5, '#7a5cff');
    drawText(ctx, `CAMO ${camo}%`, LOGICAL_WIDTH / 2, 70, { size: 11, color: COLORS.textDim });
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 92, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    if (this.podActive) {
      drawText(ctx, 'DOLPHIN POD — CAMOUFLAGE AND HIDE IN THE CORAL!', LOGICAL_WIDTH / 2, 112, {
        size: 15,
        color: COLORS.danger,
        alpha: 0.55 + 0.45 * Math.sin(this.time * 12),
      });
    }
    drawText(ctx, 'WASD / DRAG — SWIM   RIGHT CLICK — CAMOUFLAGE   SPACE — GRAB   HOLD E — HYPNO-COLOR-PULSE   ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.72,
    });
  }

  waterPalette() {
    return COASTAL_PALETTE;
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
    return 'COASTAL TANK';
  }

  resultsHeadline() {
    return this.won ? 'YOU REACHED WARMER WATERS' : 'THE SHALLOWS GOT YOU';
  }

  resultsDetail() {
    return `${this.slugCount} SLUGS · ${this.octoCount} OCTOPUSES EATEN`;
  }
}
