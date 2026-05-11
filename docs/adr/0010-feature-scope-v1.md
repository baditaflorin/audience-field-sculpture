# ADR 0010 — Feature scope for v1

Status: Accepted
Date: 2026-05-11

## Context

To respect the "no half-baked features" Phase 3 standard, we explicitly enumerate what is in
and what is out of scope for v1.

## In scope

- Open the rear camera on a phone (HTTPS only; GitHub Pages provides it).
- Detect a printed `ARUCO_MIP_36h12` marker via `js-aruco2`.
- Maintain a 6-second sliding-window attention metric (ADR 0008).
- Render a 2D-canvas visual overlay whose hue, intensity, particle count and pulse rate
  shift with attention and pose.
- Play a Web-Audio drone whose carrier, modulator, amplitude and noise shift with attention.
- A simulated demo mode that runs without camera permission.
- A menu with: source switching, dictionary/tag-id selection, volume, mute, debug overlay
  toggle, reduce-motion toggle, reset, about/version.
- Printable tags page (eight markers, ids 0–7).
- Privacy page explicit about what is and is not collected.
- GitHub Pages build with version metadata.

## Out of scope for v1 (explicitly cut)

- WebGPU / shader-based visuals. ADR 0002.
- Multi-phone communication of any kind. ADR 0003.
- Pose-based 3D camera tracking (yaw/pitch/roll) using `POS.Posit`. Computed but not yet
  used as a driver. Marked as dormant code? — **no**, see below.
- AR overlay aligned to marker plane (occluding texture). v2 candidate.
- Microphone / "ambient sound shifts the artwork". Explicit non-goal per the brief.
- Service worker / offline cache. Possible v2, no compelling user need at v1.
- Multilingual UI. English-only for v1.
- Analytics / telemetry. Permanent non-goal.

## Dormant code policy

`POS.Posit` from `js-aruco2/src/posit2.js` is _not_ imported by any source file. If it were
imported but unused, it would be dead weight; not importing it keeps the bundle smaller and
honours ADR 0009. When pose-3D is added in v2, that ADR will document the import.

## Consequences

This list is the contract the feature-claims audit checks against. Anything claimed in the
README that is not in this list is a documentation bug.
