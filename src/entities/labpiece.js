import { LOGICAL_HEIGHT, COLORS, AQUARIUM } from '../config.js';
import { drawShadowedPlanks } from '../engine/render.js';

export class LabPiece {
  constructor(kind, x, y) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    const cfg = AQUARIUM.labyrinth;
    const width = cfg.gateWidth;
    const half = width / 2;
    this.rects = [];
    this.tunnels = [];
    if (kind === 'LAB:WALL') {
      this.rects.push({ x: x - half, y: -20, w: width, h: Math.max(70, y) + 20 });
    } else if (kind === 'LAB:WALL-UP') {
      const top = Math.min(y, LOGICAL_HEIGHT - 70);
      this.rects.push({ x: x - half, y: top, w: width, h: LOGICAL_HEIGHT - top + 20 });
    } else if (kind === 'LAB:HOLED' || kind === 'LAB:HOLED-UP') {
      const rising = kind === 'LAB:HOLED-UP';
      const tunnelHalf = cfg.tunnelHeight / 2;
      const top = rising ? Math.max(90, y) : -20;
      const bottom = rising ? LOGICAL_HEIGHT + 20 : Math.max(90, y);
      const hole = rising ? top + 70 : bottom - 70;
      this.rects.push({
        x: x - half,
        y: top,
        w: width,
        h: Math.max(26, hole - tunnelHalf - top),
      });
      this.rects.push({
        x: x - half,
        y: hole + tunnelHalf,
        w: width,
        h: Math.max(26, bottom - hole - tunnelHalf),
      });
      this.tunnels.push({
        x: x - half,
        y: hole - tunnelHalf,
        w: width,
        h: cfg.tunnelHeight,
      });
    } else if (kind === 'LAB:STUB') {
      this.rects.push({
        x: x - cfg.stubWidth / 2,
        y: -20,
        w: cfg.stubWidth,
        h: cfg.stubHeight + 20,
      });
    } else if (kind === 'LAB:STUB-UP') {
      this.rects.push({
        x: x - cfg.stubWidth / 2,
        y: LOGICAL_HEIGHT - cfg.stubHeight,
        w: cfg.stubWidth,
        h: cfg.stubHeight + 20,
      });
    } else if (kind === 'LAB:SUPPORT') {
      this.rects.push({
        x: x - cfg.supportWidth / 2,
        y: -20,
        w: cfg.supportWidth,
        h: cfg.supportHeight + 20,
      });
    }
  }

  render(ctx) {
    for (const rect of this.rects) {
      const gradient = ctx.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
      gradient.addColorStop(0, COLORS.wreckWoodDark);
      gradient.addColorStop(0.5, COLORS.wreckWood);
      gradient.addColorStop(1, COLORS.wreckWoodDark);
      ctx.fillStyle = gradient;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = 'rgba(26, 18, 12, 0.6)';
      ctx.lineWidth = 2;
      for (let y = rect.y + 34; y < rect.y + rect.h - 10; y += 54) {
        ctx.beginPath();
        ctx.moveTo(rect.x + 3, y);
        ctx.lineTo(rect.x + rect.w - 3, y);
        ctx.stroke();
      }
      if (this.kind === 'LAB:SUPPORT') {
        ctx.strokeStyle = 'rgba(14, 10, 8, 0.85)';
        ctx.lineWidth = 2.6;
        for (let i = 0; i < 4; i += 1) {
          const cy = 70 + ((i * 127 + this.x * 53) % 240);
          ctx.beginPath();
          ctx.moveTo(rect.x + 6, cy);
          ctx.lineTo(rect.x + rect.w * 0.55, cy + 18);
          ctx.lineTo(rect.x + rect.w - 8, cy + 34);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = 'rgba(92, 122, 74, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
          rect.x + rect.w * 0.4,
          rect.y <= 0 ? rect.y + rect.h : rect.y + 12,
          18,
          7,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
    for (const tunnel of this.tunnels) {
      const cx = tunnel.x + tunnel.w / 2;
      const cy = tunnel.y + tunnel.h / 2;
      const rx = (tunnel.w - 12) / 2;
      const ry = tunnel.h / 2;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.clip();
      drawShadowedPlanks(ctx, cx - rx, cy - ry, rx * 2, ry * 2);
      ctx.restore();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.wreckWoodDark;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }
}
