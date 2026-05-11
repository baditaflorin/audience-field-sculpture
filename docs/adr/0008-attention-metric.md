# ADR 0008 — Attention metric

Status: Accepted
Date: 2026-05-11

## Context

We need a per-phone scalar that drives the visual and audio response. Per ADR 0003 the metric
must be computable from this phone's own observations alone — no cross-phone signal.

## Decision

`AttentionTracker` in `src/domain/attention.ts` maintains a sliding window of `(timestamp,
detected)` samples (default 6 s). On each `observe()` it returns:

- `intensity ∈ [0, 1]` — a weighted blend of:
  - overall detection density across the window (weight 0.6),
  - recent-half-window detection density (weight 0.4),
  - a dwell boost that ramps up after a couple of seconds of sustained presence (weight 0.15,
    smoothstep'd).
- `trend ∈ {rising, falling, steady}` — sign of `(recent-half density − prior-half density)`,
  with a 0.05 hysteresis threshold so per-frame jitter doesn't trip the trend.
- `windowMs`, `sampleCount` — for debugging and tests.

## Consequences

- Tests in `tests/attention.test.ts` cover: zero-intensity start, rising under sustained
  detection, decay when detections stop, rising trend detection on transition, pruning of
  samples past the window, and reset semantics.
- The window length, weights, and trend threshold are tunable in `defaultAttentionConfig`.
- Visual and audio derivations depend on `AttentionState` only, so future changes to the
  metric do not touch render code.
