"use client";

import { useHolders } from "@/lib/terminal/hooks";
import { formatShare, formatCount, shortAddress } from "@/lib/quotes/format";

const SOLSCAN_ACCOUNT = "https://solscan.io/account/";

// Concentration bands → a stacked bar. Blue/white neutral chrome; the colour
// story is "how concentrated" not gain/loss, so we use a cool ramp not green/red.
// `next20` (ranks 21–40) only exists in Gecko's 4-band data — for the wallet-
// derived 3-band split it's absent, so each band carries its own value and we
// render only the ones present.
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
  const wallets = data?.topWallets ?? [];
  if (!data || (!dist && wallets.length === 0 && data.count === undefined)) {
    return <Note>Holder data unavailable for this token.</Note>;
  }

  return (
    <div className="term-scroll size-full overflow-y-auto p-5">
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

      {/* concentration breakdown — only the bands present (3 wallet-derived or 4
          from Gecko); each band reads its own value, skipping any that's absent. */}
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

      {/* Top TOKEN ACCOUNTS — getTokenLargestAccounts returns the largest token
          accounts (ATAs), which are NOT 1:1 with owner wallets (one owner can hold
          several). Labeled honestly as "accounts", not "wallets". */}
      {wallets.length > 0 ? (
        <>
          <div className="mb-2 text-eyebrow font-bold uppercase tracking-[0.1em] text-muted">
            Top accounts
          </div>
          <ul className="overflow-hidden rounded-2xl border border-white/[0.07]">
            {wallets.map((h, i) => (
              <li
                key={h.address}
                className="grid grid-cols-[2rem_1fr_auto] items-center gap-x-3 border-b border-white/[0.05] px-4 py-2.5 text-[13px] last:border-0"
              >
                <span className="tabular-nums text-dim">{i + 1}</span>
                <a
                  className="truncate font-mono text-blue hover:underline"
                  href={`${SOLSCAN_ACCOUNT}${h.address}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {shortAddress(h.address, 6, 6)}
                </a>
                <span className="font-semibold tabular-nums text-white">
                  {formatShare(h.pct ?? null)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : dist ? (
        <p className="text-[12px] leading-relaxed text-dim">
          Top token accounts need a Solana RPC key. The breakdown above is live.
        </p>
      ) : (
        // Count but no distribution/wallets → a brand-new token Gecko hasn't
        // indexed for concentration yet. Honest, not a dead "unavailable".
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
    <div className="grid size-full place-items-center p-6 text-center text-[13px] text-muted">
      {children}
    </div>
  );
}
