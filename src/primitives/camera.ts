import { type Result, ok, err } from './result.js';

export interface CameraStreamConfig {
  readonly facingMode: 'environment' | 'user';
  readonly idealWidth: number;
  readonly idealHeight: number;
}

export interface CameraStream {
  readonly mediaStream: MediaStream;
  readonly track: MediaStreamTrack;
  stop(): void;
}

export type CameraError =
  | { kind: 'unsupported' }
  | { kind: 'permission-denied' }
  | { kind: 'no-device' }
  | { kind: 'in-use' }
  | { kind: 'other'; message: string };

export async function openCamera(
  config: CameraStreamConfig
): Promise<Result<CameraStream, CameraError>> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return err({ kind: 'unsupported' });
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: config.facingMode },
        width: { ideal: config.idealWidth },
        height: { ideal: config.idealHeight },
      },
    });
    const track = stream.getVideoTracks()[0];
    if (!track) {
      stream.getTracks().forEach((t) => t.stop());
      return err({ kind: 'no-device' });
    }
    return ok({
      mediaStream: stream,
      track,
      stop() {
        stream.getTracks().forEach((t) => t.stop());
      },
    });
  } catch (e) {
    const errLike = e as { name?: string; message?: string };
    const name = errLike.name ?? '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      return err({ kind: 'permission-denied' });
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      return err({ kind: 'no-device' });
    }
    if (name === 'NotReadableError' || name === 'AbortError') {
      return err({ kind: 'in-use' });
    }
    return err({ kind: 'other', message: errLike.message ?? String(e) });
  }
}

export function describeCameraError(e: CameraError): string {
  switch (e.kind) {
    case 'unsupported':
      return 'This browser cannot open a camera. Try Safari on iOS or Chrome on Android.';
    case 'permission-denied':
      return 'Camera permission was declined. Use the simulated demo, or grant access in browser settings and reload.';
    case 'no-device':
      return 'No camera matched the requested settings. Try the simulated demo.';
    case 'in-use':
      return 'The camera is in use by another app. Close it and try again.';
    case 'other':
      return `Camera failed: ${e.message}`;
  }
}
