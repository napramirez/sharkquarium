export function drawRagdollRipcord(ctx, target, clock, options = {}) {
  const {
    anchorX = 0,
    anchorY = 0,
    length = 26,
    segments = 6,
    gravity = 1100,
    damping = 0.9,
    cordColor = '#2b2f35',
    handleColor = '#9aa4ad',
    handleW = 5,
    handleH = 8,
    swayK = 0.06,
  } = options;

  const key = `${anchorX},${anchorY},${length},${segments}`;
  if (!target._ripcord || target._ripcordKey !== key) {
    target._ripcord = [];
    for (let i = 0; i <= segments; i += 1) {
      const y = anchorY + (length * i) / segments;
      target._ripcord.push({ x: anchorX, y, ox: anchorX, oy: y });
    }
    target._ripcordKey = key;
    target._ripcordClock = clock;
  }

  const rope = target._ripcord;
  const seg = length / segments;
  let dt = clock - (target._ripcordClock ?? clock);
  target._ripcordClock = clock;
  dt = Math.min(0.05, Math.max(0, dt));

  const facing = target.facing ?? 1;
  const inertiaX = -(target.vx ?? 0) * facing * swayK;
  const inertiaY = -(target.vy ?? 0) * swayK;

  if (dt > 0) {
    for (let i = 1; i <= segments; i += 1) {
      const node = rope[i];
      const vx = (node.x - node.ox) * damping;
      const vy = (node.y - node.oy) * damping;
      node.ox = node.x;
      node.oy = node.y;
      node.x += vx + inertiaX * dt * (i / segments);
      node.y += vy + inertiaY * dt * (i / segments) + gravity * dt * dt;
    }
    for (let iter = 0; iter < 4; iter += 1) {
      rope[0].x = anchorX;
      rope[0].y = anchorY;
      for (let i = 1; i <= segments; i += 1) {
        const a = rope[i - 1];
        const b = rope[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const diff = (dist - seg) / dist;
        if (i === 1) {
          b.x -= dx * diff;
          b.y -= dy * diff;
        } else {
          a.x += dx * diff * 0.5;
          a.y += dy * diff * 0.5;
          b.x -= dx * diff * 0.5;
          b.y -= dy * diff * 0.5;
        }
      }
    }
  }

  ctx.strokeStyle = cordColor;
  ctx.lineWidth = Math.max(1.6, handleW * 0.45);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(rope[0].x, rope[0].y);
  for (let i = 1; i <= segments; i += 1) ctx.lineTo(rope[i].x, rope[i].y);
  ctx.stroke();

  const end = rope[segments];
  const prev = rope[segments - 1];
  const ang = Math.atan2(end.y - prev.y, end.x - prev.x) - Math.PI / 2;
  ctx.save();
  ctx.translate(end.x, end.y);
  ctx.rotate(ang);
  ctx.fillStyle = handleColor;
  ctx.fillRect(-handleW / 2, 0, handleW, handleH);
  ctx.strokeStyle = 'rgba(10, 15, 20, 0.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-handleW / 2, 0, handleW, handleH);
  ctx.fillStyle = 'rgba(20, 24, 28, 0.9)';
  ctx.fillRect(-handleW * 0.25, handleH * 0.3, handleW * 0.5, handleH * 0.4);
  ctx.restore();
}
