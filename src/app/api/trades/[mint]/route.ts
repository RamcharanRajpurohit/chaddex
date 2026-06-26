// GET /api/trades/[mint] — recent live trades for the MIDDLE column feed.
//
// Upstream: mint → pool (shared cache) → Gecko /pools/{pool}/trades (KEYLESS,
// max-age=30). Cadence: revalidate 30s ≥ upstream. Returns { trades: [] } when no
// pool yet (fresh token) — the trades tab shows its empty/indexing state.

import { cacheLife } from "next/cache";
import { fetchTrades } from "@/lib/terminal/gecko";
import { getPoolCached } from "@/lib/terminal/pool-cache";
import {
  createKeyedFetcher,
  jsonWithCache,
  resilientList,
} from "@/lib/terminal/route-cache";
import type { Trade } from "@/lib/terminal/types";

const get = createKeyedFetcher<Trade[]>({
  label: "trades",
  fetcher: (pool) => fetchTrades(pool),
  isGood: (v) => v.length > 0,
  empty: () => [],
});

async function getCached(pool: string): Promise<Trade[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 120 });
  return get(pool);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  const { pool, rateLimited } = await getPoolCached(mint);
  if (!pool) {
    return jsonWithCache({ pool: null, trades: [], rateLimited }, 15, 30);
  }
  const trades = await resilientList(
    () => getCached(pool),
    () => get(pool),
    (v) => v.length === 0,
  );
  return jsonWithCache({ pool, trades }, 15, 30);
}
