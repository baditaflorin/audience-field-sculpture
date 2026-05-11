import type { z } from 'zod';
import { type Result, ok, err } from './result.js';

export interface PersistedRecord<T> {
  readonly schemaVersion: number;
  readonly data: T;
}

export interface Migration<T> {
  readonly from: number;
  readonly to: number;
  migrate(raw: unknown): T;
}

export interface StorageAdapter {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

export const localStorageAdapter: StorageAdapter = {
  read(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  write(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Quota exceeded or storage disabled — caller decides what to do.
    }
  },
  remove(key) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export class PersistedStore<T> {
  private cached: T | null = null;

  constructor(
    private readonly storage: StorageAdapter,
    private readonly key: string,
    private readonly schema: z.ZodType<T>,
    private readonly currentVersion: number,
    private readonly defaults: T,
    private readonly migrations: readonly Migration<unknown>[] = []
  ) {}

  load(): T {
    if (this.cached !== null) return this.cached;
    const raw = this.storage.read(this.key);
    if (raw === null) {
      this.cached = this.defaults;
      return this.defaults;
    }
    const parsedResult = this.parseRecord(raw);
    if (!parsedResult.ok) {
      this.cached = this.defaults;
      return this.defaults;
    }
    this.cached = parsedResult.value;
    return parsedResult.value;
  }

  save(value: T): Result<T, Error> {
    const validated = this.schema.safeParse(value);
    if (!validated.success) {
      return err(new Error(`invalid value for ${this.key}: ${validated.error.message}`));
    }
    const record: PersistedRecord<T> = {
      schemaVersion: this.currentVersion,
      data: validated.data,
    };
    this.storage.write(this.key, JSON.stringify(record));
    this.cached = validated.data;
    return ok(validated.data);
  }

  reset(): T {
    this.storage.remove(this.key);
    this.cached = this.defaults;
    return this.defaults;
  }

  private parseRecord(raw: string): Result<T, Error> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
    if (typeof parsed !== 'object' || parsed === null) {
      return err(new Error('record is not an object'));
    }
    const record = parsed as { schemaVersion?: unknown; data?: unknown };
    const recordVersion = typeof record.schemaVersion === 'number' ? record.schemaVersion : 0;
    let data: unknown = record.data ?? parsed;
    if (recordVersion < this.currentVersion) {
      data = this.applyMigrations(recordVersion, data);
    }
    const validated = this.schema.safeParse(data);
    if (!validated.success) return err(new Error(validated.error.message));
    return ok(validated.data);
  }

  private applyMigrations(fromVersion: number, data: unknown): unknown {
    let current = data;
    let version = fromVersion;
    while (version < this.currentVersion) {
      const step = this.migrations.find((m) => m.from === version);
      if (!step) break;
      current = step.migrate(current);
      version = step.to;
    }
    return current;
  }
}
