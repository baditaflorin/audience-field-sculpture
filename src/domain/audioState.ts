import type { AttentionState, AudioState, PoseSummary } from '../types/domain.js';
import { clamp, lerp } from '../primitives/clamp.js';

export interface AudioMapping {
  readonly baseCarrierHz: number;
  readonly carrierSpreadHz: number;
  readonly baseModulatorHz: number;
  readonly modulatorSpreadHz: number;
  readonly maxAmplitude: number;
  readonly maxNoise: number;
}

export const defaultAudioMapping: AudioMapping = {
  baseCarrierHz: 110,
  carrierSpreadHz: 220,
  baseModulatorHz: 0.4,
  modulatorSpreadHz: 1.8,
  maxAmplitude: 0.7,
  maxNoise: 0.12,
};

export function deriveAudioState(
  attention: AttentionState,
  pose: PoseSummary | null,
  mapping: AudioMapping = defaultAudioMapping
): AudioState {
  const proximity = pose ? clamp(pose.relativeSize * 1.6, 0, 1) : 0;
  const carrierHz =
    mapping.baseCarrierHz +
    (1 - proximity) * mapping.carrierSpreadHz * 0.4 +
    attention.intensity * mapping.carrierSpreadHz * 0.6;
  const modulatorHz = mapping.baseModulatorHz + attention.intensity * mapping.modulatorSpreadHz;
  const amplitude = lerp(0, mapping.maxAmplitude, attention.intensity);
  const noiseLevel = lerp(
    0,
    mapping.maxNoise,
    attention.trend === 'rising' ? attention.intensity : attention.intensity * 0.4
  );

  return {
    carrierHz: clamp(carrierHz, 40, 1200),
    modulatorHz: clamp(modulatorHz, 0.05, 8),
    amplitude: clamp(amplitude, 0, 1),
    noiseLevel: clamp(noiseLevel, 0, 0.4),
  };
}
