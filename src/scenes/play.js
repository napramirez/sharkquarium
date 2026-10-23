import { Scene } from '../engine/scene.js';
import { SelectList } from '../engine/selectlist.js';
import { Shark } from '../entities/shark.js';
import { Stingray } from '../entities/stingray.js';
import { Squid } from '../entities/squid.js';
import { ArcticShrimp } from '../entities/arcticshrimp.js';
import { MoonJelly } from '../entities/moonjelly.js';
import { Bubble } from '../entities/bubble.js';
import { GoldenBubble } from '../entities/goldenbubble.js';
import { Jellyfish } from '../entities/jellyfish.js';
import { Angelfish } from '../entities/angelfish.js';
import { Shrimp } from '../entities/shrimp.js';
import { Crab } from '../entities/crab.js';
import { Plankton } from '../entities/plankton.js';
import { Minnow } from '../entities/minnow.js';
import { Eel } from '../entities/eel.js';
import { Anglerfish } from '../entities/anglerfish.js';
import { Seal } from '../entities/seal.js';
import { Turtle } from '../entities/turtle.js';
import { Log } from '../entities/log.js';
import { Rock } from '../entities/rock.js';
import { Weed } from '../entities/weed.js';
import { PiranhaSchool } from '../entities/piranha.js';
import { ElectricEel } from '../entities/electriceel.js';
import { Catfish } from '../entities/catfish.js';
import { Nautilus } from '../entities/nautilus.js';
import { ChaserShark } from '../entities/chasershark.js';
import { WhaleSkeleton } from '../entities/whaleskeleton.js';
import { DartEel } from '../entities/darteel.js';
import { BaitSquid } from '../entities/baitsquid.js';
import { KelpCrab } from '../entities/kelpcrab.js';
import { KelpForest } from '../entities/kelpforest.js';
import { Octopus } from '../entities/octopus.js';
import { Decor } from '../entities/decor.js';
import { Archway } from '../entities/archway.js';
import { Ledges } from '../entities/ledges.js';
import { IceChunk } from '../entities/icechunk.js';
import { SardineSchool } from '../entities/sardineschool.js';
import { Coral } from '../entities/coral.js';
import { ReefRock } from '../entities/reefrock.js';
import { ColorSchool } from '../entities/colorschool.js';
import { CurrentZone } from '../entities/currentzone.js';
import { UpdraftZone } from '../entities/updraftzone.js';
import { Hud, hitPauseButton } from '../ui/hud.js';
import { drawJoystick, joystickState } from '../engine/joystick.js';
import { ParticleSystem } from '../engine/particles.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, distance, lerp, rand, TAU } from '../engine/math.js';
import {
  drawWater,
  drawText,
  fillCircle,
  fillRoundRect,
  strokeRoundRect,
} from '../engine/render.js';
import {
  ARCTIC_TRACK,
  CATFISH_TRACK,
  DEEPSEA_TRACK,
  KELP_TRACK,
  NAUTILUS_TRACK,
  REEF_TRACK,
  STINGRAY_TRACK,
  TURTLE_TRACK,
} from '../assets/tracks.js';
import { drawSkinAura, setActiveSkin, setSkinClock, skinByKey } from '../engine/skin.js';
import { accessoryByKey, setActiveAccessory } from '../engine/accessory.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { recordMinigame } from '../engine/progress.js';
import {
  ANGELFISH,
  ANGLER,
  ARCTIC,
  ARCTIC_PALETTE,
  CATFISH,
  COLORS,
  COLORSCHOOL,
  CONTROLS,
  CORAL,
  CRAB,
  DEEPSEA,
  DEEPSEA_PALETTE,
  DIFFICULTY,
  EEL,
  ELECTRIC_EEL,
  COINS,
  COINS_KEY,
  FRESHWATER,
  FRESHWATER_PALETTE,
  GOLDEN,
  JELLY,
  JELLY_PALETTE,
  KELP,
  KELP_PALETTE,
  MINNOW,
  NAUTILUS,
  NAUTILUS_PALETTE,
  OCTOPUS,
  PLANKTON,
  REEF_ROCK,
  RACE,
  ROUND,
  SAND,
  SEAL,
  SETTINGS_KEY,
  SHOP_KEY,
  SHRIMP,
  STATS_KEY,
  STINGRAY,
  STORAGE_KEY,
  TURTLE,
  WATER_PALETTE,
  ZONES,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const TANK_TRACKS = {
  reef: REEF_TRACK,
  stingray: STINGRAY_TRACK,
  deepsea: DEEPSEA_TRACK,
  arctic: ARCTIC_TRACK,
  kelp: KELP_TRACK,
  jelly: TURTLE_TRACK,
  freshwater: CATFISH_TRACK,
  nautilus: NAUTILUS_TRACK,
};

export class PlayScene extends Scene {
  enter(params = {}) {
    this.params = params;
    this.empty = Boolean(params.empty);
    this.race = Boolean(params.race);
    this.difficultyKey = loadJSON(SETTINGS_KEY, {}).difficulty ?? 'normal';
    this.rules = this.race ? DIFFICULTY.normal : DIFFICULTY[this.difficultyKey] ?? DIFFICULTY.normal;
    this.eelNeed = Math.max(1, Math.round(EEL.bubblesPerHunt * this.rules.chargeScale));
    this.sealNeed = Math.max(1, Math.round(SEAL.chargePlankton * this.rules.chargeScale));
    this.coop = this.race || Boolean(params.coop);
    this.skin = skinByKey(loadJSON(SHOP_KEY, {}).skin);
    this.accessory = accessoryByKey(loadJSON(SHOP_KEY, {}).accessory);
    this.tank = params.tank ?? 'reef';
    this.stingrayTank = this.tank === 'stingray';
    this.deepsea = this.tank === 'deepsea';
    this.arctic = this.tank === 'arctic';
    this.jellyTank = this.tank === 'jelly';
    this.freshwater = this.tank === 'freshwater';
    this.nautilusTank = this.tank === 'nautilus';
    this.kelp = this.tank === 'kelp';
    const carry = params.carry ?? null;
    this.timeLimit = this.race
      ? RACE.duration
      : this.empty
        ? ROUND.emptyDuration
        : ROUND.duration * this.rules.timeScale;
    const PlayerClass = this.jellyTank
      ? MoonJelly
      : this.arctic
        ? ArcticShrimp
        : this.deepsea
          ? Squid
          : this.stingrayTank || this.freshwater
            ? Stingray
            : this.nautilusTank
              ? Nautilus
              : this.kelp
                ? KelpCrab
                : Shark;
    const spawns = this.coop
      ? [
          { x: LOGICAL_WIDTH * 0.42, y: LOGICAL_HEIGHT / 2, controls: CONTROLS.p1, pointer: true },
          { x: LOGICAL_WIDTH * 0.58, y: LOGICAL_HEIGHT / 2, controls: CONTROLS.p2, pointer: false },
        ]
      : [{ x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT / 2, controls: CONTROLS.solo, pointer: true }];
    this.players = spawns.map(
      (spawn) => new PlayerClass(spawn.x, spawn.y, { controls: spawn.controls, pointer: spawn.pointer }),
    );
    this.player = this.players[0];
    this.playerBubbles = this.players.map(() => 0);
    this.wasConcealed = this.players.map(() => false);
    if (this.freshwater) {
      this.players.forEach((player, index) => {
        player.bodyColor = COLORS.rayFresh;
        player.spotColor = COLORS.raySpot;
        player.eyeColor = '#0a0a0a';
        player.autoScrollX = FRESHWATER.playerX + (this.coop ? (index === 0 ? -45 : 45) : 0);
        player.x = player.autoScrollX;
      });
    }
    if (this.nautilusTank) {
      this.players.forEach((player, index) => {
        player.x = LOGICAL_WIDTH / 2 + (this.coop ? (index === 0 ? -45 : 45) : 0);
        player.autoScrollY = NAUTILUS.playerY;
        player.y = player.autoScrollY;
      });
    }
    this.bubbles = [];
    this.hazards = [];
    this.bonus = [];
    this.zones = [];
    this.archway = this.stingrayTank ? new Archway() : null;
    this.eels = this.archway
      ? this.archway.holes.map((hole, index) => new Eel(hole.x, hole.y, index))
      : [];
    this.eelPhase = this.eels.length > 0 ? 'hidden' : null;
    this.eelTimer = 0;
    this.eelCharge = 0;
    this.ledges = this.deepsea ? new Ledges() : null;
    this.anglers = [];
    if (this.deepsea) {
      const zoneWidth = LOGICAL_WIDTH / DEEPSEA.anglerCount;
      for (let i = 0; i < DEEPSEA.anglerCount; i += 1) {
        const center = zoneWidth * (i + 0.5);
        let angler = new Anglerfish(center);
        let clearance = this.anglerClearance(angler);
        for (let attempt = 1; attempt < ANGLER.spawnAttempts; attempt += 1) {
          const candidate = new Anglerfish(center);
          const candidateClearance = this.anglerClearance(candidate);
          if (candidateClearance > clearance) {
            angler = candidate;
            clearance = candidateClearance;
          }
        }
        this.anglers.push(angler);
      }
    }
    this.icechunk = this.arctic ? new IceChunk() : null;
    this.schools = this.arctic
      ? Array.from({ length: ARCTIC.schoolCount }, () => new SardineSchool())
      : [];
    this.seals = this.icechunk
      ? this.icechunk.perches.map((perch) => new Seal(perch.x, perch.y))
      : [];
    this.sealPhase = this.seals.length > 0 ? 'perched' : null;
    this.sealTimer = 0;
    this.sealCharge = 0;
    this.turtle = this.jellyTank ? this.spawnBoss(Turtle) : null;
    this.octopus = this.kelp ? this.spawnBoss(Octopus) : null;
    this.kelpStalks = this.kelp ? new KelpForest() : null;
    this.decor = new Decor(this.tank);
    this.minnows = [];
    this.minnowTimer = rand(2, 4);
    this.jellyPoints = 0;
    this.jellyCleared = false;
    this.catfish = this.freshwater ? new Catfish() : null;
    this.logs = [];
    this.rocks = [];
    this.piranhas = [];
    this.weeds = [];
    this.electricEels = [];
    this.skeletons = [];
    this.dartEels = [];
    this.baitSquids = [];
    this.nautilusShark = this.nautilusTank ? new ChaserShark() : null;
    this.corals = this.tank === 'reef' && !this.empty ? this.buildCorals() : [];
    this.reefRocks = this.tank === 'reef' && !this.empty
      ? [new ReefRock(-1), new ReefRock(1)]
      : [];
    this.colorSchools = [];
    this.difficulty = 0;
    this.scrollSpeed = this.nautilusTank ? NAUTILUS.scrollSpeed : FRESHWATER.scrollSpeed;
    this.eelTimer = rand(4, 6);
    this.logTimer = rand(1.5, 3);
    this.rockTimer = rand(2.5, 4.5);
    this.piranhaTimer = rand(2.5, 4);
    this.weedTimer = rand(1.2, 2.4);
    this.bubbleRowTimer = rand(0.8, 1.6);
    this.skeletonTimer = rand(1.5, 3);
    this.dartEelTimer = rand(2, 3.5);
    this.baitSquidTimer = rand(2.5, 4);
    this.speckles = this.stingrayTank || this.freshwater || this.kelp
      ? Array.from({ length: SAND.speckles }, () => ({
          x: rand(4, LOGICAL_WIDTH - 4),
          y: rand(SAND.height - 56, SAND.height - 8),
          radius: rand(1, 2.6),
          alpha: rand(0.15, 0.4),
        }))
      : [];
    this.particles = new ParticleSystem();
    this.score = carry ? carry.score : 0;
    this.best = loadJSON(STORAGE_KEY, 0);
    this.timeLeft = carry ? carry.timeLeft : this.timeLimit;
    this.bubblesCollected = carry ? carry.bubblesCollected : 0;
    this.elapsed = carry ? carry.elapsed : 0;
    this.ramp = 0;
    this.tankBubbles = 0;
    this.tankPlankton = 0;
    this.bubbleTimer = 0.4;
    this.hazardTimer = ROUND.hazardSpawnMin + 2;
    this.bonusTimer = this.arctic ? rand(1.5, 3) : rand(8, 12);
    this.zoneTimer = rand(6, 10);
    this.colorTimer = rand(COLORSCHOOL.spawnMin, COLORSCHOOL.spawnMax);
    this.paused = false;
    this.flash = 0;
    this.shake = 0;
    this.time = 0;
    this.teleported = false;
    if (this.game.music) {
      this.game.music.paused = false;
      if (!this.empty) {
        this.game.music.hold = false;
        this.game.music.play(TANK_TRACKS[this.tank] ?? REEF_TRACK);
      }
    }
    this.hud = new Hud();
    this.pauseMenu = new SelectList(
      [
        { label: 'RESUME', action: 'resume' },
        { label: 'RESTART', action: 'restart' },
        { label: 'QUIT TO MENU', action: 'menu' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.handlePauseAction(item.action),
      },
    );
    this.pauseMenu.reset();
    if (carry) {
      for (const player of this.players) {
        this.particles.burst(player.x, player.y, {
          count: 26,
          speed: 260,
          life: 0.8,
          size: 4,
          colors: [COLORS.bubble, COLORS.foam, '#ffffff'],
          buoyancy: -30,
        });
      }
    }
  }

  replayParams() {
    const base = {};
    if (this.empty) base.empty = true;
    if (this.race) base.race = true;
    if (this.coop) base.coop = true;
    if (this.tank !== 'reef') base.tank = this.tank;
    return base;
  }

  nearestVisible() {
    for (const player of this.players) {
      if (player.concealed !== true) return player;
    }
    return this.player;
  }

  spawnBoss(BossClass) {
    let boss = new BossClass();
    for (
      let attempt = 0;
      attempt < 24 &&
      this.players.some((player) => Math.hypot(boss.x - player.x, boss.y - player.y) < 150);
      attempt += 1
    ) {
      boss = new BossClass();
    }
    return boss;
  }

  schoolNear(player) {
    for (const school of this.schools) {
      if (school.contains(player.x, player.y)) return school;
    }
    return null;
  }

  hudState() {
    return {
      score: this.score,
      best: this.best,
      timeLeft: this.timeLeft,
      timeLimit: this.timeLimit,
      empty: this.empty,
      coop: this.coop,
      tank: this.tank === 'reef' ? null : this.tank,
      eel: this.eelPhase,
      eelCharge: this.eelCharge,
      eelNeed: this.eelNeed,
      angler: this.deepsea ? this.anglerStatus() : null,
      seal: this.sealPhase,
      sealCharge: this.sealCharge,
      sealNeed: this.sealNeed,
      turtle: this.turtle ? this.turtle.state : null,
      octopus: this.octopus ? this.octopus.state : null,
      minibossPoints: this.jellyPoints,
      catfish: this.catfish
        ? this.catfish.state !== 'stunned' && this.catfish.x < 0
          ? 'lurking'
          : this.catfish.state
        : null,
      nautilus: this.nautilusShark
        ? this.nautilusShark.state !== 'distracted' && this.nautilusShark.y < 0
          ? 'lurking'
          : this.nautilusShark.state
        : null,
      depth: this.nautilusTank ? this.difficulty : 0,
      race: this.race ? this.playerBubbles : null,
      sunrise: this.freshwater ? this.difficulty : 0,
      hidden: this.players.every((player) => player.concealed === true),
    };
  }

  anglerStatus() {
    if (this.anglers.some((angler) => angler.mode === 'chase')) return 'chase';
    if (this.anglers.some((angler) => angler.mode === 'search')) return 'search';
    return 'roam';
  }

  feedShark(squid) {
    squid.kill();
    this.nautilusShark.stun();
    this.particles.burst(squid.x, squid.y, {
      count: 16,
      speed: 200,
      life: 0.6,
      colors: [COLORS.squid, COLORS.accent, '#ffffff'],
      buoyancy: -20,
    });
    this.game.audio.tone({ freq: 420, endFreq: 180, type: 'triangle', duration: 0.3, volume: 0.24 });
  }

  anglerClearance(angler) {
    let nearest = Infinity;
    for (const player of this.players) {
      nearest = Math.min(nearest, distance(angler.x, angler.y, player.x, player.y));
    }
    return nearest;
  }

  separateAnglers() {
    const min = ANGLER.separation;
    for (let i = 0; i < this.anglers.length; i += 1) {
      for (let j = i + 1; j < this.anglers.length; j += 1) {
        const a = this.anglers[i];
        const b = this.anglers[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist === 0) {
          const angle = (((i + j) % 4) * TAU) / 4;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          dist = 1;
        }
        if (dist >= min) continue;
        const push = (min - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
    for (const angler of this.anglers) {
      angler.x = clamp(angler.x, ANGLER.radius, LOGICAL_WIDTH - ANGLER.radius);
      angler.y = clamp(angler.y, ANGLER.radius, LOGICAL_HEIGHT - ANGLER.radius);
    }
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.pointer.down && input.wasPressed('confirm') && hitPauseButton(input.pointer.x, input.pointer.y)) {
      this.setPaused(!this.paused);
      return;
    }
    if (input.wasPressed('pause')) this.setPaused(!this.paused);
    if (this.paused) {
      this.pauseMenu.update(dt, input);
      return;
    }
    this.elapsed += dt;
    this.ramp = clamp(this.elapsed / (ROUND.rampDuration * this.rules.rampScale), 0, 1);
    if (this.freshwater) {
      this.difficulty = clamp(this.tankBubbles / FRESHWATER.goalBubbles, 0, 1);
      this.scrollSpeed = lerp(
        FRESHWATER.scrollSpeed,
        FRESHWATER.scrollSpeed * FRESHWATER.scrollRamp,
        this.difficulty,
      );
    }
    if (this.nautilusTank) {
      this.difficulty = clamp(this.tankBubbles / NAUTILUS.goalBubbles, 0, 1);
      this.scrollSpeed = lerp(
        NAUTILUS.scrollSpeed,
        NAUTILUS.scrollSpeed * NAUTILUS.scrollRamp,
        this.difficulty,
      );
    }
    for (const school of this.schools) school.update(dt);
    for (const coral of this.corals) coral.update(dt);
    for (const school of this.colorSchools) school.update(dt);
    this.colorSchools = this.colorSchools.filter((school) => school.alive);
    if (this.freshwater) {
      this.players.forEach((player, index) => {
        const base = FRESHWATER.playerX + (this.coop ? (index === 0 ? -45 : 45) : 0);
        player.autoScrollX = base - (player.tangleTimer > 0 ? FRESHWATER.tangleDrag : 0);
      });
    }
    for (const player of this.players) {
      const context = this.ledges
        ? this.ledges.findHoleNear(player.x, player.y)
        : this.arctic
          ? this.schoolNear(player)
          : null;
      player.update(dt, input, context);
    }
    this.hud.update(dt, this.hudState());
    this.updateHideFeedback();
    this.updateSpawning(dt);
    this.updateEntities(dt);
    this.updateZones(dt);
    this.updateCollisions();
    if (!this.empty && !this.race && !this.teleported) {
      if (this.tank === 'reef' && this.score >= STINGRAY.teleportScore) {
        this.teleport('stingray');
        return;
      }
      if (this.tank === 'stingray' && this.score >= DEEPSEA.teleportScore) {
        this.teleport('deepsea');
        return;
      }
      if (this.tank === 'deepsea' && this.tankBubbles >= ARCTIC.teleportBubbles) {
        this.teleport('arctic');
        return;
      }
      if (this.tank === 'arctic' && this.tankPlankton >= ARCTIC.teleportPlankton) {
        this.teleport('kelp');
        return;
      }
      if (this.tank === 'kelp' && this.tankBubbles >= KELP.teleportBubbles) {
        this.teleport('jelly');
        return;
      }
    }
    if (this.jellyTank && !this.jellyCleared && this.jellyPoints >= JELLY.clearPoints) {
      this.jellyCleared = true;
      this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.18, volume: 0.22 });
      this.game.audio.tone({ freq: 659, type: 'triangle', duration: 0.18, volume: 0.22, delay: 0.12 });
      this.game.audio.tone({ freq: 784, type: 'triangle', duration: 0.18, volume: 0.22, delay: 0.24 });
      this.game.audio.tone({ freq: 1047, type: 'triangle', duration: 0.26, volume: 0.22, delay: 0.36 });
      this.teleport('nautilus');
      return;
    }
    if (this.freshwater && !this.teleported && this.tankBubbles >= FRESHWATER.goalBubbles) {
      this.teleported = true;
      this.game.changeScene('dawn', { ...this.completionPayload(), goal: FRESHWATER.goalBubbles });
      return;
    }
    if (this.nautilusTank && !this.teleported && this.tankBubbles >= NAUTILUS.goalBubbles) {
      this.teleport('freshwater');
      return;
    }
    this.updateTimer(dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);
  }

  teleport(targetTank) {
    this.teleported = true;
    this.game.changeScene('descent', {
      tank: targetTank,
      payload: {
        coop: this.coop,
        carry: {
          score: this.score,
          timeLeft: this.timeLeft,
          bubblesCollected: this.bubblesCollected,
          elapsed: this.elapsed,
        },
      },
    });
  }

  setPaused(paused) {
    if (this.paused === paused) return;
    this.paused = paused;
    if (this.game.music) this.game.music.paused = paused;
    if (paused) this.pauseMenu.reset();
    this.game.audio.tone({ freq: paused ? 300 : 560, duration: 0.08, volume: 0.15 });
  }

  handlePauseAction(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.14, volume: 0.18 });
    if (action === 'resume') this.setPaused(false);
    else if (action === 'restart') this.game.changeScene('play', this.replayParams());
    else if (action === 'menu') this.game.changeScene('menu');
  }

  updateHideFeedback() {
    for (let index = 0; index < this.players.length; index += 1) {
      const player = this.players[index];
      const concealed = player.concealed === true;
      if (concealed === this.wasConcealed[index]) continue;
      this.wasConcealed[index] = concealed;
      if (this.stingrayTank) {
        const sandTop = LOGICAL_HEIGHT - SAND.height;
        if (concealed) {
          this.game.audio.tone({ freq: 220, endFreq: 90, duration: 0.25, volume: 0.18 });
          this.particles.burst(player.x, sandTop + 6, {
            count: 12,
            speed: 70,
            life: 0.5,
            size: 3,
            colors: [COLORS.sand, COLORS.sandDark],
          });
        } else {
          this.game.audio.tone({ freq: 120, endFreq: 380, duration: 0.2, volume: 0.16 });
          this.particles.burst(player.x, player.y, {
            count: 8,
            speed: 90,
            life: 0.4,
            size: 3,
            colors: [COLORS.sand, COLORS.bubble],
          });
        }
      } else if (this.deepsea) {
        if (concealed) {
          this.game.audio.tone({ freq: 320, endFreq: 140, duration: 0.22, volume: 0.18 });
          this.particles.burst(player.x, player.y, {
            count: 12,
            speed: 90,
            life: 0.6,
            size: 4,
            colors: [COLORS.squid, '#7a4a52', '#02080f'],
          });
        } else {
          this.game.audio.tone({ freq: 140, endFreq: 420, duration: 0.18, volume: 0.16 });
          this.particles.burst(player.x, player.y, {
            count: 8,
            speed: 90,
            life: 0.4,
            size: 3,
            colors: [COLORS.squid, COLORS.bubble],
          });
        }
      }
    }
  }

  startEelPhase(phase) {
    this.eelPhase = phase;
    if (phase === 'hidden') {
      this.eelTimer = 0;
      return;
    }
    if (phase === 'peek') {
      this.eelTimer = EEL.peekDuration;
      for (const eel of this.eels) eel.startPeek();
      return;
    }
    if (phase === 'hunt') {
      this.eelTimer = EEL.huntDuration;
      for (const eel of this.eels) eel.startHunt(this.nearestVisible());
      return;
    }
    if (phase === 'retreat') {
      this.eelTimer = 0;
      for (const eel of this.eels) eel.goHome();
    }
  }

  updateEelPack(dt) {
    if (this.eels.length === 0) return;
    this.eelTimer -= dt;
    if (this.eelPhase === 'hidden') {
      if (this.eelCharge >= this.eelNeed) {
        this.eelCharge -= this.eelNeed;
        this.startEelPhase('peek');
      }
    } else if (this.eelPhase === 'peek') {
      if (this.eelTimer <= 0) this.startEelPhase('hunt');
    } else if (this.eelPhase === 'hunt') {
      if (this.eelTimer <= 0) this.startEelPhase('retreat');
    } else if (this.eelPhase === 'retreat') {
      if (this.eels.every((eel) => eel.state === 'hidden')) this.startEelPhase('hidden');
    }
    for (const eel of this.eels) eel.update(dt, this.players, this.rules.enemySpeed);
  }

  startSealPhase(phase) {
    this.sealPhase = phase;
    if (phase === 'perched') {
      this.sealTimer = 0;
      return;
    }
    if (phase === 'dive') {
      this.sealTimer = SEAL.diveTime;
      for (const seal of this.seals) seal.startDive();
      return;
    }
    if (phase === 'chase') {
      this.sealTimer = SEAL.chaseDuration;
      for (const seal of this.seals) seal.startChase(this.nearestVisible());
      return;
    }
    if (phase === 'return') {
      this.sealTimer = 0;
      for (const seal of this.seals) seal.goPerch();
    }
  }

  updateSeals(dt) {
    if (this.seals.length === 0) return;
    this.sealTimer -= dt;
    if (this.sealPhase === 'perched') {
      if (this.sealCharge >= this.sealNeed) {
        this.sealCharge -= this.sealNeed;
        this.startSealPhase('dive');
      }
    } else if (this.sealPhase === 'dive') {
      if (this.sealTimer <= 0) this.startSealPhase('chase');
    } else if (this.sealPhase === 'chase') {
      if (this.sealTimer <= 0) this.startSealPhase('return');
    } else if (this.sealPhase === 'return') {
      if (this.seals.every((seal) => seal.state === 'perched')) this.startSealPhase('perched');
    }
    for (const seal of this.seals) seal.update(dt, this.players, this.rules.enemySpeed);
  }

  updateSpawning(dt) {
    if (this.empty) return;
    if (this.freshwater) {
      const spawnScale = lerp(1, FRESHWATER.spawnRampFloor, this.difficulty) * this.rules.spawnInterval;
      this.bubbleRowTimer -= dt;
      if (this.bubbleRowTimer <= 0) {
        this.bubbleRowTimer = rand(FRESHWATER.bubbleRowMin, FRESHWATER.bubbleRowMax);
        this.spawnBubbleRow();
      }
      this.logTimer -= dt;
      if (this.logTimer <= 0) {
        this.logTimer = rand(FRESHWATER.spawnLogMin, FRESHWATER.spawnLogMax) * spawnScale;
        this.spawnLog();
      }
      this.rockTimer -= dt;
      if (this.rockTimer <= 0) {
        this.rockTimer = rand(FRESHWATER.spawnRockMin, FRESHWATER.spawnRockMax) * spawnScale;
        this.spawnRock();
      }
      this.piranhaTimer -= dt;
      if (this.piranhaTimer <= 0) {
        this.piranhaTimer = rand(FRESHWATER.spawnPiranhaMin, FRESHWATER.spawnPiranhaMax) * spawnScale;
        this.spawnPiranha();
      }
      this.weedTimer -= dt;
      if (this.weedTimer <= 0) {
        this.weedTimer = rand(FRESHWATER.spawnWeedMin, FRESHWATER.spawnWeedMax) * spawnScale;
        this.spawnWeed();
      }
      this.eelTimer -= dt;
      if (
        this.tankBubbles >= FRESHWATER.goalBubbles * FRESHWATER.eelStartProgress &&
        this.eelTimer <= 0
      ) {
        this.eelTimer = rand(FRESHWATER.spawnEelMin, FRESHWATER.spawnEelMax) * spawnScale;
        this.spawnElectricEel();
      }
      return;
    }
    if (this.nautilusTank) {
      const spawnScale = lerp(1, NAUTILUS.spawnRampFloor, this.difficulty) * this.rules.spawnInterval;
      this.bubbleRowTimer -= dt;
      if (this.bubbleRowTimer <= 0) {
        this.bubbleRowTimer = rand(NAUTILUS.bubbleRowMin, NAUTILUS.bubbleRowMax);
        this.spawnBubbleColumn();
      }
      this.skeletonTimer -= dt;
      if (this.skeletonTimer <= 0 && this.skeletons.length < NAUTILUS.maxSkeletons) {
        this.skeletonTimer =
          rand(NAUTILUS.spawnSkeletonMin, NAUTILUS.spawnSkeletonMax) * spawnScale;
        this.spawnSkeleton();
      }
      this.dartEelTimer -= dt;
      if (this.dartEelTimer <= 0 && this.dartEels.length < NAUTILUS.maxEels) {
        this.dartEelTimer = rand(NAUTILUS.spawnEelMin, NAUTILUS.spawnEelMax) * spawnScale;
        this.spawnDartEel();
      }
      this.baitSquidTimer -= dt;
      if (this.baitSquidTimer <= 0 && this.baitSquids.length < NAUTILUS.maxSquids) {
        this.baitSquidTimer = rand(NAUTILUS.spawnSquidMin, NAUTILUS.spawnSquidMax) * spawnScale;
        this.spawnBaitSquid();
      }
      return;
    }
    const bubbleScale = lerp(1, ROUND.bubbleRateFloor, this.ramp);
    const hazardScale = lerp(1, ROUND.hazardRateFloor, this.ramp);
    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0 && this.bubbles.length < ROUND.maxBubbles) {
      this.bubbleTimer =
        rand(ROUND.bubbleSpawnMin, ROUND.bubbleSpawnMax) * bubbleScale * this.rules.spawnInterval;
      this.spawnBubble();
    }
    if (this.tank === 'reef') {
      const hazardCap = Math.min(
        ROUND.maxHazardsCeiling + this.rules.hazardBonus,
        ROUND.maxHazards + this.rules.hazardBonus + Math.floor(this.elapsed / ROUND.hazardCapStep),
      );
      this.hazardTimer -= dt;
      if (this.hazardTimer <= 0 && this.hazards.length < hazardCap) {
        this.hazardTimer =
          rand(ROUND.hazardSpawnMin, ROUND.hazardSpawnMax) * hazardScale * this.rules.spawnInterval;
        this.spawnHazard();
      }
      this.colorTimer -= dt;
      if (this.colorTimer <= 0 && this.colorSchools.length < COLORSCHOOL.maxActive) {
        this.colorTimer = rand(COLORSCHOOL.spawnMin, COLORSCHOOL.spawnMax);
        this.spawnColorSchool();
      }
    }
    this.bonusTimer -= dt;
    if (this.arctic) {
      if (this.bonusTimer <= 0 && this.bonus.length < PLANKTON.maxActive) {
        this.bonusTimer = rand(PLANKTON.spawnMin, PLANKTON.spawnMax) * this.rules.spawnInterval;
        this.spawnPlankton();
      }
    } else if (!this.jellyTank && !this.freshwater && this.bonusTimer <= 0 && this.bonus.length === 0) {
      if (this.deepsea) {
        this.bonusTimer = rand(CRAB.spawnMin, CRAB.spawnMax) * this.rules.spawnInterval;
        this.spawnCrab();
      } else if (this.stingrayTank) {
        this.bonusTimer = rand(SHRIMP.spawnMin, SHRIMP.spawnMax) * this.rules.spawnInterval;
        this.spawnShrimp();
      } else {
        this.bonusTimer = rand(ANGELFISH.spawnMin, ANGELFISH.spawnMax) * this.rules.spawnInterval;
        this.spawnAngelfish();
      }
    }
    this.zoneTimer -= dt;
    if (!this.freshwater && this.zoneTimer <= 0 && this.zones.length === 0) {
      this.zoneTimer = rand(ZONES.spawnMin, ZONES.spawnMax) * this.rules.spawnInterval;
      this.spawnZone();
    }
    if (this.jellyTank) {
      this.minnowTimer -= dt;
      if (this.minnowTimer <= 0 && this.minnows.length < MINNOW.maxActive) {
        this.minnowTimer = rand(MINNOW.spawnMin, MINNOW.spawnMax) * this.rules.spawnInterval;
        this.spawnMinnow();
      }
    }
  }

  spawnBubble() {
    if (!this.bubbles.some((bubble) => bubble.golden) && Math.random() < GOLDEN.chance) {
      this.spawnGoldenBubble();
      return;
    }
    this.bubbles.push(new Bubble(rand(50, LOGICAL_WIDTH - 50), LOGICAL_HEIGHT + 26));
  }

  spawnGoldenBubble() {
    this.bubbles.push(new GoldenBubble(rand(50, LOGICAL_WIDTH - 50), LOGICAL_HEIGHT + 26));
  }

  spawnHazard() {
    let x = LOGICAL_WIDTH / 2;
    let y = LOGICAL_HEIGHT / 2;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      x = rand(80, LOGICAL_WIDTH - 80);
      y = rand(130, LOGICAL_HEIGHT - 130);
      const clear = this.players.every(
        (player) => distance(x, y, player.x, player.y) > ROUND.hazardSafeRadius,
      );
      if (clear) break;
    }
    this.hazards.push(new Jellyfish(x, y));
  }

  spawnAngelfish() {
    this.bonus.push(new Angelfish());
  }

  spawnShrimp() {
    this.bonus.push(new Shrimp());
  }

  spawnCrab() {
    this.bonus.push(new Crab());
  }

  spawnPlankton() {
    this.bonus.push(new Plankton());
  }

  spawnMinnow() {
    this.minnows.push(new Minnow());
  }

  spawnBubbleRow() {
    const count = Math.floor(rand(FRESHWATER.bubbleCountMin, FRESHWATER.bubbleCountMax + 1));
    const y = rand(90, LOGICAL_HEIGHT - SAND.height - 60);
    for (let i = 0; i < count; i += 1) {
      this.bubbles.push(
        new Bubble(LOGICAL_WIDTH + 40 + i * FRESHWATER.bubbleSpacing, y, { rise: 0, wobble: 0 }),
      );
    }
  }

  spawnLog() {
    this.logs.push(new Log());
  }

  spawnRock() {
    this.rocks.push(new Rock());
  }

  spawnPiranha() {
    this.piranhas.push(new PiranhaSchool());
  }

  spawnWeed() {
    this.weeds.push(new Weed());
  }

  spawnBubbleColumn() {
    const count = Math.floor(rand(NAUTILUS.bubbleCountMin, NAUTILUS.bubbleCountMax + 1));
    const x = rand(70, LOGICAL_WIDTH - 70);
    for (let i = 0; i < count; i += 1) {
      this.bubbles.push(
        new Bubble(x, LOGICAL_HEIGHT + 40 + i * NAUTILUS.bubbleSpacing, { rise: 0, wobble: 0 }),
      );
    }
  }

  spawnSkeleton() {
    this.skeletons.push(new WhaleSkeleton());
  }

  spawnDartEel() {
    this.dartEels.push(new DartEel());
  }

  spawnBaitSquid() {
    this.baitSquids.push(new BaitSquid());
  }

  spawnColorSchool() {
    this.colorSchools.push(new ColorSchool());
  }

  buildCorals() {
    const span = (LOGICAL_WIDTH - CORAL.margin * 2) / CORAL.count;
    return Array.from({ length: CORAL.count }, (_, index) => {
      const x = CORAL.margin + span * (index + 0.5) + rand(-span * CORAL.jitter, span * CORAL.jitter);
      return new Coral(x, index % 3);
    });
  }

  spawnElectricEel() {
    this.electricEels.push(new ElectricEel());
  }

  spawnZone(kind = null) {
    const type = kind ?? (Math.random() < 0.5 ? 'current' : 'updraft');
    this.zones.push(type === 'current' ? new CurrentZone() : new UpdraftZone());
  }

  updateEntities(dt) {
    if (this.freshwater) {
      for (const bubble of this.bubbles) bubble.baseX -= this.scrollSpeed * dt;
      this.logs = this.logs.filter((log) => {
        log.update(dt, this.scrollSpeed);
        return log.alive && log.x > -140;
      });
      this.rocks = this.rocks.filter((rock) => {
        rock.update(dt, this.scrollSpeed);
        return rock.alive && rock.x > -120;
      });
      this.piranhas = this.piranhas.filter((school) => {
        school.update(dt, this.scrollSpeed);
        return school.alive && school.x > -120;
      });
      this.weeds = this.weeds.filter((weed) => {
        weed.update(dt, this.scrollSpeed);
        return weed.alive && weed.x > -120;
      });
      this.electricEels = this.electricEels.filter((eel) => {
        eel.update(dt, this.players, this.scrollSpeed, this.rules.enemySpeed);
        return eel.alive && eel.x > -140;
      });
      this.catfish.update(dt, this.players, this.difficulty, this.rules.enemySpeed);
    }
    if (this.nautilusTank) {
      for (const bubble of this.bubbles) bubble.y -= this.scrollSpeed * dt;
      this.skeletons = this.skeletons.filter((skeleton) => {
        skeleton.update(dt, this.scrollSpeed);
        return skeleton.alive && skeleton.y > -170;
      });
      this.dartEels = this.dartEels.filter((eel) => {
        eel.update(dt, this.scrollSpeed);
        return eel.alive && eel.y > -140;
      });
      const laneY = Math.min(...this.players.map((player) => player.y));
      const clearGap = NAUTILUS.squidRadius + NAUTILUS.radius + 4;
      this.baitSquids = this.baitSquids.filter((squid) => {
        squid.update(dt, this.players, this.scrollSpeed);
        if (!squid.alive) return false;
        if (this.nautilusShark && squid.y < laneY - clearGap) {
          this.feedShark(squid);
          return false;
        }
        return squid.y > -170;
      });
      if (this.nautilusShark) {
        this.nautilusShark.update(dt, this.players, this.difficulty, this.rules.enemySpeed);
      }
    }
    this.bubbles = this.bubbles.filter((bubble) => {
      bubble.update(dt);
      return bubble.alive && bubble.y > -40 && bubble.x > -80;
    });
    this.hazards = this.hazards.filter((hazard) => {
      hazard.update(dt);
      return hazard.alive;
    });
    this.bonus = this.bonus.filter((entity) => {
      entity.update(dt);
      return entity.alive;
    });
    this.updateEelPack(dt);
    this.updateSeals(dt);
    for (const angler of this.anglers) angler.update(dt, this.players, this.rules.enemySpeed);
    this.separateAnglers();
    if (this.turtle) this.turtle.update(dt, this.players, this.rules.enemySpeed);
    if (this.octopus) this.octopus.update(dt, this.players, this.rules.enemySpeed);
    this.minnows = this.minnows.filter((minnow) => {
      minnow.update(dt);
      if (minnow.completed) {
        this.jellyPoints += MINNOW.pointValue;
        this.score += MINNOW.scoreValue;
        this.particles.burst(minnow.x, minnow.y, {
          count: 12,
          speed: 150,
          life: 0.55,
          colors: [COLORS.minnow, '#f4e6c4', '#ffffff'],
          buoyancy: -30,
        });
        this.game.audio.tone({ freq: 520, endFreq: 880, type: 'triangle', duration: 0.12, volume: 0.22 });
        return false;
      }
      return minnow.alive;
    });
    this.particles.update(dt);
  }

  updateZones(dt) {
    this.zones = this.zones.filter((zone) => {
      zone.update(dt);
      return zone.age < zone.life;
    });
    for (const player of this.players) {
      if (player.concealed === true) continue;
      for (const zone of this.zones) {
        if (zone.contains(player)) zone.force(player, dt);
      }
    }
  }

  updateCollisions() {
    if (this.freshwater) {
      for (const player of this.players) {
        if (player.invulnerable > 0) continue;
        for (const log of this.logs) {
          if (player.concealed === true || !circleOverlap(player, log)) continue;
          this.bite(player, player.x - log.x, player.y - log.y, FRESHWATER.logPenalty, 260, 0.8, [COLORS.log, '#a5895f', '#ffffff'], { freq: 120, endFreq: 60, duration: 0.2, volume: 0.24 });
          break;
        }
        for (const rock of this.rocks) {
          if (player.concealed === true || !circleOverlap(player, rock)) continue;
          this.bite(player, player.x - rock.x, player.y - rock.y, FRESHWATER.rockPenalty, 320, 1, [COLORS.rock, COLORS.rockDark, '#ffffff'], { freq: 80, endFreq: 40, duration: 0.4, volume: 0.3 });
          break;
        }
        for (const weed of this.weeds) {
          if (player.concealed === true || player.tangleTimer > 0 || !circleOverlap(player, weed)) continue;
          player.tangle(FRESHWATER.tangleDuration);
          this.score = Math.max(0, this.score - Math.round(FRESHWATER.tangleScore * this.rules.penalty));
          this.particles.burst(player.x, player.y, {
            count: 10,
            speed: 120,
            life: 0.5,
            colors: [COLORS.weed, COLORS.weedDark, '#ffffff'],
            buoyancy: -20,
          });
          this.game.audio.tone({ freq: 200, endFreq: 120, type: 'triangle', duration: 0.25, volume: 0.2 });
          break;
        }
        for (const school of this.piranhas) {
          if (player.concealed === true || !circleOverlap(player, school)) continue;
          school.kill();
          this.bite(player, player.x - school.x, player.y - school.y, FRESHWATER.piranhaPenalty, 300, 1, ['#c94b3a', '#4c4f56', '#ffffff'], { freq: 200, endFreq: 90, duration: 0.25, volume: 0.28 });
          break;
        }
      }
      if (this.catfish) {
        for (const school of this.piranhas) {
          if (!school.alive) continue;
          if (school.x > this.catfish.x + 40) continue;
          school.kill();
          this.catfish.stun();
          this.particles.burst(school.x, school.y, {
            count: 16,
            speed: 200,
            life: 0.6,
            colors: ['#c94b3a', COLORS.accent, '#ffffff'],
            buoyancy: -20,
          });
          this.game.audio.tone({ freq: 660, endFreq: 990, type: 'triangle', duration: 0.15, volume: 0.22 });
          this.game.audio.tone({ freq: 990, endFreq: 1320, type: 'triangle', duration: 0.2, volume: 0.18, delay: 0.12 });
        }
        if (this.catfish.state === 'chase') {
          for (const player of this.players) {
            if (player.concealed === true || player.invulnerable > 0) continue;
            if (!circleOverlap(player, this.catfish)) continue;
            this.bite(player, player.x - this.catfish.x, player.y - this.catfish.y, CATFISH.penaltyScore, CATFISH.knockback, CATFISH.invulnerableTime, [COLORS.catfish, COLORS.catfishDark, '#ffffff'], { freq: 70, endFreq: 35, duration: 0.5, volume: 0.3 });
            this.catfish.x = Math.max(CATFISH.startX, this.catfish.x - 320);
          }
        }
      }
      for (const eel of this.electricEels) {
        for (const player of this.players) {
          if (player.concealed === true || player.invulnerable > 0) continue;
          if (!circleOverlap(player, { x: eel.x, y: eel.y, radius: ELECTRIC_EEL.fieldRadius })) continue;
          this.bite(player, player.x - eel.x, player.y - eel.y, ELECTRIC_EEL.penaltyScore, ELECTRIC_EEL.knockback, ELECTRIC_EEL.invulnerableTime, [COLORS.electric, COLORS.lure, '#ffffff'], { freq: 300, endFreq: 80, duration: 0.3, volume: 0.28 });
          player.tangle(ELECTRIC_EEL.paralysis);
          break;
        }
      }
    }
    if (this.nautilusTank) {
      for (const player of this.players) {
        if (player.invulnerable > 0) continue;
        for (const skeleton of this.skeletons) {
          if (!circleOverlap(player, skeleton)) continue;
          this.bite(player, player.x - skeleton.x, player.y - skeleton.y, NAUTILUS.skeletonPenalty, 320, 1, [COLORS.bone, COLORS.boneDark, '#ffffff'], { freq: 90, endFreq: 45, duration: 0.4, volume: 0.3 });
          break;
        }
        for (const eel of this.dartEels) {
          if (!circleOverlap(player, eel)) continue;
          this.bite(player, player.x - eel.x, player.y - eel.y, NAUTILUS.eelPenalty, 300, 1, [COLORS.eel, '#8fae76', '#ffffff'], { freq: 240, endFreq: 90, duration: 0.22, volume: 0.28 });
          break;
        }
        for (const squid of this.baitSquids) {
          if (!squid.alive || !circleOverlap(player, squid)) continue;
          squid.kill();
          this.bite(player, player.x - squid.x, player.y - squid.y, NAUTILUS.squidPenalty, 260, 1, [COLORS.squid, '#7a4a52', '#ffffff'], { freq: 200, endFreq: 110, duration: 0.25, volume: 0.24 });
          player.tangle(NAUTILUS.squidParalysis);
          break;
        }
      }
      if (this.nautilusShark) {
        if (this.nautilusShark.state === 'chase') {
          for (const player of this.players) {
            if (player.invulnerable > 0) continue;
            if (!circleOverlap(player, this.nautilusShark)) continue;
            this.bite(player, player.x - this.nautilusShark.x, player.y - this.nautilusShark.y, NAUTILUS.sharkPenalty, NAUTILUS.sharkKnockback, NAUTILUS.sharkInvulnerableTime, [COLORS.shark, COLORS.sharkFin, '#ffffff'], { freq: 70, endFreq: 35, duration: 0.5, volume: 0.3 });
            this.nautilusShark.y = Math.max(NAUTILUS.sharkStartY, this.nautilusShark.y - 320);
          }
        }
      }
    }
    for (const bubble of this.bubbles) {
      if (!bubble.alive) continue;
      for (let index = 0; index < this.players.length; index += 1) {
        const player = this.players[index];
        if (player.concealed === true) continue;
        if (!circleOverlap(player, bubble)) continue;
        bubble.kill();
        this.bubblesCollected += 1;
        this.tankBubbles += 1;
        if (this.race) this.playerBubbles[index] += 1;
        if (this.eels.length > 0) this.eelCharge += 1;
        this.score += bubble.golden ? GOLDEN.score : ROUND.bubbleScore;
        this.timeLeft += bubble.golden ? GOLDEN.bonusTime : ROUND.bubbleBonusTime;
        this.particles.burst(bubble.x, bubble.y, {
          count: bubble.golden ? 16 : 10,
          speed: 130,
          life: 0.55,
          colors: bubble.golden
            ? [COLORS.accent, '#fff3c4', '#ffffff']
            : [COLORS.bubble, COLORS.foam, '#ffffff'],
          buoyancy: -40,
        });
        if (bubble.golden) {
          this.game.audio.tone({ freq: 620, endFreq: 980, type: 'triangle', duration: 0.12, volume: 0.25 });
          this.game.audio.tone({ freq: 980, endFreq: 1240, type: 'triangle', duration: 0.14, volume: 0.2, delay: 0.1 });
        } else {
          this.game.audio.tone({ freq: 480, endFreq: 900, type: 'triangle', duration: 0.11, volume: 0.25 });
        }
        break;
      }
    }
    for (const entity of this.bonus) {
      if (!entity.alive) continue;
      for (const player of this.players) {
        if (player.concealed === true) continue;
        if (!circleOverlap(player, entity)) continue;
        entity.kill();
        this.score += entity.score;
        if (this.arctic) {
          this.sealCharge += 1;
          this.tankPlankton += 1;
        }
        this.particles.burst(entity.x, entity.y, {
          count: 14,
          speed: 180,
          life: 0.6,
          colors: entity.burst,
          buoyancy: -30,
        });
        this.game.audio.tone({ freq: 740, endFreq: 1180, type: 'triangle', duration: 0.18, volume: 0.22 });
        break;
      }
    }
    for (const hazard of this.hazards) {
      if (!hazard.alive) continue;
      for (const player of this.players) {
        if (player.invulnerable > 0 || !circleOverlap(player, hazard)) continue;
        const dx = player.x - hazard.x;
        const dy = player.y - hazard.y;
        const length = Math.hypot(dx, dy) || 1;
        player.vx += (dx / length) * ROUND.knockback;
        player.vy += (dy / length) * ROUND.knockback;
        player.invulnerable = ROUND.invulnerableTime * this.rules.grace;
        this.timeLeft -= ROUND.hazardPenaltyTime * this.rules.penalty;
        this.flash = 0.6;
        this.shake = 0.5;
        this.particles.burst(player.x, player.y, {
          count: 16,
          speed: 220,
          life: 0.7,
          colors: [COLORS.danger, COLORS.jelly, '#ffd7dd'],
          buoyancy: -20,
        });
        this.game.audio.tone({ freq: 160, endFreq: 70, type: 'sawtooth', duration: 0.3, volume: 0.3 });
      }
    }
    for (const player of this.players) {
      if (player.concealed === true || player.invulnerable > 0) continue;
      for (const eel of this.eels) {
        if (eel.state !== 'hunting') continue;
        if (!circleOverlap(player, eel)) continue;
        this.bite(player, player.x - eel.x, player.y - eel.y, EEL.penaltyScore, EEL.knockback, EEL.invulnerableTime, [eel.bodyColor, eel.ridgeColor, COLORS.sand], { freq: 120, endFreq: 60, duration: 0.4, volume: 0.3 });
        break;
      }
    }
    for (const player of this.players) {
      if (player.concealed === true || player.invulnerable > 0) continue;
      for (const angler of this.anglers) {
        if (!circleOverlap(player, angler)) continue;
        this.bite(player, player.x - angler.x, player.y - angler.y, ANGLER.penaltyScore, ANGLER.knockback, ANGLER.invulnerableTime, [COLORS.angler, COLORS.lure, '#c9d9d2'], { freq: 100, endFreq: 50, duration: 0.45, volume: 0.3 });
        break;
      }
    }
    for (const player of this.players) {
      if (player.concealed === true || player.invulnerable > 0) continue;
      for (const seal of this.seals) {
        if (seal.state !== 'chasing') continue;
        if (!circleOverlap(player, seal)) continue;
        this.bite(player, player.x - seal.x, player.y - seal.y, SEAL.penaltyScore, SEAL.knockback, SEAL.invulnerableTime, [COLORS.seal, '#dcecf5', '#ffffff'], { freq: 140, endFreq: 60, duration: 0.4, volume: 0.3 });
        break;
      }
    }
    for (const minnow of this.minnows) {
      if (minnow.state !== 'swimming') continue;
      for (const player of this.players) {
        if (player.concealed === true) continue;
        if (!circleOverlap(player, minnow)) continue;
        minnow.beginTangle(player);
        break;
      }
    }
    if (this.octopus && this.octopus.state !== 'stunned') {
      for (const player of this.players) {
        if (player.invulnerable > 0) continue;
        const head = this.octopus.headPosition();
        if (circleOverlap(player, { x: head.x, y: head.y, radius: OCTOPUS.headRadius })) {
          this.octopus.stun();
          this.score += OCTOPUS.stunScore;
          for (let i = 0; i < OCTOPUS.stunBubbles; i += 1) {
            this.bubbles.push(
              new Bubble(this.octopus.x + rand(-50, 50), this.octopus.y + rand(-40, 40), {
                rise: rand(30, 60),
              }),
            );
          }
          this.particles.burst(head.x, head.y, {
            count: 12,
            speed: 160,
            life: 0.5,
            colors: [COLORS.octopus, COLORS.accent, '#ffffff'],
            buoyancy: -20,
          });
          this.game.audio.tone({ freq: 880, endFreq: 1320, type: 'triangle', duration: 0.15, volume: 0.22 });
          this.game.audio.tone({ freq: 1320, endFreq: 1760, type: 'triangle', duration: 0.2, volume: 0.18, delay: 0.12 });
          continue;
        }
        if (circleOverlap(player, this.octopus)) {
          this.bite(player, player.x - this.octopus.x, player.y - this.octopus.y, OCTOPUS.penaltyScore, OCTOPUS.knockback, OCTOPUS.invulnerableTime, [COLORS.octopus, COLORS.octopusDark, '#ffffff'], { freq: 90, endFreq: 50, duration: 0.35, volume: 0.3 });
        }
      }
    }
    if (this.turtle && this.turtle.state !== 'stunned') {
      for (const player of this.players) {
        if (player.invulnerable > 0) continue;
        const head = this.turtle.headPosition();
        if (circleOverlap(player, { x: head.x, y: head.y, radius: TURTLE.headRadius })) {
          this.turtle.stun();
          this.particles.burst(head.x, head.y, {
            count: 12,
            speed: 160,
            life: 0.5,
            colors: [COLORS.turtle, COLORS.accent, '#ffffff'],
            buoyancy: -20,
          });
          this.game.audio.tone({ freq: 880, endFreq: 1320, type: 'triangle', duration: 0.15, volume: 0.22 });
          this.game.audio.tone({ freq: 1320, endFreq: 1760, type: 'triangle', duration: 0.2, volume: 0.18, delay: 0.12 });
          continue;
        }
        if (circleOverlap(player, this.turtle)) {
          this.bite(player, player.x - this.turtle.x, player.y - this.turtle.y, TURTLE.penaltyScore, TURTLE.knockback, TURTLE.invulnerableTime, [COLORS.turtle, '#9dbfa4', '#ffffff'], { freq: 90, endFreq: 50, duration: 0.35, volume: 0.3 });
        }
      }
    }
  }

  bite(player, dx, dy, penaltyScore, knockback, invulnerableTime, colors, sound) {
    const length = Math.hypot(dx, dy) || 1;
    player.vx += (dx / length) * knockback;
    player.vy += (dy / length) * knockback;
    player.invulnerable = invulnerableTime * this.rules.grace;
    this.score = Math.max(0, this.score - Math.round(penaltyScore * this.rules.penalty));
    this.flash = 0.6;
    this.shake = 0.5;
    this.particles.burst(player.x, player.y, {
      count: 16,
      speed: 220,
      life: 0.7,
      colors,
      buoyancy: -20,
    });
    this.game.audio.tone({ ...sound, type: 'sawtooth' });
  }

  completionPayload() {
    const storedBest = loadJSON(STORAGE_KEY, 0);
    const isNewBest = !this.race && this.score > storedBest;
    if (isNewBest) saveJSON(STORAGE_KEY, this.score);
    const stats = { games: 0, bubbles: 0, longestRun: 0, ...loadJSON(STATS_KEY, {}) };
    let newLongestRun = false;
    let coins = 0;
    if (!this.empty && !this.race) {
      stats.games += 1;
      stats.bubbles += this.bubblesCollected;
      if (this.elapsed > stats.longestRun) {
        stats.longestRun = this.elapsed;
        newLongestRun = true;
      }
      saveJSON(STATS_KEY, stats);
      const scale = COINS.difficultyScale[this.difficultyKey] ?? 1;
      const skinScale = 1 + (this.skin.cost ?? 0) / COINS.skinBonusScale;
      coins = Math.round(
        (COINS.bonus + this.score * COINS.perScore + Math.floor(this.elapsed) * COINS.perSecond) *
          scale *
          skinScale,
      );
      saveJSON(COINS_KEY, loadJSON(COINS_KEY, COINS.starting) + coins);
    }
    return {
      score: this.score,
      best: Math.max(storedBest, this.score),
      isNewBest,
      longestRun: stats.longestRun,
      newLongestRun,
      bubbles: this.bubblesCollected,
      coins,
    };
  }

  updateTimer(dt) {
    const before = Math.ceil(this.timeLeft);
    this.timeLeft -= dt;
    const after = Math.ceil(this.timeLeft);
    if (after !== before && after > 0 && after <= ROUND.lowTimeThreshold) {
      this.game.audio.tone({ freq: 720, type: 'square', duration: 0.06, volume: 0.1 });
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      let race = null;
      let raceReward = 0;
      if (this.race) {
        race = this.playerBubbles.slice();
        raceReward = recordMinigame(race[0] !== race[1]);
      }
      const payload = this.completionPayload();
      this.game.changeScene('gameover', {
        ...payload,
        coins: payload.coins + raceReward,
        race,
        params: this.replayParams(),
      });
    }
  }

  render(ctx) {
    setActiveSkin(this.skin);
    setSkinClock(this.time);
    setActiveAccessory(this.accessory);
    drawWater(
      ctx,
      LOGICAL_WIDTH,
      LOGICAL_HEIGHT,
      this.time,
      this.freshwater
        ? FRESHWATER_PALETTE
        : this.nautilusTank
          ? NAUTILUS_PALETTE
          : this.kelp
            ? KELP_PALETTE
            : this.jellyTank
            ? JELLY_PALETTE
            : this.arctic
              ? ARCTIC_PALETTE
              : this.deepsea
                ? DEEPSEA_PALETTE
                : WATER_PALETTE,
    );
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 7 * this.shake, rand(-1, 1) * 7 * this.shake);
    }
    for (const rock of this.reefRocks) rock.render(ctx);
    for (const coral of this.corals) coral.render(ctx);
    for (const zone of this.zones) zone.render(ctx);
    if (this.stingrayTank || this.freshwater) {
      this.renderSand(ctx);
    }
    if (this.kelp) {
      this.renderKelpFloor(ctx);
    }
    if (this.stingrayTank) {
      this.archway.render(ctx);
    }
    if (this.deepsea) {
      this.renderFloor(ctx);
      this.ledges.render(ctx);
    }
    if (this.arctic) {
      this.icechunk.render(ctx);
    }
    this.decor.render(ctx);
    if (this.kelpStalks) this.kelpStalks.render(ctx);
    for (const weed of this.weeds) weed.render(ctx);
    for (const log of this.logs) log.render(ctx);
    for (const rock of this.rocks) rock.render(ctx);
    for (const school of this.piranhas) school.render(ctx);
    for (const eel of this.electricEels) eel.render(ctx);
    if (this.catfish) this.catfish.render(ctx);
    for (const school of this.schools) school.render(ctx);
    for (const school of this.colorSchools) school.render(ctx);
    for (const skeleton of this.skeletons) skeleton.render(ctx);
    for (const bubble of this.bubbles) bubble.render(ctx);
    for (const hazard of this.hazards) hazard.render(ctx);
    for (const eel of this.eels) eel.render(ctx);
    for (const angler of this.anglers) angler.render(ctx);
    for (const seal of this.seals) seal.render(ctx);
    if (this.turtle) this.turtle.render(ctx);
    if (this.octopus) this.octopus.render(ctx);
    for (const minnow of this.minnows) minnow.render(ctx);
    for (const entity of this.bonus) entity.render(ctx);
    for (const squid of this.baitSquids) squid.render(ctx);
    for (const eel of this.dartEels) eel.render(ctx);
    if (this.nautilusShark) this.nautilusShark.render(ctx);
    for (const player of this.players) {
      player.render(ctx);
      drawSkinAura(ctx, player);
    }
    this.particles.render(ctx);
    ctx.restore();

    this.hud.render(ctx, this.hudState());
    drawJoystick(ctx, joystickState(this.game.input));

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.45})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    if (this.paused) this.renderPause(ctx);
  }

  renderKelpFloor(ctx) {
    const top = LOGICAL_HEIGHT - SAND.height;
    const gradient = ctx.createLinearGradient(0, top, 0, LOGICAL_HEIGHT);
    gradient.addColorStop(0, '#2c4a34');
    gradient.addColorStop(1, COLORS.kelpFloor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, top, LOGICAL_WIDTH, SAND.height);
    for (const speckle of this.speckles) {
      ctx.globalAlpha = speckle.alpha;
      fillCircle(ctx, speckle.x, top + speckle.y, speckle.radius, '#16281c');
    }
    ctx.globalAlpha = 1;
  }

  renderSand(ctx) {
    const top = LOGICAL_HEIGHT - SAND.height;
    const gradient = ctx.createLinearGradient(0, top, 0, LOGICAL_HEIGHT);
    gradient.addColorStop(0, COLORS.sandDark);
    gradient.addColorStop(1, COLORS.sand);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, top, LOGICAL_WIDTH, SAND.height);
    for (const speckle of this.speckles) {
      ctx.globalAlpha = speckle.alpha;
      fillCircle(ctx, speckle.x, top + speckle.y, speckle.radius, '#8f7b58');
    }
    ctx.globalAlpha = 1;
  }

  renderFloor(ctx) {
    const top = LOGICAL_HEIGHT - DEEPSEA.floorHeight;
    const gradient = ctx.createLinearGradient(0, top, 0, LOGICAL_HEIGHT);
    gradient.addColorStop(0, COLORS.rockDark);
    gradient.addColorStop(1, COLORS.abyss);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, top, LOGICAL_WIDTH, DEEPSEA.floorHeight);
  }

  renderPause(ctx) {
    ctx.fillStyle = 'rgba(4, 16, 29, 0.68)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const panelWidth = 420;
    const panelHeight = 330;
    const panelX = (LOGICAL_WIDTH - panelWidth) / 2;
    const panelY = (LOGICAL_HEIGHT - panelHeight) / 2;
    fillRoundRect(ctx, panelX, panelY, panelWidth, panelHeight, 24, 'rgba(10, 39, 64, 0.92)');
    strokeRoundRect(ctx, panelX, panelY, panelWidth, panelHeight, 24, 'rgba(207, 239, 255, 0.3)', 2);

    drawText(ctx, 'PAUSED', LOGICAL_WIDTH / 2, panelY + 70, {
      size: 44,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 22,
    });
    this.pauseMenu.render(ctx, LOGICAL_WIDTH / 2, panelY + 210);
  }
}
