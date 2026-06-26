// Holder data sources — each INDEPENDENT and PURE (no merging, no fallback
// patches here). The route fetches these separately, caches each on its own
// success, and merges. So a transient failure of one source can never poison
// another (the cache-poisoning bug this replaces).
//
//   • count        → Jupiter (holderCount) — every token has it.
//   • Gecko bands  → GeckoTerminal /info (4-band: top10/11-20/21-40/rest); often
//                    absent for brand-new tokens (Gecko hasn't indexed them).
//   • top wallets  → Alchemy getTokenLargestAccounts (needs ALCHEMY_RPC_URL).
//   • distribution from wallets → computed from the top-20 wallet %s, so a fresh
//                    token Gecko hasn't indexed STILL shows an accurate breakdown.

import { createSolanaRpc, address } from "@solana/kit";
import { getTokenDetailCached } from "./token-detail-cache";
import { fetchGeckoHolders } from "./gecko";
import type { Holder, Distribution } from "./types";

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

/** Top-20 token accounts with each one's share of supply, via Alchemy. Returns
 *  [] without a key or on RPC failure — wallets are genuinely optional. */
export async function fetchTopWallets(
  mint: string,
  signal?: AbortSignal,
): Promise<Holder[]> {
  const url = process.env.ALCHEMY_RPC_URL;
  if (!url) return [];
  try {
    const rpc = createSolanaRpc(url);
    const mintAddress = address(mint);
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
  } catch (err) {
    console.error(`[holders] Alchemy top-wallets failed for ${mint}:`, err);
    return [];
  }
}

/**
 * Derive a concentration breakdown from the top-20 wallets' supply shares — a
 * REAL on-chain distribution for any token, including fresh ones Gecko hasn't
 * indexed. Top10 / 11-20 / Rest (3 bands; the 21-40 split needs >20 accounts,
 * which only Gecko provides). PURE. Returns undefined if there are no usable
 * percentages.
 */
export function distributionFromWallets(wallets: Holder[]): Distribution | undefined {
  const pcts = wallets.map((w) => w.pct).filter((p): p is number => p !== undefined);
  if (pcts.length === 0) return undefined;
  const sum = (a: number[]) => a.reduce((t, n) => t + n, 0);
  const top10 = sum(pcts.slice(0, 10));
  const next10 = sum(pcts.slice(10, 20));
  const rest = Math.max(0, 100 - top10 - next10);
  return { top10, next10, rest };
}
