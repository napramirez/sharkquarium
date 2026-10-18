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
  assert.equal(game.currentSceneName, 'menu', 'boot scene should hand off to the menu');
  assert.equal(game.scene.menu.index, 0, 'menu should start on START DIVE');

  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 1, 'arrow down should navigate the menu');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 2, 'arrow down should keep navigating the menu');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 3, 'arrow down should reach settings');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 4, 'arrow down should reach how to play');

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
  assert.equal(game.scene.menu.items[7].label, 'EMPTY TANK', 'the tank list should include every tank');
  movePointer(480, 407);
  await frames(2);
  assert.equal(game.scene.menu.index, 7, 'pointer hover should select EMPTY TANK in the list');
  await clickAt(480, 407);
  await frames(5);
  assert.equal(game.currentSceneName, 'play', 'clicking EMPTY TANK should start the play scene');
  assert.equal(game.scene.empty, true, 'empty tank should start without spawning content');
  assert.ok(game.scene.hud, 'play scene should own a hud');

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

  const scene = game.scene;

  canvasPointerDown(400, 300);
  movePointer(640, 300);
  await frames(30);
  assert.ok(scene.player.vx > 50, 'dragging should steer the shark');
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
  const reefTime = reef.timeLeft;
  reef.score = 60;
  await frames(2);
  assert.equal(game.currentSceneName, 'play', 'the run should continue after the teleport');
  const tank = game.scene;
  assert.equal(tank.stingrayTank, true, '60 points should teleport into the stingray tank');
  assert.equal(tank.score, 60, 'score should carry over');
  assert.ok(Math.abs(tank.timeLeft - reefTime) < 0.5, 'the timer should carry over');
  assert.ok(tank.archway, 'the stingray tank should have a rock archway');
  assert.equal(tank.eels.length, 5, 'each hole in the archway should have an eel');
  assert.equal(tank.eelPhase, 'hidden', 'the eels should start in their holes');

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
  pressKey('ArrowRight');
  await frames(60);
  releaseKey('ArrowRight');
  assert.ok(tank.player.x > searchX + 60, 'the buried stingray should be able to crawl away');
  assert.ok(
    tank.eels.every((eel) => Math.abs(eel.x - searchX) < 100),
    'the eels should search the last seen spot instead of tracking the buried mound',
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
  const deep = game.scene;
  assert.equal(deep.deepsea, true, '250 points in the stingray tank should teleport to the deep sea');
  assert.equal(deep.score, 250, 'the deep sea should inherit the score');
  assert.ok(deep.ledges, 'the deep sea should have stone ledges');
  assert.equal(deep.ledges.holes.length, 4, 'the two ledges should have four holes');
  assert.equal(deep.anglers.length, 3, 'anglerfish should be roaming the deep sea');

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

  deep.tankBubbles = 40;
  await frames(2);
  const arctic = game.scene;
  assert.equal(arctic.arctic, true, '40 deep-sea bubbles should teleport to the arctic tank');
  assert.ok(arctic.icechunk, 'the arctic tank should have an ice chunk');
  assert.equal(arctic.seals.length, 2, 'two seals should perch on the ice');
  assert.equal(arctic.schools.length, 2, 'sardine schools should drift through the tank');
  assert.equal(arctic.sealPhase, 'perched', 'the seals should start perched on the ice');

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
  const jelly = game.scene;
  assert.equal(jelly.jellyTank, true, '30 arctic plankton should teleport to the jelly tank');
  assert.ok(jelly.turtle, 'the jelly tank should host the turtle miniboss');
  assert.equal(jelly.jellyPoints, 0, 'the miniboss tally should start empty');
  assert.equal(game.music.track.name, 'turtle', 'the jelly tank should play the turtle theme');
  await frames(30);
  assert.ok(game.music.step > 0, 'the miniboss music should sequence');

  jelly.bubbles.length = 0;
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
  const freshwater = game.scene;
  assert.equal(freshwater.freshwater, true, '10 miniboss points should open the freshwater chase');
  assert.ok(freshwater.catfish, 'a catfish should be chasing the player');
  assert.equal(game.music.track.name, 'catfish', 'the freshwater chase should play the catfish theme');
  assert.equal(freshwater.player.autoScrollX, 280, 'the freshwater ray should be pinned to the scroll lane');

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
  assert.equal(game.scene.menu.items.length, 5, 'the menu should offer the five base options');
  assert.equal(game.music.track, null, 'scene changes should stop the miniboss music');

  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  await tapKey('ArrowDown');
  assert.equal(game.scene.menu.index, 3, 'settings should be the fourth menu entry');
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
  await tapKey('ArrowLeft');
  assert.equal(game.scene.settings.difficulty, 'normal', 'the difficulty selector should step back');

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
  await tapKey('Escape');
  await frames(5);
  assert.equal(game.currentSceneName, 'menu', 'escape should leave settings');

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

  storage.set('sharkquarium.settings', JSON.stringify({ difficulty: 'easy' }));
  game.changeScene('play');
  await frames(5);
  assert.equal(game.scene.rules.enemySpeed, 0.5, 'easy should slow enemies down');
  assert.ok(game.scene.timeLimit > 30, 'easy should lengthen the tank clock');
  assert.equal(game.scene.eelNeed, 15, 'easy should keep the eels in their holes longer');

  console.log(
    `Smoke test passed: ${frameId} animation frames driven, final scene "${game.currentSceneName}"`,
  );
}

main().catch((error) => {
  console.error('Smoke test failed:');
  console.error(error);
  process.exitCode = 1;
});
