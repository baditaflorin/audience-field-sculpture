import { describe, expect, it, vi } from 'vitest';
import { runFrame } from '../src/primitives/safe-tick.js';

describe('runFrame', () => {
  it('returns ok(undefined) when fn completes without throwing', () => {
    const fn = vi.fn();
    const result = runFrame(fn);
    expect(result.ok).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('catches a thrown Error and returns it as err, instead of propagating', () => {
    const boom = new Error('detector exploded on a malformed frame');
    const result = runFrame(() => {
      throw boom;
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(boom);
  });

  it('catches non-Error throws — some third-party libraries throw plain strings', () => {
    const result = runFrame(() => {
      // Simulating a third-party dependency (js-aruco2) that throws plain strings.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'not an Error instance';
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('not an Error instance');
  });

  it('runs fn exactly once and stops at the first throw (no partial re-entry)', () => {
    let calls = 0;
    const result = runFrame(() => {
      calls++;
      throw new Error('fails every time');
    });
    expect(calls).toBe(1);
    expect(result.ok).toBe(false);
  });
});
