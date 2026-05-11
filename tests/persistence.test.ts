import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { PersistedStore, type StorageAdapter } from '../src/primitives/persistence.js';

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

const schema = z.object({ volume: z.number().min(0).max(1), tagId: z.number().int() });

describe('PersistedStore', () => {
  it('returns defaults when nothing stored', () => {
    const s = new PersistedStore(memoryAdapter(), 'k', schema, 1, { volume: 0.5, tagId: 0 });
    expect(s.load()).toEqual({ volume: 0.5, tagId: 0 });
  });

  it('persists across new instances using same adapter', () => {
    const adapter = memoryAdapter();
    const a = new PersistedStore(adapter, 'k', schema, 1, { volume: 0.5, tagId: 0 });
    a.save({ volume: 0.8, tagId: 3 });
    const b = new PersistedStore(adapter, 'k', schema, 1, { volume: 0.5, tagId: 0 });
    expect(b.load()).toEqual({ volume: 0.8, tagId: 3 });
  });

  it('rejects invalid values', () => {
    const s = new PersistedStore(memoryAdapter(), 'k', schema, 1, { volume: 0.5, tagId: 0 });
    const r = s.save({ volume: 5, tagId: 0 });
    expect(r.ok).toBe(false);
  });

  it('reset returns defaults and clears store', () => {
    const adapter = memoryAdapter();
    const s = new PersistedStore(adapter, 'k', schema, 1, { volume: 0.5, tagId: 0 });
    s.save({ volume: 0.9, tagId: 7 });
    expect(s.reset()).toEqual({ volume: 0.5, tagId: 0 });
    expect(adapter.read('k')).toBeNull();
  });

  it('migrates older schema versions', () => {
    const adapter = memoryAdapter();
    adapter.write('k', JSON.stringify({ schemaVersion: 1, data: { volume: 0.5 } }));
    const s = new PersistedStore(adapter, 'k', schema, 2, { volume: 0.5, tagId: 0 }, [
      {
        from: 1,
        to: 2,
        migrate: (raw) => {
          const old = raw as { volume?: number };
          return { volume: old.volume ?? 0.5, tagId: 0 };
        },
      },
    ]);
    expect(s.load()).toEqual({ volume: 0.5, tagId: 0 });
  });

  it('falls back to defaults on corrupt JSON', () => {
    const adapter = memoryAdapter();
    adapter.write('k', '{not json');
    const s = new PersistedStore(adapter, 'k', schema, 1, { volume: 0.5, tagId: 0 });
    expect(s.load()).toEqual({ volume: 0.5, tagId: 0 });
  });

  it('falls back to defaults when stored data fails validation after migrations', () => {
    const adapter = memoryAdapter();
    adapter.write('k', JSON.stringify({ schemaVersion: 1, data: { volume: 'oops' } }));
    const s = new PersistedStore(adapter, 'k', schema, 1, { volume: 0.5, tagId: 0 });
    expect(s.load()).toEqual({ volume: 0.5, tagId: 0 });
  });
});
