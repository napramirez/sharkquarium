import { MinigameScene } from '../engine/minigame.js';
import { drawWater, drawText, fillRoundRect } from '../engine/render.js';
import { circleOverlap } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { setSkinClock, skinCatalog, skinByKey } from '../engine/skin.js';
import { drawMegasquid, drawMegasquidEye } from '../entities/megasquid.js';
import { drawStingrayBody } from '../entities/stingray.js';
import { drawMorayBody } from '../entities/eel.js';
import {
  TRENCH_EXPLORE as TX,
  COLORS,
  WATER_PALETTE,
  SHOP_KEY,
  EEL,
  EEL_VARIANTS,
  LOGICAL_WIDTH as W,
  LOGICAL_HEIGHT as H,
} from '../config.js';

const SURFACE_Y = 30;
const SQUID_RADIUS = 46;
const RAY_SKINS = skinCatalog().filter((skin) => skin.ray);
const MOUTH = [
  'SPACE — KICK UP      A/D — DRIVE SIDEWAYS      SINK BELOW THE NET',
  'GRAB EVERY COIN BUBBLE — THE TRENCH CLEARS WHEN THEY ARE ALL YOURS',
  'THE WINCH IS RATTLING — SINK UNTIL THE NET IS OVER YOUR HEAD',
  'EVERY TRENCH REACHES DEEPER AND THE NET COMES FASTER',
];

export class TrenchExploreScene extends MinigameScene {
  enter(params = {}) {
    this.theatre = Boolean(params.from === 'theatre');
    super.enter({ ...params, solo: true });
    this.enemyMult = this.mutator ? this.mutator.knobs.enemySpeedScale ?? 1 : 1;
    if (params.rising) {
      this.startTrench(TX.trenches - 1);
      this.startRising();
      this.phase = 'rising';
    }
  }

  firstPersonActor() {
    return null;
  }

  buildRound() {
    this.spawnSharks([{ x: W / 2, y: 150 }]);
    this.camY = 0;
    this.collected = 0;
    this.trenchIndex = 0;
    this.totalCoins = 0;
    this.coinBubbles = [];
    this.bossNets = [];
    this.wreckPieces = [];
    this.squid = null;
    this.shaftBottom = 0;
    this.netMax = 0;
    this.risingTimer = 0;
    this.risingBroken = false;
    this.trenchBanner = 0;
    this.note = 0;
    this.noteText = '';
    this.critters = [];
    this.floorTop = 0;
    this.catchPopup = 0;
    this.catchText = '';
    this.startTrench(0);
    this.phase = 'play';
  }

  startTrench(index) {
    this.trenchIndex = index;
    this.netMax = TX.netMaxDepths[Math.min(index, TX.netMaxDepths.length - 1)];
    this.shaftBottom = this.netMax + TX.depthRoom;
    this.floorTop = this.shaftBottom - 14;
    this.coinTarget = TX.coinCounts[Math.min(index, TX.coinCounts.length - 1)];
    this.collected = 0;
    this.coinBubbles = [];
    const top = this.netMax + 80;
    const bottom = this.floorTop - 90;
    for (let i = 0; i < this.coinTarget; i += 1) {
      this.coinBubbles.push({
        x: rand(70, W - 70),
        y: rand(top, bottom),
        radius: rand(TX.coinRadius - 2, TX.coinRadius + 2),
        phase: rand(0, TAU),
      });
    }
    this.buildCritters(index);
    this.net = { depth: 0, state: 'idle', timer: TX.netIdle, progress: 0 };
    this.trenchBanner = 3;
    this.noteText = MOUTH[Math.min(index, MOUTH.length - 1)];
    this.note = 3;
    this.trenchStart = index;
  }

  buildCritters(index) {
    this.critters = [];
    const top = this.netMax + 70;
    const floorTop = this.floorTop;
    const mid = (y) => clamp(y, top + 30, floorTop - 90);
    for (let i = 0; i < 3 + index; i += 1) {
      this.critters.push({
        kind: 'moray',
        x: rand(90, W - 90),
        y: mid(rand(top, floorTop - 140)),
        dir: Math.random() < 0.5 ? -1 : 1,
        phase: rand(0, TAU),
        speed: rand(45, 95),
        variant: i % EEL_VARIANTS.length,
      });
    }
    for (let i = 0; i < 9; i += 1) {
      this.critters.push({
        kind: 'weed',
        x: rand(30, W - 30),
        baseY: floorTop,
        h: rand(46, 120),
        phase: rand(0, TAU),
      });
    }
    for (let i = 0; i < 4; i += 1) {
      this.critters.push({
        kind: 'crab',
        x: rand(60, W - 60),
        y: floorTop - 8,
        dir: Math.random() < 0.5 ? -1 : 1,
        phase: rand(0, TAU),
        flee: 0,
        state: 'out',
        burrow: 0,
      });
    }
    for (let i = 0; i < 3; i += 1) {
      const angle = rand(0, TAU);
      this.critters.push({
        kind: i % 2 === 0 ? 'octopus' : 'squid',
        x: rand(90, W - 90),
        y: mid(rand(top + 40, floorTop - 100)),
        vx: Math.cos(angle) * rand(20, 55),
        vy: Math.sin(angle) * rand(14, 36),
        jet: rand(0.4, 2),
        phase: rand(0, TAU),
      });
    }
    this.shrimpTarget = 6;
    this.shrimpTimer = 0;
    for (let i = 0; i < this.shrimpTarget; i += 1) this.critters.push(this.newShrimp());
    const rayCount = Math.min(RAY_SKINS.length, 8);
    const rayOffset = (index * 3) % RAY_SKINS.length;
    for (let i = 0; i < rayCount; i += 1) {
      const skin = RAY_SKINS[(i + rayOffset) % RAY_SKINS.length];
      this.critters.push({
        kind: 'ray',
        skin: skin.key,
        label: skin.label,
        baby: Boolean(skin.rayBaby),
        x: rand(90, W - 90),
        y: mid(rand(top, floorTop - 150)),
        vx: rand(-50, 50),
        vy: rand(-16, 16),
        face: 1,
        phase: rand(0, TAU),
        caught: false,
      });
    }
  }

  unlockSkin(key, label) {
    const shop = loadJSON(SHOP_KEY, { owned: ['natural'] });
    shop.owned = Array.isArray(shop.owned) ? shop.owned : ['natural'];
    if (!shop.owned.includes(key)) {
      shop.owned.push(key);
      saveJSON(SHOP_KEY, shop);
      this.catchText = `NEW FREE SKIN — ${label}`;
      this.catchPopup = 3.6;
      this.game.audio.tone({ freq: 600, endFreq: 1200, type: 'triangle', duration: 0.4, volume: 0.24 });
      this.game.audio.tone({ freq: 900, endFreq: 1500, type: 'triangle', duration: 0.32, volume: 0.18, delay: 0.2 });
    } else {
      this.catchText = `${label} ALREADY CAUGHT`;
      this.catchPopup = 2.2;
      this.game.audio.tone({ freq: 520, type: 'triangle', duration: 0.2, volume: 0.16 });
    }
    this.particles.burst(W / 2, this.net ? this.net.depth - this.camY : 100, {
      count: 22,
      speed: 220,
      life: 0.9,
      colors: [COLORS.bubble, '#ffffff', COLORS.accent],
      buoyancy: -60,
    });
  }

  updateCritters(dt) {
    const player = this.players[0];
    for (const c of this.critters) {
      if (c.kind === 'moray') {
        c.x += c.dir * c.speed * dt;
        if (c.x < 50) c.dir = 1;
        if (c.x > W - 50) c.dir = -1;
      } else if (c.kind === 'crab') {
        const d = Math.hypot(c.x - player.x, c.y - player.y);
        if (c.state === 'out') {
          if (d < 150) {
            c.flee = 1;
            c.dir = c.x >= player.x ? 1 : -1;
          } else {
            c.flee = Math.max(0, c.flee - dt);
          }
          if (d < 380) c.dir = c.x >= player.x ? 1 : -1;
          const speed = c.flee > 0 ? 330 : 42 + clamp(1 - d / 380, 0, 1) * 120;
          c.x += c.dir * speed * dt;
          if (c.x < 46) {
            c.x = 46;
            c.dir = 1;
          }
          if (c.x > W - 46) {
            c.x = W - 46;
            c.dir = -1;
          }
          const cornered = c.x <= 48 || c.x >= W - 48;
          if (cornered && d < 190) {
            c.state = 'down';
            this.particles.burst(c.x, c.y + 6, {
              count: 10,
              speed: 120,
              life: 0.6,
              colors: [COLORS.sand, COLORS.sandDark, '#8a7a58'],
              buoyancy: 60,
            });
          }
        } else if (c.state === 'down') {
          c.burrow = Math.min(1, c.burrow + dt * 1.8);
          if (c.burrow >= 1) c.state = 'under';
        } else if (c.state === 'under') {
          if (d > 320) {
            c.state = 'up';
            this.particles.burst(c.x, c.y + 6, {
              count: 10,
              speed: 120,
              life: 0.6,
              colors: [COLORS.sand, COLORS.sandDark, '#8a7a58'],
              buoyancy: -40,
            });
          }
        } else if (c.state === 'up') {
          c.burrow = Math.max(0, c.burrow - dt * 1.4);
          if (c.burrow <= 0) c.state = 'out';
        }
      } else if (c.kind === 'octopus' || c.kind === 'squid') {
        let prey = null;
        let pd = 320;
        for (const s of this.critters) {
          if (s.kind !== 'shrimp' || s.dead) continue;
          const d = Math.hypot(s.x - c.x, s.y - c.y);
          if (d < pd) {
            pd = d;
            prey = s;
          }
        }
        if (prey) {
          const a = Math.atan2(prey.y - c.y, prey.x - c.x);
          c.vx += Math.cos(a) * 260 * dt;
          c.vy += Math.sin(a) * 210 * dt;
        } else {
          c.jet = (c.jet ?? 1) - dt;
          if (c.jet <= 0) {
            c.jet = rand(1.2, 2.6);
            const a = rand(0, TAU);
            c.vx = Math.cos(a) * rand(20, 58);
            c.vy = Math.sin(a) * rand(14, 38);
          }
        }
        c.vx *= Math.max(0, 1 - 1.2 * dt);
        c.vy *= Math.max(0, 1 - 1.2 * dt);
        c.vx = clamp(c.vx, -170, 170);
        c.vy = clamp(c.vy, -150, 150);
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.x < 60) {
          c.x = 60;
          c.vx = Math.abs(c.vx);
        }
        if (c.x > W - 60) {
          c.x = W - 60;
          c.vx = -Math.abs(c.vx);
        }
        if (c.y < this.netMax + 60) {
          c.y = this.netMax + 60;
          c.vy = Math.abs(c.vy);
        }
        if (c.y > this.floorTop - 44) {
          c.y = this.floorTop - 44;
          c.vy = -Math.abs(c.vy);
        }
        if (prey && Math.hypot(prey.x - c.x, prey.y - c.y) < 20) {
          prey.dead = true;
          this.particles.burst(prey.x, prey.y, {
            count: 8,
            speed: 120,
            life: 0.5,
            colors: ['#ff9a7a', '#ffd0b8', '#ffffff'],
            buoyancy: -20,
          });
          this.game.audio.tone({ freq: 520, endFreq: 900, type: 'triangle', duration: 0.08, volume: 0.1 });
        }
      } else if (c.kind === 'shrimp') {
        let fx = 0;
        let fy = 0;
        let fd = Infinity;
        for (const o of this.critters) {
          if (o.kind !== 'octopus' && o.kind !== 'squid') continue;
          const d = Math.hypot(o.x - c.x, o.y - c.y);
          if (d < fd) {
            fd = d;
            fx = o.x;
            fy = o.y;
          }
        }
        c.dart -= dt;
        if (c.dart <= 0) {
          c.dart = rand(0.5, 1.5);
          let a = rand(0, TAU);
          if (fd < 210) a = Math.atan2(c.y - fy, c.x - fx) + rand(-0.5, 0.5);
          c.vx = Math.cos(a) * rand(120, 240);
          c.vy = Math.sin(a) * rand(90, 180);
        }
        c.vx *= Math.max(0, 1 - 2.4 * dt);
        c.vy *= Math.max(0, 1 - 2.4 * dt);
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.x < 50) {
          c.x = 50;
          c.vx = Math.abs(c.vx);
        }
        if (c.x > W - 50) {
          c.x = W - 50;
          c.vx = -Math.abs(c.vx);
        }
        if (c.y < this.netMax + 70) {
          c.y = this.netMax + 70;
          c.vy = Math.abs(c.vy);
        }
        if (c.y > this.floorTop - 60) {
          c.y = this.floorTop - 60;
          c.vy = -Math.abs(c.vy);
        }
      } else if (c.kind === 'ray' && !c.caught) {
        const dx = c.x - player.x;
        const dy = c.y - player.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 220) {
          c.vx += (dx / d) * 210 * dt;
          c.vy += (dy / d) * 150 * dt;
        }
        c.vx += Math.sin(this.time * 0.7 + c.phase) * 8 * dt;
        c.vx *= Math.max(0, 1 - 1.4 * dt);
        c.vy *= Math.max(0, 1 - 1.6 * dt);
        c.x = clamp(c.x + c.vx * dt, 50, W - 50);
        c.y = clamp(c.y + c.vy * dt, 70, this.floorTop - 70);
        if (c.vx > 12) c.face = 1;
        else if (c.vx < -12) c.face = -1;
        if (this.net.depth > 0 && c.y <= this.net.depth) {
          c.caught = true;
          this.unlockSkin(c.skin, c.label);
        }
      }
    }
    this.critters = this.critters.filter((c) => !c.dead);
    const shrimpNow = this.critters.filter((c) => c.kind === 'shrimp').length;
    this.shrimpTimer -= dt;
    if (shrimpNow < this.shrimpTarget && this.shrimpTimer <= 0) {
      this.shrimpTimer = 1.5;
      this.critters.push(this.newShrimp());
    }
  }

  newShrimp() {
    const a = rand(0, TAU);
    return {
      kind: 'shrimp',
      x: rand(70, W - 70),
      y: rand(this.netMax + 90, this.floorTop - 110),
      vx: Math.cos(a) * 50,
      vy: Math.sin(a) * 40,
      dart: rand(0.2, 1),
      phase: rand(0, TAU),
    };
  }

  setNote(text) {
    this.noteText = text;
    this.note = 2.4;
  }

  updateNet(dt) {
    const net = this.net;
    net.timer -= dt;
    if (net.state === 'idle') {
      net.depth = 0;
      if (net.timer <= 0) {
        net.state = 'warn';
        net.timer = TX.netWarn;
        net.warned = false;
      }
      return;
    }
    if (net.state === 'warn') {
      if (!net.warned && net.timer < TX.netWarn - 0.2) {
        net.warned = true;
        this.game.audio.tone({ freq: 120, endFreq: 80, type: 'square', duration: 0.3, volume: 0.18 });
      }
      if (net.timer <= 0) {
        net.state = 'down';
        net.timer = TX.netDrop;
        this.game.audio.noise({
          duration: 0.5,
          volume: 0.16,
          type: 'lowpass',
          filterFreq: 700,
          filterEnd: 200,
        });
      }
      return;
    }
    if (net.state === 'down') {
      net.depth = this.netMax * (1 - clamp(net.timer / TX.netDrop, 0, 1));
      if (net.timer <= 0) {
        net.depth = this.netMax;
        net.state = 'hold';
        net.timer = TX.netHold;
      }
      return;
    }
    if (net.state === 'hold') {
      net.depth = this.netMax;
      if (net.timer <= 0) {
        net.state = 'up';
        net.timer = TX.netRise;
      }
      return;
    }
    if (net.state === 'up') {
      net.depth = this.netMax * clamp(net.timer / TX.netRise, 0, 1);
      if (net.timer <= 0) {
        net.depth = 0;
        net.state = 'idle';
        net.timer = TX.netIdle;
      }
    }
  }

  moveDiver(dt, input, gravityScale = 1, maxX = W) {
    const player = this.players[0];
    const thrust = input.down.has('Space') || input.isDown('up');
    player.vy += (thrust ? -TX.thrust : TX.gravity * gravityScale) * dt;
    player.vy *= Math.max(0, 1 - TX.drag * dt);
    player.vy = clamp(player.vy, -TX.maxRise, TX.maxSink);
    const hx = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    player.vx = hx * TX.moveX;
    player.x = clamp(player.x + player.vx * dt, player.radius, maxX - player.radius);
    player.y += player.vy * dt;
    player.age += dt;
    player.speed = Math.hypot(player.vx, player.vy);
    if (player.vx > 8) player.facing = 1;
    else if (player.vx < -8) player.facing = -1;
    return player;
  }

  updateCamera(player, bottom) {
    this.camY = clamp(player.y - H * 0.5, 0, Math.max(0, bottom - H));
  }

  updateRound(dt, input) {
    const player = this.moveDiver(dt, input);
    player.y = clamp(player.y, SURFACE_Y, this.floorTop - player.radius);
    this.updateCamera(player, this.shaftBottom);
    this.updateNet(dt);
    this.updateCritters(dt);
    if (this.net.depth > 0 && player.y - player.radius < this.net.depth) {
      this.caught('THE NET SCOOPED YOU UP');
      return;
    }
    for (const coin of this.coinBubbles) {
      if (coin.taken) continue;
      const cy = coin.y + Math.sin(this.time * 3 + coin.phase) * 4;
      const cr = coin.radius ?? TX.coinRadius;
      if (circleOverlap(player, { x: coin.x, y: cy, radius: cr })) {
        coin.taken = true;
        this.collected += 1;
        this.totalCoins += 1;
        this.particles.burst(coin.x, cy, {
          count: 12,
          speed: 170,
          life: 0.6,
          colors: [COLORS.accent, '#ffffff', COLORS.bubble],
          buoyancy: -40,
        });
        this.game.audio.tone({
          freq: 760,
          endFreq: 1240,
          type: 'triangle',
          duration: 0.12,
          volume: 0.2,
        });
      }
    }
    this.coinBubbles = this.coinBubbles.filter((coin) => !coin.taken);
    if (this.collected >= this.coinTarget) this.clearTrench();
  }

  clearTrench() {
    this.game.audio.tone({ freq: 520, endFreq: 900, type: 'triangle', duration: 0.3, volume: 0.24 });
    this.game.audio.tone({ freq: 780, endFreq: 1200, type: 'triangle', duration: 0.3, volume: 0.2, delay: 0.16 });
    if (this.trenchIndex + 1 >= TX.trenches) {
      this.startRising();
      return;
    }
    this.startTrench(this.trenchIndex + 1);
  }

  caught(reason) {
    if (this.phase === 'results') return;
    this.reason = reason;
    this.flash = 0.8;
    this.shake = 1;
    this.game.audio.noise({
      duration: 0.8,
      volume: 0.3,
      type: 'lowpass',
      filterFreq: 900,
      filterEnd: 120,
    });
    this.finish(false);
  }

  renderBoatAndNet(ctx) {
    const boatY = -46;
    ctx.save();
    ctx.fillStyle = '#5a4632';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 120, boatY);
    ctx.lineTo(W / 2 + 120, boatY);
    ctx.lineTo(W / 2 + 86, boatY + 40);
    ctx.lineTo(W / 2 - 86, boatY + 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3f3222';
    ctx.fillRect(W / 2 - 10, boatY - 70, 20, 70);
    ctx.fillStyle = '#c9b28a';
    ctx.fillRect(W / 2 + 6, boatY - 66, 40, 34);
    ctx.fillStyle = 'rgba(207, 239, 255, 0.5)';
    ctx.fillRect(0, boatY + 40, W, 4);
    ctx.restore();

    const depth = this.net.depth;
    if (depth <= 0.5) return;
    const top = boatY + 40;
    const bottom = depth;
    ctx.save();
    ctx.strokeStyle = 'rgba(200, 220, 230, 0.32)';
    ctx.lineWidth = 1.5;
    for (let y = top; y <= bottom; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = 0; x <= W; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    ctx.strokeStyle = this.net.state === 'warn' ? 'rgba(255, 209, 102, 0.65)' : 'rgba(200, 220, 230, 0.5)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(W, top);
    ctx.moveTo(0, bottom);
    ctx.lineTo(W, bottom);
    ctx.stroke();
    ctx.fillStyle = 'rgba(180, 200, 210, 0.22)';
    ctx.fillRect(0, bottom - 7, W, 12);
    ctx.restore();
  }

  renderCritters(ctx) {
    for (const c of this.critters) {
      if (c.kind === 'weed') this.drawWeed(ctx, c);
      else if (c.kind === 'moray') this.drawMoray(ctx, c);
      else if (c.kind === 'octopus') this.drawCoral(ctx, c, 'octopus');
      else if (c.kind === 'squid') this.drawCoral(ctx, c, 'squid');
      else if (c.kind === 'crab') this.drawCrab(ctx, c);
      else if (c.kind === 'shrimp') this.drawShrimp(ctx, c);
      else if (c.kind === 'ray') this.drawRay(ctx, c);
    }
  }

  drawWeed(ctx, c) {
    const baseY = c.baseY;
    ctx.strokeStyle = 'rgba(60, 126, 74, 0.75)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      const dx = (i - 1) * 8;
      const sway = Math.sin(this.time * 1.4 + c.phase + i) * 10;
      ctx.beginPath();
      ctx.moveTo(c.x + dx, baseY);
      ctx.quadraticCurveTo(c.x + dx + sway, baseY - c.h * 0.5, c.x + dx + sway * 1.6, baseY - c.h);
      ctx.stroke();
    }
  }

  drawMoray(ctx, c) {
    const palette = EEL_VARIANTS[(c.variant ?? 0) % EEL_VARIANTS.length];
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.dir, 1);
    drawMorayBody(ctx, EEL.radius, { age: this.time, phase: c.phase }, palette);
    ctx.restore();
  }

  drawCoral(ctx, c, kind) {
    const wobble = Math.sin(this.time * 1.1 + c.phase) * 4;
    const color = kind === 'octopus' ? '#8a4a6a' : '#b06a4a';
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(clamp((c.vx ?? 0) / 140, -0.28, 0.28));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 20, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * TAU;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.quadraticCurveTo(
        Math.cos(a) * 18 + wobble,
        22,
        Math.cos(a) * 26 + wobble,
        34 + Math.sin(this.time * 2 + i) * 4,
      );
      ctx.stroke();
    }
    if (kind === 'squid') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(-12, -8);
      ctx.lineTo(12, -8);
      ctx.closePath();
      ctx.fill();
    }
    const eyeY = kind === 'squid' ? -13 : -4;
    ctx.fillStyle = '#eef4ea';
    ctx.beginPath();
    ctx.arc(-5, eyeY, 3.4, 0, TAU);
    ctx.arc(5, eyeY, 3.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0b0f13';
    ctx.beginPath();
    ctx.arc(-5, eyeY, 1.6, 0, TAU);
    ctx.arc(5, eyeY, 1.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawShrimp(ctx, c) {
    const face = c.vx >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(face, 1);
    ctx.rotate(Math.sin(this.time * 10 + c.phase) * 0.12);
    ctx.fillStyle = '#ff8a6a';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(2, -7, -8, -2);
    ctx.quadraticCurveTo(-3, 4, 10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffb08a';
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(-16, -7);
    ctx.lineTo(-13, 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ff8a6a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(18, -3);
    ctx.moveTo(10, 0);
    ctx.lineTo(18, 3);
    ctx.stroke();
    ctx.fillStyle = '#0b0f13';
    ctx.beginPath();
    ctx.arc(4, -2, 1.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawCrab(ctx, c) {
    const sink = c.burrow ?? 0;
    if (sink > 0.05) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, sink * 1.6);
      ctx.fillStyle = '#6b5c40';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 9, 15, 6, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - sink * 1.05);
    ctx.translate(c.x, c.y + sink * 16);
    ctx.scale(1, 1 - sink * 0.45);
    ctx.fillStyle = c.flee > 0 ? '#e26052' : '#c9542f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 8, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#8f3218';
    ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(side * 8, i * 3 - 3);
        ctx.lineTo(side * 18, i * 3 + Math.sin(this.time * 12 + i) * 3);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(side * 12, -4, 4, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = '#10233a';
    ctx.beginPath();
    ctx.arc(-4, -2, 1.6, 0, TAU);
    ctx.arc(4, -2, 1.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawRay(ctx, c) {
    const y = c.y;
    const skin = skinByKey(c.skin);
    const baby = Boolean(skin.rayBaby);
    const radius = baby ? 14 : 24;
    const pose = {
      raw: true,
      tailPhase: this.time * 3 + c.phase,
      bodyColor: skin.body,
      spotColor: skin.accent,
      eyeColor: '#10233a',
      tailColor: skin.tail ?? skin.body,
      tailOutline: skin.tailOutline ?? null,
      noSpots: skin.raySpots === false,
      bigSpot: baby ? skin.accent : null,
    };
    ctx.save();
    ctx.translate(c.x, y);
    ctx.scale(c.face, 1);
    if (baby) ctx.globalAlpha = 0.65;
    drawStingrayBody(ctx, radius, pose);
    ctx.restore();
    if (c.caught) {
      drawText(ctx, 'CAUGHT', c.x, y - 32, { size: 11, color: COLORS.alienGlow });
    }
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(0, -this.camY);
    const floorY = this.shaftBottom;
    ctx.fillStyle = 'rgba(6, 14, 22, 0.85)';
    ctx.fillRect(0, floorY, W, H + 200);
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(0, floorY - 14, W, 40);
    ctx.strokeStyle = 'rgba(120, 96, 64, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, floorY - 14);
    ctx.lineTo(W, floorY - 14);
    ctx.stroke();
    this.renderCritters(ctx);
    for (const coin of this.coinBubbles) {
      const bob = Math.sin(this.time * 3 + coin.phase) * 4;
      const y = coin.y + bob;
      const r = coin.radius ?? TX.coinRadius;
      ctx.beginPath();
      ctx.arc(coin.x, y, r, 0, TAU);
      ctx.fillStyle = 'rgba(207, 239, 255, 0.16)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(207, 239, 255, 0.78)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(coin.x, y, r * 0.58, 0, TAU);
      ctx.fillStyle = COLORS.accent;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(coin.x - r * 0.32, y - r * 0.32, r * 0.2, 0, TAU);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();
    }
    this.renderBoatAndNet(ctx);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
    ctx.restore();
  }

  renderHud(ctx) {
    if (this.phase === 'boss') {
      drawText(ctx, 'MEGASQUID', 40, 36, {
        size: 15,
        color: COLORS.danger,
        align: 'left',
        glow: COLORS.danger,
        glowBlur: 10,
      });
      const hp = Math.max(0, this.squid.hp);
      for (let i = 0; i < TX.bossHp; i += 1) {
        fillRoundRect(
          ctx,
          40 + i * 30,
          46,
          26,
          12,
          3,
          i < hp ? COLORS.danger : 'rgba(255, 107, 129, 0.18)',
        );
      }
      drawText(ctx, `HP ${hp}/${TX.bossHp}`, 40 + TX.bossHp * 30 + 4, 46, {
        size: 12,
        color: COLORS.textDim,
        align: 'left',
      });
      if (this.squid.stun > 0) {
        drawText(ctx, 'SQUID NETTED!', W - 40, 40, {
          size: 14,
          color: COLORS.alienGlow,
          align: 'right',
          alpha: 0.7 + 0.3 * Math.sin(this.time * 14),
        });
      }
      if (this.note > 0) {
        drawText(ctx, this.noteText, W / 2, H - 22, {
          size: 12,
          color: COLORS.textDim,
          alpha: Math.min(1, this.note),
        });
      }
      return;
    }
    drawText(ctx, `TRENCH ${this.trenchIndex + 1}/${TX.trenches}`, 40, 40, {
      size: 18,
      color: COLORS.text,
      align: 'left',
      glow: COLORS.bubble,
      glowBlur: 10,
    });
    drawText(ctx, `COIN BUBBLES ${this.collected}/${this.coinTarget}`, 40, 64, {
      size: 13,
      color: COLORS.accent,
      align: 'left',
    });
    drawText(ctx, `DEPTH ${Math.round(this.players[0].y)} m`, W - 40, 40, {
      size: 15,
      color: COLORS.text,
      align: 'right',
    });
    const netLabel = this.net.state === 'idle' ? 'NET UP' : this.net.state === 'warn' ? 'NET COMING' : 'NET DOWN';
    drawText(ctx, netLabel, W - 40, 64, {
      size: 13,
      color: this.net.state === 'idle' ? COLORS.alienGlow : COLORS.danger,
      align: 'right',
      alpha: 0.9,
    });
    if (this.trenchBanner > 0) {
      drawText(ctx, `TRENCH ${this.trenchIndex + 1}`, W / 2, 120, {
        size: 26,
        color: COLORS.text,
        glow: COLORS.bubble,
        glowBlur: 16,
        alpha: Math.min(1, this.trenchBanner),
      });
    }
    if (this.note > 0) {
      drawText(ctx, this.noteText, W / 2, H - 22, {
        size: 12,
        color: COLORS.textDim,
        alpha: Math.min(1, this.note),
      });
    }
    if (this.catchPopup > 0) {
      drawText(ctx, this.catchText, W / 2, H - 46, {
        size: 16,
        color: COLORS.alienGlow,
        glow: COLORS.alienGlow,
        glowBlur: 12,
        alpha: Math.min(1, this.catchPopup),
      });
    }
  }

  startRising() {
    this.phase = 'rising';
    this.risingTimer = 0;
    this.risingBroken = false;
    this.wreckPieces = [];
    this.camY = Math.max(0, this.shaftBottom - H - 60);
    this.players[0].vy = -160;
    this.game.audio.noise({
      duration: 1.6,
      volume: 0.28,
      type: 'lowpass',
      filterFreq: 400,
      filterEnd: 70,
    });
    this.game.audio.tone({ freq: 44, endFreq: 26, type: 'sawtooth', duration: 2, volume: 0.34 });
  }

  updateRising(dt) {
    this.risingTimer += dt;
    const t = this.risingTimer;
    const player = this.players[0];
    player.y = Math.max(SURFACE_Y, player.y + player.vy * dt);
    if (!this.risingBroken && t >= 3.4) {
      this.risingBroken = true;
      this.shake = 1;
      this.flash = 0.6;
      for (let i = 0; i < 26; i += 1) {
        this.wreckPieces.push({
          x: W / 2 + rand(-190, 190),
          y: this.camY + rand(120, 340),
          vx: rand(-260, 260),
          vy: rand(-320, -60),
          rot: rand(0, TAU),
          spin: rand(-6, 6),
          size: rand(10, 30),
        });
      }
      this.particles.burst(W / 2, this.camY + 300, {
        count: 40,
        speed: 320,
        life: 1.1,
        colors: ['#5a4632', '#3f3222', '#c9b28a', COLORS.tentacleDark],
        buoyancy: 20,
      });
      this.game.audio.noise({ duration: 0.9, volume: 0.32, type: 'lowpass', filterFreq: 900, filterEnd: 140 });
      this.game.audio.tone({ freq: 90, endFreq: 34, type: 'square', duration: 0.7, volume: 0.3 });
    }
    for (const piece of this.wreckPieces) {
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.vy += 260 * dt;
      piece.rot += piece.spin * dt;
    }
    if (t >= TX.risingTime) {
      if (this.theatre) {
        this.game.changeScene('theatre');
        return;
      }
      this.startBoss();
    }
  }

  renderRising(ctx) {
    ctx.save();
    ctx.translate(0, -this.camY);
    const floorY = this.shaftBottom;
    ctx.fillStyle = 'rgba(6, 14, 22, 0.9)';
    ctx.fillRect(0, floorY, W, H + 200);
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(0, floorY - 14, W, 40);
    const t = this.risingTimer;
    const rise = clamp(t / 3.2, 0, 1);
    const headY = this.shaftBottom - 120 + (1 - rise) * 420;
    ctx.save();
    ctx.translate(W / 2, headY);
    drawMegasquid(ctx, 0, 0, 1, this.time, 1, 1);
    const eyeX = 42;
    const eyeY = 56;
    const gx = this.players[0].x - (W / 2 + eyeX);
    const gy = this.players[0].y - (headY + eyeY);
    const gl = Math.hypot(gx, gy) || 1;
    drawMegasquidEye(ctx, eyeX, eyeY, this.squidBlink(), gx / gl, gy / gl, 1);
    ctx.restore();
    if (!this.risingBroken) {
      ctx.save();
      ctx.translate(W / 2, headY + 120);
      ctx.fillStyle = '#4a3a28';
      ctx.beginPath();
      ctx.moveTo(-170, 0);
      ctx.lineTo(170, 0);
      ctx.lineTo(120, 54);
      ctx.lineTo(-120, 54);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#33281b';
      ctx.fillRect(-8, -120, 16, 120);
      ctx.strokeStyle = 'rgba(20, 14, 8, 0.7)';
      ctx.lineWidth = 4;
      ctx.strokeRect(-170, 0, 340, 54);
      ctx.restore();
    }
    for (const piece of this.wreckPieces) {
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rot);
      ctx.fillStyle = '#4a3a28';
      ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
      ctx.restore();
    }
    this.particles.render(ctx);
    ctx.restore();
    const card =
      t < 1.2
        ? 'THE LAST TRENCH GROANS'
        : t < 3.4
          ? 'THE MEGASQUID RISES, TANGLED IN A SHIPWRECK'
          : t < 5
            ? 'IT TEARS THE WRECK APART'
            : 'IT TURNS FOR YOU';
    drawText(ctx, card, W / 2, 70, {
      size: 20,
      color: t < 3.4 ? COLORS.accent : COLORS.danger,
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 16,
      alpha: 0.94,
    });
  }

  startBoss() {
    this.phase = 'boss';
    const player = this.players[0];
    player.x = 340;
    player.y = H * 0.5;
    player.vx = 0;
    player.vy = 0;
    this.bossCamX = 0;
    this.bossBottom = H;
    this.squid = {
      x: 60,
      y: H * 0.5,
      stun: 1.2,
      mode: 'chase',
      modeTimer: 1.5,
      rage: 0,
      shriek: 0,
      hp: TX.bossHp,
      flash: 0,
    };
    this.bossNets = [];
    this.bossSchools = [];
    this.bossNetCursor = 460;
    this.bossHeart = 1;
    this.bossHitFlash = 0;
    for (let i = 0; i < 4; i += 1) this.bossSchools.push(this.newSchool());
    this.setNote('ROUND THE FISH INTO A NET — THE SQUID CHASES THE BAIT — DRAIN ITS HEALTH — KEEP MOVING');
    this.game.audio.tone({ freq: 60, endFreq: 30, type: 'sawtooth', duration: 1.4, volume: 0.32 });
  }

  newSchool() {
    const a = rand(0, TAU);
    return {
      x: this.bossCamX + rand(80, W - 80),
      y: rand(150, this.bossBottom - 90),
      vx: Math.cos(a) * 30,
      vy: Math.sin(a) * 20,
      phase: rand(0, TAU),
    };
  }

  newNet(x) {
    return { x, depth: TX.bossNetDepth + rand(-40, 40), baited: false, phase: rand(0, TAU) };
  }

  moveSquid(squid, tx, ty, speed, dt) {
    const dx = tx - squid.x;
    const dy = ty - squid.y;
    const d = Math.hypot(dx, dy) || 1;
    squid.x += (dx / d) * speed * dt;
    squid.y += (dy / d) * speed * dt;
    squid.y = clamp(squid.y, 60, this.bossBottom - 40);
    squid.x = clamp(squid.x, this.bossCamX - 260, this.bossCamX + W + 80);
  }

  updateBoss(dt, input) {
    const player = this.moveDiver(dt, input, 0.85, 20000);
    player.y = clamp(player.y, SURFACE_Y, this.bossBottom - player.radius);
    this.bossCamX = Math.max(0, player.x - W * 0.4);

    while (this.bossNetCursor < this.bossCamX + W + 700) {
      this.bossNets.push(this.newNet(this.bossNetCursor));
      this.bossNetCursor += TX.bossNetSpacing;
    }
    this.bossNets = this.bossNets.filter((net) => net.x > this.bossCamX - 300);

    this.bossSchools = this.bossSchools.filter((sch) => sch.x > this.bossCamX - 240);
    while (this.bossSchools.length < 4) this.bossSchools.push(this.newSchool());

    for (const sch of this.bossSchools) {
      const dx = sch.x - player.x;
      const dy = sch.y - player.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 190) {
        sch.vx += (dx / d) * 300 * dt;
        sch.vy += (dy / d) * 240 * dt;
      }
      sch.vx += Math.sin(this.time * 0.8 + sch.phase) * 24 * dt;
      sch.vy += Math.cos(this.time * 0.7 + sch.phase) * 16 * dt;
      sch.vx *= Math.max(0, 1 - 1.2 * dt);
      sch.vy *= Math.max(0, 1 - 1.2 * dt);
      sch.x += sch.vx * dt;
      sch.y += sch.vy * dt;
      sch.y = clamp(sch.y, 70, this.bossBottom - 40);
      if (sch.x < this.bossCamX + 24) {
        sch.x = this.bossCamX + 24;
        sch.vx = Math.abs(sch.vx);
      }
    }

    for (const net of this.bossNets) net.baited = false;
    for (const sch of this.bossSchools) {
      for (const net of this.bossNets) {
        if (Math.abs(sch.x - net.x) < TX.bossNetHalf && sch.y < net.depth) net.baited = true;
      }
    }

    const squid = this.squid;
    squid.flash = Math.max(0, squid.flash - dt);
    squid.shriek = Math.max(0, squid.shriek - dt);
    squid.rage = clamp(1 - squid.hp / TX.bossHp, 0, 1);
    const rage = squid.rage;

    let targetX = player.x;
    let targetY = player.y;
    let lured = null;
    let bestLure = TX.bossLureRadius;
    for (const net of this.bossNets) {
      if (!net.baited) continue;
      const d = Math.abs(net.x - squid.x);
      if (d < bestLure) {
        bestLure = d;
        lured = net;
      }
    }
    if (lured) {
      targetX = lured.x;
      targetY = Math.min(player.y, lured.depth - 30);
    }

    if (squid.stun > 0) {
      squid.stun = Math.max(0, squid.stun - dt);
    } else {
      squid.modeTimer -= dt;
      const baseSpeed = TX.bossSquidSpeed * (1 + rage * 1.15) * this.enemyMult;
      if (squid.mode === 'chase') {
        this.moveSquid(squid, targetX, targetY, baseSpeed, dt);
        if (squid.modeTimer <= 0) {
          squid.mode = 'warn';
          squid.modeTimer = TX.bossLungeWarn * (1 - rage * 0.3);
          squid.shriek = 1;
          this.game.audio.tone({ freq: 90, endFreq: 240, type: 'sawtooth', duration: 0.5, volume: 0.26 });
        }
      } else if (squid.mode === 'warn') {
        this.moveSquid(squid, targetX, targetY, -baseSpeed * 0.4, dt);
        if (squid.modeTimer <= 0) {
          squid.mode = 'lunge';
          squid.modeTimer = TX.bossLungeTime;
          this.game.audio.noise({ duration: 0.5, volume: 0.3, type: 'lowpass', filterFreq: 900, filterEnd: 180 });
          this.shake = 1;
        }
      } else if (squid.mode === 'lunge') {
        this.moveSquid(squid, targetX, targetY, TX.bossLungeSpeed * (1 + rage * 0.5), dt);
        if (squid.modeTimer <= 0) {
          squid.mode = 'recover';
          squid.modeTimer = TX.bossLungeRecover * (1 - rage * 0.3);
        }
      } else if (squid.mode === 'recover') {
        this.moveSquid(squid, targetX, targetY, baseSpeed * 0.5, dt);
        if (squid.modeTimer <= 0) {
          squid.mode = 'chase';
          squid.modeTimer = rand(1.4, 2.4) * (1 - rage * 0.4);
        }
      }

      for (const net of this.bossNets) {
        if (!net.baited) continue;
        if (Math.abs(squid.x - net.x) < TX.bossNetHalf + 26 && squid.y <= net.depth + 20) {
          squid.hp -= 1;
          squid.stun = TX.bossNetStun;
          squid.flash = 1;
          squid.mode = 'chase';
          squid.y += 50;
          squid.x = Math.max(this.bossCamX - 200, squid.x - 130);
          net.baited = false;
          for (const sch of this.bossSchools) {
            if (Math.abs(sch.x - net.x) < TX.bossNetHalf + 40) {
              sch.vx -= 220;
              sch.vy += rand(-70, 70);
            }
          }
          this.shake = 1;
          this.bossHitFlash = 1;
          this.setNote(`THE NET BITES — SQUID HEALTH ${Math.max(0, squid.hp)}/${TX.bossHp}`);
          this.game.audio.tone({ freq: 160, endFreq: 50, type: 'square', duration: 0.5, volume: 0.3 });
          this.game.audio.noise({
            duration: 0.5,
            volume: 0.24,
            type: 'bandpass',
            filterFreq: 700,
            filterEnd: 200,
            q: 4,
          });
          this.particles.burst(net.x, Math.min(squid.y, net.depth), {
            count: 24,
            speed: 260,
            life: 0.8,
            colors: [COLORS.tentacleDark, COLORS.bubble, '#ffffff', COLORS.accent],
            buoyancy: -10,
          });
          if (squid.hp <= 0) {
            this.escapeWin();
            return;
          }
          break;
        }
      }
    }
    if (this.phase !== 'boss') return;

    if (
      squid.stun <= 0 &&
      Math.hypot(player.x - squid.x, player.y - squid.y) < SQUID_RADIUS + player.radius
    ) {
      this.caught('THE MEGASQUID GOT YOU');
      return;
    }
    for (const net of this.bossNets) {
      if (Math.abs(player.x - net.x) < TX.bossNetHalf && player.y < net.depth + player.radius) {
        this.caught('A NET FOUND YOU');
        return;
      }
    }

    const dist = Math.hypot(player.x - squid.x, player.y - squid.y);
    const near = clamp(1 - dist / 460, 0, 1);
    this.shake = Math.max(this.shake, near * (squid.mode === 'lunge' ? 1 : 0.4));
    this.bossHeart -= dt * (1 + near * 2 + rage);
    if (this.bossHeart <= 0) {
      this.bossHeart = 1;
      const volume = 0.05 + near * 0.13;
      this.game.audio.tone({ freq: 70, endFreq: 40, type: 'sine', duration: 0.16, volume });
      this.game.audio.tone({ freq: 60, endFreq: 32, type: 'sine', duration: 0.2, volume: volume * 0.8, delay: 0.16 });
    }
    if (squid.mode === 'lunge') {
      this.particles.burst(squid.x, squid.y, {
        count: 1,
        speed: 80,
        life: 0.5,
        colors: [COLORS.bubble, '#ffffff'],
        buoyancy: -30,
      });
    }
    this.bossHitFlash = Math.max(0, this.bossHitFlash - dt * 2.4);
  }

  escapeWin() {
    this.finish(true);
  }

  squidBlink() {
    const s = Math.sin(this.time * 0.8 + 1.3);
    return clamp((s - 0.92) * 12, 0, 1);
  }

  drawFish(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.6, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x - size * 1.7, y - size * 0.5);
    ctx.lineTo(x - size * 1.7, y + size * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  renderBoss(ctx) {
    const cam = this.bossCamX;
    const squid = this.squid;
    ctx.save();
    ctx.translate(-cam, 0);

    ctx.fillStyle = 'rgba(143, 240, 208, 0.14)';
    ctx.fillRect(cam - 40, -8, W + 80, 12);
    ctx.fillStyle = 'rgba(180, 210, 220, 0.12)';
    for (let x = Math.floor(cam / 160) * 160; x < cam + W + 160; x += 160) {
      ctx.fillRect(x, -40, 2, 34);
    }

    for (const net of this.bossNets) {
      ctx.strokeStyle = net.baited ? 'rgba(255, 209, 102, 0.85)' : 'rgba(200, 220, 230, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(net.x - TX.bossNetHalf, -6);
      ctx.lineTo(net.x - TX.bossNetHalf, net.depth);
      ctx.moveTo(net.x + TX.bossNetHalf, -6);
      ctx.lineTo(net.x + TX.bossNetHalf, net.depth);
      ctx.stroke();
      ctx.strokeStyle = net.baited ? 'rgba(255, 209, 102, 0.5)' : 'rgba(200, 220, 230, 0.32)';
      ctx.lineWidth = 1.4;
      for (let y = 0; y <= net.depth; y += 26) {
        ctx.beginPath();
        ctx.moveTo(net.x - TX.bossNetHalf, y);
        ctx.lineTo(net.x + TX.bossNetHalf, y);
        ctx.stroke();
      }
      for (let x = net.x - TX.bossNetHalf; x <= net.x + TX.bossNetHalf; x += 26) {
        ctx.beginPath();
        ctx.moveTo(x, -6);
        ctx.lineTo(x, net.depth);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(180, 200, 210, 0.22)';
      ctx.fillRect(net.x - TX.bossNetHalf - 2, net.depth - 7, TX.bossNetHalf * 2 + 4, 12);
      if (net.baited) {
        for (let i = 0; i < 6; i += 1) {
          const fx = net.x + Math.cos(this.time * 2 + i * 1.7 + net.phase) * (TX.bossNetHalf * 0.6);
          const fy = net.depth * (0.25 + (i / 6) * 0.6) + Math.sin(this.time * 3 + i) * 6;
          this.drawFish(ctx, fx, fy, 6, '#c9d8e2');
        }
      }
    }

    for (const sch of this.bossSchools) {
      for (let i = 0; i < 7; i += 1) {
        const a = sch.phase + i * 1.9;
        const fx = sch.x + Math.cos(a + this.time * 1.6) * (14 + (i % 3) * 6);
        const fy = sch.y + Math.sin(a * 1.3 + this.time * 1.9) * (10 + (i % 2) * 5);
        this.drawFish(ctx, fx, fy, 7, i % 2 === 0 ? '#dfe8ee' : '#9fb4c2');
      }
    }

    const sx = squid.x;
    const sy = squid.y;
    drawMegasquid(ctx, sx, sy, 1, this.time, 1, 1);
    const eyeX = sx + 42;
    const eyeY = sy + 56;
    const gx = this.players[0].x - eyeX;
    const gy = this.players[0].y - eyeY;
    const gl = Math.hypot(gx, gy) || 1;
    drawMegasquidEye(ctx, eyeX, eyeY, this.squidBlink(), gx / gl, gy / gl, 1);
    if (squid.flash > 0) {
      ctx.save();
      ctx.globalAlpha = squid.flash * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 40, SQUID_RADIUS * 1.6, SQUID_RADIUS * 1.2, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    this.renderPlayers(ctx);
    this.particles.render(ctx);
    ctx.restore();

    const dist = Math.hypot(this.players[0].x - sx, this.players[0].y - sy);
    const near = clamp(1 - dist / 460, 0, 1);
    if (near > 0.02) {
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.95);
      vig.addColorStop(0, 'rgba(120, 0, 16, 0)');
      vig.addColorStop(1, `rgba(120, 0, 16, ${0.5 * near})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.bossHitFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.bossHitFlash * 0.4})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene(this.theatre ? 'theatre' : this.backScene());
      return;
    }
    if (this.phase === 'results') {
      this.resultsMenu.update(dt, input);
      return;
    }
    this.elapsed += dt;
    this.trenchBanner = Math.max(0, this.trenchBanner - dt);
    this.note = Math.max(0, this.note - dt);
    this.catchPopup = Math.max(0, this.catchPopup - dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);
    if (this.phase === 'play') this.updateRound(dt, input);
    else if (this.phase === 'rising') this.updateRising(dt);
    else if (this.phase === 'boss') this.updateBoss(dt, input);
    this.particles.update(dt);
  }

  render(ctx) {
    setSkinClock(this.time);
    drawWater(ctx, W, H, this.time, WATER_PALETTE);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 8 * this.shake, rand(-1, 1) * 8 * this.shake);
    }
    ctx.translate(0, 0);
    if (this.phase === 'rising') this.renderRising(ctx);
    else if (this.phase === 'boss') this.renderBoss(ctx);
    else this.renderRound(ctx);
    ctx.restore();

    if (this.phase !== 'rising') this.renderHud(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.phase === 'results') this.renderResults(ctx);
  }

  resultsTitle() {
    return 'TRENCH EXPLORE';
  }

  resultsHeadline() {
    return this.won ? 'YOU SURFACED!' : 'THE NET GOT YOU';
  }

  resultsDetail() {
    if (this.won) return `ESCAPED THE MEGASQUID — ${this.totalCoins} COIN BUBBLES`;
    return this.reason ?? `SANK TO TRENCH ${this.trenchIndex + 1}`;
  }
}
