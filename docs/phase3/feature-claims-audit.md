# Phase 3 — Feature claims audit

Status: shipped v0.1.0
Date: 2026-05-11

Every claim made in the README, in-app help, and ADRs is enumerated here with a verification
mode. Mismatches between claim and reality are documentation bugs; this audit is the gate
that catches them before tagging.

| Claim                                                                            | Source               | Status    | Verification                                                                                                                                                                                          |
| -------------------------------------------------------------------------------- | -------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Phones read a printed sculpture tag and respond with visuals and ambient audio" | README, brief        | ✅        | Manual + simulated-demo verifies the response pipeline; tag detection verified by the printable tags + camera path on a real phone (stranger test).                                                   |
| "Camera frames never leave the device"                                           | README, Privacy page | ✅        | Code review: there is no `fetch`/`XMLHttpRequest`/`WebSocket`/`RTCPeerConnection`/`sendBeacon` in `src/`. ADR 0005 documents the property structurally.                                               |
| "No accounts, no analytics, no third-party scripts"                              | README, Privacy page | ✅        | `npm ls --omit=dev` shows runtime deps: `js-aruco2`, `zod`. No analytics. No external scripts in `index.html`.                                                                                        |
| "Microphone is not used"                                                         | Privacy page         | ✅        | `getUserMedia` is called with `audio: false` in `src/primitives/camera.ts`.                                                                                                                           |
| "Detects a sculpture tag within ~2 seconds in good lighting"                     | Brief success metric | ⚠ partial | True for the simulated demo (visibility model). For real cameras: depends on phone, lighting, and marker size. Stranger test on a real phone is required for this metric; recorded as the v1.1 to-do. |
| "Maintains ≥15 FPS on two target mobile browsers"                                | Brief success metric | ⚠ partial | Bundle is 32 kB gzipped, render loop is 2D-canvas only. Likely on modern phones; not measured in CI. Manual measurement deferred to v1.1.                                                             |
| "≥3 phones can influence visual/audio state in a local demo"                     | Brief success metric | ✅        | Each phone runs the same code on the same scene independently (ADR 0003). Three phones at the same sculpture each produce their own response.                                                         |
| "No server-side logs or stored personal data"                                    | Brief success metric | ✅        | There is no server.                                                                                                                                                                                   |
| "Builds and publishes to GitHub Pages from day one"                              | Brief success metric | ✅        | `npm run build` → `docs/`, `.github/workflows/deploy.yml` publishes to Pages.                                                                                                                         |
| "Settings persist across reload"                                                 | In-app menu          | ✅        | Tested in `tests/persistence.test.ts` and `tests/settings.test.ts`.                                                                                                                                   |
| "Reset all settings actually resets"                                             | Menu button          | ✅        | `tests/settings.test.ts` covers `reset()`. Manually verified that the menu inputs re-sync.                                                                                                            |
| "Volume slider changes loudness; mute silences instantly"                        | Menu controls        | ✅        | `audio.setMasterGain` / `setMuted` use `setTargetAtTime` with a 50 ms ramp.                                                                                                                           |
| "Debug overlay shows attention, trend, sample count, hue"                        | Menu toggle          | ✅        | `drawDebug` in `src/ui/overlay.ts` renders these four fields.                                                                                                                                         |
| "Reduce motion zeroes pulse"                                                     | Menu toggle          | ✅        | Tested in `tests/lifecycle.test.ts` and `tests/visualState.test.ts`.                                                                                                                                  |
| "Printable tags page provides marker ids 0–7"                                    | README               | ✅        | `docs/tags/printable.html` regenerated each build.                                                                                                                                                    |

## Mismatches found and fixed during this audit

- "AprilTag detection" was in the original brief; the shipped artwork uses ArUco markers via
  `js-aruco2`. The README explains the substitution in plain English ("ArUco markers — a
  close cousin of AprilTags"). ADR 0004 documents the reasoning.
- Two brief success metrics (2-second detection, 15 FPS) are marked ⚠ partial because they
  require a real phone in real lighting to verify. The stranger test calls them out as the
  highest-priority items for v1.1.
