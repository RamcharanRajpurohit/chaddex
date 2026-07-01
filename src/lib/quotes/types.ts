// Shared types + runtime guards for the live token-banner data layer.
//
// We deliberately do NOT use zod (the project has none, and one endpoint doesn't
// justify a dependency). Instead we hand-roll narrow guards — matching the
// `typeof x === "number"` defensiveness already used in use-sol-balance.ts.
// Everything that touches third-party JSON is validated before it reaches the UI,
// so the banner can never render `$NaN` or `undefined%`.

/** A normalized token as the banner/UI consumes it. Provider-agnostic. */
export type Token = {
  /** Mint address — the stable identity used for routing to /token/[mint]. */
  mint: string;
  symbol: string;
  name: string;
  /** Logo URL, if the provider gave one. */
  logoURI?: string;
  /** Live USD price. */
  price: number;
  /**
   * 24h price change as a PERCENT already (e.g. -2.27 means -2.27%).
   * VERIFIED against Jupiter + DexScreener — it is NOT a fraction; do not ×100.
   * Can legitimately exceed ±100% for memecoins; clamp at the display layer.
   */
  change24h: number;
  /** Convenience sign for up/down styling, derived from change24h. */
  direction: "up" | "down";
  /** Holder count, when available (Jupiter v2 provides it). */
  holderCount?: number;
  /** Market cap in USD, when available (Jupiter v2 `mcap`). The trending rail
   *  leads with this (fomo shows "$XM MC" per row, not the raw price). */
  marketCap?: number;
};

/** True for a finite, real number (rejects NaN, Infinity, non-numbers). */
export function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Non-empty string guard. */
export function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.length > 0;
}

// Stablecoins + majors we never want in a *memecoin* banner. The ranking source
// (Jupiter toptraded) is ranked by trade volume, which drags in a couple of these
// (SOL, cbBTC, ZEC, WETH) — we strip them so the banner is provably memecoin-only
// regardless of how the upstream ranking drifts. Compared case-insensitively.
const NON_MEMECOIN_SYMBOLS = new Set(
  [
    // stablecoins
    "USDC", "USDT", "USDS", "USDE", "PYUSD", "FDUSD", "DAI", "CASH", "EURC", "USD1",
    // majors / wrapped blue-chips
    "SOL", "WSOL", "JLP", "JITOSOL", "MSOL", "BNSOL", "BSOL",
    "BTC", "WBTC", "CBBTC", "TBTC",
    "ETH", "WETH",
    "ZEC", "BNB",
  ].map((s) => s.toUpperCase()),
);

/**
 * Whether a token belongs in the memecoin banner. Excludes stablecoins and
 * major/wrapped assets by symbol. (Kept as a symbol denylist for clarity and
 * determinism; a positive signal like a launchpad tag can be layered later.)
 */
export function isMemecoin(token: Pick<Token, "symbol">): boolean {
  return !NON_MEMECOIN_SYMBOLS.has(token.symbol.toUpperCase());
}
