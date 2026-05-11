import { z } from 'zod';
import {
  PersistedStore,
  type StorageAdapter,
  localStorageAdapter,
} from '../primitives/persistence.js';

export const dictionaryNames = ['ARUCO_MIP_36h12', 'ARUCO', 'ARUCO_4X4'] as const;
export type DictionaryName = (typeof dictionaryNames)[number];

export const settingsSchema = z.object({
  dictionary: z.enum(dictionaryNames),
  expectedTagId: z.number().int().min(0).max(999),
  volume: z.number().min(0).max(1),
  muted: z.boolean(),
  debugOverlay: z.boolean(),
  reduceMotion: z.boolean(),
  onboardingComplete: z.boolean(),
});

export type Settings = z.infer<typeof settingsSchema>;

export const defaultSettings: Settings = {
  dictionary: 'ARUCO_MIP_36h12',
  expectedTagId: 0,
  volume: 0.55,
  muted: false,
  debugOverlay: false,
  reduceMotion: false,
  onboardingComplete: false,
};

const SETTINGS_KEY = 'audience-field-sculpture/settings';
const SETTINGS_VERSION = 1;

export function createSettingsStore(
  adapter: StorageAdapter = localStorageAdapter
): PersistedStore<Settings> {
  return new PersistedStore<Settings>(
    adapter,
    SETTINGS_KEY,
    settingsSchema,
    SETTINGS_VERSION,
    defaultSettings
  );
}
