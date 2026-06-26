// GET /api/holders/[mint] — holder picture for the MIDDLE column.
//
// THREE INDEPENDENT sources, each cached on its OWN success (not one merged blob),
// so a transient failure of one can never poison another (the cache-poisoning bug
// this design replaces):
//   • count        → Jupiter holderCount
//   • Gecko bands  → GeckoTerminal 4-band distribution (often absent for new tokens)
//   • top wallets  → Alchemy getTokenLargestAccounts (needs ALCHEMY_RPC_URL)
//
// Distribution shown = Gecko's richer 4-band when present, ELSE one computed from
// the top-20 wallets — so EVERY token with wallet data shows a real breakdown.
// Each source has its own isGood that vouches ONLY for its own field, and its own
// last-known-good entry. A failing source degrades to its own last-good (or
// absent) without touching the others.

import { cacheLife } from "next/cache";
import {
  fetchHolderCount,
  fetchGeckoDistribution,
  fetchTopWallets,
  distributionFromWallets,
} from "@/lib/terminal/holders";
import { createKeyedFetcher, jsonWithCache } from "@/lib/terminal/route-cache";
import type { Distribution, Holder } from "@/lib/terminal/types";

// One keyed (single-flight + last-known-good) fetcher per source. Each isGood
// certifies only its own data, so e.g. a Gecko 429 can't be masked by count.
const getCount = createKeyedFetcher<number | undefined>({
  label: "holders:count",
  fetcher: fetchHolderCount,
  isGood: (v) => (v ?? 0) > 0,
  empty: () => undefined,
});

const getGeckoDist = createKeyedFetcher<Distribution | undefined>({
  label: "holders:gecko-dist",
  fetcher: fetchGeckoDistribution,
  isGood: (v) => v !== undefined,
  empty: () => undefined,
});

const getWallets = createKeyedFetcher<Holder[]>({
  label: "holders:wallets",
  fetcher: fetchTopWallets,
  isGood: (v) => v.length > 0,
  empty: () => [],
});

// Each source cached on its own cadence (all ~60s; holder data moves slowly).
async function countCached(mint: string): Promise<number | undefined> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  return getCount(mint);
}
async function geckoDistCached(mint: string): Promise<Distribution | undefined> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  return getGeckoDist(mint);
}
async function walletsCached(mint: string): Promise<Holder[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  return getWallets(mint);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  const [count, geckoDist, topWallets] = await Promise.all([
    countCached(mint),
    geckoDistCached(mint),
    walletsCached(mint),
  ]);
  // Prefer Gecko's 4-band breakdown; fall back to the wallet-derived 3-band one.
  const distribution = geckoDist ?? distributionFromWallets(topWallets);
  return jsonWithCache({ holders: { count, distribution, topWallets } }, 30, 60);
}
