# Phase 3 — Input pathway audit

Status: shipped v0.1.0
Date: 2026-05-11

The artwork has two intentional input modalities. There is no file upload, paste, drag-drop,
URL input, or imported state because none of those are sensible inputs for a camera-based
artwork. Listing them as red would be misleading; instead they are listed under "explicitly
out of scope" with a one-line reason each.

| Input pathway                             | Status                | Notes                                                                                                                               |
| ----------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Rear camera (`getUserMedia`, environment) | ✅ green              | `src/primitives/camera.ts`. HTTPS required; GitHub Pages provides it. Errors mapped to user-readable text by `describeCameraError`. |
| Front camera fallback                     | ⚠ explicit non-goal   | Sculpture is in front of the user; rear is the only correct lens.                                                                   |
| Simulated demo (no camera required)       | ✅ green              | `src/application/simulation.ts`. Reachable from onboarding and menu.                                                                |
| Persistent settings restored on reload    | ✅ green              | `PersistedStore` + `localStorage` adapter. Tested in `tests/persistence.test.ts`.                                                   |
| Dictionary selector (3 dictionaries)      | ✅ green              | `setting-dictionary`. Rebuilds detector when changed.                                                                               |
| Expected-tag-id input                     | ✅ green              | `setting-tag-id`. Number input, integer.                                                                                            |
| Reset all settings                        | ✅ green              | `action-reset`. Clears storage, returns defaults, re-syncs UI.                                                                      |
| File upload of recorded video             | ⚪ out of scope       | The artwork is live-experiential; offline replay would change the meaning.                                                          |
| Drag-and-drop image                       | ⚪ out of scope       | Same reason.                                                                                                                        |
| Paste / clipboard read                    | ⚪ out of scope       | No meaningful payload.                                                                                                              |
| URL input / deep links to specific state  | ⚪ out of scope       | The state is per-phone and per-moment; there is nothing to link to.                                                                 |
| Microphone                                | 🚫 permanent non-goal | Stated in the brief and Privacy page.                                                                                               |
| Network input of any kind                 | 🚫 permanent non-goal | Mode A architecture, ADR 0001.                                                                                                      |

## Verification

Each ✅ row was exercised manually during the stranger test (`stranger-test.md`) and by reading
the wiring in `src/app.ts` (`startCamera`, `startDemo`, `applySettings`, `bindMenu`).
