"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  type PaperState,
  type Position,
  seedState,
  serialize,
  deserialize,
  applyFill,
  STORAGE_KEY,
} from "@/lib/terminal/paper/store";
import type { Fill } from "@/lib/terminal/paper/fill";

type PaperContextValue = {
  state: PaperState;
  /** Apply a fill; returns an error string to show the user, or null on success. */
  trade: (fill: Fill, meta: { mint: string; symbol: string }) => string | null;
  position: (mint: string) => Position | undefined;
  reset: () => void;
};

const PaperContext = createContext<PaperContextValue | null>(null);

/** Load persisted state once (client-only); seed on SSR or a corrupt/absent blob. */
function loadInitialState(): PaperState {
  if (typeof window === "undefined") return seedState();
  return deserialize(localStorage.getItem(STORAGE_KEY) ?? "") ?? seedState();
}

export function PaperTradeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer reads localStorage exactly once — no mount effect, no
  // setState-in-effect. SSR gets the seed; the client reconciles on first paint.
  const [state, setState] = useState<PaperState>(loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, serialize(state));
  }, [state]);

  // Cross-tab sync: the `storage` event fires only in OTHER tabs, so re-hydrating
  // from it can't loop with the write effect above. Ignore unrelated keys and
  // clears; ignore a corrupt blob (deserialize → null) rather than reseeding.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      const next = deserialize(e.newValue);
      if (next) setState(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const trade: PaperContextValue["trade"] = (fill, meta) => {
    const result = applyFill(state, fill, meta);
    if (!result.ok) return result.error;
    setState(result.state);
    return null;
  };

  const value: PaperContextValue = {
    state,
    trade,
    position: (mint) => state.positions.find((p) => p.mint === mint),
    reset: () => setState(seedState()),
  };

  return <PaperContext value={value}>{children}</PaperContext>;
}

export function usePaper(): PaperContextValue {
  const ctx = useContext(PaperContext);
  if (!ctx) throw new Error("usePaper must be used within <PaperTradeProvider>");
  return ctx;
}
