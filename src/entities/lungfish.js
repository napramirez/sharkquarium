import { Shark } from './shark.js';
import { TAU } from '../engine/math.js';
import { PLAYER } from '../config.js';
import { playerColor } from '../engine/skin.js';
import { drawAccessory } from '../engine/accessory.js';

export class Lungfish extends Shark {
  constructor(x, y, options = {}) {
    super(x, y, options);
    this.walk = 0;
    this.onGround = false;
  }

  render(ctx) {
    const r = this.radius;
    const body = playerColor('body', '#6d6a45');
    const accent = playerColor('accent', '#8a8557');
    const belly = playerColor('belly', '#d8d0a4');
    const finPhase = this.onGround ? this.walk * 12 : this.age * 5;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    ctx.fillStyle = 'rgba(16, 22, 12, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, r * 1.0, r * 2.2, r * 0.36, 0, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-r * 1.2, -r * 0.3);
    ctx.quadraticCurveTo(-r * 2.1, -r * 0.7, -r * 3.35, Math.sin(this.age * 3.5) * r * 0.5 - r * 0.1);
    ctx.quadraticCurveTo(-r * 2.1, r * 0.6, -r * 1.2, r * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(40, 42, 24, 0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i += 1) {
      const t = i / 5;
      ctx.beginPath();
      ctx.moveTo(-r * 1.2, 0);
      ctx.lineTo(-r * 2.1 - t * r * 1.2, (t - 0.5) * r * 0.7);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = body;
    ctx.strokeStyle = 'rgba(40, 42, 24, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.72);
    ctx.quadraticCurveTo(-r * 0.9, -r * 1.55, -r * 1.45, -r * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, -r * 1.05, 0, r * 1.05);
    grad.addColorStop(0, '#3d3c22');
    grad.addColorStop(0.32, body);
    grad.addColorStop(0.62, accent);
    grad.addColorStop(0.86, belly);
    grad.addColorStop(1, '#efe8c4');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(r * 2.05, r * 0.02);
    ctx.quadraticCurveTo(r * 2.2, -r * 0.5, r * 1.15, -r * 0.78);
    ctx.quadraticCurveTo(r * 0.1, -r * 1.02, -r * 0.9, -r * 0.72);
    ctx.quadraticCurveTo(-r * 1.6, -r * 0.5, -r * 1.5, 0);
    ctx.quadraticCurveTo(-r * 1.6, r * 0.5, -r * 0.9, r * 0.74);
    ctx.quadraticCurveTo(r * 0.1, r * 1.0, r * 1.15, r * 0.78);
    ctx.quadraticCurveTo(r * 2.2, r * 0.5, r * 2.05, r * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 28, 16, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#f2f4dc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 1.3, -r * 0.72);
    ctx.quadraticCurveTo(r * 0.2, -r * 0.98, -r * 0.95, -r * 0.66);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < 26; i += 1) {
      const px = -r * 1.0 + (i % 7) * r * 0.46;
      const py = (i % 2 === 0 ? -1 : 1) * (r * 0.28 + (i % 4) * r * 0.14);
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#2c2e18';
      ctx.beginPath();
      ctx.ellipse(px, py, r * 0.11, r * 0.07, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#e8eec4';
      ctx.beginPath();
      ctx.ellipse(px + r * 0.05, py - r * 0.04, r * 0.05, r * 0.03, 0, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(70, 72, 46, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(r * 0.3, -r * 0.05);
    ctx.quadraticCurveTo(-r * 0.5, 0, -r * 1.0, r * 0.05);
    ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
      const px = r * 0.25 - i * r * 0.22;
      ctx.beginPath();
      ctx.arc(px, 0, 1.4, 0, TAU);
      ctx.stroke();
    }

    const swing = Math.sin(finPhase) * r * 0.6;
    const legs = [
      [r * 0.75, r * 0.6, 1],
      [r * 0.75, -r * 0.6, 1],
      [-r * 0.15, r * 0.66, -1],
      [-r * 0.15, -r * 0.66, -1],
    ];
    for (const [bx, by, dir] of legs) {
      const sgn = Math.sign(by);
      const kneeX = bx + dir * r * 0.5;
      const kneeY = by + sgn * r * 0.55;
      const footX = bx + dir * r * 0.85;
      const footY = by + sgn * r * 0.75 + swing * sgn;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(footX, footY);
      ctx.lineTo(bx + dir * r * 0.2, footY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(40, 42, 24, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(footX, footY);
      ctx.stroke();
      ctx.strokeStyle = accent;
      ctx.lineWidth = r * 0.32;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(kneeX, kneeY, footX, footY);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 240, 0.2)';
      ctx.lineWidth = r * 0.08;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(kneeX, kneeY - r * 0.06, footX, footY - r * 0.06);
      ctx.stroke();
      ctx.fillStyle = body;
      ctx.strokeStyle = 'rgba(34, 32, 18, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(footX, footY, r * 0.34, r * 0.2, Math.atan2(footY - kneeY, footX - kneeX), 0, TAU);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = '#3a3c24';
    ctx.beginPath();
    ctx.ellipse(r * 1.35, -r * 0.02, r * 0.62, r * 0.44, 0.05, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 30, 16, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20, 20, 12, 0.5)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(r * 1.95, r * 0.12);
    ctx.quadraticCurveTo(r * 1.5, r * 0.2, r * 0.95, r * 0.1);
    ctx.stroke();
    ctx.fillStyle = '#10120a';
    ctx.beginPath();
    ctx.arc(r * 1.68, r * 0.04, r * 0.05, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 3; i += 1) {
      ctx.strokeStyle = 'rgba(24, 24, 14, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(r * (0.62 + i * 0.16), -r * 0.06, r * 0.3, -0.9, 0.5);
      ctx.stroke();
    }
    const eye = ctx.createRadialGradient(r * 1.5, -r * 0.32, r * 0.02, r * 1.55, -r * 0.24, r * 0.18);
    eye.addColorStop(0, '#f6f4dc');
    eye.addColorStop(0.6, '#cdbb7a');
    eye.addColorStop(1, '#5a512c');
    ctx.fillStyle = eye;
    ctx.beginPath();
    ctx.arc(r * 1.55, -r * 0.24, r * 0.17, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0c0e08';
    ctx.beginPath();
    ctx.arc(r * 1.58, -r * 0.24, r * 0.09, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(r * 1.62, -r * 0.3, r * 0.035, 0, TAU);
    ctx.fill();

    drawAccessory(ctx, r, this.age, { entity: this, heading: this.heading });
    ctx.restore();
  }
}

export const LUNGFISH_RADIUS = PLAYER.radius;
