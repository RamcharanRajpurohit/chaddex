// Jupiter Tokens API v2 provider — the single source for the live banner.
//
// Why Jupiter v2 (see docs/data-layer-research.md for the full investigation):
//   - KEYLESS on lite-api.jup.ag (no secret to leak/rotate, no quota to blow).
//   - ONE call returns ranking + price + 24h change + holders + volume.
//   - `toptraded/24h` is ranked by what's actually swapped on Jupiter, so every
//     token is tradable BY CONSTRUCTION → no dead clicks on the banner.
//   - Covers established AND brand-new pump.fun tokens.
//
// This module is PURE (no Next.js APIs) so it can be unit-tested with a mocked
// fetch. Caching/single-flight lives in the route handler, not here.

import {
  type Token,
  isFiniteNumber,
  isNonEmptyString,
} from "./types";

// Keyless free tier. (Production-correct path is a free key on api.jup.ag — same
// shape, higher limits — but the server cache keeps us well under the lite limit.)
const BASE = "https://lite-api.jup.ag/tokens/v2";

// `toptraded` = ranked by 24h trade volume on Jupiter → trending + tradable.
const CATEGORY = "toptraded";
const INTERVAL = "24h";

// Shape of the fields we read from a Jupiter v2 token. Everything is optional /
// unknown until a guard proves otherwise — we never assume the provider's shape.
type JupTokenStats = { priceChange?: unknown };
type JupToken = {
  id?: unknown;
  symbol?: unknown;
  name?: unknown;
  icon?: unknown;
  usdPrice?: unknown;
  holderCount?: unknown;
  mcap?: unknown;
  stats24h?: JupTokenStats;
};

/**
 * Map one raw Jupiter token → our normalized Token, or null if it fails validation.
 * `change24h` is used AS-IS (already a percent — verified against DexScreener;
 * do NOT multiply by 100).
 */
export function mapJupToken(raw: JupToken): Token | null {
  const mint = raw.id;
  const symbol = raw.symbol;
  const name = raw.name;
  const price = raw.usdPrice;
  const change = raw.stats24h?.priceChange;

  if (!isNonEmptyString(mint)) return null;
  if (!isNonEmptyString(symbol)) return null;
  if (!isFiniteNumber(price)) return null;

  // change is best-effort: if missing/garbage, treat as flat rather than drop the
  // token (a real token with no 24h sample shouldn't vanish from the banner).
  const change24h = isFiniteNumber(change) ? change : 0;

  return {
    mint,
    symbol,
    name: isNonEmptyString(name) ? name : symbol,
    logoURI: isNonEmptyString(raw.icon) ? raw.icon : undefined,
    price,
    change24h,
    direction: change24h < 0 ? "down" : "up",
    holderCount: isFiniteNumber(raw.holderCount) ? raw.holderCount : undefined,
    marketCap: isFiniteNumber(raw.mcap) ? raw.mcap : undefined,
  };
}

/**
 * Fetch the trending ("toptraded") token list from Jupiter and normalize it.
 * Returns validated Token[] (bad entries dropped). Throws on network/HTTP error
 * so the caller can fall back to last-known-good / seed.
 *
 * @param limit how many tokens to request (we over-fetch a little, then the
 *   route filters non-memecoins and trims to the banner size).
 */
export async function fetchTrending(
  limit = 30,
  signal?: AbortSignal,
): Promise<Token[]> {
  const url = `${BASE}/${CATEGORY}/${INTERVAL}?limit=${limit}`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`Jupiter tokens v2 ${res.status} ${res.statusText}`);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Jupiter tokens v2: expected an array");
  }
  return data
    .map((t) => mapJupToken(t as JupToken))
    .filter((t): t is Token => t !== null);
}
