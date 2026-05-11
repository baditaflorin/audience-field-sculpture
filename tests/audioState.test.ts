import { describe, expect, it } from 'vitest';
import { defaultAudioMapping, deriveAudioState } from '../src/domain/audioState.js';
import type { AttentionState, PoseSummary } from '../src/types/domain.js';

const idle: AttentionState = { intensity: 0, trend: 'steady', windowMs: 6000, sampleCount: 0 };
const peak: AttentionState = { intensity: 1, trend: 'rising', windowMs: 6000, sampleCount: 30 };
const pose: PoseSummary = {
  centerX: 0,
  centerY: 0,
  relativeSize: 0.4,
  rotationRad: 0,
  skew: 0,
};

describe('deriveAudioState', () => {
  it('amplitude near zero at idle', () => {
    expect(deriveAudioState(idle, null).amplitude).toBeLessThan(0.05);
  });

  it('amplitude approaches max at peak', () => {
    expect(deriveAudioState(peak, pose).amplitude).toBeGreaterThanOrEqual(
      defaultAudioMapping.maxAmplitude - 0.05
    );
  });

  it('carrier stays within audible safe band', () => {
    for (let i = 0; i <= 10; i++) {
      const attention: AttentionState = {
        intensity: i / 10,
        trend: 'steady',
        windowMs: 6000,
        sampleCount: 10,
      };
      const out = deriveAudioState(attention, pose);
      expect(out.carrierHz).toBeGreaterThanOrEqual(40);
      expect(out.carrierHz).toBeLessThanOrEqual(1200);
    }
  });

  it('noise rises with rising trend more than steady', () => {
    const rising: AttentionState = { ...peak, trend: 'rising' };
    const steady: AttentionState = { ...peak, trend: 'steady' };
    expect(deriveAudioState(rising, pose).noiseLevel).toBeGreaterThan(
      deriveAudioState(steady, pose).noiseLevel
    );
  });

  it('modulator stays inside [0.05, 8]', () => {
    for (let i = 0; i <= 10; i++) {
      const attention: AttentionState = {
        intensity: i / 10,
        trend: 'steady',
        windowMs: 6000,
        sampleCount: 10,
      };
      const out = deriveAudioState(attention, pose);
      expect(out.modulatorHz).toBeGreaterThanOrEqual(0.05);
      expect(out.modulatorHz).toBeLessThanOrEqual(8);
    }
  });
});
