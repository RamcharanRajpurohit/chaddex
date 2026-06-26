// Display formatting + routing helpers shared by the banner and (future) token
// preview page. Kept tiny and pure.

/** Link to the trading terminal for a given mint (banner clicks land here). */
export function tokenHref(mint: string): string {
  return `/trade?mint=${encodeURIComponent(mint)}`;
}

/**
 * Format a 24h % change for display. The value is ALREADY a percent (verified
 * against Jupiter/DexScreener — see docs/data-layer-research.md). Memecoins can
 * legitimately move >100% (or >1000%), which would blow out the ticker layout, so
 * we clamp the DISPLAYED magnitude while keeping the real sign/color.
 */
export function formatChange(pct: number): string {
  const sign = pct >= 0 ? "+" : "-";
  const abs = Math.abs(pct);
  if (abs >= 1000) return `${sign}999%+`; // extreme pump — don't wreck the layout
  return `${sign}${abs.toFixed(2)}%`;
}

/**
 * Format a USD price compactly. Sub-$0.01 memecoins keep enough significant
 * digits to be meaningful without an absurd string length.
 */
export function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  // very small: show up to 8 decimals, trim trailing zeros
  return `$${price.toFixed(8).replace(/0+$/, "").replace(/\.$/, "")}`;
}

// ── Terminal display formatters ────────────────────────────────────────────

// Intl.NumberFormat does the compact-notation laddering ($1.2M, 45.3K) natively —
// one formatter per style, reused across calls. No hand-rolled 1e9/1e6/1e3 branches.
const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});
const countCompact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Compact USD for big figures (mcap, FDV, liquidity, volume). "—" if missing. */
export function formatUsdCompact(n: number | undefined): string {
  return n === undefined || !Number.isFinite(n) ? "—" : usdCompact.format(n);
}

/** Plain compact number (trade/holder counts). "—" if missing. */
export function formatCount(n: number | undefined): string {
  return n === undefined || !Number.isFinite(n) ? "—" : countCompact.format(n);
}

/**
 * Sub-zero price notation per the brand kit ($0.0₃3925 = $0.0003925). For a price
 * with many leading zeros after the decimal, render the zero-run as a subscript
 * count. Returns a small structured result so the UI can render the subscript as
 * a real <sub> (string fallback included for aria/plain contexts).
 */
export function formatPriceParts(
  price: number | undefined,
): { text: string; zeros?: number; sig?: string } {
  if (price === undefined || !Number.isFinite(price) || price < 0) {
    return { text: "—" };
  }
  if (price >= 0.01) return { text: formatPrice(price) };
  // count leading zeros after "0."
  const fixed = price.toFixed(12); // enough precision for memecoins
  const m = /^0\.(0+)(\d+)$/.exec(fixed);
  if (!m) return { text: formatPrice(price) };
  const zeros = m[1].length;
  if (zeros < 4) return { text: formatPrice(price) }; // not worth the subscript
  const sig = m[2].replace(/0+$/, "").slice(0, 4) || "0";
  return { text: `$0.0…${sig}`, zeros, sig };
}

/** USD value of a fill/position, signed-aware precision. */
export function formatUsd(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (abs >= 1) return `$${n.toFixed(2)}`;
  if (abs === 0) return "$0.00";
  return `$${n.toFixed(4)}`;
}

/** Signed P&L USD, e.g. "+$12.40" / "-$3.10". */
export function formatPnl(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  const sign = n >= 0 ? "+" : "-";
  return `${sign}${formatUsd(Math.abs(n))}`;
}

/** Signed percent, clamped like formatChange. null → "—". */
export function formatPct(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return formatChange(n);
}

/**
 * Plain percentage for a SHARE/proportion (e.g. a holder's % of supply) — NO
 * signed +/- prefix (that's only for price *changes*). e.g. 28.46 → "28.46%".
 */
export function formatShare(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

/** Truncate a base58 address for display: "DezX…B263". */
export function shortAddress(addr: string, lead = 4, tail = 4): string {
  if (addr.length <= lead + tail + 1) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

/** Relative time from a UNIX-seconds timestamp: "12s", "5m", "2h", "3d". */
export function formatAgo(unixSeconds: number, nowMs = Date.now()): string {
  const diff = Math.max(0, Math.floor(nowMs / 1000) - unixSeconds);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
