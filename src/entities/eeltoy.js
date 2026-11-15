import { Entity } from './entity.js';
import { clamp, rand, TAU } from '../engine/math.js';
import { PLAYTOY_EEL } from '../config.js';

export class EelToy extends Entity {
  constructor(x, y, options = {}) {
    super({ x, y, radius: options.radius ?? 76 });
    this.santa = true;
    this.flat3D = true;
    this.phase = rand(0, TAU);
    this.heading = 0;
    this.state = 'chase';
    this.stunTimer = 0;
    this.staggerTimer = 0;
    this.lungeTimer = 0;
    this.lungeEvery = options.lungeEvery ?? 2.6;
    this.lungeCooldown = this.lungeEvery;
    this.lungeTime = options.lungeTime ?? 0.7;
    this.lungeSpeed = options.lungeSpeed ?? 300;
    this.sweepTimer = 0;
    this.sweepEvery = options.sweepEvery ?? 3.4;
    this.sweepCooldown = this.sweepEvery;
    this.sweepTime = 0.9;
    this.baseSpeed = options.speed ?? 150;
    this.stunTime = options.stunTime ?? 2.6;
    this.staggerTime = options.staggerTime ?? 2.0;
  }

  get lunging() {
    return this.lungeTimer > 0;
  }

  get sweeping() {
    return this.sweepTimer > 0;
  }

  stun(time = this.stunTime) {
    this.state = 'stunned';
    this.stunTimer = time;
    this.lungeTimer = 0;
    this.sweepTimer = 0;
  }

  stagger(time = this.staggerTime) {
    this.state = 'stagger';
    this.staggerTimer = time;
    this.lungeTimer = 0;
  }

  update(dt, player, speedScale = 1) {
    super.update(dt);
    this.phase += dt;
    this.lungeTimer = Math.max(0, this.lungeTimer - dt);
    this.sweepTimer = Math.max(0, this.sweepTimer - dt);
    if (this.state === 'stunned') {
      this.stunTimer -= dt;
      this.x -= 26 * dt;
      if (this.stunTimer <= 0) this.state = 'chase';
      return;
    }
    if (this.state === 'stagger') {
      this.staggerTimer -= dt;
      this.x -= 60 * dt;
      if (this.staggerTimer <= 0) this.state = 'chase';
      return;
    }
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    this.heading = Math.atan2(dy, dx);
    this.lungeCooldown -= dt;
    this.sweepCooldown -= dt;
    if (this.lungeTimer <= 0 && this.lungeCooldown <= 0) {
      this.lungeTimer = this.lungeTime;
      this.lungeCooldown = this.lungeEvery;
    }
    if (this.sweepTimer <= 0 && this.sweepCooldown <= 0) {
      this.sweepTimer = this.sweepTime;
      this.sweepCooldown = this.sweepEvery;
    }
    const speed = (this.lunging ? this.lungeSpeed : this.baseSpeed) * speedScale;
    this.x += (dx / d) * speed * dt;
    this.y += (dy / d) * speed * dt * 0.55;
    this.y = clamp(this.y, this.radius, 540 - this.radius);
    if (Math.abs(dx) > 8) this.facing = dx > 0 ? 1 : -1;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);
    drawEelToy(ctx, this);
    if (this.state === 'stunned') this.drawStun(ctx);
    ctx.restore();
  }

  drawStun(ctx) {
    ctx.save();
    const r = this.radius;
    for (let i = 0; i < 3; i += 1) {
      const a = this.phase * 3 + (i / 3) * TAU;
      const sx = Math.cos(a) * r * 0.5;
      const sy = -r * 1.4 + Math.sin(a) * r * 0.16;
      ctx.fillStyle = '#ffe27a';
      drawStar(ctx, sx, sy, r * 0.1);
    }
    ctx.restore();
  }
}

function drawStar(ctx, x, y, size) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i / 10) * TAU;
    const rad = i % 2 === 0 ? size : size * 0.46;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawEelToy(ctx, pose, scale = 1) {
  const r = (pose.radius ?? 76) * scale;
  const age = pose.age ?? 0;
  const amp = pose.sweeping ? 1.7 : 1;
  const lunge = pose.lunging ? 1 : 0;
  const P = PLAYTOY_EEL;

  const spine = [];
  const segs = 14;
  for (let i = 0; i <= segs; i += 1) {
    const t = i / segs;
    const x = r * (0.55 + lunge * 0.35) - t * r * 3.2;
    const y = Math.sin(age * 3.6 + t * 4.4) * r * 0.5 * t * amp;
    spine.push({ x, y, t });
  }

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = P.seam;
  ctx.lineWidth = r * 0.66;
  ctx.beginPath();
  spine.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();

  ctx.strokeStyle = P.body;
  ctx.lineWidth = r * 0.54;
  ctx.beginPath();
  spine.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();

  ctx.strokeStyle = P.belly;
  ctx.lineWidth = r * 0.2;
  ctx.beginPath();
  spine.forEach((p, i) => {
    const y = p.y + r * 0.16;
    if (i) ctx.lineTo(p.x, y);
    else ctx.moveTo(p.x, y);
  });
  ctx.stroke();

  ctx.strokeStyle = 'rgba(24, 44, 38, 0.5)';
  ctx.lineWidth = r * 0.03;
  for (let i = 1; i < spine.length - 1; i += 2) {
    const p = spine[i];
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - r * 0.22);
    ctx.lineTo(p.x, p.y + r * 0.22);
    ctx.stroke();
  }

  ctx.fillStyle = P.spot;
  for (let i = 1; i < spine.length; i += 3) {
    const p = spine[i];
    const s = 1 - p.t * 0.5;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - r * 0.1, r * 0.09 * s, r * 0.07 * s, 0, 0, TAU);
    ctx.fill();
  }

  const tail = spine[spine.length - 1];
  ctx.fillStyle = P.body;
  ctx.beginPath();
  ctx.moveTo(tail.x + r * 0.12, tail.y - r * 0.22);
  ctx.quadraticCurveTo(tail.x - r * 0.8, tail.y, tail.x + r * 0.12, tail.y + r * 0.22);
  ctx.closePath();
  ctx.fill();

  const head = spine[0];
  const nxt = spine[1];
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate((Math.atan2(nxt.y - head.y, nxt.x - head.x) + Math.PI) * 0.4);
  const hr = r * 0.5;
  ctx.fillStyle = P.body;
  ctx.beginPath();
  ctx.moveTo(-hr * 0.25, -hr * 0.82);
  ctx.quadraticCurveTo(hr * 1.55, -hr * 0.72, hr * 1.6, 0);
  ctx.quadraticCurveTo(hr * 1.55, hr * 0.72, -hr * 0.25, hr * 0.82);
  ctx.quadraticCurveTo(-hr * 0.65, 0, -hr * 0.25, -hr * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = P.seam;
  ctx.lineWidth = r * 0.03;
  ctx.stroke();
  drawEelFace(ctx, hr * 0.5, 0, hr * 0.78, P, age);
  ctx.restore();

  ctx.restore();
}

function drawEelFace(ctx, cx, cy, rr, P, age) {
  const eyes = [
    [cx - rr * 0.12, cy - rr * 0.4],
    [cx - rr * 0.3, cy + rr * 0.4],
  ];
  for (const [ex, ey] of eyes) {
    ctx.fillStyle = P.body;
    ctx.beginPath();
    ctx.arc(ex, ey, rr * 0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = P.socket;
    ctx.beginPath();
    ctx.arc(ex, ey, rr * 0.19, 0, TAU);
    ctx.fill();
    for (let k = 0; k < 7; k += 1) {
      const a = (k / 7) * TAU;
      ctx.beginPath();
      ctx.arc(ex + Math.cos(a) * rr * 0.21, ey + Math.sin(a) * rr * 0.21, rr * 0.055, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#e8e2d0';
    ctx.beginPath();
    ctx.arc(ex + rr * 0.06, ey + rr * 0.06, rr * 0.05, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = P.thread;
    ctx.lineWidth = rr * 0.035;
    ctx.beginPath();
    ctx.moveTo(ex, ey + rr * 0.17);
    ctx.quadraticCurveTo(ex + rr * 0.12, ey + rr * 0.5, ex - rr * 0.02, ey + rr * 0.82);
    ctx.stroke();
  }

  const bx = cx - rr * 0.12;
  const by = cy - rr * 0.4 + rr * 1.15;
  ctx.strokeStyle = P.thread;
  ctx.lineWidth = rr * 0.03;
  ctx.beginPath();
  ctx.moveTo(bx, by - rr * 0.55);
  ctx.lineTo(bx - rr * 0.05, by);
  ctx.stroke();
  ctx.fillStyle = P.button;
  ctx.beginPath();
  ctx.arc(bx - rr * 0.05, by, rr * 0.15, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = P.seam;
  ctx.lineWidth = rr * 0.03;
  ctx.stroke();
  ctx.fillStyle = P.socket;
  for (const dx of [-0.05, 0.05]) {
    ctx.beginPath();
    ctx.arc(bx - rr * 0.05 + rr * dx, by, rr * 0.03, 0, TAU);
    ctx.fill();
  }

  const mx = cx + rr * 0.34;
  const my = cy + rr * 0.02;
  const halfW = rr * 0.72;
  const open = 0.5 + 0.5 * Math.sin(age * 3);
  const gap = rr * (0.22 + open * 0.14);
  ctx.fillStyle = P.mouth;
  ctx.beginPath();
  ctx.moveTo(mx - halfW, my - gap);
  ctx.quadraticCurveTo(mx + halfW * 0.4, my - gap * 1.5, mx + halfW, my - gap * 0.5);
  ctx.lineTo(mx + halfW, my + gap * 0.5);
  ctx.quadraticCurveTo(mx + halfW * 0.4, my + gap * 1.5, mx - halfW, my + gap);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = P.gum;
  ctx.beginPath();
  ctx.ellipse(mx, my - gap * 0.5, halfW * 0.92, gap * 0.32, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(mx, my + gap * 0.5, halfW * 0.92, gap * 0.32, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = P.tooth;
  const teeth = 6;
  for (let i = 0; i < teeth; i += 1) {
    const tx = mx - halfW + (i + 0.5) * ((halfW * 2) / teeth);
    const w = ((halfW * 2) / teeth) * 0.5;
    ctx.beginPath();
    ctx.moveTo(tx - w, my - gap * 0.36);
    ctx.lineTo(tx + w, my - gap * 0.36);
    ctx.lineTo(tx, my + gap * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx - w, my + gap * 0.36);
    ctx.lineTo(tx + w, my + gap * 0.36);
    ctx.lineTo(tx, my - gap * 0.28);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = P.gum;
  ctx.lineWidth = rr * 0.05;
  ctx.beginPath();
  ctx.moveTo(mx - halfW, my - gap);
  ctx.lineTo(mx + halfW * 0.9, my - gap * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mx - halfW, my + gap);
  ctx.lineTo(mx + halfW * 0.9, my + gap * 0.5);
  ctx.stroke();
}
