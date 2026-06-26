// Jupiter Quote API → SwapQuote mapper for the RIGHT panel.
//
// We fetch a REAL quote (real route, real price impact) and use it to compute a
// simulated paper fill — no swap transaction is ever built or signed. KEYLESS.
//
// Endpoint (verified live): GET lite-api.jup.ag/swap/v1/quote
//   ?inputMint=&outputMint=&amount=&slippageBps=
// `amount` is in the INPUT token's base units. Response `outAmount` is in the
// OUTPUT token's base units (both as strings → parse to bigint, never Number()).

import { type SwapQuote, isNonEmptyString, asNumber } from "./types";

const BASE = "https://lite-api.jup.ag/swap/v1";

/** Wrapped SOL mint — the input for buys / output for sells. */
export const SOL_MINT = "So11111111111111111111111111111111111111112";

type RawQuote = {
  inputMint?: unknown;
  outputMint?: unknown;
  inAmount?: unknown;
  outAmount?: unknown;
  priceImpactPct?: unknown;
  swapUsdValue?: unknown;
};

export function mapSwapQuote(raw: RawQuote): SwapQuote | null {
  const inputMint = raw.inputMint;
  const outputMint = raw.outputMint;
  const inAmount = raw.inAmount;
  const outAmount = raw.outAmount;

  if (!isNonEmptyString(inputMint)) return null;
  if (!isNonEmptyString(outputMint)) return null;
  // Amounts come as decimal strings of integers; keep them as strings.
  if (!isNonEmptyString(inAmount)) return null;
  if (!isNonEmptyString(outAmount)) return null;
  // Reject anything that isn't a clean non-negative integer string (defensive:
  // we parse these with BigInt(), which throws on a malformed string).
  if (!/^\d+$/.test(inAmount) || !/^\d+$/.test(outAmount)) return null;

  // Jupiter returns priceImpactPct as a FRACTION (verified live: 0.153 = 15.3%),
  // NOT a percent. Convert to a real percent here so every consumer renders it
  // correctly (a 15% impact must not show as "0.15%").
  const impactFraction = asNumber(raw.priceImpactPct) ?? 0;

  return {
    inputMint,
    outputMint,
    inAmount,
    outAmount,
    priceImpactPct: impactFraction * 100,
    usdValue: asNumber(raw.swapUsdValue),
  };
}

/**
 * Fetch a quote for `amount` (base units of inputMint) → outputMint. Returns null
 * if Jupiter returns no route (an unroutable pair is a UI state, not an error).
 * Throws on network/HTTP error so the caller can show a transient failure.
 */
export async function fetchQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string; // base units of inputMint, integer string
  slippageBps: number;
  signal?: AbortSignal;
}): Promise<SwapQuote | null> {
  const { inputMint, outputMint, amount, slippageBps, signal } = params;
  if (!/^\d+$/.test(amount) || amount === "0") return null;
  const url =
    `${BASE}/quote?inputMint=${encodeURIComponent(inputMint)}` +
    `&outputMint=${encodeURIComponent(outputMint)}` +
    `&amount=${amount}&slippageBps=${slippageBps}`;
  const res = await fetch(url, { headers: { accept: "application/json" }, signal });
  if (res.status === 422 || res.status === 400) {
    // Jupiter returns 4xx when there's no route for the pair/amount → no quote.
    return null;
  }
  if (!res.ok) {
    throw new Error(`Jupiter quote ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  if (typeof json !== "object" || json === null) return null;
  return mapSwapQuote(json as RawQuote);
}
