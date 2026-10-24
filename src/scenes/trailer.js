import { Scene } from '../engine/scene.js';
import { drawWater, drawText } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { loadJSON } from '../engine/storage.js';
import { setActiveSkin, setSkinClock, skinByKey } from '../engine/skin.js';
import {
  accessoryByKey,
  accessorySlotCatalog,
  setActiveBodyAccessory,
  setActiveHeadAccessory,
} from '../engine/accessory.js';
import { Shark } from '../entities/shark.js';
import { Stingray } from '../entities/stingray.js';
import { Squid } from '../entities/squid.js';
import { ArcticShrimp } from '../entities/arcticshrimp.js';
import { KelpCrab } from '../entities/kelpcrab.js';
import { MoonJelly } from '../entities/moonjelly.js';
import { Nautilus } from '../entities/nautilus.js';
import { Jellyfish } from '../entities/jellyfish.js';
import { Pufferfish } from '../entities/pufferfish.js';
import { Turtle } from '../entities/turtle.js';
import { Octopus } from '../entities/octopus.js';
import { Anglerfish } from '../entities/anglerfish.js';
import { Eel } from '../entities/eel.js';
import { Seal } from '../entities/seal.js';
import { Coral } from '../entities/coral.js';
import { ReefRock } from '../entities/reefrock.js';
import { Weed } from '../entities/weed.js';
import { IceChunk } from '../entities/icechunk.js';
import { SardineSchool } from '../entities/sardineschool.js';
import { ColorSchool } from '../entities/colorschool.js';
import { KelpForest } from '../entities/kelpforest.js';
import { Tentacle } from '../entities/tentacle.js';
import { Bubble } from '../entities/bubble.js';
import { Archway } from '../entities/archway.js';
import { Ledges } from '../entities/ledges.js';
import { Crab } from '../entities/crab.js';
import { Plankton } from '../entities/plankton.js';
import { Minnow } from '../entities/minnow.js';
import { ChaserShark } from '../entities/chasershark.js';
import { WhaleSkeleton } from '../entities/whaleskeleton.js';
import { DartEel } from '../entities/darteel.js';
import { Catfish } from '../entities/catfish.js';
import { ElectricEel } from '../entities/electriceel.js';
import { Log } from '../entities/log.js';
import { Rock } from '../entities/rock.js';
import { PiranhaSchool } from '../entities/piranha.js';
import { Pet } from '../entities/pet.js';
import { TagSwimmer } from '../entities/tagswimmer.js';
import { GoldenBubble } from '../entities/goldenbubble.js';
import {
  ARCTIC_PALETTE,
  COLORS,
  DEEPSEA_PALETTE,
  FRESHWATER_PALETTE,
  GAME_TITLE,
  JELLY_PALETTE,
  KELP_PALETTE,
  LABYRINTH,
  LABYRINTH_PALETTE,
  NAUTILUS_PALETTE,
  PETS_PALETTE,
  SHOP_KEY,
  SKINS,
  TAG,
  TAGLINE,
  TANK_INTROS,
  WATER_PALETTE,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const PALETTES = {
  reef: WATER_PALETTE,
  stingray: WATER_PALETTE,
  deepsea: DEEPSEA_PALETTE,
  arctic: ARCTIC_PALETTE,
  kelp: KELP_PALETTE,
  jelly: JELLY_PALETTE,
  nautilus: NAUTILUS_PALETTE,
  freshwater: FRESHWATER_PALETTE,
  pets: PETS_PALETTE,
  labyrinth: LABYRINTH_PALETTE,
};

const SHOTS = [
  { id: 'title', duration: 3.2, title: GAME_TITLE, sub: TAGLINE, palette: 'reef' },
  {
    id: 'reef',
    duration: 3,
    title: 'EVERY TANK PULLS YOU DEEPER',
    sub: 'REEF, STINGRAY, DEEP SEA, ARCTIC, KELP, JELLY, NAUTILUS, FRESHWATER',
    palette: 'reef',
  },
  {
    id: 'deep',
    duration: 3,
    title: 'THE DEEP HAS LIGHTS THAT BITE',
    sub: 'DODGE THE ANGLERFISH — HIDE IN THE LEDGE HOLES',
    palette: 'deepsea',
  },
  {
    id: 'arctic',
    duration: 3,
    title: 'HIDE IN THE SCHOOLS',
    sub: 'THE SEALS DIVE WHEN YOU GATHER TOO MANY PLANKTON',
    palette: 'arctic',
  },
  {
    id: 'bosses',
    duration: 3,
    title: 'MINIBOSSES GUARD THE WAY',
    sub: 'STUN THE OCTOPUS — SURVIVE THE TURTLE',
    palette: 'kelp',
  },
  {
    id: 'minigames',
    duration: 3,
    title: 'RACE, TAG, AND DODGE FISH',
    sub: 'LOCAL MINIGAMES — 2P OR SOLO',
    palette: 'reef',
  },
  {
    id: 'dress',
    duration: 3.4,
    title: 'DRESS UP, THEN DECORATE',
    sub: 'THIRTEEN COLORS — TRINKETS — YOUR OWN AQUARIUM',
    palette: 'pets',
  },
  {
    id: 'labyrinth',
    duration: 3.4,
    title: 'SEVEN PARTS OF PURE PANIC',
    sub: 'OUTRUN THE WRECK IN LABYRINTH',
    palette: 'labyrinth',
  },
  { id: 'finale', duration: 3.6, title: GAME_TITLE, sub: 'PLAY NOW — 2P OR SOLO', palette: 'reef' },
];

export const TANK_ORDER = [
  'reef',
  'stingray',
  'deepsea',
  'arctic',
  'kelp',
  'jelly',
  'nautilus',
  'freshwater',
  'pets',
];

const TANK_INFO = {
  reef: { title: 'CATCH THE BUBBLES', sub: 'BRIGHT CORALS, SCHOOLS, AND STINGING JELLYFISH' },
  stingray: { title: 'HIDE IN THE SAND', sub: 'A PACK OF MORAYS GUARDS THE ARCHWAY' },
  deepsea: { title: 'THE LIGHTS ARE LURES', sub: 'DODGE ANGLERFISH — DIVE INTO LEDGE HOLES' },
  arctic: { title: 'HIDE IN THE SHOALS', sub: 'SEALS DIVE WHEN YOU GATHER TOO MUCH PLANKTON' },
  kelp: { title: 'STUN THE OCTOPUS', sub: 'THREAD THE KELP FOREST IN THE CRAB TANK' },
  jelly: { title: 'TANGLE THE MINNOWS', sub: 'SURVIVE THE TURTLE CHARGES' },
  nautilus: { title: 'DODGE THE BONES', sub: 'FEED THE SHARK — OR IT FEEDS ON YOU' },
  freshwater: { title: 'OUTRUN THE CATFISH', sub: 'PIRANHAS, LOGS, AND ELECTRIC EELS AHEAD' },
  pets: { title: 'FEED THE MENAGERIE', sub: 'SNACKS, LURES, AND CROSS-LEVEL RAIDS' },
};

export const TANK_TRAILER_LIST = TANK_ORDER.map((tank) => ({
  tank,
  label: TANK_INTROS[tank]?.label ?? 'PETS TANK',
  blurb: TANK_INTROS[tank]?.blurb ?? 'FEED THE SEA CREATURES',
}));

export const MINIGAME_ORDER = ['race', 'tag', 'dodgeball', 'labyrinth'];

const MINIGAME_INFO = {
  race: {
    label: 'COMPETITIONS',
    blurb: 'A LOCAL RACE FOR ONE OR TWO DIVERS — CATCH THE MOST BUBBLES',
    title: 'CATCH THE MOST BUBBLES',
    sub: 'TWO DIVERS, ONE REEF, AND A STREAM OF GOLDEN BUBBLES',
    palette: 'reef',
  },
  tag: {
    label: 'TAG',
    blurb: 'PASS IT ON — TWO DIVERS AGAINST FIVE CPU FISH',
    title: "DON'T BE IT AT THE BUZZER",
    sub: 'TAG THE NEXT DIVER BEFORE THE CLOCK RUNS OUT',
    palette: 'reef',
  },
  dodgeball: {
    label: 'PUFFERFISH DODGEBALL',
    blurb: 'THREE LIVES, NO CLOCK — SURVIVE THE VOLLEYS',
    title: 'SURVIVE THE VOLLEYS',
    sub: 'TELEGRAPHED PUFFERS, AIMED SHOTS, AND DOUBLE VOLLEYS',
    palette: 'reef',
  },
  labyrinth: {
    label: 'LABYRINTH',
    blurb: 'OUTRUN THE WRECK — TENTACLES, TUNNELS, AND THE MEGASQUID',
    title: 'SEVEN PARTS OF PURE PANIC',
    sub: 'PICK YOUR DIVER AND OUTRUN THE WRECK',
    palette: 'labyrinth',
  },
};

export const MINIGAME_TRAILER_LIST = MINIGAME_ORDER.map((minigame) => ({
  minigame,
  label: MINIGAME_INFO[minigame].label,
  blurb: MINIGAME_INFO[minigame].blurb,
}));

const IDLE_INPUT = { isDown: () => false, pointer: { down: false, dragX: 0, dragY: 0 } };

export class TrailerScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.shotIndex = -1;
    this.shotElapsed = 0;
    this.progress = 0;
    this.flash = 0;
    this.shake = 0;
    this.bubbleTimer = 0;
    this.bubbles = [];
    this.schools = [];
    this.bubbleSpawn = 0.4;
    this.gauntlet = Boolean(params.gauntlet);
    this.tankId = TANK_ORDER.includes(params.tank) ? params.tank : null;
    this.minigameId = MINIGAME_ORDER.includes(params.minigame) ? params.minigame : null;
    this.shots = this.gauntlet
      ? this.gauntletShots()
      : this.tankId
        ? this.tankShots()
        : this.minigameId
          ? this.minigameShots()
          : SHOTS;
    this.total = this.shots.reduce((sum, shot) => sum + shot.duration, 0);
    const shop = loadJSON(SHOP_KEY, {});
    this.baseSkin = skinByKey(shop.skin);
    this.baseHead = accessoryByKey(shop.head);
    this.baseBody = accessoryByKey(shop.back);
    this.activeSkin = this.baseSkin;
    this.activeHead = this.baseHead;
    this.activeBody = this.baseBody;
    this.dressTimer = 0;
    this.skinIndex = 0;
    this.headIndex = 0;
    this.bodyIndex = 0;
    this.applyShot(0);
  }

  cutDownShots(prefix, label, blurb, feature, palette, cta) {
    return [
      { id: `${prefix}-a`, duration: 2.6, title: label, sub: blurb, palette, view: 0 },
      { id: `${prefix}-b`, duration: 2.8, title: feature.title, sub: feature.sub, palette, view: 1 },
      { id: `${prefix}-c`, duration: 3, title: label, sub: cta, palette, view: 2 },
    ];
  }

  tankShots() {
    const intro = TANK_INTROS[this.tankId] ?? { label: 'PETS TANK', blurb: 'FEED THE SEA CREATURES' };
    return this.cutDownShots(
      'tank',
      intro.label,
      intro.blurb,
      TANK_INFO[this.tankId],
      this.tankId,
      'CHOOSE YOUR TANK — DIVE NOW',
    );
  }

  minigameShots() {
    const info = MINIGAME_INFO[this.minigameId];
    return this.cutDownShots(
      'minigame',
      info.label,
      info.blurb,
      info,
      info.palette,
      'PLAY NOW — 2P OR SOLO',
    );
  }

  gauntletShots() {
    const shots = [
      {
        id: 'title',
        duration: 3,
        title: GAME_TITLE,
        sub: 'ALL NINE TANKS — ONE CONTINUOUS RUN OF GAMEPLAY',
        palette: 'reef',
      },
    ];
    TANK_ORDER.forEach((tank, index) => {
      const intro = TANK_INTROS[tank] ?? { label: 'PETS TANK', blurb: 'FEED THE SEA CREATURES' };
      shots.push({
        id: `gauntlet-${tank}`,
        duration: 3.4,
        title: intro.label,
        sub: TANK_INFO[tank].sub,
        palette: tank,
        view: index % 2 === 0 ? 1 : 2,
        tank,
      });
    });
    shots.push({
      id: 'finale',
      duration: 3.6,
      title: GAME_TITLE,
      sub: 'PLAY NOW — 2P OR SOLO',
      palette: 'reef',
    });
    return shots;
  }

  isCard(shot) {
    if (shot.id === 'title' || shot.id === 'finale') return true;
    if (this.gauntlet) return false;
    return shot.view === 0 || shot.view === 2;
  }

  addCrew(EntityClass, x, y, speed, bob = 10) {
    const entity = new EntityClass(x, y, { controls: {}, pointer: false });
    const phase = rand(0, TAU);
    this.performers.push({
      entity,
      update: (dt) => {
        entity.update(dt, IDLE_INPUT);
        entity.x += speed * dt;
        if (entity.x > LOGICAL_WIDTH + 160) entity.x = -160;
        entity.y = y + Math.sin(this.time * 2.2 + phase) * bob;
        entity.heading = 0;
      },
    });
    return entity;
  }

  addEntity(entity, build) {
    this.performers.push({ entity, update: build });
    return entity;
  }

  addRay(x, y, speed) {
    const ray = this.addCrew(Stingray, x, y, speed);
    ray.bodyColor = COLORS.rayFresh;
    ray.spotColor = COLORS.raySpot;
    ray.eyeColor = '#0a0a0a';
    return ray;
  }

  addMoray(x, y, variant, peek) {
    const moray = new Eel(x, y, variant);
    if (peek) moray.startPeek();
    else moray.startHunt(null);
    this.addEntity(moray, (dt) => moray.update(dt, [], 1, []));
    return moray;
  }

  addPet(kind, index, x, y) {
    const pet = new Pet(kind, index, { drainScale: 0 });
    pet.x = x;
    pet.y = y;
    pet.waypointX = x;
    pet.waypointY = y;
    this.petCast.push(pet);
    this.addEntity(pet, (dt) => pet.update(dt, [], [], this.petCast));
    return pet;
  }

  addLabyrinthSet({ squid = false, arms = 0, morays = 0 } = {}) {
    if (squid) {
      const beast = new Squid(730, 210, { controls: {}, pointer: false });
      beast.radius = 84;
      beast.heading = 0;
      this.addEntity(beast, (dt) => {
        beast.update(dt, IDLE_INPUT, null);
        beast.y = 210 + Math.sin(this.time * 1.2) * 16;
      });
    }
    for (let index = 0; index < morays; index += 1) {
      this.addMoray(200 + index * 80, 320 + (index % 2) * 70, index, false);
    }
    for (let index = 0; index < arms; index += 1) {
      const arm = new Tentacle(90 + index * 110, index, {
        pack: true,
        lengthScale: rand(0.7, 1.1),
        widthScale: rand(0.9, 1.2),
        anchorOffset: -30,
        writhe: LABYRINTH.packWrithe,
        writheSpeed: LABYRINTH.packWritheSpeed,
      });
      this.addEntity(arm, (dt) => arm.update(dt, -20, null));
    }
    this.addCrew(Nautilus, -180, 440, 130);
  }

  buildMinigameShot(view) {
    const id = this.minigameId;
    if (id === 'race') {
      for (let index = 0; index < 3; index += 1) {
        this.scenery.push(new Coral(rand(80, LOGICAL_WIDTH - 80), index % 3));
      }
      if (view === 1) this.scenery.push(new ReefRock(-1));
      this.addCrew(Shark, -140, 260, view === 2 ? 180 : 150);
      this.addCrew(Shark, -320, 380, view === 2 ? 170 : 140);
      const count = view === 0 ? 4 : 6;
      for (let index = 0; index < count; index += 1) {
        const bubble = new GoldenBubble(
          rand(90, LOGICAL_WIDTH - 90),
          LOGICAL_HEIGHT + 30 + index * 70,
        );
        this.addEntity(bubble, (dt) => {
          bubble.update(dt);
          if (bubble.y < -30) {
            bubble.y = LOGICAL_HEIGHT + 30;
            bubble.baseX = rand(90, LOGICAL_WIDTH - 90);
            bubble.x = bubble.baseX;
          }
        });
      }
      return;
    }
    if (id === 'tag') {
      const cast = [
        { name: 'P1', color: TAG.p1Color, x: 300, y: 250 },
        { name: 'P2', color: TAG.p2Color, x: 560, y: 330 },
        ...TAG.cpuColors.map((color, index) => ({
          name: `CPU ${index + 1}`,
          color,
          x: 180 + index * 150,
          y: 170 + (index % 3) * 110,
        })),
      ];
      const count = view === 0 ? 4 : 6;
      const swimmers = cast
        .slice(0, count)
        .map((entry) => new TagSwimmer({ name: entry.name, color: entry.color, cpu: true, x: entry.x, y: entry.y }));
      const tagger = swimmers[view === 2 ? 1 : 0];
      tagger.isTagged = true;
      for (const swimmer of swimmers) {
        this.addEntity(
          { render: (ctx) => swimmer.render(ctx, this.time) },
          (dt) => {
            swimmer.updateCpu(dt, swimmers, tagger);
            swimmer.x = clamp(swimmer.x, 70, LOGICAL_WIDTH - 70);
            swimmer.y = clamp(swimmer.y, 70, LOGICAL_HEIGHT - 90);
          },
        );
      }
      return;
    }
    if (id === 'dodgeball') {
      this.addCrew(Shark, 240, 400, 0, 10);
      this.addCrew(Shark, 660, 440, 0, 10);
      const volleys = [
        [300, 210, 300, 70],
        [640, 300, -340, -50],
        [470, 150, 220, 100],
        [760, 380, -260, 40],
      ];
      const count = view === 0 ? 2 : view === 1 ? 3 : 4;
      for (let index = 0; index < count; index += 1) {
        const [x, y, vx, vy] = volleys[index];
        const puffer = new Pufferfish();
        puffer.state = 'fly';
        puffer.x = x;
        puffer.y = y;
        puffer.vx = vx;
        puffer.vy = vy;
        this.addEntity(puffer, (dt) => {
          puffer.update(dt);
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
        });
      }
      return;
    }
    if (id === 'labyrinth') {
      if (view === 0) this.addLabyrinthSet({ morays: 3 });
      else if (view === 1) this.addLabyrinthSet({ arms: 4, morays: 3 });
      else this.addLabyrinthSet({ squid: true, arms: 4, morays: 3 });
      return;
    }
  }

  buildTankShot(view, tank = this.tankId) {
    if (tank === 'reef') {
      for (let index = 0; index < (view === 1 ? 5 : 3); index += 1) {
        this.scenery.push(new Coral(rand(70, LOGICAL_WIDTH - 70), index % 3));
      }
      if (view === 1) {
        this.scenery.push(new ReefRock(-1));
        this.scenery.push(new ReefRock(1));
        this.schools.push(new ColorSchool());
        this.schools.push(new ColorSchool());
        this.addCrew(Shark, -140, 280, 140);
      } else if (view === 2) {
        for (const [x, y] of [
          [260, 180],
          [500, 330],
          [740, 220],
        ]) {
          const jelly = new Jellyfish(x, y);
          this.addEntity(jelly, (dt) => {
            jelly.baseY = y;
            jelly.update(dt);
          });
        }
        this.addCrew(Shark, -140, 330, 150);
      } else {
        this.addCrew(Shark, -140, 300, 105);
      }
      return;
    }
    if (tank === 'stingray') {
      const archway = new Archway();
      this.scenery.push(archway);
      if (view === 0) {
        archway.holes.slice(0, 3).forEach((hole, index) => this.addMoray(hole.x, hole.y, index, true));
        this.addCrew(Stingray, -160, 380, 110);
      } else if (view === 1) {
        archway.holes.forEach((hole, index) => this.addMoray(hole.x, hole.y, index, true));
        this.addCrew(Stingray, -160, 380, 115);
      } else {
        archway.holes.slice(0, 4).forEach((hole, index) => this.addMoray(hole.x, hole.y, index, false));
        this.addCrew(Stingray, -160, 370, 130);
      }
      return;
    }
    if (tank === 'deepsea') {
      this.scenery.push(new Ledges());
      if (view === 0) {
        this.addCrew(Squid, -160, 300, 110);
      } else if (view === 1) {
        for (const [x, y] of [
          [260, 260],
          [720, 210],
        ]) {
          const angler = new Anglerfish();
          angler.x = x;
          angler.y = y;
          this.addEntity(angler, (dt) => angler.update(dt, [], 1));
        }
        const crab = new Crab();
        crab.x = 480;
        crab.y = 430;
        this.addEntity(crab, (dt) => crab.update(dt));
      } else {
        for (const [x, y] of [
          [220, 200],
          [480, 320],
          [760, 240],
        ]) {
          const angler = new Anglerfish();
          angler.x = x;
          angler.y = y;
          this.addEntity(angler, (dt) => angler.update(dt, [], 1));
        }
        this.addCrew(Squid, -160, 340, 130);
      }
      return;
    }
    if (tank === 'arctic') {
      const ice = new IceChunk();
      ice.x = LOGICAL_WIDTH / 2;
      ice.y = view === 2 ? 110 : 140;
      this.scenery.push(ice);
      if (view === 0) {
        const perch = ice.perches[0];
        const seal = new Seal(perch.x, perch.y);
        this.addEntity(seal, (dt) => seal.update(dt, [], 1));
        this.addCrew(ArcticShrimp, -160, 380, 110);
      } else if (view === 1) {
        for (const [x, y] of [
          [300, 320],
          [620, 260],
          [480, 400],
        ]) {
          const school = new SardineSchool();
          school.x = x;
          school.y = y;
          school.baseX = x;
          school.baseY = y;
          this.scenery.push(school);
        }
        for (const [x, y] of [
          [190, 200],
          [520, 250],
          [770, 310],
        ]) {
          const plankton = new Plankton();
          plankton.x = x;
          plankton.y = y;
          this.addEntity(plankton, (dt) => plankton.update(dt));
        }
        this.addCrew(ArcticShrimp, -160, 390, 120);
      } else {
        for (const perch of ice.perches) {
          const seal = new Seal(perch.x, perch.y);
          seal.startChase(null);
          seal.targetX = perch.x - 180;
          seal.targetY = perch.y + 200;
          this.addEntity(seal, (dt) => seal.update(dt, [], 1));
        }
        this.addCrew(ArcticShrimp, -160, 350, 140);
      }
      return;
    }
    if (tank === 'kelp') {
      this.scenery.push(new KelpForest());
      if (view === 0) {
        this.addCrew(KelpCrab, -160, 410, 100);
      } else if (view === 1) {
        const crab = new Crab();
        crab.x = 620;
        crab.y = 420;
        this.addEntity(crab, (dt) => crab.update(dt));
        this.addCrew(KelpCrab, -160, 410, 110);
      } else {
        const octopus = new Octopus();
        octopus.x = 640;
        octopus.y = 250;
        this.addEntity(octopus, (dt) => octopus.update(dt, [], 1));
        this.addCrew(KelpCrab, -160, 420, 130);
      }
      return;
    }
    if (tank === 'jelly') {
      if (view === 0) {
        this.addCrew(MoonJelly, -160, 300, 90);
      } else if (view === 1) {
        for (const [x, y] of [
          [240, 220],
          [480, 340],
          [720, 200],
        ]) {
          const minnow = new Minnow();
          minnow.x = x;
          minnow.y = y;
          this.addEntity(minnow, (dt) => minnow.update(dt));
        }
        this.addCrew(MoonJelly, -160, 300, 100);
      } else {
        const turtle = new Turtle();
        turtle.x = 680;
        turtle.y = 220;
        turtle.waypointX = 680;
        turtle.waypointY = 220;
        this.addEntity(turtle, (dt) => turtle.update(dt, [], 1));
        this.addCrew(MoonJelly, -160, 320, 130);
      }
      return;
    }
    if (tank === 'nautilus') {
      const skeleton = new WhaleSkeleton();
      skeleton.y = 130;
      this.scenery.push(skeleton);
      if (view === 0) {
        this.addCrew(Nautilus, -160, 300, 110);
      } else if (view === 1) {
        for (const [x, y] of [
          [260, 190],
          [660, 290],
        ]) {
          const eel = new DartEel();
          eel.x = x;
          eel.y = y;
          this.addEntity(eel, (dt) => eel.update(dt, 0));
        }
        this.addCrew(Nautilus, -160, 390, 120);
      } else {
        const shark = new ChaserShark();
        shark.x = 620;
        shark.y = 130;
        this.addEntity(shark, (dt) => shark.update(dt, [], 0, 1));
        const eel = new DartEel();
        eel.x = 360;
        eel.y = 300;
        this.addEntity(eel, (dt) => eel.update(dt, 0));
        this.addCrew(Nautilus, -160, 390, 130);
      }
      return;
    }
    if (tank === 'freshwater') {
      if (view === 0) {
        this.addRay(-160, 380, 110);
      } else if (view === 1) {
        for (const [x, y] of [
          [240, 430],
          [700, 420],
        ]) {
          const log = new Log();
          log.x = x;
          log.y = y;
          this.addEntity(log, (dt) => log.update(dt, 0));
        }
        const rock = new Rock();
        rock.x = 480;
        rock.y = 420;
        this.addEntity(rock, (dt) => rock.update(dt, 0));
        const weed = new Weed();
        weed.x = 600;
        this.scenery.push(weed);
        const piranhas = new PiranhaSchool();
        piranhas.x = 360;
        piranhas.y = 260;
        this.addEntity(piranhas, (dt) => piranhas.update(dt, 0));
        this.addRay(-160, 380, 120);
      } else {
        const catfish = new Catfish();
        catfish.x = 700;
        catfish.y = 250;
        this.addEntity(catfish, (dt) => catfish.update(dt, [], 0, 1));
        const eel = new ElectricEel();
        eel.x = 420;
        eel.y = 320;
        this.addEntity(eel, (dt) => eel.update(dt, [], 1));
        this.addRay(-160, 380, 140);
      }
      return;
    }
    if (tank === 'pets') {
      const kinds = ['shark', 'stingray', 'moray', 'jellyfish', 'nautilus', 'kelpcrab'];
      if (view === 0) {
        kinds.slice(0, 4).forEach((kind, index) => {
          this.addPet(kind, index, 170 + index * 200, 240 + (index % 2) * 90);
        });
      } else if (view === 1) {
        kinds.forEach((kind, index) => {
          this.addPet(kind, index, 120 + index * 140, 170 + (index % 3) * 110);
        });
      } else {
        const puffer = new Pufferfish();
        puffer.state = 'fly';
        puffer.x = 720;
        puffer.y = 250;
        puffer.vx = -260;
        puffer.vy = 0;
        this.addEntity(puffer, (dt) => {
          puffer.update(dt);
          if (puffer.x < puffer.radius) {
            puffer.x = puffer.radius;
            puffer.vx = Math.abs(puffer.vx);
          } else if (puffer.x > LOGICAL_WIDTH - puffer.radius) {
            puffer.x = LOGICAL_WIDTH - puffer.radius;
            puffer.vx = -Math.abs(puffer.vx);
          }
        });
        const turtle = new Turtle();
        turtle.x = 460;
        turtle.y = 180;
        turtle.waypointX = 460;
        turtle.waypointY = 180;
        this.addEntity(turtle, (dt) => turtle.update(dt, [], 1));
        this.addPet('shark', 0, 200, 320);
        this.addPet('moray', 1, 300, 400);
      }
      return;
    }
  }

  buildGameShot(id) {
    if (id === 'title') {
      for (let index = 0; index < 4; index += 1) {
        this.scenery.push(new Coral(rand(80, LOGICAL_WIDTH - 80), index % 3));
      }
      this.addCrew(Shark, -140, 300, 95);
      return;
    }
    if (id === 'reef') {
      for (let index = 0; index < 5; index += 1) {
        this.scenery.push(new Coral(rand(60, LOGICAL_WIDTH - 60), index % 3));
      }
      this.scenery.push(new ReefRock(-1));
      this.scenery.push(new ReefRock(1));
      this.schools.push(new ColorSchool());
      this.schools.push(new ColorSchool());
      this.addCrew(Shark, -140, 250, 135);
      const jellyA = new Jellyfish(360, 300);
      const jellyB = new Jellyfish(660, 220);
      this.addEntity(jellyA, (dt) => {
        jellyA.baseY = 300;
        jellyA.update(dt);
      });
      this.addEntity(jellyB, (dt) => {
        jellyB.baseY = 220;
        jellyB.update(dt);
      });
      return;
    }
    if (id === 'deep') {
      const anglerA = new Anglerfish();
      anglerA.x = 260;
      anglerA.y = 300;
      const anglerB = new Anglerfish();
      anglerB.x = 720;
      anglerB.y = 200;
      this.addEntity(anglerA, (dt) => anglerA.update(dt, [], 1));
      this.addEntity(anglerB, (dt) => anglerB.update(dt, [], 1));
      this.addCrew(Squid, -160, 380, 110);
      return;
    }
    if (id === 'arctic') {
      const ice = new IceChunk();
      ice.x = LOGICAL_WIDTH / 2;
      ice.y = 130;
      this.scenery.push(ice);
      const schoolA = new SardineSchool();
      schoolA.x = 330;
      schoolA.y = 300;
      schoolA.baseX = 330;
      schoolA.baseY = 300;
      const schoolB = new SardineSchool();
      schoolB.x = 640;
      schoolB.y = 240;
      schoolB.baseX = 640;
      schoolB.baseY = 240;
      this.scenery.push(schoolA);
      this.scenery.push(schoolB);
      const perch = ice.perches[1];
      const seal = new Seal(perch.x, perch.y);
      this.addEntity(seal, (dt) => seal.update(dt, [], 1));
      this.addCrew(ArcticShrimp, -160, 330, 120);
      return;
    }
    if (id === 'bosses') {
      this.scenery.push(new KelpForest());
      const octopus = new Octopus();
      octopus.x = 300;
      octopus.y = 300;
      const turtle = new Turtle();
      turtle.x = 700;
      turtle.y = 220;
      turtle.waypointX = 700;
      turtle.waypointY = 220;
      this.addEntity(octopus, (dt) => octopus.update(dt, [], 1));
      this.addEntity(turtle, (dt) => turtle.update(dt, [], 1));
      this.addCrew(MoonJelly, -160, 430, 100);
      return;
    }
    if (id === 'minigames') {
      for (const [x, y, vx, vy] of [
        [300, 210, 260, 60],
        [640, 330, -300, -40],
        [470, 160, 180, 90],
      ]) {
        const puffer = new Pufferfish();
        puffer.state = 'fly';
        puffer.x = x;
        puffer.y = y;
        puffer.vx = vx;
        puffer.vy = vy;
        this.addEntity(puffer, (dt) => {
          puffer.update(dt);
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
        });
      }
      this.addCrew(Shark, -140, 200, 155);
      this.addCrew(Shark, -320, 360, 155);
      return;
    }
    if (id === 'dress') {
      for (let index = 0; index < 3; index += 1) {
        this.scenery.push(new Coral(120 + index * 330, index % 3));
      }
      const rock = new ReefRock(-1);
      rock.x = 240;
      this.scenery.push(rock);
      const weed = new Weed();
      weed.x = 730;
      this.scenery.push(weed);
      const ice = new IceChunk();
      ice.x = 500;
      ice.y = 190;
      this.scenery.push(ice);
      this.addCrew(Shark, 190, 310, 0, 14);
      this.dressTimer = 0;
      return;
    }
    if (id === 'labyrinth') {
      this.addLabyrinthSet({ squid: true, arms: 4, morays: 3 });
      return;
    }
    if (id === 'finale') {
      for (let index = 0; index < 5; index += 1) {
        this.scenery.push(new Coral(rand(70, LOGICAL_WIDTH - 70), index % 3));
      }
      this.schools.push(new ColorSchool());
      const crew = [Shark, Stingray, Squid, ArcticShrimp, KelpCrab, MoonJelly, Nautilus];
      crew.forEach((EntityClass, index) => {
        this.addCrew(EntityClass, -180 - index * 120, 150 + index * 42, 170 + index * 6);
      });
      return;
    }
  }

  applyShot(index) {
    const shot = this.shots[index];
    this.shotIndex = index;
    this.performers = [];
    this.scenery = [];
    this.bubbles = [];
    this.schools = [];
    this.petCast = [];
    this.bubbleSpawn = this.isCard(shot) ? 0.3 : 0.6;
    this.flash = 0.22;
    this.shake = Math.max(this.shake, 0.45);
    this.activeSkin = this.baseSkin;
    this.activeHead = this.baseHead;
    this.activeBody = this.baseBody;
    this.game.audio.tone({ freq: 70, endFreq: 40, type: 'sawtooth', duration: 0.45, volume: 0.28 });
    if (this.isCard(shot)) {
      this.game.audio.tone({ freq: 392, type: 'triangle', duration: 0.3, volume: 0.2 });
      this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.3, volume: 0.2, delay: 0.22 });
      this.game.audio.tone({ freq: 784, type: 'triangle', duration: 0.5, volume: 0.2, delay: 0.44 });
    }
    if (this.gauntlet) {
      if (shot.tank) this.buildTankShot(shot.view, shot.tank);
      else this.buildGameShot(shot.id);
    } else if (this.tankId) this.buildTankShot(shot.view);
    else if (this.minigameId) this.buildMinigameShot(shot.view);
    else this.buildGameShot(shot.id);
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene('theatre');
      return;
    }
    this.flash = Math.max(0, this.flash - dt * 1.4);
    this.shake = Math.max(0, this.shake - dt * 1.2);
    let index = 0;
    let acc = 0;
    while (index < this.shots.length - 1 && this.time >= acc + this.shots[index].duration) {
      acc += this.shots[index].duration;
      index += 1;
    }
    if (index !== this.shotIndex) this.applyShot(index);
    const shot = this.shots[this.shotIndex];
    this.shotElapsed = this.time - acc;
    this.progress = clamp(this.shotElapsed / shot.duration, 0, 1);

    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0) {
      this.bubbleTimer = this.bubbleSpawn * rand(0.7, 1.3);
      this.bubbles.push(
        new Bubble(rand(40, LOGICAL_WIDTH - 40), LOGICAL_HEIGHT + 24, {
          rise: rand(26, 58),
        }),
      );
    }
    this.bubbles = this.bubbles.filter((bubble) => {
      bubble.update(dt);
      return bubble.y > -30;
    });
    this.schools = this.schools.filter((school) => {
      school.update(dt);
      return school.alive;
    });
    for (const performer of this.performers) performer.update(dt);
    if (shot.id === 'dress') {
      this.dressTimer -= dt;
      if (this.dressTimer <= 0) {
        this.dressTimer = 0.8;
        this.skinIndex = (this.skinIndex + 1) % SKINS.length;
        this.activeSkin = skinByKey(SKINS[this.skinIndex].key);
        const heads = accessorySlotCatalog('head');
        const bodies = accessorySlotCatalog('body');
        this.headIndex = (this.headIndex + 1) % heads.length;
        this.activeHead = accessoryByKey(heads[this.headIndex].key);
        this.bodyIndex = (this.bodyIndex + 1) % bodies.length;
        this.activeBody = accessoryByKey(bodies[this.bodyIndex].key);
        this.game.audio.tone({ freq: 520, endFreq: 780, duration: 0.08, volume: 0.12 });
      }
    }
    if (input.wasPressed('confirm') || this.time >= this.total) {
      this.game.changeScene('theatre');
    }
  }

  render(ctx) {
    const shot = this.shots[this.shotIndex] ?? this.shots[0];
    const zoom = 1 + 0.05 * this.progress;
    setActiveSkin(this.activeSkin);
    setSkinClock(this.time);
    setActiveHeadAccessory(this.activeHead);
    setActiveBodyAccessory(this.activeBody);
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, PALETTES[shot.palette]);
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-LOGICAL_WIDTH / 2, -LOGICAL_HEIGHT / 2);
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 9 * this.shake, rand(-1, 1) * 9 * this.shake);
    }
    for (const piece of this.scenery) piece.render(ctx);
    for (const bubble of this.bubbles) bubble.render(ctx);
    for (const school of this.schools) school.render(ctx);
    for (const performer of this.performers) performer.entity.render(ctx);
    ctx.restore();
    this.renderOverlay(ctx, shot);
  }

  renderOverlay(ctx, shot) {
    const alpha = Math.min(
      clamp(this.shotElapsed / 0.3, 0, 1),
      clamp((shot.duration - this.shotElapsed) / 0.35, 0, 1),
    );
    const final = this.isCard(shot);
    const titleY = final ? LOGICAL_HEIGHT * 0.7 : LOGICAL_HEIGHT * 0.74;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, 46);
    ctx.fillRect(0, LOGICAL_HEIGHT - 46, LOGICAL_WIDTH, 46);
    drawText(ctx, 'SHARKQUARIUM — TRAILER', 18, 24, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.6,
      align: 'left',
    });
    drawText(ctx, shot.title, LOGICAL_WIDTH / 2, titleY, {
      size: final ? 46 : 30,
      color: COLORS.text,
      glow: final ? COLORS.accent : COLORS.bubble,
      glowBlur: 26,
      alpha: alpha * 0.95,
    });
    drawText(ctx, shot.sub, LOGICAL_WIDTH / 2, titleY + 42, {
      size: 13,
      color: COLORS.foam,
      alpha: alpha * 0.85,
    });
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, this.flash * 3) * 0.6})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    drawText(ctx, 'ENTER — SKIP', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 22, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.7,
    });
  }
}
