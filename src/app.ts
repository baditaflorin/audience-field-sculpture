import { createAudioEngine } from './primitives/audio.js';
import { openCamera, describeCameraError, type CameraStream } from './primitives/camera.js';
import { createVideoFrameGrabber, type FrameGrabber } from './primitives/frame-grabber.js';
import { createMarkerDetector, type MarkerDetector } from './application/detector.js';
import { createSimulation, type Simulation } from './application/simulation.js';
import { createLifecycle, type Lifecycle } from './application/lifecycle.js';
import { createSettingsStore } from './application/settings.js';
import type { Settings } from './application/settings.js';
import type { FrameSample } from './types/domain.js';
import { createOverlay, type OverlayRenderer } from './ui/overlay.js';
import { createStatusController, type StatusController } from './ui/status.js';
import { bindMenu, type MenuController } from './ui/menu.js';
import { bindOnboarding, type OnboardingController } from './ui/onboarding.js';

type Mode = 'idle' | 'camera' | 'demo';

interface DomRefs {
  video: HTMLVideoElement;
  visualCanvas: HTMLCanvasElement;
  debugCanvas: HTMLCanvasElement;
  stage: HTMLElement;
  statusPill: HTMLElement;
  hint: HTMLElement;
}

export interface AppHandle {
  start(): void;
  stop(): void;
}

export function bootstrap(): AppHandle {
  const dom = collectDom();
  const settingsStore = createSettingsStore();
  let settings = settingsStore.load();

  const status = createStatusController(dom.statusPill, dom.hint);
  const overlay = createOverlay({
    canvas: dom.visualCanvas,
    debugCanvas: dom.debugCanvas,
    devicePixelRatio: globalThis.devicePixelRatio || 1,
    showDebug: () => settings.debugOverlay,
  });
  resizeOverlay(dom, overlay);

  const audio = createAudioEngine({ initialGain: settings.volume, muted: settings.muted });

  let lifecycle: Lifecycle = createLifecycle(stageFrameSize(dom));
  let mode: Mode = 'idle';
  let raf: number | null = null;
  let camera: CameraStream | null = null;
  let grabber: FrameGrabber | null = null;
  let detector: MarkerDetector | null = null;
  let simulation: Simulation | null = null;

  const onboarding = bindOnboarding(
    {
      root: requireElement('onboarding'),
      continueButton: requireElement('onboarding-continue'),
      demoButton: requireElement('onboarding-demo'),
    },
    {
      onContinue: () => {
        markOnboardingComplete();
        void startCamera();
      },
      onDemo: () => {
        markOnboardingComplete();
        void startDemo();
      },
    }
  );

  const menu = bindMenu(
    {
      root: requireElement('menu'),
      menuButton: requireElement('menu-button'),
      closeButton: requireElement('menu-close'),
      cameraButton: requireElement('action-camera'),
      demoButton: requireElement('action-demo'),
      stopButton: requireElement('action-stop'),
      resetButton: requireElement('action-reset'),
      dictionaryInput: requireElement<HTMLSelectElement>('setting-dictionary'),
      tagIdInput: requireElement<HTMLInputElement>('setting-tag-id'),
      volumeInput: requireElement<HTMLInputElement>('setting-volume'),
      mutedInput: requireElement<HTMLInputElement>('setting-muted'),
      debugInput: requireElement<HTMLInputElement>('setting-debug'),
      reduceMotionInput: requireElement<HTMLInputElement>('setting-reduce-motion'),
    },
    {
      onOpenCamera: () => {
        void startCamera();
      },
      onStartDemo: () => {
        void startDemo();
      },
      onStop: () => {
        stopAll();
      },
      onReset: () => {
        settingsStore.reset();
        settings = settingsStore.load();
        menu.syncFromSettings(settings);
        audio.setMasterGain(settings.volume);
        audio.setMuted(settings.muted);
        lifecycle.setReduceMotion(settings.reduceMotion);
        if (detector)
          detector.rebuild({
            dictionary: settings.dictionary,
            expectedTagId: settings.expectedTagId,
          });
        status.show('Settings reset to defaults.', 'ok');
      },
      onSettingChange: (patch) => {
        applySettings(patch);
      },
    }
  );
  menu.syncFromSettings(settings);

  bindAboutMetadata();

  globalThis.addEventListener('resize', () => {
    resizeOverlay(dom, overlay);
    lifecycle = createLifecycle(stageFrameSize(dom));
  });
  globalThis.addEventListener('beforeunload', () => {
    stopAll();
    audio.dispose();
  });

  function start(): void {
    onboarding.showIfNeeded(settings.onboardingComplete);
    status.setHint('Point the camera at a sculpture tag to begin, or open the menu for the demo.');
  }

  function stop(): void {
    stopAll();
    audio.dispose();
  }

  function markOnboardingComplete(): void {
    applySettings({ onboardingComplete: true });
  }

  function applySettings(patch: Partial<Settings>): void {
    const next: Settings = { ...settings, ...patch };
    const result = settingsStore.save(next);
    if (!result.ok) {
      status.show(`Could not save setting: ${result.error.message}`, 'error');
      return;
    }
    settings = result.value;
    if ('volume' in patch) audio.setMasterGain(settings.volume);
    if ('muted' in patch) audio.setMuted(settings.muted);
    if ('reduceMotion' in patch) lifecycle.setReduceMotion(settings.reduceMotion);
    if (('dictionary' in patch || 'expectedTagId' in patch) && detector) {
      detector.rebuild({ dictionary: settings.dictionary, expectedTagId: settings.expectedTagId });
    }
    menu.syncFromSettings(settings);
  }

  async function startCamera(): Promise<void> {
    stopAll();
    status.show('Opening camera…');
    const opened = await openCamera({
      facingMode: 'environment',
      idealWidth: 1280,
      idealHeight: 720,
    });
    if (!opened.ok) {
      status.show(describeCameraError(opened.error), 'error', { autoHideMs: 0 });
      status.setHint('Try the simulated demo from the menu — no camera needed.');
      return;
    }
    camera = opened.value;
    dom.video.srcObject = camera.mediaStream;
    try {
      await dom.video.play();
    } catch {
      // autoplay may be blocked; the muted, playsinline video tag usually plays anyway
    }
    await waitForVideoMetadata(dom.video);

    const grabbed = createVideoFrameGrabber({ video: dom.video, maxDimension: 480 });
    if (!grabbed.ok) {
      status.show(`Frame grabber failed: ${grabbed.error.message}`, 'error', { autoHideMs: 0 });
      camera.stop();
      camera = null;
      return;
    }
    grabber = grabbed.value;
    detector = createMarkerDetector({
      dictionary: settings.dictionary,
      expectedTagId: settings.expectedTagId,
    });
    lifecycle = createLifecycle({
      frameWidth: grabber.width,
      frameHeight: grabber.height,
      reduceMotion: settings.reduceMotion,
    });
    await audio.start();
    mode = 'camera';
    status.show('Looking for the sculpture tag…', 'neutral');
    status.setHint(
      'Hold the phone so the printed tag is fully in view. The camera feed stays on this device.'
    );
    runLoop();
  }

  async function startDemo(): Promise<void> {
    stopAll();
    status.show('Starting simulated demo…', 'neutral');
    if (dom.video.srcObject) {
      dom.video.srcObject = null;
    }
    const size = stageFrameSize(dom);
    simulation = createSimulation({
      width: size.frameWidth,
      height: size.frameHeight,
      tagId: settings.expectedTagId,
      seed: Math.floor(Math.random() * 100),
    });
    lifecycle = createLifecycle(size);
    await audio.start();
    mode = 'demo';
    status.setHint(
      'Simulated viewer drifting in and out of view. Open the menu to switch to camera.'
    );
    runLoop();
  }

  function stopAll(): void {
    if (raf !== null) {
      globalThis.cancelAnimationFrame(raf);
      raf = null;
    }
    if (grabber) {
      grabber.dispose();
      grabber = null;
    }
    if (camera) {
      camera.stop();
      camera = null;
    }
    if (dom.video.srcObject) {
      dom.video.srcObject = null;
    }
    detector = null;
    simulation = null;
    lifecycle.reset();
    void audio.stop();
    overlay.dispose();
    mode = 'idle';
    status.setHint('Stopped. Open the menu to start camera or the demo.');
  }

  function runLoop(): void {
    if (raf !== null) return;
    const tick = (nowMs: number): void => {
      raf = null;
      const sample = nextSample(nowMs);
      const snapshot = lifecycle.observe(sample);
      audio.apply(snapshot.audio);
      overlay.render(snapshot, nowMs);
      maybeUpdateLiveStatus(snapshot.detection !== null);
      if (mode !== 'idle') {
        raf = globalThis.requestAnimationFrame(tick);
      }
    };
    raf = globalThis.requestAnimationFrame(tick);
  }

  function nextSample(timestamp: number): FrameSample {
    if (mode === 'camera' && grabber && detector) {
      const imageData = grabber.grab();
      if (!imageData) return { timestamp, detection: null };
      return detector.process(imageData, timestamp);
    }
    if (mode === 'demo' && simulation) {
      return simulation.sample(timestamp);
    }
    return { timestamp, detection: null };
  }

  let lastDetectedHint = false;
  function maybeUpdateLiveStatus(detected: boolean): void {
    if (detected === lastDetectedHint) return;
    lastDetectedHint = detected;
    if (detected) {
      status.show(mode === 'demo' ? 'Simulated tag in view' : 'Tag in view', 'ok');
      status.setHint(null);
    } else {
      status.setHint(
        mode === 'demo'
          ? 'Simulated viewer between glances.'
          : 'Searching for the tag — make sure it’s well-lit and not too small in the frame.'
      );
    }
  }

  function bindAboutMetadata(): void {
    const set = (id: string, value: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    set('meta-version', __APP_VERSION__);
    set('meta-commit', __GIT_COMMIT__);
    set('meta-built-at', __BUILT_AT__);
    const repo = document.getElementById('meta-repo');
    if (repo instanceof HTMLAnchorElement) repo.href = __REPOSITORY_URL__;
    const privacy = document.getElementById('meta-privacy');
    if (privacy instanceof HTMLAnchorElement)
      privacy.href = `${import.meta.env.BASE_URL}privacy.html`;
  }

  return { start, stop };
}

function collectDom(): DomRefs {
  return {
    video: requireElement<HTMLVideoElement>('camera-video'),
    visualCanvas: requireElement<HTMLCanvasElement>('visual-canvas'),
    debugCanvas: requireElement<HTMLCanvasElement>('debug-canvas'),
    stage: requireElement('stage'),
    statusPill: requireElement('status-pill'),
    hint: requireElement('hint'),
  };
}

function requireElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing required DOM element #${id}`);
  return el as T;
}

function resizeOverlay(dom: DomRefs, overlay: OverlayRenderer): void {
  const rect = dom.stage.getBoundingClientRect();
  overlay.resize(rect.width, rect.height);
  dom.debugCanvas.hidden = false;
}

function stageFrameSize(dom: DomRefs): {
  frameWidth: number;
  frameHeight: number;
  reduceMotion: boolean;
} {
  const rect = dom.stage.getBoundingClientRect();
  return {
    frameWidth: Math.max(1, Math.round(rect.width)),
    frameHeight: Math.max(1, Math.round(rect.height)),
    reduceMotion: false,
  };
}

async function waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 1 && video.videoWidth > 0) return;
  await new Promise<void>((resolve) => {
    const handler = (): void => {
      video.removeEventListener('loadedmetadata', handler);
      resolve();
    };
    video.addEventListener('loadedmetadata', handler);
  });
}

export type { StatusController, MenuController, OnboardingController };
