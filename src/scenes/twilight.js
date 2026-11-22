import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { drawHatchetFish, drawLoosejaw } from '../entities/deepfish.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import {
  CONTROLS,
  COLORS,
  TWILIGHT,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

export class TwilightScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'twilight';
  }

  buildRound() {
    const C = TWILIGHT;
    this.phase = 'play';
    this.worldLength = C.worldLength;
    this.exitZone = { x: this.worldLength - 170 };
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.status = 'STAY DARK \u2014 SWIM SLOWLY TO GO UNSEEN';
    this.statusTimer = 4;
    this.flashCooldown = 0;
    this.flashPulse = 0;
    this.decoys = [];
    this.camX = 0;

    this.snow = [];
    for (let i = 0; i < 70; i += 1) {
      this.snow.push({
        x: rand(0, this.worldLength),
        y: rand(C.topBound, C.bottomBound),
        r: rand(0.6, 1.9),
        sp: rand(5, 20),
        ph: rand(0, TAU),
      });
    }

    this.fish = [];
    for (let i = 0; i < 16; i += 1) {
      this.fish.push({
        x: rand(120, this.worldLength - 120),
        y: rand(C.topBound + 30, C.bottomBound - 30),
        ph: rand(0, TAU),
        sp: rand(20, 60),
        dir: Math.random() < 0.5 ? -1 : 1,
      });
    }

    this.player = {
      x: C.startX,
      y: LOGICAL_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: 20,
      facing: 1,
      glow: 0.2,
      dimTimer: 0,
      flash: 0,
    };

    this.hunter = {
      x: C.startX - 520,
      y: LOGICAL_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: C.hunterRadius,
      heading: 0,
      jaw: 0.75,
      swing: 0,
      bitePhase: 'none',
      caught: false,
      grabbed: false,
      alert: 0,
      state: 'patrol',
      timer: 0,
      target: null,
      phase: rand(0, TAU),
      patrolY: LOGICAL_HEIGHT / 2,
      patrolDir: 1,
    };
  }

  firstPersonActor() {
    return this.player;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 150, endFreq: 50, type: 'sawtooth', duration: 0.4, volume: 0.3 });
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
    const C = TWILIGHT;
    p.x = clamp(p.x - 220, C.startX, this.worldLength - 40);
    p.y = LOGICAL_HEIGHT / 2;
    p.vx = 0;
    p.vy = 0;
    p.glow = 0.15;
    p.dimTimer = 0;
    p.flash = 0;
    const m = this.hunter;
    m.x = clamp(p.x - 900, 40, this.worldLength - 40);
    m.y = LOGICAL_HEIGHT / 2;
    m.vx = 0;
    m.vy = 0;
    m.state = 'recover';
    m.timer = 1.4;
    m.target = null;
    m.alert = 0;
    m.jaw = 0.75;
    m.swing = 0;
    m.bitePhase = 'none';
    m.caught = false;
    m.grabbed = false;
    this.decoys = [];
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'THE DARK TOOK YOU BACK \u2014 SLIP AWAY AGAIN';
    this.statusTimer = 2;
  }

  lightScore(x, y, bright) {
    const m = this.hunter;
    const d = Math.hypot(x - m.x, y - m.y);
    if (d > TWILIGHT.hunterSense) return null;
    return { score: bright * (1 - d / TWILIGHT.hunterSense), x, y };
  }

  senseLight() {
    let best = null;
    for (const d of this.decoys) {
      const s = this.lightScore(d.x, d.y, d.life / TWILIGHT.flashLife);
      if (s && (!best || s.score > best.score)) best = { ...s, kind: 'decoy', ref: d };
    }
    const ps = this.lightScore(this.player.x, this.player.y, this.player.glow);
    if (ps && (!best || ps.score > best.score)) best = { ...ps, kind: 'player', ref: this.player };
    return best;
  }

  hunterPatrol(dt) {
    const m = this.hunter;
    const C = TWILIGHT;
    m.timer -= dt;
    if (m.timer <= 0) {
      m.timer = rand(1.6, 3.2);
      m.patrolY = rand(C.topBound + 20, C.bottomBound - 20);
      m.patrolDir = Math.random() < 0.5 ? -1 : 1;
    }
    m.vx += (m.patrolDir * C.hunterSpeed - m.vx) * (1 - Math.exp(-2 * dt));
    m.vy += ((m.patrolY - m.y) * 0.6 - m.vy) * (1 - Math.exp(-2 * dt));
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    if (m.x <= 60) m.patrolDir = 1;
    else if (m.x >= this.worldLength - 60) m.patrolDir = -1;
    m.x = clamp(m.x, 40, this.worldLength - 40);
    m.y = clamp(m.y, C.topBound, C.bottomBound);
    if (Math.abs(m.vx) > 2) m.heading = Math.atan2(m.vy * 0.5, m.vx);
  }

  hunterDrift(dt) {
    const m = this.hunter;
    m.vx *= Math.exp(-2 * dt);
    m.vy *= Math.exp(-2 * dt);
    m.x = clamp(m.x + m.vx * dt * 0.4, 40, this.worldLength - 40);
    m.y = clamp(m.y + m.vy * dt * 0.4, TWILIGHT.topBound, TWILIGHT.bottomBound);
  }

  updateHunter(dt) {
    const m = this.hunter;
    const C = TWILIGHT;
    m.phase += dt;
    m.alert = Math.max(0, m.alert - dt * 0.7);
    const detected = this.senseLight();

    if (m.state === 'recover') {
      m.timer -= dt;
      m.jaw += (0.75 - m.jaw) * (1 - Math.exp(-6 * dt));
      m.swing += (0 - m.swing) * (1 - Math.exp(-8 * dt));
      this.hunterDrift(dt);
      if (m.timer <= 0) m.state = 'patrol';
      return;
    }

    if (m.state === 'patrol') {
      m.jaw += (0.75 - m.jaw) * (1 - Math.exp(-6 * dt));
      m.swing += (0 - m.swing) * (1 - Math.exp(-8 * dt));
      this.hunterPatrol(dt);
      if (detected && detected.score > 0.3) {
        m.state = 'charge';
        m.alert = 1;
        m.target = detected.kind === 'decoy'
          ? { kind: 'decoy', ref: detected.ref }
          : { kind: 'player', ref: null };
        this.game.audio.tone({ freq: 110, endFreq: 70, type: 'sawtooth', duration: 0.35, volume: 0.22 });
      }
      return;
    }

    if (m.state === 'bite') {
      m.timer -= dt;
      const smooth = (p) => {
        const q = clamp(p, 0, 1);
        return q * q * (3 - 2 * q);
      };
      const dur = m.timer + dt;
      if (m.bitePhase === 'windup') {
        const e = smooth(dur > 0 ? 1 - Math.max(0, m.timer) / dur : 1);
        m.swing = m.biteSwing0 + (1 - m.biteSwing0) * e;
        m.jaw = m.biteJaw0 + (1 - m.biteJaw0) * e;
        if (m.timer <= 0) {
          m.bitePhase = 'shut';
          m.timer = 0.06;
          m.biteJaw1 = m.jaw;
        }
      } else {
        const e = smooth(dur > 0 ? 1 - Math.max(0, m.timer) / dur : 1);
        m.swing = 1;
        m.jaw = m.biteJaw1 * (1 - e);
        if (m.timer <= 0) {
          this.game.audio.tone({ freq: 80, endFreq: 55, type: 'square', duration: 0.14, volume: 0.26 });
          m.bitePhase = 'none';
          if (m.target && m.target.kind === 'decoy') {
            if (m.target.ref && m.target.ref.life > 0) {
              const bait = m.target.ref;
              bait.life = 0;
              this.decoys = this.decoys.filter((d) => d !== bait);
              this.particles.burst(m.x, m.y, { count: 16, speed: 190, life: 0.5, colors: ['#bff0ff', '#ffffff'], buoyancy: -40 });
              this.game.audio.tone({ freq: 260, endFreq: 120, type: 'square', duration: 0.12, volume: 0.18 });
            }
            m.state = 'recover';
            m.timer = C.hunterRecover;
          } else {
            const near = Math.hypot(this.player.x - m.x, this.player.y - m.y)
              < C.hunterBiteRadius + this.player.radius;
            if (near && this.invuln <= 0) {
              this.player.x = m.x;
              this.player.y = m.y;
              this.player.vx = 0;
              this.player.vy = 0;
              if (this.catchPlayer('THE STOPLIGHT LOOSEJAW SNAPPED YOU UP')) return;
            }
            m.state = 'recover';
            m.timer = C.hunterRecover;
          }
        }
      }
      m.x = clamp(m.x + m.vx * dt * 0.2, 40, this.worldLength - 40);
      m.y = clamp(m.y + m.vy * dt * 0.2, C.topBound, C.bottomBound);
      return;
    }

    m.jaw += (0.9 - m.jaw) * (1 - Math.exp(-10 * dt));
    m.swing += (0 - m.swing) * (1 - Math.exp(-10 * dt));
    m.alert = 1;
    let tx;
    let ty;
    let kind = m.target ? m.target.kind : 'player';
    let lost = false;
    if (kind === 'decoy') {
      if (m.target.ref && m.target.ref.life > 0) {
        tx = m.target.ref.x;
        ty = m.target.ref.y;
      } else if (detected && detected.kind === 'player' && detected.score > 0.3) {
        kind = 'player';
        m.target = { kind: 'player', ref: null };
        tx = this.player.x;
        ty = this.player.y;
      } else {
        lost = true;
      }
    } else if (this.player.glow > 0.25) {
      tx = this.player.x;
      ty = this.player.y;
    } else if (detected && detected.kind === 'decoy') {
      kind = 'decoy';
      m.target = { kind: 'decoy', ref: detected.ref };
      tx = detected.x;
      ty = detected.y;
    } else {
      lost = true;
    }

    if (lost) {
      m.state = 'recover';
      m.timer = C.hunterRecover;
      return;
    }

    const dx = tx - m.x;
    const dy = ty - m.y;
    const dist = Math.hypot(dx, dy) || 1;
    m.vx += ((dx / dist) * C.hunterChargeSpeed - m.vx) * (1 - Math.exp(-C.hunterTurn * dt));
    m.vy += ((dy / dist) * C.hunterChargeSpeed - m.vy) * (1 - Math.exp(-C.hunterTurn * dt));
    m.x = clamp(m.x + m.vx * dt, 40, this.worldLength - 40);
    m.y = clamp(m.y + m.vy * dt, C.topBound, C.bottomBound);
    m.heading = Math.atan2(m.vy, m.vx);

    if (dist < C.hunterBiteRadius + this.player.radius && kind === 'player') {
      if (this.invuln <= 0) {
        m.state = 'bite';
        m.bitePhase = 'windup';
        m.timer = C.hunterBiteTime;
        m.caught = false;
        m.grabbed = false;
        m.biteSwing0 = m.swing;
        m.biteJaw0 = m.jaw;
        m.target = { kind: 'player', ref: null };
        m.vx *= 0.2;
        m.vy *= 0.2;
        this.game.audio.tone({ freq: 90, endFreq: 60, type: 'square', duration: 0.12, volume: 0.2 });
      } else {
        m.state = 'recover';
        m.timer = C.hunterRecover;
      }
    } else if (dist < C.hunterBiteRadius && kind === 'decoy' && m.target.ref) {
      m.state = 'bite';
      m.bitePhase = 'windup';
      m.timer = C.hunterBiteTime;
      m.caught = false;
      m.grabbed = false;
      m.biteSwing0 = m.swing;
      m.biteJaw0 = m.jaw;
      m.vx *= 0.2;
      m.vy *= 0.2;
      this.game.audio.tone({ freq: 90, endFreq: 60, type: 'square', duration: 0.12, volume: 0.2 });
    }
  }

  updateRound(dt, input) {
    const C = TWILIGHT;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.flashCooldown = Math.max(0, this.flashCooldown - dt);
    this.flashPulse = Math.max(0, this.flashPulse - dt * 2);
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
    p.x = clamp(p.x + p.vx * dt, 20, this.worldLength - 20);
    p.y = clamp(p.y + p.vy * dt, C.topBound, C.bottomBound);
    if (dirX !== 0) p.facing = dirX > 0 ? 1 : -1;

    p.dimTimer = Math.max(0, p.dimTimer - dt);
    p.flash = Math.max(0, p.flash - dt * 2.2);
    const speed = Math.hypot(p.vx, p.vy);
    const visible = clamp(speed / C.glowSprint, 0, 1);
    p.glow = p.dimTimer > 0 ? 0.05 : 0.18 + visible * 0.72;

    const flashPressed = input.wasPressed('confirm') || input.wasPressed('tool');
    if (flashPressed && this.flashCooldown <= 0 && p.dimTimer <= 0) {
      this.flashCooldown = C.flashCooldown;
      this.flashPulse = 1;
      p.flash = 1;
      p.dimTimer = C.dimTime;
      this.decoys.push({ x: p.x, y: p.y, vx: p.vx * 0.2, vy: -8, life: C.flashLife, phase: rand(0, TAU) });
      this.game.audio.tone({ freq: 540, endFreq: 180, type: 'sine', duration: 0.32, volume: 0.22 });
    }

    for (const d of this.decoys) {
      d.life -= dt;
      d.phase += dt * 4;
      d.x += (d.vx + Math.sin(d.phase) * 8) * dt;
      d.y += d.vy * dt;
    }
    this.decoys = this.decoys.filter((d) => d.life > 0);

    for (const flake of this.snow) {
      flake.ph += dt;
      flake.y += flake.sp * dt;
      flake.x += Math.sin(flake.ph) * 6 * dt;
      if (flake.y > C.bottomBound) {
        flake.y = C.topBound;
        flake.x = rand(0, this.worldLength);
      }
    }

    for (const f of this.fish) {
      f.ph += dt;
      const fleeing = Math.hypot(f.x - this.hunter.x, f.y - this.hunter.y) < 150;
      f.x += f.sp * (fleeing ? 4.5 : 1) * f.dir * dt;
      f.y += Math.sin(f.ph) * 8 * dt;
      if (f.x < 60) f.dir = 1;
      else if (f.x > this.worldLength - 60) f.dir = -1;
      f.y = clamp(f.y, C.topBound, C.bottomBound);
    }

    this.updateHunter(dt);
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
    sky.addColorStop(0, '#0e4460');
    sky.addColorStop(0.45, '#062334');
    sky.addColorStop(1, '#01080f');
    ctx.fillStyle = sky;
    ctx.fillRect(this.camX - 20, 0, LOGICAL_WIDTH + 40, LOGICAL_HEIGHT);

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#bfe9ff';
    for (let i = 0; i < 5; i += 1) {
      const bx = this.camX + ((this.time * 8 + i * 260) % (LOGICAL_WIDTH + 320)) - 160;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 60, 0);
      ctx.lineTo(bx + 220, LOGICAL_HEIGHT);
      ctx.lineTo(bx + 120, LOGICAL_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(200, 230, 255, 0.5)';
    for (const flake of this.snow) {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.r, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(120, 180, 210, 0.55)';
    for (const f of this.fish) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(f.dir, 1);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 2.6, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-11, -4);
      ctx.lineTo(-11, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(150, 235, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(3, 1, 1.1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(120, 180, 210, 0.55)';
      ctx.restore();
    }

    this.renderExit(ctx);
    for (const d of this.decoys) this.renderDecoy(ctx, d);
    this.renderHunter(ctx);
    this.renderPlayer(ctx);
    this.particles.render(ctx);
    ctx.restore();
  }

  renderExit(ctx) {
    const x = this.exitZone.x;
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#bff0ff';
    ctx.fillRect(x - 40, 0, 80, LOGICAL_HEIGHT);
    ctx.restore();
    ctx.strokeStyle = 'rgba(191, 240, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 40, 0, 80, LOGICAL_HEIGHT);
    drawText(ctx, 'THE FAR DARK', x, 40, { size: 15, color: COLORS.bubble });
  }

  renderDecoy(ctx, d) {
    const t = d.life / TWILIGHT.flashLife;
    ctx.save();
    ctx.globalAlpha = t;
    const halo = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, 70);
    halo.addColorStop(0, 'rgba(191, 240, 255, 0.9)');
    halo.addColorStop(0.4, 'rgba(140, 220, 255, 0.4)');
    halo.addColorStop(1, 'rgba(140, 220, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 70, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(223, 250, 255, 0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i += 1) {
      const rr = ((this.time * 60 + i * 40) % 80);
      ctx.globalAlpha = t * (1 - rr / 80) * 0.7;
      ctx.beginPath();
      ctx.arc(d.x, d.y, rr, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderHunter(ctx) {
    const m = this.hunter;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.heading);
    if (Math.cos(m.heading) < 0) ctx.scale(1, -1);
    if (m.state === 'patrol') ctx.globalAlpha = 0.85;
    drawLoosejaw(ctx, m.radius, { age: this.time, jawOpen: m.jaw, swing: m.swing, alert: m.alert });
    ctx.restore();
  }

  renderPlayer(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.facing, 1);
    drawHatchetFish(ctx, p.radius, {
      age: this.time,
      glow: p.glow,
      dim: p.dimTimer > 0 ? 1 : 0,
      flash: p.flash,
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
    ctx.translate(LOGICAL_WIDTH / 2 + 40, LOGICAL_HEIGHT / 2);
    const s = 1.1 + (1 - this.scareTimer / 1.3) * 1.1;
    ctx.scale(s, s);
    drawLoosejaw(ctx, 46, { age: this.time, jawOpen: 0, swing: 1, alert: 1 });
    ctx.restore();
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE TWILIGHT TANK', LOGICAL_WIDTH / 2, 30, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(143, 224, 239, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 28, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < TWILIGHT.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 50, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }

    const progress = clamp(this.player.x / this.exitZone.x, 0, 1);
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 28, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 28, 240 * progress, 10, 5, '#ffd166');

    drawText(ctx, 'YOUR GLOW', LOGICAL_WIDTH - 264, 54, { size: 11, color: COLORS.textDim, align: 'left' });
    fillRoundRect(ctx, LOGICAL_WIDTH - 180, 46, 156, 10, 5, 'rgba(6, 20, 26, 0.8)');
    const glowColor = this.player.glow > 0.6 ? COLORS.danger : '#8fe0ef';
    fillRoundRect(ctx, LOGICAL_WIDTH - 180, 46, 156 * clamp(this.player.glow, 0, 1), 10, 5, glowColor);

    const ready = this.flashCooldown <= 0;
    drawText(
      ctx,
      ready ? 'FLASH READY \u2014 SPACE' : `FLASH ${this.flashCooldown.toFixed(1)}s`,
      LOGICAL_WIDTH / 2,
      92,
      { size: 13, color: ready ? '#bff0ff' : COLORS.textDim, alpha: ready ? 0.95 : 0.7 },
    );

    if (this.player.dimTimer > 0) {
      drawText(ctx, 'COUNTER-ILLUMINATED \u2014 SPENT', LOGICAL_WIDTH / 2, 112, { size: 12, color: '#8fe0ef', alpha: 0.9 });
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 112, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    if (this.hunter.alert > 0.5) {
      drawText(ctx, 'IT SEES YOU!', LOGICAL_WIDTH / 2, 60, {
        size: 16,
        color: COLORS.danger,
        alpha: 0.6 + 0.4 * Math.sin(this.time * 14),
      });
    }

    drawText(ctx, 'WASD / ARROWS \u2014 SWIM      SPACE \u2014 FLASH A DECOY      ESC \u2014 BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 14, {
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
    return 'THE TWILIGHT TANK';
  }

  resultsHeadline() {
    return this.won ? 'YOU SLIPPED INTO THE DARK' : 'THE LOOSEJAW FOUND YOU';
  }

  resultsDetail() {
    return `${this.lives} LIVES LEFT`;
  }
}
