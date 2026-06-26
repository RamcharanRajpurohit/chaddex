// GET /api/ohlcv/[mint]?tf=1m — OHLCV candles for the chart.
//
// Two upstream steps, cached at DIFFERENT cadences:
//   1. mint → pool address. Pools rarely change, so this is cached LONG (10 min)
//      and shared across all timeframes for a token → ~0 steady-state cost.
//   2. pool + timeframe → candles. Cached at revalidate 60s (≥ Gecko's max-age=30).
//
// Returns { pool: null, candles: [] } when Gecko hasn't indexed a pool yet (the
// verified fresh-token gap) — the client renders the "chart indexing…" skeleton.
//
// Cost: ≤ ~1-2 Gecko calls/min/token (pool lookup amortized), independent of how
// many clients watch — well under Gecko's 30 req/min keyless budget.

import { cacheLife } from "next/cache";
import { fetchOhlcv, isTimeframe, type Timeframe } from "@/lib/terminal/gecko";
import { getPoolCached } from "@/lib/terminal/pool-cache";
import {
  createKeyedFetcher,
  jsonWithCache,
  resilientList,
} from "@/lib/terminal/route-cache";
import type { Candle } from "@/lib/terminal/types";

// OHLCV: keyed by "pool|tf".
const getCandles = createKeyedFetcher<Candle[]>({
  label: "ohlcv",
  fetcher: (key) => {
    const [pool, tf] = key.split("|");
    return fetchOhlcv(pool, tf as Timeframe);
  },
  isGood: (v) => v.length > 0,
  empty: () => [],
});

async function getCandlesCached(pool: string, tf: Timeframe): Promise<Candle[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  return getCandles(`${pool}|${tf}`);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  const tfParam = new URL(req.url).searchParams.get("tf") ?? "1m";
  const tf: Timeframe = isTimeframe(tfParam) ? tfParam : "1m";

  const { pool, rateLimited } = await getPoolCached(mint);
  if (!pool) {
    // No pool: either Gecko hasn't indexed the token yet (chart "indexing…") or it
    // rate-limited us (chart "retrying…"). `rateLimited` lets the UI say which.
    return jsonWithCache({ pool: null, candles: [], rateLimited }, 30, 60);
  }
  // Never let a transient empty stick for the whole cache window (see resilientList).
  const candles = await resilientList(
    () => getCandlesCached(pool, tf),
    () => getCandles(`${pool}|${tf}`),
    (v) => v.length === 0,
  );
  return jsonWithCache({ pool, candles, timeframe: tf }, 30, 60);
}
