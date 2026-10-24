import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import {
  drawWater,
  drawText,
  fillCircle,
  strokeCircle,
  fillRoundRect,
  strokeRoundRect,
} from '../engine/render.js';
import { clamp, lerp, rand, TAU } from '../engine/math.js';
import { Shark } from '../entities/shark.js';
import { Stingray } from '../entities/stingray.js';
import { Squid } from '../entities/squid.js';
import { ArcticShrimp } from '../entities/arcticshrimp.js';
import { KelpCrab } from '../entities/kelpcrab.js';
import { MoonJelly } from '../entities/moonjelly.js';
import { Nautilus } from '../entities/nautilus.js';
import { Tentacle } from '../entities/tentacle.js';
import { CeilingChunk } from '../entities/ceilingchunk.js';
import { resolveCircleRect } from '../engine/collision.js';
import { drawJoystick, joystickState } from '../engine/joystick.js';
import { ParticleSystem } from '../engine/particles.js';
import { setActiveSkin, setEelAura, setSkinClock, skinByKey, drawSkinAura } from '../engine/skin.js';
import { accessoryByKey, setActiveBodyAccessory, setActiveHeadAccessory } from '../engine/accessory.js';
import { companionByKey, drawCompanion, setActiveCompanion } from '../engine/companion.js';
import { drawTrail, setActiveTrail, trailByKey } from '../engine/trail.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { recordMinigame } from '../engine/progress.js';
import { LABYRINTH_TRACK } from '../assets/tracks.js';
import {
  COLORS,
  COLORSCHOOL_PALETTE,
  CONTROLS,
  CORAL_PALETTE,
  DIFFICULTY,
  LABYRINTH,
  LABYRINTH_KEY,
  LABYRINTH_PALETTE,
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

const IDLE_INPUT = { isDown: () => false, pointer: { down: false, dragX: 0, dragY: 0 } };

const TRAILER_SHOTS = [
  { duration: 2.6, title: 'THE WRECK AWAITS', sub: 'A LABYRINTH SEVEN PARTS DEEP', view: 'start', crew: 1 },
  { duration: 2.6, title: 'ONE TANGLE OF TENTACLES', sub: 'IT NEVER STOPS COMING', view: 'wall', crew: 0 },
  { duration: 2.6, title: 'RAM THE CRACKED SUPPORTS', sub: 'DROP THE CEILING ON THE CHASE', view: 'support', crew: 1 },
  { duration: 2.6, title: 'DUCK THE AMBUSHES', sub: 'THE FLOOR AND WALLS BITE BACK', view: 'ambush', crew: 1 },
  { duration: 2.4, title: 'ARM THE CHECKPOINTS', sub: 'EVERY SECTION SETS YOUR RESPAWN', view: 'checkpoint', crew: 1 },
  { duration: 3, title: 'OUTRUN THE TANGLE', sub: 'NO TIMER — ONLY THE CHASE', view: 'chase', crew: 7 },
  { duration: 3.2, title: 'LABYRINTH', sub: 'MINIGAMES — 2P OR SOLO — PLAYPASS 1', view: 'escape', crew: 7 },
];
const TRAILER_TOTAL = TRAILER_SHOTS.reduce((sum, shot) => sum + shot.duration, 0);

export class LabyrinthScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.wallDelay = 0;
    this.solo = Boolean(params.solo);
    this.difficultyKey = loadJSON(SETTINGS_KEY, {}).difficulty ?? 'normal';
    this.rules = DIFFICULTY[this.difficultyKey] ?? DIFFICULTY.normal;
    const shop = loadJSON(SHOP_KEY, {});
    setEelAura((shop.passes ?? []).includes('playpass5'));
    this.skin = skinByKey(shop.skin);
    this.head = accessoryByKey(shop.head);
    this.back = accessoryByKey(shop.back);
    this.trail = trailByKey(shop.trail);
    this.companion = companionByKey(shop.companion);
    const saved = loadJSON(LABYRINTH_KEY, { part: 1 });
    this.savedPart = clamp(Math.round(saved.part ?? 1), 1, LABYRINTH.parts);
    this.startPart = this.savedPart;
    const savedCreature = DIVE_CREATURES.findIndex((entry) => entry.key === saved.creature);
    this.creatureIndex = savedCreature >= 0 ? savedCreature : 0;
    this.creatureKey = DIVE_CREATURES[this.creatureIndex].key;
    const savedCreature2 = DIVE_CREATURES.findIndex((entry) => entry.key === saved.creature2);
    this.creatureIndex2 = savedCreature2 >= 0 ? savedCreature2 : 0;
    this.creatureKey2 = DIVE_CREATURES[this.creatureIndex2].key;
    if (this.game.music) {
      this.previousTrack = this.game.music.track;
      this.previousHold = this.game.music.hold;
      this.game.music.play(LABYRINTH_TRACK);
      this.game.music.hold = false;
    }
    this.theatre = Boolean(params.ending || params.trailer);
    this.resultsMenu = new SelectList(
      [
        { label: 'PLAY AGAIN', action: 'again' },
        { label: 'MINIGAMES', action: 'minigames' },
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
    if (this.theatre) {
      this.solo = true;
      this.part = 1;
      this.savedPart = 1;
      this.startPart = 1;
      if (params.trailer) {
        this.resetRound();
        this.startTrailer();
      } else {
        this.buildCourse();
        this.startEnding();
      }
      return;
    }
    const pickerItems = [{ label: this.partLabel, action: 'part' }];
    if (this.solo) {
      pickerItems.push({ label: `CREATURE: ${this.creatureLabel}`, action: 'creature1' });
    } else {
      pickerItems.push(
        { label: `P1 CREATURE: ${this.creatureLabel}`, action: 'creature1' },
        { label: `P2 CREATURE: ${this.creatureLabel2}`, action: 'creature2' },
      );
    }
    pickerItems.push({ label: 'BACK', action: 'back' });
    this.selectMenu = new SelectList(pickerItems, {
      glowColor: COLORS.bubble,
      accentColor: COLORS.accent,
      color: COLORS.text,
      spacing: 48,
      fontSize: 22,
      width: 420,
      onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
      onConfirm: (item) => this.chooseSelect(item),
    });
    this.selectMenu.reset();
    this.phase = 'select';
    this.createPreviews();
  }

  get creature() {
    return DIVE_CREATURES[this.creatureIndex];
  }

  get creatureLabel() {
    return this.creature.label;
  }

  get creatureLabel2() {
    return DIVE_CREATURES[this.creatureIndex2].label;
  }

  get partLabel() {
    return `PART: ${this.startPart}/${LABYRINTH.parts}`;
  }

  createPreviews() {
    const make = (index, x) =>
      new DIVE_CREATURES[index].type(x, LOGICAL_HEIGHT * 0.6, {
        controls: CONTROLS.solo,
        pointer: false,
        ...DIVE_CREATURES[index].options,
      });
    this.previews = [make(this.creatureIndex, LOGICAL_WIDTH * (this.solo ? 0.66 : 0.62))];
    if (!this.solo) {
      this.previews.push(make(this.creatureIndex2, LOGICAL_WIDTH * 0.82));
    }
  }

  saveProgress(part = null) {
    const stored = loadJSON(LABYRINTH_KEY, { part: 1 });
    saveJSON(LABYRINTH_KEY, {
      part: part ?? stored.part ?? 1,
      creature: this.creatureKey,
      creature2: this.creatureKey2,
    });
  }

  cyclePart(step) {
    const count = LABYRINTH.parts;
    this.startPart = ((this.startPart - 1 + step + count) % count) + 1;
    this.selectMenu.items[0].label = this.partLabel;
    this.game.audio.tone({ freq: 380 + this.startPart * 40, duration: 0.05, volume: 0.08 });
  }

  cycleCreature(player, step) {
    const count = DIVE_CREATURES.length;
    if (player === 2) {
      this.creatureIndex2 = (this.creatureIndex2 + step + count) % count;
      this.creatureKey2 = DIVE_CREATURES[this.creatureIndex2].key;
      this.selectMenu.items[2].label = `P2 CREATURE: ${this.creatureLabel2}`;
    } else {
      this.creatureIndex = (this.creatureIndex + step + count) % count;
      this.creatureKey = this.creature.key;
      this.selectMenu.items[1].label = this.solo
        ? `CREATURE: ${this.creatureLabel}`
        : `P1 CREATURE: ${this.creatureLabel}`;
    }
    this.createPreviews();
    this.saveProgress();
    this.game.audio.tone({ freq: 480 + Math.max(this.creatureIndex, this.creatureIndex2) * 60, duration: 0.05, volume: 0.08 });
  }

  chooseSelect(item) {
    if (item.action === 'back') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('minigames');
      return;
    }
    this.game.audio.tone({ freq: 400, endFreq: 760, type: 'triangle', duration: 0.18, volume: 0.2 });
    this.saveProgress();
    this.resetRound();
  }

  exit() {
    if (!this.game.music || !this.previousTrack) return;
    this.game.music.play(this.previousTrack);
    this.game.music.hold = this.previousHold;
  }

  buildCourse() {
    const part = this.part ?? 1;
    this.sectionCount =
      LABYRINTH.sections + Math.floor((part - 1) / LABYRINTH.partSectionStep);
    this.worldLength =
      LABYRINTH.startPadding + this.sectionCount * LABYRINTH.sectionLength + LABYRINTH.exitLength;
    this.exitX = this.worldLength - LABYRINTH.exitLength;
    this.cracksPerSection =
      LABYRINTH.cracksPerSection + Math.floor((part - 1) / LABYRINTH.partCrackStep);
    this.wallBurstsPerSection =
      LABYRINTH.wallBurstsPerSection + Math.floor((part - 1) / LABYRINTH.partWallBurstStep);
    this.ceilingsPerSection =
      LABYRINTH.ceilingsPerSection + Math.floor((part - 1) / LABYRINTH.partCrackStep);
    this.tunnelMargin = LABYRINTH.tunnelMargin + (part - 1) * LABYRINTH.partTunnelMargin;
    this.walls = [];
    this.tunnels = [];
    this.gateSpans = [];
    this.checkpoints = [];
    this.debris = [];
    this.weeds = [];
    this.ribs = [];
    this.portholes = [];
    for (let x = 160; x < this.worldLength; x += 310) {
      this.ribs.push({ x: x + rand(-40, 40), width: rand(14, 22) });
    }
    for (let x = 240; x < this.worldLength - 120; x += 470) {
      this.portholes.push({ x: x + rand(-50, 50), y: rand(64, 150) });
    }
    for (let x = 80; x < this.worldLength - 140; x += rand(190, 330)) {
      this.debris.push({
        x,
        y: LOGICAL_HEIGHT - rand(30, 70),
        kind: Math.random() < 0.5 ? 'crate' : 'barrel',
        size: rand(14, 24),
        angle: rand(-0.3, 0.3),
      });
    }
    for (let x = 40; x < this.worldLength - 80; x += rand(130, 240)) {
      this.weeds.push({ x, height: rand(30, 70), phase: rand(0, TAU) });
    }
    const slotMin = 30;
    const slotMax = LOGICAL_HEIGHT - LABYRINTH.laneGap - 30;
    const span = LABYRINTH.sectionLength / LABYRINTH.gatesPerSection;
    for (let section = 0; section < this.sectionCount; section += 1) {
      const start = LABYRINTH.startPadding + section * LABYRINTH.sectionLength;
      this.checkpoints.push({ x: start, active: false });
      for (let gate = 0; gate < LABYRINTH.gatesPerSection; gate += 1) {
        const wallX = start + span * (gate + 0.5) - LABYRINTH.gateWidth / 2;
        const slotY = clamp(
          LABYRINTH.slotBase +
            Math.sin((section * LABYRINTH.gatesPerSection + gate) * 1.7) * LABYRINTH.slotSwing +
            rand(-24, 24),
          slotMin,
          slotMax,
        );
        const tunnelHalf = LABYRINTH.tunnelHeight / 2;
        const spanTop = (section + gate) % 2 === 0 ? -40 : slotY + LABYRINTH.laneGap;
        const spanBottom = (section + gate) % 2 === 0 ? slotY : LOGICAL_HEIGHT + 40;
        let spanTunnelY = null;
        if ((section + gate) % 2 === 0) {
          const top = -40;
          const bottom = slotY;
          const minY = tunnelHalf + this.tunnelMargin;
          const maxY = bottom - tunnelHalf - this.tunnelMargin;
          if (maxY > minY) {
            const tunnelY = rand(minY, maxY);
            spanTunnelY = tunnelY;
            this.walls.push({ x: wallX, y: top, w: LABYRINTH.gateWidth, h: tunnelY - tunnelHalf - top });
            this.walls.push({
              x: wallX,
              y: tunnelY + tunnelHalf,
              w: LABYRINTH.gateWidth,
              h: bottom - tunnelY - tunnelHalf,
            });
            this.tunnels.push({
              x: wallX,
              w: LABYRINTH.gateWidth,
              y: tunnelY,
              height: LABYRINTH.tunnelHeight,
            });
          } else {
            this.walls.push({ x: wallX, y: top, w: LABYRINTH.gateWidth, h: bottom - top });
          }
        } else {
          const top = slotY + LABYRINTH.laneGap;
          const bottom = LOGICAL_HEIGHT + 40;
          const minY = top + tunnelHalf + this.tunnelMargin;
          const maxY = LOGICAL_HEIGHT - tunnelHalf - this.tunnelMargin;
          if (maxY > minY) {
            const tunnelY = rand(minY, maxY);
            spanTunnelY = tunnelY;
            this.walls.push({ x: wallX, y: top, w: LABYRINTH.gateWidth, h: tunnelY - tunnelHalf - top });
            this.walls.push({
              x: wallX,
              y: tunnelY + tunnelHalf,
              w: LABYRINTH.gateWidth,
              h: bottom - tunnelY - tunnelHalf,
            });
            this.tunnels.push({
              x: wallX,
              w: LABYRINTH.gateWidth,
              y: tunnelY,
              height: LABYRINTH.tunnelHeight,
            });
          } else {
            this.walls.push({ x: wallX, y: top, w: LABYRINTH.gateWidth, h: bottom - top });
          }
        }
        this.gateSpans.push({
          x: wallX,
          w: LABYRINTH.gateWidth,
          top: spanTop,
          bottom: spanBottom,
          tunnelY: spanTunnelY,
        });
        if (gate < LABYRINTH.gatesPerSection - 1) {
          const stubX = start + span * (gate + 1) - LABYRINTH.stubWidth / 2;
          const stubHeight = LABYRINTH.stubHeight + rand(0, 20);
          if ((section + gate) % 2 === 0) {
            this.walls.push({ x: stubX, y: -40, w: LABYRINTH.stubWidth, h: stubHeight + 40 });
          } else {
            this.walls.push({
              x: stubX,
              y: LOGICAL_HEIGHT - stubHeight,
              w: LABYRINTH.stubWidth,
              h: stubHeight + 40,
            });
          }
        }
      }
    }
    this.crackSpots = [];
    const floorWalls = this.walls.filter((wall) => wall.y + wall.h > LOGICAL_HEIGHT - 60);
    for (let section = 0; section < this.sectionCount; section += 1) {
      const start = LABYRINTH.startPadding + section * LABYRINTH.sectionLength;
      for (let index = 0; index < this.cracksPerSection; index += 1) {
        let x = start + rand(150, LABYRINTH.sectionLength - 150);
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const candidate = start + rand(150, LABYRINTH.sectionLength - 150);
          if (floorWalls.every((wall) => candidate < wall.x - 110 || candidate > wall.x + wall.w + 110)) {
            x = candidate;
            break;
          }
        }
        this.crackSpots.push(x);
      }
    }
    this.wallBurstSpots = [];
    const tunnelHalf = LABYRINTH.tunnelHeight / 2;
    for (let section = 0; section < this.sectionCount; section += 1) {
      const start = LABYRINTH.startPadding + section * LABYRINTH.sectionLength;
      const spans = this.gateSpans.filter(
        (gate) => gate.x >= start - 40 && gate.x < start + LABYRINTH.sectionLength,
      );
      for (let index = 0; index < this.wallBurstsPerSection; index += 1) {
        if (spans.length === 0) break;
        const gate = spans[Math.floor(Math.random() * spans.length)];
        const minY = Math.max(40, gate.top + 20);
        const maxY = Math.min(LOGICAL_HEIGHT - 40, gate.bottom - 20);
        let y = null;
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const candidate = rand(minY, maxY);
          if (gate.tunnelY !== null && Math.abs(candidate - gate.tunnelY) < tunnelHalf + 16) {
            continue;
          }
          y = candidate;
          break;
        }
        if (y === null) continue;
        const side = Math.random() < 0.5 ? -1 : 1;
        this.wallBurstSpots.push({
          x: side < 0 ? gate.x : gate.x + gate.w,
          y,
          angle: side < 0 ? Math.PI : 0,
        });
      }
    }
    this.ceilingSpots = [];
    const ceilingBlocked = this.gateSpans.filter((gate) => gate.top <= 0);
    for (let section = 0; section < this.sectionCount; section += 1) {
      const start = LABYRINTH.startPadding + section * LABYRINTH.sectionLength;
      for (let index = 0; index < this.ceilingsPerSection; index += 1) {
        let x = start + rand(150, LABYRINTH.sectionLength - 150);
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const candidate = start + rand(150, LABYRINTH.sectionLength - 150);
          if (
            ceilingBlocked.every(
              (gate) => candidate < gate.x - 150 || candidate > gate.x + gate.w + 150,
            )
          ) {
            x = candidate;
            break;
          }
        }
        this.ceilingSpots.push(x);
      }
    }
    this.supportSpots = [];
    this.corals = [];
    for (let section = 0; section < this.sectionCount; section += 1) {
      const start = LABYRINTH.startPadding + section * LABYRINTH.sectionLength;
      for (let index = 0; index < LABYRINTH.supportsPerSection; index += 1) {
        let x = start + rand(260, LABYRINTH.sectionLength - 260);
        for (let attempt = 0; attempt < 16; attempt += 1) {
          const candidate = start + rand(260, LABYRINTH.sectionLength - 260);
          if (this.walls.every((wall) => candidate < wall.x - 150 || candidate > wall.x + wall.w + 150)) {
            x = candidate;
            break;
          }
        }
        this.supportSpots.push(x);
      }
      for (let index = 0; index < LABYRINTH.coralsPerSection; index += 1) {
        let x = start + rand(140, LABYRINTH.sectionLength - 140);
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const candidate = start + rand(140, LABYRINTH.sectionLength - 140);
          if (floorWalls.every((wall) => candidate < wall.x - 90 || candidate > wall.x + wall.w + 90)) {
            x = candidate;
            break;
          }
        }
        const branches = Array.from({ length: 5 }, (_, branch) => {
          const height = rand(26, 54);
          return {
            x1: (branch - 2) * rand(7, 13),
            y1: -height * 0.8,
            x2: (branch - 2) * rand(14, 24),
            y2: -height * rand(1.05, 1.35),
            snapped: Math.random() < 0.45,
          };
        });
        this.corals.push({
          x,
          lean: rand(-0.22, 0.22),
          phase: rand(0, TAU),
          lineWidth: rand(2.2, 3.6),
          color: CORAL_PALETTE[Math.floor(rand(0, CORAL_PALETTE.length))],
          branches,
        });
      }
    }
  }

  resetRound() {
    this.part = this.startPart ?? 1;
    this.resumed = this.part > 1 && this.part === this.savedPart;
    this.buildCourse();
    const spawn = (creature, y, options) =>
      new creature.type(LABYRINTH.spawnX, y, {
        maxX: this.worldLength,
        ...creature.options,
        ...options,
      });
    this.players = [
      spawn(this.creature, LOGICAL_HEIGHT * (this.solo ? 0.5 : 0.42), {
        controls: CONTROLS.p1,
        pointer: true,
      }),
    ];
    if (!this.solo) {
      this.players.push(
        spawn(DIVE_CREATURES[this.creatureIndex2], LOGICAL_HEIGHT * 0.62, {
          controls: CONTROLS.p2,
          pointer: false,
        }),
      );
    }
    this.out = this.players.map(() => false);
    this.setupPart();
  }

  advancePart() {
    this.part += 1;
    this.buildCourse();
    this.setupPart();
  }

  setupPart() {
    this.phase = 'play';
    this.elapsed = 0;
    this.banner = this.resumed
      ? `RESUMING PART ${this.part}/${LABYRINTH.parts}`
      : `PART ${this.part}/${LABYRINTH.parts} — DEEPER INTO THE WRECK`;
    this.resumed = false;
    this.bannerTimer = 2.6;
    this.flash = 0.6;
    this.shake = 0;
    this.won = false;
    this.reward = 0;
    this.particles = new ParticleSystem();
    this.wallX = -LABYRINTH.wallStart;
    this.wallDelay = LABYRINTH.wallDelay;
    this.cameraX = 0;
    this.checkpointIndex = this.players.map(() => 0);
    this.grabbed = this.players.map(() => null);
    this.escaped = this.players.map(() => false);
    this.grabs = this.players.map((_, index) => (this.out[index] ? 0 : LABYRINTH.grabs));
    const grabberCount =
      LABYRINTH.grabberCount + Math.floor((this.part - 1) / LABYRINTH.partGrabberStep);
    const warnScale = Math.pow(LABYRINTH.partWarnScale, this.part - 1);
    const cooldownScale = Math.pow(LABYRINTH.partCooldownScale, this.part - 1);
    this.tentacles = Array.from(
      { length: grabberCount },
      (_, index) =>
        new Tentacle(((index + 0.5) * LOGICAL_HEIGHT) / grabberCount, index, {
          lengthScale: rand(LABYRINTH.grabberLengthMin, LABYRINTH.grabberLengthMax),
        }),
    );
    this.packArms = Array.from({ length: LABYRINTH.packArms }, (_, index) => {
      const lane = ((index + 0.5) * LOGICAL_HEIGHT) / LABYRINTH.packArms + rand(-9, 9);
      return new Tentacle(lane, index, {
        pack: true,
        lengthScale: rand(LABYRINTH.packLengthMin, LABYRINTH.packLengthMax),
        widthScale: rand(LABYRINTH.packWidthMin, LABYRINTH.packWidthMax) *
          clamp(1.2 - rand(LABYRINTH.packLengthMin, LABYRINTH.packLengthMax) * 0.25, 0.8, 1.1),
        anchorOffset: rand(-26, 6),
        writhe: LABYRINTH.packWrithe,
        writheSpeed: LABYRINTH.packWritheSpeed,
      });
    });
    this.cracks = this.crackSpots.map((x, index) => ({
      x,
      y: null,
      state: 'idle',
      timer: rand(0.5, 2),
      triggerX: LABYRINTH.crackTrigger,
      triggerY: null,
      warn: LABYRINTH.crackWarn * warnScale,
      cooldown: LABYRINTH.crackCooldown * cooldownScale,
      lines: Array.from({ length: 7 }, (_, line) => ({
        angle: -Math.PI + (line / 6) * Math.PI + rand(-0.14, 0.14),
        length: rand(26, 62),
        kink: rand(-0.45, 0.45),
      })),
      arms: Array.from({ length: LABYRINTH.crackArms }, (_, arm) => {
        const spread = LABYRINTH.crackArms > 1 ? arm / (LABYRINTH.crackArms - 1) - 0.5 : 0;
        return new Tentacle(LOGICAL_HEIGHT - LABYRINTH.floorHeight + 12, index * 10 + arm, {
          burst: true,
          angle: -Math.PI / 2 + spread * 0.7,
          anchorOffset: spread * 58,
          lengthScale: LABYRINTH.crackLengthScale * rand(0.7, 1.15),
          widthScale: LABYRINTH.crackWidthScale * rand(0.8, 1.05),
        });
      }),
    }));
    this.wallBursts = this.wallBurstSpots.map((spot, index) => ({
      x: spot.x,
      y: spot.y,
      angle: spot.angle,
      state: 'idle',
      timer: rand(0.5, 2),
      triggerX: LABYRINTH.wallBurstTriggerX,
      triggerY: LABYRINTH.wallBurstTriggerY,
      warn: LABYRINTH.wallBurstWarn * warnScale,
      cooldown: LABYRINTH.wallBurstCooldown * cooldownScale,
      arms: [
        new Tentacle(spot.y, index, {
          burst: true,
          angle: spot.angle,
          lengthScale: LABYRINTH.wallBurstLengthScale,
          widthScale: LABYRINTH.crackWidthScale,
        }),
      ],
    }));
    this.ambushes = [...this.cracks, ...this.wallBursts];
    this.ceilings = this.ceilingSpots.map((x) => ({
      x,
      state: 'idle',
      timer: rand(0.5, 2),
      warn: LABYRINTH.ceilingWarn * warnScale,
      cooldown: LABYRINTH.ceilingCooldown * cooldownScale,
      chunk: null,
      cracks: Array.from({ length: 5 }, (_, line) => ({
        offset: rand(-34, 34),
        drop: rand(14, 42),
        length: rand(8, 20),
        kink: rand(-0.6, 0.6),
      })),
    }));
    this.stunned = this.players.map(() => 0);
    this.supports = this.supportSpots.map((x, index) => ({
      x,
      broken: false,
      phase: rand(0, TAU),
      crackSeed: index * 1.7,
    }));
    this.grabPickups = this.makeClump(420, rand(150, LOGICAL_HEIGHT - 220), 0);
    this.grabPickupClumpId = 1;
    this.grabPickupTimer = LABYRINTH.grabPickupInterval * 0.6;
    this.popups = [];
    this.collapseChunks = [];
    this.wallStun = 0;
    this.schools = [];
    this.schoolTimer = rand(LABYRINTH.schoolMin, LABYRINTH.schoolMax);
    this.squid = {
      x: LABYRINTH.startPadding + 300,
      gaze: null,
      blink: 0,
      blinkHold: 0,
      blinkTimer: rand(LABYRINTH.squidBlinkMin, LABYRINTH.squidBlinkMax),
    };
    this.players.forEach((player, index) => {
      player.maxX = this.worldLength;
      if (this.out[index]) return;
      player.x = LABYRINTH.spawnX;
      player.y = LOGICAL_HEIGHT * (this.solo || index === 0 ? (this.solo ? 0.5 : 0.42) : 0.62);
      player.vx = 0;
      player.vy = 0;
      player.invulnerable = LABYRINTH.respawnInvulnerable;
    });
    this.resultsMenu.reset();
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('minigames');
  }

  liveTargets() {
    return this.players.filter(
      (_, index) => !this.out[index] && !this.escaped[index] && !this.grabbed[index],
    );
  }

  grabSamples(tentacle) {
    return [0.7, 0.85, 1].map((t) => tentacle.pointAt(t));
  }

  activateCheckpoint(index) {
    const checkpoint = this.checkpoints[index];
    if (checkpoint.active) return;
    checkpoint.active = true;
    this.wallX = Math.min(this.wallX, checkpoint.x - LABYRINTH.mercyPush);
    this.banner = `CHECKPOINT ${index + 1} — SECTION ${index + 1}`;
    this.bannerTimer = 2.2;
    this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.14, volume: 0.2 });
    this.game.audio.tone({ freq: 784, type: 'triangle', duration: 0.2, volume: 0.2, delay: 0.1 });
  }

  startGrab(index, tentacle) {
    if (this.grabbed[index] || this.out[index] || this.escaped[index]) return;
    this.grabs[index] -= 1;
    this.grabbed[index] = { tentacle, timer: LABYRINTH.grabHold };
    this.flash = 0.6;
    this.shake = 0.5;
    this.banner =
      this.grabs[index] > 0 ? `GRABBED! ${this.grabs[index]} LEFT` : 'GRABBED — HOLD ON!';
    this.bannerTimer = 1.6;
    this.particles.burst(this.players[index].x, this.players[index].y, {
      count: 14,
      speed: 200,
      life: 0.6,
      colors: [COLORS.tentacle, COLORS.tentaclePale, '#ffffff'],
      buoyancy: -20,
    });
    this.game.audio.tone({ freq: 180, endFreq: 70, type: 'sawtooth', duration: 0.35, volume: 0.3 });
  }

  updateGrab(index, dt) {
    const grab = this.grabbed[index];
    const player = this.players[index];
    grab.timer -= dt;
    const anchor = grab.tentacle ? grab.tentacle.tip() : { x: this.wallX + 26, y: player.y };
    player.x = lerp(player.x, anchor.x - 8, 1 - Math.exp(-5 * dt));
    player.y = lerp(player.y, anchor.y, 1 - Math.exp(-5 * dt)) + Math.sin(this.time * 30) * 1.6;
    player.vx = 0;
    player.vy = 0;
    if (grab.timer <= 0) {
      if (grab.tentacle) grab.tentacle.cooldown = LABYRINTH.grabberCooldown;
      this.grabbed[index] = null;
      if (this.grabs[index] > 0) {
        this.respawn(index);
      } else {
        this.out[index] = true;
        player.x = this.wallX - 40;
        this.checkResults();
      }
    }
  }

  respawn(index) {
    const player = this.players[index];
    const checkpointX =
      this.checkpointIndex[index] > 0 ? this.checkpoints[this.checkpointIndex[index]].x : 0;
    player.x = Math.max(LABYRINTH.spawnX, checkpointX + LABYRINTH.respawnOffset);
    player.y = LOGICAL_HEIGHT / 2;
    player.vx = 0;
    player.vy = 0;
    player.invulnerable = LABYRINTH.respawnInvulnerable;
    this.wallX = Math.min(this.wallX, checkpointX - LABYRINTH.mercyPush);
    this.banner = 'BACK TO THE CHECKPOINT';
    this.bannerTimer = 1.4;
    this.game.audio.tone({
      freq: 320,
      endFreq: 620,
      type: 'triangle',
      duration: 0.2,
      volume: 0.22,
    });
  }

  escape(index) {
    const player = this.players[index];
    this.escaped[index] = true;
    player.x = this.exitX + 60;
    player.y = LOGICAL_HEIGHT / 2;
    player.vx = 0;
    player.vy = 0;
    this.particles.burst(player.x, player.y, {
      count: 20,
      speed: 240,
      life: 0.8,
      colors: [COLORS.bubble, COLORS.accent, '#ffffff'],
      buoyancy: -40,
    });
    this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.18, volume: 0.24 });
    this.game.audio.tone({ freq: 784, type: 'triangle', duration: 0.26, volume: 0.24, delay: 0.14 });
    this.checkResults();
  }

  checkResults() {
    if (this.players.some((_, index) => this.out[index])) {
      this.finish();
      return;
    }
    if (!this.players.every((_, index) => this.escaped[index])) return;
    if (this.part >= LABYRINTH.parts) {
      this.finish();
      return;
    }
    this.advancePart();
  }

  finish() {
    this.won = this.players.every((_, index) => !this.out[index] && this.escaped[index]);
    this.reward = recordMinigame(this.won);
    if (this.won) {
      this.startPart = 1;
      this.saveProgress(1);
    } else if (this.part > 1) {
      const saved = loadJSON(LABYRINTH_KEY, { part: 1 });
      const reached = Math.max(saved.part ?? 1, this.part);
      this.startPart = Math.max(this.startPart ?? 1, this.part);
      this.saveProgress(reached);
    }
    this.resultsMenu.reset();
    if (this.won) {
      this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.22, volume: 0.24 });
      this.game.audio.tone({ freq: 659, type: 'triangle', duration: 0.22, volume: 0.24, delay: 0.16 });
      this.game.audio.tone({ freq: 784, type: 'triangle', duration: 0.34, volume: 0.24, delay: 0.32 });
      this.startEnding();
    } else {
      this.phase = 'results';
      this.game.audio.tone({ freq: 220, endFreq: 110, type: 'sawtooth', duration: 0.4, volume: 0.26 });
    }
  }

  startEnding() {
    this.phase = 'ending';
    this.endingTimer = 0;
    this.endingEvents = new Set();
    this.cameraX = Math.max(0, this.worldLength - LOGICAL_WIDTH);
    this.megasquid = {
      x: LOGICAL_WIDTH / 2,
      y: -170,
      rotation: 0,
      sink: 0,
      blink: 0,
    };
    this.endingDebris = Array.from({ length: 16 }, () => ({
      x: rand(40, LOGICAL_WIDTH - 40),
      y: rand(-90, 120),
      size: rand(9, 24),
      spin: rand(-3.2, 3.2),
      rotation: rand(0, TAU),
      fallSpeed: rand(26, 88),
      drift: rand(-26, 26),
    }));
    this.escapees = DIVE_CREATURES.map((creature, index) => {
      const entity = new creature.type(0, 0, {
        controls: CONTROLS.solo,
        pointer: false,
        ...creature.options,
      });
      return {
        label: creature.label,
        entity,
        startX: -220 - index * 96,
        travel: 0,
        speed: rand(200, 300),
        lane: 96 + index * 50 + rand(-10, 10),
        phase: rand(0, TAU),
      };
    });
    this.particles = new ParticleSystem();
  }

  startTrailer() {
    this.phase = 'trailer';
    this.wallDelay = 0;
    this.trailerTime = 0;
    this.trailerShot = -1;
    this.trailerShotElapsed = 0;
    this.trailerProgress = 0;
    this.trailerChaseX = 0;
    this.trailerFlash = 0;
    this.cameraX = 0;
    this.popups = [];
    this.grabPickups = [];
    this.particles = new ParticleSystem();
    this.trailerCrew = DIVE_CREATURES.map((creature, index) => {
      const entity = new creature.type(0, 0, {
        controls: CONTROLS.solo,
        pointer: false,
        ...creature.options,
      });
      return { entity, phase: rand(0, TAU), lane: 112 + index * 52 };
    });
    this.trailerCrew.forEach((member, index) => {
      member.entity.x = -400 - index * 80;
      member.entity.y = member.lane;
    });
    for (const ambush of this.ambushes) {
      ambush.state = 'idle';
      ambush.timer = 999;
      for (const arm of ambush.arms) {
        arm.burstTimer = 0;
        arm.reach = 0;
      }
    }
    for (const ceiling of this.ceilings) {
      ceiling.state = 'idle';
      ceiling.timer = 999;
      ceiling.chunk = null;
    }
    this.players.forEach((player, index) => {
      player.x = -700 - index * 120;
    });
    this.game.audio.tone({ freq: 55, endFreq: 30, type: 'sawtooth', duration: 1, volume: 0.3 });
  }

  applyShot(index) {
    const shot = TRAILER_SHOTS[index];
    this.trailerFlash = 0.22;
    this.shake = Math.max(this.shake, 0.5);
    this.game.audio.tone({ freq: 70, endFreq: 40, type: 'sawtooth', duration: 0.5, volume: 0.3 });
    if (shot.view === 'wall') {
      this.wallX = 1500;
    } else if (shot.view === 'support') {
      this.wallX = (this.supports[0]?.x ?? 900) - 900;
    } else if (shot.view === 'ambush') {
      const crack = this.cracks[0];
      this.wallX = (crack?.x ?? 900) - 900;
      if (crack) for (const arm of crack.arms) arm.burst();
      for (const burst of this.wallBursts.slice(0, 2)) {
        for (const arm of burst.arms) arm.burst();
      }
      const ceiling = this.ceilings[0];
      if (ceiling) ceiling.chunk = new CeilingChunk(ceiling.x, 30, 1);
      this.shake = 1;
    } else if (shot.view === 'checkpoint') {
      const checkpoint = this.checkpoints[1] ?? this.checkpoints[0];
      if (checkpoint) checkpoint.active = true;
      this.wallX = (checkpoint?.x ?? 1600) - 1000;
    } else if (shot.view === 'chase') {
      this.trailerChaseX = Math.max(this.checkpoints[2]?.x ?? 2400, 2400);
      this.wallX = this.trailerChaseX - 430;
    } else if (shot.view === 'escape') {
      this.trailerChaseX = this.exitX - 520;
      this.wallX = this.trailerChaseX - 900;
      this.game.audio.tone({ freq: 392, type: 'triangle', duration: 0.3, volume: 0.24 });
      this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.3, volume: 0.24, delay: 0.2 });
      this.game.audio.tone({ freq: 784, type: 'triangle', duration: 0.5, volume: 0.24, delay: 0.4 });
    } else {
      this.wallX = -200;
      this.cameraX = 260;
    }
  }

  updateTrailer(dt, input) {
    this.trailerTime += dt;
    this.trailerFlash = Math.max(0, this.trailerFlash - dt * 1.4);
    this.shake = Math.max(0, this.shake - dt * 1.2);
    let index = 0;
    let acc = 0;
    while (
      index < TRAILER_SHOTS.length - 1 &&
      this.trailerTime >= acc + TRAILER_SHOTS[index].duration
    ) {
      acc += TRAILER_SHOTS[index].duration;
      index += 1;
    }
    if (index !== this.trailerShot) {
      this.trailerShot = index;
      this.applyShot(index);
    }
    const shot = TRAILER_SHOTS[index];
    this.trailerShotElapsed = this.trailerTime - acc;
    this.trailerProgress = clamp(this.trailerShotElapsed / shot.duration, 0, 1);

    let camera = 0;
    if (shot.view === 'start') {
      camera = 260 + this.trailerProgress * 220;
    } else if (shot.view === 'wall') {
      camera = this.wallX - 300;
    } else if (shot.view === 'support') {
      camera = (this.supports[0]?.x ?? 900) - 520;
    } else if (shot.view === 'ambush') {
      camera = (this.cracks[0]?.x ?? 900) - 520;
    } else if (shot.view === 'checkpoint') {
      camera = (this.checkpoints[1]?.x ?? 1600) - 520;
    } else if (shot.view === 'chase') {
      this.trailerChaseX += 300 * dt;
      camera = this.trailerChaseX - 420;
      this.wallX = this.trailerChaseX - 430;
    } else if (shot.view === 'escape') {
      this.trailerChaseX += 260 * dt;
      camera = this.trailerChaseX - 380;
    }
    this.cameraX = clamp(camera, 0, Math.max(0, this.worldLength - LOGICAL_WIDTH));

    const baseX =
      shot.view === 'chase' || shot.view === 'escape'
        ? this.trailerChaseX
        : shot.view === 'support'
          ? (this.supports[0]?.x ?? 900) - 120
          : shot.view === 'ambush'
            ? (this.cracks[0]?.x ?? 900) + 90
            : shot.view === 'checkpoint'
              ? (this.checkpoints[1]?.x ?? 1600) + 90
              : 400 + this.trailerProgress * 160;
    this.trailerCrew.forEach((member, index2) => {
      member.entity.update(dt, IDLE_INPUT);
      if (index2 < shot.crew) {
        member.entity.x = baseX - index2 * 74;
        member.entity.y = member.lane + Math.sin(this.time * 2.3 + member.phase) * 9;
        member.entity.heading = 0;
      } else {
        member.entity.x = -500 - index2 * 90;
        member.entity.y = member.lane;
      }
    });
    const lead = shot.crew > 0 ? this.trailerCrew[0].entity : null;

    this.updateSchools(dt);
    for (const arm of this.packArms) arm.update(dt, this.wallX, null);
    for (const tentacle of this.tentacles) tentacle.update(dt, this.wallX, lead);
    for (const ambush of this.ambushes) {
      for (const arm of ambush.arms) arm.update(dt, ambush.x, null);
    }
    for (const ceiling of this.ceilings) {
      if (ceiling.chunk) ceiling.chunk.update(dt);
    }
    this.squid.gaze = lead ? { x: lead.x, y: lead.y } : null;
    this.squid.blink = 0;
    this.particles.update(dt);

    if (input.wasPressed('confirm') || input.wasPressed('back') || this.trailerTime >= TRAILER_TOTAL) {
      this.game.changeScene('theatre');
    }
  }

  updateEnding(dt, input) {
    this.endingTimer += dt;
    const t = this.endingTimer;
    this.shake = Math.max(0, this.shake - dt * 0.9);
    const squid = this.megasquid;
    squid.sink = clamp((t - 0.9) / 3.4, 0, 1);
    squid.y = -170 + (LOGICAL_HEIGHT + 420) * squid.sink * squid.sink;
    squid.x = LOGICAL_WIDTH / 2 + Math.sin(t * 0.8) * 28;
    squid.rotation = Math.sin(t * 1.3) * 0.1 - squid.sink * 0.4;
    squid.blink = clamp((t - 5.6) / 1.4, 0, 1);
    if (t > 1.4 && !this.endingEvents.has('impact')) {
      this.endingEvents.add('impact');
      this.shake = 1;
      this.particles.burst(LOGICAL_WIDTH / 2, 320, {
        count: 44,
        speed: 360,
        life: 1.2,
        colors: [COLORS.tentacleDark, COLORS.wreckWood, COLORS.sandDark],
        buoyancy: -60,
      });
      this.game.audio.tone({ freq: 58, endFreq: 34, type: 'sawtooth', duration: 1.1, volume: 0.36 });
    }
    if (t > 2.8 && !this.endingEvents.has('crumble')) {
      this.endingEvents.add('crumble');
      this.game.audio.tone({ freq: 130, endFreq: 60, type: 'sawtooth', duration: 0.8, volume: 0.3 });
    }
    if (t > 5.4 && !this.endingEvents.has('surface')) {
      this.endingEvents.add('surface');
      this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.24, volume: 0.22 });
      this.game.audio.tone({ freq: 784, type: 'triangle', duration: 0.34, volume: 0.22, delay: 0.18 });
    }
    for (const piece of this.endingDebris) {
      piece.y += piece.fallSpeed * dt;
      piece.x += piece.drift * dt;
      piece.rotation += piece.spin * dt;
    }
    for (const escapee of this.escapees) {
      escapee.travel += escapee.speed * dt;
      escapee.entity.update(dt, IDLE_INPUT);
      escapee.entity.x = escapee.startX + escapee.travel;
      escapee.entity.y = escapee.lane + Math.sin(this.time * 2.1 + escapee.phase) * 9;
    }
    this.particles.update(dt);
    if (input.wasPressed('confirm') || input.wasPressed('back') || t >= LABYRINTH.endingDuration) {
      if (this.theatre) {
        this.game.changeScene('theatre');
        return;
      }
      this.phase = 'results';
      this.resultsMenu.reset();
    }
  }

  updateCamera(dt) {
    let focus = this.players.filter((_, index) => !this.out[index] && !this.escaped[index]);
    if (focus.length === 0) focus = this.players.filter((_, index) => !this.out[index]);
    let center = LOGICAL_WIDTH / 2;
    if (focus.length === 1) center = focus[0].x;
    else if (focus.length > 1) {
      center =
        (Math.min(...focus.map((player) => player.x)) +
          Math.max(...focus.map((player) => player.x))) /
        2;
    }
    const target = clamp(center - LOGICAL_WIDTH / 2, 0, this.worldLength - LOGICAL_WIDTH);
    this.cameraX = lerp(this.cameraX, target, 1 - Math.exp(-5 * dt));
  }

  updateAmbush(ambush, dt, targets) {
    for (const arm of ambush.arms) arm.update(dt, ambush.x, null);
    let near = false;
    for (const player of targets) {
      if (Math.abs(player.x - ambush.x) >= ambush.triggerX) continue;
      if (ambush.triggerY !== null && Math.abs(player.y - ambush.y) >= ambush.triggerY) continue;
      near = true;
      break;
    }
    if (ambush.state === 'idle') {
      ambush.timer = Math.max(0, ambush.timer - dt);
      if (near && ambush.timer <= 0) {
        ambush.state = 'warn';
        ambush.timer = ambush.warn;
        this.game.audio.tone({
          freq: 90,
          endFreq: 60,
          type: 'sawtooth',
          duration: 0.4,
          volume: 0.16,
        });
      }
      return;
    }
    if (ambush.state === 'warn') {
      ambush.timer -= dt;
      if (ambush.timer <= 0) {
        ambush.state = 'burst';
        for (const arm of ambush.arms) arm.burst();
        this.shake = Math.max(this.shake, 0.3);
        this.particles.burst(
          ambush.x,
          ambush.y === null ? LOGICAL_HEIGHT - LABYRINTH.floorHeight + 20 : ambush.y,
          {
            count: 16,
            speed: 240,
            life: 0.7,
            colors: [COLORS.wreckWood, COLORS.tentacleDark, COLORS.sandDark],
            buoyancy: -180,
          },
        );
        this.game.audio.tone({
          freq: 150,
          endFreq: 65,
          type: 'sawtooth',
          duration: 0.5,
          volume: 0.3,
        });
      }
      return;
    }
    if (ambush.arms.every((arm) => arm.burstTimer <= 0 && arm.reach <= 0.02)) {
      ambush.state = 'idle';
      ambush.timer = ambush.cooldown;
    }
  }

  updateCeiling(ceiling, dt, targets) {
    if (ceiling.chunk) {
      ceiling.chunk.update(dt);
      this.players.forEach((player, index) => {
        if (this.out[index] || this.escaped[index] || this.stunned[index] > 0) return;
        if (player.invulnerable > 0 || this.grabbed[index]) return;
        if (
          Math.hypot(player.x - ceiling.chunk.x, player.y - ceiling.chunk.y) <
          player.radius + ceiling.chunk.radius
        ) {
          this.stagger(index);
          ceiling.chunk.kill();
        }
      });
      if (!ceiling.chunk.alive) {
        this.particles.burst(
          ceiling.chunk.x,
          Math.min(ceiling.chunk.y, LOGICAL_HEIGHT - 24),
          {
            count: 12,
            speed: 190,
            life: 0.6,
            colors: [COLORS.wreckWood, COLORS.wreckWoodDark, COLORS.sandDark],
            buoyancy: -60,
          },
        );
        ceiling.chunk = null;
        ceiling.state = 'idle';
        ceiling.timer = ceiling.cooldown;
      }
      return;
    }
    if (ceiling.state === 'idle') {
      ceiling.timer = Math.max(0, ceiling.timer - dt);
      if (ceiling.timer > 0) return;
      let under = false;
      for (const player of targets) {
        if (Math.abs(player.x - ceiling.x) < LABYRINTH.ceilingTriggerX) {
          under = true;
          break;
        }
      }
      if (!under) return;
      ceiling.state = 'warn';
      ceiling.timer = ceiling.warn;
      this.game.audio.tone({
        freq: 120,
        endFreq: 80,
        type: 'triangle',
        duration: 0.35,
        volume: 0.14,
      });
      return;
    }
    if (ceiling.state === 'warn') {
      ceiling.timer -= dt;
      if (ceiling.timer <= 0) {
        ceiling.state = 'falling';
        ceiling.chunk = new CeilingChunk(
          ceiling.x,
          30,
          1 + (this.part - 1) * LABYRINTH.partFallRamp,
        );
        this.game.audio.tone({
          freq: 90,
          endFreq: 50,
          type: 'sawtooth',
          duration: 0.4,
          volume: 0.26,
        });
      }
    }
  }

  stagger(index) {
    const player = this.players[index];
    this.stunned[index] = LABYRINTH.ceilingStun;
    player.vx = rand(-1, 1) * LABYRINTH.ceilingKnockback;
    player.vy = rand(0.3, 1) * LABYRINTH.ceilingKnockback;
    this.flash = Math.max(this.flash, 0.45);
    this.shake = Math.max(this.shake, 0.45);
    this.particles.burst(player.x, player.y - 10, {
      count: 14,
      speed: 220,
      life: 0.6,
      colors: [COLORS.wreckWood, COLORS.sandDark, '#ffffff'],
      buoyancy: -40,
    });
    this.game.audio.tone({
      freq: 140,
      endFreq: 70,
      type: 'square',
      duration: 0.3,
      volume: 0.3,
    });
  }

  supportRect(support) {
    return {
      x: support.x - LABYRINTH.supportWidth / 2,
      y: 0,
      w: LABYRINTH.supportWidth,
      h: LOGICAL_HEIGHT,
    };
  }

  collectPickups(index) {
    const player = this.players[index];
    for (const pickup of this.grabPickups) {
      if (pickup.taken) continue;
      const y = pickup.y + Math.sin(this.time * 1.6 + pickup.phase) * LABYRINTH.grabPickupFloat;
      if (
        Math.hypot(player.x - pickup.x, player.y - y) >=
        player.radius + LABYRINTH.grabPickupRadius
      ) {
        continue;
      }
      pickup.taken = true;
      this.grabs[index] += 1;
      this.popups.push({
        x: pickup.x,
        y,
        timer: 1.1,
        text: '+1 GRAB',
      });
      this.game.audio.tone({
        freq: 660,
        endFreq: 990,
        type: 'triangle',
        duration: 0.12,
        volume: 0.18,
      });
      this.particles.burst(pickup.x, y, {
        count: 10,
        speed: 150,
        life: 0.5,
        colors: [COLORS.bubble, COLORS.accent, '#ffffff'],
        buoyancy: -40,
      });
    }
    this.grabPickups = this.grabPickups.filter((pickup) => !pickup.taken);
  }

  makeClump(x, y, clump) {
    const count = Math.round(rand(LABYRINTH.grabPickupClumpMin, LABYRINTH.grabPickupClumpMax));
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * TAU + rand(-0.3, 0.3);
      const distance = index === 0 ? 0 : rand(10, LABYRINTH.grabPickupClumpSpread);
      return {
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        phase: rand(0, TAU),
        clump,
        taken: false,
      };
    });
  }

  updatePickups(dt) {
    this.grabPickupTimer -= dt;
    if (this.grabPickupTimer > 0) return;
    const clumps = new Set(this.grabPickups.map((pickup) => pickup.clump)).size;
    if (clumps >= LABYRINTH.grabPickupActive) return;
    this.grabPickupTimer = LABYRINTH.grabPickupInterval * rand(0.7, 1.3);
    const live = this.liveTargets();
    const leader =
      live.length > 0 ? Math.max(...live.map((player) => player.x)) : this.wallX + 300;
    const min = clamp(leader + LABYRINTH.grabPickupLeadMin, 120, this.worldLength - 120);
    const max = clamp(leader + LABYRINTH.grabPickupLeadMax, 120, this.worldLength - 120);
    let x = rand(min, max);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = rand(min, max);
      if (
        this.walls.every(
          (wall) => candidate < wall.x - 100 || candidate > wall.x + wall.w + 100,
        )
      ) {
        x = candidate;
        break;
      }
    }
    this.grabPickups.push(
      ...this.makeClump(
        x,
        rand(120, LOGICAL_HEIGHT - 160),
        this.grabPickupClumpId,
      ),
    );
    this.grabPickupClumpId += 1;
  }

  breakSupport(support) {
    if (support.broken) return;
    support.broken = true;
    this.wallX -= LABYRINTH.supportPush;
    this.wallStun = Math.max(this.wallStun, LABYRINTH.supportStun);
    this.shake = Math.max(this.shake, 0.7);
    this.flash = Math.max(this.flash, 0.45);
    this.banner = 'SUPPORT DOWN — THE COLLAPSE CRUSHES THE TANGLE';
    this.bannerTimer = 2.2;
    this.particles.burst(support.x, LOGICAL_HEIGHT / 2, {
      count: 22,
      speed: 280,
      life: 0.8,
      colors: [COLORS.wreckWood, COLORS.wreckWoodDark, COLORS.sandDark],
      buoyancy: -80,
    });
    for (let index = 0; index < 3; index += 1) {
      this.collapseChunks.push(
        new CeilingChunk(this.wallX + rand(-50, 90), -60 - index * 40, 1.5, rand(2.1, 3.2)),
      );
    }
    this.particles.burst(this.wallX + 40, 200, {
      count: 26,
      speed: 320,
      life: 0.9,
      colors: [COLORS.tentacleDark, COLORS.wreckWood, COLORS.sandDark],
      buoyancy: -60,
    });
    this.game.audio.tone({
      freq: 70,
      endFreq: 40,
      type: 'sawtooth',
      duration: 0.8,
      volume: 0.34,
    });
    this.game.audio.tone({
      freq: 180,
      endFreq: 90,
      type: 'square',
      duration: 0.5,
      volume: 0.24,
      delay: 0.1,
    });
  }

  updateSchools(dt) {
    this.schoolTimer -= dt;
    if (this.schoolTimer <= 0) {
      this.schoolTimer = rand(LABYRINTH.schoolMin, LABYRINTH.schoolMax);
      const direction = Math.random() < 0.5 ? -1 : 1;
      this.schools.push({
        x: direction > 0 ? this.cameraX - 120 : this.cameraX + LOGICAL_WIDTH + 120,
        y: rand(90, LOGICAL_HEIGHT - 130),
        direction,
        speed: rand(LABYRINTH.schoolSpeedMin, LABYRINTH.schoolSpeedMax),
        phase: rand(0, TAU),
        wobble: rand(1.6, 2.8),
        color: COLORSCHOOL_PALETTE[Math.floor(rand(0, COLORSCHOOL_PALETTE.length))],
        fish: Array.from({ length: LABYRINTH.schoolFish }, () => ({
          offsetX: rand(-52, 52),
          offsetY: rand(-26, 26),
          phase: rand(0, TAU),
          flutter: rand(9, 14),
          size: rand(3.4, 5.4),
        })),
      });
    }
    this.schools = this.schools.filter((school) => {
      school.x += school.direction * school.speed * dt;
      return (
        school.x > this.cameraX - 260 &&
        school.x < this.cameraX + LOGICAL_WIDTH + 260
      );
    });
  }

  updateSquid(dt, targets) {
    let focus = null;
    let best = Infinity;
    for (const player of targets) {
      const distance = Math.abs(player.x - this.squid.x);
      if (distance < best) {
        best = distance;
        focus = player;
      }
    }
    const watch = focus ? focus.x : this.wallX + 400;
    this.squid.gaze = focus ? { x: focus.x, y: focus.y } : null;
    this.squid.x = lerp(this.squid.x, watch, 1 - Math.exp(-LABYRINTH.squidFollow * dt));
    this.squid.blinkTimer -= dt;
    if (this.squid.blinkHold > 0) {
      this.squid.blinkHold = Math.max(0, this.squid.blinkHold - dt);
    } else if (this.squid.blinkTimer <= 0) {
      this.squid.blinkTimer = rand(LABYRINTH.squidBlinkMin, LABYRINTH.squidBlinkMax);
      this.squid.blinkHold = 0.2;
    }
    this.squid.blink =
      this.squid.blinkHold > 0 ? Math.sin(Math.PI * (1 - this.squid.blinkHold / 0.2)) : 0;
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene(this.theatre ? 'theatre' : 'minigames');
      return;
    }
    if (this.phase === 'select') {
      const selected = this.selectMenu.selected;
      if (selected && selected.action === 'part') {
        if (input.wasPressed('left')) this.cyclePart(-1);
        if (input.wasPressed('right')) this.cyclePart(1);
      }
      if (selected && (selected.action === 'creature1' || selected.action === 'creature2')) {
        const player = selected.action === 'creature2' ? 2 : 1;
        if (input.wasPressed('left')) this.cycleCreature(player, -1);
        if (input.wasPressed('right')) this.cycleCreature(player, 1);
      }
      this.selectMenu.update(dt, input);
      for (const preview of this.previews) preview.update(dt, IDLE_INPUT);
      return;
    }
    if (this.phase === 'ending') {
      this.updateEnding(dt, input);
      return;
    }
    if (this.phase === 'trailer') {
      this.updateTrailer(dt, input);
      return;
    }
    if (this.phase === 'results') {
      this.resultsMenu.update(dt, input);
      return;
    }
    this.elapsed += dt;
    this.wallDelay = Math.max(0, this.wallDelay - dt);
    const headStart = this.wallDelay > 0;
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 2);
    this.shake = Math.max(0, this.shake - dt * 1.8);
    const progress = clamp(this.wallX / this.worldLength, 0, 1);
    const partScale = 1 + (this.part - 1) * LABYRINTH.partSpeedRamp;
    const partCeiling =
      LABYRINTH.speedCeiling * (1 + (this.part - 1) * LABYRINTH.partCeilingRamp);
    const slowest =
      this.players.length > 0
        ? Math.min(...this.players.map((player) => player.maxSpeed ?? 400))
        : 400;
    this.wallCeiling = Math.min(partCeiling, slowest * LABYRINTH.wallPlayerRatio);
    const wallSpeed =
      headStart || this.wallStun > 0
        ? 0
        : Math.min(
            this.wallCeiling,
            LABYRINTH.wallSpeed *
              partScale *
              (1 + progress * (LABYRINTH.wallRamp - 1)) *
              this.rules.enemySpeed,
          );
    this.wallStun = Math.max(0, this.wallStun - dt);
    this.wallX += wallSpeed * dt;
    this.updateSchools(dt);
    this.updatePickups(dt);
    for (const chunk of this.collapseChunks) chunk.update(dt);
    this.collapseChunks = this.collapseChunks.filter((chunk) => chunk.alive);
    for (const arm of this.packArms) arm.update(dt, this.wallX, null);
    const targets = this.liveTargets();
    for (const tentacle of this.tentacles) {
      let closest = null;
      let closestDistance = LABYRINTH.grabRange;
      for (const player of targets) {
        const distance = player.x - this.wallX;
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = player;
        }
      }
      tentacle.update(dt, this.wallX, closest);
    }
    for (const ambush of this.ambushes) this.updateAmbush(ambush, dt, targets);
    for (const ceiling of this.ceilings) this.updateCeiling(ceiling, dt, targets);
    this.updateSquid(dt, targets);
    this.players.forEach((player, index) => {
      if (this.out[index]) {
        player.x = this.wallX - 40;
        return;
      }
      if (this.escaped[index]) {
        player.x = lerp(player.x, this.exitX + 80, 1 - Math.exp(-2 * dt));
        return;
      }
      if (this.grabbed[index]) {
        this.updateGrab(index, dt);
        return;
      }
      if (this.stunned[index] > 0) {
        this.stunned[index] = Math.max(0, this.stunned[index] - dt);
        player.vx *= Math.max(0, 1 - 3 * dt);
        player.vy *= Math.max(0, 1 - 3 * dt);
        player.x = clamp(player.x + player.vx * dt, player.radius, player.maxX - player.radius);
        player.y = clamp(
          player.y + player.vy * dt,
          player.radius,
          LOGICAL_HEIGHT - player.radius,
        );
        for (const wall of this.walls) resolveCircleRect(player, wall);
        for (const support of this.supports) {
          if (support.broken) continue;
          resolveCircleRect(player, this.supportRect(support));
        }
        this.collectPickups(index);
        return;
      }
      player.update(dt, input);
      for (const wall of this.walls) resolveCircleRect(player, wall);
      for (const support of this.supports) {
        if (support.broken) continue;
        const rammed = resolveCircleRect(player, this.supportRect(support));
        if (rammed && Math.hypot(player.vx, player.vy) >= LABYRINTH.supportRamSpeed) {
          this.breakSupport(support);
        }
      }
      this.collectPickups(index);
      player.x = clamp(player.x, player.radius, this.worldLength - player.radius);
      while (
        this.checkpointIndex[index] < this.checkpoints.length - 1 &&
        player.x >= this.checkpoints[this.checkpointIndex[index] + 1].x
      ) {
        this.checkpointIndex[index] += 1;
        this.activateCheckpoint(this.checkpointIndex[index]);
      }
      if (player.x >= this.exitX) {
        this.escape(index);
        return;
      }
      if (player.invulnerable <= 0) {
        if (!headStart && player.x - player.radius < this.wallX) {
          this.startGrab(index, null);
          return;
        }
        for (const tentacle of this.tentacles) {
          if (tentacle.cooldown > 0 || tentacle.reach < 0.35) continue;
          let grabbing = false;
          for (const point of this.grabSamples(tentacle)) {
            if (
              Math.hypot(player.x - point.x, player.y - point.y) <
              player.radius + LABYRINTH.grabRadius
            ) {
              grabbing = true;
              break;
            }
          }
          if (grabbing) {
            this.startGrab(index, tentacle);
            return;
          }
        }
        for (const ambush of this.ambushes) {
          let grabbing = false;
          for (const arm of ambush.arms) {
            if (arm.reach < LABYRINTH.burstGrabAfter) continue;
            for (const t of [0.1, 0.25, 0.45, 0.65, 0.85, 1]) {
              const point = arm.pointAt(t);
              if (
                Math.hypot(player.x - point.x, player.y - point.y) <
                player.radius + LABYRINTH.grabRadius
              ) {
                grabbing = true;
                break;
              }
            }
            if (grabbing) break;
          }
          if (grabbing) {
            this.startGrab(index, ambush.arms[0]);
            return;
          }
        }
      }
    });
    this.updateCamera(dt);
    this.particles.update(dt);
    this.popups = this.popups.filter((popup) => {
      popup.timer -= dt;
      popup.y -= 24 * dt;
      return popup.timer > 0;
    });
  }

  render(ctx) {
    setActiveSkin(this.skin);
    setSkinClock(this.time);
    setActiveHeadAccessory(this.head);
    setActiveBodyAccessory(this.back);
    setActiveTrail(this.trail);
    setActiveCompanion(this.companion);
    if (this.phase === 'select') {
      this.renderSelect(ctx);
      return;
    }
    if (this.phase === 'ending') {
      this.renderEnding(ctx);
      return;
    }
    if (this.phase === 'trailer') {
      this.renderTrailer(ctx);
      return;
    }
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, LABYRINTH_PALETTE);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 6 * this.shake, rand(-1, 1) * 6 * this.shake);
    }
    this.renderSquid(ctx);
    this.renderHull(ctx);
    this.renderFloor(ctx);
    this.renderCracks(ctx);
    this.renderCorals(ctx);
    this.renderDebris(ctx);
    for (let index = 0; index < this.checkpoints.length; index += 1) {
      this.renderCheckpoint(ctx, index);
    }
    this.renderExit(ctx);
    for (const wall of this.walls) this.renderWall(ctx, wall);
    for (const tunnel of this.tunnels) this.renderTunnel(ctx, tunnel);
    this.renderSupports(ctx);
    this.renderWallSeams(ctx);
    this.renderCeilingSeams(ctx);
    this.renderTentacleWall(ctx);
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    const wallScreenX = this.wallX - this.cameraX;
    if (this.wallDelay <= 0 && wallScreenX > -480 && wallScreenX < LOGICAL_WIDTH + 240) {
      for (const arm of this.packArms) arm.render(ctx);
      for (const tentacle of this.tentacles) tentacle.render(ctx);
    }
    const burstMin = this.cameraX - 340;
    const burstMax = this.cameraX + LOGICAL_WIDTH + 340;
    for (const crack of this.cracks) {
      if (crack.x < burstMin || crack.x > burstMax) continue;
      for (const arm of crack.arms) {
        if (arm.reach > 0.03) arm.render(ctx);
      }
    }
    for (const burst of this.wallBursts) {
      if (burst.x < burstMin || burst.x > burstMax) continue;
      for (const arm of burst.arms) {
        if (arm.reach > 0.03) arm.render(ctx);
      }
    }
    for (const ceiling of this.ceilings) {
      if (ceiling.chunk) ceiling.chunk.render(ctx);
    }
    for (const chunk of this.collapseChunks) chunk.render(ctx);
    this.renderSchools(ctx);
    this.renderPickups(ctx);
    for (const player of this.players) {
      player.render(ctx);
      drawSkinAura(ctx, player);
      drawTrail(ctx, player);
      drawCompanion(ctx, player);
    }
    ctx.restore();
    this.particles.render(ctx);
    ctx.restore();
    this.renderHud(ctx);
    if (this.phase === 'results') this.renderResults(ctx);
  }

  renderPickups(ctx) {
    for (const pickup of this.grabPickups) {
      if (pickup.taken) continue;
      const x = pickup.x;
      if (x < this.cameraX - 70 || x > this.cameraX + LOGICAL_WIDTH + 70) continue;
      const y = pickup.y + Math.sin(this.time * 1.6 + pickup.phase) * LABYRINTH.grabPickupFloat;
      const pulse = 1 + Math.sin(this.time * 4 + pickup.phase) * 0.08;
      const radius = LABYRINTH.grabPickupRadius * pulse;
      fillCircle(ctx, x, y, radius, 'rgba(207, 239, 255, 0.16)');
      strokeCircle(ctx, x, y, radius, COLORS.bubble, 2);
      fillCircle(ctx, x - radius * 0.35, y - radius * 0.42, 3, 'rgba(255, 255, 255, 0.85)');
      const heart = radius * 0.42;
      ctx.fillStyle = COLORS.danger;
      ctx.beginPath();
      ctx.arc(x - heart * 0.55, y - heart * 0.3, heart * 0.62, 0, TAU);
      ctx.arc(x + heart * 0.55, y - heart * 0.3, heart * 0.62, 0, TAU);
      ctx.moveTo(x - heart * 1.1, y - heart * 0.05);
      ctx.lineTo(x + heart * 1.1, y - heart * 0.05);
      ctx.lineTo(x, y + heart * 1.15);
      ctx.closePath();
      ctx.fill();
    }
    for (const popup of this.popups) {
      drawText(ctx, popup.text, popup.x, popup.y, {
        size: 12,
        color: COLORS.accent,
        glow: 'rgba(255, 209, 102, 0.5)',
        glowBlur: 8,
        alpha: Math.min(1, popup.timer),
      });
    }
  }

  renderTrailer(ctx) {
    const shot = TRAILER_SHOTS[this.trailerShot] ?? TRAILER_SHOTS[0];
    const zoom = 1 + 0.05 * this.trailerProgress;
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, {
      top: '#0c1b24',
      bottom: '#02060a',
      ray: 'rgba(190, 230, 255, 0.05)',
    });
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-LOGICAL_WIDTH / 2, -LOGICAL_HEIGHT / 2);
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 10 * this.shake, rand(-1, 1) * 10 * this.shake);
    }
    this.renderSquid(ctx);
    this.renderHull(ctx);
    this.renderFloor(ctx);
    this.renderCracks(ctx);
    this.renderCorals(ctx);
    this.renderDebris(ctx);
    for (let index = 0; index < this.checkpoints.length; index += 1) {
      this.renderCheckpoint(ctx, index);
    }
    this.renderExit(ctx);
    for (const wall of this.walls) this.renderWall(ctx, wall);
    for (const tunnel of this.tunnels) this.renderTunnel(ctx, tunnel);
    this.renderSupports(ctx);
    this.renderWallSeams(ctx);
    this.renderCeilingSeams(ctx);
    this.renderTentacleWall(ctx);
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    for (const arm of this.packArms) arm.render(ctx);
    for (const crack of this.cracks) {
      for (const arm of crack.arms) {
        if (arm.reach > 0.03) arm.render(ctx);
      }
    }
    for (const burst of this.wallBursts) {
      for (const arm of burst.arms) {
        if (arm.reach > 0.03) arm.render(ctx);
      }
    }
    for (const tentacle of this.tentacles) tentacle.render(ctx);
    for (const ceiling of this.ceilings) {
      if (ceiling.chunk) ceiling.chunk.render(ctx);
    }
    this.renderSchools(ctx);
    for (const member of this.trailerCrew) member.entity.render(ctx);
    this.particles.render(ctx);
    ctx.restore();
    ctx.restore();
    this.renderTrailerOverlay(ctx, shot);
  }

  renderTrailerOverlay(ctx, shot) {
    const elapsed = this.trailerShotElapsed;
    const alpha = Math.min(
      clamp(elapsed / 0.3, 0, 1),
      clamp((shot.duration - elapsed) / 0.35, 0, 1),
    );
    const barHeight = 46;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, barHeight);
    ctx.fillRect(0, LOGICAL_HEIGHT - barHeight, LOGICAL_WIDTH, barHeight);
    drawText(ctx, 'LABYRINTH — TRAILER', 18, 24, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.6,
      align: 'left',
    });
    drawText(ctx, shot.title, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.74, {
      size: shot.view === 'escape' ? 46 : 32,
      color: COLORS.text,
      glow: shot.view === 'escape' ? COLORS.accent : COLORS.bubble,
      glowBlur: 26,
      alpha: alpha * 0.95,
    });
    drawText(ctx, shot.sub, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.74 + 42, {
      size: 13,
      color: COLORS.foam,
      alpha: alpha * 0.85,
    });
    if (this.trailerFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, this.trailerFlash * 3) * 0.6})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    drawText(ctx, 'ENTER — SKIP', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 22, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.7,
    });
  }

  renderEnding(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, {
      top: '#0d2029',
      bottom: '#02060a',
      ray: 'rgba(190, 230, 255, 0.05)',
    });
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 9 * this.shake, rand(-1, 1) * 9 * this.shake);
    }
    this.renderHull(ctx);
    this.renderFloor(ctx);
    this.renderDebris(ctx);
    this.renderExit(ctx);
    for (const wall of this.walls) this.renderWall(ctx, wall);
    for (const tunnel of this.tunnels) this.renderTunnel(ctx, tunnel);

    const squid = this.megasquid;
    ctx.save();
    ctx.translate(squid.x, squid.y + 150);
    ctx.rotate(squid.rotation);
    for (let index = 0; index < 3; index += 1) {
      ctx.save();
      ctx.rotate((index - 1) * 0.5 + Math.sin(this.time * 0.9 + index) * 0.12);
      ctx.fillStyle = COLORS.wreckWoodDark;
      ctx.fillRect(-230, -12, 460, 24);
      ctx.strokeStyle = 'rgba(20, 14, 10, 0.7)';
      ctx.lineWidth = 3;
      ctx.strokeRect(-230, -12, 460, 24);
      ctx.restore();
    }
    ctx.restore();

    this.drawSquid(ctx, squid.x, squid.y, 1.75, 1.5, 0.92);
    this.drawSquidEye(
      ctx,
      squid.x + 74,
      squid.y + 98,
      squid.blink,
      0.7,
      -0.5,
      1 - squid.blink * 0.4,
    );

    for (const piece of this.endingDebris) {
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation);
      ctx.fillStyle = COLORS.wreckWood;
      ctx.beginPath();
      ctx.moveTo(-piece.size, -piece.size * 0.5);
      ctx.lineTo(piece.size * 0.9, -piece.size * 0.7);
      ctx.lineTo(piece.size, piece.size * 0.5);
      ctx.lineTo(-piece.size * 0.7, piece.size * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COLORS.wreckWoodDark;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
    this.particles.render(ctx);
    for (const escapee of this.escapees) {
      escapee.entity.render(ctx);
      drawText(ctx, escapee.label, escapee.entity.x, escapee.entity.y + 34, {
        size: 10,
        color: COLORS.foam,
        alpha: 0.55,
      });
    }
    ctx.restore();

    const t = this.endingTimer;
    const card =
      t < 2.4
        ? 'THE WRECK COLLAPSES...'
        : t < 5.2
          ? 'THE MEGASQUID IS DRAGGED INTO THE TRENCH'
          : 'THE SEVEN SURVIVORS ESCAPE THE WRECK';
    drawText(ctx, card, LOGICAL_WIDTH / 2, 58, {
      size: 24,
      color: t < 5.2 ? COLORS.accent : COLORS.bubble,
      glow: t < 5.2 ? 'rgba(255, 209, 102, 0.5)' : 'rgba(207, 239, 255, 0.5)',
      glowBlur: 18,
      alpha: 0.9,
    });
    if (t > 5.2) {
      drawText(
        ctx,
        'SHARK · STINGRAY · SQUID · SHRIMP · CRAB · JELLY · NAUTILUS',
        LOGICAL_WIDTH / 2,
        92,
        { size: 11, color: COLORS.textDim, alpha: 0.8 },
      );
    }
    drawText(ctx, 'ENTER — SKIP', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 24, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.75,
    });
  }

  renderSelect(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, LABYRINTH_PALETTE);
    drawText(ctx, 'LABYRINTH', LOGICAL_WIDTH / 2, 86, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    drawText(
      ctx,
      'CHOOSE YOUR PART AND YOUR DIVER',
      LOGICAL_WIDTH / 2,
      128,
      { size: 13, color: COLORS.foam, alpha: 0.85 },
    );
    this.selectMenu.render(ctx, 290, LOGICAL_HEIGHT * 0.52);
    this.previews.forEach((preview, index) => {
      preview.render(ctx);
      const label = this.solo
        ? this.creatureLabel
        : `${index === 0 ? 'P1' : 'P2'} — ${index === 0 ? this.creatureLabel : this.creatureLabel2}`;
      drawText(ctx, label, preview.x, preview.y - 66, {
        size: 15,
        color: index === 0 ? COLORS.accent : COLORS.bubble,
        glow: index === 0 ? 'rgba(255, 209, 102, 0.4)' : 'rgba(207, 239, 255, 0.4)',
        glowBlur: 12,
      });
    });
    if (this.savedPart > 1) {
      drawText(
        ctx,
        this.startPart === this.savedPart
          ? `RESUMING SAVED PART ${this.savedPart}`
          : `BEST PART REACHED: ${this.savedPart}`,
        LOGICAL_WIDTH / 2,
        158,
        { size: 12, color: COLORS.accent, alpha: 0.85 },
      );
    }
    drawText(
      ctx,
      this.solo
        ? 'LEFT/RIGHT — PICK THE PART OR YOUR CREATURE      ENTER — DIVE IN'
        : 'LEFT/RIGHT — PICK THE PART OR EACH DIVER      ENTER — DIVE IN',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 46,
      { size: 12, color: COLORS.textDim, alpha: 0.8 },
    );
    drawText(ctx, 'ESC — BACK TO MINIGAMES', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 24, {
      size: 12,
      color: COLORS.textDim,
    });
  }

  renderSquid(ctx) {
    if (!this.squid) return;
    const centerWorld = this.cameraX + LOGICAL_WIDTH / 2;
    const px = clamp(
      LOGICAL_WIDTH / 2 + (this.squid.x - centerWorld) * LABYRINTH.squidParallax,
      -320,
      LOGICAL_WIDTH + 320,
    );
    const py = LOGICAL_HEIGHT * 0.34;
    this.drawSquid(ctx, px, py, 1, 1, 1);
    const eyeX = px + 42;
    const eyeY = py + 56;
    let dirX = 0;
    let dirY = 1;
    if (this.squid.gaze) {
      const gx = this.squid.gaze.x - this.cameraX - eyeX;
      const gy = this.squid.gaze.y - eyeY;
      const length = Math.hypot(gx, gy) || 1;
      dirX = gx / length;
      dirY = gy / length;
    }
    this.drawSquidEye(ctx, eyeX, eyeY, this.squid.blink, dirX, dirY, 1);
  }

  drawSquid(ctx, px, py, scale, flail = 1, alpha = 1) {
    const s = scale;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.5 * alpha;
    ctx.strokeStyle = COLORS.tentacleDark;
    for (let i = 0; i < 8; i += 1) {
      const side = i - 3.5;
      const startX = px + side * 24 * s;
      const startY = py + 96 * s;
      ctx.lineWidth = (24 - Math.abs(side) * 3.5) * s;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      for (let k = 1; k <= 7; k += 1) {
        const t = k / 7;
        ctx.lineTo(
          startX +
            side * t * 130 * s +
            Math.sin(this.time * 0.55 * flail + i * 1.3 + t * 3.6) * (12 + t * 34) * s,
          startY + t * (220 + Math.abs(side) * 26) * s,
        );
      }
      ctx.stroke();
    }
    for (const side of [-1.4, 1.4]) {
      const startX = px + side * 24 * s;
      const startY = py + 96 * s;
      ctx.lineWidth = 15 * s;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      for (let k = 1; k <= 8; k += 1) {
        const t = k / 8;
        ctx.lineTo(
          startX +
            side * t * 190 * s +
            Math.sin(this.time * 0.4 * flail + side * 1.1 + t * 3.2) * (16 + t * 54) * s,
          startY + t * 480 * s,
        );
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(
        startX +
          side * 190 * s +
          Math.sin(this.time * 0.4 * flail + side * 1.1 + 3.2) * 70 * s,
        startY + 480 * s,
        15 * s,
        34 * s,
        side * 0.3,
        0,
        TAU,
      );
      ctx.fillStyle = COLORS.tentacleDark;
      ctx.fill();
    }

    ctx.globalAlpha = 0.62 * alpha;
    ctx.fillStyle = COLORS.tentacleDark;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(px + side * 18 * s, py - 130 * s);
      ctx.quadraticCurveTo(px + side * 156 * s, py - 248 * s, px + side * 176 * s, py - 158 * s);
      ctx.quadraticCurveTo(px + side * 96 * s, py - 116 * s, px + side * 18 * s, py - 130 * s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(px, py - 258 * s);
    ctx.quadraticCurveTo(px + 110 * s, py - 130 * s, px + 98 * s, py + 28 * s);
    ctx.quadraticCurveTo(px + 62 * s, py + 66 * s, px, py + 70 * s);
    ctx.quadraticCurveTo(px - 62 * s, py + 66 * s, px - 98 * s, py + 28 * s);
    ctx.quadraticCurveTo(px - 110 * s, py - 130 * s, px, py - 258 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px, py + 64 * s, 80 * s, 54 * s, 0, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = 0.28 * alpha;
    ctx.strokeStyle = COLORS.tentacle;
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(px, py - 258 * s);
    ctx.quadraticCurveTo(px + 110 * s, py - 130 * s, px + 98 * s, py + 28 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, py - 258 * s);
    ctx.quadraticCurveTo(px - 110 * s, py - 130 * s, px - 98 * s, py + 28 * s);
    ctx.stroke();
    ctx.restore();
  }

  drawSquidEye(ctx, eyeX, eyeY, blink, dirX, dirY, alpha = 1) {
    ctx.save();
    const halo = ctx.createRadialGradient(eyeX, eyeY, 4, eyeX, eyeY, 150);
    halo.addColorStop(0, `rgba(255, 214, 102, ${0.5 * (1 - blink * 0.85) * alpha})`);
    halo.addColorStop(1, 'rgba(255, 214, 102, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(eyeX - 150, eyeY - 150, 300, 300);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(255, 226, 150, 0.92)';
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 38, 34 * (1 - blink), 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1b1204';
    ctx.beginPath();
    ctx.ellipse(eyeX + dirX * 13, eyeY + dirY * 11, 16, 15 * (1 - blink), 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(eyeX + dirX * 13 - 6, eyeY + dirY * 11 - 6, 4, 4 * (1 - blink), 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(190, 130, 20, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 26, 23 * (1 - blink), 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  renderHull(ctx) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(38, 28, 20, 0.7)';
    ctx.lineWidth = 20;
    for (const rib of this.ribs) {
      const x = rib.x - this.cameraX * 0.55;
      if (x < -260 || x > LOGICAL_WIDTH + 260) continue;
      ctx.beginPath();
      ctx.moveTo(x - 90, -60);
      ctx.quadraticCurveTo(x, LOGICAL_HEIGHT + 80, x + 90, -60);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(58, 44, 32, 0.5)';
    ctx.lineWidth = 14;
    for (const rib of this.ribs) {
      const x = rib.x - this.cameraX * 0.72 + 150;
      if (x < -240 || x > LOGICAL_WIDTH + 240) continue;
      ctx.beginPath();
      ctx.moveTo(x - 70, -60);
      ctx.quadraticCurveTo(x, LOGICAL_HEIGHT + 60, x + 70, -60);
      ctx.stroke();
    }
    for (const hole of this.portholes) {
      const x = hole.x - this.cameraX * 0.72;
      if (x < -60 || x > LOGICAL_WIDTH + 60) continue;
      fillCircle(ctx, x, hole.y, 26, 'rgba(8, 18, 22, 0.75)');
      strokeCircle(ctx, x, hole.y, 26, 'rgba(138, 122, 92, 0.4)', 5);
      fillCircle(ctx, x, hole.y, 16, 'rgba(255, 209, 102, 0.09)');
    }
    ctx.restore();
  }

  renderFloor(ctx) {
    const floorY = LOGICAL_HEIGHT - LABYRINTH.floorHeight;
    const gradient = ctx.createLinearGradient(0, floorY, 0, LOGICAL_HEIGHT);
    gradient.addColorStop(0, 'rgba(90, 70, 51, 0.92)');
    gradient.addColorStop(1, COLORS.wreckWoodDark);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, floorY, LOGICAL_WIDTH, LABYRINTH.floorHeight);
    ctx.strokeStyle = 'rgba(26, 18, 12, 0.6)';
    ctx.lineWidth = 2;
    const start = Math.floor(this.cameraX / 80) * 80;
    for (let x = start; x < this.cameraX + LOGICAL_WIDTH + 80; x += 80) {
      const sx = x - this.cameraX;
      ctx.beginPath();
      ctx.moveTo(sx, floorY + 6);
      ctx.lineTo(sx - 16, LOGICAL_HEIGHT);
      ctx.stroke();
    }
    ctx.strokeStyle = COLORS.wreckMoss;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const weed of this.weeds) {
      const sx = weed.x - this.cameraX;
      if (sx < -40 || sx > LOGICAL_WIDTH + 40) continue;
      ctx.beginPath();
      ctx.moveTo(sx, floorY + 8);
      for (let i = 1; i <= 4; i += 1) {
        const t = i / 4;
        ctx.lineTo(
          sx + Math.sin(this.time * 1.6 + weed.phase + t * 2) * 6 * t,
          floorY + 8 - weed.height * t,
        );
      }
      ctx.stroke();
    }
  }

  renderCracks(ctx) {
    const baseY = LOGICAL_HEIGHT - LABYRINTH.floorHeight + 24;
    for (const crack of this.cracks) {
      const sx = crack.x - this.cameraX;
      if (sx < -150 || sx > LOGICAL_WIDTH + 150) continue;
      const alerted = crack.state !== 'idle';
      const pulse = alerted ? 0.55 + 0.45 * Math.sin(this.time * 10) : 0;
      if (alerted) {
        const glow = ctx.createRadialGradient(sx, baseY, 6, sx, baseY, 150);
        glow.addColorStop(0, `rgba(200, 69, 90, ${0.26 + pulse * 0.22})`);
        glow.addColorStop(1, 'rgba(200, 69, 90, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(sx - 150, baseY - 110, 300, 220);
      }
      ctx.fillStyle = 'rgba(24, 16, 12, 0.85)';
      ctx.beginPath();
      ctx.ellipse(sx, baseY, 46, 13, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = alerted
        ? `rgba(220, 96, 118, ${0.5 + pulse * 0.4})`
        : 'rgba(10, 7, 6, 0.9)';
      ctx.lineWidth = alerted ? 3 : 2.5;
      for (const line of crack.lines) {
        ctx.beginPath();
        ctx.moveTo(sx, baseY);
        ctx.lineTo(
          sx + Math.cos(line.angle) * line.length * 0.6,
          baseY + Math.sin(line.angle) * line.length * 0.6,
        );
        ctx.lineTo(
          sx + Math.cos(line.angle + line.kink) * line.length,
          baseY + Math.sin(line.angle + line.kink) * line.length,
        );
        ctx.stroke();
      }
    }
  }

  renderCorals(ctx) {
    const baseY = LOGICAL_HEIGHT - LABYRINTH.floorHeight + 14;
    for (const coral of this.corals) {
      const sx = coral.x - this.cameraX;
      if (sx < -80 || sx > LOGICAL_WIDTH + 80) continue;
      ctx.save();
      ctx.translate(sx, baseY);
      ctx.rotate(coral.lean + Math.sin(this.time * 1.3 + coral.phase) * 0.05);
      ctx.lineCap = 'round';
      for (const branch of coral.branches) {
        ctx.strokeStyle = coral.color;
        ctx.lineWidth = coral.lineWidth;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(branch.x1, branch.y1);
        if (!branch.snapped) ctx.lineTo(branch.x2, branch.y2);
        ctx.stroke();
        if (branch.snapped) {
          ctx.strokeStyle = 'rgba(18, 10, 8, 0.85)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(branch.x1 - 3.2, branch.y1 + 2.6);
          ctx.lineTo(branch.x1 + 3.2, branch.y1 - 2.6);
          ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(24, 16, 12, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  renderSchools(ctx) {
    for (const school of this.schools) {
      const wobble = Math.sin(this.time * school.wobble + school.phase) * 8;
      for (const fish of school.fish) {
        const x = school.x + fish.offsetX * school.direction;
        const y = school.y + fish.offsetY + wobble;
        const flutter = Math.sin(this.time * fish.flutter + fish.phase);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(school.direction, 1);
        ctx.fillStyle = school.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, fish.size * 1.15, fish.size * 0.62, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-fish.size * 1.05, 0);
        ctx.lineTo(-fish.size * 1.9, flutter * fish.size * 0.7 - fish.size * 0.5);
        ctx.lineTo(-fish.size * 1.9, flutter * fish.size * 0.7 + fish.size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(8, 14, 18, 0.75)';
        ctx.beginPath();
        ctx.arc(fish.size * 0.62, -fish.size * 0.14, fish.size * 0.16, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  renderDebris(ctx) {
    for (const item of this.debris) {
      const sx = item.x - this.cameraX;
      if (sx < -60 || sx > LOGICAL_WIDTH + 60) continue;
      ctx.save();
      ctx.translate(sx, item.y);
      ctx.rotate(item.angle);
      if (item.kind === 'barrel') {
        fillRoundRect(ctx, -item.size * 0.6, -item.size, item.size * 1.2, item.size * 2, 6, COLORS.wreckWood);
        ctx.strokeStyle = COLORS.wreckWoodDark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-item.size * 0.6, -item.size * 0.3);
        ctx.lineTo(item.size * 0.6, -item.size * 0.3);
        ctx.moveTo(-item.size * 0.6, item.size * 0.5);
        ctx.lineTo(item.size * 0.6, item.size * 0.5);
        ctx.stroke();
      } else {
        fillRoundRect(ctx, -item.size, -item.size, item.size * 2, item.size * 2, 4, COLORS.wreckWood);
        strokeRoundRect(ctx, -item.size, -item.size, item.size * 2, item.size * 2, 4, COLORS.wreckWoodDark, 2);
      }
      ctx.restore();
    }
  }

  renderCheckpoint(ctx, index) {
    const checkpoint = this.checkpoints[index];
    const sx = checkpoint.x - this.cameraX;
    if (sx < -100 || sx > LOGICAL_WIDTH + 100) return;
    const lit = checkpoint.active;
    if (lit) {
      const glow = ctx.createRadialGradient(sx, 150, 10, sx, 150, 260);
      glow.addColorStop(0, 'rgba(255, 209, 102, 0.16)');
      glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(sx - 260, 0, 520, LOGICAL_HEIGHT);
    }
    ctx.fillStyle = COLORS.wreckWood;
    ctx.fillRect(sx - 7, 46, 14, LOGICAL_HEIGHT - 46);
    ctx.fillStyle = COLORS.wreckWoodDark;
    ctx.fillRect(sx - 7, 46, 5, LOGICAL_HEIGHT - 46);
    const lampY = 84;
    if (lit) {
      const halo = ctx.createRadialGradient(sx, lampY, 4, sx, lampY, 90);
      halo.addColorStop(0, 'rgba(255, 209, 102, 0.55)');
      halo.addColorStop(1, 'rgba(255, 209, 102, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(sx - 90, lampY - 90, 180, 180);
    }
    fillCircle(ctx, sx, lampY, 11, lit ? COLORS.accent : '#465650');
    strokeCircle(ctx, sx, lampY, 11, 'rgba(20, 16, 10, 0.8)', 2);
    ctx.fillStyle = lit ? '#7ce08a' : 'rgba(124, 224, 138, 0.3)';
    ctx.beginPath();
    ctx.moveTo(sx + 7, 112);
    ctx.lineTo(sx + 56, 124);
    ctx.lineTo(sx + 7, 136);
    ctx.closePath();
    ctx.fill();
    drawText(ctx, `S${index + 1}`, sx, 32, {
      size: 13,
      color: lit ? COLORS.accent : COLORS.textDim,
      glow: lit ? 'rgba(255, 209, 102, 0.6)' : null,
    });
  }

  renderExit(ctx) {
    const sx = this.exitX - this.cameraX;
    if (sx < -240 || sx > LOGICAL_WIDTH + 240) return;
    const beam = ctx.createLinearGradient(sx, 0, sx + 280, 0);
    beam.addColorStop(0, 'rgba(207, 239, 255, 0.34)');
    beam.addColorStop(1, 'rgba(207, 239, 255, 0)');
    ctx.fillStyle = beam;
    ctx.fillRect(sx, 0, 280, LOGICAL_HEIGHT);
    ctx.fillStyle = COLORS.wreckWood;
    ctx.beginPath();
    ctx.moveTo(sx - 12, 0);
    ctx.lineTo(sx + 48, 0);
    ctx.lineTo(sx + 30, 100);
    ctx.lineTo(sx - 18, 66);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx - 12, LOGICAL_HEIGHT);
    ctx.lineTo(sx + 48, LOGICAL_HEIGHT);
    ctx.lineTo(sx + 34, LOGICAL_HEIGHT - 110);
    ctx.lineTo(sx - 20, LOGICAL_HEIGHT - 70);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.wreckWoodDark;
    ctx.lineWidth = 3;
    ctx.stroke();
    drawText(ctx, 'ESCAPE', sx + 130, 46, {
      size: 16,
      color: COLORS.bubble,
      glow: COLORS.bubble,
      glowBlur: 14,
      alpha: 0.9,
    });
    ctx.fillStyle = 'rgba(4, 16, 29, 0.55)';
    ctx.fillRect(sx + 280, 0, Math.max(0, LOGICAL_WIDTH - sx - 280), LOGICAL_HEIGHT);
  }

  renderWall(ctx, wall) {
    const sx = wall.x - this.cameraX;
    if (sx + wall.w < -40 || sx > LOGICAL_WIDTH + 40) return;
    const gradient = ctx.createLinearGradient(sx, 0, sx + wall.w, 0);
    gradient.addColorStop(0, COLORS.wreckWoodDark);
    gradient.addColorStop(0.5, COLORS.wreckWood);
    gradient.addColorStop(1, COLORS.wreckWoodDark);
    ctx.fillStyle = gradient;
    ctx.fillRect(sx, wall.y, wall.w, wall.h);
    ctx.strokeStyle = 'rgba(26, 18, 12, 0.55)';
    ctx.lineWidth = 2;
    for (let y = wall.y + 22; y < wall.y + wall.h - 6; y += 34) {
      ctx.beginPath();
      ctx.moveTo(sx + 2, y);
      ctx.lineTo(sx + wall.w - 2, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(sx, wall.y, wall.w, wall.h);
    ctx.fillStyle = 'rgba(190, 180, 160, 0.4)';
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.arc(
        sx + 18 + ((i * 47) % Math.max(1, wall.w - 36)),
        wall.y + 18 + ((i * 71) % Math.max(1, wall.h - 36)),
        2.4,
        0,
        TAU,
      );
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(92, 122, 74, 0.35)';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(
        sx + 26 + ((i * 83) % Math.max(1, wall.w - 52)),
        wall.y + (wall.y <= 0 ? 26 : wall.h - 26),
        20,
        9,
        0,
        0,
        TAU,
      );
      ctx.fill();
    }
  }

  renderTunnel(ctx, tunnel) {
    const sx = tunnel.x - this.cameraX;
    if (sx + tunnel.w < -60 || sx > LOGICAL_WIDTH + 60) return;
    const half = tunnel.height / 2;
    const top = tunnel.y - half;
    fillRoundRect(ctx, sx + 16, top, tunnel.w - 32, tunnel.height, half * 0.9, '#05070a');
    ctx.save();
    ctx.globalAlpha = 0.55;
    fillRoundRect(ctx, sx + 30, top + 12, tunnel.w - 60, tunnel.height - 24, half * 0.7, '#123038');
    ctx.restore();
    strokeRoundRect(ctx, sx + 16, top, tunnel.w - 32, tunnel.height, half * 0.9, COLORS.wreckWoodDark, 7);
    strokeRoundRect(ctx, sx + 20, top + 4, tunnel.w - 40, tunnel.height - 8, half * 0.8, 'rgba(92, 70, 51, 0.8)', 2);
    ctx.fillStyle = 'rgba(92, 122, 74, 0.3)';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(sx + 40 + ((i * 71) % Math.max(1, tunnel.w - 80)), top + (i === 1 ? tunnel.height : 0), 18, 7, 0, 0, TAU);
      ctx.fill();
    }
  }

  renderSupports(ctx) {
    for (const support of this.supports) {
      const sx = support.x - this.cameraX;
      if (sx < -90 || sx > LOGICAL_WIDTH + 90) continue;
      const half = LABYRINTH.supportWidth / 2;
      if (support.broken) {
        ctx.fillStyle = COLORS.wreckWoodDark;
        ctx.beginPath();
        ctx.moveTo(sx - half, -20);
        ctx.lineTo(sx + half, -20);
        ctx.lineTo(sx + half - 6, 46 + Math.sin(support.crackSeed) * 8);
        ctx.lineTo(sx + 4, 64);
        ctx.lineTo(sx - half + 4, 40);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx - half, LOGICAL_HEIGHT);
        ctx.lineTo(sx + half, LOGICAL_HEIGHT);
        ctx.lineTo(sx + half - 4, LOGICAL_HEIGHT - 40);
        ctx.lineTo(sx - 6, LOGICAL_HEIGHT - 58);
        ctx.lineTo(sx - half + 6, LOGICAL_HEIGHT - 30);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(58, 44, 32, 0.9)';
        for (let i = 0; i < 4; i += 1) {
          ctx.beginPath();
          ctx.ellipse(
            sx - 24 + i * 16,
            LOGICAL_HEIGHT - LABYRINTH.floorHeight + 16,
            9,
            5,
            0,
            0,
            TAU,
          );
          ctx.fill();
        }
        continue;
      }
      const gradient = ctx.createLinearGradient(sx - half, 0, sx + half, 0);
      gradient.addColorStop(0, COLORS.wreckWoodDark);
      gradient.addColorStop(0.5, COLORS.wreckWood);
      gradient.addColorStop(1, COLORS.wreckWoodDark);
      ctx.fillStyle = gradient;
      ctx.fillRect(sx - half, -20, half * 2, LOGICAL_HEIGHT + 20);
      ctx.strokeStyle = 'rgba(26, 18, 12, 0.6)';
      ctx.lineWidth = 2;
      for (let y = 40; y < LOGICAL_HEIGHT; y += 66) {
        ctx.beginPath();
        ctx.moveTo(sx - half + 2, y);
        ctx.lineTo(sx + half - 2, y);
        ctx.stroke();
      }
      const danger = clamp(1 - (support.x - this.wallX) / LABYRINTH.supportHintRange, 0, 1);
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 9 + support.phase);
      ctx.strokeStyle =
        danger > 0.05
          ? `rgba(220, 96, 118, ${0.4 + danger * 0.4 * pulse})`
          : 'rgba(14, 10, 8, 0.85)';
      ctx.lineWidth = 2.6;
      for (let i = 0; i < 4; i += 1) {
        const cy = 70 + ((i * 127 + support.crackSeed * 53) % 380);
        ctx.beginPath();
        ctx.moveTo(sx - half + 6, cy);
        ctx.lineTo(sx - 4 + (i % 2) * 8, cy + 18);
        ctx.lineTo(sx + half - 8, cy + 34);
        ctx.stroke();
      }
      if (danger > 0.05) {
        const glow = ctx.createRadialGradient(
          sx,
          LOGICAL_HEIGHT / 2,
          10,
          sx,
          LOGICAL_HEIGHT / 2,
          130,
        );
        glow.addColorStop(0, `rgba(200, 69, 90, ${0.12 + danger * 0.2})`);
        glow.addColorStop(1, 'rgba(200, 69, 90, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(sx - 130, 0, 260, LOGICAL_HEIGHT);
      }
      const near = this.players.some(
        (player, index) =>
          !this.out[index] &&
          !this.escaped[index] &&
          Math.abs(player.x - support.x) < 230,
      );
      if (near) {
        drawText(ctx, 'RAM IT!', sx, LOGICAL_HEIGHT - 128, {
          size: 13,
          color: COLORS.accent,
          glow: 'rgba(255, 209, 102, 0.5)',
          glowBlur: 10,
          alpha: 0.65 + 0.35 * Math.sin(this.time * 7 + support.phase),
        });
      }
    }
  }

  renderWallSeams(ctx) {
    for (const burst of this.wallBursts) {
      const sx = burst.x - this.cameraX;
      if (sx < -80 || sx > LOGICAL_WIDTH + 80) continue;
      const alerted = burst.state !== 'idle';
      const pulse = alerted ? 0.55 + 0.45 * Math.sin(this.time * 10) : 0;
      const facing = Math.cos(burst.angle) >= 0 ? 1 : -1;
      if (alerted) {
        const glow = ctx.createRadialGradient(sx, burst.y, 6, sx, burst.y, 130);
        glow.addColorStop(0, `rgba(200, 69, 90, ${0.24 + pulse * 0.24})`);
        glow.addColorStop(1, 'rgba(200, 69, 90, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(sx - 130, burst.y - 130, 260, 260);
      }
      ctx.strokeStyle = alerted
        ? `rgba(220, 96, 118, ${0.5 + pulse * 0.4})`
        : 'rgba(12, 8, 6, 0.9)';
      ctx.lineWidth = alerted ? 3 : 2.5;
      ctx.beginPath();
      ctx.moveTo(sx, burst.y - 40);
      for (let i = 1; i <= 6; i += 1) {
        const t = i / 6;
        ctx.lineTo(
          sx + facing * (2 + Math.sin(i * 2.3 + burst.x) * 4),
          burst.y - 40 + t * 80,
        );
      }
      ctx.stroke();
      if (burst.state === 'burst' || burst.arms[0].reach > 0.03) {
        ctx.fillStyle = '#05070a';
        ctx.beginPath();
        ctx.ellipse(sx + facing * 6, burst.y, 26, 30, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = `rgba(200, 69, 90, ${0.4 + pulse * 0.3})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }

  renderCeilingSeams(ctx) {
    for (const ceiling of this.ceilings) {
      const sx = ceiling.x - this.cameraX;
      if (sx < -90 || sx > LOGICAL_WIDTH + 90) continue;
      const alerted = ceiling.state !== 'idle';
      const pulse = alerted ? 0.55 + 0.45 * Math.sin(this.time * 12) : 0;
      if (alerted) {
        const glow = ctx.createRadialGradient(sx, 26, 4, sx, 26, 110);
        glow.addColorStop(0, `rgba(220, 150, 90, ${0.2 + pulse * 0.24})`);
        glow.addColorStop(1, 'rgba(220, 150, 90, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(sx - 110, 0, 220, 150);
      }
      ctx.strokeStyle = alerted
        ? `rgba(230, 170, 110, ${0.5 + pulse * 0.4})`
        : 'rgba(14, 10, 8, 0.9)';
      ctx.lineWidth = alerted ? 3 : 2.4;
      for (const line of ceiling.cracks) {
        ctx.beginPath();
        ctx.moveTo(sx + line.offset, 16);
        ctx.lineTo(sx + line.offset + line.length * 0.5, 16 + line.drop);
        ctx.lineTo(
          sx + line.offset + line.length,
          16 + line.drop + line.length * line.kink,
        );
        ctx.stroke();
      }
      if (alerted) {
        ctx.fillStyle = `rgba(210, 190, 160, ${0.35 + pulse * 0.3})`;
        for (let mote = 0; mote < 3; mote += 1) {
          const fall = (this.time * 90 + mote * 46) % 66;
          ctx.fillRect(sx - 18 + mote * 18, 22 + fall, 3, 3);
        }
      }
    }
  }

  renderTentacleWall(ctx) {
    if (this.wallDelay > 0) return;
    const edge = this.wallX - this.cameraX + 24;
    if (edge <= 0) return;
    const gradient = ctx.createLinearGradient(edge - LABYRINTH.darkFade, 0, edge, 0);
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(0.45, '#0d0306');
    gradient.addColorStop(1, '#1c070c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, edge, LOGICAL_HEIGHT);
  }

  renderHud(ctx) {
    const barX = 220;
    const barWidth = 520;
    const barY = 20;
    fillRoundRect(ctx, barX, barY, barWidth, 10, 5, 'rgba(4, 16, 29, 0.6)');
    for (let i = 1; i < this.checkpoints.length; i += 1) {
      const tick = barX + (this.checkpoints[i].x / this.worldLength) * barWidth;
      ctx.fillStyle = this.checkpoints[i].active
        ? COLORS.accent
        : 'rgba(234, 246, 255, 0.35)';
      ctx.fillRect(tick - 1, barY - 3, 2, 16);
    }
    const wallRatio = clamp(this.wallX / this.worldLength, 0, 1);
    ctx.fillStyle = COLORS.tentacle;
    ctx.fillRect(barX + wallRatio * barWidth - 2, barY - 5, 4, 20);
    this.players.forEach((player, index) => {
      const ratio = clamp(player.x / this.worldLength, 0, 1);
      fillCircle(ctx, barX + ratio * barWidth, barY + 5, 5, index === 0 ? COLORS.accent : COLORS.foam);
    });
    drawText(
      ctx,
      `PART ${this.part}/${LABYRINTH.parts} — SECTION ${Math.max(...this.checkpointIndex) + 1}/${this.sectionCount}`,
      LOGICAL_WIDTH / 2,
      barY + 34,
      { size: 12, color: COLORS.textDim },
    );
    this.players.forEach((player, index) => {
      const x = index === 0 ? 24 : LOGICAL_WIDTH - 24;
      const align = index === 0 ? 'left' : 'right';
      drawText(ctx, `P${index + 1}`, x, 62, {
        size: 13,
        color: index === 0 ? COLORS.accent : COLORS.foam,
        align,
      });
      const status = this.out[index]
        ? 'CAUGHT'
        : this.escaped[index]
          ? 'ESCAPED'
          : `${this.grabs[index]} ${this.grabs[index] === 1 ? 'GRAB' : 'GRABS'} LEFT`;
      drawText(ctx, status, x, 80, {
        size: 12,
        color: this.out[index] ? COLORS.danger : COLORS.textDim,
        align,
      });
    });
    if (this.phase === 'play') drawJoystick(ctx, joystickState(this.game.input));
    if (this.bannerTimer > 0) {
      drawText(ctx, this.banner, LOGICAL_WIDTH / 2, 128, {
        size: 30,
        color: COLORS.accent,
        glow: 'rgba(255, 209, 102, 0.5)',
        glowBlur: 18,
        alpha: Math.min(1, this.bannerTimer),
      });
    }
    if (this.wallDelay > 0) {
      drawText(ctx, `TENTACLES IN ${Math.ceil(this.wallDelay)}s`, LOGICAL_WIDTH / 2, 160, {
        size: 16,
        color: COLORS.danger,
        glow: COLORS.danger,
        glowBlur: 12,
        alpha: 0.65 + 0.35 * Math.sin(this.time * 6),
      });
    }
    drawText(
      ctx,
      this.solo
        ? 'WASD OR DRAG — SWIM      OUTRUN THE TENTACLES      ESC — MINIGAMES'
        : 'P1 — WASD OR JOYSTICK   P2 — ARROWS      ESCAPE THE WRECK TOGETHER      ESC — MINIGAMES',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 12,
      { size: 11, color: COLORS.textDim, alpha: 0.7 },
    );
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(200, 69, 90, ${this.flash * 0.3})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
  }

  renderResults(ctx) {
    fillRoundRect(ctx, 250, 70, 460, 390, 26, 'rgba(10, 39, 64, 0.94)');
    strokeRoundRect(ctx, 250, 70, 460, 390, 26, 'rgba(207, 239, 255, 0.3)', 2);
    drawText(
      ctx,
      this.won ? `ALL ${LABYRINTH.parts} PARTS ESCAPED!` : `CAUGHT IN PART ${this.part}`,
      LOGICAL_WIDTH / 2,
      124,
      {
        size: this.won ? 30 : 32,
        color: this.won ? COLORS.accent : COLORS.danger,
        glow: this.won ? 'rgba(255, 209, 102, 0.5)' : 'rgba(255, 107, 129, 0.5)',
        glowBlur: 18,
      },
    );
    this.players.forEach((_, index) => {
      drawText(
        ctx,
        `P${index + 1} — ${this.out[index] ? 'CAUGHT' : 'ESCAPED'}`,
        LOGICAL_WIDTH / 2,
        178 + index * 26,
        {
          size: 15,
          color: this.out[index] ? COLORS.danger : COLORS.foam,
          alpha: 0.9,
        },
      );
    });
    drawText(
      ctx,
      `PART ${this.part}/${LABYRINTH.parts} — CHECKPOINTS ARMED ${Math.max(...this.checkpointIndex) + 1}/${this.sectionCount}`,
      LOGICAL_WIDTH / 2,
      242,
      { size: 12, color: COLORS.textDim, alpha: 0.8 },
    );
    drawText(
      ctx,
      this.won
        ? 'FULL ESCAPE BONUS EARNED'
        : this.part > 1
          ? `PROGRESS SAVED — PART ${this.part} WILL BE WAITING`
          : 'NO BONUS — A DIVER WAS LEFT BEHIND',
      LOGICAL_WIDTH / 2,
      270,
      { size: 11, color: COLORS.textDim, alpha: 0.75 },
    );
    drawText(ctx, `+${this.reward} SEA COINS`, LOGICAL_WIDTH / 2, 294, {
      size: 13,
      color: COLORS.accent,
      alpha: 0.9,
    });
    this.resultsMenu.render(ctx, LOGICAL_WIDTH / 2, 370);
  }
}
