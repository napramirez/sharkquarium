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
import { renderDarkness, renderConeLight } from '../engine/horror.js';
import { motionScale } from '../engine/motion.js';
import { applyWardrobe } from '../engine/wardrobe.js';
import { drawTrail } from '../engine/trail.js';
import { drawCompanion } from '../engine/companion.js';
import { Watcher } from '../entities/watcher.js';
import { Shark } from '../entities/shark.js';
import { Stingray } from '../entities/stingray.js';
import { Squid } from '../entities/squid.js';
import { ArcticShrimp } from '../entities/arcticshrimp.js';
import { KelpCrab } from '../entities/kelpcrab.js';
import { MoonJelly } from '../entities/moonjelly.js';
import { Nautilus } from '../entities/nautilus.js';
import { QUIET_TRACK } from '../assets/tracks.js';
import {
  WATCHER,
  WATCHER_PALETTE,
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

export class WatcherScene extends MinigameScene {
  enter(params = {}) {
    this.time = 0;
    this.solo = true;
    this.difficultyKey = loadJSON(SETTINGS_KEY, {}).difficulty ?? 'normal';
    this.rules = DIFFICULTY[this.difficultyKey] ?? DIFFICULTY.normal;
    this.enemyMult = this.mutator ? this.mutator.knobs.enemySpeedScale ?? 1 : 1;
    this.shop = loadJSON(SHOP_KEY, {});
    if (this.game.music) {
      this.previousTrack = this.game.music.source ?? this.game.music.track;
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
    this.game.audio.tone({ freq: 150, endFreq: 80, type: 'triangle', duration: 0.4, volume: 0.24 });
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
      freq: won ? 523 : 120,
      endFreq: won ? 784 : 60,
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
    this.sectionCount = WATCHER.sectors;
    this.worldLength =
      WATCHER.startPadding + this.sectionCount * WATCHER.sectionLength + WATCHER.exitLength;
    this.players = [
      new Creature(WATCHER.startPadding - 300, LOGICAL_HEIGHT / 2, {
        controls: CONTROLS.solo,
        pointer: false,
        ...(this.creature.options ?? {}),
      }),
    ];
    this.player = this.players[0];
    this.players.forEach((player) => {
      player.maxX = this.worldLength;
    });
    this.exitZone = { x: this.worldLength - WATCHER.exitLength * 0.5, y: LOGICAL_HEIGHT / 2 };
    this.checkpoints = [];
    for (let s = 1; s < this.sectionCount; s += 1) {
      this.checkpoints.push({
        x: WATCHER.startPadding + s * WATCHER.sectionLength,
        y: LOGICAL_HEIGHT / 2,
        reached: false,
        radius: 46,
      });
    }
    this.checkpoint = { x: this.players[0].x, y: this.players[0].y };
    this.respawns = 0;
    this.checkpointNote = 0;
    this.gazeAngle = 0;
    this.stare = WATCHER.stareMax;
    this.blinking = false;
    this.blinkTimer = 0;
    this.cameraX = 0;
    this.danger = 0;
    this.heartbeatTimer = 1;
    this.banner = 3;
    this.coinsCollected = 0;
    this.phase = 'play';
    this.startSector(0);
  }

  startSector(index) {
    this.sectorIndex = index;
    const start = WATCHER.startPadding + index * WATCHER.sectionLength;
    const count = WATCHER.coins[Math.min(index, WATCHER.coins.length - 1)];
    this.coinTarget = count;
    this.coinsCollected = 0;
    this.coinBubbles = [];
    for (let i = 0; i < count; i += 1) {
      this.coinBubbles.push({
        x: start + 240 + ((i * (WATCHER.sectionLength - 420)) / Math.max(1, count - 1)),
        y: rand(80, LOGICAL_HEIGHT - 80),
        taken: false,
        phase: rand(0, TAU),
      });
    }
    const wcount = WATCHER.watchers[Math.min(index, WATCHER.watchers.length - 1)];
    this.watchers = [];
    for (let i = 0; i < wcount; i += 1) {
      const ahead = i % 2 === 0;
      const range = ahead ? WATCHER.spawnAhead : WATCHER.spawnBehind;
      const watcher = new Watcher(
        this.player.x + rand(range[0], range[1]) * (ahead ? 1 : -1),
        rand(80, LOGICAL_HEIGHT - 80),
      );
      watcher.speed = WATCHER.stalk[Math.min(index, WATCHER.stalk.length - 1)] * this.enemyMult;
      this.watchers.push(watcher);
    }
    this.banner = 3;
    this.note = 3;
  }

  currentGazeAngle() {
    if (firstPersonMode()) return this.firstPersonYaw ?? 0;
    const pointer = this.game.input.pointer;
    const px = pointer.x + this.cameraX;
    const py = pointer.y;
    return Math.atan2(py - this.player.y, px - this.player.x);
  }

  gazeActive() {
    return !this.blinking;
  }

  observed(watcher) {
    if (!this.gazeActive()) return false;
    const dx = watcher.x - this.player.x;
    const dy = watcher.y - this.player.y;
    if (Math.hypot(dx, dy) > WATCHER.gazeRange) return false;
    let delta = Math.atan2(dy, dx) - this.gazeAngle;
    while (delta > Math.PI) delta -= TAU;
    while (delta < -Math.PI) delta += TAU;
    return Math.abs(delta) <= WATCHER.gazeHalf;
  }

  startScare() {
    if (this.phase === 'scare') return;
    this.phase = 'scare';
    this.scareTimer = 1.6;
    this.shake = 1;
    this.game.audio.noise({
      duration: 0.7,
      volume: 0.34,
      type: 'lowpass',
      filterFreq: 1200,
      filterEnd: 140,
    });
    this.game.audio.tone({ freq: 60, endFreq: 24, type: 'sawtooth', duration: 1.2, volume: 0.4 });
  }

  respawn() {
    this.player.x = this.checkpoint.x;
    this.player.y = this.checkpoint.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.stare = WATCHER.stareMax;
    this.blinking = false;
    this.shake = 0;
    this.phase = 'play';
    this.startSector(this.sectorIndex);
    this.checkpointNote = 2.4;
    this.respawns += 1;
    this.game.audio.tone({ freq: 300, endFreq: 620, type: 'triangle', duration: 0.3, volume: 0.2 });
  }

  updateGaze(dt) {
    this.gazeAngle = this.currentGazeAngle();
    if (this.blinking) {
      this.blinkTimer -= dt;
      this.stare = Math.min(WATCHER.stareMax, this.stare + WATCHER.refill * dt);
      if (this.blinkTimer <= 0 && this.stare >= WATCHER.stareMax * 0.6) this.blinking = false;
    } else {
      this.stare -= dt;
      if (this.stare <= 0) {
        this.stare = 0;
        this.blinking = true;
        this.blinkTimer = WATCHER.blinkTime;
        this.game.audio.tone({ freq: 200, endFreq: 120, type: 'sine', duration: 0.2, volume: 0.12 });
      }
    }
  }

  updateAmbience(dt) {
    const distance = Math.hypot(this.player.x - this.exitZone.x, this.player.y - this.exitZone.y);
    const closeness = clamp(1 - distance / (WATCHER.heartbeatRange * 2), 0, 1);
    let nearest = 1;
    for (const watcher of this.watchers) {
      const d = Math.hypot(watcher.x - this.player.x, watcher.y - this.player.y);
      nearest = Math.min(nearest, d / WATCHER.gazeRange);
    }
    this.danger = clamp(Math.max(closeness, 1 - nearest), 0, 1);
    this.heartbeatTimer -= dt * (1 + (1 - nearest) * 1.9);
    if (this.heartbeatTimer <= 0) {
      this.heartbeatTimer = 1.05;
      const volume = 0.05 + (1 - nearest) * 0.12;
      const pan = this.game.audio.panFor(
        this.watchers[0]?.x ?? this.player.x,
        this.player.x,
        LOGICAL_WIDTH,
      );
      this.game.audio.tone({ freq: 72, endFreq: 42, type: 'sine', duration: 0.16, volume, pan });
      this.game.audio.tone({
        freq: 62,
        endFreq: 34,
        type: 'sine',
        duration: 0.2,
        volume: volume * 0.78,
        delay: 0.17,
        pan,
      });
    }
  }

  updateRound(dt, input) {
    const player = this.player;
    player.pointerSteering = firstPersonMode();
    player.update(dt, input);
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
        this.checkpoint = { x: cp.x, y: cp.y };
        this.checkpointNote = 3;
        this.game.audio.tone({ freq: 520, endFreq: 780, type: 'triangle', duration: 0.24, volume: 0.2 });
      }
    }

    this.updateGaze(dt);
    this.updateAmbience(dt);

    for (const watcher of this.watchers) {
      watcher.update(dt);
      const dx = player.x - watcher.x;
      const dy = player.y - watcher.y;
      const distance = Math.hypot(dx, dy) || 1;
      watcher.lookAngle = Math.atan2(dy, dx);
      if (distance < WATCHER.gazeRange * 0.6) watcher.catchGlow = 1;
      watcher.frozen = this.observed(watcher);
      if (!watcher.frozen) {
        watcher.x += (dx / distance) * watcher.speed * dt;
        watcher.y += (dy / distance) * watcher.speed * dt;
        if (distance < WATCHER.catchRange) {
          this.startScare();
          return;
        }
      }
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
    if (this.coinsCollected >= this.coinTarget && this.sectorIndex + 1 < this.sectionCount) {
      this.startSector(this.sectorIndex + 1);
      this.game.audio.tone({ freq: 520, endFreq: 900, type: 'triangle', duration: 0.3, volume: 0.22 });
    }
    if (player.x >= this.exitZone.x - WATCHER.radiusCheck) this.finish(true);
  }

  renderRound(ctx) {
    const cam = this.cameraX;
    ctx.save();
    ctx.translate(-cam, 0);
    ctx.fillStyle = 'rgba(6, 12, 20, 0.7)';
    ctx.fillRect(cam - 40, LOGICAL_HEIGHT - 30, LOGICAL_WIDTH + 80, 30);
    ctx.fillRect(cam - 40, 0, LOGICAL_WIDTH + 80, 20);
    const exitAlpha = 0.16 + 0.08 * Math.sin(this.time * 3);
    ctx.fillStyle = `rgba(143, 240, 208, ${exitAlpha})`;
    ctx.fillRect(this.exitZone.x - 40, -20, 80, LOGICAL_HEIGHT + 40);
    drawText(ctx, 'EXIT', this.exitZone.x, 70, { size: 15, color: COLORS.alienGlow, alpha: 0.8 });
    for (const coin of this.coinBubbles) {
      const bob = Math.sin(this.time * 3 + coin.phase) * 4;
      fillCircle(ctx, coin.x, coin.y + bob, 15, 'rgba(255, 209, 102, 0.22)');
      fillCircle(ctx, coin.x, coin.y + bob, 10, COLORS.accent);
      fillCircle(ctx, coin.x - 3, coin.y + bob - 3, 3, '#fff3c4');
    }
    for (const watcher of this.watchers) watcher.render(ctx);
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

  renderGaze(ctx) {
    const player = this.player;
    const px = player.x - this.cameraX;
    const py = player.y;
    const active = this.gazeActive();
    const range = active ? WATCHER.gazeRange : 0;
    if (range <= 1) {
      ctx.fillStyle = `rgba(0, 0, 0, ${WATCHER.ambientDark})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.moveTo(px, py);
    ctx.arc(px, py, range, this.gazeAngle - WATCHER.gazeHalf, this.gazeAngle + WATCHER.gazeHalf);
    ctx.closePath();
    ctx.clip('evenodd');
    const shade = ctx.createRadialGradient(px, py, 20, px, py, LOGICAL_HEIGHT);
    shade.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    shade.addColorStop(1, `rgba(0, 0, 0, ${WATCHER.ambientDark})`);
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.restore();
    renderConeLight(ctx, px, py, this.gazeAngle, WATCHER.gazeHalf, range, {
      width: LOGICAL_WIDTH,
      height: LOGICAL_HEIGHT,
    });
  }

  renderHud(ctx) {
    drawText(ctx, 'THE WATCHER', LOGICAL_WIDTH / 2, 30, {
      size: 18,
      color: COLORS.text,
      glow: COLORS.alienGlow,
      glowBlur: 12,
    });
    drawText(ctx, `WATCHERS ${this.watchers.length}`, 40, 44, {
      size: 13,
      color: COLORS.danger,
      align: 'left',
    });
    drawText(ctx, `COIN BUBBLES ${this.coinsCollected}/${this.coinTarget}`, 40, 64, {
      size: 12,
      color: COLORS.accent,
      align: 'left',
    });
    const barX = 300;
    const barW = 360;
    drawText(ctx, 'STARE', barX - 12, 44, { size: 12, color: COLORS.textDim, align: 'right' });
    fillRoundRect(ctx, barX, 36, barW, 10, 5, 'rgba(4, 16, 29, 0.7)');
    fillRoundRect(
      ctx,
      barX,
      36,
      barW * (this.stare / WATCHER.stareMax),
      10,
      5,
      this.blinking ? COLORS.danger : COLORS.alienGlow,
    );
    strokeRoundRect(ctx, barX, 36, barW, 10, 5, 'rgba(207, 239, 255, 0.3)', 2);
    if (this.blinking) {
      drawText(ctx, 'BLINKING — IT MOVES', LOGICAL_WIDTH / 2, 70, {
        size: 15,
        color: COLORS.danger,
        glow: COLORS.danger,
        glowBlur: 10,
        alpha: 0.7 + 0.3 * Math.sin(this.time * 20),
      });
    }
    if (this.checkpointNote > 0) {
      drawText(ctx, 'CHECKPOINT', LOGICAL_WIDTH / 2, 96, {
        size: 14,
        color: COLORS.alienGlow,
        alpha: Math.min(1, this.checkpointNote),
      });
    }
    if (this.banner > 0) {
      drawText(ctx, `SECTOR ${this.sectorIndex + 1}`, LOGICAL_WIDTH / 2, 130, {
        size: 22,
        color: COLORS.text,
        glow: COLORS.bubble,
        glowBlur: 14,
        alpha: Math.min(1, this.banner),
      });
    }
    drawText(ctx, 'MOVE WITH WASD — AIM THE BEAM WITH THE MOUSE — IT FREEZES IN THE LIGHT', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.75,
    });
  }

  renderScare(ctx) {
    const t = 1 - this.scareTimer / 1.6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.96)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    const scale = 0.7 + t * 2.6;
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 20);
    ctx.scale(scale, scale);
    const glow = ctx.createRadialGradient(0, 0, 30, 0, 0, 220);
    glow.addColorStop(0, 'rgba(180, 210, 110, 0.4)');
    glow.addColorStop(1, 'rgba(180, 210, 110, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 220, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#eef4ea';
    ctx.beginPath();
    ctx.ellipse(0, 0, 100, 62, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, 100, 62, 0, 0, TAU);
    ctx.clip();
    ctx.strokeStyle = 'rgba(150, 20, 30, 0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i += 1) {
      const a = i * 0.63;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 100, Math.sin(a) * 62);
      ctx.quadraticCurveTo(Math.cos(a + 0.4) * 40, Math.sin(a + 0.4) * 25, 0, 0);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(122, 150, 58, 0.97)';
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#04050a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 42, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-16, -20, 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ddd6c4';
    for (let i = 0; i < 11; i += 1) {
      const x = -88 + (i / 10) * 176;
      ctx.beginPath();
      ctx.moveTo(x - 8, 78);
      ctx.lineTo(x + 8, 78);
      ctx.lineTo(x + 3, 78 + 26 + t * 24);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = `rgba(150, 0, 10, ${0.4 * (1 - t)})`;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  firstPersonPalette() {
    return { top: WATCHER_PALETTE.top, bottom: WATCHER_PALETTE.bottom, wall: '#2a3038' };
  }

  firstPersonBounds() {
    return { x: 0, y: 0, w: this.worldLength ?? LOGICAL_WIDTH, h: LOGICAL_HEIGHT };
  }

  firstPersonSprites() {
    return [...(this.watchers ?? []), ...(this.coinBubbles ?? []).map((coin) => {
      const entity = { x: coin.x, y: coin.y, radius: 14, alive: !coin.taken };
      entity._draw = (ctx) => {
        fillCircle(ctx, 0, 0, 14, 'rgba(255, 209, 102, 0.3)');
        fillCircle(ctx, 0, 0, 9, COLORS.accent);
      };
      return entity;
    })];
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
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATCHER_PALETTE);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 8 * this.shake * motionScale(), rand(-1, 1) * 8 * this.shake * motionScale());
    }
    this.renderRound(ctx);
    this.renderGaze(ctx);
    ctx.restore();
    this.renderHud(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35 * motionScale()})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.phase === 'scare') this.renderScare(ctx);
    else if (this.phase === 'results') this.renderResults(ctx);
  }

  renderSelect(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATCHER_PALETTE);
    drawText(ctx, 'THE WATCHER', LOGICAL_WIDTH / 2, 90, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.alienGlow,
      glowBlur: 22,
    });
    drawText(ctx, 'IT ONLY MOVES WHEN YOU LOOK AWAY — CHOOSE YOUR DIVER', LOGICAL_WIDTH / 2, 132, {
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
      LOGICAL_HEIGHT * 0.14,
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT * 0.5,
      LOGICAL_HEIGHT * 0.7,
    );
    fog.addColorStop(0, 'rgba(0, 0, 0, 0)');
    fog.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.renderHud(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35 * motionScale()})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.phase === 'results') this.renderResults(ctx);
  }

  resultsTitle() {
    return 'THE WATCHER';
  }

  resultsHeadline() {
    return this.won ? 'YOU SLIPPED OUT' : 'IT GOT YOU';
  }

  resultsDetail() {
    return this.won
      ? 'THE LIGHT HELD'
      : 'YOU LOOKED AWAY';
  }
}
