// Infer a Solana memecoin's LAUNCHPAD from its mint address.
//
// Jupiter v2 (our only token-detail source) does NOT expose a launchpad field —
// verified live against the raw token object. But the major launchpads mint with
// a deterministic vanity SUFFIX on the address (grinding the keypair so the mint
// ends in their brand), so the suffix IS the launchpad signal — the same one
// fomo.family surfaces as "Launchpad · Pump.fun". This is exact, keyless, and
// needs no extra request: it reads a field we already have (the mint).
//
// Suffixes are the publicly-documented vanity tails each launchpad grinds:
//   • Pump.fun  → ...pump
//   • LetsBonk  → ...bonk
//   • Moonshot  → ...moon
//   • Believe   → ...believe (the believe.app launchpad)
//   • Boop      → ...boop
// Unknown suffix → null (we render no Launchpad row rather than guess).

const SUFFIXES: ReadonlyArray<readonly [suffix: string, name: string]> = [
  ["pump", "Pump.fun"],
  ["bonk", "LetsBonk"],
  ["believe", "Believe"],
  ["moon", "Moonshot"],
  ["boop", "Boop"],
];

/** The launchpad that minted this token, inferred from the mint's vanity suffix,
 *  or null when the suffix matches no known launchpad. Case-insensitive. */
export function inferLaunchpad(mint: string): string | null {
  const lower = mint.toLowerCase();
  for (const [suffix, name] of SUFFIXES) {
    if (lower.endsWith(suffix)) return name;
  }
  return null;
}
