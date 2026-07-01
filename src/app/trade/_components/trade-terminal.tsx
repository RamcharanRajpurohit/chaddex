"use client";

import { useState, useSyncExternalStore } from "react";
import { PaperTradeProvider } from "./paper-context";
import { TokenDetailProvider } from "./token-detail-context";
import SiteHeader from "@/app/(marketing)/_components/site-header";
import SiteFooter from "@/app/(marketing)/_components/site-footer";
import { TokenSearch } from "./token-search";
import { PaneWorkspace } from "./left/pane-workspace";
import { ChartPanel } from "./middle/chart-panel";
import { ActivityPanel } from "./middle/activity-panel";
import { TokenHeader } from "./middle/token-header";
import { TradePanel } from "./right/trade-panel";
import { MobileGate } from "./mobile-gate";
import { SEED_TOKENS } from "@/lib/quotes/seed";

// Default selection: BONK (a deep, always-indexed token) so the terminal is never
// empty on first paint. Overridden by ?mint= (a banner click) when present.
const DEFAULT_MINT = SEED_TOKENS[0].mint;

// The ?mint= param, read hydration-safely: the SERVER snapshot is DEFAULT_MINT
// (matching SSR), and the client snapshot is the real param — so React's first
// client render matches the server, then adopts the param without a mismatch.
// getSnapshot returns a stable primitive (string), so it won't loop.
const subscribeUrl = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};
function useUrlMint(): string {
  return useSyncExternalStore(
    subscribeUrl,
    () => new URLSearchParams(window.location.search).get("mint") || DEFAULT_MINT,
    () => DEFAULT_MINT,
  );
}

export function TradeTerminal() {
  // The terminal is browsable by EVERYONE — logged-out users can explore charts,
  // trending, token info, holders, and the live quote preview. Only the actual
  // Buy/Sell action is gated behind login (handled in the trade panel), so there's
  // no auth redirect here.

  // The left rail is one pane-width (20rem) per side-by-side column: a single feed
  // is 20rem, and each "Split right" adds another full 20rem column (it does NOT
  // halve the existing one). "Split bottom" stacks within a column, so it keeps the
  // column count — and the width — unchanged. The middle/right give back the room.
  const [leftCols, setLeftCols] = useState(1);
  // Collapsing hides the left feed behind a thin strip (fomo's «), handing all its
  // width to the chart. Only offered on a single unsplit feed (the « control shows
  // only then), so a split workspace can't get into a collapsed state.
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  // Each column keeps the full single-pane width; right panel trims a little to
  // make room without starving the chart. Collapsed → a thin 3rem strip.
  const leftWidthRem = leftCollapsed ? 3 : leftCols * 20;
  const rightWidthRem = leftCols > 1 && !leftCollapsed ? 19 : 22;

  // Selection resolves to DEFAULT_MINT on the server AND the first client render,
  // so the SSR'd markup matches the initial client tree exactly. Reading ?mint=
  // during render (the old lazy initializer) made the server pick BONK while the
  // client picked the param's token, so the highlighted-row class diverged — a
  // React hydration mismatch. `useUrlMint` reads ?mint= via useSyncExternalStore
  // whose SERVER snapshot is DEFAULT_MINT, so the param is adopted only after
  // hydration — the banner click still lands, one paint later, with no mismatch.
  // A user selection (below) takes precedence over the URL once made.
  const urlMint = useUrlMint();
  const [picked, setPicked] = useState<string | null>(null);
  const selectedMint = picked ?? urlMint;

  // Selecting a token also syncs the URL (?mint=) via replaceState — no
  // navigation/re-render, but the address bar matches what's shown (so reload &
  // share work, and there's no confusing URL↔panel mismatch).
  const setSelectedMint = (mint: string) => {
    setPicked(mint);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("mint", mint);
      window.history.replaceState(null, "", url);
    }
  };

  return (
    <PaperTradeProvider>
      {/* Reuse the SAME site header (brand, account menu, login flow) — the
          terminal just slots its token search into the center. Like the home
          page: transparent at the top, frosts only on scroll (no forced solid). */}
      <SiteHeader terminal centerSlot={<TokenSearch onSelect={setSelectedMint} />} />
      {/* pt clears the fixed header; a little horizontal + top gap lets the
          rounded-top panel card breathe so its curved corners are visible.
          ≤820px the header wraps the search onto a second row (~102px tall — see
          globals.css), so the offset grows to clear it; above the wrap boundary
          the header is a single row again and 84px is enough. */}
      {/* fomo's terminal is FULL-BLEED: the 3 columns run edge-to-edge with thin
          vertical dividers and NO outer rounded card or side gutters. Only the
          top padding clears the fixed header. */}
      <main className="bg-bg px-3 pb-3 pt-[92px] text-white min-[821px]:pt-[68px]">
        {/* fomo 3-column: trending (left) · header+chart+activity (middle) ·
            buy/sell+stats (right). Columns STRETCH to the tallest row so the
            vertical dividers run the full height. The LEFT trending list opts out
            of stretch: it's a sticky, viewport-tall, internally-scrolling feed. */}
        {/* One shared poller for the selected token's detail — the 4 panels that
            need it read from context instead of each fetching it separately. */}
        {/* fomo's web terminal is DESKTOP-ONLY — on mobile, show the app-download
            gate and hide the 3-column terminal entirely. */}
        <MobileGate />
        <TokenDetailProvider mint={selectedMint}>
          {/* Grid template is runtime-computed (left = one pane-width per column),
              so it's set inline. It only takes effect at lg+ where the div is a
              grid; below lg the div is block (columns stack) and the inline
              grid-template-columns is inert. */}
          {/* Rounded card (restored): the 3 columns sit inside a rounded-3xl card
              with a subtle white hairline border; main's px-3/pb-3 gives the
              curved corners room to show. No overflow-hidden here — that would
              make this a scroll container and break the left rail's viewport
              sticky; the border alone renders the rounded frame. */}
          <div
            className="term-scroll hidden rounded-3xl border border-white/[0.14] lg:grid"
            style={{
              gridTemplateColumns: `${leftWidthRem}rem 1fr ${rightWidthRem}rem`,
            }}
          >
            {/* LEFT: just the trending list now (token detail moved under the chart).
                On mobile (stacked) it's capped to a scrollable 55vh feed so the
                full token list doesn't shove the chart far down the page; on lg+
                it's a sticky, viewport-tall, internally-scrolling rail. */}
            <aside className="term-scroll flex max-h-[55vh] flex-col self-stretch overflow-y-auto rounded-l-3xl border-b border-border lg:sticky lg:top-[68px] lg:max-h-none lg:h-[calc(100vh-80px)] lg:self-start lg:border-b-0 lg:border-r">
              {leftCollapsed ? (
                // Collapsed → a thin strip with a » expand control (fomo's pattern).
                <div className="flex h-full justify-center py-3">
                  <button
                    type="button"
                    onClick={() => setLeftCollapsed(false)}
                    aria-label="Expand sidebar"
                    title="Expand sidebar"
                    className="grid size-8 place-items-center rounded-lg bg-card text-[15px] leading-none text-dim transition-colors hover:bg-card-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green"
                  >
                    »
                  </button>
                </div>
              ) : (
                <PaneWorkspace
                  selected={selectedMint}
                  onSelect={setSelectedMint}
                  onColumnsChange={setLeftCols}
                  onCollapse={() => setLeftCollapsed(true)}
                />
              )}
            </aside>
            {/* MIDDLE: fomo layout — compact token header (identity + boxed stat
                cells) on TOP, the chart ALWAYS visible below it, then a Holders /
                Trades activity panel beneath the chart (fomo keeps the chart pinned
                and tabs the activity under it — not a single tabbed box). */}
            {/* min-w-0 lets the 1fr middle track shrink below its content's
                intrinsic width (the wide token-header stat row / chart) so the
                grid never exceeds the viewport and forces a horizontal scrollbar. */}
            <section className="flex min-w-0 flex-col">
              <TokenHeader />
              <div className="flex h-[64vh] flex-none flex-col">
                <ChartPanel mint={selectedMint} />
              </div>
              <ActivityPanel mint={selectedMint} />
            </section>
            {/* RIGHT: takes whatever height it needs — no internal scroll. */}
            <aside className="rounded-r-3xl border-border lg:border-l">
              <TradePanel mint={selectedMint} />
            </aside>
          </div>
        </TokenDetailProvider>
      </main>
      <SiteFooter noBorder />
    </PaperTradeProvider>
  );
}
