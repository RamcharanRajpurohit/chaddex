// GeckoTerminal provider — KEYLESS source for the chart (OHLCV) and live trades.
//
// Flow: a token mint → its top liquidity POOL → that pool's OHLCV + trades.
// (Gecko's chart/trade endpoints are pool-scoped, not token-scoped.)
//
// VERIFIED GAP (the reason fetchPoolForToken returns null, never throws): a
// brand-new pump.fun token has full Jupiter data but Gecko `/pools` returns `[]`
// because Gecko only indexes a pool after it matures. The terminal must degrade
// (chart "indexing…") without crashing — so "no pool" is a normal return value,
// not an exception.
//
// PURE module (no Next APIs); caching lives in the route handlers. Rate budget:
// Gecko is 30 req/min keyless, cache-control max-age=30 — our routes revalidate
// at >= 30s, so steady state is ~1-2 upstream calls/min/token.

import {
  type Candle,
  type Trade,
  type Distribution,
  isFiniteNumber,
  isNonEmptyString,
  asNumber,
} from "./types";

export type GeckoHolders = {
  count?: number;
  distribution?: Distribution;
};

/** A token's liquidity pool, with the fields needed to build a TradingView pool
 *  symbol (Approach B in tradingview-address.ts): on-chain address, DEX id, the
 *  "BASE / QUOTE" name, and USD reserve (to pick the deepest pool). */
export type GeckoPool = {
  address: string;
  dex: string;
  name: string;
  reserveUsd: number;
};

const BASE = "https://api.geckoterminal.com/api/v2/networks/solana";

/** Chart timeframes the UI offers, mapped to Gecko's path + aggregate param. */
export const TIMEFRAMES = {
  "1m": { path: "minute", aggregate: 1 },
  "5m": { path: "minute", aggregate: 5 },
  "15m": { path: "minute", aggregate: 15 },
  "1h": { path: "hour", aggregate: 1 },
  "4h": { path: "hour", aggregate: 4 },
  "1d": { path: "day", aggregate: 1 },
} as const;

export type Timeframe = keyof typeof TIMEFRAMES;

export function isTimeframe(x: string): x is Timeframe {
  return Object.prototype.hasOwnProperty.call(TIMEFRAMES, x);
}

/** Thrown when GeckoTerminal rate-limits us (HTTP 429). Distinct type so callers
 *  can tell "rate-limited, retry shortly" apart from a genuine 200-with-no-data
 *  (a brand-new token Gecko hasn't indexed) — the two must not look identical in
 *  the UI ("retrying" vs "indexing"). */
export class GeckoRateLimitError extends Error {
  constructor() {
    super("GeckoTerminal 429 Too Many Requests");
    this.name = "GeckoRateLimitError";
  }
}

export function isRateLimit(err: unknown): boolean {
  return err instanceof GeckoRateLimitError;
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { headers: { accept: "application/json" }, signal });
  if (res.status === 429) throw new GeckoRateLimitError();
  if (!res.ok) {
    throw new Error(`GeckoTerminal ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Find the most-liquid pool for a token mint, or `null` if Gecko has none yet
 * (fresh token — the degraded path). Throws only on network/HTTP error.
 *
 * Gecko returns pools sorted by relevance; we take the first with a usable
 * address. `reserve_in_usd` could be used to pick the deepest pool, but the
 * first is already the canonical one for the token in practice.
 */
export async function fetchPoolForToken(
  mint: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = `${BASE}/tokens/${encodeURIComponent(mint)}/pools?page=1`;
  const json = await getJson(url, signal);
  const data = (json as { data?: unknown })?.data;
  if (!Array.isArray(data) || data.length === 0) return null; // ← the gap
  for (const pool of data) {
    const addr = (pool as { attributes?: { address?: unknown } })?.attributes?.address;
    if (isNonEmptyString(addr)) return addr;
    // some shapes carry the address on the relationship id `solana_<addr>`
    const id = (pool as { id?: unknown })?.id;
    if (isNonEmptyString(id)) {
      const stripped = id.replace(/^solana_/, "");
      if (stripped.length > 0) return stripped;
    }
  }
  return null;
}

/**
 * Fetch a token's pools as structured GeckoPool records (address, dex, name,
 * reserveUsd) — used by the address-based TradingView resolver (Approach B) to
 * build pool symbols. Empty array when Gecko has none yet (the fresh-token gap).
 * Throws only on network/HTTP error.
 */
export async function fetchPoolsForToken(
  mint: string,
  signal?: AbortSignal,
): Promise<GeckoPool[]> {
  const url = `${BASE}/tokens/${encodeURIComponent(mint)}/pools?page=1`;
  const json = await getJson(url, signal);
  const data = (json as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];
  const pools: GeckoPool[] = [];
  for (const pool of data) {
    const attrs = (pool as { attributes?: Record<string, unknown> })?.attributes;
    const dex = (pool as { relationships?: { dex?: { data?: { id?: unknown } } } })
      ?.relationships?.dex?.data?.id;
    if (!attrs) continue;
    const address = attrs.address;
    const name = attrs.name;
    if (!isNonEmptyString(address) || !isNonEmptyString(name) || !isNonEmptyString(dex)) {
      continue;
    }
    // reserve_in_usd is a STRING in Gecko's payload; coerce, default 0.
    const reserveUsd = asNumber(attrs.reserve_in_usd) ?? 0;
    pools.push({ address, dex, name, reserveUsd });
  }
  return pools;
}

/**
 * One OHLCV tuple from Gecko is [ts, open, high, low, close, volume]; ts is UNIX
 * seconds. Map → Candle, dropping any malformed tuple (never a NaN candle).
 */
function mapCandle(tuple: unknown): Candle | null {
  if (!Array.isArray(tuple) || tuple.length < 6) return null;
  const [ts, o, h, l, c, v] = tuple;
  if (
    !isFiniteNumber(ts) ||
    !isFiniteNumber(o) ||
    !isFiniteNumber(h) ||
    !isFiniteNumber(l) ||
    !isFiniteNumber(c)
  ) {
    return null;
  }
  return {
    time: ts, // UNIX seconds — used as-is by lightweight-charts (UTCTimestamp)
    open: o,
    high: h,
    low: l,
    close: c,
    volume: isFiniteNumber(v) ? v : 0,
  };
}

/**
 * Fetch OHLCV candles for a pool + timeframe, ascending by time (lightweight-
 * charts requires ascending, de-duplicated time). Throws on network/HTTP error.
 */
export async function fetchOhlcv(
  pool: string,
  timeframe: Timeframe,
  limit = 300,
  signal?: AbortSignal,
): Promise<Candle[]> {
  const tf = TIMEFRAMES[timeframe];
  const url =
    `${BASE}/pools/${encodeURIComponent(pool)}/ohlcv/${tf.path}` +
    `?aggregate=${tf.aggregate}&limit=${limit}`;
  const json = await getJson(url, signal);
  const list = (
    json as { data?: { attributes?: { ohlcv_list?: unknown } } }
  )?.data?.attributes?.ohlcv_list;
  if (!Array.isArray(list)) return [];

  // lightweight-charts requires ascending, unique time. A Map de-dupes by time
  // (last write wins), then we sort ascending — Gecko returns newest-first.
  const byTime = new Map<number, Candle>();
  for (const tuple of list) {
    const candle = mapCandle(tuple);
    if (candle) byTime.set(candle.time, candle);
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

function mapTrade(raw: unknown): Trade | null {
  const node = raw as { id?: unknown; attributes?: Record<string, unknown> };
  const a = node?.attributes;
  if (!a || typeof a !== "object") return null;

  const kind = a.kind;
  const side: "buy" | "sell" = kind === "sell" ? "sell" : "buy";
  const usd = asNumber(a.volume_in_usd);
  // Gecko frames every trade as a `from → to` swap and prices BOTH legs in USD.
  // The TOKEN under test is the leg the trader RECEIVES on a buy (`to`) and the
  // leg they SPEND on a sell (`from`); the other leg is the quote token (SOL/USDC)
  // priced ~$150/~$1. So the token's price is `price_to_in_usd` on a buy and
  // `price_from_in_usd` on a sell — picking the wrong leg shows the quote token's
  // price on every sell row (verified live on BONK: sell `price_to_in_usd` ≈ $66).
  const priceUsd =
    side === "sell"
      ? asNumber(a.price_from_in_usd) ?? asNumber(a.price_to_in_usd)
      : asNumber(a.price_to_in_usd) ?? asNumber(a.price_from_in_usd);
  const trader = a.tx_from_address;
  const txHash = a.tx_hash;
  const ts = a.block_timestamp;

  if (usd === undefined || priceUsd === undefined) return null;
  if (!isNonEmptyString(trader) || !isNonEmptyString(txHash)) return null;

  // block_timestamp is an ISO string → UNIX seconds. If it's missing or
  // unparseable, DROP the trade — a `time=0` fallback would render an absurd
  // "20629d ago" rather than a real age. No fabricated timestamps.
  const timeMs = typeof ts === "string" ? Date.parse(ts) : NaN;
  if (!Number.isFinite(timeMs)) return null;
  const time = Math.floor(timeMs / 1000);

  const id = isNonEmptyString(node.id) ? node.id : txHash;

  return { id, side, usd, priceUsd, trader, txHash, time };
}

/**
 * Fetch KEYLESS holder data for a token: total count + supply-concentration
 * bands (top 10 / 11–20 / 21–40 / rest). This always works (no RPC key), unlike
 * the per-wallet list. Returns {} if Gecko has no holder data yet. Throws on
 * network/HTTP error.
 */
export async function fetchGeckoHolders(
  mint: string,
  signal?: AbortSignal,
): Promise<GeckoHolders> {
  const url = `${BASE}/tokens/${encodeURIComponent(mint)}/info`;
  const json = await getJson(url, signal);
  const h = (
    json as { data?: { attributes?: { holders?: unknown } } }
  )?.data?.attributes?.holders as
    | { count?: unknown; distribution_percentage?: Record<string, unknown> }
    | undefined;
  if (!h || typeof h !== "object") return {};

  // Require ALL four bands to be real numbers; a partial payload would otherwise
  // render a silently-wrong 0% bar. If any band is missing, treat the whole
  // distribution as absent (the caller falls back to the wallet-derived one).
  const d = h.distribution_percentage;
  const top10 = asNumber(d?.top_10);
  const next10 = asNumber(d?.["11_20"]);
  const next20 = asNumber(d?.["21_40"]);
  const rest = asNumber(d?.rest);
  const distribution: Distribution | undefined =
    top10 !== undefined && next10 !== undefined && next20 !== undefined && rest !== undefined
      ? { top10, next10, next20, rest }
      : undefined;

  return { count: asNumber(h.count), distribution };
}

/**
 * Fetch recent trades for a pool, newest-first (as Gecko returns them). Bad
 * entries dropped. Throws on network/HTTP error.
 */
export async function fetchTrades(
  pool: string,
  signal?: AbortSignal,
): Promise<Trade[]> {
  const url = `${BASE}/pools/${encodeURIComponent(pool)}/trades`;
  const json = await getJson(url, signal);
  const data = (json as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];
  const trades: Trade[] = [];
  for (const raw of data) {
    const t = mapTrade(raw);
    if (t) trades.push(t);
  }
  return trades;
}
