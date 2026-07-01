"use client";

// GeckoTerminal pool-embed chart — the SAME approach fomo.family uses (a
// TradingView Charting Library instance powered by GeckoTerminal's own datafeed).
// Charts ANY Solana token, including unlisted pump.fun tokens, with the full
// TradingView UI (drawing tools, ƒx indicators, Price/MCap, every timeframe, the
// OHLC legend) — no API key, no licensed library to self-host. Verified live for
// pump tokens (e.g. CUPSEY) where the free TradingView embed widget shows only
// "invalid symbol".
//
// GeckoTerminal's `/pools/{address}` accepts the token MINT directly (it redirects
// to the token's deepest pool) OR an explicit pool address. We pass the resolved
// pool when we have it (one fewer redirect), else the mint.

const BG = "060510"; // fomo page bg (rgb 6,5,16), hex w/o '#'

export function GeckoChart({
  poolOrMint,
  resolution = "5m",
  chartType = "price",
}: {
  /** The Gecko pool address (preferred) or the token mint. */
  poolOrMint: string;
  /** Default timeframe (GeckoTerminal resolution token). */
  resolution?: string;
  /** Initial Price vs MCap view (toggleable inside the iframe). */
  chartType?: "price" | "market_cap";
}) {
  // light_chart=0 → the full TradingView-style charting_library (not the
  // lightweight chart); info/swaps=0 → hide Gecko's own header + trades (we render
  // our own Trades/Holders tabs); bg_color → match our dark theme.
  const src =
    `https://www.geckoterminal.com/solana/pools/${encodeURIComponent(poolOrMint)}` +
    `?embed=1&info=0&swaps=0&light_chart=0` +
    `&chart_type=${chartType}&resolution=${encodeURIComponent(resolution)}&bg_color=${BG}`;

  return (
    <iframe
      id="geckoterminal-embed"
      title="Price chart"
      src={src}
      // keyed by src upstream so it remounts on token/resolution change
      className="size-full border-0"
      // `fullscreen` DELEGATES the Fullscreen API into this cross-origin embed —
      // without it the iframe's TradingView ⛶ can't call requestFullscreen() and
      // silently falls back to a CSS expand-within-card (never fills the monitor).
      allow="clipboard-write; fullscreen"
      loading="lazy"
    />
  );
}
