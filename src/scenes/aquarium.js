import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillCircle, roundRectClip, strokeRoundRect, drawShadowedPlanks } from '../engine/render.js';
import { drawJoystick, joystickState } from '../engine/joystick.js';
import { ParticleSystem } from '../engine/particles.js';
import { circleOverlap, resolveCircleRect } from '../engine/collision.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { clamp, rand } from '../engine/math.js';
import { Coral } from '../entities/coral.js';
import { ReefRock } from '../entities/reefrock.js';
import { Weed } from '../entities/weed.js';
import { IceChunk } from '../entities/icechunk.js';
import { SardineSchool } from '../entities/sardineschool.js';
import { Archway } from '../entities/archway.js';
import { Ledges } from '../entities/ledges.js';
import { LabPiece } from '../entities/labpiece.js';
import { LabBurster } from '../entities/labburster.js';
import { BreachChunk } from '../entities/breachchunk.js';
import { Pet } from '../entities/pet.js';
import { Jellyfish } from '../entities/jellyfish.js';
import { Turtle } from '../entities/turtle.js';
import { Pufferfish } from '../entities/pufferfish.js';
import { Anglerfish } from '../entities/anglerfish.js';
import { DartEel } from '../entities/darteel.js';
import { Eel } from '../entities/eel.js';
import { Seal } from '../entities/seal.js';
import { Shark } from '../entities/shark.js';
import { Stingray } from '../entities/stingray.js';
import { Squid } from '../entities/squid.js';
import { ArcticShrimp } from '../entities/arcticshrimp.js';
import { KelpCrab } from '../entities/kelpcrab.js';
import { MoonJelly } from '../entities/moonjelly.js';
import { Nautilus } from '../entities/nautilus.js';
import {
  AQUARIUM,
  AQUARIUM_KEY,
  COLORS,
  CONTROLS,
  EEL_VARIANTS,
  LABYRINTH,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  SAND,
  WATER_PALETTE,
} from '../config.js';

const MENU_X = 170;
const MENU_Y = 280;
const DIVE_CREATURES = [
  { label: 'SHARK', type: Shark },
  { label: 'STINGRAY', type: Stingray },
  { label: 'SQUID', type: Squid },
  { label: 'SHRIMP', type: ArcticShrimp },
  { label: 'CRAB', type: KelpCrab },
  { label: 'JELLY', type: MoonJelly },
  { label: 'NAUTILUS', type: Nautilus, options: { vertical: true } },
];
const HABITATS = ['ARCHWAY', 'LEDGES'];

export class AquariumScene extends Scene {
  enter() {
    this.time = 0;
    this.status = null;
    this.statusTimer = 0;
    this.phase = 'build';
    this.diveIndex = 0;
    this.divePlayer = null;
    this.particles = new ParticleSystem();
    const saved = loadJSON(AQUARIUM_KEY, { items: [] });
    this.chill = saved.chill === true;
    this.labyrinthOn = saved.labyrinth?.on === true;
    this.labyrinthSeed = saved.labyrinth?.seed ?? 1;
    this.labyrinth = this.labyrinthOn ? this.buildLabyrinth(this.labyrinthSeed) : null;
    const entries = Array.isArray(saved.items) ? saved.items : [];
    this.items = entries.map((entry, index) => ({
      entry,
      entity: this.makeEntity(entry.kind, entry.x, entry.y, index),
    }));
    this.itemIndex = 0;
    this.breachChunks = [];
    this.menu = new SelectList(
      [
        { label: `DIVE AS: ${this.diveLabel}`, action: 'dive' },
        { label: this.chillLabel, action: 'chill' },
        { label: 'ITEM', action: 'item' },
        { label: 'UNDO', action: 'undo' },
        { label: 'CLEAR ALL', action: 'clear' },
        { label: this.labyrinthLabel, action: 'labyrinth' },
        { label: 'BACK', action: 'back' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 38,
        width: 260,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.choose(item),
      },
    );
    this.menu.reset();
    this.refreshGroups();
  }

  palette() {
    return this.labyrinthOn ? [...AQUARIUM.kinds, ...AQUARIUM.labyrinthKinds] : AQUARIUM.kinds;
  }

  get itemKind() {
    return this.palette()[this.itemIndex].key;
  }

  get itemLabel() {
    return this.palette()[this.itemIndex].label;
  }

  get diveLabel() {
    return DIVE_CREATURES[this.diveIndex].label;
  }

  get chillLabel() {
    return `CHILL MODE: ${this.chill ? 'ON' : 'OFF'}`;
  }

  get labyrinthLabel() {
    return `LABYRINTH MODE: ${this.labyrinthOn ? 'ON' : 'OFF'}`;
  }

  buildLabyrinth(seed) {
    let state = (Math.imul(seed >>> 0, 2654435761) >>> 0) || 1;
    const next = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const cfg = AQUARIUM.labyrinth;
    const walls = [];
    const tunnels = [];
    for (let gate = 0; gate < cfg.gates; gate += 1) {
      const x = cfg.gateX + gate * cfg.gatePitch;
      const w = cfg.gateWidth;
      const laneY = 110 + next() * 180;
      const hanging = gate % 2 === 0;
      const top = hanging ? -20 : laneY + cfg.laneGap;
      const bottom = hanging ? laneY : LOGICAL_HEIGHT + 20;
      const height = bottom - top;
      let carved = false;
      if (height > cfg.tunnelHeight + 120 && next() < 0.6) {
        const tunnelY = top + 70 + next() * (height - cfg.tunnelHeight - 140);
        walls.push({ x, y: top, w, h: tunnelY - top });
        walls.push({ x, y: tunnelY + cfg.tunnelHeight, w, h: bottom - tunnelY - cfg.tunnelHeight });
        tunnels.push({ x, y: tunnelY, w, h: cfg.tunnelHeight });
        carved = true;
      }
      if (!carved) walls.push({ x, y: top, w, h: height });
      if (gate < cfg.gates - 1) {
        const stubX = x + cfg.gatePitch / 2 - cfg.stubWidth / 2;
        const stubTop = (gate + 1) % 2 === 0;
        walls.push({
          x: stubX,
          y: stubTop ? -20 : LOGICAL_HEIGHT - cfg.stubHeight,
          w: cfg.stubWidth,
          h: cfg.stubHeight + 20,
        });
      }
    }
    const supports = cfg.supportSpots.map((x) => ({
      x,
      w: cfg.supportWidth,
      h: cfg.supportHeight,
    }));
    const cracks = cfg.crackSpots.map((x, index) => ({ x, phase: index * 1.7 }));
    const beams = cfg.beamSpots.map((x, index) => ({ x, phase: index * 2.3 }));
    return { walls, tunnels, supports, cracks, beams };
  }

  toggleLabyrinth() {
    this.labyrinthOn = !this.labyrinthOn;
    if (this.labyrinthOn) {
      this.labyrinthSeed = (Math.random() * 100000) | 0;
      this.labyrinth = this.buildLabyrinth(this.labyrinthSeed);
      this.setStatus('LABYRINTH MODE ON — WRECK PIECES JOIN THE PALETTE');
    } else {
      this.labyrinth = null;
      this.setStatus('LABYRINTH MODE OFF — OPEN WATER AGAIN');
    }
    this.itemIndex = Math.min(this.itemIndex, this.palette().length - 1);
    this.menu.items[5].label = this.labyrinthLabel;
    this.save();
    this.game.audio.tone({
      freq: this.labyrinthOn ? 340 : 620,
      endFreq: this.labyrinthOn ? 180 : 320,
      type: 'sawtooth',
      duration: 0.3,
      volume: 0.2,
    });
    this.game.audio.tone({
      freq: this.labyrinthOn ? 90 : 180,
      endFreq: this.labyrinthOn ? 45 : 90,
      type: 'square',
      duration: 0.4,
      volume: 0.18,
      delay: 0.12,
    });
  }

  refreshGroups() {
    this.pets = this.items
      .filter((item) => item.entry.kind.startsWith('PET:'))
      .map((item) => item.entity);
    this.enemyEntities = this.items
      .filter((item) => item.entry.kind.startsWith('ENEMY:'))
      .map((item) => item.entity);
  }

  cycle(step) {
    if (this.menu.selected?.action === 'dive') {
      const count = DIVE_CREATURES.length;
      this.diveIndex = (this.diveIndex + step + count) % count;
      this.menu.items[0].label = `DIVE AS: ${this.diveLabel}`;
      this.game.audio.tone({ freq: 480 + this.diveIndex * 60, duration: 0.05, volume: 0.08 });
      return;
    }
    const count = this.palette().length;
    this.itemIndex = (this.itemIndex + step + count) % count;
    this.game.audio.tone({ freq: 520 + this.itemIndex * 50, duration: 0.05, volume: 0.08 });
  }

  makeEntity(kind, x, y, index = null) {
    const floorY = LOGICAL_HEIGHT - 6;
    if (kind === 'ROCK') {
      const rock = new ReefRock(-1);
      rock.x = x;
      rock.y = floorY;
      return rock;
    }
    if (kind === 'WEED') {
      const weed = new Weed();
      weed.x = x;
      return weed;
    }
    if (kind === 'ICE') {
      const ice = new IceChunk();
      ice.x = x;
      ice.y = y;
      return ice;
    }
    if (kind === 'SARDINES') {
      const school = new SardineSchool();
      school.x = x;
      school.y = y;
      school.baseX = x;
      school.baseY = y;
      return school;
    }
    if (kind === 'ARCHWAY') return new Archway();
    if (kind === 'LEDGES') return new Ledges();
    if (kind === 'LAB:CRACK' || kind === 'LAB:BEAM') return new LabBurster(kind, x);
    if (kind.startsWith('LAB:')) return new LabPiece(kind, x, y);
    if (kind.startsWith('PET:')) {
      const pet = new Pet(kind.slice(4), index ?? this.items.length, { drainScale: 0 });
      pet.x = x;
      pet.y = y;
      pet.waypointX = x;
      pet.waypointY = y;
      return pet;
    }
    if (kind === 'ENEMY:jelly') return new Jellyfish(x, y);
    if (kind === 'ENEMY:turtle') {
      const turtle = new Turtle();
      turtle.x = x;
      turtle.y = y;
      turtle.waypointX = x;
      turtle.waypointY = y;
      return turtle;
    }
    if (kind === 'ENEMY:puffer') {
      const puffer = new Pufferfish();
      puffer.x = x;
      puffer.y = y;
      return puffer;
    }
    if (kind === 'ENEMY:angler') {
      const angler = new Anglerfish();
      angler.x = x;
      angler.y = y;
      return angler;
    }
    if (kind === 'ENEMY:eel') {
      const eel = new DartEel();
      eel.x = x;
      eel.y = y;
      return eel;
    }
    if (kind === 'ENEMY:moray') {
      const moray = new Eel(x, y, Math.abs(Math.round(x + y)) % EEL_VARIANTS.length);
      moray.startHunt(null);
      return moray;
    }
    if (kind === 'ENEMY:seal') return new Seal(x, y);
    return new Coral(x, Math.abs(Math.round(x + y)) % 3);
  }

  save() {
    saveJSON(AQUARIUM_KEY, {
      items: this.items.map((item) => item.entry),
      chill: this.chill,
      labyrinth: { on: this.labyrinthOn, seed: this.labyrinthSeed },
    });
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2.2;
  }

  placeAt(x, y) {
    const kind = this.itemKind;
    if (HABITATS.includes(kind) && this.items.some((item) => item.entry.kind === kind)) {
      this.setStatus(`${this.itemLabel} IS ALREADY PLACED`);
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.2 });
      return;
    }
    const entry = { kind, x, y };
    this.items.push({ entry, entity: this.makeEntity(kind, x, y) });
    this.refreshGroups();
    this.save();
    this.setStatus(`${this.itemLabel} PLACED`);
    this.game.audio.tone({
      freq: 520 + this.itemIndex * 50,
      endFreq: 780,
      type: 'triangle',
      duration: 0.1,
      volume: 0.18,
    });
  }

  startDive() {
    const creature = DIVE_CREATURES[this.diveIndex];
    this.phase = 'dive';
    this.divePlayer = new creature.type(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, {
      controls: CONTROLS.solo,
      pointer: true,
      ...creature.options,
    });
    this.setStatus(`DIVING AS THE ${creature.label}`);
    this.game.audio.tone({ freq: 400, endFreq: 760, type: 'triangle', duration: 0.18, volume: 0.2 });
  }

  exitDive() {
    this.phase = 'build';
    this.divePlayer = null;
    this.setStatus('BACK AT THE WORKSHOP');
    this.game.audio.tone({ freq: 620, endFreq: 320, duration: 0.14, volume: 0.2 });
  }

  choose(item) {
    const pointer = this.game.input.pointer;
    const onMenu = this.menu.bounds.some(
      (bounds) =>
        pointer.x >= bounds.x &&
        pointer.x <= bounds.x + bounds.width &&
        pointer.y >= bounds.y &&
        pointer.y <= bounds.y + bounds.height,
    );
    if (pointer.down && !onMenu) {
      this.placeAt(clamp(pointer.x, 30, LOGICAL_WIDTH - 30), clamp(pointer.y, 70, LOGICAL_HEIGHT - 40));
      return;
    }
    if (item.action === 'dive') {
      this.startDive();
      return;
    }
    if (item.action === 'chill') {
      this.chill = !this.chill;
      this.menu.items[1].label = this.chillLabel;
      this.save();
      this.setStatus(
        this.chill
          ? 'CHILL MODE ON — RESIDENTS WANDER PEACEFULLY'
          : 'CHILL MODE OFF — RESIDENTS CHASE AGAIN',
      );
      this.game.audio.tone({
        freq: this.chill ? 620 : 320,
        duration: 0.08,
        volume: 0.18,
      });
      return;
    }
    if (item.action === 'undo') {
      const removed = this.items.pop();
      if (removed) {
        this.refreshGroups();
        this.save();
        this.setStatus('LAST ITEM REMOVED');
        this.game.audio.tone({ freq: 420, endFreq: 220, duration: 0.12, volume: 0.18 });
      } else {
        this.setStatus('NOTHING TO UNDO');
      }
      return;
    }
    if (item.action === 'clear') {
      this.items.length = 0;
      this.refreshGroups();
      this.save();
      this.setStatus('AQUARIUM CLEARED');
      this.game.audio.tone({ freq: 260, endFreq: 130, duration: 0.2, volume: 0.2 });
      return;
    }
    if (item.action === 'labyrinth') {
      this.toggleLabyrinth();
      return;
    }
    if (item.action === 'back') {
      this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.2 });
      this.game.changeScene('menu');
    }
  }

  bouncePuffer(puffer) {
    if (puffer.x < puffer.radius) {
      puffer.x = puffer.radius;
      puffer.vx = Math.abs(puffer.vx);
    } else if (puffer.x > LOGICAL_WIDTH - puffer.radius) {
      puffer.x = LOGICAL_WIDTH - puffer.radius;
      puffer.vx = -Math.abs(puffer.vx);
    }
    if (puffer.y < puffer.radius) {
      puffer.y = puffer.radius;
      puffer.vy = Math.abs(puffer.vy);
    } else if (puffer.y > LOGICAL_HEIGHT - puffer.radius) {
      puffer.y = LOGICAL_HEIGHT - puffer.radius;
      puffer.vy = -Math.abs(puffer.vy);
    }
  }

  updateEntity(item, dt, targets, nearby) {
    const { entry, entity } = item;
    const kind = entry.kind;
    if (kind === 'LAB:CRACK' || kind === 'LAB:BEAM') {
      this.updateBurster(entity, dt, targets);
      return;
    }
    if (kind.startsWith('LAB:')) return;
    if (kind.startsWith('PET:')) return;
    if (kind === 'ENEMY:jelly') {
      entity.update(dt);
      return;
    }
    if (kind === 'ENEMY:puffer') {
      entity.update(dt);
      this.bouncePuffer(entity);
      return;
    }
    if (kind === 'ENEMY:eel') {
      entity.update(dt, 0);
      return;
    }
    if (kind === 'ENEMY:moray') {
      entity.update(dt, targets, 1, nearby);
      return;
    }
    if (kind === 'ENEMY:turtle' || kind === 'ENEMY:angler' || kind === 'ENEMY:seal') {
      entity.update(dt, targets, 1);
      return;
    }
    entity.update(dt, 0);
  }

  burstBurster(burster) {
    const arms = burster.arms;
    const sharedCurl =
      (arms.length - 1) * LABYRINTH.burstStagger + LABYRINTH.burstThrustTime;
    arms
      .map((arm, index) => index)
      .sort((a, b) => Math.abs(a - (arms.length - 1) / 2) - Math.abs(b - (arms.length - 1) / 2) || a - b)
      .forEach((index, slot) => {
        const delay = slot * LABYRINTH.burstStagger;
        arms[index].burst(delay, sharedCurl - delay);
      });
    for (let index = 0; index < LABYRINTH.breachChunks; index += 1) {
      this.breachChunks.push(
        new BreachChunk(burster.x + rand(-14, 14), burster.y + rand(-8, 8), {
          angle: burster.angle + rand(-0.9, 0.9),
          speed: rand(150, 280),
          lift: Math.sin(burster.angle) * 70,
        }),
      );
    }
    this.particles.burst(burster.x, burster.y, {
      count: 14,
      speed: 220,
      life: 0.7,
      colors: [COLORS.wreckWood, COLORS.tentacleDark, COLORS.sandDark],
      buoyancy: -180,
    });
  }

  updateBurster(burster, dt, targets) {
    const diver = targets[0] ?? null;
    const floor = burster.kind === 'LAB:CRACK';
    for (const arm of burster.arms) {
      arm.update(dt, burster.x, null);
      if (!floor && diver !== null) {
        const stretching =
          burster.state === 'warn' || (arm.burstTimer > 0 && arm.burstAge < arm.retractAge);
        if (stretching) {
          const dx = diver.x - arm.x;
          const dy = diver.y - arm.y;
          const distance = Math.hypot(dx, dy) || 1;
          const down = Math.PI / 2;
          const lean = clamp(
            Math.atan2(dy, dx) - down,
            -LABYRINTH.ceilingBurstAim,
            LABYRINTH.ceilingBurstAim,
          );
          arm.angle = down + lean;
          arm.stretch = Math.min(
            distance,
            (LABYRINTH.grabberLength + LABYRINTH.grabberReach) * arm.lengthScale,
          );
        }
      }
      if (arm.burstTimer > 0 && !arm.erupted) {
        arm.erupted = true;
        this.shake = Math.max(this.shake, 0.22);
        this.game.audio.tone({
          freq: 240 + (arm.index % 3) * 60,
          endFreq: 80,
          type: 'sawtooth',
          duration: 0.16,
          volume: 0.18,
        });
        this.game.audio.tone({
          freq: 90,
          endFreq: 45,
          type: 'square',
          duration: 0.22,
          volume: 0.16,
          delay: 0.02,
        });
      }
    }
    const near =
      diver !== null &&
      Math.abs(diver.x - burster.x) < burster.triggerX &&
      (burster.triggerY === null || Math.abs(diver.y - burster.y) < burster.triggerY);
    if (burster.state === 'idle') {
      burster.timer = Math.max(0, burster.timer - dt);
      if (near && burster.timer <= 0) {
        burster.state = 'warn';
        burster.timer = burster.warn;
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
    if (burster.state === 'warn') {
      burster.timer -= dt;
      if (burster.timer <= 0) {
        burster.state = 'burst';
        this.burstBurster(burster);
        this.shake = Math.max(this.shake, 0.3);
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
    if (diver && diver.invulnerable <= 0) {
      for (const arm of burster.arms) {
        if (arm.reach < 1 || arm.curlGrow < LABYRINTH.burstGrabAfter) {
          continue;
        }
        let caught = false;
        for (const t of [0.1, 0.25, 0.45, 0.65, 0.85, 1]) {
          const point = arm.pointAt(t);
          if (Math.hypot(diver.x - point.x, diver.y - point.y) < diver.radius + LABYRINTH.grabRadius) {
            caught = true;
            break;
          }
        }
        if (!caught && !floor) {
          const tip = arm.basePointAt(1);
          if (Math.hypot(diver.x - tip.x, diver.y - tip.y) < diver.radius + LABYRINTH.grabRadius) {
            caught = true;
          }
        }
        if (caught) {
          this.bump(diver, burster);
          this.shake = Math.max(this.shake, 0.4);
          this.game.audio.tone({
            freq: 160,
            endFreq: 70,
            type: 'square',
            duration: 0.3,
            volume: 0.28,
          });
          return;
        }
      }
    }
    if (
      burster.arms.every(
        (arm) => arm.burstDelay <= 0 && arm.burstTimer <= 0 && arm.reach <= 0.02,
      )
    ) {
      burster.state = 'idle';
      burster.timer = burster.cooldown;
    }
  }

  bump(player, entity) {
    if (typeof entity.bite === 'function') entity.bite();
    const dx = player.x - entity.x;
    const dy = player.y - entity.y;
    const length = Math.hypot(dx, dy) || 1;
    player.x = clamp(player.x + (dx / length) * 34, player.radius, LOGICAL_WIDTH - player.radius);
    player.y = clamp(player.y + (dy / length) * 34, player.radius, LOGICAL_HEIGHT - player.radius);
    player.invulnerable = 1.2;
    this.particles.burst(player.x, player.y, {
      count: 10,
      speed: 130,
      life: 0.5,
      colors: [COLORS.bubble, '#ffffff'],
      buoyancy: -20,
    });
    this.game.audio.tone({ freq: 220, endFreq: 120, type: 'triangle', duration: 0.18, volume: 0.2 });
  }

  renderLabyrinth(ctx) {
    if (!this.labyrinth) return;
    const maze = this.labyrinth;
    for (const beam of maze.beams) {
      ctx.strokeStyle = 'rgba(14, 10, 8, 0.85)';
      ctx.lineWidth = 2.4;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(beam.x - 26 + i * 24, 8);
        ctx.lineTo(beam.x - 16 + i * 24 + Math.sin(this.time * 2 + beam.phase) * 2, 30);
        ctx.lineTo(beam.x - 6 + i * 20, 42);
        ctx.stroke();
      }
    }
    for (const wall of maze.walls) {
      const gradient = ctx.createLinearGradient(wall.x, 0, wall.x + wall.w, 0);
      gradient.addColorStop(0, COLORS.wreckWoodDark);
      gradient.addColorStop(0.5, COLORS.wreckWood);
      gradient.addColorStop(1, COLORS.wreckWoodDark);
      ctx.fillStyle = gradient;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.strokeStyle = 'rgba(26, 18, 12, 0.6)';
      ctx.lineWidth = 2;
      for (let y = wall.y + 34; y < wall.y + wall.h - 10; y += 54) {
        ctx.beginPath();
        ctx.moveTo(wall.x + 3, y);
        ctx.lineTo(wall.x + wall.w - 3, y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(92, 122, 74, 0.3)';
      ctx.beginPath();
      ctx.ellipse(
        wall.x + wall.w * 0.4,
        wall.y <= 0 ? wall.y + wall.h : wall.y + 12,
        18,
        7,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    for (const tunnel of maze.tunnels) {
      const tx = tunnel.x + 6;
      const ty = tunnel.y;
      const tw = tunnel.w - 12;
      const th = tunnel.h;
      const tr = th / 2;
      ctx.save();
      roundRectClip(ctx, tx, ty, tw, th, tr);
      drawShadowedPlanks(ctx, tx, ty, tw, th);
      ctx.restore();
      strokeRoundRect(ctx, tx, ty, tw, th, tr, COLORS.wreckWoodDark, 5);
    }
    for (const support of maze.supports) {
      const x = support.x - support.w / 2;
      const gradient = ctx.createLinearGradient(x, 0, x + support.w, 0);
      gradient.addColorStop(0, COLORS.wreckWoodDark);
      gradient.addColorStop(0.5, COLORS.wreckWood);
      gradient.addColorStop(1, COLORS.wreckWoodDark);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, -20, support.w, support.h + 20);
      ctx.strokeStyle = 'rgba(26, 18, 12, 0.6)';
      ctx.lineWidth = 2;
      for (let y = 46; y < support.h - 10; y += 66) {
        ctx.beginPath();
        ctx.moveTo(x + 2, y);
        ctx.lineTo(x + support.w - 2, y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(14, 10, 8, 0.85)';
      ctx.lineWidth = 2.6;
      for (let i = 0; i < 4; i += 1) {
        const cy = 70 + ((i * 127 + support.x * 53) % 240);
        ctx.beginPath();
        ctx.moveTo(x + 6, cy);
        ctx.lineTo(x + support.w * 0.55, cy + 18);
        ctx.lineTo(x + support.w - 8, cy + 34);
        ctx.stroke();
      }
    }
    const baseY = LOGICAL_HEIGHT - SAND.height + 16;
    for (const crack of maze.cracks) {
      ctx.fillStyle = 'rgba(24, 16, 12, 0.85)';
      ctx.beginPath();
      ctx.ellipse(crack.x, baseY, 42, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(10, 7, 6, 0.9)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 6; i += 1) {
        const angle = -Math.PI + (i / 5) * Math.PI + Math.sin(crack.phase + i) * 0.2;
        const length = 26 + ((i * 37) % 34);
        ctx.beginPath();
        ctx.moveTo(crack.x, baseY);
        ctx.lineTo(crack.x + Math.cos(angle) * length * 0.6, baseY + Math.sin(angle) * length * 0.6);
        ctx.lineTo(
          crack.x + Math.cos(angle + 0.3) * length,
          baseY + Math.sin(angle + 0.3) * length,
        );
        ctx.stroke();
      }
    }
  }

  update(dt) {
    this.time += dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    const input = this.game.input;
    let players = [];
    if (this.phase === 'dive') {
      if (input.wasPressed('back')) {
        this.exitDive();
        return;
      }
      if (this.divePlayer) {
        this.divePlayer.update(dt, input, null);
        if (this.labyrinth) {
          for (const wall of this.labyrinth.walls) resolveCircleRect(this.divePlayer, wall);
          for (const support of this.labyrinth.supports) {
            resolveCircleRect(this.divePlayer, {
              x: support.x - support.w / 2,
              y: -20,
              w: support.w,
              h: support.h + 20,
            });
          }
        }
        for (const item of this.items) {
          if (!(item.entity instanceof LabPiece)) continue;
          for (const rect of item.entity.rects) resolveCircleRect(this.divePlayer, rect);
        }
        players = [this.divePlayer];
      }
    } else {
      if (input.wasPressed('back')) {
        this.game.changeScene('menu');
        return;
      }
      const selected = this.menu.selected;
      if (selected && (selected.action === 'item' || selected.action === 'dive')) {
        if (input.wasPressed('left')) this.cycle(-1);
        if (input.wasPressed('right')) this.cycle(1);
      }
      this.menu.update(dt, input);
    }
    const targets = this.chill ? [] : players;
    for (const item of this.items) this.updateEntity(item, dt, targets, players);
    for (const chunk of this.breachChunks) chunk.update(dt);
    this.breachChunks = this.breachChunks.filter((chunk) => chunk.alive);
    const threats = this.chill ? [] : this.enemyEntities;
    for (const pet of this.pets) pet.update(dt, [], threats, this.pets);
    if (!this.chill && players.length > 0 && this.divePlayer.invulnerable <= 0) {
      for (const entity of this.enemyEntities) {
        if (circleOverlap(this.divePlayer, entity)) {
          this.bump(this.divePlayer, entity);
          break;
        }
      }
    }
    this.particles.update(dt);
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    const sandTop = LOGICAL_HEIGHT - SAND.height;
    const gradient = ctx.createLinearGradient(0, sandTop, 0, LOGICAL_HEIGHT);
    gradient.addColorStop(0, COLORS.sandDark);
    gradient.addColorStop(1, COLORS.sand);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, sandTop, LOGICAL_WIDTH, SAND.height);
    this.renderLabyrinth(ctx);
    for (const item of this.items) {
      if (HABITATS.includes(item.entry.kind)) item.entity.render(ctx);
    }
    for (const item of this.items) {
      if (!HABITATS.includes(item.entry.kind)) item.entity.render(ctx);
    }
    if (this.divePlayer) this.divePlayer.render(ctx);
    for (const chunk of this.breachChunks) chunk.render(ctx);
    this.particles.render(ctx);

    const pointer = this.game.input.pointer;
    if (this.phase === 'build' && pointer.x > 0 && pointer.y > 0) {
      fillCircle(ctx, pointer.x, pointer.y, 14, 'rgba(207, 239, 255, 0.22)');
    }

    drawText(ctx, 'AQUARIUM BUILDER', LOGICAL_WIDTH / 2, 66, {
      size: 34,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 20,
    });
    drawText(
      ctx,
      this.phase === 'dive'
        ? `DIVING AS THE ${this.diveLabel} — ${this.items.length} ITEMS IN THE TANK${this.labyrinthOn ? ' — LABYRINTH MODE' : ''}`
        : `PALETTE: ${this.itemLabel} — ${this.items.length} ITEMS PLACED${this.labyrinthOn ? ' — LABYRINTH MODE' : ''}`,
      LOGICAL_WIDTH / 2,
      102,
      {
        size: 14,
        color: COLORS.accent,
        alpha: 0.9,
      },
    );
    drawText(
      ctx,
      this.phase === 'dive'
        ? this.chill
          ? 'CHILL MODE IS ON — RESIDENTS WANDER AND NOTHING CAN TOUCH YOU'
          : 'BUMPING A RESIDENT ONLY KNOCKS YOU BACK — NOTHING HERE CAN HURT YOU'
        : this.labyrinthOn
          ? 'FLOOR PIECES SNAP DOWN — WRECK PIECES BUILD YOUR OWN LABYRINTH — BURSTERS BITE'
          : 'FLOOR PIECES SNAP DOWN — ICE, SARDINES, PETS, AND ENEMIES FLOAT WHERE PLACED',
      LOGICAL_WIDTH / 2,
      130,
      {
        size: 12,
        color: COLORS.textDim,
        alpha: 0.8,
      },
    );
    if (this.phase === 'build') this.menu.render(ctx, MENU_X, MENU_Y);
    if (this.status && this.statusTimer > 0) {
      drawText(ctx, this.status, MENU_X, MENU_Y + 150, {
        size: 13,
        color: COLORS.accent,
        alpha: Math.min(1, this.statusTimer),
      });
    }
    drawText(
      ctx,
      this.phase === 'dive'
        ? this.labyrinthOn
          ? 'WASD, ARROWS, OR DRAG TO SWIM      MAZE WALLS BLOCK — TUNNELS LEAD THROUGH      ESC — BACK'
          : 'WASD, ARROWS, OR DRAG TO SWIM      ESC — BACK TO THE WORKSHOP'
        : 'CLICK THE TANK TO PLACE      LEFT/RIGHT — BROWSE      ESC — BACK',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 26,
      {
        size: 12,
        color: COLORS.textDim,
      },
    );
    if (this.phase === 'dive') drawJoystick(ctx, joystickState(this.game.input));
  }
}
