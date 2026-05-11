import { describe, expect, it } from 'vitest';
import { createSimulation } from '../src/application/simulation.js';

describe('simulation', () => {
  it('yields detections most of the time and gaps some of the time over a 10s window', () => {
    const sim = createSimulation({ width: 320, height: 240, tagId: 0 });
    let detected = 0;
    let total = 0;
    for (let t = 0; t < 10_000; t += 50) {
      total++;
      if (sim.sample(t).detection) detected++;
    }
    expect(detected).toBeGreaterThan(total * 0.5);
    expect(detected).toBeLessThan(total * 0.95);
  });

  it('produces valid 4-corner detections when visible', () => {
    const sim = createSimulation({ width: 200, height: 200, tagId: 3 });
    for (let t = 0; t < 5_000; t += 50) {
      const sample = sim.sample(t);
      if (sample.detection) {
        expect(sample.detection.tagId).toBe(3);
        const c = sample.detection.corners;
        expect(c.tl.x).toBeGreaterThan(0);
        expect(c.tl.x).toBeLessThan(200);
        return;
      }
    }
    throw new Error('expected at least one detection');
  });

  it('different seeds produce different visibility patterns', () => {
    const a = createSimulation({ width: 200, height: 200, tagId: 0, seed: 0 });
    const b = createSimulation({ width: 200, height: 200, tagId: 0, seed: 1 });
    let diff = 0;
    for (let t = 0; t < 5_000; t += 100) {
      const av = a.sample(t).detection !== null;
      const bv = b.sample(t).detection !== null;
      if (av !== bv) diff++;
    }
    expect(diff).toBeGreaterThan(0);
  });
});
