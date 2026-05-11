import { describe, expect, it } from 'vitest';
import { createLifecycle } from '../src/application/lifecycle.js';
import { cornersFromArray } from '../src/domain/pose.js';
import type { FrameSample } from '../src/types/domain.js';

function sample(t: number, detected: boolean): FrameSample {
  if (!detected) return { timestamp: t, detection: null };
  return {
    timestamp: t,
    detection: {
      tagId: 0,
      timestamp: t,
      corners: cornersFromArray([
        { x: 80, y: 80 },
        { x: 160, y: 80 },
        { x: 160, y: 160 },
        { x: 80, y: 160 },
      ]),
    },
  };
}

describe('lifecycle', () => {
  it('builds a snapshot from a sample with no detection', () => {
    const lifecycle = createLifecycle({ frameWidth: 240, frameHeight: 320, reduceMotion: false });
    const snapshot = lifecycle.observe(sample(0, false));
    expect(snapshot.detection).toBeNull();
    expect(snapshot.pose).toBeNull();
    expect(snapshot.attention.intensity).toBeLessThan(0.2);
    expect(snapshot.audio.amplitude).toBeLessThan(0.1);
  });

  it('builds a snapshot with pose + visual + audio when detection is present', () => {
    const lifecycle = createLifecycle({ frameWidth: 240, frameHeight: 320, reduceMotion: false });
    let snapshot;
    for (let t = 0; t <= 4000; t += 50) snapshot = lifecycle.observe(sample(t, true));
    expect(snapshot).toBeTruthy();
    if (!snapshot) return;
    expect(snapshot.pose).not.toBeNull();
    expect(snapshot.visual.intensity).toBeGreaterThan(0.3);
    expect(snapshot.audio.amplitude).toBeGreaterThan(0.2);
  });

  it('reset clears state', () => {
    const lifecycle = createLifecycle({ frameWidth: 240, frameHeight: 320, reduceMotion: false });
    for (let t = 0; t <= 3000; t += 50) lifecycle.observe(sample(t, true));
    const before = lifecycle.snapshot();
    expect(before).not.toBeNull();
    lifecycle.reset();
    expect(lifecycle.snapshot()).toBeNull();
  });

  it('setReduceMotion zeroes the visual pulse rate', () => {
    const lifecycle = createLifecycle({ frameWidth: 240, frameHeight: 320, reduceMotion: false });
    for (let t = 0; t <= 4000; t += 50) lifecycle.observe(sample(t, true));
    const before = lifecycle.snapshot();
    expect(before?.visual.pulseHz).toBeGreaterThan(0);
    lifecycle.setReduceMotion(true);
    const next = lifecycle.observe(sample(4050, true));
    expect(next.visual.pulseHz).toBe(0);
  });

  it('snapshot returns the most recent observation', () => {
    const lifecycle = createLifecycle({ frameWidth: 240, frameHeight: 320, reduceMotion: false });
    const out = lifecycle.observe(sample(0, true));
    expect(lifecycle.snapshot()).toEqual(out);
  });
});
