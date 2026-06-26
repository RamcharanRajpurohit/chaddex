"use client";

import Image from "next/image";
import { useBanner } from "@/lib/use-banner";
import { formatPrice, formatChange } from "@/lib/quotes/format";

// Left-rail trending list — reuses the banner's trending token set (one cached
// Jupiter call shared site-wide). Each row selects that token in the terminal.
export function TrendingRail({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (mint: string) => void;
}) {
  const { initialTokens } = useBanner();

  return (
    <div className="border-b border-border p-4">
      <h2 className="px-1 pb-3 text-eyebrow font-bold uppercase tracking-[0.1em] text-muted">
        Trending
      </h2>
      <ul className="flex flex-col gap-1">
        {initialTokens.map((t) => (
          <li key={t.mint}>
            <button
              type="button"
              className={`grid w-full grid-cols-[30px_1fr_auto] items-center gap-x-3 gap-y-0.5 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue ${
                t.mint === selected
                  ? "border border-white/[0.08] bg-card shadow-[inset_3px_0_0_var(--blue)]"
                  : "border border-transparent hover:bg-card"
              }`}
              onClick={() => onSelect(t.mint)}
              aria-current={t.mint === selected}
            >
              {t.logoURI ? (
                <Image
                  src={t.logoURI}
                  alt=""
                  width={30}
                  height={30}
                  className="size-[30px] rounded-full row-span-2"
                  unoptimized
                />
              ) : (
                <span className="size-[30px] rounded-full bg-card-2 row-span-2" />
              )}
              <span className="text-[14px] font-bold text-white">{t.symbol}</span>
              <span className="text-right text-[13px] tabular-nums text-muted">
                {formatPrice(t.price)}
              </span>
              <span
                className={`col-start-3 text-right text-[12px] font-semibold tabular-nums ${
                  t.direction === "down" ? "text-red" : "text-green"
                }`}
              >
                {formatChange(t.change24h)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
