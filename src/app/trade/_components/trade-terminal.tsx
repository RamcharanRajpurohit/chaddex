"use client";

import { useState } from "react";
import { PaperTradeProvider } from "./paper-context";
import { TokenDetailProvider } from "./token-detail-context";
import SiteHeader from "@/app/(marketing)/_components/site-header";
import SiteFooter from "@/app/(marketing)/_components/site-footer";
import { TokenSearch } from "./token-search";
import { TrendingRail } from "./left/trending-rail";
import { TokenDetailPanel } from "./left/token-detail";
import { ChartPanel } from "./middle/chart-panel";
import { TradePanel } from "./right/trade-panel";
import { SEED_TOKENS } from "@/lib/quotes/seed";

// Default selection: BONK (a deep, always-indexed token) so the terminal is never
// empty on first paint. Overridden by ?mint= (a banner click) when present.
const DEFAULT_MINT = SEED_TOKENS[0].mint;

export function TradeTerminal() {
  // The terminal is browsable by EVERYONE — logged-out users can explore charts,
  // trending, token info, holders, and the live quote preview. Only the actual
  // Buy/Sell action is gated behind login (handled in the trade panel), so there's
  // no auth redirect here.

  // Seed the selection from ?mint= (a banner click) via a lazy initializer — read
  // once, no mount effect. Avoids the useSearchParams Suspense requirement.
  const [selectedMint, setSelectedMintState] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_MINT;
    return new URLSearchParams(window.location.search).get("mint") || DEFAULT_MINT;
  });

  // Selecting a token also syncs the URL (?mint=) via replaceState — no
  // navigation/re-render, but the address bar matches what's shown (so reload &
  // share work, and there's no confusing URL↔panel mismatch).
  const setSelectedMint = (mint: string) => {
    setSelectedMintState(mint);
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
      <SiteHeader centerSlot={<TokenSearch onSelect={setSelectedMint} />} />
      {/* pt clears the fixed header; a little horizontal + top gap lets the
          rounded-top panel card breathe so its curved corners are visible.
          ≤820px the header wraps the search onto a second row (~102px tall — see
          globals.css), so the offset grows to clear it; above the wrap boundary
          the header is a single row again and 84px is enough. */}
      <main className="bg-bg px-3 pb-3 pt-[108px] text-white min-[821px]:pt-[84px]">
        {/* ape.pro 3-column: trending+detail (left) · chart+activity (middle) ·
            buy/sell+position (right). Rounded-top card meeting the header.
            The middle + right columns take whatever height their content wants
            (no internal scroll) — the whole page scrolls instead. Columns STRETCH
            to the tallest row (default items-stretch) so the vertical divider
            borders run the full card height, not just to the short column's
            content. Their content stays top-aligned anyway. Only the LEFT
            trending list opts out of stretch: it's a sticky, viewport-tall,
            internally-scrolling infinite feed that the page scrolls past. */}
        {/* One shared poller for the selected token's detail — the 4 panels that
            need it read from context instead of each fetching it separately. */}
        <TokenDetailProvider mint={selectedMint}>
          <div className="term-scroll grid grid-cols-1 rounded-3xl border border-white/[0.14] lg:grid-cols-[19rem_1fr_21rem]">
            {/* LEFT: just the trending list now (token detail moved under the chart). */}
            <aside className="term-scroll flex flex-col self-stretch overflow-y-auto border-white/[0.14] lg:sticky lg:top-[84px] lg:h-[calc(100vh-96px)] lg:self-start lg:border-r">
              <TrendingRail selected={selectedMint} onSelect={setSelectedMint} />
            </aside>
            {/* MIDDLE: chart on top (fixed-height block so the chart canvas has
                real pixels), token detail + stats + safety below — no scroll. */}
            <section className="flex flex-col">
              <div className="flex h-[62vh] flex-none flex-col">
                <ChartPanel mint={selectedMint} />
              </div>
              <TokenDetailPanel />
            </section>
            {/* RIGHT: takes whatever height it needs — no internal scroll. */}
            <aside className="border-white/[0.14] lg:border-l">
              <TradePanel mint={selectedMint} />
            </aside>
          </div>
        </TokenDetailProvider>
      </main>
      <SiteFooter noBorder />
    </PaperTradeProvider>
  );
}
