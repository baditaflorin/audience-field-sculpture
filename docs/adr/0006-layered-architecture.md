# ADR 0006 — Layered architecture and one-way imports

Status: Accepted
Date: 2026-05-11

## Context

Even at v1 scale the codebase has several boundaries we want to keep clean: pure domain
mathematics (attention, pose, visual/audio derivation), application orchestration
(detector, simulation, lifecycle, settings), I/O primitives (camera, audio, storage), and
UI (DOM bindings).

## Decision

Four directories, imports flow strictly downward:

- `src/ui/` → may import from `application/`, `domain/`, `primitives/`, `types/`.
- `src/application/` → may import from `domain/`, `primitives/`, `types/`.
- `src/domain/` → may import from `primitives/`, `types/`. **No DOM, no browser APIs.**
- `src/primitives/` → may import from `types/` only. Building blocks: time, clamping,
  `Result<T, E>`, persistence, camera, audio, frame-grabber.
- `src/types/` → leaf. Pure type declarations.

## Consequences

- `src/domain/*.ts` is testable in pure Node (jsdom is used only to satisfy `localStorage` in
  the persistence test). Domain tests do not import any UI or DOM API.
- A change in the visual look does not force a domain re-test; a change in attention math
  does not force a UI re-render path change.
- The boundaries are enforced socially and by review; we did not add a lint rule because the
  layer count is small. If a violation appears, the right answer is usually to move the
  helper, not to import upward.
