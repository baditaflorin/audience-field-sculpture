# Architecture

A single-page artwork that runs entirely in the browser. ~2.1 kLOC of TypeScript, 32 kB
gzipped JS, zero backend.

## Layers

```
            ┌──────────────────────────────┐
            │  src/ui/                      │  DOM bindings, overlay rendering, menu,
            │  overlay  menu  status        │  onboarding, status pill.
            │  onboarding                   │
            └─────────────┬─────────────────┘
                          │ imports from
            ┌─────────────▼─────────────────┐
            │  src/application/             │  Detector wrapper, simulation, lifecycle
            │  detector simulation          │  (attention + pose + visual + audio →
            │  lifecycle settings           │  Snapshot), settings store.
            └─────────────┬─────────────────┘
                          │ imports from
            ┌─────────────▼─────────────────┐
            │  src/domain/                  │  Pure functions. No DOM. No browser APIs.
            │  attention  pose              │
            │  visualState audioState       │
            └─────────────┬─────────────────┘
                          │ imports from
            ┌─────────────▼─────────────────┐
            │  src/primitives/              │  I/O wrappers (camera, audio, persistence,
            │  camera audio persistence     │  frame-grabber, time, clamp), Result<T,E>.
            │  frame-grabber time clamp     │
            │  result                       │
            └─────────────┬─────────────────┘
                          │ imports from
            ┌─────────────▼─────────────────┐
            │  src/types/                   │  Domain types + ambient declarations for
            │  domain  global.d.ts          │  js-aruco2.
            └───────────────────────────────┘
```

Imports flow strictly downward. The rule is enforced socially (per [ADR
0006](adr/0006-layered-architecture.md)) because the codebase is small enough that adding a
lint rule would be more friction than benefit.

## Data flow per frame

```
camera (or simulation)
   │
   ▼
ImageData ─► ArUco detector ─► FrameSample {timestamp, detection|null}
                                          │
                                          ▼
                                  Lifecycle.observe()
                                          │
                          ┌───────────────┼────────────────┐
                          ▼               ▼                ▼
                   AttentionTracker  summarisePose    deriveVisualState
                          │               │           deriveAudioState
                          └───────────────┴──────────────┬┘
                                                         ▼
                                                  Snapshot {detection,
                                                            attention,
                                                            pose,
                                                            visual,
                                                            audio,
                                                            timestamp}
                                                         │
                          ┌──────────────────────────────┤
                          ▼                              ▼
                   audio.apply(state)            overlay.render(snapshot)
```

The lifecycle is the single point at which sensor data becomes domain state. Every other
module either feeds into it or reads from its `Snapshot`.

## Persistence

`PersistedStore<T>` (in `src/primitives/persistence.ts`) backs `localStorage` with:

- A zod schema for validation.
- A `schemaVersion` field on every stored record.
- A migration list `Migration<T>[]` applied in order from the stored version up to the
  current version.

Tests cover defaults, save/load round-trip, validation failure, reset, corrupt JSON
recovery, and a migration. See [ADR 0007](adr/0007-persistence-schema.md).

## Audio

`createAudioEngine()` builds a small graph once on first `start()`:

```
   oscillator (modulator, sine)
        ↓
   gain (modulator depth)        oscillator (carrier, sine)
        └────────► .frequency ──── ↓
                                  gain (carrier 0.4) ─► gain (master) ─► destination
                                                              ▲
   bufferSource (noise, looped)  ─► gain (noise) ────────────┘
```

`apply(state)` uses `setTargetAtTime` with a 50–300 ms ramp so the artwork's response is
smooth rather than zippery. Mute and volume share the master gain.

## Visual overlay

2D canvas. Each frame:

1. Step particle positions (Euler integration with drag).
2. Emit up to 4 new particles per frame, parked near the marker centre.
3. Draw a radial gradient halo whose alpha pulses at `visual.pulseHz`.
4. Draw particles in `lighter` composite mode for additive bloom.
5. If `debugOverlay` is on, draw the marker outline + a small HUD onto the debug canvas.

Device-pixel-ratio is honoured so the visuals stay crisp on Retina screens.

## Why no framework

The app has one stage, one menu, one onboarding sheet. Total DOM is ~30 elements. A
framework's runtime cost (and the per-PR cognitive cost of explaining state machinery) buys
nothing here. If the artwork grows multiple stages or routes, this becomes a v2 ADR.
