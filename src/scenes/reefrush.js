import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { REEF_RUSH_TRACK } from '../assets/tracks.js';
import {
  INSTRUMENTS,
  loadComposer,
  composerHasNotes,
  buildCustomTrack,
} from '../engine/composer.js';
import { loadRushCourse, rushCourseHasItems, rushItemRect } from '../engine/rushcourse.js';
import { rushLevelById, beatLevel } from '../engine/rushlevels.js';
import { drawStingrayBody } from '../entities/stingray.js';
import { drawDartEelHead } from '../entities/darteel.js';
import { paintMorayTrail } from '../entities/eel.js';
import { recordWin } from '../engine/records.js';
import { REEF_RUSH, COLORS, SKINS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const W = LOGICAL_WIDTH;
const H = LOGICAL_HEIGHT;
const DIFFICULTY_NAMES = {
  easy: 'CALM',
  normal: 'CHOPPY',
  hard: 'RIPTIDE',
  apocalyptic: 'MAELSTROM',
};

const FORM_PHYSICS = {
  fish: { gravity: 1, jump: 1 },
  stingray: { gravity: 0.22, thrust: 1500 },
  eel: { dart: 320, tap: 0.09 },
  crab: {},
  urchin: { drift: 900 },
  jelly: { gravity: 0.62, hop: 540, cooldown: 0.1 },
};

const PORTAL_COLORS = {
  fish: '#63e6ff',
  stingray: '#7f97a8',
  eel: '#5d7a52',
  crab: '#d96448',
  urchin: '#7a5b96',
  jelly: '#c9a6ff',
};

const SPOTTED_RAY = SKINS.find((skin) => skin.key === 'spottedray') ?? {};

const DART_EEL_PALETTE = {
  bodyColor: COLORS.eel,
  outlineColor: COLORS.eelDark,
  ridgeColor: COLORS.eelBelly,
  spots: false,
};

function drawSpottedRay(ctx, radius, time) {
  drawStingrayBody(ctx, radius, {
    raw: true,
    bodyColor: SPOTTED_RAY.body ?? COLORS.stingray,
    spotColor: SPOTTED_RAY.accent ?? 'rgba(70, 62, 50, 0.35)',
    tailColor: SPOTTED_RAY.tail ?? COLORS.stingray,
    tailOutline: SPOTTED_RAY.tailOutline ?? null,
    eyeColor: '#10233a',
    tailPhase: time * 8,
  });
}

export class ReefRushScene extends MinigameScene {
  enter(params = {}) {
    this.seed = Number.isFinite(params.seed) ? params.seed >>> 0 : (Math.random() * 0xffffffff) >>> 0;
    this.composer = loadComposer();
    this.custom = Boolean(params.custom) && composerHasNotes(this.composer);
    this.rushCourse = Boolean(params.course) ? loadRushCourse() : null;
    this.course = Boolean(this.rushCourse) && rushCourseHasItems(this.rushCourse);
    this.fromBuilder = Boolean(params.fromBuilder);
    this.level = params.level ? rushLevelById(params.level) : null;
    this.playTrack = this.custom ? buildCustomTrack(this.composer) : REEF_RUSH_TRACK;
    this.beat = this.playTrack.beat;
    if (this.game.music) {
      this.previousTrack = this.game.music.source ?? this.game.music.track;
      this.previousHold = this.game.music.hold;
      this.game.music.play(this.playTrack);
      this.game.music.hold = false;
    }
    super.enter({ ...params, solo: true });
    if (this.fromBuilder) {
      this.resultsMenu.items = [
        { label: 'BACK TO BUILDING', action: 'builder' },
        { label: 'PLAY AGAIN', action: 'again' },
        { label: 'MINIGAMES', action: 'minigames' },
      ];
      this.resultsMenu.reset();
    }
  }

  exit() {
    if (!this.game.music || !this.previousTrack) return;
    this.game.music.play(this.previousTrack);
    this.game.music.hold = this.previousHold;
  }

  scale() {
    return REEF_RUSH.difficultyScale[this.difficultyKey] ?? REEF_RUSH.difficultyScale.normal;
  }

  modeLabel() {
    if (this.level) return this.level.name;
    if (this.course) return 'MY COURSE';
    if (this.custom) return 'MY TRACK';
    return 'REEF RUSH';
  }

  buildRound() {
    this.spawnSharks([{ x: REEF_RUSH.playerX, y: LOGICAL_HEIGHT * 0.5 }]);
    this.player = this.players[0];
    this.player.santa = false;
    this.scrollX = 0;
    this.distance = 0;
    this.speed = REEF_RUSH.runSpeed * this.scale().speed;
    this.groundY = H * REEF_RUSH.groundY;
    this.items = [];
    this.obstacles = this.items;
    this.pearls = [];
    this.collected = 0;
    this.dying = 0;
    this.jumpBuffer = 0;
    this.coyote = REEF_RUSH.coyote;
    this.form = 'fish';
    this.jumpCooldown = 0;
    this.gravityUp = false;
    this.dartTap = 0;
    this.dartTrail = [];
    this.bubbleCooldown = 0;
    this.padCooldown = 0;
    this.rndState = this.seed || 1;
    this.player.x = REEF_RUSH.playerX;
    this.player.y = this.groundY - this.player.radius;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.onGround = true;
    this.goalDistance = this.level
      ? this.buildItems(this.level.items, this.level.goal)
      : this.custom
        ? this.buildCustomCourse()
        : this.course
          ? this.buildItems(this.rushCourse.items, this.rushCourse.goal)
          : this.buildClassicCourse();
    this.buildBackdrop();
  }

  buildBackdrop() {
    this.bg = [];
    let bx = 0;
    while (bx < this.goalDistance + W + 400) {
      this.bg.push({ x: bx, h: rand(40, 130), w: rand(30, 70), kind: Math.random() < 0.5 ? 'coral' : 'weed' });
      bx += rand(90, 200);
    }
  }

  buildItems(items, goal) {
    const startPad = W * 0.6;
    for (const item of items) {
      if (item.kind === 'pearl') {
        this.pearls.push({ x: item.x + startPad, y: this.groundY - item.h, taken: false, phase: rand(0, TAU) });
      } else {
        this.items.push({ ...item, x: item.x + startPad, phase: rand(0, TAU) });
      }
    }
    return goal + startPad + W;
  }

  buildCustomCourse() {
    const cfg = REEF_RUSH.custom;
    const scale = this.scale();
    const stepSpacing = REEF_RUSH.runSpeed * this.beat * scale.speed;
    const stepsPerLoop = this.composer.steps;
    const totalSteps = stepsPerLoop * cfg.loops;
    const pearls = [];
    for (let loop = 0; loop < cfg.loops; loop += 1) {
      for (let step = 0; step < stepsPerLoop; step += 1) {
        const worldX = (loop * stepsPerLoop + step) * stepSpacing + W * 0.5;
        let shellHere = false;
        let rockHere = false;
        for (const inst of INSTRUMENTS) {
          for (const note of this.composer.tracks[inst.key]) {
            if (note.col !== step) continue;
            if (inst.key === 'DRUMS') {
              const h = clamp(
                (0.55 + (note.line / Math.max(1, inst.lines.length - 1)) * 0.5) * REEF_RUSH.shell.maxHeight * scale.spike,
                20,
                cfg.spikeCap,
              );
              this.items.push({ kind: 'shell', x: worldX, h, count: 1, phase: 0 });
              shellHere = true;
            } else if (inst.key === 'BASS') {
              const size =
                REEF_RUSH.rock.minSize +
                (note.line / Math.max(1, inst.lines.length - 1)) * (REEF_RUSH.rock.maxSize - REEF_RUSH.rock.minSize);
              this.items.push({ kind: 'rock', x: worldX + (shellHere ? 26 : 0), h: size, count: 1, phase: 0 });
              rockHere = true;
            } else {
              const frac = note.line / Math.max(1, inst.lines.length - 1);
              pearls.push({ x: worldX + (rockHere ? 34 : 0), y: this.groundY - 70 - frac * 150, taken: false, phase: rand(0, TAU) });
            }
          }
        }
      }
    }
    this.pearls.push(...pearls);
    return totalSteps * stepSpacing + W * 0.5;
  }

  rnd() {
    this.rndState = (this.rndState * 1664525 + 1013904223) >>> 0;
    return this.rndState / 4294967296;
  }

  spikeHeight() {
    return rand(REEF_RUSH.shell.minHeight, REEF_RUSH.shell.maxHeight) * this.scale().spike;
  }

  placeMotif(motif, baseX) {
    const cfg = REEF_RUSH;
    const scale = this.scale();
    if (motif === 'shell') {
      this.items.push({ kind: 'shell', x: baseX, h: this.spikeHeight(), count: 1, phase: rand(0, TAU) });
    } else if (motif === 'shellstair') {
      const count = 3;
      for (let i = 0; i < count; i += 1) {
        this.items.push({ kind: 'shell', x: baseX + i * 46, h: this.spikeHeight() * (0.5 + (i / count) * 0.9), count: 1, phase: rand(0, TAU) });
      }
    } else if (motif === 'rock') {
      this.items.push({ kind: 'rock', x: baseX, h: rand(cfg.rock.minSize, cfg.rock.maxSize) * scale.spike, count: 2, phase: rand(0, TAU) });
    } else if (motif === 'rockshell') {
      this.items.push({ kind: 'rock', x: baseX, h: cfg.rock.minSize, count: 1, phase: rand(0, TAU) });
      this.items.push({ kind: 'shell', x: baseX + 6, h: this.spikeHeight(), count: 1, phase: rand(0, TAU) });
    } else if (motif === 'rise') {
      this.items.push({ kind: 'rock', x: baseX, h: cfg.rock.maxSize, count: 2, phase: rand(0, TAU) });
      this.items.push({ kind: 'shell', x: baseX + 90, h: this.spikeHeight() * 0.9, count: 1, phase: rand(0, TAU) });
    }
  }

  buildClassicCourse() {
    const scale = this.scale();
    const airtime = (2 * REEF_RUSH.jump) / REEF_RUSH.gravity;
    const spacing = Math.max(this.speed * this.beat * 4 * scale.gap, this.speed * airtime * 1.35);
    const course = REEF_RUSH.course;
    let x = W * 0.7;
    for (let i = 0; i < course.length; i += 1) {
      this.placeMotif(course[i], x);
      const breather = i % 4 === 3 ? 1.35 : 1;
      x += spacing * breather;
    }
    return x + W * 0.5;
  }

  kill() {
    if (this.dying > 0) return;
    this.dying = 0.7;
    this.flash = 0.7;
    this.shake = 0.7;
    this.player.vx = 0;
    this.particles.burst(this.player.x, this.player.y, {
      count: 20,
      speed: 260,
      life: 0.7,
      colors: ['#ff6b81', '#ffd166', '#ffffff'],
      buoyancy: -30,
    });
    this.game.audio.tone({ freq: 200, endFreq: 60, type: 'sawtooth', duration: 0.4, volume: 0.28 });
  }

  updateRound(dt, input) {
    const cfg = REEF_RUSH;
    if (this.dying > 0) {
      this.dying -= dt;
      if (this.dying <= 0) this.finish(false);
      return;
    }
    const player = this.player;
    const scale = this.scale();
    const form = FORM_PHYSICS[this.form] ?? FORM_PHYSICS.fish;
    this.speed = cfg.runSpeed * scale.speed * (form.speedScale ?? 1);
    this.scrollX += this.speed * dt;
    this.distance = this.scrollX;
    player.x = this.scrollX + cfg.playerX;

    const jumpPressed = input.wasPressed('confirm');
    const jumpHeld = input.isDown('confirm');
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    this.bubbleCooldown = Math.max(0, this.bubbleCooldown - dt);
    this.padCooldown = Math.max(0, this.padCooldown - dt);
    if (jumpPressed) this.jumpBuffer = cfg.jumpBuffer;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    const prevBottom = player.y + player.radius;
    const prevTop = player.y - player.radius;
    const dir = this.gravityUp ? -1 : 1;
    player.onGround = false;

    if (this.form === 'eel') {
      if (jumpPressed) this.dartTap = form.tap;
      else this.dartTap = Math.max(0, this.dartTap - dt);
      if (jumpHeld) player.vy = -form.dart * dir;
      else if (this.dartTap > 0) player.vy = -form.dart * dir;
      else player.vy = form.dart * dir;
    } else if (this.form === 'crab') {
      if (jumpPressed) this.flipGravity(true);
    } else if (this.form === 'urchin') {
      if (jumpPressed) this.flipGravity(false);
      player.vy += cfg.gravity * dir * dt;
      player.vy *= 1 - 1.2 * dt;
      player.vy = clamp(player.vy, -700, 700);
    } else if (this.form === 'jelly') {
      player.vy += cfg.gravity * form.gravity * dir * dt;
      if (jumpPressed && this.jumpCooldown <= 0) {
        player.vy = -form.hop * dir;
        this.jumpCooldown = form.cooldown;
        this.game.audio.tone({ freq: 620, endFreq: 900, type: 'triangle', duration: 0.08, volume: 0.14 });
      }
    } else if (this.form === 'stingray') {
      player.vy += cfg.gravity * form.gravity * dir * dt;
      if (jumpHeld) player.vy -= form.thrust * dir * dt;
      player.vy = clamp(player.vy, -820, 760);
    } else {
      const canJump = player.onGround || this.coyote > 0;
      if (this.jumpBuffer > 0 && canJump) {
        player.vy = -cfg.jump * form.jump * dir;
        player.onGround = false;
        this.coyote = 0;
        this.jumpBuffer = 0;
        this.game.audio.tone({ freq: 420, endFreq: 720, type: 'square', duration: 0.09, volume: 0.14 });
        this.particles.burst(player.x, player.y - player.radius * dir, {
          count: 6,
          speed: 120,
          life: 0.35,
          colors: ['rgba(200, 245, 255, 0.9)'],
          buoyancy: -10 * dir,
        });
      }
      player.vy += cfg.gravity * form.gravity * dir * dt;
    }

    player.y += player.vy * dt;

    if (this.form === 'eel') {
      this.dartTrail.unshift({ x: player.x, y: player.y });
      if (this.dartTrail.length > 34) this.dartTrail.length = 34;
    } else if (this.dartTrail.length) {
      this.dartTrail = [];
    }

    if (dir > 0) {
      if (player.y + player.radius >= this.groundY) {
        player.y = this.groundY - player.radius;
        if (player.vy > 0) player.vy = 0;
        player.onGround = true;
      }
      if (player.y - player.radius < 0) {
        player.y = player.radius;
        if (player.vy < 0) player.vy = 0;
      }
    } else {
      if (player.y - player.radius <= 0) {
        player.y = player.radius;
        if (player.vy < 0) player.vy = 0;
        player.onGround = true;
      }
      if (player.y + player.radius >= this.groundY) {
        player.y = this.groundY - player.radius;
        if (player.vy > 0) player.vy = 0;
      }
    }

    for (const item of this.items) {
      const rect = rushItemRect(item, this.groundY);
      if (item.kind === 'portal') {
        if (this.form !== item.form && this.circleRect(player, rect)) this.enterPortal(item);
        continue;
      }
      if (item.kind === 'bubble') {
        if (jumpPressed && this.bubbleCooldown <= 0 && this.circleRect(player, rect, 14)) {
          player.vy = -cfg.jump * dir;
          player.onGround = false;
          this.bubbleCooldown = 0.35;
          this.jumpBuffer = 0;
          const cx = rect.x + rect.w / 2;
          const cy = rect.y + rect.h / 2;
          this.game.audio.tone({ freq: 240, endFreq: 720, type: 'sine', duration: 0.16, volume: 0.2 });
          this.particles.burst(cx, cy, {
            count: 14,
            speed: 200,
            life: 0.5,
            colors: ['#8fd0ef', '#ffffff'],
            buoyancy: -30,
          });
        }
        continue;
      }
      if (item.kind === 'gravity') {
        if (jumpPressed && this.bubbleCooldown <= 0 && this.circleRect(player, rect, 14)) {
          if (!this.gravityUp) this.flipGravity(false);
          this.bubbleCooldown = 0.35;
          this.jumpBuffer = 0;
          const cx = rect.x + rect.w / 2;
          const cy = rect.y + rect.h / 2;
          this.game.audio.tone({ freq: 300, endFreq: 640, type: 'sine', duration: 0.18, volume: 0.2 });
          this.particles.burst(cx, cy, {
            count: 14,
            speed: 200,
            life: 0.5,
            colors: ['#c9a6ff', '#ffffff'],
            buoyancy: 0,
          });
        }
        continue;
      }
      if (item.kind === 'gravpad' || item.kind === 'ceilgravpad') {
        if (this.padCooldown <= 0 && this.circleRect(player, rect, 6)) {
          this.flipGravity(false);
          this.padCooldown = 0.4;
          this.jumpBuffer = 0;
          const cx = rect.x + rect.w / 2;
          const cy = item.kind === 'gravpad' ? rect.y : rect.y + rect.h;
          this.particles.burst(cx, cy, {
            count: 16,
            speed: 220,
            life: 0.55,
            colors: ['#b07bff', '#ffffff'],
            buoyancy: 0,
          });
        }
        continue;
      }
      if (item.kind === 'pad' || item.kind === 'ceilpad') {
        if (this.padCooldown <= 0 && this.circleRect(player, rect, 6)) {
          const up = item.kind === 'pad';
          player.vy = (up ? -1 : 1) * cfg.jump * 1.25;
          player.onGround = false;
          this.padCooldown = 0.3;
          this.jumpBuffer = 0;
          const cx = rect.x + rect.w / 2;
          const cy = up ? rect.y : rect.y + rect.h;
          this.game.audio.tone({ freq: 300, endFreq: 860, type: 'square', duration: 0.12, volume: 0.2 });
          this.particles.burst(cx, cy, {
            count: 12,
            speed: 220,
            life: 0.4,
            colors: ['#8fd0ef', '#ffffff'],
            buoyancy: up ? -30 : 30,
          });
        }
        continue;
      }
      if (item.kind === 'slopeup' || item.kind === 'slopedown') {
        if (dir > 0 && player.x >= rect.x && player.x <= rect.x + rect.w) {
          const t = (player.x - rect.x) / rect.w;
          const surf = item.kind === 'slopeup' ? this.groundY - t * rect.h : this.groundY - (1 - t) * rect.h;
          if (player.y + player.radius >= surf - 1) {
            player.y = surf - player.radius;
            if (player.vy > 0) player.vy = 0;
            player.onGround = true;
          }
        }
        continue;
      }
      if (item.kind === 'rock' || item.kind === 'ceilrock' || item.kind === 'ledge') {
        const overlapX = player.x + player.radius > rect.x + 4 && player.x - player.radius < rect.x + rect.w - 4;
        if (overlapX) {
          if (dir > 0) {
            const feet = player.y + player.radius;
            if (player.vy >= 0 && prevBottom <= rect.y + 6 && feet >= rect.y) {
              player.y = rect.y - player.radius;
              player.vy = 0;
              player.onGround = true;
              continue;
            }
          } else {
            const head = player.y - player.radius;
            if (player.vy <= 0 && prevTop >= rect.y + rect.h - 6 && head <= rect.y + rect.h) {
              player.y = rect.y + rect.h + player.radius;
              player.vy = 0;
              player.onGround = true;
              continue;
            }
          }
        }
      }
      if (this.circleRect(player, rect)) {
        this.kill();
        return;
      }
    }
    this.items = this.items.filter((item) => item.x + 120 > this.scrollX - 120);
    this.obstacles = this.items;

    for (const pearl of this.pearls) {
      if (pearl.taken) continue;
      if (circleOverlap(player, { x: pearl.x, y: pearl.y, radius: cfg.pearlRadius + 6 })) {
        pearl.taken = true;
        this.collected += 1;
        this.particles.burst(pearl.x, pearl.y, {
          count: 10,
          speed: 150,
          life: 0.5,
          colors: [COLORS.accent, '#ffffff'],
          buoyancy: -30,
        });
        this.game.audio.tone({ freq: 880, endFreq: 1320, type: 'triangle', duration: 0.1, volume: 0.16 });
      }
    }
    this.pearls = this.pearls.filter((pearl) => !pearl.taken && pearl.x > this.scrollX - 120);

    if (this.coyote > 0 && !player.onGround) this.coyote = Math.max(0, this.coyote - dt);
    if (player.onGround) this.coyote = cfg.coyote;

    if (this.distance >= this.goalDistance) {
      if (this.level) this.clearLevel();
      else this.finish(true);
    }
  }

  flipGravity(snap) {
    this.gravityUp = !this.gravityUp;
    const player = this.player;
    if (snap) player.y = this.gravityUp ? player.radius : this.groundY - player.radius;
    player.vy = 0;
    this.flash = 0.25;
    this.game.audio.tone({ freq: this.gravityUp ? 520 : 260, endFreq: this.gravityUp ? 780 : 180, type: 'square', duration: 0.1, volume: 0.16 });
    this.particles.burst(player.x, player.y, {
      count: 8,
      speed: 140,
      life: 0.4,
      colors: ['#ffffff', '#8fd0ef'],
      buoyancy: this.gravityUp ? 30 : -30,
    });
  }

  enterPortal(item) {
    if (this.form === item.form) return;
    this.form = item.form;
    this.gravityUp = false;
    this.dartTap = 0;
    this.flash = 0.4;
    this.jumpBuffer = 0;
    this.jumpCooldown = 0;
    const color = PORTAL_COLORS[item.form] ?? COLORS.bubble;
    this.game.audio.tone({ freq: 520, endFreq: 1040, type: 'triangle', duration: 0.2, volume: 0.2 });
    this.game.audio.tone({ freq: 780, endFreq: 1560, type: 'square', duration: 0.16, volume: 0.1, delay: 0.05 });
    this.particles.burst(this.player.x, this.player.y, {
      count: 16,
      speed: 220,
      life: 0.6,
      colors: [color, '#ffffff'],
      buoyancy: -20,
    });
  }

  clearLevel() {    const result = beatLevel(this.level);
    recordWin('reefrushlevel', { time: this.elapsed });
    this.game.changeScene('rushclear', {
      level: this.level.id,
      name: this.level.name,
      pearls: this.collected,
      time: this.elapsed,
      unlocked: result.unlocked,
      first: result.first,
    });
  }

  circleRect(circle, rect, pad = 0) {
    const cx = clamp(circle.x, rect.x + 3 - pad, rect.x + rect.w - 3 + pad);
    const cy = clamp(circle.y, rect.y + 3 - pad, rect.y + rect.h - 3 + pad);
    const dx = circle.x - cx;
    const dy = circle.y - cy;
    const r = circle.radius * 0.82;
    return dx * dx + dy * dy < r * r;
  }

  renderBackdrop(ctx) {
    for (const item of this.bg) {
      const x = item.x;
      if (x < this.scrollX - 120 || x > this.scrollX + W + 120) continue;
      const baseY = this.groundY;
      if (item.kind === 'coral') {
        ctx.strokeStyle = 'rgba(90, 200, 190, 0.35)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.quadraticCurveTo(x + 10, baseY - item.h * 0.6, x + 4, baseY - item.h);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(120, 230, 220, 0.28)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x + 14, baseY);
        ctx.quadraticCurveTo(x - 4, baseY - item.h * 0.5, x + 18, baseY - item.h * 0.8);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(70, 150, 120, 0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.quadraticCurveTo(x - 12, baseY - item.h * 0.5, x + 6, baseY - item.h);
        ctx.stroke();
      }
    }
  }

  renderShell(ctx, rect) {
    const tipX = rect.x + rect.w / 2;
    const grad = ctx.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
    grad.addColorStop(0, '#ffb27a');
    grad.addColorStop(0.5, '#ff8f5e');
    grad.addColorStop(1, '#d9663c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y + rect.h);
    ctx.quadraticCurveTo(tipX, rect.y + rect.h * 0.7, tipX, rect.y);
    ctx.quadraticCurveTo(tipX, rect.y + rect.h * 0.7, rect.x + rect.w, rect.y + rect.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 50, 20, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  renderSeaweed(ctx, rect, time) {
    const blades = 4;
    for (let i = 0; i < blades; i += 1) {
      const x = rect.x + (i + 0.5) * (rect.w / blades);
      const sway = Math.sin(time * 2 + i) * 4;
      ctx.strokeStyle = i % 2 === 0 ? '#2f7d4f' : '#3f9d63';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, rect.y + rect.h);
      ctx.quadraticCurveTo(x + sway, rect.y + rect.h * 0.4, x + sway * 1.5, rect.y);
      ctx.stroke();
    }
  }

  renderCeilingRock(ctx, rect) {
    const size = rect.w;
    const count = Math.max(1, Math.round(rect.h / (size * 0.85)));
    for (let i = 0; i < count; i += 1) {
      const y = rect.y + i * size * 0.85;
      fillRoundRect(ctx, rect.x, y, size, size * 0.85, 6, '#3f4f5e');
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(rect.x + 4, y + size * 0.85 - 8, size - 8, 4);
      ctx.strokeStyle = 'rgba(20, 30, 40, 0.8)';
      ctx.lineWidth = 2;
      strokeRoundRect(ctx, rect.x, y, size, size * 0.85, 6, 'rgba(20, 30, 40, 0.8)', 2);
    }
  }

  renderGravityBubble(ctx, rect, item) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const r = rect.w / 2;
    const pulse = 1 + Math.sin(this.time * 4 + item.x) * 0.06;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#a078ff';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.35, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(160, 120, 255, 0.28)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * pulse, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#c9a6ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = '#eae0ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.42);
    ctx.lineTo(cx, cy + r * 0.42);
    ctx.moveTo(cx - r * 0.28, cy - r * 0.16);
    ctx.lineTo(cx, cy - r * 0.42);
    ctx.lineTo(cx + r * 0.28, cy - r * 0.16);
    ctx.moveTo(cx - r * 0.28, cy + r * 0.16);
    ctx.lineTo(cx, cy + r * 0.42);
    ctx.lineTo(cx + r * 0.28, cy + r * 0.16);
    ctx.stroke();
    ctx.restore();
  }

  renderLedge(ctx, rect) {
    fillRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 5, '#5a6b7c');
    strokeRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 5, 'rgba(20, 30, 40, 0.85)', 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fillRect(rect.x + 3, rect.y + 3, rect.w - 6, 3);
  }

  renderSlope(ctx, rect, up) {
    const base = this.groundY;
    ctx.beginPath();
    if (up) {
      ctx.moveTo(rect.x, base);
      ctx.lineTo(rect.x + rect.w, rect.y);
      ctx.lineTo(rect.x + rect.w, base);
    } else {
      ctx.moveTo(rect.x, rect.y);
      ctx.lineTo(rect.x + rect.w, base);
      ctx.lineTo(rect.x, base);
    }
    ctx.closePath();
    ctx.fillStyle = '#55697a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 30, 40, 0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (up) {
      ctx.moveTo(rect.x + 4, base - 2);
      ctx.lineTo(rect.x + rect.w - 4, rect.y + 2);
    } else {
      ctx.moveTo(rect.x + 4, rect.y + 2);
      ctx.lineTo(rect.x + rect.w - 4, base - 2);
    }
    ctx.stroke();
  }

  renderThrustPad(ctx, rect, up, gravity = false) {
    const w = rect.w;
    const h = rect.h;
    const face = gravity ? (up ? '#7a4fd6' : '#5f3aa8') : up ? '#3f8fb5' : '#2f6f8f';
    ctx.save();
    fillRoundRect(ctx, rect.x, rect.y, w, h, Math.min(8, h / 2), face);
    strokeRoundRect(ctx, rect.x, rect.y, w, h, Math.min(8, h / 2), '#eaf6ff', 2);
    const cx = rect.x + w / 2;
    const dir = up ? -1 : 1;
    const baseY = up ? rect.y + h * 0.78 : rect.y + h * 0.22;
    ctx.strokeStyle = '#eaf6ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.22, baseY);
    ctx.lineTo(cx, baseY + dir * h * 0.5);
    ctx.lineTo(cx + w * 0.22, baseY);
    ctx.stroke();
    if (gravity) {
      ctx.beginPath();
      ctx.moveTo(cx, rect.y + h * 0.5 - h * 0.22);
      ctx.lineTo(cx, rect.y + h * 0.5 + h * 0.22);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderCeilingShell(ctx, rect) {
    const tipX = rect.x + rect.w / 2;
    const grad = ctx.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
    grad.addColorStop(0, '#ffb27a');
    grad.addColorStop(0.5, '#ff8f5e');
    grad.addColorStop(1, '#d9663c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y);
    ctx.quadraticCurveTo(tipX, rect.y + rect.h * 0.3, tipX, rect.y + rect.h);
    ctx.quadraticCurveTo(tipX, rect.y + rect.h * 0.3, rect.x + rect.w, rect.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 50, 20, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  renderCeilingWeed(ctx, rect, time) {
    const blades = 4;
    for (let i = 0; i < blades; i += 1) {
      const x = rect.x + (i + 0.5) * (rect.w / blades);
      const sway = Math.sin(time * 2 + i) * 4;
      ctx.strokeStyle = i % 2 === 0 ? '#2f7d4f' : '#3f9d63';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, rect.y);
      ctx.quadraticCurveTo(x + sway, rect.y + rect.h * 0.6, x + sway * 1.5, rect.y + rect.h);
      ctx.stroke();
    }
  }

  renderRock(ctx, rect) {
    const size = rect.w;
    const count = Math.max(1, Math.round(rect.h / (size * 0.85)));
    for (let i = 0; i < count; i += 1) {
      const y = this.groundY - (i + 1) * size * 0.85;
      fillRoundRect(ctx, rect.x, y, size, size * 0.85, 6, '#4a5b6b');
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(rect.x + 4, y + 4, size - 8, 4);
      ctx.strokeStyle = 'rgba(20, 30, 40, 0.8)';
      ctx.lineWidth = 2;
      strokeRoundRect(ctx, rect.x, y, size, size * 0.85, 6, 'rgba(20, 30, 40, 0.8)', 2);
    }
  }

  renderItem(ctx, item) {
    const rect = rushItemRect(item, this.groundY);
    if (rect.x + rect.w < this.scrollX - 80 || rect.x > this.scrollX + W + 80) return;
    switch (item.kind) {
      case 'shell':
        this.renderShell(ctx, rect);
        break;
      case 'seaweed':
        this.renderSeaweed(ctx, rect, this.time);
        break;
      case 'ceilshell':
        this.renderCeilingShell(ctx, rect);
        break;
      case 'ceilweed':
        this.renderCeilingWeed(ctx, rect, this.time);
        break;
      case 'rock':
        this.renderRock(ctx, rect);
        break;
      case 'ceilrock':
        this.renderCeilingRock(ctx, rect);
        break;
      case 'bubble':
        this.renderBubble(ctx, rect, item);
        break;
      case 'gravity':
        this.renderGravityBubble(ctx, rect, item);
        break;
      case 'gravpad':
        this.renderThrustPad(ctx, rect, true, true);
        break;
      case 'ceilgravpad':
        this.renderThrustPad(ctx, rect, false, true);
        break;
      case 'pad':
        this.renderThrustPad(ctx, rect, true, false);
        break;
      case 'ceilpad':
        this.renderThrustPad(ctx, rect, false, false);
        break;
      case 'ledge':
        this.renderLedge(ctx, rect);
        break;
      case 'slopeup':
      case 'slopedown':
        this.renderSlope(ctx, rect, item.kind === 'slopeup');
        break;
      case 'portal':
        this.renderPortal(ctx, rect, item);
        break;
      default:
        break;
    }
  }

  renderBubble(ctx, rect, item) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const r = rect.w / 2;
    const pulse = 1 + Math.sin(this.time * 4 + item.x) * 0.06;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#8fd0ef';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.35, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(143, 208, 239, 0.25)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * pulse, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#cfefff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - r * 0.32, cy - r * 0.34, r * 0.2, 0, TAU);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();
    ctx.strokeStyle = '#eaf6ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.35);
    ctx.lineTo(cx, cy - r * 0.35);
    ctx.moveTo(cx - r * 0.3, cy - r * 0.05);
    ctx.lineTo(cx, cy - r * 0.35);
    ctx.lineTo(cx + r * 0.3, cy - r * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  renderPortal(ctx, rect, item) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const rx = rect.w / 2;
    const ry = rect.h / 2;
    const color = PORTAL_COLORS[item.form] ?? COLORS.bubble;
    const pulse = 0.6 + 0.4 * Math.sin(this.time * 4);
    ctx.save();
    ctx.globalAlpha = 0.3 * pulse;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 1.25, ry * 1.15, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(4, 16, 24, 0.85)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.72, ry * 0.8, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.72, ry * 0.8, 0, 0, TAU);
    ctx.stroke();
    if (item.form === 'stingray') {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.7, ry * 0.78, 0, 0, TAU);
      ctx.clip();
      ctx.translate(cx, cy);
      drawSpottedRay(ctx, rect.w * 0.3, this.time);
      ctx.restore();
    } else {
      drawText(ctx, String(item.form).toUpperCase(), cx, cy, { size: 11, color });
    }
    ctx.restore();
  }

  renderEelPlayer(ctx, p, r) {
    const trail =
      this.dartTrail.length >= 2
        ? this.dartTrail
        : [
            { x: p.x + 2, y: p.y },
            { x: p.x - 8, y: p.y },
          ];
    const radius = r * 0.62;
    paintMorayTrail(ctx, radius, trail, DART_EEL_PALETTE);
    const head = trail[0];
    const next = trail[1];
    const heading = Math.atan2(head.y - next.y, head.x - next.x);
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(heading);
    drawDartEelHead(ctx, radius, 1);
    ctx.restore();
  }

  renderPlayer(ctx) {
    const p = this.player;
    const r = p.radius;
    if (this.form === 'eel') {
      this.renderEelPlayer(ctx, p, r);
      return;
    }
    const color = PORTAL_COLORS[this.form] ?? '#63e6ff';

    ctx.save();
    ctx.translate(p.x, p.y);
    const tilt = clamp(p.vy / 1100, -0.6, 0.6);
    ctx.rotate(tilt);
    if (this.gravityUp && this.form !== 'crab' && this.form !== 'urchin') ctx.scale(1, -1);
    if (this.form === 'stingray') {
      drawSpottedRay(ctx, r * 0.85, this.time);
    } else if (this.form === 'crab' || this.form === 'urchin') {
      const flip = this.gravityUp ? -1 : 1;
      ctx.scale(flip * 0.78, flip * 0.78);
      if (this.form === 'crab') {
        ctx.fillStyle = '#d96448';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.25, r * 0.95, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#a8452f';
        ctx.lineWidth = 2;
        ctx.stroke();
        for (const side of [-1, 1]) {
          ctx.strokeStyle = '#d96448';
          ctx.lineWidth = r * 0.28;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(side * r * 0.7, r * 0.2);
          ctx.lineTo(side * r * 1.5, r * 0.7);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(side * r * 1.7, r * 0.75, r * 0.3, 0, TAU);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(side * r * 1.0, r * 0.6);
          ctx.lineTo(side * r * 1.2, r * 1.2);
          ctx.stroke();
        }
        ctx.fillStyle = '#20140c';
        ctx.beginPath();
        ctx.arc(-r * 0.4, -r * 0.35, r * 0.16, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.4, -r * 0.35, r * 0.16, 0, TAU);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#3a2b46';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i += 1) {
          const a = (i / 12) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
          ctx.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4);
          ctx.stroke();
        }
        fillCircle(ctx, 0, 0, r, '#7a5b96');
      }
    } else if (this.form === 'jelly') {
      ctx.scale(0.78, 0.78);
      const pulse = 1 + Math.sin(this.time * 5) * 0.1;
      ctx.fillStyle = 'rgba(201, 166, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(0, -r * 0.2, r * 1.2 * pulse, Math.PI, TAU);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c9a6ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i += 1) {
        const x = -r * 0.8 + i * r * 0.55;
        ctx.beginPath();
        ctx.moveTo(x, r * 0.1);
        ctx.quadraticCurveTo(x + Math.sin(this.time * 6 + i) * 4, r * 0.8, x, r * 1.2);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#63e6ff';
      ctx.beginPath();
      ctx.moveTo(-r * 1.4, 0);
      ctx.lineTo(-r * 2.2, -r * 0.7);
      ctx.lineTo(-r * 2.2, r * 0.7);
      ctx.closePath();
      ctx.fill();
      const grad = ctx.createLinearGradient(-r, -r, r, r);
      grad.addColorStop(0, '#baffff');
      grad.addColorStop(1, '#2aa7c9');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.25, r, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(10, 60, 80, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0b1a2a';
      ctx.beginPath();
      ctx.arc(r * 0.55, -r * 0.2, r * 0.16, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r * 0.6, -r * 0.28, r * 0.06, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 1.9, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(-this.scrollX, 0);
    ctx.fillStyle = 'rgba(6, 26, 38, 0.9)';
    ctx.fillRect(this.scrollX, this.groundY, W, H - this.groundY);
    ctx.strokeStyle = 'rgba(120, 220, 230, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.scrollX, this.groundY);
    ctx.lineTo(this.scrollX + W, this.groundY);
    ctx.stroke();
    this.renderBackdrop(ctx);
    for (const item of this.items) this.renderItem(ctx, item);
    for (const pearl of this.pearls) {
      if (pearl.taken) continue;
      const bob = Math.sin(this.time * 3 + pearl.phase) * 3;
      fillCircle(ctx, pearl.x, pearl.y + bob, REEF_RUSH.pearlRadius, 'rgba(255, 209, 102, 0.3)');
      fillCircle(ctx, pearl.x, pearl.y + bob, REEF_RUSH.pearlRadius - 3, COLORS.accent);
    }
    this.renderPlayer(ctx);
    this.particles.render(ctx);
    ctx.restore();
  }

  renderHud(ctx) {
    const title = this.level ? `REEF RUSH — ${this.level.name}` : this.course ? 'REEF RUSH — MY COURSE' : this.custom ? 'REEF RUSH — MY TRACK' : 'REEF RUSH';
    drawText(ctx, title, 40, 34, {
      size: title === 'REEF RUSH' ? 20 : 17,
      color: COLORS.text,
      align: 'left',
      glow: COLORS.bubble,
      glowBlur: 10,
    });
    const sub = this.custom
      ? `${this.composer.steps} STEPS · ${DIFFICULTY_NAMES[this.difficultyKey] ?? 'CHOPPY'}`
      : this.course
        ? `${this.rushCourse.items.length} BLOCKS · ${DIFFICULTY_NAMES[this.difficultyKey] ?? 'CHOPPY'}`
        : DIFFICULTY_NAMES[this.difficultyKey] ?? 'CHOPPY';
    drawText(ctx, sub, 40, 58, {
      size: 12,
      color: COLORS.textDim,
      align: 'left',
    });
    const ratio = clamp(this.distance / this.goalDistance, 0, 1);
    fillRoundRect(ctx, 40, 74, 260, 8, 4, 'rgba(4, 16, 29, 0.6)');
    fillRoundRect(ctx, 40, 74, 260 * ratio, 8, 4, COLORS.accent);
    drawText(ctx, `${Math.round(this.distance)} M / ${Math.round(this.goalDistance)} M`, 40, 96, {
      size: 12,
      color: COLORS.textDim,
      align: 'left',
    });
    drawText(ctx, `MODE ${this.form.toUpperCase()}`, 40, 116, {
      size: 12,
      color: PORTAL_COLORS[this.form] ?? COLORS.bubble,
      align: 'left',
      glow: 'rgba(120, 220, 230, 0.35)',
      glowBlur: 8,
    });
    drawText(ctx, `PEARLS ${this.collected}`, W - 40, 34, {
      size: 16,
      color: COLORS.accent,
      align: 'right',
    });
    const note = this.custom
      ? 'PLAYING YOUR SAVED SONG'
      : this.course
        ? 'RUNNING YOUR COURSE'
        : this.level
          ? this.level.blurb
          : `SEED ${this.seed}  ·  ${Math.round(this.speed)} M/S`;
    drawText(ctx, note, W - 40, 58, {
      size: 12,
      color: COLORS.textDim,
      align: 'right',
    });
    if (this.dying > 0) {
      drawText(ctx, 'CRUNCH!', this.player.x, this.player.y - 44, {
        size: 18,
        color: COLORS.danger,
        glow: 'rgba(255, 107, 129, 0.6)',
        glowBlur: 12,
      });
    }
    drawText(
      ctx,
      'LEFT-CLICK / SPACE — JUMP / HOLD TO FLY      PORTALS CHANGE YOUR MODE      LAND ON ROCKS — CLEAR THE HAZARDS',
      W / 2,
      H - 16,
      { size: 11, color: COLORS.textDim, alpha: 0.75 },
    );
  }

  resultsTitle() {
    if (this.level) return `REEF RUSH — ${this.level.name}`;
    if (this.course) return 'REEF RUSH — MY COURSE';
    return this.custom ? 'REEF RUSH — MY TRACK' : 'REEF RUSH';
  }

  recordMode() {
    if (this.level) return 'reefrushlevel';
    if (this.course) return 'reefrushcourse';
    return this.custom ? 'reefrushcustom' : 'reefrush';
  }

  resultsHeadline() {
    return this.won ? 'REEF CLEARED!' : 'WRECKED ON THE REEF';
  }

  resultsDetail() {
    if (this.custom) return `${Math.round(this.distance)} M — ${this.collected} PEARLS — YOUR SONG`;
    if (this.course) return `${Math.round(this.distance)} M — ${this.collected} PEARLS — YOUR COURSE`;
    return `${Math.round(this.distance)} M — ${this.collected} PEARLS — SEED ${this.seed}`;
  }

  finish(won) {
    if (this.fromBuilder) {
      this.phase = 'results';
      this.won = won;
      this.reward = 0;
      this.newRecord = null;
      this.resultsMenu.reset();
      return;
    }
    super.finish(won);
  }

  chooseResult(action) {
    if (action === 'builder') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
      this.game.changeScene('rushbuilder');
      return;
    }
    super.chooseResult(action);
  }

  backScene() {
    return this.fromBuilder ? 'rushbuilder' : 'minigames';
  }
}