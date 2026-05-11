export interface OnboardingElements {
  readonly root: HTMLElement;
  readonly continueButton: HTMLElement;
  readonly demoButton: HTMLElement;
}

export interface OnboardingCallbacks {
  onContinue(): void;
  onDemo(): void;
}

export interface OnboardingController {
  showIfNeeded(complete: boolean): void;
  show(): void;
  hide(): void;
}

export function bindOnboarding(
  elements: OnboardingElements,
  callbacks: OnboardingCallbacks
): OnboardingController {
  elements.continueButton.addEventListener('click', () => {
    elements.root.hidden = true;
    callbacks.onContinue();
  });
  elements.demoButton.addEventListener('click', () => {
    elements.root.hidden = true;
    callbacks.onDemo();
  });
  return {
    showIfNeeded(complete) {
      elements.root.hidden = complete;
    },
    show() {
      elements.root.hidden = false;
    },
    hide() {
      elements.root.hidden = true;
    },
  };
}
