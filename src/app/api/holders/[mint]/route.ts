// GET /api/holders/[mint] — holder picture for the MIDDLE column.
//
// TWO INDEPENDENT keyless sources, each cached on its OWN success (not one merged
// blob), so a transient failure of one can never poison another:
//   • count            → Jupiter holderCount (via the shared token-detail cache)
//   • Gecko /info       → 4-band distribution + the token's developer wallet
//
// The Alchemy `getTokenLargestAccounts` per-wallet source was REMOVED: it 503s/
// hangs (~13s) on the free serverless tier and never populated in production
// (see holders.ts for the live evidence). Gecko's bands + developer wallet give
// the same concentration picture, fast and free — the fomo terminal surfaces
// exactly this ("Top 10 holding X%"), not a per-account list.

import { cacheLife } from "next/cache";
import {
  fetchHolderCount,
  fetchGeckoDistribution,
  fetchDeveloper,
  fetchDescription,
  fetchTopWallets,
} from "@/lib/terminal/holders";
import { createKeyedFetcher, jsonWithCache } from "@/lib/terminal/route-cache";
import type { Distribution, Developer, Holder } from "@/lib/terminal/types";

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

const getDeveloper = createKeyedFetcher<Developer | undefined>({
  label: "holders:developer",
  fetcher: fetchDeveloper,
  isGood: (v) => v !== undefined,
  empty: () => undefined,
});

const getDescription = createKeyedFetcher<string | undefined>({
  label: "holders:description",
  fetcher: fetchDescription,
  isGood: (v) => v !== undefined && v.length > 0,
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
async function developerCached(mint: string): Promise<Developer | undefined> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  return getDeveloper(mint);
}
async function descriptionCached(mint: string): Promise<string | undefined> {
  "use cache";
  // Descriptions never change — cache long.
  cacheLife({ stale: 3600, revalidate: 86400, expire: 172800 });
  return getDescription(mint);
}
async function walletsCached(mint: string): Promise<Holder[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  return getWallets(mint);
}

// Wallets are the one feed that must never be cached EMPTY: a single transient
// cold-instance failure would otherwise lock an empty holders list in for the
// whole `expire` window (the bug where some tokens showed 0 holders for ~5min).
// So: try the cached path first; if it's empty, do ONE uncached live fetch so a
// poisoned/cold cache entry can't persist. Only the cached path is shared across
// clients; the fallback is the rare miss.
async function walletsResilient(mint: string): Promise<Holder[]> {
  const cached = await walletsCached(mint);
  if (cached.length > 0) return cached;
  try {
    return await getWallets(mint); // uncached, with its own retry inside
  } catch {
    return [];
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  const [count, distribution, developer, description, wallets] = await Promise.all([
    countCached(mint),
    geckoDistCached(mint),
    developerCached(mint),
    descriptionCached(mint),
    walletsResilient(mint),
  ]);
  return jsonWithCache(
    { holders: { count, distribution, developer, description, wallets } },
    30,
    60,
  );
}
