import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { drawArcticShrimpBody } from '../entities/arcticshrimp.js';
import { drawMorayBody } from '../entities/eel.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import {
  CONTROLS,
  COLORS,
  DEAD_CALM,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const MUTAGEN_Y = LOGICAL_HEIGHT - DEAD_CALM.mutagenDrop;

const MUTANT_MORAY = {
  bodyColor: '#33402a',
  ridgeColor: '#46562f',
  outlineColor: 'rgba(10, 16, 8, 0.75)',
  eyeColor: '#101010',
  spots: false,
  blind: true,
};

export class DeadCalmScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'deadcalm';
  }

  buildRound() {
    const C = DEAD_CALM;
    this.phase = 'play';
    this.worldLength = C.worldLength;
    this.startX = C.startX;
    this.exitZone = { x: this.worldLength - 200 };
    this.lives = C.lives;
    this.invuln = 0;
    this.knocked = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.status = 'W / UP — JUMP      MOUSE — AIM THE CLAW      CLICK — CAVITATION BUBBLE';
    this.statusTimer = 4;
    this.ripples = [];
    this.bubbles = [];
    this.shockwaves = [];
    this.fireCooldown = 0;
    this.clawPulse = 0;
    this.aim = 0;
    this.camX = 0;

    this.platforms = [];
    let x = 0;
    let top = LOGICAL_HEIGHT - 150;
    this.platforms.push({ x: 0, y: top, w: 260 });
    x = 260;
    while (x < this.worldLength - 320) {
      const gap = rand(C.gapMin, C.gapMax);
      x += gap;
      const w = rand(C.platformMin, C.platformMax);
      top = clamp(top + rand(-90, 90), C.ledgeTopMin, C.ledgeTopMax);
      this.platforms.push({ x, y: top, w });
      x += w;
    }
    this.platforms.push({ x: this.exitZone.x - 40, y: LOGICAL_HEIGHT - 170, w: 300 });

    const start = this.platforms[0];
    this.player = {
      x: start.x + 90,
      y: start.y - 22,
      vx: 0,
      vy: 0,
      radius: 22,
      onGround: true,
      facing: 1,
      armPhase: 0,
      trapped: false,
    };
    this.struggle = 0;

    this.creatures = [];
    for (let i = 0; i < C.creatureCount; i += 1) {
      const plat = this.platforms[1 + Math.floor(rand(0, this.platforms.length - 2))];
      this.creatures.push({
        kind: Math.random() < 0.5 ? 'snail' : 'shrimp',
        x: plat.x + rand(24, Math.max(30, plat.w - 24)),
        y: plat.y,
        alive: true,
        knocked: false,
        vx: 0,
        vy: 0,
        phase: rand(0, TAU),
        spin: 0,
      });
    }

    this.monster = {
      x: this.startX + 900,
      y: MUTAGEN_Y + 6,
      vx: 0,
      vy: 0,
      radius: DEAD_CALM.monsterRadius,
      tx: this.startX + 900,
      ty: MUTAGEN_Y,
      burstY: MUTAGEN_Y - DEAD_CALM.monsterBurstHeight,
      state: 'roam',
      timer: 0,
      jaw: 0.18,
      alert: 0,
      phase: rand(0, TAU),
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
    this.game.audio.tone({ freq: 120, endFreq: 45, type: 'sawtooth', duration: 0.4, volume: 0.3 });
    if (this.lives <= 0) {
      this.finish(false);
      return true;
    }
    this.phase = 'scare';
    this.scareTimer = 1.4;
    return true;
  }

  respawn() {
    const p = this.player;
    let plat = this.platforms[0];
    for (const candidate of this.platforms) {
      if (candidate.x <= p.x) plat = candidate;
    }
    p.x = plat.x + plat.w / 2;
    p.y = plat.y - p.radius;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
    p.trapped = false;
    this.struggle = 0;
    this.monster.x = Math.max(0, p.x - 900);
    this.monster.y = MUTAGEN_Y + 6;
    this.monster.state = 'roam';
    this.monster.timer = 0;
    this.monster.jaw = 0.18;
    this.monster.alert = 0;
    this.monster.tx = this.monster.x;
    this.ripples = [];
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'THE STILLNESS HOLDS — CROSS AGAIN';
    this.statusTimer = 2;
  }

  trapInMutagen() {
    const p = this.player;
    p.trapped = true;
    p.vx = 0;
    p.vy = 0;
    p.y = MUTAGEN_Y + 8;
    this.struggle = 0;
    this.monster.alert = 1;
    this.monster.tx = p.x;
    this.addNoise(p.x, MUTAGEN_Y, 1);
    this.game.audio.tone({ freq: 150, endFreq: 55, type: 'sawtooth', duration: 0.45, volume: 0.3 });
    this.particles.burst(p.x, MUTAGEN_Y, { count: 18, speed: 160, life: 0.7, colors: ['#9be564', '#dfffa8', '#ffffff'], buoyancy: -40 });
    this.status = 'THE MUTAGEN HAS YOU \u2014 MASH JUMP TO BREAK FREE';
    this.statusTimer = 3.5;
  }

  freeFromMutagen() {
    const p = this.player;
    let plat = this.platforms[0];
    for (const candidate of this.platforms) {
      if (candidate.x - 20 <= p.x && p.x <= candidate.x + candidate.w + 20) plat = candidate;
    }
    p.trapped = false;
    p.x = clamp(p.x, plat.x + 8, plat.x + plat.w - 8);
    p.y = plat.y - p.radius;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
    this.struggle = 0;
    this.invuln = Math.max(this.invuln, 0.9);
    this.status = 'FREE \u2014 KEEP MOVING';
    this.statusTimer = 2;
    this.particles.burst(p.x, p.y, { count: 12, speed: 150, life: 0.5, colors: ['#9be564', '#ffffff'], buoyancy: -60 });
  }

  addNoise(x, y, strength) {
    this.ripples.push({ x, y, strength, life: 0, maxLife: 1.3, r: 8, max: 60 + strength * 90, phase: rand(0, TAU) });
    const m = this.monster;
    if (Math.hypot(x - m.x, y - m.y) < DEAD_CALM.monsterHearRange) {
      if (strength >= m.alert) {
        m.tx = x;
        m.ty = y;
        m.alert = strength;
      }
    }
  }

  platformUnder(px) {
    for (const plat of this.platforms) {
      if (px >= plat.x && px <= plat.x + plat.w) return plat;
    }
    return null;
  }

  updateRound(dt, input) {
    const C = DEAD_CALM;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.clawPulse = Math.max(0, this.clawPulse - dt * 3);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }

    const p = this.player;
    const clicked = input.pressed.has('PointerPrimary');

    if (p.trapped) {
      p.vx = 0;
      p.vy = 0;
      p.y += (MUTAGEN_Y + 8 - p.y) * (1 - Math.exp(-8 * dt));
      p.armPhase += dt * 8;
      const mashing = input.isDown(CONTROLS.solo.up) || input.isDown('confirm');
      if (mashing) this.struggle = Math.min(1.2, this.struggle + dt / 1.1);
      else this.struggle = Math.max(0, this.struggle - dt * 0.6);
      if (this.struggle >= 1) this.freeFromMutagen();
    } else {
      const left = input.isDown(CONTROLS.solo.left) ? 1 : 0;
      const right = input.isDown(CONTROLS.solo.right) ? 1 : 0;
      const dir = right - left;
      const control = p.onGround ? 1 : C.airControl;
      p.vx += (dir * C.runSpeed - p.vx) * (1 - Math.exp(-10 * control * dt));
      if (dir !== 0) p.facing = dir > 0 ? 1 : -1;

      const jumpPressed = input.wasPressed(CONTROLS.solo.up) || (input.wasPressed('confirm') && !clicked);
      const flapHold = input.isDown(CONTROLS.solo.up);
      if (jumpPressed && p.onGround) {
        p.vy = -C.jump;
        p.onGround = false;
      }
      const gravity = !p.onGround && flapHold ? C.gravity * 0.32 : C.gravity;
      p.vy = Math.min(C.maxFall, p.vy + gravity * dt);

      const prevBottom = p.y + p.radius;
      p.x = clamp(p.x + p.vx * dt, 0, this.worldLength - p.radius);
      p.y += p.vy * dt;
      p.armPhase += dt * (p.onGround ? 6 + Math.abs(p.vx) * 0.03 : 14);

      p.onGround = false;
      const plat = this.platformUnder(p.x);
      const bottom = p.y + p.radius;
      if (plat && p.vy >= 0 && prevBottom <= plat.y + 4 && bottom >= plat.y) {
        p.y = plat.y - p.radius;
        p.vy = 0;
        p.onGround = true;
      }
      if (p.y + p.radius >= MUTAGEN_Y) this.trapInMutagen();
    }

    this.aim += (clamp((input.pointer.y - p.y) / 140, -1, 1) - this.aim) * (1 - Math.exp(-14 * dt));

    if ((clicked || input.wasPressed('tool')) && this.fireCooldown <= 0) {
      this.fireCooldown = C.vortexCooldown;
      this.clawPulse = 1;
      const angle = this.aim * 1.1;
      const sx = p.x + p.facing * 34;
      const sy = p.y - 6 + Math.sin(angle) * 10;
      this.bubbles.push({
        x: sx,
        y: sy,
        vx: p.facing * Math.cos(angle) * C.vortexSpeed,
        vy: Math.sin(angle) * C.vortexSpeed,
        life: C.vortexLife,
        phase: rand(0, TAU),
      });
    }

    for (const b of this.bubbles) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      b.phase += dt * 6;
      let pop = b.life <= 0 || b.y >= MUTAGEN_Y;
      if (!pop) {
        const plat = this.platformUnder(b.x);
        if (plat && b.y >= plat.y - 4) pop = true;
      }
      if (!pop) {
        for (const c of this.creatures) {
          if (!c.alive || c.knocked) continue;
          if (Math.hypot(c.x - b.x, c.y - b.y) < 26) {
            pop = true;
            break;
          }
        }
      }
      if (pop) this.popBubble(b);
    }
    this.bubbles = this.bubbles.filter((b) => !b.popped);

    for (const sw of this.shockwaves) {
      sw.life += dt;
      sw.r += (sw.max - sw.r) * (1 - Math.exp(-14 * dt));
    }
    this.shockwaves = this.shockwaves.filter((sw) => sw.life < sw.maxLife);

    for (const c of this.creatures) {
      if (!c.alive) continue;
      if (c.knocked) {
        c.vy += C.gravity * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.spin += dt * 8;
        if (c.y >= MUTAGEN_Y) {
          c.alive = false;
          this.addNoise(c.x, MUTAGEN_Y, 0.8);
          this.particles.burst(c.x, MUTAGEN_Y, { count: 14, speed: 150, life: 0.6, colors: ['#9be564', '#ffd166'], buoyancy: -50 });
        }
      } else {
        c.phase += dt;
      }
    }

    let target = null;
    for (const rip of this.ripples) {
      if (rip.x === undefined) continue;
      if (Math.hypot(rip.x - this.monster.x, rip.y - this.monster.y) > C.monsterHearRange) continue;
      if (!target || rip.life < target.life) target = rip;
    }
    const m = this.monster;
    m.phase += dt;
    if (target) {
      m.alert = Math.max(m.alert, target.strength);
      m.tx = target.x;
      m.ty = target.y;
      if (m.state === 'roam' || m.state === 'recover') m.state = 'dive';
    }

    if (m.state === 'roam') {
      m.jaw += (0.18 - m.jaw) * (1 - Math.exp(-6 * dt));
      m.y += ((MUTAGEN_Y + 6) - m.y) * (1 - Math.exp(-3 * dt));
      const dxr = m.tx - m.x;
      m.vx += (Math.sign(dxr) * C.monsterSpeed - m.vx) * (1 - Math.exp(-2 * dt));
      m.x = clamp(m.x + m.vx * dt, 0, this.worldLength);
    } else if (m.state === 'dive') {
      m.jaw += (0.24 - m.jaw) * (1 - Math.exp(-6 * dt));
      m.y += ((MUTAGEN_Y + 30) - m.y) * (1 - Math.exp(-6 * dt));
      const dxr = m.tx - m.x;
      m.vx += (Math.sign(dxr) * C.monsterDiveSpeed - m.vx) * (1 - Math.exp(-9 * dt));
      m.x = clamp(m.x + m.vx * dt, 0, this.worldLength);
      if (Math.abs(dxr) < 44) {
        m.state = 'burst';
        m.timer = C.monsterBurstTime;
        m.burstY = clamp(m.ty - 10, 90, MUTAGEN_Y - 6);
      }
    } else if (m.state === 'burst') {
      m.timer -= dt;
      m.jaw += (1 - m.jaw) * (1 - Math.exp(-12 * dt));
      m.y += (m.burstY - m.y) * (1 - Math.exp(-9 * dt));
      m.vx *= Math.exp(-3 * dt);
      m.x = clamp(m.x + m.vx * dt, 0, this.worldLength);
      if (m.timer <= 0) {
        m.state = 'recover';
        m.timer = C.monsterRecoverTime;
      }
    } else {
      m.timer -= dt;
      m.jaw += (0.2 - m.jaw) * (1 - Math.exp(-6 * dt));
      m.y += ((MUTAGEN_Y + 6) - m.y) * (1 - Math.exp(-4 * dt));
      if (m.timer <= 0) {
        m.state = 'roam';
        m.alert = 0;
      }
    }
    m.alert = Math.max(0, m.alert - dt * 0.5);

    if (this.invuln <= 0 && Math.hypot(p.x - m.x, p.y - m.y) < p.radius + m.radius) {
      if (this.catchPlayer('THE MUTAGEN-EYED MORAY SNAPPED YOU UP')) return;
    }

    for (const rip of this.ripples) {
      rip.life += dt;
      rip.r += (rip.max - rip.r) * (1 - Math.exp(-6 * dt));
    }
    this.ripples = this.ripples.filter((rip) => rip.life < rip.maxLife);
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
    sky.addColorStop(0, '#08222a');
    sky.addColorStop(1, '#04121a');
    ctx.fillStyle = sky;
    ctx.fillRect(this.camX, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    this.renderExit(ctx);
    for (const plat of this.platforms) this.renderPlatform(ctx, plat);
    for (const c of this.creatures) this.renderCreature(ctx, c);
    for (const rip of this.ripples) this.renderRipple(ctx, rip);
    for (const b of this.bubbles) this.renderBubble(ctx, b);
    for (const sw of this.shockwaves) this.renderShockwave(ctx, sw);
    this.renderMonster(ctx);

    ctx.fillStyle = 'rgba(42, 74, 30, 0.86)';
    ctx.fillRect(this.camX - 20, MUTAGEN_Y, LOGICAL_WIDTH + 40, LOGICAL_HEIGHT - MUTAGEN_Y);
    ctx.fillStyle = 'rgba(155, 229, 100, 0.22)';
    ctx.fillRect(this.camX - 20, MUTAGEN_Y, LOGICAL_WIDTH + 40, 26);
    ctx.strokeStyle = 'rgba(180, 240, 130, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = Math.floor(this.camX / 24) * 24; x < this.camX + LOGICAL_WIDTH + 24; x += 24) {
      const y = MUTAGEN_Y + Math.sin(x * 0.05 + this.time * 2) * 4;
      if (x === Math.floor(this.camX / 24) * 24) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    this.renderPlayer(ctx);
    this.particles.render(ctx);
    ctx.restore();
    if (this.phase === 'scare') this.renderScare(ctx);
  }

  renderExit(ctx) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
    ctx.fillRect(this.exitZone.x - 40, 0, 80, LOGICAL_HEIGHT);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.exitZone.x - 40, 0, 80, LOGICAL_HEIGHT);
    drawText(ctx, 'DRY GROUND', this.exitZone.x, 40, { size: 16, color: COLORS.accent });
  }

  renderPlatform(ctx, plat) {
    ctx.fillStyle = 'rgba(58, 74, 82, 0.95)';
    ctx.beginPath();
    ctx.rect(plat.x, plat.y, plat.w, MUTAGEN_Y - plat.y + 20);
    ctx.fill();
    ctx.fillStyle = 'rgba(150, 178, 186, 0.6)';
    ctx.fillRect(plat.x, plat.y, plat.w, 6);
    ctx.strokeStyle = 'rgba(20, 30, 34, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(plat.x, plat.y, plat.w, 6);
  }

  renderCreature(ctx, c) {
    if (!c.alive) return;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.knocked ? c.spin : Math.sin(c.phase * 2) * 0.06);
    if (c.kind === 'snail') {
      ctx.fillStyle = '#e0c07a';
      ctx.beginPath();
      ctx.ellipse(0, -4, 16, 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#a06f3a';
      ctx.beginPath();
      ctx.arc(-2, -8, 11, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#6f4a24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-2, -8, 7, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = '#e0c07a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.lineTo(16, -10);
      ctx.moveTo(8, -2);
      ctx.lineTo(16, -4);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#d94040';
      ctx.beginPath();
      ctx.ellipse(0, -4, 12, 6, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(-18, -10);
      ctx.lineTo(-18, 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, -6);
      ctx.lineTo(16, -12);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderRipple(ctx, rip) {
    const a = 1 - rip.life / rip.maxLife;
    ctx.save();
    ctx.globalAlpha = a * 0.6;
    ctx.strokeStyle = '#8fe0ef';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(rip.x, rip.y, rip.r, rip.r * 0.4, 0, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(rip.x, rip.y, rip.r * 0.6, rip.r * 0.24, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  popBubble(b) {
    b.popped = true;
    this.addNoise(b.x, b.y, 0.55);
    this.shockwaves.push({ x: b.x, y: b.y, r: 6, max: 48, life: 0, maxLife: 0.34 });
    this.particles.burst(b.x, b.y, { count: 12, speed: 170, life: 0.45, colors: ['#bff0ff', '#ffffff'], buoyancy: -30 });
    this.game.audio.tone({ freq: 240, endFreq: 90, type: 'square', duration: 0.1, volume: 0.16 });
    for (const c of this.creatures) {
      if (!c.alive || c.knocked) continue;
      if (Math.hypot(c.x - b.x, c.y - b.y) < 62) {
        c.knocked = true;
        c.vx = (c.x - b.x >= 0 ? 1 : -1) * 220;
        c.vy = -200;
        this.knocked += 1;
        this.game.audio.tone({ freq: 300, endFreq: 620, type: 'triangle', duration: 0.14, volume: 0.2 });
      }
    }
  }

  renderBubble(ctx, b) {
    const wobble = 1 + Math.sin(b.phase) * 0.12;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = 'rgba(191, 240, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 * wobble, 10, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 245, 255, 0.95)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(-3, -3, 2.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderShockwave(ctx, sw) {
    const a = 1 - sw.life / sw.maxLife;
    ctx.save();
    ctx.globalAlpha = a * 0.9;
    ctx.strokeStyle = '#dffaff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(sw.x, sw.y, sw.r, sw.r * 0.5, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  renderMonster(ctx) {
    const m = this.monster;
    const facing = (m.vx || 1) >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.scale(facing, 1);
    if (m.state === 'dive') ctx.globalAlpha = 0.4;
    else if (m.state === 'roam') ctx.globalAlpha = 0.7;
    drawMorayBody(ctx, m.radius * 0.62, { age: this.time, phase: m.phase, jawOpen: m.jaw }, MUTANT_MORAY);
    ctx.restore();
  }

  renderPlayer(ctx) {
    const p = this.player;
    const r = p.radius;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.facing, 1);
    drawArcticShrimpBody(ctx, r * 1.15, {
      age: this.time,
      armPhase: p.armPhase,
      speed: 200,
      bodyColor: 'rgba(204, 26, 26, 0.98)',
      shellLine: 'rgba(120, 0, 0, 0.7)',
      segmentColor: 'rgba(255, 255, 255, 0.85)',
      finColor: 'rgba(204, 26, 26, 0.95)',
      tailColor: '#cc1a1a',
      legColor: 'rgba(255, 255, 255, 0.9)',
      antennaColor: 'rgba(255, 255, 255, 0.95)',
      stripe: 'rgba(255, 255, 255, 0.95)',
      stripe2: 'rgba(255, 255, 255, 0.95)',
    });
    const angle = this.aim * 1.1;
    const outline = 'rgba(46, 6, 6, 0.9)';
    ctx.save();
    ctx.translate(r * 0.6, -r * 0.1);
    ctx.rotate(angle);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 1.1, 0);
    ctx.strokeStyle = outline;
    ctx.lineWidth = r * 0.5;
    ctx.stroke();
    ctx.strokeStyle = '#cc1a1a';
    ctx.lineWidth = r * 0.34;
    ctx.stroke();
    const open = 0.16 + (1 - this.clawPulse) * 0.34;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(r * 1.05, 0);
      ctx.rotate(side * open);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 0.9, side * r * 0.1, r * 1.5, side * r * 0.5);
      ctx.quadraticCurveTo(r * 1.0, side * r * 0.42, r * 0.2, side * r * 0.16);
      ctx.closePath();
      ctx.fillStyle = '#cc1a1a';
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = r * 0.14;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.strokeStyle = '#ff5a5a';
      ctx.lineWidth = r * 0.05;
      ctx.stroke();
      ctx.restore();
    }
    if (this.clawPulse > 0) {
      ctx.fillStyle = `rgba(180, 240, 255, ${this.clawPulse})`;
      ctx.beginPath();
      ctx.arc(r * 1.5, 0, r * (0.3 + this.clawPulse * 0.4), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / 1.4, {
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        time: this.time,
        caption: 'CAUGHT — TRY AGAIN!',
        radius: 66,
      });
      return;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.93)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2 + 60, LOGICAL_HEIGHT / 2);
    const s = 1.1 + (1 - this.scareTimer / 1.4) * 1.1;
    ctx.scale(s, s);
    drawMorayBody(ctx, 44, { age: this.time, phase: 0, jawOpen: 1 }, MUTANT_MORAY);
    ctx.restore();
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, { size: 16, color: COLORS.danger });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'DEAD CALM', LOGICAL_WIDTH / 2, 30, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(155, 229, 100, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 28, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < DEAD_CALM.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 50, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    drawText(ctx, `KNOCKED ${this.knocked}`, LOGICAL_WIDTH - 24, 28, { size: 15, color: '#ff8a8a', align: 'right' });
    const progress = clamp(this.player.x / this.exitZone.x, 0, 1);
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 46, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH - 264, 46, 240 * progress, 10, 5, '#ffd166');
    const alert = this.monster.alert;
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 46, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 46, 240 * alert, 10, 5, alert > 0.6 ? COLORS.danger : '#8fe0ef');
    drawText(ctx, 'ITS HEARING', LOGICAL_WIDTH / 2, 68, { size: 11, color: COLORS.textDim });
    if (this.player.trapped) {
      drawText(ctx, 'TRAPPED IN THE MUTAGEN \u2014 MASH JUMP!', LOGICAL_WIDTH / 2, 92, { size: 15, color: '#dfffa8' });
      fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 104, 240, 12, 6, 'rgba(6, 20, 26, 0.85)');
      fillRoundRect(ctx, LOGICAL_WIDTH / 2 - 120, 104, 240 * Math.min(1, this.struggle), 12, 6, '#9be564');
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 90, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    drawText(ctx, 'A / D — RUN      W / UP — JUMP (\u2018flap\u2019 TO FLOAT)      MOUSE — AIM CLAW      CLICK — BUBBLE (IT POPS)      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 14, {
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
    return 'DEAD CALM';
  }

  resultsHeadline() {
    return this.won ? 'YOU REACHED DRY GROUND' : 'THE CALM TOOK YOU';
  }

  resultsDetail() {
    return `${this.knocked} CREATURES KNOCKED \u00b7 ${this.lives} LIVES LEFT`;
  }
}
