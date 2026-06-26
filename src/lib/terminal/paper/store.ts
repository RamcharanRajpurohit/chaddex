// Paper-trade STATE MODEL — virtual balance + positions, pure reducers, and
// localStorage (de)serialization. All money is BigInt base units; we serialize
// bigints as strings because JSON can't hold BigInt.
//
// Pure & framework-free so the reducers are unit-testable without React. The
// React context (PaperTradeProvider) wraps these; it owns no math.

import { type Fill, LAMPORTS_PER_SOL } from "./fill";

export const STORAGE_KEY = "chadwallet.paper.v1";
/** Starting virtual balance: 10 SOL. */
export const SEED_LAMPORTS = 10n * LAMPORTS_PER_SOL;

export type Position = {
  mint: string;
  symbol: string;
  decimals: number;
  /** Tokens held, base units. */
  baseUnits: bigint;
  /** Total SOL spent acquiring the CURRENT holding, lamports (cost basis). */
  costLamports: bigint;
};

export type PaperState = {
  balanceLamports: bigint;
  positions: Position[];
};

export type ApplyResult =
  | { ok: true; state: PaperState }
  | { ok: false; error: string };

export function seedState(): PaperState {
  return { balanceLamports: SEED_LAMPORTS, positions: [] };
}

function findPos(state: PaperState, mint: string): Position | undefined {
  return state.positions.find((p) => p.mint === mint);
}

/**
 * Apply a fill to the state, returning a NEW state (immutable) or an error.
 * Guards (the adversarial cases):
 *  - BUY: reject if spend + fee > balance (no negative balance).
 *  - SELL: reject if selling more than held (no negative position).
 */
export function applyFill(
  state: PaperState,
  fill: Fill,
  meta: { mint: string; symbol: string },
): ApplyResult {
  const { mint, symbol } = meta;

  if (fill.side === "buy") {
    const total = fill.solLamports + fill.feeLamports;
    if (total > state.balanceLamports) {
      return { ok: false, error: "Insufficient balance" };
    }
    if (fill.tokenBaseUnits <= 0n) {
      return { ok: false, error: "Amount too small to fill" };
    }
    const existing = findPos(state, mint);
    const nextPos: Position = existing
      ? {
          ...existing,
          baseUnits: existing.baseUnits + fill.tokenBaseUnits,
          // cost basis grows by the SOL actually spent (incl. fee).
          costLamports: existing.costLamports + total,
        }
      : {
          mint,
          symbol,
          decimals: fill.decimals,
          baseUnits: fill.tokenBaseUnits,
          costLamports: total,
        };
    const positions = existing
      ? state.positions.map((p) => (p.mint === mint ? nextPos : p))
      : [...state.positions, nextPos];
    return {
      ok: true,
      state: { balanceLamports: state.balanceLamports - total, positions },
    };
  }

  // SELL
  const pos = findPos(state, mint);
  if (!pos || pos.baseUnits <= 0n) {
    return { ok: false, error: "No position to sell" };
  }
  // Symmetric with the BUY `tokenBaseUnits <= 0n` guard: never burn a position for
  // zero SOL. (Jupiter can map a degenerate quote to outAmount "0"; without this
  // the tokens would be removed and ~nothing credited.)
  if (fill.solLamports <= 0n) {
    return { ok: false, error: "Amount too small to fill" };
  }
  if (fill.tokenBaseUnits > pos.baseUnits) {
    return { ok: false, error: "Cannot sell more than you hold" };
  }
  // Reduce cost basis proportionally to the fraction sold (integer math: scale
  // before dividing to preserve precision). Selling all → remaining cost 0.
  const remainingUnits = pos.baseUnits - fill.tokenBaseUnits;
  const remainingCost =
    pos.baseUnits === 0n
      ? 0n
      : (pos.costLamports * remainingUnits) / pos.baseUnits;

  const positions =
    remainingUnits === 0n
      ? state.positions.filter((p) => p.mint !== mint) // close the position
      : state.positions.map((p) =>
          p.mint === mint
            ? { ...p, baseUnits: remainingUnits, costLamports: remainingCost }
            : p,
        );

  return {
    ok: true,
    state: {
      balanceLamports: state.balanceLamports + fill.solLamports,
      positions,
    },
  };
}

/**
 * Live unrealized P&L for a position, given the token's current USD price and the
 * current SOL/USD price (to value the SOL cost basis in USD too).
 *
 * Returns USD figures as numbers (display-layer) plus a guard for the empty/zero
 * case. Cost basis is in lamports (SOL); we convert both legs to USD so the P&L is
 * a single comparable currency.
 */
export function computePnl(
  pos: Position,
  tokenPriceUsd: number,
  solPriceUsd: number,
): { valueUsd: number; costUsd: number; pnlUsd: number; pnlPct: number | null } {
  // Value of holdings in USD: baseUnits / 10^decimals * price.
  const held = bigToFloat(pos.baseUnits, pos.decimals);
  const valueUsd = held * tokenPriceUsd;
  // Cost basis in USD: lamports → SOL → USD.
  const costSol = bigToFloat(pos.costLamports, 9);
  const costUsd = costSol * solPriceUsd;
  const pnlUsd = valueUsd - costUsd;
  // pct guarded against divide-by-zero (a free/airdropped position has cost 0).
  const pnlPct = costUsd > 0 ? (pnlUsd / costUsd) * 100 : null;
  return { valueUsd, costUsd, pnlUsd, pnlPct };
}

/**
 * Convert a bigint base-unit amount to a float for DISPLAY/valuation only. Never
 * used in the money path. Keeps full integer part precision, scales the fraction.
 */
export function bigToFloat(value: bigint, decimals: number): number {
  if (decimals <= 0) return Number(value);
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const frac = value % divisor;
  return Number(whole) + Number(frac) / Number(divisor);
}

// ── localStorage (de)serialization ────────────────────────────────────────

type SerializedPos = {
  mint: string;
  symbol: string;
  decimals: number;
  baseUnits: string;
  costLamports: string;
};
type Serialized = { balanceLamports: string; positions: SerializedPos[] };

export function serialize(state: PaperState): string {
  const out: Serialized = {
    balanceLamports: state.balanceLamports.toString(),
    positions: state.positions.map((p) => ({
      mint: p.mint,
      symbol: p.symbol,
      decimals: p.decimals,
      baseUnits: p.baseUnits.toString(),
      costLamports: p.costLamports.toString(),
    })),
  };
  return JSON.stringify(out);
}

/**
 * Parse a persisted blob → PaperState, or null if anything is off (tampered,
 * old schema, non-integer strings). The caller falls back to seedState() on null
 * — a corrupt save must never crash the terminal.
 */
export function deserialize(blob: string): PaperState | null {
  let json: unknown;
  try {
    json = JSON.parse(blob);
  } catch {
    return null;
  }
  if (typeof json !== "object" || json === null) return null;
  const obj = json as Partial<Serialized>;
  if (typeof obj.balanceLamports !== "string" || !/^\d+$/.test(obj.balanceLamports)) {
    return null;
  }
  if (!Array.isArray(obj.positions)) return null;

  const positions: Position[] = [];
  for (const p of obj.positions) {
    if (
      typeof p?.mint !== "string" ||
      typeof p?.symbol !== "string" ||
      typeof p?.decimals !== "number" ||
      typeof p?.baseUnits !== "string" ||
      typeof p?.costLamports !== "string" ||
      !/^\d+$/.test(p.baseUnits) ||
      !/^\d+$/.test(p.costLamports)
    ) {
      return null; // any bad row invalidates the whole blob → reseed
    }
    positions.push({
      mint: p.mint,
      symbol: p.symbol,
      decimals: p.decimals,
      baseUnits: BigInt(p.baseUnits),
      costLamports: BigInt(p.costLamports),
    });
  }
  try {
    return { balanceLamports: BigInt(obj.balanceLamports), positions };
  } catch {
    return null;
  }
}
