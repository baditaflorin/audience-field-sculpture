# Phase 3 — Stranger test

Status: shipped v0.1.0
Date: 2026-05-11

The stranger test asks: _could a stranger you handed the URL to actually use this for their
own work, end-to-end, without asking you any questions?_

For a camera-based AR artwork, an end-to-end stranger test fundamentally requires a real
phone in real lighting in front of a real printed marker. The portion that can be exercised
without that (UI flow, settings persistence, simulated demo, copy clarity) was walked
through; the portion that cannot is enumerated honestly below.

## What was tested before the v0.1.0 tag

### Cold open as a first-time user

1. Visit the URL → onboarding sheet appears with three pieces of plain copy: what the
   artwork uses, what it does not use, and two prominent buttons. Pass.
2. Tap **Use my camera** → onboarding marks itself complete (persists), camera permission
   prompt fires, status pill announces "Opening camera…". Pass on simulator; real-device
   prompt verified by reading the wiring path `bindOnboarding` → `startCamera`.
3. Decline camera permission → error pill appears with the text from `describeCameraError`,
   hint copy switches to "Try the simulated demo from the menu — no camera needed." Pass.
4. Tap menu → simulated demo → status pill announces "Starting simulated demo…", the
   particle field animates, audio drone starts. Pass.

### Return visit

1. Reload the page → onboarding sheet does **not** reappear (`onboardingComplete` persisted).
   Pass.
2. Settings (volume, mute, dictionary, tag id, debug, reduce motion) survive the reload.
   Pass (covered by `tests/persistence.test.ts` + `tests/settings.test.ts`).

### Controls walkthrough

Each control was clicked through, the corresponding state read from the in-page debug
overlay or audio output, and the wiring confirmed in source:

| Control            | Observed                                                                |
| ------------------ | ----------------------------------------------------------------------- |
| Volume slider      | Audio level changed smoothly during the demo drone.                     |
| Mute checkbox      | Output instantly silenced; unmute restored it.                          |
| Debug overlay      | HUD with attention %, trend, sample count, hue appeared.                |
| Reduce motion      | Pulse rate dropped to 0; visual stopped pulsing; particles still drift. |
| Dictionary select  | Detector rebuild logged in console.                                     |
| Expected tag id    | Detector rebuild logged in console.                                     |
| Stop everything    | Particles cleared, audio suspended, status pill returned to idle.       |
| Reset all settings | Inputs returned to defaults; ok toast appeared.                         |

## What still needs a real phone before we can claim full Phase 3 closure

These items are deferred to v1.1 as honest measurement debt. They are **not** documentation
lies — the README and the feature-claims audit mark them ⚠ partial:

1. **2-second tag detection target on a real phone in good lighting.** Requires running
   `npm run pages-preview`, exposing via a tunnel with HTTPS or hosting the v0.1.0 Pages
   build, printing the markers at 100%, and timing detection on at least one iPhone and one
   Android.
2. **≥15 FPS sustained on two target mobile browsers** with camera+detector+overlay+audio
   live. Same setup. Add an FPS readout to the debug overlay first (v1.1 task).
3. **3-phone collective demo**. Three phones at the same printed marker, each running the
   artwork. Confirm each produces an independent response. (Mathematically guaranteed by
   ADR 0003, but the demo itself should be filmed for documentation.)

## Top-3 issues found during the testable portion (and the fix)

1. **The status pill auto-hides on errors after 2.4 s by default** — too aggressive for a
   real failure the user needs to read. Fixed in `src/ui/status.ts`: errors with
   `autoHideMs: 0` stay visible. Camera-error path in `src/app.ts` uses that.
2. **Reset button didn't re-sync the menu inputs.** Adding settings reset doesn't help if
   the inputs still show the old values. Fixed: `onReset` calls `menu.syncFromSettings()`.
3. **Audio could be muted on iOS Safari before the first user gesture.** AudioContext
   creation now happens inside `startCamera`/`startDemo`, both of which are reached via a
   click; `audio.start()` calls `context.resume()` if suspended.

## Open issues to track in v1.1

- Surface "I see tag id N but you're expecting M" when the wrong marker is in view.
- FPS readout in debug overlay.
- Printed scale reference next to markers on the printable page.
- iOS Safari permission denial: link to "Allow Camera" settings deep-link if the API exposes
  one.
