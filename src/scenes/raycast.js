import { MinigameScene } from '../engine/minigame.js';
import { SelectList } from '../engine/selectlist.js';
import { drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { clamp } from '../engine/math.js';
import { RAYCAST, COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class RaycastScene extends MinigameScene {
  enter(params = {}) {
    super.enter({ ...params, solo: true });
    this.resultsMenu = new SelectList(
      [
        { label: 'PLAY AGAIN', action: 'again' },
        { label: 'TANKS', action: 'tanks' },
      ],
      {
        glowColor: COLORS.bubble,
        accentColor: COLORS.accent,
        color: COLORS.text,
        spacing: 46,
        fontSize: 20,
        onChange: () => this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.08 }),
        onConfirm: (item) => this.chooseResult(item.action),
      },
    );
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('tanks');
  }

  backScene() {
    return 'tanks';
  }

  finish(won) {
    this.phase = 'results';
    this.won = won;
    this.reward = 0;
    this.resultsMenu.reset();
    this.game.audio.tone({ freq: 523, type: 'triangle', duration: 0.24, volume: 0.24 });
    this.game.audio.tone({ freq: 784, type: 'triangle', duration: 0.34, volume: 0.22, delay: 0.16 });
  }

  generateMaze(width, height, seed) {
    const grid = Array.from({ length: height }, () => Array(width).fill(1));
    let state = seed >>> 0;
    const rnd = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const stack = [[1, 1]];
    grid[1][1] = 0;
    while (stack.length > 0) {
      const [x, y] = stack[stack.length - 1];
      const options = [
        [2, 0],
        [-2, 0],
        [0, 2],
        [0, -2],
      ].filter(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        return nx > 0 && ny > 0 && nx < width - 1 && ny < height - 1 && grid[ny][nx] === 1;
      });
      if (options.length === 0) {
        stack.pop();
        continue;
      }
      const [dx, dy] = options[Math.floor(rnd() * options.length)];
      grid[y + dy / 2][x + dx / 2] = 0;
      grid[y + dy][x + dx] = 0;
      stack.push([x + dx, y + dy]);
    }
    return grid;
  }

  buildRound() {
    const { gridWidth, gridHeight, seed } = RAYCAST;
    this.grid = this.generateMaze(gridWidth, gridHeight, seed);
    this.px = 1.5;
    this.py = 1.5;
    this.angle = 0;
    const open = [];
    for (let y = 1; y < gridHeight - 1; y += 1) {
      for (let x = 1; x < gridWidth - 1; x += 1) {
        if (this.grid[y][x] === 0) open.push({ x: x + 0.5, y: y + 0.5 });
      }
    }
    let farthest = open[0];
    let farthestDistance = -1;
    for (const cell of open) {
      const distance = Math.hypot(cell.x - this.px, cell.y - this.py);
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthest = cell;
      }
    }
    this.exitPoint = farthest;
    this.bubbles = [];
    const pool = open.filter(
      (cell) => cell !== this.exitPoint && Math.hypot(cell.x - this.px, cell.y - this.py) > 3,
    );
    for (let i = 0; i < RAYCAST.bubbles && pool.length > 0; i += 1) {
      const index = Math.floor((i / RAYCAST.bubbles) * pool.length);
      const cell = pool.splice(index, 1)[0];
      this.bubbles.push({ x: cell.x, y: cell.y, taken: false });
    }
    this.collected = 0;
    this.phase = 'play';
  }

  isWall(x, y) {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gy < 0 || gx < 0 || gy >= this.grid.length || gx >= this.grid[0].length) return true;
    return this.grid[gy][gx] === 1;
  }

  move(amount, strafe) {
    const r = RAYCAST.playerRadius;
    const forwardX = Math.cos(this.angle);
    const forwardY = Math.sin(this.angle);
    const dx = (forwardX * amount - forwardY * strafe) * this.dtScale;
    const dy = (forwardY * amount + forwardX * strafe) * this.dtScale;
    if (!this.isWall(this.px + dx + Math.sign(dx) * r, this.py)) this.px += dx;
    if (!this.isWall(this.px, this.py + dy + Math.sign(dy) * r)) this.py += dy;
  }

  updateRound(dt, input) {
    this.dtScale = dt;
    const forward =
      (input.isDown('up') ? 1 : 0) - (input.isDown('down') ? 1 : 0);
    const turn = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    const pointer = input.pointer;
    if (pointer && pointer.down) {
      this.angle += pointer.dragX * 0.006;
    }
    this.angle += turn * RAYCAST.turnSpeed * dt;
    if (forward !== 0) this.move(forward * RAYCAST.moveSpeed, 0);
    for (const bubble of this.bubbles) {
      if (bubble.taken) continue;
      if (Math.hypot(bubble.x - this.px, bubble.y - this.py) < 0.55) {
        bubble.taken = true;
        this.collected += 1;
        this.game.audio.tone({ freq: 880, endFreq: 1320, type: 'triangle', duration: 0.12, volume: 0.2 });
      }
    }
    if (
      this.collected >= this.bubbles.length &&
      Math.hypot(this.exitPoint.x - this.px, this.exitPoint.y - this.py) < 0.6
    ) {
      this.finish(true);
    }
  }

  castColumn(angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    let distance = 0;
    while (distance < RAYCAST.maxDist) {
      distance += RAYCAST.rayStep;
      if (this.isWall(this.px + cos * distance, this.py + sin * distance)) {
        return distance;
      }
    }
    return RAYCAST.maxDist;
  }

  renderRound(ctx) {
    const half = LOGICAL_HEIGHT / 2;
    const ceiling = ctx.createLinearGradient(0, 0, 0, half);
    ceiling.addColorStop(0, '#03121c');
    ceiling.addColorStop(1, '#0a2436');
    ctx.fillStyle = ceiling;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, half);
    const floor = ctx.createLinearGradient(0, half, 0, LOGICAL_HEIGHT);
    floor.addColorStop(0, '#08202e');
    floor.addColorStop(1, '#010509');
    ctx.fillStyle = floor;
    ctx.fillRect(0, half, LOGICAL_WIDTH, LOGICAL_HEIGHT - half);

    const cols = RAYCAST.cols;
    const colWidth = LOGICAL_WIDTH / cols;
    for (let index = 0; index < cols; index += 1) {
      const rayAngle = this.angle - RAYCAST.fov / 2 + (index / cols) * RAYCAST.fov;
      const raw = this.castColumn(rayAngle);
      const corrected = raw * Math.cos(rayAngle - this.angle);
      const wallHeight = (LOGICAL_HEIGHT * RAYCAST.wallHeight) / Math.max(0.001, corrected);
      const top = half - wallHeight / 2;
      const shade = clamp(1 - corrected / RAYCAST.maxDist, 0.12, 1);
      const stripe = index % 8 < 4 ? 1 : 0.86;
      const r = Math.round(90 * shade * stripe + 12);
      const g = Math.round(70 * shade * stripe + 14);
      const b = Math.round(58 * shade * stripe + 16);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(index * colWidth, top, colWidth + 1, wallHeight);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.35 * (1 - shade)})`;
      ctx.fillRect(index * colWidth, top, colWidth + 1, wallHeight);
    }
  }

  renderHud(ctx) {
    fillRoundRect(ctx, 20, 20, 190, 34, 12, 'rgba(4, 16, 29, 0.7)');
    drawText(ctx, `BUBBLES ${this.collected}/${this.bubbles.length}`, 115, 37, {
      size: 15,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 8,
    });
    drawText(ctx, 'FIND EVERY BUBBLE, THEN REACH THE EXIT LIGHT', LOGICAL_WIDTH / 2, 26, {
      size: 13,
      color: COLORS.foam,
      alpha: 0.8,
    });
    drawText(ctx, 'W/S — MOVE   A/D — TURN   DRAG — LOOK      ESC — TANKS', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.75,
    });

    const cell = 8;
    const mapX = LOGICAL_WIDTH - this.grid[0].length * cell - 18;
    const mapY = 18;
    ctx.save();
    ctx.globalAlpha = 0.85;
    fillRoundRect(
      ctx,
      mapX - 4,
      mapY - 4,
      this.grid[0].length * cell + 8,
      this.grid.length * cell + 8,
      6,
      'rgba(3, 12, 20, 0.7)',
    );
    for (let y = 0; y < this.grid.length; y += 1) {
      for (let x = 0; x < this.grid[0].length; x += 1) {
        if (this.grid[y][x] === 1) {
          ctx.fillStyle = 'rgba(150, 180, 200, 0.5)';
          ctx.fillRect(mapX + x * cell, mapY + y * cell, cell - 1, cell - 1);
        }
      }
    }
    for (const bubble of this.bubbles) {
      if (bubble.taken) continue;
      ctx.fillStyle = COLORS.accent;
      ctx.fillRect(mapX + bubble.x * cell - 2, mapY + bubble.y * cell - 2, 4, 4);
    }
    ctx.fillStyle = COLORS.bubble;
    ctx.fillRect(mapX + this.exitPoint.x * cell - 2, mapY + this.exitPoint.y * cell - 2, 4, 4);
    fillCircle(ctx, mapX + this.px * cell, mapY + this.py * cell, 3, COLORS.accent);
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mapX + this.px * cell, mapY + this.py * cell);
    ctx.lineTo(
      mapX + (this.px + Math.cos(this.angle) * 1.4) * cell,
      mapY + (this.py + Math.sin(this.angle) * 1.4) * cell,
    );
    ctx.stroke();
    ctx.restore();
  }

  resultsTitle() {
    return 'RAYCAST TANK';
  }

  resultsHeadline() {
    return this.won ? 'EXIT REACHED!' : 'LOST IN THE WRECK';
  }

  resultsDetail() {
    return `BUBBLES ${this.collected}/${this.bubbles.length}`;
  }
}
