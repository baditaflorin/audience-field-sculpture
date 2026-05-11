import type { Detection, PoseSummary, QuadCorners, Vec2 } from '../types/domain.js';

export function cornersFromArray(corners: readonly { x: number; y: number }[]): QuadCorners {
  if (corners.length < 4) {
    throw new Error(`expected 4 corners, got ${corners.length}`);
  }
  const [a, b, c, d] = corners as [Vec2, Vec2, Vec2, Vec2];
  return { tl: a, tr: b, br: c, bl: d };
}

export function summarisePose(
  detection: Detection,
  frameWidth: number,
  frameHeight: number
): PoseSummary {
  const { tl, tr, br, bl } = detection.corners;
  const centerX = (tl.x + tr.x + br.x + bl.x) / 4;
  const centerY = (tl.y + tr.y + br.y + bl.y) / 4;

  const top = distance(tl, tr);
  const bottom = distance(bl, br);
  const left = distance(tl, bl);
  const right = distance(tr, br);
  const avgEdge = (top + bottom + left + right) / 4;
  const frameDim = Math.max(1, Math.min(frameWidth, frameHeight));
  const relativeSize = Math.min(1, avgEdge / frameDim);

  const rotationRad = Math.atan2(tr.y - tl.y, tr.x - tl.x);

  const horizSkew = Math.abs(top - bottom) / Math.max(top, bottom, 1);
  const vertSkew = Math.abs(left - right) / Math.max(left, right, 1);
  const skew = Math.max(0, Math.min(1, (horizSkew + vertSkew) / 2));

  return { centerX, centerY, relativeSize, rotationRad, skew };
}

function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}
