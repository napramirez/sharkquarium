import { TAU } from '../engine/math.js';

export function drawHatchetFish(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const glow = pose.glow ?? 0;
  const dim = pose.dim ?? 0;
  const flash = pose.flash ?? 0;
  const r = radius;

  ctx.save();
  ctx.rotate(Math.sin(age * 5) * 0.06);
  ctx.globalAlpha = 1 - dim * 0.5;

  ctx.beginPath();
  ctx.moveTo(-r * 1.15, 0);
  ctx.lineTo(-r * 1.95, -r * 0.52);
  ctx.lineTo(-r * 1.62, 0);
  ctx.lineTo(-r * 1.95, r * 0.52);
  ctx.closePath();
  ctx.fillStyle = 'rgba(190, 214, 230, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(30, 52, 72, 0.5)';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();

  const body = ctx.createLinearGradient(0, -r * 1.15, 0, r * 1.3);
  body.addColorStop(0, '#f2fbff');
  body.addColorStop(0.45, '#c2dae9');
  body.addColorStop(0.75, '#93b3c8');
  body.addColorStop(1, '#6d90a8');
  ctx.beginPath();
  ctx.moveTo(r * 1.12, -r * 0.12);
  ctx.quadraticCurveTo(r * 1.02, -r * 0.78, r * 0.28, -r * 0.98);
  ctx.quadraticCurveTo(-r * 0.5, -r * 1.18, -r * 1.12, -r * 0.2);
  ctx.quadraticCurveTo(-r * 0.9, r * 0.5, -r * 0.28, r * 1.22);
  ctx.quadraticCurveTo(r * 0.46, r * 1.26, r * 1.12, -r * 0.12);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = 'rgba(26, 46, 66, 0.6)';
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.92);
  ctx.quadraticCurveTo(-r * 0.75, -r * 1.5, -r * 1.05, -r * 0.5);
  ctx.closePath();
  ctx.fillStyle = 'rgba(200, 222, 236, 0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(26, 46, 66, 0.5)';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(r * 0.25, r * 0.1);
  ctx.quadraticCurveTo(r * 0.4, r * 0.8, -r * 0.1, r * 0.7);
  ctx.quadraticCurveTo(r * 0.05, r * 0.35, r * 0.25, r * 0.1);
  ctx.closePath();
  ctx.fillStyle = 'rgba(170, 200, 218, 0.75)';
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(r * 1.12, -r * 0.12);
  ctx.lineTo(r * 0.84, r * 0.1);
  ctx.strokeStyle = 'rgba(30, 50, 70, 0.7)';
  ctx.lineWidth = r * 0.06;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(r * 0.42, -r * 0.42, r * 0.27, 0, TAU);
  ctx.fillStyle = '#eef8ff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(26, 46, 66, 0.7)';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 0.47, -r * 0.45, r * 0.16, 0, TAU);
  ctx.fillStyle = '#12263a';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.4, -r * 0.51, r * 0.05, 0, TAU);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fill();

  const lit = Math.max(glow, flash);
  for (let i = 0; i < 6; i += 1) {
    const t = i / 5;
    const px = r * (0.7 - t * 1.5);
    const py = r * (0.86 + 0.26 * Math.sin(t * Math.PI));
    ctx.beginPath();
    ctx.arc(px, py, r * (0.09 + lit * 0.05), 0, TAU);
    ctx.fillStyle = `rgba(150, 235, 255, ${0.28 + lit * 0.72})`;
    ctx.fill();
  }
  if (lit > 0.05) {
    ctx.save();
    ctx.globalAlpha = lit * 0.5;
    ctx.fillStyle = '#bff0ff';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.95, r * 1.3, r * 0.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawLoosejaw(ctx, radius, pose = {}) {
  const age = pose.age ?? 0;
  const jawOpen = pose.jawOpen ?? 0.75;
  const swing = pose.swing ?? 0;
  const alert = pose.alert ?? 0;
  const r = radius;

  const BODY = '#0b0b0e';
  const BODY_DARK = '#040406';
  const HEAD = '#101015';
  const OUTLINE = '#12171d';
  const TEETH = '#ded8c6';

  const quad = (p0, c, p1, u) => ({
    x: (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * c.x + u * u * p1.x,
    y: (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * c.y + u * u * p1.y,
  });

  ctx.save();
  ctx.rotate(Math.sin(age * 3.2) * 0.03);

  const segs = 18;
  const bodyLen = r * 5.6;
  const pts = [];
  for (let i = 0; i <= segs; i += 1) {
    const t = i / segs;
    const neck = Math.min(1, t / 0.18);
    pts.push({
      x: -r * 0.1 - t * bodyLen,
      y: Math.sin(age * 3.4 - t * 3.2) * r * 0.5 * t,
      w: r * (0.24 + 0.24 * Math.sin(neck * Math.PI * 0.5)) * (1 - t * 0.85),
    });
  }
  const dorsalA = 2;
  const dorsalB = 16;
  const finH = r * 0.45;
  const dorsalSpan = dorsalB - dorsalA;
  const dorsalBase = (i) => pts[i].y - pts[i].w * 0.7;
  const dorsalHeight = (i) => {
    const u = (i - dorsalA) / dorsalSpan;
    const edge = Math.min(u, 1 - u);
    const t = Math.max(0, Math.min(1, edge / 0.16));
    return finH * Math.sin(t * Math.PI * 0.5);
  };
  ctx.beginPath();
  ctx.moveTo(pts[dorsalA].x, dorsalBase(dorsalA));
  for (let i = dorsalA + 1; i <= dorsalB; i += 1) {
    ctx.lineTo(pts[i].x, dorsalBase(i));
  }
  for (let i = dorsalB; i >= dorsalA; i -= 1) {
    ctx.lineTo(pts[i].x, dorsalBase(i) - dorsalHeight(i));
  }
  ctx.closePath();
  ctx.fillStyle = BODY_DARK;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.2, r * 0.04);
  ctx.lineJoin = 'round';
  ctx.stroke();

  const ventralBase = (i) => pts[i].y + pts[i].w * 0.7;
  ctx.beginPath();
  ctx.moveTo(pts[dorsalA].x, ventralBase(dorsalA));
  for (let i = dorsalA + 1; i <= dorsalB; i += 1) {
    ctx.lineTo(pts[i].x, ventralBase(i));
  }
  for (let i = dorsalB; i >= dorsalA; i -= 1) {
    ctx.lineTo(pts[i].x, ventralBase(i) + dorsalHeight(i));
  }
  ctx.closePath();
  ctx.fillStyle = BODY_DARK;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.2, r * 0.04);
  ctx.lineJoin = 'round';
  ctx.stroke();

  const grad = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.5);
  grad.addColorStop(0, BODY);
  grad.addColorStop(1, BODY_DARK);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y - pts[0].w);
  for (const p of pts) ctx.lineTo(p.x, p.y - p.w);
  for (let i = pts.length - 1; i >= 0; i -= 1) ctx.lineTo(pts[i].x, pts[i].y + pts[i].w);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.stroke();

  if (alert > 0.05) {
    ctx.save();
    ctx.globalAlpha = alert * 0.4;
    ctx.strokeStyle = '#8a1f26';
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  const tailTip = pts[pts.length - 1];
  const tailPrev = pts[pts.length - 2];
  const tailAngle = Math.atan2(tailTip.y - tailPrev.y, tailTip.x - tailPrev.x);
  ctx.save();
  ctx.translate(tailTip.x, tailTip.y);
  ctx.rotate(tailAngle);
  ctx.fillStyle = BODY_DARK;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(r * 0.56, -r * 0.3);
  ctx.quadraticCurveTo(r * 0.71, 0, r * 0.56, r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.stroke();
  ctx.restore();

  const finPt = pts[Math.max(1, segs - 3)];
  for (const side of [-1, 1]) {
    const baseY = finPt.y + side * finPt.w * 0.85;
    ctx.beginPath();
    ctx.moveTo(finPt.x + r * 0.2, baseY);
    ctx.quadraticCurveTo(finPt.x + r * 0.08, baseY + side * r * 0.34, finPt.x - r * 0.22, baseY + side * r * 0.35);
    ctx.quadraticCurveTo(finPt.x - r * 0.45, baseY + side * r * 0.26, finPt.x - r * 0.35, baseY + side * r * 0.06);
    ctx.quadraticCurveTo(finPt.x - r * 0.15, baseY + side * r * 0.01, finPt.x + r * 0.2, baseY);
    ctx.closePath();
    ctx.fillStyle = BODY_DARK;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.2, r * 0.045);
    ctx.stroke();
  }

  const spotRows = pose.spotRows ?? 3;
  for (let row = 0; row < spotRows; row += 1) {
    const spread = spotRows > 1 ? (row - (spotRows - 1) / 2) * 0.8 : 0;
    for (let i = 1; i < pts.length - 1; i += 1) {
      const p = pts[i];
      const pulse = 0.55 + 0.45 * Math.sin(age * 4 - i * 0.6 + row * 1.3);
      const sr = r * 0.045;
      ctx.fillStyle = `rgba(150, 230, 255, ${0.6 + 0.4 * pulse})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y + spread * p.w, sr, 0, TAU);
      ctx.fill();
    }
  }

  drawLoosejawHead(ctx, r, { age, jawOpen, swing });
  ctx.restore();
}

export function drawLoosejawHead(ctx, radius, pose = {}) {
  const r = radius;
  const age = pose.age ?? 0;
  const jawOpen = pose.jawOpen ?? 0.75;
  const swing = pose.swing ?? 0;
  const TEETH = '#ded8c6';
  const quad = (p0, c, p1, u) => ({
    x: (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * c.x + u * u * p1.x,
    y: (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * c.y + u * u * p1.y,
  });
  const TILT = 0.52;
  const leafLen = r * 1.7;
  const bx = -leafLen;
  const snout = r * 0.6;
  const headScale = 0.62;
  const headColor = pose.headColor ?? '#101015';
  const outlineColor = pose.outlineColor ?? '#12171d';
  const tilt = pose.tilt ?? TILT;
  const noJaw = pose.noJaw === true;
  const noPhotophores = pose.noPhotophores === true;
  const noLigament = pose.noLigament === true || noJaw;
  ctx.save();
  ctx.translate(-r * 0.1 + swing * r * 0.35, 0);
  ctx.rotate(-tilt - swing * 1.3);
  ctx.translate(snout, 0);
  ctx.scale(headScale, headScale);
  ctx.translate(-snout, 0);

  const hinge = { x: bx * 0.92, y: r * 0.26 };
  const jawAngle = jawOpen * 1.7;
  const jawLen = (r * 4.66 + swing * r * 0.8) * 0.5;
  const jdx = Math.cos(jawAngle);
  const jdy = Math.sin(jawAngle);
  const nx = jdy;
  const ny = -jdx;
  const jawTip = { x: hinge.x + jdx * jawLen, y: hinge.y + jdy * jawLen };

  const headAngle = -tilt - swing * 1.3;
  const toLocal = (px, py) => {
    const ao = -headAngle;
    const ca = Math.cos(ao);
    const sa = Math.sin(ao);
    const ox = px - (-r * 0.1 + swing * r * 0.35);
    const oy = py;
    const rx = ca * ox - sa * oy;
    const ry = sa * ox + ca * oy;
    return { x: (rx - snout) / headScale + snout, y: ry / headScale };
  };

  const noseR = r * 0.17;
  const headPath = () => {
    ctx.beginPath();
    ctx.moveTo(snout - noseR, -r * 0.15);
    ctx.quadraticCurveTo(snout - leafLen * 0.45, -r * 0.3, bx, -r * 0.26);
    ctx.quadraticCurveTo(bx - r * 0.2, r * 0.06, bx, r * 0.42);
    ctx.quadraticCurveTo(snout - leafLen * 0.45, r * 0.82, snout - noseR, r * 0.34);
    ctx.quadraticCurveTo(snout + noseR * 1.02, r * 0.04, snout - noseR, -r * 0.15);
    ctx.closePath();
  };

  if (!noLigament) {
    const ligJaw = { x: hinge.x + jdx * jawLen * 0.5 - nx * r * 0.05, y: hinge.y + jdy * jawLen * 0.5 - ny * r * 0.05 };
    const ligNeck = toLocal(-r * 1.05, r * 0.4);
    const ligDx = ligNeck.x - ligJaw.x;
    const ligDy = ligNeck.y - ligJaw.y;
    const ligLen = Math.hypot(ligDx, ligDy) || 1;
    let ligPx = -ligDy / ligLen;
    let ligPy = ligDx / ligLen;
    if (ligPy < 0) {
      ligPx = -ligPx;
      ligPy = -ligPy;
    }
    const ligMid = {
      x: (ligJaw.x + ligNeck.x) * 0.5 + ligPx * (ligLen * 0.5),
      y: (ligJaw.y + ligNeck.y) * 0.5 + ligPy * (ligLen * 0.5),
    };
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = Math.max(1.6, r * 0.08) * (1 - jawOpen * 0.35);
    ctx.beginPath();
    ctx.moveTo(ligJaw.x, ligJaw.y);
    ctx.lineTo(ligMid.x, ligMid.y);
    ctx.lineTo(ligNeck.x, ligNeck.y);
    ctx.moveTo(ligMid.x, ligMid.y);
    ctx.lineTo(hinge.x, hinge.y);
    ctx.stroke();
    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = Math.max(1, r * 0.04) * (1 - jawOpen * 0.3);
    ctx.beginPath();
    ctx.moveTo(ligJaw.x, ligJaw.y);
    ctx.lineTo(ligMid.x, ligMid.y);
    ctx.lineTo(ligNeck.x, ligNeck.y);
    ctx.moveTo(ligMid.x, ligMid.y);
    ctx.lineTo(hinge.x, hinge.y);
    ctx.stroke();
    ctx.restore();
  }

  headPath();
  ctx.fillStyle = headColor;
  ctx.fill();
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.stroke();

  ctx.fillStyle = headColor;
  ctx.strokeStyle = outlineColor;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(bx + r * 0.4, -r * 0.18);
  ctx.quadraticCurveTo(bx - r * 0.05, -r * 0.56, bx - r * 0.12, -r * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + r * 0.2, r * 0.34);
  ctx.quadraticCurveTo(bx - r * 0.4, r * 0.74, bx - r * 0.05, r * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const ex = r * 0.28;
  const ey = -r * 0.05;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(ex, ey, r * 0.17, r * 0.17, 0, 0, TAU);
  ctx.fillStyle = '#e23a2e';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ex, ey, r * 0.108, r * 0.108, 0, 0, TAU);
  ctx.fillStyle = '#04060a';
  ctx.fill();
  ctx.restore();

  if (!noPhotophores) {
    const pulse = 0.5 + 0.5 * Math.sin(age * 2.6);
    const redAlpha = pulse;
    const greenAlpha = 1 - pulse;
    const rsx = ex;
    const rsy = ey + r * 0.34;
    ctx.save();
    ctx.globalAlpha = redAlpha;
    const redHalo = ctx.createRadialGradient(rsx, rsy, 0, rsx, rsy, r * 0.46);
    redHalo.addColorStop(0, 'rgba(255, 60, 60, 0.95)');
    redHalo.addColorStop(1, 'rgba(255, 60, 60, 0)');
    ctx.fillStyle = redHalo;
    ctx.beginPath();
    ctx.arc(rsx, rsy, r * 0.46, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rsx - r * 0.18, rsy + r * 0.03);
    ctx.quadraticCurveTo(rsx, rsy - r * 0.17, rsx + r * 0.18, rsy + r * 0.03);
    ctx.quadraticCurveTo(rsx, rsy + r * 0.09, rsx - r * 0.18, rsy + r * 0.03);
    ctx.closePath();
    ctx.fillStyle = '#ff2a2a';
    ctx.fill();
    ctx.restore();

    const gx = ex - r * 0.34;
    const gy = ey - r * 0.02;
    ctx.save();
    ctx.globalAlpha = greenAlpha;
    const greenHalo = ctx.createRadialGradient(gx, gy, 0, gx, gy, r * 0.3);
    greenHalo.addColorStop(0, 'rgba(150, 255, 60, 0.95)');
    greenHalo.addColorStop(1, 'rgba(150, 255, 60, 0)');
    ctx.fillStyle = greenHalo;
    ctx.beginPath();
    ctx.arc(gx, gy, r * 0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#9bff3a';
    ctx.beginPath();
    ctx.arc(gx, gy, r * 0.1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (!noJaw) {
    const mouthP0 = { x: snout - noseR, y: r * 0.34 };
    const mouthC = { x: snout - leafLen * 0.45, y: r * 0.82 };
    const mouthP1 = { x: bx, y: r * 0.42 };
    ctx.fillStyle = TEETH;
    for (let i = 0; i < 7; i += 1) {
      const u = 0.15 + (i / 6) * 0.7;
      const base = quad(mouthP0, mouthC, mouthP1, u);
      const len = r * (0.08 + (1 - u) * 0.09);
      const w = r * 0.04;
      ctx.beginPath();
      ctx.moveTo(base.x - w, base.y);
      ctx.lineTo(base.x + w, base.y);
      ctx.lineTo(base.x, base.y + len);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = r * 0.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hinge.x, hinge.y);
    ctx.lineTo(jawTip.x, jawTip.y);
    ctx.stroke();
    ctx.strokeStyle = '#0c0e12';
    ctx.lineWidth = r * 0.12;
    ctx.stroke();

    ctx.fillStyle = TEETH;
    for (let i = 0; i < 7; i += 1) {
      const t = 0.24 + (i / 6) * 0.72;
      const px = hinge.x + jdx * jawLen * t + nx * r * 0.04;
      const py = hinge.y + jdy * jawLen * t + ny * r * 0.04;
      const w = r * 0.04;
      if (i === 6) {
        const flen = r * 0.36;
        const curl = r * 0.26;
        const fw = r * 0.06;
        const mxp = px + nx * flen * 0.5 - jdx * curl * 0.5;
        const myp = py + ny * flen * 0.5 - jdy * curl * 0.5;
        const txp = px + nx * flen - jdx * curl;
        const typ = py + ny * flen - jdy * curl;
        ctx.beginPath();
        ctx.moveTo(px + jdx * fw, py + jdy * fw);
        ctx.quadraticCurveTo(mxp + jdx * fw * 0.55, myp + jdy * fw * 0.55, txp, typ);
        ctx.quadraticCurveTo(mxp - jdx * fw * 0.55, myp - jdy * fw * 0.55, px - jdx * fw, py - jdy * fw);
        ctx.closePath();
        ctx.fill();
        continue;
      }
      const len = r * (0.08 + t * 0.09);
      ctx.beginPath();
      ctx.moveTo(px - jdx * w, py - jdy * w);
      ctx.lineTo(px + jdx * w, py + jdy * w);
      ctx.lineTo(px + nx * len, py + ny * len);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}
