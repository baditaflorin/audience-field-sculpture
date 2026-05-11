# ADR 0009 — Phase 3 standards from day one: no stubs, no TODOs, no `any`

Status: Accepted
Date: 2026-05-11

## Context

The user's Phase 3 meta-prompt normally runs after Phase 1 (scaffold) and Phase 2
(substance), and audits an existing app for completeness. Audience Field Sculpture is a
brand-new project. Running Phase 3 against an empty codebase would have produced theatrical
"0-of-0 green" audits and a meaningless postmortem.

## Decision

Bake the Phase 3 acceptance bar into the initial build as design constraints:

1. **No stubs in production UI.** Every visible control has a wired handler that does what
   its label says, on real data, end-to-end. Hidden flags are fine if tested.
2. **No `any`, no `// @ts-ignore`, no unsafe casts** outside an explicitly marked boundary
   shim. Enforced by ESLint (`@typescript-eslint/no-explicit-any`, `no-unsafe-*` rules) and
   strict TypeScript.
3. **No TODO / FIXME / XXX / HACK** in committed code. If a piece of work is deferred, it
   gets a follow-up issue or an ADR; it does not get a comment.
4. **Every README/marketing claim is tested or directly observable** in the running app.
   Verified by `docs/phase3/feature-claims-audit.md`.
5. **Persistence survives reload and migrates across versions** (ADR 0007).
6. **Settings page: every toggle does something** verifiable; nothing is a placeholder.
7. **Stranger test is mandatory** before tagging v0.1.0 (`docs/phase3/stranger-test.md`).

## Consequences

- The audit grids in `docs/phase3/` are written _after_ the work but verify the as-shipped
  state, not before-and-after deltas (there is no "before").
- ADRs 0001–0008 cover engine-level decisions. ADRs 0009–0011 cover the process-level
  Phase 3 commitments.
- The postmortem (`docs/postmortem-phase3.md`) answers the mandatory question — "could a
  stranger use this for their own real work, end-to-end, without help?" — for the
  as-shipped v1.
