"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTokenSearch } from "@/lib/terminal/hooks";
import { formatPrice, formatChange, formatCount } from "@/lib/quotes/format";

// Header search: type any symbol/name → live Jupiter results → select to load.
// Combobox a11y: arrow keys move the active option, Enter selects, Esc closes.
export function TokenSearch({ onSelect }: { onSelect: (mint: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeRaw, setActive] = useState(0);
  const { results, loading } = useTokenSearch(query);
  const rootRef = useRef<HTMLDivElement>(null);

  // Clamp the active index into the current result range during render — so a
  // shrinking result set can't point past the end, with no reset effect.
  const active = results.length === 0 ? 0 : Math.min(activeRaw, results.length - 1);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const choose = (mint: string) => {
    onSelect(mint);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active].mint);
    }
  };

  const showList = open && query.trim().length > 0;

  return (
    <div className="relative w-full max-w-lg" ref={rootRef}>
      <SearchIcon />
      <input
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls="token-search-list"
        aria-autocomplete="list"
        placeholder="Search any token…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoComplete="off"
        className="h-10 w-full rounded-full border border-white/[0.09] bg-card pl-10 pr-4 text-[14px] text-white placeholder:text-dim transition-colors hover:border-white/20 focus:border-blue/60 focus:outline-none"
      />

      {showList && (
        <ul
          className="term-scroll absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl"
          id="token-search-list"
          role="listbox"
        >
          {loading && results.length === 0 && (
            <li className="px-3 py-4 text-center text-[13px] text-muted">Searching…</li>
          )}
          {!loading && results.length === 0 && (
            <li className="px-3 py-4 text-center text-[13px] text-muted">No tokens found</li>
          )}
          {results.map((t, i) => (
            <li
              key={t.mint}
              role="option"
              aria-selected={i === active}
              className={`grid cursor-pointer grid-cols-[28px_auto_1fr_auto] items-center gap-x-3 gap-y-0.5 rounded-xl px-3 py-2.5 ${
                i === active ? "bg-card-2" : ""
              }`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus; fire before input blur
                choose(t.mint);
              }}
            >
              {t.logoURI ? (
                <Image
                  src={t.logoURI}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 rounded-full row-span-2"
                  unoptimized
                />
              ) : (
                <span className="size-7 rounded-full bg-card-2 row-span-2" />
              )}
              <span className="text-[14px] font-bold text-white">{t.symbol}</span>
              <span className="truncate text-[12px] text-muted">{t.name}</span>
              <span className="text-right text-[13px] font-semibold tabular-nums text-white">
                {formatPrice(t.price)}
                <i
                  className={`ml-1.5 not-italic ${
                    t.change24h < 0 ? "text-red" : "text-green"
                  }`}
                >
                  {formatChange(t.change24h)}
                </i>
              </span>
              {t.holderCount !== undefined && (
                <span className="col-start-2 col-end-5 text-[11px] text-dim">
                  {formatCount(t.holderCount)} holders
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
