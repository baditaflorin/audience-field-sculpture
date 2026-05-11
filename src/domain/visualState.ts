import type { AttentionState, PoseSummary, VisualState } from '../types/domain.js';
import { clamp, lerp } from '../primitives/clamp.js';

export interface VisualMapping {
  readonly baseHueDeg: number;
  readonly hueSpreadDeg: number;
  readonly maxParticles: number;
  readonly basePulseHz: number;
  readonly reduceMotion: boolean;
}

export const defaultVisualMapping: VisualMapping = {
  baseHueDeg: 190,
  hueSpreadDeg: 140,
  maxParticles: 90,
  basePulseHz: 0.6,
  reduceMotion: false,
};

export function deriveVisualState(
  attention: AttentionState,
  pose: PoseSummary | null,
  mapping: VisualMapping = defaultVisualMapping
): VisualState {
  const proximity = pose ? clamp(pose.relativeSize * 1.6, 0, 1) : 0;
  const skewPenalty = pose ? 1 - clamp(pose.skew, 0, 0.8) : 1;
  const hueDeg =
    (mapping.baseHueDeg + attention.intensity * mapping.hueSpreadDeg + proximity * 30) % 360;

  const saturation = clamp(0.35 + attention.intensity * 0.55, 0.2, 0.95);
  const intensity = clamp(attention.intensity * 0.7 + proximity * 0.4 * skewPenalty, 0, 1);
  const particleCount = Math.round(lerp(8, mapping.maxParticles, attention.intensity));
  const pulseHz = mapping.reduceMotion
    ? 0
    : clamp(mapping.basePulseHz + attention.intensity * 1.2, 0.1, 2.2);

  return { hueDeg, saturation, intensity, particleCount, pulseHz };
}
