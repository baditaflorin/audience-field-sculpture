import { type Result, ok, err } from './result.js';

/**
 * Runs `fn`, catching any synchronous exception it throws.
 *
 * This exists for the `requestAnimationFrame` loop in `src/app.ts`. That loop calls into a
 * third-party marker detector (`js-aruco2`) and into canvas/audio APIs every frame, none of
 * which come with a guarantee they cannot throw (a degenerate camera frame, a lost canvas
 * context, a browser quirk). Without this wrapper, a single thrown exception inside a frame
 * callback aborts that callback *before* it reaches the `requestAnimationFrame(tick)` call
 * that schedules the next frame — silently freezing the artwork (no more visuals, no more
 * audio updates) with no error shown and no way to recover short of a full page reload.
 */
export function runFrame(fn: () => void): Result<void, unknown> {
  try {
    fn();
    return ok(undefined);
  } catch (error) {
    return err(error);
  }
}
