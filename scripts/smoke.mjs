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
  await frames(60);
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'the intro splash should hand off to the menu');
  assert.equal(game.scene.menu.index, 0, 'menu should start on START DIVE');
  assert.equal(game.scene.coins, 500, 'new players should start with a welcome sea-coin bank');

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

  movePointer(480, 293);
  await frames(2);
  assert.equal(game.scene.menu.index, 1, 'pointer hover should select CHOOSE TANK');
  await clickAt(480, 293);
  await frames(5);
  assert.equal(game.currentSceneName, 'tanks', 'clicking CHOOSE TANK should open the tank select');
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
  assert.equal(game.scene.menu.items[9].label, 'EMPTY TANK', 'the tank list should include every tank');
  const emptyRow = game.scene.menu.bounds[9];
  movePointer(emptyRow.x + emptyRow.width / 2, emptyRow.y + emptyRow.height / 2);
  await frames(2);
  assert.equal(game.scene.menu.index, 9, 'pointer hover should select EMPTY TANK in the list');
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

  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'play', 'menu should start a dive');
  assert.equal(game.scene.empty, false, 'start dive should spawn the full game');

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
  scene.bonus[0].x = scene.player.x;
  scene.bonus[0].y = scene.player.y;
  await frames(2);
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
  await frames(200);
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
  assert.equal(game.scene.menu.items.length, 6, 'the menu should offer the six base options');
  assert.equal(game.music.track, null, 'scene changes should stop the tank music');

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
  assert.equal(game.scene.settings.volume, 0.7, 'volume should start at the default');
  await tapKey('ArrowRight');
  await tapKey('ArrowRight');
  assert.equal(game.scene.settings.volume, 0.9, 'the volume slider should step up');
  assert.equal(game.audio.volume, 0.9, 'the audio bus should follow the slider');

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
    9,
    'the track player should list every level track plus back',
  );
  assert.deepEqual(
    game.scene.menu.items.slice(0, 8).map((item) => item.label),
    [
      'REEF TRACK',
      'STINGRAY TRACK',
      'DEEP SEA TRACK',
      'ARCTIC TRACK',
      'KELP TRACK',
      'JELLY TRACK',
      'FRESHWATER TRACK',
      'NAUTILUS TRACK',
    ],
    'the track player should list every level track',
  );
  assert.equal(game.music.track, null, 'the track player should start silent');
  await tapKey('Enter');
  await frames(20);
  assert.equal(game.music.track.name, 'reef', 'the first track should play the reef theme');
  assert.ok(game.music.step > 0, 'the track player should sequence the theme');
  const nautilusRow = game.scene.menu.bounds[7];
  await clickAt(nautilusRow.x + nautilusRow.width / 2, nautilusRow.y + nautilusRow.height / 2);
  await frames(10);
  assert.equal(game.music.track.name, 'nautilus', 'clicking a track row should play it');
  await tapKey('ArrowUp');
  await tapKey('ArrowUp');
  assert.equal(game.scene.menu.index, 5, 'the list should reach the jelly track');
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
    5,
    'the shop should list color, creature, accessory, playpass, and back',
  );
  assert.equal(shop.coins, 100, 'the shop should read the banked sea coins');
  assert.equal(shop.skin.key, 'natural', 'the shop should start on the equipped color');
  assert.equal(shop.accessory.key, 'none', 'no accessory should be worn by default');
  assert.equal(shop.previewCreatures.length, 7, 'the shop should preview every creature');
  assert.deepEqual(
    shop.previewCreatures.map((entry) => entry.key),
    ['shark', 'stingray', 'squid', 'arcticshrimp', 'kelpcrab', 'jellyfish', 'nautilus'],
    'the preview list should cover every playable creature, old and new',
  );
  assert.equal(shop.creature.entity.radius, 26, 'the preview shark should match the playable shark');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.skin, 'natural', 'the equipped color should stay without a purchase');
  await tapKey('ArrowRight');
  assert.equal(shop.skin.key, 'lagoon', 'the color selector should browse the catalog');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.skin, 'natural', 'colors should not equip without affording them');
  assert.equal(shop.coins, 100, 'a failed purchase should not charge sea coins');

  shop.coins = 5000;
  for (let i = 0; i < 4; i += 1) await tapKey('ArrowRight');
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
  assert.equal(shop.menu.selected.action, 'accessory', 'the accessory row should be selectable');
  await tapKey('ArrowRight');
  assert.equal(
    shop.accessory.key,
    'tophat',
    'the accessory browser should step through the catalog',
  );
  shop.coins = 200;
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.accessory, 'tophat', 'a cheap accessory should equip on purchase');
  assert.equal(shop.coins, 120, 'the top hat should cost its cheap price');
  assert.equal(
    JSON.parse(storage.get('sharkquarium.shop')).accessory,
    'tophat',
    'the accessory should persist',
  );
  await tapKey('ArrowLeft');
  assert.equal(shop.accessory.key, 'none', 'the accessory browser should reach NONE again');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.accessory, 'none', 'NONE should take the trinket off');
  await tapKey('ArrowRight');
  await tapKey('Enter');
  await frames(2);
  assert.equal(shop.shop.accessory, 'tophat', 're-wearing an owned accessory should be free');
  assert.equal(shop.coins, 120, 're-wearing an accessory should not charge');

  shop.coins = 1200;
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(2);
  assert.ok(shop.passOwned(), 'the playpass should be bought with sea coins');
  assert.equal(shop.coins, 0, 'the playpass should cost its price');
  assert.ok(
    JSON.parse(storage.get('sharkquarium.shop')).passes.includes('competitions'),
    'the playpass should persist',
  );

  game.changeScene('menu');
  await frames(5);
  assert.equal(game.scene.menu.items.length, 7, 'the playpass should add the minigames entry');
  assert.equal(game.scene.menu.items[3].label, 'MINIGAMES', 'minigames should sit below co-op');
  assert.equal(game.scene.shop.skin, 'rainbow', 'the menu should use the equipped color');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 3, 'the minigames entry should be selectable');
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
  assert.equal(race.timeLimit, 30, 'competitions should use their own clock');
  assert.equal(race.rules.enemySpeed, 1, 'competitions should use neutral tuning');
  assert.equal(race.accessory.key, 'tophat', 'dives should wear the equipped accessory');

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

  game.changeScene('minigames');
  await frames(5);
  assert.equal(
    game.scene.menu.items.length,
    4,
    'the pass should unlock three minigames plus back',
  );
  assert.equal(game.scene.menu.items[1].label, 'TAG (2P + 5 CPU)', 'tag should be the second minigame');
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  const tag = game.scene;
  assert.equal(game.currentSceneName, 'tag', 'the minigames menu should open tag');
  assert.equal(tag.phase, 'names', 'tag should start with name entry');

  await tapKey('KeyA');
  await tapKey('KeyB');
  await tapKey('Backspace');
  await tapKey('KeyC');
  assert.equal(tag.inputText[0], 'AC', 'letters should type and backspace should edit');
  await tapKey('Enter');
  assert.equal(tag.activeField, 1, 'enter should move to the second name');
  await tapKey('KeyD');
  await tapKey('KeyE');
  await tapKey('Enter');
  await frames(5);
  assert.equal(tag.phase, 'play', 'both names should start the round');
  assert.deepEqual(tag.names, ['AC', 'DE'], 'the entered names should be used');
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
  await frames(2);
  assert.equal(tag.taggerIndex, victimIndex, 'touching the tagger should pass the tag');
  assert.equal(victim.tags, victimTags + 1, 'the new tagger should be counted');
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
  await tapKey('ArrowDown');
  await tapKey('Enter');
  await frames(5);
  assert.equal(game.currentSceneName, 'minigames', 'the results menu should return to minigames');

  game.changeScene('minigames');
  await frames(5);
  assert.equal(
    game.scene.menu.items[2].label,
    'PUFFERFISH DODGEBALL (2P)',
    'dodgeball should be listed third',
  );
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

  console.log(
    `Smoke test passed: ${frameId} animation frames driven, final scene "${game.currentSceneName}"`,
  );
}

main().catch((error) => {
  console.error('Smoke test failed:');
  console.error(error);
  process.exitCode = 1;
});
