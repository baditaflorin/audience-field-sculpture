import { describe, expect, it } from 'vitest';
import { defaultVisualMapping, deriveVisualState } from '../src/domain/visualState.js';
import type { AttentionState, PoseSummary } from '../src/types/domain.js';

const idle: AttentionState = { intensity: 0, trend: 'steady', windowMs: 6000, sampleCount: 0 };
const peak: AttentionState = { intensity: 1, trend: 'rising', windowMs: 6000, sampleCount: 30 };

const pose: PoseSummary = {
  centerX: 100,
  centerY: 100,
  relativeSize: 0.4,
  rotationRad: 0,
  skew: 0.1,
};

describe('deriveVisualState', () => {
  it('produces low-intensity state at idle', () => {
    const v = deriveVisualState(idle, null);
    expect(v.intensity).toBeLessThan(0.1);
    expect(v.particleCount).toBeLessThanOrEqual(15);
  });

  it('produces high-intensity state at peak attention with pose', () => {
    const v = deriveVisualState(peak, pose);
    expect(v.intensity).toBeGreaterThan(0.7);
    expect(v.particleCount).toBeGreaterThanOrEqual(defaultVisualMapping.maxParticles - 5);
  });

  it('shifts hue with attention', () => {
    const low = deriveVisualState(idle, null);
    const high = deriveVisualState(peak, null);
    expect(low.hueDeg).not.toBe(high.hueDeg);
  });

  it('sets pulseHz to 0 when reduceMotion is on', () => {
    const v = deriveVisualState(peak, pose, { ...defaultVisualMapping, reduceMotion: true });
    expect(v.pulseHz).toBe(0);
  });

  it('penalises intensity when pose is extreme skew', () => {
    const skewed: PoseSummary = { ...pose, skew: 0.9 };
    const flat: PoseSummary = { ...pose, skew: 0 };
    expect(deriveVisualState(peak, flat).intensity).toBeGreaterThan(
      deriveVisualState(peak, skewed).intensity
    );
  });

  it('hue stays inside [0, 360)', () => {
    for (let i = 0; i <= 10; i++) {
      const attention: AttentionState = {
        intensity: i / 10,
        trend: 'steady',
        windowMs: 6000,
        sampleCount: 10,
      };
      const v = deriveVisualState(attention, pose);
      expect(v.hueDeg).toBeGreaterThanOrEqual(0);
      expect(v.hueDeg).toBeLessThan(360);
    }
  });
});
