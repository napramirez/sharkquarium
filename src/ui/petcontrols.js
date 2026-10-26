import { drawText, fillRoundRect, strokeRoundRect, fillCircle } from '../engine/render.js';
import { COLORS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config.js';

export const SNACK_BUTTON = {
  x: LOGICAL_WIDTH - 272,
  y: LOGICAL_HEIGHT - 78,
  width: 126,
  height: 44,
};

export const LURE_BUTTON = {
  x: LOGICAL_WIDTH - 136,
  y: LOGICAL_HEIGHT - 78,
  width: 126,
  height: 44,
};

export const TOY_BUTTON = {
  x: LOGICAL_WIDTH - 276,
  y: LOGICAL_HEIGHT - 132,
  width: 84,
  height: 40,
};

export const PHOTO_BUTTON = {
  x: LOGICAL_WIDTH - 184,
  y: LOGICAL_HEIGHT - 132,
  width: 84,
  height: 40,
};

export const MEALS_BUTTON = {
  x: LOGICAL_WIDTH - 92,
  y: LOGICAL_HEIGHT - 132,
  width: 84,
  height: 40,
};

export const PET_DROP = {
  x: LOGICAL_WIDTH / 2,
  y: LOGICAL_HEIGHT / 2 + 10,
};

function inside(button, x, y) {
  return (
    x >= button.x &&
    x <= button.x + button.width &&
    y >= button.y &&
    y <= button.y + button.height
  );
}

export function hitSnackButton(x, y) {
  return inside(SNACK_BUTTON, x, y);
}

export function hitLureButton(x, y) {
  return inside(LURE_BUTTON, x, y);
}

export function hitToyButton(x, y) {
  return inside(TOY_BUTTON, x, y);
}

export function hitPhotoButton(x, y) {
  return inside(PHOTO_BUTTON, x, y);
}

export function hitMealsButton(x, y) {
  return inside(MEALS_BUTTON, x, y);
}

function renderButton(ctx, button, label, color, ready, time, size = 14) {
  const alpha = ready ? 1 : 0.45;
  ctx.save();
  ctx.globalAlpha = alpha;
  fillRoundRect(
    ctx,
    button.x,
    button.y,
    button.width,
    button.height,
    12,
    'rgba(10, 39, 64, 0.7)',
  );
  strokeRoundRect(
    ctx,
    button.x,
    button.y,
    button.width,
    button.height,
    12,
    ready ? 'rgba(207, 239, 255, 0.45)' : 'rgba(207, 239, 255, 0.25)',
    1.5,
  );
  const pulse = ready ? 0.75 + 0.25 * Math.sin(time * 5) : 1;
  fillCircle(ctx, button.x + 20, button.y + button.height / 2, 6 * pulse, color);
  drawText(ctx, label, button.x + 20 + (button.width - 30) / 2, button.y + button.height / 2 + 1, {
    size,
    weight: 700,
    color: COLORS.text,
    alpha: 0.95,
  });
  ctx.restore();
}

export function drawPetButtons(ctx, { lureReady, time, coins = 0, mealsCost = 0 }) {
  renderButton(ctx, SNACK_BUTTON, 'SNACK', COLORS.accent, true, time);
  renderButton(ctx, LURE_BUTTON, 'LURE', COLORS.danger, lureReady, time);
  renderButton(ctx, TOY_BUTTON, 'TOY', COLORS.foam, true, time, 12);
  renderButton(ctx, PHOTO_BUTTON, 'PHOTO', COLORS.bubble, true, time, 12);
  renderButton(
    ctx,
    MEALS_BUTTON,
    `MEALS ${mealsCost}`,
    COLORS.accent,
    coins >= mealsCost,
    time,
    11,
  );
}
