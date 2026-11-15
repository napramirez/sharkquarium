import { MinigameScene } from '../engine/minigame.js';
import { SelectList } from '../engine/selectlist.js';
import {
  drawWater,
  drawText,
  fillCircle,
  fillRoundRect,
  strokeRoundRect,
  strokeCircle,
} from '../engine/render.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { circleOverlap } from '../engine/collision.js';
import { Shark } from '../entities/shark.js';
import { applyWardrobe, wardrobeFor } from '../engine/wardrobe.js';
import { setActiveSkin, skinByKey } from '../engine/skin.js';
import { drawKarambitShape } from '../engine/aura.js';
import { drawMiniShark, drawMiniStingray, drawMiniOctopus, drawBabyMoray } from '../engine/companion.js';
import {
  CONTROLS,
  DIFFICULTY,
  SETTINGS_KEY,
  COLORS,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  WATER_PALETTE,
} from '../config.js';

const FOOD_COSTUMES = new Set(['sharkfin', 'sambalstingray', 'grilledsquid', 'prawncrackers']);

const AURA_KIND = {
  karambitaura: 'weapon',
  chaoskarambit: 'weapon',
  tridentaura: 'weapon',
  swordaura: 'weapon',
  octopusaura: 'living',
  stingrayaura: 'living',
  sharkaura: 'living',
  eelaura: 'living',
  snowflakeaura: 'power',
  bubbleaura: 'power',
  neonaura: 'power',
};

const WEAPON_STYLE = {
  karambitaura: 'karambit',
  chaoskarambit: 'karambit',
  tridentaura: 'shot',
  swordaura: 'shot',
};

const AURA_COLOR = {
  karambitaura: '#ffd166',
  chaoskarambit: '#ff2b2b',
  tridentaura: '#8fd8ff',
  swordaura: '#dfe7ef',
  octopusaura: '#b06fd0',
  stingrayaura: '#c9a06a',
  sharkaura: '#6f9fc4',
  eelaura: '#8a9a5a',
  snowflakeaura: '#cfefff',
  bubbleaura: '#7fd0ff',
  neonaura: '#63e6ff',
};

const ARENA = { left: 46, right: LOGICAL_WIDTH - 46, top: 122, bottom: LOGICAL_HEIGHT - 74 };
const MAX_HP = 100;

function auraKind(key) {
  return AURA_KIND[key] ?? 'none';
}

export class DressBattleScene extends MinigameScene {
  enter(params = {}) {
    this.battleShop = params.shop ?? null;
    super.enter(params);
  }

  buildRound() {
    if (this.battleShop) this.shop = this.battleShop;
    this.phase = 'play';
    this.elapsed = 0;
    this.won = false;
    this.winner = -1;
    this.projectiles = [];
    this.creatures = [];
    this.blind = { timer: 0, owner: -1 };
    this.status = 'FIGHT!';
    this.statusTimer = 1.6;
    this.hitStop = 0;
    this.fighters = [
      this.makeFighter(0, ARENA.left + 120, LOGICAL_HEIGHT * 0.5, CONTROLS.p1, 'lunge1', 'aura1'),
      this.makeFighter(1, ARENA.right - 120, LOGICAL_HEIGHT * 0.5, CONTROLS.p2, 'lunge2', 'aura2'),
    ];
    this.players = this.fighters.map((fighter) => fighter.entity);
  }

  makeFighter(index, x, y, controls, lungeKey, auraKey) {
    const entity = new Shark(x, y, { controls, pointer: false });
    entity.noIdleFlip = true;
    entity.maxSpeed = 300;
    const wardrobe = wardrobeFor(this.shop, index);
    return {
      index,
      entity,
      controls,
      lungeKey,
      auraKeyInput: auraKey,
      hp: MAX_HP,
      maxHp: MAX_HP,
      baseSpeed: 300,
      facing: index === 0 ? 1 : -1,
      lungeTimer: 0,
      lungeCooldown: 0,
      lungeHit: false,
      dive: false,
      auraTimer: 0,
      auraCooldown: 0,
      auraAmmo: 0,
      auraFireTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      invulnTimer: 0,
      contactCooldown: 0,
      trailStunCooldown: 0,
      healPuff: 0,
      auraKey: wardrobe.aura ?? 'none',
      costumeKey: wardrobe.costume ?? 'none',
      trailKey: wardrobe.trail ?? 'none',
      wardrobe,
    };
  }

  setStatus(text) {
    this.status = text;
    this.statusTimer = 1.4;
  }

  opponentOf(fighter) {
    return this.fighters[1 - fighter.index];
  }

  damage(target, amount, options = {}) {
    if (this.phase !== 'play') return;
    if (target.invulnTimer > 0) return;
    target.hp = Math.max(0, target.hp - amount);
    target.invulnTimer = options.invuln ?? 0.12;
    this.flash = Math.max(this.flash, options.flash ?? 0.4);
    this.shake = Math.max(this.shake, options.shake ?? 0.3);
    const e = target.entity;
    this.particles.burst(e.x, e.y, {
      count: 12,
      speed: 180,
      life: 0.5,
      colors: options.colors ?? ['#ffd166', '#ffffff'],
      buoyancy: -20,
    });
    this.game.audio.tone({ freq: options.low ? 160 : 320, endFreq: 90, type: 'square', duration: 0.12, volume: 0.2 });
    if (target.hp <= 0) this.finishMatch(1 - target.index);
  }

  finishMatch(winner) {
    this.phase = 'results';
    this.winner = winner;
    this.won = true;
    this.reward = 0;
    this.resultsMenu.reset();
    this.game.audio.tone({ freq: 523, endFreq: 784, type: 'triangle', duration: 0.4, volume: 0.24 });
  }

  chooseResult(action) {
    this.game.audio.tone({ freq: 300, endFreq: 620, duration: 0.16, volume: 0.2 });
    if (action === 'again') this.resetRound();
    else this.game.changeScene('minigames');
  }

  doLunge(fighter) {
    if (fighter.lungeCooldown > 0 || fighter.stunTimer > 0) return;
    const living = auraKind(fighter.auraKey) === 'living' && fighter.auraTimer > 0;
    fighter.dive = living;
    fighter.lungeTimer = living ? 0.42 : 0.3;
    fighter.lungeCooldown = living ? 0.9 : 1.0;
    fighter.lungeHit = false;
    if (living) fighter.invulnTimer = Math.max(fighter.invulnTimer, 0.5);
    fighter.entity.vx = fighter.facing * (living ? 720 : 540);
    fighter.entity.vy *= 0.2;
    this.game.audio.tone({ freq: living ? 300 : 420, endFreq: living ? 140 : 200, type: 'sawtooth', duration: 0.14, volume: 0.2 });
  }

  deployAura(fighter) {
    if (fighter.auraCooldown > 0 || fighter.auraTimer > 0 || fighter.stunTimer > 0) return;
    const kind = auraKind(fighter.auraKey);
    if (kind === 'none') {
      this.setStatus('NO AURA EQUIPPED');
      return;
    }
    const opponent = this.opponentOf(fighter);
    fighter.auraTimer = 5;
    this.setStatus(kind === 'weapon' ? 'AURA BARRAGE!' : kind === 'living' ? 'AURA UNLEASHED!' : 'POWER AURA!');
    this.game.audio.tone({ freq: 520, endFreq: 900, type: 'triangle', duration: 0.24, volume: 0.22 });
    if (kind === 'weapon') {
      const style = WEAPON_STYLE[fighter.auraKey];
      if (style === 'shot') {
        fighter.auraAmmo = 3;
        fighter.auraFireTimer = 0.25;
        fighter.auraCooldown = 6.5;
      } else {
        fighter.auraAmmo = -1;
        fighter.auraFireTimer = 0.2;
        fighter.auraCooldown = 5.6;
      }
    } else if (kind === 'living') {
      this.spawnAuraCreature(fighter);
      fighter.auraCooldown = 7.5;
    } else {
      fighter.auraCooldown = 6;
      fighter.auraTimer = 0.6;
      this.applyPower(fighter, opponent, fighter.auraKey);
    }
  }

  applyPower(fighter, opponent, key) {
    if (key === 'neonaura') {
      this.creatures = this.creatures.filter((c) => {
        if (c.owner === opponent.index) {
          this.particles.burst(c.x, c.y, { count: 14, speed: 200, life: 0.5, colors: ['#63e6ff', '#ffffff'], buoyancy: -20 });
          return false;
        }
        return true;
      });
      this.blind = { timer: 1.6, owner: opponent.index };
      this.setStatus('NEON FLASH — BLINDED!');
    } else if (key === 'snowflakeaura') {
      opponent.slowTimer = 3.2;
      this.setStatus('FROZEN TAIL!');
    } else if (key === 'bubbleaura') {
      const dx = opponent.entity.x - fighter.entity.x;
      const dy = opponent.entity.y - fighter.entity.y;
      const d = Math.hypot(dx, dy) || 1;
      opponent.entity.vx = (dx / d) * 620;
      opponent.entity.vy = (dy / d) * 620;
      this.setStatus('BUBBLE BLAST!');
    }
  }

  spawnAuraCreature(fighter) {
    const e = fighter.entity;
    this.creatures.push({
      x: e.x + rand(-30, 30),
      y: e.y + rand(-30, 30),
      vx: 0,
      vy: 0,
      owner: fighter.index,
      kind: fighter.auraKey,
      color: AURA_COLOR[fighter.auraKey] ?? '#9fd0ff',
      hp: 3,
      maxHp: 3,
      phase: rand(0, TAU),
      facing: 1,
      attackCooldown: 0,
      hitCooldown: 0,
    });
  }

  fireProjectile(fighter, style) {
    const target = this.opponentOf(fighter);
    const e = fighter.entity;
    const angle = Math.atan2(target.entity.y - e.y, target.entity.x - e.x);
    const speed = style === 'karambit' ? 440 : 540;
    this.projectiles.push({
      x: e.x,
      y: e.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      owner: fighter.index,
      style,
      kind: fighter.auraKey,
      color: AURA_COLOR[fighter.auraKey] ?? '#ffd166',
      t: 0,
      life: style === 'karambit' ? 2.4 : 1.2,
      damage: style === 'karambit' ? 5 : 6,
      spin: rand(0, TAU),
      outbound: 1.1,
      hitCooldown: 0,
      returning: false,
    });
    this.game.audio.tone({ freq: style === 'karambit' ? 640 : 500, endFreq: style === 'karambit' ? 880 : 300, duration: 0.08, volume: 0.14 });
  }

  updateRound(dt, input) {
    this.statusTimer = Math.max(0, this.statusTimer - dt);
    this.blind.timer = Math.max(0, this.blind.timer - dt);
    for (const fighter of this.fighters) this.updateFighter(dt, input, fighter);
    this.updateProjectiles(dt);
    this.updateCreatures(dt);
    this.updateTrailStuns(dt);
    this.checkContact(dt);
  }

  updateFighter(dt, input, fighter) {
    const e = fighter.entity;
    fighter.lungeCooldown = Math.max(0, fighter.lungeCooldown - dt);
    fighter.auraCooldown = Math.max(0, fighter.auraCooldown - dt);
    fighter.invulnTimer = Math.max(0, fighter.invulnTimer - dt);
    fighter.contactCooldown = Math.max(0, fighter.contactCooldown - dt);
    fighter.trailStunCooldown = Math.max(0, fighter.trailStunCooldown - dt);
    fighter.stunTimer = Math.max(0, fighter.stunTimer - dt);
    fighter.slowTimer = Math.max(0, fighter.slowTimer - dt);
    fighter.auraTimer = Math.max(0, fighter.auraTimer - dt);
    fighter.healPuff = Math.max(0, fighter.healPuff - dt);

    e.maxSpeed = fighter.baseSpeed * (fighter.slowTimer > 0 ? 0.4 : 1);
    const frozen = fighter.stunTimer > 0;

    if (input.wasPressed(fighter.lungeKey)) this.doLunge(fighter);
    if (input.wasPressed(fighter.auraKeyInput)) this.deployAura(fighter);

    if (fighter.lungeTimer > 0) {
      fighter.lungeTimer -= dt;
      e.vx *= 0.9;
      e.vy *= 0.9;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else if (frozen) {
      e.vx *= 0.82;
      e.vy *= 0.82;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else {
      e.update(dt, input);
    }
    if (Math.abs(e.vx) > 12) fighter.facing = e.vx > 0 ? 1 : -1;
    e.x = clamp(e.x, ARENA.left, ARENA.right);
    e.y = clamp(e.y, ARENA.top, ARENA.bottom);

    if (fighter.auraTimer > 0 && auraKind(fighter.auraKey) === 'weapon') {
      fighter.auraFireTimer -= dt;
      if (fighter.auraFireTimer <= 0) {
        const style = WEAPON_STYLE[fighter.auraKey];
        if (style === 'karambit') {
          fighter.auraFireTimer = 0.5;
          this.fireProjectile(fighter, 'karambit');
        } else if (fighter.auraAmmo > 0) {
          fighter.auraFireTimer = 0.32;
          fighter.auraAmmo -= 1;
          this.fireProjectile(fighter, 'shot');
        }
      }
    }

    if (FOOD_COSTUMES.has(fighter.costumeKey) && fighter.hp < fighter.maxHp * 0.4 && fighter.hp > 0) {
      fighter.hp = Math.min(fighter.maxHp, fighter.hp + 7 * dt);
      fighter.healPuff = 0.4;
    }
  }

  updateProjectiles(dt) {
    for (const p of this.projectiles) {
      p.t += dt;
      p.hitCooldown = Math.max(0, p.hitCooldown - dt);
      p.spin += dt * (p.style === 'karambit' ? 18 : 0);
      const owner = this.fighters[p.owner];
      const target = this.fighters[1 - p.owner];
      if (p.style === 'karambit') {
        if (p.t >= p.outbound && !p.returning) {
          p.returning = true;
        }
        if (p.returning) {
          const dx = owner.entity.x - p.x;
          const dy = owner.entity.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          const speed = 470;
          p.vx = (dx / d) * speed;
          p.vy = (dy / d) * speed;
        }
        if (p.returning && Math.hypot(owner.entity.x - p.x, owner.entity.y - p.y) < 22) p.dead = true;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < ARENA.left - 60 || p.x > ARENA.right + 60 || p.y < ARENA.top - 60 || p.y > ARENA.bottom + 60) p.dead = true;
      if (!p.dead && p.hitCooldown <= 0 && circleOverlap({ x: p.x, y: p.y, radius: 12 }, target.entity)) {
        p.hitCooldown = 0.5;
        this.damage(target, p.damage, { colors: [p.color, '#ffffff'], flash: 0.3, shake: 0.22 });
        for (const c of this.creatures) {
          if (c.owner !== p.owner && circleOverlap({ x: p.x, y: p.y, radius: 14 }, { x: c.x, y: c.y, radius: 16 })) {
            this.hurtCreature(c, 1);
            p.hitCooldown = 0.4;
          }
        }
      }
      if (p.style === 'shot' && p.t >= p.life) p.dead = true;
      if (p.style === 'karambit' && p.t >= p.life) p.dead = true;
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  hurtCreature(creature, amount) {
    creature.hp -= amount;
    creature.hitCooldown = 0.2;
    this.particles.burst(creature.x, creature.y, { count: 8, speed: 150, life: 0.4, colors: [creature.color, '#ffffff'], buoyancy: -20 });
    if (creature.hp <= 0) creature.dead = true;
  }

  updateCreatures(dt) {
    for (const creature of this.creatures) {
      creature.phase += dt;
      creature.attackCooldown = Math.max(0, creature.attackCooldown - dt);
      creature.hitCooldown = Math.max(0, creature.hitCooldown - dt);
      const target = this.fighters[1 - creature.owner];
      const dx = target.entity.x - creature.x;
      const dy = target.entity.y - creature.y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = 150;
      creature.vx = (dx / d) * speed;
      creature.vy = (dy / d) * speed;
      creature.x += creature.vx * dt;
      creature.y += creature.vy * dt;
      if (Math.abs(creature.vx) > 4) creature.facing = creature.vx > 0 ? 1 : -1;
      creature.x = clamp(creature.x, ARENA.left, ARENA.right);
      creature.y = clamp(creature.y, ARENA.top, ARENA.bottom);
      if (creature.attackCooldown <= 0 && circleOverlap({ x: creature.x, y: creature.y, radius: 18 }, target.entity)) {
        creature.attackCooldown = 0.9;
        this.damage(target, 4, { colors: [creature.color, '#ffffff'], low: true, flash: 0.28, shake: 0.2 });
      }
      if (creature.hitCooldown <= 0) {
        const owner = this.fighters[creature.owner];
        if (owner.lungeTimer > 0) {
          // owner's lunge does not hurt own creature
        }
      }
    }
    this.creatures = this.creatures.filter((c) => !c.dead);
  }

  updateTrailStuns(dt) {
    for (const fighter of this.fighters) {
      if (fighter.trailKey === 'none' || fighter.trailStunCooldown > 0) continue;
      const e = fighter.entity;
      const speed = Math.hypot(e.vx, e.vy);
      if (speed < 150) continue;
      const target = this.opponentOf(fighter);
      if (circleOverlap(e, target.entity)) {
        target.stunTimer = Math.max(target.stunTimer, 0.6);
        fighter.trailStunCooldown = 1.6;
        this.particles.burst(target.entity.x, target.entity.y, { count: 12, speed: 200, life: 0.5, colors: ['#7fd0ff', '#ffffff'], buoyancy: -10 });
        this.setStatus('TRAIL STUN!');
      }
    }
  }

  checkContact(dt) {
    for (const fighter of this.fighters) {
      if (fighter.lungeTimer <= 0 || fighter.lungeHit) continue;
      const target = this.opponentOf(fighter);
      if (circleOverlap(fighter.entity, target.entity)) {
        fighter.lungeHit = true;
        const saw = fighter.costumeKey === 'chainfin';
        const damage = fighter.dive ? 20 : saw ? 16 : 9;
        this.damage(target, damage, {
          colors: saw ? ['#dfe7ef', '#ff3b4b', '#ffffff'] : ['#ffd166', '#ffffff'],
          low: fighter.dive,
          flash: fighter.dive ? 0.6 : 0.4,
          shake: fighter.dive ? 0.5 : 0.3,
        });
        this.setStatus(saw ? 'SAW LUNGE!' : fighter.dive ? 'DIVE ATTACK!' : 'LUNGE!');
      }
    }
  }

  renderArena(ctx) {
    ctx.fillStyle = 'rgba(8, 26, 34, 0.5)';
    ctx.fillRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
    ctx.strokeStyle = 'rgba(120, 210, 220, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
    ctx.strokeStyle = 'rgba(120, 210, 220, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(LOGICAL_WIDTH / 2, ARENA.top);
    ctx.lineTo(LOGICAL_WIDTH / 2, ARENA.bottom);
    ctx.stroke();
  }

  renderProjectile(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.spin);
    if (p.style === 'karambit') {
      drawKarambitShape(ctx, 16, { glow: p.color, blade: p.color, edge: '#f4fbff', loop: p.color, glowAlpha: 0.9 });
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-8, -5);
      ctx.lineTo(-8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  renderCreature(ctx, c) {
    const bob = Math.sin(this.time * 4 + c.phase) * 3;
    const age = this.time + c.phase;
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.scale(c.facing ?? 1, 1);
    if (c.hitCooldown > 0) ctx.globalAlpha = 0.5;
    if (auraKind(c.kind) === 'living') {
      if (c.kind === 'octopusaura') drawMiniOctopus(ctx, 24, age, c.phase);
      else if (c.kind === 'stingrayaura') drawMiniStingray(ctx, 28, age, c.phase);
      else if (c.kind === 'sharkaura') drawMiniShark(ctx, 26, age, c.phase);
      else drawBabyMoray(ctx, 30, age, c.phase);
    } else {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 13, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(6, -2, 4, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderRound(ctx) {
    this.renderArena(ctx);
    for (const p of this.projectiles) this.renderProjectile(ctx, p);
    setActiveSkin(skinByKey('natural'));
    for (const c of this.creatures) this.renderCreature(ctx, c);
    this.renderPlayers(ctx);
    for (const fighter of this.fighters) {
      if (fighter.slowTimer > 0) this.renderIcyTail(ctx, fighter);
    }
    this.particles.render(ctx);
  }

  renderIcyTail(ctx, fighter) {
    const e = fighter.entity;
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = '#cfefff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(e.x - fighter.facing * e.radius, e.y);
    ctx.lineTo(e.x - fighter.facing * e.radius * 2, e.y - 6);
    ctx.lineTo(e.x - fighter.facing * e.radius * 2.6, e.y + 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(207, 239, 255, 0.8)';
    for (let i = 0; i < 4; i += 1) {
      fillCircle(ctx, e.x - fighter.facing * e.radius * (1 + i * 0.4), e.y + (i % 2 ? 4 : -4), 4, 'rgba(207, 239, 255, 0.8)');
    }
    ctx.restore();
  }

  renderHud(ctx) {
    for (const fighter of this.fighters) {
      const right = fighter.index === 1;
      const barW = 320;
      const x = right ? LOGICAL_WIDTH - 24 - barW : 24;
      const y = 70;
      fillRoundRect(ctx, x, y, barW, 20, 10, 'rgba(6, 20, 26, 0.8)');
      const ratio = clamp(fighter.hp / fighter.maxHp, 0, 1);
      fillRoundRect(ctx, x, y, barW * ratio, 20, 10, right ? '#63e6ff' : '#ffd166');
      strokeRoundRect(ctx, x, y, barW, 20, 10, 'rgba(207, 239, 255, 0.4)', 2);
      drawText(ctx, `P${fighter.index + 1}  ${Math.ceil(fighter.hp)}`, right ? x + barW : x, y - 12, {
        size: 14,
        color: right ? '#63e6ff' : '#ffd166',
        align: right ? 'right' : 'left',
      });
      const aura = fighter.auraKey === 'none' ? 'NO AURA' : fighter.auraKey.replace('aura', '').replace('karambit', 'KARAMBIT').toUpperCase();
      const ready = fighter.auraCooldown <= 0 && fighter.auraTimer <= 0;
      drawText(ctx, `${aura}${ready ? '' : ' …'}`, right ? x + barW : x, y + 36, {
        size: 11,
        color: ready ? COLORS.foam : COLORS.textDim,
        align: right ? 'right' : 'left',
      });
      const keys = fighter.index === 0 ? 'WASD MOVE · J LUNGE · K AURA' : 'ARROWS MOVE · 1 LUNGE · 2 AURA';
      drawText(ctx, keys, right ? x + barW : x, y + 52, {
        size: 10,
        color: COLORS.textDim,
        align: right ? 'right' : 'left',
      });
    }
    drawText(ctx, 'DRESS UP BATTLE', LOGICAL_WIDTH / 2, 40, {
      size: 26,
      color: COLORS.text,
      glow: 'rgba(120, 220, 230, 0.5)',
      glowBlur: 16,
    });
    if (this.statusTimer > 0 && this.status) {
      drawText(ctx, this.status, LOGICAL_WIDTH / 2, 104, {
        size: 16,
        color: COLORS.accent,
        alpha: Math.min(1, this.statusTimer),
        glow: 'rgba(255, 209, 102, 0.4)',
        glowBlur: 10,
      });
    }
    if (this.blind.timer > 0) {
      ctx.fillStyle = `rgba(99, 230, 255, ${0.5 * Math.min(1, this.blind.timer)})`;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      drawText(ctx, 'BLINDED!', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, {
        size: 40,
        color: '#ffffff',
        glow: 'rgba(99, 230, 255, 0.8)',
        glowBlur: 22,
      });
    }
  }

  resultsTitle() {
    return 'DRESS UP BATTLE';
  }

  resultsHeadline() {
    return this.winner >= 0 ? `PLAYER ${this.winner + 1} WINS!` : 'DRAW';
  }

  resultsDetail() {
    return 'DRESS TO FIGHT — COSMETICS ARE THE WEAPONS';
  }
}
