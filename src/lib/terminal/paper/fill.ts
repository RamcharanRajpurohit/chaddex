// Paper-trade FILL MATH — pure, integer-only (BigInt base units).
//
// The money path NEVER touches floats: balances are lamports (bigint), token
// amounts are base units (bigint). Floats appear only when formatting for the
// screen. This kills the classic 0.1+0.2 drift, dust, and rounding-to-negative
// bugs the adversarial review flagged.
//
// Model (matches papersol): take a REAL Jupiter quote, then simulate execution
// by charging a fee and applying slippage to the received amount. No on-chain tx.

import type { SwapQuote } from "../types";

export const LAMPORTS_PER_SOL = 1_000_000_000n;

/** Paper-trade execution parameters (papersol uses 0.3% fee, 0.5% slippage). */
export const FEE_BPS = 30n; // 0.30%
export const SLIPPAGE_BPS = 50n; // 0.50%
const BPS = 10_000n;

export type Side = "buy" | "sell";

export type Fill = {
  side: Side;
  /** SOL spent (buy) or received (sell), in lamports — fee already applied. */
  solLamports: bigint;
  /** Token base units bought (buy) or sold (sell). */
  tokenBaseUnits: bigint;
  /** Fee charged, in lamports. */
  feeLamports: bigint;
  /** Token decimals (carried so the store can format / value the position). */
  decimals: number;
};

/** Parse a Jupiter amount string (already validated as /^\d+$/) to bigint. */
export function toBig(amountStr: string): bigint {
  return BigInt(amountStr);
}

/**
 * Compute a BUY fill from a quote where inputMint = SOL.
 * - `solLamports` is the SOL the user spends (their input amount).
 * - Fee is charged ON TOP conceptually but, to keep the spend exact, we model it
 *   as: total debited = solIn + fee; tokens received = quote.outAmount reduced by
 *   slippage. (Quote already reflects route price; slippage models adverse fill.)
 */
export function computeBuyFill(quote: SwapQuote, decimals: number): Fill {
  const solIn = toBig(quote.inAmount); // lamports
  const tokensOutRaw = toBig(quote.outAmount); // token base units
  const fee = (solIn * FEE_BPS) / BPS;
  const tokensOut = tokensOutRaw - (tokensOutRaw * SLIPPAGE_BPS) / BPS;
  return {
    side: "buy",
    solLamports: solIn,
    tokenBaseUnits: tokensOut < 0n ? 0n : tokensOut,
    feeLamports: fee,
    decimals,
  };
}

/**
 * Compute a SELL fill from a quote where inputMint = token, outputMint = SOL.
 * - `tokenBaseUnits` is what the user sells (their input amount).
 * - SOL received = quote.outAmount reduced by slippage, then minus fee.
 */
export function computeSellFill(quote: SwapQuote, decimals: number): Fill {
  const tokensIn = toBig(quote.inAmount); // token base units
  const solOutRaw = toBig(quote.outAmount); // lamports
  const solAfterSlippage = solOutRaw - (solOutRaw * SLIPPAGE_BPS) / BPS;
  const fee = (solAfterSlippage * FEE_BPS) / BPS;
  const solOut = solAfterSlippage - fee;
  return {
    side: "sell",
    solLamports: solOut < 0n ? 0n : solOut,
    tokenBaseUnits: tokensIn,
    feeLamports: fee,
    decimals,
  };
}

/**
 * Convert a human decimal string (e.g. "1.5") to integer base units for a token
 * with `decimals` precision — the one parser both SOL and SPL amounts use. Pure
 * BigInt (no float), so no precision loss. Returns null for malformed input or
 * out-of-range decimals (the caller shows a direct "enter a valid amount" error).
 */
export const SOL_DECIMALS = 9;

export function parseDecimal(value: string, decimals: number): bigint | null {
  const trimmed = value.trim();
  if (decimals < 0 || decimals > 18) return null;
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "" || trimmed === ".") return null;
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(fracPadded || "0");
}

/** "0.1" SOL → lamports. */
export const solToLamports = (sol: string): bigint | null =>
  parseDecimal(sol, SOL_DECIMALS);

/** "1.5" tokens → base units. */
export const tokenToBaseUnits = (amount: string, decimals: number): bigint | null =>
  parseDecimal(amount, decimals);
