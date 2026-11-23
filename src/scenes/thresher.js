import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { Shark } from '../entities/shark.js';
import { drawSardine, drawThresher } from '../entities/realfish.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import { CONTROLS, COLORS, THRESHER, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const WHIP_SEGMENTS = 12;
const WHIP_SEG = 20;

export class ThresherScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'thresher';
  }

  buildRound() {
    const C = THRESHER;
    this.phase = 'play';
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.eaten = 0;
    this.status = 'EAT THE KRILL \u2014 WATCH THE THRESHER\u2019S TAIL WIND UP';
    this.statusTimer = 4.4;
    this.krill = [];
    this.spawnTimer = 0.6;
    for (let i = 0; i < C.foodCount; i += 1) this.spawnKrill();

    const player = new Shark(W * 0.3, H * 0.5, { controls: CONTROLS.solo, pointer: true, maxX: W });
    player.noIdleFlip = true;
    player.radius = THRESHER.playerRadius;
    player.render = (ctx) => {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.facing, 1);
      drawSardine(ctx, player.radius, { age: this.time });
      ctx.restore();
    };
    this.players = [player];
    this.player = player;

    this.shark = {
      x: W - 200,
      y: H * 0.5,
      vx: -C.sharkSpeed,
      vy: 0,
      radius: C.sharkRadius,
      heading: Math.PI,
      state: 'swim',
      timer: rand(1.4, 2.2),
      swing: 0,
      phase: rand(0, TAU),
      whip: [],
      whipStiff: 0,
    };
    this.resetWhip();
  }

  firstPersonActor() {
    return this.player;
  }

  spawnKrill() {
    this.krill.push({
      x: rand(60, W - 60),
      y: rand(THRESHER.topBound + 20, THRESHER.bottomBound - 20),
      vx: rand(-20, 20),
      vy: rand(-14, 14),
      phase: rand(0, TAU),
      r: 8,
    });
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
    const s = this.shark;
    s.x = W - 200;
    s.y = H * 0.5;
    s.vx = -THRESHER.sharkSpeed;
    s.vy = 0;
    s.state = 'swim';
    s.timer = 1.6;
    s.swing = 0;
    this.resetWhip();
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'IT LOST YOU \u2014 GET BACK TO THE KRILL';
    this.statusTimer = 2.4;
  }

  tailPoints() {
    const C = THRESHER;
    const s = this.shark;
    const dir = s.heading + Math.PI + s.swing;
    const pts = [];
    for (let i = 0; i <= 4; i += 1) {
      const d = s.radius * 0.6 + (i / 4) * s.radius * 3.0;
      pts.push({ x: s.x + Math.cos(dir) * d, y: s.y + Math.sin(dir) * d, r: s.radius * (0.34 - (i / 4) * 0.2) });
    }
    return pts;
  }

  whipTip() {
    const s = this.shark;
    const r = s.radius;
    const tail = (s.swing + 1.1) / 2.2;
    const ang = -0.15 - tail * 1.0;
    const back = r * 0.2;
    const dx = -r * 1.05 - back;
    const qy = -r * 1.15;
    const lx = -r * 2.2 + Math.cos(ang) * dx - Math.sin(ang) * qy;
    const ly = Math.sin(ang) * dx + Math.cos(ang) * qy;
    const py = ly * (Math.cos(s.heading) < 0 ? -1 : 1);
    const h = s.heading;
    return {
      x: s.x + lx * Math.cos(h) - py * Math.sin(h),
      y: s.y + lx * Math.sin(h) + py * Math.cos(h),
    };
  }

  resetWhip() {
    const s = this.shark;
    const tip = this.whipTip();
    const bx = -Math.cos(s.heading) * WHIP_SEG;
    const by = -Math.sin(s.heading) * WHIP_SEG;
    s.whip = [];
    for (let i = 0; i <= WHIP_SEGMENTS; i += 1) {
      s.whip.push({ x: tip.x + bx * i, y: tip.y + by * i });
    }
    s.whipStiff = 0;
  }

  distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  updateRound(dt, input) {
    const C = THRESHER;
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

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.krill.length < C.foodCount) {
      this.spawnTimer = 1.6;
      this.spawnKrill();
    }
    for (const k of this.krill) {
      k.phase += dt;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      if (k.x < 40) k.vx = Math.abs(k.vx);
      if (k.x > W - 40) k.vx = -Math.abs(k.vx);
      if (k.y < C.topBound) k.vy = Math.abs(k.vy);
      if (k.y > C.bottomBound) k.vy = -Math.abs(k.vy);
      if (circleOverlap(p, { x: k.x, y: k.y, radius: k.r })) {
        k.dead = true;
        this.eaten += 1;
        this.particles.burst(k.x, k.y, { count: 8, speed: 110, life: 0.4, colors: ['#f7c8d8', '#ffd166'], buoyancy: -20 });
        this.game.audio.tone({ freq: 620, endFreq: 940, type: 'triangle', duration: 0.1, volume: 0.16 });
      }
    }
    this.krill = this.krill.filter((k) => !k.dead);

    const s = this.shark;
    s.phase += dt;
    if (s.state === 'swim') {
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      s.vx += ((dx / d) * C.sharkSpeed - s.vx) * (1 - Math.exp(-1.5 * dt));
      s.vy += ((dy / d) * C.sharkSpeed - s.vy) * (1 - Math.exp(-1.5 * dt));
      s.timer -= dt;
      if (s.timer <= 0) {
        s.state = 'wind';
        s.timer = C.telegraph;
        this.game.audio.tone({ freq: 100, endFreq: 70, type: 'sawtooth', duration: 0.3, volume: 0.2 });
      }
    } else if (s.state === 'wind') {
      s.timer -= dt;
      s.vx *= Math.exp(-3 * dt);
      s.vy *= Math.exp(-3 * dt);
      s.swing += (-1.1 - s.swing) * (1 - Math.exp(-6 * dt));
      if (s.timer <= 0) {
        s.state = 'whip';
        s.timer = C.whipTime;
      }
    } else if (s.state === 'whip') {
      s.timer -= dt;
      const e = 1 - Math.max(0, s.timer) / C.whipTime;
      s.swing = -1.1 + e * 2.2;
      s.vx *= Math.exp(-2 * dt);
      s.vy *= Math.exp(-2 * dt);
      for (const tp of this.tailPoints()) {
        if (this.invuln <= 0 && circleOverlap(p, tp)) {
          if (this.catchPlayer('THE THRESHER\u2019S TAIL CAUGHT YOU')) return;
        }
      }
      if (s.timer <= 0) {
        s.state = 'recover';
        s.timer = C.recover;
      }
    } else {
      s.timer -= dt;
      s.swing += (0 - s.swing) * (1 - Math.exp(-4 * dt));
      s.vx *= Math.exp(-2 * dt);
      s.vy *= Math.exp(-2 * dt);
      if (s.timer <= 0) {
        s.state = 'swim';
        s.timer = rand(1.2, 2.2);
      }
    }
    s.x = clamp(s.x + s.vx * dt, 40, W - 40);
    s.y = clamp(s.y + s.vy * dt, C.topBound, C.bottomBound);
    if (Math.hypot(s.vx, s.vy) > 10) s.heading = Math.atan2(s.vy, s.vx);

    if (!s.whip || s.whip.length !== WHIP_SEGMENTS + 1) this.resetWhip();
    const tip = this.whipTip();
    s.whip[0].x = tip.x;
    s.whip[0].y = tip.y;
    const stiffTarget = s.state === 'wind' ? 1 : 0;
    s.whipStiff += (stiffTarget - s.whipStiff) * (1 - Math.exp(-8 * dt));
    const whip = s.whip;
    const bx = whip[0].x - whip[1].x;
    const by = whip[0].y - whip[1].y;
    const bd = Math.hypot(bx, by) || 1;
    for (let i = 1; i < whip.length; i += 1) {
      const prev = whip[i - 1];
      const node = whip[i];
      const dx = node.x - prev.x;
      const dy = node.y - prev.y;
      const d = Math.hypot(dx, dy) || 1;
      let tx = prev.x + (dx / d) * WHIP_SEG;
      let ty = prev.y + (dy / d) * WHIP_SEG;
      if (s.whipStiff > 0.01) {
        const sx = whip[0].x - (bx / bd) * WHIP_SEG * i;
        const sy = whip[0].y - (by / bd) * WHIP_SEG * i;
        tx += (sx - tx) * s.whipStiff;
        ty += (sy - ty) * s.whipStiff;
      }
      node.x = tx;
      node.y = ty;
    }
    if (this.invuln <= 0) {
      for (let i = 0; i < whip.length - 1; i += 1) {
        const near = this.distToSegment(p.x, p.y, whip[i].x, whip[i].y, whip[i + 1].x, whip[i + 1].y);
        if (near < p.radius + s.radius * 0.16) {
          if (this.catchPlayer('THE THRESHER\u2019S WHIP CAUGHT YOU')) return;
          break;
        }
      }
    }

    this.particles.update(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);

    if (this.eaten >= C.foodGoal) this.finish(true);
  }

  renderRound(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1f7fa6');
    sky.addColorStop(0.6, '#0f5578');
    sky.addColorStop(1, '#062f45');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(200, 240, 255, 0.12)';
    for (let i = 0; i < 40; i += 1) {
      const bx = (i * 197 + this.time * 20 * (i % 2 ? 1 : -1)) % W;
      const by = (i * 83) % H;
      ctx.beginPath();
      ctx.arc((bx + W) % W, by, 2 + (i % 3), 0, TAU);
      ctx.fill();
    }

    const s = this.shark;
    if (s.state === 'wind') {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 120, 120, ${0.3 + 0.3 * Math.sin(this.time * 20)})`;
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      for (const tp of this.tailPoints()) {
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, tp.r * 1.6, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (s.whip && s.whip.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 0; i < s.whip.length - 1; i += 1) {
        const t = i / (s.whip.length - 1);
        ctx.strokeStyle = `rgba(158, 169, 180, ${0.92 - t * 0.72})`;
        ctx.lineWidth = Math.max(1, s.radius * 0.17 * (1 - t));
        ctx.beginPath();
        ctx.moveTo(s.whip[i].x, s.whip[i].y);
        ctx.lineTo(s.whip[i + 1].x, s.whip[i + 1].y);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.heading);
    if (Math.cos(s.heading) < 0) ctx.scale(1, -1);
    drawThresher(ctx, s.radius, { age: this.time, phase: s.phase, tail: (s.swing + 1.1) / 2.2 });
    ctx.restore();

    for (const k of this.krill) {
      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.fillStyle = '#f7c8d8';
      ctx.beginPath();
      ctx.ellipse(0, 0, k.r, k.r * 0.6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(k.r * 0.4, -k.r * 0.1, k.r * 0.3, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    this.renderPlayers(ctx);
    this.particles.render(ctx);
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, "THE THRESHER'S LAGOON", W / 2, 28, { size: 23, color: COLORS.text, glow: 'rgba(150, 210, 240, 0.5)', glowBlur: 16 });
    drawText(ctx, `LIVES ${this.lives}`, 24, 26, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < THRESHER.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 48, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }

    const prog = clamp(this.eaten / THRESHER.foodGoal, 0, 1);
    fillRoundRect(ctx, W - 264, 26, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 264, 26, 240 * prog, 10, 5, '#ffd166');
    drawText(ctx, `KRILL ${this.eaten}/${THRESHER.foodGoal}`, W - 264, 52, { size: 12, color: COLORS.textDim, align: 'left' });

    if (this.shark.state === 'wind') {
      drawText(ctx, 'THE TAIL IS WINDING UP!', W / 2, 56, { size: 15, color: COLORS.danger, alpha: 0.6 + 0.4 * Math.sin(this.time * 16) });
    } else if (this.shark.state === 'whip') {
      drawText(ctx, 'WHIP!', W / 2, 56, { size: 18, color: COLORS.danger, alpha: 0.9 });
    } else if (this.statusTimer > 0) {
      drawText(ctx, this.status, W / 2, 56, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }

    drawText(ctx, 'WASD / ARROWS \u2014 SWIM      EAT THE KRILL, DODGE THE TAIL      ESC \u2014 BACK', W / 2, H - 14, {
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
    drawThresher(ctx, 50, { age: this.time, tail: 1 });
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
    return "THE THRESHER'S LAGOON";
  }

  resultsHeadline() {
    return this.won ? 'YOU OUT-SWAM THE WHIP' : 'THE TAIL GOT YOU';
  }

  resultsDetail() {
    return `${this.eaten} KRILL \u00B7 ${this.lives} LIVES LEFT`;
  }
}
