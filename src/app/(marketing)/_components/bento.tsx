"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BENTO_GRID } from "../_lib/features";
import { Eyebrow, SectionTitle } from "./section-ui";

// Coverflow carousel: the center card is large and raised; the previous/next
// cards sit smaller, lower, and dimmed on the sides. Auto-advances sideways.
// Pauses on hover/focus, respects prefers-reduced-motion.
//
// This is the ONE feature section now — it carries the full set of app-feature
// slides (what used to be a static 6-card grid) so everything lives in the
// carousel itself, no separate cards.
//
// 5s = lower bound of the accessibility-recommended 5–7s per slide (WCAG/NN/g).
// Slides are short (eyebrow + title), and we have pause-on-hover + arrows + dots.
const INTERVAL = 5000;

export default function Bento() {
  const [active, setActive] = useState(0);
  const n = BENTO_GRID.length;
  // pause held in a ref so hover toggling never restarts the timer (the old
  // state-based effect re-armed the interval constantly → erratic/stalled).
  const paused = useRef(false);

  const go = (next: number) => setActive(((next % n) + n) % n);

  // ONE stable interval for the component's life. Ticks every INTERVAL and
  // advances unless paused. Never re-arms, so cadence is always steady.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!paused.current) setActive((p) => (p + 1) % n);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [n]);

  // position of card idx relative to the active one: 0 center, -1 left, 1 right…
  const offset = (idx: number) => {
    let d = idx - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  return (
    <section className="mx-auto max-w-content px-gutter py-section">
      {/* big bottom gap so the raised center carousel card clears the heading */}
      <div className="mb-20 text-center md:mb-28">
        <Eyebrow>Everything you need</Eyebrow>
        <SectionTitle>One wallet. Every move.</SectionTitle>
      </div>

      <div
        className="cf"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        aria-roledescription="carousel"
        aria-label="App features"
      >
        <button className="cf-arrow prev" aria-label="Previous" onClick={() => go(active - 1)}>
          ‹
        </button>

        <div className="cf-stage">
          {BENTO_GRID.map((f, idx) => {
            const d = offset(idx);
            const pos = d === 0 ? "center" : d === -1 ? "left" : d === 1 ? "right" : "hidden";
            return (
              <article
                key={f.img}
                className={`cf-card ${pos}`}
                aria-hidden={d !== 0}
                onClick={() => d !== 0 && go(idx)}
              >
                <div className="cf-phone">
                  <Image
                    src={f.img}
                    alt={f.alt}
                    width={260}
                    height={527}
                    className="cf-img"
                  />
                </div>
                <div className="cf-caption">
                  <span className="inline-block text-eyebrow font-bold uppercase tracking-[0.1em] text-green">
                    {f.eyebrow}
                  </span>
                  <h3 className="cf-title">{f.title}</h3>
                </div>
              </article>
            );
          })}
        </div>

        <button className="cf-arrow next" aria-label="Next" onClick={() => go(active + 1)}>
          ›
        </button>
      </div>

      <div className="carousel-dots" role="tablist" aria-label="Choose feature">
        {BENTO_GRID.map((f, idx) => (
          <button
            key={f.img}
            className={`carousel-dot ${idx === active ? "active" : ""}`}
            aria-label={`Show ${f.eyebrow}`}
            aria-selected={idx === active}
            role="tab"
            onClick={() => go(idx)}
          />
        ))}
      </div>
    </section>
  );
}
