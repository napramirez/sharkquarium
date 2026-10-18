import { drawText } from './render.js';

export class SelectList {
  constructor(items, options = {}) {
    this.items = items;
    this.index = 0;
    this.wrap = options.wrap ?? true;
    this.spacing = options.spacing ?? 48;
    this.width = options.width ?? 360;
    this.height = options.height ?? 42;
    this.fontSize = options.fontSize ?? 22;
    this.color = options.color ?? '#eaf6ff';
    this.disabledColor = options.disabledColor ?? 'rgba(234, 246, 255, 0.3)';
    this.accentColor = options.accentColor ?? '#ffd166';
    this.glowColor = options.glowColor ?? null;
    this.onChange = options.onChange ?? null;
    this.onConfirm = options.onConfirm ?? null;
    this.time = 0;
    this.bounds = [];
  }

  get selected() {
    return this.items[this.index];
  }

  reset() {
    this.index = 0;
    this.time = 0;
  }

  setIndex(index, notify = false) {
    const clamped = Math.max(0, Math.min(this.items.length - 1, index));
    if (clamped === this.index) return;
    this.index = clamped;
    if (notify && this.onChange) this.onChange(this.selected, this.index);
  }

  move(step) {
    const count = this.items.length;
    if (count === 0) return;
    for (let i = 1; i <= count; i += 1) {
      let next = this.index + step * i;
      if (this.wrap) {
        next = ((next % count) + count) % count;
      } else if (next < 0 || next >= count) {
        return;
      }
      if (!this.items[next].disabled) {
        this.setIndex(next, true);
        return;
      }
    }
  }

  update(dt, input) {
    this.time += dt;
    if (input.pointer.moved) this.applyHover(input.pointer, true);
    if (input.wasPressed('up')) this.move(-1);
    if (input.wasPressed('down')) this.move(1);
    if (input.wasPressed('confirm')) {
      if (input.pointer.down) this.applyHover(input.pointer, false);
      const item = this.selected;
      if (item && !item.disabled && this.onConfirm) this.onConfirm(item, this.index);
    }
  }

  applyHover(pointer, notify) {
    for (let i = 0; i < this.bounds.length; i += 1) {
      const bounds = this.bounds[i];
      const inside =
        pointer.x >= bounds.x &&
        pointer.x <= bounds.x + bounds.width &&
        pointer.y >= bounds.y &&
        pointer.y <= bounds.y + bounds.height;
      if (inside) {
        if (!this.items[i].disabled) this.setIndex(i, notify);
        return;
      }
    }
  }

  render(ctx, centerX, centerY) {
    this.bounds = [];
    const count = this.items.length;
    const top = centerY - ((count - 1) * this.spacing) / 2;
    for (let i = 0; i < count; i += 1) {
      const item = this.items[i];
      const y = top + i * this.spacing;
      const selected = i === this.index && !item.disabled;
      this.bounds.push({
        x: centerX - this.width / 2,
        y: y - this.height / 2,
        width: this.width,
        height: this.height,
      });
      const pulse = selected ? 1 + Math.sin(this.time * 6) * 0.04 : 1;
      const highlighted = !selected && item.highlight === true;
      drawText(ctx, item.label, centerX, y, {
        size: this.fontSize * pulse,
        color: item.disabled
          ? this.disabledColor
          : selected || highlighted
            ? this.accentColor
            : this.color,
        alpha: item.disabled
          ? 0.6
          : selected
            ? 1
            : highlighted
              ? 0.6 + 0.4 * Math.sin(this.time * 6)
              : 0.72,
        glow: selected ? this.glowColor : null,
      });
      if (selected) {
        const offset = Math.sin(this.time * 6) * 3;
        drawChevron(ctx, centerX - this.width * 0.42 - offset, y, this.accentColor, 1);
        drawChevron(ctx, centerX + this.width * 0.42 + offset, y, this.accentColor, -1);
      }
    }
  }
}

function drawChevron(ctx, x, y, color, direction) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  ctx.beginPath();
  ctx.moveTo(-5, -8);
  ctx.lineTo(5, 0);
  ctx.lineTo(-5, 8);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
