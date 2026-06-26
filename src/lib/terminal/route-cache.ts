// Shared route-handler plumbing for the terminal's data feeds.
//
// Every feed route wants the same three things the banner route hand-rolled
// (src/app/api/banner/route.ts):
//   1. a SHARED THROTTLE — N clients polling one cached route = ~1 upstream call
//      per revalidate window (the `use cache`/cacheLife layer, set per-route).
//   2. SINGLE-FLIGHT — collapse concurrent cache-misses for the SAME key into one
//      upstream fetch (a stampede `use cache` alone doesn't prevent).
//   3. LAST-KNOWN-GOOD per key — on an upstream failure, serve the most recent
//      good payload for THAT key (mint), never an empty/broken UI.
//
// This module factors (2) and (3) into a tiny keyed helper so each route stays a
// few lines. (1) stays in each route (the cacheLife cadence differs per upstream).

type KeyedOpts<T> = {
  /** Do the real upstream fetch for a key. Throws on failure. */
  fetcher: (key: string) => Promise<T>;
  /** Whether a result is "good" enough to cache as last-known-good. */
  isGood: (value: T) => boolean;
  /** Fallback when there's no last-known-good for a key yet (cold failure). */
  empty: () => T;
  /** Label for error logs (so a 429 vs a bug is visible, not swallowed). */
  label: string;
};

/** Max distinct keys to retain last-known-good for, per fetcher. Bounds the map
 *  so a long-running server can't leak memory across unbounded distinct mints /
 *  quote tuples; evicts the oldest insertion (Map preserves insertion order). */
const LAST_GOOD_CAP = 500;

/** A keyed single-flight + last-known-good wrapper around an async fetcher. */
export function createKeyedFetcher<T>(opts: KeyedOpts<T>) {
  const inFlight = new Map<string, Promise<T>>();
  const lastGood = new Map<string, T>();

  // Insert (refreshing recency) and evict the oldest key past the cap.
  const remember = (key: string, value: T) => {
    lastGood.delete(key); // re-insert so this key becomes the most-recent
    lastGood.set(key, value);
    if (lastGood.size > LAST_GOOD_CAP) {
      lastGood.delete(lastGood.keys().next().value as string);
    }
  };

  return async function get(key: string): Promise<T> {
    const existing = inFlight.get(key);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const value = await opts.fetcher(key);
        if (opts.isGood(value)) remember(key, value);
        // Good → cache + return; otherwise prefer a prior good over the empty.
        return opts.isGood(value) ? value : lastGood.get(key) ?? value;
      } catch (err) {
        // Don't swallow it: log the classified upstream failure server-side, then
        // degrade to this key's last good (or empty on a cold failure).
        console.error(`[feed:${opts.label}] upstream failed for "${key}":`, err);
        return lastGood.get(key) ?? opts.empty();
      } finally {
        inFlight.delete(key);
      }
    })();

    inFlight.set(key, promise);
    return promise;
  };
}

/** Guard against `"use cache"` locking in a TRANSIENT empty result for the whole
 *  `expire` window (the bug where a single cold-instance/RPC hiccup made a token
 *  show an empty chart / holders / trades for ~5 min). Pattern: read the cached
 *  value; if it's empty, do ONE uncached live fetch so a poisoned/cold cache
 *  entry can't persist. Only the cached path is shared across clients — the
 *  uncached fallback is the rare miss. Use for every list feed whose empty state
 *  must never stick (ohlcv, trades, holders).
 *
 *  @param cached   the `"use cache"`-wrapped getter (shared, may return empty)
 *  @param live     the same getter WITHOUT the cache wrapper (fresh fetch)
 *  @param isEmpty  what counts as an empty/poisoned result to retry past */
export async function resilientList<T>(
  cached: () => Promise<T>,
  live: () => Promise<T>,
  isEmpty: (v: T) => boolean,
): Promise<T> {
  const value = await cached();
  if (!isEmpty(value)) return value;
  try {
    return await live();
  } catch {
    return value;
  }
}

/** Standard JSON response with a CDN hint matching the cache layer. */
export function jsonWithCache(body: unknown, sMaxAge: number, swr: number): Response {
  return Response.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
    },
  });
}
