import { Tentacle } from './tentacle.js';
import { rand, TAU } from '../engine/math.js';
import { LOGICAL_HEIGHT, SAND, COLORS, AQUARIUM, LABYRINTH } from '../config.js';

export class LabBurster {
  constructor(kind, x) {
    const cfg = AQUARIUM.labyrinth;
    this.kind = kind;
    this.x = x;
    const floor = kind === 'LAB:CRACK';
    this.y = floor ? LOGICAL_HEIGHT - SAND.height + 16 : 30;
    this.angle = floor ? -Math.PI / 2 : Math.PI / 2;
    this.state = 'idle';
    this.timer = rand(0.6, 2.4);
    this.warn = cfg.bursterWarn;
    this.cooldown = cfg.bursterCooldown;
    this.triggerX = cfg.bursterTriggerX;
    this.triggerY = floor ? cfg.bursterTriggerY : null;
    const count = floor ? cfg.bursterArms : 1;
    this.arms = Array.from({ length: count }, (_, index) => {
      const spread = count > 1 ? index / (count - 1) - 0.5 : 0;
      return new Tentacle(this.y, index * 10 + 5, {
        burst: true,
        angle: this.angle + spread * 0.7,
        anchorOffset: floor ? spread * 44 : 0,
        lengthScale: floor
          ? cfg.bursterLengthScale * rand(0.8, 1.1)
          : cfg.bursterBeamLengthScale * rand(0.95, 1.05),
        widthScale: 0.85 * rand(0.85, 1.05),
        club: !floor,
        rope: !floor,
        lance: floor ? undefined : LABYRINTH.ceilingBurstLance,
      });
    });
    this.phase = rand(0, TAU);
  }

  render(ctx) {
    ctx.save();
    const alerted = this.state !== 'idle';
    const pulse = alerted ? 0.5 + 0.5 * Math.sin(this.phase + this.arms[0].age * 6) : 0;
    if (this.kind === 'LAB:CRACK') {
      const baseY = this.y - 4;
      ctx.fillStyle = 'rgba(24, 16, 12, 0.85)';
      ctx.beginPath();
      ctx.ellipse(this.x, baseY, 42, 12, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = alerted
        ? `rgba(220, 96, 118, ${0.5 + pulse * 0.4})`
        : 'rgba(10, 7, 6, 0.9)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 6; i += 1) {
        const angle = -Math.PI + (i / 5) * Math.PI + Math.sin(this.phase + i) * 0.2;
        const length = 26 + ((i * 37) % 34);
        ctx.beginPath();
        ctx.moveTo(this.x, baseY);
        ctx.lineTo(
          this.x + Math.cos(angle) * length * 0.6,
          baseY + Math.sin(angle) * length * 0.6,
        );
        ctx.lineTo(this.x + Math.cos(angle + 0.3) * length, baseY + Math.sin(angle + 0.3) * length);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = alerted
        ? `rgba(220, 96, 118, ${0.5 + pulse * 0.4})`
        : 'rgba(12, 8, 6, 0.9)';
      ctx.lineWidth = alerted ? 3 : 2.5;
      for (let i = 0; i < 3; i += 1) {
        const offset = (i - 1) * 30;
        ctx.beginPath();
        ctx.moveTo(this.x + offset, 8);
        ctx.lineTo(this.x + offset + Math.sin(this.phase + i * 2.1) * 7, 32 + i * 6);
        ctx.lineTo(this.x + offset + 10, 50 + i * 8);
        ctx.stroke();
      }
    }
    for (const arm of this.arms) {
      if (arm.reach > 0.03) arm.render(ctx);
    }
    if (this.state === 'burst') {
      const arm = this.arms[0];
      const progress = arm ? arm.burstAge / 0.34 : 1;
      if (progress < 1) {
        const alpha = 1 - progress;
        const spread = progress;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = COLORS.wreckWood;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let i = 0; i < 7; i += 1) {
          const ray = -1.5 + (i / 6) * 3;
          const length = 18 + spread * 40;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ray) * 8, Math.sin(ray) * 8);
          ctx.lineTo(Math.cos(ray) * length, Math.sin(ray) * length);
          ctx.stroke();
        }
        ctx.strokeStyle = `rgba(210, 190, 160, ${0.6 * alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 12 + spread * 46, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }
}
