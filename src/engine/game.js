export const FIXED_STEP = 1 / 60;
export const MAX_FRAME_TIME = 0.25;

export class Game {
  constructor({ canvas, width, height, input, audio = null }) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.input = input;
    this.audio = audio;
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
    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    window.addEventListener('resize', this.resize);
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(this.resize);
      this.observer.observe(canvas);
    }
    this.resize();
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
    while (this.accumulator >= FIXED_STEP) {
      this.applyPending();
      if (this.scene) this.scene.update(FIXED_STEP);
      this.input.update();
      this.accumulator -= FIXED_STEP;
    }
    this.renderFrame();
    requestAnimationFrame(this.tick);
  }

  renderFrame() {
    const ctx = this.context;
    ctx.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
    if (this.scene) this.scene.render(ctx, this.width, this.height);
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = rect.width || this.width;
    const cssHeight = rect.height || this.height;
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
    if (this.scene) this.scene.exit();
    this.scene = next;
    this.currentSceneName = name;
    next.enter(params);
  }
}
