// Shared mint→pool lookup, cached LONG and reused by BOTH the ohlcv and trades
// routes. A token's canonical pool is the same whichever feed asks, so caching it
// once (per mint) means the pool discovery cost is paid ~once per 10 min per token
// instead of once per feed.
//
// The lookup returns WHY there's no pool, classified from the SAME single call (no
// extra Gecko request): `rateLimited` true = Gecko 429'd us (→ UI "retrying"),
// false = Gecko answered but has no pool yet (the fresh-token gap → "indexing").
// These must not look identical in the UI. Single-flight (one upstream call per
// concurrent miss) + last-known-good are inlined here because — unlike the other
// feeds — pool needs a richer return than createKeyedFetcher's single value.

import { cacheLife } from "next/cache";
import { fetchPoolForToken, isRateLimit } from "./gecko";

export type PoolLookup = { pool: string | null; rateLimited: boolean };

const inFlight = new Map<string, Promise<PoolLookup>>();
const lastGoodPool = new Map<string, string>();

async function lookupPool(mint: string): Promise<PoolLookup> {
  const existing = inFlight.get(mint);
  if (existing) return existing;

  const promise = (async (): Promise<PoolLookup> => {
    try {
      const pool = await fetchPoolForToken(mint);
      if (pool !== null) {
        lastGoodPool.set(mint, pool);
        return { pool, rateLimited: false };
      }
      return { pool: null, rateLimited: false }; // Gecko answered: no pool yet
    } catch (err) {
      const rateLimited = isRateLimit(err);
      // Log the classified failure server-side (don't swallow it), then degrade to
      // this mint's last-known-good pool if we have one — a 429 mid-session keeps
      // the chart working. Only a COLD failure (no prior pool) surfaces the flag.
      console.error(
        `[feed:pool] upstream failed for "${mint}" (rateLimited=${rateLimited}):`,
        err,
      );
      const prior = lastGoodPool.get(mint);
      if (prior) return { pool: prior, rateLimited: false };
      return { pool: null, rateLimited };
    } finally {
      inFlight.delete(mint);
    }
  })();

  inFlight.set(mint, promise);
  return promise;
}

export async function getPoolCached(mint: string): Promise<PoolLookup> {
  "use cache";
  const result = await lookupPool(mint);
  // Conditional cache lifetime (documented Next pattern — exactly one branch runs
  // per invocation). A real pool is near-static → cache it long. No pool (fresh
  // token OR a cold 429) → re-check fast, so a token isn't stuck "indexing" for
  // 5–10 min after its pool appears, and a transient 429 clears quickly.
  if (result.pool === null) {
    cacheLife({ stale: 30, revalidate: 30, expire: 60 });
    return result;
  }
  cacheLife({ stale: 300, revalidate: 600, expire: 1800 });
  return result;
}
