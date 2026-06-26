"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useBanner } from "@/lib/use-banner";
import { formatChange, formatPrice, tokenHref } from "@/lib/quotes/format";
import type { Token } from "@/lib/quotes/types";

// Live, clickable token ticker.
//
// Marquee = pure-CSS magicui pattern: COPIES identical full-width sequences,
// each animated translateX(0 → -100% - gap). Seamless, no JS measurement, and a
// CONSTANT --duration, so the animation is never recomputed → never jumps.
//
// THE ANTI-LOOP / ANTI-DRAG CONTRACT (from the data-layer-research workflow):
//   - The marquee DOM is rendered from `initialTokens`, which the hook commits
//     EXACTLY ONCE (seed → first live payload) then freezes → React never
//     re-renders the animated subtree → the CSS animation is never interrupted.
//   - Live price ticks flow OUT OF BAND via subscribe() and are written straight
//     into the cached DOM nodes (textContent) — NO setState, NO re-render.
//   - Child effect deps are `[]` and props are referentially STABLE (`live`
//     boolean + a stable `registry` ref). The previous runaway (79% CPU / 2.8 GB)
//     was an inline-arrow `registerRefs` prop in a child useEffect dep array,
//     minting a new closure every render → effect re-fire loop. Removed entirely.
//
// position prop supports a future top banner; only bottom is mounted now.

const COPIES = 4;

type ItemRefs = { price: HTMLSpanElement | null; change: HTMLElement | null };
type Registry = Map<string, ItemRefs>;

function TokenItem({
  token,
  live,
  registryRef,
}: {
  token: Token;
  live: boolean; // true only for copy 0 (the visible, non-aria-hidden copy)
  registryRef: RefObject<Registry>; // STABLE ref object; .current read only in effects
}) {
  const priceRef = useRef<HTMLSpanElement>(null);
  const changeRef = useRef<HTMLElement>(null);

  // Mount-once registration. DOM nodes are mount-stable and the props are stable,
  // so `[]` deps is exact — this runs once and never re-fires (no closure loop).
  // .current is read here (inside an effect), never during render.
  useEffect(() => {
    if (!live) return;
    const registry = registryRef.current;
    registry.set(token.mint, { price: priceRef.current, change: changeRef.current });
    return () => {
      registry.delete(token.mint);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <a
      href={tokenHref(token.mint)}
      className="ticker-item"
      aria-label={`${token.symbol} ${formatPrice(token.price)}, ${formatChange(token.change24h)} 24h. Open token page.`}
    >
      {token.logoURI ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="ticker-logo"
          src={token.logoURI}
          alt=""
          width={18}
          height={18}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <b>{token.symbol}</b>
      <span className="ticker-price" ref={priceRef}>
        {formatPrice(token.price)}
      </span>
      <i className={token.direction} ref={changeRef}>
        {formatChange(token.change24h)}
      </i>
    </a>
  );
}

export default function TokenBanner({
  position = "bottom",
}: {
  position?: "top" | "bottom";
}) {
  const { initialTokens, status, subscribe } = useBanner();

  // Stable ref object — identity never changes, so passing it as a prop never
  // breaks anything or re-fires child effects.
  const registry = useRef<Registry>(new Map());

  // Live ticks → patch DOM text directly. No setState → the marquee never
  // re-renders and the CSS animation is never interrupted. `subscribe` is a
  // useCallback([]) from the hook, so this effect runs once.
  useEffect(() => {
    return subscribe((tokens: Token[]) => {
      for (const t of tokens) {
        const nodes = registry.current.get(t.mint);
        if (!nodes) continue;
        if (nodes.price) nodes.price.textContent = formatPrice(t.price);
        if (nodes.change) {
          nodes.change.textContent = formatChange(t.change24h);
          nodes.change.className = t.direction; // up/down color class
        }
      }
    });
  }, [subscribe]);

  return (
    <nav
      className={`ticker ticker--${position} ticker--live`}
      aria-label="Live trending memecoins"
      data-status={status} // the ONLY React state; on the wrapper, outside the animated copies
    >
      <span className="ticker-live-dot" aria-hidden />
      <div className="ticker-viewport" aria-live="off">
        {Array.from({ length: COPIES }).map((_, copy) => (
          <div className="ticker-seq" key={copy} aria-hidden={copy > 0}>
            {initialTokens.map((t) => (
              <TokenItem
                key={`${copy}-${t.mint}`}
                token={t}
                live={copy === 0} // boolean, not a fresh function — stable prop
                registryRef={registry} // pass the ref OBJECT; .current read in child effect
              />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
