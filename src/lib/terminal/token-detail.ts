// Jupiter Tokens v2 → TokenDetail mapper for the terminal's LEFT column.
//
// Same provider and discipline as lib/quotes/jupiter.ts (the banner), but reads
// the FULL token object: mcap/fdv/liquidity/decimals, per-window stats, and the
// `audit` block that powers the safety checklist. PURE (no Next APIs) so it's
// unit-testable with a mocked fetch; caching lives in the route handler.
//
// Endpoint (verified live, KEYLESS): GET lite-api.jup.ag/tokens/v2/search?query=
// — `query` accepts a MINT (exact token) OR free text (symbol/name, for search).
// Returns an array; for a mint we take the first entry whose `id` matches.

import {
  type TokenDetail,
  type StatsWindow,
  type StatsKey,
  type TokenAudit,
  isFiniteNumber,
  isNonEmptyString,
  numOr,
  asNumber,
  asBool,
} from "./types";

const BASE = "https://lite-api.jup.ag/tokens/v2";

type RawStats = Record<string, unknown> | undefined;
type RawAudit = Record<string, unknown> | undefined;
type RawToken = Record<string, unknown>;

function mapStats(raw: RawStats): StatsWindow | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  // priceChange is the only field we strictly need; the rest default to 0 so a
  // partial window still renders (never NaN).
  const priceChange = raw.priceChange;
  const window: StatsWindow = {
    priceChange: numOr(priceChange, 0),
    buyVolume: numOr(raw.buyVolume, 0),
    sellVolume: numOr(raw.sellVolume, 0),
    numBuys: numOr(raw.numBuys, 0),
    numSells: numOr(raw.numSells, 0),
    numTraders: numOr(raw.numTraders, 0),
  };
  return window;
}

function mapAudit(raw: RawAudit): TokenAudit | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const mintDisabled = asBool(raw.mintAuthorityDisabled);
  const freezeDisabled = asBool(raw.freezeAuthorityDisabled);
  // If neither authority flag is a real boolean, treat the audit as absent
  // rather than fabricate a checklist from nothing.
  if (mintDisabled === undefined && freezeDisabled === undefined) return undefined;
  return {
    mintAuthorityDisabled: mintDisabled ?? false,
    freezeAuthorityDisabled: freezeDisabled ?? false,
    topHoldersPercentage: asNumber(raw.topHoldersPercentage),
    devBalancePercentage: asNumber(raw.devBalancePercentage),
  };
}

/**
 * Map one raw Jupiter v2 token → TokenDetail, or null if it fails validation.
 * `change24h` is used AS-IS (already a percent — do NOT ×100).
 */
export function mapTokenDetail(raw: RawToken): TokenDetail | null {
  const mint = raw.id;
  const symbol = raw.symbol;
  const price = raw.usdPrice;
  const decimals = raw.decimals;

  if (!isNonEmptyString(mint)) return null;
  if (!isNonEmptyString(symbol)) return null;
  if (!isFiniteNumber(price)) return null;
  if (!isFiniteNumber(decimals)) return null; // needed for all base-unit math

  const stats24 = raw.stats24h as RawStats;
  const change24h = numOr((stats24 as Record<string, unknown> | undefined)?.priceChange, 0);

  // First-pool creation timestamp (ISO 8601 from Jupiter `firstPool.createdAt`) →
  // UNIX seconds for the "Created · X ago" row. Drop anything unparseable rather
  // than render an "Invalid Date".
  const firstPool = raw.firstPool as Record<string, unknown> | undefined;
  const createdMs = isNonEmptyString(firstPool?.createdAt)
    ? Date.parse(firstPool.createdAt)
    : NaN;
  const createdAt = Number.isFinite(createdMs) ? Math.floor(createdMs / 1000) : undefined;

  const stats: Partial<Record<StatsKey, StatsWindow>> = {};
  const w5 = mapStats(raw.stats5m as RawStats);
  const w1 = mapStats(raw.stats1h as RawStats);
  const w6 = mapStats(raw.stats6h as RawStats);
  const w24 = mapStats(stats24);
  if (w5) stats["5m"] = w5;
  if (w1) stats["1h"] = w1;
  if (w6) stats["6h"] = w6;
  if (w24) stats["24h"] = w24;

  return {
    mint,
    symbol,
    name: isNonEmptyString(raw.name) ? raw.name : symbol,
    logoURI: isNonEmptyString(raw.icon) ? raw.icon : undefined,
    decimals,
    price,
    change24h,
    mcap: asNumber(raw.mcap),
    fdv: asNumber(raw.fdv),
    liquidity: asNumber(raw.liquidity),
    holderCount: asNumber(raw.holderCount),
    circSupply: asNumber(raw.circSupply),
    createdAt,
    stats,
    audit: mapAudit(raw.audit as RawAudit),
  };
}

async function searchJup(query: string, signal?: AbortSignal): Promise<RawToken[]> {
  const url = `${BASE}/search?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { accept: "application/json" }, signal });
  if (!res.ok) {
    throw new Error(`Jupiter v2 search ${res.status} ${res.statusText}`);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Jupiter v2 search: expected an array");
  }
  return data as RawToken[];
}

/**
 * Fetch full detail for ONE token by mint. Returns null if the token isn't found
 * (the array is empty / no id matches) rather than throwing — a missing token is
 * a UI state, not an error. Throws only on network/HTTP failure so the route can
 * fall back to last-known-good.
 */
export async function fetchTokenDetail(
  mint: string,
  signal?: AbortSignal,
): Promise<TokenDetail | null> {
  const arr = await searchJup(mint, signal);
  // Prefer the entry whose id matches the mint exactly; fall back to first.
  const match = arr.find((t) => t.id === mint) ?? arr[0];
  return match ? mapTokenDetail(match) : null;
}

/**
 * Free-text search → up to `limit` TokenDetail results, ranked as Jupiter
 * returns them. Bad entries are dropped (never a broken row). Throws on
 * network/HTTP error.
 */
export async function searchTokens(
  query: string,
  limit = 12,
  signal?: AbortSignal,
): Promise<TokenDetail[]> {
  const q = query.trim();
  if (q.length === 0) return [];
  const arr = await searchJup(q, signal);
  const out: TokenDetail[] = [];
  for (const raw of arr) {
    const d = mapTokenDetail(raw);
    if (d) out.push(d);
    if (out.length >= limit) break;
  }
  return out;
}
