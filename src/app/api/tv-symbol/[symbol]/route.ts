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
import { resolveTradingViewSymbol } from "@/lib/terminal/tradingview-search";
import { createKeyedFetcher, jsonWithCache } from "@/lib/terminal/route-cache";

// Keyed by the (upper-cased) token symbol. On a cold upstream failure we degrade
// to the bare `${KEY}USD` — the SAME always-valid answer the resolver returns for
// a miss (→ the widget's native error screen). This is genuinely correct, so it's
// safe for `use cache` to store; we must NOT cache an empty/sentinel the client
// rejects, or a transient blip would pin the token to a dead chart for a day.
const resolve = createKeyedFetcher<{ symbol: string }>({
  label: "tv-symbol",
  fetcher: async (key) => ({ symbol: await resolveTradingViewSymbol(key) }),
  isGood: (v) => v.symbol.length > 0,
  empty: () => ({ symbol: "" }),
});

async function resolveCached(symbol: string): Promise<{ symbol: string }> {
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
  const { symbol: resolved } = await resolveCached(symbol);
  // A cold upstream failure caches an empty symbol (createKeyedFetcher.empty);
  // never hand the client an empty value (it would reject it and stay stuck on
  // the fallback) — substitute the always-valid bare ticker here.
  const result = { symbol: resolved.length > 0 ? resolved : bare };
  // Long CDN cache — resolution is effectively static.
  return jsonWithCache(result, 3600, 86400);
}
