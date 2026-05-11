import type { AttentionState, FrameSample } from '../types/domain.js';
import { clamp, smoothstep } from '../primitives/clamp.js';

export interface AttentionConfig {
  readonly windowMs: number;
  readonly trendDeltaThreshold: number;
}

export const defaultAttentionConfig: AttentionConfig = {
  windowMs: 6000,
  trendDeltaThreshold: 0.05,
};

interface InternalSample {
  readonly timestamp: number;
  readonly detected: boolean;
}

export class AttentionTracker {
  private samples: InternalSample[] = [];
  private lastIntensity = 0;

  constructor(private readonly config: AttentionConfig = defaultAttentionConfig) {}

  observe(sample: FrameSample): AttentionState {
    this.samples.push({ timestamp: sample.timestamp, detected: sample.detection !== null });
    this.prune(sample.timestamp);
    const state = this.computeState(sample.timestamp);
    this.lastIntensity = state.intensity;
    return state;
  }

  reset(): void {
    this.samples = [];
    this.lastIntensity = 0;
  }

  private prune(now: number): void {
    const cutoff = now - this.config.windowMs;
    while (this.samples.length > 0) {
      const head = this.samples[0];
      if (!head || head.timestamp >= cutoff) break;
      this.samples.shift();
    }
  }

  // Trend compares density in the most-recent half-window to the prior
  // half-window, so it reflects medium-term change rather than per-tick noise.
  private computeState(now: number): AttentionState {
    if (this.samples.length === 0) {
      return {
        intensity: 0,
        trend: 'steady',
        windowMs: this.config.windowMs,
        sampleCount: 0,
      };
    }

    const halfWindow = this.config.windowMs / 2;
    const midpoint = now - halfWindow;
    let detectedCount = 0;
    let recentDetected = 0;
    let recentTotal = 0;
    let priorDetected = 0;
    let priorTotal = 0;
    for (const s of this.samples) {
      if (s.detected) detectedCount++;
      if (s.timestamp >= midpoint) {
        recentTotal++;
        if (s.detected) recentDetected++;
      } else {
        priorTotal++;
        if (s.detected) priorDetected++;
      }
    }
    const density = detectedCount / this.samples.length;
    const recentDensity = recentTotal === 0 ? 0 : recentDetected / recentTotal;
    const priorDensity = priorTotal === 0 ? 0 : priorDetected / priorTotal;
    const dwellBoost = smoothstep(2, this.config.windowMs / 1000, this.samples.length * 0.05);
    const intensity = clamp(density * 0.6 + recentDensity * 0.4 + dwellBoost * 0.15, 0, 1);

    const delta = recentDensity - priorDensity;
    const trend: AttentionState['trend'] =
      delta > this.config.trendDeltaThreshold
        ? 'rising'
        : delta < -this.config.trendDeltaThreshold
          ? 'falling'
          : 'steady';

    return {
      intensity,
      trend,
      windowMs: this.config.windowMs,
      sampleCount: this.samples.length,
    };
  }

  peekIntensity(): number {
    return this.lastIntensity;
  }
}
