# ADR 0005 — Camera frames never leave the device

Status: Accepted
Date: 2026-05-11

## Context

The artwork's central premise is that audiences can be sensed without being surveilled. A
single network request carrying a camera frame would undermine the premise even if that
request were never inspected.

## Decision

Enforce the no-egress property structurally, not by policy:

1. The frame grabber writes pixels to an offscreen `<canvas>` inside the page. No `fetch`,
   `XMLHttpRequest`, `WebSocket`, `RTCPeerConnection`, or `navigator.sendBeacon` call accepts
   an `ImageData`, `Blob`, or video frame as input anywhere in the codebase.
2. There is no backend to send to. Mode A (ADR 0001) means there is no first-party endpoint.
3. The Privacy page (`/privacy.html`) states the property in plain English. The README
   re-states it. The audit `feature-claims-audit.md` verifies it.

## Consequences

- Every change that adds a network primitive in the codebase will be questioned by the audit.
- Any future server-side feature must come with a new ADR explicitly weakening this property.
- Camera permission is gated by browser UX; we add a clear pre-permission onboarding sheet so
  the user knows what to expect.
