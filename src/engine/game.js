import { MusicPlayer } from './music.js';
import { setMode3D, setHiddenEntity, setFirstPersonMode } from './mode3d.js';
import { setCoinMultiplier } from './progress.js';
import { mutatorCoinMult } from './mutators.js';
import { drawText } from './render.js';
import { is8Bit, PIXEL_WIDTH, PIXEL_HEIGHT } from './retro.js';
import { drawMemeOverlay } from './meme.js';
import { isMobilite, renderMobilite, updateMobilite } from './mobilite.js';
import { FIRST_PERSON } from '../config.js';

const FIRST_PERSON_SCENES = new Set([
  'play',
  'tag',
  'dodgeball',
  'labyrinth',
  'aquarium',
  'pufferball',
  'roundup',
  'stealth',
  'trench',
  'jellyascent',
  'cleanup',
  'abyss',
  'raycast',
  'quiet',
  'watcher',
  'mouth',
  'playtoy',
]);

export const FIXED_STEP = 1 / 60;
export const MAX_FRAME_TIME = 0.1;
const MAX_STEPS = 4;
const MAX_DPR = 1.5;

export class Game {
  constructor({ canvas, width, height, input, audio = null }) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.input = input;
    this.audio = audio;
    this.music = audio ? new MusicPlayer(audio) : null;
    this.context = canvas.getContext('2d', { alpha: false });
    this.scenes = new Map();
    this.scene = null;
    this.currentSceneName = null;
    this.pending = null;
    this.running = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.threeD = false;
    this.firstPerson = false;
    this.mobiliteHeld = new Set();
    this.mobilitePointerDown = false;
    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    this.handleFirstPersonGesture = this.handleFirstPersonGesture.bind(this);
    window.addEventListener('resize', this.resize);
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', this.handleFirstPersonGesture);
      window.addEventListener('keydown', this.handleFirstPersonGesture);
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(this.resize);
      this.observer.observe(canvas);
    }
    this.resize();
  }

  pointerLocked() {
    return typeof document !== 'undefined' && document.pointerLockElement != null;
  }

  capturePointer() {
    if (this.canvas && typeof this.canvas.requestPointerLock === 'function' && !this.pointerLocked()) {
      try {
        const result = this.canvas.requestPointerLock();
        if (result && typeof result.catch === 'function') result.catch(() => {});
      } catch {
        /* ignore */
      }
    }
    const root =
      typeof document !== 'undefined' && document.documentElement
        ? document.documentElement
        : null;
    if (root && typeof root.requestFullscreen === 'function' && !document.fullscreenElement) {
      try {
        const result = root.requestFullscreen();
        if (result && typeof result.catch === 'function') result.catch(() => {});
      } catch {
        /* ignore */
      }
    }
  }

  releasePointer() {
    if (typeof document === 'undefined') return;
    if (document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch {
        /* ignore */
      }
    }
    if (document.exitFullscreen && document.fullscreenElement) {
      try {
        const result = document.exitFullscreen();
        if (result && typeof result.catch === 'function') result.catch(() => {});
      } catch {
        /* ignore */
      }
    }
  }

  handleFirstPersonGesture() {
    if (this.firstPerson && FIRST_PERSON_SCENES.has(this.currentSceneName)) {
      this.capturePointer();
    }
  }

  register(name, scene) {
    scene.game = this;
    scene.name = name;
    this.scenes.set(name, scene);
    return scene;
  }

  changeScene(name, params = {}) {
    this.pending = { name, params };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
  }

  tick(timestamp) {
    if (!this.running) return;
    this.applyPending();
    const elapsed = Math.max(0, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;
    this.accumulator += Math.min(elapsed, MAX_FRAME_TIME);
    let steps = 0;
    while (this.accumulator >= FIXED_STEP && steps < MAX_STEPS) {
      this.applyPending();
      this.updateFirstPerson();
      if (isMobilite()) {
        if (this.input.pressed.has('PointerPrimary')) this.mobilitePointerDown = true;
        if (this.input.released.has('PointerPrimary')) this.mobilitePointerDown = false;
        updateMobilite(this.input, this.currentSceneName, this.scene, this.mobiliteHeld, this.mobilitePointerDown);
      }
      if (this.scene) this.scene.update(FIXED_STEP);
      if (this.music) this.music.update(FIXED_STEP);
      this.input.update();
      this.accumulator -= FIXED_STEP;
      steps += 1;
    }
    if (steps === MAX_STEPS) this.accumulator = 0;
    this.renderFrame();
    requestAnimationFrame(this.tick);
  }

  moveAxis(positive, negative) {
    const input = this.input;
    if (!input) return 0;
    const held = (key) => input.isDown(key) || input.isDown(`${key}1`);
    return (held(positive) ? 1 : 0) - (held(negative) ? 1 : 0);
  }

  updateFirstPerson() {
    const pointer = this.input ? this.input.pointer : null;
    const active = this.firstPerson && this.scene && FIRST_PERSON_SCENES.has(this.currentSceneName);
    if (!active) {
      if (pointer) pointer.look = false;
      return;
    }
    const scene = this.scene;
    const actor = scene.firstPersonActor ? scene.firstPersonActor() : null;
    if (scene.firstPersonYaw === undefined) {
      scene.firstPersonYaw = actor && actor.heading != null ? actor.heading : 0;
      scene.firstPersonBaseYaw = scene.firstPersonYaw;
    }
    if (pointer) {
      if (this.pointerLocked()) {
        if (pointer.lookDX || pointer.lookDY) {
          scene.firstPersonYaw += pointer.lookDX * FIRST_PERSON.relativeSensitivity;
          pointer.lookDX = 0;
          pointer.lookDY = 0;
        }
      } else {
        scene.firstPersonYaw =
          scene.firstPersonBaseYaw + (pointer.x / this.width - 0.5) * FIRST_PERSON.lookSensitivity;
      }
    }
    const forward = this.moveAxis('up', 'down');
    const strafe = this.moveAxis('right', 'left');
    const yaw = scene.firstPersonYaw;
    const moveX = forward * Math.cos(yaw) - strafe * Math.sin(yaw);
    const moveY = forward * Math.sin(yaw) + strafe * Math.cos(yaw);
    if (pointer) {
      if (Math.abs(moveX) + Math.abs(moveY) > 0.001) {
        pointer.look = true;
        pointer.dragX = moveX * FIRST_PERSON.moveScale;
        pointer.dragY = moveY * FIRST_PERSON.moveScale;
      } else {
        pointer.look = false;
        pointer.dragX = 0;
        pointer.dragY = 0;
      }
    }
  }

  renderFrame() {
    const ctx = this.context;
    setHiddenEntity(this.firstPerson && this.scene ? this.scene.firstPersonActor() : null);
    if (this.canvas.style) {
      const gameplay = this.firstPerson && FIRST_PERSON_SCENES.has(this.currentSceneName);
      const cursor = gameplay ? 'none' : '';
      if (this.canvas.style.cursor !== cursor) this.canvas.style.cursor = cursor;
      const rendering = is8Bit() ? 'pixelated' : '';
      if (this.canvas.style.imageRendering !== rendering) this.canvas.style.imageRendering = rendering;
      if (!gameplay && this.pointerLocked()) this.releasePointer();
    }
    if (is8Bit() && this.ensurePixelBuffer()) {
      const pctx = this.pixelContext;
      pctx.setTransform(PIXEL_WIDTH / this.width, 0, 0, PIXEL_HEIGHT / this.height, 0, 0);
      pctx.imageSmoothingEnabled = false;
      pctx.fillStyle = '#04101d';
      pctx.fillRect(0, 0, this.width, this.height);
      this.renderScene(pctx);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.pixelCanvas, 0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      for (let y = 0; y < this.canvas.height; y += 3) {
        ctx.fillRect(0, y, this.canvas.width, 1);
      }
      ctx.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
      drawMemeOverlay(ctx, this.scene ? this.scene.time : 0, this.width, this.height);
      renderMobilite(ctx, this.input, this.currentSceneName, this.scene, this.mobilitePointerDown);
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
    this.renderScene(ctx);
    drawMemeOverlay(ctx, this.scene ? this.scene.time : 0, this.width, this.height);
    renderMobilite(ctx, this.input, this.currentSceneName);
  }

  renderScene(ctx) {
    if (this.scene) this.scene.render(ctx, this.width, this.height);
    if (this.scene && this.scene.renderMutatorOverlay) this.scene.renderMutatorOverlay(ctx);
    if (this.music && this.music.track && this.music.track.title) {
      drawText(ctx, `NOW PLAYING · ${this.music.track.title}`, this.width - 14, 14, {
        size: 11,
        color: '#eaf6ff',
        align: 'right',
        alpha: 0.92,
        glow: 'rgba(2, 8, 14, 0.85)',
        glowBlur: 6,
      });
    }
  }

  ensurePixelBuffer() {
    if (this.pixelCanvas) return this.pixelCanvas;
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
    const canvas = document.createElement('canvas');
    if (!canvas || typeof canvas.getContext !== 'function') return null;
    canvas.width = PIXEL_WIDTH;
    canvas.height = PIXEL_HEIGHT;
    this.pixelCanvas = canvas;
    this.pixelContext = canvas.getContext('2d', { alpha: false });
    return this.pixelContext ? this.pixelCanvas : null;
  }

  set3D(on) {
    this.threeD = Boolean(on);
    setMode3D(this.threeD);
    this.applyViewTransform();
  }

  setFirstPerson(on) {
    this.firstPerson = Boolean(on);
    setFirstPersonMode(this.firstPerson);
    if (this.scene) {
      this.scene.firstPersonYaw = undefined;
      this.scene.firstPersonBaseYaw = undefined;
    }
    if (!this.firstPerson) {
      setHiddenEntity(null);
      this.releasePointer();
    } else if (FIRST_PERSON_SCENES.has(this.currentSceneName)) {
      this.capturePointer();
    }
  }

  applyViewTransform() {
    const style = this.canvas.style;
    if (!style) return;
    style.transition = 'transform 200ms ease';
    style.transformOrigin = '50% 50%';
    style.transform = this.threeD ? 'perspective(1100px) rotateX(22deg)' : 'none';
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = this.canvas.clientWidth || rect.width || this.width;
    const cssHeight = this.canvas.clientHeight || rect.height || this.height;
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      MAX_DPR,
      1920 / Math.max(1, cssWidth),
      1080 / Math.max(1, cssHeight),
    );
    const backWidth = Math.max(1, Math.round(cssWidth * dpr));
    const backHeight = Math.max(1, Math.round(cssHeight * dpr));
    if (this.canvas.width !== backWidth || this.canvas.height !== backHeight) {
      this.canvas.width = backWidth;
      this.canvas.height = backHeight;
    }
    this.scaleX = this.canvas.width / this.width;
    this.scaleY = this.canvas.height / this.height;
  }

  applyPending() {
    if (!this.pending) return;
    const { name, params } = this.pending;
    this.pending = null;
    const next = this.scenes.get(name);
    if (!next) throw new Error(`Unknown scene "${name}"`);
    if (this.music) {
      if (!this.music.hold) this.music.stop();
      this.music.paused = false;
    }
    if (this.scene) this.scene.exit();
    this.scene = next;
    next.firstPersonYaw = undefined;
    next.firstPersonBaseYaw = undefined;
    this.currentSceneName = name;
    if (typeof next.setMutator === 'function') next.setMutator(params.mutator);
    setCoinMultiplier(mutatorCoinMult(next.mutator));
    next.enter(params);
  }
}
