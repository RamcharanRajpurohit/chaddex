"use client";

import { useState } from "react";
import { useSelectedToken, useSolPrice } from "../token-detail-context";
import { usePaper } from "../paper-context";
import { computePnl, bigToFloat } from "@/lib/terminal/paper/store";
import { formatUsd, formatPnl, formatPct } from "@/lib/quotes/format";

type Tab = "open" | "closed";

// User's position in the selected token with LIVE unrealized P&L. P&L is derived
// each render from the polled token price + SOL price — never stored. Both come
// from the shared token-detail context (one poller each), not local fetches.
//
// Matches fomo's "Your positions" block: a heading with an Open/Closed segmented
// toggle. We track ONLY open positions (the paper store keeps no realized-trade
// history), so "Closed" is an honest empty state rather than fabricated rows.
export function PositionPanel({ mint }: { mint: string }) {
  const { position } = usePaper();
  const { data: token } = useSelectedToken();
  const solPrice = useSolPrice();
  const [tab, setTab] = useState<Tab>("open");

  const pos = position(mint);
  const hasOpen = !!pos && pos.baseUnits > 0n;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-eyebrow font-bold uppercase tracking-[0.1em] text-muted">
          Your positions
        </span>
        {/* Open/Closed segmented toggle (fomo chrome). */}
        <div className="flex gap-1 rounded-full bg-card p-0.5" role="tablist" aria-label="Position filter">
          {(["open", "closed"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-[12px] font-bold capitalize transition-colors ${
                tab === t ? "bg-card-2 text-white" : "text-muted hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "closed" ? (
        <EmptyState>No closed positions</EmptyState>
      ) : hasOpen ? (
        <OpenPosition pos={pos} tokenPrice={token?.price} solPrice={solPrice} />
      ) : (
        <EmptyState>No open positions</EmptyState>
      )}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center text-[13px] text-muted">
      {children}
    </div>
  );
}

function OpenPosition({
  pos,
  tokenPrice,
  solPrice,
}: {
  pos: NonNullable<ReturnType<ReturnType<typeof usePaper>["position"]>>;
  tokenPrice: number | undefined;
  solPrice: number | undefined;
}) {
  // Without live prices we can show the holding but not value it yet.
  const pnl =
    tokenPrice !== undefined && solPrice !== undefined
      ? computePnl(pos, tokenPrice, solPrice)
      : null;

  const held = bigToFloat(pos.baseUnits, pos.decimals);
  const up = pnl !== null && pnl.pnlUsd >= 0;
  const pnlColor = pnl ? (up ? "text-green" : "text-red") : "text-white";

  return (
    // account-glow = the breathing white inset ring from the account card.
    <div className="account-glow rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-bold text-muted">{pos.symbol}</span>
        <span className="text-[13px] font-bold tabular-nums text-white">
          {held.toLocaleString(undefined, { maximumFractionDigits: 4 })} {pos.symbol}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <Metric label="Value" value={pnl ? formatUsd(pnl.valueUsd) : "…"} />
        <Metric label="Cost" value={pnl ? formatUsd(pnl.costUsd) : "…"} />
        <Metric label="P&L" value={pnl ? formatPnl(pnl.pnlUsd) : "…"} color={pnlColor} big />
        <Metric label="P&L %" value={pnl ? formatPct(pnl.pnlPct) : "…"} color={pnlColor} big />
      </dl>
    </div>
  );
}

function Metric({
  label,
  value,
  color = "text-white",
  big = false,
}: {
  label: string;
  value: string;
  color?: string;
  big?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] text-dim">{label}</dt>
      <dd className={`${big ? "text-[17px]" : "text-[14px]"} font-extrabold tabular-nums ${color}`}>
        {value}
      </dd>
    </div>
  );
}
