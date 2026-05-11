# Phase 3 — Findings synthesis

Status: shipped v0.1.0
Date: 2026-05-11

Because v0.1.0 is the first commit of this codebase, the synthesis below describes the
_as-shipped_ state rather than gaps closed against a prior version.

## Top 5 usability gaps (currently open, ranked)

1. **Camera-permission failure mode on iOS Safari** is mitigated but not fully friction-free.
   When a user declines, they have to know that the menu's "Run simulated demo" exists. The
   onboarding sheet surfaces this, but a user who hits "Don't Allow" on the browser dialog
   never sees the onboarding again. Mitigation: the status pill stays visible with an error,
   and the hint copy points them at the menu.
2. **No on-device tag-id discovery.** If the printed sign uses a tag id different from the
   user's setting, the artwork silently does nothing. The user has to read the id from the
   printable page and type it in. v1.1: surface "I see tag id N, but you're expecting M".
3. **No metric for actual frame rate.** We render via `requestAnimationFrame` but expose no
   FPS readout, even in the debug overlay. The brief calls out a ≥15 FPS target.
4. **Print-scale calibration is a paragraph of instructions.** We tell the user to print at
   100% for an 8 cm marker. A photo or a printed reference scale next to the tag would be
   friendlier.
5. **`alt`/`aria` coverage is minimal.** Buttons have `aria-label`, but the canvases get a
   single `aria-label` describing them as "Visual overlay". A screen reader user has nothing
   useful here. The honest position is that this artwork's content is visual, but the menu
   and onboarding flows should be screen-reader-navigable; they are.

## Top 5 half-baked features

None. We deliberately did not ship any half-baked features in v0.1.0 — see ADR 0010 for the
scope and the explicit "out-of-scope" list. Future cuts will go through the triage process
described in ADR 0009.

## Top 5 codebase pain points

There are no notable pain points at v0.1.0; the codebase is 2135 lines of TypeScript with
447 lines of tests. The places I would expect to feel pressure in v0.2 if it grows:

1. `src/app.ts` is currently the orchestrator at 349 lines. If a third mode (camera /
   demo / a hypothetical recording mode) gets added, this should split into a
   state-machine module.
2. `src/ui/overlay.ts` mixes physics (particle step) and rendering (canvas draw). Cheap to
   split when the visual language gets more complex.
3. `src/application/detector.ts` does a small CJS interop dance for `js-aruco2`. If
   `js-aruco2` ever publishes an ESM build, that file simplifies considerably.

## Top 5 documentation–reality mismatches

None at v0.1.0. The feature-claims audit lists every README/brief claim with its verification
mode. Two brief success metrics (2-second detection, 15 FPS) are marked ⚠ partial because
they require real-phone measurement that has not yet been performed; that is a "measurement
debt", not a documentation lie — both the README and the audit are explicit about the
status.

## Definition of "fully usable" — user stories

A v0.1.0 stranger should be able to do all of the following without asking the developer:

1. **Curator at a gallery**: print the printable tags page at 100%, mount one near the
   sculpture, open the artwork URL on their phone, point it at the tag, see the response.
2. **Festival visitor with no app installed**: scan a QR code that points at the artwork URL,
   accept the camera prompt, see the response within a few seconds, or decline the prompt
   and still experience the simulated demo.
3. **Privacy-curious viewer**: tap the menu, read the Privacy section, confirm that nothing
   is collected, see the source-code link, leave reassured.
4. **Mobile visitor on a borrowed device**: use the artwork without ever creating an account,
   leave no trace beyond a `localStorage` key, reset settings before handing the phone back.
5. **Developer reviewing the artwork**: open the source on GitHub, read the ADRs, follow the
   README to `npm run dev`, see the artwork running locally, run `npm test` and pass.

## Phase 3 success metrics for v0.1.0

| Metric                                          | Target | Actual |
| ----------------------------------------------- | ------ | ------ |
| TODO / FIXME / XXX / HACK count in source       | 0      | 0      |
| `any` / `@ts-ignore` count in source            | 0      | 0      |
| Lint errors at commit time                      | 0      | 0      |
| Test suite passes                               | yes    | 42/42  |
| Coverage on tested layers (statements)          | ≥85%   | 93.56% |
| Number of stubs in production UI                | 0      | 0      |
| Number of claimed features without verification | 0      | 0      |
| Build produces a working `docs/` Pages bundle   | yes    | yes    |

## Out-of-scope for this Phase 3 pass

- No new features.
- No polish (skeletons, dark-mode toggles, command palettes).
- No engine changes.
- No multi-phone communication; ADR 0003 stands.
