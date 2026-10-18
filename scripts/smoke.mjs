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

async function clickAt(x, y) {
  for (const handler of canvasTarget.listenersFor('pointerdown')) {
    handler({ clientX: x, clientY: y });
  }
  await frames(2);
  for (const handler of windowTarget.listenersFor('pointerup')) {
    handler({});
  }
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

  await tapKey('Enter');
  assert.equal(game.scene.showHelp, true, 'how to play overlay should open');
  await tapKey('Escape');
  assert.equal(game.scene.showHelp, false, 'escape should close the how to play overlay');

  movePointer(480, 334);
  await frames(2);
  assert.equal(game.scene.menu.index, 2, 'pointer hover should select EMPTY TANK');
  await clickAt(480, 334);
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
    await frames(40);
    await tapKey('Enter');
    await frames(5);
    assert.equal(game.currentSceneName, 'play', 'play again should restart the dive');
  }

  console.log(
    `Smoke test passed: ${frameId} animation frames driven, final scene "${game.currentSceneName}"`,
  );
}

main().catch((error) => {
  console.error('Smoke test failed:');
  console.error(error);
  process.exitCode = 1;
});
