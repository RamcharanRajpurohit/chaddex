"use client";

import { GeckoChart } from "./gecko-chart";
import { usePoolProbe } from "../token-detail-context";

// The chart embed opens at 1m / Price; the user changes timeframe & Price↔MCap
// inside the GeckoTerminal iframe's own toolbar (so chaddex shows no duplicate
// chart controls). These are just the embed's initial params.
const INITIAL_RESOLUTION = "1m";

// fomo's middle keeps the CHART permanently on top (never tabbed away) — the
// Holders/Trades activity lives in its own panel BELOW (see ActivityPanel). So
// this is now a chart-only card: just the GeckoTerminal embed (which carries its
// own timeframe / Price-MCap / zoom / fullscreen toolbar).
export function ChartPanel({ mint }: { mint: string }) {
  // The resolved pool + indexing gate comes from the ONE shared OHLCV probe in
  // TokenDetailProvider (the activity panel reads the same probe — no duplicate
  // poller). `noPool` = fresh/unindexed token OR Gecko rate-limited us.
  const { pool, noPool, rateLimited } = usePoolProbe();

  // The chart is the GeckoTerminal pool-embed — the SAME full TradingView UI fomo
  // uses (drawing tools, ƒx indicators, Price/MCap, every timeframe, OHLC legend,
  // % log auto, the -/+/</> zoom & scroll controls, fullscreen), charting EVERY
  // token incl. unlisted pump.fun tokens (the free TradingView embed widget can't).
  // We feed it the resolved pool when known (one fewer redirect), else the mint.
  return (
    <div className="flex min-h-0 flex-1 flex-col p-5">
      <div className="chart-card relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        {noPool ? (
          <ChartIndexing rateLimited={rateLimited} />
        ) : (
          <GeckoChart key={mint} poolOrMint={pool ?? mint} resolution={INITIAL_RESOLUTION} />
        )}
      </div>
    </div>
  );
}

function ChartIndexing({ rateLimited = false }: { rateLimited?: boolean }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center">
      <div
        className="size-2.5 animate-pulse rounded-full bg-green motion-reduce:animate-none"
        aria-hidden
      />
      <p className="text-[14px] font-semibold text-muted">
        {rateLimited ? "Retrying…" : "Chart indexing…"}
      </p>
      <span className="max-w-xs text-[12px] text-dim">
        {rateLimited
          ? "The market data provider is briefly rate-limited — this clears on its own."
          : "This token is brand new — its pool isn’t on the charts yet."}
      </span>
    </div>
  );
}
