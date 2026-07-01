"use client";

import { createContext, useContext } from "react";
import { useTokenDetail, useOhlcv } from "@/lib/terminal/hooks";
import { SOL_MINT } from "@/lib/terminal/swap-quote";
import type { PolledResource } from "@/lib/terminal/use-polled-resource";
import type { TokenDetail } from "@/lib/terminal/types";

// Shares the token-detail resources every terminal panel needs, each fetched by a
// SINGLE poller (instead of one per consumer):
//   • the SELECTED token's detail — used by the left detail, chart header, trade
//     panel, and position panel (4 consumers → 1 poller).
//   • the SOL price — used by the position panel for P&L valuation (its own
//     resource; one poller, shared, and skipped entirely when the selected token
//     IS SOL since that detail already carries the price).
//   • the OHLCV pool-probe — the chart AND the activity panel both need the
//     resolved pool + the "is this token indexed yet" gate. One poller here, both
//     read it (instead of each running its own duplicate 1m poller).
//
// Exposes the FULL PolledResource for the token ({data, status, refetch}) — the
// left panel needs status + refetch for loading/error/retry; others read data.

/** The chart/activity pool gate, derived once from the shared OHLCV probe. */
export type PoolProbe = { pool: string | null; noPool: boolean; rateLimited: boolean };

type Ctx = {
  token: PolledResource<TokenDetail>;
  solPrice: number | undefined;
  pool: PoolProbe;
};

const TokenDetailContext = createContext<Ctx | null>(null);

export function TokenDetailProvider({
  mint,
  children,
}: {
  mint: string;
  children: React.ReactNode;
}) {
  // The ONE poller for the selected token. Re-runs when `mint` changes (provider
  // lives in the component that owns selectedMint), propagating to all consumers.
  const token = useTokenDetail(mint);

  // SOL price — one shared poller. If the selected token already IS SOL, reuse its
  // price (key=null disables the duplicate fetch); else fetch SOL separately.
  const isSol = mint === SOL_MINT;
  const sol = useTokenDetail(isSol ? null : SOL_MINT);
  const solPrice = isSol ? token.data?.price : sol.data?.price;

  // ONE OHLCV pool-probe for the whole middle column. A fixed 1m timeframe is
  // enough to resolve the pool + detect indexing; the chart embed draws the real
  // candles. `noPool` = Gecko hasn't indexed a pool (fresh token) OR it rate-
  // limited us; `rateLimited` distinguishes "retrying" from "indexing".
  const ohlcv = useOhlcv(mint, "1m", true);
  const pool: PoolProbe = {
    pool: ohlcv.data?.pool ?? null,
    noPool: ohlcv.data !== null && ohlcv.data.pool === null,
    rateLimited: ohlcv.data?.rateLimited === true,
  };

  return (
    <TokenDetailContext value={{ token, solPrice, pool }}>
      {children}
    </TokenDetailContext>
  );
}

export function useSelectedToken(): PolledResource<TokenDetail> {
  return useCtx().token;
}

/** SOL/USD price (one shared poller), for P&L valuation. */
export function useSolPrice(): number | undefined {
  return useCtx().solPrice;
}

/** The shared OHLCV pool gate ({pool, noPool, rateLimited}) — chart + activity. */
export function usePoolProbe(): PoolProbe {
  return useCtx().pool;
}

function useCtx(): Ctx {
  const ctx = useContext(TokenDetailContext);
  if (!ctx) {
    throw new Error("token-detail context used outside <TokenDetailProvider>");
  }
  return ctx;
}
