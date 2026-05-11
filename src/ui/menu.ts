import type { Settings } from '../application/settings.js';
import { dictionaryNames } from '../application/settings.js';

export interface MenuElements {
  readonly root: HTMLElement;
  readonly menuButton: HTMLElement;
  readonly closeButton: HTMLElement;
  readonly cameraButton: HTMLElement;
  readonly demoButton: HTMLElement;
  readonly stopButton: HTMLElement;
  readonly resetButton: HTMLElement;
  readonly dictionaryInput: HTMLSelectElement;
  readonly tagIdInput: HTMLInputElement;
  readonly volumeInput: HTMLInputElement;
  readonly mutedInput: HTMLInputElement;
  readonly debugInput: HTMLInputElement;
  readonly reduceMotionInput: HTMLInputElement;
}

export interface MenuCallbacks {
  onOpenCamera(): void;
  onStartDemo(): void;
  onStop(): void;
  onReset(): void;
  onSettingChange(patch: Partial<Settings>): void;
}

export interface MenuController {
  open(): void;
  close(): void;
  isOpen(): boolean;
  syncFromSettings(settings: Settings): void;
}

export function bindMenu(elements: MenuElements, callbacks: MenuCallbacks): MenuController {
  for (const name of dictionaryNames) {
    if (![...elements.dictionaryInput.options].some((o) => o.value === name)) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      elements.dictionaryInput.appendChild(opt);
    }
  }

  const open = (): void => {
    elements.root.hidden = false;
    elements.root.scrollTop = 0;
  };
  const close = (): void => {
    elements.root.hidden = true;
  };
  const isOpen = (): boolean => !elements.root.hidden;

  elements.menuButton.addEventListener('click', () => {
    if (isOpen()) close();
    else open();
  });
  elements.closeButton.addEventListener('click', close);
  elements.cameraButton.addEventListener('click', () => {
    close();
    callbacks.onOpenCamera();
  });
  elements.demoButton.addEventListener('click', () => {
    close();
    callbacks.onStartDemo();
  });
  elements.stopButton.addEventListener('click', () => {
    close();
    callbacks.onStop();
  });
  elements.resetButton.addEventListener('click', () => {
    callbacks.onReset();
  });

  elements.dictionaryInput.addEventListener('change', () => {
    const value = elements.dictionaryInput.value;
    if (dictionaryNames.includes(value as (typeof dictionaryNames)[number])) {
      callbacks.onSettingChange({ dictionary: value as (typeof dictionaryNames)[number] });
    }
  });

  elements.tagIdInput.addEventListener('change', () => {
    const value = Number.parseInt(elements.tagIdInput.value, 10);
    if (Number.isFinite(value) && value >= 0) {
      callbacks.onSettingChange({ expectedTagId: value });
    }
  });

  elements.volumeInput.addEventListener('input', () => {
    const value = Number.parseInt(elements.volumeInput.value, 10);
    if (Number.isFinite(value)) {
      callbacks.onSettingChange({ volume: Math.max(0, Math.min(100, value)) / 100 });
    }
  });

  elements.mutedInput.addEventListener('change', () => {
    callbacks.onSettingChange({ muted: elements.mutedInput.checked });
  });

  elements.debugInput.addEventListener('change', () => {
    callbacks.onSettingChange({ debugOverlay: elements.debugInput.checked });
  });

  elements.reduceMotionInput.addEventListener('change', () => {
    callbacks.onSettingChange({ reduceMotion: elements.reduceMotionInput.checked });
  });

  return {
    open,
    close,
    isOpen,
    syncFromSettings(settings) {
      elements.dictionaryInput.value = settings.dictionary;
      elements.tagIdInput.value = String(settings.expectedTagId);
      elements.volumeInput.value = String(Math.round(settings.volume * 100));
      elements.mutedInput.checked = settings.muted;
      elements.debugInput.checked = settings.debugOverlay;
      elements.reduceMotionInput.checked = settings.reduceMotion;
    },
  };
}
