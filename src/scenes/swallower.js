import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { Shark } from '../entities/shark.js';
import { drawSardine } from '../entities/realfish.js';
import { drawSquidBody } from '../entities/squid.js';
import { drawBlackSwallower } from '../entities/blackswallower.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import { CONTROLS, COLORS, SWALLOWER_TANK, DEEPSEA_PALETTE, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;

export class SwallowerScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'swallower';
  }

  waterPalette() {
    return DEEPSEA_PALETTE;
  }

  buildRound() {
    const C = SWALLOWER_TANK;
    this.phase = 'play';
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.eaten = 0;
    this.status = 'BAIT THE SWALLOWER \u2014 MAKE IT GULP THE SCHOOLS, DODGE ITS LUNGES';
    this.statusTimer = 4.4;
    this.schools = [];
    for (let i = 0; i < C.schoolCount; i += 1) this.schools.push(this.spawnSchool());

    const player = new Shark(W * 0.3, H * 0.5, { controls: CONTROLS.solo, pointer: true, maxX: W });
    player.noIdleFlip = true;
    player.radius = C.playerRadius;
    player.render = (ctx) => {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.facing, 1);
      drawSardine(ctx, player.radius, { age: this.time });
      ctx.restore();
    };
    this.players = [player];
    this.player = player;

    this.swallower = {
      x: W - 180,
      y: H * 0.5,
      vx: -C.patrolSpeed,
      vy: 0,
      heading: Math.PI,
      radius: C.sharkRadius,
      state: 'patrol',
      timer: 0,
      cooldown: C.cooldown,
      lockX: 0,
      lockY: 0,
      gulp: 0,
      swallow: 0,
    };
  }

  spawnSchool() {
    const C = SWALLOWER_TANK;
    const edge = Math.floor(rand(0, 4));
    let x;
    let y;
    if (edge === 0) {
      x = rand(60, W - 60);
      y = rand(C.topBound, C.topBound + 50);
    } else if (edge === 1) {
      x = rand(60, W - 60);
      y = rand(C.bottomBound - 50, C.bottomBound);
    } else if (edge === 2) {
      x = rand(40, 100);
      y = rand(C.topBound, C.bottomBound);
    } else {
      x = rand(W - 100, W - 40);
      y = rand(C.topBound, C.bottomBound);
    }
    const speed = rand(18, 46);
    const ang = rand(0, TAU);
    return {
      x,
      y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: rand(16, 26),
      phase: rand(0, TAU),
      kind: Math.random() < 0.55 ? 'fish' : 'squid',
      alive: true,
    };
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
    p.x = W * 0.3;
    p.y = H * 0.5;
    p.vx = 0;
    p.vy = 0;
    const s = this.swallower;
    s.x = W - 180;
    s.y = H * 0.5;
    s.vx = -SWALLOWER_TANK.patrolSpeed;
    s.vy = 0;
    s.state = 'patrol';
    s.cooldown = SWALLOWER_TANK.cooldown;
    s.swallow = 0;
    this.invuln = SWALLOWER_TANK.reCatch;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'IT LOST YOU \u2014 BAIT IT INTO A SCHOOL';
    this.statusTimer = 2.4;
  }

  updateRound(dt, input) {
    const C = SWALLOWER_TANK;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }

    const p = this.player;
    p.update(dt, input);
    p.x = clamp(p.x, 20, W - 20);
    p.y = clamp(p.y, C.topBound, C.bottomBound);

    for (const school of this.schools) {
      school.phase += dt;
      school.x += school.vx * dt;
      school.y += school.vy * dt;
      if (school.x < 50) school.vx = Math.abs(school.vx);
      if (school.x > W - 50) school.vx = -Math.abs(school.vx);
      if (school.y < C.topBound) school.vy = Math.abs(school.vy);
      if (school.y > C.bottomBound) school.vy = -Math.abs(school.vy);
    }

    const s = this.swallower;
    s.cooldown = Math.max(0, s.cooldown - dt);
    if (s.state === 'patrol') {
      const target = Math.atan2(p.y - s.y, p.x - s.x);
      s.heading += (((target + Math.PI) - s.heading + Math.PI) % TAU - Math.PI) * (1 - Math.exp(-1.2 * dt));
      s.vx += (Math.cos(s.heading) * C.patrolSpeed - s.vx) * (1 - Math.exp(-1.5 * dt));
      s.vy += (Math.sin(s.heading) * C.patrolSpeed - s.vy) * (1 - Math.exp(-1.5 * dt));
      if (s.cooldown <= 0) {
        s.state = 'wind';
        s.timer = C.windTime;
        s.lockX = p.x;
        s.lockY = p.y;
        this.game.audio.tone({ freq: 120, endFreq: 80, type: 'sawtooth', duration: 0.3, volume: 0.2 });
      }
    } else if (s.state === 'wind') {
      s.timer -= dt;
      s.vx *= Math.exp(-3 * dt);
      s.vy *= Math.exp(-3 * dt);
      const target = Math.atan2(s.lockY - s.y, s.lockX - s.x);
      s.heading += (((target - s.heading + Math.PI) % TAU - Math.PI)) * (1 - Math.exp(-5 * dt));
      if (s.timer <= 0) {
        s.state = 'lunge';
        s.timer = C.lungeDist / C.lungeSpeed;
        s.vx = Math.cos(s.heading) * C.lungeSpeed;
        s.vy = Math.sin(s.heading) * C.lungeSpeed;
        this.game.audio.tone({ freq: 200, endFreq: 70, type: 'square', duration: 0.16, volume: 0.24 });
      }
    } else if (s.state === 'lunge') {
      s.timer -= dt;
      for (const school of this.schools) {
        if (!school.alive) continue;
        if (Math.hypot(school.x - s.x, school.y - s.y) < C.eatRadius + school.r) {
          school.alive = false;
          this.eaten += 1;
          s.gulp = Math.min(1, this.eaten / C.goal);
          this.particles.burst(school.x, school.y, { count: 10, speed: 120, life: 0.4, colors: ['#9fd8ff', '#ffffff'], buoyancy: -20 });
          this.game.audio.tone({ freq: 520, endFreq: 300, type: 'triangle', duration: 0.12, volume: 0.16 });
        }
      }
      if (this.invuln <= 0 && Math.hypot(p.x - s.x, p.y - s.y) < C.hitRadius + p.radius) {
        if (this.catchPlayer('THE SWALLOWER GULPED YOU')) return;
      }
      if (s.timer <= 0) {
        s.state = 'recover';
        s.timer = C.recoverTime;
      }
    } else {
      s.timer -= dt;
      s.vx *= Math.exp(-2 * dt);
      s.vy *= Math.exp(-2 * dt);
      if (s.timer <= 0) {
        s.state = 'patrol';
        s.cooldown = C.cooldown;
      }
    }

    s.x = clamp(s.x + s.vx * dt, 40, W - 40);
    s.y = clamp(s.y + s.vy * dt, C.topBound, C.bottomBound);
    const swallowTarget = s.state === 'lunge' ? 1 : 0;
    s.swallow += (swallowTarget - s.swallow) * (1 - Math.exp(-8 * dt));

    this.schools = this.schools.filter((school) => school.alive);
    while (this.schools.length < C.schoolCount) this.schools.push(this.spawnSchool());

    if (this.eaten >= C.goal) this.finish(true);
  }

  drawSchool(ctx, school) {
    if (school.kind === 'squid') {
      for (let i = 0; i < 3; i += 1) {
        const a = school.phase + i * 2.1;
        ctx.save();
        ctx.translate(school.x + Math.cos(a) * school.r * 0.5, school.y + Math.sin(a * 1.3) * school.r * 0.4);
        drawSquidBody(ctx, school.r * 0.4, { age: this.time + i });
        ctx.restore();
      }
      return;
    }
    for (let i = 0; i < 5; i += 1) {
      const a = school.phase + i * 1.3;
      const bx = school.x + Math.cos(a) * school.r * 0.5;
      const by = school.y + Math.sin(a * 1.1) * school.r * 0.4;
      const dir = Math.atan2(school.vy, school.vx);
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(dir);
      ctx.fillStyle = 'rgba(196, 214, 224, 0.92)';
      ctx.beginPath();
      ctx.moveTo(school.r * 0.28, 0);
      ctx.lineTo(-school.r * 0.22, -school.r * 0.14);
      ctx.lineTo(-school.r * 0.22, school.r * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-school.r * 0.2, 0);
      ctx.lineTo(-school.r * 0.42, -school.r * 0.16);
      ctx.lineTo(-school.r * 0.42, school.r * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  renderRound(ctx) {
    const s = this.swallower;
    for (const school of this.schools) this.drawSchool(ctx, school);

    if (s.state === 'wind') {
      ctx.save();
      ctx.strokeStyle = `rgba(120, 200, 255, ${0.3 + 0.3 * Math.sin(this.time * 18)})`;
      ctx.setLineDash([10, 10]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.lockX, s.lockY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.heading);
    if (Math.cos(s.heading) < 0) ctx.scale(1, -1);
    drawBlackSwallower(ctx, s.radius, { age: this.time, gulp: s.gulp, swallow: s.swallow });
    ctx.restore();

    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, 'THE BLACK SWALLOWER', W / 2, 28, { size: 23, color: COLORS.text, glow: 'rgba(120, 190, 240, 0.5)', glowBlur: 16 });
    drawText(ctx, `LIVES ${this.lives}`, 24, 26, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < SWALLOWER_TANK.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 48, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }

    const prog = clamp(this.eaten / SWALLOWER_TANK.goal, 0, 1);
    fillRoundRect(ctx, W - 264, 26, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 264, 26, 240 * prog, 10, 5, '#8fd0ff');
    drawText(ctx, `SWALLOWED ${this.eaten}/${SWALLOWER_TANK.goal}`, W - 264, 52, { size: 12, color: COLORS.textDim, align: 'left' });

    if (this.swallower.state === 'wind') {
      drawText(ctx, 'IT IS AIMING \u2014 MOVE!', W / 2, 56, { size: 15, color: COLORS.danger, alpha: 0.6 + 0.4 * Math.sin(this.time * 16) });
    } else if (this.swallower.state === 'lunge') {
      drawText(ctx, 'LUNGE!', W / 2, 56, { size: 18, color: COLORS.danger, alpha: 0.9 });
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, W / 2, 56, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    drawText(ctx, 'WASD / ARROWS \u2014 SWIM      DODGE THE LUNGE, BAIT IT INTO THE SCHOOLS      ESC \u2014 BACK', W / 2, H - 14, {
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
    ctx.scale(1.3, 1.3);
    drawBlackSwallower(ctx, 50, { age: this.time, gulp: 1, swallow: 1 });
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
    return 'THE BLACK SWALLOWER';
  }

  resultsHeadline() {
    return this.won ? 'IT ATE ITSELF FULL' : 'IT SWALLOWED YOU';
  }

  resultsDetail() {
    return `${this.eaten} SCHOOLS EATEN \u00B7 ${this.lives} LIVES LEFT`;
  }
}
