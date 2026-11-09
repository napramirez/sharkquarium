import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { clamp, TAU } from '../engine/math.js';
import { drawGiftShape } from '../engine/giftshapes.js';
import { drawWreckLounge } from '../engine/lounge.js';
import { applyWardrobe } from '../engine/wardrobe.js';
import { drawSkinAura } from '../engine/skin.js';
import { drawTrail } from '../engine/trail.js';
import { drawCompanion } from '../engine/companion.js';
import { Shark } from '../entities/shark.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const NET_Y = 158;
const PLAYER = { x: 480, y: 480 };
const WISHLIST = { x: 300, y: 404, w: 360, h: 62 };

export class SantaPeekScene extends MinigameScene {
  buildRound() {
    this.phase = 'play';
    this.shark = new Shark(PLAYER.x, PLAYER.y, { pointer: false });
    this.shark.facing = 1;
    applyWardrobe(this.shop, 0);
    this.wishlist = ['star', 'heart', 'triangle', 'circle'];
    const shapes = [
      'star', 'star_flaw', 'square', 'heart', 'heart_flaw', 'circle', 'triangle', 'triangle_flaw',
      'diamond', 'star', 'square', 'heart_flaw', 'circle', 'triangle', 'diamond', 'heart',
    ];
    this.presents = shapes.map((shape, i) => ({
      x: 172 + i * 41,
      y: 130 + ((i * 53) % 78),
      shape,
      taken: false,
    }));
    this.correctTotal = this.presents.filter((gift) => this.wishlist.includes(gift.shape)).length;
    this.collected = 0;
    this.peek = 0;
    this.eyesOpen = false;
    this.blind = false;
    this.inspecting = 0;
    this.cameraX = 220;
    this.cameraDir = 1;
    this.cameraSpeed = 265;
    this.cameraR = 72;
    this.timeLeft = 120;
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
    this.shark.age += dt;

    const peeking = input.isDown('KeyE');
    this.peek = clamp(this.peek + (peeking ? 55 : -40) * dt, 0, 100);
    this.eyesOpen = peeking && this.peek > 6 && this.peek < 98;
    this.blind = peeking && this.peek >= 98;
    if (this.blind && this.statusTimer <= 0) this.setStatus('EYES CLOSING — LET GO AND PEEK AGAIN');

    this.cameraX += this.cameraDir * this.cameraSpeed * dt;
    if (this.cameraX > 800) {
      this.cameraX = 800;
      this.cameraDir = -1;
    } else if (this.cameraX < 160) {
      this.cameraX = 160;
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
      if (Math.hypot(gift.x - x, gift.y - y) < 28) hit = i;
    });
    if (hit < 0) return;
    const gift = this.presents[hit];
    if (!this.eyesOpen) {
      this.setStatus('YOUR EYES ARE CLOSED — HOLD E TO PEEK (BUT NOT TOO LONG)');
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
    drawWreckLounge(ctx, this.time);

    for (const gift of this.presents) {
      if (gift.taken) continue;
      if (this.eyesOpen) {
        drawGiftShape(
          ctx,
          gift.x,
          gift.y,
          13,
          gift.shape,
          this.wishlist.includes(gift.shape) ? '#ffd166' : '#8b98a5',
        );
      } else {
        ctx.globalAlpha = 0.14;
        fillCircle(ctx, gift.x, gift.y, 7, '#0a1418');
        ctx.globalAlpha = 1;
      }
    }

    ctx.strokeStyle = 'rgba(180, 200, 210, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(138, 82);
    ctx.quadraticCurveTo(480, 108, 822, 82);
    ctx.stroke();
    for (let i = 0; i <= 16; i += 1) {
      const topX = 150 + i * 41;
      const drift = (topX - 480) * 0.12;
      ctx.beginPath();
      ctx.moveTo(topX, 86);
      ctx.quadraticCurveTo(topX + drift * 0.4, 164, topX + drift, 232);
      ctx.stroke();
    }
    for (let j = 0; j <= 5; j += 1) {
      const y = 96 + j * 28;
      const sag = 10 + j * 4;
      ctx.beginPath();
      ctx.moveTo(146 - j * 3, y);
      ctx.quadraticCurveTo(480, y + sag, 814 + j * 3, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(180, 200, 210, 0.28)';
    ctx.beginPath();
    ctx.moveTo(150, 232);
    ctx.quadraticCurveTo(480, 268, 810, 232);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 90, 90, 0.16)';
    ctx.beginPath();
    ctx.arc(this.cameraX, NET_Y + 16, this.cameraR, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 107, 129, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    fillRoundRect(ctx, this.cameraX - 15, NET_Y - 86, 30, 24, 6, '#39434c');
    fillCircle(ctx, this.cameraX, NET_Y - 68, 5, '#ff6b81');
    drawText(ctx, 'CAMERA', this.cameraX, NET_Y - 98, { size: 10, color: COLORS.danger, alpha: 0.85 });

    this.shark.render(ctx);
    drawSkinAura(ctx, this.shark);
    drawTrail(ctx, this.shark);
    drawCompanion(ctx, this.shark);
    if (!this.eyesOpen) {
      drawText(ctx, 'Z z z', PLAYER.x + 40, PLAYER.y - 34, { size: 12, color: COLORS.textDim, alpha: 0.7 });
    }

    fillRoundRect(ctx, WISHLIST.x, WISHLIST.y, WISHLIST.w, WISHLIST.h, 14, 'rgba(8, 26, 34, 0.88)');
    strokeRoundRect(ctx, WISHLIST.x, WISHLIST.y, WISHLIST.w, WISHLIST.h, 14, 'rgba(207, 239, 255, 0.35)', 2);
    drawText(ctx, 'WISHLIST', WISHLIST.x + 44, WISHLIST.y + 31, { size: 12, color: COLORS.accent });
    this.wishlist.forEach((shape, i) => {
      drawGiftShape(ctx, WISHLIST.x + 110 + i * 58, WISHLIST.y + 31, 16, shape, '#ffd166');
    });
    if (this.inspecting > 0) {
      this.wishlist.forEach((shape, i) => {
        drawGiftShape(ctx, LOGICAL_WIDTH / 2 - 165 + i * 110, 344, 28, shape, '#ffd166');
      });
      drawText(ctx, 'THESE ARE YOURS', LOGICAL_WIDTH / 2, 300, {
        size: 14,
        color: COLORS.accent,
        alpha: Math.min(1, this.inspecting),
      });
    }

    drawText(ctx, "SANTA'S NET", LOGICAL_WIDTH / 2, 34, {
      size: 26,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 18,
    });
    drawText(ctx, 'HOLD E — PEEK (NOT TOO LONG)      CLICK THE WISHLIST — STUDY THE SHAPES      CLICK A PRESENT — SNEAK IT OUT', LOGICAL_WIDTH / 2, 62, {
      size: 10,
      color: COLORS.foam,
      alpha: 0.85,
    });

    fillRoundRect(ctx, 60, LOGICAL_HEIGHT - 34, 200, 10, 5, 'rgba(4, 16, 29, 0.65)');
    fillRoundRect(ctx, 60, LOGICAL_HEIGHT - 34, 200 * (this.peek / 100), 10, 5, this.blind ? COLORS.danger : this.peek > 5 ? COLORS.bubble : COLORS.textDim);
    drawText(ctx, 'PEEK', 160, LOGICAL_HEIGHT - 46, { size: 10, color: COLORS.textDim });

    const ratio = Math.max(0, this.timeLeft / 120);
    fillRoundRect(ctx, 330, LOGICAL_HEIGHT - 34, LOGICAL_WIDTH - 430, 10, 5, 'rgba(4, 16, 29, 0.65)');
    fillRoundRect(ctx, 330, LOGICAL_HEIGHT - 34, (LOGICAL_WIDTH - 430) * ratio, 10, 5, ratio < 0.2 ? COLORS.danger : COLORS.accent);
    drawText(ctx, `${Math.ceil(this.timeLeft)}s`, LOGICAL_WIDTH - 90, LOGICAL_HEIGHT - 46, { size: 10, color: COLORS.textDim });

    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 360, { size: 13, color: COLORS.accent, alpha: Math.min(1, this.statusTimer) });
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
