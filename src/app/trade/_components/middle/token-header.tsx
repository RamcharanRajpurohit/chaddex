"use client";

import { useState } from "react";
import Image from "next/image";
import { useSelectedToken } from "../token-detail-context";
import {
  formatPrice,
  formatChange,
  formatUsdCompact,
  shortAddress,
} from "@/lib/quotes/format";

const SOLSCAN_TOKEN = "https://solscan.io/token/";

// fomo's terminal token header (matched byte-for-byte to the live layout): the
// identity cluster on the left (avatar · name · a row of action icons · a sub-line
// with the truncated mint + copy), then a horizontal run of stat cells LED by a
// larger "Market cap" (fomo's headline number), followed by Price · 24H change ·
// 24H Vol · Liquidity. The window-stats + safety block stays BELOW the chart.
export function TokenHeader() {
  const { data: token, status } = useSelectedToken();

  if (status === "loading" && !token) {
    return <div className="m-5 h-16 animate-pulse rounded-2xl bg-card motion-reduce:animate-none" />;
  }
  if (!token) return null;

  const down = token.change24h < 0;
  const vol24 = token.stats["24h"]
    ? token.stats["24h"]!.buyVolume + token.stats["24h"]!.sellVolume
    : undefined;

  return (
    <div className="flex min-w-0 items-center gap-x-6 border-b border-border px-5 py-4">
      {/* identity — allowed to shrink (name truncates) so the stats keep room. */}
      <div className="flex min-w-0 shrink items-start gap-3">
        {token.logoURI ? (
          <Image src={token.logoURI} alt="" width={44} height={44} className="mt-0.5 size-11 flex-none rounded-full" unoptimized />
        ) : (
          <span className="mt-0.5 size-11 flex-none rounded-full bg-card-2" />
        )}
        <div className="flex min-w-0 flex-col gap-1">
          {/* name + action icons (fomo's icon row next to the name) */}
          <div className="flex items-center gap-2">
            <span className="truncate text-[20px] font-extrabold leading-none tracking-[-0.02em] text-white">
              {token.symbol}
            </span>
            <div className="flex items-center gap-1 text-muted">
              <IconLink href={`${SOLSCAN_TOKEN}${token.mint}`} label="View on Solscan">
                <GlobeIcon />
              </IconLink>
              <IconLink href={`https://x.com/search?q=${encodeURIComponent(token.symbol)}`} label="Search on X">
                <XIcon />
              </IconLink>
              <StarButton />
            </div>
          </div>
          {/* sub-line: full name + truncated mint with copy */}
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <span className="truncate">{token.name}</span>
            <CopyAddress mint={token.mint} />
          </div>
        </div>
      </div>

      {/* stat cells — boxed chips, Market cap leads (larger). The group can shrink
          (min-w-0 + no flex-none) and scrolls horizontally on narrow widths instead
          of wrapping to a second row; ml-auto keeps it right-aligned when there's
          room. Each chip inside is flex-none so they don't squish, just scroll. */}
      <div className="term-scroll ml-auto flex min-w-0 shrink items-stretch gap-2 overflow-x-auto">
        <LeadStat label="Market cap" value={formatUsdCompact(token.mcap)} />
        <Stat label="Price" value={formatPrice(token.price)} />
        <Stat
          label="24H change"
          value={`${down ? "▼" : "▲"} ${formatChange(token.change24h)}`}
          tone={down ? "down" : "up"}
        />
        <Stat label="24H Vol" value={vol24 !== undefined ? formatUsdCompact(vol24) : "—"} />
        <Stat label="Liquidity" value={formatUsdCompact(token.liquidity)} />
      </div>
    </div>
  );
}

// fomo's headline stat — the leading "Market cap" chip, a touch larger than the
// rest. fomo boxes EVERY header stat in its own bordered cell (not unboxed
// columns), so this matches the secondary chip chrome with a bigger value.
function LeadStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-none flex-col justify-center rounded-xl border border-border bg-card/40 px-3.5 py-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.03em] text-dim">{label}</span>
      <span className="text-[20px] font-extrabold leading-tight tracking-[-0.02em] tabular-nums text-white">
        {value}
      </span>
    </div>
  );
}

// fomo's secondary stat cells — boxed chips (bordered, faint fill) with the label
// over the value, matching fomo's header where each stat sits in its own cell.
function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="flex flex-none flex-col justify-center rounded-xl border border-border bg-card/40 px-3.5 py-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.03em] text-dim">{label}</span>
      <span
        className={`text-[15px] font-bold leading-tight tabular-nums ${
          tone === "up" ? "text-green" : tone === "down" ? "text-red" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      title={label}
      className="grid size-6 place-items-center rounded-md text-muted transition-colors hover:bg-card hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green"
    >
      {children}
    </a>
  );
}

function StarButton() {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remove from watchlist" : "Add to watchlist"}
      title="Watchlist"
      onClick={() => setOn((v) => !v)}
      className={`grid size-6 place-items-center rounded-md transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green ${
        on ? "text-green" : "text-muted hover:text-white"
      }`}
    >
      <StarIcon filled={on} />
    </button>
  );
}

function CopyAddress({ mint }: { mint: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      className="inline-flex flex-none items-center gap-1 rounded-md bg-card px-2 py-0.5 font-mono text-[11px] text-muted transition-colors hover:bg-card-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green"
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
      {state === "idle" && <CopyIcon />}
    </button>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.9 2H22l-7.3 8.3L23 22h-6.6l-5.2-6.8L5.3 22H2l7.8-8.9L1.5 2h6.8l4.7 6.2L18.9 2Zm-2.3 18h1.8L7.5 3.8H5.6L16.6 20Z" />
    </svg>
  );
}
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19l1-5.8L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
