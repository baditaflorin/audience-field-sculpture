# Phase 3 — Controls audit

Status: shipped v0.1.0
Date: 2026-05-11

Every interactive control in the production UI is listed below with the wiring file and the
end-to-end effect. There are no stub handlers and no placeholder toggles.

| Control                         | DOM id                  | Effect on real data                                                                           | Wired in                              |
| ------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| Menu toggle button              | `menu-button`           | Opens/closes the menu sheet.                                                                  | `src/ui/menu.ts`                      |
| Menu close button               | `menu-close`            | Closes the menu sheet.                                                                        | `src/ui/menu.ts`                      |
| Onboarding "Use my camera"      | `onboarding-continue`   | Marks onboarding complete in settings, hides the sheet, calls `startCamera()`.                | `src/ui/onboarding.ts` + `src/app.ts` |
| Onboarding "Try simulated demo" | `onboarding-demo`       | Marks onboarding complete, hides the sheet, calls `startDemo()`.                              | same                                  |
| Menu → Use camera               | `action-camera`         | Stops anything running, opens camera, starts detection loop, starts audio.                    | `src/app.ts`                          |
| Menu → Run simulated demo       | `action-demo`           | Stops anything running, starts the simulated frame source, starts audio.                      | `src/app.ts`                          |
| Menu → Stop everything          | `action-stop`           | Cancels RAF, stops camera tracks, suspends audio, clears overlay.                             | `src/app.ts`                          |
| Menu → Reset all settings       | `action-reset`          | `settingsStore.reset()`, applies defaults to audio/visual/detector, re-syncs UI inputs.       | `src/app.ts`                          |
| Marker dictionary select        | `setting-dictionary`    | `applySettings({ dictionary })` → rebuilds detector with new dictionary.                      | `src/ui/menu.ts` + `src/app.ts`       |
| Expected tag id (number input)  | `setting-tag-id`        | `applySettings({ expectedTagId })` → rebuilds detector to match new id.                       | same                                  |
| Volume slider                   | `setting-volume`        | `applySettings({ volume })` → `audio.setMasterGain(...)`. Smoothed over 50 ms.                | same                                  |
| Mute checkbox                   | `setting-muted`         | `applySettings({ muted })` → `audio.setMuted(true/false)`.                                    | same                                  |
| Debug overlay checkbox          | `setting-debug`         | `applySettings({ debugOverlay })` → next render frame includes / excludes debug HUD.          | same                                  |
| Reduce motion checkbox          | `setting-reduce-motion` | `applySettings({ reduceMotion })` → `lifecycle.setReduceMotion(...)` zeroes `visual.pulseHz`. | same                                  |
| "Open printable tags" link      | `tag-download`          | Opens `./tags/printable.html` in a new tab.                                                   | `index.html`                          |
| Source link                     | `meta-repo`             | Opens the GitHub repo URL.                                                                    | `bindAboutMetadata` in `src/app.ts`   |
| Privacy link                    | `meta-privacy`          | Opens `./privacy.html`.                                                                       | same                                  |

## Verification method

Manual: each control was clicked / toggled and the corresponding state observed (volume
changed during playback, mute silenced output mid-drone, debug overlay appeared, etc.).
Automated tests cover the `applySettings` pure-logic surface via `tests/settings.test.ts`.
