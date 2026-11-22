import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { Shark } from '../entities/shark.js';
import { drawOarfishBody } from '../entities/oarfish.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import { CONTROLS, COLORS, OARFISH, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;

export class OarfishScene extends MinigameScene {
  constructor() {
    super();
    this.name = 'oarfish';
  }

  buildRound() {
    const C = OARFISH;
    this.phase = 'play';
    this.worldLength = C.worldLength;
    this.exitZone = { x: this.worldLength - C.exitPad };
    this.lives = C.lives;
    this.invuln = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.status = 'CROSS SLOWLY \u2014 FAST STROKES NEAR ITS LATERAL LINE WAKEN IT';
    this.statusTimer = 4.4;
    this.camX = 0;
    this.streaks = [];
    for (let i = 0; i < 40; i += 1) {
      this.streaks.push({ x: rand(0, this.worldLength), y: rand(C.topBound, C.bottomBound), len: rand(20, 60), sp: rand(10, 30) });
    }

    const player = new Shark(C.startX, H / 2, { controls: CONTROLS.solo, pointer: true, maxX: this.worldLength });
    player.noIdleFlip = true;
    this.players = [player];
    this.player = player;

    this.oarfish = {
      x: C.startX + 1500,
      baseY: H / 2,
      y: H / 2,
      vx: C.driftSpeed,
      radius: C.radius,
      phase: rand(0, TAU),
      state: 'drift',
      timer: 0,
      alert: 0,
      heading: 0,
      strikeDir: 1,
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
    p.x = clamp(p.x - 260, OARFISH.startX, this.worldLength - 40);
    p.y = H / 2;
    p.vx = 0;
    p.vy = 0;
    const o = this.oarfish;
    o.x = clamp(p.x + 900, 200, this.worldLength - 200);
    o.y = H / 2;
    o.vx = OARFISH.driftSpeed;
    o.state = 'drift';
    o.timer = 0;
    o.alert = 0;
    this.invuln = 1.8;
    this.flash = 0;
    this.shake = 0;
    this.phase = 'play';
    this.status = 'THE RIBBON SETTLED \u2014 CROSS AGAIN, SLOWLY';
    this.statusTimer = 2.4;
  }

  headX() {
    return this.oarfish.x + (this.oarfish.vx >= 0 ? 1 : -1) * this.oarfish.radius * 3.5;
  }

  updateRound(dt, input) {
    const C = OARFISH;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }

    const p = this.player;
    p.update(dt, input);
    p.x = clamp(p.x, 20, this.worldLength - 20);
    p.y = clamp(p.y, C.topBound, C.bottomBound);

    const o = this.oarfish;
    o.phase += dt;
    const speed = Math.hypot(p.vx, p.vy);
    const stroke = speed / p.maxSpeed;

    if (o.state === 'drift') {
      o.x += o.vx * dt;
      if (o.x < 400) o.vx = Math.abs(o.vx);
      else if (o.x > this.worldLength - 400) o.vx = -Math.abs(o.vx);
      o.y = o.baseY + Math.sin(o.phase * 0.7) * 70;
      o.heading = o.vx >= 0 ? 0 : Math.PI;

      const onLine = Math.abs(p.y - o.y) < C.lateralRange && Math.abs(p.x - o.x) < C.senseLength;
      if (onLine && stroke > C.strokeThreshold) {
        o.alert = clamp(o.alert + C.alertRise * (stroke - C.strokeThreshold + 0.2) * dt, 0, 1);
      } else {
        o.alert = clamp(o.alert - (onLine ? C.idleDrain : C.alertFall) * dt, 0, 1);
      }
      if (o.alert >= 1) {
        o.state = 'strike';
        o.timer = C.strikeTime;
        o.strikeDir = p.x >= o.x ? 1 : -1;
        o.vx = o.strikeDir * C.strikeSpeed;
        this.game.audio.tone({ freq: 160, endFreq: 60, type: 'sawtooth', duration: 0.4, volume: 0.26 });
      }
    } else if (o.state === 'strike') {
      o.timer -= dt;
      o.x = clamp(o.x + o.vx * dt, 60, this.worldLength - 60);
      o.y += ((p.y) - o.y) * (1 - Math.exp(-3 * dt));
      o.heading = o.vx >= 0 ? 0 : Math.PI;
      if (o.timer <= 0 || o.x <= 60 || o.x >= this.worldLength - 60) {
        o.state = 'recover';
        o.timer = C.recoverTime;
      }
    } else {
      o.timer -= dt;
      o.vx *= Math.exp(-4 * dt);
      o.x = clamp(o.x + o.vx * dt, 200, this.worldLength - 200);
      o.alert = clamp(o.alert - C.alertFall * dt, 0, 1);
      if (o.timer <= 0) {
        o.state = 'drift';
        o.vx = o.strikeDir * C.driftSpeed;
      }
    }

    if (this.invuln <= 0 && o.state !== 'drift') {
      if (circleOverlap(p, { x: this.headX(), y: o.y, radius: o.radius * 0.8 })) {
        if (this.catchPlayer('THE OARFISH SWEPT YOU ASIDE')) return;
      }
    }

    for (const s of this.streaks) {
      s.x -= s.sp * dt;
      if (s.x < 0) s.x += this.worldLength;
    }

    this.particles.update(dt);
    this.camX = clamp(p.x - W * 0.35, 0, Math.max(0, this.worldLength - W));
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);

    if (p.x >= this.exitZone.x) this.finish(true);
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(-this.camX, 0);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1b6f92');
    sky.addColorStop(0.5, '#0f4d70');
    sky.addColorStop(1, '#07304a');
    ctx.fillStyle = sky;
    ctx.fillRect(this.camX - 20, 0, W + 40, H);

    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#dff4ff';
    for (let i = 0; i < 5; i += 1) {
      const bx = this.camX + ((this.time * 6 + i * 260) % (W + 320)) - 160;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 60, 0);
      ctx.lineTo(bx + 220, H);
      ctx.lineTo(bx + 120, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(220, 245, 255, 0.12)';
    ctx.lineWidth = 2;
    for (const s of this.streaks) {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len, s.y);
      ctx.stroke();
    }

    this.renderExit(ctx);

    const o = this.oarfish;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.scale(o.vx >= 0 ? 1 : -1, 1);
    drawOarfishBody(ctx, o.radius, { age: this.time, phase: o.phase, alert: o.alert });
    ctx.restore();

    this.renderPlayers(ctx);
    this.particles.render(ctx);
    ctx.restore();
  }

  renderExit(ctx) {
    const x = this.exitZone.x;
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#bff0ff';
    ctx.fillRect(x - 40, 0, 80, H);
    ctx.restore();
    ctx.strokeStyle = 'rgba(191, 240, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 40, 0, 80, H);
    drawText(ctx, 'THE OPEN BLUE', x, 40, { size: 15, color: COLORS.bubble });
  }

  renderHud(ctx) {
    drawText(ctx, 'THE OARFISH', W / 2, 30, { size: 24, color: COLORS.text, glow: 'rgba(143, 224, 239, 0.5)', glowBlur: 16 });
    drawText(ctx, `LIVES ${this.lives}`, 24, 28, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < OARFISH.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 50, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }

    const progress = clamp(this.player.x / this.exitZone.x, 0, 1);
    fillRoundRect(ctx, W - 264, 28, 240, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 264, 28, 240 * progress, 10, 5, '#ffd166');

    const alert = this.oarfish.alert;
    drawText(ctx, 'ITS LATERAL LINE', W - 264, 54, { size: 11, color: COLORS.textDim, align: 'left' });
    fillRoundRect(ctx, W - 156, 46, 132, 10, 5, 'rgba(6, 20, 26, 0.8)');
    fillRoundRect(ctx, W - 156, 46, 132 * alert, 10, 5, alert > 0.6 ? COLORS.danger : '#8fe0ef');

    const fast = Math.hypot(this.player.vx, this.player.vy) / this.player.maxSpeed > OARFISH.strokeThreshold;
    drawText(
      ctx,
      fast ? 'SWIMMING FAST \u2014 STAY SLOW NEAR IT' : 'SLOW AND QUIET',
      W / 2,
      92,
      { size: 13, color: fast ? COLORS.danger : '#8fe0ef', alpha: 0.9 },
    );
    if (this.statusTimer > 0) {
      drawText(ctx, this.status, W / 2, 112, { size: 12, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
    if (this.oarfish.state !== 'drift') {
      drawText(ctx, 'IT STRIKES!', W / 2, 60, { size: 16, color: COLORS.danger, alpha: 0.6 + 0.4 * Math.sin(this.time * 14) });
    }

    drawText(ctx, 'WASD / ARROWS / DRAG \u2014 SWIM SLOWLY PAST IT      ESC \u2014 BACK', W / 2, H - 14, {
      size: 10,
      color: COLORS.textDim,
      alpha: 0.72,
    });
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.93)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(1.3, 1.3);
    drawOarfishBody(ctx, 40, { age: this.time, phase: 0, alert: 1 });
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
    return 'THE OARFISH';
  }

  resultsHeadline() {
    return this.won ? 'YOU SLIPPED INTO THE OPEN BLUE' : 'THE RIBBON NOTICED YOU';
  }

  resultsDetail() {
    return `${this.lives} LIVES LEFT`;
  }
}
