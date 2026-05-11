import { describe, expect, it } from 'vitest';
import {
  createSettingsStore,
  defaultSettings,
  settingsSchema,
} from '../src/application/settings.js';
import type { StorageAdapter } from '../src/primitives/persistence.js';

function memoryAdapter(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    read: (k) => store.get(k) ?? null,
    write: (k, v) => {
      store.set(k, v);
    },
    remove: (k) => {
      store.delete(k);
    },
  };
}

describe('settings store', () => {
  it('starts with defaults', () => {
    const s = createSettingsStore(memoryAdapter());
    expect(s.load()).toEqual(defaultSettings);
  });

  it('persists each setting independently and survives reload', () => {
    const adapter = memoryAdapter();
    const a = createSettingsStore(adapter);
    a.save({ ...defaultSettings, volume: 0.2, muted: true, expectedTagId: 5 });
    const b = createSettingsStore(adapter);
    const loaded = b.load();
    expect(loaded.volume).toBe(0.2);
    expect(loaded.muted).toBe(true);
    expect(loaded.expectedTagId).toBe(5);
  });

  it('reset returns defaults', () => {
    const adapter = memoryAdapter();
    const s = createSettingsStore(adapter);
    s.save({ ...defaultSettings, volume: 0.9, onboardingComplete: true });
    expect(s.reset()).toEqual(defaultSettings);
    expect(adapter.read('audience-field-sculpture/settings')).toBeNull();
  });

  it('rejects invalid dictionary names', () => {
    const result = settingsSchema.safeParse({ ...defaultSettings, dictionary: 'NOPE' });
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range volume', () => {
    const result = settingsSchema.safeParse({ ...defaultSettings, volume: 2 });
    expect(result.success).toBe(false);
  });
});
