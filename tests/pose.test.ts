import { describe, expect, it } from 'vitest';
import { cornersFromArray, summarisePose } from '../src/domain/pose.js';
import type { Detection } from '../src/types/domain.js';

function detection(corners: readonly { x: number; y: number }[]): Detection {
  return { tagId: 0, timestamp: 0, corners: cornersFromArray(corners) };
}

describe('summarisePose', () => {
  it('computes centered pose for a centered square', () => {
    const det = detection([
      { x: 40, y: 40 },
      { x: 80, y: 40 },
      { x: 80, y: 80 },
      { x: 40, y: 80 },
    ]);
    const pose = summarisePose(det, 120, 120);
    expect(pose.centerX).toBe(60);
    expect(pose.centerY).toBe(60);
    expect(pose.relativeSize).toBeCloseTo(40 / 120, 4);
    expect(pose.skew).toBeLessThan(0.05);
    expect(pose.rotationRad).toBeCloseTo(0, 4);
  });

  it('reports rotation for tilted marker', () => {
    const det = detection([
      { x: 50, y: 40 },
      { x: 80, y: 50 },
      { x: 70, y: 80 },
      { x: 40, y: 70 },
    ]);
    const pose = summarisePose(det, 120, 120);
    expect(pose.rotationRad).toBeGreaterThan(0);
  });

  it('higher skew when perspective is extreme', () => {
    const flat = detection([
      { x: 30, y: 30 },
      { x: 90, y: 30 },
      { x: 90, y: 90 },
      { x: 30, y: 90 },
    ]);
    const skewed = detection([
      { x: 30, y: 30 },
      { x: 90, y: 40 },
      { x: 70, y: 90 },
      { x: 40, y: 70 },
    ]);
    const a = summarisePose(flat, 120, 120);
    const b = summarisePose(skewed, 120, 120);
    expect(b.skew).toBeGreaterThan(a.skew);
  });

  it('relative size grows with marker filling more of the frame', () => {
    const small = detection([
      { x: 10, y: 10 },
      { x: 30, y: 10 },
      { x: 30, y: 30 },
      { x: 10, y: 30 },
    ]);
    const big = detection([
      { x: 10, y: 10 },
      { x: 110, y: 10 },
      { x: 110, y: 110 },
      { x: 10, y: 110 },
    ]);
    const a = summarisePose(small, 120, 120);
    const b = summarisePose(big, 120, 120);
    expect(b.relativeSize).toBeGreaterThan(a.relativeSize);
  });
});

describe('cornersFromArray', () => {
  it('throws if fewer than 4 corners', () => {
    expect(() => cornersFromArray([{ x: 0, y: 0 }])).toThrowError();
  });
});
