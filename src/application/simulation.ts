import type { Detection, FrameSample } from '../types/domain.js';
import { cornersFromArray } from '../domain/pose.js';
import { clamp } from '../primitives/clamp.js';

export interface SimulationConfig {
  readonly width: number;
  readonly height: number;
  readonly tagId: number;
  readonly seed?: number;
}

export interface Simulation {
  sample(timestamp: number): FrameSample;
  readonly width: number;
  readonly height: number;
}

// A deterministic-ish simulation that mimics a single observer's view of the
// sculpture: the marker drifts within the frame, periodically goes out of
// view, and grows/shrinks to suggest the viewer moving closer and further.
export function createSimulation(config: SimulationConfig): Simulation {
  const seed = config.seed ?? 0;
  const phase = seed * 0.37;
  const visibilityOffset = (seed * 2117) % 7000;
  let originTimeMs = -1;

  function tagVisible(t: number): boolean {
    // Visibility pattern: visible ~78% of the time, with occasional ~1.5s gaps.
    // The per-seed offset shifts where in the cycle the gap falls so multiple
    // simulated phones don't all blink in lockstep.
    const cycle = (t + visibilityOffset) % 7000;
    return cycle < 5500;
  }

  return {
    width: config.width,
    height: config.height,
    sample(timestamp): FrameSample {
      if (originTimeMs < 0) originTimeMs = timestamp;
      const t = timestamp - originTimeMs;
      if (!tagVisible(t)) return { timestamp, detection: null };
      const cx = config.width / 2 + Math.sin(t * 0.0009 + phase) * config.width * 0.18;
      const cy = config.height / 2 + Math.cos(t * 0.0007 + phase) * config.height * 0.15;
      const sizeFactor = 0.15 + (Math.sin(t * 0.00035 + phase) + 1) * 0.18;
      const half = clamp(Math.min(config.width, config.height) * sizeFactor, 30, 220);
      const tilt = Math.sin(t * 0.0012 + phase) * 0.25;
      const cos = Math.cos(tilt);
      const sin = Math.sin(tilt);
      const offsets = [
        { x: -half, y: -half },
        { x: half, y: -half },
        { x: half, y: half },
        { x: -half, y: half },
      ];
      const corners = offsets.map(({ x, y }) => ({
        x: cx + x * cos - y * sin,
        y: cy + x * sin + y * cos,
      }));
      const detection: Detection = {
        tagId: config.tagId,
        timestamp,
        corners: cornersFromArray(corners),
      };
      return { timestamp, detection };
    },
  };
}
