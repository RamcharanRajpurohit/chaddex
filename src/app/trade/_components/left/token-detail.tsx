"use client";

import { useState } from "react";
import { useSelectedToken } from "../token-detail-context";
import { deriveChecklist, checklistScore } from "@/lib/terminal/safety";
import { type StatsKey } from "@/lib/terminal/types";
import { formatUsdCompact, formatCount } from "@/lib/quotes/format";

const WINDOWS: StatsKey[] = ["5m", "1h", "6h", "24h"];

export function TokenDetailPanel() {
  const { data: token, status, refetch } = useSelectedToken();
  const [win, setWin] = useState<StatsKey>("24h");

  if (status === "loading" && !token)
    return <div className="m-4 h-64 animate-pulse rounded-2xl bg-card motion-reduce:animate-none" />;
  if (!token) {
    return (
      <div className="grid h-40 place-items-center p-4 text-center text-sm text-muted">
        {status === "error" ? (
          <button
            type="button"
            className="font-semibold text-green hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            onClick={refetch}
          >
            Couldn’t load this token — retry
          </button>
        ) : (
          "Token not found"
        )}
      </div>
    );
  }

  const stats = token.stats[win];
  const checks = deriveChecklist(token.audit);

  return (
    <div className="flex flex-col gap-5 border-t border-border p-5">
      {/* The identity + price + Market-cap/Liquidity/FDV/Holders cells moved into
          the TokenHeader strip ABOVE the chart (fomo layout). This block keeps the
          per-window activity stats + the safety checklist. */}

      {/* window pills — neutral filled active chip (fomo chrome; green stays
          reserved for gains, not UI). */}
      <div className="flex w-full max-w-xs gap-1.5 rounded-full border border-white/[0.07] bg-card p-1" role="tablist" aria-label="Stat window">
        {WINDOWS.map((w) => (
          <button
            key={w}
            role="tab"
            aria-selected={w === win}
            className={`flex-1 rounded-full py-1.5 text-[13px] font-bold transition-colors ${
              w === win ? "bg-card-2 text-white" : "text-muted hover:text-white"
            }`}
            onClick={() => setWin(w)}
          >
            {w}
          </button>
        ))}
      </div>

      {/* window stats + safety side-by-side on the wider middle column */}
      <div className="grid gap-2.5 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="Volume" value={stats ? formatUsdCompact(stats.buyVolume + stats.sellVolume) : "—"} />
          <StatCard label="Traders" value={stats ? formatCount(stats.numTraders) : "—"} />
          <StatCard label="Buys" value={stats ? formatCount(stats.numBuys) : "—"} tone="up" />
          <StatCard label="Sells" value={stats ? formatCount(stats.numSells) : "—"} tone="down" />
        </div>

        {/* safety checklist */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-eyebrow font-bold uppercase tracking-[0.1em] text-muted">Safety</span>
            <span className="rounded-full bg-card-2 px-2.5 py-0.5 text-[12px] font-extrabold tabular-nums text-white">
              {checklistScore(checks)}/{checks.length}
            </span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {checks.map((c) => (
              <li key={c.key} className="flex items-center gap-2.5 text-[13px]">
                <CheckMark unknown={c.unknown} pass={c.pass} />
                <span className="flex-1 text-muted">{c.label}</span>
                {c.detail && <span className="tabular-nums text-dim">{c.detail}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-dim">{label}</div>
      <div
        className={`mt-1 text-[18px] font-extrabold tracking-[-0.01em] tabular-nums ${
          tone === "up" ? "text-green" : tone === "down" ? "text-red" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function CheckMark({ unknown, pass }: { unknown: boolean; pass: boolean }) {
  const cls = unknown ? "text-dim" : pass ? "bg-green/15 text-green" : "bg-red/15 text-red";
  return (
    <span className={`grid size-5 flex-none place-items-center rounded-full text-[12px] font-bold ${cls}`} aria-hidden>
      {unknown ? "—" : pass ? "✓" : "✕"}
    </span>
  );
}
