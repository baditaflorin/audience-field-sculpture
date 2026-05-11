import type { AudioState } from '../types/domain.js';
import { clamp } from './clamp.js';

export interface AudioEngine {
  isRunning(): boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
  apply(state: AudioState): void;
  setMasterGain(value: number): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}

export interface AudioEngineConfig {
  readonly initialGain: number;
  readonly muted: boolean;
}

interface InternalNodes {
  readonly context: AudioContext;
  readonly carrier: OscillatorNode;
  readonly modulator: OscillatorNode;
  readonly modulatorGain: GainNode;
  readonly noise: AudioBufferSourceNode;
  readonly noiseGain: GainNode;
  readonly masterGain: GainNode;
}

export function createAudioEngine(config: AudioEngineConfig): AudioEngine {
  let nodes: InternalNodes | null = null;
  let running = false;
  let masterValue = clamp(config.initialGain, 0, 1);
  let muted = config.muted;

  function effectiveGain(): number {
    return muted ? 0 : masterValue;
  }

  function build(): InternalNodes {
    type WebkitWindow = typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const Ctor =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : (globalThis as WebkitWindow).webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio not available in this browser.');
    const context = new Ctor();

    const masterGain = context.createGain();
    masterGain.gain.value = effectiveGain();
    masterGain.connect(context.destination);

    const carrier = context.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = 110;

    const modulator = context.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = 0.5;

    const modulatorGain = context.createGain();
    modulatorGain.gain.value = 30;

    modulator.connect(modulatorGain);
    modulatorGain.connect(carrier.frequency);

    const carrierGain = context.createGain();
    carrierGain.gain.value = 0.4;
    carrier.connect(carrierGain);
    carrierGain.connect(masterGain);

    const noise = context.createBufferSource();
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) {
      channel[i] = (Math.random() * 2 - 1) * 0.3;
    }
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseGain = context.createGain();
    noiseGain.gain.value = 0;
    noise.connect(noiseGain);
    noiseGain.connect(masterGain);

    carrier.start();
    modulator.start();
    noise.start();

    return { context, carrier, modulator, modulatorGain, noise, noiseGain, masterGain };
  }

  return {
    isRunning: () => running,
    async start() {
      if (running) return;
      nodes ??= build();
      if (nodes.context.state === 'suspended') await nodes.context.resume();
      running = true;
    },
    async stop() {
      if (!nodes) return;
      running = false;
      if (nodes.context.state === 'running') await nodes.context.suspend();
    },
    apply(state) {
      if (!nodes) return;
      const t = nodes.context.currentTime;
      nodes.carrier.frequency.setTargetAtTime(clamp(state.carrierHz, 40, 1200), t, 0.08);
      nodes.modulator.frequency.setTargetAtTime(clamp(state.modulatorHz, 0.05, 8), t, 0.2);
      nodes.modulatorGain.gain.setTargetAtTime(clamp(state.amplitude * 60, 0, 80), t, 0.2);
      nodes.noiseGain.gain.setTargetAtTime(clamp(state.noiseLevel, 0, 0.4), t, 0.3);
    },
    setMasterGain(value) {
      masterValue = clamp(value, 0, 1);
      if (nodes) {
        nodes.masterGain.gain.setTargetAtTime(effectiveGain(), nodes.context.currentTime, 0.05);
      }
    },
    setMuted(value) {
      muted = value;
      if (nodes) {
        nodes.masterGain.gain.setTargetAtTime(effectiveGain(), nodes.context.currentTime, 0.05);
      }
    },
    dispose() {
      if (!nodes) return;
      running = false;
      try {
        nodes.carrier.stop();
        nodes.modulator.stop();
        nodes.noise.stop();
      } catch {
        // already stopped
      }
      void nodes.context.close();
      nodes = null;
    },
  };
}
