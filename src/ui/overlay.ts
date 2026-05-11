import type { Snapshot } from '../application/lifecycle.js';

export interface OverlayRenderer {
  resize(width: number, height: number): void;
  render(snapshot: Snapshot, nowMs: number): void;
  dispose(): void;
}

export interface OverlayConfig {
  readonly canvas: HTMLCanvasElement;
  readonly debugCanvas: HTMLCanvasElement;
  readonly showDebug: () => boolean;
  readonly devicePixelRatio: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export function createOverlay(config: OverlayConfig): OverlayRenderer {
  const { canvas, debugCanvas } = config;
  const rawCtx = canvas.getContext('2d');
  const rawDebugCtx = debugCanvas.getContext('2d');
  if (!rawCtx || !rawDebugCtx) {
    throw new Error('Cannot acquire 2D contexts for overlay canvases.');
  }
  const ctx: CanvasRenderingContext2D = rawCtx;
  const dctx: CanvasRenderingContext2D = rawDebugCtx;
  const particles: Particle[] = [];
  let dpr = config.devicePixelRatio;
  let width = 0;
  let height = 0;
  let lastRenderMs: number | null = null;

  function resize(w: number, h: number): void {
    dpr = config.devicePixelRatio;
    width = w;
    height = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    debugCanvas.width = canvas.width;
    debugCanvas.height = canvas.height;
    debugCanvas.style.width = `${w}px`;
    debugCanvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function center(snapshot: Snapshot): { x: number; y: number } {
    if (snapshot.pose) {
      return { x: snapshot.pose.centerX, y: snapshot.pose.centerY };
    }
    return { x: width / 2, y: height / 2 };
  }

  function frameScale(snapshot: Snapshot): { sx: number; sy: number } {
    const sx = snapshot.detection ? width / Math.max(snapshot.detection.corners.tr.x * 2, 1) : 1;
    return { sx: sx > 0 ? 1 : 1, sy: 1 };
  }

  function emit(target: { x: number; y: number }, snapshot: Snapshot): void {
    const desired = snapshot.visual.particleCount;
    const deficit = desired - particles.length;
    const toEmit = Math.max(0, Math.min(deficit, 4));
    for (let i = 0; i < toEmit; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      const maxLife = 800 + Math.random() * 1400;
      particles.push({
        x: target.x + (Math.random() - 0.5) * 18,
        y: target.y + (Math.random() - 0.5) * 18,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: maxLife,
        maxLife,
      });
    }
  }

  function step(dtMs: number, snapshot: Snapshot): void {
    const dt = dtMs / 1000;
    const drag = Math.pow(0.92, dt * 60);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (!p) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= drag;
      p.vy *= drag;
      p.life -= dtMs;
      if (p.life <= 0) particles.splice(i, 1);
    }
    while (particles.length > snapshot.visual.particleCount + 20) particles.shift();
  }

  function draw(snapshot: Snapshot, nowMs: number): void {
    ctx.clearRect(0, 0, width, height);
    const c = center(snapshot);
    const v = snapshot.visual;
    const pulse =
      v.pulseHz > 0 ? 0.5 + 0.5 * Math.sin((nowMs / 1000) * Math.PI * 2 * v.pulseHz) : 0.75;
    const r = (snapshot.pose?.relativeSize ?? 0.1) * Math.max(width, height) * 0.85;
    const grad = ctx.createRadialGradient(c.x, c.y, r * 0.05, c.x, c.y, Math.max(r, 60));
    const alpha = 0.18 + v.intensity * 0.4 * pulse;
    grad.addColorStop(0, hsla(v.hueDeg, v.saturation, 0.55, alpha));
    grad.addColorStop(1, hsla(v.hueDeg, v.saturation, 0.1, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      const t = p.life / p.maxLife;
      ctx.beginPath();
      ctx.fillStyle = hsla(
        (v.hueDeg + (1 - t) * 60) % 360,
        v.saturation,
        0.62,
        Math.max(0, t * 0.7)
      );
      ctx.arc(p.x, p.y, 1.5 + (1 - t) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawDebug(snapshot: Snapshot): void {
    dctx.clearRect(0, 0, width, height);
    if (!config.showDebug()) return;
    dctx.lineWidth = 2;
    if (snapshot.detection) {
      const c = snapshot.detection.corners;
      dctx.strokeStyle = '#9eecff';
      dctx.beginPath();
      dctx.moveTo(c.tl.x, c.tl.y);
      dctx.lineTo(c.tr.x, c.tr.y);
      dctx.lineTo(c.br.x, c.br.y);
      dctx.lineTo(c.bl.x, c.bl.y);
      dctx.closePath();
      dctx.stroke();
    }
    dctx.fillStyle = 'rgba(0,0,0,0.45)';
    dctx.fillRect(8, 8, 220, 86);
    dctx.fillStyle = '#fff';
    dctx.font = '12px ui-monospace, SFMono-Regular, monospace';
    dctx.fillText(`attention: ${(snapshot.attention.intensity * 100).toFixed(0)}%`, 14, 26);
    dctx.fillText(`trend: ${snapshot.attention.trend}`, 14, 42);
    dctx.fillText(`samples: ${snapshot.attention.sampleCount}`, 14, 58);
    dctx.fillText(
      `pose size: ${snapshot.pose ? snapshot.pose.relativeSize.toFixed(2) : '—'}`,
      14,
      74
    );
    dctx.fillText(`hue: ${snapshot.visual.hueDeg.toFixed(0)}`, 14, 90);
  }

  return {
    resize,
    render(snapshot, nowMs) {
      if (width === 0 || height === 0) return;
      const dt = lastRenderMs == null ? 16 : Math.min(80, nowMs - lastRenderMs);
      lastRenderMs = nowMs;
      void frameScale(snapshot);
      const c = center(snapshot);
      if (snapshot.detection) emit(c, snapshot);
      step(dt, snapshot);
      draw(snapshot, nowMs);
      drawDebug(snapshot);
    },
    dispose() {
      particles.length = 0;
      ctx.clearRect(0, 0, width, height);
      dctx.clearRect(0, 0, width, height);
    },
  };
}

function hsla(hueDeg: number, saturation: number, lightness: number, alpha: number): string {
  return `hsla(${hueDeg.toFixed(1)}, ${(saturation * 100).toFixed(1)}%, ${(lightness * 100).toFixed(1)}%, ${alpha.toFixed(3)})`;
}
