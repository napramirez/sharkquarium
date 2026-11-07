import { MinigameScene } from '../engine/minigame.js';
import { recordWin } from '../engine/records.js';
import { SelectList } from '../engine/selectlist.js';
import { drawText, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { loadJSON } from '../engine/storage.js';
import { setSkinClock } from '../engine/skin.js';
import { motionScale } from '../engine/motion.js';
import { applyWardrobe } from '../engine/wardrobe.js';
import { drawTrail } from '../engine/trail.js';
import { drawCompanion } from '../engine/companion.js';
import { Lungfish } from '../entities/lungfish.js';
import { drawSeasonHat } from '../entities/entity.js';
import { seasonOn, currentSeason } from '../engine/season.js';
import { QUIET_TRACK } from '../assets/tracks.js';
import {
  PREHISTORIC as P,
  COLORS,
  DIFFICULTY,
  SETTINGS_KEY,
  SHOP_KEY,
  LOGICAL_WIDTH as W,
  LOGICAL_HEIGHT as H,
} from '../config.js';

const ZONE_NAMES = ['THE DEVONIAN SEA', 'THE SWAMP', 'THE HIGHLANDS'];
const ZONE_FOE = ['DUNKLEOSTEUS', 'VELOCIRAPTOR', 'TITANOBOA'];

export class PrehistoricScene extends MinigameScene {
  enter(params = {}) {
    this.time = 0;
    this.solo = true;
    this.bossOnly = Boolean(params.bossOnly);
    this.difficultyKey = loadJSON(SETTINGS_KEY, {}).difficulty ?? 'normal';
    this.rules = DIFFICULTY[this.difficultyKey] ?? DIFFICULTY.normal;
    this.enemyMult = this.mutator ? this.mutator.knobs.enemySpeedScale ?? 1 : 1;
    this.shop = loadJSON(SHOP_KEY, {});
    if (this.game.music) {
      this.previousTrack = this.game.music.source ?? this.game.music.track;
      this.previousHold = this.game.music.hold;
      this.game.music.play(QUIET_TRACK);
      this.game.music.hold = false;
    }
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
    this.game.audio.tone({ freq: 70, endFreq: 40, type: 'sawtooth', duration: 0.6, volume: 0.24 });
    this.resetRound();
    if (this.bossOnly) this.startTitanoboa();
  }

  startTitanoboa() {
    this.zoneIndex = 2;
    this.dunk.active = false;
    this.raptor.active = false;
    this.player.x = this.zoneStarts[2];
    this.player.y = this.groundY - this.player.radius;
    this.player.vx = 0;
    this.player.vy = 0;
    this.snake.active = true;
    this.snake.x = this.player.x - 440;
    this.snake.y = this.player.y;
    this.snake.heading = 0;
    this.fillSnakeBody();
    this.introduced = true;
    this.phase = 'play';
    this.zoneBanner = 3;
    this.setNote('IT DROPS FROM THE TREE — OUTRUN THE TITANOBOA');
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('tanks');
  }

  exit() {
    if (!this.game.music || !this.previousTrack) return;
    this.game.music.play(this.previousTrack);
    this.game.music.hold = this.previousHold;
  }

  firstPersonActor() {
    return null;
  }

  backScene() {
    return 'tanks';
  }

  finish(won) {
    this.phase = 'results';
    this.won = won;
    if (this.rushMode) return;
    this.reward = 0;
    this.newRecord = won ? recordWin(this.recordMode(), { time: this.elapsed }) : null;
    this.resultsMenu.reset();
    this.game.audio.tone({
      freq: won ? 523 : 110,
      endFreq: won ? 784 : 55,
      type: 'triangle',
      duration: 0.4,
      volume: 0.24,
    });
  }

  buildRound() {
    this.zoneLength = P.zoneLength;
    this.startPadding = P.startPadding;
    this.zoneStarts = [0, 1, 2].map((i) => this.startPadding + i * this.zoneLength);
    this.worldEnd = this.startPadding + P.zones * this.zoneLength;
    this.groundY = P.groundY * H;
    this.player = new Lungfish(this.startPadding - 140, H * 0.42, {
      controls: { left: 'left', right: 'right', up: 'up', down: 'down' },
      pointer: false,
      maxX: this.worldEnd,
    });
    this.players = [this.player];
    this.waterGaps = [];
    for (let z = 1; z < P.zones; z += 1) {
      const start = this.zoneStarts[z];
      let x = start + 280;
      while (x < start + this.zoneLength - 320) {
        const w = rand(130, 230);
        this.waterGaps.push({ x, w });
        x += w + rand(380, 640);
      }
    }
    this.decor = [];
    for (let z = 0; z < P.zones; z += 1) {
      const start = z === 0 ? 0 : this.zoneStarts[z];
      const end = z === 0 ? this.zoneStarts[1] : this.zoneStarts[z] + this.zoneLength;
      let x = start + 40;
      while (x < end - 30) {
        const roll = Math.random();
        const kind = z === 0 ? 'kelp' : roll < 0.45 ? 'fern' : roll < 0.8 ? 'rock' : 'log';
        this.decor.push({
          kind,
          x,
          y: z === 0 ? rand(H * 0.55, H - 30) : this.groundY - rand(0, 3),
          s: rand(0.7, 1.5),
          phase: rand(0, TAU),
        });
        x += rand(150, 340);
      }
    }
    this.motes = [];
    for (let i = 0; i < 90; i += 1) {
      this.motes.push({
        x: rand(0, this.worldEnd),
        y: rand(0, H),
        z: rand(0.35, 1.1),
        r: rand(0.6, 2.2),
        phase: rand(0, TAU),
      });
    }
    this.foreground = [];
    let fx = 120;
    while (fx < this.worldEnd) {
      this.foreground.push({
        x: fx,
        s: rand(0.8, 1.7),
        kind: Math.random() < 0.6 ? 'reed' : 'rock',
        phase: rand(0, TAU),
      });
      fx += rand(240, 520);
    }
    this.ammonites = [];
    for (let i = 0; i < P.ammoniteCount; i += 1) this.ammonites.push(this.newAmmonite());
    this.dunk = { x: this.startPadding - 340, y: H * 0.42, stun: 0, active: true, phase: rand(0, TAU) };
    this.raptor = { x: this.zoneStarts[1] - 260, y: this.groundY - P.raptorRadius, lunge: P.raptorLunge, lungeTimer: 0, active: false };
    this.snake = { x: this.zoneStarts[2] - 360, y: H * 0.5, body: [], heading: 0, active: false };
    this.zoneIndex = 0;
    this.zoneBanner = 3;
    this.progress = 0;
    this.phase = 'play';
    this.respawns = 0;
    this.note = 3;
    this.noteText = 'SWIM — THE AMMONITES KNOCK YOU BACK BUT DISTRACT THE DUNKLEOSTEUS';
    this.introTimer = 0;
    this.introduced = false;
    this.shake = 0;
    this.flash = 0;
    this.cameraX = 0;
  }

  newAmmonite() {
    const x = rand(this.startPadding + 60, this.zoneStarts[1] - 60);
    return { x, y: rand(80, H - 80), phase: rand(0, TAU), spin: rand(-1.1, 1.1), dead: false };
  }

  isWater(x) {
    if (x < this.zoneStarts[1]) return true;
    if (x >= this.worldEnd) return false;
    for (const gap of this.waterGaps) {
      if (x > gap.x && x < gap.x + gap.w) return true;
    }
    return false;
  }

  waterGapAt(x) {
    for (const gap of this.waterGaps) {
      if (x > gap.x && x < gap.x + gap.w) return gap;
    }
    return null;
  }

  zoneAt(x) {
    if (x < this.zoneStarts[1]) return 0;
    if (x < this.zoneStarts[2]) return 1;
    return 2;
  }

  setNote(text) {
    this.noteText = text;
    this.note = 2.6;
  }

  fillSnakeBody() {
    const snake = this.snake;
    snake.body = [];
    const count = Math.floor(P.snakeLength / P.snakeSegment);
    for (let i = 0; i <= count; i += 1) {
      snake.body.push({ x: snake.x - i * P.snakeSegment, y: snake.y });
    }
  }

  startIntro() {
    this.phase = 'intro';
    this.introTimer = 0;
    this.introduced = true;
    this.player.x = this.zoneStarts[2];
    this.player.vx = 0;
    this.player.vy = 0;
    this.game.audio.tone({ freq: 55, endFreq: 28, type: 'sawtooth', duration: 1.6, volume: 0.34 });
  }

  startScare(reason) {
    if (this.phase === 'scare') return;
    this.phase = 'scare';
    this.reason = reason;
    this.scareTimer = 1.5;
    this.shake = 1;
    this.game.audio.noise({ duration: 0.8, volume: 0.34, type: 'lowpass', filterFreq: 900, filterEnd: 100 });
    this.game.audio.tone({ freq: 90, endFreq: 30, type: 'square', duration: 0.6, volume: 0.32 });
  }

  respawn() {
    this.player.x = this.zoneStarts[this.zoneIndex] + 40;
    this.player.y = this.zoneIndex === 0 ? H * 0.42 : this.groundY - this.player.radius;
    this.player.vx = 0;
    this.player.vy = 0;
    if (this.zoneIndex === 0) {
      this.dunk.x = this.player.x - 400;
      this.dunk.stun = 0.8;
    } else if (this.zoneIndex === 1) {
      this.raptor.x = this.player.x - 340;
    } else {
      this.snake.x = this.player.x - 440;
      this.snake.y = this.player.y;
      this.fillSnakeBody();
    }
    this.shake = 0;
    this.flash = 0;
    this.phase = 'play';
    this.respawns += 1;
    this.setNote('IT CAUGHT UP — RUN AGAIN');
    this.game.audio.tone({ freq: 300, endFreq: 620, type: 'triangle', duration: 0.3, volume: 0.2 });
  }

  updatePlayer(dt, input) {
    const player = this.player;
    const hx = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    const inWater = this.isWater(player.x);
    const speed = inWater ? P.swimSpeed : P.runSpeed;
    player.vx = hx * speed;
    player.x = clamp(player.x + player.vx * dt, P.radius, this.worldEnd - P.radius);
    const jump = input.down.has('Space') || input.isDown('up');
    if (inWater) {
      player.vy += (jump ? -P.thrust : P.gravity * 0.18) * dt;
      player.vy *= Math.max(0, 1 - P.drag * dt);
      player.vy = clamp(player.vy, -P.maxRise, P.maxSink);
      player.y += player.vy * dt;
      player.y = clamp(player.y, P.radius, H - P.radius);
      player.onGround = false;
    } else {
      if (player.onGround && jump) {
        player.vy = -P.jump;
        player.onGround = false;
      }
      player.vy += P.gravity * dt;
      player.y += player.vy * dt;
      if (player.y >= this.groundY - player.radius) {
        player.y = this.groundY - player.radius;
        player.vy = 0;
        player.onGround = true;
      }
      player.y = clamp(player.y, P.radius, H - P.radius);
    }
    player.age += dt;
    player.speed = Math.hypot(player.vx, player.vy);
    if (player.vx > 8) player.facing = 1;
    else if (player.vx < -8) player.facing = -1;
    if (Math.abs(player.vx) > 30) player.walk += dt * Math.abs(player.vx) / 300;
  }

  updateChasers(dt) {
    const player = this.player;
    const zone = this.zoneIndex;
    if (zone === 0) {
      const dunk = this.dunk;
      dunk.stun = Math.max(0, dunk.stun - dt);
      for (const ammonite of this.ammonites) {
        if (ammonite.dead) continue;
        if (Math.hypot(ammonite.x - dunk.x, ammonite.y - dunk.y) < P.dunkRange) {
          dunk.stun = P.dunkDistract;
          ammonite.dead = true;
          this.particles.burst(ammonite.x, ammonite.y, {
            count: 18,
            speed: 220,
            life: 0.8,
            colors: ['#c9b98a', '#8a7a52', '#ffffff'],
            buoyancy: 20,
          });
          this.setNote('THE AMMONITE DISTRACTS THE DUNKLEOSTEUS — GO!');
          this.game.audio.tone({ freq: 200, endFreq: 90, type: 'square', duration: 0.4, volume: 0.2 });
        }
      }
      if (dunk.stun <= 0) {
        const dx = player.x - dunk.x;
        const dy = player.y - dunk.y;
        const d = Math.hypot(dx, dy) || 1;
        dunk.x += (dx / d) * P.dunkSpeed * this.enemyMult * dt;
        dunk.y += (dy / d) * P.dunkSpeed * 0.6 * this.enemyMult * dt;
      }
      if (Math.hypot(player.x - dunk.x, player.y - dunk.y) < P.dunkRadius + player.radius) {
        this.startScare('THE DUNKLEOSTEUS GOT YOU');
        return;
      }
    } else if (zone === 1) {
      const raptor = this.raptor;
      const gap = this.waterGapAt(player.x);
      let target = player.x;
      if (gap) {
        if (raptor.x < gap.x) target = gap.x - P.raptorRadius;
        else if (raptor.x > gap.x + gap.w) target = gap.x + gap.w + P.raptorRadius;
        else target = raptor.x;
      }
      raptor.lunge -= dt;
      if (raptor.lungeTimer > 0) {
        raptor.lungeTimer -= dt;
      } else if (raptor.lunge <= 0) {
        raptor.lunge = P.raptorLunge;
        raptor.lungeTimer = P.raptorLungeTime;
        this.game.audio.tone({ freq: 320, endFreq: 520, type: 'square', duration: 0.2, volume: 0.18 });
      }
      const speed = (raptor.lungeTimer > 0 ? P.raptorLungeSpeed : P.raptorSpeed) * this.enemyMult;
      raptor.x += clamp(target - raptor.x, -speed * dt, speed * dt);
      raptor.y = this.groundY - P.raptorRadius;
      if (Math.hypot(player.x - raptor.x, player.y - raptor.y) < P.raptorRadius + player.radius) {
        this.startScare('THE VELOCIRAPTOR GOT YOU');
        return;
      }
    } else if (zone === 2 && this.snake.active) {
      const snake = this.snake;
      const inWater = this.isWater(snake.x);
      const speed = (inWater ? P.snakeWater : P.snakeSpeed) * this.enemyMult;
      const dx = player.x - snake.x;
      const dy = player.y - snake.y;
      const d = Math.hypot(dx, dy) || 1;
      snake.x += (dx / d) * speed * dt;
      snake.y += (dy / d) * speed * dt;
      snake.heading = Math.atan2(dy, dx);
      const head = snake.body[0];
      if (!head || Math.hypot(snake.x - head.x, snake.y - head.y) > P.snakeSegment) {
        snake.body.unshift({ x: snake.x, y: snake.y });
      }
      let total = 0;
      for (let i = 1; i < snake.body.length; i += 1) {
        total += Math.hypot(snake.body[i].x - snake.body[i - 1].x, snake.body[i].y - snake.body[i - 1].y);
        if (total >= P.snakeLength) {
          snake.body.length = i + 1;
          break;
        }
      }
      if (Math.hypot(player.x - snake.x, player.y - snake.y) < P.snakeRadius + player.radius) {
        this.startScare('THE TITANOBOA GOT YOU');
        return;
      }
    }
  }

  updateRound(dt, input) {
    this.updatePlayer(dt, input);
    const player = this.player;
    const zone = this.zoneAt(player.x);
    if (zone !== this.zoneIndex) {
      this.zoneIndex = zone;
      this.zoneBanner = 3;
      this.dunk.active = zone === 0;
      this.raptor.active = zone === 1;
      if (zone === 1) {
        this.raptor.x = Math.max(this.raptor.x, player.x - 360);
        this.setNote("RUN ON YOUR FINS — THE RAPTOR WON'T FOLLOW INTO THE WATER");
      } else if (zone === 2) {
        this.setNote('LAND AND WATER — OUTRUN THE TITANOBOA');
      }
    }
    if (zone === 2 && !this.introduced) {
      this.startIntro();
      return;
    }

    for (const ammonite of this.ammonites) {
      if (ammonite.dead) continue;
      ammonite.phase += ammonite.spin * dt;
      if (Math.hypot(player.x - ammonite.x, player.y - ammonite.y) < P.ammoniteRadius + player.radius) {
        ammonite.dead = true;
        player.x = Math.max(this.zoneStarts[0], player.x - P.ammoniteKnock);
        player.vy -= 160;
        this.shake = 0.7;
        this.particles.burst(ammonite.x, ammonite.y, {
          count: 16,
          speed: 200,
          life: 0.7,
          colors: ['#c9b98a', '#8a7a52', '#ffffff'],
          buoyancy: 20,
        });
        this.game.audio.tone({ freq: 180, endFreq: 90, type: 'sawtooth', duration: 0.3, volume: 0.24 });
      }
    }
    this.ammonites = this.ammonites.filter((a) => !a.dead || a.x < this.zoneStarts[1]);
    if (this.ammonites.length < P.ammoniteCount) {
      const fresh = this.newAmmonite();
      if (fresh.x > player.x - 200) this.ammonites.push(fresh);
    }

    this.updateChasers(dt);
    if (this.phase !== 'play') return;

    this.progress = clamp((player.x - this.zoneStarts[0]) / (this.worldEnd - this.zoneStarts[0]), 0, 1);
    if (player.x >= this.worldEnd - 70) this.finish(true);
  }

  paintTube(ctx, points, radius, fill, edge) {
    const n = points.length;
    if (n < 2) return;
    const left = [];
    const right = [];
    const normals = [];
    for (let i = 0; i < n; i += 1) {
      const before = points[Math.max(0, i - 1)];
      const after = points[Math.min(n - 1, i + 1)];
      let tx = before.x - after.x;
      let ty = before.y - after.y;
      const len = Math.hypot(tx, ty) || 1;
      tx /= len;
      ty /= len;
      const t = i / (n - 1);
      const w = radius * (0.32 + 0.68 * Math.pow(1 - t, 0.5));
      left.push({ x: points[i].x - ty * w, y: points[i].y + tx * w, w });
      right.push({ x: points[i].x + ty * w, y: points[i].y - tx * w, w });
      normals.push({ nx: -ty, ny: tx });
    }
    const outline = () => {
      ctx.beginPath();
      ctx.moveTo(left[0].x, left[0].y);
      for (let i = 1; i < n; i += 1) ctx.lineTo(left[i].x, left[i].y);
      for (let i = n - 1; i >= 0; i -= 1) ctx.lineTo(right[i].x, right[i].y);
      ctx.closePath();
    };
    outline();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#cfe0a0';
    ctx.lineWidth = radius * 0.26;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < n; i += 1) {
      const off = left[i].w * 0.42;
      const px = points[i].x + normals[i].nx * off;
      const py = points[i].y + normals[i].ny * off;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(30, 40, 16, 0.8)';
    for (let i = 3; i < n - 3; i += 3) {
      const w = left[i].w;
      const dx = (points[i + 1].x - points[i].x) * 0.45;
      const dy = (points[i + 1].y - points[i].y) * 0.45;
      ctx.beginPath();
      ctx.moveTo(points[i].x - normals[i].nx * w * 0.5, points[i].y - normals[i].ny * w * 0.5);
      ctx.lineTo(points[i].x + normals[i].nx * w * 0.5 + dx, points[i].y + normals[i].ny * w * 0.5 + dy);
      ctx.lineTo(points[i].x + normals[i].nx * w * 0.5 - dx, points[i].y + normals[i].ny * w * 0.5 - dy);
      ctx.closePath();
      ctx.fill();
    }
    outline();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  drawAmmonite(ctx, a) {
    const R = P.ammoniteRadius;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.phase);
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass += 1) {
      ctx.beginPath();
      for (let i = 0; i <= 60; i += 1) {
        const t = i / 60;
        const ang = t * TAU * 2.6;
        const rad = 2 + Math.pow(t, 1.35) * R;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = pass === 0 ? '#6d5e3c' : '#c9b98a';
      ctx.lineWidth = pass === 0 ? 7 : 3.5;
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(60, 50, 28, 0.5)';
    ctx.lineWidth = 1.1;
    for (let i = 1; i < 20; i += 1) {
      const t = i / 20;
      const ang = t * TAU * 2.6;
      const r1 = 2 + Math.pow(t, 1.35) * R;
      const r2 = 2 + Math.pow(t + 0.04, 1.35) * R;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
      ctx.lineTo(Math.cos(ang) * Math.min(r2, R), Math.sin(ang) * Math.min(r2, R));
      ctx.stroke();
    }
    ctx.strokeStyle = '#a17e5c';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 6; i += 1) {
      const ang = -0.35 + i * 0.22 + Math.sin(this.time * 2 + i) * 0.08;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * R * 0.85, Math.sin(ang) * R * 0.85);
      ctx.lineTo(Math.cos(ang) * R * 1.45, Math.sin(ang) * R * 1.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawDunkleosteus(ctx, x, y) {
    const r = P.dunkRadius;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(this.player.x < x ? -1 : 1, 1);
    ctx.fillStyle = '#3d4450';
    ctx.beginPath();
    ctx.moveTo(-r * 1.4, 0);
    ctx.quadraticCurveTo(-r * 2.5, -r * 1.2, -r * 3.4, -r * 0.15);
    ctx.quadraticCurveTo(-r * 2.6, 0, -r * 3.4, r * 0.75);
    ctx.quadraticCurveTo(-r * 2.5, r * 1.0, -r * 1.4, 0);
    ctx.closePath();
    ctx.fill();
    const grad = ctx.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, '#707a8a');
    grad.addColorStop(0.5, '#565e6c');
    grad.addColorStop(1, '#3a404b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(r * 2.0, 0);
    ctx.quadraticCurveTo(r * 1.0, -r * 1.05, -r * 0.8, -r * 0.85);
    ctx.quadraticCurveTo(-r * 2.0, -r * 0.5, -r * 1.5, 0);
    ctx.quadraticCurveTo(-r * 2.0, r * 0.5, -r * 0.8, r * 0.85);
    ctx.quadraticCurveTo(r * 1.0, r * 1.05, r * 2.0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(24, 28, 36, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#cddbe6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 1.9, -r * 0.1);
    ctx.quadraticCurveTo(r * 0.9, -r * 1.0, -r * 0.8, -r * 0.82);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(30, 34, 42, 0.4)';
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-r * 0.6 + (i % 3) * r * 0.5, -r * 0.28 + Math.floor(i / 3) * r * 0.34, r * 0.1, r * 0.06, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#3d4450';
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, r * 0.7);
    ctx.quadraticCurveTo(r * 0.5, r * 1.7, -r * 0.6, r * 1.8);
    ctx.quadraticCurveTo(-r * 0.5, r * 1.1, -r * 0.1, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4a5260';
    ctx.beginPath();
    ctx.moveTo(r * 2.0, 0);
    ctx.quadraticCurveTo(r * 1.6, -r * 0.95, r * 0.5, -r * 0.95);
    ctx.quadraticCurveTo(r * 0.4, -r * 0.45, r * 0.62, -r * 0.12);
    ctx.quadraticCurveTo(r * 0.45, -r * 0.3, r * 0.22, 0);
    ctx.quadraticCurveTo(r * 0.45, r * 0.3, r * 0.62, r * 0.12);
    ctx.quadraticCurveTo(r * 0.4, r * 0.45, r * 0.5, r * 0.95);
    ctx.quadraticCurveTo(r * 1.6, r * 0.95, r * 2.0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 24, 30, 0.45)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(r * (0.62 + i * 0.44), -r * 0.88);
      ctx.lineTo(r * (0.52 + i * 0.44), r * 0.88);
      ctx.stroke();
    }
    ctx.fillStyle = '#2b2f38';
    ctx.beginPath();
    ctx.moveTo(r * 2.0, -r * 0.12);
    ctx.lineTo(r * 2.6, r * 0.5);
    ctx.lineTo(r * 1.45, r * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a404b';
    ctx.beginPath();
    ctx.moveTo(r * 2.0, r * 0.12);
    ctx.lineTo(r * 2.6, -r * 0.5);
    ctx.lineTo(r * 1.45, -r * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8e2c4';
    ctx.beginPath();
    ctx.moveTo(r * 2.55, r * 0.44);
    ctx.lineTo(r * 2.15, r * 0.3);
    ctx.lineTo(r * 2.5, r * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r * 2.55, -r * 0.44);
    ctx.lineTo(r * 2.15, -r * 0.3);
    ctx.lineTo(r * 2.5, -r * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0d0f14';
    ctx.beginPath();
    ctx.arc(r * 1.1, -r * 0.5, r * 0.18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8e2c4';
    ctx.beginPath();
    ctx.arc(r * 1.16, -r * 0.56, r * 0.05, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawRaptor(ctx, x, y) {
    const r = P.raptorRadius;
    const run = Math.sin(this.time * 16) * r * 0.9;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(this.player.x < x ? -1 : 1, 1);
    ctx.strokeStyle = '#8a7a4e';
    ctx.lineWidth = r * 0.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, 0);
    ctx.quadraticCurveTo(-r * 2.0, -r * 0.3, -r * 3.4, -r * 0.9);
    ctx.stroke();
    ctx.strokeStyle = '#c9bf8a';
    ctx.lineWidth = r * 0.18;
    for (let i = 1; i < 6; i += 1) {
      const t = i / 6;
      const px = -r * 0.4 - t * r * 3.0;
      const py = -t * r * 0.9 - Math.sin(t * 2) * r * 0.1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - r * 0.25, py - r * 0.55);
      ctx.stroke();
    }
    const grad = ctx.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, '#93a35e');
    grad.addColorStop(1, '#586634');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.25, r * 0.72, -0.12, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 74, 40, 0.4)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 8; i += 1) {
      const px = -r * 0.8 + i * r * 0.28;
      ctx.beginPath();
      ctx.moveTo(px, -r * 0.5);
      ctx.lineTo(px - r * 0.16, r * 0.4);
      ctx.stroke();
    }
    ctx.strokeStyle = '#93a35e';
    ctx.lineWidth = r * 0.5;
    ctx.beginPath();
    ctx.moveTo(r * 0.8, -r * 0.3);
    ctx.quadraticCurveTo(r * 1.4, -r * 0.95, r * 2.0, -r * 0.72);
    ctx.stroke();
    ctx.fillStyle = '#9aa966';
    ctx.beginPath();
    ctx.moveTo(r * 1.75, -r * 0.78);
    ctx.quadraticCurveTo(r * 3.0, -r * 1.0, r * 3.35, -r * 0.5);
    ctx.quadraticCurveTo(r * 2.6, -r * 0.28, r * 1.75, -r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3a4a20';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 3.3, -r * 0.5);
    ctx.lineTo(r * 1.95, -r * 0.42);
    ctx.stroke();
    ctx.fillStyle = '#e8e2c4';
    for (let i = 0; i < 5; i += 1) {
      const tx = r * 2.15 + i * r * 0.22;
      ctx.beginPath();
      ctx.moveTo(tx, -r * 0.48);
      ctx.lineTo(tx + r * 0.09, -r * 0.48);
      ctx.lineTo(tx + r * 0.045, -r * 0.28);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#d8c86a';
    ctx.beginPath();
    ctx.arc(r * 2.5, -r * 0.72, r * 0.15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0a0a06';
    ctx.beginPath();
    ctx.arc(r * 2.55, -r * 0.72, r * 0.06, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c9bf8a';
    ctx.beginPath();
    ctx.moveTo(r * 0.6, r * 0.1);
    ctx.quadraticCurveTo(r * 1.3, r * 0.55, r * 1.7, r * 0.15);
    ctx.quadraticCurveTo(r * 1.0, r * 0.42, r * 0.6, r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6a7a44';
    ctx.lineWidth = r * 0.26;
    for (const [hx, legSwing, back] of [[0.35, run, false], [-0.1, -run, true]]) {
      const hipX = hx * r;
      const hipY = r * 0.5;
      const kneeX = hipX + legSwing * 0.5;
      const kneeY = hipY + r * 0.85;
      const footX = hipX + legSwing;
      const footY = hipY + r * 1.5;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();
      ctx.strokeStyle = '#e8e2c4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(footX, footY);
      ctx.lineTo(footX + (back ? -1 : 1) * r * 0.22, footY - r * 0.08);
      ctx.stroke();
      ctx.strokeStyle = '#6a7a44';
      ctx.lineWidth = r * 0.26;
    }
    ctx.restore();
  }

  drawSnake(ctx, x, y) {
    if (this.snake.body.length > 1) {
      this.paintTube(ctx, this.snake.body, P.snakeRadius, '#5f7c3a', 'rgba(20, 28, 10, 0.55)');
    }
    const r = P.snakeRadius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.snake.heading);
    ctx.fillStyle = '#7fa04e';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.25, r * 0.8, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 28, 10, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#6f8f45';
    ctx.beginPath();
    ctx.moveTo(r * 1.15, -r * 0.42);
    ctx.quadraticCurveTo(r * 1.95, 0, r * 1.15, r * 0.42);
    ctx.quadraticCurveTo(r * 0.85, 0, r * 1.15, -r * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a3416';
    ctx.beginPath();
    ctx.arc(r * 1.6, -r * 0.16, r * 0.06, 0, TAU);
    ctx.arc(r * 1.6, r * 0.16, r * 0.06, 0, TAU);
    ctx.fill();
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#d8c86a';
      ctx.beginPath();
      ctx.ellipse(r * 0.5, s * r * 0.42, r * 0.2, r * 0.16, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#0a0a06';
      ctx.beginPath();
      ctx.ellipse(r * 0.54, s * r * 0.42, r * 0.05, r * 0.14, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#3a4a20';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r * 0.5, s * r * 0.42, r * 0.24, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
    const flick = Math.max(0, Math.sin(this.time * 3 + 1) - 0.4);
    if (flick > 0) {
      ctx.strokeStyle = '#c04a5a';
      ctx.lineWidth = 2.5;
      const base = r * 1.9;
      const tip = base + flick * r * 0.8;
      ctx.beginPath();
      ctx.moveTo(base, 0);
      ctx.lineTo(tip, 0);
      ctx.moveTo(tip, 0);
      ctx.lineTo(tip + r * 0.2, -r * 0.18);
      ctx.moveTo(tip, 0);
      ctx.lineTo(tip + r * 0.2, r * 0.18);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawDecor(ctx, d) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(d.s, d.s);
    if (d.kind === 'kelp') {
      ctx.strokeStyle = 'rgba(60, 120, 74, 0.8)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        const sway = Math.sin(this.time * 1.1 + d.phase + i) * 14;
        ctx.beginPath();
        ctx.moveTo(i * 10, 0);
        ctx.quadraticCurveTo(sway + i * 10, -90, sway * 1.5 + i * 10, -190);
        ctx.stroke();
      }
    } else if (d.kind === 'rock') {
      const rockGrad = ctx.createLinearGradient(-34, -22, 34, 22);
      rockGrad.addColorStop(0, '#756f61');
      rockGrad.addColorStop(0.5, '#5a564c');
      rockGrad.addColorStop(1, '#3a3730');
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.moveTo(-34, 0);
      ctx.quadraticCurveTo(-30, -24, -6, -22);
      ctx.quadraticCurveTo(26, -20, 34, 2);
      ctx.quadraticCurveTo(24, 20, -4, 20);
      ctx.quadraticCurveTo(-30, 18, -34, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(20, 18, 14, 0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(200, 195, 180, 0.28)';
      ctx.beginPath();
      ctx.ellipse(-12, -12, 16, 7, -0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(60, 80, 50, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-20, 12, 8, 4, 0, 0, TAU);
      ctx.ellipse(10, 14, 6, 3, 0, 0, TAU);
      ctx.fill();
    } else if (d.kind === 'fern') {
      const sway = Math.sin(this.time * 0.9 + d.phase) * 0.1;
      ctx.strokeStyle = '#3f6b34';
      ctx.lineWidth = 4;
      for (let i = -2; i <= 2; i += 1) {
        ctx.save();
        ctx.rotate(i * 0.5 + sway);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(0, -50, 0, -96);
        ctx.stroke();
        ctx.lineWidth = 2;
        for (let k = 1; k <= 4; k += 1) {
          const y = -k * 20;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(-20, y - 8);
          ctx.moveTo(0, y);
          ctx.lineTo(20, y - 8);
          ctx.stroke();
        }
        ctx.lineWidth = 4;
        ctx.restore();
      }
    } else if (d.kind === 'log') {
      ctx.fillStyle = '#4a3826';
      ctx.beginPath();
      ctx.ellipse(0, 0, 40, 14, 0.1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#5c4a34';
      ctx.beginPath();
      ctx.ellipse(-34, -2, 10, 12, 0.1, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  renderBackdrop(ctx) {
    const zone0 = this.zoneIndex === 0;
    const horizon = H * 0.52;
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    if (zone0) {
      sky.addColorStop(0, '#20525f');
      sky.addColorStop(0.6, '#123540');
      sky.addColorStop(1, '#0a222a');
    } else {
      sky.addColorStop(0, '#8a9660');
      sky.addColorStop(0.5, '#586a42');
      sky.addColorStop(1, '#2b3d24');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon + 40);

    const sunX = W * 0.72;
    const sunY = horizon - 132;
    const corona = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 320);
    corona.addColorStop(0, zone0 ? 'rgba(180, 235, 225, 0.55)' : 'rgba(255, 238, 190, 0.7)');
    corona.addColorStop(0.35, zone0 ? 'rgba(140, 210, 210, 0.18)' : 'rgba(255, 220, 150, 0.24)');
    corona.addColorStop(1, 'rgba(255, 220, 150, 0)');
    ctx.fillStyle = corona;
    ctx.fillRect(0, 0, W, horizon + 40);
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.globalAlpha = zone0 ? 0.16 : 0.28;
    for (let i = 0; i < 12; i += 1) {
      ctx.rotate(TAU / 12);
      const len = 260 + Math.sin(this.time * 0.5 + i) * 30;
      ctx.fillStyle = zone0 ? '#d8f4ee' : '#ffeec4';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(len, -2);
      ctx.lineTo(len, 2);
      ctx.lineTo(0, 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = zone0 ? 'rgba(210, 250, 244, 0.8)' : 'rgba(255, 246, 214, 0.9)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 54, 0, TAU);
    ctx.fill();

    ctx.fillStyle = zone0 ? 'rgba(220, 240, 245, 0.16)' : 'rgba(240, 235, 210, 0.2)';
    const cloudOff = (this.cameraX * 0.08) % 700;
    for (let i = -1; i < 3; i += 1) {
      const bx = i * 700 - cloudOff;
      for (let k = 0; k < 5; k += 1) {
        const px = bx + k * 130 + Math.sin(this.time * 0.1 + k) * 10;
        const py = horizon - 250 - (k % 2) * 30;
        ctx.beginPath();
        ctx.ellipse(px, py, 90, 26, 0, 0, TAU);
        ctx.fill();
      }
    }

    const layers = [
      { f: 0.1, h: 240, color: zone0 ? 'rgba(16, 40, 48, 0.85)' : 'rgba(30, 46, 30, 0.85)' },
      { f: 0.2, h: 180, color: zone0 ? 'rgba(20, 50, 58, 0.9)' : 'rgba(38, 56, 36, 0.9)' },
      { f: 0.32, h: 130, color: zone0 ? 'rgba(24, 58, 66, 0.95)' : 'rgba(46, 66, 40, 0.95)' },
    ];
    for (const layer of layers) {
      const off = (this.cameraX * layer.f) % 520;
      ctx.fillStyle = layer.color;
      for (let i = -1; i < 4; i += 1) {
        const bx = i * 520 - off;
        ctx.beginPath();
        ctx.moveTo(bx, horizon + 20);
        ctx.quadraticCurveTo(bx + 130, horizon - layer.h, bx + 260, horizon + 20);
        ctx.quadraticCurveTo(bx + 390, horizon - layer.h * 1.25, bx + 520, horizon + 20);
        ctx.lineTo(bx + 520, horizon + 40);
        ctx.lineTo(bx, horizon + 40);
        ctx.closePath();
        ctx.fill();
      }
    }

    const volc = W * 0.2 - ((this.cameraX * 0.1) % 1500);
    if (volc > -260 && volc < W + 260) {
      ctx.fillStyle = 'rgba(28, 30, 34, 0.9)';
      ctx.beginPath();
      ctx.moveTo(volc - 170, horizon + 20);
      ctx.lineTo(volc - 26, horizon - 210);
      ctx.lineTo(volc + 26, horizon - 210);
      ctx.lineTo(volc + 170, horizon + 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(220, 90, 40, 0.85)';
      ctx.beginPath();
      ctx.moveTo(volc - 26, horizon - 210);
      ctx.lineTo(volc, horizon - 196);
      ctx.lineTo(volc + 26, horizon - 210);
      ctx.lineTo(volc + 14, horizon - 176);
      ctx.lineTo(volc - 14, horizon - 176);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#2a2a2e';
      for (let i = 0; i < 6; i += 1) {
        const puff = (this.time * 14 + i * 40) % 240;
        ctx.beginPath();
        ctx.arc(volc + Math.sin(i) * 20, horizon - 220 - puff, 34 + puff * 0.2, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    const water = ctx.createLinearGradient(0, horizon, 0, H);
    if (zone0) {
      water.addColorStop(0, '#155060');
      water.addColorStop(1, '#03121a');
    } else {
      water.addColorStop(0, '#365040');
      water.addColorStop(1, '#0a1a12');
    }
    ctx.fillStyle = water;
    ctx.fillRect(0, horizon, W, H - horizon);

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#d8f0e0';
    ctx.lineWidth = 3;
    const surfOff = (this.cameraX * 0.6) % 46;
    ctx.beginPath();
    for (let x = -surfOff - 46; x < W + 46; x += 46) {
      const y = horizon + 2 + Math.sin(x * 0.05 + this.time * 2) * 3;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 23, y - 3);
      ctx.lineTo(x + 46, y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#d8f0e0';
    for (let i = 0; i < 6; i += 1) {
      const sway = Math.sin(this.time * 0.4 + i * 1.7) * 70;
      const bx = (i / 6) * W + sway;
      ctx.beginPath();
      ctx.moveTo(bx - 26, horizon);
      ctx.lineTo(bx + 26, horizon);
      ctx.lineTo(bx + 130, H);
      ctx.lineTo(bx + 30, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#bff0e0';
    for (let i = 0; i < 30; i += 1) {
      const px = ((i * 173 + this.time * 12) % (W + 40)) - 20;
      const py = horizon + 30 + ((i * 97) % (H - horizon));
      const s = 6 + ((i * 37) % 14);
      ctx.beginPath();
      ctx.ellipse(px, py, s, s * 0.4, 0.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  renderMotes(ctx, factor) {
    ctx.save();
    for (const m of this.motes) {
      const sx = m.x - this.cameraX * factor;
      if (sx < -10 || sx > W + 10) continue;
      const sy = m.y + Math.sin(this.time * 0.6 + m.phase) * 12;
      ctx.globalAlpha = 0.25 * m.z * factor;
      ctx.fillStyle = factor > 0.8 ? '#dff4ea' : '#bfe0dc';
      ctx.beginPath();
      ctx.arc(sx, sy, m.r * m.z, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  renderForeground(ctx) {
    ctx.save();
    for (const f of this.foreground) {
      const sx = f.x - this.cameraX * 1.28;
      if (sx < -60 || sx > W + 60) continue;
      ctx.save();
      ctx.translate(sx, H + 24);
      ctx.scale(f.s, f.s);
      ctx.globalAlpha = 0.92;
      if (f.kind === 'reed') {
        ctx.strokeStyle = '#0a1410';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        for (let i = -1; i <= 1; i += 1) {
          const sway = Math.sin(this.time * 1.2 + f.phase + i) * 20;
          ctx.beginPath();
          ctx.moveTo(i * 12, 0);
          ctx.quadraticCurveTo(sway + i * 12, -70, sway * 1.6 + i * 12, -150);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#0a1410';
        ctx.beginPath();
        ctx.ellipse(0, 0, 60, 34, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  renderGrade(ctx) {
    const vig = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.32, W / 2, H * 0.5, H * 1.05);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(2, 8, 6, 0.6)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
    if (this.zoneIndex === 0) {
      ctx.fillStyle = 'rgba(20, 60, 70, 0.1)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = 'rgba(70, 80, 30, 0.08)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  renderGround(ctx) {
    if (this.zoneIndex === 0) return;
    const from = Math.floor(this.cameraX / 40) * 40;
    for (let x = from; x < this.cameraX + W + 40; x += 40) {
      if (this.isWater(x + 20)) continue;
      const soil = ctx.createLinearGradient(0, this.groundY, 0, H);
      soil.addColorStop(0, '#3a4a26');
      soil.addColorStop(0.35, '#2b3a1e');
      soil.addColorStop(1, '#171f12');
      ctx.fillStyle = soil;
      ctx.fillRect(x, this.groundY, 42, H - this.groundY + 60);
    }
    for (let x = from; x < this.cameraX + W + 40; x += 40) {
      if (this.isWater(x + 20)) continue;
      ctx.fillStyle = '#4a5f30';
      ctx.beginPath();
      ctx.moveTo(x, this.groundY);
      ctx.lineTo(x + 21, this.groundY - 7 - ((x * 13) % 5));
      ctx.lineTo(x + 42, this.groundY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(20, 26, 14, 0.45)';
    ctx.lineWidth = 2;
    for (let x = from; x < this.cameraX + W + 40; x += 80) {
      if (this.isWater(x + 40)) continue;
      ctx.beginPath();
      ctx.moveTo(x, this.groundY + 24);
      ctx.quadraticCurveTo(x + 40, this.groundY + 30 + ((x * 7) % 20), x + 80, this.groundY + 18);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(120, 96, 60, 0.3)';
    for (let x = from; x < this.cameraX + W + 40; x += 26) {
      if (this.isWater(x + 13)) continue;
      ctx.fillRect(x, this.groundY + 34 + ((x * 7) % 34), 14, 4);
    }
    ctx.fillStyle = 'rgba(150, 190, 90, 0.35)';
    for (let x = from; x < this.cameraX + W + 40; x += 34) {
      if (this.isWater(x + 17)) continue;
      ctx.fillRect(x, this.groundY - 3, 4, 8);
      ctx.fillRect(x + 8, this.groundY - 1, 3, 6);
    }
    ctx.strokeStyle = 'rgba(60, 44, 28, 0.6)';
    ctx.lineWidth = 3;
    for (let x = from; x < this.cameraX + W + 40; x += 120) {
      if (this.isWater(x + 60)) continue;
      ctx.beginPath();
      ctx.moveTo(x, this.groundY);
      ctx.quadraticCurveTo(x + 16, this.groundY + 30, x + 6, this.groundY + 60);
      ctx.moveTo(x + 30, this.groundY);
      ctx.quadraticCurveTo(x + 40, this.groundY + 34, x + 52, this.groundY + 58);
      ctx.stroke();
    }
    for (const gap of this.waterGaps) {
      if (gap.x + gap.w < this.cameraX - 60 || gap.x > this.cameraX + W + 60) continue;
      const water = ctx.createLinearGradient(0, this.groundY, 0, H);
      water.addColorStop(0, 'rgba(60, 120, 128, 0.8)');
      water.addColorStop(0.4, 'rgba(24, 64, 72, 0.9)');
      water.addColorStop(1, 'rgba(8, 24, 30, 0.95)');
      ctx.fillStyle = water;
      ctx.fillRect(gap.x, this.groundY, gap.w, H - this.groundY + 60);
      ctx.strokeStyle = 'rgba(200, 245, 235, 0.3)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(gap.x, this.groundY + 2);
      ctx.quadraticCurveTo(gap.x + gap.w / 2, this.groundY + Math.sin(this.time * 2 + gap.x) * 5, gap.x + gap.w, this.groundY + 2);
      ctx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#cfeef0';
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 3; k += 1) {
        const rx = gap.x + ((k + 1) / 4) * gap.w;
        ctx.beginPath();
        ctx.ellipse(rx, this.groundY + 24 + k * 8, gap.w * 0.32, 6, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(60, 90, 50, 0.8)';
      ctx.lineWidth = 4;
      for (const edge of [gap.x - 2, gap.x + gap.w + 2]) {
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.moveTo(edge, this.groundY);
          ctx.quadraticCurveTo(edge + i * 6, this.groundY - 20, edge + i * 10, this.groundY - 40);
          ctx.stroke();
        }
      }
    }
  }

  renderCorridor(ctx) {
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    for (const d of this.decor) {
      if (d.x < this.cameraX - 80 || d.x > this.cameraX + W + 80) continue;
      this.drawDecor(ctx, d);
    }
    for (const ammonite of this.ammonites) this.drawAmmonite(ctx, ammonite);
    this.renderGround(ctx);
    if (this.zoneIndex === 0 && this.dunk.active) this.drawDunkleosteus(ctx, this.dunk.x, this.dunk.y);
    if (this.zoneIndex === 1) this.drawRaptor(ctx, this.raptor.x, this.raptor.y);
    if (this.zoneIndex === 2 && this.snake.active) this.drawSnake(ctx, this.snake.x, this.snake.y);
    if (seasonOn()) {
      const hatSeason = currentSeason();
      if (this.zoneIndex === 0 && this.dunk.active) {
        drawSeasonHat(ctx, this.dunk.x, this.dunk.y - P.dunkRadius * 0.9, P.dunkRadius * 0.5, hatSeason);
      } else if (this.zoneIndex === 1) {
        drawSeasonHat(ctx, this.raptor.x, this.raptor.y - P.raptorRadius * 1.1, P.raptorRadius * 0.5, hatSeason);
      } else if (this.zoneIndex === 2 && this.snake.active) {
        drawSeasonHat(ctx, this.snake.x, this.snake.y - P.snakeRadius * 0.9, P.snakeRadius * 0.5, hatSeason);
      }
    }
    for (let index = 0; index < this.players.length; index += 1) {
      applyWardrobe(this.shop, index);
      const player = this.players[index];
      player.render(ctx);
      drawTrail(ctx, player);
      drawCompanion(ctx, player);
    }
    this.particles.render(ctx);
    ctx.restore();
  }

  renderHud(ctx) {
    drawText(ctx, `PREHISTORIC TANK — ${ZONE_NAMES[this.zoneIndex]}`, W / 2, 28, {
      size: 17,
      color: COLORS.text,
      glow: COLORS.bubble,
      glowBlur: 12,
    });
    const barX = 160;
    const barW = W - 320;
    fillRoundRect(ctx, barX, 48, barW, 12, 6, 'rgba(4, 16, 29, 0.7)');
    fillRoundRect(ctx, barX, 48, barW * this.progress, 12, 6, COLORS.accent);
    for (let i = 1; i < 3; i += 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX + (barW * i) / 3 - 1, 46, 3, 16);
    }
    strokeRoundRect(ctx, barX, 48, barW, 12, 6, 'rgba(207, 239, 255, 0.35)', 2);
    drawText(ctx, ZONE_FOE[this.zoneIndex], W / 2, 74, {
      size: 13,
      color: COLORS.danger,
      alpha: 0.9,
    });
    if (this.zoneBanner > 0) {
      drawText(ctx, ZONE_NAMES[this.zoneIndex], W / 2, 120, {
        size: 26,
        color: COLORS.text,
        glow: COLORS.bubble,
        glowBlur: 16,
        alpha: Math.min(1, this.zoneBanner),
      });
    }
    if (this.note > 0) {
      drawText(ctx, this.noteText, W / 2, H - 20, {
        size: 12,
        color: COLORS.textDim,
        alpha: Math.min(1, this.note),
      });
    }
  }

  drawSnakeOnTree(ctx) {
    const cx = W / 2;
    const baseY = H * 0.86;
    ctx.fillStyle = '#20301a';
    ctx.fillRect(0, baseY, W, H - baseY);
    ctx.fillStyle = 'rgba(60, 90, 50, 0.4)';
    ctx.fillRect(0, baseY, W, 5);
    const trunkTop = baseY - H * 0.5;
    const bark = ctx.createLinearGradient(cx - 44, 0, cx + 44, 0);
    bark.addColorStop(0, '#33261a');
    bark.addColorStop(0.5, '#5a4630');
    bark.addColorStop(1, '#33261a');
    ctx.fillStyle = bark;
    ctx.beginPath();
    ctx.moveTo(cx - 46, baseY);
    ctx.quadraticCurveTo(cx - 24, baseY - H * 0.3, cx - 28, trunkTop);
    ctx.lineTo(cx + 28, trunkTop);
    ctx.quadraticCurveTo(cx + 24, baseY - H * 0.3, cx + 46, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(18, 12, 6, 0.5)';
    ctx.lineWidth = 2;
    for (const i of [-16, -4, 10]) {
      ctx.beginPath();
      ctx.moveTo(cx + i, baseY - 8);
      ctx.quadraticCurveTo(cx + i + 5, baseY - H * 0.3, cx + i * 0.6, trunkTop + 18);
      ctx.stroke();
    }
    ctx.strokeStyle = '#40301e';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    for (const [ex, ey] of [[cx - 210, trunkTop + 10], [cx + 200, trunkTop], [cx + 30, trunkTop - 130]]) {
      ctx.beginPath();
      ctx.moveTo(cx, trunkTop + 60);
      ctx.quadraticCurveTo((cx + ex) / 2, (trunkTop + ey) / 2 - 50, ex, ey);
      ctx.stroke();
    }
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * TAU;
      const px = cx + Math.cos(a) * (160 + (i % 3) * 34);
      const py = trunkTop - 24 + Math.sin(a) * (72 + (i % 2) * 22);
      ctx.fillStyle = i % 2 === 0 ? '#2c4a24' : '#3c5e30';
      ctx.beginPath();
      ctx.ellipse(px, py, 74, 34, a, 0, TAU);
      ctx.fill();
    }
    const coil = this.introTimer * 0.7;
    const path = [];
    const steps = 44;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const py = trunkTop - 34 + t * (baseY - (trunkTop - 34));
      const px = cx + Math.sin(t * 6.4 + coil) * (36 + t * 22);
      path.push({ x: px, y: py });
    }
    this.paintTube(ctx, path, 26, '#5f7c3a', 'rgba(20, 28, 10, 0.55)');
    ctx.fillStyle = 'rgba(38, 50, 20, 0.85)';
    for (let i = 4; i < path.length - 4; i += 4) {
      const p = path[i];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 12);
      ctx.lineTo(p.x + 8, p.y);
      ctx.lineTo(p.x, p.y + 12);
      ctx.lineTo(p.x - 8, p.y);
      ctx.closePath();
      ctx.fill();
    }
    const headX = path[0].x;
    const headY = path[0].y;
    ctx.fillStyle = '#7fa04e';
    ctx.beginPath();
    ctx.ellipse(headX, headY, 34, 22, 0.3, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 28, 10, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#d8c86a';
      ctx.beginPath();
      ctx.ellipse(headX + 10, headY + s * 10, 6, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#0a0a06';
      ctx.beginPath();
      ctx.ellipse(headX + 11, headY + s * 10, 1.6, 4.2, 0, 0, TAU);
      ctx.fill();
    }
    const flick = Math.max(0, Math.sin(this.time * 3 + 1) - 0.3);
    if (flick > 0) {
      ctx.strokeStyle = '#c04a5a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(headX, headY - 22);
      ctx.lineTo(headX + 6, headY - 22 - flick * 26);
      ctx.moveTo(headX + 6, headY - 22 - flick * 26);
      ctx.lineTo(headX - 2, headY - 26 - flick * 26);
      ctx.moveTo(headX + 6, headY - 22 - flick * 26);
      ctx.lineTo(headX + 16, headY - 26 - flick * 26);
      ctx.stroke();
    }
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('back')) {
      this.game.changeScene(this.backScene());
      return;
    }
    if (this.phase === 'results') {
      this.resultsMenu.update(dt, input);
      return;
    }
    this.elapsed += dt;
    this.zoneBanner = Math.max(0, this.zoneBanner - dt);
    this.note = Math.max(0, this.note - dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 1.8);
    if (this.phase === 'intro') {
      this.introTimer += dt;
      if (input.wasPressed('confirm') || this.introTimer >= P.introTime) {
        this.snake.active = true;
        this.snake.x = this.player.x - 440;
        this.snake.y = this.player.y;
        this.snake.heading = 0;
        this.fillSnakeBody();
        this.phase = 'play';
        this.setNote('IT DROPS FROM THE TREE — OUTRUN THE TITANOBOA');
      }
    } else if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
    } else {
      this.updateRound(dt, input);
    }
    this.particles.update(dt);
  }

  renderScare(ctx) {
    const t = 1 - this.scareTimer / 1.5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, W, H);
    const scale = 0.7 + t * 2.2;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    if (this.zoneIndex === 0) this.drawDunkleosteus(ctx, 0, 0);
    else if (this.zoneIndex === 1) this.drawRaptor(ctx, 0, 0);
    else this.drawSnake(ctx, 0, 0);
    ctx.restore();
    ctx.fillStyle = `rgba(120, 0, 0, ${0.4 * (1 - t)})`;
    ctx.fillRect(0, 0, W, H);
  }

  render(ctx) {
    setSkinClock(this.time);
    if (this.phase === 'intro') {
      this.renderIntro(ctx);
      return;
    }
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-1, 1) * 9 * this.shake * motionScale(), rand(-1, 1) * 9 * this.shake * motionScale());
    }
    this.cameraX = clamp(this.player.x - W * 0.4, 0, Math.max(0, this.worldEnd - W));
    this.renderBackdrop(ctx);
    this.renderMotes(ctx, 0.5);
    this.renderCorridor(ctx);
    this.renderMotes(ctx, 1);
    this.renderForeground(ctx);
    ctx.restore();
    this.renderGrade(ctx);
    this.renderHud(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 129, ${this.flash * 0.35 * motionScale()})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.phase === 'scare') this.renderScare(ctx);
    else if (this.phase === 'results') this.renderResults(ctx);
  }

  renderIntro(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#33482f');
    sky.addColorStop(1, '#0c1610');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    this.drawSnakeOnTree(ctx);
    drawText(ctx, 'THE TITANOBOA RESTS IN THE TREE', W / 2, 74, {
      size: 22,
      color: COLORS.accent,
      glow: 'rgba(255,209,102,0.4)',
      glowBlur: 16,
      alpha: 0.94,
    });
    drawText(ctx, 'ITS COILS TIGHTEN — THEN IT DROPS', W / 2, 106, {
      size: 14,
      color: COLORS.danger,
      alpha: 0.85,
    });
    drawText(ctx, 'ENTER — CONTINUE', W / 2, H - 24, { size: 12, color: COLORS.textDim, alpha: 0.8 });
  }

  resultsTitle() {
    return 'PREHISTORIC TANK';
  }

  resultsHeadline() {
    return this.won ? 'YOU OUTRAN THE AGES!' : 'THE PAST CAUGHT YOU';
  }

  resultsDetail() {
    return this.won ? 'LUNGFISH SURVIVED THE WORLD' : this.reason ?? 'CAUGHT IN DEEP TIME';
  }
}
