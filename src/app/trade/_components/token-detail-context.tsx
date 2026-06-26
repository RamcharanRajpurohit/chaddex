"use client";

import { createContext, useContext } from "react";
import { useTokenDetail } from "@/lib/terminal/hooks";
import { SOL_MINT } from "@/lib/terminal/swap-quote";
import type { PolledResource } from "@/lib/terminal/use-polled-resource";
import type { TokenDetail } from "@/lib/terminal/types";

// Shares the two token-detail resources every terminal panel needs, each fetched
// by a SINGLE poller (instead of one per consumer):
//   • the SELECTED token's detail — used by the left detail, chart header, trade
//     panel, and position panel (4 consumers → 1 poller).
//   • the SOL price — used by the position panel for P&L valuation (its own
//     resource; one poller, shared, and skipped entirely when the selected token
//     IS SOL since that detail already carries the price).
//
// Exposes the FULL PolledResource for the token ({data, status, refetch}) — the
// left panel needs status + refetch for loading/error/retry; others read data.

type Ctx = {
  token: PolledResource<TokenDetail>;
  solPrice: number | undefined;
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

  return (
    <TokenDetailContext value={{ token, solPrice }}>
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

function useCtx(): Ctx {
  const ctx = useContext(TokenDetailContext);
  if (!ctx) {
    throw new Error("token-detail context used outside <TokenDetailProvider>");
  }
  return ctx;
}
