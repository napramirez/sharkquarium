import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';
import { TAU } from './math.js';
import { fillCircle, strokeCircle } from './render.js';

export const JOYSTICK = {
  x: LOGICAL_WIDTH - 96,
  y: LOGICAL_HEIGHT - 96,
  baseRadius: 58,
  knobRadius: 25,
  grabRadius: 76,
};

export function hitJoystick(x, y) {
  return Math.hypot(x - JOYSTICK.x, y - JOYSTICK.y) <= JOYSTICK.grabRadius;
}

export function joystickState(input) {
  const pointer = input.pointer;
  if (!pointer.down || !hitJoystick(pointer.originX, pointer.originY)) {
    return { active: false, knobX: JOYSTICK.x, knobY: JOYSTICK.y };
  }
  const drag = Math.hypot(pointer.dragX, pointer.dragY);
  const scale = drag > JOYSTICK.baseRadius ? JOYSTICK.baseRadius / drag : 1;
  return {
    active: true,
    knobX: JOYSTICK.x + pointer.dragX * scale,
    knobY: JOYSTICK.y + pointer.dragY * scale,
  };
}

export function drawJoystick(ctx, state) {
  fillCircle(ctx, JOYSTICK.x, JOYSTICK.y, JOYSTICK.baseRadius, 'rgba(10, 39, 64, 0.42)');
  strokeCircle(
    ctx,
    JOYSTICK.x,
    JOYSTICK.y,
    JOYSTICK.baseRadius,
    state.active ? 'rgba(207, 239, 255, 0.65)' : 'rgba(207, 239, 255, 0.3)',
    2,
  );
  ctx.strokeStyle = 'rgba(207, 239, 255, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const angle = (i * TAU) / 4;
    ctx.beginPath();
    ctx.moveTo(
      JOYSTICK.x + Math.cos(angle) * JOYSTICK.baseRadius * 0.66,
      JOYSTICK.y + Math.sin(angle) * JOYSTICK.baseRadius * 0.66,
    );
    ctx.lineTo(
      JOYSTICK.x + Math.cos(angle) * JOYSTICK.baseRadius * 0.84,
      JOYSTICK.y + Math.sin(angle) * JOYSTICK.baseRadius * 0.84,
    );
    ctx.stroke();
  }
  fillCircle(
    ctx,
    state.knobX,
    state.knobY,
    JOYSTICK.knobRadius,
    state.active ? 'rgba(207, 239, 255, 0.4)' : 'rgba(207, 239, 255, 0.22)',
  );
  strokeCircle(
    ctx,
    state.knobX,
    state.knobY,
    JOYSTICK.knobRadius,
    state.active ? COLORS.bubble : 'rgba(207, 239, 255, 0.45)',
    1.5,
  );
}
