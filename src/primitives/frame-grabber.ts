import { type Result, ok, err } from './result.js';

export interface FrameGrabber {
  readonly width: number;
  readonly height: number;
  grab(): ImageData | null;
  dispose(): void;
}

export interface VideoFrameGrabberConfig {
  readonly video: HTMLVideoElement;
  readonly maxDimension: number;
}

export function createVideoFrameGrabber(
  config: VideoFrameGrabberConfig
): Result<FrameGrabber, Error> {
  const { video, maxDimension } = config;
  const naturalWidth = video.videoWidth || video.clientWidth;
  const naturalHeight = video.videoHeight || video.clientHeight;
  if (naturalWidth === 0 || naturalHeight === 0) {
    return err(new Error('video has no dimensions yet'));
  }
  const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return err(new Error('cannot create 2D context for frame grabber'));
  }

  let disposed = false;
  return ok({
    width,
    height,
    grab() {
      if (disposed) return null;
      if (video.readyState < 2) return null;
      try {
        ctx.drawImage(video, 0, 0, width, height);
        return ctx.getImageData(0, 0, width, height);
      } catch {
        return null;
      }
    },
    dispose() {
      disposed = true;
    },
  });
}
