"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useOhlcv, useTradingViewSymbol } from "@/lib/terminal/hooks";
import { useSelectedToken } from "../token-detail-context";
import { type Timeframe } from "@/lib/terminal/gecko";
import { type ChartType } from "./price-chart";
import { TradingViewWidget } from "./tradingview-widget";
import { LiveTrades } from "./live-trades";
import { HoldersList } from "./holders-list";

// lightweight-charts touches the DOM/canvas → must render client-only.
const PriceChart = dynamic(
  () => import("./price-chart").then((m) => m.PriceChart),
  {
    ssr: false,
    loading: () => (
      <div className="size-full animate-pulse bg-surface motion-reduce:animate-none" />
    ),
  },
);

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];
type Tab = "chart" | "trades" | "holders";

// In-page chart is the area/mountain (the Area/Candles toggle was removed since
// the fullscreen TradingView widget covers every type).
const IN_PAGE_CHART: ChartType = "area";

export function ChartPanel({ mint }: { mint: string }) {
  const [tab, setTab] = useState<Tab>("chart");
  const [tf, setTf] = useState<Timeframe>("1m");
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Bumping this remounts the panels → forces a fresh fetch (the manual Refresh
  // button). Tab-switching does NOT change it, so switching tabs stays instant.
  const [refreshKey, setRefreshKey] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  // Only poll OHLCV while the Chart tab is showing (hidden tabs waste API calls).
  // The hook keeps its cached candles when paused, so returning is instant.
  const { data, status, refetch: refetchOhlcv } = useOhlcv(mint, tf, tab === "chart");

  // Manual refresh: refetch the chart's OHLCV (top-level hook) AND remount the
  // trades/holders panels (via refreshKey in their key) to pull fresh data.
  const refresh = () => {
    refetchOhlcv();
    setRefreshKey((k) => k + 1);
  };
  // Token symbol for the TradingView fullscreen widget — from the shared token
  // detail (one poller, not a separate fetch). null until the detail loads; we do
  // NOT resolve a placeholder, so no bogus "/api/tv-symbol/TOKEN" request fires.
  const { data: token } = useSelectedToken();
  const symbol = token?.symbol ?? null;

  // The best TradingView symbol to chart this token in fullscreen — resolved only
  // while fullscreen is open (the widget is fullscreen-only): a CEX `${SYM}USD`
  // pair, its Solana DEX pool ("RAYDIUM:MUMUSOL_FVMZRD.USD"), or the bare
  // `${SYM}USD` for tokens TV can't chart (→ the widget's own native "symbol
  // doesn't exist" screen; no own-chart fallback).
  const { data: tv } = useTradingViewSymbol(symbol, isFullscreen);
  // Mount the widget ONLY once we have a matching resolved symbol — until then
  // tvSymbol is null and we show a loading state, so the heavy widget mounts ONCE
  // with the final symbol (no bare-ticker dead-screen flash, no triple re-init).
  // The match check also doubles as a cross-key guard: the poller's last-known-good
  // could briefly carry a PREVIOUS token's symbol after a switch; a real result's
  // base is always the CURRENT symbol ("${SYM}USD" or pool "EXCHANGE:${SYM}SOL_…"),
  // so a mismatch keeps us in loading rather than charting a stale symbol.
  const tvSymbol =
    symbol && tv?.symbol && tvSymbolMatches(tv.symbol, symbol) ? tv.symbol : null;

  // Fullscreen the chart card via the browser Fullscreen API (lightweight-charts
  // autoSize resizes to fill it). Track state so the button label flips and Esc
  // (which exits fullscreen natively) keeps our state in sync.
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else cardRef.current?.requestFullscreen?.();
  };
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // No pool: the verified fresh-token gap (Gecko hasn't indexed a pool) OR Gecko
  // rate-limited us. Gecko-backed views (chart, trades) degrade; the Jupiter-backed
  // columns keep working. `rateLimited` distinguishes "retrying" from "indexing".
  const noPool = data !== null && data.pool === null;
  const rateLimited = data?.rateLimited === true;
  const candles = data?.candles ?? [];

  // Our own lightweight-charts view of the token's real Gecko OHLCV — the in-page
  // (non-fullscreen) chart. Fullscreen uses the TradingView widget instead.
  const inPageChart = noPool ? (
    <ChartIndexing rateLimited={rateLimited} />
  ) : status === "loading" && candles.length === 0 ? (
    <div className="size-full animate-pulse bg-card-2 motion-reduce:animate-none" />
  ) : (
    <div className="size-full [&>.price-chart]:size-full">
      <PriceChart key={`${mint}:${tf}:${IN_PAGE_CHART}`} candles={candles} type={IN_PAGE_CHART} />
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col p-5">
      <div className="flex flex-none flex-wrap items-center gap-2">
        <div className="flex items-center gap-2" role="tablist" aria-label="Chart and activity">
          <Tab id="chart" tab={tab} setTab={setTab}>Chart</Tab>
          <Tab id="trades" tab={tab} setTab={setTab}>Trades</Tab>
          <Tab id="holders" tab={tab} setTab={setTab}>Holders</Tab>
        </div>

        {/* right-side controls — refresh is always here; chart-only controls
            (timeframe, Advanced) appear on the chart tab. */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            aria-label="Refresh data"
            title="Refresh"
            className="grid size-8 place-items-center rounded-full border border-white/[0.07] bg-card text-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            <RefreshIcon />
          </button>
        {tab === "chart" && (
          <>
            {/* timeframe — the in-page chart's only control now (chart-type lives
                in the fullscreen TradingView widget, which has every type). */}
            {!noPool && (
              <div className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-card p-1" role="tablist" aria-label="Timeframe">
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={t === tf}
                    className={`rounded-full px-3 py-1 text-[12px] font-bold transition-colors ${
                      t === tf ? "bg-blue/15 text-blue" : "text-muted hover:text-white"
                    }`}
                    onClick={() => setTf(t)}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
            {/* fullscreen → opens the full TradingView widget (always available) */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Open advanced chart (fullscreen)"}
              title={isFullscreen ? "Exit fullscreen" : "Advanced chart — fullscreen"}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-card px-3 py-1.5 text-[12px] font-bold text-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
            >
              <FullscreenIcon expanded={isFullscreen} />
              <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Advanced"}</span>
            </button>
          </>
        )}
        </div>
      </div>

      {/* chart/feed body — a crafted glass card: faint top-light gradient + inner
          hairline so it reads as an intentional surface, not a flat black void.
          cardRef is the fullscreen target; bg-bg ensures a solid backdrop when
          the card alone goes fullscreen. */}
      <div
        ref={cardRef}
        className="chart-card relative mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.025] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        {/* All three panels stay MOUNTED — inactive ones are just hidden — so
            switching tabs is instant and DOESN'T re-fetch (their polling hooks
            keep their data alive). Switching COINS still discards stale data via
            the mint-keyed hooks. (Chart is the exception: only mounted on its tab,
            since the heavy lightweight-charts/TradingView instance shouldn't run
            in the background.) */}
        <div className={tab === "chart" ? "size-full" : "hidden"}>
          {/* Fullscreen mounts the rich TradingView Advanced Chart widget, fed the
              resolved symbol (a CEX pair, the token's Solana DEX pool, or the bare
              `${SYM}USD` → the widget's own native "symbol doesn't exist" screen
              when TV can't chart it). While the symbol is still resolving, show a
              loading pulse so the heavy widget mounts ONCE with the final symbol.
              Non-fullscreen shows our in-page chart. */}
          {isFullscreen ? (
            tvSymbol ? (
              <TradingViewWidget symbol={tvSymbol} />
            ) : (
              <div className="size-full animate-pulse bg-card-2 motion-reduce:animate-none" />
            )
          ) : (
            inPageChart
          )}
        </div>
        <div className={tab === "trades" ? "size-full" : "hidden"}>
          {/* `active` gates polling — hidden tab keeps cached data, stops fetching. */}
          <LiveTrades key={`trades:${mint}:${refreshKey}`} mint={mint} noPool={noPool} rateLimited={rateLimited} active={tab === "trades"} />
        </div>
        <div className={tab === "holders" ? "size-full" : "hidden"}>
          <HoldersList key={`holders:${mint}:${refreshKey}`} mint={mint} active={tab === "holders"} />
        </div>
      </div>
    </div>
  );
}

// A resolved TV symbol belongs to `symbol` when its base ticker (after any
// "EXCHANGE:" prefix is stripped) is EXACTLY one of the two shapes the resolver
// produces for that token: the spot pair "${SYM}USD", or a DEX pool that begins
// "${SYM}SOL_" (e.g. "MUMUSOL_FVMZRD.USD"). We match the exact shape — NOT a loose
// startsWith(SYM) — so a token switch can't false-accept a stale symbol whose base
// merely shares a prefix (switching MUMU→"MUM" must NOT mount MUMU's chart). The
// trailing "_" anchors the pool boundary so "BONK" can't match "BONKFOOSOL_…".
function tvSymbolMatches(tvSymbol: string, symbol: string): boolean {
  const base = (tvSymbol.includes(":") ? tvSymbol.split(":")[1] : tvSymbol).toUpperCase();
  const sym = symbol.toUpperCase();
  return base === `${sym}USD` || base.startsWith(`${sym}SOL_`);
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function FullscreenIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {expanded ? (
        <>
          <path d="M8 3v3a2 2 0 0 1-2 2H3" />
          <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
          <path d="M3 16h3a2 2 0 0 1 2 2v3" />
          <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
        </>
      ) : (
        <>
          <path d="M8 3H5a2 2 0 0 0-2 2v3" />
          <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
          <path d="M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </>
      )}
    </svg>
  );
}

function Tab({
  id,
  tab,
  setTab,
  children,
}: {
  id: Tab;
  tab: Tab;
  setTab: (t: Tab) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={tab === id}
      className={`rounded-full border px-4 py-2 text-[14px] font-bold transition-colors ${
        tab === id
          ? "border-blue/40 bg-blue/15 text-blue"
          : "border-transparent text-muted hover:bg-card hover:text-white"
      }`}
      onClick={() => setTab(id)}
    >
      {children}
    </button>
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
