// GET /api/tv-symbol/[symbol] — the best TradingView symbol to chart this token in
// the fullscreen Advanced Chart: a CEX `${SYM}USD` pair, else its Solana DEX pool
// (e.g. "RAYDIUM:MUMUSOL_FVMZRD.USD"). When TV has neither, returns the bare
// `${SYM}USD` so the widget shows ITS OWN native "symbol doesn't exist / change
// symbol" screen (the default behaviour — there is no own-chart fallback).
//
// Proxied through a route handler (not fetched from the browser) to avoid CORS on
// symbol-search.tradingview.com and to SHARE the result across clients via the
// cache layer. Resolution is near-static (a token's TV listing rarely changes), so
// this is cached LONG — ~0 steady-state upstream cost.
//
// Returns { symbol: string } — always a usable widget symbol.

import { cacheLife } from "next/cache";
import {
  resolveTradingViewSymbol,
  type TradingViewSymbol,
} from "@/lib/terminal/tradingview-search";
import { createKeyedFetcher, jsonWithCache } from "@/lib/terminal/route-cache";

// Keyed by the (upper-cased) token symbol. Returns { symbol, chartable }:
// chartable=true only when TV genuinely carries a series (CEX pair / DEX pool);
// false = the bare `${KEY}USD` give-up fallback. The client mounts the inline TV
// widget only when chartable, else uses our own candles — so a fresh pump token
// never shows TV's dead error screen. On a cold upstream failure we degrade to a
// non-chartable bare ticker (safe to cache; the client just uses its own candles).
const resolve = createKeyedFetcher<TradingViewSymbol>({
  label: "tv-symbol",
  fetcher: (key) => resolveTradingViewSymbol(key),
  isGood: (v) => v.symbol.length > 0,
  empty: () => ({ symbol: "", chartable: false }),
});

async function resolveCached(symbol: string): Promise<TradingViewSymbol> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 172800 });
  return resolve(symbol.toUpperCase());
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const bare = `${symbol.toUpperCase()}USD`;
  const resolved = await resolveCached(symbol);
  // A cold upstream failure caches an empty symbol; never hand the client an empty
  // value — substitute the always-valid (non-chartable) bare ticker.
  const result: TradingViewSymbol =
    resolved.symbol.length > 0 ? resolved : { symbol: bare, chartable: false };
  return jsonWithCache(result, 3600, 86400);
}
