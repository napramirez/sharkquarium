import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { drawLoosejaw } from '../entities/deepfish.js';
import { drawGoblinShark } from '../entities/goblinshark.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import {
  CONTROLS,
  COLORS,
  GOBLIN,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;

export class GoblinDeepScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'goblindep';
  }

  buildRound() {
    const C = GOBLIN;
    this.phase = 'play';
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.meter = 0;
    this.charged = false;
    this.stoplight = false;
    this.beamAngle = 0;
    this.squidsEaten = 0;
    this.shrimpSpawn = 0;
    this.squidSpawn = 0;
    this.status = 'EAT SHRIMPS TO CHARGE YOUR RED STOPLIGHT';
    this.statusTimer = 4;

    this.motes = [];
    for (let i = 0; i < 80; i += 1) {
      this.motes.push({
        x: rand(0, W),
        y: rand(C.topBound, C.bottomBound),
        r: rand(0.5, 1.5),
        sp: rand(4, 16),
        ph: rand(0, TAU),
      });
    }

    this.shrimp = [];
    for (let i = 0; i < C.shrimpCount; i += 1) this.spawnShrimp();
    this.squids = [];
    for (let i = 0; i < C.squidCount; i += 1) this.spawnSquid();

    this.player = {
      x: 240,
      y: H / 2,
      vx: 0,
      vy: 0,
      radius: C.playerRadius,
      facing: 1,
      jaw: 0.75,
      swing: 0,
      bitePhase: 'none',
      biteTimer: 0,
      biteDur: 0,
      biteSwing0: 0,
      biteJaw0: 0.75,
      biteJaw1: 0.75,
    };

    this.shark = {
      x: W - 180,
      y: H / 2,
      vx: 0,
      vy: 0,
      radius: C.sharkRadius,
      heading: Math.PI,
      jaw: 0.2,
      jawExt: 0,
      alert: 0,
      state: 'patrol',
      phase: rand(0, TAU),
      timer: 0,
      cooldown: 0,
      shootPhase: 'none',
      patrolY: H / 2,
      patrolDir: -1,
    };
  }

  firstPersonActor() {
    return this.player;
  }

  startPlayerBite() {
    const p = this.player;
    if (p.bitePhase === 'none') {
      p.bitePhase = 'windup';
      p.biteDur = 0.14;
      p.biteTimer = p.biteDur;
      p.biteSwing0 = p.swing;
      p.biteJaw0 = p.jaw;
    }
  }

  updatePlayerBite(dt) {
    const p = this.player;
    const smooth = (q) => {
      const t = clamp(q, 0, 1);
      return t * t * (3 - 2 * t);
    };
    if (p.bitePhase === 'windup') {
      p.biteTimer -= dt;
      const dur = p.biteDur;
      const e = smooth(dur > 0 ? 1 - Math.max(0, p.biteTimer) / dur : 1);
      p.swing = p.biteSwing0 + (1 - p.biteSwing0) * e;
      p.jaw = p.biteJaw0 + (1 - p.biteJaw0) * e;
      if (p.biteTimer <= 0) {
        p.bitePhase = 'shut';
        p.biteDur = 0.06;
        p.biteTimer = p.biteDur;
        p.biteJaw1 = p.jaw;
      }
      return;
    }
    if (p.bitePhase === 'shut') {
      p.biteTimer -= dt;
      const dur = p.biteDur;
      const e = smooth(dur > 0 ? 1 - Math.max(0, p.biteTimer) / dur : 1);
      p.swing = 1;
      p.jaw = p.biteJaw1 * (1 - e);
      if (p.biteTimer <= 0) p.bitePhase = 'none';
      return;
    }
    p.swing += (0 - p.swing) * (1 - Math.exp(-8 * dt));
    p.jaw += (0.75 - p.jaw) * (1 - Math.exp(-6 * dt));
  }

  spawnShrimp() {
    const C = GOBLIN;
    const sp = rand(16, 36);
    const edge = Math.floor(rand(0, 4));
    let x;
    let y;
    let vx;
    let vy;
    if (edge === 0) {
      x = rand(60, W - 60);
      y = C.topBound;
      vx = rand(-sp, sp);
      vy = sp;
    } else if (edge === 1) {
      x = rand(60, W - 60);
      y = C.bottomBound;
      vx = rand(-sp, sp);
      vy = -sp;
    } else if (edge === 2) {
      x = 40;
      y = rand(C.topBound, C.bottomBound);
      vx = sp;
      vy = rand(-sp, sp);
    } else {
      x = W - 40;
      y = rand(C.topBound, C.bottomBound);
      vx = -sp;
      vy = rand(-sp, sp);
    }
    this.shrimp.push({ x, y, vx, vy, phase: rand(0, TAU), aim: rand(1, 3), r: 11 });
  }

  spawnSquid() {
    const C = GOBLIN;
    const sp = rand(30, 70);
    const edge = Math.floor(rand(0, 4));
    let x;
    let y;
    let vx;
    let vy;
    if (edge === 0) {
      x = rand(60, W - 60);
      y = C.topBound;
      vx = rand(-sp, sp);
      vy = sp;
    } else if (edge === 1) {
      x = rand(60, W - 60);
      y = C.bottomBound;
      vx = rand(-sp, sp);
      vy = -sp;
    } else if (edge === 2) {
      x = 40;
      y = rand(C.topBound, C.bottomBound);
      vx = sp;
      vy = rand(-sp, sp);
    } else {
      x = W - 40;
      y = rand(C.topBound, C.bottomBound);
      vx = -sp;
      vy = rand(-sp, sp);
    }
    this.squids.push({ x, y, vx, vy, phase: rand(0, TAU), aim: rand(1, 2.4), r: 13 });
  }

  headX() {
    return this.player.x + this.player.facing * this.player.radius * 1.05;
  }

  mouthX() {
    return this.shark.x + Math.cos(this.shark.heading) * this.shark.radius * 0.7;
  }

  mouthY() {
    return this.shark.y + Math.sin(this.shark.heading) * this.shark.radius * 0.7;
  }

  jawTip() {
    const C = GOBLIN;
    const reach = this.shark.radius * 0.9 + this.shark.jawExt * C.lungeReach;
    return {
      x: this.shark.x + Math.cos(this.shark.heading) * reach,
      y: this.shark.y + Math.sin(this.shark.heading) * reach,
    };
  }

  revealAmount(s) {
    if (!this.stoplight) return 0;
    const C = GOBLIN;
    const hx = this.headX();
    const hy = this.player.y;
    const dx = s.x - hx;
    const dy = s.y - hy;
    const d = Math.hypot(dx, dy);
    if (d > C.beamLength) return 0;
    let diff = Math.atan2(dy, dx) - this.beamAngle;
    diff = Math.abs(((diff + Math.PI) % TAU + TAU) % TAU - Math.PI);
    if (diff > C.beamHalfAngle) return 0;
    const cone = 1 - diff / C.beamHalfAngle;
    const fall = 1 - d / C.beamLength;
    return clamp(cone * 1.3, 0, 1) * clamp(fall * 1.6, 0, 1);
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return false;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.6;
    this.shake = 0.7;
    this.game.audio.tone({ freq: 130, endFreq: 45, type: 'sawtooth', duration: 0.4, volume: 0.3 });
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
    p.x = 240;
    p.y = H / 2;
    p.vx = 0;
    p.vy = 0;
    p.jaw = 0.75;
    p.swing = 0;
    p.bitePhase = 'none';
    p.biteTimer = 0;
    this.meter = 0;
    this.charged = false;
    this.stoplight = false;
    this.beamAngle = 0;
    const s = this.shark;
    s.x = W - 180;
    s.y = H / 2;
    s.vx = 0;
    s.vy = 0;
    s.state = 'patrol';
    s.timer = 0;
    s.cooldown = 0;
    s.shootPhase = 'none';
    s.jaw = 0.2;
    s.jawExt = 0;
    s.alert = 0;
    s.patrolDir = -1;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'THE DARK HIDES YOU AGAIN \u2014 EAT SHRIMPS';
    this.statusTimer = 2;
  }

  sharkSees() {
    const C = GOBLIN;
    const d = Math.hypot(this.player.x - this.shark.x, this.player.y - this.shark.y);
    return this.stoplight ? d < C.sharkSight : d < C.sharkDarkSight;
  }

  steerShark(dt, speed) {
    const C = GOBLIN;
    const s = this.shark;
    const dx = this.player.x - s.x;
    const dy = this.player.y - s.y;
    const dist = Math.hypot(dx, dy) || 1;
    s.vx += ((dx / dist) * speed - s.vx) * (1 - Math.exp(-C.sharkTurn * dt));
    s.vy += ((dy / dist) * speed - s.vy) * (1 - Math.exp(-C.sharkTurn * dt));
    s.x = clamp(s.x + s.vx * dt, 30, W - 30);
    s.y = clamp(s.y + s.vy * dt, C.topBound, C.bottomBound);
    s.heading = Math.atan2(s.vy, s.vx);
  }

  updateShark(dt) {
    const C = GOBLIN;
    const s = this.shark;
    s.phase += dt;
    s.alert = Math.max(0, s.alert - dt * 0.7);
    s.cooldown = Math.max(0, s.cooldown - dt);
    const sees = this.sharkSees();
    const d = Math.hypot(this.player.x - s.x, this.player.y - s.y);

    if (s.state === 'patrol') {
      s.jaw += (0.2 - s.jaw) * (1 - Math.exp(-5 * dt));
      s.jawExt = Math.max(0, s.jawExt - dt * 3);
      if (sees) {
        this.steerShark(dt, C.sharkApproachSpeed);
        s.alert = 1;
      } else {
        s.timer -= dt;
        if (s.timer <= 0) {
          s.timer = rand(2, 4);
          s.patrolY = rand(C.topBound + 30, C.bottomBound - 30);
          s.patrolDir = Math.random() < 0.5 ? -1 : 1;
        }
        s.vx += (s.patrolDir * C.sharkSpeed - s.vx) * (1 - Math.exp(-1.5 * dt));
        s.vy += ((s.patrolY - s.y) * 0.7 - s.vy) * (1 - Math.exp(-1.5 * dt));
        s.x = clamp(s.x + s.vx * dt, 30, W - 30);
        s.y = clamp(s.y + s.vy * dt, C.topBound, C.bottomBound);
        if (s.x <= 60) s.patrolDir = 1;
        else if (s.x >= W - 60) s.patrolDir = -1;
        s.heading = Math.atan2(s.vy * 0.4, s.vx);
      }

      const toPlayer = Math.atan2(this.player.y - s.y, this.player.x - s.x);
      let front = Math.abs(((toPlayer - s.heading + Math.PI) % TAU + TAU) % TAU - Math.PI);
      if (d < C.lungeRange && front < C.lungeFront && s.cooldown <= 0) {
        s.state = 'wind';
        s.timer = C.lungeTelegraph;
        s.shootPhase = 'none';
        this.game.audio.tone({ freq: 90, endFreq: 60, type: 'sawtooth', duration: 0.3, volume: 0.2 });
      }
      return;
    }

    if (s.state === 'wind') {
      s.timer -= dt;
      s.jaw += (1 - s.jaw) * (1 - Math.exp(-6 * dt));
      s.jawExt = 0;
      const toPlayer = Math.atan2(this.player.y - s.y, this.player.x - s.x);
      let turn = ((toPlayer - s.heading + Math.PI) % TAU + TAU) % TAU - Math.PI;
      s.heading += turn * (1 - Math.exp(-3 * dt));
      s.vx *= Math.exp(-3 * dt);
      s.vy *= Math.exp(-3 * dt);
      s.x = clamp(s.x + s.vx * dt, 30, W - 30);
      s.y = clamp(s.y + s.vy * dt, C.topBound, C.bottomBound);
      s.alert = 1;
      if (s.timer <= 0) {
        s.state = 'shoot';
        s.shootPhase = 'extend';
        s.timer = C.lungeExtend;
        s.jawExt = 0;
        this.game.audio.tone({ freq: 200, endFreq: 90, type: 'square', duration: 0.14, volume: 0.24 });
      }
      return;
    }

    if (s.state === 'shoot') {
      s.alert = 1;
      if (s.shootPhase === 'extend') {
        s.jaw = 1;
        s.jawExt = clamp(s.jawExt + dt / C.lungeExtend, 0, 1);
        if (s.jawExt >= 1) {
          s.shootPhase = 'chomp';
          s.timer = C.lungeHold;
        }
      } else if (s.shootPhase === 'chomp') {
        s.jawExt = 1;
        const e = clamp(1 - Math.max(0, s.timer) / C.lungeHold, 0, 1);
        s.jaw = 1 - e;
        s.timer -= dt;
        if (s.timer <= 0) {
          s.jaw = 0;
          s.shootPhase = 'retract';
          s.timer = C.lungeRetract;
          this.game.audio.tone({ freq: 70, endFreq: 45, type: 'square', duration: 0.1, volume: 0.24 });
        }
      } else {
        s.jaw = 0.2;
        s.jawExt = clamp(s.jawExt - dt / C.lungeRetract, 0, 1);
        if (s.jawExt <= 0) {
          s.state = 'recover';
          s.timer = C.sharkRecover;
          s.cooldown = C.lungeCooldown;
        }
      }
      const tip = this.jawTip();
      if (this.invuln <= 0 && Math.hypot(this.player.x - tip.x, this.player.y - tip.y) < C.lungeHitRadius + this.player.radius) {
        if (this.catchPlayer('THE GOBLIN SHARK CHOPPED YOU')) return;
      }
      return;
    }

    s.timer -= dt;
    s.jawExt = Math.max(0, s.jawExt - dt * 3);
    s.jaw += (0.2 - s.jaw) * (1 - Math.exp(-5 * dt));
    s.vx *= Math.exp(-2 * dt);
    s.vy *= Math.exp(-2 * dt);
    s.x = clamp(s.x + s.vx * dt, 30, W - 30);
    s.y = clamp(s.y + s.vy * dt, C.topBound, C.bottomBound);
    if (s.timer <= 0) s.state = 'patrol';
  }

  updateCreatures(dt) {
    const C = GOBLIN;
    const pad = 34;
    for (const list of [this.shrimp, this.squids]) {
      for (const s of list) {
        s.phase += dt;
        s.aim -= dt;
        if (s.aim <= 0) {
          s.aim = rand(1.2, 2.8);
          const a = rand(0, TAU);
          const sp = list === this.shrimp ? rand(10, 26) : rand(20, 55);
          s.vx = Math.cos(a) * sp;
          s.vy = Math.sin(a) * sp;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x < pad) {
          s.x = pad;
          s.vx = Math.abs(s.vx);
        } else if (s.x > W - pad) {
          s.x = W - pad;
          s.vx = -Math.abs(s.vx);
        }
        if (s.y < C.topBound) {
          s.y = C.topBound;
          s.vy = Math.abs(s.vy);
        } else if (s.y > C.bottomBound) {
          s.y = C.bottomBound;
          s.vy = -Math.abs(s.vy);
        }
      }
    }
  }

  updateRound(dt, input) {
    const C = GOBLIN;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
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
    p.x = clamp(p.x + p.vx * dt, 20, W - 20);
    p.y = clamp(p.y + p.vy * dt, C.topBound, C.bottomBound);
    if (dirX !== 0) p.facing = dirX > 0 ? 1 : -1;
    this.updatePlayerBite(dt);

    const targetAim = p.facing > 0 ? 0 : Math.PI;
    let aimDiff = ((targetAim - this.beamAngle + Math.PI) % TAU + TAU) % TAU - Math.PI;
    this.beamAngle += aimDiff * (1 - Math.exp(-8 * dt));

    if (input.wasPressed('KeyE')) {
      if (!this.charged) {
        this.status = 'EAT SHRIMPS TO CHARGE THE STOPLIGHT FIRST';
        this.statusTimer = 2;
      } else if (this.stoplight) {
        this.stoplight = false;
        this.game.audio.tone({ freq: 180, endFreq: 90, type: 'sine', duration: 0.12, volume: 0.16 });
      } else if (this.meter > 0.02) {
        this.stoplight = true;
        this.game.audio.tone({ freq: 320, endFreq: 520, type: 'sine', duration: 0.16, volume: 0.2 });
      } else {
        this.status = 'NO CHARGE \u2014 EAT A SHRIMP';
        this.statusTimer = 2;
      }
    }

    if (this.stoplight) {
      this.meter = Math.max(0, this.meter - C.meterDrain * dt);
      if (this.meter <= 0) {
        this.stoplight = false;
        this.status = 'STOPLIGHT FLICKERED OUT \u2014 EAT A SHRIMP';
        this.statusTimer = 2;
      }
    }

    this.shrimpSpawn -= dt;
    if (this.shrimpSpawn <= 0 && this.shrimp.length < C.shrimpCount) {
      this.shrimpSpawn = C.spawnInterval;
      this.spawnShrimp();
    }
    this.squidSpawn -= dt;
    if (this.squidSpawn <= 0 && this.squids.length < C.squidCount) {
      this.squidSpawn = C.spawnInterval;
      this.spawnSquid();
    }

    this.updateCreatures(dt);

    for (const s of this.shrimp) {
      if (Math.hypot(s.x - p.x, s.y - p.y) < C.playerRadius + s.r + C.catchPad) {
        s.dead = true;
        this.startPlayerBite();
        this.meter = clamp(this.meter + C.meterPerShrimp, 0, 1);
        if (this.meter >= 1) {
          if (!this.charged) {
            this.status = 'STOPLIGHT CHARGED \u2014 PRESS E TO LIGHT';
            this.statusTimer = 3;
          }
          this.charged = true;
        }
        this.particles.burst(s.x, s.y, { count: 14, speed: 150, life: 0.5, colors: ['#ff9a7a', '#ffd9c0'], buoyancy: -20 });
        this.game.audio.tone({ freq: 480, endFreq: 760, type: 'sine', duration: 0.2, volume: 0.2 });
      }
    }
    this.shrimp = this.shrimp.filter((s) => !s.dead);

    for (const s of this.squids) {
      const rev = this.revealAmount(s);
      if (rev > 0.35 && Math.hypot(s.x - p.x, s.y - p.y) < C.playerRadius + s.r + C.squidPad) {
        s.dead = true;
        this.startPlayerBite();
        this.squidsEaten += 1;
        this.particles.burst(s.x, s.y, { count: 16, speed: 170, life: 0.55, colors: ['#ff5a6a', '#8a2f44'], buoyancy: -10 });
        this.game.audio.tone({ freq: 300, endFreq: 120, type: 'square', duration: 0.14, volume: 0.2 });
      }
    }
    this.squids = this.squids.filter((s) => !s.dead);

    for (const m of this.motes) {
      m.ph += dt;
      m.y += m.sp * dt;
      m.x += Math.sin(m.ph) * 5 * dt;
      if (m.y > C.bottomBound) {
        m.y = C.topBound;
        m.x = rand(0, W);
      }
    }

    this.updateShark(dt);
    this.particles.update(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);

    if (this.squidsEaten >= C.squidGoal) this.finish(true);
  }

  renderRound(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04070c');
    bg.addColorStop(0.5, '#02050a');
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(160, 190, 210, 0.22)';
    for (const m of this.motes) {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fill();
    }

    this.renderBeam(ctx);

    for (const s of this.shrimp) this.renderShrimp(ctx, s);
    for (const s of this.squids) this.renderSquid(ctx, s, this.revealAmount(s));
    this.renderShark(ctx);
    this.renderPlayer(ctx);
    this.particles.render(ctx);
  }

  renderBeam(ctx) {
    if (!this.stoplight) return;
    const C = GOBLIN;
    const hx = this.headX();
    const hy = this.player.y;
    const a = this.beamAngle;
    ctx.save();
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, C.beamLength);
    g.addColorStop(0, 'rgba(255, 60, 60, 0.32)');
    g.addColorStop(0.5, 'rgba(220, 30, 50, 0.14)');
    g.addColorStop(1, 'rgba(140, 10, 40, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.arc(hx, hy, C.beamLength, a - C.beamHalfAngle, a + C.beamHalfAngle);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 130, 130, 0.4)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + Math.cos(a) * C.beamLength, hy + Math.sin(a) * C.beamLength);
    ctx.stroke();

    const dot = ctx.createRadialGradient(hx, hy, 0, hx, hy, 20);
    dot.addColorStop(0, 'rgba(255, 150, 150, 0.9)');
    dot.addColorStop(1, 'rgba(255, 60, 60, 0)');
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(hx, hy, 20, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderShrimp(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, s.r * 2.6);
    halo.addColorStop(0, 'rgba(255, 180, 150, 0.5)');
    halo.addColorStop(1, 'rgba(255, 150, 120, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, s.r * 2.6, 0, TAU);
    ctx.fill();

    ctx.rotate(Math.sin(s.phase * 2) * 0.25);
    ctx.fillStyle = '#f0b7a0';
    ctx.strokeStyle = 'rgba(80, 40, 34, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-s.r * 1.1, 0);
    ctx.quadraticCurveTo(-s.r * 0.2, -s.r * 0.85, s.r * 0.7, -s.r * 0.2);
    ctx.quadraticCurveTo(s.r * 0.95, 0, s.r * 0.6, s.r * 0.32);
    ctx.quadraticCurveTo(-s.r * 0.2, s.r * 0.7, -s.r * 1.1, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-s.r * 1.0, -s.r * 0.05);
    ctx.lineTo(-s.r * 1.5, -s.r * 0.4);
    ctx.lineTo(-s.r * 1.25, 0);
    ctx.lineTo(-s.r * 1.5, s.r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 210, 190, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.r * 0.7, -s.r * 0.1);
    ctx.quadraticCurveTo(s.r * 1.5, -s.r * 0.5, s.r * 1.9, -s.r * 0.2);
    ctx.moveTo(s.r * 0.7, 0.1);
    ctx.quadraticCurveTo(s.r * 1.5, s.r * 0.5, s.r * 1.9, s.r * 0.3);
    ctx.stroke();

    ctx.fillStyle = '#241014';
    ctx.beginPath();
    ctx.arc(s.r * 0.5, -s.r * 0.14, s.r * 0.12, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderSquid(ctx, s, vis) {
    const a = 0.06 + 0.94 * clamp(vis, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(s.x, s.y);
    const ang = Math.atan2(s.vy, s.vx);
    ctx.rotate(ang);
    const dir = Math.cos(ang) >= 0 ? 1 : -1;
    ctx.scale(dir, 1);

    ctx.strokeStyle = '#6d2f40';
    ctx.lineWidth = s.r * 0.16;
    ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i += 1) {
      const spread = i * 0.28;
      const wob = Math.sin(s.phase * 4 + i) * 0.2;
      ctx.beginPath();
      ctx.moveTo(-s.r * 0.5, 0);
      ctx.quadraticCurveTo(-s.r * 1.6, i * s.r * 0.4, -s.r * 2.3, s.r * (spread + wob));
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(s.r * 0.4, 0);
    ctx.lineTo(-s.r * 0.1, -s.r * 0.7);
    ctx.lineTo(-s.r * 0.9, 0);
    ctx.lineTo(-s.r * 0.1, s.r * 0.7);
    ctx.closePath();
    ctx.fillStyle = '#8a4658';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-s.r * 0.15, 0, s.r * 1.0, s.r * 0.52, 0, 0, TAU);
    ctx.fillStyle = '#9c5566';
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 25, 34, 0.6)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = '#1c0e13';
    ctx.beginPath();
    ctx.arc(-s.r * 0.85, -s.r * 0.16, s.r * 0.18, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderShark(ctx) {
    const C = GOBLIN;
    const s = this.shark;
    if (s.state === 'wind') {
      const tip = this.jawTip();
      ctx.save();
      ctx.strokeStyle = `rgba(255, 90, 90, ${0.35 + 0.35 * Math.sin(this.time * 20)})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(this.mouthX(), this.mouthY());
      const reach = C.lungeReach;
      ctx.lineTo(s.x + Math.cos(s.heading) * reach, s.y + Math.sin(s.heading) * reach);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.heading);
    if (Math.cos(s.heading) < 0) ctx.scale(1, -1);
    if (s.state === 'patrol' && !this.sharkSees()) ctx.globalAlpha = 0.5;
    drawGoblinShark(ctx, s.radius, { age: this.time, jawOpen: s.jaw, jawExtend: s.jawExt, alert: s.alert });
    ctx.restore();
  }

  renderPlayer(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.facing, 1);
    drawLoosejaw(ctx, p.radius, { age: this.time, jawOpen: p.jaw, swing: p.swing, alert: 0 });
    ctx.restore();
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.3, {
        width: W,
        height: H,
        time: this.time,
        caption: 'CAUGHT \u2014 TRY AGAIN!',
        radius: 60,
      });
      return;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2 + 60, H / 2);
    const s = 1.0 + (1 - this.scareTimer / 1.3) * 1.1;
    ctx.scale(s, s);
    drawGoblinShark(ctx, 60, { age: this.time, jawOpen: 1, jawExtend: 1, alert: 1 });
    ctx.restore();
    drawText(ctx, this.scareReason, W / 2, H - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE GOBLIN DEEP', W / 2, 30, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(255, 90, 110, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 28, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < GOBLIN.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 50, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }

    const prog = clamp(this.squidsEaten / GOBLIN.squidGoal, 0, 1);
    fillRoundRect(ctx, W - 264, 28, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 264, 28, 240 * prog, 10, 5, '#ff5a6a');
    drawText(ctx, `SQUIDS ${this.squidsEaten}/${GOBLIN.squidGoal}`, W - 264, 54, {
      size: 12,
      color: COLORS.textDim,
      align: 'left',
    });

    drawText(ctx, 'STOPLIGHT', W - 264, 76, { size: 11, color: COLORS.textDim, align: 'left' });
    fillRoundRect(ctx, W - 180, 68, 156, 10, 5, 'rgba(6, 20, 26, 0.8)');
    const meterColor = this.stoplight ? '#ff2a2a' : this.charged ? '#ff7a6a' : '#c98a3a';
    fillRoundRect(ctx, W - 180, 68, 156 * clamp(this.meter, 0, 1), 10, 5, meterColor);

    if (this.stoplight) {
      drawText(ctx, 'RED RAY ON \u2014 E TO SWITCH OFF', W / 2, 60, {
        size: 13,
        color: '#ff9aa4',
        alpha: 0.7 + 0.3 * Math.sin(this.time * 12),
      });
    } else if (this.charged && this.meter > 0.02) {
      drawText(ctx, 'STOPLIGHT READY \u2014 PRESS E', W / 2, 60, {
        size: 13,
        color: '#ff8a96',
        alpha: 0.85,
      });
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, W / 2, 60, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    if (this.shark.state === 'wind') {
      drawText(ctx, 'THE SHARK IS LINING UP ITS JAWS!', W / 2, 88, {
        size: 16,
        color: COLORS.danger,
        alpha: 0.6 + 0.4 * Math.sin(this.time * 16),
      });
    } else if (this.shark.state === 'shoot') {
      drawText(ctx, '!', W / 2, 88, { size: 22, color: COLORS.danger, alpha: 0.9 });
    }

    drawText(ctx, 'WASD \u2014 SWIM      EAT SHRIMPS TO CHARGE      E \u2014 STOPLIGHT ON/OFF      ESC \u2014 BACK', W / 2, H - 14, {
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
    return 'THE GOBLIN DEEP';
  }

  resultsHeadline() {
    return this.won ? 'YOU SURVIVED THE DARK' : 'THE GOBLIN SHARK FOUND YOU';
  }

  resultsDetail() {
    return `${this.squidsEaten} SQUIDS EATEN \u00B7 ${this.lives} LIVES LEFT`;
  }
}
