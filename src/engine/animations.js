import { clamp } from './math.js';
import { TWILIGHT, GOBLIN, OARFISH, CUTTLEFISH, FROGFISH, BLACK_SWALLOWER, ANGLER, REEF_RUSH } from '../config.js';
import { Cuttlefish } from '../entities/cuttlefish.js';
import { BlackSwallower } from '../entities/blackswallower.js';
import { drawCuttlefishGlyph } from '../entities/cuttlefishshape.js';
import { drawFrogfish } from '../entities/realfish.js';
import { drawLoosejaw, drawHatchetFish } from '../entities/deepfish.js';
import { drawGoblinShark } from '../entities/goblinshark.js';
import { drawAnglerBody } from '../entities/anglerfish.js';
import { drawBlackSwallower } from '../entities/blackswallower.js';
import { drawSacabambaspis } from '../entities/sacabambaspis.js';
import { drawOarfishBody } from '../entities/oarfish.js';

import {
  drawVampireSquid, drawBarreleye, drawGulperEel, drawViperfish, drawDumboOctopus, drawFangtooth, drawTripodFish, drawSeaPig, drawYetiCrab, drawChimaera, drawCoelacanth, drawGiantGrouper, drawNapoleonWrasse, drawNudibranch, drawBlueRingedOctopus, drawEagleRay, drawWhaleShark, drawBobbitWorm, drawFrilledShark, drawSpermWhale, drawBobbitQueen,
} from '../entities/creatures.js';

function makeSimple(fn, scale = 1) {
  let t = 0;
  return {
    update(dt) { t += dt; },
    draw(ctx, r) { fn(ctx, r * scale, { age: t }); },
  };
}

const smoothstep = (p) => {
  const q = clamp(p, 0, 1);
  return q * q * (3 - 2 * q);
};

const TWILIGHT_PLAYER_RADIUS = 20;

function makeCuttlefish() {
  const entity = new Cuttlefish(0, 0, { controls: {}, pointer: false });
  const input = {
    isDown: () => false,
    wasPressed: () => false,
    pointer: { down: false, look: false, dragX: 0, dragY: 0 },
  };
  let timer = 0.4;
  return {
    update(dt) {
      timer -= dt;
      if (timer <= 0) {
        entity.fireTentacles();
        timer = 2.4;
      }
      entity.vx = 0;
      entity.vy = 0;
      entity.x = 0;
      entity.y = 0;
      entity.update(dt, input);
    },
    draw(ctx, r) {
      drawCuttlefishGlyph(ctx, r, {
        age: entity.age,
        camo: entity.camo,
        strike: entity.strike,
        splay: entity.splay,
        hypno: entity.hypno,
      }, '#c0392b');
    },
  };
}

function makeFrogfish() {
  let t = 0;
  let lure = 0;
  let timer = 0;
  let luring = false;
  return {
    update(dt) {
      t += dt;
      timer -= dt;
      if (timer <= 0) {
        luring = !luring;
        timer = luring ? 1.4 : 1.2;
      }
      lure += ((luring ? 1 : 0) - lure) * (1 - Math.exp(-8 * dt));
    },
    draw(ctx, r) {
      drawFrogfish(ctx, r, { age: t, lure });
    },
  };
}

function makeLoosejaw() {
  const C = TWILIGHT;
  let t = 0;
  let cooldown = 1.4;
  const m = { jaw: 0.75, swing: 0, state: 'patrol', timer: 0, bitePhase: 'none', biteSwing0: 0, biteJaw0: 0.75, biteJaw1: 0.75 };
  return {
    update(dt) {
      t += dt;
      if (m.state === 'patrol') {
        m.jaw += (0.75 - m.jaw) * (1 - Math.exp(-6 * dt));
        m.swing += (0 - m.swing) * (1 - Math.exp(-8 * dt));
        cooldown -= dt;
        if (cooldown <= 0) {
          m.state = 'charge';
          m.timer = 0.5;
        }
      } else if (m.state === 'charge') {
        m.timer -= dt;
        m.jaw += (0.9 - m.jaw) * (1 - Math.exp(-10 * dt));
        m.swing += (0 - m.swing) * (1 - Math.exp(-10 * dt));
        if (m.timer <= 0) {
          m.state = 'bite';
          m.bitePhase = 'windup';
          m.timer = C.hunterBiteTime;
          m.biteSwing0 = m.swing;
          m.biteJaw0 = m.jaw;
        }
      } else if (m.state === 'bite') {
        m.timer -= dt;
        const dur = m.timer + dt;
        if (m.bitePhase === 'windup') {
          const e = smoothstep(dur > 0 ? 1 - Math.max(0, m.timer) / dur : 1);
          m.swing = m.biteSwing0 + (1 - m.biteSwing0) * e;
          m.jaw = m.biteJaw0 + (1 - m.biteJaw0) * e;
          if (m.timer <= 0) {
            m.bitePhase = 'shut';
            m.timer = 0.06;
            m.biteJaw1 = m.jaw;
          }
        } else {
          const e = smoothstep(dur > 0 ? 1 - Math.max(0, m.timer) / dur : 1);
          m.swing = 1;
          m.jaw = m.biteJaw1 * (1 - e);
          if (m.timer <= 0) {
            m.state = 'recover';
            m.timer = C.hunterRecover;
            m.bitePhase = 'none';
          }
        }
      } else {
        m.timer -= dt;
        m.jaw += (0.75 - m.jaw) * (1 - Math.exp(-6 * dt));
        m.swing += (0 - m.swing) * (1 - Math.exp(-8 * dt));
        if (m.timer <= 0) {
          m.state = 'patrol';
          cooldown = 1.6;
        }
      }
    },
    draw(ctx, r) {
      drawLoosejaw(ctx, r, { age: t, jawOpen: m.jaw, swing: m.swing, spotRows: 3 });
    },
  };
}

function makeGoblinShark() {
  const C = GOBLIN;
  let t = 0;
  let cooldown = C.lungeCooldown;
  const s = { jaw: 0.2, jawExt: 0, state: 'patrol', shootPhase: 'none', timer: 0, alert: 0 };
  return {
    update(dt) {
      t += dt;
      s.alert = Math.max(0, s.alert - dt * 0.7);
      cooldown = Math.max(0, cooldown - dt);
      if (s.state === 'patrol') {
        s.jaw += (0.2 - s.jaw) * (1 - Math.exp(-5 * dt));
        s.jawExt = Math.max(0, s.jawExt - dt * 3);
        if (cooldown <= 0) {
          s.state = 'wind';
          s.timer = C.lungeTelegraph;
          s.alert = 1;
        }
      } else if (s.state === 'wind') {
        s.timer -= dt;
        s.jaw += (1 - s.jaw) * (1 - Math.exp(-6 * dt));
        s.jawExt = 0;
        s.alert = 1;
        if (s.timer <= 0) {
          s.state = 'shoot';
          s.shootPhase = 'extend';
          s.timer = C.lungeExtend;
          s.jawExt = 0;
        }
      } else if (s.state === 'shoot') {
        s.alert = 1;
        if (s.shootPhase === 'extend') {
          s.jaw = 1;
          s.jawExt = clamp(s.jawExt + dt / C.lungeExtend, 0, 1);
          if (s.jawExt >= 1) {
            s.shootPhase = 'chomp';
            s.timer = C.lungeHold;
          }
        } else if (s.shootPhase === 'chomp') {
          s.jawExt = 1;
          const e = clamp(1 - Math.max(0, s.timer) / C.lungeHold, 0, 1);
          s.jaw = 1 - e;
          s.timer -= dt;
          if (s.timer <= 0) {
            s.jaw = 0;
            s.shootPhase = 'retract';
            s.timer = C.lungeRetract;
          }
        } else {
          s.jaw = 0.2;
          s.jawExt = clamp(s.jawExt - dt / C.lungeRetract, 0, 1);
          if (s.jawExt <= 0) {
            s.state = 'recover';
            s.timer = C.sharkRecover;
            cooldown = C.lungeCooldown;
          }
        }
      } else {
        s.timer -= dt;
        if (s.timer <= 0) s.state = 'patrol';
      }
    },
    draw(ctx, r) {
      drawGoblinShark(ctx, r, { age: t, jawOpen: s.jaw, jawExtend: s.jawExt, alert: s.alert });
    },
  };
}

function makeSwallower() {
  const entity = new BlackSwallower();
  let timer = 1.6;
  return {
    update(dt) {
      timer -= dt;
      if (timer <= 0) {
        entity.gulp = 1;
        timer = 2.8;
      }
      entity.update(dt);
      entity.vx = 0;
      entity.vy = 0;
      entity.x = 0;
      entity.y = 0;
    },
    draw(ctx, r) {
      drawBlackSwallower(ctx, r, { age: entity.age, gulp: entity.gulp, swallow: entity.swallow });
    },
  };
}

function makeAnglerfish() {
  let t = 0;
  return {
    update(dt) {
      t += dt;
    },
    draw(ctx, r) {
      drawAnglerBody(ctx, r, { age: t, glow: 1 });
    },
  };
}

function makeHatchetfish() {
  const C = TWILIGHT;
  let t = 0;
  let glow = 0.18;
  let flash = 0;
  let cooldown = 1.2;
  return {
    update(dt) {
      t += dt;
      const visible = clamp((Math.sin(t * 1.3) * 0.5 + 0.5) * 1.15, 0, 1);
      glow = 0.18 + visible * 0.72;
      flash = Math.max(0, flash - dt * 2.2);
      cooldown -= dt;
      if (cooldown <= 0) {
        cooldown = C.flashCooldown;
        flash = 1;
      }
    },
    draw(ctx, r) {
      drawHatchetFish(ctx, r, { age: t, glow, flash });
    },
  };
}

function makeOarfish() {
  const C = OARFISH;
  let t = 0;
  let phase = 0;
  let alert = 0;
  let rising = true;
  let timer = 0;
  return {
    update(dt) {
      t += dt;
      phase += dt;
      timer -= dt;
      if (timer <= 0) {
        rising = !rising;
        timer = rising ? 1.6 : 2;
      }
      alert = clamp(alert + (rising ? C.alertRise : -C.alertFall) * dt, 0, 1);
    },
    draw(ctx, r) {
      drawOarfishBody(ctx, r, { age: t, phase, alert });
    },
  };
}

function makeSacabambaspis() {
  let t = 0;
  return {
    update(dt) {
      t += dt;
    },
    draw(ctx, r) {
      drawSacabambaspis(ctx, r, { age: t });
    },
  };
}

export const ANIMATIONS = [
  {
    key: 'cuttlefish',
    name: 'CUTTLEFISH',
    action: 'FEEDING STRIKE',
    kind: 'EAT',
    radius: CUTTLEFISH.radius,
    make: makeCuttlefish,
    anatomy: [
      { label: 'MANTLE', x: 0.1, y: -0.55 },
      { label: 'FIN', x: -1.35, y: 0 },
      { label: 'EYE', x: 1.05, y: 0.34 },
      { label: 'FEEDING TENTACLES', x: 1.4, y: 0 },
    ],
  },
  {
    key: 'frogfish',
    name: 'FROGFISH',
    action: 'LURE WAVE',
    kind: 'EAT',
    radius: FROGFISH.playerRadius,
    make: makeFrogfish,
    anatomy: [
      { label: 'LURE', x: 1.3, y: -1.1 },
      { label: 'MOUTH', x: 1.1, y: 0.15 },
      { label: 'CAMOUFLAGE', x: -0.4, y: -0.25 },
      { label: 'PECTORAL FIN', x: -1.0, y: 0.5 },
    ],
  },
  {
    key: 'loosejaw',
    name: 'STOPLIGHT LOOSEJAW',
    action: 'JAW SNAP',
    kind: 'EAT',
    radius: GOBLIN.playerRadius,
    center: -2.2,
    make: makeLoosejaw,
    anatomy: [
      { label: 'PHOTOPHORES', x: -2.4, y: 0.34 },
      { label: 'RED STOPLIGHT', x: 0.28, y: 0.34 },
      { label: 'LOOSE JAW', x: 0.4, y: 0.2 },
    ],
  },
  {
    key: 'goblinshark',
    name: 'GOBLIN SHARK',
    action: 'JAW LUNGE',
    kind: 'EAT',
    radius: GOBLIN.sharkRadius,
    center: 0.7,
    make: makeGoblinShark,
    anatomy: [
      { label: 'PROTRUSIBLE JAW', x: 1.5, y: 0.2 },
      { label: 'LONG SNOUT', x: 2.8, y: 0 },
      { label: 'GILL SLITS', x: -0.4, y: 0.3 },
    ],
  },
  {
    key: 'swallower',
    name: 'BLACK SWALLOWER',
    action: 'GULP',
    kind: 'EAT',
    radius: BLACK_SWALLOWER.radius,
    center: -0.45,
    make: makeSwallower,
    anatomy: [
      { label: 'INFLATING STOMACH', x: -0.2, y: 0.7 },
      { label: 'HINGED JAW', x: 1.7, y: 0.3 },
    ],
  },
  {
    key: 'angler',
    name: 'ANGLERFISH',
    action: 'LURE GLOW',
    kind: 'LURE',
    radius: ANGLER.radius,
    make: makeAnglerfish,
    anatomy: [
      { label: 'LURE', x: 0.95, y: -1.6 },
      { label: 'JAW', x: 1.1, y: 0.15 },
    ],
  },
  {
    key: 'hatchetfish',
    name: 'HATCHETFISH',
    action: 'GLOW FLASH',
    kind: 'LIGHT',
    radius: TWILIGHT_PLAYER_RADIUS,
    center: -0.35,
    make: makeHatchetfish,
    anatomy: [
      { label: 'PHOTOPHORES', x: -0.4, y: 0.9 },
      { label: 'UPWARD EYES', x: 0.45, y: -0.45 },
    ],
  },
  {
    key: 'oarfish',
    name: 'OARFISH',
    action: 'RIPPLE',
    kind: 'SWIM',
    radius: OARFISH.radius,
    fit: 0.6,
    center: -4,
    make: makeOarfish,
    anatomy: [
      { label: 'DORSAL CREST', x: 0.0, y: -0.8 },
      { label: 'OAR PELVIC FINS', x: 0.5, y: 2.0 },
    ],
  },
  {
    key: 'sacabamba',
    name: 'SACABAMBASPIS',
    action: 'SWIM WIGGLE',
    kind: 'SWIM',
    radius: REEF_RUSH.playerRadius,
    center: -0.9,
    make: makeSacabambaspis,
    anatomy: [
      { label: 'GILL HOLES', x: -0.4, y: 0.1 },
      { label: 'MOUTH', x: 0.75, y: 0.55 },
      { label: 'EYES', x: 0.4, y: 0.08 },
    ],
  },
  {
    key: 'vampire',
    name: 'VAMPIRE SQUID',
    action: 'GLIDE',
    kind: 'ANATOMY',
    radius: 30,
    make: () => makeSimple(drawVampireSquid),
    anatomy: [
      { label: 'CLOAK', x: -1.2, y: 0 },
      { label: 'EYES', x: 0.85, y: 0.36 },
    ],
  },
  {
    key: 'barreleye',
    name: 'BARRELEYE',
    action: 'DRIFT',
    kind: 'ANATOMY',
    radius: 34,
    make: () => makeSimple(drawBarreleye),
    anatomy: [
      { label: 'CLEAR DOME', x: 0.25, y: -0.55 },
      { label: 'TUBE EYES', x: 0.32, y: -0.5 },
    ],
  },
  {
    key: 'gulper',
    name: 'GULPER EEL',
    action: 'GAPE',
    kind: 'ANATOMY',
    radius: 12,
    center: -1.6,
    make: () => makeSimple(drawGulperEel),
    anatomy: [
      { label: 'PELICAN JAW', x: 1.8, y: 0 },
      { label: 'LURE TAIL', x: -3.4, y: 0 },
    ],
  },
  {
    key: 'viper',
    name: 'VIPERFISH',
    action: 'FANG',
    kind: 'ANATOMY',
    radius: 20,
    center: -0.5,
    make: () => makeSimple(drawViperfish),
    anatomy: [
      { label: 'FANGS', x: 1.3, y: 0.3 },
      { label: 'LURE', x: 0.5, y: -1.6 },
    ],
  },
  {
    key: 'dumbo',
    name: 'DUMBO OCTOPUS',
    action: 'FLAP',
    kind: 'ANATOMY',
    radius: 34,
    make: () => makeSimple(drawDumboOctopus),
    anatomy: [
      { label: 'EAR FINS', x: -0.6, y: 0.7 },
      { label: 'ARMS', x: 0, y: 1.6 },
    ],
  },
  {
    key: 'fangtooth',
    name: 'FANGTOOTH',
    action: 'GAPE',
    kind: 'ANATOMY',
    radius: 30,
    make: () => makeSimple(drawFangtooth),
    anatomy: [
      { label: 'HUGE TEETH', x: 0.8, y: 0.3 },
    ],
  },
  {
    key: 'tripod',
    name: 'TRIPOD FISH',
    action: 'PERCH',
    kind: 'ANATOMY',
    radius: 24,
    make: () => makeSimple(drawTripodFish),
    anatomy: [
      { label: 'STILT FINS', x: -0.4, y: 1.6 },
      { label: 'FIN RAYS', x: 0.6, y: 0.5 },
    ],
  },
  {
    key: 'seapig',
    name: 'SEA PIG',
    action: 'WALK',
    kind: 'ANATOMY',
    radius: 30,
    make: () => makeSimple(drawSeaPig),
    anatomy: [
      { label: 'TUBE FEET', x: -0.3, y: 0.9 },
      { label: 'DORSAL PAPILLAE', x: 0, y: -0.9 },
    ],
  },
  {
    key: 'yeti',
    name: 'YETI CRAB',
    action: 'FARM',
    kind: 'ANATOMY',
    radius: 28,
    make: () => makeSimple(drawYetiCrab),
    anatomy: [
      { label: 'HAIRY CLAWS', x: 1.3, y: 0.8 },
      { label: 'SETAE', x: 1.4, y: 0.6 },
    ],
  },
  {
    key: 'chimaera',
    name: 'CHIMAERA',
    action: 'GLIDE',
    kind: 'ANATOMY',
    radius: 14,
    center: -1.2,
    make: () => makeSimple(drawChimaera),
    anatomy: [
      { label: 'WING FINS', x: 0.2, y: -0.7 },
      { label: 'WHIP TAIL', x: -3.4, y: 0 },
    ],
  },
  {
    key: 'coelacanth',
    name: 'COELACANTH',
    action: 'DRIFT',
    kind: 'ANATOMY',
    radius: 30,
    make: () => makeSimple(drawCoelacanth),
    anatomy: [
      { label: 'LOBED FINS', x: -0.4, y: 0.9 },
    ],
  },
  {
    key: 'grouper',
    name: 'GIANT GROUPER',
    action: 'INHALE',
    kind: 'ANATOMY',
    radius: 24,
    make: () => makeSimple(drawGiantGrouper),
    anatomy: [
      { label: 'VAST MOUTH', x: 1.7, y: 0.3 },
    ],
  },
  {
    key: 'napoleon',
    name: 'NAPOLEON WRASSE',
    action: 'FOLLOW',
    kind: 'ANATOMY',
    radius: 24,
    make: () => makeSimple(drawNapoleonWrasse),
    anatomy: [
      { label: 'FOREHEAD HUMP', x: 1.1, y: -1.0 },
    ],
  },
  {
    key: 'nudibranch',
    name: 'NUDIBRANCH',
    action: 'CRAWL',
    kind: 'ANATOMY',
    radius: 40,
    make: () => makeSimple(drawNudibranch),
    anatomy: [
      { label: 'GILL PLUMES', x: -0.2, y: -0.8 },
      { label: 'RHINOPHORES', x: 1.4, y: 0.2 },
    ],
  },
  {
    key: 'blurring',
    name: 'BLUE-RINGED OCTOPUS',
    action: 'FLASH',
    kind: 'ANATOMY',
    radius: 34,
    make: () => makeSimple(drawBlueRingedOctopus),
    anatomy: [
      { label: 'BLUE RINGS', x: 0.45, y: 0.1 },
    ],
  },
  {
    key: 'eagleray',
    name: 'EAGLE RAY',
    action: 'SOAR',
    kind: 'ANATOMY',
    radius: 30,
    center: -1,
    make: () => makeSimple(drawEagleRay),
    anatomy: [
      { label: 'WINGS', x: 0, y: 1.6 },
      { label: 'BARBED TAIL', x: -3.6, y: 0 },
    ],
  },
  {
    key: 'whaleshark',
    name: 'WHALE SHARK',
    action: 'CRUISE',
    kind: 'ANATOMY',
    radius: 10,
    make: () => makeSimple(drawWhaleShark),
    anatomy: [
      { label: 'SPOTS', x: 0, y: 0.6 },
      { label: 'WIDE MOUTH', x: 2.4, y: 0.1 },
    ],
  },
  {
    key: 'bobbit',
    name: 'BOBBIT WORM',
    action: 'AMBUSH',
    kind: 'ANATOMY',
    radius: 14,
    center: -1.6,
    make: () => makeSimple(drawBobbitWorm),
    anatomy: [
      { label: 'SCISSOR JAWS', x: 0.5, y: 0.2 },
      { label: 'SEGMENTS', x: -2, y: 0 },
    ],
  },
  {
    key: 'frilled',
    name: 'FRILLED SHARK',
    action: 'STRIKE',
    kind: 'ANATOMY',
    radius: 10,
    center: -1.6,
    make: () => makeSimple(drawFrilledShark),
    anatomy: [
      { label: 'FRILLED GILLS', x: 1.2, y: 0 },
      { label: 'THREE-PRONG TEETH', x: 2.1, y: 0.2 },
    ],
  },
  {
    key: 'spermwhale',
    name: 'SPERM WHALE',
    action: 'DIVE',
    kind: 'ANATOMY',
    radius: 10,
    make: () => makeSimple(drawSpermWhale),
    anatomy: [
      { label: 'SQUARE HEAD', x: 2.6, y: 0 },
      { label: 'NOSE', x: 3.0, y: 0.1 },
    ],
  },
  {
    key: 'bobbitqueen',
    name: 'BOBBIT QUEEN',
    action: 'STRIKE',
    kind: 'ANATOMY',
    radius: 9,
    center: -1.6,
    make: () => makeSimple(drawBobbitQueen),
    anatomy: [
      { label: 'CROWN', x: 0.5, y: 0.2 },
      { label: 'ARMOUR', x: -2, y: 0 },
    ],
  },
];

export function animatedByKey(key) {
  return ANIMATIONS.find((entry) => entry.key === key) ?? null;
}
