import { Entity } from './entity.js';
import { TAU } from '../engine/math.js';
import { COLORS, CORAL_PALETTE, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export class ReefGarden extends Entity {
  constructor() {
    super({ x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT / 2, radius: 0 });
    this.plants = Array.from({ length: 14 }, (_, index) => ({
      x: (index * 137) % (LOGICAL_WIDTH - 80) + 40,
      h: 40 + ((index * 53) % 70),
      color: CORAL_PALETTE[index % CORAL_PALETTE.length],
      phase: (index * 0.7) % TAU,
    }));
    this.rocks = Array.from({ length: 5 }, (_, index) => ({
      x: (index * 211) % (LOGICAL_WIDTH - 120) + 60,
      r: 30 + (index % 3) * 14,
    }));
  }

  render(ctx) {
    const floor = LOGICAL_HEIGHT - 8;
    ctx.save();
    for (const rock of this.rocks) {
      ctx.fillStyle = COLORS.rock;
      ctx.beginPath();
      ctx.moveTo(rock.x - rock.r, floor);
      ctx.quadraticCurveTo(rock.x - rock.r * 0.4, floor - rock.r, rock.x, floor - rock.r * 0.9);
      ctx.quadraticCurveTo(rock.x + rock.r * 0.5, floor - rock.r * 0.7, rock.x + rock.r, floor);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COLORS.rockDark;
      ctx.beginPath();
      ctx.ellipse(rock.x, floor, rock.r, rock.r * 0.22, 0, 0, TAU);
      ctx.fill();
    }
    for (const plant of this.plants) {
      const sway = Math.sin(this.age * 1.2 + plant.phase) * 6;
      ctx.strokeStyle = plant.color;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(plant.x, floor);
      ctx.quadraticCurveTo(plant.x + sway, floor - plant.h * 0.6, plant.x + sway * 1.6, floor - plant.h);
      ctx.stroke();
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(plant.x + sway * 0.4, floor - plant.h * 0.4);
        ctx.quadraticCurveTo(plant.x + side * 18 + sway, floor - plant.h * 0.7, plant.x + side * 26 + sway, floor - plant.h * 0.95);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
