"use client";

import { useState } from "react";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useSwapQuote } from "@/lib/terminal/hooks";
import { useSelectedToken } from "../token-detail-context";
import { usePaper } from "../paper-context";
import { SOL_MINT } from "@/lib/terminal/swap-quote";
import {
  computeBuyFill,
  computeSellFill,
  solToLamports,
  tokenToBaseUnits,
  SLIPPAGE_BPS,
  FEE_BPS,
} from "@/lib/terminal/paper/fill";
import { bigToFloat } from "@/lib/terminal/paper/store";

// SOL has 9 decimals — lamports→SOL is bigToFloat(x, 9).
const SOL_DECIMALS = 9;
import { PositionPanel } from "./position-panel";

type Side = "buy" | "sell";
const SOL_PRESETS = ["0.1", "0.5", "1", "5"];

export function TradePanel({ mint }: { mint: string }) {
  const { authenticated } = usePrivy();
  const { login } = useLogin();
  const { data: token } = useSelectedToken();
  const { state, trade, position } = usePaper();
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  // EXACT base-unit override for the sell-percent buttons. A bigToFloat→string→
  // parse round-trip loses integer precision past 2^53 base units (so "100%"
  // could round above the held amount → "Cannot sell more than you hold", or
  // below → stranded dust). The percent buttons set this exact bigint and the
  // money path uses it verbatim; any manual keystroke clears it back to the
  // typed-string path. The display string stays purely cosmetic.
  const [exactBaseUnits, setExactBaseUnits] = useState<bigint | null>(null);
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);

  const pos = position(mint);
  const decimals = token?.decimals ?? 0;

  // Switching tokens must NOT carry a typed amount/exact override into the new
  // token's context (different decimals, different position). Reset DURING render
  // when the mint changes — the React-recommended "adjust state on prop change"
  // pattern (no effect, so no cascading-render lint and no flash of stale input).
  const [lastMint, setLastMint] = useState(mint);
  if (mint !== lastMint) {
    setLastMint(mint);
    setAmount("");
    setExactBaseUnits(null);
    setFlash(null);
  }

  // Manual typing always overrides any percent-button exact amount.
  const onAmountChange = (value: string) => {
    setAmount(value);
    setExactBaseUnits(null);
  };

  // Switching side reinterprets the input (SOL ⇄ token), so clear it — the same
  // "don't carry an amount into a new context" rule as the mint reset above.
  const onSideChange = (next: Side) => {
    if (next === side) return;
    setSide(next);
    setAmount("");
    setExactBaseUnits(null);
  };

  // Build the quote inputs from the side. Buy: spend SOL → token. Sell: token → SOL.
  // A sell-percent button supplies the exact base units; otherwise parse the
  // typed string (BigInt, no float).
  const amountBaseUnits =
    side === "sell" && exactBaseUnits !== null
      ? exactBaseUnits
      : side === "buy"
        ? solToLamports(amount)
        : tokenToBaseUnits(amount, decimals);

  const { quote, loading, error } = useSwapQuote({
    inputMint: side === "buy" ? SOL_MINT : mint,
    outputMint: side === "buy" ? mint : SOL_MINT,
    // For a sell, the amount is in TOKEN base units — only valid once we know the
    // token's decimals. Until detail loads, leave it empty so we don't quote with
    // the wrong (decimals=0) scale.
    amount: side === "sell" && !token ? "" : amountBaseUnits?.toString() ?? "",
    slippageBps: Number(SLIPPAGE_BPS),
  });

  const submit = () => {
    // Logged-out users can browse everything; trading is the one gated action.
    if (!authenticated) return login();
    if (!token) return setFlash({ ok: false, msg: "Token still loading" });
    if (amountBaseUnits === null || amountBaseUnits <= 0n) {
      return setFlash({ ok: false, msg: "Enter a valid amount" });
    }
    // Distinguish the three "no quote yet" causes so the message is truthful.
    if (loading) return setFlash({ ok: false, msg: "Fetching a quote — try again" });
    if (error) return setFlash({ ok: false, msg: "Couldn’t fetch a quote — try again" });
    if (!quote) return setFlash({ ok: false, msg: "No swap route for this token" });
    // Guard the debounce window: the quote lags the input by ~400ms, so it may
    // still describe a previous amount. Fill ONLY when the quote's input matches
    // what's on screen — otherwise the trade would execute a stale size.
    if (quote.inAmount !== amountBaseUnits.toString()) {
      return setFlash({ ok: false, msg: "Fetching a quote — try again" });
    }
    const fill =
      side === "buy"
        ? computeBuyFill(quote, token.decimals)
        : computeSellFill(quote, token.decimals);
    const tradeError = trade(fill, { mint, symbol: token.symbol });
    if (tradeError) return setFlash({ ok: false, msg: tradeError });
    setAmount("");
    setFlash({
      ok: true,
      msg:
        side === "buy"
          ? `Bought ${token.symbol}`
          : `Sold ${token.symbol} for ${bigToFloat(fill.solLamports, SOL_DECIMALS).toFixed(4)} SOL`,
    });
  };

  // Preview straight from the FILL math (not the raw quote): the realized amount
  // applies slippage (and, on a sell, the fee), so reading the quote's outAmount
  // directly would overstate what the user actually receives. One source of truth
  // for the preview, the balance guard, and the executed fill — they can't disagree.
  const previewFill =
    quote && token && quote.inAmount === amountBaseUnits?.toString()
      ? side === "buy"
        ? computeBuyFill(quote, token.decimals)
        : computeSellFill(quote, token.decimals)
      : null;

  const received =
    previewFill && token
      ? side === "buy"
        ? `${bigToFloat(previewFill.tokenBaseUnits, token.decimals).toLocaleString()} ${token.symbol}`
        : `${bigToFloat(previewFill.solLamports, SOL_DECIMALS).toFixed(4)} SOL`
      : "—";

  // Effective SOL debited on a buy = spend + fee (the fee is charged on top), so
  // the user sees the true cost, not just the entered amount.
  const effectiveSpendSol =
    side === "buy" && previewFill
      ? bigToFloat(previewFill.solLamports + previewFill.feeLamports, SOL_DECIMALS)
      : null;

  const balanceSol = bigToFloat(state.balanceLamports, SOL_DECIMALS);

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* paper balance — prominent glass chip (neutral; balance isn't a "gain") */}
      <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-card px-4 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-dim">
          Paper balance
        </span>
        <span className="text-[16px] font-extrabold tabular-nums text-white">
          {balanceSol.toFixed(3)} SOL
        </span>
      </div>

      {/* Buy / Sell toggle — white-outline active (Toggle B): the active side gets
          a white border + white text, inactive is muted. Matches the white CTA. */}
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Buy or sell">
        <button
          role="tab"
          aria-selected={side === "buy"}
          className={`rounded-full border py-2.5 text-[15px] font-extrabold transition-colors ${
            side === "buy"
              ? "border-white/60 text-white"
              : "border-transparent text-muted hover:text-white"
          }`}
          onClick={() => onSideChange("buy")}
        >
          Buy
        </button>
        <button
          role="tab"
          aria-selected={side === "sell"}
          className={`rounded-full border py-2.5 text-[15px] font-extrabold transition-colors ${
            side === "sell"
              ? "border-white/60 text-white"
              : "border-transparent text-muted hover:text-white"
          }`}
          onClick={() => onSideChange("sell")}
        >
          Sell
        </button>
      </div>

      {/* amount — big input in a glass card */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-dim">
          {side === "buy" ? "Spend (SOL)" : `Sell (${token?.symbol ?? "token"})`}
        </span>
        <input
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          aria-label={side === "buy" ? "Amount of SOL to spend" : "Amount of token to sell"}
          className="mt-1 w-full bg-transparent text-[28px] font-extrabold tracking-[-0.02em] tabular-nums text-white placeholder:text-dim focus:outline-none"
        />
      </div>

      {side === "buy" && (
        <div className="grid grid-cols-4 gap-2">
          {SOL_PRESETS.map((p) => (
            <button
              key={p}
              className="rounded-xl border border-border bg-card py-2 text-[13px] font-bold text-muted transition-colors hover:bg-card-2 hover:text-white"
              onClick={() => onAmountChange(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      {side === "sell" && pos && (
        <div className="grid grid-cols-3 gap-2">
          {["25", "50", "100"].map((p) => (
            <button
              key={p}
              className="rounded-xl border border-border bg-card py-2 text-[13px] font-bold text-muted transition-colors hover:bg-card-2 hover:text-white"
              onClick={() => {
                // EXACT base units (no float round-trip): 100% = the full holding,
                // so a position larger than 2^53 base units still closes cleanly.
                const exact = (pos.baseUnits * BigInt(p)) / 100n;
                setExactBaseUnits(exact);
                setAmount(bigToFloat(exact, pos.decimals).toString()); // display only
              }}
            >
              {p}%
            </button>
          ))}
        </div>
      )}

      <dl className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-[13px]">
        <div className="flex items-center justify-between">
          <dt className="text-muted">Receive</dt>
          <dd className="font-semibold tabular-nums text-white">{loading ? "…" : received}</dd>
        </div>
        {/* The 0.3% fee is charged on top of the entered SOL, so show the true
            amount debited (spend + fee) — the balance guard uses this figure. */}
        {effectiveSpendSol !== null && (
          <div className="flex items-center justify-between">
            <dt className="text-muted">Total spend</dt>
            <dd className="tabular-nums text-white">{effectiveSpendSol.toFixed(4)} SOL</dd>
          </div>
        )}
        <div className="flex items-center justify-between">
          <dt className="text-muted">Price impact</dt>
          <dd className="tabular-nums text-white">
            {quote ? `${quote.priceImpactPct.toFixed(2)}%` : "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">Fee · slippage</dt>
          <dd className="tabular-nums text-white">
            {Number(FEE_BPS) / 100}% · {Number(SLIPPAGE_BPS) / 100}%
          </dd>
        </div>
      </dl>

      {/* signature CTA — soft-white Buy / red Sell, ⚡ icon, contained width.
          Logged out → "Log in to trade" (clicking opens the Privy modal). */}
      <button
        className={`tcta mx-auto w-full max-w-[15rem] ${authenticated && side === "sell" ? "tcta--sell" : ""}`}
        onClick={submit}
        disabled={authenticated && !token}
      >
        <svg className="bolt" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
          <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" />
        </svg>
        {!authenticated
          ? "Log in to trade"
          : `${side === "buy" ? "Buy" : "Sell"} ${token?.symbol ?? ""}`}
      </button>

      {flash && (
        <p className={`text-center text-[13px] font-semibold ${flash.ok ? "text-green" : "text-red"}`} role="status">
          {flash.msg}
        </p>
      )}

      <p className="text-center text-[11px] leading-relaxed text-dim">
        Paper trading — real prices & routes, simulated fills. No real SOL spent.
      </p>

      <PositionPanel mint={mint} />
    </div>
  );
}
