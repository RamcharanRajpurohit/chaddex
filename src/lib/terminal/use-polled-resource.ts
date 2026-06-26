"use client";

import { useEffect, useRef, useState } from "react";

// Generic polling hook for a keyed, cached terminal route — the single place the
// hard-won lifecycle discipline from use-banner.ts lives, so every feed (detail,
// ohlcv, trades, holders) gets it identically and correctly:
//
//   • AbortController per request; aborted on key change AND on unmount.
//   • inFlight guard → no overlapping fetches for the same key.
//   • visibility/focus aware → stop polling when the tab is hidden; refetch on
//     focus. (Saves upstream calls; matches the banner.)
//   • THE STALE-KEY RACE GUARD (the adversarial finding): every result is STAMPED
//     with the key it was fetched for. The hook returns data ONLY when its stamp
//     matches the current key — so selecting token B while A is in flight can
//     never show A's data under B (abort handles the network; the stamp handles
//     an already-resolved body, and it also makes the "reset on key change" free,
//     with NO synchronous setState in the effect — avoiding cascading renders).
//     The one place the stamp alone wasn't enough is the ERROR path: markError
//     must not copy a DIFFERENT key's data onto the new stamp (see there).
//
// Referential-stability rules (the documented 2.8GB failure mode):
//   • `computedUrl` is a STRING derived from the key — stable per key.
//   • `url`/`parse` are read from refs synced in an effect, so passing inline
//     functions does NOT re-fire the poll effect. Its deps are scalars only.

export type PollStatus = "idle" | "loading" | "success" | "error";

export type PolledResource<T> = {
  data: T | null;
  status: PollStatus;
  /** Manually trigger a refetch (e.g. a Retry button). */
  refetch: () => void;
};

type Stamped<T> = { key: string; data: T; status: PollStatus };

export function usePolledResource<T>(opts: {
  /** The cache key (e.g. mint, or `${mint}:${tf}`). null/"" disables polling. */
  key: string | null;
  /** Build the route URL from the key. Must be pure/stable per key. */
  url: (key: string) => string;
  /** Parse the JSON response → T, or null if invalid. */
  parse: (json: unknown) => T | null;
  /** Poll interval ms. */
  intervalMs: number;
  /** When false, the hook idles (no fetch). Default true. */
  enabled?: boolean;
}): PolledResource<T> {
  const { key, intervalMs, enabled = true } = opts;

  // State is STAMPED with the key it belongs to. We derive the returned data by
  // matching the stamp to the current key — so a key change instantly yields
  // `null` (loading) with no setState, and a late response for an old key is
  // ignored on read even if it slipped past the in-effect guard.
  const [state, setState] = useState<Stamped<T> | null>(null);

  // Refs synced in an effect (NOT during render) so the poll loop reads the
  // latest fn identity without them being deps.
  const urlRef = useRef(opts.url);
  const parseRef = useRef(opts.parse);
  useEffect(() => {
    urlRef.current = opts.url;
    parseRef.current = opts.parse;
  });

  const inFlight = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const latestKey = useRef<string | null>(null);
  const [refetchNonce, setRefetchNonce] = useState(0);

  const computedUrl = key && enabled ? opts.url(key) : null;

  useEffect(() => {
    if (!enabled || !key || !computedUrl) return;
    latestKey.current = key;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const fetchOnce = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const requestedKey = key; // stamp
      // Mark this key errored. Keep prior good data ONLY when it belongs to THIS
      // key (a later poll for the same token failing → keep showing its last good
      // value). When prev is a DIFFERENT key, we must NOT carry its data forward —
      // doing so rendered token A's price/decimals under token B (the leak this
      // guards). Different key → no data, so the UI shows an honest error, never
      // another token's numbers.
      const markError = () =>
        setState((prev) => {
          if (prev && prev.key === requestedKey && prev.status === "success") {
            return prev;
          }
          const carry = prev?.key === requestedKey ? prev?.data : undefined;
          return { key: requestedKey, data: carry as T, status: "error" };
        });
      try {
        const res = await fetch(urlRef.current(requestedKey), { signal: ac.signal });
        if (!res.ok) throw new Error(String(res.status));
        const json: unknown = await res.json();
        if (cancelled || requestedKey !== latestKey.current) return; // race guard
        const parsed = parseRef.current(json);
        if (parsed !== null) {
          setState({ key: requestedKey, data: parsed, status: "success" });
        } else {
          markError();
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (cancelled || requestedKey !== latestKey.current) return;
        markError();
      } finally {
        inFlight.current = false;
      }
    };

    const start = () => {
      if (timer) return;
      void fetchOnce();
      timer = setInterval(() => void fetchOnce(), intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onFocus = () => void fetchOnce();

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      stop();
      abortRef.current?.abort();
      // Release the single-flight guard for the NEXT key. The in-flight request
      // we just aborted will set this false again in its own `finally`, but only
      // after the abort rejection settles — by then the new key's fetchOnce has
      // already run and bailed on `inFlight.current`, leaving the chart stuck on
      // the skeleton until the next interval tick (~60s). Clearing it here lets
      // the new key fetch immediately; the aborted result is still discarded by
      // the stamp guard, so stale data can never show. (A rare abort-finally vs
      // interval-tick race can fire one extra same-key request — harmless: it's
      // CDN-cached and the stamp guard ignores any late result.)
      inFlight.current = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
    // computedUrl encodes key; the rest are scalars. url/parse are via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedUrl, intervalMs, enabled, refetchNonce]);

  // Derive the public value: data only when its stamp matches the current key.
  const matches = state !== null && state.key === key;
  const data = matches ? state.data ?? null : null;
  let status: PollStatus;
  if (!enabled || !key) status = "idle";
  else if (matches) status = state.status;
  else status = "loading"; // key changed; awaiting first response for the new key

  const refetch = () => setRefetchNonce((n) => n + 1);
  return { data, status, refetch };
}
