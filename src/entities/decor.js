import { rand, TAU } from '../engine/math.js';
import { DEEPSEA, SAND, LOGICAL_WIDTH, LOGICAL_HEIGHT, COLORS } from '../config.js';

export class Decor {
  constructor(tank) {
    this.tank = tank;
    this.age = 0;
    const roll = (count, make) => Array.from({ length: count }, (_, index) => make(index));
    if (tank === 'stingray') {
      this.starfish = roll(3, () => ({
        x: rand(90, LOGICAL_WIDTH - 90),
        y: LOGICAL_HEIGHT - SAND.height + rand(14, 54),
        size: rand(9, 14),
        rotation: rand(0, TAU),
        tint: Math.random() < 0.5 ? COLORS.crab : COLORS.accent,
      }));
      this.urchins = roll(4, () => ({
        x: rand(70, LOGICAL_WIDTH - 70),
        y: LOGICAL_HEIGHT - SAND.height + rand(8, 44),
        radius: rand(9, 13),
      }));
    } else if (tank === 'deepsea') {
      this.vents = roll(2, (index) => ({
        x: 180 + index * (LOGICAL_WIDTH - 360),
        height: rand(26, 40),
        phase: rand(0, TAU),
      }));
      this.tubes = roll(5, () => ({
        x: rand(90, LOGICAL_WIDTH - 90),
        height: rand(16, 30),
        phase: rand(0, TAU),
      }));
    } else if (tank === 'arctic') {
      this.floes = roll(3, () => ({
        x: rand(120, LOGICAL_WIDTH - 120),
        y: LOGICAL_HEIGHT - rand(40, 110),
        width: rand(70, 120),
        height: rand(14, 24),
      }));
      this.snow = roll(16, () => ({
        x: rand(20, LOGICAL_WIDTH - 20),
        y: rand(0, LOGICAL_HEIGHT),
        speed: rand(12, 26),
        size: rand(1.2, 2.6),
      }));
    } else if (tank === 'kelp') {
      this.motes = roll(14, () => ({
        x: rand(20, LOGICAL_WIDTH - 20),
        y: rand(0, LOGICAL_HEIGHT),
        speed: rand(9, 20),
        size: rand(1.4, 3),
        phase: rand(0, TAU),
      }));
    } else if (tank === 'jelly') {
      this.spores = roll(12, () => ({
        x: rand(20, LOGICAL_WIDTH - 20),
        y: rand(0, LOGICAL_HEIGHT),
        speed: rand(8, 18),
        size: rand(1.6, 3.2),
        phase: rand(0, TAU),
      }));
      this.silhouettes = roll(2, (index) => ({
        x: 200 + index * 480,
        y: rand(90, 200),
        size: rand(30, 44),
        phase: rand(0, TAU),
      }));
    } else if (tank === 'freshwater') {
      this.pads = roll(6, () => ({
        x: rand(70, LOGICAL_WIDTH - 70),
        y: rand(14, 34),
        radius: rand(13, 22),
        phase: rand(0, TAU),
        flower: Math.random() < 0.35,
      }));
    } else if (tank === 'nautilus') {
      this.motes = roll(14, () => ({
        x: rand(20, LOGICAL_WIDTH - 20),
        y: rand(0, LOGICAL_HEIGHT),
        speed: rand(10, 22),
        size: rand(1.4, 3),
        phase: rand(0, TAU),
      }));
      this.shells = roll(3, () => ({
        x: rand(80, LOGICAL_WIDTH - 80),
        y: rand(140, LOGICAL_HEIGHT - 120),
        size: rand(9, 14),
        rotation: rand(0, TAU),
      }));
    }
  }

  update(dt) {
    this.age += dt;
  }

  render(ctx) {
    if (this.tank === 'stingray') {
      for (const urchin of this.urchins) {
        const radius = urchin.radius;
        ctx.save();
        ctx.translate(urchin.x, urchin.y);
        ctx.fillStyle = COLORS.urchinSpike;
        for (let i = 0; i < 16; i += 1) {
          const angle = (i / 16) * TAU;
          const spread = 0.16;
          ctx.beginPath();
          ctx.moveTo(
            Math.cos(angle - spread) * radius * 0.92,
            Math.sin(angle - spread) * radius * 0.92,
          );
          ctx.lineTo(Math.cos(angle) * radius * 1.62, Math.sin(angle) * radius * 1.62);
          ctx.lineTo(
            Math.cos(angle + spread) * radius * 0.92,
            Math.sin(angle + spread) * radius * 0.92,
          );
          ctx.closePath();
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, TAU);
        ctx.fillStyle = COLORS.urchin;
        ctx.fill();
        ctx.strokeStyle = COLORS.urchinSpike;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(-radius * 0.3, -radius * 0.35, radius * 0.28, 0, TAU);
        ctx.fillStyle = '#c9a7dd';
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      for (const star of this.starfish) {
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(star.rotation);
        ctx.fillStyle = star.tint;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) {
          const angle = (i / 10) * TAU - Math.PI / 2;
          const reach = i % 2 === 0 ? star.size : star.size * 0.45;
          const px = Math.cos(angle) * reach;
          const py = Math.sin(angle) * reach;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      return;
    }
    if (this.tank === 'deepsea') {
      const floor = LOGICAL_HEIGHT - DEEPSEA.floorHeight;
      for (const vent of this.vents) {
        ctx.fillStyle = COLORS.rockDark;
        ctx.beginPath();
        ctx.moveTo(vent.x - 16, floor + 4);
        ctx.lineTo(vent.x - 7, floor - vent.height);
        ctx.lineTo(vent.x + 7, floor - vent.height);
        ctx.lineTo(vent.x + 16, floor + 4);
        ctx.closePath();
        ctx.fill();
        const pulse = 0.35 + 0.3 * Math.sin(this.age * 2 + vent.phase);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = COLORS.lure;
        ctx.beginPath();
        ctx.ellipse(vent.x, floor - vent.height - 10, 12, 18, 0, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      for (const tube of this.tubes) {
        ctx.strokeStyle = COLORS.rock;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tube.x, floor + 6);
        ctx.lineTo(tube.x + Math.sin(this.age * 1.2 + tube.phase) * 4, floor - tube.height);
        ctx.stroke();
        ctx.fillStyle = COLORS.danger;
        ctx.beginPath();
        ctx.arc(
          tube.x + Math.sin(this.age * 1.2 + tube.phase) * 4,
          floor - tube.height,
          4,
          0,
          TAU,
        );
        ctx.fill();
      }
      return;
    }
    if (this.tank === 'arctic') {
      for (const floe of this.floes) {
        ctx.fillStyle = COLORS.iceDark;
        ctx.beginPath();
        ctx.ellipse(floe.x, floe.y, floe.width * 0.5, floe.height * 0.5, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(220, 236, 245, 0.85)';
        ctx.beginPath();
        ctx.ellipse(floe.x, floe.y - 4, floe.width * 0.44, floe.height * 0.34, 0, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#eef7ff';
      for (const flake of this.snow) {
        const y = (flake.y + this.age * flake.speed) % LOGICAL_HEIGHT;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(flake.x, y, flake.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }
    if (this.tank === 'kelp' || this.tank === 'nautilus') {
      for (const mote of this.motes) {
        const y = (mote.y - this.age * mote.speed + LOGICAL_HEIGHT) % LOGICAL_HEIGHT;
        const flicker = 0.4 + 0.35 * Math.sin(this.age * 2 + mote.phase);
        ctx.globalAlpha = flicker;
        ctx.fillStyle = this.tank === 'kelp' ? COLORS.kelpLeaf : COLORS.bubble;
        ctx.beginPath();
        ctx.arc(mote.x, y, mote.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (this.tank === 'nautilus') {
        ctx.strokeStyle = COLORS.sandDark;
        ctx.lineWidth = 3;
        for (const shell of this.shells) {
          ctx.save();
          ctx.translate(shell.x, shell.y);
          ctx.rotate(shell.rotation);
          ctx.beginPath();
          ctx.arc(0, 0, shell.size, 0, Math.PI * 1.5);
          ctx.stroke();
          ctx.restore();
        }
      }
      return;
    }
    if (this.tank === 'jelly') {
      for (const spore of this.spores) {
        const y = (spore.y - this.age * spore.speed + LOGICAL_HEIGHT) % LOGICAL_HEIGHT;
        const flicker = 0.35 + 0.4 * Math.sin(this.age * 2.4 + spore.phase);
        ctx.globalAlpha = flicker;
        ctx.fillStyle = COLORS.bubble;
        ctx.beginPath();
        ctx.arc(spore.x, y, spore.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = COLORS.jelly;
      ctx.lineWidth = 4;
      for (const ghost of this.silhouettes) {
        const sway = Math.sin(this.age * 1.4 + ghost.phase) * 12;
        ctx.beginPath();
        ctx.arc(ghost.x + sway, ghost.y, ghost.size * 0.5, Math.PI, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ghost.x + sway - ghost.size * 0.4, ghost.y);
        ctx.quadraticCurveTo(ghost.x + sway - 6, ghost.y + ghost.size, ghost.x + sway - 10, ghost.y + ghost.size * 1.3);
        ctx.moveTo(ghost.x + sway, ghost.y + 2);
        ctx.quadraticCurveTo(ghost.x + sway, ghost.y + ghost.size, ghost.x + sway - 2, ghost.y + ghost.size * 1.4);
        ctx.moveTo(ghost.x + sway + ghost.size * 0.4, ghost.y);
        ctx.quadraticCurveTo(ghost.x + sway + 6, ghost.y + ghost.size, ghost.x + sway + 10, ghost.y + ghost.size * 1.3);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      return;
    }
    if (this.tank === 'freshwater') {
      for (const pad of this.pads) {
        const bob = Math.sin(this.age * 1.3 + pad.phase) * 3;
        ctx.fillStyle = COLORS.weed;
        ctx.beginPath();
        ctx.ellipse(pad.x, pad.y + bob, pad.radius, pad.radius * 0.42, 0, 0.35, TAU);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = COLORS.weedDark;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (pad.flower) {
          ctx.fillStyle = COLORS.accent;
          for (let i = 0; i < 5; i += 1) {
            const angle = (i / 5) * TAU;
            ctx.beginPath();
            ctx.arc(
              pad.x + Math.cos(angle) * 5,
              pad.y + bob + Math.sin(angle) * 3,
              3.4,
              0,
              TAU,
            );
            ctx.fill();
          }
        }
      }
    }
  }
}
