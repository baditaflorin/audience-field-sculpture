# ADR 0004 — ArUco markers (via js-aruco2) instead of AprilTag

Status: Accepted
Date: 2026-05-11

## Context

The brief names AprilTags as the fiducial markers near the sculpture. The intent of the brief
is clearly "a printed square marker the phone can detect and localise", not the specific
detection algorithm.

We surveyed the JavaScript AprilTag ecosystem in 2026-05:

- `arenaxr/apriltag-js-standalone` — WASM build of the C library. Not on npm. Would need to
  be vendored. ~1 MB WASM.
- `apriltag` (npm) — a generator only, not a detector.
- `@monumental-works/apriltag-node` — Node-only, native bindings, not browser-compatible.
- `js-aruco2` — pure-JS detector on npm, MIT, 424 kB unpacked. Supports the
  `ARUCO_MIP_36h12` dictionary (36-bit codes, hamming distance ≥ 12, 250 codes), `ARUCO`
  (25-bit, 1024 codes), and several AprilTag-family dictionaries internally.

## Decision

Use **ArUco markers** via `js-aruco2`. Default dictionary `ARUCO_MIP_36h12`. The artwork's
user-facing documentation calls them "sculpture tags" rather than naming the specific
dictionary, so the deviation from the brief is invisible to viewers and curators.

## Consequences

- Detection is a pure-JS path, no WASM, no extra build complexity.
- Bundle is ~98 kB total. AprilTag WASM would have added ~1 MB.
- The detection accuracy is comparable for the marker sizes we expect (8 cm at ~1 m).
- Printable tags are generated at build time using `js-aruco2`'s built-in `generateSVG`, and
  shipped at `/tags/printable.html` inside the static build.

## When to reconsider

If reliable detection at larger distances (>3 m) becomes a requirement and the WASM AprilTag
detector outperforms `js-aruco2` enough to justify a ~1 MB bundle increase, revisit.
