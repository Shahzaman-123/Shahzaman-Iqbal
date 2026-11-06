import { useEffect, useRef } from "react";

/**
 * ParticleIntro — Renando-style opening: white particles and small
 * triangles drift in from random positions and converge to form a
 * glowing "S" (Shahzaman's mark), which then glows red.
 * Runs inside the preloader; honours prefers-reduced-motion
 * (static glowing S, no drift). Canvas only, no libraries.
 */
export default function ParticleIntro() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf;
    let alive = true;
    let particles = [];
    let start = 0;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build(w, h);
    };

    // Sample target points from a big "S" drawn offscreen.
    const sampleTargets = (w, h) => {
      const off = document.createElement("canvas");
      const size = Math.min(w, h) * 0.62;
      off.width = size;
      off.height = size;
      const octx = off.getContext("2d");
      octx.fillStyle = "#fff";
      octx.font = `900 ${size * 0.92}px Anton, "Arial Narrow", sans-serif`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillText("S", size / 2, size / 2 + size * 0.03);
      const data = octx.getImageData(0, 0, size, size).data;
      const pts = [];
      const step = 4;
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          if (data[(y * size + x) * 4 + 3] > 128) {
            pts.push({ x: (w - size) / 2 + x, y: (h - size) / 2 + y });
          }
        }
      }
      return pts;
    };

    const build = (w, h) => {
      const targets = sampleTargets(w, h);
      const count = Math.min(420, targets.length);
      const picked = targets.sort(() => Math.random() - 0.5).slice(0, count);
      particles = picked.map((t) => ({
        tx: t.x,
        ty: t.y,
        sx: Math.random() * w,
        sy: Math.random() * h,
        delay: Math.random() * 0.45,
        size: Math.random() * 2.2 + 0.8,
        tri: Math.random() < 0.3,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.06,
        drift: Math.random() * Math.PI * 2,
      }));
      start = performance.now();
    };

    const drawS = (alpha) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const size = Math.min(w, h) * 0.62;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = "#ff2a2a";
      ctx.shadowBlur = 32;
      ctx.fillStyle = "#ff2a2a";
      ctx.font = `900 ${size * 0.92}px Anton, "Arial Narrow", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("S", w / 2, h / 2 + size * 0.03);
      ctx.restore();
    };

    const draw = (now) => {
      if (!alive) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const elapsed = (now - start) / 1000;
      const DURATION = 1.5;

      if (reduced) {
        drawS(1);
        return;
      }

      for (const p of particles) {
        const t = Math.min(Math.max((elapsed - p.delay) / DURATION, 0), 1);
        const e = 1 - Math.pow(1 - t, 3);
        // Drift shrinks as the particle converges.
        const wobble = (1 - e) * 14;
        const x = p.sx + (p.tx - p.sx) * e + Math.sin(now / 500 + p.drift) * wobble;
        const y = p.sy + (p.ty - p.sy) * e + Math.cos(now / 450 + p.drift) * wobble;
        ctx.globalAlpha = 0.35 + 0.65 * e;
        ctx.fillStyle = "#ffffff";
        if (p.tri) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(p.rot + now * 0.0004 * p.spin * 100);
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.4);
          ctx.lineTo(p.size * 1.3, p.size);
          ctx.lineTo(-p.size * 1.3, p.size);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Once converged, the glowing red S fades in over the particles.
      if (elapsed > DURATION * 0.75) {
        drawS(Math.min((elapsed - DURATION * 0.75) / 0.5, 1));
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    // Re-sample once webfonts arrive so the S uses Anton when available.
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (alive) build(window.innerWidth, window.innerHeight);
      });
    }
    raf = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-intro-canvas" aria-hidden="true" />;
}
