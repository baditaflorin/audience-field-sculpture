# ADR 0007 — Persistence: localStorage with versioned schema and migrations

Status: Accepted
Date: 2026-05-11

## Context

Settings (volume, dictionary, expected tag id, debug toggles, onboarding completion) need to
survive page reload and browser restart. We don't want IndexedDB ceremony for a handful of
scalars, but we do need a way to evolve the shape across releases without silently losing
user data.

## Decision

`PersistedStore<T>` in `src/primitives/persistence.ts`:

- Backed by a `StorageAdapter` (default: `localStorage`; tests pass an in-memory adapter).
- Each record is stored as `{ schemaVersion, data }`.
- A zod schema validates `data`. If validation fails, fall back to defaults silently — the
  artwork should never crash because a stored setting was malformed.
- Migrations are declared as `{ from, to, migrate(raw): unknown }` and applied in order.
- `reset()` removes the key and returns defaults.

## Consequences

- Adding a setting is two lines: extend the zod schema and the `defaultSettings` object.
- Removing or renaming a setting requires bumping `SETTINGS_VERSION` and writing a migration.
- Any user whose stored data is too old or too new to validate gets defaults, not a crash.
- The store is small and well-tested (`tests/persistence.test.ts`, `tests/settings.test.ts`).
