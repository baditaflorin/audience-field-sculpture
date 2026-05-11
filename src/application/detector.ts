import jsAruco from 'js-aruco2';
import type { ArucoMarker } from 'js-aruco2';
import { cornersFromArray } from '../domain/pose.js';
import type { Detection, FrameSample } from '../types/domain.js';
import type { DictionaryName } from './settings.js';

interface DetectorOptions {
  dictionaryName: string;
  maxHammingDistance?: number;
}

interface DetectorInstance {
  detect(imageData: ImageData): ArucoMarker[];
}

interface ArNamespace {
  Detector: new (options?: DetectorOptions) => DetectorInstance;
}

interface ArucoModuleShape {
  AR?: ArNamespace;
  default?: { AR?: ArNamespace };
}

export interface DetectorConfig {
  readonly dictionary: DictionaryName;
  readonly expectedTagId: number;
  readonly maxHammingDistance?: number;
}

export interface MarkerDetector {
  process(imageData: ImageData, timestamp: number): FrameSample;
  setExpectedTagId(id: number): void;
  rebuild(config: DetectorConfig): void;
}

function resolveAR(): ArNamespace {
  const mod = jsAruco as ArucoModuleShape;
  if (mod.AR) return mod.AR;
  if (mod.default?.AR) return mod.default.AR;
  throw new Error('js-aruco2: AR namespace not found on imported module');
}

export function createMarkerDetector(initial: DetectorConfig): MarkerDetector {
  const AR = resolveAR();
  let expectedTagId = initial.expectedTagId;
  let detector: DetectorInstance = buildDetector(AR, initial);

  return {
    process(imageData, timestamp) {
      const markers = detector.detect(imageData);
      const match = markers.find((m) => m.id === expectedTagId);
      if (!match) return { timestamp, detection: null };
      const detection: Detection = {
        tagId: match.id,
        timestamp,
        corners: cornersFromArray(match.corners),
      };
      return { timestamp, detection };
    },
    setExpectedTagId(id) {
      expectedTagId = id;
    },
    rebuild(config) {
      detector = buildDetector(AR, config);
      expectedTagId = config.expectedTagId;
    },
  };
}

function buildDetector(AR: ArNamespace, config: DetectorConfig): DetectorInstance {
  const options: DetectorOptions = { dictionaryName: config.dictionary };
  if (config.maxHammingDistance !== undefined) {
    options.maxHammingDistance = config.maxHammingDistance;
  }
  return new AR.Detector(options);
}
