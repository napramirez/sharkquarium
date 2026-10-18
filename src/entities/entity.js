export class Entity {
  constructor(options = {}) {
    const { x = 0, y = 0, radius = 16 } = options;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.age = 0;
    this.alive = true;
  }

  update(dt) {
    this.age += dt;
  }

  render(_ctx) {}

  kill() {
    this.alive = false;
  }
}
