"use client";

import { useTrades } from "@/lib/terminal/hooks";
import { formatUsd, formatPrice, shortAddress, formatAgo } from "@/lib/quotes/format";

const SOLSCAN_TX = "https://solscan.io/tx/";

export function LiveTrades({
  mint,
  noPool,
  rateLimited = false,
  active = true,
}: {
  mint: string;
  noPool: boolean;
  rateLimited?: boolean;
  active?: boolean;
}) {
  const { data: trades, status } = useTrades(mint, active);

  if (noPool) {
    return (
      <FeedNote>
        {rateLimited
          ? "The market data provider is briefly rate-limited — trades will resume shortly."
          : "No trade feed yet — this token’s pool isn’t indexed."}
      </FeedNote>
    );
  }
  if (status === "loading" && !trades) {
    return <FeedNote>Loading trades…</FeedNote>;
  }
  if (!trades || trades.length === 0) {
    return <FeedNote>No recent trades.</FeedNote>;
  }

  return (
    <div className="flex size-full flex-col">
      <div className="grid flex-none grid-cols-[auto_auto_1fr_1fr_auto] items-center gap-x-3 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-dim">
        <span>Time</span>
        <span>Type</span>
        <span className="text-right">Price</span>
        <span className="text-right">Value</span>
        <span className="text-right">Trader</span>
      </div>
      <ul className="term-scroll min-h-0 flex-1 overflow-y-auto">
        {trades.map((t) => (
          <li
            key={t.id}
            className="grid grid-cols-[auto_auto_1fr_1fr_auto] items-center gap-x-3 px-4 py-2 text-[12px] transition-colors hover:bg-card-2"
          >
            <span className="tabular-nums text-muted">{formatAgo(t.time)}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                t.side === "buy" ? "bg-green/15 text-green" : "bg-red/15 text-red"
              }`}
            >
              {t.side}
            </span>
            <span className="text-right tabular-nums text-white">{formatPrice(t.priceUsd)}</span>
            <span className="text-right font-semibold tabular-nums text-white">{formatUsd(t.usd)}</span>
            <a
              className="truncate text-right font-mono text-muted hover:text-blue hover:underline"
              href={`${SOLSCAN_TX}${t.txHash}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {shortAddress(t.trader)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeedNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid size-full place-items-center p-6 text-center text-[13px] text-muted">
      {children}
    </div>
  );
}
