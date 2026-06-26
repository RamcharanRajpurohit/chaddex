// GET /api/banner — the single server endpoint that feeds both token banners.
//
// Why a server route at all (vs. calling Jupiter from the client):
//   - The route's cache is a SHARED THROTTLE: N visitors → ~1 upstream Jupiter
//     call per revalidate window, not N. Each client polls *this* cached route.
//   - Keeps the data-fetching/validation server-side and uniform.
//
// Caching model (Next 16 Cache Components, verified against node_modules docs):
//   - `use cache` + cacheLife() must live in a helper fn (not the handler body).
//   - cacheLife `revalidate` = serve cached immediately, refresh in background
//     (ISR-style). The "seconds" profile (stale 30s / revalidate 1s / expire 60s)
//     fits a live price tick.
//   NOTE: Next's `use cache` is per-instance, not a global shared cache. For true
//   cross-instance dedup you'd add Redis/Upstash (see docs/data-layer-research.md
//   "paid/scale" design). The module-level single-flight below closes the
//   within-instance thundering-herd hole that `use cache` alone does not.

import { cacheLife } from "next/cache";
import { fetchTrending } from "@/lib/quotes/jupiter";
import { SEED_TOKENS } from "@/lib/quotes/seed";
import { isMemecoin, type Token } from "@/lib/quotes/types";

// How many tokens the banner shows after filtering.
const BANNER_SIZE = 25;

// Last-known-good: the most recent successful payload, kept in module memory.
// If an upstream fetch fails, we serve this rather than an empty bar. Seeded so
// even a cold first-call failure degrades to real (if static) tokens.
let lastGood: Token[] = SEED_TOKENS;

// Single-flight: collapse concurrent misses within this instance into ONE
// upstream fetch. Without this, every request that arrives during a cache miss
// would hit Jupiter simultaneously (a stampede `use cache` doesn't prevent).
let inFlight: Promise<Token[]> | null = null;

async function fetchBannerTokens(): Promise<Token[]> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const all = await fetchTrending(50); // over-fetch; denylist trims to BANNER_SIZE
      const memecoins = all.filter(isMemecoin).slice(0, BANNER_SIZE);
      // Guard against an upstream that returns 200 but an empty/garbage list.
      if (memecoins.length > 0) {
        lastGood = memecoins;
      }
      return lastGood;
    } catch {
      // Network/HTTP error → serve last-known-good (seed on a cold first failure).
      return lastGood;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

// Cached wrapper. cacheLife must be called INSIDE the cached scope (docs).
async function getBanner(): Promise<Token[]> {
  "use cache";
  // IMPORTANT: do NOT use the "seconds" preset here — its revalidate=1s would
  // regenerate the cache every second, and each regen makes a ~3–4s Jupiter call
  // (the free lite tier is slow). At 1s revalidate those overlap and pile up →
  // constant CPU + disk-write churn + memory growth (observed: ~1GB idle).
  // The client only polls every ~12s and the leaderboard barely moves, so a 30s
  // background revalidate is plenty: the route serves the cached payload instantly
  // and refreshes upstream at most ~twice a minute.
  cacheLife({ stale: 30, revalidate: 30, expire: 120 });
  return fetchBannerTokens();
}

export async function GET() {
  const tokens = await getBanner();
  return Response.json(
    { tokens, count: tokens.length },
    {
      // Belt-and-suspenders CDN hint (the `use cache` layer is the real mechanism).
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    },
  );
}
