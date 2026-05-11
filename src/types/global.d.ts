declare const __APP_VERSION__: string;
declare const __GIT_COMMIT__: string;
declare const __BUILT_AT__: string;
declare const __REPOSITORY_URL__: string;

declare module 'js-aruco2' {
  export interface ArucoCorner {
    x: number;
    y: number;
  }

  export interface ArucoMarker {
    id: number;
    corners: ArucoCorner[];
    hammingDistance: number;
  }

  export interface ArucoDictionaryEntry {
    nBits: number;
    tau: number;
    codeList: number[];
  }

  export const AR: {
    DICTIONARIES: Record<string, ArucoDictionaryEntry>;
    Detector: new (config?: { dictionaryName?: string; maxHammingDistance?: number }) => {
      detect(imageData: ImageData): ArucoMarker[];
      detectImage(width: number, height: number, data: Uint8ClampedArray): ArucoMarker[];
    };
    Dictionary: new (dicName: string) => {
      codeList: string[];
      tau: number;
      nBits: number;
      markSize: number;
      generateSVG(id: number): string;
    };
    Marker: new (id: number, corners: ArucoCorner[], hammingDistance: number) => ArucoMarker;
  };
}

declare module 'js-aruco2/src/posit2.js' {
  export interface PositPose {
    bestError: number;
    bestRotation: number[][];
    bestTranslation: [number, number, number];
    alternativeError: number;
    alternativeRotation: number[][];
    alternativeTranslation: [number, number, number];
  }

  export const POS: {
    Posit: new (
      modelSize: number,
      focalLength: number
    ) => {
      pose(corners: { x: number; y: number }[]): PositPose;
    };
  };
}
