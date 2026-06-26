"use client";

import { useEffect, useState } from "react";
import { usePolledResource, type PolledResource } from "./use-polled-resource";
import { mapSwapQuote } from "./swap-quote";
import {
  type TokenDetail,
  type Candle,
  type Trade,
  type Holder,
  type HolderInfo,
  type SwapQuote,
  isFiniteNumber,
} from "./types";

// Poll cadences — each MATCHES its route's revalidate window (see the route
// files), so the client never out-paces the server cache: polling faster than the
// route revalidates just returns the same cached payload (wasted requests). The
// route's `use cache` is the real upstream throttle; these decide how often a
// client asks the cache, and there's no point asking more often than it refreshes.
const DETAIL_MS = 10_000; // /api/token revalidate 15s — detail is the live price; 10s keeps it snappy and is acceptable
const OHLCV_MS = 60_000; // /api/ohlcv revalidate 60s
const TRADES_MS = 30_000; // /api/trades revalidate 30s
const HOLDERS_MS = 60_000; // /api/holders revalidate 60s

// ── parsers (defensive — never let bad JSON reach the UI) ──────────────────

// The route already returns a mapped TokenDetail; we trust the contract here and
// only require the object to exist (consistent with parseTrades/parseHolders).
function parseDetail(json: unknown): TokenDetail | null {
  const t = (json as { token?: unknown })?.token;
  return t && typeof t === "object" ? (t as TokenDetail) : null;
}

function parseOhlcv(
  json: unknown,
): { pool: string | null; candles: Candle[]; rateLimited: boolean } | null {
  if (typeof json !== "object" || json === null) return null;
  const obj = json as { pool?: unknown; candles?: unknown; rateLimited?: unknown };
  const pool = typeof obj.pool === "string" ? obj.pool : null;
  const candles = Array.isArray(obj.candles)
    ? obj.candles.filter(
        (c): c is Candle =>
          typeof c === "object" &&
          c !== null &&
          isFiniteNumber((c as Candle).time) &&
          isFiniteNumber((c as Candle).close),
      )
    : [];
  return { pool, candles, rateLimited: obj.rateLimited === true };
}

function parseTrades(json: unknown): Trade[] | null {
  const arr = (json as { trades?: unknown })?.trades;
  if (!Array.isArray(arr)) return null;
  return arr.filter(
    (t): t is Trade =>
      typeof t === "object" &&
      t !== null &&
      typeof (t as Trade).id === "string" &&
      ((t as Trade).side === "buy" || (t as Trade).side === "sell"),
  );
}

function parseHolders(json: unknown): HolderInfo | null {
  const h = (json as { holders?: unknown })?.holders;
  if (!h || typeof h !== "object") return null;
  const obj = h as Partial<HolderInfo>;
  const topWallets = Array.isArray(obj.topWallets)
    ? obj.topWallets.filter(
        (w): w is Holder =>
          typeof w === "object" && w !== null && typeof (w as Holder).address === "string",
      )
    : [];
  return { count: obj.count, distribution: obj.distribution, topWallets };
}

// { symbol: string } — the best TV symbol to chart (a CEX pair, a DEX pool, or the
// bare `${SYM}USD` for TV's native error screen). Empty string = cold failure;
// rejected here so the caller keeps polling rather than charting "".
function parseTvSymbol(json: unknown): { symbol: string } | null {
  if (typeof json !== "object" || json === null) return null;
  const s = (json as { symbol?: unknown }).symbol;
  return typeof s === "string" && s.length > 0 ? { symbol: s } : null;
}

function parseQuote(json: unknown): SwapQuote | null {
  const q = (json as { quote?: unknown })?.quote;
  if (q === null || q === undefined || typeof q !== "object") return null;
  return mapSwapQuote(q as Record<string, unknown>);
}

function parseSearch(json: unknown): TokenDetail[] | null {
  const arr = (json as { tokens?: unknown })?.tokens;
  if (!Array.isArray(arr)) return null;
  // The /api/search route ALREADY returns mapped TokenDetail objects (mint/price/
  // logoURI…), so we just validate the shape — NOT re-map with mapTokenDetail
  // (which expects raw Jupiter fields id/usdPrice/icon and would drop every row).
  return arr.filter(
    (t): t is TokenDetail =>
      typeof t === "object" &&
      t !== null &&
      typeof (t as TokenDetail).mint === "string" &&
      typeof (t as TokenDetail).symbol === "string",
  );
}

// ── resource hooks ─────────────────────────────────────────────────────────

export function useTokenDetail(mint: string | null): PolledResource<TokenDetail> {
  return usePolledResource<TokenDetail>({
    key: mint,
    url: (m) => `/api/token/${encodeURIComponent(m)}`,
    parse: parseDetail,
    intervalMs: DETAIL_MS,
  });
}

// The chart/trades/holders feeds take an `enabled` flag so a HIDDEN tab stops
// polling (no wasted API calls for data you can't see). The hook keeps its cached
// data while disabled, so switching back is instant + does one fresh fetch.

export function useOhlcv(
  mint: string | null,
  timeframe: string,
  enabled = true,
): PolledResource<{ pool: string | null; candles: Candle[]; rateLimited: boolean }> {
  // Key includes the timeframe so switching tf is a new resource (new fetch).
  const key = mint ? `${mint}:${timeframe}` : null;
  return usePolledResource({
    key,
    url: (k) => {
      const [m, tf] = k.split(":");
      return `/api/ohlcv/${encodeURIComponent(m)}?tf=${encodeURIComponent(tf)}`;
    },
    parse: parseOhlcv,
    intervalMs: OHLCV_MS,
    enabled,
  });
}

export function useTrades(
  mint: string | null,
  enabled = true,
): PolledResource<Trade[]> {
  return usePolledResource<Trade[]>({
    key: mint,
    url: (m) => `/api/trades/${encodeURIComponent(m)}`,
    parse: parseTrades,
    intervalMs: TRADES_MS,
    enabled,
  });
}

export function useHolders(
  mint: string | null,
  enabled = true,
): PolledResource<HolderInfo> {
  return usePolledResource<HolderInfo>({
    key: mint,
    url: (m) => `/api/holders/${encodeURIComponent(m)}`,
    parse: parseHolders,
    intervalMs: HOLDERS_MS,
    enabled,
  });
}

// Resolve the best TradingView symbol to chart this token — a CEX `${SYM}USD`
// pair, its Solana DEX pool, or the bare `${SYM}USD` (→ TV's native error screen).
// `data.symbol` is always a usable widget symbol. Polled rarely (resolution is
// near-static and the route caches it for a day). Enabled only when needed (e.g.
// fullscreen open) to skip the request otherwise.
const TV_SYMBOL_MS = 600_000;

export function useTradingViewSymbol(
  symbol: string | null,
  enabled = true,
): PolledResource<{ symbol: string }> {
  const key = symbol && symbol.trim() ? symbol.trim().toUpperCase() : null;
  return usePolledResource<{ symbol: string }>({
    key,
    url: (s) => `/api/tv-symbol/${encodeURIComponent(s)}`,
    parse: parseTvSymbol,
    intervalMs: TV_SYMBOL_MS,
    enabled,
  });
}

// ── debounce ───────────────────────────────────────────────────────────────

/** Debounce a value by `ms`. The returned value updates only after the input has
 *  been stable for `ms`. Used by search + quote so we never fetch per keystroke. */
export function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

// ── search (debounced; reuses usePolledResource keyed by query) ─────────────

const SEARCH_DEBOUNCE_MS = 300;
// Effectively one-shot: a query rarely changes results within seconds, and the
// route caches it anyway, so re-polling a held query is wasteful. A long interval
// keeps the result fresh if the box stays open without per-second refetching.
const SEARCH_REFRESH_MS = 60_000;

export function useTokenSearch(query: string): {
  results: TokenDetail[];
  loading: boolean;
} {
  const debounced = useDebounced(query.trim(), SEARCH_DEBOUNCE_MS);
  const { data, status } = usePolledResource<TokenDetail[]>({
    key: debounced.length > 0 ? debounced : null, // empty query → idle, no fetch
    url: (q) => `/api/search?q=${encodeURIComponent(q)}`,
    parse: parseSearch,
    intervalMs: SEARCH_REFRESH_MS,
  });
  return { results: data ?? [], loading: status === "loading" };
}

// ── swap quote (debounced; refetched when amount/side/mint change) ──────────

const QUOTE_DEBOUNCE_MS = 400;

export function useSwapQuote(params: {
  inputMint: string | null;
  outputMint: string | null;
  /** Amount in base units of inputMint, as an integer string. "" / "0" disables. */
  amount: string;
  slippageBps: number;
}): { quote: SwapQuote | null; loading: boolean; error: boolean } {
  const { inputMint, outputMint, amount, slippageBps } = params;
  const debouncedAmount = useDebounced(amount, QUOTE_DEBOUNCE_MS);

  const enabled =
    !!inputMint &&
    !!outputMint &&
    /^\d+$/.test(debouncedAmount) &&
    debouncedAmount !== "0";

  const key = enabled
    ? `${inputMint}|${outputMint}|${debouncedAmount}|${slippageBps}`
    : null;

  const { data, status } = usePolledResource<SwapQuote>({
    key,
    url: (k) => {
      const [i, o, a, s] = k.split("|");
      return (
        `/api/quote?inputMint=${encodeURIComponent(i)}` +
        `&outputMint=${encodeURIComponent(o)}&amount=${a}&slippageBps=${s}`
      );
    },
    parse: parseQuote,
    // Re-quote periodically so the fill preview stays fresh, but no faster than
    // the /api/quote route revalidates (10s) — quoting more often just re-reads
    // the same cached quote. 12s is comfortably ≥ that and plenty live for a
    // preview the user isn't watching tick-by-tick.
    intervalMs: 12_000,
    enabled,
  });

  return {
    quote: data,
    loading: status === "loading",
    error: status === "error",
  };
}
