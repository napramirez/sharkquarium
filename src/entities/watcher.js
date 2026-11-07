import { Entity } from './entity.js';
import { rand, TAU } from '../engine/math.js';
import { COLORS, WATCHER } from '../config.js';

export class Watcher extends Entity {
  constructor(x, y) {
    super({ x, y, radius: WATCHER.radius });
    this.santa = true;
    this.speed = WATCHER.stalk[0];
    this.frozen = false;
    this.eyeOpen = 1;
    this.phase = rand(0, TAU);
    this.catchGlow = 0;
    this.lookAngle = 0;
    this.blinkSeed = rand(0, 10);
  }

  update(dt) {
    super.update(dt);
    this.eyeOpen += ((this.frozen ? 0.14 : 1) - this.eyeOpen) * Math.min(1, dt * 8);
    this.catchGlow = Math.max(0, this.catchGlow - dt);
  }

  render(ctx) {
    const r = this.radius;
    const flail = this.frozen ? 0.16 : 1;
    const jaw = this.frozen ? 0.12 : 0.34 + Math.sin(this.age * 1.7 + this.phase) * 0.08;
    const lx = Math.cos(this.lookAngle);
    const ly = Math.sin(this.lookAngle);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.lineCap = 'round';

    if (this.catchGlow > 0) {
      const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.6);
      glow.addColorStop(0, `rgba(120, 0, 20, ${0.35 * this.catchGlow})`);
      glow.addColorStop(1, 'rgba(120, 0, 20, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.6, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < 10; i += 1) {
      const base = this.phase + (i / 10) * TAU;
      const wig = Math.sin(this.age * (1.5 + flail) + i * 1.7) * (0.35 + flail * 0.85);
      const len = r * (1.7 + flail * 1.0 + Math.sin(i * 2.3) * 0.3);
      const joints = [];
      for (let k = 0; k <= 6; k += 1) {
        const t = k / 6;
        const ang = base + wig * t * 1.5;
        const rad = r * 0.55 + t * len;
        joints.push({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad });
      }
      ctx.strokeStyle = COLORS.alienDark;
      ctx.lineWidth = 8 - i * 0.35;
      ctx.beginPath();
      ctx.moveTo(joints[0].x, joints[0].y);
      for (let k = 1; k < joints.length; k += 1) ctx.lineTo(joints[k].x, joints[k].y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(8, 8, 12, 0.85)';
      ctx.lineWidth = 2;
      for (const k of [2, 4]) {
        const p = joints[k];
        const p2 = joints[k + 1];
        const ang = Math.atan2(p2.y - p.y, p2.x - p.x) + Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(ang) * r * 0.34, p.y + Math.sin(ang) * r * 0.34);
        ctx.stroke();
      }
    }

    ctx.fillStyle = this.frozen ? '#3a4048' : '#26282e';
    ctx.beginPath();
    for (let a = 0; a <= 40; a += 1) {
      const angle = (a / 40) * TAU;
      const rad =
        r * (0.94 + 0.12 * Math.sin(angle * 3 + this.phase) + 0.07 * Math.sin(angle * 5 - this.age * 0.8));
      const px = Math.cos(angle) * rad;
      const py = Math.sin(angle) * rad;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    const body = ctx.createRadialGradient(-r * 0.32, -r * 0.36, r * 0.2, 0, 0, r * 1.2);
    body.addColorStop(0, COLORS.alienFlesh);
    body.addColorStop(0.6, COLORS.alien);
    body.addColorStop(1, 'rgba(11, 11, 15, 0.96)');
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 6, 9, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(70, 12, 20, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      const a = this.phase + i * 1.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
      ctx.quadraticCurveTo(
        Math.cos(a + 0.6) * r * 0.8,
        Math.sin(a + 0.6) * r * 0.8,
        Math.cos(a + 0.2) * r * 1.0,
        Math.sin(a + 0.2) * r * 1.0,
      );
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(0, r * 0.62);
    ctx.fillStyle = '#060509';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.7, r * 0.2 + jaw * r * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ddd6c4';
    const teeth = 11;
    for (let i = 0; i < teeth; i += 1) {
      const x = -r * 0.62 + (i / (teeth - 1)) * r * 1.24;
      const len = r * (0.16 + Math.sin(i * 1.9) * 0.05);
      ctx.beginPath();
      ctx.moveTo(x - r * 0.05, -r * 0.06 - jaw * r * 0.4);
      ctx.lineTo(x + r * 0.05, -r * 0.06 - jaw * r * 0.4);
      ctx.lineTo(x + r * 0.02, -r * 0.06 - jaw * r * 0.4 + len);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - r * 0.05, r * 0.1 + jaw * r * 0.4);
      ctx.lineTo(x + r * 0.05, r * 0.1 + jaw * r * 0.4);
      ctx.lineTo(x + r * 0.02, r * 0.1 + jaw * r * 0.4 - len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    const ey = -r * 0.14;
    const erx = r * 0.72;
    const ery = r * 0.5 * Math.max(0.15, this.eyeOpen);
    if (!this.frozen) {
      const eyeGlow = ctx.createRadialGradient(0, ey, r * 0.1, 0, ey, r * 1.25);
      eyeGlow.addColorStop(0, 'rgba(190, 210, 120, 0.3)');
      eyeGlow.addColorStop(1, 'rgba(190, 210, 120, 0)');
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(0, ey, r * 1.25, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = this.frozen ? '#aeb8c4' : '#eef4ea';
    ctx.beginPath();
    ctx.ellipse(0, ey, erx, ery, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, ey, erx, ery, 0, 0, TAU);
    ctx.clip();
    ctx.strokeStyle = 'rgba(150, 20, 30, 0.5)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 7; i += 1) {
      const a = this.phase + i * 0.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * erx, ey + Math.sin(a) * ery);
      ctx.quadraticCurveTo(Math.cos(a + 0.4) * erx * 0.4, ey + Math.sin(a + 0.4) * ery * 0.4, 0, ey);
      ctx.stroke();
    }
    ctx.restore();
    const ix = lx * erx * 0.34;
    const iy = ey + ly * ery * 0.34;
    const irisR = r * 0.33;
    ctx.fillStyle = this.frozen ? 'rgba(96, 116, 138, 0.95)' : 'rgba(122, 150, 58, 0.96)';
    ctx.beginPath();
    ctx.arc(ix, iy, irisR, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 24, 10, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const pupilW = (this.frozen ? 0.1 : 0.3) * irisR;
    ctx.fillStyle = '#04050a';
    ctx.beginPath();
    ctx.ellipse(ix, iy, pupilW, irisR * 0.95, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(ix - irisR * 0.35, iy - irisR * 0.4, irisR * 0.2, 0, TAU);
    ctx.fill();
    if (this.frozen) {
      ctx.fillStyle = 'rgba(190, 208, 222, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, ey, erx, ery, 0, 0, TAU);
      ctx.fill();
    }

    const peripheral = 6;
    for (let i = 0; i < peripheral; i += 1) {
      const a = this.phase + (i / peripheral) * TAU + 0.4;
      const px = Math.cos(a) * r * 0.78;
      const py = Math.sin(a) * r * 0.66 - r * 0.05;
      const er = r * (0.13 + (i % 2) * 0.03);
      const blink = Math.sin(this.age * 2.4 + this.blinkSeed + i * 2.1);
      const lid = this.frozen ? 1 : blink > 0.86 ? 0.1 : 1;
      ctx.fillStyle = '#dfe6df';
      ctx.beginPath();
      ctx.ellipse(px, py, er, er * lid, 0, 0, TAU);
      ctx.fill();
      if (lid > 0.4) {
        const dx = px + lx * er * 0.35;
        const dy = py + ly * er * 0.35;
        ctx.fillStyle = this.frozen ? '#5a6a7a' : '#3c4a1e';
        ctx.beginPath();
        ctx.arc(dx, dy, er * 0.55, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#05060a';
        ctx.beginPath();
        ctx.arc(dx, dy, er * 0.26, 0, TAU);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#7a5a5a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px - er, py);
        ctx.lineTo(px + er, py);
        ctx.stroke();
      }
    }

    if (this.frozen) {
      ctx.fillStyle = 'rgba(150, 170, 185, 0.14)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.05, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
