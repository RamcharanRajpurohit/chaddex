"use client";

import { useHolders } from "@/lib/terminal/hooks";
import { formatShare, formatCount, shortAddress } from "@/lib/quotes/format";

const SOLSCAN_ACCOUNT = "https://solscan.io/account/";

// Concentration bands → a stacked bar. Blue/white neutral chrome; the colour
// story is "how concentrated" not gain/loss, so we use a cool ramp not green/red.
// `next20` (ranks 21–40) only exists in Gecko's 4-band data.
const ALL_BANDS = [
  { key: "top10", label: "Top 10", color: "var(--blue)" },
  { key: "next10", label: "11–20", color: "rgba(120,180,255,0.6)" },
  { key: "next20", label: "21–40", color: "rgba(120,180,255,0.35)" },
  { key: "rest", label: "Rest", color: "rgba(255,255,255,0.14)" },
] as const;

export function HoldersList({ mint, active = true }: { mint: string; active?: boolean }) {
  const { data, status } = useHolders(mint, active);

  if (status === "loading" && !data) {
    return <Note>Loading holders…</Note>;
  }
  const dist = data?.distribution;
  const dev = data?.developer;
  const wallets = data?.wallets ?? [];
  if (
    !data ||
    (!dist && !dev && wallets.length === 0 && (data.count === undefined || data.count === 0))
  ) {
    return <Note>Holder data unavailable for this token.</Note>;
  }

  return (
    <div className="p-5">
      {/* total count — only when we actually have a positive count (0 means the
          count source was empty; don't render a misleading "0 holders"). */}
      {data.count !== undefined && data.count > 0 && (
        <div className="mb-5 flex items-baseline gap-2">
          <span className="text-[28px] font-extrabold tracking-[-0.02em] tabular-nums text-white">
            {formatCount(data.count)}
          </span>
          <span className="text-[13px] text-muted">holders</span>
        </div>
      )}

      {/* concentration breakdown — only the bands present (3 or 4 from Gecko);
          each band reads its own value, skipping any that's absent. */}
      {dist &&
        (() => {
          const bands = ALL_BANDS.map((b) => ({ ...b, value: dist[b.key] })).filter(
            (b): b is typeof b & { value: number } => b.value !== undefined,
          );
          return (
            <div className="mb-6">
              <div className="mb-2 text-eyebrow font-bold uppercase tracking-[0.1em] text-muted">
                Distribution
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full">
                {bands.map((b) => (
                  <span
                    key={b.key}
                    style={{ width: `${b.value}%`, background: b.color }}
                    aria-hidden
                  />
                ))}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {bands.map((b) => (
                  <li key={b.key} className="flex items-center gap-2 text-[13px]">
                    <span className="size-2.5 flex-none rounded-full" style={{ background: b.color }} />
                    <span className="text-muted">{b.label}</span>
                    <span className="ml-auto font-semibold tabular-nums text-white">
                      {formatShare(b.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

      {/* Top holders — the actual per-wallet list (Alchemy getTokenLargestAccounts,
          top-20 token accounts each with its supply share). Only the largest
          accounts Solana returns; not necessarily owner wallets. */}
      {wallets.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 text-eyebrow font-bold uppercase tracking-[0.1em] text-muted">
            Top Holders
          </div>
          <ul className="flex flex-col gap-1">
            {wallets.map((w, i) => (
              <li
                key={w.address}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] odd:bg-white/[0.02]"
              >
                <span className="w-5 flex-none text-right tabular-nums text-dim">{i + 1}</span>
                <a
                  className="truncate font-mono text-blue hover:underline"
                  href={`${SOLSCAN_ACCOUNT}${w.address}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {shortAddress(w.address, 4, 4)}
                </a>
                <span className="ml-auto flex-none font-semibold tabular-nums text-white">
                  {formatShare(w.pct ?? null)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Developer / creator wallet — the keyless "who launched this" signal Gecko
          gives for every indexed token (fomo surfaces the same data). */}
      {dev ? (
        <>
          <div className="mb-2 text-eyebrow font-bold uppercase tracking-[0.1em] text-muted">
            Developer
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] px-4 py-3 text-[13px]">
            <a
              className="truncate font-mono text-blue hover:underline"
              href={`${SOLSCAN_ACCOUNT}${dev.address}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {shortAddress(dev.address, 6, 6)}
            </a>
            <span className="flex-none font-semibold tabular-nums text-white">
              holds {formatShare(dev.pct ?? null)}
            </span>
          </div>
        </>
      ) : dist ? null : (
        // Count but no distribution/dev → a brand-new token Gecko hasn't indexed
        // for concentration yet. Honest, not a dead "unavailable".
        <p className="text-[12px] leading-relaxed text-dim">
          This token is too new for a holder breakdown yet — only the total count
          is available.
        </p>
      )}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[160px] place-items-center p-6 text-center text-[13px] text-muted">
      {children}
    </div>
  );
}
