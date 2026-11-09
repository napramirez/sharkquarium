import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { clamp, TAU } from '../engine/math.js';
import { drawGiftShape } from '../engine/giftshapes.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const NET_Y = 172;
const PLAYER = { x: 480, y: 486 };
const WISHLIST = { x: 300, y: 404, w: 360, h: 64 };

export class SantaPeekScene extends MinigameScene {
  buildRound() {
    this.phase = 'play';
    this.wishlist = ['star', 'heart', 'triangle'];
    const shapes = ['star', 'square', 'heart', 'circle', 'triangle', 'diamond', 'square', 'circle'];
    this.presents = shapes.map((shape, i) => ({
      x: 190 + i * 84,
      y: NET_Y,
      shape,
      taken: false,
    }));
    this.correctTotal = this.presents.filter((gift) => this.wishlist.includes(gift.shape)).length;
    this.collected = 0;
    this.peek = 0;
    this.inspecting = 0;
    this.cameraX = 200;
    this.cameraDir = 1;
    this.cameraSpeed = 135;
    this.cameraR = 78;
    this.timeLeft = 110;
    this.status = '';
    this.statusTimer = 0;
    this.caught = false;
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2;
  }

  updateRound(dt, input) {
    this.timeLeft -= dt;
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.inspecting = Math.max(0, this.inspecting - dt);

    const peeking = input.isDown('KeyE');
    this.peek = clamp(this.peek + (peeking ? 55 : -32) * dt, 0, 100);

    this.cameraX += this.cameraDir * this.cameraSpeed * dt;
    if (this.cameraX > 810) {
      this.cameraX = 810;
      this.cameraDir = -1;
    } else if (this.cameraX < 150) {
      this.cameraX = 150;
      this.cameraDir = 1;
    }

    if (input.pressed && input.pressed.has('PointerPrimary')) {
      this.handleClick(input.pointer.x, input.pointer.y);
      if (this.phase !== 'play') return;
    }

    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finish(false);
    }
  }

  handleClick(x, y) {
    if (x >= WISHLIST.x && x <= WISHLIST.x + WISHLIST.w && y >= WISHLIST.y && y <= WISHLIST.y + WISHLIST.h) {
      this.inspecting = 5;
      this.setStatus('LOOKING AT THE WISHLIST');
      this.game.audio.tone({ freq: 520, duration: 0.06, volume: 0.12 });
      return;
    }
    let hit = -1;
    this.presents.forEach((gift, i) => {
      if (gift.taken) return;
      if (Math.hypot(gift.x - x, gift.y - y) < 36) hit = i;
    });
    if (hit < 0) return;
    const gift = this.presents[hit];
    if (this.peek <= 5) {
      this.setStatus('HOLD E TO PEEK — YOU CAN BARELY SEE');
      return;
    }
    if (Math.abs(this.cameraX - gift.x) < this.cameraR) {
      this.caught = true;
      this.finish(false);
      return;
    }
    if (!this.wishlist.includes(gift.shape)) {
      this.setStatus('WRONG SHAPE — NOT YOURS');
      this.peek = Math.max(0, this.peek - 25);
      this.game.audio.tone({ freq: 180, endFreq: 90, duration: 0.2, volume: 0.2 });
      return;
    }
    gift.taken = true;
    this.collected += 1;
    this.setStatus('SNUCK IT OUT!');
    this.game.audio.tone({ freq: 560, endFreq: 920, type: 'triangle', duration: 0.14, volume: 0.2 });
    if (this.collected >= this.correctTotal) this.finish(true);
  }

  renderRound(ctx) {
    ctx.strokeStyle = 'rgba(180, 200, 210, 0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.moveTo(150 + i * 82, NET_Y - 60);
      ctx.lineTo(150 + i * 82, NET_Y + 50);
      ctx.stroke();
    }
    for (let j = 0; j < 4; j += 1) {
      ctx.beginPath();
      ctx.moveTo(150, NET_Y - 60 + j * 36);
      ctx.lineTo(806, NET_Y - 60 + j * 36);
      ctx.stroke();
    }

    for (const gift of this.presents) {
      if (gift.taken) continue;
      const visible = this.peek > 5;
      drawGiftShape(
        ctx,
        gift.x,
        gift.y,
        18,
        visible ? gift.shape : 'square',
        visible ? (this.wishlist.includes(gift.shape) ? '#ffd166' : '#8b98a5') : '#3a4a52',
      );
    }

    const sweep = (this.cameraX - 150) / 660;
    ctx.fillStyle = 'rgba(255, 90, 90, 0.14)';
    ctx.beginPath();
    ctx.arc(this.cameraX, NET_Y + 20, this.cameraR, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 107, 129, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    fillRoundRect(ctx, this.cameraX - 16, NET_Y - 92, 32, 26, 6, '#39434c');
    fillCircle(ctx, this.cameraX, NET_Y - 72, 6, '#ff6b81');
    drawText(ctx, 'CAMERA', this.cameraX, NET_Y - 104, { size: 10, color: COLORS.danger, alpha: 0.8 });

    fillRoundRect(ctx, WISHLIST.x, WISHLIST.y, WISHLIST.w, WISHLIST.h, 14, 'rgba(10, 39, 64, 0.85)');
    strokeRoundRect(ctx, WISHLIST.x, WISHLIST.y, WISHLIST.w, WISHLIST.h, 14, 'rgba(207, 239, 255, 0.35)', 2);
    drawText(ctx, 'WISHLIST', WISHLIST.x + 54, WISHLIST.y + 32, { size: 12, color: COLORS.accent });
    this.wishlist.forEach((shape, i) => {
      drawGiftShape(ctx, WISHLIST.x + 130 + i * 70, WISHLIST.y + 32, 18, shape, '#ffd166');
    });
    if (this.inspecting > 0) {
      this.wishlist.forEach((shape, i) => {
        drawGiftShape(ctx, 360 + i * 120, 340, 30, shape, '#ffd166');
      });
      drawText(ctx, 'THESE ARE YOURS', LOGICAL_WIDTH / 2, 296, { size: 14, color: COLORS.accent, alpha: Math.min(1, this.inspecting) });
    }

    this.renderSleeper(ctx);

    drawText(ctx, "SANTA'S NET", LOGICAL_WIDTH / 2, 46, {
      size: 28,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 18,
    });
    drawText(ctx, 'HOLD E — PEEK      CLICK THE WISHLIST — STUDY THE SHAPES      CLICK A PRESENT — SNEAK IT OUT (AVOID THE CAMERA)', LOGICAL_WIDTH / 2, 80, {
      size: 11,
      color: COLORS.foam,
      alpha: 0.85,
    });

    fillRoundRect(ctx, 60, LOGICAL_HEIGHT - 78, 200, 12, 6, 'rgba(4, 16, 29, 0.6)');
    fillRoundRect(ctx, 60, LOGICAL_HEIGHT - 78, 200 * (this.peek / 100), 12, 6, this.peek > 5 ? COLORS.bubble : COLORS.textDim);
    drawText(ctx, 'PEEK', 160, LOGICAL_HEIGHT - 90, { size: 10, color: COLORS.textDim });

    const ratio = Math.max(0, this.timeLeft / 110);
    fillRoundRect(ctx, 330, LOGICAL_HEIGHT - 78, LOGICAL_WIDTH - 430, 12, 6, 'rgba(4, 16, 29, 0.6)');
    fillRoundRect(ctx, 330, LOGICAL_HEIGHT - 78, (LOGICAL_WIDTH - 430) * ratio, 12, 6, ratio < 0.2 ? COLORS.danger : COLORS.accent);
    drawText(ctx, `${Math.ceil(this.timeLeft)}s`, LOGICAL_WIDTH - 90, LOGICAL_HEIGHT - 90, { size: 10, color: COLORS.textDim });

    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 360, { size: 14, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
    }
  }

  renderSleeper(ctx) {
    const awake = this.peek > 5;
    fillCircle(ctx, PLAYER.x, PLAYER.y, 22, COLORS.accent);
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.moveTo(PLAYER.x - 20, PLAYER.y);
    ctx.lineTo(PLAYER.x - 40, PLAYER.y - 12);
    ctx.lineTo(PLAYER.x - 40, PLAYER.y + 12);
    ctx.closePath();
    ctx.fill();
    if (awake) {
      fillCircle(ctx, PLAYER.x + 6, PLAYER.y - 5, 4, '#10233a');
      fillCircle(ctx, PLAYER.x + 16, PLAYER.y - 5, 4, '#10233a');
    } else {
      ctx.strokeStyle = '#10233a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PLAYER.x + 2, PLAYER.y - 5);
      ctx.lineTo(PLAYER.x + 10, PLAYER.y - 5);
      ctx.moveTo(PLAYER.x + 12, PLAYER.y - 5);
      ctx.lineTo(PLAYER.x + 20, PLAYER.y - 5);
      ctx.stroke();
      drawText(ctx, 'Z z z', PLAYER.x + 34, PLAYER.y - 30, { size: 12, color: COLORS.textDim, alpha: 0.7 });
    }
  }

  resultsTitle() {
    return "SANTA'S NET";
  }

  resultsHeadline() {
    if (this.won) return 'GOT YOUR GIFTS!';
    return this.caught ? 'CAUGHT BY THE CAMERA' : 'OUT OF TIME';
  }

  resultsDetail() {
    return `${this.collected} / ${this.correctTotal} WISHED GIFTS SNUCK OUT`;
  }
}
