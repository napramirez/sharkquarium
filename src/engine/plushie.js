import { clamp, TAU } from './math.js';

const STIFFNESS = 55;
const DAMPING = 5.5;

function wrapAngle(angle) {
  let value = angle;
  while (value > Math.PI) value -= TAU;
  while (value < -Math.PI) value += TAU;
  return value;
}

function limb(ax, ay, rest, length, width, color, options = {}) {
  return {
    ax,
    ay,
    rest,
    length,
    width,
    color,
    segs: options.segs ?? 2,
    spread: options.spread ?? 0,
    curl: options.curl ?? 0.5,
    tip: options.tip ?? 'blob',
    stiff: options.stiff ?? 1,
  };
}

function buttonEye(ctx, x, y, r, color = '#10233a') {
  ctx.beginPath();
  ctx.arc(x, y, r * 0.22, 0, TAU);
  ctx.fillStyle = '#f4fbff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.05, y, r * 0.11, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}

function stitch(ctx, x1, y1, x2, y2, color, r, count = 3) {
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.045;
  for (let i = 1; i <= count; i += 1) {
    const t = i / (count + 1);
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    const nx = -(y2 - y1);
    const ny = x2 - x1;
    const len = Math.hypot(nx, ny) || 1;
    ctx.beginPath();
    ctx.moveTo(x - (nx / len) * r * 0.07, y - (ny / len) * r * 0.07);
    ctx.lineTo(x + (nx / len) * r * 0.07, y + (ny / len) * r * 0.07);
    ctx.stroke();
  }
}

function fin(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

const SPECS = {
  plushshark: {
    scale: 0.66,
    anchor: [-0.45, -0.6],
    tilt: -0.12,
    limbs: [
      limb(-1.05, 0.1, Math.PI, 0.95, 0.34, '#5d87a8', { segs: 2, curl: 0.42 }),
      limb(-0.15, 0.55, 2.5, 0.5, 0.26, '#5d87a8', { segs: 1 }),
    ],
    body(ctx, r) {
      ctx.fillStyle = '#7fa8c9';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.15, r * 0.72, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#54809f';
      ctx.lineWidth = r * 0.08;
      ctx.stroke();
      ctx.fillStyle = '#e8f2fa';
      ctx.beginPath();
      ctx.ellipse(0.08 * r, 0.22 * r, r * 0.82, r * 0.4, 0, 0, TAU);
      ctx.fill();
      fin(ctx, [[-0.15 * r, -0.62 * r], [0.05 * r, -1.28 * r], [0.42 * r, -0.52 * r]], '#5d87a8');
      stitch(ctx, -0.5 * r, 0.05 * r, 0.55 * r, 0.05 * r, 'rgba(38, 68, 92, 0.55)', r, 4);
      buttonEye(ctx, 0.72 * r, -0.18 * r, r);
      ctx.fillStyle = '#54809f';
      for (let i = 0; i < 3; i += 1) {
        ctx.fillRect(0.28 * r + i * r * 0.14, -0.08 * r, r * 0.06, r * 0.3);
      }
    },
  },
  plushbabyshark: {
    scale: 0.64,
    anchor: [-0.45, -0.62],
    tilt: -0.1,
    limbs: [
      limb(-1.05, 0.1, Math.PI, 0.85, 0.3, '#7ec2d8', { segs: 2, curl: 0.45 }),
      limb(-0.1, 0.55, 2.5, 0.45, 0.24, '#7ec2d8', { segs: 1 }),
    ],
    body(ctx, r) {
      ctx.fillStyle = '#9fd8e8';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.08, r * 0.78, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#6faec4';
      ctx.lineWidth = r * 0.08;
      ctx.stroke();
      ctx.fillStyle = '#f0fbff';
      ctx.beginPath();
      ctx.ellipse(0.1 * r, 0.26 * r, r * 0.74, r * 0.42, 0, 0, TAU);
      ctx.fill();
      fin(ctx, [[-0.12 * r, -0.66 * r], [0.04 * r, -1.2 * r], [0.38 * r, -0.56 * r]], '#7ec2d8');
      stitch(ctx, -0.45 * r, 0.02 * r, 0.5 * r, 0.02 * r, 'rgba(42, 96, 116, 0.5)', r, 3);
      buttonEye(ctx, 0.66 * r, -0.2 * r, r);
      ctx.strokeStyle = '#6faec4';
      ctx.lineWidth = r * 0.07;
      ctx.beginPath();
      ctx.arc(0.5 * r, 0.34 * r, r * 0.16, 0, TAU);
      ctx.stroke();
    },
  },
  plushstingray: {
    scale: 0.72,
    anchor: [-0.3, -0.55],
    tilt: -0.1,
    limbs: [limb(-1.0, 0.2, Math.PI, 1.25, 0.17, '#a5755c', { segs: 3, curl: 0.3 })],
    body(ctx, r) {
      ctx.fillStyle = '#b98a6e';
      ctx.beginPath();
      ctx.moveTo(r * 1.05, 0);
      ctx.quadraticCurveTo(r * 0.2, -r * 0.85, -r * 0.75, -r * 0.32);
      ctx.quadraticCurveTo(-r * 0.35, 0, -r * 0.75, r * 0.32);
      ctx.quadraticCurveTo(r * 0.2, r * 0.85, r * 1.05, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8f6248';
      ctx.lineWidth = r * 0.07;
      ctx.stroke();
      ctx.fillStyle = '#efdcc9';
      ctx.beginPath();
      ctx.ellipse(0.1 * r, r * 0.12, r * 0.55, r * 0.3, 0, 0, TAU);
      ctx.fill();
      for (const [sx, sy] of [
        [0.1, -0.3],
        [0.3, 0.05],
        [-0.1, 0.3],
      ]) {
        ctx.beginPath();
        ctx.arc(sx * r, sy * r, r * 0.09, 0, TAU);
        ctx.fillStyle = '#8f6248';
        ctx.fill();
      }
      buttonEye(ctx, 0.55 * r, -0.18 * r, r);
    },
  },
  plushsquid: {
    scale: 0.66,
    anchor: [-0.35, -0.62],
    tilt: -0.08,
    limbs: [
      limb(-0.45, 0.62, 2.6, 0.85, 0.2, '#c76e86', { segs: 3, curl: 0.4, spread: -0.35 }),
      limb(0.45, 0.62, 2.6, 0.85, 0.2, '#c76e86', { segs: 3, curl: 0.4, spread: 0.35 }),
      limb(-0.15, 0.7, 2.9, 1.0, 0.17, '#d98a9e', { segs: 3, curl: 0.34, spread: -0.15 }),
      limb(0.15, 0.7, 2.9, 1.0, 0.17, '#d98a9e', { segs: 3, curl: 0.34, spread: 0.15 }),
    ],
    body(ctx, r) {
      ctx.fillStyle = '#d98a9e';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.95);
      ctx.quadraticCurveTo(r * 0.85, -r * 0.3, r * 0.6, r * 0.62);
      ctx.quadraticCurveTo(0, r * 0.88, -r * 0.6, r * 0.62);
      ctx.quadraticCurveTo(-r * 0.85, -r * 0.3, 0, -r * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b26a80';
      ctx.lineWidth = r * 0.08;
      ctx.stroke();
      fin(ctx, [[0.5 * r, -0.5 * r], [1.1 * r, -0.6 * r], [0.56 * r, 0.05 * r]], '#c76e86');
      fin(ctx, [[-0.5 * r, -0.5 * r], [-1.1 * r, -0.6 * r], [-0.56 * r, 0.05 * r]], '#c76e86');
      stitch(ctx, -0.36 * r, -0.2 * r, 0.36 * r, -0.2 * r, 'rgba(120, 50, 72, 0.5)', r, 3);
      buttonEye(ctx, 0.34 * r, 0.08 * r, r);
      buttonEye(ctx, -0.34 * r, 0.08 * r, r);
    },
  },
  plushshrimp: {
    scale: 0.7,
    anchor: [-0.35, -0.6],
    tilt: -0.15,
    limbs: [
      limb(0.62, -0.5, -0.5, 0.95, 0.09, '#d98a60', { segs: 3, curl: 0.22, spread: 0.35 }),
      limb(0.62, -0.35, -0.25, 0.8, 0.09, '#d98a60', { segs: 3, curl: 0.22, spread: 0.1 }),
    ],
    body(ctx, r) {
      ctx.strokeStyle = '#e89a72';
      ctx.lineWidth = r * 0.62;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, r * 0.45);
      ctx.quadraticCurveTo(0.15 * r, r * 0.85, r * 0.62, r * 0.05);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(150, 80, 44, 0.45)';
      ctx.lineWidth = r * 0.07;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(-r * 0.55 + i * r * 0.12, r * 0.45 - i * r * 0.03, r * 0.6, -0.4, 0.6);
        ctx.stroke();
      }
      fin(ctx, [[-0.9 * r, 0.35 * r], [-1.35 * r, 0.05 * r], [-1.05 * r, 0.75 * r]], '#d9764a');
      ctx.fillStyle = '#ffd9c2';
      ctx.beginPath();
      ctx.ellipse(0.15 * r, 0.3 * r, r * 0.42, r * 0.2, 0.5, 0, TAU);
      ctx.fill();
      buttonEye(ctx, 0.62 * r, -0.28 * r, r);
    },
  },
  plushcrab: {
    scale: 0.68,
    anchor: [-0.35, -0.58],
    tilt: -0.06,
    limbs: [
      limb(0.78, 0.2, -0.35, 0.7, 0.2, '#b25348', { segs: 2, curl: 0.5, tip: 'claw', spread: 0.3 }),
      limb(-0.78, 0.2, Math.PI + 0.35, 0.7, 0.2, '#b25348', {
        segs: 2,
        curl: 0.5,
        tip: 'claw',
        spread: -0.3,
      }),
      limb(0.5, 0.6, 2.3, 0.4, 0.14, '#c96b5c', { segs: 1, stiff: 1.4 }),
      limb(-0.5, 0.6, 2.85, 0.4, 0.14, '#c96b5c', { segs: 1, stiff: 1.4 }),
      limb(0.18, 0.68, 2.6, 0.38, 0.14, '#c96b5c', { segs: 1, stiff: 1.4 }),
      limb(-0.18, 0.68, 2.55, 0.38, 0.14, '#c96b5c', { segs: 1, stiff: 1.4 }),
    ],
    body(ctx, r) {
      ctx.fillStyle = '#d96a5a';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.05, r * 0.78, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#a84b3e';
      ctx.lineWidth = r * 0.08;
      ctx.stroke();
      ctx.fillStyle = '#ffc9b8';
      ctx.beginPath();
      ctx.ellipse(0, 0.18 * r, r * 0.72, r * 0.42, 0, 0, TAU);
      ctx.fill();
      stitch(ctx, -0.55 * r, -0.28 * r, 0.55 * r, -0.28 * r, 'rgba(110, 42, 30, 0.5)', r, 4);
      ctx.strokeStyle = '#a84b3e';
      ctx.lineWidth = r * 0.06;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * r * 0.32, -0.6 * r);
        ctx.lineTo(side * r * 0.42, -0.95 * r);
        ctx.stroke();
      }
      buttonEye(ctx, 0.42 * r, -0.98 * r, r * 0.85);
      buttonEye(ctx, -0.42 * r, -0.98 * r, r * 0.85);
    },
  },
  plushjelly: {
    scale: 0.72,
    anchor: [-0.3, -0.62],
    tilt: 0,
    limbs: [
      limb(-0.5, 0.45, 2.15, 0.8, 0.13, '#c9a3ff', { segs: 3, curl: 0.32, spread: -0.3 }),
      limb(-0.17, 0.52, 2.6, 0.9, 0.13, '#c9a3ff', { segs: 3, curl: 0.28, spread: -0.1 }),
      limb(0.17, 0.52, 2.6, 0.9, 0.13, '#c9a3ff', { segs: 3, curl: 0.28, spread: 0.1 }),
      limb(0.5, 0.45, 2.15, 0.8, 0.13, '#c9a3ff', { segs: 3, curl: 0.32, spread: 0.3 }),
    ],
    body(ctx, r) {
      ctx.fillStyle = '#c9a3ff';
      ctx.beginPath();
      ctx.moveTo(-r * 0.95, r * 0.3);
      ctx.quadraticCurveTo(-r * 0.85, -r * 0.95, 0, -r * 0.95);
      ctx.quadraticCurveTo(r * 0.85, -r * 0.95, r * 0.95, r * 0.3);
      ctx.quadraticCurveTo(0, r * 0.62, -r * 0.95, r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a37ad9';
      ctx.lineWidth = r * 0.07;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.ellipse(-0.32 * r, -0.42 * r, r * 0.3, r * 0.16, -0.5, 0, TAU);
      ctx.fill();
      buttonEye(ctx, 0.34 * r, -0.22 * r, r);
      buttonEye(ctx, -0.34 * r, -0.22 * r, r);
      stitch(ctx, -0.4 * r, 0.3 * r, 0.4 * r, 0.3 * r, 'rgba(92, 54, 140, 0.5)', r, 3);
    },
  },
  plushghostjelly: {
    scale: 0.72,
    anchor: [-0.3, -0.62],
    tilt: 0,
    limbs: [
      limb(-0.5, 0.42, 2.15, 0.95, 0.12, 'rgba(218, 240, 255, 0.9)', {
        segs: 3,
        curl: 0.34,
        spread: -0.3,
      }),
      limb(-0.17, 0.5, 2.6, 1.05, 0.12, 'rgba(218, 240, 255, 0.9)', {
        segs: 3,
        curl: 0.3,
        spread: -0.1,
      }),
      limb(0.17, 0.5, 2.6, 1.05, 0.12, 'rgba(218, 240, 255, 0.9)', {
        segs: 3,
        curl: 0.3,
        spread: 0.1,
      }),
      limb(0.5, 0.42, 2.15, 0.95, 0.12, 'rgba(218, 240, 255, 0.9)', {
        segs: 3,
        curl: 0.34,
        spread: 0.3,
      }),
    ],
    body(ctx, r) {
      ctx.fillStyle = 'rgba(214, 238, 255, 0.82)';
      ctx.beginPath();
      ctx.moveTo(-r * 0.98, r * 0.28);
      ctx.quadraticCurveTo(-r * 0.9, -r * 1.0, 0, -r * 1.0);
      ctx.quadraticCurveTo(r * 0.9, -r * 1.0, r * 0.98, r * 0.28);
      ctx.quadraticCurveTo(0, r * 0.6, -r * 0.98, r * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(150, 190, 220, 0.9)';
      ctx.lineWidth = r * 0.07;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(-0.3 * r, -0.45 * r, r * 0.3, r * 0.15, -0.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(120, 200, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(0.34 * r, -0.24 * r, r * 0.18, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-0.34 * r, -0.24 * r, r * 0.18, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#10233a';
      ctx.beginPath();
      ctx.arc(0.34 * r, -0.24 * r, r * 0.08, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-0.34 * r, -0.24 * r, r * 0.08, 0, TAU);
      ctx.fill();
    },
  },
  plushnautilus: {
    scale: 0.68,
    anchor: [-0.42, -0.6],
    tilt: -0.1,
    limbs: [
      limb(0.5, 0.4, -0.3, 0.75, 0.16, '#c98f52', { segs: 3, curl: 0.36, spread: 0.3 }),
      limb(0.45, 0.55, 0.1, 0.85, 0.15, '#c98f52', { segs: 3, curl: 0.32 }),
      limb(0.4, 0.68, 0.5, 0.75, 0.14, '#d9a86e', { segs: 3, curl: 0.36, spread: -0.2 }),
    ],
    body(ctx, r) {
      ctx.fillStyle = '#e8c98a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.92, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#b98f4e';
      ctx.lineWidth = r * 0.08;
      ctx.stroke();
      ctx.strokeStyle = '#b98f4e';
      ctx.lineWidth = r * 0.07;
      ctx.beginPath();
      for (let i = 0; i < 26; i += 1) {
        const angle = i * 0.42;
        const spiral = r * (0.12 + i * 0.032);
        const x = Math.cos(angle) * spiral;
        const y = Math.sin(angle) * spiral;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#d9a86e';
      ctx.beginPath();
      ctx.ellipse(0.62 * r, 0.42 * r, r * 0.34, r * 0.22, 0.4, 0, TAU);
      ctx.fill();
      buttonEye(ctx, 0.7 * r, 0.36 * r, r * 0.85);
      stitch(ctx, -0.5 * r, -0.5 * r, 0.2 * r, -0.82 * r, 'rgba(130, 92, 40, 0.5)', r, 3);
    },
  },
  plushmoray: {
    scale: 0.66,
    anchor: [-0.5, -0.58],
    tilt: -0.2,
    limbs: [
      limb(-1.0, 0.15, Math.PI, 1.05, 0.3, '#75853f', { segs: 3, curl: 0.4 }),
      limb(-0.2, 0.55, 2.4, 0.45, 0.2, '#75853f', { segs: 1 }),
    ],
    body(ctx, r) {
      ctx.strokeStyle = '#8a9a5a';
      ctx.lineWidth = r * 0.85;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, r * 0.15);
      ctx.quadraticCurveTo(0, -r * 0.5, r * 0.95, -r * 0.05);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(70, 84, 36, 0.6)';
      ctx.lineWidth = r * 0.07;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, r * 0.55);
      ctx.quadraticCurveTo(0, -r * 0.08, r * 0.9, r * 0.38);
      ctx.stroke();
      ctx.fillStyle = '#e8e3c2';
      ctx.beginPath();
      ctx.ellipse(r * 0.62, r * 0.24, r * 0.34, r * 0.2, 0.35, 0, TAU);
      ctx.fill();
      stitch(ctx, -0.55 * r, -0.05 * r, 0.5 * r, -0.32 * r, 'rgba(56, 68, 26, 0.5)', r, 4);
      ctx.fillStyle = '#f4fbff';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(r * 0.78 + i * r * 0.08, r * 0.02, r * 0.07, 0, TAU);
        ctx.fill();
      }
      buttonEye(ctx, 0.82 * r, -0.28 * r, r);
    },
  },
  plushgoldfish: {
    scale: 0.7,
    anchor: [-0.35, -0.6],
    tilt: -0.12,
    limbs: [limb(-1.0, 0.05, Math.PI, 1.0, 0.42, '#f2a03d', { segs: 2, curl: 0.4 })],
    body(ctx, r) {
      ctx.fillStyle = '#f2a03d';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.02, r * 0.85, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#c97f26';
      ctx.lineWidth = r * 0.08;
      ctx.stroke();
      ctx.fillStyle = '#ffe6b8';
      ctx.beginPath();
      ctx.ellipse(0.14 * r, 0.3 * r, r * 0.66, r * 0.4, 0, 0, TAU);
      ctx.fill();
      fin(ctx, [[-0.1 * r, -0.78 * r], [0.08 * r, -1.4 * r], [0.42 * r, -0.7 * r]], '#ffd166');
      fin(ctx, [[0.2 * r, 0.7 * r], [0.5 * r, 1.25 * r], [0.7 * r, 0.55 * r]], '#ffd166');
      stitch(ctx, -0.45 * r, 0.05 * r, 0.5 * r, 0.05 * r, 'rgba(150, 90, 20, 0.5)', r, 3);
      buttonEye(ctx, 0.68 * r, -0.25 * r, r);
      ctx.fillStyle = '#c97f26';
      ctx.beginPath();
      ctx.arc(0.98 * r, 0.05 * r, r * 0.12, 0, TAU);
      ctx.fill();
    },
  },
};

const states = new WeakMap();
const fallbackStates = new Map();

function stateFor(frame, kind, spec) {
  const owner = frame.entity;
  if (owner) {
    let state = states.get(owner);
    if (!state || state.kind !== kind) {
      state = { kind, lastTime: -1, limbs: spec.limbs.map(() => ({ angles: [], vels: [] })) };
      spec.limbs.forEach((limbSpec, index) => {
        const limbState = state.limbs[index];
        for (let i = 0; i < limbSpec.segs; i += 1) {
          limbState.angles.push(limbSpec.rest + limbSpec.curl * i);
          limbState.vels.push(0);
        }
      });
      states.set(owner, state);
    }
    return state;
  }
  let state = fallbackStates.get(kind);
  if (!state) {
    state = { kind, lastTime: -1, limbs: spec.limbs.map(() => ({ angles: [], vels: [] })) };
    spec.limbs.forEach((limbSpec, index) => {
      const limbState = state.limbs[index];
      for (let i = 0; i < limbSpec.segs; i += 1) {
        limbState.angles.push(limbSpec.rest + limbSpec.curl * i);
        limbState.vels.push(0);
      }
    });
    fallbackStates.set(kind, state);
  }
  return state;
}

function drawLimb(ctx, limbState, spec, r) {
  const segLen = (spec.length * r) / spec.segs;
  let x = spec.ax * r;
  let y = spec.ay * r;
  const points = [[x, y]];
  for (let i = 0; i < spec.segs; i += 1) {
    x += Math.cos(limbState.angles[i]) * segLen;
    y += Math.sin(limbState.angles[i]) * segLen;
    points.push([x, y]);
  }
  ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass += 1) {
    ctx.strokeStyle = pass === 0 ? 'rgba(24, 30, 44, 0.5)' : spec.color;
    for (let i = 0; i < spec.segs; i += 1) {
      const width = spec.width * r * (1 - (i / spec.segs) * 0.35) * (pass === 0 ? 1.35 : 1);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(points[i][0], points[i][1]);
      ctx.lineTo(points[i + 1][0], points[i + 1][1]);
      ctx.stroke();
    }
  }
  const [tipX, tipY] = points[points.length - 1];
  if (spec.tip === 'claw') {
    const angle = limbState.angles[spec.segs - 1];
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(
        tipX + Math.cos(angle + side * 0.6) * r * 0.3,
        tipY + Math.sin(angle + side * 0.6) * r * 0.3,
      );
      ctx.lineTo(
        tipX + Math.cos(angle + side * 0.15) * r * 0.22,
        tipY + Math.sin(angle + side * 0.15) * r * 0.22,
      );
      ctx.closePath();
      ctx.fillStyle = spec.color;
      ctx.fill();
    }
  } else if (spec.tip === 'blob') {
    ctx.beginPath();
    ctx.arc(tipX, tipY, spec.width * r * 0.62, 0, TAU);
    ctx.fillStyle = spec.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(24, 30, 44, 0.45)';
    ctx.lineWidth = r * 0.04;
    ctx.stroke();
  }
}

export function drawPlushie(ctx, kind, radius, time, frame = {}) {
  const spec = SPECS[kind];
  if (!spec) return;
  const state = stateFor(frame, kind, spec);
  let dt = time - state.lastTime;
  if (!(dt > 0.0001 && dt < 0.1)) dt = 1 / 60;
  state.lastTime = time;

  const entity = frame.entity;
  const vx = entity?.vx ?? 0;
  const vy = entity?.vy ?? 0;
  const flip = frame.flip ?? 1;
  const speed = Math.hypot(vx, vy);
  const blend = clamp(speed / 260, 0, 1);
  const trail = Math.atan2(-vy, -vx * flip) - (frame.heading ?? 0);

  spec.limbs.forEach((limbSpec, index) => {
    const limbState = state.limbs[index];
    for (let i = 0; i < limbSpec.segs; i += 1) {
      const sway = Math.sin(time * 1.7 + index * 1.31 + i * 0.9) * (0.08 + 0.04 * i);
      const target =
        i === 0
          ? limbSpec.rest +
            limbSpec.spread +
            wrapAngle(trail - limbSpec.rest) * blend +
            sway
          : limbState.angles[i - 1] + limbSpec.curl * (1 - 0.6 * blend) + sway * 0.5;
      const force = wrapAngle(target - limbState.angles[i]) * limbSpec.stiff * STIFFNESS * dt;
      limbState.vels[i] = clamp(
        (limbState.vels[i] + force) * Math.exp(-DAMPING * dt),
        -26,
        26,
      );
      limbState.angles[i] += limbState.vels[i] * dt;
    }
  });

  const r = radius * spec.scale;
  ctx.save();
  ctx.translate(spec.anchor[0] * radius, spec.anchor[1] * radius);
  ctx.rotate(spec.tilt);
  for (let index = 0; index < spec.limbs.length; index += 1) {
    drawLimb(ctx, state.limbs[index], spec.limbs[index], r);
  }
  spec.body(ctx, r);
  ctx.restore();
}
