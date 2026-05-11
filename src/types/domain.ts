export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface QuadCorners {
  readonly tl: Vec2;
  readonly tr: Vec2;
  readonly br: Vec2;
  readonly bl: Vec2;
}

export interface Detection {
  readonly tagId: number;
  readonly corners: QuadCorners;
  readonly timestamp: number;
}

export interface AttentionState {
  readonly intensity: number;
  readonly trend: 'rising' | 'falling' | 'steady';
  readonly windowMs: number;
  readonly sampleCount: number;
}

export interface PoseSummary {
  readonly centerX: number;
  readonly centerY: number;
  readonly relativeSize: number;
  readonly rotationRad: number;
  readonly skew: number;
}

export interface VisualState {
  readonly hueDeg: number;
  readonly saturation: number;
  readonly intensity: number;
  readonly particleCount: number;
  readonly pulseHz: number;
}

export interface AudioState {
  readonly carrierHz: number;
  readonly modulatorHz: number;
  readonly amplitude: number;
  readonly noiseLevel: number;
}

export interface FrameSample {
  readonly timestamp: number;
  readonly detection: Detection | null;
}
