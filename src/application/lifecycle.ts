import {
  AttentionTracker,
  defaultAttentionConfig,
  type AttentionConfig,
} from '../domain/attention.js';
import { deriveAudioState } from '../domain/audioState.js';
import { summarisePose } from '../domain/pose.js';
import { deriveVisualState, defaultVisualMapping } from '../domain/visualState.js';
import type {
  AttentionState,
  AudioState,
  Detection,
  FrameSample,
  PoseSummary,
  VisualState,
} from '../types/domain.js';

export interface Snapshot {
  readonly timestamp: number;
  readonly detection: Detection | null;
  readonly attention: AttentionState;
  readonly pose: PoseSummary | null;
  readonly visual: VisualState;
  readonly audio: AudioState;
}

export interface LifecycleConfig {
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly reduceMotion: boolean;
  readonly attention?: AttentionConfig;
}

export interface Lifecycle {
  observe(sample: FrameSample): Snapshot;
  snapshot(): Snapshot | null;
  reset(): void;
  setReduceMotion(value: boolean): void;
}

export function createLifecycle(config: LifecycleConfig): Lifecycle {
  const tracker = new AttentionTracker(config.attention ?? defaultAttentionConfig);
  let reduceMotion = config.reduceMotion;
  let lastSnapshot: Snapshot | null = null;

  return {
    observe(sample) {
      const attention = tracker.observe(sample);
      const pose = sample.detection
        ? summarisePose(sample.detection, config.frameWidth, config.frameHeight)
        : null;
      const visual = deriveVisualState(attention, pose, {
        ...defaultVisualMapping,
        reduceMotion,
      });
      const audio = deriveAudioState(attention, pose);
      const snapshot: Snapshot = {
        timestamp: sample.timestamp,
        detection: sample.detection,
        attention,
        pose,
        visual,
        audio,
      };
      lastSnapshot = snapshot;
      return snapshot;
    },
    snapshot() {
      return lastSnapshot;
    },
    reset() {
      tracker.reset();
      lastSnapshot = null;
    },
    setReduceMotion(value) {
      reduceMotion = value;
    },
  };
}
