// Shared types + runtime guards for the TRADING TERMINAL data layer.
//
// Mirrors the discipline in lib/quotes/types.ts: NO zod (one feature doesn't
// justify a dependency); hand-rolled narrow guards so nothing third-party reaches
// the UI unvalidated — the terminal can never render `$NaN`, `undefined%`, or a
// broken row. Re-uses the primitive guards (isFiniteNumber/isNonEmptyString) that
// already exist for the banner.

import { isFiniteNumber, isNonEmptyString } from "@/lib/quotes/types";

export { isFiniteNumber, isNonEmptyString };

// ── Token detail (LEFT column) ────────────────────────────────────────────
// One Jupiter v2 `search?query={mint}` call returns everything below.

/** One stats window (5m / 1h / 6h / 24h) from Jupiter v2. */
export type StatsWindow = {
  priceChange: number; // percent already (NOT a fraction — verified, see quotes/types)
  buyVolume: number;
  sellVolume: number;
  numBuys: number;
  numSells: number;
  numTraders: number;
};

export type StatsKey = "5m" | "1h" | "6h" | "24h";

/** The on-chain safety audit Jupiter exposes — powers the 0/4 checklist. */
export type TokenAudit = {
  mintAuthorityDisabled: boolean;
  freezeAuthorityDisabled: boolean;
  /** % of supply held by the top holders (lower = safer). undefined if unknown. */
  topHoldersPercentage?: number;
  /** % of supply held by the dev wallet (lower = safer). undefined if unknown. */
  devBalancePercentage?: number;
};

/** Full token detail for the terminal's left column. */
export type TokenDetail = {
  mint: string;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
  price: number;
  /** 24h % change (already a percent), for the header. */
  change24h: number;
  mcap?: number;
  fdv?: number;
  liquidity?: number;
  holderCount?: number;
  /** Per-window stats; a window may be absent for a brand-new token. */
  stats: Partial<Record<StatsKey, StatsWindow>>;
  /** Audit block; absent if the provider didn't return one. */
  audit?: TokenAudit;
};

// ── Chart candles (MIDDLE) ────────────────────────────────────────────────

/**
 * One OHLCV candle. `time` is UNIX SECONDS (a number) — this is exactly what
 * lightweight-charts' UTCTimestamp expects, and exactly what GeckoTerminal
 * returns, so no conversion happens anywhere. (Verified against the installed
 * lightweight-charts@5.2.0 typings: Time = UTCTimestamp | BusinessDay | string,
 * UTCTimestamp = Nominal<number>.)
 */
export type Candle = {
  time: number; // UNIX seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

// ── Live trades (MIDDLE) ──────────────────────────────────────────────────

export type Trade = {
  /** Stable key for React lists — GeckoTerminal's trade id (or tx hash + log idx). */
  id: string;
  side: "buy" | "sell";
  /** USD value of the trade. */
  usd: number;
  /** Price of the token in USD at the trade. */
  priceUsd: number;
  /** Trader wallet (tx signer). */
  trader: string;
  /** Transaction signature, for an explorer link. */
  txHash: string;
  /** UNIX seconds. */
  time: number;
};

// ── Holders (MIDDLE) ──────────────────────────────────────────────────────

export type Holder = {
  /** Token-account address (largest accounts; not always the owner wallet). */
  address: string;
  /** Raw base-unit amount, as a string (can exceed Number.MAX_SAFE_INTEGER). */
  amount: string;
  /** Share of total supply as a percent (0–100), if computable. */
  pct?: number;
};

/**
 * Supply share by holder-rank band, each a percent 0–100. `next20` (ranks 21–40)
 * is present only when the data comes from GeckoTerminal's 4-band breakdown; when
 * we derive the distribution from the top-20 wallets ourselves it's a 3-band split
 * (top10 / next10 / rest) and `next20` is absent.
 */
export type Distribution = {
  top10: number;
  next10: number; // ranks 11–20
  next20?: number; // ranks 21–40 — only in the Gecko 4-band case
  rest: number;
};

/**
 * Holder picture for a token. `count` (Jupiter), `distribution` (Gecko when it has
 * it, else computed from `topWallets`), and the optional per-wallet `topWallets`
 * list (Alchemy) are each from independent sources.
 */
export type HolderInfo = {
  /** Total holder count, if known. */
  count?: number;
  /** Supply concentration by rank band. */
  distribution?: Distribution;
  /** Optional per-wallet top holders (needs ALCHEMY_RPC_URL). */
  topWallets: Holder[];
};

// ── Swap quote (RIGHT) ────────────────────────────────────────────────────

export type SwapQuote = {
  inputMint: string;
  outputMint: string;
  /** Input amount in base units, as a string (parsed to bigint by the caller). */
  inAmount: string;
  /** Output amount in base units, as a string (parsed to bigint by the caller). */
  outAmount: string;
  /** Price impact as a real PERCENT (e.g. 15.3 = 15.3%). Jupiter returns a
   *  fraction; the mapper multiplies by 100, so consumers render it directly. */
  priceImpactPct: number;
  /** USD value of the swap, if the provider returned one. */
  usdValue?: number;
};

// ── Shared helpers ────────────────────────────────────────────────────────

/**
 * Coerce a numeric field → finite number, else undefined. Accepts a number OR a
 * numeric string (APIs send numbers as strings — Gecko/Jupiter-quote do). One
 * coercer for every numeric field; pair with `?? fallback` when a default is
 * wanted (see `numOr`).
 */
export function asNumber(x: unknown): number | undefined {
  if (isFiniteNumber(x)) return x;
  if (typeof x === "string" && x.trim() !== "") {
    const n = Number(x);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** `asNumber` with a fallback (default 0). */
export function numOr(x: unknown, fallback = 0): number {
  return asNumber(x) ?? fallback;
}

/** Strict boolean coercion — only a real `true`/`false` passes (audit fields). */
export function asBool(x: unknown): boolean | undefined {
  return typeof x === "boolean" ? x : undefined;
}
