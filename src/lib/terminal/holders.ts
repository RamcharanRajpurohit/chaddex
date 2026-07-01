// Holder data sources — each INDEPENDENT and PURE (no merging here); the route
// caches each on its own success, so a transient failure of one can never poison
// another.
//
//   • count        → Jupiter (holderCount), via the shared token-detail cache.
//   • Gecko /info  → 4-band distribution (top10/11-20/21-40/rest) + the token's
//                    developer wallet & its supply share. Often absent for
//                    brand-new tokens (Gecko hasn't indexed them yet).
//   • top wallets  → Alchemy `getTokenLargestAccounts` (top-20 accounts + each
//                    one's supply share). Needs ALCHEMY_RPC_URL. Verified live:
//                    HTTP 200, 20 wallets, ~7.6s with our key — NOT the "hangs on
//                    the free tier" the old comment claimed. The public RPC 429s
//                    instantly, which is why the keyed Alchemy endpoint is used.

import { createSolanaRpc, address } from "@solana/kit";
import { getTokenDetailCached } from "./token-detail-cache";
import { fetchGeckoHolders } from "./gecko";
import type { Distribution, Developer, Holder } from "./types";

/**
 * Holder count from Jupiter — read from the SHARED cached token-detail (the same
 * one /api/token serves), so the holders panel and the left detail panel don't
 * each fire an identical Jupiter search. One cached search, two consumers.
 */
export async function fetchHolderCount(
  mint: string,
): Promise<number | undefined> {
  const detail = await getTokenDetailCached(mint);
  return detail?.holderCount;
}

/** Gecko's 4-band distribution (or undefined if Gecko hasn't indexed it). */
export async function fetchGeckoDistribution(
  mint: string,
  signal?: AbortSignal,
): Promise<Distribution | undefined> {
  const { distribution } = await fetchGeckoHolders(mint, signal);
  return distribution;
}

/** Top-20 token accounts with each one's share of supply, via Alchemy.
 *  THROWS without a key or on RPC failure — the caller (createKeyedFetcher)
 *  turns a throw into last-known-good, and the route only caches NON-empty
 *  results, so a transient cold-instance hiccup can't poison the cache with [].
 *  Retries once: on Vercel, the first RPC call on a cold serverless instance
 *  occasionally times out; a single retry clears it. */
export async function fetchTopWallets(
  mint: string,
  signal?: AbortSignal,
): Promise<Holder[]> {
  const url = process.env.ALCHEMY_RPC_URL;
  if (!url) throw new Error("ALCHEMY_RPC_URL is not set");

  const rpc = createSolanaRpc(url);
  const mintAddress = address(mint);

  const attempt = async (): Promise<Holder[]> => {
    const [largest, supply] = await Promise.all([
      rpc.getTokenLargestAccounts(mintAddress).send({ abortSignal: signal }),
      rpc.getTokenSupply(mintAddress).send({ abortSignal: signal }),
    ]);
    const supplyUnits = BigInt(supply.value.amount);
    return largest.value.map((acct) => ({
      address: acct.address,
      amount: acct.amount,
      pct:
        supplyUnits > 0n
          ? Number((BigInt(acct.amount) * 1_000_000n) / supplyUnits) / 10_000
          : undefined,
    }));
  };

  try {
    return await attempt();
  } catch {
    // One retry for the transient cold-instance / RPC-hiccup case.
    return attempt();
  }
}

/** The token's developer/creator wallet + supply share, from Gecko `/info`
 *  (keyless). undefined when Gecko has no developer for this token. */
export async function fetchDeveloper(
  mint: string,
  signal?: AbortSignal,
): Promise<Developer | undefined> {
  const { developer } = await fetchGeckoHolders(mint, signal);
  return developer;
}

/** The token's prose description, from Gecko `/info` (keyless), for the "About"
 *  card. undefined when Gecko has none. */
export async function fetchDescription(
  mint: string,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const { description } = await fetchGeckoHolders(mint, signal);
  return description;
}
