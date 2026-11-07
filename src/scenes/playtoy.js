import { MinigameScene } from '../engine/minigame.js';
import { drawText, fillCircle, fillRoundRect, strokeRoundRect } from '../engine/render.js';
import { loadJSON, saveJSON } from '../engine/storage.js';
import { circleOverlap, resolveCircleRect } from '../engine/collision.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { firstPersonMode } from '../engine/mode3d.js';
import { drawTetherLine, drawClampHead, drawReticle } from '../engine/tether.js';
import { LivingToy } from '../entities/livingtoy.js';
import {
  PLAYTOY,
  PLAYTOY_GATES,
  PLAYTOY_NOTES,
  PLAYTOY_PALETTE,
  PLAYTOY_KEY,
  ANCHOR_TYPES,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
} from '../config.js';

export class PlayToyScene extends MinigameScene {
  enter(params = {}) {
    this.collectedNotes = new Set(loadJSON(PLAYTOY_KEY, { notes: [] }).notes ?? []);
    super.enter({ ...params, solo: true });
    this.anchorIndex = 0;
    this.message = '';
    this.messageTimer = 0;
    this.noteTimer = 0;
    this.noteText = '';
    this.contactCooldown = 0;
    this.toysRepelled = 0;
    this.inventoryOpen = false;
    this.inventoryIndex = 0;
  }

  buildRound() {
    this.spawnSharks([{ x: PLAYTOY.spawnX, y: LOGICAL_HEIGHT / 2 }]);
    this.camX = 0;
    this.buildWorld();
    for (const player of this.players) player.maxX = this.worldLength;
    this.tether = { state: 'idle', head: { x: 0, y: 0 }, dir: { x: 1, y: 0 }, target: null, cooldown: 0, hit: 0 };
    this.firstPersonRange = 36;
    this.firstPersonFog = 30;
    this.firstPersonShadeFloor = 0.05;
    this.firstPersonMinimap = false;
    this.setMessage('FIRE THE ANCHOR-PACK (F / RIGHT-CLICK) — SWAP HEADS WITH E');
  }

  buildWorld() {
    const P = PLAYTOY;
    this.worldLength = P.startPadding + P.sections * P.sectionLength + P.exitLength;
    this.bulkheads = [];
    this.gates = [];
    this.anchors = [];
    this.notes = [];
    this.toys = [];
    this.decor = [];
    this.portholes = [];
    for (let s = 0; s < P.sections; s += 1) {
      for (let b = 0; b < P.bulkheadsPerSection; b += 1) {
        const x = P.startPadding + s * P.sectionLength + 240 + b * Math.round(P.sectionLength / 2.3);
        const gapY = rand(150, LOGICAL_HEIGHT - 150);
        const w = P.bulkheadWidth;
        this.bulkheads.push({ x, y: -40, w, h: Math.max(0, gapY - P.gapHalf + 40) });
        this.bulkheads.push({ x, y: gapY + P.gapHalf, w, h: Math.max(0, LOGICAL_HEIGHT + 40 - (gapY + P.gapHalf)) });
        if (Math.random() < P.gateChance) {
          const type = PLAYTOY_GATES[Math.floor(rand(0, PLAYTOY_GATES.length))];
          this.gates.push({
            x,
            y: gapY - P.gapHalf,
            w,
            h: P.gapHalf * 2,
            type,
            open: false,
            anim: 1,
            cx: x + w / 2,
            cy: gapY,
          });
        }
      }
    }
    for (let s = 0; s < P.sections; s += 1) {
      for (let a = 0; a < P.anchorsPerSection; a += 1) {
        this.anchors.push({
          x: P.startPadding + s * P.sectionLength + 420 + a * 360 + rand(-60, 60),
          y: rand(70, 150),
          radius: P.anchorRadius,
          phase: rand(0, TAU),
        });
      }
    }
    const span = this.worldLength - P.startPadding - 520;
    this.notesCollected = 0;
    for (let i = 0; i < P.noteCount; i += 1) {
      const taken = this.collectedNotes ? this.collectedNotes.has(i) : false;
      if (taken) this.notesCollected += 1;
      this.notes.push({
        x: P.startPadding + 170 + (i * span) / P.noteCount + rand(-50, 50),
        y: rand(80, LOGICAL_HEIGHT - 110),
        radius: 15,
        taken,
        phase: rand(0, TAU),
        text: PLAYTOY_NOTES[i % PLAYTOY_NOTES.length],
        index: i,
      });
    }
    for (let s = 0; s < P.sections; s += 1) {
      const count = P.toys[Math.min(s, P.toys.length - 1)];
      for (let t = 0; t < count; t += 1) {
        this.toys.push(
          new LivingToy(
            P.startPadding + s * P.sectionLength + rand(150, P.sectionLength - 150),
            rand(120, LOGICAL_HEIGHT - 120),
            s + t,
            {
              detectRange: P.detectRange,
              idleSpeed: P.toySpeed,
              chaseSpeed: P.toyChaseSpeed,
              worldLength: this.worldLength,
            },
          ),
        );
      }
    }
    let x = 120;
    while (x < this.worldLength - 120) {
      this.decor.push({
        x,
        kind: Math.random() < 0.5 ? 'crate' : 'pipe',
        y: rand(80, LOGICAL_HEIGHT - 90),
        s: rand(0.7, 1.4),
        phase: rand(0, TAU),
      });
      x += rand(170, 320);
    }
    for (let px = 240; px < this.worldLength; px += 380) this.portholes.push({ x: px, phase: rand(0, TAU) });
    this.exitZone = { x: this.worldLength - PLAYTOY.exitLength * 0.5, y: LOGICAL_HEIGHT / 2 };
    this.rebuildWalls();
  }

  rebuildWalls() {
    const closed = this.gates.filter((g) => !g.open).map((g) => ({ x: g.x, y: g.y, w: g.w, h: g.h }));
    this.walls = [...this.bulkheads, ...closed];
  }

  anchorDef() {
    return ANCHOR_TYPES[this.anchorIndex];
  }

  cycleAnchor() {
    this.anchorIndex = (this.anchorIndex + 1) % ANCHOR_TYPES.length;
    const a = this.anchorDef();
    this.setMessage(`${a.label} — ${a.desc}`);
    this.game.audio.tone({ freq: 480 + this.anchorIndex * 90, duration: 0.08, volume: 0.14 });
  }

  setMessage(text) {
    this.message = text;
    this.messageTimer = 3;
  }

  aimPoint() {
    const p = this.players[0];
    const a = this.anchorDef();
    if (firstPersonMode()) {
      const yaw = this.firstPersonYaw ?? p.heading ?? 0;
      return { x: p.x + Math.cos(yaw) * a.range, y: p.y + Math.sin(yaw) * a.range };
    }
    const ptr = this.game.input.pointer;
    if (ptr.x === 0 && ptr.y === 0) {
      return { x: p.x + Math.cos(p.heading) * a.range, y: p.y + Math.sin(p.heading) * a.range };
    }
    return { x: ptr.x + this.camX, y: ptr.y };
  }

  fireTether() {
    const t = this.tether;
    if (t.state !== 'idle' || t.cooldown > 0) return;
    const p = this.players[0];
    const aim = this.aimPoint();
    const dx = aim.x - p.x;
    const dy = aim.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    t.dir.x = dx / d;
    t.dir.y = dy / d;
    t.head.x = p.x;
    t.head.y = p.y;
    t.state = 'flying';
    this.game.audio.tone({ freq: 520, endFreq: 780, type: 'triangle', duration: 0.12, volume: 0.16 });
  }

  tetherHit(point) {
    let best = null;
    let bestDist = Infinity;
    for (const gate of this.gates) {
      if (gate.open) continue;
      const d = Math.hypot(point.x - gate.cx, point.y - gate.cy);
      if (d < gate.w / 2 + PLAYTOY.clampRadius && d < bestDist) {
        bestDist = d;
        best = { kind: 'gate', x: gate.cx, y: gate.cy, radius: gate.w / 2, target: gate };
      }
    }
    for (const anchor of this.anchors) {
      const d = Math.hypot(point.x - anchor.x, point.y - anchor.y);
      if (d < anchor.radius + PLAYTOY.clampRadius && d < bestDist) {
        bestDist = d;
        best = { kind: 'anchor', x: anchor.x, y: anchor.y, radius: anchor.radius, target: anchor };
      }
    }
    for (const note of this.notes) {
      if (note.taken) continue;
      const d = Math.hypot(point.x - note.x, point.y - note.y);
      if (d < note.radius + PLAYTOY.clampRadius && d < bestDist) {
        bestDist = d;
        best = { kind: 'loot', x: note.x, y: note.y, radius: note.radius, target: note };
      }
    }
    for (const toy of this.toys) {
      const d = Math.hypot(point.x - toy.x, point.y - toy.y);
      if (d < toy.radius + PLAYTOY.clampRadius && d < bestDist) {
        bestDist = d;
        best = { kind: 'toy', x: toy.x, y: toy.y, radius: toy.radius, target: toy };
      }
    }
    if (best) return best;
    for (const wall of this.walls) {
      if (point.x > wall.x - 4 && point.x < wall.x + wall.w + 4 && point.y > wall.y - 4 && point.y < wall.y + wall.h + 4) {
        return { kind: 'wall', x: point.x, y: point.y, radius: 0 };
      }
    }
    return null;
  }

  attachTether(hit) {
    const t = this.tether;
    const a = this.anchorDef();
    if (hit.kind === 'gate') {
      if (hit.target.type.anchor === a.key) {
        this.openGate(hit.target);
        t.state = 'returning';
      } else {
        const need = ANCHOR_TYPES.find((x) => x.key === hit.target.type.anchor);
        this.setMessage(`${hit.target.type.label} NEEDS THE ${need.label}`);
        this.game.audio.tone({ freq: 160, endFreq: 90, duration: 0.2, volume: 0.2 });
        t.state = 'returning';
      }
      return;
    }
    if (hit.kind === 'loot') {
      t.state = 'haul';
      t.target = hit.target;
      return;
    }
    if (hit.kind === 'anchor') {
      t.state = 'pullSelf';
      t.timer = 0;
      t.head.x = hit.x;
      t.head.y = hit.y;
      return;
    }
    if (hit.kind === 'wall') {
      t.state = 'returning';
      this.setMessage('THE CLAMP SLIPS OFF THE HULL');
      this.particles.burst(hit.x, hit.y, {
        count: 8,
        speed: 150,
        life: 0.4,
        colors: ['#9fd0d8', '#ffffff'],
        buoyancy: -20,
      });
      this.game.audio.tone({ freq: 300, endFreq: 150, type: 'square', duration: 0.1, volume: 0.14 });
      return;
    }
    if (hit.kind === 'toy') {
      const toy = hit.target;
      const p = this.players[0];
      const dx = toy.x - p.x;
      const dy = toy.y - p.y;
      if (a.toy === 'stun') {
        toy.stun(PLAYTOY.stunTime);
        this.setMessage('ELECTRICONDUCTOR ANCHOR STUNNED A TOY');
      } else {
        toy.knock(dx, dy, PLAYTOY.knockSpeed * (a.toy === 'shove' ? 1.4 : 1));
        this.setMessage(a.toy === 'shove' ? 'PRESSURE ANCHOR SHOVED A TOY OFF THE DECK' : 'MAIN ANCHOR KNOCKED A TOY SPINNING');
      }
      this.toysRepelled += 1;
      this.game.audio.tone({ freq: 300, endFreq: 180, type: 'square', duration: 0.14, volume: 0.16 });
      t.state = 'returning';
    }
  }

  openGate(gate) {
    gate.open = true;
    gate.anim = 0;
    this.rebuildWalls();
    this.setMessage(`${gate.type.label} OPENED`);
    this.particles.burst(gate.cx, gate.cy, {
      count: 16,
      speed: 200,
      life: 0.6,
      colors: [gate.type.color, '#ffffff'],
      buoyancy: -10,
    });
    this.game.audio.tone({ freq: 420, endFreq: 620, type: 'triangle', duration: 0.24, volume: 0.2 });
    this.flash = 0.3;
  }

  tetherFail() {
    this.tether.state = 'returning';
    this.setMessage('THE LINE FELL SHORT');
    this.game.audio.tone({ freq: 220, endFreq: 140, duration: 0.12, volume: 0.14 });
  }

  updateTether(dt) {
    const t = this.tether;
    const a = this.anchorDef();
    const p = this.players[0];
    t.cooldown = Math.max(0, t.cooldown - dt);
    t.hit = Math.max(0, t.hit - dt * 4);
    if (t.state === 'flying') {
      t.head.x += t.dir.x * a.travel * dt;
      t.head.y += t.dir.y * a.travel * dt;
      const dist = Math.hypot(t.head.x - p.x, t.head.y - p.y);
      const hit = this.tetherHit(t.head);
      if (hit) this.attachTether(hit);
      else if (dist > a.range) this.tetherFail();
      return;
    }
    if (t.state === 'haul') {
      const note = t.target;
      if (!note || note.taken) {
        t.state = 'returning';
        t.target = null;
        return;
      }
      const dx = p.x - note.x;
      const dy = p.y - note.y;
      const d = Math.hypot(dx, dy) || 1;
      note.x += (dx / d) * a.reel * dt;
      note.y += (dy / d) * a.reel * dt;
      t.head.x = note.x;
      t.head.y = note.y;
      if (d < 26) {
        this.collectNote(note);
        t.state = 'returning';
        t.target = null;
      }
      return;
    }
    if (t.state === 'pullSelf') {
      const dx = t.head.x - p.x;
      const dy = t.head.y - p.y;
      t.timer = (t.timer ?? 0) + dt;
      if (Math.hypot(dx, dy) < 28 || t.timer > 2.5) {
        t.state = 'returning';
        t.cooldown = 0.3;
      }
      return;
    }
    if (t.state === 'returning') {
      const dx = p.x - t.head.x;
      const dy = p.y - t.head.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 20) {
        t.state = 'idle';
        t.target = null;
        t.cooldown = Math.max(t.cooldown, 0.22);
      } else {
        t.head.x += (dx / d) * a.reel * 2.4 * dt;
        t.head.y += (dy / d) * a.reel * 2.4 * dt;
      }
    }
  }

  collectNote(note) {
    if (note.taken) return;
    note.taken = true;
    this.notesCollected += 1;
    this.collectedNotes.add(note.index);
    this.saveNotes();
    this.noteText = note.text;
    this.noteTimer = 6;
    this.setMessage(`PLAYTOY NOTE ${this.notesCollected}/${this.notes.length} — [I] TO READ YOUR PAPERS`);
    this.particles.burst(note.x, note.y, {
      count: 12,
      speed: 150,
      life: 0.5,
      colors: [COLORS.accent, '#ffffff'],
      buoyancy: -30,
    });
    this.game.audio.tone({ freq: 740, endFreq: 1080, type: 'triangle', duration: 0.14, volume: 0.18 });
  }

  saveNotes() {
    saveJSON(PLAYTOY_KEY, { notes: [...this.collectedNotes].sort((a, b) => a - b) });
  }

  toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    if (this.inventoryOpen) {
      const first = [...this.collectedNotes].sort((a, b) => a - b)[0] ?? 0;
      this.inventoryIndex = Math.max(0, Math.min(PLAYTOY_NOTES.length - 1, first));
      this.setMessage('INVENTORY — UP/DOWN TO BROWSE — [I] OR [ESC] TO CLOSE');
    }
    this.game.audio.tone({ freq: this.inventoryOpen ? 620 : 320, duration: 0.1, volume: 0.16 });
  }

  moveInventory(step) {
    const count = PLAYTOY_NOTES.length;
    this.inventoryIndex = (this.inventoryIndex + step + count) % count;
    this.game.audio.tone({ freq: 640, duration: 0.05, volume: 0.1 });
  }

  update(dt) {
    const input = this.game.input;
    if (this.phase === 'play' && this.inventoryOpen) {
      if (input.wasPressed('inventory') || input.wasPressed('back')) {
        this.toggleInventory();
        return;
      }
      if (input.wasPressed('up')) this.moveInventory(-1);
      if (input.wasPressed('down')) this.moveInventory(1);
      return;
    }
    if (this.phase === 'play' && input.wasPressed('inventory')) {
      this.toggleInventory();
      return;
    }
    super.update(dt);
  }

  toyContact(player, toy) {
    const dx = player.x - toy.x;
    const dy = player.y - toy.y;
    const d = Math.hypot(dx, dy) || 1;
    player.vx += (dx / d) * PLAYTOY.contactPush;
    player.vy += (dy / d) * PLAYTOY.contactPush;
    toy.knock(-dx, -dy, 240);
    this.contactCooldown = PLAYTOY.contactCooldown;
    this.flash = 0.4;
    this.shake = 0.35;
    this.setMessage('A LIVING TOY CLUNG ON — FIRE THE ANCHOR-PACK AT IT');
    this.game.audio.tone({ freq: 220, endFreq: 120, type: 'square', duration: 0.2, volume: 0.2 });
  }

  updateRound(dt, input) {
    const player = this.players[0];
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    this.noteTimer = Math.max(0, this.noteTimer - dt);
    if (input.wasPressed('cycleAnchor')) this.cycleAnchor();
    if (input.wasPressed('tool')) this.fireTether();

    const pulling = this.tether.state === 'pullSelf';
    if (pulling) {
      const a = this.anchorDef();
      const dx = this.tether.head.x - player.x;
      const dy = this.tether.head.y - player.y;
      const d = Math.hypot(dx, dy) || 1;
      player.vx = (dx / d) * a.pull;
      player.vy = (dy / d) * a.pull;
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      player.invulnerable = 0;
    } else {
      player.update(dt, input);
    }
    for (const wall of this.walls) resolveCircleRect(player, wall);
    player.x = clamp(player.x, player.radius, this.worldLength - player.radius);
    player.y = clamp(player.y, player.radius, LOGICAL_HEIGHT - player.radius);

    this.camX = clamp(player.x - LOGICAL_WIDTH * 0.4, 0, Math.max(0, this.worldLength - LOGICAL_WIDTH));

    this.updateTether(dt);

    this.contactCooldown = Math.max(0, this.contactCooldown - dt);
    for (const toy of this.toys) {
      toy.update(dt, player);
      for (const wall of this.walls) resolveCircleRect(toy, wall);
      if (this.contactCooldown <= 0 && circleOverlap(player, toy)) this.toyContact(player, toy);
    }
    for (const note of this.notes) {
      if (note.taken) continue;
      note.phase += dt;
      if (!pulling && circleOverlap(player, note)) this.collectNote(note);
    }
    for (const gate of this.gates) {
      if (gate.open && gate.anim < 1) gate.anim = Math.min(1, gate.anim + dt * 2.4);
    }
    if (player.x >= this.exitZone.x - PLAYTOY.exitHalf) {
      this.finish(true);
    }
  }

  renderBackdrop(ctx) {
    ctx.fillStyle = PLAYTOY_PALETTE.bottom;
    ctx.fillRect(this.camX - 40, 0, LOGICAL_WIDTH + 80, LOGICAL_HEIGHT);
    const startX = Math.floor((this.camX - 60) / 140) * 140;
    for (let x = startX; x < this.camX + LOGICAL_WIDTH + 60; x += 140) {
      ctx.strokeStyle = 'rgba(90, 150, 160, 0.14)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, LOGICAL_HEIGHT);
      ctx.stroke();
    }
    for (const hole of this.portholes) {
      if (hole.x < this.camX - 60 || hole.x > this.camX + LOGICAL_WIDTH + 60) continue;
      const glow = 0.4 + 0.3 * Math.sin(this.time * 2 + hole.phase);
      ctx.fillStyle = `rgba(120, 210, 200, ${glow})`;
      fillCircle(ctx, hole.x, 78, 22, `rgba(120, 210, 200, ${glow * 0.6})`);
      fillCircle(ctx, hole.x, 78, 15, `rgba(190, 245, 240, ${glow})`);
      ctx.strokeStyle = 'rgba(40, 70, 78, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(hole.x, 78, 22, 0, TAU);
      ctx.stroke();
    }
    for (const d of this.decor) {
      if (d.x < this.camX - 80 || d.x > this.camX + LOGICAL_WIDTH + 80) continue;
      if (d.kind === 'crate') {
        fillRoundRect(ctx, d.x - 20 * d.s, d.y - 20 * d.s, 40 * d.s, 40 * d.s, 6, 'rgba(120, 84, 48, 0.85)');
        ctx.strokeStyle = 'rgba(60, 40, 22, 0.9)';
        ctx.lineWidth = 2;
        strokeRoundRect(ctx, d.x - 20 * d.s, d.y - 20 * d.s, 40 * d.s, 40 * d.s, 6, 'rgba(60, 40, 22, 0.9)', 2);
        ctx.beginPath();
        ctx.moveTo(d.x - 20 * d.s, d.y - 20 * d.s);
        ctx.lineTo(d.x + 20 * d.s, d.y + 20 * d.s);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(96, 140, 148, 0.7)';
        ctx.lineWidth = 7 * d.s;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - 46);
        ctx.lineTo(d.x, d.y + 46);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(60, 92, 100, 0.9)';
        ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.arc(d.x, d.y + i * 24 * d.s, 7 * d.s, 0, Math.PI);
          ctx.stroke();
        }
      }
    }
  }

  renderBulkhead(ctx, wall) {
    fillRoundRect(ctx, wall.x, wall.y, wall.w, wall.h, 4, '#2a444c');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(wall.x + 6, wall.y, 4, wall.h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(wall.x + wall.w - 8, wall.y, 4, wall.h);
    for (let y = wall.y + 24; y < wall.y + wall.h; y += 44) {
      fillCircle(ctx, wall.x + 12, y, 3, 'rgba(200, 230, 230, 0.35)');
      fillCircle(ctx, wall.x + wall.w - 12, y, 3, 'rgba(200, 230, 230, 0.35)');
    }
  }

  renderGate(ctx, gate) {
    const open = gate.anim;
    const h = gate.h * (1 - open);
    const y = gate.y + gate.h * open;
    ctx.save();
    ctx.globalAlpha = 0.95 - open * 0.6;
    fillRoundRect(ctx, gate.x, y, gate.w, h, 4, '#3b2f2a');
    ctx.strokeStyle = gate.type.color;
    ctx.lineWidth = 2.5;
    strokeRoundRect(ctx, gate.x, y, gate.w, h, 4, gate.type.color, 2.5);
    const radius = Math.min(gate.w / 2 - 4, 26);
    if (gate.type.key === 'valve') {
      this.drawValveWheel(ctx, gate.cx, gate.cy, radius, gate.type.color, gate.open, this.time);
    } else if (gate.type.key === 'circuit') {
      this.drawCircuitPanel(ctx, gate.cx, gate.cy, radius, gate.type.color, gate.open, this.time);
    } else {
      this.drawBoltPlate(ctx, gate.cx, gate.cy, radius, gate.type.color, this.time);
    }
    ctx.restore();
  }

  drawValveWheel(ctx, cx, cy, radius, color, open, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = 0.28 + pulse * 0.32;
    fillCircle(ctx, 0, 0, radius + 10, color);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#4a5f64';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -radius - 26);
    ctx.lineTo(0, radius + 26);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, -radius - 30);
    ctx.lineTo(6, -radius - 30);
    ctx.moveTo(-6, radius + 30);
    ctx.lineTo(6, radius + 30);
    ctx.stroke();
    ctx.rotate(time * (open ? 7 : 0.4));
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(-Math.cos(a) * radius, -Math.sin(a) * radius);
      ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * radius, Math.sin(a) * radius, 3, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#0b1418';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.34, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.34, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  drawCircuitPanel(ctx, cx, cy, radius, color, open, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 6);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = 0.28 + pulse * 0.3;
    fillCircle(ctx, 0, 0, radius + 8, color);
    ctx.globalAlpha = 1;
    fillRoundRect(ctx, -radius, -radius, radius * 2, radius * 2, 8, '#101c22');
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    strokeRoundRect(ctx, -radius, -radius, radius * 2, radius * 2, 8, color, 2.5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.6, -radius * 0.2);
    ctx.lineTo(-radius * 0.2, -radius * 0.6);
    ctx.lineTo(0, 0);
    ctx.lineTo(radius * 0.2, -radius * 0.6);
    ctx.lineTo(radius * 0.6, -radius * 0.2);
    ctx.stroke();
    ctx.fillStyle = color;
    fillCircle(ctx, -radius * 0.6, radius * 0.5, 4, color);
    fillCircle(ctx, radius * 0.6, radius * 0.5, 4, `rgba(255,255,255,${pulse})`);
    ctx.restore();
  }

  drawBoltPlate(ctx, cx, cy, radius, color, time) {
    ctx.save();
    ctx.translate(cx, cy);
    fillRoundRect(ctx, -radius, -radius, radius * 2, radius * 2, 6, '#2e3b40');
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    strokeRoundRect(ctx, -radius, -radius, radius * 2, radius * 2, 6, color, 2.5);
    ctx.fillStyle = '#8fa6ad';
    for (const bx of [-radius * 0.62, radius * 0.62]) {
      for (const by of [-radius * 0.62, radius * 0.62]) {
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#5b6f76';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx - 3.5, by);
        ctx.lineTo(bx + 3.5, by);
        ctx.moveTo(bx, by - 3.5);
        ctx.lineTo(bx, by + 3.5);
        ctx.stroke();
        ctx.strokeStyle = color;
      }
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.5, 0);
    ctx.lineTo(radius * 0.5, 0);
    ctx.stroke();
    ctx.fillStyle = '#0b1418';
    fillCircle(ctx, 0, 0, 4, '#0b1418');
    ctx.restore();
  }

  renderAnchorRing(ctx, anchor) {
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 3 + anchor.phase);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.35)';
    ctx.lineWidth = 3 + pulse * 2;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, anchor.radius + 4, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, anchor.radius, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 209, 102, 0.9)';
    fillCircle(ctx, anchor.x, anchor.y, 3, 'rgba(255, 209, 102, 0.9)');
  }

  renderNote(ctx, note) {
    if (note.taken) return;
    const bob = Math.sin(this.time * 2.6 + note.phase) * 3;
    ctx.save();
    ctx.translate(note.x, note.y + bob);
    ctx.rotate(Math.sin(this.time * 1.6 + note.phase) * 0.12);
    fillRoundRect(ctx, -11, -14, 22, 28, 3, 'rgba(240, 230, 200, 0.95)');
    ctx.strokeStyle = 'rgba(120, 100, 70, 0.8)';
    ctx.lineWidth = 1.5;
    strokeRoundRect(ctx, -11, -14, 22, 28, 3, 'rgba(120, 100, 70, 0.8)', 1.5);
    ctx.strokeStyle = 'rgba(90, 80, 60, 0.7)';
    for (let i = -8; i <= 8; i += 5) {
      ctx.beginPath();
      ctx.moveTo(-7, i);
      ctx.lineTo(7, i);
      ctx.stroke();
    }
    ctx.fillStyle = '#d94f5c';
    fillCircle(ctx, 7, -10, 3, '#d94f5c');
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(note.x, note.y + bob, 20, 0, TAU);
    ctx.stroke();
  }

  renderTether(ctx) {
    const t = this.tether;
    const a = this.anchorDef();
    if (t.state === 'idle' && t.cooldown <= 0) return;
    const p = this.players[0];
    drawTetherLine(ctx, { x: p.x, y: p.y }, t.head, a.color, a.glow, this.time);
    const angle = Math.atan2(t.head.y - p.y, t.head.x - p.x);
    drawClampHead(ctx, t.head.x, t.head.y, angle, a.color, a.glow, t.state === 'haul' ? 0.6 : 0);
  }

  renderExit(ctx) {
    const zone = this.exitZone;
    ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
    ctx.fillRect(zone.x - PLAYTOY.exitHalf, 0, PLAYTOY.exitHalf * 2, LOGICAL_HEIGHT);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(zone.x - PLAYTOY.exitHalf, 0, PLAYTOY.exitHalf * 2, LOGICAL_HEIGHT);
    drawText(ctx, 'SURFACE', zone.x, 40, { size: 16, color: COLORS.accent, glow: 'rgba(255,209,102,0.5)', glowBlur: 12 });
  }

  renderRound(ctx) {
    ctx.save();
    ctx.translate(-this.camX, 0);
    this.renderBackdrop(ctx);
    for (const wall of this.bulkheads) this.renderBulkhead(ctx, wall);
    for (const gate of this.gates) this.renderGate(ctx, gate);
    for (const anchor of this.anchors) this.renderAnchorRing(ctx, anchor);
    for (const note of this.notes) this.renderNote(ctx, note);
    this.renderExit(ctx);
    for (const toy of this.toys) toy.render(ctx);
    this.renderPlayers(ctx);
    this.renderTether(ctx);
    this.particles.render(ctx);
    ctx.restore();
  }

  renderHud(ctx) {
    const a = this.anchorDef();
    fillRoundRect(ctx, 20, 16, 300, 34, 12, 'rgba(6, 20, 26, 0.72)');
    strokeRoundRect(ctx, 20, 16, 300, 34, 12, a.color, 2);
    fillCircle(ctx, 42, 33, 8, a.color);
    drawText(ctx, a.label, 60, 33, {
      size: 15,
      color: COLORS.text,
      align: 'left',
      glow: a.glow,
      glowBlur: 8,
    });
    drawText(ctx, `${a.desc} — [E] SWAP`, 20, 60, { size: 11, color: COLORS.textDim, align: 'left' });

    drawText(ctx, `NOTES ${this.notesCollected}/${this.notes.length}`, LOGICAL_WIDTH - 24, 33, {
      size: 16,
      color: COLORS.accent,
      align: 'right',
      glow: 'rgba(255, 209, 102, 0.4)',
      glowBlur: 8,
    });
    drawText(ctx, 'REACH THE SURFACE HATCH', LOGICAL_WIDTH - 24, 58, {
      size: 12,
      color: COLORS.textDim,
      align: 'right',
    });

    const remain = Math.max(0, this.exitZone.x - this.players[0].x);
    drawText(ctx, `SURFACE ${Math.max(0, Math.round(remain))}m`, LOGICAL_WIDTH / 2, 26, {
      size: 13,
      color: COLORS.foam,
      alpha: 0.85,
    });

    if (this.messageTimer > 0 && this.message) {
      drawText(ctx, this.message, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 44, {
        size: 14,
        color: COLORS.text,
        alpha: Math.min(1, this.messageTimer),
        glow: 'rgba(120, 220, 230, 0.4)',
        glowBlur: 10,
      });
    }
    if (this.noteTimer > 0) {
      const w = 640;
      const x = LOGICAL_WIDTH / 2 - w / 2;
      const y = 90;
      fillRoundRect(ctx, x, y, w, 84, 14, 'rgba(10, 30, 36, 0.92)');
      strokeRoundRect(ctx, x, y, w, 84, 14, 'rgba(255, 209, 102, 0.5)', 2);
      drawText(ctx, 'PLAYTOY NOTE', LOGICAL_WIDTH / 2, y + 20, {
        size: 13,
        color: COLORS.accent,
        glow: 'rgba(255, 209, 102, 0.4)',
        glowBlur: 8,
      });
      this.renderWrapped(ctx, this.noteText, LOGICAL_WIDTH / 2, y + 44, w - 40, 16, 12);
    }
    drawText(
      ctx,
      'WASD — SWIM      F / RIGHT-CLICK — FIRE ANCHOR      E — SWAP HEADS      I — INVENTORY (NOTES)',
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT - 16,
      { size: 11, color: COLORS.textDim, alpha: 0.72 },
    );

    if (firstPersonMode()) {
      const armed = this.tether.state !== 'idle';
      drawReticle(ctx, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, a.color, armed);
    }

    if (this.inventoryOpen) this.renderInventory(ctx);
  }

  renderInventory(ctx) {
    const count = PLAYTOY_NOTES.length;
    ctx.fillStyle = 'rgba(3, 12, 16, 0.82)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    const panelX = 200;
    const panelW = 560;
    const panelTop = 56;
    const panelH = 430;
    fillRoundRect(ctx, panelX, panelTop, panelW, panelH, 20, 'rgba(10, 30, 36, 0.96)');
    strokeRoundRect(ctx, panelX, panelTop, panelW, panelH, 20, 'rgba(255, 209, 102, 0.5)', 2);
    drawText(ctx, 'PLAYTOY INVENTORY', LOGICAL_WIDTH / 2, panelTop + 26, {
      size: 22,
      color: COLORS.accent,
      glow: 'rgba(255, 209, 102, 0.45)',
      glowBlur: 14,
    });
    drawText(ctx, `${this.collectedNotes.size}/${count} PAPERS RECOVERED`, LOGICAL_WIDTH / 2, panelTop + 50, {
      size: 12,
      color: COLORS.foam,
      alpha: 0.85,
    });

    const listX = panelX + 24;
    const listTop = panelTop + 74;
    const rowH = 25;
    for (let i = 0; i < count; i += 1) {
      const y = listTop + i * rowH;
      const collected = this.collectedNotes.has(i);
      const active = i === this.inventoryIndex;
      if (active) fillRoundRect(ctx, listX - 8, y - 12, 220, 24, 8, 'rgba(255, 209, 102, 0.16)');
      drawText(ctx, collected ? `NOTE ${i + 1}` : `NOTE ${i + 1} — SEALED`, listX, y, {
        size: 13,
        color: collected ? (active ? COLORS.accent : COLORS.text) : COLORS.textDim,
        align: 'left',
        alpha: collected ? (active ? 1 : 0.82) : 0.5,
      });
    }

    const textX = panelX + 268;
    const textW = panelW - 268 - 28;
    if (this.collectedNotes.has(this.inventoryIndex)) {
      drawText(ctx, `PAPER ${this.inventoryIndex + 1}`, textX, listTop, {
        size: 14,
        color: COLORS.accent,
        align: 'left',
      });
      this.renderWrapped(ctx, PLAYTOY_NOTES[this.inventoryIndex], textX, listTop + 26, textW, 34, 20, 'left');
    } else {
      drawText(ctx, 'THIS PAPER HAS NOT BEEN FOUND YET.', textX, listTop + 14, {
        size: 13,
        color: COLORS.textDim,
        align: 'left',
        alpha: 0.8,
      });
    }

    drawText(ctx, 'UP/DOWN — BROWSE      I / ESC — CLOSE', LOGICAL_WIDTH / 2, panelTop + panelH - 22, {
      size: 12,
      color: COLORS.textDim,
      alpha: 0.75,
    });
  }

  renderWrapped(ctx, text, cx, y, maxWidth, maxChars, lineHeight, align = 'center') {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => {
      drawText(ctx, l, cx, y + i * lineHeight, { size: 12, color: COLORS.text, alpha: 0.92, align });
    });
  }

  firstPersonPalette() {
    return { top: PLAYTOY_PALETTE.top, bottom: PLAYTOY_PALETTE.bottom, wall: '#244a52' };
  }

  firstPersonBounds() {
    return { x: 0, y: 0, w: this.worldLength ?? LOGICAL_WIDTH, h: LOGICAL_HEIGHT };
  }

  firstPersonSprites() {
    return [...(this.players ?? []), ...(this.toys ?? [])];
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
    return 'PLAYTOY EXPLORATION';
  }

  resultsHeadline() {
    return this.won ? 'THE SURFACE HOLDS YOU' : 'LOST IN THE HOLD';
  }

  resultsDetail() {
    return `${this.notesCollected}/${this.notes.length} NOTES — ${this.toysRepelled} TOYS REPELLED`;
  }
}
