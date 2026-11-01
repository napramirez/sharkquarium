import { MinigameScene } from '../engine/minigame.js';
import { recordWin } from '../engine/records.js';
import { SelectList } from '../engine/selectlist.js';
import {
  drawWater,
  drawText,
  fillCircle,
  fillRoundRect,
  strokeRoundRect,
} from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { loadJSON } from '../engine/storage.js';
import { setSkinClock } from '../engine/skin.js';
import { firstPersonMode } from '../engine/mode3d.js';
import { renderFirstPersonLevel } from '../engine/raycastview.js';
import { renderDarkness } from '../engine/horror.js';
import { motionScale } from '../engine/motion.js';
import { applyWardrobe } from '../engine/wardrobe.js';
import { drawTrail } from '../engine/trail.js';
import { drawCompanion } from '../engine/companion.js';
import { Shark } from '../entities/shark.js';
import { Stingray } from '../entities/stingray.js';
import { Squid } from '../entities/squid.js';
import { ArcticShrimp } from '../entities/arcticshrimp.js';
import { KelpCrab } from '../entities/kelpcrab.js';
import { MoonJelly } from '../entities/moonjelly.js';
import { Nautilus } from '../entities/nautilus.js';
import { QUIET_TRACK } from '../assets/tracks.js';
import {
  MOUTH,
  MOUTH_PALETTE,
  COLORS,
  CONTROLS,
  DIFFICULTY,
  SETTINGS_KEY,
  SHOP_KEY,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const DIVE_CREATURES = [
  { key: 'shark', label: 'SHARK', type: Shark },
  { key: 'stingray', label: 'STINGRAY', type: Stingray, options: { burrow: false } },
  { key: 'squid', label: 'SQUID', type: Squid },
  { key: 'arcticshrimp', label: 'SHRIMP', type: ArcticShrimp },
  { key: 'kelpcrab', label: 'CRAB', type: KelpCrab },
  { key: 'jellyfish', label: 'JELLY', type: MoonJelly },
  { key: 'nautilus', label: 'NAUTILUS', type: Nautilus, options: { vertical: true } },
];

export class MouthScene extends MinigameScene {
  enter(params = {}) {
    this.time = 0;
    this.solo = true;
    this.difficultyKey = loadJSON(SETTINGS_KEY, {}).difficulty ?? 'normal';
    this.rules = DIFFICULTY[this.difficultyKey] ?? DIFFICULTY.normal;
    this.enemyMult = this.mutator ? this.mutator.knobs.enemySpeedScale ?? 1 : 1;
    this.shop = loadJSON(SHOP_KEY, {});
    if (this.game.music) {
      this.previousTrack = this.game.music.track;
      this.previousHold = this.game.music.hold;
      this.game.music.play(QUIET_TRACK);
      this.game.music.hold = false;
    }
    this.resultsMenu = new SelectList(
      [
        { label: 'PLAY AGAIN', action: 'again' },
        { label: 'TANKS', action: 'tanks' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 46,
        fontSize: 20,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.chooseResult(item.action),
      },
    );
    this.creatureIndex = 0;
    this.creature = DIVE_CREATURES[0];
    this.selectMenu = new SelectList(
      [
        { label: `DIVER: ${this.creature.label}`, action: 'creature' },
        { label: 'START DIVE', action: 'start' },
        { label: 'BACK', action: 'back' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 44,
        fontSize: 22,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.chooseSelect(item.action),
      },
    );
    this.selectMenu.reset();
    this.phase = 'select';
    this.game.audio.tone({ freq: 90, endFreq: 45, type: 'sawtooth', duration: 0.5, volume: 0.24 });
  }

  exit() {
    if (!this.game.music || !this.previousTrack) return;
    this.game.music.play(this.previousTrack);
    this.game.music.hold = this.previousHold;
  }

  backScene() {
    return 'tanks';
  }

  finish(won) {
    this.phase = 'results';
    this.won = won;
    if (this.rushMode) return;
    this.reward = 0;
    this.newRecord = won ? recordWin(this.recordMode(), { time: this.elapsed }) : null;
    this.resultsMenu.reset();
    this.game.audio.tone({
      freq: won ? 523 : 100,
      endFreq: won ? 784 : 50,
      type: 'triangle',
      duration: 0.4,
      volume: 0.24,
    });
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('tanks');
  }

  cycleCreature(step) {
    const count = DIVE_CREATURES.length;
    this.creatureIndex = (this.creatureIndex + step + count) % count;
    this.creature = DIVE_CREATURES[this.creatureIndex];
    this.selectMenu.items[0].label = `DIVER: ${this.creature.label}`;
    this.game.audio.tone({ freq: 480 + this.creatureIndex * 50, duration: 0.05, volume: 0.12 });
  }

  chooseSelect(action) {
    if (action === 'back') {
      this.game.changeScene('tanks');
      return;
    }
    if (action === 'creature') {
      this.cycleCreature(1);
      return;
    }
    if (action === 'start') {
      this.resetRound();
      this.phase = 'play';
      this.cameraX = 0;
    }
  }

  rushStart() {
    this.resetRound();
    this.phase = 'play';
    this.cameraX = 0;
  }

  buildRound() {
    const Creature = this.creature.type;
    this.sectionCount = MOUTH.sections;
    this.worldLength =
      MOUTH.startPadding + this.sectionCount * MOUTH.sectionLength + MOUTH.exitLength;
    this.players = [
      new Creature(MOUTH.startPadding - 320, LOGICAL_HEIGHT * 0.45, {
        controls: CONTROLS.solo,
        pointer: false,
        ...(this.creature.options ?? {}),
      }),
    ];
    this.player = this.players[0];
    this.players.forEach((player) => {
      player.maxX = this.worldLength;
    });
    this.exitZone = { x: this.worldLength - MOUTH.exitLength * 0.5, y: LOGICAL_HEIGHT * 0.4 };
    this.safeY = LOGICAL_HEIGHT - MOUTH.mouthDepth;
    this.checkpoints = [];
    for (let s = 1; s < this.sectionCount; s += 1) {
      this.checkpoints.push({
        x: MOUTH.startPadding + s * MOUTH.sectionLength,
        y: LOGICAL_HEIGHT * 0.4,
        reached: false,
        radius: 46,
      });
    }
    this.checkpoint = { x: this.players[0].x, y: this.players[0].y };
    this.respawns = 0;
    this.checkpointNote = 0;
    this.cameraX = 0;
    this.danger = 0;
    this.heartbeatTimer = 1;
    this.heldAnchor = null;
    this.coinsCollected = 0;
    this.biteFlash = 0;
    this.phase = 'play';
    this.startSection(0);
  }

  startSection(index) {
    this.sectionIndex = index;
    const start = MOUTH.startPadding + index * MOUTH.sectionLength;
    const count = MOUTH.coins[Math.min(index, MOUTH.coins.length - 1)];
    this.coinTarget = count;
    this.coinsCollected = 0;
    this.coinBubbles = [];
    for (let i = 0; i < count; i += 1) {
      this.coinBubbles.push({
        x: start + 240 + (i * (MOUTH.sectionLength - 420)) / Math.max(1, count - 1),
        y: rand(90, this.safeY - 70),
        taken: false,
        phase: rand(0, TAU),
      });
    }
    const acount = MOUTH.anchors[Math.min(index, MOUTH.anchors.length - 1)];
    this.anchors = [];
    for (let i = 0; i < acount; i += 1) {
      this.anchors.push({
        x: start + 260 + (i * (MOUTH.sectionLength - 460)) / Math.max(1, acount - 1),
        y: 52,
        held: false,
        phase: rand(0, TAU),
      });
    }
    this.gulp = { state: 'idle', timer: MOUTH.idleTime, warn: false };
    this.suctionPower = MOUTH.suction[Math.min(index, MOUTH.suction.length - 1)] * this.enemyMult;
    this.gulpTime = MOUTH.gulpTime[Math.min(index, MOUTH.gulpTime.length - 1)];
    this.heldAnchor = null;
    this.banner = 3;
    this.note = 3;
  }

  startScare(reason) {
    if (this.phase === 'scare') return;
    this.phase = 'scare';
    this.reason = reason;
    this.scareTimer = 1.6;
    this.shake = 1;
    this.game.audio.noise({
      duration: 0.8,
      volume: 0.36,
      type: 'lowpass',
      filterFreq: 800,
      filterEnd: 90,
    });
    this.game.audio.tone({ freq: 55, endFreq: 22, type: 'sawtooth', duration: 1.3, volume: 0.42 });
  }

  respawn() {
    this.player.x = this.checkpoint.x;
    this.player.y = LOGICAL_HEIGHT * 0.4;
    this.player.vx = 0;
    this.player.vy = 0;
    this.heldAnchor = null;
    this.phase = 'play';
    this.startSection(this.sectionIndex);
    this.checkpointNote = 2.4;
    this.respawns += 1;
    this.game.audio.tone({ freq: 300, endFreq: 620, type: 'triangle', duration: 0.3, volume: 0.2 });
  }

  updateGulp(dt) {
    const gulp = this.gulp;
    gulp.timer -= dt;
    if (gulp.state === 'idle') {
      if (gulp.timer <= 0) {
        gulp.state = 'warn';
        gulp.timer = MOUTH.gulpWarn;
        gulp.warned = false;
      }
      return;
    }
    if (gulp.state === 'warn') {
      if (!gulp.warned && gulp.timer < MOUTH.gulpWarn - 0.2) {
        gulp.warned = true;
        this.game.audio.tone({ freq: 70, endFreq: 40, type: 'sawtooth', duration: 0.5, volume: 0.22 });
      }
      if (gulp.timer <= 0) {
        gulp.state = 'inhale';
        gulp.timer = this.gulpTime;
        this.game.audio.noise({
          duration: 1.4,
          volume: 0.24,
          type: 'lowpass',
          filterFreq: 600,
          filterEnd: 120,
        });
      }
      return;
    }
    if (gulp.state === 'inhale') {
      if (gulp.timer <= 0) {
        gulp.state = 'bite';
        gulp.timer = MOUTH.biteTime;
        this.shake = 1;
        this.biteFlash = 0.5;
        this.game.audio.noise({ duration: 0.5, volume: 0.34, type: 'lowpass', filterFreq: 500, filterEnd: 90 });
        this.game.audio.tone({ freq: 80, endFreq: 30, type: 'square', duration: 0.5, volume: 0.32 });
        if (this.player.y >= this.safeY - this.player.radius) {
          this.startScare('THE MAW TOOK YOU');
        }
        return;
      }
      if (this.player.y >= this.safeY - this.player.radius) {
        this.startScare('DRAGGED INTO THE MAW');
      }
      return;
    }
    if (gulp.state === 'bite' && gulp.timer <= 0) {
      gulp.state = 'idle';
      gulp.timer = MOUTH.idleTime;
    }
  }

  updateAmbience(dt) {
    const close = clamp((this.player.y - this.safeY + MOUTH.mouthDepth) / MOUTH.mouthDepth, 0, 1);
    const gulp = this.gulp;
    const threat = gulp.state === 'inhale' || gulp.state === 'warn' ? 1 : 0.4;
    this.danger = clamp(Math.max(close, threat), 0, 1);
    this.heartbeatTimer -= dt * (1 + close * 1.6 + (gulp.state === 'inhale' ? 1.4 : 0));
    if (this.heartbeatTimer <= 0) {
      this.heartbeatTimer = 1.05;
      const volume = 0.05 + close * 0.12;
      this.game.audio.tone({ freq: 66, endFreq: 38, type: 'sine', duration: 0.16, volume });
      this.game.audio.tone({
        freq: 56,
        endFreq: 30,
        type: 'sine',
        duration: 0.2,
        volume: volume * 0.78,
        delay: 0.17,
      });
    }
  }

  updateRound(dt, input) {
    const player = this.player;
    const space = input.down.has('Space');
    player.pointerSteering = firstPersonMode();
    this.updateGulp(dt);
    if (this.phase !== 'play') return;

    if (this.heldAnchor) {
      const anchor = this.heldAnchor;
      player.x = anchor.x;
      player.y = anchor.y;
      player.vx = 0;
      player.vy = 0;
      if (!space || Math.abs(player.x - anchor.x) > MOUTH.grabRange) this.heldAnchor = null;
    } else if (space) {
      let best = null;
      let bestDist = MOUTH.grabRange;
      for (const anchor of this.anchors) {
        const d = Math.hypot(player.x - anchor.x, player.y - anchor.y);
        if (d < bestDist) {
          bestDist = d;
          best = anchor;
        }
      }
      if (best) {
        this.heldAnchor = best;
        this.game.audio.tone({ freq: 320, endFreq: 420, type: 'triangle', duration: 0.08, volume: 0.16 });
      }
    }

    if (!this.heldAnchor) {
      player.update(dt, input);
      if (this.gulp.state === 'inhale') {
        player.y += this.suctionPower * dt;
        player.vy += this.suctionPower * dt;
      }
    }
    player.x = clamp(player.x, 30, this.worldLength - player.radius);
    player.y = clamp(player.y, player.radius, LOGICAL_HEIGHT - player.radius);
    this.cameraX = clamp(
      player.x - LOGICAL_WIDTH / 2,
      0,
      Math.max(0, this.worldLength - LOGICAL_WIDTH),
    );

    for (const cp of this.checkpoints) {
      if (!cp.reached && player.x >= cp.x) {
        cp.reached = true;
        this.checkpoint = { x: cp.x, y: LOGICAL_HEIGHT * 0.4 };
        this.checkpointNote = 3;
        this.game.audio.tone({ freq: 520, endFreq: 780, type: 'triangle', duration: 0.24, volume: 0.2 });
      }
    }

    this.updateAmbience(dt);

    if (player.y >= this.safeY - player.radius && this.gulp.state === 'bite') {
      this.startScare('THE MAW TOOK YOU');
      return;
    }

    for (const coin of this.coinBubbles) {
      if (coin.taken) continue;
      if (circleOverlap(player, { x: coin.x, y: coin.y, radius: 14 })) {
        coin.taken = true;
        this.coinsCollected += 1;
        this.particles.burst(coin.x, coin.y, {
          count: 12,
          speed: 170,
          life: 0.6,
          colors: [COLORS.accent, '#ffffff'],
          buoyancy: -40,
        });
        this.game.audio.tone({ freq: 760, endFreq: 1240, type: 'triangle', duration: 0.12, volume: 0.2 });
      }
    }
    this.coinBubbles = this.coinBubbles.filter((coin) => !coin.taken);
    if (this.coinsCollected >= this.coinTarget && this.sectionIndex + 1 < this.sectionCount) {
      this.startSection(this.sectionIndex + 1);
      this.game.audio.tone({ freq: 520, endFreq: 900, type: 'triangle', duration: 0.3, volume: 0.22 });
    }
    if (player.x >= this.exitZone.x - 50) this.finish(true);
  }

  renderMaw(ctx, cam) {
    const openAmount =
      this.gulp.state === 'inhale' || this.gulp.state === 'warn'
        ? clamp(1 - this.gulp.timer / (this.gulp.state === 'inhale' ? this.gulpTime : MOUTH.gulpWarn), 0.2, 1)
        : this.gulp.state === 'bite'
          ? 0.05
          : 0.3;
    const floorTop = this.safeY - cam;
    ctx.save();
    const mouth = ctx.createLinearGradient(0, floorTop, 0, LOGICAL_HEIGHT);
    mouth.addColorStop(0, `rgba(6, 2, 4, ${0.6 + 0.3 * openAmount})`);
    mouth.addColorStop(1, '#000000');
    ctx.fillStyle = mouth;
    ctx.fillRect(cam - 40, floorTop, LOGICAL_WIDTH + 80, MOUTH.mouthDepth + 60);
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.moveTo(cam - 40, floorTop);
    ctx.lineTo(cam + LOGICAL_WIDTH + 40, floorTop);
    ctx.lineTo(cam + LOGICAL_WIDTH + 40, floorTop + 16);
    ctx.lineTo(cam - 40, floorTop + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8e3d6';
    const teeth = 24;
    for (let i = 0; i < teeth; i += 1) {
      const x = cam - 40 + ((i + 0.5) / teeth) * (LOGICAL_WIDTH + 80);
      const len = 20 + Math.abs(openAmount) * 22;
      ctx.beginPath();
      ctx.moveTo(x - 13, floorTop + 12);
      ctx.lineTo(x + 13, floorTop + 12);
      ctx.lineTo(x, floorTop + 12 + len);
      ctx.closePath();
      ctx.fill();
    }
    if (openAmount > 0.3) {
      ctx.fillStyle = `rgba(120, 0, 20, ${0.12 * openAmount})`;
      ctx.fillRect(cam - 40, floorTop, LOGICAL_WIDTH + 80, MOUTH.mouthDepth + 60);
    }
    ctx.restore();
  }

  renderRound(ctx) {
    const cam = this.cameraX;
    ctx.save();
    ctx.translate(-cam, 0);
    ctx.fillStyle = 'rgba(20, 30, 26, 0.7)';
    ctx.fillRect(cam - 40, 0, LOGICAL_WIDTH + 80, 22);
    this.renderMaw(ctx, cam);
    for (const anchor of this.anchors) {
      const held = this.heldAnchor === anchor;
      ctx.strokeStyle = held ? COLORS.alienGlow : 'rgba(143, 208, 239, 0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, MOUTH.anchorRadius, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = held ? 'rgba(143, 240, 208, 0.3)' : 'rgba(143, 208, 239, 0.18)';
      ctx.fill();
    }
    for (const coin of this.coinBubbles) {
      if (coin.taken) continue;
      const bob = Math.sin(this.time * 3 + coin.phase) * 4;
      fillCircle(ctx, coin.x, coin.y + bob, 15, 'rgba(255, 209, 102, 0.22)');
      fillCircle(ctx, coin.x, coin.y + bob, 10, COLORS.accent);
      fillCircle(ctx, coin.x - 3, coin.y + bob - 3, 3, '#fff3c4');
    }
    for (let index = 0; index < this.players.length; index += 1) {
      applyWardrobe(this.shop, index);
      const player = this.players[index];
      player.render(ctx);
      drawTrail(ctx, player);
      drawCompanion(ctx, player);
    }
    this.particles.render(ctx);
    ctx.restore();
  }

  renderHud(ctx) {
    drawText(ctx, 'THE TRENCH MOUTH', LOGICAL_WIDTH / 2, 30, {
      size: 18,
      color: COLORS.text,
      glow: COLORS.danger,
      glowBlur: 12,
    });
    drawText(ctx, `SECTION ${this.sectionIndex + 1}/${this.sectionCount}`, 40, 44, {
      size: 13,
      color: COLORS.textDim,
      align: 'left',
    });
    drawText(ctx, `COIN BUBBLES ${this.coinsCollected}/${this.coinTarget}`, 40, 64, {
      size: 12,
      color: COLORS.accent,
      align: 'left',
    });
    const mawState =
      this.gulp.state === 'idle'
        ? 'THE MAW RESTS'
        : this.gulp.state === 'warn'
          ? 'IT INHALES'
          : this.gulp.state === 'inhale'
            ? 'BRACE! THE GULP'
            : 'THE JAWS SNAP';
    drawText(ctx, mawState, LOGICAL_WIDTH - 40, 44, {
      size: 15,
      color: this.gulp.state === 'idle' ? COLORS.alienGlow : COLORS.danger,
      align: 'right',
      glow: this.gulp.state === 'idle' ? undefined : COLORS.danger,
      glowBlur: 10,
    });
    drawText(ctx, this.heldAnchor ? 'BRACED — HOLD' : 'SPACE — GRAB AN ANCHOR', LOGICAL_WIDTH - 40, 66, {
      size: 12,
      color: this.heldAnchor ? COLORS.alienGlow : COLORS.textDim,
      align: 'right',
    });
    if (this.checkpointNote > 0) {
      drawText(ctx, 'CHECKPOINT', LOGICAL_WIDTH / 2, 96, {
        size: 14,
        color: COLORS.alienGlow,
        alpha: Math.min(1, this.checkpointNote),
      });
    }
    if (this.banner > 0) {
      drawText(ctx, `SECTION ${this.sectionIndex + 1}`, LOGICAL_WIDTH / 2, 128, {
        size: 22,
        color: COLORS.text,
        glow: COLORS.bubble,
        glowBlur: 14,
        alpha: Math.min(1, this.banner),
      });
    }
    drawText(ctx, 'MOVE WITH WASD — GRAB A CEILING ANCHOR (SPACE) BEFORE THE GULP LANDS', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.75,
    });
  }

  renderScare(ctx) {
    const t = 1 - this.scareTimer / 1.6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.fillStyle = '#e8e3d6';
    const teeth = 14;
    for (let i = 0; i < teeth; i += 1) {
      const x = (i + 0.5) / teeth * LOGICAL_WIDTH;
      const len = 60 + t * 200;
      ctx.beginPath();
      ctx.moveTo(x - 26, 0);
      ctx.lineTo(x + 26, 0);
      ctx.lineTo(x, len);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 26, LOGICAL_HEIGHT);
      ctx.lineTo(x + 26, LOGICAL_HEIGHT);
      ctx.lineTo(x, LOGICAL_HEIGHT - len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = `rgba(120, 0, 20, ${0.4 * (1 - t)})`;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  firstPersonPalette() {
    return { top: MOUTH_PALETTE.top, bottom: MOUTH_PALETTE.bottom, wall: '#2a3038' };
  }

  firstPersonBounds() {
    return { x: 0, y: 0, w: this.worldLength ?? LOGICAL_WIDTH, h: LOGICAL_HEIGHT };
  }

  firstPersonSprites() {
    const sprites = [...(this.anchors ?? []).map((anchor) => {
      const entity = { x: anchor.x, y: anchor.y, radius: MOUTH.anchorRadius, alive: true };
      entity._draw = (ctx) => {
        ctx.strokeStyle = 'rgba(143, 208, 239, 0.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, MOUTH.anchorRadius, 0, TAU);
        ctx.stroke();
      };
      return entity;
    })];
    for (const coin of this.coinBubbles ?? []) {
      if (coin.taken) continue;
      const entity = { x: coin.x, y: coin.y, radius: 14, alive: true };
      entity._draw = (ctx) => {
        fillCircle(ctx, 0, 0, 14, 'rgba(255, 209, 102, 0.3)');
        fillCircle(ctx, 0, 0, 9, COLORS.accent);
      };
      sprites.push(entity);
    }
    return sprites;
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (this.phase === 'select') {
      if (input.wasPressed('back')) {
        this.game.changeScene('tanks');
        return;
      }
      const selected = this.selectMenu.selected;
      if (selected && selected.action === 'creature') {
        if (input.wasPressed('left')) this.cycleCreature(-1);
        if (input.wasPressed('right')) this.cycleCreature(1);
      }
      this.selectMenu.update(dt, input);
      return;
    }
    if (input.wasPressed('back')) {
      this.game.changeScene(this.backScene());
      return;
    }
    if (this.phase === 'results') {
      this.resultsMenu.update(dt, input);
      return;
    }
    this.elapsed += dt;
    this.banner = Math.max(0, this.banner - dt);
    this.checkpointNote = Math.max(0, this.checkpointNote - dt);
    this.biteFlash = Math.max(0, this.biteFlash - dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
    } else {
      this.updateRound(dt, input);
    }
    this.particles.update(dt);
  }

  render(ctx) {
    setSkinClock(this.time);
    if (this.phase === 'select') {
      this.renderSelect(ctx);
      return;
    }
    if (firstPersonMode()) {
      this.renderFirstPerson(ctx);
      return;
    }
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, MOUTH_PALETTE);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 8 * this.shake * motionScale(), rand(-1, 1) * 8 * this.shake * motionScale());
    }
    this.renderRound(ctx);
    const px = this.player.x - this.cameraX;
    renderDarkness(ctx, px, this.player.y, MOUTH.visionRadius, {
      width: LOGICAL_WIDTH,
      height: LOGICAL_HEIGHT,
      ambientDark: MOUTH.ambientDark,
      soft: MOUTH.visionSoft,
    });
    ctx.restore();
    this.renderHud(ctx);
    if (this.biteFlash > 0) {
      ctx.fillStyle = `rgba(120, 0, 20, ${this.biteFlash * 0.5 * motionScale()})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35 * motionScale()})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.phase === 'scare') this.renderScare(ctx);
    else if (this.phase === 'results') this.renderResults(ctx);
  }

  renderSelect(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, MOUTH_PALETTE);
    drawText(ctx, 'THE TRENCH MOUTH', LOGICAL_WIDTH / 2, 90, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.danger,
      glowBlur: 22,
    });
    drawText(ctx, 'THE FLOOR IS A MOUTH — ANCHOR BEFORE IT INHALES — CHOOSE YOUR DIVER', LOGICAL_WIDTH / 2, 132, {
      size: 14,
      color: COLORS.foam,
      alpha: 0.85,
    });
    this.selectMenu.render(ctx, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.56);
    drawText(ctx, 'LEFT/RIGHT — CHANGE DIVER      ENTER — START      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 26, {
      size: 12,
      color: COLORS.textDim,
    });
  }

  renderFirstPerson(ctx) {
    if (this.phase === 'scare') {
      this.renderScare(ctx);
      return;
    }
    renderFirstPersonLevel(ctx, this);
    const fog = ctx.createRadialGradient(
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT * 0.5,
      LOGICAL_HEIGHT * 0.15,
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT * 0.5,
      LOGICAL_HEIGHT * 0.7,
    );
    fog.addColorStop(0, 'rgba(0, 0, 0, 0)');
    fog.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.renderHud(ctx);
    if (this.biteFlash > 0) {
      ctx.fillStyle = `rgba(120, 0, 20, ${this.biteFlash * 0.5 * motionScale()})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.phase === 'results') this.renderResults(ctx);
  }

  resultsTitle() {
    return 'THE TRENCH MOUTH';
  }

  resultsHeadline() {
    return this.won ? 'YOU CLEARED THE MAW' : 'SWALLOWED';
  }

  resultsDetail() {
    return this.won ? 'THE MAW CLOSED BEHIND YOU' : this.reason ?? 'THE FLOOR TOOK YOU';
  }
}
