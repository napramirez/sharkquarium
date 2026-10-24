import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { drawWater, drawText, fillCircle } from '../engine/render.js';
import { drawJoystick, joystickState } from '../engine/joystick.js';
import { ParticleSystem } from '../engine/particles.js';
import { circleOverlap } from '../engine/collision.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { clamp } from '../engine/math.js';
import { Coral } from '../entities/coral.js';
import { ReefRock } from '../entities/reefrock.js';
import { Weed } from '../entities/weed.js';
import { IceChunk } from '../entities/icechunk.js';
import { SardineSchool } from '../entities/sardineschool.js';
import { Archway } from '../entities/archway.js';
import { Ledges } from '../entities/ledges.js';
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
    const entries = Array.isArray(saved.items) ? saved.items : [];
    this.items = entries.map((entry, index) => ({
      entry,
      entity: this.makeEntity(entry.kind, entry.x, entry.y, index),
    }));
    this.itemIndex = 0;
    this.menu = new SelectList(
      [
        { label: `DIVE AS: ${this.diveLabel}`, action: 'dive' },
        { label: this.chillLabel, action: 'chill' },
        { label: 'ITEM', action: 'item' },
        { label: 'UNDO', action: 'undo' },
        { label: 'CLEAR ALL', action: 'clear' },
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

  get itemKind() {
    return AQUARIUM.kinds[this.itemIndex].key;
  }

  get itemLabel() {
    return AQUARIUM.kinds[this.itemIndex].label;
  }

  get diveLabel() {
    return DIVE_CREATURES[this.diveIndex].label;
  }

  get chillLabel() {
    return `CHILL MODE: ${this.chill ? 'ON' : 'OFF'}`;
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
    const count = AQUARIUM.kinds.length;
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
    for (const item of this.items) {
      if (HABITATS.includes(item.entry.kind)) item.entity.render(ctx);
    }
    for (const item of this.items) {
      if (!HABITATS.includes(item.entry.kind)) item.entity.render(ctx);
    }
    if (this.divePlayer) this.divePlayer.render(ctx);
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
        ? `DIVING AS THE ${this.diveLabel} — ${this.items.length} ITEMS IN THE TANK`
        : `PALETTE: ${this.itemLabel} — ${this.items.length} ITEMS PLACED`,
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
        ? 'WASD, ARROWS, OR DRAG TO SWIM      ESC — BACK TO THE WORKSHOP'
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
