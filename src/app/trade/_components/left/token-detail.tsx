"use client";

import { useState } from "react";
import Image from "next/image";
import { useSelectedToken } from "../token-detail-context";
import { deriveChecklist, checklistScore } from "@/lib/terminal/safety";
import { type StatsKey } from "@/lib/terminal/types";
import {
  formatPrice,
  formatChange,
  formatUsdCompact,
  formatCount,
  shortAddress,
} from "@/lib/quotes/format";

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
  const down = token.change24h < 0;

  return (
    <div className="flex flex-col gap-5 border-t border-border p-5">
      {/* identity + price on one row (wider middle column) */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {token.logoURI ? (
            <Image src={token.logoURI} alt="" width={44} height={44} className="size-11 flex-none rounded-full" unoptimized />
          ) : (
            <span className="size-11 flex-none rounded-full bg-card-2" />
          )}
          <div className="flex min-w-0 flex-col">
            <span className="text-lg font-extrabold tracking-[-0.02em] text-white">{token.symbol}</span>
            <span className="truncate text-[13px] text-muted">{token.name}</span>
          </div>
          <CopyAddress mint={token.mint} />
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className="text-[34px] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-white">
            {formatPrice(token.price)}
          </span>
          <span className={`flex items-center gap-1 text-[15px] font-bold tabular-nums ${down ? "text-red" : "text-green"}`}>
            <span aria-hidden>{down ? "▼" : "▲"}</span>
            {formatChange(token.change24h)}
          </span>
        </div>
      </div>

      {/* key stats as glass cards — 4-up on the wider middle column */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard label="Market cap" value={formatUsdCompact(token.mcap)} />
        <StatCard label="Liquidity" value={formatUsdCompact(token.liquidity)} />
        <StatCard label="FDV" value={formatUsdCompact(token.fdv)} />
        <StatCard label="Holders" value={formatCount(token.holderCount)} />
      </div>

      {/* window pills — blue-tinted glass active (neutral interactive; green is
          reserved for gains, not UI chrome) */}
      <div className="flex w-full max-w-xs gap-1.5 rounded-full border border-white/[0.07] bg-card p-1" role="tablist" aria-label="Stat window">
        {WINDOWS.map((w) => (
          <button
            key={w}
            role="tab"
            aria-selected={w === win}
            className={`flex-1 rounded-full py-1.5 text-[13px] font-bold transition-colors ${
              w === win ? "bg-blue/15 text-blue" : "text-muted hover:text-white"
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

function CopyAddress({ mint }: { mint: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      className="ml-auto flex-none rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[11px] text-muted transition-colors hover:bg-card-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
      title="Copy mint address"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(mint);
          setState("copied");
        } catch {
          setState("failed");
        }
        setTimeout(() => setState("idle"), 1200);
      }}
    >
      {state === "copied" ? "Copied ✓" : state === "failed" ? "Copy failed" : shortAddress(mint)}
    </button>
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
