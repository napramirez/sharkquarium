import { rand, TAU } from './math.js';

export class ParticleSystem {
  constructor() {
    this.items = [];
  }

  get count() {
    return this.items.length;
  }

  burst(x, y, options = {}) {
    const {
      count = 12,
      speed = 140,
      life = 0.6,
      size = 3.5,
      colors = ['#ffffff'],
      buoyancy = 0,
      drag = 2.2,
    } = options;
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const velocity = speed * rand(0.35, 1);
      this.items.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        age: 0,
        life: life * rand(0.6, 1.2),
        size: size * rand(0.6, 1.3),
        color: colors[Math.floor(Math.random() * colors.length)],
        buoyancy,
        drag,
      });
    }
  }

  update(dt) {
    for (const particle of this.items) {
      particle.age += dt;
      const damping = Math.exp(-particle.drag * dt);
      particle.vx *= damping;
      particle.vy *= damping;
      particle.vy += particle.buoyancy * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }
    this.items = this.items.filter((particle) => particle.age < particle.life);
  }

  render(ctx) {
    for (const particle of this.items) {
      const fade = 1 - particle.age / particle.life;
      ctx.globalAlpha = fade;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * fade, 0, TAU);
      ctx.fillStyle = particle.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
