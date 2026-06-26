"use client";

import { useRef, useState } from "react";
import { Eyebrow, SectionTitle, SectionSub, Accent } from "./section-ui";

// Primary feature: the phone-demo video, framed inside a device so the app-store
// backgrounds read as an in-app demo on our dark theme. Muted autoplay loop with
// playsinline (iOS would otherwise force fullscreen). One moving focal point.
// Audio is OFF by default (autoplay requires muted); a volume button appears on
// hover so visitors can opt into sound and toggle it back off.
export default function VideoBlock() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    const el = videoRef.current;
    if (!el) return;
    const next = !muted;
    el.muted = next;
    // Unmuting a long-running loop: make sure it's actually playing.
    if (!next && el.paused) void el.play().catch(() => {});
    setMuted(next);
  }

  return (
    <section className="mx-auto max-w-readable px-gutter py-section text-center">
      <Eyebrow>See it in action</Eyebrow>
      <SectionTitle>
        The whole market, <Accent>in your pocket</Accent>
      </SectionTitle>
      <SectionSub className="mx-auto">
        Discover, trade, and copy the winners — all from one fast, social-first
        wallet.
      </SectionSub>

      <div className="video-phone">
        <div className="video-glow" aria-hidden />
        <div className="video-device">
          <video
            ref={videoRef}
            className="video-el"
            src="/demo.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="ChadWallet app demo"
          />

          <button
            type="button"
            className="video-sound"
            onClick={toggleSound}
            aria-pressed={!muted}
            aria-label={muted ? "Unmute demo audio" : "Mute demo audio"}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <IconMuted /> : <IconSound />}
          </button>
        </div>
      </div>
    </section>
  );
}

function IconSound() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
      />
      <path
        d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMuted() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path
        d="M16.5 9.5l5 5m0-5l-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
