import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function makeEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    listenersFor(type) {
      return listeners.get(type) ?? new Set();
    },
  };
}

const noop = () => {};

const windowTarget = makeEventTarget();
const canvasTarget = makeEventTarget();

const drawingContext = new Proxy(
  {},
  {
    get(target, property) {
      if (property in target) return target[property];
      if (property === 'canvas') return canvas;
      if (property === 'measureText') return () => ({ width: 0 });
      if (property === 'createLinearGradient' || property === 'createRadialGradient') {
        return () => ({ addColorStop: noop });
      }
      return noop;
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  },
);

const canvas = {
  width: 960,
  height: 540,
  style: {},
  getContext: () => drawingContext,
  getBoundingClientRect: () => ({ left: 0, top: 0, right: 960, bottom: 540, width: 960, height: 540 }),
  addEventListener: canvasTarget.addEventListener,
  removeEventListener: canvasTarget.removeEventListener,
  focus: noop,
  setAttribute: noop,
};

const frameQueue = new Map();
let frameId = 0;

const storage = new Map();
const localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => {
    storage.set(key, String(value));
  },
  removeItem: (key) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
};

const windowStub = Object.assign(windowTarget, {
  devicePixelRatio: 1,
  innerWidth: 1280,
  innerHeight: 720,
  localStorage,
  AudioContext: undefined,
  webkitAudioContext: undefined,
  requestAnimationFrame: (callback) => {
    frameId += 1;
    frameQueue.set(frameId, callback);
    return frameId;
  },
  cancelAnimationFrame: (id) => {
    frameQueue.delete(id);
  },
});

const documentStub = {
  getElementById: (id) => (id === 'game' ? canvas : null),
  createElement: (tag) =>
    tag === 'canvas'
      ? {
          width: 0,
          height: 0,
          style: {},
          getContext: () => drawingContext,
          getBoundingClientRect: () => ({ left: 0, top: 0, right: 960, bottom: 540, width: 960, height: 540 }),
        }
      : null,
  addEventListener: noop,
  removeEventListener: noop,
  hidden: false,
  visibilityState: 'visible',
};

Object.assign(globalThis, {
  window: windowStub,
  document: documentStub,
  localStorage,
  requestAnimationFrame: windowStub.requestAnimationFrame,
  cancelAnimationFrame: windowStub.cancelAnimationFrame,
});

let clock = 0;

async function frames(count) {
  for (let i = 0; i < count; i += 1) {
    clock += 1000 / 60;
    const pending = [...frameQueue.values()];
    frameQueue.clear();
    for (const callback of pending) callback(clock);
    await new Promise((resolve) => setImmediate(resolve));
  }
}

function pressKey(code) {
  for (const handler of windowTarget.listenersFor('keydown')) {
    handler({ code, repeat: false, preventDefault: noop });
  }
}

function releaseKey(code) {
  for (const handler of windowTarget.listenersFor('keyup')) {
    handler({ code, preventDefault: noop });
  }
}

async function tapKey(code) {
  pressKey(code);
  releaseKey(code);
  await frames(2);
}

function movePointer(x, y) {
  for (const handler of canvasTarget.listenersFor('pointermove')) {
    handler({ clientX: x, clientY: y });
  }
}

function canvasPointerDown(x, y) {
  for (const handler of canvasTarget.listenersFor('pointerdown')) {
    handler({ clientX: x, clientY: y });
  }
}

function canvasPointerUp() {
  for (const handler of windowTarget.listenersFor('pointerup')) {
    handler({});
  }
}

function canvasPointerDownSecondary(x, y) {
  for (const handler of canvasTarget.listenersFor('pointerdown')) {
    handler({ clientX: x, clientY: y, button: 2 });
  }
}

async function clickAt(x, y) {
  canvasPointerDown(x, y);
  await frames(2);
  canvasPointerUp();
}

async function skipDescent() {
  await frames(20);
  await tapKey('Enter');
  await frames(3);
}

async function main() {
  const html = await readFile('dist/index.html', 'utf8').catch(() => {
    throw new Error('dist/index.html not found; run the build first');
  });

  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, 'dist/index.html should contain exactly one inline script');
  const code = scripts[0][1].replaceAll('<\\/script', '</script');

  (0, eval)(code);

  const game = globalThis.__game;
  assert.ok(game, 'game instance should be exposed as globalThis.__game');

  await frames(10);
  assert.equal(game.currentSceneName, 'intro', 'boot should hand off to the intro splash');
  assert.equal(game.music.track.name, 'menu', 'the intro should play the menu theme');
  await frames(60);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'the intro splash should hand off to the menu');
  assert.equal(game.music.track.name, 'menu', 'the menu should keep the menu theme playing');
  assert.equal(game.scene.menu.index, 0, 'menu should start on START DIVE');
  assert.equal(game.scene.coins, 500, 'new players should start with a welcome sea-coin bank');

  game.set3D(true);
  await frames(4);
  assert.equal(game.threeD, true, '3D mode should be active on the menu');
  assert.ok(game.scene.shark, 'the menu shark should be drawn as a 3D volume');
  await frames(40);
  assert.ok(game.scene.bubbles.length > 0, 'the menu bubbles should draw as 3D spheres');
  game.set3D(false);
  await frames(2);
  assert.equal(canvas.style.transform, 'none', 'leaving 3D mode should flatten the canvas');
  assert.equal(game.threeD, false, '3D mode should switch back off');

  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 1, 'arrow down should navigate the menu');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 2, 'arrow down should keep navigating the menu');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 3, 'arrow down should reach the shop');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 4, 'arrow down should reach settings');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 5, 'arrow down should reach how to play');

  await tapKey('Enter');
  assert.equal(game.scene.showHelp, true, 'how to play overlay should open');
  await tapKey('Escape');
  assert.equal(game.scene.showHelp, false, 'escape should close the how to play overlay');

  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.items[6].label, 'LORE', 'the lore option should sit below how to play');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'lore', 'the menu should open the lore codex');
  assert.equal(game.scene.section.title, 'THE WRECK', 'the codex should open on the wreck');
  assert.ok(game.scene.section.entries.length >= 4, 'the wreck section should hold its story beats');
  assert.equal(game.scene.entry.name, 'SHARKQUARIUM', 'the codex should select the first entry');
  await tapKey('ArrowDown');
  assert.equal(game.scene.entry.name, 'THE LIGHTS-OUT LAP', 'down should step through entries');
  await tapKey('ArrowRight');
  assert.equal(game.scene.section.title, 'THE TANKS', 'right should change sections');
  assert.equal(game.scene.entry.name, 'REEF TANK', 'a new section should start at its first entry');
  await tapKey('ArrowRight');
  assert.equal(game.scene.section.title, 'THE DIVERS', 'right should keep changing sections');
  await tapKey('ArrowRight');
  assert.equal(game.scene.section.title, 'THE HAZARDS', 'the codex should list the hazards');
  await tapKey('ArrowRight');
  assert.equal(game.scene.section.title, 'THE MINIGAMES', 'the codex should list the minigames');
  await tapKey('ArrowLeft');
  assert.equal(game.scene.section.title, 'THE HAZARDS', 'left should step back through sections');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'escape should leave the lore codex');

  movePointer(480, 293);
  await frames(2);
  assert.equal(game.scene.menu.index, 1, 'pointer hover should select CHOOSE TANK');
  await clickAt(480, 293);
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'clicking CHOOSE TANK should open the tank select');
  assert.equal(game.music.track.name, 'menu', 'menu screens should keep the menu theme playing');
  assert.equal(
    game.scene.menu.items[5].label,
    'KELP FOREST TANK',
    'the tank list should include the kelp forest tank',
  );
  assert.equal(game.scene.menu.items[7].label, 'NAUTILUS TANK', 'the tank list should include the nautilus tank');
  assert.equal(
    game.scene.menu.items[8].label,
    'FRESHWATER TANK',
    'the nautilus tank should sit before the freshwater tank',
  );
  assert.equal(
    game.scene.menu.items[9].label,
    'ABYSS TRENCH TANK',
    'the abyss boss tank should join the list',
  );
  assert.equal(
    game.scene.menu.items[10].label,
    'REEF SWARM QUEEN',
    'the reef swarm queen tank should join the list',
  );
  assert.equal(
    game.scene.menu.items[11].label,
    'RAYCAST TANK',
    'the raycast tank should join the list',
  );
  assert.equal(
    game.scene.menu.items[12].label,
    'MYSTERIOUSLY QUIET TANK',
    'the horror tank should join the list',
  );
  assert.equal(
    game.scene.menu.items[13].label,
    'THE ESCAPE',
    'the escape should join the list as its own tank',
  );
  assert.equal(
    game.scene.menu.items[14].label,
    'THE WATCHER',
    'the watcher tank should join the list',
  );
  assert.equal(
    game.scene.menu.items[15].label,
    'THE TRENCH MOUTH',
    'the trench mouth tank should join the list',
  );
  assert.equal(
    game.scene.menu.items[16].label,
    'PREHISTORIC TANK',
    'the prehistoric tank should join the list',
  );
  assert.equal(
    game.scene.menu.items[17].label,
    'PLAYTOY EXPLORATION',
    'the playtoy exploration tank should join the list',
  );
  assert.equal(game.scene.menu.items[18].label, 'EMPTY TANK', 'the tank list should include every tank');
  assert.equal(game.scene.menu.visibleCount(), 11, 'the tank list should show a scrolling window');
  game.scene.menu.setIndex(1, false);
  assert.equal(game.scene.menu.scroll, 0, 'the first tanks should be visible at the top');
  assert.ok(
    game.scene.menu.bounds.some((b) => b.index === 1),
    'the REEF tank should be reachable without scrolling',
  );
  game.scene.menu.setIndex(18, false);
  await frames(1);
  assert.ok(game.scene.menu.scroll > 0, 'reaching EMPTY TANK should scroll the list');
  const emptyRow = game.scene.menu.bounds.find((b) => b.index === 18);
  assert.ok(emptyRow, 'the EMPTY TANK row should be in the window');
  movePointer(emptyRow.x + emptyRow.width / 2, emptyRow.y + emptyRow.height / 2);
  await frames(2);
  assert.equal(game.scene.menu.index, 18, 'pointer hover should select EMPTY TANK in the list');
  await clickAt(emptyRow.x + emptyRow.width / 2, emptyRow.y + emptyRow.height / 2);
  await frames(5);
  assert.equal(game.currentSceneName, 'play', 'clicking EMPTY TANK should start the play scene');
  assert.equal(game.scene.empty, true, 'empty tank should start without spawning content');
  assert.ok(game.scene.hud, 'play scene should own a hud');
  assert.equal(game.music.track, null, 'the empty test tank should stay silent');

  await tapKey('Escape');
  assert.equal(game.scene.paused, true, 'escape should pause the dive');
  await tapKey('Escape');
  assert.equal(game.scene.paused, false, 'escape should resume the dive');

  await frames(700);
  assert.equal(game.currentSceneName, 'gameover', 'empty tank should still reach game over');
  assert.equal(game.scene.score, 0, 'empty tank should score zero');
  assert.equal(storage.get('sharkquarium.stats'), undefined, 'empty tank should not record stats');

  await frames(40);
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 1, 'game over menu should navigate');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'game over menu should return to the menu');
  assert.equal(game.scene.menu.index, 0, 'menu should reset its selection');

  game.changeScene('abyss');
  await frames(5);
  assert.equal(game.currentSceneName, 'abyss', 'tank select should open the abyss boss tank');
  const abyss = game.scene;
  assert.ok(abyss.leviathan, 'the abyss should spawn the leviathan');
  assert.equal(abyss.lives, 3, 'the abyss should start with three lives');
  abyss.leviathan.state = 'recover';
  abyss.leviathan.stateTimer = 2;
  abyss.leviathan.stun = 1;
  const leviathanEye = abyss.leviathan.eyePosition();
  abyss.players[0].x = leviathanEye.x;
  abyss.players[0].y = leviathanEye.y;
  abyss.players[0].vx = 340;
  abyss.players[0].vy = 0;
  await frames(2);
  assert.ok(
    abyss.leviathan.hp < abyss.leviathan.maxHp,
    'ramming the glowing eye should damage the leviathan',
  );
  abyss.leviathan.blinkTimer = 0;
  abyss.leviathan.blinkHold = 0;
  await frames(3);
  assert.ok(
    abyss.leviathan.blink > 0,
    'the leviathan eyes should blink on their own over time',
  );
  abyss.leviathan.blink = 0;
  abyss.leviathan.blinkHold = 0;
  abyss.leviathan.blinkTimer = 999;
  abyss.leviathan.hp = 1;
  abyss.leviathan.state = 'recover';
  abyss.leviathan.stun = 1;
  abyss.players[0].invulnerable = 0;
  const finishingEye = abyss.leviathan.eyePosition();
  abyss.players[0].x = finishingEye.x;
  abyss.players[0].y = finishingEye.y;
  abyss.players[0].vx = 340;
  await frames(2);
  assert.equal(abyss.leviathan.dead, true, 'the last eye hit should kill the leviathan');
  await frames(140);
  assert.equal(abyss.phase, 'results', 'killing the leviathan should end the fight');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'escape should leave the abyss boss tank');

  game.changeScene('reefqueen');
  await frames(5);
  assert.equal(game.currentSceneName, 'reefqueen', 'tank select should open the reef swarm queen');
  const queen = game.scene;
  assert.ok(queen.queen, 'the reef tank should spawn the swarm queen');
  assert.equal(queen.lives, 3, 'the swarm queen fight should start with three lives');
  queen.queen.state = 'open';
  queen.queen.stateTimer = 2;
  queen.queen.stun = 1;
  const queenCore = queen.queen.corePosition();
  queen.players[0].x = queenCore.x;
  queen.players[0].y = queenCore.y;
  queen.players[0].vx = 340;
  queen.players[0].vy = 0;
  await frames(2);
  assert.ok(
    queen.queen.hp < queen.queen.maxHp,
    'ramming the glowing core should damage the swarm queen',
  );
  queen.queen.hp = 1;
  queen.queen.state = 'open';
  queen.queen.stun = 1;
  queen.players[0].invulnerable = 0;
  const finishingCore = queen.queen.corePosition();
  queen.players[0].x = finishingCore.x;
  queen.players[0].y = finishingCore.y;
  queen.players[0].vx = 340;
  await frames(2);
  assert.equal(queen.queen.dead, true, 'the last core hit should kill the swarm queen');
  await frames(140);
  assert.equal(queen.phase, 'results', 'killing the swarm queen should end the fight');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'escape should leave the reef swarm queen');

  game.changeScene('quiet');
  await frames(5);
  assert.equal(game.currentSceneName, 'quiet', 'tank select should open the quietly quiet tank');
  assert.equal(game.music.track.name, 'quiet', 'the quiet tank should play its horror theme');
  const quietPreviousTrack = game.scene.previousTrack;
  assert.equal(game.scene.phase, 'select', 'the quiet tank should ask for a diver first');
  assert.equal(game.scene.creature.label, 'SHARK', 'the quiet picker should default to the shark');
  await tapKey('ArrowRight');
  assert.equal(game.scene.creature.label, 'STINGRAY', 'Left/Right should change the quiet diver');
  await tapKey('ArrowLeft');
  assert.equal(game.scene.creature.label, 'SHARK', 'the quiet picker should step back');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.scene.phase, 'arrival', 'starting should play the arrival cutscene');
  assert.ok(game.scene.rift, 'the arrival should tear open an atom rift in the lab');
  assert.ok(game.scene.arrivalEchoeel, 'the arrival should hold the passing echoeel');
  assert.equal(game.scene.arrivalCrew.length, 7, 'the seven divers should arrive at the lab');
  await frames(210);
  assert.equal(game.scene.rift.open, 1, 'the intergalactic atom rift should tear open');
  assert.ok(game.scene.arrivalEchoeel.reveal > 0, 'the echoeel should pass through the rift');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.scene.phase, 'play', 'skipping the arrival should begin the dive');
  const quiet = game.scene;
  assert.ok(quiet.alien, 'the quiet tank should spawn the echoeel');
  assert.ok(quiet.clutter.length > 0, 'the quiet tank should hold knockable clutter');
  game.setFirstPerson(true);
  await frames(4);
  assert.equal(
    game.currentSceneName,
    'quiet',
    'the quiet tank should render in the first-person raycaster',
  );
  game.setFirstPerson(false);
  await frames(2);
  quiet.player.x = -100;
  quiet.player.y = -100;
  await frames(2);
  const prop = quiet.clutter[0];
  quiet.noise = 0;
  quiet.alien.state = 'drift';
  quiet.alien.x = quiet.worldLength - 60;
  quiet.alien.y = 60;
  quiet.player.x = prop.x;
  quiet.player.y = prop.y;
  await frames(2);
  assert.equal(prop.toppled, true, 'bumping clutter should knock it over');
  assert.ok(quiet.noise > 0, 'knocking clutter should raise the noise meter');
  assert.ok(quiet.alien.hunting, 'noise should send the blind one hunting after the sound');

  const bulkhead = quiet.walls[0];
  const bulkheadY = bulkhead.y + bulkhead.h * 0.5;
  quiet.alien.x = bulkhead.x - 50;
  quiet.alien.y = bulkheadY;
  quiet.player.x = bulkhead.x + bulkhead.w + 50;
  quiet.player.y = bulkheadY;
  assert.equal(
    quiet.hasLineOfSight(),
    false,
    'a bulkhead should block the alien echolocation line of sight',
  );
  quiet.alien.x = quiet.player.x;
  quiet.alien.y = quiet.player.y;
  assert.equal(
    quiet.hasLineOfSight(),
    true,
    'clear water should restore the alien line of sight',
  );

  const junk = quiet.clutter[0];
  const hide = quiet.hides[0];
  for (const item of quiet.clutter) {
    if (Math.hypot(item.x - hide.x, item.y - hide.y) < item.radius + hide.radius + 24) {
      item.toppled = true;
    }
  }
  quiet.player.x = hide.x;
  quiet.player.y = hide.y;
  quiet.alien.state = 'charge';
  quiet.alien.x = junk.x;
  quiet.alien.y = junk.y;
  quiet.emitNoise(junk.x, junk.y, junk);
  assert.equal(
    Math.abs(quiet.alien.targetX - junk.x) < 1 && Math.abs(quiet.alien.targetY - junk.y) < 1,
    true,
    'the echoeel should aim at the touched junk, not the diver',
  );
  await frames(2);
  assert.ok(
    !quiet.clutter.includes(junk),
    'the echoeel should shatter the junk it heard even while the diver hides',
  );
  assert.equal(
    quiet.phase,
    'play',
    'shattering the junk while the diver hides should not catch the diver',
  );

  quiet.noise = 0;
  quiet.noiseHold = 0;
  quiet.noiseTarget = null;
  quiet.alien.state = 'charge';
  quiet.alien.stateTimer = 5;
  quiet.alien.targetX = 0;
  quiet.alien.targetY = quiet.alien.y;
  quiet.alien.x = 900;
  const lungeStart = quiet.alien.x;
  await frames(6);
  assert.ok(
    lungeStart - quiet.alien.x > 120,
    'the echoeel lunge should cover ground faster than any diver can swim',
  );

  quiet.noise = 0;
  quiet.noiseHold = 0;
  quiet.noiseTarget = null;
  quiet.alien.state = 'search';
  quiet.alien.stateTimer = 4;
  quiet.player.x = 300;
  quiet.player.y = quiet.exitZone.y;
  quiet.alien.x = quiet.player.x + 140;
  quiet.alien.y = quiet.player.y;
  quiet.echoTimer = 0;
  await frames(2);
  assert.equal(
    quiet.alien.state,
    'search',
    'swimming beside the echoeel in open water should not draw it in',
  );
  assert.equal(quiet.phase, 'play', 'the echoeel should not attack a diver it merely swims beside');

  quiet.noise = 0;
  quiet.noiseHold = 0;
  quiet.noiseTarget = null;
  quiet.alien.state = 'alert';
  quiet.alien.stateTimer = 999;
  quiet.alien.x = quiet.player.x + 120;
  quiet.alien.y = quiet.player.y;
  quiet.echoTimer = 0;
  for (let i = 0; i < 200 && quiet.phase === 'play'; i += 1) await frames(1);
  assert.equal(
    quiet.phase,
    'scare',
    'a diver caught in the echolocation ping should be jumpscared',
  );
  assert.equal(quiet.scareKind, 'sonar', 'a ping catch should use the sonar scare');

  quiet.resetRound();
  await frames(2);
  assert.equal(quiet.phase, 'play', 'resetting after the ping scare should start a fresh run');

  quiet.noise = 0;
  quiet.noiseHold = 0;
  quiet.noiseTarget = null;
  quiet.alien.state = 'drift';
  quiet.alien.x = quiet.player.x;
  quiet.alien.y = quiet.player.y;
  await frames(2);
  assert.equal(
    quiet.phase,
    'scare',
    'the echoeel should jumpscare a diver it drifts right up against',
  );
  assert.equal(quiet.scareKind, 'snap', 'a close touch should use the snap scare');

  quiet.resetRound();
  await frames(2);
  assert.equal(quiet.phase, 'play', 'resetting after the proximity scare should start a fresh run');

  quiet.noise = 0;
  quiet.noiseHold = 0;
  quiet.noiseTarget = null;
  const catchJunk =
    quiet.clutter.find(
      (item) =>
        item.x < quiet.worldLength - 900 &&
        quiet.hides.every(
          (spot) => Math.hypot(item.x - spot.x, item.y - spot.y) > spot.radius + item.radius + 30,
        ),
    ) ?? quiet.clutter[0];
  for (const item of quiet.clutter) {
    if (
      Math.hypot(item.x - catchJunk.x, item.y - catchJunk.y) <
      item.radius + catchJunk.radius + 24
    ) {
      item.toppled = true;
    }
  }
  quiet.player.x = catchJunk.x;
  quiet.player.y = catchJunk.y;
  quiet.alien.state = 'drift';
  quiet.alien.x = catchJunk.x;
  quiet.alien.y = catchJunk.y;
  quiet.emitNoise(catchJunk.x, catchJunk.y, catchJunk);
  await frames(2);
  assert.equal(
    quiet.phase,
    'scare',
    'the echoeel should take a diver lingering beside the junk it knocked',
  );
  assert.equal(quiet.scareKind, 'lunge', 'a junk strike should use the lunge scare');

  quiet.resetRound();
  await frames(2);
  assert.equal(quiet.phase, 'play', 'a reset should start a fresh quiet run');
  quiet.ambientTimer = 0;
  quiet.heartbeatTimer = 0.001;
  quiet.echoTimer = 5;
  quiet.alien.state = 'alert';
  quiet.alien.stateTimer = 999;
  quiet.alien.x = quiet.player.x + 200;
  quiet.alien.y = quiet.player.y;
  await frames(3);
  assert.ok(quiet.ambientTimer > 0, 'the lab should keep scheduling ambient horror cues');
  assert.ok(quiet.heartbeatTimer > 0.5, 'the proximity heartbeat should beat and reschedule');

  quiet.resetRound();
  await frames(2);
  assert.equal(quiet.checkpoints.length, 3, 'the lab should hold three checkpoints');
  const checkpoint = quiet.checkpoints[0];
  quiet.player.x = checkpoint.x + 10;
  quiet.player.y = checkpoint.y;
  await frames(2);
  assert.equal(checkpoint.reached, true, 'passing a checkpoint should bank it');
  assert.equal(quiet.checkpoint.x, checkpoint.x, 'the bank should become the respawn point');

  quiet.noise = 0;
  quiet.player.vx = 430;
  quiet.player.vy = 0;
  await frames(6);
  assert.ok(quiet.noise > 0, 'swimming fast should raise the noise meter');
  quiet.player.vx = 0;
  quiet.player.vy = 0;

  quiet.noise = 0;
  quiet.noiseHold = 0;
  const vent = quiet.vents[0];
  vent.timer = 0;
  quiet.player.x = vent.x;
  quiet.player.y = quiet.exitZone.y;
  await frames(2);
  assert.ok(quiet.noise > 0, 'a steam vent should make noise that lures the echoeel');

  assert.equal(quiet.remains.length, 6, 'the lab should hold six dead scientists');
  quiet.remainNote = null;
  quiet.player.x = quiet.remains[1].x;
  quiet.player.y = quiet.remains[1].y;
  await frames(2);
  assert.ok(quiet.remainNote, 'finding a dead scientist should surface their message');

  quiet.phantoms = [];
  quiet.hallucinationTimer = 0;
  await frames(2);
  assert.ok(quiet.phantoms.length > 0, 'the dark should conjure false echoes');

  const slamDoor = quiet.slamDoors[0];
  slamDoor.closed = false;
  quiet.player.x = slamDoor.x + slamDoor.w + 100;
  quiet.player.y = quiet.exitZone.y;
  await frames(2);
  assert.equal(slamDoor.closed, true, 'passing a bulkhead should slam it shut behind you');

  quiet.finale = false;
  quiet.finalLunge = false;
  quiet.alien.relentless = false;
  quiet.alien.state = 'drift';
  quiet.player.x = quiet.runLength - 500;
  quiet.player.y = quiet.exitZone.y;
  quiet.alien.x = quiet.runLength - 900;
  quiet.alien.y = quiet.exitZone.y;
  await frames(2);
  assert.equal(quiet.finale, false, 'the quiet tank should have no distant end-of-run chase');

  quiet.player.x = quiet.exitZone.x - 200;
  quiet.player.y = quiet.exitZone.y;
  await frames(2);
  assert.equal(quiet.finalLunge, true, 'approaching the exit should trigger the echoeel final lunge');
  for (let i = 0; i < 30; i += 1) {
    quiet.player.x = quiet.exitZone.x - 200;
    quiet.player.y = quiet.exitZone.y;
    await frames(1);
  }
  const lungeGap = Math.hypot(quiet.alien.x - quiet.player.x, quiet.alien.y - quiet.player.y);
  assert.ok(lungeGap > 44, 'the final lunge should barely miss the diver');
  assert.equal(quiet.phase, 'play', 'the near-miss should not catch the diver');
  quiet.player.x = quiet.exitZone.x;
  quiet.player.y = quiet.exitZone.y;
  await frames(2);
  assert.equal(quiet.phase, 'results', 'the diver should reach the exit before the echoeel');
  assert.equal(quiet.won, true, 'escaping the quiet tank should count as a win');

  quiet.resetRound();
  await frames(2);
  for (let i = 0; i < 240 && quiet.phase === 'play'; i += 1) {
    quiet.noise = 1;
    quiet.player.x = 26;
    quiet.player.y = 26;
    await frames(1);
  }
  assert.equal(quiet.phase, 'scare', 'a full noise meter held over two seconds should jumpscare');
  assert.equal(quiet.scareKind, 'breach', 'a noise-meter scare should use the drawn-out breach');
  await frames(160);
  assert.equal(quiet.phase, 'play', 'a caught diver should respawn at the last checkpoint');
  assert.ok(quiet.respawns > 0, 'the respawn should be recorded');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'escape should leave the quiet tank');
  assert.equal(game.music.track, quietPreviousTrack, 'leaving the quiet tank should restore the held theme');

  game.changeScene('flood');
  await frames(5);
  assert.equal(game.currentSceneName, 'flood', 'tank select should open the flooded escape');
  assert.equal(game.scene.flood, true, 'the flood tank should run in flood mode');
  assert.equal(game.scene.phase, 'select', 'the flood should ask for a diver first');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.scene.phase, 'play', 'starting the flood should begin the escape');
  const flood = game.scene;
  assert.equal(flood.phase2, true, 'the flood should run the relentless chase');
  assert.equal(flood.alien.relentless, true, 'the flood echoeel should be relentless');
  assert.ok(flood.trueExit.x > 0, 'the flood should have a true exit');
  assert.equal(flood.debris.length, 6, 'the flood corridor should hold collapsing debris');
  assert.equal(flood.checkpoints.length, 2, 'the flood should hold checkpoints');

  const floodDebris = flood.debris[0];
  flood.walls.length = 0;
  flood.alien.x = floodDebris.x + 2000;
  flood.alien.y = floodDebris.y;
  for (let i = 0; i < 60 && floodDebris.state !== 'fall'; i += 1) {
    flood.player.x = floodDebris.x - 70;
    flood.player.y = floodDebris.y;
    await frames(1);
  }
  assert.equal(floodDebris.state, 'fall', 'the flood ceiling debris should collapse');
  assert.ok(flood.walls.some((wall) => wall.debris), 'flood debris should block the corridor');

  flood.resetRound();
  await frames(2);
  flood.debris = [];
  flood.walls.length = 0;
  flood.player.x = 120;
  flood.player.y = flood.exitZone.y;
  flood.alien.x = -600;
  flood.alien.y = flood.exitZone.y;
  flood.alien.state = 'charge';
  flood.alien.relentless = true;
  flood.alien.chargeSpeed = 380;
  pressKey('KeyD');
  for (let i = 0; i < 600 && flood.phase === 'play'; i += 1) await frames(1);
  releaseKey('KeyD');
  assert.equal(flood.phase, 'outro', 'escaping should play the glass-shatter cutscene');
  for (let i = 0; i < 600 && flood.phase === 'outro'; i += 1) await frames(1);
  assert.equal(flood.phase, 'results', 'the cutscene should end in a win');
  assert.equal(flood.won, true, 'outrunning the flood should count as a win');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'escape should leave the flood tank');

  game.changeScene('watcher');
  await frames(5);
  assert.equal(game.currentSceneName, 'watcher', 'tank select should open the watcher tank');
  assert.equal(game.scene.phase, 'select', 'the watcher should ask for a diver first');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.scene.phase, 'play', 'starting the watcher should begin the dive');
  const watcherScene = game.scene;
  assert.equal(watcherScene.watchers.length, 1, 'sector one should hold one watcher');
  assert.ok(watcherScene.coinBubbles.length > 0, 'each sector should hold coin bubbles');
  assert.equal(watcherScene.gazeActive(), true, 'the gaze should start open');

  const stalker = watcherScene.watchers[0];
  stalker.x = watcherScene.player.x + 200;
  stalker.y = watcherScene.player.y;
  const stalkStart = stalker.x;
  game.input.pointer.x = watcherScene.player.x - watcherScene.cameraX + 200;
  game.input.pointer.y = watcherScene.player.y;
  await frames(20);
  assert.equal(stalker.frozen, true, 'a watcher inside the gaze should freeze');
  assert.ok(Math.abs(stalker.x - stalkStart) < 2, 'a frozen watcher should not advance');

  game.input.pointer.x = watcherScene.player.x - watcherScene.cameraX - 300;
  await frames(20);
  assert.equal(stalker.frozen, false, 'a watcher outside the gaze should stalk');
  assert.ok(stalker.x < stalkStart, 'an unobserved watcher should close on the diver');

  watcherScene.stare = 0.01;
  watcherScene.blinking = false;
  await frames(2);
  assert.equal(watcherScene.blinking, true, 'an empty stare meter should force a blink');
  assert.equal(watcherScene.gazeActive(), false, 'the gaze should close while blinking');
  watcherScene.stare = 4.4;
  watcherScene.blinking = false;

  watcherScene.player.x = watcherScene.exitZone.x;
  watcherScene.player.y = watcherScene.exitZone.y;
  await frames(2);
  assert.equal(watcherScene.phase, 'results', 'reaching the exit should win the watcher run');
  assert.equal(watcherScene.won, true, 'escaping the watcher should count as a win');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'escape should leave the watcher tank');

  game.changeScene('mouth');
  await frames(5);
  assert.equal(game.currentSceneName, 'mouth', 'tank select should open the trench mouth');
  assert.equal(game.scene.phase, 'select', 'the trench mouth should ask for a diver first');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.scene.phase, 'play', 'starting the trench mouth should begin the dive');
  const maw = game.scene;
  assert.ok(maw.anchors.length > 0, 'each section should hold ceiling anchors');
  assert.ok(maw.coinBubbles.length > 0, 'each section should hold coin bubbles');
  assert.equal(maw.gulp.state, 'idle', 'the maw should start at rest');

  const brace = maw.anchors[0];
  maw.player.x = brace.x;
  maw.player.y = brace.y;
  pressKey('Space');
  await frames(2);
  assert.equal(maw.heldAnchor, brace, 'space near an anchor should brace the diver');
  const bracedY = maw.player.y;
  maw.gulp.state = 'inhale';
  maw.gulp.timer = 1.5;
  await frames(12);
  assert.ok(Math.abs(maw.player.y - bracedY) < 2, 'a braced diver should resist the gulp');
  releaseKey('Space');
  await frames(2);
  assert.equal(maw.heldAnchor, null, 'releasing space should let the diver go');

  maw.player.x = brace.x + 200;
  maw.player.y = 130;
  maw.player.vx = 0;
  maw.player.vy = 0;
  maw.gulp.state = 'inhale';
  maw.gulp.timer = 1.5;
  const freeY = maw.player.y;
  await frames(20);
  assert.ok(maw.player.y > freeY, 'the gulp should drag an unbraced diver toward the maw');

  maw.gulp.state = 'inhale';
  maw.gulp.timer = 0.02;
  maw.player.y = maw.safeY + 10;
  await frames(3);
  assert.equal(maw.phase, 'scare', 'being in the maw when it bites should swallow the diver');
  await frames(120);
  assert.equal(maw.phase, 'play', 'a swallowed diver should respawn at the last checkpoint');

  maw.player.x = maw.exitZone.x;
  maw.player.y = maw.exitZone.y;
  await frames(2);
  assert.equal(maw.phase, 'results', 'reaching the exit should clear the maw');
  assert.equal(maw.won, true, 'clearing the maw should count as a win');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'escape should leave the trench mouth');

  game.changeScene('prehistoric');
  await frames(5);
  assert.equal(game.currentSceneName, 'prehistoric', 'tank select should open the prehistoric tank');
  const pre = game.scene;
  assert.equal(pre.phase, 'play', 'the prehistoric tank should start playable');
  assert.equal(pre.zoneIndex, 0, 'the prehistoric tank should open in the devonian sea');
  assert.ok(pre.ammonites.length > 0, 'the devonian sea should hold ammonites');
  pre.player.x = pre.startPadding;
  pre.player.y = 150;
  const preAmmo = pre.ammonites[0];
  pre.dunk.x = preAmmo.x;
  pre.dunk.y = preAmmo.y;
  await frames(2);
  assert.ok(pre.dunk.stun > 0, 'an ammonite should distract the dunkleosteus');

  pre.player.x = pre.zoneStarts[1] + 40;
  pre.player.y = pre.groundY - pre.player.radius;
  await frames(2);
  assert.equal(pre.zoneIndex, 1, 'the prehistoric tank should reach the swamp');
  assert.equal(pre.raptor.active, true, 'the swamp should wake the velociraptor');

  pre.player.x = pre.zoneStarts[2] + 40;
  pre.player.y = pre.groundY - pre.player.radius;
  await frames(2);
  assert.equal(pre.phase, 'intro', 'entering the highlands should play the titanoboa tree cutscene');
  await tapKey('Enter');
  await frames(2);
  assert.equal(pre.phase, 'play', 'skipping the cutscene should start the chase');
  assert.equal(pre.snake.active, true, 'the titanoboa should give chase');
  let snakeLen = 0;
  for (let i = 1; i < pre.snake.body.length; i += 1) {
    snakeLen += Math.hypot(
      pre.snake.body[i].x - pre.snake.body[i - 1].x,
      pre.snake.body[i].y - pre.snake.body[i - 1].y,
    );
  }
  assert.ok(snakeLen > 800, 'the titanoboa should trail a long fixed-length body');

  pre.snake.x = 0;
  pre.player.x = pre.worldEnd - 5;
  await frames(2);
  assert.equal(pre.phase, 'results', 'reaching the end should win the prehistoric run');
  assert.equal(pre.won, true, 'outrunning prehistory should count as a win');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'escape should leave the prehistoric tank');

  game.changeScene('raycast');
  await frames(5);
  assert.equal(game.currentSceneName, 'raycast', 'tank select should open the raycast tank');
  const raycastScene = game.scene;
  assert.ok(raycastScene.grid.length > 3, 'the raycast tank should build a maze');
  assert.ok(raycastScene.bubbles.length > 0, 'the raycast maze should hold bubbles');
  assert.equal(raycastScene.collected, 0, 'the raycast tank should start with no bubbles collected');
  raycastScene.collected = raycastScene.bubbles.length;
  raycastScene.px = raycastScene.exitPoint.x;
  raycastScene.py = raycastScene.exitPoint.y;
  await frames(3);
  assert.equal(raycastScene.phase, 'results', 'reaching the exit with every bubble should win');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'escape should leave the raycast tank');
  game.changeScene('menu');
  await frames(5);

  game.set3D(true);
  game.setFirstPerson(true);
  game.changeScene('labyrinth', { solo: true });
  await frames(10);
  assert.equal(
    game.currentSceneName,
    'labyrinth',
    'labyrinth solo should survive 3D mode plus first person',
  );
  game.changeScene('tag', { solo: true });
  await frames(6);
  assert.equal(game.currentSceneName, 'tag', 'tag should render in the first-person raycaster');
  game.changeScene('aquarium');
  await frames(6);
  assert.equal(
    game.currentSceneName,
    'aquarium',
    'the aquarium dive should render in the first-person raycaster',
  );
  game.setFirstPerson(false);
  game.set3D(false);
  game.changeScene('menu');
  await frames(3);

  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'play', 'menu should start a dive');
  assert.equal(game.scene.empty, false, 'start dive should spawn the full game');

  game.setFirstPerson(true);
  await frames(2);
  const fpPlayer = game.scene.player;
  assert.equal(game.firstPerson, true, 'first person mode should be active');
  assert.ok(
    typeof game.scene.firstPersonSprites === 'function',
    'scenes should expose first-person raycast sprites',
  );
  assert.equal(
    game.scene.firstPersonActor(),
    fpPlayer,
    'first person should look through the selected creature',
  );
  game.input.pointer.x = 880;
  game.input.pointer.y = 240;
  await frames(6);
  assert.equal(
    canvas.style.transform,
    'none',
    'first person should render the raycast view in-canvas, not via a CSS tilt',
  );
  assert.equal(
    canvas.style.cursor,
    'none',
    'first person should hide the mouse cursor during a dive',
  );
  const yawBefore = game.scene.firstPersonYaw ?? 0;
  document.pointerLockElement = canvas;
  game.input.pointer.lookDX = 80;
  await frames(2);
  assert.ok(
    Math.abs((game.scene.firstPersonYaw ?? 0) - yawBefore) > 0.05,
    'a locked pointer should turn the first-person view by relative mouse movement',
  );
  document.pointerLockElement = null;
  game.scene.firstPersonYaw = 0;
  game.scene.firstPersonBaseYaw = 0;
  fpPlayer.vx = 0;
  fpPlayer.vy = 0;
  const forwardStartX = fpPlayer.x;
  pressKey('KeyW');
  await frames(25);
  releaseKey('KeyW');
  assert.ok(
    fpPlayer.x > forwardStartX,
    'W should move the diver forward along the view in first person',
  );
  game.scene.firstPersonYaw = 0;
  game.scene.firstPersonBaseYaw = 0;
  fpPlayer.vx = 0;
  fpPlayer.vy = 0;
  const strafeStartY = fpPlayer.y;
  pressKey('KeyD');
  await frames(25);
  releaseKey('KeyD');
  assert.ok(
    fpPlayer.y > strafeStartY,
    'D should strafe the diver relative to the view in first person',
  );
  game.input.pointer.x = 480;
  game.input.pointer.y = 270;
  game.setFirstPerson(false);
  await frames(2);
  assert.equal(game.firstPerson, false, 'first person mode should switch off');
  assert.equal(canvas.style.cursor, '', 'leaving first person should restore the cursor');
  fpPlayer.vx = 0;
  fpPlayer.vy = 0;
  await frames(2);

  assert.equal(game.music.track.name, 'reef', 'the reef tank should play the reef theme');
  await frames(20);
  assert.ok(game.music.step > 0, 'the reef theme should sequence');

  const scene = game.scene;

  canvasPointerDown(400, 300);
  movePointer(640, 300);
  await frames(30);
  assert.ok(scene.player.vx > 50, 'dragging should steer the shark');
  canvasPointerUp();
  await frames(5);

  scene.player.vx = 0;
  scene.player.vy = 0;
  pressKey('KeyA');
  await frames(30);
  releaseKey('KeyA');
  assert.ok(scene.player.vx < -50, 'holding A should steer the shark left');
  scene.player.vx = 0;
  scene.player.vy = 0;
  pressKey('KeyW');
  await frames(30);
  releaseKey('KeyW');
  assert.ok(scene.player.vy < -50, 'holding W should steer the shark up');
  scene.player.vx = 0;
  scene.player.vy = 0;
  pressKey('KeyS');
  await frames(30);
  releaseKey('KeyS');
  assert.ok(scene.player.vy > 50, 'holding S should steer the shark down');
  scene.player.vx = 0;
  scene.player.vy = 0;
  pressKey('KeyD');
  await frames(30);
  releaseKey('KeyD');
  assert.ok(scene.player.vx > 50, 'holding D should steer the shark right');

  scene.player.vx = 0;
  scene.player.vy = 0;
  canvasPointerDown(864, 444);
  movePointer(924, 444);
  await frames(30);
  assert.ok(scene.player.vx > 50, 'dragging the on-screen joystick should steer the shark');
  canvasPointerUp();
  await frames(5);
  scene.player.vx = 0;
  scene.player.vy = 0;
  canvasPointerDown(864, 444);
  movePointer(804, 444);
  await frames(30);
  assert.ok(scene.player.vx < -50, 'the on-screen joystick should steer in both directions');
  canvasPointerUp();
  await frames(5);

  await clickAt(44, 496);
  await frames(3);
  assert.equal(game.scene.paused, true, 'the pause button should pause the dive');
  await clickAt(44, 496);
  await frames(3);
  assert.equal(game.scene.paused, false, 'the pause button should resume the dive');

  scene.bubbles.length = 0;
  scene.hazards.length = 0;
  scene.bonus.length = 0;
  scene.zones.length = 0;
  scene.spawnGoldenBubble();
  scene.spawnAngelfish();
  scene.spawnZone('updraft');
  await frames(30);
  assert.equal(scene.bonus.length, 1, 'angelfish should spawn and swim');
  assert.equal(scene.zones.length, 1, 'zones should spawn');
  const golden = scene.bubbles.find((bubble) => bubble.golden);
  assert.ok(golden, 'golden bubble should spawn');

  const scoreBefore = scene.score;
  scene.bonus[0].baseY = scene.player.y;
  scene.bonus[0].bob = 0;
  scene.bonus[0].x = scene.player.x;
  scene.bonus[0].y = scene.player.y;
  await frames(4);
  assert.ok(scene.score >= scoreBefore + 10, 'angelfish should award bonus score');
  assert.equal(scene.bonus.length, 0, 'angelfish should despawn on contact');

  const timeBefore = scene.timeLeft;
  golden.baseX = scene.player.x;
  golden.x = scene.player.x;
  golden.y = scene.player.y;
  await frames(2);
  assert.ok(scene.timeLeft >= timeBefore + 4.8, 'golden bubble should add bonus time');

  scene.bubbles.length = 0;
  scene.zones[0].x = scene.player.x;
  scene.player.vx = 0;
  scene.player.vy = 0;
  await frames(40);
  assert.ok(scene.player.vy < 0, 'updraft should push the shark upward');

  scene.zones.length = 0;
  scene.spawnZone('current');
  scene.zones[0].y = scene.player.y;
  scene.player.vx = 0;
  scene.player.vy = 0;
  await frames(40);
  assert.ok(Math.abs(scene.player.vx) > 10, 'current should push the shark sideways');
  scene.zones.length = 0;
  await frames(2);

  pressKey('ArrowRight');
  pressKey('ArrowDown');
  await frames(120);
  releaseKey('ArrowRight');
  releaseKey('ArrowDown');

  await tapKey('Escape');
  assert.equal(game.scene.paused, true, 'escape should pause the full game');
  assert.equal(game.music.paused, true, 'pausing should pause the tank theme');
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.paused, false, 'resuming from the pause menu should unpause the dive');
  assert.equal(
    game.music.paused,
    false,
    'resuming from the pause menu should restart the tank theme',
  );
  const resumeStep = game.music.step;
  await frames(30);
  assert.ok(game.music.step > resumeStep, 'the theme should keep sequencing after a menu resume');
  await tapKey('Escape');
  assert.equal(game.scene.paused, true, 'escape should pause the full game again');
  await tapKey('ArrowDown');
  assert.equal(game.scene.pauseMenu.index, 1, 'pause menu should navigate to RESTART');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'play', 'restart should stay in the play scene');
  assert.equal(game.scene.paused, false, 'restart should unpause');
  assert.equal(game.scene.empty, false, 'restart should keep the game mode');

  await tapKey('Escape');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'quit to menu should return to the menu');

  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'play', 'menu should start another dive');

  await frames(3000);
  if (game.currentSceneName === 'gameover') {
    const stats = JSON.parse(storage.get('sharkquarium.stats') ?? '{}');
    assert.equal(stats.games, 1, 'only completed non-empty dives should be counted');
    assert.ok(stats.longestRun > 0, 'longest run should be recorded');
    await frames(40);
    await tapKey('Enter');
    await frames(5);
    assert.equal(game.currentSceneName, 'play', 'play again should restart the dive');
  }

  game.changeScene('play');
  await frames(5);
  const reef = game.scene;
  assert.equal(reef.stingrayTank, false, 'the teleport test should start in the reef tank');
  assert.equal(reef.corals.length, 6, 'the reef tank should grow a coral bed');
  assert.ok(
    reef.corals.every((coral) => coral.y > 500),
    'corals should sit along the reef floor',
  );
  assert.equal(reef.reefRocks.length, 2, 'the reef tank should flank the floor with boulders');
  assert.ok(reef.decor, 'the reef tank should own a decor layer');
  assert.ok(reef.reefRocks[0].x < 200, 'the left boulder should anchor the left corner');
  assert.ok(reef.reefRocks[1].x > 760, 'the right boulder should anchor the right corner');
  assert.ok(
    reef.reefRocks.every((rock) => rock.y > 500),
    'boulders should sit on the reef floor',
  );
  reef.bubbleTimer = 999;
  reef.hazardTimer = 999;
  reef.bonusTimer = 999;
  reef.zoneTimer = 999;
  reef.colorTimer = 999;
  reef.bubbles.length = 0;
  reef.colorSchools.length = 0;
  reef.spawnColorSchool();
  assert.equal(reef.colorSchools.length, 1, 'the reef tank should host a cosmetic fish school');
  const cosmetic = reef.colorSchools[0];
  assert.ok(
    new Set(cosmetic.fish.map((fish) => fish.color)).size > 1,
    'the school should mix several fish colors',
  );
  cosmetic.direction = 1;
  cosmetic.baseY = reef.player.y;
  cosmetic.x = reef.player.x - 120;
  cosmetic.y = reef.player.y;
  const cosmeticScore = reef.score;
  const cosmeticBubbles = reef.bubblesCollected;
  await frames(30);
  assert.equal(reef.score, cosmeticScore, 'the cosmetic school must not touch the score');
  assert.equal(reef.bubblesCollected, cosmeticBubbles, 'the cosmetic school cannot be collected');
  assert.ok(cosmetic.x > reef.player.x - 120, 'the school should swim across the tank');
  cosmetic.x = -400;
  await frames(2);
  assert.equal(reef.colorSchools.length, 0, 'the school should leave the tank once it crosses');
  const reefTime = reef.timeLeft;
  reef.score = 60;
  await frames(2);
  assert.equal(game.currentSceneName, 'descent', 'the teleport should play a descent cutscene');
  await skipDescent();
  assert.equal(game.currentSceneName, 'play', 'the run should continue after the cutscene');
  const tank = game.scene;
  assert.equal(tank.stingrayTank, true, '60 points should teleport into the stingray tank');
  assert.equal(tank.score, 60, 'score should carry over');
  assert.ok(Math.abs(tank.timeLeft - reefTime) < 0.5, 'the timer should carry over');
  assert.ok(tank.archway, 'the stingray tank should have a rock archway');
  assert.equal(tank.decor.starfish.length, 3, 'the stingray tank should scatter starfish');
  assert.equal(tank.eels.length, 5, 'each hole in the archway should have an eel');
  assert.equal(tank.eelPhase, 'hidden', 'the eels should start in their holes');
  assert.equal(
    new Set(tank.eels.map((eel) => eel.bodyColor)).size,
    5,
    'each eel in the pack should wear a different color',
  );
  assert.equal(tank.eels[2].spots, true, 'the yellow eel should carry black spots');
  assert.equal(tank.eels[4].eyeColor, '#4fa8e0', 'the grey eel should have blue eyes');
  assert.equal(game.music.track.name, 'stingray', 'the stingray tank should play its own theme');
  assert.ok(
    game.music.track.bass.filter((note) => note > 0).length >= 12,
    'the stingray theme should keep a steady bass presence',
  );
  assert.equal(game.music.track.hat, true, 'the stingray theme should keep its hats');

  tank.spawnShrimp();
  assert.equal(tank.bonus.length, 1, 'the stingray tank should spawn shrimps');
  const shrimp = tank.bonus[0];
  const shrimpY = shrimp.y;
  await frames(30);
  assert.ok(shrimp.y > shrimpY, 'shrimps should sink toward the sand');
  const shrimpScore = tank.score;
  shrimp.x = tank.player.x;
  shrimp.y = tank.player.y;
  await frames(2);
  assert.ok(tank.score >= shrimpScore + 10, 'catching a shrimp should award bonus score');
  assert.equal(tank.bonus.length, 0, 'shrimps should despawn on contact');

  pressKey('ArrowDown');
  tank.player.x = 480;
  tank.player.y = 470;
  await frames(10);
  assert.equal(tank.player.burrowed, true, 'holding down on the sand should burrow the stingray');
  releaseKey('ArrowDown');
  await frames(5);
  assert.equal(tank.player.burrowed, true, 'releasing down should keep the stingray hidden');

  const moundX = tank.player.x;
  pressKey('ArrowRight');
  await frames(20);
  releaseKey('ArrowRight');
  assert.ok(tank.player.x > moundX, 'a hidden stingray should crawl left and right');
  assert.equal(tank.eelPhase, 'hidden', 'crawling should not wake the eels');

  pressKey('ArrowUp');
  await frames(5);
  releaseKey('ArrowUp');
  assert.equal(tank.player.burrowed, false, 'pressing up should surface the stingray');
  assert.equal(tank.eelPhase, 'hidden', 'surfacing alone should not wake the eels');

  tank.player.y = 470;
  pressKey('ShiftLeft');
  await frames(10);
  releaseKey('ShiftLeft');
  assert.equal(tank.player.burrowed, true, 'holding SHIFT should burrow the stingray');
  await frames(5);
  assert.equal(tank.player.burrowed, true, 'releasing SHIFT should keep the stingray hidden');
  pressKey('ArrowUp');
  await frames(5);
  releaseKey('ArrowUp');
  assert.equal(tank.player.burrowed, false, 'pressing up should surface after a SHIFT burrow');

  tank.bubbles.length = 0;
  tank.eelCharge = 9;
  tank.spawnBubble();
  const triggerBubble = tank.bubbles[tank.bubbles.length - 1];
  triggerBubble.baseX = tank.player.x;
  triggerBubble.x = tank.player.x;
  triggerBubble.y = tank.player.y;
  await frames(3);
  assert.equal(tank.eelPhase, 'peek', 'eel hunts should trigger every 10 collected bubbles');
  await frames(150);
  assert.equal(tank.eelPhase, 'hunt', 'the peek warning should lead into a hunt');

  tank.bubbles.length = 0;
  pressKey('ArrowDown');
  await frames(10);
  assert.equal(tank.player.burrowed, true, 'the stingray should be able to dive again');
  tank.player.invulnerable = 0;
  for (const eel of tank.eels) {
    eel.x = tank.player.x;
    eel.y = tank.player.y;
  }
  const hiddenScore = tank.score;
  await frames(2);
  assert.equal(tank.score, hiddenScore, 'burrowed stingrays should be safe from the hunting pack');

  tank.startEelPhase('hunt');
  for (const eel of tank.eels) {
    eel.x = tank.player.x;
    eel.y = tank.player.y;
    eel.targetX = tank.player.x;
    eel.targetY = tank.player.y;
  }
  const searchX = tank.player.x;
  const searchY = tank.player.y;
  pressKey('ArrowRight');
  await frames(60);
  releaseKey('ArrowRight');
  assert.ok(tank.player.x > searchX + 60, 'the buried stingray should be able to crawl away');
  await frames(60);
  const roamDistances = tank.eels.map((eel) => Math.hypot(eel.x - searchX, eel.y - searchY));
  assert.ok(
    Math.max(...roamDistances) > 60,
    'the eels should roam away from the last seen spot instead of swarming it',
  );
  assert.ok(
    tank.eels.some((eel) => Math.hypot(eel.roamX - searchX, eel.roamY - searchY) >= 150),
    'the eels should pick roam waypoints away from the last seen spot',
  );
  const scout = tank.eels[0];
  let scoutLength = 0;
  for (let i = 1; i < scout.trail.length; i += 1) {
    scoutLength += Math.hypot(
      scout.trail[i].x - scout.trail[i - 1].x,
      scout.trail[i].y - scout.trail[i - 1].y,
    );
  }
  assert.ok(scoutLength > 80, 'eel bodies should stay long even while moving slowly');
  assert.ok(tank.eels[0].jawOpen < 0.3, 'eel jaws should stay shut while the stingray is hidden');

  releaseKey('ArrowDown');

  pressKey('ArrowUp');
  await frames(5);
  releaseKey('ArrowUp');
  tank.startEelPhase('hunt');
  tank.bubbles.length = 0;
  tank.player.invulnerable = 0;
  for (const eel of tank.eels) {
    eel.x = tank.player.x;
    eel.y = tank.player.y;
  }
  const struckScore = tank.score;
  await frames(2);
  assert.equal(tank.score, Math.max(0, struckScore - 15), 'an eel bite should deduct 15 points');
  assert.ok(tank.player.invulnerable > 0, 'an eel bite should grant invulnerability');
  await frames(15);
  assert.ok(
    tank.eels.some((eel) => eel.jawOpen > 0.5),
    'eel jaws should open when near a surfaced stingray',
  );

  tank.eelCharge = 0;
  tank.startEelPhase('retreat');
  await frames(5);
  assert.equal(tank.eelPhase, 'retreat', 'the pack should retreat after the hunt');
  const returner = tank.eels[0];
  let entered = false;
  for (let i = 0; i < 260 && !entered; i += 1) {
    await frames(1);
    if (returner.state === 'entering') entered = true;
  }
  assert.ok(entered, 'an eel should slide into its hole instead of popping out');
  const entryDistance = Math.hypot(returner.x - returner.homeX, returner.y - returner.homeY);
  await frames(20);
  assert.ok(
    returner.state === 'entering' || returner.state === 'hidden',
    'the entering eel should keep sliding in',
  );
  if (returner.state === 'entering') {
    assert.ok(
      Math.hypot(returner.x - returner.homeX, returner.y - returner.homeY) > entryDistance,
      'the tail should keep travelling into the hole',
    );
    assert.ok(
      returner.trail.filter((point) => returner.outsideDistance(point) > 3).length >= 2,
      'the visible body should still trail behind the hole while sliding in',
    );
  }
  await frames(120);
  assert.equal(tank.eelPhase, 'hidden', 'the eels should return to their holes');

  tank.eelCharge = 0;
  for (const eel of tank.eels) eel.state = 'hidden';
  tank.bubbles.length = 0;
  tank.score = 250;
  await frames(2);
  assert.equal(game.currentSceneName, 'descent', 'the deep-sea teleport should play a cutscene');
  await skipDescent();
  const deep = game.scene;
  assert.equal(deep.deepsea, true, '250 points in the stingray tank should teleport to the deep sea');
  assert.equal(deep.score, 250, 'the deep sea should inherit the score');
  assert.ok(deep.ledges, 'the deep sea should have stone ledges');
  assert.equal(deep.ledges.holes.length, 4, 'the two ledges should have four holes');
  assert.equal(game.music.track.name, 'deepsea', 'the deep sea should play its own theme');
  assert.ok(deep.decor, 'the deep sea should own a themed backdrop');
  assert.equal(deep.decor.vents.length, 2, 'the deep sea floor should host hydrothermal vents');
  assert.equal(deep.anglers.length, 3, 'anglerfish should be roaming the deep sea');
  for (const [i, first] of deep.anglers.entries()) {
    for (const second of deep.anglers.slice(i + 1)) {
      assert.ok(
        Math.hypot(first.x - second.x, first.y - second.y) >= 220,
        'anglerfish should spawn well apart from each other',
      );
    }
  }

  deep.spawnCrab();
  assert.equal(deep.bonus.length, 1, 'the deep sea should spawn crabs');
  const crab = deep.bonus[0];
  const crabY = crab.y;
  await frames(30);
  assert.ok(crab.y > crabY, 'crabs should sink toward the sea floor');
  const crabScore = deep.score;
  crab.x = deep.player.x;
  crab.y = deep.player.y;
  await frames(2);
  assert.ok(deep.score >= crabScore + 15, 'catching a crab should award bonus score');
  assert.equal(deep.bonus.length, 0, 'crabs should despawn on contact');

  const hole = deep.ledges.holes[0];
  pressKey('ArrowDown');
  deep.player.x = hole.x;
  deep.player.y = hole.y;
  await frames(10);
  assert.equal(deep.player.hidden, true, 'holding down by a ledge hole should hide the squid');

  deep.player.invulnerable = 0;
  for (const angler of deep.anglers) {
    angler.x = deep.player.x;
    angler.y = deep.player.y;
    angler.mode = 'chase';
  }
  const deepHiddenScore = deep.score;
  await frames(2);
  assert.equal(deep.score, deepHiddenScore, 'anglerfish cannot bite a hidden squid');
  assert.equal(deep.anglers[0].mode, 'search', 'anglerfish should lose track of a hidden squid');

  releaseKey('ArrowDown');
  await frames(5);
  assert.equal(deep.player.hidden, false, 'releasing down should let the squid out');
  pressKey('ShiftLeft');
  deep.player.x = hole.x;
  deep.player.y = hole.y;
  await frames(6);
  assert.equal(deep.player.hidden, true, 'holding SHIFT by a ledge hole should hide the squid');
  releaseKey('ShiftLeft');
  await frames(6);
  assert.equal(deep.player.hidden, false, 'releasing SHIFT should let the squid out');
  deep.bubbles.length = 0;
  deep.player.invulnerable = 0;
  for (const angler of deep.anglers) {
    angler.x = deep.player.x;
    angler.y = deep.player.y;
  }
  const deepStruckScore = deep.score;
  await frames(2);
  assert.equal(deepStruckScore - deep.score, 20, 'an anglerfish should deduct 20 points');

  const stack = deep.anglers[0];
  for (const angler of deep.anglers) {
    angler.x = stack.x;
    angler.y = stack.y;
    angler.mode = 'roam';
    angler.waypointX = stack.x;
    angler.waypointY = stack.y;
    angler.roamTimer = 999;
  }
  await frames(10);
  for (const [i, first] of deep.anglers.entries()) {
    for (const second of deep.anglers.slice(i + 1)) {
      assert.ok(
        Math.hypot(first.x - second.x, first.y - second.y) >= 60,
        'stacked anglerfish should push apart instead of overlapping',
      );
    }
  }

  deep.tankBubbles = 40;
  await frames(2);
  await skipDescent();
  const arctic = game.scene;
  assert.equal(arctic.arctic, true, '40 deep-sea bubbles should teleport to the arctic tank');
  assert.ok(arctic.icechunk, 'the arctic tank should have an ice chunk');
  assert.equal(arctic.seals.length, 2, 'two seals should perch on the ice');
  assert.equal(arctic.schools.length, 2, 'sardine schools should drift through the tank');
  assert.equal(arctic.sealPhase, 'perched', 'the seals should start perched on the ice');
  assert.equal(game.music.track.name, 'arctic', 'the arctic tank should play its own theme');

  arctic.schools[0].baseX = 150;
  arctic.schools[0].baseY = 150;
  arctic.schools[1].baseX = 810;
  arctic.schools[1].baseY = 420;
  arctic.player.following = null;
  arctic.player.exitCooldown = 1.2;

  arctic.bubbles.length = 0;
  arctic.bonus.length = 0;
  arctic.spawnPlankton();
  const plankton = arctic.bonus[0];
  const planktonX = plankton.x;
  await frames(30);
  assert.ok(plankton.x < planktonX, 'plankton should drift from right to left');
  const planktonScore = arctic.score;
  plankton.baseY = arctic.player.y;
  plankton.x = arctic.player.x;
  plankton.y = arctic.player.y;
  await frames(3);
  assert.ok(arctic.score >= planktonScore + 5, 'catching plankton should award score');
  assert.ok(arctic.sealCharge >= 1, 'plankton should charge the seals');

  arctic.sealCharge = 14;
  arctic.bonus.length = 0;
  arctic.spawnPlankton();
  const triggerPlankton = arctic.bonus[0];
  triggerPlankton.baseY = arctic.player.y;
  triggerPlankton.x = arctic.player.x;
  triggerPlankton.y = arctic.player.y;
  await frames(3);
  assert.equal(arctic.sealPhase, 'dive', '15 plankton should send the seals off the ice');
  await frames(70);
  assert.equal(arctic.sealPhase, 'chase', 'the dive should lead into a seal chase');

  const school = arctic.schools[0];
  arctic.player.x = school.x;
  arctic.player.y = school.y;
  await frames(10);
  assert.equal(arctic.player.concealed, true, 'entering a sardine school should conceal the shrimp');

  arctic.player.invulnerable = 0;
  for (const seal of arctic.seals) {
    seal.x = arctic.player.x;
    seal.y = arctic.player.y;
    seal.state = 'chasing';
  }
  const schoolScore = arctic.score;
  await frames(3);
  assert.equal(arctic.score, schoolScore, 'seals cannot bite a shrimp in a sardine school');
  assert.equal(arctic.seals[0].state, 'searching', 'seals should lose track of a sheltered shrimp');

  pressKey('ArrowUp');
  await frames(5);
  releaseKey('ArrowUp');
  assert.equal(arctic.player.concealed, false, 'pressing up should break away from the school');
  arctic.bubbles.length = 0;
  arctic.bonus.length = 0;
  arctic.player.invulnerable = 0;
  arctic.player.x = 480;
  arctic.player.y = 300;
  for (const seal of arctic.seals) {
    seal.x = arctic.player.x;
    seal.y = arctic.player.y;
    seal.state = 'chasing';
  }
  const sealStruckScore = arctic.score;
  await frames(3);
  assert.equal(sealStruckScore - arctic.score, 25, 'a seal bite should deduct 25 points');

  arctic.tankPlankton = 30;
  await frames(2);
  await skipDescent();
  const kelp = game.scene;
  assert.equal(kelp.kelp, true, '30 arctic plankton should open the kelp forest');
  assert.equal(game.music.track.name, 'kelp', 'the kelp forest should play its own theme');
  assert.ok(kelp.octopus, 'the octopus boss should guard the kelp forest');
  assert.equal(kelp.octopus.state, 'patrol', 'the octopus should start patrolling');
  assert.ok(
    Math.hypot(kelp.octopus.x - kelp.player.x, kelp.octopus.y - kelp.player.y) >= 100,
    'the octopus should spawn clear of the players',
  );
  assert.ok(kelp.kelpStalks, 'the kelp forest should grow stalks');
  assert.ok(kelp.decor.motes.length > 0, 'the kelp forest should have drifting motes');
  kelp.timeLeft = 30;

  kelp.bubbles.length = 0;
  kelp.spawnBubble();
  const kelpBubble = kelp.bubbles[kelp.bubbles.length - 1];
  kelpBubble.baseX = kelp.player.x;
  kelpBubble.y = kelp.player.y;
  await frames(2);
  assert.ok(kelp.tankBubbles >= 1, 'kelp bubbles should count toward the goal');

  kelp.bubbles.length = 0;
  kelp.score = 100;
  kelp.player.invulnerable = 0;
  const kraken = kelp.octopus;
  kraken.state = 'patrol';
  kraken.heading = 0;
  kraken.waypointX = kraken.x + 400;
  kraken.waypointY = kraken.y;
  kraken.lungeTimer = 999;
  kelp.player.x = kraken.x - 10;
  kelp.player.y = kraken.y;
  const krakenScore = kelp.score;
  await frames(2);
  assert.equal(krakenScore - kelp.score, 10, 'the octopus body should cost 10 points');

  kelp.player.invulnerable = 0;
  kelp.bubbles.length = 0;
  const krakenHead = kraken.headPosition();
  kelp.player.x = krakenHead.x;
  kelp.player.y = krakenHead.y;
  await frames(2);
  assert.equal(kraken.state, 'stunned', 'ramming the octopus head should stun it');
  assert.ok(kelp.bubbles.length >= 4, 'the stunned octopus should drop bubbles');

  kelp.tankBubbles = 25;
  await frames(3);
  await skipDescent();
  const jelly = game.scene;
  assert.equal(jelly.jellyTank, true, 'the kelp goal should open the jelly tank');
  assert.ok(jelly.turtle, 'the jelly tank should host the turtle miniboss');
  assert.equal(jelly.jellyPoints, 0, 'the miniboss tally should start empty');
  assert.equal(game.music.track.name, 'turtle', 'the jelly tank should play the turtle theme');
  await frames(30);
  assert.ok(game.music.step > 0, 'the miniboss music should sequence');

  jelly.bubbles.length = 0;
  jelly.turtle.x = 80;
  jelly.turtle.y = 80;
  jelly.turtle.waypointX = 80;
  jelly.turtle.waypointY = 80;
  jelly.turtle.chargeTimer = 999;
  jelly.spawnMinnow();
  const minnow = jelly.minnows[jelly.minnows.length - 1];
  minnow.x = jelly.player.x;
  minnow.y = jelly.player.y;
  const minnowScore = jelly.score;
  await frames(60);
  assert.ok(jelly.jellyPoints >= 1, 'tanglings should count miniboss points');
  assert.ok(jelly.score >= minnowScore + 5, 'tanglings should award score');

  jelly.minnows.length = 0;
  jelly.bubbles.length = 0;
  jelly.player.invulnerable = 0;
  jelly.turtle.state = 'patrol';
  jelly.turtle.heading = 0;
  jelly.turtle.waypointX = jelly.turtle.x + 400;
  jelly.turtle.waypointY = jelly.turtle.y;
  jelly.player.x = jelly.turtle.x - 30;
  jelly.player.y = jelly.turtle.y;
  const turtleScore = jelly.score;
  await frames(2);
  assert.equal(turtleScore - jelly.score, 10, 'turtle body contact should deduct 10 points');

  jelly.player.invulnerable = 0;
  jelly.turtle.state = 'patrol';
  const head = jelly.turtle.headPosition();
  jelly.player.x = head.x;
  jelly.player.y = head.y;
  await frames(2);
  assert.equal(jelly.turtle.state, 'stunned', 'ramming the turtle head should stun it');

  jelly.player.invulnerable = 0;
  jelly.bubbles.length = 0;
  const stunnedScore = jelly.score;
  jelly.player.x = jelly.turtle.x - 20;
  jelly.player.y = jelly.turtle.y;
  await frames(2);
  assert.equal(jelly.score, stunnedScore, 'a stunned turtle should be harmless');

  jelly.jellyPoints = 9;
  jelly.spawnMinnow();
  const finisher = jelly.minnows[jelly.minnows.length - 1];
  finisher.x = jelly.player.x;
  finisher.y = jelly.player.y;
  await frames(60);
  assert.equal(game.currentSceneName, 'descent', 'the miniboss clear should play a descent cutscene');
  await skipDescent();
  const nautilus = game.scene;
  assert.equal(nautilus.nautilusTank, true, '10 miniboss points should open the nautilus chase');
  assert.equal(game.music.track.name, 'nautilus', 'the nautilus chase should play its own theme');
  nautilus.timeLeft = 30;
  assert.ok(nautilus.nautilusShark, 'a shark should stalk the nautilus tank');
  assert.equal(nautilus.nautilusShark.state, 'chase', 'the shark should start chasing');
  assert.equal(nautilus.player.autoScrollY, 190, 'the nautilus should be pinned to its depth lane');

  const laneY = nautilus.player.y;
  pressKey('ArrowDown');
  await frames(20);
  releaseKey('ArrowDown');
  assert.ok(Math.abs(nautilus.player.y - laneY) < 1, 'vertical input should not move the nautilus');
  nautilus.player.vx = 0;
  pressKey('ArrowRight');
  await frames(20);
  releaseKey('ArrowRight');
  assert.ok(nautilus.player.vx > 40, 'the nautilus should steer side to side');
  assert.ok(Math.abs(nautilus.player.y - laneY) < 1, 'side steering should keep the depth lane');

  nautilus.skeletons.length = 0;
  nautilus.dartEels.length = 0;
  nautilus.baitSquids.length = 0;
  nautilus.bubbles.length = 0;
  nautilus.spawnBubbleColumn();
  assert.ok(nautilus.bubbles.length >= 4, 'bubble columns should spawn in the nautilus tank');
  const columnBubble = nautilus.bubbles[nautilus.bubbles.length - 1];
  const columnY = columnBubble.y;
  const columnCount = nautilus.tankBubbles;
  const columnScore = nautilus.score;
  await frames(20);
  assert.ok(columnBubble.y < columnY, 'nautilus bubbles should scroll upward');
  columnBubble.y = nautilus.player.y;
  columnBubble.baseX = nautilus.player.x;
  await frames(2);
  assert.ok(
    nautilus.tankBubbles >= columnCount + 1,
    'nautilus bubble collection should count toward the goal',
  );
  assert.ok(nautilus.score >= columnScore + 1, 'nautilus bubble collection should score');

  nautilus.skeletons.length = 0;
  nautilus.dartEels.length = 0;
  nautilus.baitSquids.length = 0;
  nautilus.bubbles.length = 0;
  nautilus.spawnSkeleton();
  const skeleton = nautilus.skeletons[0];
  const skeletonY = skeleton.y;
  await frames(10);
  assert.ok(skeleton.y < skeletonY, 'whale skeletons should drift upward with the scroll');
  nautilus.player.invulnerable = 0;
  nautilus.bubbles.length = 0;
  nautilus.score = 100;
  skeleton.x = nautilus.player.x;
  skeleton.y = nautilus.player.y;
  const skeletonScore = nautilus.score;
  await frames(2);
  assert.equal(skeletonScore - nautilus.score, 10, 'whale skeletons should cost 10 points');

  nautilus.skeletons.length = 0;
  nautilus.dartEels.length = 0;
  nautilus.baitSquids.length = 0;
  nautilus.bubbles.length = 0;
  nautilus.spawnDartEel();
  const dartEel = nautilus.dartEels[0];
  dartEel.direction = 1;
  dartEel.x = 100;
  await frames(10);
  assert.ok(dartEel.x > 130, 'darting eels should sweep sideways very fast');
  nautilus.player.invulnerable = 0;
  nautilus.bubbles.length = 0;
  dartEel.x = nautilus.player.x;
  dartEel.y = nautilus.player.y;
  const dartEelScore = nautilus.score;
  await frames(2);
  assert.equal(dartEelScore - nautilus.score, 15, 'darting eels should cost 15 points');

  nautilus.skeletons.length = 0;
  nautilus.dartEels.length = 0;
  nautilus.baitSquids.length = 0;
  nautilus.bubbles.length = 0;
  nautilus.player.invulnerable = 0;
  nautilus.player.tangleTimer = 0;
  nautilus.spawnBaitSquid();
  const squid = nautilus.baitSquids[0];
  squid.x = nautilus.player.x;
  squid.y = nautilus.player.y;
  const baitSquidScore = nautilus.score;
  await frames(2);
  assert.equal(baitSquidScore - nautilus.score, 10, 'intercepting squids should cost 10 points');
  assert.ok(nautilus.player.tangleTimer > 0, 'intercepting squids should briefly tangle the nautilus');

  nautilus.player.tangleTimer = 0;
  nautilus.bubbles.length = 0;
  nautilus.baitSquids.length = 0;
  nautilus.nautilusShark.state = 'chase';
  nautilus.spawnBaitSquid();
  const dodger = nautilus.baitSquids[0];
  dodger.x = nautilus.player.x + 90;
  dodger.y = nautilus.player.y;
  const dodgeScore = nautilus.score;
  await frames(20);
  assert.equal(
    nautilus.nautilusShark.state,
    'distracted',
    'simply dodging a squid should distract the shark',
  );
  assert.equal(nautilus.baitSquids.length, 0, 'a dodged squid should feed the shark');
  assert.equal(nautilus.score, dodgeScore, 'dodging the squid should not cost the player');

  nautilus.player.invulnerable = 0;
  nautilus.bubbles.length = 0;
  nautilus.skeletons.length = 0;
  nautilus.dartEels.length = 0;
  nautilus.baitSquids.length = 0;
  nautilus.nautilusShark.state = 'chase';
  nautilus.nautilusShark.x = nautilus.player.x;
  nautilus.nautilusShark.y = nautilus.player.y;
  const sharkBiteScore = nautilus.score;
  await frames(2);
  assert.equal(sharkBiteScore - nautilus.score, 15, 'the chasing shark should bite for 15 points');

  nautilus.tankBubbles = 60;
  await frames(3);
  assert.ok(nautilus.difficulty >= 0.49, 'nautilus depth should track the bubble goal');
  assert.ok(nautilus.scrollSpeed > 140, 'the descent should speed up with progress');

  nautilus.tankBubbles = 120;
  const nautilusTime = nautilus.timeLeft;
  await frames(3);
  assert.equal(game.currentSceneName, 'descent', 'the nautilus goal should play a descent cutscene');
  await skipDescent();
  const freshwater = game.scene;
  assert.equal(freshwater.freshwater, true, 'the nautilus goal should open the freshwater chase');
  assert.equal(freshwater.score, nautilus.score, 'the score should carry into the freshwater chase');
  assert.ok(
    Math.abs(freshwater.timeLeft - nautilusTime) < 0.5,
    'the timer should carry into the freshwater chase',
  );
  assert.ok(freshwater.catfish, 'a catfish should be chasing the player');
  assert.equal(game.music.track.name, 'catfish', 'the freshwater chase should play the catfish theme');
  assert.equal(freshwater.player.autoScrollX, 280, 'the freshwater ray should be pinned to the scroll lane');
  freshwater.score = 500;

  freshwater.logTimer = 999;
  freshwater.rockTimer = 999;
  freshwater.piranhaTimer = 999;
  freshwater.weedTimer = 999;
  freshwater.bubbles.length = 0;

  const pinnedX = freshwater.player.x;
  pressKey('ArrowLeft');
  await frames(30);
  releaseKey('ArrowLeft');
  assert.ok(Math.abs(freshwater.player.x - pinnedX) < 40, 'horizontal input should not move the pinned ray');

  freshwater.spawnBubbleRow();
  assert.ok(freshwater.bubbles.length >= 4, 'bubble rows should spawn in straight lines');
  const rowBubble = freshwater.bubbles[freshwater.bubbles.length - 1];
  const rowX = rowBubble.x;
  await frames(30);
  assert.ok(rowBubble.x < rowX, 'freshwater bubbles should scroll to the left');
  const bubbleRowCount = freshwater.tankBubbles;
  const bubbleRowScore = freshwater.score;
  rowBubble.baseX = freshwater.player.x;
  rowBubble.x = freshwater.player.x;
  rowBubble.y = freshwater.player.y;
  await frames(2);
  assert.ok(
    freshwater.tankBubbles >= bubbleRowCount + 1,
    'collecting a bubble should count toward the goal',
  );
  assert.ok(freshwater.score >= bubbleRowScore + 1, 'collecting a bubble should award score');
  freshwater.bubbles.length = 0;

  pressKey('ArrowDown');
  freshwater.player.x = freshwater.player.autoScrollX;
  freshwater.player.y = 470;
  await frames(10);
  assert.equal(freshwater.player.burrowed, true, 'the freshwater ray can still hide in the sand');
  freshwater.player.invulnerable = 0;
  freshwater.rocks.length = 0;
  freshwater.spawnRock();
  const buriedRock = freshwater.rocks[freshwater.rocks.length - 1];
  buriedRock.x = freshwater.player.x;
  buriedRock.y = freshwater.player.y;
  const buriedScore = freshwater.score;
  await frames(3);
  assert.equal(freshwater.score, buriedScore, 'rocks should pass over a buried ray');
  releaseKey('ArrowDown');

  pressKey('ArrowUp');
  await frames(5);
  releaseKey('ArrowUp');
  assert.equal(freshwater.player.burrowed, false, 'the freshwater ray should surface again');
  freshwater.bubbles.length = 0;
  freshwater.player.invulnerable = 0;
  freshwater.weeds.length = 0;
  freshwater.spawnRock();
  const surfacedRock = freshwater.rocks[freshwater.rocks.length - 1];
  surfacedRock.x = freshwater.player.x;
  surfacedRock.y = freshwater.player.y;
  const surfacedScore = freshwater.score;
  await frames(2);
  assert.equal(surfacedScore - freshwater.score, 10, 'a rock should cost 10 points on contact');

  freshwater.player.invulnerable = 0;
  freshwater.bubbles.length = 0;
  freshwater.rocks.length = 0;
  freshwater.weeds.length = 0;
  freshwater.spawnWeed();
  const weed = freshwater.weeds[freshwater.weeds.length - 1];
  weed.x = freshwater.player.x;
  weed.y = freshwater.player.y;
  const weedScore = freshwater.score;
  await frames(2);
  assert.equal(weedScore - freshwater.score, 5, 'freshwater plants should tangle and cost 5 points');
  assert.ok(freshwater.player.tangleTimer > 0, 'plants should tangle the ray');

  freshwater.player.tangleTimer = 0;
  freshwater.player.invulnerable = 0;
  freshwater.piranhas.length = 0;
  freshwater.catfish.state = 'chase';
  freshwater.catfish.x = freshwater.player.x - 160;
  freshwater.catfish.y = freshwater.player.y;
  freshwater.spawnPiranha();
  const piranhaSchool = freshwater.piranhas[freshwater.piranhas.length - 1];
  piranhaSchool.x = freshwater.catfish.x + 20;
  const catX = freshwater.catfish.x;
  await frames(3);
  assert.equal(freshwater.catfish.state, 'stunned', 'piranha schools should stun the catfish');
  await frames(30);
  assert.ok(freshwater.catfish.x < catX, 'a stunned catfish should fall back');

  freshwater.player.invulnerable = 0;
  freshwater.bubbles.length = 0;
  freshwater.piranhas.length = 0;
  freshwater.rocks.length = 0;
  freshwater.weeds.length = 0;
  freshwater.logs.length = 0;
  freshwater.catfish.state = 'chase';
  freshwater.catfish.x = freshwater.player.x;
  freshwater.catfish.y = freshwater.player.y;
  const biteScore = freshwater.score;
  await frames(2);
  assert.equal(biteScore - freshwater.score, 15, 'the catfish bite should deduct 15 points');

  freshwater.player.invulnerable = 0;
  freshwater.player.tangleTimer = 0;
  freshwater.electricEels.length = 0;
  freshwater.logTimer = 999;
  freshwater.rockTimer = 999;
  freshwater.piranhaTimer = 999;
  freshwater.weedTimer = 999;
  freshwater.eelTimer = 999;
  freshwater.tankBubbles = 0;
  await frames(3);
  assert.equal(freshwater.electricEels.length, 0, 'electric eels should not appear early');
  assert.ok(freshwater.scrollSpeed <= 150.5, 'the river should run at base speed early');

  freshwater.tankBubbles = 75;
  freshwater.eelTimer = 0;
  await frames(3);
  assert.ok(freshwater.difficulty >= 0.49, 'difficulty should track the bubble goal');
  assert.ok(freshwater.scrollSpeed > 150, 'the river should speed up with progress');
  assert.equal(freshwater.electricEels.length, 1, 'electric eels should stalk the chase later on');

  freshwater.player.invulnerable = 0;
  freshwater.player.tangleTimer = 0;
  freshwater.bubbles.length = 0;
  const shockEel = freshwater.electricEels[0];
  shockEel.x = freshwater.player.x;
  shockEel.y = freshwater.player.y;
  const eelScore = freshwater.score;
  await frames(2);
  assert.equal(eelScore - freshwater.score, 15, 'an electric eel should shock for 15 points');
  assert.ok(freshwater.player.tangleTimer > 0, 'a shock should briefly paralyze the ray');

  freshwater.player.tangleTimer = 0;
  pressKey('ArrowDown');
  freshwater.player.x = freshwater.player.autoScrollX;
  freshwater.player.y = 470;
  await frames(10);
  assert.equal(freshwater.player.burrowed, true, 'the ray should dive under the sand again');
  freshwater.player.invulnerable = 0;
  const buriedEel = freshwater.electricEels[0];
  buriedEel.x = freshwater.player.x;
  buriedEel.y = freshwater.player.y;
  const buriedEelScore = freshwater.score;
  await frames(2);
  assert.equal(freshwater.score, buriedEelScore, 'buried rays should be safe from electric eels');
  releaseKey('ArrowDown');

  freshwater.tankBubbles = 150;
  await frames(3);
  assert.equal(game.currentSceneName, 'dawn', 'filling the bubble goal should start the dawn cutscene');
  assert.equal(game.scene.goal, 150, 'the cutscene should celebrate the bubble goal');
  const goalStats = JSON.parse(storage.get('sharkquarium.stats') ?? '{}');
  assert.ok(goalStats.games >= 1, 'the goal should complete the run for stats');
  await frames(100);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'the cutscene should return to the menu');

  game.changeScene('menu');
  await frames(5);
  assert.equal(game.scene.menu.items.length, 7, 'the menu should offer the seven base options');
  assert.equal(game.music.track.name, 'menu', 'the menu should restart the menu theme');

  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 4, 'settings should be the fifth menu entry');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'settings', 'the menu should open settings');
  assert.equal(game.scene.settings.coopTankSelect, false, 'settings should start off by default');
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.coopTankSelect, true, 'the switch should turn on');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.settings')).coopTankSelect,
    true,
    'the switch should persist',
  );

  await tapKey('ArrowDown');
  assert.equal(game.scene.settings.difficulty, 'normal', 'difficulty should start normal');
  await tapKey('ArrowRight');
  assert.equal(game.scene.settings.difficulty, 'hard', 'the difficulty selector should step up');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.settings')).difficulty,
    'hard',
    'difficulty should persist',
  );
  await tapKey('ArrowRight');
  assert.equal(
    game.scene.settings.difficulty,
    'apocalyptic',
    'the selector should reach APOCALYPTIC WIPEOUT beyond HARD',
  );
  assert.equal(
    JSON.parse(storage.get('sharkquarium.settings')).difficulty,
    'apocalyptic',
    'apocalyptic should persist',
  );
  await tapKey('ArrowRight');
  assert.equal(game.scene.settings.difficulty, 'easy', 'the difficulty selector should wrap around');
  await tapKey('ArrowLeft');
  assert.equal(
    game.scene.settings.difficulty,
    'apocalyptic',
    'the difficulty selector should step back into apocalyptic',
  );
  await tapKey('ArrowLeft');
  assert.equal(game.scene.settings.difficulty, 'hard', 'the difficulty selector should return to hard');
  await tapKey('ArrowLeft');
  assert.equal(game.scene.settings.difficulty, 'normal', 'the difficulty selector should step back');

  const apocPill = game.scene.difficultyPills().find((pill) => pill.key === 'apocalyptic');
  const difficultyRow = game.scene.menu.bounds[
    game.scene.menu.items.findIndex((item) => item.action === 'difficulty')
  ];
  await clickAt(apocPill.x + apocPill.width / 2, difficultyRow.y + difficultyRow.height / 2);
  await frames(2);
  assert.equal(
    game.scene.settings.difficulty,
    'apocalyptic',
    'clicking the APOCALYPTIC WIPEOUT pill should select it',
  );
  await tapKey('ArrowLeft');
  await tapKey('ArrowLeft');
  assert.equal(game.scene.settings.difficulty, 'normal', 'the selector should return to normal');

  await tapKey('ArrowDown');
  assert.equal(game.scene.settings.volume, 0.8, 'volume should start at the default');
  await tapKey('ArrowRight');
  await tapKey('ArrowRight');
  assert.equal(game.scene.settings.volume, 1, 'the volume slider should step up');
  assert.equal(game.audio.volume, 1, 'the audio bus should follow the slider');

  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.sfx, false, 'the sfx switch should turn off');
  assert.equal(game.audio.sfxEnabled, false, 'the audio bus should mute sfx');
  assert.equal(JSON.parse(storage.get('sharkquarium.settings')).sfx, false, 'sfx should persist');
  game.music.paused = true;
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].action,
    'threeD',
    'settings should offer 3D mode',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.threeD, true, '3D mode should turn on');
  assert.equal(game.threeD, true, 'the game should switch to the 3D view');
  assert.equal(
    canvas.style.transform,
    'perspective(1100px) rotateX(22deg)',
    'the canvas should tilt onto a perspective plane',
  );
  assert.equal(
    JSON.parse(storage.get('sharkquarium.settings')).threeD,
    true,
    '3D mode should persist',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.threeD, false, '3D mode should turn back off');
  assert.equal(game.threeD, false, 'the game should return to the flat view');
  assert.equal(canvas.style.transform, 'none', 'the canvas should flatten again');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].action,
    'firstPerson',
    'settings should offer first person mode',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.firstPerson, true, 'first person mode should turn on');
  assert.equal(
    game.firstPerson,
    true,
    'the game should switch to the first person raycast view',
  );
  assert.equal(
    canvas.style.transform,
    'none',
    'the first person raycast view should not tilt the canvas',
  );
  assert.equal(
    JSON.parse(storage.get('sharkquarium.settings')).firstPerson,
    true,
    'first person mode should persist',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.firstPerson, false, 'first person mode should turn back off');
  assert.equal(game.firstPerson, false, 'the game should return to the flat view');
  assert.equal(canvas.style.transform, 'none', 'the canvas should flatten again');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].action,
    'reduceMotion',
    'settings should offer reduce motion',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.reduceMotion, true, 'reduce motion should turn on');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.settings')).reduceMotion,
    true,
    'reduce motion should persist',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.reduceMotion, false, 'reduce motion should turn back off');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].action,
    'christmas',
    'settings should offer christmas mode',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.christmas, true, 'christmas mode should turn on');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.settings')).christmas,
    true,
    'christmas mode should persist',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.christmas, false, 'christmas mode should turn back off');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].action,
    'halloween',
    'settings should offer halloween mode',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.halloween, true, 'halloween mode should turn on');
  assert.equal(game.scene.settings.christmas, false, 'seasons should be mutually exclusive');
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.halloween, false, 'halloween mode should turn back off');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].action,
    'newyear',
    'settings should offer new year mode',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.newyear, true, 'new year mode should turn on');
  assert.equal(game.scene.settings.halloween, false, 'seasons should stay mutually exclusive');
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.settings.newyear, false, 'new year mode should turn back off');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].action,
    'eightBit',
    'settings should offer 8-bit mode',
  );
  await tapKey('Enter');
  await frames(3);
  assert.equal(game.scene.settings.eightBit, true, '8-bit mode should turn on');
  assert.ok(game.pixelCanvas, '8-bit mode should create the low-res pixel buffer');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.settings')).eightBit,
    true,
    '8-bit mode should persist',
  );
  await tapKey('Enter');
  await frames(3);
  assert.equal(game.scene.settings.eightBit, false, '8-bit mode should turn back off');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].action,
    'tracks',
    'settings should offer the track player',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'tracks', 'settings should open the track player');
  assert.equal(
    game.music.paused,
    false,
    'opening the track player should clear a stale pause left by a quit dive',
  );
  assert.equal(
    game.scene.menu.items.length,
    17,
    'the track player should list every theme plus my track, the rush, the editor, and back',
  );
  assert.deepEqual(
    game.scene.menu.items.slice(0, 16).map((item) => item.label),
    [
      'MENU TRACK',
      'REEF TRACK',
      'STINGRAY TRACK',
      'DEEP SEA TRACK',
      'ARCTIC TRACK',
      'KELP TRACK',
      'PETS TRACK',
      'JELLY TRACK',
      'FRESHWATER TRACK',
      'NAUTILUS TRACK',
      'LABYRINTH TRACK',
      'QUIET TRACK',
      'REEF RUSH TRACK',
      'MY TRACK',
      'RUSH MY TRACK',
      'EDIT MY TRACK',
    ],
    'the track player should list every theme',
  );
  assert.equal(
    game.music.track.name,
    'menu',
    'the track player should inherit the menu theme',
  );
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(20);
  assert.equal(game.music.track.name, 'reef', 'the reef track should play the reef theme');
  assert.ok(game.music.step > 0, 'the track player should sequence the theme');
  const nautilusRow = game.scene.menu.bounds[9];
  await clickAt(nautilusRow.x + nautilusRow.width / 2, nautilusRow.y + nautilusRow.height / 2);
  await frames(10);
  assert.equal(game.music.track.name, 'nautilus', 'clicking a track row should play it');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  assert.equal(game.scene.menu.index, 7, 'the list should reach the jelly track');
  await tapKey('Enter');
  await frames(10);
  assert.equal(game.music.track.name, 'turtle', 'the jelly track should play the turtle theme');
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.music.track, null, 'confirming the playing track should stop it');
  assert.equal(game.music.hold, false, 'stopping in the track player should clear the hold');
  await tapKey('Enter');
  await frames(10);
  assert.equal(game.music.track.name, 'turtle', 'the jelly track should restart on demand');
  const heldStep = game.music.step;
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'settings', 'escape should leave the track player');
  assert.equal(
    game.music.track.name,
    'turtle',
    'leaving the track player should keep the track playing',
  );
  await frames(30);
  assert.ok(game.music.step > heldStep, 'the held track should keep sequencing after leaving');

  for (let i = 0; i < 12; i += 1) await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].action,
    'theatre',
    'settings should offer the cutscene theatre',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'settings should open the theatre');
  assert.equal(game.scene.menu.items.length, 25, 'the theatre should list every cutscene plus back');
  assert.deepEqual(
    game.scene.menu.items.slice(0, 24).map((item) => item.label),
    [
      'GAME TRAILER',
      'SHARKQUARIUM: THE MOVIE',
      'ALL-TANK GAMEPLAY',
      'TANK TRAILERS',
      'MINIGAME TRAILERS',
      'SHOP TRAILER',
      'MERRY CHRISTMAS',
      'HAPPY HALLOWEEN',
      'HAPPY NEW YEAR',
      'INTRO SPLASH',
      'DESCENT: REEF',
      'DESCENT: STINGRAY',
      'DESCENT: DEEP SEA',
      'DESCENT: ARCTIC',
      'DESCENT: KELP FOREST',
      'DESCENT: JELLY',
      'DESCENT: NAUTILUS',
      'DESCENT: FRESHWATER',
      'DAWN BREAKS',
      'LABYRINTH TRAILER',
      'WRECK ARRIVAL',
      'MEGASQUID ENDING',
      'THE ESCAPE',
      'THE RISING',
    ],
    'the theatre should name every cutscene',
  );

  const escapeIdx = game.scene.menu.items.findIndex((item) => item.label === 'THE ESCAPE');
  assert.ok(escapeIdx >= 0, 'the theatre should offer the escape cutscene');
  game.scene.menu.setIndex(escapeIdx);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'flood', 'the escape cutscene should play from the theatre');
  assert.equal(game.scene.phase, 'outro', 'the escape cutscene should open on the glass break');
  await tapKey('Escape');
  await frames(5);
  assert.equal(
    game.currentSceneName,
    'theatre',
    'skipping the escape cutscene should return to the theatre',
  );

  const risingIdx = game.scene.menu.items.findIndex((item) => item.label === 'THE RISING');
  assert.ok(risingIdx >= 0, 'the theatre should offer the megasquid rising cutscene');
  game.scene.menu.setIndex(risingIdx);
  await tapKey('Enter');
  await frames(5);
  assert.equal(
    game.currentSceneName,
    'trenchexplore',
    'the rising cutscene should play from the theatre',
  );
  assert.equal(game.scene.phase, 'rising', 'the rising cutscene should open at the trench');
  await tapKey('Escape');
  await frames(5);
  assert.equal(
    game.currentSceneName,
    'theatre',
    'skipping the rising cutscene should return to the theatre',
  );

  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.selected.label,
    'SHARKQUARIUM: THE MOVIE',
    'the movie should sit under the game trailer',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'trailer', 'the theatre should open the movie');
  assert.equal(game.scene.movie, true, 'the movie should run in movie mode');
  assert.equal(game.scene.shots.length, 16, 'the movie should cut through every tank and game');
  assert.equal(game.scene.shots[0].card, true, 'the movie should open on a title card');
  assert.equal(game.scene.shots[1].tank, 'reef', 'the first tank should lead the tour');
  assert.equal(game.scene.shots[10].id, 'movie-intermission', 'the tour should break for minigames');
  assert.equal(game.scene.shots[11].minigame, 'race', 'the minigame half should open on the race');
  assert.equal(game.scene.shots[15].id, 'movie-finale', 'the movie should end on a finale card');
  assert.ok(game.scene.performers.length > 0, 'the movie should cast creatures');
  await frames(240);
  assert.ok(game.scene.shotIndex >= 1, 'the movie should cut through its tanks');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'skipping the movie should return to the theatre');

  const gameTrailerStats = JSON.parse(storage.get('sharkquarium.stats')).minigames;
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'trailer', 'the theatre should open the game trailer');
  assert.equal(game.scene.shotIndex, 0, 'the game trailer should start on its title card');
  assert.ok(game.scene.performers.length > 0, 'the game trailer should cast creatures');
  await frames(220);
  assert.ok(game.scene.shotIndex >= 1, 'the game trailer should cut through its shots');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'the game trailer should return to the theatre');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.stats')).minigames,
    gameTrailerStats,
    'a game trailer should not count as a minigame round',
  );
  assert.equal(
    game.music.track.name,
    'turtle',
    'the game trailer should keep the held theme playing',
  );

  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].label,
    'ALL-TANK GAMEPLAY',
    'the theatre should list the all-tank gameplay trailer third',
  );
  const gauntletStats = JSON.parse(storage.get('sharkquarium.stats')).minigames;
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'trailer', 'the theatre should open the all-tank trailer');
  assert.equal(game.scene.gauntlet, true, 'the all-tank trailer should use its gauntlet mode');
  assert.equal(
    game.scene.shots.length,
    11,
    'the all-tank trailer should run a card, nine tanks, and a card',
  );
  assert.equal(
    game.scene.shots.filter((shot) => shot.tank).length,
    9,
    'the all-tank trailer should feature every tank',
  );
  assert.ok(game.scene.performers.length > 0, 'the all-tank trailer should cast creatures');
  let gauntletTime = 0;
  for (let index = 0; index < game.scene.shots.length; index += 1) {
    game.scene.time = gauntletTime + game.scene.shots[index].duration * 0.5;
    for (let k = 0; k < 5 && game.scene.shotIndex !== index; k += 1) await frames(1);
    assert.equal(game.scene.shotIndex, index, `the all-tank trailer should reach shot ${index}`);
    assert.ok(
      game.scene.performers.length > 0,
      `the all-tank trailer should cast creatures in shot ${index}`,
    );
    assert.equal(
      game.currentSceneName,
      'trailer',
      `the all-tank trailer should survive shot ${index}`,
    );
    gauntletTime += game.scene.shots[index].duration;
  }
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'the all-tank trailer should return to the theatre');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.stats')).minigames,
    gauntletStats,
    'an all-tank trailer should not count as a minigame round',
  );
  assert.equal(
    game.music.track.name,
    'turtle',
    'the all-tank trailer should keep the held theme playing',
  );

  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].label,
    'TANK TRAILERS',
    'the theatre should list the tank trailers fourth',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'the tank trailers should open a subpage');
  assert.equal(game.scene.page, 'tanks', 'the theatre should switch to its tank page');
  assert.equal(game.scene.menu.items.length, 10, 'the tank page should list every tank plus back');
  assert.deepEqual(
    game.scene.menu.items.slice(0, 9).map((item) => item.label),
    [
      'REEF TANK',
      'STINGRAY TANK',
      'DEEP SEA TANK',
      'ARCTIC TANK',
      'KELP FOREST TANK',
      'JELLY TANK',
      'NAUTILUS TANK',
      'FRESHWATER TANK',
      'PETS TANK',
    ],
    'the tank page should name every tank trailer',
  );
  const tankTrailerStats = JSON.parse(storage.get('sharkquarium.stats')).minigames;
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'trailer', 'the tank page should open a tank trailer');
  assert.equal(game.scene.tankId, 'reef', 'the first tank trailer should be the reef tank');
  assert.equal(game.scene.shots.length, 3, 'a tank trailer should run three shots');
  assert.equal(game.scene.shotIndex, 0, 'the tank trailer should start on its title card');
  assert.ok(game.scene.performers.length > 0, 'the tank trailer should cast creatures');
  await frames(200);
  assert.ok(game.scene.shotIndex >= 1, 'the tank trailer should cut through its shots');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'the tank trailer should return to the theatre');
  assert.equal(game.scene.page, 'main', 'the tank trailer should return to the main page');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.stats')).minigames,
    tankTrailerStats,
    'a tank trailer should not count as a minigame round',
  );
  assert.equal(
    game.music.track.name,
    'turtle',
    'the tank trailer should keep the held theme playing',
  );

  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.scene.page, 'tanks', 'the tank page should reopen on demand');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'escaping the tank page should stay in the theatre');
  assert.equal(game.scene.page, 'main', 'escaping the tank page should return to the cutscenes');

  for (const tank of [
    'reef',
    'stingray',
    'deepsea',
    'arctic',
    'kelp',
    'jelly',
    'nautilus',
    'freshwater',
    'pets',
  ]) {
    game.changeScene('trailer', { tank });
    await frames(2);
    assert.equal(game.scene.tankId, tank, `the ${tank} trailer should open on its own tank`);
    let viewTime = 0;
    for (let view = 0; view < 3; view += 1) {
      game.scene.time = viewTime + game.scene.shots[view].duration * 0.5;
      viewTime += game.scene.shots[view].duration;
      for (let k = 0; k < 5 && game.scene.shotIndex !== view; k += 1) await frames(1);
      assert.equal(game.scene.shotIndex, view, `the ${tank} trailer should reach shot ${view}`);
      assert.ok(
        game.scene.performers.length > 0,
        `the ${tank} trailer should cast creatures in view ${view}`,
      );
      assert.equal(game.currentSceneName, 'trailer', `the ${tank} trailer should survive view ${view}`);
    }
  }
  game.changeScene('theatre');
  await frames(2);
  assert.equal(game.scene.page, 'main', 'the theatre should still work after the tank sweep');

  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].label,
    'MINIGAME TRAILERS',
    'the theatre should list the minigame trailers fifth',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.scene.page, 'minigames', 'the theatre should switch to its minigame page');
  assert.equal(game.scene.menu.items.length, 5, 'the minigame page should list every game plus back');
  assert.deepEqual(
    game.scene.menu.items.slice(0, 4).map((item) => item.label),
    ['COMPETITIONS', 'TAG', 'PUFFERFISH DODGEBALL', 'LABYRINTH'],
    'the minigame page should name every minigame trailer',
  );
  const minigameTrailerStats = JSON.parse(storage.get('sharkquarium.stats')).minigames;
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'trailer', 'the minigame page should open a minigame trailer');
  assert.equal(game.scene.minigameId, 'race', 'the first minigame trailer should be race');
  assert.equal(game.scene.shots.length, 3, 'a minigame trailer should run three shots');
  assert.equal(game.scene.shotIndex, 0, 'the minigame trailer should start on its title card');
  assert.ok(game.scene.performers.length > 0, 'the minigame trailer should cast creatures');
  await frames(200);
  assert.ok(game.scene.shotIndex >= 1, 'the minigame trailer should cut through its shots');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'the minigame trailer should return to the theatre');
  assert.equal(game.scene.page, 'main', 'the minigame trailer should return to the main page');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.stats')).minigames,
    minigameTrailerStats,
    'a minigame trailer should not count as a minigame round',
  );
  assert.equal(
    game.music.track.name,
    'turtle',
    'the minigame trailer should keep the held theme playing',
  );

  for (const minigame of ['race', 'tag', 'dodgeball', 'labyrinth']) {
    game.changeScene('trailer', { minigame });
    await frames(2);
    assert.equal(
      game.scene.minigameId,
      minigame,
      `the ${minigame} trailer should open on its own game`,
    );
    let viewTime = 0;
    for (let view = 0; view < 3; view += 1) {
      game.scene.time = viewTime + game.scene.shots[view].duration * 0.5;
      viewTime += game.scene.shots[view].duration;
      for (let k = 0; k < 5 && game.scene.shotIndex !== view; k += 1) await frames(1);
      assert.equal(game.scene.shotIndex, view, `the ${minigame} trailer should reach shot ${view}`);
      assert.ok(
        game.scene.performers.length > 0,
        `the ${minigame} trailer should cast creatures in view ${view}`,
      );
      assert.equal(
        game.currentSceneName,
        'trailer',
        `the ${minigame} trailer should survive view ${view}`,
      );
    }
  }
  game.changeScene('theatre');
  await frames(2);
  assert.equal(game.scene.page, 'main', 'the theatre should still work after the minigame sweep');

  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].label,
    'SHOP TRAILER',
    'the theatre should list the shop trailer sixth',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'trailer', 'the theatre should open the shop trailer');
  assert.equal(game.scene.shopTrailer, true, 'the shop trailer should run in shop mode');
  assert.equal(game.scene.shots.length, 9, 'the shop trailer should cut through every shop shelf');
  assert.equal(game.scene.shots[0].card, true, 'the shop trailer should open on a title card');
  assert.equal(game.scene.shots[4].id, 'shop-trails', 'the shop trailer should show trails and buddies');
  assert.equal(game.scene.shots[5].id, 'shop-auras', 'the shop trailer should show every aura');
  assert.equal(game.scene.shots[8].id, 'shop-finale', 'the shop trailer should end on the play card');
  assert.ok(game.scene.performers.length > 0, 'the shop trailer should cast creatures');
  let shopTime = 0;
  for (let index = 0; index < game.scene.shots.length; index += 1) {
    game.scene.time = shopTime + game.scene.shots[index].duration * 0.5;
    await frames(1);
    assert.equal(game.scene.shotIndex, index, `the shop trailer should reach shot ${index}`);
    assert.ok(
      game.scene.performers.length > 0,
      `the shop trailer should cast creatures in shot ${index}`,
    );
    if (index >= 1 && index <= 5) await frames(50);
    assert.equal(
      game.currentSceneName,
      'trailer',
      `the shop trailer should survive shot ${index}`,
    );
    shopTime += game.scene.shots[index].duration;
  }
  assert.ok(game.scene.skinIndex > 0, 'the shop trailer should cycle colors');
  assert.ok(game.scene.headIndex > 0, 'the shop trailer should cycle head trinkets');
  assert.ok(game.scene.bodyIndex > 0, 'the shop trailer should cycle body wear');
  assert.ok(game.scene.trailIndex > 0, 'the shop trailer should cycle trails');
  assert.ok(game.scene.companionIndex > 0, 'the shop trailer should cycle dive buddies');
  assert.ok(game.scene.auraIndex > 0, 'the shop trailer should cycle auras');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'skipping the shop trailer should return to the theatre');

  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].label,
    'INTRO SPLASH',
    'the theatre should list the intro eighth',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'intro', 'the theatre should replay the intro splash');
  await frames(70);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'the intro should return to the theatre');

  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].label,
    'DESCENT: REEF',
    'the theatre should list the descents in tank order',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'descent', 'the theatre should play a descent');
  assert.equal(game.scene.target, 'reef', 'the reef descent should target the reef tank');
  await frames(20);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'a theatre descent should return to the theatre');

  for (let i = 0; i < 18; i += 1) await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].label,
    'DAWN BREAKS',
    'the theatre should reach the dawn cutscene',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'dawn', 'the theatre should play the dawn cutscene');
  await frames(100);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'the dawn cutscene should return to the theatre');

  for (let i = 0; i < 19; i += 1) await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].label,
    'LABYRINTH TRAILER',
    'the theatre should reach the labyrinth trailer',
  );
  const trailerStats = JSON.parse(storage.get('sharkquarium.stats')).minigames;
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'labyrinth', 'the theatre should open the trailer scene');
  assert.equal(game.scene.phase, 'trailer', 'the theatre should jump straight to the trailer');
  assert.equal(game.scene.trailerShot, 0, 'the trailer should start on its first shot');
  assert.equal(game.scene.trailerCrew.length, 7, 'the trailer should cast every creature');
  await frames(200);
  assert.ok(game.scene.trailerShot >= 1, 'the trailer should cut through its shots');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'the trailer should return to the theatre');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.stats')).minigames,
    trailerStats,
    'a theatre trailer should not count as a minigame round',
  );

  for (let i = 0; i < 20; i += 1) await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].label,
    'WRECK ARRIVAL',
    'the theatre should reach the wreck arrival',
  );
  const arrivalStats = JSON.parse(storage.get('sharkquarium.stats')).minigames;
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'labyrinth', 'the theatre should open the arrival scene');
  assert.equal(game.scene.phase, 'arrival', 'the theatre should jump straight to the arrival');
  assert.equal(game.scene.theatre, true, 'the theatre arrival should remember the theatre');
  assert.equal(game.scene.arrivalCrew.length, 7, 'the arrival should cast every playable diver');
  assert.equal(game.scene.arrivalMegasquid.reveal, 0, 'the MEGASQUID should start hidden');
  await frames(200);
  assert.ok(
    game.scene.arrivalMegasquid.reveal > 0,
    'the MEGASQUID should appear as the divers arrive',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'the arrival should return to the theatre');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.stats')).minigames,
    arrivalStats,
    'a theatre arrival should not count as a minigame round',
  );

  for (let i = 0; i < 21; i += 1) await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].label,
    'MEGASQUID ENDING',
    'the theatre should reach the labyrinth ending',
  );
  const theatreStats = JSON.parse(storage.get('sharkquarium.stats')).minigames;
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'labyrinth', 'the theatre should open the ending scene');
  assert.equal(game.scene.phase, 'ending', 'the theatre should jump straight to the finale');
  assert.equal(game.scene.escapees.length, 7, 'the theatre finale should show every creature');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'the finale should return to the theatre');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.stats')).minigames,
    theatreStats,
    'a theatre finale should not count as a minigame round',
  );
  assert.equal(
    game.music.track.name,
    'turtle',
    'the theatre should hand the held track back after the finale',
  );

  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'settings', 'escape should leave the theatre');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'escape should leave settings');
  assert.equal(
    game.music.track.name,
    'turtle',
    'the held track should survive further scene changes',
  );

  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 1, 'choose tank should be the second menu entry');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'the menu should open the tank select');
  assert.equal(game.scene.coop, true, 'the setting should pre-enable co-op in the tank select');
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.scene.coop, false, 'the tank select toggle should still be adjustable');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.items[game.scene.menu.index].label,
    'STINGRAY TANK',
    'the tank list should navigate to the stingray tank',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.scene.tank, 'stingray', 'choosing a tank should start it directly');
  assert.equal(game.scene.score, 0, 'a chosen tank should start with a fresh score');
  assert.equal(game.scene.coop, false, 'the tank select should start solo when the toggle is off');
  assert.equal(game.scene.rules.enemySpeed, 1, 'difficulty rules should apply from settings');
  assert.equal(game.music.track.name, 'stingray', 'starting a dive should take over the held track');
  assert.equal(game.music.hold, false, 'starting a dive should clear the held track');

  game.changeScene('menu');
  await frames(5);
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 2, 'co-op should be the third menu entry');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'play', 'the co-op dive should start');
  assert.equal(game.scene.coop, true, 'the co-op dive should enable two players');
  assert.equal(game.scene.players.length, 2, 'co-op should spawn two creatures');
  pressKey('KeyD');
  await frames(20);
  releaseKey('KeyD');
  assert.ok(game.scene.players[0].vx > 50, 'player one should steer their own creature');
  pressKey('ArrowRight');
  await frames(20);
  releaseKey('ArrowRight');
  assert.ok(game.scene.players[1].vx > 50, 'player two should steer their own creature');
  assert.ok(
    game.scene.players[0].vx < game.scene.players[1].vx,
    'each player should control only their own creature',
  );

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'hard' }));
  game.changeScene('play');
  await frames(5);
  assert.equal(game.scene.rules.enemySpeed, 1.6, 'hard should speed enemies up');
  assert.ok(game.scene.timeLimit < 30, 'hard should shorten the tank clock');
  assert.equal(game.scene.eelNeed, 6, 'hard should send the eels out sooner');

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'apocalyptic' }));
  game.changeScene('play');
  await frames(5);
  assert.equal(game.scene.rules.enemySpeed, 2.4, 'apocalyptic should be faster than hard');
  assert.ok(game.scene.timeLimit < 18.5, 'apocalyptic should shorten the tank clock further');
  assert.equal(game.scene.eelNeed, 4, 'apocalyptic should wake the eels after four bubbles');
  assert.equal(game.scene.sealNeed, 6, 'apocalyptic should dive the seals after six plankton');
  assert.equal(game.scene.rules.rampScale, 0.5, 'apocalyptic should ramp spawn rates twice as fast');
  assert.equal(game.scene.rules.hazardBonus, 2, 'apocalyptic should add extra jellyfish to the caps');

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'easy' }));
  game.changeScene('play');
  await frames(5);
  assert.equal(game.scene.rules.enemySpeed, 0.5, 'easy should slow enemies down');
  assert.ok(game.scene.timeLimit > 30, 'easy should lengthen the tank clock');
  assert.equal(game.scene.eelNeed, 15, 'easy should keep the eels in their holes longer');

  const coinsBefore = Number(storage.get('sharkquarium.coins') ?? 0);
  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal' }));
  game.changeScene('play');
  await frames(5);
  const coinScene = game.scene;
  coinScene.score = 100;
  coinScene.elapsed = 40;
  const normalEarn = coinScene.completionPayload();
  assert.ok(normalEarn.coins > 0, 'completed dives should pay sea coins');
  assert.equal(
    Number(storage.get('sharkquarium.coins')),
    coinsBefore + normalEarn.coins,
    'sea coins should bank on completion',
  );

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'apocalyptic' }));
  game.changeScene('play');
  await frames(5);
  const apocScene = game.scene;
  apocScene.score = 100;
  apocScene.elapsed = 40;
  const apocEarn = apocScene.completionPayload();
  assert.ok(apocEarn.coins > normalEarn.coins, 'harder difficulties should pay more sea coins');

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'easy' }));
  game.changeScene('play');
  await frames(5);
  const easyScene = game.scene;
  easyScene.score = 100;
  easyScene.elapsed = 40;
  const easyEarn = easyScene.completionPayload();
  storage.set(
    'sharkquarium.shop',
    JSON.stringify({ owned: ['natural', 'shadow'], skin: 'shadow', passes: [] }),
  );
  game.changeScene('play');
  await frames(5);
  const shadowScene = game.scene;
  shadowScene.score = 100;
  shadowScene.elapsed = 40;
  const shadowEarn = shadowScene.completionPayload();
  assert.ok(
    shadowEarn.coins > easyEarn.coins,
    'an equipped bought color should pay more even on EASY',
  );

  storage.set('sharkquarium.shop', JSON.stringify({ owned: ['natural'], skin: 'natural', passes: [] }));
  storage.set('sharkquarium.coins', '100');
  game.changeScene('shop');
  await frames(5);
  const shop = game.scene;
  assert.equal(game.currentSceneName, 'shop', 'the menu should open the shop');
  assert.equal(
    shop.menu.items.length,
    11,
    'the shop should list color, creature, head, body, trail, dive buddies, aura, playpass, player, costumes, and back',
  );
  assert.equal(
    shop.menu.items[5].label,
    'DIVE BUDDIES',
    'the buddy row should be named DIVE BUDDIES',
  );
  assert.equal(shop.menu.items[8].label, 'PLAYER', 'the player row should be named PLAYER');
  assert.equal(shop.menu.items[9].label, 'COSTUMES', 'the costume row should sit before BACK');
  assert.equal(shop.coins, 100, 'the shop should read the banked sea coins');
  assert.equal(shop.skin.key, 'natural', 'the shop should start on the equipped color');
  assert.equal(shop.head.key, 'none', 'no head trinket should be worn by default');
  assert.equal(shop.back.key, 'none', 'no body trinket should be worn by default');
  assert.equal(shop.trail.key, 'none', 'no trail should be worn by default');
  assert.equal(shop.companion.key, 'none', 'no companion should be worn by default');
  assert.equal(shop.previewCreatures.length, 7, 'the shop should preview every creature');
  assert.deepEqual(
    shop.previewCreatures.map((entry) => entry.key),
    ['shark', 'stingray', 'squid', 'arcticshrimp', 'kelpcrab', 'jellyfish', 'nautilus'],
    'the preview list should cover every playable creature, old and new',
  );
  assert.equal(shop.creature.entity.radius, 26, 'the preview shark should match the playable shark');
  for (const entry of shop.previewCreatures) {
    const fit = entry.entity.jacketFit;
    assert.ok(fit, `${entry.key} should tailor the neon jacket to its body`);
    assert.ok(
      fit.rx > 0 && fit.ry > 0 && fit.rx < 2 && fit.ry < 2,
      `${entry.key} should report a sane jacket fit`,
    );
  }
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.skin, 'natural', 'the equipped color should stay without a purchase');
  await tapKey('ArrowRight');
  assert.equal(shop.skin.key, 'pink', 'the color selector should browse the catalog');
  assert.ok(
    shop.skin.cost > 0 && shop.skin.cost <= 150,
    'the new colors should be accessory priced',
  );
  await tapKey('ArrowRight');
  assert.equal(shop.skin.key, 'red', 'the catalog should include red');
  await tapKey('ArrowRight');
  assert.equal(shop.skin.key, 'gray', 'the catalog should include gray');
  await tapKey('ArrowRight');
  assert.equal(shop.skin.key, 'sunset', 'the catalog should include sunset orange');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.skin, 'natural', 'colors should not equip without affording them');
  assert.equal(shop.coins, 100, 'a failed purchase should not charge sea coins');

  shop.coins = 5000;
  for (let i = 0; i < 7; i += 1) await tapKey('ArrowRight');
  assert.equal(shop.skin.key, 'shadow', 'the catalog should reach SHADOW');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.skin, 'shadow', 'SHADOW should be purchased and equipped');
  assert.equal(shop.coins, 2500, 'SHADOW should cost 2500 sea coins');
  await tapKey('ArrowRight');
  assert.equal(shop.skin.key, 'rainbow', 'the catalog should reach RAINBOW');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.skin, 'rainbow', 'RAINBOW should be purchased and equipped');
  assert.equal(shop.coins, 0, 'RAINBOW should cost 2500 sea coins');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.shop')).skin,
    'rainbow',
    'the equipped color should persist',
  );

  await tapKey('ArrowDown');
  assert.equal(shop.menu.selected.action, 'creature', 'the creature row should be selectable');
  await tapKey('ArrowRight');
  assert.equal(shop.creature.key, 'stingray', 'the creature browser should step forward');
  await tapKey('ArrowLeft');
  assert.equal(shop.creature.key, 'shark', 'the creature browser should step back');
  await tapKey('ArrowLeft');
  assert.equal(shop.creature.key, 'nautilus', 'the creature browser should wrap around');
  await tapKey('ArrowRight');
  assert.equal(shop.creature.key, 'shark', 'the creature browser should wrap forward');
  shop.creatureIndex = 4;
  assert.equal(shop.creature.label, 'KELP CRAB', 'the browser should include the newest creature');
  shop.creatureIndex = 5;
  assert.equal(shop.creature.label, 'JELLYFISH', 'the browser should reach every creature');
  shop.creatureIndex = 0;
  await frames(5);
  assert.equal(
    shop.menu.selected.action,
    'creature',
    'browsing creatures should keep the selection',
  );

  await tapKey('ArrowDown');
  assert.equal(shop.menu.selected.action, 'head', 'the head row should be selectable');
  await tapKey('ArrowRight');
  assert.equal(
    shop.head.key,
    'tophat',
    'the head browser should step through the catalog',
  );
  shop.coins = 200;
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.head, 'tophat', 'a cheap head trinket should equip on purchase');
  assert.equal(shop.coins, 120, 'the top hat should cost its cheap price');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.shop')).head,
    'tophat',
    'the head trinket should persist',
  );
  await tapKey('ArrowLeft');
  assert.equal(shop.head.key, 'none', 'the head browser should reach NONE again');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.head, 'none', 'NONE should take the head trinket off');
  await tapKey('ArrowRight');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.head, 'tophat', 're-wearing an owned head trinket should be free');
  assert.equal(shop.coins, 120, 're-wearing a head trinket should not charge');

  await tapKey('ArrowDown');
  assert.equal(shop.menu.selected.action, 'body', 'the body row should be selectable');
  await tapKey('ArrowRight');
  assert.equal(shop.back.key, 'bowtie', 'the body browser should step through the catalog');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.back, 'bowtie', 'a cheap body trinket should equip on purchase');
  assert.equal(shop.coins, 70, 'the bow tie should cost its cheap price');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.shop')).back,
    'bowtie',
    'the body trinket should persist',
  );
  assert.equal(shop.shop.head, 'tophat', 'buying a body trinket should keep the head trinket');
  const seenHeads = new Set();
  const seenBodies = new Set();
  for (let i = 0; i < 16; i += 1) {
    seenHeads.add(shop.head.key);
    shop.cycleOption('head', 1);
  }
  for (let i = 0; i < 24; i += 1) {
    seenBodies.add(shop.back.key);
    shop.cycleOption('body', 1);
  }
  assert.ok(
    seenHeads.has('eyepatch') &&
      seenHeads.has('snorkel') &&
      seenHeads.has('devilhorns') &&
      seenHeads.has('stingrayhat'),
    'the coin head trinkets should join the head catalog',
  );
  assert.ok(!seenHeads.has('bowtie'), 'body trinkets should stay out of the head catalog');
  assert.ok(
    seenBodies.has('eelscarf') && seenBodies.has('angelwings'),
    'the coin body trinkets should join the body catalog',
  );
  assert.ok(!seenBodies.has('tophat'), 'head trinkets should stay out of the body catalog');

  shop.coins = 1200;
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(2);
  assert.ok(shop.ownsPass('playpass1'), 'playpass 1 should be bought with sea coins');
  assert.equal(shop.coins, 0, 'the playpass should cost its price');
  assert.ok(
    JSON.parse(storage.get('sharkquarium.shop')).passes.includes('playpass1'),
    'the playpass should persist',
  );

  shop.coins = 1200;
  await tapKey('ArrowRight');
  assert.equal(shop.pass.key, 'playpass2', 'the pass browser should reach PLAYPASS 2');
  await tapKey('Enter');
  await frames(2);
  assert.ok(shop.ownsPass('playpass2'), 'playpass 2 should be bought with sea coins');
  assert.equal(shop.coins, 0, 'playpass 2 should cost the same');
  assert.ok(shop.owns('monsoon'), 'playpass 2 should unlock the monsoon color');
  assert.ok(shop.owns('ember'), 'playpass 2 should unlock every bundled color');
  assert.ok(shop.ownsAccessory('pirate'), 'playpass 2 should unlock the pirate hat');
  assert.ok(shop.ownsAccessory('propeller'), 'playpass 2 should unlock every bundled trinket');

  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  assert.equal(shop.menu.selected.action, 'skin', 'the color row should be selectable again');
  await tapKey('ArrowLeft');
  await tapKey('ArrowLeft');
  await tapKey('ArrowLeft');
  assert.equal(shop.skin.key, 'monsoon', 'the browser should reach the pass-exclusive color');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.skin, 'monsoon', 'pass-granted colors should equip for free');
  assert.equal(shop.coins, 0, 'equipping pass cosmetics should not charge coins');

  shop.coins = 1200;
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(shop.menu.selected.action, 'pass', 'the pass row should be selectable again');
  await tapKey('ArrowRight');
  assert.equal(shop.pass.key, 'playpass3', 'the pass browser should reach PLAYPASS 3');
  await tapKey('Enter');
  await frames(2);
  assert.ok(shop.ownsPass('playpass3'), 'playpass 3 should be bought with sea coins');
  assert.equal(shop.coins, 0, 'playpass 3 should cost the same');
  shop.coins = 1200;
  await tapKey('ArrowRight');
  assert.equal(shop.pass.key, 'playpass4', 'the pass browser should reach PLAYPASS 4');
  await tapKey('Enter');
  await frames(2);
  assert.ok(shop.ownsPass('playpass4'), 'playpass 4 should be bought with sea coins');
  assert.equal(shop.coins, 0, 'playpass 4 should cost the same');
  shop.coins = 1200;
  await tapKey('ArrowRight');
  assert.equal(shop.pass.key, 'playpass5', 'the pass browser should reach PLAYPASS 5');
  assert.equal(shop.aura.key, 'none', 'the eel aura should start detached');
  await tapKey('Enter');
  await frames(2);
  assert.ok(shop.ownsPass('playpass5'), 'playpass 5 should be bought with sea coins');
  assert.equal(shop.coins, 0, 'playpass 5 should cost the same');
  assert.ok(shop.ownsOption('aura', 'eelaura'), 'playpass 5 should grant the eel aura');
  for (const key of [
    'plushshark',
    'plushstingray',
    'plushsquid',
    'plushshrimp',
    'plushcrab',
    'plushjelly',
    'plushnautilus',
    'plushmoray',
    'plushgoldfish',
    'plushbabyshark',
    'plushghostjelly',
    'neonjacket',
  ]) {
    assert.ok(shop.ownsAccessory(key), `playpass 5 should unlock ${key}`);
  }
  let plushGuard = 0;
  while (shop.back.key !== 'plushshark' && plushGuard < 30) {
    shop.cycleOption('body', 1);
    plushGuard += 1;
  }
  assert.equal(shop.back.key, 'plushshark', 'the plushies should be browsable');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  assert.equal(shop.menu.selected.action, 'body', 'the body row should reach the plushies');
  await tapKey('Enter');
  await frames(10);
  assert.equal(shop.shop.back, 'plushshark', 'the plush shark should equip for free');
  let shadowGuard = 0;
  while (shop.skin.key !== 'shadow' && shadowGuard < 80) {
    shop.cycle(1);
    shadowGuard += 1;
  }
  assert.equal(shop.skin.key, 'shadow', 'the shadow skin should be previewable');
  await frames(10);
  for (const [index, label] of [
    [1, 'STINGRAY'],
    [3, 'ARCTIC SHRIMP'],
    [6, 'NAUTILUS'],
  ]) {
    shop.creatureIndex = index;
    assert.equal(shop.creature.label, label, `the shadow preview should reach the ${label}`);
    await frames(2);
  }
  shop.creatureIndex = 0;
  await frames(2);
  await tapKey('Enter');
  await frames(10);
  assert.equal(shop.shop.back, 'plushshark', 're-wearing a plushie should stay free');
  let restoreGuard = 0;
  while (shop.back.key !== 'bowtie' && restoreGuard < 30) {
    shop.cycleOption('body', 1);
    restoreGuard += 1;
  }
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.back, 'bowtie', 'the plush browsing should restore the worn trinket');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  shop.coins = 1200;
  await tapKey('ArrowRight');
  assert.equal(shop.pass.key, 'playpass6', 'the pass browser should reach PLAYPASS 6');
  await tapKey('Enter');
  await frames(2);
  assert.ok(shop.ownsPass('playpass6'), 'playpass 6 should be bought with sea coins');
  assert.equal(shop.coins, 0, 'playpass 6 should cost the same');

  shop.coins = 1200;
  await tapKey('ArrowRight');
  assert.equal(shop.pass.key, 'playpass7', 'the pass browser should reach PLAYPASS 7');
  await tapKey('Enter');
  await frames(2);
  assert.ok(shop.ownsPass('playpass7'), 'playpass 7 should be bought with sea coins');
  assert.equal(shop.coins, 0, 'playpass 7 should cost the same');
  for (const key of ['bubblestream', 'stardust', 'inkpuff', 'crackle', 'ribbon']) {
    assert.ok(shop.ownsTrail(key), `playpass 7 should unlock ${key}`);
  }
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  assert.equal(shop.menu.selected.action, 'trail', 'the trail row should be selectable');
  let trailGuard = 0;
  while (shop.trail.key !== 'bubblestream' && trailGuard < 12) {
    shop.cycleOption('trail', 1);
    trailGuard += 1;
  }
  assert.equal(shop.trail.key, 'bubblestream', 'the trails should be browsable');
  await tapKey('Enter');
  await frames(10);
  assert.equal(shop.shop.trail, 'bubblestream', 'the bubble stream should equip for free');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.shop')).trail,
    'bubblestream',
    'the equipped trail should persist',
  );
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  shop.coins = 1200;
  await tapKey('ArrowRight');
  assert.equal(shop.pass.key, 'playpass8', 'the pass browser should reach PLAYPASS 8');
  await tapKey('Enter');
  await frames(2);
  assert.ok(shop.ownsPass('playpass8'), 'playpass 8 should be bought with sea coins');
  assert.equal(shop.coins, 0, 'playpass 8 should cost the same');
  for (const key of [
    'bubblepal',
    'babymoray',
    'lanternfish',
    'tinyjelly',
    'minicrab',
    'minishark',
    'ministingray',
    'minisquid',
    'minishrimp',
    'mininautilus',
    'miniangler',
    'miniseal',
    'minioctopus',
    'miniturtle',
    'minichaser',
    'mindarteel',
    'minicatfish',
    'minivolt',
    'minipiranha',
    'minipuffer',
    'megasquid',
  ]) {
    assert.ok(shop.ownsCompanion(key), `playpass 8 should unlock ${key}`);
  }
  for (let i = 0; i < 24; i += 1) {
    shop.cycleOption('companion', 1);
    await frames(2);
  }
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  assert.equal(shop.menu.selected.action, 'companion', 'the companion row should be selectable');
  let palGuard = 0;
  while (shop.companion.key !== 'bubblepal' && palGuard < 30) {
    shop.cycleOption('companion', 1);
    palGuard += 1;
  }
  assert.equal(shop.companion.key, 'bubblepal', 'the companions should be browsable');
  await tapKey('Enter');
  await frames(10);
  assert.equal(shop.shop.companion, 'bubblepal', 'the bubble pal should equip for free');
  assert.equal(shop.status, 'DIVE BUDDY PICKED — P1', 'a buddy should be picked, not worn');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.shop')).companion,
    'bubblepal',
    'the equipped companion should persist',
  );
  for (const key of [
    'minishark',
    'ministingray',
    'minisquid',
    'minishrimp',
    'minicrab',
    'tinyjelly',
    'mininautilus',
    'babymoray',
    'mindarteel',
    'minivolt',
    'minipuffer',
    'megasquid',
  ]) {
    shop.shop.companion = key;
    await frames(2);
  }
  shop.shop.companion = 'bubblepal';
  await tapKey('ArrowDown');
  assert.equal(shop.menu.selected.action, 'aura', 'the aura row should sit after the companion');
  let auraGuard = 0;
  while (shop.aura.key !== 'eelaura' && auraGuard < 8) {
    shop.cycleOption('aura', 1);
    auraGuard += 1;
  }
  assert.equal(shop.aura.key, 'eelaura', 'the eel aura should be browsable');
  await tapKey('Enter');
  await frames(10);
  assert.equal(shop.shop.aura, 'eelaura', 'the eel aura should attach for free');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.shop')).aura,
    'eelaura',
    'the attached aura should persist',
  );
  for (const [key, label, cost] of [
    ['bubbleaura', 'BUBBLE AURA', 180],
    ['neonaura', 'NEON AURA', 200],
    ['stingrayaura', 'STINGRAY AURA', 220],
    ['tridentaura', 'TRIDENT AURA', 240],
    ['karambitaura', 'KARAMBIT AURA', 260],
    ['sharkaura', 'SHARK AURA', 280],
    ['swordaura', 'SWORD AURA', 300],
    ['octopusaura', 'OCTOPUS AURA', 320],
    ['snowflakeaura', 'SNOWFLAKE AURA', 200],
  ]) {
    shop.coins = 400;
    await tapKey('ArrowRight');
    assert.equal(shop.aura.key, key, `the aura browser should reach ${label}`);
    await tapKey('Enter');
    await frames(2);
    assert.equal(shop.shop.aura, key, `${label} should equip on purchase`);
    assert.equal(shop.coins, 400 - cost, `${label} should cost its price`);
    assert.ok(
      JSON.parse(storage.get('sharkquarium.shop')).auras.includes(key),
      `${label} should persist in the collection`,
    );
  }
  await tapKey('ArrowRight');
  assert.equal(shop.aura.key, 'none', 'the aura browser should reach NONE');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.aura, 'none', 'the eel aura should detach again');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.shop')).aura,
    'none',
    'the detached aura should persist',
  );
  assert.equal(shop.costume.key, 'none', 'no costume should be worn by default');
  shop.coins = 1000;
  for (const [index, key, label] of [
    [1, 'sharkfin', 'SHARK FIN DISH'],
    [2, 'sambalstingray', 'SAMBAL STINGRAY'],
    [3, 'grilledsquid', 'GRILLED SQUID'],
    [4, 'prawncrackers', 'PRAWN CRACKERS'],
  ]) {
    shop.costumeIndex = index;
    assert.equal(shop.costume.key, key, `the costume catalog should include ${label}`);
  }
  shop.costumeIndex = 1;
  const finCost = shop.costume.cost;
  shop.buyOrEquipOption('costume');
  assert.equal(shop.shop.costume, 'sharkfin', 'a costume should equip on purchase');
  assert.equal(shop.coins, 1000 - finCost, 'the costume should cost its price');
  assert.ok(
    JSON.parse(storage.get('sharkquarium.shop')).accessories.includes('sharkfin'),
    'the bought costume should persist in the collection',
  );
  shop.costumeIndex = 0;
  shop.buyOrEquipOption('costume');
  assert.equal(shop.shop.costume, 'none', 'NONE should take the costume off');
  shop.costumeIndex = 1;
  shop.buyOrEquipOption('costume');
  assert.equal(shop.shop.costume, 'sharkfin', 're-wearing an owned costume should be free');
  assert.equal(shop.coins, 1000 - finCost, 're-wearing a costume should not charge');
  shop.costumeIndex = 0;
  shop.buyOrEquipOption('costume');
  await tapKey('ArrowDown');
  assert.equal(shop.menu.selected.action, 'pass', 'the pass row should return after the aura');
  await tapKey('ArrowDown');
  assert.equal(shop.menu.selected.action, 'player', 'the player row should follow the pass row');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.playerIndex, 1, 'the player row should switch to P2');
  assert.equal(shop.status, 'DRESSING P2', 'the shop should announce the active player');
  for (let i = 0; i < 8; i += 1) await tapKey('ArrowUp');
  assert.equal(shop.menu.selected.action, 'skin', 'the color row should be reachable while dressing P2');
  let redGuard = 0;
  while (shop.skin.key !== 'red' && redGuard < 80) {
    shop.cycle(1);
    redGuard += 1;
  }
  assert.equal(shop.skin.key, 'red', 'the P2 browser should reach RED');
  shop.coins = 500;
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.skin2, 'red', 'P2 should buy and wear their own color');
  assert.equal(shop.shop.skin, 'monsoon', 'P1 should keep their color while P2 dresses');
  assert.equal(shop.coins, 410, 'the red should cost its price');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.shop')).skin2,
    'red',
    'the P2 color should persist',
  );
  for (let i = 0; i < 8; i += 1) await tapKey('ArrowDown');
  assert.equal(shop.menu.selected.action, 'player', 'the player row should be reachable again');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.playerIndex, 0, 'the player row should switch back to P1');
  for (let i = 0; i < 8; i += 1) await tapKey('ArrowUp');
  assert.equal(shop.menu.selected.action, 'skin', 'the P1 color row should return');
  let sunsetGuard = 0;
  while (shop.skin.key !== 'sunset' && sunsetGuard < 80) {
    shop.cycle(1);
    sunsetGuard += 1;
  }
  assert.equal(shop.skin.key, 'sunset', 'the P1 browser should reach SUNSET ORANGE');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.skin, 'sunset', 'P1 should wear their own color');
  assert.equal(shop.shop.skin2, 'red', 'P2 should keep their color');
  assert.equal(shop.coins, 260, 'the sunset orange should cost its price');
  for (let i = 0; i < 7; i += 1) await tapKey('ArrowDown');
  assert.equal(shop.menu.selected.action, 'pass', 'the pass row should be reachable again');
  shop.coins = 1200;
  await tapKey('ArrowRight');
  assert.equal(shop.pass.key, 'playpass9', 'the pass browser should reach PLAYPASS 9');
  await tapKey('Enter');
  await frames(2);
  assert.ok(shop.ownsPass('playpass9'), 'playpass 9 should be bought with sea coins');
  assert.equal(shop.coins, 0, 'playpass 9 should cost the same');

  const ownedShop = storage.get('sharkquarium.shop');
  storage.set(
    'sharkquarium.shop',
    JSON.stringify({
      owned: ['natural'],
      skin: 'natural',
      passes: [],
      accessories: ['none', 'pirate'],
      accessory: 'pirate',
    }),
  );
  game.changeScene('shop');
  await frames(2);
  assert.equal(
    game.scene.shop.head,
    'pirate',
    'legacy saves should migrate their head trinket',
  );
  assert.equal(game.scene.shop.back, 'none', 'legacy head migration should leave the body empty');
  storage.set(
    'sharkquarium.shop',
    JSON.stringify({
      owned: ['natural'],
      skin: 'natural',
      passes: [],
      accessories: ['none', 'armor'],
      accessory: 'armor',
    }),
  );
  game.changeScene('shop');
  await frames(2);
  assert.equal(game.scene.shop.back, 'armor', 'legacy saves should migrate their body trinket');
  assert.equal(game.scene.shop.head, 'none', 'legacy body migration should leave the head empty');
  storage.set('sharkquarium.shop', ownedShop);

  game.changeScene('menu');
  await frames(5);
  assert.equal(game.scene.menu.items.length, 11, 'the passes should fill the menu');
  assert.equal(game.scene.menu.items[3].label, 'MINIGAMES', 'minigames should sit below co-op');
  assert.equal(game.scene.menu.items[4].label, 'PETS TANK', 'the pets tank should sit below minigames');
  assert.equal(game.scene.menu.items[5].label, 'ENDLESS DIVE', 'endless dive should sit below the pets tank');
  assert.equal(
    game.scene.menu.items[6].label,
    'AQUARIUM BUILDER',
    'the aquarium builder should sit below endless dive',
  );
  assert.equal(game.scene.shop.skin, 'sunset', 'the menu should use the equipped color');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 3, 'the minigames entry should be selectable');
  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'hard' }));
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'the menu should open minigames');
  assert.equal(
    game.scene.menu.items[0].label,
    'COMPETITIONS (2P RACE)',
    'the playpass should unlock competitions',
  );
  await tapKey('Enter');
  await frames(5);
  const race = game.scene;
  assert.equal(game.currentSceneName, 'play', 'competitions should start a dive');
  assert.equal(race.race, true, 'competitions should run in race mode');
  assert.equal(race.coop, true, 'competitions should always field two players');
  assert.equal(race.players.length, 2, 'competitions should spawn two creatures');
  assert.equal(race.rules.enemySpeed, 1.6, 'the race should use the selected difficulty');
  assert.ok(
    Math.abs(race.timeLimit - 22.5) < 0.1,
    'hard should shorten the race clock to 22.5 seconds',
  );
  assert.equal(race.head.key, 'tophat', 'dives should wear the equipped head trinket');
  assert.equal(race.back.key, 'bowtie', 'dives should wear the equipped body trinket');
  assert.equal(race.trail.key, 'bubblestream', 'dives should wear the equipped trail');
  assert.equal(race.companion.key, 'bubblepal', 'dives should follow with the equipped companion');

  race.bubbles.length = 0;
  race.spawnBubble();
  const raceBubble = race.bubbles[race.bubbles.length - 1];
  const p2Before = race.playerBubbles[1];
  raceBubble.baseX = race.players[1].x;
  raceBubble.x = race.players[1].x;
  raceBubble.y = race.players[1].y;
  await frames(2);
  assert.equal(
    race.playerBubbles[1],
    p2Before + 1,
    'race bubbles should credit the collecting player',
  );

  race.playerBubbles[0] = 12;
  race.playerBubbles[1] = 9;
  race.timeLeft = 0.05;
  await frames(5);
  assert.equal(game.currentSceneName, 'gameover', 'the race should end on the clock');
  assert.deepEqual(game.scene.race, [12, 9], 'the race results should reach the results panel');
  assert.equal(game.scene.coins, 90, 'the race should pay sea coins plus a win bonus');
  const raceStats = JSON.parse(storage.get('sharkquarium.stats'));
  assert.ok(raceStats.minigames >= 1, 'minigame rounds should be counted');
  assert.ok(raceStats.minigameWins >= 1, 'minigame wins should be counted');

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'easy' }));
  game.changeScene('minigames');
  await frames(5);
  assert.equal(
    game.scene.menu.items.length,
    28,
    'the pass should unlock every minigame plus reef rush levels/variants, the course builder, boss rush, records, the tag leaderboard, mutator, and back',
  );
  assert.equal(game.scene.menu.items[2].label, 'TAG (2P + 5 CPU)', 'tag should be the third entry');
  storage.set('sharkquarium.coins', '500');
  game.changeScene('minigames');
  await frames(5);
  const paid = game.scene;
  assert.equal(paid.coins, 500, 'the minigames menu should read the coin bank');
  assert.equal(
    paid.menu.items.filter((item) => item.feeKey).length,
    14,
    'fourteen paid entries should charge a ticket',
  );
  paid.coins = 0;
  paid.menu.setIndex(paid.menu.items.findIndex((item) => item.action === 'pufferball'));
  await tapKey('Enter');
  await frames(2);
  assert.equal(game.currentSceneName, 'minigames', 'an empty bank should block entry');
  assert.match(String(paid.status), /NEED 25 SEA COINS/, 'the menu should quote the ticket');
  paid.coins = 500;
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'pufferball', 'the paid game should open');
  assert.equal(game.scene.solo, false, 'PUFFER BALL (2P) should start in versus mode');
  assert.equal(game.scene.players.length, 2, 'both divers should take the arena');
  await frames(30);
  assert.ok(game.scene.ball.x > 0, 'the puffer ball should be live');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'puffer ball should quit to the menu');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.coins')),
    475,
    'entering should charge the ticket',
  );
  assert.equal(game.scene.coins, 475, 'the ticket should stay spent after exiting');
  game.scene.menu.setIndex(game.scene.menu.items.findIndex((item) => item.action === 'pufferballSolo'));
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'pufferball', 're-entering should pay a fresh ticket');
  assert.equal(game.scene.solo, true, 'the solo entry should face the CPU');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.coins')),
    450,
    'exiting and re-entering should charge again',
  );
  assert.ok(game.scene.cpu, 'the solo puffer ball should field a CPU chaser');
  game.scene.ball.x = 620;
  game.scene.ball.y = 270;
  game.scene.ball.vx = 0;
  game.scene.ball.vy = 0;
  await frames(150);
  assert.ok(game.scene.cpu.x < 672, 'the CPU chaser should close on the ball');
  assert.ok(
    game.scene.ball.x < 600,
    'the CPU should bump the ball toward the goal it attacks',
  );
  await tapKey('Escape');
  await frames(5);
  for (const [action, sceneName, check] of [
    ['roundup', 'roundup', (scene) => scene.schools.length === 3],
    ['jelly', 'jellyascent', (scene) => scene.rings.length === 22],
    ['stealthSolo', 'stealth', (scene) => scene.seals.length === 3],
    ['trench', 'trench', (scene) => scene.hits === 0 && scene.players.length === 1],
    ['trenchexplore', 'trenchexplore', (scene) => scene.players.length === 1 && scene.shaftBottom > 0],
    ['cleanupSolo', 'cleanup', (scene) => scene.debris.length === 6],
  ]) {
    const menu = game.scene;
    menu.coins = 500;
    menu.menu.setIndex(menu.menu.items.findIndex((item) => item.action === action));
    await tapKey('Enter');
    await frames(5);
    assert.equal(game.currentSceneName, sceneName, `${action} should open from the menu`);
    assert.ok(check(game.scene), `${action} should build its round`);
    await frames(20);
    await tapKey('Escape');
    await frames(5);
    assert.equal(game.currentSceneName, 'minigames', `${action} should quit to the menu`);
  }
  game.changeScene('trench', { solo: true });
  await frames(5);
  const trench = game.scene;
  assert.equal(game.currentSceneName, 'trench', 'trench dive should reopen for the gap check');
  trench.lastGapX = 480;
  trench.barriers.length = 0;
  for (let i = 0; i < 60; i += 1) trench.spawnBarrier();
  let prevGap = 480;
  let maxGapShift = 0;
  for (const barrier of trench.barriers) {
    maxGapShift = Math.max(maxGapShift, Math.abs(barrier.gapX - prevGap));
    prevGap = barrier.gapX;
  }
  assert.ok(
    maxGapShift <= 220 + 0.001,
    'consecutive ice gaps should stay within reach of the diver',
  );

  game.changeScene('trenchexplore');
  await frames(5);
  assert.equal(game.currentSceneName, 'trenchexplore', 'trench explore should open from the menu');
  const explore = game.scene;
  assert.equal(explore.phase, 'play', 'trench explore should start playable');
  assert.equal(explore.players.length, 1, 'trench explore is a solo dive');
  assert.equal(explore.trenchIndex, 0, 'trench explore should start at the first trench');
  assert.ok(explore.coinBubbles.length > 0, 'each trench should hold coin bubbles');
  assert.ok(
    explore.critters.filter((c) => c.kind === 'ray').length >= 6,
    'the trench should hold plenty of catchable rays',
  );
  const burrowCrab = explore.critters.find((c) => c.kind === 'crab');
  burrowCrab.x = 46;
  burrowCrab.state = 'out';
  burrowCrab.burrow = 0;
  explore.players[0].x = burrowCrab.x + 40;
  explore.players[0].y = burrowCrab.y;
  await frames(5);
  assert.notEqual(burrowCrab.state, 'out', 'a cornered crab should burrow into the sand');
  explore.players[0].x = 900;
  explore.players[0].y = explore.floorTop - 60;
  for (let i = 0; i < 600 && burrowCrab.state !== 'out'; i += 1) await frames(1);
  assert.equal(burrowCrab.state, 'out', 'a crab should resurface once the diver is far enough');

  assert.ok(
    explore.critters.filter((c) => c.kind === 'shrimp').length > 0,
    'shrimps should dart the trench',
  );
  const hunter = explore.critters.find((c) => c.kind === 'octopus' || c.kind === 'squid');
  const snack = explore.critters.find((c) => c.kind === 'shrimp');
  hunter.x = snack.x + 4;
  hunter.y = snack.y;
  await frames(2);
  assert.equal(snack.dead, true, 'an octopus or squid should catch a nearby shrimp');
  assert.equal(explore.net.state, 'idle', 'the fishing net should start raised');
  for (let i = 0; i < explore.coinTarget; i += 1) {
    const coin = explore.coinBubbles[0];
    explore.players[0].x = coin.x;
    explore.players[0].y = coin.y;
    await frames(1);
  }
  assert.equal(explore.trenchIndex, 1, 'clearing a trench should move the diver on');
  assert.ok(explore.coinBubbles.length > 0, 'the next trench should spawn fresh coin bubbles');
  explore.players[0].x = 100;
  explore.players[0].y = 400;
  const catchRay = explore.critters.find((c) => c.kind === 'ray');
  explore.net.state = 'test';
  explore.net.depth = 200;
  catchRay.x = 480;
  catchRay.y = 150;
  await frames(2);
  assert.equal(catchRay.caught, true, 'a stingray under the net should be scooped up');
  const caughtShop = JSON.parse(storage.get('sharkquarium.shop') ?? '{}');
  assert.ok(
    (caughtShop.owned ?? []).includes(catchRay.skin),
    'catching a stingray should unlock its free skin',
  );
  const netted = explore.players[0];
  netted.y = 40;
  netted.vy = 0;
  explore.net.state = 'hold';
  explore.net.depth = explore.netMax;
  explore.net.timer = 1;
  await frames(2);
  assert.equal(explore.phase, 'results', 'the descending net should catch a surfaced diver');
  assert.equal(explore.won, false, 'getting netted should lose the run');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'trench explore should quit to the menu');

  game.changeScene('trenchexplore');
  await frames(5);
  const finalDive = game.scene;
  finalDive.startTrench(3);
  finalDive.collected = finalDive.coinTarget;
  finalDive.clearTrench();
  assert.equal(finalDive.phase, 'rising', 'clearing the last trench should rise the megasquid');
  pressKey('Space');
  for (let i = 0; i < 500 && finalDive.phase === 'rising'; i += 1) await frames(1);
  assert.equal(finalDive.phase, 'boss', 'the cutscene should flow into the boss chase');
  assert.ok(finalDive.squid, 'the boss chase should field the megasquid');
  assert.equal(finalDive.squid.hp, 6, 'the megasquid should start at full health');
  finalDive.bossNets.length = 0;
  finalDive.bossNetCursor = finalDive.players[0].x + 6000;
  const bossNet = finalDive.newNet(finalDive.players[0].x + 300);
  finalDive.bossNets.push(bossNet);
  const bait = finalDive.newSchool();
  bait.x = bossNet.x;
  bait.y = bossNet.depth - 60;
  bait.vx = 0;
  bait.vy = 0;
  finalDive.bossSchools.push(bait);
  await frames(2);
  assert.equal(bossNet.baited, true, 'a school herded into a net should bait it');
  finalDive.squid.stun = 0;
  finalDive.squid.x = bossNet.x;
  finalDive.squid.y = bossNet.depth - 20;
  await frames(2);
  assert.ok(finalDive.squid.hp < 6, 'a baited net should damage the megasquid');
  assert.ok(finalDive.squid.stun > 0, 'the net hit should stun the megasquid');

  finalDive.squid.hp = 1;
  finalDive.squid.stun = 0;
  finalDive.squid.x = bossNet.x;
  finalDive.squid.y = bossNet.depth - 20;
  for (const s of finalDive.bossSchools) {
    s.x = bossNet.x;
    s.y = bossNet.depth - 60;
    s.vx = 0;
    s.vy = 0;
  }
  await frames(2);
  releaseKey('Space');
  assert.equal(finalDive.phase, 'results', 'draining the megasquid health should win the chase');
  assert.equal(finalDive.won, true, 'beating the megasquid should count as a win');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'the megasquid chase should quit to the menu');

  game.changeScene('cleanup', { solo: true });
  await frames(5);
  assert.equal(game.currentSceneName, 'cleanup', 'cleanup should reopen for the clock check');
  game.scene.elapsed = 600;
  await frames(3);
  assert.equal(game.currentSceneName, 'cleanup', 'reef cleanup should run with no clock at all');
  const cleanup = game.scene;
  const cleanupHole = cleanup.holes[0];
  assert.equal(
    cleanupHole.palette.body,
    '#7a5c3e',
    'the first cleanup moray should wear the stingray tank brown',
  );
  assert.equal(
    cleanup.holes[1].palette.body,
    '#98854a',
    'the second cleanup moray should wear the stingray tank olive',
  );
  assert.equal(
    cleanup.holes[2].palette.body,
    '#d9b93f',
    'the third cleanup moray should wear the stingray tank spotted yellow',
  );
  cleanupHole.timer = 0;
  await frames(2);
  assert.equal(cleanupHole.state, 'peek', 'cleanup morays should peek smoothly before biting');
  await frames(20);
  assert.ok(cleanupHole.rise > 8, 'the cleanup moray should rise out of its hole');
  while (cleanupHole.state === 'peek') await frames(1);
  assert.equal(cleanupHole.state, 'bite', 'the peek should flow into the bite');
  cleanup.stun[0] = 0;
  cleanup.players[0].x = cleanupHole.x;
  cleanup.players[0].y = 400;
  cleanup.players[0].vx = 0;
  cleanup.players[0].vy = 0;
  cleanup.players[0].invulnerable = 0;
  await frames(6);
  assert.ok(cleanup.stun[0] > 0, 'the cleanup moray bite should stun a diver over its hole');
  await frames(20);
  assert.equal(cleanupHole.state, 'retreat', 'the bite should flow into the retreat');
  await frames(60);
  assert.ok(cleanupHole.rise < 4, 'the cleanup moray should retreat smoothly into its hole');
  await tapKey('Escape');
  await frames(5);
  game.changeScene('minigames');
  await frames(5);
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  const tag = game.scene;
  assert.equal(game.currentSceneName, 'tag', 'the minigames menu should open tag');
  assert.equal(tag.speedScale, 0.5, 'easy should calm the whole tag pace');
  assert.equal(tag.phase, 'names', 'tag should start with name entry');

  await tapKey('KeyA');
  await tapKey('KeyB');
  await tapKey('Backspace');
  await tapKey('KeyC');
  assert.equal(tag.inputText[0], 'AC', 'letters should type and backspace should edit');
  await tapKey('Tab');
  assert.equal(tag.costumeIndex[0], 1, 'tab should change the first costume');
  await tapKey('ArrowRight');
  assert.equal(tag.colorIndex[0], 1, 'arrows should change the chosen color');
  await tapKey('ArrowLeft');
  assert.equal(tag.colorIndex[0], 0, 'arrows should cycle the color back');
  await tapKey('Enter');
  assert.equal(tag.activeField, 1, 'enter should move to the second name');
  await tapKey('KeyD');
  await tapKey('KeyE');
  await tapKey('Enter');
  await frames(5);
  assert.equal(tag.phase, 'play', 'both names should start the round');
  assert.deepEqual(tag.names, ['AC', 'DE'], 'the entered names should be used');
  assert.equal(tag.swimmers[0].costume, 'chainsaw', 'the chosen costume should be worn');
  assert.ok(/^#[0-9a-f]{6}$/i.test(tag.swimmers[0].color), 'the chosen color should be applied');
  assert.equal(tag.swimmers.length, 7, 'two players and five CPUs should play tag');
  const cpuNames = tag.swimmers.filter((swimmer) => swimmer.cpu).map((swimmer) => swimmer.name);
  assert.equal(cpuNames.length, 5, 'five CPUs should join');
  assert.equal(new Set(cpuNames).size, 5, 'CPU names should be distinct');
  assert.ok(
    !cpuNames.includes('AC') && !cpuNames.includes('DE'),
    'CPU names should avoid the player names',
  );
  assert.ok(
    tag.taggerIndex >= 0 && tag.taggerIndex < 7,
    'the starting tagger should be one of the swimmers',
  );
  assert.equal(
    tag.taggerName,
    tag.swimmers[tag.taggerIndex].name,
    'the flash should show the starting tagger',
  );
  assert.ok(tag.flashTimer > 0, 'the tagger name should flash at the start');
  assert.equal(
    tag.swimmers.filter((swimmer) => swimmer.isTagged).length,
    1,
    'only one swimmer should be it',
  );

  tag.giveTagger(2);
  const cpuTagger = tag.swimmers[2];
  assert.ok(cpuTagger.cpu, 'index 2 should be a CPU swimmer');
  assert.ok(cpuTagger.target, 'a CPU tagger should pick a chase target');
  assert.notEqual(cpuTagger.target, cpuTagger, 'the target should be another swimmer');
  assert.ok(tag.swimmers.includes(cpuTagger.target), 'the target should be in the round');
  const firstTarget = cpuTagger.target;
  tag.tagCooldown = 999;
  cpuTagger.vx = 0;
  cpuTagger.vy = 0;
  await frames(10);
  assert.equal(cpuTagger.target, firstTarget, 'the CPU should keep chasing its chosen target');
  const fleeingCpu = tag.swimmers.find((swimmer) => swimmer.cpu && swimmer !== cpuTagger);
  assert.ok(
    cpuTagger.lastSpeed < fleeingCpu.lastSpeed,
    'a CPU that is it should move slower than a fleeing CPU',
  );
  assert.equal(tag.swimmers[0].speed, 150, 'the difficulty pace should scale the players too');
  assert.ok(
    tag.swimmers[0].speed > fleeingCpu.lastSpeed,
    'the player should outswim fleeing CPUs on every difficulty',
  );
  const seenTargets = new Set();
  let sawHumanTarget = false;
  let sawCpuTarget = false;
  for (let i = 0; i < 40; i += 1) {
    tag.giveTagger(2);
    seenTargets.add(cpuTagger.target);
    if (cpuTagger.target.cpu) sawCpuTarget = true;
    else sawHumanTarget = true;
  }
  assert.ok(
    seenTargets.size > 1,
    'CPU taggers should pick random swimmers, not always the nearest one',
  );
  assert.ok(sawHumanTarget, 'the random target pool should include the players');
  assert.ok(sawCpuTarget, 'the random target pool should include the CPUs');
  assert.equal(tag.taggerIndex, 2, 'the CPU should hold the tag for the check');

  tag.swimmers[0].vx = 0;
  tag.swimmers[0].vy = 0;
  pressKey('KeyD');
  await frames(20);
  releaseKey('KeyD');
  assert.ok(tag.swimmers[0].vx > 30, 'P1 should steer their swimmer');
  tag.swimmers[1].vx = 0;
  tag.swimmers[1].vy = 0;
  pressKey('ArrowLeft');
  await frames(20);
  releaseKey('ArrowLeft');
  assert.ok(tag.swimmers[1].vx < -30, 'P2 should steer their swimmer');

  tag.tagCooldown = 0;
  const chaser = tag.swimmers[tag.taggerIndex];
  const victimIndex = tag.taggerIndex === 0 ? 1 : 0;
  const victim = tag.swimmers[victimIndex];
  tag.swimmers.forEach((swimmer) => {
    if (swimmer === chaser || swimmer === victim) return;
    swimmer.x = chaser.x > 880 ? 80 : 1680;
    swimmer.y = chaser.y > 495 ? 80 : 910;
  });
  victim.x = chaser.x;
  victim.y = chaser.y;
  const victimTags = victim.tags;
  const chaserMakes = chaser.makes;
  await frames(2);
  assert.equal(tag.taggerIndex, victimIndex, 'touching the tagger should pass the tag');
  assert.equal(victim.tags, victimTags + 1, 'the new tagger should be counted');
  assert.equal(chaser.makes, chaserMakes + 1, 'the tagger should get credit for tagging');
  assert.equal(tag.taggerName, victim.name, 'the flash should show the new tagger');
  assert.ok(tag.flashTimer > 0, 'the tagger name should flash on every tag');
  assert.ok(
    Math.hypot(victim.x - chaser.x, victim.y - chaser.y) > 20,
    'the tagged swimmer should be pushed away from the original tagger',
  );
  assert.ok(
    Math.hypot(victim.vx, victim.vy) > 100,
    'the push should carry real momentum',
  );

  tag.timeLeft = 0.05;
  await frames(5);
  assert.equal(tag.phase, 'results', 'the round should end on the clock');
  assert.equal(tag.resultLoser, tag.taggerName, 'the final tagger should be the loser');
  assert.equal(tag.winner, false, 'a human tagger should end the round winless for the humans');
  assert.equal(tag.reward, 30, 'a finished tag round should pay play coins');
  await tapKey('Enter');
  await frames(5);
  assert.equal(tag.phase, 'play', 'play again should restart the round');
  assert.equal(tag.swimmers.length, 7, 'play again should field everyone');
  assert.deepEqual(tag.names, ['AC', 'DE'], 'play again should keep the entered names');
  tag.tagCooldown = 999;
  tag.giveTagger(2);
  tag.timeLeft = 0.05;
  await frames(5);
  assert.equal(tag.winner, true, 'a CPU stuck as it should hand the humans the win');
  assert.equal(tag.reward, 90, 'a CPU-tagger round should pay the win bonus');
  const tagBoardSave = JSON.parse(storage.get('sharkquarium.tagboard'));
  assert.ok(tagBoardSave && Object.keys(tagBoardSave.taggers).length > 0, 'the tag board should record taggers');
  assert.ok(Object.keys(tagBoardSave.runners).length > 0, 'the tag board should record runners');
  assert.ok(tag.bestTagger && tag.bestRunner, 'the results should surface the best tagger and runner');
  tag.resultsMenu.index = 1;
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'tagboard', 'the results menu should open the tag leaderboard');
  assert.ok(game.scene.taggers.length > 0 || game.scene.runners.length > 0, 'the leaderboard should list names');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'tag', 'the leaderboard should return to tag');
  game.changeScene('minigames');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'tag should be leavable back to minigames');

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'hard' }));
  game.changeScene('minigames');
  await frames(5);
  assert.equal(
    game.scene.menu.items[4].label,
    'PUFFERFISH DODGEBALL (2P)',
    'two-player dodgeball should be listed fifth',
  );
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  const dodgeball = game.scene;
  assert.equal(game.currentSceneName, 'dodgeball', 'the minigames menu should open dodgeball');
  assert.equal(dodgeball.phase, 'play', 'dodgeball should start live');
  assert.deepEqual(dodgeball.lives, [3, 3], 'each player should start with three lives');
  assert.equal(dodgeball.timeLeft, undefined, 'dodgeball should not run on a timer');
  assert.equal(dodgeball.players.length, 2, 'two players should dodge');

  dodgeball.spawnTimer = 9999;
  dodgeball.puffers.length = 0;
  dodgeball.spawnPuffer();
  const telegraph = dodgeball.puffers[0];
  assert.equal(dodgeball.rules.enemySpeed, 1.6, 'dodgeball should use the selected difficulty');
  assert.ok(
    Math.hypot(telegraph.vx, telegraph.vy) >= 416,
    'hard should speed the pufferfish up from its base 260 px/s',
  );
  telegraph.x = 60;
  telegraph.y = 60;
  telegraph.vx = -320;
  telegraph.vy = -320;
  assert.equal(telegraph.state, 'charge', 'pufferfish should telegraph before flying');
  await frames(60);
  assert.equal(telegraph.state, 'fly', 'the telegraph should launch the pufferfish');

  dodgeball.puffers.length = 0;
  dodgeball.invulnerable[0] = 0;
  dodgeball.spawnPuffer();
  const shot = dodgeball.puffers[0];
  shot.state = 'fly';
  shot.x = dodgeball.players[0].x;
  shot.y = dodgeball.players[0].y;
  await frames(2);
  assert.equal(dodgeball.lives[0], 2, 'a pufferfish hit should cost a life');
  assert.equal(dodgeball.puffers.length, 0, 'a landed hit should pop the pufferfish');

  dodgeball.spawnPuffer();
  const followUp = dodgeball.puffers[0];
  followUp.state = 'fly';
  followUp.x = dodgeball.players[0].x;
  followUp.y = dodgeball.players[0].y;
  await frames(2);
  assert.equal(dodgeball.lives[0], 2, 'invulnerability should protect from follow-up hits');

  dodgeball.puffers.length = 0;
  dodgeball.invulnerable[0] = 0;
  dodgeball.spawnPuffer();
  const secondHit = dodgeball.puffers[0];
  secondHit.state = 'fly';
  secondHit.x = dodgeball.players[0].x;
  secondHit.y = dodgeball.players[0].y;
  await frames(2);
  assert.equal(dodgeball.lives[0], 1, 'the second hit should land after invulnerability lapses');

  dodgeball.puffers.length = 0;
  dodgeball.invulnerable[0] = 0;
  dodgeball.spawnPuffer();
  const last = dodgeball.puffers[0];
  last.state = 'fly';
  last.x = dodgeball.players[0].x;
  last.y = dodgeball.players[0].y;
  await frames(2);
  assert.equal(dodgeball.lives[0], 0, 'the third hit should empty the lives');
  assert.equal(dodgeball.phase, 'results', 'a player running out of lives should end the game');
  assert.equal(dodgeball.winner, 1, 'the other player should win the knockout');
  assert.equal(dodgeball.reward, 90, 'the knockout should pay sea coins plus a win bonus');
  await tapKey('Enter');
  await frames(5);
  assert.equal(dodgeball.phase, 'play', 'play again should restart the match');
  assert.deepEqual(dodgeball.lives, [3, 3], 'play again should restore three lives each');
  assert.equal(dodgeball.reward, 0, 'play again should clear the previous reward');

  dodgeball.elapsed = 0;
  const earlyDiff = dodgeball.difficulty();
  dodgeball.elapsed = 600;
  const lateDiff = dodgeball.difficulty();
  assert.ok(lateDiff.spawnScale < earlyDiff.spawnScale, 'spawns should keep tightening over time');
  assert.ok(lateDiff.speedScale > earlyDiff.speedScale, 'pufferfish should speed up over time');
  assert.ok(lateDiff.chargeScale < earlyDiff.chargeScale, 'telegraphs should shrink over time');
  assert.equal(lateDiff.speedScale, 2.2, 'speed should be capped so the game stays playable');
  assert.ok(lateDiff.chargeScale >= 0.28, 'telegraphs should never vanish entirely');
  assert.ok(lateDiff.aimChance > earlyDiff.aimChance, 'late shots should start aiming at players');
  assert.ok(lateDiff.doubleChance > earlyDiff.doubleChance, 'late waves should double up');
  dodgeball.puffers.length = 0;
  dodgeball.spawnPuffer(lateDiff, { x: 480, y: 270 });
  const aimedShot = dodgeball.puffers[0];
  assert.ok(aimedShot.chargeDuration < 0.5, 'late telegraphs should be shorter');
  const aimDirX = 480 - aimedShot.x;
  const aimDirY = 270 - aimedShot.y;
  const aimLength = Math.hypot(aimDirX, aimDirY) || 1;
  const velocityLength = Math.hypot(aimedShot.vx, aimedShot.vy) || 1;
  const aimDot =
    (aimDirX / aimLength) * (aimedShot.vx / velocityLength) +
    (aimDirY / aimLength) * (aimedShot.vy / velocityLength);
  assert.ok(aimDot > 0.95, 'aimed pufferfish should launch straight at the target');
  dodgeball.puffers.length = 0;
  dodgeball.elapsed = 0;
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'dodgeball should return to minigames');

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal' }));
  assert.equal(
    game.scene.menu.items[1].label,
    'RACE (1P)',
    'the minigames menu should list the solo race',
  );
  assert.equal(
    game.scene.menu.items[3].label,
    'TAG SOLO (1P + 5 CPU)',
    'the minigames menu should list solo tag',
  );
  assert.equal(
    game.scene.menu.items[5].label,
    'DODGEBALL SOLO (1P)',
    'the minigames menu should list solo dodgeball',
  );

  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  const soloRace = game.scene;
  assert.equal(game.currentSceneName, 'play', 'the solo race should start a dive');
  assert.equal(soloRace.race, true, 'the solo race should run in race mode');
  assert.equal(soloRace.solo, true, 'the solo race should be singleplayer');
  assert.equal(soloRace.coop, false, 'the solo race should field one creature');
  assert.equal(soloRace.players.length, 1, 'the solo race should spawn one creature');
  soloRace.playerBubbles[0] = 12;
  soloRace.timeLeft = 0.05;
  await frames(5);
  assert.equal(game.currentSceneName, 'gameover', 'the solo race should end on the clock');
  assert.deepEqual(game.scene.race, [12], 'the solo race should report one tally');
  assert.equal(game.scene.raceWon, true, 'hitting the solo target should count as a win');
  assert.equal(game.scene.coins, 90, 'the solo race should pay play coins plus the win bonus');

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'apocalyptic' }));
  game.changeScene('minigames');
  await frames(5);
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  const soloTag = game.scene;
  assert.equal(game.currentSceneName, 'tag', 'solo tag should open the tag scene');
  assert.equal(soloTag.solo, true, 'solo tag should run singleplayer');
  assert.equal(soloTag.speedScale, 2.4, 'apocalyptic wipeout should raise the whole tag pace');
  await tapKey('KeyZ');
  await tapKey('Enter');
  await frames(5);
  assert.equal(soloTag.phase, 'play', 'one name should start the solo tag round');
  assert.equal(soloTag.swimmers.length, 6, 'solo tag should field one player and five CPUs');
  assert.equal(soloTag.swimmers[0].speed, 720, 'the player pace should scale with the difficulty');
  assert.ok(
    soloTag.swimmers[0].speed > soloTag.swimmers.find((swimmer) => swimmer.cpu).speed * 0.96,
    'the player should still outswim a fleeing CPU on apocalyptic wipeout',
  );
  soloTag.tagCooldown = 999;
  soloTag.giveTagger(1);
  soloTag.timeLeft = 0.05;
  await frames(5);
  assert.equal(soloTag.phase, 'results', 'the solo tag round should end on the clock');
  assert.equal(soloTag.winner, true, 'a CPU stuck as it should win the solo round');
  assert.equal(soloTag.reward, 90, 'solo tag should pay play coins plus the win bonus');
  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal' }));

  game.changeScene('minigames');
  await frames(5);
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  const soloDodge = game.scene;
  assert.equal(game.currentSceneName, 'dodgeball', 'solo dodgeball should open the arena');
  assert.equal(soloDodge.solo, true, 'solo dodgeball should run singleplayer');
  assert.equal(soloDodge.players.length, 1, 'solo dodgeball should field one shark');
  assert.deepEqual(soloDodge.lives, [3], 'solo dodgeball should track one life pool');
  soloDodge.spawnTimer = 9999;
  for (let hit = 0; hit < 3; hit += 1) {
    soloDodge.puffers.length = 0;
    soloDodge.invulnerable[0] = 0;
    soloDodge.spawnPuffer();
    const shot = soloDodge.puffers[0];
    shot.state = 'fly';
    shot.x = soloDodge.players[0].x;
    shot.y = soloDodge.players[0].y;
    await frames(2);
  }
  assert.equal(soloDodge.lives[0], 0, 'three hits should empty the solo lives');
  assert.equal(soloDodge.phase, 'results', 'losing every life should end the solo match');
  assert.equal(soloDodge.won, false, 'a quick knockout should miss the survival target');
  assert.equal(soloDodge.reward, 30, 'a lost solo match should only pay play coins');
  await tapKey('Enter');
  await frames(5);
  assert.equal(soloDodge.phase, 'play', 'solo play again should restart the match');
  soloDodge.spawnTimer = 9999;
  soloDodge.elapsed = 50;
  soloDodge.lives[0] = 1;
  soloDodge.invulnerable[0] = 0;
  soloDodge.spawnPuffer();
  const finishShot = soloDodge.puffers[0];
  finishShot.state = 'fly';
  finishShot.x = soloDodge.players[0].x;
  finishShot.y = soloDodge.players[0].y;
  await frames(2);
  assert.equal(soloDodge.won, true, 'surviving past the target should count as a win');
  assert.equal(soloDodge.reward, 90, 'a survived solo match should pay the win bonus');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'solo dodgeball should return to minigames');

  storage.set(
    'sharkquarium.labyrinth',
    JSON.stringify({ part: 1, creature: 'shark', creature2: 'shark' }),
  );
  game.changeScene('minigames');
  await frames(5);
  assert.equal(
    game.scene.menu.items[6].label,
    'LABYRINTH (2P)',
    'the labyrinth should sit below dodgeball',
  );
  assert.equal(
    game.scene.menu.items[7].label,
    'LABYRINTH SOLO (1P)',
    'the solo labyrinth should follow the co-op chase',
  );
  for (let i = 0; i < 6; i += 1) await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.selected.action,
    'labyrinth',
    'the labyrinth entry should be selectable',
  );
  const musicBeforeLabyrinth = game.music.track ? game.music.track.name : null;
  await tapKey('Enter');
  await frames(5);
  const labyrinth = game.scene;
  assert.equal(game.currentSceneName, 'labyrinth', 'the minigames menu should open labyrinth');
  assert.equal(game.music.track.name, 'labyrinth', 'the labyrinth should play its dread theme');
  assert.equal(game.music.hold, false, 'the dread theme should not hold beyond the wreck');
  assert.equal(labyrinth.phase, 'select', 'the labyrinth should ask for a diver first');
  assert.equal(labyrinth.creatureKey, 'shark', 'the diver picker should default to shark');
  assert.equal(labyrinth.creatureKey2, 'shark', 'P2 should start on the same default');
  assert.equal(labyrinth.startPart, 1, 'the part picker should default to the saved part');
  assert.deepEqual(
    labyrinth.selectMenu.items.map((item) => item.label),
    ['PART: 1/7', 'P1 CREATURE: SHARK', 'P2 CREATURE: SHARK', 'BACK'],
    'the picker should offer the part and both divers',
  );
  assert.equal(labyrinth.previews.length, 2, 'co-op should preview both divers');
  await tapKey('ArrowRight');
  assert.equal(labyrinth.startPart, 2, 'left/right should browse the parts');
  assert.equal(labyrinth.selectMenu.items[0].label, 'PART: 2/7', 'the part row should follow');
  await tapKey('ArrowUp');
  assert.equal(
    labyrinth.selectMenu.selected.action,
    'back',
    'the part row should wrap up to back',
  );
  await tapKey('ArrowDown');
  await tapKey('ArrowLeft');
  assert.equal(labyrinth.startPart, 1, 'the part picker should cycle back');
  await tapKey('ArrowDown');
  assert.equal(
    labyrinth.selectMenu.selected.action,
    'creature1',
    'the first diver row should follow the part row',
  );
  await tapKey('ArrowRight');
  assert.equal(labyrinth.creatureKey, 'stingray', 'left/right should browse P1s divers');
  await tapKey('ArrowDown');
  assert.equal(
    labyrinth.selectMenu.selected.action,
    'creature2',
    'the second diver row should pick for P2',
  );
  await tapKey('ArrowRight');
  await tapKey('ArrowRight');
  assert.equal(labyrinth.creatureKey2, 'squid', 'P2 should cycle their own creature');
  assert.equal(labyrinth.creatureKey, 'stingray', 'P2s pick should not touch P1s');
  assert.equal(
    labyrinth.selectMenu.items[2].label,
    'P2 CREATURE: SQUID',
    'P2s row should follow their pick',
  );
  assert.deepEqual(
    JSON.parse(storage.get('sharkquarium.labyrinth')),
    { part: 1, creature: 'stingray', creature2: 'squid' },
    'both divers should persist separately without touching saved progress',
  );
  await tapKey('ArrowLeft');
  await tapKey('ArrowLeft');
  await tapKey('ArrowUp');
  await tapKey('ArrowLeft');
  assert.equal(labyrinth.creatureKey, 'shark', 'P1 should cycle back to the shark');
  assert.equal(labyrinth.creatureKey2, 'shark', 'P2 should cycle back to the shark');
  await tapKey('Enter');
  await frames(5);
  assert.equal(
    labyrinth.phase,
    'arrival',
    'confirming the diver should arrive at the wreck first',
  );
  assert.equal(labyrinth.arrivalCrew.length, 7, 'the arrival should cast every playable diver');
  assert.equal(
    labyrinth.arrivalCrew[0].entity.constructor.name,
    'Shark',
    'the arrival should lead with the shark',
  );
  assert.equal(labyrinth.arrivalMegasquid.reveal, 0, 'the MEGASQUID should start hidden');
  const arrivalStartX = labyrinth.arrivalCrew[0].entity.x;
  await frames(90);
  assert.ok(
    labyrinth.arrivalCrew[0].entity.x > arrivalStartX,
    'the divers should swim toward the wreck',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(labyrinth.phase, 'play', 'skipping the arrival should start the run');
  assert.equal(labyrinth.players.length, 2, 'two players should run the wreck');
  assert.equal(
    labyrinth.players[0].constructor.name,
    'Shark',
    'the picker should spawn the chosen creature',
  );
  assert.equal(
    labyrinth.players[1].constructor.name,
    'Shark',
    'P2 should spawn their chosen creature',
  );
  assert.deepEqual(labyrinth.grabs, [7, 7], 'each player should get seven grabs');
  assert.deepEqual(labyrinth.checkpointIndex, [0, 0], 'both players should start on section one');
  assert.ok(labyrinth.worldLength > 5000, 'the labyrinth should span many screens');
  assert.equal(labyrinth.tentacles.length, 7, 'the tentacle pack should fill the wreck');

  assert.ok(
    labyrinth.wallDelay > 3.5 && labyrinth.wallDelay <= 4,
    'the tentacles should hold back for a head start',
  );
  const heldStartX = labyrinth.wallX;
  labyrinth.grabPickupTimer = 999;
  await frames(120);
  assert.equal(
    labyrinth.wallX,
    heldStartX,
    'the wall should not creep while the head start runs',
  );
  await frames(180);
  assert.ok(
    labyrinth.wallX > heldStartX,
    'the tentacles should appear once the head start runs out',
  );
  assert.equal(labyrinth.wallDelay, 0, 'the head start should expire');

  const runner = labyrinth.players[0];
  runner.x = labyrinth.checkpoints[1].x + 20;
  runner.y = 270;
  await frames(2);
  assert.equal(labyrinth.checkpointIndex[0], 1, 'passing a section start should arm its checkpoint');
  assert.equal(labyrinth.checkpoints[1].active, true, 'the checkpoint should light up');
  assert.ok(
    labyrinth.wallX <= labyrinth.checkpoints[1].x - 360,
    'a checkpoint should drive the tentacle wall back',
  );
  assert.equal(labyrinth.cracks.length, 10, 'the wreck floor should crack in every section');
  assert.ok(labyrinth.wallBursts.length >= 2, 'walls should hide bursting tentacles');
  assert.equal(labyrinth.ceilings.length, 10, 'the ceiling should creak in every section');
  assert.equal(
    labyrinth.ambushes.length,
    labyrinth.cracks.length + labyrinth.wallBursts.length + labyrinth.ceilingBursts.length,
    'all ambush kinds should share the update list',
  );
  assert.ok(labyrinth.ceilingBursts.length >= 1, 'some tentacles should hide in the ceiling');
  assert.ok(labyrinth.grabPickups.length >= 3, 'grab chances should start in a clump');
  assert.equal(
    new Set(labyrinth.grabPickups.map((pickup) => pickup.clump)).size,
    1,
    'the starting grab chances should share one clump',
  );
  assert.ok(labyrinth.squid, 'a giant squid should haunt the background');

  const pickup = labyrinth.grabPickups[0];
  labyrinth.grabs[0] = 6;
  runner.x = pickup.x;
  runner.y = pickup.y;
  await frames(2);
  assert.ok(labyrinth.grabs[0] > 6, 'collecting a grab clump should add grabs');
  assert.equal(pickup.taken, true, 'a collected grab chance should vanish');
  assert.ok(labyrinth.popups.length > 0, 'collecting a grab chance should pop feedback');
  labyrinth.grabPickups.push({
    x: runner.x,
    y: runner.y,
    phase: 0,
    clump: 99,
    taken: false,
  });
  labyrinth.grabs[0] = 9;
  await frames(2);
  assert.ok(labyrinth.grabs[0] > 9, 'grab chances should push the life count past nine');

  labyrinth.grabPickups.length = 0;
  labyrinth.grabPickupTimer = 0;
  await frames(2);
  assert.equal(
    new Set(labyrinth.grabPickups.map((item) => item.clump)).size,
    1,
    'grab chances should keep appearing in clumps',
  );
  assert.ok(
    labyrinth.grabPickups.length >= 3,
    'each clump should hold several grab chances',
  );
  for (let i = 0; i < 8; i += 1) {
    labyrinth.grabPickupTimer = 0;
    await frames(2);
  }
  assert.ok(
    new Set(labyrinth.grabPickups.map((item) => item.clump)).size <= 4,
    'four clumps at most should float at once',
  );
  assert.ok(
    labyrinth.grabPickups.length >= 6,
    'the wreck should keep a supply of grab chances through every part',
  );
  labyrinth.grabPickups.length = 0;
  labyrinth.grabPickupTimer = 999;

  runner.vx = 0;
  runner.vy = 0;
  canvasPointerDown(864, 444);
  movePointer(924, 444);
  await frames(30);
  assert.ok(runner.vx > 50, 'dragging the labyrinth joystick should steer P1 right');
  canvasPointerUp();
  await frames(2);
  runner.vx = 0;
  runner.vy = 0;
  canvasPointerDown(864, 444);
  movePointer(804, 444);
  await frames(30);
  assert.ok(runner.vx < -50, 'the labyrinth joystick should steer both ways');
  canvasPointerUp();
  await frames(2);
  labyrinth.stunned[0] = 0;
  runner.invulnerable = 0;
  runner.vx = 0;
  runner.vy = 0;

  const crack = labyrinth.cracks[0];
  assert.equal(crack.arms.length, 3, 'ground cracks should hide a bunch of tentacles');
  assert.equal(crack.arms[0].club, false, 'floor cracks should keep the plain tips');
  assert.equal(crack.arms[0].rope, false, 'floor cracks should keep the octopus arms');
  for (const ambush of labyrinth.ambushes) {
    ambush.state = 'idle';
    ambush.timer = 999;
    for (const arm of ambush.arms) {
      arm.burstTimer = 0;
      arm.burstDelay = 0;
      arm.reach = 0;
    }
  }
  for (const ceiling of labyrinth.ceilings) {
    ceiling.state = 'idle';
    ceiling.timer = 999;
    ceiling.chunk = null;
  }
  crack.timer = 0;
  labyrinth.wallDelay = 999;
  labyrinth.grabbed[0] = null;
  labyrinth.out[0] = false;
  labyrinth.stunned[0] = 0;
  labyrinth.grabbed[1] = null;
  labyrinth.out[1] = false;
  labyrinth.players[1].x = 20;
  labyrinth.players[1].y = 270;
  labyrinth.players[1].invulnerable = 999;
  labyrinth.grabs[0] = 6;
  runner.invulnerable = 0;
  runner.vx = 0;
  runner.vy = 0;
  runner.x = crack.x;
  runner.y = 480;
  await frames(3);
  assert.equal(crack.state, 'warn', 'cracked ground should warn before bursting');
  while (crack.state === 'warn') await frames(1);
  const lead = crack.arms[1];
  assert.equal(lead.burstDelay, 0, 'the middle tentacle should erupt immediately');
  assert.ok(crack.arms[0].burstDelay > 0, 'the next tentacle should be queued');
  assert.ok(crack.arms[2].burstDelay > 0, 'the last tentacle should be queued');
  await frames(2);
  assert.ok(lead.reach > 0.2, 'the middle hidden tentacle should spear out first');
  assert.ok(labyrinth.breachChunks.length > 0, 'spearing through should fling breach chunks');
  while (lead.burstAge < 0.24 && crack.state === 'burst') await frames(1);
  assert.ok(crack.arms[0].reach > 0.2, 'the next tentacle should erupt a beat later');
  assert.ok(labyrinth.shake > 0, 'every tentacle burst should shake the screen');
  assert.equal(crack.arms[2].reach, 0, 'the last tentacle should still be queued');
  assert.equal(
    lead.curlGrow,
    0,
    'the early spears should hold straight until the synchronized curl',
  );
  while (lead.burstAge < 0.8 && crack.state === 'burst') await frames(1);
  assert.equal(
    lead.curlGrow,
    0,
    'the straight lance should hold longer before every tip hooks',
  );
  assert.equal(lead.reach, 1, 'the lance should stay fully extended through its hold');
  while (lead.curlGrow < 0.3 && crack.state === 'burst') await frames(1);
  assert.ok(
    crack.arms.every((arm) => arm.reach > 0.9),
    'the whole ripple should be out',
  );
  assert.ok(
    crack.arms.every((arm) => arm.curlGrow > 0.15),
    'every tip should curl together',
  );
  assert.equal(labyrinth.grabs[0], 5, 'the synchronized curls should grab the swimmer');
  assert.ok(labyrinth.grabbed[0], 'the crack grab should hold the swimmer');
  runner.x = crack.x;
  runner.y = 120;
  await frames(60);
  assert.equal(labyrinth.grabbed[0], null, 'the crack grab should release');
  labyrinth.grabs[0] = 6;
  runner.invulnerable = 0;

  const wallBurst = labyrinth.wallBursts[0];
  for (const ambush of labyrinth.ambushes) {
    ambush.state = 'idle';
    ambush.timer = 999;
    for (const arm of ambush.arms) {
      arm.burstTimer = 0;
      arm.burstDelay = 0;
      arm.reach = 0;
    }
  }
  for (const ceiling of labyrinth.ceilings) {
    ceiling.state = 'idle';
    ceiling.timer = 999;
    ceiling.chunk = null;
  }
  wallBurst.timer = 0;
  runner.x = wallBurst.x + (Math.cos(wallBurst.angle) >= 0 ? 70 : -70);
  runner.y = wallBurst.y;
  runner.invulnerable = 0;
  await frames(3);
  assert.equal(wallBurst.state, 'warn', 'wall tentacles should warn before bursting');
  await frames(40);
  assert.equal(wallBurst.state, 'burst', 'wall tentacles should burst sideways');
  assert.ok(wallBurst.arms[0].reach > 0.2, 'the wall burst should extend into the corridor');
  labyrinth.grabbed[0] = null;
  labyrinth.out[0] = false;
  runner.invulnerable = 0;
  for (let i = 0; i < 40 && labyrinth.grabs[0] === 6; i += 1) {
    if (wallBurst.state === 'idle') wallBurst.timer = 0;
    const point = wallBurst.arms[0].pointAt(0.45);
    runner.x = point.x;
    runner.y = point.y;
    runner.invulnerable = 0;
    await frames(1);
  }
  assert.equal(labyrinth.grabs[0], 5, 'a wall burst should grab the swimmer in its path');
  assert.ok(labyrinth.grabbed[0], 'the wall burst grab should hold the swimmer');
  await frames(70);
  assert.equal(labyrinth.grabbed[0], null, 'the wall burst grab should release');
  labyrinth.grabs[0] = 6;
  runner.invulnerable = 0;

  const ceilingBurst = labyrinth.ceilingBursts[0];
  assert.equal(
    ceilingBurst.arms[0].club,
    true,
    'ceiling spears should wear the squid feeding club',
  );
  assert.equal(ceilingBurst.arms[0].rope, true, 'the ceiling spear should be a thin squid rope');
  assert.ok(
    ceilingBurst.arms[0].widthAt(0) < labyrinth.cracks[0].arms[0].widthAt(0),
    'the feeding tentacle should be thinner than the octopus arms',
  );
  for (const ambush of labyrinth.ambushes) {
    ambush.state = 'idle';
    ambush.timer = 999;
    for (const arm of ambush.arms) {
      arm.burstTimer = 0;
      arm.burstDelay = 0;
      arm.reach = 0;
    }
  }
  for (const spot of labyrinth.ceilings) {
    spot.state = 'idle';
    spot.timer = 999;
    spot.chunk = null;
  }
  ceilingBurst.timer = 0;
  runner.x = ceilingBurst.x;
  runner.y = ceilingBurst.y + 120;
  runner.vx = 0;
  runner.vy = 0;
  runner.invulnerable = 0;
  await frames(3);
  assert.equal(ceilingBurst.state, 'warn', 'ceiling tentacles should warn before bursting');
  while (ceilingBurst.state === 'warn') await frames(1);
  await frames(8);
  assert.ok(ceilingBurst.arms[0].reach > 0.2, 'the ceiling spear should snap down');
  assert.equal(labyrinth.grabbed[0], null, 'the lance phase should not grab');
  assert.equal(labyrinth.grabs[0], 6, 'a touch during the lance should not cost a grab');
  while (ceilingBurst.arms[0].curlGrow < 0.2 && ceilingBurst.state === 'burst') {
    await frames(1);
  }
  await frames(2);
  assert.equal(labyrinth.grabs[0], 5, 'a ceiling burst should grab the swimmer under it');
  assert.ok(labyrinth.grabbed[0], 'the ceiling grab should hold the swimmer');
  runner.y = 60;
  await frames(70);
  assert.equal(labyrinth.grabbed[0], null, 'the ceiling grab should release');
  labyrinth.grabs[0] = 6;
  runner.invulnerable = 0;

  ceilingBurst.state = 'idle';
  ceilingBurst.timer = 0;
  for (const arm of ceilingBurst.arms) {
    arm.burstTimer = 0;
    arm.burstDelay = 0;
    arm.reach = 0;
  }
  runner.x = ceilingBurst.x;
  runner.y = 430;
  runner.vx = 0;
  runner.vy = 0;
  runner.invulnerable = 0;
  await frames(3);
  assert.equal(
    ceilingBurst.state,
    'warn',
    'ceiling tentacles should still warn for a diver at the wreck deck',
  );
  while (ceilingBurst.state === 'warn') await frames(1);
  await frames(8);
  assert.ok(
    ceilingBurst.arms[0].reach > 0.9,
    'the ceiling spear should thrust straight at the diver',
  );
  const deckDistance = Math.hypot(runner.x - ceilingBurst.x, runner.y - ceilingBurst.y);
  assert.ok(
    Math.abs(ceilingBurst.arms[0].stretch - Math.min(deckDistance, 401)) < 40 &&
      ceilingBurst.arms[0].stretch > 260,
    'the ceiling spear should stretch down to the deck diver',
  );
  await frames(30);
  assert.equal(ceilingBurst.arms[0].curlGrow, 0, 'the feeding lance should hold rigid');
  assert.equal(labyrinth.grabbed[0], null, 'the lance should not grab the deck diver');
  assert.equal(labyrinth.grabs[0], 6, 'the lance touch should not cost a grab');
  while (ceilingBurst.arms[0].curlGrow < 0.2 && ceilingBurst.state === 'burst') {
    await frames(1);
  }
  await frames(2);
  assert.equal(labyrinth.grabs[0], 5, 'a diver at the bottom should be grabbed by the ceiling spear');
  await frames(70);
  assert.equal(labyrinth.grabbed[0], null, 'the deck-level ceiling grab should release');
  labyrinth.grabs[0] = 6;
  runner.invulnerable = 0;

  ceilingBurst.state = 'idle';
  ceilingBurst.timer = 0;
  for (const arm of ceilingBurst.arms) {
    arm.burstTimer = 0;
    arm.burstDelay = 0;
    arm.reach = 0;
  }
  runner.x = ceilingBurst.x + 40;
  runner.y = 430;
  runner.vx = 0;
  runner.vy = 0;
  runner.invulnerable = 0;
  labyrinth.wallDelay = 4;
  labyrinth.wallX = -600;
  await frames(3);
  assert.equal(
    ceilingBurst.state,
    'warn',
    'ceiling tentacles should trigger even for a diver out of reach',
  );
  while (ceilingBurst.state === 'warn') await frames(1);
  await frames(8);
  runner.x = ceilingBurst.x + 400;
  runner.y = 430;
  await frames(10);
  const farDistance = Math.hypot(runner.x - ceilingBurst.x, runner.y - ceilingBurst.y);
  assert.ok(farDistance > 480, 'the far diver should sit past the spear length');
  assert.ok(
    ceilingBurst.arms[0].stretch <= 401 && ceilingBurst.arms[0].stretch < farDistance,
    'the ceiling spear should stop at full stretch for an out-of-reach diver',
  );
  await frames(80);
  labyrinth.grabbed[0] = null;
  labyrinth.out[0] = false;
  labyrinth.stunned[0] = 0;
  labyrinth.grabs[0] = 6;
  runner.invulnerable = 0;
  runner.x = 90;
  runner.y = 270;

  const ceiling = labyrinth.ceilings[0];
  for (const spot of labyrinth.ceilings) {
    spot.state = 'idle';
    spot.timer = 999;
    spot.chunk = null;
  }
  for (const ambush of labyrinth.ambushes) {
    ambush.state = 'idle';
    ambush.timer = 999;
    for (const arm of ambush.arms) {
      arm.burstTimer = 0;
      arm.burstDelay = 0;
      arm.reach = 0;
    }
  }
  ceiling.timer = 0;
  labyrinth.wallX = -300;
  runner.invulnerable = 0;
  runner.x = ceiling.x;
  runner.y = 320;
  await frames(3);
  assert.equal(ceiling.state, 'warn', 'a cracked ceiling should warn before dropping');
  await frames(35);
  assert.equal(ceiling.state, 'falling', 'the ceiling should drop a chunk');
  assert.ok(ceiling.chunk, 'a chunk should be falling');
  for (let i = 0; i < 40 && ceiling.chunk; i += 1) {
    if (ceiling.chunk) {
      runner.x = ceiling.chunk.x;
      runner.y = Math.max(60, ceiling.chunk.y);
    }
    await frames(1);
  }
  assert.ok(labyrinth.stunned[0] > 0, 'a falling chunk should stagger the swimmer under it');
  await frames(70);
  assert.equal(labyrinth.stunned[0], 0, 'the stagger should wear off');
  labyrinth.stunned[0] = 0;
  runner.invulnerable = 0;
  labyrinth.wallDelay = 0;

  assert.equal(labyrinth.supports.length, 5, 'every section should be braced by a cracked support');
  assert.ok(labyrinth.corals.length >= 8, 'broken corals should litter the wreck');
  labyrinth.schoolTimer = 0;
  await frames(2);
  assert.ok(labyrinth.schools.length > 0, 'schools of fish should dart through the wreck');

  const support = labyrinth.supports[0];
  support.x = 520;
  labyrinth.grabbed[1] = null;
  labyrinth.out[1] = false;
  labyrinth.grabs[1] = 6;
  labyrinth.players[1].x = 20;
  labyrinth.players[1].invulnerable = 999;
  for (const ceilingSpot of labyrinth.ceilings) {
    ceilingSpot.state = 'idle';
    ceilingSpot.timer = 999;
    ceilingSpot.chunk = null;
  }
  for (const ambush of labyrinth.ambushes) {
    ambush.state = 'idle';
    ambush.timer = 999;
    for (const arm of ambush.arms) {
      arm.burstTimer = 0;
      arm.burstDelay = 0;
      arm.reach = 0;
    }
  }
  labyrinth.wallX = support.x - 900;
  labyrinth.wallStun = 0;
  runner.x = support.x - 58;
  runner.y = 270;
  runner.vx = 0;
  runner.vy = 0;
  await frames(2);
  assert.equal(support.broken, false, 'a slow nudge should not break a support');
  const restartX = -350;
  runner.invulnerable = 999;
  labyrinth.wallX = 1400;
  runner.x = support.x - 58;
  runner.vx = 430;
  await frames(2);
  assert.equal(support.broken, true, 'ramming a cracked support should break it');
  assert.ok(labyrinth.wallStun > 0, 'the collapse should stun the tentacle wall');
  assert.ok(
    labyrinth.collapseStubs.length > 0,
    'ramming a support should drop ceiling stubs onto the tangle',
  );
  assert.ok(
    labyrinth.crushFades.length > 0,
    'the collapse should keep the crushed tangle in view while the stubs fall',
  );
  assert.ok(
    Math.abs(labyrinth.wallX - restartX) < 0.001,
    'the collapse should restart the tangle at the start of the part',
  );
  support.broken = false;
  labyrinth.wallX = restartX - 200;
  labyrinth.wallStun = 999;
  runner.x = support.x - 58;
  runner.vx = 430;
  await frames(2);
  assert.ok(
    labyrinth.wallX <= restartX - 200 + 0.001,
    'the collapse should never teleport the tangle forward',
  );
  const hangingStub = labyrinth.walls.find((wall) => wall.y <= 0 && wall.w <= 100);
  assert.ok(hangingStub, 'the wreck should raise hanging ceiling stubs');
  labyrinth.collapseStubs.length = 0;
  const wallsBefore = labyrinth.walls.length;
  const stubCenter = hangingStub.x + hangingStub.w / 2;
  support.broken = false;
  labyrinth.wallStun = 0;
  labyrinth.wallX = stubCenter + 60;
  runner.x = support.x - 58;
  runner.vx = 430;
  await frames(2);
  assert.equal(support.broken, true, 'the ram should break the support');
  assert.equal(
    labyrinth.walls.length,
    wallsBefore - 1,
    'ramming should tear a nearby ceiling stub out of the course',
  );
  assert.ok(
    labyrinth.collapseStubs.some((stub) => Math.abs(stub.x - stubCenter) < 2),
    'the torn ceiling stub should fall from where it hung',
  );
  assert.ok(labyrinth.morayHoles.length > 0, 'the floor stubs should sprout moray holes');
  const morayHole = labyrinth.morayHoles[0];
  assert.ok(
    morayHole.top > 0,
    'the moray holes should sit on floor stubs, not ceiling stubs',
  );
  labyrinth.wallDelay = 0;
  labyrinth.out[0] = false;
  labyrinth.escaped[0] = false;
  labyrinth.grabbed[0] = null;
  labyrinth.stunned[0] = 0;
  runner.invulnerable = 0;
  morayHole.state = 'bite';
  morayHole.timer = 999;
  runner.x = morayHole.x;
  runner.y = morayHole.top - 40;
  runner.vx = 0;
  runner.vy = 0;
  await frames(2);
  assert.ok(labyrinth.stunned[0] > 0, 'a floor-stub moray should bite a diver over its hole');
  assert.equal(morayHole.state, 'retreat', 'the bite should send the moray into retreat');
  labyrinth.stunned[0] = 0;
  runner.invulnerable = 0;
  runner.vx = 0;
  runner.vy = 0;
  const savedRules = labyrinth.rules;
  labyrinth.rules = { ...savedRules, enemySpeed: 2.4 };
  support.broken = false;
  labyrinth.wallX = 1400;
  labyrinth.wallStun = 0;
  runner.x = support.x - 58;
  runner.vx = 430;
  await frames(2);
  assert.ok(
    Math.abs(labyrinth.wallX - restartX) < 0.001,
    'apocalyptic speed should not weaken the support teleport',
  );
  labyrinth.rules = savedRules;
  const heldWallX = labyrinth.wallX;
  runner.x = support.x - 300;
  runner.vx = 0;
  runner.vy = 0;
  await frames(30);
  assert.ok(labyrinth.wallX <= heldWallX + 0.001, 'the stunned wall should hold its ground');
  await frames(180);
  assert.ok(labyrinth.wallX > heldWallX, 'the wall should resume its advance after the stun');
  assert.equal(
    labyrinth.collapseStubs.length,
    0,
    'dropped ceiling stubs should settle into the tangle',
  );
  runner.vx = 0;
  runner.vy = 0;
  runner.invulnerable = 0;
  labyrinth.players[1].invulnerable = 0;

  labyrinth.squid.x = -510;
  await frames(30);
  assert.ok(labyrinth.squid.x > -500, 'the background squid should drift after the players');

  labyrinth.wallX = runner.x - 10;
  await frames(2);
  assert.equal(labyrinth.grabs[0], 5, 'the tentacle wall should cost a grab');
  assert.ok(labyrinth.grabbed[0], 'the grabbed player should be held');
  await frames(60);
  assert.equal(labyrinth.grabbed[0], null, 'the grab should release');
  assert.equal(labyrinth.grabs[0], 5, 'a single grab should not be spent twice');
  assert.ok(
    labyrinth.players[0].x >= labyrinth.checkpoints[1].x,
    'a grabbed player should respawn at the last checkpoint',
  );
  assert.ok(labyrinth.players[0].invulnerable > 0, 'respawning should grant invulnerability');

  labyrinth.wallX = -300;
  labyrinth.grabbed[1] = null;
  labyrinth.out[1] = false;
  labyrinth.grabs[1] = 6;
  labyrinth.players[1].invulnerable = 0;
  labyrinth.players[0].invulnerable = 0;
  labyrinth.players[0].x = labyrinth.exitX;
  await frames(2);
  assert.equal(labyrinth.escaped[0], true, 'reaching the breach should escape the wreck');
  assert.equal(labyrinth.phase, 'play', 'the co-op run should wait for the other player');

  const wing = labyrinth.players[1];
  labyrinth.grabbed[1] = null;
  labyrinth.out[1] = false;
  labyrinth.grabs[1] = 1;
  wing.invulnerable = 0;
  labyrinth.wallX = wing.x - 10;
  await frames(2);
  assert.equal(labyrinth.grabs[1], 0, 'the final grab should be spent');
  await frames(60);
  assert.equal(labyrinth.out[1], true, 'running out of grabs should end the chase');
  assert.equal(labyrinth.phase, 'results', 'the run should end when no player can escape');
  assert.equal(labyrinth.won, false, 'one player left behind should miss the win bonus');
  assert.equal(labyrinth.reward, 30, 'a failed escape should only pay play coins');

  await tapKey('Enter');
  await frames(5);
  assert.equal(labyrinth.phase, 'play', 'play again should restart the wreck');
  assert.equal(labyrinth.part, 1, 'play again should restart at part one');
  assert.deepEqual(labyrinth.grabs, [7, 7], 'play again should restore seven grabs each');
  assert.equal(labyrinth.escaped[0], false, 'play again should reset the escape flags');

  labyrinth.players.forEach((player) => {
    player.invulnerable = 0;
    player.x = labyrinth.exitX;
  });
  await frames(2);
  assert.equal(labyrinth.part, 2, 'both players escaping should advance the run');
  assert.equal(labyrinth.phase, 'play', 'the next part should start immediately');
  assert.equal(labyrinth.escaped[0], false, 'the next part should clear the escape flags');
  assert.ok(
    labyrinth.players[0].x < 200,
    'the next part should respawn the divers at the entrance',
  );
  assert.ok(labyrinth.wallX < 0, 'the next part should reset the tentacle wall');

  labyrinth.part = 7;
  labyrinth.players.forEach((player) => {
    player.invulnerable = 0;
    player.x = labyrinth.exitX;
  });
  await frames(2);
  assert.equal(labyrinth.phase, 'ending', 'escaping the last part should play the ending');
  assert.equal(labyrinth.won, true, 'a clean full escape should win the bonus');
  assert.equal(labyrinth.reward, 90, 'the full escape should pay the win bonus');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.labyrinth')).part,
    1,
    'a full escape should clear the saved progress',
  );
  assert.equal(labyrinth.escapees.length, 7, 'all seven creatures should escape in the ending');
  const escapeTravel = labyrinth.escapees[0].travel;
  const squidSceneOne = labyrinth.megasquid.y;
  await frames(60);
  assert.ok(
    labyrinth.escapees[0].travel > escapeTravel,
    'the survivors should swim clear of the wreck in the first ending beat',
  );
  assert.ok(
    Math.abs(labyrinth.megasquid.y - squidSceneOne) < 40,
    'the MEGASQUID should stay tangled in the wreck until the trench beat',
  );
  labyrinth.endingTimer = 5;
  await frames(130);
  assert.ok(
    labyrinth.megasquid.y > 260,
    'the MEGASQUID should sink into the trench in the second ending beat',
  );
  assert.ok(labyrinth.megasquid.sink > 0, 'the trench beat should sink the wreck');
  await tapKey('Enter');
  await frames(5);
  assert.equal(labyrinth.phase, 'results', 'skipping the ending should show the results');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'labyrinth should return to minigames');
  assert.equal(
    game.music.track ? game.music.track.name : null,
    musicBeforeLabyrinth,
    'leaving the labyrinth should restore the previous theme',
  );

  storage.set('sharkquarium.labyrinth', JSON.stringify({ part: 3, creature: 'kelpcrab' }));
  game.changeScene('labyrinth');
  await frames(5);
  const resumed = game.scene;
  assert.equal(resumed.phase, 'select', 'a saved run should still ask for a diver first');
  assert.equal(resumed.startPart, 3, 'the picker should remember the saved part');
  assert.equal(resumed.creatureKey, 'kelpcrab', 'the picker should remember the saved creature');
  assert.equal(resumed.creatureKey2, 'shark', 'a missing P2 pick should default to shark');
  assert.equal(
    resumed.selectMenu.items[0].label,
    'PART: 3/7',
    'the part row should show the saved part',
  );
  assert.equal(
    resumed.selectMenu.items[1].label,
    'P1 CREATURE: CRAB',
    'the saved creature should be preselected',
  );
  assert.equal(
    resumed.selectMenu.items[2].label,
    'P2 CREATURE: SHARK',
    'P2 should get their own default row',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(resumed.phase, 'arrival', 'the saved run should arrive at the wreck first');
  await tapKey('Enter');
  await frames(5);
  assert.equal(resumed.phase, 'play', 'starting the saved run should dive straight in');
  assert.equal(resumed.part, 3, 'the run should resume at the saved part');
  assert.equal(resumed.sectionCount, 5, 'the resumed part should use its own course');
  assert.equal(resumed.players[0].constructor.name, 'KelpCrab', 'the saved creature should dive');
  assert.equal(resumed.players[1].constructor.name, 'Shark', 'P2 should dive their own pick');
  assert.match(String(resumed.banner), /RESUMING PART 3/, 'the banner should announce the resume');

  resumed.part = 4;
  resumed.buildCourse();
  resumed.setupPart();
  resumed.wallDelay = 0;
  resumed.out[0] = false;
  resumed.grabbed[0] = null;
  resumed.grabs[0] = 1;
  resumed.players[0].invulnerable = 0;
  resumed.wallX = resumed.players[0].x - 10;
  await frames(70);
  assert.equal(resumed.out[0], true, 'the caught diver should be out');
  assert.equal(resumed.phase, 'results', 'losing a dive should end the run');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.labyrinth')).part,
    4,
    'dying after part one should save the reached part',
  );
  assert.equal(
    JSON.parse(storage.get('sharkquarium.labyrinth')).creature,
    'kelpcrab',
    'saving progress should keep the picked creature',
  );
  assert.ok(resumed.won === false, 'being caught should not count as a win');
  await tapKey('Enter');
  await frames(5);
  assert.equal(resumed.part, 4, 'play again should resume the saved part');
  assert.equal(resumed.phase, 'play', 'the resumed part should be live');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'the resumed run should still quit cleanly');
  storage.set('sharkquarium.labyrinth', JSON.stringify({ part: 1, creature: 'shark' }));

  game.changeScene('minigames');
  await frames(5);
  for (let i = 0; i < 7; i += 1) await tapKey('ArrowDown');
  assert.equal(
    game.scene.menu.selected.action,
    'labyrinthSolo',
    'the solo labyrinth should be selectable',
  );
  await tapKey('Enter');
  await frames(5);
  const soloLabyrinth = game.scene;
  assert.equal(game.currentSceneName, 'labyrinth', 'solo labyrinth should open the wreck');
  assert.equal(game.music.track.name, 'labyrinth', 'solo labyrinth should play the dread theme');
  assert.equal(soloLabyrinth.solo, true, 'solo labyrinth should run singleplayer');
  assert.equal(soloLabyrinth.phase, 'select', 'solo labyrinth should ask for a diver first');
  assert.equal(soloLabyrinth.creatureKey, 'shark', 'the picker should remember the last diver');
  assert.deepEqual(
    soloLabyrinth.selectMenu.items.map((item) => item.label),
    ['PART: 1/7', 'CREATURE: SHARK', 'BACK'],
    'solo should offer the part and one diver row',
  );
  await tapKey('ArrowDown');
  for (let i = 0; i < 6; i += 1) await tapKey('ArrowRight');
  assert.equal(soloLabyrinth.creatureKey, 'nautilus', 'the picker should reach the nautilus');
  assert.equal(
    soloLabyrinth.selectMenu.items[1].label,
    'CREATURE: NAUTILUS',
    'the picker should name the nautilus',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(soloLabyrinth.phase, 'arrival', 'the solo run should arrive at the wreck first');
  await tapKey('Enter');
  await frames(5);
  assert.equal(soloLabyrinth.phase, 'play', 'diving should start the solo run');
  assert.equal(
    soloLabyrinth.players[0].constructor.name,
    'Nautilus',
    'the solo run should field the chosen creature',
  );
  const diver = soloLabyrinth.players[0];
  diver.y = 270;
  pressKey('KeyW');
  await frames(12);
  releaseKey('KeyW');
  assert.ok(diver.y < 270, 'the labyrinth nautilus should swim upward');
  const labyrinthUpY = diver.y;
  pressKey('KeyS');
  await frames(12);
  releaseKey('KeyS');
  assert.ok(diver.y > labyrinthUpY, 'the labyrinth nautilus should swim back down');
  assert.equal(soloLabyrinth.players.length, 1, 'solo labyrinth should field one diver');
  assert.deepEqual(soloLabyrinth.grabs, [7], 'solo labyrinth should track one grab pool');
  assert.equal(soloLabyrinth.part, 1, 'solo labyrinth should start at part one');
  soloLabyrinth.players[0].invulnerable = 0;
  soloLabyrinth.players[0].x = soloLabyrinth.exitX;
  await frames(2);
  assert.equal(soloLabyrinth.part, 2, 'a solo escape should open the next part');
  assert.equal(soloLabyrinth.phase, 'play', 'part two should start immediately');
  assert.deepEqual(soloLabyrinth.grabs, [7], 'a new part should refill the grabs');
  assert.ok(soloLabyrinth.players[0].x < 200, 'part two should respawn the diver at the entrance');

  soloLabyrinth.part = 3;
  soloLabyrinth.buildCourse();
  assert.equal(soloLabyrinth.sectionCount, 5, 'the early parts should keep the base course');
  soloLabyrinth.part = 4;
  soloLabyrinth.buildCourse();
  assert.equal(soloLabyrinth.sectionCount, 6, 'part four should add an extra section');
  soloLabyrinth.part = 7;
  soloLabyrinth.buildCourse();
  assert.equal(soloLabyrinth.sectionCount, 7, 'part seven should be the longest wreck');
  soloLabyrinth.setupPart();
  assert.equal(soloLabyrinth.tentacles.length, 8, 'later parts should add grabbing arms');
  assert.equal(soloLabyrinth.cracksPerSection, 4, 'later parts should seed more floor ambushes');
  assert.equal(soloLabyrinth.wallBurstsPerSection, 3, 'later parts should seed more wall ambushes');
  assert.ok(soloLabyrinth.tunnelMargin > 26, 'later parts should offer fewer tunnels');
  assert.ok(
    soloLabyrinth.cracks[0].warn < 0.55,
    'later parts should shorten ambush warning windows',
  );
  assert.ok(
    soloLabyrinth.ceilings[0].warn < 0.5,
    'later parts should shorten ceiling warnings too',
  );
  assert.equal(soloLabyrinth.phase, 'play', 'the rebuilt part should still be live');
  soloLabyrinth.players[0].maxX = soloLabyrinth.worldLength;
  soloLabyrinth.players[0].invulnerable = 0;
  soloLabyrinth.players[0].x = soloLabyrinth.exitX;
  await frames(2);
  assert.equal(soloLabyrinth.phase, 'ending', 'escaping the last part should play the ending');
  assert.equal(soloLabyrinth.won, true, 'escaping solo should win the round');
  assert.equal(soloLabyrinth.reward, 90, 'a solo escape should pay the win bonus');
  assert.equal(soloLabyrinth.escapees.length, 7, 'the ending should show every creature');
  await tapKey('Enter');
  await frames(5);
  assert.equal(soloLabyrinth.phase, 'results', 'skipping the ending should show the results');
  await tapKey('Enter');
  await frames(5);
  assert.equal(soloLabyrinth.phase, 'play', 'solo play again should restart the wreck');
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'solo labyrinth should return to minigames');
  assert.equal(
    game.music.track ? game.music.track.name : null,
    musicBeforeLabyrinth,
    'solo labyrinth should restore the previous theme too',
  );

  game.changeScene('labyrinth', { solo: true });
  await frames(5);
  const chosen = game.scene;
  assert.equal(chosen.startPart, 1, 'a cleared save should offer part one first');
  for (let i = 0; i < 4; i += 1) await tapKey('ArrowRight');
  assert.equal(chosen.startPart, 5, 'the part picker should reach any part');
  assert.equal(chosen.selectMenu.items[0].label, 'PART: 5/7', 'the part row should follow');
  await tapKey('ArrowDown');
  assert.equal(
    chosen.selectMenu.selected.action,
    'creature1',
    'the diver row should sit below the part row',
  );
  await tapKey('Enter');
  await frames(5);
  assert.equal(chosen.phase, 'arrival', 'a picker run should arrive at the wreck first');
  await tapKey('Enter');
  await frames(5);
  assert.equal(chosen.phase, 'play', 'a hand-picked part should start live');
  assert.equal(chosen.part, 5, 'the run should begin on the chosen part');
  assert.equal(chosen.sectionCount, 6, 'the chosen part should build its own course');
  assert.doesNotMatch(
    String(chosen.banner),
    /RESUMING/,
    'a hand-picked part should not claim a resume',
  );
  assert.equal(
    JSON.parse(storage.get('sharkquarium.labyrinth')).part,
    1,
    'picking a part should not overwrite saved progress',
  );
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'the chosen part should quit cleanly');

  storage.set('sharkquarium.labyrinth', JSON.stringify({ part: 1, creature: 'shark' }));
  game.changeScene('labyrinth', { solo: true });
  await frames(5);
  const capped = game.scene;
  for (let i = 0; i < 6; i += 1) await tapKey('ArrowRight');
  assert.equal(capped.startPart, 7, 'the part picker should reach the last part');
  await tapKey('ArrowDown');
  for (let i = 0; i < 5; i += 1) await tapKey('ArrowRight');
  assert.equal(capped.creatureKey, 'jellyfish', 'the picker should reach the slowest diver');
  await tapKey('Enter');
  await frames(5);
  assert.equal(capped.phase, 'arrival', 'the last part should arrive at the wreck first');
  await tapKey('Enter');
  await frames(5);
  assert.equal(capped.players[0].constructor.name, 'MoonJelly', 'the jelly should dive');
  assert.equal(capped.part, 7, 'the last part should be live');
  assert.equal(capped.players[0].maxSpeed, 350, 'the jelly should report its swim speed');
  assert.ok(
    capped.wallCeiling < capped.players[0].maxSpeed,
    'the tentacle wall must never outrun the slowest diver',
  );
  assert.ok(
    capped.wallCeiling <= capped.players[0].maxSpeed * 0.73,
    'the wall cap should track the slowest diver',
  );
  await tapKey('Escape');
  await frames(5);

  storage.set('sharkquarium.labyrinth', JSON.stringify({ part: 1, creature: 'shark' }));
  game.changeScene('labyrinth', { solo: true });
  await frames(5);
  const ray = game.scene;
  await tapKey('ArrowDown');
  await tapKey('ArrowRight');
  assert.equal(ray.creatureKey, 'stingray', 'the picker should reach the stingray');
  await tapKey('Enter');
  await frames(5);
  assert.equal(ray.phase, 'arrival', 'the stingray run should arrive at the wreck first');
  await tapKey('Enter');
  await frames(5);
  assert.equal(ray.players[0].constructor.name, 'Stingray', 'the stingray should dive');
  const rayPlayer = ray.players[0];
  const rayStartY = rayPlayer.y;
  pressKey('KeyS');
  await frames(70);
  releaseKey('KeyS');
  assert.ok(rayPlayer.y > rayStartY, 'the labyrinth stingray should swim downward normally');
  assert.equal(
    rayPlayer.burrowed,
    false,
    'the stingray should never bury itself in the wreck deck',
  );
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'the stingray run should quit cleanly');
  storage.set('sharkquarium.labyrinth', JSON.stringify({ part: 1, creature: 'shark' }));

  game.changeScene('menu');
  await frames(5);
  assert.equal(game.scene.menu.items.length, 11, 'the passes should fill the menu entries');
  assert.equal(
    game.scene.menu.items[4].label,
    'PETS TANK',
    'the pets tank entry should sit under minigames',
  );
  storage.set('sharkquarium.pets', JSON.stringify({ meals: 0 }));
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 4, 'the pets tank entry should be selectable');
  await tapKey('Enter');
  await frames(5);
  const pets = game.scene;
  assert.equal(game.currentSceneName, 'play', 'the pets tank entry should start a dive');
  assert.equal(pets.petsTank, true, 'playpass 3 should open the pets tank');
  assert.equal(pets.players.length, 0, 'the pets tank should have no player creature');
  assert.equal(pets.pets.length, 11, 'pet play should add three rare pets');
  assert.equal(
    new Set(pets.pets.map((pet) => pet.kind)).size,
    11,
    'the pets should cover every shop creature plus the bonuses',
  );
  assert.equal(pets.petTrained, true, 'pet play should train the pets');
  assert.equal(pets.meals, 0, 'saved feeding progress should load on entry');
  assert.equal(game.music.track.name, 'pets', 'the pets tank should play its own theme');

  const hungerPet = pets.pets[2];
  hungerPet.hunger = 0;
  await frames(60);
  assert.ok(hungerPet.hunger > 0, 'pets should get hungry over time');
  hungerPet.hunger = 1;
  assert.ok(game.scene.hudState().hungry >= 1, 'hungry pets should show on the HUD');
  hungerPet.hunger = 0;
  pets.timeLeft = 0.05;
  await frames(10);
  assert.equal(game.currentSceneName, 'play', 'the pets tank should not run on a clock');
  assert.equal(pets.timeLeft, 0.05, 'the pets tank clock should not tick');

  pets.pets.forEach((pet, index) => {
    pet.x = 80 + index * 12;
    pet.y = 80;
    pet.waypointX = pet.x;
    pet.waypointY = pet.y;
    pet.roamTimer = 999;
  });
  pets.food.length = 0;
  canvasPointerDown(480, 300);
  await frames(2);
  canvasPointerUp();
  assert.ok(
    pets.food.some((item) => item.rise > 0),
    'left click should drop a bubble snack that floats up',
  );
  await frames(12);
  pets.food.length = 0;
  pets.petEnemies.length = 0;
  pets.nextWave = pets.meals + 1000;
  canvasPointerDownSecondary(480, 320);
  await frames(2);
  canvasPointerUp();
  assert.ok(
    pets.food.some((item) => item.kind !== undefined),
    'right click should drop an edible critter while no enemy is loose',
  );

  const feedingPet = pets.pets[0];
  feedingPet.x = 480;
  feedingPet.y = 320;
  feedingPet.waypointX = 480;
  feedingPet.waypointY = 320;
  const feedItem = pets.food.find((item) => item.kind !== undefined);
  feedItem.x = feedingPet.x;
  feedItem.y = feedingPet.y;
  feedItem.hover = feedingPet.y;
  const petMeals = pets.meals;
  const petScore = pets.score;
  await frames(2);
  assert.equal(pets.meals, petMeals + 2, 'trained pets should count a snack twice');
  assert.ok(pets.score > petScore, 'feeding the pets should score');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.pets')).meals,
    pets.meals,
    'eating a snack should save progress immediately',
  );

  pets.meals += 5;
  for (const handler of windowTarget.listenersFor('pagehide')) handler({});
  assert.equal(
    JSON.parse(storage.get('sharkquarium.pets')).meals,
    pets.meals,
    'leaving the game should flush feeding progress',
  );

  await frames(12);
  pets.food.length = 0;
  canvasPointerDown(480, 260);
  await frames(2);
  canvasPointerUp();
  const playBubble = pets.food.find((item) => item.snack !== true);
  assert.ok(playBubble, 'left click should drop a play bubble');
  playBubble.x = feedingPet.x;
  playBubble.y = feedingPet.y;
  playBubble.baseX = feedingPet.x;
  const bubbleMeals = pets.meals;
  const bubbleScore = pets.score;
  await frames(2);
  assert.equal(pets.meals, bubbleMeals, 'bubbles should not count as snacks');
  assert.ok(pets.score > bubbleScore, 'pets should still eat bubbles for score');

  pets.pets.forEach((pet, index) => {
    pet.x = 80 + index * 12;
    pet.y = 500;
    pet.waypointX = pet.x;
    pet.waypointY = pet.y;
    pet.roamTimer = 999;
    pet.meal = null;
    pet.hunger = 0;
    pet.vx = 0;
    pet.vy = 0;
  });
  pets.food.length = 0;
  pets.lures.length = 0;
  pets.petEnemies.length = 0;
  await frames(12);
  canvasPointerDown(751, 484);
  await frames(2);
  canvasPointerUp();
  assert.ok(
    pets.food.some((item) => item.snack === true),
    'the snack button should drop a critter',
  );
  assert.ok(
    pets.food.every((item) => item.snack === true),
    'the snack button should replace the bubble drop',
  );
  assert.ok(
    Math.hypot(pets.food[0].x - 480, pets.food[0].y - 280) < 30,
    'button drops should land at the tank centre',
  );
  await frames(12);
  canvasPointerDown(887, 484);
  await frames(2);
  canvasPointerUp();
  assert.equal(pets.lures.length, 0, 'the lure button should be inert without enemies loose');
  pets.spawnPetEnemy();
  const buttonEnemy = pets.petEnemies[0];
  buttonEnemy.x = 120;
  buttonEnemy.y = 460;
  if (buttonEnemy.petKind === 'jelly') {
    buttonEnemy.baseY = 460;
    buttonEnemy.bob = 0;
    buttonEnemy.drift = 0;
  }
  await frames(12);
  canvasPointerDown(887, 484);
  await frames(2);
  canvasPointerUp();
  assert.equal(pets.lures.length, 1, 'the lure button should drop a lure with enemies loose');
  assert.equal(pets.petEnemies.length, 1, 'the button lure should not consume the enemy yet');
  pets.lures.length = 0;
  pets.petEnemies.length = 0;

  const trickPet = pets.pets[0];
  trickPet.x = 300;
  trickPet.y = 300;
  trickPet.waypointX = 300;
  trickPet.waypointY = 300;
  trickPet.roamTimer = 999;
  trickPet.trickCooldown = 0;
  trickPet.scared = 0;
  trickPet.sleepy = 0;
  trickPet.trick = null;
  pets.coinBubbles.length = 0;
  pets.toys.length = 0;
  pets.food.length = 0;
  pets.nextWave = pets.meals + 1000;
  pets.dropCooldown = 0;
  canvasPointerDown(300, 300);
  await frames(2);
  canvasPointerUp();
  assert.ok(trickPet.trick, 'clicking a pet should start a trick');
  assert.ok(trickPet.happy > 0, 'a trick should make the pet happy');
  assert.equal(pets.coinBubbles.length, 1, 'a trick should drop a coin bubble');
  await frames(60);
  assert.equal(trickPet.trick, null, 'the trick should end');

  storage.set('sharkquarium.coins', '100');
  const coinBubble = pets.coinBubbles[0];
  coinBubble.x = 400;
  coinBubble.y = 300;
  pets.dropCooldown = 0;
  canvasPointerDown(400, 300);
  await frames(2);
  canvasPointerUp();
  assert.equal(pets.coinBubbles.length, 0, 'clicking a coin bubble should collect it');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.coins')),
    105,
    'a coin bubble should pay sea coins',
  );

  const sleepyPet = pets.pets[1];
  sleepyPet.x = 200;
  sleepyPet.y = 200;
  sleepyPet.sleepy = 2;
  sleepyPet.trick = null;
  sleepyPet.trickCooldown = 0;
  sleepyPet.scared = 0;
  pets.dropCooldown = 0;
  canvasPointerDown(200, 200);
  await frames(2);
  canvasPointerUp();
  assert.equal(sleepyPet.sleepy, 0, 'clicking a sleepy pet should wake it');
  assert.equal(sleepyPet.trick, null, 'a waking pet should not do a trick');

  const tastePet = pets.pets[0];
  tastePet.hunger = 1;
  tastePet.sleepy = 0;
  tastePet.happy = 0;
  pets.food.length = 0;
  pets.petEnemies.length = 0;
  pets.lures.length = 0;
  pets.nextWave = pets.meals + 1000;
  pets.dropCooldown = 0;
  canvasPointerDownSecondary(480, 320);
  await frames(2);
  canvasPointerUp();
  const tasteSnack = pets.food.find((item) => item.kind !== undefined);
  assert.ok(tasteSnack, 'the taste test needs a critter');
  tasteSnack.kind = 'MINNOW';
  tastePet.x = 480;
  tastePet.y = 320;
  tastePet.waypointX = 480;
  tastePet.waypointY = 320;
  tastePet.meal = null;
  tasteSnack.x = 480;
  tasteSnack.y = 320;
  tasteSnack.hover = 320;
  await frames(2);
  assert.ok(tastePet.hunger < 0.01, 'a favorite critter should fill the pet completely');
  assert.ok(tastePet.happy > 0, 'a favorite critter should make the pet happy');

  pets.dropCooldown = 0;
  canvasPointerDown(726, 432);
  await frames(2);
  canvasPointerUp();
  assert.equal(pets.toys.length, 1, 'the toy button should drop a toy');
  const toy = pets.toys[0];
  toy.x = 400;
  toy.y = 300;
  toy.vx = 0;
  toy.vy = 0;
  toy.boop = 0;
  const toyPet = pets.pets[2];
  toyPet.x = 400;
  toyPet.y = 300;
  toyPet.waypointX = 400;
  toyPet.waypointY = 300;
  toyPet.playful = 0;
  await frames(2);
  assert.ok(toyPet.playful > 0, 'bumping a toy should make the pet playful');

  storage.set('sharkquarium.pets', JSON.stringify({ meals: pets.meals }));
  pets.dropCooldown = 0;
  canvasPointerDown(818, 432);
  await frames(2);
  canvasPointerUp();
  assert.equal(pets.postcards.length, 1, 'the photo button should save a postcard');
  assert.ok(pets.postcardTimer > 0, 'saving a postcard should show the card');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.pets')).postcards.length,
    1,
    'postcards should persist',
  );

  storage.set('sharkquarium.coins', '100');
  const mealsBeforePack = pets.meals;
  pets.dropCooldown = 0;
  canvasPointerDown(910, 432);
  await frames(2);
  canvasPointerUp();
  assert.equal(pets.meals, mealsBeforePack + 250, 'the meals button should add a meal pack');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.coins')),
    75,
    'a meal pack should cost sea coins',
  );

  const swarmPet = feedingPet;
  for (const pet of pets.pets) {
    if (pet === swarmPet) continue;
    pet.x = 80;
    pet.y = 90;
    pet.waypointX = 80;
    pet.waypointY = 90;
    pet.roamTimer = 999;
    pet.meal = null;
    pet.hunger = 0;
    pet.vx = 0;
    pet.vy = 0;
  }
  swarmPet.x = 200;
  swarmPet.y = 460;
  swarmPet.waypointX = 200;
  swarmPet.waypointY = 460;
  swarmPet.roamTimer = 999;
  swarmPet.meal = null;
  swarmPet.vx = 0;
  swarmPet.vy = 0;
  swarmPet.hunger = 1;
  swarmPet.sleepy = 0;
  swarmPet.trick = null;
  swarmPet.scared = 0;
  pets.petEnemies.length = 0;
  pets.nextWave = pets.meals + 1000;
  await frames(12);
  pets.food.length = 0;
  canvasPointerDownSecondary(480, 160);
  await frames(2);
  canvasPointerUp();
  const distantSnack = pets.food.find((item) => item.snack === true);
  assert.ok(distantSnack, 'the swarm test needs a critter to drop');
  assert.ok(
    Math.hypot(distantSnack.x - swarmPet.x, distantSnack.y - swarmPet.y) > 300,
    'the swarm snack should start far away',
  );
  const swarmMeals = pets.meals;
  await frames(300);
  assert.ok(pets.meals > swarmMeals, 'a hungry pet should swarm a distant snack');

  const firstPet = pets.pets[0];
  const secondPet = pets.pets[1];
  pets.pets.forEach((pet, index) => {
    if (index < 2) return;
    pet.x = 80;
    pet.y = 500;
    pet.waypointX = 80;
    pet.waypointY = 500;
    pet.roamTimer = 999;
    pet.meal = null;
    pet.hunger = 0;
    pet.vx = 0;
    pet.vy = 0;
  });
  firstPet.x = 300;
  firstPet.y = 300;
  firstPet.waypointX = 200;
  firstPet.waypointY = 300;
  firstPet.roamTimer = 999;
  firstPet.vx = 0;
  firstPet.vy = 0;
  firstPet.meal = null;
  firstPet.sleepy = 0;
  firstPet.trick = null;
  secondPet.x = 300;
  secondPet.y = 300;
  secondPet.waypointX = 400;
  secondPet.waypointY = 300;
  secondPet.roamTimer = 999;
  secondPet.vx = 0;
  secondPet.vy = 0;
  secondPet.meal = null;
  secondPet.sleepy = 0;
  secondPet.trick = null;
  pets.food.length = 0;
  pets.petEnemies.length = 0;
  await frames(90);
  assert.ok(
    Math.hypot(firstPet.x - secondPet.x, firstPet.y - secondPet.y) > 25,
    'pets should keep personal space instead of clumping',
  );

  pets.petEnemies.length = 0;
  pets.pets.forEach((pet) => {
    pet.x = 80;
    pet.y = 480 + (pet.kind.length % 3) * 14;
    pet.waypointX = pet.x;
    pet.waypointY = pet.y;
    pet.roamTimer = 999;
    pet.meal = null;
    pet.vx = 0;
    pet.vy = 0;
  });
  await frames(12);
  pets.nextWave = pets.meals + 1;
  canvasPointerDownSecondary(480, 340);
  await frames(2);
  canvasPointerUp();
  const waveSnack = pets.food.find((item) => item.snack === true);
  assert.ok(waveSnack, 'the wave test needs a snack to drop');
  waveSnack.x = feedingPet.x;
  waveSnack.y = feedingPet.y;
  waveSnack.hover = feedingPet.y;
  await frames(2);
  assert.equal(pets.petEnemies.length, 3, 'every 20 snacks should send three enemies');
  assert.equal(
    new Set(pets.petEnemies.map((enemy) => enemy.petKind)).size,
    3,
    'the wave should come from three different levels',
  );
  assert.ok(pets.waveTimer > 0, 'the wave should announce itself');

  pets.petEnemies.length = 0;
  pets.spawnPetEnemy('moray');
  const morayEnemy = pets.petEnemies[0];
  assert.equal(morayEnemy.petKind, 'moray', 'the moray should join the enemy waves');
  assert.equal(morayEnemy.constructor.name, 'Eel', 'the moray enemy should use the eel body');
  assert.equal(morayEnemy.state, 'hunting', 'the moray enemy should hunt, never hide');
  assert.ok(morayEnemy.petLife > 0, 'the moray enemy should despawn like other hunters');
  const morayPrey = pets.pets[0];
  morayPrey.x = 480;
  morayPrey.y = 270;
  morayPrey.waypointX = 480;
  morayPrey.waypointY = 270;
  morayPrey.roamTimer = 999;
  morayPrey.meal = null;
  morayPrey.vx = 0;
  morayPrey.vy = 0;
  morayPrey.sleepy = 0;
  morayPrey.trick = null;
  morayEnemy.x = morayPrey.x + 90;
  morayEnemy.y = morayPrey.y;
  await frames(4);
  assert.ok(morayPrey.scared > 0, 'pets should flee the moray enemy');
  assert.ok(morayEnemy.jawOpen > 0.2, 'the moray enemy should bare its teeth near pets');
  morayEnemy.biteCooldown = 0;
  morayEnemy.x = morayPrey.x + 15;
  morayEnemy.y = morayPrey.y;
  await frames(2);
  assert.ok(morayEnemy.biteTimer > 0, 'a moray bite on a pet should play the chomp');
  pets.petEnemies.length = 0;

  pets.petEnemies.length = 0;
  pets.spawnPetEnemy();
  const attacker = pets.petEnemies[0];
  feedingPet.x = 300;
  feedingPet.y = 300;
  feedingPet.waypointX = 300;
  feedingPet.waypointY = 300;
  feedingPet.roamTimer = 999;
  feedingPet.meal = null;
  feedingPet.vx = 0;
  feedingPet.vy = 0;
  if (attacker.petKind === 'jelly') {
    attacker.baseY = feedingPet.y;
    attacker.bob = 0;
    attacker.drift = 0;
  }
  attacker.x = feedingPet.x;
  attacker.y = feedingPet.y;
  attacker.biteCooldown = 0;
  pets.meals = 100;
  const drainedMeals = pets.meals;
  await frames(2);
  assert.ok(
    pets.meals < drainedMeals,
    `an enemy biting a pet should drain the snack tally (kind=${attacker.petKind} meals=${pets.meals} before=${drainedMeals} d=${Math.hypot(attacker.x - feedingPet.x, attacker.y - feedingPet.y).toFixed(1)} scared=${feedingPet.scared.toFixed(2)})`,
  );
  assert.equal(pets.pets.length, 11, 'pets should never be removed by an attack');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.pets')).meals,
    pets.meals,
    'the depletion should save immediately',
  );

  pets.petEnemies.length = 0;
  pets.spawnPetEnemy();
  const looseEnemy = pets.petEnemies[0];
  looseEnemy.petLife = 999;
  looseEnemy.x = 120;
  looseEnemy.y = 460;
  if (looseEnemy.petKind === 'jelly') {
    looseEnemy.baseY = 460;
    looseEnemy.bob = 0;
    looseEnemy.drift = 0;
  }
  await frames(12);
  pets.lures.length = 0;
  canvasPointerDownSecondary(480, 200);
  await frames(2);
  canvasPointerUp();
  assert.equal(
    pets.lures.length,
    1,
    `right click should drop a despawn lure while an enemy is loose (enemies=${pets.petEnemies.length}, food=${pets.food.length})`,
  );
  const lure = pets.lures[0];
  lure.x = looseEnemy.x + 20;
  lure.y = looseEnemy.y;
  await frames(8);
  assert.equal(pets.petEnemies.length, 0, 'an enemy that takes the lure should despawn');
  assert.equal(pets.lures.length, 0, 'the lure should be consumed by the despawn');

  pets.petEnemies.length = 0;
  pets.spawnPetEnemy('puffer');
  const bouncer = pets.petEnemies[0];
  assert.equal(bouncer.petKind, 'puffer', 'the bounce test needs a pufferfish');
  bouncer.state = 'fly';
  bouncer.x = 930;
  bouncer.y = 270;
  bouncer.vx = 300;
  bouncer.vy = 0;
  await frames(6);
  assert.ok(bouncer.vx < 0, 'pufferfish should bounce off the tank walls');
  assert.ok(bouncer.x <= 960 - bouncer.radius + 1, 'the puffer should stay inside the tank');
  assert.equal(bouncer.petLife, Infinity, 'pufferfish should not despawn on their own');
  await frames(30);
  assert.equal(pets.petEnemies.length, 1, 'the puffer should keep bouncing instead of leaving');
  pets.petEnemies.length = 0;

  const wallPet = pets.pets[3];
  pets.food.length = 0;
  pets.pets.forEach((pet, index) => {
    if (index === 3) return;
    pet.x = 200 + index * 40;
    pet.y = 430;
    pet.waypointX = pet.x;
    pet.waypointY = pet.y;
    pet.meal = null;
    pet.scared = 0;
    pet.hunger = 0;
  });
  wallPet.x = 930;
  wallPet.y = 270;
  wallPet.waypointX = 960;
  wallPet.waypointY = 270;
  wallPet.roamTimer = 999;
  wallPet.meal = null;
  wallPet.hunger = 0;
  wallPet.scared = 0;
  wallPet.sleepy = 0;
  wallPet.trick = null;
  wallPet.speed = 75;
  wallPet.vx = 0;
  wallPet.vy = 0;
  await frames(90);
  assert.ok(wallPet.x < 880, 'pets should turn away from the walls instead of ramming them');

  const savedMeals = pets.meals;
  await tapKey('Escape');
  await frames(2);
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'quitting should leave the pets tank');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.pets')).meals,
    savedMeals,
    'leaving the pets tank should save feeding progress',
  );
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  const petsAgain = game.scene;
  assert.equal(petsAgain.petsTank, true, 'the pets tank should reopen');
  assert.equal(petsAgain.meals, savedMeals, 're-entering should restore feeding progress');

  petsAgain.meals = 10000;
  await frames(3);
  assert.equal(game.currentSceneName, 'dawn', 'the feeding goal should reach the dawn cutscene');
  assert.equal(game.scene.goal, 10000, 'the pets cutscene should celebrate its goal');
  assert.ok(
    game.scene.line && game.scene.line.startsWith('YOU FED THE PETS'),
    'the pets cutscene should celebrate the feeding',
  );
  await frames(100);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'the pets cutscene should return to the menu');

  storage.set('sharkquarium.pets', JSON.stringify({ meals: 0 }));
  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'apocalyptic' }));
  game.changeScene('play', { tank: 'pets' });
  await frames(5);
  const hardPets = game.scene;
  assert.equal(hardPets.petsTank, true, 'the pets tank should reopen for the difficulty check');
  assert.ok(
    hardPets.pets[0].drainScale > 2,
    'apocalyptic should make pets get hungry faster',
  );
  hardPets.petEnemies.length = 0;
  hardPets.spawnPetEnemy();
  const hardAttacker = hardPets.petEnemies[0];
  if (hardAttacker.petKind === 'jelly') {
    hardAttacker.baseY = hardPets.pets[0].y;
    hardAttacker.bob = 0;
    hardAttacker.drift = 0;
  }
  hardAttacker.x = hardPets.pets[0].x;
  hardAttacker.y = hardPets.pets[0].y;
  hardAttacker.biteCooldown = 0;
  hardPets.meals = 100;
  await frames(2);
  assert.equal(hardPets.meals, 85, 'apocalyptic should triple the bite loss');
  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal' }));
  game.changeScene('menu');
  await frames(5);

  game.changeScene('tanks');
  await frames(5);
  assert.ok(
    game.scene.menu.items.some((item) => item.label === 'PETS TANK'),
    'the tank select should list the pets tank with playpass 3',
  );
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'escape should leave the tank select');

  game.changeScene('menu');
  await frames(5);
  for (let i = 0; i < 5; i += 1) await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 5, 'the endless dive entry should be selectable');
  await tapKey('Enter');
  await frames(5);
  const endless = game.scene;
  assert.equal(endless.endless, true, 'the endless dive should start');
  assert.equal(endless.lives, 3, 'the endless dive should start with three lives');
  assert.equal(endless.hudState().endless, true, 'the hud should know the dive is endless');
  assert.equal(endless.hudState().lives, 3, 'the hud should show the lives');
  endless.timeLeft = 0.05;
  await frames(10);
  assert.equal(game.currentSceneName, 'play', 'the endless dive should not time out');
  assert.equal(endless.timeLeft, 0.05, 'the endless clock should never tick');
  endless.score = 60;
  await frames(2);
  assert.equal(game.currentSceneName, 'descent', 'endless runs should still teleport through tanks');
  await skipDescent();
  const endlessRay = game.scene;
  assert.equal(endlessRay.stingrayTank, true, 'the endless dive should reach the stingray tank');
  assert.equal(endlessRay.endless, true, 'the endless flag should carry between tanks');
  assert.equal(endlessRay.lives, 3, 'lives should carry between tanks');
  endlessRay.bite(endlessRay.player, 10, 0, 5, 0, 0.01, ['#ffffff'], { freq: 1, duration: 0.01, volume: 0.01 });
  assert.equal(endlessRay.lives, 2, 'a hit should cost an endless life');
  endlessRay.player.invulnerable = 0;
  endlessRay.bite(endlessRay.player, 10, 0, 5, 0, 0.01, ['#ffffff'], { freq: 1, duration: 0.01, volume: 0.01 });
  endlessRay.player.invulnerable = 0;
  endlessRay.bite(endlessRay.player, 10, 0, 5, 0, 0.01, ['#ffffff'], { freq: 1, duration: 0.01, volume: 0.01 });
  await frames(3);
  assert.equal(game.currentSceneName, 'gameover', 'three hits should end the endless run');
  assert.equal(game.scene.endless, true, 'the results should show the out-of-lives panel');
  await frames(40);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'play', 'play again should keep the endless mode');
  assert.equal(game.scene.endless, true, 'play again should restart an endless dive');
  assert.equal(game.scene.lives, 3, 'play again should restore the lives');
  await tapKey('Escape');
  await frames(2);
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'quitting should leave the endless dive');

  storage.set('sharkquarium.aquarium', JSON.stringify({ items: [] }));
  game.changeScene('menu');
  await frames(5);
  for (let i = 0; i < 6; i += 1) await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 6, 'the aquarium builder entry should be selectable');
  await tapKey('Enter');
  await frames(5);
  const aquarium = game.scene;
  assert.equal(game.currentSceneName, 'aquarium', 'the menu should open the aquarium builder');
  assert.deepEqual(
    aquarium.menu.items.map((item) => item.label),
    [
      'DIVE AS: SHARK',
      'CHILL MODE: OFF',
      'ITEM',
      'UNDO',
      'CLEAR ALL',
      'LABYRINTH MODE: OFF',
      'BACK',
    ],
    'the builder should list its controls',
  );
  assert.equal(aquarium.itemKind, 'CORAL', 'the builder should start on coral');
  assert.equal(aquarium.chill, false, 'the builder should start unchilled');
  await tapKey('ArrowRight');
  assert.equal(aquarium.diveLabel, 'STINGRAY', 'left/right should browse the dive characters');
  assert.equal(aquarium.menu.items[0].label, 'DIVE AS: STINGRAY', 'the dive row should follow the pick');
  await tapKey('ArrowLeft');
  assert.equal(aquarium.diveLabel, 'SHARK', 'the dive characters should cycle back');
  await tapKey('ArrowDown');
  assert.equal(aquarium.menu.selected.action, 'chill', 'the chill toggle should be reachable');
  await tapKey('Enter');
  await frames(2);
  assert.equal(aquarium.chill, true, 'chill mode should turn on');
  assert.equal(aquarium.menu.items[1].label, 'CHILL MODE: ON', 'the chill row should show the state');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.aquarium')).chill,
    true,
    'chill mode should persist',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(aquarium.chill, false, 'chill mode should turn back off');
  await tapKey('ArrowDown');
  assert.equal(aquarium.menu.selected.action, 'item', 'the item row should be reachable');
  canvasPointerDown(360, 420);
  await frames(2);
  canvasPointerUp();
  assert.equal(aquarium.items.length, 1, 'clicking the tank should place the current item');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.aquarium')).items.length,
    1,
    'placements should save immediately',
  );
  await tapKey('ArrowRight');
  assert.equal(aquarium.itemKind, 'ROCK', 'left/right should browse the item palette');
  canvasPointerDown(560, 420);
  await frames(2);
  canvasPointerUp();
  assert.equal(aquarium.items.length, 2, 'a second item should be placeable');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(2);
  assert.equal(aquarium.items.length, 1, 'undo should remove the last item');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(2);
  assert.equal(aquarium.items.length, 0, 'clear all should empty the aquarium');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.aquarium')).items.length,
    0,
    'clearing should persist',
  );
  await tapKey('ArrowDown');
  assert.equal(
    aquarium.menu.selected.action,
    'labyrinth',
    'the labyrinth row should sit under clear all',
  );
  await tapKey('Enter');
  await frames(2);
  assert.equal(aquarium.labyrinthOn, true, 'the labyrinth mode should turn on');
  assert.ok(aquarium.labyrinth, 'labyrinth mode should build a wreck course');
  assert.ok(aquarium.labyrinth.walls.length >= 6, 'the course should raise gates and stubs');
  assert.ok(aquarium.labyrinth.supports.length >= 1, 'the course should brace itself with supports');
  assert.equal(aquarium.menu.items[5].label, 'LABYRINTH MODE: ON', 'the row should show the state');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.aquarium')).labyrinth.on,
    true,
    'the labyrinth mode should persist',
  );
  assert.equal(aquarium.palette().length, 31, 'wreck pieces should join the palette with the mode');
  const savedItemIndex = aquarium.itemIndex;
  const crackIndex = aquarium.palette().findIndex((entry) => entry.key === 'LAB:CRACK');
  aquarium.itemIndex = crackIndex;
  assert.equal(aquarium.itemLabel, 'TENTACLE CRACK', 'the palette should offer tentacle bursters');
  canvasPointerDown(700, 460);
  await frames(2);
  canvasPointerUp();
  assert.ok(
    aquarium.items.some((item) => item.entry.kind === 'LAB:CRACK'),
    'the tentacle crack should place in the tank',
  );
  aquarium.itemIndex = aquarium.palette().findIndex((entry) => entry.key === 'LAB:WALL');
  canvasPointerDown(420, 250);
  await frames(2);
  canvasPointerUp();
  assert.ok(
    aquarium.items.some((item) => item.entry.kind === 'LAB:WALL'),
    'the wreck wall should place in the tank',
  );
  aquarium.itemIndex = aquarium.palette().findIndex((entry) => entry.key === 'LAB:BEAM');
  assert.equal(aquarium.itemLabel, 'TENTACLE BEAM', 'the palette should offer ceiling bursters');
  canvasPointerDown(860, 130);
  await frames(2);
  canvasPointerUp();
  assert.ok(
    aquarium.items.some((item) => item.entry.kind === 'LAB:BEAM'),
    'the tentacle beam should place in the tank',
  );
  aquarium.startDive();
  await frames(3);
  assert.equal(aquarium.phase, 'dive', 'the hand-built labyrinth should be divable');
  const burster = aquarium.items.find((item) => item.entry.kind === 'LAB:CRACK').entity;
  burster.timer = 0;
  aquarium.divePlayer.x = burster.x;
  aquarium.divePlayer.y = burster.y - 90;
  aquarium.divePlayer.vx = 0;
  aquarium.divePlayer.vy = 0;
  await frames(70);
  assert.ok(
    burster.arms.every((arm) => arm.reach > 0.2),
    'the placed crack should burst its whole tentacle ripple',
  );
  assert.ok(aquarium.breachChunks.length > 0, 'the burster should fling breach chunks');
  const bursterGrip = burster.arms[0].pointAt(0.1);
  aquarium.divePlayer.x = bursterGrip.x;
  aquarium.divePlayer.y = bursterGrip.y;
  aquarium.divePlayer.invulnerable = 0;
  await frames(30);
  assert.ok(aquarium.divePlayer.invulnerable > 0, 'a burster should knock the diver back');

  const beam = aquarium.items.find((item) => item.entry.kind === 'LAB:BEAM').entity;
  assert.equal(beam.arms[0].club, true, 'the ceiling beam should wear the squid feeding club');
  assert.equal(beam.arms[0].rope, true, 'the ceiling beam should be a thin squid rope');
  beam.state = 'idle';
  beam.timer = 0;
  for (const arm of beam.arms) {
    arm.burstTimer = 0;
    arm.burstDelay = 0;
    arm.reach = 0;
  }
  aquarium.divePlayer.x = beam.x;
  aquarium.divePlayer.y = 430;
  aquarium.divePlayer.vx = 0;
  aquarium.divePlayer.vy = 0;
  await frames(8);
  assert.equal(beam.state, 'warn', 'the ceiling beam should still warn from the tank floor');
  while (beam.state === 'warn') await frames(1);
  await frames(8);
  assert.ok(beam.arms[0].reach > 0.9, 'the ceiling beam should thrust straight at the diver');
  const beamDistance = Math.hypot(
    aquarium.divePlayer.x - beam.x,
    aquarium.divePlayer.y - beam.y,
  );
  assert.ok(
    Math.abs(beam.arms[0].stretch - Math.min(beamDistance, 401)) < 40 &&
      beam.arms[0].stretch > 300,
    'the ceiling beam should stretch toward the diver at the tank floor',
  );
  await frames(20);
  assert.equal(beam.arms[0].curlGrow, 0, 'the beam lance should hold rigid before hooking');
  await frames(60);
  assert.ok(beam.arms[0].curlGrow > 0.2, 'the ceiling beam should hook at the bottom');
  await tapKey('Escape');
  await frames(3);
  assert.equal(aquarium.phase, 'build', 'escaping the hand-built labyrinth should surface');
  aquarium.itemIndex = savedItemIndex;
  await tapKey('Enter');
  await frames(2);
  assert.equal(aquarium.labyrinthOn, false, 'the labyrinth mode should turn back off');
  assert.equal(aquarium.labyrinth, null, 'turning it off should clear the course');
  assert.equal(aquarium.palette().length, 22, 'the wreck pieces should leave with the mode');
  await tapKey('ArrowUp');
  assert.equal(aquarium.menu.selected.action, 'clear', 'clear all should sit above the maze row');
  await tapKey('Enter');
  await frames(2);
  assert.equal(aquarium.items.length, 0, 'clearing after the maze test should empty the tank');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  assert.equal(aquarium.menu.selected.action, 'item', 'the item row should stay reachable');
  const paletteSize = 22;
  for (let i = 0; i < paletteSize; i += 1) {
    await clickAt(340 + ((i * 53) % 540), 140 + ((i * 47) % 330));
    if (i < paletteSize - 1) await tapKey('ArrowRight');
  }
  assert.equal(aquarium.items.length, paletteSize, 'every palette entry should be placeable');
  assert.equal(
    new Set(aquarium.items.map((item) => item.entry.kind)).size,
    paletteSize,
    'the sweep should cover the whole palette',
  );
  assert.equal(aquarium.pets.length, 8, 'all eight pets should join the pets group');
  assert.equal(aquarium.enemyEntities.length, 7, 'all seven enemies should join the enemy group');
  const moray = aquarium.items.find((item) => item.entry.kind === 'ENEMY:moray');
  assert.equal(moray.entity.constructor.name, 'Eel', 'the moray should use the stingray-tank eel');
  assert.equal(moray.entity.state, 'hunting', 'the aquarium moray should roam free, not hide');
  assert.equal(aquarium.itemKind, 'CORAL', 'the palette should wrap during the sweep');
  await tapKey('ArrowLeft');
  assert.equal(aquarium.itemKind, 'LEDGES', 'left should browse backwards from the wrap');
  await tapKey('ArrowLeft');
  assert.equal(aquarium.itemKind, 'ARCHWAY', 'the palette should offer the eel archway');
  const habitatCount = aquarium.items.length;
  await clickAt(420, 300);
  await clickAt(560, 340);
  assert.equal(aquarium.items.length, habitatCount, 'habitats should only be placed once');
  assert.match(String(aquarium.status), /ALREADY PLACED/, 'a repeat habitat should be refused');
  await tapKey('ArrowRight');
  assert.equal(aquarium.itemKind, 'LEDGES', 'the palette should offer the angler ledges');
  await tapKey('ArrowRight');
  assert.equal(aquarium.itemKind, 'CORAL', 'the palette should wrap back to coral');
  const beforeBatch = aquarium.items.length;
  for (let i = 0; i < 40; i += 1) {
    await clickAt(320 + ((i * 37) % 560), 150 + ((i * 53) % 260));
  }
  assert.equal(aquarium.items.length, beforeBatch + 40, 'the builder should not cap placements');
  assert.ok(aquarium.items.length > 40, 'the aquarium should hold more than the old limit');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  assert.equal(aquarium.menu.selected.action, 'dive', 'the dive row should be selectable');
  for (let i = 0; i < 6; i += 1) await tapKey('ArrowRight');
  assert.equal(aquarium.diveLabel, 'NAUTILUS', 'the dive picker should reach the nautilus');
  await tapKey('Enter');
  await frames(3);
  assert.equal(aquarium.phase, 'dive', 'the builder should enter dive mode');
  assert.ok(aquarium.divePlayer, 'diving should spawn the chosen character');
  assert.equal(
    aquarium.divePlayer.constructor.name,
    'Nautilus',
    'the dive should use the picked creature',
  );
  for (const enemy of aquarium.enemyEntities) {
    enemy.x = 60;
    enemy.y = 60;
    enemy.baseY = 60;
    enemy.perchX = 60;
    enemy.perchY = 60;
  }
  const diveStartY = aquarium.divePlayer.y;
  pressKey('ArrowUp');
  await frames(12);
  releaseKey('ArrowUp');
  assert.ok(aquarium.divePlayer.y < diveStartY, 'the aquarium nautilus should swim upward');
  const diveUpY = aquarium.divePlayer.y;
  pressKey('ArrowDown');
  await frames(12);
  releaseKey('ArrowDown');
  assert.ok(aquarium.divePlayer.y > diveUpY, 'the aquarium nautilus should swim back down');
  const itemsWhileDiving = aquarium.items.length;
  await clickAt(400, 300);
  assert.equal(aquarium.items.length, itemsWhileDiving, 'clicks should not place items while diving');
  const resident = aquarium.enemyEntities[0];
  aquarium.divePlayer.x = resident.x;
  aquarium.divePlayer.y = resident.y;
  aquarium.divePlayer.invulnerable = 0;
  await frames(3);
  assert.ok(aquarium.divePlayer.invulnerable > 0, 'bumping a resident should knock the diver back');
  const morayOnBump = aquarium.items.find((item) => item.entry.kind === 'ENEMY:moray').entity;
  for (const enemy of aquarium.enemyEntities) {
    if (enemy !== morayOnBump) {
      enemy.x = 900;
      enemy.y = 500;
      enemy.baseY = 500;
      enemy.perchX = 900;
      enemy.perchY = 500;
    }
  }
  morayOnBump.x = aquarium.divePlayer.x;
  morayOnBump.y = aquarium.divePlayer.y;
  aquarium.divePlayer.invulnerable = 0;
  await frames(2);
  assert.ok(morayOnBump.biteTimer > 0, 'a moray bump should trigger its bite animation');
  assert.ok(aquarium.divePlayer.invulnerable > 0, 'a moray bump should knock the diver back');
  await tapKey('Escape');
  await frames(3);
  assert.equal(aquarium.phase, 'build', 'escape should surface back to the workshop');
  assert.equal(game.currentSceneName, 'aquarium', 'surfacing should stay in the builder');
  assert.equal(aquarium.divePlayer, null, 'surfacing should dismiss the diver');
  await tapKey('ArrowDown');
  assert.equal(aquarium.menu.selected.action, 'chill', 'the chill row should be reachable after surfacing');
  await tapKey('Enter');
  await frames(2);
  assert.equal(aquarium.chill, true, 'chill mode should turn on from the workshop');
  await tapKey('ArrowUp');
  assert.equal(aquarium.menu.selected.action, 'dive', 'the dive row should sit above chill');
  await tapKey('Enter');
  await frames(3);
  assert.equal(aquarium.phase, 'dive', 'chill mode should not block diving');
  const chillResident = aquarium.enemyEntities[0];
  aquarium.divePlayer.x = chillResident.x;
  aquarium.divePlayer.y = chillResident.y;
  aquarium.divePlayer.invulnerable = 0;
  await frames(4);
  assert.equal(aquarium.divePlayer.invulnerable, 0, 'chill residents should never bump the diver');
  const morayResident = aquarium.items.find((item) => item.entry.kind === 'ENEMY:moray').entity;
  for (let i = 0; i < 30; i += 1) {
    morayResident.x = aquarium.divePlayer.x + 60;
    morayResident.y = aquarium.divePlayer.y;
    morayResident.update(1 / 60, [], 1, [aquarium.divePlayer]);
  }
  assert.ok(morayResident.jawOpen > 0.5, 'a moray should bare its teeth when the diver is close');
  morayResident.bite();
  for (let i = 0; i < 4; i += 1) {
    morayResident.x = aquarium.divePlayer.x + 60;
    morayResident.y = aquarium.divePlayer.y;
    morayResident.update(1 / 60, [], 1, [aquarium.divePlayer]);
  }
  assert.ok(morayResident.jawOpen > 1, 'a moray bite should flare wider than the warning gape');
  for (let i = 0; i < 20; i += 1) {
    morayResident.x = aquarium.divePlayer.x + 60;
    morayResident.y = aquarium.divePlayer.y;
    morayResident.update(1 / 60, [], 1, [aquarium.divePlayer]);
  }
  assert.ok(morayResident.jawOpen < 0.3, 'a moray bite should clamp its jaw shut');
  const farDiver = { x: morayResident.x + 500, y: morayResident.y };
  for (let i = 0; i < 60; i += 1) {
    morayResident.update(1 / 60, [], 1, [farDiver]);
  }
  assert.ok(morayResident.jawOpen < 0.2, 'a moray should close its mouth when the diver leaves');
  await tapKey('Escape');
  await frames(3);
  assert.equal(aquarium.phase, 'build', 'escape should surface from the chill dive');
  await tapKey('ArrowUp');
  assert.equal(aquarium.menu.selected.action, 'back', 'the back row should be reachable');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'the back row should leave the aquarium builder');
  storage.set(
    'sharkquarium.aquarium',
    JSON.stringify({
      items: [
        { kind: 'PET:stingray', x: 200, y: 180 },
        { kind: 'ENEMY:jelly', x: 300, y: 220 },
      ],
    }),
  );
  game.changeScene('aquarium');
  await frames(5);
  assert.equal(game.scene.items.length, 2, 'the saved layout should reload');
  assert.equal(game.scene.items[0].entry.kind, 'PET:stingray', 'the saved items should keep their kinds');
  assert.equal(game.scene.pets.length, 1, 'the saved pets should reload');
  assert.equal(game.scene.enemyEntities.length, 1, 'the saved enemies should reload');
  assert.equal(game.scene.chill, false, 'a missing chill flag should default to off');
  await tapKey('Escape');
  await frames(5);

  storage.set(
    'sharkquarium.aquarium',
    JSON.stringify({ items: [], labyrinth: { on: true, seed: 7 } }),
  );
  game.changeScene('aquarium');
  await frames(5);
  const mazeTank = game.scene;
  assert.equal(mazeTank.labyrinthOn, true, 'a saved labyrinth mode should reload');
  assert.ok(mazeTank.labyrinth.walls.length >= 6, 'the saved maze should rebuild its course');
  assert.equal(mazeTank.menu.items[5].label, 'LABYRINTH MODE: ON', 'the reloaded row should follow');
  await tapKey('Enter');
  await frames(3);
  assert.equal(mazeTank.phase, 'dive', 'the maze tank should be divable');
  const hanging = mazeTank.labyrinth.walls
    .filter((wall) => wall.y <= 0)
    .sort((a, b) => b.w - a.w)[0];
  const mazeDiver = mazeTank.divePlayer;
  mazeDiver.x = hanging.x + hanging.w / 2;
  mazeDiver.y = hanging.y + hanging.h + 60;
  mazeDiver.vx = 0;
  mazeDiver.vy = 0;
  pressKey('ArrowUp');
  await frames(40);
  releaseKey('ArrowUp');
  assert.ok(
    mazeDiver.y > hanging.y + hanging.h,
    'maze walls should block the diver from passing',
  );
  await tapKey('Escape');
  await frames(3);
  assert.equal(mazeTank.phase, 'build', 'escape should surface from the maze dive');
  await tapKey('Escape');
  await frames(5);

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal' }));
  game.changeScene('mutators', { from: 'tanks' });
  await frames(5);
  assert.equal(game.currentSceneName, 'mutators', 'the mutator screen should open');
  assert.equal(game.scene.menu.items[0].label, 'MUTATOR: OFF', 'the mutator list should start on OFF');
  const oneHitIndex = game.scene.menu.items.findIndex((item) => item.key === 'onehit');
  game.scene.menu.setIndex(oneHitIndex);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'picking a mutator should return to the caller');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.settings')).mutator,
    'onehit',
    'the chosen mutator should persist to settings',
  );

  game.changeScene('tag', { solo: true, mutator: 'fast' });
  await frames(5);
  assert.equal(game.scene.mutator.key, 'fast', 'the run should adopt the mutator');
  assert.equal(
    game.scene.rules.enemySpeed,
    game.scene._baseRules.enemySpeed * 1.6,
    'FAST should scale enemy speed',
  );

  storage.set('sharkquarium.records', JSON.stringify({}));
  game.changeScene('roundup');
  await frames(5);
  game.scene.finish(true);
  await frames(3);
  const roundupRecord = JSON.parse(storage.get('sharkquarium.records')).roundup;
  assert.ok(roundupRecord && roundupRecord.cleared, 'a win should bank a record for the mode');

  game.changeScene('records');
  await frames(5);
  assert.equal(game.currentSceneName, 'records', 'the records board should open');
  assert.equal(game.scene.group.title, 'THE TANKS', 'the board should start on the tank group');

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal' }));
  game.changeScene('bossrush');
  await frames(5);
  assert.equal(game.currentSceneName, 'bossrush', 'the boss rush should open');
  assert.equal(game.scene.roster.length, 5, 'the rush should line up five bosses');
  for (let wave = 0; wave < 5; wave += 1) {
    let guard = 0;
    while (game.scene.phase !== 'play' && guard < 400) {
      await frames(2);
      guard += 2;
    }
    assert.equal(game.scene.phase, 'play', `wave ${wave + 1} should start`);
    game.scene.current.finish(true);
    await frames(3);
  }
  assert.equal(game.scene.phase, 'results', 'clearing every wave should end the rush');
  assert.equal(game.scene.won, true, 'a full clear should win the rush');
  const rushRecord = JSON.parse(storage.get('sharkquarium.records')).bossrush;
  assert.ok(rushRecord && rushRecord.cleared, 'the rush should bank its own record');

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal' }));
  game.changeScene('playtoy');
  await frames(5);
  assert.equal(game.currentSceneName, 'playtoy', 'the playtoy tank should open');
  const playtoy = game.scene;
  assert.ok(playtoy.worldLength > 0, 'the wreck should build a world');
  assert.equal(playtoy.notes.length, 8, 'eight PlayToy notes should be scattered');
  assert.ok(playtoy.toys.length >= 6, 'living toys should fill the holds');
  assert.ok(playtoy.anchors.length >= 4, 'anchor rings should hang in the holds');

  playtoy.anchorIndex = 0;
  playtoy.cycleAnchor();
  assert.equal(playtoy.anchorIndex, 1, 'E should swap the anchor head');

  game.input.pointer.x = 0;
  game.input.pointer.y = 0;
  playtoy.players[0].heading = 0;
  playtoy.tether.state = 'idle';
  playtoy.tether.cooldown = 0;
  playtoy.fireTether();
  assert.equal(playtoy.tether.state, 'flying', 'firing the anchor-pack should launch the head');
  await frames(40);
  assert.ok(
    ['idle', 'returning', 'haul', 'pullSelf'].includes(playtoy.tether.state),
    'the fired head should resolve',
  );

  const ptNote = playtoy.notes[0];
  playtoy.players[0].x = ptNote.x;
  playtoy.players[0].y = ptNote.y;
  await frames(3);
  assert.equal(playtoy.notesCollected, 1, 'touching a note should collect it');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.playtoy')).notes.length,
    1,
    'collected note papers should persist to storage',
  );
  playtoy.toggleInventory();
  assert.equal(playtoy.inventoryOpen, true, 'the inventory should open');
  assert.ok(playtoy.collectedNotes.has(ptNote.index), 'the collected paper should be readable');
  playtoy.inventoryIndex = ptNote.index;
  await frames(2);
  playtoy.toggleInventory();
  assert.equal(playtoy.inventoryOpen, false, 'the inventory should close');

  if (playtoy.gates.length > 0) {
    const gate = playtoy.gates[0];
    const keyToIndex = { main: 0, electric: 1, pressure: 2 };
    const wrongKey = gate.type.anchor === 'main' ? 'electric' : 'main';
    playtoy.anchorIndex = keyToIndex[wrongKey];
    playtoy.tether.state = 'idle';
    playtoy.attachTether({ kind: 'gate', target: gate, x: gate.cx, y: gate.cy, radius: gate.w / 2 });
    assert.equal(gate.open, false, 'the wrong anchor head should not open a gate');
    playtoy.anchorIndex = keyToIndex[gate.type.anchor] ?? 0;
    playtoy.attachTether({ kind: 'gate', target: gate, x: gate.cx, y: gate.cy, radius: gate.w / 2 });
    assert.ok(gate.open, 'the matching anchor head should open the gate');
    playtoy.tether.state = 'idle';
  }

  playtoy.tether.state = 'idle';
  playtoy.attachTether({ kind: 'wall', x: 0, y: 0, radius: 0 });
  assert.equal(playtoy.tether.state, 'returning', 'the anchor should bounce off a hull wall, not grapple');

  playtoy.players[0].x = playtoy.worldLength;
  await frames(3);
  assert.equal(playtoy.phase, 'results', 'reaching the surface hatch should win');
  assert.equal(playtoy.won, true, 'the playtoy run should be a win');

  game.setFirstPerson(true);
  game.changeScene('playtoy');
  await frames(5);
  assert.equal(game.currentSceneName, 'playtoy', 'the playtoy tank should run in first person');
  assert.equal(game.scene.firstPersonActor(), game.scene.players[0], 'first person should follow the diver');
  game.setFirstPerson(false);
  await frames(2);

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal', christmas: true }));
  game.changeScene('settings');
  await frames(3);
  game.music.stop();
  game.changeScene('menu');
  await frames(40);
  assert.equal(
    game.music.track.name,
    'jinglebells',
    'christmas mode should swap the menu theme for Jingle Bells',
  );
  assert.ok(
    game.scene.bubbles.some((ambient) => typeof ambient.fall === 'number'),
    'christmas mode should sink slow snowflakes instead of bubbles',
  );
  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal', christmas: false }));
  game.changeScene('settings');
  await frames(3);
  game.music.stop();
  game.changeScene('menu');
  await frames(5);
  assert.equal(game.music.track.name, 'menu', 'leaving christmas mode should restore the menu theme');

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal', christmas: true }));
  game.changeScene('settings');
  await frames(3);
  game.music.stop();
  game.changeScene('play');
  await frames(5);
  assert.equal(
    game.music.track.name,
    'deckthehalls',
    'christmas mode should give the reef level a carol',
  );
  assert.equal(
    game.music.track.title,
    'DECK THE HALLS',
    'the now-playing title should name the carol',
  );
  game.changeScene('play', { tank: 'deepsea' });
  await frames(5);
  assert.equal(
    game.music.track.name,
    'silentnight',
    'a second level should get its own carol in christmas mode',
  );

  game.changeScene('abyss');
  await frames(5);
  assert.equal(game.scene.leviathan.santa, true, 'christmas enemies should wear santa hats');
  assert.ok(!game.scene.players[0].santa, 'the diver should not wear the enemy santa hat');
  game.changeScene('reefqueen');
  await frames(5);
  assert.equal(game.scene.queen.santa, true, 'bosses should wear santa hats in christmas mode');

  game.changeScene('play', { tank: 'stingray' });
  await frames(5);
  const morayEel = game.scene.eels[0];
  assert.ok(morayEel, 'the stingray tank should place morays');
  assert.equal(
    typeof morayEel.santaHat,
    'function',
    'morays should own a santaHat hook so the hat follows the head into the hole',
  );
  morayEel.state = 'hidden';
  morayEel.santaHat(game.context);
  morayEel.state = 'entering';
  morayEel.santaHat(game.context);

  for (const key of ['santahat', 'reindeer', 'carrot']) {
    storage.set('sharkquarium.shop', JSON.stringify({ head: key, companion: 'snowfish' }));
    game.changeScene('menu');
    await frames(3);
    assert.equal(game.scene.head.key, key, `the ${key} christmas cosmetic should exist`);
    assert.equal(game.scene.companion.key, 'snowfish', 'the snowfish dive buddy should exist');
  }

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal', christmas: false }));
  game.changeScene('settings');
  await frames(3);
  game.music.stop();
  game.changeScene('menu');
  await frames(5);
  assert.equal(game.music.track.name, 'menu', 'the menu should hold the normal theme');
  game.changeScene('settings');
  await frames(3);
  const christmasIdx = game.scene.menu.items.findIndex((item) => item.action === 'christmas');
  game.scene.menu.setIndex(christmasIdx);
  await tapKey('Enter');
  await frames(3);
  assert.equal(game.scene.settings.christmas, true, 'the switch should enable christmas mode');
  assert.equal(
    game.music.track.name,
    'jinglebells',
    'toggling christmas on should immediately swap the playing track without visiting the track player',
  );
  await tapKey('Enter');
  await frames(3);
  assert.equal(game.scene.settings.christmas, false, 'the switch should disable christmas mode');
  assert.equal(
    game.music.track.name,
    'menu',
    'toggling christmas off should restore the held theme',
  );

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal', christmas: true }));
  game.changeScene('settings');
  await frames(3);
  game.music.stop();
  game.changeScene('menu');
  await frames(5);
  game.changeScene('christmastrail');
  await frames(5);
  await frames(50);
  await tapKey('Enter');
  await frames(5);
  game.changeScene('settings');
  await frames(3);
  const christmasAgain = game.scene.menu.items.findIndex((item) => item.action === 'christmas');
  game.scene.menu.setIndex(christmasAgain);
  await tapKey('Enter');
  await frames(3);
  assert.equal(game.scene.settings.christmas, false, 'the switch should disable christmas mode again');
  assert.equal(
    game.music.track.name,
    'menu',
    'turning christmas off after a seasonal scene must restore the normal menu music',
  );

  game.changeScene('theatre');
  await frames(5);
  const merryIdx = game.scene.menu.items.findIndex((item) => item.label === 'MERRY CHRISTMAS');
  assert.ok(merryIdx >= 0, 'the theatre should offer the christmas trailer');
  game.scene.menu.setIndex(merryIdx);
  await tapKey('Enter');
  await frames(5);
  assert.equal(
    game.currentSceneName,
    'christmastrail',
    'the christmas trailer should play from the theatre',
  );
  await frames(50);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'theatre', 'the christmas trailer should return to the theatre');

  for (const [season, menuSong, menuTitle, head, companion, trailer] of [
    ['halloween', 'haunteddrift', 'HAUNTED DRIFT', 'witchhat', 'ghostfish', 'HAPPY HALLOWEEN'],
    ['newyear', 'auldlangsyne', 'AULD LANG SYNE', 'nyglasses', 'fireworkfish', 'HAPPY NEW YEAR'],
  ]) {
    storage.set(
      'sharkquarium.settings',
      JSON.stringify({ difficulty: 'normal', season }),
    );
    game.changeScene('settings');
    await frames(3);
    assert.equal(game.scene.settings.season, season, `${season} should apply from settings`);
    game.music.stop();
    game.changeScene('menu');
    await frames(5);
    assert.equal(game.music.track.name, menuSong, `${season} should give the menu its theme`);
    assert.equal(game.music.track.title, menuTitle, `${season} should name the playing song`);

    game.changeScene('abyss');
    await frames(5);
    assert.equal(game.scene.leviathan.santa, true, `${season} enemies should wear seasonal hats`);

    for (const key of [head, 'pumpkin', 'carrot']) {
      storage.set('sharkquarium.shop', JSON.stringify({ head: key, companion }));
      game.changeScene('menu');
      await frames(3);
      assert.equal(game.scene.head.key, key, `the ${key} cosmetic should exist`);
      assert.equal(game.scene.companion.key, companion, `the ${companion} buddy should exist`);
    }

    game.changeScene('theatre');
    await frames(5);
    const idx = game.scene.menu.items.findIndex((item) => item.label === trailer);
    assert.ok(idx >= 0, `the theatre should offer ${trailer}`);
    game.scene.menu.setIndex(idx);
    await tapKey('Enter');
    await frames(5);
    assert.equal(game.currentSceneName, 'christmastrail', `${season} trailer should play`);
    assert.equal(game.scene.season, season, `${season} trailer should use its season`);
    await frames(50);
    await tapKey('Enter');
    await frames(5);
    assert.equal(game.currentSceneName, 'theatre', `${season} trailer should return to the theatre`);
  }

  game.changeScene('reefrush', { seed: 12345 });
  await frames(5);
  assert.equal(game.currentSceneName, 'reefrush', 'reef rush should open');
  let rush = game.scene;
  assert.equal(rush.seed, 12345, 'reef rush should use the provided seed');
  assert.ok(rush.obstacles.length >= 10, 'reef rush should lay out a designed course');
  const firstCourseCount = rush.obstacles.length;
  game.changeScene('reefrush', { seed: 999 });
  await frames(5);
  assert.equal(
    game.scene.obstacles.length,
    firstCourseCount,
    'the designed course should be the same regardless of seed',
  );
  game.changeScene('reefrush', { seed: 12345 });
  await frames(5);
  rush = game.scene;
  rush.player.onGround = true;
  pressKey('Space');
  await frames(2);
  releaseKey('Space');
  assert.ok(
    rush.player.vy < 0 || rush.player.y < rush.groundY - rush.player.radius,
    'jumping should lift the player',
  );
  rush.scrollX = 1e6;
  await frames(3);
  assert.equal(rush.phase, 'results', 'reaching the marker should win reef rush');
  assert.equal(rush.won, true, 'reef rush should be a win');
  const reefRushRecord = JSON.parse(storage.get('sharkquarium.records')).reefrush;
  assert.ok(reefRushRecord && reefRushRecord.cleared, 'reef rush should bank a record');

  game.changeScene('menu');
  await frames(5);
  const musicBeforeBuilder = game.music.track ? game.music.track.name : null;
  game.changeScene('trackbuilder');
  await frames(5);
  assert.equal(game.currentSceneName, 'trackbuilder', 'the track builder should open');
  assert.equal(game.music.track, null, 'the track builder should silence the menu music');
  const builder = game.scene;
  assert.equal(builder.tracks.DRUMS.length, 0, 'a fresh builder should start empty');
  builder.toggleCell(0, 0);
  builder.toggleCell(4, 1);
  assert.equal(builder.tracks.DRUMS.length, 2, 'clicking should place tone blocks');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.trackbuilder')).tracks.DRUMS.length,
    2,
    'the custom track should persist',
  );
  builder.game.input.pointer.down = true;
  builder.beginDrag(155, 172);
  builder.game.input.pointer.x = 305;
  builder.updateDrag();
  builder.game.input.pointer.down = false;
  builder.endDrag();
  const stretched = builder.tracks.DRUMS.find((note) => note.col === 0 && note.line === 0);
  assert.ok(stretched && stretched.length === 4, 'dragging right should stretch a block');
  builder.setLength(40);
  assert.equal(builder.steps, 40, 'the script should stretch longer');
  builder.toggleCell(30, 0);
  assert.ok(
    builder.tracks.DRUMS.some((note) => note.col === 30),
    'blocks can be placed in the longer script',
  );
  assert.equal(
    JSON.parse(storage.get('sharkquarium.trackbuilder')).steps,
    40,
    'the script length should persist',
  );
  builder.setLength(16);
  assert.equal(builder.steps, 16, 'the script should shrink again');
  assert.ok(
    !builder.tracks.DRUMS.some((note) => note.col === 30),
    'shrinking the script should drop out-of-range blocks',
  );
  builder.selectTab(1);
  assert.equal(builder.inst().key, 'BASS', 'tabs should switch instruments');
  assert.ok(
    builder.inst().pitches[0] > builder.inst().pitches[builder.inst().pitches.length - 1],
    'the top line should be the highest note and the bottom the lowest',
  );
  builder.toggleCell(2, 0);
  assert.equal(builder.tracks.BASS.length, 1, 'each track should hold its own blocks');
  builder.selectTab(0);
  assert.equal(builder.inst().key, 'DRUMS', 'tabs should switch back');
  builder.togglePlay();
  assert.equal(builder.playing, true, 'the builder should play the custom track');
  await frames(20);
  assert.ok(builder.step >= 0, 'the playhead should advance');
  builder.togglePlay();
  assert.equal(builder.playing, false, 'the builder should stop');
  canvasPointerDown(242, 503);
  canvasPointerUp();
  await frames(3);
  assert.equal(builder.playing, true, 'clicking the PLAY button should start playback');
  await frames(20);
  canvasPointerDown(242, 503);
  canvasPointerUp();
  await frames(3);
  assert.equal(builder.playing, false, 'clicking the PLAY button again should stop playback');
  builder.clear();
  assert.equal(builder.tracks.DRUMS.length, 0, 'clear should empty the current track');

  game.changeScene('tracks');
  await frames(5);
  assert.equal(
    game.music.track ? game.music.track.name : null,
    musicBeforeBuilder,
    'leaving the track builder should restore the held music',
  );

  const myTrackIdx = game.scene.menu.items.findIndex((item) => item.action === 'custom');
  assert.ok(myTrackIdx >= 0, 'the track player should offer MY TRACK');
  game.scene.menu.setIndex(myTrackIdx);
  await tapKey('Enter');
  await frames(5);
  assert.ok(game.music.track && game.music.track.custom, 'MY TRACK should play the saved composition');
  assert.equal(game.music.track.name, 'custom', 'the custom track should be named custom');
  const customNotes = game.music.track.byStep.reduce((sum, step) => sum + step.length, 0);
  assert.ok(customNotes >= 1, 'the custom track should hold the saved blocks');
  await tapKey('Enter');
  await frames(3);
  assert.equal(game.music.track, null, 'pressing MY TRACK again should stop it');

  const denseTrack = { bpm: 150, steps: 48, tracks: { DRUMS: [], BASS: [], SYNTH: [] } };
  for (let c = 0; c < 48; c += 1) {
    if (c % 2 === 0) denseTrack.tracks.DRUMS.push(c * 4 + 3);
    if (c % 4 === 0) denseTrack.tracks.BASS.push(c * 6 + 2);
    if (c % 3 === 0) denseTrack.tracks.SYNTH.push(c * 7 + 3);
  }
  storage.set('sharkquarium.trackbuilder', JSON.stringify(denseTrack));

  game.changeScene('reefrush', { custom: true });
  await frames(5);
  assert.equal(game.currentSceneName, 'reefrush', 'custom reef rush should open');
  const customRush = game.scene;
  assert.equal(customRush.custom, true, 'custom reef rush should detect the saved song');
  assert.ok(
    customRush.obstacles.length > 0 || customRush.pearls.length > 0,
    'the song should build a course',
  );
  assert.ok(customRush.goalDistance > 0, 'the custom course should have a goal');
  const groundXs = customRush.items
    .filter((it) => it.kind === 'shell' || it.kind === 'rock')
    .map((it) => it.x)
    .sort((a, b) => a - b);
  for (let i = 1; i < groundXs.length; i += 1) {
    assert.ok(groundXs[i] - groundXs[i - 1] >= 200, 'MY TRACK obstacles should be spaced enough to clear');
  }
  for (const it of customRush.items) {
    if (it.kind === 'shell') assert.ok(it.h <= 84, 'MY TRACK shells should be jumpable');
    if (it.kind === 'rock') assert.ok(it.h <= 48, 'MY TRACK rocks should be jumpable');
  }
  const songPortals = customRush.items.filter((it) => it.kind === 'portal');
  assert.ok(songPortals.length > 0, 'MY TRACK should place gamemode portals');
  assert.ok(songPortals.some((p) => p.form && p.form !== 'fish'), 'MY TRACK portals should include gamemodes');
  assert.ok(new Set(songPortals.map((p) => p.form)).size > 1, 'MY TRACK portals should vary');
  assert.ok(game.music.track && game.music.track.custom, 'custom reef rush should play the saved song');
  assert.equal(customRush.recordMode(), 'reefrushcustom', 'custom runs should use their own record mode');
  customRush.scrollX = 1e6;
  await frames(3);
  assert.equal(customRush.phase, 'results', 'finishing the custom course should win');
  const customRecord = JSON.parse(storage.get('sharkquarium.records')).reefrushcustom;
  assert.ok(customRecord && customRecord.cleared, 'a custom run should bank its own record');

  game.changeScene('rushbuilder');
  await frames(5);
  assert.equal(game.currentSceneName, 'rushbuilder', 'the course builder should open');
  const courseBuilder = game.scene;
  assert.equal(courseBuilder.items.length, 0, 'a fresh course builder should be empty');
  const rowY = (index) => 112 + index * 15 + 7;
  canvasPointerDown(800, rowY(4));
  canvasPointerUp();
  await frames(3);
  assert.equal(courseBuilder.kind(), 'rock', 'clicking the ROCK row should pick that kind');
  canvasPointerDown(800, rowY(0));
  canvasPointerUp();
  await frames(3);
  assert.equal(courseBuilder.kind(), 'shell', 'clicking the SHELL row should pick that kind');
  courseBuilder.selectItem(0);
  courseBuilder.cursorX = 300;
  courseBuilder.heightIndex.shell = 2;
  courseBuilder.place();
  courseBuilder.selectItem(1);
  courseBuilder.cursorX = 700;
  courseBuilder.place();
  courseBuilder.selectItem(2);
  courseBuilder.cursorX = 1000;
  courseBuilder.place();
  assert.equal(courseBuilder.items.length, 3, 'placing should add obstacles');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.rushcourse')).items.length,
    3,
    'the course should persist',
  );
  courseBuilder.setGoal(5000);
  assert.equal(courseBuilder.goal, 5000, 'the goal should be adjustable');
  courseBuilder.cursorX = 1000;
  courseBuilder.removeNear();
  assert.equal(courseBuilder.items.length, 2, 'X should remove the obstacle under the cursor');
  courseBuilder.selectItem(4);
  courseBuilder.cursorX = 1500;
  courseBuilder.heightIndex.rock = 0;
  courseBuilder.place();
  courseBuilder.place();
  const stackRock = courseBuilder.items.find((it) => it.kind === 'rock' && it.x === 1500);
  assert.ok(stackRock && stackRock.count === 2, 'placing a rock twice should stack it');
  courseBuilder.selectItem(0);
  courseBuilder.cursorX = 1500;
  courseBuilder.place();
  const shellOnRock = courseBuilder.items.find((it) => it.kind === 'shell' && it.x === 1500);
  assert.ok(shellOnRock && shellOnRock.base > 0, 'a shell should sit on top of a rock');
  courseBuilder.selectItem(11);
  courseBuilder.cursorX = 1500;
  courseBuilder.place();
  const padOnRock = courseBuilder.items.find((it) => it.kind === 'pad' && it.x === 1500);
  assert.ok(padOnRock && padOnRock.base > 0, 'a thrust bubble pad should rest on a rock stack');
  courseBuilder.selectItem(9);
  courseBuilder.cursorX = 1500;
  courseBuilder.place();
  const gravPadOnRock = courseBuilder.items.find((it) => it.kind === 'gravpad' && it.x === 1500);
  assert.ok(gravPadOnRock && gravPadOnRock.base > 0, 'a gravity bubble pad should rest on a rock stack');
  courseBuilder.selectItem(0);
  courseBuilder.cursorX = 1700;
  courseBuilder.heightIndex.shell = 0;
  courseBuilder.place();
  const spike = courseBuilder.items.find((it) => it.kind === 'shell' && it.x === 1700);
  const beforeH = spike.h;
  courseBuilder.drag = { item: spike, startY: 300, startH: beforeH, moved: false, created: false };
  courseBuilder.updateDrag(200);
  assert.ok(spike.h > beforeH, 'dragging up should stretch a spike');
  courseBuilder.game.input.pointer.down = false;
  courseBuilder.endDrag();
  courseBuilder.selectItem(16);
  assert.equal(courseBuilder.kind(), 'portal', 'the item list should offer portals');
  assert.equal(courseBuilder.form(), 'stingray', 'the stingray row should target the stingray form');
  courseBuilder.selectItem(17);
  assert.equal(courseBuilder.form(), 'eel', 'the dart eel row should target the eel form');
  courseBuilder.selectItem(19);
  assert.equal(courseBuilder.form(), 'urchin', 'the urchin row should target the urchin form');
  courseBuilder.selectItem(20);
  assert.equal(courseBuilder.form(), 'jelly', 'the jelly row should target the jelly form');
  courseBuilder.selectItem(21);
  assert.equal(courseBuilder.form(), 'fish', 'the fish row should target the fish form');
  courseBuilder.selectItem(0);
  courseBuilder.game.input.wheel = 3;
  courseBuilder.update(1 / 60);
  assert.equal(courseBuilder.itemIndex, 3, 'the mouse wheel should scroll the item list');
  courseBuilder.selectItem(17);
  courseBuilder.cursorX = 1900;
  courseBuilder.heightIndex.portal = 0;
  courseBuilder.place();
  const portal = courseBuilder.items.find((it) => it.kind === 'portal');
  assert.ok(portal && portal.form === 'eel', 'a placed portal should carry its target form');
  courseBuilder.selectItem(7);
  courseBuilder.cursorX = 2100;
  courseBuilder.place();
  const bubble = courseBuilder.items.find((it) => it.kind === 'bubble');
  assert.ok(bubble && bubble.h >= 60, 'a pressure bubble should sit in mid-water');
  courseBuilder.selectItem(5);
  courseBuilder.cursorX = 800;
  courseBuilder.heightIndex.ceilrock = 0;
  courseBuilder.place();
  courseBuilder.place();
  const ceilStack = courseBuilder.items.find((it) => it.kind === 'ceilrock');
  assert.ok(ceilStack && ceilStack.count === 2, 'ceiling rocks should stack like floor rocks');
  courseBuilder.selectItem(2);
  courseBuilder.cursorX = 800;
  courseBuilder.place();
  const ceilShellOnRock = courseBuilder.items.find((it) => it.kind === 'ceilshell' && it.x === 800 && it.base > 0);
  assert.ok(ceilShellOnRock, 'a ceiling shell should hang under a ceiling rock');
  courseBuilder.selectItem(12);
  courseBuilder.cursorX = 800;
  courseBuilder.place();
  const ceilPadOnRock = courseBuilder.items.find((it) => it.kind === 'ceilpad' && it.x === 800 && it.base > 0);
  assert.ok(ceilPadOnRock, 'a ceiling thrust bubble pad should hang under a ceiling rock');
  courseBuilder.selectItem(2);
  courseBuilder.cursorX = 940;
  courseBuilder.place();
  assert.ok(courseBuilder.items.some((it) => it.kind === 'ceilshell'), 'the builder should offer a ceiling shell');
  courseBuilder.selectItem(3);
  courseBuilder.cursorX = 960;
  courseBuilder.place();
  assert.ok(courseBuilder.items.some((it) => it.kind === 'ceilweed'), 'the builder should offer ceiling weed');
  courseBuilder.selectItem(8);
  courseBuilder.cursorX = 2300;
  courseBuilder.place();
  assert.ok(courseBuilder.items.some((it) => it.kind === 'gravity'), 'the builder should offer a gravity bubble');
  courseBuilder.selectItem(9);
  courseBuilder.cursorX = 2500;
  courseBuilder.place();
  assert.ok(courseBuilder.items.some((it) => it.kind === 'gravpad'), 'the builder should offer a gravity bubble pad');
  courseBuilder.selectItem(10);
  courseBuilder.cursorX = 2700;
  courseBuilder.place();
  assert.ok(courseBuilder.items.some((it) => it.kind === 'ceilgravpad'), 'the builder should offer a ceiling gravity bubble pad');
  courseBuilder.selectItem(11);
  courseBuilder.cursorX = 2900;
  courseBuilder.place();
  assert.ok(courseBuilder.items.some((it) => it.kind === 'pad'), 'the builder should offer a thrust bubble pad');
  courseBuilder.selectItem(12);
  courseBuilder.cursorX = 3100;
  courseBuilder.place();
  assert.ok(courseBuilder.items.some((it) => it.kind === 'ceilpad'), 'the builder should offer a ceiling thrust bubble pad');
  courseBuilder.selectItem(13);
  courseBuilder.cursorX = 3300;
  courseBuilder.heightIndex.ledge = 5;
  courseBuilder.place();
  const ledgeItem = courseBuilder.items.find((it) => it.kind === 'ledge');
  assert.ok(ledgeItem && ledgeItem.h === 230, 'the builder should place a floating ledge at the chosen height');
  courseBuilder.selectItem(11);
  courseBuilder.cursorX = 3300;
  courseBuilder.place();
  const padOnLedge = courseBuilder.items.find((it) => it.kind === 'pad' && it.x === 3300);
  assert.ok(padOnLedge && padOnLedge.base === 230, 'a thrust bubble pad should rest on a floating ledge');
  courseBuilder.selectItem(14);
  courseBuilder.cursorX = 3500;
  courseBuilder.place();
  assert.ok(courseBuilder.items.some((it) => it.kind === 'slopeup'), 'the builder should offer a slope up');
  courseBuilder.selectItem(15);
  courseBuilder.cursorX = 3700;
  courseBuilder.place();
  assert.ok(courseBuilder.items.some((it) => it.kind === 'slopedown'), 'the builder should offer a slope down');

  courseBuilder.testPlay();
  await frames(5);
  const testRun = game.scene;
  assert.equal(testRun.fromBuilder, true, 'a builder test run should remember it came from the builder');
  assert.equal(testRun.testStart, 0, 'a plain TEST should start at the beginning');
  testRun.finish(false);
  await frames(3);
  assert.equal(testRun.phase, 'results', 'dying in a test should show the results screen');
  assert.ok(
    testRun.resultsMenu.items.some((item) => item.action === 'builder'),
    'the results screen should offer BACK TO BUILDING',
  );
  testRun.chooseResult('builder');
  await frames(5);
  assert.equal(game.currentSceneName, 'rushbuilder', 'BACK TO BUILDING should return to the editor');

  const builder2 = game.scene;
  builder2.cursorX = 2000;
  builder2.testPlay(builder2.snapped());
  await frames(5);
  const hereRun = game.scene;
  assert.ok(hereRun.fromBuilder && hereRun.testStart === 2000, 'TEST HERE should start at the chosen part');
  assert.ok(hereRun.scrollX > 1900, 'the test should begin part-way through the course');
  hereRun.finish(false);
  await frames(2);
  hereRun.chooseResult('builder');
  await frames(5);
  assert.equal(game.currentSceneName, 'rushbuilder', 'a mid-course test should return to the editor');

  const builder3 = game.scene;
  builder3.selectItem(4);
  builder3.cursorX = 4000;
  builder3.heightIndex.rock = 0;
  builder3.place();
  builder3.testPlay(4000);
  await frames(5);
  const surfaceRun = game.scene;
  const rockTop = surfaceRun.groundY - 40 * 0.85;
  assert.ok(
    Math.abs(surfaceRun.player.y - (rockTop - surfaceRun.player.radius)) < 2,
    'TEST HERE should spawn the fish on the nearest landable surface',
  );
  assert.equal(surfaceRun.dying, 0, 'the spawn should not overlap the piece');
  surfaceRun.finish(false);
  await frames(2);
  surfaceRun.chooseResult('builder');
  await frames(5);
  assert.equal(game.currentSceneName, 'rushbuilder', 'the surface test should return to the editor');

  game.changeScene('reefrush', { course: true });
  await frames(5);
  const courseRun = game.scene;
  assert.equal(courseRun.course, true, 'the saved course should be detected');
  assert.ok(courseRun.obstacles.length >= 1, 'the course should build obstacles from the saved items');
  assert.equal(courseRun.recordMode(), 'reefrushcourse', 'course runs should use their own record mode');
  const playerOffset = courseRun.player.x - courseRun.scrollX;
  const runPortal = courseRun.items.find((it) => it.kind === 'portal');
  assert.ok(runPortal, 'the course should carry the portal');
  courseRun.scrollX = runPortal.x - playerOffset;
  courseRun.player.y = courseRun.groundY - runPortal.h;
  courseRun.player.vy = 0;
  courseRun.game.input.pressed.clear();
  courseRun.game.input.pressed.add('Enter');
  courseRun.update(1 / 60);
  assert.equal(courseRun.form, runPortal.form, 'passing through a portal should change the player mode');
  courseRun.game.input.pressed.clear();
  courseRun.update(1 / 60);
  assert.ok(courseRun.dartTrail.length > 0, 'the dart eel should trail a body behind it');
  courseRun.items = [];
  courseRun.pearls = [];
  courseRun.obstacles = courseRun.items;
  courseRun.form = 'eel';
  courseRun.gravityUp = false;
  courseRun.dartTap = 0;
  courseRun.player.vy = 0;
  courseRun.game.input.pressed.clear();
  courseRun.update(1 / 60);
  assert.ok(courseRun.player.vy > 0, 'the dart eel sinks by default');
  courseRun.game.input.pressed.add('Enter');
  courseRun.update(1 / 60);
  assert.ok(courseRun.player.vy < 0, 'a single click sends the dart eel diagonally up at once');
  courseRun.dartTap = 0;
  courseRun.game.input.pressed.clear();
  courseRun.update(1 / 60);
  assert.ok(courseRun.player.vy > 0, 'the dart eel drops back down after the click');
  courseRun.items = [{ kind: 'portal', form: 'fish', x: 600, h: 120, count: 1 }];
  courseRun.pearls = [];
  courseRun.obstacles = courseRun.items;
  courseRun.form = 'eel';
  courseRun.scrollX = 600 - playerOffset;
  courseRun.player.y = courseRun.groundY - 120;
  courseRun.player.vy = 0;
  courseRun.game.input.pressed.clear();
  courseRun.update(1 / 60);
  assert.equal(courseRun.form, 'fish', 'a fish portal should turn the player back into a fish');
  courseRun.items = [{ kind: 'bubble', x: 600, h: 120, count: 1 }];
  courseRun.pearls = [];
  courseRun.obstacles = courseRun.items;
  courseRun.form = 'fish';
  courseRun.coyote = 0;
  courseRun.scrollX = 600 - playerOffset;
  courseRun.player.y = courseRun.groundY - 120;
  courseRun.player.vy = 200;
  courseRun.player.onGround = false;
  courseRun.bubbleCooldown = 0;
  courseRun.game.input.pressed.clear();
  courseRun.game.input.pressed.add('Enter');
  courseRun.update(1 / 60);
  assert.ok(courseRun.player.vy < 0, 'a pressure bubble should boost the swimmer upward on click');
  courseRun.items = [{ kind: 'gravity', x: 600, h: 120, count: 1 }];
  courseRun.obstacles = courseRun.items;
  courseRun.form = 'fish';
  courseRun.gravityUp = false;
  courseRun.coyote = 0;
  courseRun.scrollX = 600 - playerOffset;
  courseRun.player.y = courseRun.groundY - 120;
  courseRun.player.vy = 100;
  courseRun.player.onGround = false;
  courseRun.bubbleCooldown = 0;
  courseRun.game.input.pressed.clear();
  courseRun.game.input.pressed.add('Enter');
  courseRun.update(1 / 60);
  assert.equal(courseRun.gravityUp, true, 'a gravity bubble should flip gravity whatever the mode');
  courseRun.game.input.pressed.clear();
  courseRun.update(1 / 60);
  assert.ok(courseRun.player.vy < 0, 'gravity should now pull the swimmer toward the ceiling');
  courseRun.items = [{ kind: 'gravity', x: 600, h: 120, count: 1 }];
  courseRun.obstacles = courseRun.items;
  courseRun.form = 'fish';
  courseRun.scrollX = 600 - playerOffset;
  courseRun.player.y = courseRun.groundY - 120;
  courseRun.bubbleCooldown = 0;
  courseRun.game.input.pressed.clear();
  courseRun.game.input.pressed.add('Enter');
  courseRun.update(1 / 60);
  assert.equal(courseRun.gravityUp, true, 'a second gravity bubble should keep the player upside down');
  courseRun.items = [{ kind: 'gravpad', x: 600, h: 20, count: 1 }];
  courseRun.obstacles = courseRun.items;
  courseRun.form = 'fish';
  courseRun.gravityUp = false;
  courseRun.scrollX = 600 - playerOffset;
  courseRun.player.y = courseRun.groundY - courseRun.player.radius;
  courseRun.player.vy = 0;
  courseRun.padCooldown = 0;
  courseRun.game.input.pressed.clear();
  courseRun.update(1 / 60);
  assert.equal(courseRun.gravityUp, true, 'a gravity bubble pad should flip gravity on mere touch');
  courseRun.padCooldown = 0;
  courseRun.update(1 / 60);
  assert.equal(courseRun.gravityUp, false, 'touching another gravity bubble pad should flip it back');
  courseRun.items = [{ kind: 'pad', x: 600, h: 20, count: 1 }];
  courseRun.obstacles = courseRun.items;
  courseRun.form = 'fish';
  courseRun.gravityUp = false;
  courseRun.coyote = 0;
  courseRun.scrollX = 600 - playerOffset;
  courseRun.player.y = courseRun.groundY - courseRun.player.radius;
  courseRun.player.vy = 0;
  courseRun.padCooldown = 0;
  courseRun.game.input.pressed.clear();
  courseRun.update(1 / 60);
  assert.ok(courseRun.player.vy < 0, 'a thrust pad should launch the swimmer up on mere touch');
  courseRun.items = [{ kind: 'ceilpad', x: 600, h: 20, count: 1 }];
  courseRun.obstacles = courseRun.items;
  courseRun.form = 'fish';
  courseRun.gravityUp = true;
  courseRun.coyote = 0;
  courseRun.scrollX = 600 - playerOffset;
  courseRun.player.y = courseRun.player.radius;
  courseRun.player.vy = 0;
  courseRun.padCooldown = 0;
  courseRun.game.input.pressed.clear();
  courseRun.update(1 / 60);
  assert.ok(courseRun.player.vy > 0, 'a ceiling thrust pad should launch the swimmer down on mere touch');
  courseRun.items = [{ kind: 'ledge', x: 600, h: 200, count: 1 }];
  courseRun.obstacles = courseRun.items;
  courseRun.form = 'fish';
  courseRun.gravityUp = false;
  courseRun.coyote = 0;
  courseRun.scrollX = 600 - playerOffset;
  courseRun.player.y = 205;
  courseRun.player.vy = 260;
  courseRun.player.onGround = false;
  courseRun.game.input.pressed.clear();
  courseRun.update(1 / 60);
  assert.ok(
    courseRun.player.onGround && courseRun.player.y < courseRun.groundY - 100,
    'a floating ledge should be standable at its height',
  );
  courseRun.items = [{ kind: 'slopeup', x: 600, h: 100, count: 1 }];
  courseRun.obstacles = courseRun.items;
  courseRun.form = 'fish';
  courseRun.gravityUp = false;
  courseRun.coyote = 0;
  courseRun.scrollX = 600 - playerOffset;
  courseRun.player.y = courseRun.groundY - courseRun.player.radius;
  courseRun.player.vy = 0;
  courseRun.player.onGround = true;
  courseRun.game.input.pressed.clear();
  courseRun.update(1 / 60);
  assert.ok(
    courseRun.player.onGround && courseRun.player.y < courseRun.groundY - courseRun.player.radius - 2,
    'a slope should carry the swimmer uphill',
  );
  courseRun.form = 'crab';
  courseRun.gravityUp = false;
  courseRun.flipGravity(true);
  assert.equal(courseRun.player.y, courseRun.player.radius, 'a crab click should flip it onto the ceiling');
  courseRun.flipGravity(true);
  assert.equal(courseRun.player.y, courseRun.groundY - courseRun.player.radius, 'a second crab click should send it back down');
  courseRun.items = [{ kind: 'ledge', x: 600, h: 200, count: 1 }];
  courseRun.obstacles = courseRun.items;
  courseRun.form = 'crab';
  courseRun.gravityUp = false;
  courseRun.scrollX = 600 - playerOffset;
  courseRun.player.y = courseRun.groundY - courseRun.player.radius;
  courseRun.update(1 / 60);
  courseRun.flipGravity(true);
  assert.equal(
    courseRun.player.y,
    courseRun.groundY - 200 + 16 + courseRun.player.radius,
    'a crab should land under a floating ledge',
  );
  courseRun.scrollX = 1e6;
  await frames(3);
  assert.equal(courseRun.phase, 'results', 'finishing the course should win');
  const courseRecord = JSON.parse(storage.get('sharkquarium.records')).reefrushcourse;
  assert.ok(courseRecord && courseRecord.cleared, 'a course run should bank its own record');

  storage.set('sharkquarium.shop', JSON.stringify({ passes: ['playpass1'] }));
  game.changeScene('minigames');
  await frames(5);
  assert.ok(
    game.scene.menu.items.some((item) => item.action === 'rushbuilder'),
    'the minigames menu should offer the course builder',
  );

  const levelKinds = ['shell', 'seaweed', 'rock', 'ceilrock', 'ceilshell', 'ceilweed', 'pearl', 'bubble', 'gravity', 'gravpad', 'ceilgravpad', 'pad', 'ceilpad', 'ledge', 'slopeup', 'slopedown', 'portal'];
  for (const levelId of ['sunlit', 'kelp', 'stingray', 'jelly', 'current']) {
    game.changeScene('reefrush', { level: levelId });
    await frames(5);
    const inspected = game.scene;
    assert.ok(
      inspected.items.every((it) => levelKinds.includes(it.kind)),
      `level ${levelId} should only use pieces that render`,
    );
    for (const it of inspected.items) {
      if (it.kind === 'rock' || it.kind === 'ceilrock') {
        assert.ok(
          (it.count || 1) * it.h * 0.85 <= 110,
          `level ${levelId} should not stack blocks taller than a jump`,
        );
      }
    }
  }

  game.changeScene('rushlevels');
  await frames(5);
  assert.equal(game.currentSceneName, 'rushlevels', 'the level select should open');
  const levelSelect = game.scene;
  assert.ok(levelSelect.cards.length >= 6, 'the level select should list the levels plus my course');
  levelSelect.index = 1;
  levelSelect.choose(levelSelect.cards[1]);
  await frames(5);
  assert.equal(game.currentSceneName, 'reefrush', 'choosing a level should start it');
  const levelRun = game.scene;
  assert.equal(levelRun.level && levelRun.level.id, 'kelp', 'the chosen level should load');
  assert.ok(levelRun.obstacles.length + levelRun.pearls.length > 0, 'the level should build a course');
  levelRun.distance = levelRun.goalDistance;
  levelRun.scrollX = levelRun.goalDistance;
  await frames(3);
  assert.equal(game.currentSceneName, 'rushclear', 'finishing a level should play the end cutscene');
  assert.equal(game.scene.name, 'KELP CROSSING', 'the cutscene should name the level');
  assert.ok(
    JSON.parse(storage.get('sharkquarium.rushprogress')).beaten.includes('kelp'),
    'beating a level should record progress',
  );
  assert.ok(
    JSON.parse(storage.get('sharkquarium.shop')).owned.includes('tigerray'),
    'beating a level should unlock its skin',
  );
  await frames(120);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'rushlevels', 'the cutscene should return to the level select');
  assert.ok(levelSelect.cards, 'the level select should still be available');

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'normal', season: 'none' }));
  game.changeScene('menu');
  await frames(5);

  console.log(
    `Smoke test passed: ${frameId} animation frames driven, final scene "${game.currentSceneName}"`,
  );
}

main().catch((error) => {
  console.error('Smoke test failed:');
  console.error(error);
  process.exitCode = 1;
});
