# ADR 0002 — Tech Stack: Vite + TypeScript, vanilla DOM, 2D canvas

Status: Accepted
Date: 2026-05-11

## Context

We need a small, fast, mobile-first artwork that loads quickly on a phone and runs reliably in
Safari (iOS) and Chrome (Android). It must build to static files with no server-side
rendering.

## Decision

- **Build**: Vite 6 with TypeScript strict mode, output to `docs/`.
- **Runtime**: vanilla TypeScript and DOM APIs. No UI framework.
- **Rendering**: 2D canvas (`CanvasRenderingContext2D`). WebGPU is not available in iOS Safari
  in 2026-05 across all major iOS versions, and WebGL2 is overkill for the visual language
  we want (soft, painterly).
- **Audio**: Web Audio API directly. No external library.
- **Validation**: Zod for boundary schemas (settings, persisted state).
- **Testing**: Vitest. Domain logic is pure functions, tested in isolation.

## Consequences

- Tiny dependency footprint. `js-aruco2`, `zod`, and the tooling — no UI library tree.
- The whole app ships as a single 97 kB JS bundle (32 kB gzipped).
- Component-style ergonomics are foregone; UI wiring is direct DOM event listeners. This is
  cheap because the UI is small (one stage + one menu + one onboarding sheet).
- WebGPU experiments would mean a future ADR.

## Alternatives considered

- React + Vite: adds ~40 kB gzipped for almost no benefit on a single-page artwork.
- Three.js + WebGL: heavyweight and the visual goal is painterly, not 3D-textured.
- Svelte: also viable, but vanilla TS keeps the bundle smaller.
