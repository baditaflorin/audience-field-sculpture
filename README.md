# Audience Field Sculpture

A privacy-preserving browser artwork. Phones near a sculpture read a printed tag and respond
with visuals and ambient audio. **Camera frames never leave the device.**

Live demo: <https://baditaflorin.github.io/audience-field-sculpture/>
Printable tags: <https://baditaflorin.github.io/audience-field-sculpture/tags/printable.html>
Privacy statement: <https://baditaflorin.github.io/audience-field-sculpture/privacy.html>

## What it does

- Detects a printed ArUco marker (dictionary `ARUCO_MIP_36h12`) using the phone's rear
  camera.
- Builds a 6-second sliding-window _attention_ metric from the phone's own observations.
- Drives a 2D-canvas overlay (hue, intensity, particle density, pulse rate) and a Web-Audio
  drone (carrier, modulator, amplitude, noise) from that metric and the marker's pose.
- Ships with a simulated demo that runs without camera permission.
- Remembers volume, dictionary, tag id, and toggles across reloads.

## What it does **not** do

- No microphone.
- No face recognition, biometric profiling, or identity tracking.
- No analytics, telemetry, accounts, or third-party scripts.
- No backend; everything runs on the phone.
- No phone-to-phone communication — the "collective" effect emerges from co-presence at the
  same physical scene (see [ADR 0003](docs/adr/0003-visual-only-consensus.md)).

## Quickstart

```bash
npm install
npm run dev      # http://127.0.0.1:5173
```

Then open the URL on a phone connected to the same Wi-Fi (you'll need HTTPS for the camera
prompt — use a tunnel like `cloudflared tunnel --url http://127.0.0.1:5173`, or just open
the GitHub Pages URL once the workflow has deployed). The simulated demo works fine on a
desktop browser without any camera setup.

To print markers: open `/tags/printable.html` from the live site, print at 100% on A4 or
US Letter.

## Scripts

| Command                 | What it does                                              |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Vite dev server.                                          |
| `npm run build`         | Production build into `docs/`.                            |
| `npm run pages-preview` | Build + serve `docs/` locally at <http://127.0.0.1:4173>. |
| `npm run typecheck`     | `tsc -b`.                                                 |
| `npm run lint`          | ESLint + Prettier check.                                  |
| `npm run fmt`           | Prettier write.                                           |
| `npm run test`          | Vitest with coverage.                                     |
| `npm run smoke`         | typecheck + lint + test + build (CI gate).                |

## Repository layout

```
audience-field-sculpture/
├── src/
│   ├── domain/         # pure functions: attention, pose, visual/audio derivation
│   ├── application/    # detector, settings, simulation, lifecycle
│   ├── primitives/     # camera, audio, persistence, frame-grabber, time, clamp, result
│   ├── ui/             # overlay, menu, onboarding, status pill
│   ├── types/          # canonical domain types + ambient module declarations
│   ├── app.ts          # top-level orchestration
│   └── main.ts         # entry
├── tests/              # Vitest, 42 tests covering domain + lifecycle + persistence
├── scripts/            # build helpers and the tag generator
├── public/             # static assets copied verbatim (icon, privacy.html, tags/)
├── docs/
│   ├── adr/            # architecture decision records 0001–0010
│   ├── phase3/         # input/output/controls/feature-claims/codebase/findings/stranger-test
│   ├── architecture.md
│   ├── deploy.md
│   └── postmortem-phase3.md
└── index.html
```

## Architecture

See [docs/architecture.md](docs/architecture.md). One-line summary: UI → application →
domain → primitives, with no upward imports.

## Privacy

See [public/privacy.html](public/privacy.html) (also linked from the in-app menu).

## Limitations (honest)

- iOS Safari requires HTTPS for `getUserMedia`. GitHub Pages provides it; local dev needs a
  tunnel or `https://127.0.0.1:5173` via `mkcert`.
- Detection range depends on print size + lighting. With the default 8 cm marker, expect
  reliable detection at ~0.3–1.5 m.
- "Detect within ~2 seconds" and "≥15 FPS" success metrics from the brief are marked
  ⚠ partial in [docs/phase3/feature-claims-audit.md](docs/phase3/feature-claims-audit.md);
  measurement on a real phone is the v1.1 task list.

## License

MIT — see [LICENSE](LICENSE).
