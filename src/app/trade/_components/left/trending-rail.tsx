"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useBanner } from "@/lib/use-banner";
import { useWatchlist } from "@/lib/terminal/watchlist";
import {
  formatPrice,
  formatChange,
  formatUsdCompact,
  formatCount,
  shortAddress,
} from "@/lib/quotes/format";
import type { Token } from "@/lib/quotes/types";

// Left rail — matched to fomo's layout: a tab strip (Tokens active), a filter-pill
// row, then the token feed where each row is two two-line stacks (symbol / price on
// the left, "$X MC" / %change on the right), and a Split toggle pinned at the bottom.
//
// The FULL fomo pill set is shown for visual parity. The ones we can back with the
// data already in the feed (no new API) are FUNCTIONAL; the ones that need
// pump.fun launch-state we don't fetch are honestly DISABLED (a title says why)
// rather than shown as dead-but-clickable:
//   • Watchlist — only the user's starred mints (localStorage).            [real]
//   • Crypto    — established coins: market cap ≥ $10M, sorted by mcap.     [real]
//   • Trending  — the feed's native order (already trend-ranked upstream).  [real]
//   • Most held — sort by holder count, descending.                        [real]
//   • Graduated — pump.fun bonding-curve "graduated" state.            [no data]
//   • Bonding   — pump.fun pre-graduation bonding state.              [no data]
const TABS = ["Alerts", "Tokens", "Leaderboard", "Feed"] as const;

// Established-coin threshold for the "Crypto" pill — $10M+ mcap reads as a real
// listed coin rather than a fresh memecoin.
const CRYPTO_MIN_MCAP = 10_000_000;

type FilterId = "watchlist" | "crypto" | "trending" | "mostHeld" | "graduated" | "bonding";
const FILTERS: { id: FilterId; label: string; enabled: boolean; reason?: string }[] = [
  { id: "watchlist", label: "Watchlist", enabled: true },
  { id: "crypto", label: "Crypto", enabled: true },
  { id: "trending", label: "Trending", enabled: true },
  { id: "mostHeld", label: "Most held", enabled: true },
  { id: "graduated", label: "Graduated", enabled: false, reason: "Needs pump.fun launch data (not available)" },
  { id: "bonding", label: "Bonding", enabled: false, reason: "Needs pump.fun launch data (not available)" },
];

export function TrendingRail({
  selected,
  onSelect,
  canSplitRight = false,
  canSplitBottom = false,
  onSplitRight,
  onSplitBottom,
  onClose,
  onCollapse,
}: {
  selected: string;
  onSelect: (mint: string) => void;
  /** This pane's row can still take another column (drives whether Split right shows). */
  canSplitRight?: boolean;
  /** The grid can still take another row (drives whether Split bottom shows). */
  canSplitBottom?: boolean;
  /** Add a pane to the right of the current row (fomo's Split right). */
  onSplitRight?: () => void;
  /** Add a new row below (fomo's Split bottom). */
  onSplitBottom?: () => void;
  /** Close THIS pane (shown only when there's more than one). */
  onClose?: () => void;
  /** Collapse the whole left rail (fomo's « control). Passed only when there's a
      single pane (no split) — so the « shows and works only in that case. */
  onCollapse?: () => void;
}) {
  const { initialTokens } = useBanner();
  const { watchlist, isWatched, toggle } = useWatchlist();
  const [filter, setFilter] = useState<FilterId>("trending");

  // Apply the active filter to the feed. Sorts are on a COPY (never mutate the
  // mount-stable banner array). watchlist membership re-derives when the set
  // changes, so starring a token updates the Watchlist view live.
  const tokens = useMemo(() => {
    const list = [...initialTokens];
    switch (filter) {
      case "watchlist":
        return list.filter((t) => watchlist.has(t.mint));
      case "crypto":
        return list
          .filter((t) => (t.marketCap ?? 0) >= CRYPTO_MIN_MCAP)
          .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
      case "mostHeld":
        return list.sort((a, b) => (b.holderCount ?? 0) - (a.holderCount ?? 0));
      case "trending":
      default:
        return list;
    }
  }, [initialTokens, filter, watchlist]);

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* tab strip — at full rail width all four tabs + the collapse glyph fit;
          in a narrow SPLIT pane they'd overflow, so the row scrolls horizontally
          with a hidden bar (term-scroll, same as the pills below) and each tab is
          flex-none. This keeps the pane from forcing a min-width and showing an
          ugly horizontal scrollbar. */}
      <div className="term-scroll flex min-w-0 items-center gap-3 overflow-x-auto border-b border-border px-4 py-3">
        {TABS.map((t) => {
          const active = t === "Tokens";
          return (
            <span
              key={t}
              aria-current={active}
              className={`flex-none text-[13px] font-bold ${
                active ? "text-white" : "cursor-default text-dim"
              }`}
            >
              {t}
            </span>
          );
        })}
        {/* Close (✕) lives in the header top-right (fomo's placement), before the
            collapse glyph — shown only on a split pane. Keeping it here frees the
            footer for the full-width Split button instead of a boxed ✕ that eats
            footer space. */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close this pane"
            title="Close pane"
            className="ml-auto flex-none text-dim transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        {/* Collapse « — a real control, shown ONLY on a single (unsplit) pane.
            Collapses the whole left rail to a thin strip. In a split pane there's
            no « (collapsing one of several panes is ambiguous); the ✕ closes it
            instead. */}
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="ml-auto flex-none pl-2 text-[15px] leading-none text-dim transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green"
          >
            «
          </button>
        )}
      </div>

      {/* filter pills — ONE row, scrolls horizontally (fomo's behaviour). The
          term-scroll class hides the scrollbar while keeping wheel/trackpad swipe.
          functional ones are buttons; data-less ones are disabled. */}
      <div className="term-scroll flex items-center gap-1.5 overflow-x-auto border-b border-border px-3 py-2.5" role="tablist" aria-label="Token filter">
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={!f.enabled}
              title={f.reason}
              onClick={() => f.enabled && setFilter(f.id)}
              className={`flex-none rounded-lg px-2.5 py-1 text-[12px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                active ? "bg-card-2 text-white" : "text-muted hover:text-white"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* token feed */}
      {tokens.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-[13px] text-muted">
          {filter === "watchlist"
            ? "No watchlisted tokens yet — tap the ☆ on any row."
            : filter === "crypto"
              ? "No established coins in the current feed."
              : "No tokens."}
        </div>
      ) : (
        <ul className="term-scroll min-h-0 flex-1 overflow-y-auto">
          {tokens.map((t) => (
            <TokenRow
              key={t.mint}
              token={t}
              selected={t.mint === selected}
              watched={isWatched(t.mint)}
              onSelect={onSelect}
              onToggleWatch={toggle}
            />
          ))}
        </ul>
      )}

      {/* Split footer (fomo's left-column control) — FUNCTIONAL: "Split right"
          adds a full-width column beside this one (only while there are < 2
          columns), "Split bottom" stacks a pane below within this column (only
          while the column has < 2 panes). Each button is SHOWN only when that
          split is still possible — no dead/disabled buttons. The ✕ close lives in
          the header (fomo's placement), so the footer is just the split button(s)
          at full width. When neither split is possible the footer is hidden. */}
      {(canSplitRight || canSplitBottom) && (
        <div className="flex flex-none items-center gap-2 border-t border-border bg-bg p-3">
          {canSplitRight && (
            <button
              type="button"
              onClick={() => onSplitRight?.()}
              title="Add a column to the right"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-card py-2 text-[12px] font-bold text-muted transition-colors hover:text-white"
            >
              <SplitRightIcon /> Split right
            </button>
          )}
          {canSplitBottom && (
            <button
              type="button"
              onClick={() => onSplitBottom?.()}
              title="Add a pane below"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-card py-2 text-[12px] font-bold text-muted transition-colors hover:text-white"
            >
              <SplitBottomIcon /> Split bottom
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// One feed row: selecting the token is the primary action (the whole row), with a
// star button overlaid at the right edge to toggle the watchlist without selecting.
function TokenRow({
  token: t,
  selected,
  watched,
  onSelect,
  onToggleWatch,
}: {
  token: Token;
  selected: boolean;
  watched: boolean;
  onSelect: (mint: string) => void;
  onToggleWatch: (mint: string) => void;
}) {
  const rowRef = useRef<HTMLLIElement>(null);
  // Hover card anchor: the row's viewport rect, captured on enter. `null` = hidden.
  // We position the card with FIXED coords from this rect so it escapes the rail's
  // overflow-y-auto clipping (an absolute child would be cut off at the rail edge).
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  return (
    <li
      ref={rowRef}
      className="relative"
      onMouseEnter={() => setAnchor(rowRef.current?.getBoundingClientRect() ?? null)}
      onMouseLeave={() => setAnchor(null)}
    >
      <button
        type="button"
        className={`grid w-full grid-cols-[34px_1fr_auto] items-center gap-x-3 gap-y-0.5 border-b border-border/60 py-2.5 pl-3 pr-9 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green ${
          selected ? "bg-card-2" : "hover:bg-card"
        }`}
        onClick={() => onSelect(t.mint)}
        aria-current={selected}
      >
        {t.logoURI ? (
          <Image
            src={t.logoURI}
            alt=""
            width={34}
            height={34}
            className="row-span-2 size-[34px] rounded-full"
            unoptimized
          />
        ) : (
          <span className="row-span-2 size-[34px] rounded-full bg-card-2" />
        )}
        {/* left stack: symbol over price */}
        <span className="col-start-2 truncate text-[14px] font-bold text-white">
          {t.symbol}
        </span>
        {/* right stack: MC over %change */}
        <span className="col-start-3 text-right text-[13px] font-semibold tabular-nums text-white">
          {t.marketCap !== undefined ? `${formatUsdCompact(t.marketCap)} MC` : formatPrice(t.price)}
        </span>
        <span className="col-start-2 truncate text-[12px] tabular-nums text-muted">
          {formatPrice(t.price)}
        </span>
        <span
          className={`col-start-3 text-right text-[12px] font-semibold tabular-nums ${
            t.direction === "down" ? "text-red" : "text-green"
          }`}
        >
          {formatChange(t.change24h)}
        </span>
      </button>
      {/* star — absolutely positioned so it isn't nested inside the row button
          (no invalid button-in-button); toggles the watchlist independently. */}
      <button
        type="button"
        aria-pressed={watched}
        aria-label={watched ? `Remove ${t.symbol} from watchlist` : `Add ${t.symbol} to watchlist`}
        title={watched ? "Remove from watchlist" : "Add to watchlist"}
        onClick={() => onToggleWatch(t.mint)}
        className={`absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md transition-colors hover:bg-card-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green ${
          watched ? "text-green" : "text-dim hover:text-white"
        }`}
      >
        <StarIcon filled={watched} />
      </button>

      {anchor && <RowHoverCard token={t} anchor={anchor} />}
    </li>
  );
}

// fomo-style hover popover for a trending row — avatar + symbol + MC headline,
// then the details we already hold in the feed (name, 24h change, holders,
// contract). Fields we don't fetch per-row (24h volume, top-10 concentration)
// are omitted rather than faked. Fixed-positioned from the row's rect so it
// isn't clipped by the rail's scroll container; flips left if it'd overflow.
function RowHoverCard({ token: t, anchor }: { token: Token; anchor: DOMRect }) {
  const W = 288;
  const GAP = 10;
  // Prefer the right of the rail; flip to the left edge if there isn't room.
  const spaceRight = window.innerWidth - anchor.right;
  const left = spaceRight > W + GAP ? anchor.right + GAP : anchor.left - W - GAP;
  // Clamp vertically so a bottom row's card stays on screen.
  const top = Math.min(anchor.top, window.innerHeight - 240);
  const down = t.direction === "down";

  // Portal to <body>: the chart is a cross-origin iframe with its own stacking
  // context, so a card rendered inside the rail is painted UNDER the iframe no
  // matter its z-index. Appending to body (after the iframe in paint order) is
  // the only reliable way to float the card over the chart.
  return createPortal(
    <div
      role="tooltip"
      style={{ position: "fixed", top: Math.max(8, top), left, width: W }}
      className="z-[300] rounded-2xl border border-border bg-card/95 p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        {t.logoURI ? (
          <Image src={t.logoURI} alt="" width={40} height={40} className="size-10 flex-none rounded-full" unoptimized />
        ) : (
          <span className="size-10 flex-none rounded-full bg-card-2" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-extrabold text-white">{t.symbol}</div>
          <div className="truncate text-[12px] text-muted">{t.name}</div>
        </div>
        <div className="text-right">
          <div className="text-[15px] font-bold tabular-nums text-white">
            {t.marketCap !== undefined ? formatUsdCompact(t.marketCap) : formatPrice(t.price)}
          </div>
          <div className={`text-[12px] font-semibold tabular-nums ${down ? "text-red" : "text-green"}`}>
            {down ? "▼" : "▲"} {formatChange(t.change24h)}
          </div>
        </div>
      </div>

      <dl className="mt-3 flex flex-col gap-2 border-t border-border pt-3 text-[13px]">
        <CardRow label="Price" value={formatPrice(t.price)} />
        {t.marketCap !== undefined && <CardRow label="Market cap" value={formatUsdCompact(t.marketCap)} />}
        {t.holderCount !== undefined && t.holderCount > 0 && (
          <CardRow label="Holders" value={formatCount(t.holderCount)} />
        )}
        <CardRow label="Contract" value={shortAddress(t.mint, 4, 4)} mono />
      </dl>
    </div>,
    document.body,
  );
}

function CardRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-semibold tabular-nums text-white ${mono ? "font-mono text-[12px]" : ""}`}>{value}</dd>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19l1-5.8L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  );
}

function SplitRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M14 3v18" />
    </svg>
  );
}

function SplitBottomIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 14h18" />
    </svg>
  );
}
