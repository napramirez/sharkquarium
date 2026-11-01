import { MinigameScene } from '../engine/minigame.js';
import { recordWin } from '../engine/records.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { circleOverlap, resolveCircleRect } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { ParticleSystem } from '../engine/particles.js';
import { loadJSON } from '../engine/storage.js';
import { renderFirstPersonLevel } from '../engine/raycastview.js';
import { firstPersonMode } from '../engine/mode3d.js';
import { motionScale } from '../engine/motion.js';
import { Echoeel } from '../entities/echoeel.js';
import { Clutter } from '../entities/clutter.js';
import { Shark } from '../entities/shark.js';
import { Stingray } from '../entities/stingray.js';
import { Squid } from '../entities/squid.js';
import { ArcticShrimp } from '../entities/arcticshrimp.js';
import { KelpCrab } from '../entities/kelpcrab.js';
import { MoonJelly } from '../entities/moonjelly.js';
import { Nautilus } from '../entities/nautilus.js';
import { applyWardrobe } from '../engine/wardrobe.js';
import { drawSkinAura, setSkinClock } from '../engine/skin.js';
import { drawTrail } from '../engine/trail.js';
import { drawCompanion } from '../engine/companion.js';
import { QUIET_TRACK } from '../assets/tracks.js';
import {
  QUIET,
  QUIET_PALETTE,
  COLORS,
  CONTROLS,
  DIFFICULTY,
  SETTINGS_KEY,
  SHOP_KEY,
  PLAYER,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const QUIET_REMAINS = [
  'THE RIFT OPENED AT 0400. SOMETHING CAME THROUGH.',
  'IT HAS NO EYES. IT HUNTS BY SOUND.',
  'DON’T KNOCK THE EQUIPMENT. IT HEARS YOU.',
  'WE HID IN THE DARK ALCOVES. IT WALKED RIGHT PAST.',
  'WE CUT THE LIGHTS. IT FOUND US ANYWAY.',
  'TELL THE SURFACE — THE STATION IS LOST.',
];

const DIVE_CREATURES = [
  { key: 'shark', label: 'SHARK', type: Shark },
  { key: 'stingray', label: 'STINGRAY', type: Stingray, options: { burrow: false } },
  { key: 'squid', label: 'SQUID', type: Squid },
  { key: 'arcticshrimp', label: 'SHRIMP', type: ArcticShrimp },
  { key: 'kelpcrab', label: 'CRAB', type: KelpCrab },
  { key: 'jellyfish', label: 'JELLY', type: MoonJelly },
  { key: 'nautilus', label: 'NAUTILUS', type: Nautilus, options: { vertical: true } },
];

function segmentHitsRect(x1, y1, x2, y2, rect) {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rect.x, rect.x + rect.w - x1, y1 - rect.y, rect.y + rect.h - y1];
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return true;
}

export class QuietScene extends MinigameScene {
  enter(params = {}) {
    this.flood = this.name === 'flood';
    this.title = this.flood ? 'THE ESCAPE' : 'MYSTERIOUSLY QUIET';
    this.outroOnly = this.flood && Boolean(params.outro);
    this.theatre = this.outroOnly;
    this.time = 0;
    this.solo = true;
    this.difficultyKey = loadJSON(SETTINGS_KEY, {}).difficulty ?? 'normal';
    this.rules = DIFFICULTY[this.difficultyKey] ?? DIFFICULTY.normal;
    this.enemyMult = this.mutator ? this.mutator.knobs.enemySpeedScale ?? 1 : 1;
    this.shop = loadJSON(SHOP_KEY, {});
    this.floodCoop = Boolean(params.coop);
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
    this.time = 0;
    this.game.audio.tone({ freq: 160, endFreq: 90, type: 'triangle', duration: 0.4, volume: 0.24 });
    if (this.outroOnly) {
      this.resetRound();
      this.startOutro();
    }
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('tanks');
  }

  backScene() {
    return 'tanks';
  }

  exit() {
    if (!this.game.music || !this.previousTrack) return;
    this.game.music.play(this.previousTrack);
    this.game.music.hold = this.previousHold;
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
    if (action === 'start') this.startArrival();
  }

  rushStart() {
    this.startArrival();
  }

  finish(won) {
    if (this.theatre) {
      this.game.changeScene('theatre');
      return;
    }
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

  firstPersonPalette() {
    return { top: QUIET_PALETTE.top, bottom: QUIET_PALETTE.bottom, wall: '#2a3038' };
  }

  firstPersonBounds() {
    return { x: 0, y: 0, w: this.worldLength ?? LOGICAL_WIDTH, h: LOGICAL_HEIGHT };
  }

  firstPersonSprites() {
    return [
      ...(this.players ?? []),
      this.alien,
      ...(this.clutter ?? []),
      ...(this.ghosts ?? []),
      ...(this.remains ?? []),
      ...(this.vents ?? []),
      ...(this.phantoms ?? []),
      ...(this.debris ?? []),
    ].filter(Boolean);
  }

  startArrival() {
    this.resetRound();
    if (this.flood) {
      this.cameraX = 0;
      this.acknowledgeFlood();
      return;
    }
    this.phase = 'arrival';
    this.arrivalTimer = 0;
    this.arrivalEvents = new Set();
    this.cameraX = 0;
    this.rift = {
      x: LOGICAL_WIDTH * 0.58,
      y: LOGICAL_HEIGHT * 0.44,
      size: 96,
      open: 0,
    };
    this.arrivalEchoeel = new Echoeel();
    this.arrivalEchoeel.x = this.rift.x;
    this.arrivalEchoeel.y = this.rift.y;
    this.arrivalEchoeel.facing = -1;
    this.arrivalEchoeel.reveal = 0;
    this.arrivalCrew = DIVE_CREATURES.map((creature, index) => ({
      label: creature.label,
      entity: new creature.type(-160, 0, {
        controls: CONTROLS.solo,
        pointer: false,
        ...(creature.options ?? {}),
      }),
      startX: -160 - index * 70,
      target: 90 + index * 96,
      lane: 96 + index * 52,
      travel: 0,
      speed: rand(200, 300),
      phase: rand(0, TAU),
    }));
    this.particles = new ParticleSystem();
    this.game.audio.tone({ freq: 300, endFreq: 60, type: 'sawtooth', duration: 0.9, volume: 0.3 });
  }

  updateArrival(dt, input) {
    this.arrivalTimer += dt;
    const t = this.arrivalTimer;
    this.shake = Math.max(0, this.shake - dt * 1.4);
    const rift = this.rift;
    if (rift.open < 1) {
      rift.open = clamp(rift.open + dt * 0.85, 0, 1);
      this.particles.burst(
        rift.x + rand(-60, 60),
        rift.y + rand(-50, 50),
        {
          count: 2,
          speed: 90,
          life: 0.7,
          colors: [COLORS.alienGlow, '#b48cff', '#ffffff'],
          buoyancy: -20,
        },
      );
      if (rift.open >= 0.99 && !this.arrivalEvents.has('rift')) {
        this.arrivalEvents.add('rift');
        this.shake = 1;
        this.flash = 0.7;
        this.particles.burst(rift.x, rift.y, {
          count: 36,
          speed: 320,
          life: 1.1,
          colors: [COLORS.alienGlow, '#b48cff', COLORS.bubble],
          buoyancy: -20,
        });
        this.game.audio.tone({ freq: 70, endFreq: 34, type: 'sawtooth', duration: 1.1, volume: 0.36 });
      }
    } else if (t > 1.8) {
      this.arrivalEchoeel.reveal = clamp(this.arrivalEchoeel.reveal + dt * 0.8, 0, 1);
      const reveal = this.arrivalEchoeel.reveal;
      this.arrivalEchoeel.x = rift.x - reveal * 150;
      this.arrivalEchoeel.y = rift.y + reveal * 70;
      if (Math.random() < reveal * 0.5) {
        this.particles.burst(rift.x + rand(-40, 40), rift.y + rand(-30, 30), {
          count: 2,
          speed: 110,
          life: 0.7,
          colors: [COLORS.alienGlow, '#b48cff'],
          buoyancy: -20,
        });
      }
      if (reveal > 0.4 && !this.arrivalEvents.has('wake')) {
        this.arrivalEvents.add('wake');
        this.game.audio.tone({ freq: 55, endFreq: 28, type: 'sawtooth', duration: 1.2, volume: 0.34 });
      }
    }
    if (t > 3.6) {
      for (const member of this.arrivalCrew) {
        member.travel = Math.min(
          member.travel + member.speed * dt,
          Math.max(0, member.target - member.startX),
        );
        member.entity.update(dt, { isDown: () => false, pointer: { down: false, dragX: 0, dragY: 0 } });
        member.entity.x = member.startX + member.travel;
        member.entity.y = member.lane + Math.sin(this.time * 2 + member.phase) * 9;
        member.entity.maxX = LOGICAL_WIDTH;
      }
    }
    this.particles.update(dt);
    if (input.wasPressed('confirm') || input.wasPressed('back') || t >= QUIET.arrivalDuration) {
      this.phase = 'play';
      this.cameraX = 0;
    }
  }

  acknowledgeFlood() {
    this.shake = 1;
    this.flash = 0.6;
    this.game.audio.noise({
      duration: 1.4,
      volume: 0.3,
      type: 'lowpass',
      filterFreq: 500,
      filterEnd: 80,
    });
    this.game.audio.tone({ freq: 48, endFreq: 26, type: 'sawtooth', duration: 1.6, volume: 0.34 });
  }

  buildFloodRound() {
    const Creature = this.creature.type;
    this.sectionCount = 0;
    this.runLength = QUIET.escapeLength + QUIET.exitLength;
    this.worldLength = this.runLength;
    this.players = [
      new Creature(120, LOGICAL_HEIGHT / 2, {
        controls: CONTROLS.solo,
        pointer: true,
        ...(this.creature.options ?? {}),
      }),
    ];
    this.player = this.players[0];
    this.players.forEach((player) => {
      player.maxX = this.worldLength;
    });
    this.walls = [];
    this.clutter = [];
    this.hides = [];
    this.ghosts = [];
    this.remains = [];
    this.vents = [];
    this.slamDoors = [];
    this.debris = [];
    for (let i = 0; i < QUIET.debrisCount; i += 1) {
      const x = 420 + (i * (this.worldLength - 1000)) / Math.max(1, QUIET.debrisCount - 1);
      const deb = { x, y: rand(110, LOGICAL_HEIGHT - 110), state: 'idle', timer: 0, radius: 24 };
      deb._draw = (ctx) => this.renderDebris(ctx, deb);
      this.debris.push(deb);
    }
    this.exitZone = { x: this.worldLength - QUIET.exitLength * 0.5, y: LOGICAL_HEIGHT / 2 };
    this.trueExit = this.exitZone;
    this.phase2 = true;
    this.part2Timer = 0;
    this.checkpoints = [
      { x: this.worldLength * 0.35, y: LOGICAL_HEIGHT / 2, reached: false, radius: 46 },
      { x: this.worldLength * 0.7, y: LOGICAL_HEIGHT / 2, reached: false, radius: 46 },
    ];
    this.checkpoint = { x: this.players[0].x, y: this.players[0].y };
    this.respawns = 0;
    this.checkpointNote = 0;
    this.alien = new Echoeel();
    this.alien.worldWidth = this.worldLength;
    this.alien.x = -600;
    this.alien.y = LOGICAL_HEIGHT / 2;
    this.alien.relentless = true;
    this.alien.chargeSpeed = QUIET.part2Speed * this.enemyMult;
    this.alien.state = 'charge';
    this.alien.stateTimer = 3;
    this.alien.targetX = this.players[0].x;
    this.alien.targetY = this.players[0].y;
    this.cameraX = 0;
    this.noise = 0;
    this.noiseHold = 0;
    this.hidden = false;
    this.concealed = false;
    this.noiseTarget = null;
    this.echoTimer = rand(2, QUIET.echoEvery);
    this.echoActive = false;
    this.echoAge = 0;
    this.ambientTimer = rand(1.5, 4);
    this.heartbeatTimer = 1;
    this.scareKind = 'snap';
    this.danger = 0;
    this.finale = true;
    this.finalLunge = false;
    this.remainNote = null;
    this.hallucinationTimer = rand(QUIET.hallucinationMin, QUIET.hallucinationMax);
    this.phantoms = [];
    this.phase = 'play';
  }

  buildRound() {
    if (this.flood) {
      this.buildFloodRound();
      return;
    }
    const Creature = this.creature.type;
    this.players = [
      new Creature(QUIET.spawnX, LOGICAL_HEIGHT / 2, {
        controls: CONTROLS.solo,
        pointer: true,
        ...(this.creature.options ?? {}),
      }),
    ];
    this.player = this.players[0];
    this.player.invulnerable = 0;
    this.sectionCount = QUIET.sections;
    this.runLength =
      QUIET.startPadding + this.sectionCount * QUIET.sectionLength + QUIET.exitLength;
    this.worldLength = this.runLength;
    this.players.forEach((player) => {
      player.maxX = this.worldLength;
    });
    this.walls = [];
    this.clutter = [];
    this.hides = [];
    this.ghosts = [];
    for (let s = 0; s < this.sectionCount; s += 1) {
      const start = QUIET.startPadding + s * QUIET.sectionLength;
      for (let g = 0; g < QUIET.bulkheadsPerSection; g += 1) {
        const x =
          start +
          220 +
          g * Math.floor(QUIET.sectionLength / (QUIET.bulkheadsPerSection + 1)) +
          rand(-40, 40);
        const gapY = rand(150, LOGICAL_HEIGHT - 150);
        const w = QUIET.bulkheadWidth;
        this.walls.push({ x, y: -40, w, h: Math.max(0, gapY - QUIET.gapHalf + 40) });
        this.walls.push({
          x,
          y: gapY + QUIET.gapHalf,
          w,
          h: Math.max(0, LOGICAL_HEIGHT + 40 - (gapY + QUIET.gapHalf)),
        });
      }
      for (let c = 0; c < QUIET.clutterPerSection; c += 1) {
        let x = start + rand(140, QUIET.sectionLength - 140);
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const candidate = start + rand(140, QUIET.sectionLength - 140);
          if (
            this.walls.every(
              (wall) => candidate < wall.x - 90 || candidate > wall.x + wall.w + 90,
            )
          ) {
            x = candidate;
            break;
          }
        }
        this.clutter.push(new Clutter(x, rand(100, LOGICAL_HEIGHT - 100)));
      }
      this.hides.push({
        x: start + QUIET.sectionLength / 2 + rand(-120, 120),
        y: rand(110, LOGICAL_HEIGHT - 110),
        radius: QUIET.hideRadius,
      });
      if (Math.random() < 0.7) {
        const ghost = {
          x: start + rand(320, QUIET.sectionLength - 320),
          y: rand(120, LOGICAL_HEIGHT - 120),
          phase: rand(0, TAU),
          spin: rand(-0.3, 0.3),
          radius: 22,
        };
        ghost._draw = (ctx) => this.renderGhost(ctx, ghost);
        this.ghosts.push(ghost);
      }
    }
    this.exitZone = { x: this.worldLength - QUIET.exitLength * 0.5, y: LOGICAL_HEIGHT / 2 };
    this.trueExit = this.exitZone;
    this.debris = [];
    this.phase2 = false;
    this.part2Timer = 0;
    this.checkpoints = [];
    for (let s = 1; s < this.sectionCount; s += 1) {
      this.checkpoints.push({
        x: QUIET.startPadding + s * QUIET.sectionLength,
        y: LOGICAL_HEIGHT / 2,
        reached: false,
        radius: 46,
      });
    }
    this.checkpoint = { x: this.players[0].x, y: this.players[0].y };
    this.respawns = 0;
    this.checkpointNote = 0;
    this.alien = new Echoeel();
    this.alien.worldWidth = this.worldLength;
    this.alien.x = QUIET.startPadding + 200;
    this.alien.wanderX = this.alien.x;
    this.cameraX = 0;
    this.noise = 0;
    this.noiseHold = 0;
    this.hidden = false;
    this.concealed = false;
    this.noiseTarget = null;
    this.echoTimer = rand(2, QUIET.echoEvery);
    this.echoActive = false;
    this.echoAge = 0;
    this.ambientTimer = rand(1.5, 4);
    this.heartbeatTimer = 1;
    this.scareKind = 'snap';
    this.danger = 0;
    this.finale = false;
    this.finalLunge = false;
    this.remainNote = null;
    this.hallucinationTimer = rand(QUIET.hallucinationMin, QUIET.hallucinationMax);
    this.phantoms = [];
    this.vents = [];
    this.slamDoors = [];
    this.firstPersonRange = 34;
    this.firstPersonFog = 30;
    this.firstPersonShadeFloor = 0.03;
    this.firstPersonMinimap = false;
    for (let s = 0; s < this.sectionCount; s += 1) {
      const start = QUIET.startPadding + s * QUIET.sectionLength;
      const vent = {
        x: start + 320 + ((s * 233) % (QUIET.sectionLength - 420)),
        y: 130 + ((s * 149) % (LOGICAL_HEIGHT - 260)),
        timer: rand(QUIET.ventMin, QUIET.ventMax),
        burst: 0,
        radius: 16,
      };
      vent._draw = (c) => this.renderVent(c, vent);
      this.vents.push(vent);
      if (s > 0) {
        const door = {
          x: start,
          y: -40,
          w: QUIET.bulkheadWidth,
          h: LOGICAL_HEIGHT + 80,
          radius: 40,
          closed: false,
          anim: 0,
        };
        door._draw = (c) => this.renderSlamDoor(c, door);
        this.slamDoors.push(door);
      }
    }
    this.remains = [];
    for (let i = 0; i < QUIET_REMAINS.length; i += 1) {
      const s = i % this.sectionCount;
      const start = QUIET.startPadding + s * QUIET.sectionLength;
      const remain = {
        kind: i,
        x: start + 220 + ((i * 271) % (QUIET.sectionLength - 360)),
        y: 120 + ((i * 173) % (LOGICAL_HEIGHT - 240)),
        radius: 18,
        seen: false,
        text: QUIET_REMAINS[i],
      };
      remain._draw = (c) => this.renderRemain(c, remain);
      this.remains.push(remain);
    }
    this.phase = 'play';
  }

  emitNoise(x, y, source = null) {
    this.noise = Math.min(1, this.noise + QUIET.noisePerKnock);
    this.alien.alertTo(x, y);
    if (source) this.noiseTarget = source;
    this.game.audio.tone({ freq: 240, endFreq: 100, type: 'square', duration: 0.16, volume: 0.26 });
  }

  shatterJunk(item) {
    this.clutter = this.clutter.filter((entry) => entry !== item);
    const x = item.x ?? this.alien.x;
    const y = item.y ?? this.alien.y;
    this.particles.burst(x, y, {
      count: 22,
      speed: 280,
      life: 0.8,
      colors: [COLORS.rock, COLORS.rockDark, COLORS.sandDark, COLORS.wreckWood],
      buoyancy: 40,
    });
    this.shake = Math.max(this.shake, 0.5);
    this.game.audio.tone({ freq: 120, endFreq: 40, type: 'square', duration: 0.35, volume: 0.3 });
  }

  respawn() {
    const player = this.players[0];
    player.x = this.checkpoint.x;
    player.y = this.checkpoint.y;
    player.vx = 0;
    player.vy = 0;
    player.invulnerable = 0;
    this.noise = 0;
    this.noiseHold = 0;
    this.noiseTarget = null;
    this.hidden = false;
    this.concealed = false;
    this.danger = 0;
    this.echoActive = false;
    this.echoTimer = rand(2, QUIET.echoEvery);
    this.remainNote = null;
    this.resetAhead();
    if (this.flood) {
      this.alien.relentless = true;
      this.alien.chargeSpeed = QUIET.part2Speed * this.enemyMult;
      this.alien.x = clamp(this.checkpoint.x - 560, 0, this.worldLength - 60);
    } else {
      this.alien.relentless = false;
      this.alien.chargeSpeed = QUIET.chargeSpeed * this.enemyMult;
      this.alien.x = clamp(this.checkpoint.x + 700, 60, this.worldLength - 60);
    }
    this.alien.y = LOGICAL_HEIGHT / 2;
    this.alien.targetX = this.alien.x;
    this.alien.targetY = this.alien.y;
    this.alien.wanderX = this.alien.x;
    this.alien.wanderY = this.alien.y;
    this.alien.state = 'drift';
    this.respawns += 1;
    this.checkpointNote = 2.5;
    this.phase = 'play';
    this.flash = 0;
    this.shake = 0;
    this.game.audio.tone({
      freq: 300,
      endFreq: 620,
      type: 'triangle',
      duration: 0.3,
      volume: 0.22,
    });
  }

  resetAhead() {
    if (!this.flood) {
      this.phase2 = false;
      this.finale = false;
    }
    this.part2Timer = 0;
    this.walls = this.walls.filter((wall) => !wall.seal && !wall.debris);
    for (const deb of this.debris) {
      deb.state = 'idle';
      deb.timer = 0;
    }
    for (const door of this.slamDoors) {
      if (door.x >= this.checkpoint.x - 70) {
        door.closed = false;
        door.anim = 0;
      }
    }
    this.walls = this.walls.filter((wall) => !(wall.slam && wall.x >= this.checkpoint.x - 70));
  }

  startScare(kind = 'snap') {
    if (this.phase === 'scare') return;
    this.phase = 'scare';
    this.scareKind = kind;
    this.scareTimer = QUIET.scareDuration;
    this.shake = 1;
    this.game.audio.noise({
      duration: 0.6,
      volume: 0.32,
      type: 'lowpass',
      filterFreq: 1400,
      filterEnd: 180,
    });
    this.game.audio.tone({ freq: 70, endFreq: 28, type: 'sawtooth', duration: 1.3, volume: 0.42 });
    this.game.audio.tone({ freq: 340, endFreq: 120, type: 'square', duration: 0.5, volume: 0.3 });
  }

  updateAmbience(dt, player) {
    this.ambientTimer -= dt;
    if (this.ambientTimer <= 0) {
      this.ambientTimer = rand(3.2, 7.4);
      this.playAmbient();
    }
    const distance = Math.hypot(player.x - this.alien.x, player.y - this.alien.y);
    const closeness = clamp(1 - distance / QUIET.heartbeatRange, 0, 1);
    this.danger = clamp(Math.max(closeness, this.noise * 0.85), 0, 1);
    this.heartbeatTimer -= dt * (1 + closeness * 1.9 + this.noise * 0.8);
    if (this.heartbeatTimer <= 0) {
      this.heartbeatTimer = 1.05;
      this.playHeartbeat(closeness);
    }
  }

  playAmbient() {
    const audio = this.game.audio;
    const roll = rand(0, 1);
    if (roll < 0.26) {
      audio.tone({
        freq: 44,
        endFreq: 30,
        type: 'sawtooth',
        duration: rand(1.3, 2.4),
        volume: 0.05,
      });
    } else if (roll < 0.5) {
      audio.noise({
        duration: rand(0.4, 0.7),
        volume: 0.06,
        type: 'bandpass',
        filterFreq: rand(320, 900),
        filterEnd: rand(120, 300),
        q: 7,
      });
    } else if (roll < 0.7) {
      audio.tone({ freq: 1500, endFreq: 720, type: 'sine', duration: 0.06, volume: 0.05 });
      audio.tone({ freq: 2000, endFreq: 940, type: 'sine', duration: 0.05, volume: 0.04, delay: 0.15 });
    } else if (roll < 0.86) {
      audio.noise({ duration: rand(0.7, 1.3), volume: 0.035, type: 'highpass', filterFreq: 1900 });
    } else {
      audio.tone({ freq: 74, endFreq: 40, type: 'triangle', duration: 0.55, volume: 0.07 });
    }
  }

  playHeartbeat(closeness) {
    const audio = this.game.audio;
    const volume = 0.05 + closeness * 0.11;
    audio.tone({ freq: 72, endFreq: 42, type: 'sine', duration: 0.16, volume });
    audio.tone({
      freq: 62,
      endFreq: 34,
      type: 'sine',
      duration: 0.2,
      volume: volume * 0.78,
      delay: 0.17,
    });
  }

  updateHorror(dt, player) {
    this.updateVents(dt, player);
    this.updateRemains(player);
    this.updateHallucinations(dt);
    this.updateSlamDoors(dt, player);
    this.updateDebris(dt, player);
    if (this.flood) this.updateChase(player);
    if (this.remainNote) {
      this.remainNote.timer -= dt;
      if (this.remainNote.timer <= 0) this.remainNote = null;
    }
    if (this.checkpointNote > 0) this.checkpointNote = Math.max(0, this.checkpointNote - dt);
  }

  updateDebris(dt, player) {
    if (!this.phase2) return;
    for (const deb of this.debris) {
      if (deb.state === 'idle') {
        if (player.x > deb.x - 90) {
          deb.state = 'warn';
          deb.timer = 0.45;
        }
      } else if (deb.state === 'warn') {
        deb.timer -= dt;
        if (deb.timer <= 0) {
          deb.state = 'fall';
          this.walls.push({
            x: deb.x - deb.radius,
            y: deb.y - deb.radius,
            w: deb.radius * 2,
            h: deb.radius * 2,
            debris: true,
          });
          this.emitNoise(deb.x, deb.y, null);
          this.particles.burst(deb.x, deb.y, {
            count: 16,
            speed: 200,
            life: 0.8,
            colors: [COLORS.rock, COLORS.rockDark, COLORS.sandDark],
            buoyancy: 30,
          });
          this.shake = Math.max(this.shake, 0.6);
          this.game.audio.noise({
            duration: 0.5,
            volume: 0.2,
            type: 'lowpass',
            filterFreq: 420,
            filterEnd: 90,
          });
          if (Math.hypot(player.x - deb.x, player.y - deb.y) < deb.radius + player.radius) {
            this.startScare('snap');
            return;
          }
        }
      }
    }
  }

  updateVents(dt, player) {
    for (const vent of this.vents) {
      if (vent.burst > 0) vent.burst = Math.max(0, vent.burst - dt * 1.6);
      vent.timer -= dt;
      if (vent.timer > 0) continue;
      vent.timer = rand(QUIET.ventMin, QUIET.ventMax);
      if (Math.hypot(player.x - vent.x, player.y - vent.y) > 720) continue;
      vent.burst = 1;
      this.emitNoise(vent.x, vent.y, null);
      this.particles.burst(vent.x, vent.y, {
        count: 20,
        speed: 170,
        life: 0.9,
        colors: [COLORS.bubble, COLORS.foam, '#ffffff'],
        buoyancy: -70,
      });
      this.game.audio.noise({ duration: 0.5, volume: 0.16, type: 'highpass', filterFreq: 1700 });
    }
  }

  updateRemains(player) {
    for (const remain of this.remains) {
      if (remain.seen) continue;
      if (Math.hypot(player.x - remain.x, player.y - remain.y) < 96) {
        remain.seen = true;
        this.remainNote = { text: remain.text, timer: 4.5 };
        this.game.audio.tone({ freq: 200, endFreq: 90, type: 'triangle', duration: 0.5, volume: 0.1 });
      }
    }
  }

  updateHallucinations(dt) {
    for (const phantom of this.phantoms) {
      phantom.life -= dt;
      phantom.x += phantom.vx * dt;
      phantom.y = clamp(phantom.y + phantom.vy * dt, 60, LOGICAL_HEIGHT - 60);
    }
    this.phantoms = this.phantoms.filter((phantom) => phantom.life > 0);
    this.hallucinationTimer -= dt;
    if (this.hallucinationTimer > 0) return;
    this.hallucinationTimer =
      rand(QUIET.hallucinationMin, QUIET.hallucinationMax) * (1 - this.danger * 0.55);
    if (this.phantoms.length >= 2) return;
    const player = this.players[0];
    const side = Math.random() < 0.5 ? -1 : 1;
    const phantom = {
      x: player.x + rand(150, 330) * side,
      y: clamp(player.y + rand(-170, 170), 60, LOGICAL_HEIGHT - 60),
      vx: -side * rand(30, 70),
      vy: rand(-20, 20),
      life: QUIET.phantomLife,
      maxLife: QUIET.phantomLife,
      radius: 40,
      phase: rand(0, TAU),
    };
    phantom._draw = (ctx) => this.renderPhantom(ctx, phantom);
    this.phantoms.push(phantom);
    this.game.audio.noise({
      duration: 0.4,
      volume: 0.05,
      type: 'bandpass',
      filterFreq: rand(500, 1200),
      q: 8,
    });
  }

  updateSlamDoors(dt, player) {
    for (const door of this.slamDoors) {
      if (door.closed) {
        door.anim = Math.min(1, door.anim + dt * 3);
        continue;
      }
      if (player.x > door.x + door.w + 40) {
        door.closed = true;
        door.anim = 0;
        this.walls.push({ x: door.x, y: 0, w: door.w, h: LOGICAL_HEIGHT, slam: true });
        this.emitNoise(door.x, player.y, null);
        this.shake = Math.max(this.shake, 0.7);
        this.game.audio.noise({
          duration: 0.7,
          volume: 0.28,
          type: 'lowpass',
          filterFreq: 700,
          filterEnd: 120,
        });
        this.game.audio.tone({ freq: 90, endFreq: 40, type: 'square', duration: 0.5, volume: 0.3 });
      }
    }
  }

  updateChase(player) {
    this.alien.targetX = player.x;
    this.alien.targetY = player.y;
    if (this.alien.state !== 'charge') {
      this.alien.state = 'charge';
      this.alien.stateTimer = 2;
    }
  }

  hasLineOfSight() {
    const player = this.players[0];
    for (const wall of this.walls) {
      if (segmentHitsRect(this.alien.x, this.alien.y, player.x, player.y, wall)) return false;
    }
    return true;
  }

  updateRound(dt, input) {
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }
    this.updatePlayers(dt, input);
    const player = this.players[0];
    for (const wall of this.walls) resolveCircleRect(player, wall);
    player.x = clamp(player.x, player.radius, this.worldLength - player.radius);

    for (const cp of this.checkpoints) {
      if (!cp.reached && player.x >= cp.x) {
        cp.reached = true;
        this.checkpoint = { x: cp.x, y: cp.y };
        this.checkpointNote = 3;
        this.game.audio.tone({
          freq: 520,
          endFreq: 780,
          type: 'triangle',
          duration: 0.24,
          volume: 0.2,
        });
      }
    }

    this.hidden = this.hides.some(
      (hide) => Math.hypot(player.x - hide.x, player.y - hide.y) < hide.radius,
    );
    this.concealed = this.hidden || !this.hasLineOfSight();

    this.noise = Math.max(0, this.noise - QUIET.noiseDecay * dt);
    const moveSpeed = Math.hypot(player.vx ?? 0, player.vy ?? 0);
    const moveRatio = clamp(moveSpeed / PLAYER.maxSpeed, 0, 1);
    if (moveRatio > 0.02) {
      this.noise = Math.min(1, this.noise + QUIET.moveNoise * moveRatio * moveRatio * dt);
    }
    for (const item of this.clutter) {
      item.update(dt);
      if (item.toppled) continue;
      if (circleOverlap(player, item)) {
        if (item.knock()) this.emitNoise(item.x, item.y, item);
      }
    }

    if (this.noise >= 0.9) this.noiseHold += dt;
    else this.noiseHold = 0;
    if (this.noiseHold >= QUIET.scareHold) {
      this.startScare('breach');
      return;
    }

    this.updateHorror(dt, player);
    this.updateAmbience(dt, player);

    this.echoTimer -= dt;
    if (this.echoTimer <= 0) {
      this.echoTimer = QUIET.echoEvery;
      this.echoActive = true;
      this.echoAge = 0;
    }
    if (this.echoActive) {
      this.echoAge += dt;
      if (this.echoAge > 2.6) this.echoActive = false;
    }

    this.alien.update(dt);

    if (!this.finalLunge && !this.flood && player.x >= this.exitZone.x - QUIET.finalLungeRange) {
      this.finalLunge = true;
      this.finale = true;
      this.alien.relentless = true;
      this.alien.chargeSpeed = QUIET.finalLungeSpeed;
      this.alien.state = 'charge';
      this.alien.stateTimer = 4;
      this.alien.x = player.x - 300;
      this.alien.y = player.y;
      this.alien.targetX = player.x;
      this.alien.targetY = player.y;
      this.shake = 1;
      this.game.audio.noise({
        duration: 1.2,
        volume: 0.32,
        type: 'lowpass',
        filterFreq: 900,
        filterEnd: 120,
      });
      this.game.audio.tone({ freq: 70, endFreq: 30, type: 'sawtooth', duration: 1.2, volume: 0.34 });
    }

    if (this.finalLunge) {
      this.alien.targetX = player.x;
      this.alien.targetY = player.y;
      if (this.alien.state !== 'charge') {
        this.alien.state = 'charge';
        this.alien.stateTimer = 4;
      }
      const gap = Math.hypot(this.alien.x - player.x, this.alien.y - player.y);
      const reach = QUIET.touchRange + 6;
      if (gap < reach) {
        const k = reach / (gap || 1);
        this.alien.x = player.x + (this.alien.x - player.x) * k;
        this.alien.y = player.y + (this.alien.y - player.y) * k;
      }
    }

    if (!this.finalLunge && this.echoActive) {
      const reach = (this.echoAge / 2.6) * QUIET.echoRange;
      if (
        !this.concealed &&
        Math.hypot(player.x - this.alien.x, player.y - this.alien.y) <= reach
      ) {
        this.startScare('sonar');
        return;
      }
    }

    if (
      !this.finalLunge &&
      this.noiseTarget &&
      this.alien.state !== 'drift' &&
      Math.hypot(this.alien.x - this.noiseTarget.x, this.alien.y - this.noiseTarget.y) <=
        this.alien.radius + this.noiseTarget.radius
    ) {
      const target = this.noiseTarget;
      this.noiseTarget = null;
      const caught =
        !this.concealed &&
        Math.hypot(player.x - target.x, player.y - target.y) < QUIET.shatterCatch;
      this.shatterJunk(target);
      if (caught) {
        this.startScare('lunge');
        return;
      }
    }

    if (
      !this.finalLunge &&
      !this.concealed &&
      Math.hypot(player.x - this.alien.x, player.y - this.alien.y) < QUIET.touchRange
    ) {
      this.startScare('snap');
      return;
    }

    if (player.x >= this.exitZone.x - QUIET.exitHalf) {
      if (this.flood) this.startOutro();
      else this.finish(true);
    }
  }

  startOutro() {
    if (this.phase === 'outro') return;
    this.phase = 'outro';
    this.outroTimer = 0;
    this.outroShattered = false;
    this.outroBurst = false;
    this.shake = 0;
    this.flash = 0;
    this.alien.relentless = false;
    this.alien.x = LOGICAL_WIDTH / 2 - 220;
    this.alien.y = LOGICAL_HEIGHT / 2;
    this.alien.facing = 1;
    this.players[0].vx = 0;
    this.players[0].vy = 0;
    this.game.audio.noise({
      duration: 1.2,
      volume: 0.22,
      type: 'lowpass',
      filterFreq: 420,
      filterEnd: 70,
    });
  }

  updateOutro(dt) {
    this.outroTimer += dt;
    const t = this.outroTimer;
    this.particles.update(dt);
    this.shake = Math.max(0, this.shake - dt * 1.6);
    this.flash = Math.max(0, this.flash - dt * 2.4);
    if (!this.outroShattered && t >= 1.15) {
      this.outroShattered = true;
      this.shake = 1;
      this.flash = 0.7;
      this.particles.burst(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, {
        count: 44,
        speed: 340,
        life: 1,
        colors: ['#dff6ff', '#9fd7e8', '#ffffff', '#8fb8c8'],
        buoyancy: -120,
      });
      this.game.audio.noise({
        duration: 0.5,
        volume: 0.34,
        type: 'highpass',
        filterFreq: 2600,
      });
      this.game.audio.tone({ freq: 1500, endFreq: 400, type: 'triangle', duration: 0.4, volume: 0.2 });
      this.game.audio.tone({ freq: 2200, endFreq: 600, type: 'square', duration: 0.3, volume: 0.14 });
    }
    if (!this.outroBurst && t >= 1.55) {
      this.outroBurst = true;
      this.shake = 1;
      this.game.audio.tone({ freq: 120, endFreq: 40, type: 'sawtooth', duration: 0.9, volume: 0.32 });
      this.game.audio.noise({ duration: 0.8, volume: 0.24, type: 'lowpass', filterFreq: 600, filterEnd: 120 });
    }
    if (t >= QUIET.outroDuration) this.finish(true);
  }

  updateCamera() {
    this.cameraX = clamp(
      this.players[0].x - LOGICAL_WIDTH / 2,
      0,
      Math.max(0, this.worldLength - LOGICAL_WIDTH),
    );
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
    if (this.phase === 'arrival') {
      this.updateArrival(dt, input);
      return;
    }
    if (this.phase === 'outro') {
      if (input.wasPressed('back') && this.theatre) {
        this.game.changeScene('theatre');
        return;
      }
      this.updateOutro(dt);
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
    this.updateRound(dt, input);
    this.particles.update(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);
  }

  render(ctx) {
    setSkinClock(this.time);
    if (this.phase === 'select') {
      this.renderSelect(ctx);
      return;
    }
    if (this.phase === 'arrival') {
      this.renderArrival(ctx);
      return;
    }
    if (this.phase === 'outro') {
      this.renderOutro(ctx);
      return;
    }
    if (firstPersonMode()) {
      this.renderFirstPerson(ctx);
      return;
    }
    ctx.save();
    if (this.danger > 0.02) {
      const zoom = 1 + this.danger * 0.012 * motionScale() * (0.5 + 0.5 * Math.sin(this.time * 6));
      ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-LOGICAL_WIDTH / 2, -LOGICAL_HEIGHT / 2);
    }
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, QUIET_PALETTE);
    this.updateCamera();
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 10 * this.shake * motionScale(), rand(-1, 1) * 10 * this.shake * motionScale());
    }
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    this.renderLab(ctx);
    for (const hide of this.hides) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(hide.x, hide.y, hide.radius, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = this.hidden ? 'rgba(143, 240, 208, 0.5)' : 'rgba(120, 150, 160, 0.22)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    if (!this.flood) {
      const hatchAlpha = 0.14 + 0.08 * Math.sin(this.time * 3);
      ctx.fillStyle = `rgba(143, 240, 208, ${hatchAlpha})`;
      ctx.fillRect(this.exitZone.x - QUIET.exitHalf, -20, QUIET.exitHalf * 2, LOGICAL_HEIGHT + 40);
      ctx.strokeStyle = COLORS.alienGlow;
      ctx.lineWidth = 4;
      ctx.strokeRect(
        this.exitZone.x - QUIET.exitHalf,
        -20,
        QUIET.exitHalf * 2,
        LOGICAL_HEIGHT + 40,
      );
      drawText(ctx, 'EXIT', this.exitZone.x, 60, { size: 16, color: COLORS.alienGlow });
    }

    const trueAlpha = 0.16 + 0.1 * Math.sin(this.time * 3.4);
    ctx.fillStyle = `rgba(143, 240, 208, ${trueAlpha})`;
    ctx.fillRect(this.trueExit.x - QUIET.exitHalf, -20, QUIET.exitHalf * 2, LOGICAL_HEIGHT + 40);
    ctx.strokeStyle = COLORS.alienGlow;
    ctx.lineWidth = 5;
    ctx.strokeRect(this.trueExit.x - QUIET.exitHalf, -20, QUIET.exitHalf * 2, LOGICAL_HEIGHT + 40);
    drawText(ctx, 'EXIT', this.trueExit.x, 60, { size: 16, color: COLORS.alienGlow });

    for (const vent of this.vents) this.renderVent(ctx, vent);
    for (const door of this.slamDoors) this.renderSlamDoor(ctx, door);
    for (const item of this.clutter) item.render(ctx);
    for (const ghost of this.ghosts) this.renderGhost(ctx, ghost);
    for (const remain of this.remains) this.renderRemain(ctx, remain);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
    ctx.restore();
    ctx.restore();

    this.renderDarkness(ctx);
    this.renderDarkLayer(ctx);
    ctx.restore();

    this.renderHud(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35 * motionScale()})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.phase === 'scare') this.renderScare(ctx);
    else if (this.phase === 'results') this.renderResults(ctx);
  }

  renderFirstPerson(ctx) {
    if (this.phase === 'scare') {
      this.renderScare(ctx);
      return;
    }
    renderFirstPersonLevel(ctx, this);
    this.renderFog(ctx);
    this.renderHud(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35 * motionScale()})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.phase === 'results') this.renderResults(ctx);
  }

  renderFog(ctx) {
    const gradient = ctx.createRadialGradient(
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT * 0.5,
      LOGICAL_HEIGHT * 0.12,
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT * 0.5,
      LOGICAL_HEIGHT * 0.72,
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${0.9 - this.danger * 0.15})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  renderPlayers(ctx) {
    for (let index = 0; index < this.players.length; index += 1) {
      applyWardrobe(this.shop, index);
      const player = this.players[index];
      player.render(ctx);
      drawSkinAura(ctx, player);
      drawTrail(ctx, player);
      drawCompanion(ctx, player);
    }
  }

  renderDarkness(ctx) {
    const player = this.players[0];
    const cx = player.x - this.cameraX;
    const cy = player.y;
    const radius = QUIET.visionRadius * (1 - (1 - QUIET.visionTighten) * this.danger);
    const flicker = 1 + Math.sin(this.time * 21) * (0.035 + this.danger * 0.09) + Math.sin(this.time * 6.7) * 0.02;
    const inner = radius * 0.55 * flicker;
    const outer = radius * QUIET.visionSoft * flicker;
    const light = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
    light.addColorStop(0, 'rgba(0, 0, 0, 0)');
    light.addColorStop(0.7, `rgba(0, 0, 0, ${QUIET.ambientDark * 0.6})`);
    light.addColorStop(1, `rgba(0, 0, 0, ${QUIET.ambientDark})`);
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  renderDarkLayer(ctx) {
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    for (const hide of this.hides) {
      if (hide.x < this.cameraX - 120 || hide.x > this.cameraX + LOGICAL_WIDTH + 120) continue;
      ctx.strokeStyle = this.hidden ? 'rgba(143, 240, 208, 0.5)' : 'rgba(143, 240, 208, 0.2)';
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.arc(hide.x, hide.y, hide.radius, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const deb of this.debris) this.renderDebris(ctx, deb);
    for (const cp of this.checkpoints) {
      if (cp.x < this.cameraX - 140 || cp.x > this.cameraX + LOGICAL_WIDTH + 140) continue;
      const alpha = cp.reached ? 0.75 : 0.26;
      ctx.strokeStyle = `rgba(143, 240, 208, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, cp.radius, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(143, 240, 208, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 6, 0, TAU);
      ctx.fill();
      drawText(ctx, cp.reached ? 'CHECKPOINT' : 'SAFE POINT', cp.x, cp.y - cp.radius - 12, {
        size: 11,
        color: COLORS.alienGlow,
        alpha,
      });
    }
    if (!this.flood) {
      const hatchAlpha = 0.16 + 0.08 * Math.sin(this.time * 3);
      ctx.fillStyle = `rgba(143, 240, 208, ${hatchAlpha})`;
      ctx.fillRect(this.exitZone.x - QUIET.exitHalf, -20, QUIET.exitHalf * 2, LOGICAL_HEIGHT + 40);
      ctx.strokeStyle = COLORS.alienGlow;
      ctx.lineWidth = 4;
      ctx.strokeRect(
        this.exitZone.x - QUIET.exitHalf,
        -20,
        QUIET.exitHalf * 2,
        LOGICAL_HEIGHT + 40,
      );
      drawText(ctx, 'EXIT', this.exitZone.x, 60, {
        size: 16,
        color: COLORS.alienGlow,
        alpha: 0.85,
      });
    }
    const trueAlpha = 0.18 + 0.1 * Math.sin(this.time * 3.4);
    ctx.fillStyle = `rgba(143, 240, 208, ${trueAlpha})`;
    ctx.fillRect(this.trueExit.x - QUIET.exitHalf, -20, QUIET.exitHalf * 2, LOGICAL_HEIGHT + 40);
    ctx.strokeStyle = COLORS.alienGlow;
    ctx.lineWidth = 5;
    ctx.strokeRect(this.trueExit.x - QUIET.exitHalf, -20, QUIET.exitHalf * 2, LOGICAL_HEIGHT + 40);
    drawText(ctx, 'EXIT', this.trueExit.x, 60, { size: 16, color: COLORS.alienGlow, alpha: 0.9 });
    if (this.echoActive) {
      ctx.strokeStyle = `rgba(143, 240, 208, ${0.6 * Math.max(0, 1 - this.echoAge / 2.6)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.alien.x, this.alien.y, (this.echoAge / 2.6) * QUIET.echoRange, 0, TAU);
      ctx.stroke();
    }
    for (const phantom of this.phantoms) this.renderPhantom(ctx, phantom);
    ctx.save();
    ctx.shadowColor = 'rgba(143, 240, 208, 0.45)';
    ctx.shadowBlur = 16;
    this.alien.render(ctx);
    ctx.restore();
    ctx.restore();
  }

  renderSelect(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, QUIET_PALETTE);
    drawText(ctx, this.title, LOGICAL_WIDTH / 2, 90, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.alienGlow,
      glowBlur: 22,
    });
    drawText(
      ctx,
      this.flood ? 'THE LAB IS COLLAPSING — OUTRUN IT' : 'AN ABANDONED LAB — CHOOSE YOUR DIVER',
      LOGICAL_WIDTH / 2,
      132,
      {
        size: 14,
        color: COLORS.foam,
        alpha: 0.85,
      },
    );
    this.selectMenu.render(ctx, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.56);
    drawText(
      ctx,
      'LEFT/RIGHT — CHANGE DIVER      ENTER — START      ESC — BACK',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 26,
      { size: 12, color: COLORS.textDim },
    );
  }

  renderArrival(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, QUIET_PALETTE);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 12 * this.shake * motionScale(), rand(-1, 1) * 12 * this.shake * motionScale());
    }
    this.renderLab(ctx);
    for (const member of this.arrivalCrew) member.entity.render(ctx);
    this.particles.render(ctx);
    this.renderRift(ctx);
    if (this.arrivalEchoeel.reveal > 0) {
      const e = this.arrivalEchoeel;
      ctx.save();
      ctx.globalAlpha = e.reveal;
      ctx.translate(e.x, e.y);
      ctx.scale(0.6 + e.reveal * 0.7, 0.6 + e.reveal * 0.7);
      ctx.translate(-e.x, -e.y);
      e.render(ctx);
      ctx.restore();
    }
    ctx.restore();

    const vignette = ctx.createRadialGradient(
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT / 2,
      LOGICAL_HEIGHT * 0.24,
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT / 2,
      LOGICAL_HEIGHT * 1.05,
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    drawText(ctx, 'MYSTERIOUSLY QUIET', LOGICAL_WIDTH / 2, 52, {
      size: 26,
      color: COLORS.text,
      glow: COLORS.alienGlow,
      glowBlur: 18,
      alpha: 0.9,
    });
    const t = this.arrivalTimer;
    const card =
      t < 1.9
        ? 'AN INTERGALACTIC ATOM RIFT TEARS OPEN IN THE LAB'
        : t < 4.4
          ? 'THE ECHOEEL COMES THROUGH THE RIFT — ITS PLANET RAN OUT OF PREY'
          : 'THE SEVEN DIVERS ARRIVE';
    drawText(ctx, card, LOGICAL_WIDTH / 2, 96, {
      size: 20,
      color: t < 1.9 ? COLORS.danger : t < 4.4 ? COLORS.accent : COLORS.bubble,
      glow: 'rgba(255, 209, 102, 0.5)',
      glowBlur: 16,
      alpha: 0.9,
    });
    if (t >= 4.4) {
      drawText(
        ctx,
        'SHARK · STINGRAY · SQUID · SHRIMP · CRAB · JELLY · NAUTILUS',
        LOGICAL_WIDTH / 2,
        126,
        { size: 11, color: COLORS.textDim, alpha: 0.8 },
      );
    }
    drawText(ctx, 'ENTER — SKIP', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 24, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.7,
    });
  }

  renderRift(ctx) {
    const rift = this.rift;
    const open = rift.open;
    if (open <= 0.001) return;
    ctx.save();
    ctx.translate(rift.x, rift.y);
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, rift.size * (0.5 + open));
    glow.addColorStop(0, `rgba(143, 240, 208, ${0.55 * open})`);
    glow.addColorStop(0.5, `rgba(150, 90, 255, ${0.3 * open})`);
    glow.addColorStop(1, 'rgba(150, 90, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, rift.size * (0.5 + open), 0, TAU);
    ctx.fill();
    for (let i = 0; i < 3; i += 1) {
      ctx.save();
      ctx.rotate(this.time * 1.6 + i * (TAU / 3));
      ctx.strokeStyle = `rgba(180, 240, 255, ${0.7 * open})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, rift.size * open, rift.size * 0.42 * open, 0, 0.35, Math.PI - 0.35);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = `rgba(0, 0, 0, ${0.88 * open})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, rift.size * 0.72 * open, rift.size * 0.3 * open, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(200, 250, 255, ${0.9 * open})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, rift.size * 0.74 * open, rift.size * 0.32 * open, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  renderOutro(ctx) {
    const t = this.outroTimer;
    const cx = LOGICAL_WIDTH / 2;
    const cy = LOGICAL_HEIGHT / 2;
    const paneX = cx + 40;
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, QUIET_PALETTE);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.strokeStyle = 'rgba(90, 104, 112, 0.4)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, LOGICAL_HEIGHT - 40);
    ctx.lineTo(LOGICAL_WIDTH, LOGICAL_HEIGHT - 40);
    ctx.stroke();

    ctx.strokeStyle = '#4a5560';
    ctx.lineWidth = 8;
    ctx.strokeRect(paneX - 12, 50, 24, LOGICAL_HEIGHT - 130);
    if (!this.outroShattered) {
      ctx.fillStyle = 'rgba(180, 230, 245, 0.16)';
      ctx.fillRect(paneX - 12, 50, 24, LOGICAL_HEIGHT - 130);
      const crack = clamp(t / 1.15, 0, 1);
      ctx.strokeStyle = `rgba(230, 250, 255, ${0.45 + 0.5 * crack})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 9; i += 1) {
        const y0 = 70 + i * ((LOGICAL_HEIGHT - 170) / 8);
        const len = 18 + crack * 46;
        ctx.beginPath();
        ctx.moveTo(paneX, y0);
        ctx.lineTo(paneX + Math.sin(i * 1.7) * len, y0 + Math.cos(i * 2.1) * len * 0.5);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = 'rgba(220, 245, 255, 0.55)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 9; i += 1) {
        const y0 = 70 + i * ((LOGICAL_HEIGHT - 170) / 8);
        ctx.beginPath();
        ctx.moveTo(paneX - 12, y0 - 6);
        ctx.lineTo(paneX - 2, y0 + 6);
        ctx.lineTo(paneX + 2, y0 - 8);
        ctx.lineTo(paneX + 12, y0 + 5);
        ctx.stroke();
      }
    }

    const diver = this.players[0];
    ctx.save();
    ctx.translate(cx - 220, cy + 40);
    const dx = diver.x;
    const dy = diver.y;
    diver.x = 0;
    diver.y = 0;
    diver._draw(ctx);
    diver.x = dx;
    diver.y = dy;
    ctx.restore();

    let ex;
    let ey;
    let scale;
    let alpha;
    let rot;
    if (t < 1.15) {
      const p = clamp(t / 1.15, 0, 1);
      ex = cx - 250 + p * 250;
      ey = cy;
      scale = 0.9 + p * 0.35;
      alpha = 1;
      rot = 0;
    } else if (t < 2.4) {
      const p = clamp((t - 1.15) / 1.25, 0, 1);
      ex = paneX + p * 190;
      ey = cy + Math.sin(p * Math.PI) * 44;
      scale = 1.25;
      alpha = 1;
      rot = p * 1.7;
    } else {
      const p = clamp((t - 2.4) / Math.max(0.01, QUIET.outroDuration - 2.4), 0, 1);
      ex = paneX + 190 + p * 70;
      ey = cy + 44 + p * (LOGICAL_HEIGHT * 0.75);
      scale = 1.25 * (1 - p * 0.8);
      alpha = 1 - p * 0.92;
      rot = 1.7 + p * 2.6;
    }
    this.alien.state = 'charge';
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(ex, ey);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    const ax = this.alien.x;
    const ay = this.alien.y;
    this.alien.x = 0;
    this.alien.y = 0;
    this.alien._draw(ctx);
    this.alien.x = ax;
    this.alien.y = ay;
    ctx.restore();

    this.particles.render(ctx);

    const card =
      t < 1.15
        ? 'THE ECHOEEL SLAMS INTO THE GLASS'
        : t < 2.4
          ? 'THE PANE SHATTERS — IT TUMBLES THROUGH'
          : 'ITS HIGH SPEED, COMBINED WITH ITS WEIGHT, MADE IT SINK INTO THE TRENCH';
    drawText(ctx, card, cx, LOGICAL_HEIGHT - 104, {
      size: 18,
      color: t < 1.15 ? COLORS.danger : t < 2.4 ? COLORS.bubble : COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 16,
      alpha: 0.92,
    });
    drawText(ctx, 'MYSTERIOUSLY QUIET', cx, 60, {
      size: 26,
      color: COLORS.text,
      glow: COLORS.alienGlow,
      glowBlur: 18,
      alpha: 0.9,
    });

    const vignette = ctx.createRadialGradient(cx, cy, LOGICAL_HEIGHT * 0.24, cx, cy, LOGICAL_HEIGHT * 1.05);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flash * 0.5 * motionScale()})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
  }

  renderLab(ctx) {
    const from = Math.floor(this.cameraX / 140) * 140;
    for (let x = from; x < this.cameraX + LOGICAL_WIDTH + 140; x += 140) {
      ctx.strokeStyle = 'rgba(70, 84, 94, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, LOGICAL_HEIGHT);
      ctx.stroke();
      ctx.fillStyle = 'rgba(120, 140, 150, 0.12)';
      ctx.beginPath();
      ctx.arc(x + 70, 40, 4, 0, TAU);
      ctx.fill();
      const flicker = 0.3 + 0.5 * Math.max(0, Math.sin(this.time * 7 + x * 0.03));
      ctx.fillStyle = `rgba(255, 90, 90, ${flicker})`;
      ctx.beginPath();
      ctx.arc(x + 70, LOGICAL_HEIGHT - 34, 4, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(20, 26, 30, 0.7)';
    ctx.fillRect(this.cameraX - 40, LOGICAL_HEIGHT - 26, LOGICAL_WIDTH + 80, 26);
    ctx.strokeStyle = 'rgba(80, 96, 106, 0.4)';
    ctx.lineWidth = 2;
    for (let x = from; x < this.cameraX + LOGICAL_WIDTH + 140; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, LOGICAL_HEIGHT - 26);
      ctx.lineTo(x, LOGICAL_HEIGHT);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(90, 104, 112, 0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(this.cameraX - 40, 22);
    ctx.lineTo(this.cameraX + LOGICAL_WIDTH + 40, 22);
    ctx.stroke();
    for (const wall of this.walls) {
      if (wall.slam || wall.debris) continue;
      this.renderBulkhead(ctx, wall);
    }
  }

  renderBulkhead(ctx, wall) {
    const gradient = ctx.createLinearGradient(wall.x, 0, wall.x + wall.w, 0);
    gradient.addColorStop(0, '#20262c');
    gradient.addColorStop(0.5, '#333b43');
    gradient.addColorStop(1, '#20262c');
    ctx.fillStyle = gradient;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = 'rgba(10, 12, 14, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = 'rgba(190, 180, 160, 0.25)';
    for (let y = wall.y + 30; y < wall.y + wall.h - 6; y += 60) {
      ctx.beginPath();
      ctx.arc(wall.x + 10, y, 2.6, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wall.x + wall.w - 10, y, 2.6, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(201, 162, 39, 0.5)';
    const tip = wall.y <= 0 ? wall.y + wall.h - 8 : wall.y;
    ctx.fillRect(wall.x, tip, wall.w, 8);
    if (wall.h > 60) {
      const top = wall.y + 24 + ((wall.x * 13) % 90);
      ctx.strokeStyle = 'rgba(8, 5, 5, 0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(wall.x + 12 + i * 9, top);
        ctx.lineTo(wall.x + 21 + i * 9, top + 28);
        ctx.stroke();
      }
    }
  }

  renderGhost(ctx, ghost) {
    const bob = Math.sin(this.time * 0.6 + ghost.phase) * 8;
    ctx.save();
    ctx.translate(ghost.x, ghost.y + bob);
    ctx.rotate(Math.sin(this.time * 0.4 + ghost.phase) * 0.12 + ghost.spin);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#2a2f35';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 26, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#9aa0a6';
    ctx.beginPath();
    ctx.arc(0, -22, 11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0b0f13';
    ctx.beginPath();
    ctx.arc(0, -22, 8, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = '#6a7078';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 12);
    ctx.quadraticCurveTo(-30, 42, -10, 82);
    ctx.stroke();
    ctx.restore();
  }

  renderRemain(ctx, remain) {
    ctx.save();
    ctx.translate(remain.x, remain.y);
    ctx.globalAlpha = 0.6;
    if (remain.kind % 2 === 0) {
      ctx.fillStyle = '#c9d2d8';
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 24, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#9aa6ad';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(-8, 16);
      ctx.lineTo(8, 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e26052';
      ctx.fillRect(6, -2, 5, 4);
      ctx.fillStyle = '#b9c2c8';
      ctx.beginPath();
      ctx.arc(0, -20, 9, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(10, 6, 6, 0.75)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-14 + i * 8, -14);
        ctx.lineTo(-8 + i * 8, 16);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  renderVent(ctx, vent) {
    ctx.save();
    ctx.translate(vent.x, vent.y);
    ctx.fillStyle = 'rgba(40, 50, 56, 0.9)';
    ctx.fillRect(-16, -10, 32, 20);
    ctx.strokeStyle = 'rgba(120, 140, 150, 0.5)';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 6, -10);
      ctx.lineTo(i * 6, 10);
      ctx.stroke();
    }
    if (vent.burst > 0) {
      ctx.globalAlpha = vent.burst;
      ctx.fillStyle = 'rgba(230, 246, 255, 0.5)';
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(Math.sin(this.time * 8 + i) * 8, -14 - i * 10, 6 - i, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  renderSlamDoor(ctx, door) {
    if (!door.closed) return;
    const drop = 1 - door.anim;
    const top = -40 - drop * (door.h + 40);
    const gradient = ctx.createLinearGradient(door.x, 0, door.x + door.w, 0);
    gradient.addColorStop(0, '#20262c');
    gradient.addColorStop(0.5, '#3a444d');
    gradient.addColorStop(1, '#20262c');
    ctx.fillStyle = gradient;
    ctx.fillRect(door.x, top, door.w, door.h + 40);
    ctx.strokeStyle = 'rgba(201, 162, 39, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(door.x, top + 10);
    ctx.lineTo(door.x + door.w, top + 10);
    ctx.stroke();
  }

  renderDebris(ctx, deb) {
    if (deb.state === 'idle') return;
    ctx.save();
    ctx.translate(deb.x, deb.y);
    if (deb.state === 'warn') {
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 22);
      ctx.strokeStyle = `rgba(255, 107, 129, ${0.35 + pulse * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, deb.radius + 6, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.moveTo(0, -8);
      ctx.lineTo(0, 8);
      ctx.stroke();
    } else {
      ctx.fillStyle = COLORS.rockDark;
      ctx.beginPath();
      ctx.arc(0, 0, deb.radius, 0, TAU);
      ctx.fill();
      ctx.fillStyle = COLORS.rock;
      ctx.beginPath();
      ctx.arc(-deb.radius * 0.3, -deb.radius * 0.25, deb.radius * 0.55, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  renderPhantom(ctx, phantom) {
    const alpha = 0.4 * (phantom.life / phantom.maxLife);
    if (alpha <= 0) return;
    const r = QUIET.radius;
    const sway = Math.sin(this.time * 2 + phantom.phase) * r * 0.1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(phantom.x, phantom.y);
    ctx.scale(phantom.vx < 0 ? -1 : 1, 1);
    ctx.fillStyle = COLORS.alienDark;
    ctx.beginPath();
    ctx.moveTo(r * 1.4, sway);
    ctx.quadraticCurveTo(-r * 1.4, -r * 0.7, -r * 3.6, sway);
    ctx.quadraticCurveTo(-r * 1.4, r * 0.7, r * 1.4, sway);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  renderHud(ctx) {
    drawText(ctx, this.title, LOGICAL_WIDTH / 2, 30, {
      size: 18,
      color: COLORS.text,
      glow: COLORS.alienGlow,
      glowBlur: 12,
    });
    const checkpointCount = this.checkpoints.filter((cp) => cp.reached).length;
    drawText(ctx, `CHECKPOINTS ${checkpointCount}/${this.checkpoints.length}`, 24, 44, {
      size: 13,
      color: COLORS.alienGlow,
      align: 'left',
    });
    const barX = 240;
    const barW = 480;
    drawText(ctx, 'NOISE', barX - 12, 40, { size: 12, color: COLORS.textDim, align: 'right' });
    fillRoundRect(ctx, barX, 32, barW, 12, 6, 'rgba(4, 16, 29, 0.7)');
    const pulse = this.noise >= 0.9 ? 0.6 + 0.4 * Math.sin(this.time * 22) : 1;
    fillRoundRect(
      ctx,
      barX,
      32,
      barW * this.noise,
      12,
      6,
      this.noise > 0.66 ? COLORS.danger : COLORS.alienGlow,
    );
    strokeRoundRect(ctx, barX, 32, barW, 12, 6, 'rgba(207, 239, 255, 0.35)', 2);
    if (this.noiseHold > 0) {
      drawText(
        ctx,
        `!! KEEP IT QUIET — ${(QUIET.scareHold - this.noiseHold).toFixed(1)}s`,
        LOGICAL_WIDTH / 2,
        60,
        { size: 14, color: COLORS.danger, glow: COLORS.danger, glowBlur: 10, alpha: pulse },
      );
    }
    if (this.concealed) {
      drawText(ctx, 'CONCEALED — ECHOLOCATION BLOCKED', LOGICAL_WIDTH / 2, 80, {
        size: 13,
        color: COLORS.alienGlow,
      });
    }
    if (this.finale && this.phase === 'play') {
      drawText(ctx, 'IT KNOWS — RUN', LOGICAL_WIDTH / 2, 108, {
        size: 16,
        color: COLORS.danger,
        glow: COLORS.danger,
        glowBlur: 12,
        alpha: 0.6 + 0.4 * Math.sin(this.time * 12),
      });
    }
    if (this.phase2 && this.phase === 'play') {
      drawText(ctx, 'THE LAB IS COLLAPSING — GET TO THE EXIT', LOGICAL_WIDTH / 2, 130, {
        size: 15,
        color: COLORS.danger,
        glow: COLORS.danger,
        glowBlur: 10,
        alpha: 0.7 + 0.3 * Math.sin(this.time * 9),
      });
    }
    if (this.remainNote) {
      drawText(ctx, this.remainNote.text, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 40, {
        size: 13,
        color: COLORS.danger,
        glow: COLORS.danger,
        glowBlur: 8,
        alpha: 0.9,
      });
    }
    if (this.checkpointNote > 0) {
      drawText(ctx, 'CHECKPOINT REACHED', LOGICAL_WIDTH / 2, 96, {
        size: 15,
        color: COLORS.alienGlow,
        glow: COLORS.alienGlow,
        glowBlur: 10,
        alpha: Math.min(1, this.checkpointNote),
      });
    }
    drawText(
      ctx,
      'MOVE SLOWLY — DON’T KNOCK THINGS OVER — REACH THE EXIT',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 11, color: COLORS.textDim, alpha: 0.8 },
    );
  }

  renderScare(ctx) {
    const t = 1 - this.scareTimer / QUIET.scareDuration;
    const kind = this.scareKind ?? 'snap';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.96)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    if (kind === 'sonar') {
      for (let i = 0; i < 3; i += 1) {
        const ring = (t * 2.4 + i * 0.22) % 1;
        ctx.strokeStyle = `rgba(143, 240, 208, ${Math.max(0, 0.5 - ring * 0.5)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, ring * LOGICAL_HEIGHT, 0, TAU);
        ctx.stroke();
      }
    } else if (kind === 'breach') {
      ctx.strokeStyle = `rgba(143, 240, 208, ${0.35 * (1 - t)})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i += 1) {
        const x = (i / 6) * LOGICAL_WIDTH + Math.sin(this.time * 9 + i) * 8;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + Math.cos(this.time * 7 + i) * 26, LOGICAL_HEIGHT);
        ctx.stroke();
      }
    }

    const ease = kind === 'snap' ? Math.min(1, t * 3) : Math.min(1, t * 1.5);
    const offsetY = kind === 'breach' ? LOGICAL_HEIGHT * (1 - ease) * 0.5 : 0;
    this.alien.renderJumpscare(
      ctx,
      LOGICAL_WIDTH / 2 + (this.alien.facing < 0 ? 30 : -30) * (1 - ease),
      LOGICAL_HEIGHT / 2 + offsetY,
      0.6 + ease * 1.9,
      0.06 + ease * 1.5,
      kind,
    );
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1 - t)})`;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    if (t < 0.4) {
      ctx.fillStyle = `rgba(120, 0, 0, ${0.35 * (1 - t / 0.4)})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
  }

  resultsTitle() {
    return this.title;
  }

  resultsHeadline() {
    return this.won ? 'YOU SLIPPED OUT' : 'IT HEARD YOU';
  }

  resultsDetail() {
    return this.won ? 'THE LAB FELL SILENT' : 'SOMETHING TOOK YOU IN THE DARK';
  }
}
