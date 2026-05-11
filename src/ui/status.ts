export type StatusTone = 'neutral' | 'ok' | 'error';

export interface StatusController {
  show(text: string, tone?: StatusTone, opts?: { autoHideMs?: number }): void;
  hide(): void;
  setHint(text: string | null): void;
}

export function createStatusController(pill: HTMLElement, hint: HTMLElement): StatusController {
  let timer: number | null = null;
  return {
    show(text, tone = 'neutral', opts = {}) {
      pill.textContent = text;
      pill.dataset.tone = tone;
      pill.dataset.visible = 'true';
      if (timer !== null) {
        globalThis.clearTimeout(timer);
        timer = null;
      }
      const autoHideMs = opts.autoHideMs ?? (tone === 'error' ? 0 : 2400);
      if (autoHideMs > 0) {
        timer = globalThis.setTimeout(() => {
          pill.dataset.visible = 'false';
          timer = null;
        }, autoHideMs);
      }
    },
    hide() {
      pill.dataset.visible = 'false';
      if (timer !== null) {
        globalThis.clearTimeout(timer);
        timer = null;
      }
    },
    setHint(text) {
      if (text === null) {
        hint.hidden = true;
        hint.textContent = '';
      } else {
        hint.hidden = false;
        hint.textContent = text;
      }
    },
  };
}
