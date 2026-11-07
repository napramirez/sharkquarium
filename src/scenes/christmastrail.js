import { Scene } from '../engine/scene.js';
import { drawWater, drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { loadJSON } from '../engine/storage.js';
import { drawSkinAura, setActiveSkin, setSkinClock, skinByKey } from '../engine/skin.js';
import { auraForShop, setActiveAura } from '../engine/aura.js';
import { accessoryByKey, setActiveBodyAccessory, setActiveCostume, setActiveHeadAccessory } from '../engine/accessory.js';
import { companionByKey, drawCompanion, setActiveCompanion } from '../engine/companion.js';
import { drawTrail, setActiveTrail, trailByKey } from '../engine/trail.js';
import { Shark } from '../entities/shark.js';
import { Snowflake } from '../entities/snowflake.js';
import { SEASON_TRACKS } from '../assets/tracks.js';
import { SHOP_KEY, COLORS, WATER_PALETTE, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

const IDLE_INPUT = { isDown: () => false, pointer: { down: false, dragX: 0, dragY: 0 } };

const HALLOWEEN_COLORS = ['#ff9a3c', '#e2602e', '#b4502a', '#8f3d5c', '#d9b34a'];
const NEWYEAR_COLORS = ['#ffd166', '#63e6ff', '#ff6b9d', '#c6ff7a', '#ffffff'];

const SEASON_CONTENT = {
  christmas: {
    finale: 'WISHES YOU A MERRY CHRISTMAS!',
    head: 'santahat',
    companion: 'snowfish',
    ambient: 'snow',
    colors: null,
    cards: [
      ['The aquarium has gone quiet for the holidays.'],
      ['The fish have been busy —', 'tinsel on the coral, snow on the sand.'],
      ['They left one small gift', 'wrapped in kelp by the warming light.'],
    ],
  },
  halloween: {
    finale: 'WISHES YOU A HAPPY HALLOWEEN!',
    head: 'witchhat',
    companion: 'ghostfish',
    ambient: 'leaf',
    colors: HALLOWEEN_COLORS,
    cards: [
      ['The aquarium has gone quiet for the night.'],
      ['Something down the hall is giggling.', 'The fish pretend not to hear it.'],
      ['They left you a treat by the coral.', 'It is still moving.'],
    ],
  },
  newyear: {
    finale: 'WISHES YOU A HAPPY NEW YEAR!',
    head: 'nyglasses',
    companion: 'fireworkfish',
    ambient: 'confetti',
    colors: NEWYEAR_COLORS,
    cards: [
      ['The aquarium counts down to midnight.'],
      ['The fish have strung up the lights', 'and the deep water is holding its breath.'],
      ['One more lap before the new year —', 'make it a good one.'],
    ],
  },
};

const CARD_TIMING = [
  { at: 0.6, out: 3.6 },
  { at: 3.8, out: 6.8 },
  { at: 7.0, out: 10.2 },
];

const DURATION = 16;

export class ChristmasTrailScene extends Scene {
  enter(params = {}) {
    this.time = 0;
    this.season = SEASON_CONTENT[params.season] ? params.season : 'christmas';
    this.content = SEASON_CONTENT[this.season];
    this.cards = this.content.cards.map((lines, index) => ({ ...CARD_TIMING[index], lines }));
    this.returnScene = params.from === 'theatre' ? 'theatre' : 'menu';
    this.spawnTimer = 0;
    this.flakes = [];
    const shop = loadJSON(SHOP_KEY, {});
    setActiveAura(auraForShop(shop));
    this.skin = skinByKey(shop.skin);
    setActiveHeadAccessory(accessoryByKey(this.content.head));
    setActiveBodyAccessory(accessoryByKey('none'));
    setActiveCostume(accessoryByKey('none'));
    this.trail = trailByKey(shop.trail);
    setActiveCompanion(companionByKey(this.content.companion));
    this.shark = new Shark(LOGICAL_WIDTH * 0.5, LOGICAL_HEIGHT * 0.6);
    if (this.game.music) {
      this.previousTrack = this.game.music.source ?? this.game.music.track;
      this.previousHold = this.game.music.hold;
      const track = SEASON_TRACKS[this.season]?.menu ?? SEASON_TRACKS.christmas.menu;
      this.game.music.play(track);
      this.game.music.hold = false;
    }
  }

  exit() {
    if (!this.game.music || !this.previousTrack) return;
    this.game.music.play(this.previousTrack);
    this.game.music.hold = this.previousHold;
  }

  advance() {
    this.game.changeScene(this.returnScene);
  }

  spawnFlake() {
    const { ambient, colors } = this.content;
    const color = colors ? colors[Math.floor(rand(0, colors.length))] : '#ffffff';
    const fall = ambient === 'confetti' ? rand(34, 78) : ambient === 'leaf' ? rand(24, 54) : rand(16, 40);
    this.flakes.push(new Snowflake(rand(0, LOGICAL_WIDTH), -24, { kind: ambient, color, fall }));
  }

  update(dt) {
    this.time += dt;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(0.08, 0.26);
      this.spawnFlake();
    }
    this.flakes = this.flakes.filter((flake) => {
      flake.update(dt);
      return flake.y < LOGICAL_HEIGHT + 30;
    });
    const drift = this.time * 0.8;
    this.shark.update(dt, IDLE_INPUT);
    this.shark.x = LOGICAL_WIDTH * 0.5 + Math.sin(drift * 0.8) * LOGICAL_WIDTH * 0.26;
    this.shark.y = LOGICAL_HEIGHT * 0.6 + Math.sin(drift * 1.7) * 30;
    this.shark.vx = Math.cos(drift * 0.8) * 90;
    this.shark.vy = Math.sin(drift * 1.7) * 40;
    this.shark.heading = Math.atan2(this.shark.vy, this.shark.vx);
    this.shark.facing = this.shark.vx >= 0 ? 1 : -1;

    const input = this.game.input;
    if (this.time > 0.6 && (input.wasPressed('confirm') || input.wasPressed('back') || input.pointer.down)) {
      this.advance();
      return;
    }
    if (this.time >= DURATION) this.advance();
  }

  renderTree(ctx, x, baseY, scale) {
    ctx.fillStyle = '#7a4a24';
    ctx.fillRect(x - 5 * scale, baseY, 10 * scale, 26 * scale);
    for (let i = 0; i < 3; i += 1) {
      const w = (70 - i * 16) * scale;
      const y = baseY - i * 34 * scale;
      ctx.fillStyle = '#1f7a4d';
      ctx.beginPath();
      ctx.moveTo(x - w, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x, y - 52 * scale);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(x, baseY - 3 * 34 * scale, 6 * scale, 0, TAU);
    ctx.fill();
    const bulbs = [
      [-24, -40], [18, -30], [-8, -70], [26, -78], [0, -104], [-30, -96],
    ];
    for (let i = 0; i < bulbs.length; i += 1) {
      const [bx, by] = bulbs[i];
      ctx.fillStyle = i % 2 === 0 ? '#ff6b81' : '#63e6ff';
      ctx.beginPath();
      ctx.arc(x + bx * scale, baseY + by * scale, 3.4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  renderPumpkin(ctx, x, baseY, scale) {
    const bob = Math.sin(this.time * 2 + x) * 2 * scale;
    ctx.save();
    ctx.translate(x, baseY + bob);
    ctx.fillStyle = '#e8822c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 34 * scale, 30 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 190, 90, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-14 * scale, -6 * scale, 10 * scale, 20 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#241608';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 18 * scale, -6 * scale);
      ctx.lineTo(side * 10 * scale, -16 * scale);
      ctx.lineTo(side * 7 * scale, -4 * scale);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(-16 * scale, 10 * scale);
    ctx.lineTo(-6 * scale, 18 * scale);
    ctx.lineTo(0, 10 * scale);
    ctx.lineTo(6 * scale, 18 * scale);
    ctx.lineTo(16 * scale, 10 * scale);
    ctx.lineTo(10 * scale, 22 * scale);
    ctx.lineTo(-10 * scale, 22 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4a6b2a';
    ctx.lineWidth = 5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -28 * scale);
    ctx.lineTo(4 * scale, -40 * scale);
    ctx.stroke();
    ctx.restore();
  }

  renderGhost(ctx, x, y, scale) {
    const wob = Math.sin(this.time * 2.2 + x) * 6 * scale;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.2 * Math.sin(this.time * 3 + x);
    ctx.fillStyle = 'rgba(232, 244, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y + wob, 18 * scale, Math.PI, TAU);
    ctx.lineTo(x + 18 * scale, y + wob + 22 * scale);
    for (let i = 0; i < 4; i += 1) {
      const wx = x + 18 * scale - (i + 0.5) * 9 * scale;
      ctx.lineTo(wx, y + wob + (i % 2 === 0 ? 16 : 24) * scale);
    }
    ctx.lineTo(x - 18 * scale, y + wob + 22 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a2430';
    ctx.beginPath();
    ctx.arc(x - 6 * scale, y + wob - 2 * scale, 2.6 * scale, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 6 * scale, y + wob - 2 * scale, 2.6 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  renderFirework(ctx, x, y, phase, scale) {
    const t = (this.time * 0.5 + phase) % 1;
    const radius = t * 70 * scale;
    const alpha = (1 - t) * 0.9;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2 * scale;
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * TAU;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * radius * 0.4, y + Math.sin(a) * radius * 0.4);
      ctx.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
      ctx.stroke();
    }
    ctx.fillStyle = '#ff6b9d';
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * TAU + 0.3;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * radius * 0.9, y + Math.sin(a) * radius * 0.9, 2.6 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  renderDecor(ctx) {
    if (this.season === 'halloween') {
      this.renderPumpkin(ctx, 150, LOGICAL_HEIGHT * 0.84, 1);
      this.renderPumpkin(ctx, LOGICAL_WIDTH - 140, LOGICAL_HEIGHT * 0.88, 1.15);
      this.renderGhost(ctx, 250, LOGICAL_HEIGHT * 0.32, 1);
      this.renderGhost(ctx, LOGICAL_WIDTH - 260, LOGICAL_HEIGHT * 0.26, 0.85);
      return;
    }
    if (this.season === 'newyear') {
      this.renderFirework(ctx, 190, LOGICAL_HEIGHT * 0.24, 0, 1);
      this.renderFirework(ctx, LOGICAL_WIDTH - 210, LOGICAL_HEIGHT * 0.2, 0.45, 1.1);
      this.renderFirework(ctx, LOGICAL_WIDTH * 0.5, LOGICAL_HEIGHT * 0.16, 0.8, 0.8);
      return;
    }
    this.renderTree(ctx, 150, LOGICAL_HEIGHT * 0.82, 1);
    this.renderTree(ctx, LOGICAL_WIDTH - 140, LOGICAL_HEIGHT * 0.86, 1.15);
  }

  renderCard(ctx, card) {
    const fadeIn = clamp((this.time - card.at) / 0.8, 0, 1);
    const fadeOut = clamp((card.out - this.time) / 0.8, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    if (alpha <= 0) return;
    card.lines.forEach((line, index) => {
      drawText(ctx, line, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.24 + index * 26, {
        size: 18,
        weight: 400,
        color: COLORS.text,
        alpha: alpha * 0.92,
        glow: 'rgba(207, 239, 255, 0.4)',
        glowBlur: 10,
      });
    });
  }

  renderFinale(ctx) {
    const t = this.time - DURATION + 5.6;
    if (t < 0) return;
    const inAlpha = clamp(t / 0.7, 0, 1);
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 5);
    ctx.fillStyle = `rgba(4, 12, 20, ${0.4 * inAlpha})`;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    const w = 800;
    const h = 132;
    const x = (LOGICAL_WIDTH - w) / 2;
    const y = LOGICAL_HEIGHT * 0.4 - h / 2;
    fillRoundRect(ctx, x, y, w, h, 20, `rgba(10, 39, 64, ${0.9 * inAlpha})`);
    strokeRoundRect(ctx, x, y, w, h, 20, `rgba(255, 209, 102, ${0.6 * inAlpha})`, 2.5);
    drawText(ctx, 'SHARKQUARIUM', LOGICAL_WIDTH / 2, y + 40, {
      size: 30,
      color: COLORS.text,
      alpha: inAlpha,
      glow: COLORS.bubble,
      glowBlur: 20,
    });
    drawText(ctx, this.content.finale, LOGICAL_WIDTH / 2, y + 88, {
      size: 32,
      color: COLORS.accent,
      alpha: inAlpha,
      glow: `rgba(255, 209, 102, ${0.5 + pulse * 0.4})`,
      glowBlur: 24,
    });
  }

  render(ctx) {
    drawWater(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, this.time, WATER_PALETTE);
    this.renderDecor(ctx);
    for (const flake of this.flakes) flake.render(ctx);

    setActiveSkin(this.skin);
    setSkinClock(this.time);
    setActiveTrail(this.trail);
    this.shark.render(ctx);
    drawSkinAura(ctx, this.shark);
    drawTrail(ctx, this.shark);
    drawCompanion(ctx, this.shark);

    drawText(ctx, 'SHARKQUARIUM', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT * 0.14, {
      size: 40,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 24,
      alpha: 0.95,
    });

    for (const card of this.cards) this.renderCard(ctx, card);
    this.renderFinale(ctx);

    drawText(ctx, 'ENTER — SKIP', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 26, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.7,
    });
  }
}