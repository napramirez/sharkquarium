import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { circleOverlap } from '../engine/collision.js';
import { Shark } from '../entities/shark.js';
import { cute, renderCuteScare } from '../engine/cute.js';
import {
  CONTROLS,
  MUTANT,
  MUTANT_VARIANTS,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

const VARIANT_META = Object.fromEntries(MUTANT_VARIANTS.map((v) => [v.key, v]));
const FLESH = '#6a3a42';
const FLESH_DARK = '#3a1d24';
const BONE = '#d9cdb4';
const EYE = '#efe3d2';

function drawEye(ctx, x, y, r, look = 0) {
  ctx.fillStyle = EYE;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.82, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7a1418';
  ctx.beginPath();
  ctx.arc(x + look * r * 0.3, y, r * 0.45, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#160a0c';
  ctx.beginPath();
  ctx.arc(x + look * r * 0.3, y, r * 0.2, 0, TAU);
  ctx.fill();
}

function drawJaws(ctx, x, y, r, open, teeth = 6) {
  for (const side of [-1, 1]) {
    const gape = r * (0.4 + open * 0.5);
    ctx.fillStyle = FLESH_DARK;
    ctx.beginPath();
    ctx.ellipse(x, y + side * gape * 0.5, r, r * 0.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = BONE;
    for (let i = 0; i < teeth; i += 1) {
      const tx = x - r + (i + 0.5) * ((r * 2) / teeth);
      const w = ((r * 2) / teeth) * 0.5;
      ctx.beginPath();
      ctx.moveTo(tx - w, y + side * gape * 0.2);
      ctx.lineTo(tx + w, y + side * gape * 0.2);
      ctx.lineTo(tx, y + side * gape * 0.9);
      ctx.closePath();
      ctx.fill();
    }
  }
}

export class MutantScene extends MinigameScene {
  enter(params = {}) {
    this.variantKey = params.variant && VARIANT_META[params.variant] ? params.variant : 'graft';
    this.variant = VARIANT_META[this.variantKey];
    super.enter({ ...params, solo: true });
  }

  recordMode() {
    return `mutant_${this.variantKey}`;
  }

  buildRound() {
    this.phase = 'play';
    this.worldLength = MUTANT.worldLength;
    this.startX = MUTANT.startPadding;
    this.exitZone = { x: this.worldLength - MUTANT.exitLength * 0.5 };
    this.lives = MUTANT.lives;
    this.invuln = 0;
    this.stillTimer = 0;
    this.status = this.variant.blurb;
    this.statusTimer = 3;
    this.counter = 0;
    this.counterGoal = 0;
    this.timer = 0;
    this.scareTimer = 0;
    this.scareReason = '';
    this.mutations = 0;
    this.exposure = 0;
    this.vent = 0;
    this.gates = [];
    this.walls = [];
    this.checkpoints = [];
    for (let x = this.startX; x < this.worldLength - MUTANT.exitLength; x += MUTANT.wallSpacing) {
      const gapY = rand(150, LOGICAL_HEIGHT - 150);
      const w = 46;
      this.walls.push({ x, y: 0, w, h: Math.max(0, gapY - 74) });
      this.walls.push({ x, y: gapY + 74, w, h: Math.max(0, LOGICAL_HEIGHT - (gapY + 74)) });
      this.gates.push({ x, gapY });
    }
    for (let x = this.startX + 500; x < this.worldLength - MUTANT.exitLength; x += 900) {
      this.checkpoints.push({ x, active: false });
    }
    this.corpses = [];
    this.swarmers = [];
    this.decoys = [];
    this.fleshPatches = [];
    this.leaks = [];
    this.scrubbers = [];
    this.veins = [];
    this.grafts = [];
    this.sac = null;
    const player = new Shark(this.startX, LOGICAL_HEIGHT / 2, { controls: CONTROLS.solo, pointer: true });
    player.noIdleFlip = true;
    player.maxSpeed = MUTANT.playerSpeed;
    player.maxX = this.worldLength;
    this.players = [player];
    this.player = player;
    this.checkpointX = this.startX;
    this.hunter = this.makeHunter();
    this.setupVariant();
  }

  makeHunter() {
    return {
      x: this.startX - 340,
      y: LOGICAL_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: 46,
      phase: rand(0, TAU),
      facing: 1,
      state: 'hunt',
      limbs: 3,
      regrow: 0,
      alert: 0,
      gaze: rand(0, TAU),
      blink: 0,
      blinkTimer: 3,
      molt: 4,
      rage: 0,
      spawnTimer: 3,
    };
  }

  setupVariant() {
    const k = this.variantKey;
    if (k === 'graft') {
      for (let i = 0; i < 9; i += 1) {
        this.corpses.push({ x: this.startX + 400 + i * 380, y: rand(140, LOGICAL_HEIGHT - 140), taken: false, phase: rand(0, TAU) });
      }
    } else if (k === 'broodmother') {
      this.sac = { x: this.worldLength - MUTANT.exitLength - 160, y: LOGICAL_HEIGHT / 2, progress: 0 };
      this.counterGoal = 0;
    } else if (k === 'eyeswarm') {
      this.hunter.gazeSpeed = rand(0.7, 1.1) * (Math.random() < 0.5 ? -1 : 1);
    } else if (k === 'moult') {
      this.hunter.molt = 4;
    } else if (k === 'pupil') {
      this.hunter.blinkTimer = 3.2;
      this.pupilOpen = false;
      this.pupilBlocks = this.gates.map((g) => ({ x: g.x, y: g.gapY - 74, w: 46, h: 148 }));
    } else if (k === 'mutagen') {
      for (let i = 0; i < 7; i += 1) {
        this.leaks.push({ x: this.startX + 420 + i * 470, y: rand(120, LOGICAL_HEIGHT - 120), r: 120 });
      }
      for (let i = 0; i < 4; i += 1) {
        this.scrubbers.push({ x: this.startX + 760 + i * 900, y: rand(140, LOGICAL_HEIGHT - 140), r: 100 });
      }
    } else if (k === 'harvest') {
      for (let i = 0; i < 6; i += 1) {
        this.grafts.push({ x: this.startX + 500 + i * 560, y: rand(140, LOGICAL_HEIGHT - 140), freed: false, phase: rand(0, TAU) });
      }
      this.counterGoal = 4;
    } else if (k === 'somatic') {
      for (let i = 0; i < 16; i += 1) {
        this.fleshPatches.push({ x: this.startX + 360 + i * 250, y: rand(100, LOGICAL_HEIGHT - 100), r: rand(60, 90), phase: rand(0, TAU) });
      }
    } else if (k === 'teratoma') {
      const order = [0, 1, 2, 3];
      for (let i = 0; i < 4; i += 1) {
        this.veins.push({ x: this.startX + 700 + i * 900, y: rand(150, LOGICAL_HEIGHT - 150), order: order[i], orderIndex: i, cut: false, phase: rand(0, TAU) });
      }
      this.veinIndex = 0;
      this.timer = 62;
    }
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 2;
  }

  catchPlayer(reason) {
    if (this.phase !== 'play' || this.invuln > 0) return;
    this.lives -= 1;
    this.scareReason = reason;
    this.flash = 0.7;
    this.shake = 0.8;
    this.game.audio.tone({ freq: 120, endFreq: 40, type: 'sawtooth', duration: 0.5, volume: 0.3 });
    if (this.lives <= 0) {
      this.finish(false);
      return;
    }
    this.phase = 'scare';
    this.scareTimer = MUTANT.scareTime;
  }

  respawn() {
    this.player.x = this.checkpointX;
    this.player.y = LOGICAL_HEIGHT / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.hunter.x = this.checkpointX - 420;
    this.hunter.y = LOGICAL_HEIGHT / 2;
    this.swarmers.length = 0;
    this.invuln = 1.6;
    this.phase = 'play';
    this.flash = 0;
    this.shake = 0;
    this.setStatus('RESPAWNED AT CHECKPOINT');
  }

  updateRound(dt, input) {
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.vent = Math.max(0, this.vent - dt);
    if (this.phase === 'scare') {
      this.scareTimer -= dt;
      if (this.scareTimer <= 0) this.respawn();
      return;
    }
    const player = this.player;
    player.update(dt, input);
    for (const wall of this.activeWalls()) this.resolveWall(player, wall);
    player.x = clamp(player.x, 10, this.worldLength - 10);
    player.y = clamp(player.y, player.radius, LOGICAL_HEIGHT - player.radius);
    for (const cp of this.checkpoints) {
      if (!cp.active && player.x >= cp.x) {
        cp.active = true;
        this.checkpointX = cp.x + 40;
        this.setStatus('CHECKPOINT');
        this.game.audio.tone({ freq: 620, endFreq: 900, type: 'triangle', duration: 0.18, volume: 0.18 });
      }
    }
    this.updateHunter(dt);
    this.updateVariant(dt, input);
    if (this.phase !== 'play') return;
    for (const sw of this.swarmers) {
      if (circleOverlap(player, sw)) {
        this.catchPlayer('THE BROOD CAUGHT YOU');
        return;
      }
    }
    if (this.hunterActive() && this.hunter.state !== 'stunned' && circleOverlap(player, this.hunter)) {
      this.catchPlayer('THE MUTANT CAUGHT YOU');
      return;
    }
    if (this.variantKey !== 'broodmother' && this.variantKey !== 'teratoma' && this.variantKey !== 'harvest') {
      if (player.x >= this.exitZone.x) this.finish(true);
    }
  }

  hunterActive() {
    return true;
  }

  activeWalls() {
    if (this.variantKey === 'pupil' && !this.pupilOpen) return [...this.walls, ...this.pupilBlocks];
    return this.walls;
  }

  resolveWall(entity, wall) {
    const nearX = entity.x + entity.radius > wall.x && entity.x - entity.radius < wall.x + wall.w;
    if (!nearX) return;
    const nearY = entity.y + entity.radius > wall.y && entity.y - entity.radius < wall.y + wall.h;
    if (!nearY) return;
    const overlapLeft = entity.x + entity.radius - wall.x;
    const overlapRight = wall.x + wall.w - (entity.x - entity.radius);
    if (overlapLeft < overlapRight) entity.x = wall.x - entity.radius;
    else entity.x = wall.x + wall.w + entity.radius;
  }

  updateHunter(dt) {
    const h = this.hunter;
    h.phase += dt;
    h.regrow = Math.max(0, h.regrow - dt);
    if (h.state === 'stunned') {
      h.stun = (h.stun ?? 0) - dt;
      if (h.stun <= 0) h.state = 'hunt';
      return;
    }
    let speed = MUTANT.hunterSpeed;
    let tx = this.player.x;
    let ty = this.player.y;
    const k = this.variantKey;
    if (k === 'graft') {
      speed *= 0.7 + h.limbs * 0.2;
      for (const c of this.corpses) {
        if (c.taken) continue;
        if (Math.hypot(c.x - h.x, c.y - h.y) < 60 && h.regrow <= 0) {
          c.taken = true;
          h.limbs = Math.min(3, h.limbs + 1);
          h.regrow = 3;
          this.particles.burst(c.x, c.y, { count: 12, speed: 180, life: 0.6, colors: [FLESH, BONE], buoyancy: -10 });
          this.setStatus('IT GRAFTED A NEW LIMB');
        }
      }
    } else if (k === 'spine') {
      const playerSpeed = Math.hypot(this.player.vx, this.player.vy);
      if (playerSpeed < 22) h.alert = Math.max(0, h.alert - dt * 0.8);
      else h.alert = Math.min(1, h.alert + dt * 0.6);
      speed *= 0.4 + h.alert * 1.1;
    } else if (k === 'eyeswarm') {
      h.gaze += (h.gazeSpeed ?? 1) * dt;
      const toPlayer = Math.atan2(this.player.y - h.y, this.player.x - h.x);
      let delta = Math.abs((((toPlayer - h.gaze) % TAU) + TAU + Math.PI) % TAU - Math.PI);
      const dist = Math.hypot(this.player.x - h.x, this.player.y - h.y);
      h.blind = delta > 1.1 || dist > 520;
      speed *= h.blind ? 0.25 : 1.5;
    } else if (k === 'moult') {
      h.molt -= dt;
      if (h.molt <= 0) {
        this.decoys.push({ x: h.x, y: h.y, life: 6, phase: rand(0, TAU) });
        h.x = this.player.x - 420 * (Math.random() < 0.5 ? 1 : 1);
        h.y = clamp(this.player.y + rand(-200, 200), 120, LOGICAL_HEIGHT - 120);
        h.molt = rand(4, 6);
        this.setStatus('IT SHED A SKIN');
      }
    } else if (k === 'pupil') {
      h.blinkTimer -= dt;
      if (h.blinkTimer <= 0) {
        h.blink = 0.7;
        h.blinkTimer = rand(3, 4.4);
        this.togglePupilGates();
      }
      h.blink = Math.max(0, h.blink - dt);
      if (h.blink > 0) {
        h.lunge = 0.5;
        tx = this.player.x;
        ty = this.player.y;
      }
      speed *= h.blink > 0 ? 0.2 : 1.2;
    } else if (k === 'harvest') {
      speed *= h.rage > 0 ? 1.7 : 1;
      h.rage = Math.max(0, h.rage - dt);
    } else if (k === 'teratoma') {
      speed *= 0.85;
      h.phase2 = Math.sin(this.time * 5);
    } else if (k === 'mutagen') {
      speed *= 0.9 + this.mutations * 0.15;
    } else if (k === 'somatic') {
      speed *= 0.8;
    } else if (k === 'broodmother') {
      speed *= 0.82;
      h.spawnTimer -= dt;
      if (h.spawnTimer <= 0 && this.swarmers.length < 10) {
        h.spawnTimer = 2.6;
        this.swarmers.push({
          x: h.x + rand(-40, 40),
          y: h.y + rand(-40, 40),
          vx: 0,
          vy: 0,
          radius: 16,
          phase: rand(0, TAU),
          speed: 130,
        });
      }
    }
    const dx = tx - h.x;
    const dy = ty - h.y;
    const d = Math.hypot(dx, dy) || 1;
    h.vx = (dx / d) * speed;
    h.vy = (dy / d) * speed * 0.85;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.y = clamp(h.y, h.radius, LOGICAL_HEIGHT - h.radius);
    if (Math.abs(h.vx) > 6) h.facing = h.vx > 0 ? 1 : -1;
    for (const sw of this.swarmers) {
      const sdx = this.player.x - sw.x;
      const sdy = this.player.y - sw.y;
      const sd = Math.hypot(sdx, sdy) || 1;
      sw.x += (sdx / sd) * sw.speed * dt;
      sw.y += (sdy / sd) * sw.speed * dt;
      sw.phase += dt;
    }
    this.decoys = this.decoys.filter((d2) => {
      d2.life -= dt;
      d2.phase += dt;
      return d2.life > 0;
    });
  }

  togglePupilGates() {
    this.pupilOpen = !this.pupilOpen;
  }

  updateVariant(dt, input) {
    const k = this.variantKey;
    const player = this.player;
    const act = input.wasPressed('confirm');
    if (k === 'graft') {
      if (act) {
        this.vent = 0.4;
        for (const c of this.corpses) {
          if (!c.taken && Math.hypot(c.x - player.x, c.y - player.y) < 150) {
            c.taken = true;
            this.particles.burst(c.x, c.y, { count: 14, speed: 220, life: 0.5, colors: ['#ff8a3c', '#ffd166'], buoyancy: -30 });
          }
        }
      }
    } else if (k === 'broodmother') {
      if (this.sac && player.x >= this.sac.x) {
        if (input.isDown('confirm')) {
          this.sac.progress += dt;
          this.flash = Math.max(this.flash, 0.3);
          if (this.sac.progress >= 2) this.finish(true);
        } else if (this.sac.progress > 0) {
          this.sac.progress = Math.max(0, this.sac.progress - dt * 0.5);
        }
      }
    } else if (k === 'harvest') {
      for (const g of this.grafts) {
        if (!g.freed && circleOverlap({ x: g.x, y: g.y, radius: 24 }, player)) {
          g.freed = true;
          this.counter += 1;
          this.hunter.rage = 4;
          this.setStatus(`FREED ${this.counter}/${this.counterGoal} — IT RAGES`);
          this.particles.burst(g.x, g.y, { count: 14, speed: 180, life: 0.6, colors: ['#7fd0ff', '#ffffff'], buoyancy: -30 });
        }
      }
      if (this.counter >= this.counterGoal && player.x >= this.exitZone.x) this.finish(true);
    } else if (k === 'somatic') {
      const speed = Math.hypot(player.vx, player.vy);
      if (speed < 30) this.stillTimer += dt;
      else this.stillTimer = Math.max(0, this.stillTimer - dt * 2);
      if (act) {
        this.vent = 0.4;
        for (const f of this.fleshPatches) {
          if (Math.hypot(f.x - player.x, f.y - player.y) < 180) f.cleared = 2.5;
        }
      }
      for (const f of this.fleshPatches) f.cleared = Math.max(0, (f.cleared ?? 0) - dt);
      if (this.stillTimer > 1.1) {
        this.stillTimer = 0;
        this.catchPlayer('THE FLESH BEGAN TO DIGEST YOU');
      }
    } else if (k === 'teratoma') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.finish(false);
        return;
      }
      if (act) {
        for (const v of this.veins) {
          if (v.cut) continue;
          if (Math.hypot(v.x - player.x, v.y - player.y) < 70) {
            if (v.orderIndex === this.veinIndex) {
              v.cut = true;
              this.veinIndex += 1;
              this.particles.burst(v.x, v.y, { count: 16, speed: 220, life: 0.6, colors: ['#c93b3b', '#7a1418'], buoyancy: 30 });
              this.setStatus(`VEIN ${this.veinIndex}/4 SEVERED`);
              if (this.veinIndex >= 4) this.finish(true);
            } else {
              this.catchPlayer('WRONG VEIN — IT BIT BACK');
              return;
            }
          }
        }
      }
    } else if (k === 'mutagen') {
      let rate = 6;
      for (const leak of this.leaks) {
        if (Math.hypot(leak.x - player.x, leak.y - player.y) < leak.r) rate += 16;
      }
      for (const s of this.scrubbers) {
        if (Math.hypot(s.x - player.x, s.y - player.y) < s.r) rate -= 30;
      }
      this.exposure = clamp(this.exposure + rate * dt, 0, 100);
      const muts = this.exposure >= 75 ? 2 : this.exposure >= 40 ? 1 : 0;
      if (muts !== this.mutations) {
        this.mutations = muts;
        this.setStatus(muts === 1 ? 'MUTATING — FASTER, TWITCHY' : 'DEEPLY MUTATED — YOU SEE IN THE DARK');
        this.game.audio.tone({ freq: 90, endFreq: 40, type: 'sawtooth', duration: 0.4, volume: 0.24 });
      }
      player.maxSpeed = MUTANT.playerSpeed * (this.mutations >= 1 ? 1.18 : 1);
      if (this.mutations >= 1) {
        player.x += Math.sin(this.time * 9) * 24 * dt;
        player.y += Math.cos(this.time * 7) * 24 * dt;
      }
      if (this.exposure >= 100) this.finish(false);
      if (player.x >= this.exitZone.x) this.finish(true);
    }
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(-this.camX, 0);
    this.renderArena(ctx);
    for (const f of this.fleshPatches) this.renderFlesh(ctx, f);
    for (const leak of this.leaks) this.renderLeak(ctx, leak);
    for (const s of this.scrubbers) this.renderScrubber(ctx, s);
    for (const c of this.corpses) this.renderCorpse(ctx, c);
    for (const g of this.grafts) this.renderGraft(ctx, g);
    for (const v of this.veins) this.renderVein(ctx, v);
    if (this.sac) this.renderSac(ctx, this.sac);
    for (const d of this.decoys) this.drawHunterLocal(ctx, { ...this.hunter, x: d.x, y: d.y, phase: d.phase, decoy: true });
    this.drawHunter(ctx);
    for (const sw of this.swarmers) this.drawSwarmer(ctx, sw);
    this.renderPlayers(ctx);
    this.particles.render(ctx);
    ctx.restore();
    if (this.phase === 'scare') this.renderScare(ctx);
  }

  renderArena(ctx) {
    ctx.fillStyle = MUTANT_PALETTE.bottom;
    ctx.fillRect(this.camX - 40, 0, LOGICAL_WIDTH + 80, LOGICAL_HEIGHT);
    for (const wall of this.walls) this.renderWall(ctx, wall);
    this.renderExit(ctx);
    for (const cp of this.checkpoints) this.renderCheckpoint(ctx, cp);
  }

  renderWall(ctx, wall) {
    fillRoundRect(ctx, wall.x, wall.y, wall.w, wall.h, 6, this.variantKey === 'somatic' ? FLESH_DARK : '#233029');
    ctx.strokeStyle = this.variantKey === 'somatic' ? FLESH : '#3a4a40';
    ctx.lineWidth = 2;
    strokeRoundRect(ctx, wall.x, wall.y, wall.w, wall.h, 6, ctx.strokeStyle, 2);
    for (let y = wall.y + 30; y < wall.y + wall.h; y += 50) {
      fillCircle(ctx, wall.x + wall.w / 2, y, 4, 'rgba(200, 230, 220, 0.25)');
    }
  }

  renderExit(ctx) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
    ctx.fillRect(this.exitZone.x - 44, 0, 88, LOGICAL_HEIGHT);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.exitZone.x - 44, 0, 88, LOGICAL_HEIGHT);
    drawText(ctx, 'EXIT', this.exitZone.x, 40, { size: 16, color: COLORS.accent });
  }

  renderCheckpoint(ctx, cp) {
    ctx.strokeStyle = cp.active ? '#7fd0ff' : 'rgba(127, 208, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cp.x, 40);
    ctx.lineTo(cp.x, LOGICAL_HEIGHT - 20);
    ctx.stroke();
  }

  renderFlesh(ctx, f) {
    if (f.cleared > 0) return;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.fillStyle = FLESH;
    ctx.beginPath();
    ctx.ellipse(0, 0, f.r, f.r * 0.7, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = FLESH_DARK;
    for (let i = 0; i < 3; i += 1) {
      const a = f.phase + i * 2.1;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * f.r * 0.4, Math.sin(a) * f.r * 0.3, 10, 6, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  renderLeak(ctx, leak) {
    const pulse = 0.4 + 0.3 * Math.sin(this.time * 3 + leak.x);
    ctx.fillStyle = `rgba(150, 220, 120, ${pulse * 0.25})`;
    fillCircle(ctx, leak.x, leak.y, leak.r, ctx.fillStyle);
  }

  renderScrubber(ctx, s) {
    ctx.fillStyle = 'rgba(120, 200, 255, 0.22)';
    fillCircle(ctx, s.x, s.y, s.r, ctx.fillStyle);
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 0.6, 0, TAU);
    ctx.stroke();
  }

  renderCorpse(ctx, c) {
    if (c.taken) return;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = FLESH_DARK;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 14, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = BONE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(12, 6);
    ctx.moveTo(-12, 6);
    ctx.lineTo(12, -6);
    ctx.stroke();
    ctx.restore();
  }

  renderGraft(ctx, g) {
    if (g.freed) return;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = FLESH_DARK;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 30, 0, 0, TAU);
    ctx.fill();
    drawEye(ctx, 0, -8 + Math.sin(g.phase) * 2, 7, 0);
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(0, 34);
    ctx.stroke();
    ctx.restore();
  }

  renderVein(ctx, v) {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.strokeStyle = v.cut ? '#5a2a2a' : '#a83232';
    ctx.lineWidth = v.cut ? 6 : 12;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(0, 40);
    ctx.stroke();
    ctx.fillStyle = v.cut ? '#3a1a1a' : '#c93b3b';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, TAU);
    ctx.fill();
    drawText(ctx, `${v.order + 1}`, 0, 0, { size: 14, color: '#ffffff' });
    ctx.restore();
  }

  renderSac(ctx, sac) {
    ctx.save();
    ctx.translate(sac.x, sac.y);
    ctx.fillStyle = '#7a4a5a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 60, 74, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(210, 140, 160, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 54, 0, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 6; i += 1) {
      const a = i * 1.1 + this.time;
      ctx.fillStyle = '#3a1d24';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 24, Math.sin(a) * 30, 7, 0, TAU);
      ctx.fill();
    }
    if (sac.progress > 0) {
      strokeRoundRect(ctx, -70, -90, 140, 12, 6, 'rgba(255, 209, 102, 0.8)', 2);
      fillRoundRect(ctx, -70, -90, 140 * clamp(sac.progress / 2, 0, 1), 12, 6, '#ffd166');
    }
    ctx.restore();
  }

  drawHunter(ctx) {
    const h = this.hunter;
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.scale(h.facing, 1);
    this.drawHunterLocal(ctx, h);
    ctx.restore();
  }

  drawHunterLocal(ctx, h) {
    const k = this.variantKey;
    const r = h.radius;
    const open = 0.5 + 0.5 * Math.sin(h.phase * 4);
    ctx.save();
    if (h.decoy) ctx.globalAlpha = 0.5;
    if (k === 'graft') {
      ctx.fillStyle = FLESH;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.82, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = FLESH_DARK;
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.3, -r * 0.6);
        ctx.lineTo(i * r * 0.3 + 6, r * 0.6);
        ctx.stroke();
      }
      ctx.strokeStyle = '#8a5a62';
      ctx.lineCap = 'round';
      for (let i = 0; i < h.limbs; i += 1) {
        const a = h.phase + (i / h.limbs) * TAU;
        ctx.lineWidth = r * 0.28;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
        ctx.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4);
        ctx.stroke();
      }
      drawJaws(ctx, r * 0.5, 0, r * 0.55, open);
      drawEye(ctx, r * 0.45, -r * 0.4, r * 0.22, 1);
    } else if (k === 'broodmother') {
      ctx.fillStyle = '#7a5a4a';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.3, r, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(210, 140, 160, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, 0, r * 0.8, r * 0.7, 0, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 7; i += 1) {
        ctx.fillStyle = '#3a1d24';
        ctx.beginPath();
        ctx.arc(-r * 0.3 + Math.cos(i) * r * 0.5, Math.sin(i * 1.6) * r * 0.5, r * 0.12, 0, TAU);
        ctx.fill();
      }
      drawEye(ctx, r * 0.8, -r * 0.3, r * 0.2, 1);
    } else if (k === 'spine') {
      ctx.strokeStyle = BONE;
      ctx.fillStyle = FLESH;
      for (let i = 0; i < 7; i += 1) {
        const px = -i * r * 0.42;
        const py = Math.sin(h.phase * 3 + i * 0.7) * r * 0.25;
        ctx.fillStyle = i === 0 ? FLESH : BONE;
        ctx.beginPath();
        ctx.arc(px, py, r * (0.4 - i * 0.03), 0, TAU);
        ctx.fill();
        ctx.strokeStyle = BONE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - r * 0.2, py - r * 0.5);
        ctx.moveTo(px, py);
        ctx.lineTo(px - r * 0.2, py + r * 0.5);
        ctx.stroke();
      }
      ctx.strokeStyle = BONE;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(r * 0.2, -r * (0.3 + open * 0.4));
      ctx.lineTo(r * 0.9, -r * (0.2 + open * 0.6));
      ctx.moveTo(r * 0.2, r * (0.3 + open * 0.4));
      ctx.lineTo(r * 0.9, r * (0.2 + open * 0.6));
      ctx.stroke();
    } else if (k === 'eyeswarm') {
      ctx.fillStyle = '#3a2430';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.1, r, 0, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 9; i += 1) {
        const a = (i / 9) * TAU;
        drawEye(ctx, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.22, 0);
      }
      drawEye(ctx, 0, 0, r * 0.3, 0);
    } else if (k === 'moult') {
      ctx.fillStyle = h.decoy ? 'rgba(150, 140, 150, 0.6)' : '#5a4a52';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.2, r * 0.7, r, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -r * 1.1, r * 0.42, 0, TAU);
      ctx.fill();
      drawEye(ctx, -r * 0.18, -r * 1.15, r * 0.14, 1);
      drawEye(ctx, r * 0.18, -r * 1.15, r * 0.14, 1);
      if (!h.decoy) {
        ctx.strokeStyle = '#c93b3b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.2, 0, TAU);
        ctx.stroke();
      }
    } else if (k === 'pupil') {
      const closed = h.blink > 0 ? 1 - h.blink / 0.7 : 0;
      ctx.fillStyle = EYE;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.6, r * 1.6 * (1 - closed * 0.95), 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = FLESH;
      ctx.lineWidth = 4;
      ctx.stroke();
      if (closed < 0.5) {
        ctx.fillStyle = '#7a1418';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.6, r * 0.55, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#160a0c';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.2, r * 0.5, 0, 0, TAU);
        ctx.fill();
      }
    } else if (k === 'harvest') {
      ctx.fillStyle = '#4a3a4a';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.3, r * 0.8, r * 1.1, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#8a7a8a';
      ctx.lineWidth = 4;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * r * 0.5, -r * 0.6);
        ctx.lineTo(side * r * 1.3, -r * (0.9 + open * 0.3));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(side * r * 1.3, -r * (0.9 + open * 0.3), r * 0.14, 0, TAU);
        ctx.stroke();
      }
      drawEye(ctx, 0, -r * 1.3, r * 0.16, 1);
      ctx.fillStyle = h.rage > 0 ? '#c93b3b' : '#6a5a6a';
      ctx.beginPath();
      ctx.arc(0, -r * 0.3, r * 0.3, 0, TAU);
      ctx.fill();
    } else if (k === 'mutagen' || k === 'somatic') {
      ctx.fillStyle = k === 'mutagen' ? '#5a7a4a' : FLESH;
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.6);
      ctx.quadraticCurveTo(-r * 0.4, -r * 1.2, r * 0.2, -r * 0.8);
      ctx.quadraticCurveTo(r * 1.1, -r * 0.4, r, r * 0.6);
      ctx.closePath();
      ctx.fill();
      drawEye(ctx, -r * 0.2, -r * 0.2, r * 0.2, 1);
      drawEye(ctx, r * 0.3, r * 0.05, r * 0.16, 1);
      ctx.fillStyle = FLESH_DARK;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(-r * 0.6 + i * r * 0.4, r * 0.6, r * 0.1, 0, TAU);
        ctx.fill();
      }
    } else if (k === 'teratoma') {
      const beat = 1 + Math.sin(this.time * 6) * 0.12;
      ctx.fillStyle = '#8a2a34';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.1 * beat, r * 0.95 * beat, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#5a1418';
      ctx.lineWidth = 5;
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * TAU + h.phase * 0.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = FLESH_DARK;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.8, 0, 0, TAU);
      ctx.fill();
      drawEye(ctx, r * 0.4, 0, r * 0.24, 1);
    }
    ctx.restore();
  }

  drawSwarmer(ctx, sw) {
    ctx.save();
    ctx.translate(sw.x, sw.y);
    ctx.fillStyle = '#7a4a5a';
    ctx.beginPath();
    ctx.ellipse(0, 0, sw.radius, sw.radius * 0.8, 0, 0, TAU);
    ctx.fill();
    drawEye(ctx, 0, -2, sw.radius * 0.3, 0);
    ctx.restore();
  }

  renderScare(ctx) {
    if (cute()) {
      renderCuteScare(ctx, 1 - this.scareTimer / MUTANT.scareTime, {
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        time: this.time,
        caption: 'CAUGHT — SHAKE IT OFF AND SWIM!',
        radius: 70,
      });
      return;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.94)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    const scale = 1.4 + (1 - this.scareTimer / MUTANT.scareTime) * 1.6;
    ctx.scale(scale, scale);
    this.drawHunterLocal(ctx, this.hunter);
    ctx.restore();
    ctx.fillStyle = `rgba(120, 0, 0, ${0.4 * (this.scareTimer / MUTANT.scareTime)})`;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    drawText(ctx, this.scareReason, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, {
      size: 18,
      color: COLORS.danger,
    });
  }

  renderHud(ctx) {
    if (this.phase === 'scare') return;
    drawText(ctx, this.variant.label, LOGICAL_WIDTH / 2, 34, {
      size: 24,
      color: COLORS.text,
      glow: 'rgba(120, 220, 230, 0.5)',
      glowBlur: 16,
    });
    drawText(ctx, `LIVES ${this.lives}`, 24, 30, { size: 15, color: COLORS.text, align: 'left' });
    for (let i = 0; i < MUTANT.lives; i += 1) {
      fillCircle(ctx, 42 + i * 22, 52, 7, i < this.lives ? COLORS.danger : 'rgba(207, 239, 255, 0.18)');
    }
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 66, {
        size: 14,
        color: COLORS.accent,
        alpha: Math.min(1, this.statusTimer),
      });
    }
    const meters = [];
    if (this.variantKey === 'mutagen') meters.push({ label: 'EXPOSURE', value: this.exposure / 100, color: '#8ad06a' });
    if (this.variantKey === 'spine') meters.push({ label: 'ITS HEARING', value: this.hunter.alert, color: '#c93b3b' });
    if (this.variantKey === 'teratoma') meters.push({ label: `TIME ${Math.ceil(this.timer)}`, value: this.timer / 62, color: '#ffd166' });
    if (this.variantKey === 'harvest') meters.push({ label: `FREED ${this.counter}/${this.counterGoal}`, value: this.counter / this.counterGoal, color: '#7fd0ff' });
    let my = 96;
    for (const m of meters) {
      fillRoundRect(ctx, 24, my, 240, 12, 6, 'rgba(6, 20, 26, 0.8)');
      fillRoundRect(ctx, 24, my, 240 * clamp(m.value, 0, 1), 12, 6, m.color);
      drawText(ctx, m.label, 24, my - 10, { size: 11, color: COLORS.textDim, align: 'left' });
      my += 30;
    }
    drawText(ctx, 'WASD / DRAG — SWIM      SPACE / CLICK — ACTION      ESC — BACK', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
      size: 11,
      color: COLORS.textDim,
      alpha: 0.72,
    });
  }

  get camX() {
    return clamp((this.player ? this.player.x : 0) - LOGICAL_WIDTH * 0.4, 0, Math.max(0, this.worldLength - LOGICAL_WIDTH));
  }

  firstPersonActor() {
    return this.players[0] ?? null;
  }

  firstPersonSprites() {
    const sprites = [...(this.players ?? [])];
    if (this.hunter) {
      this.hunter._draw = (ctx) => this.drawHunterAtOrigin(ctx, this.hunter);
      sprites.push(this.hunter);
    }
    for (const sw of this.swarmers ?? []) {
      sw._draw = (ctx) => {
        ctx.save();
        ctx.translate(-sw.x, -sw.y);
        this.drawSwarmer(ctx, sw);
        ctx.restore();
      };
      sprites.push(sw);
    }
    return sprites;
  }

  drawHunterAtOrigin(ctx, h) {
    const ox = h.x;
    const oy = h.y;
    h.x = 0;
    h.y = 0;
    ctx.save();
    ctx.scale(h.facing, 1);
    this.drawHunterLocal(ctx, h);
    ctx.restore();
    h.x = ox;
    h.y = oy;
  }

  firstPersonPalette() {
    return { top: '#10201a', bottom: '#04080a', wall: '#2a3a30' };
  }

  firstPersonBounds() {
    return { x: 0, y: 0, w: this.worldLength ?? LOGICAL_WIDTH, h: LOGICAL_HEIGHT };
  }

  backScene() {
    return 'tanks';
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('tanks');
  }

  resultsTitle() {
    return this.variant.label;
  }

  resultsHeadline() {
    return this.won ? 'YOU ESCAPED THE HORROR' : 'THE MUTANT KEPT YOU';
  }

  resultsDetail() {
    return this.won ? 'YOU MADE IT OUT' : this.scareReason || 'TAKEN BY THE HORROR';
  }
}

const MUTANT_PALETTE = { top: '#10201a', bottom: '#04080a' };
