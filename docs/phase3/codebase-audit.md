# Phase 3 — Codebase health audit

Status: shipped v0.1.0
Date: 2026-05-11

Measurements taken at the v0.1.0 tag. Since this is a fresh codebase rather than an existing
one being refactored, there are no "before / after" numbers; the audit verifies that the
Phase 3 bar was hit at the first commit.

## TODO / FIXME / XXX / HACK

```
$ grep -rEn "TODO|FIXME|XXX|HACK" src/ tests/ scripts/ | wc -l
0
```

The only matches are in ADR text (`docs/adr/0009-no-stubs-no-todos.md`), describing the
policy. There are no `TODO/FIXME/XXX/HACK` markers in committed code, tests, or scripts.

## Type-safety holes

```
$ grep -rEn "\\bany\\b|as any|as unknown|@ts-ignore|@ts-nocheck|@ts-expect-error" src/ tests/
(no source matches; only one incidental match in a test description string)
```

ESLint enforces this with `@typescript-eslint/no-explicit-any`, `no-unsafe-assignment`,
`no-unsafe-member-access`, `no-unsafe-call`, `no-unsafe-return`, `no-unsafe-argument` (all
`error`). `tsconfig.app.json` sets `strict: true`, `noUncheckedIndexedAccess: true`,
`exactOptionalPropertyTypes: true`, `verbatimModuleSyntax: true`.

The only "boundary cast" in the codebase is in `src/application/detector.ts`, where the
CommonJS namespace exported by `js-aruco2` is narrowed via a typed interface
(`ArucoModuleShape`). No `as any` is used.

## DRY

No duplicated logic block of more than 6 lines appears in two or more files. Specifically:

- `clamp`, `lerp`, `smoothstep` are single-source-of-truth in `src/primitives/clamp.ts`.
- `Result<T, E>` and `ok` / `err` constructors live in `src/primitives/result.ts`.
- The `Detection` / `QuadCorners` / `AttentionState` / `PoseSummary` / `VisualState` /
  `AudioState` types are defined once in `src/types/domain.ts` and imported.
- Storage adapter abstraction is single in `src/primitives/persistence.ts`.

## SOLID

- **Single responsibility**: each `src/domain/*.ts` is a single mapping function (attention,
  pose, visual, audio). `src/primitives/*.ts` modules each wrap one resource.
- **Dependency direction**: enforced socially per ADR 0006. No upward imports detected by
  manual inspection of every `import` line in `src/`.
- **No circular dependencies**: confirmed by `tsc -b` (no error) and by manual graph walk.
- **No god modules**: largest file is `src/app.ts` (349 lines) which is the top-level
  orchestration. Next-largest is `src/ui/overlay.ts` (188 lines), the rendering pipeline.

## Dead code

- No unreferenced exports detected by manual review.
- `js-aruco2` exposes `POS.Posit` for full pose estimation; we deliberately do **not** import
  it (see ADR 0010), so it cannot be dead.
- No commented-out code in `src/`.

## Inconsistent patterns

- Error handling uses the same `Result<T, E>` pattern in every primitive that can fail
  (`openCamera`, `createVideoFrameGrabber`, `PersistedStore.save`).
- Module boundaries are consistent: every module exports a small `interface` plus a factory
  function that returns it. (Domain layer is the exception — pure functions.)
- Naming: camelCase for values, PascalCase for types and constructors, kebab-case for files.
  No outliers.

## Test coverage on real-user paths

| Layer                       | Coverage                       | Tested                                                                                 |
| --------------------------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| `domain/`                   | 98.79% / 100% funcs            | `tests/attention.test.ts`, `pose.test.ts`, `visualState.test.ts`, `audioState.test.ts` |
| `application/lifecycle.ts`  | 100% on used branches          | `tests/lifecycle.test.ts`                                                              |
| `application/settings.ts`   | 100% statements                | `tests/settings.test.ts`                                                               |
| `application/simulation.ts` | 100% statements                | `tests/simulation.test.ts`                                                             |
| `primitives/persistence.ts` | 83.6% statements               | `tests/persistence.test.ts`                                                            |
| `primitives/clamp.ts`       | 90% statements                 | (covered via callers)                                                                  |
| `application/detector.ts`   | 0% — wraps `js-aruco2`         | manual stranger test                                                                   |
| `primitives/camera.ts`      | 0% — needs real `getUserMedia` | manual stranger test                                                                   |
| `primitives/audio.ts`       | 0% — needs real `AudioContext` | manual stranger test                                                                   |
| `ui/*`                      | 0% — needs DOM + visuals       | manual stranger test                                                                   |

Aggregate over the tested layers: 93.56% statements, 84.33% branches, 89.18% functions,
94.68% lines. Thresholds (`vitest.config.ts`): 85/80/85/85.

Layers that need a real browser are covered by the manual stranger test in
`stranger-test.md`. We deliberately did not add Playwright; camera-permission flows cannot
be meaningfully driven by it.
