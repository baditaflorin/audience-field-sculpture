# ADR 0001 — Deployment Mode: Pure GitHub Pages (Mode A)

Status: Accepted
Date: 2026-05-11

## Context

Audience Field Sculpture is a privacy-preserving browser artwork. Phones near a sculpture read
a printed fiducial tag and respond with on-screen visuals and ambient audio. Any server-side
component that touches camera data would weaken the "no surveillance" premise that motivates
the work.

## Decision

Deploy as a fully static site on GitHub Pages (Mode A). No backend, no accounts, no telemetry.
The site is built by `npm run build` into `docs/` and served by Pages.

## Consequences

- Camera frames cannot leave the device because there is no server to receive them.
- No runtime persistence beyond `localStorage` on the user's phone.
- Multi-phone "collective" behaviour cannot rely on real-time coordination (see ADR 0003).
- Cost is zero, ops surface is zero, attack surface is the smallest possible.

## When to reconsider

If a future version genuinely requires synchronised real-time state across phones (e.g. a
deliberately co-ordinated audio composition across the audience), revisit and write a new ADR
proposing Mode C. v1 explicitly does not need this.
