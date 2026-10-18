export const POINTER_KEY = 'PointerPrimary';

export const DEFAULT_BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left1: ['KeyA'],
  right1: ['KeyD'],
  up1: ['KeyW'],
  down1: ['KeyS'],
  left2: ['ArrowLeft'],
  right2: ['ArrowRight'],
  up2: ['ArrowUp'],
  down2: ['ArrowDown'],
  confirm: ['Enter', 'Space', POINTER_KEY],
  pause: ['Escape', 'KeyP'],
  back: ['Escape'],
};

export class Input {
  constructor(bindings = DEFAULT_BINDINGS) {
    this.bindings = bindings;
    this.down = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.pointer = { x: 0, y: 0, down: false, moved: false, originX: 0, originY: 0, dragX: 0, dragY: 0 };
    this.canvas = null;
    this.viewWidth = 0;
    this.viewHeight = 0;
    this.swallowed = new Set(Object.values(bindings).flat());

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
    window.addEventListener('blur', this.handleBlur);
  }

  attach(canvas, viewWidth, viewHeight) {
    this.canvas = canvas;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
  }

  isDown(action) {
    return this.codesFor(action).some((code) => this.down.has(code));
  }

  wasPressed(action) {
    return this.codesFor(action).some((code) => this.pressed.has(code));
  }

  wasReleased(action) {
    return this.codesFor(action).some((code) => this.released.has(code));
  }

  update() {
    this.pressed.clear();
    this.released.clear();
    this.pointer.moved = false;
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
    window.removeEventListener('blur', this.handleBlur);
    if (this.canvas) {
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    }
  }

  codesFor(action) {
    return this.bindings[action] ?? [action];
  }

  handleKeyDown(event) {
    if (this.swallowed.has(event.code)) event.preventDefault();
    if (event.repeat) return;
    this.down.add(event.code);
    this.pressed.add(event.code);
  }

  handleKeyUp(event) {
    if (this.swallowed.has(event.code)) event.preventDefault();
    this.down.delete(event.code);
    this.released.add(event.code);
  }

  handlePointerDown(event) {
    this.updatePointerPosition(event);
    this.pointer.down = true;
    this.pointer.originX = this.pointer.x;
    this.pointer.originY = this.pointer.y;
    this.pointer.dragX = 0;
    this.pointer.dragY = 0;
    this.down.add(POINTER_KEY);
    this.pressed.add(POINTER_KEY);
  }

  handlePointerUp() {
    this.pointer.down = false;
    this.pointer.dragX = 0;
    this.pointer.dragY = 0;
    this.down.delete(POINTER_KEY);
    this.released.add(POINTER_KEY);
  }

  handlePointerMove(event) {
    this.updatePointerPosition(event);
    this.pointer.moved = true;
    if (this.pointer.down) {
      this.pointer.dragX = this.pointer.x - this.pointer.originX;
      this.pointer.dragY = this.pointer.y - this.pointer.originY;
    }
  }

  handleBlur() {
    this.down.clear();
    this.pointer.down = false;
    this.pointer.dragX = 0;
    this.pointer.dragY = 0;
  }

  updatePointerPosition(event) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * this.viewWidth;
    this.pointer.y = ((event.clientY - rect.top) / rect.height) * this.viewHeight;
  }
}
