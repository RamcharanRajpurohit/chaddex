// APPROACH A — TradingView symbol-search as the SOURCE OF TRUTH.
//
// (One of two parallel resolver implementations the user asked for, to compare
// side by side. Approach B is tradingview-address.ts. The currently-wired
// resolver is tradingview.ts — neither of these touches it.)
//
// JOB: hand the widget the BEST real TV symbol so it charts whenever TV CAN —
// a CEX `${SYM}USD` pair, else the token's Solana DEX pool. There is NO own-chart
// fallback: when TV genuinely has nothing (GLUE, PumpSwap-only, fresh pump.fun)
// we return the bare `${SYM}USD` so the widget shows ITS OWN native "This symbol
// doesn't exist / change symbol" screen — the original default behaviour (our
// lightweight-charts adds nothing in fullscreen).
//
// PREMISE (all browser/curl-verified): the free embed widget charts off TV's OWN
// feed. The ONLY reliable way to know TV has a chartable series for a token is to
// ask TV's own symbol-search — NOT to construct a symbol and hope it's indexed
// (Gecko labelling a pool "meteora" does NOT mean TV indexed that exact pool:
// GLUE's $62k meteora pool yields a perfectly-formed METEORADLMM:GLUESOL_… symbol
// that renders the DEAD screen, because TV simply doesn't carry it).
//
// RESOLUTION (each step verified against MUMU/CARDS/JUP/FARTCOIN/GLUE…):
//   1. `${SYM}USD` CEX spot row  → cleanest chart (JUP, FARTCOIN, the xStocks).
//   2. `${SYM}SOL_<pool>.USD` DEX-pool row → memecoins with no CEX pair (MUMU via
//      Raydium, CARDS via Meteora DLMM). TV returns exactly the pools it can chart.
//   3. else the bare `${SYM}USD` → the widget's native error screen (the default).
//
// TWO targeted searches because the endpoint caps at 50 RANKED rows: a bare
// `text=${SYM}` buries both the spot pair (behind stocks/perps — the OP/USDC
// false-negative) and the DEX pool (behind CEX rows — CARDS's pool is absent from
// a bare search but present under `text=${SYM}SOL`).
//
// PURE module; caching lives in the route handler.

const SEARCH = "https://symbol-search.tradingview.com/symbol_search/";

function stripTags(s: string): string {
  return s.replace(/<\/?em>/g, "");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Row = { symbol?: unknown; type?: unknown; prefix?: unknown };

async function search(text: string, signal?: AbortSignal): Promise<Row[]> {
  const res = await fetch(`${SEARCH}?text=${encodeURIComponent(text)}`, {
    headers: {
      accept: "application/json",
      // TV 403s requests whose Referer/Origin isn't its own domain (verified).
      referer: "https://www.tradingview.com/",
      origin: "https://www.tradingview.com",
    },
    signal,
  });
  if (!res.ok) {
    throw new Error(`TradingView symbol-search ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  if (Array.isArray(json)) return json as Row[];
  const wrapped = (json as { symbols?: unknown })?.symbols;
  return Array.isArray(wrapped) ? (wrapped as Row[]) : [];
}

/** Prefix a pool symbol with its exchange (e.g. "RAYDIUM:MUMUSOL_…"); the embed
 *  resolves an unprefixed symbol too, but the explicit prefix is deterministic
 *  when several exchanges list the same base pair. */
function qualify(row: Row): string {
  const sym = stripTags(row.symbol as string);
  const prefix = typeof row.prefix === "string" && row.prefix ? `${row.prefix}:` : "";
  return `${prefix}${sym}`;
}

/**
 * Resolve a token symbol (e.g. "JUP", "MUMU") to the TradingView symbol the
 * Advanced Chart widget should chart — a CEX `${SYM}USD` spot pair, else the
 * token's USD-priced Solana DEX pool (e.g. "RAYDIUM:MUMUSOL_FVMZRD.USD"). When TV
 * has neither, returns the bare `${SYM}USD` so the widget shows its own native
 * "symbol doesn't exist" screen (no own-chart fallback). Throws only on
 * network/HTTP error.
 */
export async function resolveTradingViewSymbol(
  symbol: string,
  signal?: AbortSignal,
): Promise<string> {
  const sym = symbol.trim().toUpperCase();
  const fallback = `${sym}USD`; // bare ticker → TV's native error screen
  if (!sym) return fallback;

  // 1) CEX spot pair.
  for (const r of await search(fallback, signal)) {
    if (typeof r.symbol === "string" && stripTags(r.symbol) === fallback && r.type === "spot") {
      return fallback;
    }
  }

  // 2) Solana DEX pool, USD-priced. First search-ranked match.
  const poolRe = new RegExp(`^${escapeRegExp(sym)}SOL_[A-Z0-9]+\\.USD$`, "i");
  for (const r of await search(`${sym}SOL`, signal)) {
    if (typeof r.symbol === "string" && r.type === "spot" && poolRe.test(stripTags(r.symbol))) {
      return qualify(r);
    }
  }

  return fallback;
}
