"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SEED_TOKENS } from "./quotes/seed";
import { isFiniteNumber, isNonEmptyString, type Token } from "./quotes/types";

// Live token data for the banner.
//
// THE ANTI-DRAG CONTRACT: the marquee DOM must be rendered ONCE and never
// re-rendered by React (a re-render restarts the CSS animation → the drag). So
// this hook does NOT put token data in React state that the marquee reads.
// Instead:
//   - `initialTokens` is captured ONCE (the seed) and never changes identity, so
//     the component renders a stable marquee that React leaves alone.
//   - `subscribe(cb)` lets the component receive live updates and patch the DOM
//     imperatively (textContent) — no re-render, animation untouched.
//   - `status` is the only React state; it lives on the <nav> wrapper (outside the
//     animated copies), so updating it can't restart the marquee.

// Poll cadence for the cached /api/banner route. Its cacheLife revalidate is 30s,
// so polling faster just re-reads the same payload — 30s matches the refresh and
// avoids the redundant calls the old 12s made.
const REFRESH_MS = 30_000;

export type BannerStatus = "seed" | "live" | "stale";

type Subscriber = (tokens: Token[]) => void;

type BannerState = {
  /** The token set rendered into the marquee DOM once (mount-stable). */
  initialTokens: Token[];
  status: BannerStatus;
  /** Subscribe to live token updates; returns an unsubscribe fn. */
  subscribe: (cb: Subscriber) => () => void;
};

function parseTokens(json: unknown): Token[] | null {
  if (typeof json !== "object" || json === null) return null;
  const arr = (json as { tokens?: unknown }).tokens;
  if (!Array.isArray(arr)) return null;
  const tokens = arr.filter(
    (t): t is Token =>
      typeof t === "object" &&
      t !== null &&
      isNonEmptyString((t as Token).mint) &&
      isNonEmptyString((t as Token).symbol) &&
      isFiniteNumber((t as Token).price) &&
      isFiniteNumber((t as Token).change24h),
  );
  return tokens.length > 0 ? tokens : null;
}

export function useBanner(): BannerState {
  // The marquee renders this set. It changes EXACTLY ONCE — seed → the first live
  // payload — then is frozen, so after load the marquee never re-renders and the
  // animation never restarts. (Subsequent membership shifts are intentionally not
  // re-rendered; only prices update via subscribe(). The set refreshes on reload.)
  const [initialTokens, setInitialTokens] = useState<Token[]>(SEED_TOKENS);
  const [status, setStatus] = useState<BannerStatus>("seed");

  const subscribers = useRef<Set<Subscriber>>(new Set());
  const latest = useRef<Token[] | null>(null);
  const locked = useRef(false); // true once the first live set is committed
  const inFlight = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const subscribe = useCallback((cb: Subscriber) => {
    subscribers.current.add(cb);
    // Replay the latest values immediately so a late subscriber isn't stale.
    if (latest.current) cb(latest.current);
    return () => {
      subscribers.current.delete(cb);
    };
  }, []);

  const fetchOnce = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/banner", { signal: ac.signal });
      if (!res.ok) throw new Error(String(res.status));
      const parsed = parseTokens(await res.json());
      if (parsed) {
        latest.current = parsed;
        if (!locked.current) {
          // First live payload: commit it as the stable render set (one re-render),
          // then freeze. From here only prices update via subscribers.
          locked.current = true;
          setInitialTokens(parsed);
        } else {
          // Push to subscribers → they patch the DOM directly (no re-render).
          subscribers.current.forEach((cb) => cb(parsed));
        }
        setStatus("live");
      } else {
        setStatus((s) => (s === "live" ? "stale" : s));
      }
    } catch {
      setStatus((s) => (s === "live" ? "stale" : s));
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      void fetchOnce();
      timer = setInterval(fetchOnce, REFRESH_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    const ac = abortRef;
    return () => {
      stop();
      ac.current?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchOnce]);

  return { initialTokens, status, subscribe };
}
