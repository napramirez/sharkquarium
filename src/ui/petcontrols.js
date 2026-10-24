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

export const PET_DROP = {
  x: LOGICAL_WIDTH / 2,
  y: LOGICAL_HEIGHT / 2 + 10,
};

export function hitSnackButton(x, y) {
  return (
    x >= SNACK_BUTTON.x &&
    x <= SNACK_BUTTON.x + SNACK_BUTTON.width &&
    y >= SNACK_BUTTON.y &&
    y <= SNACK_BUTTON.y + SNACK_BUTTON.height
  );
}

export function hitLureButton(x, y) {
  return (
    x >= LURE_BUTTON.x &&
    x <= LURE_BUTTON.x + LURE_BUTTON.width &&
    y >= LURE_BUTTON.y &&
    y <= LURE_BUTTON.y + LURE_BUTTON.height
  );
}

function renderButton(ctx, button, label, color, ready, time) {
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
  fillCircle(ctx, button.x + 24, button.y + button.height / 2, 7 * pulse, color);
  drawText(ctx, label, button.x + 24 + (button.width - 36) / 2, button.y + button.height / 2 + 1, {
    size: 14,
    weight: 700,
    color: COLORS.text,
    alpha: 0.95,
  });
  ctx.restore();
}

export function drawPetButtons(ctx, { lureReady, time }) {
  renderButton(ctx, SNACK_BUTTON, 'SNACK', COLORS.accent, true, time);
  renderButton(ctx, LURE_BUTTON, 'LURE', COLORS.danger, lureReady, time);
}
