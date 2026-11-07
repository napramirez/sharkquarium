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
    this.visible = options.visible ?? null;
    this.scroll = 0;
    this.onChange = options.onChange ?? null;
    this.onConfirm = options.onConfirm ?? null;
    this.time = 0;
    this.bounds = [];
  }

  get selected() {
    return this.items[this.index];
  }

  visibleCount() {
    const count = this.items.length;
    if (!this.visible) return count;
    return Math.min(this.visible, count);
  }

  reset() {
    this.index = 0;
    this.scroll = 0;
    this.time = 0;
  }

  clampScroll() {
    const count = this.items.length;
    const visible = this.visibleCount();
    if (!this.visible || count <= visible) {
      this.scroll = 0;
      return;
    }
    if (this.index < this.scroll) this.scroll = this.index;
    else if (this.index > this.scroll + visible - 1) this.scroll = this.index - visible + 1;
    this.scroll = Math.max(0, Math.min(this.scroll, count - visible));
  }

  setIndex(index, notify = false) {
    const clamped = Math.max(0, Math.min(this.items.length - 1, index));
    if (clamped === this.index) return;
    this.index = clamped;
    this.clampScroll();
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
    for (const bounds of this.bounds) {
      const inside =
        pointer.x >= bounds.x &&
        pointer.x <= bounds.x + bounds.width &&
        pointer.y >= bounds.y &&
        pointer.y <= bounds.y + bounds.height;
      if (inside) {
        if (!this.items[bounds.index].disabled) this.setIndex(bounds.index, notify);
        return;
      }
    }
  }

  render(ctx, centerX, centerY) {
    this.bounds = [];
    const count = this.items.length;
    const visible = this.visibleCount();
    this.clampScroll();
    const top = centerY - ((visible - 1) * this.spacing) / 2;
    for (let row = 0; row < visible; row += 1) {
      const i = this.scroll + row;
      const item = this.items[i];
      const y = top + row * this.spacing;
      const selected = i === this.index && !item.disabled;
      this.bounds.push({
        x: centerX - this.width / 2,
        y: y - this.height / 2,
        width: this.width,
        height: this.height,
        index: i,
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
    if (this.visible && count > visible) {
      this.renderScrollHints(ctx, centerX, top, visible, count);
    }
  }

  renderScrollHints(ctx, centerX, top, visible, count) {
    const firstY = top - this.spacing * 0.5 - this.height * 0.2;
    const lastY = top + (visible - 1) * this.spacing + this.spacing * 0.5 + this.height * 0.2;
    ctx.save();
    ctx.fillStyle = 'rgba(207, 239, 255, 0.7)';
    const bob = Math.sin(this.time * 4) * 2;
    if (this.scroll > 0) {
      drawCaret(ctx, centerX, firstY - 10 + bob, -1);
    }
    if (this.scroll + visible < count) {
      drawCaret(ctx, centerX, lastY + 10 - bob, 1);
    }
    ctx.restore();
  }
}

function drawCaret(ctx, x, y, direction) {
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 5 * direction);
  ctx.lineTo(x + 8, y - 5 * direction);
  ctx.lineTo(x, y + 5 * direction);
  ctx.closePath();
  ctx.fill();
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
