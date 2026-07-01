"use client";

import { useCallback, useEffect, useState } from "react";

// Persisted watchlist of favourited mints (localStorage), shared across the
// terminal. A tiny store — no provider needed: each consumer subscribes to the
// same `storage`-backed set and a same-tab event so toggles reflect everywhere
// instantly. Mirrors the paper-store discipline (one key, JSON, cross-tab sync).

const KEY = "chadwallet.watchlist.v1";
// Same-tab updates: the native `storage` event fires only in OTHER tabs, so we
// dispatch our own event to notify components in the CURRENT tab.
const EVENT = "chadwallet:watchlist";

function read(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((m): m is string => typeof m === "string") : []);
  } catch {
    return new Set();
  }
}

function write(set: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify([...set]));
  window.dispatchEvent(new Event(EVENT));
}

export function useWatchlist(): {
  watchlist: Set<string>;
  isWatched: (mint: string) => boolean;
  toggle: (mint: string) => void;
} {
  const [watchlist, setWatchlist] = useState<Set<string>>(read);

  // Re-read on both our same-tab event and the cross-tab `storage` event.
  useEffect(() => {
    const sync = () => setWatchlist(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((mint: string) => {
    const next = read();
    if (next.has(mint)) next.delete(mint);
    else next.add(mint);
    write(next);
  }, []);

  const isWatched = useCallback((mint: string) => watchlist.has(mint), [watchlist]);

  return { watchlist, isWatched, toggle };
}
