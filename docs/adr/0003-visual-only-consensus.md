# ADR 0003 — Collective Behaviour via Visual-Only Consensus

Status: Accepted
Date: 2026-05-11

## Context

The brief asks for at least three phones to influence visual/audio state in a collective
demo, but Mode A (no backend) and the no-surveillance premise both rule out any phone-to-phone
communication. We considered:

1. **Visual-only consensus** — each phone interprets the same physical scene independently;
   collective effect emerges from co-presence.
2. **WebRTC mesh** via QR-shared room codes — phones gossip ephemeral signals.
3. **On-screen pulse signalling** — phones flash a colour cue that other phones' cameras can
   read.

## Decision

Use **visual-only consensus**. Each phone runs the same code, sees the same printed tag, and
computes its own attention metric from a sliding window of local detections. The collective
behaviour is real but is the sum of independent phones, not a measured cross-phone signal.

## Consequences

- The privacy story is airtight: no signal of any kind crosses between devices.
- Each phone's intensity/visual/audio response depends only on how its own camera has been
  observing the tag over the last few seconds.
- We honestly cannot measure "audience size". When the documentation calls something a
  "collective response", that is shorthand for "each phone is reacting to the same scene at
  the same time"; it is not an aggregate measurement.
- The success metric "at least 3 phones influencing visual/audio state" is satisfied: each
  phone influences its own state in response to a shared physical context.

## When to reconsider

If a future version wants real measurement of crowd size (e.g. counting unique viewers), we
must revisit this and ADR 0001. The trade-off would be a privacy story that requires careful
explanation rather than being self-evident from the architecture.
