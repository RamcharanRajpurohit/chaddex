"use client";

import { useEffect, useRef } from "react";

// A field of dim green fireflies (jugnu) drifting over the dark, each softly
// twinkling. Ambient, premium, on-brand green. Loops forever, no deps.
// Ported from chadwallet-hero.html — runs only on the client (canvas + rAF).
export default function FireflyScene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let t = 0;
    let raf = 0;
    let flies: {
      x: number;
      y: number;
      r: number;
      ph: number;
      tw: number;
    }[] = [];

    function build() {
      const n = Math.round((W * H) / 14000); // density scales with area
      flies = [];
      for (let i = 0; i < n; i++) {
        flies.push({
          x: Math.random() * W,
          y: Math.random() * H, // fixed position — they don't move
          r: 0.7 + Math.random() * 1.9, // dot radius
          ph: Math.random() * Math.PI * 2, // random blink phase
          tw: 0.4 + Math.random() * 1.3, // random blink speed
        });
      }
    }

    function resize() {
      if (!cv || !ctx) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function frame() {
      if (!ctx) return;
      t += 1;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter"; // additive glow, like real fireflies

      for (const f of flies) {
        // stay in place; just blink on/off at their own random rate
        const tw = 0.35 + 0.3 * Math.sin(t * 0.02 * f.tw + f.ph);
        const a = Math.min(1, tw * 0.55);
        const rad = f.r;

        // soft radial glow
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad * 4);
        g.addColorStop(0, `rgba(38,237,128,${a * 0.9})`);
        g.addColorStop(0.4, `rgba(38,237,128,${a * 0.25})`);
        g.addColorStop(1, "rgba(38,237,128,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, rad * 4, 0, 7);
        ctx.fill();
        // bright core
        ctx.fillStyle = `rgba(180,255,214,${a})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, rad, 0, 7);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    }

    addEventListener("resize", resize);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  return <canvas id="scene" ref={ref} className="absolute inset-0 h-full w-full z-0" />;
}
