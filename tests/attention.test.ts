import { describe, expect, it } from 'vitest';
import { AttentionTracker, defaultAttentionConfig } from '../src/domain/attention.js';
import type { Detection, FrameSample } from '../src/types/domain.js';

function sample(timestamp: number, detected: boolean): FrameSample {
  const detection: Detection | null = detected
    ? {
        tagId: 0,
        timestamp,
        corners: {
          tl: { x: 0, y: 0 },
          tr: { x: 10, y: 0 },
          br: { x: 10, y: 10 },
          bl: { x: 0, y: 10 },
        },
      }
    : null;
  return { timestamp, detection };
}

describe('AttentionTracker', () => {
  it('returns zero intensity before any samples', () => {
    const tracker = new AttentionTracker();
    const state = tracker.observe(sample(0, false));
    expect(state.intensity).toBeGreaterThanOrEqual(0);
    expect(state.intensity).toBeLessThanOrEqual(0.2);
    expect(state.trend).toBe('steady');
  });

  it('rises with sustained detections', () => {
    const tracker = new AttentionTracker();
    let last = 0;
    for (let t = 0; t <= 5000; t += 50) {
      last = tracker.observe(sample(t, true)).intensity;
    }
    expect(last).toBeGreaterThan(0.6);
  });

  it('falls when detections stop', () => {
    const tracker = new AttentionTracker();
    for (let t = 0; t <= 5000; t += 50) tracker.observe(sample(t, true));
    const peak = tracker.peekIntensity();
    for (let t = 5050; t <= 12000; t += 50) tracker.observe(sample(t, false));
    const trough = tracker.peekIntensity();
    expect(trough).toBeLessThan(peak);
    expect(trough).toBeLessThan(0.3);
  });

  it('detects rising trend when detections start fresh', () => {
    const tracker = new AttentionTracker();
    for (let t = 0; t <= 2500; t += 50) tracker.observe(sample(t, false));
    let saw: 'rising' | 'falling' | 'steady' = 'steady';
    for (let t = 2550; t <= 5500; t += 50) {
      const s = tracker.observe(sample(t, true));
      if (s.trend === 'rising') saw = 'rising';
    }
    expect(saw).toBe('rising');
  });

  it('prunes samples outside the window', () => {
    const tracker = new AttentionTracker();
    for (let t = 0; t < 20000; t += 100) tracker.observe(sample(t, true));
    const state = tracker.observe(sample(20100, true));
    expect(state.sampleCount).toBeLessThanOrEqual(defaultAttentionConfig.windowMs / 100 + 2);
  });

  it('reset clears history', () => {
    const tracker = new AttentionTracker();
    for (let t = 0; t <= 3000; t += 50) tracker.observe(sample(t, true));
    expect(tracker.peekIntensity()).toBeGreaterThan(0.4);
    tracker.reset();
    expect(tracker.peekIntensity()).toBe(0);
    const fresh = tracker.observe(sample(3100, false));
    expect(fresh.sampleCount).toBe(1);
  });
});
