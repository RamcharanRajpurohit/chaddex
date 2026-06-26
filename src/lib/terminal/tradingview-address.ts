// APPROACH B — construct the symbol from the on-chain POOL ADDRESS (the unique
// ID), then VERIFY it's really in TV's feed before trusting it.
//
// (Second of two parallel resolver implementations the user asked for, to compare
// with tradingview-search.ts. Neither touches the wired tradingview.ts.)
//
// JOB: same as Approach A — hand the widget the BEST real TV symbol, no own-chart
// fallback; when TV has nothing, return the bare `${SYM}USD` so the widget shows
// its native "symbol doesn't exist" screen (the original default).
//
// THE IDEA the user pushed for: a token's pool has a unique on-chain address, and
// TV's pool symbol is DETERMINISTIC from it (browser-verified): the `_XXXXXX`
// suffix is the first 6 chars of the pool address, upper-cased, e.g. Raydium pool
// FvMZrD… → `RAYDIUM:MUMUSOL_FVMZRD.USD`. So mint → Gecko pools → build the symbol
// from {dex-prefix}:{BASE}{QUOTE}_{addr[:6]}.USD, no fragile name-search ranking.
//
// THE CATCH (also browser-verified, why we still verify): a well-formed symbol is
// NOT guaranteed to be in TV's feed. Gecko labels GLUE's $62k pool "meteora", but
// `METEORADLMM:GLUESOL_…` renders TV's DEAD screen — TV doesn't carry that pool.
// And the pool TV DOES index may not be Gecko's top pool (MUMU's TV Raydium pool
// isn't even in Gecko's first page). So after constructing, we CONFIRM the symbol
// exists via symbol-search; only a confirmed symbol is returned.
//
// DEX → TV exchange prefix (browser-verified which Gecko dex ids TV indexes):
//   raydium→RAYDIUM, raydium-clmm→RAYDIUMCLMM, raydium-cpmm→RAYDIUMCPMM,
//   meteora→METEORADLMM, orca→ORCA. pumpswap / meteora-damm-v2 / pump-fun /
//   fluxbeam / humidifi are NOT on TV → those pools are skipped.
//
// PURE module; caching lives in the route handler.

import { fetchPoolsForToken, type GeckoPool } from "./gecko";

const SEARCH = "https://symbol-search.tradingview.com/symbol_search/";

const DEX_PREFIX: Record<string, string> = {
  raydium: "RAYDIUM",
  "raydium-clmm": "RAYDIUMCLMM",
  "raydium-cpmm": "RAYDIUMCPMM",
  meteora: "METEORADLMM",
  orca: "ORCA",
};

function stripTags(s: string): string {
  return s.replace(/<\/?em>/g, "");
}

async function searchHasSymbol(
  base: string,
  fullSymbol: string,
  signal?: AbortSignal,
): Promise<boolean> {
  // Search the pool's base text and confirm the exact constructed symbol is in the
  // feed (case-insensitive; TV may wrap matches in <em>). This is the proof step.
  const res = await fetch(`${SEARCH}?text=${encodeURIComponent(base)}`, {
    headers: {
      accept: "application/json",
      referer: "https://www.tradingview.com/",
      origin: "https://www.tradingview.com",
    },
    signal,
  });
  if (!res.ok) {
    throw new Error(`TradingView symbol-search ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  const rows: { symbol?: unknown; prefix?: unknown }[] = Array.isArray(json)
    ? json
    : Array.isArray((json as { symbols?: unknown })?.symbols)
      ? ((json as { symbols: unknown[] }).symbols as { symbol?: unknown; prefix?: unknown }[])
      : [];
  const wantBare = fullSymbol.includes(":") ? fullSymbol.split(":")[1] : fullSymbol;
  return rows.some((r) => {
    if (typeof r.symbol !== "string") return false;
    const sym = stripTags(r.symbol);
    // match the base symbol (with or without the .USD variant) for this pool
    return sym.toUpperCase() === wantBare.toUpperCase();
  });
}

/** Build the TV pool symbol from a Gecko pool, or null if its DEX isn't on TV. */
function buildSymbol(pool: GeckoPool): string | null {
  const prefix = DEX_PREFIX[pool.dex];
  if (!prefix) return null; // DEX not indexed by TradingView
  // pool.name is "BASE / QUOTE" (e.g. "MUMU / SOL"). TV uses {BASE}{QUOTE}.
  const [baseRaw, quoteRaw] = pool.name.split("/").map((s) => s.trim().toUpperCase());
  if (!baseRaw || !quoteRaw) return null;
  // TV normalises WSOL→SOL; quote is SOL or USDC in practice.
  const quote = quoteRaw === "WSOL" ? "SOL" : quoteRaw;
  const suffix = pool.address.slice(0, 6).toUpperCase();
  return `${prefix}:${baseRaw}${quote}_${suffix}.USD`;
}

/**
 * Resolve via the pool ADDRESS: mint → Gecko pools → construct the deterministic
 * TV pool symbol from the deepest TV-indexed pool → confirm it's in TV's feed.
 * Returns the confirmed pool symbol, else the bare `${SYM}USD` (TV's native error
 * screen — no own-chart fallback). Throws only on network/HTTP error.
 */
export async function resolveTradingViewSymbol(
  symbol: string,
  mint: string,
  signal?: AbortSignal,
): Promise<string> {
  const fallback = `${symbol.trim().toUpperCase()}USD`;

  const pools = await fetchPoolsForToken(mint, signal);
  // Deepest TV-indexable pool first (reserve desc); skip DEXs TV doesn't carry.
  const candidates = pools
    .filter((p) => DEX_PREFIX[p.dex])
    .sort((a, b) => b.reserveUsd - a.reserveUsd);

  for (const pool of candidates) {
    const built = buildSymbol(pool);
    if (!built) continue;
    const base = built.split(":")[1].replace(/\.USD$/, "");
    if (await searchHasSymbol(base, built, signal)) return built;
  }

  // No TV-indexed pool confirmed → bare ticker → TV's native error screen.
  // (A CEX-listed token like JUP returns no DEX-pool match here; for Approach B
  // the `${SYM}USD` fallback IS that token's correct CEX chart, so it still works.)
  return fallback;
}
