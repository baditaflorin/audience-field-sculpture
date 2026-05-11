# Phase 3 postmortem — Audience Field Sculpture v0.1.0

Date: 2026-05-11
Author: Florin Bădiță + Claude Code

## Context

Phase 3 is normally an audit-and-fix pass run after Phase 1 (scaffold) and Phase 2
(substance). Audience Field Sculpture is a brand-new project; the Phase 3 prompt was issued
against an empty directory. Rather than produce a theatrical "0-of-0 green" audit, the
Phase 3 acceptance bar was **baked into the first build as design constraints** (ADR 0009)
and verified as the as-shipped state.

This document answers the mandatory Phase 3 question — _could a stranger now use this app
for their own real work, end-to-end, with zero help?_ — honestly.

## Audit grids (as-shipped at v0.1.0)

There is no "before" because this is the first commit. Counts below describe the v0.1.0
state.

| Audit                         | Green | Yellow ⚠ | Red |
| ----------------------------- | ----: | -------: | --: |
| Input pathways (in scope)     |     7 |        0 |   0 |
| Output pathways (in scope)    |     6 |        1 |   0 |
| UI controls                   |    16 |        0 |   0 |
| Feature claims                |    13 |        2 |   0 |
| Codebase health (zero counts) |   n/a |      n/a | n/a |

The 1 yellow on outputs is the Print/PDF row — the printable tags page is print-styled but
the main artwork is not, by intent. The 2 yellow feature claims are the brief's "2-second
detection" and "≥15 FPS" success metrics, which require a real phone to verify and are
tracked as v1.1 measurement debt.

## Codebase health metrics

| Metric                                                   | Target | Actual at v0.1.0 |
| -------------------------------------------------------- | -----: | ---------------: |
| `TODO` / `FIXME` / `XXX` / `HACK` in source              |      0 |                0 |
| `any` / `@ts-ignore` / `@ts-expect-error` / unsafe casts |      0 |                0 |
| ESLint errors at commit time                             |      0 |                0 |
| TypeScript errors at commit time                         |      0 |                0 |
| Stubs / placeholder toggles in production UI             |      0 |                0 |
| Tests passing                                            |     42 |               42 |
| Coverage on tested layers (statements)                   |   ≥85% |           93.56% |
| LOC: TypeScript source                                   |    n/a |            2 135 |
| LOC: tests                                               |    n/a |              447 |
| Bundle: JS (gzipped)                                     | ≤50 kB |          32.5 kB |
| Bundle: CSS (gzipped)                                    | ≤10 kB |           1.6 kB |

## Half-baked feature triage

None. v0.1.0 explicitly carries no half-baked features (ADR 0010 enumerates the in-scope
list and the deliberate cuts). Three things were considered and cut:

| Item                        | Decision     | Why                                                                                  |
| --------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `POS.Posit` 3D pose tracker | not imported | Adds bundle weight without a v1 feature that uses it. v2 candidate.                  |
| WebGPU shader visuals       | not built    | iOS Safari support is patchy in 2026-05; 2D-canvas is the right tool now.            |
| Multi-phone WebRTC mesh     | not built    | Mode A architecture forbids it; the privacy story is stronger without it (ADR 0003). |

## Stranger-test findings and top-3 fixes

Top-3 issues found during the testable portion of the stranger test (UI flow, settings
persistence, simulated demo). All three were fixed before tagging:

1. Error pill auto-hid too aggressively — fixed to keep errors visible until the next
   `show()`.
2. Reset-all-settings didn't re-sync the menu inputs — fixed.
3. AudioContext could be left suspended on iOS Safari without a user gesture — fixed by
   tying `audio.start()` to the camera/demo click paths.

The portion of the stranger test that needs a real phone in real light is documented as
v1.1 measurement debt in `docs/phase3/stranger-test.md`.

## Documentation–reality mismatches found and fixed

Two were caught while writing the feature-claims audit:

1. The brief used "AprilTag"; the shipped artwork uses ArUco markers via `js-aruco2`. The
   README, the in-app menu, and ADR 0004 all describe this honestly. User-facing copy says
   "sculpture tags" rather than naming the specific dictionary, so the deviation is
   invisible to viewers.
2. Two brief success metrics (2-second detection, 15 FPS) were initially going to be
   claimed as green; they are correctly marked ⚠ partial across README, audit, and
   stranger-test because they have not been measured on a real phone yet.

## What surprised me

- `js-aruco2`'s API is CommonJS with a `this.AR = AR` global-attach pattern. Vite's CJS
  interop handles it, but the import shape required a tiny shim in
  `src/application/detector.ts`. Not a problem, just unusual for a 2026 npm package.
- Phase 3 written _against an empty codebase_ really would have been theatre. Catching that
  early and converting it to "Phase 3 standards as day-one constraints" was the right call.
  ADR 0009 documents the substitution; ADR 0010 enumerates what was shipped vs explicitly
  cut, so future audits have a reference point.
- The total bundle came in at 32 kB gzipped including the ArUco detector. WebGPU + Three.js
  would have pushed this past 200 kB without making the artwork better.

## Open completeness gaps (Phase 4 candidates)

1. Real-phone measurement of 2-second detection target and 15 FPS sustained.
2. FPS readout in the debug overlay.
3. "I see tag id N but you're expecting M" mismatch hint.
4. Print scale reference next to markers on the printable page.
5. (Maybe) `POS.Posit` 3D pose tracker to drive a marker-plane-aligned visual.

## Honest answer to the mandatory question

> _Could a stranger now use this app for their own real work, end-to-end, with zero help?_

**Mostly yes — with one caveat.** A stranger who opens the live URL on a phone, prints a
marker from the bundled printable page, and points at it will get the full experience
without asking any questions. The onboarding sheet, status pill, and menu copy guide them
through both the permission-granted path and the permission-denied path (which routes to
the simulated demo). The Privacy page is one tap away and is plain English.

**The caveat:** I cannot yet _claim_ the 2-second detection and 15 FPS targets without
running the artwork on a real phone in real light. The code is right; the metric is
unmeasured. Anyone who insists on those numbers being green should run the stranger test on
a phone before deploying to a public sculpture installation. The README, audit, and
stranger-test all say this explicitly — no fluff.
