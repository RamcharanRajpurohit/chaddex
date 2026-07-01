"use client";

import { useState } from "react";
import { useSelectedToken } from "../token-detail-context";
import { useTrades, useHolders } from "@/lib/terminal/hooks";
import { type StatsKey } from "@/lib/terminal/types";
import { inferLaunchpad } from "@/lib/terminal/launchpad";
import {
  formatChange,
  formatUsdCompact,
  formatCount,
  formatAgo,
  shortAddress,
} from "@/lib/quotes/format";

const WINDOWS: StatsKey[] = ["5m", "1h", "6h", "24h"];

// fomo's right-rail market block (captured live): a stat-window selector row, then
// THREE two-segment ratio bars — buys/sells, buy-vol/sell-vol, buyers/sellers —
// green vs red, sized by each side's share. NO new API: buys/sells/volume come
// from the Jupiter window stats we already poll; distinct buyers/sellers are
// counted from the /api/trades feed we already fetch.
export function MarketStats({ mint }: { mint: string }) {
  const { data: token } = useSelectedToken();
  // Poll trades regardless of the active chart tab so the buyers/sellers counts
  // stay live in the side panel; the route is cached so this is cheap.
  const { data: trades } = useTrades(mint, true);
  // The token's prose description for the "About" card (Gecko `/info`, shared with
  // the holders panel — one cached call).
  const { data: holders } = useHolders(mint, true);
  const [win, setWin] = useState<StatsKey>("24h");
  // fomo's "View more / View less" collapses the detail block (ratio bars +
  // metadata rows) under the window selector. Expanded by default so the panel
  // shows its full picture; the toggle is a real state change, not a dead link.
  const [expanded, setExpanded] = useState(true);

  if (!token) return null;

  const stats = token.stats[win];
  // Distinct trader wallets by side, from the live trade feed (last ~N trades).
  const buyers = new Set<string>();
  const sellers = new Set<string>();
  for (const t of trades ?? []) {
    (t.side === "buy" ? buyers : sellers).add(t.trader);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      {/* About {SYM} — fomo's description card (Gecko prose, expandable). */}
      <About symbol={token.symbol} description={holders?.description} />

      {/* window selector — one cell per timeframe: label over its % change. The
          active cell is a clearly-outlined filled chip; the rest are flat. Each
          cell gets even room (grid, not flex-1) so the values never crowd the
          edges, and the arrow sits just left of the % with a small gap. */}
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-border bg-bg p-1.5" role="tablist" aria-label="Activity window">
        {WINDOWS.map((w) => {
          const ws = token.stats[w];
          const wDown = ws ? ws.priceChange < 0 : false;
          return (
            <button
              key={w}
              role="tab"
              aria-selected={w === win}
              onClick={() => setWin(w)}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors ${
                w === win
                  ? "bg-card-2 text-white ring-1 ring-inset ring-white/10"
                  : "text-muted hover:bg-card hover:text-white"
              }`}
            >
              <span className="text-[12px] font-bold uppercase tracking-wide">{w}</span>
              <span className={`flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${ws ? (wDown ? "text-red" : "text-green") : "text-dim"}`}>
                {ws ? (
                  <>
                    <span aria-hidden>{wDown ? "▼" : "▲"}</span>
                    {formatChange(ws.priceChange)}
                  </>
                ) : (
                  "—"
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Collapsible detail — fomo's "View more / View less" hides/shows the ratio
          bars + the token metadata rows. */}
      {expanded && (
        <>
          <div className="flex flex-col gap-4">
            <RatioBar
              leftLabel={`${formatCount(stats?.numBuys)} buys`}
              rightLabel={`${formatCount(stats?.numSells)} sells`}
              left={stats?.numBuys ?? 0}
              right={stats?.numSells ?? 0}
            />
            <RatioBar
              leftLabel={`${formatUsdCompact(stats?.buyVolume)} vol`}
              rightLabel={`${formatUsdCompact(stats?.sellVolume)} vol`}
              left={stats?.buyVolume ?? 0}
              right={stats?.sellVolume ?? 0}
            />
            <RatioBar
              leftLabel={`${formatCount(buyers.size)} buyers`}
              rightLabel={`${formatCount(sellers.size)} sellers`}
              left={buyers.size}
              right={sellers.size}
            />
          </div>

          {/* fomo's metadata rows — Launchpad · Supply · Network · Created ·
              Contract. Every value comes from data we already fetch (Jupiter v2
              token detail + the mint itself); a row is omitted when its source is
              genuinely absent rather than shown as a fake placeholder. */}
          <MetaRows />
        </>
      )}

      {/* View more / View less — a REAL toggle (fomo's expander), not a dead link. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mx-auto rounded-lg bg-bg px-4 py-1.5 text-[12px] font-bold text-muted transition-colors hover:text-white"
      >
        {expanded ? "View less" : "View more"}
      </button>
    </div>
  );
}

// fomo's token-metadata block: a stack of label·value rows. Sources (all already
// in hand — NO new request): Launchpad from the mint's vanity suffix, Supply +
// Created from the Jupiter token detail, Network always Solana, Contract the mint
// (copyable). A row is rendered only when its value is genuinely known.
function MetaRows() {
  const { data: token } = useSelectedToken();
  if (!token) return null;
  const launchpad = inferLaunchpad(token.mint);
  return (
    <dl className="flex flex-col gap-2.5 border-t border-border pt-3 text-[13px]">
      {launchpad && <Row label="Launchpad" value={launchpad} />}
      {token.circSupply !== undefined && (
        <Row label="Supply" value={formatCount(token.circSupply)} />
      )}
      <Row label="Network" value="Solana" />
      {token.createdAt !== undefined && (
        <Row label="Created" value={`${formatAgo(token.createdAt)} ago`} />
      )}
      <ContractRow mint={token.mint} />
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-dim">{label}</dt>
      <dd className="font-semibold tabular-nums text-white">{value}</dd>
    </div>
  );
}

// Contract row with copy-to-clipboard, mirroring fomo's truncated-address + copy
// affordance in the metadata block.
function ContractRow({ mint }: { mint: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-dim">Contract</dt>
      <button
        type="button"
        title="Copy contract address"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(mint);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {
            /* clipboard blocked — leave the label as-is */
          }
        }}
        className="inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold text-white transition-colors hover:text-green focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green"
      >
        {copied ? "Copied ✓" : shortAddress(mint, 5, 4)}
        {!copied && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        )}
      </button>
    </div>
  );
}

// fomo's "About {SYM}" description card — collapsed to two lines with a Read more
// toggle. Hidden entirely when Gecko has no description (never an empty card).
function About({ symbol, description }: { symbol: string; description?: string }) {
  const [open, setOpen] = useState(false);
  if (!description) return null;
  return (
    <div>
      <div className="mb-1.5 text-eyebrow font-bold uppercase tracking-[0.1em] text-muted">
        About {symbol}
      </div>
      <p className={`text-[13px] leading-relaxed text-muted ${open ? "" : "line-clamp-2"}`}>
        {description}
      </p>
      {description.length > 120 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-[12px] font-bold text-green hover:underline"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

// One fomo ratio bar: green/red labels above a 6px two-segment track (radius 1.5px,
// matching fomo's exact values). Widths are each side's share; a 0/0 split renders
// an even, dimmed bar rather than a divide-by-zero collapse.
function RatioBar({
  leftLabel,
  rightLabel,
  left,
  right,
}: {
  leftLabel: string;
  rightLabel: string;
  left: number;
  right: number;
}) {
  const total = left + right;
  const leftPct = total > 0 ? (left / total) * 100 : 50;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px] font-semibold tabular-nums">
        <span className="text-green">{leftLabel}</span>
        <span className="text-red">{rightLabel}</span>
      </div>
      <div className="flex h-1.5 gap-0.5 overflow-hidden">
        <span
          className="rounded-[1.5px] bg-green"
          style={{ width: `${leftPct}%`, opacity: total > 0 ? 1 : 0.35 }}
          aria-hidden
        />
        <span
          className="flex-1 rounded-[1.5px] bg-red"
          style={{ opacity: total > 0 ? 1 : 0.35 }}
          aria-hidden
        />
      </div>
    </div>
  );
}
