// Shared mint→TokenDetail (Jupiter v2 search) fetch, cached once and reused by
// BOTH the /api/token route AND the holders route's count source. The Jupiter
// search is the same call for both, so caching it here means it's fetched once
// per mint per window — not once per route. (Mirrors pool-cache.ts, which shares
// the mint→pool lookup between ohlcv and trades.)

import { cacheLife } from "next/cache";
import { fetchTokenDetail } from "./token-detail";
import { createKeyedFetcher } from "./route-cache";
import type { TokenDetail } from "./types";

const get = createKeyedFetcher<TokenDetail | null>({
  label: "token-detail",
  fetcher: fetchTokenDetail,
  isGood: (v) => v !== null,
  empty: () => null,
});

export async function getTokenDetailCached(
  mint: string,
): Promise<TokenDetail | null> {
  "use cache";
  cacheLife({ stale: 10, revalidate: 15, expire: 60 });
  return get(mint);
}
