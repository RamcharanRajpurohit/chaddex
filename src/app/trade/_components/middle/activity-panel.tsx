"use client";

import { useState } from "react";
import { LiveTrades } from "./live-trades";
import { HoldersList } from "./holders-list";
import { usePoolProbe } from "../token-detail-context";

type Tab = "holders" | "trades";

// fomo's middle column keeps the chart pinned on top and puts the activity feed
// (fomo's "Holders / Swaps / Thesis") in a SEPARATE panel below it. We mirror that
// with a Holders / Trades strip — no Thesis (that's fomo's social-graph feature,
// which we have no backend for). A small refresh button remounts the active feed
// to pull fresh data (the chart embed has its own refresh).
export function ActivityPanel({ mint }: { mint: string }) {
  const [tab, setTab] = useState<Tab>("holders");
  // Bumping this remounts the active feed via its key → forces a fresh fetch.
  const [refreshKey, setRefreshKey] = useState(0);
  // The SAME shared pool/indexing probe the chart reads (one poller in
  // TokenDetailProvider) — gates the Gecko-backed Trades feed so a brand-new
  // (unindexed) token shows an honest note instead of a dead list.
  const { noPool, rateLimited } = usePoolProbe();

  return (
    <div className="flex flex-col border-t border-border">
      <div className="flex flex-none items-center gap-2 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2" role="tablist" aria-label="Token activity">
          <TabButton id="holders" tab={tab} setTab={setTab}>Holders</TabButton>
          <TabButton id="trades" tab={tab} setTab={setTab}>Trades</TabButton>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          aria-label="Refresh activity"
          title="Refresh"
          className="ml-auto grid size-8 place-items-center rounded-full border border-white/[0.07] bg-card text-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
        >
          <RefreshIcon />
        </button>
      </div>

      {/* One shared scroll region for BOTH tabs: `max-h` (not a fixed height) so a
          short list grows only to its content — no dead gap — while a long list
          scrolls. Holders and Trades behave identically. */}
      <div className="term-scroll max-h-[60vh] overflow-y-auto">
        <div className={tab === "holders" ? "block" : "hidden"}>
          <HoldersList key={`holders:${mint}:${refreshKey}`} mint={mint} active={tab === "holders"} />
        </div>
        <div className={tab === "trades" ? "block" : "hidden"}>
          <LiveTrades
            key={`trades:${mint}:${refreshKey}`}
            mint={mint}
            noPool={noPool}
            rateLimited={rateLimited}
            active={tab === "trades"}
          />
        </div>
      </div>
    </div>
  );
}

function TabButton({
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
      className={`rounded-lg px-4 py-2 text-[14px] font-bold transition-colors ${
        tab === id ? "bg-card-2 text-white" : "text-muted hover:bg-card hover:text-white"
      }`}
      onClick={() => setTab(id)}
    >
      {children}
    </button>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
