// Safety checklist (the ape.pro "0/4") derived PURELY from Jupiter's audit block.
//
// FAIL-CLOSED: a missing/unknown audit field is treated as NOT passing. A token
// that hides its authority state shouldn't be shown a reassuring green check —
// for a memecoin terminal "we couldn't confirm this is safe" must look the same
// as "this is unsafe". So every check defaults to `pass: false` unless the data
// proves otherwise.

import type { TokenAudit } from "./types";

export type SafetyCheck = {
  key: "mint" | "freeze" | "topHolders" | "devBalance";
  label: string;
  /** True only when the data affirmatively proves the safe condition. */
  pass: boolean;
  /** Human detail for the row (e.g. "Top 10 hold 34.4%"), optional. */
  detail?: string;
  /** When the underlying data was absent (renders as "—", not a red fail). */
  unknown: boolean;
};

// Thresholds for the "distribution" checks. These mirror what explorers flag as
// concentration risk; tuned conservatively (a memecoin terminal should be wary).
const TOP_HOLDERS_SAFE_MAX = 25; // top holders < 25% of supply = healthier spread
const DEV_BALANCE_SAFE_MAX = 5; // dev wallet < 5% of supply

function pct(n: number | undefined): string | undefined {
  return n === undefined ? undefined : `${n.toFixed(1)}%`;
}

/**
 * Derive the 4-item checklist from an audit block. Always returns 4 checks in a
 * stable order so the UI never reflows. `undefined` audit → all unknown.
 */
export function deriveChecklist(audit: TokenAudit | undefined): SafetyCheck[] {
  const mintKnown = audit?.mintAuthorityDisabled !== undefined;
  const freezeKnown = audit?.freezeAuthorityDisabled !== undefined;
  const topKnown = audit?.topHoldersPercentage !== undefined;
  const devKnown = audit?.devBalancePercentage !== undefined;

  return [
    {
      key: "mint",
      label: "Mint authority revoked",
      pass: audit?.mintAuthorityDisabled === true,
      unknown: !mintKnown,
    },
    {
      key: "freeze",
      label: "Freeze authority revoked",
      pass: audit?.freezeAuthorityDisabled === true,
      unknown: !freezeKnown,
    },
    {
      key: "topHolders",
      label: "Top holders not over-concentrated",
      pass:
        topKnown && (audit?.topHoldersPercentage ?? 100) < TOP_HOLDERS_SAFE_MAX,
      detail: pct(audit?.topHoldersPercentage),
      unknown: !topKnown,
    },
    {
      key: "devBalance",
      label: "Dev wallet holds a small share",
      pass: devKnown && (audit?.devBalancePercentage ?? 100) < DEV_BALANCE_SAFE_MAX,
      detail: pct(audit?.devBalancePercentage),
      unknown: !devKnown,
    },
  ];
}

/** Count of passing checks, for the "n/4" badge. */
export function checklistScore(checks: SafetyCheck[]): number {
  return checks.reduce((n, c) => (c.pass ? n + 1 : n), 0);
}
